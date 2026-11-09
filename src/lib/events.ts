// Single place that loads the events and builds the YAML nav, shared by
// every page that uses BaseLayout.

import type { MarkdownInstance } from 'astro';

export interface EventEntry {
  /** Folder name under src/content/events/ (e.g. "003"). */
  slug: string;
  /** Where the event is shown: its card on the home page. */
  url: string;
  frontmatter: Record<string, any>;
  Content: MarkdownInstance<Record<string, any>>['Content'];
  rawContent: () => string;
}

const eventModules = import.meta.glob<MarkdownInstance<Record<string, any>>>(
  '../content/events/*/index.md',
  { eager: true },
);

const dateMs = (e: EventEntry) => new Date(e.frontmatter.date).getTime();

/** Non-draft events with a positive number (skips _template). */
export function getPublishedEvents(): EventEntry[] {
  return Object.entries(eventModules)
    .map(([path, mod]) => ({
      slug: path.split('/').at(-2)!,
      url: `/#event-${mod.frontmatter.number}`,
      frontmatter: mod.frontmatter,
      Content: mod.Content,
      rawContent: mod.rawContent,
    }))
    .filter((e) => !e.frontmatter.draft && e.frontmatter.number && e.frontmatter.number > 0);
}

/** Upcoming (soonest first) and past (newest first), split on today's date at build time. */
export function splitEvents(events: EventEntry[] = getPublishedEvents()) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = events.filter((e) => dateMs(e) >= today.getTime()).sort((a, b) => dateMs(a) - dateMs(b));
  const past = events.filter((e) => dateMs(e) < today.getTime()).sort((a, b) => dateMs(b) - dateMs(a));
  return { upcoming, past };
}

// --- YAML nav ---------------------------------------------------------------

const PAST_INLINE = 2;

const navItem = (e: EventEntry) => {
  const title = e.frontmatter.title ?? '';
  const date = e.frontmatter.date
    ? new Date(e.frontmatter.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const label = title || `event ${String(e.frontmatter.number).padStart(3, '0')}`;
  return `      - <a href="${e.url}" class="text-cream/80 hover:text-accent transition-colors">${label}</a><span class="text-cream/40">:</span> <span class="text-cream/40">${date || '~'}</span>`;
};

/** The `events:` YAML block in the left panel (desktop) and at the bottom (phones). */
export function buildYamlNav(): string {
  const { upcoming, past } = splitEvents();

  const upcomingNav = upcoming.length > 0
    ? `  <span class="text-blue-gray">upcoming</span><span class="text-cream/40">:</span>\n${upcoming.map(navItem).join('\n')}`
    : '';

  const pastInline = past.slice(0, PAST_INLINE);
  const pastFolded = past.slice(PAST_INLINE);

  const foldedBlock = pastFolded.length > 0
    ? `<details class="nav-fold"><summary class="cursor-pointer list-none"><span class="text-cream/40 hover:text-accent transition-colors">      # ${pastFolded.length} more ▸</span></summary>${pastFolded.map((e) => '\n' + navItem(e)).join('')}\n<button type="button" class="nav-fold-close text-cream/40 hover:text-accent transition-colors">      # collapse ▴</button></details>`
    : '';

  const pastNav = past.length > 0
    ? `  <span class="text-blue-gray">past</span><span class="text-cream/40">:</span>\n${[
        pastInline.map(navItem).join('\n'),
        foldedBlock,
      ].filter(Boolean).join('\n')}`
    : '';

  const eventsNav = [upcomingNav, pastNav].filter(Boolean).join('\n');

  return `<span class="text-cream/40">---</span>
<span class="text-accent">events</span><span class="text-cream/40">:</span>
${eventsNav}`;
}
