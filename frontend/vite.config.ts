import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    // Saat VITE_USE_MOCK=false, request /api diteruskan ke backend Go
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
  },
})
