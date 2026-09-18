# Phase 1: Working Contact Form - Research

**Researched:** 2026-09-18
**Domain:** Client-side contact form delivery (Firestore writes + EmailJS alert) on a zero-build static site
**Confidence:** HIGH

## Summary

Phase 1 replaces the simulated submit handler (`index.js:124-173` — it currently shows a fake success message and drops every lead) with a real dual-leg submit chain: (1) a Firestore `messages` document written via the Firestore Lite SDK with `serverTimestamp()` and create-only security rules, and (2) an EmailJS email alert to Abdil. The core constraint is total honesty in the status UX: success is only shown after the Firestore write resolves (CONT-02), a durable success is shown even when only the EmailJS alert fails (D-03 overrides "both legs must fulfill"), and full failure renders mailto/WhatsApp fallback links inside the existing `#form-status` element (D-04/D-09).

The recommended implementation is CDN-only (no npm install, no build step): Firebase JS SDK **12.19.0** (`firebase-app.js` + `firebase-firestore-lite.js` ESM from `https://www.gstatic.com/firebasejs/12.19.0/` — matches both the official quickstart version and the npm registry version `[VERIFIED: npm registry]`) loaded as a `<script type="module">` in a new `contact-form.js`, plus EmailJS **4.4.1** UMD (`https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js`, global `emailjs`) loaded as a classic script. Both external keys are public by design and documented so: Firebase API keys restricted to Firebase services are explicitly *not secrets* per official docs, and the EmailJS public key can only trigger Abdil's own templates. Spam protection is layered (honeypot + EmailJS `blockHeadless`/`blockList`/`limitRate` + rules-side field allow-listing with `hasOnly` and type/length checks) — matching CONT-05 and the rejected-reCAPTCHA decision.

**Primary recommendation:** CDN-only integration. `contact-form.js` (a module script that imports Firestore Lite) bootstraps its own `DOMContentLoaded` listener and is loaded *before* `index.js`; the form block and the `showError`/`validateEmail` helpers move out of `index.js` verbatim (D-18). Use promise chains (`.then/.catch`, no `async/await`), no `console.*`, and `document.createElement` for fallback links. Rules reject any doc whose `keys()` include anything beyond the five allowed fields, so the honeypot must never be submitted (D-11 silent abort). Spark free-tier quota is **20,000 writes/day** (`[VERIFIED: firebase.google.com/docs/firestore/quotas]`) — this resolves the SUMMARY.md (b) discrepancy.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Form submission handling | Browser / Client | — | Vanilla site, no server; submit handler lives in `contact-form.js` |
| Message persistence | Database / Storage | API/Backend (Firestore rules) | Firestore `messages` collection; rules ARE the server-side enforcement (create-only, field allow-list, length/type checks) |
| Email alert to Abdil | External service (EmailJS SaaS) | Browser (SDK call site) | EmailJS free tier sends predefined templates; no backend required |
| Spam protection | Browser / Client (honeypot, silent abort) | Database rules (`hasOnly`/type/length) + EmailJS anti-abuse (`blockHeadless`/`blockList`/`limitRate`) | Layered — no single control is sufficient; rules are the server-side backstop that direct API callers cannot bypass |
| Status UX (sending/success/error) | Browser / Client | — | `#form-status` element + `.form-status-alert`/`.success` CSS; success gated on Firestore resolution only |
| Setup / credentials | Human (Abdil, via `SETUP.md`) | — | Firebase project + EmailJS account created by user; keys pasted into `contact-form.js` placeholders |

## User Constraints (from CONTEXT.md)

### Implementation Decisions

#### Status UX & Partial Failure
- **D-01:** Success copy stays exactly as-is: "Thank you! Your message has been sent successfully. I will get back to you shortly." (matches current site voice, zero copy churn).
- **D-02:** In-flight "Sending..." state shown in `#form-status`; the submit button is disabled until both legs resolve — prevents double-submits and is honest about in-flight work.
- **D-03:** Partial failure (Firestore write succeeds, EmailJS alert fails) → **show success**. Firestore is the primary delivery; the message IS stored and Abdil sees it in the console even without the email alert. **This OVERRIDES research ARCHITECTURE.md Pattern 1** ("success only when both legs fulfill") — the planner must NOT implement the both-legs-required success gate. — **Reversibility:** reversible — success semantics are local to `contact-form.js`; no migration or contract impact.
- **D-04:** Full failure (Firestore write fails, or network error) → error state + fallback links (see Fallback section).
- **D-05:** Success auto-hides after ~5s (current behavior preserved); **error states persist** until the next submit so the fallback links stay visible.

#### Fallback Mechanism
- **D-06:** Fallback = clickable mailto + WhatsApp links. Reuse the existing targets: `mailto:abdilhaiyanhilmi@gmail.com` (index.html:446) and `https://wa.link/kx5upx` (index.html:457). No auto-open navigation.
- **D-07:** The mailto link is prefilled with the user's typed subject and message (URL-encoded) so the lead survives the failure.
- **D-08:** Any failure triggers the fallback: Firestore reject, EmailJS reject, network error, or timeout.
- **D-09:** Fallback links render inside `#form-status` (the existing alert element) — no new DOM structure.

