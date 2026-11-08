import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * 렌더러·카메라·컴포저. 장면 내용(world)과 진행도(timeline)는 모른다.
 * render(state)는 state.camPos/camTarget만 읽고, 나머지는 world.apply가 처리한다.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ isTouch: boolean }} opts
 */
export function createStage(canvas, { isTouch, assets }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isTouch,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070c);
  scene.fog = new THREE.FogExp2(0x05070c, 0.0055);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 400);
  camera.position.set(0, 14, 14);
  camera.lookAt(0, 0.5, -18.4);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());

  // 임시 메시 — Task 5에서 world.js가 대체한다
  const placeholder = new THREE.Group();
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    assets?.grass
      ? new THREE.MeshStandardMaterial({ ...assets.grass, roughness: 1 })
      : new THREE.MeshStandardMaterial({ color: 0x2f5a30, roughness: 1 }),
  );
  grass.rotation.x = -Math.PI / 2;
  placeholder.add(grass);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.037, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.6 }),
  );
  ball.position.set(0, 0.3, -18.4);
  placeholder.add(ball);
  for (const [x, z] of [[-45, -20], [45, -20], [-60, -95], [60, -95]]) {
    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(1, 30, 1),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2e }),
    );
    pole.position.set(x, 15, z);
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d6, emissiveIntensity: 6 }),
    );
    lamp.position.set(x, 30.5, z);
    placeholder.add(pole, lamp);
  }
  scene.add(placeholder);
  scene.add(new THREE.HemisphereLight(0x6a7a9a, 0x1a1a10, 1.4));
  const key = new THREE.DirectionalLight(0xf4f0e6, 2.6);
  key.position.set(30, 50, 10);
  scene.add(key);

  function setSize(w, h) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
  }

  /** @param {{camPos?: THREE.Vector3, camTarget?: THREE.Vector3}} state */
  function render(state, dt) {
    if (state?.camPos) camera.position.copy(state.camPos);
    if (state?.camTarget) camera.lookAt(state.camTarget);
    composer.render(dt);
  }

  return { renderer, scene, camera, composer, setSize, render };
}
