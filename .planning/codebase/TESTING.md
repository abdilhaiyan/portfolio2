# Testing Patterns

**Analysis Date:** 2026-09-17

**IMPORTANT STATE OF THE CODEBASE:** There is **no test framework, no test runner, no test files, no coverage tooling, and no CI** in this repository. `package.json` defines no `test` script and its only devDependency is `http-server` (used by the `dev` script for local serving). The sections below document what exists, what verification happens today (manual), and what would need to be set up. Treat every "Recommended" entry as the starting point for introducing testing, not as an existing pattern.

## Test Framework

**Runner:**
- Not present. No Jest, Vitest, Mocha, Playwright, or Cypress; no `jest.config.*`, `vitest.config.*`, or `playwright.config.*`
- `package.json` scripts: only `"dev": "npx -y http-server -p 3000"` — it serves the static site for manual browser verification
- Recommended (matches the zero-build vanilla setup): **Vitest** in `node` environment with a `test` script, or a zero-dependency assertion harness for the pure functions; **Playwright** if E2E browser flows are desired (it can run against the existing `http-server` dev server on port 3000)

**Assertion Library:**
- Not present. No `expect`/`assert` usage anywhere in the repo
- Recommended: Vitest built-in `expect` (`toBe`, `toBeTruthy`, `toMatch`)

**Run Commands:**
```bash
npm run dev            # only existing command — serves the site at http://localhost:3000
# Recommended once a runner is added:
# npm test             # Run all tests
# npm run test:watch   # Watch mode
```

## Test File Organization

**Location:**
- No test files exist. Glob for `**/*.test.*` and `**/*.spec.*` returns zero matches
- Project layout is flat: `index.html`, `index.css`, `index.js` at root, assets in `images/`. There is no `src/`, `tests/`, or `__tests__/` directory
- Recommended: co-locate `index.test.js` next to `index.js` at the project root, or add a `tests/` directory if the suite grows; keep the flat layout by not introducing multiple source trees

**Naming:**
- No convention exists. Recommended: `*.test.js` for unit tests, matching the vanilla JS (no TypeScript) in the repo

**Structure:**
```
[Current state — all source files at root]
portfolio2-main/
├── index.html       # markup under test (E2E/Playwright only)
├── index.css        # styles (not unit-testable, visual verification only)
├── index.js         # all application logic — the only unit-testable surface
├── package.json     # no test script
└── images/
```

## Test Structure

**Suite Organization:**
- Not applicable — no existing tests. The codebase's only testable units are inside the `DOMContentLoaded` callback in `index.js:1`–`index.js:183`
- Recommended structure once a runner is added (the pure functions are the primary targets):

```javascript
// Future pattern, matching the current helper shapes in index.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('validateEmail', () => {
  it('accepts a valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('rejects a missing TLD', () => {
    expect(validateEmail('user@example')).toBe(false);
  });
});
```

**Patterns:**
- No setup/teardown exists (there is nothing to set up). Recommended: `beforeEach` to reset a fresh DOM/`localStorage` when testing the theme and form logic; `afterEach` to `vi.restoreAllMocks()` if mocking is introduced
- Manual verification is the current "test": open `http://localhost:3000` (`npm run dev`), then exercise theme toggle, mobile menu, skill filters, scrollspy, and form validation in the browser

## Mocking

**Framework:**
- None used. The code relies on real browser APIs: `localStorage` (`index.js:14`, `index.js:28`), `window.matchMedia` (`index.js:15`), `setTimeout` (`index.js:61`, `index.js:86`, `index.js:169`)
- Recommended: Vitest `vi` with `vi.stubGlobal` / `vi.stubGlobal('matchMedia', ...)` and `vi.useFakeTimers()` for the `setTimeout`-driven skill-bar animation

**Patterns:**
```javascript
// Future pattern for the DOM-heavy closures in index.js
import { vi } from 'vitest';

// Stub matchMedia for the system-preference fallback (index.js:15)
vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
// localStorage is available in jsdom; reset between tests
// Fake timers control the 200ms skill-bar delay (index.js:61) and
// the 5000ms form-status auto-hide (index.js:169)
vi.useFakeTimers();
```

**What to Mock:**
- `window.matchMedia` — the `prefers-color-scheme` fallback in the theme init path (`index.js:15`)
- `localStorage` — theme persistence read/write (`index.js:14`, `index.js:28`), including the "no saved theme" fallback path
- `setTimeout` — animation delays (`index.js:61`, `index.js:86`) and the form-status auto-hide (`index.js:169`)
- `window.lucide` — guard branch at `index.js:3`–`index.js:5` (test both present and absent)

