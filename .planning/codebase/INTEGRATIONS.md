# External Integrations

**Analysis Date:** 2026-09-17

## APIs & External Services

This is a static single-page site with **no backend and no API calls** (`fetch`/`XMLHttpRequest` are never used). The integrations below fall into two categories: **CDN resources actually loaded at runtime** and **static hyperlinks with no runtime dependency**.

### CDN / Runtime-Loaded Resources

**CDN (client-side script):**
- Lucide icons - SVG icon injection
  - Source: `https://unpkg.com/lucide@latest` via `<script>` tag in `index.html:14`
  - SDK/Client: global `window.lucide` (UMD build), initialized with `lucide.createIcons()` in `index.js:3-5`
  - Auth: none (public CDN)
  - Usage: `data-lucide` attributes on `<i>` elements throughout `index.html`; inline icon SVGs for social links at `index.html:455-461`
  - **Risk:** unpinned `@latest` version and third-party CDN dependency

**CDN (CSS):**
- Google Fonts - Inter + Outfit web fonts
  - Source: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap` via `@import` at `index.css:1`
  - Auth: none (public API)
  - Usage: `--font-heading: 'Outfit', ...` and `--font-body: 'Inter', ...` custom properties at `index.css:6-7`

**LinkedIn Media CDN (fallback only):**
- `https://media.licdn.com/dms/image/v2/...` - Profile photo fallback
  - Integration method: `onerror` fallback attribute on both `<img>` tags; only fetched if local `images/profile.jpg` fails to load (`index.html:74` and `index.html:428`)
  - Auth: none (public CDN URL)
  - Note: the embedded URL contains an `e=1731542400` expiry parameter (Oct 2024) — the fallback image may already be expired. Not a primary integration.

### Hyperlinks Only (no runtime integration)

These are static `href` targets — the site never talks to their APIs:

- LinkedIn profile - `https://www.linkedin.com/in/abdil-haiyan-45385413a` (`index.html:454`)
- WhatsApp - `https://wa.link/kx5upx` (wa.link shortlink, opens chat) (`index.html:457`)
- GitHub profile - `https://github.com/abdilhaiyan` (`index.html:460`)
- Wiramas company site - `https://www.wiramas.com.my/` (`index.html:147`)
- Email - `mailto:abdilhaiyanhilmi@gmail.com` (`index.html:446`)
- Resume PDF - local file `images/Resume Abdil Haiyan 06092024.pdf`, opened via `target="_blank"` (`index.html:66`)

## Data Storage

**Databases:**
- None

**File Storage:**
- Local filesystem only — repository `images/` directory serves static assets:
  - `images/profile.jpg` (profile photo with LinkedIn CDN fallback)
  - `images/Resume Abdil Haiyan 06092024.pdf` (resume download)
  - `images/LOGO.jpg`, `images/LOGO2.png`, `images/LOGO3.png` (employer/school logos — referenced by `images/README.txt` expectations, though not used in current `index.html` markup)

**Caching:**
- None (no Redis, no CDN cache configuration)

**Client-side persistence:**
- `localStorage` only — theme preference key `"theme"` (`index.js:14,28`)

## Authentication & Identity

**Auth Provider:**
- None — the site has no authenticated surfaces, no login, no user accounts

**OAuth Integrations:**
- None

## Monitoring & Observability

**Error Tracking:**
- None

**Analytics:**
- None (no GA, no Plausible, no tracking scripts)

**Logs:**
- None (no logging; the only "console" usage is absent from the code)

## CI/CD & Deployment

**Hosting:**
- Not detected — no deployment configuration in the repo (no `netlify.toml`, `vercel.json`, `.github/workflows`, or similar)

**CI Pipeline:**
- None — no `.github/workflows/` or other pipeline config present

## Environment Configuration

**Development:**
- Required env vars: none
- Secrets location: none — no `.env` files, no API keys, no credentials anywhere in the codebase
- Mock/stub services: none needed (contact form is simulated client-side)

**Production:**
- No environment-specific configuration exists; prod is identical to the checked-in static files

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Contact Form (client-side simulation — not a real integration)

- The form at `index.html:469-500` validates input and then **simulates success** — it does not send anything anywhere
- `index.js:162-172`: on valid submit, shows "Thank you! Your message has been sent successfully..." and resets the form
- No form backend (no Formspree/EmailJS/Netlify Forms), no email API, no endpoint
- **Implication:** "Send Message" produces no actual message delivery; wiring a backend (e.g., Netlify Forms, Formspree, EmailJS) would be required for real submissions

---

*Integration audit: 2026-09-17*
*Update when adding/removing external services*