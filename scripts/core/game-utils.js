// Shared utilities, save helpers, and meta-progression functions.
"use strict";

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

