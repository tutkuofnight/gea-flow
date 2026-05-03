import { defineConfig } from 'vite'
import { geaPlugin } from '@geajs/vite-plugin'
import { resolve } from 'node:path'

const REPO_ROOT = resolve(__dirname, '../..')

export default defineConfig({
  plugins: [geaPlugin()],
  // Skip Vite's prebundling for these — the gea-plugin needs raw module paths
  // (its compiler-runtime resolver can't see through Vite's prebundled chunk).
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
    port: 5173,
    fs: {
      allow: [REPO_ROOT],
    },
  },
})
