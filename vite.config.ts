import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

import electron from 'vite-plugin-electron'
import electronRenderer from 'vite-plugin-electron-renderer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    electron([
      {
        entry: "electron-main/index.ts",
        vite: {
          build: {
            rollupOptions: {
              external: ['bufferutil', 'utf-8-validate'],
            },
          },
        },
      },
      {
        entry: "electron-preload/preload.ts"
      },
      {
        entry: "electron-preload/preload-subtitle.ts"
      },
      {
        entry: "electron-preload/preload-history.ts"
      }
    ]),
    electronRenderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    emptyOutDir: false,
    outDir: "dist-electron",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  }
})
