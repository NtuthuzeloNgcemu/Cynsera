/**
 * buddy.js
 * ─────────────────────────────────────────────────────
 * Cynsera Buddy – multilingual chatbot widget.
 * Supports all 11 SA official languages + SASL.
 * Depends on: utils.js (createIcons)
 * ─────────────────────────────────────────────────────
 */

let buddyLanguage = null;

// ── Language definitions ──────────────────────────────
const BUDDY_LANGUAGES = [
  {
    code: 'en', label: 'English',
    hello:    'Hi, how can I help?',
    nav:      'How to navigate Cynsera',
    find:     'Find a gig',
    post:     'Post a gig',
    agent:    'Talk to an agent',
    fallback: 'Sorry, I can\'t help with that yet. I can help you navigate Cynsera, find a gig, post a gig, or connect you to an agent.',
  },
  {
    code: 'zu', label: 'isiZulu',
    hello:    'Sawubona, ngingakusiza kanjani?',
    nav:      'Ungayisebenzisa kanjani i-Cynsera',
    find:     'Thola i-gig',
    post:     'Faka i-gig',
    agent:    'Khuluma ne-agent',
    fallback: 'Uxolo, lokho akukabi umsebenzi wami. Ngingakusiza usebenzise i-Cynsera, uthole i-gig, ufake i-gig, noma ukhulume ne-agent.',
  },
  {
    code: 'xh', label: 'isiXhosa',
    hello:    'Molo, ndingakunceda njani?',
    nav:      'Indlela yokusebenzisa i-Cynsera',
    find:     'Fumana i-gig',
    post:     'Faka i-gig',
    agent:    'Thetha ne-agent',
    fallback: 'Uxolo, loo nto ayikabi ngumsebenzi wam. Ndingakunceda usebenzise i-Cynsera, ufumane i-gig, ufake i-gig, okanye uthethe ne-agent.',
  },
  {
    code: 'af', label: 'Afrikaans',
    hello:    'Hallo, hoe kan ek help?',
    nav:      'Hoe om Cynsera te gebruik',
    find:     'Vind \'n gig',
    post:     'Plaas \'n gig',
    agent:    'Praat met \'n agent',
    fallback: 'Jammer, dit is nog nie een van my funksies nie. Ek kan help met navigasie, gig vind, gig plaas, of met \'n agent praat.',
  },
  {
    code: 'nso', label: 'Sepedi',
    hello:    'Dumela, nka go thusa bjang?',
    nav:      'Kamoo o ka sepedišago Cynsera',
    find:     'Hwetša gig',
    post:     'Tsenya gig',
    agent:    'Bolela le agent',
    fallback: 'Tshwarelo, tšeo ga se mešomo ya ka ga bjale. Nka thuša ka Cynsera, go hwetša gig, go tsenya gig, goba go bolela le agent.',
  },
  {
    code: 'st', label: 'Sesotho',
    hello:    'Dumela, nka o thusa jwang?',
    nav:      'Tsela ya ho sebedisa Cynsera',
    find:     'Fumana gig',
    post:     'Kenya gig',
    agent:    'Bua le agent',
    fallback: 'Tshwarelo, tseo ha se mesebetsi ya ka hajwale. Nka thusa ka ho tsamaya Cynsera, ho fumana gig, ho kenya gig, kapa ho bua le agent.',
  },
  {
    code: 'tn', label: 'Setswana',
    hello:    'Dumela, nka go thusa jang?',
    nav:      'Kafa o ka dirisang Cynsera',
    find:     'Bona gig',
    post:     'Tsenya gig',
    agent:    'Bua le agent',
    fallback: 'Intshwarele, tseo ga se ditiro tsa me jaanong. Nka thusa ka Cynsera, go bona gig, go tsenya gig, kgotsa go bua le agent.',
  },
  {
    code: 'ss', label: 'siSwati',
    hello:    'Sawubona, ngingakusita njani?',
    nav:      'Indlela yekusebentisa Cynsera',
    find:     'Tfola i-gig',
    post:     'Faka i-gig',
    agent:    'Khuluma ne-agent',
    fallback: 'Ngiyacolisa, loko akusiyo imisebenti yami nyalo. Ngingakusita nge-Cynsera, kutfola i-gig, kufaka i-gig, noma kukhuluma ne-agent.',
  },
  {
    code: 've', label: 'Tshivenda',
    hello:    'Ndaa, ndi nga ni thusa hani?',
    nav:      'Ndila ya u shumisa Cynsera',
    find:     'Wanani gig',
    post:     'Posani gig',
    agent:    'Ambani na agent',
    fallback: 'Pfarelo, izwo a si mishumo yanga zwino. Ndi nga thusa nga Cynsera, u wana gig, u posa gig, kana u amba na agent.',
  },
  {
    code: 'ts', label: 'XiTsonga',
    hello:    'Avuxeni, ndzi nga ku pfuna yini?',
    nav:      'Ndlela yo tirhisa Cynsera',
    find:     'Kuma gig',
    post:     'Posta gig',
    agent:    'Vulavula na agent',
    fallback: 'Ndza rivalela, leswi a hi mintirho ya mina sweswi. Ndzinga pfuna hi Cynsera, ku kuma gig, ku posta gig, kumbe ku vulavula na agent.',
  },
  {
    code: 'nr', label: 'isiNdebele',
    hello:    'Lotjhani, ngingakusiza njani?',
    nav:      'Indlela yokusebenzisa i-Cynsera',
    find:     'Thola i-gig',
    post:     'Faka i-gig',
    agent:    'Khuluma ne-agent',
    fallback: 'Ngiyacolisa, lokho akusiyo imisebenzi yami nje. Ngingakusiza nge-Cynsera, ukuthola i-gig, ukufaka i-gig, namkha ukukhuluma ne-agent.',
  },
  {
    code: 'sasl', label: 'South African Sign Language',
    hello:    'SASL text support: hi, how can I help?',
    nav:      'Navigate Cynsera',
    find:     'Find a gig',
    post:     'Post a gig',
    agent:    'Talk to an agent',
    fallback: 'SASL text support: sorry, those are not my functions yet. I can help with navigating, finding a gig, posting a gig, or talking to an agent.',
  },
];

