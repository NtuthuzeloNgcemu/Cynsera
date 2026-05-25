const SA_PROVINCE_TOWNS = {
  'Gauteng': [
    'Johannesburg','Soweto','Pretoria','Tshwane','Centurion','Midrand','Sandton','Randburg',
    'Roodepoort','Boksburg','Benoni','Germiston','Kempton Park','Edenvale','Alberton',
    'Vereeniging','Vanderbijlpark','Krugersdorp','Mamelodi','Tembisa','Alexandra','Diepsloot'
  ],
  'Western Cape': [
    'Cape Town','Bellville','Khayelitsha','Mitchells Plain','Stellenbosch','Paarl','Worcester',
    'George','Mossel Bay','Knysna','Hermanus','Somerset West','Strand','Atlantis',
    'Malmesbury','Beaufort West','Oudtshoorn','Saldanha','Vredenburg','Ceres'
  ],
  'KwaZulu-Natal': [
    'Durban','Pietermaritzburg','Newcastle','Richards Bay','Ladysmith','Pinetown','Umhlanga',
    'Empangeni','Port Shepstone','Margate','Ballito','Umlazi','Chatsworth','Verulam',
    'Tongaat','Howick','Kokstad','Estcourt','Vryheid','Dundee','Eshowe','KwaMashu',
    'Phoenix','Amanzimtoti','Isipingo','Hillcrest','Westville','Ulundi'
  ],
  'Eastern Cape': [
    'Gqeberha','Port Elizabeth','East London','Mthatha','Queenstown','Komani','Grahamstown',
    'Makhanda','King Williams Town','Qonce','Uitenhage','Kariega','Butterworth','Mdantsane',
    'Cradock','Graaff-Reinet','Jeffreys Bay','Port Alfred','Alice','Fort Beaufort'
  ],
  'Limpopo': [
    'Polokwane','Mokopane','Tzaneen','Thohoyandou','Giyani','Makhado','Louis Trichardt',
    'Lephalale','Bela-Bela','Modimolle','Musina','Phalaborwa','Hoedspruit','Jane Furse',
    'Lebowakgomo','Seshego','Malamulele'
  ],
  'Mpumalanga': [
    'Mbombela','Nelspruit','Witbank','Emalahleni','Middelburg','Secunda','Ermelo','Standerton',
    'Barberton','Hazyview','White River','Lydenburg','Mashishing','Komatipoort','Bethal',
    'Delmas','Kriel','Sabie','Graskop'
  ],
  'North West': [
    'Rustenburg','Mahikeng','Klerksdorp','Potchefstroom','Brits','Mmabatho','Lichtenburg',
    'Zeerust','Vryburg','Orkney','Wolmaransstad','Mogwase','Hartbeespoort','Taung',
    'Schweizer-Reneke'
  ],
  'Free State': [
    'Bloemfontein','Welkom','Bethlehem','Kroonstad','Sasolburg','Parys','Phuthaditjhaba',
    'Harrismith','Virginia','Odendaalsrus','Botshabelo','Thaba Nchu','Ladybrand',
    'Ficksburg','Clarens'
  ],
  'Northern Cape': [
    'Kimberley','Upington','Springbok','De Aar','Kuruman','Postmasburg','Kathu','Prieska',
    'Colesberg','Calvinia','Douglas','Danielskuil','Barkly West','Victoria West'
  ]
};

const PROVINCE_OPTIONS = Object.keys(SA_PROVINCE_TOWNS).map(p => `<option>${p}</option>`).join('');

const YOUTH_VERIFICATION_UPLOADS = [
  { id:'verify-id-doc', label:'South African ID document', allowedExt:['pdf'], allowedTypes:['application/pdf'], error:'Upload your ID document as a PDF scan.' },
  { id:'verify-address-doc', label:'Proof of address', allowedExt:['pdf'], allowedTypes:['application/pdf'], error:'Upload proof of address as a PDF.' },
  { id:'verify-supporting-doc', label:'CV, matric certificate, or supporting document', allowedExt:['pdf'], allowedTypes:['application/pdf'], error:'Upload your supporting document as a PDF.' },
  { id:'verify-selfie', label:'Selfie photo', allowedExt:['jpg','jpeg','png','webp'], allowedTypes:['image/jpeg','image/png','image/webp'], error:'Upload a selfie image in JPG, PNG, or WEBP format.' },
  { id:'verify-intro-video', label:'Short introduction video', allowedExt:['mp4','webm','mov'], allowedTypes:['video/mp4','video/webm','video/quicktime'], error:'Upload a short video in MP4, WEBM, or MOV format.' }
];

