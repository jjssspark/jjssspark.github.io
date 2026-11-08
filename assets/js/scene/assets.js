import * as THREE from 'three';

/**
 * 에셋 로더. 첫 화면에 필요한 것(loadCritical)과 나중 것(loadRest)을 나눈다.
 * 공·배트는 지오메트리로 직접 만들기로 해서(world.js) 모델 파일이 없다.
 * 환경맵도 파일 대신 PMREM으로 만든다(stage.js). 여기는 텍스처만.
 */

const BASE = 'assets/textures/';

/** @typedef {{ map: THREE.Texture, normalMap: THREE.Texture, roughnessMap: THREE.Texture }} PBRSet */

function pbrSet(loader, name, repeat) {
  const load = (suffix, srgb) => {
    const t = loader.load(`${BASE}${name}_${suffix}.webp`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: load('diff', true), normalMap: load('nor', false), roughnessMap: load('rough', false) };
}

/**
 * @param {(ratio: number) => void} onProgress
 * @returns {Promise<{ grass: PBRSet, dirt: PBRSet }>}
 */
export function loadCritical(onProgress) {
  return new Promise((resolve, reject) => {
    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);
    const grass = pbrSet(loader, 'grass_ground', 60);
    const dirt = pbrSet(loader, 'brown_mud_dry', 6);
    manager.onProgress = (_url, loaded, total) => onProgress(loaded / total);
    manager.onLoad = () => {
      onProgress(1);
      resolve({ grass, dirt });
    };
    manager.onError = (url) => reject(new Error(`asset failed: ${url}`));
  });
}

/** 지금은 비어 있다. 나중 구간 전용 에셋이 생기면 여기로 */
export function loadRest() {
  return Promise.resolve({});
}
