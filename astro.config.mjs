// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Polices auto-hébergées (fichiers woff2 latin de @fontsource), servies par l'API Fonts d'Astro :
// @font-face générés, police de repli aux métriques ajustées (pas de saut de mise en page),
// préchargement limité aux deux graisses du premier écran (voir Base.astro).
/** @typedef {'normal' | 'italic'} Style */
/** @param {number} graisse @param {Style} style */
const alegreya = (graisse, style) => ({
  src: /** @type {[string]} */ ([`./node_modules/@fontsource/alegreya/files/alegreya-latin-${graisse}-${style}.woff2`]), weight: graisse, style,
});
/** @param {number} graisse @param {Style} style */
const alegreyaSans = (graisse, style) => ({
  src: /** @type {[string]} */ ([`./node_modules/@fontsource/alegreya-sans/files/alegreya-sans-latin-${graisse}-${style}.woff2`]), weight: graisse, style,
});

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://createca.vercel.app',
  trailingSlash: 'always',
  adapter: vercel(),
  // CSS (≈ 10 Ko) intégré au HTML : aucune feuille bloquante à télécharger avant le premier rendu
  build: { inlineStylesheets: 'always' },
  fonts: [
    {
      provider: fontProviders.local(), name: 'Alegreya', cssVariable: '--font-alegreya',
      fallbacks: ['Iowan Old Style', 'Georgia', 'serif'],
      options: { variants: [alegreya(500, 'normal'), alegreya(600, 'normal'), alegreya(500, 'italic')] },
    },
    {
      provider: fontProviders.local(), name: 'Alegreya Sans', cssVariable: '--font-alegreya-sans',
      fallbacks: ['Gill Sans', 'Segoe UI', 'sans-serif'],
      options: { variants: [alegreyaSans(400, 'normal'), alegreyaSans(400, 'italic'), alegreyaSans(500, 'normal'), alegreyaSans(700, 'normal')] },
    },
  ],
  integrations: [sitemap({ filter: (page) => !page.includes('/merci/') })],
  vite: { plugins: [tailwindcss()] },
});
