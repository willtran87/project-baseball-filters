/**
 * CrowdSystem — Spawns small pixel characters that walk back and forth
 * in each zone, giving the stadium life.
 */

import { CROWD_SPRITE_SETS, NPC_CROWD_SPRITES, AWAY_COLOR_SCHEMES, generateAwaySprite } from './crowdSprites.js';

// Per-zone crowd definitions
const ZONE_CROWDS = {
  field: {
    generics: [
      { type: 'fan_red',   rows: [6, 7],  xMin: 2, xMax: 28 },
      { type: 'fan_navy',  rows: [6, 7],  xMin: 2, xMax: 28 },
      { type: 'fan_green', rows: [6, 7],  xMin: 2, xMax: 28 },
      { type: 'fan_white', rows: [6, 7],  xMin: 2, xMax: 28 },
      { type: 'fan_red',   rows: [7],     xMin: 2, xMax: 28 },
      { type: 'fan_navy',  rows: [7],     xMin: 2, xMax: 28 },
      { type: 'player',      rows: [11, 12], xMin: 3, xMax: 27 },
      { type: 'player',      rows: [11, 12], xMin: 3, xMax: 27 },
      { type: 'player_away', rows: [11, 12], xMin: 3, xMax: 27 },
      { type: 'player_away', rows: [11, 12], xMin: 3, xMax: 27 },
      { type: 'player_away', rows: [11, 12], xMin: 3, xMax: 27 },
      { type: 'mascot',      rows: [7, 8],   xMin: 4, xMax: 26 },
    ],
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

    // Randomize away team colors on each new game day
    this._randomizeAwayColors();
    eventBus.on('game:newDay', () => {
      this._randomizeAwayColors();
      // Respawn current zone to show new uniforms
      this._spawnForZone(this._currentZone ?? state.currentZone ?? 'field');
    });

    eventBus.on('zone:changed', ({ to }) => {
      this._spawnForZone(to ?? state.currentZone);
    });

    // Initial spawn
    this._spawnForZone(state.currentZone ?? 'field');
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

  update(dt) {
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
        continue;
      }

      e.facing = dx > 0 ? 1 : -1;

      // Sprites pass through each other freely
      e.x += e.facing * e.speed * dt;
      // Clamp
      if (e.x < e.xMin) e.x = e.xMin;
      if (e.x > e.xMax) e.x = e.xMax;

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
    for (const e of this._entities) {
      const frames = e.sprite;
      if (!frames || !frames[e.frameIndex]) continue;

      const data = frames[e.frameIndex];
      const baseX = Math.floor(e.x - renderer.cameraX);
      const baseY = Math.floor(e.y - renderer.cameraY);

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
