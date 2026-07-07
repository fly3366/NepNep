import { ipcMain, BrowserWindow, app } from 'electron'
import { getMainWindow, getSubtitleWindow, getHistoryWindow, createSubtitleWindow, destroySubtitleWindow, createHistoryWindow, destroyHistoryWindow } from './window'
import { registerOmniHandlers, DEFAULT_GATEWAY, DEFAULT_MODEL, DEFAULT_INSTRUCTIONS } from './services/omni.relay'
import { getState, saveState } from './store'

let isOnTop = false
let isDrmOn = false
let isSubtitleOn = false
let isHistoryOn = false

export function registerIpcHandlers() {
  ipcMain.handle('getApiKey', () => {
    return getState().apiKey || ''
  })

  ipcMain.handle('getSettings', () => {
    const s = getState()
    return {
      gateway: s.gateway || DEFAULT_GATEWAY,
      model: s.model || DEFAULT_MODEL,
      instructions: s.instructions || DEFAULT_INSTRUCTIONS,
    }
  })

  ipcMain.handle('getDefaultSettings', () => ({
    gateway: DEFAULT_GATEWAY,
    model: DEFAULT_MODEL,
    instructions: DEFAULT_INSTRUCTIONS,
  }))

  ipcMain.handle('saveSettings', (_e, settings: { gateway?: string; model?: string; instructions?: string }) => {
    saveState({
      gateway: settings.gateway || undefined,
      model: settings.model || undefined,
      instructions: settings.instructions || undefined,
    })
  })

  function allWindows(): BrowserWindow[] {
    return [getMainWindow(), getSubtitleWindow(), getHistoryWindow()]
      .filter((w): w is BrowserWindow => w != null && !w.isDestroyed())
  }

  ipcMain.on('switchTop', () => {
    isOnTop = !isOnTop
    const level = process.platform === 'darwin' ? 'screen-saver' : 'floating'
    allWindows().forEach((w) => w.setAlwaysOnTop(isOnTop, level))
  })

  ipcMain.on('toggleDrm', () => {
    isDrmOn = !isDrmOn
    allWindows().forEach((w) => {
      w.setContentProtection(isDrmOn)
      w.setSkipTaskbar(isDrmOn)
      if (process.platform === 'darwin') {
        w.setVisibleOnAllWorkspaces(isDrmOn, { visibleOnFullScreen: true })
      } else {
        // Windows-specific: prevent minimizing and use higher always-on-top during DRM
        w.setMinimizable(!isDrmOn)
        w.setAlwaysOnTop(isDrmOn ? true : isOnTop, isDrmOn ? 'modal-panel' : 'floating')
      }
    })
    if (process.platform === 'darwin' && app.dock) {
      if (isDrmOn) app.dock.hide()
      else app.dock.show()
    }
  })

  ipcMain.on('closeWindow', () => {
    getMainWindow()?.close()
  })

  ipcMain.on('set-ignore-mouse', (_e, ignore: boolean) => {
    const win = getMainWindow()
    if (!win) return
    if (ignore) {
      win.setIgnoreMouseEvents(true, { forward: true })
    } else {
      win.setIgnoreMouseEvents(false)
    }
  })

  function applyWindowState(win: BrowserWindow) {
    const level = process.platform === 'darwin' ? 'screen-saver' : 'floating'
    win.setAlwaysOnTop(isOnTop, level)
    win.setContentProtection(isDrmOn)
    win.setSkipTaskbar(isDrmOn)
    if (process.platform === 'darwin') {
      win.setVisibleOnAllWorkspaces(isDrmOn, { visibleOnFullScreen: true })
    } else if (isDrmOn) {
      // Windows-specific DRM: prevent minimizing and use higher always-on-top
      win.setMinimizable(false)
      win.setAlwaysOnTop(true, 'modal-panel')
    }
  }

  ipcMain.on('toggleSubtitle', () => {
    isSubtitleOn = !isSubtitleOn
    if (isSubtitleOn) {
      const w = createSubtitleWindow()
      applyWindowState(w)
    } else {
      destroySubtitleWindow()
    }
  })

  ipcMain.on('toggleHistory', () => {
    isHistoryOn = !isHistoryOn
    if (isHistoryOn) {
      const w = createHistoryWindow()
      applyWindowState(w)
    } else {
      destroyHistoryWindow()
    }
  })

  // Register Qwen-Omni-Realtime WebSocket relay
  registerOmniHandlers()
}
