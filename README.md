# savvy773.github.io

Personal portfolio site, served via GitHub Pages at https://savvy773.github.io/

1페이지 구조. Repositories/Journey 항목을 클릭하면 `<dialog>` 기반 모달에 iframe으로 해당 문서를 띄운다 (새 탭 이동 없음, "새 탭에서 열기" 버튼으로 선택 가능).

## 구조
- `index.html` — 메인 페이지 (hero, Repositories, Journey 타임라인, 모달 뷰어)
- `journey/*.html` — 실제 개발 과정에서 작성한 원문 문서 아카이브 (동료 실명 등은 익명화 처리됨)
- `resume/resume.html`, `resume/resume.pdf` — 공개용 이력서. `resume/resume.md`(연락처·신상정보 포함 원본)는 `.gitignore`로 제외되어 git에 올라가지 않음

## Edit
- 소개글·타임라인 항목: `index.html`
- 원문 문서: `journey/*.html` 직접 수정
- 이력서: `resume/resume.md`를 뼈대로 `resume/resume.html` 수정 → PDF는 headless Chrome/puppeteer-core로 재생성 (`resume/resume.pdf`)

수정 후 `main`에 push하면 GitHub Pages가 자동 재배포된다.
