// /og/<page>.png — link-preview images for the extra pages (about, media,
// sponsors…) and /submit-talk. Draft pages only get one when they're visible.
import type { APIRoute } from 'astro';
import siteConfig from '../../content/site.json';
import { visiblePages } from '../../lib/pages';
import { ogPng, pngResponse } from '../../lib/og';

const cards = () => [
  ...visiblePages().map((p) => ({ page: p.slug, title: p.title, subtitle: p.description })),
  {
    page: 'submit-talk',
    title: 'Submit a talk',
    subtitle: "Beginners and first-timers welcome. Tell us what you'd like to talk about!",
  },
];

export function getStaticPaths() {
  return cards().map((c) => ({ params: { page: c.page } }));
}

export const GET: APIRoute = async ({ params }) => {
  const c = cards().find((x) => x.page === params.page)!;
  const png = await ogPng({ file: `${c.page}.md`, title: c.title, subtitle: c.subtitle, meta: siteConfig.name });
  return pngResponse(png);
};
