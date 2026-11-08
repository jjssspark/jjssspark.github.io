import { decideScene } from './fallback.js';

/**
 * 장면 진입점. 폴백이면 여기서 끝. 아니면 Three.js 모듈을 그때 불러온다 —
 * 폴백 경로가 three를 내려받지 않게.
 */
const { run } = decideScene();

/** 페이지 총 길이(화면 높이 배수). 각 구간 길이 = (to-from) × 이 값 */
const TOTAL_VH = 12;
/** 데스크톱에서 멈춰 있을 때 그레인만 갱신하는 주기 (ms) */
const IDLE_TICK = 83;

const sceneEls = [...document.querySelectorAll('[data-scene]')];

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
export const pOf = (y) => (maxScroll() > 0 ? Math.min(1, Math.max(0, y / maxScroll())) : 0);
export const yOf = (p) => p * maxScroll();

if (run) {
  const [{ createStage }, { SEGMENTS, sample }, { onScrollFrame, scrollToY, refresh }, { loadCritical }, { runBoot }] =
    await Promise.all([
      import('./stage.js'),
      import('./timeline.js'),
      import('../scroll-engine.js'),
      import('./assets.js'),
      import('../boot.js'),
    ]);

  // 부팅 화면 = 로더. 첫 묶음이 다 올 때까지 바가 차오른다
  let onProgress = () => {};
  // ?slowload=1 — 느린 회선 흉내. 부팅 바가 차오르는 걸 로컬에서 보려고 둔 디버그 전용 지연
  const slow = new URLSearchParams(location.search).get('slowload') === '1';
  const assetsReady = loadCritical((r) => (slow ? setTimeout(() => onProgress(r), 1800 * r) : onProgress(r)));
  const bootDone = runBoot((cb) => {
    onProgress = cb;
  });
  const assets = await assetsReady;

  const canvas = document.getElementById('stage');
  const isTouch = window.matchMedia('(hover: none)').matches;
  const stage = createStage(canvas, { isTouch, assets });

  function layoutSections() {
    for (const el of sceneEls) {
      const seg = SEGMENTS.find((s) => s.id === el.dataset.scene);
      if (seg) el.style.setProperty('--scene-len', String((seg.to - seg.from) * TOTAL_VH));
    }
  }

  let p = 0;
  let portrait = window.innerHeight > window.innerWidth;
  let needsRender = true;
  let lastIdle = 0;
  let lastT = performance.now();
  let fps = 60;

  layoutSections();
  p = pOf(window.scrollY);

  const fit = () => {
    portrait = window.innerHeight > window.innerWidth;
    layoutSections();
    refresh();
    stage.setSize(window.innerWidth, window.innerHeight);
    needsRender = true;
  };
  fit();
  new ResizeObserver(fit).observe(document.documentElement);

  onScrollFrame((y) => {
    const next = pOf(y);
    if (next !== p) {
      p = next;
      needsRender = true;
    }
  });

  function loop(now) {
    const dt = (now - lastT) / 1000;
    const idleDue = !isTouch && now - lastIdle > IDLE_TICK;
    if (needsRender || idleDue) {
      stage.render(sample(p, portrait), dt);
      fps = fps * 0.9 + (1 / Math.max(dt, 1e-3)) * 0.1;
      needsRender = false;
      lastIdle = now;
    }
    lastT = now;
    requestAnimationFrame(loop);
  }
  await bootDone;
  requestAnimationFrame(loop);

  // 앵커 이동은 네이티브 점프 대신 관성으로. 카메라가 순간이동하지 않게
  document.querySelector('header nav')?.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    scrollToY(target.offsetTop);
  });

  if (new URLSearchParams(location.search).get('debug') === '1') {
    const { mountDebug } = await import('./debug.js');
    mountDebug({
      getProgress: () => p,
      setProgress: (np) => {
        window.scrollTo(0, yOf(np));
        refresh();
      },
      getFps: () => fps,
    });
  }
}
