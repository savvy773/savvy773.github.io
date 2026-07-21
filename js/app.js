/* site app: nav dropdowns, modal, reveal, timeline + FX init */
// ── dropdowns: Pages(topnav) + Effect(dock, 별도 UI) ──
  function dropdownParts(id) {
    const root = document.getElementById(id);
    if (!root) return null;
    return {
      root,
      btn: root.querySelector('.nav-dd-btn, .fx-dock-btn'),
      panel: root.querySelector('.nav-dd-panel, .fx-dock-panel'),
    };
  }
  function openDropdowns() {
    return document.querySelectorAll('.nav-dd.open, .fx-dock.open');
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
  function selectFx(mode) {
    if (window.PortfolioFX && typeof PortfolioFX.setMode === 'function') {
      PortfolioFX.setMode(mode);
    }
    setDropdownOpen('fxDd', false);
  }
  // Pages 드롭다운만 호버 aria 동기화 (Effect dock은 클릭 전용)
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
      const btn = el.querySelector('.nav-dd-btn, .fx-dock-btn');
      if (btn) btn.focus();
    });
  });

  // ── modal viewer (native <dialog>) ──
  const dialog = document.getElementById('modalDialog');
  const iframe = document.getElementById('modalIframe');
  const modalTitle = document.getElementById('modalTitle');
  const modalNewTab = document.getElementById('modalNewTab');

  function openModal(url, title, event) {
    if (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return true;
      event.preventDefault();
    }
    // iframe/브라우저 캐시 때문에 최신 resume·문서를 못 보는 경우 방지
    const sep = url.includes('?') ? '&' : '?';
    iframe.src = url + sep + 'v=' + Date.now();
    modalTitle.textContent = title;
    modalNewTab.href = url; // 새 탭은 클린 URL
    dialog.showModal();
    setDropdownOpen('navDd', false);
    setDropdownOpen('fxDd', false);
    document.dispatchEvent(new Event('bg:pause'));
    return false;
  }
  function closeModal() { dialog.close(); }

  // same-origin iframe 내 ESC → 모달 닫기 (cross-origin은 불가)
  iframe.addEventListener('load', () => {
    try {
      iframe.contentWindow.document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
      }, { capture: true });
    } catch (_) { /* cross-origin */ }
  });

  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeModal(); });
  dialog.addEventListener('close', () => {
    document.dispatchEvent(new Event('bg:resume'));
    setTimeout(() => { iframe.src = 'about:blank'; }, 200);
  });

// ── section reveal: 카드 개수에 맞춰 순차 딜레이 ──
  (function () {
    const sections = document.querySelectorAll('.reveal-section');
    if (!sections.length) return;

    function prepReveal(section) {
      section.querySelectorAll('.repo-card').forEach((el, i) => {
        el.style.setProperty('--reveal-i', String(i));
      });
      // timeline-progress 제외한 tl-item만
      section.querySelectorAll('.tl-item').forEach((el, i) => {
        el.style.setProperty('--reveal-i', String(i));
      });
    }
    sections.forEach(prepReveal);

    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach((s) => s.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sec = entry.target;
          sec.classList.add('revealing', 'in-view');
          io.unobserve(sec);
          // 트랜지션 끝난 뒤 will-change 해제 (레이어 승격 해제)
          setTimeout(() => sec.classList.remove('revealing'), 1200);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -60px 0px' });
    sections.forEach((s) => io.observe(s));
  })();

// ── timeline scroll progress ──
  (function () {
    const track = document.getElementById('timeline');
    const fill = document.getElementById('timelineProgress');
    if (!track || !fill) return;
    const inset = 6; // .timeline::before의 top/bottom 여백과 맞춤
    let ticking = false;

    function update() {
      ticking = false;
      const rect = track.getBoundingClientRect();
      // 타임라인 아래에 남은 콘텐츠(footer 등)가 짧으면 기하학적 계산만으로는
      // 페이지 최하단까지 스크롤해도 100%에 못 미칠 수 있어, 스크롤 끝에 도달하면 강제로 100%
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

// FX bootstrap (defer 스크립트: DOM 파싱 후 실행)
if (window.PortfolioFX) {
  PortfolioFX.init(document.getElementById('rainCanvas'));
}

// onclick 핸들러용 전역 노출
window.toggleDropdown = toggleDropdown;
window.selectFx = selectFx;
window.openModal = openModal;
window.closeModal = closeModal;

