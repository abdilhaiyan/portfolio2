# Feature Research

**Domain:** Personal portfolio / one-page static site — Accountant & Financial Manager (Malaysia)
**Researched:** 2026-09-18
**Confidence:** MEDIUM

## Feature Landscape

Context: this is a **"Polish only"** milestone on an existing static portfolio (hero, about, work, skills, edu-honors, committee, contact). The user explicitly ruled out new sections (no services, testimonials, blog, bilingual toggle) and no analytics. The two top defects from the codebase audit drive most of this research:

1. **The contact form is simulated** — the submit handler shows fake success and silently drops every inquiry (`index.js` submit handler; `index.html` form has `novalidate`). For a portfolio whose stated success metric is inbound contact-form messages, this is the single highest-impact feature gap.
2. **The page is not reliably mobile-responsive** (`index.css` uses desktop-first `max-width` media queries), and recruiters — the primary audience — review candidates from phones and skim for ~7 seconds.

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Working contact form with honest status states | Core conversion mechanism; a portfolio link with a dead/broken form reads as "doesn't follow through" | HIGH | Firestore `addDoc` (create-only rules, `serverTimestamp`, await before success) + EmailJS with `init({ publicKey, blockHeadless, blockList, limitRate })`. Three UI states: sending / success / error-partial, plus mailto fallback. Use compat or import-map modular Firebase — existing site is no-build vanilla JS |
| Mobile-first responsive layout | Recruiters review candidates on phones; 53% of career-site traffic is mobile-only (Hirevire research, 2026); a broken phone layout is an instant credibility fail | MEDIUM | Add `min-width` mobile-first breakpoints (~640/768/1024), `clamp()` for type/rhythm, check overflow at 320–375px on the timeline/skills/committee sections, ≥44px touch targets. Current `max-width` pattern works on desktop only |
| Fast initial load (<2s, ideally <1.5s) | Perf research cited by Google: load time rising from 1s to 3s increases bounce ~32%; users abandon pages >3s on mobile. Recruiters won't wait | LOW | Largest file is a 1.3MB profile image (1.9MB total page). Convert to WebP/AVIF (<100KB) — huge win, minimal effort, no build step (static image swap) |
| Scannable hero: name + current title + one-line value prop | Recruiters spend ~7s on first portfolio review: name, title, one sentence on what you do, then proof (Seera guide, 2026) | LOW | Already present (name + title + CTAs). Keep; ensure the exact phrase "Accountant & Financial Manager" appears verbatim in HTML text (also keywords for SEO/staffing-site scraping) |
| Keyword-rich, text-scannable skills | Recruiter eye-tracking: ~80% of attention on role title, company, dates, and skills keywords; little else; initial scan is a keyword filter | LOW | Skills section exists with categories and progress bars. Risk: progress-bar labels are the only text — keep skills visible as literal text (not only gauge shapes) so keyword scanning and copy-paste work; consider adding exact software names (AutoCount / ABSS / MYOB, SAP if used) |
| Downloadable, current resume | Hiring managers expect a current CV with the portfolio | LOW | Present already. Refresh the PDF at ship time (stale résumé silently invalidates the whole site); check the PDF isn't carrying outdated dates |
| Valid baseline meta + title + description | Search/sharing hygiene; staffing sites and LinkedIn parse meta when the link is shared | LOW | Site has title/meta; verify description is a genuine value sentence (not default). OG tags are a differentiator below but baseline title/description is table stakes |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Impact-quantified experience bullets | Accounting/finance hiring research (Hireflow, Careerly, wrxstack): first bullet containing a number is what earns the second pass; formula = task + method + measurable result. One verified number (e.g. "increased neighborhood participation by 40%" already in committee) is worth more than three duty descriptions | MEDIUM | Rewrite existing `#work` timeline bullets only — no new sections. **Every number must be real and user-confirmed; never invent metrics** (authenticity risk in a credentials-based field). User owns the approval gate; defensible numbers from existing projects (e.g. compliance/Service Tax handling, report turnaround days, size of portfolio managed) |
| Malaysia-specific credential & software visibility | MIA is the regulatory body (CA(M) route: degree + 3 yrs + MIA QE); Top-6 certs per JobStreet Malaysia: MICPA (CPA(M)), ACCA, CIMA. Malaysian SMEs run AutoCount/ABSS/MYOB — these exact strings are what Malaysian agencies keyword-search | LOW | Mostly present (UiTM degree, skills); polish = wording that matches recruiter vocabulary: "MIA-qualified" / CA(M) if applicable, exact software names, MICPA/ACCA/CIMA attendance/status in edu-honors — stated accurately, never implied |
| Open Graph / share-preview tags | Recruiters and SME owners share candidate links internally on LinkedIn/WhatsApp; a rich preview card (title + description + image) makes the link stand out and confirms the profile before click | LOW | Static HTML — OG tags work reliably (no JS rendering needed). Need: `og:title`, `og:description`, `og:image` (reuse the compressed profile image), `og:url` against final GitHub Pages URL |
| EmailJS spam hardening + honeypot | A form that gets spammed or abused fails at the only job it has; proactive abuse controls signal diligence and protect the free-tier quotas | MEDIUM | `init` options: `blockHeadless`, `blockList`, `limitRate`; honeypot hidden field; Firestore rules validate field types/lengths server-side. Public key is visible client-side by design — controls reduce abuse, don't eliminate it |
| WhatsApp / mailto fallbacks front and center | Malaysian SME clients and recruiters default to WhatsApp; a form with a broken fallback is a dead end | LOW | Social grid already lists WhatsApp + email. Ensure links open correctly from a phone; use them as the explicit error-state fallback ("prefer emailing me directly") |
| Reduced-motion & focus polish | Signals craft; also TheLadders eye-tracking found distracting visuals reduced recruiters' analytical attention — restrained presentation is an advantage for a credentials-driven field, not a concession | LOW | Respect `prefers-reduced-motion` for the existing skill-bar animations; visible focus rings; `aria-live` on form status region (also needed for the form states) |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Fake success on form submit (current bug) | "Looks like it works" | It silently discards every lead — the site's only conversion path; discovered by user testing and impossible to spot from the surface | Show success only after Firestore `addDoc` resolves; explicit error/partial states with mailto fallback |
| New sections: services, testimonials, blog, bilingual toggle | "More content = more credible", "blog shows expertise" | Explicitly rejected by user; recruiters skim ~60s total — more sections dilute the strongest signals; blog = ongoing maintenance on a no-build static site; testimonials are hard to obtain genuinely at this stage | Spend the budget on making existing sections excellent (bullet rewrites, form, mobile) |
| Analytics/tracking script | "Measure traffic" | Rejected by user; adds third-party weight to a page whose performance is a recruiting risk; no product funnel to optimize — single static page | None; measure success via inbound messages (the form) and periodic manual checks |
| reCAPTCHA on the form | "Stop spam" | Third-party dependency + friction on mobile; overkill at this scale; accessibility impact | Honeypot + EmailJS `limitRate`/`blockList`/`blockHeadless` + Firestore validation |
| Elaborate animations / 3D / parallax | "Modern looking" | TheLadders eye-tracking: distracting visuals measurably reduced recruiters' analytical decision-making; accounting is a precision/trust field — restraint reads as competence | Subtle transitions only; reduced-motion support; let content (numbers, credentials) do the work |
| Invented metrics in experience bullets | "Numbers sound impressive" | Credentials field: an employer who verifies one number and finds it inflated invalidates the entire profile | Only user-confirmable, defensible numbers; if a given role lacks a metric, use structural impact (e.g. "owned full set closing for 40+ entities") |

