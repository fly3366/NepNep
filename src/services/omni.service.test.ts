import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OmniClient, type OmniCallbacks } from './omni.service'
import type { OmniEventType } from '../types/events'

function makeCallbacks(): OmniCallbacks {
  return {
    onConnected: vi.fn(),
    onReconnecting: vi.fn(),
    onTranscriptDelta: vi.fn(),
    onTranscriptDone: vi.fn(),
    onInputTranscript: vi.fn(),
    onError: vi.fn(),
    onClose: vi.fn(),
  }
}

// Captured event handler registered via window.omni.onEvent
let eventHandler: ((event: OmniEventType) => void) | null = null
const cleanup = vi.fn()
const omniMock = {
  onEvent: vi.fn((cb: (event: OmniEventType) => void) => {
    eventHandler = cb
    return cleanup
  }),
  connect: vi.fn(async () => {}),
  sendAudio: vi.fn(),
  disconnect: vi.fn(),
}

beforeEach(() => {
  eventHandler = null
  vi.clearAllMocks()
  // @ts-expect-error — inject minimal window bridge for tests
  globalThis.window = { omni: omniMock }
})

describe('omni.service — OmniClient', () => {
  it('registers an IPC listener and reports connection on connect()', async () => {
    const cb = makeCallbacks()
    const client = new OmniClient(cb)

    await client.connect('test-key')

    expect(omniMock.onEvent).toHaveBeenCalledTimes(1)
    expect(omniMock.connect).toHaveBeenCalledWith('test-key')
    expect(cb.onConnected).toHaveBeenCalledTimes(1)
  })

  it('dispatches connection lifecycle events to callbacks', async () => {
    const cb = makeCallbacks()
    await new OmniClient(cb).connect('k')

    eventHandler!({ type: 'connection.open' })
    eventHandler!({ type: 'connection.reconnecting', attempt: 2, maxAttempts: 5 })
    eventHandler!({ type: 'connection.closed' })

    // onConnected called once by connect() + once by connection.open event
    expect(cb.onConnected).toHaveBeenCalledTimes(2)
    expect(cb.onReconnecting).toHaveBeenCalledWith(2, 5)
    expect(cb.onClose).toHaveBeenCalledTimes(1)
  })

  it('stringifies error payloads before passing to onError', async () => {
    const cb = makeCallbacks()
    await new OmniClient(cb).connect('k')

    eventHandler!({ type: 'error', error: { code: 'boom', message: 'bad' } })

    expect(cb.onError).toHaveBeenCalledWith(JSON.stringify({ code: 'boom', message: 'bad' }))
  })

  it('routes text and audio transcript deltas to onTranscriptDelta', async () => {
    const cb = makeCallbacks()
    await new OmniClient(cb).connect('k')

    eventHandler!({ type: 'response.text.delta', delta: 'hello' })
    eventHandler!({ type: 'response.audio_transcript.delta', delta: ' world' })

    expect(cb.onTranscriptDelta).toHaveBeenNthCalledWith(1, 'hello')
    expect(cb.onTranscriptDelta).toHaveBeenNthCalledWith(2, ' world')
  })

  it('routes done events, preferring text then transcript fields', async () => {
    const cb = makeCallbacks()
    await new OmniClient(cb).connect('k')

    eventHandler!({ type: 'response.text.done', text: 'final text' })
    eventHandler!({ type: 'response.audio_transcript.done', transcript: 'final transcript' })

    expect(cb.onTranscriptDone).toHaveBeenNthCalledWith(1, 'final text')
    expect(cb.onTranscriptDone).toHaveBeenNthCalledWith(2, 'final transcript')
  })

  it('routes input transcription completion to onInputTranscript', async () => {
    const cb = makeCallbacks()
    await new OmniClient(cb).connect('k')

    eventHandler!({
      type: 'conversation.item.input_audio_transcription.completed',
      transcript: 'heard this',
    })

    expect(cb.onInputTranscript).toHaveBeenCalledWith('heard this')
  })

  it('ignores speech start/stop and unknown events without throwing', async () => {
    const cb = makeCallbacks()
    await new OmniClient(cb).connect('k')

    expect(() => {
      eventHandler!({ type: 'input_audio_buffer.speech_started' })
      eventHandler!({ type: 'input_audio_buffer.speech_stopped' })
      // @ts-expect-error — simulate an unknown event type from the wire
      eventHandler!({ type: 'some.future.event' })
    }).not.toThrow()

    expect(cb.onTranscriptDelta).not.toHaveBeenCalled()
    expect(cb.onError).not.toHaveBeenCalled()
  })

  it('base64-encodes PCM buffers when sending audio', async () => {
    const cb = makeCallbacks()
    const client = new OmniClient(cb)
    await client.connect('k')

    // bytes [72,105] === "Hi" === base64 "SGk="
    const buf = new Uint8Array([72, 105]).buffer
    client.sendAudio(buf)

    expect(omniMock.sendAudio).toHaveBeenCalledWith('SGk=')
  })

  it('cleans up the listener and disconnects on close()', async () => {
    const cb = makeCallbacks()
    const client = new OmniClient(cb)
    await client.connect('k')

    await client.close()

    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(omniMock.disconnect).toHaveBeenCalledTimes(1)

    // second close is a no-op for the listener
    await client.close()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})
