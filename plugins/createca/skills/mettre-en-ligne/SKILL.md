---
name: mettre-en-ligne
description: Vérifie puis publie les modifications du site Createca en ligne (build, commit, envoi, contrôle de l'adresse publique). À utiliser quand l'équipe dit publier, mettre en ligne, envoyer ou valider, ou à la fin de tout autre skill du site.
when_to_use: « mets ça en ligne », « publie », « c'est bon, on valide ».
---

# Mettre en ligne

1. **Résumer en langage simple** ce qui change : « Une actualité sera ajoutée : Portes ouvertes du 4 juillet 2027. Le tarif de l'atelier libre passe de 23 € à 25 €. » S'appuyer sur tout ce qui n'est pas encore en ligne : `git status --short` (dont les nouveaux fichiers), `git diff origin/main` (modifications indexées ou non et commits pas encore envoyés) et `git log --oneline origin/main..HEAD` (commits d'une publication précédente restés en local).
2. **Demander une confirmation explicite** : « Je publie maintenant sur le site. Confirmez-vous ? » Sans oui clair, ne pas publier. Les brouillons peuvent être publiés sans apparaître sur le site.
3. Lancer en arrière-plan si l'outil le permet, sinon avec son délai maximal :
   ```
   npm run publier -- "Message court décrivant le changement"
   ```
   Attendre l'une des trois lignes finales : « Publication terminée. », « Rien de nouveau à publier : la version en ligne est à jour. » ou « ARRÊT : … ». Si la commande est interrompue sans ligne finale, relancer la même : elle ne renvoie rien de déjà envoyé et vérifie la version en ligne.
   Le script contrôle d'abord la branche (`main`) et que la copie locale est à jour avec GitHub. Il enchaîne ensuite vérification (types, build, portes), commit, envoi vers GitHub (Vercel construit alors le site), puis attend que l'accueil porte la nouvelle version (`<meta name="createca-version">`), car l'ancienne répond déjà 200. Il contrôle enfin `https://createca.vercel.app/` et la page de chaque actualité ajoutée ou modifiée. `--simuler` s'arrête avant le commit, mais ajoute les fichiers à l'index.
4. Annoncer le résultat :
   - « Publication terminée. » : c'est en ligne ; donner le lien de la page publiée, par exemple `https://createca.vercel.app/actualites/<id>/`.
   - « Rien de nouveau à publier » : dire que rien n'a été envoyé et que la version en ligne contient déjà les changements, sans annoncer une nouvelle publication.

## En cas d'échec

- Build ou porte rouge : lire le message, l'expliquer simplement, corriger la cause dans les fichiers, relancer. **Ne jamais contourner une porte** (pas de suppression de contrôle, pas de publication forcée). Nom d'actualité refusé : renommer le fichier avec `git mv` vers un nom en minuscules, chiffres et tirets, et retirer tout champ `slug`.
- « modification(s) publiée(s) depuis un autre poste », avant ou pendant la publication : lancer `git pull --rebase --autostash origin main`, puis relancer. En cas de conflit, l'expliquer et demander de l'aide. **Jamais de `git push --force`**, jamais de `git reset --hard`.
- « fichiers modifiés hors du périmètre publié » : ne rien annuler soi-même (ni `git checkout`, ni `git restore`, ni `git stash`), montrer la liste et demander quoi en faire. **Ne jamais modifier `CHEMINS_AUTORISES`** pour passer.
- « Attention : nouveaux fichiers hors du périmètre » : ce n'est pas bloquant ; le signaler, ces fichiers ne partent pas en ligne.
- Branche autre que `main` : demander avant de changer de branche, car un travail en cours peut s'y trouver.
- Auteur inconnu de git : demander le nom et l'adresse électronique de la personne, puis lancer les deux commandes `git config --global` indiquées.
- Envoi impossible : lire le message de git affiché, l'expliquer simplement. Le commit reste en local et partira à la prochaine publication (relancer la même commande). Accès GitHub manquant : `gh auth login` puis `gh auth setup-git`.
- Sous Codex : la publication écrit dans `.git` et utilise le réseau ; demander l'autorisation correspondante plutôt que de contourner.
- Délai dépassé : donner le lien de suivi affiché par le script et ne pas affirmer que le site est à jour. Une relance plus tard vérifie la mise en ligne sans rien renvoyer.
- Ne jamais afficher un jeton ou une clé rencontrés.

## Règles communes (toujours)

- Dossier : ne travailler que dans le dépôt du site Createca (son `AGENTS.md` commence par « # Createca », il contient `src/content/actualites/`). Ailleurs, ne rien modifier et demander d’ouvrir le dossier du site.
- Ne rien inventer : aucun fait, chiffre, nom, lieu, horaire ou citation qui n’a pas été donné. Demander.
- Typographie française, jamais de tiret cadratin (U+2014). Espace insécable avant « : ; ? ! », « h » pour les heures (10 h 30).
- Texte simple et accessible : phrases courtes, public comprenant des personnes en situation de handicap.
- Confirmation explicite avant de supprimer ou de publier.
- Ne jamais afficher de secret (clé, mot de passe, jeton).
- Un `resume` fait 160 caractères au plus.
