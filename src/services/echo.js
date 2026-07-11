import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import api from './api';

window.Pusher = Pusher;

let echoInstance = null;

// Authorizer custom : le backend authentifie par token Sanctum (Bearer), pas par
// session/cookie, donc on ne peut pas utiliser l'authorizer par défaut de Pusher.
// On réutilise l'instance axios partagée (même baseURL, même header Authorization).
function tokenAuthorizer(channel) {
  return {
    authorize(socketId, callback) {
      api
        .post('/broadcasting/auth', {
          socket_id: socketId,
          channel_name: channel.name,
        })
        .then((response) => callback(false, response.data))
        .catch((error) => callback(true, error));
    },
  };
}

export function getEcho() {
  if (echoInstance) return echoInstance;

  const token = localStorage.getItem('token');
  if (!token) return null;

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    wsHost: import.meta.env.VITE_PUSHER_HOST,
    wsPort: import.meta.env.VITE_PUSHER_PORT,
    wssPort: import.meta.env.VITE_PUSHER_PORT,
    forceTLS: import.meta.env.VITE_PUSHER_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    authorizer: tokenAuthorizer,
  });

  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
