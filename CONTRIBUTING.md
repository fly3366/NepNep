# Contributing to NepNep

Thank you for your interest in contributing to NepNep! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 18 (we use Node.js 24)
- npm >= 9
- DashScope API Key (for testing real-time translation)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/fly3366/NepNep.git
cd NepNep

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development mode with hot reload |
| `npm run build` | Build production app for current platform |
| `npm run lint` | Run ESLint on all files |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
electron-main/          # Electron main process
├── index.ts            # App entry point
├── window.ts           # Window management
├── ipc.ts              # IPC handlers
├── store.ts            # State persistence
├── logger.ts           # Logging utilities
└── services/
    └── omni.relay.ts   # WebSocket relay

electron-preload/       # Preload scripts
├── preload.ts          # Main window bridge
├── preload-subtitle.ts # Subtitle window bridge
└── preload-history.ts  # History window bridge

src/                    # Vue 3 renderer
├── App.tsx             # Root component
├── components/         # UI components
├── hooks/              # Vue hooks
├── services/           # Business logic
└── types/              # TypeScript types
```

## Coding Standards

### TypeScript

- Use strict TypeScript mode
- Prefer named exports over default exports
- Use explicit types, avoid `any`

### Vue Components

- Use TSX syntax with `defineComponent`
- Keep components focused and small
- Use props for data, emits for events

### Style Guidelines

- No unnecessary comments (well-named code is self-documenting)
- Add comments only for non-obvious constraints or edge cases
- Keep lines under 100 characters

### Platform-Specific Code

Always check platform properly:

```typescript
const isMac = process.platform === 'darwin'
const isWindows = process.platform === 'win32'
const isLinux = process.platform === 'linux'
```

For Linux Wayland detection:

```typescript
const isWayland = process.env.XDG_SESSION_TYPE === 'wayland'
```

## Pull Request Process

1. **Fork and Branch**: Create a feature branch from `main`
2. **Code**: Make your changes following the coding standards
3. **Test**: Ensure tests pass (`npm run test`)
4. **Lint**: Fix any lint issues (`npm run lint:fix`)
5. **Build**: Verify build works (`npm run build`)
6. **Commit**: Use meaningful commit messages
7. **Push**: Push to your fork
8. **PR**: Create pull request with clear description

### Commit Message Format

Use conventional commits:

```
<type>: <description>

[optional body]
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Commit messages are clear
- [ ] PR description explains the change

## Reporting Issues

Use GitHub Issues for:
- Bug reports
- Feature requests
- Questions

Please include:
- OS and version (Windows/macOS/Linux)
- NepNep version
- Steps to reproduce (for bugs)
- Expected vs actual behavior

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

---

Thank you for contributing! 🎉