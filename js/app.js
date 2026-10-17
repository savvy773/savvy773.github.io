/* site app: modal preview, project filters and reveal */
(function () {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Project map: each field reveals the tools that belong to it.
  const projectMap = document.querySelector('.project-map');
  const projectResult = document.querySelector('.project-result');
  if (projectMap && projectResult) {
    const cards = [...document.querySelectorAll('.repo-card[data-category]')];
    projectMap.hidden = false;
    projectResult.hidden = false;
    projectMap.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-filter]');
      if (!button) return;
      const filter = button.dataset.filter;
      projectMap.querySelectorAll('button').forEach((item) => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      cards.forEach((card) => { card.hidden = filter !== 'all' && card.dataset.category !== filter; });
      const label = { all: '전체', ai: 'AI 도구', automation: '업무 자동화', utility: '개발 유틸리티' }[filter];
      projectResult.textContent = `${label} 프로젝트 ${cards.filter((card) => !card.hidden).length}개`;
    });
  }

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
      ['.tl-item', '.showcase-tabs button', '.prism-pipeline li'].forEach((sel) => {
        section.querySelectorAll(sel).forEach((el, i) => {
          el.style.setProperty('--reveal-i', String(i));
        });
      });
    }
    sections.forEach(prepReveal);

    if (!('IntersectionObserver' in window) || reduced) {
      sections.forEach((s) => s.classList.add('in-view'));
      return;
    }
    // Only sections still below the fold once load, anchor jump and scroll restore are done get the
    // hidden pre-state, so F5 or a #link never fades in content that is already on screen.
    function flagBelowFold() {
      requestAnimationFrame(() => {
        sections.forEach((s) => {
          if (!s.classList.contains('in-view') && s.getBoundingClientRect().top > innerHeight) s.classList.add('will-reveal');
        });
      });
    }
    if (document.readyState === 'complete') flagBelowFold();
    else addEventListener('load', flagBelowFold, { once: true });
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
    const els = document.querySelectorAll('.repo-card');
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

  // ── theme toggle: light by default, dark only by choice (the head script applies it before paint) ──
  (function () {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    function sync() {
      const dark = root.dataset.theme === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
      if (meta) meta.content = dark ? '#1c1f26' : '#f6f7f9';
    }
    btn.addEventListener('click', () => {
      const dark = root.dataset.theme !== 'dark';
      if (dark) root.dataset.theme = 'dark';
      else delete root.dataset.theme;
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (_) { /* storage blocked */ }
      sync();
    });
    sync();
  })();

  // ── PRISM showcase: tabs cross-fade the stage; one autoplay pass while visible, any input stops it ──
  (function () {
    const root = document.querySelector('.prism-showcase');
    if (!root) return;
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const slides = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const url = root.querySelector('.showcase-url b');
    const stage = root.querySelector('.showcase-stage');
    const STEP = 4800;
    let current = 0;
    let timer = null;
    let played = false;

    slides.forEach((s) => { s.hidden = false; });
    root.style.setProperty('--showcase-ms', STEP + 'ms');

    function show(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => {
        const on = k === current;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        slides[k].classList.toggle('is-active', on);
        slides[k].setAttribute('aria-hidden', String(!on));
        slides[k].tabIndex = on ? 0 : -1;
      });
      url.textContent = slides[current].dataset.title;
      // replay the collection feed each time its tab opens
      const feed = slides[current].classList.contains('showcase-feed') ? slides[current] : null;
      if (feed && !reduced) {
        feed.classList.remove('is-streaming');
        void feed.offsetWidth;
        feed.classList.add('is-streaming');
      }
      if (focus) tabs[current].focus();
      root.dispatchEvent(new CustomEvent('showcase:change', { detail: { index: current } }));
    }
    function stop() {
      clearTimeout(timer);
      timer = null;
      root.classList.remove('is-playing');
    }
    function tick() {
      // restart the progress bar animation on the newly selected tab
      root.classList.remove('is-playing');
      void root.offsetWidth;
      root.classList.add('is-playing');
      timer = setTimeout(() => {
        if (current === tabs.length - 1) { stop(); show(0); return; }
        show(current + 1);
        tick();
      }, STEP);
    }

    root.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (!tab) return;
      stop();
      show(tabs.indexOf(tab));
    });
    root.addEventListener('keydown', (e) => {
      if (!e.target.closest('[role="tab"]')) return;
      const move = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (e.key === 'Home' || e.key === 'End' || move) {
        e.preventDefault();
        stop();
        show(e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : current + move, true);
      }
    });
    root.addEventListener('pointerenter', stop);
    root.addEventListener('focusin', stop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    show(0);

    if (!reduced && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting || played) return;
        played = true;
        io.disconnect();
        tick();
      }, { threshold: 0.55 });
      io.observe(stage);
    }
  })();

  window.openModal = openModal;
  window.closeModal = closeModal;
})();
