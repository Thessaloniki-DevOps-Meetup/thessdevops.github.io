// Scans the built dist/index.html for any /events/<NNN>/... reference
// (event images, talk slides, etc.) and asserts the file exists in
// the dist/ output. Catches typos like /events/3/slides.pdf (missing
// zero-pad) or materials.url pointing to a file the speaker forgot
// to upload.
//
// Run with: node scripts/check-event-asset-links.mjs
// Expects `npm run build` to have produced dist/index.html.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const INDEX = 'dist/index.html';

if (!existsSync(INDEX)) {
  console.error(`[check-asset-links] ${INDEX} not found — run "npm run build" first.`);
  process.exit(1);
}

const html = await readFile(INDEX, 'utf8');
const ref = /(?:href|src)="(\/events\/[^"#?]+)/g;

const errors = [];
const seen = new Set();
let m;
while ((m = ref.exec(html)) !== null) {
  const url = m[1];
  if (seen.has(url)) continue;
  seen.add(url);

  // Resolve against dist/. Astro copies public/ verbatim into dist/.
  const local = join('dist', url);
  if (!existsSync(local)) {
    errors.push(`${url}  (expected to find ${local})`);
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
    : `[check-asset-links] OK — ${seen.size} /events/ link${seen.size === 1 ? '' : 's'} verified.`,
);
