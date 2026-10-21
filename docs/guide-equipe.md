# Guide de l'équipe Createca : modifier le site avec un agent IA

## Installer et ouvrir

1. Installer **Claude Code** (claude.com/claude-code) ou **Codex** (openai.com/codex), et se connecter à son compte.
2. Récupérer le dossier du site (dépôt Git « createca ») sur votre ordinateur, avec l'aide de la personne qui l'a mis en place.
3. Ouvrir l'agent **dans ce dossier**. Il lit seul les consignes du site. Vous lui écrivez en français, comme à un collègue.

## Exemples de demandes

- « Publie nos portes ouvertes du 4 juillet 2027 de 10 h à 17 h. »
- « Ajoute les certifiés 2027. » (donnez les noms)
- « Change le tarif de l'atelier libre : 25 € la séance. »
- « Écris un article sur notre nouvel atelier » (donnez les informations).
- « Ajoute ces photos à l'exposition » (donnez une description de chaque photo).
- « Supprime l'actualité sur la reprise 2019. »

## Ce que l'agent vous demandera

Les informations qui manquent (date complète, horaires, lieu, date limite), le texte alternatif de chaque photo, puis une confirmation avant de supprimer et avant de publier. Il n'invente rien : s'il manque un fait, il pose la question. Il vous résume les changements en phrases simples avant la mise en ligne. Le site se met à jour en quelques minutes.

## Annuler

- **Avant la mise en ligne** : dites « annule » ; l'agent remet les fichiers dans leur état précédent.
- **Masquer sans supprimer** : « mets cette actualité en brouillon » ; elle disparaît du site et on peut la remettre.
- **Après la mise en ligne** : « annule la dernière publication ». L'agent crée un nouveau changement qui défait le précédent (`git revert`), puis le publie après votre confirmation. Rien n'est jamais perdu : tout l'historique est conservé.

ChatGPT ou Claude en simple conversation, sans accès au dossier, peut vous aider à rédiger mais ne peut pas publier.
