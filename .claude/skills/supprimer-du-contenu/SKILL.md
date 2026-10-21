---
name: supprimer-du-contenu
description: Retire une actualité, une page, une photo, un témoignage ou toute autre information du site Createca, de façon sûre. À utiliser dès que l'équipe demande de supprimer, retirer, enlever ou dépublier quelque chose.
when_to_use: « supprime l'actualité X », « retire la photo de l'exposition Y », « enlève ce témoignage », « cette page ne doit plus être en ligne ».
---

# Supprimer du contenu

## Ordre de préférence

1. **Brouillon, réversible** : pour une actualité, mettre `brouillon: true` dans l'en-tête. Elle disparaît du site et reste dans le dépôt. Proposer ceci en premier.
2. **Suppression** : seulement si l'utilisateur la veut vraiment.

## Avant de supprimer

1. Identifier précisément l'élément (chemin et titre) et le montrer à l'utilisateur.
2. Chercher les liens entrants : `rg -n "<id ou nom de fichier>" src public` (et l'URL `/actualites/<id>/`). Lister ce qui pointe vers l'élément, y compris la galerie (`actualite:` dans `src/data/expositions.ts`) et les pages `src/content/pages/`. Proposer de corriger ces liens dans le même lot.
3. **Demander une confirmation explicite** : « Je supprime X, ces pages y renvoient : … Confirmez-vous ? ». Ne rien supprimer sans réponse claire.
4. Pour une **page entière** ou une actualité déjà en ligne : prévenir qu'une redirection est nécessaire (sinon l'ancienne adresse donne une erreur 404 et perd son référencement). Ajouter la redirection ou, à défaut, passer en brouillon et signaler la limite.

## Faire

Supprimer le fichier (ou la ligne de données) et les médias devenus orphelins après vérification par `rg`. Puis `npm run verifier` (il détecte les liens cassés). Résumer, puis skill `mettre-en-ligne`. Retour arrière : voir `docs/guide-equipe.md`.

## Règles communes (toujours)

- Ne rien inventer : aucun fait, chiffre, nom, lieu, horaire ou citation qui n’a pas été donné. Demander.
- Typographie française, jamais de tiret cadratin (U+2014). Espace insécable avant « : ; ? ! », « h » pour les heures (10 h 30).
- Texte simple et accessible : phrases courtes, public comprenant des personnes en situation de handicap.
- Confirmation explicite avant de supprimer ou de publier.
- Ne jamais afficher de secret (clé, mot de passe, jeton).
- Un `resume` fait 160 caractères au plus.
