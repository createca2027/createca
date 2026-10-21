import { Marked } from 'marked';

export type Titre = { niveau: 2 | 3; id: string; texte: string };
export type PageMd = { title: string; description: string; html: string; titres: Titre[] };

const pages = import.meta.glob('../content/pages/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const nettoyer = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&#39;/g, '’').replace(/&amp;/g, '&');

/**
 * Lit une page Markdown transcrite de l'ancien site.
 * `## Titre {#ancre}` fixe l'ancre ; `<!-- img: chemin -->` est remplacé par `figures[chemin]`.
 */
export function lirePage(nom: string, figures: Record<string, string> = {}): PageMd {
  const brut = pages[`../content/pages/${nom}.md`];
  if (!brut) throw new Error(`Page Markdown introuvable : ${nom}`);
  const fm = brut.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = Object.fromEntries(
    (fm?.[1] ?? '').split('\n').map((l) => l.match(/^(\w+):\s*(.*)$/)).filter(Boolean).map((m) => [m![1], m![2].replace(/^["']|["']$/g, '')]),
  );
  const corps = fm ? brut.slice(fm[0].length) : brut;

  const titres: Titre[] = [];
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const interieur = this.parser.parseInline(tokens);
        const m = interieur.match(/^(.*?)\s*\{#([\w-]+)\}\s*$/);
        const texte = m ? m[1] : interieur;
        const id = m ? m[2] : undefined;
        if (id && (depth === 2 || depth === 3)) titres.push({ niveau: depth, id, texte: nettoyer(texte) });
        return `<h${depth}${id ? ` id="${id}"` : ''}>${texte}</h${depth}>\n`;
      },
      html({ text }) {
        const m = text.match(/<!--\s*img:\s*(.*?)\s*-->/);
        if (m) return figures[m[1]] ?? '';
        return text;
      },
      link({ href, tokens }) {
        const texte = this.parser.parseInline(tokens);
        const externe = /^https?:/.test(href);
        return `<a href="${href}"${externe ? ' rel="noopener"' : ''}>${texte}</a>`;
      },
    },
  });
  const html = marked.parse(corps, { async: false }) as string;
  return { title: meta.title ?? nom, description: meta.description ?? '', html, titres };
}
