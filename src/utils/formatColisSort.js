/**
 * Trie une liste de formats de colis du plus petit au plus grand : par
 * poids_max croissant (illimité/null en dernier), avec volume_max en
 * départage entre deux formats de même poids_max. Miroir du scope backend
 * FormatColis::scopeParTailleCroissante() - pas de rang manuel ("ordre") :
 * le backend le renvoie déjà trié ainsi, ce tri ne sert qu'à ré-ordonner
 * localement après un ajout/une modification côté client.
 */
export const sortFormatsColisParTaille = (formats) => {
  return [...(formats || [])].sort((a, b) => {
    const poidsA = a.poids_max ?? Infinity;
    const poidsB = b.poids_max ?? Infinity;
    if (poidsA !== poidsB) return poidsA - poidsB;

    const volumeA = a.volume_max ?? Infinity;
    const volumeB = b.volume_max ?? Infinity;
    return volumeA - volumeB;
  });
};
