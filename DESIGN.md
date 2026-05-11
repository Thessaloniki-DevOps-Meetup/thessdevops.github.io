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

**Single-page design** with two full-height panels:

| Panel | Content |
|-------|--------------------------------------|
| Left (50%) | YAML-style navigation with syntax highlighting |
| Right (50%) | Scrollable content sections |

### Sections (anchor-based navigation)
- `#home` — General info about the meetup
- `#events` — Events archive with all events listed
- `#event-{number}` — Jump to specific event (e.g., `#event-1`)
- `#contact` — Contact details and social links

### YAML Navigation Syntax Colors
- **Keys (top-level):** Accent coral (`#e07a5f`)
- **Keys (nested):** Blue-gray (`#d5dfe5`)
- **Values:** Cream (`#f5f0e8`)
- **Punctuation/comments:** Cream at 50% opacity
- **Empty values:** `~` in cream at 30% opacity

## Directory Structure

Each event lives in its own directory under `src/content/events/`. The
event's markdown is `index.md`; sibling files (notes, source for slides,
PDFs that are too big for `public/`) can live next to it. Assets that
need a public URL (linked from `slidesUrl` / `videoUrl` / `materials`)
go under `public/events/NNN/` and are referenced with root-relative
paths (e.g. `/events/003/observability.pdf`).

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
        notes.md                    # (optional) extra notes — not auto-rendered
  /components
    EventCard.astro                 # Reused per-event card
  /pages
    index.astro                     # Single-page app
/public
  favicon.svg
  /events
    /003
      observability.pdf             # Referenced as /events/003/observability.pdf
      hero.jpg                      # Referenced as /events/003/hero.jpg
```

Event lookup uses the glob `src/content/events/**/*.md` and filters
on `frontmatter.number > 0 && !draft`, so the template (number 0,
draft) is silently skipped. Files without a `number` (notes, READMEs)
are also ignored — keep those next to `index.md` freely.

## Content Schema

### Site Configuration (`src/content/site.json`)

```json
{
  "name": "DevOps Thessaloníki",
  "tagline": "",
  "description": "",
  "email": "",
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
5. **Single-page:** All content on one page with anchor navigation and smooth scrolling.
6. **Terminal aesthetic:** YAML-like syntax highlighting for navigation, monospace font.

## Event Numbering Convention

Events use `#001`, `#002`, etc. format as shown in official slides/branding.
File names match: `001.md`, `002.md`, etc.
