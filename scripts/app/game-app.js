// Application bootstrap, UI orchestration, audio, and screen management.
"use strict";

  const BRIEFING_PORTRAIT_PATHS = {
    crawler: "assets/enemies/crawler.svg",
    raider: "assets/enemies/raider.svg",
    gunner: "assets/enemies/gunner.svg",
    mortar: "assets/enemies/mortar.svg",
    wasp: "assets/enemies/wasp.svg",
    sentinel: "assets/enemies/sentinel.svg",
    siphon: "assets/enemies/siphon.svg",
    ironReaper: "assets/enemies/iron-reaper.svg",
    emberHydra: "assets/enemies/ember-hydra.svg",
    nullMatriarch: "assets/enemies/null-matriarch.svg",
    vaultTitan: "assets/enemies/vault-titan.svg"
  };

  const ENEMY_BEHAVIOR_LABELS = {
    melee: "Melee",
    charger: "Charger",
    ranged: "Ranged",
    mortar: "Artillery",
    skirmish: "Skirmisher",
    support: "Support",
    drain: "Disruptor"
  };

  const ENEMY_BEHAVIOR_BRIEFING = {
    melee: "Closes distance directly and punishes any gap in your frontline control.",
    charger: "Uses burst movement to crash exposed angles and break safe spacing.",
    ranged: "Stays at mid-range and pressures you with disciplined direct fire.",
    mortar: "Bombards from long range and forces movement with splash zones.",
    skirmish: "Swings wide, circles fast, and overloads quiet lanes if ignored.",
    support: "Protects priority allies and makes the whole enemy pack harder to break.",
    drain: "Applies slowing pressure and feeds sustain into dangerous targets."
  };

  const BOSS_BRIEFING_TEXT = {
    ironReaper: "Aggressive commander that floods the field with spread fire and reinforcement pressure.",
    emberHydra: "Area-denial boss that stacks missile salvos with burning ground hazards.",
    nullMatriarch: "Teleporting disruption boss that mixes slows, shields, and support pressure.",
    vaultTitan: "Heavy suppressor that locks lanes with disciplined ranged fire and beam attacks."
  };

  const ANOMALY_BRIEFING_TEXT = {
    mine: "Triggered mines that punish careless movement and tight kiting routes.",
    vent: "Thermal bursts and burning pools that turn safe ground into danger zones.",
    rift: "Pull fields that drag you out of position and punish overcommitment.",
    pylon: "Storm emitters that seed the map with repeated projectile pressure."
  };

  function getBriefingPortraitPath(id) {
    return BRIEFING_PORTRAIT_PATHS[id] || "";
  }

  function getEnemyBriefingDescription(enemyId) {
    const behavior = ENEMY_DATA[enemyId]?.behavior;
    return ENEMY_BEHAVIOR_BRIEFING[behavior] || "Hostile contact with mixed pressure patterns.";
  }

  function getBossBriefingDescription(bossId) {
    return BOSS_BRIEFING_TEXT[bossId] || "Zone commander with layered pressure and lethal phase spikes.";
  }

  function getMissionTutorialObjectiveText(run) {
    if (run.objective.type === "salvage") {
      return `Secure ${run.objective.total} unstable wreck caches. Every cache you touch raises the response level and brings the boss closer.`;
    }
    if (run.objective.type === "hunt") {
      return `Eliminate ${run.objective.total} marked lieutenants. Once the last elite target falls, the zone boss deploys immediately.`;
    }
    if (run.objective.type === "defense") {
      return "Hold the reactor inside its defense ring. Standing in the cyan ring helps stabilize the lock while support turrets fight beside you.";
    }
    if (run.objective.type === "escort") {
      return `Protect the armored convoy through the center lane. Reserve vehicles feed in from the wall and total losses must stay under ${run.contract.allowedLossPercent}%.`;
    }
    return MISSION_TYPES[run.contract.missionType].desc;
  }

  function getMissionTutorialNotes(run) {
    const mutatorText = run.contract.mutators.length
      ? run.contract.mutators.map((id) => `${MUTATORS[id].name}: ${MUTATORS[id].desc}`).join(" ")
      : "No mutators rolled on this contract, so you only have the base mission pressure to manage.";
    const notes = [
      {
        title: "Objective",
        text: getMissionTutorialObjectiveText(run)
      },
      {
        title: "Boss Response",
        text: `${BOSS_DATA[run.zone.bossId].name} will answer the contract after the objective phase. ${getBossBriefingDescription(run.zone.bossId)}`
      },
      {
        title: "Contract Modifiers",
        text: mutatorText
      },
      {
        title: "Controls",
        text: "`WASD` move, mouse aim, `LMB` fire, `Shift` dash, `Q/E/R/F` abilities, `T` deploy tower, `C` auto-fire, `Esc` pause."
      }
    ];
    return notes;
  }

  function getGroundIntelEntries(run) {
    const entries = [
      {
        key: "salvage",
        name: "Field Salvage",
        color: "#ffd790",
        desc: "Destroyed hostiles spill Scrap, XP, Core Shards, hull cells, and shield cells into the sector."
      },
      {
        key: "pods",
        name: "Supply Pods",
        color: SUPPLY_POD_TYPES.cache.color,
        desc: "Combat tempo, time in zone, and kill streaks call down cache, repair, overclock, or magnet pods."
      }
    ];
    const prototypeIds = [...new Set(run.prototypeCaches.filter((cache) => cache.active).map((cache) => cache.weaponId))];
    for (const weaponId of prototypeIds) {
      const weapon = PROTOTYPE_WEAPONS[weaponId];
      entries.push({
        key: `prototype-${weaponId}`,
        name: weapon.name,
        color: weapon.color,
        desc: weapon.desc
      });
    }
    const anomalyTypes = [...new Set(run.anomalies.map((anomaly) => anomaly.type))];
    for (const type of anomalyTypes) {
      entries.push({
        key: `anomaly-${type}`,
        name: ANOMALY_TYPES[type].name,
        color: ANOMALY_TYPES[type].color,
        desc: ANOMALY_BRIEFING_TEXT[type]
      });
    }
    if (run.teleporters.length) {
      entries.push({
        key: "teleporters",
        name: "Transient Relay",
        color: "#8ff7ff",
        desc: "Paired gates phase in for short windows and let you jump instantly across the map."
      });
    }
    if (run.contract.missionType === "escort") {
      entries.push({
        key: "convoy",
        name: "Convoy Reserves",
        color: "#d7dde6",
        desc: "Extra transports feed into the wall lane over time, so early losses do not end the contract by themselves."
      });
    }
    return entries;
  }

  function buildTutorialMapMarkup(run) {
    const markerMap = new Map();
    const mapWidth = Math.max(1, run.map.width);
    const mapHeight = Math.max(1, run.map.height);
    const toLeft = (value) => clamp((value / mapWidth) * 100, 2, 98);
    const toTop = (value) => clamp((value / mapHeight) * 100, 2, 98);
    const scene = [];

    const addLegend = (key, label, color) => {
      if (!markerMap.has(key)) {
        markerMap.set(key, { label, color });
      }
    };

    const addMarker = (x, y, className, label, color) => {
      scene.push(`<span class="tutorial-map-marker ${className}" style="left:${toLeft(x)}%; top:${toTop(y)}%" title="${label}"></span>`);
      addLegend(className, label, color);
    };

    addMarker(run.map.spawn.x, run.map.spawn.y, "player", "Drop Point", "#9ff7ff");

    if (run.objective.type === "salvage") {
      for (const node of run.objective.nodes) {
        addMarker(node.x, node.y, "objective", "Salvage Cache", run.zone.colors.objective);
      }
    }

    if (run.objective.type === "hunt") {
      for (const enemy of run.enemies.filter((entry) => entry.objectiveTarget)) {
        addMarker(enemy.x, enemy.y, "objective", "Lieutenant Target", "#ffad8d");
      }
    }

    if (run.objective.type === "defense") {
      const reactor = run.objective.reactor;
      scene.push(`
        <span
          class="tutorial-map-ring"
          style="
            left:${toLeft(reactor.x)}%;
            top:${toTop(reactor.y)}%;
            width:${(reactor.guardRadius * 2 / mapWidth) * 100}%;
            height:${(reactor.guardRadius * 2 / mapHeight) * 100}%;
          "
        ></span>
      `);
      addMarker(reactor.x, reactor.y, "reactor", "Reactor Core", "#9ff3ff");
    }

    if (run.objective.type === "escort") {
      scene.push(`<span class="tutorial-map-lane" style="left:${toLeft(run.objective.laneX)}%"></span>`);
      scene.push(`<span class="tutorial-map-goal" style="top:${toTop(run.objective.destinationY)}%"></span>`);
      for (const vehicle of run.objective.convoy) {
        addMarker(
          vehicle.x,
          vehicle.y,
          vehicle.deployed ? "convoy" : "reserve",
          vehicle.deployed ? "Convoy Unit" : "Reserve Convoy Unit",
          vehicle.deployed ? vehicle.accent : "#d7dde6"
        );
      }
    }

    for (const anomaly of run.anomalies) {
      addMarker(anomaly.x, anomaly.y, "anomaly", ANOMALY_TYPES[anomaly.type].name, ANOMALY_TYPES[anomaly.type].color);
    }

    for (const cache of run.prototypeCaches) {
      addMarker(cache.x, cache.y, "cache", PROTOTYPE_WEAPONS[cache.weaponId].name, PROTOTYPE_WEAPONS[cache.weaponId].color);
    }

    for (const pair of run.teleporters) {
      for (const endpoint of pair.endpoints) {
        addMarker(endpoint.x, endpoint.y, "relay", "Transient Relay", "#8ff7ff");
      }
    }

    const legendHtml = [...markerMap.values()].map((entry) => `
      <span class="tutorial-map-legend-item">
        <span class="tutorial-map-legend-dot" style="--legend-color:${entry.color}"></span>
        ${entry.label}
      </span>
    `).join("");

    return `
      <div class="tutorial-map-scene">
        ${scene.join("")}
      </div>
      <div class="tutorial-map-legend">${legendHtml}</div>
    `;
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
        tutorial: el("screen-tutorial"),
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
      if (this.activeModal === "tutorial") {
        this.dismissMissionTutorial();
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
        case "dismiss-tutorial":
          this.dismissMissionTutorial();
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
      this.ui.optionShowMissionTutorial.checked = this.save.options.showMissionTutorial !== false;
    },

    saveOptionsFromInputs() {
      this.save.options.muteAudio = this.ui.optionMuteAudio.checked;
      this.save.options.masterVolume = Number(this.ui.optionMasterVolume.value);
      this.save.options.sfxVolume = Number(this.ui.optionSfxVolume.value);
      this.save.options.musicVolume = Number(this.ui.optionMusicVolume.value);
      this.save.options.screenShake = Number(this.ui.optionScreenShake.value);
      this.save.options.particles = this.ui.optionParticles.checked;
      this.save.options.defaultAutoFire = this.ui.optionDefaultAutoFire.checked;
      this.save.options.showMissionTutorial = this.ui.optionShowMissionTutorial.checked;
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
