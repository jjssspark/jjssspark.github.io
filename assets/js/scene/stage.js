import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { buildWorld } from './world.js';
import { createPost } from './post.js';

/**
 * 렌더러·카메라·컴포저·월드를 묶는다. 진행도는 모른다 — render(state)만 받는다.
 * @param {HTMLCanvasElement} canvas
 * @param {{ isTouch: boolean, assets: object }} opts
 */
export function createStage(canvas, { isTouch, assets }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = !isTouch;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const fogColor = readToken('--color-scene-fog', '#0b0d14');
  scene.background = fogColor;
  scene.fog = new THREE.FogExp2(fogColor, 0.0055);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 500);

  // 환경맵: 파일 대신 절차 생성. 어두운 하늘 + 조명탑 자리의 밝은 판 4장
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(makeEnvScene(), 0.04).texture;
  scene.environmentIntensity = 0.3;
  pmrem.dispose();

  const world = buildWorld(assets);
  scene.add(world.group);
  if (!isTouch) {
    const key = world.towers[1];
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0005;
  }

  const composer = new EffectComposer(renderer);
  const post = createPost(composer, scene, camera, { bloom: !isTouch });

  function setSize(w, h) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    post.setSize(w, h);
  }

  const shakeOff = new THREE.Vector3();
  let grainSeed = 0;

  /** @param {import('./timeline.js').SceneState|null} state */
  function render(state, dt) {
    if (state) {
      world.apply(state);
      shakeOff.set(Math.sin(state.p * 1234.5), Math.cos(state.p * 2345.6), 0).multiplyScalar(0.15 * state.shake);
      camera.position.copy(state.camPos).add(shakeOff);
      camera.lookAt(state.camTarget);
      grainSeed = (grainSeed + 1) % 1000;
      post.setParams({ aberration: state.aberration, darken: state.darken, grainSeed });
    }
    composer.render(dt);
  }

  return { renderer, scene, camera, composer, world, setSize, render };
}

function readToken(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const c = new THREE.Color();
  // three.js Color는 oklch()를 못 읽는다(경고만 내고 흰색으로 남는다). 그럴 땐 16진 폴백
  if (raw && !raw.startsWith('oklch')) c.setStyle(raw);
  else c.set(fallback);
  return c;
}

function makeEnvScene() {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x05060a);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 16, 8), new THREE.MeshBasicMaterial({ color: 0x0a0d18, side: THREE.BackSide }));
  s.add(sky);
  for (const [x, z] of [[-1, -0.3], [1, -0.3], [-1, -1], [1, -1]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 2), new THREE.MeshBasicMaterial({ color: 0xfff1d0 }));
    panel.position.set(x * 20, 18, z * 30);
    panel.lookAt(0, 0, 0);
    s.add(panel);
  }
  return s;
}