## Feature Dependencies

```
[Working contact form]
    └──requires──> [Firestore + EmailJS setup (accounts, rules, SDK choice)]
                       └──requires──> [Honest status UI (sending/success/error)]
                                       └──enhances──> [Mobile-first layout]

[Mobile-first layout]
    └──requires──> [Mobile breakpoint + fluid-type pass in index.css]
                       └──enhances──> [Fast initial load (smaller images)]

[Fast initial load]
    └──requires──> [Image compression (WebP, <100KB profile image)]

[Impact-quantified bullets]
    └──requires──> [User-confirmed metrics]  ← content gate, not code

[OG share tags] ──enhances──> [Fast initial load] (reuses compressed image)
[OG share tags] ──depends on──> [Final deployment URL]
```

### Dependency Notes

- **Working contact form requires Firestore + EmailJS setup:** the form cannot be "fixed" without real write + send targets. Setup order: EmailJS account/template + Firebase project/rules → SDK load decision (compat vs import-map modular) → handler wiring. Firebase rules deploy is a separate step (firebase CLI or console), easy to forget and then the form "works" locally but fails in production.
- **Honest status UI enhances mobile-first layout:** the status element (`#form-status`) must be usable at 320px and announced via `aria-live`; doing mobile pass and form together avoids two passes.
- **Mobile-first layout enhances fast load:** fluid `clamp()` type and compressed images are complementary; compressed hero/og image also feeds the OG card.
- **Impact bullets require user-confirmed metrics:** code cannot invent numbers — this dependency is a content-approval gate placed in the user's hands, so roadmap must schedule a "bullet review session" with the user, not just an implementation task.
- **OG tags depend on final URL:** the canonical `og:url` should point at the real GitHub Pages domain; do this after deployment is configured.

