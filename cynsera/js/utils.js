/**
 * utils.js
 * ─────────────────────────────────────────────────────
 * Global state, constants, validation helpers, and the
 * data-access layer that talks to Supabase (with a
 * localStorage fallback for offline / static preview).
 * ─────────────────────────────────────────────────────
 */

// ── Global state ─────────────────────────────────────
let currentUser        = null;
let pendingUser        = {};
let allGigs            = [];
let allUsers           = [];
let emailVerifications = [];

// Onboarding slide state
let obCurrentSlide      = 'a';
let selectedSkills      = [];
let selectedCategories  = [];
let selectedAvailability = [];

// ── Constants ─────────────────────────────────────────
const SKILL_OPTIONS = [
  'Painting', 'Cleaning', 'Carpentry', 'Plumbing', 'Electrical',
  'Driving', 'Cooking', 'Photography', 'Video Editing', 'Web Design',
  'Graphic Design', 'Data Entry', 'Social Media', 'Tutoring',
  'Welding', 'Tiling', 'Gardening', 'Security', 'Catering', 'Sewing',
];

const CATEGORY_OPTIONS = [
  { label: 'Manual Work',       value: 'Manual'    },
  { label: 'Digital Services',  value: 'Digital'   },
  { label: 'Delivery',          value: 'Delivery'  },
  { label: 'Creative',          value: 'Creative'  },
  { label: 'Education',         value: 'Education' },
  { label: 'Events',            value: 'Events'    },
];

const AVAILABILITY_OPTIONS = [
  'Weekdays', 'Weekends', 'Evenings', 'Full-time', 'Part-time', 'Flexible',
];

const SA_OFFICIAL_LANGUAGES = [
  { name: 'English',                    greeting: 'Hello',    response: 'I can guide you through gigs, client posting, verification, and training.' },
  { name: 'isiZulu',                    greeting: 'Sawubona', response: 'Ngiyakwamukela. Cynsera ikusiza ukuthola amathuba, ama-gig, nokuqeqeshwa.' },
  { name: 'isiXhosa',                   greeting: 'Molo',     response: 'Wamkelekile. Cynsera ikunceda ufumane amathuba, ii-gig, noqeqesho.' },
  { name: 'Afrikaans',                  greeting: 'Hallo',    response: 'Welkom. Cynsera help jou om geleenthede, werk en opleiding te vind.' },
  { name: 'Sepedi',                     greeting: 'Dumela',   response: 'O amogetswe. Cynsera e go thusa go hwetša mešomo, gigs le thuto.' },
  { name: 'Sesotho',                    greeting: 'Dumela',   response: 'Re a o amohela. Cynsera e o thusa ho fumana menyetla, gigs le thupelo.' },
  { name: 'Setswana',                   greeting: 'Dumela',   response: 'O amogetswe. Cynsera e go thusa go bona ditshono, gigs le katiso.' },
  { name: 'siSwati',                    greeting: 'Sawubona', response: 'Wemukelekile. Cynsera ikusita kutfola ematfuba, imisebenti, nekufundza.' },
  { name: 'Tshivenda',                  greeting: 'Ndaa',     response: 'No tanganedzwa. Cynsera i ni thusa u wana zwikhala, gigs na vhugudisi.' },
  { name: 'XiTsonga',                   greeting: 'Avuxeni',  response: 'Mi amukeriwile. Cynsera yi pfuna ku kuma mintirho, ti-gig na vuleteri.' },
  { name: 'isiNdebele',                 greeting: 'Lotjhani', response: 'Wamukelekile. Cynsera ikusiza ukuthola amathuba, ama-gig, nokuzithuthukisa.' },
  { name: 'South African Sign Language',greeting: 'SASL',     response: 'SASL text support is available here, with visual signing support planned for a future build.' },
];

