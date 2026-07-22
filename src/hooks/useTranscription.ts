import { ref } from 'vue'
import { OmniClient } from '../services/omni.service'
import { captureAudioStream, createAudioPipeline, type AudioPipeline } from '../services/audio.service'
import { useVisualization } from './useVisualization'
import { log, error as logError } from '../logger'

export function useTranscription() {
  const isActive = ref(false)
  const playing = ref(false)
  const connected = ref(false)
  const logContent = ref<string[]>(['wait...'])
  const error = ref<string | null>(null)
  const sourceReady = ref(false)

  const visualization = useVisualization()

  let omniClient: OmniClient | null = null
  let audioPipeline: AudioPipeline | null = null
  let currentStream: MediaStream | null = null

  function appendLog(text: string) {
    const ts = new Date().toISOString()
    logContent.value.push(`[${ts}]: ${text}`)
  }

  /** Connect omni WS session with user-provided API key */
  async function initSession(apiKey: string) {
    if (omniClient) {
      await omniClient.close()
      omniClient = null
      connected.value = false
    }

    omniClient = new OmniClient({
      onConnected: () => {
        connected.value = true
        error.value = null
        appendLog('Session ready')
      },
      onReconnecting: (attempt, maxAttempts) => {
        connected.value = false
        error.value = `Reconnecting (${attempt}/${maxAttempts})...`
        appendLog(`[Reconnect] Attempt ${attempt}`)
      },
      onInputTranscript: (text) => {
        appendLog(`[Original] ${text}`)
      },
      onTranscriptDelta: () => {},
      onTranscriptDone: (text) => {
        appendLog(`[Translation] ${text}`)
      },
      onError: (err) => {
        logError('Omni error:', err)
        error.value = 'Connection error'
        appendLog(`[Error] ${err}`)
        setTimeout(() => { error.value = null }, 5000)
      },
      onClose: () => {
        log('Omni connection closed')
        connected.value = false
        if (isActive.value) {
          error.value = 'Connection closed'
          setTimeout(() => { error.value = null }, 5000)
        }
      },
    })

    try {
      await omniClient.connect(apiKey)
      isActive.value = true
    } catch {
      connected.value = false
      error.value = 'Connection failed'
      setTimeout(() => { error.value = null }, 5000)
    }
  }

  /** Set up audio capture + visualization (no translation yet) */
  async function selectSource(sourceId: string, audioCtx: AudioContext, canvas: HTMLCanvasElement | null): Promise<MediaStream> {
    // Stop previous pipeline if switching source
    if (audioPipeline) {
      visualization.stop()
      await audioPipeline.stop()
      audioPipeline = null
    }

    currentStream = await captureAudioStream(sourceId)

    // Build pipeline — shouldCapture gates PCM sending
    audioPipeline = createAudioPipeline(
      currentStream,
      audioCtx,
      (pcm) => omniClient?.sendAudio(pcm),
      () => playing.value,
    )

    if (canvas) {
      visualization.start(audioPipeline.analyser, canvas)
    }

    sourceReady.value = true
    appendLog('Source ready, click Play to start translation')
    return currentStream
  }

  /** Toggle translation on/off */
  function togglePlaying() {
    playing.value = !playing.value
  }

  async function stop() {
    visualization.stop()

    if (audioPipeline) {
      await audioPipeline.stop()
      audioPipeline = null
    }

    if (omniClient) {
      await omniClient.close()
      omniClient = null
    }

    currentStream = null
    isActive.value = false
    playing.value = false
    connected.value = false
    sourceReady.value = false
  }

  return { isActive, playing, connected, sourceReady, logContent, error, initSession, selectSource, stop, togglePlaying }
}
