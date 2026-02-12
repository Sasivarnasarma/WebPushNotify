const API_URL = self.location.origin.includes("localhost")
  ? "http://localhost:8000"
  : "";



self.addEventListener("push", (event) => {
  let payload = { title: "Notification", body: "You have a new message.", url: "/", image: null };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      payload = { title: "Notification", body: event.data.text(), url: "/", image: null };
    }
  }

  const options = {
    body: payload.body,
    icon: "/bell-192x192.png",
    badge: "/bell-72x72.png",
    data: { url: payload.url, id: payload.id },
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" }
    ]
  };

  if (payload.image) {
    options.image = payload.image;
  }

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  if (event.action === "dismiss") {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus().then(c => c.navigate(urlToOpen));
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
