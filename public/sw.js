/**
 * Service Worker — cache do app shell (imagens, ícones, fontes).
 * NÃO cacheia dados de API para garantir dados sempre atualizados.
 */

const CACHE_NAME = "conceito-fit-shell-v2";

const SHELL_ASSETS = [
  "/icon.svg",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never cache API requests or non-GET
  if (
    request.method !== "GET" ||
    request.url.includes("/api/") ||
    request.url.includes("/_next/data/")
  ) {
    return;
  }

  // Cache-first for static assets (images, fonts, icons)
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.url.endsWith(".svg") ||
    request.url.endsWith(".png")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Network-first for navigation (HTML pages) — offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Network-first for everything else (JS, CSS)
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
