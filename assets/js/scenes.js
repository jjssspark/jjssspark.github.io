import { onScrollFrame } from './scroll-engine.js';
import { principles, profile, projects, skills } from './content.js';

/**
 * 야구 장면 — 스크롤 한 동작이 페이지 전체를 굴린다.
 *
 * 장면은 섹션의 제목을 대신한다. 공이 지나가며 글자를 놓고, 그 글자가 그대로
 * 아래 본문으로 이어진다. 그래서 장면에는 라벨도 번호도 없다 — 붙이는 순간
 * 페이지가 마디로 끊긴다(레퍼런스 shader.se가 정확히 그걸 안 한다).
 *
 * 장면마다 **자기 무대**를 갖는다. 진행률이 장면 안에서 0~1이라 전역 지도를
 * 나눠 쓸 필요가 없고, 순서를 바꾸거나 하나를 빼도 나머지가 안 흔들린다.
 *
 * 실루엣은 실제 영상에서 뽑았다. 프레임을 이미지 여러 장으로 두는 대신 한 장의
 * 회색조 시트에 격자로 담아 한 번만 픽셀로 풀고, 그 뒤로는 도트만 다시 찍는다.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SHEETS = {
  pitch: { src: 'assets/img/pitch-dots-100x106.png', gw: 100, gh: 106, cols: 7, frames: 35 },
  bat: { src: 'assets/img/bat-dots-62x110.png', gw: 62, gh: 110, cols: 8, frames: 48 },
};

/** 트로피 격자. 도트로 읽히려면 이 정도는 돼야 한다 */
const TROPHY = { gw: 46, gh: 56 };

/** 줌 기준점. CSS의 transform-origin과 같은 값이어야 한다 */
const ORIGIN_Y = 0.58;

const CROWD_DOTS = 96;
const TAU = Math.PI * 2;

/** 화면 밖. 공이 프레임을 벗어나는 자리 (틀 높이 대비 비율) */
const OFF = {
  right: { x: 0.62, y: -0.2 },
  far: { x: 0.78, y: -0.55 },
};

/**
 * 장면 하나하나의 사양.
 *
 * `frames`는 시트에서 쓸 구간이다. 스윙과 홈런이 같은 시트를 앞뒤로 나눠 쓴다.
 * `ball`은 그 장면 안에서의 진행률(0~1)로 적는다.
 */
const SCENES = {
  lead: {
    board: 'pitch',
    frames: [0, 1],
    camera: [
      { p: 0, z: 0.92, x: -17 },
      { p: 0.55, z: 1.0, x: -20 },
      { p: 1, z: 1.1, x: -24 },
    ],
    ball: { from: 0.5, to: 1, a: { anchor: 'front', at: 0.5 }, b: OFF.right, fade: 'hold' },
    scale: [1.15, 0.82],
    text: () => [profile.role, ...profile.tagline.split(', ')],
  },
  swing: {
    board: 'bat',
    frames: [0, 0.5],
    camera: [
      { p: 0, z: 1.0, x: -13 },
      { p: 0.7, z: 1.12, x: -15 },
      { p: 1, z: 1.24, x: -17 },
    ],
    ball: {
      from: 0,
      to: 1,
      a: OFF.right,
      b: { anchor: 'front', at: 1, zone: [0, 0.45] },
      fade: 'in',
    },
    scale: [0.5, 2.4],
    text: () => [
      { k: 'PROJECTS', v: projects.length },
      ...projects.filter((p) => p.tier === 'featured').map((p) => p.name),
    ],
  },
  gone: {
    board: 'bat',
    frames: [0.5, 1],
    camera: [
      { p: 0, z: 1.22, x: -17 },
      { p: 0.18, z: 0.86, x: -12 },
      { p: 1, z: 0.96, x: -10 },
    ],
    ball: {
      from: 0,
      to: 0.8,
      a: { anchor: 'front', at: 0, zone: [0, 0.45] },
      b: OFF.far,
      fade: 'out',
      ease: 'accel',
    },
    /** 배트에 맞는 순간이 제일 크다. 멀어지며 빠르게 줄어든다 */
    scale: [2.8, 0.4],
    text: () => skills.map((g) => ({ k: g.group, v: g.items.length })),
    cheer: [0.3, 1],
  },
  roar: {
    board: 'bat',
    frames: [0.86, 1],
    camera: [
      { p: 0, z: 1.0, x: -13 },
      { p: 1, z: 1.16, x: -16 },
    ],
    text: () => principles.map((p) => p.title),
    cheer: [0, 1],
    /** 공이 없는 장면은 글자를 제자리에서 띄운다 */
    fall: true,
  },
  trophy: {
    board: 'trophy',
    frames: [0, 1],
    camera: [
      { p: 0, z: 0.92, x: -11 },
      { p: 1, z: 1.24, x: -14 },
    ],
    text: () => ['GITHUB · jjssspark', `EMAIL · ${profile.links.email}`, 'NOTION · 프로젝트 문서'],
    cheer: [0, 0.4],
    fall: true,
  },
};

