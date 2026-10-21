import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyserArguments, construireId, creer, dateValide, slugifier, valider, ErreurActu } from './actu-nouvelle.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'actu-'));
const AUJ = '2026-10-21';

test('dateValide refuse les jours inexistants', () => {
  assert.equal(dateValide('2027-07-04'), true);
  assert.equal(dateValide('2027-02-29'), false);
  assert.equal(dateValide('2028-02-29'), true);
  assert.equal(dateValide('2027-13-01'), false);
  assert.equal(dateValide('04/07/2027'), false);
});

test('slugifier retire accents et ponctuation', () => {
  assert.equal(slugifier('Un nouvel atelier : œuvres & « lumière » !'), 'un-nouvel-atelier-oeuvres-lumiere');
});

test('construireId suit la convention', () => {
  assert.equal(construireId({ type: 'portes-ouvertes', date: '2027-07-04', annee: 2027 }), 'portes-ouvertes-2027-07-04');
  assert.equal(construireId({ type: 'formation', limite: '2027-01-15', annee: 2027 }), 'formation-2027-01');
  assert.equal(construireId({ type: 'certifications', annee: 2027 }), 'certifications-2027');
  assert.equal(construireId({ type: 'article', titre: 'Notre nouvel atelier', annee: 2026 }), 'notre-nouvel-atelier-2026');
});

test('portes ouvertes : frontmatter exact et corps avec indications', () => {
  const dossier = tmp();
  const r = creer({ type: 'portes-ouvertes', titre: 'Portes ouvertes à Createca', date: '2027-07-04' }, { dossier, aujourdhuiTexte: AUJ });
  assert.equal(r.id, 'portes-ouvertes-2027-07-04');
  assert.equal(r.url, '/actualites/portes-ouvertes-2027-07-04/');
  const texte = readFileSync(r.chemin, 'utf8');
  assert.ok(texte.startsWith('---\ntitre: "Portes ouvertes à Createca"\ntype: portes-ouvertes\nannee: 2027\ndate: \'2027-07-04\'\n---\n'));
  assert.match(texte, /<!-- à remplacer : horaires/);
  assert.doesNotMatch(texte, /publie:/);
  rmSync(dossier, { recursive: true });
});

test('article : publie = aujourd’hui, annee de la publication, resume repris', () => {
  const dossier = tmp();
  const r = creer({ type: 'article', titre: 'Notre nouvel atelier', resume: 'Un atelier pour peindre ensemble.', brouillon: true }, { dossier, aujourdhuiTexte: AUJ });
  const texte = readFileSync(r.chemin, 'utf8');
  assert.match(texte, /annee: 2026\n/);
  assert.match(texte, /publie: '2026-10-21'\n/);
  assert.match(texte, /resume: "Un atelier pour peindre ensemble\."\n/);
  assert.match(texte, /brouillon: true\n/);
  assert.doesNotMatch(texte, /ajouter « resume: »/);
  rmSync(dossier, { recursive: true });
});

test('refuse un id déjà existant sans écraser', () => {
  const dossier = tmp();
  const v = { type: 'reprise', titre: 'Reprise', date: '2027-09-03' };
  const r = creer(v, { dossier, aujourdhuiTexte: AUJ });
  const avant = readFileSync(r.chemin, 'utf8');
  assert.throws(() => creer({ ...v, titre: 'Autre titre' }, { dossier, aujourdhuiTexte: AUJ }), (e) => e instanceof ErreurActu && /existe déjà/.test(e.message));
  assert.equal(readFileSync(r.chemin, 'utf8'), avant);
  assert.equal(readdirSync(dossier).length, 1);
  rmSync(dossier, { recursive: true });
});

test('refuse type inconnu, dates invalides, fin antérieure, date manquante, résumé trop long', () => {
  const ok = { type: 'evenement', titre: 'X', date: '2027-05-10' };
  assert.throws(() => valider({ ...ok, type: 'blog' }), /Type inconnu/);
  assert.throws(() => valider({ ...ok, date: '2027-02-30' }), /Date invalide/);
  assert.throws(() => valider({ ...ok, fin: '2027-05-09' }), /antérieure au début/);
  assert.throws(() => valider({ type: 'evenement', titre: 'X' }), /demande la date/);
  assert.throws(() => valider({ ...ok, fin: '2027-05-12', date: undefined }), /demande aussi --date/);
  assert.throws(() => valider({ ...ok, resume: 'a'.repeat(161) }), /161 caractères/);
  assert.throws(() => valider({ ...ok, titre: '   ' }), /titre est obligatoire/);
  assert.throws(() => valider({ ...ok, titre: 'A \u2014 B' }), /cadratin/);
  assert.doesNotThrow(() => valider({ ...ok, fin: '2027-05-10' }));
  assert.doesNotThrow(() => valider({ ...ok, resume: 'a'.repeat(160) }));
});

test('analyserArguments lit les options et refuse les inconnues', () => {
  const v = analyserArguments(['--type', 'atelier', '--titre', 'Atelier libre', '--brouillon', '--limite=2027-01-15']);
  assert.deepEqual({ type: v.type, titre: v.titre, brouillon: v.brouillon, limite: v.limite }, { type: 'atelier', titre: 'Atelier libre', brouillon: true, limite: '2027-01-15' });
  assert.throws(() => analyserArguments(['--inconnu', 'x']));
});

test('un id explicite invalide est refusé', () => {
  assert.throws(() => valider({ type: 'atelier', titre: 'X', id: 'Café 2027' }), /Identifiant invalide/);
});

test('annee : première valeur parmi date, limite, publie ; autres années refusées', () => {
  assert.equal(valider({ type: 'formation', titre: 'X', limite: '2027-01-15' }, { aujourdhuiTexte: AUJ }).annee, 2027);
  assert.equal(valider({ type: 'portes-ouvertes', titre: 'X', date: '2027-07-04', limite: '2027-06-01' }, { aujourdhuiTexte: AUJ }).annee, 2027);
  assert.equal(valider({ type: 'article', titre: 'X' }, { aujourdhuiTexte: AUJ }).annee, 2026);
  assert.equal(valider({ type: 'article', titre: 'X', date: '2027-03-01' }, { aujourdhuiTexte: AUJ }).annee, 2027);
  assert.equal(valider({ type: 'information', titre: 'X' }, { aujourdhuiTexte: AUJ }).annee, 2026);
  assert.throws(() => valider({ type: 'exposition', titre: 'X', date: '2026-12-20', fin: '2027-01-10' }), /pas dans l’année 2026/);
  assert.throws(() => valider({ type: 'evenement', titre: 'X', date: '2027-01-10', limite: '2026-12-20' }), /pas dans l’année 2027/);
});
