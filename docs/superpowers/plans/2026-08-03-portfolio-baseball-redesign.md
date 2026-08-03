# 포트폴리오 사이트 리디자인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `jjssspark.github.io`를 "계측 장비(Instrumentation)" 컨셉의 다크 네이비+클레이 테마로 리디자인하고, 로컬에 있는 프로젝트 10개(대표작 2개 + Shipped 6개 + Coming Soon 2개)를 전부 노출하며, 커서 스포트라이트·틸트·마그네틱·크로스필터 인터랙션을 추가한다.

**Architecture:** 빌드 없는 정적 HTML/CSS/JS. 콘텐츠는 `assets/js/content.js` 한 파일에 데이터로 분리하고, `render.js`가 이를 읽어 DOM을 생성한다. `motion.js`(스크롤 리빌·카운트업)와 `interactions.js`(포인터 인터랙션)는 렌더 완료 후 동작하는 독립 모듈이다.

**Tech Stack:** 순수 HTML5 + CSS(oklch 토큰) + Vanilla JS(ES Modules), Canvas 2D(장식용 시각화). 외부 라이브러리·빌드 스텝 없음. GitHub Pages 정적 호스팅.

**참조 설계 문서:** `docs/superpowers/specs/2026-08-01-portfolio-redesign-design.md` (2026-08-03 개정판)

## Global Constraints

- `main` 브랜치 직접 push 금지 — 모든 작업은 `feat/redesign` 브랜치에서 진행한다
- 빌드 스텝 없음. 순수 정적 HTML/CSS/JS만 사용한다 (npm/번들러 도입 금지)
- 색·타이포·간격은 원시→의미 2계층 토큰만 참조한다. 컴포넌트 CSS에 하드코딩 값 금지
- 애니메이션 속성은 `transform`/`opacity`/`clip-path`로 한정한다. `width`/`height`/`top`/`margin`/`font-size` 애니메이션 금지
- 스크롤 이벤트 핸들러 대신 `IntersectionObserver` + `requestAnimationFrame`만 사용한다
- `prefers-reduced-motion: reduce`일 때 모든 모션(리빌·카운트업·틸트·마그네틱·캔버스)을 즉시 최종 상태로 대체한다
- 호버 전용 효과(스포트라이트·틸트·마그네틱)는 `@media (hover: hover)` / `matchMedia('(hover: hover)')`로 감싼다
- 전화번호는 사이트 어디에도 노출하지 않는다 (이메일·GitHub·블로그만)
- 콘텐츠(프로젝트·지표·소개) 수정은 `assets/js/content.js` 한 파일만 고치면 끝나야 한다 — 레이아웃/모션 코드에서 프로젝트를 하드코딩하지 않는다
- 날짜는 `YYYY-MM-DD` 표기. 지표(커밋 수 등)는 실측값만 쓰고 연출용 숫자를 넣지 않는다
- 시맨틱 HTML(`header`/`nav`/`main`/`section`/`article`/`footer`), 섹션마다 `aria-labelledby`, 키보드 전탐색 가능, `:focus-visible` 명시, 스킵 링크 유지
- `console.log`를 프로덕션 코드에 남기지 않는다

---

## 파일 구조 개요

```
jjssspark.github.io/
├── index.html                    # 전면 재작성 (Task 6)
├── assets/
│   ├── css/
│   │   ├── tokens.css            # Task 2
│   │   ├── base.css              # Task 3
│   │   └── components.css        # Task 4
│   ├── js/
│   │   ├── content.js            # Task 5 — ★ 콘텐츠 데이터 단일 지점
│   │   ├── render.js             # Task 6
│   │   ├── motion.js             # Task 7
│   │   ├── interactions.js       # Task 8
│   │   └── viz/
│   │       ├── trajectory.js     # Task 9
│   │       └── heatmap.js        # Task 9
│   └── img/                      # Task 1에서 생성 (빈 폴더)
├── css/style.css                 # Task 1에서 이동 후 Task 6에서 삭제
└── js/main.js                    # Task 1에서 이동 후 Task 6에서 삭제
```

---

### Task 1: 파일 구조 마이그레이션 (기계적 이동)

기존 `css/style.css`, `js/main.js`를 `assets/` 하위로 옮기고 경로만 갱신한다. 이 태스크에서는 **콘텐츠를 바꾸지 않는다** — 사이트가 이동 전과 시각적으로 동일해야 검증 통과다.

**Files:**
- Move: `css/style.css` → `assets/css/legacy.css`
- Move: `js/main.js` → `assets/js/legacy.js`
- Create (빈 폴더 유지용): `assets/img/.gitkeep`
- Modify: `index.html:14` (`<link>` 경로), `index.html:140` (`<script>` 경로)

**Interfaces:**
- Produces: `assets/css/legacy.css`, `assets/js/legacy.js` — Task 6에서 삭제 대상으로 참조

- [ ] **Step 1: 디렉터리 생성 및 파일 이동**

```bash
cd /Users/tina/Project/jjssspark.github.io
mkdir -p assets/css assets/js/viz assets/img
touch assets/img/.gitkeep
git mv css/style.css assets/css/legacy.css
git mv js/main.js assets/js/legacy.js
```

- [ ] **Step 2: index.html 경로 수정**

`index.html:14`를 다음으로 교체:

```html
  <link rel="stylesheet" href="assets/css/legacy.css" />
```

`index.html:140`을 다음으로 교체:

```html
  <script src="assets/js/legacy.js"></script>
```

- [ ] **Step 3: 로컬 렌더 검증 — 이동 전과 동일해 보이는지 확인**

```bash
cd /Users/tina/Project/jjssspark.github.io
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/assets/css/legacy.css
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/assets/js/legacy.js
kill $SERVER_PID
```

