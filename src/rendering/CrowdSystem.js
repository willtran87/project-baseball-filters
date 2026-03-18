/**
 * CrowdSystem — Spawns small pixel characters that walk back and forth
 * in each zone, giving the stadium life.
 */

import { CROWD_SPRITE_SETS, NPC_CROWD_SPRITES, AWAY_COLOR_SCHEMES, generateAwaySprite } from './crowdSprites.js';
import {
  CROWD_FIRST_NAMES, CROWD_LAST_NAMES,
  FAN_PERSONALITIES, WORKER_JOB_TITLES, WORKER_BIOS,
  VIP_TITLES, VIP_COMPANIES,
  RAPTORS_POSITIONS, PLAYER_FIRST_NAMES, PLAYER_LAST_NAMES,
  AWAY_TEAM_NAMES, MASCOT_IDENTITY,
} from '../data/crowdIdentityData.js';

// Field player layouts for top/bottom half-inning
// Top of inning: away bats (few near plate), home fields (spread across diamond)
// Bottom of inning: home bats (few near plate), away fields (spread across diamond)
// Base pixel positions from TileMap.js diamond rendering:
// Home plate: col 15, y=204 | 1st base: col 18, y=199
// 2nd base: col 15, y=195  | 3rd base: col 11.5, y=199
// Entity at row 12 → y=194 (right at base level), row 13 → y=210 (behind plate)

// Fielding positions (always all 8 spawned)
const FIELDERS = [
  { rows: [12], xMin: 14, xMax: 16 },      // pitcher (mound)
  { rows: [12], xMin: 11, xMax: 13 },      // 3B (3rd base)
  { rows: [12], xMin: 13, xMax: 15 },      // SS (between 2nd-3rd)
  { rows: [12], xMin: 16, xMax: 18 },      // 2B (between 1st-2nd)
  { rows: [12], xMin: 18, xMax: 20 },      // 1B (1st base)
  { rows: [10, 11], xMin: 5,  xMax: 10 },  // LF
  { rows: [10, 11], xMin: 13, xMax: 17 },  // CF
  { rows: [10, 11], xMin: 20, xMax: 25 },  // RF
];
// Batter + dugout (always spawned for batting team)
const BATTER_HOME =  { rows: [13], xMin: 14, xMax: 16 }; // home plate
const DUGOUT_HOME =  { rows: [10], xMin: 3,  xMax: 7 };  // 1B-side dugout
const DUGOUT_AWAY =  { rows: [10], xMin: 22, xMax: 26 }; // 3B-side dugout
// Optional baserunner positions (randomly selected each half-inning)
const RUNNER_1B = { rows: [12], xMin: 17, xMax: 19 }; // 1st base
const RUNNER_2B = { rows: [12], xMin: 14, xMax: 16 }; // 2nd base
const RUNNER_3B = { rows: [12], xMin: 11, xMax: 13 }; // 3rd base
// Probability of a runner being on each base (favors empty bases)
const RUNNER_CHANCE_1B = 0.30;
const RUNNER_CHANCE_2B = 0.15;
const RUNNER_CHANCE_3B = 0.10;
const FIELD_FANS = [
  { type: 'fan_red',   rows: [6, 7],  xMin: 2, xMax: 28 },
  { type: 'fan_navy',  rows: [6, 7],  xMin: 2, xMax: 28 },
  { type: 'fan_green', rows: [6, 7],  xMin: 2, xMax: 28 },
  { type: 'fan_white', rows: [6, 7],  xMin: 2, xMax: 28 },
  { type: 'fan_red',   rows: [7],     xMin: 2, xMax: 28 },
  { type: 'mascot',    rows: [7, 8],  xMin: 4, xMax: 26 },
];

