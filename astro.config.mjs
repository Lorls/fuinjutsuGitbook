import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://fuinjutsu.builtbyloris.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // Le proxy de Coolify peut réécrire l'en-tête Origin ; on s'appuie sur les
  // cookies SameSite=Lax pour la protection CSRF plutôt que sur checkOrigin.
  security: { checkOrigin: false },
  vite: {
    ssr: { external: ['better-sqlite3'] },
  },
});
