# Stack Research

**Domain:** Static portfolio polish — mobile CSS (no framework), Firestore + EmailJS contact form, GitHub Pages
**Researched:** 2026-09-18
**Confidence:** HIGH (versions verified against npm registry, live CDN HEAD checks, and official docs on 2026-09-18)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Firebase JS SDK — **modular, Firestore Lite** (ESM via gstatic CDN) | **12.19.0** | Write contact-form messages to Firestore collection `messages` | Current major version (npm `latest` tag, verified 2026-09-18). v12.0.0 breaking changes touched VertexAI/AI APIs only — "Auth and Firestore had no breaking changes" (official CHANGELOG). **Firestore Lite** (`firebase-firestore-lite.js`) fully supports `addDoc`, `serverTimestamp()`, `writeBatch` (verified in `api-review/firestore-lite.api.md`) at a fraction of the full-SDK size — this project needs exactly one `addDoc` and nothing else. Loaded as native ES modules from `https://www.gstatic.com/firebasejs/12.19.0/` — the officially documented no-bundler pattern. |
| EmailJS browser SDK (UMD via jsDelivr) | **4.4.1** | Email alert to Abdil when the form fires | Latest on npm (dist-tag `latest`, verified; official API examples show `lib_version: "4.4.1"`). Official vanilla install is a plain `<script>` tag exposing the global `emailjs` object — no build step. Free tier (200 requests/month) confirmed still current. |
| GitHub Pages — Deploy from a branch | n/a (platform) | Host the static site | GitHub's own docs: "If you do not need any control over the build process for your site, we recommend that you publish your site when changes are pushed to a specific branch." Branch deployment serves the repo root directly; no workflow file, no npm publish step. Free for public repos, HTTPS by default. |
| Vanilla CSS (no new library) | CSS3 | Mobile-responsive layout | The site already has a 1225-line custom-property design system. The 2026 standard toolkit is native: `clamp()` fluid type, `dvh`/`svh` units, container queries (Baseline widely available Aug 2025, ~92.6% support), intrinsic grid with `auto-fit`, `srcset`/`sizes`. Adding a framework (Tailwind, Bootstrap) would fight the existing glassmorphism tokens and add a build step — violates the project constraint. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `firebase-firestore-lite.js` (ESM, gstatic) | 12.19.0 | `getFirestore`, `collection`, `addDoc`, `serverTimestamp` | Always — this is the whole contact-form data plane. Use the **Lite** build; the full `firebase-firestore.js` adds realtime listeners/offline persistence this project never uses (~6–8× larger transfer). |
| `@emailjs/browser` (`dist/email.min.js`, jsDelivr) | 4.4.1 | `emailjs.sendForm(...)` with the existing form element | Always. UMD build verified live (HTTP 200 on `cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js`). Pin the exact version — EmailJS docs show floating `@4`, which can silently change behavior. |
| Google Fonts (Inter + Outfit) | existing | Typography | Keep as-is but add `rel="preconnect"` to `fonts.googleapis.com`/`fonts.gstatic.com` for LCP. |
| Lucide icons (unpkg) | pin to a concrete version (e.g. `0.5xx` latest at apply time) | SVG icons | Crisis only: current load is `lucide@latest` — icon output can change between deploys without a commit. Pin the exact version as part of the performance polish. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `http-server` ^14.1.1 (existing) | Local dev server | Keep. Test the mobile layout with DevTools device emulation + a real phone via `http-server` on LAN. |
| Firebase Console (web UI) | Create project, enable Firestore, **publish security rules**, get web config keys | No CLI needed. Rules are pasted into Console → Firestore → Rules. This is the same spot where Abdil pastes his own config keys, so the setup guide stays console-only. |
| EmailJS Dashboard (web UI) | Create service (Gmail), template, get service/template/public-key IDs | No CLI. |
| (optional) `firebase-tools` npm | `firebase deploy --only firestore:rules` if rules ever need CI | Not required — Console paste is simpler for a one-person project. |
| GitHub web UI | Settings → Pages → Deploy from a branch → `main` / `/(root)` | One-time, 60-second config. No Actions workflow, no YAML. |

