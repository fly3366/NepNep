import { BrowserWindow, Menu, screen } from 'electron'
import path from 'path'
import { getState, saveState } from './store'

const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'
const isWindows = process.platform === 'win32'

let mainWindow: BrowserWindow | null = null
let subtitleWindow: BrowserWindow | null = null
let historyWindow: BrowserWindow | null = null

export function getMainWindow() {
  return mainWindow
}

export function getSubtitleWindow() {
  return subtitleWindow
}

export function getHistoryWindow() {
  return historyWindow
}

export function createWindow() {
  const saved = getState().mainWindow

  mainWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, './preload.js'),
    },
    movable: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    fullscreen: false,
    closable: true,
    minHeight: 300,
    minWidth: 420,
    height: saved?.height ?? 300,
    width: saved?.width ?? 420,
    ...(saved ? { x: saved.x, y: saved.y } : {}),
    // macOS & Windows: fully frameless to hide traffic lights
    frame: false,
    thickFrame: false,
    backgroundColor: '#00000000',
    transparent: true,
  })

  mainWindow.setAlwaysOnTop(false)
  if (isMac) {
    Menu.setApplicationMenu(Menu.buildFromTemplate([]))
  } else {
    // Windows & Linux: remove menu bar
    mainWindow.removeMenu()
  }
  mainWindow.setIgnoreMouseEvents(true, { forward: true })

  mainWindow.on('close', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      saveState({ mainWindow: bounds })
    }
    destroySubtitleWindow()
    destroyHistoryWindow()
  })

  if (process.env.NODE_ENV !== 'development') {
    mainWindow.loadFile(path.join(__dirname, './index.html'))
  } else {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  }

  return mainWindow
}

export function createSubtitleWindow() {
  if (subtitleWindow) return subtitleWindow

  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize
  const defaultW = Math.round(screenW * 0.6)
  const defaultH = 140
  const saved = getState().subtitleWindow

  subtitleWindow = new BrowserWindow({
    width: saved?.width ?? defaultW,
    height: saved?.height ?? defaultH,
    x: saved?.x ?? Math.round((screenW - defaultW) / 2),
    y: saved?.y ?? (screenH - defaultH - 60),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    focusable: true,
    hasShadow: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, './preload-subtitle.js'),
    },
  })

  // Windows & Linux: remove menu bar
  if (isWindows || isLinux) subtitleWindow.removeMenu()

  if (process.env.NODE_ENV !== 'development') {
    subtitleWindow.loadFile(path.join(__dirname, './subtitle.html'))
  } else {
    subtitleWindow.loadFile(path.join(__dirname, '../public/subtitle.html'))
  }

  subtitleWindow.on('closed', () => {
    subtitleWindow = null
  })

  subtitleWindow.on('close', () => {
    if (subtitleWindow) saveState({ subtitleWindow: subtitleWindow.getBounds() })
  })

  return subtitleWindow
}

export function destroySubtitleWindow() {
  if (subtitleWindow) {
    subtitleWindow.close()
    subtitleWindow = null
  }
}

export function createHistoryWindow() {
  if (historyWindow) {
    historyWindow.focus()
    return historyWindow
  }

  const saved = getState().historyWindow

  historyWindow = new BrowserWindow({
    width: saved?.width ?? 420,
    height: saved?.height ?? 520,
    ...(saved ? { x: saved.x, y: saved.y } : {}),
    minWidth: 320,
    minHeight: 300,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a2e',
    resizable: true,
    skipTaskbar: false,
    hasShadow: true,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, './preload-history.js'),
    },
  })

  // Windows & Linux: remove menu bar
  if (isWindows || isLinux) historyWindow.removeMenu()

  if (process.env.NODE_ENV !== 'development') {
    historyWindow.loadFile(path.join(__dirname, './history.html'))
  } else {
    historyWindow.loadFile(path.join(__dirname, '../public/history.html'))
  }

  historyWindow.on('closed', () => {
    historyWindow = null
  })

  historyWindow.on('close', () => {
    if (historyWindow) saveState({ historyWindow: historyWindow.getBounds() })
  })

  return historyWindow
}

export function destroyHistoryWindow() {
  if (historyWindow) {
    historyWindow.close()
    historyWindow = null
  }
}
