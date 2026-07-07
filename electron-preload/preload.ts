import { contextBridge, ipcRenderer } from 'electron'

ipcRenderer.on('crash-file-path', (_event, args) => {
  if (process.env.NODE_ENV === 'development') console.warn('crash-file-path:', args)
})

// ── Bridge: nepNepHook ──
contextBridge.exposeInMainWorld('nepNepHook', {
  onSpacePress: (callback: (value: any) => void) =>
    ipcRenderer.on('nepnep:space', (_event, value) => callback(value)),
})

// ── Bridge: version ──
contextBridge.exposeInMainWorld('version', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
})

// ── Bridge: omni ──
contextBridge.exposeInMainWorld('omni', {
  getApiKey: () => ipcRenderer.invoke('getApiKey'),
  getSettings: () => ipcRenderer.invoke('getSettings'),
  getDefaultSettings: () => ipcRenderer.invoke('getDefaultSettings'),
  saveSettings: (settings: { gateway?: string; model?: string; instructions?: string }) =>
    ipcRenderer.invoke('saveSettings', settings),
  connect: (apiKey: string) => ipcRenderer.invoke('omni.connect', apiKey),
  sendAudio: (b64: string) => ipcRenderer.send('omni.audio', b64),
  disconnect: () => ipcRenderer.send('omni.disconnect'),
  onEvent: (callback: (event: any) => void) => {
    const handler = (_e: any, event: any) => callback(event)
    ipcRenderer.on('omni-event', handler)
    return () => ipcRenderer.removeListener('omni-event', handler)
  },
})

// ── Bridge: customMedia ──
contextBridge.exposeInMainWorld('customMedia', {
  getSources: async () => {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.map((d) => ({
      label: d.label,
      key: `${d.deviceId},${d.groupId}`,
      kind: d.kind,
    }))
  },
  switchTop: () => ipcRenderer.send('switchTop'),
  toggleDrm: () => ipcRenderer.send('toggleDrm'),
  closeWindow: () => ipcRenderer.send('closeWindow'),
  toggleSubtitle: () => ipcRenderer.send('toggleSubtitle'),
  toggleHistory: () => ipcRenderer.send('toggleHistory'),
})

// ── Click-through for transparent areas ──
let isIgnoring = true
window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('mousemove', (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const overContent = el !== null && el !== document.documentElement && el !== document.body
    if (overContent && isIgnoring) {
      ipcRenderer.send('set-ignore-mouse', false)
      isIgnoring = false
    } else if (!overContent && !isIgnoring) {
      ipcRenderer.send('set-ignore-mouse', true)
      isIgnoring = true
    }
  })
})