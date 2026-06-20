/* Service Worker：離線快取 + 漸進式每日提醒 */
const CACHE = "bully-app-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).catch(() => caches.match("./index.html")))
  );
});

/* 每日提醒（漸進增強：僅 Chrome/Edge 已安裝的 PWA 支援 periodic background sync） */
self.addEventListener("periodicsync", (e) => {
  if (e.tag === "daily-tip") {
    e.waitUntil(self.registration.showNotification("職場霸凌 · 今日自我提醒", {
      body: "打開 App 看今天的 if-then 微腳本，帶著覺察開始一天。",
      icon: "./icon-192.png"
    }));
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((cs) => {
    for (const c of cs) { if ("focus" in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow("./");
  }));
});
