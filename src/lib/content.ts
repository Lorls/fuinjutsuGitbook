import { marked } from 'marked';

export type Circle = 'premier-cercle' | 'deuxieme-cercle' | 'troisieme-cercle' | 'quatrieme-cercle' | 'cinquieme-cercle' | 'sceaux-de-clan' | 'a-valider' | 'general';

export type Document = {
  slug: string;
  title: string;
  description: string;
  circle: Circle;
  isIndex: boolean;
  html: string;
  excerpt: string;
};

const sources = import.meta.glob('../content/docs/**/*.{md,mdx}', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const labels: Record<string, Circle> = {
  'premier-cercle': 'premier-cercle',
  'deuxieme-cercle': 'deuxieme-cercle',
  'troisieme-cercle': 'troisieme-cercle',
  'quatrieme-cercle': 'quatrieme-cercle',
  'cinquieme-cercle': 'cinquieme-cercle',
  'sceaux-de-clan': 'sceaux-de-clan',
  'a-valider': 'a-valider',
};

function property(frontmatter: string, name: string) {
  const match = frontmatter.match(new RegExp(`^${name}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
  return match?.[1]?.replace(/["']$/, '').trim() ?? '';
}

function asHtml(markdown: string) {
  const prepared = markdown
    .replace(/:::([a-z]+)\[([^\]]+)\]\n([\s\S]*?)\n:::/g, (_all, kind, title, body) =>
      `<aside class="callout callout--${kind}"><span>${title}</span><div>${body}</div></aside>`,
    )
    .replace(/<figure class="seal-icon">/g, '<figure class="seal-icon">')
    .replace(/<\/figure>/g, '</figure>');
  return marked.parse(prepared, { gfm: true, breaks: false }) as string;
}

export const documents: Document[] = Object.entries(sources)
  .map(([path, source]) => {
    const raw = String(source);
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    const frontmatter = match?.[1] ?? '';
    const body = match?.[2] ?? raw;
    const relative = path.replace(/^.*?content\/docs\//, '').replace(/\.(md|mdx)$/, '');
    const isRoot = relative === 'index';
    const isIndex = relative.endsWith('/index') || isRoot;
    const slug = isRoot ? '/' : `/${relative.replace(/\/index$/, '')}/`;
    const segment = relative.split('/')[0];
    const circle = labels[segment] ?? 'general';
    const title = property(frontmatter, 'title') || relative.split('/').at(-1)?.replace(/-/g, ' ') || 'Archive';
    const description = property(frontmatter, 'description');
    const excerpt = body.replace(/<[^>]+>/g, '').replace(/[#*_`>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
    return { slug, title, description, circle, isIndex, html: asHtml(body), excerpt };
  })
  .filter((doc) => doc.slug !== '/')
  .sort((a, b) => a.slug.localeCompare(b.slug, 'fr'));

export const groups = [
  { key: 'general', label: 'Fondations', glyph: '壱', description: 'Règles, progression et slots.' },
  { key: 'premier-cercle', label: 'Premier cercle', glyph: '一', description: 'Les gestes fondamentaux du scellement.' },
  { key: 'deuxieme-cercle', label: 'Deuxième cercle', glyph: '二', description: 'Barrières, dressage et accumulation.' },
  { key: 'troisieme-cercle', label: 'Troisième cercle', glyph: '三', description: 'Contrôle, restriction et pactes.' },
  { key: 'quatrieme-cercle', label: 'Quatrième cercle', glyph: '四', description: 'Le domaine des Maîtres Fuin.' },
  { key: 'cinquieme-cercle', label: 'Cinquième cercle', glyph: '五', description: 'Arts interdits des Grands Maîtres.' },
  { key: 'sceaux-de-clan', label: 'Sceaux de clan', glyph: '氏', description: 'Secrets transmis par le sang.' },
  { key: 'a-valider', label: 'Archives instables', glyph: '呪', description: 'Sceaux et juinjutsu à valider.' },
] as const;

export function docsFor(circle: Circle) {
  return documents.filter((doc) => doc.circle === circle);
}

export function findDoc(slug: string) {
  return documents.find((doc) => doc.slug === `/${slug.replace(/^\/+|\/+$/g, '')}/`);
}
