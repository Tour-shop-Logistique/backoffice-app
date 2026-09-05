/**
 * Autocomplétion de villes par pays, pour assister la saisie de "ville
 * d'arrivée" sur un tarif DHD (backoffice). API externe gratuite countries.dev
 * (endpoint /places, filtre par code ISO2 - pas de risque de mismatch de
 * langue), sans clé, sans limite de taux annoncée. Contrat volontairement
 * défensif : ne jamais lever d'exception ni bloquer l'UI, toujours renvoyer
 * un tableau (vide en cas d'échec réseau, timeout, ou réponse invalide) -
 * l'appelant bascule alors sur une saisie libre (voir CityAutocomplete.jsx).
 */
const PLACES_API_BASE = 'https://countries.dev/places';
const PLACES_API_TIMEOUT_MS = 4000;

export async function fetchCitiesForCountry(countryCode) {
  if (!countryCode) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PLACES_API_TIMEOUT_MS);

  try {
    const url = `${PLACES_API_BASE}?country=${encodeURIComponent(countryCode.toUpperCase())}&class=P&limit=30`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];

    const json = await res.json();
    if (!Array.isArray(json)) return [];

    return json.map((c) => c.name).filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
