declare module '*.json';
declare module '*.png';
declare module '*.jpg';

export interface NativeAPI {
    node: () => string
    chrome: () => string
    electron: () => string
}

export interface OmniSettings {
    gateway: string
    model: string
    instructions: string
}

export interface OmniAPI {
    getApiKey: () => Promise<string>
    getSettings: () => Promise<OmniSettings>
    getDefaultSettings: () => Promise<OmniSettings>
    saveSettings: (settings: Partial<OmniSettings>) => Promise<void>
    connect: (apiKey: string) => Promise<void>
    sendAudio: (b64: string) => void
    disconnect: () => void
    onEvent: (callback: (event: Record<string, any>) => void) => () => void
}

export interface CustomMediaAPI {
    getSources: () => Promise<Array<{
        label: string
        key: string
        kind: string
    }>>
    switchTop: () => void
    toggleDrm: () => void
    closeWindow: () => void
    toggleSubtitle: () => void
    toggleHistory: () => void
}

export interface NepNepHook {
    onSpacePress: (callback: (value: any) => void) => void
}

declare global {
    interface Window {
        version: NativeAPI
        customMedia: CustomMediaAPI
        omni: OmniAPI
        nepNepHook: NepNepHook
    }
}