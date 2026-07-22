<div align="center">
  <img src="logo.png" alt="NepNep Logo" width="200" height="200">
  
  <h1>NepNep</h1>
  
  <p><strong>～ Real-time cross-lingual speech translation ～</strong></p>
  
  <p>
    <em>"Hear anything, translate anything — no more language barriers."</em>
  </p>

  <p>
    <a href="README.md">简体中文</a> · <strong>English</strong>
  </p>

  <p>
    <a href="https://github.com/fly3366/NepNep/releases">
      <img src="https://img.shields.io/github/v/release/fly3366/NepNep?style=for-the-badge&label=Release&color=purple" alt="Release">
    </a>
    <a href="https://github.com/fly3366/NepNep/actions">
      <img src="https://img.shields.io/github/actions/workflow-status/fly3366/NepNep/build.yml?branch=main&style=for-the-badge&label=CI" alt="CI">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
    </a>
    <a href="https://help.aliyun.com/zh/model-studio/developer-reference/qwen-omni-realtime">
      <img src="https://img.shields.io/badge/API-Qwen--Omni-Realtime-orange?style=for-the-badge" alt="API">
    </a>
  </p>
</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎤 **Real-time audio capture** | Capture system audio or microphone input |
| 🌐 **AI real-time translation** | Powered by Qwen-Omni-Realtime — translate as you listen |
| 📺 **Floating subtitle window** | Transparent, draggable, always-on-top — perfect for watching |
| 📝 **Translation history** | Never lose a single translated line |
| 🔒 **DRM protection mode** | Prevents screen capture to protect your privacy |
| 🔄 **Smart reconnection** | Exponential backoff keeps you stable through network hiccups |
| 💻 **Cross-platform** | Windows (x64/arm64) · macOS (x64/arm64) · Linux (x64/arm64) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **DashScope API Key** — get one from [Alibaba Cloud DashScope](https://dashscope.console.aliyun.com/)

### Install & Run

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build installers
npm run build
```

---

## 📖 Usage

1. Launch NepNep
2. Enter your DashScope API Key in the toolbar and click connect (the LED turns green on success)
3. Select an audio source (system audio or microphone)
4. Click play to start real-time translation
5. Toggle the subtitle and history windows from the toolbar

---

## 🏗️ Architecture

```
electron-main/          # Main process
├── index.ts            # Entry point, single-instance lock, media permissions
├── window.ts           # Window management (main, subtitle, history)
├── ipc.ts              # IPC handlers (always-on-top, DRM, window toggles)
├── store.ts            # State persistence (encrypted API key storage)
├── logger.ts           # Development logging
└── services/
    └── omni.relay.ts   # WebSocket relay with auto-reconnect

electron-preload/       # Preload scripts
├── preload.ts          # Main window bridge
├── preload-subtitle.ts # Subtitle window bridge
└── preload-history.ts  # History window bridge

src/                    # Renderer (Vue 3 + TSX)
├── App.tsx             # Root component
├── components/
│   ├── Container.tsx   # App shell, audio pipeline orchestration
│   └── Toolbar.tsx     # Toolbar (connect, source, playback, window toggles)
├── hooks/
│   └── useTranscription.ts  # Core hook: session, audio, playback
├── services/
│   ├── omni.service.ts      # WebSocket event dispatch
│   └── audio.service.ts     # Audio capture + PCM pipeline
└── logger.ts                # Renderer logging
```

---

## 🤝 Contributing

Contributions are welcome! Let's make NepNep better together.

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [AI Agent Guide](AGENTS.md)

---

## 📜 License

[MIT](LICENSE)

---

<div align="center">
  <p><em>～ Made with 💜 by NepNep Contributors ～</em></p>
</div>
