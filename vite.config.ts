import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const crossOriginIsolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// GitHub Pages serves the app from a subfolder, so every asset URL needs this prefix.
// const base = process.env.VITE_BASE_PATH || '/'

const base = process.env.NODE_ENV === 'production' ? '/just-poor-job/' : '/'
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Hotel Management',
        short_name: 'Hotel',
        description: 'Offline hotel management simulation',
        theme_color: '#0b1418',
        background_color: '#0b1418',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: `${base}favicon.svg`,
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,wasm}'],
      },
    }),
  ],
  server: {
    headers: crossOriginIsolationHeaders,
  },
  preview: {
    headers: crossOriginIsolationHeaders,
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
})
