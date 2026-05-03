import { defineConfig } from 'vite'
import { geaPlugin } from '@geajs/vite-plugin'
import { resolve } from 'node:path'

const REPO_ROOT = resolve(__dirname, '../..')

export default defineConfig({
  plugins: [geaPlugin()],
  optimizeDeps: {
    exclude: ['@geajs/core', '@geajs/core/compiler-runtime', '@gea-flow/core'],
  },
  resolve: {
    alias: {
      '@gea-flow/core/styles.css': resolve(__dirname, '../core/src/styles.css'),
      '@gea-flow/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    fs: {
      allow: [REPO_ROOT],
    },
  },
})
