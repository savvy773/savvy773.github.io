# savvy773.github.io

Personal portfolio site, served via GitHub Pages at https://savvy773.github.io/

htmx로 프로젝트 카드를 클릭하면 `partials/*.html` 조각을 불러와 상세 내용을 보여주는 1페이지 구조.

## Edit
- 카드 문구·소개글: `index.html`
- 프로젝트 상세 내용: `partials/*.html` (index.html의 `#detail`로 hx-get swap됨)

수정 후 `main`에 push하면 Pages가 자동 재배포됩니다 (`references/`는 개인 참고용 원본 문서라 `.gitignore`로 제외).
