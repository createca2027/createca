---
name: ajouter-des-photos
description: Ajoute des photos au site Createca (illustration d'une actualité, galerie d'expositions, image de page) avec le bon emplacement, la bonne taille et un texte alternatif fourni par l'équipe. À utiliser quand l'équipe fournit ou demande d'ajouter une image ou une photo.
when_to_use: « ajoute ces photos à l'exposition », « mets cette image sur l'actualité », « voici la photo des portes ouvertes ».
---

# Ajouter des photos

## Formats et taille

JPEG, PNG ou WebP. Plus de 2400 px sur le grand côté : réduire avant d'ajouter. Sur Mac : `sips -Z 2400 <fichier>` (copie d'abord le fichier d'origine hors du dépôt). Sinon avec `sharp` (déjà installé via Astro) : `node -e "require('sharp')('in.jpg').resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).toFile('out.jpg')"`.

## Emplacement

| Usage | Où | Déclaration |
| --- | --- | --- |
| Actualité | à côté du `.md` : `src/content/actualites/<id>.jpg` | en-tête : `image: { src: './<id>.jpg', alt: '...' }` |
| Galerie d'une exposition | `src/assets/photos/expos/<id>/<nom>.jpg` | `src/data/expositions.ts` : entrée `photos` avec `photo('<id>/<nom>')`, `alt`, `legende` facultative |
| Image d'une page | `src/assets/photos/<dossier>/` | via la page `.astro` ou `<!-- img: cle -->` existante |

Noms de fichiers : minuscules, sans accent, sans espace.

## Texte alternatif

**Toujours demandé à l'humain, jamais deviné.** Demander : « Que montre cette photo, en une phrase ? » Il décrit ce que l'on voit (objets, couleurs, ambiance), sans commencer par « photo de ». Un alt vide fait échouer `npm run verifier`.

## Personnes

Ne jamais nommer une personne sur une photo, ni dans l'alt ni dans la légende, sans que l'utilisateur l'ait dit. Ne pas décrire l'apparence, l'âge ou l'état de santé d'une personne. Pour des photos de personnes, rappeler de s'assurer de leur accord (droit à l'image).

Ensuite `npm run verifier` puis skill `mettre-en-ligne`.

## Règles communes (toujours)

- Ne rien inventer : aucun fait, chiffre, nom, lieu, horaire ou citation qui n’a pas été donné. Demander.
- Typographie française, jamais de tiret cadratin (U+2014). Espace insécable avant « : ; ? ! », « h » pour les heures (10 h 30).
- Texte simple et accessible : phrases courtes, public comprenant des personnes en situation de handicap.
- Confirmation explicite avant de supprimer ou de publier.
- Ne jamais afficher de secret (clé, mot de passe, jeton).
- Un `resume` fait 160 caractères au plus.
