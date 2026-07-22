/* site app: nav, modal, reveal, timeline — no continuous / pointer GPU FX */
(function () {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── dropdown ──
  function dropdownParts(id) {
    const root = document.getElementById(id);
    if (!root) return null;
    return {
      root,
      btn: root.querySelector('.nav-dd-btn'),
      panel: root.querySelector('.nav-dd-panel'),
    };
  }
  function openDropdowns() {
    return document.querySelectorAll('.nav-dd.open');
  }
  function syncDropdownAria(id, open) {
    const d = dropdownParts(id);
    if (!d) return;
    if (d.btn) d.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (d.panel) d.panel.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  function setDropdownOpen(id, open) {
    const d = dropdownParts(id);
    if (!d) return;
    openDropdowns().forEach((el) => {
      if (el.id !== id) {
        el.classList.remove('open');
        syncDropdownAria(el.id, false);
      }
    });
    d.root.classList.toggle('open', open);
    syncDropdownAria(id, open);
  }
  function toggleDropdown(id) {
    const target = id || 'navDd';
    const d = dropdownParts(target);
    if (!d) return;
    setDropdownOpen(target, !d.root.classList.contains('open'));
  }

  (function () {
    const d = dropdownParts('navDd');
    if (!d) return;
    d.root.addEventListener('mouseenter', () => syncDropdownAria('navDd', true));
    d.root.addEventListener('mouseleave', () => {
      if (!d.root.classList.contains('open')) syncDropdownAria('navDd', false);
    });
  })();

  document.addEventListener('click', (e) => {
    openDropdowns().forEach((el) => {
      if (!el.contains(e.target)) setDropdownOpen(el.id, false);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    openDropdowns().forEach((el) => {
      setDropdownOpen(el.id, false);
      const btn = el.querySelector('.nav-dd-btn');
      if (btn) btn.focus();
    });
  });

  // ── modal ──
  const dialog = document.getElementById('modalDialog');
  const iframe = document.getElementById('modalIframe');
  const modalTitle = document.getElementById('modalTitle');
  const modalNewTab = document.getElementById('modalNewTab');

  function bgVideoPause() {
    const v = document.getElementById('bgVideo');
    if (v) v.pause();
  }
  function bgVideoResume() {
    const v = document.getElementById('bgVideo');
    if (!v || reduced) return;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

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
    setDropdownOpen('navDd', false);
    bgVideoPause();
    return false;
  }
  function closeModal() { dialog.close(); }

  iframe.addEventListener('load', () => {
    try {
      iframe.contentWindow.document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
      }, { capture: true });
    } catch (_) { /* cross-origin */ }
  });

  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeModal(); });
  dialog.addEventListener('close', () => {
    bgVideoResume();
    setTimeout(() => { iframe.src = 'about:blank'; }, 200);
  });

  // ── background video: 탭 숨김 시 pause, reduced-motion 시 제거 ──
  (function () {
    const v = document.getElementById('bgVideo');
    if (!v) return;
    if (reduced) {
      v.removeAttribute('autoplay');
      v.pause();
      while (v.firstChild) v.removeChild(v.firstChild);
      v.load();
      return;
    }
    bgVideoResume();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) bgVideoPause();
      else if (!dialog.open) bgVideoResume();
    });
  })();

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
          const sec = entry.target;
          sec.classList.add('revealing', 'in-view');
          io.unobserve(sec);
          setTimeout(() => sec.classList.remove('revealing'), 900);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    sections.forEach((s) => io.observe(s));
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

  window.toggleDropdown = toggleDropdown;
  window.openModal = openModal;
  window.closeModal = closeModal;
})();
