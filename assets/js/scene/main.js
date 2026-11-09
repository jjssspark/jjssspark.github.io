import { decideScene } from './fallback.js';

/**
 * 장면 진입점. 폴백이면 여기서 끝. 아니면 Three.js 모듈을 그때 불러온다 —
 * 폴백 경로가 three를 내려받지 않게.
 */
const { run } = decideScene();

/** 페이지 총 길이(화면 높이 배수). 각 구간 길이 = (to-from) × 이 값 */
const TOTAL_VH = 12;
/** 데스크톱에서 멈춰 있을 때 그레인 갱신 주기 (ms). 전체 프레임을 다시 그리므로 낮게 */
const IDLE_TICK = 125;

const sceneEls = [...document.querySelectorAll('[data-scene]')];

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
export const pOf = (y) => (maxScroll() > 0 ? Math.min(1, Math.max(0, y / maxScroll())) : 0);
export const yOf = (p) => p * maxScroll();

if (run) {
  const [
    { createStage },
    { SEGMENTS, cardProgress, sample },
    { onScrollFrame, scrollToY, refresh },
    { loadCritical },
    { runBoot },
    { trackBoard },
    { placeCards, clearCards, setupCardNav, projectCards },
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
  const CARD_P = cardProgress(projectCards.length);
  const canvas = document.getElementById('stage');
  const isTouch = window.matchMedia('(hover: none)').matches;

  // 에셋이 안 오거나 렌더러를 못 만들면 폴백으로. 부팅 화면이 떠 있었으면 치운다
  function bail() {
    document.documentElement.classList.add('no-scene');
    document.getElementById('boot')?.remove();
    document.body.style.overflow = '';
    for (const el of sceneEls) el.style.removeProperty('--scene-len');
    clearCards(projectCards);
    refresh();
  }
  let stage;
  try {
    const assets = await assetsReady;
    stage = createStage(canvas, { isTouch, assets });
  } catch {
    bail();
  }
  if (!stage) throw new Error('scene unavailable — fallback engaged');

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

  // 한 프레임 그리기 — 루프와 리사이즈가 같이 쓴다. setSize가 버퍼를 비우므로 리사이즈 직후 바로 그려야 빈 프레임이 없다
  function renderFrame(dt) {
    const state = sample(p, portrait, projectCards.length);
    stage.render(state, dt);
    placeCards(projectCards, state.cardT);
    // 전광판이 정면에 잡힌 뒤(점등 완료)에만 스택 글자, 연락처 구간엔 연락처
    boardTrackers[0]?.(p < 0.83 && state.boardOn >= 0.95 ? 1 : 0);
    boardTrackers[1]?.(p >= 0.9 ? state.boardOn : 0);
    syncCount();
  }

  const fit = () => {
    portrait = window.innerHeight > window.innerWidth;
    layoutSections();
    refresh();
    p = pOf(window.scrollY);
    stage.setSize(window.innerWidth, window.innerHeight);
    renderFrame(0);
    needsRender = false;
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(document.documentElement);

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
    ro.disconnect();
    stage.renderer.dispose();
    bail();
  });

  function loop(now) {
    if (!alive) return;
    const dt = (now - lastT) / 1000;
    const idleDue = !isTouch && now - lastIdle > IDLE_TICK;
    if (needsRender || idleDue) {
      renderFrame(dt);
      fps = fps * 0.9 + (1 / Math.max(dt, 1e-3)) * 0.1;
      needsRender = false;
      lastIdle = now;
    }
    lastT = now;
    requestAnimationFrame(loop);
  }
  await bootDone;
  requestAnimationFrame(loop);

  // 앵커 클릭의 관성 이동은 scroll-engine.js가 document 레벨에서 처리한다 (해시·포커스 유지)

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
