# DevOps Thessaloníki Website - Design Specification

This document serves as the source of truth for the website architecture, design decisions, and content schema. AI agents should reference this file when making changes.

## Tech Stack

- **Framework:** Astro (static site generator)
- **Styling:** TailwindCSS
- **Content:** Markdown files with YAML frontmatter
- **Hosting:** GitHub Pages (portable to any static host)

## Branding

### Name
DevOps Thessaloníki

### Colors
| Name       | Hex       | Usage                        |
|------------|-----------|------------------------------|
| Primary    | `#2d4a5e` | Dark teal, logo badge, text  |
| Accent     | `#e07a5f` | Coral/salmon, highlights     |
| Background | `#f5f0e8` | Light cream                  |
| Alt BG     | `#d5dfe5` | Light blue-gray              |

### Typography
- **Font:** Trebuchet MS / monospace fallback
- **Style:** Minimal, clean, technical

### Theme
Container/port/harbor aesthetic:
- Container ships
- Port cranes
- Harbor imagery
- Reflects "containers" in DevOps context

## Layout

**Two-panel shell, multiple pages.** Every main page uses
`src/layouts/BaseLayout.astro`:

| Panel | Content |
|-------|--------------------------------------|
| Left (40%, sticky, desktop) | `# about.md` hero + `# nav.yaml` YAML-style navigation |
| Right (60%) | The page's content |

On mobile the about block sits on top (home page only), the content
follows, and the nav is at the bottom behind a sticky `# nav.yaml` bar.

### Pages
- `/` — Home: `# next.md` (next upcoming meetup, or "TBA — follow on
  Meetup"), `# latest.md` (the 3 most recent past meetups as clickable
  summaries: title, description, talk titles), `# archive.md` (older
  meetups, one line each).
- `/events/<folder>/` — One page per event: full details, talks,
  materials, markdown body, photo gallery, previous/next links.
  Old `/#event-<number>` links redirect here.
- `/submit-talk/` — Talk submission form.
- `/about/`, `/media/`, `/sponsors/` — Extra pages in `src/site-pages/`,
  listed in `src/content/pages.json`. **Draft** pages (`"draft": true`)
  are only routed in `astro dev` or with `SHOW_DRAFTS=1` (via the
  `site-pages` integration in `astro.config.mjs`); they show a DRAFT
  banner, `# draft` in the nav and `noindex`.
- `/404.html` — "incident report" style not-found page.
- `/sitemap.xml`, `/robots.txt` — generated endpoints (no plugin).

The nav lists pages as files (`pages: - index.md - about.md …`) above the
`events:` tree. Upcoming events from the Meetup feed that have no event
folder yet appear in lists and nav with a `↗` link to Meetup.

### Link previews
Every page has Open Graph/Twitter tags. Event pages and extra pages get
a generated 2400×1260 PNG (`src/lib/og.ts`): an SVG drawn like the
site's terminal-window card, rasterised with `sharp` at build time. The
home page uses the hand-made `public/og-image.png`.

Section labels use the file-name style (`# next.md`, `# photos/`) to
keep the terminal aesthetic.

### YAML Navigation Syntax Colors
- **Keys (top-level):** Accent coral (`#e07a5f`)
- **Keys (nested):** Blue-gray (`#d5dfe5`)
- **Values:** Cream (`#f5f0e8`)
- **Punctuation/comments:** Cream at 50% opacity
- **Empty values:** `~` in cream at 30% opacity

## Directory Structure

Each event lives in its own directory under `src/content/events/`. The
event's markdown is `index.md`. Any other file next to it (PDF, PPTX,
image…) is copied to `public/events/NNN/` by
`scripts/copy-event-assets.mjs` before dev/build, and referenced with a
root-relative path (e.g. `/events/003/observability.pdf`). That is the
same URL folder as the event's page (`/events/003/`).

Photos go in a `photos/` subfolder. They are *not* copied as-is: they
are imported through Astro's image pipeline (`astro:assets`) and
rendered as resized WebP by `PhotoGallery.astro`.

