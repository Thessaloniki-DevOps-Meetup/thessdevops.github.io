# DevOps Thessaloníki Website

Static website for the DevOps Thessaloníki meetup community.

## Tech Stack

- [Astro](https://astro.build/) - Static site generator
- [TailwindCSS](https://tailwindcss.com/) - Styling
- Markdown/YAML - Content management

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

| Command         | Description                              |
|-----------------|------------------------------------------|
| `npm run dev`   | Start dev server at `localhost:4321`     |
| `npm run build` | Build production site to `./dist/`       |
| `npm run preview` | Preview build locally before deploying |

## Project Structure

```
├── src/
│   ├── content/
│   │   ├── site.yaml          # Site configuration
│   │   └── events/            # Event markdown files
│   ├── layouts/
│   │   └── Layout.astro       # Base layout
│   └── pages/
│       ├── index.astro        # Home page
│       ├── contact.astro      # Contact page
│       └── events/
│           ├── index.astro    # Events listing
│           └── [slug].astro   # Event detail pages
├── public/                    # Static assets
├── DESIGN.md                  # Design specification
└── astro.config.mjs           # Astro configuration
```

## Adding Content

### Site Configuration

Edit `src/content/site.yaml` to update site-wide settings:

```yaml
name: "DevOps Thessaloníki"
tagline: "Your tagline here"
description: "About the meetup..."
email: "hello@example.com"
meetupUrl: "https://meetup.com/..."
socials:
  discord: ""
  linkedin: ""
  github: ""
  twitter: ""
```

### Adding Events

Create a new markdown file in `src/content/events/`:

```markdown
---
number: 1
title: "Meetup #001"
date: 2025-01-15
location: "Venue Name"
locationUrl: ""
meetupUrl: ""
description: ""
image: ""
talks:
  - title: "Talk Title"
    speakers:
      - name: "Speaker Name"
        url: ""
    description: ""
    videoUrl: ""
    slidesUrl: ""
---

Optional body content here.
```

## Deployment

### GitHub Pages (Automatic)

Push to `main` branch. GitHub Actions will build and deploy automatically.

**Setup:**
1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"

### Manual / Other Platforms

```bash
npm run build
```

Upload the `./dist/` folder to any static hosting provider.

## License

MIT
