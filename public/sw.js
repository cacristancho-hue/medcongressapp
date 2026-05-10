// Minimal service worker — offline shell + asset cache.
// Strategy:
//   - Static assets (CSS/JS/fonts) → cache-first
//   - Pages → network-first with offline fallback
//   - API routes / Supabase → never cached (always fresh)
// Versioning: bump CACHE_VERSION whenever shell shape changes.

const CACHE_VERSION = "medcongress-v1"
const STATIC_CACHE = `${CACHE_VERSION}-static`
const PAGE_CACHE = `${CACHE_VERSION}-pages`

const PRECACHE_URLS = ["/", "/login", "/registro"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)

  // Never cache anything dynamic.
  if (url.pathname.startsWith("/api/")) return
  if (url.hostname.endsWith("supabase.co")) return
  if (url.hostname.endsWith("supabase.in")) return

  // Static asset: cache-first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
            return response
          })
      )
    )
    return
  }

  // HTML pages: network-first with cached fallback for offline.
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request).then((c) => c || caches.match("/")))
    )
  }
})
