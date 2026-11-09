// Single place that loads events (curated markdown + the Meetup feed),
// validates them, finds photos/videos and builds the YAML nav.

import type { ImageMetadata, MarkdownInstance } from 'astro';
import { z } from 'astro/zod';
import { visiblePages, type SitePage } from './pages';

// --- Schema -----------------------------------------------------------------
// Frontmatter is validated when the site builds (and in `npm run dev`), so a
// typo in a speaker's PR fails CI with a readable message instead of
// silently rendering a broken card. `.strict()` rejects unknown keys, which
// catches misspelt field names like `lable:` or `slideUrl:`.

const urlOrPath = z
  .string()
  .refine((v) => v === '' || v.startsWith('/') || /^https?:\/\//.test(v), {
    message: 'must be a full http(s):// URL or a /path (or empty)',
  });

const speakerSchema = z.object({ name: z.string().min(1, 'speaker name is required'), url: urlOrPath.optional() }).strict();

const materialSchema = z
  .object({
    type: z.string().optional(),
    label: z.string().optional(),
    url: urlOrPath.refine((v) => v !== '', 'url is required'),
  })
  .strict();

const talkSchema = z
  .object({
    title: z.string().min(1, 'talk title is required'),
    speakers: z.array(speakerSchema).optional(),
    description: z.string().optional(),
    slidesUrl: urlOrPath.optional(),
    videoUrl: urlOrPath.optional(),
    materials: z.array(materialSchema).optional(),
  })
  .strict();

const eventSchema = z
  .object({
    number: z.number().int().nonnegative(),
    title: z.string().min(1, 'event title is required'),
    // Astro serialises frontmatter, so YAML dates arrive as ISO strings.
    date: z.preprocess(
      (v) =>
        v instanceof Date
          ? v
          : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T00:00:00(\.000)?Z)?$/.test(v)
            ? new Date(`${v.slice(0, 10)}T00:00:00Z`)
            : v,
      z.date({
        invalid_type_error: 'must be a date like 2026-12-17 (YYYY-MM-DD)',
        required_error: 'is required (YYYY-MM-DD)',
      }),
    ),
    time: z
      .string()
      .regex(/^(\d{2}:\d{2}(\s*[–-]\s*\d{2}:\d{2})?)?$/, 'use HH:MM or HH:MM–HH:MM (Athens time)')
      .optional(),
    location: z.string().optional(),
    locationUrl: urlOrPath.optional(),
    meetupUrl: z
      .string()
      .refine((v) => v === '' || /^https:\/\/www\.meetup\.com\/[^/]+\/events\/\d+/.test(v), {
        message: 'must be a https://www.meetup.com/<group>/events/<id>/ URL (or empty)',
      })
      .optional(),
    description: z.string().optional(),
    image: urlOrPath.optional(),
    draft: z.boolean().optional(),
    talks: z.array(talkSchema).nullable().optional(),
  })
  .strict();

export type EventFrontmatter = z.infer<typeof eventSchema>;
export type Talk = z.infer<typeof talkSchema>;
export type Material = z.infer<typeof materialSchema>;
export type Speaker = z.infer<typeof speakerSchema>;

// --- Types ------------------------------------------------------------------

export interface EventEntry {
  /** Folder name under src/content/events/ (e.g. "003"), or "meetup-<id>" for feed-only events. */
  slug: string;
  /** Local event page, or the Meetup page for feed-only events. */
  url: string;
  /** True for events that only exist in the Meetup feed (no local page). */
  external: boolean;
  frontmatter: EventFrontmatter;
  Content?: MarkdownInstance<EventFrontmatter>['Content'];
  rawContent?: () => string;
}

export interface EventPhoto {
  name: string;
  src: ImageMetadata;
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

// --- Loading ----------------------------------------------------------------

const eventModules = import.meta.glob<MarkdownInstance<Record<string, unknown>>>(
  '../content/events/*/index.md',
  { eager: true },
);

const photoModules = import.meta.glob<{ default: ImageMetadata }>(
  '../content/events/*/photos/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true },
);

// Optional: missing until the sync script has run once (glob returns {}).
const feedModules = import.meta.glob<{ default: MeetupFeed }>('../data/meetup.json', { eager: true });
const feed: MeetupFeed | undefined = Object.values(feedModules)[0]?.default;

const slugFromPath = (path: string) => path.split('/').at(-2)!;

export const eventUrl = (slug: string) => `/events/${slug}/`;

const MEETUP_EVENT_URL = /^https:\/\/www\.meetup\.com\/[^/\s"'<>]+\/events\/\d+\/?$/;

/** Numeric Meetup event id from a meetup.com event URL. */
export const meetupId = (url?: string) => url?.match(/\/events\/(\d+)/)?.[1];

function loadCurated(): EventEntry[] {
  const problems: string[] = [];
  const entries: EventEntry[] = [];

  for (const [path, mod] of Object.entries(eventModules)) {
    const slug = slugFromPath(path);
    if (slug.startsWith('_')) continue; // _template and friends

    const parsed = eventSchema.safeParse(mod.frontmatter);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const where = issue.path.length ? issue.path.join('.') : '(frontmatter)';
        problems.push(`  src/content/events/${slug}/index.md → ${where}: ${issue.message}`);
      }
      continue;
    }
    entries.push({
      slug,
      url: eventUrl(slug),
      external: false,
      frontmatter: parsed.data,
      Content: mod.Content as EventEntry['Content'],
      rawContent: mod.rawContent,
    });
  }

