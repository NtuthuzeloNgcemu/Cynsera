
const SUPABASE_URL  = window.CYNSERA_CONFIG?.supabaseUrl  || '';
const SUPABASE_ANON = window.CYNSERA_CONFIG?.supabaseAnon || '';

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
