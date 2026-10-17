/* site app: modal preview, project filters and reveal */
(function () {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Project map: each field reveals the tools that belong to it.
  const projectMap = document.querySelector('.project-map');
  const projectResult = document.querySelector('.project-result');
  if (projectMap && projectResult) {
    const cards = [...document.querySelectorAll('.repo-card[data-category]')];
    // counts, bar widths and the overview ring come from the cards on the page, so they never go stale
    const count = (cat) => cards.filter((card) => card.dataset.category === cat).length;
    const total = cards.length || 1;
    const share = { ai: count('ai') / total, automation: count('automation') / total, utility: count('utility') / total };
    projectMap.querySelectorAll('button[data-filter]').forEach((button) => {
      const cat = button.dataset.filter;
      const num = button.querySelector('strong');
      if (num) num.textContent = String(cat === 'all' ? cards.length : count(cat));
      const bar = button.querySelector('.map-track > span');
      if (bar) bar.style.setProperty('--share', `${Math.round(share[cat] * 100)}%`);
    });
    projectMap.style.setProperty('--ring-a', `${(share.ai * 100).toFixed(1)}%`);
    projectMap.style.setProperty('--ring-b', `${((share.ai + share.automation) * 100).toFixed(1)}%`);
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
    const TILT = 2; // deg — a hint of depth, not a jump
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
          el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
        });
      });
      el.addEventListener('mouseleave', () => {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        el.style.transform = '';
      });
    });
  })();

  // ── in-page links: jump straight to the section with a short cross-fade, no smooth scrolling ──
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // only links into this same page (e.g. /#journey while on the home page); other pages navigate normally
    const to = new URL(link.href, location.href);
    if (to.origin !== location.origin || to.pathname !== location.pathname || !to.hash) return;
    const id = decodeURIComponent(to.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const jump = () => {
      // show the destination as it is, without its scroll-in reveal on top of the fade
      const section = target.closest('.reveal-section');
      if (section) { section.classList.remove('will-reveal'); section.classList.add('in-view'); }
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    };
    if (document.startViewTransition && !reduced) document.startViewTransition(jump);
    else jump();
  });

  // ── theme: follows the phone/PC setting until the visitor picks one with the toggle (the head script applies it before paint) ──
  (function () {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    function sync() {
      const dark = root.dataset.theme === 'dark';
      btn.setAttribute('aria-pressed', String(dark));
      btn.setAttribute('aria-label', dark ? '라이트 모드로 전환' : '다크 모드로 전환');
      if (meta) meta.content = dark ? '#232629' : '#f5f6f4';
    }
    btn.addEventListener('click', () => {
      const dark = root.dataset.theme !== 'dark';
      if (dark) root.dataset.theme = 'dark';
      else delete root.dataset.theme;
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (_) { /* storage blocked */ }
      sync();
    });
    // switching the system theme while the page is open follows along, unless the visitor chose one
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      let chosen = null;
      try { chosen = localStorage.getItem('theme'); } catch (_) { /* storage blocked */ }
      if (chosen) return;
      if (e.matches) root.dataset.theme = 'dark';
      else delete root.dataset.theme;
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

  // showcase slides carry a light and a dark screenshot; open whichever one the theme shows
  window.openShot = (link, event) => {
    const img = [...link.querySelectorAll('img')].find((i) => getComputedStyle(i).display !== 'none') || link.querySelector('img');
    return openModal(img.currentSrc || img.src, link.dataset.title, event);
  };
  // ── tap-to-play videos: the whole picture plays/pauses; native controls appear after the first play ──
  document.querySelectorAll('video[data-player]').forEach((video) => {
    video.volume = 0.5; // start at half volume (iOS ignores this: its volume is the hardware buttons)
    const box = video.closest('.player');
    const start = () => {
      if (box) box.classList.add('is-started');
      video.controls = true;
    };
    const toggle = () => { if (video.paused) video.play().catch(() => {}); else video.pause(); };
    video.addEventListener('play', start);
    box?.querySelector('.player-play')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); video.play().catch(() => {}); });
    // a transparent layer takes clicks on the picture (browsers differ on whether the video itself toggles);
    // after the first play it stops above the native control bar
    box?.querySelector('.player-hit')?.addEventListener('click', toggle);
  });

  // ── film chapters: jump the linked video to a scene and mark the chapter being watched ──
  document.querySelectorAll('.film-chapters[data-video]').forEach((list) => {
    const video = document.getElementById(list.dataset.video);
    if (!video) return;
    const buttons = [...list.querySelectorAll('button[data-t]')];
    list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-t]');
      if (!b) return;
      video.currentTime = Number(b.dataset.t);
      video.play().catch(() => { /* autoplay blocked: the position is still set */ });
    });
    video.addEventListener('timeupdate', () => {
      let current = buttons[0];
      for (const b of buttons) if (video.currentTime >= Number(b.dataset.t)) current = b;
      buttons.forEach((b) => b.setAttribute('aria-current', String(b === current)));
    });
  });

  window.openModal = openModal;
  window.closeModal = closeModal;
})();
