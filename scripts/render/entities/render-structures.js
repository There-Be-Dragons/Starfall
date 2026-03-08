// Structure and convoy rendering helpers.
"use strict";

  function renderTower(ctx, tower) {
    ctx.save();
    ctx.translate(tower.x, tower.y);
    ctx.fillStyle = "rgba(8, 13, 24, 0.95)";
    ctx.strokeStyle = tower.loadout.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, tower.radius, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.18 + tower.flash * 0.5;
    ctx.fillStyle = tower.loadout.color;
    ctx.beginPath();
    ctx.arc(0, 0, tower.radius * 1.35, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.rotate(tower.facing);
    ctx.fillStyle = tower.loadout.color;
    ctx.fillRect(-4, -4, tower.radius + 10, 8);
    ctx.strokeStyle = "#e8fbff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-4, -4, tower.radius + 10, 8);
    if (tower.loadout.prototypeWeaponId) {
      ctx.fillStyle = PROTOTYPE_WEAPONS[tower.loadout.prototypeWeaponId].color;
      ctx.beginPath();
      ctx.arc(-8, 0, 5, 0, TWO_PI);
      ctx.fill();
    }
    ctx.restore();

    if (tower.hp < tower.maxHp) {
      const width = 44;
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(tower.x - width / 2, tower.y - tower.radius - 18, width, 5);
      ctx.fillStyle = "#8ff7ff";
      ctx.fillRect(tower.x - width / 2, tower.y - tower.radius - 18, width * (tower.hp / tower.maxHp), 5);
    }
  }

  function renderConvoyVehicle(ctx, vehicle) {
    if (!vehicle.alive || vehicle.secured || !vehicle.deployed) {
      return;
    }
    const enginePulse = 0.65 + 0.35 * Math.sin(game.time * 8 + vehicle.id * 0.17);
    const variant = vehicle.hullVariant || 0;
    ctx.save();
    ctx.translate(vehicle.x, vehicle.y);
    ctx.rotate(vehicle.facing);
    ctx.globalAlpha = 0.12 + vehicle.flash * 0.42;
    ctx.fillStyle = vehicle.accent;
    ctx.beginPath();
    ctx.ellipse(0, 0, vehicle.length * 0.82, vehicle.width * 0.82, 0, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 0.14 + enginePulse * 0.18;
    ctx.beginPath();
    ctx.moveTo(-vehicle.length * 0.54, -vehicle.width * 0.24);
    ctx.lineTo(-vehicle.length * 0.88, -vehicle.width * 0.08);
    ctx.lineTo(-vehicle.length * 0.88, vehicle.width * 0.08);
    ctx.lineTo(-vehicle.length * 0.54, vehicle.width * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(8, 14, 25, 0.96)";
    ctx.strokeStyle = vehicle.color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-vehicle.length * 0.48, -vehicle.width * 0.24);
    ctx.lineTo(-vehicle.length * 0.14, -vehicle.width * 0.34);
    ctx.lineTo(vehicle.length * 0.16, -vehicle.width * 0.34);
    ctx.lineTo(vehicle.length * 0.4, -vehicle.width * 0.2);
    ctx.lineTo(vehicle.length * 0.54, 0);
    ctx.lineTo(vehicle.length * 0.4, vehicle.width * 0.2);
    ctx.lineTo(vehicle.length * 0.16, vehicle.width * 0.34);
    ctx.lineTo(-vehicle.length * 0.14, vehicle.width * 0.34);
    ctx.lineTo(-vehicle.length * 0.48, vehicle.width * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(235, 246, 255, 0.08)";
    ctx.fillRect(-vehicle.length * 0.16, -vehicle.width * 0.23, vehicle.length * 0.4, vehicle.width * 0.46);

    ctx.fillStyle = vehicle.accent;
    ctx.beginPath();
    ctx.moveTo(vehicle.length * 0.14, -vehicle.width * 0.14);
    ctx.lineTo(vehicle.length * 0.38, -vehicle.width * 0.08);
    ctx.lineTo(vehicle.length * 0.38, vehicle.width * 0.08);
    ctx.lineTo(vehicle.length * 0.14, vehicle.width * 0.14);
    ctx.closePath();
    ctx.fill();

    const moduleOffsets = variant === 0 ? [-0.22, 0.02, 0.24] : variant === 1 ? [-0.18, 0.12] : [-0.26, -0.02, 0.2];
    ctx.fillStyle = "#0d1729";
    ctx.strokeStyle = vehicle.color;
    ctx.lineWidth = 1.25;
    for (const offset of moduleOffsets) {
      const moduleX = vehicle.length * offset;
      ctx.fillRect(moduleX - vehicle.length * 0.055, -vehicle.width * 0.48, vehicle.length * 0.11, vehicle.width * 0.18);
      ctx.strokeRect(moduleX - vehicle.length * 0.055, -vehicle.width * 0.48, vehicle.length * 0.11, vehicle.width * 0.18);
      ctx.fillRect(moduleX - vehicle.length * 0.055, vehicle.width * 0.3, vehicle.length * 0.11, vehicle.width * 0.18);
      ctx.strokeRect(moduleX - vehicle.length * 0.055, vehicle.width * 0.3, vehicle.length * 0.11, vehicle.width * 0.18);
    }

    ctx.fillStyle = vehicle.color;
    ctx.fillRect(-vehicle.length * 0.28, -2, vehicle.length * 0.42, 4);
    ctx.fillStyle = vehicle.accent;
    ctx.globalAlpha = 0.8 + enginePulse * 0.2;
    ctx.fillRect(-vehicle.length * 0.54, -vehicle.width * 0.16, vehicle.length * 0.08, vehicle.width * 0.12);
    ctx.fillRect(-vehicle.length * 0.54, vehicle.width * 0.04, vehicle.length * 0.08, vehicle.width * 0.12);
    ctx.globalAlpha = 1;
    ctx.restore();

    if (vehicle.hp < vehicle.maxHp || vehicle.flash > 0) {
      const width = 52;
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.fillRect(vehicle.x - width / 2, vehicle.y - vehicle.radius - 20, width, 5);
      ctx.fillStyle = "#ffd59b";
      ctx.fillRect(vehicle.x - width / 2, vehicle.y - vehicle.radius - 20, width * (vehicle.hp / vehicle.maxHp), 5);
    }
  }
