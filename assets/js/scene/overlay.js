import * as THREE from 'three';

/**
 * 전광판 메시의 앞면을 화면에 투영해 DOM 컨테이너를 그 위에 맞춘다.
 * 글자는 DOM이다 — 링크 클릭·키보드 탐색·단일 콘텐츠 소스를 지키려고.
 * @param {THREE.Mesh} board
 * @param {THREE.Camera} camera
 * @param {HTMLElement} el
 * @returns {(boardOn: number) => void} 매 렌더 뒤 호출
 */
export function trackBoard(board, camera, el) {
  const { width: w, height: h } = board.geometry.parameters;
  const corners = [
    new THREE.Vector3(-w / 2, h / 2, 0.51),
    new THREE.Vector3(w / 2, h / 2, 0.51),
    new THREE.Vector3(w / 2, -h / 2, 0.51),
    new THREE.Vector3(-w / 2, -h / 2, 0.51),
  ];
  const tmp = new THREE.Vector3();
  return (boardOn) => {
    if (boardOn < 0.05) {
      el.classList.add('is-off');
      return;
    }
    el.classList.remove('is-off');
    el.classList.add('is-lit'); // 첫 점등 이후 유지 — HOME RUN 플래시는 한 번만
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of corners) {
      tmp.copy(c);
      board.localToWorld(tmp).project(camera);
      if (tmp.z > 1) {
        el.classList.add('is-off');
        return;
      }
      const x = ((tmp.x + 1) / 2) * window.innerWidth;
      const y = ((1 - tmp.y) / 2) * window.innerHeight;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    el.style.setProperty('--bx', `${minX.toFixed(1)}px`);
    el.style.setProperty('--by', `${minY.toFixed(1)}px`);
    el.style.setProperty('--bw', `${(maxX - minX).toFixed(1)}px`);
    el.style.setProperty('--bh', `${(maxY - minY).toFixed(1)}px`);
    el.style.setProperty('--board-on', boardOn.toFixed(3));
  };
}
