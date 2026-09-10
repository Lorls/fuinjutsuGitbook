import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://fuinjutsu.builtbyloris.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
