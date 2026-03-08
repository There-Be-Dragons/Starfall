// Run setup, spawn direction, objective flow, damage, and relic progression.
"use strict";

  function setObjective(run) {
    const missionType = run.contract.missionType;
    if (missionType === "salvage") {
      const totalNodes = 6 + run.contract.threat;
      const nodes = [];
      for (let index = 0; index < totalNodes; index += 1) {
        const point = findOpenPoint(run, run.rng, 280);
        nodes.push({
          id: makeId(),
          x: point.x,
          y: point.y,
          radius: 48,
          collected: false
        });
      }
      run.objective = {
        type: "salvage",
        nodes,
        collected: 0,
        total: nodes.length,
        complete: false
      };
    }
    if (missionType === "hunt") {
      run.objective = {
        type: "hunt",
        total: 3 + Math.ceil(run.contract.threat / 2),
        complete: false
      };
      for (let index = 0; index < run.objective.total; index += 1) {
        const point = findOpenPoint(run, run.rng, 380);
        const eliteKind = weightedPick(run.rng, run.zone.enemyWeights);
        createEnemy(run, eliteKind, point.x, point.y, { elite: true, objectiveTarget: true });
      }
    }
    if (missionType === "defense") {
      const point = findOpenPoint(run, run.rng, 120);
      const maxHp = 480 + run.contract.threat * 120;
      const maxShield = 260 + run.contract.threat * 70;
      run.objective = {
        type: "defense",
        complete: false,
        progress: 0,
        totalProgress: 112 + run.contract.threat * 8,
        reactor: {
          x: point.x,
          y: point.y,
          radius: 86,
          hp: maxHp,
          maxHp,
          shield: maxShield,
          maxShield,
          alive: true,
          playerInRing: false,
          guardRadius: 230,
          hullRegenRate: 5 + run.contract.threat * 0.45,
          shieldRegenRate: 28 + run.contract.threat * 3,
          shieldDelayRemaining: 0,
          hitFlash: 0,
          warnFlash: 0,
          securedPulse: 0,
          lowIntegrityWarned: false,
          turrets: createDefenseTurrets(point.x, point.y, run.rng)
        }
      };
      run.player.x = point.x - 120;
      run.player.y = point.y;
      run.map.spawn.x = run.player.x;
      run.map.spawn.y = run.player.y;
      run.camera.x = run.player.x;
      run.camera.y = run.player.y;
    }
    if (missionType === "escort") {
      run.objective = createEscortObjective(run);
      run.player.x = run.objective.laneX - 160;
      run.player.y = clamp(run.objective.startFrontY - run.objective.direction * 70, 120, run.map.height - 120);
      run.map.spawn.x = run.player.x;
      run.map.spawn.y = run.player.y;
      run.camera.x = run.player.x;
      run.camera.y = run.player.y;
    }
  }

  function createRun(contract) {
    const zone = ZONE_DATA[contract.zoneId];
    const rng = createRng(contract.seed);
    const openingWaveDuration = 17 + rng.range(0, 5);
    const map = {
      width: 2400,
      height: 2400,
      obstacles: [],
      spawn: { x: 1200, y: 1200 }
    };
    const run = {
      id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      contract: { ...contract, mutators: contract.mutators.slice() },
      zone,
      rng,
      map,
      time: 0,
      player: null,
      camera: { x: 0, y: 0 },
      enemies: [],
      projectiles: [],
      enemyProjectiles: [],
      pickups: [],
      supplyPods: [],
      prototypeCaches: [],
      anomalies: [],
      teleporters: [],
      towers: [],
      particles: [],
      rings: [],
      afterimages: [],
      floaters: [],
      hazards: [],
      orbitals: [],
      drones: [],
      beams: [],
      fields: [],
      objective: null,
      boss: null,
      extraction: null,
      modeIntroTimer: 6.5,
      pendingLevelUps: 0,
      currentLevelChoices: [],
      summary: null,
      stats: {
        kills: 0,
        elites: 0,
        shots: 0,
        hits: 0,
        damageDone: 0,
        damageTaken: 0,
        bossDamageTaken: 0,
        enemiesSpawned: 0,
        combo: 0,
        comboTimer: 0,
        bestCombo: 0,
        bossKilled: false,
        scrapCollected: 0,
        pickupsCollected: 0,
        supplyPodsOpened: 0,
        towersBuilt: 0
      },
      rewards: {
        scrap: 0,
        cores: 0,
        renown: 0
      },
      towerLimit: contract.missionType === "defense" ? 4 : contract.missionType === "escort" ? 4 : 3,
      towerBaseCost: contract.missionType === "defense" ? 28 : contract.missionType === "escort" ? 30 : 34,
      towerCostIncrement: 18,
      spawnState: {
        timer: 1.2,
        eliteTimer: 14,
        supplyTimer: 24 + Math.random() * 10,
        comboRewardThreshold: 20,
        zoneHazardTimer: 8 + Math.random() * 5,
        stormTimer: 5.5 + Math.random() * 4,
        gameLevel: 1,
        adaptivePressure: 0,
        objectivePressure: 0,
        phase: "build",
        phaseTimer: openingWaveDuration,
        phaseDuration: openingWaveDuration,
        waveCycle: 0,
        pendingEliteAfterLull: false
      },
      flags: {
        bossPhase: false,
        objectivePhaseComplete: false,
        finalized: false
      }
    };
    run.map = buildMap(run, rng);
    run.player = createPlayer(game.save, game.save.selectedClass, run.map.spawn.x, run.map.spawn.y);
    run.camera.x = run.player.x;
    run.camera.y = run.player.y;
    setObjective(run);
    spawnLevelFeatures(run);
    spawnAmbientWave(run, 5 + run.contract.threat);
    refreshSupportUnits(run);
    return run;
  }

  function getRunRelicCount(run) {
    if (!run?.player?.relics) {
      return 0;
    }
    return Object.values(run.player.relics).reduce((sum, stacks) => sum + stacks, 0);
  }

  function getObjectivePressure(run) {
    if (!run?.objective) {
      return 0;
    }
    if (run.flags?.objectivePhaseComplete || run.boss) {
      return 1;
    }
    if (run.objective.type === "salvage") {
      return clamp(run.objective.collected / Math.max(1, run.objective.total), 0, 1);
    }
    if (run.objective.type === "hunt") {
      const remaining = run.enemies.filter((enemy) => enemy.alive && enemy.objectiveTarget).length;
      return clamp(1 - remaining / Math.max(1, run.objective.total), 0, 1);
    }
    if (run.objective.type === "defense") {
      return clamp(run.objective.progress / Math.max(1, run.objective.totalProgress), 0, 1);
    }
    if (run.objective.type === "escort") {
      const lossPressure = clamp(run.objective.lossPercent / Math.max(1, run.objective.allowedLossPercent), 0, 1) * 0.12;
      return clamp(run.objective.progress + lossPressure, 0, 1);
    }
    return 0;
  }

  function getRunGameLevel(run) {
    return 1 + Math.floor(getRunRelicCount(run) / 3);
  }

  function getAdaptiveSpawnPressure(run) {
    const gameLevel = getRunGameLevel(run);
    const objectivePressure = getObjectivePressure(run);
    const levelPressure = Math.max(0, run.player.level - 1) * 0.02;
    const relicPressure = Math.max(0, gameLevel - 1) * 0.1;
    const timePressure = Math.min(0.18, run.time * 0.0012);
    const bossBrake = run.boss ? -0.06 : 0;
    return {
      gameLevel,
      objectivePressure,
      value: clamp(relicPressure + levelPressure + objectivePressure * 0.48 + timePressure + bossBrake, 0, 1.25)
    };
  }

  function rollSpawnPhaseDuration(run, phase) {
    if (phase === "surge") {
      return run.rng.range(9.5, 13.5);
    }
    if (phase === "lull") {
      return run.rng.range(2.6, 4.2);
    }
    const cycleTrim = Math.min(3.4, (run.spawnState?.waveCycle || 0) * 0.18);
    const progressTrim = Math.min(2.2, getObjectivePressure(run) * 2.6);
    return clamp(run.rng.range(16, 22) - cycleTrim - progressTrim, 11.5, 22);
  }

  function setSpawnPhase(run, phase) {
    const duration = rollSpawnPhaseDuration(run, phase);
    run.spawnState.phase = phase;
    run.spawnState.phaseTimer = duration;
    run.spawnState.phaseDuration = duration;
  }

  function getSpawnPhaseProfile(run) {
    const state = run.spawnState;
    const phase = state?.phase || "build";
    const duration = Math.max(0.001, state?.phaseDuration || 1);
    const phaseProgress = 1 - clamp((state?.phaseTimer || 0) / duration, 0, 1);
    const cyclePressure = Math.min(0.28, (state?.waveCycle || 0) * 0.025);
    if (phase === "surge") {
      return {
        phase,
        intervalMultiplier: clamp(0.8 - cyclePressure * 0.12 - phaseProgress * 0.08, 0.62, 0.8),
        intensityMultiplier: 1.18 + cyclePressure * 0.34 + phaseProgress * 0.22,
        maxEnemiesMultiplier: 1.1 + cyclePressure * 0.22,
        eliteChanceBonus: 0.03 + cyclePressure * 0.04 + phaseProgress * 0.03
      };
    }
    if (phase === "lull") {
      return {
        phase,
        intervalMultiplier: 1.7,
        intensityMultiplier: 0.36,
        maxEnemiesMultiplier: 0.74,
        eliteChanceBonus: 0
      };
    }
    return {
      phase,
      intervalMultiplier: clamp(1.04 - phaseProgress * 0.12 - cyclePressure * 0.12, 0.86, 1.04),
      intensityMultiplier: 0.96 + cyclePressure * 0.18 + phaseProgress * 0.12,
      maxEnemiesMultiplier: 1 + cyclePressure * 0.08,
      eliteChanceBonus: 0.01 + cyclePressure * 0.02
    };
  }

  function advanceSpawnPhase(run) {
    const state = run.spawnState;
    if (state.phase === "build") {
      const pressure = getAdaptiveSpawnPressure(run);
      state.pendingEliteAfterLull = run.rng.chance(0.22 + Math.min(0.28, pressure.value * 0.18 + pressure.gameLevel * 0.03));
      setSpawnPhase(run, "surge");
      return;
    }
    if (state.phase === "surge") {
      setSpawnPhase(run, "lull");
      return;
    }
    state.waveCycle += 1;
    setSpawnPhase(run, "build");
    if (state.pendingEliteAfterLull && !run.extraction && !run.boss) {
      spawnAmbientWave(run, 2.1 + run.contract.threat + state.gameLevel * 0.4, true, {
        forceEliteCount: 1,
        countMultiplier: 0.72,
        maxEnemiesMultiplier: 1.05,
        extraEliteChance: 0.06
      });
    }
    state.pendingEliteAfterLull = false;
  }

  function syncSpawnDirector(run, dt = 0) {
    if (!run?.spawnState) {
      return;
    }
    const state = run.spawnState;
    const pressure = getAdaptiveSpawnPressure(run);
    state.gameLevel = pressure.gameLevel;
    state.objectivePressure = pressure.objectivePressure;
    state.adaptivePressure = pressure.value;
    if (dt <= 0) {
      return;
    }
    state.phaseTimer -= dt;
    while (state.phaseTimer <= 0) {
      const overflow = -state.phaseTimer;
      advanceSpawnPhase(run);
      state.phaseTimer -= overflow;
    }
  }

  function spawnAmbientWave(run, intensity, forceElite = false, options = {}) {
    syncSpawnDirector(run, 0);
    const spawnState = run.spawnState;
    const phaseProfile = getSpawnPhaseProfile(run);
    const defenseCrowdFactor = run.objective.type === "defense" && !run.objective.complete ? 0.78 : 1;
    const escortCrowdFactor = run.objective.type === "escort" && !run.objective.complete ? 0.86 : 1;
    const maxEnemies = Math.round((38 + run.contract.threat * 10 + (run.contract.mutators.includes("swarm") ? 12 : 0))
      * defenseCrowdFactor
      * escortCrowdFactor
      * (1 + spawnState.adaptivePressure * 0.16)
      * phaseProfile.maxEnemiesMultiplier
      * (options.maxEnemiesMultiplier || 1));
    if (run.enemies.filter((enemy) => enemy.alive && enemy.type !== "boss").length >= maxEnemies) {
      return;
    }
    const multiplier = run.contract.mutators.includes("swarm") ? 1.35 : 1;
    const defenseFactor = run.objective.type === "defense" && !run.objective.complete ? 0.82 : 1;
    const escortFactor = run.objective.type === "escort" && !run.objective.complete ? 0.88 : 1;
    const minCount = phaseProfile.phase === "lull" ? 1 : 2;
    const count = Math.max(minCount, Math.round(intensity
      * 0.58
      * multiplier
      * defenseFactor
      * escortFactor
      * (1 + spawnState.adaptivePressure * 0.16)
      * phaseProfile.intensityMultiplier
      * (options.countMultiplier || 1)));
    const forcedEliteCount = forceElite ? clamp(Math.round(options.forceEliteCount || 1), 1, count) : 0;
    const hunterEliteChance = run.contract.mutators.includes("hunter")
      ? 0.12 + spawnState.adaptivePressure * 0.04 + phaseProfile.eliteChanceBonus * 0.5
      : 0;
    const eliteChance = Math.min(0.32,
      Math.max(0, (run.contract.threat - 3) * 0.08)
      + spawnState.adaptivePressure * 0.06
      + spawnState.objectivePressure * 0.04
      + phaseProfile.eliteChanceBonus
      + (options.extraEliteChance || 0));
    for (let index = 0; index < count; index += 1) {
      const target = run.objective.type === "defense"
        ? run.objective.reactor
        : run.objective.type === "escort" && !run.objective.complete
          ? (getEscortObjectiveCenter(run) || run.player)
          : run.player;
      const spawnDistance = run.rng.range(760, 980);
      const angle = run.rng.range(0, TWO_PI);
      const x = clamp(target.x + Math.cos(angle) * spawnDistance, 80, run.map.width - 80);
      const y = clamp(target.y + Math.sin(angle) * spawnDistance, 80, run.map.height - 80);
      if (pointBlocked(run.map, x, y, 22)) {
        continue;
      }
      const kind = weightedPick(run.rng, run.zone.enemyWeights);
      const elite = index < forcedEliteCount
        || run.rng.chance(hunterEliteChance)
        || run.rng.chance(eliteChance);
      const reactorFocusChance = run.objective.type === "defense" && !run.objective.complete
        ? {
          crawler: 0.46,
          raider: 0.38,
          sentinel: 0.24,
          siphon: 0.18,
          mortar: 0.1,
          gunner: 0.08,
          wasp: 0.06
        }[kind] || 0
        : 0;
      const convoyFocusChance = run.objective.type === "escort" && !run.objective.complete
        ? {
          crawler: 0.52,
          raider: 0.44,
          mortar: 0.24,
          siphon: 0.22,
          sentinel: 0.2,
          gunner: 0.16,
          wasp: 0.1
        }[kind] || 0
        : 0;
      createEnemy(run, kind, x, y, {
        elite,
        reactorFocus: run.rng.chance(reactorFocusChance),
        convoyFocus: run.rng.chance(convoyFocusChance)
      });
    }
  }

  function updateEscortObjective(run, dt) {
    const objective = run.objective;
    if (!objective || objective.type !== "escort" || run.flags.finalized) {
      return;
    }
    for (const vehicle of objective.convoy) {
      vehicle.flash = Math.max(0, vehicle.flash - dt);
      if (!vehicle.alive || vehicle.secured) {
        continue;
      }
      vehicle.x = objective.laneX + vehicle.laneOffset + Math.sin(run.time * 0.45 + vehicle.id) * 6;
      vehicle.y += objective.direction * objective.moveSpeed * dt;
      if (!vehicle.deployed && ((objective.direction > 0 && vehicle.y >= objective.entryY) || (objective.direction < 0 && vehicle.y <= objective.entryY))) {
        vehicle.deployed = true;
        vehicle.flash = Math.max(vehicle.flash, 0.2);
      }
      if ((objective.direction > 0 && vehicle.y >= objective.destinationY) || (objective.direction < 0 && vehicle.y <= objective.destinationY)) {
        vehicle.y = objective.destinationY;
        vehicle.secured = true;
      }
    }
    updateEscortIntegrity(run);
    if (objective.lossPercent >= objective.allowedLossPercent) {
      game.failRun(`Convoy losses reached ${Math.round(objective.lossPercent)}% and breached the contract cap.`);
      return;
    }
    const remaining = getActiveConvoyVehicles(run);
    const pending = getPendingConvoyVehicles(run);
    if (!remaining.length && !pending.length) {
      objective.complete = objective.securedCount > 0;
      if (!objective.complete) {
        game.failRun("The convoy was wiped out before reaching the destination.");
      }
    }
  }

  function handleObjectiveProgress(run, dt) {
    if (run.objective.complete || run.boss || run.extraction) {
      return;
    }
    if (run.objective.type === "salvage") {
      for (const node of run.objective.nodes) {
        if (node.collected) {
          continue;
        }
        if (distance(node.x, node.y, run.player.x, run.player.y) < node.radius + run.player.radius) {
          node.collected = true;
          run.objective.collected += 1;
          run.rewards.scrap += Math.round(18 * run.player.stats.scrapGain);
          run.stats.scrapCollected += Math.round(18 * run.player.stats.scrapGain);
          const salvagePressure = clamp(run.objective.collected / Math.max(1, run.objective.total), 0, 1);
          spawnAmbientWave(run, 4.2 + run.contract.threat + salvagePressure * 1.4, true, {
            countMultiplier: 1.25,
            forceEliteCount: salvagePressure >= 0.72 ? 2 : 1,
            maxEnemiesMultiplier: 1.12,
            extraEliteChance: salvagePressure * 0.05
          });
          burstParticles(run, node.x, node.y, run.zone.colors.objective, 18, 20, 180, 2, 5, 0.25, 0.7);
          game.playSfx("collect");
          game.pushNotification("Cache Secured", `${run.objective.collected} / ${run.objective.total} wreck cores retrieved.`, "success");
        }
      }
      if (run.objective.collected >= run.objective.total) {
        run.objective.complete = true;
      }
    }
    if (run.objective.type === "hunt") {
      const remaining = run.enemies.filter((enemy) => enemy.alive && enemy.objectiveTarget).length;
      if (remaining === 0) {
        run.objective.complete = true;
      }
    }
    if (run.objective.type === "defense") {
      if (run.objective.reactor.alive) {
        const reactor = run.objective.reactor;
        const supportBonus = reactor.playerInRing ? 1.18 : 1;
        run.objective.progress += dt * (1.35 + run.contract.threat * 0.08) * supportBonus;
        if (run.objective.progress >= run.objective.totalProgress) {
          run.objective.complete = true;
        }
      }
    }
    if (run.objective.type === "escort") {
      updateEscortObjective(run, dt);
      if (run.flags.finalized) {
        return;
      }
    }

    if (run.objective.complete) {
      run.flags.objectivePhaseComplete = true;
      if (run.objective.type === "defense") {
        const reactor = run.objective.reactor;
        reactor.shield = reactor.maxShield;
        reactor.warnFlash = 0;
        game.pushNotification("Reactor Secured", "Signal lock complete. The reactor is now stable while you eliminate the boss.", "success");
      }
      if (run.objective.type === "escort") {
        for (const vehicle of run.objective.convoy) {
          if (vehicle.alive) {
            vehicle.secured = true;
          }
        }
        game.pushNotification("Convoy Secured", `Escort losses held to ${Math.round(run.objective.lossPercent)}%. Eliminate the boss response.`, "success");
      }
      createBoss(run);
      game.pushNotification("Primary Objective Complete", "Command confirmed a boss-level response.", "warn");
    }
  }

  function applyLifesteal(run, amount) {
    if (run.player.stats.lifesteal <= 0) {
      return;
    }
    healPlayer(run, amount * run.player.stats.lifesteal);
  }

  function chainLightning(run, sourceEnemy, damage, chainsRemaining, visited) {
    if (chainsRemaining <= 0) {
      return;
    }
    let nextTarget = null;
    let nextDistance = 220 * 220;
    for (const enemy of run.enemies) {
      if (!enemy.alive || visited.has(enemy.id) || enemy.id === sourceEnemy.id) {
        continue;
      }
      const distSq = distanceSq(sourceEnemy.x, sourceEnemy.y, enemy.x, enemy.y);
      if (distSq < nextDistance) {
        nextDistance = distSq;
        nextTarget = enemy;
      }
    }
    if (!nextTarget) {
      return;
    }
    visited.add(nextTarget.id);
    run.beams.push({
      id: makeId(),
      x1: sourceEnemy.x,
      y1: sourceEnemy.y,
      x2: nextTarget.x,
      y2: nextTarget.y,
      color: "#8fe5ff",
      life: 0.16
    });
    damageEnemy(run, nextTarget, damage * run.player.stats.chainDamageMultiplier, {
      source: "chain",
      canCrit: false,
      burnChance: 0,
      slowChance: 0,
      knockback: 60,
      chainLeft: 0
    });
    chainLightning(run, nextTarget, damage * run.player.stats.chainDamageMultiplier, chainsRemaining - 1, visited);
  }

  function damageEnemy(run, enemy, amount, details) {
    if (!enemy.alive) {
      return;
    }
    if (details.source === "tower" && details.towerId && Math.random() < 0.45) {
      enemy.towerAggro = Math.max(enemy.towerAggro || 0, 3.8);
      enemy.towerAggroTargetId = details.towerId;
    } else if (details.source !== "turret") {
      enemy.playerAggro = Math.max(enemy.playerAggro || 0, 4.2);
    }
    let damage = amount;
    let totalApplied = 0;
    let crit = false;
    if (details.canCrit !== false && Math.random() < run.player.stats.critChance) {
      damage *= run.player.stats.critMultiplier;
      crit = true;
    }
    if (enemy.type === "boss") {
      damage *= run.player.stats.bossDamageMultiplier;
    }
    if (enemy.shield > 0) {
      const shieldDamage = Math.min(enemy.shield, damage);
      enemy.shield -= shieldDamage;
      damage -= shieldDamage;
      totalApplied += shieldDamage;
    }
    if (damage > 0) {
      enemy.hp -= damage;
      totalApplied += damage;
    }
    enemy.hitFlash = crit ? 0.3 : 0.16;
    run.stats.damageDone += totalApplied;
    run.stats.hits += 1;
    if (totalApplied > 0.5) {
      spawnFloater(
        run,
        `${Math.max(1, Math.round(totalApplied))}${crit ? "!" : ""}`,
        enemy.x,
        enemy.y - enemy.radius - 6,
        crit ? "#fff1a8" : enemy.type === "boss" ? "#ffd2a0" : "#ffffff",
        crit ? 1.18 : enemy.type === "boss" ? 1.02 : 0.92,
        crit ? 0.82 : 0.68
      );
    }
    if (details.source !== "tower" && details.source !== "turret") {
      applyLifesteal(run, totalApplied);
    }
    if (details.burnChance && Math.random() < details.burnChance) {
      applyBurn(enemy, totalApplied * 0.16);
    }
    if (details.slowChance && Math.random() < details.slowChance) {
      applySlow(enemy);
    }
    if (run.player.relicSynergies?.thermalShock && enemy.burnTimer > 0 && enemy.slowTimer > 0 && enemy.thermalShockCooldown <= 0) {
      enemy.thermalShockCooldown = 0.5;
      spawnHazard(run, {
        x: enemy.x,
        y: enemy.y,
        radius: 54,
        damage: 12 + run.player.level * 1.1,
        delay: 0,
        duration: 0.22,
        source: "player",
        color: "#ffd0a0",
        knockback: 120
      });
      spawnFloater(run, "Thermal Shock", enemy.x, enemy.y - enemy.radius - 18, "#ffe6bf", 0.88, 0.7);
    }
    if (details.knockback) {
      const attackerX = details.attackerX ?? run.player.x;
      const attackerY = details.attackerY ?? run.player.y;
      const direction = normalize(enemy.x - attackerX, enemy.y - attackerY);
      enemy.vx += direction.x * details.knockback;
      enemy.vy += direction.y * details.knockback;
    }
    burstParticles(run, enemy.x, enemy.y, crit ? "#fff2ac" : enemy.type === "boss" ? "#ffb86a" : enemy.color, crit ? 10 : 6, 15, 90, 1.8, 3.8, 0.18, 0.36);
    if (crit || totalApplied >= (enemy.type === "boss" ? 6 : 12)) {
      spawnEffectRing(run, {
        x: enemy.x,
        y: enemy.y,
        radius: enemy.radius * 0.55,
        growth: crit ? 170 : enemy.type === "boss" ? 145 : 120,
        life: crit ? 0.2 : 0.16,
        color: crit ? "#fff2ac" : enemy.type === "boss" ? "#ffbf8e" : enemy.color,
        lineWidth: crit ? 2.8 : 2.1,
        fillAlpha: crit ? 0.12 : 0.06
      });
    }
    if (crit) {
      game.addScreenShake(enemy.type === "boss" ? 7 : 3);
    }
    if (details.chainLeft > 0) {
      chainLightning(run, enemy, totalApplied, details.chainLeft, new Set([enemy.id]));
    }
    if (enemy.hp <= 0) {
      killEnemy(run, enemy);
    }
  }

  function killEnemy(run, enemy) {
    if (!enemy.alive) {
      return;
    }
    enemy.alive = false;
    run.stats.kills += 1;
    run.stats.combo += 1;
    run.stats.comboTimer = 4.6;
    run.stats.bestCombo = Math.max(run.stats.bestCombo, run.stats.combo);
    updateComboPowerFromStreak(run);
    run.player.comboFlash = Math.max(run.player.comboFlash, enemy.type === "boss" ? 0.6 : enemy.elite ? 0.22 : 0.08);
    if (enemy.elite) {
      run.stats.elites += 1;
    }
    burstParticles(run, enemy.x, enemy.y, enemy.type === "boss" ? "#ffd09f" : enemy.color, enemy.type === "boss" ? 40 : 14, 30, 220, 2, 5.5, 0.3, 0.8);
    spawnEffectRing(run, {
      x: enemy.x,
      y: enemy.y,
      radius: enemy.radius * 0.8,
      growth: enemy.type === "boss" ? 280 : enemy.elite ? 190 : 130,
      life: enemy.type === "boss" ? 0.55 : enemy.elite ? 0.34 : 0.24,
      color: enemy.type === "boss" ? "#ffd09f" : enemy.color,
      lineWidth: enemy.type === "boss" ? 5 : enemy.elite ? 3.2 : 2.2,
      fillAlpha: enemy.type === "boss" ? 0.14 : 0.08
    });
    if (enemy.type === "boss") {
      game.addScreenShake(22);
    } else if (enemy.elite) {
      game.addScreenShake(10);
    }
    dropEnemyLoot(run, enemy);
    if (run.contract.mutators.includes("volatile") && enemy.type !== "boss") {
      spawnHazard(run, {
        x: enemy.x,
        y: enemy.y,
        radius: 58,
        damage: 16 + run.contract.threat * 3,
        delay: 0.25,
        duration: 0.35,
        source: "enemy",
        color: "#ff9a6f",
        knockback: 200
      });
    }
    if (run.player.stats.deathExplosion > 0) {
      spawnHazard(run, {
        x: enemy.x,
        y: enemy.y,
        radius: 54 + run.player.stats.deathExplosion * 16,
        damage: 22 + run.player.stats.deathExplosion * 12,
        delay: 0,
        duration: 0.35,
        source: "player",
        color: "#7ed8ff",
        knockback: 220
      });
    }
    if (enemy.objectiveTarget && run.objective.type === "hunt") {
      game.pushNotification("Lieutenant Down", "Another target eliminated.", "success");
    }
    if (enemy.type === "boss") {
      run.stats.bossKilled = true;
      run.boss = null;
      game.playSfx("bossDown");
      run.extraction = {
        x: enemy.x,
        y: enemy.y,
        radius: 88,
        progress: 0
      };
      game.pushNotification("Extraction Beacon Online", "Stand inside the beacon to extract with your haul.", "success");
    }
  }

  function damagePlayer(run, amount, source, position) {
    if (run.player.invuln > 0) {
      return;
    }
    let damage = amount;
    const comboPower = getComboPowerModifiers(run);
    const armorFactor = 100 / (100 + (run.player.stats.armor + comboPower.armorBonus) * 6);
    damage *= armorFactor;
    if (run.player.inBastion) {
      damage *= 0.72;
    }
    let totalApplied = 0;
    const shieldBefore = run.player.shield;
    let absorbed = 0;
    if (run.player.shield > 0) {
      absorbed = Math.min(run.player.shield, damage);
      run.player.shield -= absorbed;
      damage -= absorbed;
      totalApplied += absorbed;
    }
    if (damage > 0) {
      run.player.hp -= damage;
      totalApplied += damage;
    }
    const shieldBroken = shieldBefore > 0 && run.player.shield <= 0;
    run.player.shieldDelayRemaining = run.player.stats.shieldRegenDelay;
    run.stats.damageTaken += amount;
    if (run.flags.bossPhase) {
      run.stats.bossDamageTaken += amount;
    }
    burstParticles(run, run.player.x, run.player.y, "#ff8f8f", 10, 30, 180, 2, 4.5, 0.2, 0.5);
    if (totalApplied > 0.5) {
      spawnFloater(
        run,
        `-${Math.max(1, Math.round(totalApplied))}`,
        run.player.x,
        run.player.y - run.player.radius - 8,
        damage > 0 ? "#ffb1b1" : "#9de6ff",
        damage > 0 ? 1.02 : 0.92,
        0.7
      );
    }
    run.player.damageFlash = Math.max(run.player.damageFlash, damage > 0 ? 0.72 : 0.3);
    if (absorbed > 0) {
      spawnEffectRing(run, {
        x: run.player.x,
        y: run.player.y,
        radius: run.player.radius + 5,
        growth: 110,
        life: 0.16,
        color: "#9feaff",
        lineWidth: 2.2,
        fillAlpha: 0.08
      });
    }
    if (damage > 0) {
      spawnEffectRing(run, {
        x: run.player.x,
        y: run.player.y,
        radius: run.player.radius + 8,
        growth: 145,
        life: 0.22,
        color: "#ff8f8f",
        lineWidth: 2.8,
        fillAlpha: 0.12
      });
    }
    if (shieldBroken) {
      spawnEffectRing(run, {
        x: run.player.x,
        y: run.player.y,
        radius: run.player.radius + 10,
        growth: 180,
        life: 0.26,
        color: "#86e8ff",
        lineWidth: 3.2,
        fillAlpha: 0.14
      });
      game.playSfx("shieldBreak");
    }
    game.addScreenShake(10);
    game.playSfx("hurt");

    if (run.player.hp <= 0 && run.player.stats.cheatDeath > 0) {
      run.player.stats.cheatDeath -= 1;
      run.player.hp = run.player.stats.maxHealth * 0.45;
      run.player.shield = run.player.stats.maxShield * 0.45;
      run.player.invuln = 2;
      emitPulse(run, run.player.x, run.player.y, 180, 70, "player", "#ffd980", 0.6);
      game.pushNotification("Phoenix Core Triggered", "Catastrophic damage avoided.", "warn");
      return;
    }
    if (position) {
      const direction = normalize(run.player.x - position.x, run.player.y - position.y);
      run.player.vx += direction.x * 120;
      run.player.vy += direction.y * 120;
    }
    if (run.player.hp <= 0) {
      run.player.hp = 0;
      game.failRun("You were destroyed in the field.");
    }
  }

  function collectPickup(run, pickup) {
    if (!pickup.alive) {
      return;
    }
    pickup.alive = false;
    run.stats.pickupsCollected += 1;
    spawnEffectRing(run, {
      x: run.player.x,
      y: run.player.y,
      radius: pickup.radius + 4,
      growth: 92,
      life: 0.18,
      color: pickup.color,
      lineWidth: 2,
      fillAlpha: 0.08
    });
    if (pickup.type === "xp") {
      gainXp(run, pickup.value);
      game.playSfx("xp");
      if (pickup.value >= 30) {
        spawnFloater(run, `+${pickup.value} XP`, run.player.x, run.player.y - 14, "#a8ffd1", 0.9, 0.7);
      }
    }
    if (pickup.type === "scrap") {
      run.rewards.scrap += pickup.value;
      run.stats.scrapCollected += pickup.value;
      game.playSfx("collect");
      if (pickup.value >= 8) {
        spawnFloater(run, `+${pickup.value} Scrap`, run.player.x, run.player.y - 14, "#a8d8ff", 0.92, 0.8);
      }
    }
    if (pickup.type === "heal") {
      healPlayer(run, pickup.value);
      game.playSfx("heal");
      spawnFloater(run, `+${pickup.value} Hull`, run.player.x, run.player.y - 14, "#ffccd4", 0.96, 0.8);
    }
    if (pickup.type === "shield") {
      grantShield(run, pickup.value);
      game.playSfx("heal");
      spawnFloater(run, `+${pickup.value} Shield`, run.player.x, run.player.y - 14, "#b8f5ff", 0.96, 0.8);
    }
    if (pickup.type === "core") {
      run.rewards.cores += pickup.value;
      game.playSfx("collect");
      spawnFloater(run, `+${pickup.value} Core`, run.player.x, run.player.y - 14, "#fff0b6", 1, 0.85);
    }
  }

  function gainXp(run, amount) {
    const scaled = amount * run.player.stats.xpGain;
    run.player.xp += scaled;
    while (run.player.xp >= run.player.xpToNext) {
      run.player.xp -= run.player.xpToNext;
      run.player.level += 1;
      run.player.xpToNext = Math.round(run.player.xpToNext * 1.2 + 18);
      healPlayer(run, run.player.stats.maxHealth * 0.08);
      grantShield(run, run.player.stats.maxShield * 0.15);
      run.pendingLevelUps += 1;
      notifyAbilityUnlocks(run);
      run.player.comboFlash = Math.max(run.player.comboFlash, 0.35);
      spawnEffectRing(run, {
        x: run.player.x,
        y: run.player.y,
        radius: run.player.radius + 12,
        growth: 210,
        life: 0.4,
        color: "#a8ffd1",
        lineWidth: 3.4,
        fillAlpha: 0.12
      });
      burstParticles(run, run.player.x, run.player.y, "#bfffd8", 26, 24, 190, 2, 5.8, 0.22, 0.6);
      game.addScreenShake(8);
      game.playSfx("levelUp");
      game.pushNotification("Signal Cache Found", "Choose a relic upgrade.", "success");
    }
    if (run.pendingLevelUps > 0 && !game.activeModal) {
      game.openLevelUp();
    }
  }

  function getAvailableRelics(run) {
    return RELICS.filter((relic) => (run.player.relics[relic.id] || 0) < relic.maxStacks);
  }

  function rollRelicChoices(run) {
    const pool = getAvailableRelics(run).slice();
    const choices = [];
    while (choices.length < 3 && pool.length > 0) {
      const pickId = weightedPick(run.rng, pool.map((relic) => ({
        id: relic.id,
        weight: RELIC_RARITY_WEIGHT[relic.rarity] / (1 + (run.player.relics[relic.id] || 0))
      })));
      const index = pool.findIndex((relic) => relic.id === pickId);
      choices.push(pool[index]);
      pool.splice(index, 1);
    }
    return choices;
  }

  function applyRelic(run, relicId, options = {}) {
    const relic = RELIC_MAP[relicId];
    run.player.relics[relicId] = (run.player.relics[relicId] || 0) + 1;
    if (!run.player.relicOrder.includes(relicId)) {
      run.player.relicOrder.push(relicId);
    }
    if (options.isEcho) {
      run.player.echoRelics[relicId] = true;
    }
    relic.apply(game, run, run.player.relics[relicId]);
    run.player.hp = clamp(run.player.hp, 0, run.player.stats.maxHealth);
    run.player.shield = clamp(run.player.shield, 0, run.player.stats.maxShield);
    refreshSupportUnits(run);
    syncSpawnDirector(run, 0);
    if (!options.deferSynergy) {
      checkRelicSynergies(run, { announce: !options.silent, render: false });
    }
    if (!options.silent) {
      game.renderRelicStrip();
      game.pushNotification("Relic Online", `${relic.name}: ${relic.desc}`, "success");
    }
  }

  function getArchiveCandidates(run) {
    return run.player.relicOrder
      .map((relicId) => ({
        id: relicId,
        stacks: run.player.relics[relicId],
        rarity: RELIC_MAP[relicId].rarity
      }))
      .sort((left, right) => {
        const rarityDiff = RELIC_RARITY_WEIGHT[right.rarity] - RELIC_RARITY_WEIGHT[left.rarity];
        if (rarityDiff !== 0) {
          return rarityDiff;
        }
        return right.stacks - left.stacks;
      })
      .slice(0, 4);
  }

  function addRelicToArchive(save, relicId) {
    const archive = save.relicArchive;
    const existing = archive.relics.find((entry) => entry.id === relicId);
    if (existing) {
      existing.stacks = clamp(existing.stacks + 1, 1, 2);
      existing.updatedAt = Date.now();
      return { upgraded: true, replaced: null, entry: existing };
    }
    let replaced = null;
    if (archive.relics.length >= archive.capacity) {
      archive.relics.sort((left, right) => (left.updatedAt || 0) - (right.updatedAt || 0));
      replaced = archive.relics.shift();
    }
    const entry = {
      id: relicId,
      stacks: 1,
      updatedAt: Date.now()
    };
    archive.relics.push(entry);
    return { upgraded: false, replaced, entry };
  }

  function pushSupportBeam(run, x1, y1, x2, y2, color, life = 0.14) {
    run.beams.push({
      id: makeId(),
      x1,
      y1,
      x2,
      y2,
      color,
      life,
      maxLife: life
    });
  }

  function fireBeamLaser(run, config) {
    const x1 = config.x;
    const y1 = config.y;
    const x2 = x1 + Math.cos(config.angle) * config.length;
    const y2 = y1 + Math.sin(config.angle) * config.length;

    run.beams.push({
      id: makeId(),
      x1,
      y1,
      x2,
      y2,
      color: config.color,
      life: 0.16,
      maxLife: 0.16,
      width: config.width,
      alpha: 0.72
    });
    run.beams.push({
      id: makeId(),
      x1,
      y1,
      x2,
      y2,
      color: "#f6ffff",
      life: 0.1,
      maxLife: 0.1,
      width: Math.max(3, config.width * 0.42),
      alpha: 0.96
    });
    spawnEffectRing(run, {
      x: x1,
      y: y1,
      radius: Math.max(10, config.width * 0.9),
      growth: 120,
      life: 0.18,
      color: config.color,
      lineWidth: 2.8,
      fillAlpha: 0.12
    });

    for (const enemy of run.enemies) {
      if (!enemy.alive) {
        continue;
      }
      if (pointToSegmentDistance(enemy.x, enemy.y, x1, y1, x2, y2) <= config.width + enemy.radius) {
        damageEnemy(run, enemy, config.damage, {
          source: config.source,
          towerId: config.towerId,
          attackerX: x1,
          attackerY: y1,
          canCrit: false,
          burnChance: config.burnChance || 0,
          slowChance: config.slowChance || 0,
          knockback: config.knockback || 90,
          chainLeft: config.chainLeft || 0
        });
      }
    }

    const hostileProjectiles = config.source === "player" || config.source === "tower"
      ? run.enemyProjectiles
      : run.projectiles;
    for (const projectile of hostileProjectiles) {
      if (projectile.life <= 0) {
        continue;
      }
      if (!projectile.shootable && !projectile.missile) {
        continue;
      }
      if (pointToSegmentDistance(projectile.x, projectile.y, x1, y1, x2, y2) <= config.width + projectile.radius) {
        if (projectile.missile) {
          projectile.missileHp -= 999;
          explodeProjectile(run, projectile, config.source !== "player" && config.source !== "tower", 0.65);
        }
        projectile.life = -1;
      }
    }

    burstParticles(run, x1, y1, config.color, 10, 12, 90, 1.5, 3.4, 0.14, 0.28);
    burstParticles(run, x2, y2, config.color, 8, 10, 70, 1.4, 3, 0.12, 0.24);
    spawnEffectRing(run, {
      x: x2,
      y: y2,
      radius: Math.max(8, config.width * 0.55),
      growth: 80,
      life: 0.12,
      color: "#f6ffff",
      lineWidth: 2,
      fillAlpha: 0.08
    });
  }

  function restoreEnemyIntegrity(target, hpAmount = 0, shieldAmount = 0) {
    if (!target) {
      return;
    }
    if (hpAmount > 0) {
      target.hp = clamp(target.hp + hpAmount, 0, target.maxHp);
    }
    if (shieldAmount > 0) {
      target.maxShield = Math.max(target.maxShield || 0, shieldAmount > 0 ? target.maxHp * 0.2 : target.maxShield || 0);
      target.shield = clamp((target.shield || 0) + shieldAmount, 0, target.maxShield || shieldAmount);
    }
  }

  function checkRelicSynergies(run, options = {}) {
    const activated = [];
    for (const synergy of RELIC_SYNERGIES) {
      if (run.player.relicSynergies[synergy.id]) {
        continue;
      }
      const active = synergy.requiredRelics.every((relicId) => (run.player.relics[relicId] || 0) > 0);
      if (!active) {
        continue;
      }
      run.player.relicSynergies[synergy.id] = true;
      run.player.synergyOrder.push(synergy.id);
      synergy.activate(run);
      activated.push(synergy);
      if (options.announce !== false) {
        game.pushNotification("Set Bonus Online", `${synergy.name}: ${synergy.desc}`, "success");
      }
    }
    if (activated.length) {
      refreshSupportUnits(run);
      if (options.render !== false) {
        game.renderRelicStrip();
      }
    }
    return activated;
  }

  function applyArchivedRelicsToRun(save, run) {
    if (!save.relicArchive.relics.length) {
      return;
    }
    for (const entry of save.relicArchive.relics) {
      for (let stack = 0; stack < entry.stacks; stack += 1) {
        applyRelic(run, entry.id, { silent: true, isEcho: true, deferSynergy: true });
      }
    }
    checkRelicSynergies(run, { announce: true, render: false });
    game.renderRelicStrip();
    game.pushNotification(
      "Echo Archive Linked",
      save.relicArchive.relics.map((entry) => `${RELIC_MAP[entry.id].name}${entry.stacks > 1 ? ` x${entry.stacks}` : ""}`).join(", "),
      "success"
    );
  }
