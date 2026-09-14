import { getCountries, getCountryCallingCode, getExampleNumber, validatePhoneNumberLength, parsePhoneNumberFromString } from 'libphonenumber-js';
import examplePhoneNumbers from 'libphonenumber-js/examples.mobile.json';
import countriesData from '../data/countries.json';

/**
 * Liste des indicatifs téléphoniques par pays, pour le sélecteur obligatoire
 * dans les formulaires d'inscription (backoffice + agence). Les indicatifs
 * viennent de libphonenumber-js (source fiable, ~245 pays/territoires) plutôt
 * que d'une table statique maintenue à la main - seuls les noms de pays FR
 * viennent de countries.json (voir utils/countries.js), pour rester cohérent
 * avec le reste du projet.
 *
 * Chaque option : { code: "CI", name: "Côte d'Ivoire", dialCode: "+225",
 * maxLength: 10 }. `maxLength` est la longueur (en chiffres) du numéro
 * national exemple de ce pays (voir getExampleNumber) - utilisée pour
 * plafonner la saisie du numéro local en fonction du pays choisi. Triée par
 * nom de pays FR.
 */

const NAME_BY_CODE = new Map(countriesData.map((c) => [c.code, c.name]));

export const PHONE_COUNTRY_OPTIONS = getCountries()
  .map((code) => {
    const name = NAME_BY_CODE.get(code) || code;
    let dialCode;
    try {
      dialCode = `+${getCountryCallingCode(code)}`;
    } catch {
      return null;
    }
    const example = getExampleNumber(code, examplePhoneNumbers);
    const maxLength = example ? example.nationalNumber.length : 15;
    return { code, name, dialCode, maxLength };
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

const BY_DIAL_CODE = new Map(PHONE_COUNTRY_OPTIONS.map((c) => [c.dialCode, c]));

export function getPhoneCountryByDialCode(dialCode) {
  return BY_DIAL_CODE.get(dialCode) || null;
}

// Ne conserve que les chiffres saisis dans un champ de numéro de téléphone
// (interdit lettres, espaces, tirets, symboles) - le formatage visuel reste
// à la charge de l'appelant si besoin, ceci ne fait que nettoyer la valeur.
export function sanitizePhoneDigits(value) {
  return (value || '').replace(/\D/g, '');
}

// Vrai si le numéro local a une longueur valide pour le pays de l'indicatif
// donné (voir validatePhoneNumberLength - plus fiable que maxLength seul,
// certains pays ayant plusieurs longueurs valides selon le type de ligne).
// Un numéro vide n'est pas signalé ici (géré par le "required" du champ).
export function isPhoneLengthValid(dialCode, localNumber) {
  const country = getPhoneCountryByDialCode(dialCode);
  if (!country || !localNumber) return true;
  return validatePhoneNumberLength(localNumber, country.code) === undefined;
}

// Sépare un numéro complet stocké en une seule chaîne (ex: "+225 0102030405",
// voir Agence.telephone / Backoffice.telephone - un seul champ backend, pas
// d'indicatif_telephone dédié comme pour User) en { dialCode, localNumber }
// pour alimenter deux champs d'affichage séparés (voir PhoneInput). Si
// l'indicatif n'est pas reconnaissable (champ vide, ou ancien numéro sans
// "+"), dialCode reste '' et localNumber récupère les chiffres tels quels -
// l'utilisateur resaisit alors l'indicatif manquant.
export function splitPhoneNumber(fullNumber) {
  if (!fullNumber) return { dialCode: '', localNumber: '' };

  const parsed = parsePhoneNumberFromString(fullNumber);
  if (parsed && parsed.countryCallingCode) {
    return { dialCode: `+${parsed.countryCallingCode}`, localNumber: parsed.nationalNumber };
  }

  return { dialCode: '', localNumber: sanitizePhoneDigits(fullNumber) };
}

// Fusionne l'indicatif et le numéro local en une seule chaîne pour l'envoi
// au backend (ex: "+225" + "0102030405" -> "+2250102030405", sans espace -
// cohérent avec le format déjà utilisé ailleurs dans le projet, ex.
// Agence.telephone), l'inverse de splitPhoneNumber() (qui reste tolérant à
// un éventuel espace pour les numéros déjà stockés avec l'ancien format).
export function joinPhoneNumber(dialCode, localNumber) {
  if (!dialCode && !localNumber) return '';
  return `${dialCode}${localNumber}`.trim();
}
