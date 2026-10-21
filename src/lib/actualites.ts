import { getCollection, render, type CollectionEntry } from 'astro:content';
import { dateLongue } from './dates';

export type Actu = CollectionEntry<'actualites'>;
export type TypeActu = Actu['data']['type'];

export const libelles: Record<TypeActu, string> = {
  article: 'Article', atelier: 'Atelier', certifications: 'Certifications', evenement: 'Événement', exposition: 'Exposition',
  formation: 'Formation', information: 'Information', 'portes-ouvertes': 'Portes ouvertes', publication: 'Publication',
  qualite: 'Qualité', rencontre: 'Rencontre', reprise: 'Rentrée', soutien: 'Soutien',
};

/** Pigment de l'en-tête selon le type. */
export const pigments: Record<TypeActu, 'ocre' | 'cadmium' | 'cobalt'> = {
  article: 'cobalt', atelier: 'ocre', certifications: 'cobalt', evenement: 'cadmium', exposition: 'cadmium',
  formation: 'cobalt', information: 'ocre', 'portes-ouvertes': 'cadmium', publication: 'cobalt',
  qualite: 'cobalt', rencontre: 'ocre', reprise: 'ocre', soutien: 'ocre',
};

// Types sans échéance : jamais « à venir ».
const SANS_ECHEANCE: TypeActu[] = ['article', 'certifications', 'information', 'publication', 'qualite'];

/** Chemin de la page d'une actualité. */
export const lien = (a: Actu) => `/actualites/${a.id}/`;
export const lienType = (t: TypeActu) => `/actualites/categorie/${t}/`;

/** Clé de tri dans l'année : jour de l'événement, sinon date limite, sinon publication. */
const cle = (a: Actu) => a.data.date ?? a.data.limite ?? a.data.publie;

const comparer = (a: Actu, b: Actu) => {
  if (a.data.annee !== b.data.annee) return b.data.annee - a.data.annee;
  const ka = cle(a);
  const kb = cle(b);
  if (ka && kb) return ka === kb ? a.id.localeCompare(b.id) : ka < kb ? 1 : -1;
  if (ka) return -1;
  if (kb) return 1;
  return (a.data.ordre ?? Infinity) - (b.data.ordre ?? Infinity) || a.id.localeCompare(b.id);
};

/** Toutes les actualités publiées (hors brouillons), de la plus récente à la plus ancienne. */
export const toutes = (await getCollection('actualites', (a) => !a.data.brouillon)).sort(comparer);

// Échéance d'une annonce : fin des inscriptions, dernier jour ou jour de l'événement.
// Évaluée à la construction du site ; une petite étape côté navigateur masque ce qui échoit ensuite.
const aujourdhui = new Date().toISOString().slice(0, 10);

/** Échéance AAAA-MM-JJ d'une annonce, absente pour les types sans échéance. */
export const echeance = (a: Actu) => (SANS_ECHEANCE.includes(a.data.type) ? undefined : a.data.limite ?? a.data.dateFin ?? a.data.date);
export const estPassee = (a: Actu) => {
  const e = echeance(a);
  return e !== undefined && e < aujourdhui;
};
const estAVenir = (a: Actu) => {
  if (SANS_ECHEANCE.includes(a.data.type)) return false;
  const e = echeance(a);
  return e ? e >= aujourdhui : a.data.annee > Number(aujourdhui.slice(0, 4));
};

export const aVenir = toutes.filter(estAVenir);
export const passees = toutes.filter((a) => !estAVenir(a));

/** Types qui ont au moins une actualité, dans l'ordre alphabétique des libellés. */
export const typesPresents = [...new Set(toutes.map((a) => a.data.type))].sort((x, y) => libelles[x].localeCompare(libelles[y], 'fr'));

/** Date affichée sur une carte : la date limite n'est jamais présentée comme la date d'un événement. */
export const quand = (a: Actu) => {
  const { limite, date, dateFin, publie, annee } = a.data;
  if (limite) return `inscriptions jusqu’au ${dateLongue(limite)}`;
  if (date) return dateFin ? `du ${dateLongue(date)} au ${dateLongue(dateFin)}` : dateLongue(date);
  if (publie) return `publié le ${dateLongue(publie)}`;
  return String(annee);
};

/** Contenu rendu du corps Markdown. */
export const corps = async (a: Actu) => (await render(a)).Content;

/** Texte brut du corps (sans balises ni syntaxe Markdown courante). */
const texteBrut = (a: Actu) =>
  (a.body ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_`>#]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** Meta description : le résumé, sinon le texte tronqué à 160 caractères au plus, à la fin d'un mot. */
export const description = (a: Actu) => {
  if (a.data.resume) return a.data.resume;
  const t = texteBrut(a);
  if (t.length <= 160) return t || a.data.titre;
  const coupe = t.slice(0, 159);
  return `${coupe.slice(0, Math.max(coupe.lastIndexOf(' '), 1)).replace(/[\s,;:.(-]+$/, '')}…`;
};
