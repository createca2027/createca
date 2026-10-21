import actualites from '../data/actualites.json';
import { dateLongue } from './dates';

export type Actu = (typeof actualites)[number];

export const libelles: Record<string, string> = {
  atelier: 'Atelier', certifications: 'Certifications', evenement: 'Événement', exposition: 'Exposition', formation: 'Formation',
  information: 'Information', 'portes-ouvertes': 'Portes ouvertes', publication: 'Publication', qualite: 'Qualité',
  rencontre: 'Rencontre', reprise: 'Rentrée', soutien: 'Soutien',
};

// Échéance d'une annonce : fin des inscriptions, dernier jour ou jour de l'événement.
// Évaluée à la construction du site : une annonce passe dans l'historique à la publication suivante.
const aujourdhui = new Date().toISOString().slice(0, 10);
const echeance = (a: Actu) => a.limite ?? a.dateFin ?? a.date;
const estAVenir = (a: Actu) => {
  const e = echeance(a);
  return e ? e >= aujourdhui : a.annee > Number(aujourdhui.slice(0, 4));
};

export const aVenir = actualites.filter(estAVenir);
export const passees = actualites.filter((a) => !estAVenir(a));

/** Date affichée sur une carte : la date limite n'est jamais présentée comme la date d'un événement. */
export const quand = (a: Actu) => {
  if (a.limite) return `inscriptions jusqu’au ${dateLongue(a.limite)}`;
  if (a.date) return a.dateFin ? `du ${dateLongue(a.date)} au ${dateLongue(a.dateFin)}` : dateLongue(a.date);
  return String(a.annee);
};