Expected: 세 요청 모두 `200`. 브라우저로 `http://localhost:8000`을 열어 기존 터미널 스타일 히어로("$ whoami")가 그대로 보이는지, 콘솔에 404가 없는지 육안 확인한다.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "chore: css/js를 assets/ 하위로 이동 (경로만 변경, 콘텐츠 동일)"
```

---

### Task 2: `tokens.css` — 디자인 토큰

원시→의미 2계층 토큰을 정의한다. 컬러는 네이비(중립)+클레이(강조)+시안(데이터 시각화 전용), 타이포는 Space Grotesk(본문)+JetBrains Mono(라벨/숫자).

**Files:**
- Create: `assets/css/tokens.css`

**Interfaces:**
- Produces: `--color-*`, `--font-*`, `--text-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--duration-*`, `--ease-*` 커스텀 프로퍼티 — Task 3, 4가 전부 이것만 참조한다

- [ ] **Step 1: tokens.css 작성**

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

  /* 의미 토큰 — 컴포넌트는 이것만 참조 */
  --color-bg: var(--navy-950);
  --color-surface: var(--navy-900);
  --color-surface-alt: var(--navy-800);
  --color-border: var(--navy-700);
  --color-text: var(--navy-100);
  --color-text-muted: var(--navy-400);
  --color-accent: var(--clay-600);
  --color-accent-hover: var(--clay-400);
  --color-data: var(--cyan-400);
  --color-grid: var(--navy-700);

  /* 타이포그래피 */
  --font-sans: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --text-xs: clamp(0.75rem, 0.73rem + 0.10vw, 0.813rem);
  --text-sm: clamp(0.875rem, 0.85rem + 0.12vw, 0.938rem);
  --text-base: clamp(1rem, 0.92rem + 0.40vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1.02rem + 0.52vw, 1.375rem);
  --text-xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);
  --text-2xl: clamp(2rem, 1.5rem + 2.5vw, 3rem);
  --text-hero: clamp(3rem, 1rem + 7vw, 8rem);

  --leading-tight: 1.15;
  --leading-body: 1.6;
  --tracking-tight: -0.02em;
  --tracking-wide: 0.04em;

  /* 간격 — 4px 배수 */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-section: clamp(4rem, 3rem + 5vw, 10rem);

  /* 반경 · 그림자 */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;
  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
  --shadow-md: 0 4px 12px oklch(0% 0 0 / 0.24);
  --shadow-lg: 0 12px 32px oklch(0% 0 0 / 0.32);

  /* 모션 */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 600ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: 파일 문법 검증**

```bash
cd /Users/tina/Project/jjssspark.github.io
grep -c -- "--color-bg: var(--navy-950);" assets/css/tokens.css
grep -c -- "--color-accent: var(--clay-600);" assets/css/tokens.css
```

Expected: 둘 다 `1` 출력.

- [ ] **Step 3: 커밋**

```bash
git add assets/css/tokens.css
git commit -m "feat: 계측 장비 컨셉 디자인 토큰(tokens.css) 추가"
```

---

### Task 3: `base.css` — 리셋·레이아웃·접근성 기반

리셋, 본문 타이포, 컨테이너, 섹션 리듬, 스킵 링크, 포커스 링, 등장 리빌(`.reveal`), 스트라이크존 9분할 그리드 유틸리티를 정의한다.

**Files:**
- Create: `assets/css/base.css`

**Interfaces:**
- Consumes: Task 2의 `--color-*`, `--font-*`, `--space-*` 등
- Produces: `.container`, `.section`, `.section-kicker`, `.section-title`, `.skip-link`, `.reveal`, `.strike-grid`, `.strike-grid__cell` 클래스 — Task 4, 6, 7이 사용

- [ ] **Step 1: base.css 작성**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-body);
  -webkit-font-smoothing: antialiased;
}

img {
  max-width: 100%;
  display: block;
}

a {
  color: inherit;
}

h1,
h2,
h3,
p,
dl,
dd,
ul {
  margin: 0;
}

.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  background: var(--color-accent);
  color: var(--navy-950);
  padding: var(--space-2) var(--space-4);
  z-index: 100;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 600;
}
.skip-link:focus {
  left: var(--space-4);
  top: var(--space-4);
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.container {
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: var(--space-6);
}

.section {
  padding-block: var(--space-section);
  scroll-margin-top: var(--space-8);
}

.section-kicker {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wide);
  color: var(--color-accent);
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}

.section-title {
  font-size: var(--text-2xl);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-8);
}

/* 등장 리빌 — motion.js가 .is-visible을 토글 */
.reveal {
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity var(--duration-slow) var(--ease-out-expo),
    transform var(--duration-slow) var(--ease-out-expo);
  transition-delay: var(--delay, 0ms);
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* 스트라이크존 9분할 — 히어로 배경 그리드. 순수 장식(aria-hidden) */
.strike-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  pointer-events: none;
  z-index: 0;
}
.strike-grid__cell {
  border: 1px solid var(--color-grid);
  opacity: 0;
  transition: opacity var(--duration-slow) var(--ease-out-expo);
  transition-delay: var(--delay, 0ms);
}
.strike-grid__cell.is-visible {
  opacity: 0.4;
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .strike-grid__cell {
    opacity: 0.4;
    transition: none;
  }
}
```

- [ ] **Step 2: 검증**

```bash
cd /Users/tina/Project/jjssspark.github.io
grep -c "\.reveal\.is-visible" assets/css/base.css
grep -c "\.strike-grid__cell" assets/css/base.css
```

Expected: 둘 다 `1` 이상.

- [ ] **Step 3: 커밋**

```bash
git add assets/css/base.css
git commit -m "feat: 리셋·레이아웃·접근성 기반 스타일(base.css) 추가"
```

---

### Task 4: `components.css` — 컴포넌트 스타일

네비, 히어로(스포트라이트 배경), 프로젝트 카드(Featured/Shipped/Coming Soon 3종), 박스스코어 스탯 라인, 태그(크로스필터), 기술 근거, 연락처, 푸터.

**Files:**
- Create: `assets/css/components.css`

**Interfaces:**
- Consumes: Task 2 토큰, Task 3의 `.container`/`.section`/`.reveal`
- Produces: `.hero`, `.hero-spotlight`, `.stat-line`, `.project-card`(+`--featured`/`--soon` 수식자), `.tag`, `.is-dimmed`, `.is-active`, `.status-badge`, `.viz-canvas`, `.eng-item`, `.contact-list` — Task 6(render.js), Task 8(interactions.js)이 이 클래스명을 그대로 사용

- [ ] **Step 1: components.css 작성**