  // Cross-file checks on published events.
  const published = entries.filter((e) => !e.frontmatter.draft && e.frontmatter.number > 0);
  const seen = new Map<string, string>();
  for (const e of published) {
    for (const [kind, key] of [
      ['number', String(e.frontmatter.number)],
      ['meetupUrl', meetupId(e.frontmatter.meetupUrl)],
    ] as const) {
      if (!key) continue;
      const other = seen.get(`${kind}:${key}`);
      if (other) problems.push(`  ${kind} ${key} is used by both events/${other}/ and events/${e.slug}/`);
      seen.set(`${kind}:${key}`, e.slug);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Invalid event content:\n${problems.join('\n')}\n\nSee src/content/events/_template/index.md for the expected format.`);
  }
  return entries;
}

const curated = loadCurated();

const toDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

/**
 * Today's date in Athens, as UTC midnight: the same shape as frontmatter
 * dates, so comparisons don't depend on the build machine's timezone.
 * scripts/sync-meetup.mjs uses the same Athens date.
 */
const startOfToday = () =>
  toDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens' }).format(new Date()));

const dateMs = (e: EventEntry) => new Date(e.frontmatter.date).getTime();

/** Curated, non-draft events with a positive number. These get their own pages. */
export function getPublishedEvents(): EventEntry[] {
  return curated.filter((e) => !e.frontmatter.draft && e.frontmatter.number > 0);
}

/**
 * Published events plus upcoming events from the Meetup feed.
 * Curated content wins: a feed event whose Meetup URL matches a curated
 * event only fills in a missing start/end time. Feed-only events are shown
 * only while upcoming (expired cache entries are dropped).
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
      if (!match.frontmatter.time && time) match.frontmatter.time = time;
      continue;
    }
    if (toDate(f.date).getTime() < today) continue;
    extra.push({
      slug: `meetup-${f.id}`,
      url: f.url,
      external: true,
      frontmatter: {
        number: 0,
        title: f.title,
        date: toDate(f.date),
        time,
        location: f.location || undefined,
        meetupUrl: f.url,
        talks: [],
      },
    });
  }
  return [...published, ...extra];
}

/** Upcoming (soonest first) and past (newest first), split on today's date at build time. */
export function splitEvents(events: EventEntry[] = getAllEvents()) {
  const today = startOfToday().getTime();
  const upcoming = events.filter((e) => dateMs(e) >= today).sort((a, b) => dateMs(a) - dateMs(b));
  const past = events.filter((e) => dateMs(e) < today).sort((a, b) => dateMs(b) - dateMs(a));
  return { upcoming, past };
}

export function getEventPhotos(slug: string): EventPhoto[] {
  return Object.entries(photoModules)
    .filter(([path]) => path.split('/').at(-3) === slug)
    .map(([path, mod]) => ({ name: path.split('/').at(-1)!, src: mod.default }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

// --- Materials & videos -----------------------------------------------------

/** slidesUrl/videoUrl shorthands + materials[], de-duplicated by URL. */
export function talkMaterials(t: Talk): Material[] {
  const out: Material[] = [];
  if (t.slidesUrl) out.push({ type: 'slides', url: t.slidesUrl });
  if (t.videoUrl) out.push({ type: 'video', url: t.videoUrl });
  for (const m of t.materials ?? []) {
    if (m.url && !out.some((x) => x.url === m.url)) out.push(m);
  }
  return out;
}

/** YouTube video id from watch / youtu.be / embed / live / shorts URLs. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    let id: string | null | undefined = null;
    if (host === 'youtu.be') id = u.pathname.split('/')[1];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:embed|live|shorts|v)\/([^/?#]+)/)?.[1];
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export interface EventVideo {
  id: string;
  url: string;
  talkTitle: string;
  speakers: string;
}

export function getEventVideos(event: EventEntry): EventVideo[] {
  const out: EventVideo[] = [];
  for (const t of event.frontmatter.talks ?? []) {
    for (const m of talkMaterials(t)) {
      const id = youtubeId(m.url);
      if (id && !out.some((v) => v.id === id)) {
        out.push({ id, url: m.url, talkTitle: t.title, speakers: (t.speakers ?? []).map((s) => s.name).join(', ') });
      }
    }
  }
  return out;
}

// --- Formatting -------------------------------------------------------------
// Frontmatter dates are date-only (YAML parses them as UTC midnight), so format
// in UTC to never shift the day regardless of the build machine's timezone.

const fmt = (d: string | Date, opts: Intl.DateTimeFormatOptions) =>
  new Date(d).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });

export const formatDateLong = (d: string | Date) =>
  fmt(d, { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateFull = (d: string | Date) =>
  fmt(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateParts = (d: string | Date) => ({
  day: fmt(d, { day: '2-digit' }),
  month: fmt(d, { month: 'short' }).toUpperCase(),
  weekday: fmt(d, { weekday: 'short' }).toUpperCase(),
});

/** "#007" — or "" for feed-only events, which have no curated number. */
export const formatNumber = (n: number) => (n > 0 ? `#${String(n).padStart(3, '0')}` : '');

// --- YAML nav ---------------------------------------------------------------
// Every line is its own block (no "\n" in the markup), so long entries can
// wrap with a hanging indent instead of falling back to column 0. The
// styles (.nav-line, .nav-item) live in BaseLayout.astro.

const PAST_INLINE = 2;

/** HTML-escape text and attribute values: the nav is rendered with set:html. */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const line = (html: string) => `<span class="nav-line">${html}</span>`;
const punct = (t: string) => `<span class="text-cream/40">${t}</span>`;
const linkClass = (current: boolean) =>
  current ? 'text-accent' : 'text-cream/80 hover:text-accent transition-colors';

export function buildYamlNav(current: { slug?: string; page?: string } = {}): string {
  const { upcoming, past } = splitEvents();

  const item = (e: EventEntry) => {
    const label = e.frontmatter.title || `event ${String(e.frontmatter.number).padStart(3, '0')}`;
    const date = e.frontmatter.date ? formatDateLong(e.frontmatter.date) : '~';
    const isCurrent = e.slug === current.slug;
    const aria = isCurrent ? ' aria-current="page"' : '';
    const ext = e.external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const arrow = e.external ? ' ↗' : '';
    // 6 spaces + "- " = 8ch, matched by the hanging indent of .nav-item.
    return `<span class="nav-item">      - <a href="${esc(e.url)}"${aria}${ext} class="${linkClass(isCurrent)}">${esc(label)}${arrow}</a>${punct(':')} <span class="text-cream/40 whitespace-nowrap">${esc(date)}</span></span>`;
  };

  const key = (name: string, indent = '  ') => line(`${indent}<span class="text-blue-gray">${name}</span>${punct(':')}`);
  const top = (name: string) => line(`<span class="text-accent">${name}</span>${punct(':')}`);

  // pages:
  const pageItem = (file: string, url: string, isCurrent: boolean, draft = false) =>
    `<span class="nav-item">  - <a href="${esc(url)}"${isCurrent ? ' aria-current="page"' : ''} class="${linkClass(isCurrent)}">${esc(file)}</a>${
      draft ? ` <span class="text-cream/30 whitespace-nowrap"># draft</span>` : ''
    }</span>`;
  const pages: SitePage[] = visiblePages();
  const pagesNav =
    top('pages') +
    pageItem('index.md', '/', current.page === 'index') +
    pages.map((p) => pageItem(`${p.slug}.md`, p.url, current.page === p.slug, p.draft)).join('') +
    pageItem('submit-talk.md', '/submit-talk/', current.page === 'submit-talk');

  // events:
  const upcomingNav = upcoming.length > 0 ? key('upcoming') + upcoming.map(item).join('') : '';

  const pastInline = past.slice(0, PAST_INLINE);
  const pastFolded = past.slice(PAST_INLINE);
  // Keep the folded block open when the current page is one of the folded events.
  const openAttr = pastFolded.some((e) => e.slug === current.slug) ? ' open' : '';

  const foldedBlock = pastFolded.length > 0
    ? `<details class="nav-fold"${openAttr}><summary class="cursor-pointer list-none"><span class="text-cream/40 hover:text-accent transition-colors">      # ${pastFolded.length} more ▸</span></summary>${pastFolded.map(item).join('')}<button type="button" class="nav-fold-close text-cream/40 hover:text-accent transition-colors">      # collapse ▴</button></details>`
    : '';

  const pastNav = past.length > 0 ? key('past') + pastInline.map(item).join('') + foldedBlock : '';

  return line(punct('---')) + pagesNav + top('events') + upcomingNav + pastNav;
}
