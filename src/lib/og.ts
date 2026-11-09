// Link-preview (Open Graph) images, generated at build time.
//
// Each card is an SVG laid out like the site's "terminal window" cards and
// rasterised to PNG with sharp (already used by Astro for images), so there
// is no headless browser or extra dependency involved. Text uses the
// system's monospace font (DejaVu Sans Mono on Linux/CI); the layout
// assumes a monospace advance of ~0.6em to wrap lines.

import sharp from 'sharp';

const C = { primary: '#2d4a5e', accent: '#e07a5f', cream: '#f5f0e8', blueGray: '#d5dfe5' };
const FONT = `'DejaVu Sans Mono', 'Liberation Mono', 'Noto Sans Mono', monospace`;
const W = 1200;
const H = 630;
const CHAR = 0.602; // monospace advance width, in em

export interface OgCard {
  /** File name in the window's title bar, e.g. "events/199.md". */
  file: string;
  /** Small label after DEVOPS · THESSALONÍKI, e.g. "#008". */
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Bottom line in accent colour, e.g. "Thu 17 Dec 2026 · 19:00–22:00 · OK!Thess". */
  meta?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Greedy word wrap for a monospace font; truncates the last line with "…". */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if ([...next].length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = [...word].length > maxChars ? [...word].slice(0, maxChars - 1).join('') + '…' : word;
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const last = [...lines[maxLines - 1]];
    lines[maxLines - 1] = (last.length >= maxChars ? last.slice(0, maxChars - 1).join('') : last.join('')).replace(/[\s.,;:–—-]+$/, '') + '…';
  }
  return lines;
}

const fits = (width: number, size: number) => Math.floor(width / (size * CHAR));

/** A small stack of shipping containers (the site's harbour theme), drawn
 *  in the window's title bar. (x, y) is the top-left of the stack. */
function containers(x: number, y: number): string {
  const box = (bx: number, by: number, fill: string, op: number) =>
    `<g transform="translate(${bx} ${by})" opacity="${op}">
      <rect width="44" height="15" rx="2" fill="${fill}"/>
      ${[9, 18, 27, 36].map((lx) => `<line x1="${lx}" y1="3" x2="${lx}" y2="12" stroke="${C.primary}" stroke-opacity="0.45" stroke-width="1.5"/>`).join('')}
    </g>`;
  return [
    box(x + 24, y, C.cream, 0.45),
    box(x, y + 18, C.accent, 0.9),
    box(x + 48, y + 18, C.blueGray, 0.6),
  ].join('');
}

export function ogSvg(card: OgCard): string {
  const pad = 110; // text left edge
  const textW = W - pad - 110;
  const parts: string[] = [];
  let y = 168;

  // Meta row: dot + DEVOPS · THESSALONÍKI (+ kicker)
  parts.push(`<circle cx="${pad + 7}" cy="${y - 8}" r="7" fill="${C.accent}"/>`);
  parts.push(`<text x="${pad + 26}" y="${y}" font-size="22" letter-spacing="4" fill="${C.cream}" fill-opacity="0.6">DEVOPS · THESSALONÍKI</text>`);
  if (card.kicker) {
    parts.push(`<text x="${W - 110}" y="${y}" font-size="24" font-weight="bold" letter-spacing="3" text-anchor="end" fill="${C.cream}" fill-opacity="0.45">${esc(card.kicker)}</text>`);
  }
  y += 30;

  // Title: shrink for long titles.
  const titleSize = [...card.title].length > 22 ? 56 : 72;
  const titleLines = wrap(card.title, fits(textW, titleSize), 2);
  for (const l of titleLines) {
    y += titleSize * 1.12;
    parts.push(`<text x="${pad}" y="${y}" font-size="${titleSize}" font-weight="bold" fill="${C.cream}">${esc(l)}</text>`);
  }

  // Subtitle
  if (card.subtitle) {
    y += 22;
    const size = 30;
    const maxLines = titleLines.length > 1 ? 2 : 3;
    for (const l of wrap(card.subtitle, fits(textW, size), maxLines)) {
      y += size * 1.38;
      parts.push(`<text x="${pad}" y="${y}" font-size="${size}" fill="${C.cream}" fill-opacity="0.82">${esc(l)}</text>`);
    }
  }

  // Bottom row: meta (left) + domain (right)
  const bottom = 528;
  if (card.meta) {
    const metaLine = wrap(card.meta, fits(textW - 300, 26), 1)[0];
    parts.push(`<text x="${pad}" y="${bottom}" font-size="26" font-weight="bold" fill="${C.accent}">${esc(metaLine)}</text>`);
  }
  parts.push(`<text x="${W - 100}" y="${bottom}" font-size="22" text-anchor="end" fill="${C.cream}" fill-opacity="0.45">thessdevops.org</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
  <rect width="${W}" height="${H}" fill="${C.primary}"/>
  <rect x="60" y="48" width="${W - 120}" height="${H - 120}" rx="14" fill="${C.accent}" fill-opacity="0.07" stroke="${C.accent}" stroke-opacity="0.6" stroke-width="2"/>
  <path d="M60 100 V62 a14 14 0 0 1 14 -14 H${W - 74} a14 14 0 0 1 14 14 V100 Z" fill="${C.accent}" fill-opacity="0.1"/>
  <line x1="60" y1="100" x2="${W - 60}" y2="100" stroke="${C.accent}" stroke-opacity="0.35" stroke-width="2"/>
  <circle cx="92" cy="74" r="7" fill="${C.accent}"/>
  <circle cx="116" cy="74" r="7" fill="${C.cream}" fill-opacity="0.3"/>
  <circle cx="140" cy="74" r="7" fill="${C.cream}" fill-opacity="0.3"/>
  <text x="170" y="81" font-size="20" fill="${C.cream}" fill-opacity="0.6">${esc(card.file)}</text>
  ${containers(W - 60 - 30 - 92, 58)}
  ${parts.join('\n  ')}
</svg>`;
}

/** 2400×1260 PNG (2× density), same size as the site-wide og-image.png. */
export async function ogPng(card: OgCard): Promise<Buffer> {
  return sharp(Buffer.from(ogSvg(card)), { density: 144 }).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
}

export function pngResponse(png: Buffer): Response {
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
}