```css
/* Nav */
header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in oklch, var(--color-bg) 85%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}
nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: var(--space-4);
}
.logo {
  font-family: var(--font-mono);
  font-weight: 700;
  text-decoration: none;
}
.nav-links {
  display: flex;
  gap: var(--space-6);
  list-style: none;
  padding: 0;
}
.nav-links a {
  text-decoration: none;
  position: relative;
}
.nav-links a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 1px;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-fast) var(--ease-out-expo);
}
.nav-links a:hover::after {
  transform: scaleX(1);
}

/* Hero */
.hero {
  position: relative;
  min-height: 90vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: var(--space-6);
  width: 100%;
}
.hero-spotlight {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(
    400px circle at var(--mx, 50%) var(--my, 50%),
    color-mix(in oklch, var(--color-accent) 15%, transparent),
    transparent 70%
  );
  pointer-events: none;
}
@media (hover: none) {
  .hero-spotlight {
    display: none;
  }
}
.hero-name {
  font-size: var(--text-hero);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  margin-block: var(--space-2);
}
.hero-tagline {
  font-size: var(--text-lg);
  color: var(--color-text-muted);
  max-width: 40ch;
}
.stat-line {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin-block: var(--space-8);
  font-family: var(--font-mono);
}
.stat-line dt {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
.stat-line dd {
  font-size: var(--text-xl);
  color: var(--color-accent);
}
.hero-cta {
  display: flex;
  gap: var(--space-4);
}
.btn {
  display: inline-block;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 600;
  transition:
    transform var(--duration-fast) var(--ease-out-expo),
    background-color var(--duration-fast) var(--ease-out-expo),
    border-color var(--duration-fast) var(--ease-out-expo);
}
.btn-primary {
  background: var(--color-accent);
  color: var(--navy-950);
}
.btn-primary:hover {
  background: var(--color-accent-hover);
}
.btn-ghost {
  border: 1px solid var(--color-border);
}
.btn-ghost:hover {
  border-color: var(--color-accent);
}
.btn:active {
  transform: translateY(1px);
}

/* Project cards */
.project-grid {
  display: grid;
  gap: var(--space-6);
}
.project-grid--featured {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}
.project-grid--shipped {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}
.project-grid--soon {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.project-card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  overflow: hidden;
  transition:
    transform var(--duration-fast) var(--ease-out-expo),
    border-color var(--duration-fast) var(--ease-out-expo),
    opacity var(--duration-fast) var(--ease-out-expo);
}
.project-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    240px circle at var(--mx, 50%) var(--my, 50%),
    color-mix(in oklch, var(--color-accent) 12%, transparent),
    transparent 70%
  );
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out-expo);
  pointer-events: none;
}
@media (hover: hover) {
  .project-card:hover::before {
    opacity: 1;
  }
  .project-card:hover {
    border-color: var(--color-accent);
  }
}
.project-card--featured {
  padding: var(--space-8);
}
.project-card--soon {
  opacity: 0.55;
  border-style: dashed;
}
.project-card--soon:hover {
  opacity: 0.75;
}
.project-card.is-dimmed {
  opacity: 0.35;
}

.project-index {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.project-name {
  margin-block: var(--space-2);
  font-size: var(--text-xl);
}
.project-desc {
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}
.status-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  margin-bottom: var(--space-3);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
  padding: 0;
  margin-bottom: var(--space-4);
}
.tag {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  border-radius: var(--radius-full);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  min-height: 24px;
  transition:
    background-color var(--duration-fast) var(--ease-out-expo),
    color var(--duration-fast) var(--ease-out-expo);
}
.tag.is-active {
  background: var(--color-accent);
  color: var(--navy-950);
  border-color: var(--color-accent);
}

.project-link {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  text-decoration: none;
  position: relative;
}
.project-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-fast) var(--ease-out-expo);
}
.project-link:hover::after {
  transform: scaleX(1);
}

.viz-canvas {
  width: 100%;
  height: 120px;
  margin-bottom: var(--space-4);
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
}

/* Engineering */
.eng-list {
  display: grid;
  gap: var(--space-6);
}
.eng-item {
  border-left: 2px solid var(--color-accent);
  padding-left: var(--space-4);
}
.eng-item h3 {
  margin-bottom: var(--space-2);
}
.eng-item p {
  margin-bottom: var(--space-2);
  color: var(--color-text-muted);
}
.eng-commits {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}
.eng-commits a {
  color: var(--color-data);
  text-decoration: none;
}
.eng-commits a:hover {
  text-decoration: underline;
}

/* Contact */
.contact-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: var(--space-4);
}
.contact-label {
  display: inline-block;
  width: 6rem;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

footer {
  text-align: center;
  padding-block: var(--space-8);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  border-top: 1px solid var(--color-border);
}

/* 스크롤 진행 인디케이터 — 실밥(seam) 곡선. CSS 스크롤 연동 애니메이션만 사용, JS 없음 */
.scroll-seam {
  position: fixed;
  top: 0;
  right: 0;
  width: 4px;
  height: 100vh;
  z-index: 60;
  pointer-events: none;
}
.scroll-seam path {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
@supports (animation-timeline: scroll()) {
  .scroll-seam path {
    animation: seam-progress auto linear;
    animation-timeline: scroll(root);
  }
}
@keyframes seam-progress {
  to {
    stroke-dashoffset: 0;
  }
}
@supports not (animation-timeline: scroll()) {
  .scroll-seam {
    display: none;
  }
}
```

- [ ] **Step 2: 검증**

```bash
cd /Users/tina/Project/jjssspark.github.io
grep -c "\.project-card--featured" assets/css/components.css
grep -c "\.project-card--soon" assets/css/components.css
grep -c "@media (hover: hover)" assets/css/components.css
grep -c "\.scroll-seam" assets/css/components.css
```

Expected: 전부 `1` 이상.

- [ ] **Step 3: 커밋**

```bash
git add assets/css/components.css
git commit -m "feat: 히어로·프로젝트카드·태그·기술근거 컴포넌트 스타일 추가"
```

---

### Task 5: `content.js` — 콘텐츠 데이터

프로필, 프로젝트 10개(Featured 2·Shipped 6·Coming Soon 2), 기술 근거 4건을 데이터로 정의한다. **이 파일이 사이트의 유일한 콘텐츠 소스다.**

먼저 실측값을 확인한다: WorkFlow_AI 팀 커밋 수는 시점에 따라 바뀌므로, 아래 명령으로 최신 값을 확인하고 그 숫자를 `profile.stats`의 `TEAM COMMITS`에 반영한다.

**Files:**
- Create: `assets/js/content.js`

**Interfaces:**
- Produces: `export const profile`, `export const projects` (`Project[]`), `export const engineering` — Task 6(render.js)이 그대로 import

- [ ] **Step 1: 실측 커밋 수 확인**

```bash
git -C /Users/tina/Project/WorkFlow_AI shortlog -sn --all | grep -i qkrwltn
```

출력된 숫자를 기록해둔다 (이 계획 작성 시점 실측값: `359`). 실행 시점에 숫자가 다르면 Step 2의 `TEAM COMMITS` 값을 그 숫자로 바꿔 쓴다.

- [ ] **Step 2: content.js 작성**

