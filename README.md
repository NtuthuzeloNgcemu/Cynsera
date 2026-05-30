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
│   └── styles.css 
│
├── js/
│   ├── supabase.js     Supabase client init + dbQuery helper    
│   ├── utils.js        State, constants, Supabase data layer    
│   ├── auth.js         Login, registration, OTP, password reset 
│   ├── onboarding.js   Role-specific signup slides
│   ├── gigs.js         Gig grid, apply modal, post-gig form     
│   ├── dashboard.js    Tab routing, profile, applications       
│   ├── buddy.js        Multilingual chatbot (12 languages)     
│   ├── payments.js     Balance display + payment simulation    
│   └── main.js         Landing page interactions 
│
└── data/
    ├── schema.sql      Supabase table definitions + RLS policies ← NEW
    ├── users.json      Static stub (used by Supabase seed)
    ├── gigs.json       Static stub
    └── applications.json Static stub
```

---


### Tables

| Table                  | Purpose                                            |
|------------------------|----------------------------------------------------|
| `users`                | Accounts for Youth, Client, and Company roles      |
| `gigs`                 | Posted gigs with applicant details stored as JSONB |
| `email_verifications`  | OTP records for signup and password reset          |

---

### Demo Accounts

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Youth   | demo@cynsera.com     | demo123     |
| Client  | client@cynsera.com   | client123   |
| Company | company@cynsera.com  | company123  |

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
