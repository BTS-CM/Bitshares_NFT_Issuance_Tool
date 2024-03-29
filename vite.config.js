import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: 'public/electron.js',
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          assert: true,
          buffer: true,
        }),
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
});
