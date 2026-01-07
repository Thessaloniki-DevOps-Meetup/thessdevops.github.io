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
│   ├── content/
│   │   ├── site.json          # Site configuration
│   │   └── events/            # Event markdown files
│   │       ├── _template.md   # Template (ignored)
│   │       ├── 001.md
│   │       └── 002.md
│   └── pages/
│       └── index.astro        # Single-page app
├── public/                    # Static assets
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

Create a new markdown file in `src/content/events/` (e.g., `003.md`):

```markdown
---
number: 3
title: "Meetup #003"
date: 2025-02-15
location: "Venue Name"
locationUrl: ""
meetupUrl: ""
description: ""
image: ""
draft: false
talks:
  - title: "Talk Title"
    speakers:
      - name: "Speaker Name"
        url: ""
    description: ""
    videoUrl: ""
    slidesUrl: ""
---
```

Set `draft: true` to hide an event from the site.

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
