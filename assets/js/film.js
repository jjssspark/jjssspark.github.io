import { onScrollFrame } from './scroll-engine.js';

/**
 * 한 컷짜리 야구 장면. 페이지 전체가 이 한 컷 안에서 흘러간다.
 *
 * 이전 구조는 장면과 본문이 번갈아 핀으로 붙었다 떨어졌다. 장면마다 카메라가
 * 처음부터 다시 시작하고 본문 구간에는 카메라가 아예 없어서, 한 편의 영화가
 * 아니라 예고편 사이에 브로슈어가 끼어 있는 꼴이었다.
 *
 * 여기서는 무대가 하나다. 화면에 고정된 판 위에 투수·타자·트로피가 **동시에**
 * 서 있고, 카메라 하나가 스크롤을 따라 그 사이를 옮겨 다닌다. 컷이 없으니
 * 갈아타는 순간도 없다. 본문은 그 위를 지나간다.
 *
 * 좌표는 전부 **월드 단위**다. 1 = 화면 높이. 바닥이 y=0이고 위가 음수라
 * 사람 키가 곧 화면 높이 비율이 된다. 화면 좌표는 카메라를 통과할 때만 만든다.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TAU = Math.PI * 2;

const SHEETS = {
  pitch: { src: 'assets/img/pitch-dots-100x106.png', gw: 100, gh: 106, cols: 7, frames: 35 },
  bat: { src: 'assets/img/bat-dots-62x110.png', gw: 62, gh: 110, cols: 8, frames: 48 },
};

/** 트로피 격자. 도트로 읽히려면 이 정도는 돼야 한다 */
const TROPHY = { gw: 46, gh: 56 };

/**
 * 무대 위 배우들. x는 월드 가로 위치, h는 키(화면 높이 대비).
 *
 * `beats`는 이야기 시간 s에서 그 배우의 동작이 얼마나 진행됐는지(u, 0~1)다.
 * 등속으로 물리면 슬라이드쇼가 된다 — 실제 투구는 와인드업이 느리고 릴리스가
 * 폭발적이고, 스윙은 로드가 느리고 임팩트가 빠르고 팔로스루가 감속한다.
 * 구간 사이 간격이 좁을수록 그 대목에서 프레임이 빨리 넘어간다.
 *
 * `drift`는 프레임과 별개로 계속 흐르는 몸의 이동이다. 한 프레임을 물고 있는
 * 동안 화면이 완전히 멈추면 그림이 굳은 것처럼 보인다.
 */
const ACTORS = [
  {
    sheet: 'pitch',
    x: 0,
    h: 0.96,
    beats: [
      { s: 0, u: 0 },
      { s: 0.045, u: 0.2 },
      { s: 0.075, u: 0.42 },
      { s: 0.095, u: 0.56 },
      { s: 0.11, u: 0.72 },
      { s: 0.135, u: 1 },
    ],
    // 던지면서 몸이 홈플레이트 쪽으로 실린다
    drift: [
      { s: 0, x: -0.02, y: 0 },
      { s: 0.095, x: 0.01, y: -0.005 },
      { s: 0.135, x: 0.075, y: 0.012 },
    ],
  },
  {
    sheet: 'bat',
    x: 2.62,
    h: 1,
    beats: [
      { s: 0.16, u: 0 },
      { s: 0.27, u: 0.18 },
      { s: 0.318, u: 0.34 },
      // 시트의 절반이 배트에 맞는 순간이다. 이 값이 어긋나면 공이 허공에서 튄다
      { s: 0.345, u: 0.5 },
      { s: 0.375, u: 0.72 },
      { s: 0.44, u: 1 },
    ],
    // 뒷발에 실었다가 앞으로 넘긴다
    drift: [
      { s: 0.16, x: 0.02, y: 0 },
      { s: 0.318, x: -0.012, y: 0.004 },
      { s: 0.44, x: 0.05, y: 0 },
    ],
  },
  {
    sheet: 'trophy',
    x: 6.4,
    h: 0.86,
    beats: [
      { s: 0.9, u: 0 },
      { s: 1, u: 1 },
    ],
  },
];

