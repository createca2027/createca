#!/usr/bin/env node
// npm run publier -- "<message>" [--attente <secondes>] [--simuler]
// Vérifie, enregistre (commit), publie (push vers origin, ou vercel deploy), puis contrôle l'adresse publique.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { champ, separer } from './verifier.mjs';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const URL_PUBLIQUE = 'https://createca.vercel.app';
// Seuls ces chemins sont ajoutés au commit, jamais « git add -A » sur la racine.
export const CHEMINS_AUTORISES = [
  'src', 'public', 'AGENTS.md', 'CLAUDE.md', '.claude', '.agents', 'scripts', 'docs',
  'package.json', 'package-lock.json', 'astro.config.mjs',
];

export function analyserArguments(argv) {
  const { values, positionals } = parseArgs({
    args: argv, strict: true, allowPositionals: true,
    options: { attente: { type: 'string' }, simuler: { type: 'boolean', default: false } },
  });
  const message = positionals.join(' ').trim();
  if (!message) throw new Error('Un message est obligatoire : npm run publier -- "Ajout des portes ouvertes du 4 juillet 2027".');
  if (message.includes('\u2014')) throw new Error('Le tiret cadratin est interdit dans le message.');
  const attente = values.attente === undefined ? 600 : Number(values.attente);
  if (!Number.isFinite(attente) || attente <= 0) throw new Error('--attente attend un nombre de secondes positif.');
  return { message, attente, simuler: values.simuler };
}

// À partir de `git diff --name-status`, ids des actualités ajoutées ou modifiées (hors brouillon, vérifié par lireTexte).
export function idsActualites(nameStatus, lireTexte) {
  const ids = [];
  for (const ligne of nameStatus.split('\n').filter(Boolean)) {
    const [statut, chemin] = ligne.split('\t');
    const m = /^src\/content\/actualites\/([^/]+)\.md$/.exec(chemin ?? '');
    if (!m || statut.startsWith('D')) continue;
    const texte = lireTexte(chemin);
    if (texte !== undefined && champ(separer(texte).entete, 'brouillon') === 'true') continue;
    ids.push(m[1]);
  }
  return ids;
}

export function urlsAControler(ids) {
  return [`${URL_PUBLIQUE}/`, ...ids.map((id) => `${URL_PUBLIQUE}/actualites/${id}/`)];
}

export function urlSuivi(remote) {
  const m = /github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/.exec(remote.trim());
  return m ? `https://github.com/${m[1]}/${m[2]}/deployments` : undefined;
}

export async function attendre200(url, { delaiMax, pause = 15_000, requete = (u) => fetch(u, { redirect: 'follow' }).then((r) => r.status), dormir = (ms) => new Promise((r) => setTimeout(r, ms)), horloge = Date.now }) {
  const fin = horloge() + delaiMax;
  let dernier = 'aucune réponse';
  for (;;) {
    try { dernier = await requete(`${url}${url.includes('?') ? '&' : '?'}controle=${horloge()}`); if (dernier === 200) return { ok: true, statut: 200 }; } catch (e) { dernier = e.message; }
    if (horloge() + pause > fin) return { ok: false, statut: dernier };
    await dormir(pause);
  }
}

function git(args, options = {}) {
  return spawnSync('git', args, { cwd: RACINE, encoding: 'utf8', ...options });
}
function arreter(message) {
  console.error(`\nARRÊT : ${message}`);
  process.exit(1);
}

async function principal() {
  let opts;
  try { opts = analyserArguments(process.argv.slice(2)); } catch (e) { arreter(e.message); }

  console.log('== Vérification complète');
  const v = spawnSync(process.execPath, [join(RACINE, 'scripts/cms/verifier.mjs')], { cwd: RACINE, stdio: 'inherit' });
  if (v.status !== 0) arreter('la vérification a échoué, rien n’est publié.');

  console.log('\n== Changements en attente');
  const statut = git(['status', '--short']).stdout;
  console.log(statut || '(aucun)');

  const existants = CHEMINS_AUTORISES.filter((c) => existsSync(join(RACINE, c)));
  const ajout = git(['add', '--', ...existants]);
  if (ajout.status !== 0) arreter(`git add a échoué : ${ajout.stderr}`);
  if (git(['diff', '--cached', '--quiet']).status === 0) arreter('aucun changement à publier.');
  if (opts.simuler) {
    console.log('\nMode --simuler : fichiers ajoutés à l’index, aucun commit ni envoi.');
    console.log(git(['diff', '--cached', '--stat']).stdout);
    return;
  }
  const commit = git(['commit', '-m', opts.message], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (commit.status !== 0) arreter('le commit a échoué.');

  const nomStatut = git(['diff', '--name-status', 'HEAD~1', 'HEAD', '--', 'src/content/actualites']).stdout;
  const ids = idsActualites(nomStatut, (c) => { const f = join(RACINE, c); return existsSync(f) ? readFileSync(f, 'utf8') : undefined; });

  const remote = git(['remote', 'get-url', 'origin']);
  if (remote.status === 0) {
    console.log('\n== Envoi vers origin (Vercel construit alors le site depuis Git)');
    const push = git(['push', 'origin', 'HEAD'], { stdio: ['ignore', 'inherit', 'inherit'] });
    if (push.status !== 0) arreter('git push a échoué : le commit est fait en local, rien n’est en ligne. Vérifier les droits GitHub puis relancer « git push origin HEAD ».');
    const suivi = urlSuivi(remote.stdout);
    if (suivi) console.log(`Suivi du déploiement : ${suivi}`);
  } else if (existsSync(join(RACINE, '.vercel/project.json')) && spawnSync('vercel', ['--version'], { stdio: 'ignore' }).status === 0) {
    console.log('\n== Déploiement direct (vercel deploy --prod --yes)');
    const dep = spawnSync('vercel', ['deploy', '--prod', '--yes'], { cwd: RACINE, stdio: 'inherit' });
    if (dep.status !== 0) arreter('vercel deploy a échoué.');
  } else {
    arreter('le commit est fait en local mais rien ne peut le mettre en ligne : aucun dépôt distant « origin » et pas de CLI vercel liée (.vercel/project.json). Ajouter le remote GitHub relié à Vercel, ou lier le projet avec « vercel link ».');
  }

  console.log(`\n== Contrôle de l’adresse publique (attente maximale ${opts.attente} s)`);
  for (const url of urlsAControler(ids)) {
    const r = await attendre200(url, { delaiMax: opts.attente * 1000 });
    if (!r.ok) arreter(`${url} ne répond pas 200 après ${opts.attente} s (dernier état : ${r.statut}). Ouvrir le suivi Vercel pour lire le journal de construction.`);
    console.log(`OK  ${url} répond 200`);
  }
  console.log('\nPublication terminée.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await principal();
