import { defineConfig } from 'vite'
import { geaPlugin } from '@geajs/vite-plugin'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    geaPlugin(),
    dts({ rollupTypes: true, include: ['src/**/*'] }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@geajs/core', '@xyflow/system'],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
  },
})
