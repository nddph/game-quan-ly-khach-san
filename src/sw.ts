/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import {
  cleanupOutdatedCaches,
  PrecacheController,
  PrecacheRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// GitHub Pages cannot emit custom response headers, so the service worker adds
// them here. Without COOP + COEP the page is not cross-origin isolated and the
// SQLite OPFS VFS refuses to install. COEP must also be present on the worker
// script response, otherwise Chromium blocks the worker of an isolated page.
const crossOriginIsolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

const withCrossOriginIsolation = (response: Response) => {
  if (response.status < 200 || response.status > 599) {
    return response
  }

  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(crossOriginIsolationHeaders)) {
    headers.set(name, value)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

const precacheController = new PrecacheController({
  plugins: [
    {
      handlerWillRespond: async ({ response }: { response: Response }) => withCrossOriginIsolation(response),
    },
  ],
})

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

precacheController.precache(self.__WB_MANIFEST)
registerRoute(new PrecacheRoute(precacheController))
cleanupOutdatedCaches()
clientsClaim()
registerRoute(new NavigationRoute(precacheController.createHandlerBoundToURL('index.html')))
// Everything else (the SQLite OPFS proxy for example) is fetched on demand, but
// a cross-origin isolated page still needs COEP on each of those responses.
registerRoute(
  ({ url }) => url.origin === self.location.origin,
  async ({ request }) => withCrossOriginIsolation(await fetch(request)),
)
