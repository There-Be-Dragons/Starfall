// Projectile rendering helpers.
"use strict";

  function renderProjectileSprite(ctx, projectile, hostile = false) {
    if (!projectile.missile) {
      if (hostile) {
        ctx.fillStyle = projectile.color;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius * 2.1, 0, TWO_PI);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, TWO_PI);
        ctx.fill();
        ctx.strokeStyle = "#ffd8bf";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = projectile.color;
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius * 2, 0, TWO_PI);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, TWO_PI);
        ctx.fill();
        ctx.strokeStyle = "#f4fdff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      return;
    }

    const angle = Math.atan2(projectile.vy, projectile.vx);
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(angle);
    ctx.globalAlpha = hostile ? 0.18 : 0.12;
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(0, 0, projectile.radius * 2.3, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = projectile.engineColor;
    ctx.beginPath();
    ctx.moveTo(-projectile.radius * 1.5, 0);
    ctx.lineTo(-projectile.radius * 2.5, projectile.radius * 0.85);
    ctx.lineTo(-projectile.radius * 2.7, 0);
    ctx.lineTo(-projectile.radius * 2.5, -projectile.radius * 0.85);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = projectile.exhaustColor;
    ctx.beginPath();
    ctx.moveTo(-projectile.radius * 1.25, 0);
    ctx.lineTo(-projectile.radius * 2.05, projectile.radius * 0.42);
    ctx.lineTo(-projectile.radius * 2.2, 0);
    ctx.lineTo(-projectile.radius * 2.05, -projectile.radius * 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.moveTo(projectile.radius * 1.55, 0);
    ctx.lineTo(0, projectile.radius * 0.92);
    ctx.lineTo(-projectile.radius * 1.2, projectile.radius * 0.7);
    ctx.lineTo(-projectile.radius * 1.4, 0);
    ctx.lineTo(-projectile.radius * 1.2, -projectile.radius * 0.7);
    ctx.lineTo(0, -projectile.radius * 0.92);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hostile ? "#ffe3ce" : "#e4f8ff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = hostile ? "#fff0d8" : "#f7fdff";
    ctx.beginPath();
    ctx.arc(projectile.radius * 0.62, 0, projectile.radius * 0.24, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }
