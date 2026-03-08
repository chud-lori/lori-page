# Lori's Page 📝

Personal blog by **Lori** — writing about IT topics including data structures, systems programming, observability, and more.

🌐 **Live site**: [lori.my.id](https://lori.my.id/)

Built with [Astro](https://astro.build/) using the [AstroPaper](https://github.com/satnaing/astro-paper) theme.

## 🔥 Features

- Type-safe markdown content
- Super fast performance
- Accessible (keyboard & screen-reader friendly)
- Responsive (mobile → desktop)
- SEO-friendly
- Light & dark mode
- Fuzzy search
- Draft posts & pagination
- Sitemap & RSS feed
- Dynamic OG image generation
- Google Analytics via Partytown

## 💻 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| [Astro](https://astro.build/) | Main framework |
| [TypeScript](https://www.typescriptlang.org/) | Type checking |
| [React](https://reactjs.org/) | Interactive components |
| [TailwindCSS](https://tailwindcss.com/) | Styling |
| [Partytown](https://partytown.builder.io/) | Web worker integration (analytics) |
| [FuseJS](https://fusejs.io/) | Fuzzy search |
| [Satori](https://github.com/vercel/satori) | OG image generation |
| [Prettier](https://prettier.io/) | Code formatting |
| [ESLint](https://eslint.org) | Linting |

## 🚀 Project Structure

```
/
├── public/
│   ├── assets/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   │   ├── blog/        ← Blog posts (markdown)
│   │   └── config.ts    ← Content collection schema
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   ├── config.ts        ← Site configuration
│   └── types.ts
├── astro.config.ts
├── tailwind.config.cjs
└── package.json
```

## 👨🏻‍💻 Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm (comes with Node.js)

### Setup

```bash
# Clone the repository
git clone https://github.com/chud-lori/lori-page.git
cd lori-page

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The site will be available at `http://localhost:4321`.

### Docker

```bash
# Build and run
docker compose up -d

# Or manually
docker build -t lori-page .
docker run -p 4321:80 lori-page
```

## 🧞 Commands

All commands are run from the root of the project:

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run format:check` | Check code format with Prettier |
| `npm run format` | Format code with Prettier |
| `npm run sync` | Generate TypeScript types for Astro modules |
| `npm run lint` | Lint with ESLint |

## ✍️ Adding a New Post

Create a new markdown file in `src/content/blog/` with the required frontmatter:

```markdown
---
title: "Your Post Title"
pubDatetime: 2026-01-01T00:00:00Z
description: "A short description of your post."
tags:
  - example
---

Your content here...
```

## 🔗 Connect

- **GitHub**: [chud-lori](https://github.com/chud-lori)
- **LinkedIn**: [chud-lori](https://www.linkedin.com/in/chud-lori/)
- **Website**: [lori.my.id](https://lori.my.id/)

## 📜 License

Licensed under the MIT License.

---

Theme by [AstroPaper](https://github.com/satnaing/astro-paper) · Made with 🤍 by Lori
