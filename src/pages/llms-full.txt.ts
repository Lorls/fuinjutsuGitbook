import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const norm = (id: string): string => id.replace(/\.(md|mdx)$/, '');

const priority = (id: string): number => {
  const n = norm(id);
  if (n === '' || n === 'index') return 0;
  if (n === 'regles-generales') return 1;
  if (n === 'systeme-de-slots') return 2;
  return 10;
};

const toUrl = (id: string): string => {
  const clean = norm(id).replace(/\/?index$/, '');
  return clean === '' ? '/' : `/${clean}/`;
};

// Nettoie le markdown MDX (imports, composants) pour un texte lisible par un LLM.
const cleanBody = (body: string): string =>
  body
    .replace(/^import .*$/gm, '')
    .replace(/<\/?(Card|CardGrid)[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const GET: APIRoute = async ({ site }) => {
  const docs = await getCollection('docs');
  docs.sort((a, b) => priority(a.id) - priority(b.id) || a.id.localeCompare(b.id));

  const base = site ? site.toString().replace(/\/$/, '') : '';
  const out: string[] = [];
  out.push('# Fuinjutsu · Zenkai — contenu intégral');
  out.push('');
  out.push(
    "> Export texte de l'ensemble du grimoire de fuinjutsu du serveur Zenkai. Chaque section ci-dessous correspond à une page du wiki.",
  );

  for (const d of docs) {
    const title = d.data.title ?? d.id;
    const body = cleanBody((d as { body?: string }).body ?? '');
    out.push('');
    out.push('');
    out.push('---');
    out.push('');
    out.push(`# ${title}`);
    out.push(`URL: ${base}${toUrl(d.id)}`);
    if (d.data.description) out.push(`Description: ${d.data.description}`);
    out.push('');
    out.push(body);
  }
  out.push('');

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
