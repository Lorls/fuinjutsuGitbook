import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Legacy content reader only. The public interface is custom-built in src/pages.
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
