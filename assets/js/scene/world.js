import * as THREE from 'three';
import { MOUND, HOME, BOARD, hitPath } from './timeline.js';

/**
 * 야구장 최소 구성. 잔디 평면 + 내야 흙 + 마운드 + 파울 라인 + 펜스 + 조명탑 + 전광판,
 * 그리고 공·배트. 사람은 없다. 모델 파일도 없다 — 전부 지오메트리.
 */

const TOWER_POS = [
  [-45, 32, -20],
  [45, 32, -20],
  [-60, 32, -95],
  [60, 32, -95],
];
const BALL_R = 0.037;
const BOARD_W = 24;
const BOARD_H = 10;
const DOT_COLS = 96;
const DOT_ROWS = 40;

/** 실밥 곡선 — 구면 위를 8자로 도는 표준 매개식 */
function seamCurve(r) {
  const pts = [];
  const a = 0.42;
  for (let i = 0; i <= 240; i++) {
    const t = (i / 240) * Math.PI * 2;
    const phi = Math.PI / 2 - (Math.PI / 2 - a) * Math.cos(t);
    const th = t / 2 + a * Math.sin(2 * t);
    pts.push(new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.sin(phi) * Math.sin(th), Math.cos(phi)).multiplyScalar(r * 0.995));
  }
  return new THREE.CatmullRomCurve3(pts, true);
}

function makeBall() {
  const g = new THREE.Group();
  const leather = new THREE.MeshStandardMaterial({ color: 0xf1ebdd, roughness: 0.62, metalness: 0 });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 48, 32), leather));
  const seam = new THREE.Mesh(
    new THREE.TubeGeometry(seamCurve(BALL_R), 480, BALL_R * 0.045, 6, true),
    new THREE.MeshStandardMaterial({ color: 0xb3202c, roughness: 0.8 }),
  );
  g.add(seam);
  return g;
}

