# 포트폴리오 사이트 리디자인 — 설계 문서

- 작성일: 2026-08-01
- 수정일: 2026-08-03 — 프로젝트 구성 전면 개정 (§2, §4). 비주얼 컨셉·모션·접근성(§3, §6, §7)은 유지
- 대상: `jjssspark.github.io`
- 브랜치: `feat/redesign`

## 개정 이력 (2026-08-03)

- 프로젝트를 **10개 전부** 사이트에 노출한다 (기존안: 5개만 전면 배치, 나머지 텍스트 링크). 요청자가 로컬에 있는 모든 프로젝트를 사이트에서 보여주고 싶어함
- 대표작을 2개로 재정의: **WorkFlow_AI(팀 대표)**, **JIVIS(개인 대표)**. 기존안은 WorkFlow_AI만 "IN PLAY" 대표작이었고 JIVIS는 하단 텍스트 링크였음
- 비주얼 방향(계측 장비 컨셉, 네이비+클레이 톤, 커서 스포트라이트·틸트·마그네틱 인터랙션)은 재확인 후 그대로 유지

## 1. 목표와 제약

### 목표

신입 개발자 취업용 포트폴리오. 채용담당자·면접관이 **30초 안에** "이 사람 뽑을 만한데"를 판단할 수 있어야 한다.

### 성공 기준

| 기준 | 검증 방법 |
|---|---|
| 30초 안에 핵심 역량 전달 | 첫 화면에서 스크롤 없이 이름·정체성·지표 노출, 두 번째 스크린에 대표 프로젝트 |
| 기술 깊이가 증빙과 함께 보임 | LoRA·이상치탐지·Redis Queue·CI 게이트가 커밋 해시와 함께 본문에 존재 |
| 60fps 유지 | 애니메이션 속성이 `transform`/`opacity`/`clip-path`로 한정됨 |
| 마이크로사이트 예산 준수 | JS < 80kb gzip, CSS < 15kb gzip |
| 주간 업데이트 비용 최소 | 콘텐츠 수정 시 `content.js` 한 파일만 변경 |
| 접근성 | 키보드 전탐색 가능, 대비비 WCAG AA, `prefers-reduced-motion` 대응 |

### 제약

- **`main` push = 즉시 공개 배포.** 모든 작업은 `feat/redesign`에서 하고 로컬 검증 후 머지한다.
- 빌드 스텝 없음. 순수 정적 HTML/CSS/JS 유지 (GitHub Pages 직접 서빙).
- WorkFlow_AI는 2026년 8월 둘째 주경 완성 예정. **미완성 상태로 공개하며, 완성 후 내용을 추가한다.**
- 색·크기·간격은 `.claude/standards/design-tokens.md`의 2계층 토큰 규약을 따른다.

## 2. 콘텐츠 전략

### 핵심 서사

> 야구라는 한 도메인을 딥러닝으로 끝까지 판 사람이자, 10인 팀에서 340커밋을 넣은 2위 기여자.

신입 지원자 중 (a) 일관된 도메인 전문성과 (b) 실제 팀 협업 증빙을 동시에 가진 경우는 드물다. 이 두 가지를 전면에 세운다.

### 프로젝트 구성 (10개 전부 노출)

두 티어로 나눈다. **대표작 2개**는 큰 카드로 상세 정보(역할·아키텍처·트러블슈팅)까지 보여주고, **나머지 8개**는 컴팩트 카드로 핵심만 보여준다.

