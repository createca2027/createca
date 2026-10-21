// Favicons à partir de l'emblème ovale (dessin de la plaquette) : SVG + PNG 32, 180, 512.
// Usage : node art/favicons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const src = readFileSync(new URL('../src/data/emblemes.ts', import.meta.url), 'utf8');
const m = src.match(/"embleme-ovale":\{"viewBox":"([^"]+)","d":"([^"]+)"/) ?? src.match(/'embleme-ovale':\s*\{\s*viewBox:\s*'([^']+)',\s*d:\s*'([^']+)'/);
if (!m) throw new Error('emblème ovale introuvable dans src/data/emblemes.ts');
const [, viewBox, d] = m;
const [, , w, h] = viewBox.split(/\s+/).map(Number);
// Carré papier aux coins arrondis, emblème centré à 84 % de la hauteur
const cote = Math.max(w, h) / 0.84;
const x = (cote - w) / 2, y = (cote - h) / 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cote.toFixed(0)} ${cote.toFixed(0)}">` +
  `<rect width="100%" height="100%" rx="${(cote * 0.2).toFixed(0)}" fill="#fcfcfa"/>` +
  `<path transform="translate(${x.toFixed(0)} ${y.toFixed(0)})" fill="#12305C" fill-rule="evenodd" d="${d}"/></svg>`;
// Le SVG (58 ko) n'est pas publié : trop lourd pour une icône ; les PNG suffisent.
for (const [taille, nom] of [[48, 'favicon-48.png'], [180, 'apple-touch-icon.png'], [512, 'icon-512.png']]) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(taille, taille).png().toFile(new URL(`../public/${nom}`, import.meta.url).pathname);
}
console.log('favicons écrits', (svg.length / 1024).toFixed(1), 'ko');
