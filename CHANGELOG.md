# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- English README and repository metadata (`repository`, `bugs`, `homepage`, `keywords`, `engines`).
- `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, Dependabot config, and issue-template chooser config.
- `.nvmrc` pinning the Node.js version used by CI.

### Fixed
- Removed a duplicate `nsis` block in `package.json` and an invalid `multiArchInstaller` option that broke `electron-builder` config validation.
- Moved `esbuild` from runtime `dependencies` to `devDependencies` (build-time only).
- Removed a dead `css.postcss` reference in `vite.config.ts` left over from the Tailwind removal.
- Corrected the development command in the README (`npm run dev` instead of `npm run build`).

## [0.1.0] - 2026-07-07

### Added
- Real-time audio capture from system audio or microphone.
- AI real-time translation powered by Qwen-Omni-Realtime over WebSocket.
- Floating, draggable, always-on-top subtitle window.
- Translation history window.
- DRM protection mode to prevent screen capture (platform-specific handling).
- Smart reconnection with exponential backoff.
- Cross-platform support: Windows (x64/arm64), macOS (x64/arm64), Linux (x64/arm64).
- AppImage packaging for Linux and NSIS installer for Windows.
- GitHub Actions CI/CD with multi-platform builds and automated releases.
- Global shortcut (Space+X) to toggle play/pause.
- Unit tests for the audio PCM conversion pipeline.
- Open-source project docs: `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, issue/PR templates.

### Changed
- Upgraded to Electron 43, Vite 8, and Node.js 24 (CI).
- Removed Tailwind CSS in favor of plain custom CSS.
- Standardized release artifact naming to include OS and architecture.

[Unreleased]: https://github.com/fly3366/NepNep/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/fly3366/NepNep/releases/tag/v0.1.0
