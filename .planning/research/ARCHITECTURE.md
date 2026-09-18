# Architecture Research

**Domain:** Static vanilla HTML/CSS/JS portfolio (no build step) — Firestore + EmailJS contact form, mobile-responsive CSS, GitHub Pages deploy
**Researched:** 2026-09-18
**Confidence:** MEDIUM-HIGH (patterns derived from official Firebase/EmailJS API docs; the dual-leg success design is a domain-reasoned decision — see PITFALLS.md Pitfall 4)

## Recommended Architecture

**Frontend-only, two service legs, zero backend.** The browser talks directly to two independent cloud services over their SDKs:

- **Firestore (Firestore Lite ← data plane):** the durable, queryable record of every contact form submission. The only read surface is the Firebase Console (project owners bypass rules); no client ever reads `messages`.
- **EmailJS (notification plane):** a fire-and-forget email alert to the site owner when a submission lands. It is a *notification*, never the record of truth.

There is deliberately **no backend, no auth, no build step, no analytics**. The browser is the only client; the two services are the only dependencies; the whole "system" is one new module (`contact-form.js`) plus a CSS media-query pass.

```
┌──────────────────────────── Browser (no build) ────────────────────────────┐
│                                                                           │
│  index.html ──<form id="contact-form">──┐                                 │
│      │                                  │                                 │
│      ▼                                  ▼                                 │
│  contact-form.js (submit orchestrator)  │                                 │
│      │  emailjs.init({publicKey,        │                                 │
│      │    blockHeadless, blockList,     │                                 │
│      │    limitRate})                   │                                 │
│      │                                  │                                 │
│      ├──────── 1. addDoc ───────────────┼────────────► Firestore (Lite)    │
│      │            (messages/…)          │              collection messages │
│      │            + serverTimestamp     │              rules: create-only  │
│      │                                  │                                 │
│      ├──────── 2. sendForm ─────────────┼────────────► EmailJS (UMD)       │
│      │            (service, template)   │              mail alert → owner  │
│      │                                  │                                 │
│      ▼                                  ▼                                 │
│  #form-status (aria-live) ◄── Promise.allSettled → success / error-partial │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
          Read/admin surface: Firebase Console + EmailJS dashboard
          (owners bypass Firestore rules in the console; no client reads)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `index.html` — `<form id="contact-form">` | Collects name/email/subject/message + honeypot field; keeps `novalidate` (JS-owned validation) | `contact-form.js` (submit event) |
| `contact-form.js` — submit orchestrator | Owns the only submit path: client validation → honeypot check → dual-leg write → honest status rendering → reset | Firestore SDK (gstatic ESM), EmailJS SDK (jsDelivr UMD), `#form-status` |
| Firestore — `messages` collection | Durable record of truth; create-only rules validate field types/sizes server-side | `contact-form.js` (`addDoc` only), Firebase Console (admin reads) |
| EmailJS — service + template | Transforms submission into the email alert to the owner | `contact-form.js` (`sendForm` only), EmailJS dashboard (admin config) |
| `#form-status` (existing element) | `aria-live` region rendering sending/success/error states; focusable for screen readers | `contact-form.js` |
| Firebase Console / EmailJS dashboard | Admin configuration + read surface (rules publish, key lookup, message viewing) | — (humans, owners bypass rules) |

### Data Flow

1. User submits → `submit` event `preventDefault()`; `FormData` captured (honeypot value read but **not** forwarded).
2. Client-side validation (email regex, lengths mirrored from rules); honeypot filled → silently abort (no write, no alert).
3. UI → "Sending…", submit button disabled (prevents double-submit quota burn).
4. **Firestore leg:** `await addDoc(collection(db, 'messages'), { …fields, createdAt: serverTimestamp() })`.
5. **EmailJS leg:** `await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form)`.
6. **Both legs awaited via `Promise.allSettled`:** both fulfilled → success state + form reset; either rejected → **distinct error state** (never a false success) with a mailto/WhatsApp fallback nudging the visitor to email directly.
7. State changes announced through the `aria-live` region; `prefers-reduced-motion` respected.

## Patterns to Follow