```js
/**
 * @typedef {Object} ProjectLinks
 * @property {string|null} repo
 * @property {string|null} demo
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {'featured'|'shipped'|'coming-soon'} tier
 * @property {'in-play'|'shipped'|'coming-soon'} status
 * @property {string} summary
 * @property {string|null} role
 * @property {string[]} stack
 * @property {'trajectory'|'heatmap'|null} viz
 * @property {ProjectLinks} links
 */

export const profile = {
  name: '박지수',
  role: 'ML Engineer / Full-stack',
  tagline: '야구라는 한 도메인을 딥러닝으로 끝까지 판 개발자',
  stats: [
    { label: 'PROJECTS', value: 10 },
    { label: 'TEAM COMMITS', value: 359 },
    { label: 'STACKS', value: 19 },
  ],
  links: {
    email: 'hsyoun585@gmail.com',
    github: 'https://github.com/jjssspark',
    blog: 'https://qkrwltn.tistory.com',
  },
};

/** @type {Project[]} */
export const projects = [
  {
    id: 'workflow-ai',
    name: 'WorkFlow AI',
    tier: 'featured',
    status: 'in-play',
    summary:
      '팀 프로젝트의 회의·업무·개발 기록·산출물·평가 근거를 AI로 하나의 흐름으로 연결하는 협업·평가 보조 웹 플랫폼. 10인 팀, 441커밋 중 359커밋으로 2위 기여자.',
    role: 'AI 어시스턴트(RAG 챗봇), 대시보드 지연위험도 분석, CI/CD 배포 게이트',
    stack: ['React', 'TypeScript', 'Spring Boot', 'FastAPI', 'LangGraph', 'Redis'],
    viz: null,
    links: { repo: 'https://github.com/rhantj/work-flow', demo: null },
  },
  {
    id: 'jivis',
    name: 'JIVIS',
    tier: 'featured',
    status: 'shipped',
    summary:
      '카카오톡 스타일 UI로 대화하는 Claude 기반 개인 AI 비서. 이름과 말투를 기억하고, 대화를 이어받는다.',
    role: '기획부터 구현까지 단독 완결',
    stack: ['Python', 'Streamlit', 'Claude API'],
    viz: null,
    links: { repo: 'https://github.com/jjssspark/JIVIS', demo: null },
  },
  {
    id: 'pitchiq',
    name: 'PitchIQ',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '이전 투구 패턴과 경기 상황을 분석해 다음 구종을 예측하고, 실제 중계 영상과 연동해 투구 타이밍까지 자동 감지하는 MLB 투구 분석 서비스.',
    role: null,
    stack: ['Python', 'TensorFlow', 'YOLOv8', 'Streamlit'],
    viz: 'trajectory',
    links: { repo: 'https://github.com/jjssspark/DL_Pitcher', demo: null },
  },
  {
    id: 'stovelens-ai',
    name: 'StoveLens AI',
    tier: 'shipped',
    status: 'shipped',
    summary:
      'KBO FA 선수의 최근 성적 데이터를 기반으로 예상 연봉을 예측하고 구단별 적정 제시가를 추천하는 XGBoost 기반 예측 서비스.',
    role: null,
    stack: ['Python', 'XGBoost', 'Streamlit'],
    viz: 'heatmap',
    links: { repo: 'https://github.com/jjssspark/SalaryCast_AI', demo: null },
  },
  {
    id: 'truthlens',
    name: 'TruthLens',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '영상·이미지·뉴스·논문의 AI 생성 여부를 판별하고 신뢰 지표와 판별 근거를 시각화하는 AI 생성 콘텐츠 판별 서비스.',
    role: null,
    stack: ['Python', 'Flask', 'MariaDB', 'Redis', 'Celery'],
    viz: null,
    links: { repo: 'https://github.com/jjssspark/TruthLens', demo: null },
  },
  {
    id: 'tripmate',
    name: 'TripMate AI',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '여행지·일정·예산·동행 유형과 선호 스타일을 입력하면 AI가 동선과 식사 시간대까지 고려한 여행 일정을 생성해주는 AI 여행 플래너.',
    role: null,
    stack: ['React', 'TypeScript', 'Vite', 'Supabase', 'Gemini API'],
    viz: null,
    links: { repo: 'https://github.com/jjssspark/TripMate', demo: 'https://tripgather.netlify.app' },
  },
  {
    id: 'diamondscout-ai',
    name: 'DiamondScout AI',
    tier: 'shipped',
    status: 'shipped',
    summary: 'Gradio 기반 UI로 야구 선수 스카우팅 데이터를 분석하는 도구.',
    role: null,
    stack: ['Python', 'Gradio'],
    viz: null,
    links: { repo: null, demo: null },
  },
  {
    id: 'perjury',
    name: '위증 (PERJURY)',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '클루의 추리 룰 위에서 LLM 에이전트 5명을 거짓 반증과 1:1 밀담으로 교란·교섭하는 싱글플레이 웹 추리게임. NHN Game×AI 해커톤 사전 과제.',
    role: null,
    stack: ['React', 'TypeScript', 'Claude API'],
    viz: null,
    links: { repo: 'https://github.com/rhantj/perjury', demo: null },
  },
  {
    id: 'onque',
    name: 'OnQue',
    tier: 'coming-soon',
    status: 'coming-soon',
    summary: 'FastAPI와 Gemini API를 연동한 서비스. 준비 중입니다.',
    role: null,
    stack: [],
    viz: null,
    links: { repo: null, demo: null },
  },
  {
    id: 'zoner',
    name: 'Zoner',
    tier: 'coming-soon',
    status: 'coming-soon',
    summary: 'React 기반 서비스. 준비 중입니다.',
    role: null,
    stack: [],
    viz: null,
    links: { repo: null, demo: null },
  },
];

export const engineering = [
  {
    title: 'RAG 임베딩 LoRA 파인튜닝',
    problem:
      'HF Inference API는 서버리스라 커스텀(파인튜닝) 임베딩 모델을 서빙하지 못해, RAG 검색이 쿼리 노이즈에 취약한 상태로 원격 API에 묶여 있었다.',
    solution:
      'BAAI/bge-m3에 쿼리 노이즈 강건성 실험을 담은 LoRA 파인튜닝을 적용해 병합한 모델을 HF Hub에 올리고, 컨테이너 내부 로컬 추론(sentence-transformers)으로 전환했다.',
    commits: ['d12dd8f0'],
  },
  {
    title: 'Isolation Forest 3축 독립 판정 구조',
    problem: '이상치 탐지 로직이 축마다 제각각 구현되어 있어 판정 기준을 한 곳에서 검증하기 어려웠다.',
    solution: 'Isolation Forest 판정 경로를 compute_axis_results 기반 3축 독립 판정 구조로 통일했다.',
    commits: ['2468029e'],
  },
  {
    title: 'RAG·대시보드 비동기 처리 Redis Queue 전환',
    problem:
      'RAG 챗봇 응답과 대시보드 지연위험도·업무편중 재분석이 요청 스레드에서 동기 처리되어, 처리 시간이 길어질수록 API가 그대로 블로킹됐다.',
    solution:
      'RagQueueWorker/DashboardAiQueueWorker가 Redis Stream을 컨슈머 그룹으로 소비하도록 분리하고, 큐 포화·타임아웃 전용 에러를 추가했다. 동시 재분석 요청은 in-flight 마커로 병합하고, 완료 시 SSE로 알린다.',
    commits: ['da307984', '09f390b9'],
  },
  {
    title: 'CI 배포 게이트',
    problem:
      'FastAPI 테스트 워크플로가 배포 잡의 needs에 없어 테스트가 깨져도 배포가 나갈 수 있었고(2026-08-01 실제 발생), 마이그레이션 버전 중복도 PR 단위로는 보이지 않아 dev/main이 배포 불가 상태가 된 적이 있다(2026-07-27).',
    solution:
      'FastAPI 테스트를 workflow_call로 배포 게이트에 편입하고, 마이그레이션 버전 중복 검사를 스크립트 하나로 통일해 deploy 잡의 test 단계에 물렸다.',
    commits: ['db8fd9bc', 'c6f5b5b2'],
  },
];
```

- [ ] **Step 3: 문법 검증**

```bash
cd /Users/tina/Project/jjssspark.github.io
node --check assets/js/content.js
```

Expected: 에러 없이 종료.

- [ ] **Step 4: 데이터 정합성 검증 (프로젝트 수·티어 분포·스택 개수)**

```bash
cd /Users/tina/Project/jjssspark.github.io
node -e "
import('./assets/js/content.js').then((m) => {
  const uniqueStacks = new Set(m.projects.flatMap((p) => p.stack));
  console.log('projects total:', m.projects.length);
  console.log('featured:', m.projects.filter((p) => p.tier === 'featured').length);
  console.log('shipped:', m.projects.filter((p) => p.tier === 'shipped').length);
  console.log('coming-soon:', m.projects.filter((p) => p.tier === 'coming-soon').length);
  console.log('unique stacks:', uniqueStacks.size);
  console.log('stat PROJECTS:', m.profile.stats.find((s) => s.label === 'PROJECTS').value);
  console.log('stat STACKS:', m.profile.stats.find((s) => s.label === 'STACKS').value);
});
"
```

