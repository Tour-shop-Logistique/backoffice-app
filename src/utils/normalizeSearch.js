/**
 * Normalise une chaîne pour une comparaison de recherche insensible à la
 * casse et aux accents (ex: "denrees" doit matcher "Denrées"). Équivalent
 * JS natif de PaysMatcher::normalize() côté backend.
 */
export function normalizeSearch(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