| 티어 | 프로젝트 | 저장소 | 상태 | 역할 |
|---|---|---|---|---|
| 대표작 (팀) | **WorkFlow_AI** | `rhantj/work-flow` | 개발 중 (IN PLAY) | 팀 협업 + 아키텍처 역량 증명. 담당 영역 중심 서술 |
| 대표작 (개인) | **JIVIS** | `jjssspark/JIVIS` | 완성 | Claude API 기반 개인 AI 비서. 혼자 기획~구현 완결한 역량 증명 |
| Shipped | **PitchIQ** (`DL_Pitcher`) | `jjssspark/DL_Pitcher` | 완성 | YOLOv8 + 딥러닝, 투구 예측. 시각적 임팩트 최대 |
| Shipped | **StoveLens AI** (`SalaryCast_AI`) | `jjssspark/SalaryCast_AI` | 완성 | XGBoost 기반 KBO FA 연봉 예측. 데이터 파이프라인 + CI |
| Shipped | **TruthLens** | `jjssspark/TruthLens` | 완성 | Flask/Redis/Celery 비동기 백엔드, AI 생성 콘텐츠 판별 |
| Shipped | **TripMate AI** | `jjssspark/TripMate` | 완성 | React/TS/Supabase 프론트, AI 여행 일정 생성 |
| Shipped | **DiamondScout AI** | 로컬 전용 (git 미연동) | 완성 | Gradio 기반 야구 선수 스카우팅 분석 도구 |
| Shipped | **위증 (PERJURY)** | `rhantj/perjury` | 완성 | NHN 해커톤 — LLM 에이전트 5명과 밀담·교섭하는 추리게임 |
| Coming Soon | **OnQue** | 로컬 전용 (git 미연동) | 미완성 | FastAPI + Gemini 연동 서비스. 카드만 배치, 상세 설명 보류 |
| Coming Soon | **Zoner** | 로컬 전용 (git 미연동) | 미완성 | React 기반 서비스. 카드만 배치, 상세 설명 보류 |

**야구 도메인 프로젝트 3개(PitchIQ·StoveLens·DiamondScout)가 Shipped 그리드 안에 자연스럽게 섞여 있는 것 자체가 "야구를 딥러닝으로 끝까지 판 사람" 서사를 뒷받침한다.** 별도로 묶어서 강조하지 않는다 — 계측 장비 컨셉상 야구 카드만 시각적으로 튀면 "야구 팬 사이트"로 읽히는 배제 원칙(§3)과 충돌한다.

git 미연동 프로젝트(DiamondScout AI·OnQue·Zoner)는 카드에 저장소 링크 대신 상태 텍스트만 표시한다.

### 미완성 프로젝트 처리 원칙

WorkFlow_AI는 완성도를 위장하지 않는다. `IN PLAY` 상태 배지를 달고, **결과물 대신 과정**을 본문으로 삼는다:

- 3-tier 아키텍처 다이어그램 (React / Spring Boot / FastAPI)
- 담당 영역 명시 — AI 어시스턴트, 심사자 기여도, 마이페이지, CI/CD, 회의록 Redis Queue
- 트러블슈팅 로그 (커밋 해시 증빙)

신입 평가에서 문제해결 과정이 완성품보다 가점이 크다는 판단에 근거한다.

### 개인정보

**휴대폰 번호는 사이트에서 제외한다.** GitHub Pages는 크롤링 대상이므로 스팸·피싱 수집 위험이 있다. 연락 수단은 이메일·GitHub·블로그만 노출한다. 전화번호는 이력서 문서에만 기재한다.

## 3. 비주얼 디렉션

### 컨셉: 계측 장비 (Instrumentation)

야구를 **구조와 데이터 표현의 뼈대**로 쓰되, 표면 장식은 절제한다. 기준선은 "Statcast 분석 콘솔이 멋있는 이유는 야구라서가 아니라 정밀해서다".

**채택**

- 스트라이크존 9분할을 레이아웃 그리드의 기준으로 사용 — 일반 사용자에게는 정밀한 그리드로 읽히고, 아는 사람만 은유를 알아본다
- 지표를 박스스코어 조판으로 — 모노스페이스 정렬, `.941` 형태의 3자리 소수 표기
- 궤적·히트맵 시각화는 **PitchIQ / StoveLens 카드 내부에서만** 사용 (해당 카드는 콘텐츠 자체가 야구라 정당함)
- 스크롤 진행 인디케이터에 실밥(seam) 곡선을 은은하게 적용

**배제** — 아래는 "야구 팬 사이트"로 읽히게 만들므로 쓰지 않는다

- 개발 스킬을 구종 아스널로 은유하는 것 (억지스러움)
- 섹션을 1회~9회로 명명하는 것
- 야구공·배트·글러브 아이콘
- 공이 날아다니는 스크롤 모션
- 특정 구단 컬러·응원 요소

### 디자인 토큰

