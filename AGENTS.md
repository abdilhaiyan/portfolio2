<!-- GSD:project-start source:PROJECT.md -->

## Project

**Abdil Haiyan Hilmi — Portfolio**

A personal, single-page portfolio site for Abdil Haiyan Hilmi, a professional Accountant & Financial Manager in Seremban, Malaysia. It presents his experience, skills, education, awards, and community involvement to hiring managers and potential service clients. The site is a static HTML/CSS/JS page (no build step) that is being polished for mobile, given a working contact form, and prepared for deployment on GitHub Pages.

**Core Value:** A recruiter or client on a phone must be able to browse the portfolio without layout breakage and reach Abdil through a contact form that actually delivers the message.

### Constraints

- **Tech stack**: Vanilla HTML/CSS/JS only — no build step, no framework, no bundler (keeps GitHub Pages deployment trivial)
- **Budget**: $0 — Firebase Spark plan + EmailJS free tier only; no billing account
- **Compatibility**: Must work on modern mobile browsers (iOS Safari, Android Chrome) and desktop
- **Security**: Firestore rules must allow public create-only writes to `messages`; no server-side secrets in client code (Firebase web config and EmailJS public key are public by design)
- **Performance**: Reduce total page weight from ~1.9 MB toward <500 KB (images)
- **Content**: Copy stays as-is except approved impact rewrites

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- HTML5 - Single-page markup in `index.html` (524 lines)
- CSS3 - All styling in `index.css` (1225 lines), uses CSS custom properties for a dark/light design system
- JavaScript (ES6+, vanilla) - All interactivity in `index.js` (183 lines); no TypeScript
- Not applicable (no build scripts, no config scripts; only npm script wrappers in `package.json`)

## Runtime

- Browser runtime only (client-side static site; no server-side execution)
- Node.js required only as a dev tool to run the static file server (`http-server`)
- No `.nvmrc` or `engines` field present — any Node.js version supporting `http-server` works
- npm (implied by `package.json` usage)
- Lockfile: **missing** — no `package-lock.json` or `npm-shrinkwrap.json` in the repo. `npm install` will resolve `http-server` fresh each time.

## Frameworks

- None — the site is hand-written HTML/CSS/vanilla JavaScript. No React, Vue, Svelte, or other UI framework.
- None — no test framework, no test files, no coverage tooling.
- `http-server` ^14.1.1 (devDependency) - Zero-config static file server
- Dev command: `npm run dev` → `npx -y http-server -p 3000` (`package.json:7`)
- No bundler, no transpiler, no minifier — files are served as-is

## Key Dependencies

- Lucide icons (`https://unpkg.com/lucide@latest`) - SVG icon library; loaded via `<script>` in `index.html:14`, initialized with `window.lucide.createIcons()` in `index.js:3-5`. Loaded unpinned (`@latest`) — see note below.
- Google Fonts (Inter + Outfit) - Typography; loaded via `@import url('https://fonts.googleapis.com/css2?family=Inter...&family=Outfit...')` at `index.css:1`; referenced through `--font-heading` / `--font-body` custom properties
- `http-server` ^14.1.1 - Sole npm package; local dev serving only (`package.json:11`)

## Configuration

- No environment variables required; no `.env` files present
- No runtime configuration — the only configuration is the hardcoded `data-theme="dark"` default on `<html>` (`index.html:2`) plus the CSS custom-property design tokens in `index.css:4-66`
- None — no build config files exist (no `tsconfig.json`, no `vite.config.*`, no bundler config)
- `package.json` is the only config file in the repo

## Platform Requirements

