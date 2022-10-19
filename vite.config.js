import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import GlobalPolyFill from "@esbuild-plugins/node-globals-polyfill";
import NodeModulesPolyfillPlugin from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: 'public/electron.js'
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    esbuildOptions: {
        define: {
            global: "globalThis",
        },
        plugins: [
            GlobalPolyFill({
                process: true,
                assert: true,
                buffer: true,
            }),
            NodeModulesPolyfillPlugin()
          ],
    },
  },
  resolve: {
      alias: {
          process: "process/browser",
          assert: "assert",
          stream: "stream-browserify",
          util: "util",
      },
  },
})