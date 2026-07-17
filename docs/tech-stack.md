# 기술 스택

`index.html` 단일 파일로 구성된 빌드리스(no build step) 정적 포트폴리오. 프레임워크·번들러 없이 순수 HTML/CSS/JS만 사용.

## 배포
- **GitHub Pages** (정적 호스팅, 빌드 파이프라인 없음)
- 저장소 루트의 `index.html`을 그대로 서빙

## 폰트
- Google Fonts: `Inter`(본문), `IBM Plex Mono`(코드/라벨용 모노스페이스)
- `rel="preconnect"`로 폰트 도메인 사전 연결

## UI 컴포넌트
- **네이티브 `<dialog>`** — 리포지토리/Journey 문서를 새 탭 이동 없이 그 자리에서 미리보기하는 모달. `showModal()`/`close()`, `::backdrop` 스타일링, 라이트 디스미스(배경 클릭 시 닫힘) 사용
- **iframe 미리보기** — 모달 내부에서 대상 페이지를 그대로 로드. 캐시 무효화를 위해 매번 `?_={timestamp}` 쿼리스트링 부여
- **스크롤 진행 표시줄** — Journey 타임라인 옆에 스크롤 진행률을 실시간으로 채워주는 바. `IntersectionObserver` 대신 `getBoundingClientRect()` + `requestAnimationFrame` 스로틀링으로 구현

## 배경 렌더링 — Canvas 2D
웨이브 선(흐르는 장식 라인)과 반짝이는 파티클을 **캔버스 1개**에서 함께 그림. 처음엔 각각 SVG(웨이브)와 CSS 애니메이션 레이어 42개(파티클)로 분리 구현했으나, 레이어 개수 자체가 GPU 부담의 큰 축이라는 게 실측으로 확인되어 캔버스로 통합.

- **레이어 1개**: 웨이브 + 파티클을 하나의 `<canvas>`에서 처리 → 브라우저가 관리해야 할 컴포지팅 레이어 수를 최소화
- **프레임 캡**: `requestAnimationFrame`은 디스플레이 주사율대로 계속 호출되지만, 실제 `clearRect`+그리기는 타임스탬프 체크로 **15fps**로 제한 (CSS 애니메이션엔 이런 명시적 fps 제어가 없어서 캔버스로 전환한 이유이기도 함)
- **GC 회피**: 매 프레임 `` `rgba(...)` `` 같은 문자열을 새로 만들지 않고, 색상은 상수로 캐싱 + 투명도만 `ctx.globalAlpha`(숫자 대입)로 갱신. (예전엔 문자열 churn이 몇 초 간격으로 GC를 유발해 애니메이션이 끊기는 원인이었음)
- **draw call 최소화**: 파티클처럼 동일 스타일을 공유하는 도형은 path 하나로 묶어 `fill()` 호출 1회로 처리
- **자동 정지**: 탭이 백그라운드로 가면(`visibilitychange`) 정지, 모달이 열려 배경이 가려지면(`bg:pause`/`bg:resume` 커스텀 이벤트) 정지, `prefers-reduced-motion`이면 애니메이션 루프 없이 정적 프레임 1장만 렌더링

> 이전엔 `navigator.hardwareConcurrency`/`deviceMemory`/`connection.saveData`로 저사양 기기를 감지해 배경 캔버스를 아예 껐었는데, 위 최적화(레이어 통합 + 15fps 캡 + GC 회피)만으로 실측 GPU 사용률이 ~2%대까지 떨어져서 저사양 분기 자체를 제거함 — 조건부 코드 경로를 하나 줄이는 게 더 단순함

## SVG 사용 범위
초기엔 히어로 영역의 "흐르는 웨이브" 장식도 인라인 SVG(`stroke-dasharray`/`stroke-dashoffset` 애니메이션)로 구현했으나, **애니메이션이 들어가는 요소는 전부 Canvas 쪽으로 이전**하고 SVG는 아래처럼 **정적 아이콘 용도로만** 남겨뒀다.

