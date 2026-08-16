import { onScrollFrame } from './scroll-engine.js';

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
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    // expo out — 초반에 빠르게 튀어나오고 길게 잦아든다
    const eased = progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
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
    // 화면 아래 12% 지점에서 미리 깨운다. 요소가 완전히 올라온 뒤 시작하면
    // 사용자는 이미 그 자리를 보고 있어서 "늦게 켜진다"고 느낀다
    { threshold: 0, rootMargin: '0px 0px -12% 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/**
 * 제목을 마스크 뒤에서 밀어 올린다.
 *
 * 통으로 페이드하는 것보다 위계가 분명하다. 한글 제목은 두세 글자짜리가 많아
 * 글자 단위로 쪼개면 오히려 산만해지므로, 단어를 한 덩어리로 올리고
 * 단어마다 시차를 준다.
 *
 * @param {string} selector
 */
function setupMaskedText(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    if (el.querySelector('.mask')) return;
    const text = el.textContent.trim();
    if (!text) return;

    el.textContent = '';

    let index = 0;
    text.split(/(\s+)/).forEach((chunk) => {
      // 공백은 마스크로 감싸지 않는다 — 감싸면 줄바꿈 기회가 사라져 넘친다
      if (/^\s*$/.test(chunk)) {
        if (chunk) el.appendChild(document.createTextNode(' '));
        return;
      }
      const mask = document.createElement('span');
      mask.className = 'mask';
      const inner = document.createElement('span');
      inner.className = 'mask__inner';
      inner.style.setProperty('--delay', `${index * 90}ms`);
      inner.textContent = chunk;
      mask.appendChild(inner);
      el.appendChild(mask);
      index += 1;
    });
  });
}

/**
 * 히어로 배경에 깊이별 속도차를 준다.
 *
 * transform을 직접 대입하지 않고 `--py`만 넘긴다. 다이아몬드 SVG는
 * `translate(-50%, -50%)`로 중앙 정렬돼 있어서, transform을 통째로 덮으면
 * 화면 밖으로 튀어나간다. 합성은 CSS가 맡는다.
 */
function setupHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero || prefersReducedMotion) return;

  const layers = [
    { el: document.getElementById('hero-grid'), rate: 0.14 },
    { el: document.querySelector('.hero-diamond'), rate: 0.26 },
    { el: document.querySelector('.hero-inner'), rate: 0.07 },
  ].filter((layer) => layer.el);
  if (!layers.length) return;

  let visible = true;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible = entry.isIntersecting;
      });
    });
    observer.observe(hero);
  }

  onScrollFrame((y) => {
    if (!visible) return;
    layers.forEach(({ el, rate }) => {
      el.style.setProperty('--py', `${(y * rate).toFixed(2)}px`);
    });
  });
}

/**
 * 요소가 화면을 지나는 진행률을 매 프레임 --p(0~1)로 기록한다.
 *
 * 0 = 화면 아래 끝에 막 닿음, 0.5 = 화면 한가운데, 1 = 위로 완전히 빠져나감.
 *
 * 기존 리빌은 "한 번 켜지고 끝"이라 스크롤이 그냥 아래로 내려가는 느낌만 남았다.
 * 진행률을 계속 흘려보내면 요소가 화면에 머무는 내내 움직여서, 페이지 전체가
 * 하나의 흐름으로 읽힌다. 무엇을 어떻게 움직일지는 CSS가 정한다 —
 * 여기서는 값만 공급하고, 모션 종류를 늘려도 이 함수는 그대로다.
 *
 * transform이 아니라 translate/rotate/scale 개별 속성에 쓴다.
 * transform은 카드 hover 틸트(interactions.js)와 리빌이 이미 쓰고 있어서
 * 덮어쓰면 서로 잡아먹는다. 개별 속성은 transform보다 먼저 합성되어 충돌이 없다.
 */
function setupScrollProgress() {
  if (prefersReducedMotion) return;

  const targets = [
    ...document.querySelectorAll(
      '.about-card, .project-grid--featured .project-card, .principle-item, .skill-row'
    ),
  ];
  if (!targets.length || !('IntersectionObserver' in window)) return;

  // 화면 밖 요소까지 매 프레임 재면 레이아웃 계산이 헛돈다.
  // 실제로 보이는 것만 갱신 대상으로 남긴다
  const active = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) active.add(entry.target);
        else active.delete(entry.target);
      });
    },
    { rootMargin: '25% 0px 25% 0px' }
  );
  targets.forEach((el) => observer.observe(el));

  onScrollFrame(() => {
    const viewport = window.innerHeight;
    active.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const span = viewport + rect.height;
      const progress = Math.min(Math.max((viewport - rect.top) / span, 0), 1);
      el.style.setProperty('--p', progress.toFixed(4));
    });
  });
}

/**
 * 스크롤 속도를 전역 CSS 변수로 흘려보낸다.
 *
 * 빠르게 굴릴수록 요소가 살짝 눕는다. 값이 크면 멀미가 나므로 4도로 자른다.
 * 실제로 이 변수를 쓰는 곳은 필름 띠 칸(render.js)이다.
 */
function setupScrollVelocity() {
  if (prefersReducedMotion) return;
  const root = document.documentElement;

  onScrollFrame((_y, velocity) => {
    const skew = Math.max(-4, Math.min(4, velocity * 0.05));
    root.style.setProperty('--scroll-skew', `${skew.toFixed(2)}deg`);
  });
}

// 마스크 삽입은 리빌 관찰보다 먼저다 — 관찰을 먼저 걸면
// DOM을 갈아끼우는 사이에 이미 보이는 제목이 켜지지 않은 채 남는다
setupMaskedText('.hero-name');
setupMaskedText('.section-title');

setupReveal('.reveal');
setupReveal('.strike-grid__cell');
setupReveal('[data-countup]', animateCountUp);

setupHeroParallax();
setupScrollProgress();
setupScrollVelocity();
