/**
 * gigs.js
 * ─────────────────────────────────────────────────────
 * Gig rendering, filtering, the apply modal, and
 * the post-gig form with identity confirmation.
 * Depends on: utils.js
 * ─────────────────────────────────────────────────────
 */

let activeGigId = null;

// ── Phone / name comparison helpers ───────────────────
function normalisePhoneForCompare(value) {
  const raw    = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+') && digits.startsWith('27')) return '+27' + digits.slice(2);
  if (digits.length === 10 && digits.startsWith('0')) return '+27' + digits.slice(1);
  if (digits.length === 9)  return '+27' + digits;
  return raw.startsWith('+') ? '+' + digits : digits;
}

function normaliseNameForCompare(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function identityMatchesCurrentUser(name, phone) {
  return (
    normaliseNameForCompare(name)  === normaliseNameForCompare(currentUser?.full_name) &&
    normalisePhoneForCompare(phone) === normalisePhoneForCompare(currentUser?.phone)
  );
}

// ── File helpers ──────────────────────────────────────
function isImageFile(file) {
  if (!file) return false;
  const ext = (file.name || '').split('.').pop().toLowerCase();
  return ['jpg','jpeg','png','webp'].includes(ext) || ['image/jpeg','image/png','image/webp'].includes(file.type);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Category colour map ───────────────────────────────
const CATEGORY_COLORS = {
  Manual:    { bg: 'rgba(0,220,130,.12)',   color: '#00DC82' },
  Digital:   { bg: 'rgba(0,71,255,.12)',    color: '#5B8DEF' },
  Delivery:  { bg: 'rgba(54,228,218,.12)',  color: '#36E4DA' },
  Creative:  { bg: 'rgba(255,167,0,.12)',   color: '#FFA700' },
  Education: { bg: 'rgba(168,85,247,.12)',  color: '#a855f7' },
  Events:    { bg: 'rgba(236,72,153,.12)',  color: '#ec4899' },
};

function getGigCategoryColors(category) {
  return CATEGORY_COLORS[category] || { bg: 'rgba(136,136,160,.1)', color: '#8888A0' };
}

// ── Render gig grid ───────────────────────────────────
function renderGigs(gigsToRender) {
  const list = document.getElementById('gigs-list');
  if (!list) return;

  const source = gigsToRender || allGigs;
  if (source.length === 0) {
    list.innerHTML = '<p class="col-span-3 text-center py-12 text-sm" style="color:#8888A0;">No gigs found. Try adjusting your search.</p>';
    return;
  }

  list.innerHTML = source.map(g => {
    const cc      = getGigCategoryColors(g.category);
    const applied = currentUser && (g.applicants || []).includes(currentUser.email);
    return `
      <div class="gig-card">
        <div class="flex items-start justify-between mb-4">
          <span class="text-xs font-700 px-3 py-1 rounded-full" style="background:${cc.bg};color:${cc.color};">${escapeHtml(g.category)}</span>
          <span class="text-xs" style="color:#68758a;">${getTimeAgo(g.created_at)}</span>
        </div>
        <h3>${escapeHtml(g.title)}</h3>
        <p>${escapeHtml(g.description).substring(0, 110)}${g.description.length > 100 ? '…' : ''}</p>
        <div class="flex items-center gap-2 mb-4 text-xs" style="color:#68758a;">
          <i data-lucide="map-pin" style="width:12px;height:12px;"></i>
          <span>${escapeHtml(g.location)}</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="gig-price">R${Number(g.budget).toLocaleString()}</span>
          ${canPostWork()
            ? `<span class="applied-pill">${roleLabel()} view</span>`
            : applied
            ? '<span class="applied-pill">Applied</span>'
            : `<button onclick="openGigDetails('${g.id}')" class="gig-action">View &amp; Apply</button>`
          }
        </div>
      </div>`;
  }).join('');

  createIcons();
}

// ── Gig filter ────────────────────────────────────────
function filterGigs() {
  const q   = (document.getElementById('search-gigs')?.value || '').toLowerCase();
  const cat = document.getElementById('filter-category')?.value || '';
  renderGigs(allGigs.filter(g => {
    const matchQ   = !q   || [g.title, g.description, g.location].some(f => f.toLowerCase().includes(q));
    const matchCat = !cat || g.category === cat;
    return matchQ && matchCat;
  }));
}

// ── Gig details modal ─────────────────────────────────
function ensureGigDetailsModal() {
  if (document.getElementById('gig-details-modal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="gig-details-modal" class="gig-modal-backdrop hidden">
      <div class="gig-modal">
        <div class="p-6" style="border-bottom:1px solid rgba(136,136,160,.1);">
          <div class="flex items-start justify-between gap-4">
            <div>
              <span id="gig-modal-category" class="text-xs font-700 px-3 py-1 rounded-full"></span>
              <h2 id="gig-modal-title" class="font-display font-800 text-2xl mt-4 mb-2" style="color:#E8E8ED;"></h2>
              <p id="gig-modal-location" class="text-sm" style="color:#8888A0;"></p>
            </div>
            <button onclick="closeGigDetails()" class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(255,255,255,.06);color:#8888A0;">
              <i data-lucide="x" style="width:18px;height:18px;"></i>
            </button>
          </div>
        </div>
        <div class="p-6 space-y-5">
          <div class="grid md:grid-cols-3 gap-3">
            <div class="gig-modal-section"><p class="text-xs mb-1" style="color:#8888A0;">Budget</p>     <p id="gig-modal-budget"     class="font-display font-800 text-xl" style="color:#00DC82;"></p></div>
            <div class="gig-modal-section"><p class="text-xs mb-1" style="color:#8888A0;">Applicants</p> <p id="gig-modal-applicants" class="font-display font-800 text-xl" style="color:#36E4DA;"></p></div>
            <div class="gig-modal-section"><p class="text-xs mb-1" style="color:#8888A0;">Posted</p>     <p id="gig-modal-posted"     class="font-display font-800 text-xl" style="color:#5B8DEF;"></p></div>
          </div>
          <div class="gig-modal-section">
            <h3 class="font-display font-700 text-lg mb-2" style="color:#E8E8ED;">Gig Information</h3>
            <p id="gig-modal-description" class="text-sm leading-relaxed" style="color:#A7A7B8;"></p>
          </div>
          <div class="gig-modal-section">
            <h3 class="font-display font-700 text-lg mb-3" style="color:#E8E8ED;">Before You Apply</h3>
            <div class="space-y-2 text-sm" style="color:#A7A7B8;">
              <p><span class="file-chip">1</span> Read the full gig details and confirm you can do the work.</p>
              <p><span class="file-chip">2</span> Upload one supporting PDF – CV, certificate, or work profile.</p>
              <p><span class="file-chip">3</span> Add a short note explaining why you are suitable.</p>
            </div>
          </div>
          <div class="gig-modal-section">
            <h3 class="font-display font-700 text-lg mb-3" style="color:#E8E8ED;">Confirm Your Identity</h3>
            <p class="text-xs mb-4" style="color:#8888A0;">Enter the same name and phone number used on your Cynsera profile.</p>
            <div class="grid md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold mb-2" style="color:#8888A0;">Full Name</label>
                <input id="gig-applicant-name" type="text" placeholder="Your full name" class="w-full px-4 py-3 rounded-xl text-sm" style="background:rgba(255,255,255,.04);border:1px solid rgba(136,136,160,.15);color:#E8E8ED;">
              </div>
              <div>
                <label class="block text-xs font-semibold mb-2" style="color:#8888A0;">Phone Number</label>
                <input id="gig-applicant-phone" type="tel" placeholder="071 000 0000" class="w-full px-4 py-3 rounded-xl text-sm" style="background:rgba(255,255,255,.04);border:1px solid rgba(136,136,160,.15);color:#E8E8ED;">
              </div>
            </div>
            <label class="block text-xs font-semibold mb-2 mt-4" style="color:#8888A0;">Short Application Note</label>
            <textarea id="gig-application-note" placeholder="Tell the client why you are a good fit…" class="w-full px-4 py-3 rounded-xl text-sm" style="background:rgba(255,255,255,.04);border:1px solid rgba(136,136,160,.15);color:#E8E8ED;min-height:92px;resize:none;"></textarea>
            <label class="upload-card mt-4">
              <span class="upload-title">Safety selfie</span>
              <span class="upload-help">JPG, PNG, or WEBP — confirms the applicant is the profile holder.</span>
              <input id="gig-application-selfie" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onchange="validateApplicationSelfie(false)">
              <span id="gig-application-selfie-status" class="validation-hint field-neutral">No selfie selected.</span>
            </label>
            <label class="upload-card mt-4">
              <span class="upload-title">Supporting document</span>
              <span class="upload-help">PDF only.</span>
              <input id="gig-application-file" type="file" accept="application/pdf,.pdf" onchange="validateApplicationFile(false)">
              <span id="gig-application-file-status" class="validation-hint field-neutral">No file selected.</span>
            </label>
            <label class="flex items-start gap-3 mt-4 text-sm" style="color:#A7A7B8;">
              <input id="gig-application-confirm" type="checkbox" class="mt-1">
              <span>I confirm availability and understand I may need to submit completion proof.</span>
            </label>
            <div id="gig-application-error" class="hidden text-xs p-3 rounded-lg mt-4" style="background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);"></div>
            <button onclick="submitGigApplication()" class="w-full mt-5 py-3 rounded-xl font-display font-700 text-sm" style="background:#00DC82;color:#08080C;">Submit Application</button>
          </div>
        </div>
      </div>
    </div>
  `);
  createIcons();
}

function openGigDetails(gigId) {
  if (!currentUser)    return showToast('Please log in first.', 'error');
  if (canPostWork())   return showToast('Client and Company accounts post work — Youth accounts apply.', 'error');
  const gig = allGigs.find(g => g.id === gigId);
  if (!gig) return;

  activeGigId = gigId;
  ensureGigDetailsModal();

  const cc = getGigCategoryColors(gig.category);
  const catEl = document.getElementById('gig-modal-category');
  catEl.textContent       = gig.category;
  catEl.style.background  = cc.bg;
  catEl.style.color       = cc.color;

  document.getElementById('gig-modal-title').textContent       = gig.title;
  document.getElementById('gig-modal-location').textContent    = gig.location;
  document.getElementById('gig-modal-budget').textContent      = 'R' + Number(gig.budget).toLocaleString();
  document.getElementById('gig-modal-applicants').textContent  = String((gig.applicants || []).length);
  document.getElementById('gig-modal-posted').textContent      = getTimeAgo(gig.created_at);
  document.getElementById('gig-modal-description').textContent = gig.description;
  document.getElementById('gig-applicant-name').value          = currentUser?.full_name || '';
  document.getElementById('gig-applicant-phone').value         = currentUser?.phone     || '';
  document.getElementById('gig-application-note').value        = '';
  document.getElementById('gig-application-file').value        = '';
  document.getElementById('gig-application-selfie').value      = '';
  document.getElementById('gig-application-confirm').checked   = false;
  document.getElementById('gig-application-error').classList.add('hidden');

  resetFileStatus('gig-application-selfie-status', 'No selfie selected.');
  resetFileStatus('gig-application-file-status',   'No file selected.');

  document.getElementById('gig-details-modal').classList.remove('hidden');
}

function closeGigDetails() {
  document.getElementById('gig-details-modal')?.classList.add('hidden');
  activeGigId = null;
}

function resetFileStatus(id, text) {
  const el = document.getElementById(id);
  if (el) { el.textContent = text; el.className = 'validation-hint field-neutral'; }
}

// ── File validators ───────────────────────────────────
function validateApplicationFile(showError = false) {
  const input  = document.getElementById('gig-application-file');
  const status = document.getElementById('gig-application-file-status');
  const file   = input?.files?.[0];
  if (!file) {
    if (showError) { status.textContent = 'Upload one supporting PDF before applying.'; status.className = 'validation-hint field-bad'; }
    return false;
  }
  const ext   = (file.name || '').split('.').pop().toLowerCase();
  const valid = file.type === 'application/pdf' || ext === 'pdf';
  status.textContent = valid ? `Validated: ${file.name}` : 'Only PDF documents are accepted.';
  status.className   = 'validation-hint ' + (valid ? 'field-good' : 'field-bad');
  return valid;
}

function validateApplicationSelfie(showError = false) {
  const input  = document.getElementById('gig-application-selfie');
  const status = document.getElementById('gig-application-selfie-status');
  const file   = input?.files?.[0];
  if (!file) {
    if (showError) { status.textContent = 'Upload a selfie image before applying.'; status.className = 'validation-hint field-bad'; }
    return false;
  }
  const valid = isImageFile(file);
  status.textContent = valid ? `Validated: ${file.name}` : 'Only JPG, PNG, or WEBP images are accepted.';
  status.className   = 'validation-hint ' + (valid ? 'field-good' : 'field-bad');
  return valid;
}

// ── Submit application ────────────────────────────────
async function submitGigApplication() {
  if (!currentUser) return showToast('Please log in first.', 'error');

  const gig       = allGigs.find(g => g.id === activeGigId);
  if (!gig) return;

  const errorEl       = document.getElementById('gig-application-error');
  const applicantName = document.getElementById('gig-applicant-name').value.trim();
  const applicantPhone= document.getElementById('gig-applicant-phone').value.trim();
  const note          = document.getElementById('gig-application-note').value.trim();
  const confirmed     = document.getElementById('gig-application-confirm').checked;
  errorEl.classList.add('hidden');

  if ((gig.applicants || []).includes(currentUser.email))
    return showInlineError(errorEl, 'You have already applied for this gig.');
  if (!identityMatchesCurrentUser(applicantName, applicantPhone))
    return showInlineError(errorEl, 'Your name and phone must match your verified Cynsera profile.');
  if (note.length < 20)
    return showInlineError(errorEl, 'Please write an application note of at least 20 characters.');
  if (!validateApplicationFile(true))
    return showInlineError(errorEl, 'Please upload a valid PDF supporting document.');
  if (!validateApplicationSelfie(true))
    return showInlineError(errorEl, 'Please upload a valid selfie image.');
  if (!confirmed)
    return showInlineError(errorEl, 'Please confirm your availability before applying.');

  const file   = document.getElementById('gig-application-file').files[0];
  const selfie = document.getElementById('gig-application-selfie').files[0];

  const newApplicants  = [...(gig.applicants || []), currentUser.email];
  const newDetails     = [...(gig.applicationDetails || []), {
    email:          currentUser.email,
    confirmedName:  applicantName,
    confirmedPhone: normalisePhoneForCompare(applicantPhone),
    note,
    supportingFile: file.name,
    selfieFile:     selfie.name,
    applied_at:     Date.now(),
    status:         'pending',
  }];

  const result = await updateGigInDB(gig.id, {
    applicants:          newApplicants,
    application_details: newDetails,
  });

  if (!result.ok) {
    showToast('Application saved locally — database sync failed.', 'error');
  }

  // Update local state
  gig.applicants          = newApplicants;
  gig.applicationDetails  = newDetails;
  saveLocalState();

  closeGigDetails();
  filterGigs();
  showToast('Application submitted with your supporting document.', 'success');
}

function showInlineError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ── Post gig ──────────────────────────────────────────
function setupPostGigIdentityFields() {
  if (!canPostWork()) return;
  if (document.getElementById('client-confirm-name')) return;
  const errorEl = document.getElementById('post-gig-error');
  if (!errorEl) return;

  errorEl.insertAdjacentHTML('beforebegin', `
    <div class="gig-modal-section">
      <h3 class="font-display font-700 text-lg mb-3" style="color:#E8E8ED;">Confirm Requester Identity</h3>
      <p class="text-xs mb-4" style="color:#8888A0;">Confirm you are the verified Cynsera account holder posting this work.</p>
      <div class="grid md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold mb-2" style="color:#8888A0;">Full Name</label>
          <input id="client-confirm-name" type="text" placeholder="Your full name" class="w-full px-4 py-3 rounded-xl text-sm" style="background:rgba(255,255,255,.04);border:1px solid rgba(136,136,160,.15);color:#E8E8ED;">
        </div>
        <div>
          <label class="block text-xs font-semibold mb-2" style="color:#8888A0;">Phone Number</label>
          <input id="client-confirm-phone" type="tel" placeholder="071 000 0000" class="w-full px-4 py-3 rounded-xl text-sm" style="background:rgba(255,255,255,.04);border:1px solid rgba(136,136,160,.15);color:#E8E8ED;">
        </div>
      </div>
      <label class="consent-row mt-4">
        <input id="client-confirm-owner" type="checkbox">
        <span>I confirm that I am the verified requester and that these gig details are accurate.</span>
      </label>
      <label class="upload-card mt-4">
        <span class="upload-title">Requester safety selfie</span>
        <span class="upload-help">JPG, PNG, or WEBP — confirms the requester is the profile holder.</span>
        <input id="client-confirm-selfie" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onchange="validateClientSelfie(false)">
        <span id="client-confirm-selfie-status" class="validation-hint field-neutral">No selfie selected.</span>
      </label>
    </div>
  `);
  document.getElementById('client-confirm-name').value  = currentUser?.full_name || '';
  document.getElementById('client-confirm-phone').value = currentUser?.phone     || '';
}

function postGigIdentityIsValid() {
  const name  = document.getElementById('client-confirm-name')?.value.trim()  || '';
  const phone = document.getElementById('client-confirm-phone')?.value.trim() || '';
  const owner = document.getElementById('client-confirm-owner')?.checked;
  return owner && identityMatchesCurrentUser(name, phone);
}

function validateClientSelfie(showError = false) {
  const input  = document.getElementById('client-confirm-selfie');
  const status = document.getElementById('client-confirm-selfie-status');
  const file   = input?.files?.[0];
  if (!file) {
    if (showError) { status.textContent = 'Upload a client selfie before posting.'; status.className = 'validation-hint field-bad'; }
    return false;
  }
  const valid = isImageFile(file);
  status.textContent = valid ? `Validated: ${file.name}` : 'Only JPG, PNG, or WEBP images accepted.';
  status.className   = 'validation-hint ' + (valid ? 'field-good' : 'field-bad');
  return valid;
}

async function handlePostGig() {
  if (!canPostWork()) {
    const errorEl = document.getElementById('post-gig-error');
    if (errorEl) { errorEl.textContent = 'Only verified Client or Company accounts can post work.'; errorEl.classList.remove('hidden'); }
    return;
  }

  const title   = document.getElementById('gig-title').value.trim();
  const desc    = document.getElementById('gig-description').value.trim();
  const budget  = document.getElementById('gig-budget').value;
  const cat     = document.getElementById('gig-category').value;
  const loc     = document.getElementById('gig-location').value.trim();
  const errorEl = document.getElementById('post-gig-error');
  errorEl.classList.add('hidden');

  if (!title || !desc || !budget || !cat || !loc)
    return showInlineError(errorEl, 'Please fill in all required fields.');
  if (!postGigIdentityIsValid())
    return showInlineError(errorEl, 'Please confirm your client identity with the name and phone on your Cynsera profile.');
  if (!validateClientSelfie(true))
    return showInlineError(errorEl, 'Please upload a valid client selfie before posting this gig.');

  const btn = document.getElementById('post-gig-btn');
  btn.textContent = 'Posting…';
  btn.disabled    = true;

  const gigData = {
    id:                     'g' + Date.now(),
    title,
    description:            desc,
    budget:                 Number(budget),
    category:               cat,
    location:               loc || 'Not specified',
    posted_by:              currentUser.email,
    confirmed_client_name:  document.getElementById('client-confirm-name').value.trim(),
    confirmed_client_phone: normalisePhoneForCompare(document.getElementById('client-confirm-phone').value.trim()),
    confirmed_client_selfie:document.getElementById('client-confirm-selfie').files[0].name,
    status:                 'open',
    applicants:             [],
    applicationDetails:     [],
    created_at:             Date.now(),
  };

  const result = await insertGigToDB(gigData);
  btn.textContent = 'Post Gig';
  btn.disabled    = false;

  if (!result.ok) showToast('Gig saved locally — database sync failed: ' + result.message, 'error');

  // Reset form
  ['gig-title','gig-description','gig-budget','gig-location'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('gig-category').value       = '';
  document.getElementById('client-confirm-name').value = currentUser?.full_name || '';
  document.getElementById('client-confirm-phone').value= currentUser?.phone     || '';
  document.getElementById('client-confirm-owner').checked = false;
  document.getElementById('client-confirm-selfie').value  = '';
  resetFileStatus('client-confirm-selfie-status', 'No selfie selected.');

  showToast('Gig posted successfully!', 'success');
  goToTab('browse');
  renderGigs();
}

// ── Bootstrap ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupPostGigIdentityFields();
});