/**
 * 카메라 경로. 이 배열이 곧 이 페이지의 시나리오다.
 *
 * z는 배율이다. 1이면 키 1인 배우가 화면 높이를 꽉 채운다. 값이 끊기지 않게
 * 이어져야 컷이 안 생긴다 — 구간 사이를 부드럽게 잇는 건 alongKeys가 한다.
 */
const CAMERA = [
  { s: 0, x: 0.02, y: -0.45, z: 1.02 },
  { s: 0.16, x: 0.24, y: -0.46, z: 1.14 },
  { s: 0.3, x: 2.3, y: -0.5, z: 1.2 },
  { s: 0.345, x: 2.66, y: -0.58, z: 2.15 },
  { s: 0.42, x: 3.15, y: -0.78, z: 1.15 },
  { s: 0.52, x: 3.9, y: -1.05, z: 0.66 },
  { s: 0.64, x: 4.7, y: -0.95, z: 0.6 },
  { s: 0.8, x: 5.6, y: -0.62, z: 0.78 },
  { s: 1, x: 6.42, y: -0.48, z: 1.12 },
];

/**
 * 본문 어디에서 이야기가 어디까지 가 있어야 하는지.
 *
 * 스크롤 픽셀을 바로 이야기 시간으로 쓰면 섹션 길이가 바뀔 때마다 타이밍이
 * 어긋난다. 섹션 위치에 못을 박아두면 본문이 길어지든 짧아지든 "대표 프로젝트가
 * 올라올 때 배트에 맞는다"가 유지된다.
 */
const ANCHORS = [
  // 영화는 소개부터 시작한다. 히어로는 표지지 장면이 아니다 —
  // 첫 화면부터 투수가 서 있으면 인트로가 두 겹이 된다
  ['#about', 0],
  ['#featured', 0.345],
  ['#projects', 0.46],
  ['#skills', 0.64],
  ['#principles', 0.8],
  ['#contact', 1],
];

/** 공 지름(월드). 실제 야구공 7.3cm를 키 1.9m로 나눈 값이다 */
const BALL_D = 0.038;

/** 관중석 — 월드 가로 구간과 높이 */
const CROWD = { x0: -1.4, x1: 8.2, y: -1.62, count: 150 };

/** 이야기 구간 — 릴리스, 임팩트, 타구가 끝나는 지점 */
const RELEASE = 0.11;
const CONTACT = 0.345;
const LANDING = 0.62;

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(x, a, b) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** 키프레임 사이를 부드럽게 잇는다 */
function alongKeys(keys, s, field) {
  if (s <= keys[0].s) return keys[0][field];
  for (let i = 1; i < keys.length; i += 1) {
    if (s > keys[i].s) continue;
    const a = keys[i - 1];
    const b = keys[i];
    return a[field] + (b[field] - a[field]) * smoothstep(s, a.s, b.s);
  }
  return keys[keys.length - 1][field];
}

/**
 * 밝기 배열을 켜진 도트 목록으로 줄인다.
 *
 * 격자를 통째로 매 프레임 훑으면 만 칸 넘게 검사한다. 실제로 켜지는 건
 * 2~3할뿐이라 좌표만 뽑아둔다.
 */
function litList(sample, gw, gh) {
  const pos = [];
  for (let i = 0; i < gw * gh; i += 1) {
    if (sample(i) >= 40) pos.push(i);
  }
  return Uint16Array.from(pos);
}

/**
 * 한 프레임에서 가장 앞으로 나온 점. 투수는 공을 쥔 손, 타자는 배트 끝이다.
 *
 * `zone`으로 훑을 세로 구간을 좁힌다. 타자의 팔로스루는 뒷다리가 배트보다
 * 오른쪽에 있어서, 그냥 최대 x를 잡으면 공이 몸 뒤에서 나온다.
 */
function frontPoint(pos, gw, gh, zone) {
  const y0 = zone ? zone[0] * gh : 0;
  const y1 = zone ? zone[1] * gh : gh;
  let best = -1;
  let cell = -1;
  for (let k = 0; k < pos.length; k += 1) {
    const x = pos[k] % gw;
    if (x <= best) continue;
    const y = (pos[k] - x) / gw;
    if (y < y0 || y > y1) continue;
    best = x;
    cell = pos[k];
  }
  if (cell < 0) return frontPoint(pos, gw, gh);
  const x = cell % gw;
  return { gx: x, gy: (cell - x) / gw };
}

