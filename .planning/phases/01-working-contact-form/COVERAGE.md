# API Coverage Matrix — Phase 1: Working Contact Form

**Generated:** 2026-09-18
**Scope:** All external API / SDK surfaces the phase touches (Firestore via Firebase JS SDK, EmailJS browser SDK)
**Gate:** API coverage detector — `detected: true` (Firestore + EmailJS integration surfaces). This file is the mandatory capability matrix; every surface below is either INTEGRATE (wired by Plans `01-01`/`01-02`) or OPT-OUT (explicitly not used, with rationale).

## Firestore — Firebase JS SDK 12.19.0 (gstatic ESM CDN)

| API / Surface | Kind | Decision | Rationale / Notes |
|---|---|---|---|
| `initializeApp(firebaseConfig)` | CONFIG | **INTEGRATE** | Boots the app from the 3 placeholder fields (`apiKey`, `authDomain`, `projectId`) per D-14 |
| `getFirestore(app)` | CONFIG | **INTEGRATE** | Db handle for the `messages` collection |
| `collection(db, "messages")` | WRITE | **INTEGRATE** | Target collection reference |
| `addDoc(collection(db, "messages"), {...})` | WRITE | **INTEGRATE** | Primary delivery leg (CONT-01); payload = exactly `{name, email, subject, message, createdAt}` |
| `serverTimestamp()` | WRITE | **INTEGRATE** | `createdAt` sentinel satisfying rules `createdAt is timestamp` (Pitfall 3) |
| `getDoc` / `getDocs` | READ | **OPT-OUT** | Rules `allow read: if false` — zero read surface by design (CONT-01 / PII protection) |
| `onSnapshot` / listeners | REALTIME | **OPT-OUT** | Write-only intake; Firestore Lite does not support listeners and none are needed |
| `setDoc` / `updateDoc` / `deleteDoc` | WRITE | **OPT-OUT** | Create-only collection; rules deny update/delete (`allow update, delete: if false`, D-12) |
| `writeBatch` / `transaction` | WRITE | **OPT-OUT** | Single-message intake; no multi-doc atomicity requirement |
| `query` / `where` / `orderBy` / `limit` | QUERY | **OPT-OUT** | No reads, no querying |
| Security Rules engine | ENFORCEMENT | **INTEGRATE** | `match /messages/{messageId}` with `hasOnly([...5 fields])` + type/length checks + read/update/delete deny — the server-side backstop (D-12/D-13); delivered as paste-verbatim block in SETUP.md (Pitfall 1/2) |
| Raw Firestore REST (hand-rolled) | WRITE | **OPT-OUT** | Don't hand-roll — SDK handles auth token refresh, serialization, sentinel mapping (Don't Hand-Roll table) |

## EmailJS — @emailjs/browser 4.4.1 UMD (jsDelivr CDN, global `emailjs`)

| API / Surface | Kind | Decision | Rationale / Notes |
|---|---|---|---|
| `emailjs.init({publicKey, blockHeadless, blockList, limitRate})` | CONFIG | **INTEGRATE** | Anti-abuse options verified: 451 headless, 403 blockList, 429 limitRate (CONT-05); `watchVariable: "reply_to"` |
| `emailjs.send(SERVICE_ID, TEMPLATE_ID, {from_name, reply_to, subject, message})` | SEND | **INTEGRATE** | Email alert leg (CONT-03); params per D-17 match template variables `{{from_name}} {{reply_to}} {{subject}} {{message}}`; rejection is silent on the partial-failure path (D-03) |
| `emailjs.sendForm` | SEND | **OPT-OUT** | Explicit `send(params)` per D-17 (no form-field collection; avoids sending the honeypot) |
| `@emailjs/nodejs` package | SEND | **OPT-OUT** | No backend / no Node runtime in the production path (static site, browser only) |

## Coverage Verdict

- Every in-scope API surface is INTEGRATE (wired in Plan `01-01`) or explicitly OPT-OUT with a rationale above.
- No unplanned integration surfaces were detected. No new npm packages are installed (all CDN script tags; `package.json` untouched).
- Placeholder keys (`YOUR_...`) are the phase default; EmailJS leg skips gracefully until Abdil pastes real values (D-16) — live keys never appear in committed files.