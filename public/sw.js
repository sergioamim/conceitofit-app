/**
 * Service Worker — cache do app shell (imagens, ícones, fontes).
 * NÃO cacheia dados de API para garantir dados sempre atualizados.
 */

// Bump de versão (v2 → v3) pra forçar reinstall em clients que estão com SW
// antigo carregado. O v2 tinha bug em respondWith devolvendo undefined quando
// fetch falhava e o asset nao estava em cache — quebrava fluxos de auth em
// stg/prod atras de Cloudflare (fetches intermitentes nos scripts do CF
// Insights caiam no catch → TypeError: Failed to convert value to 'Response').
const CACHE_NAME = "conceito-fit-shell-v3";

const SHELL_ASSETS = [
  "/icon.svg",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/offline.html",
];

/**
 * Garante que uma Response sempre seja devolvida ao respondWith.
 * Se `cached` for undefined, devolve Response.error() — que propaga o erro
 * pro network layer em vez de explodir com TypeError no respondWith.
 */
function respondOrFallback(promise) {
  return promise.then((response) => response || Response.error());
}

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
      respondOrFallback(
        caches.match(request).then((cached) => cached || fetch(request))
      )
    );
    return;
  }

  // Network-first for navigation (HTML pages) — offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      respondOrFallback(
        fetch(request).catch(() => caches.match("/offline.html"))
      )
    );
    return;
  }

  // Network-first for everything else (JS, CSS). Se fetch falhar E o asset
  // não estiver em cache, respondOrFallback devolve Response.error() em vez
  // de undefined — deixa o consumidor tratar como network error normal.
  event.respondWith(
    respondOrFallback(fetch(request).catch(() => caches.match(request)))
  );
});
