import { Vector3 } from 'three';


/**
 * 진행도 p(0~1) 하나가 장면의 모든 상태를 정한다. 시간은 없다.
 * 되감기가 되려면 여기 있는 모든 것이 p의 순수 함수여야 한다.
 *
 * 월드 좌표: 홈플레이트가 원점, 외야가 -z, 위가 +y. 단위 m.
 */
export const SEGMENTS = [
  { id: 'hero', from: 0, to: 0.1 },
  { id: 'about', from: 0.1, to: 0.25 },
  { id: 'featured', from: 0.25, to: 0.4 },
  { id: 'impact', from: 0.4, to: 0.45 },
  { id: 'projects', from: 0.45, to: 0.7 },
  { id: 'stack', from: 0.7, to: 0.82 },
  { id: 'approach', from: 0.82, to: 0.92 },
  { id: 'contact', from: 0.92, to: 1 },
];

export const MOUND = new Vector3(0, 0.3, -18.4);
export const HOME = new Vector3(0, 0.9, 0);
export const FENCE_TOP = new Vector3(0, 3.5, -118);
export const BOARD = new Vector3(0, 12, -125);
/** 타구 착지점 — 전광판 뒤 어둠 속. 펜스(-120)·관중석(-123~-140)·전광판(-125, 높이 17)을 다 넘긴다 */
export const LANDING = new Vector3(2, 0.2, -170);
const HIT_APEX = 30;

/** 타구 궤적. t 0=임팩트, 1=착지. world.js의 트레일도 이 함수를 쓴다 */
export function hitPath(t) {
  const pos = HOME.clone().lerp(LANDING, t);
  pos.y = lerp(HOME.y, LANDING.y, t) + HIT_APEX * 4 * t * (1 - t);
  return pos;
}

/** 프로젝트 카드 8장이 카메라 정면을 지나는 진행도 */
export const CARD_P = Array.from({ length: 8 }, (_, i) => 0.45 + (0.25 * (i + 0.5)) / 8);