/**
 * @param {number} x
 * @param {number} a
 * @param {number} b
 */
function smoothstep(x, a, b) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * 키프레임 사이를 부드럽게 잇는다.
 *
 * @param {{p: number}[]} keys
 * @param {number} p
 * @param {string} field
 */
function alongKeys(keys, p, field) {
  if (p <= keys[0].p) return keys[0][field];
  for (let i = 1; i < keys.length; i += 1) {
    if (p > keys[i].p) continue;
    const a = keys[i - 1];
    const b = keys[i];
    return a[field] + (b[field] - a[field]) * smoothstep(p, a.p, b.p);
  }
  return keys[keys.length - 1][field];
}

/**
 * 밝기 배열을 **켜진 도트 목록**으로 줄인다.
 *
 * 격자를 통째로 들고 매 프레임 전부 훑으면 만 칸 넘게 검사한다. 실제로 켜지는
 * 건 2~3할뿐이라 좌표와 밝기만 뽑아둔다.
 *
 * @param {(index: number) => number} sample
 * @param {number} gw
 * @param {number} gh
 */
function litList(sample, gw, gh) {
  const pos = [];
  const val = [];
  for (let i = 0; i < gw * gh; i += 1) {
    const v = sample(i);
    if (v < 40) continue;
    pos.push(i);
    val.push(v);
  }
  return { pos: Uint16Array.from(pos), val: Uint8Array.from(val) };
}

/**
 * 한 프레임에서 가장 앞으로 나온 점. 투수는 공을 쥔 손, 타자는 배트 끝이다.
 *
 * `zone`으로 훑을 세로 구간을 좁힐 수 있다. 타자의 팔로스루 프레임은 뒷다리가
 * 배트 끝보다 오른쪽에 있어서, 그냥 최대 x를 잡으면 공이 몸 뒤에서 나온다.
 *
 * @param {{pos: Uint16Array}} frame
 * @param {number} gw
 * @param {number} gh
 * @param {[number, number]} [zone] 격자 세로 비율 구간
 */
function frontPoint(frame, gw, gh, zone) {
  const y0 = zone ? zone[0] * gh : 0;
  const y1 = zone ? zone[1] * gh : gh;
  let best = -1;
  let cell = -1;
  for (let k = 0; k < frame.pos.length; k += 1) {
    const x = frame.pos[k] % gw;
    if (x <= best) continue;
    const y = (frame.pos[k] - x) / gw;
    if (y < y0 || y > y1) continue;
    best = x;
    cell = frame.pos[k];
  }
  // 구간 안이 비면 규칙을 좁힌 쪽이 틀린 것이다. 조용히 0,0을 주면
  // 공이 화면 구석에서 튀어나와 원인을 못 찾는다
  if (cell < 0) return frontPoint(frame, gw, gh);
  const x = cell % gw;
  return { cx: x, cy: (cell - x) / gw };
}

/** @type {Map<string, Promise<{pos: Uint16Array, val: Uint8Array}[]>>} */
const sheetCache = new Map();

