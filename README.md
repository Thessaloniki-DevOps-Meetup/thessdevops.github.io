# Thessaloníki DevOps Meetup Website

Static website for the Thessaloníki DevOps Meetup community.

**Live site:** https://www.thessdevops.org

---

## Spoke at a meetup? Add your slides & links

You only need to edit **one folder**. Three steps:

1. Find your event under `src/content/events/<NNN>/` (e.g. `003/`).
2. Drop your file(s) — PDF, image, ZIP, whatever — directly into that
   folder. The build copies them into `public/events/<NNN>/` for you.
3. Open `index.md` in the same folder, find your talk in the `talks:`
   list, and add a `materials:` block under it:

```yaml
talks:
  - title: "Your Talk Title"
    speakers:
      - name: "Your Name"
    materials:
      - type: slides
        label: "Slides (PDF)"
        url: /events/003/your-slides.pdf
      - type: video
        url: https://youtu.be/your-video-id
      - type: code
        url: https://github.com/your-repo
```

4. Open a PR. The PR form pre-loads a short checklist — fill in the
   event number, talk title, what you're adding, and paste the
   `materials:` snippet. Done.

### Notes for speakers

- The URL for an uploaded file is **`/events/<NNN>/<filename>`**,
  matching the event folder name. You don't need to put anything
  under `public/` yourself — the build does it.
- External links (YouTube, Speakerdeck, blog posts, GitHub) just use
  the full URL — no upload needed.
- `type` controls the icon next to the pill. Known: `slides`,
  `video` / `recording`, `code` / `repo` / `github`, `demo`, `notes`.
  Anything else falls back to a generic arrow.
- `label` is optional — defaults to the type name.
- `slidesUrl` / `videoUrl` still work as one-line shorthand if you
  only have one slide deck or one recording.

## Adding photos to an event

Drop the photos into a `photos/` folder inside the event's folder:

```
src/content/events/003/
├── index.md
└── photos/
    ├── 01.jpg
    ├── 02.jpg
    └── 03.jpg
```

That's it: the event's page (`/events/003/`) shows them as a gallery,
in filename order, with a click-to-enlarge lightbox. The build resizes
them to WebP, so straight-from-the-camera JPGs are fine (keep it to a
handful per event). Supported: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`.

Only publish photos where people are fine with being shown.

---

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
| `npm run check`   | Build + verify all `/events/…` links     |
| `npm run sync:meetup` | Refresh upcoming events from Meetup  |
| `SHOW_DRAFTS=1 npm run build` | Build including draft pages (and `robots.txt: Disallow`) |

Both `dev` and `build` first run:

- `scripts/copy-event-assets.mjs`: copies per-event files from
  `src/content/events/<NNN>/` into `public/events/<NNN>/`.
- `scripts/sync-meetup.mjs`: fetches the Meetup iCal feed into
  `src/data/meetup.json` (see below). Offline? `MEETUP_SYNC=0 npm run dev`.

## How the site stays up to date

- **Next meetup from Meetup.** The sync script reads the group's public
  iCal feed. Upcoming events show on the home page even before anyone
  adds an event folder; they link to Meetup. Once you add
  `src/content/events/<NNN>/index.md` with the same `meetupUrl`, your
  file wins (title, description, venue, talks) and the event gets its own
  page. If the feed can't be fetched, the last good copy is kept; past
  events drop off automatically.
- **Daily rebuild.** The deploy workflow also runs every day at 03:15 UTC,
  so "next up" moves on after each meetup without anyone pushing.
- **Content validation.** Every build checks event frontmatter (dates,
  URLs, required fields, misspelt keys, duplicate numbers) and fails with
  a readable list of problems. The template in
  `src/content/events/_template/index.md` shows every allowed field.
- **Link previews.** Each event page gets its own preview image
  (`/events/<NNN>/og.png`), generated at build time from the event's
  title, description, date and venue. Extra pages get `/og/<page>.png`.

## Draft pages

`/about`, `/media` and `/sponsors` live in `src/site-pages/` and are
listed in `src/content/pages.json`. Pages with `"draft": true` are only
visible in `npm run dev` (marked `# draft` in the nav, with a banner) or
in builds with `SHOW_DRAFTS=1`. Production builds skip them entirely:
no HTML, no nav link, no sitemap entry. To publish one, set
`"draft": false` in `pages.json`.

