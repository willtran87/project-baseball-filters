/**
 * MiniGame — Repair mini-game overlay system.
 *
 * Triggered when filter:broken fires or when player initiates repair.
 * Three mini-game types based on filter domain:
 *   - Air/HVAC: "Filter Jam" (timing)
 *   - Water/Drainage: "Pipe Connect" (puzzle)
 *   - Electrical: "Breaker Sequence" (memory)
 *
 * Renders as a centered 256x256 overlay panel on canvas.
 * Pauses main game during play.
 */

const MINIGAME_SIZE = 256;

// Domain-to-minigame mapping
const DOMAIN_GAMES = {
  air: 'filterJam',
  hvac: 'filterJam',
  water: 'pipeConnect',
  drainage: 'pipeConnect',
  electrical: 'breakerSequence',
};

// ── Difficulty scaling tables ────────────────────────────────────────
// Indexed by effective tier (1-4). Difficulty setting shifts the tier:
//   Rookie: -1, Veteran: 0, All-Star: +1, Hall of Fame: always 4
const DIFFICULTY_SHIFT = {
  rookie: -1,
  veteran: 0,
  allStar: 1,
  hallOfFame: 99, // sentinel — forces max tier
};

const FILTER_JAM_PARAMS = {
  1: { greenZone: 0.40, speed: 1.0 },
  2: { greenZone: 0.30, speed: 1.5 },
  3: { greenZone: 0.20, speed: 2.0 },
  4: { greenZone: 0.15, speed: 2.5 },
};

const PIPE_CONNECT_PARAMS = {
  1: { gridSize: 4, timer: 20 },
  2: { gridSize: 5, timer: 15 },
  3: { gridSize: 5, timer: 12 },
  4: { gridSize: 6, timer: 10 },
};

const BREAKER_SEQ_PARAMS = {
  1: { maxRounds: 2, startLength: 3 },
  2: { maxRounds: 3, startLength: 4 },
  3: { maxRounds: 3, startLength: 5 },
  4: { maxRounds: 4, startLength: 5 },
};

// Streak milestone rewards
const STREAK_MILESTONES = [
  { streak: 3, bonus: 100, message: 'Mini-Game Streak: 3! +$100 bonus' },
  { streak: 5, bonus: 250, message: 'Hot Hands! 5 in a row! +$250 bonus' },
  { streak: 10, bonus: 500, message: 'Master Mechanic! 10 streak! +$500 bonus' },
];

export class MiniGame {
  constructor(container, state, eventBus, staffSystem) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this.staffSystem = staffSystem;

    this._overlay = null;
    this._canvas = null;
    this._ctx = null;
    this._active = false;
    this._filter = null;
    this._gameType = null;
    this._animFrame = null;

    // Mini-game state
    this._mg = {};