const DEMO_GIGS = [
  { id: 'g1', title: 'House Painting',         description: 'Need 3 rooms painted. Paint provided. Soweto area. Must complete in 2 days.',                                                           budget: 1200, category: 'Manual',    posted_by: 'demo@cynsera.com',    location: 'Soweto, JHB',           status: 'open', applicants: [], created_at: Date.now() - 86400000 },
  { id: 'g2', title: 'WordPress Fix',           description: 'Mobile responsiveness issues on our company website. Experience in Elementor preferred.',                                               budget: 1800, category: 'Digital',   posted_by: 'john@example.com',    location: 'Remote',                status: 'open', applicants: [], created_at: Date.now() - 43200000 },
  { id: 'g3', title: 'Furniture Moving',        description: 'Help move furniture from flat to new house. JHB CBD to Braamfontein. Strong helpers needed.',                                           budget: 600,  category: 'Manual',    posted_by: 'sarah@example.com',   location: 'JHB CBD',               status: 'open', applicants: [], created_at: Date.now() -  7200000 },
  { id: 'g4', title: 'Logo Design',             description: 'Need a modern logo for new bakery business. Provide 3 concept variations in PNG + SVG.',                                                budget: 900,  category: 'Creative',  posted_by: 'bake@gmail.com',      location: 'Remote',                status: 'open', applicants: [], created_at: Date.now() -  3600000 },
  { id: 'g5', title: 'Grocery Delivery',        description: 'Pick up groceries from Pick n Pay Alex and deliver to Sandton CBD. Same day.',                                                          budget: 250,  category: 'Delivery',  posted_by: 'family@email.com',    location: 'Alexandra / Sandton',   status: 'open', applicants: [], created_at: Date.now() -  1800000 },
  { id: 'g6', title: 'Tutoring – Maths Gr 11', description: 'Weekly tutoring sessions for Grade 11 maths. Must have matric or higher. Flexible hours.',                                              budget: 500,  category: 'Education', posted_by: 'parent@school.com',   location: 'Randburg',              status: 'open', applicants: [], created_at: Date.now() -   900000 },
];

// ── Role helpers ──────────────────────────────────────
function getUserRole(user = currentUser) {
  const r = user?.role;
  if (r === 'job_seeker') return 'youth';
  if (r === 'employer')   return 'client';
  return r || 'youth';
}

const isYouthUser   = (u = currentUser) => getUserRole(u) === 'youth';
const isClientUser  = (u = currentUser) => getUserRole(u) === 'client';
const isCompanyUser = (u = currentUser) => getUserRole(u) === 'company';
const canPostWork   = (u = currentUser) => isClientUser(u) || isCompanyUser(u);

function roleLabel(user = currentUser) {
  if (isCompanyUser(user)) return 'Company';
  return isClientUser(user) ? 'Client' : 'Youth';
}

// ── UI helpers ────────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.style.cssText = [
    'display:flex;align-items:center;gap:10px;',
    'padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;',
    'animation:toast-in .3s ease forwards;',
    type === 'success'
      ? 'background:#00DC82;color:#08080C;'
      : 'background:#ef4444;color:#fff;',
  ].join('');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toast-out .3s ease forwards';
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

function createIcons() {
  if (window.lucide) lucide.createIcons();
}

function getTimeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Verification code helpers ──────────────────────────
function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── LOCAL state persistence (fallback) ───────────────
function loadLocalState() {
  allUsers           = JSON.parse(localStorage.getItem('cynsera_users'))               || [];
  allGigs            = JSON.parse(localStorage.getItem('cynsera_gigs'))                || [...DEMO_GIGS];
  currentUser        = JSON.parse(localStorage.getItem('cynsera_current_user'))        || null;
  emailVerifications = JSON.parse(localStorage.getItem('cynsera_email_verifications')) || [];
}

function saveLocalState() {
  localStorage.setItem('cynsera_users',               JSON.stringify(allUsers));
  localStorage.setItem('cynsera_gigs',                JSON.stringify(allGigs));
  localStorage.setItem('cynsera_current_user',        JSON.stringify(currentUser));
  localStorage.setItem('cynsera_email_verifications', JSON.stringify(emailVerifications));
}

function clearCurrentUser() {
  currentUser = null;
  localStorage.removeItem('cynsera_current_user');
}

// Keep the old name working (called throughout auth.js / dashboard.js)
const saveState = saveLocalState;
const loadState = loadLocalState;

// ── Supabase data layer ───────────────────────────────

/**
 * Fetch all open gigs from Supabase.
 * Falls back gracefully to the in-memory array when offline.
 */
async function fetchGigsFromDB() {
  if (!window.db) return;
  const { data, error } = await dbQuery(db =>
    db.from('gigs').select('*').eq('status', 'open').order('created_at', { ascending: false })
  );
  // Only replace the local array when Supabase actually returns rows.
  // If the table is empty (fresh project) we keep DEMO_GIGS so youth
  // users always see something to browse.
  if (!error && data && data.length > 0) {
    allGigs = data.map(normaliseGig);
  }
}

/**
 * Insert a new gig into Supabase and update local state.
 */
