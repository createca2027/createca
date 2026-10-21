import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyserArguments, attendre200, attendreVersion, horsPerimetre, idsActualites, urlSuivi, urlsAControler } from './publier.mjs';

test('arguments : message obligatoire, options valides', () => {
  assert.throws(() => analyserArguments([]), /message est obligatoire/);
  assert.throws(() => analyserArguments(['x', '--attente', '0']), /secondes positif/);
  assert.throws(() => analyserArguments(['A \u2014 B']), /cadratin/);
  assert.deepEqual(analyserArguments(['Ajout', 'des', 'portes', '--attente', '30', '--simuler']), { message: 'Ajout des portes', attente: 30, simuler: true });
  assert.equal(analyserArguments(['Mise à jour']).attente, 600);
});

test('ids des actualités publiées à contrôler', () => {
  const ns = 'A\tsrc/content/actualites/po-2027-07-04.md\nM\tsrc/content/actualites/brouillon.md\nD\tsrc/content/actualites/ancienne.md\nM\tsrc/content/actualites/image.jpg\nA\tsrc/data/site.ts';
  const lire = (c) => (c.endsWith('brouillon.md') ? '---\nbrouillon: true\n---\n' : '---\ntitre: x\n---\n');
  assert.deepEqual(idsActualites(ns, lire), ['po-2027-07-04']);
  assert.deepEqual(urlsAControler(['a']), ['https://createca.vercel.app/', 'https://createca.vercel.app/actualites/a/']);
});

test('url de suivi GitHub', () => {
  assert.equal(urlSuivi('git@github.com:org/createca.git\n'), 'https://github.com/org/createca/deployments');
  assert.equal(urlSuivi('https://github.com/org/createca'), 'https://github.com/org/createca/deployments');
  assert.equal(urlSuivi('https://gitlab.com/a/b'), undefined);
});

test('attente : réussit après des 404, échoue au délai dépassé', async () => {
  let t = 0; let n = 0;
  const base = { pause: 10, dormir: async (ms) => { t += ms; }, horloge: () => t };
  const ok = await attendre200('https://x/', { ...base, delaiMax: 100, requete: async () => (++n < 3 ? 404 : 200) });
  assert.deepEqual(ok, { ok: true, statut: 200 });
  assert.equal(n, 3);
  t = 0;
  const ko = await attendre200('https://x/', { ...base, delaiMax: 50, requete: async () => 404 });
  assert.deepEqual(ko, { ok: false, statut: 404 });
  t = 0;
  const err = await attendre200('https://x/', { ...base, delaiMax: 30, requete: async () => { throw new Error('réseau'); } });
  assert.equal(err.ok, false);
});

test('version : attend le commit envoyé ou un commit qui le contient, pas un simple 200 de l’ancienne version', async () => {
  let t = 0; let n = 0;
  const base = { pause: 10, dormir: async (ms) => { t += ms; }, horloge: () => t };
  const sha = 'a'.repeat(40);
  const page = (v) => `<head><meta name="createca-version" content="${v}"></head>`;
  const vus = [];
  const estPublie = (enLigne) => { vus.push(enLigne); return enLigne === sha || enLigne === 'c'.repeat(40); };
  const ok = await attendreVersion('https://x/', estPublie, { ...base, delaiMax: 100, lire: async () => page(++n < 3 ? 'b'.repeat(40) : sha) });
  assert.deepEqual(ok, { ok: true });
  assert.equal(n, 3);
  assert.deepEqual(vus, ['b'.repeat(40), 'b'.repeat(40), sha]);
  t = 0;
  const plusRecent = await attendreVersion('https://x/', estPublie, { ...base, delaiMax: 50, lire: async () => page('c'.repeat(40)) });
  assert.deepEqual(plusRecent, { ok: true });
  t = 0;
  const ancienne = await attendreVersion('https://x/', estPublie, { ...base, delaiMax: 50, lire: async () => page('b'.repeat(40)) });
  assert.deepEqual(ancienne, { ok: false, statut: 'version bbbbbbb en ligne' });
  t = 0;
  const absente = await attendreVersion('https://x/', estPublie, { ...base, delaiMax: 30, lire: async () => '<head></head>' });
  assert.deepEqual(absente, { ok: false, statut: 'version absente de la page' });
});

test('périmètre : fichiers suivis modifiés hors des chemins publiés', () => {
  const porcelain = [
    ' M src/data/site.ts', 'M  plugins/createca/skills/x/SKILL.md', 'R  .claude/skills/a/SKILL.md -> plugins/createca/skills/a/SKILL.md',
    ' M tsconfig.json', ' M README.md', ' D vercel.json', '?? notes.txt', ' M src-copie/x.ts', ' M "docs/guide équipe.md"',
  ].join('\n');
  assert.deepEqual(horsPerimetre(porcelain), ['README.md', 'vercel.json', 'src-copie/x.ts']);
  assert.deepEqual(horsPerimetre(''), []);
});
