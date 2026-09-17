# Coding Conventions

**Analysis Date:** 2026-09-17

## Naming Patterns

**Files:**
- Lowercase, single-word names at project root: `index.html`, `index.css`, `index.js`
- `package.json`, `README.md`, `.gitignore` at root; static assets in `images/` (`profile.jpg`, `LOGO.png`, `LOGO2.png`, `LOGO3.jpg`)
- No test files, no source subdirectories, no TypeScript

**Functions:**
- camelCase for all functions: `setTheme`, `showError`, `validateEmail` (`index.js:26`, `index.js:175`, `index.js:179`)
- Functions declared as hoisted function declarations inside the `DOMContentLoaded` callback, not arrow-function consts
- Event handlers use anonymous arrow functions registered via `addEventListener`, not named handlers: `themeToggleBtn.addEventListener("click", () => { ... })` (`index.js:20`)
- No special prefix for async (no async/await used anywhere in `index.js`)

**Variables:**
- camelCase for all variables: `savedTheme`, `systemPrefersDark`, `initialTheme`, `currentTheme`, `newTheme`, `menuToggle`, `navLinksList`, `scrollPosition`, `filterValue` (`index.js:14`–`index.js:108`)
- `const` for all bindings except mutable locals: `let isValid` (`index.js:140`) and `let currentSectionId` (`index.js:100`) are the only `let` uses
- DOM references stored in `const` with `Element`/`List`-suffixed names: `themeToggleBtn`, `navLinksList`, `skillCards`, `filterButtons`, `contactForm` (`index.js:8`–`index.js:122`)

**Types:**
- Not applicable — plain JavaScript, no TypeScript, no type annotations, no JSDoc `@param`/`@returns` tags

## Code Style

**Formatting:**
- No formatter configured (no `.prettierrc`, no `biome.json`, no `eslint.config.*`). Formatting is hand-maintained and consistent
- Double quotes for JS strings: `"DOMContentLoaded"`, `"click"`, `"theme-toggle"` (`index.js:1`–`index.js:14`)
- Semicolons required at end of statements (`index.js:11`, `index.js:16`, `index.js:23`)
- 2-space indentation in JS, CSS, and HTML
- 2-space indentation + one-property-per-line in CSS (`index.css:5`–`index.css:39`)
- Single quotes in CSS content strings: `content: ''` (`index.css:211`, `index.css:596`)
- `innerText` used for text updates, not `textContent` or innerHTML (`index.js:164`)

**Linting:**
- No linter configured (no ESLint, no Biome). No `npm run lint` script in `package.json`
- Manual consistency rules that hold today: no `console.*`, no `var`, no global function declarations, no `==` (all comparisons use `===` or `!==`)

## Import Organization

**Order:**
- Not applicable — `index.js` has zero `import`/`require` statements; it is a single self-contained script
- External resources load via `<head>`/`<body>` tags in `index.html`, and load order matters:
  1. Google Fonts `@import` as the first line of `index.css` (`index.css:1`)
  2. `index.css` linked before any script (`index.html:11`)
  3. Lucide Icons CDN in `<head>` (`index.html:14`, unpinned `https://unpkg.com/lucide@latest`), guarded at runtime by `if (window.lucide)` (`index.js:3`)
  4. `index.js` last, at end of `<body>` (`index.html:522`)

**Grouping:**
- CSS rules grouped by page section, ordered top-to-bottom to match `index.html` DOM order (nav → hero → about → timeline → skills → edu → committee → contact → footer)

**Path Aliases:**
- None — no bundler, no module resolution. Script and CSS paths are root-relative (`index.css`, `index.js`); images are `images/...`

## Error Handling

**Patterns:**
- No error handling constructs exist: no `try/catch`, no `throw`, no `finally` anywhere in `index.js`
- Validation failures are handled with boolean flags and CSS class toggling rather than exceptions: `isValid` gates the success branch (`index.js:140`–`index.js:173`)
- Missing external dependency is guarded with a truthiness check: `if (window.lucide)` (`index.js:3`)

**Error Types:**
- No custom error types, no error classes
- User-facing validation errors are shown as `.form-error-msg` spans revealed via `.has-error` class on the parent `.form-group` (`index.html:474`, `index.css:1049`–`index.css:1055`, `index.js:175`–`index.js:177`)
- When adding new interaction code, follow the existing pattern: guard optional globals with truthiness checks, gate state mutations on boolean flags, and express failures as CSS state classes — do not introduce unhandled exceptions

## Logging

**Framework:**
- None — zero `console.log`/`console.warn`/`console.error` calls in `index.js`
- User feedback is UI-only: the `.form-status-alert.success` element (`index.js:164`, `index.css:1068`–`index.css:1073`)

**Patterns:**
- Do not add `console.*` calls to match existing style; if diagnostics are needed, prefer transient UI feedback consistent with the form-status pattern

## Comments

