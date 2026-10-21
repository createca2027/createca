import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Types d'actualité. `article` est un texte long publié à une date ; les autres sont des annonces. */
export const TYPES = [
  'article', 'atelier', 'certifications', 'evenement', 'exposition', 'formation', 'information',
  'portes-ouvertes', 'publication', 'qualite', 'rencontre', 'reprise', 'soutien',
] as const;

const jour = z.string().refine(
  (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s,
  { message: 'date attendue au format AAAA-MM-JJ, jour existant' },
);

/**
 * Une actualité = un fichier `src/content/actualites/<id>.md`. L'id est le nom du fichier.
 * Créer, modifier ou supprimer l'actualité = ajouter, éditer ou supprimer ce fichier :
 * le build échoue si le frontmatter ne respecte pas ce schéma.
 *
 * - date : jour de l'événement ; dateFin : dernier jour ; limite : date limite d'inscription ;
 * - publie : date de publication (obligatoire pour `article`) ;
 * - ordre : rang dans l'année pour une entrée migrée sans date (ordre de l'ancien fichier JSON,
 *   croissant). Les entrées sans date ni ordre passent en dernier, par id ;
 * - brouillon : true = ni listée ni construite.
 */
const actualites = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/actualites' }),
  schema: ({ image }) =>
    z.object({
      titre: z.string().trim().min(1),
      type: z.enum(TYPES),
      annee: z.number().int().min(2000).max(2100),
      date: jour.optional(),
      dateFin: jour.optional(),
      limite: jour.optional(),
      publie: jour.optional(),
      ordre: z.number().int().optional(),
      resume: z.string().trim().min(1).max(160).optional(),
      image: z.object({ src: image(), alt: z.string().trim().min(1) }).optional(),
      brouillon: z.boolean().default(false),
    }).superRefine((d, ctx) => {
      const erreur = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
      if (d.type === 'article' && !d.publie) erreur('publie', 'un article exige la date de publication (publie: "AAAA-MM-JJ")');
      if (d.type === 'portes-ouvertes' && !d.date) erreur('date', 'des portes ouvertes exigent la date (date: "AAAA-MM-JJ")');
      if (d.dateFin && d.date && d.dateFin < d.date) erreur('dateFin', 'dateFin doit être postérieure ou égale à date');
      for (const champ of ['date', 'limite'] as const) {
        const v = d[champ];
        if (v && Number(v.slice(0, 4)) !== d.annee) erreur(champ, `${champ} (${v}) doit tomber dans l'année ${d.annee}`);
      }
    }),
});

export const collections = { actualites };
