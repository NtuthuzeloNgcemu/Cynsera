/**
 * dashboard.js
 * ─────────────────────────────────────────────────────
 * Dashboard init, tab routing, profile population,
 * application views, and logout.
 * Depends on: utils.js, gigs.js
 * ─────────────────────────────────────────────────────
 */

async function initDashboard() {
  if (!currentUser) {
    window.location.href = 'auth.html?tab=login';
    return;
  }

  // Normalise legacy role names
  currentUser.role = getUserRole(currentUser);

  // Refresh gigs from Supabase (utils.js already did this on DOMContentLoaded,
  // but re-fetch in case the dashboard loads after a short delay)
  await fetchGigsFromDB();

  document.getElementById('dash-username').textContent = currentUser.full_name.split(' ')[0];
  applyRoleDashboard();
  populateProfile();
  goToTab(canPostWork() ? 'post-gig' : 'browse');
  renderGigs();
  showToast('Welcome, ' + currentUser.full_name + '.', 'success');
}

// ── Role-specific copy / visibility ──────────────────
function applyRoleDashboard() {
  const client  = isClientUser();
  const company = isCompanyUser();
  const poster  = canPostWork();

  document.getElementById('dash-role-subtitle').textContent = company
    ? 'Company Opportunity Hub' : client ? 'Client Job Hub' : 'Youth Opportunity Hub';

  document.getElementById('dashboard-hero-title').textContent = company
    ? 'Post company opportunities, review youth talent, and build pathways.'
    : client
    ? 'Post safe practical jobs, review applicants, and support youth growth.'
    : 'Find gigs, track applications, and grow your work profile.';

  document.getElementById('dashboard-hero-copy').textContent = company
    ? 'Your dashboard is focused on corporate roles, learnerships, workshops, applicant trust, and youth development.'
    : client
    ? 'Your dashboard is focused on practical job requests, safety, payment clarity, and trusted youth applicants.'
    : 'Your dashboard is focused on finding work, building proof of skill, and keeping every application easy to follow.';

  document.getElementById('dashboard-trust-title').textContent = company
    ? 'Company verification active' : client ? 'Client verification active' : 'Youth verification active';

  document.getElementById('dashboard-trust-copy').textContent = company
    ? 'Company proof, representative identity, and authority checks help youth trust corporate opportunities.'
    : client
    ? 'Client identity, selfie checks, and address validation help youth know who is requesting the work.'
    : 'Profile checks, selfie uploads, and document validation help clients trust your applications.';

  // Show/hide sidebar tabs by role
  document.querySelectorAll('[data-role-view]').forEach(el => {
    const view = el.dataset.roleView;
    el.classList.toggle('hidden', !(view === 'both' || view === (poster ? 'client' : 'youth')));
  });

  // Applications section labels
  document.getElementById('applications-kicker').textContent = poster ? 'Applicant Review'   : 'Application Tracking';
  document.getElementById('applications-title').textContent  = company ? 'Youth Candidates'  : client ? 'Youth Applicants' : 'My Applications';
  document.getElementById('applications-copy').textContent   = company
    ? 'Review youth users who applied for your company opportunities.'
    : client
    ? 'Review youth users who applied to your practical jobs.'
    : 'Follow every gig you have applied for.';
}

// ── Tab routing ───────────────────────────────────────
function goToTab(tab) {
  // Guard redirects
  if (tab === 'post-gig'  && !canPostWork()) { showToast('Youth profiles cannot post gigs.', 'error'); tab = 'browse'; }
  if (tab === 'browse'    && canPostWork())   tab = 'post-gig';
  if (tab === 'training'  && canPostWork())   tab = 'applications';

  document.querySelectorAll('.dtab').forEach(d => d.classList.add('hidden'));
  document.getElementById('tab-' + tab)?.classList.remove('hidden');

  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active-tab'));
  document.querySelectorAll(`.nav-tab[data-tab="${tab}"]`).forEach(b => b.classList.add('active-tab'));

  if (tab === 'applications') renderApplications();
  if (tab === 'payments')     updatePaymentBalance();
  if (tab === 'profile')      populateProfile();
  createIcons();
}

