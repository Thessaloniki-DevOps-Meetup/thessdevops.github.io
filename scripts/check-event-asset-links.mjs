// Scans every built page in dist/ for any /events/<NNN>/... reference
// (event images, talk slides, etc.) and asserts the file exists in
// the dist/ output. Catches typos like /events/3/slides.pdf (missing
// zero-pad) or materials.url pointing to a file the speaker forgot
// to upload.
//
// Run with: node scripts/check-event-asset-links.mjs
// Expects `npm run build` to have produced dist/.

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`[check-asset-links] ${DIST}/index.html not found — run "npm run build" first.`);
  process.exit(1);
}

const pages = (await readdir(DIST, { recursive: true }))
  .filter((f) => f.endsWith('.html'))
  .map((f) => join(DIST, f));

const ref = /(?:href|src)="(\/events\/[^"#?]+)/g;

const errors = [];
const seen = new Set();
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  let m;
  while ((m = ref.exec(html)) !== null) {
    const url = m[1];
    if (seen.has(url)) continue;
    seen.add(url);

    // Resolve against dist/. Astro copies public/ verbatim into dist/;
    // /events/<NNN>/ itself resolves to the generated event page.
    const local = join(DIST, url);
    if (!existsSync(local)) {
      errors.push(`${url}  (linked from ${page}, expected to find ${local})`);
    }
  }
}

if (errors.length > 0) {
  console.error(`[check-asset-links] ${errors.length} broken event link${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error('  - ' + e);
  console.error('\nHint: drop the file into src/content/events/<NNN>/ — it will be copied during build.');
  process.exit(1);
}

console.log(
  seen.size === 0
    ? '[check-asset-links] no /events/ asset links found — nothing to check.'
    : `[check-asset-links] OK — ${seen.size} /events/ link${seen.size === 1 ? '' : 's'} verified across ${pages.length} pages.`,
);
