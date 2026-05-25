/**
 * auth.js
 * ─────────────────────────────────────────────────────
 * Handles login, registration steps, OTP verification,
 * password reset, and role selection.
 * Depends on: utils.js (state + data layer)
 * ─────────────────────────────────────────────────────
 */

let passwordResetEmail = '';

// ── Inspirational quotes per role & step ─────────────
const SIGNUP_QUOTES = {
  youth: {
    1: { quote: '"We cannot always build the future for our youth, but we can build our youth for the future."', author: 'Franklin D. Roosevelt' },
    2: { quote: '"It always seems impossible until it\'s done."',                                                 author: 'Nelson Mandela'        },
    3: { quote: '"Start where you are. Use what you have. Do what you can."',                                     author: 'Arthur Ashe'           },
    4: { quote: '"The future belongs to those who believe in the beauty of their dreams."',                       author: 'Eleanor Roosevelt'     },
  },
  client: {
    1: { quote: '"We cannot always build the future for our youth, but we can build our youth for the future."', author: 'Franklin D. Roosevelt' },
    2: { quote: '"No one has ever become poor by giving."',                                                       author: 'Anne Frank'            },
    3: { quote: '"Our children are our greatest treasure. They are our future."',                                 author: 'Nelson Mandela'        },
    4: { quote: '"The best way to predict the future is to create it."',                                          author: 'Peter Drucker'         },
  },
  company: {
    1: { quote: '"We cannot always build the future for our youth, but we can build our youth for the future."', author: 'Franklin D. Roosevelt' },
    2: { quote: '"Education is the most powerful weapon which you can use to change the world."',                 author: 'Nelson Mandela'        },
    3: { quote: '"The best way to predict the future is to create it."',                                          author: 'Peter Drucker'         },
    4: { quote: '"The future depends on what we do in the present."',                                             author: 'Mahatma Gandhi'        },
  },
};

// ── SA mobile prefix validation ───────────────────────
const SA_MOBILE_PREFIXES = [
  '060','061','062','063','064','065','066','067','068','069',
  '071','072','073','074','075','076','077','078','079',
  '081','082','083','084',
];

// ── Tab switching ─────────────────────────────────────
function switchAuthTab(tab) {
  ['login', 'signup'].forEach(t => {
    document.getElementById(`auth-tab-${t}`)?.classList.toggle('active', t === tab);
    document.getElementById(`auth-panel-${t}`)?.classList.toggle('active', t === tab);
  });
  if (tab === 'signup') goRegStep(1);
  createIcons();
}

// ── Animated story quote ──────────────────────────────
function updateSignupStoryQuote(step) {
  const role      = document.getElementById('reg-role')?.value || pendingUser.role || 'youth';
  const quoteData = SIGNUP_QUOTES[role]?.[step] || SIGNUP_QUOTES.youth[1];
  const quoteEl   = document.getElementById('story-quote');
  const authorEl  = document.getElementById('story-author');
  if (!quoteEl || !authorEl) return;
  quoteEl.style.opacity  = '0';
  authorEl.style.opacity = '0';
  setTimeout(() => {
    quoteEl.textContent  = quoteData.quote;
    authorEl.textContent = quoteData.author;
    quoteEl.style.opacity  = '1';
    authorEl.style.opacity = '1';
  }, 130);
}

// ── Role selection ────────────────────────────────────
function selectUserRole(role) {
  const safe = ['company', 'client', 'youth'].includes(role) ? role : 'youth';
  const input = document.getElementById('reg-role');
  if (input) input.value = safe;
  document.querySelectorAll('.role-choice-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.role === safe);
  });
  updateSignupStoryQuote(1);
}

// ── Password visibility toggle ────────────────────────
function togglePassword(inputId, btn) {
  const input   = document.getElementById(inputId);
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  btn.innerHTML = visible
    ? '<i data-lucide="eye-off" style="width:16px;height:16px;"></i>'
    : '<i data-lucide="eye"     style="width:16px;height:16px;"></i>';
  createIcons();
}

