// ===========================================
// CoolKids — Service Worker
// Caches static assets for offline support
// and faster repeat loads.
// ===========================================

const CACHE_NAME = "coolkids-v2";

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/events",
  "/this-weekend",
  "/venues",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install: pre-cache core pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately instead of waiting for old SW to finish
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch: network-first for navigations & API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip Chrome extension requests and other non-http(s) schemes
  if (!url.protocol.startsWith("http")) return;

  // API routes & Supabase calls: network only (always fresh data)
  if (url.pathname.startsWith("/api/") || url.hostname.includes("supabase")) {
    return;
  }

  // Navigation requests (HTML pages): network-first with cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh page for offline use
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline: serve from cache if available
          return caches.match(request).then((cached) => {
            return cached || caches.match("/");
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }
});
