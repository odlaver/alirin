'use strict';
/* =============================================================================
   ALIRIN — js/landing.js
   Landing page: wave canvas, particles, smooth scroll, marker hover
   Non-module version (works on file:// protocol)
   ============================================================================= */

(function () {

  /* ── Hero Wave Canvas ────────────────────────────────────────────────────── */
  function initHeroWave() {
    const canvas = document.querySelector('#hero-wave-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    function resize() {
      canvas.width  = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }

    function drawWave(w, h, offset, amp, color, alpha) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x++) {
        const y = Math.sin((x / w) * Math.PI * 2 + offset) * amp
                + Math.sin((x / w) * Math.PI * 4 + offset * 1.3) * (amp * 0.4)
                + h * 0.55;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.restore();
    }

    function loop() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = frame * 0.012;
      drawWave(w, h, t, h * 0.12, '#22B8CF', 0.22);
      drawWave(w, h, t * 0.7 + 1, h * 0.08, '#0B7285', 0.14);
      drawWave(w, h, t * 1.1 + 2, h * 0.06, '#22B8CF', 0.10);
      frame++;
      requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    loop();
  }

  /* ── Particles ───────────────────────────────────────────────────────────── */
  function initParticles() {
    const box = document.querySelector('#hero-particles');
    if (!box) return;
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const s = Math.random() * 5 + 3;
      p.style.cssText =
        `left:${Math.random()*100}%;bottom:${Math.random()*30}%;` +
        `width:${s}px;height:${s}px;` +
        `animation-delay:${(Math.random()*8).toFixed(1)}s;` +
        `animation-duration:${(Math.random()*5+7).toFixed(1)}s;` +
        `opacity:${(Math.random()*0.35+0.15).toFixed(2)}`;
      box.appendChild(p);
    }
  }

  /* ── Smooth Scroll ───────────────────────────────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ── Init ─────────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initHeroWave();
    initParticles();
    initSmoothScroll();
  });

})();
