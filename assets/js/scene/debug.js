/**
 * ?debug=1 전용. 진행도 슬라이더와 fps. 프로덕션 경로에서는 import되지 않는다.
 * @param {{ getProgress(): number, setProgress(p: number): void, getFps(): number }} api
 */
export function mountDebug(api) {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:12px;bottom:12px;z-index:9999;background:#000c;color:#fff;font:12px/1.4 monospace;padding:8px 10px;border-radius:6px;display:grid;gap:4px;min-width:220px';
  el.innerHTML =
    '<label>p <input type="range" min="0" max="1" step="0.001" style="width:160px"> <output></output></label><div data-fps></div><label><input type="checkbox" data-peek> 본문 숨기기(장면만)</label>';
  document.body.appendChild(el);
  // ?shot=1 — 포스터 캡처용. 패널과 본문을 치우고 장면만 남긴다
  if (new URLSearchParams(location.search).get('shot') === '1') {
    el.style.display = 'none';
    for (const n of document.querySelectorAll('header, main, footer')) n.style.opacity = '0';
  }
  const range = el.querySelector('input');
  const out = el.querySelector('output');
  const fps = el.querySelector('[data-fps]');
  el.querySelector('[data-peek]').addEventListener('change', (e) => {
    for (const n of document.querySelectorAll('header, main, footer')) n.style.opacity = e.target.checked ? '0.12' : '';
  });
  range.addEventListener('input', () => api.setProgress(Number(range.value)));
  const p0 = new URLSearchParams(location.search).get('p');
  if (p0 !== null) requestAnimationFrame(() => api.setProgress(Number(p0)));
  setInterval(() => {
    const p = api.getProgress();
    range.value = String(p);
    out.textContent = p.toFixed(3);
    fps.textContent = `fps ${api.getFps().toFixed(0)}`;
  }, 250);
}
