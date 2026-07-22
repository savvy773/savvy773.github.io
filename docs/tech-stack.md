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
│   └── site.css            # 디자인 토큰·메시·글래스·UI·반응형
├── js/
│   ├── effects.js          # Canvas 2D ambient 배경 (단일 모드)
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
| `css/site.css` | 전역 스타일, 글래스 다크 테마 |
| `js/effects.js` | ambient 배경 (app.js보다 먼저 로드) |
| `js/app.js` | UI 상호작용 |

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

### 1) CSS (`css/site.css`)

| 레이어 | 설명 |
|--------|------|
| `.bg-stack` | 딥 다크 베이스 + 방사 그라데이션 |
| `.mesh-a/b/c` | 블러 메시 블롭 3개 (느린 float 애니) |
| `.noise` | 미세 노이즈 오버레이 |
| `.spotlight` | 커서 추적 soft 스포트라이트 (데스크톱) |

### 2) Canvas 2D (`js/effects.js` · `#fxCanvas`)

**단일 ambient 모드** — 모드 전환 UI / 단축키 없음.

| 요소 | 설명 |
|------|------|
| Soft orbs | 큰 반투명 그라데이션 원, 천천히 표류 |
| Particles | 바이올렛·시안 톤 점 파티클, 위로 부유 |
| Pointer | 마우스 위치에 약한 패럴랙스 |

**성능 가드**

| 항목 | 내용 |
|------|------|
| 해상도 | `renderScale` ~0.42–0.55, `maxDpr: 1` |
| FPS | 활성 ~20–28 / 유휴 ~8–12 |
| Idle freeze | 수 초 무입력 시 루프 정지 |
| 모달/탭 | `bg:pause` + `html.fx-paused`로 CSS 메시 애니 정지 |
| 모션 감소 | `prefers-reduced-motion` → canvas·스포트라이트 비표시 |

---

## UI 컴포넌트 (`js/app.js`)

| 컴포넌트 | 구현 |
|----------|------|
| **Pages 드롭다운** | 상단 topnav 내 `#navDd` — Repos / Journey 모달 진입 |
| **모달** | 네이티브 `<dialog>` + iframe 미리보기 (`?v=timestamp` 캐시 무효화) |
| **Spotlight** | 커서 추적 radial glow |
| **Card tilt** | repo/stat 카드 포인터 틸트 + 글로우 |
| **Reveal** | `IntersectionObserver` + `content-visibility: auto` |
| **Journey 타임라인** | 스크롤 진행 바 (`rAF` 스로틀) |

상단 메뉴 구성: **Pages · GitHub · Resume**

---

## CSS 설계

- **디자인 토큰**: `:root` 색상·여백·그림자·`--display` / `--mono` / `--ease`
- **글래스**: `.glass` + `backdrop-filter`, 라이트 보더·inset 하이라이트
- **상단바**: sticky glass blur
- **포커스**: `:focus-visible` accent 링
- **반응형**: 좁은 화면에서 marquee → skill chips, 틸트/스포트라이트 비활성

---

## 접근성

- `prefers-reduced-motion: reduce` → 메시 애니 정지, Canvas/spotlight 끔, reveal 즉시 표시
- Escape로 드롭다운/모달 닫기
- `aria-expanded` / `aria-hidden` 드롭다운 동기화

---

## 로컬 확인

```bash
# 저장소 루트에서
npx --yes serve .
```

브라우저에서 루트를 열면 됩니다.