const CLIENT_VERIFICATION_UPLOADS = [
  { id:'verify-client-id', label:'ID or passport document', allowedExt:['pdf'], allowedTypes:['application/pdf'], error:'Upload your ID or passport as a PDF scan.' },
  { id:'verify-client-address', label:'Proof of address', allowedExt:['pdf'], allowedTypes:['application/pdf'], error:'Upload proof of address as a PDF.' },
  { id:'verify-client-job-note', label:'Job requester declaration', allowedExt:['pdf'], allowedTypes:['application/pdf'], error:'Upload a short signed requester declaration as a PDF.' },
  { id:'verify-client-selfie', label:'Client selfie photo', allowedExt:['jpg','jpeg','png','webp'], allowedTypes:['image/jpeg','image/png','image/webp'], error:'Upload a selfie image in JPG, PNG, or WEBP format.' }
];

const COMPANY_VERIFICATION_UPLOADS = [
  { id:'verify-company-rep-id', label:'Representative ID document', allowedExt:['pdf'], allowedTypes:['application/pdf'], error:'Upload the representative ID as a PDF.' },
  { id:'verify-company-registration', label:'Company registration or organisation proof', allowedExt:['pdf'], allowedTypes:['application/pdf'], error:'Upload company registration, NPO proof, or signed organisation letter as a PDF.' },
  { id:'verify-company-address', label:'Company proof of address', allowedExt:['pdf'], allowedTypes:['application/pdf'], error:'Upload proof of address as a PDF.' },
  { id:'verify-company-authority', label:'Permission to post opportunities', allowedExt:['pdf'], allowedTypes:['application/pdf'], error:'Upload a PDF showing that you are allowed to request work for this organisation.' },
  { id:'verify-company-selfie', label:'Representative selfie photo', allowedExt:['jpg','jpeg','png','webp'], allowedTypes:['image/jpeg','image/png','image/webp'], error:'Upload a selfie image in JPG, PNG, or WEBP format.' }
];

function isClientSignup() {
  return pendingUser.role === 'client' || pendingUser.role === 'employer';
}

function isCompanySignup() {
  return pendingUser.role === 'company';
}

function currentVerificationRules() {
  if (isCompanySignup()) return COMPANY_VERIFICATION_UPLOADS;
  return isClientSignup() ? CLIENT_VERIFICATION_UPLOADS : YOUTH_VERIFICATION_UPLOADS;
}

function normaliseTownName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function getTownMatch(location, province) {
  const towns = SA_PROVINCE_TOWNS[province] || [];
  const normalisedLocation = normaliseTownName(location);
  return towns.find(town => {
    const normalisedTown = normaliseTownName(town);
    return normalisedLocation === normalisedTown ||
      normalisedLocation.includes(normalisedTown) ||
      normalisedTown.includes(normalisedLocation);
  });
}

function provinceTownExamples(province) {
  return (SA_PROVINCE_TOWNS[province] || []).slice(0, 5).join(', ');
}

function getFileExtension(file) {
  return (file?.name || '').split('.').pop().toLowerCase();
}

function fileMatchesRule(file, rule) {
  if (!file) return false;
  const ext = getFileExtension(file);
  return rule.allowedExt.includes(ext) || rule.allowedTypes.includes(file.type);
}

function setUploadStatus(id, message, isValid) {
  const el = document.getElementById(id + '-status');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('field-good', 'field-bad', 'field-neutral');
  el.classList.add(isValid ? 'field-good' : 'field-bad');
}

