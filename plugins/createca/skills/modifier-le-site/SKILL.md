---
name: modifier-le-site
description: Modifie un contenu existant du site Createca (tarifs, coordonnées, téléphone, e-mail, horaires et emploi du temps, ateliers, session de formation et calendrier, textes des pages, liste des certifiés, partenaires, témoignages, expositions). À utiliser quand l'équipe demande de changer, corriger ou mettre à jour une information déjà en ligne.
when_to_use: « change le tarif de l'atelier libre », « nouveau numéro de téléphone », « mets à jour la date limite de la formation », « corrige le texte de la page Raisons ».
---

# Modifier le site

Principe : **une information = un seul endroit**. Chercher d'abord avec `rg -n "<texte actuel>" src`, modifier la source, jamais une copie.

## Carte : vous voulez changer… alors

| Changer | Fichier | Champ / repère | Page concernée |
| --- | --- | --- | --- |
| Adresse, e-mail, téléphones, Facebook, Qualiopi, mentions légales, musée | `src/data/site.ts` | objet `site` | pied de page, contact, mentions |
| Menu, plan du site, liens rapides | `src/data/site.ts` | `plan`, `raccourcis` | en-tête, plan du site |
| Les six formes d'ateliers | `src/data/site.ts` | `ateliers` | /ateliers/ |
| Emploi du temps (jours, créneaux, activités) | `src/data/site.ts` | `activites`, `jours`, `creneaux` | /emploi-du-temps/ |
| Tarifs | `src/data/site.ts` | `tarifs` | /tarifs/ et /ateliers/ |
| Session de formation, date limite, heures, modules, calendrier | `src/data/site.ts` | `formation` | /formation/ |
| Textes longs (raisons, actions, public, fondateurs, formation, galerie, ateliers) | `src/content/pages/<page>.md` | corps Markdown | page du même nom |
| Art-thérapeutes certifiés | `src/data/certifications.json` | `personnes` (annee, prenom, nom, metier, memoire) | /formation/certifications/ |
| Partenaires | `src/data/partenaires.json` | liste | /partenaires/ |
| Témoignages | `src/data/temoignages.json` | liste | /temoignages/ |
| Galerie d'expositions | `src/data/expositions.ts` + photos `src/assets/photos/expos/<id>/` | liste `expositions` | /galerie/ |
| Une actualité existante | `src/content/actualites/<id>.md` | en-tête et corps | /actualites/<id>/ |
| Plaquette, certificat Qualiopi (PDF) | `public/documents/` | remplacer le fichier, même nom | liens des pages |
| Structure ou texte d'interface d'une page | `src/pages/<page>.astro` | à toucher en dernier recours | la page |

Dans les textes longs : `{#ancre}` fixe l'ancre d'un titre (ne pas la changer, des liens la visent) ; `<!-- img: cle -->` insère une figure définie dans la page `.astro` (ne pas supprimer).

## Exemples

- « Atelier libre à 25 € la séance » : `tarifs.lignes` ligne « Atelier libre », `prix[0]`. Vérifier aussi les prix liés (4 séances, 10 séances, année) : demander s'ils changent.
- « Nouveau téléphone du centre » : `site.telephones`, libellé « Centre ».
- « Formation décalée au 5 février » : `formation.dateLimite`, `dateLimiteTexte`, `calendrier`.

## Marche à suivre

1. Lire le fichier, repérer le champ exact. Si la demande est ambiguë ou incomplète : poser la question, ne pas deviner.
2. Modifier uniquement la valeur demandée. Conserver le format (espaces insécables, « h », « € »).
3. `npm run verifier`. Si une porte est rouge, corriger la cause, jamais la contourner.
4. Résumer l'avant / après en langage simple, puis skill `mettre-en-ligne`.

## Règles communes (toujours)

- Dossier : ne travailler que dans le dépôt du site Createca (son `AGENTS.md` commence par « # Createca », il contient `src/content/actualites/`). Ailleurs, ne rien modifier et demander d’ouvrir le dossier du site.
- Ne rien inventer : aucun fait, chiffre, nom, lieu, horaire ou citation qui n’a pas été donné. Demander.
- Typographie française, jamais de tiret cadratin (U+2014). Espace insécable avant « : ; ? ! », « h » pour les heures (10 h 30).
- Texte simple et accessible : phrases courtes, public comprenant des personnes en situation de handicap.
- Confirmation explicite avant de supprimer ou de publier.
- Ne jamais afficher de secret (clé, mot de passe, jeton).
- Un `resume` fait 160 caractères au plus.
