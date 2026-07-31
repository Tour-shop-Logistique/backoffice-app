/**
 * Notifications systeme du navigateur (API Notification native), distinctes
 * des toasts internes a l'application — s'affichent meme si l'onglet n'est
 * pas au premier plan.
 */

/**
 * Demande la permission d'afficher des notifications si elle n'a pas encore
 * ete accordee ou refusee. A appeler une fois, au demarrage de l'app.
 */
export function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("[BrowserNotification] API Notification non supportée par ce navigateur");
    return;
  }

  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

/**
 * Affiche une notification systeme si la permission a ete accordee.
 * @param {string} title
 * @param {{ body?: string, onClick?: () => void }} options
 */
export function showBrowserNotification(title, { body, onClick } = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: "/favicon.ico",
  });

  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }
}
