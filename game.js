(() => {
  "use strict";

  const STORAGE_KEY = "starfall-salvage-save-v1";
  const SAVE_VERSION = 1;
  const TWO_PI = Math.PI * 2;
  let NEXT_ID = 1;

  const MISSION_TYPES = {
    salvage: {
      id: "salvage",
      name: "Salvage Sweep",
      desc: "Recover unstable wreck cores across the sector before hostile forces can secure them."
    },
    hunt: {
      id: "hunt",
      name: "Hunter-Killer",
      desc: "Eliminate elite lieutenants and force the zone commander out of hiding."
    },
    defense: {
      id: "defense",
      name: "Reactor Defense",
      desc: "Hold the drill reactor inside its defense ring until the signal lock completes, then destroy the boss."
    },
    escort: {
      id: "escort",
      name: "Convoy Escort",
      desc: "Escort the armored convoy up the center corridor and keep losses below the contract cap."
    }
  };

  const CLASS_DATA = {
    vanguard: {
      id: "vanguard",
      name: "Vanguard",
      manufacturer: "Argent Yard",
      frameName: "VX-11 Bastion",
      role: "Frontline Breacher",
      signature: "Shield-breaching assault frame with fortress-grade plating.",
      desc: "Balanced combat exosuit armed with dual-rifles and a shield-breaking pulse.",
      weapon: "rifle",
      color: "#7cc8ff",
      unlockCost: { scrap: 0, cores: 0 },
      baseStats: {
        maxHealth: 158,
        maxShield: 56,
        damage: 18,
        fireRate: 5.2,
        moveSpeed: 235,
        armor: 8,
        critChance: 0.08,
        critMultiplier: 1.7,
        pickupRadius: 58,
        projectileSpeed: 900,
        dashCooldown: 3.4,
        abilityCooldown: 12
      },
      ability: {
        name: "Aegis Pulse",
        desc: "Knock back nearby enemies, deal kinetic damage, and restore shields."
      }
    },
    striker: {
      id: "striker",
      name: "Striker",
      manufacturer: "Halcyon Rushworks",
      frameName: "SR-7 Raptor",
      role: "Skirmish Ace",
      signature: "High-response pursuit craft tuned for burst movement and kill chains.",
      desc: "Fast evasive pilot with rapid-fire cannons and an overdrive combat mode.",
      weapon: "auto",
      color: "#84ffcf",
      unlockCost: { scrap: 0, cores: 0 },
      baseStats: {
        maxHealth: 132,
        maxShield: 40,
        damage: 14,
        fireRate: 8.6,
        moveSpeed: 270,
        armor: 4,
        critChance: 0.12,
        critMultiplier: 1.85,
        pickupRadius: 56,
        projectileSpeed: 980,
        dashCooldown: 2.9,
        abilityCooldown: 10.5
      },
      ability: {
        name: "Overdrive Step",
        desc: "Instantly refresh dash, then gain movement speed and fire rate for a short burst."
      }
    },
    warden: {
      id: "warden",
      name: "Warden",
      manufacturer: "Anchor Forge",
      frameName: "WDN-3 Bulwark",
      role: "Siege Bulwark",
      signature: "Siege chassis that anchors the field with layered fire support.",
      desc: "Heavy fortress platform that controls space with explosive slugs and protective bastions.",
      weapon: "cannon",
      color: "#ffc678",
      unlockCost: { scrap: 280, cores: 14 },
      baseStats: {
        maxHealth: 196,
        maxShield: 82,
        damage: 26,
        fireRate: 3.6,
        moveSpeed: 210,
        armor: 16,
        critChance: 0.05,
        critMultiplier: 1.65,
        pickupRadius: 60,
        projectileSpeed: 760,
        dashCooldown: 3.9,
        abilityCooldown: 13.5
      },
      ability: {
        name: "Bastion Field",
        desc: "Deploy a protective field that hardens your armor and burns enemies inside it."
      }
    },
    oracle: {
      id: "oracle",
      name: "Oracle",
      manufacturer: "Lattice Veil",
      frameName: "ORC-9 Choir",
      role: "Tech Arcanist",
      signature: "Experimental arc vessel that bends the fight with drones and storm logic.",
      desc: "Experimental arc-caster frame that chains lightning and commands autonomous drones.",
      weapon: "arc",
      color: "#d78fff",
      unlockCost: { scrap: 430, cores: 24 },
      baseStats: {
        maxHealth: 140,
        maxShield: 96,
        damage: 16,
        fireRate: 5.9,
        moveSpeed: 244,
        armor: 6,
        critChance: 0.09,
        critMultiplier: 1.75,
        pickupRadius: 62,
        projectileSpeed: 760,
        dashCooldown: 3.2,
        abilityCooldown: 12.5
      },
      ability: {
        name: "Drone Swarm",
        desc: "Launch a wing of support drones that orbit you and fire on nearby targets."
      }
    }
  };

  const ZONE_DATA = {
    scrapSea: {
      id: "scrapSea",
      name: "Scrap Sea",
      desc: "A graveyard of hulls and ferro-dust storms wrapped around shattered orbital tethers.",
      bossId: "ironReaper",
      rewardFactor: 1,
      unlockCost: { scrap: 0, cores: 0 },
      colors: {
        bg: "#0b0f18",
        floor: "#1a212d",
        grid: "rgba(130, 170, 230, 0.08)",
        accent: "#87bdff",
        accentSoft: "rgba(135, 189, 255, 0.16)",
        enemy: "#ff8b68",
        obstacle: "#32404f",
        objective: "#99f4ff",
        hazard: "#ffb06a"
      },
      enemyWeights: [
        { id: "crawler", weight: 34 },
        { id: "raider", weight: 18 },
        { id: "gunner", weight: 22 },
        { id: "mortar", weight: 8 },
        { id: "wasp", weight: 8 },
        { id: "sentinel", weight: 6 },
        { id: "siphon", weight: 4 }
      ]
    },
    emberReach: {
      id: "emberReach",
      name: "Ember Reach",
      desc: "Molten canyons where slag rivers cut through ship-breaking furnaces and exposed cores.",
      bossId: "emberHydra",
      rewardFactor: 1.16,
      unlockCost: { scrap: 220, cores: 12 },
      colors: {
        bg: "#170c0b",
        floor: "#2a1814",
        grid: "rgba(255, 155, 98, 0.07)",
        accent: "#ff9d65",
        accentSoft: "rgba(255, 157, 101, 0.16)",
        enemy: "#ffde88",
        obstacle: "#61352b",
        objective: "#ffd5a4",
        hazard: "#ff6a47"
      },
      enemyWeights: [
        { id: "crawler", weight: 18 },
        { id: "raider", weight: 30 },
        { id: "gunner", weight: 14 },
        { id: "mortar", weight: 20 },
        { id: "wasp", weight: 6 },
        { id: "sentinel", weight: 3 },
        { id: "siphon", weight: 9 }
      ]
    },
    nullReef: {
      id: "nullReef",
      name: "Null Reef",
      desc: "Bioluminescent alien wreck growth where corrupted signals coil around every shard.",
      bossId: "nullMatriarch",
      rewardFactor: 1.32,
      unlockCost: { scrap: 420, cores: 20 },
      colors: {
        bg: "#0b1021",
        floor: "#151d36",
        grid: "rgba(149, 130, 255, 0.07)",
        accent: "#a58dff",
        accentSoft: "rgba(165, 141, 255, 0.16)",
        enemy: "#72fff2",
        obstacle: "#334064",
        objective: "#d9c1ff",
        hazard: "#8f66ff"
      },
      enemyWeights: [
        { id: "crawler", weight: 10 },
        { id: "raider", weight: 12 },
        { id: "gunner", weight: 16 },
        { id: "mortar", weight: 10 },
        { id: "wasp", weight: 22 },
        { id: "sentinel", weight: 12 },
        { id: "siphon", weight: 18 }
      ]
    },
    blackVault: {
      id: "blackVault",
      name: "Black Vault",
      desc: "An ancient defense complex whose autonomous warforms still guard the inner archive.",
      bossId: "vaultTitan",
      rewardFactor: 1.52,
      unlockCost: { scrap: 800, cores: 38 },
      colors: {
        bg: "#070b12",
        floor: "#111a27",
        grid: "rgba(114, 208, 255, 0.07)",
        accent: "#7ed8ff",
        accentSoft: "rgba(126, 216, 255, 0.16)",
        enemy: "#f6f2ff",
        obstacle: "#32485d",
        objective: "#9cf4ff",
        hazard: "#59bbff"
      },
      enemyWeights: [
        { id: "crawler", weight: 8 },
        { id: "raider", weight: 18 },
        { id: "gunner", weight: 28 },
        { id: "mortar", weight: 12 },
        { id: "wasp", weight: 10 },
        { id: "sentinel", weight: 14 },
        { id: "siphon", weight: 10 }
      ]
    }
  };

  const MUTATORS = {
    swarm: {
      id: "swarm",
      name: "Swarm Surge",
      desc: "Enemy groups are larger and arrive more often.",
      rewardBonus: 0.18
    },
    overclocked: {
      id: "overclocked",
      name: "Overclocked",
      desc: "Enemies move and fire faster.",
      rewardBonus: 0.16
    },
    shielded: {
      id: "shielded",
      name: "Shielded",
      desc: "Hostiles deploy additional shield plating.",
      rewardBonus: 0.15
    },
    volatile: {
      id: "volatile",
      name: "Volatile",
      desc: "Enemy hulls erupt on death.",
      rewardBonus: 0.18
    },
    scarcity: {
      id: "scarcity",
      name: "Scarcity",
      desc: "Supply drops are rare, but payouts are richer.",
      rewardBonus: 0.2
    },
    stormfront: {
      id: "stormfront",
      name: "Stormfront",
      desc: "Random strike zones bombard the battlefield.",
      rewardBonus: 0.22
    },
    hunter: {
      id: "hunter",
      name: "Hunter Cells",
      desc: "Extra elite squads respond to your position.",
      rewardBonus: 0.2
    }
  };

  const ENEMY_DATA = {
    crawler: {
      id: "crawler",
      name: "Scrap Crawler",
      radius: 14,
      hp: 54,
      damage: 13,
      speed: 156,
      xp: 15,
      scrap: 7,
      color: "#ff8268",
      behavior: "melee"
    },
    raider: {
      id: "raider",
      name: "Raider Lancer",
      radius: 15,
      hp: 68,
      damage: 18,
      speed: 168,
      xp: 18,
      scrap: 8,
      color: "#ffd27e",
      behavior: "charger"
    },
    gunner: {
      id: "gunner",
      name: "Rail Gunner",
      radius: 15,
      hp: 64,
      damage: 15,
      speed: 134,
      xp: 18,
      scrap: 8,
      color: "#8ec7ff",
      behavior: "ranged"
    },
    mortar: {
      id: "mortar",
      name: "Mortar Drone",
      radius: 17,
      hp: 92,
      damage: 23,
      speed: 108,
      xp: 22,
      scrap: 11,
      color: "#ffb872",
      behavior: "mortar"
    },
    wasp: {
      id: "wasp",
      name: "Null Wasp",
      radius: 12,
      hp: 48,
      damage: 12,
      speed: 204,
      xp: 16,
      scrap: 6,
      color: "#72fff2",
      behavior: "skirmish"
    },
    sentinel: {
      id: "sentinel",
      name: "Sentinel Node",
      radius: 16,
      hp: 96,
      damage: 13,
      speed: 108,
      xp: 24,
      scrap: 12,
      color: "#b1a2ff",
      behavior: "support"
    },
    siphon: {
      id: "siphon",
      name: "Siphon Wretch",
      radius: 16,
      hp: 82,
      damage: 17,
      speed: 126,
      xp: 22,
      scrap: 10,
      color: "#d78fff",
      behavior: "drain"
    }
  };

  const BOSS_DATA = {
    ironReaper: {
      id: "ironReaper",
      name: "Iron Reaper",
      radius: 50,
      hp: 1900,
      damage: 24,
      speed: 112,
      color: "#8fd0ff",
      specialCooldown: 6.8
    },
    emberHydra: {
      id: "emberHydra",
      name: "Ember Hydra",
      radius: 54,
      hp: 2150,
      damage: 28,
      speed: 118,
      color: "#ffb06a",
      specialCooldown: 6.2
    },
    nullMatriarch: {
      id: "nullMatriarch",
      name: "Null Matriarch",
      radius: 48,
      hp: 2050,
      damage: 26,
      speed: 132,
      color: "#c6a0ff",
      specialCooldown: 6.6
    },
    vaultTitan: {
      id: "vaultTitan",
      name: "Vault Titan",
      radius: 60,
      hp: 2520,
      damage: 30,
      speed: 104,
      color: "#92ecff",
      specialCooldown: 7.3
    }
  };

  const PERMANENT_UPGRADES = [
    {
      id: "forgeDamage",
      name: "Ballistic Forge",
      desc: "Increase weapon damage by 6% per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 80, cores: 0 },
        { scrap: 120, cores: 2 },
        { scrap: 170, cores: 4 },
        { scrap: 240, cores: 6 },
        { scrap: 320, cores: 10 }
      ],
      currentText: (level) => `+${level * 6}% damage`
    },
    {
      id: "reinforcedHull",
      name: "Reinforced Hull",
      desc: "Increase max health by 12 per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 70, cores: 0 },
        { scrap: 100, cores: 1 },
        { scrap: 150, cores: 3 },
        { scrap: 210, cores: 5 },
        { scrap: 280, cores: 8 }
      ],
      currentText: (level) => `+${level * 12} max health`
    },
    {
      id: "capacitorBank",
      name: "Capacitor Bank",
      desc: "Increase max shield by 10 per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 70, cores: 0 },
        { scrap: 105, cores: 1 },
        { scrap: 150, cores: 3 },
        { scrap: 215, cores: 5 },
        { scrap: 290, cores: 8 }
      ],
      currentText: (level) => `+${level * 10} max shield`
    },
    {
      id: "burstThrusters",
      name: "Burst Thrusters",
      desc: "Increase move speed by 3% per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 75, cores: 0 },
        { scrap: 110, cores: 1 },
        { scrap: 160, cores: 3 },
        { scrap: 220, cores: 5 },
        { scrap: 300, cores: 8 }
      ],
      currentText: (level) => `+${level * 3}% move speed`
    },
    {
      id: "cooldownMesh",
      name: "Actuator Cooling",
      desc: "Reduce dash cooldown by 6% per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 80, cores: 0 },
        { scrap: 120, cores: 2 },
        { scrap: 170, cores: 4 },
        { scrap: 235, cores: 6 },
        { scrap: 310, cores: 9 }
      ],
      currentText: (level) => `-${level * 6}% dash cooldown`
    },
    {
      id: "abilityMatrix",
      name: "Command Uplink",
      desc: "Reduce class ability cooldown by 6% per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 90, cores: 0 },
        { scrap: 130, cores: 2 },
        { scrap: 185, cores: 4 },
        { scrap: 255, cores: 7 },
        { scrap: 340, cores: 10 }
      ],
      currentText: (level) => `-${level * 6}% ability cooldown`
    },
    {
      id: "salvageRigs",
      name: "Salvage Rigs",
      desc: "Increase Scrap gained during missions by 8% per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 70, cores: 0 },
        { scrap: 115, cores: 1 },
        { scrap: 165, cores: 3 },
        { scrap: 225, cores: 5 },
        { scrap: 300, cores: 8 }
      ],
      currentText: (level) => `+${level * 8}% mission Scrap`
    },
    {
      id: "archiveDecoder",
      name: "Archive Decoder",
      desc: "Increase XP gain by 8% per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 85, cores: 0 },
        { scrap: 120, cores: 2 },
        { scrap: 170, cores: 4 },
        { scrap: 235, cores: 6 },
        { scrap: 320, cores: 9 }
      ],
      currentText: (level) => `+${level * 8}% XP gain`
    },
    {
      id: "reactivePlating",
      name: "Reactive Plating",
      desc: "Increase armor by 3 per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 80, cores: 0 },
        { scrap: 120, cores: 2 },
        { scrap: 170, cores: 4 },
        { scrap: 240, cores: 6 },
        { scrap: 320, cores: 10 }
      ],
      currentText: (level) => `+${level * 3} armor`
    },
    {
      id: "bountyTargeting",
      name: "Bounty Targeting",
      desc: "Increase boss damage by 7% per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 90, cores: 0 },
        { scrap: 135, cores: 2 },
        { scrap: 190, cores: 4 },
        { scrap: 260, cores: 7 },
        { scrap: 350, cores: 10 }
      ],
      currentText: (level) => `+${level * 7}% boss damage`
    },
    {
      id: "precisionSuite",
      name: "Precision Suite",
      desc: "Increase crit chance by 2% per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 80, cores: 0 },
        { scrap: 125, cores: 2 },
        { scrap: 180, cores: 4 },
        { scrap: 245, cores: 6 },
        { scrap: 330, cores: 10 }
      ],
      currentText: (level) => `+${level * 2}% crit chance`
    },
    {
      id: "finisherProtocol",
      name: "Finisher Protocol",
      desc: "Increase Combo Surge offensive bonuses by 8% per rank.",
      maxLevel: 5,
      costs: [
        { scrap: 95, cores: 0 },
        { scrap: 145, cores: 2 },
        { scrap: 205, cores: 4 },
        { scrap: 280, cores: 7 },
        { scrap: 365, cores: 10 }
      ],
      currentText: (level) => `+${level * 8}% Combo Surge potency`
    },
    {
      id: "momentumDrive",
      name: "Momentum Drive",
      desc: "Increase Combo Surge duration by 12% per rank and improve its movement gain.",
      maxLevel: 5,
      costs: [
        { scrap: 90, cores: 0 },
        { scrap: 135, cores: 2 },
        { scrap: 190, cores: 4 },
        { scrap: 255, cores: 6 },
        { scrap: 335, cores: 9 }
      ],
      currentText: (level) => `+${level * 12}% Combo Surge duration`
    },
    {
      id: "killTelemetry",
      name: "Kill Telemetry",
      desc: "Lower Combo Surge thresholds and grant a shield burst whenever a surge triggers.",
      maxLevel: 5,
      costs: [
        { scrap: 100, cores: 0 },
        { scrap: 150, cores: 2 },
        { scrap: 210, cores: 4 },
        { scrap: 285, cores: 7 },
        { scrap: 370, cores: 10 }
      ],
      currentText: (level) => `Tier I -${level}, Tier II/III -${level * 2}`
    }
  ];

  const RELICS = [
    {
      id: "ferroCore",
      name: "Ferro Core",
      rarity: "common",
      desc: "+12% weapon damage.",
      maxStacks: 6,
      apply(game, run) {
        run.player.stats.damage *= 1.12;
      }
    },
    {
      id: "thrusterGel",
      name: "Thruster Gel",
      rarity: "common",
      desc: "+8% move speed and slightly stronger dashes.",
      maxStacks: 5,
      apply(game, run) {
        run.player.stats.moveSpeed *= 1.08;
        run.player.stats.dashSpeed *= 1.05;
      }
    },
    {
      id: "capacitorMesh",
      name: "Capacitor Mesh",
      rarity: "common",
      desc: "+25 max shield and better shield regeneration.",
      maxStacks: 4,
      apply(game, run) {
        run.player.stats.maxShield += 25;
        run.player.shield += 25;
        run.player.stats.shieldRegenRate *= 1.14;
      }
    },
    {
      id: "reclaimerNanites",
      name: "Reclaimer Nanites",
      rarity: "common",
      desc: "+20 max health and restore 15 health immediately.",
      maxStacks: 5,
      apply(game, run) {
        run.player.stats.maxHealth += 20;
        run.player.hp += 35;
      }
    },
    {
      id: "kineticFeed",
      name: "Kinetic Feed",
      rarity: "common",
      desc: "+12% fire rate.",
      maxStacks: 6,
      apply(game, run) {
        run.player.stats.fireRate *= 1.12;
      }
    },
    {
      id: "salvageMagnet",
      name: "Salvage Magnet",
      rarity: "common",
      desc: "+22 pickup radius and +12% Scrap gained in this run.",
      maxStacks: 4,
      apply(game, run) {
        run.player.stats.pickupRadius += 22;
        run.player.stats.scrapGain *= 1.12;
      }
    },
    {
      id: "targetingSuite",
      name: "Targeting Suite",
      rarity: "common",
      desc: "+6% crit chance.",
      maxStacks: 5,
      apply(game, run) {
        run.player.stats.critChance += 0.06;
      }
    },
    {
      id: "archivePulse",
      name: "Archive Pulse",
      rarity: "common",
      desc: "+18% XP gain.",
      maxStacks: 4,
      apply(game, run) {
        run.player.stats.xpGain *= 1.18;
      }
    },
    {
      id: "emberRounds",
      name: "Ember Rounds",
      rarity: "rare",
      desc: "Projectiles have a 24% chance to apply burn.",
      maxStacks: 3,
      apply(game, run) {
        run.player.stats.burnChance += 0.24;
      }
    },
    {
      id: "frostLoop",
      name: "Frost Loop",
      rarity: "rare",
      desc: "Projectiles slow enemies for 1.2 seconds.",
      maxStacks: 2,
      apply(game, run) {
        run.player.stats.slowChance += 0.34;
      }
    },
    {
      id: "multitoolArray",
      name: "Multitool Array",
      rarity: "rare",
      desc: "+1 additional projectile.",
      maxStacks: 3,
      apply(game, run) {
        run.player.stats.projectiles += 1;
      }
    },
    {
      id: "phaseMine",
      name: "Phase Mine",
      rarity: "rare",
      desc: "Dashes release a friendly shock mine.",
      maxStacks: 3,
      apply(game, run) {
        run.player.stats.dashMine += 1;
      }
    },
    {
      id: "chainReactor",
      name: "Chain Reactor",
      rarity: "rare",
      desc: "Hits chain lightning to nearby enemies.",
      maxStacks: 3,
      apply(game, run) {
        run.player.stats.chainCount += 1;
        run.player.stats.chainDamageMultiplier += 0.12;
      }
    },
    {
      id: "hyperServo",
      name: "Hyper Servo",
      rarity: "rare",
      desc: "+1 pierce and larger projectile frames.",
      maxStacks: 3,
      apply(game, run) {
        run.player.stats.pierce += 1;
        run.player.stats.projectileSize *= 1.15;
      }
    },
    {
      id: "bloodCircuit",
      name: "Blood Circuit",
      rarity: "rare",
      desc: "Gain 4% lifesteal from weapon damage.",
      maxStacks: 3,
      apply(game, run) {
        run.player.stats.lifesteal += 0.04;
      }
    },
    {
      id: "volatileCore",
      name: "Volatile Core",
      rarity: "rare",
      desc: "Enemies explode on death for friendly damage.",
      maxStacks: 2,
      apply(game, run) {
        run.player.stats.deathExplosion += 1;
      }
    },
    {
      id: "orbitalSaw",
      name: "Orbital Saw",
      rarity: "rare",
      desc: "Deploy an orbiting blade drone.",
      maxStacks: 3,
      apply(game, run) {
        run.player.stats.orbitals += 1;
        refreshSupportUnits(run);
      }
    },
    {
      id: "echoDrone",
      name: "Echo Drone",
      rarity: "rare",
      desc: "Deploy a support drone.",
      maxStacks: 3,
      apply(game, run) {
        run.player.stats.drones += 1;
        refreshSupportUnits(run);
      }
    },
    {
      id: "repairField",
      name: "Repair Field",
      rarity: "rare",
      desc: "Regenerate a small amount of health over time.",
      maxStacks: 3,
      apply(game, run) {
        run.player.stats.healRegen += 2.25;
      }
    },
    {
      id: "warlordArray",
      name: "Warlord Array",
      rarity: "legendary",
      desc: "+20% damage and +8 armor.",
      maxStacks: 2,
      apply(game, run) {
        run.player.stats.damage *= 1.2;
        run.player.stats.armor += 8;
      }
    },
    {
      id: "quantumSpindle",
      name: "Quantum Spindle",
      rarity: "legendary",
      desc: "+2 projectiles and +15% fire rate.",
      maxStacks: 1,
      apply(game, run) {
        run.player.stats.projectiles += 2;
        run.player.stats.fireRate *= 1.15;
      }
    },
    {
      id: "phoenixCore",
      name: "Phoenix Core",
      rarity: "legendary",
      desc: "Cheat death once per run, restoring health and shields.",
      maxStacks: 1,
      apply(game, run) {
        run.player.stats.cheatDeath += 1;
      }
    },
    {
      id: "singularityLens",
      name: "Singularity Lens",
      rarity: "legendary",
      desc: "Greatly improve ability cooldowns and add a gravity pulse to activations.",
      maxStacks: 1,
      apply(game, run) {
        run.player.stats.abilityCooldown *= 0.78;
        run.player.stats.abilityBlast += 1;
      }
    }
  ];

  const RELIC_SYNERGIES = [
    {
      id: "thermalShock",
      name: "Thermal Shock",
      desc: "Burning and slowed enemies shatter for bonus area damage.",
      requiredRelics: ["emberRounds", "frostLoop"],
      activate(run) {
        run.player.relicSynergies.thermalShock = true;
      }
    },
    {
      id: "escortWing",
      name: "Escort Wing",
      desc: "Drone and orbital systems expand into a heavier escort formation.",
      requiredRelics: ["echoDrone", "orbitalSaw"],
      activate(run) {
        run.player.relicSynergies.escortWing = true;
        run.player.stats.drones += 1;
        run.player.stats.orbitals += 1;
        run.player.stats.supportDamageMultiplier *= 1.25;
        run.player.stats.supportFireRateMultiplier *= 1.22;
        refreshSupportUnits(run);
      }
    },
    {
      id: "bloodReserve",
      name: "Blood Reserve",
      desc: "Healing overflow converts into shields.",
      requiredRelics: ["bloodCircuit", "reclaimerNanites"],
      activate(run) {
        run.player.relicSynergies.bloodReserve = true;
      }
    },
    {
      id: "eventHorizon",
      name: "Event Horizon",
      desc: "Abilities leave behind singularity scars and stronger chain surges.",
      requiredRelics: ["chainReactor", "singularityLens"],
      activate(run) {
        run.player.relicSynergies.eventHorizon = true;
        run.player.stats.chainDamageMultiplier += 0.12;
        run.player.stats.abilityBlast += 1;
      }
    }
  ];

  const ACHIEVEMENTS = [
    { id: "firstContract", name: "Boots On Deck", desc: "Complete your first contract.", reward: { scrap: 100, cores: 4 } },
    { id: "salvageVeteran", name: "Salvage Veteran", desc: "Complete 15 contracts.", reward: { scrap: 260, cores: 10 } },
    { id: "scrapBaron", name: "Scrap Baron", desc: "Earn 5000 Scrap across all campaigns.", reward: { scrap: 400, cores: 14 } },
    { id: "bossHunter", name: "Boss Hunter", desc: "Defeat 20 bosses.", reward: { scrap: 420, cores: 16 } },
    { id: "threatBreaker", name: "Threat Breaker", desc: "Clear a Threat V contract.", reward: { scrap: 300, cores: 12 } },
    { id: "horizonBreaker", name: "Horizon Breaker", desc: "Reach level 15 in a single run.", reward: { scrap: 250, cores: 10 } },
    { id: "killbox", name: "Killbox", desc: "Defeat 300 enemies in one run.", reward: { scrap: 260, cores: 10 } },
    { id: "comboEngine", name: "Combo Engine", desc: "Reach a kill streak of 40.", reward: { scrap: 220, cores: 8 } },
    { id: "perfectHunt", name: "Perfect Hunt", desc: "Defeat a boss without taking damage after it arrives.", reward: { scrap: 260, cores: 12 } },
    { id: "fullRoster", name: "Full Roster", desc: "Unlock every class license.", reward: { scrap: 250, cores: 12 } },
    { id: "chartedFrontier", name: "Charted Frontier", desc: "Unlock every combat zone.", reward: { scrap: 300, cores: 16 } },
    { id: "foundryForeman", name: "Foundry Foreman", desc: "Purchase 20 permanent upgrades.", reward: { scrap: 320, cores: 14 } },
    { id: "fourfoldAce", name: "Fourfold Ace", desc: "Earn at least one victory with each class.", reward: { scrap: 450, cores: 18 } },
    { id: "coreTycoon", name: "Core Tycoon", desc: "Collect 120 Core Shards in total.", reward: { scrap: 320, cores: 14 } },
    { id: "enduringLight", name: "Enduring Light", desc: "Survive 25 minutes in a single contract.", reward: { scrap: 360, cores: 16 } }
  ];

  const RELIC_RARITY_WEIGHT = {
    common: 60,
    rare: 30,
    legendary: 10
  };

  const RARITY_TAG = {
    common: "Common",
    rare: "Rare",
    legendary: "Legendary"
  };

  const PICKUP_TYPES = {
    xp: {
      radius: 7,
      color: "#89ffba",
      glow: "rgba(137, 255, 186, 0.28)",
      magnet: 0.72,
      collectPadding: 10,
      burstMin: 38,
      burstMax: 105
    },
    scrap: {
      radius: 8.4,
      color: "#8cc7ff",
      glow: "rgba(140, 199, 255, 0.28)",
      magnet: 0.8,
      collectPadding: 11,
      burstMin: 44,
      burstMax: 125
    },
    heal: {
      radius: 9.2,
      color: "#ff90a0",
      glow: "rgba(255, 144, 160, 0.28)",
      magnet: 0.82,
      collectPadding: 12,
      burstMin: 34,
      burstMax: 100
    },
    shield: {
      radius: 9.2,
      color: "#7cdfff",
      glow: "rgba(124, 223, 255, 0.28)",
      magnet: 0.84,
      collectPadding: 12,
      burstMin: 34,
      burstMax: 100
    },
    core: {
      radius: 10.6,
      color: "#ffe68a",
      glow: "rgba(255, 230, 138, 0.32)",
      magnet: 0.9,
      collectPadding: 13,
      burstMin: 48,
      burstMax: 135
    }
  };

  const SUPPLY_POD_TYPES = {
    cache: {
      id: "cache",
      name: "Cache Pod",
      color: "#8cc7ff",
      accent: "#d8f1ff",
      desc: "Cracks open into salvage, cores, and signal shards."
    },
    repair: {
      id: "repair",
      name: "Repair Pod",
      color: "#ff90a0",
      accent: "#ffe1e6",
      desc: "Restores hull integrity and shield capacity."
    },
    overclock: {
      id: "overclock",
      name: "Overclock Pod",
      color: "#ffbf72",
      accent: "#fff0d3",
      desc: "Feeds a temporary combat surge into your weapons."
    },
    magnet: {
      id: "magnet",
      name: "Magnet Pod",
      color: "#9ce6ff",
      accent: "#e4fbff",
      desc: "Amplifies your salvage vacuum field and reels in loose drops."
    }
  };

  const ABILITY_SLOT_ORDER = ["q", "e", "r", "t"];

  const ABILITY_SLOT_META = {
    q: { key: "Q", unlockLevel: 1 },
    e: { key: "E", unlockLevel: 3 },
    r: { key: "R", unlockLevel: 5 },
    t: { key: "F", unlockLevel: 8 }
  };

  const CLASS_ABILITY_KITS = {
    vanguard: {
      q: { name: "Aegis Pulse", unlockLevel: 1, cooldown: 9.6, desc: "Shock pulse, shield restore, and missile lash." },
      e: { name: "Bulwark Charge", unlockLevel: 3, cooldown: 11.8, desc: "Crash forward and rupture the impact zone." },
      r: { name: "Bastion Barrage", unlockLevel: 5, cooldown: 16.8, desc: "Launch a heavy missile battery into the fight." },
      t: { name: "Citadel Protocol", unlockLevel: 8, cooldown: 24, desc: "Raise a fortress field and call down orbital strikes." }
    },
    striker: {
      q: { name: "Overdrive Step", unlockLevel: 1, cooldown: 8.5, desc: "Refresh dash and spike your combat tempo." },
      e: { name: "Afterimage Fan", unlockLevel: 3, cooldown: 9.8, desc: "Unload a razor fan through the forward arc." },
      r: { name: "Hunter Spiral", unlockLevel: 5, cooldown: 15, desc: "Flood the area with spiraling hunter rounds." },
      t: { name: "Hyperstorm", unlockLevel: 8, cooldown: 22.5, desc: "Enter an amplified storm state with support fire." }
    },
    warden: {
      q: { name: "Bastion Field", unlockLevel: 1, cooldown: 10.8, desc: "Create a burning bulwark and harden your frame." },
      e: { name: "Siege Mortar", unlockLevel: 3, cooldown: 10.6, desc: "Mark a bombardment zone at your cursor." },
      r: { name: "Interceptor Grid", unlockLevel: 5, cooldown: 16.2, desc: "Deploy interceptors and orbital cover." },
      t: { name: "Cataclysm Core", unlockLevel: 8, cooldown: 24.5, desc: "Detonate a siege-scale shockwave." }
    },
    oracle: {
      q: { name: "Drone Swarm", unlockLevel: 1, cooldown: 10.4, desc: "Unleash attack drones and an arc surge." },
      e: { name: "Arc Prison", unlockLevel: 3, cooldown: 10.8, desc: "Bind a target zone inside a crackling cage." },
      r: { name: "Phase Fracture", unlockLevel: 5, cooldown: 15.6, desc: "Blink through space and rupture both ends." },
      t: { name: "Tempest Choir", unlockLevel: 8, cooldown: 23.5, desc: "Summon a choir of storms, drones, and arc fire." }
    }
  };

  const PROTOTYPE_WEAPONS = {
    ionLance: {
      id: "ionLance",
      name: "Ion Lance",
      color: "#9cefff",
      duration: 24,
      desc: "Adds piercing ion bolts to every volley."
    },
    swarmRack: {
      id: "swarmRack",
      name: "Swarm Rack",
      color: "#ffd690",
      duration: 22,
      desc: "Feeds homing micro-missiles into sustained fire."
    },
    fractureCannon: {
      id: "fractureCannon",
      name: "Fracture Cannon",
      color: "#d2b4ff",
      duration: 23,
      desc: "Shatters each burst into explosive shards."
    },
    beamLaser: {
      id: "beamLaser",
      name: "Beam Laser",
      color: "#85fff4",
      duration: 21,
      desc: "Projects a piercing beam that cuts through enemies and shoots missiles out of the sky."
    }
  };

  const ANOMALY_TYPES = {
    mine: {
      id: "mine",
      name: "Mine Cluster",
      color: "#ffad72"
    },
    vent: {
      id: "vent",
      name: "Thermal Vent",
      color: "#ff835e"
    },
    rift: {
      id: "rift",
      name: "Gravity Rift",
      color: "#ab9dff"
    },
    pylon: {
      id: "pylon",
      name: "Storm Pylon",
      color: "#8fe7ff"
    }
  };

  const ZONE_ANOMALY_WEIGHTS = {
    scrapSea: [
      { id: "mine", weight: 35 },
      { id: "pylon", weight: 18 },
      { id: "rift", weight: 10 }
    ],
    emberReach: [
      { id: "vent", weight: 40 },
      { id: "mine", weight: 18 },
      { id: "pylon", weight: 8 }
    ],
    nullReef: [
      { id: "rift", weight: 36 },
      { id: "mine", weight: 14 },
      { id: "pylon", weight: 14 }
    ],
    blackVault: [
      { id: "pylon", weight: 34 },
      { id: "mine", weight: 18 },
      { id: "rift", weight: 14 }
    ]
  };

  const ENEMY_PROJECTILE_PALETTE = [
    "#ff4d45",
    "#ff6e3d",
    "#ff8a32",
    "#ffb13f",
    "#ff5d6c",
    "#ff7d4f"
  ];

  const MUSIC_PROFILES = {
    menu: {
      key: "menu",
      bpm: 74,
      root: 50,
      leadType: "triangle",
      bassType: "sine",
      padType: "triangle",
      leadVolume: 0.012,
      bassVolume: 0.02,
      padVolume: 0.0038,
      progression: [
        { bass: -12, chord: [0, 7, 12], arp: [12, 19, 24, 19, 14, 19, 22, 19] },
        { bass: -10, chord: [2, 9, 14], arp: [14, 21, 26, 21, 17, 21, 24, 21] },
        { bass: -9, chord: [3, 10, 15], arp: [15, 22, 27, 22, 19, 22, 24, 22] },
        { bass: -5, chord: [7, 12, 19], arp: [19, 24, 26, 24, 21, 24, 28, 24] }
      ]
    },
    hub: {
      key: "hub",
      bpm: 86,
      root: 52,
      leadType: "triangle",
      bassType: "triangle",
      padType: "sine",
      leadVolume: 0.013,
      bassVolume: 0.022,
      padVolume: 0.0042,
      progression: [
        { bass: -12, chord: [0, 7, 12], arp: [12, 16, 19, 24, 19, 16, 14, 19] },
        { bass: -8, chord: [4, 11, 16], arp: [16, 21, 23, 28, 23, 21, 19, 23] },
        { bass: -5, chord: [7, 14, 19], arp: [19, 23, 26, 31, 26, 23, 21, 26] },
        { bass: -10, chord: [2, 9, 14], arp: [14, 18, 21, 26, 21, 18, 16, 21] }
      ]
    },
    talents: {
      key: "talents",
      bpm: 92,
      root: 55,
      leadType: "triangle",
      bassType: "triangle",
      padType: "triangle",
      leadVolume: 0.014,
      bassVolume: 0.024,
      padVolume: 0.0044,
      progression: [
        { bass: -12, chord: [0, 7, 12], arp: [12, 15, 19, 22, 24, 22, 19, 15] },
        { bass: -7, chord: [5, 12, 17], arp: [17, 20, 24, 27, 29, 27, 24, 20] },
        { bass: -5, chord: [7, 14, 19], arp: [19, 22, 26, 29, 31, 29, 26, 22] },
        { bass: -10, chord: [2, 9, 14], arp: [14, 17, 21, 24, 26, 24, 21, 17] }
      ]
    },
    missionLow: {
      key: "missionLow",
      bpm: 98,
      root: 43,
      leadType: "triangle",
      bassType: "triangle",
      padType: "sawtooth",
      leadVolume: 0.0135,
      bassVolume: 0.024,
      padVolume: 0.0035,
      progression: [
        { bass: -12, chord: [0, 3, 7], arp: [12, 15, 19, 15, 10, 15, 17, 15] },
        { bass: -10, chord: [2, 5, 9], arp: [14, 17, 21, 17, 12, 17, 19, 17] },
        { bass: -8, chord: [3, 7, 10], arp: [15, 19, 22, 19, 15, 19, 20, 19] },
        { bass: -13, chord: [-1, 3, 6], arp: [11, 15, 18, 15, 10, 15, 17, 15] }
      ]
    },
    missionHigh: {
      key: "missionHigh",
      bpm: 110,
      root: 41,
      leadType: "triangle",
      bassType: "triangle",
      padType: "sawtooth",
      leadVolume: 0.015,
      bassVolume: 0.026,
      padVolume: 0.0038,
      progression: [
        { bass: -12, chord: [0, 3, 7], arp: [12, 19, 15, 22, 12, 19, 17, 24] },
        { bass: -9, chord: [3, 7, 10], arp: [15, 22, 19, 24, 15, 22, 20, 27] },
        { bass: -10, chord: [2, 5, 9], arp: [14, 21, 17, 24, 14, 21, 19, 26] },
        { bass: -14, chord: [-2, 2, 5], arp: [10, 17, 14, 21, 10, 17, 15, 22] }
      ]
    },
    boss: {
      key: "boss",
      bpm: 124,
      root: 38,
      leadType: "square",
      bassType: "triangle",
      padType: "sawtooth",
      leadVolume: 0.014,
      bassVolume: 0.028,
      padVolume: 0.0032,
      progression: [
        { bass: -12, chord: [0, 1, 7], arp: [12, 13, 19, 20, 13, 19, 20, 25] },
        { bass: -11, chord: [1, 6, 10], arp: [13, 18, 22, 25, 18, 22, 25, 30] },
        { bass: -9, chord: [3, 6, 10], arp: [15, 18, 22, 27, 18, 22, 25, 30] },
        { bass: -14, chord: [-2, 3, 6], arp: [10, 15, 18, 22, 15, 18, 22, 27] }
      ]
    }
  };

  const UPGRADE_BRANCHES = [
    {
      id: "weapons",
      name: "Weapons Grid",
      color: "#ffb36a",
      desc: "Sharpen output, precision, and boss kill pressure.",
      upgrades: ["forgeDamage", "precisionSuite", "bountyTargeting", "finisherProtocol"]
    },
    {
      id: "defense",
      name: "Hull Matrix",
      color: "#7cc8ff",
      desc: "Stack hull, shields, and armor plating.",
      upgrades: ["reinforcedHull", "capacitorBank", "reactivePlating"]
    },
    {
      id: "mobility",
      name: "Thruster Spine",
      color: "#84ffcf",
      desc: "Move faster and recycle dash systems quicker.",
      upgrades: ["burstThrusters", "cooldownMesh", "momentumDrive"]
    },
    {
      id: "systems",
      name: "Command Mesh",
      color: "#d6a4ff",
      desc: "Accelerate abilities, salvage, and signal growth.",
      upgrades: ["archiveDecoder", "salvageRigs", "abilityMatrix", "killTelemetry"]
    }
  ];

  const UI_IDS = [
    "gameCanvas",
    "hud",
    "notificationStack",
    "playerNameLabel",
    "zoneLabel",
    "healthBar",
    "shieldBar",
    "healthText",
    "shieldText",
    "levelText",
    "xpBar",
    "xpText",
    "objectiveLabel",
    "timerText",
    "threatText",
    "runScrapText",
    "runCoreText",
    "streakText",
    "relicStrip",
    "dashCooldownBar",
    "dashLabel",
    "abilityQName",
    "abilityQBar",
    "abilityQLabel",
    "abilityEName",
    "abilityEBar",
    "abilityELabel",
    "abilityRName",
    "abilityRBar",
    "abilityRLabel",
    "abilityFName",
    "abilityFBar",
    "abilityFLabel",
    "continueButton",
    "menuStatusRow",
    "menuShipShowcase",
    "menuProgressShowcase",
    "profileSummary",
    "metaScrapText",
    "metaCoreText",
    "metaRenownText",
    "talentStatusRow",
    "classList",
    "zoneList",
    "contractBoard",
    "upgradeList",
    "talentTreeView",
    "archiveList",
    "achievementList",
    "levelUpChoices",
    "summaryTitle",
    "summaryLead",
    "summaryStats",
    "summaryRewards",
    "summaryArchiveTitle",
    "summaryArchiveChoices",
    "optionMuteAudio",
    "optionMasterVolume",
    "optionSfxVolume",
    "optionMusicVolume",
    "optionScreenShake",
    "optionParticles",
    "optionDefaultAutoFire"
  ];

  const UPGRADE_MAP = Object.fromEntries(PERMANENT_UPGRADES.map((upgrade) => [upgrade.id, upgrade]));
  const RELIC_MAP = Object.fromEntries(RELICS.map((relic) => [relic.id, relic]));
  const RELIC_SYNERGY_MAP = Object.fromEntries(RELIC_SYNERGIES.map((synergy) => [synergy.id, synergy]));
  const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((item) => [item.id, item]));

  function makeId() {
    NEXT_ID += 1;
    return NEXT_ID;
  }

  function el(id) {
    return document.getElementById(id);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function midiToHz(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function distance(aX, aY, bX, bY) {
    return Math.hypot(bX - aX, bY - aY);
  }

  function distanceSq(aX, aY, bX, bY) {
    const dx = bX - aX;
    const dy = bY - aY;
    return dx * dx + dy * dy;
  }

  function normalize(dx, dy) {
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  function angleTo(aX, aY, bX, bY) {
    return Math.atan2(bY - aY, bX - aX);
  }

  function wrapAngle(angle) {
    while (angle < -Math.PI) {
      angle += TWO_PI;
    }
    while (angle > Math.PI) {
      angle -= TWO_PI;
    }
    return angle;
  }

  function lerpAngle(current, target, amount) {
    return current + wrapAngle(target - current) * amount;
  }

  function createRng(seed) {
    let state = seed >>> 0;
    return {
      next() {
        state += 0x6d2b79f5;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      range(min, max) {
        return min + (max - min) * this.next();
      },
      int(min, max) {
        return Math.floor(this.range(min, max + 1));
      },
      choice(list) {
        return list[Math.floor(this.next() * list.length)];
      },
      chance(probability) {
        return this.next() < probability;
      }
    };
  }

  function weightedPick(rng, entries) {
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = rng.next() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.id;
      }
    }
    return entries[entries.length - 1].id;
  }

  function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  function romanThreat(value) {
    const numerals = ["I", "II", "III", "IV", "V"];
    return numerals[clamp(value, 1, 5) - 1];
  }

  function getScaryProjectileColor(config) {
    const seedSource = `${config.color || ""}-${config.damage || 0}-${config.radius || 0}`;
    let hash = 0;
    for (let index = 0; index < seedSource.length; index += 1) {
      hash = (hash * 31 + seedSource.charCodeAt(index)) % 2147483647;
    }
    return ENEMY_PROJECTILE_PALETTE[Math.abs(hash) % ENEMY_PROJECTILE_PALETTE.length];
  }

  function getUpgradeBranch(upgradeId) {
    for (const branch of UPGRADE_BRANCHES) {
      const index = branch.upgrades.indexOf(upgradeId);
      if (index >= 0) {
        return { branch, index };
      }
    }
    return null;
  }

  function isUpgradeNodeUnlocked(save, upgradeId) {
    const branchInfo = getUpgradeBranch(upgradeId);
    if (!branchInfo || branchInfo.index === 0) {
      return true;
    }
    const previousUpgradeId = branchInfo.branch.upgrades[branchInfo.index - 1];
    return getUpgradeLevel(save, previousUpgradeId) > 0;
  }

  function getTotalUpgradeRanks(save) {
    return PERMANENT_UPGRADES.reduce((sum, upgrade) => sum + getUpgradeLevel(save, upgrade.id), 0);
  }

  function getMaxUpgradeRanks() {
    return PERMANENT_UPGRADES.reduce((sum, upgrade) => sum + upgrade.maxLevel, 0);
  }

  function getUpgradeBranchState(save, branch) {
    const nodes = branch.upgrades.map((upgradeId, index) => {
      const upgrade = UPGRADE_MAP[upgradeId];
      const level = getUpgradeLevel(save, upgrade.id);
      const atMax = level >= upgrade.maxLevel;
      const unlocked = isUpgradeNodeUnlocked(save, upgrade.id);
      const cost = atMax ? null : getUpgradeCost(upgrade, level);
      return {
        upgrade,
        index,
        level,
        atMax,
        unlocked,
        cost,
        fillPercent: (level / Math.max(1, upgrade.maxLevel)) * 100
      };
    });
    const points = nodes.reduce((sum, node) => sum + node.level, 0);
    const maxPoints = nodes.reduce((sum, node) => sum + node.upgrade.maxLevel, 0);
    return {
      branch,
      nodes,
      points,
      maxPoints,
      completion: points / Math.max(1, maxPoints),
      maxedNodes: nodes.filter((node) => node.atMax).length
    };
  }

  function getShipPreviewSvg(classId) {
    const classData = CLASS_DATA[classId];
    const stroke = classData.color;
    const fill = "rgba(8, 14, 27, 0.95)";
    const shape = {
      vanguard: `<path d="M88 52L136 72L164 110L136 148L88 168L56 142L46 110L56 78Z" fill="${fill}" stroke="${stroke}" stroke-width="6"/><path d="M94 100H158" stroke="${stroke}" stroke-width="8" stroke-linecap="round"/>`,
      striker: `<path d="M60 110L98 54L170 88L170 132L98 166Z" fill="${fill}" stroke="${stroke}" stroke-width="6"/><path d="M68 110L152 110" stroke="${stroke}" stroke-width="8" stroke-linecap="round"/>`,
      warden: `<path d="M52 86L82 54H144L174 86V134L144 166H82L52 134Z" fill="${fill}" stroke="${stroke}" stroke-width="6"/><rect x="92" y="92" width="58" height="36" rx="10" fill="${stroke}" fill-opacity="0.28"/>`,
      oracle: `<path d="M62 110L98 58L144 58L176 110L144 162L98 162Z" fill="${fill}" stroke="${stroke}" stroke-width="6"/><circle cx="118" cy="110" r="22" fill="${stroke}" fill-opacity="0.22" stroke="${stroke}" stroke-width="5"/>`
    }[classId];
    return `
      <svg class="ship-preview-svg" viewBox="0 0 228 220" aria-hidden="true">
        <defs>
          <radialGradient id="shipGlow-${classId}" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="${stroke}" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="${stroke}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="114" cy="110" r="92" fill="url(#shipGlow-${classId})"/>
        ${shape}
      </svg>
    `;
  }

  function deepMerge(target, source) {
    if (!source || typeof source !== "object") {
      return target;
    }
    for (const key of Object.keys(source)) {
      if (Array.isArray(source[key])) {
        target[key] = source[key].slice();
      } else if (source[key] && typeof source[key] === "object") {
        if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  function createDefaultSave() {
    return {
      version: SAVE_VERSION,
      started: false,
      currencies: {
        scrap: 120,
        cores: 8,
        renown: 0
      },
      selectedClass: "vanguard",
      unlockedClasses: ["vanguard", "striker"],
      unlockedZones: ["scrapSea"],
      relicArchive: {
        capacity: 3,
        relics: []
      },
      upgradeLevels: {},
      achievements: {},
      options: {
        muteAudio: false,
        masterVolume: 45,
        sfxVolume: 78,
        musicVolume: 52,
        screenShake: 70,
        particles: true,
        defaultAutoFire: false
      },
      lastContract: null,
      profile: {
        totalRuns: 0,
        contractsWon: 0,
        contractsFailed: 0,
        bossesKilled: 0,
        totalKills: 0,
        lifetimeScrap: 0,
        lifetimeCores: 0,
        totalTime: 0,
        highestThreat: 1,
        highestLevel: 1,
        longestRun: 0,
        bestCombo: 0,
        bestRunKills: 0,
        flawlessBosses: 0,
        upgradesPurchased: 0,
        classVictories: {
          vanguard: 0,
          striker: 0,
          warden: 0,
          oracle: 0
        }
      }
    };
  }

  function loadSave() {
    const base = createDefaultSave();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { save: base, ok: true };
      }
      const parsed = JSON.parse(raw);
      const merged = deepMerge(base, parsed);
      merged.version = SAVE_VERSION;
      return { save: merged, ok: true };
    } catch (error) {
      return { save: base, ok: false };
    }
  }

  function saveToStorage(save) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
      return true;
    } catch (error) {
      return false;
    }
  }

  function getUpgradeLevel(save, upgradeId) {
    return save.upgradeLevels[upgradeId] || 0;
  }

  function getUpgradeCost(upgrade, level) {
    return upgrade.costs[level];
  }

  function formatCost(cost) {
    const chunks = [];
    if (cost.scrap) {
      chunks.push(`${cost.scrap} Scrap`);
    }
    if (cost.cores) {
      chunks.push(`${cost.cores} Cores`);
    }
    if (cost.renown) {
      chunks.push(`${cost.renown} Renown`);
    }
    return chunks.join(" / ");
  }

  function canAfford(save, cost) {
    return (save.currencies.scrap >= (cost.scrap || 0))
      && (save.currencies.cores >= (cost.cores || 0))
      && (save.currencies.renown >= (cost.renown || 0));
  }

  function payCost(save, cost) {
    save.currencies.scrap -= cost.scrap || 0;
    save.currencies.cores -= cost.cores || 0;
    save.currencies.renown -= cost.renown || 0;
  }

  function addReward(save, reward) {
    save.currencies.scrap += reward.scrap || 0;
    save.currencies.cores += reward.cores || 0;
    save.currencies.renown += reward.renown || 0;
  }

  function getUnlockedZoneOrder(save) {
    return Object.keys(ZONE_DATA).filter((zoneId) => save.unlockedZones.includes(zoneId));
  }

  function getAchievementState(save, achievement) {
    const profile = save.profile;
    switch (achievement.id) {
      case "firstContract":
        return { current: profile.contractsWon, target: 1 };
      case "salvageVeteran":
        return { current: profile.contractsWon, target: 15 };
      case "scrapBaron":
        return { current: profile.lifetimeScrap, target: 5000 };
      case "bossHunter":
        return { current: profile.bossesKilled, target: 20 };
      case "threatBreaker":
        return { current: profile.highestThreat, target: 5 };
      case "horizonBreaker":
        return { current: profile.highestLevel, target: 15 };
      case "killbox":
        return { current: profile.bestRunKills, target: 300 };
      case "comboEngine":
        return { current: profile.bestCombo, target: 40 };
      case "perfectHunt":
        return { current: profile.flawlessBosses, target: 1 };
      case "fullRoster":
        return { current: save.unlockedClasses.length, target: Object.keys(CLASS_DATA).length };
      case "chartedFrontier":
        return { current: save.unlockedZones.length, target: Object.keys(ZONE_DATA).length };
      case "foundryForeman":
        return { current: profile.upgradesPurchased, target: 20 };
      case "fourfoldAce": {
        const current = Object.values(profile.classVictories).filter((value) => value > 0).length;
        return { current, target: Object.keys(CLASS_DATA).length };
      }
      case "coreTycoon":
        return { current: profile.lifetimeCores, target: 120 };
      case "enduringLight":
        return { current: profile.longestRun, target: 1500 };
      default:
        return { current: 0, target: 1 };
    }
  }

  function isAchievementUnlocked(save, achievement) {
    if (save.achievements[achievement.id]) {
      return true;
    }
    const state = getAchievementState(save, achievement);
    return state.current >= state.target;
  }

  function upgradePlayerStatsFromMeta(save, stats) {
    stats.damage *= 1 + getUpgradeLevel(save, "forgeDamage") * 0.06;
    stats.maxHealth += getUpgradeLevel(save, "reinforcedHull") * 12;
    stats.maxShield += getUpgradeLevel(save, "capacitorBank") * 10;
    stats.moveSpeed *= 1 + getUpgradeLevel(save, "burstThrusters") * 0.03;
    stats.dashCooldown *= 1 - getUpgradeLevel(save, "cooldownMesh") * 0.06;
    stats.abilityCooldown *= 1 - getUpgradeLevel(save, "abilityMatrix") * 0.06;
    stats.scrapGain *= 1 + getUpgradeLevel(save, "salvageRigs") * 0.08;
    stats.xpGain *= 1 + getUpgradeLevel(save, "archiveDecoder") * 0.08;
    stats.armor += getUpgradeLevel(save, "reactivePlating") * 3;
    stats.bossDamageMultiplier *= 1 + getUpgradeLevel(save, "bountyTargeting") * 0.07;
    stats.critChance += getUpgradeLevel(save, "precisionSuite") * 0.02;
  }

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
      radius: 24,
      width: 34,
      length: 62,
      hp: vehicleMaxHp,
      maxHp: vehicleMaxHp,
      armor: vehicleArmor,
      alive: true,
      deployed,
      secured: false,
      flash: 0,
      routeProgress: 0,
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
      game.pushNotification("Convoy Vehicle Lost", "A transport truck has been destroyed.", "warn");
    }
    updateEscortIntegrity(run);
    if (run.objective.type === "escort" && run.objective.lossPercent >= run.objective.allowedLossPercent) {
      game.failRun(`Convoy losses reached ${Math.round(run.objective.lossPercent)}% and breached the contract cap.`);
    }
  }

  function getTowerDeployCost(run) {
    return run.towerBaseCost + run.stats.towersBuilt * run.towerCostIncrement;
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
    if (!run || run.stats.towersBuilt >= run.towerLimit) {
      game.pushNotification("Tower Limit Reached", `No more than ${run.towerLimit} towers can be deployed this run.`, "warn");
      return;
    }
    const cost = getTowerDeployCost(run);
    if (run.rewards.scrap < cost) {
      game.pushNotification("Insufficient Scrap", `Defense tower deployment costs ${cost} Scrap.`, "warn");
      return;
    }
    const desiredPoint = getClampedPointerTarget(run, 210);
    const point = findTowerPlacementPoint(run, desiredPoint.x, desiredPoint.y);
    if (!point) {
      game.pushNotification("Deployment Blocked", "Move the cursor to a clear area near your ship.", "warn");
      return;
    }
    run.rewards.scrap -= cost;
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
        run.extraction.progress += dt;
        if (run.extraction.progress >= 1.6) {
          game.completeRun(true, "Extraction complete.");
        }
      } else {
        run.extraction.progress = Math.max(0, run.extraction.progress - dt * 1.5);
      }
    }

    run.camera.x = lerp(run.camera.x, run.player.x, 0.11);
    run.camera.y = lerp(run.camera.y, run.player.y, 0.11);

    if (run.pendingLevelUps > 0 && !game.activeModal) {
      game.openLevelUp();
    }
  }

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
      : `Loss cap ${objective.allowedLossPercent}% • ${objective.survivors}/${objective.convoy.length} convoy units remaining.`;
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
    ctx.fillText(`Zone: ${run.zone.name}  •  Threat ${romanThreat(run.contract.threat)}`, game.width / 2, y + 72);
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

  const game = {
    canvas: null,
    ctx: null,
    ui: {},
    screens: {},
    notifications: [],
    stars: [],
    width: 0,
    height: 0,
    dpr: 1,
    mode: "menu",
    activeModal: null,
    modalReturnTo: null,
    save: null,
    storageReady: true,
    run: null,
    contracts: [],
    pointer: {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      down: false
    },
    keys: {},
    time: 0,
    delta: 0.016,
    lastTime: 0,
    screenShake: 0,
    audioContext: null,
    audioMixer: null,
    musicState: null,
    audioSettingsKey: "",

    init() {
      for (const id of UI_IDS) {
        this.ui[id] = el(id);
      }
      this.canvas = this.ui.gameCanvas;
      this.ctx = this.canvas.getContext("2d");
      this.screens = {
        menu: el("screen-menu"),
        hub: el("screen-hub"),
        talents: el("screen-talents"),
        levelup: el("screen-levelup"),
        pause: el("screen-pause"),
        summary: el("screen-summary"),
        options: el("screen-options"),
        help: el("screen-help")
      };
      const loaded = loadSave();
      this.save = loaded.save;
      this.storageReady = loaded.ok;
      this.seedStars();
      this.bindEvents();
      this.resize();
      this.updateContinueButton();
      this.renderHub();
      this.setMode("menu");
      if (!this.storageReady) {
        this.pushNotification("Storage Warning", "Save data could not be loaded. Progress will be kept in-memory until storage becomes available.", "warn");
      }
      requestAnimationFrame(this.frame.bind(this));
    },

    seedStars() {
      this.stars = [];
      for (let index = 0; index < 160; index += 1) {
        this.stars.push({
          x: Math.random(),
          y: Math.random(),
          size: Math.random() * 1.9 + 0.2,
          twinkle: Math.random() * 2.5 + 0.7,
          speed: Math.random() * 0.18 + 0.02,
          wander: Math.random() * 16,
          drift: Math.random() * 0.08 + 0.01,
          phase: Math.random() * TWO_PI,
          color: Math.random() > 0.72 ? "#9fe4ff" : "#ffffff"
        });
      }
    },

    bindEvents() {
      window.addEventListener("resize", () => this.resize());
      window.addEventListener("beforeunload", () => this.saveGame());
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.mode === "mission" && !this.activeModal) {
          this.openPause();
        }
      });

      this.canvas.addEventListener("mousemove", (event) => {
        const rect = this.canvas.getBoundingClientRect();
        this.pointer.x = event.clientX - rect.left;
        this.pointer.y = event.clientY - rect.top;
      });
      this.canvas.addEventListener("mousedown", (event) => {
        if (event.button === 0) {
          this.pointer.down = true;
          this.primeAudio();
        }
      });
      window.addEventListener("mouseup", (event) => {
        if (event.button === 0) {
          this.pointer.down = false;
        }
      });
      this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

      window.addEventListener("keydown", (event) => {
        this.primeAudio();
        if (["ShiftLeft", "ShiftRight", "KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "KeyR", "KeyF", "KeyT", "KeyC", "Escape"].includes(event.code)) {
          event.preventDefault();
        }
        if (event.repeat && ["ShiftLeft", "ShiftRight", "KeyQ", "KeyE", "KeyR", "KeyF", "KeyT", "Escape", "KeyC"].includes(event.code)) {
          return;
        }
        this.keys[event.code] = true;
        if (this.mode === "mission") {
          if (!this.activeModal && (event.code === "ShiftLeft" || event.code === "ShiftRight")) {
            tryDash(this.run);
          }
          if (!this.activeModal && event.code === "KeyQ") {
            useAbilitySlot(this.run, "q");
          }
          if (!this.activeModal && event.code === "KeyE") {
            useAbilitySlot(this.run, "e");
          }
          if (!this.activeModal && event.code === "KeyR") {
            useAbilitySlot(this.run, "r");
          }
          if (!this.activeModal && event.code === "KeyF") {
            useAbilitySlot(this.run, "t");
          }
          if (!this.activeModal && event.code === "KeyT") {
            deployDefenseTower(this.run);
          }
          if (!this.activeModal && event.code === "KeyC") {
            this.run.player.autoFire = !this.run.player.autoFire;
            this.pushNotification("Auto-Fire", this.run.player.autoFire ? "Auto-fire enabled." : "Auto-fire disabled.", "success");
          }
        }
        if (event.code === "Escape") {
          this.handleEscape();
        }
      });

      window.addEventListener("keyup", (event) => {
        this.keys[event.code] = false;
      });

      document.body.addEventListener("click", (event) => {
        this.primeAudio();
        const actionElement = event.target.closest("[data-action]");
        if (actionElement) {
          this.handleAction(actionElement.dataset.action);
          return;
        }
        const classSelect = event.target.closest("[data-select-class]");
        if (classSelect) {
          this.selectClass(classSelect.dataset.selectClass);
          return;
        }
        const classBuy = event.target.closest("[data-buy-class]");
        if (classBuy) {
          this.buyClass(classBuy.dataset.buyClass);
          return;
        }
        const zoneBuy = event.target.closest("[data-buy-zone]");
        if (zoneBuy) {
          this.buyZone(zoneBuy.dataset.buyZone);
          return;
        }
        const upgradeBuy = event.target.closest("[data-buy-upgrade]");
        if (upgradeBuy) {
          this.buyUpgrade(upgradeBuy.dataset.buyUpgrade);
          return;
        }
        const contractStart = event.target.closest("[data-start-contract]");
        if (contractStart) {
          this.startContract(contractStart.dataset.startContract);
          return;
        }
        const relicChoice = event.target.closest("[data-relic-choice]");
        if (relicChoice) {
          this.chooseRelic(relicChoice.dataset.relicChoice);
          return;
        }
        const archiveChoice = event.target.closest("[data-archive-relic]");
        if (archiveChoice) {
          this.archiveRelicChoice(archiveChoice.dataset.archiveRelic);
        }
      });
    },

    primeAudio() {
      if (this.audioContext) {
        this.resumeAudioContext();
        this.syncAudioMix();
        return;
      }
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) {
        return;
      }
      try {
        this.audioContext = new AudioCtor();
        this.setupAudioMixer();
        this.resumeAudioContext();
        this.syncAudioMix(true);
      } catch (error) {
        this.audioContext = null;
        this.audioMixer = null;
        this.musicState = null;
      }
    },

    resumeAudioContext() {
      if (this.audioContext && this.audioContext.state === "suspended") {
        this.audioContext.resume().catch(() => {});
      }
    },

    setupAudioMixer() {
      if (!this.audioContext || this.audioMixer) {
        return;
      }
      const masterGain = this.audioContext.createGain();
      const sfxGain = this.audioContext.createGain();
      const musicGain = this.audioContext.createGain();
      const musicFilter = this.audioContext.createBiquadFilter();
      musicFilter.type = "lowpass";
      musicFilter.frequency.value = 2600;
      musicFilter.Q.value = 0.6;
      sfxGain.connect(masterGain);
      musicGain.connect(musicFilter);
      musicFilter.connect(masterGain);
      masterGain.connect(this.audioContext.destination);
      this.audioMixer = {
        masterGain,
        sfxGain,
        musicGain,
        musicFilter
      };
      this.audioSettingsKey = "";
      this.musicState = null;
    },

    syncAudioMix(force = false) {
      if (!this.audioContext || !this.audioMixer || !this.save) {
        return;
      }
      const options = this.save.options || {};
      const key = [
        options.muteAudio ? 1 : 0,
        options.masterVolume,
        options.sfxVolume,
        options.musicVolume
      ].join("|");
      if (!force && key === this.audioSettingsKey) {
        return;
      }
      this.audioSettingsKey = key;
      const now = this.audioContext.currentTime;
      const masterLevel = options.muteAudio ? 0 : clamp((options.masterVolume ?? 45) / 100, 0, 1);
      const sfxLevel = clamp((options.sfxVolume ?? 78) / 100, 0, 1);
      const musicLevel = clamp((options.musicVolume ?? 52) / 100, 0, 1);
      this.audioMixer.masterGain.gain.cancelScheduledValues(now);
      this.audioMixer.sfxGain.gain.cancelScheduledValues(now);
      this.audioMixer.musicGain.gain.cancelScheduledValues(now);
      this.audioMixer.masterGain.gain.setTargetAtTime(masterLevel, now, 0.05);
      this.audioMixer.sfxGain.gain.setTargetAtTime(sfxLevel, now, 0.05);
      this.audioMixer.musicGain.gain.setTargetAtTime(musicLevel, now, 0.08);
    },

    playTone(frequency, duration, type, volume, when = null, bus = "sfx", attack = 0.01, release = 0.08) {
      if (!this.audioContext || !this.audioMixer || frequency <= 0 || duration <= 0 || volume <= 0) {
        return;
      }
      const options = this.save.options || {};
      if (options.muteAudio || options.masterVolume <= 0) {
        return;
      }
      if (bus === "music" && (options.musicVolume ?? 52) <= 0) {
        return;
      }
      if (bus !== "music" && (options.sfxVolume ?? 78) <= 0) {
        return;
      }
      if (this.audioContext.state !== "running") {
        return;
      }
      const targetBus = bus === "music" ? this.audioMixer.musicGain : this.audioMixer.sfxGain;
      const startAt = Math.max(this.audioContext.currentTime, when ?? this.audioContext.currentTime);
      const stopAt = startAt + Math.max(0.04, duration);
      const peakAt = startAt + Math.max(0.005, Math.min(attack, duration * 0.35));
      const releaseStart = Math.max(peakAt, stopAt - Math.max(0.02, Math.min(release, duration * 0.65)));
      const gain = this.audioContext.createGain();
      const oscillator = this.audioContext.createOscillator();
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), peakAt);
      gain.gain.setValueAtTime(Math.max(0.0001, volume), releaseStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
      oscillator.connect(gain);
      gain.connect(targetBus);
      oscillator.start(startAt);
      oscillator.stop(stopAt + 0.03);
    },

    playChord(notes, when, duration, type, volume, attack, release) {
      for (const note of notes) {
        this.playTone(midiToHz(note), duration, type, volume, when, "music", attack, release);
      }
    },

    getActiveMusicProfile() {
      if (this.activeModal === "summary") {
        return MUSIC_PROFILES.hub;
      }
      if (this.mode === "mission" && this.run) {
        if (this.run.boss?.alive) {
          return MUSIC_PROFILES.boss;
        }
        return (this.run.contract?.threat || 1) >= 4 ? MUSIC_PROFILES.missionHigh : MUSIC_PROFILES.missionLow;
      }
      if (this.mode === "talents") {
        return MUSIC_PROFILES.talents;
      }
      if (this.mode === "hub") {
        return MUSIC_PROFILES.hub;
      }
      return MUSIC_PROFILES.menu;
    },

    scheduleMusicStep(profile, when, step) {
      const stepDuration = 60 / profile.bpm / 2;
      const bar = profile.progression[Math.floor(step / 8) % profile.progression.length];
      const stepInBar = step % 8;
      const leadOffset = bar.arp[stepInBar % bar.arp.length];
      if (stepInBar === 0) {
        this.playChord(
          bar.chord.map((interval) => profile.root + interval),
          when,
          stepDuration * 7.4,
          profile.padType,
          profile.padVolume,
          stepDuration * 0.8,
          stepDuration * 2.8
        );
      }
      if (stepInBar % 2 === 0) {
        this.playTone(
          midiToHz(profile.root + bar.bass),
          stepDuration * 1.85,
          profile.bassType,
          profile.bassVolume * (stepInBar === 0 ? 1.1 : 0.95),
          when,
          "music",
          0.01,
          stepDuration * 0.55
        );
      }
      this.playTone(
        midiToHz(profile.root + leadOffset),
        stepDuration * 0.88,
        profile.leadType,
        profile.leadVolume * (stepInBar % 2 === 0 ? 1.05 : 0.84),
        when,
        "music",
        0.02,
        stepDuration * 0.3
      );
      if (stepInBar === 4) {
        this.playTone(
          midiToHz(profile.root + leadOffset + 12),
          stepDuration * 0.48,
          profile.leadType,
          profile.leadVolume * 0.42,
          when + stepDuration * 0.08,
          "music",
          0.015,
          stepDuration * 0.18
        );
      }
    },

    updateMusic() {
      if (!this.audioContext || !this.audioMixer || !this.save) {
        return;
      }
      this.syncAudioMix();
      const options = this.save.options || {};
      if (options.muteAudio || options.masterVolume <= 0 || (options.musicVolume ?? 52) <= 0) {
        return;
      }
      if (this.audioContext.state !== "running") {
        return;
      }
      const profile = this.getActiveMusicProfile();
      const now = this.audioContext.currentTime;
      const stepDuration = 60 / profile.bpm / 2;
      if (this.audioMixer.musicFilter) {
        const filterTarget = this.mode === "mission" ? 2100 : this.mode === "talents" ? 3200 : 2800;
        this.audioMixer.musicFilter.frequency.setTargetAtTime(filterTarget, now, 0.25);
      }
      if (!this.musicState || this.musicState.profileKey !== profile.key || this.musicState.nextNoteTime < now - stepDuration * 2) {
        this.musicState = {
          profileKey: profile.key,
          nextNoteTime: now + 0.05,
          step: 0
        };
      }
      while (this.musicState.nextNoteTime < now + 0.45) {
        this.scheduleMusicStep(profile, this.musicState.nextNoteTime, this.musicState.step);
        this.musicState.step += 1;
        this.musicState.nextNoteTime += stepDuration;
      }
    },

    playSfx(name) {
      switch (name) {
        case "shoot":
          this.playTone(290, 0.05, "square", 0.03);
          break;
        case "dash":
          this.playTone(560, 0.08, "sawtooth", 0.04);
          break;
        case "ability":
          this.playTone(420, 0.12, "triangle", 0.05);
          this.playTone(650, 0.08, "triangle", 0.025);
          break;
        case "hurt":
          this.playTone(160, 0.08, "square", 0.05);
          break;
        case "levelUp":
          this.playTone(520, 0.09, "triangle", 0.05);
          this.playTone(780, 0.12, "triangle", 0.04);
          break;
        case "collect":
          this.playTone(700, 0.04, "triangle", 0.02);
          break;
        case "xp":
          this.playTone(860, 0.05, "triangle", 0.02);
          break;
        case "heal":
          this.playTone(540, 0.08, "sine", 0.03);
          break;
        case "surge":
          this.playTone(360, 0.08, "sawtooth", 0.045);
          this.playTone(620, 0.12, "triangle", 0.03);
          break;
        case "shieldBreak":
          this.playTone(240, 0.06, "square", 0.05);
          this.playTone(170, 0.12, "sawtooth", 0.03);
          break;
        case "bossSpawn":
          this.playTone(140, 0.18, "sawtooth", 0.06);
          break;
        case "bossDown":
          this.playTone(320, 0.14, "triangle", 0.06);
          this.playTone(220, 0.18, "triangle", 0.05);
          break;
        default:
          break;
      }
    },

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },

    frame(timestamp) {
      if (!this.lastTime) {
        this.lastTime = timestamp;
      }
      const rawDelta = (timestamp - this.lastTime) / 1000;
      this.delta = clamp(rawDelta, 0.001, 0.033);
      this.lastTime = timestamp;
      this.time += this.delta;
      this.screenShake = Math.max(0, this.screenShake - this.delta * 22);

      if (this.mode === "mission" && this.run && !this.activeModal) {
        updateMission(this.run, this.delta);
      }

      this.updateMusic();
      this.updateNotifications(this.delta);
      this.render();
      requestAnimationFrame(this.frame.bind(this));
    },

    render() {
      renderBackdrop(this.mode === "mission" ? "mission" : this.mode);
      if (this.mode === "mission" && this.run) {
        renderMission();
        this.updateHud();
      }
      if (this.mode !== "mission") {
        this.pointer.worldX = this.pointer.x;
        this.pointer.worldY = this.pointer.y;
      }
    },

    addScreenShake(amount) {
      this.screenShake = Math.max(this.screenShake, amount);
    },

    updateContinueButton() {
      this.ui.continueButton.disabled = !this.save.started;
    },

    saveGame() {
      if (!saveToStorage(this.save)) {
        this.storageReady = false;
      }
      this.updateContinueButton();
    },

    setMode(mode) {
      this.mode = mode;
      if (mode !== "mission") {
        this.run = mode === "hub" ? this.run : null;
      }
      this.refreshScreens();
    },

    refreshScreens() {
      for (const [key, screen] of Object.entries(this.screens)) {
        const active = (key === this.mode) || (this.activeModal === key);
        screen.classList.toggle("active", active);
      }
      this.ui.hud.classList.toggle("hidden", !(this.mode === "mission" && this.activeModal !== "summary"));
    },

    openModal(modal, returnTo = null) {
      this.activeModal = modal;
      this.modalReturnTo = returnTo;
      this.refreshScreens();
    },

    closeModal() {
      if (this.modalReturnTo) {
        this.activeModal = this.modalReturnTo;
        this.modalReturnTo = null;
      } else {
        this.activeModal = null;
      }
      this.refreshScreens();
    },

    openPause() {
      if (this.mode === "mission") {
        this.openModal("pause");
      }
    },

    handleEscape() {
      if (this.activeModal === "summary") {
        return;
      }
      if (this.activeModal === "options" || this.activeModal === "help") {
        this.closeModal();
        return;
      }
      if (this.activeModal === "pause") {
        this.activeModal = null;
        this.refreshScreens();
        return;
      }
      if (this.activeModal === "levelup") {
        return;
      }
      if (this.mode === "talents") {
        this.showHub();
        return;
      }
      if (this.mode === "mission") {
        this.openPause();
      }
    },

    handleAction(action) {
      switch (action) {
        case "new-game":
          this.startNewCampaign();
          break;
        case "continue-game":
          if (this.save.started) {
            this.showHub();
          }
          break;
        case "open-help":
          this.openModal("help", this.activeModal === "pause" ? "pause" : null);
          break;
        case "open-options":
          this.loadOptionsIntoInputs();
          this.openModal("options", this.activeModal === "pause" ? "pause" : null);
          break;
        case "save-options":
          this.saveOptionsFromInputs();
          this.closeModal();
          break;
        case "close-modal":
          this.closeModal();
          break;
        case "refresh-contracts":
          this.generateContracts();
          break;
        case "open-talents":
          this.showTalents();
          break;
        case "return-menu":
          this.activeModal = null;
          this.mode = "menu";
          this.refreshScreens();
          break;
        case "resume-game":
          this.activeModal = null;
          this.refreshScreens();
          break;
        case "abandon-run":
          if (window.confirm("Abandon the current contract?")) {
            this.completeRun(false, "Contract abandoned.");
          }
          break;
        case "return-hub":
          this.showHub();
          break;
        case "start-same-class":
          this.quickRestart();
          break;
        default:
          break;
      }
    },

    loadOptionsIntoInputs() {
      this.ui.optionMuteAudio.checked = this.save.options.muteAudio;
      this.ui.optionMasterVolume.value = this.save.options.masterVolume;
      this.ui.optionSfxVolume.value = this.save.options.sfxVolume;
      this.ui.optionMusicVolume.value = this.save.options.musicVolume;
      this.ui.optionScreenShake.value = this.save.options.screenShake;
      this.ui.optionParticles.checked = this.save.options.particles;
      this.ui.optionDefaultAutoFire.checked = this.save.options.defaultAutoFire;
    },

    saveOptionsFromInputs() {
      this.save.options.muteAudio = this.ui.optionMuteAudio.checked;
      this.save.options.masterVolume = Number(this.ui.optionMasterVolume.value);
      this.save.options.sfxVolume = Number(this.ui.optionSfxVolume.value);
      this.save.options.musicVolume = Number(this.ui.optionMusicVolume.value);
      this.save.options.screenShake = Number(this.ui.optionScreenShake.value);
      this.save.options.particles = this.ui.optionParticles.checked;
      this.save.options.defaultAutoFire = this.ui.optionDefaultAutoFire.checked;
      this.syncAudioMix(true);
      this.saveGame();
      this.playSfx("collect");
      this.pushNotification("Options Saved", "Audio and combat interface preferences updated.", "success");
    },

    pushNotification(title, text, type = "") {
      this.notifications.push({
        id: makeId(),
        title,
        text,
        type,
        life: 4.2
      });
      this.renderNotifications();
    },

    updateNotifications(dt) {
      let changed = false;
      for (const item of this.notifications) {
        item.life -= dt;
      }
      const filtered = this.notifications.filter((item) => item.life > 0);
      if (filtered.length !== this.notifications.length) {
        changed = true;
      }
      this.notifications = filtered;
      if (changed) {
        this.renderNotifications();
      }
    },

    renderNotifications() {
      this.ui.notificationStack.innerHTML = this.notifications.map((item) => `
        <div class="notification ${item.type}">
          <strong>${item.title}</strong>
          <div>${item.text}</div>
        </div>
      `).join("");
    },

    startNewCampaign() {
      if (this.save.started && !window.confirm("Start a new campaign? Existing progress will be overwritten.")) {
        return;
      }
      this.save = createDefaultSave();
      this.save.started = true;
      this.run = null;
      this.activeModal = null;
      this.generateContracts();
      this.renderHub();
      this.showHub();
      this.pushNotification("New Campaign", "Haven Port command is online.", "success");
      this.saveGame();
    },

    showHub() {
      if (!this.save.started) {
        this.save.started = true;
      }
      if (!this.contracts.length) {
        this.generateContracts();
      }
      this.mode = "hub";
      this.activeModal = null;
      this.modalReturnTo = null;
      this.run = null;
      this.renderHub();
      this.refreshScreens();
      this.saveGame();
    },

    showTalents() {
      if (!this.save.started) {
        this.save.started = true;
      }
      if (!this.contracts.length) {
        this.generateContracts();
      }
      this.mode = "talents";
      this.activeModal = null;
      this.modalReturnTo = null;
      this.run = null;
      this.renderHub();
      this.refreshScreens();
      this.saveGame();
    },

    renderHub() {
      this.ui.metaScrapText.textContent = this.save.currencies.scrap;
      this.ui.metaCoreText.textContent = this.save.currencies.cores;
      this.ui.metaRenownText.textContent = this.save.currencies.renown;
      const selectedClass = CLASS_DATA[this.save.selectedClass];
      this.ui.profileSummary.textContent = `${selectedClass.name} licensed. ${this.save.profile.contractsWon} victories, best threat ${romanThreat(this.save.profile.highestThreat)}, ${this.save.profile.bossesKilled} bosses destroyed, ${this.save.relicArchive.relics.length}/${this.save.relicArchive.capacity} echo slots filled.`;
      this.renderMenuUI();
      this.renderClasses();
      this.renderZones();
      this.renderUpgrades();
      this.renderArchive();
      this.renderContracts();
      this.renderAchievements();
      this.updateContinueButton();
    },

    renderMenuUI() {
      const selectedClass = CLASS_DATA[this.save.selectedClass];
      this.ui.menuStatusRow.innerHTML = `
        <div class="resource-pill">Victories <strong>${this.save.profile.contractsWon}</strong></div>
        <div class="resource-pill">Best Threat <strong>${romanThreat(this.save.profile.highestThreat)}</strong></div>
        <div class="resource-pill">Echoes <strong>${this.save.relicArchive.relics.length}/${this.save.relicArchive.capacity}</strong></div>
        <div class="resource-pill">Unlocked Ships <strong>${this.save.unlockedClasses.length}</strong></div>
      `;
      this.ui.menuShipShowcase.innerHTML = `
        <div class="hero-title">Selected Ship</div>
        <div class="ship-card-head">
          ${getShipPreviewSvg(selectedClass.id)}
          <div class="ship-meta">
            <strong>${selectedClass.name}</strong>
            <div class="muted">${selectedClass.frameName} • ${selectedClass.manufacturer}</div>
            <p>${selectedClass.signature}</p>
          </div>
        </div>
        <div class="tag-row">
          <span class="tag success">${selectedClass.role}</span>
          <span class="tag">Hull ${selectedClass.baseStats.maxHealth}</span>
          <span class="tag">Shield ${selectedClass.baseStats.maxShield}</span>
          <span class="tag">Speed ${Math.round(selectedClass.baseStats.moveSpeed)}</span>
        </div>
      `;
      this.ui.menuProgressShowcase.innerHTML = `
        <div class="hero-title">Campaign Status</div>
        <p>Haven Port is holding with <strong>${this.save.currencies.scrap}</strong> Scrap, <strong>${this.save.currencies.cores}</strong> Core Shards, and <strong>${this.save.profile.bossesKilled}</strong> bosses destroyed.</p>
        <div class="tag-row">
          <span class="tag warn">Zones ${this.save.unlockedZones.length}/${Object.keys(ZONE_DATA).length}</span>
          <span class="tag">Upgrades ${Object.values(this.save.upgradeLevels).reduce((sum, value) => sum + value, 0)}</span>
          <span class="tag">Renown ${this.save.currencies.renown}</span>
        </div>
      `;
    },

    renderClasses() {
      this.ui.classList.innerHTML = Object.values(CLASS_DATA).map((classData) => {
        const unlocked = this.save.unlockedClasses.includes(classData.id);
        const selected = this.save.selectedClass === classData.id;
        const canBuy = canAfford(this.save, classData.unlockCost);
        return `
          <div class="class-card ${selected ? "selected" : ""}">
            <div class="selection-footer">
              <strong>${classData.name}</strong>
              <span class="tag">${classData.role}</span>
            </div>
            <div class="ship-card-head">
              ${getShipPreviewSvg(classData.id)}
              <div class="ship-meta">
                <div class="muted">${classData.frameName}</div>
                <div class="muted">${classData.manufacturer}</div>
              </div>
            </div>
            <p>${classData.desc}</p>
            <div class="stat-grid">
              <span>Health</span><strong>${classData.baseStats.maxHealth}</strong>
              <span>Shield</span><strong>${classData.baseStats.maxShield}</strong>
              <span>Damage</span><strong>${classData.baseStats.damage}</strong>
              <span>Speed</span><strong>${Math.round(classData.baseStats.moveSpeed)}</strong>
            </div>
            <div class="tag-row">
              ${ABILITY_SLOT_ORDER.map((slot) => `<span class="tag ${slot === "q" ? "success" : ""}">${ABILITY_SLOT_META[slot].key}: ${CLASS_ABILITY_KITS[classData.id][slot].name}</span>`).join("")}
            </div>
            <div class="selection-footer">
              <span class="muted">${classData.signature}</span>
              ${unlocked
                ? `<button ${selected ? "disabled" : ""} data-select-class="${classData.id}">${selected ? "Selected" : "Select"}</button>`
                : `<button ${canBuy ? "" : "disabled"} data-buy-class="${classData.id}">Unlock ${formatCost(classData.unlockCost)}</button>`}
            </div>
          </div>
        `;
      }).join("");
    },

    renderZones() {
      this.ui.zoneList.innerHTML = Object.values(ZONE_DATA).map((zone) => {
        const unlocked = this.save.unlockedZones.includes(zone.id);
        const canBuy = canAfford(this.save, zone.unlockCost);
        const prerequisiteMet =
          zone.id === "scrapSea"
          || (zone.id === "emberReach" && this.save.unlockedZones.includes("scrapSea"))
          || (zone.id === "nullReef" && this.save.unlockedZones.includes("emberReach"))
          || (zone.id === "blackVault" && this.save.unlockedZones.includes("nullReef"));
        return `
          <div class="zone-card ${unlocked ? "selected" : ""}">
            <div class="selection-footer">
              <strong>${zone.name}</strong>
              <span class="tag">${BOSS_DATA[zone.bossId].name}</span>
            </div>
            <p>${zone.desc}</p>
            <div class="tag-row">
              <span class="tag">${formatPercent(zone.rewardFactor)}</span>
            </div>
            <div class="selection-footer">
              <span class="muted">${unlocked ? "Cleared for deployment." : prerequisiteMet ? `Unlock for ${formatCost(zone.unlockCost)}.` : "Unlock earlier sectors first."}</span>
              ${unlocked
                ? `<button disabled>Unlocked</button>`
                : `<button ${(canBuy && prerequisiteMet) ? "" : "disabled"} data-buy-zone="${zone.id}">Unlock</button>`}
            </div>
          </div>
        `;
      }).join("");
    },

    renderUpgrades() {
      const totalRanks = getTotalUpgradeRanks(this.save);
      const maxRanks = getMaxUpgradeRanks();
      const branchStates = UPGRADE_BRANCHES.map((branch) => getUpgradeBranchState(this.save, branch));
      const trainedBranches = branchStates.filter((state) => state.points > 0).length;
      const maxedNodes = branchStates.reduce((sum, state) => sum + state.maxedNodes, 0);
      const focusBranch = branchStates.reduce((best, state) => (state.points > best.points ? state : best), branchStates[0]);
      const totalFill = (totalRanks / Math.max(1, maxRanks)) * 100;

      this.ui.upgradeList.innerHTML = `
        <div class="spec-overview">
          <div class="spec-hero-card">
            <div class="spec-total-ring" style="--fill:${totalFill}%">
              <strong>${totalRanks}</strong>
              <span>/ ${maxRanks}</span>
            </div>
            <div class="spec-hero-copy">
              <div class="hero-title">Current Spec</div>
              <strong>${trainedBranches > 0 ? `${focusBranch.branch.name} Focus` : "Unspent Potential"}</strong>
              <div class="archive-note">
                ${trainedBranches > 0
                  ? `${focusBranch.points}/${focusBranch.maxPoints} ranks sit in ${focusBranch.branch.name}. Open the full tree to train more nodes side by side.`
                  : "No permanent talent ranks trained yet. Open the full tree to start shaping your long-term build."}
              </div>
              <div class="tag-row">
                <span class="tag">Branches ${trainedBranches}/${UPGRADE_BRANCHES.length}</span>
                <span class="tag success">Maxed Nodes ${maxedNodes}/${PERMANENT_UPGRADES.length}</span>
              </div>
            </div>
            <button data-action="open-talents">Open Talent Tree</button>
          </div>
          <div class="spec-branch-grid">
            ${branchStates.map((state) => `
              <div class="spec-branch-card" style="--branch-color:${state.branch.color}">
                <div class="spec-branch-head">
                  <strong>${state.branch.name}</strong>
                  <span class="tag">${state.points}/${state.maxPoints}</span>
                </div>
                <div class="spec-bar-shell">
                  <div class="spec-bar-fill" style="width:${state.completion * 100}%"></div>
                </div>
                <div class="archive-note">${state.branch.desc}</div>
                <div class="spec-node-stack">
                  ${state.nodes.map((node) => `
                    <div class="spec-node-line ${node.level > 0 ? "active" : ""}">
                      <span>${node.upgrade.name}</span>
                      <div class="spec-node-bar">
                        <div class="spec-node-bar-fill" style="width:${node.fillPercent}%"></div>
                      </div>
                      <strong>${node.level}/${node.upgrade.maxLevel}</strong>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;

      this.ui.talentStatusRow.innerHTML = `
        <div class="resource-pill">Trained Ranks <strong>${totalRanks}/${maxRanks}</strong></div>
        <div class="resource-pill">Scrap <strong>${this.save.currencies.scrap}</strong></div>
        <div class="resource-pill">Core Shards <strong>${this.save.currencies.cores}</strong></div>
        <div class="resource-pill">Maxed Nodes <strong>${maxedNodes}/${PERMANENT_UPGRADES.length}</strong></div>
      `;

      this.ui.talentTreeView.innerHTML = `
        <div class="talent-tree-grid">
          ${branchStates.map((state) => `
            <div class="talent-branch-card" style="--branch-color:${state.branch.color}">
              <div class="talent-branch-head">
                <div>
                  <div class="subpanel-title">${state.branch.name}</div>
                  <strong>${state.points}/${state.maxPoints} ranks trained</strong>
                </div>
                <span class="tag">${Math.round(state.completion * 100)}%</span>
              </div>
              <div class="archive-note">${state.branch.desc}</div>
              <div class="spec-bar-shell talent-branch-shell">
                <div class="spec-bar-fill" style="width:${state.completion * 100}%"></div>
              </div>
              <div class="skill-branch-track talent-branch-track">
                ${state.nodes.map((node, index) => `
                  <div class="skill-node talent-node ${node.level > 0 ? "active" : ""} ${node.atMax ? "maxed" : ""} ${!node.unlocked ? "locked" : ""}">
                    ${index < state.nodes.length - 1 ? `<div class="skill-link"></div>` : ""}
                    <div class="skill-node-top">
                      <strong>${node.upgrade.name}</strong>
                      <span class="tag">${node.level}/${node.upgrade.maxLevel}</span>
                    </div>
                    <p>${node.upgrade.desc}</p>
                    <div class="talent-node-meter">
                      <div class="talent-node-meter-fill" style="width:${node.fillPercent}%"></div>
                    </div>
                    <div class="archive-note">${node.upgrade.currentText(node.level)}</div>
                    <div class="selection-footer">
                      <span class="muted">${!node.unlocked ? `Requires ${UPGRADE_MAP[state.branch.upgrades[index - 1]].name}` : node.atMax ? "Node complete" : formatCost(node.cost)}</span>
                      ${node.atMax
                        ? `<button disabled>Maxed</button>`
                        : `<button ${(node.unlocked && canAfford(this.save, node.cost)) ? "" : "disabled"} data-buy-upgrade="${node.upgrade.id}">Train</button>`}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      `;
    },

    renderArchive() {
      const archive = this.save.relicArchive;
      if (!archive.relics.length) {
        this.ui.archiveList.innerHTML = `
          <div class="archive-card">
            <strong><span>No Echoes Stored</span><span class="tag">0/${archive.capacity}</span></strong>
            <div class="archive-note">Win a contract and archive one relic from the run summary. Archived echoes automatically activate at the start of future deployments.</div>
          </div>
        `;
        return;
      }
      this.ui.archiveList.innerHTML = archive.relics
        .slice()
        .sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0))
        .map((entry) => `
          <div class="archive-card">
            <strong><span>${RELIC_MAP[entry.id].name}</span><span class="tag">${RARITY_TAG[RELIC_MAP[entry.id].rarity]}${entry.stacks > 1 ? ` x${entry.stacks}` : ""}</span></strong>
            <div class="archive-note">${RELIC_MAP[entry.id].desc}</div>
          </div>
        `).join("");
    },

    getMaxThreat() {
      return clamp(2 + Math.floor(this.save.currencies.renown / 150), 2, 5);
    },

    generateContracts() {
      const unlockedZones = getUnlockedZoneOrder(this.save);
      const rng = createRng(Date.now() ^ this.save.currencies.renown ^ (this.save.profile.contractsWon << 8));
      const maxThreat = this.getMaxThreat();
      const cards = [];
      const missionIds = Object.keys(MISSION_TYPES);
      const zoneQueue = unlockedZones.slice();
      while (cards.length < 6) {
        const zoneId = zoneQueue.length ? zoneQueue.shift() : rng.choice(unlockedZones);
        const missionType = rng.choice(missionIds);
        const threat = rng.int(1, maxThreat);
        const mutators = [];
        let mutatorCount = threat >= 5 ? 2 : threat >= 3 && rng.chance(0.72) ? 1 : threat >= 2 && rng.chance(0.45) ? 1 : 0;
        const mutatorPool = Object.keys(MUTATORS);
        while (mutatorCount > 0) {
          const pick = rng.choice(mutatorPool);
          if (!mutators.includes(pick)) {
            mutators.push(pick);
            mutatorCount -= 1;
          }
        }
        const zone = ZONE_DATA[zoneId];
        const allowedLossPercent = missionType === "escort"
          ? Math.max(30, Math.min(52, 48 - threat * 3 + rng.int(-4, 5)))
          : null;
        const rewardMultiplier = 1
          + (threat - 1) * 0.34
          + mutators.reduce((sum, id) => sum + MUTATORS[id].rewardBonus, 0)
          + (missionType === "escort" ? 0.08 : 0);
        cards.push({
          id: `contract-${cards.length}-${Date.now()}-${rng.int(1000, 9999)}`,
          zoneId,
          missionType,
          threat,
          mutators,
          allowedLossPercent,
          rewardScrap: Math.round((90 + threat * 38) * zone.rewardFactor * rewardMultiplier),
          rewardCores: Math.round((4 + threat * 2) * zone.rewardFactor + mutators.length * 1.6),
          rewardRenown: Math.round(16 + threat * 10 + mutators.length * 8),
          seed: rng.int(1, 2147483646)
        });
      }
      this.contracts = cards;
      this.renderContracts();
    },

    renderContracts() {
      this.ui.contractBoard.innerHTML = this.contracts.map((contract) => {
        const zone = ZONE_DATA[contract.zoneId];
        const mission = MISSION_TYPES[contract.missionType];
        const missionDescription = contract.missionType === "escort"
          ? `${mission.desc} Contract loss cap: ${contract.allowedLossPercent}%.`
          : mission.desc;
        return `
          <div class="contract-card">
            <div class="selection-footer">
              <strong>${zone.name}</strong>
              <span class="tag">${mission.name}</span>
            </div>
            <p>${missionDescription}</p>
            <div class="tag-row">
              <span class="tag warn">Threat ${romanThreat(contract.threat)}</span>
              <span class="tag">${BOSS_DATA[zone.bossId].name}</span>
              ${contract.missionType === "escort" ? `<span class="tag">Loss Cap ${contract.allowedLossPercent}%</span>` : ""}
              ${contract.mutators.map((id) => `<span class="tag">${MUTATORS[id].name}</span>`).join("")}
            </div>
            <div class="stat-grid">
              <span>Scrap</span><strong>${contract.rewardScrap}</strong>
              <span>Core Shards</span><strong>${contract.rewardCores}</strong>
              <span>Renown</span><strong>${contract.rewardRenown}</strong>
              <span>Zone</span><strong>${zone.name}</strong>
            </div>
            <div class="selection-footer">
              <span class="muted">${zone.desc}</span>
              <button class="primary" data-start-contract="${contract.id}">Deploy</button>
            </div>
          </div>
        `;
      }).join("");
    },

    renderAchievements() {
      this.ui.achievementList.innerHTML = ACHIEVEMENTS.map((achievement) => {
        const unlocked = Boolean(this.save.achievements[achievement.id]);
        const progress = getAchievementState(this.save, achievement);
        return `
          <div class="achievement-card">
            <div class="selection-footer">
              <strong>${achievement.name}</strong>
              <span class="tag ${unlocked ? "success" : ""}">${unlocked ? "Unlocked" : `${progress.current}/${progress.target}`}</span>
            </div>
            <p>${achievement.desc}</p>
            <div class="selection-footer">
              <span class="muted">Reward: ${formatCost(achievement.reward)}</span>
              <span class="muted">${unlocked ? "Claimed" : "Pending"}</span>
            </div>
          </div>
        `;
      }).join("");
    },

    buyUpgrade(upgradeId) {
      const upgrade = UPGRADE_MAP[upgradeId];
      if (!isUpgradeNodeUnlocked(this.save, upgradeId)) {
        this.pushNotification("Skill Path Locked", "Train the previous node in that branch first.", "warn");
        return;
      }
      const level = getUpgradeLevel(this.save, upgradeId);
      if (level >= upgrade.maxLevel) {
        return;
      }
      const cost = getUpgradeCost(upgrade, level);
      if (!canAfford(this.save, cost)) {
        return;
      }
      payCost(this.save, cost);
      this.save.upgradeLevels[upgradeId] = level + 1;
      this.save.profile.upgradesPurchased += 1;
      this.pushNotification("Foundry Upgrade", `${upgrade.name} improved to rank ${level + 1}.`, "success");
      this.checkAchievements();
      this.renderHub();
      this.saveGame();
    },

    buyClass(classId) {
      const classData = CLASS_DATA[classId];
      if (this.save.unlockedClasses.includes(classId)) {
        return;
      }
      if (!canAfford(this.save, classData.unlockCost)) {
        return;
      }
      payCost(this.save, classData.unlockCost);
      this.save.unlockedClasses.push(classId);
      this.pushNotification("Crew License Issued", `${classData.name} is now available.`, "success");
      this.checkAchievements();
      this.renderHub();
      this.saveGame();
    },

    buyZone(zoneId) {
      const zone = ZONE_DATA[zoneId];
      if (this.save.unlockedZones.includes(zoneId)) {
        return;
      }
      if (!canAfford(this.save, zone.unlockCost)) {
        return;
      }
      payCost(this.save, zone.unlockCost);
      this.save.unlockedZones.push(zoneId);
      this.generateContracts();
      this.pushNotification("Sector Clearance Approved", `${zone.name} is now live on the contract board.`, "success");
      this.checkAchievements();
      this.renderHub();
      this.saveGame();
    },

    selectClass(classId) {
      if (!this.save.unlockedClasses.includes(classId)) {
        return;
      }
      this.save.selectedClass = classId;
      this.renderHub();
      this.saveGame();
    },

    startContract(contractId) {
      let contract = this.contracts.find((item) => item.id === contractId);
      if (!contract && typeof contractId === "object") {
        contract = contractId;
      }
      if (!contract) {
        return;
      }
      this.run = createRun(contract);
      this.save.profile.totalRuns += 1;
      this.mode = "mission";
      this.activeModal = null;
      this.modalReturnTo = null;
      this.refreshScreens();
      this.ui.playerNameLabel.textContent = CLASS_DATA[this.save.selectedClass].name;
      this.ui.zoneLabel.textContent = ZONE_DATA[contract.zoneId].name;
      applyArchivedRelicsToRun(this.save, this.run);
      this.renderRelicStrip();
      this.updateHud();
      const deployText = contract.missionType === "defense"
        ? `${MISSION_TYPES[contract.missionType].name} in ${ZONE_DATA[contract.zoneId].name}. Protect the drill reactor from inside its defense ring.`
        : contract.missionType === "escort"
          ? `${MISSION_TYPES[contract.missionType].name} in ${ZONE_DATA[contract.zoneId].name}. Keep convoy losses below ${contract.allowedLossPercent}% while it crosses the center lane.`
        : `${MISSION_TYPES[contract.missionType].name} in ${ZONE_DATA[contract.zoneId].name}.`;
      this.pushNotification("Contract Deployed", deployText, "success");
      this.saveGame();
    },

    renderRelicStrip() {
      if (!this.run) {
        this.ui.relicStrip.innerHTML = "";
        return;
      }
      const relicEntries = this.run.player.relicOrder.map((relicId) => {
        const stack = this.run.player.relics[relicId];
        const echoTag = this.run.player.echoRelics[relicId] ? " Echo" : "";
        return `<span class="relic-pill">${RELIC_MAP[relicId].name}${echoTag}${stack > 1 ? ` x${stack}` : ""}</span>`;
      });
      const synergyEntries = this.run.player.synergyOrder.map((synergyId) => `<span class="relic-pill">Set: ${RELIC_SYNERGY_MAP[synergyId].name}</span>`);
      const entries = [...relicEntries, ...synergyEntries];
      this.ui.relicStrip.innerHTML = entries.length ? entries.join("") : `<span class="relic-pill">No relics yet</span>`;
    },

    updateHud() {
      if (!this.run) {
        return;
      }
      syncSpawnDirector(this.run, 0);
      const player = this.run.player;
      this.ui.healthBar.style.width = `${(player.hp / player.stats.maxHealth) * 100}%`;
      this.ui.shieldBar.style.width = `${(player.shield / Math.max(1, player.stats.maxShield)) * 100}%`;
      this.ui.healthText.textContent = `Health ${Math.round(player.hp)} / ${Math.round(player.stats.maxHealth)}`;
      this.ui.shieldText.textContent = `Shield ${Math.round(player.shield)} / ${Math.round(player.stats.maxShield)}`;
      this.ui.levelText.textContent = String(player.level);
      this.ui.xpBar.style.width = `${(player.xp / player.xpToNext) * 100}%`;
      this.ui.xpText.textContent = `${Math.round(player.xp)} / ${Math.round(player.xpToNext)}`;
      this.ui.timerText.textContent = formatTime(this.run.time);
      this.ui.threatText.textContent = `${romanThreat(this.run.contract.threat)} • G${this.run.spawnState.gameLevel}`;
      this.ui.runScrapText.textContent = String(this.run.rewards.scrap);
      this.ui.runCoreText.textContent = String(this.run.rewards.cores);
      const nextTowerCost = this.run.stats.towersBuilt >= this.run.towerLimit ? "-" : getTowerDeployCost(this.run);
      this.ui.streakText.textContent = `${this.run.stats.towersBuilt}/${this.run.towerLimit} • ${nextTowerCost}`;
      this.ui.dashCooldownBar.style.width = `${100 - (player.dashCooldownRemaining / player.stats.dashCooldown) * 100}%`;
      this.ui.dashLabel.textContent = player.dashCooldownRemaining > 0 ? `${player.dashCooldownRemaining.toFixed(1)}s` : "Ready";
      for (const slot of ABILITY_SLOT_ORDER) {
        const def = getAbilityDefinitionForClass(player.classId, slot);
        const keyName = slot === "t" ? "F" : ABILITY_SLOT_META[slot].key;
        const unlocked = isAbilityUnlocked(player, slot);
        const maxCooldown = getAbilityCooldownSeconds(player, slot);
        const current = player.abilityCooldowns[slot];
        this.ui[`ability${keyName}Name`].textContent = `${keyName} • ${def.name}`;
        this.ui[`ability${keyName}Bar`].style.width = unlocked
          ? `${100 - (current / Math.max(0.001, maxCooldown)) * 100}%`
          : "0%";
        this.ui[`ability${keyName}Label`].textContent = unlocked
          ? current > 0 ? `${current.toFixed(1)}s` : "Ready"
          : `Lvl ${def.unlockLevel}`;
      }
      this.ui.objectiveLabel.textContent = this.getObjectiveText();
    },

    getObjectiveText() {
      if (!this.run) {
        return "-";
      }
      if (this.run.extraction) {
        return "Reach extraction";
      }
      if (this.run.boss) {
        return `Eliminate ${this.run.boss.name}`;
      }
      if (this.run.objective.type === "salvage") {
        return `Secure caches ${this.run.objective.collected}/${this.run.objective.total}`;
      }
      if (this.run.objective.type === "hunt") {
        const remaining = this.run.enemies.filter((enemy) => enemy.alive && enemy.objectiveTarget).length;
        return `Lieutenants remaining ${remaining}`;
      }
      if (this.run.objective.type === "defense") {
        const reactor = this.run.objective.reactor;
        if (this.run.objective.complete) {
          return "Reactor secured. Eliminate the boss.";
        }
        return `Defend Reactor • Hull ${Math.round(reactor.hp)}/${Math.round(reactor.maxHp)} • Shield ${Math.round(reactor.shield)}/${Math.round(reactor.maxShield)}`;
      }
      if (this.run.objective.type === "escort") {
        const objective = this.run.objective;
        if (objective.complete) {
          return "Convoy secured. Eliminate the boss.";
        }
        return `Escort Convoy • Loss ${Math.round(objective.lossPercent)}/${objective.allowedLossPercent}% • Units ${objective.survivors}/${objective.convoy.length}`;
      }
      return "-";
    },

    openLevelUp() {
      if (!this.run || this.run.pendingLevelUps <= 0) {
        return;
      }
      this.run.pendingLevelUps -= 1;
      this.run.currentLevelChoices = rollRelicChoices(this.run);
      this.ui.levelUpChoices.innerHTML = this.run.currentLevelChoices.map((relic) => `
        <button class="choice-card" data-relic-choice="${relic.id}">
          <div class="selection-footer">
            <strong>${relic.name}</strong>
            <span class="tag">${RARITY_TAG[relic.rarity]}</span>
          </div>
          <p>${relic.desc}</p>
        </button>
      `).join("");
      this.openModal("levelup");
    },

    chooseRelic(relicId) {
      if (!this.run || this.activeModal !== "levelup") {
        return;
      }
      applyRelic(this.run, relicId);
      if (this.run.pendingLevelUps > 0) {
        this.openLevelUp();
      } else {
        this.activeModal = null;
        this.refreshScreens();
      }
    },

    renderSummaryArchiveChoices() {
      if (!this.run) {
        this.ui.summaryArchiveTitle.textContent = "Echo Archive";
        this.ui.summaryArchiveChoices.innerHTML = "";
        return;
      }
      if (!this.run.summaryVictory) {
        this.ui.summaryArchiveTitle.textContent = "Echo Archive Offline";
        this.ui.summaryArchiveChoices.innerHTML = `
          <div class="archive-card">
            <strong><span>No Relic Echo Preserved</span><span class="tag">Defeat</span></strong>
            <div class="archive-note">Only successful extractions can stabilize a relic into your persistent archive.</div>
          </div>
        `;
        return;
      }
      const candidates = this.run.archiveCandidates || [];
      if (!candidates.length) {
        this.ui.summaryArchiveTitle.textContent = "Echo Archive Idle";
        this.ui.summaryArchiveChoices.innerHTML = `
          <div class="archive-card">
            <strong><span>No Relics To Archive</span><span class="tag">Empty</span></strong>
            <div class="archive-note">Pick up relics during the run to bank one as a persistent echo on successful extraction.</div>
          </div>
        `;
        return;
      }
      if (this.run.archivedRelicSelected) {
        const relic = RELIC_MAP[this.run.archivedRelicSelected];
        this.ui.summaryArchiveTitle.textContent = "Echo Archived";
        this.ui.summaryArchiveChoices.innerHTML = `
          <div class="archive-card">
            <strong><span>${relic.name}</span><span class="tag success">Stored</span></strong>
            <div class="archive-note">${relic.desc}</div>
          </div>
        `;
        return;
      }
      this.ui.summaryArchiveTitle.textContent = "Archive One Relic Echo";
      this.ui.summaryArchiveChoices.innerHTML = candidates.map((candidate) => `
        <button class="choice-card" data-archive-relic="${candidate.id}">
          <div class="selection-footer">
            <strong>${RELIC_MAP[candidate.id].name}</strong>
            <span class="tag">${RARITY_TAG[candidate.rarity]}${candidate.stacks > 1 ? ` x${candidate.stacks}` : ""}</span>
          </div>
          <p>${RELIC_MAP[candidate.id].desc}</p>
        </button>
      `).join("");
    },

    archiveRelicChoice(relicId) {
      if (!this.run || !this.run.summaryVictory || this.run.archivedRelicSelected) {
        return;
      }
      const result = addRelicToArchive(this.save, relicId);
      this.run.archivedRelicSelected = relicId;
      this.renderSummaryArchiveChoices();
      this.renderHub();
      this.saveGame();
      if (result.upgraded) {
        this.pushNotification("Echo Reinforced", `${RELIC_MAP[relicId].name} gained another archived stack.`, "success");
      } else if (result.replaced) {
        this.pushNotification("Echo Replaced", `${RELIC_MAP[result.replaced.id].name} was replaced by ${RELIC_MAP[relicId].name}.`, "warn");
      } else {
        this.pushNotification("Echo Archived", `${RELIC_MAP[relicId].name} will activate on future runs.`, "success");
      }
    },

    completeRun(victory, reason) {
      if (!this.run || this.run.flags.finalized) {
        return;
      }
      this.run.flags.finalized = true;
      const contract = this.run.contract;
      const rewards = {
        scrap: Math.round((victory ? contract.rewardScrap : contract.rewardScrap * 0.25) + (victory ? this.run.rewards.scrap : this.run.rewards.scrap * 0.45)),
        cores: Math.round((victory ? contract.rewardCores : 0) + (victory ? this.run.rewards.cores : this.run.rewards.cores * 0.25)),
        renown: Math.round(victory ? contract.rewardRenown : contract.rewardRenown * 0.3)
      };

      addReward(this.save, rewards);
      this.save.lastContract = {
        zoneId: contract.zoneId,
        threat: contract.threat,
        missionType: contract.missionType,
        allowedLossPercent: contract.allowedLossPercent ?? null
      };
      this.save.profile.totalKills += this.run.stats.kills;
      this.save.profile.lifetimeScrap += rewards.scrap;
      this.save.profile.lifetimeCores += rewards.cores;
      this.save.profile.totalTime += this.run.time;
      this.save.profile.highestThreat = Math.max(this.save.profile.highestThreat, contract.threat);
      this.save.profile.highestLevel = Math.max(this.save.profile.highestLevel, this.run.player.level);
      this.save.profile.longestRun = Math.max(this.save.profile.longestRun, this.run.time);
      this.save.profile.bestCombo = Math.max(this.save.profile.bestCombo, this.run.stats.bestCombo);
      this.save.profile.bestRunKills = Math.max(this.save.profile.bestRunKills, this.run.stats.kills);

      if (victory) {
        this.save.profile.contractsWon += 1;
        this.save.profile.classVictories[this.save.selectedClass] += 1;
      } else {
        this.save.profile.contractsFailed += 1;
      }
      if (this.run.stats.bossKilled) {
        this.save.profile.bossesKilled += 1;
        if (this.run.stats.bossDamageTaken <= 0.01) {
          this.save.profile.flawlessBosses += 1;
        }
      }

      const unlocked = this.checkAchievements();
      this.run.summaryVictory = victory;
      this.run.archiveCandidates = victory ? getArchiveCandidates(this.run) : [];
      this.run.archivedRelicSelected = null;

      this.ui.summaryTitle.textContent = victory ? "Contract Complete" : "Contract Failed";
      this.ui.summaryLead.textContent = reason;
      this.ui.summaryStats.innerHTML = `
        <div class="summary-card"><span>Kills</span><strong>${this.run.stats.kills}</strong></div>
        <div class="summary-card"><span>Level</span><strong>${this.run.player.level}</strong></div>
        <div class="summary-card"><span>Time</span><strong>${formatTime(this.run.time)}</strong></div>
        <div class="summary-card"><span>Best Streak</span><strong>${this.run.stats.bestCombo}</strong></div>
        <div class="summary-card"><span>Damage Done</span><strong>${Math.round(this.run.stats.damageDone)}</strong></div>
        <div class="summary-card"><span>Scrap Found</span><strong>${this.run.rewards.scrap}</strong></div>
        <div class="summary-card"><span>Pickups</span><strong>${this.run.stats.pickupsCollected}</strong></div>
        <div class="summary-card"><span>Supply Pods</span><strong>${this.run.stats.supplyPodsOpened}</strong></div>
      `;
      this.ui.summaryRewards.innerHTML = [
        `<div class="reward-pill">+${rewards.scrap} Scrap</div>`,
        `<div class="reward-pill">+${rewards.cores} Core Shards</div>`,
        `<div class="reward-pill">+${rewards.renown} Renown</div>`,
        ...unlocked.map((achievement) => `<div class="reward-pill">${achievement.name}</div>`)
      ].join("");

      this.renderHub();
      this.renderSummaryArchiveChoices();
      this.saveGame();
      this.openModal("summary");
    },

    failRun(reason) {
      this.completeRun(false, reason);
    },

    quickRestart() {
      const fallback = this.save.lastContract || {
        zoneId: this.save.unlockedZones[this.save.unlockedZones.length - 1],
        threat: Math.min(this.getMaxThreat(), 3),
        missionType: "salvage"
      };
      const rng = createRng(Date.now());
      const mutators = [];
      if (fallback.threat >= 3 && rng.chance(0.7)) {
        mutators.push(rng.choice(Object.keys(MUTATORS)));
      }
      if (fallback.threat >= 5 && rng.chance(0.45)) {
        const second = rng.choice(Object.keys(MUTATORS));
        if (!mutators.includes(second)) {
          mutators.push(second);
        }
      }
      const zone = ZONE_DATA[fallback.zoneId];
      const allowedLossPercent = fallback.missionType === "escort"
        ? (fallback.allowedLossPercent ?? Math.max(30, Math.min(52, 48 - fallback.threat * 3 + rng.int(-4, 5))))
        : null;
      const rewardMultiplier = 1
        + (fallback.threat - 1) * 0.34
        + mutators.reduce((sum, id) => sum + MUTATORS[id].rewardBonus, 0)
        + (fallback.missionType === "escort" ? 0.08 : 0);
      const contract = {
        id: `rerun-${Date.now()}`,
        zoneId: fallback.zoneId,
        missionType: fallback.missionType,
        threat: fallback.threat,
        mutators,
        allowedLossPercent,
        rewardScrap: Math.round((90 + fallback.threat * 38) * zone.rewardFactor * rewardMultiplier),
        rewardCores: Math.round((4 + fallback.threat * 2) * zone.rewardFactor + mutators.length * 1.6),
        rewardRenown: Math.round(16 + fallback.threat * 10 + mutators.length * 8),
        seed: Math.floor(Math.random() * 2147483000)
      };
      this.activeModal = null;
      this.startContract(contract);
    },

    checkAchievements() {
      const unlockedNow = [];
      for (const achievement of ACHIEVEMENTS) {
        if (this.save.achievements[achievement.id]) {
          continue;
        }
        if (isAchievementUnlocked(this.save, achievement)) {
          this.save.achievements[achievement.id] = Date.now();
          addReward(this.save, achievement.reward);
          unlockedNow.push(achievement);
          this.pushNotification("Achievement Unlocked", `${achievement.name} • ${formatCost(achievement.reward)}`, "success");
        }
      }
      return unlockedNow;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => game.init());
  } else {
    game.init();
  }
})();
