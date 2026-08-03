const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} progress - 0..1
 */
function drawTrajectory(canvas, progress) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = 'oklch(78% 0.15 195)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  const steps = Math.floor(40 * progress);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / 40;
    const x = t * width;
    const y = height * 0.15 + t ** 1.6 * height * 0.7;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function initTrajectoryCanvases() {
  document.querySelectorAll('canvas[data-viz="trajectory"]').forEach((canvas) => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      drawTrajectory(canvas, 1);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          drawTrajectory(canvas, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    observer.observe(canvas);
  });
}

initTrajectoryCanvases();
