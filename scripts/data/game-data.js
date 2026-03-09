// Shared data tables and configuration for Starfall.
  "use strict";

  const STORAGE_KEY = "starfall-salvage-save-v1";
  const SAVE_VERSION = 1;
  const TWO_PI = Math.PI * 2;
  let NEXT_ID = 1;

  const MISSION_TYPES = {
    salvage: {
      id: "salvage",
      name: "Wreck Sweep",
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
      desc: "Escort the armored convoy through the central freight channel and keep losses below the contract cap."
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
      relicSlots: 3,
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
      relicSlots: 3,
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
      relicSlots: 4,
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
      relicSlots: 5,
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
      scrap: 5,
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
      scrap: 6,
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
      scrap: 6,
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
      scrap: 8,
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
      scrap: 4,
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
      scrap: 9,
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
      scrap: 7,
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
      id: "fieldFabricators",
      name: "Field Fabricators",
      desc: "Increase tower deployments by 1, reduce tower deployment cooldown by 6%, and reduce tower Scrap cost by 4% per rank.",
      maxLevel: 4,
      costs: [
        { scrap: 85, cores: 0 },
        { scrap: 130, cores: 2 },
        { scrap: 190, cores: 4 },
        { scrap: 265, cores: 7 }
      ],
      currentText: (level) => `+${level} tower deploys, -${level * 6}% cooldown`
    },
    {
      id: "salvageRigs",
      name: "Recovery Rigs",
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
      name: "Recovery Magnet",
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
      id: "forwardFoundry",
      name: "Forward Foundry",
      rarity: "rare",
      desc: "+2 tower deployments, -18% tower deployment cooldown, and -12% tower Scrap cost.",
      maxStacks: 1,
      apply(game, run) {
        run.player.stats.towerLimitBonus += 2;
        run.player.stats.towerCooldown *= 0.82;
        run.player.stats.towerCostMultiplier *= 0.88;
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
    { id: "salvageVeteran", name: "Contract Veteran", desc: "Complete 15 contracts.", reward: { scrap: 260, cores: 10 } },
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
      desc: "Cracks open into Scrap, cores, and signal shards."
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
      desc: "Amplifies your pickup vacuum field and reels in loose drops."
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
      desc: "Accelerate abilities, deployments, recovery, and signal growth.",
      upgrades: ["archiveDecoder", "salvageRigs", "abilityMatrix", "fieldFabricators", "killTelemetry"]
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
    "towerAbilityName",
    "towerAbilityBar",
    "towerAbilityLabel",
    "continueButton",
    "menuStatusRow",
    "menuShipShowcase",
    "menuProgressShowcase",
    "profileSummary",
    "metaScrapText",
    "metaCoreText",
    "metaRenownText",
    "hubOverviewGrid",
    "deploymentSummary",
    "zoneSummary",
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
    "briefingTitle",
    "briefingLead",
    "briefingOverview",
    "briefingMapPreview",
    "briefingEnemyRoster",
    "briefingGroundIntel",
    "briefingMissionNotes",
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