### Pattern 1: Dual-leg submit with `Promise.allSettled` — success only when both legs fulfill
**What:** Firestore is the durable archive, EmailJS is the alert; a visitor is told "sent" only when *both* succeeded. Each failure mode gets its own honest message.
**When:** Any client-only integration with two independent remote services where one is the record of truth.
**Why:** Sequential `try/catch` around two `await`s misreports partial success (PITFALLS Pitfall 4 — this is the current fake-success bug, reborn at the architectural level).
**Example:**
```javascript
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js';

async function handleSubmit(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));

  const firestoreLeg = addDoc(collection(db, 'messages'), {
    ...data,                       // NOTE: never include the honeypot value
    createdAt: serverTimestamp(),
  });
  const emailLeg = emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, e.target);

  const [dbResult, mailResult] = await Promise.allSettled([firestoreLeg, emailLeg]);
  if (dbResult.status === 'fulfilled' && mailResult.status === 'fulfilled') {
    statusEl.textContent = 'Message sent — thank you.'; form.reset();
  } else {
    statusEl.textContent = 'Something went wrong — please email me directly (link below).';
    console.error(dbResult.reason, mailResult.reason);   // owner-visible diagnostics
  }
}
```

### Pattern 2: Create-only Firestore rules with server-side field validation
**What:** Granular `create` rule on exactly the `messages` collection validating each field's type and size; everything else denied; reads never allowed from clients.
**When:** Any public data-ingestion point (forms, feedback buttons) on a no-backend stack. The browser is untrusted — rules are the only server-side gate.
**Why:** Rules are cheap, deployable from the console (no CLI), and the sole defense against malformed/bot writes (PITFALLS Pitfall 1).
**Example:** see STACK.md "Firestore security rules — public create-only" (verbatim rule set with `request.resource.data` checks).

### Pattern 3: CDN-loaded no-build integration (Firestore Lite ESM + EmailJS UMD)
**What:** `import` Firebase from `gstatic.com/firebasejs/12.19.0/...` in an ES module; load EmailJS as a plain pinned `<script>` from jsDelivr; no npm, no bundler.
**When:** Always — the site has no build step by constraint, and these are the officially documented browser paths. **Pin exact versions** (EmailJS docs float `@4`; `lucide@latest` is a live hazard in this repo).
**Why:** Zero tooling, zero CI; version drift is the only cost, and pinning neutralizes it (STACK.md, HIGH).

### Pattern 4: Mobile-first CSS with dynamic viewport + safe-area handling
**What:** `min-width` breakpoints; `clamp(1rem, 0.9rem + 0.4vw, 1.25rem)` type (the `rem` base keeps WCAG zoom); `min-height: 100svh` for the hero, `100dvh` where mid-scroll reflow is fine; `env(safe-area-inset-*)` padding on fixed elements; `text-size-adjust: 100%`; ≥16px form controls; ≥44px (24px floor) tap targets.
**When:** Any touch-primary audience — here, recruiters on phones (PITFALLS Pitfalls 8–12).
**Why:** `100vh` overflows on mobile browsers; viewport-only units break browser zoom (WCAG 1.4.4).

### Pattern 5: Relative asset paths for GitHub Pages subpath hosting
**What:** Every asset reference relative (`./assets/...` or repo-root-relative), never `/assets/...`; empty `.nojekyll` committed; custom `404.html`; Enforce HTTPS.
**When:** Pages project sites are served under `/repo-name/` — absolute-root paths 404 after deploy (PITFALLS Pitfall 13).
**Verification:** `grep -E 'src="/|href="/' index.html` returns nothing; local subpath test before deploy.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Sequential `await`s with one try/catch → partial-success lies
**What:** Wrapping `await addDoc(...)` then `await emailjs.sendForm(...)` in one try/catch.
**Why bad:** Firestore succeeds + EmailJS fails → visitor told "failed" while the record was archived; or (worse, current bug) success shown after one leg. Every combination is wrong except "both".
**Instead:** `Promise.allSettled` + distinct per-state messaging (Pattern 1).

