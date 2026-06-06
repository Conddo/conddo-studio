// Conddo Studio — minimal service worker.
//
// Reason this file exists: Chrome / Edge / Android refuse to fire the
// "Install app" prompt unless the page has a registered service worker
// that responds to fetch. Without this, the manifest alone gets you iOS
// Add-to-Home but no install banner anywhere else.
//
// Strategy:
//   - SHELL (root, icon, manifest, /_next/static/*) — cache-first.
//     First paint stays fast on flaky connections.
//   - Everything else (Studio API calls, dynamic Next routes) —
//     network-first; cache only as a hard-offline fallback so we don't
//     serve stale jobs/QA data.
//   - POSTs and cross-origin requests pass through untouched. We never
//     replay job lifecycle mutations or serve stale build artefacts.
//
// Bump CACHE_VERSION whenever shipping a CSS / icon / manifest change
// that needs to land promptly on existing installed clients.

const CACHE_VERSION = "studio-shell-v1";
const SHELL = ["/", "/conddo_icon.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isShell = SHELL.includes(url.pathname) || url.pathname.startsWith("/_next/static/");
  if (isShell) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        return res;
      })),
    );
    return;
  }

  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((c) => c ?? Response.error())),
  );
});
