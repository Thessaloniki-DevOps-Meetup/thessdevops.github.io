# Thessaloníki DevOps Meetup Website

Static website for the Thessaloníki DevOps Meetup community.

**Live site:** https://www.thessdevops.org

## Tech Stack

- [Astro](https://astro.build/) - Static site generator
- [TailwindCSS](https://tailwindcss.com/) - Styling
- Markdown - Content management

## Prerequisites

- Node.js 18+ (recommended: 20)
- npm

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:4321`

## Commands

| Command           | Description                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Start dev server at `localhost:4321`     |
| `npm run build`   | Build production site to `./dist/`       |
| `npm run preview` | Preview build locally before deploying   |

## Project Structure

```
├── src/
│   ├── components/
│   │   └── EventCard.astro    # Reusable event/talk card
│   ├── content/
│   │   ├── site.json          # Site configuration
│   │   └── events/            # One directory per event
│   │       ├── _template/
│   │       │   └── index.md   # Template (draft: true, ignored)
│   │       ├── 001/
│   │       │   └── index.md
│   │       └── 002/
│   │           └── index.md
│   └── pages/
│       └── index.astro        # Single-page app
├── public/                    # Static assets
│   └── events/                # Per-event public assets (slides, hero images)
│       └── 003/
│           └── slides.pdf
├── DESIGN.md                  # Design specification
└── astro.config.mjs           # Astro configuration
```

## Adding Content

### Site Configuration

Edit `src/content/site.json`:

```json
{
  "name": "Thessaloníki DevOps Meetup",
  "tagline": "Let's meet and discuss about everything DevOps!",
  "description": "...",
  "email": "",
  "socials": {
    "meetup": "https://www.meetup.com/thessaloniki-devops-meetup/",
    "discord": "",
    "linkedin": "",
    "github": ""
  }
}
```

### Adding Events

Create a new directory under `src/content/events/` with the event
number (zero-padded), e.g. `006/`, and add an `index.md` inside it:

```markdown
---
number: 6
title: "Meetup #006"
date: 2026-07-09
location: "Venue Name"
locationUrl: ""
meetupUrl: ""
description: ""
image: ""                # Optional: e.g. /events/006/hero.jpg
draft: false
talks:
  - title: "Talk Title"
    speakers:
      - name: "Speaker Name"
        url: ""
    description: ""
    slidesUrl: ""        # Optional shorthand — renders as a "◆ slides" pill
    videoUrl: ""         # Optional shorthand — renders as a "▶ video" pill
    materials:           # Optional, richer list of attachments
      - type: slides
        label: "Slides (PDF)"
        url: "/events/006/talk-1.pdf"
      - type: code
        url: "https://github.com/..."
---

Optional markdown body — event recap, photos, links to attendee notes.
```

Set `draft: true` to hide an event from the site.

### Attaching Presentation Material

Put files that need a public URL (slides, recordings hosted locally,
hero images) under `public/events/NNN/`. Reference them from the event
or talk frontmatter via root-relative paths:

```yaml
image: /events/003/hero.jpg
talks:
  - title: "..."
    slidesUrl: /events/003/observability.pdf
```

For external links (YouTube, Speakerdeck, blog recaps), use the full
URL. The `materials[]` array lets you attach multiple resources per
talk and override the displayed label.

## Deployment

### GitHub Pages (Automatic)

Push to `main` branch. GitHub Actions will build and deploy automatically.

The site is deployed at: https://thessaloniki-devops-meetup.github.io

### Manual / Other Platforms

```bash
npm run build
```

Upload the `./dist/` folder to any static hosting provider.

## License

MIT
