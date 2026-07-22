# AGENTS.md

This file provides guidance to AI agents (like Claude, Qoder, Cursor, etc.) working with this codebase.

## Project Overview

NepNep is a real-time speech-to-text and AI translation desktop app powered by Qwen-Omni-Realtime. It captures audio (system audio or microphone) and translates it in real-time, displaying results in a floating subtitle window.

## Architecture

### Main Process (`electron-main/`)

Electron main process handles:
- Window management (`window.ts`)
- IPC handlers (`ipc.ts`)
- WebSocket relay to Qwen-Omni API (`services/omni.relay.ts`)
- State persistence (`store.ts`)
- Platform-specific logic for macOS, Windows, Linux

### Renderer Process (`src/`)

Vue 3 + TSX frontend:
- `App.tsx` - Root component
- `components/Container.tsx` - Main app shell, audio pipeline orchestration
- `components/Toolbar.tsx` - Toolbar UI (connection, source selection, playback controls)
- `hooks/useTranscription.ts` - Core hook: session management, audio streaming
- `hooks/useMediaDevices.ts` - Media device enumeration
- `services/omni.service.ts` - WebSocket event dispatch
- `services/audio.service.ts` - Audio capture + PCM conversion

### Preload Scripts (`electron-preload/`)

Bridge between main and renderer:
- `preload.ts` - Main window
- `preload-subtitle.ts` - Subtitle window
- `preload-history.ts` - History window

## Key Technical Details

### Audio Pipeline
1. Capture via `getUserMedia()` or `getDisplayMedia()` (desktop audio)
2. Process through `AudioContext` (16kHz sample rate)
3. Convert Float32 to Int16 PCM (`audio.service.ts`)
4. Stream to WebSocket via `omni.service.ts`

### WebSocket Protocol
Connects to `wss://dashscope.aliyuncs.com/api-ws/v1/realtime` using DashScope API Key. Handles:
- Session initialization
- Audio input streaming
- Transcript events (delta, done)
- Error handling with exponential backoff reconnect

### Platform Differences
- **macOS**: Uses `setVisibleOnAllWorkspaces`, dock hide/show, media permission requests
- **Windows**: Uses `setMinimizable`, higher alwaysOnTop levels for DRM
- **Linux**: X11 vs Wayland detection (`XDG_SESSION_TYPE`), X11 needs extra DRM protection

## Build & Release

- `npm run dev` - Development mode with hot reload
- `npm run build` - Build for current platform
- `npm run lint` - ESLint check
- `npm run test` - Vitest unit tests

CI builds for:
- Windows x64/arm64 (NSIS)
- macOS x64/arm64 (DMG)
- Linux x64/arm64 (AppImage)

## Coding Guidelines

1. **TypeScript strict mode** - All code must pass `vue-tsc`
2. **No comments** unless explaining non-obvious constraints
3. **Named exports** preferred over default exports
4. **Platform checks** use `process.platform === 'darwin'/'win32'/'linux'`
5. **Window safety** - Always check `!win.isDestroyed()` before accessing `webContents`

## Common Tasks

### Adding a new IPC handler
1. Add handler in `electron-main/ipc.ts`
2. Add corresponding method in preload script
3. Use in renderer via `window.customMedia.*`

### Modifying DRM behavior
Edit `electron-main/ipc.ts`:
- `toggleDrm` handler for DRM toggle
- `applyWindowState` for new window state application

### Adding new UI component
1. Create in `src/components/`
2. Use TSX with `defineComponent`
3. Import in `Container.tsx` or `Toolbar.tsx`

## File Naming Conventions

- Electron main: `*.ts` (TypeScript)
- Renderer: `*.tsx` (TSX for Vue components)
- Styles: `*.css` in `public/styles/`
- Types: `src/types/*.ts`

## Testing

Unit tests in `src/**/*.test.ts` and `electron-main/**/*.test.ts` using Vitest. Run with `npm run test`.

Current test coverage:
- `src/services/audio.service.test.ts` - PCM conversion
- `src/services/omni.service.test.ts` - WebSocket event dispatch (OmniClient)
- `src/hooks/useMediaDevices.test.ts` - device polling composable
- `electron-main/store.test.ts` - encrypted state persistence