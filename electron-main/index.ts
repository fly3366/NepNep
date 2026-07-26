import { app, BrowserWindow, systemPreferences, globalShortcut } from 'electron'
import { createWindow, getMainWindow } from './window'
import { registerIpcHandlers } from './ipc'
import { loadState } from './store'
import { log, warn } from './logger'

function makeSingleInstance(): boolean {
  if (process.mas) return true
  if (!app.requestSingleInstanceLock()) {
    // Another instance already holds the lock — quit this one.
    app.quit()
    return false
  }
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
  return true
}

async function checkMediaAccess() {
  if (process.platform !== 'darwin') return

  for (const media of ['camera', 'microphone'] as const) {
    const status = systemPreferences.getMediaAccessStatus(media)
    log(`media access [${media}]: ${status}`)
    if (status !== 'granted') {
      await systemPreferences.askForMediaAccess(media)
    }
  }
  const screenStatus = systemPreferences.getMediaAccessStatus('screen')
  log(`media access [screen]: ${screenStatus}`)
}

async function init() {
  if (!makeSingleInstance()) return
  await checkMediaAccess()
  registerIpcHandlers()

  app.whenReady().then(() => {
    loadState()
    createWindow()

    // Register global shortcut for Space+X to toggle play/pause
    const ret = globalShortcut.register('Space+X', () => {
      const win = getMainWindow()
      if (win && !win.isDestroyed()) {
        win.webContents.send('nepnep:space', -1)
        log('Space+X pressed')
      }
    })
    if (!ret) {
      warn('globalShortcut registration failed')
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
    log('globalShortcut unregistered')
  })

  app.on('render-process-gone', (_event, _webContents, details) => {
    warn('render-process-gone', details)
  })

  app.on('child-process-gone', (_event, details) => {
    warn('child-process-gone', details)
  })
}

init().then(() => log('boot done.'))