- Any OS with Node.js + npm
- `npm install` then `npm run dev` (serves on port 3000 via http-server); `npx -y http-server` can also fetch the package on demand
- Any static host (GitHub Pages, Netlify, Vercel static, nginx, etc.) — the site is a plain static directory: `index.html`, `index.css`, `index.js`, `images/`
- No server-side processing, no build step, no backend required
- Note: not currently deployed via any detected CI/CD pipeline; served statically only

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Lowercase, single-word names at project root: `index.html`, `index.css`, `index.js`
- `package.json`, `README.md`, `.gitignore` at root; static assets in `images/` (`profile.jpg`, `LOGO.png`, `LOGO2.png`, `LOGO3.jpg`)
- No test files, no source subdirectories, no TypeScript
- camelCase for all functions: `setTheme`, `showError`, `validateEmail` (`index.js:26`, `index.js:175`, `index.js:179`)
- Functions declared as hoisted function declarations inside the `DOMContentLoaded` callback, not arrow-function consts
- Event handlers use anonymous arrow functions registered via `addEventListener`, not named handlers: `themeToggleBtn.addEventListener("click", () => { ... })` (`index.js:20`)
- No special prefix for async (no async/await used anywhere in `index.js`)
- camelCase for all variables: `savedTheme`, `systemPrefersDark`, `initialTheme`, `currentTheme`, `newTheme`, `menuToggle`, `navLinksList`, `scrollPosition`, `filterValue` (`index.js:14`–`index.js:108`)
- `const` for all bindings except mutable locals: `let isValid` (`index.js:140`) and `let currentSectionId` (`index.js:100`) are the only `let` uses
- DOM references stored in `const` with `Element`/`List`-suffixed names: `themeToggleBtn`, `navLinksList`, `skillCards`, `filterButtons`, `contactForm` (`index.js:8`–`index.js:122`)
- Not applicable — plain JavaScript, no TypeScript, no type annotations, no JSDoc `@param`/`@returns` tags

## Code Style

- No formatter configured (no `.prettierrc`, no `biome.json`, no `eslint.config.*`). Formatting is hand-maintained and consistent
- Double quotes for JS strings: `"DOMContentLoaded"`, `"click"`, `"theme-toggle"` (`index.js:1`–`index.js:14`)
- Semicolons required at end of statements (`index.js:11`, `index.js:16`, `index.js:23`)
- 2-space indentation in JS, CSS, and HTML
- 2-space indentation + one-property-per-line in CSS (`index.css:5`–`index.css:39`)
- Single quotes in CSS content strings: `content: ''` (`index.css:211`, `index.css:596`)
- `innerText` used for text updates, not `textContent` or innerHTML (`index.js:164`)
- No linter configured (no ESLint, no Biome). No `npm run lint` script in `package.json`
- Manual consistency rules that hold today: no `console.*`, no `var`, no global function declarations, no `==` (all comparisons use `===` or `!==`)

## Import Organization

- Not applicable — `index.js` has zero `import`/`require` statements; it is a single self-contained script
- External resources load via `<head>`/`<body>` tags in `index.html`, and load order matters:
- CSS rules grouped by page section, ordered top-to-bottom to match `index.html` DOM order (nav → hero → about → timeline → skills → edu → committee → contact → footer)
- None — no bundler, no module resolution. Script and CSS paths are root-relative (`index.css`, `index.js`); images are `images/...`

## Error Handling

- No error handling constructs exist: no `try/catch`, no `throw`, no `finally` anywhere in `index.js`
- Validation failures are handled with boolean flags and CSS class toggling rather than exceptions: `isValid` gates the success branch (`index.js:140`–`index.js:173`)
- Missing external dependency is guarded with a truthiness check: `if (window.lucide)` (`index.js:3`)
- No custom error types, no error classes
- User-facing validation errors are shown as `.form-error-msg` spans revealed via `.has-error` class on the parent `.form-group` (`index.html:474`, `index.css:1049`–`index.css:1055`, `index.js:175`–`index.js:177`)
- When adding new interaction code, follow the existing pattern: guard optional globals with truthiness checks, gate state mutations on boolean flags, and express failures as CSS state classes — do not introduce unhandled exceptions

## Logging

