#!/usr/bin/env node
// npm run publier -- "<message>" [--attente <secondes>] [--simuler]
// Contrôle branche et retard sur GitHub, vérifie, enregistre (commit), publie (push vers main, ou vercel deploy),
// attend la nouvelle version en ligne, puis contrôle l'adresse publique. Sans rien de nouveau (relance après une
// interruption), ne renvoie rien et contrôle seulement que la version en ligne contient le dernier commit.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { champ, separer } from './verifier.mjs';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const URL_PUBLIQUE = 'https://createca.vercel.app';
// Une requête bloquée (connexion acceptée, aucune réponse) ne doit pas dépasser les délais annoncés
const DELAI_REQUETE = 15_000;
// Seuls ces chemins sont ajoutés au commit, jamais « git add -A » sur la racine.
export const CHEMINS_AUTORISES = [
  'src', 'public', 'art', 'AGENTS.md', 'CLAUDE.md', '.claude', '.agents', '.claude-plugin', 'plugins', 'scripts', 'docs',
  'package.json', 'package-lock.json', 'astro.config.mjs', 'tsconfig.json', '.gitignore',
];

const dansPerimetre = (f) => CHEMINS_AUTORISES.some((c) => f === c || f.startsWith(`${c}/`));

// Sortie de `git status --porcelain -z` : entrées séparées par NUL, noms sans guillemets ni échappement.
// Pour un renommage ou une copie (R, C), l'ancien chemin suit dans son propre champ, sans préfixe « XY ».
// `suivis` : modifiés hors de CHEMINS_AUTORISES (vérifiés en local, ils ne partiraient pas, ou partiraient indexés).
// `nonSuivis` : nouveaux fichiers hors de CHEMINS_AUTORISES (vus par le build local, absents du commit).
export function horsPerimetre(porcelainZ) {
  const champs = porcelainZ.split('\0');
  const suivis = [];
  const nonSuivis = [];
  for (let i = 0; i < champs.length; i++) {
    if (champs[i].length < 4) continue;
    const xy = champs[i].slice(0, 2);
    const chemin = champs[i].slice(3);
    if (xy === '??') { nonSuivis.push(chemin); continue; }
    suivis.push(chemin);
    if (/[RC]/.test(xy)) suivis.push(champs[++i]);
  }
  return { suivis: suivis.filter((f) => !dansPerimetre(f)), nonSuivis: nonSuivis.filter((f) => !dansPerimetre(f)) };
}

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

export async function attendre200(url, { delaiMax, pause = 15_000, requete = (u) => fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(DELAI_REQUETE) }).then((r) => r.status), dormir = (ms) => new Promise((r) => setTimeout(r, ms)), horloge = Date.now }) {
  const fin = horloge() + delaiMax;
  let dernier = 'aucune réponse';
  for (;;) {
    try { dernier = await requete(`${url}${url.includes('?') ? '&' : '?'}controle=${horloge()}`); if (dernier === 200) return { ok: true, statut: 200 }; } catch (e) { dernier = e.message; }
    if (horloge() + pause > fin) return { ok: false, statut: dernier };
    await dormir(pause);
  }
}

