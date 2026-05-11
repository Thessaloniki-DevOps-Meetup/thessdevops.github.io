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

### Attaching Slides, Recordings & Other Materials (for speakers)

Each event has its own folder. To add resources for a talk you gave,
do everything in **one folder** — no need to touch anywhere else.

1. Drop your file(s) directly into the event folder, e.g.
   `src/content/events/003/observability-slides.pdf`. PDFs, images,
   ZIPs — any blob is fine. You can add as many as you want.
2. Open `src/content/events/003/index.md`, find your talk, and add a
   `materials:` block under it pointing to your file(s):

```yaml
talks:
  - title: "From Blindness to Supervision"
    speakers:
      - name: "Pavlos Karakalidis"
    description: "..."
    materials:
      - type: slides
        label: "Slides (PDF)"
        url: /events/003/observability-slides.pdf
      - type: video
        url: https://youtu.be/...
      - type: code
        url: https://github.com/...
```

3. Open a PR. That's it.

#### Notes

- The URL for an uploaded file is always `/events/<NNN>/<filename>`
  (matching the folder name). The build copies your file into
  `public/events/<NNN>/` automatically — you don't have to.
- External links (YouTube, Speakerdeck, blog posts, GitHub) just use
  the full URL — no need to upload anything.
- `type` controls the icon next to the pill. Known types: `slides`,
  `video` / `recording`, `code` / `repo` / `github`, `demo`, `notes`.
  Anything else falls back to a generic arrow.
- `label` is optional — leave it out and the type is used.
- `slidesUrl` / `videoUrl` still work as one-line shorthand if you
  only have one slide deck or one recording.

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
