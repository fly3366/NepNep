import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import os from 'os'
import path from 'path'
import fs from 'fs'

// A fresh temp userData dir per test run; overridden in beforeEach.
let userDataDir = ''

// safeStorage is faked with a reversible "encryption" (base64 tag) so we can
// assert that the on-disk key is not plaintext yet round-trips correctly.
const encryptionAvailable = { value: true }
vi.mock('electron', () => ({
  app: { getPath: () => userDataDir },
  safeStorage: {
    isEncryptionAvailable: () => encryptionAvailable.value,
    encryptString: (s: string) => Buffer.from('enc:' + s, 'utf-8'),
    decryptString: (b: Buffer) => b.toString('utf-8').replace(/^enc:/, ''),
  },
}))

// Import after the mock is registered. Re-imported fresh each test via resetModules.
async function loadModule() {
  return await import('./store')
}

beforeEach(() => {
  userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nepnep-store-'))
  encryptionAvailable.value = true
  vi.resetModules()
})

afterEach(() => {
  fs.rmSync(userDataDir, { recursive: true, force: true })
})

describe('store', () => {
  it('returns empty state before anything is loaded', async () => {
    const { getState } = await loadModule()
    expect(getState()).toEqual({})
  })

  it('persists non-secret settings to state.json as plaintext', async () => {
    const { saveState } = await loadModule()
    saveState({ gateway: 'wss://example', model: 'm1', instructions: 'hi' })

    const disk = JSON.parse(fs.readFileSync(path.join(userDataDir, 'state.json'), 'utf-8'))
    expect(disk.gateway).toBe('wss://example')
    expect(disk.model).toBe('m1')
    expect(disk.instructions).toBe('hi')
  })

  it('encrypts the API key on disk but exposes plaintext in memory', async () => {
    const { saveState, getState } = await loadModule()
    saveState({ apiKey: 'sk-secret' })

    const disk = JSON.parse(fs.readFileSync(path.join(userDataDir, 'state.json'), 'utf-8'))
    expect(disk.encryptedApiKey).toBeDefined()
    expect(disk.encryptedApiKey).not.toContain('sk-secret')
    // in-memory state keeps the usable plaintext
    expect(getState().apiKey).toBe('sk-secret')
  })

  it('round-trips state across a reload, decrypting the API key', async () => {
    const first = await loadModule()
    first.saveState({ apiKey: 'sk-secret', gateway: 'wss://g', model: 'm' })

    // Simulate a fresh app launch: new module instance reads the same file.
    vi.resetModules()
    const second = await loadModule()
    const loaded = second.loadState()

    expect(loaded.apiKey).toBe('sk-secret')
    expect(loaded.gateway).toBe('wss://g')
    expect(loaded.model).toBe('m')
  })

  it('merges patches instead of replacing whole state', async () => {
    const { saveState, getState } = await loadModule()
    saveState({ gateway: 'g1' })
    saveState({ model: 'm2' })

    expect(getState().gateway).toBe('g1')
    expect(getState().model).toBe('m2')
  })

  it('returns empty state when the file is missing', async () => {
    const { loadState } = await loadModule()
    expect(loadState()).toEqual({})
  })

  it('recovers from a corrupt state file', async () => {
    fs.writeFileSync(path.join(userDataDir, 'state.json'), '{ not valid json', 'utf-8')
    const { loadState } = await loadModule()
    expect(loadState()).toEqual({})
  })

  it('never writes the plaintext key when encryption is unavailable', async () => {
    encryptionAvailable.value = false
    const { saveState } = await loadModule()
    saveState({ apiKey: 'sk-secret' })

    const raw = fs.readFileSync(path.join(userDataDir, 'state.json'), 'utf-8')
    // encryptKey falls back to '' so the secret never reaches disk in any form
    expect(raw).not.toContain('sk-secret')
    expect(JSON.parse(raw).encryptedApiKey).toBe('')
  })
})