/**
 * 시트 한 장을 프레임별 도트 목록으로 쪼갠다. 여러 장면이 같은 시트를 나눠 쓰므로
 * 한 번만 읽는다.
 *
 * @param {string} key
 */
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
 * 트로피를 격자에 그린다.
 *
 * 원본 영상이 없으니 도형으로 만든다. 격자 크기 그대로의 캔버스에 그리면 한
 * 픽셀이 도트 한 알이 되어, 시트에서 온 프레임과 같은 방식으로 찍힌다.
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
  g.beginPath();
  g.arc(W * 0.28, H * 0.24, W * 0.15, TAU * 0.25, TAU * 0.75);
  g.stroke();
  g.beginPath();
  g.arc(W * 0.72, H * 0.24, W * 0.15, TAU * 0.75, TAU * 0.25);
  g.stroke();

  // 컵 — 위는 넓고 아래로 좁아지다 둥글게 닫힌다
  g.beginPath();
  g.moveTo(W * 0.2, H * 0.11);
  g.lineTo(W * 0.8, H * 0.11);
  g.lineTo(W * 0.68, H * 0.42);
  g.quadraticCurveTo(W * 0.5, H * 0.62, W * 0.32, H * 0.42);
  g.closePath();
  g.fill();

  // 기둥과 받침 두 단. 이차곡선의 실제 최저점은 제어점의 절반쯤이라,
  // 기둥을 컵 바닥보다 위에서 시작해야 사이가 안 뜬다
  g.fillRect(W * 0.44, H * 0.48, W * 0.12, H * 0.24);
  g.fillRect(W * 0.3, H * 0.72, W * 0.4, H * 0.07);
  g.fillRect(W * 0.2, H * 0.81, W * 0.6, H * 0.1);

  const data = g.getImageData(0, 0, W, H).data;
  return [litList((i) => data[i * 4 + 3], W, H)];
}

/**
 * 도트 판 하나. 프레임을 받아 캔버스에 찍는다.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{gw: number, gh: number}} grid
 */
function createBoard(canvas, grid) {
  const ctx = canvas.getContext('2d');
  const { gw: GW, gh: GH } = grid;

  /** @type {{pos: Uint16Array, val: Uint8Array}[]} */
  let frames = [];
  const lamp = document.createElement('canvas');
  let lampHalf = 0;
  let cssPitch = 0;
  let cur = -1;

  function build() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssHeight = canvas.clientHeight || 480;
    const cssWidth = Math.round((cssHeight * GW) / GH);
    canvas.style.width = `${cssWidth}px`;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    const pitch = canvas.width / GW;
    cssPitch = cssWidth / GW;
    const r = pitch * 0.46;
    const cs = getComputedStyle(canvas);
    const on = cs.getPropertyValue('--lamp').trim() || '#c0392b';

    const size = Math.max(2, Math.ceil(r * 3.6));
    lamp.width = size;
    lamp.height = size;
    lampHalf = size / 2;
    const lctx = lamp.getContext('2d');
    lctx.fillStyle = on;
    // 번짐은 전구 한 알 크기를 넘지 않게. 넓게 퍼뜨리면 도형 위에 안개가 낀다
    lctx.globalAlpha = 0.1;
    lctx.beginPath();
    lctx.arc(lampHalf, lampHalf, r * 1.25, 0, TAU);
    lctx.fill();
    lctx.globalAlpha = 1;
    lctx.beginPath();
    lctx.arc(lampHalf, lampHalf, r, 0, TAU);
    lctx.fill();
    lctx.globalAlpha = 0.55;
    lctx.beginPath();
    lctx.arc(lampHalf, lampHalf, r * 0.5, 0, TAU);
    lctx.fill();

    cur = -1;
  }

  /** @param {number} index */
  function paint(index) {
    if (!frames.length || index === cur) return;
    cur = index;
    const { pos, val } = frames[index];
    const pitch = canvas.width / GW;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let k = 0; k < pos.length; k += 1) {
      const cell = pos[k];
      const x = cell % GW;
      const y = (cell - x) / GW;
      ctx.globalAlpha = val[k] / 255;
      ctx.drawImage(lamp, (x + 0.5) * pitch - lampHalf, (y + 0.5) * pitch - lampHalf);
    }
    ctx.globalAlpha = 1;
  }

  return {
    grid,
    /** 꺼진 도트를 같은 간격으로 깔려면 패널이 이 값을 알아야 한다 */
    get pitch() {
      return cssPitch;
    },
    setFrames(list) {
      frames = list;
      build();
    },
    resize: build,
    /** @param {number} t 0~1 */
    seek(t) {
      if (!frames.length) return;
      const clamped = Math.min(1, Math.max(0, t));
      paint(Math.min(frames.length - 1, Math.floor(clamped * frames.length)));
    },
    /** @param {number} t 0~1 지점의 프레임 */
    frameAt(t) {
      if (!frames.length) return null;
      const clamped = Math.min(1, Math.max(0, t));
      return frames[Math.min(frames.length - 1, Math.floor(clamped * frames.length))];
    },
  };
}

/**
 * 장면 하나를 살린다.
 *
 * @param {HTMLElement} root `.scene`
 */
