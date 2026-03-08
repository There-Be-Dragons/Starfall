// Mission overlay and HUD-adjacent rendering helpers.
"use strict";

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

  function getWrappedOverlayLines(ctx, text, maxWidth) {
    const words = String(text).split(" ");
    const lines = [];
    let currentLine = "";
    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (currentLine && ctx.measureText(candidate).width > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines.length ? lines : [String(text)];
  }

  function drawWrappedOverlayText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = getWrappedOverlayLines(ctx, text, maxWidth);
    for (let index = 0; index < lines.length; index += 1) {
      ctx.fillText(lines[index], x, y + index * lineHeight);
    }
    return lines.length;
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
    const subtitle = run.objective.complete
      ? "Signal lock complete. Finish the boss."
      : "Stand inside the cyan defense ring to reinforce shields.";
    ctx.font = "600 11px Segoe UI";
    const subtitleLines = getWrappedOverlayLines(ctx, subtitle, width - 24);
    const barsY = y + 38 + (subtitleLines.length - 1) * 12;
    const panelHeight = barsY - y + 26;
    ctx.fillStyle = "rgba(7, 13, 25, 0.86)";
    ctx.fillRect(x, y, width, panelHeight);
    ctx.strokeStyle = reactor.alive ? "#9ff3ff" : "#ff8d8d";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, panelHeight);
    ctx.fillStyle = "#f2fbff";
    ctx.font = "700 13px Segoe UI";
    ctx.textAlign = "left";
    const title = run.objective.complete ? "REACTOR SECURED" : "DRILL REACTOR CORE";
    ctx.fillText(title, x + 12, y + 16);
    ctx.font = "600 11px Segoe UI";
    ctx.fillStyle = "#8ba5c9";
    drawWrappedOverlayText(ctx, subtitle, x + 12, y + 30, width - 24, 12);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + 12, barsY, width - 24, 8);
    ctx.fillStyle = "#ff8e7b";
    ctx.fillRect(x + 12, barsY, (width - 24) * (reactor.hp / reactor.maxHp), 8);
    if (reactor.maxShield > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x + 12, barsY + 12, width - 24, 8);
      ctx.fillStyle = "#83eaff";
      ctx.fillRect(x + 12, barsY + 12, (width - 24) * (reactor.shield / reactor.maxShield), 8);
    }

    ctx.fillStyle = "#ffcfbf";
    ctx.fillText(`Hull ${Math.round(reactor.hp)} / ${Math.round(reactor.maxHp)}`, x + 14, barsY + 23);
    ctx.textAlign = "right";
    ctx.fillStyle = "#bff7ff";
    ctx.fillText(run.objective.complete ? "Stable" : `Lock ${Math.round((run.objective.progress / run.objective.totalProgress) * 100)}%`, x + width - 14, barsY + 23);
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
    const subtitle = objective.complete
      ? "Escort complete. Boss response detected."
      : `Loss cap ${objective.allowedLossPercent}% • ${objective.survivors}/${objective.convoy.length} convoy units remaining.`;
    ctx.font = "600 11px Segoe UI";
    const subtitleLines = getWrappedOverlayLines(ctx, subtitle, width - 24);
    const barsY = y + 38 + (subtitleLines.length - 1) * 12;
    const panelHeight = barsY - y + 36;
    ctx.fillStyle = "rgba(7, 13, 25, 0.86)";
    ctx.fillRect(x, y, width, panelHeight);
    ctx.strokeStyle = objective.complete ? "#a6f7c6" : "#d7dde6";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, panelHeight);
    ctx.fillStyle = "#f2fbff";
    ctx.font = "700 13px Segoe UI";
    ctx.textAlign = "left";
    ctx.fillText(objective.complete ? "CONVOY SECURED" : "ARMORED CONVOY", x + 12, y + 16);
    ctx.font = "600 11px Segoe UI";
    ctx.fillStyle = "#8ba5c9";
    drawWrappedOverlayText(ctx, subtitle, x + 12, y + 30, width - 24, 12);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + 12, barsY, width - 24, 8);
    ctx.fillStyle = "#ffcc96";
    ctx.fillRect(x + 12, barsY, (width - 24) * (objective.currentIntegrity / objective.maxIntegrity), 8);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x + 12, barsY + 12, width - 24, 8);
    ctx.fillStyle = "#91eaff";
    ctx.fillRect(x + 12, barsY + 12, (width - 24) * objective.progress, 8);

    ctx.fillStyle = "#ffd8b0";
    ctx.fillText(`Integrity ${Math.round(objective.currentIntegrity)} / ${Math.round(objective.maxIntegrity)}`, x + 14, barsY + 32);
    ctx.textAlign = "right";
    ctx.fillStyle = "#bff7ff";
    ctx.fillText(`Loss ${Math.round(objective.lossPercent)} / ${objective.allowedLossPercent}%`, x + width - 14, barsY + 32);
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
    const subtitle = run.contract.missionType === "defense"
      ? "Protect the reactor core, use the support ring, then eliminate the boss."
      : run.contract.missionType === "escort"
        ? `Escort the convoy through the central freight channel and keep losses below ${run.contract.allowedLossPercent}%.`
        : mission.desc;
    ctx.font = "600 12px Segoe UI";
    const panelHeight = 84 + (getWrappedOverlayLines(ctx, subtitle, width - 60).length - 1) * 14;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(7, 12, 24, 0.88)";
    ctx.fillRect(x, y, width, panelHeight);
    ctx.strokeStyle = run.zone.colors.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, panelHeight);
    ctx.textAlign = "center";
    ctx.fillStyle = "#dff6ff";
    ctx.font = "700 22px Segoe UI";
    ctx.fillText(mission.name, game.width / 2, y + 28);
    ctx.font = "600 12px Segoe UI";
    ctx.fillStyle = "#9cb7dd";
    drawWrappedOverlayText(ctx, subtitle, game.width / 2, y + 52, width - 60, 14);
    ctx.fillStyle = run.zone.colors.accent;
    ctx.fillText(`Zone: ${run.zone.name}  •  Threat ${romanThreat(run.contract.threat)}`, game.width / 2, y + panelHeight - 14);
    ctx.globalAlpha = 1;
  }

  function renderExtractionGuidance(run) {
    if (!run.extraction) {
      return;
    }
    const ctx = game.ctx;
    const renderCameraX = run.camera.renderX ?? run.camera.x;
    const renderCameraY = run.camera.renderY ?? run.camera.y;
    const playerScreenX = game.width / 2 + (run.player.x - renderCameraX);
    const playerScreenY = game.height / 2 + (run.player.y - renderCameraY);
    const extractionScreenX = game.width / 2 + (run.extraction.x - renderCameraX);
    const extractionScreenY = game.height / 2 + (run.extraction.y - renderCameraY);
    const padding = 48;
    const markerX = clamp(extractionScreenX, padding, game.width - padding);
    const markerY = clamp(extractionScreenY, padding, game.height - padding);
    const offscreen = extractionScreenX < padding || extractionScreenX > game.width - padding || extractionScreenY < padding || extractionScreenY > game.height - padding;
    const urgency = clamp(1 - run.extraction.timeRemaining / Math.max(0.001, run.extraction.timeLimit), 0, 1);
    const color = run.extraction.timeRemaining <= 5 ? "#ffd08b" : "#98fff5";

    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.34 + urgency * 0.24;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(playerScreenX, playerScreenY);
    ctx.lineTo(markerX, markerY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.translate(markerX, markerY);
    if (offscreen) {
      ctx.rotate(Math.atan2(extractionScreenY - playerScreenY, extractionScreenX - playerScreenX));
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(13, 0);
    ctx.lineTo(0, 13);
    ctx.lineTo(-13, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#08111f";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = color;
    ctx.font = "700 12px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("EXTRACT", markerX, markerY - 18);
    ctx.font = "600 11px Segoe UI";
    ctx.fillStyle = "#dffbff";
    ctx.fillText(formatTime(run.extraction.timeRemaining), markerX, markerY + 28);
    ctx.restore();
  }

  function renderExtractionOverlay(run) {
    if (!run.extraction) {
      return;
    }
    const ctx = game.ctx;
    const extraction = run.extraction;
    const timeRatio = clamp(extraction.timeRemaining / Math.max(0.001, extraction.timeLimit), 0, 1);
    const boardRatio = clamp(extraction.progress / Math.max(0.001, extraction.holdDuration), 0, 1);
    const critical = extraction.timeRemaining <= 5;
    const width = Math.min(500, game.width - 120);
    const height = 108;
    const x = (game.width - width) / 2;
    const y = clamp(game.height * 0.22, 132, game.height - height - 110);
    const color = critical ? "#ffd08b" : "#98fff5";

    ctx.save();
    ctx.fillStyle = critical ? "rgba(25, 14, 9, 0.92)" : "rgba(7, 12, 24, 0.9)";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = critical ? 3 : 2;
    ctx.strokeRect(x, y, width, height);

    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.font = "700 18px Segoe UI";
    ctx.fillText(critical ? "EXTRACT NOW" : "EXTRACTION WINDOW", game.width / 2, y + 23);
    ctx.font = "700 30px Segoe UI";
    ctx.fillStyle = "#f2fffe";
    ctx.fillText(formatTime(extraction.timeRemaining), game.width / 2, y + 54);
    ctx.font = "600 11px Segoe UI";
    ctx.fillStyle = "#b9d3ec";
    ctx.fillText("Miss it: contract still clears, but no Echo archive is secured.", game.width / 2, y + 71);

    const barX = x + 92;
    const barWidth = width - 108;
    ctx.textAlign = "left";
    ctx.fillStyle = "#9bb6cf";
    ctx.fillText("Window", x + 16, y + 88);
    ctx.fillText("Board", x + 16, y + 102);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(barX, y + 79, barWidth, 8);
    ctx.fillRect(barX, y + 93, barWidth, 8);
    ctx.fillStyle = critical ? "#ffb36a" : "#86fff0";
    ctx.fillRect(barX, y + 79, barWidth * timeRatio, 8);
    ctx.fillStyle = "#dffbff";
    ctx.fillRect(barX, y + 93, barWidth * boardRatio, 8);
    ctx.restore();
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
      buffs.push({ name: "Recovery Rush", time: run.player.buffs.salvageRush, color: "#ffd790" });
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
      ctx.fillStyle = "rgba(143, 228, 255, 0.12)";
      ctx.fillRect(x + run.objective.laneX * scaleX - 5, y, 10, mapHeight);
      ctx.strokeStyle = "rgba(214, 245, 255, 0.24)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + run.objective.laneX * scaleX, y);
      ctx.lineTo(x + run.objective.laneX * scaleX, y + mapHeight);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 217, 160, 0.75)";
      ctx.fillRect(x + run.objective.laneX * scaleX - 10, y + run.objective.destinationY * scaleY - 1.5, 20, 3);
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
      const pulseRadius = 5 + Math.sin(game.time * 5) * 1.6;
      ctx.strokeStyle = "#98fff5";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x + run.extraction.x * scaleX, y + run.extraction.y * scaleY, pulseRadius, 0, TWO_PI);
      ctx.stroke();
      ctx.fillStyle = "#98fff5";
      ctx.fillRect(x + run.extraction.x * scaleX - 3, y + run.extraction.y * scaleY - 3, 6, 6);
    }

    ctx.fillStyle = "#f4fbff";
    ctx.fillRect(x + run.player.x * scaleX - 2, y + run.player.y * scaleY - 2, 5, 5);
  }
