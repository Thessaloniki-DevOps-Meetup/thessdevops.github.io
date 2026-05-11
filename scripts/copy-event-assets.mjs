// Copies non-markdown files from src/content/events/<NNN>/ into
// public/events/<NNN>/ before dev/build, so speakers can drop a PDF
// (or any other blob) next to index.md and reference it as
// /events/<NNN>/<filename> in their materials[].
//
// Runs as `predev` and `prebuild` via package.json — no need to call
// directly. Idempotent: it wipes public/events/<NNN>/ first so removed
// files don't linger.

import { readdir, mkdir, rm, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC = 'src/content/events';
const DST = 'public/events';

if (!existsSync(SRC)) {
  console.log(`[copy-event-assets] ${SRC} not found, skipping.`);
  process.exit(0);
}

let copied = 0;
const events = await readdir(SRC, { withFileTypes: true });

for (const ent of events) {
  if (!ent.isDirectory()) continue;
  if (ent.name.startsWith('_')) continue; // skip _template and friends

  const srcDir = join(SRC, ent.name);
  const dstDir = join(DST, ent.name);

  // Wipe our event-numbered directory so removed assets are reflected.
  await rm(dstDir, { recursive: true, force: true });

  const files = await readdir(srcDir, { withFileTypes: true });
  let madeDir = false;
  for (const f of files) {
    if (!f.isFile()) continue;
    if (extname(f.name).toLowerCase() === '.md') continue; // skip markdown
    if (f.name.startsWith('.')) continue; // skip dotfiles

    if (!madeDir) {
      await mkdir(dstDir, { recursive: true });
      madeDir = true;
    }
    await copyFile(join(srcDir, f.name), join(dstDir, f.name));
    console.log(`[copy-event-assets] ${ent.name}/${f.name}`);
    copied++;
  }
}

console.log(
  copied === 0
    ? '[copy-event-assets] no event blobs to copy.'
    : `[copy-event-assets] copied ${copied} file${copied === 1 ? '' : 's'}.`,
);
