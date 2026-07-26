import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

// Convertit la clé VAPID publique (base64url) au format Uint8Array attendu
// par PushManager.subscribe().
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const isSupported = () => 'serviceWorker' in navigator && 'PushManager' in window;

/**
 * Gère l'abonnement aux notifications push navigateur : enregistrement du
 * service worker, demande de permission, abonnement PushManager avec la clé
 * VAPID du backend, puis envoi de l'abonnement à l'API pour stockage.
 */
export default function usePushNotifications() {
  const [permission, setPermission] = useState(isSupported() ? Notification.permission : 'unsupported');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isSupported()) return;

    navigator.serviceWorker.register('/sw.js').then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    }).catch(() => {});
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported()) return false;
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const registration = await navigator.serviceWorker.ready;
      const { data } = await api.get('/push/public-key');
      const applicationServerKey = urlBase64ToUint8Array(data.public_key);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const json = subscription.toJSON();
      await api.post('/push/subscribe', {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Erreur abonnement push:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!isSupported()) return;
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (error) {
      console.error('Erreur désabonnement push:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe, isSupported: isSupported() };
}
