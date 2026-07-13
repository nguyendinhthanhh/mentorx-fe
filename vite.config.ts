import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function contentSecurityPolicy(mode: string) {
  const devConnectSources =
    mode === 'development' ? ['http://localhost:8080', 'ws://localhost:8080', 'ws://localhost:3000'] : []
  const devImageSources = mode === 'development' ? ['http://localhost:8080'] : []
  const workerSources = mode === 'development' ? ["'self'", 'blob:'] : ["'self'"]

  return [
    "default-src 'self'",
    "script-src 'self' https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: https: ${devImageSources.join(' ')}`.trim(),
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' https: wss: ${devConnectSources.join(' ')}`.trim(),
    `worker-src ${workerSources.join(' ')}`,
    'frame-src https://accounts.google.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'mentorx-csp',
      transformIndexHtml() {
        return [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: contentSecurityPolicy(mode),
            },
            injectTo: 'head',
          },
        ]
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
}))
