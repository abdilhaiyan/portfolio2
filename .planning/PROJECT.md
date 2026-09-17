# Abdil Haiyan Hilmi — Portfolio

## What This Is

A personal, single-page portfolio site for Abdil Haiyan Hilmi, a professional Accountant & Financial Manager in Seremban, Malaysia. It presents his experience, skills, education, awards, and community involvement to hiring managers and potential service clients. The site is a static HTML/CSS/JS page (no build step) that is being polished for mobile, given a working contact form, and prepared for deployment on GitHub Pages.

## Core Value

A recruiter or client on a phone must be able to browse the portfolio without layout breakage and reach Abdil through a contact form that actually delivers the message.

## Business Context

- **Customer**: Hiring managers (accounting/finance roles) and potential service clients in Malaysia
- **Revenue model**: Indirect — portfolio drives employment and service opportunities, not direct monetization
- **Success metric**: Inbound contact-form messages that reach Abdil's inbox
- **Strategy notes**: None — personal project

## Requirements

### Validated

<!-- Shipped and confirmed valuable — inferred from existing codebase (see .planning/codebase/) -->

- ✓ Static single-page portfolio with 7 anchored sections (`#hero`, `#about`, `#work`, `#skills`, `#edu-honors`, `#committee`, `#contact`) — existing
- ✓ Dark/light theme toggle with `localStorage` persistence — existing
- ✓ Mobile hamburger menu with slide-in nav panel — existing
- ✓ Skill bars with animated fill + category filtering — existing
- ✓ Scrollspy nav highlighting — existing
- ✓ Client-side contact form validation (name/email/subject/message) — existing
- ✓ Glassmorphism design system via CSS custom properties — existing
- ✓ Local dev server via `http-server` (`npm run dev`) — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Mobile-responsive layout overhaul — fix overflow/breakage on phone browsers across all sections (hero, timeline, skills, education, contact, form)
- [ ] Working contact form backed by Firebase Firestore (free Spark plan) with EmailJS email alert (free tier) — no backend, no billing account
- [ ] Step-by-step Firebase + EmailJS setup guide so Abdil can create the project and paste his own config keys
- [ ] Performance polish: optimize heavy images (~1.9 MB/page → target <500 KB), pin Lucide CDN version, remove expired LinkedIn fallback URLs
- [ ] Accessibility + SEO polish: aria states on toggles, reduced-motion support, meta/OG tags, favicon
- [ ] Proposed impact-focused rewrites of experience bullets (numbers/outcomes) — each approved by Abdil before applying
- [ ] GitHub Pages deploy-ready (no remote configured yet; setup at ship time)

### Out of Scope

- New sections (services, testimonials, blog, bilingual toggle, analytics) — Abdil chose "Polish only"
- Backend servers or Firebase Cloud Functions — requires billing account; EmailJS chosen instead
- Custom domain — not requested
- Content additions beyond approved bullet rewrites — copy otherwise stays as-is

## Context

- **Codebase state**: Vanilla HTML/CSS/JS, no build step, no tests, no CI, no lockfile. Single `index.js` IIFE (183 lines) wired to a DOM id/class contract documented in `.planning/codebase/ARCHITECTURE.md`. All styling in one `index.css` (1225 lines) with dark-default design tokens and `[data-theme="light"]` overrides.
- **Known issues** (from `.planning/codebase/CONCERNS.md`): contact form is simulated (shows success, sends nothing); unthrottled scroll listener with forced layout reads; unpinned `lucide@latest` CDN; 1.3 MB `profile.jpg` + 346 KB `LOGO3.png`; expired LinkedIn fallback URLs (`e=1731542400`); accessibility gaps (no `aria-pressed`/`aria-expanded`, icon-only links without labels, no `prefers-reduced-motion`); unguarded `getElementById` lookups.
- **Mobile pain point**: Desktop layout is fine; phone layout breaks/overflows. Grids (hero, timeline, skills, edu, contact, form) need proper stacking, fluid typography, and tap-target sizing.
- **Git**: Dedicated repo initialized at `portfolio2-main` (was nested inside the home-directory repo). Baseline commit `cd173d7`, codebase map commit `3c2cfa6`. No remote yet.
- **Contact form architecture decision**: Client writes to Firestore collection `messages` (create-only security rules, no reads) AND triggers EmailJS to email Abdil. Both free tiers; no backend. Firebase config + EmailJS public keys are designed to be public in client code.

## Constraints

- **Tech stack**: Vanilla HTML/CSS/JS only — no build step, no framework, no bundler (keeps GitHub Pages deployment trivial)
- **Budget**: $0 — Firebase Spark plan + EmailJS free tier only; no billing account
- **Compatibility**: Must work on modern mobile browsers (iOS Safari, Android Chrome) and desktop
- **Security**: Firestore rules must allow public create-only writes to `messages`; no server-side secrets in client code (Firebase web config and EmailJS public key are public by design)
- **Performance**: Reduce total page weight from ~1.9 MB toward <500 KB (images)
- **Content**: Copy stays as-is except approved impact rewrites

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Initialize dedicated git repo inside `portfolio2-main` | Was nested in home-dir repo; GSD commits must stay scoped to this project | ✓ Good |
| Contact form = Firestore + EmailJS (client-side) | Free tiers, no backend, no billing account; satisfies "Firestore + email alert" | — Pending |
| Deploy target = GitHub Pages | Free, fits static site, Abdil already has a GitHub account | — Pending |
| Scope = "Polish only" | Abdil wants existing sections perfected, not new ones | — Pending |
| Impact rewrites proposed for approval | Improves hireability without changing structure | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-17 after initialization*