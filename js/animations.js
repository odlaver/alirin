'use strict';
/* =============================================================================
   ALIRIN — js/animations.js
   Scroll-reveal, count-up, sticky navbar, nav drawer
   Non-module version (works on file:// protocol)
   ============================================================================= */

(function () {
  const qs  = (sel, ctx) => (ctx || document).querySelector(sel);
  const qsa = (sel, ctx) => (ctx || document).querySelectorAll(sel);

  /* ── Scroll Reveal ───────────────────────────────────────────────────────── */
  function initScrollReveal() {
    const items = qsa('.reveal');
    if (!items.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -24px 0px' });
    items.forEach(el => observer.observe(el));
  }

  /* ── Count-Up ────────────────────────────────────────────────────────────── */
  function initCountUp() {
    const targets = qsa('[data-count-to]');
    if (!targets.length) return;
    const ease = t => 1 - Math.pow(1 - t, 3);

    function animate(el) {
      const to       = parseFloat(el.dataset.countTo);
      const from     = parseFloat(el.dataset.countFrom || 0);
      const duration = parseInt(el.dataset.duration || 1400);
      const decimals = parseInt(el.dataset.decimals || 0);
      const suffix   = el.dataset.suffix || '';
      const prefix   = el.dataset.prefix || '';
      let start = null;

      function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const v = from + (to - from) * ease(p);
        el.textContent = prefix + v.toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + to.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(step);
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    targets.forEach(el => obs.observe(el));
  }

  /* ── Sticky Navbar ───────────────────────────────────────────────────────── */
  function initStickyNavbar() {
    const nav = qs('#main-navbar');
    if (!nav) return;
    const handler = () => nav.classList.toggle('is-scrolled', window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
  }

  /* ── Nav Drawer ──────────────────────────────────────────────────────────── */
  function initNavDrawer() {
    const toggle   = qs('#nav-toggle');
    const drawer   = qs('#nav-drawer');
    const backdrop = qs('#nav-backdrop');
    if (!toggle || !drawer) return;
    let open = false;

    function setOpen(v) {
      open = v;
      drawer.classList.toggle('is-open', v);
      drawer.setAttribute('aria-hidden', String(!v));
      toggle.setAttribute('aria-expanded', String(v));
      document.body.style.overflow = v ? 'hidden' : '';
    }

    toggle.addEventListener('click', () => setOpen(!open));
    if (backdrop) backdrop.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', e => { if (open && e.key === 'Escape') setOpen(false); });
    qsa('.nav-drawer__link', drawer).forEach(l => l.addEventListener('click', () => setOpen(false)));
  }

  /* ── Page Entrance ───────────────────────────────────────────────────────── */
  function initPageEntrance() {
    const main = qs('main');
    if (!main) return;
    main.style.opacity = '0';
    main.style.transform = 'translateY(12px)';
    main.style.transition = 'opacity 500ms cubic-bezier(0.22,1,0.36,1), transform 500ms cubic-bezier(0.22,1,0.36,1)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        main.style.opacity = '1';
        main.style.transform = 'translateY(0)';
      });
    });
  }

  /* ── Init All ────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initCountUp();
    initStickyNavbar();
    initNavDrawer();
    initPageEntrance();
  });
})();
