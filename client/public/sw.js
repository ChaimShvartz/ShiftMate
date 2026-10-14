// Minimal service worker: makes the app installable and the shell load offline.
// API and socket traffic are cross-origin and never touched here.
const CACHE = "shiftmate-shell-v1";

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.add("/")).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (e) => {
    const { request } = e;
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== location.origin) return;

    // Page loads: network first, fall back to the cached shell when offline.
    if (request.mode === "navigate") {
        e.respondWith(fetch(request).then((res) => { caches.open(CACHE).then((c) => c.put("/", res.clone())); return res; }).catch(() => caches.match("/")));
        return;
    }
    // Hashed build assets and icons: cache first.
    if (url.pathname.startsWith("/assets/") || /\.(png|webmanifest)$/.test(url.pathname)) {
        e.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); return res; })));
    }
});