야간 경기 조명 아래의 구장을 기준으로 한 다크 단일 테마. 컨셉상 라이트 모드는 두지 않는다 (`design-tokens.md`가 금지하는 것은 *무의식적* 다크모드 기본 채택이며, 여기서는 컨셉에 근거해 선택한다).

원시 → 의미 2계층을 지킨다. 컴포넌트는 의미 토큰만 참조한다.

```css
:root {
  /* 원시 — 중립 (야간 구장 네이비 계열) */
  --navy-950: oklch(16% 0.020 250);
  --navy-900: oklch(21% 0.020 250);
  --navy-800: oklch(26% 0.018 250);
  --navy-700: oklch(30% 0.016 250);
  --navy-400: oklch(65% 0.010 250);
  --navy-100: oklch(94% 0.008 250);

  /* 원시 — 강조 (클레이 오렌지) */
  --clay-400: oklch(78% 0.14 55);
  --clay-600: oklch(72% 0.17 55);

  /* 원시 — 데이터 시각화 전용 (시안) */
  --cyan-400: oklch(78% 0.15 195);
  --cyan-600: oklch(68% 0.16 195);

  /* 의미 토큰 — 컴포넌트는 이것만 쓴다 */
  --color-bg:          var(--navy-950);
  --color-surface:     var(--navy-900);
  --color-surface-alt: var(--navy-800);
  --color-border:      var(--navy-700);
  --color-text:        var(--navy-100);
  --color-text-muted:  var(--navy-400);
  --color-accent:      var(--clay-600);
  --color-accent-hover:var(--clay-400);
  --color-data:        var(--cyan-400);
  --color-grid:        var(--navy-700);
}
```

정확한 L 값은 구현 시 대비비 검증(§7) 결과에 따라 조정될 수 있다. 조정하더라도 2계층 구조와 색상 계열은 유지한다.

타이포그래피는 2종으로 제한한다.

- 제목·본문: Space Grotesk (기존 사이트에서 이미 사용 중, 기하학적이면서 중성적)
- 계측 라벨·지표: JetBrains Mono (숫자 정렬 필수)

`font-display: swap`, 필요한 웨이트만 preload 한다.

## 4. 페이지 구조

```
① 히어로       이름 · 한 줄 정체성 · 스탯 라인(PROJECTS 10 등 카운트업) · CTA
② FEATURED     WorkFlow_AI(팀 대표, IN PLAY) · JIVIS(개인 대표) — 큰 카드 2개, 아키텍처·담당 영역 서술
③ SHIPPED      PitchIQ · StoveLens AI · TruthLens · TripMate · DiamondScout AI · 위증(PERJURY) — 컴팩트 카드 6개
④ COMING SOON  OnQue · Zoner — 저채도 카드 2개, 상태 배지만
⑤ 기술 근거    LoRA · MAD/Isolation Forest · Redis Queue · CI 게이트
⑥ Contact      이메일 · GitHub · 블로그
```

순서 근거: 채용담당자 동선상 정체성 → 대표작 2개(팀·개인 역량 각각 증명) → 완성 실적 6개(도메인 폭 증명) → 진행중 프로젝트 → 기술 깊이 → 연락 순이 이탈률이 가장 낮다. Coming Soon은 완성작 뒤에 둬 "미완성이 먼저 보이는" 인상을 피한다.

## 5. 파일 구조

```
jjssspark.github.io/
├── index.html
├── assets/
│   ├── css/
│   │   ├── tokens.css      # 원시·의미 토큰
│   │   ├── base.css        # 리셋, 타이포, 레이아웃 그리드
│   │   └── components.css  # 히어로/카드/스탯/섹션
│   ├── js/
│   │   ├── content.js      # ★ 모든 콘텐츠 데이터 (주간 업데이트 지점)
│   │   ├── render.js       # content.js → DOM
│   │   ├── motion.js       # 리빌·카운트업·패럴랙스
│   │   ├── interactions.js # 스포트라이트·틸트·크로스필터·마그네틱
│   │   └── viz/
│   │       ├── trajectory.js  # 투구 궤적 캔버스
│   │       └── heatmap.js     # 스트라이크존 히트맵 캔버스
│   └── img/
└── docs/superpowers/specs/
```

기존 `css/`, `js/`는 `assets/` 하위로 옮기고 `index.html`의 경로를 함께 수정한다 (프로젝트 `CLAUDE.md`의 목표 구조와 일치).

