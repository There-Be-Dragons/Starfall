// Pickups, effects, hazards, enemies, and combat entity helpers.
"use strict";

  function spawnPickup(run, type, x, y, value) {
    const meta = PICKUP_TYPES[type] || PICKUP_TYPES.scrap;
    const angle = Math.random() * TWO_PI;
    const speed = lerp(meta.burstMin, meta.burstMax, Math.random());
    run.pickups.push({
      id: makeId(),
      type,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: meta.radius,
      value,
      alive: true,
      pulse: Math.random() * TWO_PI,
      age: 0,
      magnetized: false,
      magnetScale: meta.magnet,
      collectPadding: meta.collectPadding,
      color: meta.color,
      glow: meta.glow
    });
  }

  function splitRewardValue(total, pieces) {
    const safeTotal = Math.max(1, Math.round(total));
    const safePieces = clamp(Math.round(pieces), 1, safeTotal);
    const values = new Array(safePieces).fill(Math.floor(safeTotal / safePieces));
    let remainder = safeTotal - values.reduce((sum, value) => sum + value, 0);
    let index = 0;
    while (remainder > 0) {
      values[index % values.length] += 1;
      remainder -= 1;
      index += 1;
    }
    return values.filter((value) => value > 0);
  }

  function dropRewardShards(run, type, total, pieces, x, y, spread = 28) {
    const values = splitRewardValue(total, pieces);
    for (const value of values) {
      const angle = Math.random() * TWO_PI;
      const offset = Math.random() * spread;
      spawnPickup(run, type, x + Math.cos(angle) * offset, y + Math.sin(angle) * offset, value);
    }
  }

  function spawnFloater(run, text, x, y, color = "#ffffff", scale = 1, life = 0.85) {
    run.floaters.push({
      id: makeId(),
      text,
      x,
      y,
      vx: (Math.random() * 2 - 1) * 18,
      vy: -36 - Math.random() * 24,
      color,
      scale,
      life,
      maxLife: life
    });
  }

  function spawnEffectRing(run, config) {
    run.rings.push({
      id: makeId(),
      x: config.x,
      y: config.y,
      radius: config.radius || 8,
      growth: config.growth || 120,
      life: config.life || 0.22,
      maxLife: config.life || 0.22,
      color: config.color || "#ffffff",
      lineWidth: config.lineWidth || 2,
      fillAlpha: config.fillAlpha || 0.08
    });
  }

  function spawnAfterimage(run, entity, config = {}) {
    run.afterimages.push({
      id: makeId(),
      x: entity.x,
      y: entity.y,
      facing: entity.facing || 0,
      radius: config.radius || entity.radius || 18,
      classId: config.classId || entity.classId || "vanguard",
      color: config.color || CLASS_DATA[entity.classId]?.color || "#ffffff",
      life: config.life || 0.2,
      maxLife: config.life || 0.2,
      scale: config.scale || 1
    });
  }

  function spawnMuzzleFlash(run, x, y, angle, color, intensity = 1) {
    spawnEffectRing(run, {
      x,
      y,
      radius: 5 + intensity * 2.5,
      growth: 100 + intensity * 42,
      life: 0.14 + intensity * 0.025,
      color,
      lineWidth: 1.6 + intensity * 0.35,
      fillAlpha: 0.09
    });
    const sparks = Math.max(2, Math.round((2 + intensity * 2) * (game.save.options.particles ? 1 : 0.6)));
    for (let index = 0; index < sparks; index += 1) {
      const spread = (Math.random() - 0.5) * (0.16 + intensity * 0.08);
      const speed = 90 + Math.random() * (80 + intensity * 36);
      spawnParticle(run, {
        x,
        y,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        size: 1.2 + Math.random() * (1.2 + intensity * 0.4),
        life: 0.08 + Math.random() * 0.1,
        color,
        glow: 10,
        optional: true
      });
    }
  }

  function magnetizePickups(run, x, y, range) {
    for (const pickup of run.pickups) {
      if (!pickup.alive) {
        continue;
      }
      if (distanceSq(x, y, pickup.x, pickup.y) <= range * range) {
        pickup.magnetized = true;
      }
    }
  }

  function activatePlayerBuff(run, buffId, duration) {
    run.player.buffs[buffId] = Math.max(run.player.buffs[buffId] || 0, duration);
  }

  function getAbilityDefinitionForClass(classId, slot) {
    return CLASS_ABILITY_KITS[classId][slot];
  }

  function getAbilityCooldownSeconds(player, slot) {
    const baseClassCooldown = Math.max(1, CLASS_DATA[player.classId].baseStats.abilityCooldown);
    return getAbilityDefinitionForClass(player.classId, slot).cooldown * (player.stats.abilityCooldown / baseClassCooldown);
  }

  function getWeaponDamageMultiplier(weapon) {
    return {
      rifle: 0.54,
      auto: 0.79,
      cannon: 1.06,
      arc: 0.96
    }[weapon] || 1;
  }

  function getTowerWeaponDamageMultiplier(weapon) {
    return {
      rifle: 0.44,
      auto: 0.5,
      cannon: 0.84,
      arc: 0.58
    }[weapon] || 0.5;
  }

  function getComboPowerThresholds() {
    const rank = getUpgradeLevel(game.save, "killTelemetry");
    return [
      Math.max(5, 9 - rank),
      Math.max(14, 20 - rank * 2),
      Math.max(26, 36 - rank * 2)
    ];
  }

  function getComboPowerDurationMultiplier() {
    return 1 + getUpgradeLevel(game.save, "momentumDrive") * 0.12;
  }

  function getComboPowerPotencyMultiplier() {
    return 1 + getUpgradeLevel(game.save, "finisherProtocol") * 0.08;
  }

  function getComboPowerModifiers(run) {
    const state = run.player.comboPower;
    if (!state || state.tier <= 0 || state.timer <= 0) {
      return {
        damage: 1,
        fireRate: 1,
        moveSpeed: 1,
        abilityDamage: 1,
        armorBonus: 0
      };
    }
    const potency = getComboPowerPotencyMultiplier();
    const mobilityRank = getUpgradeLevel(game.save, "momentumDrive");
    const tiers = {
      1: { damage: 0.06, fireRate: 0.05, moveSpeed: 0.04, abilityDamage: 0.08, armorBonus: 0 },
      2: { damage: 0.12, fireRate: 0.09, moveSpeed: 0.065, abilityDamage: 0.14, armorBonus: 1 },
      3: { damage: 0.18, fireRate: 0.14, moveSpeed: 0.09, abilityDamage: 0.2, armorBonus: 3 }
    };
    const tier = tiers[state.tier] || tiers[1];
    return {
      damage: 1 + tier.damage * potency,
      fireRate: 1 + tier.fireRate * potency,
      moveSpeed: 1 + tier.moveSpeed + mobilityRank * 0.015,
      abilityDamage: 1 + tier.abilityDamage * potency,
      armorBonus: tier.armorBonus + Math.ceil(mobilityRank * 0.5)
    };
  }

  function triggerComboPower(run, tier) {
    const baseDurations = [5, 6.4, 8];
    const duration = baseDurations[tier - 1] * getComboPowerDurationMultiplier();
    const previousTier = run.player.comboPower.tier;
    run.player.comboPower.tier = tier;
    run.player.comboPower.timer = duration;
    run.player.comboFlash = Math.max(run.player.comboFlash, 0.65);
    const shieldBurst = getUpgradeLevel(game.save, "killTelemetry") * 5 + tier * 6;
    if (shieldBurst > 0) {
      grantShield(run, shieldBurst);
    }
    if (tier > previousTier) {
      game.pushNotification(`Combo Surge ${romanThreat(tier)}`, `Streak power spike engaged for ${duration.toFixed(1)}s.`, "success");
    }
    burstParticles(run, run.player.x, run.player.y, tier >= 3 ? "#fff0a6" : tier === 2 ? "#ffd38d" : "#9ff0ff", 18 + tier * 4, 18, 160, 1.8, 4.6, 0.18, 0.4);
    spawnEffectRing(run, {
      x: run.player.x,
      y: run.player.y,
      radius: run.player.radius + 10,
      growth: 180 + tier * 26,
      life: 0.32 + tier * 0.04,
      color: tier >= 3 ? "#fff0a6" : tier === 2 ? "#ffd38d" : "#9ff0ff",
      lineWidth: 2.6 + tier * 0.5,
      fillAlpha: 0.1
    });
    game.addScreenShake(5 + tier * 2);
    game.playSfx("surge");
  }

  function updateComboPowerFromStreak(run) {
    const thresholds = getComboPowerThresholds();
    let tier = 0;
    if (run.stats.combo >= thresholds[0]) {
      tier = 1;
    }
    if (run.stats.combo >= thresholds[1]) {
      tier = 2;
    }
    if (run.stats.combo >= thresholds[2]) {
      tier = 3;
    }
    if (tier <= 0) {
      return;
    }
    if (tier > run.player.comboPower.tier || run.player.comboPower.timer < 1.25) {
      triggerComboPower(run, tier);
    }
  }

  function getAbilityDamageBudget(run, slot, multiplier = 1) {
    const player = run.player;
    const def = getAbilityDefinitionForClass(player.classId, slot);
    const levelScale = 1 + Math.max(0, player.level - 1) * 0.033;
    const comboMultiplier = getComboPowerModifiers(run).abilityDamage;
    return player.stats.damage * (1.45 + def.cooldown * 0.21) * levelScale * comboMultiplier * multiplier;
  }

  function splitDamage(total, count) {
    return total / Math.max(1, count);
  }

  function isAbilityUnlocked(player, slot) {
    return player.level >= getAbilityDefinitionForClass(player.classId, slot).unlockLevel;
  }

  function notifyAbilityUnlocks(run) {
    for (const slot of ABILITY_SLOT_ORDER) {
      if (run.player.abilityUnlockSeen[slot]) {
        continue;
      }
      if (isAbilityUnlocked(run.player, slot)) {
        run.player.abilityUnlockSeen[slot] = true;
        const def = getAbilityDefinitionForClass(run.player.classId, slot);
        game.pushNotification(`${ABILITY_SLOT_META[slot].key} Online`, `${def.name} unlocked at level ${def.unlockLevel}.`, "success");
      }
    }
  }

  function getClampedPointerTarget(run, maxDistance = 360) {
    const dx = game.pointer.worldX - run.player.x;
    const dy = game.pointer.worldY - run.player.y;
    const distanceToPointer = Math.hypot(dx, dy);
    if (distanceToPointer <= maxDistance) {
      return {
        x: clamp(game.pointer.worldX, 40, run.map.width - 40),
        y: clamp(game.pointer.worldY, 40, run.map.height - 40)
      };
    }
    const direction = normalize(dx, dy);
    return {
      x: clamp(run.player.x + direction.x * maxDistance, 40, run.map.width - 40),
      y: clamp(run.player.y + direction.y * maxDistance, 40, run.map.height - 40)
    };
  }

  function spawnPlayerFan(run, originX, originY, angle, count, spread, speed, damage, color, options = {}) {
    for (let index = 0; index < count; index += 1) {
      const offset = count === 1 ? 0 : lerp(-spread * 0.5, spread * 0.5, index / (count - 1));
      const finalAngle = angle + offset;
      spawnProjectile(run, {
        x: originX + Math.cos(finalAngle) * (options.offset || 18),
        y: originY + Math.sin(finalAngle) * (options.offset || 18),
        vx: Math.cos(finalAngle) * speed,
        vy: Math.sin(finalAngle) * speed,
        radius: options.radius || 5,
        damage,
        color,
        owner: options.owner || "player",
        towerId: options.towerId,
        attackerX: options.attackerX ?? originX,
        attackerY: options.attackerY ?? originY,
        canCrit: options.canCrit,
        pierce: options.pierce || 0,
        splashRadius: options.splashRadius || 0,
        knockback: options.knockback || 140,
        burnChance: options.burnChance || 0,
        slowChance: options.slowChance || 0,
        chainLeft: options.chainLeft || 0,
        homing: options.homing || 0,
        explodeOnExpire: options.explodeOnExpire || false
      });
    }
  }

  function spawnPlayerNova(run, x, y, count, speed, damage, color, options = {}) {
    for (let index = 0; index < count; index += 1) {
      const angle = options.startAngle ? options.startAngle + index * (TWO_PI / count) : index * (TWO_PI / count);
      spawnProjectile(run, {
        x: x + Math.cos(angle) * (options.offset || 18),
        y: y + Math.sin(angle) * (options.offset || 18),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: options.radius || 5,
        damage,
        color,
        owner: options.owner || "player",
        towerId: options.towerId,
        attackerX: options.attackerX ?? x,
        attackerY: options.attackerY ?? y,
        canCrit: options.canCrit,
        pierce: options.pierce || 0,
        splashRadius: options.splashRadius || 0,
        knockback: options.knockback || 140,
        burnChance: options.burnChance || 0,
        slowChance: options.slowChance || 0,
        chainLeft: options.chainLeft || 0,
        homing: options.homing || 0,
        explodeOnExpire: options.explodeOnExpire || false
      });
    }
  }

  function spawnMissileSwarm(run, originX, originY, count, damage, color, startAngle = null) {
    const anchorAngle = startAngle ?? run.player.facing;
    for (let index = 0; index < count; index += 1) {
      const angle = anchorAngle + lerp(-0.45, 0.45, count === 1 ? 0.5 : index / (count - 1));
      spawnProjectile(run, {
        x: originX + Math.cos(angle) * 16,
        y: originY + Math.sin(angle) * 16,
        vx: Math.cos(angle) * 430,
        vy: Math.sin(angle) * 430,
        radius: 6,
        damage,
        color,
        missile: true,
        missileHp: 2,
        turnRate: 0.12,
        pierce: 0,
        splashRadius: 52,
        knockback: 180,
        burnChance: 0.08,
        slowChance: 0.14,
        chainLeft: 0,
        homing: 0.12,
        engineColor: "#ffb36a",
        exhaustColor: "#fff0c0",
        explodeOnExpire: true
      });
    }
  }

  function spawnTargetBlasts(run, centerX, centerY, count, radius, damage, color, delayStart = 0.4, delayStep = 0.12) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * TWO_PI;
      const distanceFromCenter = Math.random() * radius;
      spawnHazard(run, {
        x: centerX + Math.cos(angle) * distanceFromCenter,
        y: centerY + Math.sin(angle) * distanceFromCenter,
        radius: 72,
        damage,
        delay: delayStart + index * delayStep,
        duration: 0.35,
        source: "player",
        color,
        knockback: 240
      });
    }
  }

  function addPlayerField(run, type, x, y, radius, duration, color, extra = {}) {
    run.fields.push({
      id: makeId(),
      type,
      x,
      y,
      radius,
      duration,
      tick: extra.tick || 0.4,
      tickInterval: extra.tick || 0.4,
      color,
      pullStrength: extra.pullStrength || 0,
      damage: extra.damage || 16,
      shieldRegen: extra.shieldRegen || 0,
      healPerSecond: extra.healPerSecond || 0,
      shieldPerSecond: extra.shieldPerSecond || 0,
      burnChance: extra.burnChance || 0
    });
  }

  function spawnTemporaryOrbitals(run, count, duration) {
    for (let index = 0; index < count; index += 1) {
      run.orbitals.push({
        id: makeId(),
        source: "ability",
        angle: Math.random() * TWO_PI,
        radius: 70 + index * 10,
        hitCooldown: 0,
        duration
      });
    }
  }

  function createDefenseTurrets(centerX, centerY, rng) {
    const turrets = [];
    for (let index = 0; index < 4; index += 1) {
      const angle = index * (TWO_PI / 4) + Math.PI / 4;
      turrets.push({
        id: makeId(),
        angle,
        orbitRadius: 142,
        x: centerX + Math.cos(angle) * 142,
        y: centerY + Math.sin(angle) * 142,
        fireCooldown: rng.range(0.15, 0.85),
        flash: 0
      });
    }
    return turrets;
  }

  function updateDefenseObjective(run, dt) {
    if (run.objective.type !== "defense" || !run.objective.reactor.alive) {
      return;
    }
    const reactor = run.objective.reactor;
    reactor.hitFlash = Math.max(0, reactor.hitFlash - dt);
    reactor.warnFlash = Math.max(0, reactor.warnFlash - dt);
    reactor.shieldDelayRemaining = Math.max(0, reactor.shieldDelayRemaining - dt);
    reactor.securedPulse += dt * 2.4;
    reactor.playerInRing = distance(run.player.x, run.player.y, reactor.x, reactor.y) < reactor.guardRadius;

    if (!run.objective.complete) {
      const supportMultiplier = reactor.playerInRing ? 1.45 : 1;
      if (reactor.shieldDelayRemaining <= 0 && reactor.shield < reactor.maxShield) {
        reactor.shield = clamp(reactor.shield + reactor.shieldRegenRate * supportMultiplier * dt, 0, reactor.maxShield);
      }
      if (reactor.playerInRing && reactor.hp < reactor.maxHp) {
        reactor.hp = clamp(reactor.hp + reactor.hullRegenRate * dt, 0, reactor.maxHp);
      }
      if (reactor.playerInRing) {
        grantShield(run, 6 * dt);
      }
      for (const turret of reactor.turrets) {
        turret.flash = Math.max(0, turret.flash - dt);
        turret.fireCooldown -= dt;
        turret.x = reactor.x + Math.cos(turret.angle) * turret.orbitRadius;
        turret.y = reactor.y + Math.sin(turret.angle) * turret.orbitRadius;
        if (turret.fireCooldown > 0) {
          continue;
        }
        const target = run.enemies
          .filter((enemy) => enemy.alive && distance(turret.x, turret.y, enemy.x, enemy.y) < 430)
          .sort((left, right) => {
            const leftScore = (left.reactorFocus ? 240 : 0) - distance(left.x, left.y, reactor.x, reactor.y);
            const rightScore = (right.reactorFocus ? 240 : 0) - distance(right.x, right.y, reactor.x, reactor.y);
            return rightScore - leftScore;
          })[0];
        if (!target) {
          turret.fireCooldown = 0.22;
          continue;
        }
        turret.fireCooldown = 0.66;
        turret.flash = 0.18;
        run.beams.push({
          id: makeId(),
          x1: turret.x,
          y1: turret.y,
          x2: target.x,
          y2: target.y,
          color: "#9ff3ff",
          life: 0.11
        });
        damageEnemy(run, target, 14 + run.contract.threat * 1.6, {
          source: "turret",
          canCrit: false,
          burnChance: 0,
          slowChance: 0.22,
          knockback: 40,
          chainLeft: 0
        });
      }
    }

    if (reactor.hp / reactor.maxHp < 0.4 && !reactor.lowIntegrityWarned) {
      reactor.lowIntegrityWarned = true;
      reactor.warnFlash = 1.2;
      game.pushNotification("Reactor Critical", "Stand inside the defense ring to restore shields and buy time.", "warn");
    }
  }

  function spawnLevelFeatures(run) {
    run.prototypeCaches = [];
    run.anomalies = [];
    run.teleporters = [];
    const prototypeIds = Object.keys(PROTOTYPE_WEAPONS);
    const cacheCount = 2 + Math.floor(run.contract.threat / 2);
    for (let index = 0; index < cacheCount; index += 1) {
      const point = findOpenPoint(run, run.rng, 340);
      run.prototypeCaches.push({
        id: makeId(),
        weaponId: run.rng.choice(prototypeIds),
        x: point.x,
        y: point.y,
        radius: 24,
        pulse: Math.random() * TWO_PI,
        active: true
      });
    }
    const anomalyWeights = ZONE_ANOMALY_WEIGHTS[run.zone.id] || ZONE_ANOMALY_WEIGHTS.scrapSea;
    const anomalyCount = 4 + run.contract.threat;
    for (let index = 0; index < anomalyCount; index += 1) {
      const point = findOpenPoint(run, run.rng, 280);
      const type = weightedPick(run.rng, anomalyWeights);
      run.anomalies.push({
        id: makeId(),
        type,
        x: point.x,
        y: point.y,
        radius: type === "rift" ? 92 : 78,
        pulse: Math.random() * TWO_PI,
        timer: 2 + Math.random() * 3,
        armed: true
      });
    }
    const teleporterChance = run.contract.missionType === "defense" ? 0.36 : 0.62;
    if (run.rng.chance(teleporterChance)) {
      run.teleporters.push(createTeleporterPair(run));
      game.pushNotification("Transient Relay", "A paired teleporter is active on this map. Step into either gate while it is online.", "success");
    }
  }

  function findTeleporterPoint(run, avoidPoint = null) {
    for (let tries = 0; tries < 120; tries += 1) {
      const point = findOpenPoint(run, run.rng, 320);
      if (avoidPoint && distance(point.x, point.y, avoidPoint.x, avoidPoint.y) < 920) {
        continue;
      }
      if (run.objective.type === "defense") {
        const reactor = run.objective.reactor;
        if (distance(point.x, point.y, reactor.x, reactor.y) < reactor.guardRadius + 170) {
          continue;
        }
      }
      return point;
    }
    return findOpenPoint(run, run.rng, 320);
  }

  function resetTeleporterPair(run, pair, active = true) {
    const first = findTeleporterPoint(run);
    const second = findTeleporterPoint(run, first);
    pair.endpoints = [
      { id: makeId(), x: first.x, y: first.y, radius: 40 },
      { id: makeId(), x: second.x, y: second.y, radius: 40 }
    ];
    pair.active = active;
    pair.activeDuration = run.rng.range(10.5, 16);
    pair.inactiveDuration = run.rng.range(8.5, 13);
    pair.timer = active ? pair.activeDuration : pair.inactiveDuration;
    pair.cooldown = 0;
  }

  function createTeleporterPair(run) {
    const pair = {
      id: makeId(),
      pulse: Math.random() * TWO_PI,
      active: true,
      timer: 0,
      activeDuration: 0,
      inactiveDuration: 0,
      cooldown: 0,
      endpoints: []
    };
    resetTeleporterPair(run, pair, true);
    return pair;
  }

  function findTeleporterLanding(run, destination, source) {
    const baseDirection = normalize(destination.x - source.x, destination.y - source.y);
    const baseAngle = Math.atan2(baseDirection.y, baseDirection.x);
    for (let ring = 0; ring < 4; ring += 1) {
      const distanceFromGate = destination.radius + 26 + ring * 10;
      for (let step = 0; step < 8; step += 1) {
        const angle = baseAngle + step * (TWO_PI / 8);
        const x = clamp(destination.x + Math.cos(angle) * distanceFromGate, 36, run.map.width - 36);
        const y = clamp(destination.y + Math.sin(angle) * distanceFromGate, 36, run.map.height - 36);
        if (pointBlocked(run.map, x, y, run.player.radius + 4)) {
          continue;
        }
        if (run.towers.some((tower) => tower.alive && distance(x, y, tower.x, tower.y) < tower.radius + run.player.radius + 14)) {
          continue;
        }
        if (run.enemies.some((enemy) => enemy.alive && distance(x, y, enemy.x, enemy.y) < enemy.radius + run.player.radius + 18)) {
          continue;
        }
        return { x, y };
      }
    }
    return {
      x: clamp(destination.x + baseDirection.x * (destination.radius + 30), 36, run.map.width - 36),
      y: clamp(destination.y + baseDirection.y * (destination.radius + 30), 36, run.map.height - 36)
    };
  }

  function teleportPlayerThroughPair(run, pair, entryIndex) {
    const source = pair.endpoints[entryIndex];
    const destination = pair.endpoints[1 - entryIndex];
    const landing = findTeleporterLanding(run, destination, source);
    burstParticles(run, source.x, source.y, "#8ff7ff", 18, 20, 160, 2, 5, 0.2, 0.5);
    pushSupportBeam(run, source.x, source.y, destination.x, destination.y, "#baf9ff", 0.18);
    run.player.x = landing.x;
    run.player.y = landing.y;
    run.player.invuln = Math.max(run.player.invuln, 0.35);
    run.camera.x = run.player.x;
    run.camera.y = run.player.y;
    pair.cooldown = 1.1;
    burstParticles(run, destination.x, destination.y, "#baf9ff", 18, 20, 170, 2, 5, 0.2, 0.55);
    spawnFloater(run, "Phase Transit", destination.x, destination.y - destination.radius - 14, "#dffcff", 0.92, 0.75);
    game.addScreenShake(10);
    game.playSfx("ability");
  }

  function updateTeleporters(run, dt) {
    for (const pair of run.teleporters) {
      pair.pulse += dt * 2.6;
      pair.cooldown = Math.max(0, pair.cooldown - dt);
      pair.timer -= dt;
      if (pair.active) {
        if (pair.cooldown <= 0) {
          const entryIndex = pair.endpoints.findIndex((endpoint) => distance(run.player.x, run.player.y, endpoint.x, endpoint.y) < endpoint.radius + run.player.radius);
          if (entryIndex >= 0) {
            teleportPlayerThroughPair(run, pair, entryIndex);
          }
        }
        if (pair.timer <= 0) {
          pair.active = false;
          pair.timer = pair.inactiveDuration;
        }
      } else if (pair.timer <= 0) {
        resetTeleporterPair(run, pair, true);
      }
    }
  }

  function activatePrototypeWeapon(run, weaponId) {
    const weapon = PROTOTYPE_WEAPONS[weaponId];
    run.player.prototypeWeapon = {
      id: weaponId,
      time: weapon.duration,
      auxCooldown: 0
    };
    burstParticles(run, run.player.x, run.player.y, weapon.color, 22, 20, 180, 2, 5, 0.2, 0.55);
    game.pushNotification("Prototype Armed", `${weapon.name}: ${weapon.desc}`, "warn");
  }

  function updatePrototypeCaches(run, dt) {
    for (const cache of run.prototypeCaches) {
      if (!cache.active) {
        continue;
      }
      cache.pulse += dt * 2.2;
      if (distance(run.player.x, run.player.y, cache.x, cache.y) < run.player.radius + cache.radius + 8) {
        cache.active = false;
        activatePrototypeWeapon(run, cache.weaponId);
      }
    }
  }

  function updateAnomalies(run, dt) {
    for (const anomaly of run.anomalies) {
      anomaly.timer -= dt;
      anomaly.pulse += dt * 2.6;
      if (anomaly.type === "rift") {
        for (const entity of [run.player, ...run.enemies.filter((enemy) => enemy.alive)]) {
          const dist = distance(entity.x, entity.y, anomaly.x, anomaly.y);
          if (dist < anomaly.radius + 70) {
            const direction = normalize(anomaly.x - entity.x, anomaly.y - entity.y);
            const pull = (1 - dist / (anomaly.radius + 70)) * 95 * dt;
            entity.vx += direction.x * pull * 60;
            entity.vy += direction.y * pull * 60;
          }
        }
      }
      if (anomaly.timer > 0) {
        continue;
      }
      if (anomaly.type === "mine") {
        anomaly.timer = 6.5 + Math.random() * 2;
        if (distance(run.player.x, run.player.y, anomaly.x, anomaly.y) < anomaly.radius + 40
          || run.enemies.some((enemy) => enemy.alive && distance(enemy.x, enemy.y, anomaly.x, anomaly.y) < anomaly.radius + 26)) {
          spawnHazard(run, {
            x: anomaly.x,
            y: anomaly.y,
            radius: 84,
            damage: 18 + run.contract.threat * 3,
            delay: 0.35,
            duration: 0.35,
            source: "enemy",
            color: ANOMALY_TYPES.mine.color,
            knockback: 220
          });
        }
      } else if (anomaly.type === "vent") {
        anomaly.timer = 5 + Math.random() * 2.4;
        spawnHazard(run, {
          x: anomaly.x,
          y: anomaly.y,
          radius: 92,
          damage: 20 + run.contract.threat * 3,
          delay: 0.7,
          duration: 3.6,
          source: "enemy",
          color: ANOMALY_TYPES.vent.color,
          kind: "pool",
          tick: 0.42
        });
      } else if (anomaly.type === "rift") {
        anomaly.timer = 4.8 + Math.random() * 2;
        spawnHazard(run, {
          x: anomaly.x,
          y: anomaly.y,
          radius: 86,
          damage: 18 + run.contract.threat * 3,
          delay: 0.55,
          duration: 0.35,
          source: "enemy",
          color: ANOMALY_TYPES.rift.color,
          knockback: 240
        });
      } else if (anomaly.type === "pylon") {
        anomaly.timer = 4.5 + Math.random() * 2.2;
        for (let index = 0; index < 8; index += 1) {
          const angle = index * (TWO_PI / 8) + anomaly.pulse * 0.2;
          spawnEnemyProjectile(run, {
            x: anomaly.x + Math.cos(angle) * 10,
            y: anomaly.y + Math.sin(angle) * 10,
            vx: Math.cos(angle) * 260,
            vy: Math.sin(angle) * 260,
            radius: 4.5,
            damage: 12 + run.contract.threat * 1.7,
            color: ANOMALY_TYPES.pylon.color,
            life: 2.4,
            slow: 0.18
          });
        }
      }
    }
  }

  function spawnSupplyPod(run, reason = "drift") {
    if (run.extraction || run.supplyPods.length >= 2) {
      return null;
    }
    const lowHealth = run.player.hp / run.player.stats.maxHealth < 0.45;
    const lowShield = run.player.shield / Math.max(1, run.player.stats.maxShield) < 0.35;
    const manyPickups = run.pickups.length > 12;
    const weights = [
      { id: "cache", weight: 30 },
      { id: "repair", weight: lowHealth || lowShield ? 32 : 17 },
      { id: "overclock", weight: reason === "combo" ? 26 : 19 },
      { id: "magnet", weight: manyPickups ? 28 : 18 }
    ];
    const type = weightedPick(run.rng, weights);
    const point = reason === "combo"
      ? findOpenPointNear(run, run.rng, run.player.x, run.player.y, 170, 280)
      : findOpenPoint(run, run.rng, 320);
    const pod = {
      id: makeId(),
      type,
      x: point.x,
      y: point.y,
      radius: 26,
      pulse: Math.random() * TWO_PI,
      life: 80,
      reason
    };
    run.supplyPods.push(pod);
    if (reason === "combo") {
      game.pushNotification("Streak Reward", `${SUPPLY_POD_TYPES[type].name} inbound for your kill streak.`, "success");
    } else {
      game.pushNotification("Supply Drop", `${SUPPLY_POD_TYPES[type].name} marked on your scanner.`, "success");
    }
    return pod;
  }

  function openSupplyPod(run, pod) {
    const type = SUPPLY_POD_TYPES[pod.type];
    pod.life = 0;
    run.stats.supplyPodsOpened += 1;
    burstParticles(run, pod.x, pod.y, type.color, 24, 30, 220, 2, 5.5, 0.25, 0.65);
    spawnFloater(run, type.name, pod.x, pod.y - 8, type.accent, 1.05, 1);
    if (pod.type === "cache") {
      dropRewardShards(run, "scrap", (30 + run.contract.threat * 16) * run.player.stats.scrapGain, 4 + Math.floor(run.contract.threat / 2), pod.x, pod.y, 34);
      dropRewardShards(run, "xp", 38 + run.contract.threat * 10, 3 + Math.floor(run.contract.threat / 2), pod.x, pod.y, 28);
      dropRewardShards(run, "core", 2 + Math.floor(run.contract.threat * 0.8), 1 + Math.floor(run.contract.threat / 3), pod.x, pod.y, 22);
    }
    if (pod.type === "repair") {
      healPlayer(run, 16 + run.contract.threat * 4);
      grantShield(run, 20 + run.contract.threat * 5);
      dropRewardShards(run, "heal", 24 + run.contract.threat * 4, 2, pod.x, pod.y, 22);
      dropRewardShards(run, "shield", 28 + run.contract.threat * 5, 2, pod.x, pod.y, 22);
    }
    if (pod.type === "overclock") {
      activatePlayerBuff(run, "salvageRush", 14);
      dropRewardShards(run, "xp", 42 + run.contract.threat * 12, 4, pod.x, pod.y, 24);
      dropRewardShards(run, "scrap", (18 + run.contract.threat * 8) * run.player.stats.scrapGain, 2, pod.x, pod.y, 20);
      game.pushNotification("Salvage Rush", "Weapons and recovery systems are overclocked.", "warn");
    }
    if (pod.type === "magnet") {
      activatePlayerBuff(run, "magnetField", 18);
      magnetizePickups(run, pod.x, pod.y, 9999);
      dropRewardShards(run, "scrap", (22 + run.contract.threat * 10) * run.player.stats.scrapGain, 3, pod.x, pod.y, 20);
      dropRewardShards(run, "core", 1 + Math.floor(run.contract.threat * 0.55), 1, pod.x, pod.y, 20);
      game.pushNotification("Magnet Field", "Nearby salvage now tears into your vacuum field.", "success");
    }
    game.playSfx("collect");
  }

  function updateSupplyPods(run, dt) {
    for (const pod of run.supplyPods) {
      pod.life -= dt;
      pod.pulse += dt * 3.2;
      if (distance(run.player.x, run.player.y, pod.x, pod.y) < run.player.radius + pod.radius + 10) {
        openSupplyPod(run, pod);
      }
    }
    run.supplyPods = run.supplyPods.filter((pod) => pod.life > 0);
  }

  function updateFloaters(run, dt) {
    for (const floater of run.floaters) {
      floater.life -= dt;
      floater.x += floater.vx * dt;
      floater.y += floater.vy * dt;
      floater.vx *= 0.97;
      floater.vy *= 0.97;
    }
    run.floaters = run.floaters.filter((floater) => floater.life > 0);
  }

  function dropEnemyLoot(run, enemy) {
    const isBoss = enemy.type === "boss";
    const xpTotal = isBoss ? 180 + run.contract.threat * 24 : enemy.xp;
    const xpPieces = isBoss ? 8 : enemy.elite ? 4 : clamp(Math.round(enemy.xp / 12), 1, 3);
    dropRewardShards(run, "xp", xpTotal, xpPieces, enemy.x, enemy.y, isBoss ? 52 : 24);

    const scrapBase = isBoss
      ? (105 + run.contract.threat * 26) * run.player.stats.scrapGain
      : Math.max(1, Math.round(enemy.scrap * run.player.stats.scrapGain * (enemy.elite ? 1.35 : 1)));
    const scrapPieces = isBoss ? 6 + Math.floor(run.contract.threat / 2) : enemy.elite ? 3 : clamp(Math.round(scrapBase / 8), 1, 3);
    dropRewardShards(run, "scrap", scrapBase, scrapPieces, enemy.x, enemy.y, isBoss ? 56 : 26);

    const scarcity = run.contract.mutators.includes("scarcity");
    if (!scarcity && Math.random() < (isBoss ? 1 : enemy.elite ? 0.28 : 0.08)) {
      spawnPickup(run, Math.random() > 0.48 ? "heal" : "shield", enemy.x, enemy.y, isBoss ? 46 : 18);
    }
    if (enemy.elite && Math.random() < 0.35) {
      spawnPickup(run, "core", enemy.x + Math.random() * 24 - 12, enemy.y + Math.random() * 24 - 12, 1 + Math.floor(run.contract.threat * 0.35));
    }
    if (isBoss) {
      dropRewardShards(run, "core", 8 + run.contract.threat * 2, 6, enemy.x, enemy.y, 44);
      magnetizePickups(run, enemy.x, enemy.y, 9999);
    }
  }

  function spawnParticle(run, config) {
    const densityScale = game.save.options.particles ? 1 : 0.4;
    if (config.optional && Math.random() > densityScale) {
      return;
    }
    run.particles.push({
      id: makeId(),
      x: config.x,
      y: config.y,
      vx: config.vx || 0,
      vy: config.vy || 0,
      size: config.size || 3,
      life: config.life || 0.5,
      maxLife: config.life || 0.5,
      color: config.color || "#ffffff",
      glow: config.glow || 0
    });
  }

  function burstParticles(run, x, y, color, count, speedMin, speedMax, sizeMin, sizeMax, lifeMin, lifeMax) {
    const amount = Math.round(count * (game.save.options.particles ? 1 : 0.45));
    for (let index = 0; index < amount; index += 1) {
      const angle = Math.random() * TWO_PI;
      const speed = lerp(speedMin, speedMax, Math.random());
      spawnParticle(run, {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: lerp(sizeMin, sizeMax, Math.random()),
        life: lerp(lifeMin, lifeMax, Math.random()),
        color,
        glow: 10
      });
    }
  }

  function resolveWorldCollision(run, entity) {
    entity.x = clamp(entity.x, entity.radius + 16, run.map.width - entity.radius - 16);
    entity.y = clamp(entity.y, entity.radius + 16, run.map.height - entity.radius - 16);
    for (const obstacle of run.map.obstacles) {
      const minDistance = obstacle.radius + entity.radius + 3;
      const dx = entity.x - obstacle.x;
      const dy = entity.y - obstacle.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistance * minDistance) {
        const dist = Math.sqrt(distSq) || 0.001;
        const push = minDistance - dist;
        entity.x += (dx / dist) * push;
        entity.y += (dy / dist) * push;
      }
    }
  }

  function getPrimaryObjectivePosition(run) {
    if (!run) {
      return null;
    }
    if (run.extraction) {
      return { x: run.extraction.x, y: run.extraction.y };
    }
    if (run.boss && run.boss.alive) {
      return { x: run.boss.x, y: run.boss.y };
    }
    if (run.objective.type === "salvage") {
      const nextNode = run.objective.nodes.find((node) => !node.collected);
      return nextNode ? { x: nextNode.x, y: nextNode.y } : null;
    }
    if (run.objective.type === "hunt") {
      const target = run.enemies.find((enemy) => enemy.alive && enemy.objectiveTarget);
      return target ? { x: target.x, y: target.y } : null;
    }
    if (run.objective.type === "defense") {
      return { x: run.objective.reactor.x, y: run.objective.reactor.y };
    }
    if (run.objective.type === "escort") {
      return getEscortObjectiveCenter(run);
    }
    return null;
  }

  function getEnemyTarget(run, enemy) {
    if (enemy.towerAggro > 0 && enemy.towerAggroTargetId) {
      const tower = run.towers.find((item) => item.alive && item.id === enemy.towerAggroTargetId);
      if (tower) {
        return tower;
      }
    }
    if (run.objective.type === "defense" && !run.objective.complete && run.objective.reactor.alive) {
      const reactor = run.objective.reactor;
      const reactorDistance = distance(enemy.x, enemy.y, reactor.x, reactor.y);
      const playerDistance = distance(enemy.x, enemy.y, run.player.x, run.player.y);
      if (enemy.playerAggro > 0 || playerDistance < 220) {
        return run.player;
      }
      if (enemy.reactorFocus && reactorDistance < 760 && playerDistance > reactorDistance - 40) {
        return reactor;
      }
      if ((enemy.kind === "mortar" || enemy.kind === "siphon") && reactorDistance < 260 && playerDistance > reactorDistance + 100) {
        return reactor;
      }
    }
    if (run.objective.type === "escort" && !run.objective.complete) {
      const convoyTarget = getEscortTargetVehicle(run, enemy);
      if (convoyTarget) {
        const convoyDistance = distance(enemy.x, enemy.y, convoyTarget.x, convoyTarget.y);
        const playerDistance = distance(enemy.x, enemy.y, run.player.x, run.player.y);
        if (enemy.playerAggro > 0 || playerDistance < 220) {
          return run.player;
        }
        if (enemy.convoyFocus && playerDistance > convoyDistance - 20) {
          return convoyTarget;
        }
        if ((enemy.kind === "mortar" || enemy.kind === "siphon") && playerDistance > convoyDistance + 90) {
          return convoyTarget;
        }
        if (playerDistance > convoyDistance + 140) {
          return convoyTarget;
        }
      }
    }
    return run.player;
  }

  function spawnHazard(run, hazard) {
    run.hazards.push({
      id: makeId(),
      x: hazard.x,
      y: hazard.y,
      radius: hazard.radius,
      damage: hazard.damage,
      delay: hazard.delay || 0,
      duration: hazard.duration || 0.5,
      tick: hazard.tick || 0.35,
      source: hazard.source,
      kind: hazard.kind || "blast",
      color: hazard.color || "#ffffff",
      applied: false,
      knockback: hazard.knockback || 180
    });
  }

  function findTargetEnemy(run, x, y, range) {
    let best = null;
    let bestDistance = range * range;
    for (const enemy of run.enemies) {
      if (!enemy.alive) {
        continue;
      }
      const distSq = distanceSq(x, y, enemy.x, enemy.y);
      if (distSq < bestDistance) {
        bestDistance = distSq;
        best = enemy;
      }
    }
    return best;
  }

  function spawnProjectile(run, config) {
    run.projectiles.push({
      id: makeId(),
      x: config.x,
      y: config.y,
      vx: config.vx,
      vy: config.vy,
      radius: config.radius,
      life: config.life || 1.4,
      damage: config.damage,
      color: config.color,
      friendly: true,
      pierce: config.pierce || 0,
      splashRadius: config.splashRadius || 0,
      owner: config.owner || "player",
      towerId: config.towerId || null,
      attackerX: config.attackerX,
      attackerY: config.attackerY,
      canCrit: config.canCrit,
      knockback: config.knockback || 160,
      burnChance: config.burnChance || 0,
      slowChance: config.slowChance || 0,
      chainLeft: config.chainLeft || 0,
      homing: config.homing || 0,
      turnRate: config.turnRate || config.homing || 0,
      missile: Boolean(config.missile),
      shootable: config.shootable ?? Boolean(config.missile),
      missileHp: config.missile ? (config.missileHp || 2) : 0,
      interceptDamage: config.interceptDamage || (config.splashRadius ? 2 : config.radius >= 6 ? 2 : 1),
      engineColor: config.engineColor || "#ffd08f",
      exhaustColor: config.exhaustColor || "#fff1c6",
      trailTimer: 0,
      hitIds: [],
      explodeOnExpire: config.explodeOnExpire || false
    });
  }

  function spawnEnemyProjectile(run, config) {
    run.enemyProjectiles.push({
      id: makeId(),
      x: config.x,
      y: config.y,
      vx: config.vx,
      vy: config.vy,
      radius: config.radius,
      life: config.life || 2.2,
      damage: config.damage,
      color: getScaryProjectileColor(config),
      friendly: false,
      slow: config.slow || 0,
      splashRadius: config.splashRadius || 0,
      homing: config.homing || 0,
      turnRate: config.turnRate || config.homing || 0,
      missile: Boolean(config.missile),
      shootable: config.shootable ?? Boolean(config.missile),
      missileHp: config.missile ? (config.missileHp || 2) : 0,
      interceptDamage: config.interceptDamage || (config.splashRadius ? 2 : config.radius >= 6 ? 2 : 1),
      engineColor: config.engineColor || "#ff9c5c",
      exhaustColor: config.exhaustColor || "#ffd4a3",
      trailTimer: 0,
      hitIds: [],
      explodeOnExpire: config.explodeOnExpire || false
    });
  }

  function explodeProjectile(run, projectile, friendly, damageMultiplier = 1) {
    const shouldExplode = projectile.explodeOnExpire || projectile.splashRadius || projectile.missile;
    if (!shouldExplode) {
      return;
    }
    const radius = projectile.splashRadius || (projectile.missile ? 44 : 0);
    if (radius > 0) {
      spawnHazard(run, {
        x: projectile.x,
        y: projectile.y,
        radius,
        damage: projectile.damage * damageMultiplier,
        delay: 0,
        duration: 0.24,
        source: friendly ? "player" : "enemy",
        color: projectile.color,
        knockback: projectile.missile ? 240 : 220
      });
      spawnEffectRing(run, {
        x: projectile.x,
        y: projectile.y,
        radius: Math.max(10, radius * 0.2),
        growth: radius * 2.2,
        life: projectile.missile ? 0.28 : 0.2,
        color: projectile.engineColor || projectile.color,
        lineWidth: projectile.missile ? 3.2 : 2.4,
        fillAlpha: 0.12
      });
    }
    burstParticles(run, projectile.x, projectile.y, projectile.engineColor || projectile.color, projectile.missile ? 16 : 10, 18, 140, 1.8, 4.5, 0.18, 0.42);
  }

  function interceptProjectile(run, projectile, opposing, friendly) {
    if ((!projectile.missile && !opposing.missile) || (!projectile.shootable && !opposing.shootable)) {
      return false;
    }
    if (distanceSq(projectile.x, projectile.y, opposing.x, opposing.y) >= (projectile.radius + opposing.radius) ** 2) {
      return false;
    }

    if (projectile.missile) {
      projectile.missileHp -= opposing.interceptDamage || 1;
    } else {
      projectile.life = -1;
    }
    if (opposing.missile) {
      opposing.missileHp -= projectile.interceptDamage || 1;
    } else {
      opposing.life = -1;
    }

    const midX = (projectile.x + opposing.x) * 0.5;
    const midY = (projectile.y + opposing.y) * 0.5;
    burstParticles(run, midX, midY, projectile.missile ? projectile.engineColor : opposing.engineColor || "#ffd8bf", 10, 12, 110, 1.5, 3.5, 0.14, 0.28);

    if (opposing.missile && opposing.missileHp <= 0 && opposing.life > 0) {
      explodeProjectile(run, opposing, !friendly, 0.6);
      opposing.life = -1;
    }
    if (projectile.missile && projectile.missileHp <= 0 && projectile.life > 0) {
      explodeProjectile(run, projectile, friendly, 0.6);
      projectile.life = -1;
      return true;
    }
    return projectile.life <= 0;
  }

  function refreshSupportUnits(run) {
    const desiredOrbitals = run.player.stats.orbitals;
    const currentOrbitals = run.orbitals.filter((item) => item.source === "relic");
    while (currentOrbitals.length < desiredOrbitals) {
      const orbital = {
        id: makeId(),
        source: "relic",
        angle: Math.random() * TWO_PI,
        radius: 66 + currentOrbitals.length * 10,
        hitCooldown: 0
      };
      run.orbitals.push(orbital);
      currentOrbitals.push(orbital);
    }
    while (currentOrbitals.length > desiredOrbitals) {
      const orbital = currentOrbitals.pop();
      const index = run.orbitals.findIndex((item) => item.id === orbital.id);
      if (index >= 0) {
        run.orbitals.splice(index, 1);
      }
    }

    const desiredDrones = run.player.stats.drones;
    const relicDrones = run.drones.filter((item) => item.source === "relic");
    while (relicDrones.length < desiredDrones) {
      const drone = {
        id: makeId(),
        source: "relic",
        angle: Math.random() * TWO_PI,
        orbit: 86 + relicDrones.length * 14,
        duration: Infinity,
        fireCooldown: Math.random() * 0.8
      };
      run.drones.push(drone);
      relicDrones.push(drone);
    }
    while (relicDrones.length > desiredDrones) {
      const drone = relicDrones.pop();
      const index = run.drones.findIndex((item) => item.id === drone.id);
      if (index >= 0) {
        run.drones.splice(index, 1);
      }
    }
  }

  function spawnTemporaryDrones(run, count, duration) {
    for (let index = 0; index < count; index += 1) {
      run.drones.push({
        id: makeId(),
        source: "ability",
        angle: Math.random() * TWO_PI,
        orbit: 92 + index * 12,
        duration,
        fireCooldown: Math.random() * 0.6
      });
    }
  }

  function applyBurn(enemy, damage) {
    enemy.burnTimer = Math.max(enemy.burnTimer || 0, 2.6);
    enemy.burnDamage = Math.max(enemy.burnDamage || 0, damage);
    enemy.burnTick = 0.24;
  }

  function applySlow(enemy) {
    enemy.slowTimer = Math.max(enemy.slowTimer || 0, 1.2);
    enemy.slowFactor = Math.max(enemy.slowFactor || 0, 0.34);
  }

  function dealDamageToReactor(run, amount) {
    if (run.objective.type !== "defense" || !run.objective.reactor.alive) {
      return;
    }
    if (run.objective.complete) {
      return;
    }
    const reactor = run.objective.reactor;
    let damage = amount * 0.5;
    if (reactor.playerInRing) {
      damage *= 0.82;
    }
    reactor.shieldDelayRemaining = 2.4;
    reactor.hitFlash = 0.5;
    reactor.warnFlash = 0.35;
    if (reactor.shield > 0) {
      const absorbed = Math.min(reactor.shield, damage);
      reactor.shield -= absorbed;
      damage -= absorbed;
    }
    if (damage > 0) {
      reactor.hp -= damage;
    }
    burstParticles(run, reactor.x, reactor.y, "#ffb06a", 8, 20, 90, 2, 4, 0.2, 0.5);
    if (reactor.hp <= 0) {
      reactor.hp = 0;
      reactor.alive = false;
      game.failRun("The reactor was destroyed.");
    }
  }

  function healPlayer(run, amount) {
    const before = run.player.hp;
    run.player.hp = clamp(run.player.hp + amount, 0, run.player.stats.maxHealth);
    const healed = run.player.hp - before;
    const overflow = Math.max(0, before + amount - run.player.hp);
    if (overflow > 0 && run.player.relicSynergies?.bloodReserve) {
      grantShield(run, overflow * 0.7);
    }
    if (healed > 0.4) {
      run.player.healFlash = Math.max(run.player.healFlash, Math.min(0.45, 0.08 + healed / Math.max(20, run.player.stats.maxHealth * 0.28)));
      if (healed >= 6) {
        spawnEffectRing(run, {
          x: run.player.x,
          y: run.player.y,
          radius: run.player.radius + 4,
          growth: 90,
          life: 0.18,
          color: "#ffd3dc",
          lineWidth: 2,
          fillAlpha: 0.06
        });
      }
    }
  }

  function grantShield(run, amount) {
    const before = run.player.shield;
    run.player.shield = clamp(run.player.shield + amount, 0, run.player.stats.maxShield);
    const gained = run.player.shield - before;
    if (gained > 0.4) {
      run.player.shieldFlash = Math.max(run.player.shieldFlash, Math.min(0.5, 0.08 + gained / Math.max(18, run.player.stats.maxShield * 0.22)));
      if (gained >= 7) {
        spawnEffectRing(run, {
          x: run.player.x,
          y: run.player.y,
          radius: run.player.radius + 7,
          growth: 110,
          life: 0.2,
          color: "#9feaff",
          lineWidth: 2.2,
          fillAlpha: 0.08
        });
      }
    }
  }

  function applyPlayerHot(run, config) {
    const existing = run.player.hots.find((hot) => hot.id === config.id);
    if (existing) {
      existing.duration = Math.max(existing.duration, config.duration);
      existing.healPerSecond = Math.max(existing.healPerSecond, config.healPerSecond || 0);
      existing.shieldPerSecond = Math.max(existing.shieldPerSecond, config.shieldPerSecond || 0);
      existing.color = config.color || existing.color;
      existing.name = config.name || existing.name;
      return;
    }
    run.player.hots.push({
      id: config.id,
      name: config.name,
      duration: config.duration,
      healPerSecond: config.healPerSecond || 0,
      shieldPerSecond: config.shieldPerSecond || 0,
      color: config.color || "#bfffe8"
    });
  }

  function emitPulse(run, x, y, radius, damage, source, color, stunDuration) {
    spawnHazard(run, {
      x,
      y,
      radius,
      damage,
      delay: 0,
      duration: 0.35,
      source,
      color,
      knockback: 280,
      kind: "blast"
    });
    for (const enemy of run.enemies) {
      if (!enemy.alive) {
        continue;
      }
      const dist = distance(x, y, enemy.x, enemy.y);
      if (dist <= radius + enemy.radius) {
        const direction = normalize(enemy.x - x, enemy.y - y);
        enemy.vx += direction.x * 180;
        enemy.vy += direction.y * 180;
        if (stunDuration) {
          enemy.stunTimer = Math.max(enemy.stunTimer || 0, stunDuration);
        }
      }
    }
    burstParticles(run, x, y, color, 22, 20, 200, 2, 6, 0.25, 0.6);
    spawnEffectRing(run, {
      x,
      y,
      radius: Math.max(18, radius * 0.16),
      growth: radius * 1.6,
      life: 0.34,
      color,
      lineWidth: 4,
      fillAlpha: 0.12
    });
  }

  function createEnemy(run, kind, x, y, options = {}) {
    const base = ENEMY_DATA[kind];
    const threat = run.contract.threat;
    const eliteFactor = options.elite ? 1.9 : 1;
    const enemy = {
      id: makeId(),
      type: "enemy",
      kind,
      x,
      y,
      radius: base.radius + (options.elite ? 2 : 0),
      hp: (base.hp + threat * 15) * eliteFactor,
      maxHp: (base.hp + threat * 15) * eliteFactor,
      shield: 0,
      maxShield: 0,
      damage: (base.damage + threat * 2.25) * (options.elite ? 1.26 : 1),
      speed: base.speed * (options.elite ? 1.1 : 1),
      xp: Math.round(base.xp * eliteFactor),
      scrap: Math.round(base.scrap * eliteFactor),
      color: options.color || base.color,
      elite: Boolean(options.elite),
      alive: true,
      vx: 0,
      vy: 0,
      facing: Math.random() * TWO_PI,
      fireCooldown: Math.random() * 1.3,
      contactCooldown: 0,
      supportCooldown: 2 + Math.random() * 2,
      chargeCooldown: 2.2 + Math.random(),
      cooldownMultiplier: 1,
      specialMultiplier: 1,
      chargeTime: 0,
      orbitDirection: Math.random() > 0.5 ? 1 : -1,
      objectiveTarget: Boolean(options.objectiveTarget),
      reactorFocus: Boolean(options.reactorFocus),
      convoyFocus: Boolean(options.convoyFocus),
      playerAggro: 0,
      towerAggro: 0,
      towerAggroTargetId: null,
      commandLink: 0,
      siphonInfusion: 0,
      emberInfusion: 0,
      thermalShockCooldown: 0,
      slowTimer: 0,
      slowFactor: 0,
      burnTimer: 0,
      burnDamage: 0,
      burnTick: 0.25,
      stunTimer: 0,
      hitFlash: 0
    };
    applyContractMutatorsToEnemy(run, enemy);
    run.enemies.push(enemy);
    run.stats.enemiesSpawned += 1;
    return enemy;
  }

  function createBoss(run) {
    const bossDef = BOSS_DATA[run.zone.bossId];
    const point = findOpenPoint(run, run.rng, 550);
    const hpMultiplier = 1 + (run.contract.threat - 1) * 0.4;
    const boss = {
      id: makeId(),
      type: "boss",
      bossId: bossDef.id,
      name: bossDef.name,
      x: point.x,
      y: point.y,
      radius: bossDef.radius,
      hp: bossDef.hp * hpMultiplier,
      maxHp: bossDef.hp * hpMultiplier,
      shield: 0,
      maxShield: 0,
      damage: bossDef.damage * (1 + (run.contract.threat - 1) * 0.18),
      speed: bossDef.speed,
      color: bossDef.color,
      alive: true,
      vx: 0,
      vy: 0,
      facing: Math.random() * TWO_PI,
      fireCooldown: 1.15,
      contactCooldown: 0.55,
      specialCooldown: bossDef.specialCooldown,
      cooldownMultiplier: 1,
      specialMultiplier: 1,
      patternValue: 0,
      phaseTriggered: false,
      beam: null,
      commandLink: 0,
      siphonInfusion: 0,
      emberInfusion: 0,
      thermalShockCooldown: 0,
      supportPulseCooldown: 3.2 + Math.random() * 1.4,
      hitFlash: 0,
      slowTimer: 0,
      slowFactor: 0,
      burnTimer: 0,
      burnDamage: 0,
      burnTick: 0.25,
      stunTimer: 0
    };
    applyContractMutatorsToEnemy(run, boss);
    run.boss = boss;
    run.enemies.push(boss);
    run.flags.bossPhase = true;
    run.stats.bossDamageTaken = 0;
    burstParticles(run, boss.x, boss.y, boss.color, 32, 24, 220, 2.4, 6.4, 0.22, 0.62);
    spawnEffectRing(run, {
      x: boss.x,
      y: boss.y,
      radius: boss.radius * 0.7,
      growth: 320,
      life: 0.6,
      color: boss.color,
      lineWidth: 5,
      fillAlpha: 0.16
    });
    game.addScreenShake(16);
    game.pushNotification("Boss Contact", `${boss.name} has entered the battlefield.`, "warn");
    game.playSfx("bossSpawn");
  }

  function applyContractMutatorsToEnemy(run, enemy) {
    const mutators = run.contract.mutators;
    if (mutators.includes("overclocked")) {
      enemy.speed *= 1.18;
      enemy.cooldownMultiplier = 0.82;
      enemy.specialMultiplier = 0.88;
      enemy.fireCooldown *= 0.84;
      if (typeof enemy.supportCooldown === "number") {
        enemy.supportCooldown *= 0.88;
      }
      if (typeof enemy.chargeCooldown === "number") {
        enemy.chargeCooldown *= 0.88;
      }
      if (typeof enemy.specialCooldown === "number") {
        enemy.specialCooldown *= 0.88;
      }
    }
    if (mutators.includes("shielded")) {
      enemy.maxShield = enemy.maxHp * 0.28;
      enemy.shield = enemy.maxShield;
    }
    if (mutators.includes("hunter") && (enemy.elite || enemy.type === "boss")) {
      enemy.hp *= 1.12;
      enemy.maxHp *= 1.12;
      enemy.damage *= 1.12;
    }
  }

