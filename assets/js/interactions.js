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
  const maxDeg = 10;
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
