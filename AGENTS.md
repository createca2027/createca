# Createca : instructions pour l'agent

Site Astro 7 de Createca, centre d'art-thérapie et organisme de formation à Bordeaux. Production : https://createca.vercel.app (Vercel, construit depuis la branche `main` du dépôt GitHub `virtuoseweb/createca`). L'équipe n'est pas technique : elle te parle en français courant. Il n'y a pas de CMS : tu modifies les fichiers du dépôt, tu vérifies, tu montres, tu demandes confirmation, puis tu publies.

## Skills (plugin Claude `createca` dans `plugins/createca/skills/`, lus par Codex via `.agents/skills/`)

- `publier-une-actualite` : annoncer, écrire, ajouter (portes ouvertes, événement, formation, certifiés, article…).
- `modifier-le-site` : changer un tarif, une coordonnée, un horaire, un texte de page, la liste des certifiés.
- `supprimer-du-contenu` : retirer quelque chose (brouillon d'abord, liens entrants, confirmation).
- `ajouter-des-photos` : emplacement, taille, texte alternatif, personnes.
- `mettre-en-ligne` : résumé, confirmation, publication, contrôle de l'adresse publique.

## Commandes

- `npm run actu:nouvelle -- --type <type> --titre "<titre>" [--date AAAA-MM-JJ] [--fin ...] [--limite ...] [--resume "..."] [--brouillon]`
- `npm run verifier` : `astro check`, `astro build`, puis portes (U+2014, `resume` ≤ 160, alt des images, « à remplacer », liens internes).
- `npm run publier -- "<message>"` : contrôle la branche `main` et le retard sur GitHub, vérifie, commit, envoie, attend la nouvelle version en ligne puis les réponses 200 (plusieurs minutes : arrière-plan si possible). Relancée sans rien de nouveau, par exemple après une interruption, elle ne renvoie rien et vérifie seulement la version en ligne.
- `npm run test:cms` : tests des scripts.

## Règles (non négociables)

1. Ne rien inventer : aucun fait, chiffre, nom, lieu, horaire ou citation non donné. Poser la question.
2. Typographie française ; AUCUN tiret cadratin (U+2014) ; espaces insécables avant `: ; ? !`.
3. Confirmation explicite de l'utilisateur avant de supprimer ou de publier.
4. Ne jamais afficher de secret ; ne jamais contourner une porte de `npm run verifier`.
5. `resume` d'une actualité : 160 caractères au plus. Textes simples, accessibles ; texte alternatif des images fourni par l'humain.
6. Une information = un seul endroit. Pas de `git add -A`, pas de modification hors du périmètre demandé.

## Carte du contenu

- `src/content/actualites/<id>.md` : une actualité par fichier (en-tête validé par `src/content.config.ts`, page `/actualites/<id>/`). Types : article, atelier, certifications, evenement, exposition, formation, information, portes-ouvertes, publication, qualite, rencontre, reprise, soutien.
- `src/content/pages/*.md` : textes longs des pages ; `{#ancre}` et `<!-- img: cle -->` à conserver.
- `src/data/site.ts` : `site` (coordonnées, Qualiopi, mentions), `plan`, `raccourcis`, `ateliers`, `activites`/`jours`/`creneaux`, `tarifs`, `formation`.
- `src/data/certifications.json`, `partenaires.json`, `temoignages.json`, `expositions.ts` (photos dans `src/assets/photos/expos/<id>/`).
- `src/pages/*.astro` : structure et textes d'interface (dernier recours). `public/documents/` : PDF.

## Limite

Publier exige un agent qui a accès au dépôt : Claude Code ou Codex (Codex doit être autorisé à écrire dans `.git` et à utiliser le réseau). ChatGPT en simple conversation ne peut pas publier ; il peut seulement aider à rédiger un texte à transmettre. Guide pour l'équipe : `docs/guide-equipe.md`.
