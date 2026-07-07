/**
 * Qwen-Omni-Realtime WebSocket relay — runs in main process.
 * Handles auth, parses events, and directly updates subtitle window.
 */
import WebSocket from 'ws'
import { ipcMain } from 'electron'
import { getMainWindow, getSubtitleWindow, getHistoryWindow } from '../window'
import { getState, saveState } from '../store'
import { log, error as logError } from '../logger'

export const DEFAULT_GATEWAY = 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime'
export const DEFAULT_MODEL = 'qwen3.5-omni-flash-realtime'
export const DEFAULT_INSTRUCTIONS = 'Repeat everything you hear (including background music, movie audio, and song lyrics). Translate non-Chinese content into Chinese, maintaining contextual coherence. When hearing songs, output the original lyrics and their translation line by line.'

let ws: WebSocket | null = null
let currentTranslation = ''
let currentOrigin = ''

// Reconnect state
let lastApiKey = ''
let userDisconnect = false
let reconnectAttempt = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let pingTimer: ReturnType<typeof setInterval> | null = null
const MAX_RECONNECT = 5
const BASE_DELAY = 1000

function emitToRenderer(event: Record<string, any>) {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('omni-event', event)
  }
}

function clearTimers() {
  if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
}

function startPing() {
  clearInterval(pingTimer!)
  pingTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.ping()
    }
  }, 30_000)
}

function sendEvent(event: Record<string, unknown>) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  event.event_id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  ws.send(JSON.stringify(event))
}

function updateSubtitle(text: string, origin: string) {
  const subWin = getSubtitleWindow()
  if (!subWin || subWin.isDestroyed()) return
  subWin.webContents.send('update-subtitle', { text, origin })
}

function pushHistoryEntry(origin: string, translation: string) {
  const histWin = getHistoryWindow()
  if (!histWin || histWin.isDestroyed()) return
  histWin.webContents.send('push-entry', { origin, translation })
}

function handleOmniEvent(event: Record<string, any>) {
  const type = event.type as string

  switch (type) {
    case 'conversation.item.input_audio_transcription.completed':
      currentOrigin = event.transcript || ''
      updateSubtitle('Translating...', currentOrigin)
      break

    case 'response.text.delta':
    case 'response.audio_transcript.delta':
      currentTranslation += (event.delta || '')
      updateSubtitle(currentTranslation, currentOrigin)
      break

    case 'response.text.done':
      currentTranslation = ''
      updateSubtitle(event.text || '', currentOrigin)
      pushHistoryEntry(currentOrigin, event.text || '')
      currentOrigin = ''
      break

    case 'response.audio_transcript.done':
      currentTranslation = ''
      updateSubtitle(event.transcript || '', currentOrigin)
      pushHistoryEntry(currentOrigin, event.transcript || '')
      currentOrigin = ''
      break

    case 'error':
      logError('[OmniRelay] server error:', event.error)
      break

    default:
      break
  }

  // Still forward to renderer for logging / UI state
  emitToRenderer(event)
}

function sendSessionUpdate() {
  const instructions = getState().instructions || DEFAULT_INSTRUCTIONS
  sendEvent({
    type: 'session.update',
    session: {
      modalities: ['text'],
      instructions,
      input_audio_format: 'pcm',
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        silence_duration_ms: 400,
      },
    },
  })
}

function doConnect(apiKey: string): Promise<void> {
  const gateway = getState().gateway || DEFAULT_GATEWAY
  const model = getState().model || DEFAULT_MODEL
  const url = `${gateway}?model=${model}`

  return new Promise<void>((resolve, reject) => {
    ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    ws.on('open', () => {
      log('[OmniRelay] connected')
      reconnectAttempt = 0
      sendSessionUpdate()
      startPing()
      emitToRenderer({ type: 'connection.open' })
      resolve()
    })

    ws.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString())
        handleOmniEvent(event)
      } catch (e) {
        logError('[OmniRelay] parse error:', e)
      }
    })

    ws.on('pong', () => {
      // Server responded to ping — connection alive
    })

    ws.on('error', (err) => {
      logError('[OmniRelay] error:', err.message)
      reject(err)
    })

    ws.on('close', (code) => {
      log(`[OmniRelay] closed (code=${code})`)
      clearTimers()
      ws = null

      if (userDisconnect) {
        emitToRenderer({ type: 'connection.closed' })
        return
      }

      // Unexpected close — attempt reconnect
      if (reconnectAttempt < MAX_RECONNECT) {
        reconnectAttempt++
        const delay = BASE_DELAY * Math.pow(2, reconnectAttempt - 1)
        log(`[OmniRelay] reconnecting in ${delay}ms (attempt ${reconnectAttempt}/${MAX_RECONNECT})`)
        emitToRenderer({ type: 'connection.reconnecting', attempt: reconnectAttempt, maxAttempts: MAX_RECONNECT })
        reconnectTimer = setTimeout(() => {
          doConnect(apiKey).catch((err) => {
            logError('[OmniRelay] reconnect failed:', err.message)
          })
        }, delay)
      } else {
        log('[OmniRelay] max reconnect attempts reached')
        emitToRenderer({ type: 'connection.closed' })
      }
    })
  })
}

export function registerOmniHandlers() {
  ipcMain.handle('omni.connect', async (_e, apiKey: string) => {
    userDisconnect = false
    reconnectAttempt = 0
    clearTimers()

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
      ws = null
    }

    // Persist apiKey for next launch
    lastApiKey = apiKey
    saveState({ apiKey })

    await doConnect(apiKey)
  })

  ipcMain.on('omni.audio', (_e, b64Audio: string) => {
    sendEvent({
      type: 'input_audio_buffer.append',
      audio: b64Audio,
    })
  })

  ipcMain.on('omni.disconnect', () => {
    userDisconnect = true
    clearTimers()
    reconnectAttempt = 0
    if (ws) {
      ws.close()
      ws = null
    }
    currentTranslation = ''
    currentOrigin = ''
  })
}
