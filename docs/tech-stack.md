# 기술 스택

빌드리스(no build step) 정적 포트폴리오.
프레임워크·번들러 없이 **순수 HTML / CSS / JS**만 사용합니다.

- **사이트**: https://savvy773.github.io/
- **저장소**: https://github.com/savvy773/savvy773.github.io

---

## 파일 구조

```text
savvy773.github.io/
├── index.html              # 마크업·메타 (인라인 CSS/JS 없음)
├── assets/
│   ├── bg-loop.mp4         # 배경 10초 루프 (~0.9MB)
│   └── bg-poster.jpg       # 포스터·reduced-motion 폴백
├── css/
│   └── site.css            # 토큰·배경 비디오·글래스·호버·반응형
├── js/
│   ├── app.js              # 네비·모달·비디오 제어·reveal·타임라인
│   └── effects.js          # no-op (구 Canvas FX 자리, 로드하지 않음)
├── journey/                # Journey HTML 문서
├── resume/
│   └── resume.html
├── docs/
│   └── tech-stack.md       # 이 문서
└── README.md
```

| 경로 | 역할 |
|------|------|
| `index.html` | 구조·콘텐츠·배경 `<video>` |
| `assets/bg-loop.mp4` | muted / loop / playsinline 배경 영상 |
| `assets/bg-poster.jpg` | 로딩·모션 감소 시 정지 배경 |
| `css/site.css` | 전역 스타일, 저GPU 글래스 다크 테마 |
| `js/app.js` | UI 상호작용 + 배경 비디오 pause/play |
| `js/effects.js` | 비활성 stub (호환용, `index.html`에서 미로드) |

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
| 디스플레이 헤드라인 | **Space Grotesk** |
| 모노·라벨 | **IBM Plex Mono** |

- `preconnect` + `display=swap`

---

## 배경 레이어

### 1) 비디오 (`#bgVideo` · `assets/bg-loop.mp4`)

| 항목 | 내용 |
|------|------|
| 길이 | **10초** 루프 |
| 용량 | ~0.9MB (Ken Burns 스타일 pan/zoom, H.264) |
| 속성 | `muted` `playsinline` `loop` `autoplay` `preload="metadata"` |
| 포스터 | `assets/bg-poster.jpg` |
| 불투명도 | 데스크톱 ~0.55 / 모바일 ~0.42 + `.bg-veil` 오버레이 |

**수명 주기 (`js/app.js`)**

| 이벤트 | 동작 |
|--------|------|
| 로드 | `play()` (차단 시 포스터만 표시) |
| 탭 숨김 | `pause()` |
| 탭 복귀 | `play()` (모달 열려 있으면 제외) |
| 모달 open | `pause()` |
| 모달 close | `play()` |
| `prefers-reduced-motion` | 소스 제거·재생 안 함 → 포스터/CSS 배경만 |

### 2) CSS 폴백 (`.bg-stack`)

- 비디오 미지원·로딩 전: `bg-poster.jpg` + 다크 베이스 컬러
- `.bg-veil`: 가독용 그라데이션 딤
- **Canvas 파티클 / 메시 애니 / 커서 스포트라이트 없음** (GPU 절약)

---

## 성능 원칙

| 원칙 | 구현 |
|------|------|
| Idle 비용 최소화 | JS rAF 루프·무한 CSS 애니 없음 (배경은 하드웨어 비디오 디코드) |
| 마우스 추적 없음 | pointermove 패럴랙스·틸트·spotlight 제거 |
| 호버만 모션 | `@media (hover: hover)` + transform/box-shadow (요소 단위) |
| 블러 회피 | `backdrop-filter` 미사용 → 반투명 불투명 패널(`.glass`) |
| 스크롤 | 탑바 `is-scrolled` 토글 + 타임라인 진행 높이만 (`rAF` 스로틀) |
| Reveal | opacity 페이드만 (translate 애니 없음) |

목표: 유휴·스크롤 시 GPU **수 % 이하** (실측 ~3% 미만 구간).

---

## UI 컴포넌트 (`js/app.js`)

| 컴포넌트 | 구현 |
|----------|------|
| **Pages 드롭다운** | `#navDd` — Repos / Journey → 모달 |
| **모달** | 네이티브 `<dialog>` + iframe (`?v=timestamp` 캐시 무효화) |
| **배경 비디오** | pause/resume (탭·모달·reduced-motion) |
| **Reveal** | `IntersectionObserver` + `content-visibility: auto` |
| **Journey 타임라인** | 스크롤 진행 바 (`#timelineProgress`) |
| **탑바** | 스크롤 시 `.is-scrolled` |

상단 메뉴: **Pages · GitHub · Resume**  
하단 푸터: **GitHub** 만 (Resume 없음)

---

## CSS 설계 (`css/site.css`)

- **토큰**: `:root` 색상·여백·`--display` / `--mono` / `--ease`
- **글래스**: `.glass` — gradient 패널 + 보더, **backdrop-filter 없음**
- **호버** (`@media (hover: hover)`):
  - repo 카드: lift / scale / 그라데이션 보더 / shine
  - stat 카드: lift + 하이라이트 스윕
  - timeline: 가로 이동 + 노드 발광
  - 버튼·스킬 칩: lift / scale
- **상단바**: sticky, 반투명 solid (blur 없음)
- **포커스**: `:focus-visible` accent 링
- **반응형**: 좁은 화면 1열 카드, 모달 풀스크린

---

## 접근성

- `prefers-reduced-motion: reduce` → 배경 비디오 끔, 호버 transform 끔, reveal 즉시 표시
- Escape로 드롭다운/모달 닫기
- `aria-expanded` / `aria-hidden` 드롭다운 동기화
- 배경 비디오 `aria-hidden` (장식용)

---

## 로컬 확인

```bash
# 저장소 루트에서
npx --yes serve .
```

브라우저에서 루트를 열면 됩니다.

---

## README 미리보기 스샷 (CLI)

Playwright CLI로 `.github/preview.png`를 갱신합니다.

```bash
# 저장소 루트 — 내장 정적 서버 + 캡처
node scripts/screenshot.mjs

# 옵션
node scripts/screenshot.mjs --viewport 1440,900 --wait 2500
node scripts/screenshot.mjs --url http://localhost:4173 --out .github/preview.png
```

필요: Node.js, `npx playwright` (브라우저 미설치 시 `npx playwright install chromium`).
