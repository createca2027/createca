// Génère les taches de gouache et coups de pinceau du site, puis les cuit en WebP transparent.
// Les SVG sources (avec filtres) restent dans art/out/ ; les WebP vont dans src/assets/art/.
// Usage : node art/generate.mjs
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_SVG = join(root, 'art/out');
const OUT_WEBP = join(root, 'src/assets/art');
mkdirSync(OUT_SVG, { recursive: true });
mkdirSync(OUT_WEBP, { recursive: true });

// Pigments (mêmes valeurs que les tokens de global.css)
const PIGMENT = {
  cadmium: '#EE7F1A',
  ocre: '#E8B33C',
  cobalt: '#6F98CF',
  encre: '#12305C',
};

// Générateur pseudo-aléatoire déterministe (mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n) => Math.round(n * 10) / 10;

// Catmull-Rom fermé → courbes de Bézier cubiques
function closedPath(pts) {
  const n = pts.length;
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + 'Z';
}

// Tache : rayon modulé par quelques harmoniques
function blobPath({ cx, cy, r, seed, wobble = 0.22, stretch = 1, points = 40 }) {
  const rand = rng(seed);
  const harm = Array.from({ length: 5 }, (_, k) => ({ a: (wobble / (k + 1)) * (0.5 + rand()), ph: rand() * Math.PI * 2, k: k + 2 }));
  const pts = [];
  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    const m = 1 + harm.reduce((s, h) => s + h.a * Math.sin(h.k * t + h.ph), 0);
    pts.push([cx + Math.cos(t) * r * m * stretch, cy + Math.sin(t) * r * m]);
  }
  return closedPath(pts);
}

// Filtre gouache : bord déchiré, flaques de pigment inégales, granulation, liseré plus sombre au séchage
function gouacheFilter(id, { warp = 0.011, scale = 34, seed = 3, grain = 0.85, rim = 5, pool = 0.0065 } = {}) {
  return `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${warp}" numOctaves="4" seed="${seed}" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feTurbulence type="fractalNoise" baseFrequency="${pool}" numOctaves="3" seed="${seed + 3}" result="pool"/>
  <feColorMatrix in="pool" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.1 0 0 0 -0.45" result="poolA"/>
  <feComposite in="shape" in2="poolA" operator="in" result="pooled"/>
  <feTurbulence type="fractalNoise" baseFrequency="${grain}" numOctaves="2" seed="${seed + 7}" result="grain"/>
  <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.38" result="grainA"/>
  <feComposite in="pooled" in2="grainA" operator="in" result="grained"/>
  <feMorphology in="shape" operator="erode" radius="${rim}" result="inner"/>
  <feComposite in="shape" in2="inner" operator="out" result="ring"/>
  <feGaussianBlur in="ring" stdDeviation="1.4" result="ringSoft"/>
  <feComponentTransfer in="ringSoft" result="ringDark"><feFuncA type="linear" slope="0.8"/></feComponentTransfer>
  <feMerge><feMergeNode in="grained"/><feMergeNode in="ringDark"/></feMerge>
</filter>`;
}

// Coup de pinceau : ruban de largeur variable fait de soies, extrémité sèche
function brushStroke({ pts, width, seed, bristles = 38 }) {
  const rand = rng(seed);
  // échantillonne une courbe de Bézier cubique
  const [p0, p1, p2, p3] = pts;
  const N = 90;
  const center = [], normal = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const len = Math.hypot(dx, dy) || 1;
    center.push([x, y]);
    normal.push([-dy / len, dx / len]);
  }
  let paths = '';
  for (let b = 0; b < bristles; b++) {
    const off = (b / (bristles - 1) - 0.5) * width;
    const start = Math.floor(rand() * 6);
    const end = N - Math.floor(rand() * rand() * 38); // extrémité sèche, soies inégales
    const sw = (width / bristles) * (1.1 + rand() * 1.4);
    const op = 0.3 + rand() * 0.7;
    let d = '';
    for (let i = start; i <= end; i++) {
      // la pression monte puis retombe : le ruban s'affine aux deux bouts
      const t = i / N;
      const press = Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08)) ** 0.6;
      const jitter = (rand() - 0.5) * 1.2;
      const x = center[i][0] + normal[i][0] * (off * press + jitter);
      const y = center[i][1] + normal[i][1] * (off * press + jitter);
      // brosse qui se vide : ruptures de plus en plus fréquentes vers la fin du geste
      const gap = t > 0.45 && rand() < (t - 0.45) * 0.22;
      d += (d && !gap ? 'L' : 'M') + f1(x) + ' ' + f1(y);
    }
    paths += `<path d="${d}" stroke-width="${f1(sw)}" stroke-opacity="${f1(op)}"/>`;
  }
  return paths;
}

