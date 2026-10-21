import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blocImage, champ, extraireLiens, lienExiste, liensImbriques, porteAlt, porteARemplacer, porteLiens, porteNomsActualites, porteResume, porteTiretCadratin, separer } from './verifier.mjs';

const f = (texte, chemin = 'src/content/actualites/x.md') => [{ chemin, texte }];

test('tiret cadratin détecté avec la ligne', () => {
  assert.equal(porteTiretCadratin(f('a\nb \u2014 c')).problemes.length, 1);
  assert.match(porteTiretCadratin(f('a\nb \u2014 c')).problemes[0], /x\.md:2/);
  assert.equal(porteTiretCadratin(f('tiret court - et demi – ok')).problemes.length, 0);
});

test('resume : limite à 160, scalaires entre guillemets et blocs pliés', () => {
  assert.equal(porteResume(f(`---\nresume: "${'a'.repeat(160)}"\n---\n`)).problemes.length, 0);
  assert.equal(porteResume(f(`---\nresume: "${'a'.repeat(161)}"\n---\n`)).problemes.length, 1);
  assert.equal(porteResume(f(`---\nresume: >\n  ${'a'.repeat(100)}\n  ${'b'.repeat(70)}\n---\n`)).problemes.length, 1);
  assert.equal(porteResume(f('---\ntitre: x\n---\n')).problemes.length, 0);
});

test('alt : en-tête, Markdown et img', () => {
  assert.equal(porteAlt(f(`---\nimage:\n  src: './a.jpg'\n  alt: 'Un atelier'\n---\n`)).problemes.length, 0);
  assert.equal(porteAlt(f(`---\nimage:\n  src: './a.jpg'\n  alt: ''\n---\n`)).problemes.length, 1);
  assert.equal(porteAlt(f(`---\nimage:\n  src: './a.jpg'\n---\n`)).problemes.length, 1);
  assert.equal(porteAlt(f('---\n---\n![](a.jpg)')).problemes.length, 1);
  assert.equal(porteAlt(f('---\n---\n![Peinture](a.jpg)')).problemes.length, 0);
  assert.equal(porteAlt(f('---\n---\n<img src="a.jpg">')).problemes.length, 1);
  assert.equal(porteAlt(f('---\n---\n<img src="a.jpg" alt="">')).problemes.length, 1);
  assert.equal(porteAlt(f('---\n---\n<img src="a.jpg" alt="Texte">')).problemes.length, 0);
  assert.equal(blocImage('image: { src: "./a.jpg", alt: "Bleu" }').alt, 'Bleu');
});

test('à remplacer : toléré en brouillon seulement', () => {
  const corps = '<!-- à remplacer : horaires -->';
  assert.equal(porteARemplacer(f(`---\ntitre: x\n---\n${corps}`)).problemes.length, 1);
  assert.equal(porteARemplacer(f(`---\nbrouillon: true\n---\n${corps}`)).problemes.length, 0);
  assert.equal(porteARemplacer(f(`---\nbrouillon: false\n---\n${corps}`)).problemes.length, 1);
});

test('séparation et champs de frontmatter', () => {
  const { entete, corps } = separer('---\ntitre: "Bonjour : monde"\nannee: 2027\n---\nTexte');
  assert.equal(champ(entete, 'titre'), 'Bonjour : monde');
  assert.equal(champ(entete, 'annee'), '2027');
  assert.equal(corps, 'Texte');
});

test('liens internes : extraction et existence dans dist/client', () => {
  const html = '<a href="/ateliers/">a</a><a href="//cdn.x/y">b</a><a href="/documents/p.pdf?x=1#z">c</a><a href="https://e.fr/">d</a><a href="/absente/">e</a><a href="#haut">f</a>';
  assert.deepEqual(extraireLiens(html).sort(), ['/absente/', '/ateliers/', '/documents/p.pdf']);
  const dist = mkdtempSync(join(tmpdir(), 'dist-'));
  mkdirSync(join(dist, 'ateliers'));
  mkdirSync(join(dist, 'documents'));
  writeFileSync(join(dist, 'ateliers/index.html'), '<a href="/documents/p.pdf">x</a><a href="/absente/">y</a>');
  writeFileSync(join(dist, 'documents/p.pdf'), 'pdf');
  assert.equal(lienExiste('/ateliers/', dist), true);
  assert.equal(lienExiste('/documents/p.pdf', dist), true);
  assert.equal(lienExiste('/absente/', dist), false);
  const r = porteLiens(dist);
  assert.equal(r.problemes.length, 1);
  assert.match(r.problemes[0], /« \/absente\/ »/);
  rmSync(dist, { recursive: true });
});

test('liens imbriqués : une adresse dans un <a> brut, reliée une seconde fois', () => {
  assert.equal(liensImbriques('<p><a href="mailto:x@y.fr"><a href="mailto:x@y.fr">x@y.fr</a></a></p>'), 1);
  assert.equal(liensImbriques('<a href="/a/">a</a><abbr>b</abbr><article><a href="/c/">c</a></article><address>d</address>'), 0);
  assert.equal(liensImbriques('<script>const s = "<a href=1><a href=2>";</script><a href="/a/">a</a>'), 0);
});

test('noms des actualités : format de l’adresse, pas de sous-dossier ni de slug', () => {
  const f = (chemin, entete = 'titre: x') => ({ chemin: `src/content/actualites/${chemin}`, texte: `---\n${entete}\n---\ncorps\n` });
  assert.deepEqual(porteNomsActualites([f('portes-ouvertes-2027-07-04.md'), f('certifications-2023-b.md')]).problemes, []);
  const p = porteNomsActualites([f('Portes-Ouvertes.md'), f('fête-2027.md'), f('refonte-2026/note.md'), f('bon-nom.md', 'titre: x\nslug: autre-adresse')]).problemes;
  assert.equal(p.length, 4);
  assert.match(p[3], /slug/);
});
