// /events/<folder>/og.png — link-preview image for each event page.
import type { APIRoute } from 'astro';
import { formatDateFull, formatNumber, getPublishedEvents } from '../../../lib/events';
import { ogPng, pngResponse } from '../../../lib/og';

export function getStaticPaths() {
  return getPublishedEvents().map((e) => ({ params: { slug: e.slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const e = getPublishedEvents().find((x) => x.slug === params.slug)!;
  const fm = e.frontmatter;
  const png = await ogPng({
    file: `events/${e.slug}.md`,
    kicker: formatNumber(fm.number),
    title: fm.title || `Meetup ${formatNumber(fm.number)}`,
    subtitle: fm.description,
    meta: [formatDateFull(fm.date), fm.time, fm.location].filter(Boolean).join(' · '),
  });
  return pngResponse(png);
};
