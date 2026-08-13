/**
 * 전광판 점등 시퀀스.
 * - 세션당 1회만 보여준다 (새로고침·내부 이동마다 반복되면 방해가 된다)
 * - prefers-reduced-motion이면 아예 건너뛴다
 * - JS가 죽어도 화면을 가리지 않도록 마크업은 hidden으로 시작한다
 */
const boot = document.getElementById('boot');
if (boot) {
  const seen = sessionStorage.getItem('boot-seen');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (seen || reduced) {
    boot.remove();
  } else {
    boot.hidden = false;
    document.body.style.overflow = 'hidden';
    sessionStorage.setItem('boot-seen', '1');

    setTimeout(() => {
      boot.classList.add('is-done');
      document.body.style.overflow = '';
      setTimeout(() => boot.remove(), 550);
    }, 2100);
  }
}
