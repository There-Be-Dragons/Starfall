// Effect rendering helpers for afterimages and ring effects.
"use strict";

  function renderAfterimage(ctx, ghost) {
    const alpha = (ghost.life / ghost.maxLife) * 0.26;
    if (alpha <= 0.01) {
      return;
    }
    ctx.save();
    ctx.translate(ghost.x, ghost.y);
    ctx.rotate(ghost.facing);
    ctx.scale(ghost.scale, ghost.scale);
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    if (ghost.classId === "vanguard") {
      ctx.moveTo(18, 0);
      ctx.lineTo(6, 12);
      ctx.lineTo(-14, 10);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-14, -10);
      ctx.lineTo(6, -12);
    } else if (ghost.classId === "striker") {
      ctx.moveTo(20, 0);
      ctx.lineTo(-2, 12);
      ctx.lineTo(-18, 6);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-18, -6);
      ctx.lineTo(-2, -12);
    } else if (ghost.classId === "warden") {
      ctx.moveTo(18, -10);
      ctx.lineTo(18, 10);
      ctx.lineTo(0, 16);
      ctx.lineTo(-18, 10);
      ctx.lineTo(-18, -10);
      ctx.lineTo(0, -16);
    } else {
      ctx.moveTo(18, 0);
      ctx.lineTo(4, 14);
      ctx.lineTo(-10, 14);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, -14);
      ctx.lineTo(4, -14);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha * 0.8;
    ctx.strokeStyle = ghost.color;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  function renderEffectRing(ctx, ring) {
    const alpha = ring.life / ring.maxLife;
    if (alpha <= 0.01) {
      return;
    }
    ctx.save();
    if (ring.fillAlpha > 0) {
      ctx.globalAlpha = alpha * ring.fillAlpha;
      ctx.fillStyle = ring.color;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, TWO_PI);
      ctx.fill();
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.lineWidth * (0.65 + alpha * 0.35);
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
  }