Expected: `projects total: 10`, `featured: 2`, `shipped: 6`, `coming-soon: 2`, `unique stacks`와 `stat STACKS`가 서로 같은 값, `stat PROJECTS`가 `10`과 같은 값. 값이 다르면 `profile.stats`를 실제 계산값에 맞게 고친다.

- [ ] **Step 5: 개인정보 검증 — 전화번호 없음 확인**

```bash
cd /Users/tina/Project/jjssspark.github.io
grep -c "010-" assets/js/content.js || echo "전화번호 없음 확인"
```

Expected: `전화번호 없음 확인` 출력 (grep이 매치 없음으로 종료).

- [ ] **Step 6: 커밋**

```bash
git add assets/js/content.js
git commit -m "feat: 프로젝트 10개·기술근거 4건 콘텐츠 데이터(content.js) 추가"
```

---

### Task 6: `render.js` + `index.html` — 데이터 → DOM

`content.js`를 읽어 히어로·Featured·Shipped·Coming Soon·기술근거·연락처를 렌더링한다. `index.html`을 컨테이너 중심 구조로 재작성하고, `legacy.css`/`legacy.js`를 삭제한다.

**Files:**
- Create: `assets/js/render.js`
- Modify: `index.html` (전체 재작성)
- Delete: `assets/css/legacy.css`, `assets/js/legacy.js`

**Interfaces:**
- Consumes: Task 5의 `profile`/`projects`/`engineering`, Task 3/4의 CSS 클래스명(`.scroll-seam` 포함)
- Produces: DOM에 `.project-card`(`data-stack-list` 속성 포함), `[data-countup]`, `.strike-grid__cell`(`#hero-grid` 안), `canvas[data-viz]` 엘리먼트 — Task 7(motion.js), 8(interactions.js), 9(viz)가 이 셀렉터로 조회

- [ ] **Step 1: index.html 재작성**

`index.html` 전체를 다음으로 교체:

```html
<!doctype html>
<html lang="ko">
<head>
  <script>document.documentElement.classList.add('js');</script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>박지수 — Developer Portfolio</title>
  <meta name="description" content="박지수의 개발자 포트폴리오. WorkFlow_AI, JIVIS를 비롯한 10개 프로젝트를 소개합니다." />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="assets/css/tokens.css" />
  <link rel="stylesheet" href="assets/css/base.css" />
  <link rel="stylesheet" href="assets/css/components.css" />
</head>
<body>
  <a class="skip-link" href="#main">본문으로 건너뛰기</a>

  <svg class="scroll-seam" aria-hidden="true" viewBox="0 0 4 200" preserveAspectRatio="none">
    <path
      pathLength="1"
      d="M2,0 C0,20 4,40 2,60 C0,80 4,100 2,120 C0,140 4,160 2,180 C0,190 4,195 2,200"
    />
  </svg>

  <header>
    <nav class="container" aria-label="주 메뉴">
      <a class="logo" href="#top">jjssspark</a>
      <ul class="nav-links">
        <li><a href="#about">About</a></li>
        <li><a href="#featured">Featured</a></li>
        <li><a href="#projects">Projects</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main id="main">
    <section id="top" class="hero" aria-labelledby="hero-heading">
      <div class="strike-grid" aria-hidden="true" id="hero-grid"></div>
      <div class="hero-spotlight" aria-hidden="true"></div>
      <div class="hero-inner">
        <p class="section-kicker">Developer Portfolio</p>
        <h1 id="hero-heading" class="hero-name" data-hero="name"></h1>
        <p class="hero-tagline" data-hero="tagline"></p>
        <dl class="stat-line" id="hero-stats"></dl>
        <div class="hero-cta">
          <a class="btn btn-primary" data-hero="github" target="_blank" rel="noopener noreferrer">GitHub 보기</a>
          <a class="btn btn-ghost" href="#contact">연락하기</a>
        </div>
      </div>
    </section>

    <section id="about" class="section container" aria-labelledby="about-heading">
      <p class="section-kicker">01 · About</p>
      <h2 id="about-heading" class="section-title reveal">소개</h2>
      <p class="about-text reveal">
        야구라는 한 도메인을 딥러닝으로 끝까지 판 개발자입니다. 실시간 투구 예측부터 FA 연봉 예측까지
        야구 데이터를 다양한 각도로 다뤄봤고, 10인 팀 프로젝트에서 두 번째로 많은 커밋을 넣으며 실제
        협업 환경에서 아키텍처를 설계하고 문제를 해결하는 경험을 쌓았습니다.
      </p>
    </section>

    <section id="featured" class="section container" aria-labelledby="featured-heading">
      <p class="section-kicker">02 · Featured</p>
      <h2 id="featured-heading" class="section-title reveal">대표 프로젝트</h2>
      <div class="project-grid project-grid--featured" id="featured-grid"></div>
    </section>

    <section id="projects" class="section container" aria-labelledby="projects-heading">
      <p class="section-kicker">03 · Shipped</p>
      <h2 id="projects-heading" class="section-title reveal">프로젝트</h2>
      <div class="project-grid project-grid--shipped" id="shipped-grid"></div>
    </section>

    <section id="coming-soon" class="section container" aria-labelledby="coming-soon-heading">
      <p class="section-kicker">04 · Coming Soon</p>
      <h2 id="coming-soon-heading" class="section-title reveal">준비 중</h2>
      <div class="project-grid project-grid--soon" id="soon-grid"></div>
    </section>

    <section id="engineering" class="section container" aria-labelledby="engineering-heading">
      <p class="section-kicker">05 · Engineering</p>
      <h2 id="engineering-heading" class="section-title reveal">기술 근거</h2>
      <div class="eng-list" id="engineering-list"></div>
    </section>

    <section id="contact" class="section container" aria-labelledby="contact-heading">
      <p class="section-kicker">06 · Contact</p>
      <h2 id="contact-heading" class="section-title reveal">연락처</h2>
      <ul class="contact-list reveal" id="contact-list"></ul>
    </section>
  </main>

  <footer>
    <p>&copy; 2026 박지수. Built with plain HTML/CSS/JS, hosted on GitHub Pages.</p>
  </footer>

  <script type="module" src="assets/js/render.js"></script>
  <script type="module" src="assets/js/viz/trajectory.js"></script>
  <script type="module" src="assets/js/viz/heatmap.js"></script>
  <script type="module" src="assets/js/motion.js"></script>
  <script type="module" src="assets/js/interactions.js"></script>
</body>
</html>
```

- [ ] **Step 2: render.js 작성**

