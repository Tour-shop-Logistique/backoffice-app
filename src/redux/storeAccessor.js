/**
 * Point d'accès différé au store Redux, pour les modules qui ne peuvent pas
 * l'importer directement sans créer une dépendance circulaire.
 *
 * Cas d'usage : src/services/api.js (l'intercepteur de réponse axios) a
 * besoin de dispatcher une déconnexion sur un 401, mais store.js importe
 * authSlice.js qui importe authService.js qui importe api.js - un import
 * statique de store.js dans api.js fermerait ce cycle et casserait l'ordre
 * de chargement des modules ES.
 *
 * store.js appelle setStore(store) une fois créé ; api.js appelle
 * getStore() au moment de l'usage (jamais au chargement du module), quand
 * le cycle est déjà résolu.
 */
let storeInstance = null;

export function setStore(store) {
  storeInstance = store;
}

export function getStore() {
  return storeInstance;
}
