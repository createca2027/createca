---
name: mettre-en-ligne
description: Vérifie puis publie les modifications du site Createca en ligne (build, commit, envoi, contrôle de l'adresse publique). À utiliser quand l'équipe dit publier, mettre en ligne, envoyer ou valider, ou à la fin de tout autre skill du site.
when_to_use: « mets ça en ligne », « publie », « c'est bon, on valide ».
---

# Mettre en ligne

1. **Résumer en langage simple** ce qui change : « Une actualité sera ajoutée : Portes ouvertes du 4 juillet 2027. Le tarif de l'atelier libre passe de 23 € à 25 €. » S'appuyer sur `git status --short` et `git diff`.
2. **Demander une confirmation explicite** : « Je publie maintenant sur le site. Confirmez-vous ? » Sans oui clair, ne pas publier. Les brouillons peuvent être publiés sans apparaître sur le site.
3. Lancer :
   ```
   npm run publier -- "Message court décrivant le changement"
   ```
   Le script enchaîne vérification (types, build, portes), commit, envoi vers GitHub (Vercel construit alors le site) ou déploiement direct, puis attend que `https://createca.vercel.app/` et la page de l'actualité répondent 200 (attente maximale 10 minutes, code 1 au dépassement). `--simuler` s'arrête avant le commit.
4. Donner le lien de la page publiée, par exemple `https://createca.vercel.app/actualites/<id>/`.

## En cas d'échec

- Build ou porte rouge : lire le message, l'expliquer simplement, corriger la cause dans les fichiers, relancer. **Ne jamais contourner une porte** (pas de suppression de contrôle, pas de publication forcée).
- Envoi impossible (droits, pas de remote) : l'expliquer, indiquer ce qu'il manque, ne pas bricoler. Le commit local est conservé.
- Délai dépassé : donner le lien de suivi affiché par le script (Vercel ou GitHub) et ne pas affirmer que le site est à jour.
- Ne jamais afficher un jeton ou une clé rencontrés.

## Règles communes (toujours)

- Ne rien inventer : aucun fait, chiffre, nom, lieu, horaire ou citation qui n’a pas été donné. Demander.
- Typographie française, jamais de tiret cadratin (U+2014). Espace insécable avant « : ; ? ! », « h » pour les heures (10 h 30).
- Texte simple et accessible : phrases courtes, public comprenant des personnes en situation de handicap.
- Confirmation explicite avant de supprimer ou de publier.
- Ne jamais afficher de secret (clé, mot de passe, jeton).
- Un `resume` fait 160 caractères au plus.
