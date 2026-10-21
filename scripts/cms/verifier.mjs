#!/usr/bin/env node
// npm run verifier : portes rapides sur src/, puis astro check, astro build, puis contrôle des liens de dist/client.
// S'arrête au premier échec avec un message lisible (code de sortie 1).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TIRET_CADRATIN = '\u2014';
const RESUME_MAX = 160;

export function lister(dossier, extensions) {
  if (!existsSync(dossier)) return [];
  const sortie = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) sortie.push(...lister(chemin, extensions));
    else if (extensions.some((e) => nom.endsWith(e))) sortie.push(chemin);
  }
  return sortie.sort();
}

export function separer(texte) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(texte);
  return m ? { entete: m[1], corps: m[2] } : { entete: '', corps: texte };
}

function sansGuillemets(v) {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.startsWith('"') ? safeJson(t) : t.slice(1, -1).replace(/''/g, "'");
  }
  return t;
}
function safeJson(t) { try { return JSON.parse(t); } catch { return t.slice(1, -1); } }

// Valeur d'un champ de premier niveau (scalaire, ou bloc plié > / |).
export function champ(entete, nom) {
  const lignes = entete.split(/\r?\n/);
  const i = lignes.findIndex((l) => l.startsWith(`${nom}:`));
  if (i < 0) return undefined;
  const v = lignes[i].slice(nom.length + 1).trim();
  if (/^[>|][+-]?$/.test(v)) {
    const bloc = [];
    for (let j = i + 1; j < lignes.length && /^\s+\S/.test(lignes[j]); j++) bloc.push(lignes[j].trim());
    return bloc.join(v.startsWith('>') ? ' ' : '\n');
  }
  return sansGuillemets(v);
}

// Sous-champs de `image:` (src, alt) ; undefined si le bloc image est absent.
export function blocImage(entete) {
  const lignes = entete.split(/\r?\n/);
  const i = lignes.findIndex((l) => /^image:/.test(l));
  if (i < 0) return undefined;
  const reste = lignes[i].slice(6).trim();
  const bloc = reste ? [reste.replace(/^\{|\}$/g, '')] : [];
  for (let j = i + 1; j < lignes.length && /^\s+\S/.test(lignes[j]); j++) bloc.push(lignes[j].trim());
  const texte = bloc.join('\n');
  const lire = (nom) => {
    const m = new RegExp(`(?:^|[\\n,{]\\s*)${nom}:\\s*("(?:[^"\\\\]|\\\\.)*"|'(?:[^']|'')*'|[^,\\n}]*)`).exec(texte);
    return m ? sansGuillemets(m[1]) : undefined;
  };
  return { src: lire('src'), alt: lire('alt') };
}

const resultat = (porte, problemes) => ({ porte, problemes });

export function porteTiretCadratin(fichiers) {
  const p = [];
  for (const { chemin, texte } of fichiers) {
    texte.split('\n').forEach((l, i) => { if (l.includes(TIRET_CADRATIN)) p.push(`${chemin}:${i + 1} : tiret cadratin (U+2014), le remplacer par une virgule, deux-points ou un tiret court`); });
  }
  return resultat('aucun tiret cadratin', p);
}

export function porteResume(fichiers) {
  const p = [];
  for (const { chemin, texte } of fichiers) {
    const r = champ(separer(texte).entete, 'resume');
    if (r !== undefined && [...r].length > RESUME_MAX) p.push(`${chemin} : resume de ${[...r].length} caractères, maximum ${RESUME_MAX}`);
  }
  return resultat(`resume de ${RESUME_MAX} caractères au plus`, p);
}

