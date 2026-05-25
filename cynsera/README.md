# Cynsera – Youth Career Navigation Platform

A South African youth employment platform connecting young people with low-skill
gigs, entry-level jobs, learnerships, and career growth support.

---

## Project Structure

```
cynsera/
├── index.html          Landing page
├── auth.html           Login + 4-step signup
├── dashboard.html      Role-based dashboard (Youth / Client / Company)
│
├── assets/
│   ├── cynsera-logo.jpeg
│   └── cynsera-logo-cropped.png
│
├── css/
│   └── styles.css      All styles (design tokens, components, responsive)
│
├── js/
│   ├── supabase.js     Supabase client init + dbQuery helper    ← NEW
│   ├── utils.js        State, constants, Supabase data layer    ← REFACTORED
│   ├── auth.js         Login, registration, OTP, password reset ← REFACTORED
│   ├── onboarding.js   Role-specific signup slides
│   ├── gigs.js         Gig grid, apply modal, post-gig form     ← REFACTORED
│   ├── dashboard.js    Tab routing, profile, applications       ← REFACTORED
│   ├── buddy.js        Multilingual chatbot (12 languages)      ← REFACTORED
│   ├── payments.js     Balance display + payment simulation     ← REFACTORED
│   └── main.js         Landing page interactions                ← REFACTORED
│
└── data/
    ├── schema.sql      Supabase table definitions + RLS policies ← NEW
    ├── users.json      Static stub (used by Supabase seed)
    ├── gigs.json       Static stub
    └── applications.json Static stub
```

---

## Supabase Setup

1. Create a project at https://supabase.com
2. Open **SQL Editor** and run `data/schema.sql` – this creates all tables,
   indexes, RLS policies, and seeds the three demo accounts.
3. Copy your project **URL** and **anon key** into `js/supabase.js`:
   ```js
   const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
   const SUPABASE_ANON = 'YOUR_ANON_KEY';
   ```
4. The app will automatically prefer Supabase for all reads and writes,
   falling back to localStorage when offline.

### Tables

| Table                  | Purpose                                            |
|------------------------|----------------------------------------------------|
| `users`                | Accounts for Youth, Client, and Company roles      |
| `gigs`                 | Posted gigs with applicant details stored as JSONB |
| `email_verifications`  | OTP records for signup and password reset          |

---

## Running Locally

Open `index.html` directly in a browser (no build step required).

For full Supabase integration use a local server to avoid CORS issues:
```bash
# Node (http-server)
npx http-server . -p 3000

# Python
python3 -m http.server 3000
```
Then visit http://localhost:3000

### Demo Accounts

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Youth   | demo@cynsera.com     | demo123     |
| Client  | client@cynsera.com   | client123   |
| Company | company@cynsera.com  | company123  |

---

## Code Review Notes & Refactoring Changes

### Architecture
- **`js/supabase.js` (NEW)** – Single source of truth for the Supabase client.
  Previously the client was duplicated inside `main.js` and not available
  to other modules. Now every page loads `supabase.js` first.
- **Load order** – All HTML pages now load: `supabase.js → utils.js → page JS`.
  This eliminates the race condition where `auth.js` called `loadState()`
  before `supabase` was defined.

### utils.js
- Added `fetchGigsFromDB()`, `insertGigToDB()`, `updateGigInDB()`,
  `insertUserToDB()`, `fetchUserByEmail()`, `updateUserInDB()` – all
  Supabase-wired with localStorage fallback.
- `requestEmailVerification` and `confirmEmailVerification` now write
  to the `email_verifications` Supabase table first, falling back to
  `localStorage` for static-file preview.
- Added `normaliseGig()` and `normaliseUser()` normalisers to handle
  Supabase snake_case ↔ JS camelCase mapping in one place.
- `saveState` and `loadState` kept as aliases so existing call-sites
  still work without changes.

### auth.js
- Removed duplicated Supabase client init (was in `main.js` only, not
  available on `auth.html`).
- Phone validation now uses `SA_MOBILE_PREFIXES` list – rejects landlines
  and invalid sequences.
- Password rules are injected via `setupRegisterValidation()` so the HTML
  stays clean and rule logic lives in JS.
- `handleRegisterStep1` validates *all* fields before making any async call.
- `handleLogin` uses `fetchUserByEmail()` as fallback after local lookup,
  so logins work even if `localStorage` was cleared.
- Forgot password flow now writes/reads from Supabase `email_verifications`.
- Passwords confirmed with a second field before registration proceeds.

### gigs.js
- Added `escapeHtml()` to prevent XSS in rendered gig cards and modals.
- `identityMatchesCurrentUser()` now normalises both phone formats
  (`0731234567` vs `+27731234567`) before comparing.
- `submitGigApplication()` calls `updateGigInDB()` – changes persist
  to Supabase, not just localStorage.
- `handlePostGig()` calls `insertGigToDB()` – new gigs are written
  to Supabase immediately.
- File type validation (`isImageFile`, `validateApplicationFile`) now
  checks both MIME type and extension (CDN-served files sometimes
  lack a MIME type).

### dashboard.js
- `initDashboard()` calls `fetchGigsFromDB()` on load so the gig list
  is always fresh from Supabase.
- `saveProfile()` calls `updateUserInDB()` – bio/goal changes sync
  to Supabase.
- `emptyState()` helper removes repeated inline HTML strings.
- `escapeHtml()` applied to all user-supplied content in rendered cards.

### buddy.js
- Language array restructured as plain objects (removed redundant spread).
- `toggleBuddy()` null-checks the panel element before toggling.

### payments.js
- Added `simulatePaymentHold()` and `releasePayment()` stubs showing
  where real payment-gateway calls will go (PayFast / Peach Payments).

### CSS (styles.css)
- Removed Windows CRLF line endings (were causing parse warnings).
- No structural changes – design is preserved exactly.

---

## Production Checklist

- [ ] Replace plaintext passwords with **Supabase Auth** (email + OTP).
- [ ] Move the anon key to an environment variable; use a server proxy
      for sensitive operations.
- [ ] Tighten **RLS policies** – currently `anon` has broad insert/update
      access (fine for prototype, not for production).
- [ ] Add **Supabase Storage** bucket for selfie and document uploads
      instead of storing filenames only.
- [ ] Wire a real **email provider** (Resend, SendGrid) to the
      `email_verifications` flow via a Supabase Edge Function.
- [ ] Add **rate limiting** on the OTP endpoint.
- [ ] Replace the `password` column with Supabase Auth `auth.users`.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Hosting    | Static files (any CDN / Netlify / Vercel)|
| Database   | Supabase (PostgreSQL)                   |
| Auth       | Custom OTP (→ Supabase Auth in future)  |
| Styling    | Tailwind CDN + custom CSS               |
| Icons      | Lucide                                  |
| Fonts      | DM Serif Display, DM Sans (Google)      |
| Language   | Vanilla JS (no framework)               |

---

*Built by EquiTech · © 2026 Cynsera*