// ── Phone validation & formatting ────────────────────
function cleanPhoneValue(value) {
  const t = String(value || '').trim();
  return t.startsWith('+') ? '+' + t.replace(/\D/g, '') : t.replace(/\D/g, '');
}

function cleanPhoneInput(value) {
  const c = cleanPhoneValue(value);
  return c.startsWith('+') ? ('+' + c.replace(/\D/g, '').slice(0, 11)) : c.slice(0, 10);
}

function formatSouthAfricanPhoneInput(input) {
  input.value = cleanPhoneInput(input.value);
  refreshRegisterValidation();
}

function isValidSouthAfricanPhone(value) {
  const phone = cleanPhoneValue(value);
  const local = phone.startsWith('+27') ? '0' + phone.slice(3) : phone;
  if (!/^0\d{9}$/.test(local))                       return false;
  if (!SA_MOBILE_PREFIXES.includes(local.slice(0, 3))) return false;
  return !/^(\d)\1{6}$/.test(local.slice(3));
}

function normaliseSouthAfricanPhone(value) {
  const phone = cleanPhoneValue(value);
  if (/^0\d{9}$/.test(phone)) return '+27' + phone.slice(1);
  return phone;
}

// ── Email / postal validation ─────────────────────────
function isValidComEmail(value) {
  return /^[^\s@]+@[^\s@]+\.com$/i.test(String(value || '').trim());
}

function isValidPostalCode(value) {
  return /^\d{4}$/.test(String(value || '').trim());
}

