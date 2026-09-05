import africanCountriesData from '../data/african-countries.json';

/**
 * Sous-ensemble de countries.js restreint aux 54 pays africains, dérivé de
 * App\Support\AfricanCountries::CODES côté backend (voir
 * src/data/african-countries.json, copié à l'identique dans
 * Gestion_agence_partenaire et tourshop-backend). Utilisé pour appliquer la
 * règle géographique : GROUPAGE_AFRIQUE -> Afrique uniquement,
 * GROUPAGE_CA / GROUPAGE_DHD_* -> tous pays HORS Afrique.
 */

export const AFRICAN_COUNTRY_CODES = new Set(africanCountriesData.map((c) => c.code));

export function isAfricanCountry(code) {
  return Boolean(code) && AFRICAN_COUNTRY_CODES.has(code.toUpperCase());
}

export default africanCountriesData;
