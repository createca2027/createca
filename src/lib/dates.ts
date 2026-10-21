const formatJour = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** « 1er mars 2027 », « 26 septembre 2026 » */
export const dateLongue = (iso: string) => formatJour.format(new Date(`${iso}T00:00:00Z`)).replace(/^1 /, '1er ');
