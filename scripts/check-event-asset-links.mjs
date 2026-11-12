// Checks every internal link in the built site: scans all dist/**/*.html
// for root-relative href/src values (/events/003/slides.pdf, /about/,
// /assets/…) and asserts each one resolves to a real file in dist/.
//
// Catches typos like /events/3/slides.pdf (missing zero-pad), materials
// pointing at a file the speaker forgot to upload, and links to pages that
// don't exist (e.g. /submit-a-talk instead of /submit-talk).
//
// Run with: node scripts/check-event-asset-links.mjs
// Expects `npm run build` to have produced dist/.

import { readFile, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`[check-links] ${DIST}/index.html not found — run "npm run build" first.`);
  process.exit(1);
}

const pages = (await readdir(DIST, { recursive: true }))
  .filter((f) => f.endsWith('.html'))
  .map((f) => join(DIST, f));

// Root-relative only: skips external URLs, mailto:, javascript:, "#…" and "//cdn…".
const ref = /(?:href|src)="(\/(?!\/)[^"#?]*)/g;

/** "/about/" → dist/about/index.html; "/x.pdf" → dist/x.pdf; "/x" → dist/x or dist/x.html */
function resolves(url) {
  let path;
  try {
    path = decodeURIComponent(url);
  } catch {
    return false;
  }
  const local = join(DIST, path);
  if (path.endsWith('/')) return existsSync(join(local, 'index.html'));
  if (existsSync(local)) return statSync(local).isFile() || existsSync(join(local, 'index.html'));
  return existsSync(`${local}.html`);
}

const errors = [];
const seen = new Set();
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  let m;
  while ((m = ref.exec(html)) !== null) {
    const url = m[1];
    if (seen.has(url)) continue;
    seen.add(url);
    if (!resolves(url)) errors.push(`${url}  (linked from ${page})`);
  }
}

if (errors.length > 0) {
  console.error(`[check-links] ${errors.length} broken internal link${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error('  - ' + e);
  console.error('\nHint: event files go in src/content/events/<NNN>/ (they are copied during build).');
  process.exit(1);
}

console.log(`[check-links] OK — ${seen.size} internal link${seen.size === 1 ? '' : 's'} verified across ${pages.length} pages.`);
