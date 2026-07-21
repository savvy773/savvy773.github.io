/**
 * PortfolioFX — 배경 이펙트 엔진 (Canvas 2D)
 *
 * 분리 이유:
 * - HTML 페이지로 나누지 않음 (전환·상태·리소스 공유 불리)
 * - SVG DOM 다수는 GC/레이아웃 부담
 * - 한 장의 canvas + 모드 플러그인이 유지보수·성능 균형이 가장 좋음
 *
 * 모드: rain | snow | drops | waves | fire | space | moonshot  (단축키 1–7)
 * 공통: fps throttle, idle freeze, prefers-reduced-motion, localStorage
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'portfolio-fx-mode';
  const MODES = ['rain', 'snow', 'drops', 'waves', 'fire', 'space', 'moonshot'];
  const LABELS = {
    rain: '비',
    snow: '눈',
    drops: '빗방울',
    waves: '물결',
    fire: '불꽃',
    space: '우주',
    moonshot: '문샷',
  };

  function isMobile() {
    return matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  }
  let mobile = isMobile();

  /** @type {HTMLCanvasElement|null} */
  let canvas = null;
  /** @type {CanvasRenderingContext2D|null} */
  let ctx = null;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let mode = 'drops';
  let particles = [];
  let wavePhase = 0;
  let wind = 0;
  let windTarget = 0;

  let running = false;
  let frozen = false;
  let raf = null;
  let lastDraw = 0;
  let lastInput = 0;
  let lastTs = 0;

  function buildCfg() {
    mobile = isMobile();
    return {
      maxDpr: 1,
      renderScale: mobile ? 0.38 : 0.48,
      fpsActive: mobile ? 14 : 18,
      fpsIdle: mobile ? 7 : 8,
      idleMs: 2000,
      freezeMs: mobile ? 4000 : 5000,
      mouseLerp: 0.08,
      counts: {
        rain: mobile ? 8 : 14,
        snow: mobile ? 6 : 12,
        drops: mobile ? 3 : 4,
        waves: 0,
        fire: mobile ? 8 : 14,
        space: mobile ? 12 : 22,
        moonshot: mobile ? 5 : 10,
      },
    };
  }
  let CFG = buildCfg();

  // ── modes ──────────────────────────────────────────────

  function floorY(z) {
    return h * (0.48 + z * 0.42);
  }

  const makers = {
    rain() {
      const layer = Math.random();
      return {
        x: Math.random() * w * 1.2 - w * 0.1,
        y: Math.random() * h,
        len: layer > 0.7 ? 12 + Math.random() * 14 : layer > 0.35 ? 8 + Math.random() * 8 : 4 + Math.random() * 5,
        speed: layer > 0.7 ? 10 + Math.random() * 6 : layer > 0.35 ? 6 + Math.random() * 4 : 3.5 + Math.random() * 2.5,
        thick: layer > 0.7 ? 1.3 : layer > 0.35 ? 1 : 0.65,
        layer,
        drift: (Math.random() - 0.5) * 0.35,
      };
    },
    snow() {
      const z = Math.random();
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.2 + z * 3.2,
        z,
        vy: 0.4 + z * 1.1,
        vx: (Math.random() - 0.5) * 0.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpd: 0.02 + Math.random() * 0.03,
      };
    },
    drops() {
      const z = 0.35 + Math.random() * 0.65;
      // size = 빗방울 몸통 반폭 (공처럼 크게 그리지 않음)
      const size = 2.2 + z * 3.4;
      return {
        x: Math.random() * w,
        y: -20 - Math.random() * h * 0.4,
        z,
        size,
        vy: 2.5 + Math.random() * 3.5, // 낙하 시작 속도
        vx: (Math.random() - 0.5) * 0.35,
        bounces: 0,
        squash: 1,   // 1=정상, <1 납작(착지), >1 세로로 늘어진 물방울
        stretch: 1.35, // 낙하 중 세로 비율
        hue: Math.random() < 0.55 ? 'violet' : 'teal',
      };
    },
    // 위로 뜨는 불씨 — 비/눈과 반대 방향, 따뜻한 색
    fire() {
      return {
        x: w * 0.5 + (Math.random() - 0.5) * w * 0.55,
        y: h + 10 + Math.random() * 50,
        r: 1.8 + Math.random() * 4.5,
        vy: -(1.8 + Math.random() * 3.2),
        vx: (Math.random() - 0.5) * 1.2,
        life: 0.75 + Math.random() * 0.25,
        decay: 0.006 + Math.random() * 0.01,
        heat: Math.random(), // 0 노랑 → 1 빨강
      };
    },
    // 카메라 쪽으로 날아오는 별 (원근 워프) — 눈/비와 다른 3D 깊이감
    space() {
      return {
        x: (Math.random() - 0.5) * 2.2,
        y: (Math.random() - 0.5) * 2.2,
        z: 0.15 + Math.random() * 1.6,
        spd: 0.012 + Math.random() * 0.022,
        tw: Math.random() * Math.PI * 2,
      };
    },
    // 궤도 노드 + 혜성 — 물결과 다른 “런치/오빗” 무드
    moonshot() {
      const comet = Math.random() < 0.18;
      return {
        angle: Math.random() * Math.PI * 2,
        radius: 36 + Math.random() * Math.min(w, h) * 0.32,
        speed: (0.006 + Math.random() * 0.012) * (Math.random() < 0.5 ? 1 : -1),
        size: comet ? 2.2 + Math.random() * 1.4 : 1.4 + Math.random() * 2.2,
        tilt: 0.35 + Math.random() * 0.45,
        comet,
        trail: comet ? 10 + Math.random() * 14 : 0,
        hue: Math.random() < 0.5 ? 'violet' : 'cyan',
      };
    },
  };

  function rebuild() {
    particles = [];
    wavePhase = 0;
    const n = CFG.counts[mode] || 0;
    if (mode === 'waves') return;
    const make = makers[mode];
    if (!make) return;
    for (let i = 0; i < n; i++) particles.push(make());
  }

  // ── draw steps ─────────────────────────────────────────

  function stepRain(dt) {
    const angle = 0.22 + wind * 0.04;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const vxB = Math.sin(angle);
    const vyB = Math.cos(angle);
    ctx.lineCap = 'round';
    // 단색 stroke (프레임당 gradient 생성 없음)
    ctx.strokeStyle = 'rgba(186,170,245,0.38)';
    ctx.lineWidth = 1.05;

    for (let i = 0; i < particles.length; i++) {
      const d = particles[i];
      const spd = d.speed * dt;
      d.x += vxB * spd + wind * 0.4 + d.drift;
      d.y += vyB * spd * 1.15;
      if (d.y > h + 20 || d.x < -50 || d.x > w + 50) {
        particles[i] = makers.rain();
        particles[i].y = -10 - Math.random() * 40;
        particles[i].x = Math.random() * w;
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - sin * d.len, d.y - cos * d.len);
      ctx.stroke();
    }
  }

  function stepSnow(dt) {
    ctx.fillStyle = 'rgba(230,232,255,0.45)';
    for (let i = 0; i < particles.length; i++) {
      const d = particles[i];
      d.wobble += d.wobbleSpd * dt;
      d.x += (Math.sin(d.wobble) * 0.7 + d.vx + wind * 0.5) * dt * 2.2;
      d.y += d.vy * dt * 2.4;
      if (d.y > h + 10) {
        d.y = -8;
        d.x = Math.random() * w;
      }
      if (d.x < -10) d.x = w + 5;
      if (d.x > w + 10) d.x = -5;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** 빗방울 실루엣: 위는 둥글고 아래가 뾰족한 물방울 (공/구체 아님) */
  function pathRaindrop(x, y, halfW, halfH, tipExtra) {
    const top = y - halfH;
    const bot = y + halfH + tipExtra;
    ctx.beginPath();
    ctx.moveTo(x, bot);
    ctx.bezierCurveTo(x + halfW * 1.15, y + halfH * 0.15, x + halfW, top + halfH * 0.2, x, top);
    ctx.bezierCurveTo(x - halfW, top + halfH * 0.2, x - halfW * 1.15, y + halfH * 0.15, x, bot);
    ctx.closePath();
  }

  function stepDrops(dt) {
    const g = 0.55;
    const rest = 0.68;
    const ground = h * 0.78;
    // n 작아서 sort 생략

    ctx.strokeStyle = 'rgba(167,139,250,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, ground + 0.5);
    ctx.lineTo(w, ground + 0.5);
    ctx.stroke();

    for (let i = 0; i < particles.length; i++) {
      const d = particles[i];
      d.vy += g * dt * (0.9 + d.z * 0.25);
      d.vx += wind * 0.04 * dt;
      d.vx *= Math.pow(0.99, dt);
      d.x += d.vx * dt * 2.8;
      d.y += d.vy * dt * 3.0;

      const falling = d.vy > 0.4;
      const targetStretch = falling ? 1.25 + Math.min(1.1, d.vy * 0.08) : 1;
      d.stretch += (targetStretch - d.stretch) * 0.2 * dt;
      d.squash += (1 - d.squash) * 0.22 * dt;

      const halfH = d.size * d.stretch * d.squash;
      const tip = falling ? d.size * 0.55 * d.stretch : d.size * 0.15;
      const bottom = d.y + halfH + tip * 0.35;

      if (bottom >= ground && d.vy > 0) {
        d.y = ground - halfH - tip * 0.2;
        const impact = Math.abs(d.vy);
        d.vy = -impact * rest;
        d.vx += wind * 0.2 + (Math.random() - 0.5) * 0.35;
        d.squash = 0.38;
        d.stretch = 0.55;
        d.bounces += 1;
        if (d.bounces >= 4 || impact < 1.6) {
          particles[i] = makers.drops();
          continue;
        }
      }

      if (d.x < -30 || d.x > w + 30 || d.y > h + 40) {
        particles[i] = makers.drops();
        continue;
      }

      const hh = d.size * d.stretch * d.squash;
      const hw = d.size * (1.15 / Math.max(0.45, d.stretch)) * (2.05 - d.squash);
      const tipEx = d.vy > 0.3 ? d.size * 0.65 * d.stretch : d.size * 0.12;

      // 단색 채우기 (gradient 생성 비용 제거)
      pathRaindrop(d.x, d.y, hw, hh, tipEx);
      ctx.fillStyle = d.hue === 'violet'
        ? 'rgba(186,170,245,0.55)'
        : 'rgba(125,220,205,0.5)';
      ctx.fill();
    }
  }

  function stepWaves(dt) {
    wavePhase += dt * 0.045;
    const bands = 2;
    const baseY = h * 0.64;
    const stepX = mobile ? 14 : 12;

    ctx.fillStyle = 'rgba(40,36,70,0.22)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY);
    for (let x = 0; x <= w; x += stepX) {
      const n = Math.sin(x * 0.012 + wavePhase) * 10
        + Math.sin(x * 0.007 + wavePhase * 0.7) * 12
        + wind * 4;
      ctx.lineTo(x, baseY + n);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    for (let b = 0; b < bands; b++) {
      const t = b / Math.max(1, bands - 1);
      const amp = 10 + t * 14;
      const y0 = baseY - 20 + t * 40;
      const speed = 1 + t * 0.45;
      ctx.beginPath();
      for (let x = 0; x <= w; x += stepX) {
        const y = y0
          + Math.sin(x * 0.014 + wavePhase * speed + b) * amp
          + wind * (2 + t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = t > 0.5 ? 'rgba(196,181,253,0.22)' : 'rgba(94,234,212,0.16)';
      ctx.lineWidth = 1.15;
      ctx.stroke();
    }
  }

  function stepFire(dt) {
    const baseX = w * 0.5 + wind * 18;
    for (let i = 0; i < particles.length; i++) {
      const d = particles[i];
      d.life -= d.decay * dt * 1.4;
      d.vy *= Math.pow(0.995, dt);
      d.vx += (Math.sin(d.y * 0.04) * 0.08 + wind * 0.05) * dt;
      d.x += d.vx * dt * 2.4;
      d.y += d.vy * dt * 2.6;
      d.r *= Math.pow(0.992, dt);

      if (d.life <= 0.05 || d.y < -30) {
        particles[i] = makers.fire();
        particles[i].x = baseX + (Math.random() - 0.5) * w * 0.45;
        continue;
      }

      const a = d.life * 0.65;
      const r = Math.max(0.7, d.r * (0.55 + d.life));
      ctx.beginPath();
      ctx.arc(d.x, d.y, r * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = d.heat < 0.45
        ? 'rgba(251,191,36,' + a + ')'
        : d.heat < 0.75
          ? 'rgba(249,115,22,' + a + ')'
          : 'rgba(244,63,94,' + a * 0.85 + ')';
      ctx.fill();
    }
  }

  function stepSpace(dt) {
    const cx = w * 0.5 + wind * 12;
    const cy = h * 0.48;
    const fov = Math.min(w, h) * 0.55;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(220,225,255,0.4)';
    ctx.fillStyle = 'rgba(235,238,255,0.55)';

    for (let i = 0; i < particles.length; i++) {
      const d = particles[i];
      d.z -= d.spd * dt * 1.35;
      if (d.z <= 0.08) {
        d.x = (Math.random() - 0.5) * 2.2;
        d.y = (Math.random() - 0.5) * 2.2;
        d.z = 1.4 + Math.random() * 0.5;
        d.spd = 0.012 + Math.random() * 0.022;
      }

      const sx = cx + (d.x / d.z) * fov;
      const sy = cy + (d.y / d.z) * fov;
      const size = Math.min(3.8, (1.0 / d.z) * 1.5);
      const streak = size * (1.0 + (1 - d.z) * 2.8);
      const ang = Math.atan2(sy - cy, sx - cx);

      ctx.lineWidth = Math.max(0.55, size * 0.4);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - Math.cos(ang) * streak, sy - Math.sin(ang) * streak);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx, sy, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function stepMoonshot(dt) {
    const cx = w * 0.5 + wind * 10;
    const cy = h * 0.42;
    wavePhase += dt * 0.02;

    // 링 1개만
    const rad = Math.min(w, h) * 0.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rad, rad * 0.45, -0.35, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(167,139,250,0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(196,181,253,0.12)';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineCap = 'round';
    for (let i = 0; i < particles.length; i++) {
      const d = particles[i];
      d.angle += d.speed * dt * 1.5;
      const ex = Math.cos(d.angle) * d.radius;
      const ey = Math.sin(d.angle) * d.radius * d.tilt;
      const sx = cx + ex;
      const sy = cy + ey;

      if (d.comet) {
        const tx = sx - Math.cos(d.angle) * d.trail * d.speed * 70;
        const ty = sy - Math.sin(d.angle) * d.trail * d.speed * 70 * d.tilt;
        ctx.strokeStyle = d.hue === 'violet' ? 'rgba(196,181,253,0.4)' : 'rgba(94,234,212,0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }

      ctx.fillStyle = d.hue === 'violet' ? 'rgba(196,181,253,0.7)' : 'rgba(94,234,212,0.65)';
      ctx.beginPath();
      ctx.arc(sx, sy, d.size * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const steppers = {
    rain: stepRain,
    snow: stepSnow,
    drops: stepDrops,
    waves: stepWaves,
    fire: stepFire,
    space: stepSpace,
    moonshot: stepMoonshot,
  };

  // ── engine ─────────────────────────────────────────────

  function resize() {
    if (!canvas || !ctx) return;
    // 회전·리사이즈 시 모바일 설정 재평가
    CFG = buildCfg();
    dpr = Math.min(window.devicePixelRatio || 1, CFG.maxDpr) * CFG.renderScale;
    w = Math.max(1, Math.floor(innerWidth));
    h = Math.max(1, Math.floor(innerHeight));
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    rebuild();
  }

  function frame(now) {
    const dt = Math.min(32, now - lastTs) / 16.67;
    lastTs = now;
    wind += (windTarget - wind) * CFG.mouseLerp;
    ctx.clearRect(0, 0, w, h);
    const step = steppers[mode];
    if (step) step(dt);
  }

  function loop(t) {
    if (!running) {
      raf = null;
      return;
    }
    raf = requestAnimationFrame(loop);
    const now = t !== undefined ? t : performance.now();
    const idleFor = now - lastInput;
    if (idleFor > CFG.freezeMs) {
      frozen = true;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      return;
    }
    const interval = idleFor > CFG.idleMs ? 1000 / CFG.fpsIdle : 1000 / CFG.fpsActive;
    if (now - lastDraw < interval) return;
    lastDraw = now;
    frame(now);
  }

  function start() {
    if (!canvas || !ctx || raf || document.hidden) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    running = true;
    frozen = false;
    lastInput = performance.now();
    lastTs = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  function markActive() {
    lastInput = performance.now();
    if (frozen) {
      frozen = false;
      start();
    }
  }

  function setMode(next) {
    if (!MODES.includes(next)) return;
    mode = next;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (_) { /* private mode */ }
    rebuild();
    markActive();
    if (!running && !document.hidden) start();
    syncUi();
    document.dispatchEvent(new CustomEvent('fx:mode', { detail: { mode } }));
  }

  function syncUi() {
    document.querySelectorAll('[data-fx-mode]').forEach((btn) => {
      const on = btn.getAttribute('data-fx-mode') === mode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    const label = document.getElementById('fxModeLabel');
    if (label) label.textContent = LABELS[mode] || mode;
  }

  function init(canvasEl) {
    canvas = canvasEl || document.getElementById('rainCanvas');
    if (!canvas) return null;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return { setMode, getMode: () => mode, modes: MODES, labels: LABELS };
    }

    ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      // 소프트웨어 폴백 방지 힌트 (지원 브라우저)
      willReadFrequently: false,
    });
    if (!ctx) {
      canvas.style.display = 'none';
      return null;
    }
    // 서브픽셀 안티앨리어싱 비용 약간 완화
    ctx.imageSmoothingEnabled = false;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && MODES.includes(saved)) mode = saved;
    } catch (_) { /* ignore */ }

    resize();
    start();
    syncUi();

    addEventListener('pointermove', (e) => {
      markActive();
      windTarget = ((e.clientX / Math.max(innerWidth, 1)) * 2 - 1) * (mode === 'waves' ? 1.2 : 0.55);
    }, { passive: true });
    ['pointerdown', 'wheel', 'touchstart', 'scroll'].forEach((ev) => {
      addEventListener(ev, markActive, { passive: true });
    });

    // 단축키 1–7 → 이펙트 전환 (입력 필드·수정키 제외)
    addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      // Digit1–4 / Numpad1–4
      let idx = -1;
      if (e.code && /^Digit[1-9]$/.test(e.code)) idx = parseInt(e.code.slice(5), 10) - 1;
      else if (e.code && /^Numpad[1-9]$/.test(e.code)) idx = parseInt(e.code.slice(6), 10) - 1;
      else if (e.key >= '1' && e.key <= '9') idx = parseInt(e.key, 10) - 1;
      if (idx < 0 || idx >= MODES.length) {
        markActive();
        return;
      }
      e.preventDefault();
      setMode(MODES[idx]);
      markActive();
    });

    let resizeT;
    addEventListener('resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        resize();
        markActive();
      }, 200);
    });

    function setPagePaused(on) {
      document.documentElement.classList.toggle('fx-paused', on);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stop();
        setPagePaused(true);
      } else {
        setPagePaused(false);
        markActive();
        start();
      }
    });
    document.addEventListener('bg:pause', () => {
      stop();
      setPagePaused(true);
    });
    document.addEventListener('bg:resume', () => {
      setPagePaused(false);
      markActive();
      start();
    });

    return {
      setMode,
      getMode: () => mode,
      modes: MODES,
      labels: LABELS,
      start,
      stop,
    };
  }

  global.PortfolioFX = { init, setMode, getMode: () => mode, modes: MODES, labels: LABELS };
})(typeof window !== 'undefined' ? window : globalThis);
