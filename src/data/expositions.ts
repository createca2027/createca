// Expositions de la galerie du Chien (ancien site, pages expos.php) et photos d'accrochage.
import type { ImageMetadata } from 'astro';

const fichiers = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/expos/*/*.jpg', { eager: true });
const photo = (chemin: string) => {
  const f = fichiers[`../assets/photos/expos/${chemin}.jpg`];
  if (!f) throw new Error(`Photo d’exposition introuvable : ${chemin}`);
  return f.default;
};

export type Exposition = {
  id: string;
  artiste: string;
  titre?: string;
  texte?: string;
  actualite?: string;
  photos: { src: ImageMetadata; alt: string; legende?: string }[];
};

export const expositions: Exposition[] = [
  {
    id: 'privat', artiste: 'Bernard Privat', titre: 'Privat en privé',
    texte: 'Peintre, dessinateur et sculpteur béglais, très libre, qui ose exhiber des formes évocatrices. Vernissage le 10 juin 2011.',
    actualite: 'exposition-privat-2011',
    photos: [
      { src: photo('privat/privat1'), alt: 'Deux œuvres de Bernard Privat aux figures grotesques en couleurs, présentées sur des cartons noirs' },
      { src: photo('privat/privat2'), alt: 'Trois œuvres de Bernard Privat accrochées côte à côte' },
      { src: photo('privat/privat3'), alt: 'Dessin à l’encre d’une figure enchevêtrée, dans un cadre noir' },
    ],
  },
  {
    id: 'chaney', artiste: 'S. Chaney',
    photos: [
      { src: photo('chaney/chaney1'), alt: 'Sculpture en pierre blanche : un visage taillé dans le bloc' },
      { src: photo('chaney/chaney2'), alt: 'Dessin aux tons pâles d’une figure recroquevillée' },
      { src: photo('chaney/chaney3'), alt: 'Portraits dessinés accrochés au mur et petite sculpture blanche sur une sellette' },
    ],
  },
  {
    id: 'simon-trignac', artiste: 'Philippe Simon et Colette Trignac', titre: 'Paysages surréalistes et figuration fantastique',
    texte: 'Peintures et dessins exposés de janvier à mars 2010, vernissage le 6 février 2010.',
    actualite: 'exposition-simon-trignac-2010',
    photos: [
      { src: photo('simtri/simtri1'), alt: 'Toile : un arbre noir sur un ciel jaune, à côté de deux dessins encadrés' },
      { src: photo('simtri/simtri2'), alt: 'Dessins encadrés et toile aux tons jaunes' },
      { src: photo('simtri/simtri3'), alt: 'Toile aux couleurs vives et dessin au crayon d’une figure' },
    ],
  },
  {
    id: 'gen', artiste: 'Suzan Gen',
    photos: [
      { src: photo('gen/gen1'), alt: 'Portrait peint d’une jeune femme, au-dessus de petites sculptures' },
      { src: photo('gen/gen2'), alt: 'Sculpture en céramique colorée : une femme tenant un enfant' },
      { src: photo('gen/gen3'), alt: 'Toile : un visage d’enfant derrière un masque de papier' },
    ],
  },
  {
    id: 'latour', artiste: 'Véronique Latour',
    photos: [
      { src: photo('latour/latour1'), alt: 'Toiles aux tons chauds accrochées au mur de la galerie' },
      { src: photo('latour/latour2'), alt: 'Trois toiles rouges et ocre alignées' },
      { src: photo('latour/latour3'), alt: 'Deux grandes toiles, l’une rouge, l’autre verte' },
      { src: photo('latour/latour4'), alt: 'Toile encadrée : silhouettes élancées sur un fond orangé' },
    ],
  },
  {
    id: 'linel', artiste: 'Nicolas Linel', titre: 'Le sacrifice de Chiron',
    photos: [
      { src: photo('linel/linel1'), alt: 'Trois œuvres rouges et noires accrochées au mur' },
      { src: photo('linel/linel2'), alt: 'Dessin à l’encre rehaussé de rouge, figures enchevêtrées' },
      { src: photo('linel/linel3'), alt: 'Figure dessinée, cambrée, sur fond rouge dans un cadre noir' },
    ],
  },
  {
    id: 'duprat', artiste: 'Bernard Duprat',
    photos: [
      { src: photo('duprat/duprat1'), alt: 'Deux toiles horizontales aux tons rouges et verts' },
      { src: photo('duprat/duprat2'), alt: 'Trois toiles aux motifs végétaux colorés' },
      { src: photo('duprat/duprat3'), alt: 'Grande toile sombre aux tons bruns et rouges' },
    ],
  },
  {
    id: 'vizzavona', artiste: 'A. Vizzavona',
    photos: [
      { src: photo('viz/viz1'), alt: 'Sculpture : deux mains encadrent un visage qui crie' },
      { src: photo('viz/viz2'), alt: 'Sculptures en terre cuite orangée : un personnage assis' },
      { src: photo('viz/viz3'), alt: 'Dessin au trait de corps enlacés' },
    ],
  },
  {
    id: 'voutes-poyennes', artiste: 'Les Voûtes Poyennes', titre: 'Exposition collective',
    texte: 'Œuvres de Ney, B. Ouvrard, Jean-Louis Ricaud et Bernard Duprat, présentées sous les voûtes de pierre.',
    photos: [
      { src: photo('voutes/voutes'), alt: 'Salle voûtée en pierre : panneau Createca et tableaux éclairés', legende: 'Les Voûtes Poyennes' },
      { src: photo('voutes/ney1'), alt: 'Trois toiles de Ney accrochées sur une cimaise blanche', legende: 'Ney' },
      { src: photo('voutes/ouvrard'), alt: 'Grande toile sombre de B. Ouvrard sous les voûtes', legende: 'B. Ouvrard' },
      { src: photo('voutes/jlr'), alt: 'Grande toile colorée de Jean-Louis Ricaud éclairée sous les voûtes', legende: 'J.-L. Ricaud' },
      { src: photo('voutes/duprat'), alt: 'Deux toiles de Bernard Duprat sur une cimaise éclairée', legende: 'B. Duprat' },
    ],
  },
];

// Autres expositions de la galerie annoncées dans les actualités (sans photos)
export const autresExpositions = [
  { artiste: 'Virginie Bernardi', titre: 'Explorations', annee: 2014, actualite: 'exposition-bernardi-2014' },
  { artiste: 'Morgiane-Marie Martell', titre: 'L’art et la matière', annee: 2012, actualite: 'exposition-martell-2012' },
  { artiste: 'Andrée Pardon', titre: 'Œuvres peintes', annee: 2011, actualite: 'exposition-pardon-2011' },
  { artiste: 'Marie-Hélène Almeida', titre: undefined, annee: 2010, actualite: 'exposition-almeida-2010' },
];
