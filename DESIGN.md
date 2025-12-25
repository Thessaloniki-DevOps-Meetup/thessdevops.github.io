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

## Pages

| Route              | Description                          |
|--------------------|--------------------------------------|
| `/`                | Home - general info about the meetup |
| `/events/`         | Events listing (archive)             |
| `/events/[slug]/`  | Individual event page with talks     |
| `/contact/`        | Contact details and social links     |

**Note:** No separate `/talks/` page. Talks are displayed within their parent event pages.

## Directory Structure

```
/src
  /content
    site.yaml                 # Site configuration
    /events
      001.md                  # Event files (numbered)
      002.md
  /pages
    index.astro
    contact.astro
    events/
      index.astro             # Events listing
      [slug].astro            # Dynamic event pages
  /layouts
    Layout.astro              # Base layout
  /components
    EventCard.astro
    TalkCard.astro
    Header.astro
    Footer.astro
/public
  /images
    /events                   # Event hero images (user-provided)
```

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
    "twitter": ""
  }
}
```

### Event (`src/content/events/001.md`)

```yaml
---
number: 1
title: "Meetup #001"
date: 2025-01-15              # YYYY-MM-DD format
location: ""
locationUrl: ""               # Optional: Google Maps link
meetupUrl: ""                 # Link to this event on meetup.com
description: ""
image: ""                     # Optional: path to hero image
talks:
  - title: ""
    speakers:
      - name: ""
        url: ""               # Optional: speaker's LinkedIn/Twitter
    description: ""
    videoUrl: ""              # Optional
    slidesUrl: ""             # Optional
---

Optional markdown body for additional event details, notes, or recap.
```

## Design Principles

1. **Markdown-driven:** All content lives in markdown/yaml files. No hardcoded content.
2. **Blank slate:** No placeholder or fake content. Empty state until real content is added.
3. **Minimal:** Clean, technical aesthetic. No unnecessary decoration.
4. **Portable:** Pure static output, deployable anywhere.

## Event Numbering Convention

Events use `#001`, `#002`, etc. format as shown in official slides/branding.
File names match: `001.md`, `002.md`, etc.
