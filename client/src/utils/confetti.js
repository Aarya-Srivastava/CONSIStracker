// Lightweight Zero-Dependency Canvas Confetti Explosion
export function triggerConfetti(originX = window.innerWidth / 2, originY = window.innerHeight / 3) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#f0b25a', '#10b981', '#06b6d4', '#a855f7', '#f43f5e', '#3b82f6', '#fbbf24', '#34d399'];
  const particleCount = 80;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3.5,
      size: 5 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      decay: 0.012 + Math.random() * 0.015,
      shape: Math.random() > 0.4 ? 'rect' : 'circle'
    });
  }

  let animationFrameId;

  function render() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let activeCount = 0;

    for (let p of particles) {
      if (p.opacity <= 0) continue;
      activeCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.24; // gravity
      p.vx *= 0.985; // drag
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, p.opacity - p.decay);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  render();
}
