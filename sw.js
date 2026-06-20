/* Service Worker：離線快取 + 漸進式每日提醒
   v2：HTML 改為「網路優先」，確保更新後一定看到最新頁面（離線才回退快取）。 */
const CACHE = "bully-app-v2";
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
  const req = e.request;
  if (req.method !== "GET") return;
  const accept = req.headers.get("accept") || "";
  const isHTML = req.mode === "navigate" || accept.includes("text/html");
  if (isHTML) {
    // 網路優先：永遠拿最新頁面；離線時回退到快取
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
  } else {
    // 其他靜態資源：快取優先，沒有再上網抓
    e.respondWith(caches.match(req).then((r) => r || fetch(req)));
  }
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