const pieces = [];

// 1. Grande tache orange du héros
pieces.push({
  name: 'tache-cadmium',
  w: 900, h: 760,
  body: `<g filter="url(#g)" fill="${PIGMENT.cadmium}" fill-opacity="0.78">
    <path d="${blobPath({ cx: 400, cy: 360, r: 250, seed: 14, wobble: 0.16, stretch: 1.1 })}"/>
    <path d="${blobPath({ cx: 640, cy: 520, r: 120, seed: 8, wobble: 0.2 })}"/>
    <path d="${blobPath({ cx: 790, cy: 640, r: 34, seed: 5, wobble: 0.3 })}"/>
    <circle cx="160" cy="655" r="16"/><circle cx="790" cy="170" r="9"/><circle cx="118" cy="140" r="6"/>
  </g>`,
  filter: gouacheFilter('g', { seed: 4, scale: 42 }),
});

// 2. Lavis bleu pâle
pieces.push({
  name: 'lavis-cobalt',
  w: 900, h: 700,
  body: `<g filter="url(#g)" fill="${PIGMENT.cobalt}" fill-opacity="0.42">
    <path d="${blobPath({ cx: 450, cy: 350, r: 290, seed: 23, wobble: 0.18, stretch: 1.25 })}"/>
  </g>`,
  filter: gouacheFilter('g', { seed: 9, scale: 50, warp: 0.008, rim: 7 }),
});

// 3. Coup de pinceau jaune en arc (écho du trait jaune de l'ancienne page d'accueil)
pieces.push({
  name: 'trait-ocre',
  w: 1000, h: 420,
  body: `<g filter="url(#g)" fill="none" stroke="${PIGMENT.ocre}" stroke-linecap="round">
    ${brushStroke({ pts: [[60, 300], [300, 60], [640, 120], [940, 250]], width: 74, seed: 31 })}
  </g>`,
  filter: gouacheFilter('g', { seed: 2, scale: 10, warp: 0.03, grain: 1.1, rim: 2 }),
});

// 4. Coup de pinceau d'encre, horizontal (bandeau de titre des pages intérieures)
pieces.push({
  name: 'trait-encre',
  w: 1000, h: 200,
  body: `<g filter="url(#g)" fill="none" stroke="${PIGMENT.cobalt}" stroke-linecap="round">
    ${brushStroke({ pts: [[40, 120], [300, 70], [650, 150], [960, 90]], width: 58, seed: 47, bristles: 22 })}
  </g>`,
  filter: gouacheFilter('g', { seed: 6, scale: 8, warp: 0.03, grain: 1.1, rim: 2 }),
});

// 5. Petites taches pour les pages intérieures (trois pigments)
[['tache-ocre-s', PIGMENT.ocre, 61], ['tache-cadmium-s', PIGMENT.cadmium, 67], ['tache-cobalt-s', PIGMENT.cobalt, 71]].forEach(([name, color, seed]) => {
  pieces.push({
    name,
    w: 520, h: 480,
    body: `<g filter="url(#g)" fill="${color}" fill-opacity="${color === PIGMENT.cobalt ? 0.55 : 0.85}">
      <path d="${blobPath({ cx: 260, cy: 240, r: 138, seed, wobble: 0.26, stretch: 1.05 })}"/>
      <circle cx="${70 + (seed % 5) * 20}" cy="410" r="11"/><circle cx="455" cy="${60 + (seed % 7) * 10}" r="7"/>
    </g>`,
    filter: gouacheFilter('g', { seed: seed % 13, scale: 30 }),
  });
});

// 6. Grain de papier (tuile répétée, très légère)
pieces.push({
  name: 'grain-papier',
  w: 240, h: 240,
  raw: `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="12" stitchTiles="stitch"/>
  <feColorMatrix type="matrix" values="0 0 0 0 0.07  0 0 0 0 0.19  0 0 0 0 0.36  0 0 0 -1.6 1.0"/></filter>
  <rect width="240" height="240" filter="url(#n)"/></svg>`,
});

for (const p of pieces) {
  const svg = p.raw ?? `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" viewBox="0 0 ${p.w} ${p.h}"><defs>${p.filter}</defs>${p.body}</svg>`;
  writeFileSync(join(OUT_SVG, `${p.name}.svg`), svg);
  const ext = p.name === 'grain-papier' ? 'png' : 'webp';
  const img = sharp(Buffer.from(svg), { density: 96 });
  await (ext === 'png' ? img.png({ compressionLevel: 9 }) : img.webp({ quality: 82, alphaQuality: 90, effort: 6 })).toFile(join(OUT_WEBP, `${p.name}.${ext}`));
  console.log('cuit', p.name);
}