export function progressOf(segmentId, local) {
  const s = SEGMENTS.find((x) => x.id === segmentId);
  return s.from + (s.to - s.from) * local;
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const v = (x, y, z) => new Vector3(x, y, z);

/**
 * 카메라 키 포즈. 구간 안에서는 smoothstep으로 잇고, 비행 구간은 공을 따라간다.
 * (플랜은 CatmullRom을 말했지만 구간별 명시 보간이 되감기·튜닝 모두 단순하다 — 장부에 기록)
 */
const POSE = {
  heroA: { pos: v(26, 42, -150), target: v(0, 2, -10) },
  heroB: { pos: v(14, 30, -110), target: v(0, 1.5, -14) },
  dive: { pos: v(0.3, 0.46, -17.95), target: v(-0.16, 0.3, -18.4) },
  impact: { pos: v(2.4, 1.1, 1.2), target: HOME },
  watch: { pos: v(12, 3.5, -62), target: BOARD },
  board: { pos: v(0, 10, -92), target: BOARD },
  pullback: { pos: v(0, 16, -68), target: v(0, 7, -125) },
  contactA: { pos: v(0, 12, -95), target: BOARD },
  contactB: { pos: v(0, 12, -89), target: BOARD },
};

function ballAt(p) {
  if (p < 0.25) return MOUND.clone();
  if (p < 0.4) return MOUND.clone().lerp(HOME, smooth(0.25, 0.4, p));
  if (p < 0.45) {
    // 임팩트 직후 살짝 튕긴다
    const t = clamp01((p - 0.425) / 0.025);
    return HOME.clone().add(v(0, t * 0.6, -t * 1.5));
  }
  if (p < 0.7) return hitPath(smooth(0.45, 0.7, p));
  return LANDING.clone();
}

function pose(p, ball) {
  if (p < 0.1) {
    const t = smooth(0, 0.1, p);
    return { pos: POSE.heroA.pos.clone().lerp(POSE.heroB.pos, t), target: POSE.heroA.target.clone().lerp(POSE.heroB.target, t) };
  }
  if (p < 0.25) {
    // 급강하는 빨리 끝내고(0.10~0.145) 나머지는 공 앞에 머문다
    const t = smooth(0.1, 0.145, p);
    return { pos: POSE.heroB.pos.clone().lerp(POSE.dive.pos, t), target: POSE.heroB.target.clone().lerp(POSE.dive.target, t) };
  }
  if (p < 0.4) {
    // 공 바로 뒤에서 따라간다. 시작은 dive 포즈와 이어져야 한다
    const t = smooth(0.25, 0.29, p);
    const follow = ball.clone().add(v(0.35, 0.22, -1.1));
    return { pos: POSE.dive.pos.clone().lerp(follow, t), target: ball.clone().add(v(0, 0, 1.5)) };
  }
  if (p < 0.45) {
    const t = smooth(0.4, 0.415, p);
    const follow = ball.clone().add(v(0.35, 0.22, -1.1));
    return { pos: follow.lerp(POSE.impact.pos, t), target: ball.clone() };
  }
  if (p < 0.7) {
    const t = smooth(0.45, 0.48, p);
    const side = ball.clone().add(v(1.3, 0.35, 0.6));
    // 0.60부터는 공을 놓아주고 외야에 서서 공이 관중석·전광판을 넘어가는 걸 본다
    const watch = smooth(0.52, 0.62, p);
    const pos = POSE.impact.pos.clone().lerp(side, t).lerp(POSE.watch.pos, watch);
    // 지켜보는 동안은 공과 전광판 사이를 본다 — 둘 다 프레임에 들어오게
    const target = ball.clone().lerp(ball.clone().lerp(BOARD, 0.55), watch);
    return { pos, target };
  }
  if (p < 0.82) {
    // 공은 전광판 뒤로 사라졌다. 시선을 전광판으로 — HOME RUN 점등
    const t = smooth(0.7, 0.74, p);
    const from = ball.clone().lerp(BOARD, 0.55);
    return { pos: POSE.watch.pos.clone().lerp(POSE.board.pos, t), target: from.lerp(BOARD, t) };
  }
  if (p < 0.92) {
    const t = smooth(0.82, 0.92, p);
    return { pos: POSE.board.pos.clone().lerp(POSE.pullback.pos, t), target: POSE.board.target.clone().lerp(POSE.pullback.target, t) };
  }
  const t1 = smooth(0.92, 0.95, p);
  const t2 = smooth(0.95, 1, p);
  const pos = POSE.pullback.pos.clone().lerp(POSE.contactA.pos, t1).lerp(POSE.contactB.pos, t2);
  return { pos, target: POSE.pullback.target.clone().lerp(BOARD, t1) };
}

/**
 * @typedef {Object} SceneState
 * @property {Vector3} camPos
 * @property {Vector3} camTarget
 * @property {Vector3} ballPos
 * @property {number} ballSpin
 * @property {number} batT
 * @property {number[]} lights
 * @property {number} boardOn
 * @property {number} shake
 * @property {number} aberration
 * @property {number} darken
 * @property {number[]} cardT
 * @property {number} p
 */

/**
 * @param {number} p
 * @param {boolean} portrait
 * @returns {SceneState}
 */
export function sample(p, portrait) {
  p = clamp01(p);
  const ballPos = ballAt(p);
  const { pos, target } = pose(p, ballPos);
  if (portrait) pos.sub(target).multiplyScalar(1.35).add(target);

  const ballSpin = p < 0.25 ? 0 : p < 0.4 ? (40 * (p - 0.25)) / 0.15 : 40 + (p - 0.4) * 60;

  const batT = smooth(0.4, 0.425, p);
  const shake = Math.exp(-(((p - 0.425) / 0.008) ** 2));
  const flicker = p > 0.425 && p < 0.44 ? 0.4 + 0.6 * Math.abs(Math.sin(p * 900)) : 1;
  const lights = [0, 1, 2, 3].map((i) => flicker * (1 - smooth(0.82 + i * 0.02, 0.86 + i * 0.02, p)));
  const boardOn = p >= 0.92 ? 1 : smooth(0.7, 0.74, p);

  // 글이 지나가는 구간은 장면을 눌러 준다
  const darken =
    0.35 * (1 - smooth(0.08, 0.12, p)) +
    0.9 * smooth(0.1, 0.13, p) * (1 - smooth(0.23, 0.26, p)) +
    0.45 * smooth(0.25, 0.28, p) * (1 - smooth(0.39, 0.41, p)) +
    0.3 * smooth(0.45, 0.48, p) * (1 - smooth(0.69, 0.71, p)) +
    0.25 * smooth(0.7, 0.73, p) * (1 - smooth(0.81, 0.83, p)) +
    0.6 * smooth(0.82, 0.85, p) * (1 - smooth(0.91, 0.93, p)) +
    0.35 * smooth(0.92, 0.95, p);

  const cardT = CARD_P.map((cp) => Math.max(-1, Math.min(1, (p - cp) / 0.03)));

  return { p, camPos: pos, camTarget: target, ballPos, ballSpin, batT, lights, boardOn, shake, aberration: shake, darken, cardT };
}
