# 기술 스택

빌드리스(no build step) 정적 포트폴리오.
프레임워크·번들러 없이 **순수 HTML / CSS / JS**만 사용합니다.

- **사이트**: https://savvy773.github.io/
- **저장소**: https://github.com/savvy773/savvy773.github.io

---

## 파일 구조

```text
savvy773.github.io/
├── index.html              # 마크업·메타만 (슬림)
├── css/
│   └── site.css            # 디자인 토큰·오로라·격자·UI·반응형
├── js/
│   ├── effects.js          # Canvas 2D 배경 이펙트 엔진
│   └── app.js              # Pages 드롭다운·모달·reveal·타임라인·FX 부트
├── journey/                # Journey 문서 (HTML)
├── resume/
│   └── resume.html
├── docs/
│   └── tech-stack.md       # 이 문서
└── README.md
```

| 경로 | 역할 |
|------|------|
| `index.html` | 구조·콘텐츠. 인라인 CSS/JS 없음 |
| `css/site.css` | 전역 스타일, 파스텔 다크 테마 |
| `js/effects.js` | 배경 FX (defer, `app.js`보다 먼저 로드) |
| `js/app.js` | UI 상호작용 (defer) |

---

## 배포

| 항목 | 값 |
|------|-----|
| 호스팅 | **GitHub Pages** |
| 빌드 | 없음 — 정적 파일 그대로 서빙 |
| 브랜치 | `main` (루트) |

---

## 폰트

| 용도 | 패밀리 |
|------|--------|
| 본문·UI | **Inter** (Google Fonts) |
| 모노·라벨 | **IBM Plex Mono** |

- `preconnect` + `display=swap` (print media onload 패턴)
- `noscript` 폴백 링크 포함

---

## 배경 레이어

### 1) CSS (`css/site.css`)

| 레이어 | 설명 |
|--------|------|
| `.bg-stack` | 파스텔 다크 베이스 그라데이션 (`#18162a` 계열) |
| `.aurora-a` / `.aurora-b` | soft radial 오로라 2개 (blur 필터 없음 → 비용 절감) |
| `.cyber-grid` | 상단 **원근 격자** (`perspective` + `rotateX`), 한 겹·애니 최소화 |

의도적으로 연출을 줄여 콘텐츠 가독성을 우선합니다 (오로라 2개, 격자 opacity 낮춤).

### 2) Canvas 2D (`js/effects.js` · `#rainCanvas`)

한 장의 canvas에 **모드 플러그인** 방식.

| 키 | 모드 | 설명 |
|----|------|------|
| **1** | `rain` | 대각 빗줄기 |
| **2** | `snow` | 눈송이 + 흔들림 |
| **3** | `drops` | 물방울 실루엣 낙하 + 바닥 통통 (기본) |
| **4** | `waves` | 하단 물결 밴드 |
| **5** | `fire` | 위로 뜨는 불씨 (온색 그라데이션) |
| **6** | `space` | 원근 워프 별 (카메라로 돌진) |
| **7** | `moonshot` | 궤도 링 + 노드/혜성 |

**UI**

- 로고 **우측** **`.fx-dock`** (topnav Pages/GitHub/Resume와 분리)
- 메뉴 선택 또는 **키보드 1–7** (Numpad 포함)
- 선택값은 `localStorage` 키 `portfolio-fx-mode`에 저장

**성능 가드**

| 항목 | 내용 |
|------|------|
| 해상도 | `renderScale` ~0.40–0.48, `maxDpr: 1` |
| FPS | 활성 ~15–18 / 유휴 ~8 |
| 파티클 수 | 모드별 최소 (rain 14 · drops 4 · space 22 등) |
| 드로잉 | 프레임당 `createGradient` 회피, 단색 fill/stroke 위주 |
| Idle freeze | 5초 무입력 시 루프 정지 |
| 모달/탭 | `bg:pause` + `html.fx-paused`로 CSS 오로라 애니 정지 |
| 모션 감소 | `prefers-reduced-motion` → canvas 비표시 |

**왜 Canvas 한 장 + JS 모듈인가**

- 효과마다 HTML 페이지 분리 → 전환·상태 공유 불리
- SVG DOM 파티클 → 레이아웃/GC 부담
- WebGL 풀스크린 성운 → 이 장면 대비 과함
→ **CSS 분위기 + 얇은 Canvas 2D** 조합이 유지보수·GPU 균형에 유리

---

## UI 컴포넌트 (`js/app.js`)

| 컴포넌트 | 구현 |
|----------|------|
| **Pages 드롭다운** | 상단 topnav 내 `#navDd` — Repos / Journey 모달 진입 |
| **Effect dock** | 우하단 `#fxDd` — topnav와 DOM·스타일 분리 |
| **모달** | 네이티브 `<dialog>` + iframe 미리보기 (`?v=timestamp` 캐시 무효화) |
| **Reveal** | `IntersectionObserver` + `content-visibility: auto` |
| **Journey 타임라인** | 스크롤 진행 바 (`rAF` 스로틀) |

상단 메뉴 구성: **Pages · GitHub · Resume**
(Effect는 메뉴 바가 아닌 독립 dock)

---

## CSS 설계

- **디자인 토큰**: `:root` 색상·여백·그림자·`--mono` / `--ease`
- **파스텔 accent**: `color-mix(in srgb, …)` 바이올렛 / 틸
- **상단바**: `backdrop-filter` 미사용 (배경 애니 위 재블러 비용 회피)
- **포커스**: `:focus-visible` accent 링
- **반응형**: `max-width` 구간에서 네비·격자·FX dock 패딩 조정

---

## 접근성

- `prefers-reduced-motion: reduce` → 오로라 애니 정지, Canvas FX 끔
- 키보드: Effect **1–4**, Escape로 드롭다운/모달 닫기
- 입력 필드 포커스 중에는 FX 단축키 무시
- `aria-expanded` / `aria-hidden` 드롭다운 동기화

---

## 로컬 확인

```bash
# 저장소 루트에서
npx --yes serve .
```

브라우저에서 루트 열고 Effect dock 또는 `1`–`7` 로 배경 모드를 바꿔 보면 됩니다.