/** @type {Map<string, Promise<Uint16Array[]>>} */
const sheetCache = new Map();

function loadSheet(key) {
  if (sheetCache.has(key)) return sheetCache.get(key);
  const spec = SHEETS[key];
  const job = new Promise((resolve, reject) => {
    // decode()는 백그라운드 탭에서 영영 안 끝난다. load 이벤트는 정상적으로 온다
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`시트를 못 읽었다: ${spec.src}`));
    el.src = spec.src;
  }).then((img) => {
    const off = document.createElement('canvas');
    off.width = img.width;
    off.height = img.height;
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.drawImage(img, 0, 0);
    const data = octx.getImageData(0, 0, img.width, img.height).data;

    const out = [];
    for (let f = 0; f < spec.frames; f += 1) {
      const cx = (f % spec.cols) * spec.gw;
      const cy = Math.floor(f / spec.cols) * spec.gh;
      out.push(
        litList(
          (i) => {
            const x = i % spec.gw;
            const y = (i - x) / spec.gw;
            return data[((cy + y) * img.width + cx + x) * 4];
          },
          spec.gw,
          spec.gh
        )
      );
    }
    return out;
  });
  sheetCache.set(key, job);
  return job;
}

/**
 * 트로피를 격자에 그린다. 원본 영상이 없으니 도형으로 만든다.
 * 격자 크기 그대로의 캔버스에 그리면 한 픽셀이 도트 한 알이 되어,
 * 시트에서 온 프레임과 같은 방식으로 찍힌다.
 */
function makeTrophy() {
  const { gw: W, gh: H } = TROPHY;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff';
  g.strokeStyle = '#fff';
  g.lineCap = 'round';

  // 손잡이 — 컵보다 먼저 그려서 컵이 이음매를 덮게 한다
  g.lineWidth = W * 0.075;
  [0.28, 0.72].forEach((hx, i) => {
    g.beginPath();
    g.arc(W * hx, H * 0.24, W * 0.15, TAU * (i ? 0.75 : 0.25), TAU * (i ? 0.25 : 0.75));
    g.stroke();
  });

  // 컵
  g.beginPath();
  g.moveTo(W * 0.2, H * 0.1);
  g.lineTo(W * 0.8, H * 0.1);
  g.lineTo(W * 0.66, H * 0.46);
  g.lineTo(W * 0.34, H * 0.46);
  g.closePath();
  g.fill();

  // 기둥과 받침
  g.fillRect(W * 0.45, H * 0.46, W * 0.1, H * 0.28);
  g.fillRect(W * 0.32, H * 0.74, W * 0.36, H * 0.08);
  g.fillRect(W * 0.22, H * 0.84, W * 0.56, H * 0.13);

  const data = g.getImageData(0, 0, W, H).data;
  return [litList((i) => data[i * 4 + 3], W, H)];
}

/* ────────────────────────────────────────────────────────────────
   무대
   ──────────────────────────────────────────────────────────────── */

const root = document.querySelector('.film');
const canvas = root && root.querySelector('.film__stage');
const ball = root && root.querySelector('.film__ball');

