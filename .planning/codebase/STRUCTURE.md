# Codebase Structure

**Analysis Date:** 2026-09-17

## Directory Layout

```
portfolio2-main/
├── .git/               # Git repository metadata
├── .planning/          # GSD planning artifacts (codebase maps, plans)
├── images/             # Static image assets and resume PDF
├── index.css           # All styles (1225 lines) — design system + theming
├── index.html          # Single-page portfolio markup (524 lines) — sole entry point
├── index.js            # All behavior (183 lines) — single DOMContentLoaded IIFE
├── package.json        # Project metadata + dev server script
├── .gitignore          # node_modules/, .DS_Store, *.log
└── README.md           # Project readme
```

## Directory Purposes

**`images/`:**
- Purpose: All static binary assets referenced by `index.html`
- Contains: `profile.jpg` (profile photos for hero + contact), `LOGO.jpg`, `LOGO2.png`, `LOGO3.png` (logo variants), `Resume Abdil Haiyan 06092024.pdf` (download link target), `README.txt`
- Key files: `images/profile.jpg` (used at `index.html:74` and `index.html:428`), `images/Resume Abdil Haiyan 06092024.pdf` (linked at `index.html:66`)

**`.planning/`:**
- Purpose: GSD workflow artifacts — codebase maps, plans, phase tracking
- Contains: `codebase/` (this analysis), plus other planning documents
- Generated: Yes
- Committed: Yes

## Key File Locations

**Entry Points:**
- `index.html`: The single entry point of the entire site. All sections, navigation, and form markup live here. Loads `index.css` (line 11), Lucide CDN (line 14), and `index.js` (line 522).

**Configuration:**
- `package.json`: Only configuration file. One script: `"dev": "npx -y http-server -p 3000"`. No build tools, no dependencies beyond `http-server` (dev-only).

**Core Logic:**
- `index.js`: All client-side behavior. Five functional blocks inside one `DOMContentLoaded` listener:
  - Theme toggle + `localStorage` persistence (lines 7-37)
  - Mobile menu toggle (lines 39-55)
  - Skill bar animation + category filtering (lines 57-94)
  - Scrollspy active-nav tracking (lines 96-118)
  - Contact form validation (lines 120-182)

**Design System / Styling:**
- `index.css`: All visual styling. Organized by section:
  - Design tokens + dark theme vars in `:root` (lines 4-39)
  - Light theme overrides in `[data-theme="light"]` (lines 41-66)
  - Base styles (lines 68-127)
  - Navbar + theme/menu toggle buttons (lines 145-267)
  - Per-section styles: hero (296-421), about (423-464), work timeline (466-636), skills filter (638-729), education/honors (731-832), committee (834-897), contact + form (899-1073), footer (1075-1102)
  - Responsive breakpoints: 1024px (lines 1105-1135) and 768px (lines 1137-1225)

**Testing:**
- Not applicable — no test files, no test framework, no test directory

## Naming Conventions

**Files:**
- All source files use lowercase with kebab-case: `index.css`, `index.js`, `index.html` (`index.*` naming reflects the single-page pattern).
- Images use `UPPERCASE.jpg`/`png` for logos (`LOGO.jpg`, `LOGO2.png`) and `lowercase.jpg` for profile/resume (`profile.jpg`). Inconsistent — see CONCERNS if relevant.

**HTML IDs:**
- kebab-case, self-descriptive: `theme-toggle`, `sun-icon`, `moon-icon`, `menu-toggle`, `nav-links`, `contact-form`, `form-status`
- Form fields/group IDs mirror the contract: `form-name`, `group-name`, `form-email`, `group-email`, `form-subject`, `group-subject`, `form-message`, `group-message`

**HTML Classes:**
- kebab-case, component-style: `glass-card`, `section-header`, `nav-links`, `skill-card`, `skill-level-bar`, `filter-btn`, `timeline-item-left`, `contact-form-panel`

**CSS Custom Properties:**
- Prefix `--` with semantic names grouped by purpose:
  - Colors: `--bg-primary`, `--text-primary`, `--accent`, `--error`, `--success`
  - Gradient/accent: `--bg-gradient`, `--accent-gradient`, `--accent-rgb`
  - Surfaces: `--card-bg`, `--card-border`, `--card-shadow`, `--input-bg`, `--nav-bg`
  - Motion: `--transition-fast`, `--transition-normal`, `--transition-slow`
  - Fonts: `--font-heading`, `--font-body`
- RGB variants (`--accent-rgb`) hold numeric RGB triplets (e.g., `16, 185, 129`) for use in `rgba(var(--accent-rgb), 0.3)`

