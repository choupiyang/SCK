import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // 允许局域网访问
      port: parseInt(env.VITE_PORT) || 5173,
      proxy: {
        '/api': {
          target: `http://localhost:${env.PORT || 3014}`,
          changeOrigin: true,
        }
      }
    }
  }
})