// ── Applications ──────────────────────────────────────
function renderApplications() {
  const list = document.getElementById('applications-list');
  if (!list || !currentUser) return;
  canPostWork() ? renderClientApplicants(list) : renderYouthApplications(list);
}

function renderYouthApplications(list) {
  const applied = allGigs.filter(g => (g.applicants || []).includes(currentUser.email));
  if (applied.length === 0) {
    list.innerHTML = emptyState('No applications yet. Browse gigs and apply when you find the right fit.', "goToTab('browse')", 'Browse Gigs');
    createIcons();
    return;
  }
  list.innerHTML = applied.map(g => {
    const details = (g.applicationDetails || []).find(a => a.email === currentUser.email);
    return `
      <div class="application-card">
        <div>
          <h3>${escapeHtml(g.title)}</h3>
          <p>${escapeHtml(g.location)} – ${escapeHtml(g.category)}</p>
          <strong>R${Number(g.budget).toLocaleString()}</strong>
          ${details ? `
            <div class="application-meta">
              <span>Supporting document: ${escapeHtml(details.supportingFile || 'Submitted')}</span>
              <span>Safety selfie: ${escapeHtml(details.selfieFile || 'Submitted')}</span>
              <span>Note: ${escapeHtml(details.note || '–')}</span>
            </div>` : ''}
        </div>
        <span class="status-pill">Pending</span>
      </div>`;
  }).join('');
  createIcons();
}

function renderClientApplicants(list) {
  const posted = allGigs.filter(g => g.posted_by === currentUser.email);
  if (posted.length === 0) {
    list.innerHTML = emptyState('You have not posted work yet.', "goToTab('post-gig')", 'Post Work');
    createIcons();
    return;
  }
  const rows = posted.flatMap(g => (g.applicationDetails || []).map(a => ({ gig: g, applicant: a })));
  if (rows.length === 0) {
    list.innerHTML = emptyState('No youth applicants yet. Your posted gigs will appear here once people apply.', "goToTab('post-gig')", 'Post Another Gig');
    createIcons();
    return;
  }
  list.innerHTML = rows.map(({ gig, applicant }) => `
    <div class="application-card client-applicant-card">
      <div>
        <h3>${escapeHtml(applicant.confirmedName || applicant.email)}</h3>
        <p>Applied for ${escapeHtml(gig.title)} – ${escapeHtml(gig.location)}</p>
        <strong>${escapeHtml(applicant.confirmedPhone || applicant.email)}</strong>
        <div class="application-meta">
          <span>Supporting document: ${escapeHtml(applicant.supportingFile || 'Submitted')}</span>
          <span>Safety selfie: ${escapeHtml(applicant.selfieFile || 'Submitted')}</span>
          <span>Application note: ${escapeHtml(applicant.note || 'No note')}</span>
        </div>
      </div>
      <span class="status-pill">Review</span>
    </div>
  `).join('');
  createIcons();
}

function emptyState(text, onclick, btnLabel) {
  return `
    <div class="empty-state">
      <p>${text}</p>
      <button onclick="${onclick}">${btnLabel}</button>
    </div>`;
}

