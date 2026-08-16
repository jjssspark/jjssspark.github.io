/**
 * 관성 스크롤 엔진 — 페이지 자체가 미끄러진다.
 *
 * 휠 이벤트를 가로채 목표 위치만 누적하고, 매 프레임 그 목표를 향해 보간한
 * 값으로 `window.scrollTo()`를 부른다. 즉 **네이티브 스크롤 위치 자체를**
 * 부드럽게 움직이는 방식이다.
 *
 * 흔히 쓰는 "래퍼를 transform으로 밀기"와는 다르다. 그 방식은 페이지를
 * 통째로 변형시켜서 `position: sticky`(프로젝트 무대)와 `position: fixed`
 * (헤더·스크롤 진행선)가 전부 깨진다. scrollTo 방식은 브라우저가 아는
 * 스크롤 위치를 그대로 쓰기 때문에 sticky·fixed가 온전하다.
 *
 * 가로채지 않는 경우:
 * - 터치 기기 — 이미 네이티브 관성이 좋고, 가로채면 오히려 뻑뻑해진다
 * - prefers-reduced-motion
 * - 모달(dialog)이 열려 있을 때 — 그 안의 스크롤을 방해하면 안 된다
 * - Ctrl/Cmd + 휠 — 브라우저 확대 제스처다
 *
 * 키보드·스크롤바 드래그·앵커 이동은 네이티브 그대로 두고, 엔진이 쉬는 동안
 * 위치가 어긋나면 다시 맞춘다.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 낮을수록 더 길게 미끄러진다 */
const EASE = 0.1;
/** 남은 거리가 이보다 좁아지면 도착으로 보고 루프를 끈다 (px) */
const SETTLE = 0.15;
/** 휠 한 번의 이동량 배수. 1보다 키우면 적은 손짓으로 더 간다 */
const WHEEL_GAIN = 1;

/**
 * 휠을 가로채 페이지를 직접 굴릴지 여부.
 * 마우스·트랙패드가 있는 환경에서만 켠다.
 */
export const ownsWheel =
  !prefersReducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** @type {Set<(y: number, velocity: number) => void>} */
const subscribers = new Set();

let target = window.scrollY;
let smooth = window.scrollY;
let velocity = 0;
let running = false;

function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function emit() {
  subscribers.forEach((fn) => fn(smooth, velocity));
}

function frame() {
  const diff = target - smooth;
  const settled = Math.abs(diff) < SETTLE;

  if (settled) {
    smooth = target;
    velocity = 0;
  } else {
    smooth += diff * EASE;
    // 남은 거리는 스크롤 속도에 비례한다. 별도 미분 없이 속도 대용으로 쓴다
    velocity = diff;
  }

  if (ownsWheel) {
    // behavior를 명시하지 않으면 html의 scroll-behavior:smooth를 타서
    // 브라우저 보간이 우리 보간 위에 겹친다 — 두 번 미끄러져 늘어진다
    window.scrollTo({ top: smooth, behavior: 'auto' });
  }

  emit();

  if (settled) {
    running = false;
    return;
  }
  requestAnimationFrame(frame);
}

function start() {
  if (running) return;
  running = true;
  requestAnimationFrame(frame);
}

/** deltaMode를 픽셀로 통일한다. 줄 단위·페이지 단위로 오는 환경이 있다 */
function pixelDelta(event) {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

if (ownsWheel) {
  // CSS의 scroll-behavior:smooth를 끈다.
  // 켜져 있으면 우리가 매 프레임 부르는 scrollTo 위에 브라우저 보간이 한 겹 더
  // 얹혀서, 목표에 닿기 전에 다음 프레임이 또 목표를 옮긴다 — 화면이 거의 안 움직인다.
  // 보간은 이 엔진이 전담한다. 앵커 이동은 아래에서 따로 받아 관성으로 처리한다.
  document.documentElement.style.scrollBehavior = 'auto';

  // 같은 문서 안 앵커(#about 등)는 기본 점프를 막고 엔진에 태운다
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const dest = document.getElementById(id);
    if (!dest) return;
    event.preventDefault();
    scrollToY(window.scrollY + dest.getBoundingClientRect().top);
    // 주소창과 포커스는 브라우저 기본 동작에 맡길 수 없으므로 직접 맞춘다
    history.pushState(null, '', `#${id}`);
    dest.setAttribute('tabindex', '-1');
    dest.focus({ preventScroll: true });
  });

  window.addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey || event.metaKey) return; // 확대 제스처
      if (document.querySelector('dialog[open]')) return; // 모달 내부 스크롤 존중

      event.preventDefault();
      target = clamp(target + pixelDelta(event) * WHEEL_GAIN, 0, maxScroll());
      start();
    },
    { passive: false }
  );
}

window.addEventListener(
  'scroll',
  () => {
    // 우리가 굴리는 중이면 우리가 쓴 값이 맞다
    if (running) return;

    const y = window.scrollY;
    if (Math.abs(y - smooth) < 1) return;

    if (ownsWheel) {
      // 키보드·스크롤바·앵커 이동 등 엔진 밖에서 옮긴 위치. 그대로 인정한다
      target = y;
      smooth = y;
      velocity = 0;
      emit();
      return;
    }

    // 휠을 가로채지 않는 환경(터치·모션 최소화)에서는 페이지는 네이티브로 움직이고
    // 애니메이션 값만 뒤따라온다
    target = y;
    if (prefersReducedMotion) {
      smooth = y;
      velocity = 0;
      emit();
      return;
    }
    start();
  },
  { passive: true }
);

/**
 * 매 프레임 호출될 콜백을 등록한다. 등록 즉시 1회 동기 호출한다 —
 * rAF는 백그라운드 탭에서 돌지 않아, 첫 배치를 rAF에 맡기면 영영 안 걸린다.
 *
 * @param {(y: number, velocity: number) => void} fn
 * @returns {() => void} 구독 해제
 */
export function onScrollFrame(fn) {
  subscribers.add(fn);
  fn(smooth, velocity);
  return () => subscribers.delete(fn);
}

/** 레이아웃이 바뀌어 보간 중간값이 의미를 잃었을 때 현재 위치로 즉시 맞춘다 */
export function refresh() {
  target = clamp(window.scrollY, 0, maxScroll());
  smooth = target;
  velocity = 0;
  emit();
}

/**
 * 페이지를 특정 위치로 관성을 태워 보낸다. 버튼처럼 "여기로 가라"가 필요한 곳용.
 * @param {number} y
 */
export function scrollToY(y) {
  if (!ownsWheel) {
    window.scrollTo({ top: y, behavior: 'smooth' });
    return;
  }
  target = clamp(y, 0, maxScroll());
  start();
}

window.addEventListener('resize', refresh);
