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
// 마스크 삽입은 리빌 관찰보다 먼저다 — 관찰을 먼저 걸면
// DOM을 갈아끼우는 사이에 이미 보이는 제목이 켜지지 않은 채 남는다
setupMaskedText('.hero-name');
setupMaskedText('.section-title');

setupReveal('.reveal');
setupReveal('[data-countup]', animateCountUp);