Hosts and sponsors on `/sponsors` come from `src/content/sponsors.json`
(`kind: "host"` or `"sponsor"`), with logos in `src/assets/sponsors/`.
Host meetup counts are computed from events whose `location` matches
the host's `venue`.

To add a page: create `src/site-pages/<slug>.astro` (copy an existing
one) and add `<slug>` to `pages.json`. Restart `npm run dev` after
editing `pages.json`.

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── EventCard.astro    # Full event (on the event's page)
│   │   ├── EventSummary.astro # Compact clickable card (home page)
│   │   ├── UpcomingBlock.astro# "Next meetup" block (top of home page)
│   │   ├── PhotoGallery.astro # Photo grid + lightbox (event page)
│   │   ├── Hero.astro         # About hero (left panel)
│   │   └── NavYaml.astro      # YAML nav block
│   ├── layouts/
│   │   └── BaseLayout.astro   # <head> + left panel shell, shared by pages
│   ├── lib/
│   │   └── events.ts          # Loads events/photos, date helpers, nav
│   ├── content/
│   │   ├── site.json          # Site configuration
│   │   └── events/            # One directory per event
│   │       ├── _template/
│   │       │   └── index.md   # Annotated template (draft: true, ignored)
│   │       ├── 001/
│   │       │   ├── index.md
│   │       │   ├── slides.pdf   # (example) sibling assets → /events/001/slides.pdf
│   │       │   └── photos/      # (optional) gallery photos
│   │       └── 002/
│   │           └── index.md
│   └── pages/
│       ├── index.astro        # Home: next meetup, latest, archive
│       ├── events/[slug].astro# One page per event: /events/<NNN>/
│       └── submit-talk.astro  # Talk submission form
├── public/
│   └── events/                # Generated by scripts/copy-event-assets.mjs (gitignored)
├── scripts/
│   └── copy-event-assets.mjs  # Mirrors event blobs to public/ at pre{dev,build}
├── DESIGN.md                  # Design specification
└── astro.config.mjs           # Astro configuration
```

## Adding a new event

Create a new directory under `src/content/events/` with the event
number (zero-padded), e.g. `006/`, and add an `index.md` inside it:

```markdown
---
number: 6
title: "Meetup #006"
date: 2026-07-09
time: "19:00–22:00"     # Optional, Athens time
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
    materials: []        # Optional, see speaker section above for examples
---

Optional markdown body — recap, photos, attendee notes.
```

Set `draft: true` to hide an event from the site.

The event gets its own page at `/events/<folder>/` (e.g. `/events/006/`).
The home page shows the next upcoming event at the top, then the latest
past meetups, then an archive; upcoming vs past is decided by `date` at
build time.

## Editing the site config

Edit `src/content/site.json`:

```json
{
  "name": "Thessaloníki DevOps Meetup",
  "tagline": "Let's meet and discuss about everything DevOps!",
  "description": "...",
  "email": "",          // contact address linked in the hero
  "emailCc": [],        // other organizers, cc'd on that link
  "socials": {
    "meetup": "https://www.meetup.com/thessaloniki-devops-meetup/",
    "discord": "",
    "linkedin": "",
    "github": ""
  }
}
```

## Deployment

### GitHub Pages (Automatic)

Merging to `main` builds and deploys automatically (GitHub Actions),
and the site is also rebuilt daily at 03:15 UTC. You can redeploy by hand
from the Actions tab ("Deploy to GitHub Pages" → Run workflow).

The site is deployed at: https://www.thessdevops.org

### Manual / Other Platforms

```bash
npm run build
```

Upload the `./dist/` folder to any static hosting provider.

## License

MIT
