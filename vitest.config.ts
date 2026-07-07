import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'electron-main/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'dist-electron', 'release'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'electron-main/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'electron-main/**/*.test.ts', 'src/types/**'],
    },
  },
})