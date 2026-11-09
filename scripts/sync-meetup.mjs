// Fetches the group's public Meetup iCal feed and writes the upcoming
// events to src/data/meetup.json, which the site merges with the curated
// events in src/content/events/ (curated content always wins).
//
// Runs as part of `predev` / `prebuild`. Never fails the build:
//   - network/HTTP/parse error → keep the existing src/data/meetup.json
//     (last known good; in CI it's restored from the Actions cache) and warn.
//   - valid feed with no upcoming events → write an empty list.
// Expired events are dropped here and again at build time.
//
// Set MEETUP_SYNC=0 to skip (e.g. offline). No dependencies: the feed is
// simple enough to parse by hand (RFC 5545 line unfolding + properties).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';

const OUT = 'src/data/meetup.json';
const TZ = 'Europe/Athens';
const TIMEOUT_MS = 10_000;

const log = (msg) => console.log(`[sync-meetup] ${msg}`);
const warn = (msg) => {
  // Shows up as an annotation on the GitHub Actions run.
  if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Meetup sync::${msg}`);
  else console.warn(`[sync-meetup] WARNING: ${msg}`);
};

if (process.env.MEETUP_SYNC === '0') {
  log('skipped (MEETUP_SYNC=0).');
  process.exit(0);
}

const site = JSON.parse(await readFile('src/content/site.json', 'utf8'));
const groupUrl = site.socials?.meetup;
if (!groupUrl) {
  log('no socials.meetup in site.json, skipping.');
  process.exit(0);
}
const feedUrl = new URL('events/ical/', groupUrl.endsWith('/') ? groupUrl : `${groupUrl}/`).href;

const keepPrevious = (reason) => {
  warn(`${reason} Keeping ${existsSync(OUT) ? `the previous ${OUT}` : 'no feed data (none cached yet)'}.`);
  process.exit(0);
};

// --- Fetch ------------------------------------------------------------------

let text;
try {
  const res = await fetch(feedUrl, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'User-Agent': 'thessdevops-site-build (+https://www.thessdevops.org)', Accept: 'text/calendar' },
  });
  if (!res.ok) keepPrevious(`HTTP ${res.status} from ${feedUrl}.`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('text/calendar')) keepPrevious(`Unexpected content-type "${type}" from ${feedUrl}.`);
  text = await res.text();
} catch (err) {
  keepPrevious(`Could not fetch ${feedUrl}: ${err?.message ?? err}.`);
}

if (!/^BEGIN:VCALENDAR/m.test(text) || !/^END:VCALENDAR/m.test(text)) {
  keepPrevious('Response is not a complete iCalendar file.');
}

// --- Parse ------------------------------------------------------------------

/** RFC 5545 §3.1: lines starting with a space/tab continue the previous one. */
const unfold = (s) => s.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');

const unescapeText = (v) =>
  v.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');

/** "DTSTART;TZID=Europe/Athens:20261217T190000" → { name, params, value } */
function parseLine(line) {
  const colon = line.indexOf(':');
  if (colon < 0) return null;
  const [name, ...rawParams] = line.slice(0, colon).split(';');
  const params = Object.fromEntries(rawParams.map((p) => p.split('=')));
  return { name: name.toUpperCase(), params, value: line.slice(colon + 1) };
}

const pad = (n) => String(n).padStart(2, '0');

/** Date/time property → { date: 'YYYY-MM-DD', time?: 'HH:MM' } in Athens time. */
function athens(prop) {
  if (!prop) return null;
  const v = prop.value.trim();
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, , z] = m;
  if (!h) return { date: `${y}-${mo}-${d}` }; // VALUE=DATE (all day)
  if (z) {
    // UTC → Athens wall time.
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).formatToParts(new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi))).map((p) => [p.type, p.value]),
    );
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
  }
  const tzid = prop.params.TZID;
  if (tzid && tzid !== TZ) warn(`Event time in ${tzid}, shown as-is (expected ${TZ}).`);
  return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}` };
}

const lines = unfold(text).split('\n');
const vevents = [];
let current = null;
for (const raw of lines) {
  if (raw === 'BEGIN:VEVENT') current = {};
  else if (raw === 'END:VEVENT') {
    if (current) vevents.push(current);
    current = null;
  } else if (current) {
    const p = parseLine(raw);
    if (p && !(p.name in current)) current[p.name] = p;
  }
}

const todayAthens = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date()); // YYYY-MM-DD

const events = [];
for (const ev of vevents) {
  const status = ev.STATUS?.value.trim().toUpperCase();
  if (status === 'CANCELLED') continue;

  const start = athens(ev.DTSTART);
  const end = athens(ev.DTEND);
  const url = ev.URL?.value.trim();
  const id = url?.match(/\/events\/(\d+)/)?.[1] ?? ev.UID?.value.match(/event_(\d+)@/)?.[1];
  const title = ev.SUMMARY ? unescapeText(ev.SUMMARY.value).trim() : '';

  if (!start || !id || !url || !title) {
    warn(`Skipping a VEVENT with missing start/id/url/summary (${title || ev.UID?.value || '?'}).`);
    continue;
  }
  if ((end?.date ?? start.date) < todayAthens) continue; // already over

  events.push({
    id,
    title,
    date: start.date,
    ...(start.time && { start: start.time }),
    ...(end?.time && end.date === start.date && { end: end.time }),
    url: url.endsWith('/') ? url : `${url}/`,
    ...(ev.LOCATION && { location: unescapeText(ev.LOCATION.value).trim() }),
  });
}

events.sort((a, b) => (a.date + (a.start ?? '')).localeCompare(b.date + (b.start ?? '')));

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ source: feedUrl, fetchedAt: new Date().toISOString(), events }, null, 2) + '\n');
log(
  events.length === 0
    ? 'feed OK, no upcoming events.'
    : `feed OK, ${events.length} upcoming: ${events.map((e) => `${e.title} (${e.date})`).join(', ')}.`,
);