// ── Profile ───────────────────────────────────────────
function populateProfile() {
  if (!currentUser) return;
  const poster  = canPostWork();
  const company = isCompanyUser();
  const client  = isClientUser();

  document.getElementById('profile-name').textContent       = company ? (currentUser.organisation || currentUser.full_name || '–') : (currentUser.full_name || '–');
  document.getElementById('profile-role-label').textContent = roleLabel();
  document.getElementById('profile-email').textContent      = currentUser.email    || '–';
  document.getElementById('profile-phone').textContent      = currentUser.phone    || '–';
  document.getElementById('profile-location').textContent   = currentUser.location || '–';
  document.getElementById('profile-bio').value              = currentUser.bio || currentUser.hiring_goal || '';
  document.getElementById('profile-bio-label').textContent  = company ? 'Company Youth Goal' : client ? 'Client Purpose' : 'Bio';
  document.getElementById('profile-rating').textContent     = (currentUser.rating || 0).toFixed(1);
  document.getElementById('stat-balance').textContent       = 'R' + (currentUser.balance || 0).toLocaleString();

  // Skills
  const skillsWrap = document.getElementById('profile-skills-display')?.closest('div');
  const skillsEl   = document.getElementById('profile-skills-display');
  if (skillsWrap) skillsWrap.classList.toggle('hidden', poster);
  if (skillsEl && !poster) {
    const skills = currentUser.skills || [];
    skillsEl.innerHTML = skills.length
      ? skills.map(s => `<span class="skill-tag selected" style="font-size:11px;padding:6px 12px;">${escapeHtml(s)}</span>`).join('')
      : '<span class="text-xs" style="color:#68758a;">No skills added yet</span>';
  }

  // Client/Company extra fields
  const extra = document.getElementById('client-profile-extra');
  if (extra) {
    extra.classList.toggle('hidden', !poster);
    if (poster) {
      extra.innerHTML = `
        <div class="client-profile-grid">
          <div><span>${company ? 'Representative' : 'Requester'}</span><strong>${escapeHtml(currentUser.full_name || '–')}</strong></div>
          <div><span>${company ? 'Organisation'  : 'Usual Need'}</span><strong>${escapeHtml(company ? (currentUser.organisation || '–') : (currentUser.client_job_need || 'Practical jobs'))}</strong></div>
          <div><span>Hiring Frequency</span><strong>${escapeHtml(currentUser.hiring_frequency || '–')}</strong></div>
          <div><span>Average Budget</span><strong>R${Number(currentUser.average_budget || 0).toLocaleString()}</strong></div>
        </div>
        <div class="skills-display mt-3">
          ${(currentUser.categories || []).map(c => `<span class="skill-tag selected" style="font-size:11px;padding:6px 12px;">${escapeHtml(c)}</span>`).join('') || '<span class="text-xs" style="color:#68758a;">No categories added yet</span>'}
        </div>`;
    }
  }

  // Stats — labels and values differ per role
  const myGigs       = allGigs.filter(g => g.posted_by === currentUser.email).length;
  const myApps       = allGigs.filter(g => (g.applicants || []).includes(currentUser.email)).length;
  const receivedApps = allGigs
    .filter(g => g.posted_by === currentUser.email)
    .reduce((sum, g) => sum + (g.applicationDetails || []).length, 0);

  if (poster) {
    // Client / Company: show gigs posted + applicants received
    document.getElementById('stat-gigs').textContent = myGigs;
    document.getElementById('stat-apps').textContent = receivedApps;
    // Relabel the stat cards for posters
    const gigStatLabel = document.querySelector('#stat-gigs + span');
    const appStatLabel = document.querySelector('#stat-apps + span');
    if (gigStatLabel) gigStatLabel.textContent = 'Gigs Posted';
    if (appStatLabel) appStatLabel.textContent = 'Applicants';
  } else {
    // Youth: show skills count + gigs applied for
    document.getElementById('stat-gigs').textContent = (currentUser.skills || []).length;
    document.getElementById('stat-apps').textContent = myApps;
    const gigStatLabel = document.querySelector('#stat-gigs + span');
    const appStatLabel = document.querySelector('#stat-apps + span');
    if (gigStatLabel) gigStatLabel.textContent = 'Skills';
    if (appStatLabel) appStatLabel.textContent = 'Applied';
  }
  createIcons();
}

// ── Save profile ──────────────────────────────────────
async function saveProfile() {
  if (!currentUser) return;
  const bio = document.getElementById('profile-bio').value;
  currentUser.bio = bio;
  if (canPostWork()) currentUser.hiring_goal = bio;

  const result = await updateUserInDB(currentUser.email, { bio, hiring_goal: canPostWork() ? bio : undefined });
  if (!result.ok) showToast('Profile saved locally — DB sync failed.', 'error');

  const idx = allUsers.findIndex(u => u.email === currentUser.email);
  if (idx >= 0) allUsers[idx] = currentUser;
  saveLocalState();
  showToast('Profile saved.', 'success');
}

// ── Logout ────────────────────────────────────────────
function handleLogout() {
  clearCurrentUser();
  window.location.href = 'index.html';
}

// ── Inline escapeHtml (also available from gigs.js,
//    but keeping a local copy avoids load-order issues) ─
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Bootstrap ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initDashboard);
