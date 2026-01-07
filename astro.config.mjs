import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://www.thessdevops.org',
  base: '/',
  output: 'static',
  build: {
    assets: 'assets',
  },
});
