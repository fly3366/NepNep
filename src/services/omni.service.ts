/**
 * Qwen-Omni-Realtime client — renderer side.
 * Communicates with main process OmniRelay via IPC.
 */

export interface OmniCallbacks {
  onConnected: () => void
  onReconnecting: (attempt: number, maxAttempts: number) => void
  onTranscriptDelta: (delta: string) => void
  onTranscriptDone: (text: string) => void
  onInputTranscript: (text: string) => void
  onError: (err: string) => void
  onClose: () => void
}

export class OmniClient {
  private callbacks: OmniCallbacks
  private cleanupListener: (() => void) | null = null

  constructor(callbacks: OmniCallbacks) {
    this.callbacks = callbacks
  }

  async connect(apiKey: string): Promise<void> {
    // Register IPC listener for events from main process
    this.cleanupListener = window.omni.onEvent((event: Record<string, any>) => {
      this.handleEvent(event)
    })

    await window.omni.connect(apiKey)
    this.callbacks.onConnected()
  }

  sendAudio(pcmBuffer: ArrayBuffer) {
    // Convert to base64 and send via IPC
    const bytes = new Uint8Array(pcmBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const b64 = btoa(binary)
    window.omni.sendAudio(b64)
  }

  private handleEvent(event: Record<string, any>) {
    const type = event.type as string

    switch (type) {
      case 'connection.open':
        this.callbacks.onConnected()
        break

      case 'connection.reconnecting':
        this.callbacks.onReconnecting(event.attempt, event.maxAttempts)
        break

      case 'connection.closed':
        this.callbacks.onClose()
        break

      case 'error':
        this.callbacks.onError(JSON.stringify(event.error))
        break

      case 'conversation.item.input_audio_transcription.completed':
        this.callbacks.onInputTranscript(event.transcript || '')
        break

      case 'response.text.delta':
        this.callbacks.onTranscriptDelta(event.delta || '')
        break

      case 'response.text.done':
        this.callbacks.onTranscriptDone(event.text || '')
        break

      case 'response.audio_transcript.delta':
        this.callbacks.onTranscriptDelta(event.delta || '')
        break

      case 'response.audio_transcript.done':
        this.callbacks.onTranscriptDone(event.transcript || '')
        break

      case 'input_audio_buffer.speech_started':
        break

      case 'input_audio_buffer.speech_stopped':
        break

      default:
        break
    }
  }

  async close() {
    if (this.cleanupListener) {
      this.cleanupListener()
      this.cleanupListener = null
    }
    window.omni.disconnect()
  }
}
