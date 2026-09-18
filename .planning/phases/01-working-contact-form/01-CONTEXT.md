# Phase 1: Working Contact Form - Context

**Gathered:** 2026-09-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the simulated contact form submission (currently `index.js:162-171` shows fake success and silently drops every lead) with a real dual-leg submit chain: a durable Firestore `messages` record (create-only rules, `serverTimestamp`, no client reads) plus an EmailJS email alert to Abdil — with honest sending/success/error status feedback, a mailto/WhatsApp fallback on failure, spam protection (honeypot + EmailJS anti-abuse + Firestore field validation), and a beginner-friendly setup guide (`SETUP.md`) so Abdil can create the Firebase project and paste his own config keys.

Requirements: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06. Mode: mvp. Depends on nothing (independent of Phase 2).

</domain>

<decisions>
## Implementation Decisions

### Status UX & Partial Failure
- **D-01:** Success copy stays exactly as-is: "Thank you! Your message has been sent successfully. I will get back to you shortly." (matches current site voice, zero copy churn).
- **D-02:** In-flight "Sending..." state shown in `#form-status`; the submit button is disabled until both legs resolve — prevents double-submits and is honest about in-flight work.
- **D-03:** Partial failure (Firestore write succeeds, EmailJS alert fails) → **show success**. Firestore is the primary delivery; the message IS stored and Abdil sees it in the console even without the email alert. **This OVERRIDES research ARCHITECTURE.md Pattern 1** ("success only when both legs fulfill") — the planner must NOT implement the both-legs-required success gate. — **Reversibility:** reversible — success semantics are local to `contact-form.js`; no migration or contract impact.
- **D-04:** Full failure (Firestore write fails, or network error) → error state + fallback links (see Fallback section).
- **D-05:** Success auto-hides after ~5s (current behavior preserved); **error states persist** until the next submit so the fallback links stay visible.

### Fallback Mechanism
- **D-06:** Fallback = clickable mailto + WhatsApp links. Reuse the existing targets: `mailto:abdilhaiyanhilmi@gmail.com` (index.html:446) and `https://wa.link/kx5upx` (index.html:457). No auto-open navigation.
- **D-07:** The mailto link is prefilled with the user's typed subject and message (URL-encoded) so the lead survives the failure.
- **D-08:** Any failure triggers the fallback: Firestore reject, EmailJS reject, network error, or timeout.
- **D-09:** Fallback links render inside `#form-status` (the existing alert element) — no new DOM structure.