- None — zero `console.log`/`console.warn`/`console.error` calls in `index.js`
- User feedback is UI-only: the `.form-status-alert.success` element (`index.js:164`, `index.css:1068`–`index.css:1073`)
- Do not add `console.*` calls to match existing style; if diagnostics are needed, prefer transient UI feedback consistent with the form-status pattern

## Comments

- Section banners `// --- Name ---` delimit feature blocks in JS: `// --- Theme Toggle Logic ---` (`index.js:7`), `// --- Mobile Menu Toggle ---` (`index.js:39`), `// --- Skill Bars Animation & Category Filtering ---` (`index.js:57`), `// --- Active Nav Link on Scroll (ScrollSpy) ---` (`index.js:96`), `// --- Contact Form Validation & Submission ---` (`index.js:120`)
- One-line explanatory comments above the code they describe, e.g. `// Retrieve theme preference from local storage, fallback to system preference` (`index.js:13`), `// Offset for sticky navbar` (`index.js:101`)
- Comments explain intent/behavior, and some note CSS-JS coupling: `/* Populated by JS for anims */` (`index.css:722`)
- CSS uses `/* Title Case banner */` comments to label each section: `/* Base Styles */` (`index.css:68`), `/* Navigation bar */` (`index.css:145`), `/* Hero Section */` (`index.css:296`), `/* Responsive Breakpoints */` (`index.css:1104`)
- HTML uses `<!-- Title Case -->` comments for the same purpose: `<!-- Navigation Bar -->` (`index.html:18`), `<!-- Hero Section -->` (`index.html:50`)
- Match the banner style exactly when adding features: JS `// ---`, CSS `/* X */`, HTML `<!-- X -->`
- Not used. Functions like `validateEmail` (`index.js:179`) carry no doc comments
- Do not introduce JSDoc; it would be the only instance in the file
- None present. If marking debt, use `// TODO: description` — no username/issue-link convention exists yet

## Function Design

- Small helpers kept tiny: `showError` is 3 lines (`index.js:175`–`index.js:177`), `validateEmail` is 4 lines (`index.js:179`–`index.js:182`)
- Feature logic lives inline in event callbacks rather than being extracted (e.g., the filter logic at `index.js:71`–`index.js:94`); keep helpers small, but extension into named functions is acceptable when a callback exceeds ~20 lines
- At most 1 parameter, consistently named after the concept: `setTheme(theme)` (`index.js:26`), `showError(groupId)` (`index.js:175`), `validateEmail(email)` (`index.js:179`)
- No options objects, no destructuring
- Helpers return primitives only: `validateEmail` returns a boolean from `re.test(...)` (`index.js:181`); `setTheme` and `showError` return nothing (implicit `undefined`)
- No early-return guard clauses in the boolean-flag style — validation uses a running `isValid` flag instead (`index.js:140`); match this flag pattern for consistency

## Module Design

- No modules, no exports, no imports. All code is one IIFE-style `document.addEventListener("DOMContentLoaded", () => { ... })` closure in `index.js` (opened at `index.js:1`, closed at `index.js:183`)
- Everything inside the closure is private; nothing is attached to `window` except reading `window.lucide` and `window.matchMedia`
- None. If the single-file structure is ever split, keep the `DOMContentLoaded` bootstrap in `index.js` and load additional scripts before it in `index.html`
- CSS already uses a split structure: design tokens in `:root` (`index.css:4`–`index.css:39`) and a light-theme override block `[data-theme="light"]` (`index.css:41`–`index.css:66`), matching the `data-theme` attribute set by `setTheme` (`index.js:27`)

## Cross-Domain Conventions

