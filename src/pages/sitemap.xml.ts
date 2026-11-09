// /sitemap.xml: home, published extra pages, submit-talk and every event
// page. Draft pages are left out unless the build shows drafts.
import type { APIRoute } from 'astro';
import { getPublishedEvents } from '../lib/events';
import { visiblePages } from '../lib/pages';

export const GET: APIRoute = ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const urls: { loc: string }[] = [
    { loc: abs('/') },
    ...visiblePages().map((p) => ({ loc: abs(p.url) })),
    { loc: abs('/submit-talk/') },
    ...getPublishedEvents().map((e) => ({ loc: abs(e.url) })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
