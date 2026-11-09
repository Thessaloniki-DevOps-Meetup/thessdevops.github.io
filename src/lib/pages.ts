// Extra site pages (about, media, sponsors…) and their draft state.
//
// Each page lives in src/site-pages/<slug>.astro and is listed in
// src/content/pages.json. A page with "draft": true is only routed (and
// shown in the nav and sitemap) in `astro dev`, or in a build run with
// SHOW_DRAFTS=1 (e.g. PR previews). Routing happens in the `site-pages`
// integration in astro.config.mjs, which applies the same rule.
//
// To publish a page: set "draft": false in pages.json.

import pages from '../content/pages.json';

export interface SitePage {
  slug: string;
  url: string;
  title: string;
  description: string;
  draft: boolean;
}

export const showDrafts = import.meta.env.DEV || process.env.SHOW_DRAFTS === '1';

const all: SitePage[] = Object.entries(pages).map(([slug, p]) => ({
  slug,
  url: `/${slug}/`,
  title: p.title,
  description: p.description,
  draft: Boolean(p.draft),
}));

export function visiblePages(): SitePage[] {
  return all.filter((p) => !p.draft || showDrafts);
}

export function getPage(slug: string): SitePage {
  const page = all.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown page "${slug}": add it to src/content/pages.json`);
  return page;
}
