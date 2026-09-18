# Phase 1: Working Contact Form - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-18
**Phase:** 1-Working Contact Form
**Areas discussed:** Status UX & Partial Failure, Fallback Mechanism, Firestore Schema & Rules, EmailJS Setup Contract, Module Split & Code Style, Setup Guide Deliverable

---

## Status UX & Partial Failure

| Option | Description | Selected |
|--------|-------------|----------|
| Keep existing copy | "Thank you! Your message has been sent successfully. I will get back to you shortly." — matches current site voice, zero copy churn | ✓ |
| Refine copy | e.g. "Your message has been received. I'll get back to you shortly." — avoids implying an email was sent to Abdil | |
| You decide | Agent picks the wording, keeping the current tone | |

**User's choice:** Keep existing copy

| Option | Description | Selected |
|--------|-------------|----------|
| Sending + disable btn | Show "Sending..." in #form-status, disable the submit button until both legs resolve — prevents double-submits and is honest about in-flight work | ✓ |
| No in-flight state | No in-flight feedback; button stays clickable (current behavior) | |
| You decide | Agent picks the cleanest approach | |

**User's choice:** Sending + disable btn

| Option | Description | Selected |
|--------|-------------|----------|
| Show success | Message IS stored in Firestore (primary delivery) — success is truthful; Abdil sees it in the console even without the email alert | ✓ |
| Success + subtle note | "Message received, but the email notification failed" — fully transparent, slightly more confusing | |
| Error + fallback | Treat any leg failure as failure — but this tells the user their message was lost when it wasn't | |

**User's choice:** Show success (partial failure = Firestore ok, EmailJS fail → success)

| Option | Description | Selected |
|--------|-------------|----------|
| Error + fallback links | Show error copy + clickable mailto/WhatsApp fallback links so the lead isn't lost (CONT-04) | ✓ |
| Error only | Show error copy only; user can find contact details in the left panel | |
| You decide | Agent picks, keeping CONT-04 satisfied | |

**User's choice:** Error + fallback links

| Option | Description | Selected |
|--------|-------------|----------|
| Success hides, error persists | Success auto-hides after ~5s (current behavior); error states persist until the next submit so the fallback links stay visible | ✓ |
| Both auto-hide | Both success and error auto-hide after 5s (current behavior for both) | |
| Both persist | Both persist until the next submit attempt | |

**User's choice:** Success hides, error persists

**Notes:** The partial-failure decision (D-03) deliberately overrides research ARCHITECTURE.md Pattern 1 ("success only when both legs fulfill") — Firestore is the primary delivery, EmailJS is only the alert.

---

## Fallback Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Clickable links | Show clickable mailto + WhatsApp links in the error alert — user chooses; no surprise navigation | ✓ |
| Auto-open mailto | Automatically open the user's mail client with subject/body prefilled from their form input | |
| Both | Auto-open mailto AND show WhatsApp link as alternative | |

**User's choice:** Clickable links

| Option | Description | Selected |
|--------|-------------|----------|
| Prefill from form | Prefill mailto subject/body from the form fields so the lead survives the failure | ✓ |
| No prefill | Plain mailto: link with no prefill — user retypes everything | |
| You decide | Agent decides based on implementation simplicity | |

**User's choice:** Prefill from form

| Option | Description | Selected |
|--------|-------------|----------|
| Any failure | Firestore reject, EmailJS reject, network error, or timeout — any leg failing triggers the fallback | ✓ |
| Only both fail | Only when BOTH legs fail (partial failure already shows success per Area 1) | |
| You decide | Agent defines the exact failure set | |

**User's choice:** Any failure

| Option | Description | Selected |
|--------|-------------|----------|
| Inside #form-status | Fallback links render inside #form-status (the existing alert element) — no new DOM needed | ✓ |
| Separate element | A separate fallback element below the form, always visible on error | |
| You decide | Agent picks the cleanest DOM approach | |

**User's choice:** Inside #form-status

**Notes:** Fallback reuses existing targets — `mailto:abdilhaiyanhilmi@gmail.com` (index.html:446) and `https://wa.link/kx5upx` (index.html:457).

---

## Firestore Schema & Rules

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal 4 + timestamp | name, email, subject, message, createdAt (serverTimestamp) — matches the four form fields exactly, nothing extra | ✓ |
| + honeypot flag | Minimal fields + a honeypot flag field so tripped bots are visible in the console | |
| + metadata | Minimal fields + metadata (userAgent, page URL, etc.) for lead enrichment | |

**User's choice:** Minimal 4 + timestamp

| Option | Description | Selected |
|--------|-------------|----------|
| Reject in rules | Rules reject any doc containing a honeypot field — bots never land in the console | ✓ |
| Store as field | Client sends the honeypot value as a field; rules allow it; Abdil can spot bots in the console | |
| Client-side only | Honeypot is client-side only (silently skip submit); rules don't reference it | |

**User's choice:** Reject in rules (client never sends it; if tripped, silently abort)

| Option | Description | Selected |
|--------|-------------|----------|
| Strict validation | allow create: if hasOnly([...]) + type checks + string length limits — defense-in-depth, still simple | ✓ |
| Minimal create-only | allow create: if true — anyone can write anything to messages (simplest, weakest) | |
| You decide | Agent writes rules balancing security and simplicity | |

**User's choice:** Strict validation

| Option | Description | Selected |
|--------|-------------|----------|
| Type + length | Type + length checks only in rules; regex validation stays client-side (simpler rules, still safe) | ✓ |
| Regex in rules | Also enforce email regex via string.matches in rules — full defense-in-depth | |
| No email rule | No email-specific rule beyond the general field checks | |