function createScene(root) {
  const spec = SCENES[root.dataset.scene];
  if (!spec) return null;

  const stage = root.querySelector('.pin-stage');
  const frame = root.querySelector('.scene__frame');
  const panel = root.querySelector('.scene__panel');
  const canvas = root.querySelector('.scene__board');
  const arc = root.querySelector('.scene__arc');
  const trail = root.querySelector('.scene__trail');
  const ball = root.querySelector('.scene__ball');
  const crowd = root.querySelector('.scene__crowd');
  if (!stage || !frame || !canvas) return null;

  if (crowd) {
    crowd.innerHTML = Array.from(
      { length: CROWD_DOTS },
      (_, i) => `<span style="--i:${i}"></span>`
    ).join('');
  }

  root.classList.toggle('is-fall', !!spec.fall);

  const lines = spec.text();
  if (trail) {
    trail.innerHTML = lines
      .map((line, i) => {
        const body =
          typeof line === 'string' ? line : `${line.k}<em>${line.v}</em>`;
        return `<span style="--i:${i}">${body}</span>`;
      })
      .join('');
  }
  const chips = trail ? [...trail.children] : [];

  const grid = spec.board === 'trophy' ? TROPHY : SHEETS[spec.board];
  const board = createBoard(canvas, grid);
  const actx = arc ? arc.getContext('2d') : null;

  let frameW = 0;
  let frameH = 0;
  /** 패널 중심이 틀 중심에서 얼마나 떨어져 있나. 공·궤적은 틀 기준이고
      실루엣은 패널 안에 있어서, 이 차이를 안 더하면 공이 엉뚱한 데서 나온다 */
  let panelDx = 0;
  let panelDy = 0;
  let panelH = 0;
  let pinned = false;
  /** 무대가 화면 밖으로 나가 끝값에 고정된 상태 */
  let idle = false;
  /** @type {number[]} */
  let chipFs = [];
  /** @type {number[]} */
  const chipW = [];

  function measure() {
    frameW = frame.clientWidth;
    frameH = frame.clientHeight;
    if (panel) {
      const fr = frame.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      panelDx = pr.left + pr.width / 2 - (fr.left + fr.width / 2);
      panelDy = pr.top + pr.height / 2 - (fr.top + fr.height / 2);
      panelH = pr.height;
    }
    if (arc) {
      // 획 하나뿐이라 2배 해상도가 필요 없다. 매 프레임 지우는 픽셀이 곧 비용이다
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      arc.width = Math.round(frameW * dpr);
      arc.height = Math.round(frameH * dpr);
    }
    const sticky = stage.firstElementChild;
    pinned = !!sticky && getComputedStyle(sticky).position === 'sticky';
    root.classList.toggle('is-static', !pinned);
    board.resize();
    // 꺼진 도트를 캔버스와 같은 간격으로 화면 전체에 깐다
    if (panel) panel.style.setProperty('--dot', `${board.pitch.toFixed(3)}px`);
    layoutChips();
  }

  /**
   * 격자 칸을 화면 좌표로 옮긴다. 카메라 줌·이동을 그대로 먹인다 —
   * 안 그러면 줌할 때마다 공이 손에서 떨어진다.
   */
  function toScreen(cell, cam, panPct) {
    const h = panelH || frameH;
    const boardW = (h * grid.gw) / grid.gh;
    const x0 = ((cell.cx + 0.5) / grid.gw) * boardW - boardW / 2;
    const y0 = ((cell.cy + 0.5) / grid.gh) * h - h / 2;
    const originY = (ORIGIN_Y - 0.5) * h;
    return {
      x: panelDx + x0 * cam + (panPct / 100) * h,
      y: panelDy + originY + (y0 - originY) * cam,
    };
  }

  /** 궤적 끝점 하나를 px로 푼다 */
  function resolve(point, cam, panPct) {
    if (point.anchor === 'front') {
      const f = board.frameAt(point.at);
      if (!f) return { x: 0, y: 0 };
      return toScreen(frontPoint(f, grid.gw, grid.gh, point.zone), cam, panPct);
    }
    return { x: point.x * frameW, y: point.y * frameH };
  }

  /** 구간 위 t 지점 */
  function at(t, cam, panPct) {
    const a = resolve(spec.ball.a, cam, panPct);
    const b = resolve(spec.ball.b, cam, panPct);
    const e = spec.ball.ease === 'accel' ? t * t * t : t;
    // 살짝 띄워 포물선으로 만든다. 직선이면 그냥 미끄러지는 것으로 보인다
    const lift = Math.sin(Math.PI * e) * frameH * 0.1;
    return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e - lift };
  }

  /**
   * 궤적을 공이 간 만큼만 그린다.
   *
   * 균일한 점선은 "선을 하나 그었다"로 끝난다. 머리로 갈수록 굵고 밝게,
   * 꼬리로 갈수록 가늘고 투명하게 — 그래야 지나간 흔적으로 읽힌다.
   */
  function drawArc(t, cam, panPct) {
    if (!actx) return;
    const dpr = arc.width / Math.max(frameW, 1);
    actx.setTransform(dpr, 0, 0, dpr, (frameW / 2) * dpr, (frameH / 2) * dpr);
    actx.clearRect(-frameW, -frameH, frameW * 2, frameH * 2);
    if (t <= 0) return;

    const lamp = getComputedStyle(arc).getPropertyValue('--lamp').trim() || '#c0392b';
    const head = Math.max(2, frameH * 0.006);
    const steps = 40;
    actx.lineCap = 'round';
    actx.strokeStyle = lamp;

    // 좌표를 한 번만 풀어 두 번 쓴다. 넓고 옅은 획이 번짐, 좁고 진한 획이 심지다.
    // canvas의 shadowBlur는 획마다 화면 밖 버퍼를 새로 만들어서 못 쓴다
    const pts = [];
    for (let i = 0; i <= steps; i += 1) pts.push(at((i / steps) * t, cam, panPct));

    for (const pass of [0, 1]) {
      for (let i = 1; i <= steps; i += 1) {
        // 꼬리는 지수로 죽인다. 선형이면 시작점까지 또렷해 잔상이 안 생긴다
        const fade = (i / steps) ** 2;
        actx.globalAlpha = pass ? 0.12 + fade * 0.5 : 0.15 + fade * 0.8;
        actx.lineWidth = head * (pass ? 1.2 + fade * 3.2 : 0.25 + fade * 0.9);
        actx.beginPath();
        actx.moveTo(pts[i - 1].x, pts[i - 1].y);
        actx.lineTo(pts[i].x, pts[i].y);
        actx.stroke();
      }
    }
    actx.globalAlpha = 1;
  }

  /**
   * 글자의 크기와 자리를 정한다.
   *
   * 오른쪽 끝을 맞춘다. 한글은 줄마다 길이가 들쭉날쭉해서 왼쪽을 맞추면
   * 오른쪽이 너덜너덜해지고, 폭이 바뀔 때마다 어떤 줄은 계단으로 어떤 줄은
   * 정렬로 나와 화면 크기마다 다른 디자인이 된다. 실루엣이 왼쪽에 있으니
   * 오른쪽 정렬이 여백을 가운데로 모아 구도도 안정된다. 계단감은 자리가
   * 아니라 줄마다 다른 크기가 만든다.
   *
   * 자리가 카메라와 무관하므로 스크롤마다 다시 잴 이유가 없다. 크기가
   * 바뀔 때만 부른다 — offsetWidth를 매 프레임 읽으면 스크롤이 끊긴다.
   */
  function layoutChips() {
    if (!chips.length) return;
    const n = chips.length;
    const base = Math.min(frameH * 0.075, frameW * 0.045);
    const right = frameW * 0.46;
    const left = -frameW * 0.48;

    chipFs = chips.map((chip, i) => {
      let fs = base * Math.max(0.55, 1 - i * 0.14);
      chip.style.setProperty('--fs', `${fs.toFixed(1)}px`);
      // 넘친 채로 두면 오른쪽이 잘려 문장이 끊긴다
      const wide = chip.offsetWidth;
      if (wide > right - left) {
        fs *= (right - left) / wide;
        chip.style.setProperty('--fs', `${fs.toFixed(1)}px`);
      }
      chipW[i] = chip.offsetWidth;
      return fs;
    });

    // 줄 간격은 앞줄 크기를 누적해서 쌓는다. i * fs로 잡으면 뒤로 갈수록
    // 글자가 작아지는 만큼 간격도 같이 줄어 마지막 줄들이 서로 붙는다
    const gaps = [0];
    for (let i = 1; i < n; i += 1) gaps[i] = gaps[i - 1] + chipFs[i - 1] * 1.35;
    // 줄이 많으면 화면 아래로 밀려 마지막 줄이 잘린다. 블록 전체를 끌어올린다
    const blockH = gaps[n - 1] + chipFs[n - 1];
    const top = Math.min(
      spec.ball ? frameH * 0.07 : -blockH / 2,
      frameH * 0.45 - blockH
    );

    chips.forEach((chip, i) => {
      chip.style.setProperty('--tx', `${Math.max(left, right - chipW[i]).toFixed(1)}px`);
      chip.style.setProperty('--ty', `${(top + gaps[i]).toFixed(1)}px`);
    });
  }

  function apply(y) {
    // 무대가 화면에서 완전히 벗어나면 계산할 게 없다. 벗어나는 순간 한 번만
    // 끝값으로 맞춰두고 그 뒤로는 건너뛴다
    const box = stage.getBoundingClientRect();
    const away = box.bottom < -200 || box.top > window.innerHeight + 200;
    if (away && idle) return;
    idle = away;

    const travel = stage.offsetHeight - window.innerHeight;
    if (!pinned || travel <= 0) {
      board.seek(0.6);
      chips.forEach((c) => c.classList.add('is-on'));
      canvas.style.removeProperty('--cam');
      canvas.style.removeProperty('--pan');
      if (ball) ball.style.setProperty('--bo', '0');
      if (actx) actx.clearRect(0, 0, arc.width, arc.height);
      return;
    }
    const top = window.scrollY + box.top;
    const p = Math.min(1, Math.max(0, (y - top) / travel));

    const cam = alongKeys(spec.camera, p, 'z');
    const panPct = alongKeys(spec.camera, p, 'x');
    canvas.style.setProperty('--cam', cam.toFixed(4));
    canvas.style.setProperty('--pan', `${((panPct / 100) * (panelH || frameH)).toFixed(1)}px`);

    const [f0, f1] = spec.frames;
    board.seek(p);

    if (spec.ball && ball) {
      const { from, to, fade } = spec.ball;
      const inside = p >= from && p <= to;
      const t = Math.min(1, Math.max(0, (p - from) / (to - from)));
      const spot = at(t, cam, panPct);
      ball.style.setProperty('--bx', `${spot.x.toFixed(1)}px`);
      ball.style.setProperty('--by', `${spot.y.toFixed(1)}px`);
      ball.style.setProperty('--brot', `${(p * 1600).toFixed(0)}deg`);
      const [s0, s1] = spec.scale || [1, 1];
      ball.style.setProperty('--bs', (s0 + (s1 - s0) * t).toFixed(3));
      const alpha = !inside ? 0 : fade === 'in' ? t : fade === 'out' ? 1 - t * t : 1;
      ball.style.setProperty('--bo', alpha.toFixed(3));
      drawArc(inside ? t : p > to ? 1 : 0, cam, panPct);
    }

    chips.forEach((chip, i) => {
      const slot = i / chips.length;
      const lit = spec.ball
        ? p >= spec.ball.from + slot * (spec.ball.to - spec.ball.from)
        : p > slot * 0.7;
      // 공이 그 줄을 지나는 순간 켜진다
      chip.classList.toggle('is-on', lit);
    });

    if (crowd && spec.cheer) {
      crowd.classList.toggle('is-cheering', p >= spec.cheer[0] && p <= spec.cheer[1]);
    }
  }

  const ready =
    spec.board === 'trophy'
      ? Promise.resolve(makeTrophy())
      : loadSheet(spec.board).then((all) => {
          const [f0, f1] = spec.frames;
          return all.slice(Math.floor(f0 * all.length), Math.max(1, Math.ceil(f1 * all.length)));
        });

  return ready.then((list) => {
    board.setFrames(list);
    measure();
    root.classList.add('is-ready');
    return { apply, measure };
  });
}

const roots = [...document.querySelectorAll('.scene')];
if (roots.length) {
  Promise.all(roots.map(createScene).filter(Boolean))
    .then((scenes) => {
      const live = scenes.filter(Boolean);
      if (!live.length) return;
      if (prefersReducedMotion) {
        live.forEach((s) => s.apply(window.scrollY));
        return;
      }
      const relayout = () => {
        live.forEach((s) => s.measure());
        live.forEach((s) => s.apply(window.scrollY));
      };
      onScrollFrame((y) => live.forEach((s) => s.apply(y)));
      window.addEventListener('resize', relayout);
      // 오른쪽 정렬이라 글자 폭이 곧 자리다. 웹폰트가 늦게 오면 폴백 폭으로
      // 잡은 자리가 그대로 굳는다
      if (document.fonts) document.fonts.ready.then(relayout);
    })
    .catch((error) => {
      // 조용히 삼키지 않는다 — 시트 경로가 어긋났을 때 원인이 안 보인다
      console.error('[scenes] 장면을 못 만들었다', error);
      roots.forEach((r) => {
        r.hidden = true;
      });
    });
}