// ── Date of birth helpers ─────────────────────────────
function getDateFromInput(value) {
  if (!value) return null;
  const d = new Date(value + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}

function isReasonableBirthDate(value) {
  const date  = getDateFromInput(value);
  if (!date) return false;
  const today = new Date();
  const min   = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const max   = new Date(today.getFullYear() -  16, today.getMonth(), today.getDate());
  return date >= min && date <= max;
}

function yymmddFromDateInput(value) {
  const date = getDateFromInput(value);
  if (!date) return '';
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return yy + mm + dd;
}

// ── Identity document validation ──────────────────────
function validateIdentityDocument(type, number, dob) {
  const clean = String(number || '').trim().replace(/\s+/g, '');
  if (!type)                     return { ok: false, message: 'Select South African ID or Passport.' };
  if (!isReasonableBirthDate(dob)) return { ok: false, message: 'Enter a valid date of birth. Users must be at least 16.' };

  if (type === 'sa_id') {
    if (!/^\d{13}$/.test(clean))  return { ok: false, message: 'South African ID numbers must have 13 digits.' };
    if (clean.slice(0, 6) !== yymmddFromDateInput(dob))
      return { ok: false, message: 'The date of birth must match the first 6 digits of the SA ID number.' };
    return { ok: true, clean };
  }

  if (!/^[A-Za-z0-9]{6,12}$/.test(clean))
    return { ok: false, message: 'Passport number must be 6–12 letters or numbers.' };

  return { ok: true, clean: clean.toUpperCase() };
}

// ── Password strength ─────────────────────────────────
function getPasswordChecks(value) {
  const pw = String(value || '');
  return {
    length:   pw.length >= 12,
    caseMix:  /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    number:   /\d/.test(pw),
    symbol:   /[^A-Za-z0-9\s]/.test(pw),
    noSpaces: pw.length > 0 && !/\s/.test(pw),
  };
}

function getPasswordScore(value) {
  return Object.values(getPasswordChecks(value)).filter(Boolean).length;
}

function isStrongPassword(value) {
  const c = getPasswordChecks(value);
  return c.length && c.caseMix && c.number && c.symbol && c.noSpaces;
}

function updatePasswordStrength(val) {
  const score   = getPasswordScore(val);
  const filled  = Math.min(4, Math.ceil((score / 5) * 4));
  const color   = score <= 2 ? '#ef4444' : score === 3 ? '#f97316' : score === 4 ? '#eab308' : '#00DC82';
  const label   = !val.length ? '' : score <= 2 ? 'Weak' : score === 3 ? 'Fair' : score === 4 ? 'Good' : 'Strong';
  ['sb1','sb2','sb3','sb4'].forEach((id, i) => {
    const b = document.getElementById(id);
    if (b) b.style.background = i < filled ? color : 'rgba(136,136,160,.15)';
  });
  const lbl = document.getElementById('pw-strength-label');
  if (lbl) { lbl.textContent = label ? `${label} password` : ''; lbl.style.color = color; }
  updatePasswordRules(val);
  refreshRegisterValidation();
}

function updatePasswordRules(value) {
  const checks = getPasswordChecks(value);
  Object.entries(checks).forEach(([key, ok]) => {
    const row    = document.querySelector(`[data-password-rule="${key}"]`);
    if (!row) return;
    row.classList.toggle('rule-ok',  ok);
    row.classList.toggle('rule-bad', !ok && value.length > 0);
    const marker = row.querySelector('.rule-marker');
    if (marker) marker.textContent = ok ? 'OK' : '–';
  });
}

// ── Inline validation hints ───────────────────────────
function setValidationHint(id, message, isValid, neutral = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className   = 'validation-hint ' + (neutral ? 'field-neutral' : isValid ? 'field-good' : 'field-bad');
}

function refreshRegisterValidation() {
  const email         = document.getElementById('reg-email')?.value.trim()            || '';
  const phone         = document.getElementById('reg-phone')?.value.trim()            || '';
  const password      = document.getElementById('reg-password')?.value               || '';
  const confirm       = document.getElementById('reg-confirm-password')?.value        || '';
  const idType        = document.getElementById('reg-id-type')?.value                 || '';
  const identityNum   = document.getElementById('reg-identity-number')?.value         || '';
  const dob           = document.getElementById('reg-dob')?.value                     || '';
  const postalCode    = document.getElementById('reg-postal-code')?.value.trim()      || '';

  setValidationHint('reg-email-hint',
    email ? (isValidComEmail(email) ? 'Email format accepted.' : 'Use a valid .com email, e.g. name@example.com.') : 'Email must include @ and end with .com.',
    isValidComEmail(email), !email);

  setValidationHint('reg-phone-hint',
    phone ? (isValidSouthAfricanPhone(phone) ? 'SA mobile format accepted.' : 'Use a valid SA mobile, e.g. 0731234567 or +27731234567.') : 'Use 0XXXXXXXXX or +27XXXXXXXXX.',
    isValidSouthAfricanPhone(phone), !phone);

  if (confirm) {
    setValidationHint('reg-confirm-password-hint',
      password === confirm ? 'Passwords match.' : 'Passwords do not match yet.',
      password === confirm);
  }

  if (identityNum || dob || idType) {
    const result = validateIdentityDocument(idType, identityNum, dob);
    setValidationHint('reg-identity-hint', result.ok ? 'Identity details accepted.' : result.message, result.ok);
  } else {
    setValidationHint('reg-identity-hint', 'SA ID must match your date of birth. Passport requires a valid DOB.', false, true);
  }

  setValidationHint('reg-postal-hint',
    postalCode ? (isValidPostalCode(postalCode) ? 'Postal code accepted.' : 'Use a 4-digit SA postal code.') : 'Use a 4-digit SA postal code.',
    isValidPostalCode(postalCode), !postalCode);
}

function setupRegisterValidation() {
  const fields = {
    email:          'reg-email',
    phone:          'reg-phone',
    identityNumber: 'reg-identity-number',
    idType:         'reg-id-type',
    dob:            'reg-dob',
    postalCode:     'reg-postal-code',
    password:       'reg-password',
  };

  // Email
  const emailEl = document.getElementById(fields.email);
  if (emailEl && !document.getElementById('reg-email-hint')) {
    emailEl.setAttribute('autocomplete', 'email');
    emailEl.insertAdjacentHTML('afterend', '<p id="reg-email-hint" class="validation-hint field-neutral">Email must include @ and end with .com.</p>');
    emailEl.addEventListener('input', refreshRegisterValidation);
  }

  // Phone
  const phoneEl = document.getElementById(fields.phone);
  if (phoneEl && !document.getElementById('reg-phone-hint')) {
    phoneEl.setAttribute('inputmode', 'tel');
    phoneEl.setAttribute('maxlength', '12');
    phoneEl.setAttribute('autocomplete', 'tel');
    phoneEl.addEventListener('input', () => formatSouthAfricanPhoneInput(phoneEl));
    phoneEl.insertAdjacentHTML('afterend', '<p id="reg-phone-hint" class="validation-hint field-neutral">Use 0XXXXXXXXX or +27XXXXXXXXX.</p>');
  }

  // Identity number
  const idEl = document.getElementById(fields.identityNumber);
  if (idEl && !document.getElementById('reg-identity-hint')) {
    idEl.setAttribute('autocomplete', 'off');
    idEl.insertAdjacentHTML('afterend', '<p id="reg-identity-hint" class="validation-hint field-neutral">SA ID must match your date of birth. Passport requires a valid DOB.</p>');
    idEl.addEventListener('input', refreshRegisterValidation);
  }
  document.getElementById(fields.idType)?.addEventListener('change', refreshRegisterValidation);
  document.getElementById(fields.dob)?.addEventListener('change', refreshRegisterValidation);

  // Postal code
  const postalEl = document.getElementById(fields.postalCode);
  if (postalEl && !document.getElementById('reg-postal-hint')) {
    postalEl.addEventListener('input', () => {
      postalEl.value = postalEl.value.replace(/\D/g, '').slice(0, 4);
      refreshRegisterValidation();
    });
    postalEl.insertAdjacentHTML('afterend', '<p id="reg-postal-hint" class="validation-hint field-neutral">Use a 4-digit SA postal code.</p>');
  }

  // Password rules UI
  const pwEl = document.getElementById(fields.password);
  if (pwEl && !document.getElementById('password-rules')) {
    pwEl.setAttribute('minlength', '12');
    pwEl.setAttribute('autocomplete', 'new-password');
    pwEl.addEventListener('input', () => updatePasswordStrength(pwEl.value));
    pwEl.closest('.pw-wrap').parentElement.insertAdjacentHTML('beforeend', `
      <div id="password-rules" class="password-rules">
        <div class="rule-item" data-password-rule="length">  <span class="rule-marker">–</span> At least 12 characters</div>
        <div class="rule-item" data-password-rule="caseMix"> <span class="rule-marker">–</span> Uppercase and lowercase letters</div>
        <div class="rule-item" data-password-rule="number">  <span class="rule-marker">–</span> At least one number</div>
        <div class="rule-item" data-password-rule="symbol">  <span class="rule-marker">–</span> At least one symbol</div>
        <div class="rule-item" data-password-rule="noSpaces"><span class="rule-marker">–</span> No spaces</div>
      </div>
      <div class="mt-4">
        <label>Confirm Password</label>
        <div class="pw-wrap">
          <input id="reg-confirm-password" type="password" placeholder="Re-enter your password">
          <button class="pw-toggle" onclick="togglePassword('reg-confirm-password', this)" type="button">
            <i data-lucide="eye"></i>
          </button>
        </div>
        <p id="reg-confirm-password-hint" class="validation-hint field-neutral">Re-enter your password to confirm it.</p>
      </div>
    `);
    document.getElementById('reg-confirm-password')?.addEventListener('input', refreshRegisterValidation);
  }

  refreshRegisterValidation();
}

// ── Forgot password modal ─────────────────────────────
function ensureForgotPasswordModal() {
  if (document.getElementById('forgot-password-modal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="forgot-password-modal" class="gig-modal-backdrop hidden">
      <div class="gig-modal" style="max-width:520px;">
        <div class="p-6" style="border-bottom:1px solid rgba(136,136,160,.1);">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="font-display font-800 text-2xl mb-2" style="color:#E8E8ED;">Reset Password</h2>
              <p class="text-sm" style="color:#8888A0;">Verify your email, then create a stronger password.</p>
            </div>
            <button onclick="closeForgotPassword()" class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(255,255,255,.06);color:#8888A0;">
              <i data-lucide="x" style="width:18px;height:18px;"></i>
            </button>
          </div>
        </div>
        <div class="p-6 space-y-4">
          <div id="forgot-step-email">
            <label class="block text-xs font-semibold mb-2" style="color:#8888A0;">Account Email</label>
            <input id="forgot-email" type="email" placeholder="you@email.com" class="w-full px-4 py-3 rounded-xl text-sm" style="background:rgba(255,255,255,.04);border:1px solid rgba(136,136,160,.15);color:#E8E8ED;">
            <button onclick="requestPasswordResetCode()" class="w-full mt-4 py-3 rounded-xl font-display font-700 text-sm" style="background:#00DC82;color:#08080C;">Send Reset Code</button>
          </div>
          <div id="forgot-step-reset" class="hidden">
            <div class="p-3 rounded-xl text-xs mb-4" style="background:rgba(0,220,130,.06);border:1px solid rgba(0,220,130,.16);color:#8888A0;">
              Development code: <strong id="forgot-code-preview" style="color:#00DC82;">------</strong>
            </div>
            <label class="block text-xs font-semibold mb-2" style="color:#8888A0;">Reset Code</label>
            <input id="forgot-code" type="text" maxlength="6" inputmode="numeric" placeholder="000000" class="w-full px-4 py-3 rounded-xl text-sm" style="background:rgba(255,255,255,.04);border:1px solid rgba(136,136,160,.15);color:#E8E8ED;">
            <label class="block text-xs font-semibold mb-2 mt-4" style="color:#8888A0;">New Password</label>
            <div class="pw-wrap">
              <input id="forgot-new-password" type="password" placeholder="12+ chars, Aa, number, symbol" class="w-full px-4 py-3 rounded-xl text-sm" style="background:rgba(255,255,255,.04);border:1px solid rgba(136,136,160,.15);color:#E8E8ED;">
              <button class="pw-toggle" onclick="togglePassword('forgot-new-password', this)" type="button"><i data-lucide="eye" style="width:16px;height:16px;"></i></button>
            </div>
            <label class="block text-xs font-semibold mb-2 mt-4" style="color:#8888A0;">Confirm New Password</label>
            <div class="pw-wrap">
              <input id="forgot-confirm-password" type="password" placeholder="Re-enter your new password" class="w-full px-4 py-3 rounded-xl text-sm" style="background:rgba(255,255,255,.04);border:1px solid rgba(136,136,160,.15);color:#E8E8ED;">
              <button class="pw-toggle" onclick="togglePassword('forgot-confirm-password', this)" type="button"><i data-lucide="eye" style="width:16px;height:16px;"></i></button>
            </div>
            <button onclick="resetForgotPassword()" class="w-full mt-4 py-3 rounded-xl font-display font-700 text-sm" style="background:#00DC82;color:#08080C;">Update Password</button>
          </div>
          <div id="forgot-error"   class="hidden text-xs p-3 rounded-lg" style="background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);"></div>
          <div id="forgot-success" class="hidden text-xs p-3 rounded-lg" style="background:rgba(0,220,130,.1);color:#00DC82;border:1px solid rgba(0,220,130,.2);"></div>
        </div>
      </div>
    </div>
  `);
  document.getElementById('forgot-code')?.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  });
  createIcons();
}

function setForgotMessage(type, message) {
  ['forgot-error', 'forgot-success'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  const el = document.getElementById(type === 'success' ? 'forgot-success' : 'forgot-error');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}

function openForgotPassword() {
  ensureForgotPasswordModal();
  passwordResetEmail = '';
  document.getElementById('forgot-email').value            = document.getElementById('login-email')?.value.trim() || '';
  document.getElementById('forgot-code').value             = '';
  document.getElementById('forgot-new-password').value     = '';
  document.getElementById('forgot-confirm-password').value = '';
  document.getElementById('forgot-step-email').classList.remove('hidden');
  document.getElementById('forgot-step-reset').classList.add('hidden');
  document.getElementById('forgot-error').classList.add('hidden');
  document.getElementById('forgot-success').classList.add('hidden');
  document.getElementById('forgot-password-modal').classList.remove('hidden');
}

function closeForgotPassword() {
  document.getElementById('forgot-password-modal')?.classList.add('hidden');
}

async function requestPasswordResetCode() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!isValidComEmail(email)) { setForgotMessage('error', 'Enter a valid .com email address.'); return; }
  if (email === 'demo@cynsera.com') { setForgotMessage('error', 'The demo account password is demo123.'); return; }

  const user = allUsers.find(u => u.email === email) || (await fetchUserByEmail(email));
  if (!user) { setForgotMessage('error', 'No account found with that email.'); return; }

  passwordResetEmail = email;
  const v = await requestEmailVerification(email, 'password_reset');
  if (!v.ok) { setForgotMessage('error', v.message || 'Could not create a reset verification request.'); return; }
  document.getElementById('forgot-step-email').classList.add('hidden');
  document.getElementById('forgot-step-reset').classList.remove('hidden');
  document.getElementById('forgot-code-preview').textContent = v.devCode || 'sent';
  setForgotMessage('success', 'Reset code stored in CynseraDB. Use the displayed code for this prototype.');
}

async function resetForgotPassword() {
  const code    = document.getElementById('forgot-code').value.trim();
  const password = document.getElementById('forgot-new-password').value;
  const confirm  = document.getElementById('forgot-confirm-password').value;

  if (!isStrongPassword(password)) { setForgotMessage('error', 'Use a stronger password: 12+ chars, upper/lower, number, symbol.'); return; }
  if (password !== confirm)         { setForgotMessage('error', 'Passwords do not match.'); return; }

  const v = await confirmEmailVerification(passwordResetEmail, code, 'password_reset');
  if (!v.ok) { setForgotMessage('error', v.message); return; }

  await updateUserInDB(passwordResetEmail, { password });
  const localUser = allUsers.find(u => u.email === passwordResetEmail);
  if (localUser) localUser.password = password;
  saveLocalState();

  document.getElementById('login-email').value    = passwordResetEmail;
  document.getElementById('login-password').value = '';
  setForgotMessage('success', 'Password updated. You can now log in.');
  setTimeout(closeForgotPassword, 1000);
}

// ── Login ─────────────────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');
  errorEl.classList.add('hidden');

  if (!email || !password) { return showError(errorEl, 'Please fill in all fields.'); }
  if (!isValidComEmail(email)) { return showError(errorEl, 'Please enter a valid .com email address.'); }

  // Demo shortcuts
  const DEMO_ACCOUNTS = {
    'demo@cynsera.com':    { password: 'demo123',    user: demoYouthUser()   },
    'client@cynsera.com':  { password: 'client123',  user: demoClientUser()  },
    'company@cynsera.com': { password: 'company123', user: demoCompanyUser() },
  };
  const demo = DEMO_ACCOUNTS[email];
  if (demo) {
    if (password !== demo.password) return showError(errorEl, 'Incorrect password for demo account.');
    currentUser = demo.user;
    saveLocalState();
    window.location.href = 'dashboard.html';
    return;
  }

  // Real user lookup
  let user = allUsers.find(u => u.email === email);
  if (!user) user = await fetchUserByEmail(email);
  if (!user)            return showError(errorEl, 'No account found. Please sign up first.');
  if (user.password !== password) return showError(errorEl, 'Incorrect password. Please try again.');

  currentUser = user;
  saveLocalState();
  window.location.href = 'dashboard.html';
}

// ── Registration step 1 ───────────────────────────────
async function handleRegisterStep1() {
  const vals = {
    name:           document.getElementById('reg-name').value.trim(),
    email:          document.getElementById('reg-email').value.trim(),
    phone:          document.getElementById('reg-phone').value.trim(),
    idType:         document.getElementById('reg-id-type').value,
    identityNumber: document.getElementById('reg-identity-number').value.trim(),
    dob:            document.getElementById('reg-dob').value,
    postalCode:     document.getElementById('reg-postal-code').value.trim(),
    role:           document.getElementById('reg-role').value,
    password:       document.getElementById('reg-password').value,
    confirmPassword:document.getElementById('reg-confirm-password')?.value || '',
  };
  const errorEl = document.getElementById('reg-error');
  errorEl.classList.add('hidden');

  const required = Object.values(vals).every(Boolean);
  if (!required)                          return showError(errorEl, 'Please fill in all required fields.');
  if (!isValidComEmail(vals.email))        return showError(errorEl, 'Please enter a valid .com email address.');
  if (!isValidSouthAfricanPhone(vals.phone)) return showError(errorEl, 'Please enter a valid SA mobile number, e.g. 0731234567.');
  const idResult = validateIdentityDocument(vals.idType, vals.identityNumber, vals.dob);
  if (!idResult.ok)                       return showError(errorEl, idResult.message);
  if (!isValidPostalCode(vals.postalCode)) return showError(errorEl, 'Please enter a valid 4-digit SA postal code.');
  if (!isStrongPassword(vals.password))   return showError(errorEl, 'Use a stronger password: 12+ chars, upper/lower, number, symbol.');
  if (vals.password !== vals.confirmPassword) return showError(errorEl, 'Passwords do not match.');

  const existing = allUsers.find(u => u.email === vals.email) || await fetchUserByEmail(vals.email);
  if (existing) return showError(errorEl, 'This email is already registered. Please log in.');

  pendingUser = {
    full_name:       vals.name,
    email:           vals.email,
    phone:           normaliseSouthAfricanPhone(vals.phone),
    role:            vals.role,
    password:        vals.password,
    id_type:         vals.idType,
    identity_number: idResult.clean,
    date_of_birth:   vals.dob,
    postal_code:     vals.postalCode,
    location: '', balance: 0, rating: 0, bio: '',
    skills: [], categories: [], availability: [],
    rate: '', rate_period: 'per_gig', verified: true,
  };

  const v = await requestEmailVerification(vals.email, 'signup');
  if (!v.ok) return showError(errorEl, v.message || 'Could not create an email verification request.');

  pendingUser.email_verified       = false;
  pendingUser.email_verification_id = v.verificationId || v.id;

  const previewLabel = document.getElementById('verification-code-label');
  const preview      = document.getElementById('verification-code-preview');
  if (previewLabel) previewLabel.textContent = v.devCode ? 'Development email code' : 'Verification status';
  if (preview)      preview.textContent      = v.devCode || 'Sent';

  goRegStep(2);
  setTimeout(() => document.querySelector('.otp-box')?.focus(), 200);
}

// ── OTP input navigation ──────────────────────────────
function otpNext(el, idx) {
  el.value = el.value.replace(/\D/g, '').slice(0, 1);
  if (el.value.length === 1) {
    const boxes = document.querySelectorAll('.otp-box');
    if (idx < boxes.length - 1) boxes[idx + 1].focus();
  }
}

async function verifyOTP() {
  const boxes   = document.querySelectorAll('#reg-step-2 .otp-box');
  const code    = Array.from(boxes).map(b => b.value).join('');
  const errorEl = document.getElementById('otp-error');
  const btn     = document.getElementById('otp-verify-btn');
  errorEl.classList.add('hidden');

  const result = await confirmEmailVerification(pendingUser.email, code, 'signup');
  if (!result.ok) { showError(errorEl, result.message); return; }

  btn.textContent = 'Verifying…';
  btn.disabled    = true;
  setTimeout(() => {
    btn.textContent = 'Verify Code';
    btn.disabled    = false;
    pendingUser.email_verified = true;
    goRegStep(3);
  }, 600);
}

// ── Complete registration ──────────────────────────────
async function completeRegistration() {
  currentUser = { ...pendingUser };
  const result = await insertUserToDB({ ...pendingUser });
  if (!result.ok) {
    showToast('Profile saved locally — database sync failed: ' + result.message, 'error');
  }
  saveLocalState();
  window.location.href = 'dashboard.html';
}

// ── Step navigation ───────────────────────────────────
function goRegStep(n) {
  document.querySelectorAll('.signup-step').forEach(s => s.classList.remove('active-signup-step'));
  document.getElementById(`reg-step-${n}`)?.classList.add('active-signup-step');

  document.querySelectorAll('.step-dot').forEach(d => {
    const s = parseInt(d.dataset.step);
    d.classList.remove('active-step', 'done-step');
    if (s === n) d.classList.add('active-step');
    else if (s < n) d.classList.add('done-step');
    d.style.background = s <= n ? '#00DC82' : 'rgba(136,136,160,.3)';
  });

  const lbl = document.getElementById('reg-step-label');
  if (lbl) lbl.textContent = `Step ${n} of 4`;
  updateSignupStoryQuote(n);
  if (n === 3) initOnboarding();
  createIcons();
}

// ── Helpers ───────────────────────────────────────────
function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ── Demo account objects ──────────────────────────────
function demoYouthUser() {
  return {
    full_name: 'Demo User', email: 'demo@cynsera.com', phone: '+27710000000',
    role: 'youth', location: 'Johannesburg, GP',
    id_type: 'sa_id', identity_number: '0001015009087', date_of_birth: '2000-01-01', postal_code: '2001',
    bio: 'Experienced in manual work, painting and delivery services.',
    skills: ['Painting','Driving','Cleaning'], categories: ['Manual','Delivery'],
    availability: ['Weekends','Flexible'], rate: '800', rate_period: 'per_gig',
    balance: 5000, rating: 4.8, verified: true,
  };
}

function demoClientUser() {
  return {
    full_name: 'Nandi Maseko', email: 'client@cynsera.com', phone: '+27820002026',
    role: 'client', location: 'Durban, KwaZulu-Natal',
    id_type: 'sa_id', identity_number: '8501015009084', date_of_birth: '1985-01-01', postal_code: '4001',
    client_type: 'Individual requester',
    hiring_goal: 'I need trusted young people for household and practical once-off jobs.',
    categories: ['Manual','Delivery','Events'], hiring_frequency: 'Monthly', average_budget: '1200',
    safety_notes: 'All jobs include clear addresses, time windows, and requester selfie confirmation.',
    balance: 15000, rating: 4.9, verified: true,
  };
}

function demoCompanyUser() {
  return {
    full_name: 'Ayesha Naidoo', email: 'company@cynsera.com', phone: '+27830002026',
    role: 'company', location: 'Cape Town, Western Cape',
    id_type: 'passport', identity_number: 'A1234567', date_of_birth: '1988-04-12', postal_code: '8001',
    organisation: 'FutureWorks Group', industry: 'Corporate services', company_role: 'Talent Program Lead',
    hiring_goal: 'Create entry-level roles, learnerships, and workshop pathways for young people.',
    categories: ['Digital','Education','Events'], hiring_frequency: 'Ongoing', average_budget: '8000',
    safety_notes: 'All opportunities include clear contracts, contacts, location details, and payment information.',
    balance: 50000, rating: 4.9, verified: true,
  };
}

// ── Bootstrap ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const tab    = params.get('tab') || 'login';
  switchAuthTab(tab);
  const type = params.get('type');
  if (type === 'client' || type === 'youth' || type === 'company') selectUserRole(type);
  setupRegisterValidation();
  createIcons();
});