**User's choice:** Type + length (deviates from research STACK.md's `email.matches(...)`)

**Notes:** Strict rules use `hasOnly` which also enforces the honeypot rejection (any unexpected field, including honeypot, fails the write).

---

## EmailJS Setup Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder consts | Three placeholder consts at the top of contact-form.js (PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID) — setup guide tells Abdil to paste his values | ✓ |
| Config object | A single CONFIG object at the top of contact-form.js holding all three keys | |
| Separate config file | Keys live in a separate config.js loaded before contact-form.js (no build step, still vanilla) | |

**User's choice:** Placeholder consts

| Option | Description | Selected |
|--------|-------------|----------|
| All 4 fields | Template shows name, email, subject, message — the four form fields, so Abdil sees the full lead | ✓ |
| Subject + message | Template shows subject + message only — lighter email | |
| You decide | Agent defines template variables matching the Firestore schema | |

**User's choice:** All 4 fields

| Option | Description | Selected |
|--------|-------------|----------|
| Graceful skip | If keys are still placeholders, skip the EmailJS leg — Firestore still stores the message, success still shows | ✓ |
| Hard fail | Show an error if EmailJS isn't configured — forces setup before the form works | |
| You decide | Agent picks the safest behavior | |

**User's choice:** Graceful skip

| Option | Description | Selected |
|--------|-------------|----------|
| Standard params | Pass from_name, reply_to (user's email), subject, message — template can reply directly to the lead | ✓ |
| Minimal params | Pass only subject + message — minimal template surface | |
| You decide | Agent defines the param set matching the template | |

**User's choice:** Standard params

**Notes:** Graceful skip requires the code to detect placeholder values (e.g., consts still equal to the placeholder sentinel).

---

## Module Split & Code Style

| Option | Description | Selected |
|--------|-------------|----------|
| Full form block moves | contact-form.js owns validation + submission + status/fallback rendering; index.js keeps theme/menu/skills/scrollspy — clean separation, no shared state | ✓ |
| Split validation/submit | Validation stays in index.js; contact-form.js only handles the async submission — but the two files share isValid/formStatus state | |
| You decide | Agent decides the cleanest split | |

**User's choice:** Full form block moves

| Option | Description | Selected |
|--------|-------------|----------|
| Own listener | contact-form.js has its own DOMContentLoaded listener (self-contained, mirrors index.js pattern); loaded before index.js in index.html | ✓ |
| Called by index.js | contact-form.js defines functions only; index.js calls them inside its existing DOMContentLoaded (tighter coupling) | |
| You decide | Agent picks the pattern matching conventions | |

**User's choice:** Own listener

| Option | Description | Selected |
|--------|-------------|----------|
| Promise chains | Use .then/.catch promise chains — matches the "no async/await" convention exactly | ✓ |
| async/await | Use async/await — modern and readable, but breaks the documented convention | |
| You decide | Agent picks, noting the convention tradeoff | |

**User's choice:** Promise chains

| Option | Description | Selected |
|--------|-------------|----------|
| createElement | Build anchors with document.createElement + appendChild — no innerHTML, closest to the innerText-only convention | ✓ |
| innerHTML | Use innerHTML with a template string for the error alert — simpler, but introduces innerHTML to the codebase | |
| You decide | Agent picks the approach that best fits conventions | |

**User's choice:** createElement

**Notes:** `showError` and `validateEmail` helpers (index.js:175-182) move to contact-form.js with the form block. Research STACK.md shows `<script type="module" src="contact-form.js">` — planner reconciles module deferral with the self-contained bootstrap intent.

---

## Setup Guide Deliverable

| Option | Description | Selected |
|--------|-------------|----------|
| SETUP.md at root | Dedicated SETUP.md at repo root — discoverable, doesn't bloat README, easy to link from README | ✓ |
| README section | A "Setup" section inside the existing README.md — one file to maintain | |
| docs/SETUP.md | docs/SETUP.md — separates docs from root, slightly less discoverable | |

**User's choice:** SETUP.md at root

| Option | Description | Selected |
|--------|-------------|----------|
| Beginner-friendly | Step-by-step, plain language, no jargon — Abdil is an accountant, not a developer | ✓ |
| Technical | Concise technical steps — assumes comfort with dashboards and config | |
| You decide | Agent writes it clearly for a non-developer | |

**User's choice:** Beginner-friendly

| Option | Description | Selected |
|--------|-------------|----------|
| Full setup | Full walkthrough: Firebase project → Firestore rules paste → EmailJS account → service/template creation → paste keys into contact-form.js | ✓ |
| EmailJS only | Only the EmailJS part (assumes Firebase is already set up) | |
| You decide | Agent covers whatever is needed end-to-end | |

**User's choice:** Full setup

| Option | Description | Selected |
|--------|-------------|----------|
| Include test steps | Include a "Test it" section: submit a test message, check Firestore console + inbox | ✓ |
| No test steps | No verification section — guide ends after key paste | |
| You decide | Agent includes a minimal verification step | |

**User's choice:** Include test steps

**Notes:** Guide must call out the Firestore test-mode rules expiry (30 days) per research STACK.md — publish create-only rules the moment the collection is created.

---

## Agent's Discretion

- Honeypot field name and exact placement in the form (hidden input, `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`)
- Exact "Sending..." copy and the timeout value for network-failure detection
- EmailJS failure handling on the partial-failure path (no `console.*` per conventions — silent; only full-failure renders fallback)
- Exact length limits in rules (use STACK.md defaults: name ≤120, subject ≤200, message ≤5000)

## Deferred Ideas

None — discussion stayed within phase scope.