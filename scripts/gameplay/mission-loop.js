// Player weapons, abilities, AI, projectiles, and the mission update loop.
"use strict";

  function firePlayerWeapon(run) {
    const player = run.player;
    const classData = CLASS_DATA[player.classId];
    const angle = player.facing;
    const overdriveMultiplier = player.buffs.overdrive > 0 ? 1.42 : 1;
    const salvageRushFireRate = player.buffs.salvageRush > 0 ? 1.12 : 1;
    const comboPower = getComboPowerModifiers(run);
    const damageBuff = (player.buffs.salvageRush > 0 ? 1.16 : 1) * comboPower.damage;
    const weaponDamageMultiplier = getWeaponDamageMultiplier(classData.weapon);
    player.fireCooldown = 1 / (player.stats.fireRate * overdriveMultiplier * salvageRushFireRate * comboPower.fireRate);
    run.stats.shots += 1;
    const muzzleX = player.x + Math.cos(angle) * (player.radius + 6);
    const muzzleY = player.y + Math.sin(angle) * (player.radius + 6);
    const shotImpact = {
      rifle: 0.95,
      auto: 0.8,
      cannon: 1.55,
      arc: 1.15
    }[classData.weapon] || 1;
    player.weaponFlash = Math.max(player.weaponFlash, 0.14 + shotImpact * 0.14);

    const extraProjectiles = Math.max(0, player.stats.projectiles - 1);
    if (classData.weapon === "rifle") {
      const pellets = 2 + extraProjectiles;
      for (let index = 0; index < pellets; index += 1) {
        const offset = (index - (pellets - 1) / 2) * 0.08;
        const finalAngle = angle + offset + (Math.random() - 0.5) * 0.03;
        spawnProjectile(run, {
          x: player.x + Math.cos(finalAngle) * 22,
          y: player.y + Math.sin(finalAngle) * 22,
          vx: Math.cos(finalAngle) * player.stats.projectileSpeed,
          vy: Math.sin(finalAngle) * player.stats.projectileSpeed,
          radius: 4.8 * player.stats.projectileSize,
          damage: player.stats.damage * weaponDamageMultiplier * damageBuff,
          color: classData.color,
          pierce: player.stats.pierce,
          knockback: 160,
          burnChance: player.stats.burnChance,
          slowChance: player.stats.slowChance,
          chainLeft: player.stats.chainCount
        });
      }
    }

    if (classData.weapon === "auto") {
      const total = 1 + extraProjectiles;
      player.barrelSwap = !player.barrelSwap;
      const side = player.barrelSwap ? 1 : -1;
      for (let index = 0; index < total; index += 1) {
        const offset = (index - (total - 1) / 2) * 0.065;
        const finalAngle = angle + offset + (Math.random() - 0.5) * 0.04;
        const sideAngle = angle + Math.PI / 2;
        const muzzleX = player.x + Math.cos(sideAngle) * 8 * side + Math.cos(finalAngle) * 18;
        const muzzleY = player.y + Math.sin(sideAngle) * 8 * side + Math.sin(finalAngle) * 18;
        spawnProjectile(run, {
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(finalAngle) * player.stats.projectileSpeed * 1.08,
          vy: Math.sin(finalAngle) * player.stats.projectileSpeed * 1.08,
          radius: 4.1 * player.stats.projectileSize,
          damage: player.stats.damage * weaponDamageMultiplier * damageBuff,
          color: classData.color,
          pierce: player.stats.pierce,
          knockback: 110,
          burnChance: player.stats.burnChance,
          slowChance: player.stats.slowChance,
          chainLeft: player.stats.chainCount
        });
      }
    }

    if (classData.weapon === "cannon") {
      const total = Math.max(1, 1 + Math.floor(extraProjectiles / 2));
      for (let index = 0; index < total; index += 1) {
        const offset = (index - (total - 1) / 2) * 0.12;
        const finalAngle = angle + offset;
        spawnProjectile(run, {
          x: player.x + Math.cos(finalAngle) * 22,
          y: player.y + Math.sin(finalAngle) * 22,
          vx: Math.cos(finalAngle) * player.stats.projectileSpeed * 0.8,
          vy: Math.sin(finalAngle) * player.stats.projectileSpeed * 0.8,
          radius: 7 * player.stats.projectileSize,
          damage: player.stats.damage * weaponDamageMultiplier * damageBuff,
          color: classData.color,
          pierce: player.stats.pierce,
          splashRadius: 62,
          explodeOnExpire: true,
          knockback: 260,
          burnChance: player.stats.burnChance,
          slowChance: player.stats.slowChance,
          chainLeft: 0
        });
      }
    }

    if (classData.weapon === "arc") {
      const total = 1 + extraProjectiles;
      for (let index = 0; index < total; index += 1) {
        const offset = (index - (total - 1) / 2) * 0.1;
        const finalAngle = angle + offset;
        spawnProjectile(run, {
          x: player.x + Math.cos(finalAngle) * 18,
          y: player.y + Math.sin(finalAngle) * 18,
          vx: Math.cos(finalAngle) * player.stats.projectileSpeed * 0.85,
          vy: Math.sin(finalAngle) * player.stats.projectileSpeed * 0.85,
          radius: 5.6 * player.stats.projectileSize,
          damage: player.stats.damage * weaponDamageMultiplier * damageBuff,
          color: classData.color,
          pierce: player.stats.pierce,
          chainLeft: Math.max(1, player.stats.chainCount),
          knockback: 120,
          burnChance: player.stats.burnChance,
          slowChance: player.stats.slowChance,
          homing: 0.08
        });
      }
    }
    firePrototypeWeapon(run, player, angle);
    spawnMuzzleFlash(run, muzzleX, muzzleY, angle, classData.color, shotImpact);
    game.addScreenShake(classData.weapon === "cannon" ? 4.2 : classData.weapon === "arc" ? 2.3 : classData.weapon === "rifle" ? 1.7 : 1.1);
    game.playSfx("shoot");
  }

  function firePrototypeWeapon(run, player, angle) {
    if (!player.prototypeWeapon) {
      return;
    }
    const weapon = PROTOTYPE_WEAPONS[player.prototypeWeapon.id];
    if (player.prototypeWeapon.id === "ionLance") {
      spawnProjectile(run, {
        x: player.x + Math.cos(angle) * 18,
        y: player.y + Math.sin(angle) * 18,
        vx: Math.cos(angle) * 980,
        vy: Math.sin(angle) * 980,
        radius: 5.2,
        damage: player.stats.damage * 0.9,
        color: weapon.color,
        pierce: 2 + player.stats.pierce,
        knockback: 170,
        burnChance: 0,
        slowChance: 0.12,
        chainLeft: Math.max(1, player.stats.chainCount),
        homing: 0.05
      });
    }
    if (player.prototypeWeapon.id === "swarmRack" && player.prototypeWeapon.auxCooldown <= 0) {
      player.prototypeWeapon.auxCooldown = 0.42;
      spawnMissileSwarm(run, player.x, player.y, 2, player.stats.damage * 0.82, weapon.color, angle);
    }
    if (player.prototypeWeapon.id === "fractureCannon") {
      spawnPlayerFan(run, player.x, player.y, angle, 4, 0.58, 700, player.stats.damage * 0.48, weapon.color, {
        radius: 4.4,
        splashRadius: 42,
        explodeOnExpire: true,
        knockback: 130
      });
    }
    if (player.prototypeWeapon.id === "beamLaser" && player.prototypeWeapon.auxCooldown <= 0) {
      player.prototypeWeapon.auxCooldown = 0.62;
      fireBeamLaser(run, {
        x: player.x + Math.cos(angle) * 12,
        y: player.y + Math.sin(angle) * 12,
        angle,
        length: 760,
        width: 13,
        damage: player.stats.damage * 1.6,
        color: weapon.color,
        source: "player",
        knockback: 100
      });
    }
  }

  function useAbilitySlot(run, slot) {
    const player = run.player;
    if (!run || !player) {
      return;
    }
    if (!isAbilityUnlocked(player, slot)) {
      const def = getAbilityDefinitionForClass(player.classId, slot);
      if ((player.lockedAbilityHintAt || 0) + 1.5 < run.time) {
        player.lockedAbilityHintAt = run.time;
        game.pushNotification(`${ABILITY_SLOT_META[slot].key} Locked`, `${def.name} unlocks at level ${def.unlockLevel}.`, "warn");
      }
      return;
    }
    if (player.abilityCooldowns[slot] > 0) {
      return;
    }
    const classData = CLASS_DATA[player.classId];
    const color = classData.color;
    const target = getClampedPointerTarget(run, slot === "t" ? 560 : 420);
    const facing = angleTo(player.x, player.y, target.x, target.y);
    const damageBudget = getAbilityDamageBudget(run, slot);
    player.abilityCooldowns[slot] = getAbilityCooldownSeconds(player, slot);

    if (player.classId === "vanguard") {
      if (slot === "q") {
        emitPulse(run, player.x, player.y, 250, damageBudget * 0.42, "player", color, 0.36);
        grantShield(run, 58);
        healPlayer(run, 10);
        applyPlayerHot(run, {
          id: "naniteRetrofit",
          name: "Nanite Retrofit",
          duration: 4.2,
          healPerSecond: 3.6 + player.level * 0.22,
          shieldPerSecond: 5.2 + player.level * 0.32,
          color: "#c8fbff"
        });
        spawnMissileSwarm(run, player.x, player.y, 3, splitDamage(damageBudget * 0.34, 3), color, player.facing);
      }
      if (slot === "e") {
        player.x += Math.cos(facing) * 145;
        player.y += Math.sin(facing) * 145;
        resolveWorldCollision(run, player);
        player.invuln = Math.max(player.invuln, 0.22);
        emitPulse(run, player.x, player.y, 185, damageBudget * 0.46, "player", color, 0.42);
        spawnPlayerFan(run, player.x, player.y, facing, 5, 0.7, 760, splitDamage(damageBudget * 0.42, 5), color, { radius: 5, pierce: 1, knockback: 180 });
      }
      if (slot === "r") {
        spawnMissileSwarm(run, player.x, player.y, 7, splitDamage(damageBudget * 0.88, 7), color, facing);
        grantShield(run, 30);
      }
      if (slot === "t") {
        grantShield(run, player.stats.maxShield);
        emitPulse(run, player.x, player.y, 220, damageBudget * 0.4, "player", color, 0.55);
        addPlayerField(run, "bastion", player.x, player.y, 215, 9.5, color, { tick: 0.38, damage: Math.max(4.2, damageBudget / 34) });
        addPlayerField(run, "repairZone", player.x, player.y, 165, 7.5, "#bfffe7", {
          tick: 0.2,
          healPerSecond: 4.4 + player.level * 0.3,
          shieldPerSecond: 7 + player.level * 0.4
        });
        spawnTargetBlasts(run, target.x, target.y, 6, 170, splitDamage(damageBudget * 0.34, 6), "#dff7ff", 0.36, 0.1);
      }
    }

    if (player.classId === "striker") {
      if (slot === "q") {
        player.buffs.overdrive = Math.max(player.buffs.overdrive, 5.6);
        player.buffs.salvageRush = Math.max(player.buffs.salvageRush, 4);
        player.dashCooldownRemaining = 0;
        emitPulse(run, player.x, player.y, 130, damageBudget * 0.22, "player", color, 0.2);
        spawnPlayerNova(run, player.x, player.y, 10, 520, splitDamage(damageBudget * 0.36, 10), color, { radius: 4.2, offset: 10 });
      }
      if (slot === "e") {
        spawnPlayerFan(run, player.x, player.y, facing, 8, 0.94, 820, splitDamage(damageBudget * 0.84, 8), color, { radius: 4.6, knockback: 120 });
        addPlayerField(run, "emberField", player.x + Math.cos(facing) * 120, player.y + Math.sin(facing) * 120, 80, 4.4, "#ff9b70", {
          tick: 0.36,
          damage: Math.max(3.2, damageBudget / 42),
          burnChance: 1
        });
        player.invuln = Math.max(player.invuln, 0.1);
      }
      if (slot === "r") {
        spawnMissileSwarm(run, player.x, player.y, 5, splitDamage(damageBudget * 0.3, 5), color, facing);
        spawnPlayerNova(run, player.x, player.y, 10, 420, splitDamage(damageBudget * 0.32, 10), color, { radius: 4, homing: 0.08, offset: 12 });
        spawnTemporaryOrbitals(run, 1, 9);
      }
      if (slot === "t") {
        player.buffs.overdrive = Math.max(player.buffs.overdrive, 8.5);
        player.buffs.salvageRush = Math.max(player.buffs.salvageRush, 7.4);
        spawnTemporaryOrbitals(run, 2, 10);
        spawnTemporaryDrones(run, 2, 10);
        spawnPlayerNova(run, player.x, player.y, 14, 520, splitDamage(damageBudget * 0.58, 14), "#ffffff", { radius: 4.8, homing: 0.1, offset: 12 });
      }
    }

    if (player.classId === "warden") {
      if (slot === "q") {
        addPlayerField(run, "bastion", player.x, player.y, 190, 8.5, color, { tick: 0.4, damage: Math.max(4.2, damageBudget / 38) });
        addPlayerField(run, "repairZone", player.x, player.y, 155, 5.8, "#b8ffd9", {
          tick: 0.2,
          healPerSecond: 5.2 + player.level * 0.26,
          shieldPerSecond: 6.2 + player.level * 0.32
        });
        grantShield(run, 36);
        emitPulse(run, player.x, player.y, 150, damageBudget * 0.18, "player", color, 0.18);
      }
      if (slot === "e") {
        spawnTargetBlasts(run, target.x, target.y, 3, 74, splitDamage(damageBudget * 0.62, 3), color, 0.36, 0.18);
        addPlayerField(run, "emberField", target.x, target.y, 102, 4.6, "#ffae76", {
          tick: 0.38,
          damage: Math.max(3.8, damageBudget / 44),
          burnChance: 1
        });
      }
      if (slot === "r") {
        spawnTemporaryOrbitals(run, 2, 11);
        spawnTemporaryDrones(run, 1, 10);
        grantShield(run, 30);
        emitPulse(run, player.x, player.y, 160, damageBudget * 0.16, "player", color, 0.2);
        spawnPlayerNova(run, player.x, player.y, 8, 340, splitDamage(damageBudget * 0.28, 8), color, { radius: 4.6, offset: 12, knockback: 120 });
      }
      if (slot === "t") {
        emitPulse(run, player.x, player.y, 270, damageBudget * 0.38, "player", color, 0.7);
        spawnTargetBlasts(run, target.x, target.y, 7, 180, splitDamage(damageBudget * 0.38, 7), "#fff0d3", 0.3, 0.1);
        addPlayerField(run, "gravityWell", target.x, target.y, 112, 6.6, "#ffd38f", { tick: 0.38, damage: Math.max(3.6, damageBudget / 54) });
      }
    }

    if (player.classId === "oracle") {
      if (slot === "q") {
        spawnTemporaryDrones(run, 2, 11);
        emitPulse(run, player.x, player.y, 160, damageBudget * 0.24, "player", color, 0.24);
        spawnPlayerNova(run, player.x, player.y, 6, 360, splitDamage(damageBudget * 0.22, 6), color, { radius: 4.4, offset: 10, chainLeft: 1 });
        applyPlayerHot(run, {
          id: "latticeRenewal",
          name: "Lattice Renewal",
          duration: 4,
          healPerSecond: 2.8 + player.level * 0.18,
          shieldPerSecond: 4.8 + player.level * 0.26,
          color: "#d8f6ff"
        });
      }
      if (slot === "e") {
        addPlayerField(run, "arcPrison", target.x, target.y, 118, 5.8, color, { tick: 0.34, damage: Math.max(3.2, damageBudget / 26) });
        burstParticles(run, target.x, target.y, color, 20, 20, 160, 2, 5, 0.2, 0.55);
      }
      if (slot === "r") {
        const origin = { x: player.x, y: player.y };
        player.x = target.x;
        player.y = target.y;
        resolveWorldCollision(run, player);
        player.invuln = Math.max(player.invuln, 0.28);
        emitPulse(run, origin.x, origin.y, 120, damageBudget * 0.26, "player", color, 0.16);
        emitPulse(run, player.x, player.y, 145, damageBudget * 0.38, "player", color, 0.3);
      }
      if (slot === "t") {
        addPlayerField(run, "stormField", target.x, target.y, 142, 7.5, color, { tick: 0.36, damage: Math.max(2.4, damageBudget / 60) });
        addPlayerField(run, "gravityWell", target.x, target.y, 92, 5.8, "#d7c1ff", { tick: 0.4, damage: Math.max(3.2, damageBudget / 64) });
        spawnTemporaryDrones(run, 2, 10);
        spawnMissileSwarm(run, player.x, player.y, 6, splitDamage(damageBudget * 0.26, 6), color, facing);
      }
    }

    if (player.relicSynergies?.eventHorizon) {
      addPlayerField(run, "gravityWell", target.x, target.y, 88, 4.6, "#d9e8ff", {
        tick: 0.34,
        damage: Math.max(4, damageBudget / 20)
      });
      spawnPlayerNova(run, target.x, target.y, 6, 360, splitDamage(damageBudget * 0.16, 6), "#e9f8ff", {
        radius: 4,
        chainLeft: 1,
        offset: 8
      });
    }
    if (player.stats.abilityBlast > 0) {
      emitPulse(run, target.x, target.y, 100 + player.stats.abilityBlast * 28, damageBudget * 0.18, "player", "#d5f7ff", 0.3);
    }
    player.weaponFlash = Math.max(player.weaponFlash, 0.24);
    burstParticles(run, player.x, player.y, color, 24, 30, 220, 2, 5.5, 0.22, 0.6);
    spawnEffectRing(run, {
      x: player.x,
      y: player.y,
      radius: player.radius + 10,
      growth: 180,
      life: 0.26,
      color,
      lineWidth: 3,
      fillAlpha: 0.12
    });
    game.addScreenShake(slot === "t" ? 16 : slot === "r" ? 11 : 8);
    game.playSfx("ability");
  }

  function tryDash(run) {
    const player = run.player;
    if (player.dashCooldownRemaining > 0 || player.dashTime > 0) {
      return;
    }
    let dx = 0;
    let dy = 0;
    if (game.keys.KeyW) {
      dy -= 1;
    }
    if (game.keys.KeyS) {
      dy += 1;
    }
    if (game.keys.KeyA) {
      dx -= 1;
    }
    if (game.keys.KeyD) {
      dx += 1;
    }
    if (dx === 0 && dy === 0) {
      dx = Math.cos(player.facing);
      dy = Math.sin(player.facing);
    }
    const direction = normalize(dx, dy);
    player.dashDirection = direction;
    player.dashTime = 0.17;
    player.invuln = 0.22;
    player.dashFlash = Math.max(player.dashFlash, 0.7);
    player.afterimageTimer = 0;
    player.dashCooldownRemaining = player.stats.dashCooldown;
    magnetizePickups(run, player.x, player.y, player.stats.pickupRadius * 1.1);
    if (player.stats.dashMine > 0) {
      spawnHazard(run, {
        x: player.x,
        y: player.y,
        radius: 62 + player.stats.dashMine * 16,
        damage: 24 + player.stats.dashMine * 14,
        delay: 0.18,
        duration: 0.35,
        source: "player",
        color: "#83e2ff",
        knockback: 220
      });
    }
    burstParticles(run, player.x, player.y, CLASS_DATA[player.classId].color, 16, 30, 260, 2, 4.5, 0.15, 0.4);
    spawnAfterimage(run, player, { life: 0.24, scale: 1.06 });
    spawnEffectRing(run, {
      x: player.x,
      y: player.y,
      radius: player.radius + 8,
      growth: 170,
      life: 0.24,
      color: CLASS_DATA[player.classId].color,
      lineWidth: 2.8,
      fillAlpha: 0.1
    });
    game.addScreenShake(6);
    game.playSfx("dash");
  }

  function updatePlayer(run, dt) {
    const player = run.player;
    const comboPower = getComboPowerModifiers(run);
    const classColor = CLASS_DATA[player.classId].color;
    player.inBastion = false;
    player.facing = angleTo(player.x, player.y, game.pointer.worldX, game.pointer.worldY);
    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
    player.dashCooldownRemaining = Math.max(0, player.dashCooldownRemaining - dt);
    player.weaponFlash = Math.max(0, player.weaponFlash - dt * 7.5);
    player.damageFlash = Math.max(0, player.damageFlash - dt * 2.8);
    player.healFlash = Math.max(0, player.healFlash - dt * 2.2);
    player.shieldFlash = Math.max(0, player.shieldFlash - dt * 2.5);
    player.comboFlash = Math.max(0, player.comboFlash - dt * 1.8);
    player.dashFlash = Math.max(0, player.dashFlash - dt * 5.8);
    player.afterimageTimer = Math.max(0, player.afterimageTimer - dt);
    for (const slot of ABILITY_SLOT_ORDER) {
      player.abilityCooldowns[slot] = Math.max(0, player.abilityCooldowns[slot] - dt);
    }
    player.invuln = Math.max(0, player.invuln - dt);
    player.shieldDelayRemaining = Math.max(0, player.shieldDelayRemaining - dt);
    player.buffs.overdrive = Math.max(0, player.buffs.overdrive - dt);
    player.buffs.salvageRush = Math.max(0, player.buffs.salvageRush - dt);
    player.buffs.magnetField = Math.max(0, player.buffs.magnetField - dt);
    player.comboPower.timer = Math.max(0, player.comboPower.timer - dt);
    if (player.comboPower.timer <= 0) {
      player.comboPower.tier = 0;
    }
    for (const hot of player.hots) {
      hot.duration -= dt;
      if (hot.healPerSecond > 0) {
        healPlayer(run, hot.healPerSecond * dt);
      }
      if (hot.shieldPerSecond > 0) {
        grantShield(run, hot.shieldPerSecond * dt);
      }
    }
    player.hots = player.hots.filter((hot) => hot.duration > 0);
    if (player.prototypeWeapon) {
      player.prototypeWeapon.time -= dt;
      player.prototypeWeapon.auxCooldown = Math.max(0, player.prototypeWeapon.auxCooldown - dt);
      if (player.prototypeWeapon.time <= 0) {
        game.pushNotification("Prototype Offline", `${PROTOTYPE_WEAPONS[player.prototypeWeapon.id].name} has burned out.`, "warn");
        player.prototypeWeapon = null;
      }
    }

    if (player.stats.healRegen > 0) {
      healPlayer(run, player.stats.healRegen * dt);
    }

    if (player.shieldDelayRemaining <= 0 && player.shield < player.stats.maxShield) {
      player.shield = clamp(player.shield + player.stats.shieldRegenRate * dt, 0, player.stats.maxShield);
    }

    if (player.dashTime > 0) {
      player.dashTime -= dt;
      player.vx = player.dashDirection.x * player.stats.dashSpeed;
      player.vy = player.dashDirection.y * player.stats.dashSpeed;
      if (player.afterimageTimer <= 0) {
        player.afterimageTimer = 0.028;
        spawnAfterimage(run, player, { life: 0.2, scale: 1 + player.dashFlash * 0.14 });
      }
    } else {
      let moveX = 0;
      let moveY = 0;
      if (game.keys.KeyW) {
        moveY -= 1;
      }
      if (game.keys.KeyS) {
        moveY += 1;
      }
      if (game.keys.KeyA) {
        moveX -= 1;
      }
      if (game.keys.KeyD) {
        moveX += 1;
      }
      const direction = normalize(moveX, moveY);
      const speedMultiplier = (player.buffs.overdrive > 0 ? 1.14 : 1) * (player.buffs.salvageRush > 0 ? 1.06 : 1) * comboPower.moveSpeed;
      player.vx = direction.x * player.stats.moveSpeed * speedMultiplier;
      player.vy = direction.y * player.stats.moveSpeed * speedMultiplier;
    }

    const speed = Math.hypot(player.vx, player.vy);
    const moveRatio = clamp(speed / Math.max(1, player.stats.moveSpeed * 1.35), 0, 1.3);
    if (speed > 20 && Math.random() < dt * (player.dashTime > 0 ? 34 : 5 + moveRatio * 10 + (player.buffs.overdrive > 0 ? 3 : 0) + (player.comboPower.timer > 0 ? 4 : 0))) {
      const rearX = player.x - Math.cos(player.facing) * (player.radius + 6);
      const rearY = player.y - Math.sin(player.facing) * (player.radius + 6);
      const trailColor = player.dashTime > 0
        ? "#ffffff"
        : player.comboPower.timer > 0
          ? "#ffe39c"
          : player.buffs.overdrive > 0
            ? "#9affcf"
            : classColor;
      spawnParticle(run, {
        x: rearX + (Math.random() * 2 - 1) * 4,
        y: rearY + (Math.random() * 2 - 1) * 4,
        vx: -Math.cos(player.facing) * (80 + moveRatio * 70) + (Math.random() * 2 - 1) * 32,
        vy: -Math.sin(player.facing) * (80 + moveRatio * 70) + (Math.random() * 2 - 1) * 32,
        size: 1.4 + Math.random() * (1.6 + moveRatio * 0.8),
        life: 0.1 + Math.random() * 0.14,
        color: trailColor,
        glow: 10 + moveRatio * 6,
        optional: true
      });
    }
    if (player.comboPower.timer > 0 && Math.random() < dt * (2 + player.comboPower.tier)) {
      const orbitAngle = run.time * (4 + player.comboPower.tier) + Math.random() * TWO_PI;
      const orbitRadius = player.radius + 8 + Math.random() * 6;
      spawnParticle(run, {
        x: player.x + Math.cos(orbitAngle) * orbitRadius,
        y: player.y + Math.sin(orbitAngle) * orbitRadius,
        vx: Math.cos(orbitAngle) * 18,
        vy: Math.sin(orbitAngle) * 18,
        size: 1.6 + Math.random() * 1.2,
        life: 0.12 + Math.random() * 0.12,
        color: player.comboPower.tier >= 3 ? "#fff0a6" : player.comboPower.tier === 2 ? "#ffd391" : "#9fefff",
        glow: 12,
        optional: true
      });
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;
    resolveWorldCollision(run, player);

    const wantsFire = game.pointer.down || player.autoFire;
    if (wantsFire && player.fireCooldown <= 0) {
      firePlayerWeapon(run);
    }
  }

  function moveEnemy(run, enemy, desiredDirection, desiredSpeed, dt) {
    if (Math.abs(desiredDirection.x) > 0.001 || Math.abs(desiredDirection.y) > 0.001) {
      enemy.facing = lerpAngle(enemy.facing || 0, Math.atan2(desiredDirection.y, desiredDirection.x), 0.16);
    }
    enemy.vx = lerp(enemy.vx, desiredDirection.x * desiredSpeed, 0.16);
    enemy.vy = lerp(enemy.vy, desiredDirection.y * desiredSpeed, 0.16);
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    resolveWorldCollision(run, enemy);
  }

  function shootAtTarget(run, enemy, target, config) {
    const direction = normalize(target.x - enemy.x, target.y - enemy.y);
    const angle = Math.atan2(direction.y, direction.x) + (config.spread || 0);
    spawnEnemyProjectile(run, {
      x: enemy.x + Math.cos(angle) * (enemy.radius + 6),
      y: enemy.y + Math.sin(angle) * (enemy.radius + 6),
      vx: Math.cos(angle) * config.speed,
      vy: Math.sin(angle) * config.speed,
      radius: config.radius,
      damage: config.damage,
      color: config.color,
      life: config.life,
      splashRadius: config.splashRadius,
      explodeOnExpire: config.explodeOnExpire,
      slow: config.slow || 0
    });
  }

  function updateBoss(run, boss, dt) {
    const target = run.player;
    const distanceToPlayer = distance(boss.x, boss.y, target.x, target.y);
    const direction = normalize(target.x - boss.x, target.y - boss.y);
    boss.fireCooldown -= dt;
    boss.specialCooldown -= dt;
    boss.supportPulseCooldown -= dt;
    boss.contactCooldown -= dt;
    boss.commandLink = Math.max(0, (boss.commandLink || 0) - dt);
    boss.siphonInfusion = Math.max(0, (boss.siphonInfusion || 0) - dt);
    boss.emberInfusion = Math.max(0, (boss.emberInfusion || 0) - dt);
    boss.thermalShockCooldown = Math.max(0, (boss.thermalShockCooldown || 0) - dt);
    boss.hitFlash = Math.max(0, boss.hitFlash - dt);

    if (boss.burnTimer > 0) {
      boss.burnTimer -= dt;
      boss.burnTick -= dt;
      if (boss.burnTick <= 0) {
        boss.burnTick = 0.3;
        boss.hp -= boss.burnDamage;
        if (boss.hp <= 0) {
          killEnemy(run, boss);
          return;
        }
      }
    }
    if (boss.slowTimer > 0) {
      boss.slowTimer -= dt;
    }
    if (boss.stunTimer > 0) {
      boss.stunTimer -= dt;
      return;
    }

    const supportSpeedMultiplier = (boss.commandLink > 0 ? 1.08 : 1) * (boss.emberInfusion > 0 ? 1.1 : 1);
    const supportDamageMultiplier = (boss.commandLink > 0 ? 1.12 : 1) * (boss.siphonInfusion > 0 ? 1.08 : 1) * (boss.emberInfusion > 0 ? 1.1 : 1);
    const supportCooldownMultiplier = (boss.commandLink > 0 ? 0.88 : 1) * (boss.siphonInfusion > 0 ? 0.92 : 1) * (boss.emberInfusion > 0 ? 0.9 : 1);
    const speedFactor = boss.slowTimer > 0 ? 1 - boss.slowFactor : 1;
    moveEnemy(run, boss, direction, boss.speed * speedFactor * supportSpeedMultiplier * (distanceToPlayer > 220 ? 1 : 0.55), dt);

    if (boss.supportPulseCooldown <= 0) {
      boss.supportPulseCooldown = 4.4;
      const nearbyAllies = run.enemies.filter((enemy) => enemy.alive && enemy.id !== boss.id && distance(enemy.x, enemy.y, boss.x, boss.y) < 300);
      if (boss.bossId === "ironReaper") {
        const targets = nearbyAllies.filter((enemy) => enemy.kind === "raider" || enemy.kind === "gunner").slice(0, 2);
        for (const ally of targets) {
          ally.commandLink = Math.max(ally.commandLink || 0, 5.5);
          pushSupportBeam(run, boss.x, boss.y, ally.x, ally.y, "#ffba8c");
        }
      }
      if (boss.bossId === "emberHydra") {
        const targets = nearbyAllies.slice(0, 3);
        for (const ally of targets) {
          ally.emberInfusion = Math.max(ally.emberInfusion || 0, 5);
          restoreEnemyIntegrity(ally, 8, 14);
          pushSupportBeam(run, boss.x, boss.y, ally.x, ally.y, "#ff974f");
        }
      }
      if (boss.bossId === "nullMatriarch") {
        const targets = nearbyAllies.filter((enemy) => enemy.kind === "sentinel" || enemy.kind === "wasp").slice(0, 3);
        for (const ally of targets) {
          ally.siphonInfusion = Math.max(ally.siphonInfusion || 0, 5.5);
          restoreEnemyIntegrity(boss, 0, 22);
          pushSupportBeam(run, ally.x, ally.y, boss.x, boss.y, "#d9b8ff");
        }
      }
      if (boss.bossId === "vaultTitan") {
        const targets = nearbyAllies.filter((enemy) => enemy.kind === "gunner" || enemy.kind === "sentinel").slice(0, 3);
        for (const ally of targets) {
          ally.commandLink = Math.max(ally.commandLink || 0, 5.5);
          restoreEnemyIntegrity(ally, 0, 18);
          pushSupportBeam(run, boss.x, boss.y, ally.x, ally.y, "#9fefff");
        }
      }
    }

    if (!boss.phaseTriggered && boss.hp < boss.maxHp * 0.55) {
      boss.phaseTriggered = true;
      if (boss.bossId === "ironReaper") {
        const reinforcements = ["raider", "raider", "gunner", "gunner"];
        for (let index = 0; index < reinforcements.length; index += 1) {
          const angle = index * (TWO_PI / reinforcements.length);
          createEnemy(run, reinforcements[index], boss.x + Math.cos(angle) * 120, boss.y + Math.sin(angle) * 120, { elite: true });
        }
      }
      if (boss.bossId === "emberHydra") {
        createEnemy(run, "mortar", boss.x - 130, boss.y + 40, { elite: true });
        createEnemy(run, "mortar", boss.x + 130, boss.y - 40, { elite: true });
        for (let index = 0; index < 3; index += 1) {
          const angle = index * (TWO_PI / 3);
          spawnHazard(run, {
            x: boss.x + Math.cos(angle) * 140,
            y: boss.y + Math.sin(angle) * 140,
            radius: 90,
            damage: 32,
            delay: 0.85,
            duration: 4,
            source: "enemy",
            color: "#ff7d5d",
            kind: "pool",
            tick: 0.45
          });
        }
      }
      if (boss.bossId === "nullMatriarch") {
        boss.shield += 180;
        boss.maxShield = Math.max(boss.maxShield, boss.shield);
        createEnemy(run, "sentinel", boss.x - 110, boss.y, { elite: true });
        createEnemy(run, "sentinel", boss.x + 110, boss.y, { elite: true });
      }
      if (boss.bossId === "vaultTitan") {
        createEnemy(run, "gunner", boss.x - 150, boss.y, { elite: true });
        createEnemy(run, "sentinel", boss.x + 150, boss.y, { elite: true });
        emitPulse(run, boss.x, boss.y, 220, 38, "enemy", "#83d6ff", 0);
      }
      game.pushNotification("Boss Phase Shift", `${boss.name} escalates its attack pattern.`, "warn");
    }

    if (boss.bossId === "ironReaper") {
      if (boss.fireCooldown <= 0) {
        boss.fireCooldown = 1.05 * boss.cooldownMultiplier * supportCooldownMultiplier;
        for (let index = -2; index <= 2; index += 1) {
          const angle = angleTo(boss.x, boss.y, target.x, target.y) + index * 0.12;
          shootAtTarget(run, boss, { x: boss.x + Math.cos(angle), y: boss.y + Math.sin(angle) }, {
            speed: 420,
            radius: 6,
            damage: boss.damage * supportDamageMultiplier,
            color: "#8fd0ff",
            life: 2.1
          });
        }
      }
      if (boss.specialCooldown <= 0) {
        boss.specialCooldown = 7.2 * boss.specialMultiplier * supportCooldownMultiplier;
        for (let burst = 0; burst < 20; burst += 1) {
          const angle = burst * (TWO_PI / 20) + boss.patternValue;
          shootAtTarget(run, boss, { x: boss.x + Math.cos(angle), y: boss.y + Math.sin(angle) }, {
            speed: 340,
            radius: 5,
            damage: boss.damage * 0.8 * supportDamageMultiplier,
            color: "#b2e8ff",
            life: 2.3
          });
        }
        boss.patternValue += 0.3;
      }
    }

    if (boss.bossId === "emberHydra") {
      if (boss.fireCooldown <= 0) {
        boss.fireCooldown = 1.18 * boss.cooldownMultiplier * supportCooldownMultiplier;
        for (let index = -1; index <= 1; index += 1) {
          const angle = angleTo(boss.x, boss.y, target.x, target.y) + index * 0.22;
          shootAtTarget(run, boss, { x: boss.x + Math.cos(angle), y: boss.y + Math.sin(angle) }, {
            speed: 290,
            radius: 9,
            damage: boss.damage * supportDamageMultiplier,
            color: "#ffb36c",
            life: 1.6,
            missile: true,
            missileHp: 3,
            splashRadius: 82,
            engineColor: "#ff8d53",
            exhaustColor: "#ffe5a8",
            explodeOnExpire: true
          });
        }
      }
      if (boss.specialCooldown <= 0) {
        boss.specialCooldown = 6.3 * boss.specialMultiplier * supportCooldownMultiplier;
        const hazardAngle = Math.random() * TWO_PI;
        for (let index = 0; index < 3; index += 1) {
          const offset = 90 + index * 80;
          spawnHazard(run, {
            x: target.x + Math.cos(hazardAngle + index * 0.8) * offset,
            y: target.y + Math.sin(hazardAngle + index * 0.8) * offset,
            radius: 72,
            damage: 30,
            delay: 0.9,
            duration: 4.5,
            source: "enemy",
            color: "#ff724a",
            kind: "pool",
            tick: 0.4
          });
        }
      }
    }

    if (boss.bossId === "nullMatriarch") {
      if (boss.fireCooldown <= 0) {
        boss.fireCooldown = 1.3 * boss.cooldownMultiplier * supportCooldownMultiplier;
        for (let index = -1; index <= 1; index += 1) {
          const angle = angleTo(boss.x, boss.y, target.x, target.y) + index * 0.16;
          shootAtTarget(run, boss, { x: boss.x + Math.cos(angle), y: boss.y + Math.sin(angle) }, {
            speed: 280,
            radius: 7,
            damage: boss.damage * supportDamageMultiplier,
            color: "#ceaeff",
            life: 2.4,
            slow: 0.32
          });
        }
      }
      if (boss.specialCooldown <= 0) {
        boss.specialCooldown = 6.8 * boss.specialMultiplier * supportCooldownMultiplier;
        const point = findOpenPoint(run, run.rng, 260);
        boss.x = point.x;
        boss.y = point.y;
        burstParticles(run, boss.x, boss.y, "#d8bcff", 20, 25, 180, 2, 5, 0.2, 0.6);
        for (let burst = 0; burst < 16; burst += 1) {
          const angle = burst * (TWO_PI / 16);
          shootAtTarget(run, boss, { x: boss.x + Math.cos(angle), y: boss.y + Math.sin(angle) }, {
            speed: 290,
            radius: 5.5,
            damage: boss.damage * 0.75 * supportDamageMultiplier,
            color: "#d8bcff",
            life: 2.7
          });
        }
      }
    }

    if (boss.bossId === "vaultTitan") {
      if (boss.fireCooldown <= 0) {
        boss.fireCooldown = 1.42 * boss.cooldownMultiplier * supportCooldownMultiplier;
        for (let index = -2; index <= 2; index += 1) {
          const angle = angleTo(boss.x, boss.y, target.x, target.y) + index * 0.09;
          shootAtTarget(run, boss, { x: boss.x + Math.cos(angle), y: boss.y + Math.sin(angle) }, {
            speed: 360,
            radius: 6,
            damage: boss.damage * supportDamageMultiplier,
            color: "#9aeaff",
            life: 2.2
          });
        }
      }
      if (boss.specialCooldown <= 0 && !boss.beam) {
        boss.specialCooldown = 7.8 * boss.specialMultiplier * supportCooldownMultiplier;
        boss.beam = {
          stage: "charge",
          timer: 1,
          angle: angleTo(boss.x, boss.y, target.x, target.y),
          width: 26,
          length: 760
        };
      }
      if (boss.beam) {
        boss.beam.timer -= dt;
        if (boss.beam.stage === "charge" && boss.beam.timer <= 0) {
          boss.beam.stage = "fire";
          boss.beam.timer = 2.1;
        } else if (boss.beam.stage === "fire") {
          boss.beam.angle += 1.45 * dt;
          if (boss.beam.timer <= 0) {
            boss.beam = null;
          } else if (Math.random() < 0.18) {
            const closest = pointToSegmentDistance(
              run.player.x,
              run.player.y,
              boss.x,
              boss.y,
              boss.x + Math.cos(boss.beam.angle) * boss.beam.length,
              boss.y + Math.sin(boss.beam.angle) * boss.beam.length
            );
            if (closest < run.player.radius + boss.beam.width) {
              damagePlayer(run, boss.damage * 0.16, "beam", { x: boss.x, y: boss.y });
            }
          }
        }
      }
    }

    if (distanceToPlayer < boss.radius + run.player.radius + 10 && boss.contactCooldown <= 0) {
      boss.contactCooldown = 0.55;
      damagePlayer(run, boss.damage * 0.8 * supportDamageMultiplier, "contact", { x: boss.x, y: boss.y });
    }
  }

  function updateEnemy(run, enemy, dt) {
    if (!enemy.alive) {
      return;
    }
    if (enemy.type === "boss") {
      updateBoss(run, enemy, dt);
      return;
    }
    enemy.fireCooldown -= dt;
    enemy.contactCooldown -= dt;
    enemy.supportCooldown -= dt;
    enemy.chargeCooldown -= dt;
    enemy.playerAggro = Math.max(0, (enemy.playerAggro || 0) - dt);
    enemy.towerAggro = Math.max(0, (enemy.towerAggro || 0) - dt);
    enemy.commandLink = Math.max(0, (enemy.commandLink || 0) - dt);
    enemy.siphonInfusion = Math.max(0, (enemy.siphonInfusion || 0) - dt);
    enemy.emberInfusion = Math.max(0, (enemy.emberInfusion || 0) - dt);
    enemy.thermalShockCooldown = Math.max(0, (enemy.thermalShockCooldown || 0) - dt);
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);

    if (enemy.burnTimer > 0) {
      enemy.burnTimer -= dt;
      enemy.burnTick -= dt;
      if (enemy.burnTick <= 0) {
        enemy.burnTick = 0.3;
        enemy.hp -= enemy.burnDamage;
        if (enemy.hp <= 0) {
          killEnemy(run, enemy);
          return;
        }
      }
    }
    if (enemy.slowTimer > 0) {
      enemy.slowTimer -= dt;
    }
    if (enemy.stunTimer > 0) {
      enemy.stunTimer -= dt;
      return;
    }

    const target = getEnemyTarget(run, enemy);
    const dist = distance(enemy.x, enemy.y, target.x, target.y);
    const direction = normalize(target.x - enemy.x, target.y - enemy.y);
    const speedFactor = enemy.slowTimer > 0 ? 1 - enemy.slowFactor : 1;
    if (run.boss && run.boss.alive) {
      const bossDistance = distance(enemy.x, enemy.y, run.boss.x, run.boss.y);
      if (run.boss.bossId === "ironReaper" && (enemy.kind === "raider" || enemy.kind === "gunner") && bossDistance < 250) {
        enemy.commandLink = Math.max(enemy.commandLink, 0.2);
      }
      if (run.boss.bossId === "emberHydra" && bossDistance < 230) {
        enemy.emberInfusion = Math.max(enemy.emberInfusion, 0.2);
      }
      if (run.boss.bossId === "nullMatriarch" && (enemy.kind === "sentinel" || enemy.kind === "wasp") && bossDistance < 250) {
        enemy.siphonInfusion = Math.max(enemy.siphonInfusion, 0.2);
      }
      if (run.boss.bossId === "vaultTitan" && (enemy.kind === "gunner" || enemy.kind === "sentinel") && bossDistance < 280) {
        enemy.commandLink = Math.max(enemy.commandLink, 0.2);
      }
    }
    const synergySpeedMultiplier = (enemy.commandLink > 0 ? 1.12 : 1) * (enemy.siphonInfusion > 0 ? 1.08 : 1) * (enemy.emberInfusion > 0 ? 1.12 : 1);
    const synergyDamageMultiplier = (enemy.commandLink > 0 ? 1.12 : 1) * (enemy.siphonInfusion > 0 ? 1.1 : 1) * (enemy.emberInfusion > 0 ? 1.12 : 1);
    const synergyCooldownMultiplier = (enemy.commandLink > 0 ? 0.88 : 1) * (enemy.siphonInfusion > 0 ? 0.92 : 1) * (enemy.emberInfusion > 0 ? 0.88 : 1);
    let moveDirection = direction;
    let moveSpeed = enemy.speed * speedFactor * synergySpeedMultiplier;

    if (enemy.kind === "crawler") {
      moveDirection = direction;
    }

    if (enemy.kind === "raider") {
      if (enemy.chargeTime > 0) {
        enemy.chargeTime -= dt;
        moveDirection = enemy.chargeDirection;
        moveSpeed = enemy.speed * 3.1;
      } else if (enemy.chargeCooldown <= 0 && dist < 360) {
        enemy.chargeCooldown = 3 * enemy.specialMultiplier;
        enemy.chargeTime = 0.45;
        enemy.chargeDirection = direction;
      } else {
        moveDirection = normalize(direction.x + Math.cos(enemy.id + run.time) * 0.35, direction.y + Math.sin(enemy.id + run.time) * 0.35);
      }
    }

    if (enemy.kind === "gunner") {
      if (dist < 220) {
        moveDirection = normalize(enemy.x - target.x, enemy.y - target.y);
      } else if (dist > 290) {
        moveDirection = direction;
      } else {
        moveDirection = normalize(-direction.y * enemy.orbitDirection, direction.x * enemy.orbitDirection);
      }
      if (enemy.fireCooldown <= 0) {
        enemy.fireCooldown = 1.35 * enemy.cooldownMultiplier * synergyCooldownMultiplier;
        shootAtTarget(run, enemy, target, {
          speed: 340,
          radius: 5,
          damage: enemy.damage * synergyDamageMultiplier,
          color: "#89c5ff",
          life: 2.4
        });
      }
    }

    if (enemy.kind === "mortar") {
      if (dist < 260) {
        moveDirection = normalize(enemy.x - target.x, enemy.y - target.y);
      } else if (dist > 420) {
        moveDirection = direction;
      } else {
        moveDirection = normalize(-direction.y * enemy.orbitDirection, direction.x * enemy.orbitDirection);
      }
      moveSpeed *= 0.72;
      if (enemy.fireCooldown <= 0) {
        enemy.fireCooldown = 2.4 * enemy.cooldownMultiplier * synergyCooldownMultiplier;
        shootAtTarget(run, enemy, target, {
          speed: 240,
          radius: 8,
          damage: enemy.damage * synergyDamageMultiplier,
          color: "#ffb06a",
          life: 1.5,
          missile: true,
          missileHp: 2,
          splashRadius: 76,
          engineColor: "#ff8e52",
          exhaustColor: "#ffe0a8",
          explodeOnExpire: true
        });
      }
    }

    if (enemy.kind === "wasp") {
      moveDirection = dist > 230
        ? normalize(direction.x + Math.cos(run.time * 6 + enemy.id) * 0.3, direction.y + Math.sin(run.time * 6 + enemy.id) * 0.3)
        : normalize(-direction.y * enemy.orbitDirection, direction.x * enemy.orbitDirection);
      moveSpeed *= 1.18;
      if (enemy.fireCooldown <= 0) {
        enemy.fireCooldown = 0.95 * enemy.cooldownMultiplier * synergyCooldownMultiplier;
        shootAtTarget(run, enemy, target, {
          speed: 390,
          radius: 4,
          damage: enemy.damage * 0.88 * synergyDamageMultiplier,
          color: "#7dfff0",
          life: 2.1
        });
      }
    }

    if (enemy.kind === "sentinel") {
      if (dist > 240) {
        moveDirection = direction;
      } else if (dist < 180) {
        moveDirection = normalize(enemy.x - target.x, enemy.y - target.y);
      } else {
        moveDirection = normalize(-direction.y * enemy.orbitDirection, direction.x * enemy.orbitDirection);
      }
      moveSpeed *= 0.9;
      if (enemy.supportCooldown <= 0) {
        enemy.supportCooldown = 4.2 * enemy.specialMultiplier;
        let shielded = false;
        for (const ally of run.enemies) {
          if (!ally.alive || ally.id === enemy.id || distance(enemy.x, enemy.y, ally.x, ally.y) > 180) {
            continue;
          }
          ally.maxShield = Math.max(ally.maxShield || 0, ally.maxHp * 0.25);
          ally.shield = clamp((ally.shield || 0) + ally.maxHp * 0.18, 0, ally.maxShield);
          shielded = true;
        }
        if (shielded) {
          burstParticles(run, enemy.x, enemy.y, "#c4aaff", 12, 20, 140, 2, 5, 0.2, 0.55);
        }
        const priority = run.enemies
          .filter((ally) => ally.alive && ally.id !== enemy.id && distance(enemy.x, enemy.y, ally.x, ally.y) < 220)
          .sort((left, right) => {
            const leftScore = (left.type === "boss" ? 220 : 0) + (left.reactorFocus ? 40 : 0) + (left.elite ? 30 : 0);
            const rightScore = (right.type === "boss" ? 220 : 0) + (right.reactorFocus ? 40 : 0) + (right.elite ? 30 : 0);
            return rightScore - leftScore;
          })[0];
        if (priority) {
          priority.commandLink = Math.max(priority.commandLink || 0, 5.2);
          restoreEnemyIntegrity(priority, 0, priority.type === "boss" ? 28 : 16);
          pushSupportBeam(run, enemy.x, enemy.y, priority.x, priority.y, "#d2b8ff");
        }
      }
      if (enemy.fireCooldown <= 0) {
        enemy.fireCooldown = 1.55 * enemy.cooldownMultiplier * synergyCooldownMultiplier;
        shootAtTarget(run, enemy, target, {
          speed: 300,
          radius: 5,
          damage: enemy.damage * synergyDamageMultiplier,
          color: "#c8adff",
          life: 2.4
        });
      }
    }

    if (enemy.kind === "siphon") {
      if (dist < 220) {
        moveDirection = normalize(enemy.x - target.x, enemy.y - target.y);
      } else if (dist > 340) {
        moveDirection = direction;
      } else {
        moveDirection = normalize(-direction.y * enemy.orbitDirection, direction.x * enemy.orbitDirection);
      }
      if (enemy.supportCooldown <= 0) {
        enemy.supportCooldown = 4.6 * enemy.specialMultiplier;
        const priority = run.enemies
          .filter((ally) => ally.alive && ally.id !== enemy.id && distance(enemy.x, enemy.y, ally.x, ally.y) < 240)
          .sort((left, right) => {
            const leftScore = (left.type === "boss" ? 260 : 0) + (left.elite ? 35 : 0);
            const rightScore = (right.type === "boss" ? 260 : 0) + (right.elite ? 35 : 0);
            return rightScore - leftScore;
          })[0];
        if (priority) {
          priority.siphonInfusion = Math.max(priority.siphonInfusion || 0, 5.6);
          restoreEnemyIntegrity(priority, 10 + run.contract.threat * 0.7, 16 + run.contract.threat * 0.9);
          pushSupportBeam(run, enemy.x, enemy.y, priority.x, priority.y, "#e0a0ff");
          burstParticles(run, priority.x, priority.y, "#e0a0ff", 8, 10, 70, 1.5, 3, 0.16, 0.4);
        }
      }
      if (enemy.fireCooldown <= 0) {
        enemy.fireCooldown = 1.75 * enemy.cooldownMultiplier * synergyCooldownMultiplier;
        shootAtTarget(run, enemy, target, {
          speed: 280,
          radius: 6,
          damage: enemy.damage * synergyDamageMultiplier,
          color: "#d995ff",
          life: 2.3,
          slow: 0.34
        });
      }
    }

    moveEnemy(run, enemy, moveDirection, moveSpeed, dt);

    if (distance(enemy.x, enemy.y, target.x, target.y) < enemy.radius + (target.radius || 20) + 4 && enemy.contactCooldown <= 0) {
      enemy.contactCooldown = enemy.kind === "raider" ? 0.7 : 0.95;
      if (target.type === "player") {
        damagePlayer(run, enemy.damage * synergyDamageMultiplier, "enemy", { x: enemy.x, y: enemy.y });
      } else if (target.type === "tower") {
        damageTower(run, target, enemy.damage * 0.82 * synergyDamageMultiplier, { x: enemy.x, y: enemy.y });
      } else if (target.type === "convoy") {
        damageConvoyVehicle(run, target, enemy.damage * 0.84 * synergyDamageMultiplier, { x: enemy.x, y: enemy.y });
      } else {
        dealDamageToReactor(run, enemy.damage * 0.85 * synergyDamageMultiplier);
      }
    }
  }

  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) {
      return Math.hypot(px - x1, py - y1);
    }
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
    const projX = x1 + dx * t;
    const projY = y1 + dy * t;
    return Math.hypot(px - projX, py - projY);
  }

  function updateProjectiles(run, list, friendly, dt) {
    for (const projectile of list) {
      if (projectile.life <= 0) {
        continue;
      }
      projectile.life -= dt;
      if (projectile.homing) {
        const target = friendly
          ? findTargetEnemy(run, projectile.x, projectile.y, projectile.missile ? 440 : 260)
          : run.player;
        if (target) {
          const direction = normalize(target.x - projectile.x, target.y - projectile.y);
          const speed = Math.hypot(projectile.vx, projectile.vy);
          const turnRate = projectile.turnRate || projectile.homing;
          projectile.vx = lerp(projectile.vx, direction.x * speed, turnRate);
          projectile.vy = lerp(projectile.vy, direction.y * speed, turnRate);
        }
      }
      if (projectile.missile) {
        projectile.trailTimer -= dt;
        if (projectile.trailTimer <= 0) {
          projectile.trailTimer = 0.03;
          const direction = normalize(projectile.vx, projectile.vy);
          spawnParticle(run, {
            x: projectile.x - direction.x * projectile.radius * 1.8,
            y: projectile.y - direction.y * projectile.radius * 1.8,
            vx: -direction.x * 60 + (Math.random() * 2 - 1) * 10,
            vy: -direction.y * 60 + (Math.random() * 2 - 1) * 10,
            size: 2 + Math.random() * 1.6,
            life: 0.22 + Math.random() * 0.12,
            color: Math.random() > 0.4 ? projectile.engineColor : projectile.exhaustColor,
            glow: 8,
            optional: true
          });
        }
      } else {
        projectile.trailTimer -= dt;
        if (projectile.trailTimer <= 0) {
          projectile.trailTimer = friendly ? 0.045 : 0.055;
          const direction = normalize(projectile.vx, projectile.vy);
          spawnParticle(run, {
            x: projectile.x - direction.x * projectile.radius * 0.8,
            y: projectile.y - direction.y * projectile.radius * 0.8,
            vx: -direction.x * 32 + (Math.random() * 2 - 1) * 10,
            vy: -direction.y * 32 + (Math.random() * 2 - 1) * 10,
            size: projectile.radius * (friendly ? 0.55 : 0.7),
            life: friendly ? 0.12 : 0.14,
            color: projectile.color,
            glow: friendly ? 8 : 10,
            optional: true
          });
        }
      }
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;

      const opposingList = friendly ? run.enemyProjectiles : run.projectiles;
      let intercepted = false;
      for (const opposing of opposingList) {
        if (opposing.life <= 0) {
          continue;
        }
        if (interceptProjectile(run, projectile, opposing, friendly)) {
          intercepted = true;
          break;
        }
      }
      if (intercepted) {
        continue;
      }

      let collidedWithObstacle = false;
      for (const obstacle of run.map.obstacles) {
        if (distanceSq(projectile.x, projectile.y, obstacle.x, obstacle.y) < (projectile.radius + obstacle.radius) ** 2) {
          collidedWithObstacle = true;
          break;
        }
      }

      if (projectile.life <= 0 || collidedWithObstacle) {
        explodeProjectile(run, projectile, friendly, 1);
        projectile.life = -1;
        continue;
      }

      if (friendly) {
        for (const enemy of run.enemies) {
          if (!enemy.alive || projectile.hitIds.includes(enemy.id)) {
            continue;
          }
          if (distanceSq(projectile.x, projectile.y, enemy.x, enemy.y) < (projectile.radius + enemy.radius) ** 2) {
            projectile.hitIds.push(enemy.id);
            damageEnemy(run, enemy, projectile.damage, {
              source: projectile.owner,
              towerId: projectile.towerId,
              attackerX: projectile.attackerX ?? projectile.x,
              attackerY: projectile.attackerY ?? projectile.y,
              canCrit: projectile.canCrit,
              burnChance: projectile.burnChance,
              slowChance: projectile.slowChance,
              knockback: projectile.knockback,
              chainLeft: projectile.chainLeft
            });
            if (projectile.splashRadius) {
              explodeProjectile(run, projectile, true, 0.65);
            }
            if (projectile.pierce > 0) {
              projectile.pierce -= 1;
            } else {
              projectile.life = -1;
              break;
            }
          }
        }
      } else {
        let towerHit = null;
        for (const tower of run.towers) {
          if (!tower.alive) {
            continue;
          }
          if (distanceSq(projectile.x, projectile.y, tower.x, tower.y) < (projectile.radius + tower.radius) ** 2) {
            towerHit = tower;
            break;
          }
        }
        if (towerHit) {
          damageTower(run, towerHit, projectile.damage * 0.82, { x: projectile.x, y: projectile.y });
          if (projectile.splashRadius) {
            explodeProjectile(run, projectile, false, 0.65);
          }
          projectile.life = -1;
          continue;
        }
        const target = run.player;
        if (distanceSq(projectile.x, projectile.y, target.x, target.y) < (projectile.radius + target.radius) ** 2) {
          damagePlayer(run, projectile.damage, "projectile", { x: projectile.x, y: projectile.y });
          if (projectile.slow) {
            target.vx *= 0.6;
            target.vy *= 0.6;
          }
          if (projectile.splashRadius) {
            explodeProjectile(run, projectile, false, 0.65);
          }
          projectile.life = -1;
        } else if (run.objective.type === "escort" && !run.objective.complete) {
          const convoyHit = getActiveConvoyVehicles(run).find((vehicle) => distanceSq(projectile.x, projectile.y, vehicle.x, vehicle.y) < (projectile.radius + vehicle.radius) ** 2);
          if (convoyHit) {
            damageConvoyVehicle(run, convoyHit, projectile.damage * 0.84, { x: projectile.x, y: projectile.y });
            if (projectile.splashRadius) {
              explodeProjectile(run, projectile, false, 0.65);
            }
            projectile.life = -1;
          }
        } else if (run.objective.type === "defense" && run.objective.reactor.alive
          && distanceSq(projectile.x, projectile.y, run.objective.reactor.x, run.objective.reactor.y) < (projectile.radius + run.objective.reactor.radius) ** 2) {
          dealDamageToReactor(run, projectile.damage * 0.72);
          explodeProjectile(run, projectile, false, 0.65);
          projectile.life = -1;
        }
      }
    }
    return list.filter((projectile) => projectile.life > 0);
  }

  function updatePickups(run, dt) {
    for (const pickup of run.pickups) {
      if (!pickup.alive) {
        continue;
      }
      pickup.age += dt;
      pickup.pulse += dt * 5;
      const buffBonus = run.player.buffs.magnetField > 0 ? 92 : 0;
      const extractionBonus = run.extraction ? 46 : 0;
      const pullRange = run.player.stats.pickupRadius * pickup.magnetScale + buffBonus + extractionBonus;
      const hardVacuumRange = pullRange * 1.18;
      const dist = distance(pickup.x, pickup.y, run.player.x, run.player.y);
      if (pickup.age > 0.3 && dist < hardVacuumRange) {
        pickup.magnetized = true;
      }
      if (pickup.age > 3.2 && dist < pullRange * 1.35) {
        pickup.magnetized = true;
      }

      if (pickup.magnetized || dist < pullRange) {
        const direction = normalize(run.player.x - pickup.x, run.player.y - pickup.y);
        const strength = pickup.magnetized
          ? 680 + Math.max(0, hardVacuumRange - dist) * 2.4
          : 300 + Math.max(0, pullRange - dist) * 1.5;
        pickup.vx += direction.x * strength * dt;
        pickup.vy += direction.y * strength * dt;
        const maxSpeed = pickup.magnetized ? 620 : 360;
        const speed = Math.hypot(pickup.vx, pickup.vy);
        if (speed > maxSpeed) {
          pickup.vx = (pickup.vx / speed) * maxSpeed;
          pickup.vy = (pickup.vy / speed) * maxSpeed;
        }
        if (pickup.magnetized && Math.random() < 0.18) {
          spawnParticle(run, {
            x: pickup.x,
            y: pickup.y,
            vx: -pickup.vx * 0.08,
            vy: -pickup.vy * 0.08,
            size: 1.8 + Math.random() * 1.6,
            life: 0.22 + Math.random() * 0.12,
            color: pickup.color,
            glow: 8,
            optional: true
          });
        }
      } else {
        pickup.vx *= 0.92;
        pickup.vy *= 0.92;
      }
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
      const finalDist = distance(pickup.x, pickup.y, run.player.x, run.player.y);
      if (finalDist < pickup.radius + run.player.radius + pickup.collectPadding) {
        collectPickup(run, pickup);
      }
    }
    run.pickups = run.pickups.filter((pickup) => pickup.alive);
  }

  function updateHazards(run, dt) {
    for (const hazard of run.hazards) {
      if (hazard.delay > 0) {
        hazard.delay -= dt;
        continue;
      }
      if (hazard.kind === "blast" && !hazard.applied) {
        hazard.applied = true;
        if (hazard.source === "player") {
          for (const enemy of run.enemies) {
            if (!enemy.alive) {
              continue;
            }
            if (distance(hazard.x, hazard.y, enemy.x, enemy.y) <= hazard.radius + enemy.radius) {
              damageEnemy(run, enemy, hazard.damage, {
                source: "blast",
                burnChance: run.player.stats.burnChance * 0.5,
                slowChance: run.player.stats.slowChance * 0.5,
                knockback: hazard.knockback,
                chainLeft: 0
              });
            }
          }
        } else {
          if (distance(hazard.x, hazard.y, run.player.x, run.player.y) <= hazard.radius + run.player.radius) {
            damagePlayer(run, hazard.damage, "hazard", { x: hazard.x, y: hazard.y });
          }
          for (const tower of run.towers) {
            if (!tower.alive) {
              continue;
            }
            if (distance(hazard.x, hazard.y, tower.x, tower.y) <= hazard.radius + tower.radius) {
              damageTower(run, tower, hazard.damage * 0.7, { x: hazard.x, y: hazard.y });
            }
          }
          if (run.objective.type === "escort" && !run.objective.complete) {
            for (const vehicle of getActiveConvoyVehicles(run)) {
              if (distance(hazard.x, hazard.y, vehicle.x, vehicle.y) <= hazard.radius + vehicle.radius) {
                damageConvoyVehicle(run, vehicle, hazard.damage * 0.76, { x: hazard.x, y: hazard.y });
              }
            }
          }
          if (run.objective.type === "defense" && run.objective.reactor.alive
            && distance(hazard.x, hazard.y, run.objective.reactor.x, run.objective.reactor.y) <= hazard.radius + run.objective.reactor.radius) {
            dealDamageToReactor(run, hazard.damage * 0.8);
          }
        }
        burstParticles(run, hazard.x, hazard.y, hazard.color, 24, 25, 220, 2, 5, 0.22, 0.6);
        game.addScreenShake(8);
      }
      if (hazard.kind === "pool") {
        hazard.tick -= dt;
        if (hazard.tick <= 0) {
          hazard.tick = 0.45;
          if (hazard.source === "player") {
            for (const enemy of run.enemies) {
              if (!enemy.alive) {
                continue;
              }
              if (distance(hazard.x, hazard.y, enemy.x, enemy.y) <= hazard.radius + enemy.radius) {
                damageEnemy(run, enemy, hazard.damage * 0.45, {
                  source: "pool",
                  canCrit: false,
                  burnChance: 0.18,
                  slowChance: 0,
                  knockback: 40,
                  chainLeft: 0
                });
              }
            }
          } else {
            if (distance(hazard.x, hazard.y, run.player.x, run.player.y) <= hazard.radius + run.player.radius) {
              damagePlayer(run, hazard.damage * 0.45, "pool", { x: hazard.x, y: hazard.y });
            }
            for (const tower of run.towers) {
              if (!tower.alive) {
                continue;
              }
              if (distance(hazard.x, hazard.y, tower.x, tower.y) <= hazard.radius + tower.radius) {
                damageTower(run, tower, hazard.damage * 0.34, { x: hazard.x, y: hazard.y });
              }
            }
          }
        }
      }
      hazard.duration -= dt;
    }
    run.hazards = run.hazards.filter((hazard) => hazard.duration > 0 || hazard.delay > 0);
  }

  function updateFields(run, dt) {
    for (const field of run.fields) {
      field.duration -= dt;
      field.tick -= dt;
      if (field.type === "bastion") {
        if (distance(field.x, field.y, run.player.x, run.player.y) < field.radius) {
          run.player.inBastion = true;
        }
        if (field.tick <= 0) {
          field.tick = field.tickInterval;
          for (const enemy of run.enemies) {
            if (!enemy.alive) {
              continue;
            }
            if (distance(field.x, field.y, enemy.x, enemy.y) < field.radius + enemy.radius) {
              damageEnemy(run, enemy, field.damage, {
                source: "field",
                canCrit: false,
                burnChance: 0.18,
                slowChance: 0.24,
                knockback: 60,
                chainLeft: 0
              });
            }
          }
        }
      }
      if (field.type === "repairZone") {
        if (distance(field.x, field.y, run.player.x, run.player.y) < field.radius) {
          if (field.healPerSecond > 0) {
            healPlayer(run, field.healPerSecond * dt);
          }
          if (field.shieldPerSecond > 0) {
            grantShield(run, field.shieldPerSecond * dt);
          }
        }
        for (const tower of run.towers) {
          if (!tower.alive) {
            continue;
          }
          if (distance(field.x, field.y, tower.x, tower.y) < field.radius + tower.radius) {
            tower.hp = clamp(tower.hp + (field.healPerSecond * 0.75) * dt, 0, tower.maxHp);
          }
        }
      }
      if (field.type === "emberField") {
        if (field.tick <= 0) {
          field.tick = field.tickInterval;
          for (const enemy of run.enemies) {
            if (!enemy.alive) {
              continue;
            }
            if (distance(field.x, field.y, enemy.x, enemy.y) < field.radius + enemy.radius) {
              damageEnemy(run, enemy, field.damage, {
                source: "field",
                canCrit: false,
                burnChance: field.burnChance || 1,
                slowChance: 0,
                knockback: 30,
                chainLeft: 0
              });
            }
          }
        }
      }
      if (field.type === "arcPrison") {
        if (field.tick <= 0) {
          field.tick = field.tickInterval;
          for (const enemy of run.enemies) {
            if (!enemy.alive) {
              continue;
            }
            if (distance(field.x, field.y, enemy.x, enemy.y) < field.radius + enemy.radius) {
              damageEnemy(run, enemy, field.damage, {
                source: "field",
                canCrit: false,
                burnChance: 0,
                slowChance: 0.4,
                knockback: 70,
                chainLeft: 1
              });
            }
          }
        }
      }
      if (field.type === "stormField") {
        if (field.tick <= 0) {
          field.tick = field.tickInterval;
          spawnPlayerNova(run, field.x, field.y, 6, 460, field.damage, field.color, {
            radius: 4.8,
            chainLeft: 1,
            slowChance: 0.2,
            offset: 10
          });
        }
      }
      if (field.type === "gravityWell") {
        for (const enemy of run.enemies) {
          if (!enemy.alive) {
            continue;
          }
          const dist = distance(field.x, field.y, enemy.x, enemy.y);
          if (dist < field.radius + 40) {
            const direction = normalize(field.x - enemy.x, field.y - enemy.y);
            enemy.vx += direction.x * 14;
            enemy.vy += direction.y * 14;
          }
        }
        if (field.tick <= 0) {
          field.tick = field.tickInterval;
          for (const enemy of run.enemies) {
            if (!enemy.alive) {
              continue;
            }
            if (distance(field.x, field.y, enemy.x, enemy.y) < field.radius + enemy.radius) {
              damageEnemy(run, enemy, field.damage, {
                source: "field",
                canCrit: false,
                burnChance: 0,
                slowChance: 0.28,
                knockback: 40,
                chainLeft: 0
              });
            }
          }
        }
      }
    }
    run.fields = run.fields.filter((field) => field.duration > 0);
  }

  function updateSupportUnits(run, dt) {
    for (const orbital of run.orbitals) {
      orbital.duration = orbital.duration ?? Infinity;
      orbital.duration -= dt;
      orbital.angle += dt * 1.8;
      orbital.x = run.player.x + Math.cos(orbital.angle) * orbital.radius;
      orbital.y = run.player.y + Math.sin(orbital.angle) * orbital.radius;
      orbital.hitCooldown -= dt;
      if (orbital.hitCooldown <= 0) {
        for (const enemy of run.enemies) {
          if (!enemy.alive) {
            continue;
          }
          if (distance(orbital.x, orbital.y, enemy.x, enemy.y) < enemy.radius + 12) {
            orbital.hitCooldown = 0.29 / run.player.stats.supportFireRateMultiplier;
            damageEnemy(run, enemy, (15 + run.player.level * 0.7) * run.player.stats.supportDamageMultiplier, {
              source: "orbital",
              canCrit: false,
              burnChance: 0,
              slowChance: 0.15,
              knockback: 80,
              chainLeft: 0
            });
            break;
          }
        }
      }
    }
    run.orbitals = run.orbitals.filter((orbital) => orbital.duration > 0);
    for (const drone of run.drones) {
      drone.duration -= dt;
      drone.angle += dt * (drone.source === "ability" ? 2.4 : 1.7);
      drone.x = run.player.x + Math.cos(drone.angle) * drone.orbit;
      drone.y = run.player.y + Math.sin(drone.angle) * drone.orbit;
      drone.fireCooldown -= dt;
      if (drone.fireCooldown <= 0) {
        const target = findTargetEnemy(run, drone.x, drone.y, 430);
        if (target) {
          drone.fireCooldown = (drone.source === "ability" ? 0.52 : 0.82) / run.player.stats.supportFireRateMultiplier;
          const angle = angleTo(drone.x, drone.y, target.x, target.y);
          spawnProjectile(run, {
            x: drone.x,
            y: drone.y,
            vx: Math.cos(angle) * 700,
            vy: Math.sin(angle) * 700,
            radius: 4.2,
            damage: (drone.source === "ability" ? 12 : 9) * run.player.stats.supportDamageMultiplier,
            color: drone.source === "ability" ? "#d6f8ff" : "#98d5ff",
            pierce: 0,
            knockback: 80,
            burnChance: 0,
            slowChance: 0,
            chainLeft: 0
          });
        }
      }
    }
    run.drones = run.drones.filter((drone) => drone.duration > 0);
  }

  function updateParticles(run, dt) {
    for (const particle of run.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
    }
    run.particles = run.particles.filter((particle) => particle.life > 0);
    for (const ring of run.rings) {
      ring.life -= dt;
      ring.radius += ring.growth * dt;
    }
    run.rings = run.rings.filter((ring) => ring.life > 0);
    for (const ghost of run.afterimages) {
      ghost.life -= dt;
    }
    run.afterimages = run.afterimages.filter((ghost) => ghost.life > 0);
    for (const beam of run.beams) {
      beam.life -= dt;
    }
    run.beams = run.beams.filter((beam) => beam.life > 0);
  }

  function spawnZoneHazard(run) {
    const player = run.player;
    if (run.zone.id === "scrapSea") {
      const angle = Math.random() * TWO_PI;
      spawnHazard(run, {
        x: player.x + Math.cos(angle) * (110 + Math.random() * 200),
        y: player.y + Math.sin(angle) * (110 + Math.random() * 200),
        radius: 74,
        damage: 20 + run.contract.threat * 3,
        delay: 0.9,
        duration: 0.4,
        source: "enemy",
        color: "#ffb16f"
      });
    }
    if (run.zone.id === "emberReach") {
      const angle = Math.random() * TWO_PI;
      spawnHazard(run, {
        x: player.x + Math.cos(angle) * (80 + Math.random() * 180),
        y: player.y + Math.sin(angle) * (80 + Math.random() * 180),
        radius: 86,
        damage: 22 + run.contract.threat * 3,
        delay: 0.8,
        duration: 4.2,
        source: "enemy",
        color: "#ff724a",
        kind: "pool",
        tick: 0.42
      });
    }
    if (run.zone.id === "nullReef") {
      const angle = Math.random() * TWO_PI;
      spawnHazard(run, {
        x: player.x + Math.cos(angle) * (100 + Math.random() * 220),
        y: player.y + Math.sin(angle) * (100 + Math.random() * 220),
        radius: 78,
        damage: 20 + run.contract.threat * 3,
        delay: 1,
        duration: 0.4,
        source: "enemy",
        color: "#9e78ff"
      });
    }
    if (run.zone.id === "blackVault") {
      const angle = Math.random() * TWO_PI;
      spawnHazard(run, {
        x: player.x + Math.cos(angle) * (90 + Math.random() * 210),
        y: player.y + Math.sin(angle) * (90 + Math.random() * 210),
        radius: 72,
        damage: 24 + run.contract.threat * 3,
        delay: 0.7,
        duration: 0.4,
        source: "enemy",
        color: "#6fdfff"
      });
    }
  }

  function updateMission(run, dt) {
    run.time += dt;
    run.modeIntroTimer = Math.max(0, run.modeIntroTimer - dt);
    run.stats.comboTimer -= dt;
    if (run.stats.comboTimer <= 0) {
      run.stats.combo = 0;
    }

    updatePlayer(run, dt);
    updateFields(run, dt);
    updateSupportUnits(run, dt);
    updateHazards(run, dt);
    updateDefenseObjective(run, dt);
    updatePrototypeCaches(run, dt);
    updateAnomalies(run, dt);
    updateTeleporters(run, dt);

    run.spawnState.timer -= dt;
    run.spawnState.eliteTimer -= dt;
    run.spawnState.supplyTimer -= dt;
    run.spawnState.zoneHazardTimer -= dt;
    run.spawnState.stormTimer -= dt;
    syncSpawnDirector(run, dt);

    if (!run.extraction && run.spawnState.timer <= 0) {
      const phaseProfile = getSpawnPhaseProfile(run);
      const defenseDelay = run.objective.type === "defense" && !run.objective.complete ? 0.26 : 0;
      const adaptiveDelayFactor = clamp(1 - run.spawnState.adaptivePressure * 0.1, 0.78, 1.02);
      run.spawnState.timer = Math.max(
        0.72,
        (1.6 - run.contract.threat * 0.12 - (run.contract.mutators.includes("swarm") ? 0.25 : 0) + defenseDelay)
        * phaseProfile.intervalMultiplier
        * adaptiveDelayFactor
      );
      spawnAmbientWave(run, 3 + run.contract.threat + run.spawnState.gameLevel * 0.18 + run.spawnState.objectivePressure * 1.1);
    }
    if (!run.extraction && run.spawnState.eliteTimer <= 0) {
      const phaseProfile = getSpawnPhaseProfile(run);
      const defenseEliteDelay = run.objective.type === "defense" && !run.objective.complete ? 2.6 : 0;
      const bossEliteDelay = run.boss ? 3.2 : 0;
      const lullEliteDelay = run.spawnState.phase === "lull" ? 1.5 : 0;
      const adaptiveEliteDelay = clamp(1 - run.spawnState.adaptivePressure * 0.18 - run.spawnState.objectivePressure * 0.08, 0.68, 1.02);
      run.spawnState.eliteTimer = Math.max(
        6.8,
        (15.6 - run.contract.threat * 1.1 + defenseEliteDelay + bossEliteDelay + lullEliteDelay) * adaptiveEliteDelay
      );
      const forceEliteCount = !run.boss && run.spawnState.phase === "surge" && run.spawnState.gameLevel >= 4 && run.rng.chance(0.3) ? 2 : 1;
      spawnAmbientWave(run, 2 + run.contract.threat + run.spawnState.objectivePressure * 0.9, true, {
        forceEliteCount,
        countMultiplier: run.boss ? 0.68 : 0.78,
        extraEliteChance: phaseProfile.eliteChanceBonus
      });
    }
    if (!run.extraction && run.spawnState.supplyTimer <= 0) {
      run.spawnState.supplyTimer = 34 + Math.random() * 16;
      spawnSupplyPod(run);
    }
    if (!run.extraction && run.stats.combo >= run.spawnState.comboRewardThreshold) {
      run.spawnState.comboRewardThreshold += 20;
      spawnSupplyPod(run, "combo");
    }
    if (run.spawnState.zoneHazardTimer <= 0) {
      run.spawnState.zoneHazardTimer = 10 + Math.random() * 6;
      spawnZoneHazard(run);
    }
    if (run.contract.mutators.includes("stormfront") && run.spawnState.stormTimer <= 0) {
      run.spawnState.stormTimer = 5.2 + Math.random() * 4;
      spawnHazard(run, {
        x: run.player.x + Math.random() * 240 - 120,
        y: run.player.y + Math.random() * 240 - 120,
        radius: 88,
        damage: 24 + run.contract.threat * 3,
        delay: 0.85,
        duration: 0.4,
        source: "enemy",
        color: "#a1d6ff"
      });
    }

    handleObjectiveProgress(run, dt);

    for (const enemy of run.enemies) {
      updateEnemy(run, enemy, dt);
    }
    updateTowers(run, dt);
    run.enemies = run.enemies.filter((enemy) => enemy.alive);

    run.projectiles = updateProjectiles(run, run.projectiles, true, dt);
    run.enemyProjectiles = updateProjectiles(run, run.enemyProjectiles, false, dt);
    updateSupplyPods(run, dt);
    updatePickups(run, dt);
    updateParticles(run, dt);
    updateFloaters(run, dt);

    if (run.extraction) {
      if (distance(run.player.x, run.player.y, run.extraction.x, run.extraction.y) < run.extraction.radius) {
        run.extraction.progress = Math.min(run.extraction.holdDuration, run.extraction.progress + dt);
        if (run.extraction.progress >= run.extraction.holdDuration) {
          game.completeRun(true, "Extraction complete. Echo archive secured.", { extracted: true, echoEligible: true });
          return;
        }
      } else {
        run.extraction.progress = Math.max(0, run.extraction.progress - dt * 1.5);
      }
      run.extraction.timeRemaining = Math.max(0, run.extraction.timeRemaining - dt);
      if (!run.extraction.warnedCritical && run.extraction.timeRemaining <= 6) {
        run.extraction.warnedCritical = true;
        game.pushNotification("Extraction Window Collapsing", "Beacon departure is imminent. Extract now or lose relic echo access.", "warn");
      }
      if (run.extraction.timeRemaining <= 0) {
        game.completeRun(true, "Contract complete, but the extraction beacon departed before pickup. No relic echo can be archived.", {
          extracted: false,
          echoEligible: false
        });
        return;
      }
    }

    run.camera.x = lerp(run.camera.x, run.player.x, 0.11);
    run.camera.y = lerp(run.camera.y, run.player.y, 0.11);

    if (run.pendingLevelUps > 0 && !game.activeModal) {
      game.openLevelUp();
    }
  }
