// Données du site Createca. Source : ancien site createca.free.fr et plaquette.
// Une information = un seul endroit : les pages lisent ce fichier.

export const site = {
  nom: 'Createca',
  nomLong: 'Centre de recherche et d’études en art-thérapie, expression et communication artistiques',
  devise: 'Createca, un lien de culture et de thérapie.',
  depuis: 2004,
  url: 'https://createca.vercel.app',
  email: 'createca@free.fr',
  adresse: { rue: '244, rue Pasteur', cp: '33200', ville: 'Bordeaux', quartier: 'Caudéran' },
  geo: { lat: 44.853192, lon: -0.611372 },
  telephones: [
    { libelle: 'Centre', numero: '09 53 10 80 96' },
    { libelle: 'Caroline Goinaud', numero: '06 14 93 10 42' },
    { libelle: 'Jean-Louis Ricaud', numero: '06 13 15 86 15' },
  ],
  facebook: 'https://www.facebook.com/createca33',
  plaquette: '/documents/plaquette-createca.pdf',
  qualiopi: { numero: '25-07-981', pdf: '/documents/certificat-qualiopi.pdf', categorie: 'actions de formation', organisme: 'DEKRA Certification', validite: '9 septembre 2028' },
  legal: { siret: '480 178 359 00018', naf: '9499Z', activite: '72 33 07385 33' },
  musee: {
    nom: 'Musée Jean-Louis Ricaud',
    url: 'https://www.museejlricaud.com/',
    adresse: '17 rue des Érables, Marmande',
    video: 'https://www.youtube.com/watch?v=6NylJsWm_ds',
    videoId: '6NylJsWm_ds',
  },
} as const;

export const tel = (numero: string) => `tel:+33${numero.replace(/\s/g, '').slice(1)}`;

export const carteUrl = `https://www.openstreetmap.org/?mlat=${site.geo.lat}&mlon=${site.geo.lon}#map=17/${site.geo.lat}/${site.geo.lon}`;

// Plan du site. Premier groupe : la partie pratique, dans l'ordre du menu de l'ancien site
// (Actualités, Ateliers, Formations, Tarifs, Emploi du temps, Contact, Plaquette) ;
// puis la partie de présentation (Raisons, Actions, Public, Fondateurs, Galerie, Partenaires).
export type Lien = { titre: string; href: string; enfants?: Lien[] };
export const plan: Lien[][] = [
  [
    { titre: 'Actualités', href: '/actualites/', enfants: [{ titre: 'Historique', href: '/actualites/#historique' }] },
    { titre: 'Les Ateliers', href: '/ateliers/' },
    {
      titre: 'Formation', href: '/formation/', enfants: [
        { titre: 'Calendrier de la session', href: '/formation/#calendrier' },
        { titre: 'Art-thérapeutes certifiés', href: '/formation/certifications/' },
      ],
    },
    { titre: 'Tarifs', href: '/tarifs/' },
    { titre: 'Emploi du temps', href: '/emploi-du-temps/' },
    { titre: 'Contact', href: '/contact/' },
    { titre: 'Plaquette (PDF)', href: site.plaquette },
  ],
  [
    {
      titre: 'Raisons', href: '/raisons/', enfants: [
        { titre: 'Définition de l’art-thérapie', href: '/raisons/#definition' },
        {
          titre: 'La méthode de Createca', href: '/raisons/#methode', enfants: [
            { titre: 'Fondements', href: '/raisons/#fondements' },
            { titre: 'Point de vue pratique', href: '/raisons/#pratique' },
            { titre: 'Au sujet de l’art culturel', href: '/raisons/#art-culturel' },
            { titre: 'La figuration personnelle', href: '/raisons/#figuration' },
          ],
        },
        { titre: 'Évaluation du travail', href: '/raisons/#evaluation' },
        { titre: 'La fiche d’observation', href: '/raisons/#fiche-observation' },
      ],
    },
  ],
  [
    {
      titre: 'Actions', href: '/actions/', enfants: [
        { titre: 'Fonctionnement de Createca', href: '/actions/#fonctionnement' },
        { titre: 'Les expositions', href: '/actions/#expositions' },
        { titre: 'Les ateliers d’art-thérapie', href: '/actions/#ateliers' },
        { titre: 'La formation', href: '/formation/' },
      ],
    },
    { titre: 'Public', href: '/public/', enfants: [{ titre: 'Témoignages', href: '/temoignages/' }] },
    { titre: 'Fondateurs', href: '/fondateurs/' },
  ],
  [
    { titre: 'Galerie', href: '/galerie/', enfants: [{ titre: 'Les expositions', href: '/galerie/#expositions' }] },
    { titre: 'Partenaires', href: '/partenaires/' },
  ],
];

// Raccourcis de l'en-tête : la partie pratique de l'ancien menu (Contact = bouton « Nous écrire »)
export const raccourcis: Lien[] = [
  { titre: 'Actualités', href: '/actualites/' },
  { titre: 'Ateliers', href: '/ateliers/' },
  { titre: 'Formation', href: '/formation/' },
  { titre: 'Tarifs', href: '/tarifs/' },
  { titre: 'Emploi du temps', href: '/emploi-du-temps/' },
];