### Anti-Pattern 2: Firestore test-mode rules shipped to production
**What:** `allow read, write: if true` (or the auto-expiring 30-day test rule) survives to production.
**Why bad:** Full DB read (visitor PII), overwrite, or wipe by anyone with the public API key — and when the 30-day rule expires, the form silently breaks.
**Instead:** Create-only scoped rules published the moment the collection is created (Pattern 2).

### Anti-Pattern 3: "Hiding" the API keys with a proxy
**What:** Routing form submissions through a tiny backend "so the keys are secret."
**Why bad:** Firebase web API key and EmailJS public key are **public by design** (identifiers, not secrets); a proxy reintroduces a backend and billing — the exact constraint this milestone removes. Attempting true secrecy ships the EmailJS *private* key by accident (the real leak; PITFALLS Pitfall 7).
**Instead:** Keep keys in client code; restrict the Firebase browser API key by HTTP referrer (`https://abdil-haiyan.github.io/portfolio2-main/*` + `localhost`) in Google Cloud Console.

### Anti-Pattern 4: Client-side validation as the only gate
**What:** Trusting the JS validation and skipping rules validation / honeypot.
**Why bad:** Bots bypass the page entirely and POST straight to Firestore/EmailJS; rules are the only server-side enforcement that exists without a backend.
**Instead:** Mirror validation in rules (Pattern 2), honeypot on the page, `blockHeadless`/`blockList`/`limitRate` in EmailJS `init`.

### Anti-Pattern 5: `100vh` and viewport-only fluid type
**What:** `height: 100vh` full-screen sections; `font-size: clamp(1rem, 4vw, 2rem)`.
**Why bad:** Mobile URL bar overflows `100vh`; pure-`vw` type can't reach 200% zoom (WCAG 1.4.4 / W3C F94).
**Instead:** `svh`/`dvh` + safe-area; `clamp()` with a `rem` term (Pattern 4).

## Scalability Considerations

| Concern | At 100 visits | At 10K visits | At 1M visits |
|---------|--------------|---------------|-------------|
| Form writes (Firestore) | ~2–5 messages — trivial vs Spark quota | ~50–500/day — within Spark (20–40K writes/day) | Exceeds Spark; needs paid Firestore tier or rate/admin gating |
| Email alerts (EmailJS) | Well within 200/month free cap | **Exceeds 200/month cap — first real constraint** | Paid EmailJS / Formspree migration; alert path is swappable because Firestore holds records |
| Storage (`messages` docs, ~5 KB each) | Negligible | 1 GiB free tier is thousands of docs — fine, but spam floods are the risk → rules caps + honeypot | Tier up; archive/export via console |
| Static page delivery | Pages CDN, no cost | Pages CDN, no cost | Pages CDN, no cost; asset size (1.3 MB image) is the only lever — compress to <100 KB |
| Abuse/quota burn risk | Low | Medium (bots discover the form) | High — honeypot/captcha + monitoring required |

**Scale architecture note:** the design keeps Firestore as the record of truth and EmailJS as a swappable notification. When the free caps bite, only the alert leg changes (paid EmailJS or Formspree) — no rewiring of the data plane, which is exactly how FEATURES.md and STACK.md both recommend absorbing growth.

## Sources

- Firebase official docs — modular SDK, Firestore Lite (`getFirestore`/`addDoc`/`serverTimestamp`), security rules structure, API-key handling: firebase.google.com/docs (HIGH)
- Context7 `/firebase/firebase-js-sdk` — api-review (`firestore-lite.api.md`), CHANGELOG v12 (MEDIUM per seam, official-source backed)
- EmailJS official docs / SDK README — `init` options (`blockHeadless`, `blockList`, `limitRate`), `sendForm`, public-key guidance (HIGH)
- GitHub official docs — Pages branch deploy, `.nojekyll`, custom 404, HTTPS (HIGH)
- Project context: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md` (authoritative for existing structure — form, `#form-status`, scrollspy, unpinned lucide)
- Cross-file consistency: STACK.md (installation + rule set), PITFALLS.md (Pitfalls 1, 3, 4, 7, 8–13, Security Mistakes)

---
*Architecture research for: static portfolio + Firestore/EmailJS contact form + mobile responsiveness + GitHub Pages deploy*
*Researched: 2026-09-18*