### Firestore Schema & Rules
- **D-10:** Document schema is minimal: `name`, `email`, `subject`, `message`, `createdAt` (serverTimestamp). No extra fields, no metadata, no honeypot field stored.
- **D-11:** Honeypot: the client NEVER sends the honeypot field. If the honeypot is tripped client-side, silently abort (no write, no alert, no status change). Rules reject any doc containing a honeypot field (enforced via `hasOnly` — see D-12).
- **D-12:** Rules are strict: `allow create` gated by `request.resource.data.keys().hasOnly(['name','email','subject','message','createdAt'])` + type checks + string length limits (name ≤120, subject ≤200, message ≤5000 — per research STACK.md). `allow read, update, delete: if false`. — **Reversibility:** reversible — rules are console-edited; no migration needed since no client reads `messages`.
- **D-13:** Email rule: **type + length checks only** in rules; the email regex stays client-side. (Deviates from research STACK.md's `email.matches(...)` — remove the regex from the rules.)

### EmailJS Setup Contract
- **D-14:** Keys are placeholder consts at the top of `contact-form.js`: `EMAILJS_PUBLIC_KEY`, `SERVICE_ID`, `TEMPLATE_ID` (plus the `firebaseConfig` object for Firestore). The setup guide tells Abdil to paste his real values.
- **D-15:** The EmailJS email template shows all 4 fields: name, email, subject, message — Abdil sees the full lead.
- **D-16:** Graceful skip: if the keys are still placeholders (unconfigured), skip the EmailJS leg — Firestore still stores the message and success still shows. The form must not hard-fail on placeholder keys.
- **D-17:** EmailJS send call passes standard params: `from_name`, `reply_to` (user's email), `subject`, `message` — so the template can reply directly to the lead.

### Module Split & Code Style
- **D-18:** The full form block moves to `contact-form.js`: validation + submission + status/fallback rendering. `index.js` keeps theme/menu/skills/scrollspy. The `showError` and `validateEmail` helpers (index.js:175-182) move with it. No shared state between the two files.
- **D-19:** `contact-form.js` bootstraps itself with its own `DOMContentLoaded` listener (mirrors the index.js pattern); loaded before `index.js` in `index.html`. (Research STACK.md shows `<script type="module" src="contact-form.js">` — the planner reconciles module deferral semantics with the self-contained bootstrap intent.)
- **D-20:** Async Firestore/EmailJS calls use **promise chains** (`.then/.catch`), NOT `async/await` — matches the documented "no async/await" convention.
- **D-21:** Fallback links are built with `document.createElement` + `appendChild` — no `innerHTML` (closest to the `innerText`-only convention).

### Setup Guide
- **D-22:** `SETUP.md` at repo root (discoverable, doesn't bloat README).
- **D-23:** Beginner-friendly tone — Abdil is an accountant, not a developer. Plain language, no jargon.
- **D-24:** Full walkthrough: Firebase project → Firestore rules paste → EmailJS account → service/template creation → paste keys into `contact-form.js`.
- **D-25:** Includes a "Test it" verification section: submit a test message, check the Firestore console + inbox.

### Agent's Discretion
- Honeypot field name and exact placement in the form (e.g., hidden input, `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`).
- Exact "Sending..." copy and the timeout value for network-failure detection.
- EmailJS failure handling on the partial-failure path: per conventions there is no `console.*` — the EmailJS rejection is silent (success still shows per D-03); only the full-failure path renders the fallback.
- Exact length limits in rules (use STACK.md defaults: name ≤120, subject ≤200, message ≤5000).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — CONT-01..CONT-06 (locked requirements for this phase; traceability table)
- `.planning/ROADMAP.md` §Phase 1 — goal, success criteria (5 items), mode (mvp), dependency (none)

### Research (MUST read before planning)
- `.planning/research/STACK.md` — CDN install pattern (Firestore Lite 12.19.0 gstatic ESM + EmailJS 4.4.1 jsDelivr UMD), base Firestore rules (adapt per D-12/D-13), EmailJS `init` options (`blockHeadless`, `blockList`, `limitRate`), key-handling guidance, API-key referrer restriction
- `.planning/research/ARCHITECTURE.md` — dual-leg design, component boundaries, data flow (NOTE: D-03 overrides Pattern 1's "both legs fulfill" success semantics)
- `.planning/research/SUMMARY.md` — research flags for Phase 1: (a) EmailJS origin-whitelist is paid-tier per docs, (b) Firestore Spark daily-write quota discrepancy (40K vs 20K/day — pin official number), (c) re-verify exact CDN import paths + EmailJS template parameter names at apply time
- `.planning/research/PITFALLS.md` — Pitfalls 1, 3, 4, 7 (open rules, fake success, key hiding, private-key leak)

### Codebase Maps
- `.planning/codebase/CONCERNS.md` — current fake-success bug (index.js:162-171), no tests/CI/linting
- `.planning/codebase/INTEGRATIONS.md` — existing CDN integrations (Lucide unpkg, Google Fonts)

### Live Code (DOM contract)
- `index.html` — form markup (lines 469-500), `#form-status` (line 495), contact panel links (mailto line 446, WhatsApp line 457), script tags (line 522)
- `index.js` — current submit handler (lines 120-173), `showError`/`validateEmail` helpers (lines 175-182)

### Conventions
- `AGENTS.md` — project conventions (naming, code style, error handling, comments, module design) — MUST be followed by the planner and executor

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `#form-status` element (index.html:495) — existing status alert; reuse for sending/success/error states
- `.form-status-alert` + `.success` CSS classes (index.css:1068-1073) — existing success styling
- `.form-error-msg` + `.has-error` pattern (index.css:1049-1055) — existing validation error styling
- `showError(groupId)` / `validateEmail(email)` helpers (index.js:175-182) — move to `contact-form.js`
- Existing mailto + WhatsApp links (index.html:446, 457) — reuse as fallback targets
- `validateEmail` regex (index.js:179-182) — keep client-side

### Established Patterns
- Single `DOMContentLoaded` IIFE closure (index.js:1-183) — `contact-form.js` mirrors with its own listener
- Boolean-flag validation (`isValid` running flag, index.js:140) — keep in `contact-form.js`
- CSS state classes (`.has-error`, `.success`) — reuse for status rendering
- No `async/await`, no `try/catch`, no `console.*` — promise chains for async
- `innerText` for text updates — `createElement` for fallback links (no `innerHTML`)
- Section banner comments `// --- Name ---` (JS), `/* X */` (CSS), `<!-- X -->` (HTML)

### Integration Points
- `index.html` script tags (line 522): add EmailJS UMD `<script>` + `contact-form.js` before `index.js`
- Form submit event: currently handled in `index.js` (lines 124-173) — moves to `contact-form.js`
- Firestore rules: published in Firebase Console (setup guide, console-only per research STACK.md)
- EmailJS dashboard: service + template creation (setup guide)

</code_context>

<specifics>
## Specific Ideas

No specific references beyond the decisions above — the user chose concrete options throughout the discussion. Fallback targets are the existing `mailto:abdilhaiyanhilmi@gmail.com` and `https://wa.link/kx5upx`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Working Contact Form*
*Context gathered: 2026-09-18*