```js
import { profile, projects, engineering } from './content.js';

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );
}

function renderHero() {
  document.querySelector('[data-hero="name"]').textContent = profile.name;
  document.querySelector('[data-hero="tagline"]').textContent = profile.tagline;
  document.querySelector('[data-hero="github"]').href = profile.links.github;

  const statLine = document.getElementById('hero-stats');
  statLine.innerHTML = profile.stats
    .map(
      (stat) => `
    <div>
      <dt>${escapeHtml(stat.label)}</dt>
      <dd data-countup="${stat.value}">0</dd>
    </div>
  `
    )
    .join('');

  const grid = document.getElementById('hero-grid');
  grid.innerHTML = Array.from({ length: 9 }, (_, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const diagonal = row + col;
    return `<span class="strike-grid__cell" style="--delay:${diagonal * 90}ms"></span>`;
  }).join('');
}

/**
 * @param {import('./content.js').Project} project
 * @param {number} index
 * @returns {string}
 */
function projectCardHtml(project, index) {
  const tagsHtml = project.stack.length
    ? `<ul class="tag-list" aria-label="사용 기술">${project.stack
        .map((tag) => `<li><button type="button" class="tag" data-stack="${escapeHtml(tag)}">${escapeHtml(tag)}</button></li>`)
        .join('')}</ul>`
    : '';
  const vizHtml = project.viz
    ? `<canvas class="viz-canvas" data-viz="${project.viz}" aria-hidden="true"></canvas>`
    : '';
  const linkHtml = project.links.repo
    ? `<a class="project-link" href="${escapeHtml(project.links.repo)}" target="_blank" rel="noopener noreferrer">Repository <span aria-hidden="true">↗</span></a>`
    : `<span class="project-link">비공개 저장소</span>`;
  const demoHtml = project.links.demo
    ? ` · <a class="project-link" href="${escapeHtml(project.links.demo)}" target="_blank" rel="noopener noreferrer">Demo <span aria-hidden="true">↗</span></a>`
    : '';
  const statusHtml =
    project.status === 'in-play'
      ? '<span class="status-badge">IN PLAY</span>'
      : project.status === 'coming-soon'
        ? '<span class="status-badge">COMING SOON</span>'
        : '';
  const roleHtml = project.role
    ? `<p class="project-desc"><strong>담당:</strong> ${escapeHtml(project.role)}</p>`
    : '';
  const tierClass =
    project.tier === 'featured' ? ' project-card--featured' : project.tier === 'coming-soon' ? ' project-card--soon' : '';

  return `
    <article class="project-card${tierClass} reveal" style="--delay:${(index % 6) * 60}ms" data-stack-list="${project.stack.map(escapeHtml).join(',')}">
      <span class="project-index">${String(index + 1).padStart(2, '0')}</span>
      ${statusHtml}
      <h3 class="project-name">${escapeHtml(project.name)}</h3>
      <p class="project-desc">${escapeHtml(project.summary)}</p>
      ${roleHtml}
      ${vizHtml}
      ${tagsHtml}
      ${linkHtml}${demoHtml}
    </article>
  `;
}

function renderProjects() {
  const featured = projects.filter((p) => p.tier === 'featured');
  const shipped = projects.filter((p) => p.tier === 'shipped');
  const soon = projects.filter((p) => p.tier === 'coming-soon');

  document.getElementById('featured-grid').innerHTML = featured.map((p, i) => projectCardHtml(p, i)).join('');
  document.getElementById('shipped-grid').innerHTML = shipped.map((p, i) => projectCardHtml(p, i)).join('');
  document.getElementById('soon-grid').innerHTML = soon.map((p, i) => projectCardHtml(p, i)).join('');
}

function renderEngineering() {
  const list = document.getElementById('engineering-list');
  list.innerHTML = engineering
    .map(
      (item, index) => `
    <article class="eng-item reveal" style="--delay:${index * 80}ms">
      <h3>${escapeHtml(item.title)}</h3>
      <p><strong>문제:</strong> ${escapeHtml(item.problem)}</p>
      <p><strong>해결:</strong> ${escapeHtml(item.solution)}</p>
      <div class="eng-commits">
        ${item.commits
          .map((hash) => `<a href="https://github.com/rhantj/work-flow/commit/${hash}" target="_blank" rel="noopener noreferrer">${hash}</a>`)
          .join('')}
      </div>
    </article>
  `
    )
    .join('');
}

function renderContact() {
  const list = document.getElementById('contact-list');
  list.innerHTML = `
    <li><span class="contact-label">Email</span><a href="mailto:${escapeHtml(profile.links.email)}">${escapeHtml(profile.links.email)}</a></li>
    <li><span class="contact-label">GitHub</span><a href="${escapeHtml(profile.links.github)}" target="_blank" rel="noopener noreferrer">${escapeHtml(profile.links.github.replace('https://', ''))}</a></li>
    <li><span class="contact-label">Blog</span><a href="${escapeHtml(profile.links.blog)}" target="_blank" rel="noopener noreferrer">${escapeHtml(profile.links.blog.replace('https://', ''))}</a></li>
  `;
}

renderHero();
renderProjects();
renderEngineering();
renderContact();
```

- [ ] **Step 3: legacy 파일 삭제**

```bash
cd /Users/tina/Project/jjssspark.github.io
git rm assets/css/legacy.css assets/js/legacy.js
```

- [ ] **Step 4: 문법 검증**

```bash
node --check assets/js/render.js
```

- [ ] **Step 5: 로컬 렌더 검증**

```bash
cd /Users/tina/Project/jjssspark.github.io
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 1
curl -s http://localhost:8000/ | grep -c "project-grid"
kill $SERVER_PID
```

Expected: `3` 이상 (featured/shipped/soon 그리드 컨테이너 존재). 브라우저로 열어 콘솔 확인 — `render.js` 관련 에러 없이 Featured 2개·Shipped 6개·Coming Soon 2개 카드가 렌더링되는지, 히어로 이름/태그라인이 채워지는지 확인한다.

- [ ] **Step 6: 개인정보 최종 확인**

```bash
cd /Users/tina/Project/jjssspark.github.io
grep -rn "010-4809" index.html assets/ || echo "전화번호 없음 확인"
```

Expected: `전화번호 없음 확인` 출력.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: content.js 기반 렌더링(render.js)으로 index.html 전면 교체, legacy 파일 제거"
```

---

### Task 7: `motion.js` — 스크롤 리빌 · 카운트업

`.reveal`/`.strike-grid__cell` 등장 애니메이션과 히어로 스탯 카운트업을 구현한다. `prefers-reduced-motion`일 때 즉시 최종 상태로 렌더한다.

**Files:**
- Create: `assets/js/motion.js`

**Interfaces:**
- Consumes: Task 6의 `.reveal`, `.strike-grid__cell`, `[data-countup]` 엘리먼트 (렌더 완료 후 존재해야 함)

- [ ] **Step 1: motion.js 작성**

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {HTMLElement} el
 */
function animateCountUp(el) {
  const target = Number(el.dataset.countup);
  if (prefersReducedMotion) {
    el.textContent = String(target);
    return;
  }
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * @param {string} selector
 * @param {(el: HTMLElement) => void} [onReveal]
 */
function setupReveal(selector, onReveal) {
  const targets = document.querySelectorAll(selector);
  if (!targets.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((el) => {
      el.classList.add('is-visible');
      onReveal?.(el);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          onReveal?.(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}

setupReveal('.reveal');
setupReveal('.strike-grid__cell');
setupReveal('[data-countup]', animateCountUp);

/**
 * 히어로 배경 그리드에 0.15배 미세 패럴랙스를 건다.
 * 스크롤 이벤트 리스너를 쓰지 않는다 — IntersectionObserver로 히어로가 보일 때만
 * rAF 루프를 돌리고, 벗어나면 멈춘다.
 */
function setupHeroParallax() {
  const hero = document.querySelector('.hero');
  const grid = document.getElementById('hero-grid');
  if (!hero || !grid || prefersReducedMotion || !('IntersectionObserver' in window)) return;

  let rafId = null;

  function loop() {
    grid.style.transform = `translate3d(0, ${window.scrollY * 0.15}px, 0)`;
    rafId = requestAnimationFrame(loop);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (rafId === null) rafId = requestAnimationFrame(loop);
      } else if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
  });
  observer.observe(hero);
}

setupHeroParallax();
```

