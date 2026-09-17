# Codebase Concerns

**Analysis Date:** 2026-09-17

## Tech Debt

**Contact form submission is simulated only — no backend, no endpoint:**
- Issue: The contact form validates input and then fakes a success message; no data is sent anywhere. There is no `fetch`/`FormData`/XHR call, no endpoint, no mailto, no third-party form service.
- Files: `index.js:162-171` (submit handler), `index.html:469` (form, `novalidate`), `index.html:495` (`#form-status` container)
- Why: Static site with no server; the form was wired to look functional.
- Impact: Visitors who submit the form genuinely believe their message was delivered ("Thank you! Your message has been sent successfully..."). Every inquiry is silently lost — the site's only conversion mechanism does nothing.
- Fix approach: Post to a real backend (e.g., Formspree/Getform/Netlify Forms endpoint, or a serverless function) with the form's `name` attributes; on failure show an error state rather than unconditional success. At minimum, fail loudly so the simulation is not mistaken for functionality.

**No tests, no CI, no linting:**
- Issue: `package.json` defines only a `dev` script (`npx -y http-server -p 3000`) and a single devDependency (`http-server`). No test runner, no linter, no formatter, no `.github/workflows/`, no pre-commit hooks.
- Files: `package.json`, repo root (`git ls-files` returns only `.gitignore`, `README.md`, `images/*`, `index.css`, `index.html`, `index.js`, `package.json`)
- Why: The project is a hand-built static page with no toolchain.
- Impact: The scrollspy, theme persistence, filter logic, and form behavior can be broken by a one-line edit with zero automated detection. Regression risk on any future change is high.
- Fix approach: Add a minimal toolchain — e.g., ESLint + Prettier (or Biome) with `check`/`lint` scripts, a Vitest setup for `index.js` logic (extract pure functions), and a GitHub Actions workflow running lint + tests on push/PR.

**Unpinned, render-blocking CDN scripts with no SRI:**
- Issue: Two runtime CDN dependencies are fetched with no version pinning, no `integrity` (SRI) hash, and no `defer`/`async`:
  - `index.html:14` — `<script src="https://unpkg.com/lucide@latest"></script>` (`@latest` tag, blocking script in `<head>`)
  - `index.css:1` — `@import url('https://fonts.googleapis.com/css2?...')` (CSS `@import` is render-blocking)
- Why: Quick way to get icons/fonts without bundling.
- Impact: Any lucide release can break the site with zero code changes; a CDN outage or network block leaves the page without icons (every `data-lucide` element renders empty) and delays first paint. No integrity check means the CDN could serve tampered code with no detection.
- Fix approach: Pin `lucide@<exact-version>` with `integrity` + `crossorigin="anonymous"`, move it to `defer` in `<body>` or preload, and self-host or `preconnect` Google Fonts. Alternatively bundle lucide icons as inline SVG (the social icons in `index.html:454-462` already do this).

**1.3 MB `profile.jpg` and 346 KB `LOGO3.png` committed unoptimized:**
- Issue: Large binary assets are committed as-is: `images/profile.jpg` = 1,304,485 bytes (~1.3 MB), `images/LOGO3.png` = 346,264 bytes. Git object store is 1.84 MiB total — overwhelmingly these images.
- Files: `images/profile.jpg` (loaded twice: `index.html:74` hero, `index.html:428` contact), `images/LOGO3.png` (tracked in git, see `git ls-files`)
- Why: Template repo assets dropped in without optimization.
- Impact: ~1.3 MB of image data on every page load (duplicated request for the same file in hero + contact), slow first load on mobile networks, bloated git history, wasted GitHub bandwidth.
- Fix approach: Re-encode `profile.jpg` to a compressed WebP/AVIF at 400-800 px (the CSS renders it at a fraction of 1.3 MB), resize/compress `LOGO3.png`, add `loading="lazy"` to the non-LCP contact image (`index.html:428`), and regenerate the git history or use Git LFS if assets must stay.