```
/src
  /content
    site.json                       # Site configuration
    /events
      /_template
        index.md                    # Template (draft: true, ignored)
      /001
        index.md
      /002
        index.md
      /003
        index.md
        observability.pdf           # → /events/003/observability.pdf
        notes.md                    # (optional) extra notes — not auto-rendered
        /photos                     # (optional) gallery on /events/003/
          01.jpg
  /components
    EventCard.astro                 # Full event (event page)
    EventSummary.astro              # Compact clickable card (home)
    UpcomingBlock.astro             # Next meetup block (home)
    PhotoGallery.astro              # Photo grid + lightbox (event page)
  /layouts
    BaseLayout.astro                # <head> + two-panel shell
  /lib
    events.ts                       # Event/photo loading, formatting, nav
  /pages
    index.astro                     # Home
    /events/[slug].astro            # /events/<folder>/
    submit-talk.astro
/public
  favicon.svg
  /events                           # Generated from src/content/events (gitignored)
```

Event lookup (`src/lib/events.ts`) uses the glob
`src/content/events/*/index.md` and filters on
`frontmatter.number > 0 && !draft`, so the template (number 0, draft)
is silently skipped. Other markdown files (notes, READMEs) next to
`index.md` are ignored.

## Content Schema

Event frontmatter is validated on every build by a zod schema in
`src/lib/events.ts` (unknown keys, bad dates/URLs, missing titles,
duplicate numbers or Meetup URLs fail the build with a list of problems).

### Site Configuration (`src/content/site.json`)

```json
{
  "name": "DevOps Thessaloníki",
  "tagline": "",
  "description": "",
  "email": "",          // main contact; the hero links to it (mailto)
  "emailCc": [],        // optional: addresses cc'd on that mailto link
  "meetupUrl": "",
  "socials": {
    "discord": "",
    "linkedin": "",
    "github": "",
  }
}
```

### Event (`src/content/events/001/index.md`)

```yaml
---
number: 1
title: "Meetup #001"
date: 2025-01-15              # YYYY-MM-DD format
time: "19:00–22:00"           # Optional, Athens time (filled from the Meetup feed if empty)
location: ""
locationUrl: ""               # Optional: Google Maps link
meetupUrl: ""                 # Link to this event on meetup.com
description: ""
image: ""                     # Optional: path to hero image (e.g. /events/001/hero.jpg)
draft: false
talks:
  - title: ""
    speakers:
      - name: ""
        url: ""               # Optional: speaker's LinkedIn/Twitter
    description: ""
    slidesUrl: ""             # Optional shorthand — renders as ◆ slides pill
    videoUrl: ""              # Optional shorthand — renders as ▶ video pill
    materials:                # Optional richer list, rendered as pills below slides/video
      - type: slides          #   known types: slides, video|recording, code|repo|github, demo, notes
        label: "Slides (PDF)" #   optional label override
        url: "/events/001/talk-1.pdf"
      - type: code
        label: "GitHub repo"
        url: "https://github.com/..."
---

Optional markdown body — recap, photos, links to attendee notes,
sponsor mentions. Rendered inline under the event card.
```

#### Material conventions

- Anything in `public/events/NNN/` is served at `https://site/events/NNN/...`.
- For external links (YouTube, Speakerdeck, blog recaps), just paste
  the full URL into `url`.
- `type` controls the glyph; unknown types fall back to `↗`.
- `slidesUrl` / `videoUrl` are shorthand for a single material each;
  use `materials[]` when you have more than one resource of the same
  kind, or types beyond slides/video.

## Design Principles

1. **Markdown-driven:** All content lives in markdown/JSON files. No hardcoded content.
2. **Blank slate:** No placeholder or fake content. Empty state until real content is added.
3. **Minimal:** Clean, technical aesthetic. No unnecessary decoration.
4. **Portable:** Pure static output, deployable anywhere.
5. **Few, focused pages:** Home is an overview (next meetup + latest); details live on each event's page. Same two-panel shell everywhere.
6. **Terminal aesthetic:** YAML-like syntax highlighting for navigation, monospace font.

## Event Numbering Convention

Events use `#001`, `#002`, etc. format as shown in official slides/branding.
Folders are named after the event (`001/`, `101/`…) and the folder name is
the page URL (`/events/101/`). The `number` field is the sequential card
tag. (The numbering scheme is under discussion.)