- IDs via `getElementById` (`index.js:8`–`index.js:10`, `index.js:121`–`index.js:122`); classes via `querySelectorAll` (`index.js:42`, `index.js:58`, `index.js:68`–`index.js:69`); single nested match via `card.querySelector(".skill-level-bar")` (`index.js:84`)
- IDs and CSS class names are kebab-case; `data-*` attribute keys are kebab-case (`data-theme`, `data-level`, `data-filter`, `data-category` in `index.html:36`–`index.html:286`)
- JS never stores state in classes beyond the toggle conventions: `.open` (mobile menu, `index.js:45`–`index.js:53`), `.active` (nav + filter buttons, `index.js:75`, `index.js:113`), `.hidden` (skill card filtering, `index.js:82`, `index.js:90`), `.has-error` (forms, `index.js:132`), `.success` (form status, `index.js:165`)
- kebab-case block-element class names without `__`/`--` delimiters: `.timeline-item-left`, `.timeline-card`, `.timeline-date`, `.skill-header`, `.skill-level-bar`, `.form-group`, `.form-control`, `.form-error-msg`, `.form-status-alert` (`index.css:485`–`index.css:1068`)
- State classes are plain suffixes/pairs (`active`, `hidden`, `open`, `success`) rather than BEM modifiers: `.filter-btn.active` (`index.css:658`), `.skill-card.hidden` (`index.css:679`), `.nav-links.open` (`index.css:1152`), `.form-status-alert.success` (`index.css:1068`)
- When adding UI, follow block-element-with-hyphen naming (`.hero-grid`, `.skill-icon-wrap`) and theme-aware values via custom properties (`var(--accent)`, `rgba(var(--accent-rgb), ...)`), never hardcode colors
- Token names are kebab-case in `:root`, grouped by concern with `/* ... */` sub-comments: `--font-heading`, `--bg-primary`, `--accent`, `--accent-rgb`, `--transition-fast` (`index.css:5`–`index.css:38`)
- Light theme restates tokens under `[data-theme="light"]` (`index.css:41`–`index.css:66`) — any new color must be added to both blocks

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| HTML Markup | Section structure, anchor targets, form fields, DOM id/class contract | `index.html` |
| CSS Design System | Custom properties, dark/light theming via `[data-theme]`, glassmorphism cards, responsive breakpoints | `index.css` |
| JavaScript Behavior | Theme persistence, mobile menu, scrollspy, skill-bar animation/filtering, form validation | `index.js` |
| Static Assets | Profile images, resume PDF, logo variants | `images/` |
| Dev Server | Local HTTP server for development | `package.json` |

## Pattern Overview

- Zero build pipeline — raw HTML/CSS/JS served directly
- CSS Custom Properties drive theming; `[data-theme="light"]` overrides `[data-theme="dark"]` defaults in `:root`
- Glassmorphism card pattern (`.glass-card`) used across all content sections
- All JavaScript lives in a single `DOMContentLoaded` IIFE — no modules, no imports, no bundler
- DOM coupling: JS selects elements exclusively via `id` and class selectors matching the HTML

## Sections & Anchor Contract

| Section Anchor | Nav Label | HTML `id` | Purpose |
|----------------|-----------|-----------|---------|
| `#hero` | Home | `hero` | Hero splash with profile image, headline, CTA buttons |
| `#about` | About | `about` | Professional profile text + 4 feature cards |
| `#work` | Experience | `work` | Timeline of work experience (left/right alternating) |
| `#skills` | Skills | `skills` | Skill cards with filter buttons and animated progress bars |
| `#edu-honors` | Education & Awards | `edu-honors` | Education timeline + awards panel (2-column grid) |
| `#committee` | Community | `committee` | Resident committee roles and community involvement |
| `#contact` | Contact | `contact` | Contact info panel + contact form with validation |

## DOM ID & Class Contract (HTML ↔ JS Interface)

### IDs Consumed by JavaScript

