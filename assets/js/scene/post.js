import * as THREE from 'three';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** 필름 그레인 + 비네팅 + 색수차 + 본문 구간 어둡게. 한 패스 */
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    seed: { value: 0 },
    grain: { value: 0.06 },
    aberration: { value: 0 },
    darken: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float seed, grain, aberration, darken;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 d = (vUv - 0.5) * aberration * 0.004 * 4.0;
      vec4 c;
      c.r = texture2D(tDiffuse, vUv + d).r;
      c.g = texture2D(tDiffuse, vUv).g;
      c.b = texture2D(tDiffuse, vUv - d).b;
      c.a = 1.0;
      float n = hash(vUv * resolution + seed) - 0.5;
      c.rgb += n * grain;
      float v = smoothstep(0.9, 0.3, length(vUv - 0.5));
      c.rgb *= max(0.55, v);
      c.rgb *= 1.0 - darken * 0.7;
      gl_FragColor = c;
    }
  `,
};

/**
 * @param {import('three/addons/postprocessing/EffectComposer.js').EffectComposer} composer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @param {{ bloom: boolean }} opts
 */
export function createPost(composer, scene, camera, { bloom }) {
  for (const pass of [...composer.passes]) composer.removePass(pass);
  composer.addPass(new RenderPass(scene, camera));
  let bloomPass = null;
  if (bloom) {
    bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.4, 0.9);
    composer.addPass(bloomPass);
  }
  const film = new ShaderPass(FilmShader);
  composer.addPass(film);
  composer.addPass(new OutputPass());

  return {
    /** @param {{ shake?: number, aberration?: number, darken?: number, grainSeed?: number }} p */
    setParams({ aberration = 0, darken = 0, grainSeed = 0 }) {
      film.uniforms.aberration.value = aberration;
      film.uniforms.darken.value = darken;
      film.uniforms.seed.value = grainSeed;
    },
    setSize(w, h) {
      film.uniforms.resolution.value.set(w, h);
      bloomPass?.setSize(w, h);
    },
  };
}