async function insertGigToDB(gigData) {
  // Always update local state immediately so the UI feels instant
  allGigs.unshift(gigData);
  saveLocalState();

  if (!window.db) return { ok: true };

  // Build a DB-safe payload: snake_case column names, no local-only fields,
  // and let Supabase generate the uuid id (drop our local text id).
  const dbPayload = {
    title:                   gigData.title,
    description:             gigData.description,
    budget:                  gigData.budget,
    category:                gigData.category,
    location:                gigData.location,
    posted_by:               gigData.posted_by,
    confirmed_client_name:   gigData.confirmed_client_name  || null,
    confirmed_client_phone:  gigData.confirmed_client_phone || null,
    confirmed_client_selfie: gigData.confirmed_client_selfie|| null,
    status:                  gigData.status || 'open',
    applicants:              gigData.applicants || [],
    application_details:     gigData.applicationDetails || [],
  };

  const { data, error } = await dbQuery(db =>
    db.from('gigs').insert([dbPayload]).select().single()
  );

  if (!error && data) {
    // Replace the local temp entry with the DB-returned row (which has the real uuid)
    const tempIdx = allGigs.findIndex(g => g.id === gigData.id);
    if (tempIdx >= 0) allGigs[tempIdx] = normaliseGig(data);
    saveLocalState();
    return { ok: true };
  }
  return { ok: false, message: error?.message || 'Could not save gig.' };
}

/**
 * Persist a gig update (applicants list) back to Supabase.
 */
async function updateGigInDB(gigId, patch) {
  // Apply patch to local state immediately
  const idx = allGigs.findIndex(g => g.id === gigId);
  if (idx >= 0) Object.assign(allGigs[idx], patch);
  saveLocalState();

  if (!window.db) return { ok: true };

  // Remap any camelCase keys the caller might pass to their DB snake_case equivalents
  const dbPatch = { ...patch };
  if ('applicationDetails' in dbPatch) {
    dbPatch.application_details = dbPatch.applicationDetails;
    delete dbPatch.applicationDetails;
  }

  const { error } = await dbQuery(db =>
    db.from('gigs').update(dbPatch).eq('id', gigId)
  );
  return error ? { ok: false, message: error.message } : { ok: true };
}

/**
 * Save a new user to Supabase.
 * NOTE: Passwords should be hashed server-side in production.
 * For this prototype the plaintext password is stored (mirroring
 * the existing localStorage approach) – flag for production upgrade.
 */
async function insertUserToDB(userData) {
  if (!window.db) {
    allUsers.push(userData);
    saveLocalState();
    return { ok: true };
  }
  // Avoid storing plaintext passwords in the DB in future – use Supabase Auth instead.
  const { data, error } = await dbQuery(db =>
    db.from('users').insert([userData]).select().single()
  );
  if (!error && data) {
    allUsers.push(normaliseUser(data));
    return { ok: true };
  }
  return { ok: false, message: error?.message || 'Could not create account.' };
}

/**
 * Lookup a user by email from Supabase.
 */
async function fetchUserByEmail(email) {
  if (!window.db) {
    return allUsers.find(u => u.email === email) || null;
  }
  const { data, error } = await dbQuery(db =>
    db.from('users').select('*').eq('email', email).maybeSingle()
  );
  if (!error && data) return normaliseUser(data);
  return null;
}

/**
 * Update a user record in Supabase.
 */
async function updateUserInDB(email, patch) {
  if (!window.db) {
    const idx = allUsers.findIndex(u => u.email === email);
    if (idx >= 0) Object.assign(allUsers[idx], patch);
    if (currentUser?.email === email) Object.assign(currentUser, patch);
    saveLocalState();
    return { ok: true };
  }
  const { error } = await dbQuery(db =>
    db.from('users').update(patch).eq('email', email)
  );
  return error ? { ok: false, message: error.message } : { ok: true };
}