    // Listen for triggers
    this.eventBus.on('filter:broken', (filter) => this._onFilterBroken(filter));
    this.eventBus.on('minigame:start', (data) => this.start(data.filter));
  }

  _onFilterBroken(filter) {
    // Offer mini-game when a filter breaks
    if (this._active) return;
    this.start(filter);
  }

  /**
   * Compute effective difficulty tier (1-4) from filter tier + game difficulty.
   */
  _getEffectiveTier(filter) {
    const baseTier = filter.tier ?? 2;
    const shift = DIFFICULTY_SHIFT[this.state.difficulty] ?? 0;
    if (shift >= 99) return 4; // Hall of Fame always max
    return Math.max(1, Math.min(4, baseTier + shift));
  }

  /**
   * Compute the skip cost (standard repair + 10% surcharge).
   */
  _calcSkipCost(filter) {
    const config = this.state.config ?? {};
    const systems = config.systems ?? {};
    const domainDef = systems[filter.domain];
    const compDef = domainDef?.components?.[filter.componentType];
    const tierDef = compDef?.tiers?.find(t => t.tier === filter.tier);
    const baseCost = tierDef ? Math.floor(tierDef.cost * 0.3) : 150;
    const emergencyMult = config.economy?.emergencyRepairMultiplier ?? 2.5;
    const isBroken = filter.condition <= 0;
    const rawCost = isBroken ? Math.floor(baseCost * emergencyMult) : baseCost;
    const diffKey = this.state.difficulty ?? 'veteran';
    const diffMult = config.difficulty?.[diffKey]?.repairCostMultiplier ?? 1.0;
    const repairCost = Math.floor(rawCost * diffMult);
    // 10% surcharge for skipping
    return Math.ceil(repairCost * 1.1);
  }

  /**
   * Start a mini-game for the given filter.
   */
  start(filter) {
    if (this._active) return;

    this._filter = filter;
    this._gameType = DOMAIN_GAMES[filter.domain] ?? 'filterJam';
    this._effectiveTier = this._getEffectiveTier(filter);
    this._skipCost = this._calcSkipCost(filter);
    this._active = true;

    // Pause main game
    this._wasPaused = this.state.paused;
    if (!this._wasPaused) {
      this.eventBus.emit('game:pause');
    }

    this._createOverlay();
    this._initGame();
    this._loop();
  }

  /**
   * Create the overlay DOM and canvas.
   */
  _createOverlay() {
    this._overlay = document.createElement('div');
    this._overlay.id = 'minigame-overlay';
    this._overlay.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.7);
      z-index: 50;
      font-family: monospace;
    `;

    const panel = document.createElement('div');
    panel.style.cssText = `
      background: linear-gradient(180deg, rgba(15,10,5,0.97), rgba(8,8,24,0.97));
      border: 2px solid #8b4513;
      border-radius: 4px;
      padding: 8px;
      display: flex; flex-direction: column;
      align-items: center;
      box-shadow: 0 0 20px rgba(139,69,19,0.3);
    `;

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.style.cssText = `
      display: flex; justify-content: space-between; width: ${MINIGAME_SIZE}px;
      margin-bottom: 6px; color: #e0e0e0; font-size: 11px;
    `;
    const titles = {
      filterJam: 'FILTER JAM',
      pipeConnect: 'PIPE CONNECT',
      breakerSequence: 'BREAKER SEQUENCE',
    };
    titleBar.innerHTML = `
      <strong style="color:#ffec27">${titles[this._gameType] ?? 'REPAIR'}</strong>
      <span style="color:#888;font-size:10px">${this._filter.domain}</span>
    `;
    panel.appendChild(titleBar);

    // Canvas (DPI-aware)
    const dpr = window.devicePixelRatio || 1;
    this._canvas = document.createElement('canvas');
    this._canvas.width = MINIGAME_SIZE * dpr;
    this._canvas.height = MINIGAME_SIZE * dpr;
    this._canvas.style.cssText = `
      width: ${MINIGAME_SIZE}px;
      height: ${MINIGAME_SIZE}px;
      border: 1px solid #3a3a5a;
      cursor: pointer;
      image-rendering: pixelated;
    `;
    this._ctx = this._canvas.getContext('2d');
    this._ctx.scale(dpr, dpr);
    panel.appendChild(this._canvas);

    // Instructions + Skip
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex; justify-content: space-between; width: ${MINIGAME_SIZE}px;
      margin-top: 6px; font-size: 10px;
    `;
    controls.innerHTML = `
      <span id="mg-instructions" style="color:#888"></span>
      <button id="mg-skip" style="background:#3a2a2a;color:#ff8800;border:1px solid #5a3a3a;padding:2px 8px;font-family:monospace;cursor:pointer;font-size:10px">Skip ($${this._skipCost})</button>
    `;
    panel.appendChild(controls);

    this._overlay.appendChild(panel);
    this.container.appendChild(this._overlay);

    // Event listeners
    this._canvas.addEventListener('click', (e) => this._onClick(e));
    this._canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    controls.querySelector('#mg-skip').addEventListener('click', () => this._skip());
  }

  /**
   * Remove overlay and clean up.
   */
  _destroy() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
    this._canvas = null;
    this._ctx = null;
    this._active = false;
    this._mg = {};

    // Restore pause state
    if (!this._wasPaused) {
      this.eventBus.emit('game:resume');
    }
  }

  /**
   * Complete the mini-game with success or failure.
   */
  _complete(success) {
    if (success) {
      // Instant repair, no cost
      if (this._filter) {
        this._filter.condition = this._filter.maxCondition;
        this._filter.efficiency = 1.0;
        this.eventBus.emit('filter:repaired', this._filter);
      }
      // +5 XP to assigned worker
      if (this.staffSystem) {
        const assigned = this.staffSystem.getAssignedStaff(this._filter?.domain);
        if (assigned) {
          this.staffSystem.grantXP(assigned.id, 5);
        }
      }
      // Streak tracking — increment
      this.state.miniGameStreak = (this.state.miniGameStreak ?? 0) + 1;
      if (this.state.miniGameStreak > (this.state.bestMiniGameStreak ?? 0)) {
        this.state.bestMiniGameStreak = this.state.miniGameStreak;
      }
      // Check streak milestones
      this._checkStreakMilestones();

      this.eventBus.emit('minigame:success', { filter: this._filter });
      this.eventBus.emit('ui:message', { text: '\u2713 Repair successful! Bonus condition restored.', type: 'success' });
    } else {
      // Streak tracking — reset on failure
      this.state.miniGameStreak = 0;

      // Normal repair time + 25% extra cost (emit failure, let economy handle)
      this.eventBus.emit('minigame:failure', { filter: this._filter });
      this.eventBus.emit('ui:message', { text: 'Repair failed \u2014 standard repair applied', type: 'warning' });
    }
    this._destroy();
  }

  /**
   * Check if current streak hits a milestone and award bonus money.
   */
  _checkStreakMilestones() {
    const streak = this.state.miniGameStreak ?? 0;
    for (const milestone of STREAK_MILESTONES) {
      if (streak === milestone.streak) {
        this.state.money += milestone.bonus;
        const msgType = milestone.streak >= 10 ? 'achievement' : 'success';
        this.eventBus.emit('ui:message', { text: milestone.message, type: msgType });
        if (milestone.streak >= 10) {
          this.eventBus.emit('particles:confetti');
        }
        break;
      }
    }
  }

  /**
   * Skip the mini-game (normal repair + 10% surcharge).
   */
  _skip() {
    // Deduct the skip surcharge (the extra 10% on top of normal repair)
    if (this._skipCost > 0) {
      this.state.money = Math.max(0, this.state.money - this._skipCost);
    }
    // Streak resets on skip
    this.state.miniGameStreak = 0;

    this.eventBus.emit('minigame:skipped', { filter: this._filter, skipCost: this._skipCost });
    this._destroy();
  }

  // ──────────────────────────────────────────────
  //  GAME INIT
  // ──────────────────────────────────────────────

  _initGame() {
    switch (this._gameType) {
      case 'filterJam':
        this._initFilterJam();
        break;
      case 'pipeConnect':
        this._initPipeConnect();
        break;
      case 'breakerSequence':
        this._initBreakerSequence();
        break;
    }
  }

  // ──────────────────────────────────────────────
  //  FILTER JAM (timing game)
  //  Oscillating indicator bar — click when in green zone.
  //  3 attempts. Green zone shrinks each attempt.
  // ──────────────────────────────────────────────

  _initFilterJam() {
    const params = FILTER_JAM_PARAMS[this._effectiveTier] ?? FILTER_JAM_PARAMS[2];
    const halfGreen = params.greenZone / 2;
    this._mg = {
      attempt: 0,
      maxAttempts: 3,
      successes: 0,
      position: 0,       // 0-1, oscillates
      direction: 1,
      speed: params.speed,
      baseGreenHalf: halfGreen,
      greenStart: 0.5 - halfGreen,
      greenEnd: 0.5 + halfGreen,
      result: null,       // null = playing, 'hit', 'miss'
      resultTimer: 0,
    };
    this._setInstructions('Click when the bar is in the GREEN zone!');
  }

  _updateFilterJam(dt) {
    const mg = this._mg;
    if (mg.result) {
      mg.resultTimer -= dt;
      if (mg.resultTimer <= 0) {
        mg.result = null;
        mg.attempt++;
        if (mg.attempt >= mg.maxAttempts) {
          this._complete(mg.successes >= 2);
          return;
        }
        // Shrink green zone each attempt (proportional to base size)
        const shrinkPerAttempt = mg.baseGreenHalf * 0.2;
        const shrink = shrinkPerAttempt * mg.attempt;
        mg.greenStart = 0.5 - mg.baseGreenHalf + shrink;
        mg.greenEnd = 0.5 + mg.baseGreenHalf - shrink;
        mg.speed += 0.3;
      }
      return;
    }

    mg.position += mg.direction * mg.speed * dt;
    if (mg.position >= 1) { mg.position = 1; mg.direction = -1; }
    if (mg.position <= 0) { mg.position = 0; mg.direction = 1; }
  }

  _renderFilterJam() {
    const ctx = this._ctx;
    const mg = this._mg;
    const W = MINIGAME_SIZE;
    const H = MINIGAME_SIZE;

    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, W, H);

    // Draw track
    const trackY = H / 2 - 20;
    const trackH = 40;
    const margin = 20;
    const trackW = W - margin * 2;

    // Background bar
    ctx.fillStyle = '#222';
    ctx.fillRect(margin, trackY, trackW, trackH);

    // Green zone
    const gx = margin + mg.greenStart * trackW;
    const gw = (mg.greenEnd - mg.greenStart) * trackW;
    ctx.fillStyle = 'rgba(0, 228, 54, 0.3)';
    ctx.fillRect(gx, trackY, gw, trackH);
    ctx.strokeStyle = '#00e436';
    ctx.lineWidth = 2;
    ctx.strokeRect(gx, trackY, gw, trackH);

    // Indicator
    const ix = margin + mg.position * trackW;
    ctx.fillStyle = mg.result === 'hit' ? '#00e436' : mg.result === 'miss' ? '#ff004d' : '#ffec27';
    ctx.fillRect(ix - 3, trackY - 4, 6, trackH + 8);

    // Attempt display
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Attempt ${mg.attempt + 1} / ${mg.maxAttempts}`, W / 2, trackY - 16);

    // Success count
    ctx.fillText(`Hits: ${mg.successes} / ${mg.attempt + (mg.result ? 1 : 0)}`, W / 2, trackY + trackH + 24);

    // Result flash
    if (mg.result) {
      ctx.font = '14px monospace';
      ctx.fillStyle = mg.result === 'hit' ? '#00e436' : '#ff004d';
      ctx.fillText(mg.result === 'hit' ? 'HIT!' : 'MISS!', W / 2, H - 40);
    }
  }

  _clickFilterJam() {
    const mg = this._mg;
    if (mg.result) return;

    if (mg.position >= mg.greenStart && mg.position <= mg.greenEnd) {
      mg.result = 'hit';
      mg.successes++;
    } else {
      mg.result = 'miss';
    }
    mg.resultTimer = 0.6;
  }

  // ──────────────────────────────────────────────
  //  PIPE CONNECT (puzzle)
  //  5x5 grid of rotatable pipe pieces. Connect source to drain.
  //  15 second timer.
  // ──────────────────────────────────────────────

  _initPipeConnect() {
    const params = PIPE_CONNECT_PARAMS[this._effectiveTier] ?? PIPE_CONNECT_PARAMS[2];
    const gridSize = params.gridSize;
    const grid = [];

    // Pipe types: each has connection directions [top, right, bottom, left]
    // Straight: vertical [1,0,1,0] or horizontal [0,1,0,1]
    // Elbow: [1,1,0,0], [0,1,1,0], [0,0,1,1], [1,0,0,1]
    // T-piece: [1,1,1,0], [0,1,1,1], [1,0,1,1], [1,1,0,1]
    // Cross: [1,1,1,1]

    const pieceTypes = [
      { connections: [1, 0, 1, 0], name: 'straight' },  // vertical
      { connections: [1, 1, 0, 0], name: 'elbow' },
      { connections: [1, 1, 1, 0], name: 'tee' },
      { connections: [1, 1, 1, 1], name: 'cross' },
    ];

    // Generate a solvable path then fill rest with random
    // Simple approach: create path from left column to right column
    const path = this._generatePipePath(gridSize);

    for (let r = 0; r < gridSize; r++) {
      grid[r] = [];
      for (let c = 0; c < gridSize; c++) {
        const pathInfo = path.find(p => p.r === r && p.c === c);
        let piece;
        if (pathInfo) {
          piece = { ...pathInfo.piece };
        } else {
          // Random non-path piece
          const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
          piece = { connections: [...type.connections], name: type.name };
        }
        // Randomly rotate for initial puzzle state
        const rotations = Math.floor(Math.random() * 4);
        for (let i = 0; i < rotations; i++) {
          piece.connections = this._rotatePipe(piece.connections);
        }
        grid[r][c] = piece;
      }
    }

    this._mg = {
      grid,
      gridSize,
      sourceRow: Math.floor(gridSize / 2),
      drainRow: Math.floor(gridSize / 2),
      timer: params.timer,
      maxTimer: params.timer,
      waterLevel: 0,
      solved: false,
    };
    this._setInstructions('Click pipes to rotate. Connect source to drain!');
  }

  _generatePipePath(size) {
    // Simple path: go across from (mid, 0) to (mid, size-1)
    // with some random vertical jogs
    const path = [];
    let r = Math.floor(size / 2);
    const mid = r;

    for (let c = 0; c < size; c++) {
      // Determine needed connections based on movement
      const fromLeft = c > 0;
      const toRight = c < size - 1;

      // Occasionally jog vertically
      let nextR = r;
      if (c > 0 && c < size - 1 && Math.random() < 0.3) {
        nextR = Math.max(0, Math.min(size - 1, r + (Math.random() < 0.5 ? 1 : -1)));
      }

      if (nextR !== r && c < size - 1) {
        // Need a turn piece at current position
        const goDown = nextR > r;
        const connections = [0, 0, 0, 0];
        if (fromLeft) connections[3] = 1; // left
        if (goDown) connections[2] = 1;   // bottom
        else connections[0] = 1;          // top
        path.push({ r, c, piece: { connections, name: 'elbow' } });

        // Vertical segment
        r = nextR;
        const vConn = [0, 0, 0, 0];
        if (goDown) vConn[0] = 1; // top
        else vConn[2] = 1;        // bottom
        vConn[1] = 1;             // right (continue)
        path.push({ r, c: c, piece: { connections: vConn, name: 'elbow' } });
        // Remove duplicate column entry — just use the turn
        path.pop();

        const conn2 = [0, 0, 0, 0];
        if (goDown) conn2[0] = 1; else conn2[2] = 1;
        conn2[1] = 1; // right
        path.push({ r, c, piece: { connections: conn2, name: 'elbow' } });
      } else {
        // Straight horizontal
        const connections = [0, 0, 0, 0];
        if (fromLeft) connections[3] = 1;
        if (toRight) connections[1] = 1;
        // Source/drain edge pieces
        if (c === 0) connections[3] = 1;
        if (c === size - 1) connections[1] = 1;
        path.push({ r, c, piece: { connections, name: 'straight' } });
      }
    }

    // De-duplicate: keep last entry per (r,c)
    const map = new Map();
    for (const p of path) {
      map.set(`${p.r},${p.c}`, p);
    }
    return [...map.values()];
  }

  _rotatePipe(connections) {
    // Rotate clockwise: [top, right, bottom, left] -> [left, top, right, bottom]
    return [connections[3], connections[0], connections[1], connections[2]];
  }

  _checkPipeSolved() {
    const { grid, gridSize, sourceRow, drainRow } = this._mg;
    // BFS from source (sourceRow, col -1 which connects to col 0 via left)
    const visited = new Set();
    const queue = [{ r: sourceRow, c: 0 }];

    // Check if first piece connects left (to source)
    if (!grid[sourceRow][0].connections[3]) return false;

    while (queue.length > 0) {
      const { r, c } = queue.shift();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const piece = grid[r][c];

      // Check if we reached the drain
      if (c === gridSize - 1 && r === drainRow && piece.connections[1]) {
        return true;
      }

      // Check neighbors
      // Top
      if (r > 0 && piece.connections[0] && grid[r - 1][c].connections[2]) {
        queue.push({ r: r - 1, c });
      }
      // Right
      if (c < gridSize - 1 && piece.connections[1] && grid[r][c + 1].connections[3]) {
        queue.push({ r, c: c + 1 });
      }
      // Bottom
      if (r < gridSize - 1 && piece.connections[2] && grid[r + 1][c].connections[0]) {
        queue.push({ r: r + 1, c });
      }
      // Left
      if (c > 0 && piece.connections[3] && grid[r][c - 1].connections[1]) {
        queue.push({ r, c: c - 1 });
      }
    }
    return false;
  }

  _updatePipeConnect(dt) {
    const mg = this._mg;
    if (mg.solved) return;

    mg.timer -= dt;
    mg.waterLevel = Math.min(1, 1 - mg.timer / mg.maxTimer);

    if (mg.timer <= 0) {
      this._complete(false);
    }
  }

  _renderPipeConnect() {
    const ctx = this._ctx;
    const mg = this._mg;
    const W = MINIGAME_SIZE;
    const H = MINIGAME_SIZE;

    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, W, H);

    const cellSize = Math.floor((W - 40) / mg.gridSize);
    const offsetX = (W - cellSize * mg.gridSize) / 2;
    const offsetY = 30;

    // Draw grid
    for (let r = 0; r < mg.gridSize; r++) {
      for (let c = 0; c < mg.gridSize; c++) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        const piece = mg.grid[r][c];

        // Cell background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

        // Draw pipe connections
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        ctx.strokeStyle = '#29adff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        const half = cellSize / 2 - 2;
        const conn = piece.connections;

        ctx.beginPath();
        // Draw lines from center to edges based on connections
        if (conn[0]) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - half); }  // top
        if (conn[1]) { ctx.moveTo(cx, cy); ctx.lineTo(cx + half, cy); }  // right
        if (conn[2]) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + half); }  // bottom
        if (conn[3]) { ctx.moveTo(cx, cy); ctx.lineTo(cx - half, cy); }  // left
        ctx.stroke();

        // Center dot
        ctx.fillStyle = '#29adff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw source indicator (left side)
    const srcY = offsetY + mg.sourceRow * cellSize + cellSize / 2;
    ctx.fillStyle = '#00e436';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('IN', offsetX - 4, srcY + 4);
    ctx.fillRect(offsetX - 2, srcY - 3, 4, 6);

    // Draw drain indicator (right side)
    const drnY = offsetY + mg.drainRow * cellSize + cellSize / 2;
    const rightX = offsetX + mg.gridSize * cellSize;
    ctx.fillStyle = '#ff004d';
    ctx.textAlign = 'left';
    ctx.fillText('OUT', rightX + 4, drnY + 4);
    ctx.fillRect(rightX - 2, drnY - 3, 4, 6);

    // Timer / water level
    const timerY = offsetY + mg.gridSize * cellSize + 16;
    ctx.fillStyle = '#222';
    ctx.fillRect(offsetX, timerY, mg.gridSize * cellSize, 12);
    ctx.fillStyle = 'rgba(41, 173, 255, 0.5)';
    ctx.fillRect(offsetX, timerY, mg.gridSize * cellSize * mg.waterLevel, 12);
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(mg.timer)}s`, W / 2, timerY + 10);
  }

  _clickPipeConnect(canvasX, canvasY) {
    const mg = this._mg;
    if (mg.solved) return;

    const cellSize = Math.floor((MINIGAME_SIZE - 40) / mg.gridSize);
    const offsetX = (MINIGAME_SIZE - cellSize * mg.gridSize) / 2;
    const offsetY = 30;

    const c = Math.floor((canvasX - offsetX) / cellSize);
    const r = Math.floor((canvasY - offsetY) / cellSize);

    if (r < 0 || r >= mg.gridSize || c < 0 || c >= mg.gridSize) return;

    // Rotate the pipe piece
    mg.grid[r][c].connections = this._rotatePipe(mg.grid[r][c].connections);

    // Check if solved
    if (this._checkPipeSolved()) {
      mg.solved = true;
      setTimeout(() => this._complete(true), 500);
    }
  }

  // ──────────────────────────────────────────────
  //  BREAKER SEQUENCE (memory)
  //  4-6 breakers flash in sequence, player repeats.
  //  3 rounds, each round adds 1 breaker to sequence.
  // ──────────────────────────────────────────────

  _initBreakerSequence() {
    const params = BREAKER_SEQ_PARAMS[this._effectiveTier] ?? BREAKER_SEQ_PARAMS[2];
    const breakerCount = 5;
    // Generate enough sequence items for all rounds
    const maxLen = params.startLength + params.maxRounds;
    const fullSequence = [];
    for (let i = 0; i < maxLen; i++) {
      fullSequence.push(Math.floor(Math.random() * breakerCount));
    }

    this._mg = {
      breakerCount,
      sequence: fullSequence,
      round: 0,
      maxRounds: params.maxRounds,
      startLength: params.startLength,
      phase: 'showing',  // 'showing', 'input', 'result'
      showIndex: 0,
      showTimer: 0,
      inputIndex: 0,
      activeBreaker: -1,
      playerFlash: -1,
      playerFlashTimer: 0,
      resultTimer: 0,
      success: true,
      roundSuccesses: 0,
    };
    this._setInstructions('Watch the sequence, then repeat it!');
  }

  _getSequenceLength(round) {
    return (this._mg.startLength ?? 4) + round;
  }

  _updateBreakerSequence(dt) {
    const mg = this._mg;

    if (mg.phase === 'showing') {
      mg.showTimer -= dt;
      if (mg.showTimer <= 0) {
        const seqLen = this._getSequenceLength(mg.round);
        if (mg.showIndex < seqLen) {
          mg.activeBreaker = mg.sequence[mg.showIndex];
          mg.showTimer = 0.5;
          mg.showIndex++;
        } else {
          // Done showing — switch to input
          mg.activeBreaker = -1;
          mg.phase = 'input';
          mg.inputIndex = 0;
          this._setInstructions('Your turn! Click the breakers in order.');
        }
      } else if (mg.showTimer < 0.15) {
        mg.activeBreaker = -1; // brief off between flashes
      }
    }

    if (mg.phase === 'result') {
      mg.resultTimer -= dt;
      if (mg.resultTimer <= 0) {
        if (!mg.success) {
          this._complete(mg.roundSuccesses >= 2);
          return;
        }
        mg.round++;
        if (mg.round >= mg.maxRounds) {
          this._complete(true);
          return;
        }
        // Next round
        mg.phase = 'showing';
        mg.showIndex = 0;
        mg.showTimer = 0.5;
        mg.activeBreaker = -1;
        this._setInstructions('Watch the sequence...');
      }
    }

    // Player flash
    if (mg.playerFlashTimer > 0) {
      mg.playerFlashTimer -= dt;
      if (mg.playerFlashTimer <= 0) {
        mg.playerFlash = -1;
      }
    }
  }

  _renderBreakerSequence() {
    const ctx = this._ctx;
    const mg = this._mg;
    const W = MINIGAME_SIZE;
    const H = MINIGAME_SIZE;

    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, W, H);

    const breakerW = 36;
    const breakerH = 60;
    const gap = 8;
    const totalW = mg.breakerCount * breakerW + (mg.breakerCount - 1) * gap;
    const startX = (W - totalW) / 2;
    const startY = (H - breakerH) / 2;

    const colors = ['#ff004d', '#29adff', '#00e436', '#ffa300', '#c2c3c7'];

    for (let i = 0; i < mg.breakerCount; i++) {
      const x = startX + i * (breakerW + gap);
      const isActive = mg.activeBreaker === i || mg.playerFlash === i;
      const color = colors[i % colors.length];

      // Breaker body
      ctx.fillStyle = isActive ? color : '#2a2a3a';
      ctx.fillRect(x, startY, breakerW, breakerH);
      ctx.strokeStyle = isActive ? color : '#4a4a6a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, startY, breakerW, breakerH);

      // Handle
      const handleY = isActive ? startY + 10 : startY + breakerH - 22;
      ctx.fillStyle = isActive ? '#fff' : '#666';
      ctx.fillRect(x + 8, handleY, breakerW - 16, 12);

      // Label
      ctx.fillStyle = '#888';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, x + breakerW / 2, startY + breakerH + 12);
    }

    // Round display
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Round ${mg.round + 1} / ${mg.maxRounds}`, W / 2, 20);

    // Phase indicator
    if (mg.phase === 'showing') {
      ctx.fillStyle = '#ffec27';
      ctx.fillText('WATCH...', W / 2, H - 20);
    } else if (mg.phase === 'input') {
      ctx.fillStyle = '#00e436';
      const seqLen = this._getSequenceLength(mg.round);
      ctx.fillText(`Input ${mg.inputIndex + 1} / ${seqLen}`, W / 2, H - 20);
    } else if (mg.phase === 'result') {
      ctx.font = '14px monospace';
      ctx.fillStyle = mg.success ? '#00e436' : '#ff004d';
      ctx.fillText(mg.success ? 'CORRECT!' : 'WRONG!', W / 2, H - 20);
    }
  }

  _clickBreakerSequence(canvasX, canvasY) {
    const mg = this._mg;
    if (mg.phase !== 'input') return;

    const breakerW = 36;
    const breakerH = 60;
    const gap = 8;
    const totalW = mg.breakerCount * breakerW + (mg.breakerCount - 1) * gap;
    const startX = (MINIGAME_SIZE - totalW) / 2;
    const startY = (MINIGAME_SIZE - breakerH) / 2;

    // Find which breaker was clicked
    for (let i = 0; i < mg.breakerCount; i++) {
      const x = startX + i * (breakerW + gap);
      if (canvasX >= x && canvasX < x + breakerW &&
          canvasY >= startY && canvasY < startY + breakerH) {
        // Flash the clicked breaker
        mg.playerFlash = i;
        mg.playerFlashTimer = 0.2;

        const seqLen = this._getSequenceLength(mg.round);
        if (i === mg.sequence[mg.inputIndex]) {
          // Correct
          mg.inputIndex++;
          if (mg.inputIndex >= seqLen) {
            // Round complete
            mg.success = true;
            mg.roundSuccesses++;
            mg.phase = 'result';
            mg.resultTimer = 0.8;
          }
        } else {
          // Wrong
          mg.success = false;
          mg.phase = 'result';
          mg.resultTimer = 0.8;
        }
        return;
      }
    }
  }

  // ──────────────────────────────────────────────
  //  MAIN LOOP
  // ──────────────────────────────────────────────

  _lastTime = 0;

  _loop() {
    if (!this._active) return;

    const now = performance.now();
    const dt = this._lastTime ? Math.min((now - this._lastTime) / 1000, 0.1) : 0.016;
    this._lastTime = now;

    // Update
    switch (this._gameType) {
      case 'filterJam':      this._updateFilterJam(dt); break;
      case 'pipeConnect':    this._updatePipeConnect(dt); break;
      case 'breakerSequence': this._updateBreakerSequence(dt); break;
    }

    // Render
    if (this._ctx) {
      switch (this._gameType) {
        case 'filterJam':      this._renderFilterJam(); break;
        case 'pipeConnect':    this._renderPipeConnect(); break;
        case 'breakerSequence': this._renderBreakerSequence(); break;
      }
    }

    if (this._active) {
      this._animFrame = requestAnimationFrame(() => this._loop());
    }
  }

  // ──────────────────────────────────────────────
  //  INPUT
  // ──────────────────────────────────────────────

  _onClick(e) {
    if (!this._active || !this._canvas) return;

    const rect = this._canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (MINIGAME_SIZE / rect.width);
    const y = (e.clientY - rect.top) * (MINIGAME_SIZE / rect.height);

    switch (this._gameType) {
      case 'filterJam':      this._clickFilterJam(); break;
      case 'pipeConnect':    this._clickPipeConnect(x, y); break;
      case 'breakerSequence': this._clickBreakerSequence(x, y); break;
    }
  }

  _onMouseDown(e) {
    // Used for some games if needed, currently delegated to click
  }

  _setInstructions(text) {
    const el = this._overlay?.querySelector('#mg-instructions');
    if (el) el.textContent = text;
  }
}