if (root && canvas) {
  const ctx = canvas.getContext('2d');

  /** @type {{frames: Uint16Array[], grid: {gw: number, gh: number}}[]} */
  let cast = [];
  let W = 0;
  let H = 0;
  let dpr = 1;
  /** 도트 한 알을 미리 그려둔다. 매 프레임 arc를 수천 번 부르면 못 버틴다 */
  const lamp = document.createElement('canvas');
  let lampHalf = 0;
  let lampPitch = 0;

  /** 관중 도트는 자리가 안 변한다. 흔들림만 매 프레임 더한다 */
  const crowd = Array.from({ length: CROWD.count }, (_, i) => {
    const u = i / (CROWD.count - 1);
    return {
      x: CROWD.x0 + (CROWD.x1 - CROWD.x0) * u,
      // 줄이 자로 잰 듯 곧으면 관중이 아니라 눈금이다
      y: CROWD.y + Math.sin(i * 12.9898) * 0.035,
      phase: (i % 17) / 17,
    };
  });

  function buildLamp(pitch) {
    if (Math.abs(pitch - lampPitch) < 0.01) return;
    lampPitch = pitch;
    const r = Math.max(0.6, pitch * 0.46);
    const size = Math.max(2, Math.ceil(r * 3.4));
    lamp.width = size;
    lamp.height = size;
    const g = lamp.getContext('2d');
    const on = getComputedStyle(canvas).getPropertyValue('--lamp').trim() || '#c0392b';
    g.fillStyle = on;
    g.globalAlpha = 0.12;
    g.beginPath();
    g.arc(size / 2, size / 2, r * 1.3, 0, TAU);
    g.fill();
    g.globalAlpha = 1;
    g.beginPath();
    g.arc(size / 2, size / 2, r, 0, TAU);
    g.fill();
    lampHalf = size / 2;
  }

  function measure() {
    W = root.clientWidth;
    H = root.clientHeight;
    dpr = Math.min(1.75, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    lampPitch = 0;
  }

  /* ── 이야기 시간 ───────────────────────────────────────────── */

  /** @type {{top: number, s: number}[]} */
  let marks = [];

  function remark() {
    marks = ANCHORS.map(([sel, s]) => {
      const el = document.querySelector(sel);
      return { top: el ? el.getBoundingClientRect().top + window.scrollY : 0, s };
    }).sort((a, b) => a.top - b.top);
  }

  /** 스크롤 위치를 이야기 시간 0~1로 옮긴다 */
  function storyTime(y) {
    if (marks.length < 2) return 0;
    if (y <= marks[0].top) return marks[0].s;
    for (let i = 1; i < marks.length; i += 1) {
      if (y > marks[i].top) continue;
      const a = marks[i - 1];
      const b = marks[i];
      const u = (y - a.top) / Math.max(1, b.top - a.top);
      return a.s + (b.s - a.s) * u;
    }
    return 1;
  }

  /* ── 카메라 ────────────────────────────────────────────────── */

  const cam = { x: 0, y: 0, z: 1 };

  function toScreen(wx, wy) {
    return {
      x: (wx - cam.x) * cam.z * H + W * 0.5,
      y: (wy - cam.y) * cam.z * H + H * 0.55,
    };
  }

  /* ── 공 ────────────────────────────────────────────────────── */

  /** 배우 한 명의 특징점을 월드 좌표로 푼다 */
  function actorPoint(index, atStory, frameAt, zone) {
    const actor = cast[index];
    if (!actor || !actor.frames.length) return { x: 0, y: -0.5 };
    const spec = ACTORS[index];
    const f = actor.frames[Math.min(actor.frames.length - 1, Math.round(frameAt * (actor.frames.length - 1)))];
    const { gx, gy } = frontPoint(f, actor.grid.gw, actor.grid.gh, zone);
    const scale = spec.h / actor.grid.gh;
    // 몸이 실려 나간 만큼 손끝도 같이 간다. 안 더하면 공이 허공에서 출발한다
    const dx = spec.drift ? alongKeys(spec.drift, atStory, 'x') : 0;
    const dy = spec.drift ? alongKeys(spec.drift, atStory, 'y') : 0;
    return {
      x: spec.x + dx + (gx - actor.grid.gw / 2) * scale,
      y: -spec.h + dy + gy * scale,
    };
  }

  /**
   * 공의 월드 위치.
   *
   * 두 구간이 이어져 있다. 손을 떠나 배트까지는 거의 곧게 가고, 맞은 뒤로는
   * 중력이 붙은 진짜 포물선이다. 임팩트 직전·직후를 느리게 흘리는 건
   * 이징이 아니라 카메라 배율이 맡는다 — 공이 커지면 저절로 느려 보인다.
   */
  function ballAt(s) {
    // 손을 떠나는 순간·배트에 맞는 순간의 자세로 고정해서 잡는다.
    // 지금 프레임으로 잡으면 팔로스루를 따라 시작점이 뒤로 밀린다
    const release = actorPoint(0, RELEASE, 0.72, [0, 0.5]);
    const contact = actorPoint(1, CONTACT, 0.5, [0, 0.45]);

    if (s < RELEASE) return { p: release, shown: 0 };

    if (s < CONTACT) {
      const u = clamp01((s - RELEASE) / (CONTACT - RELEASE));
      // 투구는 살짝 가라앉는다. 완전한 직선이면 미끄러지는 것으로 보인다
      const drop = Math.sin(Math.PI * u) * 0.05;
      return {
        p: {
          x: release.x + (contact.x - release.x) * u,
          y: release.y + (contact.y - release.y) * u + drop,
        },
        shown: 1,
      };
    }

    const u = clamp01((s - CONTACT) / (LANDING - CONTACT));
    // 발사각과 초속에서 궤적을 만든다. 끝점을 정해두고 그 사이를 잇는 것보다
    // 중력을 직접 먹이는 쪽이 타구답게 휜다
    const vx = 6.6;
    const vy = -5.4;
    const g = 6.2;
    const t = u * 1.15;
    return {
      p: { x: contact.x + vx * t, y: contact.y + vy * t + 0.5 * g * t * t },
      shown: 1 - clamp01((u - 0.82) / 0.18),
    };
  }

  /* ── 그리기 ────────────────────────────────────────────────── */

  /** 도트 한 벌을 찍는다 */
  function stamp(pos, gw, ox, oy, pitch, alpha) {
    ctx.globalAlpha = alpha;
    for (let k = 0; k < pos.length; k += 1) {
      const x = pos[k] % gw;
      const y = (pos[k] - x) / gw;
      ctx.drawImage(lamp, ox + (x + 0.5) * pitch - lampHalf, oy + (y + 0.5) * pitch - lampHalf);
    }
    ctx.globalAlpha = 1;
  }

  function drawActor(index, s) {
    const actor = cast[index];
    if (!actor || !actor.frames.length) return;
    const spec = ACTORS[index];
    const n = actor.frames.length;
    const u = clamp01(alongKeys(spec.beats, s, 'u'));

    const { gw, gh } = actor.grid;
    const pitch = (spec.h / gh) * cam.z * H;
    if (pitch < 0.35) return;
    buildLamp(pitch);

    const dx = spec.drift ? alongKeys(spec.drift, s, 'x') : 0;
    const dy = spec.drift ? alongKeys(spec.drift, s, 'y') : 0;
    const origin = toScreen(spec.x + dx - (gw / 2) * (spec.h / gh), -spec.h + dy);
    // 화면 밖 배우는 통째로 건너뛴다. 한 명이 수천 알이라 헛도는 비용이 크다
    if (origin.x > W + pitch * gw || origin.x + pitch * gw < 0) return;

    // 프레임 사이를 겹쳐 찍는다. 딱 끊어 바꾸면 슬라이드쇼가 되는데, 두 장을
    // 나눠 얹으면 어긋난 부분만 옅게 남아 잔상처럼 읽힌다. 도트가 작을 때는
    // 어차피 계단이 안 보이므로 한 장만 찍어 값을 아낀다
    const pos = u * (n - 1);
    const i0 = Math.floor(pos);
    const f = pos - i0;
    if (pitch < 1.2 || f < 0.08 || i0 >= n - 1) {
      stamp(actor.frames[Math.min(n - 1, Math.round(pos))], gw, origin.x, origin.y, pitch, 1);
      return;
    }
    stamp(actor.frames[i0], gw, origin.x, origin.y, pitch, 1 - f * 0.8);
    stamp(actor.frames[i0 + 1], gw, origin.x, origin.y, pitch, 0.2 + f * 0.8);
  }

  function drawCrowd(s) {
    // 홈런이 뜬 뒤부터 일어선다
    const heat = smoothstep(s, 0.38, 0.56) * (1 - smoothstep(s, 0.92, 1));
    const r = Math.max(0.8, 0.007 * cam.z * H);
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--lamp').trim() || '#c0392b';
    for (let i = 0; i < crowd.length; i += 1) {
      const c = crowd[i];
      // 한 줄이 통째로 뛰면 파도가 아니라 깜빡임이다. 옆으로 번지게 늦춘다
      const wave = Math.sin((s * 26 - c.x * 1.4 + c.phase) * TAU);
      const lift = heat * Math.max(0, wave) * 0.045;
      const p = toScreen(c.x, c.y - lift);
      if (p.x < -8 || p.x > W + 8) continue;
      ctx.globalAlpha = 0.18 + heat * Math.max(0, wave) * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * 잔상. 지나온 길 **전부**가 아니라 방금 지나온 만큼만 그린다.
   *
   * 전체를 그리면 확대 구간에서 화면을 가로지르는 거대한 덩어리가 된다.
   * 실제로 눈에 남는 건 셔터가 열려 있던 짧은 동안이고, 그 길이가 일정해야
   * 빠를수록 길게 늘어지는 인상이 생긴다.
   */
  function drawTrail(s) {
    if (s < RELEASE) return;
    const span = s < CONTACT ? RELEASE : CONTACT;
    const from = Math.max(span, s - (s < CONTACT ? 0.028 : 0.05));
    if (s - from < 0.0005) return;
    const steps = 20;
    // 잔상이 공보다 굵으면 공이 아니라 붓자국이다
    const head = Math.min(BALL_D * cam.z * H * 0.42, H * 0.05);

    const pts = [];
    for (let i = 0; i <= steps; i += 1) {
      const t = from + ((s - from) * i) / steps;
      const spot = ballAt(t).p;
      pts.push(toScreen(spot.x, spot.y));
    }
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--lamp').trim() || '#c0392b';
    ctx.lineCap = 'round';
    for (const pass of [0, 1]) {
      for (let i = 1; i <= steps; i += 1) {
        const fade = (i / steps) ** 2;
        ctx.globalAlpha = pass ? 0.06 + fade * 0.16 : 0.12 + fade * 0.62;
        ctx.lineWidth = head * (pass ? 1.1 + fade * 1.2 : 0.3 + fade * 0.75);
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(y) {
    // 소개가 화면에 들어오기 직전부터 판이 밝아진다. 스크롤에 묶어야
    // 되감을 때도 같은 자리에서 꺼진다 — 시간 기반이면 어긋난다
    const start = marks.length ? marks[0].top : 0;
    const on = smoothstep(y, start - H * 0.85, start - H * 0.2);
    root.style.setProperty('--on', on.toFixed(3));
    if (on <= 0.001) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (ball) ball.style.setProperty('--bo', '0');
      return;
    }

    const s = clamp01(storyTime(y));
    // 본문이 이 값을 보고 자기 차례를 안다. 릴리스에 소개가 뜨고 임팩트에
    // 프로젝트가 뜨는 건 스크롤 위치가 아니라 동작이 정하는 일이다
    document.documentElement.style.setProperty('--story', s.toFixed(4));

    cam.x = alongKeys(CAMERA, s, 'x');
    cam.y = alongKeys(CAMERA, s, 'y');
    cam.z = alongKeys(CAMERA, s, 'z');

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    drawCrowd(s);
    for (let i = 0; i < ACTORS.length; i += 1) drawActor(i, s);
    drawTrail(s);

    if (ball) {
      const { p, shown } = ballAt(s);
      const spot = toScreen(p.x, p.y);
      // 크기를 손으로 정하지 않는다. 월드에서 온 지름에 배율만 곱하면
      // 카메라가 다가갈 때 저절로 커진다 — 그게 임팩트의 슬로우모션이다
      ball.style.setProperty('--bd', `${(BALL_D * cam.z * H).toFixed(1)}px`);
      ball.style.setProperty('--bx', `${spot.x.toFixed(1)}px`);
      ball.style.setProperty('--by', `${spot.y.toFixed(1)}px`);
      // 회전은 진행 방향과 물려야 한다. 날아간 거리로 돌린다
      ball.style.setProperty('--brot', `${((p.x - 0.2) * 640).toFixed(0)}deg`);
      ball.style.setProperty('--bo', shown.toFixed(3));
    }
  }

  Promise.all(
    ACTORS.map((a) =>
      a.sheet === 'trophy'
        ? Promise.resolve({ frames: makeTrophy(), grid: TROPHY })
        : loadSheet(a.sheet).then((frames) => ({ frames, grid: SHEETS[a.sheet] }))
    )
  )
    .then((loaded) => {
      cast = loaded;
      measure();
      remark();
      root.classList.add('is-ready');
      frame(window.scrollY);
      if (prefersReducedMotion) return;
      onScrollFrame(frame);
      window.addEventListener('resize', () => {
        measure();
        remark();
        frame(window.scrollY);
      });
    })
    .catch((error) => {
      // 조용히 삼키지 않는다 — 시트 경로가 어긋났을 때 원인이 안 보인다
      console.error('[film] 무대를 못 만들었다', error);
      root.hidden = true;
    });
}
