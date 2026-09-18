# Roadmap: Abdil Haiyan Hilmi — Portfolio

## Overview

A polish-only milestone on an existing static single-page portfolio. Two dominant fixes drive the work: the contact form is currently simulated (every lead silently dropped) and the layout is desktop-first and breaks on phones — the primary audience. The roadmap fixes the conversion path first (Firestore + EmailJS contact form), then makes the layout mobile-first, then polishes performance/content/accessibility/SEO on top of the new layout, and finally ships to GitHub Pages behind a security review gate that purges PII from git history before the repo goes public. Research confirmed the no-backend, $0-budget architecture (Firestore Lite + EmailJS, both free tiers).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Working Contact Form** - Firestore + EmailJS submit chain with honest status states, spam protection, and a setup guide
- [ ] **Phase 2: Mobile-First Responsive Layout** - No overflow on 320-375px phones, fluid typography, tap-target sizing
- [ ] **Phase 3: Performance, Content & Accessibility Polish** - Fast load, credible content, a11y, and share-preview hygiene
- [ ] **Phase 4: Deployment & Security Gate** - GitHub Pages live with verified rules, clean history, and a post-deploy smoke test

## Phase Details

### Phase 1: Working Contact Form
**Goal**: Visitors can submit the contact form and their message actually reaches Abdil — a durable Firestore record plus an EmailJS email alert — with honest status feedback and spam protection.
**Mode:** mvp
**Depends on**: Nothing (first phase; independent of Phase 2 — can run in parallel)
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06
**Success Criteria** (what must be TRUE):
  1. Visitor submits the form and the message appears in the Firestore `messages` collection (Abdil can see it in the Firebase console with a server timestamp)
  2. Visitor receives honest sending/success/error feedback, with success shown only after the Firestore write resolves
  3. Abdil receives an email alert for every submitted message via EmailJS
  4. When Firestore or EmailJS fails, the visitor is offered a working mailto/WhatsApp fallback
  5. Abdil can follow the setup guide to create the Firebase project and paste his own config keys; after setup, a test submission verifies the full chain end-to-end and spam protections (honeypot, rate limits, field validation) reject automated submissions
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — implementation: contact-form.js dual-leg delivery (Firestore write + EmailJS alert), page wiring (honeypot, D-19 script order, index.js shrink, .hp-field), SETUP.md guide
- [ ] 01-02-PLAN.md — verification: regression + served-page smoke, human walkthrough of submit flow and post-setup live delivery
**UI hint**: yes

### Phase 2: Mobile-First Responsive Layout
**Goal**: The portfolio is fully usable on phone browsers (320-375px) with no horizontal overflow or layout breakage across any section.
**Mode:** mvp
**Depends on**: Nothing (independent of Phase 1 — can run in parallel)
**Requirements**: MOBL-01, MOBL-02, MOBL-03, MOBL-04
**Success Criteria** (what must be TRUE):
  1. Page shows no horizontal overflow on 320-375px phone browsers across hero, timeline, skills, education, committee, contact, and form sections
  2. Layout reflows via mobile-first `min-width` breakpoints with fluid `clamp()` typography (no desktop `max-width` cascade)
  3. All interactive elements have ≥44px tap targets on touch devices
  4. Mobile menu, theme toggle, and form controls work correctly on iOS Safari and Android Chrome
**Plans**: TBD
**UI hint**: yes

### Phase 3: Performance, Content & Accessibility Polish
**Goal**: The site loads fast (<500 KB), presents current and credible credentials, is accessible to all users, and produces a proper share card.
**Mode:** mvp
**Depends on**: Phase 2 (polish lands on the final mobile-first layout)
**Requirements**: PERF-01, PERF-02, PERF-03, CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, SEO-01, A11Y-01, A11Y-02, A11Y-03, A11Y-04
**Success Criteria** (what must be TRUE):
  1. Total page weight is <500 KB (profile image re-encoded to WebP/AVIF <100 KB), the Lucide CDN version is pinned (no `@latest` drift), and expired LinkedIn fallback URLs are gone (no dead 403 links)
  2. Experience bullets read impact-focused (task + method + measurable result) with every number user-confirmed; the resume PDF is current with verified dates
  3. Skills section states literal software names (AutoCount/ABSS/MYOB) and credential vocabulary (MIA/MICPA/ACCA/CIMA) accurately — skills visible as text, not just gauge shapes
  4. Meta title and description are genuine value sentences; OG tags are present (`og:title`, `og:description`, `og:image` reusing the compressed image, `og:url` against the final GitHub Pages URL) so sharing produces a proper card
  5. Motion-sensitive users see reduced animation (`prefers-reduced-motion`), every interactive element shows a visible focus ring, form status is announced via `aria-live`, toggle buttons expose correct `aria-pressed`/`aria-expanded` states, and icon-only links have accessible labels
**Plans**: TBD
**UI hint**: yes

### Phase 4: Deployment & Security Gate
**Goal**: The site is live on GitHub Pages with a verified security posture, a clean public history, and a proven end-to-end form on the live URL.
**Mode:** mvp
**Depends on**: Phase 3 (ship step — runs after all code and content changes)
**Requirements**: DEPL-01, DEPL-02
**Success Criteria** (what must be TRUE):
  1. The site is reachable at the final GitHub Pages URL over HTTPS; all assets load under the `/repo-name/` subpath (no broken relative paths), `.nojekyll` is present, and the custom `404.html` works
  2. The security review gate passed before the first public push: Firestore rules re-checked in the console (create-only, no reads), grep gate confirms no secrets in client files, and PII (resume PDF, large photo) purged from git history via `git filter-repo` — verified with a fresh clone
  3. Post-deploy smoke test: a fresh browser session on the live URL shows no console errors and a test form submission lands in Firestore and triggers the EmailJS alert
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 (Phases 1 and 2 are independent and may run in parallel).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Working Contact Form | 0/2 | Not started | - |
| 2. Mobile-First Responsive Layout | 0/0 | Not started | - |
| 3. Performance, Content & Accessibility Polish | 0/0 | Not started | - |
| 4. Deployment & Security Gate | 0/0 | Not started | - |