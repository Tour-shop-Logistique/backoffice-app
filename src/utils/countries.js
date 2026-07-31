import countriesData from '../data/countries.json';

/**
 * Source de vérité unique pour les pays (code ISO 3166-1 alpha-2 + nom FR),
 * générée depuis i18n-iso-countries (voir src/data/countries.json, copié à
 * l'identique dans Gestion_agence_partenaire et tourshop-backend). Remplace
 * les listes de pays codées en dur qui divergeaient d'un formulaire à l'autre.
 */

// Options prêtes pour un dropdown : {id: code, label: nom}
export const COUNTRY_OPTIONS = countriesData.map(({ code, name }) => ({ id: code, label: name }));

const BY_CODE = new Map(countriesData.map((c) => [c.code, c.name]));

export function getCountryName(code) {
  if (!code) return '';
  return BY_CODE.get(code.toUpperCase()) || code;
}

export function isValidCountryCode(code) {
  return Boolean(code) && BY_CODE.has(code.toUpperCase());
}

export default countriesData;