// Per-zone crowd definitions
const ZONE_CROWDS = {
  field: {
    generics: [...FIELD_FANS],
    avoid: [],
  },
  concourse: {
    generics: [
      { type: 'fan_red',   rows: [8, 9, 10], xMin: 2, xMax: 28 },
      { type: 'fan_navy',  rows: [8, 9, 10], xMin: 2, xMax: 28 },
      { type: 'fan_white', rows: [8, 9, 10], xMin: 2, xMax: 28 },
      { type: 'fan_green', rows: [8, 9, 10], xMin: 2, xMax: 28 },
      { type: 'fan_red',   rows: [9, 10],    xMin: 2, xMax: 28 },
      { type: 'fan_navy',  rows: [9, 10],    xMin: 2, xMax: 28 },
      { type: 'fan_white', rows: [8, 10],    xMin: 2, xMax: 28 },
      { type: 'fan_green', rows: [8, 9],     xMin: 2, xMax: 28 },
      { type: 'fan_red',   rows: [10],       xMin: 2, xMax: 28 },
      { type: 'fan_navy',  rows: [8],        xMin: 2, xMax: 28 },
      { type: 'worker',    rows: [8, 9],     xMin: 2, xMax: 28 },
      { type: 'worker',    rows: [9, 10],    xMin: 2, xMax: 28 },
      { type: 'mascot',    rows: [8, 9],     xMin: 2, xMax: 28 },
    ],
    avoid: [[2, 4], [8, 10], [15, 17], [22, 24]], // concession stands
  },
  mechanical: {
    generics: [
      { type: 'worker', rows: [8, 9],   xMin: 2, xMax: 28 },
      { type: 'worker', rows: [13, 14], xMin: 2, xMax: 28 },
    ],
    avoid: [[2, 6], [12, 16], [22, 26]], // equipment blocks
  },
  underground: {
    generics: [
      { type: 'worker', rows: [9, 10], xMin: 2, xMax: 28 },
      { type: 'worker', rows: [9, 10], xMin: 2, xMax: 28 },
    ],
    avoid: [],
  },
  luxury: {
    generics: [
      { type: 'vip', rows: [8, 9, 10], xMin: 2, xMax: 28 },
      { type: 'vip', rows: [8, 9, 10], xMin: 2, xMax: 28 },
      { type: 'vip', rows: [8, 9, 10], xMin: 2, xMax: 28 },
      { type: 'vip', rows: [9, 10],    xMin: 2, xMax: 28 },
      { type: 'vip', rows: [8, 9],     xMin: 2, xMax: 28 },
    ],
    avoid: [[0, 0], [9, 9], [20, 20], [29, 29]], // dividers
  },
  pressbox: {
    generics: [
      { type: 'worker', rows: [8, 9], xMin: 2, xMax: 28 },
      { type: 'worker', rows: [8, 9], xMin: 2, xMax: 28 },
    ],
    avoid: [[1, 5], [8, 12], [15, 19], [22, 26]], // equipment
  },
};

// NPC home zones
const NPC_ZONES = {
  maggie: 'luxury',
  rusty:  'mechanical',
  priya:  'pressbox',
  bea:    'concourse',
  diego:  'field',
  fiona:  'concourse',
};

let _nextId = 0;

