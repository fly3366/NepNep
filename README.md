<div align="center">
  <img src="logo.png" alt="NepNep Logo" width="200" height="200">
  
  <h1>NepNep</h1>
  
  <p><strong>～ 跨次元实时语音翻译神器 ～</strong></p>
  
  <p>
    <em>"听到什么，翻译什么，二次元的羁绊从此不再有语言障碍"</em>
  </p>

  <p>
    <a href="https://github.com/fly3366/NepNep/releases">
      <img src="https://img.shields.io/github/v/release/fly3366/NepNep?style=for-the-badge&label=Release&color=purple" alt="Release">
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

## ✨ 特性

| 特性 | 说明 |
|------|------|
| 🎤 **实时音频捕获** | 系统音频 / 麦克风，想听什么就捕获什么 |
| 🌐 **AI 实时翻译** | 基于 Qwen-Omni-Realtime，边说边译 |
| 📺 **悬浮字幕窗口** | 透明、可拖动、始终置顶，观影神器 |
| 📝 **翻译历史记录** | 每一句翻译都不会丢失 |
| 🔒 **DRM 保护模式** | 防止录屏截图，保护你的隐私 |
| 🔄 **智能重连** | 指数退避策略，网络波动也能稳定运行 |
| 💻 **跨平台** | Windows & macOS 都能用 |

---

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18
- **DashScope API Key** — 去 [阿里云 DashScope](https://dashscope.console.aliyun.com/) 获取

### 安装运行

```bash
# 安装依赖
npm install

# 开发模式
npm run build

# 构建安装包
npm run build
```

---

## 📖 使用方法

1. 启动 NepNep
2. 在工具栏输入 DashScope API Key，点击连接按钮（LED 变绿表示成功）
3. 选择音频源（系统音频或麦克风）
4. 点击播放开始实时翻译
5. 从工具栏切换字幕窗口和历史窗口

---

## 🏗️ 项目架构

```
electron-main/          # 主进程
├── index.ts            # 入口，单实例锁，媒体权限
├── window.ts           # 窗口管理（主窗口、字幕、历史）
├── ipc.ts              # IPC 处理（置顶、DRM、窗口切换）
├── store.ts            # 状态持久化（加密存储 API Key）
├── logger.ts           # 开发日志
└── services/
    └── omni.relay.ts   # WebSocket 中继，自动重连

electron-preload/       # 预加载脚本
├── preload.ts          # 主窗口桥接
├── preload-subtitle.ts # 字幕窗口桥接
└── preload-history.ts  # 历史窗口桥接

src/                    # 渲染进程 (Vue 3 + TSX)
├── App.tsx             # 根组件
├── components/
│   ├── Container.tsx   # 应用外壳，音频管道编排
│   └── Toolbar.tsx     # 工具栏（连接、音源、播放、窗口切换）
├── hooks/
│   └── useTranscription.ts  # 核心 hook：会话、音频、播放
├── services/
│   ├── omni.service.ts      # WebSocket 事件分发
│   └── audio.service.ts     # 音频捕获 + PCM 管道
└── logger.ts                # 渲染端日志
```

---

## 🤝 贡献

欢迎 PR！让我们一起让 NepNep 更好～

---

## 📜 许可证

[MIT](LICENSE)

---

<div align="center">
  <p><em>～ Made with 💜 by NepNep Contributors ～</em></p>
</div>