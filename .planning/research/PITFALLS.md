# Pitfalls Research

**Domain:** Static vanilla HTML/CSS/JS portfolio site adding Firebase Firestore contact form (Spark plan), EmailJS email alert, mobile-responsive CSS overhaul, performance/accessibility polish, and GitHub Pages deployment.
**Researched:** 2026-09-18
**Confidence:** MEDIUM (web-tier sources cross-checked against official Firebase, EmailJS, GitHub, and MDN documentation; officially documented facts noted inline as HIGH)

> **Phase reference used throughout this file** (roadmap does not exist yet — these names are proposals for the orchestrator):
> - **Contact Form Phase** — Firestore + EmailJS integration + step-by-step setup guide
> - **Mobile Phase** — responsive layout overhaul
> - **Perf/A11y Phase** — image/JS/CSS performance + accessibility + SEO polish
> - **Deploy Phase** — GitHub Pages setup at ship time
> - **Security Review Gate** — a pre-deploy checklist pass inside Deploy Phase (rules review, key review, PII purge)

---

## Critical Pitfalls

### Pitfall 1: Open Firestore security rules — anyone can read or overwrite the whole database

**What goes wrong:**
The most common Firestore failure is deploying with the development "test mode" ruleset — `allow read, write: if true` — or a `match /{document=**}` rule that grants access to every collection. Anyone with the public project config can then read your entire `messages` collection (visitor names, emails, message bodies = PII leak), overwrite documents, or wipe the database with a few REST calls.

**Why it happens:**
Firebase's own onboarding defaults and countless tutorials put a wide-open rule in place during development, and it ships to production unchanged. Developers treat the client-side API key as the security boundary, which it is not.

**How to avoid:**
Lock Firestore to a **create-only rule scoped to exactly the `messages` collection**, with field-level validation, and deny everything else:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Everything denied by default
    match /{document=**} {
      allow read, write: if false;
    }
    // Contact form: create only, no reads, no updates, no deletes
    match /messages/{messageId} {
      allow create: if
        request.resource.data.name is string &&
        request.resource.data.name.size() > 0 &&
        request.resource.data.name.size() <= 120 &&
        request.resource.data.email is string &&
        request.resource.data.email.size() <= 254 &&
        request.resource.data.subject is string &&
        request.resource.data.subject.size() <= 200 &&
        request.resource.data.message is string &&
        request.resource.data.message.size() > 0 &&
        request.resource.data.message.size() <= 5000;
      allow read, update, delete: if false;
    }
  }
}
```

Firebase's official guidance is blunt — a snippet of the "insecure rules" doc, fenced per the untrusted-input boundary:

DATA_q2x8km4p_START
`// Allow read/write access to all users under any conditions
// Warning: **NEVER** use this rule set in production; it allows
// anyone to overwrite your entire database.`
DATA_q2x8km4p_END

Deploy the rule changes via the console rules editor (it has a simulation playground — use it) or `firebase deploy --only firestore:rules`. Note that the project has **no billing account**, so the Firebase CLI project setup must be done with the free Spark plan (no `--only firestore:rules` upgrade requirements; rules publishing is free).

**Warning signs:**
- Rules editor still shows the `Test mode` banner (expires after 30 days anyway — a ticking clock that leaves you with *no* working rules after relying on it)
- A rule contains `if true` anywhere, or `allow read, write` unqualified
- You can open the `messages` collection in the console and read submissions (that is console access, not rules access — but a rules-playground test of asking for a doc without auth succeeds)

**Phase to address:** Contact Form Phase (rules are written with the integration) + Security Review Gate in Deploy Phase (re-verify rules from a non-owner context via the Rules Playground).

---

### Pitfall 2: Creating the Firestore project wrong — wrong database mode, wrong region, or a second database killing the free quota

**What goes wrong:**
Creating the project in the wrong Firestore *mode* (Datastore vs Native) yields an unusable product, and Firestore requires Native mode for the Firestore SDK used by a contact form. Creating a Firestore database in a second project (or a second database in the same project) silently forfeits the only free database: Firebase allows **exactly one free database per project** (HIGH, official quotas page).

**Why it happens:**
The setup is dashboard-driven and the mode/region choice happens before any code exists; a wrong click is cheap to make and expensive to unwind (you must delete and recreate the database, deleting any test data).

**How to avoid:**
Write the setup guide (already a planned deliverable) as an explicit step-by-step: create project → enable Firestore → choose **Native mode** → pick a region close to Malaysia (`asia-southeast1` Singapore) → verify only one database exists. Have Abdil paste the resulting web config into a single `firebase-config.js` (or inline object) rather than re-creating it by hand. Add a step telling him to check Project settings → General shows the `web app` config with `apiKey`, `authDomain`, `projectId`.

**Warning signs:**
- Console shows "Datastore mode" anywhere
- A second "Create database" button exists / second DB row in the Firestore data tab
- Setup guide instructs "create a new project" a second time for the same site

**Phase to address:** Contact Form Phase (the setup guide IS this phase).

---

### Pitfall 3: Treating the Firebase web config as a secret — then leaving the *real* secrets (service account keys) exposed

**What goes wrong:**
Two opposite failures. (a) Panicking over the visible `apiKey` and trying to hide it, which is futile and wastes effort; or (b) assuming "everything Firebase is public" and shipping a service-account private key (or an EmailJS private key, see Pitfall 6) in the client. The Firebase web config is **public by design** — it identifies the project, it does not authorize anything. Authorization is enforced by Security Rules + App Check (HIGH, firebase.google.com/docs/projects/api-keys):

DATA_v9dn2t7e_START
`Security of your Realtime Database, Cloud Firestore, and Cloud Storage data is enforced using Firebase Security Rules, and protection of covered APIs is by Firebase App Check — not by keeping your Firebase API key secret.`
DATA_v9dn2t7e_END

**Why it happens:**
Training and generic "API key" intuition say keys are secret; Firebase's model is different. Meanwhile the truly dangerous credential — the `firebase-adminsdk.json` service-account key — is one "download service account key" click away and gets pasted into client bundles.