function validateVerificationUploads(showErrors = false) {
  let allValid = true;

  currentVerificationRules().forEach(rule => {
    const input = document.getElementById(rule.id);
    const file = input?.files?.[0];
    const valid = fileMatchesRule(file, rule);
    if (!valid) allValid = false;

    if (file) {
      setUploadStatus(rule.id, valid ? `Validated: ${file.name}` : rule.error, valid);
    } else if (showErrors) {
      setUploadStatus(rule.id, `${rule.label} is required.`, false);
    }
  });

  return allValid;
}

function validateVerificationConsents(showErrors = false) {
  const terms = document.getElementById('verify-terms-consent')?.checked;
  const popia = document.getElementById('verify-popia-consent')?.checked;
  const status = document.getElementById('verify-consent-status');
  const valid = Boolean(terms && popia);

  if (status && (showErrors || valid)) {
    status.textContent = valid
      ? 'Consent confirmed.'
      : 'Please agree to the Terms & Conditions and POPIA processing consent.';
    status.classList.remove('field-good', 'field-bad', 'field-neutral');
    status.classList.add(valid ? 'field-good' : 'field-bad');
  }

  return valid;
}

function uploadCard(rule, help) {
  return `
    <label class="upload-card">
      <span class="upload-title">${rule.label}</span>
      <span class="upload-help">${help}</span>
      <input id="${rule.id}" type="file" accept="${rule.allowedExt.includes('pdf') ? 'application/pdf,.pdf' : 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'}">
      <span id="${rule.id}-status" class="validation-hint field-neutral">No file selected.</span>
    </label>
  `;
}

function ensureVerificationSlide() {
  if (document.getElementById('ob-slide-d')) return;
  document.getElementById('ob-slide-c')?.insertAdjacentHTML('afterend', '<div id="ob-slide-d" class="onboarding-slide"></div>');
}

function renderYouthSlides() {
  document.getElementById('ob-slide-a').innerHTML = `
    <div class="form-stack">
      <div>
        <label>Your City / Area</label>
        <input id="ob-location" type="text" placeholder="e.g. Durban">
      </div>
      <div>
        <label>Province</label>
        <select id="ob-province"><option value="">Select province</option>${PROVINCE_OPTIONS}</select>
      </div>
      <div>
        <label>Short Bio</label>
        <textarea id="ob-bio" placeholder="Tell clients about your work ethic, reliability, and what kind of work you are ready to do."></textarea>
        <p class="validation-hint field-neutral">Write more than 5 words.</p>
      </div>
    </div>
  `;

  document.getElementById('ob-slide-b').innerHTML = `
    <p class="slide-note">Choose at least one skill. These help clients understand what you can offer.</p>
    <div id="skills-grid" class="choice-grid"></div>
    <div class="custom-skill-row">
      <input id="custom-skill-input" type="text" placeholder="Add a custom skill" onkeydown="if(event.key==='Enter'){addCustomSkill();event.preventDefault();}">
      <button onclick="addCustomSkill()">Add</button>
    </div>
  `;

  document.getElementById('ob-slide-c').innerHTML = `
    <p class="slide-note" id="work-pref-sublabel">Choose at least one category and one availability option.</p>
    <label id="work-pref-label">Preferred Work Categories</label>
    <div class="choice-grid compact" id="categories-grid"></div>
    <label>Availability</label>
    <div class="choice-grid compact" id="availability-grid"></div>
    <div>
      <label>Expected Rate / Salary</label>
      <div class="rate-row">
        <span>R</span>
        <input id="ob-rate" type="number" placeholder="e.g. 800">
        <select id="ob-rate-period">
          <option value="per_gig">per gig</option>
          <option value="per_day">per day</option>
          <option value="per_hour">per hour</option>
          <option value="per_month">per month</option>
        </select>
      </div>
    </div>
  `;

  document.getElementById('ob-slide-d').innerHTML = `
    <p class="slide-note">Upload the required files so clients can trust that your profile is real.</p>
    <div class="verification-grid">
      ${uploadCard(YOUTH_VERIFICATION_UPLOADS[0], 'PDF scan only')}
      ${uploadCard(YOUTH_VERIFICATION_UPLOADS[1], 'PDF only, such as a statement or official letter')}
      ${uploadCard(YOUTH_VERIFICATION_UPLOADS[2], 'PDF document only')}
      ${uploadCard(YOUTH_VERIFICATION_UPLOADS[3], 'JPG, PNG, or WEBP image')}
      <label class="upload-card">
        <span class="upload-title">Short introduction video</span>
        <span class="upload-help">MP4, WEBM, or MOV video</span>
        <input id="verify-intro-video" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov">
        <span id="verify-intro-video-status" class="validation-hint field-neutral">No file selected.</span>
      </label>
    </div>
    ${verificationConsentHtml()}
  `;
}

