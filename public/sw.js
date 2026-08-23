/**
 * Service Worker for Communal PWA
 *
 * Caches app shell for offline use. API requests use network-first
 * strategy (fall back to cache if offline). Static assets use cache-first.
 */

const CACHE_VERSION = "communal-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// App shell — precached on install
const APP_SHELL = [
  "/",
  "/history",
  "/settings",
  "/submit",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip non-http(s) requests (e.g. chrome-extension://)
  if (!url.protocol.startsWith("http")) return;

  // API requests: network-first, fall back to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses for offline fallback
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response(
          JSON.stringify({ error: "Офлайн. Дані недоступні без інтернету." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )))
    );
    return;
  }

  // Static assets: cache-first, fall back to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
