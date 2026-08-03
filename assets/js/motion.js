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