export function porteAlt(fichiers) {
  const p = [];
  for (const { chemin, texte } of fichiers) {
    const { entete, corps } = separer(texte);
    const img = blocImage(entete);
    if (img && !(img.alt ?? '').trim()) p.push(`${chemin} : image sans texte alternatif (alt) dans l’en-tête`);
    for (const m of corps.matchAll(/!\[([^\]]*)\]\(/g)) if (!m[1].trim()) p.push(`${chemin} : image Markdown sans texte alternatif`);
    for (const m of corps.matchAll(/<img\b[^>]*>/gi)) if (!/\balt\s*=\s*("[^"]*[^"\s][^"]*"|'[^']*[^'\s][^']*')/i.test(m[0])) p.push(`${chemin} : balise img sans alt renseigné`);
  }
  return resultat('toute image a un texte alternatif', p);
}

export function porteARemplacer(fichiers) {
  const p = [];
  for (const { chemin, texte } of fichiers) {
    const { entete } = separer(texte);
    if (champ(entete, 'brouillon') === 'true') continue;
    texte.split('\n').forEach((l, i) => { if (/à remplacer/i.test(l)) p.push(`${chemin}:${i + 1} : commentaire « à remplacer » restant dans un contenu publié (le compléter, ou passer « brouillon: true »)`); });
  }
  return resultat('aucun « à remplacer » restant', p);
}

export function extraireLiens(html) {
  const liens = new Set();
  for (const m of html.matchAll(/\bhref\s*=\s*"(\/[^"]*)"/g)) {
    if (m[1].startsWith('//')) continue;
    liens.add(m[1].replace(/&amp;/g, '&').split('#')[0].split('?')[0]);
  }
  liens.delete('');
  return [...liens];
}

export function lienExiste(lien, dossierClient) {
  let chemin;
  try { chemin = decodeURIComponent(lien); } catch { chemin = lien; }
  const base = join(dossierClient, chemin);
  if (chemin.endsWith('/')) return existsSync(join(base, 'index.html'));
  return (existsSync(base) && statSync(base).isFile()) || existsSync(join(base, 'index.html')) || existsSync(`${base}.html`);
}

export function porteLiens(dossierClient) {
  const p = [];
  const pages = lister(dossierClient, ['.html']);
  for (const page of pages) {
    for (const lien of extraireLiens(readFileSync(page, 'utf8'))) {
      if (!lienExiste(lien, dossierClient)) p.push(`${relative(dossierClient, page)} : lien interne cassé « ${lien} »`);
    }
  }
  return resultat(`liens internes valides (${pages.length} pages)`, p);
}

export function lireFichiers(chemins, racine = RACINE) {
  return chemins.map((c) => ({ chemin: relative(racine, c), texte: readFileSync(c, 'utf8') }));
}

export function portesSource(racine = RACINE) {
  const texte = ['.md', '.json', '.ts', '.astro', '.mjs'];
  const dossiers = ['src/content', 'src/data', 'src/pages'].map((d) => join(racine, d));
  const tous = lireFichiers(dossiers.flatMap((d) => lister(d, texte)), racine);
  const contenus = lireFichiers(lister(join(racine, 'src/content'), ['.md']), racine);
  const actus = contenus.filter((f) => f.chemin.split('/').slice(0, 3).join('/') === 'src/content/actualites');
  return [porteTiretCadratin(tous), porteResume(actus), porteAlt(contenus), porteARemplacer(contenus)];
}

function lancer(titre, commande, args, racine) {
  console.log(`\n== ${titre}`);
  const r = spawnSync(commande, args, { cwd: racine, stdio: 'inherit' });
  if (r.status !== 0) echec(`${titre} a échoué (code ${r.status ?? 'inconnu'}). Lire les messages ci-dessus, corriger, puis relancer « npm run verifier ».`);
}

function echec(message) {
  console.error(`\nÉCHEC : ${message}`);
  process.exit(1);
}

function appliquer(portes) {
  for (const { porte, problemes } of portes) {
    if (problemes.length) {
      console.error(`\nPorte « ${porte} » : ${problemes.length} problème(s)`);
      problemes.slice(0, 20).forEach((x) => console.error(`  - ${x}`));
      echec(`la porte « ${porte} » est rouge.`);
    }
    console.log(`OK  ${porte}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('== Portes rapides sur src/');
  appliquer(portesSource());
  lancer('Contrôle des types (astro check)', 'npx', ['--no-install', 'astro', 'check'], RACINE);
  lancer('Construction du site (astro build)', 'npx', ['--no-install', 'astro', 'build'], RACINE);
  const client = join(RACINE, 'dist', 'client');
  if (!existsSync(client)) echec('dist/client est introuvable après la construction.');
  console.log('\n== Portes sur le site construit');
  appliquer([porteLiens(client)]);
  console.log('\nTout est vert : le site est prêt à être publié.');
}