// Les six formes d'ateliers (texte de la page Ateliers)
export const ateliers = [
  { id: 'developpement-personnel', nom: 'Atelier développement personnel', public: 'Adultes, ouvert à tous', but: 'Peindre et modeler dans le lâcher-prise et la spontanéité, découvrir ses désirs et besoins profonds.' },
  { id: 'petite-enfance', nom: 'Atelier petite enfance', public: 'Les enfants et leurs parents', but: 'Éveiller aux techniques artistiques, améliorer la relation parent-enfant, grandir ensemble.' },
  { id: 'artiste', nom: 'Atelier d’artiste', public: 'Adultes ayant déjà une pratique artistique', but: 'Améliorer sa technique, développer une expression personnelle, dépasser ses blocages.' },
  { id: 'arto-analyse', nom: 'Atelier d’arto-analyse', public: 'Adultes ayant des productions à présenter', but: 'Analyser les actions artistiques de chacun, comprendre et débloquer les mécanismes psychiques et créatifs.' },
  { id: 'libre', nom: 'Atelier libre', public: 'Adultes, ouvert à tous', but: 'Dessiner, peindre, modeler, sculpter dans un lieu ouvert au travail artistique personnel.' },
  { id: 'enfant-ado', nom: 'Atelier enfant, atelier ado', public: 'Enfants de 6 à 10 ans, ados de 11 à 19 ans', but: 'Apprendre le dessin et les techniques d’arts plastiques ; éducation du goût et histoire de l’art.' },
] as const;

// Emploi du temps (grille de l'ancien site, cases colorées décodées)
export type Activite = 'jlr' | 'cg' | 'groupe-ext' | 'dev-perso' | 'artistes' | 'libre';
export const activites: Record<Activite, { nom: string; detail: string; type: 'individuel' | 'atelier' | 'exterieur' }> = {
  jlr: { nom: 'Séances individuelles', detail: 'avec Jean-Louis Ricaud', type: 'individuel' },
  cg: { nom: 'Séances individuelles', detail: 'avec Caroline Goinaud', type: 'individuel' },
  'groupe-ext': { nom: 'Séance de groupe', detail: 'en structure extérieure', type: 'exterieur' },
  'dev-perso': { nom: 'Atelier développement personnel adultes', detail: 'lundi 18 h 30 – 20 h 30', type: 'atelier' },
  artistes: { nom: 'Atelier d’artistes', detail: 'jeudi 18 h 30 – 20 h 30', type: 'atelier' },
  libre: { nom: 'Atelier libre', detail: 'vendredi 14 h – 16 h', type: 'atelier' },
};
export const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
export const creneaux = [
  { heures: '10 h – 12 h', cases: ['jlr', 'jlr', 'groupe-ext', 'jlr', 'cg', 'jlr'] },
  { heures: '14 h – 18 h', cases: ['cg', 'cg', 'cg', 'jlr', 'libre', null] },
  { heures: '18 h – 20 h', cases: ['dev-perso', 'cg', null, 'artistes', 'cg', null] },
] as const satisfies readonly { heures: string; cases: readonly (Activite | null)[] }[];

// Tarifs des ateliers pour les particuliers (2026)
export const tarifs = {
  annee: 2026,
  adhesion: { prix: '30 €/an', detail: 'assurances, frais administratifs, matériel pédagogique, petit matériel…' },
  colonnes: ['1 séance', '4 séances', '10 séances', 'À l’année'],
  lignes: [
    { nom: 'Atelier d’art-thérapie adultes', rythme: '2 heures par semaine, 35 séances annuelles', prix: ['17 €', '60 €', '130 €', '300 € (110 € par trimestre)'] },
    { nom: 'Atelier libre', rythme: '2 h 30 par semaine, 35 séances annuelles', prix: ['23 €', '76 €', '170 €', '345 € (125 € par trimestre)'] },
    { nom: 'Séances individuelles', rythme: '1 heure par semaine, 35 séances annuelles', prix: ['40 €', '148 € (37 €/h)', '350 € (35 €/h)', '700 € (20 €/h, 243 € par trimestre)'] },
  ],
} as const;

// Formation : groupe de janvier 2027 (page Formation de l'ancien site)
export const formation = {
  prochaineSession: 'janvier 2027',
  dateLimite: '2027-01-15',
  dateLimiteTexte: '15 janvier 2027',
  heures: 287,
  modules: 7,
  groupeMax: 9,
  calendrier: [
    { libelle: 'Module 1', dates: 'du 25 au 29 janvier 2027' },
    { libelle: 'Module 2', dates: 'du 1er au 5 mars 2027' },
    { libelle: 'Module 3', dates: 'du 22 au 26 mars 2027' },
    { libelle: 'Module 4', dates: 'du 26 au 30 avril 2027' },
    { libelle: 'Module 5', dates: 'du 24 au 28 mai 2027' },
    { libelle: 'Séminaire', dates: '3 et 4 juillet 2027' },
    { libelle: 'Module 6', dates: 'du 20 au 24 septembre 2027' },
    { libelle: 'Module 7', dates: 'du 18 au 22 octobre 2027' },
    { libelle: 'Journée mémoire', dates: 'date à définir' },
  ],
} as const;
