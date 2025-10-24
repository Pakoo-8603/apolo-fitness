import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET?.trim()

  return {
    base: '/',
    plugins: [ vue() ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: proxyTarget
      ? {
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
            }
          }
        }
      : undefined
  }
})
