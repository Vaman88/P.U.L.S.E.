import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiProxy = {
    '/api/': {
      target: env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
      changeOrigin: true,
    },
    '/docs': {
      target: env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
      changeOrigin: true,
    },
    '/redoc': {
      target: env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
      changeOrigin: true,
    },
    '/api-doc-assets/': {
      target: env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
      changeOrigin: true,
    },
    '/openapi.json': {
      target: env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: apiProxy,
    },
    preview: {
      host: '0.0.0.0',
      port: 3141,
      proxy: apiProxy,
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
  }
})
