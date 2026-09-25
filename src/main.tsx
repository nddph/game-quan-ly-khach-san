import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

const ISOLATION_RETRY_KEY = 'hotel-management:isolation-retry'

registerSW({ immediate: true })

// The service worker injects COOP/COEP into navigations, so the very first visit
// is never cross-origin isolated and SQLite OPFS cannot start. Reload once so the
// worker is already in control before the app boots.
const needsIsolationReload = async () => {
  if (crossOriginIsolated) {
    sessionStorage.removeItem(ISOLATION_RETRY_KEY)
    return false
  }

  if (!('serviceWorker' in navigator) || sessionStorage.getItem(ISOLATION_RETRY_KEY) === 'done') {
    return false
  }

  await navigator.serviceWorker.ready
  sessionStorage.setItem(ISOLATION_RETRY_KEY, 'done')
  return true
}

const bootstrap = async () => {
  if (await needsIsolationReload()) {
    location.reload()
    return
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