export class CrowdSystem {
  constructor(state, eventBus) {
    this._state = state;
    this._eventBus = eventBus;
    this._entities = [];
    this._currentZone = null;
    this._lastAwaySchemeIndex = -1;

    // Identity / roster state
    this._raptorsRoster = null;
    this._awayRoster = null;
    this._raptorsRosterIndex = 0;
    this._awayRosterIndex = 0;

    // Half-inning tracking (top = away bats, bottom = home bats)
    this._topOfInning = true; // start with top of 1st (away bats)
    this._inningSwapTimer = 0; // countdown for player transition
    this._inningSwapPhase = null; // 'exit' | 'enter' | null

    // Crowd reaction state tracking
    this._reactionTimer = 0;    // seconds remaining for active reaction
    this._reactionType = null;  // 'wave' | 'rush' | 'confetti'
    this._confettiBursts = [];  // [{x, y, timer, interval}] for confetti effect
    this._baseSpeedMultiplier = 1.0;
    this._wavingEntities = new Set(); // entity IDs selected for wave animation
    this._lastFiltrationQuality = 0.5; // track quality from filtration system

    // Track filtration quality for inning-end wave trigger
    eventBus.on('filtration:quality', (data) => {
      this._lastFiltrationQuality = data.avgEfficiency ?? data.quality ?? 0.5;
    });

    // Randomize away team colors on each new game day
    this._randomizeAwayColors();
    eventBus.on('game:newDay', () => {
      this._randomizeAwayColors();
      // Reset roster indices and regenerate away roster for new day
      this._raptorsRosterIndex = 0;
      this._awayRosterIndex = 0;
      this._generateAwayRoster();
      // Respawn current zone to show new uniforms
      this._spawnForZone(this._currentZone ?? state.currentZone ?? 'field');
    });

    eventBus.on('zone:changed', ({ to }) => {
      this._spawnForZone(to ?? state.currentZone);
    });

    // Respawn crowd on save load so NPC visibility reflects restored relationships
    eventBus.on('state:loaded', () => {
      this._spawnForZone(state.currentZone ?? 'field');
    });

    // After each half-inning: swap fielders/batters and trigger crowd reaction
    eventBus.on('economy:inningEnd', () => {
      if (this._lastFiltrationQuality > 0.75) {
        this._startReaction('wave', 3.0);
      }
      // Start the inning swap transition if we're on the field zone
      if (this._currentZone === 'field' && !this._inningSwapPhase) {
        this._beginInningSwap();
      } else {
        // If not viewing field, just toggle silently
        this._topOfInning = !this._topOfInning;
      }
    });

    // After crisis/negative event: crowd movement speed doubles for 5 seconds (panic)
    eventBus.on('event:started', (evt) => {
      const isPositive = evt.category === 'positive' || evt.isPositive;
      if (!isPositive) {
        this._startReaction('rush', 5.0);
      }
    });

    // During victory: trigger confetti burst from crowd positions
    eventBus.on('game:win', () => {
      this._startReaction('confetti', 8.0);
    });

    eventBus.on('championship:won', () => {
      this._startReaction('confetti', 8.0);
    });

    // Initial spawn
    this._spawnForZone(state.currentZone ?? 'field');
  }

  /**
   * Start a crowd reaction effect.
   * @param {'wave'|'rush'|'confetti'} type
   * @param {number} duration - seconds
   */
  _startReaction(type, duration) {
    this._reactionType = type;
    this._reactionTimer = duration;
    this._wavingEntities.clear();

    if (type === 'wave') {
      // Select random subset of fan/player entities to animate the wave
      const fanEntities = this._entities.filter(e => e.type !== 'npc' && e.type !== 'worker');
      const waveCount = Math.max(2, Math.floor(fanEntities.length * 0.6));
      const shuffled = fanEntities.sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(waveCount, shuffled.length); i++) {
        this._wavingEntities.add(shuffled[i].id);
      }
    }

    if (type === 'rush') {
      // Panic effect: double movement speed
      this._baseSpeedMultiplier = 2.0;
      // Un-pause all entities so they scramble immediately
      for (const e of this._entities) {
        if (e.paused && e.type !== 'npc') {
          e.paused = false;
          e.pauseTimer = 0;
          e.targetX = e.xMin + Math.random() * (e.xMax - e.xMin);
        }
      }
    }

