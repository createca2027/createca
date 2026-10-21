#!/usr/bin/env node
// Crée une actualité : src/content/actualites/<id>.md avec un frontmatter valide.
// Usage : npm run actu:nouvelle -- --type <type> --titre "<titre>" [--date AAAA-MM-JJ] [--fin AAAA-MM-JJ]
//         [--limite AAAA-MM-JJ] [--resume "..."] [--brouillon] [--id <slug>] [--dossier <chemin>]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const TYPES = [
  'article', 'atelier', 'certifications', 'evenement', 'exposition', 'formation', 'information',
  'portes-ouvertes', 'publication', 'qualite', 'rencontre', 'reprise', 'soutien',
];
// Types dont la page a un bloc Quand / Où : la date de l'événement est indispensable.
const DATE_OBLIGATOIRE = ['portes-ouvertes', 'evenement', 'exposition', 'rencontre'];
const RESUME_MAX = 160;
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export class ErreurActu extends Error {}

export function dateValide(texte) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texte ?? '');
  if (!m) return false;
  const [a, mo, j] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(a, mo - 1, j));
  return d.getUTCFullYear() === a && d.getUTCMonth() === mo - 1 && d.getUTCDate() === j;
}

export function aujourdhui(maintenant = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${maintenant.getFullYear()}-${p(maintenant.getMonth() + 1)}-${p(maintenant.getDate())}`;
}

export function slugifier(texte) {
  return texte
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[œŒ]/g, 'oe').replace(/[æÆ]/g, 'ae')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function analyserArguments(argv) {
  const { values } = parseArgs({
    args: argv,
    strict: true,
    allowPositionals: false,
    options: {
      type: { type: 'string' }, titre: { type: 'string' }, date: { type: 'string' },
      fin: { type: 'string' }, limite: { type: 'string' }, resume: { type: 'string' },
      brouillon: { type: 'boolean', default: false }, id: { type: 'string' }, dossier: { type: 'string' },
    },
  });
  return values;
}

// Construit l'id : <type>-<aaaa>-<mm>[-<jj>] ; pour un article, <sujet>-<aaaa>.
export function construireId({ type, titre, date, limite, fin, annee }) {
  if (type === 'article') return `${slugifier(titre).slice(0, 60).replace(/-+$/, '')}-${annee}`;
  if (date) return `${type}-${date}`;
  const repere = limite ?? fin;
  return repere ? `${type}-${repere.slice(0, 7)}` : `${type}-${annee}`;
}

export function valider(v, { aujourdhuiTexte = aujourdhui() } = {}) {
  const titre = (v.titre ?? '').trim();
  if (!v.type) throw new ErreurActu(`Le type est obligatoire (--type). Types possibles : ${TYPES.join(', ')}.`);
  if (!TYPES.includes(v.type)) throw new ErreurActu(`Type inconnu « ${v.type} ». Types possibles : ${TYPES.join(', ')}.`);
  if (!titre) throw new ErreurActu('Le titre est obligatoire (--titre).');
  if (/\u2014/.test(JSON.stringify(v))) throw new ErreurActu('Le tiret cadratin est interdit : utiliser une virgule, deux-points ou un tiret court.');
  for (const [nom, valeur] of [['--date', v.date], ['--fin', v.fin], ['--limite', v.limite]]) {
    if (valeur !== undefined && !dateValide(valeur)) {
      throw new ErreurActu(`Date invalide pour ${nom} : « ${valeur} ». Format attendu AAAA-MM-JJ, jour réel du calendrier.`);
    }
  }
  if (v.fin && !v.date) throw new ErreurActu('--fin demande aussi --date (le premier jour).');
  if (v.fin && v.fin < v.date) throw new ErreurActu(`La date de fin (${v.fin}) est antérieure au début (${v.date}).`);
  if (DATE_OBLIGATOIRE.includes(v.type) && !v.date) {
    throw new ErreurActu(`Le type « ${v.type} » demande la date de l’événement (--date AAAA-MM-JJ).`);
  }
  if (v.resume !== undefined && [...v.resume].length > RESUME_MAX) {
    throw new ErreurActu(`Le résumé fait ${[...v.resume].length} caractères, le maximum est ${RESUME_MAX}.`);
  }
  if (v.id !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.id)) {
    throw new ErreurActu(`Identifiant invalide « ${v.id} » : minuscules sans accent, chiffres et tirets seulement.`);
  }
  // Contrat du schéma : date, dateFin et limite tombent dans l'année `annee`,
  // qui est celle de la première valeur présente parmi date, limite, publie (aujourd'hui pour un article).
  const publie = v.type === 'article' ? aujourdhuiTexte : undefined;
  const annee = Number((v.date ?? v.limite ?? publie ?? aujourdhuiTexte).slice(0, 4));
  for (const [nom, valeur] of [['--fin', v.fin], ['--limite', v.limite]]) {
    if (valeur && Number(valeur.slice(0, 4)) !== annee) {
      throw new ErreurActu(`${nom} (${valeur}) n’est pas dans l’année ${annee} de l’actualité : le site exige la même année pour la date, la fin et la date limite. Créer deux actualités distinctes.`);
    }
  }
  const id = v.id ?? construireId({ type: v.type, titre, date: v.date, limite: v.limite, fin: v.fin, annee });
  if (!id) throw new ErreurActu('Impossible de déduire un identifiant du titre : préciser --id.');
  return { ...v, titre, annee, id, publie };
}

const q = (s) => JSON.stringify(s);
const d = (s) => `'${s}'`;

export function construireFrontmatter(a) {
  const l = ['---', `titre: ${q(a.titre)}`, `type: ${a.type}`, `annee: ${a.annee}`];
  if (a.date) l.push(`date: ${d(a.date)}`);
  if (a.fin) l.push(`dateFin: ${d(a.fin)}`);
  if (a.limite) l.push(`limite: ${d(a.limite)}`);
  if (a.publie) l.push(`publie: ${d(a.publie)}`);
  if (a.resume) l.push(`resume: ${q(a.resume)}`);
  if (a.brouillon) l.push('brouillon: true');
  l.push('---');
  return l.join('\n');
}

const CORPS = {
  article: [
    '<!-- à remplacer : introduction en deux ou trois phrases, avec les seuls faits fournis par l’équipe -->',
    '## <!-- à remplacer : premier intertitre -->',
    '<!-- à remplacer : paragraphes courts. Pour une image : l’ajouter à côté de ce fichier et la déclarer dans l’en-tête (image: src et alt) -->',
  ],
  formation: [
    '<!-- à remplacer : session concernée (mois, année) et public visé -->',
    '<!-- à remplacer : contenu pédagogique ou renvoi vers la page Formation ; la date limite d’inscription vient de l’en-tête -->',
  ],
  'portes-ouvertes': [
    '<!-- à remplacer : horaires exacts (par exemple « de 10 h à 17 h ») et conditions d’entrée -->',
    '<!-- à remplacer : programme de la journée, uniquement ce qui est confirmé -->',
  ],
  evenement: ['<!-- à remplacer : nature de l’événement, horaires, lieu, conditions de participation -->'],
  exposition: ['<!-- à remplacer : nom de l’artiste, titre de l’exposition, vernissage (jour, heure), lieu -->'],
  rencontre: ['<!-- à remplacer : thème de la rencontre, intervenants nommés par l’équipe, horaires, lieu -->'],
  atelier: ['<!-- à remplacer : public concerné, jours et horaires, tarif s’il est donné, comment s’inscrire -->'],
  certifications: ['<!-- à remplacer : félicitations et année de certification ; les noms viennent de la liste officielle des certifiés -->'],
  qualite: ['<!-- à remplacer : information sur la certification qualité, avec les références fournies -->'],
  reprise: ['<!-- à remplacer : date de reprise des séances et années concernées -->'],
  publication: ['<!-- à remplacer : titre de l’ouvrage ou du texte, auteur, où le trouver -->'],
  soutien: ['<!-- à remplacer : nature du soutien, nom du soutien tel que donné par l’équipe -->'],
  information: ['<!-- à remplacer : l’information à communiquer, en phrases courtes -->'],
};

export function construireCorps(a) {
  const lignes = [];
  if (!a.resume) lignes.push('<!-- à remplacer : ajouter « resume: » dans l’en-tête (160 caractères au plus, une phrase qui donne envie de lire) -->');
  lignes.push(...CORPS[a.type]);
  return lignes.join('\n\n');
}

export function creer(valeurs, { dossier, aujourdhuiTexte } = {}) {
  const a = valider(valeurs, { aujourdhuiTexte });
  const cible = dossier ? resolve(dossier) : join(RACINE, 'src', 'content', 'actualites');
  const chemin = join(cible, `${a.id}.md`);
  if (existsSync(chemin)) throw new ErreurActu(`L’identifiant « ${a.id} » existe déjà (${chemin}). Choisir un autre --id ou modifier le fichier existant.`);
  mkdirSync(cible, { recursive: true });
  writeFileSync(chemin, `${construireFrontmatter(a)}\n\n${construireCorps(a)}\n`, { flag: 'wx' });
  return { chemin, id: a.id, url: `/actualites/${a.id}/`, brouillon: Boolean(a.brouillon) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const r = creer(analyserArguments(process.argv.slice(2)), {
      dossier: analyserArguments(process.argv.slice(2)).dossier,
    });
    console.log(`Fichier créé : ${r.chemin}`);
    console.log(`Adresse future : https://createca.vercel.app${r.url}${r.brouillon ? ' (brouillon : non publiée tant que « brouillon: true » reste)' : ''}`);
  } catch (e) {
    console.error(`Erreur : ${e instanceof ErreurActu || e?.code?.startsWith?.('ERR_PARSE_ARGS') ? e.message : e.stack}`);
    process.exit(1);
  }
}