- [ ] **Step 2: 문법 검증**

```bash
node --check assets/js/motion.js
```

- [ ] **Step 3: 로컬 동작 검증**

```bash
cd /Users/tina/Project/jjssspark.github.io
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 1
echo "http://localhost:8000 에서 확인: 1) 아래로 스크롤하면 섹션 제목·카드가 서서히 나타나는지 2) 히어로 스탯 숫자가 0에서 목표값까지 올라가는지 3) 히어로 배경 9칸 그리드가 대각선 순서로 페이드인 하는지 4) 히어로 구간에서 스크롤하면 배경 그리드가 본문보다 살짝 느리게 따라오는지(패럴랙스) 5) 화면 오른쪽 끝 실밥 곡선이 스크롤 진행에 따라 채워지는지(Chrome/Edge 115+ 확인, 미지원 브라우저는 숨김 처리되는 게 정상)"
kill $SERVER_PID
```

macOS 손쉬운 사용 설정에서 "동작 줄이기"를 켠 뒤 새로고침하면 모든 요소가 애니메이션 없이 즉시 보여야 한다.

- [ ] **Step 4: 커밋**

```bash
git add assets/js/motion.js
git commit -m "feat: 스크롤 리빌·카운트업 모션(motion.js) 추가"
```

---

### Task 8: `interactions.js` — 포인터 인터랙션

커서 스포트라이트(히어로+카드), 카드 3D 틸트, 버튼 마그네틱, 기술 태그 크로스필터를 구현한다. 호버 지원 기기+동작 감소 미설정에서만 스포트라이트/틸트/마그네틱을 켜고, 크로스필터는 클릭(터치 탭 포함)으로 항상 동작한다.

**Files:**
- Create: `assets/js/interactions.js`

**Interfaces:**
- Consumes: Task 6의 `.hero`, `.project-card`, `.btn`, `.tag[data-stack]`, `[data-stack-list]`

- [ ] **Step 1: interactions.js 작성**

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const supportsHover = window.matchMedia('(hover: hover)').matches;

/**
 * @param {HTMLElement} el
 */
