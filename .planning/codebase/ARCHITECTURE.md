<!-- refreshed: 2026-09-17 -->
# Architecture

**Analysis Date:** 2026-09-17

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                     index.html (524 lines)                   │
│  Single-page static portfolio — all sections in one DOM      │
│  Section anchors: #hero, #about, #work, #skills,            │
│                   #edu-honors, #committee, #contact          │
├──────────────┬──────────────────────────────────────────────┤
│  index.css   │  index.js                                    │
│  (1225 lines)│  (183 lines)                                 │
│  Design      │  Single DOMContentLoaded IIFE                │
│  system,     │  Theme toggle, mobile menu, scrollspy,       │
│  theming,    │  skill-bar animation + filtering,            │
│  layout,     │  contact form validation                     │
│  responsive  │                                              │
└──────────────┴──────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│  External: Lucide Icons CDN (unpkg.com/lucide@latest)       │
│  External: Google Fonts (Inter + Outfit)                     │
│  Static assets: images/ directory                            │
└─────────────────────────────────────────────────────────────┘
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

**Overall:** Static Single-Page Application (SPA) with no build step

**Key Characteristics:**
- Zero build pipeline — raw HTML/CSS/JS served directly
- CSS Custom Properties drive theming; `[data-theme="light"]` overrides `[data-theme="dark"]` defaults in `:root`
- Glassmorphism card pattern (`.glass-card`) used across all content sections
- All JavaScript lives in a single `DOMContentLoaded` IIFE — no modules, no imports, no bundler
- DOM coupling: JS selects elements exclusively via `id` and class selectors matching the HTML

## Sections & Anchor Contract

The page is organized as `<section id="...">` elements. Navigation links and the scrollspy mechanism depend on these exact anchor IDs:

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

This is the critical coupling surface. Every ID and class below is consumed by `index.js` or drives CSS state transitions.

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

**Presentation Layer (CSS):**
- Purpose: Visual design, layout, theming, responsive behavior
- Location: `index.css`
- Contains: CSS custom properties (design tokens), glassmorphism card system, responsive grid layouts, dark/light theme overrides, form styling, timeline layout
- Depends on: None (pure CSS, no preprocessor)
- Used by: `index.html` (classes and attributes)

**Behavior Layer (JS):**
- Purpose: User interaction — theme toggle, navigation, skill filtering, form validation
- Location: `index.js`
- Contains: Single IIFE with 5 functional blocks (theme, menu, skills, scrollspy, form)
- Depends on: DOM elements selected by ID/class from `index.html`, `window.lucide` from CDN
- Used by: None (leaf layer)

**Content Layer (HTML):**
- Purpose: Semantic structure, section anchors, all visible content, form fields
- Location: `index.html`
- Contains: 7 `<section>` elements with anchor IDs, `<nav>`, `<footer>`, Lucide icon placeholders
- Depends on: External CDN for Lucide icons and Google Fonts
- Used by: `index.css` (classes), `index.js` (IDs and classes)

## Data Flow

### Theme Toggle Flow

1. On `DOMContentLoaded` — JS reads `localStorage.getItem("theme")` and `window.matchMedia("(prefers-color-scheme: dark)")` (`index.js:14-16`)
2. JS calls `setTheme(initialTheme)` → sets `data-theme` attribute on `<html>` (`index.js:18`)
3. CSS responds: `:root` defines dark variables (default), `[data-theme="light"]` overrides them (`index.css:4-66`)
4. User clicks `#theme-toggle` → JS toggles `data-theme` between `"dark"` and `"light"` (`index.js:20-24`)
5. JS persists choice to `localStorage` (`index.js:28`)

### Mobile Menu Flow

1. User clicks `#menu-toggle` hamburger button (`index.js:44`)
2. JS toggles `.open` class on both `#menu-toggle` and `#nav-links` (`index.js:45-46`)
3. CSS: `.menu-toggle.open span` transforms hamburger to X; `.nav-links.open` slides panel in from left (`index.css:1152-1170`)
4. Clicking any `.nav-links a` removes `.open` from both elements (`index.js:50-54`)

### Skill Bar Animation Flow

1. On `DOMContentLoaded`, after 200ms delay, JS reads `data-level` from each `.skill-level-bar` and sets `style.width` (`index.js:61-66`)
2. CSS transitions width from `0%` to target over 1s (`index.css:718-724`)
3. When a filter button is clicked, JS resets bar width to `0%`, then after 50ms sets it back to `data-level` value to re-trigger animation (`index.js:85-88`)

### Skill Category Filtering Flow

1. User clicks a `.filter-btn` (`index.js:71`)
2. JS removes `.active` from all filter buttons, adds to clicked one (`index.js:74-75`)
3. JS reads `data-filter` from clicked button (`index.js:77`)
4. For each `.skill-card`, compares `data-category` against filter value (`index.js:80-81`)
5. Match or `"all"` → remove `.hidden`, re-animate bar; no match → add `.hidden` (`index.js:82-92`)
6. CSS: `.skill-card.hidden { display: none; }` (`index.css:679-682`)

### Scrollspy Flow

