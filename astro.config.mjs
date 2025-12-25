import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://devops-thessaloniki.github.io',
  base: '/',
  output: 'static',
  build: {
    assets: 'assets',
  },
});