function setupSpotlight(el) {
  el.addEventListener('mousemove', (event) => {
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
}

/**
 * @param {HTMLElement} card
 */
function setupTilt(card) {
  const maxDeg = 4;
  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateX(${(-py * maxDeg).toFixed(2)}deg) rotateY(${(px * maxDeg).toFixed(2)}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
}

/**
 * @param {HTMLElement} btn
 */
function setupMagnetic(btn) {
  const pull = 6;
  btn.addEventListener('mousemove', (event) => {
    const rect = btn.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    btn.style.transform = `translate(${(x * pull).toFixed(1)}px, ${(y * pull).toFixed(1)}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
}

function setupCrossFilter() {
  const tagButtons = Array.from(document.querySelectorAll('.tag'));
  const cards = Array.from(document.querySelectorAll('.project-card'));
  if (!tagButtons.length) return;

  /**
   * @param {string|null} stack
   */
  function applyFilter(stack) {
    cards.forEach((card) => {
      const cardStack = (card.dataset.stackList || '').split(',');
      card.classList.toggle('is-dimmed', Boolean(stack) && !cardStack.includes(stack));
    });
    tagButtons.forEach((btn) => {
      btn.classList.toggle('is-active', Boolean(stack) && btn.dataset.stack === stack);
    });
  }

  tagButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isActive = btn.classList.contains('is-active');
      applyFilter(isActive ? null : btn.dataset.stack);
    });
  });
}

if (!prefersReducedMotion && supportsHover) {
  const hero = document.querySelector('.hero');
  if (hero) setupSpotlight(hero);

  document.querySelectorAll('.project-card').forEach((card) => {
    setupSpotlight(card);
    setupTilt(card);
  });

  document.querySelectorAll('.btn').forEach(setupMagnetic);
}

setupCrossFilter();
```

- [ ] **Step 2: 문법 검증**

```bash
node --check assets/js/interactions.js
```

- [ ] **Step 3: 로컬 동작 검증**

```bash
cd /Users/tina/Project/jjssspark.github.io
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 1
echo "http://localhost:8000 에서 확인: 1) 히어로 배경에 마우스를 움직이면 은은한 글로우가 따라오는지 2) 프로젝트 카드에 마우스를 올리면 살짝 기울어지는지 3) 버튼에 마우스를 올리면 커서 쪽으로 살짝 끌리는지 4) 기술 태그(예: Python)를 클릭하면 그 기술을 안 쓰는 카드가 흐려지는지, 다시 클릭하면 해제되는지"
kill $SERVER_PID
```

Chrome DevTools에서 기기 툴바로 터치 기기를 에뮬레이트한 뒤, 카드 hover 효과가 나타나지 않고 태그 탭만으로 크로스필터가 동작하는지 확인한다.

- [ ] **Step 4: 커밋**

```bash
git add assets/js/interactions.js
git commit -m "feat: 커서 스포트라이트·틸트·마그네틱·크로스필터 인터랙션(interactions.js) 추가"
```

---

### Task 9: `viz/trajectory.js`, `viz/heatmap.js` — 장식용 캔버스

PitchIQ 카드의 궤적, StoveLens AI 카드의 스트라이크존 히트맵을 캔버스로 그린다. **실제 경기 데이터가 아닌 장식용 시각화**이므로 `aria-hidden="true"`로 스크린리더에서 제외한다(Task 6에서 이미 처리). 스크롤 진입 비율에 따라 그려지는 정도가 늘어난다.

**Files:**
- Create: `assets/js/viz/trajectory.js`
- Create: `assets/js/viz/heatmap.js`

**Interfaces:**
- Consumes: Task 6의 `canvas[data-viz="trajectory"]`, `canvas[data-viz="heatmap"]`

- [ ] **Step 1: trajectory.js 작성**

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} progress - 0..1
 */
function drawTrajectory(canvas, progress) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = 'oklch(78% 0.15 195)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  const steps = Math.floor(40 * progress);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / 40;
    const x = t * width;
    const y = height * 0.15 + t ** 1.6 * height * 0.7;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function initTrajectoryCanvases() {
  document.querySelectorAll('canvas[data-viz="trajectory"]').forEach((canvas) => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      drawTrajectory(canvas, 1);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          drawTrajectory(canvas, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    observer.observe(canvas);
  });
}

initTrajectoryCanvases();
```

- [ ] **Step 2: heatmap.js 작성**

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ZONE_INTENSITY = [0.3, 0.6, 0.35, 0.55, 0.9, 0.5, 0.25, 0.65, 0.3];

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} progress - 0..1
 */
function drawHeatmap(canvas, progress) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const cellW = width / 3;
  const cellH = height / 3;
  ZONE_INTENSITY.forEach((intensity, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const alpha = intensity * progress;
    ctx.fillStyle = `oklch(72% 0.17 55 / ${alpha.toFixed(2)})`;
    ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
    ctx.strokeStyle = 'oklch(30% 0.016 250)';
    ctx.strokeRect(col * cellW, row * cellH, cellW, cellH);
  });
}

function initHeatmapCanvases() {
  document.querySelectorAll('canvas[data-viz="heatmap"]').forEach((canvas) => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      drawHeatmap(canvas, 1);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          drawHeatmap(canvas, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    observer.observe(canvas);
  });
}

initHeatmapCanvases();
```

- [ ] **Step 3: 문법 검증**

```bash
node --check assets/js/viz/trajectory.js
node --check assets/js/viz/heatmap.js
```

- [ ] **Step 4: 로컬 동작 검증**

```bash
cd /Users/tina/Project/jjssspark.github.io
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 1
echo "http://localhost:8000#projects 에서 확인: PitchIQ 카드에 점선 궤적 곡선, StoveLens AI 카드에 3x3 히트맵이 그려지는지. 스크롤로 카드가 나타날 때 점점 채워지는지"
kill $SERVER_PID
```

- [ ] **Step 5: 커밋**

```bash
git add assets/js/viz/
git commit -m "feat: PitchIQ 궤적·StoveLens 히트맵 장식용 캔버스 시각화 추가"
```

---

### Task 10: 접근성 · 개인정보 검증 패스

`.claude/standards/accessibility.md` 체크리스트를 이 사이트에 대해 전부 실행하고, 문제를 발견하면 그 자리에서 고친다.

**Files:**
- Modify: 필요 시 `index.html`, `assets/css/*.css`, `assets/js/render.js` (발견된 이슈에 한해)

- [ ] **Step 1: 키보드 전탐색 검증**

```bash
cd /Users/tina/Project/jjssspark.github.io
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 1
echo "브라우저에서 마우스를 치우고 Tab만으로: 1) 스킵링크가 첫 Tab에 나타나는지 2) 네비 링크 전부 도달 가능한지 3) 모든 프로젝트 카드의 Repository/Demo 링크·기술 태그 버튼에 Tab으로 도달 가능한지 4) 포커스 링(--color-accent 테두리)이 항상 보이는지"
kill $SERVER_PID
```

- [ ] **Step 2: 시맨틱·aria 구조 확인**

```bash
cd /Users/tina/Project/jjssspark.github.io
grep -c "aria-labelledby" index.html
grep -c "<section" index.html
```

Expected: `aria-labelledby` 개수가 `<section` 개수와 같아야 한다(히어로 섹션 포함 총 7개: top·about·featured·projects·coming-soon·engineering·contact 중 `top`은 `hero-heading`으로 라벨링).

- [ ] **Step 3: 대비비 육안 점검**

브라우저 DevTools의 Accessibility 패널(또는 Lighthouse)로 다음 텍스트의 대비비를 확인한다:
- `--color-text`(navy-100) on `--color-bg`(navy-950)
- `--color-text-muted`(navy-400) on `--color-surface`(navy-900)
- `--color-accent`(clay-600) on `--navy-950`(버튼 텍스트)

Expected: 본문 텍스트 4.5:1 이상, 큰 텍스트(섹션 타이틀 등) 3:1 이상. 기준 미달 시 해당 원시 토큰의 `L`(명도) 값을 `tokens.css`에서 조정한다.

- [ ] **Step 4: reduced-motion 재확인**

macOS 시스템 설정 > 손쉬운 사용 > 디스플레이 > "동작 줄이기"를 켠 상태로 페이지를 새로고침한다. Expected: 모든 카드·섹션 제목이 사라진 채로 남지 않고 즉시 보임, 히어로 스탯이 최종 숫자로 바로 표시됨, 캔버스가 완성된 정적 프레임으로 그려짐.

- [ ] **Step 5: 개인정보 최종 grep**

```bash
cd /Users/tina/Project/jjssspark.github.io
grep -rn "010-" index.html assets/ 2>/dev/null || echo "전화번호 노출 없음"
```

Expected: `전화번호 노출 없음`.

- [ ] **Step 6: 커밋 (수정 사항이 있는 경우에만)**

```bash
git add -A
git commit -m "fix: 접근성 점검 결과 반영 (대비비/aria 보정)"
```

수정 사항이 없으면 이 스텝은 건너뛴다.

---

### Task 11: 최종 통합 검증

반응형·성능·콘솔 에러를 전 구간 확인하고, `feat/redesign` 브랜치에 최종 상태를 남긴다. **`main`으로 머지하지 않는다** — 사용자가 별도로 확인 후 merge 여부를 결정한다.

**Files:** 없음 (검증 전용 태스크)

- [ ] **Step 1: 반응형 확인**

```bash
cd /Users/tina/Project/jjssspark.github.io
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 1
echo "브라우저 DevTools 기기 툴바에서 320 / 375 / 768 / 1024 / 1440 / 1920px 각각 확인: 가로 스크롤(오버플로) 없는지, 프로젝트 그리드가 자연스럽게 열 수를 줄이는지, 히어로 텍스트가 잘리지 않는지"
kill $SERVER_PID
```

- [ ] **Step 2: 콘솔 에러 확인**

```bash
cd /Users/tina/Project/jjssspark.github.io
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 1
curl -s http://localhost:8000/ -o /dev/null -w "index.html: %{http_code}\n"
for f in assets/css/tokens.css assets/css/base.css assets/css/components.css assets/js/content.js assets/js/render.js assets/js/motion.js assets/js/interactions.js assets/js/viz/trajectory.js assets/js/viz/heatmap.js; do
  curl -s -o /dev/null -w "$f: %{http_code}\n" "http://localhost:8000/$f"
done
kill $SERVER_PID
```

Expected: 전부 `200`. 브라우저 DevTools Console 탭에서 404·JS 에러 없는지 육안 확인.

- [ ] **Step 3: 번들 크기 확인 (예산: JS < 80kb, CSS < 15kb gzip)**

```bash
cd /Users/tina/Project/jjssspark.github.io
cat assets/js/*.js assets/js/viz/*.js | gzip -c | wc -c
cat assets/css/*.css | gzip -c | wc -c
```

Expected: 첫 번째 값(JS gzip 바이트) < 81920, 두 번째 값(CSS gzip 바이트) < 15360.

- [ ] **Step 4: 성능 스팟 체크**

브라우저 DevTools Performance 탭으로 페이지를 스크롤하며 기록, 프레임 드랍(60fps 미만 구간)이 카드 hover·틸트 중 발생하지 않는지 확인한다.

- [ ] **Step 5: git 상태 확인 및 최종 커밋**

```bash
cd /Users/tina/Project/jjssspark.github.io
git status
git log --oneline feat/redesign -15
```

미커밋 변경이 있으면 검토 후 커밋한다. `main`으로의 머지·push는 이 계획의 범위 밖이다 — 사용자 확인 후 별도로 진행한다.

---

## 실행 후 향후 업데이트 메모

WorkFlow_AI가 완성되면 `assets/js/content.js`에서만 다음을 수정한다 (레이아웃·모션 코드는 건드리지 않는다):

- `workflow-ai` 프로젝트의 `status`를 `'in-play'` → `'shipped'`로 변경
- `summary`에 완성 기능·성과 지표 추가
- 필요 시 `links.demo` 추가
