self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("push", (event) => {
  let payload = { title: "Better You", body: "A gentle reminder for you.", url: "/", vibrate: [180, 90, 180] };
  try { if (event.data) payload = { ...payload, ...event.data.json() }; } catch (error) { /* keep defaults */ }
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: payload.tag || "better-you",
    renotify: true,
    requireInteraction: true,
    vibrate: payload.vibrate || [180, 90, 180],
    data: { url: payload.url || "/" },
    actions: [{ action: "open", title: "Open Better You" }],
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const client of list) { if ("focus" in client) return client.focus(); }
    return self.clients.openWindow(event.notification.data?.url || "/");
  }));
});
