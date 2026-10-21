// Empêche la coupure de ligne au trait d'union des mots composés fréquents (titres).
const COMPOSES = /\b(art-thérap(?:ie|eute|eutes|eutique|eutiques)|arts?-plastiques|arto-analyse|petite-enfance)\b/gi;
export const insecable = (texte: string) => texte.replace(COMPOSES, '<span class="insecable">$1</span>');

/** Même chose pour du texte brut : échappé puis protégé, à rendre avec set:html. */
export const insecableTexte = (texte: string) =>
  insecable(texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
