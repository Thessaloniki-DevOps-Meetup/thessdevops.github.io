// Single place that loads the events (our event files + upcoming events
// from the Meetup feed) and builds the YAML nav, shared by every page that
// uses BaseLayout.

import type { MarkdownInstance } from 'astro';

export interface EventEntry {
  /** Folder name under src/content/events/ (e.g. "003"), or "meetup-<id>" for feed-only events. */
  slug: string;
  /** The event's card on the home page, or its Meetup page for feed-only events. */
  url: string;
  /** True for events that only exist in the Meetup feed (no event file yet). */
  external: boolean;
  frontmatter: Record<string, any>;
  /** Start (–end) time in Athens, from the Meetup feed, e.g. "19:00–22:00". */
  time?: string;
  Content?: MarkdownInstance<Record<string, any>>['Content'];
  rawContent?: () => string;
}

/** Shape of src/data/meetup.json, written by scripts/sync-meetup.mjs. */
interface MeetupFeed {
  fetchedAt: string;
  events: {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD, Athens
    start?: string; // HH:MM, Athens
    end?: string;
    url: string;
    location?: string;
  }[];
}

const eventModules = import.meta.glob<MarkdownInstance<Record<string, any>>>(
  '../content/events/*/index.md',
  { eager: true },
);

// Optional: missing until the sync script has run once (glob returns {}).
const feedModules = import.meta.glob<{ default: MeetupFeed }>('../data/meetup.json', { eager: true });
const feed: MeetupFeed | undefined = Object.values(feedModules)[0]?.default;

const MEETUP_EVENT_URL = /^https:\/\/www\.meetup\.com\/[^/\s"'<>]+\/events\/\d+\/?$/;

/** Numeric Meetup event id from a meetup.com event URL. */
const meetupId = (url?: string) => url?.match(/\/events\/(\d+)/)?.[1];

const toDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

/**
 * Today's date in Athens, as UTC midnight: the same shape as frontmatter
 * dates, so "upcoming" doesn't depend on the build machine's timezone.
 * scripts/sync-meetup.mjs uses the same Athens date.
 */
const startOfToday = () =>
  toDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens' }).format(new Date()));

const dateMs = (e: EventEntry) => new Date(e.frontmatter.date).getTime();

/** Non-draft events with a positive number (skips _template). */
export function getPublishedEvents(): EventEntry[] {
  return Object.entries(eventModules)
    .map(([path, mod]) => ({
      slug: path.split('/').at(-2)!,
      url: `/#event-${mod.frontmatter.number}`,
      external: false,
      frontmatter: mod.frontmatter,
      Content: mod.Content,
      rawContent: mod.rawContent,
    }))
    .filter((e) => !e.frontmatter.draft && e.frontmatter.number && e.frontmatter.number > 0);
}

/**
 * Published events plus upcoming events from the Meetup feed.
 * Our event files win: a feed event with the same Meetup link only adds its
 * start/end time. Feed-only events are shown while upcoming and link to
 * Meetup (an expired cached feed can't resurrect past events).
 */
export function getAllEvents(): EventEntry[] {
  const published = getPublishedEvents();
  if (!feed) return published;

  const today = startOfToday().getTime();
  const byId = new Map(published.map((e) => [meetupId(e.frontmatter.meetupUrl), e]));
  const extra: EventEntry[] = [];

  for (const f of feed.events) {
    if (!MEETUP_EVENT_URL.test(f.url)) continue;
    const time = f.start ? (f.end ? `${f.start}–${f.end}` : f.start) : undefined;
    const match = byId.get(f.id);
    if (match) {
      match.time ??= time;
      continue;
    }
    if (toDate(f.date).getTime() < today) continue;
    extra.push({
      slug: `meetup-${f.id}`,
      url: f.url,
      external: true,
      time,
      frontmatter: {
        number: 0,
        title: f.title,
        date: toDate(f.date),
        location: f.location || undefined,
        meetupUrl: f.url,
        talks: [],
      },
    });
  }
  return [...published, ...extra];
}

/** Upcoming (soonest first) and past (newest first), split on today's date (Athens) at build time. */
export function splitEvents(events: EventEntry[] = getAllEvents()) {
  const today = startOfToday().getTime();
  const upcoming = events.filter((e) => dateMs(e) >= today).sort((a, b) => dateMs(a) - dateMs(b));
  const past = events.filter((e) => dateMs(e) < today).sort((a, b) => dateMs(b) - dateMs(a));
  return { upcoming, past };
}

// --- YAML nav ---------------------------------------------------------------

const PAST_INLINE = 2;

/** HTML-escape text and attribute values: the nav is rendered with set:html. */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const navItem = (e: EventEntry) => {
  const title = e.frontmatter.title ?? '';
  const date = e.frontmatter.date
    ? new Date(e.frontmatter.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '';
  const label = title || `event ${String(e.frontmatter.number).padStart(3, '0')}`;
  // Feed-only events open on Meetup.
  const ext = e.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const arrow = e.external ? ' ↗' : '';
  return `      - <a href="${esc(e.url)}"${ext} class="text-cream/80 hover:text-accent transition-colors">${esc(label)}${arrow}</a><span class="text-cream/40">:</span> <span class="text-cream/40">${esc(date || '~')}</span>`;
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
