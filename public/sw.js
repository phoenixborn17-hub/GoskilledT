/*
 * GoSkilled service worker (GPS-M5 §2.5). SECURITY-FIRST caching:
 *   • Caches ONLY immutable static assets (/_next/static/*, /icons/*) + a static offline fallback.
 *   • NEVER caches authenticated pages, API responses, or anything user-specific / PII / money / auth.
 *   • Navigations are network-first and are NEVER written to the cache (a page could be authed).
 * If in doubt, it does NOT cache. This keeps a shared device from ever serving one user's page to another.
 */
const VERSION = "gs-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Only these are safe to cache: content-hashed immutable static assets, same-origin.
function isCacheableStatic(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === "/favicon.ico")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // never touch mutations

  const url = new URL(req.url);

  // Navigations: network-first, NEVER cached (could be an authed page). Offline → static fallback.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  // Immutable static assets: cache-first (safe — same for every user, no PII).
  if (isCacheableStatic(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // EVERYTHING ELSE (API, authed data, cross-origin) → straight to network, never cached.
  // (No respondWith → the browser handles it normally, with zero caching.)
});
