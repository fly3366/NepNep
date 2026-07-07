import { ref } from 'vue'
import { OmniClient } from '../services/omni.service'
import { captureAudioStream, createAudioPipeline, type AudioPipeline } from '../services/audio.service'
import { log, error as logError } from '../logger'

export function useTranscription() {
  const isActive = ref(false)
  const playing = ref(false)
  const connected = ref(false)
  const logContent = ref<string[]>(['wait...'])
  const error = ref<string | null>(null)
  const sourceReady = ref(false)

  let omniClient: OmniClient | null = null
  let audioPipeline: AudioPipeline | null = null
  let animationTimer: number | null = null
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
      if (animationTimer !== null) {
        cancelAnimationFrame(animationTimer)
        animationTimer = null
      }
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
      startVisualization(audioPipeline.analyser, canvas)
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
    if (animationTimer !== null) {
      cancelAnimationFrame(animationTimer)
      animationTimer = null
    }

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

  function startVisualization(analyser: AnalyserNode, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!
    const bufLen = analyser.frequencyBinCount
    const dataArr = new Uint8Array(bufLen)
    const { width, height } = canvas
    const barWidth = (width / bufLen) * 1

    function render() {
      analyser.getByteFrequencyData(dataArr)
      ctx.clearRect(0, 0, width, height)

      let x = 0
      for (let i = 0; i < bufLen; i++) {
        const barHeight = dataArr[i]
        const r = barHeight + 25 * (i / bufLen)
        const g = 250 * (i / bufLen)
        ctx.fillStyle = `rgb(${r},${g},50)`
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)
        x += barWidth + 2
      }

      animationTimer = requestAnimationFrame(render)
    }

    animationTimer = requestAnimationFrame(render)
  }

  return { isActive, playing, connected, sourceReady, logContent, error, initSession, selectSource, stop, togglePlaying }
}