#### Firestore Schema & Rules
- **D-10:** Document schema is minimal: `name`, `email`, `subject`, `message`, `createdAt` (serverTimestamp). No extra fields, no metadata, no honeypot field stored.
- **D-11:** Honeypot: the client NEVER sends the honeypot field. If the honeypot is tripped client-side, silently abort (no write, no alert, no status change). Rules reject any doc containing a honeypot field (enforced via `hasOnly` — see D-12).
- **D-12:** Rules are strict: `allow create` gated by `request.resource.data.keys().hasOnly(['name','email','subject','message','createdAt'])` + type checks + string length limits (name ≤120, subject ≤200, message ≤5000 — per research STACK.md). `allow read, update, delete: if false`. — **Reversibility:** reversible — rules are console-edited; no migration needed since no client reads `messages`.
- **D-13:** Email rule: **type + length checks only** in rules; the email regex stays client-side. (Deviates from research STACK.md's `email.matches(...)` — remove the regex from the rules.)

#### EmailJS Setup Contract
- **D-14:** Keys are placeholder consts at the top of `contact-form.js`: `EMAILJS_PUBLIC_KEY`, `SERVICE_ID`, `TEMPLATE_ID` (plus the `firebaseConfig` object for Firestore). The setup guide tells Abdil to paste his real values.
- **D-15:** The EmailJS email template shows all 4 fields: name, email, subject, message — Abdil sees the full lead.
- **D-16:** Graceful skip: if the keys are still placeholders (unconfigured), skip the EmailJS leg — Firestore still stores the message and success still shows. The form must not hard-fail on placeholder keys.
- **D-17:** EmailJS send call passes standard params: `from_name`, `reply_to` (user's email), `subject`, `message` — so the template can reply directly to the lead.

#### Module Split & Code Style
- **D-18:** The full form block moves to `contact-form.js`: validation + submission + status/fallback rendering. `index.js` keeps theme/menu/skills/scrollspy. The `showError` and `validateEmail` helpers (index.js:175-182) move with it. No shared state between the two files.
- **D-19:** `contact-form.js` bootstraps itself with its own `DOMContentLoaded` listener (mirrors the index.js pattern); loaded before `index.js` in `index.html`. (Research STACK.md shows `<script type="module" src="contact-form.js">` — the planner reconciles module deferral semantics with the self-contained bootstrap intent.)
- **D-20:** Async Firestore/EmailJS calls use **promise chains** (`.then/.catch`), NOT `async/await` — matches the documented "no async/await" convention.
- **D-21:** Fallback links are built with `document.createElement` + `appendChild` — no `innerHTML` (closest to the `innerText`-only convention).

#### Setup Guide
- **D-22:** `SETUP.md` at repo root (discoverable, doesn't bloat README).
- **D-23:** Beginner-friendly tone — Abdil is an accountant, not a developer. Plain language, no jargon.
- **D-24:** Full walkthrough: Firebase project → Firestore rules paste → EmailJS account → service/template creation → paste keys into `contact-form.js`.
- **D-25:** Includes a "Test it" verification section: submit a test message, check the Firestore console + inbox.

### Agent's Discretion
- Honeypot field name and exact placement in the form (e.g., hidden input, `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`).
- Exact "Sending..." copy and the timeout value for network-failure detection.
- EmailJS failure handling on the partial-failure path: per conventions there is no `console.*` — the EmailJS rejection is silent (success still shows per D-03); only the full-failure path renders the fallback.
- Exact length limits in rules (use STACK.md defaults: name ≤120, subject ≤200, message ≤5000).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | Visitor can submit the contact form and the message is written to Firestore `messages` collection (create-only security rules, `serverTimestamp`, no reads) | Firestore Lite 12.19.0 `addDoc(collection(db, "messages"), {...})` + `serverTimestamp()`; create-only rules with `hasOnly` + type/length checks; `allow read, update, delete: if false` |
| CONT-02 | Visitor receives honest status feedback: sending / success / error states (success shown only after Firestore write resolves) | D-02 sending state + disabled button; D-03/D-04/D-05 status semantics; success gated on Firestore resolution only; error states persist |
| CONT-03 | Abdil receives an email alert for each submitted message via EmailJS (free tier, no backend) | EmailJS 4.4.1 UMD CDN + `emailjs.init({publicKey, blockHeadless, blockList, limitRate})` + `emailjs.send(serviceID, templateID, params)` promise; D-16 graceful skip on placeholder keys |
| CONT-04 | Form shows a mailto/WhatsApp fallback when Firestore or EmailJS fails (partial-failure handling) | D-06..D-09: reuse `mailto:abdilhaiyanhilmi@gmail.com` (index.html:446) + `https://wa.link/kx5upx` (index.html:457); prefilled URL-encoded subject/message; rendered via createElement inside `#form-status` |
| CONT-05 | Form is protected against spam via honeypot + EmailJS `blockHeadless`/`blockList`/`limitRate` + Firestore field validation | Honeypot best practices (hidden text input, a11y attributes, silent abort — cross-checked 5 sources); EmailJS options verified (451/403/429 error codes); rules-side `hasOnly` allow-list is the non-bypassable backstop |
| CONT-06 | Step-by-step Firebase + EmailJS setup guide exists so Abdil can create the project and paste his own config keys | D-22..D-25 SETUP.md contract; API-key public-by-design docs; EmailJS dashboard walkthrough refs (service/template/domains) |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Firebase JS SDK (`firebase-app` + `firebase-firestore-lite`) | 12.19.0 (CDN ESM) | Firestore `messages` writes, `serverTimestamp()` | Official Firebase modular SDK for the web, zero-build; version 12.19.0 confirmed BOTH on the official gstatic CDN (quickstart page) AND on the npm registry `[VERIFIED: npm registry + official quickstart]` |
| EmailJS (`@emailjs/browser` UMD) | 4.4.1 (jsDelivr CDN) | Email alert to Abdil on each submit | Official EmailJS browser SDK; 4.4.1 verified on npm registry `[VERIFIED: npm registry]`; global `emailjs` object matches the `window.lucide` guard pattern |

**Version verification (2026-09-18):**
- `npm view firebase version` → `12.19.0` (matches gstatic CDN path used in official quickstart docs) `[VERIFIED: npm registry]`
- `npm view @emailjs/browser version` → `4.4.1` (matches jsDelivr `@4/dist/email.min.js` major) `[VERIFIED: npm registry]`

**Installation — none.** No npm install is required or desired (per project constraint: no build step, GitHub Pages trivial deployment). External scripts load via `<script>` tags in `index.html`:

```html
<!-- EmailJS UMD (classic script, global `emailjs`) — pin exact version, do NOT use @4 tracking -->
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js"></script>
<!-- contact-form.js as a module so it can import Firestore Lite from gstatic (D-19) -->
<script type="module" src="contact-form.js"></script>
<!-- existing -->
<script src="index.js"></script>
```

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing `.form-status-alert` / `.success` CSS (index.css:1068-1073) | — | Success state styling, no new CSS needed | Reuse for status rendering |
| Existing `.form-error-msg` / `.has-error` pattern (index.css:1049-1055) | — | Validation error styling | Kept as-is; moved to `contact-form.js` |
| `http-server` ^14.1.1 (existing devDependency) | 14.x | Local dev serving (`npm run dev`, port 3000) | Required for testing — ES modules and Firestore/EmailJS fetch calls fail on `file://` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `firebase-firestore-lite.js` (Lite SDK) | Full `firebase-firestore.js` SDK | Lite is smaller and supports one-time `addDoc`/`get` — the exact write-only use case; no realtime listeners needed. Full SDK is heavier with no benefit here |
| CDN-only (no install) | `npm i firebase` + bundler | Project constraint forbids build step; CDN keeps GitHub Pages deploy trivial |
| EmailJS 4 UMD (global `emailjs`) | `@emailjs/browser` ESM import | UMD matches the existing `window.lucide` guard pattern and needs no module wiring for the email leg |
| Honeypot + EmailJS options | reCAPTCHA / Cloudflare Turnstile | Explicitly out of scope (REQUIREMENTS.md); honeypot is zero-friction and free; CAPTCHA is "overkill at this scale" |
| Spark + EmailJS free tier | Backend / Cloud Functions | Requires billing account — rejected (REQUIREMENTS.md out of scope) |

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `firebase` | npm | ~8 yrs (rolling releases; latest published 2026-09-09) | 9,147,620/wk | github.com/firebase/firebase-js-sdk | SUS (reason: "too-new" — rolling release cadence, not a suspicious package) | Approved for CDN use — **not installed via npm**; version 12.19.0 cross-verified: npm registry = official gstatic CDN path. No install checkpoint needed (no npm install occurs) |
| `@emailjs/browser` | npm | 2 yrs (published 2024-07-11) | 119,148/wk | github.com/emailjs-com/emailjs-sdk | OK | Approved (CDN use; no postinstall; official repo) |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `firebase` — flagged only for the `too-new` signal caused by Firebase's frequent rolling releases. This is a false-positive-style signal for a 9M-downloads/wk package from the official `firebase/firebase-js-sdk` repo with no postinstall script. The phase never runs `npm install firebase` (CDN-only), so no install checkpoint is required; the planner should note that the CDN URL `https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js` is the official distribution path referenced in Firebase's own quickstart docs.

*Package names `firebase` / `@emailjs/browser` were verified against the npm registry via `npm view` and the gsd-tools package-legitimacy seam; CDN versions match official documentation. `@emailjs/browser` is `[VERIFIED: npm registry]`; `firebase` CDN usage is `[VERIFIED: npm registry + official docs]`.*

## Architecture Patterns

### System Architecture Diagram

```
Visitor (mobile/desktop browser)
        |
        | submit #contact-form (novalidate, JS-validated)
        v
+---------------------+   honeypot tripped?  ---- silently abort (no writes,
|  contact-form.js    |                            no UI change)  (D-11)
|  (module script,    |
|  own DOMContentLoaded|  keys placeholder?  ----- skip EmailJS leg (D-16)
+---------------------+
   |                                   |
   | Firestore Lite 12.19.0            | EmailJS 4.4.1 UMD
   | (gstatic ESM CDN)                 | (jsDelivr CDN)
   v                                   v
  addDoc(collection(db,"messages"),{name,email,subject,message,createdAt:serverTimestamp()})
   |                                   emailjs.send(SERVICE_ID, TEMPLATE_ID,
   |                                   {from_name,reply_to,subject,message})
   v                                   |
+---------------------+                v
| Firestore Rules      |        EmailJS anti-abuse: blockHeadless (451),
| allow create:        |        blockList (403), limitRate (429)
|   hasOnly(5 fields)  |                |
|   type+length checks |                v
| allow read/update/   |        EmailJS service -> Abdil's inbox
|   delete: if false   |                |
+---------------------+                |
   |                                   |
   | resolved                       rejected
   v                                   v
success (Firestore resolved, D-02/D-03) -- EmailJS rejection is SILENT if Firestore
   |                                     succeeded (D-03); otherwise counts as failure
   v
+---------------------+   full failure      +----------------------+
| #form-status        | ------------------> | mailto:... + wa.link  |
| success .success    |   (D-04/D-08)       | prefilled subject/   |
| auto-hide ~5s       |                     | message, createElement|
+---------------------+   error persists    +----------------------+
                         (D-05)
```

### Recommended Project Structure

```
portfolio2-main/
├── index.html          # + EmailJS UMD script, + contact-form.js module, honeypot field (D-19, discretion)
├── index.css           # unchanged (reuses .form-status-alert/.success/.form-error-msg)
├── index.js            # shrinks: form block (120-173) + helpers (175-182) removed; theme/menu/skills/scrollspy remain
├── contact-form.js     # NEW: placeholder keys, firebaseConfig, validation (moved), submission, status/fallback rendering
├── SETUP.md            # NEW: beginner walkthrough Firebase + EmailJS + rules paste + keys + test (D-22..D-25)
├── package.json        # unchanged
└── images/             # unchanged
```

### Pattern 1: Create-Only Firestore Collection with Field Allow-List

**What:** The `messages` collection allows anonymous clients to *create* documents that match an exact schema, and nothing else. This is the documented Firestore pattern for public write-only intake.

**When to use:** Any anonymous web form that must persist data without exposing it (contact forms, feedback, lead capture). Rules are the only server-side enforcement — client-side checks are bypassable.

**Example (verbatim from official docs — `[VERIFIED: firebase.google.com/docs/firestore/security/rules-fields]`):**

```
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow the user to create a document only if that document doesn't contain
    // any fields besides the ones listed below.
    match /restaurant/{restId} {
      allow create: if (request.resource.data.keys().hasOnly(
        ['name', 'location', 'city', 'address', 'hours', 'cuisine']));
    }
  }
}
```

Official docs additionally recommend the `verifyFields(required, optional)` helper combining `hasAll` + `hasOnly`:
```
function verifyFields(required, optional) {
  let allAllowedFields = required.concat(optional);
  return request.resource.data.keys().hasAll(required) &&
    request.resource.data.keys().hasOnly(allAllowedFields);
}
```

**Phase application (D-12/D-13):** `match /messages/{messageId}` with `allow create: if request.resource.data.keys().hasOnly(['name','email','subject','message','createdAt']) && request.resource.data.name is string && request.resource.data.name.size() <= 120 && request.resource.data.email is string && request.resource.data.email.size() <= 254 && request.resource.data.subject is string && request.resource.data.subject.size() <= 200 && request.resource.data.message is string && request.resource.data.message.size() <= 5000 && request.resource.data.createdAt is timestamp;` plus `allow read, update, delete: if false`. No regex in rules (D-13).

### Pattern 2: Promise-Chain Dual-Leg Submits with Honest Status

**What:** Both async legs (Firestore write, EmailJS send) run as promise chains; the status state machine is: `sending → success` (Firestore resolved) or `sending → error+fallback` (Firestore rejected / network timeout). EmailJS resolution is *not* part of the success gate (D-03).

**When to use:** Every async flow in this codebase — the "no `async/await`" convention (D-20) and the "no `console.*`" rule make `Promise.prototype.then/catch` the only sanctioned async shape.

**Example (EmailJS promise shape — `[VERIFIED: emailjs.com/docs/sdk/send]`):**
```js
emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams).then(
  (response) => {
    console.log('SUCCESS!', response.status, response.text);   // NOTE: project convention forbids console.*
  },
  (error) => {
    console.log('FAILED...', error);                            // project: handle silently instead
  },
);
```
*Source: https://www.emailjs.com/docs/sdk/send/ — adapted to project conventions (no console.*; EmailJS rejection silent when Firestore succeeded, per D-03/discretion).*

### Pattern 3: Honeypot Field (accessibility-safe, silent abort)

**What:** A real-looking text input, hidden via CSS off-screen, that humans never fill but naive bots auto-fill. On submit, a non-empty honeypot value means "bot" — abort silently (default success is NOT shown; per D-11 no write, no alert, no status change).

**When to use:** Any public form without a CAPTCHA. Always pair with server-side rules (`hasOnly` guarantees the honeypot field is rejected if ever submitted) and EmailJS rate limiting.

**Best-practice attributes (cross-checked across 5 independent sources `[CITED: sendform.net, formplume.com, straycode.dev, formshield.dev, splitforms.com]`):**
- Use a **normal text input** — never `type="hidden"` (bots deliberately skip hidden inputs; they expect tokens in them).
- Hide with **CSS off-screen positioning** (`position: absolute; left: -9999px`), not `display: none` (smarter bots ignore `display:none`; off-screen forces a full layout pass to detect).
- `tabindex="-1"` (keeps keyboard users out), `autocomplete="off"` (prevents autofill false positives), `aria-hidden="true"` (screen readers skip it), and a visible-to-assistive-tech fallback label like "Leave this field empty".
- Field name should look tempting to bots (`website`, `url`, `fax`, `phone2`) and avoid obvious names (`honeypot`, `_gotcha`) that sophisticated bots skip.
- **Silent rejection only** — never reveal the trap to the bot. (Note: D-11's "silently abort, no status change" is even stricter than the common "fake success" pattern and is fine because Firestore rules are the real backstop.)

### Anti-Patterns to Avoid
- **Client-only spam protection:** A honeypot check that stops at the browser is bypassable by direct API calls. Rules-side `hasOnly` + length limits are the enforcement that cannot be skipped — the client check is just UX filtering.
- **Both-legs success gate:** D-03 explicitly overrides ARCHITECTURE.md Pattern 1. Success must be gated on the Firestore write only; waiting on EmailJS delays/withholds honest feedback and would surface false failures (email allowlist issues, 429s) as user-facing errors.
- **`async/await` in the new file:** Violates the D-20/conventions constraint. Even though Firestore SDK returns promises, structure them as `.then/.catch`.
- **Blocking the EmailJS leg on placeholder keys:** D-16 requires graceful skip — a hard failure on a missing key would break the primary delivery path forever until Abdil configures the account.
- **innerHTML for fallback links:** XSS-adjacent risk since message/subject are user input — createElement + appendChild per D-21.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Firestore writes | Raw Firestore REST calls with hand-rolled auth/tokens | Firebase JS SDK (Firestore Lite) | SDK handles auth token refresh, serialization, `serverTimestamp()` sentinel mapping; REST would need OAuth token management and exact request shaping — a pure liability on a zero-build site |
| Email delivery | Custom SMTP/mail server | EmailJS free tier | No backend allowed (budget $0, Spark-only); EmailJS handles service connections (Gmail/Outlook) and template rendering server-side |
| Bot detection | A custom full bot-detection engine | Honeypot + EmailJS `blockHeadless`/`blockList`/`limitRate` + rules validation | Layered free controls; each independent control is intentionally simple; a "real" anti-bot system is out of scope (reCAPTCHA explicitly rejected) |
| Timeout handling | Hand-rolled AbortController plumbing everywhere | One `setTimeout`-based failure path in `contact-form.js` (discretion: timeout value) | Single submit path, single timeout need — an AbortController adds complexity for one use case; the fill-hungry promise chain resolves or the timeout flips to the error+fallback state |

**Key insight:** Every piece of this phase has a maintained, free, CDN-loadable provider. The Firestore rules engine and EmailJS template system absorb the hard parts (write validation, email deliverability, template rendering); the custom code is only the small UX state machine — and that is exactly where this project's hand-written conventions (promise chains, no console, createElement) apply cleanly.

## Common Pitfalls

### Pitfall 1: Open Firestore Rules (PII leak)
**What goes wrong:** A default or permissive rules file (`allow read, write: if true`) exposes every visitor's name, email, and message to the internet.
**Why it happens:** Firestore's Firebase-console default rules are often left untouched; or a first attempt uses `allow read, write: if true` "to make it work".
**How to avoid:** Paste the D-12 rules exactly as specified: create-only with `hasOnly` + type/length checks, and explicit `allow read, update, delete: if false`. Include these rules as a verbatim block in `SETUP.md` so Abdil pastes the exact text into the console.
**Warning signs:** Rules playgorund shows read access from anonymous client; any client can list `messages`.

### Pitfall 2: Rules Syntax Errors Fail Closed and Silently
**What goes wrong:** A typo in rules (unbalanced parens, missing `is` keyword, wrong field name) makes EVERY write silently fail with `permission-denied` — the form looks broken with no console guidance for a non-developer.
**Why it happens:** Rules are authored by a beginner (Abdil pasting from SETUP.md) or edited by hand; there is no build-time check.
**How to avoid:** Provide the exact final rules block in `SETUP.md` (copy-paste only), and instruct Abdil to use the **Firestore Rules playground** (simulated read/write + load test) before closing the console. Keep rules minimal so copy-paste drift is impossible.
**Warning signs:** Real submits return `permission-denied`; Rules playground shows `false` for the create simulation.

### Pitfall 3: `createdAt` / `serverTimestamp()` Mismatch in Rules
**What goes wrong:** The rule `request.resource.data.createdAt is timestamp` rejects writes where the client sends a plain `Date`/number, or where the timestamp is missing entirely.
**Why it happens:** `serverTimestamp()` is a sentinel processed server-side; rules evaluate the *final* document — but only if the field is actually present in the write.
**How to avoid:** Always include `createdAt: serverTimestamp()` in the `addDoc` payload (never omit it), and confirm rules check `createdAt is timestamp`. `[ASSUMED]` — verify the exact sentinel→rules interaction once against the mature SDK at apply time (SUMMARY.md flag (c)).
**Warning signs:** Writes succeed for `{...4 fields}` but fail when a client omits `createdAt`.

### Pitfall 4: EmailJS Writes Rejected from an Unallowed Origin / Rate Limited
**What goes wrong:** EmailJS returns errors (403/429/other) and no email arrives — DevTools shows a failed `api.emailjs.com` request.
**Why it happens:** The dashboard **Domains allowlist** (Account → Security → Domains) doesn't include the requesting origin, or `limitRate` throttling trips (429), or `blockList` matches the sender (403), or a headless browser is detected (451 — `blockHeadless`).
**How to avoid:** SETUP.md instructs: add the served origin(s) (`https://<user>.github.io`, `http://localhost:3000` for testing) to the Domains allowlist using the documented syntax `<scheme> "://" <hostname> [ ":" <port> ]` `[VERIFIED: emailjs.com/docs/faq/can-i-add-my-domain-to-allowlist]`. Configure `limitRate` (e.g. `throttle: 10000` with `id: 'app'`) and treat 429/403/451 as ordinary failures (partial-failure → silent; full-failure → fallback).
**Warning signs:** Submit succeeds in UI but inbox stays empty; EmailJS history shows failed requests.
**Note (open question OQ-1):** SUMMARY.md flag (a) claimed the allowlist is paid-tier; the FAQ page fetched does not state a price tier. Treat allowlist as optional hardening, not a phase dependency, so the form works regardless.

### Pitfall 5: Unhandled Promise Rejection → Silent Full Failure
**What goes wrong:** The primary leg rejects (offline, quota, rules) but nothing renders — no error, no fallback — leaving the visitor believing the message was sent.
**Why it happens:** A `.catch` is missing on one of the promise chains, or a chain throws synchronously (e.g., `window.emailjs` undefined when the UMD script failed to load) before the `.then` wiring.
**How to avoid:** Every chain ends in `.catch` that flips the status to error+fallback (D-04/D-08). Guard `window.emailjs` with a truthiness check before calling (mirrors the `window.lucide` pattern at index.js:3). Disable the submit button before starting the legs (D-02) so a slow rejection cannot cause a double-submit race.
**Warning signs:** `Uncaught (in promise) ...` in DevTools; `#form-status` frozen on "Sending...".

### Pitfall 6: Honeypot Accidental Entries (false positives) or Revealed Trap
**What goes wrong:** A real visitor is blocked because autofill/password-manager filled the decoy; or a bot learns the trap name from an error message and skips it.
**Why it happens:** Missing `autocomplete="off"`/`tabindex="-1"`; or the abort path renders an error ("spam detected") that teaches the bot.
**How to avoid:** Apply the full attribute trio (Pitfall 6 checklist above) and choose a non-obvious field name in the discretion area. Abort **silently** per D-11 — never tell the bot it was caught.
**Warning signs:** Messages from real users are missing from Firestore; the honeypot input is visibly focusable on keyboard nav.

### Pitfall 7: Module/Classic Script Ordering
**What goes wrong:** `contact-form.js` runs before the EmailJS UMD script has set the global `emailjs`, or the module's `DOMContentLoaded` listener never fires because the event already dispatched.
**Why it happens:** Module scripts (`type="module"`) are deferred by default — they execute after HTML parsing completes, in document order among modules, before `DOMContentLoaded`; classic scripts execute synchronously in document order during parsing `[VERIFIED/CITED: MDN DOMContentLoaded + web.dev]`.
**How to avoid:** Order the tags: EmailJS UMD classic script FIRST (its global is set during parsing), then `<script type="module" src="contact-form.js">` (executes after parse, before `DOMContentLoaded` — safe to attach its listener), then the existing `<script src="index.js">`. Because modules defer, `contact-form.js`'s listener registers *after* `index.js`'s — irrelevant since D-18 mandates no shared state. Multiple `DOMContentLoaded` listeners fire in registration order per DOM3 `[CITED: MDN/StackOverflow]`.
**Warning signs:** `emailjs is not defined` at module eval time; all form logic inert on first load.

## Code Examples

**1. Firestore write — official quickstart pattern, applied to `messages` `[CITED: firebase.google.com/docs/firestore/quickstart]`:**

```js
// in contact-form.js (module): placeholder keys per D-14
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// inside the submit handler, after validation passes (promise chain, D-20):
addDoc(collection(db, "messages"), {
  name: nameInput.value.trim(),
  email: emailInput.value.trim(),
  subject: subjectInput.value.trim(),
  message: messageInput.value.trim(),
  createdAt: serverTimestamp(),
}).then(() => {
  // D-02/D-03: Firestore resolved → success (EmailJS leg independent, rejection silent)
  formStatus.innerText = "Thank you! Your message has been sent successfully. I will get back to you shortly.";
  formStatus.classList.add("success");
  contactForm.reset();
  setTimeout(() => { formStatus.style.display = "none"; }, 5000);
}).catch(() => {
  // D-04/D-08: full failure → error state + fallback links (createElement, D-21)
});
```

**2. EmailJS init + send — verbatim official API `[VERIFIED: emailjs.com/docs/sdk/init, /send, /options]`:**

```js
emailjs.init({
  publicKey: 'YOUR_PUBLIC_KEY',
  blockHeadless: true,
  blockList: {
    list: ['user@gmail.com'],
    watchVariable: 'userEmail',
  },
  limitRate: { id: 'app', throttle: 10000 },
});
```

```js
var templateParams = { name: 'James', notes: 'Check this out!' };
emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams).then(
  (response) => { /* response.status, response.text */ },
  (error) => { /* error */ },
);
```

Phase mapping per D-17: `emailjs.send(SERVICE_ID, TEMPLATE_ID, { from_name: ..., reply_to: emailInput.value, subject: ..., message: ... })`. Error codes: 429 rate limit, 403 blockList, 451 blockHeadless `[VERIFIED: emailjs.com/docs/sdk/options]`.

**3. Full rules block for SETUP.md (D-12/D-13)** — paste-verbatim target:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{messageId} {
      allow create: if
        request.resource.data.keys().hasOnly(['name', 'email', 'subject', 'message', 'createdAt']) &&
        request.resource.data.name is string && request.resource.data.name.size() <= 120 &&
        request.resource.data.email is string && request.resource.data.email.size() <= 254 &&
        request.resource.data.subject is string && request.resource.data.subject.size() <= 200 &&
        request.resource.data.message is string && request.resource.data.message.size() <= 5000 &&
        request.resource.data.createdAt is timestamp;
      allow read, update, delete: if false;
    }
  }
}
```

**4. Honeypot markup (discretion: name/placement)** — synthesized from sources `[CITED: sendform.net / formplume.com / straddle: straycode.dev]`, placed inside `#contact-form`:

```html
<div class="form-group hp-field" aria-hidden="true">
  <label for="form-website">Leave this field empty</label>
  <input type="text" id="form-website" name="website" class="form-control"
         tabindex="-1" autocomplete="off">
</div>
```
```css
.hp-field { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full Firestore Web SDK | **Firestore Lite SDK** (one-time get/add only) | 2021+ (Lite released; mature by 12.x) | Smallest bundle for write-only forms; no realtime listeners needed |
| Client `Date` timestamps | `serverTimestamp()` server-authoritative timestamps | Firestore GA (2019) | Rules can enforce `is timestamp`; no client-clock trust |
| Deny-list rule authoring (block specific fields) | **Allow-list authoring** (`keys().hasOnly(...)`) | Documented pattern in official docs | New fields fail closed (add to list to allow) — safer schema evolution |
| reCAPTCHA as default spam gate | **Honeypot + client SDK rate limiting + rules validation** | Free-tier web forms, 2022+ | Zero friction; layered controls; CAPTCHA only as later step-up (CONT-08) |
| Client-only honeypot checks | Honeypot + server-side rules backstop | Always (rules are the enforcement) | Bots posting directly to Firestore/EmailJS are still constrained by schema/length rules |

**Deprecated/outdated:**
- `firebase.compat` (namespaced) SDK builds: still served on gstatic (`firebase-app-compat.js`) but the modular import style is the current default and is what the quickstart documents first — use the modular `firebase-app.js` / `firebase-firestore-lite.js` ESM imports.
- Client-side-only status gating with fake success (the current `index.js:162-171` pattern): being replaced this phase; it has silently dropped every lead to date.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `serverTimestamp()` resolves and satisfies `createdAt is timestamp` in rules | Common Pitfalls 3 | Write rejections; mitigated by including the field in every payload and validating once via rules playground |
| A2 | Exact gstatic ESM file names `firebase-app.js` / `firebase-firestore-lite.js` at version 12.19.0 | Standard Stack | 404 on script fetch → form inert; SUMMARY.md flag (c) already requires re-verification at apply time (resolve via STACK.md pin) |
| A3 | EmailJS Domains allowlist availability on the free tier (FAQ fetched does not state a tier) | Pitfall 4 / OQ-1 | If allowlist is paid-only, localhost/prod origins are unrestricted — EmailJS still works, abuse surface slightly larger; mitigated by treating allowlist as optional hardening |
| A4 | `size()` string-length rules avoid needing email regex in rules (D-13) | Rules block | Length-only email validation allows junk but satisfies CONT-05 via layered controls (honeypot + blockList + rate limits) |

## Open Questions

1. **EmailJS free-tier domain allowlist** — What we know: allowlist exists in dashboard (Account → Security → Domains) with syntax `<scheme> "://" <hostname> [ ":" <port> ]` [VERIFIED FAQ]. What's unclear: whether the free tier includes it (SUMMARY.md flag (a) claimed paid-tier). Recommendation: treat as optional hardening in SETUP.md ("if you see the Domains option, add your site"); do not make the phase depend on it.
2. **Firestore database region** — What we know: SETUP.md instructs creating a Firestore database; the console default `(us-central)` applies if unmodified. What's unclear: whether Abdil prefers a region closer to Malaysia (e.g. `asia-southeast1`). Recommendation: instruct default region in SETUP.md; note it is fixed at database creation.
3. **EmailJS template variable binding** — What we know: D-17 fixes the send params (`from_name`, `reply_to`, `subject`, `message`, per standard EmailJS variable names used in the template editor). What's unclear: Abdil's exact template body. Recommendation: SETUP.md's template-creation step lists exactly these five variable names as the required template variables (with `{{from_name}}` etc.), plus a screenshot-style note that the template subject/body should contain `{{subject}}`/`{{message}}`.
4. **Network-failure timeout value** — What we know: D-08 requires timeout coverage; discretion gives the value. What's unclear: none materially. Recommendation: 10s (generous for mobile networks; Firestore normally resolves in <2s); any rejection before it still routes to fallback.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Dev server (`npm run dev` → http-server) | ✓ | v24.18.0 | Any Node supporting http-server |
| npm | package scripts | ✓ | 11.16.0 | — |
| git | Repo/commit workflow | ✓ | (repo active) | — |
| `http-server` | Local static serving (ESM + fetch need http, not file://) | ✓ | ^14.1.1 (npx resolves fresh; no lockfile) | `npx -y http-server -p 3000` |
| Browser (mobile/desktop) | Manual verification (submit, rules playground output) | ✓ | — | — |
| Firebase Console (Web) | Project creation, rules paste, `messages` inspection | ✗ (user-side) | — | `SETUP.md` walks Abdil through it; executor works with placeholder keys per D-14/D-16 |
| EmailJS dashboard (Web) | Service/template creation, keys | ✗ (user-side) | — | `SETUP.md` walks through it; graceful skip per D-16 |
| Firebase/EmailJS credentials | End-to-end live test | ✗ | — | Placeholder keys → EmailJS leg skips, Firestore leg needs real project; end-to-end test is a SETUP.md step (D-25), not an executor gate |

**Missing dependencies with no fallback:** none blocking code execution — the code path is fully implementable and testable for validation/UX states with placeholder keys; only the live delivery test requires user-provided accounts (handled by the SETUP.md "Test it" section).

**Missing dependencies with fallback:** Firebase project + EmailJS account (user-side setup, guided by SETUP.md; graceful-skip keeps the form functional before configuration).

## Security Domain

*(`security_enforcement: true` in .planning/config.json; ASVS Level 1, block_on high.)*

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | None — anonymous create-only intake by design; auth would block visitors |
| V3 Session Management | no | Stateless page; no sessions |
| V4 Access Control | yes | Firestore rules: `allow create` constrained by `hasOnly` + type/length; `allow read, update, delete: if false` (write-only, zero read surface — no PII exposure) |
| V5 Input Validation | yes | Client: existing `validateEmail` regex + required-field checks (moved to contact-form.js). Server: rules type checks (`is string`/`is timestamp`) + string `size()` limits (name ≤120, subject ≤200, message ≤5000) + `hasOnly` field allow-list. D-13 keeps regex client-side by design |
| V6 Cryptography | no | No secrets in client (public keys only, public by design); HTTPS enforced at GitHub Pages (DEPL-01); no data at rest beyond Firestore's managed encryption |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthenticated write flooding / spam | Tampering / DoS | Create-only rules + length caps (write cost bounded); honeypot silent abort; EmailJS `limitRate` (429) throttles the email leg; Spark 20K writes/day ceiling |
| Message collection mass-read (PII leak: names, emails, messages) | Information Disclosure | `allow read: if false` — the single biggest rules requirement; verify in Rules playground |
| Rules regression from manual console edits | Tampering | SETUP.md paste-verbatim block + Rules playground load test before closing console (DEPL-02 re-check gate) |
| Direct API abuse bypassing the UI (post straight to Firestore/EmailJS) | Spoofing | Rules are server-enforced (schema/length/read-deny); EmailJS can only send Abdil's templates (FAQ [VERIFIED]) so key theft is bounded |
| Stored user content rendered unsafely | Tampering | Fallback links via `createElement`/`appendChild` (no innerHTML, D-21); messages are never re-rendered on the site (no read surface) |
| Key-leak panic / misconfigured "security" | (process) | Both keys are public-by-design: Firebase API keys restricted to Firebase services are explicitly not secrets [VERIFIED official docs]; EmailJS public key only triggers own templates [VERIFIED FAQ]. Never put the EmailJS private key (Node-only option) in client code ||(1)
| XSS via mailto fallback params | Tampering | Values URL-encoded (D-07) and set via `href` property after `createElement('a')` — no HTML string interpolation |

**ASVS-relevant control for V4/V5:** the rules block in Code Example 3 is the single source of truth for both access control and input validation; it must be copied verbatim into SETUP.md and the console. This is also the DEPL-02 "rules re-checked in console" gate for Phase 4.

## Sources

### Primary (HIGH confidence)

- [Firestore Security Rules — Control access to specific fields](https://firebase.google.com/docs/firestore/security/rules-fields) (fetched 2026-09-18) — verbatim `hasOnly` examples (lines 1960-2009), `verifyFields` helper.
- [Firestore Quickstart](https://firebase.google.com/docs/firestore/quickstart) (fetched) — modular `initializeApp`/`getFirestore`/`addDoc` usage; gstatic CDN version 12.19.0.
- [Firestore Usage and limits / quotas](https://firebase.google.com/docs/firestore/quotas) (fetched) — Spark quotas: 1 GiB stored, **50,000 reads/day, 20,000 writes/day, 20,000 deletes/day**, 10 GiB outbound/month; 40,000 = max index entries per document (NOT a write quota).
- [Firebase API keys](https://firebase.google.com/docs/projects/api-keys) (fetched) — keys restricted to Firebase services are public-by-design, safe in code; Security Rules + App Check do authorization.
- [EmailJS SDK: init](https://www.emailjs.com/docs/sdk/init/) / [send](https://www.emailjs.com/docs/sdk/send/) / [options](https://www.emailjs.com/docs/sdk/options/) (fetched) — `emailjs.init` options, `emailjs.send` signature + promise result `{status, text}` + 1 req/s rate limit, option semantics (451/403/429).
- [EmailJS FAQ: expose public key](https://www.emailjs.com/docs/faq/is-it-okay-to-expose-my-public-key/) and [FAQ: domain allowlist](https://www.emailjs.com/docs/faq/can-i-add-my-domain-to-allowlist/) (fetched) — key exposure bounded; allowlist dashboard location + syntax.
- npm registry via `npm view` — `firebase@12.19.0`, `@emailjs/browser@4.4.1` [VERIFIED: npm registry].
- gsd-tools `query package-legitimacy check` — verdicts for `firebase` (SUS/too-new) and `@emailjs/browser` (OK).
- In-repo source of truth (opened this session): `index.html:469-500` (form markup), `index.js:120-183` (submit handler + helpers), `01-CONTEXT.md` (D-01..D-25 verbatim), `REQUIREMENTS.md` (CONT-01..06 verbatim).

### Secondary (MEDIUM confidence)

- [MDN: DOMContentLoaded event](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event) + [web.dev: script loading](https://web.dev/articles/speed-script-loading) — module/classic/defer execution ordering; listener registration order (DOM3).
- Honeypot guides (cross-checked, mutually consistent): [sendform.net](https://sendform.net/en/blog/what-is-a-honeypot-field), [formplume.com](https://formplume.com/blog/what-is-a-honeypot-field), [straycode.dev](https://straycode.dev/blog/honeypot-fields-a-practical-guide-to-stopping-form-spam), [formshield.dev](https://formshield.dev/blog/form-honeypot-implementation-guide), [splitforms.com](https://splitforms.com/blog/what-is-a-honeypot-field) — best-practice attribute set, hiding techniques, silent-rejection rationale.

### Tertiary (LOW confidence)

- Firebase docs "Solutions: Firestore Lite Web SDK" — referenced by the section nav but not deep-fetched; Lite capability claim cross-backed by STACK.md (prior in-repo research). Tagged [ASSUMED]-adjacent; re-verify CDN file names at apply time (OQ/A2).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions triple-verified (npm registry + official docs CDN + prior STACK.md); package legitimacy audited.
- Architecture: HIGH — dual-leg design, rules allow-list, and status semantics all trace to locked decisions D-01..D-25 + official docs; module/classic ordering verified against MDN/web.dev.
- Pitfalls: HIGH for rules/EmailJS/DOM-order pitfalls (official-doc backed); MEDIUM for the `serverTimestamp`→rules interaction (A1, marked for apply-time verification).

**Research date:** 2026-09-18
**Valid until:** 2026-10-18 (Firebase/EmailJS SDKs move on monthly cadences; CDN version pins and rules syntax are the volatile pieces — re-check pins at apply time per SUMMARY.md flag (c)).