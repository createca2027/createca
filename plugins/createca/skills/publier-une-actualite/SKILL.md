---
name: publier-une-actualite
description: Crée ou rédige une actualité du site Createca (portes ouvertes, événement, exposition, rencontre, atelier, session de formation, certifiés, reprise des séances, article de blog). À utiliser dès que l'équipe demande d'annoncer, publier, ajouter ou écrire quelque chose de nouveau sur le site.
when_to_use: « publie nos portes ouvertes du 4 juillet 2027 », « ajoute les certifiés 2027 », « écris un article sur notre nouvel atelier », « annonce la nouvelle session de formation ».
---

# Publier une actualité

Une actualité = un fichier `src/content/actualites/<id>.md`, page publique `/actualites/<id>/`.

## 1. Choisir le type

| La demande ressemble à | `--type` |
| --- | --- |
| « nos portes ouvertes du… » | `portes-ouvertes` |
| « une soirée / conférence / journée / stage… » | `evenement` |
| « une exposition de… », vernissage | `exposition` |
| « une rencontre avec… », table ronde | `rencontre` |
| « un nouvel atelier », « atelier du… » | `atelier` |
| « nouvelle session de formation, date limite… » | `formation` |
| « les certifiés 2027 », « félicitations aux certifiées » | `certifications` |
| « certification Qualiopi », qualité | `qualite` |
| « reprise des séances à la rentrée » | `reprise` |
| « sortie d'un livre, signature » | `publication` |
| « merci à… », soutien, partenaire | `soutien` |
| une information courte sans rubrique | `information` |
| « écris un article sur… » (texte long, images) | `article` |

Gabarits : formation = encadré date limite et bouton programme ; portes-ouvertes, evenement, exposition, rencontre, atelier = bloc Quand / Où ; certifications et qualite = lien vers la liste des certifiés ; article = mise en page longue.

## 2. Questions à poser (seulement ce qui manque)

Date (jour complet, année comprise), fin si plusieurs jours, horaires, lieu si différent du centre, date limite d'inscription (formation), conditions (entrée libre, inscription), photos et leur texte alternatif (voir skill `ajouter-des-photos`). Si l'utilisateur hésite ou n'a pas tout : proposer `--brouillon`.

## 3. Créer puis remplir

```
npm run actu:nouvelle -- --type portes-ouvertes --titre "Portes ouvertes à Createca" --date 2027-07-04 --resume "..." [--fin AAAA-MM-JJ] [--limite AAAA-MM-JJ] [--brouillon]
```

- Le script refuse un type inconnu, un id existant, une date invalide, une fin avant le début, et des dates d'années différentes (date, fin et limite restent dans la même année). Un article reçoit `publie` = aujourd'hui.
- Ouvrir le fichier créé et remplacer chaque commentaire `<!-- à remplacer : ... -->` par du texte fondé sur les SEULS faits donnés. Reformuler sans ajouter. Pas de faux contenu pour combler.
- Ajouter `resume` (160 caractères au plus) s'il manque. Mettre en forme en Markdown simple.
- Exemples de style : `src/content/actualites/` (anciennes entrées).
- Conserver le brouillon (`brouillon: true`) tant que tout n'est pas confirmé.

## 4. Suite

Lancer `npm run verifier`, résumer en langage simple, puis skill `mettre-en-ligne`.

## Règles communes (toujours)

- Dossier : ne travailler que dans le dépôt du site Createca (son `AGENTS.md` commence par « # Createca », il contient `src/content/actualites/`). Ailleurs, ne rien modifier et demander d’ouvrir le dossier du site.
- Ne rien inventer : aucun fait, chiffre, nom, lieu, horaire ou citation qui n’a pas été donné. Demander.
- Typographie française, jamais de tiret cadratin (U+2014). Espace insécable avant « : ; ? ! », « h » pour les heures (10 h 30).
- Texte simple et accessible : phrases courtes, public comprenant des personnes en situation de handicap.
- Confirmation explicite avant de supprimer ou de publier.
- Ne jamais afficher de secret (clé, mot de passe, jeton).
- Un `resume` fait 160 caractères au plus.
