/**
 * 3D 장면을 돌릴지 판정한다. 아니면 <html class="no-scene">로 폴백 레이아웃.
 * 판정은 한 번만. 결과는 호출자가 들고 다닌다.
 */
export function decideScene() {
  const params = new URLSearchParams(location.search);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = navigator.deviceMemory ?? 8;

  let reason = 'ok';
  if (params.get('noscene') === '1') reason = 'forced';
  else if (reduced) reason = 'reduced-motion';
  else if (!hasWebGL()) reason = 'no-webgl';
  else if (noHover && cores <= 4 && mem <= 4) reason = 'low-end';

  const run = reason === 'ok';
  document.documentElement.classList.toggle('no-scene', !run);
  return { run, reason };
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}
