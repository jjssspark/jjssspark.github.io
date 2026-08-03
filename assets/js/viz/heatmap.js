const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ZONE_INTENSITY = [0.3, 0.6, 0.35, 0.55, 0.9, 0.5, 0.25, 0.65, 0.3];

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} progress - 0..1
 */
function drawHeatmap(canvas, progress) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const cellW = width / 3;
  const cellH = height / 3;
  ZONE_INTENSITY.forEach((intensity, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const alpha = intensity * progress;
    ctx.fillStyle = `oklch(72% 0.17 55 / ${alpha.toFixed(2)})`;
    ctx.fillRect(col * cellW, row * cellH, cellW, cellH);
    ctx.strokeStyle = 'oklch(30% 0.016 250)';
    ctx.strokeRect(col * cellW, row * cellH, cellW, cellH);
  });
}

function initHeatmapCanvases() {
  document.querySelectorAll('canvas[data-viz="heatmap"]').forEach((canvas) => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      drawHeatmap(canvas, 1);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          drawHeatmap(canvas, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    observer.observe(canvas);
  });
}

initHeatmapCanvases();