**Personal resume PDF committed to the repo:**
- Issue: `images/Resume Abdil Haiyan 06092024.pdf` (237,318 bytes) is tracked in git (`git ls-files`) and linked directly at `index.html:66-68` ("Download Resume").
- Why: Static hosting of the resume.
- Impact: The resume contains personal details (contact info, employment history) permanently in version control history — it can never be removed from history without a rewrite, and anyone with repo access can download it even after it is deleted from the working tree. The dated filename (`06092024`) also means every future resume update requires a filename change or overwrite.
- Fix approach: Store the resume outside the repo (or in a branch/directory clearly meant for static hosting, ideally git-ignored), link it as a versioned asset URL, and purge the file from history with `git filter-repo` if privacy matters.

**Empty README:**
- Issue: `README.md` contains only `# portfolio2` (one line). No setup instructions, no tech summary, no deployment notes.
- Files: `README.md`
- Impact: A new contributor (or agent) gets no context on how to run, build, or deploy the site. The only run command is discoverable only by reading `package.json`.
- Fix approach: Document the `npm install` / `npm run dev` flow, file layout (`index.html`, `index.js`, `index.css`, `images/`), and deployment target.

## Known Bugs

**Expired LinkedIn fallback image URL in `onerror` handlers:**
- Symptoms: Both profile images fall back to a LinkedIn CDN URL via inline `onerror`; if `profile.jpg` fails locally, the fallback also fails → broken image.
- Files: `index.html:74` and `index.html:428` — `this.src='https://media.licdn.com/dms/image/v2/...&e=1731542400&v=beta&t=hSs3...'`
- Trigger: `images/profile.jpg` missing/unreachable (e.g., someone follows `images/README.txt`'s instruction to omit it).
- Root cause: The LinkedIn URL's `e=1731542400` query token is an expiry timestamp (~November 2024) — already expired as of this analysis (2026-09-17). LinkedIn CDN signatures are time-limited and hotlinking is unreliable.
- Fix: Replace both fallbacks with a local placeholder (e.g., an inline SVG or a small bundled avatar), or drop the `onerror` fallback entirely.

**Theme toggle state not announced to assistive tech:**
- Symptoms: Screen reader users hear "Toggle Dark/Light Mode" but never a pressed/checked state; the button's current mode is only communicated visually via which icon is shown.
- Files: `index.html:36-39` (button has `aria-label` but no `aria-pressed`), `index.js:20-37` (`setTheme` swaps icon display only)
- Trigger: Any use of the toggle with a screen reader.
- Root cause: `aria-pressed` attribute is never set in either `index.html` or `index.js`.
- Fix: Add `aria-pressed="true|false"` on the button in `index.html:36` and update it in `setTheme()` in `index.js:26-37`.

**Mobile menu has no `aria-expanded` and no menu semantics:**
- Symptoms: Toggling the mobile menu changes CSS classes only; the button's expanded state is invisible to screen readers and the nav list has no toggle announcement.
- Files: `index.html:41-45` (`#menu-toggle` has `aria-label` but no `aria-expanded`), `index.js:44-47` (class toggles only)
- Fix: Set `aria-expanded` on `#menu-toggle` and `aria-hidden`/`inert` on `#nav-links` when closed.

**Icon-only link with no accessible name:**
- Symptoms: The external-link anchor in the first timeline item renders an icon with no `aria-label` and no text content — screen readers announce an empty link.
- Files: `index.html:147-149` — `<a href="https://www.wiramas.com.my/" target="_blank" rel="noopener"><i data-lucide="external-link" ...></i></a>`
- Fix: Add `aria-label="Kawal Wiramas Sdn Bhd website"` (and `title`) to the anchor, matching the labeled pattern used for social links at `index.html:454-462`.

## Security Considerations

**PII permanently embedded in git history:**
- Risk: The committed resume PDF (`images/Resume Abdil Haiyan 06092024.pdf`, tracked per `git ls-files`) and the personal profile photo (`images/profile.jpg`) contain personally identifiable information. If the repository is public, anyone can clone history and retrieve both files even if later deleted.
- Current mitigation: None. The only commit (`cd173d7 chore: baseline portfolio site`) includes them from the start.
- Recommendations: Remove both from history (`git filter-repo`), keep assets in a git-ignored or separate hosting location, and verify no other sensitive files are tracked.

**Supply-chain risk from unpinned CDN scripts without SRI:**
- Risk: `index.html:14` loads `https://unpkg.com/lucide@latest` with no version pin and no `integrity` attribute. `@latest` can silently serve new (or compromised) builds; a malicious or broken release executes with full page privileges. No CSP headers are defined at the hosting layer either.
- Current mitigation: None.
- Recommendations: Pin the exact version, add SRI `integrity` + `crossorigin="anonymous"`, and add a `Content-Security-Policy` header (e.g., `script-src 'self' https://unpkg.com`) at deployment.

**Inline `onerror` handlers with a remote URL:**
- Risk: The duplicate inline `onerror` JavaScript in `index.html:74` and `index.html:428` is an inline script — if a CSP is later added without `'unsafe-inline'`, rendering breaks; today it also makes an unauthenticated third-party request per image.
- Current mitigation: None.
- Recommendations: Move fallback handling into `index.js` (or drop it) and use a local placeholder asset.

## Performance Bottlenecks

**Unthrottled scroll listener forcing layout on every scroll event:**
- Problem: The ScrollSpy handler runs `section.offsetTop` and `section.offsetHeight` reads (forced layout) on every scroll event, for all 7 sections, with no `requestAnimationFrame` throttling and no `{ passive: true }`.
- Files: `index.js:99-118` — `window.addEventListener("scroll", () => { ... section.offsetTop; section.offsetHeight; ... })`
- Measurement: 7 layout reads + DOM class writes per scroll event; on low-end/mobile devices this causes visible scroll jank; worst during momentum scrolling.
- Cause: No batching of layout reads with `getBoundingClientRect` caching, no rAF, missing `passive` flag (scroll handler can't be optimized by the browser).
- Improvement path: Cache `offsetTop`/`offsetHeight` once on load (and on resize), use `requestAnimationFrame` to coalesce events, and add `{ passive: true }`. Also replace the magic offset `window.scrollY + 100` at `index.js:101` with a derived value from the actual sticky navbar height (`document.querySelector('.navbar').offsetHeight` or a CSS variable).

**~1.3 MB of images on every load:**
- Problem: `images/profile.jpg` (1.3 MB) is requested twice per page load (hero `index.html:74` and contact `index.html:428`; the browser cache mitigates the second request, but the first is unavoidable).
- Measurement: Image payload ≈ 1.3 MB vs ~22 KB for `index.css` and ~184 KB for `index.html` — images are ~87% of the page's non-CDN weight.
- Cause: No `srcset`, no WebP/AVIF, no compression, contact copy not lazy-loaded.
- Improvement path: Serve a compressed WebP/AVIF < 100 KB, add `srcset`/`sizes`, and `loading="lazy"` on the contact image (`index.html:428`).

**Render-blocking CDN fetches:**
- Problem: `index.html:14` (synchronous lucide `<script>` in `<head>`) and `index.css:1` (CSS `@import` for Google Fonts) both block first render until the network round-trips complete.
- Measurement: Adds one RTT each on cold loads; worse on slow 3G (hundreds of ms to seconds of blank page).
- Cause: No `defer`, no `preconnect`, CSS `@import` instead of `<link>`.
- Improvement path: Add `defer` to the lucide script, move font loading to `<link rel="preconnect">` + `<link rel="stylesheet">` in `index.html`, or self-host both.

**Animations ignore `prefers-reduced-motion`:**
- Problem: `index.css` defines many transitions and the skill-bar animation (`transition: width 1s ease-out` at `index.css:723`) with no `@media (prefers-reduced-motion: reduce)` override anywhere in the file.
- Files: `index.css` (whole file; no reduced-motion block found via grep)
- Impact: Vestibular discomfort for motion-sensitive visitors; also unrequested animation cost on every load (the `setTimeout`-driven bar animation in `index.js:61-66` and re-trigger at `index.js:86-88`).
- Improvement path: Add a `prefers-reduced-motion: reduce` media query disabling/shortening transitions and skip the JS width tween when it matches.

## Fragile Areas

**Entire `index.js` depends on exact DOM structure with unguarded lookups:**
- Why fragile: Every feature chain (theme `index.js:8-10`, menu `index.js:40-42`, form `index.js:121-122`, `showError` `index.js:175-177`) calls `document.getElementById(...)` and immediately dereferences the result. If any element is renamed/removed (e.g., a section cleanup), a TypeError inside the `DOMContentLoaded` handler aborts every subsequent feature — theme works, menu dies, form dies, etc., with no visible error.
- Common failures: `themeToggleBtn.addEventListener is not a function`, `formStatus.style` throws when `#form-status` doesn't exist; a refactor deleting `#nav-links` kills the scrollspy silently.
- Safe modification: Guard every lookup with null checks (or use a single `querySelector` helper that throws a descriptive error), and split the handler so one feature's failure doesn't cascade.
- Test coverage: None.

**ScrollSpy is coupled to live layout:**
- Why fragile: `index.js:99-118` recomputes section geometry from live `offsetTop`/`offsetHeight` on every scroll; any layout change (new section, changed navbar height, responsive breakpoint) silently changes which link is highlighted, and the hard-coded `100` offset (`index.js:101`) is wrongable whenever CSS changes the navbar height.
- Common failures: "active" nav state lags or skips sections after CSS edits; no highlight on short sections.
- Safe modification: Recompute section offsets on `resize` instead of per-scroll, derive the offset from the navbar's real height, and add an `IntersectionObserver`-based implementation as the replacement.
- Test coverage: None.

**All icons depend on a runtime CDN:**
- Why fragile: Every interactive icon is `<i data-lucide="...">` rendered at runtime by the lucide CDN script (`index.html:14`, `index.js:3-5`). Any CDN failure, network block (common in corporate/offline contexts), or script-blocking extension leaves icon placeholders and empty-looking buttons across the page.
- Common failures: Blank circular icons on the theme toggle, timeline, and social buttons; `window.lucide` undefined path already falls through safely (`index.js:3`), but the UI is degraded silently.
- Safe modification: Self-host the lucide bundle or inline SVGs for the ~20 icons used (already done for social icons at `index.html:454-462`).
- Test coverage: None.

## Scaling Limits

**Contact form throughput:**
- Current capacity: Zero — the form at `index.js:162-171` sends nothing. The site's primary call-to-action has no delivery path.
- Limit: Any real inquiry volume (even 1 message) is lost.
- Symptoms at limit: Users receive a fake success confirmation; no data anywhere.
- Scaling path: Add a form backend (Formspree/Netlify Forms/serverless function + email), then the limit becomes hosting quota.

**Page weight / bandwidth:**
- Current capacity: ~1.6 MB per visitor load (1.3 MB images + ~206 KB code + Google Fonts/lucide CDN transfers).
- Limit: On shared static-hosting tiers with monthly bandwidth caps, ~600-1,000 visitors/month before the 1.3 MB image asset exhausts a typical 1 GB free tier; every visitor pays the cost of an unoptimized photo.
- Symptoms at limit: Bandwidth-exceeded pages, slow loads on 3G.
- Scaling path: Compress/re-encode images (< 100 KB combined), lazy-load below-the-fold media, and purge heavy assets from git history.

## Dependencies at Risk

**lucide (unpinned, `@latest`):**
- Risk: Loaded as `https://unpkg.com/lucide@latest` (`index.html:14`) — floating dependency; any breaking release (icon renames, API changes to `createIcons`) breaks the site without a commit; no SRI so integrity is unverifiable.
- Impact: All `data-lucide` icons vanish or render incorrectly; `index.js:3-5` calls `window.lucide.createIcons()` which fails if the API shape changes (currently guarded, but then no icons render at all).
- Migration plan: Pin `lucide@2.x` exact version with SRI, or vendor the icon SVGs inline (social icons at `index.html:454-462` set the precedent).

**http-server:**
- Risk: Dev-only, minor. `^14.1.1` in `package.json:11` is fine for a static `dev` script, but `npx -y http-server` (`package.json:7`) re-resolves the latest package each run, ignoring the lockfile-less install.
- Impact: None in production (static hosting).
- Migration plan: Replace with `npx serve` or a simple static-hosting workflow; pin if reproducibility matters.

**Google Fonts (unpinned, non-SRI):**
- Risk: `index.css:1` `@import` fetches fonts with no version pinning and blocks rendering.
- Impact: FOUT/blank text on font fetch failure; layout shift risk from late font swap.
- Migration plan: Self-host the two families (`Inter`, `Outfit`) or load via `<link>` with `display=swap` + preconnect.

## Missing Critical Features

**Working contact form delivery:**
- Problem: No way for visitors to actually reach the owner from the site (`index.js:162-171` confirms it's simulated).
- Current workaround: Visitors must notice the `mailto:` link at `index.html:446` and email manually.
- Blocks: Inbound inquiries, job opportunities, and collaborations — the entire purpose of the contact section.
- Implementation complexity: Low (a Formspree/Netlify Forms hookup or a tiny serverless function + `fetch` in the submit handler; ~30 lines).

**Analytics and social/SEO meta:**
- Problem: No `og:`/`twitter:` meta tags, no structured data, no favicon in `index.html<head>` (`index.html:1-15`). Sharing the URL yields a bare link with no preview.
- Blocks: Discoverability, share previews, basic performance monitoring.
- Implementation complexity: Low (add meta tags + favicon).

## Test Coverage Gaps

**Form validation and submission logic:**
- What's not tested: `index.js:124-173` — email regex (`validateEmail` at `index.js:179-182`), per-field error display, and the success state. Since submission is simulated, no test verifies that a real network call happens (there is none — a test would already fail).
- Risk: If a backend is added later, the untested success-path could report success on network failure.
- Priority: High (primary conversion path).
- Difficulty to test: Low — extract validation into a pure function and unit-test; integration-test the submit with a mocked fetch.

**ScrollSpy / theme / filter behavior:**
- What's not tested: `index.js:20-37` (theme persistence + icon swap), `index.js:44-55` (menu), `index.js:71-94` (filter + bar animation), `index.js:99-118` (scrollspy) — all DOM-coupled, none isolated.
- Risk: Any DOM refactor breaks navigation highlighting or theme persistence unnoticed; the hard-coded `100` offset (`index.js:101`) could drift from navbar height without any signal.
- Priority: Medium.
- Difficulty to test: Medium — needs a DOM environment (jsdom/Vitest + happy-dom) and simulated scroll events.

**Accessibility behavior:**
- What's not tested: `aria-pressed` on theme toggle (`index.js:20-37`), mobile menu expanded state (`index.js:44-47`), icon-only link labels — no a11y checks (e.g., axe-core) anywhere.
- Risk: Silent regressions for screen-reader users.
- Priority: Medium.
- Difficulty to test: Low-Medium (axe-core scan in a jsdom/lint pass).

---

*Concerns audit: 2026-09-17*
*Update as issues are fixed or new ones discovered*