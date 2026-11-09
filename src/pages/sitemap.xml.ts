// /sitemap.xml: the site's public pages, so search engines find them all.
// Add new pages to PAGES. (Events live on the home page as #event-N anchors,
// which sitemaps don't list.)
import type { APIRoute } from 'astro';

const PAGES = ['/', '/submit-talk/'];

export const GET: APIRoute = ({ site }) => {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