| HTML ID | JS Selector | Used In | Purpose |
|---------|-------------|---------|---------|
| `theme-toggle` | `getElementById("theme-toggle")` | Theme toggle | Button to switch dark/light |
| `sun-icon` | `getElementById("sun-icon")` | Theme toggle | Sun icon, shown in light mode |
| `moon-icon` | `getElementById("moon-icon")` | Theme toggle | Moon icon, shown in dark mode |
| `menu-toggle` | `getElementById("menu-toggle")` | Mobile menu | Hamburger button |
| `nav-links` | `getElementById("nav-links")` | Mobile menu, Scrollspy | `<ul>` containing nav links |
| `contact-form` | `getElementById("contact-form")` | Form validation | The `<form>` element |
| `form-status` | `getElementById("form-status")` | Form validation | Success/error status message div |
| `form-name` | `getElementById("form-name")` | Form validation | Full name input |
| `form-email` | `getElementById("form-email")` | Form validation | Email input |
| `form-subject` | `getElementById("form-subject")` | Form validation | Subject input |
| `form-message` | `getElementById("form-message")` | Form validation | Message textarea |
| `group-name` | `getElementById("group-name")` | Form validation | Form group wrapper — gets `.has-error` |
| `group-email` | `getElementById("group-email")` | Form validation | Form group wrapper — gets `.has-error` |
| `group-subject` | `getElementById("group-subject")` | Form validation | Form group wrapper — gets `.has-error` |
| `group-message` | `getElementById("group-message")` | Form validation | Form group wrapper — gets `.has-error` |

### Classes Consumed by JavaScript

| HTML Class | JS Usage | Purpose |
|------------|----------|---------|
| `nav-links a` | `querySelectorAll(".nav-links a")` — scrollspy adds/removes `.active` | Active nav link highlighting |
| `.skill-level-bar` | `querySelectorAll(".skill-level-bar")` — width set from `data-level` attribute | Animated skill progress bars |
| `.filter-btn` | `querySelectorAll(".filter-btn")` — click handler toggles `.active` | Skill category filter buttons |
| `.skill-card` | `querySelectorAll(".skill-card")` — toggles `.hidden` based on `data-category` | Skill cards shown/hidden by filter |
| `.menu-toggle` | `.classList.toggle("open")` on click | Mobile menu open/close state |
| `.nav-links` | `.classList.toggle("open")` on click | Mobile nav panel visibility |
| `.has-error` | `.classList.add("has-error")` / `.classList.remove("has-error")` | Form validation error state |
| `.form-status-alert.success` | `.classList.add("success")` | Success message display |

### Data Attributes Consumed by JavaScript

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `data-level` | `.skill-level-bar` | Target width percentage (e.g., `"90%"`) — read by JS to animate bar |
| `data-filter` | `.filter-btn` | Category key (e.g., `"finance"`, `"tools"`, `"management"`, `"tech"`, `"all"`) |
| `data-category` | `.skill-card` | Category assignment — matched against `data-filter` on buttons |
| `data-theme` | `<html>` | `"dark"` or `"light"` — set by JS, read by CSS for variable overrides |

### CSS State Classes

| Class | Applied By | Effect |
|-------|------------|--------|
| `.active` | JS (scrollspy) | Highlights current nav link with accent underline |
| `.active` | JS (filter) | Highlights selected filter button with gradient |
| `.open` | JS (mobile menu) | Slides nav panel into view; transforms hamburger to X |
| `.has-error` | JS (form validation) | Shows red border on input + error message text |
| `.hidden` | JS (skill filter) | `display: none` on filtered-out skill cards |
| `.success` | JS (form submission) | Shows green success alert banner |

## Layers

- Purpose: Visual design, layout, theming, responsive behavior
- Location: `index.css`
- Contains: CSS custom properties (design tokens), glassmorphism card system, responsive grid layouts, dark/light theme overrides, form styling, timeline layout
- Depends on: None (pure CSS, no preprocessor)
- Used by: `index.html` (classes and attributes)
- Purpose: User interaction — theme toggle, navigation, skill filtering, form validation
- Location: `index.js`
- Contains: Single IIFE with 5 functional blocks (theme, menu, skills, scrollspy, form)
- Depends on: DOM elements selected by ID/class from `index.html`, `window.lucide` from CDN
- Used by: None (leaf layer)
- Purpose: Semantic structure, section anchors, all visible content, form fields
- Location: `index.html`
- Contains: 7 `<section>` elements with anchor IDs, `<nav>`, `<footer>`, Lucide icon placeholders
- Depends on: External CDN for Lucide icons and Google Fonts
- Used by: `index.css` (classes), `index.js` (IDs and classes)

