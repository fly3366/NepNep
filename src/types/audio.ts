// Audio pipeline types

export interface AudioPipeline {
  analyser: AnalyserNode
  stop: () => Promise<void>
}

export interface AudioCaptureOptions {
  deviceId?: string
  groupId?: string
  sampleSize: number
  sampleRate: number
}

export const SAMPLE_RATE = 16000