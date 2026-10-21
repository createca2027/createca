import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

type Options = { alt: string; legende?: string; largeur?: number; incline?: number; ruban?: boolean; classe?: string };

/** Tirage photo en HTML (pour l'insérer dans une page Markdown), en WebP avec variante 2x. */
export async function figureHtml(src: ImageMetadata, { alt, legende, largeur, incline = -1.2, ruban = false, classe = 'en-marge' }: Options) {
  const l = Math.min(largeur ?? src.width, src.width);
  const widths = [...new Set([l, Math.min(l * 2, src.width)])];
  const img = await getImage({ src, width: l, widths, sizes: `${l}px`, format: 'webp' });
  return `<figure class="tirage ${classe}"${ruban ? ' data-ruban' : ''} style="--incline:${incline}deg">` +
    `<img src="${img.src}" srcset="${img.srcSet.attribute}" sizes="${l}px" width="${img.attributes.width}" height="${img.attributes.height}" alt="${esc(alt)}" loading="lazy" decoding="async">` +
    (legende ? `<figcaption>${esc(legende)}</figcaption>` : '') + `</figure>`;
}

/** Plusieurs tirages côte à côte */
export async function groupeHtml(items: (Options & { src: ImageMetadata })[]) {
  const figures = await Promise.all(items.map(({ src, ...o }) => figureHtml(src, { classe: '', ...o })));
  return `<div class="groupe-tirages">${figures.join('')}</div>`;
}
