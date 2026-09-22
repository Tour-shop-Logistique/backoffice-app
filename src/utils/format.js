/**
 * Module utilitaire pour le formatage des devises
 */

import { getStore } from '../redux/storeAccessor';

// Code ISO (norme Intl) -> libellé affiché. Seule source de vérité pour le
// texte de la devise dans toute l'app : ajouter une devise ici suffit,
// jamais de "FCFA"/"CFA" recodé en dur ailleurs dans le JSX.
const CURRENCY_LABELS = {
  XOF: 'FCFA',
  XAF: 'FCFA',
  USD: 'USD',
  EUR: '€',
  GBP: '£',
  MAD: 'MAD',
  DZD: 'DZD',
  TND: 'TND',
  GHS: 'GHS',
  NGN: 'NGN',
  CAD: 'CAD',
};

/**
 * Libellé affichable de la devise du backoffice connecté (ex: 'XOF' ->
 * 'FCFA', 'EUR' -> '€'). Lit Backoffice::devise via le store Redux plutôt
 * qu'un code fixe, pour qu'un backoffice France/Espagne affiche sa vraie
 * devise au lieu du FCFA appliqué à tout le monde jusqu'ici.
 *
 * Un code explicite peut toujours être passé (ex: affichage volontaire
 * d'une autre devise), sinon repli sur celle du backoffice courant, puis
 * XOF si aucun backoffice n'est encore chargé (état initial de l'app).
 * @param {string} [currencyCode] - Code ISO de la devise (XOF, USD, EUR...)
 * @returns {string} Libellé à afficher
 */
export const getCurrencyLabel = (currencyCode) => {
  const code = currencyCode || getStore()?.getState()?.backoffice?.devise || 'XOF';
  return CURRENCY_LABELS[code] || code;
};

// Options pour un sélecteur de devise (voir BackofficeSetup.jsx) - dérivées
// de CURRENCY_LABELS pour rester en phase avec les libellés affichés.
export const CURRENCY_OPTIONS = Object.entries(CURRENCY_LABELS).map(([code, label]) => ({
  value: code,
  label: `${code} (${label})`,
}));
