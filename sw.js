const CACHE = "planner-v2";
const BASE = "/planner/";
const ASSETS = [BASE, BASE+"index.html", BASE+"manifest.json", BASE+"icon-192.png", BASE+"icon-512.png"];

self.addEventListener("install", function(e) {
  console.log("SW installing...");
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return Promise.all(ASSETS.map(function(url) {
        return c.add(url).catch(function(err) { console.warn("Cache fail:", url, err); });
      }));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  console.log("SW activated");
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request).then(function(res) {
        if (res && res.status === 200 && res.type === "basic") {
          var clone = res.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return res;
      });
    }).catch(function() {
      if (e.request.mode === "navigate") return caches.match(BASE+"index.html");
    })
  );
});
