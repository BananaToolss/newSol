import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, 'src'),
      "components": path.resolve(__dirname, 'src/components'),
      "styles": path.resolve(__dirname, 'src/styles'),
      "views": path.resolve(__dirname, 'src/views'),
      "router": path.resolve(__dirname, 'src/reouter'),
      "store": path.resolve(__dirname, 'src/store'),
      "config": path.resolve(__dirname, 'src/config'),
      "assets": path.resolve(__dirname, 'src/assets'),
      "utils": path.resolve(__dirname, 'src/utils'),
      "hooks": path.resolve(__dirname, 'src/hooks'),
      "context": path.resolve(__dirname, 'src/context'),
    }
  },
  plugins: [react(), nodePolyfills()],
  server: {
    proxy: {
      "/upload": {
        target: "https://upload.bananatools.xyz",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/upload/, ""),
      },
    },
  },
})
