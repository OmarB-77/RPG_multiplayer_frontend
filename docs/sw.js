// Service worker: rete prima, copia in cache come ripiego. Supabase e CDN non vengono mai messi in cache.
const CACHE = "cdm-v1";
const SHELL = [
  "./",
  "index.html",
  "login.html",
  "cambia-password.html",
  "admin-utenti.html",
  "campagna.html",
  "css/style.css",
  "js/config.js",
  "js/auth.js",
  "js/pwa.js",
  "icons/icon.svg",
  "manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))
      )
  );
});
