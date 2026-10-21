// Optimise les tracés potrace de la plaquette Createca (emblème, figures) :
// coordonnées arrondies à l'entier, viewBox seule. Écrit un fichier SVG encre et un fichier
// papier (pour fond sombre) par dessin, servis en <img> et mis en cache entre les pages,
// plus un logo raster léger pour l'en-tête (l'ovale fait 58 Ko en vectoriel).
// Usage : node art/emblemes.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const names = ['embleme-rayonnant', 'embleme-ovale', 'figure-marche', 'figures-deux'];
const out = {};
for (const name of names) {
  const svg = readFileSync(join(root, 'art/trace', `${name}.svg`), 'utf8');
  const w = +svg.match(/width="(\d+(?:\.\d+)?)"/)[1];
  const h = +svg.match(/height="(\d+(?:\.\d+)?)"/)[1];
  const d = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join(' ')
    .replace(/-?\d+\.\d+/g, (n) => String(Math.round(+n)))
    .replace(/\s+/g, ' ').replace(/ ?([MCLZ]) ?/g, '$1').trim();
  out[name] = { viewBox: `0 0 ${w} ${h}`, d };
  const fichier = (couleur) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path fill="${couleur}" fill-rule="evenodd" d="${d}"/></svg>\n`;
  writeFileSync(join(root, 'src/assets/emblemes', `${name}.svg`), fichier('#12305C'));
  // Variante papier : seul l'emblème rayonnant est posé sur fond encre (pied de page)
  if (name === 'embleme-rayonnant') writeFileSync(join(root, 'src/assets/emblemes', `${name}-papier.svg`), fichier('#FCFCFA'));
  if (name === 'embleme-ovale') {
    // Logo d'en-tête : 44 px de haut à l'écran, rendu à 3x
    await sharp(Buffer.from(fichier('#12305C')), { density: 200 }).resize({ height: 132 }).png().toFile(join(root, 'src/assets/emblemes/logo-ovale.png'));
  }
  console.log(name, w, h, d.length);
}
writeFileSync(join(root, 'src/data/emblemes.ts'),
  '// Généré par art/emblemes.mjs à partir de la plaquette Createca (dessins vectorisés). Ne pas éditer à la main.\n' +
  `export const emblemes = ${JSON.stringify(out)} as const;\n`);
