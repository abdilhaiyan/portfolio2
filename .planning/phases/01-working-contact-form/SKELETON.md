# Walking Skeleton — Abdil Haiyan Hilmi Portfolio

**Phase:** 1
**Generated:** 2026-09-18

## Capability Proven End-to-End

A visitor on any device submits the contact form and the message is durably stored as a server-timestamped document in the Firestore `messages` collection (create-only rules, zero read surface), with an EmailJS email alert to Abdil — while the visitor receives honest sending/success/error status feedback and a prefilled mailto/WhatsApp fallback on full failure.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | None — vanilla HTML/CSS/JS, zero build step | PROJECT.md constraint: raw static files keep GitHub Pages deployment trivial; no bundler/transpiler |
| Data layer | Firestore Lite 12.19.0 via gstatic ESM CDN; create-only rules (`hasOnly` + type/length, `allow read, update, delete: if false`) | $0 Spark plan; write-only public intake; rules ARE the server-side enforcement direct API callers cannot bypass (D-12/D-13) |
| Email alert | EmailJS 4.4.1 UMD free tier (`emailjs.init` + `emailjs.send`) | No backend allowed ($0 budget); template rendering and Gmail/Outlook delivery handled server-side by EmailJS (D-15/D-17) |
| Spam protection | Layered: honeypot silent abort + EmailJS `blockHeadless`/`blockList`/`limitRate` + rules field allow-list | Each control independent and free; reCAPTCHA/Cloudflare Turnstile explicitly rejected in REQUIREMENTS (CONT-05) |
| Status UX | Success gated on Firestore resolution only; error+fallback on full failure; "Sending..." + disabled button in flight | D-01..D-05 honesty contract — Firestore is primary delivery, EmailJS rejection is silent on partial failure (D-03) |
| Config / credentials | Placeholder consts in `contact-form.js` + beginner walkthrough in `SETUP.md` | D-14/D-22..D-25; both keys are public-by-design so setup is copy-paste only (A3/OQ-1 allowlist optional) |
| Deployment target | GitHub Pages (Phase 4) | PROJECT.md target; subpath asset handling, `.nojekyll`, and post-deploy smoke land there (DEPL-01/DEPL-02) |

## Stack Touched in Phase 1

- [x] Project scaffold — unchanged on purpose (zero-build constraint; no new npm deps, no lockfile change; new runtime deps are CDN script tags only)
- [ ] Routing — N/A: single page; existing section anchors unchanged
- [x] Database — one real WRITE (`addDoc` + `serverTimestamp`) with create-only rules; reads are intentionally zero (rules deny)
- [x] UI — submit handler wired to Firestore + EmailJS; sending/success/error states; honeypot field; fallback links rendered in `#form-status`
- [ ] Deployment — local full-stack run documented (`npm run dev` + SETUP.md); live GitHub Pages deploy deferred to Phase 4
- [x] Email alert — EmailJS leg wired with graceful skip on placeholder keys (D-16)

## Out of Scope (Deferred to Later Slices)

- Reads/listeners/admin view of `messages` — rules deny reads by design (PII protection)
- reCAPTCHA / App Check / any auth — rejected in REQUIREMENTS; honeypot + rules are the gate
- Backend / Cloud Functions / server-side forwarding — violates $0 no-backend constraint
- GitHub Pages deployment, subpath asset fixups, `.nojekyll`, 404 page — Phase 4 (DEPL-01)
- Mobile-first layout, fluid typography, tap targets — Phase 2 (MOBL-01..04)
- Image compression, content rewrites, a11y, SEO/share card — Phase 3 (PERF/CONTENT/A11Y/SEO)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering the architectural decisions:

- Phase 2: Mobile-first responsive layout (independent — may run parallel to Phase 1)
- Phase 3: Performance, content & accessibility polish (depends on Phase 2)
- Phase 4: Deployment & security gate — live GitHub Pages URL, security review gate (rules re-check, PII purge from history), post-deploy form smoke test