<div align="center">

# Juns — Portfolio

**AI 풀스택 엔지니어 Juns의 개인 포트폴리오**

[![Live](https://img.shields.io/badge/Live-juns.win-059669?style=flat-square)](https://juns.win/)
[![Stack](https://img.shields.io/badge/Stack-HTML·CSS·JS-3f4441?style=flat-square)](#)
[![Hosting](https://img.shields.io/badge/Hosting-Cloudflare-3f4441?style=flat-square)](#)

<img src=".github/preview.jpg" alt="juns.win 홈 화면" width="100%">

</div>

<br>

1인으로 만든 사내 ERP, 직접 쓰려고 만든 오픈소스 도구, 코드로 만든 영상을 한곳에 모은 채용용 포트폴리오입니다. 홈에서 요약을 보고, 상단 메뉴의 PRISM ERP · 개인 프로젝트 · 영상 페이지에서 자세히 봅니다.

## Live

| | |
|---|---|
| **Site** | https://juns.win/ |
| **GitHub Pages** | https://savvy773.github.io/ (juns.win으로 이동) |
| **Repo** | https://github.com/savvy773/savvy773.github.io |

## Highlights

- 빌드 도구 없는 **HTML / CSS / JS** 4페이지, 공통 머리말·메뉴는 `version-assets.mjs`가 홈에서 복사
- **PRISM ERP 쇼케이스**: 실제 ERP 화면 7개(수치·거래처 가림, 라이트/다크 각각), 수집 데이터가 한 줄씩 쌓이는 목록
- **영상**: Remotion으로 코드로 만든 3분 33초 소개 영상(챕터 이동), 픽셀·소리까지 코드로 만든 도트 애니메이션, AI 영상 생성 예시
- 뉴트럴 + 에메랄드 테마, 폰·PC 설정을 따르는 라이트/다크와 직접 고르는 토글, 브라우저 강제 다크 차단
- 페이지 이동은 미리 받아 두기(prefetch·prerender)와 짧은 화면 전환, 같은 페이지 안에서는 스크롤 없이 바로 이동
- 레이아웃 흔들림(CLS) 0: 새로고침·메뉴 이동·느린 이미지·모바일까지 헤드리스로 점검
- 정적 파일은 Cloudflare, 영상은 R2(media.juns.win), CSS·JS 1년·이미지 7일 캐시

## Featured Work

PRISM Workspace + ERP를 1인 개발로 처음부터 설계·React/TypeScript 프론트엔드·FastAPI 백엔드·PostgreSQL 데이터베이스·Docker/Caddy 배포까지 개발해 웹 버전을 완성했습니다. 쇼핑몰·결제·이카운트 자동 수집, 엑셀 Import·Staging 승인, 정산·대사·경영 보고가 운영 중이고 구매·재고·생산·HR은 다음 단계입니다. 원본 소스는 비공개이고, 사례는 [juns.win/projects/prism](https://juns.win/projects/prism/)에서 볼 수 있습니다.

## Sections

| | |
|---|---|
| **홈 `/`** | 소개·경력 요약(기술 칩), PRISM ERP 카드, 개인 프로젝트 3개, 영상 카드 |
| **개인 프로젝트 `/projects/`** | 공개 프로젝트 6개(ai-analysis, ubuntu-scr-saver, web-ai-usage, app-yt-subs, dpi-bye, stt-whisper), 분야별 필터, 업무 도구와 기록 5개 |
| **PRISM ERP `/projects/prism/`** | 1인 구축 사례: 데이터 흐름, 실제 화면 쇼케이스(수치 가림), 완성 기능·설계 포인트·기술 스택 |
| **영상 `/video/`** | 코드로 만든 PRISM 소개 영상(3:33, 챕터), 도트 애니메이션 단편(9:16), AI 영상 생성 예시. 영상 파일은 R2 `juns-media`(media.juns.win)에서 제공 |
| **이력서** | 모달로 바로 보는 이력서 (`resume/resume.html`), 사이트 테마를 따라감 |

## Structure

```text
├── index.html                 # 홈 (공통 머리말·메뉴·푸터의 원본)
├── projects/index.html        # 개인 프로젝트 + 업무 도구와 기록
├── projects/prism/index.html  # PRISM ERP 사례
├── video/index.html           # 영상 제작
├── css/site.css               # 토큰·라이트/다크·카드·반응형
├── js/app.js                  # 모달·테마·페이지 이동·쇼케이스·필터·챕터
├── assets/thumbs/             # 프로젝트·기록 썸네일 (webp)
├── assets/shots/              # ERP 화면 (수치 가림, 라이트/다크)
├── assets/video/              # 영상 포스터·자막 (영상 파일은 R2)
├── journey/                   # 업무 기록 HTML 문서
├── resume/resume.html         # 이력서
├── _headers                   # Cloudflare 캐시 규칙
├── wrangler.jsonc             # Cloudflare Worker 설정 (juns)
├── scripts/version-assets.mjs # 공통 블록 복사 + CSS/JS 버전
├── scripts/deploy-cf.sh       # 커밋된 HEAD를 Cloudflare에 배포
├── content.md                 # 콘텐츠 수정 안내
└── docs/tech-stack.md         # 기술 상세
```

## Local

```bash
python3 -m http.server 4173
```

브라우저에서 루트를 열면 됩니다.

CSS·JS나 공통 블록을 고친 뒤 게시 전에 `node scripts/version-assets.mjs`를 실행하세요. 홈의 공통 블록을 다른 페이지에 복사하고, 파일 내용에 따른 버전을 URL에 붙여 이전 캐시와 섞이지 않게 합니다.

## Deploy

juns.win은 Cloudflare에 직접 업로드합니다. 커밋한 뒤 `scripts/deploy-cf.sh`를 실행하면 커밋된 HEAD만 올라갑니다(작업 중 파일은 제외). 백업은 `~/code` 전체 백업(R2 `code-backup`)에 포함됩니다. GitHub는 링크용이고, savvy773.github.io는 juns.win으로 이동만 시킵니다.

## Docs

- [기술 스택 상세](docs/tech-stack.md)

## License

Personal portfolio. Sample / anonymized work docs. © Juns
