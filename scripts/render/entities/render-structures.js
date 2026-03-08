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
    ctx.save();
    ctx.translate(vehicle.x, vehicle.y);
    ctx.rotate(vehicle.facing);
    ctx.globalAlpha = 0.16 + vehicle.flash * 0.5;
    ctx.fillStyle = vehicle.accent;
    ctx.fillRect(-vehicle.length * 0.56, -vehicle.width * 0.8, vehicle.length * 1.12, vehicle.width * 1.6);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(8, 14, 25, 0.96)";
    ctx.strokeStyle = vehicle.color;
    ctx.lineWidth = 2.4;
    ctx.fillRect(-vehicle.length * 0.46, -vehicle.width * 0.42, vehicle.length * 0.62, vehicle.width * 0.84);
    ctx.strokeRect(-vehicle.length * 0.46, -vehicle.width * 0.42, vehicle.length * 0.62, vehicle.width * 0.84);
    ctx.fillStyle = vehicle.color;
    ctx.fillRect(vehicle.length * 0.06, -vehicle.width * 0.34, vehicle.length * 0.3, vehicle.width * 0.68);
    ctx.strokeStyle = "#f1f8ff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vehicle.length * 0.06, -vehicle.width * 0.34, vehicle.length * 0.3, vehicle.width * 0.68);
    ctx.fillStyle = vehicle.accent;
    ctx.fillRect(-vehicle.length * 0.16, -2, vehicle.length * 0.22, 4);
    ctx.fillStyle = "#0c1627";
    ctx.fillRect(-vehicle.length * 0.28, -vehicle.width * 0.6, vehicle.length * 0.14, 5);
    ctx.fillRect(-vehicle.length * 0.28, vehicle.width * 0.6 - 5, vehicle.length * 0.14, 5);
    ctx.fillRect(vehicle.length * 0.18, -vehicle.width * 0.6, vehicle.length * 0.14, 5);
    ctx.fillRect(vehicle.length * 0.18, vehicle.width * 0.6 - 5, vehicle.length * 0.14, 5);
    ctx.restore();

    if (vehicle.hp < vehicle.maxHp || vehicle.flash > 0) {
      const width = 46;
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.fillRect(vehicle.x - width / 2, vehicle.y - vehicle.radius - 20, width, 5);
      ctx.fillStyle = "#ffd59b";
      ctx.fillRect(vehicle.x - width / 2, vehicle.y - vehicle.radius - 20, width * (vehicle.hp / vehicle.maxHp), 5);
    }
  }
