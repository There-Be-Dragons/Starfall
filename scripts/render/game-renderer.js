// All canvas rendering for the mission, overlays, and HUD-adjacent visuals.
"use strict";

  function renderBackdrop(mode) {
    const ctx = game.ctx;
    ctx.clearRect(0, 0, game.width, game.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    if (mode === "mission" && game.run) {
      gradient.addColorStop(0, game.run.zone.colors.bg);
      gradient.addColorStop(1, "#05070d");
    } else if (mode === "hub") {
      gradient.addColorStop(0, "#0c1730");
      gradient.addColorStop(1, "#060912");
    } else {
      gradient.addColorStop(0, "#0b1430");
      gradient.addColorStop(1, "#050812");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    for (const star of game.stars) {
      const x = (star.x * game.width + Math.sin(game.time * star.speed + star.phase) * star.wander) % game.width;
      const y = (star.y * game.height + Math.cos(game.time * star.speed * 0.7 + star.phase) * star.wander * 0.5 + game.time * star.drift) % game.height;
      ctx.globalAlpha = 0.25 + 0.65 * (0.5 + 0.5 * Math.sin(game.time * star.twinkle + star.phase));
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, TWO_PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (mode === "menu" || mode === "hub") {
      const stationY = game.height * 0.76;
      ctx.fillStyle = "rgba(10, 18, 34, 0.78)";
      ctx.beginPath();
      ctx.moveTo(0, game.height);
      ctx.lineTo(0, stationY);
      ctx.quadraticCurveTo(game.width * 0.25, stationY - 80, game.width * 0.42, stationY - 36);
      ctx.quadraticCurveTo(game.width * 0.68, stationY + 34, game.width, stationY - 72);
      ctx.lineTo(game.width, game.height);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(125, 183, 255, 0.18)";
      ctx.lineWidth = 2;
      for (let index = 0; index < 12; index += 1) {
        const x = game.width * 0.08 + index * game.width * 0.07;
        ctx.beginPath();
        ctx.moveTo(x, stationY + 10 + Math.sin(game.time * 0.6 + index) * 6);
        ctx.lineTo(x + 26, stationY - 70 - (index % 3) * 18);
        ctx.stroke();
      }

      if (mode === "menu") {
        ctx.fillStyle = "rgba(121, 181, 255, 0.12)";
        ctx.beginPath();
        ctx.arc(game.width * 0.14, game.height * 0.18, 110, 0, TWO_PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(game.width * 0.82, game.height * 0.26, 80, 0, TWO_PI);
        ctx.fill();
      }
    }
  }

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

  function renderMission() {
    const ctx = game.ctx;
    const run = game.run;
    const zone = run.zone;
    const shakeStrength = (game.screenShake * (game.save.options.screenShake / 100)) / 2;
    const shakeX = shakeStrength ? (Math.random() * 2 - 1) * shakeStrength : 0;
    const shakeY = shakeStrength ? (Math.random() * 2 - 1) * shakeStrength : 0;
    const halfViewWidth = Math.min(game.width / 2, run.map.width / 2);
    const halfViewHeight = Math.min(game.height / 2, run.map.height / 2);
    const cameraX = clamp(run.camera.x, halfViewWidth, run.map.width - halfViewWidth);
    const cameraY = clamp(run.camera.y, halfViewHeight, run.map.height - halfViewHeight);
    run.camera.renderX = cameraX;
    run.camera.renderY = cameraY;
    game.pointer.worldX = cameraX + (game.pointer.x - game.width / 2);
    game.pointer.worldY = cameraY + (game.pointer.y - game.height / 2);

    ctx.save();
    ctx.translate(Math.round(game.width / 2 - cameraX + shakeX), Math.round(game.height / 2 - cameraY + shakeY));
    ctx.fillStyle = zone.colors.floor;
    ctx.fillRect(0, 0, run.map.width, run.map.height);

    const gridStep = 120;
    ctx.strokeStyle = zone.colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= run.map.width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, run.map.height);
      ctx.stroke();
    }
    for (let y = 0; y <= run.map.height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(run.map.width, y);
      ctx.stroke();
    }

    for (const obstacle of run.map.obstacles) {
      ctx.fillStyle = zone.colors.obstacle;
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = zone.colors.accentSoft;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.radius - 8, 0, TWO_PI);
      ctx.stroke();
    }

    if (run.objective.type === "escort" && !run.objective.complete) {
      ctx.fillStyle = "rgba(220, 225, 232, 0.035)";
      ctx.fillRect(run.objective.laneX - 150, 0, 300, run.map.height);
      ctx.save();
      ctx.setLineDash([18, 20]);
      ctx.strokeStyle = "rgba(214, 222, 232, 0.12)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(run.objective.laneX, 0);
      ctx.lineTo(run.objective.laneX, run.map.height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255, 217, 160, 0.22)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(run.objective.laneX - 140, run.objective.destinationY);
      ctx.lineTo(run.objective.laneX + 140, run.objective.destinationY);
      ctx.stroke();
      ctx.restore();
    }

    if (run.objective.type === "salvage") {
      for (const node of run.objective.nodes) {
        ctx.save();
        ctx.translate(node.x, node.y);
        const alpha = node.collected ? 0.25 : 0.92;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = zone.colors.objective;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, node.radius, 0, TWO_PI);
        ctx.stroke();
        ctx.fillStyle = node.collected ? "rgba(255,255,255,0.06)" : zone.colors.accentSoft;
        ctx.beginPath();
        ctx.moveTo(-12, -14);
        ctx.lineTo(14, -8);
        ctx.lineTo(8, 14);
        ctx.lineTo(-16, 8);
        ctx.closePath();
        ctx.fill();
        if (!node.collected) {
          ctx.globalAlpha = 0.18 + Math.sin(game.time * 3 + node.id) * 0.06;
          ctx.strokeStyle = run.zone.colors.objective;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, -node.radius - 16);
          ctx.lineTo(0, -node.radius - 70);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    if (run.objective.type === "defense") {
      const reactor = run.objective.reactor;
      ctx.globalAlpha = reactor.playerInRing ? 0.14 : 0.08;
      ctx.fillStyle = reactor.alive ? "#7fefff" : "#ff6f6f";
      ctx.beginPath();
      ctx.arc(reactor.x, reactor.y, reactor.guardRadius, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 0.38 + Math.sin(reactor.securedPulse) * 0.08;
      ctx.strokeStyle = reactor.alive ? zone.colors.objective : "#ff6f6f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(reactor.x, reactor.y, reactor.guardRadius, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 1;

      for (const turret of reactor.turrets) {
        ctx.strokeStyle = "rgba(159, 243, 255, 0.28)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(reactor.x, reactor.y);
        ctx.lineTo(turret.x, turret.y);
        ctx.stroke();
        ctx.save();
        ctx.translate(turret.x, turret.y);
        ctx.globalAlpha = 0.2 + turret.flash;
        ctx.fillStyle = "#9ff3ff";
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, TWO_PI);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#d7fdff";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, TWO_PI);
        ctx.stroke();
        ctx.fillStyle = "#d7fdff";
        ctx.fillRect(8, -2, 8, 4);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(reactor.x, reactor.y);
      ctx.globalAlpha = 0.12 + reactor.hitFlash * 0.45;
      ctx.fillStyle = reactor.alive ? "#9ff7ff" : "#ff7070";
      ctx.beginPath();
      ctx.arc(0, 0, reactor.radius * 1.4, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = reactor.alive ? "#dffcff" : "#ff9f9f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, reactor.radius, 0, TWO_PI);
      ctx.stroke();
      if (reactor.shield > 0) {
        ctx.globalAlpha = 0.3 + (reactor.shield / reactor.maxShield) * 0.22;
        ctx.strokeStyle = "#7ee8ff";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, reactor.radius + 14, 0, TWO_PI);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(11, 20, 34, 0.95)";
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(22, -8);
      ctx.lineTo(22, 8);
      ctx.lineTo(0, 24);
      ctx.lineTo(-22, 8);
      ctx.lineTo(-22, -8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = reactor.alive ? zone.colors.objective : "#ff6f6f";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = reactor.alive ? "#c8fbff" : "#ffd2d2";
      ctx.fillRect(-8, -18, 16, 36);
      ctx.fillRect(-18, -8, 36, 16);
      ctx.globalAlpha = 0.2 + Math.sin(reactor.securedPulse * 1.4) * 0.08;
      ctx.strokeStyle = "#c9ffff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -reactor.radius - 8);
      ctx.lineTo(0, -reactor.radius - 90);
      ctx.stroke();
      ctx.restore();
    }

    if (run.extraction) {
      ctx.strokeStyle = "#98fff5";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(run.extraction.x, run.extraction.y, run.extraction.radius, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 0.16 + run.extraction.progress * 0.3;
      ctx.fillStyle = "#88fff0";
      ctx.beginPath();
      ctx.arc(run.extraction.x, run.extraction.y, run.extraction.radius - 12, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const field of run.fields) {
      ctx.strokeStyle = field.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.3 + Math.sin(game.time * 6 + field.id) * 0.05;
      ctx.beginPath();
      ctx.arc(field.x, field.y, field.radius, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = field.color;
      ctx.beginPath();
      ctx.arc(field.x, field.y, field.radius, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const hazard of run.hazards) {
      ctx.globalAlpha = hazard.delay > 0 ? 0.4 : hazard.kind === "pool" ? 0.2 : 0.15;
      ctx.strokeStyle = hazard.color;
      ctx.fillStyle = hazard.color;
      ctx.lineWidth = hazard.delay > 0 ? 3 : 1;
      ctx.beginPath();
      ctx.arc(hazard.x, hazard.y, hazard.radius, 0, TWO_PI);
      if (hazard.delay > 0) {
        ctx.stroke();
      } else {
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    for (const anomaly of run.anomalies) {
      const def = ANOMALY_TYPES[anomaly.type];
      ctx.save();
      ctx.translate(anomaly.x, anomaly.y);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(0, 0, anomaly.radius, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, anomaly.radius * 0.52 + Math.sin(anomaly.pulse) * 6, 0, TWO_PI);
      ctx.stroke();
      ctx.restore();
    }

    for (const cache of run.prototypeCaches) {
      if (!cache.active) {
        continue;
      }
      const weapon = PROTOTYPE_WEAPONS[cache.weaponId];
      ctx.save();
      ctx.translate(cache.x, cache.y);
      ctx.rotate(cache.pulse * 0.35);
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = weapon.color;
      ctx.beginPath();
      ctx.arc(0, 0, cache.radius * 1.8, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = weapon.color;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-cache.radius, -cache.radius, cache.radius * 2, cache.radius * 2);
      ctx.fillStyle = weapon.color;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
    }

    for (const pair of run.teleporters) {
      if (!pair.active) {
        continue;
      }
      ctx.strokeStyle = "rgba(145, 246, 255, 0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pair.endpoints[0].x, pair.endpoints[0].y);
      ctx.lineTo(pair.endpoints[1].x, pair.endpoints[1].y);
      ctx.stroke();
      for (const endpoint of pair.endpoints) {
        const pulseRadius = endpoint.radius + 6 + Math.sin(pair.pulse + endpoint.id) * 3;
        ctx.save();
        ctx.translate(endpoint.x, endpoint.y);
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = "#8ff7ff";
        ctx.beginPath();
        ctx.arc(0, 0, endpoint.radius * 1.65, 0, TWO_PI);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#b8fcff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, pulseRadius, 0, TWO_PI);
        ctx.stroke();
        ctx.strokeStyle = "#7be4ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, endpoint.radius * 0.72, 0, TWO_PI);
        ctx.stroke();
        ctx.fillStyle = "#dffcff";
        ctx.fillRect(-4, -endpoint.radius - 18, 8, endpoint.radius + 8);
        ctx.fillRect(-4, 10, 8, endpoint.radius - 4);
        ctx.restore();
      }
    }

    if (run.pickups.length > 0 || run.player.buffs.magnetField > 0) {
      const comboBonus = Math.min(140, run.stats.combo * 2.4);
      const buffBonus = run.player.buffs.magnetField > 0 ? 220 : 0;
      const radius = run.player.stats.pickupRadius + comboBonus + buffBonus;
      ctx.strokeStyle = run.player.buffs.magnetField > 0 ? "rgba(156, 230, 255, 0.34)" : "rgba(124, 223, 255, 0.18)";
      ctx.lineWidth = run.player.buffs.magnetField > 0 ? 2.5 : 1.5;
      ctx.globalAlpha = 0.22 + (run.player.buffs.magnetField > 0 ? 0.08 : 0);
      ctx.beginPath();
      ctx.arc(run.player.x, run.player.y, radius, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const pod of run.supplyPods) {
      const type = SUPPLY_POD_TYPES[pod.type];
      const bob = Math.sin(game.time * 2.5 + pod.pulse) * 3;
      ctx.save();
      ctx.translate(pod.x, pod.y + bob);
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = type.color;
      ctx.fillRect(-3, -96, 6, 74);
      ctx.beginPath();
      ctx.arc(0, 0, pod.radius * 1.45, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, pod.radius, 0, TWO_PI);
      ctx.stroke();
      ctx.fillStyle = type.color;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(13, -3);
      ctx.lineTo(8, 15);
      ctx.lineTo(-8, 15);
      ctx.lineTo(-13, -3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = type.accent;
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }

    for (const pickup of run.pickups) {
      ctx.save();
      ctx.translate(pickup.x, pickup.y);
      ctx.globalAlpha = pickup.magnetized ? 0.34 : 0.2;
      ctx.fillStyle = pickup.glow;
      ctx.beginPath();
      ctx.arc(0, 0, pickup.radius * (pickup.magnetized ? 2.35 : 1.7), 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.rotate(pickup.pulse * 0.22);
      ctx.fillStyle = pickup.color;
      ctx.beginPath();
      ctx.moveTo(0, -pickup.radius);
      ctx.lineTo(pickup.radius, 0);
      ctx.lineTo(0, pickup.radius);
      ctx.lineTo(-pickup.radius, 0);
      ctx.closePath();
      ctx.fill();
      if (pickup.magnetized) {
        ctx.strokeStyle = pickup.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, pickup.radius + 4, 0, TWO_PI);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const beam of run.beams) {
      ctx.strokeStyle = beam.color;
      ctx.globalAlpha = (beam.life / (beam.maxLife || 0.16)) * (beam.alpha || 1);
      ctx.lineWidth = beam.width || 3;
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const projectile of run.projectiles) {
      renderProjectileSprite(ctx, projectile, false);
    }

    for (const projectile of run.enemyProjectiles) {
      renderProjectileSprite(ctx, projectile, true);
    }

    for (const orbital of run.orbitals) {
      ctx.fillStyle = "#d9f5ff";
      ctx.beginPath();
      ctx.arc(orbital.x, orbital.y, 7, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = "#7ed8ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(orbital.x, orbital.y, 10, 0, TWO_PI);
      ctx.stroke();
    }

    for (const drone of run.drones) {
      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.rotate(game.time * (drone.source === "ability" ? 5 : 3));
      ctx.fillStyle = drone.source === "ability" ? "#f1fdff" : "#9ad7ff";
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(9, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (const tower of run.towers) {
      renderTower(ctx, tower);
    }

    for (const enemy of run.enemies) {
      renderEnemy(ctx, enemy);
    }

    if (run.objective.type === "escort") {
      for (const vehicle of run.objective.convoy) {
        renderConvoyVehicle(ctx, vehicle);
      }
    }

    for (const ghost of run.afterimages) {
      renderAfterimage(ctx, ghost);
    }

    renderAimGuide(ctx, run);
    renderPlayer(ctx, run.player);

    for (const ring of run.rings) {
      renderEffectRing(ctx, ring);
    }

    for (const floater of run.floaters) {
      ctx.globalAlpha = floater.life / floater.maxLife;
      ctx.fillStyle = floater.color;
      ctx.strokeStyle = "rgba(5, 10, 18, 0.88)";
      ctx.lineWidth = 3;
      ctx.font = `700 ${Math.round(13 * floater.scale)}px Segoe UI`;
      ctx.textAlign = "center";
      ctx.strokeText(floater.text, floater.x, floater.y);
      ctx.fillText(floater.text, floater.x, floater.y);
      ctx.globalAlpha = 1;
    }

    for (const particle of run.particles) {
      ctx.globalAlpha = particle.life / particle.maxLife;
      if (particle.glow > 0) {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = (particle.life / particle.maxLife) * 0.16;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size + particle.glow * 0.12, 0, TWO_PI);
        ctx.fill();
        ctx.globalAlpha = particle.life / particle.maxLife;
      }
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (run.boss && run.boss.beam) {
      const beam = run.boss.beam;
      const x2 = run.boss.x + Math.cos(beam.angle) * beam.length;
      const y2 = run.boss.y + Math.sin(beam.angle) * beam.length;
      ctx.strokeStyle = beam.stage === "charge" ? "rgba(154, 234, 255, 0.45)" : "rgba(154, 234, 255, 0.85)";
      ctx.lineWidth = beam.stage === "charge" ? beam.width : beam.width * 1.2;
      ctx.beginPath();
      ctx.moveTo(run.boss.x, run.boss.y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
    renderMissionOverlay(run);
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

  function renderEnemy(ctx, enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.facing || 0);
    const color = enemy.hitFlash > 0 ? "#ffffff" : enemy.color;
    ctx.fillStyle = color;
    ctx.strokeStyle = enemy.elite ? "#fff0b2" : "#152030";
    ctx.lineWidth = enemy.type === "boss" ? 4 : 2.5;

    if (enemy.type === "boss") {
      ctx.beginPath();
      ctx.moveTo(enemy.radius, 0);
      for (let index = 1; index < 10; index += 1) {
        const angle = (index / 10) * TWO_PI;
        const radius = enemy.radius - (index % 2 === 0 ? 10 : 0);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.kind === "crawler") {
      ctx.beginPath();
      ctx.moveTo(enemy.radius, 0);
      ctx.lineTo(-enemy.radius * 0.7, enemy.radius * 0.7);
      ctx.lineTo(-enemy.radius * 0.3, 0);
      ctx.lineTo(-enemy.radius * 0.7, -enemy.radius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.kind === "raider") {
      ctx.beginPath();
      ctx.moveTo(enemy.radius, 0);
      ctx.lineTo(0, enemy.radius * 0.9);
      ctx.lineTo(-enemy.radius, 0);
      ctx.lineTo(0, -enemy.radius * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.kind === "gunner") {
      ctx.fillRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      ctx.strokeRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
    } else if (enemy.kind === "mortar") {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#fff0b2";
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 0.45, 0, TWO_PI);
      ctx.stroke();
    } else if (enemy.kind === "wasp") {
      ctx.beginPath();
      ctx.moveTo(enemy.radius, 0);
      ctx.lineTo(0, enemy.radius * 0.6);
      ctx.lineTo(-enemy.radius, 0);
      ctx.lineTo(0, -enemy.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.kind === "sentinel") {
      ctx.beginPath();
      for (let index = 0; index < 8; index += 1) {
        const angle = (index / 8) * TWO_PI;
        const radius = enemy.radius;
        if (index === 0) {
          ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        } else {
          ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (enemy.kind === "siphon") {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(9, 13, 28, 0.92)";
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 0.34, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = "#f0d4ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 0.34, 0, TWO_PI);
      ctx.stroke();
    }

    if (enemy.shield > 0) {
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = "#9feaff";
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 6, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (enemy.commandLink > 0 || enemy.siphonInfusion > 0 || enemy.emberInfusion > 0) {
      const auraColor = enemy.emberInfusion > 0
        ? "#ff9b5c"
        : enemy.siphonInfusion > 0
          ? "#e0a0ff"
          : "#ffc18f";
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + 10, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (enemy.type === "boss" || enemy.elite || enemy.hitFlash > 0.05) {
      const width = enemy.type === "boss" ? 110 : 44;
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 22, width, 6);
      ctx.fillStyle = enemy.type === "boss" ? "#ffb36a" : "#7dd6ff";
      ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 22, width * (enemy.hp / enemy.maxHp), 6);
    }
    if (enemy.objectiveTarget) {
      ctx.strokeStyle = "#ffb889";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 10 + Math.sin(game.time * 5 + enemy.id) * 2, 0, TWO_PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - enemy.radius - 16);
      ctx.lineTo(enemy.x, enemy.y - enemy.radius - 54);
      ctx.stroke();
    }
    if (enemy.reactorFocus && game.run?.objective?.type === "defense" && !game.run.objective.complete) {
      ctx.fillStyle = "#ffe08c";
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - enemy.radius - 16);
      ctx.lineTo(enemy.x + 8, enemy.y - enemy.radius - 30);
      ctx.lineTo(enemy.x - 8, enemy.y - enemy.radius - 30);
      ctx.closePath();
      ctx.fill();
    }
    if (enemy.convoyFocus && game.run?.objective?.type === "escort" && !game.run.objective.complete) {
      ctx.fillStyle = "#ffd39a";
      ctx.beginPath();
      ctx.rect(enemy.x - 5, enemy.y - enemy.radius - 32, 10, 10);
      ctx.fill();
    }
  }

  function renderMissionOverlay(run) {
    const ctx = game.ctx;
    ctx.save();
    ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
    renderPlayerFeedbackOverlay(run);

    const objective = getPrimaryObjectivePosition(run);
    if (objective) {
      const renderCameraX = run.camera.renderX ?? run.camera.x;
      const renderCameraY = run.camera.renderY ?? run.camera.y;
      const screenX = game.width / 2 + (objective.x - renderCameraX);
      const screenY = game.height / 2 + (objective.y - renderCameraY);
      const padding = 34;
      if (screenX < padding || screenX > game.width - padding || screenY < padding || screenY > game.height - padding) {
        const angle = Math.atan2(screenY - game.height / 2, screenX - game.width / 2);
        const arrowX = clamp(game.width / 2 + Math.cos(angle) * (game.width * 0.38), padding, game.width - padding);
        const arrowY = clamp(game.height / 2 + Math.sin(angle) * (game.height * 0.38), padding, game.height - padding);
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        ctx.fillStyle = run.zone.colors.objective;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-12, 10);
        ctx.lineTo(-12, -10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    if (run.boss) {
      const width = Math.min(420, game.width - 220);
      const x = (game.width - width) / 2;
      const y = 18;
      ctx.fillStyle = "rgba(6, 12, 24, 0.82)";
      ctx.fillRect(x, y, width, 24);
      ctx.fillStyle = "#ffb36a";
      ctx.fillRect(x, y, width * (run.boss.hp / run.boss.maxHp), 24);
      ctx.strokeStyle = "#ffe1b7";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, 24);
      ctx.fillStyle = "#fff6e7";
      ctx.font = "600 14px Segoe UI";
      ctx.textAlign = "center";
      ctx.fillText(run.boss.name, game.width / 2, y - 4);
    }

    renderDefenseOverlay(run);
    renderEscortOverlay(run);
    renderModeIntroOverlay(run);
    renderBuffOverlay(run);
    renderMinimap(run);
    ctx.restore();
  }

  function renderPlayerFeedbackOverlay(run) {
    const ctx = game.ctx;
    const player = run.player;
    const hpRatio = player.hp / Math.max(1, player.stats.maxHealth);
    const lowHealth = clamp((0.36 - hpRatio) / 0.36, 0, 1);
    const damageAlpha = Math.min(0.42, player.damageFlash * 0.34 + lowHealth * 0.28);
    if (damageAlpha > 0.01) {
      const gradient = ctx.createRadialGradient(
        game.width / 2,
        game.height / 2,
        Math.min(game.width, game.height) * 0.12,
        game.width / 2,
        game.height / 2,
        Math.max(game.width, game.height) * 0.72
      );
      gradient.addColorStop(0, "rgba(255,96,96,0)");
      gradient.addColorStop(1, `rgba(255,84,84,${damageAlpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, game.width, game.height);
    }
    const shieldAlpha = Math.min(0.16, player.shieldFlash * 0.14);
    const healAlpha = Math.min(0.14, player.healFlash * 0.12);
    const comboAlpha = Math.min(0.18, player.comboFlash * 0.12 + (player.comboPower.timer > 0 ? 0.03 + 0.02 * Math.sin(game.time * 8) : 0));
    if (shieldAlpha > 0.01 || healAlpha > 0.01 || comboAlpha > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      if (shieldAlpha > 0.01) {
        const shieldGradient = ctx.createRadialGradient(game.width / 2, game.height / 2, 20, game.width / 2, game.height / 2, Math.max(game.width, game.height) * 0.52);
        shieldGradient.addColorStop(0, `rgba(140, 238, 255, ${shieldAlpha * 0.45})`);
        shieldGradient.addColorStop(1, "rgba(140, 238, 255, 0)");
        ctx.fillStyle = shieldGradient;
        ctx.fillRect(0, 0, game.width, game.height);
      }
      if (healAlpha > 0.01) {
        const healGradient = ctx.createRadialGradient(game.width / 2, game.height / 2, 18, game.width / 2, game.height / 2, Math.max(game.width, game.height) * 0.46);
        healGradient.addColorStop(0, `rgba(255, 205, 224, ${healAlpha * 0.5})`);
        healGradient.addColorStop(1, "rgba(255, 205, 224, 0)");
        ctx.fillStyle = healGradient;
        ctx.fillRect(0, 0, game.width, game.height);
      }
      if (comboAlpha > 0.01) {
        const comboColor = player.comboPower.tier >= 3 ? "#fff0a6" : player.comboPower.tier === 2 ? "#ffd391" : "#9fefff";
        ctx.globalAlpha = comboAlpha;
        ctx.fillStyle = comboColor;
        ctx.fillRect(0, 0, game.width, 3);
        ctx.fillRect(0, game.height - 3, game.width, 3);
      }
      ctx.restore();
    }
  }

  function renderDefenseOverlay(run) {
    if (run.objective.type !== "defense") {
      return;
    }
    const ctx = game.ctx;
    const reactor = run.objective.reactor;
    const width = Math.min(340, game.width - 420);
    const x = (game.width - width) / 2;
    const y = run.boss ? 52 : 18;
    ctx.fillStyle = "rgba(7, 13, 25, 0.86)";
    ctx.fillRect(x, y, width, 64);
    ctx.strokeStyle = reactor.alive ? "#9ff3ff" : "#ff8d8d";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, 64);
    ctx.fillStyle = "#f2fbff";
    ctx.font = "700 13px Segoe UI";
    ctx.textAlign = "left";
    const title = run.objective.complete ? "REACTOR SECURED" : "DRILL REACTOR CORE";
    ctx.fillText(title, x + 12, y + 16);
    ctx.font = "600 11px Segoe UI";
    ctx.fillStyle = "#8ba5c9";
    const subtitle = run.objective.complete
      ? "Signal lock complete. Finish the boss."
      : "Stand inside the cyan defense ring to reinforce shields.";
    ctx.fillText(subtitle, x + 12, y + 30);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + 12, y + 38, width - 24, 8);
    ctx.fillStyle = "#ff8e7b";
    ctx.fillRect(x + 12, y + 38, (width - 24) * (reactor.hp / reactor.maxHp), 8);
    if (reactor.maxShield > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x + 12, y + 50, width - 24, 8);
      ctx.fillStyle = "#83eaff";
      ctx.fillRect(x + 12, y + 50, (width - 24) * (reactor.shield / reactor.maxShield), 8);
    }

    ctx.fillStyle = "#ffcfbf";
    ctx.fillText(`Hull ${Math.round(reactor.hp)} / ${Math.round(reactor.maxHp)}`, x + 14, y + 61);
    ctx.textAlign = "right";
    ctx.fillStyle = "#bff7ff";
    ctx.fillText(run.objective.complete ? "Stable" : `Lock ${Math.round((run.objective.progress / run.objective.totalProgress) * 100)}%`, x + width - 14, y + 61);
  }

  function renderEscortOverlay(run) {
    if (run.objective.type !== "escort") {
      return;
    }
    const ctx = game.ctx;
    const objective = run.objective;
    const width = Math.min(368, game.width - 420);
    const x = (game.width - width) / 2;
    const y = run.boss ? 52 : 18;
    ctx.fillStyle = "rgba(7, 13, 25, 0.86)";
    ctx.fillRect(x, y, width, 74);
    ctx.strokeStyle = objective.complete ? "#a6f7c6" : "#d7dde6";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, 74);
    ctx.fillStyle = "#f2fbff";
    ctx.font = "700 13px Segoe UI";
    ctx.textAlign = "left";
    ctx.fillText(objective.complete ? "CONVOY SECURED" : "ARMORED CONVOY", x + 12, y + 16);
    ctx.font = "600 11px Segoe UI";
    ctx.fillStyle = "#8ba5c9";
    const subtitle = objective.complete
      ? "Escort complete. Boss response detected."
      : `Loss cap ${objective.allowedLossPercent}% â€¢ ${objective.survivors}/${objective.convoy.length} convoy units remaining.`;
    ctx.fillText(subtitle, x + 12, y + 30);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + 12, y + 38, width - 24, 8);
    ctx.fillStyle = "#ffcc96";
    ctx.fillRect(x + 12, y + 38, (width - 24) * (objective.currentIntegrity / objective.maxIntegrity), 8);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + 12, y + 50, width - 24, 8);
    ctx.fillStyle = "#91eaff";
    ctx.fillRect(x + 12, y + 50, (width - 24) * objective.progress, 8);

    ctx.fillStyle = "#ffd8b0";
    ctx.fillText(`Integrity ${Math.round(objective.currentIntegrity)} / ${Math.round(objective.maxIntegrity)}`, x + 14, y + 70);
    ctx.textAlign = "right";
    ctx.fillStyle = "#bff7ff";
    ctx.fillText(`Loss ${Math.round(objective.lossPercent)} / ${objective.allowedLossPercent}%`, x + width - 14, y + 70);
  }

  function renderModeIntroOverlay(run) {
    if (run.modeIntroTimer <= 0) {
      return;
    }
    const ctx = game.ctx;
    const alpha = Math.min(1, run.modeIntroTimer / 1.1);
    const mission = MISSION_TYPES[run.contract.missionType];
    const width = Math.min(520, game.width - 120);
    const x = (game.width - width) / 2;
    const y = game.height * 0.12;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(7, 12, 24, 0.88)";
    ctx.fillRect(x, y, width, 86);
    ctx.strokeStyle = run.zone.colors.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, 86);
    ctx.textAlign = "center";
    ctx.fillStyle = "#dff6ff";
    ctx.font = "700 22px Segoe UI";
    ctx.fillText(mission.name, game.width / 2, y + 28);
    ctx.font = "600 12px Segoe UI";
    ctx.fillStyle = "#9cb7dd";
    const subtitle = run.contract.missionType === "defense"
      ? "Protect the reactor core, use the support ring, then eliminate the boss."
      : run.contract.missionType === "escort"
        ? `Escort the convoy through the center lane and keep losses below ${run.contract.allowedLossPercent}%.`
      : mission.desc;
    ctx.fillText(subtitle, game.width / 2, y + 52);
    ctx.fillStyle = run.zone.colors.accent;
    ctx.fillText(`Zone: ${run.zone.name}  â€¢  Threat ${romanThreat(run.contract.threat)}`, game.width / 2, y + 72);
    ctx.globalAlpha = 1;
  }

  function getHudTopRowHeight() {
    if (!game.ui?.hud || game.ui.hud.classList.contains("hidden")) {
      return 0;
    }
    const topRow = game.ui.hud.querySelector(".hud-top-row");
    return topRow ? topRow.offsetHeight : 0;
  }

  function getHudBottomRowHeight() {
    if (!game.ui?.hud || game.ui.hud.classList.contains("hidden")) {
      return 0;
    }
    const bottomRow = game.ui.hud.querySelector(".hud-bottom-row");
    return bottomRow ? bottomRow.offsetHeight : 0;
  }

  function renderBuffOverlay(run) {
    const ctx = game.ctx;
    const buffs = [];
    for (const hot of run.player.hots) {
      buffs.push({ name: hot.name, time: hot.duration, color: hot.color });
    }
    if (run.player.comboPower.timer > 0 && run.player.comboPower.tier > 0) {
      buffs.push({
        name: `Combo Surge ${run.player.comboPower.tier}`,
        time: run.player.comboPower.timer,
        color: run.player.comboPower.tier >= 3 ? "#fff0a6" : run.player.comboPower.tier === 2 ? "#ffd391" : "#9fefff"
      });
    }
    if (run.player.buffs.overdrive > 0) {
      buffs.push({ name: "Overdrive", time: run.player.buffs.overdrive, color: "#9affcf" });
    }
    if (run.player.buffs.salvageRush > 0) {
      buffs.push({ name: "Salvage Rush", time: run.player.buffs.salvageRush, color: "#ffd790" });
    }
    if (run.player.buffs.magnetField > 0) {
      buffs.push({ name: "Magnet Field", time: run.player.buffs.magnetField, color: "#b9f2ff" });
    }
    if (run.player.prototypeWeapon) {
      buffs.push({
        name: PROTOTYPE_WEAPONS[run.player.prototypeWeapon.id].name,
        time: run.player.prototypeWeapon.time,
        color: PROTOTYPE_WEAPONS[run.player.prototypeWeapon.id].color
      });
    }
    if (!buffs.length) {
      return;
    }
    ctx.font = "600 13px Segoe UI";
    let x = 18;
    const topInset = 18;
    const startY = Math.max(run.boss ? 54 : topInset, topInset + getHudTopRowHeight() + 12);
    let y = startY;
    const columnWrapY = Math.max(startY + 120, game.height - 240);
    for (const buff of buffs) {
      const label = `${buff.name} ${buff.time.toFixed(1)}s`;
      const width = Math.max(136, ctx.measureText(label).width + 28);
      if (y + 28 > columnWrapY && x < 196) {
        x += 172;
        y = startY;
      }
      ctx.fillStyle = "rgba(6, 12, 24, 0.78)";
      ctx.fillRect(x, y, width, 28);
      ctx.strokeStyle = buff.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, width, 28);
      ctx.fillStyle = buff.color;
      ctx.textAlign = "left";
      ctx.fillText(label, x + 10, y + 18.5);
      y += 34;
    }
  }

  function renderMinimap(run) {
    const ctx = game.ctx;
    const margin = 18;
    const mapSize = Math.round(clamp(Math.min(game.width * 0.14, game.height * 0.2), 128, 168));
    const mapWidth = mapSize;
    const mapHeight = mapSize;
    const notificationHeight = game.ui?.notificationStack ? game.ui.notificationStack.offsetHeight : 0;
    const x = game.width - mapWidth - margin;
    const yMax = Math.max(margin, game.height - mapHeight - getHudBottomRowHeight() - margin);
    const y = clamp(margin + notificationHeight + (notificationHeight > 0 ? 10 : 0), margin, yMax);
    ctx.fillStyle = "rgba(6, 12, 24, 0.72)";
    ctx.fillRect(x, y, mapWidth, mapHeight);
    ctx.strokeStyle = "rgba(125, 183, 255, 0.24)";
    ctx.strokeRect(x, y, mapWidth, mapHeight);

    const scaleX = mapWidth / run.map.width;
    const scaleY = mapHeight / run.map.height;

    for (const obstacle of run.map.obstacles) {
      ctx.fillStyle = "rgba(120, 146, 170, 0.18)";
      ctx.beginPath();
      ctx.arc(x + obstacle.x * scaleX, y + obstacle.y * scaleY, Math.max(1, obstacle.radius * scaleX * 0.5), 0, TWO_PI);
      ctx.fill();
    }

    if (run.objective.type === "salvage") {
      for (const node of run.objective.nodes) {
        if (node.collected) {
          continue;
        }
        ctx.fillStyle = run.zone.colors.objective;
        ctx.fillRect(x + node.x * scaleX - 2, y + node.y * scaleY - 2, 4, 4);
      }
    }
    if (run.objective.type === "defense") {
      const reactor = run.objective.reactor;
      ctx.strokeStyle = "rgba(159, 243, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + reactor.x * scaleX, y + reactor.y * scaleY, Math.max(6, reactor.guardRadius * scaleX), 0, TWO_PI);
      ctx.stroke();
      ctx.fillStyle = "#fff0b6";
      ctx.fillRect(x + reactor.x * scaleX - 4, y + reactor.y * scaleY - 4, 8, 8);
      for (const turret of reactor.turrets) {
        ctx.fillStyle = "#9ff3ff";
        ctx.fillRect(x + turret.x * scaleX - 2, y + turret.y * scaleY - 2, 4, 4);
      }
    }
    if (run.objective.type === "escort") {
      ctx.strokeStyle = "rgba(214, 222, 232, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + run.objective.laneX * scaleX, y);
      ctx.lineTo(x + run.objective.laneX * scaleX, y + mapHeight);
      ctx.stroke();
      for (const vehicle of run.objective.convoy) {
        if (!vehicle.alive || vehicle.secured || !vehicle.deployed) {
          continue;
        }
        ctx.fillStyle = vehicle.accent;
        ctx.fillRect(x + vehicle.x * scaleX - 2.5, y + vehicle.y * scaleY - 2, 5, 4);
      }
    }
    for (const cache of run.prototypeCaches) {
      if (!cache.active) {
        continue;
      }
      ctx.fillStyle = PROTOTYPE_WEAPONS[cache.weaponId].color;
      ctx.fillRect(x + cache.x * scaleX - 2.5, y + cache.y * scaleY - 2.5, 5, 5);
    }
    for (const pair of run.teleporters) {
      if (!pair.active) {
        continue;
      }
      for (const endpoint of pair.endpoints) {
        ctx.fillStyle = "#8ff7ff";
        ctx.fillRect(x + endpoint.x * scaleX - 2.5, y + endpoint.y * scaleY - 2.5, 5, 5);
      }
    }
    for (const tower of run.towers) {
      if (!tower.alive) {
        continue;
      }
      ctx.fillStyle = tower.loadout.color;
      ctx.fillRect(x + tower.x * scaleX - 2, y + tower.y * scaleY - 2, 4, 4);
    }
    for (const anomaly of run.anomalies) {
      ctx.fillStyle = ANOMALY_TYPES[anomaly.type].color;
      ctx.fillRect(x + anomaly.x * scaleX - 1.5, y + anomaly.y * scaleY - 1.5, 3, 3);
    }
    for (const pod of run.supplyPods) {
      ctx.fillStyle = SUPPLY_POD_TYPES[pod.type].color;
      ctx.fillRect(x + pod.x * scaleX - 2.5, y + pod.y * scaleY - 2.5, 5, 5);
    }
    for (const enemy of run.enemies) {
      if (enemy.objectiveTarget || enemy.type === "boss") {
        ctx.fillStyle = enemy.type === "boss" ? "#ffb36a" : "#ff8e79";
        ctx.fillRect(x + enemy.x * scaleX - 2, y + enemy.y * scaleY - 2, enemy.type === "boss" ? 5 : 4, enemy.type === "boss" ? 5 : 4);
      }
    }
    if (run.extraction) {
      ctx.fillStyle = "#98fff5";
      ctx.fillRect(x + run.extraction.x * scaleX - 3, y + run.extraction.y * scaleY - 3, 6, 6);
    }

    ctx.fillStyle = "#f4fbff";
    ctx.fillRect(x + run.player.x * scaleX - 2, y + run.player.y * scaleY - 2, 5, 5);
  }