**How to avoid:**
- Ship the web config object as-is in client code (it is already planned to be public — correct).
- Never download or include a service-account key in this project; the Admin SDK is out of scope (no backend, no Cloud Functions).
- Optional hardening: restrict the browser API key in Google Cloud Console to the specific origin (`https://<user>.github.io/*`) — free, cheap, and blocks use of the key from other sites (MEDIUM-HIGH; origin restriction does not fully stop server-side calls but raises the bar).
- Do not add Firebase Auth email/password signup for this form — an open `identitytoolkit` signup endpoint is an abuse vector associated with public keys (MEDIUM, Stack Overflow discussion). No Auth is needed for anonymous create-only writes.
- Note: GitHub's secret scanner will likely email Abdil a false-positive "public key" alert for the web config (HIGH, firebase/firebase-admin-node#1380). Do not let that drive a "rotate/remove the key" reaction; verify with the rules instead.

**Warning signs:**
- A file named `firebase-adminsdk.json` / `serviceAccountKey.json` anywhere in the repo tree
- The security scan email triggers a panic-rotation of the web config while rules stay open (inverted priority)
- `authDomain`/`apiKey` in a `.env` file that a static site cannot actually consume privately

**Phase to address:** Contact Form Phase (config structure) + Security Review Gate in Deploy Phase.

---

### Pitfall 4: The form says "sent" but nothing was delivered — dual-write success handling is wrong

**What goes wrong:**
This project sends a message through **two independent services** (Firestore write + EmailJS send). The current JS already fakes success unconditionally (CONCERNS.md). The naive fix shows "Thank you" as soon as the Firestore write resolves — but Firestore writes are *latency-compensated*: on the web SDK the promise can resolve locally before the server acknowledges the write, and EmailJS may have failed entirely. Result: the exact CONCERNS.md bug (silent message loss behind a success message) reshaped with real dependencies. Visitors believe Abdil received their message when he did not — the site's only conversion mechanism silently drops every inquiry.

**Why it happens:**
Two async calls are chained with only the first awaited; error handling treats the Firestore success as the whole submission success. Offline/persistence confusion compounds it (on web, persistence is **disabled by default** — HIGH, official docs; so offline writes fail rather than queue — good here, no ambiguity).

**How to avoid:**
Make the success state **dependent on both operations**:

```javascript
// Disable the submit button first (prevents double-submit, see Pitfall 5).
Promise.allSettled([
  addDoc(collection(db, 'messages'), msg),   // Firestore
  emailjs.send(SERVICE_ID, TEMPLATE_ID, params) // EmailJS
]).then(([fs, ej]) => {
  if (fs.status === 'fulfilled' && ej.status === 'fulfilled') {
    showStatus('success'); form.reset();
  } else {
    // Distinguish which leg failed; tell the user; never claim success.
    showStatus(fs.status === 'rejected' ? 'db-error' : 'email-error');
  }
});
```

Order rationale: doing the Firestore write first means every submitted message is at least archived (retrievable from the console even if EmailJS fails); do not show success unless both settle fulfilled. If you want stronger guarantees, `waitForPendingWrites()` exists for the Firestore leg (HIGH, Firebase JS SDK API), but with persistence disabled that call is trivially resolved.

**Warning signs:**
- Submit handler early-returns success after the first `await`
- `catch` blocks logged but the UI still flips to the success state
- No `disabled` attribute on the submit button during the request
- A manual test with EmailJS service paused (or a bogus template ID) still shows "Thank you"

**Phase to address:** Contact Form Phase. Verification: kill each leg separately in devtools (block `api.emailjs.com`, then block `firestore.googleapis.com`) and confirm the UI shows the matching error state and no success.

---

### Pitfall 5: No anti-abuse on the form — a bot burns the EmailJS monthly quota and the Firestore daily quota

**What goes wrong:**
The submission flow is fully client-side and the public keys are public by design. A bot (or even a curious `curl`) can POST messages directly to EmailJS and Firestore without ever visiting the page. EmailJS free tier is **200 requests per month** (HIGH, pricing page) and Firestore Spark is 20,000 writes/day. One scripted run can burn the entire EmailJS monthly quota in minutes → the contact form is **dead for the rest of the month** with no visible warning. It also fills the `messages` collection with junk that Abdil must manually clean (he cannot even query it without enabling reads, which would be a security downgrade).

