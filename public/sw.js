/* Placeholder service worker file to avoid 404 in environments that probe /sw.js */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});
