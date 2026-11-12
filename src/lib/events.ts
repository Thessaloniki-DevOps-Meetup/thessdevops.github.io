// Single place that loads the events and builds the YAML nav, shared by
// every page that uses BaseLayout.

import type { MarkdownInstance } from 'astro';
import { z } from 'astro/zod';

// --- Schema -----------------------------------------------------------------
// Frontmatter is checked when the site builds (and in `npm run dev`), so a
// typo in an event file fails CI with a readable message instead of
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

export interface EventEntry {
  /** Folder name under src/content/events/ (e.g. "003"). */
  slug: string;
  /** Where the event is shown: its card on the home page. */
  url: string;
  frontmatter: EventFrontmatter;
  Content: MarkdownInstance<Record<string, any>>['Content'];
  rawContent: () => string;
}

const eventModules = import.meta.glob<MarkdownInstance<Record<string, any>>>(
  '../content/events/*/index.md',
  { eager: true },
);

const meetupId = (url?: string) => url?.match(/\/events\/(\d+)/)?.[1];

/** Validates every event file; throws one error listing all problems. */
function loadEvents(): EventEntry[] {
  const problems: string[] = [];
  const entries: EventEntry[] = [];

  for (const [path, mod] of Object.entries(eventModules)) {
    const slug = path.split('/').at(-2)!;
    if (slug.startsWith('_')) continue; // _template

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
      url: `/#event-${parsed.data.number}`,
      frontmatter: parsed.data,
      Content: mod.Content,
      rawContent: mod.rawContent,
    });
  }

  // Two published events can't share a number (it's the #event-N anchor) or a Meetup event.
  const seen = new Map<string, string>();
  for (const e of entries.filter((e) => !e.frontmatter.draft && e.frontmatter.number > 0)) {
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

const events = loadEvents();

const dateMs = (e: EventEntry) => new Date(e.frontmatter.date).getTime();

/** Non-draft events with a positive number. */
export function getPublishedEvents(): EventEntry[] {
  return events.filter((e) => !e.frontmatter.draft && e.frontmatter.number > 0);
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

/** HTML-escape text and attribute values: the nav is rendered with set:html. */
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const navItem = (e: EventEntry) => {
  const title = e.frontmatter.title ?? '';
  const date = e.frontmatter.date
    ? new Date(e.frontmatter.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const label = title || `event ${String(e.frontmatter.number).padStart(3, '0')}`;
  return `      - <a href="${esc(e.url)}" class="text-cream/80 hover:text-accent transition-colors">${esc(label)}</a><span class="text-cream/40">:</span> <span class="text-cream/40">${esc(date || '~')}</span>`;
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
