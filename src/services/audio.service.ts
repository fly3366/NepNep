const SAMPLE_RATE = 16000

export interface AudioPipeline {
  analyser: AnalyserNode
  stop: () => Promise<void>
}

export async function captureAudioStream(sourceId: string): Promise<MediaStream> {
  if (sourceId === 'desktop') {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // @ts-expect-error — Electron desktop capture constraint
        mandatory: {
          chromeMediaSource: 'desktop',
          sampleSize: 16,
          sampleRate: SAMPLE_RATE,
        },
      },
      video: {
        // @ts-expect-error — Electron desktop capture video constraint
        mandatory: { chromeMediaSource: 'desktop' },
      },
    })
    // We only need audio; stop the video tracks immediately
    stream.getVideoTracks().forEach((t) => t.stop())
    return stream
  }

  const [deviceId, groupId] = sourceId.split(',')
  return navigator.mediaDevices.getUserMedia({
    audio: { deviceId, groupId, sampleSize: 16, sampleRate: SAMPLE_RATE },
    video: false,
  })
}

/**
 * Builds an audio processing pipeline:
 *   MediaStream → AnalyserNode → MediaStreamDestination → PCM s16 frames → callback
 */
export function createAudioPipeline(
  stream: MediaStream,
  audioCtx: AudioContext,
  onPcmData: (data: ArrayBuffer) => void,
  shouldCapture: () => boolean,
): AudioPipeline {
  const source = audioCtx.createMediaStreamSource(stream)
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 512

  const destination = audioCtx.createMediaStreamDestination()
  destination.channelCount = 1

  source.connect(analyser)
  analyser.connect(destination)

  // @ts-expect-error — MediaStreamTrackProcessor is available in Electron/Chrome
  const processor = new MediaStreamTrackProcessor({
    track: destination.stream.getAudioTracks()[0],
  })

  processor.readable.pipeTo(
    new WritableStream({
      write: (audioData: AudioData) => {
        if (!shouldCapture()) return

        const byteLength = audioData.allocationSize({ format: 'f32-planar', planeIndex: 0 })
        const f32Buf = new ArrayBuffer(byteLength)
        audioData.copyTo(f32Buf, { format: 'f32-planar', planeIndex: 0 })

        const s16Buf = convertF32ToS16(f32Buf)
        onPcmData(s16Buf)
        audioData.close()
      },
    }),
  )

  return {
    analyser,
    stop: async () => {
      source.disconnect()
      analyser.disconnect()
      stream.getTracks().forEach((t) => t.stop())
    },
  }
}

function convertF32ToS16(f32Buffer: ArrayBuffer): ArrayBuffer {
  const f32 = new Float32Array(f32Buffer)
  const s16Buffer = new ArrayBuffer(f32.length * 2)
  const s16 = new Int16Array(s16Buffer)

  for (let i = 0; i < f32.length; i++) {
    const sample = Math.max(-1, Math.min(1, f32[i]))
    s16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }

  return s16Buffer
}
