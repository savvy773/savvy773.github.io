# 기술 스택

`index.html` 단일 파일로 구성된 빌드리스(no build step) 정적 포트폴리오. 프레임워크·번들러 없이 순수 HTML/CSS/JS만 사용.

## 배포
- **GitHub Pages** (정적 호스팅, 빌드 파이프라인 없음)
- 저장소 루트의 `index.html`을 그대로 서빙

## 폰트
- Google Fonts: `Inter`(본문), `IBM Plex Mono`(코드/라벨용 모노스페이스)

## 배경 렌더링 — WebGL 셰이더 (외부 라이브러리 없음)
`<canvas id="shaderBg">` + 직접 짠 미니 fragment shader 1장. moonshot.ai(Unicorn Studio) 같은 셰이더 배경에서 착안했지만, 별도 라이브러리 없이 GLSL을 손으로 작성.

- **효과**: sin 파형 기반 흐르는 2D 성운 색감(풀스크린 삼각형 1장) + 진짜 3D 공간의 별 점 구름(`gl.POINTS`, 240개)
- **3D 직접 구현**: Three.js 등 라이브러리 없이 투영/모델/뷰 4x4 행렬을 직접 계산(`m4Perspective`/`m4RotateY`/`m4Translate`/`m4Multiply`). 정점 셰이더에서 `gl_PointSize = pointBase / clip.w`로 카메라 거리에 따라 별 크기가 달라져 원근감이 생김
- **성능**: `SHADER_CONFIG.renderScale`(기본 0.55)로 실제 렌더 해상도를 낮추고 CSS로 확대 — 프레임 속도는 그대로 두고 픽셀당 계산량만 줄임
- **알파 블렌딩**: `premultipliedAlpha: false`로 컨텍스트 생성 (기본값 그대로 두면 셰이더 알파가 실제보다 훨씬 밝게 합성됨)
- **일시정지**: 탭 백그라운드(`visibilitychange`), 모달 오픈(`bg:pause`/`bg:resume`), `prefers-reduced-motion`일 때 렌더 루프 정지
- 튜닝값은 스크립트 내 `SHADER_CONFIG` 객체에 모아둠

## 그 외 배경 레이어
- **`.grain`**: SVG `feTurbulence`로 생성한 정적 노이즈 텍스처, `mix-blend-mode: overlay`. 애니메이션 없음(정적 이미지라 비용 없음)
- **`.grid-overlay`**: CSS `linear-gradient` 격자 + `mask-image` radial-gradient로 로고 쪽만 도드라지게 페이드

## UI 컴포넌트
- **네이티브 `<dialog>`** — 리포지토리/Journey 문서를 새 탭 이동 없이 그 자리에서 미리보기하는 모달. `showModal()`/`close()`, `::backdrop`, 라이트 디스미스
- **iframe 미리보기** — 모달 내부에서 대상 페이지 로드, 캐시 무효화용 `?_={timestamp}` 부여
- **호버 드롭다운(Pages 메뉴)** — `:hover`만으로 열리되, 버튼-패널 사이 `padding-top`을 히트박스로 써서 마우스 이동 중 hover 끊김 방지
- **스크롤 진행 표시줄** — Journey 타임라인 옆 진행률 바. `getBoundingClientRect()` + `requestAnimationFrame` 스로틀링

## CSS
- **디자인 토큰**: `:root`에 색상/여백/그림자 CSS 커스텀 프로퍼티
- **파스텔 톤**: `color-mix(in srgb, var(--accent) 55%, white 25%)` 형태로 상단 메뉴 링크 색 구분
- **상단바는 `backdrop-filter` 미사용**: 배경이 계속 애니메이션되는 셰이더 캔버스라 매 프레임 재블러링 비용이 커서, 높은 불투명도의 단색 배경으로 대체
- **`:focus-visible`**: 키보드 포커스 시에만 accent 컬러 링

## 접근성
- `prefers-reduced-motion` 대응: 셰이더 렌더 루프 미실행(정적 프레임 1장만)
- 반응형: `max-width: 640px`에서 리포지토리 썸네일 등 장식 요소 생략

## 브라우저 API
- `WebGL` (`getContext('webgl')`)
- `<dialog>` / `showModal()` / `::backdrop`
- `matchMedia('(prefers-reduced-motion: reduce)')`
