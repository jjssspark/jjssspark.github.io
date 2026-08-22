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
/** 기울기 때문에 카드 모서리가 화면에서 움직여도 되는 최대 거리(px) */
const MAX_EDGE_SHIFT = 8;

/**
 * @param {HTMLElement} card
 */
function setupTilt(card) {
  // 10도는 카드가 통째로 흔들려 텍스트를 읽기 어렵다. 깊이만 암시하는 정도로 낮춘다
  const maxDeg = 3;

  // 기울인 뒤의 박스를 다시 재면 회전한 만큼 넓어진 값이 나온다. 그 값으로 다음
  // 기울기를 계산하면 또 박스가 달라져서, 커서를 가만히 둬도 카드가 떤다.
  // 들어올 때 한 번 잰 박스를 그 호버 동안 계속 쓴다
  let rect = null;
  let deg = maxDeg;

  const measure = () => {
    rect = card.getBoundingClientRect();
    // 카드가 길수록 같은 각도라도 아래 모서리가 크게 움직인다. 727px 카드에서
    // 3도면 20px 가까이 밀리는데, 그러면 아래 링크가 커서를 피해 다닌다.
    // 모서리 이동 거리를 기준으로 각도를 거꾸로 잡는다
    const half = rect.height / 2;
    deg = half > 0 ? Math.min(maxDeg, (Math.asin(Math.min(1, MAX_EDGE_SHIFT / half)) * 180) / Math.PI) : maxDeg;
  };

  card.addEventListener('mouseenter', measure);
  card.addEventListener('mousemove', (event) => {
    if (!rect) measure();
    // 링크 줄 위에서는 기울기를 더 건드리지 않는다. 겨냥하는 그 순간에
    // 링크가 조금이라도 움직이면 빗나간다
    if (event.target.closest?.('.project-foot')) return;
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateX(${(-py * deg).toFixed(2)}deg) rotateY(${(px * deg).toFixed(2)}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    rect = null;
    card.style.transform = '';
  });
}

/**
 * @param {HTMLElement} btn
 */
function setupMagnetic(btn) {
  const pull = 14;
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
  const filterStatus = document.getElementById('filter-status');
  if (!tagButtons.length) return;

  /**
   * @param {string|null} stack
   */
  function applyFilter(stack) {
    let matchCount = 0;
    cards.forEach((card) => {
      const cardStack = (card.dataset.stackList || '').split(',');
      const isDimmed = Boolean(stack) && !cardStack.includes(stack);
      card.classList.toggle('is-dimmed', isDimmed);
      if (stack && !isDimmed) matchCount += 1;
    });
    tagButtons.forEach((btn) => {
      const isActiveForThisBtn = Boolean(stack) && btn.dataset.stack === stack;
      btn.classList.toggle('is-active', isActiveForThisBtn);
      btn.setAttribute('aria-pressed', String(isActiveForThisBtn));
    });
    if (filterStatus) {
      filterStatus.textContent = stack ? `${stack} 필터 적용됨 — ${matchCount}개 프로젝트` : '';
    }
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
