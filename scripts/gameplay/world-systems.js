// World generation, escort logic, and defense tower systems.
"use strict";

  function createPlayer(save, classId, spawnX, spawnY) {
    const classData = CLASS_DATA[classId];
    const base = classData.baseStats;
    const stats = {
      maxHealth: base.maxHealth,
      maxShield: base.maxShield,
      damage: base.damage,
      fireRate: base.fireRate,
      moveSpeed: base.moveSpeed,
      armor: base.armor,
      critChance: base.critChance,
      critMultiplier: base.critMultiplier,
      pickupRadius: base.pickupRadius,
      projectileSpeed: base.projectileSpeed,
      projectileSize: 1,
      dashCooldown: base.dashCooldown,
      abilityCooldown: base.abilityCooldown,
      dashSpeed: 900,
      xpGain: 1,
      scrapGain: 1,
      bossDamageMultiplier: 1,
      burnChance: 0,
      slowChance: 0,
      towerLimitBonus: 0,
      towerCooldown: 15,
      towerCostMultiplier: 1,
      projectiles: 1,
      pierce: 0,
      chainCount: classData.weapon === "arc" ? 1 : 0,
      chainDamageMultiplier: 0.55,
      lifesteal: 0,
      orbitals: 0,
      drones: 0,
      dashMine: 0,
      deathExplosion: 0,
      healRegen: 0,
      shieldRegenRate: 18,
      shieldRegenDelay: 2.4,
      supportDamageMultiplier: 1,
      supportFireRateMultiplier: 1,
      cheatDeath: 0,
      abilityBlast: 0
    };
    upgradePlayerStatsFromMeta(save, stats);
    return {
      id: makeId(),
      type: "player",
      classId,
      x: spawnX,
      y: spawnY,
      radius: 18,
      hp: stats.maxHealth,
      shield: stats.maxShield,
      vx: 0,
      vy: 0,
      facing: 0,
      fireCooldown: 0,
      dashCooldownRemaining: 0,
      towerCooldownRemaining: 0,
      dashTime: 0,
      dashDirection: { x: 1, y: 0 },
      invuln: 0,
      shieldDelayRemaining: 0,
      autoFire: save.options.defaultAutoFire,
      xp: 0,
      xpToNext: 90,
      level: 1,
      relics: {},
      relicOrder: [],
      echoRelics: {},
      relicSynergies: {},
      synergyOrder: [],
      barrelSwap: false,
      weaponFlash: 0,
      damageFlash: 0,
      healFlash: 0,
      shieldFlash: 0,
      comboFlash: 0,
      dashFlash: 0,
      afterimageTimer: 0,
      economyHintAt: 0,
      comboPower: {
        tier: 0,
        timer: 0
      },
      hots: [],
      abilityCooldowns: {
        q: 0.5,
        e: 0,
        r: 0,
        t: 0
      },
      abilityUnlockSeen: {
        q: true,
        e: false,
        r: false,
        t: false
      },
      prototypeWeapon: null,
      buffs: {
        overdrive: 0,
        salvageRush: 0,
        magnetField: 0
      },
      stats
    };
  }

  function buildMap(run, rng) {
    const width = 3200 + run.contract.threat * 220;
    const height = 3200 + run.contract.threat * 220;
    const map = {
      width,
      height,
      obstacles: [],
      spawn: { x: width * 0.5, y: height * 0.5 }
    };
    for (let index = 0; index < 60 + run.contract.threat * 8; index += 1) {
      const radius = rng.range(34, 110);
      const x = rng.range(130, width - 130);
      const y = rng.range(130, height - 130);
      if (distance(x, y, map.spawn.x, map.spawn.y) < 280) {
        continue;
      }
      if (run.contract.missionType === "escort" && Math.abs(x - width * 0.5) < 240 + radius) {
        continue;
      }
      map.obstacles.push({
        id: makeId(),
        x,
        y,
        radius,
        wobble: rng.range(0, 1000)
      });
    }
    return map;
  }

  function pointBlocked(map, x, y, radius) {
    if (x < radius + 24 || y < radius + 24 || x > map.width - radius - 24 || y > map.height - radius - 24) {
      return true;
    }
    for (const obstacle of map.obstacles) {
      if (distanceSq(x, y, obstacle.x, obstacle.y) < (radius + obstacle.radius + 28) ** 2) {
        return true;
      }
    }
    return false;
  }

  function findOpenPoint(run, rng, minimumDistanceFromPlayer = 0) {
    for (let tries = 0; tries < 200; tries += 1) {
      const x = rng.range(110, run.map.width - 110);
      const y = rng.range(110, run.map.height - 110);
      if (distance(x, y, run.map.spawn.x, run.map.spawn.y) < minimumDistanceFromPlayer) {
        continue;
      }
      if (!pointBlocked(run.map, x, y, 52)) {
        return { x, y };
      }
    }
    return { x: run.map.width * 0.5, y: run.map.height * 0.5 };
  }

  function findOpenPointNear(run, rng, originX, originY, minDistance, maxDistance) {
    for (let tries = 0; tries < 100; tries += 1) {
      const angle = rng.range(0, TWO_PI);
      const distanceFromOrigin = rng.range(minDistance, maxDistance);
      const x = clamp(originX + Math.cos(angle) * distanceFromOrigin, 90, run.map.width - 90);
      const y = clamp(originY + Math.sin(angle) * distanceFromOrigin, 90, run.map.height - 90);
      if (!pointBlocked(run.map, x, y, 40)) {
        return { x, y };
      }
    }
    return findOpenPoint(run, rng, minDistance);
  }

  function getEscortLaneCenterX(run) {
    return run.map.width * 0.5;
  }

  function getActiveConvoyVehicles(run) {
    if (!run || run.objective?.type !== "escort") {
      return [];
    }
    return run.objective.convoy.filter((vehicle) => vehicle.alive && vehicle.deployed && !vehicle.secured);
  }

  function getPendingConvoyVehicles(run) {
    if (!run || run.objective?.type !== "escort") {
      return [];
    }
    return run.objective.convoy.filter((vehicle) => vehicle.alive && !vehicle.deployed && !vehicle.secured);
  }

  function getConvoyVehicleRouteProgress(objective, vehicle) {
    const positionY = vehicle.secured ? objective.destinationY : vehicle.y;
    const traveled = clamp((positionY - objective.startFrontY) * objective.direction, 0, objective.totalDistance);
    return traveled / Math.max(1, objective.totalDistance);
  }

  function getEscortObjectiveCenter(run) {
    if (!run || run.objective?.type !== "escort") {
      return null;
    }
    const activeVehicles = getActiveConvoyVehicles(run);
    const source = activeVehicles.length ? activeVehicles : run.objective.convoy.filter((vehicle) => vehicle.secured);
    if (!source.length) {
      return {
        x: run.objective.laneX,
        y: run.objective.destinationY
      };
    }
    const x = source.reduce((sum, vehicle) => sum + vehicle.x, 0) / source.length;
    const y = source.reduce((sum, vehicle) => sum + vehicle.y, 0) / source.length;
    return { x, y };
  }

  function getEscortTargetVehicle(run, enemy = null) {
    const activeVehicles = getActiveConvoyVehicles(run);
    if (!activeVehicles.length) {
      return null;
    }
    if (!enemy) {
      return activeVehicles[0];
    }
    let best = null;
    let bestScore = -Infinity;
    for (const vehicle of activeVehicles) {
      const distanceToVehicle = distance(enemy.x, enemy.y, vehicle.x, vehicle.y);
      const frontBias = run.objective.direction > 0 ? vehicle.y : (run.map.height - vehicle.y);
      const score = frontBias * 0.04 - distanceToVehicle - (vehicle.hp / vehicle.maxHp) * 16;
      if (score > bestScore) {
        bestScore = score;
        best = vehicle;
      }
    }
    return best;
  }

  function updateEscortIntegrity(run) {
    if (!run || run.objective?.type !== "escort") {
      return;
    }
    const objective = run.objective;
    objective.currentIntegrity = objective.convoy.reduce((sum, vehicle) => sum + Math.max(0, vehicle.hp), 0);
    objective.lossPercent = clamp((1 - objective.currentIntegrity / Math.max(1, objective.maxIntegrity)) * 100, 0, 100);
    objective.survivors = objective.convoy.filter((vehicle) => vehicle.alive || vehicle.secured).length;
    objective.securedCount = objective.convoy.filter((vehicle) => vehicle.secured).length;
    for (const vehicle of objective.convoy) {
      if (vehicle.deployed || vehicle.secured) {
        vehicle.routeProgress = Math.max(vehicle.routeProgress || 0, getConvoyVehicleRouteProgress(objective, vehicle));
      }
    }
    const totalProgress = objective.convoy.reduce((sum, vehicle) => sum + (vehicle.routeProgress || 0), 0);
    objective.progress = clamp(totalProgress / Math.max(1, objective.convoy.length), 0, 1);
  }

  function createEscortObjective(run) {
    const laneX = getEscortLaneCenterX(run);
    const direction = run.rng.chance(0.5) ? 1 : -1;
    const startFrontY = direction > 0 ? 380 : run.map.height - 380;
    const entryY = direction > 0 ? 88 : run.map.height - 88;
    const destinationY = direction > 0 ? run.map.height - 140 : 140;
    const spacing = 96;
    const laneOffsets = [-72, 72, -36, 36];
    const totalVehicles = 12;
    const vehicleMaxHp = 270 + run.contract.threat * 38;
    const vehicleArmor = 6 + run.contract.threat * 1.2;
    const convoy = Array.from({ length: totalVehicles }, (_, index) => {
      const laneOffset = laneOffsets[index % laneOffsets.length];
      const y = startFrontY - direction * index * spacing;
      const deployed = direction > 0 ? y >= entryY : y <= entryY;
      return {
      id: makeId(),
      type: "convoy",
      x: laneX + laneOffset,
      y,
      laneOffset,
      radius: 26,
      width: 38,
      length: 74,
      hp: vehicleMaxHp,
      maxHp: vehicleMaxHp,
      armor: vehicleArmor,
      alive: true,
      deployed,
      secured: false,
      flash: 0,
      routeProgress: 0,
      hullVariant: index % 3,
      color: index % 2 === 0 ? "#dfe6ec" : "#cfd9e4",
      accent: index % 2 === 0 ? "#8fe4ff" : "#ffd79f",
      facing: direction > 0 ? Math.PI / 2 : -Math.PI / 2
      };
    });
    const objective = {
      type: "escort",
      complete: false,
      laneX,
      direction,
      startFrontY,
      entryY,
      destinationY,
      totalDistance: Math.abs(destinationY - startFrontY),
      moveSpeed: 42 + run.contract.threat * 2.8,
      allowedLossPercent: run.contract.allowedLossPercent || 40,
      convoy,
      maxIntegrity: convoy.reduce((sum, vehicle) => sum + vehicle.maxHp, 0),
      currentIntegrity: 0,
      lossPercent: 0,
      survivors: convoy.length,
      securedCount: 0,
      progress: 0
    };
    objective.currentIntegrity = objective.maxIntegrity;
    return objective;
  }

  function damageConvoyVehicle(run, vehicle, amount, position = null) {
    if (!vehicle || !vehicle.alive || vehicle.secured || run.flags.finalized) {
      return;
    }
    const armorFactor = 100 / (100 + (vehicle.armor || 0) * 6);
    const appliedDamage = amount * armorFactor;
    vehicle.hp = Math.max(0, vehicle.hp - appliedDamage);
    vehicle.flash = 0.45;
    burstParticles(run, vehicle.x, vehicle.y, "#ffd4c2", 8, 16, 90, 1.8, 4, 0.16, 0.34);
    spawnFloater(run, `-${Math.max(1, Math.round(appliedDamage))}`, vehicle.x, vehicle.y - vehicle.radius - 10, "#ffd3c2", 0.86, 0.62);
    if (position) {
      const direction = normalize(vehicle.x - position.x, vehicle.y - position.y);
      vehicle.x = clamp(vehicle.x + direction.x * 4, vehicle.radius + 22, run.map.width - vehicle.radius - 22);
    }
    if (vehicle.hp <= 0) {
      vehicle.hp = 0;
      vehicle.alive = false;
      burstParticles(run, vehicle.x, vehicle.y, vehicle.accent, 26, 22, 170, 2, 5, 0.2, 0.5);
      game.pushNotification("Freighter Lost", "A convoy freighter has been destroyed.", "warn");
    }
    updateEscortIntegrity(run);
    if (run.objective.type === "escort" && run.objective.lossPercent >= run.objective.allowedLossPercent) {
      game.failRun(`Convoy losses reached ${Math.round(run.objective.lossPercent)}% and breached the contract cap.`);
    }
  }

  function getTowerDeployCost(run) {
    if (!run?.player) {
      return run.towerBaseCost + run.stats.towersBuilt * run.towerCostIncrement;
    }
    return Math.max(18, Math.round((run.towerBaseCost + run.stats.towersBuilt * run.towerCostIncrement) * run.player.stats.towerCostMultiplier));
  }

  function getTowerDeployCooldown(run) {
    return Math.max(4.5, run?.player?.stats?.towerCooldown || 15);
  }

  function getTowerDeployLimit(run) {
    if (!run?.player) {
      return run?.baseTowerLimit || 0;
    }
    const levelBonus = Math.floor(Math.max(0, run.player.level - 1) / 5);
    return clamp((run.baseTowerLimit || 0) + levelBonus + Math.round(run.player.stats.towerLimitBonus || 0), 1, 18);
  }

  function snapshotTowerLoadout(player) {
    return {
      classId: player.classId,
      weapon: CLASS_DATA[player.classId].weapon,
      color: CLASS_DATA[player.classId].color,
      damage: player.stats.damage * 0.58,
      fireRate: player.stats.fireRate * 0.72,
      projectileSpeed: player.stats.projectileSpeed,
      projectileSize: Math.min(player.stats.projectileSize, 1.18),
      projectiles: Math.min(player.stats.projectiles, 3),
      pierce: Math.min(player.stats.pierce, 1),
      burnChance: player.stats.burnChance * 0.9,
      slowChance: player.stats.slowChance * 0.9,
      chainCount: Math.min(player.stats.chainCount, 2),
      prototypeWeaponId: player.prototypeWeapon?.id || null
    };
  }

  function canPlaceTowerAt(run, x, y, radius = 24) {
    if (pointBlocked(run.map, x, y, radius)) {
      return false;
    }
    if (run.objective.type === "defense") {
      const reactor = run.objective.reactor;
      if (distance(x, y, reactor.x, reactor.y) < reactor.radius + radius + 28) {
        return false;
      }
    }
    if (run.objective.type === "escort" && !run.objective.complete) {
      if (Math.abs(x - run.objective.laneX) < 86) {
        return false;
      }
      for (const vehicle of getActiveConvoyVehicles(run)) {
        if (distance(x, y, vehicle.x, vehicle.y) < vehicle.radius + radius + 20) {
          return false;
        }
      }
    }
    for (const tower of run.towers) {
      if (tower.alive && distance(x, y, tower.x, tower.y) < tower.radius + radius + 18) {
        return false;
      }
    }
    return true;
  }

  function findTowerPlacementPoint(run, desiredX, desiredY) {
    if (canPlaceTowerAt(run, desiredX, desiredY)) {
      return { x: desiredX, y: desiredY };
    }
    for (let index = 0; index < 12; index += 1) {
      const angle = index * (TWO_PI / 12);
      const distanceFromDesired = 26 + (index % 4) * 14;
      const x = clamp(desiredX + Math.cos(angle) * distanceFromDesired, 40, run.map.width - 40);
      const y = clamp(desiredY + Math.sin(angle) * distanceFromDesired, 40, run.map.height - 40);
      if (canPlaceTowerAt(run, x, y)) {
        return { x, y };
      }
    }
    return null;
  }

  function deployDefenseTower(run) {
    if (!run) {
      return;
    }
    const towerLimit = getTowerDeployLimit(run);
    if (run.stats.towersBuilt >= towerLimit) {
      game.pushNotification("Tower Limit Reached", `No more than ${towerLimit} towers can be deployed this run.`, "warn");
      return;
    }
    if (run.player.towerCooldownRemaining > 0) {
      if ((run.player.economyHintAt || 0) + 1 < run.time) {
        run.player.economyHintAt = run.time;
        game.pushNotification("Fabricators Recharging", `Tower deployment will be ready in ${run.player.towerCooldownRemaining.toFixed(1)}s.`, "warn");
      }
      return;
    }
    const cost = getTowerDeployCost(run);
    const desiredPoint = getClampedPointerTarget(run, 210);
    const point = findTowerPlacementPoint(run, desiredPoint.x, desiredPoint.y);
    if (!point) {
      game.pushNotification("Deployment Blocked", "Move the cursor to a clear area near your ship.", "warn");
      return;
    }
    if (!trySpendRunScrap(run, cost, "Tower deployment")) {
      return;
    }
    const loadout = snapshotTowerLoadout(run.player);
    const maxHp = 150 + run.contract.threat * 16 + (loadout.weapon === "cannon" ? 28 : 0) + (loadout.prototypeWeaponId ? 14 : 0);
    run.towers.push({
      id: makeId(),
      type: "tower",
      x: point.x,
      y: point.y,
      radius: 24,
      hp: maxHp,
      maxHp,
      facing: run.player.facing,
      fireCooldown: 0.25,
      auxCooldown: 0,
      flash: 0,
      range: loadout.weapon === "cannon" ? 560 : loadout.weapon === "arc" ? 500 : 470,
      aggroChance: 0.45,
      alive: true,
      loadout
    });
    run.stats.towersBuilt += 1;
    run.player.towerCooldownRemaining = getTowerDeployCooldown(run);
    burstParticles(run, point.x, point.y, loadout.color, 18, 15, 110, 1.8, 4.2, 0.18, 0.42);
    game.pushNotification("Tower Deployed", `${CLASS_DATA[loadout.classId].name} tower online for ${cost} Scrap.`, "success");
    game.playSfx("ability");
  }

  function damageTower(run, tower, amount, position = null) {
    if (!tower || !tower.alive) {
      return;
    }
    tower.hp -= amount;
    tower.flash = 0.4;
    burstParticles(run, tower.x, tower.y, "#ffb497", 8, 16, 90, 1.8, 4, 0.16, 0.34);
    spawnFloater(run, `-${Math.max(1, Math.round(amount))}`, tower.x, tower.y - tower.radius - 8, "#ffcab8", 0.88, 0.64);
    if (position) {
      const direction = normalize(tower.x - position.x, tower.y - position.y);
      tower.x += direction.x * 5;
      tower.y += direction.y * 5;
      tower.x = clamp(tower.x, tower.radius + 18, run.map.width - tower.radius - 18);
      tower.y = clamp(tower.y, tower.radius + 18, run.map.height - tower.radius - 18);
    }
    if (tower.hp <= 0) {
      tower.hp = 0;
      tower.alive = false;
      burstParticles(run, tower.x, tower.y, tower.loadout.color, 24, 22, 170, 2, 5, 0.2, 0.5);
      game.pushNotification("Tower Lost", "A deployed defense tower was destroyed.", "warn");
    }
  }

  function findTowerTarget(run, tower) {
    return run.enemies
      .filter((enemy) => enemy.alive && distance(enemy.x, enemy.y, tower.x, tower.y) <= tower.range)
      .sort((left, right) => {
        const leftScore = (left.type === "boss" ? 320 : 0) + (left.objectiveTarget ? 140 : 0) + (left.reactorFocus ? 120 : 0) + (left.convoyFocus ? 110 : 0) + (left.elite ? 40 : 0) - distance(left.x, left.y, tower.x, tower.y) * 0.35;
        const rightScore = (right.type === "boss" ? 320 : 0) + (right.objectiveTarget ? 140 : 0) + (right.reactorFocus ? 120 : 0) + (right.convoyFocus ? 110 : 0) + (right.elite ? 40 : 0) - distance(right.x, right.y, tower.x, tower.y) * 0.35;
        return rightScore - leftScore;
      })[0] || null;
  }

  function fireTowerPrototypeWeapon(run, tower, angle) {
    const prototypeWeaponId = tower.loadout.prototypeWeaponId;
    if (!prototypeWeaponId) {
      return;
    }
    if (prototypeWeaponId === "ionLance") {
      spawnProjectile(run, {
        x: tower.x + Math.cos(angle) * 16,
        y: tower.y + Math.sin(angle) * 16,
        vx: Math.cos(angle) * 860,
        vy: Math.sin(angle) * 860,
        radius: 5,
        damage: tower.loadout.damage * 0.72,
        color: PROTOTYPE_WEAPONS[prototypeWeaponId].color,
        owner: "tower",
        towerId: tower.id,
        attackerX: tower.x,
        attackerY: tower.y,
        canCrit: false,
        pierce: 2,
        knockback: 120,
        slowChance: 0.12,
        chainLeft: Math.max(1, tower.loadout.chainCount),
        homing: 0.04
      });
    }
    if (prototypeWeaponId === "swarmRack" && tower.auxCooldown <= 0) {
      tower.auxCooldown = 0.9;
      spawnProjectile(run, {
        x: tower.x + Math.cos(angle) * 14,
        y: tower.y + Math.sin(angle) * 14,
        vx: Math.cos(angle) * 360,
        vy: Math.sin(angle) * 360,
        radius: 6,
        damage: tower.loadout.damage * 0.82,
        color: PROTOTYPE_WEAPONS[prototypeWeaponId].color,
        owner: "tower",
        towerId: tower.id,
        attackerX: tower.x,
        attackerY: tower.y,
        canCrit: false,
        missile: true,
        missileHp: 2,
        turnRate: 0.1,
        knockback: 160,
        splashRadius: 48,
        burnChance: 0.06,
        slowChance: 0.12,
        engineColor: "#ffbb70",
        exhaustColor: "#fff0c5",
        explodeOnExpire: true,
        homing: 0.1
      });
    }
    if (prototypeWeaponId === "fractureCannon") {
      spawnPlayerFan(run, tower.x, tower.y, angle, 3, 0.5, 610, tower.loadout.damage * 0.36, PROTOTYPE_WEAPONS[prototypeWeaponId].color, {
        radius: 4,
        splashRadius: 30,
        explodeOnExpire: true,
        knockback: 95,
        owner: "tower",
        towerId: tower.id,
        attackerX: tower.x,
        attackerY: tower.y,
        canCrit: false
      });
    }
    if (prototypeWeaponId === "beamLaser" && tower.auxCooldown <= 0) {
      tower.auxCooldown = 1.05;
      fireBeamLaser(run, {
        x: tower.x + Math.cos(angle) * 10,
        y: tower.y + Math.sin(angle) * 10,
        angle,
        length: 620,
        width: 11,
        damage: tower.loadout.damage * 1.35,
        color: PROTOTYPE_WEAPONS[prototypeWeaponId].color,
        source: "tower",
        towerId: tower.id,
        knockback: 80
      });
    }
  }

  function fireTowerWeapon(run, tower, target) {
    const loadout = tower.loadout;
    const angle = angleTo(tower.x, tower.y, target.x, target.y);
    const weaponDamageMultiplier = getTowerWeaponDamageMultiplier(loadout.weapon);
    tower.facing = angle;
    tower.flash = 0.16;
    if (loadout.weapon === "rifle") {
      tower.fireCooldown = 1 / Math.max(1.8, loadout.fireRate * 0.58);
      const pellets = Math.min(3, 2 + Math.max(0, loadout.projectiles - 1));
      for (let index = 0; index < pellets; index += 1) {
        const offset = (index - (pellets - 1) / 2) * 0.08;
        const finalAngle = angle + offset;
        spawnProjectile(run, {
          x: tower.x + Math.cos(finalAngle) * 18,
          y: tower.y + Math.sin(finalAngle) * 18,
          vx: Math.cos(finalAngle) * loadout.projectileSpeed,
          vy: Math.sin(finalAngle) * loadout.projectileSpeed,
          radius: 4.4 * loadout.projectileSize,
          damage: loadout.damage * weaponDamageMultiplier,
          color: loadout.color,
          owner: "tower",
          towerId: tower.id,
          attackerX: tower.x,
          attackerY: tower.y,
          canCrit: false,
          pierce: loadout.pierce,
          knockback: 100,
          burnChance: loadout.burnChance,
          slowChance: loadout.slowChance,
          chainLeft: 0
        });
      }
    } else if (loadout.weapon === "auto") {
      tower.fireCooldown = 1 / Math.max(2.6, loadout.fireRate * 0.72);
      const total = Math.min(2, 1 + Math.max(0, loadout.projectiles - 1));
      for (let index = 0; index < total; index += 1) {
        const offset = (index - (total - 1) / 2) * 0.06;
        const finalAngle = angle + offset;
        spawnProjectile(run, {
          x: tower.x + Math.cos(finalAngle) * 18,
          y: tower.y + Math.sin(finalAngle) * 18,
          vx: Math.cos(finalAngle) * loadout.projectileSpeed * 1.08,
          vy: Math.sin(finalAngle) * loadout.projectileSpeed * 1.08,
          radius: 4 * loadout.projectileSize,
          damage: loadout.damage * weaponDamageMultiplier,
          color: loadout.color,
          owner: "tower",
          towerId: tower.id,
          attackerX: tower.x,
          attackerY: tower.y,
          canCrit: false,
          knockback: 80,
          burnChance: loadout.burnChance,
          slowChance: loadout.slowChance
        });
      }
    } else if (loadout.weapon === "cannon") {
      tower.fireCooldown = 1 / Math.max(1.2, loadout.fireRate * 0.52);
      spawnProjectile(run, {
        x: tower.x + Math.cos(angle) * 18,
        y: tower.y + Math.sin(angle) * 18,
        vx: Math.cos(angle) * loadout.projectileSpeed * 0.82,
        vy: Math.sin(angle) * loadout.projectileSpeed * 0.82,
        radius: 7 * loadout.projectileSize,
        damage: loadout.damage * weaponDamageMultiplier,
        color: loadout.color,
        owner: "tower",
        towerId: tower.id,
        attackerX: tower.x,
        attackerY: tower.y,
        canCrit: false,
        missile: true,
        missileHp: 2,
        turnRate: 0.05,
        splashRadius: 56,
        knockback: 180,
        burnChance: loadout.burnChance,
        slowChance: loadout.slowChance,
        engineColor: "#ffb36a",
        exhaustColor: "#fff0cc",
        explodeOnExpire: true
      });
    } else if (loadout.weapon === "arc") {
      tower.fireCooldown = 1 / Math.max(1.9, loadout.fireRate * 0.6);
      const total = Math.min(2, 1 + Math.max(0, loadout.projectiles - 1));
      for (let index = 0; index < total; index += 1) {
        const offset = (index - (total - 1) / 2) * 0.08;
        const finalAngle = angle + offset;
        spawnProjectile(run, {
          x: tower.x + Math.cos(finalAngle) * 18,
          y: tower.y + Math.sin(finalAngle) * 18,
          vx: Math.cos(finalAngle) * loadout.projectileSpeed * 0.85,
          vy: Math.sin(finalAngle) * loadout.projectileSpeed * 0.85,
          radius: 5.2 * loadout.projectileSize,
          damage: loadout.damage * weaponDamageMultiplier,
          color: loadout.color,
          owner: "tower",
          towerId: tower.id,
          attackerX: tower.x,
          attackerY: tower.y,
          canCrit: false,
          knockback: 90,
          burnChance: loadout.burnChance,
          slowChance: loadout.slowChance,
          chainLeft: Math.max(1, loadout.chainCount),
          homing: 0.06
        });
      }
    }
    fireTowerPrototypeWeapon(run, tower, angle);
  }

  function updateTowers(run, dt) {
    for (const tower of run.towers) {
      if (!tower.alive) {
        continue;
      }
      tower.flash = Math.max(0, tower.flash - dt);
      tower.fireCooldown -= dt;
      tower.auxCooldown -= dt;
      const target = findTowerTarget(run, tower);
      if (!target) {
        continue;
      }
      const angle = angleTo(tower.x, tower.y, target.x, target.y);
      tower.facing = lerpAngle(tower.facing, angle, 0.18);
      if (tower.fireCooldown <= 0) {
        fireTowerWeapon(run, tower, target);
      }
    }
    run.towers = run.towers.filter((tower) => tower.alive);
  }
