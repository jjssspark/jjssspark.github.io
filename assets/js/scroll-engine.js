/**
 * 관성 스크롤 엔진 — 모든 스크롤 연동 모션의 단일 시계.
 *
 * 페이지 자체를 transform으로 밀어 관성을 내는 방식(Lenis류)은 쓰지 않는다.
 * 그렇게 하면 프로젝트 무대가 쓰는 `position: sticky`가 깨지고,
 * 모바일 주소창 높이 변화·네이티브 스크롤바·키보드 이동과도 어긋난다.
 *
 * 대신 스크롤은 브라우저에 그대로 맡기고, **애니메이션이 읽는 값만** 목표치를
 * 뒤늦게 따라오게(lerp) 만든다. 손끝의 반응은 네이티브 그대로 두면서
 * 화면 위 요소만 미끄러지듯 붙는다 — 체감상의 유동감은 대부분 여기서 나온다.
 *
 * 구독자가 여럿이어도 rAF 루프는 하나만 돈다. 예전에는 히어로 패럴랙스,
 * 필름 띠 구동, 원근 휨이 각자 루프를 돌려 프레임마다 세 번씩 깨어났다.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 낮을수록 더 늦게, 더 길게 따라온다. 0.085 = 약 0.2초 뒤에 목표에 안착 */
const EASE = 0.085;
/** 남은 거리가 이보다 좁아지면 도착으로 보고 루프를 끈다 (px) */
const SETTLE = 0.08;

/** @type {Set<(y: number, velocity: number) => void>} */
const subscribers = new Set();

let target = window.scrollY;
let smooth = window.scrollY;
let velocity = 0;
let running = false;

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
    // 남은 거리는 스크롤 속도에 비례한다. 별도 미분 없이 이 값을 속도 대용으로 쓴다
    velocity = diff;
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
  target = window.scrollY;
  smooth = target;
  velocity = 0;
  emit();
}

window.addEventListener(
  'scroll',
  () => {
    target = window.scrollY;
    // 모션을 끈 사용자에게는 보간 없이 곧바로 반영한다
    if (prefersReducedMotion) {
      smooth = target;
      velocity = 0;
      emit();
      return;
    }
    start();
  },
  { passive: true }
);

window.addEventListener('resize', refresh);
