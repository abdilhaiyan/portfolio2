# Phase 1: Working Contact Form - Pattern Map

**Mapped:** 2026-09-18
**Files analyzed:** 5 (2 new, 3 modified)
**Analogs found:** 4 / 5 (SETUP.md has no in-repo analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `contact-form.js` (NEW) | component (form controller/logic) | request-response (form submit -> Firestore write + EmailJS API call) | `index.js` lines 120-183 (form block that moves verbatim) | exact |
| `index.html` (MODIFY) | markup/config | static | `index.html` itself (form markup 469-500, Lucide CDN script pattern 14, script tags 522) | exact |
| `index.js` (MODIFY, shrink) | component | event-driven | `index.js` itself (blocks 7-118 remain, 120-182 removed) | exact |
| `index.css` (MODIFY) | config/styling | static | `index.css` itself (Contact Form section 991-1073) | exact |
| `SETUP.md` (NEW) | doc | n/a | none (README.md is 1 line; AGENTS.md is auto-generated) | no analog |

**Note on `index.css`:** research says "unchanged" but the honeypot hiding block (`RESEARCH.md:416`) requires one CSS addition; EXTREMELY low risk. Contact-form.js must handle fallbacks without relying on any new CSS classes — only `.form-status-alert`, `.success`, `.has-error`, `.form-error-msg` (all exist).

---

## Pattern Assignments

### `contact-form.js` (NEW - component, request-response)

**Analog:** `index.js` lines 120-183 (the exact code being moved, D-18) + lines 1-5 (bootstrap/guard pattern) + `RESEARCH.md` Code Examples 1-2 (Firestore/EmailJS SDK shapes)

**Bootstrap pattern** (copy from `index.js:1-5`; note: module scripts are deferred, so `DOMContentLoaded` has not fired yet when it executes — research Pitfall 7 confirms the listener will attach safely):
```javascript
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
```
Applied: replace "Lucide" with the EmailJS UMD global guard (`if (window.emailjs)`) per `RESEARCH.md:310` (mirrors the `window.lucide` pattern exactly).

**Placeholder keys block** (D-14, at top of file, before the DOMContentLoaded listener; from `RESEARCH.md:330-342`):
```javascript
// in contact-form.js (module): placeholder keys per D-14
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js";
```
Plus the EmailJS consts (D-14): `EMAILJS_PUBLIC_KEY`, `SERVICE_ID`, `TEMPLATE_ID` hold placeholder strings ("YOUR_EMAILJS_PUBLIC_KEY" etc.) — D-16 graceful skip checks these against the placeholder value.

**Element lookup pattern** (copy from `index.js:121-122` — `getElementById` for IDs, per Cross-Domain Conventions):
```javascript
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
```

**Submit handler skeleton + status reset** (copy from `index.js:124-132`; the honeypot check slots in right after the reset):
```javascript
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  // Reset status and error states
  formStatus.style.display = "none";
  formStatus.className = "form-status-alert";
  
  const formGroups = contactForm.querySelectorAll(".form-group");
  formGroups.forEach(group => group.classList.remove("has-error"));
```

**Validation pattern** (copy `index.js:135-160` verbatim — boolean-flag `isValid`, `showError(groupId)`, `validateEmail(email)` all move with the block per D-18):
```javascript
let isValid = true;

if (!nameInput.value.trim()) {
  showError("group-name");
  isValid = false;
}
// ...email/subject/message repeat the same shape (index.js:147-160)...

function showError(groupId) {
  document.getElementById(groupId).classList.add("has-error");
}

function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}
```

**Status success rendering** (copy from `index.js:164-171` — `innerText`, state class, reset, 5s auto-hide; the "sending" state and the new status-state machine wrap this):
```javascript
formStatus.innerText = "Thank you! Your message has been sent successfully. I will get back to you shortly.";
formStatus.classList.add("success");
contactForm.reset();

setTimeout(() => {
  formStatus.style.display = "none";
}, 5000);
```

**Firestore write (promise chain, D-20)** — from `RESEARCH.md:345-359`, adapted to promise chains and no `console.*`; the success gate is Firestore resolution ONLY (D-03 — do NOT gate on both legs):
```javascript
addDoc(collection(db, "messages"), {
  name: nameInput.value.trim(),
  email: emailInput.value.trim(),
  subject: subjectInput.value.trim(),
  message: messageInput.value.trim(),
  createdAt: serverTimestamp(),
}).then(() => {
  // D-02/D-03: Firestore resolved -> success (EmailJS leg independent, rejection silent)
}).catch(() => {
  // D-04/D-08: full failure -> error state + fallback links (createElement, D-21)
});
```

**EmailJS init + send** — from `RESEARCH.md:364-382`, `send` params per D-17 (`from_name`, `reply_to`, `subject`, `message`); rejection is SILENT on the partial-failure path (D-03/discretion); the send call is not awaited by the success gate:
```javascript
emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY,
  blockHeadless: true,
  blockList: { list: [], watchVariable: 'userEmail' },
  limitRate: { id: 'app', throttle: 10000 },
});
// ...
emailjs.send(SERVICE_ID, TEMPLATE_ID, {
  from_name: nameInput.value.trim(),
  reply_to: emailInput.value.trim(),
  subject: subjectInput.value.trim(),
  message: messageInput.value.trim(),
}).then(
  (response) => { /* no console.* per conventions; success is D-03-gated on Firestore only */ },
  (error) => { /* silent on partial-failure path; counts as failure on full-failure path */ },
);
```

**Fallback links via createElement (D-21)** — NO `innerHTML` anywhere; build with `document.createElement` + `appendChild` (this is the only sanctioned DOM-construction shape; text updates use `.innerText` per `index.js:164`, and `href` is set as a property, never string-interpolated into markup):
```javascript
const mailtoLink = document.createElement("a");
mailtoLink.href = "mailto:abdilhaiyanhilmi@gmail.com?subject=" + encodeURIComponent(...) + "&body=" + encodeURIComponent(...);
mailtoLink.innerText = "Email me directly";
formStatus.appendChild(mailtoLink);
// same pattern for https://wa.link/kx5upx (index.html:457)
```

**Error handling:** no `try/catch`, no `throw`, no `console.*` (index.js has zero of each). Every async chain ends in `.catch` (research Pitfall 5). Guard the EmailJS global with a truthiness check before calling (`if (window.emailjs)`, mirroring `index.js:3`). Disable the submit button on submit (`D-02`) before starting the legs.

---

### `index.html` (MODIFY - markup/config)

**Analog:** itself (form markup `index.html:469-500`, CDN script pattern `index.html:14`, script tags `index.html:522`)

**Existing form markup to extend** (`index.html:469-500`) — the honeypot field goes INSIDE `#contact-form` (agent's discretion on exact name/placement; example markup from `RESEARCH.md:408-414`):
```html
<form class="contact-form" id="contact-form" novalidate>
  ...
  <div class="form-group" id="group-message">
    <label for="form-message">Message</label>
    <textarea id="form-message" class="form-control" placeholder="Type your message here..." required></textarea>
    <span class="form-error-msg">Please enter your message</span>
  </div>

  <div id="form-status" class="form-status-alert"></div>

  <button type="submit" class="btn btn-primary form-submit-btn">
    <i data-lucide="send"></i> Send Message
  </button>
</form>
```

**CDN script-tag pattern** (Lucide precedent at `index.html:13-14` — external script via `<script src>` in head/body with zero build step):
```html
<!-- Lucide Icons CDN -->
<script src="https://unpkg.com/lucide@latest"></script>
```

**Script ordering at `index.html:521-522`** — REPLACE the single tag with the research-verified tri-block ordering (`RESEARCH.md:102-109`, Pitfall 7: classic scripts execute during parse, modules defer — so EmailJS UMD first, then the module, then index.js):
```html
  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js"></script>
  <script type="module" src="contact-form.js"></script>
  <script src="index.js"></script>
```

**Fallback link targets** (reuse verbatim, D-06): `mailto:abdilhaiyanhilmi@gmail.com` (`index.html:446`) and `https://wa.link/kx5upx` (`index.html:457`).

---

### `index.js` (MODIFY - shrink, component, event-driven)

**Analog:** itself — the file is the analog; delete lines 120-183 (entire `// --- Contact Form Validation & Submission ---` block + `showError`/`validateEmail` helpers), keep the remaining five blocks which are already the pattern to preserve.

**Remaining structure** (unchanged, do not touch — `index.js:1-118`):
```javascript
document.addEventListener("DOMContentLoaded", () => {   // line 1
  if (window.lucide) { window.lucide.createIcons(); }   // lines 3-5

  // --- Theme Toggle Logic ---                            // line 7
  // --- Mobile Menu Toggle ---                            // line 39
  // --- Skill Bars Animation & Category Filtering ---     // line 57
  // --- Active Nav Link on Scroll (ScrollSpy) ---         // line 96
});                                                       // line 118 = new file end
```
After the removal, the file ends after the scrollspy `.forEach` at `index.js:117`; the closing `});` moves up. No shared state exists between the two files (D-18) — `index.js` never references the form elements once the block is removed.

---

### `index.css` (MODIFY - config/styling)

**Analog:** itself — Contact Form section (`index.css:991-1073`), banner-comment style `/* Contact Form */` at line 991, block appended before `/* Footer Section */` at line 1075.

**Existing status/error classes (reused as-is, zero new selectors beyond honeypot):**
```css
.form-status-alert {                      /* index.css:1061 */
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  display: none;
}

.form-status-alert.success {              /* index.css:1068 */
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid var(--success);
  color: var(--success);
  display: block;
}

.form-group.has-error .form-control {     /* index.css:1049 */
  border-color: var(--error);
}
.form-group.has-error .form-error-msg {   /* index.css:1053 */
  display: block;
}
```

**New honeypot hiding block** (from `RESEARCH.md:416`; appended after line 1073 under the `/* Contact Form */` section; uses `position`/`overflow` only — NO color tokens, so NO `:root` + `[data-theme="light"]` duplication required per convention):
```css
.hp-field { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
```
The `.form-error-msg`/`.has-error` pattern (1049-1055) is kept and moves to `contact-form.js` usage per D-18.

---

## Shared Patterns

### DOMContentLoaded IIFE bootstrap
**Source:** `index.js:1` and (mirror) `index.js:183`
**Apply to:** `contact-form.js`
```javascript
document.addEventListener("DOMContentLoaded", () => {
  // ...all logic inside the closure...
});
```
Module scripts are deferred (Pitfall 7) so the listener attaches before the event fires. Multiple listeners fire in registration order, which is irrelevant here (D-18 — no shared state).

### External-global truthiness guard
**Source:** `index.js:3-5`
**Apply to:** `contact-form.js` (for `window.emailjs`)
```javascript
if (window.lucide) {
  window.lucide.createIcons();
}
```

### State-class-driven status/error rendering
**Source:** `index.js:132, 164-165` + `index.css:1049-1055, 1068-1073`
**Apply to:** `contact-form.js` status state machine
- validation errors: `.has-error` on `.form-group` wrapper
- success: `.success` on `#form-status`
- before each submit: `formStatus.className = "form-status-alert"` and strip `.has-error` from all `.form-group` (index.js:129, 131-132)

### `innerText` for text, `createElement`/`appendChild` for structure — never `innerHTML`
**Source:** `index.js:164` (`innerText`); D-21 constraint
**Apply to:** `contact-form.js` fallback links (message/subject are user input — innerHTML would be an XSS vector, research Pitfall/Security domain)

### No `async/await`, no `try/catch`, no `console.*` — promise chains only
**Source:** entire `index.js` (zero occurrences of all three; D-20)
**Apply to:** `contact-form.js` Firestore + EmailJS legs — every chain ends in `.catch` (research Pitfall 5: unhandled rejection -> frozen "Sending..." state)

### Section banner comments
**Source:** `index.js:7, 39, 57, 96, 120` (`// --- Name ---`); `index.css:991` (`/* Contact Form */`); `index.html:18` (`<!-- Name -->`)
**Apply to:** all modified/new files — new code blocks get matching banner comments

### CSS design-token rule (no new colors expected)
**Source:** `index.css:4-39` (`:root`) + `index.css:41-66` (`[data-theme="light"]`)
**Apply to:** honeypot CSS uses no `var(--*)` colors -> no token changes; if any future color is added it MUST be added to BOTH blocks.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `SETUP.md` | doc | n/a | `README.md` is a single line ("# portfolio2"); `AGENTS.md` is auto-generated project metadata, not a user-facing guide. No step-by-step setup/verification doc exists in the repo. |

**Planner guidance for SETUP.md:** use `RESEARCH.md` Code Example 3 (lines 386-404) as the verbatim rules block to paste, D-22..D-25 for the walkthrough contract, and research Pitfalls 1-2/4 (open rules, silent fail-closed, domain allowlist) for the troubleshooting/"Test it" sections. Tone: beginner-friendly, no jargon (D-23 — Abdil is an accountant). The rules block is also the DEPL-02 single source of truth — copy it verbatim, no hand-edits.

---

## Metadata

**Analog search scope:** repo root (`index.html`, `index.css`, `index.js`, `README.md`, `AGENTS.md`), `.planning/research/STACK.md` / `ARCHITECTURE.md` / `RESEARCH.md` (canonical research refs for CDN/external patterns)
**Files scanned:** 7 (4 live-code analogs + README + AGENTS + research docs)
**Pattern extraction date:** 2026-09-18