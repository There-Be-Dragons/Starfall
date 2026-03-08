// Player-focused rendering helpers.
"use strict";

  function renderAimGuide(ctx, run) {
    const player = run.player;
    const aimX = clamp(game.pointer.worldX, 0, run.map.width);
    const aimY = clamp(game.pointer.worldY, 0, run.map.height);
    const dx = aimX - player.x;
    const dy = aimY - player.y;
    const distanceToAim = Math.hypot(dx, dy);
    if (distanceToAim < player.radius + 6) {
      return;
    }
    const direction = normalize(dx, dy);
    const startX = player.x + direction.x * (player.radius + 8);
    const startY = player.y + direction.y * (player.radius + 8);
    ctx.save();
    ctx.strokeStyle = "rgba(215, 220, 228, 0.24)";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(aimX, aimY);
    ctx.stroke();
    ctx.restore();
  }

  function renderPlayer(ctx, player) {
    const classData = CLASS_DATA[player.classId];
    const speedRatio = clamp(Math.hypot(player.vx, player.vy) / Math.max(1, player.stats.moveSpeed * 1.3), 0, 1.4);
    const surgeColor = player.comboPower.tier >= 3
      ? "#fff0a6"
      : player.comboPower.tier === 2
        ? "#ffd391"
        : "#9fefff";
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.facing);
    const thrusterAlpha = Math.min(0.7, 0.06 + speedRatio * 0.16 + player.dashFlash * 0.45 + player.comboFlash * 0.08);
    if (thrusterAlpha > 0.02) {
      const thrusterColor = player.dashFlash > 0.05
        ? "#ffffff"
        : player.comboPower.timer > 0
          ? surgeColor
          : player.buffs.overdrive > 0
            ? "#9affcf"
            : classData.color;
      const flameLength = 9 + speedRatio * 10 + player.dashFlash * 18;
      ctx.globalAlpha = thrusterAlpha;
      ctx.fillStyle = thrusterColor;
      ctx.beginPath();
      ctx.moveTo(-player.radius + 3, 0);
      ctx.lineTo(-player.radius - flameLength, 6 + Math.sin(game.time * 26) * 1.5);
      ctx.lineTo(-player.radius - flameLength * 0.62, 0);
      ctx.lineTo(-player.radius - flameLength, -6 - Math.sin(game.time * 26) * 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = thrusterAlpha * 0.5;
      ctx.beginPath();
      ctx.arc(-player.radius - 6, 0, 8 + speedRatio * 4 + player.dashFlash * 5, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "rgba(6, 12, 24, 0.95)";
    ctx.strokeStyle = classData.color;
    ctx.lineWidth = 3;
    if (player.classId === "vanguard") {
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(6, 12);
      ctx.lineTo(-14, 10);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-14, -10);
      ctx.lineTo(6, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = classData.color;
      ctx.fillRect(0, -4, 20, 8);
    } else if (player.classId === "striker") {
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-2, 12);
      ctx.lineTo(-18, 6);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-18, -6);
      ctx.lineTo(-2, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = classData.color;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-10, 8);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.fill();
    } else if (player.classId === "warden") {
      ctx.beginPath();
      ctx.moveTo(18, -10);
      ctx.lineTo(18, 10);
      ctx.lineTo(0, 16);
      ctx.lineTo(-18, 10);
      ctx.lineTo(-18, -10);
      ctx.lineTo(0, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = classData.color;
      ctx.fillRect(-4, -9, 24, 18);
    } else if (player.classId === "oracle") {
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(4, 14);
      ctx.lineTo(-10, 14);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, -14);
      ctx.lineTo(4, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = classData.color;
      ctx.beginPath();
      ctx.arc(1, 0, 7, 0, TWO_PI);
      ctx.fill();
    }
    if (player.shield > 0) {
      ctx.globalAlpha = 0.25 + (player.shield / player.stats.maxShield) * 0.2;
      ctx.strokeStyle = "#7de4ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 8, 0, TWO_PI);
      ctx.stroke();
    }
    if (player.comboPower.timer > 0 || player.buffs.overdrive > 0) {
      ctx.globalAlpha = Math.min(0.35, 0.12 + player.comboFlash * 0.2 + Math.sin(game.time * 10) * 0.03);
      ctx.strokeStyle = player.comboPower.timer > 0 ? surgeColor : "#9affcf";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 12 + Math.sin(game.time * 8) * 1.5, 0, TWO_PI);
      ctx.stroke();
    }
    if (player.invuln > 0 || player.dashFlash > 0.05) {
      ctx.globalAlpha = Math.max(player.invuln * 0.35, player.dashFlash * 0.25);
      ctx.strokeStyle = "#f7fdff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 5 + player.dashFlash * 4, 0, TWO_PI);
      ctx.stroke();
    }
    if (player.weaponFlash > 0.02) {
      ctx.globalAlpha = player.weaponFlash * 0.75;
      ctx.strokeStyle = classData.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(player.radius - 2, 0);
      ctx.lineTo(player.radius + 10 + player.weaponFlash * 12, 0);
      ctx.stroke();
      ctx.fillStyle = "#f6ffff";
      ctx.beginPath();
      ctx.arc(player.radius + 8, 0, 2.2 + player.weaponFlash * 3, 0, TWO_PI);
      ctx.fill();
    }
    if (player.damageFlash > 0.02) {
      ctx.globalAlpha = player.damageFlash * 0.18;
      ctx.fillStyle = "#ff8f8f";
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 11, 0, TWO_PI);
      ctx.fill();
    }
    ctx.restore();
  }
