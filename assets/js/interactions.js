/**
 * 스택 태그 → 같은 스택을 쓴 카드만 밝힌다. 숨기지 않는다 —
 * 카드는 궤적 위 자리가 정해져 있어 빼면 빈 자리가 생긴다.
 */
function setupStackHighlight() {
  const tagButtons = [...document.querySelectorAll('.tag')];
  const cards = [...document.querySelectorAll('.card')];
  const status = document.getElementById('filter-status');
  if (!tagButtons.length) return;

  /** @param {string|null} stack */
  function apply(stack) {
    let match = 0;
    for (const card of cards) {
      const has = (card.dataset.stackList || '').split(',').includes(stack);
      const dim = Boolean(stack) && !has;
      card.dataset.dim = dim ? 'true' : 'false';
      if (stack && has) match += 1;
    }
    for (const btn of tagButtons) {
      const on = Boolean(stack) && btn.dataset.stack === stack;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    }
    if (status) status.textContent = stack ? `${stack} 하이라이트 — ${match}개 프로젝트` : '';
  }

  for (const btn of tagButtons) {
    btn.addEventListener('click', () => apply(btn.classList.contains('is-active') ? null : btn.dataset.stack));
  }
}

setupStackHighlight();
