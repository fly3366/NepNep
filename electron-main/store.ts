/**
 * Lightweight JSON state persistence.
 * Stores to {userData}/state.json — survives app restarts.
 * API key is encrypted via Electron safeStorage.
 */
import { app, safeStorage } from 'electron'
import path from 'path'
import fs from 'fs'
import { error as logError } from './logger'

export interface AppState {
  apiKey?: string
  gateway?: string
  model?: string
  instructions?: string
  mainWindow?: { x: number; y: number; width: number; height: number }
  subtitleWindow?: { x: number; y: number; width: number; height: number }
  historyWindow?: { x: number; y: number; width: number; height: number }
}

/** On-disk format: apiKey stored as encrypted base64 */
interface DiskState {
  encryptedApiKey?: string
  gateway?: string
  model?: string
  instructions?: string
  mainWindow?: AppState['mainWindow']
  subtitleWindow?: AppState['subtitleWindow']
  historyWindow?: AppState['historyWindow']
}

const statePath = path.join(app.getPath('userData'), 'state.json')

let state: AppState = {}

function decryptKey(encrypted: string): string {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    }
  } catch { /* fall through */ }
  return ''
}

function encryptKey(plain: string): string {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.encryptString(plain).toString('base64')
    }
  } catch { /* fall through */ }
  return ''
}

export function loadState(): AppState {
  try {
    if (fs.existsSync(statePath)) {
      const disk: DiskState = JSON.parse(fs.readFileSync(statePath, 'utf-8'))
      state = {
        gateway: disk.gateway,
        model: disk.model,
        instructions: disk.instructions,
        mainWindow: disk.mainWindow,
        subtitleWindow: disk.subtitleWindow,
        historyWindow: disk.historyWindow,
      }
      if (disk.encryptedApiKey) {
        state.apiKey = decryptKey(disk.encryptedApiKey)
      }
    }
  } catch {
    state = {}
  }
  return state
}

export function getState(): AppState {
  return state
}

export function saveState(patch: Partial<AppState>) {
  Object.assign(state, patch)
  try {
    const disk: DiskState = {
      gateway: state.gateway,
      model: state.model,
      instructions: state.instructions,
      mainWindow: state.mainWindow,
      subtitleWindow: state.subtitleWindow,
      historyWindow: state.historyWindow,
    }
    if (state.apiKey) {
      disk.encryptedApiKey = encryptKey(state.apiKey)
    }
    fs.writeFileSync(statePath, JSON.stringify(disk, null, 2), 'utf-8')
  } catch (e) {
    logError('[Store] failed to save state:', e)
  }
}