function renderClientSlides() {
  document.getElementById('ob-slide-a').innerHTML = `
    <div class="form-stack">
      <div>
        <label>What do you need help with?</label>
        <input id="client-job-need" type="text" placeholder="e.g. Wash my car, clean windows, paint my house">
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label>Town / City</label>
          <input id="ob-location" type="text" placeholder="e.g. Durban">
        </div>
        <div>
          <label>Province</label>
          <select id="ob-province"><option value="">Select province</option>${PROVINCE_OPTIONS}</select>
        </div>
      </div>
      <div>
        <label>Tell youth what kind of help you usually need</label>
        <textarea id="client-about" placeholder="Example: I need reliable help for practical once-off jobs around my home, and I will provide clear time, location, and payment details."></textarea>
        <p class="validation-hint field-neutral">Write more than 5 words.</p>
      </div>
    </div>
  `;

  document.getElementById('ob-slide-b').innerHTML = `
    <p class="slide-note">Tell us what kind of practical jobs you may post.</p>
    <label>Job Categories You May Need</label>
    <div class="choice-grid compact" id="categories-grid"></div>
    <div class="grid md:grid-cols-2 gap-4 mt-4">
      <div>
        <label>Hiring Frequency</label>
        <select id="client-hiring-frequency">
          <option value="">Select frequency</option>
          <option>Once-off</option>
          <option>Weekly</option>
          <option>Monthly</option>
          <option>Seasonal</option>
          <option>Ongoing</option>
        </select>
      </div>
      <div>
        <label>Usual Budget Per Job</label>
        <div class="rate-row">
          <span>R</span>
          <input id="client-average-budget" type="number" placeholder="e.g. 1200">
        </div>
      </div>
    </div>
  `;

  document.getElementById('ob-slide-c').innerHTML = `
    <div class="form-stack">
      <div>
        <label>Safety Notes for Youth Workers</label>
        <textarea id="client-safety-notes" placeholder="Explain how you will provide clear address, time, contact, payment, and safety information for each job."></textarea>
        <p class="validation-hint field-neutral">Write at least 8 words.</p>
      </div>
      <label class="consent-row">
        <input id="client-payment-confirm" type="checkbox">
        <span>I understand that Cynsera should show payment expectations clearly before youth accept work.</span>
      </label>
      <label class="consent-row">
        <input id="client-youth-commitment" type="checkbox">
        <span>I agree to post fair, respectful, and safe practical jobs that help youth earn and build experience.</span>
      </label>
    </div>
  `;

  document.getElementById('ob-slide-d').innerHTML = `
    <p class="slide-note">Client verification checks protect youth before they accept a job at your home or location.</p>
    <div class="verification-grid">
      ${uploadCard(CLIENT_VERIFICATION_UPLOADS[0], 'PDF scan only')}
      ${uploadCard(CLIENT_VERIFICATION_UPLOADS[1], 'PDF proof of address')}
      ${uploadCard(CLIENT_VERIFICATION_UPLOADS[2], 'PDF declaration that the job request is real and safe')}
      ${uploadCard(CLIENT_VERIFICATION_UPLOADS[3], 'JPG, PNG, or WEBP image')}
    </div>
    ${verificationConsentHtml()}
  `;
}