**Why it happens:**
The architecture decision is inherently client-side ("no backend, $0"). Origin restriction (AccessControlAllowOrigin / whitelist) — the usual fix — is a **paid-plan feature on EmailJS** (pricing lists "Whitelist" only from the Personal tier, MEDIUM, pricing page; verify against Abdil's account) and Firestore has no origin restriction at all for anonymous writes.

**How to avoid:**
Layer the free mitigations that actually exist:
- **EmailJS SDK**: `limitRate: { throttle: 60000 }` (429 after burst), `blockList` on the email field (403), `blockHeadless: true` (451) — all configuration options on the `@emailjs/browser` init (HIGH, official README).
- **Honeypot field** in the form (hidden input; bots fill it; human leaves it empty → abort silently server-side before writing anything).
- **Client-side validation** as the first filter (already exists) — keep it, but never rely on it.
- **reCAPTCHA** v2 checkbox on the form is the strongest free option (HIGH, EmailJS FAQ lists reCAPTCHA support); weigh the UX cost on a portfolio contact form — acceptable here because form volume is tiny.
- Do NOT add EmailJS captcha AND block tools blindly — each protects a different leg; the Firestore leg still needs the honeypot + rules validation from Pitfall 1.
- Watch the EmailJS dashboard "Requests" counter after launch; set a calendar reminder to check monthly usage if Anxiety > 0.

**Warning signs:**
- EmailJS dashboard shows usage climbing without corresponding real inquiries
- `messages` collection fills with identical-looking or obviously fake documents
- EmailJS API starts returning 429 (limitRate) or the monthly cap error (450/limit) — MEDIUM, community reports of `450 Your trial domain reached its email quota`
- Sudden 403s from blockList hits

**Phase to address:** Contact Form Phase.

---

### Pitfall 6: EmailJS template/service misconfiguration — silent blank emails or instant 400/404 failures

**What goes wrong:**
Three failure modes dominate EmailJS setups (MEDIUM-HIGH, official docs + Mailtrap guide):
1. **Template parameter mismatch**: the dashboard template uses `{{name}}`, `{{email}}`, `{{message}}` placeholders, but JS calls `emailjs.send(service, template, { from_name: ..., from_email: ... })`. Mismatched keys render empty placeholders in the email — the message arrives blank or with `{{message}}` literally showing.
2. **Wrong IDs**: `serviceId` and `templateId` are arbitrary dashboard-generated strings (`service_xxx`, `template_yyy`). Typing `default_service` for the service or swapping IDs yields `400`/`404` — a working-looking form that always errors.
3. **The "Use Default Email Address" checkbox** in EmailJS service setup has a known integration-breaking issue (Mailtrap guide, MEDIUM) — uncheck it and enter the real sending address.

**Why it happens:**
Template content and code live in two different dashboards, and nothing validates the glue until a real send happens. The "Test it" button in the EmailJS template editor only tests the template with its own placeholder data, not with the code's parameter names.

**How to avoid:**
- Write the setup guide around **one parameter name contract**: define the five keys (`name`, `email`, `subject`, `message`, and a timestamp) in the template designer, and use exactly those in `templateParams`. Include a screenshot-level checklist: "template placeholders == JS keys".
- During Contact Form Phase, send a real test submission *from the deployed/dev page* and open the received email to verify every field rendered.
- Keep the template to plain-text-safe `{{var}}` interpolation; never use `{{{html}}}` triple braces for user input (raw-HTML injection into the email → phishing/social-engineering vector, MEDIUM).
- After Abdil pastes his own keys (he must — keys are personal), have him click "Test it" in the template editor AND submit the live form once; both must produce a correctly rendered email.

**Warning signs:**
- Received test email contains literal `{{...}}` text or blank sections
- Console shows `400` (bad param key) or `404` (unknown template/service id) on submit
- Form fails with the *default EmailJS setup* steps (checkbox issue)

**Phase to address:** Contact Form Phase.

---

### Pitfall 7: EmailJS private key (access token) leaked into client code

**What goes wrong:**
EmailJS has a **private key / access token** that authorizes sending with full account privileges. If it lands in `index.js` or gets committed, anyone who views the page source can send unlimited emails through Abdil's account — spam from his email address, quota burn, sender-reputation damage, and possibly account suspension by the connected email provider (Gmail etc.).

**Why it happens:**
EmailJS docs mention the private key as "optional" in SDK configs; tutorials copy-paste both keys into client code and name the variable `PRIVATE_KEY` server-side but leave it in a browser file; the free-tier workflow pushes users to client-only integration ("No server code needed").

**How to avoid:**
- Use **only the public key** in the browser integration. `emailjs.send` works client-side with just the public key (HIGH, official FAQ: exposing the public key is fine because senders can only trigger your predefined templates).
- Never load the private key in this project at all — the private key field belongs to the @emailjs/nodejs package (server-side), which is out of scope here.
- Add a grep-based check to the Security Review Gate: `privateKey`, `accessToken`, `PRIVATE_KEY` patterns in `index.html`/`index.js` → fail.
- If Abdil's dashboard ever shows the REST API `accessToken` example, treat that as server-side material.

**Warning signs:**
- Any 40-char alphanumeric key that isn't the 24-char-ish public key appearing in client files
- Git history contains a commit with `privateKey:` (would need history rewrite)
- EmailJS dashboard shows sends Abdil did not make

**Phase to address:** Contact Form Phase + Security Review Gate.

---

### Pitfall 8: Horizontal overflow on mobile — fixed pixel widths and non-wrapping children shove the layout sideways

**What goes wrong:**
The site's known pain point (PROJECT.md): phone layout breaks/overflows across hero, timeline, skills, edu, contact grids. Root causes seen in vanilla CSS portfolios: fixed `px` widths on grid tracks, `min-width` on children larger than the container, long unbreakable strings (URLs, certification codes), negative margins, non-wrapping flex rows, and absolutely-positioned decorations wider than the viewport. Overflow makes the page scroll sideways, hides the right half of content, and makes the site look broken to the exact audience (mobile recruiters) this milestone targets.

**Why it happens:**
The desktop layout was tuned at a wide viewport; nothing in the CSS constrains the `100% + fixed` math, and there was no `overflow-x` safety net or mobile-first test pass.

**How to avoid:**
- First, confirm the viewport meta tag is present (it is a *different* critical failure if missing — see Pitfall 9).
- Mobile Phase checklist against the *actual* `index.css`:
  - Replace fixed-width grid tracks (`grid-template-columns: repeat(3, 320px)`-style) with `repeat(auto-fit, minmax(min(100%, Npx), 1fr))` or single-column stacking under a breakpoint.
  - Audit every `width`, `min-width`, and negative margin in `index.css` for a `min(..., 100%)` guard.
  - Add `overflow-wrap: anywhere` / `word-break: break-word` for long strings (URLs, document names); the resume link and timeline descriptions are prime suspects.
  - Guard brittle decorations: `max-width: 100%` on images/embeds (already partially handled), no child wider than its parent in the timeline/edu grids.
  - Verify with **measurement, not eyeballs**: in devtools, `document.documentElement.scrollWidth > document.documentElement.clientWidth` must be false at 320/375/414px widths; or add a one-off `/debug` URL query that logs it (a small script in index.js guarded to dev).
- Keep phone testing on a real device or emulated iOS Safari, not just desktop Chrome resize (engine differences are real — see Pitfall 10).

**Warning signs:**
- Horizontal scrollbar appears at 320–414px widths
- `scrollWidth > clientWidth` in the console
- A section's content visibly clipped on the right edge when screenshotting at 375px

**Phase to address:** Mobile Phase.

---

### Pitfall 9: Missing/wrong `viewport` meta — the whole page renders as a zoomed-out 980px miniature

**What goes wrong:**
Without `<meta name="viewport" content="width=device-width, initial-scale=1">`, iOS Safari and Android Chrome render the page at a virtual 980px width and scale it down — text becomes postage-stamp small, tap targets shrink below touchability, and every responsive rule in `index.css` is dead on arrival. Even "correct" CSS then looks broken on phones. (HIGH, MDN/WebKit behavior; the current `index.html` must be audited — CONCERNS.md does not flag its absence, so verify.)

**Why it happens:**
The behavior is inherited from the pre-mobile era; if the template this site was built from predates mobile thinking (or the meta tag was stripped), the page silently regresses to desktop emulation.

**How to avoid:**
- Ensure the exact tag is in `<head>` before any CSS matters: `<meta name="viewport" content="width=device-width, initial-scale=1">` and keep `user-scalable` out of it entirely (disabling zoom is an accessibility failure — HIGH, WCAG best practice; 16px inputs + pinch zoom are the correct tools).
- Only if the site later needs true edge-to-edge background (notch bleed) add `viewport-fit=cover` **together with** `env(safe-area-inset-*)` padding (Pitfall 10) — do not add it speculatively.
- Add it to the Security/QA checklist for Mobile Phase: grep `index.html` for the viewport tag as a gate.

**Warning signs:**
- On a phone, the site loads fully zoomed out with tiny text even though CSS has breakpoints
- DevTools "device mode" reports layout viewport 980px
- `grep viewport index.html` returns nothing

**Phase to address:** Mobile Phase (first item in the section-by-section pass).

---

### Pitfall 10: `height: 100vh` sections overflow behind the iOS Safari URL bar; fixed bars collide with the notch/home indicator

**What goes wrong:**
Two classic iOS Safari failures (HIGH, WebKit bug history + modern-css.com):
1. `100vh` on mobile includes the browser URL bar area, so a full-height hero (or the slide-in nav panel) is taller than the *visible* viewport — content hides behind the browser chrome or the bottom of the panel is unreachable.
2. Fixed/sticky elements (navbar, mobile menu close button) sit under the notch or the home indicator on notched iPhones in landscape / with `viewport-fit=cover`.

**Why it happens:**
`vh` was defined against the large viewport; mobile browsers only later introduced the small/dynamic viewport units. Designers use `100vh` because it is the first result in every tutorial.

**How to avoid:**
- Replace viewport-height hacks with `100dvh` for the hero and mobile nav panel: `height: 100dvh` (or `min-height: 100dvh`). `dvh` is Baseline "widely available" since 2023 — safe for modern phone browsers (MEDIUM-HIGH; was buggy in Safari 15.6/16, fixed since).
- Fallback for older browsers: `height: 100vh; height: 100dvh;` — the second declaration wins where supported.
- For fixed elements (navbar, nav panel): add `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);` (or `max()` forms like `padding-bottom: max(1rem, env(safe-area-inset-bottom))`). `env()` resolves to 0 on non-notch devices, so the declarations are safe everywhere (HIGH, MDN).
- Only add `viewport-fit=cover` if a section truly must bleed to the screen edges — otherwise leave the default; your glassmorphism theme should keep content inside the safe area.

**Warning signs:**
- Hero/nav panel bottom is cut or unreachable when the URL bar is expanded on iOS
- Fixed close button sits under the home indicator / notch on iPhone Safari
- Element with `100vh` shows a gap at the bottom after scrolling (or overflows on load)

**Phase to address:** Mobile Phase.

---

### Pitfall 11: iOS auto-zoom on form inputs — focusing any field <16px blows the page up and disorients the user

**What goes wrong:**
Tapping a contact-form input (or textarea/select) whose computed font-size is **below 16px** makes iOS Safari auto-zoom the viewport into that field, and the zoom often does not release on blur — layout appears broken mid-form (HIGH, CSS-Tricks/Josh Comeau confirmation; the contact form is at the page bottom, and a zoomed-out-from there state is jarring). This directly degrades the milestone's core value: recruiter reaches you through the contact form.

**Why it happens:**
iOS Safari's accessibility heuristic assumes sub-16px input text needs magnification. The contact form currently inherits a smaller base font-size in the design system, and no form control resets exist (CONCERNS.md confirms the form is unpolished).

**How to avoid:**
- Enforce `font-size: 16px` (or larger) on every form control in the Mobile/Contact phases: `input, textarea, select { font-size: 16px; }` at mobile widths (16px is the documented threshold; HIGH).
- Do **not** "fix" it with `maximum-scale=1` / `user-scalable=no` — that disables pinch zoom site-wide and fails WCAG 2.4.4/1.4.4-style zoom expectations (a11y anti-pattern, MEDIUM-HIGH).
- If smaller form text is wanted for design reasons, the accepted trick is `font-size: 16px` with `transform: scale(0.875)` on the control — but for a portfolio, just keep 16px.

**Warning signs:**
- Focusing any form field on an iPhone zooms the page
- Form CSS uses `font-size: 14px`-class values on inputs/textareas at mobile breakpoints

**Phase to address:** Mobile Phase (form resize pass) — verify in Contact Form Phase's manual test too.

---

### Pitfall 12: Tap targets too small — nav, social icons, and menu close button are hard to hit on a phone

**What goes wrong:**
Thin/narrow links and 20–28px icon buttons (the navbar social icons, hamburger, close icon, timeline links) cause adjacent-target mis-taps and frustrating UX on mobile. WCAG 2.2 sets a 24×24 CSS-px minimum (SC 2.5.8), and Apple HIG recommends 44×44 — a recruiter's fat-finger miss on the "Send" or menu-close tap is a lost opportunity at the exact moment the site must convert.

**Why it happens:**
Desktop-first sizing: 24px icons with 4px gaps feel fine with a mouse and are invisible on touchscreens; no `touch-action` or padding-that-preserves-visual-size pattern was applied.

**How to avoid:**
- In Mobile Phase, bump interactive hit areas with an invisible-padding pattern that keeps visual design: `a, button { min-height: 44px; display: inline-flex; align-items: center; }` or `padding: 12px` on the icon buttons while keeping the icon glyph size.
- Audit the specific controls listed in CONCERNS.md as icon-only links (timeline external-link icon, social links, theme toggle, hamburger) — each needs an accessible name AND an adequate hit area.
- Use the WCAG 2.5.8 24px floor as the gate; use 44px as the target for primary actions (Send button, menu close).

**Warning signs:**
- Visually obvious: hit-testing adjacent icons on a 375px screenshot overlaps their neighbors
- The Send/menu buttons measure < 44×44 CSS px in devtools

**Phase to address:** Mobile Phase.

---

### Pitfall 13: GitHub Pages project-page paths — absolute URLs break everything under `/repo-name/`

**What goes wrong:**
A project page is served at `https://<user>.github.io/<repo-name>/` — not at the domain root. Any absolute path in the site (`src="/images/profile.jpg"`, `href="/index.css"`, and the `<script src="...">`/`<link>` assets) resolves to `https://<user>.github.io/images/...` and 404s. The page then renders with no CSS, no JS, no images — the "deployed fine locally, broken on Pages" classic (HIGH, Jekyll/GitHub issue history on base-url; affects every static site).

**Why it happens:**
Locally, `http-server` serves everything from the root, and `file://` testing masks the difference. `https://<user>.github.io/<repo>/` is only visible after deploy. The repo name also matters: this repo is `portfolio2-main`, so the live URL will be `/portfolio2-main/` — if Abdil later renames the repo to `portfolio2`, every bookmarked/linked URL breaks (MEDIUM-HIGH, docs.troubleshooting-404: renaming/visibility changes alter URLs).

**How to avoid:**
- **Relative paths everywhere** in `index.html` (`href="index.css"`, `src="images/profile.jpg"` — relative to the current document) or a `<base href="/portfolio2-main/">` — relative paths are simpler for a flat single-page site and work under any subpath (locally, on Pages, and under any future repo rename… after updating the base).
- Audit every asset reference during the Deploy Phase with a link-checker pass (grep `src="/`, `href="/` — those are the dangerous absolute-root forms) plus a local test *served under a subpath*: `npx http-server -p 3000` then visit `http://localhost:3000/portfolio2-main/` — no wait, simpler: temporarily copy the site into a `portfolio2-main/` subfolder and serve the parent; every asset must resolve.
- Decide the repo name **before** deployment (rename now, not after sharing links).
- The hash-based anchor nav (`#about`, `#contact`) is immune to subpath issues — good, keep it.

**Warning signs:**
- Deployed page shows unstyled HTML / broken images while the local dev server looks perfect
- Network tab shows 404s for `/*.{css,js,jpg}` against the bare domain root
- Any markup contains `/index.css`-style absolute-root paths

**Phase to address:** Deploy Phase (with an asset-path audit step).

---

### Pitfall 14: Deploying the repo "as-is" makes the committed PII (resume PDF, profile photos) permanently public

**What goes wrong:**
GitHub Pages requires the repository to be **public** (free tier). This repo currently contains `images/Resume Abdil Haiyan 06092024.pdf` (full name, contact info, employment history), a 1.3 MB personal profile photo, and a logo — all committed in baseline history (CONCERNS.md / Security Considerations, HIGH). The moment the repo goes public, anyone can clone all of history and retrieve the resume PDF and photos **even after they are deleted** from the working tree. For a person whose entire career is in that document and whose site targets Malaysian hiring managers, that is a genuine privacy exposure, not a hypothetical.

**Why it happens:**
The repo was initialized as a local artifact and deployed later; git history was never scrubbed because nothing was public until now. Pages turns "private by default" into "public" with a single settings checkbox.

**How to avoid:**
- Before enabling Pages, run `git filter-repo` (or `git filter-branch`/BFG as fallback) to purge the resume PDF and profile images from **all history**, then force-push the rewritten history — or, simpler and adequate here, start fresh history for the public deploy: create a new clean repo/branch containing only the site files (no PDF, no 1.3 MB originals), and keep the working history local.
- Publish the resume as a versioned link *outside* the repo (drive link or later hosting) or from a dedicated `assets/` dir that is purpose-built for static hosting and never contains private docs.
- Add the Security Review Gate checklist item: `git log --all --oneline -- '**/*.pdf' '**/*.jpg'` shows nothing sensitive; `git ls-files` matches the intended public file set.
- After any history purge, verify: clone the repo fresh to a temp dir and confirm the sensitive files are unreachable from every ref/tag.

**Warning signs:**
- `git ls-files` still lists the PDF or large photos
- `git log --all` history contains commits touching `images/Resume*`
- The repo has no remote yet (per PROJECT.md) — perfect timing: clean before the first push

**Phase to address:** Deploy Phase (Security Review Gate, before the first push / enabling Pages).

---

### Pitfall 15: Jekyll processing + `.nojekyll` and custom 404 handling

**What goes wrong:**
GitHub Pages runs published files through **Jekyll by default**, and Jekyll silently drops files/directories that start with an underscore (`_foo`). A missing `.nojekyll` file in the published output can delete assets or, in this project's worst case, interfere with the resume link handling. Separately, deep links to nonexistent paths (or a future SPA-style URL) get a generic GitHub 404 page — no custom fallback (MEDIUM-HIGH, GitHub docs + Jekyll community issues).

**Why it happens:**
Pages historically is a Jekyll host; every non-Jekyll static site hits this once. The current repo has no underscore dirs, so the failure would be latent — which is exactly why it gets missed, then breaks the first time an underscore-named asset is added.

**How to avoid:**
- Add an empty **`.nojekyll`** file at the repository root of the published source (with the default "deploy from branch" setup, at repo root) so Pages serves files verbatim (HIGH, GitHub docs re: `.nojekyll` for CI-deployed sites and Jekyll underscore handling).
- Add a root **`404.html`** (styling-matched, minimal — "Page not found — back to portfolio") — Pages serves it automatically with no configuration (HIGH, GitHub docs: file named `404.html` at root; `404.md` variant needs `permalink: /404.html` front matter for Jekyll, irrelevant once `.nojekyll` is in). This is a small but real polish item for the Deploy Phase.
- Single-page site means **no SPA fallback engineering is needed** — anchor/hash routing works as-is; just don't introduce path-based routing later without rethinking 404s.

**Warning signs:**
- Post-deploy, an underscore-prefixed asset 404s while present in the repo
- Visiting a made-up path shows GitHub's default 404 instead of a styled page
- Any tooling (future image pipeline) writes into `_assets/`-style folders

**Phase to address:** Deploy Phase.

---

### Pitfall 16: Cache staleness masquerading as deployment failure — "I deployed, why is the old site showing?"

**What goes wrong:**
GitHub Pages and its CDN cache aggressively; browsers cache static assets by URL. After the first deploy, subsequent updates (CSS tweaks from Mobile Phase, new meta tags) can keep serving the old page to Abdil and to reviewers for minutes to hours. This produces false "deployment is broken" alarms during the exact phase when the deploy is brand-new — and private repos compound it (browser-cache 404s until cleared, HIGH, GitHub troubleshooting docs).

**Why it happens:**
Identical asset URLs (`index.css` without a version/query) are indistinguishable from "unchanged" to caches; Pages build propagation has its own delay; reviewers check immediately after push.

**How to avoid:**
- Expect and tolerate a propagation window (usually 1–10 minutes after the Actions run completes; first build can be longer).
- Hard-refresh / incognito when verifying post-deploy changes; or add cache-busting query strings (`index.css?v=2`) for any asset changed between deploys (cheap and sufficient for a static site).
- Verify the deployed URL via `curl -I https://<user>.github.io/<repo>/index.html` and check `X-Served-By`/`last-modified` rather than eyeballing a cached tab.
- Set the Pages "Enforce HTTPS" checkbox (automatic on github.io with Let's Encrypt — HIGH; no action needed beyond leaving it enabled) and never uncheck it in favor of HTTP.

**Warning signs:**
- Old styling/logic persists after a confirmed successful Actions deploy
- `curl` shows an old `last-modified` header on assets you changed
- Reviewer reports a broken private-repo URL that works after clearing cache

**Phase to address:** Deploy Phase (verification step of the deploy checklist).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Leave `allow read: if true` "so Abdil can read his own messages from the console" | Reads work without setup | Every visitor can read all submissions (PII); violates the create-only design; hard to undo safely once messages accumulate | Never — the console shows data regardless of rules; rules are the data boundary |
| Show success on the Firestore write alone | Simpler submit handler | Silently lost EmailJS mail; the exact CONCERNS.md bug returns with real stakes | Never — success must require both legs |
| Copy-paste EmailJS private key into `index.js` ("it works without backend") | Instant sends, no server | Full account compromise; spam from Abdil's address; quota burn | Never in client code — client integration uses public key only |
| `user-scalable=no` on the viewport meta "to stop the input zoom" | Stops iOS field zoom | Breaks pinch-zoom for low-vision users; a11y failure; reviewers may flag it | Never; use 16px inputs instead |
| Skip `.nojekyll` ("we have no underscore files") | One fewer file to think about | First underscore-prefixed asset silently vanishes in production | Only while zero underscore paths exist AND a deploy-time check enforces it — just add the empty file, it is free |
| Deploy the repo as-is including the resume PDF | Fastest path to Pages | Permanent PII in public history; unfixable without history rewrite | Never — Pages requires a public repo |
| Commit the Firebase web config into a repo that also contains a `firebase-config.example.js` with placeholder values | Clear setup docs | Placeholder/real key confusion; secret-scanner noise | Acceptable — but keep only ONE real config source and make the guide reference it by filename |
| One fat `@media (max-width: 768px)` block with a few `!important` overrides tacked on | Fixes today's overflow fast | Unmaintainable cascade; each new section needs more `!important` | Only for a throwaway demo; for this polish milestone, refactor the grids properly |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Firebase console | Choosing Datastore mode (or a second project/database) | Create Firestore in **Native mode**, one database, region `asia-southeast1`; verify only one free DB exists |
| Firebase Security Rules | `allow read, write: if true` or rules outside the editor's simulator | Create-only `messages` rule with field validation (Pitfall 1); test in the Rules Playground before deploy |
| Firebase web config | Rotating/restricting the apiKey as if it were a secret; or shipping a service-account key | Keep web config public; never touch service-account keys; optionally restrict browser key origin |
| EmailJS template designer | Placeholder names that don't match `template_params` keys | One documented key-name contract (`name`, `email`, `subject`, `message`, `timestamp`), verified by a real test send |
| EmailJS service setup | "Use Default Email Address" checked | Uncheck it; enter Abdil's real sending address |
| EmailJS SDK init | Passing the private key alongside public key | Public key only in the browser; private key never in this project |
| Firestore + EmailJS ordering | Firestore last (so archived data is lost on EmailJS failure) | Firestore write first (durable archive), then EmailJS; success only on both fulfilled |
| Dev server vs Pages path | Testing only at `/` | Run a subpath-served test (`/portfolio2-main/`) before deploy to catch absolute-path breakage (Pitfall 13) |
| Git history | Forgetting the repo becomes public with Pages | Purge PII (resume PDF, photos) with `git filter-repo` before the first push |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unthrottled scrollspy (existing CONCERNS.md) | Scroll jank on low-end phones during the Mobile Phase testing | rAF-throttle, cache offsets, `passive: true` | Already at current scale on mid-range Android |
| 1.3 MB duplicated hero/contact image | Slow first paint, ~1.6 MB/page | Re-encode to WebP <100 KB, `loading="lazy"` on contact copy (Perf/A11y Phase) | Already; every visitor pays it |
| Render-blocking CDN script + CSS `@import` | Blank page until CDN round-trips | `defer`, `preconnect`, pinned version (Perf/A11y Phase) | Every cold load, worse on Malaysian mobile networks |
| Bot-write flood into Firestore/EmailJS (free quotas) | Quota exhaustion kills the form for a day/month | Rules validation + honeypot + reCAPTCHA + `limitRate` | Firestore: 20K writes/day is *plausibly reachable* by a script in hours; EmailJS: 200/month in minutes |
| Unpinned `lucide@latest` | Icons vanish on a breaking release | Pin exact lucide version with SRI or inline SVGs (Perf/A11y Phase) | Any release; already on `@latest` |
| Messages collection growing unreadable | Firestore free tier storage (1 GiB) accumulates junk; console cleanup impossible without enabling reads | Size caps in rules (Pitfall 1) + honeypot; periodic manual cleanup via Firebase console delete UI | 1 GiB is thousands of 5 KB docs — a spam flood can reach it; junk bloat starts well before |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Open Firestore read+write rules | Full DB read (visitor PII) and overwrite by anyone | Create-only scoped rule (Pitfall 1); HIGH risk |
| Shipping EmailJS private key client-side | Unlimited spam from Abdil's account, quota burn, sender-reputation damage | Public key only in browser; grep gate (Pitfall 7); HIGH risk |
| Service-account key in the repo | Full Firebase project compromise (bypasses all rules) | Never download to this project; HIGH risk |
| `{{{html}}}` template braces for user input | HTML injection into emails (phishing from your form) | `{{var}}` escaping only; MEDIUM risk |
| Public key + no anti-abuse layers | Quota abuse / junk writes to both services | Honeypot, reCAPTCHA, `limitRate`, `blockList`, rules validation; MEDIUM-HIGH risk (free plan has no origin whitelist) |
| Repo goes public with resume PDF + photos in history | Permanent PII exposure for the site owner | `git filter-repo` before first push; MEDIUM-HIGH risk (privacy, not technical compromise) |
| Email/password Auth enabled for the form | Open identitytoolkit signup abuse via public key | No Auth needed; skip it entirely; LOW-MEDIUM risk if left off |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Fake success when EmailJS fails | Visitor believes message delivered; recruiter contact lost silently | Success only when both legs complete; distinct error states (Pitfall 4) |
| Submit button double-clickable | Duplicate docs + duplicate emails + double quota burn | Disable button and show "Sending…" during the request |
| No in-flight/progress state | Users resubmit; confusion about whether it went through | Text swap + disabled state; 1s+ perceived latency on two network calls |
| Sub-16px inputs on iOS | Page zooms into fields; form feels broken mid-submission | 16px min on form controls (Pitfall 11) |
| Small tap targets on icon links | Mis-taps, frustration, abandoned form | ≥44px hit areas (Pitfall 12) |
| Old layout cached post-deploy | Abdil/reviewers think the deploy failed | Hard refresh + cache-busting + `curl` check (Pitfall 16) |
| Text inflation on iOS landscape | Layout shifts mid-browse | `text-size-adjust: 100%` in the CSS reset (avoid `none` — keep user zoom) |
| Motion-sensitive visitors | Vestibular discomfort from skill-bar animations and transitions | `prefers-reduced-motion: reduce` block in Perf/A11y Phase (already flagged in CONCERNS.md) |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Contact form:** Often missing real dual-leg error handling — verify Firestore-leg failure AND EmailJS-leg failure each show a distinct, honest error, and no success is shown unless both resolve (block each endpoint in DevTools and re-submit)
- [ ] **Firestore rules:** Often "deployed" only in the console's draft — verify the published rules in the Rules editor match the create-only intent and reject a test write with a missing field (Rules Playground exercise)
- [ ] **EmailJS template:** Often the dashboard test passes while real sends render `{{...}}` literally — verify by sending a REAL submission from the deployed page and reading the received email; confirm the sender address is Abdil's, not `Use Default Email Address`
- [ ] **Anti-abuse:** Often the honeypot/captcha is added without testing the bot path — verify a `curl` POST replicating the form (bypassing the honeypot value) is rejected and a normal human path succeeds
- [ ] **Setup guide:** Often documents keys the user must replace, but no verification step — include "send a test email and see it in your inbox" as the guide's final gate, and "Rules Playground exercise" for Firestore
- [ ] **Mobile layout:** Often checked in desktop Chrome only — verify at 320/375/414px with `scrollWidth <= clientWidth` plus a real-device iOS pass (Safari rendering + keyboard + notch behavior)
- [ ] **Viewport meta:** Often assumed present in a template — `grep viewport index.html` passes before Mobile Phase work starts
- [ ] **GitHub Pages deploy:** Often the site works at `/` locally but breaks at `/repo-name/` — verify every asset resolves when served under a subpath; `grep -E 'src="/|href="/' index.html` returns nothing
- [ ] **PII purge:** Often history is checked only after the repo is public — run `git log --all` for the PDF/photo paths BEFORE the first push, and clone-fresh to confirm unreachable state
- [ ] **`.nojekyll`:** Often forgotten because "we don't use Jekyll" — confirm an empty `.nojekyll` file is committed at the root of the published branch
- [ ] **404 page:** Often GitHub's default 404 is shipped — verify `/nonexistent` shows the custom `404.html` after deploy
- [ ] **HTTPS:** Often default-enabled but occasionally toggled off for plugin reasons — confirm "Enforce HTTPS" is checked and the site loads over `https://`

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Open Firestore rules shipped | MEDIUM | Deploy locked-down rules immediately; if a public read existed, treat exposed message data as disclosed PII (notify if legally required), rotate nothing (no secrets were public); clean contaminated documents via console; consider a fresh database if data is beyond salvage |
| EmailJS private key leaked to client | HIGH | Rotate the key in the EmailJS dashboard (recreate the private key); scrub it from git history if committed (filter-repo); check the connected email provider for abuse; temporarily pause the EmailJS service until rotation completes |
| EmailJS monthly quota burned by bot | MEDIUM | Wait for month reset OR upgrade a month; add honeypot/captcha/limitRate before the next exposure; consider a temporary Formspree-style fallback link in the meantime |
| Firestore write quota exhausted (RESOURCE_EXHAUSTED) | LOW | Writes resume the next day automatically (midnight Pacific); surface the error state honestly in the form meanwhile; fix rules/abuse layers before the next flood |
| Repo already pushed public with resume PDF in history | HIGH | Make repo private immediately; purge history with `git filter-repo`; force-push; consider GitHub support for cached copies; treat the resume data as disclosed |
| Broken assets after Pages deploy (absolute paths) | LOW | Fix paths to relative; commit; wait out cache; hard-refresh to verify |
| Stale cached site after deploy | LOW | Hard-refresh / incognito; add `?v=` cache-busters; verify with `curl -I` |
| iOS input zoom regression | LOW | Bump affected form controls to ≥16px; standard CSS-only fix |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Open Firestore rules (1) | Contact Form Phase | Rules Playground: anonymous create-only write succeeds, read/update/delete denied; re-check at Security Review Gate |
| Wrong Firestore mode/region/free DB (2) | Contact Form Phase | Setup guide checklist: Native mode, one database, `asia-southeast1`; console shows matching DB row |
| Config-secrecy inversion / leaked secrets (3, 7) | Contact Form Phase + Security Review Gate | Grep gate for `privateKey`/`accessToken`/`firebase-adminsdk` in client files = clean; web config present as intended |
| Dual-write success lies (4) | Contact Form Phase | Block each endpoint in DevTools → distinct error, no success; both live → success |
| Anti-abuse / quota burn (5) | Contact Form Phase | `curl` bot-path replication rejected; honeypot filled → no write; EmailJS dashboard usage flat during test |
| EmailJS template mismatch (6) | Contact Form Phase | Real test send renders every field; sender address correct; no `{{...}}` literals |
| Horizontal overflow (8) | Mobile Phase | `scrollWidth <= clientWidth` at 320/375/414px; section-by-section pass on device |
| Missing viewport meta (9) | Mobile Phase | `grep viewport index.html` passes before other mobile work |
| 100vh / safe-area (10) | Mobile Phase | iOS Safari: hero/nav fit above URL bar; fixed elements clear notch/home indicator |
| iOS input zoom (11) | Mobile Phase (+ verify in Contact Form Phase) | Focus every form control on iPhone → no viewport zoom |
| Tap targets (12) | Mobile Phase | Hit areas ≥44px (24px floor) measured in DevTools; a11y QA step in Perf/A11y Phase |
| Absolute paths / subpath breakage (13) | Deploy Phase | Subpath-served local test passes; grep for absolute-root asset refs = clean |
| PII in public history (14) | Deploy Phase (Security Review Gate, before first push) | Fresh clone contains no PDF/photos under any ref |
| Jekyll / 404 handling (15) | Deploy Phase | `.nojekyll` committed; `/nonexistent` serves custom 404.html |
| Cache staleness (16) | Deploy Phase | Post-deploy `curl -I` shows new `last-modified`; hard-refresh shows update |

## Sources

- Firebase — Structuring security rules, Fix insecure rules, Security Rules basics: https://firebase.google.com/docs/firestore/security/rules-structure, /insecure-rules, /docs/rules/basics (HIGH)
- Firebase — Learn about and manage API keys for Firebase: https://firebase.google.com/docs/projects/api-keys (HIGH)
- Firebase — Security checklist (App Check): https://firebase.google.com/support/guides/security-checklist (HIGH)
- Firebase — Firestore quotas/pricing: https://firebase.google.com/docs/firestore/quotas, /pricing (HIGH)
- Firebase — Firebase pricing plans (Spark quota behavior): https://firebase.google.com/docs/projects/billing/firebase-pricing-plans (HIGH)
- Firebase — Access data offline: https://firebase.google.com/docs/firestore/manage-data/enable-offline (HIGH); JS SDK ref for `clearPersistence`/`enablePersistence`/`waitForPendingWrites` (HIGH)
- Firebase — firebase/firebase-admin-node#1380 (secret-scanner false positives on web keys) (MEDIUM)
- Stack Overflow — Is it safe to expose Firebase apiKey: https://stackoverflow.com/questions/37482366 (MEDIUM)
- Stack Overflow — What happens at the Firestore write quota limit: https://stackoverflow.com/questions/65873056 (MEDIUM)
- EmailJS — FAQ public key exposure, spam exposure: https://www.emailjs.com/docs/faq/is-it-okay-to-expose-my-public-key, /does-emailjs-expose-my-account-to-spam (HIGH)
- EmailJS — /send REST API (1 req/s): https://www.emailjs.com/docs/rest-api/send (HIGH)
- EmailJS — Pricing page (free = 200 monthly, whitelist on paid tiers): https://www.emailjs.com/pricing (HIGH; whitelist-freemium nuance is MEDIUM)
- EmailJS — @emailjs/browser SDK README (`limitRate`, `blockList`, `blockHeadless`): https://github.com/emailjs-com/emailjs-sdk (HIGH)
- Mailtrap — EmailJS integration guide (template params, Use Default Email Address issue): https://mailtrap.io/blog/emailjs (MEDIUM)
- MDN — `env()` / safe-area-inset: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env (HIGH)
- WebKit Bugzilla 242758 — dvh regression in Safari 15.6/16: https://bugs.webkit.org/show_bug.cgi?id=242758 (HIGH)
- modern-css.com — dvh/svh/lvh mobile viewport fix (Baseline 2023): https://modern-css.com/mobile-viewport-height-without-100vh-hack (MEDIUM)
- Apple — Adjusting the Text Size (`-webkit-text-size-adjust`): https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/AdjustingtheTextSize/AdjustingtheTextSize.html (HIGH)
- CSS-Tricks — 16px or Larger Text Prevents iOS Form Zoom: https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom (HIGH); Your CSS reset needs text-size-adjust: https://css-tricks.com/your-css-reset-needs-text-size-adjust-probably (MEDIUM)
- Rick Strahl — Preventing iOS Textbox Auto Zooming: https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing (MEDIUM)
- specification.website — meta viewport + safe-area best practice: https://specification.website/spec/foundations/meta-viewport (MEDIUM)
- GitHub Docs — Troubleshooting 404 errors for GitHub Pages sites: https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites (HIGH)
- GitHub Docs — Creating a custom 404 page: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site (HIGH)
- GitHub Community — .nojekyll / Jekyll underscore-drop guide: https://github.com/orgs/community/discussions/61073, withastro/starlight#3339 (MEDIUM)
- Jekyll issue #332 — base-url / project-page relative path breakage: https://github.com/jekyll/jekyll/issues/332 (HIGH for the failure mode, historical)
- Stack Overflow — 404 for everything but index.html (.nojekyll): https://stackoverflow.com/questions/26620430 (MEDIUM)
- Project context: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md` (authoritative for this codebase)

---

*Pitfalls research for: static portfolio + Firestore/EmailJS contact form + mobile responsiveness + GitHub Pages deploy*
*Researched: 2026-09-18*