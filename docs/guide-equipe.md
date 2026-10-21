# Guide de l'équipe Createca : modifier le site avec un agent IA

## Installer et ouvrir (une seule fois)

1. Accepter l'invitation au dépôt privé GitHub **virtuoseweb/createca** envoyée par Waimia.
2. Installer **Claude** (application de bureau, onglet Code, ou Claude Code) ou **Codex**, et se connecter à son compte.
3. Installer l'outil GitHub (`gh`), puis lancer `gh auth login` et `gh auth setup-git`, et récupérer le site : `gh repo clone virtuoseweb/createca`.
4. Ouvrir l'agent **dans ce dossier** et accepter de lui faire confiance. Dans Claude, le plugin **Createca** s'active alors seul ; il apparaît dans le menu Plugins et ses commandes commencent par `/createca:` (par exemple `/createca:publier-une-actualite`). Codex lit les mêmes consignes dans le dossier.
5. Vous écrivez ensuite en français, comme à un collègue : pas besoin de taper les commandes.

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
