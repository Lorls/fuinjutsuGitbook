import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Priorité de lecture : accueil, règles, slots, puis le reste par identifiant.
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

export const GET: APIRoute = async ({ site }) => {
  const docs = await getCollection('docs');
  docs.sort((a, b) => priority(a.id) - priority(b.id) || a.id.localeCompare(b.id));

  const base = site ? site.toString().replace(/\/$/, '') : '';
  const lines: string[] = [];
  lines.push('# Fuinjutsu · Zenkai');
  lines.push('');
  lines.push(
    "> Grimoire de l'art du scellement (fuinjutsu) du serveur Zenkai : règles RP, cercles de maîtrise, kanjis et définition de chaque sceau.",
  );
  lines.push('');
  lines.push('Contenu intégral en texte brut : [/llms-full.txt](' + base + '/llms-full.txt)');
  lines.push('');
  lines.push('## Pages');
  lines.push('');
  for (const d of docs) {
    const title = d.data.title ?? d.id;
    const desc = d.data.description ? `: ${d.data.description}` : '';
    lines.push(`- [${title}](${base}${toUrl(d.id)})${desc}`);
  }
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
