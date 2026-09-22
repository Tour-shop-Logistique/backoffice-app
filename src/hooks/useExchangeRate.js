import { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Cache mémoire partagé entre tous les composants montés (une seule requête
 * réseau par paire de devises pendant la session, le backend a déjà son
 * propre cache de 24h - voir ExchangeRateService côté backend). Clé :
 * "FROM_TO", valeur : { rate, promise }.
 */
const rateCache = new Map();

const fetchRate = (from, to) => {
  const key = `${from}_${to}`;
  const cached = rateCache.get(key);
  if (cached) return cached;

  const promise = api.get('/exchange-rate', { params: { from, to } })
    .then((res) => res.data.rate)
    .catch(() => null);

  const entry = { promise };
  rateCache.set(key, entry);
  return entry;
};

/**
 * Taux de conversion de `from` vers `to` (1 unité de `from` = X unités de
 * `to`), récupéré depuis GET /exchange-rate et mis en cache mémoire côté
 * client. Retourne null tant que non chargé, ou si `from`/`to` sont
 * identiques ou manquants (aucune conversion nécessaire/possible).
 */
export const useExchangeRate = (from, to) => {
  const [rate, setRate] = useState(from && to && from === to ? 1 : null);

  useEffect(() => {
    if (!from || !to) {
      setRate(null);
      return;
    }
    if (from === to) {
      setRate(1);
      return;
    }

    let cancelled = false;
    const entry = fetchRate(from, to);
    entry.promise.then((value) => {
      if (!cancelled) setRate(value);
    });

    return () => { cancelled = true; };
  }, [from, to]);

  return rate;
};