**What NOT to Mock:**
- `validateEmail` (`index.js:179`–`index.js:182`) — pure function, assert real behavior against `test@example.com`, `user@example`, `bad@@domain.com`, empty string
- Validation flag logic (`index.js:140`–`index.js:160`) — assert the `.has-error` class toggling with a real DOM

## Fixtures and Factories

**Test Data:**
- None exist. The only data-like content is in `index.html` (skill cards with `data-level`/`data-category` attributes, `index.html:209`–`index.html:302`) and the regex in `validateEmail` (`index.js:180`)
- Recommended: a small array of representative emails for `validateEmail`, and — if DOM testing — a minimal HTML fixture reproducing the form markup (`index.html:469`–`index.html:500`) needed by the submit handler (`index.js:124`–`index.js:173`)

**Location:**
- Recommended: fixture strings inline in `index.test.js` first; promote to `tests/fixtures/` only if shared by multiple test files

## Coverage

**Requirements:**
- None enforced — no coverage tooling configured, no CI gate
- Recommended starting target: 100% on `validateEmail` and the theme `setTheme` paths; coverage of event callbacks comes only with jsdom-based DOM tests

**Configuration:**
- Recommended: Vitest `--coverage` (v8 provider) once a runner exists; no exclusions needed at this file count

**View Coverage:**
```bash
# Recommended:
# npm run test:coverage
```

## Test Types

**Unit Tests:**
- Not present. The only candidates today:
  - `validateEmail(email)` — `index.js:179`–`index.js:182` (pure, takes a string, returns a boolean; regex at `index.js:180`)
  - Theme resolution expression `savedTheme || (systemPrefersDark ? "dark" : "light")` — `index.js:16` (reads `localStorage` + `matchMedia`)
  - `setTheme(theme)` — `index.js:26`–`index.js:37` (writes `data-theme` + `localStorage`, toggles icon `display` styles)
- Recommended: extract the pure pieces (`validateEmail`) for direct unit tests; test `setTheme` via jsdom DOM assertions

**Integration Tests:**
- Not present. Candidates if a DOM environment is added:
  - Form submit flow (`index.js:124`–`index.js:173`): enter valid/invalid inputs, assert `.has-error` classes and the success message text at `index.js:164`
  - Skill category filter (`index.js:71`–`index.js:94`): click a `.filter-btn`, assert `.hidden` toggling on `.skill-card` elements and the bar-width re-trigger at `index.js:84`–`index.js:88`
  - ScrollSpy (`index.js:99`–`index.js:118`): fire scroll at synthetic offsets, assert `active` class on `.nav-links a`

**E2E Tests:**
- Not used. No Playwright/Cypress config, no browser automation anywhere
- Recommended (highest-value low-effort): Playwright against `npm run dev` (http-server on port 3000) covering theme persistence across reloads, mobile menu open/close, and the contact form success path — these are the flows a visitor actually touches

## Common Patterns

**Async Testing:**
- Not present — the only asynchronous-ish behavior is `setTimeout` scheduling, not promises: skill-bar width animation (`index.js:61`–`index.js:66`), filter re-animation (`index.js:86`–`index.js:88`), form-status auto-hide (`index.js:169`–`index.js:171`)
- Recommended: control these with fake timers (`vi.useFakeTimers()` + `vi.advanceTimersByTime(200)`) rather than real waits

**Error Testing:**
- Not present — the code has no `throw` statements to test. The "error" surface is validation state:
  - Empty name → `.group-name` gets `.has-error` (`index.js:142`–`index.js:145`, `index.js:175`–`index.js:177`)
  - Invalid email (regex miss) → `.group-email` gets `.has-error` (`index.js:147`–`index.js:150`)
  - Recommended: assert class presence/absence on the four `#group-*` containers and that the success branch (`index.js:162`–`index.js:172`) only runs when all four pass

**Snapshot Testing:**
- Not used, and not recommended — no rendering pipeline, no components, purely static HTML

## Test Coverage Gaps (current verification debt)

- **Zero automated coverage of any behavior in `index.js`** — every interaction (theme, menu, filters, scrollspy, form) is verified by hand browsing only
- **No regression protection** — the regex in `validateEmail` (`index.js:180`) and the theme fallback chain (`index.js:16`) can silently regress with no signal
- **No CI** — nothing runs `check`, `lint`, or `test` on `git push`; verify in `.github/`, `.gitlab-ci.yml`, `.travis.yml` — none exist
- **Priority order for adding tests:** (1) `validateEmail` unit tests (pure, ~10 min), (2) jsdom tests for theme init + `setTheme`, (3) form validation flow, (4) Playwright smoke for theme persistence + form success — each step is independent and does not require restructuring `index.js`, though extracting helpers from the `DOMContentLoaded` closure (`index.js:1`) would make the DOM-heavy items substantially easier

---

*Testing analysis: 2026-09-17*
*Update when test patterns change*