1. On scroll, JS calculates `scrollPosition = window.scrollY + 100` (`index.js:101`)
2. For each `<section>`, compares `scrollPosition` against `section.offsetTop` and `section.offsetHeight` (`index.js:103-109`)
3. Sets `currentSectionId` to the matching section's `id` attribute (`index.js:108`)
4. For each `.nav-links a`, compares `link.getAttribute("href")` to `#${currentSectionId}` (`index.js:114`)
5. Adds `.active` class to matching link, removes from others (`index.js:112-117`)
6. CSS: `.nav-links a.active` gets accent underline and text color change (`index.css:222-228`)

### Contact Form Validation Flow

1. User submits `#contact-form` → JS calls `e.preventDefault()` (`index.js:124-125`)
2. JS resets all `.form-group` elements by removing `.has-error` (`index.js:131-133`)
3. Validates each field: `form-name`, `form-email`, `form-subject`, `form-message` (`index.js:142-160`)
4. Email validated against regex `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` (`index.js:179-181`)
5. Invalid field → `showError(groupId)` adds `.has-error` to parent `.form-group` (`index.js:143-160, 175-177`)
6. CSS: `.form-group.has-error .form-control` gets red border; `.form-group.has-error .form-error-msg` becomes visible (`index.css:1049-1055`)
7. Valid → shows success message in `#form-status` for 5 seconds, resets form (`index.js:162-172`)

**State Management:**
- Theme state: `data-theme` attribute on `<html>` + `localStorage` persistence
- Mobile menu state: `.open` class toggled on `#menu-toggle` and `#nav-links`
- Active nav state: `.active` class on `.nav-links a` — recomputed on every scroll event
- Skill filter state: `.active` on clicked `.filter-btn`; `.hidden` on non-matching `.skill-card`
- Form validation state: `.has-error` on `.form-group` wrappers; `.success` on `#form-status`

## Key Abstractions

**Glass Card (`.glass-card`):**
- Purpose: Reusable content container with glassmorphism effect (blurred background, subtle border, hover glow)
- Examples: Used in `#about` feature cards, `#work` timeline cards, `#skills` skill cards, `#edu-honors` education cards, `#committee` committee cards, `#contact` panels
- Pattern: Pure CSS class — no JS involved. Applied directly to HTML elements.

**Timeline Pattern:**
- Purpose: Alternating left/right card layout for chronological content
- Examples: `#work` section timeline (`.timeline`, `.timeline-item-left`, `.timeline-item-right`); `#edu-honors` education list (`.edu-timeline`); `#committee` vertical timeline (`.committee-timeline`)
- Pattern: CSS pseudo-elements create center line and dot markers; responsive breakpoint collapses to single column at 768px

**Section Header:**
- Purpose: Consistent section title + subtitle styling
- Examples: Every `<section>` except `#hero` starts with `.section-header` containing `<h2>` and `<p>`
- Pattern: Centered text with gradient-accent heading

## Entry Points

**Browser Load:**
- Location: `index.html`
- Triggers: Browser navigates to the file (or dev server serves it)
- Responsibilities: Loads CSS, loads Lucide CDN script, renders all sections, then `index.js` executes on `DOMContentLoaded`

**Dev Server:**
- Location: `package.json` → `npm run dev`
- Triggers: `npx -y http-server -p 3000`
- Responsibilities: Serves static files on `localhost:3000`

**Direct File Access:**
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

**What happens:** Profile images (`images/profile.jpg`) have inline `onerror` handlers with full LinkedIn CDN URLs as fallbacks (`index.html:74, 428`).
**Why it's wrong:** If the local image is missing, the page silently loads a remote LinkedIn image. This creates a hidden external dependency and breaks if the LinkedIn URL expires or changes.
**Do this instead:** Use a placeholder SVG or a local fallback image in the `images/` directory, and remove the inline `onerror` handler.

### Unpinned CDN Version

**What happens:** Lucide is loaded as `lucide@latest` from unpkg (`index.html:14`).
**Why it's wrong:** A breaking Lucide update could silently break all icons on the page. The site would load with missing/broken icons.
**Do this instead:** Pin to a specific version: `lucide@0.344.0` (or whatever is current and tested).

### Form Submission is a No-Op

**What happens:** `#contact-form` validates inputs and shows a fake success message (`index.js:164`).
**Why it's wrong:** Users see "Your message has been sent successfully" but nothing is actually sent. This is deceptive.
**Do this instead:** Either integrate a form service (Formspree, Netlify Forms) or clearly indicate the form is a demo/placeholder.

## Error Handling

**Strategy:** Minimal — client-side only with no error reporting

**Patterns:**
- Profile image fallback: `onerror` switches to remote LinkedIn URL (`index.html:74`)
- Form validation: Checks for empty fields and email regex; shows inline error messages (`index.js:142-160`)
- Lucide icons: Conditional check `if (window.lucide)` before calling `createIcons()` (`index.js:3`)
- No error boundaries, no try/catch, no console logging, no error tracking service

## Cross-Cutting Concerns

**Logging:** None — no console.log, no analytics, no tracking
**Validation:** Client-side form validation only — regex for email, empty-check for other fields
**Authentication:** None — static public portfolio site
**Accessibility:** Basic `aria-label` on theme toggle and menu toggle buttons; `lang="en"` on `<html>`; `alt` attributes on images
**SEO:** Meta description and keywords in `<head>`; semantic `<section>` elements with IDs; descriptive `<title>`
**Performance:** No lazy loading; all images load eagerly; Lucide icons loaded from CDN (render-blocking script tag)

---

*Architecture analysis: 2026-09-17*
