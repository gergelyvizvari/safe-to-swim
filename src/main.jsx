import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './CatalogueApp.jsx'
import './styles.css'

async function startApp() {
  // A production preview can leave a worker on the same origin as Vite.
  // Remove it before rendering so cached modules cannot mix React runtimes.
  if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    const workerUrl = new URL('/sw.js', window.location.origin).href
    const controlledByApp = navigator.serviceWorker.controller?.scriptURL === workerUrl
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations
      .filter((registration) => [registration.active, registration.waiting, registration.installing]
        .some((worker) => worker?.scriptURL === workerUrl))
      .map((registration) => registration.unregister()))
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key.startsWith('safe-to-swim-')).map((key) => caches.delete(key)))
    }
    if (controlledByApp) {
      window.location.reload()
      return
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
      <Analytics />
    </StrictMode>,
  )
}

startApp()

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