function makeBat() {
  // 길이 0.85m. 손잡이 → 배럴 프로필
  const prof = [
    [0, 0],
    [0.019, 0],
    [0.019, 0.012],
    [0.012, 0.02],
    [0.012, 0.3],
    [0.02, 0.5],
    [0.031, 0.66],
    [0.034, 0.8],
    [0.032, 0.84],
    [0, 0.85],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const mesh = new THREE.Mesh(
    new THREE.LatheGeometry(prof, 32),
    new THREE.MeshStandardMaterial({ color: 0xb78a52, roughness: 0.45 }),
  );
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

function makeBoardTexture() {
  const c = document.createElement('canvas');
  c.width = DOT_COLS * 6;
  c.height = DOT_ROWS * 6;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  let litDots = -1;
  /** @param {number} ratio 0~1 — 왼쪽 위부터 켜진 도트 비율 */
  function paint(ratio) {
    const n = Math.round(ratio * DOT_COLS * DOT_ROWS);
    if (n === litDots) return;
    litDots = n;
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < DOT_COLS * DOT_ROWS; i++) {
      const col = i % DOT_COLS;
      const row = (i / DOT_COLS) | 0;
      ctx.fillStyle = i < n ? '#b8372a' : '#2a1d1f';
      ctx.beginPath();
      ctx.arc(col * 6 + 3, row * 6 + 3, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    tex.needsUpdate = true;
  }
  paint(0);
  return { tex, paint };
}

/** 비행 궤적 튜브. 진행도에 따라 지나온 만큼만 그린다(drawRange) */
function makeTrail(points, radius, color) {
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 120, radius, 6, false);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  const total = geo.index.count;
  mesh.setFrac = (f) => geo.setDrawRange(0, Math.floor(Math.max(0, Math.min(1, f)) * total));
  mesh.setFrac(0);
  return mesh;
}

/**
 * @param {{ grass: object, dirt: object }} assets
 */
export function buildWorld(assets) {
  const group = new THREE.Group();

  // 잔디
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), new THREE.MeshStandardMaterial({ ...assets.grass, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.z = -90;
  grass.receiveShadow = true;
  group.add(grass);

  // 내야 흙 (다이아몬드) + 마운드
  const dirtMat = new THREE.MeshStandardMaterial({ ...assets.dirt, roughness: 1 });
  const dia = new THREE.Shape();
  dia.moveTo(0, 3);
  dia.lineTo(29, -27.4);
  dia.lineTo(0, -57);
  dia.lineTo(-29, -27.4);
  dia.closePath();
  const infield = new THREE.Mesh(new THREE.ShapeGeometry(dia, 4), dirtMat);
  infield.rotation.x = -Math.PI / 2;
  infield.position.y = 0.01;
  infield.receiveShadow = true;
  group.add(infield);
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.4, 0.25, 48), dirtMat);
  mound.position.set(MOUND.x, 0.125, MOUND.z);
  mound.receiveShadow = true;
  group.add(mound);

  // 파울 라인
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 1 });
  for (const sgn of [-1, 1]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 125), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = (sgn * Math.PI) / 4;
    line.position.set(sgn * 44.2, 0.02, -44.2);
    group.add(line);
  }

  // 외야 펜스 (호)
  const fence = new THREE.Mesh(
    new THREE.CylinderGeometry(122, 122, 3.2, 96, 1, true, -Math.PI * 0.28, Math.PI * 0.56),
    new THREE.MeshStandardMaterial({ color: 0x173a22, roughness: 0.9, side: THREE.DoubleSide }),
  );
  fence.position.set(0, 1.6, 2);
  group.add(fence);

  // 관중석 — 펜스 뒤 계단식 호. 좌석은 어둡고 드문드문 폰 불빛
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a2630, roughness: 0.95 });
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x1b1a20, roughness: 1 });
  for (let i = 0; i < 7; i++) {
    const r = 123.5 + i * 2.6;
    const y = 3.4 + i * 1.5;
    const tier = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 1.5, 96, 1, true, -Math.PI * 0.3, Math.PI * 0.6),
      i % 2 ? seatMat : stepMat,
    );
    tier.position.set(0, y + 0.75, 2);
    group.add(tier);
    const tread = new THREE.Mesh(new THREE.RingGeometry(r, r + 2.6, 96, 1, Math.PI * 1.2, Math.PI * 0.6), stepMat);
    tread.rotation.x = -Math.PI / 2;
    tread.position.set(0, y + 1.5, 2);
    group.add(tread);
  }
  // 관중 폰 불빛 — 점 200개
  // 로드마다 같은 자리에 켜지도록 고정 시드 난수
  let seed = 20261108;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const crowdPts = [];
  for (let i = 0; i < 200; i++) {
    const a = Math.PI * 1.5 + (rnd() - 0.5) * Math.PI * 0.56;
    const tier = (rnd() * 7) | 0;
    const r = 124 + tier * 2.6 + rnd() * 2;
    crowdPts.push(Math.cos(a) * r, 4.2 + tier * 1.5 + rnd() * 0.6, Math.sin(a) * r + 2);
  }
  const crowd = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(crowdPts, 3)),
    new THREE.PointsMaterial({ color: 0xe8ecff, size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0.85 }),
  );
  group.add(crowd);

  // 조명탑
  const towers = [];
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x23242a, roughness: 0.7, metalness: 0.4 });
  const lampMats = [];
  for (const [x, y, z] of TOWER_POS) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.7, y, 10), poleMat);
    pole.position.set(x, y / 2, z);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff1d0, emissiveIntensity: 8 });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(5, 1.6, 0.6), lampMat);
    lamp.position.set(x, y + 0.8, z);
    lamp.lookAt(0, 0, -40);
    lampMats.push(lampMat);
    const spot = new THREE.SpotLight(0xf4f0e6, 900, 260, 0.62, 0.55, 1.4);
    spot.position.set(x, y, z);
    spot.target.position.set(0, 0, -45);
    towers.push(spot);
    group.add(pole, lamp, spot, spot.target);
  }
  group.add(new THREE.HemisphereLight(0x4a5a7a, 0x121008, 0.35));

  // 전광판
  const { tex: boardTex, paint: paintBoard } = makeBoardTexture();
  const boardMats = [
    new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ map: boardTex, emissiveMap: boardTex, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.8 }),
  ];
  const board = new THREE.Mesh(new THREE.BoxGeometry(BOARD_W, BOARD_H, 1), boardMats);
  board.position.copy(BOARD);
  group.add(board);
  const standsLight = new THREE.PointLight(0x9fb0d8, 400, 90, 1.6);
  standsLight.position.set(0, 26, -108);
  group.add(standsLight);
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, BOARD.y - BOARD_H / 2, 0.8), poleMat);
    leg.position.set(sx * (BOARD_W / 2 - 1.5), (BOARD.y - BOARD_H / 2) / 2, BOARD.z);
    group.add(leg);
  }

  // 공 · 배트
  const ball = makeBall();
  ball.castShadow = true;
  ball.traverse((o) => (o.castShadow = true));
  group.add(ball);
  const bat = makeBat();
  bat.visible = false;
  group.add(bat);

  // 트레일 — 투구 구간, 타구 구간
  const pitchTrail = makeTrail([MOUND.clone(), MOUND.clone().lerp(HOME, 0.5), HOME.clone()], 0.012, 0xff5a3c);
  const hitPts = Array.from({ length: 33 }, (_, i) => hitPath(i / 32));
  const hitTrail = makeTrail(hitPts, 0.06, 0xff5a3c);
  group.add(pitchTrail, hitTrail);

  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  /** @param {import('./timeline.js').SceneState} s */
  function apply(s) {
    ball.position.copy(s.ballPos);
    ball.rotation.set(s.ballSpin * 0.7, 0, s.ballSpin);

    towers.forEach((spot, i) => {
      spot.intensity = 900 * s.lights[i];
      lampMats[i].emissiveIntensity = 8 * s.lights[i];
    });

    paintBoard(s.boardOn);

    // 배트: batT 0=프레임 밖, 1=임팩트. 홈플레이트 우측 바깥에서 호를 그린다
    bat.visible = s.batT > 0 && s.batT < 1.001 && s.p < 0.47;
    if (bat.visible) {
      const swing = (1 - s.batT) * 1.9; // 라디안. 뒤에서 앞으로
      const pivot = new THREE.Vector3(0.75, 1.0, 0.35);
      bat.position.copy(pivot);
      bat.rotation.set(0, swing, -Math.PI / 2 + 0.15);
      bat.position.x += Math.cos(swing) * 0.05;
    }

    pitchTrail.setFrac(smooth(0.25, 0.4, s.p) * (1 - smooth(0.44, 0.47, s.p)));
    hitTrail.setFrac(smooth(0.45, 0.7, s.p) * (1 - smooth(0.72, 0.78, s.p)));
  }

  return { group, ball, bat, towers, board, apply };
}
