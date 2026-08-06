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
│   └── thumbs/             # 리포·저니 카드 썸네일 (webp)
├── css/
│   └── site.css            # 토큰·페이퍼 그레인·글래스 카드·호버·반응형
├── js/
│   ├── app.js              # 모달·스크롤·reveal·카드 틸트·타임라인 진행
│   └── effects.js          # no-op (구 Canvas FX 자리, 로드하지 않음)
├── journey/                # Journey HTML 문서
├── resume/
│   └── resume.html
├── scripts/
│   └── screenshot.mjs      # README 프리뷰 스샷 캡처
├── docs/
│   └── tech-stack.md       # 이 문서
└── README.md
```

| 경로 | 역할 |
|------|------|
| `index.html` | 구조·콘텐츠, 배경은 CSS `.paper-grain`만 사용 |
| `css/site.css` | 전역 스타일, 페이퍼 그레인 라이트 테마 (블러 없는 불투명 글래스) |
| `js/app.js` | 모달, 스크롤 topbar 상태, reveal, 카드 틸트, 타임라인 진행 바 |
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
| 디스플레이 헤드라인 | **Fraunces** (`--display`, 세리프) |
| 모노·라벨 | **IBM Plex Mono** (`--mono`) |

- `preconnect` + `display=swap`

---

## 배경 레이어 (`.mesh-tint` + `.paper-grain`)

비디오·Canvas 없이 **정적 CSS 레이어 두 장**으로만 배경을 구성합니다. 둘 다 `position: fixed`라 스크롤해도 뷰포트 코너에 고정됩니다.

| 레이어 | 역할 | 구현 |
|--------|------|------|
| `.mesh-tint` (z-index -3) | 코너 컬러 워시 (좌상단 accent, 우측 accent-2) | 라디얼 그라데이션 2겹, 자체 `opacity: 1` |
| `.paper-grain` (z-index -2) | 종이 질감 노이즈 | `feTurbulence` 기반 인라인 SVG data URI, `mix-blend-mode: multiply`, `opacity: 0.34` (모바일·`reduced-motion` 0.22) |
| 상단 | `.accent-bar` — 3px 고정 accent 컬러 바 |

`.mesh-tint`를 `.paper-grain`의 `::after`로 두지 않고 **별도 형제 엘리먼트**로 분리한 이유: CSS `opacity`는 해당 엘리먼트의 자손·의사 엘리먼트를 통째로 낮은 불투명도로 합성하기 때문에, `::after`로 뒀다면 그라데이션 자체 alpha가 `.paper-grain`의 `opacity`(0.34)와 다시 곱해져 의도한 색보다 훨씬 옅게 렌더링됨.

- 정적 이미지/그라데이션이라 디코드·재생 비용 없음 (구 비디오 배경 대비 GPU/네트워크 부담 없음)
- **Canvas 파티클 / 메시 애니메이션(움직이는 그라데이션) / 커서 스포트라이트 없음** — 워시 자체는 고정 그라데이션, 애니메이션 아님

---

## 성능 원칙

| 원칙 | 구현 |
|------|------|
| Idle 비용 최소화 | JS rAF 루프·무한 CSS 애니 없음 (배경은 정적 SVG 노이즈) |
| 커서 추적 최소화 | pointermove는 `repo-card`/`tl-item` 호버 틸트에만 사용, 페이지 전역 스포트라이트 없음 |
| 호버만 모션 | `@media (hover: hover)` + transform/box-shadow (요소 단위) |
| 블러 회피 | `backdrop-filter` 미사용 → 반투명 불투명 패널(`.glass`) |
| 스크롤 | 탑바 `is-scrolled` 토글 + 타임라인 진행 높이만 (`rAF` 스로틀) |
| Reveal | opacity + translateY 1회성 페이드 (연속 애니 없음) |

목표: 유휴·스크롤 시 GPU **수 % 이하** (실측 ~3% 미만 구간).

---

## UI 컴포넌트 (`js/app.js`)

| 컴포넌트 | 구현 |
|----------|------|
| **모달** | 네이티브 `<dialog>` + iframe (`?v=timestamp` 캐시 무효화) |
| **Reveal** | `IntersectionObserver` + `content-visibility: auto`, 섹션 1회 등장 |
| **카드 틸트** | `repo-card` / `tl-item`에 `mousemove` 기반 3D 틸트 (hover + fine pointer 전용, `reduced-motion` 제외) |
| **Journey 타임라인** | 스크롤 진행 바 (`#timelineProgress`) |
| **탑바** | 스크롤 시 `.is-scrolled` |

상단 메뉴: **Projects · Journey · GitHub · Resume**  
하단 푸터: **GitHub** 만 (Resume 없음)

---

## CSS 설계 (`css/site.css`)

- **토큰**: `:root` 색상·여백·`--display` / `--mono` / `--ease`
- **글래스**: `.glass` — gradient 패널 + 보더, **backdrop-filter 없음**
- **호버** (`@media (hover: hover)`):
  - repo 카드 / timeline 아이템: 포인터 기반 3D 틸트(JS) + border-color accent + shadow, 썸네일 scale(1.05)
  - stat 카드: lift(`translateY`) + 미세 rotate + border-color accent
  - timeline: 노드 발광(accent 배경 + scale), 화살표 이동
  - 버튼·스킬 칩·태그: lift(`translateY`) + color/border/background 전환 (scale 없음)
- **상단바**: sticky, 반투명 solid (blur 없음)
- **포커스**: `:focus-visible` accent 링
- **반응형**: 좁은 화면 1열 카드, 모달 풀스크린

---

## 접근성

- `prefers-reduced-motion: reduce` → 카드 틸트/hover transform 끔, reveal 즉시 표시, 그레인 배경 opacity 축소
- Escape로 모달 닫기
- 배경 레이어(`.mesh-tint`, `.paper-grain`) 모두 `aria-hidden` (장식용)

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
