// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://tarotfree.netlify.app',
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  },
  build: {
    format: 'directory', // each page in its own folder
  },
  integrations: [react(), sitemap()]
});