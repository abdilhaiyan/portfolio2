# Technology Stack

**Analysis Date:** 2026-09-17

## Languages

**Primary:**
- HTML5 - Single-page markup in `index.html` (524 lines)
- CSS3 - All styling in `index.css` (1225 lines), uses CSS custom properties for a dark/light design system
- JavaScript (ES6+, vanilla) - All interactivity in `index.js` (183 lines); no TypeScript

**Secondary:**
- Not applicable (no build scripts, no config scripts; only npm script wrappers in `package.json`)

## Runtime

**Environment:**
- Browser runtime only (client-side static site; no server-side execution)
- Node.js required only as a dev tool to run the static file server (`http-server`)
- No `.nvmrc` or `engines` field present — any Node.js version supporting `http-server` works

**Package Manager:**
- npm (implied by `package.json` usage)
- Lockfile: **missing** — no `package-lock.json` or `npm-shrinkwrap.json` in the repo. `npm install` will resolve `http-server` fresh each time.

## Frameworks

**Core:**
- None — the site is hand-written HTML/CSS/vanilla JavaScript. No React, Vue, Svelte, or other UI framework.

**Testing:**
- None — no test framework, no test files, no coverage tooling.

**Build/Dev:**
- `http-server` ^14.1.1 (devDependency) - Zero-config static file server
- Dev command: `npm run dev` → `npx -y http-server -p 3000` (`package.json:7`)
- No bundler, no transpiler, no minifier — files are served as-is

## Key Dependencies

**Critical (runtime, CDN-loaded — not npm):**
- Lucide icons (`https://unpkg.com/lucide@latest`) - SVG icon library; loaded via `<script>` in `index.html:14`, initialized with `window.lucide.createIcons()` in `index.js:3-5`. Loaded unpinned (`@latest`) — see note below.
- Google Fonts (Inter + Outfit) - Typography; loaded via `@import url('https://fonts.googleapis.com/css2?family=Inter...&family=Outfit...')` at `index.css:1`; referenced through `--font-heading` / `--font-body` custom properties

**Infrastructure:**
- `http-server` ^14.1.1 - Sole npm package; local dev serving only (`package.json:11`)

**Note:** Lucide is loaded as `lucide@latest` from unpkg without a pinned version — icon behavior can change silently between deploys. The repo also has no lockfile, so the dev dependency is not pinned transitively.

## Configuration

**Environment:**
- No environment variables required; no `.env` files present
- No runtime configuration — the only configuration is the hardcoded `data-theme="dark"` default on `<html>` (`index.html:2`) plus the CSS custom-property design tokens in `index.css:4-66`

**Build:**
- None — no build config files exist (no `tsconfig.json`, no `vite.config.*`, no bundler config)
- `package.json` is the only config file in the repo

## Platform Requirements

**Development:**
- Any OS with Node.js + npm
- `npm install` then `npm run dev` (serves on port 3000 via http-server); `npx -y http-server` can also fetch the package on demand

**Production:**
- Any static host (GitHub Pages, Netlify, Vercel static, nginx, etc.) — the site is a plain static directory: `index.html`, `index.css`, `index.js`, `images/`
- No server-side processing, no build step, no backend required
- Note: not currently deployed via any detected CI/CD pipeline; served statically only

---

*Stack analysis: 2026-09-17*
*Update after major dependency changes*