## MVP Definition

### Launch With (v1) — this "Polish only" milestone

- [x] **Working contact form** — Firestore create-only + EmailJS + sending/success/error states + mailto fallback (fixes the #1 defect: silent lead loss)
- [x] **Mobile-first responsive pass** — `min-width` breakpoints, `clamp()` type, 320–375px overflow check, 44px targets (recruiters on phones)
- [x] **Fast load** — profile image → WebP/AVIF <100KB; total page <500KB where feasible
- [x] **Impact-quantified bullet rewrites** — user-approved numbers only; task + method + result formula
- [x] **Baseline polish: meta description, a11y (reduced-motion, focus, aria-live), OG tags, resume refreshed**

### Add After Validation (v1.x)

- [ ] **OG image finalization + LinkedIn sharing test** — share the live URL on LinkedIn/WhatsApp, verify the preview card renders (OG caches ~7 days; test once, then don't churn)
- [ ] **EmailJS spam controls tuning** — review `limitRate`/`blockList` after first month of live traffic; raise honeypot strictness if spam appears
- [ ] **Perf re-check** — re-run Lighthouse after all changes; verify image compression actually landed and no render-blocking script regressed

### Future Consideration (v2+)

- [ ] **New sections (services/blog/testimonials/bilingual)** — explicitly rejected for this milestone; revisit only if the user reopens the decision (e.g. pivoting from job-seeking to freelance client acquisition)
- [ ] **Analytics** — rejected; revisit only if the site becomes a client-acquisition asset with a real funnel
- [ ] **reCAPTCHA** — only if spam defeats EmailJS controls; prefer abuse-proofing via rules/limits first

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Working contact form (Firestore + EmailJS + states) | HIGH | HIGH | P1 |
| Mobile-first responsive layout | HIGH | MEDIUM | P1 |
| Image compression / fast load | HIGH | LOW | P1 |
| Impact-quantified bullet rewrites (user-confirmed) | HIGH | LOW (code) / MEDIUM (content gate) | P1 |
| OG share-preview tags | MEDIUM | LOW | P2 |
| EmailJS spam hardening + honeypot | MEDIUM | MEDIUM | P2 |
| Resume refresh + meta description | MEDIUM | LOW | P2 |
| Reduced-motion / focus / aria-live polish | LOW | LOW | P3 |
| WhatsApp/mailto fallback verification | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

Benchmark: how typical accountant/finance portfolio sites handle the same features (vs. the dev-portfolio pattern this site's design language loosely follows).

| Feature | Typical Dev Portfolio | Typical Accountant/Agency Site | Our Approach |
|---------|--------------|--------------|--------------|
| Contact | Form to backend (or simulated — common bug pattern) | Email/WhatsApp button only, rarely a form | Firestore + EmailJS real form with honest states + mailto fallback |
| Core copy | Project showcase, tech-focused | Credentials/qualifications-led, conservative, precise (wrxstack guidance: accountant portfolios are credentials-first, restrained design) | Keep current structure; upgrade the story via quantified bullets within existing sections |
| Numbers | Metrics on projects (§ of speed, scale) | Metrics on outcomes (cost saved, days cut, entities closed) | Quantified impact bullets, user-confirmed, preference for money/time outcomes (tax exposure, close-cycle days, portfolio size) |
| Locale | Global/neutral | Local-market trust signals (MIA, MICPA/ACCA/CIMA wording, MY software names) | Malaysia-specific credential/software strings in existing skills/edu sections |
| Shareability | OG tags common | Rarely present — the gap is an easy win | Static OG tags + compressed image; LinkedIn/WhatsApp preview test |

## Sources

- **Hirevire (2026) — mobile recruiter behavior**: mobile-friendly résumé/portfolio review patterns; 53% mobile-only career-site traffic. Confidence: MEDIUM (vendor blog, cross-checked with Statista mobile traffic share).
- **TheLadders eye-tracking (2012, widely re-cited 2024–2026)**: ~7s initial scan, ~80% of gaze on title/company/dates/skills; distracting visuals reduce analytical attention. Confidence: MEDIUM (primary study old, findings consistently re-confirmed by later recruiter guides).
- **Seera / talent-acquisition guides (2026)**: recruiter portfolio first-look sequence: name → title → one-liner → quantified proof. Confidence: MEDIUM.
- **Ambra Benjamin (former Facebook/IBM tech recruiter) on personal sites**: DQ_kM9zQxR2_START "Two out of three times, I almost always click through to a candidate's website" DQ_kM9zQxR2_END — recruiters do visit portfolio links; the link must not disappoint. Confidence: MEDIUM.
- **Hireflow + Careerly accountant résumé guidance**: bullet formula task + method + measurable result; first-bullet number earns the second pass; never invent metrics; avoid "responsible for / helped with" framing. Confidence: HIGH (multiple independent sources agree).
- **wrxstack accountant portfolio guide**: accountant portfolios should be credentials-first, restrained, single-column/ATS-friendly; name the functions you owned (month-end close, GL, AP/AR, reconciliations). Confidence: MEDIUM (single guide, consistent with AAT guidance).
- **AAT Careers Hub (2025)**: accounting portfolio should quantify successes and **always strip sensitive/confidential data** — confidentiality slip is a red flag in this field. Confidence: MEDIUM.
- **JobStreet Malaysia (2026)**: Top 6 certifications for Malaysian accountants — MICPA (CPA(M)), ACCA, CIMA; MIA regulatory body, CA(M) route. Confidence: MEDIUM (portal/recruiter content).
- **ACCA Careers Malaysia (2026)**: job-market signal — ~440 accountant postings, KL/Selangor-dominant, sectors: public practice, banking/financial services, GBS/outsourcing. Confidence: MEDIUM.
- **EmailJS official docs**: `init({publicKey, blockHeadless, blockList, limitRate})`, `send`/`sendForm` pattern, free-tier~200 emails/month. Confidence: HIGH (official docs).
- **Firebase official docs (security rules, v9 web)**: create-only rules with `request.resource.data` validation; no `allow read, write: if true`; compat vs modular import-map for no-build; `serverTimestamp`; awaiting addDoc before success UI. Confidence: HIGH (official docs).
- **StaticForms + industry UX research**: inline/browser-side validation lifts form completion ~22%; three-state status UI (sending/success/error) is the expected pattern. Confidence: MEDIUM.

---

*Feature research for: personal accountant portfolio (Polish-only milestone)*
*Researched: 2026-09-18*