**When to Comment:**
- Section banners `// --- Name ---` delimit feature blocks in JS: `// --- Theme Toggle Logic ---` (`index.js:7`), `// --- Mobile Menu Toggle ---` (`index.js:39`), `// --- Skill Bars Animation & Category Filtering ---` (`index.js:57`), `// --- Active Nav Link on Scroll (ScrollSpy) ---` (`index.js:96`), `// --- Contact Form Validation & Submission ---` (`index.js:120`)
- One-line explanatory comments above the code they describe, e.g. `// Retrieve theme preference from local storage, fallback to system preference` (`index.js:13`), `// Offset for sticky navbar` (`index.js:101`)
- Comments explain intent/behavior, and some note CSS-JS coupling: `/* Populated by JS for anims */` (`index.css:722`)
- CSS uses `/* Title Case banner */` comments to label each section: `/* Base Styles */` (`index.css:68`), `/* Navigation bar */` (`index.css:145`), `/* Hero Section */` (`index.css:296`), `/* Responsive Breakpoints */` (`index.css:1104`)
- HTML uses `<!-- Title Case -->` comments for the same purpose: `<!-- Navigation Bar -->` (`index.html:18`), `<!-- Hero Section -->` (`index.html:50`)
- Match the banner style exactly when adding features: JS `// ---`, CSS `/* X */`, HTML `<!-- X -->`

**JSDoc/TSDoc:**
- Not used. Functions like `validateEmail` (`index.js:179`) carry no doc comments
- Do not introduce JSDoc; it would be the only instance in the file

**TODO Comments:**
- None present. If marking debt, use `// TODO: description` — no username/issue-link convention exists yet

## Function Design

**Size:**
- Small helpers kept tiny: `showError` is 3 lines (`index.js:175`–`index.js:177`), `validateEmail` is 4 lines (`index.js:179`–`index.js:182`)
- Feature logic lives inline in event callbacks rather than being extracted (e.g., the filter logic at `index.js:71`–`index.js:94`); keep helpers small, but extension into named functions is acceptable when a callback exceeds ~20 lines

**Parameters:**
- At most 1 parameter, consistently named after the concept: `setTheme(theme)` (`index.js:26`), `showError(groupId)` (`index.js:175`), `validateEmail(email)` (`index.js:179`)
- No options objects, no destructuring

**Return Values:**
- Helpers return primitives only: `validateEmail` returns a boolean from `re.test(...)` (`index.js:181`); `setTheme` and `showError` return nothing (implicit `undefined`)
- No early-return guard clauses in the boolean-flag style — validation uses a running `isValid` flag instead (`index.js:140`); match this flag pattern for consistency

## Module Design

**Exports:**
- No modules, no exports, no imports. All code is one IIFE-style `document.addEventListener("DOMContentLoaded", () => { ... })` closure in `index.js` (opened at `index.js:1`, closed at `index.js:183`)
- Everything inside the closure is private; nothing is attached to `window` except reading `window.lucide` and `window.matchMedia`

**Barrel Files:**
- None. If the single-file structure is ever split, keep the `DOMContentLoaded` bootstrap in `index.js` and load additional scripts before it in `index.html`
- CSS already uses a split structure: design tokens in `:root` (`index.css:4`–`index.css:39`) and a light-theme override block `[data-theme="light"]` (`index.css:41`–`index.css:66`), matching the `data-theme` attribute set by `setTheme` (`index.js:27`)

## Cross-Domain Conventions

**DOM selection:**
- IDs via `getElementById` (`index.js:8`–`index.js:10`, `index.js:121`–`index.js:122`); classes via `querySelectorAll` (`index.js:42`, `index.js:58`, `index.js:68`–`index.js:69`); single nested match via `card.querySelector(".skill-level-bar")` (`index.js:84`)
- IDs and CSS class names are kebab-case; `data-*` attribute keys are kebab-case (`data-theme`, `data-level`, `data-filter`, `data-category` in `index.html:36`–`index.html:286`)
- JS never stores state in classes beyond the toggle conventions: `.open` (mobile menu, `index.js:45`–`index.js:53`), `.active` (nav + filter buttons, `index.js:75`, `index.js:113`), `.hidden` (skill card filtering, `index.js:82`, `index.js:90`), `.has-error` (forms, `index.js:132`), `.success` (form status, `index.js:165`)

**CSS naming (BEM-ish, hyphen-concatenated):**
- kebab-case block-element class names without `__`/`--` delimiters: `.timeline-item-left`, `.timeline-card`, `.timeline-date`, `.skill-header`, `.skill-level-bar`, `.form-group`, `.form-control`, `.form-error-msg`, `.form-status-alert` (`index.css:485`–`index.css:1068`)
- State classes are plain suffixes/pairs (`active`, `hidden`, `open`, `success`) rather than BEM modifiers: `.filter-btn.active` (`index.css:658`), `.skill-card.hidden` (`index.css:679`), `.nav-links.open` (`index.css:1152`), `.form-status-alert.success` (`index.css:1068`)
- When adding UI, follow block-element-with-hyphen naming (`.hero-grid`, `.skill-icon-wrap`) and theme-aware values via custom properties (`var(--accent)`, `rgba(var(--accent-rgb), ...)`), never hardcode colors

**CSS Custom Properties:**
- Token names are kebab-case in `:root`, grouped by concern with `/* ... */` sub-comments: `--font-heading`, `--bg-primary`, `--accent`, `--accent-rgb`, `--transition-fast` (`index.css:5`–`index.css:38`)
- Light theme restates tokens under `[data-theme="light"]` (`index.css:41`–`index.css:66`) — any new color must be added to both blocks

---

*Convention analysis: 2026-09-17*
*Update when patterns change*