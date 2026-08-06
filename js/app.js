/* site app: modal preview, reveal, timeline progress */
(function () {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── modal ──
  const dialog = document.getElementById('modalDialog');
  const iframe = document.getElementById('modalIframe');
  const modalTitle = document.getElementById('modalTitle');
  const modalNewTab = document.getElementById('modalNewTab');

  function openModal(url, title, event) {
    if (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return true;
      event.preventDefault();
    }
    const sep = url.includes('?') ? '&' : '?';
    iframe.src = url + sep + 'v=' + Date.now();
    modalTitle.textContent = title;
    modalNewTab.href = url;
    dialog.showModal();
    return false;
  }
  function closeModal() {
    dialog.close();
  }

  iframe.addEventListener('load', () => {
    try {
      iframe.contentWindow.document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
      }, { capture: true });
    } catch (_) { /* cross-origin */ }
  });

  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeModal(); });
  dialog.addEventListener('close', () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    setTimeout(() => { iframe.src = 'about:blank'; }, 200);
  });

  // ── scroll: topbar 상태만 ──
  (function () {
    const root = document.documentElement;
    let ticking = false;
    function update() {
      ticking = false;
      root.classList.toggle('is-scrolled', (scrollY || 0) > 12);
    }
    addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  })();

  // ── section reveal (한 번만) ──
  (function () {
    const sections = document.querySelectorAll('.reveal-section');
    if (!sections.length) return;

    function prepReveal(section) {
      section.querySelectorAll('.repo-card').forEach((el, i) => {
        el.style.setProperty('--reveal-i', String(i));
      });
      section.querySelectorAll('.tl-item').forEach((el, i) => {
        el.style.setProperty('--reveal-i', String(i));
      });
    }
    sections.forEach(prepReveal);

    if (!('IntersectionObserver' in window) || reduced) {
      sections.forEach((s) => s.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    sections.forEach((s) => io.observe(s));
  })();

  // ── card tilt: hover/pointer-only, no idle GPU cost — resets on leave ──
  (function () {
    if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const TILT = 6; // deg
    const els = document.querySelectorAll('.repo-card, .tl-item');
    els.forEach((el) => {
      let raf = null;
      // transform's own transition lives in CSS (short, ~0.18s) so this glides
      // instead of snapping frame-to-frame — do not disable it here.
      el.addEventListener('mousemove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          const rx = ((0.5 - py) * TILT * 2).toFixed(2);
          const ry = ((px - 0.5) * TILT * 2).toFixed(2);
          el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
        });
      });
      el.addEventListener('mouseleave', () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.style.transform = '';
      });
    });
  })();

  // ── timeline progress (height 1개만) ──
  (function () {
    const track = document.getElementById('timeline');
    const fill = document.getElementById('timelineProgress');
    if (!track || !fill) return;
    const inset = 6;
    let ticking = false;

    function update() {
      ticking = false;
      const rect = track.getBoundingClientRect();
      const atBottom = Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 1;
      const rawProgress = (innerHeight - rect.top) / (innerHeight + rect.height);
      const progress = atBottom ? 1 : Math.min(1, Math.max(0, rawProgress));
      const total = Math.max(0, track.clientHeight - inset * 2);
      fill.style.height = (total * progress) + 'px';
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    update();
  })();

  window.openModal = openModal;
  window.closeModal = closeModal;
})();
