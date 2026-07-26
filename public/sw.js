// Service worker minimal pour les notifications push navigateur (Web Push).
// Ne gère ni cache ni mode hors-ligne — uniquement l'affichage des push et
// le clic dessus (ouvre/focus l'onglet sur l'URL fournie par le backend).

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const title = payload.title || 'Tour Shop';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/favicon.ico',
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