function renderCompanySlides() {
  document.getElementById('ob-slide-a').innerHTML = `
    <div class="form-stack">
      <div>
        <label>Company / Organisation Name</label>
        <input id="company-name" type="text" placeholder="e.g. FutureWorks Group">
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label>Industry</label>
          <select id="company-industry">
            <option value="">Select industry</option>
            <option>Corporate services</option>
            <option>Retail</option>
            <option>Technology</option>
            <option>Education and training</option>
            <option>Hospitality</option>
            <option>Delivery and logistics</option>
            <option>Non-profit / community</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label>Your Role</label>
          <input id="company-contact-role" type="text" placeholder="e.g. HR Manager, Founder, Coordinator">
        </div>
      </div>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label>Town / City</label>
          <input id="ob-location" type="text" placeholder="e.g. Cape Town">
        </div>
        <div>
          <label>Province</label>
          <select id="ob-province"><option value="">Select province</option>${PROVINCE_OPTIONS}</select>
        </div>
      </div>
      <div>
        <label>Company Youth Empowerment Goal</label>
        <textarea id="company-about" placeholder="Tell us how your company wants to create jobs, learnerships, workshops, or training pathways for youth."></textarea>
        <p class="validation-hint field-neutral">Write more than 5 words.</p>
      </div>
    </div>
  `;

  document.getElementById('ob-slide-b').innerHTML = `
    <p class="slide-note">Tell us what type of opportunities your company will post.</p>
    <label>Opportunity Categories</label>
    <div class="choice-grid compact" id="categories-grid"></div>
    <div class="grid md:grid-cols-2 gap-4 mt-4">
      <div>
        <label>Opportunity Frequency</label>
        <select id="client-hiring-frequency">
          <option value="">Select frequency</option>
          <option>Once-off</option>
          <option>Monthly</option>
          <option>Quarterly</option>
          <option>Seasonal</option>
          <option>Ongoing</option>
        </select>
      </div>
      <div>
        <label>Average Opportunity Budget</label>
        <div class="rate-row">
          <span>R</span>
          <input id="client-average-budget" type="number" placeholder="e.g. 8000">
        </div>
      </div>
    </div>
  `;

  document.getElementById('ob-slide-c').innerHTML = `
    <div class="form-stack">
      <div>
        <label>Corporate Safety & Support Notes</label>
        <textarea id="client-safety-notes" placeholder="Explain how youth will receive clear contacts, location, contracts, payment information, and workplace support."></textarea>
        <p class="validation-hint field-neutral">Write at least 8 words.</p>
      </div>
      <label class="consent-row">
        <input id="client-payment-confirm" type="checkbox">
        <span>I understand that company opportunities must show payment, stipend, or training expectations clearly.</span>
      </label>
      <label class="consent-row">
        <input id="client-youth-commitment" type="checkbox">
        <span>I agree to post fair, respectful, and youth-safe opportunities on behalf of this company.</span>
      </label>
    </div>
  `;

  document.getElementById('ob-slide-d').innerHTML = `
    <p class="slide-note">Company verification checks help youth trust business and corporate opportunities.</p>
    <div class="verification-grid">
      ${uploadCard(COMPANY_VERIFICATION_UPLOADS[0], 'PDF representative ID scan')}
      ${uploadCard(COMPANY_VERIFICATION_UPLOADS[1], 'Company registration, NPO proof, or signed organisation letter as PDF')}
      ${uploadCard(COMPANY_VERIFICATION_UPLOADS[2], 'PDF proof of address')}
      ${uploadCard(COMPANY_VERIFICATION_UPLOADS[3], 'PDF permission letter or owner confirmation')}
      ${uploadCard(COMPANY_VERIFICATION_UPLOADS[4], 'JPG, PNG, or WEBP image')}
    </div>
    ${verificationConsentHtml()}
  `;
}

function verificationConsentHtml() {
  return `
    <div class="consent-box">
      <label class="consent-row">
        <input id="verify-terms-consent" type="checkbox">
        <span>I agree to Cynsera's Terms & Conditions and understand that false or misleading documents may lead to account review.</span>
      </label>
      <label class="consent-row">
        <input id="verify-popia-consent" type="checkbox">
        <span>I consent to Cynsera processing my personal information for verification and platform safety in line with the POPIA Act.</span>
      </label>
      <p id="verify-consent-status" class="validation-hint field-neutral">Both consent boxes are required to continue.</p>
    </div>
  `;
}

