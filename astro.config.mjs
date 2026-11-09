import { readFileSync, existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// Extra pages (about, media, sponsors…) live in src/site-pages/ and are
// listed in src/content/pages.json. Draft pages are only routed in
// `astro dev` or when SHOW_DRAFTS=1, so they never reach production by
// accident. Keep this rule in sync with src/lib/pages.ts.
function sitePages() {
  return {
    name: 'site-pages',
    hooks: {
      'astro:config:setup': ({ command, injectRoute, logger }) => {
        const pages = JSON.parse(readFileSync('./src/content/pages.json', 'utf8'));
        const showDrafts = command === 'dev' || process.env.SHOW_DRAFTS === '1';
        for (const [slug, page] of Object.entries(pages)) {
          const entrypoint = `./src/site-pages/${slug}.astro`;
          if (!existsSync(entrypoint)) throw new Error(`pages.json lists "${slug}" but ${entrypoint} does not exist`);
          if (page.draft && !showDrafts) {
            logger.info(`skipping draft page /${slug}/`);
            continue;
          }
          injectRoute({ pattern: `/${slug}`, entrypoint });
        }
      },
    },
  };
}

export default defineConfig({
  integrations: [tailwind(), sitePages()],
  site: 'https://www.thessdevops.org',
  base: '/',
  output: 'static',
  build: {
    assets: 'assets',
  },
});
