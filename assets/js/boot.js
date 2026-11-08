/**
 * 전광판 점등 화면 = 진짜 로더.
 * - 진행 바는 실제 에셋 로딩 비율을 그린다
 * - 첫 묶음이 400ms 안에 끝나면(캐시) 아예 띄우지 않는다
 * - 폴백(html.no-scene)에서는 main.js가 부르지 않는다
 * - JS가 죽어도 화면을 가리지 않도록 마크업은 hidden으로 시작한다
 */
const QUICK_MS = 400;
const DONE_HOLD_MS = 300;
const FADE_MS = 550;

/**
 * @param {(cb: (ratio: number) => void) => void} progress$ 진행도 콜백을 받아가는 함수
 * @returns {Promise<void>} 바가 끝까지 차고 화면이 사라지면 resolve
 */
export function runBoot(progress$) {
  const boot = document.getElementById('boot');
  if (!boot) return Promise.resolve();
  const fill = boot.querySelector('.boot__fill');
  const t0 = performance.now();
  let shown = false;
  let ratio = 0;

  const show = () => {
    if (shown) return;
    shown = true;
    boot.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const draw = (r) => {
    if (!fill) return;
    fill.style.animation = 'none';
    fill.style.transformOrigin = 'left';
    fill.style.transform = `scaleX(${r})`;
  };

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (!shown) {
        boot.remove();
        resolve();
        return;
      }
      draw(1);
      setTimeout(() => {
        boot.classList.add('is-done');
        document.body.style.overflow = '';
        setTimeout(() => {
          boot.remove();
          resolve();
        }, FADE_MS);
      }, DONE_HOLD_MS);
    };

    // 빠르면 안 보여준다. 400ms 지나도 안 끝났을 때만 등장
    const slowTimer = setTimeout(() => {
      show();
      draw(ratio);
    }, QUICK_MS);

    progress$((r) => {
      ratio = r;
      if (shown) draw(r);
      if (r >= 1) {
        clearTimeout(slowTimer);
        if (performance.now() - t0 < QUICK_MS && !shown) finish();
        else {
          show();
          finish();
        }
      }
    });
  });
}
