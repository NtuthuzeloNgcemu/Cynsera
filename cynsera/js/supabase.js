/**
 * supabase.js
 * Single source of truth for the Supabase client.
 * Import this before any module that needs `window.db`.
 *
 * Tables expected in your Supabase project:
 *   users          – id, email, full_name, phone, role, password_hash,
 *                    location, province, postal_code, id_type,
 *                    identity_number, date_of_birth, bio, skills (jsonb),
 *                    categories (jsonb), availability (jsonb),
 *                    rate, rate_period, balance, rating, verified,
 *                    organisation, industry, company_role, hiring_goal,
 *                    client_job_need, client_type, hiring_frequency,
 *                    average_budget, safety_notes, verification (jsonb),
 *                    created_at
 *
 *   gigs           – id, title, description, budget, category, location,
 *                    posted_by (email), status, applicants (jsonb),
 *                    application_details (jsonb),
 *                    confirmed_client_name, confirmed_client_phone,
 *                    confirmed_client_selfie, created_at
 *
 *   email_verifications – id, email, purpose, code, status,
 *                         created_at, expires_at, verified_at
 *
 * Row Level Security (RLS) notes:
 *   - Enable RLS on all tables.
 *   - users: allow INSERT for anon; SELECT/UPDATE only for auth.uid() match
 *     (or use the anon key carefully and handle auth in JS for the prototype).
 *   - gigs: allow SELECT for all; INSERT/UPDATE for verified users only.
 *   - email_verifications: allow INSERT/SELECT/UPDATE for anon (prototype only).
 */

const SUPABASE_URL  = 'https://clrduskcinnnhmmpsruw.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscmR1c2tjaW5ubmhtbXBzcnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NjgwNTgsImV4cCI6MjA5NDU0NDA1OH0.2LLT8bqZmcNxaiVlaoTxJq5knP9-4YT1cwlOBcr5Rtk';

// Guard: supabase-js CDN must be loaded before this script.
if (!window.supabase) {
  console.error('[Cynsera] Supabase JS SDK not found. Add the CDN script before supabase.js.');
}

window.db = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

/**
 * Thin helper – runs a Supabase query and returns { data, error }.
 * Logs errors to the console in development.
 */
async function dbQuery(fn) {
  if (!window.db) return { data: null, error: { message: 'Supabase not initialised.' } };
  try {
    const result = await fn(window.db);
    if (result.error) console.warn('[Cynsera DB]', result.error.message);
    return result;
  } catch (err) {
    console.error('[Cynsera DB] Unexpected error:', err);
    return { data: null, error: err };
  }
}