**CSS Selectors:**
- Element-type stripping: no BEM, no namespacing. Bare component classes (`.glass-card`, `.timeline-item`)
- Data-attribute selectors for theming: `[data-theme="light"]`

**JS Functions:**
- camelCase: `setTheme`, `showError`, `validateEmail`
- Const-qualified DOM refs: `const themeToggleBtn`, `const sunIcon`, `const htmlElement`

**JS Variables:**
- camelCase: `savedTheme`, `initialTheme`, `currentSectionId`, `filterValue`
- DOM node refs named `...Input`: `nameInput`, `emailInput`, `subjectInput`, `messageInput`

**Data Attributes:**
- lowercase-kebab verb+noun pairs: `data-theme`, `data-level`, `data-filter`, `data-category`

## Where to Add New Code

**New Site Section:**
1. Add `<section id="section-id">` in `index.html` in the appropriate position (after the section it logically follows, before `<footer>` at line 505 for content sections)
2. Add a matching `href="#section-id"` anchor link to `.nav-links` list (`index.html:25-33`) and `.footer-nav` (`index.html:507-515`)
3. Add scoped CSS classes under the matching comment banner region in `index.css` (e.g., new section styles appended near the end before the responsive breakpoints at line 1104)
4. If the section needs scrollspy highlighting, it must be a `<section>` element — scrollspy iterates `document.querySelectorAll("section")` (`index.js:97`) and reads the `id` attribute

**New Behavior/Feature:**
- Add inside the existing `DOMContentLoaded` IIFE in `index.js` — either as a new block after line 118 or reusing the block pattern (comment banner `// --- Feature Name ---` followed by DOM refs and handlers)
- Wire DOM refs via `getElementById` or `querySelectorAll` matching IDs/classes added in `index.html`
- New state classes must be defined in `index.css` (e.g., `.feature-state` or `[data-theme="x"]` overrides)

**New Interactive Element:**
- HTML: add the element at the relevant location in `index.html` with a unique kebab-case `id`
- CSS: style the element's `.class` in the matching section region of `index.css`
- JS: select + wire handlers in `index.js` IIFE, referencing the same IDs/classes

**New Static Asset:**
- Place file in `images/` and reference from `index.html` (e.g., `<img src="images/name.jpg">` or `<a href="images/name.pdf">`)

**New CSS Theme:**
- Add a new attribute selector block after `[data-theme="light"]` (`index.css:41-66`): `[data-theme="custom"] { ... }` overriding only the variables that differ; the theme must be initialized in `setTheme()` (`index.js:26-37`) and the toggle logic updated (`index.js:21` currently only knows `"dark"` and `"light"`)

## HTML → CSS → JS Element Map

Every functional element and where the contract pieces live:

| Element | HTML | CSS (state) | JS (behavior) |
|---------|------|-------------|---------------|
| Theme toggle button | `index.html:36-39` | `.theme-toggle-btn` | `index.js:8-37` |
| Sun/moon icons | `index.html:37-38` | — (inline `display` toggled) | `index.js:9-10, 30-36` |
| Hamburger menu | `index.html:41-45` | `.menu-toggle`, `.menu-toggle.open span` transforms | `index.js:40-55` |
| Nav links list | `index.html:25-33` | `.nav-links`, `.nav-links.open` slide-in, `a.active` underline | `index.js:42, 50-54, 96-118` |
| Skill cards | `index.html:209-302` | `.skill-card`, `.skill-card.hidden` | `index.js:69-93` |
| Skill progress bars | `index.html:214-216` etc. | `.skill-level-bar`, `width` transition | `index.js:58-66, 84-88` |
| Filter buttons | `index.html:199-205` | `.filter-btn`, `.filter-btn.active` | `index.js:68-94` |
| Contact form fields | `index.html:469-499` | `.form-control`, `.form-group.has-error`, `.form-error-msg` | `index.js:121-182` |
| Form status alert | `index.html:495` | `.form-status-alert`, `.success` | `index.js:122, 128-129, 164-171` |

## Special Directories

**`.git/`:**
- Purpose: Git version control metadata
- Generated: Yes
- Committed: No (git internal)

**`.planning/`:**
- Purpose: GSD workflow artifacts and codebase analysis
- Generated: Yes (by GSD tooling)
- Committed: Yes

**`node_modules/` (absent):**
- Purpose: Would hold dev dependencies if installed
- Generated: Yes (via `npm install`)
- Committed: No (gitignored in `.gitignore:1`)

---

*Structure analysis: 2026-09-17*