// ── Action responses (English, shown for all languages
//    via internal logic – extend per-language as needed) ─
const BUDDY_ACTIONS = {
  navigate: 'Cynsera has a landing page, signup/login, and a role-based dashboard. Youth browse gigs and training. Clients post practical jobs. Companies post corporate opportunities. Use the top navigation or dashboard tabs to move around.',
  find:     'To find a gig: sign up as Youth → complete verification → open the dashboard → choose Browse Gigs → open a gig → confirm your identity → upload your selfie and supporting PDF → apply.',
  post:     'To post work: sign up as Client (practical jobs) or Company (business opportunities) → complete verification → open Post Work → fill in the details → confirm your identity → upload a requester selfie → post.',
  agent:    'An agent handover connects you to Cynsera support. Prototype contact: support@cynsera.co.za',
};

// ── Helpers ───────────────────────────────────────────
function currentBuddyLanguage() {
  return BUDDY_LANGUAGES.find(l => l.code === buddyLanguage) || BUDDY_LANGUAGES[0];
}

function toggleBuddy() {
  const panel = document.getElementById('buddy-message');
  if (!panel) return;
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden') && !buddyLanguage) {
    renderBuddyLanguageChoice();
  }
}

function buddyAddMessage(text, sender = 'bot') {
  const log = document.getElementById('buddy-chat-log');
  if (!log) return;
  const bubble = document.createElement('div');
  bubble.className = 'buddy-bubble ' + (sender === 'user' ? 'user' : 'bot');
  bubble.textContent = text;
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
}

function setBuddyQuickActions(html) {
  const el = document.querySelector('.buddy-quick-actions');
  if (el) el.innerHTML = html;
}

// ── Language picker ───────────────────────────────────
function renderBuddyLanguageChoice() {
  const log = document.getElementById('buddy-chat-log');
  if (log) log.innerHTML = '';
  buddyAddMessage('Choose your language / Khetha ulimi / Kies jou taal:', 'bot');
  setBuddyQuickActions(
    BUDDY_LANGUAGES.map(lang =>
      `<button onclick="selectBuddyLanguage('${lang.code}')">${lang.label}</button>`
    ).join('')
  );
}

function selectBuddyLanguage(code) {
  buddyLanguage = code;
  const lang = currentBuddyLanguage();
  buddyAddMessage(lang.label, 'user');
  buddyAddMessage(lang.hello, 'bot');
  renderBuddyMenu();
}

// ── Main menu ─────────────────────────────────────────
function renderBuddyMenu() {
  const lang = currentBuddyLanguage();
  setBuddyQuickActions(`
    <button onclick="buddyDo('navigate')">${lang.nav}</button>
    <button onclick="buddyDo('find')">${lang.find}</button>
    <button onclick="buddyDo('post')">${lang.post}</button>
    <button onclick="buddyDo('agent')">${lang.agent}</button>
    <button onclick="renderBuddyLanguageChoice()">Change language</button>
  `);
}

function buddyDo(action) {
  const lang  = currentBuddyLanguage();
  const label = { navigate: lang.nav, find: lang.find, post: lang.post, agent: lang.agent }[action];
  if (label) buddyAddMessage(label, 'user');
  buddyAddMessage(BUDDY_ACTIONS[action] || lang.fallback, 'bot');
}

// ── Free-text input ───────────────────────────────────
function buddyAsk(message) {
  if (!buddyLanguage) { renderBuddyLanguageChoice(); return; }
  buddyAddMessage(message, 'user');
  const lower = message.toLowerCase();
  if (lower.includes('navigate') || lower.includes('website') || lower.includes('use cynsera'))
    return buddyAddMessage(BUDDY_ACTIONS.navigate, 'bot');
  if (lower.includes('find') || lower.includes('gig') || lower.includes('work'))
    return buddyAddMessage(BUDDY_ACTIONS.find, 'bot');
  if (lower.includes('post'))
    return buddyAddMessage(BUDDY_ACTIONS.post, 'bot');
  if (lower.includes('agent') || lower.includes('human') || lower.includes('support'))
    return buddyAddMessage(BUDDY_ACTIONS.agent, 'bot');
  buddyAddMessage(currentBuddyLanguage().fallback, 'bot');
}

function sendBuddyMessage(event) {
  event.preventDefault();
  const input   = document.getElementById('buddy-input');
  const message = input?.value.trim();
  if (!message) return;
  input.value = '';
  buddyAsk(message);
}

// ── Bootstrap ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('buddy-chat-log')) renderBuddyLanguageChoice();
  createIcons();
});
