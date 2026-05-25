-- ═══════════════════════════════════════════════════════════════
--  CYNSERA – Supabase SQL Schema
--  Run this in the Supabase SQL Editor (Project → SQL Editor)
--  to set up all tables, types, indexes, and basic RLS policies.
-- ═══════════════════════════════════════════════════════════════


-- ── 1. users ─────────────────────────────────────────────────────
create table if not exists public.users (
  id                 uuid          primary key default gen_random_uuid(),
  full_name          text          not null,
  email              text          not null unique,
  phone              text,
  role               text          not null default 'youth'
                                   check (role in ('youth','client','company')),
  password           text,                        -- ⚠️ prototype only; use Supabase Auth in production
  location           text,
  province           text,
  postal_code        text,
  id_type            text          check (id_type in ('sa_id','passport')),
  identity_number    text,
  date_of_birth      date,
  bio                text,
  skills             jsonb         not null default '[]',
  categories         jsonb         not null default '[]',
  availability       jsonb         not null default '[]',
  rate               text,
  rate_period        text          default 'per_gig'
                                   check (rate_period in ('per_gig','per_day','per_hour','per_month')),
  balance            numeric(12,2) not null default 0,
  rating             numeric(3,1)  not null default 0,
  verified           boolean       not null default false,
  -- Client / Company extras
  organisation       text,
  industry           text,
  company_role       text,
  hiring_goal        text,
  client_job_need    text,
  client_type        text,
  hiring_frequency   text,
  average_budget     text,
  safety_notes       text,
  verification       jsonb,
  created_at         timestamptz   not null default now()
);

create index if not exists users_email_idx on public.users (email);
create index if not exists users_role_idx  on public.users (role);

-- RLS
alter table public.users enable row level security;

create policy "Allow anon insert (registration)"
  on public.users for insert to anon with check (true);

create policy "Allow read own row"
  on public.users for select to anon using (true);  -- tighten in production

create policy "Allow update own row"
  on public.users for update to anon using (true);  -- tighten in production


-- ── 2. gigs ──────────────────────────────────────────────────────
create table if not exists public.gigs (
  id                      text          primary key,
  title                   text          not null,
  description             text          not null,
  budget                  numeric(10,2) not null,
  category                text          not null
                                        check (category in ('Manual','Digital','Delivery','Creative','Education','Events')),
  location                text          not null,
  posted_by               text          not null,   -- email FK (soft reference for prototype)
  status                  text          not null default 'open'
                                        check (status in ('open','closed','cancelled')),
  applicants              jsonb         not null default '[]',
  application_details     jsonb         not null default '[]',
  confirmed_client_name   text,
  confirmed_client_phone  text,
  confirmed_client_selfie text,
  created_at              timestamptz   not null default now()
);

create index if not exists gigs_status_idx     on public.gigs (status);
create index if not exists gigs_category_idx   on public.gigs (category);
create index if not exists gigs_posted_by_idx  on public.gigs (posted_by);

-- RLS
alter table public.gigs enable row level security;

create policy "Anyone can read open gigs"
  on public.gigs for select to anon using (status = 'open');

create policy "Verified users can insert gigs"
  on public.gigs for insert to anon with check (true);   -- tighten in production

create policy "Poster can update their gig"
  on public.gigs for update to anon using (true);         -- tighten in production


-- ── 3. email_verifications ───────────────────────────────────────
create table if not exists public.email_verifications (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  purpose     text        not null default 'signup'
                          check (purpose in ('signup','password_reset')),
  code        text        not null,
  status      text        not null default 'pending'
                          check (status in ('pending','verified','expired')),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '10 minutes'),
  verified_at timestamptz
);

create index if not exists ev_email_purpose_idx on public.email_verifications (email, purpose, status);

-- Auto-expire records older than 1 day (optional cron – or use Supabase scheduled functions)
-- delete from public.email_verifications where expires_at < now() - interval '1 day';

-- RLS
alter table public.email_verifications enable row level security;

create policy "Allow anon manage verifications"
  on public.email_verifications for all to anon using (true) with check (true);
  -- Production: restrict to server-side calls only (service role key)


-- ── 4. Helpful views ─────────────────────────────────────────────

-- Active open gigs with applicant count
create or replace view public.open_gigs_summary as
select
  id,
  title,
  category,
  location,
  budget,
  posted_by,
  jsonb_array_length(applicants) as applicant_count,
  created_at
from public.gigs
where status = 'open'
order by created_at desc;

-- ── 5. Seed demo data (optional – comment out for production) ─────
insert into public.users (full_name, email, phone, role, password, location, postal_code, id_type, identity_number, date_of_birth, bio, skills, categories, availability, balance, rating, verified)
values
  ('Demo User',      'demo@cynsera.com',    '+27710000000', 'youth',   'demo123',   'Johannesburg, GP',         '2001', 'sa_id',    '0001015009087', '2000-01-01', 'Experienced in manual work, painting and delivery services.', '["Painting","Driving","Cleaning"]', '["Manual","Delivery"]', '["Weekends","Flexible"]', 5000,  4.8, true),
  ('Nandi Maseko',   'client@cynsera.com',  '+27820002026', 'client',  'client123', 'Durban, KwaZulu-Natal',    '4001', 'sa_id',    '8501015009084', '1985-01-01', 'I need trusted young people for household and practical once-off jobs.', '[]', '["Manual","Delivery","Events"]', '[]', 15000, 4.9, true),
  ('Ayesha Naidoo',  'company@cynsera.com', '+27830002026', 'company', 'company123','Cape Town, Western Cape',  '8001', 'passport', 'A1234567',      '1988-04-12', 'Create entry-level roles, learnerships, and workshop pathways for young people.', '[]', '["Digital","Education","Events"]', '[]', 50000, 4.9, true)
on conflict (email) do nothing;