// Envoi Git : l'ancienne version répond déjà 200. On attend que l'accueil porte le commit envoyé
// (<meta name="createca-version">, écrite par Base.astro depuis VERCEL_GIT_COMMIT_SHA), ou un commit plus récent
// qui le contient (autre publication entre-temps) : `estPublie(shaEnLigne)` en décide.
export async function attendreVersion(url, estPublie, { delaiMax, pause = 15_000, lire = (u) => fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(DELAI_REQUETE) }).then((r) => r.text()), dormir = (ms) => new Promise((r) => setTimeout(r, ms)), horloge = Date.now }) {
  const fin = horloge() + delaiMax;
  let dernier = 'aucune réponse';
  for (;;) {
    try {
      const m = /name="createca-version" content="([0-9a-f]{7,40})"/.exec(await lire(`${url}${url.includes('?') ? '&' : '?'}controle=${horloge()}`));
      dernier = m ? `version ${m[1].slice(0, 7)} en ligne` : 'version absente de la page';
      if (m && estPublie(m[1])) return { ok: true };
    } catch (e) { dernier = e.message; }
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
// Sortie d'un appel git interprétée ensuite : un échec doit arrêter, pas passer pour une sortie vide
function gitLire(args) {
  const r = git(args);
  if (r.status !== 0) arreter(`« git ${args.join(' ')} » a échoué : ${(r.stderr || '').trim().split('\n').at(-1)}`);
  return r.stdout;
}
const compter = (plage) => Number(gitLire(['rev-list', '--count', plage]).trim());
const MESSAGE_RETARD = (n) => `le site a reçu ${n} modification(s) publiée(s) depuis un autre poste. Lancer « git pull --rebase --autostash origin main », puis relancer. En cas de conflit, ne rien forcer : demander de l’aide.`;

async function principal() {
  let opts;
  try { opts = analyserArguments(process.argv.slice(2)); } catch (e) { arreter(e.message); }

  const avecGit = git(['remote', 'get-url', 'origin']).status === 0;
  if (!avecGit && !(existsSync(join(RACINE, '.vercel/project.json')) && spawnSync('vercel', ['--version'], { stdio: 'ignore' }).status === 0)) {
    arreter('rien ne peut mettre le site en ligne depuis ce poste : aucun dépôt distant « origin » et pas de CLI vercel liée (.vercel/project.json). Récupérer le site avec « gh repo clone virtuoseweb/createca », ou demander de l’aide.');
  }
  if (avecGit) {
    console.log('== Contrôles avant publication');
    const branche = git(['symbolic-ref', '--quiet', '--short', 'HEAD']).stdout.trim();
    if (branche !== 'main') arreter(`la publication se fait depuis la branche main (branche actuelle : ${branche || 'aucune'}). Revenir sur main avec « git switch main », puis relancer.`);
    if (!git(['config', 'user.email']).stdout.trim()) arreter('git ne connaît pas l’auteur des modifications. Lancer « git config --global user.name "Prénom Nom" » et « git config --global user.email adresse@exemple.fr », puis relancer.');
    const f = git(['fetch', '--quiet', 'origin', 'main']);
    if (f.status !== 0) arreter(`impossible de joindre le dépôt GitHub (${f.stderr.trim().split('\n').at(-1)}). Vérifier la connexion, puis l’accès avec « gh auth login » et « gh auth setup-git ».`);
    const enRetard = compter('HEAD..origin/main');
    if (enRetard > 0) arreter(MESSAGE_RETARD(enRetard));
    console.log('OK  branche main, à jour avec GitHub');
  }
  const hors = horsPerimetre(gitLire(['status', '--porcelain', '-z']));
  if (hors.suivis.length) arreter(`fichiers modifiés hors du périmètre publié : ${hors.suivis.join(', ')}. Ne rien annuler soi-même : montrer cette liste et demander quoi en faire.`);
  if (hors.nonSuivis.length) console.log(`Attention : nouveaux fichiers hors du périmètre publié, ils ne partent pas en ligne : ${hors.nonSuivis.join(', ')}`);

  const existants = CHEMINS_AUTORISES.filter((c) => existsSync(join(RACINE, c)));
  // Un commit déjà fait dont l'envoi a échoué part avec cette publication
  const nonEnvoyes = avecGit ? compter('origin/main..HEAD') : 0;
  const rienDeNouveau = gitLire(['status', '--porcelain', '-z', '--', ...existants]) === '' && nonEnvoyes === 0;
  if (rienDeNouveau && (opts.simuler || !avecGit)) arreter('aucun changement à publier.');

  if (!rienDeNouveau) {
    console.log('\n== Vérification complète');
    const v = spawnSync(process.execPath, [join(RACINE, 'scripts/cms/verifier.mjs')], { cwd: RACINE, stdio: 'inherit' });
    if (v.status !== 0) arreter('la vérification a échoué, rien n’est publié.');

    console.log('\n== Changements en attente');
    const statut = git(['status', '--short']).stdout;
    console.log(statut || '(aucun)');

    const ajout = git(['add', '--', ...existants]);
    if (ajout.status !== 0) arreter(`git add a échoué : ${ajout.stderr}`);
    const aCommiter = git(['diff', '--cached', '--quiet']).status !== 0;
    if (opts.simuler) {
      console.log('\nMode --simuler : fichiers ajoutés à l’index, aucun commit ni envoi.');
      console.log(git(['diff', '--cached', '--stat']).stdout);
      return;
    }
    if (aCommiter) {
      const commit = git(['commit', '-m', opts.message], { stdio: ['ignore', 'inherit', 'inherit'] });
      if (commit.status !== 0) arreter('le commit a échoué (voir le message de git ci-dessus).');
    }
  }

  // Actualités à contrôler : celles qui partent, ou, sans rien de nouveau (relance après une interruption), celles du dernier commit
  const nomStatut = avecGit && !rienDeNouveau
    ? gitLire(['diff', '--no-renames', '--name-status', 'origin/main', 'HEAD', '--', 'src/content/actualites'])
    : gitLire(['diff-tree', '--root', '--no-commit-id', '--no-renames', '--name-status', '-r', 'HEAD', '--', 'src/content/actualites']);
  const ids = idsActualites(nomStatut, (c) => { const f = join(RACINE, c); return existsSync(f) ? readFileSync(f, 'utf8') : undefined; });

  if (avecGit && rienDeNouveau) {
    console.log('\n== Aucun changement nouveau : rien n’est envoyé, contrôle de la version en ligne');
  } else if (avecGit) {
    console.log('\n== Envoi vers GitHub (Vercel construit alors le site)');
    const push = git(['push', 'origin', 'HEAD:main']);
    if (push.status !== 0) {
      // Refus parce que GitHub a avancé pendant la vérification : on le constate par l'état, pas par le texte de git (traduit)
      const retard = git(['fetch', '--quiet', 'origin', 'main']).status === 0 ? compter('HEAD..origin/main') : 0;
      if (retard > 0) arreter(`${MESSAGE_RETARD(retard)} Le commit est gardé en local et partira après cette mise à jour.\n${push.stderr.trim()}`);
      arreter(`l’envoi a échoué, rien n’est en ligne ; le commit est gardé en local et partira à la prochaine publication.\n${push.stderr.trim()}`);
    }
  }
  if (avecGit) {
    const suivi = urlSuivi(git(['remote', 'get-url', 'origin']).stdout);
    if (suivi) console.log(`Suivi du déploiement : ${suivi}`);
    const sha = gitLire(['rev-parse', 'HEAD']).trim();
    // Publié si la version en ligne est ce commit ou le contient (merge-base répond 0) ; commit inconnu : on récupère GitHub et on recommence
    const estPublie = (enLigne) => {
      let r = git(['merge-base', '--is-ancestor', sha, enLigne]);
      if (r.status > 1) { git(['fetch', '--quiet', 'origin', 'main']); r = git(['merge-base', '--is-ancestor', sha, enLigne]); }
      return r.status === 0;
    };
    console.log(`\n== Attente de la nouvelle version ${sha.slice(0, 7)} en ligne (maximum ${opts.attente} s)`);
    const enLigne = await attendreVersion(`${URL_PUBLIQUE}/`, estPublie, { delaiMax: opts.attente * 1000 });
    if (!enLigne.ok) arreter(`la nouvelle version n’est pas en ligne après ${opts.attente} s (${enLigne.statut}). Ouvrir le suivi du déploiement ; ne pas annoncer que le site est à jour.`);
    console.log(`OK  version ${sha.slice(0, 7)} en ligne`);
  } else {
    console.log('\n== Déploiement direct (vercel deploy --prod --yes)');
    const dep = spawnSync('vercel', ['deploy', '--prod', '--yes'], { cwd: RACINE, stdio: 'inherit' });
    if (dep.status !== 0) arreter('vercel deploy a échoué.');
  }

  // La nouvelle version est en ligne : chaque page doit répondre tout de suite
  console.log('\n== Contrôle de l’adresse publique');
  for (const url of urlsAControler(ids)) {
    const r = await attendre200(url, { delaiMax: 120_000 });
    if (!r.ok) arreter(`${url} ne répond pas 200 après 120 s (dernier état : ${r.statut}). Ouvrir le suivi Vercel pour lire le journal de construction.`);
    console.log(`OK  ${url} répond 200`);
  }
  console.log(rienDeNouveau ? '\nRien de nouveau à publier : la version en ligne est à jour.' : '\nPublication terminée.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await principal();