function bindVerificationInputs() {
  currentVerificationRules().forEach(rule => {
    document.getElementById(rule.id)?.addEventListener('change', () => validateVerificationUploads(false));
  });
  ['verify-terms-consent','verify-popia-consent'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => validateVerificationConsents(false));
  });
}

function initOnboarding() {
  obCurrentSlide = 'a';
  selectedSkills = [];
  selectedCategories = [];
  selectedAvailability = [];
  ensureVerificationSlide();

  if (isCompanySignup()) renderCompanySlides();
  else if (isClientSignup()) renderClientSlides();
  else renderYouthSlides();

  const sg = document.getElementById('skills-grid');
  if (sg) {
    sg.innerHTML = SKILL_OPTIONS.map(s => `<span class="skill-tag" onclick="toggleSkill(this,'${s}')">${s}</span>`).join('');
  }

  const cg = document.getElementById('categories-grid');
  if (cg) {
    cg.innerHTML = CATEGORY_OPTIONS.map(c => `
      <div class="cat-chip" onclick="toggleCategory(this,'${c.value}')"><span>${c.label}</span></div>
    `).join('');
  }

  const ag = document.getElementById('availability-grid');
  if (ag) {
    ag.innerHTML = AVAILABILITY_OPTIONS.map(a => `
      <span class="skill-tag" onclick="toggleAvail(this,'${a}')" style="justify-content:center;">${a}</span>
    `).join('');
  }

  bindVerificationInputs();
  showObSlide('a');
  createIcons();
}

function showObSlide(slide) {
  obCurrentSlide = slide;
  ['a','b','c','d'].forEach(s => document.getElementById('ob-slide-' + s)?.classList.remove('active-slide'));
  document.getElementById('ob-slide-' + slide)?.classList.add('active-slide');

  const youthLabels = { a:'Location & Bio', b:'Your Skills', c:'Work Preferences', d:'Verification Uploads' };
  const clientLabels = { a:'Client Details', b:'Job Plan', c:'Safety Commitments', d:'Client Verification' };
  const companyLabels = { a:'Company Details', b:'Opportunity Plan', c:'Corporate Safety', d:'Company Verification' };
  const labels = isCompanySignup() ? companyLabels : isClientSignup() ? clientLabels : youthLabels;
  const nums = { a:'1 / 4', b:'2 / 4', c:'3 / 4', d:'4 / 4' };
  const widths = { a:'25%', b:'50%', c:'75%', d:'100%' };
  const youthNext = { a:'Next: Skills ->', b:'Next: Preferences ->', c:'Next: Verification ->', d:'Complete Profile ->' };
  const clientNext = { a:'Next: Job Plan ->', b:'Next: Safety ->', c:'Next: Verification ->', d:'Complete Client Profile ->' };
  const companyNext = { a:'Next: Opportunity Plan ->', b:'Next: Safety ->', c:'Next: Verification ->', d:'Complete Company Profile ->' };
  const nextTxt = isCompanySignup() ? companyNext : isClientSignup() ? clientNext : youthNext;

  document.getElementById('profile-slide-label').textContent = labels[slide];
  document.getElementById('profile-slide-num').textContent = nums[slide];
  document.getElementById('onboard-progress-bar').style.width = widths[slide];
  document.getElementById('ob-next-btn').textContent = nextTxt[slide];
  document.getElementById('ob-back-btn').style.display = slide === 'a' ? 'none' : '';
  document.getElementById('ob-error').classList.add('hidden');
}

function obSlideNext() {
  const errorEl = document.getElementById('ob-error');
  errorEl.classList.add('hidden');
  if (isClientSignup() || isCompanySignup()) return clientSlideNext(errorEl);
  return youthSlideNext(errorEl);
}

