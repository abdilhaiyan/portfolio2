# Research Summary: Portfolio2 — Abdi Capital Portfolio Milestone (Mobile + Contact Form + Pages)

**Domain:** Personal static portfolio (vanilla HTML/CSS/JS) for an Accountant & Financial Manager (Malaysia) — adding a working Firestore + EmailJS contact form, mobile-responsive overhaul, performance/accessibility polish, and GitHub Pages deployment.
**Researched:** 2026-09-18
**Overall confidence:** MEDIUM-HIGH (stack decisions HIGH — versions/CDNs verified live against official sources; feature/market claims MEDIUM — vendor/portal sources cross-checked; pitfalls MEDIUM-verified — web sources cross-checked against official docs, officially documented facts marked HIGH inline)

## Executive Summary

This is a **"polish-only" milestone** on an existing one-page static portfolio (hero, about, work, skills, edu-honors, committee, contact). The codebase audit identified two dominant defects that drive the whole research agenda: **(1) the contact form is simulated** — the submit handler shows fake success and silently drops every inquiry (the site's only conversion path), and **(2) the layout is desktop-first** (`max-width` media queries) and not reliably usable on phones — and recruiters, the primary audience, review candidates on mobile in ~7-second skims. Everything else in this milestone is polish around those two fixes.

Research confirms the planned architecture is correct and current: **a no-build vanilla site with two client-side services** — Firestore (via the modular **Firestore Lite** SDK, 12.19.0) as the durable `messages` record, and EmailJS (4.4.1) as the email alert to the owner. Both CDN builds were verified live (HTTP 200) on 2026-09-18; no billing account is needed (Firebase Spark + EmailJS free tier), which matches the project's $0 constraint. The rejected alternatives (Cloud Functions, Firebase Auth, form-forwarding services, a bundler) all violate that constraint or add complexity for zero benefit.

The dominant engineering theme is **robustness and abuse-resistance, not features**. The four things that will actually sink this milestone: wide-open Firestore rules shipping to production (visitor PII leak, DB wipe); a submit handler that reports success when only one of the two legs (Firestore/EmailJS) worked (silent lead loss — the exact current bug, reborn); free-tier quota burn by bots (EmailJS 200 req/month is minutes of script time; Firestore 20–40K writes/day is hours); and the repo going public with a resume PDF + 1.3 MB photo in git history (permanent PII exposure — the repo has **no remote yet**, so `git filter-repo` is still possible and must gate the first push). Mobile and performance work is formulaic and cheap by comparison: mobile-first `min-width` breakpoints, `clamp()` fluid type, `100dvh`/safe-area handling, ≥16px inputs, ≥44px tap targets, WebP profile image <100 KB, pinning the unpinned `lucide@latest`, and the well-documented GitHub Pages traps (`.nojekyll`, relative paths under `/repo-name/`, custom `404.html`, cache staleness).

Two content items are **user-approval gates, not code tasks**: the impact-quantified experience bullets (numbers must be real and user-confirmed — invented metrics in a credentials field invalidate the whole profile) and the resume refresh (stale PDF silently invalidates the site). The roadmap should schedule a short bullet-review session with the user, not just implementation tasks.

## Key Findings

**Stack:** Vanilla CSS (no framework) + Firestore Lite 12.19.0 (gstatic ESM) + EmailJS 4.4.1 (jsDelivr UMD) + GitHub Pages branch deploy — zero build step, zero billing (see STACK.md, HIGH).
**Architecture:** Frontend-only dual-leg submit — Firestore `addDoc` writes the durable record first, EmailJS `sendForm` fires the alert; success is shown only when **both** fulfill (see ARCHITECTURE.md, MEDIUM-HIGH). Firestore rules are create-only with field-level validation.
**Critical pitfall:** Open Firestore rules (`allow read, write: if true`) and fake-success submit handlers both create silent, credibility-destroying failures; PII in public git history is irreversible once pushed (see PITFALLS.md, MEDIUM verified).
**Feature priorities:** P1 = working form with honest states, mobile-first layout, image compression, quantified bullets; P2 = OG tags, EmailJS spam hardening, resume/meta; P3 = reduced-motion/focus/aria-live, fallback verification (see FEATURES.md, MEDIUM).

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Contact Form Phase** - The single highest-value fix (the form is the conversion mechanism and currently loses every lead); it also establishes the security posture for the whole repo from day one (create-only rules, key-handling rules, anti-abuse layers). Independent of all other code phases — can run first and in parallel with Mobile.
   - Addresses: working contact form + honest status states (P1 feature); setup guide with a verification gate
   - Avoids: open-rules PII leak, secrets-in-client, dual-write success lies, quota burn (Pitfalls 1, 3, 4, 5, 6, 7)

2. **Mobile Phase** - Recruiters review on phones; the current desktop-first CSS fails on the primary audience's device. Standard, well-understood CSS patterns (mobile-first `min-width` breakpoints, `clamp()`, `100dvh`/`svh`, `env(safe-area-inset-*)`, container queries as available) — low research risk. Do the 320/375/414px overflow pass and a real iOS device pass here.
   - Addresses: mobile-first responsive layout (P1 feature)
   - Avoids: horizontal overflow, missing viewport meta, 100vh layout bugs, iOS zoom, tap-target failures (Pitfalls 8–12)

3. **Perf/A11y Phase** - Biggest single perf win is re-encoding the 1.3 MB profile image to WebP <100 KB (no build step — a local tool swap). Also: pin `lucide@latest`, `preconnect` fonts, `defer` the CDN script, throttle the scrollspy, `prefers-reduced-motion`, focus rings, `aria-live` on the form status, meta description, OG tags (reuse the compressed image). Absorbs the user content gates (bullet rewrite session, resume refresh).
   - Addresses: fast load, a11y polish, SEO/share hygiene (P1/P2/P3 features)
   - Avoids: perf regressions and unpinned-dependency drift flagged in CONCERNS.md

4. **Deploy Phase** - GitHub Pages branch deploy at ship time (no Actions workflow). Relative-path audit for `/repo-name/` hosting, `.nojekyll`, custom `404.html`, Enforce HTTPS, post-deploy cache verification via `curl -I`.
   - Addresses: the deployment target itself (moves the milestone from local to live)
   - Avoids: subpath breakage, Jekyll file dropping, 404, stale-cache confusion (Pitfalls 13, 15, 16)

5. **Security Review Gate** (bundled inside Deploy Phase, before the first public push) - The repo is still private with no remote: this is the last moment `git filter-repo` can purge the resume PDF + 1.3 MB photo from history. Gate checklist: rules re-check in the console (not just the draft), grep gate for EmailJS private key / service-account tokens in client files, PII purge + fresh-clone verification, `.nojekyll`/HTTPS verification.
   - Avoids: irreversible PII exposure (Pitfall 14) and a shipped-draft ruleset

**Phase ordering rationale:**
- **Form before anything** because it fixes the conversion-destroying bug and its security groundwork (rules, key handling) protects the shared repo during all later phases.
- **Mobile before deploy** so the phone-first audience meets a working layout at launch; Form and Mobile are independent code phases → parallelizable.
- **Perf/A11y before deploy** so the site ships fast and the compressed image also feeds the OG card; it is the natural home for the user content gates.
- **Deploy last by definition** — it is the ship step; the Security Review Gate must precede the first push while the history is still private.

**Research flags for phases:**
- Phase 1 (Contact Form): Verify at apply time — (a) EmailJS origin-whitelist is a paid-tier feature per docs (MEDIUM confidence), (b) Firestore Spark daily-write quota discrepancy between STACK.md sources (40K/day) and PITFALLS.md (20K/day) — check firebase.google.com/docs/firestore/quotas, (c) exact modular CDN import paths and EmailJS template parameter names from current docs.
- Phase 2 (Mobile): Standard patterns — unlikely to need research; the only open item is real-device iOS/Safari QA (notebook + keyboard + notch behavior).
- Phase 3 (Perf/A11y): Needs a Lighthouse baseline before/after and a no-build image re-encode path (local CLI or online tool) — minor spike.
- Phase 4 (Deploy): GitHub Pages is stable; confirm current behavior of the known build-race (a push landing during an in-flight Pages build fails silently) at apply time.
- Phase 5 (Security Review Gate): Standard checklist — no research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | SDK versions and both CDN builds verified live on 2026-09-18; rules/quota facts from official Firebase, EmailJS, GitHub docs |
| Features | MEDIUM | Recruiter-behavior claims from vendor/portal sources (Hirevire, Seera, TheLadders re-cites), cross-checked for consistency; official-doc-backed UI/form patterns HIGH |
| Architecture | MEDIUM-HIGH | Built from official Firebase/EmailJS API docs (addDoc, sendForm, serverTimestamp, rules structure); the dual-leg success semantics are a domain-reasoned design decision |
| Pitfalls | MEDIUM (verified) | Web-tier sources cross-checked against official Firebase, EmailJS, GitHub, MDN, WebKit docs; facts officially documented are marked HIGH inline (see PITFALLS.md sources) |

## Gaps to Address

- **Firestore Spark daily-write quota: STACK.md sources say 40K writes/day; PITFALLS.md research says 20K writes/day.** Either figure is far above realistic human traffic, so the discrepancy only affects spam-flood sizing — but the Contact Form Phase should pin the official number from the Firestore quotas page.
- **EmailJS origin whitelisting is paid-only per the pricing page (MEDIUM)** — if the free tier has no whitelist, rely fully on honeypot + `limitRate`/`blockList`/`blockHeadless`; verify at Phase 1 apply time.
- **Exact CDN import paths / EmailJS template parameter names** — re-verify against current docs when Phase 1 executes; version numbers verified on 2026-09-18 will drift.
- **GitHub Pages build-race behavior** (silent failure when a commit lands mid-build) — confirm current behavior at Deploy Phase; the mitigation (wait for the previous build, then push) is documented in PITFALLS.md.
- **Content gates need user confirmation, not research:** quantified bullet numbers (never invent metrics) and the refreshed resume PDF (dates must be current).

---
*Research summary for: static portfolio mobile polish + Firestore/EmailJS contact form + GitHub Pages deploy*
*Researched: 2026-09-18 — synthesized from STACK.md (HIGH), FEATURES.md (MEDIUM), ARCHITECTURE.md (MEDIUM-HIGH), PITFALLS.md (MEDIUM verified)*