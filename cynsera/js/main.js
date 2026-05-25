/**
 * main.js
 * ─────────────────────────────────────────────────────
 * Landing page interactions: sticky nav, smooth scroll,
 * mobile menu toggle, and feature tab switcher.
 * The Supabase client is initialised in supabase.js –
 * main.js no longer duplicates that logic.
 * Depends on: supabase.js, utils.js
 * ─────────────────────────────────────────────────────
 */

// ── Sticky nav scroll behaviour ───────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('main-nav')
    ?.classList.toggle('nav-scrolled', window.scrollY > 60);
});

// ── Smooth scroll to section ──────────────────────────
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ── Mobile menu toggle ────────────────────────────────
function toggleMobileMenu() {
  document.getElementById('mobile-nav')?.classList.toggle('hidden');
}

// ── Feature tab switcher (landing page) ───────────────
function switchFeatureTab(tab) {
  document.querySelectorAll('.ftab').forEach(b => {
    b.style.background = 'rgba(255,255,255,.04)';
    b.style.color      = '#8888A0';
    b.style.border     = '1px solid rgba(136,136,160,.15)';
  });
  document.querySelectorAll('.fpanel').forEach(p => p.classList.add('hidden'));

  const btn   = document.getElementById('ftab-' + tab);
  const panel = document.getElementById('fpanel-' + tab);

  if (btn) {
    btn.style.background = 'rgba(0,220,130,.15)';
    btn.style.color      = '#00DC82';
    btn.style.border     = '1px solid rgba(0,220,130,.3)';
  }
  panel?.classList.remove('hidden');
  createIcons();
}

// ── Bootstrap ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  switchFeatureTab('marketplace');
  createIcons();
});
