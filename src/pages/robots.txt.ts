// /robots.txt: allow everything in production; builds that show drafts
// (PR previews) ask crawlers to stay away entirely.
import type { APIRoute } from 'astro';
import { showDrafts } from '../lib/pages';

export const GET: APIRoute = ({ site }) => {
  const body = showDrafts && !import.meta.env.DEV
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