### 모듈 경계

| 모듈 | 책임 | 의존 |
|---|---|---|
| `content.js` | 콘텐츠 데이터만. 로직 없음 | 없음 |
| `render.js` | 데이터를 DOM으로. 애니메이션 관여 안 함 | `content.js` |
| `motion.js` | 스크롤 연동 등장 효과 | DOM (렌더 완료 후) |
| `interactions.js` | 포인터 기반 상호작용 | DOM |
| `viz/*.js` | 캔버스 드로잉. 각자 독립 실행 가능 | 없음 |

`content.js`를 순수 데이터로 격리하는 것이 이 설계의 핵심이다. WorkFlow_AI 완성 후 업데이트가 이 파일 수정만으로 끝나야 한다.

### content.js 데이터 형태

```js
export const profile = {
  name: '박지수',
  role: 'ML Engineer / Full-stack',
  tagline: '…',
  stats: [ { label: 'COMMITS', value: 340 }, … ],   // value는 숫자 (카운트업 대상)
  links: { email: '…', github: '…', blog: '…' },    // 전화번호 필드 없음
};

export const projects = [
  {
    id: 'workflow-ai',
    name: 'WorkFlow AI',
    tier: 'featured',            // 'featured' | 'shipped' | 'coming-soon'
    status: 'in-play',           // 'in-play' | 'shipped' | 'coming-soon'
    summary: '…',
    role: '…',                   // 팀 프로젝트일 때 내 담당
    stack: ['React', 'Spring Boot', 'FastAPI'],  // 크로스필터 키
    viz: null,                   // 'trajectory' | 'heatmap' | null
    links: { repo: '…', demo: null },  // repo가 없으면(git 미연동) null
  },
  // tier: 'featured' — workflow-ai, jivis (2개)
  // tier: 'shipped'  — pitchiq, stovelens-ai, truthlens, tripmate, diamondscout-ai, perjury (6개)
  // tier: 'coming-soon' — onque, zoner (2개, links.repo: null)
];

export const engineering = [
  { title: 'LoRA 파인튜닝', problem: '…', solution: '…', commits: ['d12dd8f0'] },
  …
];
```

날짜는 문서·데이터 모두 `YYYY-MM-DD` (ISO 8601)로 표기한다.

**지표는 실측값만 쓴다.** 현재 검증된 값은 WorkFlow_AI 커밋 340건(`git log` 집계, 전체 2위)뿐이다. PR·이슈 수 등 추가 지표를 넣으려면 `gh` API로 실제 수치를 뽑아 채운다. 채용 목적 문서이므로 추정치·연출용 숫자는 넣지 않는다.

## 6. 모션 설계

### 원칙

- 애니메이션 속성은 `transform`, `opacity`, `clip-path`로 한정한다. 레이아웃 유발 속성(`width`, `height`, `top`, `margin`, `font-size`)은 애니메이션하지 않는다.
- 스크롤 이벤트 핸들러를 쓰지 않는다. `IntersectionObserver`와 `requestAnimationFrame`을 사용한다.
- `will-change`는 애니메이션 시작 시 부여하고 종료 시 제거한다.
- 등장 애니메이션은 요소당 1회만 실행한다 (재진입 시 재생하지 않음).

### 스크롤 인터랙션

| 대상 | 동작 | 구현 |
|---|---|---|
| 섹션 자식 요소 | 40~60ms 간격 스태거 리빌 | IntersectionObserver + `--delay` 변수 |
| 히어로 스탯 | 0 → 목표값 카운트업 (ease-out) | `requestAnimationFrame` |
| 스트라이크존 그리드 | 좌상단부터 대각선 순차 점등 | CSS `--delay` + 인덱스 |
| 궤적 캔버스 | 스크롤 진행률에 궤적 길이 연동 | IntersectionObserver + rAF |
| 진행 인디케이터 | 실밥 곡선이 위에서부터 그려짐 | SVG `stroke-dashoffset` |
| 배경 그리드 | 0.15배 미세 패럴랙스 | `transform: translate3d` |

### 호버 인터랙션