function youthSlideNext(errorEl) {
  if (obCurrentSlide === 'a') {
    const loc = document.getElementById('ob-location').value.trim();
    const province = document.getElementById('ob-province').value;
    const bio = document.getElementById('ob-bio').value.trim();
    if (!loc) return showOnboardingError(errorEl, 'Please enter your city or area.');
    if (!province) return showOnboardingError(errorEl, 'Please select your province.');
    if (countWords(bio) <= 5) return showOnboardingError(errorEl, 'Please write a short bio of more than 5 words to help build a work-focused community.');
    const matchedTown = getTownMatch(loc, province);
    if (!matchedTown) return showOnboardingError(errorEl, `${loc} does not match ${province}. Try one of these examples: ${provinceTownExamples(province)}.`);
    pendingUser.location = matchedTown + ', ' + province;
    pendingUser.bio = bio;
    showObSlide('b');
  } else if (obCurrentSlide === 'b') {
    if (selectedSkills.length === 0) return showOnboardingError(errorEl, 'Please choose at least one skill before continuing.');
    pendingUser.skills = [...selectedSkills];
    showObSlide('c');
  } else if (obCurrentSlide === 'c') {
    const expectedRate = document.getElementById('ob-rate').value;
    if (selectedCategories.length === 0) return showOnboardingError(errorEl, 'Please choose at least one work category you are interested in.');
    if (selectedAvailability.length === 0) return showOnboardingError(errorEl, 'Please choose at least one availability option.');
    if (!expectedRate || Number(expectedRate) <= 0) return showOnboardingError(errorEl, 'Please enter how much you expect to make before continuing.');
    pendingUser.categories = [...selectedCategories];
    pendingUser.availability = [...selectedAvailability];
    pendingUser.rate = expectedRate;
    pendingUser.rate_period = document.getElementById('ob-rate-period').value;
    showObSlide('d');
  } else if (obCurrentSlide === 'd') {
    finishVerification(errorEl);
  }
}

function clientSlideNext(errorEl) {
  if (obCurrentSlide === 'a') {
    const loc = document.getElementById('ob-location').value.trim();
    const province = document.getElementById('ob-province').value;
    const about = (document.getElementById('client-about') || document.getElementById('company-about'))?.value.trim() || '';
    if (isCompanySignup()) {
      const org = document.getElementById('company-name').value.trim();
      const industry = document.getElementById('company-industry').value;
      const companyRole = document.getElementById('company-contact-role').value.trim();
      if (!org || !industry || !companyRole) return showOnboardingError(errorEl, 'Please complete the company name, industry, and your role.');
      pendingUser.organisation = org;
      pendingUser.industry = industry;
      pendingUser.company_role = companyRole;
    } else {
      const jobNeed = document.getElementById('client-job-need').value.trim();
      if (!jobNeed) return showOnboardingError(errorEl, 'Please tell us what kind of job you need help with.');
      pendingUser.client_job_need = jobNeed;
      pendingUser.client_type = 'Individual requester';
    }
    if (!loc || !province) return showOnboardingError(errorEl, 'Please enter the town and province.');
    if (countWords(about) <= 5) return showOnboardingError(errorEl, 'Please explain your reason for joining in more than 5 words.');
    const matchedTown = getTownMatch(loc, province);
    if (!matchedTown) return showOnboardingError(errorEl, `${loc} does not match ${province}. Try one of these examples: ${provinceTownExamples(province)}.`);
    pendingUser.location = matchedTown + ', ' + province;
    pendingUser.hiring_goal = about;
    pendingUser.bio = about;
    showObSlide('b');
  } else if (obCurrentSlide === 'b') {
    const frequency = document.getElementById('client-hiring-frequency').value;
    const budget = document.getElementById('client-average-budget').value;
    if (selectedCategories.length === 0) return showOnboardingError(errorEl, 'Please choose at least one category you plan to hire for.');
    if (!frequency) return showOnboardingError(errorEl, isCompanySignup() ? 'Please choose how often your company expects to post opportunities.' : 'Please choose how often you expect to post practical jobs.');
    if (!budget || Number(budget) <= 0) return showOnboardingError(errorEl, isCompanySignup() ? 'Please add an average opportunity budget.' : 'Please add a usual budget per job.');
    pendingUser.categories = [...selectedCategories];
    pendingUser.hiring_frequency = frequency;
    pendingUser.average_budget = budget;
    showObSlide('c');
  } else if (obCurrentSlide === 'c') {
    const notes = document.getElementById('client-safety-notes').value.trim();
    const payment = document.getElementById('client-payment-confirm').checked;
    const commitment = document.getElementById('client-youth-commitment').checked;
    if (countWords(notes) < 8) return showOnboardingError(errorEl, 'Please write at least 8 words explaining your safety approach.');
    if (!payment || !commitment) return showOnboardingError(errorEl, 'Please confirm the payment and youth safety commitments.');
    pendingUser.safety_notes = notes;
    pendingUser.payment_clarity_commitment = payment;
    pendingUser.youth_opportunity_commitment = commitment;
    showObSlide('d');
  } else if (obCurrentSlide === 'd') {
    finishVerification(errorEl);
  }
}

