import type { APIRoute } from 'astro';

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS = { nom: 120, email: 200, sujet: 200, message: 5000 } as const;

type Fields = Record<'nom' | 'email' | 'sujet' | 'message' | 'website', string>;

async function readFields(request: Request): Promise<Fields> {
  const type = request.headers.get('content-type') ?? '';
  let raw: Record<string, unknown> = {};
  if (type.includes('application/json')) {
    raw = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  } else {
    const form = await request.formData().catch(() => null);
    if (form) raw = Object.fromEntries(form.entries());
  }
  const get = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string).trim() : '');
  return { nom: get('nom'), email: get('email'), sujet: get('sujet'), message: get('message'), website: get('website') };
}

// Codes d'erreur : le formulaire sans JavaScript les reçoit dans l'URL et la page les traduit.
const ERREURS = {
  nom: 'Indiquez votre nom.',
  email: 'Indiquez une adresse e-mail valide, par exemple prenom@exemple.fr.',
  message: 'Écrivez votre message (10 caractères au moins).',
  longueur: 'Votre message est trop long : raccourcissez-le ou écrivez directement à createca@free.fr.',
} as const;

function validate(f: Fields): keyof typeof ERREURS | null {
  if (!f.nom) return 'nom';
  if (!EMAIL_RE.test(f.email)) return 'email';
  if (f.message.length < 10) return 'message';
  if (f.nom.length > LIMITS.nom || f.email.length > LIMITS.email || f.sujet.length > LIMITS.sujet || f.message.length > LIMITS.message) {
    return 'longueur';
  }
  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const reply = (status: number, body: Record<string, unknown>, redirect?: string) =>
    !wantsJson && redirect
      ? new Response(null, { status: 303, headers: { Location: redirect } })
      : new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

  const fields = await readFields(request);

  // Pot de miel : un robot remplit le champ caché. Faux succès silencieux, aucun envoi.
  if (fields.website) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const error = validate(fields);
  if (error) return reply(400, { ok: false, error: ERREURS[error], code: error }, `/contact/?erreur=${error}#formulaire`);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return reply(503, { ok: false, error: "L'envoi est indisponible pour le moment. Écrivez directement à createca@free.fr." }, '/contact/?erreur=indisponible#formulaire');
  }

  const to = process.env.CONTACT_TO?.trim() || 'createca@free.fr';
  const from = process.env.CONTACT_FROM?.trim() || 'Site Createca <createca@virtuoseweb.fr>';
  const subject = `[Site Createca] ${fields.sujet || 'Nouveau message'} (${fields.nom})`;
  const text = [
    `Message envoyé depuis le formulaire de contact du site Createca.`,
    ``,
    `Nom : ${fields.nom}`,
    `E-mail : ${fields.email}`,
    `Objet : ${fields.sujet || '(sans objet)'}`,
    ``,
    fields.message,
    ``,
    `Pour répondre, utilisez simplement « Répondre » : la réponse part vers ${fields.email}.`,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: fields.email, subject, text }),
  }).catch(() => null);

  if (!res || !res.ok) {
    console.error('contact: échec Resend', res?.status, res ? await res.text().catch(() => '') : 'réseau');
    return reply(502, { ok: false, error: "Le message n'a pas pu partir. Réessayez dans un instant ou écrivez à createca@free.fr." }, '/contact/?erreur=envoi#formulaire');
  }
  return reply(200, { ok: true }, '/contact/merci/');
};