| 대상 | 동작 | 구현 |
|---|---|---|
| 프로젝트 카드 | 커서 추적 스포트라이트 | `--mx`/`--my` CSS 변수 + `radial-gradient` |
| 프로젝트 카드 | 3D 틸트 (최대 4도) | `perspective` + `rotateX/Y` |
| 기술 태그 | **크로스 필터** — 해당 기술 쓴 카드가 함께 강조 | `data-stack` 매칭 + 클래스 토글 |
| 링크 | 밑줄이 좌→우로 그려짐 | `scaleX` + `transform-origin: left` |
| 버튼 | 마그네틱 (6px 이내 끌림) | 포인터 좌표 → `translate` |

기술 태그 크로스 필터는 장식이 아니라 실제 정보를 전달하는 상호작용이므로 우선순위를 높게 둔다.

### 배제

- 커스텀 커서 — 접근성에 불리하고 유행이 지났다.
- 스크롤 재킹 — 사용자 스크롤 제어권을 뺏지 않는다.

### reduced-motion

`prefers-reduced-motion: reduce`일 때:

- 모든 등장 애니메이션은 최종 상태로 즉시 렌더한다 (요소가 사라진 채 남으면 안 된다).
- 카운트업은 최종 숫자를 바로 표시한다.
- 캔버스 시각화는 완성된 정적 프레임을 그린다.
- 패럴랙스·틸트·마그네틱은 비활성화한다.

### 터치 환경

호버 기반 효과(스포트라이트·틸트·마그네틱)는 `@media (hover: hover)`로 제한한다. 터치 기기에서 크로스 필터는 태그 탭으로 토글되며, 다시 탭하면 해제된다.

## 7. 접근성

`.claude/standards/accessibility.md`를 따르며, 이 프로젝트에서 특히 확인할 항목:

- 시맨틱 요소 사용 (`header`/`nav`/`main`/`section`/`article`/`footer`), 섹션마다 `aria-labelledby`
- 키보드 전탐색 가능, 포커스 링을 명시적으로 디자인 (기본 outline 제거만 하고 대체 없는 상태 금지)
- 본문 텍스트 대비비 WCAG AA (4.5:1) 이상. 액센트·뮤트 컬러는 대비 검증 후 L 값 확정
- 캔버스 시각화에는 대체 텍스트 설명 제공 (`aria-label` 또는 인접 텍스트)
- 스킵 링크 유지
- 호버로만 접근 가능한 정보를 만들지 않는다 — 크로스 필터는 부가 정보이며, 태그 자체가 이미 텍스트로 읽힌다

## 8. 성능

| 항목 | 목표 |
|---|---|
| LCP | < 2.5s |
| CLS | < 0.1 |
| JS (gzip) | < 80kb |
| CSS (gzip) | < 15kb |

- 이미지는 `width`/`height` 명시, AVIF/WebP 우선, 히어로 외 `loading="lazy"`
- 폰트는 2종·필요 웨이트만, `font-display: swap`
- 캔버스는 뷰포트 진입 전까지 그리지 않는다
- 외부 라이브러리 없음 (모션 전량 자체 구현)

## 9. 검증 계획

1. **로컬 렌더** — `python3 -m http.server 8000`, 콘솔 404·에러 없음
2. **반응형** — 320 / 375 / 768 / 1024 / 1440 / 1920 에서 가로 오버플로 없음
3. **모션 성능** — DevTools Performance로 스크롤 중 프레임 드랍 확인
4. **reduced-motion** — OS 설정 켠 상태에서 콘텐츠가 전부 보이는지 확인
5. **키보드** — Tab만으로 전 영역 도달, 포커스 가시성 확인
6. **대비비** — 본문·라벨 대비 4.5:1 이상 확인
7. **개인정보** — 최종 산출물에 전화번호가 없는지 grep 확인

전 항목 통과 후에만 `main`에 머지한다.

## 10. 향후 업데이트 (2026-08-10 주 예정)

WorkFlow_AI 완성 시 `assets/js/content.js`에서 다음만 수정한다:

- 상태 `in-play` → `shipped`
- 완성 기능 목록·성과 지표 추가
- 스크린샷·데모 링크 추가

레이아웃·모션 코드는 수정하지 않는다. 수정이 필요하다면 데이터 분리 설계가 실패한 것이다.
