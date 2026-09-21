/**
 * Module utilitaire pour le formatage des devises
 */

// Code ISO (norme Intl) -> libellé affiché. Seule source de vérité pour le
// texte de la devise dans toute l'app : ajouter une devise ici suffit,
// jamais de "FCFA"/"CFA" recodé en dur ailleurs dans le JSX.
const CURRENCY_LABELS = {
  XOF: 'FCFA',
  USD: 'USD',
  EUR: '€',
};

/**
 * Libellé affichable d'un code devise ISO (ex: 'XOF' -> 'FCFA').
 * @param {string} currencyCode - Code ISO de la devise (XOF, USD, EUR...)
 * @returns {string} Libellé à afficher
 */
export const getCurrencyLabel = (currencyCode = 'XOF') => CURRENCY_LABELS[currencyCode] || currencyCode;
