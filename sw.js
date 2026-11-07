/* MINERVA – Service Worker
   App-Dateien kommen sofort aus dem Speicher und werden im Hintergrund aktualisiert
   (neue Versionen sind beim nächsten Öffnen aktiv). Schriften und Bilder werden zwischengespeichert,
   damit die App auch offline vollständig aussieht. Daten laufen nie über diesen Speicher. */
const APP = 'minerva-app-v1';
const EXTRA = 'minerva-extra-v1';
const DATEIEN = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(APP).then(function (c) { return c.addAll(DATEIEN); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== APP && k !== EXTRA; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function melden() { self.clients.matchAll().then(function (cs) { cs.forEach(function (c) { c.postMessage('neu'); }); }); }

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    const key = req.mode === 'navigate' ? './index.html' : req;
    e.respondWith(caches.open(APP).then(function (c) {
      return c.match(key, { ignoreSearch: true }).then(function (alt) {
        const neu = fetch(req, { cache: 'no-cache' }).then(function (r) {
          if (r && r.ok) {
            const kopie = r.clone();
            if (req.mode === 'navigate' && alt) Promise.all([alt.clone().text(), r.clone().text()]).then(function (t) { if (t[0] !== t[1]) melden(); });
            c.put(key, kopie);
          }
          return r;
        }).catch(function () { return alt; });
        if (alt) { e.waitUntil(neu); return alt; }
        return neu;
      });
    }));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$|image\.tmdb\.org$|media\.rawg\.io$/.test(url.hostname)) {
    e.respondWith(caches.open(EXTRA).then(function (c) {
      return c.match(req).then(function (alt) {
        return alt || fetch(req).then(function (r) { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; });
      });
    }));
  }
});
