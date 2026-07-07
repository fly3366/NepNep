// Omni WebSocket event types

export interface OmniEvent {
  type: string
  event_id?: string
}

export interface ConnectionOpenEvent extends OmniEvent {
  type: 'connection.open'
}

export interface ConnectionReconnectingEvent extends OmniEvent {
  type: 'connection.reconnecting'
  attempt: number
  maxAttempts: number
}

export interface ConnectionClosedEvent extends OmniEvent {
  type: 'connection.closed'
}

export interface ErrorEvent extends OmniEvent {
  type: 'error'
  error: unknown
}

export interface InputTranscriptEvent extends OmniEvent {
  type: 'conversation.item.input_audio_transcription.completed'
  transcript: string
}

export interface TranscriptDeltaEvent extends OmniEvent {
  type: 'response.text.delta' | 'response.audio_transcript.delta'
  delta: string
}

export interface TranscriptDoneEvent extends OmniEvent {
  type: 'response.text.done' | 'response.audio_transcript.done'
  text?: string
  transcript?: string
}

export interface SpeechStartedEvent extends OmniEvent {
  type: 'input_audio_buffer.speech_started'
}

export interface SpeechStoppedEvent extends OmniEvent {
  type: 'input_audio_buffer.speech_stopped'
}

export type OmniEventType = 
  | ConnectionOpenEvent
  | ConnectionReconnectingEvent
  | ConnectionClosedEvent
  | ErrorEvent
  | InputTranscriptEvent
  | TranscriptDeltaEvent
  | TranscriptDoneEvent
  | SpeechStartedEvent
  | SpeechStoppedEvent