import { decideScene } from './fallback.js';

/**
 * 장면 진입점. 폴백이면 여기서 끝. 아니면 Three.js 모듈을 그때 불러온다 —
 * 폴백 경로가 three를 내려받지 않게.
 */
const { run } = decideScene();
if (run) {
  const canvas = document.getElementById('stage');
  const isTouch = window.matchMedia('(hover: none)').matches;
  const { createStage } = await import('./stage.js');
  const stage = createStage(canvas, { isTouch });

  // setSize는 canvas.width를 다시 써서 그림을 지운다. 크기를 맞췄으면 바로 다시 그린다
  const fit = () => {
    stage.setSize(window.innerWidth, window.innerHeight);
    stage.render(null, 0);
  };
  fit();
  new ResizeObserver(fit).observe(document.documentElement);

  if (new URLSearchParams(location.search).get('debug') === '1') {
    const { mountDebug } = await import('./debug.js');
    let fps = 0;
    mountDebug({ getProgress: () => 0, setProgress: () => {}, getFps: () => fps });
  }
}
