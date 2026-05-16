---
name: og-image
description: Regenerate or redesign the social link-preview image (Open Graph / Twitter card) for the Thessaloníki DevOps Meetup site. Use this whenever the user wants to update the OG image, change the text or layout of the card shown when the site URL is shared on iMessage / Slack / Discord / X / LinkedIn / WhatsApp, refresh the preview after a copy change in site.json, or troubleshoot a stale or broken link preview — even if they don't say "OG image" by name (phrases like "social preview", "link preview", "share card", "the picture that shows when I paste the link" all qualify).
---

# OG image generation

This site bakes its social preview at build time from an HTML template, screenshotted by Playwright. The output is committed to `public/og-image.png` and the meta tags in `src/pages/index.astro` already point at it.

## When to use

- The user wants to change the **text** on the OG card (title, tagline, description, the `# about.md` label, the `DEVOPS · THESSALONÍKI` line).
- The user wants to change the **layout, colors, font sizes** of the card.
- The site's `site.json` changed and the OG card should be refreshed to match.
- The PNG looks stale or the preview is wrong on a sharing platform.

If the user just wants to **verify** the preview shows up correctly without changing it, send them to a tunneled `npm run preview` + https://www.opengraph.xyz/ instead — no regeneration needed.

## The pipeline

```
scripts/og-template.html   ← edit this for any visual/text change
        │
        ▼  (Playwright headless Chromium, 1200×630 viewport, DPR 2)
scripts/generate-og-image.mjs
        │
        ▼
public/og-image.png        ← 2400×1260, committed to the repo
        │
        ▼  (referenced by absolute URL in)
src/pages/index.astro      ← <meta property="og:image" ...>
```

`npm run gen:og` runs the screenshot script. It requires Playwright's Chromium to be installed locally — `npx playwright install chromium` if it's not.

## Workflow

1. **Identify what's changing.** Text-only (e.g. new tagline)? Visual (font size, colors, spacing)? Both?
2. **Edit `scripts/og-template.html`.** It's a self-contained HTML file — CSS is inline, palette variables match `src/pages/index.astro` (`--primary` / `--accent` / `--cream` / `--blue-gray`). The card is a 4-element composition: the `# about.md` faded label on top, an orange dot + `DEVOPS · THESSALONÍKI` chip line, big bold title, tagline. The card intentionally drops the Hero's description, CTAs, and "speak/host/sponsor" line — see the readability rule below.
3. **Mind the title width.** The title uses `white-space: nowrap` and is sized to fit `Thessaloníki DevOps Meetup` on one line at 60px monospace bold. If the title text gets longer, drop the size or allow wrapping — don't let it run off the canvas. The safe content area is 1040px wide (1200 − 80px padding × 2).
4. **Regenerate:**
   ```
   npm run gen:og
   ```
   Confirm the script logged `✓ wrote …/public/og-image.png` and that the file timestamp updated.
5. **Spot-check the output** by reading `public/og-image.png` (it renders inline). Look for: title not clipped, all rows visible, vertical centering balanced.
6. **Simulate the LinkedIn small variant** before committing:
   ```
   magick public/og-image.png -resize 480x252 /tmp/og-480.png
   ```
   Then read `/tmp/og-480.png`. If any text row turns mushy/illegible at that size, the card is overloaded — see "Design for the 480px downscale" below.
7. **If dimensions changed** (you changed the viewport or DPR in `scripts/generate-og-image.mjs`), update the matching meta tags in [src/pages/index.astro](src/pages/index.astro): `og:image:width` and `og:image:height`. The default is 2400 × 1260 (1200×630 logical × DPR 2).
8. **Don't touch the SVG fallback** — there isn't one. The PNG is the only artifact.

## Design for the 480px downscale

LinkedIn (and several other surfaces — search results, sidebars, embedded shares) renders the OG card at 480×252 in compact contexts. Anything sourced from a 1200×630 canvas gets a 2.5× downscale on top of LinkedIn's re-encode. Body copy sized like real body copy disappears.

**Rule of thumb**: at 480×252, every line of text should still be legible. The card is a **poster**, not a document.

- Avoid multi-line descriptive paragraphs. One tagline is plenty.
- Source text at **≥30px** for body, **≥28px** for chips/labels, **≥60px** for the title. Smaller than that and it becomes mush after the 2.5× downscale + LinkedIn's encoder.
- Prefer high-contrast type colors (`var(--cream)` at ≥0.65 opacity) over the soft `0.4–0.55` greys you'd use on the real page — subtle tonality dies in compression.
- Always run the `magick … -resize 480x252` check in step 6 before committing. The earlier iteration of this card included a 3-line description at 22px source size and turned to mush at 480px wide; that's the failure mode we're guarding against.

## Constraints worth knowing

- **Monospace font** is the system stack (`ui-monospace, SF Mono, Menlo, …`). On macOS this renders crisply via Menlo; on Linux CI it may fall back to a less ideal mono, so locally-regenerated PNGs are the source of truth — don't add `npm run gen:og` to `prebuild` unless CI has the same fonts.
- **No external assets.** The template must stay self-contained (no remote fonts, no remote images). Playwright loads it via `file://`.
- **The PNG is committed.** Treat it like any other source artifact — re-run `npm run gen:og` and commit the new PNG alongside template changes.
- **Most platforms reject SVG OG images.** Don't replace the PNG with an SVG even if it would be smaller.

## Verifying after deploy

Once a change ships:

- Paste the production URL into [opengraph.xyz](https://www.opengraph.xyz/) — single page that previews FB / Twitter / LinkedIn / iMessage / Slack / Discord at once.
- For the official cache-busters: Meta's [Sharing Debugger](https://developers.facebook.com/tools/debug/) and LinkedIn's [Post Inspector](https://www.linkedin.com/post-inspector/) — both have a "scrape again" button.
- iMessage / WhatsApp / Signal cache locally; if a colleague says the preview is wrong, ask if they've ever previewed the URL before — clearing their app cache (or sending from a new contact thread) is often the fix.

## Files at a glance

- [scripts/og-template.html](../../../scripts/og-template.html) — the source layout.
- [scripts/generate-og-image.mjs](../../../scripts/generate-og-image.mjs) — Playwright runner. Owns the viewport / DPR.
- [public/og-image.png](../../../public/og-image.png) — the generated artifact.
- [src/pages/index.astro](../../../src/pages/index.astro) — meta tag block in `<head>`.
- `package.json` script: `gen:og`.