function finishVerification(errorEl) {
  if (!validateVerificationUploads(true)) return showOnboardingError(errorEl, 'Please upload each required verification file in the correct format.');
  if (!validateVerificationConsents(true)) return showOnboardingError(errorEl, 'Please agree to the Terms & Conditions and POPIA processing consent.');

  pendingUser.verified = true;
  pendingUser.verification = {
    status:'validated',
    termsAccepted:true,
    popiaConsent:true,
    files:currentVerificationRules().map(rule => {
      const file = document.getElementById(rule.id)?.files?.[0];
      return { label:rule.label, name:file?.name || '', type:file?.type || getFileExtension(file) };
    })
  };

  allUsers.push({ ...pendingUser });
  saveState();
  populateSummary();
  goRegStep(4);
}

function showOnboardingError(errorEl, message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function obSlideBack() {
  if (obCurrentSlide === 'b') showObSlide('a');
  else if (obCurrentSlide === 'c') showObSlide('b');
  else if (obCurrentSlide === 'd') showObSlide('c');
}

function toggleSkill(el, skill) {
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) {
    if (!selectedSkills.includes(skill)) selectedSkills.push(skill);
  } else {
    selectedSkills = selectedSkills.filter(s => s !== skill);
  }
}

function addCustomSkill() {
  const input = document.getElementById('custom-skill-input');
  const val = input.value.trim();
  if (!val) return;
  if (selectedSkills.includes(val)) {
    input.value = '';
    return;
  }
  selectedSkills.push(val);
  const sg = document.getElementById('skills-grid');
  const tag = document.createElement('span');
  tag.className = 'skill-tag selected';
  tag.textContent = val;
  tag.onclick = () => toggleSkill(tag, val);
  sg.appendChild(tag);
  input.value = '';
}

function toggleCategory(el, cat) {
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) {
    if (!selectedCategories.includes(cat)) selectedCategories.push(cat);
  } else {
    selectedCategories = selectedCategories.filter(c => c !== cat);
  }
}

function toggleAvail(el, avail) {
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) {
    if (!selectedAvailability.includes(avail)) selectedAvailability.push(avail);
  } else {
    selectedAvailability = selectedAvailability.filter(a => a !== avail);
  }
}

function populateSummary() {
  const locEl = document.getElementById('summary-location');
  const roleEl = document.getElementById('summary-role');
  const skillEl = document.getElementById('summary-skills');
  const thirdLabel = document.getElementById('summary-third-label');

  if (locEl) locEl.textContent = pendingUser.location || 'Not specified';
  if (roleEl) roleEl.textContent = isCompanySignup() ? 'Company' : isClientSignup() ? 'Client' : 'Youth';
  if (thirdLabel) thirdLabel.textContent = isCompanySignup() ? 'Company Focus' : isClientSignup() ? 'Client Focus' : 'Skills';
  if (skillEl) {
    skillEl.textContent = isCompanySignup()
      ? `${pendingUser.organisation || 'Company'} - ${(pendingUser.categories || []).join(', ')}`
      : isClientSignup()
      ? `${pendingUser.client_job_need || 'Practical jobs'} - ${(pendingUser.categories || []).join(', ')}`
      : pendingUser.skills.length
        ? pendingUser.skills.slice(0, 4).join(', ') + (pendingUser.skills.length > 4 ? ` +${pendingUser.skills.length - 4} more` : '')
        : 'None added';
  }

  createIcons();
}