    if (type === 'confetti') {
      // Spawn confetti bursts from crowd entity positions
      this._confettiBursts = [];
      const fanEntities = this._entities.filter(e => e.type !== 'npc' && e.type !== 'worker');
      const burstCount = Math.min(6, fanEntities.length);
      for (let i = 0; i < burstCount; i++) {
        const e = fanEntities[Math.floor(Math.random() * fanEntities.length)];
        this._confettiBursts.push({ x: e.x, y: e.y, timer: 0, interval: 0.4 + Math.random() * 0.3 });
      }
    }
  }

  /** Pick a random away color scheme (different from last game). */
  _randomizeAwayColors() {
    let idx;
    do {
      idx = Math.floor(Math.random() * AWAY_COLOR_SCHEMES.length);
    } while (idx === this._lastAwaySchemeIndex && AWAY_COLOR_SCHEMES.length > 1);
    this._lastAwaySchemeIndex = idx;
    CROWD_SPRITE_SETS.player_away = generateAwaySprite(AWAY_COLOR_SCHEMES[idx]);
  }

  /**
   * Returns a crowd density multiplier based on attendance percentage.
   * Falls back to reputation if attendancePercent is not yet set.
   */
  _crowdMultiplier() {
    const attPct = this._state.attendancePercent;
    if (attPct != null) {
      if (attPct < 30) return 0.4;
      if (attPct < 50) return 0.7;
      if (attPct < 70) return 1.0;
      if (attPct < 85) return 1.2;
      return 1.5;
    }
    // Fallback to reputation when attendance hasn't been calculated yet
    const rep = this._state.reputation ?? 50;
    if (rep < 30) return 0.5;
    if (rep < 60) return 1.0;
    if (rep < 85) return 1.25;
    return 1.5;
  }

  /**
   * Returns a walk-speed multiplier based on reputation.
   * Low rep = slightly slower crowd, high rep = slightly faster.
   */
  _speedMultiplier() {
    const rep = this._state.reputation ?? 50;
    if (rep < 30) return 0.8;
    if (rep < 60) return 1.0;
    if (rep < 85) return 1.1;
    return 1.2;
  }

  _spawnForZone(zoneId) {
    this._currentZone = zoneId;
    this._entities = [];

    const def = ZONE_CROWDS[zoneId];
    if (!def) return;

    // During off-season, only spawn workers (no fans, no players, no mascots)
    const isOffSeason = this._state.offSeason ?? false;

    // Determine how many generic entities to spawn based on reputation
    const mult = isOffSeason ? 0.3 : this._crowdMultiplier();
    const baseCount = def.generics.length;
    const targetCount = Math.max(1, Math.round(baseCount * mult));

    // Spawn generic crowd scaled by reputation
    for (let i = 0; i < targetCount; i++) {
      const entry = def.generics[i % baseCount];
      // During off-season, skip fan/player/mascot/vip types — only spawn workers
      if (isOffSeason && entry.type !== 'worker') continue;
      this._spawnEntity(entry, def.avoid, null);
    }

    // Spawn field players at full count (not scaled by attendance)
    if (zoneId === 'field' && !isOffSeason) {
      this._spawnFieldPlayers(false);
    }

    // Spawn NPCs in their home zone
    for (const [npcId, homeZone] of Object.entries(NPC_ZONES)) {
      if (homeZone !== zoneId) continue;
      const rel = this._state.npcRelationships?.[npcId] ?? 0;
      if (rel < 10) continue; // only spawn if at least neutral

      const npcSprites = NPC_CROWD_SPRITES[npcId];
      if (!npcSprites) continue;

      // Pick a row from zone's first generic entry
      const rows = def.generics[0]?.rows ?? [8];
      const row = rows[Math.floor(Math.random() * rows.length)];
      const xMin = (def.generics[0]?.xMin ?? 2) * 16;
      const xMax = (def.generics[0]?.xMax ?? 28) * 16;

      this._entities.push({
        id: _nextId++,
        zone: zoneId,
        x: xMin + Math.random() * (xMax - xMin),
        y: row * 16 + 2,
        targetX: xMin + Math.random() * (xMax - xMin),
        speed: 8 + Math.random() * 12,
        facing: 1,
        type: 'npc',
        npcId,
        frameIndex: 0,
        frameTimer: 0,
        paused: false,
        pauseTimer: 0,
        row,
        sprite: npcSprites,
        xMin,
        xMax,
      });
    }
  }

  _spawnEntity(entry, avoid, npcId) {
    const rows = entry.rows;
    const row = rows[Math.floor(Math.random() * rows.length)];
    const xMinCol = entry.xMin;
    const xMaxCol = entry.xMax;
    const xMin = xMinCol * 16;
    const xMax = xMaxCol * 16;

    // Pick a starting X that doesn't land in an avoided column range
    let startX = xMin + Math.random() * (xMax - xMin);
    const startCol = Math.floor(startX / 16);
    for (const [aMin, aMax] of avoid) {
      if (startCol >= aMin && startCol <= aMax) {
        // Nudge past the avoided zone
        startX = (aMax + 1) * 16 + Math.random() * 16;
        if (startX > xMax) startX = xMin + Math.random() * 32;
        break;
      }
    }

    const sprites = CROWD_SPRITE_SETS[entry.type];
    if (!sprites) return;

    const speedMult = npcId ? 1.0 : this._speedMultiplier();

    this._entities.push({
      id: _nextId++,
      zone: this._currentZone,
      x: startX,
      y: row * 16 + 2,
      targetX: xMin + Math.random() * (xMax - xMin),
      speed: (8 + Math.random() * 12) * speedMult,
      facing: 1,
      type: entry.type,
      npcId: npcId,
      identity: this._generateIdentity(entry.type),
      frameIndex: 0,
      frameTimer: 0,
      paused: false,
      pauseTimer: 0,
      row,
      sprite: sprites,
      xMin,
      xMax,
    });
  }

  // ── Inning Swap ───────────────────────────────────────────────────

  /**
   * Spawn field players based on current half-inning.
   * @param {boolean} fromEdge - if true, players enter from dugout edges
   */
  _spawnFieldPlayers(fromEdge = false) {
    const avoid = ZONE_CROWDS.field?.avoid ?? [];
    const fieldType = this._topOfInning ? 'player' : 'player_away';
    const batType   = this._topOfInning ? 'player_away' : 'player';

    // Always spawn all 8 fielders
    for (const pos of FIELDERS) {
      this._spawnEntity({ type: fieldType, ...pos }, avoid, null);
    }

    // Always spawn batter + dugout
    this._spawnEntity({ type: batType, ...BATTER_HOME }, avoid, null);
    const dugout = batType === 'player' ? DUGOUT_HOME : DUGOUT_AWAY;
    this._spawnEntity({ type: batType, ...dugout }, avoid, null);

    // Randomly place baserunners (favoring fewer)
    if (Math.random() < RUNNER_CHANCE_1B) {
      this._spawnEntity({ type: batType, ...RUNNER_1B }, avoid, null);
    }
    if (Math.random() < RUNNER_CHANCE_2B) {
      this._spawnEntity({ type: batType, ...RUNNER_2B }, avoid, null);
    }
    if (Math.random() < RUNNER_CHANCE_3B) {
      this._spawnEntity({ type: batType, ...RUNNER_3B }, avoid, null);
    }

    if (fromEdge) {
      // Move newly spawned players to dugout edges so they walk in
      for (const e of this._entities) {
        if (e.type !== 'player' && e.type !== 'player_away') continue;
        const enterFromLeft = e.type === 'player';
        e.x = enterFromLeft ? 1 * 16 : 28 * 16;
        e._transitioning = true;
        e.paused = false;
        e.speed = 30;
        e.facing = enterFromLeft ? 1 : -1;
      }
    }
  }

  /**
   * Start the half-inning swap transition.
   * Players walk off toward their dugout, then new lineup enters.
   */
  _beginInningSwap() {
    this._inningSwapPhase = 'exit';
    this._inningSwapTimer = 2.0;

    for (const e of this._entities) {
      if (e.type !== 'player' && e.type !== 'player_away') continue;
      e._transitioning = true;
      e.paused = false;
      e.pauseTimer = 0;
      e.speed = 30;
      // Home team exits left (1st-base dugout), away exits right (3rd-base dugout)
      e.targetX = e.type === 'player' ? 1 * 16 : 28 * 16;
    }
  }

  // ── Identity Generation ────────────────────────────────────────────

  _generateIdentity(type) {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    if (type.startsWith('fan_')) {
      const personality = pick(FAN_PERSONALITIES);
      return {
        kind: 'fan',
        name: `${pick(CROWD_FIRST_NAMES)} ${pick(CROWD_LAST_NAMES)}`,
        personality: personality.label,
        quote: personality.quote,
        attendanceStreak: 1 + Math.floor(Math.random() * 80),
      };
    }

    if (type === 'worker') {
      return {
        kind: 'worker',
        name: `${pick(CROWD_FIRST_NAMES)} ${pick(CROWD_LAST_NAMES)}`,
        jobTitle: pick(WORKER_JOB_TITLES),
        yearsWorked: 1 + Math.floor(Math.random() * 15),
        bio: pick(WORKER_BIOS),
      };
    }

    if (type === 'vip') {
      return {
        kind: 'vip',
        name: `${pick(CROWD_FIRST_NAMES)} ${pick(CROWD_LAST_NAMES)}`,
        title: pick(VIP_TITLES),
        company: pick(VIP_COMPANIES),
      };
    }

    if (type === 'player') {
      return this._pickRaptorPlayer();
    }

    if (type === 'player_away') {
      return this._pickAwayPlayer();
    }

    if (type === 'mascot') {
      return {
        kind: 'mascot',
        name: MASCOT_IDENTITY.name,
        title: MASCOT_IDENTITY.title,
        quote: MASCOT_IDENTITY.quote,
        funFact: MASCOT_IDENTITY.funFact,
      };
    }

    // NPCs and unknown types — identity handled elsewhere
    return null;
  }

  // ── Raptors Roster ──────────────────────────────────────────────────

  _ensureRaptorsRoster() {
    if (this._raptorsRoster) return;

    // Restore from state if available
    if (this._state.raptorsRoster && this._state.raptorsRoster.length > 0) {
      this._raptorsRoster = this._state.raptorsRoster;
      return;
    }

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const usedNumbers = new Set();
    const roster = [];

    for (const slot of RAPTORS_POSITIONS) {
      let jersey;
      do { jersey = 1 + Math.floor(Math.random() * 30); } while (usedNumbers.has(jersey));
      usedNumbers.add(jersey);

      const isPitcher = ['P', 'RP', 'SU', 'CL'].includes(slot.pos);
      const player = {
        name: `${pick(PLAYER_FIRST_NAMES)} ${pick(PLAYER_LAST_NAMES)}`,
        jersey,
        position: slot.pos,
        positionLabel: slot.label,
        avg: +(0.220 + Math.random() * 0.120).toFixed(3),
        hr: Math.floor(Math.random() * 31),
        rbi: 10 + Math.floor(Math.random() * 81),
      };
      if (isPitcher) {
        player.era = +(2.50 + Math.random() * 3.50).toFixed(2);
      }
      roster.push(player);
    }

    this._raptorsRoster = roster;
    this._state.raptorsRoster = roster;
  }

  _pickRaptorPlayer() {
    this._ensureRaptorsRoster();
    const player = this._raptorsRoster[this._raptorsRosterIndex % this._raptorsRoster.length];
    this._raptorsRosterIndex++;
    return { kind: 'player_home', team: 'Raptors', ...player };
  }

  // ── Away Roster ─────────────────────────────────────────────────────

  _generateAwayRoster() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const teamName = AWAY_TEAM_NAMES[this._lastAwaySchemeIndex] ??
      AWAY_TEAM_NAMES[Math.floor(Math.random() * AWAY_TEAM_NAMES.length)];
    const usedNumbers = new Set();
    const roster = [];

    for (const slot of RAPTORS_POSITIONS) {
      let jersey;
      do { jersey = 1 + Math.floor(Math.random() * 30); } while (usedNumbers.has(jersey));
      usedNumbers.add(jersey);

      const isPitcher = ['P', 'RP', 'SU', 'CL'].includes(slot.pos);
      const player = {
        name: `${pick(PLAYER_FIRST_NAMES)} ${pick(PLAYER_LAST_NAMES)}`,
        jersey,
        position: slot.pos,
        positionLabel: slot.label,
        avg: +(0.220 + Math.random() * 0.120).toFixed(3),
        hr: Math.floor(Math.random() * 31),
        rbi: 10 + Math.floor(Math.random() * 81),
        team: teamName,
      };
      if (isPitcher) {
        player.era = +(2.50 + Math.random() * 3.50).toFixed(2);
      }
      roster.push(player);
    }

    this._awayRoster = roster;
    this._awayRosterIndex = 0;
  }

  _pickAwayPlayer() {
    if (!this._awayRoster) this._generateAwayRoster();
    const player = this._awayRoster[this._awayRosterIndex % this._awayRoster.length];
    this._awayRosterIndex++;
    return { kind: 'player_away', ...player };
  }

  // ── Entity Lookup ───────────────────────────────────────────────────

  /**
   * Get the crowd entity at a given pixel position (for click/hover detection).
   * Checks NPCs first (higher priority), then all other entities.
   * Returns the full entity object or null.
   */
  getEntityAtPixel(pixelX, pixelY) {
    // NPCs first (priority)
    for (const entity of this._entities) {
      if (entity.type !== 'npc') continue;
      if (pixelX >= entity.x && pixelX < entity.x + 8 &&
          pixelY >= entity.y && pixelY < entity.y + 12) {
        return entity;
      }
    }
    // Then all other entities
    for (const entity of this._entities) {
      if (entity.type === 'npc') continue;
      if (pixelX >= entity.x && pixelX < entity.x + 8 &&
          pixelY >= entity.y && pixelY < entity.y + 12) {
        return entity;
      }
    }
    return null;
  }

  update(dt) {
    // Update crowd reaction timer
    if (this._reactionTimer > 0) {
      this._reactionTimer -= dt;
      if (this._reactionTimer <= 0) {
        this._reactionType = null;
        this._reactionTimer = 0;
        this._baseSpeedMultiplier = 1.0;
        this._confettiBursts = [];
        this._wavingEntities.clear();
      }
    }

    // Handle inning swap transition
    if (this._inningSwapPhase === 'exit') {
      this._inningSwapTimer -= dt;
      if (this._inningSwapTimer <= 0) {
        // Remove all player entities, toggle half-inning, spawn new lineup
        this._entities = this._entities.filter(
          e => e.type !== 'player' && e.type !== 'player_away'
        );
        this._topOfInning = !this._topOfInning;
        this._spawnFieldPlayers(true);
        this._inningSwapPhase = null;
      }
    }

    // Update confetti burst timers (emit particles via event bus)
    for (const burst of this._confettiBursts) {
      burst.timer += dt;
      if (burst.timer >= burst.interval) {
        burst.timer -= burst.interval;
        this._eventBus.emit('particles:emit', { preset: 'confetti', x: burst.x, y: burst.y });
      }
    }

    for (let i = 0; i < this._entities.length; i++) {
      const e = this._entities[i];

      if (e.paused) {
        e.pauseTimer -= dt;
        if (e.pauseTimer <= 0) {
          e.paused = false;
          e.targetX = e.xMin + Math.random() * (e.xMax - e.xMin);
          e.frameIndex = 0;
          e.frameTimer = 0;
          continue;
        }
        // Mascots do idle animation (frames 2→3→2→3) while paused
        if (e.type === 'mascot') {
          e.frameTimer += dt;
          if (e.frameTimer >= 0.35) {
            e.frameTimer -= 0.35;
            e.frameIndex = e.frameIndex === 2 ? 3 : 2;
          }
        }
        continue;
      }

      // Direction
      const dx = e.targetX - e.x;
      if (Math.abs(dx) < 1) {
        // Arrived at target — pause
        e.paused = true;
        e.pauseTimer = 1 + Math.random() * 2;
        e.frameIndex = e.type === 'mascot' ? 2 : 0;
        e.frameTimer = 0;
        // Reset boosted transition speed back to normal walk pace
        if (e._transitioning) {
          e.speed = (8 + Math.random() * 12) * this._speedMultiplier();
          e._transitioning = false;
        }
        continue;
      }

      e.facing = dx > 0 ? 1 : -1;

      // Sprites pass through each other freely
      e.x += e.facing * e.speed * this._baseSpeedMultiplier * dt;
      // Clamp (skip during inning swap transition so entities can walk off/on field)
      if (!e._transitioning) {
        if (e.x < e.xMin) e.x = e.xMin;
        if (e.x > e.xMax) e.x = e.xMax;
      }

      // Animate walk cycle: swap frame 0↔1
      const frameInterval = e.type === 'mascot' ? 0.35 : 0.25;
      e.frameTimer += dt;
      if (e.frameTimer >= frameInterval) {
        e.frameTimer -= frameInterval;
        e.frameIndex = e.frameIndex === 0 ? 1 : 0;
      }
    }
  }

  /**
   * Get the NPC entity at a given pixel position (for click detection).
   * Returns the npcId string or null.
   */
  getNpcAtPixel(pixelX, pixelY) {
    for (const entity of this._entities) {
      if (entity.type !== 'npc') continue;
      // Sprite is ~8x12 pixels
      if (pixelX >= entity.x && pixelX < entity.x + 8 &&
          pixelY >= entity.y && pixelY < entity.y + 12) {
        return entity.npcId;
      }
    }
    return null;
  }

  /**
   * Get NPC entity's pixel position (for hover tooltips).
   */
  getNpcPosition(npcId) {
    const e = this._entities.find(ent => ent.type === 'npc' && ent.npcId === npcId);
    if (!e) return null;
    return { x: e.x, y: e.y };
  }

  render(renderer) {
    const ctx = renderer.ctx;
    const now = Date.now() * 0.001;

    for (const e of this._entities) {
      const frames = e.sprite;
      if (!frames || !frames[e.frameIndex]) continue;

      const data = frames[e.frameIndex];
      const baseX = Math.floor(e.x - renderer.cameraX);

      // Wave reaction: selected crowd members bob up and down in a wave pattern
      let waveOffset = 0;
      if (this._reactionType === 'wave' && this._wavingEntities.has(e.id)) {
        waveOffset = Math.round(Math.sin(now * 4 + e.x * 0.3) * 2);
      }

      // Rush reaction: slight jitter for panic effect on non-NPC entities
      let rushJitter = 0;
      if (this._reactionType === 'rush' && e.type !== 'npc') {
        rushJitter = Math.round((Math.random() - 0.5) * 1);
      }

      const baseY = Math.floor(e.y - renderer.cameraY) + waveOffset + rushJitter;

      for (let row = 0; row < data.length; row++) {
        const line = data[row];
        for (let col = 0; col < line.length; col++) {
          const color = line[col];
          if (!color) continue;
          const drawCol = e.facing === -1 ? (line.length - 1 - col) : col;
          ctx.fillStyle = color;
          ctx.fillRect(baseX + drawCol, baseY + row, 1, 1);
        }
      }
    }
  }
}