## Data Flow

### Theme Toggle Flow

### Mobile Menu Flow

### Skill Bar Animation Flow

### Skill Category Filtering Flow

### Scrollspy Flow

### Contact Form Validation Flow

- Theme state: `data-theme` attribute on `<html>` + `localStorage` persistence
- Mobile menu state: `.open` class toggled on `#menu-toggle` and `#nav-links`
- Active nav state: `.active` class on `.nav-links a` — recomputed on every scroll event
- Skill filter state: `.active` on clicked `.filter-btn`; `.hidden` on non-matching `.skill-card`
- Form validation state: `.has-error` on `.form-group` wrappers; `.success` on `#form-status`

## Key Abstractions

- Purpose: Reusable content container with glassmorphism effect (blurred background, subtle border, hover glow)
- Examples: Used in `#about` feature cards, `#work` timeline cards, `#skills` skill cards, `#edu-honors` education cards, `#committee` committee cards, `#contact` panels
- Pattern: Pure CSS class — no JS involved. Applied directly to HTML elements.
- Purpose: Alternating left/right card layout for chronological content
- Examples: `#work` section timeline (`.timeline`, `.timeline-item-left`, `.timeline-item-right`); `#edu-honors` education list (`.edu-timeline`); `#committee` vertical timeline (`.committee-timeline`)
- Pattern: CSS pseudo-elements create center line and dot markers; responsive breakpoint collapses to single column at 768px
- Purpose: Consistent section title + subtitle styling
- Examples: Every `<section>` except `#hero` starts with `.section-header` containing `<h2>` and `<p>`
- Pattern: Centered text with gradient-accent heading

## Entry Points

- Location: `index.html`
- Triggers: Browser navigates to the file (or dev server serves it)
- Responsibilities: Loads CSS, loads Lucide CDN script, renders all sections, then `index.js` executes on `DOMContentLoaded`
- Location: `package.json` → `npm run dev`
- Triggers: `npx -y http-server -p 3000`
- Responsibilities: Serves static files on `localhost:3000`
- Location: `index.html`
- Triggers: Opening `index.html` directly in a browser (no server)
- Responsibilities: Works without server except Lucide icons may fail from CDN CORS and the contact form does not actually submit anywhere

## Architectural Constraints

- **No build step:** All code is author-time — no transpilation, bundling, or minification. Any JS must be vanilla ES5+ compatible.
- **No modules:** `index.js` is a single IIFE with no `import`/`export`. New features go inside or alongside this IIFE.
- **External CDN dependency:** Lucide icons loaded from `unpkg.com/lucide@latest` — no version pinning means behavior could change on CDN update.
- **No form backend:** Contact form validation is client-side only. On valid submission, it displays a success message but does not send data anywhere.
- **Theme initial flash:** HTML defaults to `data-theme="dark"` in the markup. JS may switch to light on load, causing a potential flash if the saved preference is `"light"`.
- **Single CSS file:** All styles (1225 lines) live in one file with no scoping mechanism. Class names must be globally unique.

## Anti-Patterns

### Hardcoded Fallback Image URLs

### Unpinned CDN Version

### Form Submission is a No-Op

## Error Handling

- Profile image fallback: `onerror` switches to remote LinkedIn URL (`index.html:74`)
- Form validation: Checks for empty fields and email regex; shows inline error messages (`index.js:142-160`)
- Lucide icons: Conditional check `if (window.lucide)` before calling `createIcons()` (`index.js:3`)
- No error boundaries, no try/catch, no console logging, no error tracking service

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
