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
  const [
    { createStage },
    { SEGMENTS, CARD_P, sample },
    { onScrollFrame, scrollToY, refresh },
    { loadCritical },
    { runBoot },
    { trackBoard },
    { placeCards, setupCardNav, projectCards },
  ] = await Promise.all([
    import('./stage.js'),
    import('./timeline.js'),
    import('../scroll-engine.js'),
    import('./assets.js'),
    import('../boot.js'),
    import('./overlay.js'),
    import('../render.js'),
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

  // 전광판 오버레이 두 개(스택·연락처)를 전광판 메시에 붙인다
  const boardTrackers = ['board-stack', 'board-contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .map((el) => trackBoard(stage.world.board, stage.camera, el));

  // 카드 화살표: 가장 가까운 카드 진행도의 앞뒤로 페이지를 보낸다
  const currentCard = () => {
    let best = 0;
    CARD_P.forEach((cp, i) => {
      if (Math.abs(cp - p) < Math.abs(CARD_P[best] - p)) best = i;
    });
    return best;
  };
  const syncCount = setupCardNav({ count: CARD_P.length, current: currentCard, goTo: (i) => scrollToY(yOf(CARD_P[i])) });

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

  // WebGL 컨텍스트를 잃으면 검은 canvas로 남기지 말고 폴백으로 전환
  let alive = true;
  const unsubscribe = onScrollFrame((y) => {
    const next = pOf(y);
    if (next !== p) {
      p = next;
      needsRender = true;
    }
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    alive = false;
    unsubscribe();
    stage.renderer.dispose();
    document.documentElement.classList.add('no-scene');
    for (const el of sceneEls) el.style.removeProperty('--scene-len');
    refresh();
  });

  function loop(now) {
    if (!alive) return;
    const dt = (now - lastT) / 1000;
    const idleDue = !isTouch && now - lastIdle > IDLE_TICK;
    if (needsRender || idleDue) {
      const state = sample(p, portrait);
      stage.render(state, dt);
      if (needsRender) {
        placeCards(projectCards, state.cardT);
        // 스택 구간엔 스택 판만, 연락처 구간엔 연락처 판만
        boardTrackers[0]?.(p < 0.83 ? state.boardOn : 0);
        boardTrackers[1]?.(p >= 0.9 ? state.boardOn : 0);
        syncCount();
      }
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
