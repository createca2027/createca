// Optimise les tracés potrace de la plaquette Createca (emblème, figures) :
// coordonnées arrondies à l'entier, viewBox seule, couleur héritée (currentColor).
// Usage : node art/emblemes.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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
  writeFileSync(join(root, 'src/assets/emblemes', `${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path fill="#12305C" fill-rule="evenodd" d="${d}"/></svg>\n`);
  console.log(name, w, h, d.length);
}
writeFileSync(join(root, 'src/data/emblemes.ts'),
  '// Généré par art/emblemes.mjs à partir de la plaquette Createca (dessins vectorisés). Ne pas éditer à la main.\n' +
  `export const emblemes = ${JSON.stringify(out)} as const;\n`);
