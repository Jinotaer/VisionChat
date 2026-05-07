import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const serverUrl = env.VITE_SERVER_URL || 'http://localhost:5000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: serverUrl,
          changeOrigin: true,
        },
        '/socket.io': {
          target: serverUrl,
          changeOrigin: true,
          ws: true,
        },
        '/health': {
          target: serverUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
