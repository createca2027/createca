---
name: mettre-en-ligne
description: Vérifie puis publie les modifications du site Createca en ligne (build, commit, envoi, contrôle de l'adresse publique). À utiliser quand l'équipe dit publier, mettre en ligne, envoyer ou valider, ou à la fin de tout autre skill du site.
when_to_use: « mets ça en ligne », « publie », « c'est bon, on valide ».
---

# Mettre en ligne

1. **Résumer en langage simple** ce qui change : « Une actualité sera ajoutée : Portes ouvertes du 4 juillet 2027. Le tarif de l'atelier libre passe de 23 € à 25 €. » S'appuyer sur `git status --short` et `git diff`.
2. **Demander une confirmation explicite** : « Je publie maintenant sur le site. Confirmez-vous ? » Sans oui clair, ne pas publier. Les brouillons peuvent être publiés sans apparaître sur le site.
3. Lancer, avec le délai maximal de l'outil (10 minutes) ou en arrière-plan, puis attendre la ligne « Publication terminée. » ou « ARRÊT : … » :
   ```
   npm run publier -- "Message court décrivant le changement"
   ```
   Le script contrôle d'abord la branche (`main`) et que la copie locale est à jour avec GitHub. Il enchaîne ensuite vérification (types, build, portes), commit, envoi vers GitHub (Vercel construit alors le site), puis attend que l'accueil porte la nouvelle version (`<meta name="createca-version">`), car l'ancienne répond déjà 200. Il contrôle enfin `https://createca.vercel.app/` et la page de chaque actualité ajoutée ou modifiée. `--simuler` s'arrête avant le commit.
4. Donner le lien de la page publiée, par exemple `https://createca.vercel.app/actualites/<id>/`.

## En cas d'échec

- Build ou porte rouge : lire le message, l'expliquer simplement, corriger la cause dans les fichiers, relancer. **Ne jamais contourner une porte** (pas de suppression de contrôle, pas de publication forcée).
- « modification(s) publiée(s) depuis un autre poste » : lancer `git pull --rebase --autostash origin main`, puis relancer. En cas de conflit, l'expliquer et demander de l'aide. **Jamais de `git push --force`**, jamais de `git reset --hard`.
- Envoi impossible : lire le message de git affiché, l'expliquer simplement. Le commit reste en local et partira à la prochaine publication (relancer la même commande). Accès GitHub manquant : `gh auth login` puis `gh auth setup-git`.
- Sous Codex : la publication écrit dans `.git` et utilise le réseau ; demander l'autorisation correspondante plutôt que de contourner.
- Délai dépassé : donner le lien de suivi affiché par le script et ne pas affirmer que le site est à jour.
- Ne jamais afficher un jeton ou une clé rencontrés.

## Règles communes (toujours)

- Dossier : ne travailler que dans le dépôt du site Createca (son `AGENTS.md` commence par « # Createca », il contient `src/content/actualites/`). Ailleurs, ne rien modifier et demander d’ouvrir le dossier du site.
- Ne rien inventer : aucun fait, chiffre, nom, lieu, horaire ou citation qui n’a pas été donné. Demander.
- Typographie française, jamais de tiret cadratin (U+2014). Espace insécable avant « : ; ? ! », « h » pour les heures (10 h 30).
- Texte simple et accessible : phrases courtes, public comprenant des personnes en situation de handicap.
- Confirmation explicite avant de supprimer ou de publier.
- Ne jamais afficher de secret (clé, mot de passe, jeton).
- Un `resume` fait 160 caractères au plus.