| 위치 | 내용 | 형태 |
|---|---|---|
| `<link rel="icon">` | 파비콘 | 인라인 `data:image/svg+xml` — 그라디언트 배경 + "J" 텍스트, 별도 이미지 파일 없이 마크업에 직접 임베드 |
| Learning note 아이콘 | 졸업모자 아이콘 | `viewBox 24x24`, `stroke` 기반 path 4개 + rect 1개, `currentColor`로 텍스트 색 상속 |
| Repository 카드 헤더 | GitHub 아이콘 | `viewBox 16x16`, `fill` 기반 단일 path (두 카드에서 동일 마크업 재사용) |
| 모달 닫기 버튼 | X 아이콘 | `viewBox 16x16`, `stroke` 기반 path 1개 |

**SVG를 계속 쓰는 이유**: 위 4곳 전부 정적이라(호버 시 색만 CSS로 바뀔 뿐 자체 애니메이션 없음) 브라우저가 한 번만 래스터라이즈하면 되고, 벡터라서 화면 배율(dpr)에 관계없이 선명함. 이런 "가만히 있는 아이콘"엔 SVG가 가장 저렴한 선택.

**웨이브를 SVG에서 뺀 이유**: `stroke-dashoffset`을 무한 반복 애니메이션시키면 매 프레임 실제로 다시 그려야 해서(리페인트), CSS `transform`/`opacity` 애니메이션과 달리 컴포지터만으로 처리되지 않음. 게다가 `<svg>` 한 개가 브라우저 레이어 하나를 차지해서, 파티클(별) 42개를 각각 CSS 레이어로 만든 것과 합쳐지면 레이어 수 자체가 GPU 부담이 되는 게 실측으로 확인됨. 결국 웨이브+파티클을 캔버스 1개로 합치고 프레임을 15fps로 캡하는 쪽으로 정리 (자세한 경위는 위 "배경 렌더링" 항목 참고).

## CSS
- **디자인 토큰**: `:root`에 색상/여백/그림자 등을 CSS 커스텀 프로퍼티로 정의
- **`color-mix()`**: 다크 테마 배경색 위에 투명도를 섞는 용도로 다수 사용 (예: sticky 헤더 배경)
- **`mask-image`**: 그리드 오버레이 배경을 방사형으로 페이드아웃
- **`:focus-visible`**: 키보드 포커스 시에만 accent 컬러 링 표시 (마우스 클릭 시엔 미표시)
- **정적 블러 블롭**(`.mesh`): 화면 모서리의 은은한 그라디언트 블러. 초기엔 `transform` 애니메이션으로 천천히 움직였으나, 화면의 절반 크기(50vw)짜리 블러 레이어를 매 프레임 블렌딩하는 비용이 커서(면적이 클수록 fill-rate 비용이 큼) **정적으로 고정**
- **`backdrop-filter`는 상단바에서 제거**: 뒤에서 계속 움직이는 배경(웨이브/파티클)을 실시간으로 재블러링해야 해서, 배경 애니메이션 주기에 맞춰 GPU 사용량이 함께 출렁이는 원인이었음. 불투명도 높은 단색 배경으로 대체

## 접근성 · 성능 관련 결정
- `prefers-reduced-motion` 대응: 배경 캔버스 애니메이션 정지, 정적 프레임만 표시
- `::selection` 커스텀 컬러, 클릭 시 눌림 효과(`:active`) 등 저비용 마이크로 인터랙션
- 반응형: `max-width: 640px`에서 장식용 웨이브 렌더링 생략

## 브라우저 API
- `Canvas 2D Context`
- `<dialog>` / `showModal()` / `::backdrop`
- `IntersectionObserver`는 미사용 — 스크롤 진행률은 `getBoundingClientRect()` 기반으로 직접 계산
- `matchMedia('(prefers-reduced-motion: reduce)')`
