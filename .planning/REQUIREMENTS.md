# Requirements: Abdil Haiyan Hilmi — Portfolio

**Defined:** 2026-09-18
**Core Value:** A recruiter or client on a phone must be able to browse the portfolio without layout breakage and reach Abdil through a contact form that actually delivers the message.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Contact Form

- [ ] **CONT-01**: Visitor can submit the contact form and the message is written to Firestore `messages` collection (create-only security rules, `serverTimestamp`, no reads)
- [ ] **CONT-02**: Visitor receives honest status feedback: sending / success / error states (success shown only after Firestore write resolves)
- [ ] **CONT-03**: Abdil receives an email alert for each submitted message via EmailJS (free tier, no backend)
- [ ] **CONT-04**: Form shows a mailto/WhatsApp fallback when Firestore or EmailJS fails (partial-failure handling)
- [ ] **CONT-05**: Form is protected against spam via honeypot + EmailJS `blockHeadless`/`blockList`/`limitRate` + Firestore field validation
- [ ] **CONT-06**: Step-by-step Firebase + EmailJS setup guide exists so Abdil can create the project and paste his own config keys

### Mobile Responsive

- [ ] **MOBL-01**: Page layout is usable on phone browsers (320–375px) with no horizontal overflow across hero, timeline, skills, education, committee, contact, and form sections
- [ ] **MOBL-02**: Layout uses mobile-first `min-width` breakpoints with fluid `clamp()` typography
- [ ] **MOBL-03**: Interactive elements have ≥44px tap targets on touch devices
- [ ] **MOBL-04**: Mobile menu, theme toggle, and form controls work correctly on iOS Safari and Android Chrome

### Performance

- [ ] **PERF-01**: Total page weight reduced from ~1.9 MB toward <500 KB (profile image re-encoded to WebP/AVIF <100 KB)
- [ ] **PERF-02**: Lucide CDN version pinned (no `@latest` drift)
- [ ] **PERF-03**: Expired LinkedIn fallback URLs removed/replaced

### Content & Credentials

- [ ] **CONTENT-01**: Experience bullets rewritten with impact focus (task + method + measurable result) — every number user-confirmed, never invented
- [ ] **CONTENT-02**: Skills remain visible as literal text (not only gauge shapes) with Malaysia-relevant software names (AutoCount/ABSS/MYOB) and credential vocabulary (MIA/MICPA/ACCA/CIMA) stated accurately
- [ ] **CONTENT-03**: Resume PDF is current at ship time (dates verified)
- [ ] **CONTENT-04**: Baseline meta title + description are genuine value sentences

### SEO & Sharing

- [ ] **SEO-01**: OG share-preview tags present (`og:title`, `og:description`, `og:image` reusing compressed image, `og:url` against final GitHub Pages URL)

### Accessibility

- [ ] **A11Y-01**: `prefers-reduced-motion` respected for skill-bar animations and transitions
- [ ] **A11Y-02**: Visible focus rings on all interactive elements
- [ ] **A11Y-03**: Form status region announced via `aria-live`
- [ ] **A11Y-04**: Toggle buttons expose correct aria states (`aria-pressed`/`aria-expanded`); icon-only links have accessible labels

### Deployment

- [ ] **DEPL-01**: Site deploys to GitHub Pages (branch deploy, `.nojekyll`, relative-path audit for `/repo-name/` hosting, custom `404.html`, HTTPS enforced)
- [ ] **DEPL-02**: Security review gate passes before first public push (Firestore rules re-checked in console, no secrets in client files, PII purge from git history via `git filter-repo` if needed)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Contact Form

- **CONT-07**: OG image finalization + LinkedIn/WhatsApp share-preview test after live deploy (OG caches ~7 days)
- **CONT-08**: EmailJS spam-control tuning after first month of live traffic (review `limitRate`/`blockList`, raise honeypot strictness if spam appears)

### Performance

- **PERF-04**: Lighthouse re-check after all changes; verify no render-blocking script regressed

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New sections (services, testimonials, blog, bilingual toggle) | Abdil chose "Polish only" |
| Analytics/tracking script | Rejected; success measured via inbound messages |
| reCAPTCHA on form | Overkill at this scale; honeypot + rate limits instead |
| Elaborate animations / 3D / parallax | Distracting visuals reduce recruiter analytical attention |
| Invented metrics in experience bullets | Credibility risk in a credentials field |
| Backend servers / Firebase Cloud Functions | Requires billing account; EmailJS chosen instead |
| Custom domain | Not requested |
| Content additions beyond approved bullet rewrites | Copy otherwise stays as-is |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | — | Pending |
| CONT-02 | — | Pending |
| CONT-03 | — | Pending |
| CONT-04 | — | Pending |
| CONT-05 | — | Pending |
| CONT-06 | — | Pending |
| MOBL-01 | — | Pending |
| MOBL-02 | — | Pending |
| MOBL-03 | — | Pending |
| MOBL-04 | — | Pending |
| PERF-01 | — | Pending |
| PERF-02 | — | Pending |
| PERF-03 | — | Pending |
| CONTENT-01 | — | Pending |
| CONTENT-02 | — | Pending |
| CONTENT-03 | — | Pending |
| CONTENT-04 | — | Pending |
| SEO-01 | — | Pending |
| A11Y-01 | — | Pending |
| A11Y-02 | — | Pending |
| A11Y-03 | — | Pending |
| A11Y-04 | — | Pending |
| DEPL-01 | — | Pending |
| DEPL-02 | — | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 0
- Unmapped: 24 ⚠️ (filled during roadmap creation)

---
*Requirements defined: 2026-09-18*
*Last updated: 2026-09-18 after initial definition*