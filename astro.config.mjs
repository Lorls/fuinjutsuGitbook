// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Fuinjutsu · Zenkai',
      description: "Grimoire de l'art du scellement du serveur Zenkai",
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: {
        root: { label: 'Français', lang: 'fr' },
      },
      customCss: ['./src/styles/custom.css'],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      sidebar: [
        { label: 'Règles générales', link: '/regles-generales/' },
        { label: 'Système de slots', link: '/systeme-de-slots/' },
        {
          label: '1er cercle',
          autogenerate: { directory: 'premier-cercle' },
        },
        {
          label: '2ème cercle',
          autogenerate: { directory: 'deuxieme-cercle' },
        },
        {
          label: '3ème cercle',
          autogenerate: { directory: 'troisieme-cercle' },
        },
        {
          label: '4ème cercle · Maître',
          autogenerate: { directory: 'quatrieme-cercle' },
        },
        {
          label: '5ème cercle · Grand Maître',
          badge: { text: 'Interdit', variant: 'danger' },
          autogenerate: { directory: 'cinquieme-cercle' },
        },
        {
          label: 'Sceaux de clan',
          autogenerate: { directory: 'sceaux-de-clan' },
        },
        {
          label: 'Sceaux à valider',
          badge: { text: 'À valider', variant: 'caution' },
          autogenerate: { directory: 'a-valider' },
        },
      ],
    }),
  ],
});
