// Core render orchestration for backdrops, mission drawing, and mission overlays.
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