// ── Email verification (Supabase table) ───────────────
async function requestEmailVerification(email, purpose = 'signup') {
  const code    = generateVerificationCode();
  const record  = {
    email:      String(email || '').toLowerCase(),
    purpose,
    code,
    status:     'pending',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };

  if (window.db) {
    // Expire any existing pending records first
    await dbQuery(db =>
      db.from('email_verifications')
        .update({ status: 'expired' })
        .eq('email', record.email)
        .eq('purpose', purpose)
        .eq('status', 'pending')
    );
    const { data, error } = await dbQuery(db =>
      db.from('email_verifications').insert([record]).select().single()
    );
    if (!error && data) {
      return { ok: true, mode: 'supabase', verificationId: data.id, devCode: code };
    }
  }

  // Local fallback
  emailVerifications = emailVerifications.filter(
    v => !(v.email === record.email && v.purpose === purpose && v.status === 'pending')
  );
  const localRecord = { ...record, id: 'ver_' + Date.now() };
  emailVerifications.push(localRecord);
  saveLocalState();
  return { ok: true, mode: 'browser', verificationId: localRecord.id, devCode: code };
}

async function confirmEmailVerification(email, code, purpose = 'signup') {
  const normEmail = String(email || '').toLowerCase();

  if (window.db) {
    const { data, error } = await dbQuery(db =>
      db.from('email_verifications')
        .select('*')
        .eq('email', normEmail)
        .eq('purpose', purpose)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    if (error || !data) return { ok: false, message: 'No active verification record found.' };
    if (new Date(data.expires_at) < new Date()) {
      await dbQuery(db => db.from('email_verifications').update({ status: 'expired' }).eq('id', data.id));
      return { ok: false, message: 'Verification code expired. Please request a new one.' };
    }
    if (data.code !== String(code || '').trim()) {
      return { ok: false, message: 'That code does not match.' };
    }
    await dbQuery(db =>
      db.from('email_verifications')
        .update({ status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', data.id)
    );
    return { ok: true, record: data };
  }

  // Local fallback
  const record = [...emailVerifications].reverse().find(
    v => v.email === normEmail && v.purpose === purpose && v.status === 'pending'
  );
  if (!record) return { ok: false, message: 'No active verification record was found for this email.' };
  if (Date.now() > new Date(record.expires_at).getTime()) {
    record.status = 'expired';
    saveLocalState();
    return { ok: false, message: 'This verification code expired. Please go back and request a new one.' };
  }
  if (record.code !== String(code || '').trim()) {
    return { ok: false, message: 'That code does not match the CynseraDB verification record.' };
  }
  record.status      = 'verified';
  record.verified_at = new Date().toISOString();
  saveLocalState();
  return { ok: true, record };
}

// ── Row normalisers ───────────────────────────────────
// Supabase returns snake_case; keep internal names consistent.
function normaliseGig(row) {
  return {
    id:                       row.id,
    title:                    row.title,
    description:              row.description,
    budget:                   Number(row.budget),
    category:                 row.category,
    location:                 row.location,
    posted_by:                row.posted_by,
    status:                   row.status || 'open',
    applicants:               row.applicants              || [],
    applicationDetails:       row.application_details     || [],
    confirmed_client_name:    row.confirmed_client_name   || '',
    confirmed_client_phone:   row.confirmed_client_phone  || '',
    confirmed_client_selfie:  row.confirmed_client_selfie || '',
    created_at:               row.created_at
      ? new Date(row.created_at).getTime()
      : Date.now(),
  };
}

function normaliseUser(row) {
  return {
    full_name:      row.full_name      || '',
    email:          row.email          || '',
    phone:          row.phone          || '',
    role:           row.role           || 'youth',
    password:       row.password       || '',   // ⚠️ prototype only
    location:       row.location       || '',
    province:       row.province       || '',
    postal_code:    row.postal_code    || '',
    id_type:        row.id_type        || '',
    identity_number:row.identity_number|| '',
    date_of_birth:  row.date_of_birth  || '',
    bio:            row.bio            || '',
    skills:         row.skills         || [],
    categories:     row.categories     || [],
    availability:   row.availability   || [],
    rate:           row.rate           || '',
    rate_period:    row.rate_period    || 'per_gig',
    balance:        Number(row.balance || 0),
    rating:         Number(row.rating  || 0),
    verified:       Boolean(row.verified),
    organisation:   row.organisation   || '',
    industry:       row.industry       || '',
    company_role:   row.company_role   || '',
    hiring_goal:    row.hiring_goal    || '',
    client_job_need:row.client_job_need|| '',
    client_type:    row.client_type    || '',
    hiring_frequency:row.hiring_frequency || '',
    average_budget: row.average_budget || '',
    safety_notes:   row.safety_notes   || '',
    verification:   row.verification   || null,
  };
}

// ── Bootstrap ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalState();        // always seed from localStorage first (instant)
  await fetchGigsFromDB(); // then refresh gigs from Supabase if available
  createIcons();
});
