# Setup Guide: Contact Form

This guide sets up the contact form so messages reach Abdil. When a visitor
submits the form, the message is stored in Firebase (a free database) and a
copy is emailed through EmailJS (also free). Both services have free tiers —
no credit card needed.

The form already works: until the keys below are pasted, messages are still
stored in the browser's flow and nothing breaks. The email part is skipped
automatically until the EmailJS keys are added.

---

## Step 1 — Create the Firebase project

1. Go to the Firebase website: **https://firebase.google.com**
2. Click **Go to console** (top right), then **Add project** (or **Create a project**).
3. Give the project a name (for example `abdil-portfolio`) and click **Continue**.
   Google Analytics is optional — you can leave it off.
4. When the project is ready, click **Continue**. You land on the project overview page.
5. Create the database: in the left menu click **Build → Firestore Database**,
   then **Create database**. Accept the default region (usually `(us-central)`)
   and click **Next**, then **Enable**. Note: the region is fixed at creation —
   you cannot change it later.
6. Get the web config: click the gear icon (**Project settings**) → scroll to
   **Your apps** → click the **Web** icon (`</>`) → give the app a name and
   click **Register app**. The screen shows a config object with three values
   you will paste later:

   - `apiKey`
   - `authDomain`
   - `projectId`

   These three values are public by design — they are safe to paste into the
   site's files. (They only let the browser talk to this project's database
   through the rules you add next.)

## Step 2 — Add the security rules

The rules decide what visitors can do with the database. They allow only new
messages with exactly the allowed fields, and nobody can read or change
existing messages.

1. In the Firebase console, click **Firestore Database → Rules** tab (top).
2. Select everything in the editor and replace it with the block below
   (paste it exactly as shown):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{messageId} {
      allow create: if
        request.resource.data.keys().hasOnly(['name', 'email', 'subject', 'message', 'createdAt']) &&
        request.resource.data.name is string && request.resource.data.name.size() <= 120 &&
        request.resource.data.email is string && request.resource.data.email.size() <= 254 &&
        request.resource.data.subject is string && request.resource.data.subject.size() <= 200 &&
        request.resource.data.message is string && request.resource.data.message.size() <= 5000 &&
        request.resource.data.createdAt is timestamp;
      allow read, update, delete: if false;
    }
  }
}
```

3. Click **Publish**.

The email field is checked by type and length only — no pattern check, by
design. The email format is validated in the page itself (`contact-form.js`).

> **Tip:** Before closing the rules editor, use the **playground** (the
> icon in the Rules tab) to test. Simulate a **create** — it should be
> allowed. Then simulate a **read** — it should be denied. This confirms
> the rules are live before you leave.

## Step 3 — Create the EmailJS account

1. Go to **https://www.emailjs.com** and sign up (free).
2. Add an email service: click **Email Services → Add New Service**. Choose
   your email provider (Gmail works well) and follow the connection steps.
   When done, copy the **Service ID** (it looks like `service_xxxxxxx`).
3. Create a template: click **Email Templates → Create New Template**.
   In the template body, use these five variables (click the `{}` button to
   insert them):

   - `{{from_name}}` — the visitor's full name
   - `{{reply_to}}` — the visitor's email address
   - `{{subject}}` — the message subject
   - `{{message}}` — the message text

   The email subject and body can say whatever you like, but they should
   include `{{subject}}` and `{{message}}` so the message content arrives.
   Save the template and copy the **Template ID** (it looks like
   `template_xxxxxxx`).
4. Get the **Public Key**: click the gear icon (**Account → General**) and
   copy the **Public Key** (it looks like a long base64 string).
   - The **public key** is safe in the site files.
   - Never put the **Private Key** (marked "Node-only") anywhere — it must
     stay in your EmailJS account.

## Step 4 — Paste your keys

1. Open **`contact-form.js`** (the file at the root of this project).
2. At the very top find the `firebaseConfig` block. Replace:

   - `YOUR_FIREBASE_API_KEY` with your `apiKey`
   - `YOUR_PROJECT.firebaseapp.com` with your `authDomain`
   - `YOUR_PROJECT_ID` with your `projectId`

3. Just below, find the three lines starting with `const EMAILJS_...`.
   Replace:

   - `YOUR_PUBLIC_KEY` with the EmailJS Public Key
   - `YOUR_SERVICE_ID` with the Service ID
   - `YOUR_TEMPLATE_ID` with the Template ID

4. Save the file.

> Until the EmailJS keys are pasted, the email part is skipped automatically
> and messages are still stored in Firebase — nothing breaks (Step 1 through
> Step 2 alone are enough to start receiving messages).

## Optional — allow your site's address (Domains allowlist)

If the EmailJS dashboard shows **Account → Security → Domains**, add your
site's addresses there using the shown syntax:

- `http://localhost:3000` (for testing on your computer)
- your future GitHub Pages address, for example
  `https://abdil.github.io/portfolio2-main/`

If the option is not shown, skip it — the form still works.

## Test it

1. In the project folder, run:

   ```
   npm run dev
   ```

   Then open **http://localhost:3000** in your browser.

2. Scroll to the contact form and submit a test message. Fill in your name,
   a real email address, a subject, and a message. Click **Send Message**.

3. You should see the success text: **"Thank you! Your message has been sent
   successfully. I will get back to you shortly."**

4. Check the delivery:
   - In the **Firebase console**, open **Firestore Database → Data** and
     click the `messages` collection: a new document appears with your five
     fields plus a `createdAt` timestamp.
   - If you completed Step 3 and 4, check your inbox: you receive an email
     alert with all four fields.

**If something went wrong:** open the rules editor again and run the
playground test from Step 2 (create allowed, read denied). For the email,
check the **EmailJS dashboard → Activity/History** tab for the send attempt
and any error code shown there.