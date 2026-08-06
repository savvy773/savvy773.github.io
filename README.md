<div align="center">

# Juns — Portfolio

**AI 풀스택 엔지니어 Juns의 개인 포트폴리오**

[![Live](https://img.shields.io/badge/Live-savvy773.github.io-8b6cf7?style=flat-square)](https://savvy773.github.io/)
[![Stack](https://img.shields.io/badge/Stack-Vanilla%20HTML·CSS·JS-29d6d6?style=flat-square)](#)
[![No Build Step](https://img.shields.io/badge/Build-None-4c4a58?style=flat-square)](#)

<img src=".github/preview.jpg" alt="포트폴리오 미리보기" width="100%">

</div>

<br>

실제 사내 개발 문서(가이드, 인수인계 보고서 등)를 익명화해 개발 과정의 발자취로 기록하고, 진행 중인 오픈소스 프로젝트를 함께 소개하는 **1페이지 포트폴리오**입니다.

## Live

| | |
|---|---|
| **Site** | https://savvy773.github.io/ |
| **Repo** | https://github.com/savvy773/savvy773.github.io |

## Highlights

- 프레임워크·빌드 도구 없이 **순수 HTML / CSS / JS** (빌드리스)
- 네이티브 **`<dialog>` + iframe** 모달 — 문서·데모를 페이지 이탈 없이 미리보기
- **페이퍼 그레인** 라이트 테마 — 배경 비디오/Canvas FX 없이 SVG 노이즈 텍스처만 사용
- 불투명 **글래스 카드**(`backdrop-filter` 미사용) + 호버 시 포인터 기반 카드 틸트
- 경력 요약(exp-note)·현재 학습 중(learning-note) 카드, 스킬 스트립, Repositories/Journey 리빌 애니메이션
- GPU 절약: idle 시 JS 루프·무한 애니메이션 없음, `prefers-reduced-motion` 전면 대응
- 모바일: safe-area, 터치 hover 완화, 모달 풀스크린

## Currently Learning

- **Godot / Unity** — 게임 엔진 기초 및 인터랙티브 콘텐츠
- **DaVinci Resolve** — 영상 편집·컬러 그레이딩

## Sections

| | |
|---|---|
| **Hero** | 소개·경력 요약·현재 학습 중, 스킬 스트립 |
| **Repositories** | 오픈소스·데모 (web-ai-usage, app-yt-subs, dpi-bye, stt-whisper) |
| **Journey** | HEIS Tool, OPC-ISL, 인수인계, SSH 보안 등 개발 여정 문서 |
| **Resume** | 모달로 바로 보는 이력서 (`resume/resume.html`) |

## Structure

```text
├── index.html          # 마크업·메타
├── css/site.css        # 토큰·페이퍼 그레인·글래스 카드·반응형
├── js/
│   ├── app.js          # 모달·스크롤·reveal·카드 틸트·타임라인
│   └── effects.js      # 비활성 stub (구 Canvas FX 자리, 미로드)
├── assets/thumbs/      # 리포·저니 카드 썸네일 (webp)
├── journey/            # Journey HTML 문서
├── resume/             # 이력서
├── scripts/screenshot.mjs  # README 프리뷰 스샷 캡처
└── docs/tech-stack.md  # 기술 상세
```

## Local

```bash
npx --yes serve .
```

브라우저에서 루트를 열면 됩니다.

## Docs

- [기술 스택 상세](docs/tech-stack.md)

## License

Personal portfolio. Sample / anonymized work docs. © Juns
