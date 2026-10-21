import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyserArguments, attendre200, idsActualites, urlSuivi, urlsAControler } from './publier.mjs';

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