## Installation

No npm installs are needed for runtime — both services load via CDN. Pin everything.

```html
<!-- index.html (before closing </body>) -->

<!-- 1. EmailJS — UMD global `emailjs` -->
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js"></script>

<!-- 2. Contact form logic — ES module importing Firebase from gstatic -->
<script type="module" src="contact-form.js"></script>
```

```javascript
// contact-form.js — modular Firebase v12 + EmailJS, no bundler
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js';

// Public-by-design keys (see "What NOT to Use" — do NOT hide these)
const firebaseConfig = { apiKey: '…', projectId: '…', /* … from console */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EMAILJS_PUBLIC_KEY = '…';   // from EmailJS dashboard → Account
const SERVICE_ID = '…';           // e.g. 'service_xxx'
const TEMPLATE_ID = '…';          // e.g. 'template_xxx'

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

async function handleSubmit(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));

  // Firestore write (Lite) — the durable record
  await addDoc(collection(db, 'messages'), {
    ...data,
    createdAt: serverTimestamp(),
  });

  // EmailJS alert to Abdil's inbox (free tier, 200/month)
  await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, e.target);

  // then show success state (existing UI), reset form
}
```

### Firestore security rules — public create-only (paste verbatim in Console)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{message} {
      // Anyone may CREATE a message — the whole point of a public contact form.
      // Validate shape/size so garbage can't bloat db (see PITFALLS: rules ≠ rate limiting).
      allow create: if
        request.resource.data.name is string &&
        request.resource.data.name.size() > 0 &&
        request.resource.data.name.size() <= 120 &&
        request.resource.data.email is string &&
        request.resource.data.email.matches('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$') &&
        request.resource.data.subject is string &&
        request.resource.data.subject.size() > 0 &&
        request.resource.data.subject.size() <= 200 &&
        request.resource.data.message is string &&
        request.resource.data.message.size() > 0 &&
        request.resource.data.message.size() <= 5000 &&
        request.resource.data.createdAt is timestamp;
      // …but NOBODY may read, list, update, or delete them from the client.
      allow read, update, delete: if false;
    }
  }
}
```

Reads are irrelevant here — the `messages` docs are only ever viewed by Abdil in the Firebase Console (project owners bypass rules in the console), or via a future authenticated admin tool. **Publish these rules the moment the collection is created.** Firestore's default is *deny*; a new project's automatic test-mode rules (`allow read, write: if request.time < timestamp.date(...)`) expire after 30 days and the form silently breaks — the setup guide must call this out.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Firestore Lite (client write) | **Firebase Cloud Functions** (server write + send email) | Never for this project — Cloud Functions require a **billing account** (project constraint: $0 budget, "no billing account" in Out of Scope). Also adds cold starts, deploy tooling, and a second failure domain. |
| Firestore + EmailJS (chosen, per Key Decisions) | **Formspree** / **formsubmit.co** (form-forwarding services) | If Abdil ever outgrows EmailJS's 200/month cap without wanting Firestore. Formspree free tier forwards without a DB; losing the durable `messages` record in Firestore. Not chosen because the Firestore+EmailJS architecture was already decided and Firestore gives a permanent audit trail reachable in the console. |
| Firestore (create-only, no auth) | **Firebase Auth + signed writes** | If the form ever needs per-user identity — it doesn't. Auth adds friction for recruiters and an SDK (~70 KB) for zero benefit on a public contact form. |
| Firestore | **Realtime Database** | If realtime presence/listeners were needed — they aren't. Firestore rules are also clearer for a create-only pattern and it was the chosen datastore. |
| Firestore Lite | **Full `firebase-firestore.js`** | If future features need realtime listeners, offline persistence, or bundles. For one `addDoc` per submit, Lite is the right size (roughly an order of magnitude smaller transfer). |
| Direct URL imports (official pattern) | **Import map** (`"firebase/app": "https://www.gstatic.com/..."`) | Import maps let source keep bare specifier style (`import from 'firebase/app'`) — nicer for multi-file modules. Direct URL imports are the officially documented pattern and need one less indirection; either is correct. Use direct URLs for this single-file form module. |
| GitHub Pages branch deploy | **GitHub Actions workflow** (`actions/deploy-pages@v4`) | If a build step ever appears (framework, minifier). Actions also lifts the 10-builds/hour soft limit on branch pushes — irrelevant at this project's commit pace. Keep branch deploy; it is exactly what GitHub docs recommend for no-build sites. |
| GitHub Pages | Netlify / Vercel / Cloudflare Pages | If a custom domain, built-in form handling (Netlify Forms), or preview deploys are wanted later. GitHub Pages is free, already the chosen target, and GitHub Actions underneath it is free for public repos. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `firebase/compat` (v8-style API, `firebase.initializeApp`) | Legacy interface kept for migration only. It is still shipped in v12 (verified: `firebase-compat.js` 200 on gstatic, `./compat/*` exports on npm), but every 2019-era tutorial uses it; adopting it means larger payloads and a future forced migration. | Modular imports shown above. |
| npm + bundler for Firebase/EmailJS | Adding webpack/vite violates the "no build step" constraint for zero benefit — the gstatic + jsDelivr CDN builds are the officially supported browser paths. | CDN `<script type="module">` + `<script>` tag (installation section). |
| `lucide@latest` (unpinned) | Existing stack hazard: silent icon changes between deploys. | Pin a concrete version in the CDN URL (part of performance polish phase). |
| Google Fonts `@import` in CSS | Render-blocking (custom property `@import` at top of `index.css`); hurts LCP on mobile. | `<link>` tags in `<head>` + `rel="preconnect"`; keep the same font families. |
| `height: 100vh` full-screen sections | On mobile the address bar makes `100vh` taller than the visible area — classic overscroll/overflow bug (2026 guidance: use `dvh`, Baseline widely Jun 2025). | `min-height: 100svh` for never-clipped (hero), `100dvh` where mid-scroll reflow is acceptable. |
| Pure-`vw` fluid type (`font-size: clamp(1rem, 4vw, 2rem)`) | Fails WCAG 1.4.4 / W3C F94: viewport units don't respond to browser zoom, so text can't reach 200%. | `clamp(1rem, 0.9rem + 0.4vw, 1.25rem)` — always keep a `rem` component; max ≤ 2.5× min. |
| Hiding Firebase/EmailJS keys server-side "for security" | These are **public-by-design**: Firebase web API key is an identifier (not a secret); EmailJS public key is meant for client use. Trying to proxy them re-introduces a backend (billing). | Keep keys in client code; **restrict the Firebase browser API key** in Google Cloud Console → APIs & Services → API keys → HTTP referrers to `https://abdil-haiyan.github.io/portfolio2-main/*` (+ `localhost` for dev). |
| Jekyll processing on Pages | Branch deploys run Jekyll by default; it can rewrite/exclude files (anything starting with `_` or `.`). | Add an empty `.nojekyll` file at the repo root — official GitHub recommendation to disable it. |
| Multiple Firestore databases | Free-tier quota applies to **one** database per project (verified official quotas page). A second database gets no free tier. | Create exactly one database, choose its region at creation (locked afterwards) — a sensible default for this project: `asia-southeast1`/`asia-southeast2` (near Malaysia), not the US default. |

## Stack Patterns by Variant

**If form traffic exceeds ~200 requests/month (EmailJS free cap):**
- Move email to a paid EmailJS plan ($9/mo Personal = 2,000) or switch the alert path to Formspree free tier.
- Because Firestore already holds the durable record, the email alert is the only thing that changes — the architecture absorbs this without rewiring.

**If Abdil wants to read messages without the Console:**
- The Console already shows all docs (owners bypass rules), so no UI is needed. If ever wanted, a tiny authenticated admin view would need Auth + signed read rules — currently out of scope.

**If spam becomes a real problem:**
- EmailJS ships an optional hCaptcha verification (docs: "Adding CAPTCHA verification"); the Firestore write side has no native rate limiting (rules can't throttle), so accept that create-only is fundamentally spam-open and rely on the email alert's spam filters + optional CAPTCHA. Do not build a custom rate limiter without a backend.

**If the site later gets a custom domain or preview deploys:**
- Switch GitHub Pages source to a GitHub Actions workflow (`actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`) and/or move to Netlify. Nothing about the client-side Firestore/EmailJS integration changes.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `firebase@12.19.0` (ESM gstatic) | Any modern browser (ES modules) | Verified live: `firebase-app.js`, `firebase-firestore-lite.js` all return HTTP 200 on `gstatic.com/firebasejs/12.19.0/`. v11.x files still served too — but v12 is current and Firestore API is unchanged between them. |
| `@emailjs/browser@4.4.1` (UMD) | Any browser (plain script tag) | Verified live: `dist/email.min.js` HTTP 200 on jsDelivr. Official docs float `@4`; pin `4.4.1` exactly in this repo. |
| Firebase + EmailJS together | Independent | No shared dependencies or version coupling — each loads from its own CDN. |
| Firebase rules vs SDK | Rules are server-side; any SDK ≥ v9 speaks the same protocol | The shown `rules_version = '2'` rules work with the v12 web SDK. |
| Mobile CSS features (clamp/dvh/container queries) | Safari 16.4+, Chrome 105+, Firefox 110+ (~96% global) | Container queries Baseline widely available Aug 2025; site targets "modern mobile browsers" per constraints — safe with no polyfills. |

## Sources

- npm registry — `firebase` latest = 12.19.0; `@emailjs/browser` latest = 4.4.1 (retrieved 2026-09-18, HIGH)
- Live CDN HEAD checks — `gstatic.com/firebasejs/12.19.0/{firebase-app,firebase-firestore,firebase-firestore-lite,firebase-compat}.js` and `cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js` all 200 (HIGH)
- Context7 `/firebase/firebase-js-sdk` (official GitHub README + api-review + CHANGELOG mirrors) — modular imports, CDN module pattern, compat status, v12 breaking changes (MEDIUM per seam, official-source backed)
- Context7 `/firebase/firebase-google` and official `firebase.google.com/docs/firestore/...` — rules structure (`get/list/create/update/delete`), insecure-rules examples, free-tier quotas: 1 GiB stored / 50,000 reads / 40,000 writes per day / 10 GiB egress per month, resets midnight Pacific, one DB per project (HIGH, fetched 2026-09-18)
- Context7 `/emailjs-com/emailjs-sdk` — `init`/`send`/`sendForm` signatures + `lib_version 4.4.1` (HIGH)
- EmailJS official docs — installation (browser script), pricing page, free-tier FAQ (200 requests/mo, 2 templates, no ads, no CC) (HIGH)
- GitHub official docs — "Configuring a publishing source for your GitHub Pages site", "Creating a GitHub Pages site" (.nojekyll, branch vs Actions guidance) (HIGH)
- 2026 web articles — BSWEN/dev.to GitHub Pages walkthroughs; Scrimba/TYPENORM/web.dev/clamp guides on 2026 CSS (MEDIUM)
- Firebase official quotas page (firestore/enterprise/quotas) — free-tier table above (HIGH)

---
*Stack research for: portfolio mobile polish + Firestore/EmailJS contact form + GitHub Pages*
*Researched: 2026-09-18*