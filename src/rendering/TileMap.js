/**
 * TileMap — Grid-based stadium layout renderer.
 *
 * The stadium is represented as a 2D grid of tiles.
 * Each tile type corresponds to a section of the stadium cross-section.
 * Generates a default stadium layout on construction.
 *
 * The render() method draws a detailed pixel-art baseball stadium
 * cross-section with recognizable architectural features: steel trusses,
 * tiered seating, luxury suites, a baseball diamond, underground pipes,
 * and structural foundation.
 */

import PALETTE from '../assets/palette.js';
import { ZoneRenderer } from './ZoneRenderer.js';

const TILE_SIZE = 16;

// Tile type IDs
export const TILES = {
  EMPTY: 0,
  FLOOR: 1,
  WALL: 2,
  PIPE: 3,
  VENT_SLOT: 4,
  SEATING: 5,
  CONCOURSE: 6,
  LUXURY: 7,
  PRESS: 8,
  FIELD: 9,
  UNDERGROUND: 10,
  SKY: 11,
  ROOF: 12,
  UTILITY: 13,
};

// Base colors for each tile type (used for game logic highlights only)
const TILE_COLORS = {
  [TILES.EMPTY]:       null,
  [TILES.FLOOR]:       PALETTE.CONCRETE_DK,
  [TILES.WALL]:        PALETTE.CONCRETE,
  [TILES.PIPE]:        PALETTE.STEEL_DK,
  [TILES.VENT_SLOT]:   PALETTE.STEEL,
  [TILES.SEATING]:     PALETTE.BLUE,
  [TILES.CONCOURSE]:   PALETTE.CONCRETE_LT,
  [TILES.LUXURY]:      PALETTE.GOLD,
  [TILES.PRESS]:       PALETTE.INDIGO,
  [TILES.FIELD]:       PALETTE.GRASS,
  [TILES.UNDERGROUND]: PALETTE.DARK_GRAY,
  [TILES.SKY]:         PALETTE.DARK_BLUE,
  [TILES.ROOF]:        PALETTE.STEEL_LT,
  [TILES.UTILITY]:     PALETTE.BROWN,
};

/* ------------------------------------------------------------------ */
/*  Deterministic pseudo-random for repeatable decorative patterns     */
/* ------------------------------------------------------------------ */
function _hash(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296; // 0..1
}

/* 3x5 pixel font bitmaps for vent slot domain letters (A, W, H, D) */
function _ventSlotLetterMap() {
  return {
    A: [
      [0,1,0],
      [1,0,1],
      [1,1,1],
      [1,0,1],
      [1,0,1],
    ],
    W: [
      [1,0,1],
      [1,0,1],
      [1,0,1],
      [1,1,1],
      [0,1,0],
    ],
    H: [
      [1,0,1],
      [1,0,1],
      [1,1,1],
      [1,0,1],
      [1,0,1],
    ],
    D: [
      [1,1,0],
      [1,0,1],
      [1,0,1],
      [1,0,1],
      [1,1,0],
    ],
  };
}

export class TileMap {
  constructor() {
    this.tiles = [];
    this.cols = 0;
    this.rows = 0;
    this._ventSlots = []; // positions where filters can be placed
    this._detailCache = null; // cached off-screen canvas for static detail
    this._currentZone = 'field'; // track which zone is being rendered
    this._zoneRenderer = new ZoneRenderer(); // handles non-field zone art
    this.placementMode = null; // set externally: { domain } when placing a filter
    this.placementOccupied = null; // set externally: Set of "col,row" strings for occupied slots

    // Generate default stadium cross-section (30 cols x 20 rows)
    this._generateStadium();
  }

  /* ================================================================ */
  /*  Stadium grid generation (unchanged game logic)                  */
  /* ================================================================ */

  /**
   * Generate the default stadium cross-section layout.
   * 30 columns x 20 rows at 16px tiles = 480x320 (full canvas).
   */
  _generateStadium() {
    this.cols = 30;
    this.rows = 20;
    const T = TILES;

    // Initialize with empty
    this.tiles = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => T.EMPTY)
    );

    // Fill rows
    for (let col = 0; col < this.cols; col++) {
      // Sky (rows 0-2)
      for (let row = 0; row < 3; row++) {
        this.tiles[row][col] = T.SKY;
      }

      // Roof structure (row 3) - only over the stadium portion (cols 3-26)
      if (col >= 3 && col <= 26) {
        this.tiles[3][col] = T.ROOF;
      } else {
        this.tiles[3][col] = T.SKY;
      }

      // Upper seating (rows 4-5, cols 3-12 and 18-26)
      if ((col >= 3 && col <= 12) || (col >= 18 && col <= 26)) {
        this.tiles[4][col] = T.SEATING;
        this.tiles[5][col] = T.SEATING;
      } else if (col >= 13 && col <= 17) {
        // Open air above field
        this.tiles[4][col] = T.SKY;
        this.tiles[5][col] = T.SKY;
      }

      // Luxury boxes and press box (row 6)
      if (col >= 3 && col <= 7) {
        this.tiles[6][col] = T.LUXURY;
      } else if (col >= 8 && col <= 10) {
        this.tiles[6][col] = T.PRESS;
      } else if (col >= 11 && col <= 12) {
        this.tiles[6][col] = T.CONCOURSE;
      } else if (col >= 13 && col <= 17) {
        this.tiles[6][col] = T.SKY;
      } else if (col >= 18 && col <= 20) {
        this.tiles[6][col] = T.CONCOURSE;
      } else if (col >= 21 && col <= 23) {
        this.tiles[6][col] = T.PRESS;
      } else if (col >= 24 && col <= 26) {
        this.tiles[6][col] = T.LUXURY;
      }

      // Concourse (row 7)
      if (col >= 3 && col <= 26) {
        this.tiles[7][col] = T.CONCOURSE;
      }

      // Utility rooms / concessions (row 8)
      if (col >= 3 && col <= 26) {
        this.tiles[8][col] = T.UTILITY;
      }

      // HVAC / Mechanical rooms (row 9)
      if (col >= 3 && col <= 26) {
        this.tiles[9][col] = T.FLOOR;
      }

      // Walls (rows 10-11)
      if (col >= 2 && col <= 27) {
        this.tiles[10][col] = T.WALL;
        this.tiles[11][col] = T.WALL;
      }

      // Field level (row 12)
      if (col >= 4 && col <= 25) {
        this.tiles[12][col] = T.FIELD;
      } else if (col >= 2 && col <= 27) {
        this.tiles[12][col] = T.WALL;
      }

      // Below-field pipes (rows 13-14)
      if (col >= 3 && col <= 26) {
        this.tiles[13][col] = T.PIPE;
        this.tiles[14][col] = T.FLOOR;
      }

      // Underground (rows 15-17)
      if (col >= 3 && col <= 26) {
        this.tiles[15][col] = T.UNDERGROUND;
        this.tiles[16][col] = T.UNDERGROUND;
        this.tiles[17][col] = T.UNDERGROUND;
      }

      // Deep foundation (rows 18-19)
      if (col >= 2 && col <= 27) {
        this.tiles[18][col] = T.WALL;
        this.tiles[19][col] = T.WALL;
      }
    }

    // Add exterior walls on left/right edges of the stadium
    for (let row = 3; row <= 17; row++) {
      if (this.tiles[row][2] === TILES.EMPTY) this.tiles[row][2] = TILES.WALL;
      if (this.tiles[row][27] === TILES.EMPTY) this.tiles[row][27] = TILES.WALL;
    }

    // Invalidate cache
    this._detailCache = null;
  }

  /* ================================================================ */
  /*  Zone grid generators                                             */
  /* ================================================================ */

  /**
   * Generate concourse zone: fan walkways, concession stands, restrooms.
   * Returns { grid, ventSlots }.
   */
  _generateConcourseGrid() {
    const T = TILES;
    const rows = 20, cols = 30;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(T.EMPTY));
    const ventSlots = [];

    for (let col = 0; col < cols; col++) {
      // Rows 0-1: Ceiling / roof
      grid[0][col] = T.ROOF;
      grid[1][col] = T.ROOF;

      // Rows 2-3: Ductwork above ceiling
      grid[2][col] = T.PIPE;
      grid[3][col] = T.UTILITY;

      // Rows 4-15: Main concourse area
      for (let row = 4; row <= 15; row++) {
        grid[row][col] = T.CONCOURSE;
      }

      // Rows 16-19: Floor / foundation
      grid[16][col] = T.FLOOR;
      grid[17][col] = T.FLOOR;
      grid[18][col] = T.WALL;
      grid[19][col] = T.WALL;
    }

    // Concession stands (UTILITY blocks) along top wall
    for (const startCol of [2, 8, 15, 22]) {
      for (let c = startCol; c < startCol + 3 && c < cols; c++) {
        grid[4][c] = T.UTILITY;
        grid[5][c] = T.UTILITY;
      }
    }

    // Restroom blocks (PIPE for plumbing) — two blocks
    for (const startCol of [5, 20]) {
      for (let c = startCol; c < startCol + 4 && c < cols; c++) {
        grid[12][c] = T.PIPE;
        grid[13][c] = T.PIPE;
        grid[14][c] = T.WALL;
      }
    }

    // Side walls
    for (let row = 4; row <= 15; row++) {
      grid[row][0] = T.WALL;
      grid[row][cols - 1] = T.WALL;
    }

    // Vent slots — 4 in ceiling area (air domain)
    const ceilingVents = [4, 10, 18, 25];
    for (const c of ceilingVents) {
      grid[3][c] = T.VENT_SLOT;
      ventSlots.push({ col: c, row: 3, domain: 'air' });
    }

    // 3 near restrooms (water domain)
    const restroomVents = [{ col: 6, row: 12 }, { col: 21, row: 12 }, { col: 14, row: 13 }];
    for (const v of restroomVents) {
      grid[v.row][v.col] = T.VENT_SLOT;
      ventSlots.push({ ...v, domain: 'water' });
    }

    return { grid, ventSlots };
  }

  /**
   * Generate mechanical room zone: industrial equipment, pipes, electrical.
   * Returns { grid, ventSlots }.
   */
  _generateMechanicalGrid() {
    const T = TILES;
    const rows = 20, cols = 30;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(T.EMPTY));
    const ventSlots = [];

    for (let col = 0; col < cols; col++) {
      // Rows 0-2: Ceiling with exposed ductwork
      grid[0][col] = T.ROOF;
      grid[1][col] = T.PIPE;
      grid[2][col] = T.PIPE;

      // Rows 3-16: Main mechanical room
      for (let row = 3; row <= 16; row++) {
        grid[row][col] = T.FLOOR;
      }

      // Rows 17-19: Sub-floor / foundation
      grid[17][col] = T.WALL;
      grid[18][col] = T.WALL;
      grid[19][col] = T.UNDERGROUND;
    }

    // Equipment areas (UTILITY) — large equipment clusters
    for (const startCol of [2, 12, 22]) {
      for (let c = startCol; c < startCol + 5 && c < cols; c++) {
        for (let r = 4; r <= 8; r++) {
          grid[r][c] = T.UTILITY;
        }
      }
    }

    // Pipe runs across the room
    for (let col = 0; col < cols; col++) {
      grid[10][col] = T.PIPE;
      grid[14][col] = T.PIPE;
    }

    // Electrical sections (smaller UTILITY blocks)
    for (const startCol of [7, 18]) {
      for (let c = startCol; c < startCol + 3; c++) {
        grid[11][c] = T.UTILITY;
        grid[12][c] = T.UTILITY;
      }
    }

    // Side walls
    for (let row = 3; row <= 16; row++) {
      grid[row][0] = T.WALL;
      grid[row][cols - 1] = T.WALL;
    }

    // 8 vent slots: 4 hvac (top near equipment) + 4 air (pipe runs)
    const hvacVents = [
      { col: 3, row: 3 }, { col: 10, row: 3 }, { col: 20, row: 3 }, { col: 27, row: 3 },
    ];
    for (const v of hvacVents) {
      grid[v.row][v.col] = T.VENT_SLOT;
      ventSlots.push({ ...v, domain: 'hvac' });
    }
    const airVents = [
      { col: 6, row: 10 }, { col: 15, row: 10 }, { col: 24, row: 10 },
      { col: 14, row: 14 },
    ];
    for (const v of airVents) {
      grid[v.row][v.col] = T.VENT_SLOT;
      ventSlots.push({ ...v, domain: 'air' });
    }

    return { grid, ventSlots };
  }

  /**
   * Generate underground zone: tunnel system with pipes and walkways.
   * Returns { grid, ventSlots }.
   */
  _generateUndergroundGrid() {
    const T = TILES;
    const rows = 20, cols = 30;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(T.EMPTY));
    const ventSlots = [];

    for (let col = 0; col < cols; col++) {
      // Rows 0-4: Ceiling (concrete)
      for (let row = 0; row <= 4; row++) {
        grid[row][col] = T.WALL;
      }

      // Rows 5-14: Tunnel space
      for (let row = 5; row <= 14; row++) {
        grid[row][col] = T.UNDERGROUND;
      }

      // Rows 15-19: Deep foundation / water table
      for (let row = 15; row <= 17; row++) {
        grid[row][col] = T.WALL;
      }
      grid[18][col] = T.UNDERGROUND;
      grid[19][col] = T.UNDERGROUND;
    }

    // Main tunnel walkway (FLOOR)
    for (let col = 1; col < cols - 1; col++) {
      grid[9][col] = T.FLOOR;
      grid[10][col] = T.FLOOR;
    }

    // Pipe runs through tunnels
    for (let col = 0; col < cols; col++) {
      grid[6][col] = T.PIPE;
      grid[13][col] = T.PIPE;
    }

    // Cross-tunnel passages
    for (let row = 5; row <= 14; row++) {
      grid[row][10] = T.FLOOR;
      grid[row][20] = T.FLOOR;
    }

    // Pump stations (UTILITY)
    for (const startCol of [4, 14, 25]) {
      for (let c = startCol; c < startCol + 3 && c < cols; c++) {
        grid[7][c] = T.UTILITY;
        grid[8][c] = T.UTILITY;
      }
    }

    // Side walls at tunnel edges
    for (let row = 5; row <= 14; row++) {
      grid[row][0] = T.WALL;
      grid[row][cols - 1] = T.WALL;
    }

    // 7 vent slots — 4 drainage (pipe runs) + 3 water (pump stations)
    const drainVents = [
      { col: 5, row: 6 }, { col: 15, row: 6 }, { col: 25, row: 6 },
      { col: 8, row: 13 },
    ];
    for (const v of drainVents) {
      grid[v.row][v.col] = T.VENT_SLOT;
      ventSlots.push({ ...v, domain: 'drainage' });
    }
    const waterVents = [
      { col: 10, row: 9 }, { col: 20, row: 9 },
      { col: 22, row: 13 },
    ];
    for (const v of waterVents) {
      grid[v.row][v.col] = T.VENT_SLOT;
      ventSlots.push({ ...v, domain: 'water' });
    }

    return { grid, ventSlots };
  }

  /**
   * Generate luxury suites zone: upscale interiors with windows.
   * Returns { grid, ventSlots }.
   */
  _generateLuxuryGrid() {
    const T = TILES;
    const rows = 20, cols = 30;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(T.EMPTY));
    const ventSlots = [];

    for (let col = 0; col < cols; col++) {
      // Rows 0-1: Ceiling
      grid[0][col] = T.ROOF;
      grid[1][col] = T.ROOF;

      // Rows 2-3: Hidden HVAC ductwork
      grid[2][col] = T.PIPE;
      grid[3][col] = T.UTILITY;

      // Rows 4-14: Suite interiors
      for (let row = 4; row <= 14; row++) {
        grid[row][col] = T.LUXURY;
      }

      // Rows 15-19: Floor structure
      grid[15][col] = T.FLOOR;
      grid[16][col] = T.FLOOR;
      grid[17][col] = T.WALL;
      grid[18][col] = T.WALL;
      grid[19][col] = T.WALL;
    }

    // Window areas showing FIELD/SKY (cols 10-19)
    for (let col = 10; col <= 19; col++) {
      grid[4][col] = T.SKY;
      grid[5][col] = T.SKY;
      grid[6][col] = T.FIELD;
      grid[7][col] = T.FIELD;
    }

    // Suite divider walls
    for (let row = 4; row <= 14; row++) {
      grid[row][0] = T.WALL;
      grid[row][9] = T.WALL;
      grid[row][20] = T.WALL;
      grid[row][cols - 1] = T.WALL;
    }

    // Bar / service areas (UTILITY)
    for (const startCol of [2, 23]) {
      for (let c = startCol; c < startCol + 4; c++) {
        grid[12][c] = T.UTILITY;
        grid[13][c] = T.UTILITY;
      }
    }

    // 5 vent slots — 3 air (ceiling) + 2 hvac (wall units)
    const airVents = [
      { col: 5, row: 3 }, { col: 15, row: 3 }, { col: 25, row: 3 },
    ];
    for (const v of airVents) {
      grid[v.row][v.col] = T.VENT_SLOT;
      ventSlots.push({ ...v, domain: 'air' });
    }
    const hvacVents = [
      { col: 3, row: 8 }, { col: 26, row: 8 },
    ];
    for (const v of hvacVents) {
      grid[v.row][v.col] = T.VENT_SLOT;
      ventSlots.push({ ...v, domain: 'hvac' });
    }

    return { grid, ventSlots };
  }

  /**
   * Generate press box zone: tech-filled room with windows overlooking field.
   * Returns { grid, ventSlots }.
   */
  _generatePressboxGrid() {
    const T = TILES;
    const rows = 20, cols = 30;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(T.EMPTY));
    const ventSlots = [];

    for (let col = 0; col < cols; col++) {
      // Rows 0-1: Roof
      grid[0][col] = T.ROOF;
      grid[1][col] = T.ROOF;

      // Rows 2-15: Press room
      for (let row = 2; row <= 15; row++) {
        grid[row][col] = T.PRESS;
      }

      // Rows 16-19: Floor
      grid[16][col] = T.FLOOR;
      grid[17][col] = T.FLOOR;
      grid[18][col] = T.WALL;
      grid[19][col] = T.WALL;
    }

    // Windows overlooking field (large window wall, cols 5-24, rows 3-6)
    for (let col = 5; col <= 24; col++) {
      grid[3][col] = T.SKY;
      grid[4][col] = T.SKY;
      grid[5][col] = T.FIELD;
      grid[6][col] = T.FIELD;
    }

    // Equipment / desk areas (UTILITY)
    for (const startCol of [1, 8, 15, 22]) {
      for (let c = startCol; c < startCol + 5 && c < cols; c++) {
        grid[10][c] = T.UTILITY;
        grid[11][c] = T.UTILITY;
      }
    }

    // Broadcast equipment (larger UTILITY blocks)
    for (let c = 2; c <= 5; c++) {
      grid[13][c] = T.UTILITY;
      grid[14][c] = T.UTILITY;
    }

    // Side walls
    for (let row = 2; row <= 15; row++) {
      grid[row][0] = T.WALL;
      grid[row][cols - 1] = T.WALL;
    }

    // 4 vent slots — 2 air (ceiling) + 2 hvac (near equipment)
    const airVents = [
      { col: 7, row: 2 }, { col: 22, row: 2 },
    ];
    for (const v of airVents) {
      grid[v.row][v.col] = T.VENT_SLOT;
      ventSlots.push({ ...v, domain: 'air' });
    }
    const hvacVents = [
      { col: 10, row: 10 }, { col: 20, row: 10 },
    ];
    for (const v of hvacVents) {
      grid[v.row][v.col] = T.VENT_SLOT;
      ventSlots.push({ ...v, domain: 'hvac' });
    }

    return { grid, ventSlots };
  }

  /* ================================================================ */
  /*  Grid helpers (unchanged)                                        */
  /* ================================================================ */

  load(data) {
    this.tiles = data;
    this.rows = data.length;
    this.cols = data[0]?.length ?? 0;
    this._detailCache = null;
  }

  /**
   * Replace the current grid with a new one (used by ZoneManager for zone switching).
   */
  setConsequenceRenderer(cr) {
    this._consequenceRenderer = cr;
  }

  setGrid(grid, ventSlots, zoneId) {
    this.tiles = grid;
    this.rows = grid.length;
    this.cols = grid[0]?.length ?? 0;
    this._ventSlots = ventSlots ?? [];
    this._currentZone = zoneId ?? 'field';
    this._detailCache = null;
  }

  getTile(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return -1;
    return this.tiles[row][col];
  }

  setTile(col, row, tileId) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    this.tiles[row][col] = tileId;
    this._detailCache = null; // invalidate on change
  }

  getVentSlots() {
    return this._ventSlots;
  }

  isVentSlot(col, row) {
    return this.getTile(col, row) === TILES.VENT_SLOT;
  }

  /**
   * Get the vent slot definition at a grid position (includes domain).
   * Returns { col, row, domain } or null.
   */
  getVentSlotAt(col, row) {
    return this._ventSlots.find(s => s.col === col && s.row === row) ?? null;
  }

  pixelToGrid(px, py) {
    return {
      col: Math.floor(px / TILE_SIZE),
      row: Math.floor(py / TILE_SIZE),
    };
  }

  gridToPixel(col, row) {
    return {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
    };
  }

  get tileSize() {
    return TILE_SIZE;
  }

  /* ================================================================ */
  /*  RENDERING — Main entry point                                    */
  /* ================================================================ */

  render(renderer, state) {
    // Build the static detail cache once (or when invalidated)
    if (!this._detailCache) {
      this._buildDetailCache();
    }

    // Blit the cached stadium image
    const ctx = renderer.ctx;
    const ox = Math.floor(-renderer.cameraX);
    const oy = Math.floor(-renderer.cameraY);
    ctx.drawImage(this._detailCache, ox, oy);

    // Draw animated / state-dependent overlays
    this._renderAnimated(renderer, state);

    // Draw condition-based consequence overlays
    if (this._consequenceRenderer) {
      this._consequenceRenderer.renderConsequences(state.currentZone ?? 'field', renderer, state);
    }
  }

  /* ================================================================ */
  /*  Static detail cache — drawn once into an offscreen canvas       */
  /* ================================================================ */

  _buildDetailCache() {
    // For non-field zones, delegate to ZoneRenderer
    if (this._currentZone !== 'field') {
      this._detailCache = this._zoneRenderer.buildZoneCache(
        this._currentZone, this.tiles, this.cols, this.rows, this._ventSlots
      );
      return;
    }

    const w = this.cols * TILE_SIZE;  // 480
    const h = this.rows * TILE_SIZE;  // 320
    const canvas = (typeof OffscreenCanvas !== 'undefined')
      ? new OffscreenCanvas(w, h)
      : (() => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; })();
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Helper to draw a filled rect on the cache
    const rect = (x, y, rw, rh, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, rw, rh);
    };
    // Helper to draw a single pixel
    const px = (x, y, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    };
    // Helper to draw a line
    const line = (x1, y1, x2, y2, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
      ctx.lineTo(Math.floor(x2) + 0.5, Math.floor(y2) + 0.5);
      ctx.stroke();
    };

    // Draw each section layer by layer, bottom to top
    this._drawSky(ctx, rect, px);
    this._drawExteriorWalls(ctx, rect, px, line);
    this._drawFoundation(ctx, rect, px);
    this._drawUnderground(ctx, rect, px, line);
    this._drawBelowFieldPipes(ctx, rect, px, line);
    this._drawStructuralWalls(ctx, rect, px, line);
    this._drawField(ctx, rect, px, line);
    this._drawMechanical(ctx, rect, px, line);
    this._drawUtility(ctx, rect, px, line);
    this._drawConcourse(ctx, rect, px, line);
    this._drawLuxuryBoxes(ctx, rect, px, line);
    this._drawPressBox(ctx, rect, px, line);
    this._drawSeating(ctx, rect, px);
    this._drawScoreboard(ctx, rect, px, line);
    this._drawRoof(ctx, rect, px, line);
    this._drawStadiumLights(ctx, rect, px);
    this._drawVentSlots(ctx, rect, px);

    this._detailCache = canvas;
  }

  /* ================================================================ */
  /*  SKY — rows 0-2 gradient + clouds + sun                         */
  /* ================================================================ */

  _drawSky(ctx, rect, px) {
    const skyColors = [PALETTE.NAVY, PALETTE.DARK_BLUE, PALETTE.BLUE];
    const W = this.cols * TILE_SIZE;

    // Three rows, top = darkest
    for (let row = 0; row < 3; row++) {
      const y = row * TILE_SIZE;
      // Sub-gradient within each row
      for (let sy = 0; sy < TILE_SIZE; sy++) {
        const t = (row * TILE_SIZE + sy) / (3 * TILE_SIZE);
        // Lerp navy -> dark_blue -> blue
        const color = t < 0.5
          ? _lerpColor(PALETTE.NAVY, PALETTE.DARK_BLUE, t * 2)
          : _lerpColor(PALETTE.DARK_BLUE, PALETTE.BLUE, (t - 0.5) * 2);
        rect(0, y + sy, W, 1, color);
      }
    }

    // Also fill sky tiles in rows 3-6 (open air above field, cols 13-17 and outside stadium)
    for (let row = 3; row <= 6; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.tiles[row][col] === TILES.SKY) {
          const ty = row * TILE_SIZE;
          for (let sy = 0; sy < TILE_SIZE; sy++) {
            const t = Math.min(1, (row * TILE_SIZE + sy) / (7 * TILE_SIZE));
            const color = t < 0.5
              ? _lerpColor(PALETTE.NAVY, PALETTE.DARK_BLUE, t * 2)
              : _lerpColor(PALETTE.DARK_BLUE, PALETTE.BLUE, (t - 0.5) * 2);
            rect(col * TILE_SIZE, ty + sy, TILE_SIZE, 1, color);
          }
        }
      }
    }

    // Sun (upper right, partially in sky area)
    const sunX = 440;
    const sunY = 10;
    // Glow halo
    ctx.globalAlpha = 0.15;
    for (let r = 12; r >= 1; r--) {
      ctx.fillStyle = PALETTE.YELLOW;
      ctx.beginPath();
      ctx.arc(sunX, sunY, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.3;
    for (let r = 7; r >= 1; r--) {
      ctx.fillStyle = PALETTE.ORANGE;
      ctx.beginPath();
      ctx.arc(sunX, sunY, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Bright core
    ctx.fillStyle = PALETTE.YELLOW;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.WHITE;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Sun rays (faint yellow diagonals radiating from sun)
    ctx.globalAlpha = 0.04;
    const rayAngles = [-0.6, -0.3, 0, 0.3, 0.6, 0.9, -0.9];
    for (const angle of rayAngles) {
      for (let r = 10; r < 50; r++) {
        const rx = sunX + Math.cos(angle) * r;
        const ry = sunY + Math.sin(angle) * r;
        if (ry > 0 && ry < 3 * TILE_SIZE && rx > 0 && rx < W) {
          rect(Math.floor(rx), Math.floor(ry), 2, 1, PALETTE.YELLOW);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Sunset glow along horizon (row 2 bottom)
    ctx.globalAlpha = 0.12;
    rect(0, 2 * TILE_SIZE + 10, this.cols * TILE_SIZE, 6, PALETTE.ORANGE);
    ctx.globalAlpha = 0.08;
    rect(0, 2 * TILE_SIZE + 6, this.cols * TILE_SIZE, 10, PALETTE.PEACH);
    ctx.globalAlpha = 1;

    // Clouds — multi-pixel clusters with shading
    const clouds = [
      [30, 8], [55, 5], [90, 12], [150, 7], [200, 14],
      [260, 4], [310, 10], [370, 6], [410, 15], [130, 20],
      [80, 28], [320, 25], [460, 20],
    ];
    for (const [cx, cy] of clouds) {
      if (cy < 3 * TILE_SIZE) {
        const size = 1 + Math.floor(_hash(cx, cy, 2) * 3); // cloud size variation
        // Cloud body (bright core)
        ctx.globalAlpha = 0.3 + _hash(cx, cy) * 0.15;
        for (let dx = -size; dx <= size + 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist <= size + 1) {
              // Bright top, darker bottom for shading
              const shade = dy <= 0 ? PALETTE.WHITE : PALETTE.LIGHT_GRAY;
              px(cx + dx, cy + dy, shade);
            }
          }
        }
        // Bottom shadow
        ctx.globalAlpha = 0.1;
        for (let dx = -size; dx <= size; dx++) {
          px(cx + dx, cy + 2, PALETTE.INDIGO);
        }
        ctx.globalAlpha = 1;
      }
    }

    // Tiny bird silhouettes (V shapes in sky)
    const birds = [[70, 18], [180, 22], [350, 12], [420, 26]];
    ctx.globalAlpha = 0.2;
    for (const [bx, by] of birds) {
      if (by < 3 * TILE_SIZE - 4) {
        // V-shaped bird (3px wide)
        px(bx, by, PALETTE.DARK_GRAY);
        px(bx + 1, by + 1, PALETTE.DARK_GRAY);
        px(bx + 2, by, PALETTE.DARK_GRAY);
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ================================================================ */
  /*  ROOF — row 3, steel truss/beam structure                        */
  /* ================================================================ */

  _drawRoof(ctx, rect, px, line) {
    const y = 3 * TILE_SIZE;

    for (let col = 3; col <= 26; col++) {
      const x = col * TILE_SIZE;

      // Base beam — dark steel
      rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.STEEL_DK);

      // Upper flange
      rect(x, y, TILE_SIZE, 3, PALETTE.STEEL_LT);
      // Lower flange
      rect(x, y + 13, TILE_SIZE, 3, PALETTE.STEEL_LT);

      // Web (vertical stiffener pattern)
      rect(x, y + 3, TILE_SIZE, 10, PALETTE.STEEL);

      // Truss diagonal braces every 2 tiles
      if (col % 2 === 0) {
        // Diagonal going right-down
        for (let i = 0; i < 10; i++) {
          const dx = x + Math.floor(i * TILE_SIZE / 10);
          px(dx, y + 3 + i, PALETTE.STEEL_LT);
        }
      } else {
        // Diagonal going left-down
        for (let i = 0; i < 10; i++) {
          const dx = x + TILE_SIZE - 1 - Math.floor(i * TILE_SIZE / 10);
          px(dx, y + 3 + i, PALETTE.STEEL_LT);
        }
      }

      // Rivet dots along flanges
      if (col % 2 === 0) {
        px(x + 3, y + 1, PALETTE.BRUSHED_STEEL);
        px(x + 8, y + 1, PALETTE.BRUSHED_STEEL);
        px(x + 13, y + 1, PALETTE.BRUSHED_STEEL);
        px(x + 3, y + 14, PALETTE.BRUSHED_STEEL);
        px(x + 8, y + 14, PALETTE.BRUSHED_STEEL);
        px(x + 13, y + 14, PALETTE.BRUSHED_STEEL);
      } else {
        px(x + 5, y + 1, PALETTE.DARK_IRON);
        px(x + 10, y + 1, PALETTE.DARK_IRON);
        px(x + 5, y + 14, PALETTE.DARK_IRON);
        px(x + 10, y + 14, PALETTE.DARK_IRON);
      }

      // Vertical stiffener plates every 4 tiles
      if (col % 4 === 0) {
        rect(x + 7, y + 3, 2, 10, PALETTE.STEEL_LT);
      }
    }

    // Horizontal bolted connection line along top
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x += 4) {
      px(x, y, PALETTE.BRUSHED_STEEL);
    }

    // Pennant flags on stadium roof (small triangles in team colors)
    const pennantCols = [5, 8, 12, 15, 18, 21, 24];
    const pennantColors = [PALETTE.RED, PALETTE.NAVY, PALETTE.RED, PALETTE.GOLD, PALETTE.NAVY, PALETTE.RED, PALETTE.NAVY];
    for (let i = 0; i < pennantCols.length; i++) {
      const px_ = pennantCols[i] * TILE_SIZE + 7;
      const py_ = y - 2;
      const pc = pennantColors[i];
      // Flagpole
      px(px_, py_, PALETTE.STEEL_DK);
      px(px_, py_ - 1, PALETTE.STEEL_DK);
      px(px_, py_ - 2, PALETTE.STEEL_DK);
      // Triangle pennant (3px tall hanging right)
      px(px_ + 1, py_ - 2, pc);
      px(px_ + 1, py_ - 1, pc);
      px(px_ + 2, py_ - 1, pc);
      px(px_ + 1, py_, pc);
      px(px_ + 2, py_, pc);
      px(px_ + 3, py_, pc);
    }
  }

  /* ================================================================ */
  /*  STADIUM LIGHTS — tall towers at roof edges                      */
  /* ================================================================ */

  _drawStadiumLights(ctx, rect, px) {
    const lightPositions = [3, 4, 25, 26]; // columns at roof edges
    const roofY = 3 * TILE_SIZE;

    for (const col of lightPositions) {
      const x = col * TILE_SIZE + 7;

      // Light pole (extends up from roof into sky)
      for (let ly = roofY - 14; ly < roofY; ly++) {
        px(x, ly, PALETTE.STEEL_DK);
        px(x + 1, ly, PALETTE.STEEL);
      }

      // Cross-arm at top
      rect(x - 3, roofY - 14, 8, 2, PALETTE.STEEL);
      rect(x - 3, roofY - 14, 8, 1, PALETTE.STEEL_LT);

      // Light bulbs (bright spots)
      const bulbs = [x - 3, x - 1, x + 1, x + 3];
      for (const bx of bulbs) {
        px(bx, roofY - 16, PALETTE.YELLOW);
        px(bx, roofY - 15, PALETTE.WHITE);
        px(bx + 1, roofY - 16, PALETTE.YELLOW);
        px(bx + 1, roofY - 15, PALETTE.WARM_WHITE);
      }

      // Light glow (semi-transparent halo below bulbs)
      ctx.globalAlpha = 0.08;
      for (let gy = roofY - 13; gy < roofY - 4; gy++) {
        const spread = (gy - (roofY - 13)) * 0.6;
        rect(x - 4 - spread, gy, 10 + spread * 2, 1, PALETTE.YELLOW);
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ================================================================ */
  /*  SEATING TIERS — rows 4-5                                        */
  /* ================================================================ */

  _drawSeating(ctx, rect, px) {
    const seatSections = [
      { startCol: 3, endCol: 12 },   // left stands
      { startCol: 18, endCol: 26 },  // right stands
    ];

    // Seat colors for variety (different sections get different colors)
    const seatPalettes = [
      [PALETTE.BLUE, PALETTE.DARK_BLUE],
      [PALETTE.RED, PALETTE.CRIMSON],
      [PALETTE.ORANGE, PALETTE.BROWN],
      [PALETTE.TEAL, PALETTE.DARK_GREEN],
    ];

    for (const section of seatSections) {
      for (let row = 4; row <= 5; row++) {
        const y = row * TILE_SIZE;

        for (let col = section.startCol; col <= section.endCol; col++) {
          const x = col * TILE_SIZE;

          // Concrete riser base
          rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.CONCRETE_DK);

          // Tiered step — top portion is the seat surface, bottom is the riser wall
          const stepH = row === 4 ? 4 : 3;
          rect(x, y + TILE_SIZE - stepH, TILE_SIZE, stepH, PALETTE.CONCRETE);

          // Draw individual seats (2px wide, 3px tall, 4 seats per tile)
          const palIdx = (col - section.startCol) % seatPalettes.length;
          const [seatColor, seatDark] = seatPalettes[palIdx];

          for (let s = 0; s < 4; s++) {
            const sx = x + 1 + s * 4;
            const sy = y + 2 + (row === 5 ? 1 : 0);

            // Seat back
            rect(sx, sy, 3, 1, seatDark);
            // Seat bottom
            rect(sx, sy + 1, 3, 2, seatColor);
            // Fan figures are drawn dynamically in _renderAnimated based on attendance
          }

          // Aisle markers at section boundaries
          if (col === section.startCol || col === section.endCol) {
            rect(x + (col === section.startCol ? 0 : 14), y, 2, TILE_SIZE, PALETTE.CONCRETE_LT);
          }
        }

        // Row number markings (tiny)
        const numX = section.startCol * TILE_SIZE + 2;
        ctx.fillStyle = PALETTE.LIGHT_GRAY;
        ctx.font = '5px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(row === 4 ? '300' : '200', numX, y + 11);
      }
    }
  }

  /* ================================================================ */
  /*  SCOREBOARD — open sky area cols 13-17, rows 4-5                 */
  /* ================================================================ */

  _drawScoreboard(ctx, rect, px, line) {
    // The scoreboard sits in the open sky between the two seating sections
    // Using full 5-tile width (cols 13-17) and 2-tile height (rows 4-5)
    const boardX = 13 * TILE_SIZE;
    const boardY = 4 * TILE_SIZE;
    const boardW = 5 * TILE_SIZE;
    const boardH = 2 * TILE_SIZE;

    // Scoreboard frame — dark iron border with navy background
    rect(boardX - 1, boardY - 1, boardW + 2, boardH + 2, PALETTE.DARK_IRON);
    rect(boardX, boardY, boardW, boardH, '#0a0a1a');

    // Inner border highlight
    rect(boardX + 1, boardY + 1, boardW - 2, 1, PALETTE.STEEL_DK);
    rect(boardX + 1, boardY + boardH - 2, boardW - 2, 1, PALETTE.STEEL_DK);

    // Horizontal divider between scores and inning row
    rect(boardX + 2, boardY + 20, boardW - 4, 1, '#1a2a4a');

    // Vertical divider between team labels and scores
    rect(boardX + 22, boardY + 2, 1, 18, '#1a2a4a');

    // LED dots around the frame for decoration
    for (let dx = boardX + 3; dx < boardX + boardW - 2; dx += 4) {
      px(dx, boardY, PALETTE.GOLD);
      px(dx, boardY + boardH - 1, PALETTE.GOLD);
    }
    for (let dy = boardY + 3; dy < boardY + boardH - 2; dy += 4) {
      px(boardX, dy, PALETTE.GOLD);
      px(boardX + boardW - 1, dy, PALETTE.GOLD);
    }

    // Support struts from top
    line(boardX + 12, boardY - 1, boardX + 12, boardY - 6, PALETTE.STEEL_DK);
    line(boardX + boardW - 12, boardY - 1, boardX + boardW - 12, boardY - 6, PALETTE.STEEL_DK);
  }

  // ── Pixel-art LED digit renderer (3x5 px per digit) ──────────────
  // Each digit is a bitmask of 15 bits (3 columns × 5 rows, MSB = top-left).

  static _LED_DIGITS = [
    0x7B6F, // 0: 111 101 101 101 111
    0x2492, // 1: 010 010 010 010 010
    0x73E7, // 2: 111 001 111 100 111
    0x73CF, // 3: 111 001 111 001 111
    0x5BC9, // 4: 101 101 111 001 001
    0x79CF, // 5: 111 100 111 001 111
    0x79EF, // 6: 111 100 111 101 111
    0x7249, // 7: 111 001 001 001 001
    0x7BEF, // 8: 111 101 111 101 111
    0x7BCF, // 9: 111 101 111 001 111
  ];

  // 3x5 pixel-art uppercase letters for team labels
  static _LED_LETTERS = {
    R: [1,1,0, 1,0,1, 1,1,0, 1,0,1, 1,0,1],
    A: [0,1,0, 1,0,1, 1,1,1, 1,0,1, 1,0,1],
    P: [1,1,0, 1,0,1, 1,1,0, 1,0,0, 1,0,0],
    V: [1,0,1, 1,0,1, 1,0,1, 0,1,0, 0,1,0],
    I: [1,1,1, 0,1,0, 0,1,0, 0,1,0, 1,1,1],
    S: [0,1,1, 1,0,0, 0,1,0, 0,0,1, 1,1,0],
    G: [0,1,1, 1,0,0, 1,0,1, 1,0,1, 0,1,1],
    M: [1,0,1, 1,1,1, 1,1,1, 1,0,1, 1,0,1],
    T: [1,1,1, 0,1,0, 0,1,0, 0,1,0, 0,1,0],
    O: [0,1,0, 1,0,1, 1,0,1, 1,0,1, 0,1,0],
    B: [1,1,0, 1,0,1, 1,1,0, 1,0,1, 1,1,0],
    N: [1,0,1, 1,1,1, 1,1,1, 1,0,1, 1,0,1],
    D: [1,1,0, 1,0,1, 1,0,1, 1,0,1, 1,1,0],
    Y: [1,0,1, 1,0,1, 0,1,0, 0,1,0, 0,1,0],
    E: [1,1,1, 1,0,0, 1,1,0, 1,0,0, 1,1,1],
    F: [1,1,1, 1,0,0, 1,1,0, 1,0,0, 1,0,0],
    H: [1,0,1, 1,0,1, 1,1,1, 1,0,1, 1,0,1],
    L: [1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,1,1],
    W: [1,0,1, 1,0,1, 1,1,1, 1,1,1, 1,0,1],
    C: [0,1,1, 1,0,0, 1,0,0, 1,0,0, 0,1,1],
    K: [1,0,1, 1,1,0, 1,0,0, 1,1,0, 1,0,1],
    U: [1,0,1, 1,0,1, 1,0,1, 1,0,1, 0,1,0],
    X: [1,0,1, 1,0,1, 0,1,0, 1,0,1, 1,0,1],
    J: [0,0,1, 0,0,1, 0,0,1, 1,0,1, 0,1,0],
    Q: [0,1,0, 1,0,1, 1,0,1, 1,1,1, 0,1,1],
    Z: [1,1,1, 0,0,1, 0,1,0, 1,0,0, 1,1,1],
  };

  _drawLedDigit(renderer, x, y, digit, color) {
    const bitmasks = TileMap._LED_DIGITS;
    const bits = bitmasks[digit] ?? bitmasks[0];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        const bitIdx = 14 - (row * 3 + col);
        if ((bits >> bitIdx) & 1) {
          renderer.drawPixel(x + col, y + row, color);
        }
      }
    }
  }

  _drawLedNumber(renderer, x, y, num, color, align) {
    const str = String(num);
    let startX = x;
    if (align === 'right') startX = x - str.length * 4 + 1;
    else if (align === 'center') startX = x - Math.floor(str.length * 4 / 2);
    for (let i = 0; i < str.length; i++) {
      this._drawLedDigit(renderer, startX + i * 4, y, parseInt(str[i], 10), color);
    }
  }

  _drawLedText(renderer, x, y, text, color) {
    const letters = TileMap._LED_LETTERS;
    let cx = x;
    for (const ch of text) {
      const bits = letters[ch];
      if (bits) {
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 3; col++) {
            if (bits[row * 3 + col]) {
              renderer.drawPixel(cx + col, y + row, color);
            }
          }
        }
      }
      cx += 4;
    }
  }

  /**
   * Render dynamic scoreboard data (scores, inning, attendance) from game state.
   * Called every frame from _renderAnimated so it stays up to date.
   */
  _renderScoreboardData(renderer, state, t) {
    const boardX = 13 * TILE_SIZE;
    const boardY = 4 * TILE_SIZE;
    const boardW = 5 * TILE_SIZE;

    // During off-season, show off-season status instead of game scores
    if (state?.offSeason) {
      // Clear board content areas
      renderer.drawRect(boardX + 3, boardY + 3, boardW - 6, 28, '#0a0a1a');
      this._drawLedText(renderer, boardX + 10, boardY + 6, 'OFF', '#29adff');
      this._drawLedText(renderer, boardX + 10, boardY + 14, 'SEASON', '#29adff');
      const daysLeft = state.offSeasonDaysLeft ?? 0;
      this._drawLedNumber(renderer, boardX + 50, boardY + 14, daysLeft, PALETTE.GOLD, 'left');
      return;
    }

    const inning = state?.inning ?? 1;
    const gameDay = state?.gameDay ?? 1;
    const innings = state?.config?.inningsPerGame ?? 9;

    // Generate deterministic scores from game day seed
    const teamPerf = state?.teamPerformanceModifier ?? 1.0;
    const seed = gameDay * 7919;
    let homeScore = 0;
    let awayScore = 0;
    for (let i = 1; i <= Math.min(inning, innings); i++) {
      const h = ((seed + i * 3571) % 100);
      const a = ((seed + i * 2447 + 31) % 100);
      const homeThreshold = teamPerf > 1.1 ? 55 : teamPerf < 0.9 ? 75 : 65;
      if (h > homeThreshold) homeScore++;
      if (h > 90) homeScore++;
      if (a > 65) awayScore++;
      if (a > 92) awayScore++;
    }

    // Clear dynamic content areas
    renderer.drawRect(boardX + 24, boardY + 3, boardW - 26, 17, '#0a0a1a');
    renderer.drawRect(boardX + 3, boardY + 22, boardW - 6, 8, '#0a0a1a');

    // ── Top section: Team labels + scores ──────────────────────

    // RAP label (pixel art, row 1)
    this._drawLedText(renderer, boardX + 4, boardY + 4, 'RAP', PALETTE.WHITE);
    // VIS label (pixel art, row 2)
    this._drawLedText(renderer, boardX + 4, boardY + 12, 'VIS', '#8888aa');

    // Home score (LED digits, bright green)
    this._drawLedNumber(renderer, boardX + 26, boardY + 4, homeScore, PALETTE.GREEN, 'left');
    // Dash separator
    renderer.drawPixel(boardX + 38, boardY + 6, PALETTE.GREEN);
    // Away score
    this._drawLedNumber(renderer, boardX + 42, boardY + 4, awayScore, PALETTE.GREEN, 'left');

    // Game day (right side, gold)
    this._drawLedText(renderer, boardX + 56, boardY + 4, 'GM', '#886622');
    this._drawLedNumber(renderer, boardX + 66, boardY + 4, gameDay, PALETTE.GOLD, 'left');

    // Inning display (right side, row 2)
    const displayInning = Math.min(inning, innings);
    this._drawLedText(renderer, boardX + 56, boardY + 12, 'INN', '#886622');
    this._drawLedNumber(renderer, boardX + 70, boardY + 12, displayInning, PALETTE.YELLOW, 'left');

    // ── Bottom section: Inning progress dots ──────────────────

    // 9 inning blocks (6px wide each with 1px gap = 63px, centered in 80px)
    const dotsStartX = boardX + Math.floor((boardW - innings * 7 + 1) / 2);
    for (let inn = 0; inn < innings; inn++) {
      const dotX = dotsStartX + inn * 7;
      const active = inn < inning;
      // Each dot is a 5x4 LED block
      const dotColor = active ? PALETTE.GREEN : '#1a1a2a';
      const borderColor = active ? '#005500' : '#111122';
      renderer.drawRect(dotX, boardY + 23, 5, 4, dotColor);
      // Top highlight for active dots
      if (active) {
        renderer.drawRect(dotX, boardY + 23, 5, 1, '#44ff44');
      }
      // Current inning indicator — blinking
      if (inn === inning - 1) {
        const blink = Math.floor(t * 2) % 2 === 0;
        if (blink) {
          renderer.drawRect(dotX, boardY + 27, 5, 1, PALETTE.YELLOW);
        }
      }
    }

    // Inning number labels under dots (1 and 9 markers)
    this._drawLedNumber(renderer, dotsStartX + 1, boardY + 28, 1, '#333344', 'left');
    this._drawLedNumber(renderer, dotsStartX + (innings - 1) * 7 + 1, boardY + 28, innings, '#333344', 'left');
  }

  /* ================================================================ */
  /*  LUXURY BOXES — row 6, cols 3-7 and 24-26                       */
  /* ================================================================ */

  _drawLuxuryBoxes(ctx, rect, px, line) {
    const luxurySections = [
      { startCol: 3, endCol: 7 },
      { startCol: 24, endCol: 26 },
    ];

    const y = 6 * TILE_SIZE;

    for (const section of luxurySections) {
      for (let col = section.startCol; col <= section.endCol; col++) {
        const x = col * TILE_SIZE;

        // Room background — dark upscale interior
        rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.DARK_GRAY);

        // Ceiling strip
        rect(x, y, TILE_SIZE, 2, PALETTE.CONCRETE);

        // Floor strip
        rect(x, y + 14, TILE_SIZE, 2, PALETTE.BROWN);

        // Large window (glass panel)
        rect(x + 1, y + 3, TILE_SIZE - 2, 8, PALETTE.GLASS);
        // Window reflection highlight
        ctx.globalAlpha = 0.3;
        rect(x + 2, y + 3, 3, 4, PALETTE.GLASS_LT);
        ctx.globalAlpha = 1;

        // Gold trim above and below window
        rect(x, y + 2, TILE_SIZE, 1, PALETTE.GOLD);
        rect(x, y + 11, TILE_SIZE, 1, PALETTE.GOLD);

        // Interior warm lighting glow
        ctx.globalAlpha = 0.15;
        rect(x + 3, y + 4, TILE_SIZE - 6, 6, PALETTE.WARM_WHITE);
        ctx.globalAlpha = 1;

        // Window divider (mullion)
        px(x + 7, y + 3, PALETTE.DARK_IRON);
        px(x + 7, y + 4, PALETTE.DARK_IRON);
        px(x + 7, y + 5, PALETTE.DARK_IRON);
        px(x + 7, y + 6, PALETTE.DARK_IRON);
        px(x + 7, y + 7, PALETTE.DARK_IRON);
        px(x + 7, y + 8, PALETTE.DARK_IRON);
        px(x + 7, y + 9, PALETTE.DARK_IRON);
        px(x + 7, y + 10, PALETTE.DARK_IRON);

        // Small interior chair shape (2px)
        if (col % 2 === 0) {
          rect(x + 4, y + 11, 3, 2, PALETTE.CRIMSON);
          rect(x + 10, y + 11, 3, 2, PALETTE.CRIMSON);
        }
      }
    }
  }

  /* ================================================================ */
  /*  PRESS BOX — row 6, cols 8-10 and 21-23                         */
  /* ================================================================ */

  _drawPressBox(ctx, rect, px, line) {
    const pressSections = [
      { startCol: 8, endCol: 10 },
      { startCol: 21, endCol: 23 },
    ];

    const y = 6 * TILE_SIZE;

    for (const section of pressSections) {
      for (let col = section.startCol; col <= section.endCol; col++) {
        const x = col * TILE_SIZE;

        // Dark interior
        rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.NAVY);

        // Ceiling
        rect(x, y, TILE_SIZE, 2, PALETTE.STEEL_DK);
        // Floor
        rect(x, y + 14, TILE_SIZE, 2, PALETTE.DARK_GRAY);

        // Dark tinted glass windows
        rect(x + 1, y + 3, TILE_SIZE - 2, 9, PALETTE.DARK_BLUE);
        // Glass sheen
        ctx.globalAlpha = 0.2;
        rect(x + 2, y + 3, 4, 3, PALETTE.GLASS);
        ctx.globalAlpha = 1;

        // Window frame
        px(x, y + 3, PALETTE.STEEL);
        px(x + 15, y + 3, PALETTE.STEEL);
        px(x, y + 11, PALETTE.STEEL);
        px(x + 15, y + 11, PALETTE.STEEL);
      }

      // Satellite dish on the middle press box tile
      const midCol = Math.floor((section.startCol + section.endCol) / 2);
      const dishX = midCol * TILE_SIZE + 5;
      const dishY = y - 1;

      // Dish pole
      px(dishX + 3, dishY + 1, PALETTE.STEEL);
      px(dishX + 3, dishY, PALETTE.STEEL);
      // Dish arc (concave up)
      px(dishX, dishY - 1, PALETTE.LIGHT_GRAY);
      px(dishX + 1, dishY - 2, PALETTE.LIGHT_GRAY);
      px(dishX + 2, dishY - 2, PALETTE.WHITE);
      px(dishX + 3, dishY - 3, PALETTE.WHITE);
      px(dishX + 4, dishY - 2, PALETTE.WHITE);
      px(dishX + 5, dishY - 2, PALETTE.LIGHT_GRAY);
      px(dishX + 6, dishY - 1, PALETTE.LIGHT_GRAY);

      // Antenna mast
      const antX = section.startCol * TILE_SIZE + 2;
      px(antX, y - 4, PALETTE.RED);
      px(antX, y - 3, PALETTE.STEEL);
      px(antX, y - 2, PALETTE.STEEL);
      px(antX, y - 1, PALETTE.STEEL);
    }
  }

  /* ================================================================ */
  /*  CONCOURSE — row 6 (cols 11-12, 18-20) and row 7 (cols 3-26)    */
  /* ================================================================ */

  _drawConcourse(ctx, rect, px, line) {
    // --- Row 6 concourse sections (transition connectors) ---
    const transitionCols = [[11, 12], [18, 20]];
    const y6 = 6 * TILE_SIZE;
    for (const [start, end] of transitionCols) {
      for (let col = start; col <= end; col++) {
        const x = col * TILE_SIZE;
        rect(x, y6, TILE_SIZE, TILE_SIZE, PALETTE.CONCRETE);
        // Floor tiles pattern
        for (let tx = 0; tx < TILE_SIZE; tx += 4) {
          rect(x + tx, y6 + 12, 3, 3, PALETTE.CONCRETE_LT);
          rect(x + tx, y6 + 12, 3, 1, PALETTE.CONCRETE_DK);
        }
        // Ceiling
        rect(x, y6, TILE_SIZE, 2, PALETTE.CONCRETE_DK);
        // Railing
        line(x, y6 + 3, x + TILE_SIZE, y6 + 3, PALETTE.STEEL);
      }
    }

    // --- Row 7 main concourse ---
    const y = 7 * TILE_SIZE;

    for (let col = 3; col <= 26; col++) {
      const x = col * TILE_SIZE;

      // Concrete floor base
      rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.CONCRETE_LT);

      // Checkered floor tiles
      for (let tx = 0; tx < TILE_SIZE; tx += 4) {
        for (let ty = 0; ty < TILE_SIZE; ty += 4) {
          const checker = ((tx + ty) / 4) % 2;
          if (checker === 0) {
            rect(x + tx, y + ty, 4, 4, PALETTE.CONCRETE);
          }
        }
      }

      // Ceiling line
      rect(x, y, TILE_SIZE, 1, PALETTE.CONCRETE_DK);

      // Floor line
      rect(x, y + 15, TILE_SIZE, 1, PALETTE.CONCRETE_DK);
    }

    // Concession stand awning (every few tiles)
    const awningPositions = [5, 6, 13, 14, 22, 23];
    for (let i = 0; i < awningPositions.length; i += 2) {
      const col1 = awningPositions[i];
      const col2 = awningPositions[i + 1];
      const ax = col1 * TILE_SIZE;
      const aw = (col2 - col1 + 1) * TILE_SIZE;

      // Awning canopy (striped)
      for (let sx = 0; sx < aw; sx++) {
        const stripe = (sx % 6 < 3) ? PALETTE.RED : PALETTE.WHITE;
        px(ax + sx, y + 2, stripe);
        px(ax + sx, y + 3, stripe);
      }

      // Counter underneath
      rect(ax + 2, y + 4, aw - 4, 2, PALETTE.BROWN);

      // Menu sign
      if (i === 0) {
        ctx.fillStyle = PALETTE.WHITE;
        ctx.font = '4px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('DOGS', ax + aw / 2, y + 1);
      } else if (i === 2) {
        ctx.fillStyle = PALETTE.WHITE;
        ctx.font = '4px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('BEER', ax + aw / 2, y + 1);
      } else {
        ctx.fillStyle = PALETTE.WHITE;
        ctx.font = '4px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('SHOP', ax + aw / 2, y + 1);
      }
    }

    // Small walking people figures scattered along the concourse
    const peopleCols = [4, 7, 8, 10, 15, 16, 19, 20, 24, 25];
    for (const pc of peopleCols) {
      const px_ = pc * TILE_SIZE + Math.floor(_hash(pc, 7, 5) * 10);
      const py_ = y + 7 + Math.floor(_hash(pc, 7, 6) * 5);

      // Skin tone head (1px)
      const skinArr = [PALETTE.SKIN, PALETTE.SKIN_DK, PALETTE.SKIN_MED, PALETTE.SKIN_TAN, PALETTE.SKIN_DEEP];
      const sIdx = Math.floor(_hash(pc, 7, 10) * skinArr.length);
      px(px_ + 1, py_ - 3, skinArr[sIdx]);

      // Body (1-2px wide)
      const bodyColors = [PALETTE.RED, PALETTE.BLUE, PALETTE.GREEN, PALETTE.ORANGE, PALETTE.YELLOW, PALETTE.WHITE, PALETTE.PINK, PALETTE.CRIMSON];
      const bIdx = Math.floor(_hash(pc, 7, 20) * bodyColors.length);
      px(px_ + 1, py_ - 2, bodyColors[bIdx]);
      px(px_ + 1, py_ - 1, bodyColors[bIdx]);

      // Legs (dark)
      px(px_, py_, PALETTE.DARK_GRAY);
      px(px_ + 2, py_, PALETTE.DARK_GRAY);
    }

    // Overhead signs
    const signPositions = [{ col: 9, text: 'SEC A' }, { col: 17, text: 'SEC B' }];
    for (const sp of signPositions) {
      const sx = sp.col * TILE_SIZE;
      rect(sx + 2, y + 1, 14, 5, PALETTE.NAVY);
      ctx.fillStyle = PALETTE.WHITE;
      ctx.font = '4px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(sp.text, sx + 9, y + 2);
    }
  }

  /* ================================================================ */
  /*  UTILITY / CONCESSIONS — row 8                                   */
  /* ================================================================ */

  _drawUtility(ctx, rect, px, line) {
    const y = 8 * TILE_SIZE;

    for (let col = 3; col <= 26; col++) {
      const x = col * TILE_SIZE;

      // Base room color
      rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.DARK_GRAY);

      // Ceiling (pipes/conduit)
      rect(x, y, TILE_SIZE, 2, PALETTE.CONCRETE_DK);

      // Floor
      rect(x, y + 14, TILE_SIZE, 2, PALETTE.CONCRETE_DK);
    }

    // Kitchen hoods (cols 4-6)
    for (let col = 4; col <= 6; col++) {
      const x = col * TILE_SIZE;
      // Hood canopy (trapezoid shape)
      rect(x + 1, y + 2, 14, 3, PALETTE.STEEL);
      rect(x + 3, y + 2, 10, 1, PALETTE.STEEL_LT);
      // Exhaust vent on hood
      rect(x + 6, y + 2, 4, 1, PALETTE.DARK_IRON);
      // Cooking surface below
      rect(x + 2, y + 6, 12, 2, PALETTE.STEEL_DK);
      // Flame glow
      if (col === 5) {
        px(x + 5, y + 5, PALETTE.ORANGE);
        px(x + 7, y + 5, PALETTE.ORANGE);
        px(x + 9, y + 5, PALETTE.RED);
        px(x + 6, y + 4, PALETTE.YELLOW);
      }
    }

    // Refrigerators (cols 8-9)
    for (let col = 8; col <= 9; col++) {
      const x = col * TILE_SIZE;
      rect(x + 1, y + 3, 6, 10, PALETTE.LIGHT_GRAY);
      rect(x + 8, y + 3, 6, 10, PALETTE.LIGHT_GRAY);
      // Handle
      px(x + 6, y + 6, PALETTE.STEEL_DK);
      px(x + 6, y + 7, PALETTE.STEEL_DK);
      px(x + 13, y + 6, PALETTE.STEEL_DK);
      px(x + 13, y + 7, PALETTE.STEEL_DK);
      // Door line
      line(x + 1, y + 8, x + 6, y + 8, PALETTE.STEEL);
      line(x + 8, y + 8, x + 13, y + 8, PALETTE.STEEL);
    }

    // Restroom signs (cols 11-12)
    for (let col = 11; col <= 12; col++) {
      const x = col * TILE_SIZE;
      // Door shape
      rect(x + 2, y + 4, 5, 9, PALETTE.BROWN);
      rect(x + 9, y + 4, 5, 9, PALETTE.BROWN);
      // Restroom icon placeholders
      rect(x + 3, y + 3, 3, 2, PALETTE.BLUE);
      rect(x + 10, y + 3, 3, 2, PALETTE.PINK);
    }

    // Storage / mechanical areas (cols 15-20)
    for (let col = 15; col <= 20; col++) {
      const x = col * TILE_SIZE;
      // Shelving racks
      line(x + 2, y + 4, x + 2, y + 13, PALETTE.STEEL);
      line(x + 13, y + 4, x + 13, y + 13, PALETTE.STEEL);
      rect(x + 2, y + 6, 12, 1, PALETTE.STEEL_DK);
      rect(x + 2, y + 10, 12, 1, PALETTE.STEEL_DK);
      // Boxes on shelves
      if (col % 2 === 0) {
        rect(x + 4, y + 3, 4, 3, PALETTE.BROWN);
        rect(x + 9, y + 7, 3, 3, PALETTE.RUST);
      } else {
        rect(x + 5, y + 7, 5, 3, PALETTE.DARK_GREEN);
        rect(x + 3, y + 11, 4, 2, PALETTE.BROWN);
      }
    }

    // Electrical panels (cols 23-24)
    for (let col = 23; col <= 24; col++) {
      const x = col * TILE_SIZE;
      rect(x + 2, y + 3, 12, 10, PALETTE.DARK_IRON);
      rect(x + 3, y + 4, 10, 8, PALETTE.STEEL_DK);
      // Circuit breaker rows
      for (let by = 0; by < 3; by++) {
        for (let bx = 0; bx < 4; bx++) {
          px(x + 4 + bx * 3, y + 5 + by * 3, PALETTE.STEEL);
        }
      }
      // Warning label
      px(x + 7, y + 3, PALETTE.YELLOW);
      px(x + 8, y + 3, PALETTE.YELLOW);
    }
  }

  /* ================================================================ */
  /*  MECHANICAL / HVAC — row 9                                       */
  /* ================================================================ */

  _drawMechanical(ctx, rect, px, line) {
    const y = 9 * TILE_SIZE;

    for (let col = 3; col <= 26; col++) {
      const x = col * TILE_SIZE;
      const tileId = this.tiles[9][col];

      if (tileId === TILES.VENT_SLOT) continue; // drawn separately

      // Base: dark mechanical room floor
      rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.DARK_GRAY);

      // Exposed ceiling pipes
      rect(x, y, TILE_SIZE, 1, PALETTE.CONCRETE_DK);

      // Floor grating
      for (let gx = 0; gx < TILE_SIZE; gx += 2) {
        px(x + gx, y + 15, PALETTE.DARK_IRON);
      }

      // Different mechanical equipment per section
      const section = (col - 3) % 8;

      if (section < 2) {
        // HVAC ductwork — rectangular ducts
        rect(x + 1, y + 2, 14, 5, PALETTE.STEEL);
        rect(x + 2, y + 3, 12, 3, PALETTE.STEEL_LT);
        // Duct joint
        rect(x, y + 4, 1, 1, PALETTE.STEEL_DK);
        rect(x + 15, y + 4, 1, 1, PALETTE.STEEL_DK);
        // Support bracket
        line(x + 4, y + 7, x + 4, y + 13, PALETTE.STEEL_DK);
        line(x + 11, y + 7, x + 11, y + 13, PALETTE.STEEL_DK);
      } else if (section < 4) {
        // Pump / motor unit
        rect(x + 2, y + 5, 8, 7, PALETTE.DARK_IRON);
        rect(x + 3, y + 6, 6, 5, PALETTE.STEEL_DK);
        // Motor shaft
        rect(x + 10, y + 7, 4, 3, PALETTE.COPPER);
        // Gauge
        px(x + 4, y + 3, PALETTE.GREEN);
        px(x + 7, y + 3, PALETTE.RED);
        px(x + 10, y + 3, PALETTE.YELLOW);
      } else if (section < 6) {
        // Pipe manifold
        rect(x + 1, y + 3, 14, 2, PALETTE.COPPER);
        rect(x + 1, y + 8, 14, 2, PALETTE.WATER_BLUE);
        rect(x + 1, y + 12, 14, 2, PALETTE.STEEL);
        // Vertical connectors
        line(x + 4, y + 3, x + 4, y + 14, PALETTE.STEEL_DK);
        line(x + 11, y + 3, x + 11, y + 14, PALETTE.STEEL_DK);
        // Valve handles
        px(x + 4, y + 6, PALETTE.RED);
        px(x + 11, y + 6, PALETTE.RED);
      } else {
        // Electrical conduit / wire runs
        for (let wy = 2; wy < 14; wy += 3) {
          rect(x + 1, y + wy, 14, 1, PALETTE.DARK_IRON);
        }
        // Wire bundles
        px(x + 3, y + 3, PALETTE.RED);
        px(x + 5, y + 3, PALETTE.BLUE);
        px(x + 7, y + 3, PALETTE.GREEN);
        px(x + 9, y + 6, PALETTE.YELLOW);
        px(x + 11, y + 6, PALETTE.ORANGE);
        // Junction box
        rect(x + 6, y + 9, 4, 4, PALETTE.STEEL);
        rect(x + 7, y + 10, 2, 2, PALETTE.DARK_IRON);
      }
    }
  }

  /* ================================================================ */
  /*  VENT SLOTS — highlighted placeable areas                        */
  /* ================================================================ */

  _drawVentSlots(ctx, rect, px) {
    // Domain-specific border colors
    const domainColors = {
      air: '#cccccc',
      water: '#4488ff',
      hvac: '#ff8844',
      drainage: '#44bb44',
    };

    for (const slot of this._ventSlots) {
      const x = slot.col * TILE_SIZE;
      const y = slot.row * TILE_SIZE;
      const borderColor = domainColors[slot.domain] ?? PALETTE.GREEN;

      // Vent housing — recessed metallic slot
      rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.DARK_IRON);

      // Vent grille slats
      for (let sy = 2; sy < TILE_SIZE - 2; sy += 3) {
        rect(x + 2, y + sy, TILE_SIZE - 4, 2, PALETTE.STEEL);
        rect(x + 3, y + sy, TILE_SIZE - 6, 1, PALETTE.STEEL_LT);
      }

      // Domain-colored outline border
      for (let gx = 0; gx < TILE_SIZE; gx++) {
        px(x + gx, y, borderColor);
        px(x + gx, y + TILE_SIZE - 1, borderColor);
      }
      for (let gy = 0; gy < TILE_SIZE; gy++) {
        px(x, y + gy, borderColor);
        px(x + TILE_SIZE - 1, y + gy, borderColor);
      }

      // Domain icon dot in corner (color indicator)
      px(x + 1, y + 1, borderColor);
      px(x + 2, y + 1, borderColor);
      px(x + 1, y + 2, borderColor);
      px(x + TILE_SIZE - 2, y + 1, borderColor);
      px(x + TILE_SIZE - 3, y + 1, borderColor);
      px(x + TILE_SIZE - 2, y + 2, borderColor);

      // Domain letter label centered in vent slot (3x5 pixel font)
      const letterMap = _ventSlotLetterMap();
      const letter = { air: 'A', water: 'W', hvac: 'H', drainage: 'D' }[slot.domain];
      const bitmap = letterMap[letter];
      if (bitmap) {
        const lx = x + 6; // center 3px letter in 16px tile
        const ly = y + 5; // center 5px letter in 16px tile
        for (let row = 0; row < bitmap.length; row++) {
          for (let col = 0; col < bitmap[row].length; col++) {
            if (bitmap[row][col]) {
              px(lx + col, ly + row, borderColor);
            }
          }
        }
      }
    }
  }

  /* ================================================================ */
  /*  STRUCTURAL WALLS — rows 10-11                                   */
  /* ================================================================ */

  _drawStructuralWalls(ctx, rect, px, line) {
    for (let row = 10; row <= 11; row++) {
      const y = row * TILE_SIZE;

      for (let col = 2; col <= 27; col++) {
        if (this.tiles[row][col] !== TILES.WALL) continue;
        const x = col * TILE_SIZE;

        // Concrete block base
        rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.CONCRETE);

        // Mortar lines — horizontal
        rect(x, y + 5, TILE_SIZE, 1, PALETTE.CONCRETE_DK);
        rect(x, y + 11, TILE_SIZE, 1, PALETTE.CONCRETE_DK);

        // Mortar lines — vertical (offset per row for brick pattern)
        const offset = (row % 2 === 0) ? 0 : 8;
        rect(x + offset, y, 1, 5, PALETTE.CONCRETE_DK);
        rect(x + ((offset + 8) % 16), y + 6, 1, 5, PALETTE.CONCRETE_DK);
        if (offset + 8 < TILE_SIZE) {
          rect(x + offset + 8, y, 1, 5, PALETTE.CONCRETE_DK);
        }

        // Steel reinforcement I-beam every 4th col
        if (col % 4 === 2) {
          rect(x + 6, y, 4, TILE_SIZE, PALETTE.STEEL_DK);
          rect(x + 7, y, 2, TILE_SIZE, PALETTE.STEEL);
          // Flange lines
          rect(x + 5, y, 1, TILE_SIZE, PALETTE.STEEL_LT);
          rect(x + 10, y, 1, TILE_SIZE, PALETTE.STEEL_LT);
        }

        // Subtle noise/aging
        if (_hash(col, row, 3) > 0.7) {
          px(x + Math.floor(_hash(col, row, 4) * 14) + 1,
             y + Math.floor(_hash(col, row, 5) * 14) + 1,
             PALETTE.CONCRETE_DK);
        }

        // Dugout details (cols 3-4 and 25-26, row 10-11)
        if (row === 10 && (col >= 3 && col <= 4 || col >= 25 && col <= 26)) {
          // Bench (wooden plank)
          rect(x + 1, y + 10, 14, 2, PALETTE.BROWN);
          rect(x + 1, y + 10, 14, 1, PALETTE.DIRT_LT);
          // Bench legs
          rect(x + 2, y + 12, 2, 3, PALETTE.DARK_GRAY);
          rect(x + 12, y + 12, 2, 3, PALETTE.DARK_GRAY);
          // Player silhouette sitting on bench
          if (_hash(col, row, 600) > 0.3) {
            const skinC = [PALETTE.SKIN, PALETTE.SKIN_MED, PALETTE.SKIN_TAN][Math.floor(_hash(col, row, 601) * 3)];
            px(x + 7, y + 7, skinC);                 // head
            rect(x + 6, y + 8, 3, 2, PALETTE.WHITE); // jersey
            px(x + 7, y + 10, PALETTE.DARK_GRAY);    // legs on bench
          }
        }
        if (row === 11 && (col >= 3 && col <= 4 || col >= 25 && col <= 26)) {
          // Bat rack (diagonal lines)
          px(x + 2, y + 2, PALETTE.BROWN);
          px(x + 3, y + 3, PALETTE.BROWN);
          px(x + 4, y + 4, PALETTE.BROWN);
          px(x + 3, y + 5, PALETTE.DIRT_LT);
          // Second bat
          px(x + 5, y + 2, PALETTE.BROWN);
          px(x + 6, y + 3, PALETTE.BROWN);
          px(x + 7, y + 4, PALETTE.BROWN);
          px(x + 6, y + 5, PALETTE.DIRT_LT);
          // Helmet (small arc)
          rect(x + 10, y + 3, 4, 2, PALETTE.RED);
          rect(x + 11, y + 2, 2, 1, PALETTE.RED);
          px(x + 10, y + 5, PALETTE.CRIMSON);
          px(x + 13, y + 5, PALETTE.CRIMSON);
        }
      }
    }
  }

  /* ================================================================ */
  /*  BASEBALL FIELD — row 12                                         */
  /* ================================================================ */

  _drawField(ctx, rect, px, line) {
    const y = 12 * TILE_SIZE;

    // --- Outfield grass (base layer) ---
    for (let col = 4; col <= 25; col++) {
      const x = col * TILE_SIZE;
      rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.GRASS);

      // Mowing stripe pattern (alternating light/dark grass bands)
      if (col % 3 === 0) {
        rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.GRASS_LT);
      }
      // Second pattern within the stripe
      if (col % 3 === 1) {
        rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.MOSS_GREEN);
      }
    }

    // --- Infield dirt (diamond area) ---
    // The diamond is centered around cols 14-15 (center of field 4-25)
    // In a cross-section view, the infield is a wide dirt area in the middle
    const infieldStart = 10;
    const infieldEnd = 19;
    for (let col = infieldStart; col <= infieldEnd; col++) {
      const x = col * TILE_SIZE;
      rect(x, y + 3, TILE_SIZE, 10, PALETTE.DIRT);

      // Dirt texture variation
      if (col % 2 === 0) {
        for (let dx = 0; dx < TILE_SIZE; dx += 3) {
          for (let dy = 3; dy < 13; dy += 3) {
            if (_hash(col * 16 + dx, dy, 7) > 0.6) {
              px(x + dx, y + dy, PALETTE.DIRT_LT);
            }
          }
        }
      }
    }

    // Grass re-overlay: the actual diamond shape within the dirt
    // (in cross-section, we see the grass infield cutouts)

    // --- Base paths (white chalk lines) ---
    // First base line (from home plate toward right)
    const homeX = 15 * TILE_SIZE; // center
    const homeY = y + 12;

    // Horizontal base path line across the infield
    for (let bx = 11 * TILE_SIZE; bx <= 19 * TILE_SIZE; bx++) {
      px(bx, y + 8, PALETTE.WHITE);
    }

    // Diagonal baseline to first base (going right)
    for (let i = 0; i < 30; i++) {
      const dx = homeX + i;
      const dy = homeY - Math.floor(i * 5 / 30);
      if (dx < 26 * TILE_SIZE) {
        px(dx, dy, PALETTE.WHITE);
      }
    }
    // Diagonal baseline to third base (going left)
    for (let i = 0; i < 30; i++) {
      const dx = homeX - i;
      const dy = homeY - Math.floor(i * 5 / 30);
      if (dx >= 4 * TILE_SIZE) {
        px(dx, dy, PALETTE.WHITE);
      }
    }

    // --- Home plate (pentagon shape at center bottom of diamond) ---
    // 5-pixel wide pentagon
    rect(homeX - 2, homeY - 2, 5, 3, PALETTE.WHITE);
    px(homeX - 1, homeY + 1, PALETTE.WHITE);
    px(homeX, homeY + 1, PALETTE.WHITE);
    px(homeX + 1, homeY + 1, PALETTE.WHITE);
    px(homeX, homeY + 2, PALETTE.WHITE);

    // --- Pitcher's mound (raised dirt area) ---
    const moundX = 15 * TILE_SIZE;
    const moundY = y + 6;
    rect(moundX - 3, moundY - 1, 7, 4, PALETTE.DIRT_LT);
    rect(moundX - 2, moundY, 5, 2, PALETTE.DIRT);
    // Pitching rubber
    rect(moundX - 1, moundY, 3, 1, PALETTE.WHITE);

    // --- Bases (first, second, third) ---
    // First base (right side of diamond)
    const firstX = 18 * TILE_SIZE + 4;
    const firstY = y + 7;
    rect(firstX, firstY, 3, 3, PALETTE.WHITE);

    // Second base (top center of diamond)
    const secondX = 15 * TILE_SIZE - 1;
    const secondY = y + 3;
    // Rotated square (diamond shape for 2nd base)
    px(secondX + 1, secondY, PALETTE.WHITE);
    px(secondX, secondY + 1, PALETTE.WHITE);
    px(secondX + 1, secondY + 1, PALETTE.WHITE);
    px(secondX + 2, secondY + 1, PALETTE.WHITE);
    px(secondX + 1, secondY + 2, PALETTE.WHITE);

    // Third base (left side of diamond)
    const thirdX = 11 * TILE_SIZE + 8;
    const thirdY = y + 7;
    rect(thirdX, thirdY, 3, 3, PALETTE.WHITE);

    // --- Batter's boxes ---
    // Left batter's box
    ctx.globalAlpha = 0.6;
    rect(homeX - 6, homeY - 3, 3, 5, PALETTE.WHITE);
    // Right batter's box
    rect(homeX + 4, homeY - 3, 3, 5, PALETTE.WHITE);
    ctx.globalAlpha = 1;

    // --- On-deck circles (near each dugout) ---
    // Left on-deck circle (near 3rd base dugout)
    const odcLeftX = 8 * TILE_SIZE + 8;
    const odcLeftY = y + 10;
    ctx.globalAlpha = 0.5;
    px(odcLeftX, odcLeftY, PALETTE.WHITE);
    px(odcLeftX + 1, odcLeftY - 1, PALETTE.WHITE);
    px(odcLeftX + 2, odcLeftY, PALETTE.WHITE);
    px(odcLeftX + 1, odcLeftY + 1, PALETTE.WHITE);
    px(odcLeftX - 1, odcLeftY, PALETTE.WHITE);
    ctx.globalAlpha = 1;

    // Right on-deck circle (near 1st base dugout)
    const odcRightX = 21 * TILE_SIZE + 4;
    const odcRightY = y + 10;
    ctx.globalAlpha = 0.5;
    px(odcRightX, odcRightY, PALETTE.WHITE);
    px(odcRightX + 1, odcRightY - 1, PALETTE.WHITE);
    px(odcRightX + 2, odcRightY, PALETTE.WHITE);
    px(odcRightX + 1, odcRightY + 1, PALETTE.WHITE);
    px(odcRightX - 1, odcRightY, PALETTE.WHITE);
    ctx.globalAlpha = 1;

    // --- Outfield warning track ---
    for (let col = 4; col <= 6; col++) {
      const x = col * TILE_SIZE;
      rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.DIRT);
      // Dirt texture
      for (let dx = 0; dx < TILE_SIZE; dx += 4) {
        px(x + dx, y + Math.floor(_hash(col, 12, dx) * 14) + 1, PALETTE.DIRT_LT);
      }
    }
    for (let col = 23; col <= 25; col++) {
      const x = col * TILE_SIZE;
      rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.DIRT);
      for (let dx = 0; dx < TILE_SIZE; dx += 4) {
        px(x + dx, y + Math.floor(_hash(col, 12, dx) * 14) + 1, PALETTE.DIRT_LT);
      }
    }

    // --- Foul lines extending from home plate to edges ---
    for (let fx = 4 * TILE_SIZE; fx < 10 * TILE_SIZE; fx++) {
      px(fx, y + 14, PALETTE.WHITE);
    }
    for (let fx = 20 * TILE_SIZE; fx < 26 * TILE_SIZE; fx++) {
      px(fx, y + 14, PALETTE.WHITE);
    }

    // --- Outfield wall (green wall at edges of field tiles) ---
    // Left wall
    for (let col = 4; col <= 5; col++) {
      const x = col * TILE_SIZE;
      rect(x, y, 2, TILE_SIZE, PALETTE.DARK_GREEN);
      // Ivy suggestion (green dots on wall)
      for (let iy = 0; iy < TILE_SIZE; iy += 3) {
        if (_hash(col, iy, 500) > 0.4) {
          px(x, y + iy, PALETTE.MOSS_GREEN);
          px(x + 1, y + iy + 1, PALETTE.GRASS);
        }
      }
    }
    // Right wall
    for (let col = 24; col <= 25; col++) {
      const x = col * TILE_SIZE + 14;
      rect(x, y, 2, TILE_SIZE, PALETTE.DARK_GREEN);
      for (let iy = 0; iy < TILE_SIZE; iy += 3) {
        if (_hash(col, iy, 501) > 0.4) {
          px(x, y + iy, PALETTE.MOSS_GREEN);
          px(x + 1, y + iy + 1, PALETTE.GRASS);
        }
      }
    }

    // Sponsor banner patches on outfield wall (colored rectangles)
    const bannerSpots = [
      { col: 6, color: PALETTE.RED, dk: PALETTE.CRIMSON },
      { col: 8, color: PALETTE.BLUE, dk: PALETTE.DARK_BLUE },
      { col: 21, color: PALETTE.YELLOW, dk: PALETTE.GOLD },
      { col: 23, color: PALETTE.WHITE, dk: PALETTE.LIGHT_GRAY },
    ];
    for (const b of bannerSpots) {
      const bx = b.col * TILE_SIZE;
      rect(bx + 2, y + 1, 12, 5, b.color);
      rect(bx + 2, y + 1, 12, 1, b.dk);
      // Text dots
      for (let i = 0; i < 4; i++) {
        px(bx + 4 + i * 2, y + 3, b.dk);
      }
    }

    // --- Foul poles (tall yellow poles at outfield corners) ---
    // Left foul pole (col 4-5 boundary)
    const leftPoleX = 5 * TILE_SIZE - 1;
    for (let fy = y - 6; fy <= y + 14; fy++) {
      px(leftPoleX, fy, PALETTE.YELLOW);
      px(leftPoleX + 1, fy, PALETTE.GOLD);
    }
    // Pole base
    rect(leftPoleX - 1, y + 12, 4, 3, PALETTE.YELLOW);
    // Mesh screen on left pole (small dots)
    for (let fy = y - 4; fy < y + 10; fy += 2) {
      px(leftPoleX + 2, fy, PALETTE.GOLD);
      px(leftPoleX + 3, fy + 1, PALETTE.GOLD);
    }

    // Right foul pole (col 24-25 boundary)
    const rightPoleX = 24 * TILE_SIZE + 14;
    for (let fy = y - 6; fy <= y + 14; fy++) {
      px(rightPoleX, fy, PALETTE.YELLOW);
      px(rightPoleX - 1, fy, PALETTE.GOLD);
    }
    rect(rightPoleX - 2, y + 12, 4, 3, PALETTE.YELLOW);
    for (let fy = y - 4; fy < y + 10; fy += 2) {
      px(rightPoleX - 3, fy, PALETTE.GOLD);
      px(rightPoleX - 4, fy + 1, PALETTE.GOLD);
    }

    // Distance markers on outfield wall
    const distMarkers = [
      { col: 5, text: '330' },
      { col: 14, text: '400' },
      { col: 24, text: '330' },
    ];
    ctx.fillStyle = PALETTE.WHITE;
    ctx.font = '4px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const dm of distMarkers) {
      const mx = dm.col * TILE_SIZE + 8;
      ctx.fillText(dm.text, mx, y + 10);
    }

    // Wall/fence (row 12 side tiles that are walls)
    for (const col of [2, 3, 26, 27]) {
      if (this.tiles[12][col] === TILES.WALL) {
        const x = col * TILE_SIZE;
        rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.CONCRETE);
        // Brick pattern
        rect(x, y + 5, TILE_SIZE, 1, PALETTE.CONCRETE_DK);
        rect(x, y + 11, TILE_SIZE, 1, PALETTE.CONCRETE_DK);
        if (col % 2 === 0) {
          rect(x + 8, y, 1, 5, PALETTE.CONCRETE_DK);
          rect(x, y + 6, 1, 5, PALETTE.CONCRETE_DK);
        } else {
          rect(x, y, 1, 5, PALETTE.CONCRETE_DK);
          rect(x + 8, y + 6, 1, 5, PALETTE.CONCRETE_DK);
        }
      }
    }
  }

  /* ================================================================ */
  /*  BELOW-FIELD PIPES — rows 13-14                                  */
  /* ================================================================ */

  _drawBelowFieldPipes(ctx, rect, px, line) {
    // --- Row 13: Main pipe network ---
    const y13 = 13 * TILE_SIZE;

    for (let col = 3; col <= 26; col++) {
      const x = col * TILE_SIZE;

      // Dark concrete background
      rect(x, y13, TILE_SIZE, TILE_SIZE, PALETTE.CONCRETE_DK);

      // Ceiling drip stains
      if (_hash(col, 13, 1) > 0.7) {
        ctx.globalAlpha = 0.3;
        rect(x + Math.floor(_hash(col, 13, 2) * 12), y13, 2, 3, PALETTE.DARK_GRAY);
        ctx.globalAlpha = 1;
      }
    }

    // Horizontal pipes running across
    // Water pipe (blue) at y13+3
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x++) {
      px(x, y13 + 3, PALETTE.WATER_BLUE);
      px(x, y13 + 4, PALETTE.BLUE);
      px(x, y13 + 5, PALETTE.WATER_BLUE);
    }
    // Highlight on top
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x += 2) {
      px(x, y13 + 3, PALETTE.WATER_LT);
    }

    // Drainage pipe (gray) at y13+9
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x++) {
      px(x, y13 + 9, PALETTE.STEEL_DK);
      px(x, y13 + 10, PALETTE.STEEL);
      px(x, y13 + 11, PALETTE.STEEL_DK);
    }
    // Highlight
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x += 2) {
      px(x, y13 + 9, PALETTE.STEEL_LT);
    }

    // Pipe joints (thicker sections at intervals)
    for (let col = 5; col <= 25; col += 4) {
      const jx = col * TILE_SIZE;

      // Water pipe joint
      rect(jx, y13 + 2, 4, 5, PALETTE.WATER_BLUE);
      rect(jx + 1, y13 + 2, 2, 5, PALETTE.BLUE);

      // Drainage pipe joint
      rect(jx, y13 + 8, 4, 5, PALETTE.STEEL);
      rect(jx + 1, y13 + 8, 2, 5, PALETTE.STEEL_DK);
    }

    // HVAC copper pipes at y13+14
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x++) {
      px(x, y13 + 14, PALETTE.COPPER);
      px(x, y13 + 15, PALETTE.COPPER);
    }
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x += 2) {
      px(x, y13 + 14, PALETTE.BRASS);
    }

    // Flow direction arrows on water pipe
    const arrowCols = [7, 12, 17, 22];
    for (const ac of arrowCols) {
      const ax = ac * TILE_SIZE + 6;
      const ay = y13 + 4;
      // Right-pointing arrow >
      px(ax, ay - 1, PALETTE.WHITE);
      px(ax + 1, ay, PALETTE.WHITE);
      px(ax, ay + 1, PALETTE.WHITE);
      px(ax - 1, ay, PALETTE.WHITE);
    }

    // Valves on drainage pipe
    const valveCols = [8, 15, 22];
    for (const vc of valveCols) {
      const vx = vc * TILE_SIZE + 4;
      const vy = y13 + 10;
      // Valve body
      rect(vx, vy - 3, 4, 3, PALETTE.RED);
      // Handle (T-shape)
      rect(vx + 1, vy - 5, 2, 2, PALETTE.STEEL_LT);
      px(vx, vy - 5, PALETTE.STEEL_LT);
      px(vx + 3, vy - 5, PALETTE.STEEL_LT);
    }

    // --- Row 14: Lower pipe area with floor and vent slots ---
    const y14 = 14 * TILE_SIZE;

    for (let col = 3; col <= 26; col++) {
      if (this.tiles[14][col] === TILES.VENT_SLOT) continue;
      const x = col * TILE_SIZE;

      rect(x, y14, TILE_SIZE, TILE_SIZE, PALETTE.CONCRETE_DK);

      // Floor grating pattern
      for (let gx = 0; gx < TILE_SIZE; gx += 2) {
        px(x + gx, y14 + 14, PALETTE.DARK_IRON);
        px(x + gx, y14 + 15, PALETTE.DARK_IRON);
      }

      // Vertical pipe drops from above
      if (col % 5 === 0) {
        rect(x + 6, y14, 3, 12, PALETTE.STEEL_DK);
        rect(x + 7, y14, 1, 12, PALETTE.STEEL);
      }

      // Small drain grates
      if (col % 7 === 3) {
        rect(x + 4, y14 + 10, 8, 4, PALETTE.DARK_IRON);
        for (let sx = 5; sx < 12; sx += 2) {
          rect(x + sx, y14 + 11, 1, 2, PALETTE.BLACK);
        }
      }
    }
  }

  /* ================================================================ */
  /*  UNDERGROUND — rows 15-17                                        */
  /* ================================================================ */

  _drawUnderground(ctx, rect, px, line) {
    for (let row = 15; row <= 17; row++) {
      const y = row * TILE_SIZE;

      for (let col = 3; col <= 26; col++) {
        const x = col * TILE_SIZE;

        // Very dark base
        rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.BLACK);

        // Slightly lighter concrete walls
        rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.DARK_GRAY);
        ctx.globalAlpha = 0.4;
        rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.BLACK);
        ctx.globalAlpha = 1;
      }
    }

    // Water drainage channels (row 16, horizontal)
    const chanY = 16 * TILE_SIZE + 10;
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x++) {
      px(x, chanY, PALETTE.DARK_IRON);
      px(x, chanY + 1, PALETTE.WATER_BLUE);
      px(x, chanY + 2, PALETTE.WATER);
      px(x, chanY + 3, PALETTE.WATER_BLUE);
      px(x, chanY + 4, PALETTE.DARK_IRON);
    }
    // Water surface shimmer
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x += 3) {
      px(x, chanY + 1, PALETTE.WATER_LT);
    }

    // Sewage pipe (row 17, larger)
    const sewY = 17 * TILE_SIZE + 4;
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x++) {
      px(x, sewY, PALETTE.DARK_IRON);
      px(x, sewY + 1, PALETTE.DARK_GRAY);
      px(x, sewY + 2, PALETTE.DARK_GRAY);
      px(x, sewY + 3, PALETTE.DARK_GRAY);
      px(x, sewY + 4, PALETTE.DARK_IRON);
    }
    // Highlight on top
    for (let x = 3 * TILE_SIZE; x < 27 * TILE_SIZE; x += 3) {
      px(x, sewY, PALETTE.STEEL_DK);
    }

    // Pump rooms (cols 7-9 and 20-22 on row 15)
    const pumpSections = [[7, 9], [20, 22]];
    for (const [start, end] of pumpSections) {
      for (let col = start; col <= end; col++) {
        const x = col * TILE_SIZE;
        const py = 15 * TILE_SIZE;

        // Pump housing
        rect(x + 2, py + 3, 12, 10, PALETTE.DARK_IRON);
        rect(x + 3, py + 4, 10, 8, PALETTE.STEEL_DK);

        // Motor
        rect(x + 5, py + 5, 6, 4, PALETTE.COPPER);
        rect(x + 6, py + 6, 4, 2, PALETTE.BRASS);

        // Status light
        px(x + 4, py + 3, PALETTE.GREEN);

        // Pipe connections
        rect(x + 1, py + 7, 2, 2, PALETTE.STEEL);
        rect(x + 13, py + 7, 2, 2, PALETTE.STEEL);
      }
    }

    // Dripping water pixels (scattered)
    const dripPositions = [
      [5, 15, 2], [10, 15, 8], [16, 15, 5], [23, 15, 11],
      [8, 16, 3], [14, 16, 7], [19, 16, 14], [25, 16, 1],
      [6, 17, 9], [12, 17, 4], [21, 17, 12],
    ];
    for (const [dc, dr, dx] of dripPositions) {
      const dpx = dc * TILE_SIZE + dx;
      const dpy = dr * TILE_SIZE;

      // Water drop trail
      ctx.globalAlpha = 0.5;
      px(dpx, dpy + 1, PALETTE.WATER_LT);
      ctx.globalAlpha = 0.3;
      px(dpx, dpy + 3, PALETTE.WATER);
      px(dpx, dpy + 5, PALETTE.WATER_LT);
      ctx.globalAlpha = 1;
    }

    // Vertical support columns every 6 tiles
    for (let col = 6; col <= 24; col += 6) {
      const cx = col * TILE_SIZE + 6;
      for (let row = 15; row <= 17; row++) {
        const cy = row * TILE_SIZE;
        rect(cx, cy, 4, TILE_SIZE, PALETTE.CONCRETE_DK);
        rect(cx + 1, cy, 2, TILE_SIZE, PALETTE.CONCRETE);
      }
    }
  }

  /* ================================================================ */
  /*  FOUNDATION — rows 18-19                                         */
  /* ================================================================ */

  _drawFoundation(ctx, rect, px) {
    for (let row = 18; row <= 19; row++) {
      const y = row * TILE_SIZE;

      for (let col = 2; col <= 27; col++) {
        if (this.tiles[row][col] !== TILES.WALL) continue;
        const x = col * TILE_SIZE;

        // Heavy stone/concrete block
        rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.CONCRETE_DK);

        // Block pattern (larger blocks for foundation)
        rect(x, y + 8, TILE_SIZE, 1, PALETTE.BLACK);

        // Vertical joints (offset by row)
        const vOff = (row % 2 === 0) ? 6 : 12;
        if (vOff < TILE_SIZE) {
          rect(x + vOff, y, 1, 8, PALETTE.BLACK);
        }
        if (vOff + 8 < TILE_SIZE) {
          rect(x + vOff + 8, y + 8, 1, 8, PALETTE.BLACK);
        }

        // Aging: cracks
        if (_hash(col, row, 30) > 0.75) {
          const crX = x + Math.floor(_hash(col, row, 31) * 12) + 2;
          const crY = y + Math.floor(_hash(col, row, 32) * 10) + 2;
          px(crX, crY, PALETTE.BLACK);
          px(crX + 1, crY + 1, PALETTE.BLACK);
          px(crX, crY + 2, PALETTE.BLACK);
        }

        // Moss / age stains
        if (_hash(col, row, 40) > 0.6) {
          ctx.globalAlpha = 0.3;
          const mX = x + Math.floor(_hash(col, row, 41) * 10) + 2;
          const mY = y + Math.floor(_hash(col, row, 42) * 10) + 2;
          px(mX, mY, PALETTE.MOSS_GREEN);
          px(mX + 1, mY, PALETTE.MOSS_GREEN);
          px(mX, mY + 1, PALETTE.MOSS_GREEN);
          ctx.globalAlpha = 1;
        }

        // Dark bottom edge (ground contact)
        if (row === 19) {
          rect(x, y + 14, TILE_SIZE, 2, PALETTE.BLACK);
        }
      }
    }
  }

  /* ================================================================ */
  /*  EXTERIOR WALLS — cols 0-2 and 27-29                             */
  /* ================================================================ */

  _drawExteriorWalls(ctx, rect, px, line) {
    // Left exterior (cols 0-2)
    this._drawExteriorSide(ctx, rect, px, line, 0, 2, true);
    // Right exterior (cols 27-29)
    this._drawExteriorSide(ctx, rect, px, line, 27, 29, false);
  }

  _drawExteriorSide(ctx, rect, px, line, startCol, endCol, isLeft) {
    for (let col = startCol; col <= endCol; col++) {
      for (let row = 0; row < this.rows; row++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const tileId = this.tiles[row][col];

        if (tileId === TILES.SKY) {
          // Already drawn by sky renderer
          continue;
        }

        if (tileId === TILES.WALL) {
          // Brick/concrete facade
          rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.CONCRETE);

          // Brick pattern
          for (let by = 0; by < TILE_SIZE; by += 5) {
            rect(x, y + by + 4, TILE_SIZE, 1, PALETTE.CONCRETE_DK);
          }
          const brickOffset = (row % 2 === 0) ? 0 : 7;
          rect(x + brickOffset, y, 1, 5, PALETTE.CONCRETE_DK);
          if (brickOffset + 7 < TILE_SIZE) {
            rect(x + brickOffset + 7, y, 1, 5, PALETTE.CONCRETE_DK);
          }

          // Facade detail on outermost columns
          if (col === startCol || col === endCol) {
            // Decorative pilaster
            rect(x + (isLeft ? 12 : 0), y, 4, TILE_SIZE, PALETTE.CONCRETE_LT);
            rect(x + (isLeft ? 13 : 1), y, 2, TILE_SIZE, PALETTE.CONCRETE);
          }
        } else if (tileId === TILES.EMPTY) {
          // For rows that have stadium content but empty on exteriors
          // draw exterior brick continuation if adjacent to stadium
          if (row >= 3 && row <= 19) {
            rect(x, y, TILE_SIZE, TILE_SIZE, PALETTE.CONCRETE);
            rect(x, y + 4, TILE_SIZE, 1, PALETTE.CONCRETE_DK);
            rect(x, y + 10, TILE_SIZE, 1, PALETTE.CONCRETE_DK);
          }
        }
      }
    }

    // Team logo area (centered vertically on exterior, rows 6-8)
    const logoCol = isLeft ? startCol : endCol;
    const logoX = logoCol * TILE_SIZE;
    const logoY = 6 * TILE_SIZE;

    // Logo background banner
    rect(logoX + 2, logoY + 2, 12, 28, PALETTE.NAVY);
    rect(logoX + 3, logoY + 3, 10, 26, PALETTE.DARK_BLUE);

    // Simplified "R" letter for Raptors
    const lx = logoX + 5;
    const ly = logoY + 6;
    // Vertical stroke
    for (let i = 0; i < 8; i++) px(lx, ly + i, PALETTE.GOLD);
    // Top horizontal
    px(lx + 1, ly, PALETTE.GOLD);
    px(lx + 2, ly, PALETTE.GOLD);
    px(lx + 3, ly, PALETTE.GOLD);
    // Middle horizontal
    px(lx + 1, ly + 3, PALETTE.GOLD);
    px(lx + 2, ly + 3, PALETTE.GOLD);
    px(lx + 3, ly + 3, PALETTE.GOLD);
    // Right verticals
    px(lx + 4, ly + 1, PALETTE.GOLD);
    px(lx + 4, ly + 2, PALETTE.GOLD);
    // Diagonal leg
    px(lx + 2, ly + 4, PALETTE.GOLD);
    px(lx + 3, ly + 5, PALETTE.GOLD);
    px(lx + 4, ly + 6, PALETTE.GOLD);
    px(lx + 5, ly + 7, PALETTE.GOLD);

    // Entrance gates (bottom rows 16-17 on exterior columns)
    if (isLeft) {
      // Gate opening
      const gateY = 16 * TILE_SIZE;
      for (let gc = startCol; gc <= startCol + 1; gc++) {
        const gx = gc * TILE_SIZE;
        // Dark gate opening
        rect(gx + 2, gateY, 12, TILE_SIZE * 2, PALETTE.BLACK);
        // Gate frame
        rect(gx + 1, gateY, 1, TILE_SIZE * 2, PALETTE.STEEL);
        rect(gx + 14, gateY, 1, TILE_SIZE * 2, PALETTE.STEEL);
        // Gate arch top
        rect(gx + 2, gateY, 12, 2, PALETTE.STEEL_LT);
        // Gate bars
        for (let gb = 4; gb < 12; gb += 3) {
          rect(gx + gb, gateY + 2, 1, TILE_SIZE * 2 - 2, PALETTE.DARK_IRON);
        }
      }
    } else {
      const gateY = 16 * TILE_SIZE;
      for (let gc = endCol - 1; gc <= endCol; gc++) {
        const gx = gc * TILE_SIZE;
        rect(gx + 2, gateY, 12, TILE_SIZE * 2, PALETTE.BLACK);
        rect(gx + 1, gateY, 1, TILE_SIZE * 2, PALETTE.STEEL);
        rect(gx + 14, gateY, 1, TILE_SIZE * 2, PALETTE.STEEL);
        rect(gx + 2, gateY, 12, 2, PALETTE.STEEL_LT);
        for (let gb = 4; gb < 12; gb += 3) {
          rect(gx + gb, gateY + 2, 1, TILE_SIZE * 2 - 2, PALETTE.DARK_IRON);
        }
      }
    }
  }

  /* ================================================================ */
  /*  Vent slot overlays — normal glow + placement-mode highlights    */
  /* ================================================================ */

  _renderVentSlotOverlays(renderer, time, domainGlowColors, state) {
    const t = time * 0.001;
    const pm = this.placementMode;
    const occupied = this.placementOccupied;
    const domainHealth = state?.domainHealth ?? { air: 100, water: 100, hvac: 100, drainage: 100 };

    for (const slot of this._ventSlots) {
      const x = slot.col * TILE_SIZE;
      const y = slot.row * TILE_SIZE;
      const key = `${slot.col},${slot.row}`;
      const isOccupied = occupied && occupied.has(key);

      if (pm && isOccupied) {
        // Placement mode: occupied slot — red pulsing highlight
        const pulse = 0.2 + 0.15 * Math.sin(t * 3.3);
        renderer.save();
        renderer.setAlpha(pulse);
        renderer.drawRect(x, y, TILE_SIZE, TILE_SIZE, '#dd3333');
        renderer.restore();
        // Red border
        renderer.save();
        renderer.setAlpha(0.6);
        renderer.drawRect(x, y, TILE_SIZE, 1, '#ff4444');
        renderer.drawRect(x, y + TILE_SIZE - 1, TILE_SIZE, 1, '#ff4444');
        renderer.drawRect(x, y, 1, TILE_SIZE, '#ff4444');
        renderer.drawRect(x + TILE_SIZE - 1, y, 1, TILE_SIZE, '#ff4444');
        renderer.restore();
      } else if (pm && !isOccupied) {
        // Placement mode: brighter pulse, color-coded by domain match
        const domainMatch = !slot.domain || !pm.domain || slot.domain === pm.domain;
        const pulse = Math.sin(t * 4) * 0.2 + 0.55; // faster, brighter pulse
        renderer.save();
        renderer.setAlpha(pulse);
        renderer.drawRect(x, y, TILE_SIZE, TILE_SIZE, domainMatch ? '#44dd44' : '#dd6622');
        renderer.restore();
        // Draw a 1px border for extra clarity
        renderer.save();
        renderer.setAlpha(domainMatch ? 0.8 : 0.5);
        renderer.drawRect(x, y, TILE_SIZE, 1, domainMatch ? '#88ff88' : '#ff8844');
        renderer.drawRect(x, y + TILE_SIZE - 1, TILE_SIZE, 1, domainMatch ? '#88ff88' : '#ff8844');
        renderer.drawRect(x, y, 1, TILE_SIZE, domainMatch ? '#88ff88' : '#ff8844');
        renderer.drawRect(x + TILE_SIZE - 1, y, 1, TILE_SIZE, domainMatch ? '#88ff88' : '#ff8844');
        renderer.restore();
      } else {
        // Normal domain-colored glow
        const pulse = Math.sin(t * 3) * 0.15 + 0.35;
        renderer.save();
        renderer.setAlpha(pulse);
        renderer.drawRect(x, y, TILE_SIZE, TILE_SIZE, domainGlowColors[slot.domain] ?? PALETTE.GREEN);
        renderer.restore();
      }

      // --- Health-based colored border overlay ---
      // Renders on top of the existing glow regardless of placement mode
      const hp = domainHealth[slot.domain] ?? 100;
      let borderColor, borderAlpha, borderThickness;

      if (hp > 60) {
        // Green glow — healthy
        borderColor = '#44ff44';
        borderAlpha = 0.25 + Math.sin(t * 2) * 0.05; // subtle steady glow
        borderThickness = 1;
      } else if (hp > 40) {
        // Yellow — caution
        borderColor = '#ffdd44';
        borderAlpha = 0.4 + Math.sin(t * 3) * 0.1;
        borderThickness = 1;
      } else if (hp > 20) {
        // Orange pulsing — warning
        borderColor = '#ff8833';
        borderAlpha = 0.4 + Math.sin(t * 5) * 0.25; // faster pulsing
        borderThickness = 2;
      } else {
        // Red pulsing + thick border — critical
        borderColor = '#ff2222';
        borderAlpha = 0.5 + Math.sin(t * 7) * 0.35; // rapid pulsing
        borderThickness = 2;
      }

      renderer.save();
      renderer.setAlpha(Math.max(0, Math.min(1, borderAlpha)));
      // Draw border lines (top, bottom, left, right) with appropriate thickness
      for (let i = 0; i < borderThickness; i++) {
        renderer.drawRect(x + i, y + i, TILE_SIZE - 2 * i, 1, borderColor);                   // top
        renderer.drawRect(x + i, y + TILE_SIZE - 1 - i, TILE_SIZE - 2 * i, 1, borderColor);   // bottom
        renderer.drawRect(x + i, y + i, 1, TILE_SIZE - 2 * i, borderColor);                   // left
        renderer.drawRect(x + TILE_SIZE - 1 - i, y + i, 1, TILE_SIZE - 2 * i, borderColor);   // right
      }
      renderer.restore();
    }
  }

  /* ================================================================ */
  /*  ANIMATED OVERLAYS — drawn every frame (not cached)              */
  /* ================================================================ */

  _renderAnimated(renderer, state) {
    const _domainGlowColors = {
      air: '#cccccc', water: '#4488ff', hvac: '#ff8844', drainage: '#44bb44',
    };

    // For non-field zones, delegate animated overlays to ZoneRenderer
    if (this._currentZone !== 'field') {
      this._zoneRenderer.renderZoneAnimated(this._currentZone, renderer, state);
      // Still render vent slot glow for all zones (domain-colored)
      const time = state?.time ?? Date.now();
      this._renderVentSlotOverlays(renderer, time, _domainGlowColors, state);
      // Health-based visual degradation overlays for non-field zones
      this._renderHealthOverlays(renderer, state);
      // Weather effects render on all zones
      this._renderWeatherEffects(renderer, state);
      return;
    }

    const time = state?.time ?? Date.now();
    const t = time * 0.001; // seconds

    // --- Moving clouds (field zone only, behind weather) ---
    this._renderClouds(renderer);

    // --- Day/night sky tint based on inning ---
    this._renderSkyTint(renderer, state);

    // --- Vent slot pulsing glow (domain-colored) ---
    this._renderVentSlotOverlays(renderer, time, _domainGlowColors, state);

    // --- Dripping water animation in underground ---
    const dripCols = [5, 10, 16, 23];
    for (const dc of dripCols) {
      const dx = dc * TILE_SIZE + 8;
      const phase = (t * 20 + dc * 7) % 32;
      const dropY = 15 * TILE_SIZE + phase;

      if (dropY < 18 * TILE_SIZE) {
        renderer.save();
        renderer.setAlpha(0.6);
        renderer.drawPixel(dx, dropY, PALETTE.WATER_LT);
        renderer.drawPixel(dx, dropY - 1, PALETTE.WATER);
        renderer.setAlpha(0.3);
        renderer.drawPixel(dx, dropY - 2, PALETTE.WATER);
        renderer.restore();
      }
    }

    // --- Stadium light flicker (subtle) ---
    const lightPositions = [3, 4, 25, 26];
    const roofY = 3 * TILE_SIZE;
    renderer.save();
    const flicker = 0.05 + Math.sin(t * 8) * 0.03 + Math.sin(t * 13) * 0.02;
    renderer.setAlpha(flicker);
    for (const col of lightPositions) {
      const lx = col * TILE_SIZE;
      // Light cone below the fixtures
      renderer.drawRect(lx - 4, roofY - 10, TILE_SIZE + 8, 12, PALETTE.YELLOW);
    }
    renderer.restore();

    // --- Dynamic scoreboard data ---
    this._renderScoreboardData(renderer, state, t);

    // --- Seated fans — scaled by attendance percentage ---
    this._renderSeatedFans(renderer, state);

    // --- Weather effects (rain, snow, heat, wind) on top ---
    this._renderWeatherEffects(renderer, state);
  }

  /* ================================================================ */
  /*  WEATHER EFFECTS — animated overlays based on active event       */
  /* ================================================================ */

  _renderWeatherEffects(renderer, state) {
    const event = state?.activeEvent;
    if (!event || event.category !== 'weather') return;

    const ctx = renderer.ctx;
    const now = Date.now();
    const W = this.cols * TILE_SIZE; // 480
    const H = this.rows * TILE_SIZE; // 320
    const name = event.name;

    // --- Rain (Light Rain, Heavy Rain, Heavy Thunderstorm) ---
    const isHeavyRain = name === 'Heavy Thunderstorm' || name === 'Heavy Rain';
    if (name === 'Light Rain' || isHeavyRain) {
      // Initialize rain drops once
      if (!this._rainDrops) {
        const count = isHeavyRain ? 60 : 30;
        this._rainDrops = [];
        for (let i = 0; i < count; i++) {
          this._rainDrops.push({
            x: Math.random() * W,
            y: Math.random() * H,
            speed: 80 + Math.random() * 60, // px/sec
            alpha: 0.3 + Math.random() * 0.3,
          });
        }
        this._rainLastTime = now;
      }
      // Re-initialize if count changed (event switched)
      const targetCount = isHeavyRain ? 60 : 30;
      if (this._rainDrops.length !== targetCount) {
        this._rainDrops = [];
        for (let i = 0; i < targetCount; i++) {
          this._rainDrops.push({
            x: Math.random() * W,
            y: Math.random() * H,
            speed: 80 + Math.random() * 60,
            alpha: 0.3 + Math.random() * 0.3,
          });
        }
      }

      const dt = (now - this._rainLastTime) / 1000;
      this._rainLastTime = now;

      ctx.save();
      ctx.strokeStyle = '#88bbff';
      ctx.lineWidth = 1;
      for (const drop of this._rainDrops) {
        drop.y = (drop.y + drop.speed * dt) % H;
        drop.x = (drop.x - drop.speed * dt * 0.3 + W) % W; // slight diagonal
        ctx.globalAlpha = drop.alpha;
        ctx.beginPath();
        ctx.moveTo(Math.floor(drop.x) + 0.5, Math.floor(drop.y) + 0.5);
        ctx.lineTo(Math.floor(drop.x + 1) + 0.5, Math.floor(drop.y + 3) + 0.5);
        ctx.stroke();
      }

      // Heavy rain gets a dark tint overlay
      if (isHeavyRain) {
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#000033';
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    // --- Heatwave / Hot & Humid ---
    else if (name === 'Heatwave' || name === 'Humidity Spike') {
      ctx.save();
      const shimmer = 0.03 + Math.sin(now * 0.002) * 0.015;
      ctx.globalAlpha = shimmer;
      ctx.fillStyle = 'rgba(255, 120, 0, 1)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // --- Snow/Ice, Cold Snap ---
    else if (name === 'Snow/Ice' || name === 'Cold Snap') {
      // Initialize snowflakes once
      if (!this._snowFlakes) {
        this._snowFlakes = [];
        for (let i = 0; i < 30; i++) {
          this._snowFlakes.push({
            x: Math.random() * W,
            y: Math.random() * H,
            speed: 15 + Math.random() * 20, // slow fall
            drift: Math.random() * Math.PI * 2, // sin phase for side drift
          });
        }
        this._snowLastTime = now;
      }

      const dt = (now - this._snowLastTime) / 1000;
      this._snowLastTime = now;

      ctx.save();
      ctx.fillStyle = '#ffffff';
      for (const flake of this._snowFlakes) {
        flake.y = (flake.y + flake.speed * dt) % H;
        flake.drift += dt * 1.5;
        flake.x = (flake.x + Math.sin(flake.drift) * 0.3 + W) % W;
        ctx.globalAlpha = 0.5 + Math.sin(flake.drift) * 0.2;
        ctx.fillRect(Math.floor(flake.x), Math.floor(flake.y), 1, 1);
      }

      // Slight cold blue tint
      if (name === 'Cold Snap') {
        ctx.globalAlpha = 0.03;
        ctx.fillStyle = '#0044aa';
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    // --- Wind Storm ---
    else if (name === 'Wind Storm') {
      if (!this._windStreaks) {
        this._windStreaks = [];
        for (let i = 0; i < 15; i++) {
          this._windStreaks.push({
            x: Math.random() * W,
            y: Math.random() * H,
            len: 4 + Math.random() * 4,
            speed: 120 + Math.random() * 80,
          });
        }
        this._windLastTime = now;
      }

      const dt = (now - this._windLastTime) / 1000;
      this._windLastTime = now;

      ctx.save();
      ctx.fillStyle = '#aaaaaa';
      for (const streak of this._windStreaks) {
        streak.x = (streak.x + streak.speed * dt) % (W + 20) - 10;
        if (streak.x < -10) streak.y = Math.random() * H; // randomize y on wrap
        ctx.globalAlpha = 0.25;
        ctx.fillRect(Math.floor(streak.x), Math.floor(streak.y), Math.floor(streak.len), 1);
      }
      ctx.restore();
    }
  }

  /* ================================================================ */
  /*  MOVING CLOUDS — animated cloud layer for field zone             */
  /* ================================================================ */

  _renderClouds(renderer) {
    // Only render in field zone (where sky is visible)
    if (this._currentZone !== 'field') return;

    // Initialize cloud state once
    if (!this._movingClouds) {
      this._movingClouds = [
        { x: 40, y: 6, speed: 0.8, shape: 0 },
        { x: 160, y: 10, speed: 1.2, shape: 1 },
        { x: 300, y: 4, speed: 0.6, shape: 2 },
        { x: 420, y: 14, speed: 1.0, shape: 3 },
      ];
      this._cloudLastTime = Date.now();

      // Cloud pixel shapes — small clusters appropriate for pixel art
      this._cloudShapes = [
        // Shape 0: small fluffy (8x3)
        [[0,0,1,1,1,1,0,0],
         [1,1,1,1,1,1,1,0],
         [0,1,1,1,1,1,0,0]],
        // Shape 1: wide flat (10x3)
        [[0,0,1,1,1,1,1,0,0,0],
         [1,1,1,1,1,1,1,1,1,0],
         [0,0,1,1,1,1,1,1,0,0]],
        // Shape 2: small round (6x3)
        [[0,1,1,1,0,0],
         [1,1,1,1,1,0],
         [0,1,1,1,0,0]],
        // Shape 3: elongated (12x3)
        [[0,0,0,1,1,1,1,0,0,0,0,0],
         [0,1,1,1,1,1,1,1,1,1,0,0],
         [0,0,1,1,1,1,1,1,0,0,0,0]],
      ];
    }

    const now = Date.now();
    const dt = (now - this._cloudLastTime) / 1000;
    this._cloudLastTime = now;

    const ctx = renderer.ctx;
    const W = this.cols * TILE_SIZE;
    const skyMaxY = 3 * TILE_SIZE; // clouds only in the sky rows (0-2)

    ctx.save();
    for (const cloud of this._movingClouds) {
      const shape = this._cloudShapes[cloud.shape];
      const shapeW = shape[0].length;

      // Move cloud right
      cloud.x += cloud.speed * dt;
      if (cloud.x > W + shapeW) cloud.x = -shapeW - 2;

      // Only draw if in sky area
      if (cloud.y + shape.length > skyMaxY) continue;

      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col]) {
            const px = Math.floor(cloud.x + col);
            const py = Math.floor(cloud.y + row);
            if (px >= 0 && px < W && py >= 0 && py < skyMaxY) {
              // Bright top row, slightly darker bottom
              ctx.globalAlpha = row === 0 ? 0.4 : (row === 1 ? 0.35 : 0.25);
              ctx.fillStyle = row <= 1 ? '#ffffff' : '#ccccdd';
              ctx.fillRect(px, py, 1, 1);
            }
          }
        }
      }
    }
    ctx.restore();
  }

  /* ================================================================ */
  /*  DAY/NIGHT SKY TINT — inning-based color overlay on sky region   */
  /* ================================================================ */

  _renderSkyTint(renderer, state) {
    const inning = state?.inning ?? 1;

    // Innings 1-3: bright afternoon, no tint
    if (inning <= 3) return;

    const ctx = renderer.ctx;
    const W = this.cols * TILE_SIZE;
    const skyH = 3 * TILE_SIZE; // rows 0-2 = sky

    ctx.save();

    if (inning <= 5) {
      // Innings 4-5: warm golden tint
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255, 180, 60, 0.06)';
      ctx.fillRect(0, 0, W, skyH);
    } else if (inning <= 7) {
      // Innings 6-7: sunset tint
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255, 100, 40, 0.10)';
      ctx.fillRect(0, 0, W, skyH);
    } else {
      // Innings 8-9: dusk
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(20, 10, 60, 0.15)';
      ctx.fillRect(0, 0, W, skyH);

      // Stadium lights glow brighter at dusk — draw bright dots at light fixture positions
      const lightCols = [3, 4, 25, 26];
      const roofY = 3 * TILE_SIZE;
      for (const col of lightCols) {
        const lx = col * TILE_SIZE + 7;
        const bulbX = [lx - 3, lx - 1, lx + 1, lx + 3];
        for (const bx of bulbX) {
          // Bright white core
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, roofY - 16, 2, 2);
          // Yellow glow halo
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = '#ffee88';
          ctx.fillRect(bx - 1, roofY - 17, 4, 4);
        }
        // Extended light cone below fixtures
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#ffee88';
        ctx.fillRect(lx - 6, roofY - 14, 14, 10);
      }
    }

    ctx.restore();
  }

  /* ================================================================ */
  /*  HEALTH-BASED TILE OVERLAYS — visual degradation on non-field    */
  /* ================================================================ */

  _renderHealthOverlays(renderer, state) {
    const health = state?.domainHealth ?? { air: 100, water: 100, hvac: 100, drainage: 100 };
    const ctx = renderer.ctx;
    const zone = this._currentZone;
    const now = (state?.time ?? Date.now()) * 0.001;

    ctx.save();

    // --- Water health < 50: rust spots on pipe tiles ---
    if (health.water < 50) {
      const alpha = Math.min(0.7, (50 - health.water) / 50);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#8B4513'; // rust brown
      // Fixed rust positions per zone
      const rustSpots = {
        concourse: [[6 * 16 + 3, 12 * 16 + 4], [21 * 16 + 7, 12 * 16 + 6], [10 * 16 + 2, 2 * 16 + 8]],
        mechanical: [[6 * 16 + 5, 10 * 16 + 3], [15 * 16 + 9, 10 * 16 + 5], [24 * 16 + 4, 14 * 16 + 3]],
        underground: [[5 * 16 + 8, 6 * 16 + 3], [15 * 16 + 4, 6 * 16 + 7], [8 * 16 + 10, 13 * 16 + 5]],
        luxury: [[5 * 16 + 3, 2 * 16 + 6], [15 * 16 + 8, 2 * 16 + 4], [25 * 16 + 5, 2 * 16 + 8]],
        pressbox: [[7 * 16 + 5, 1 * 16 + 8], [22 * 16 + 3, 1 * 16 + 6]],
      };
      const spots = rustSpots[zone] ?? [];
      for (const [rx, ry] of spots) {
        ctx.fillRect(rx, ry, 2, 1);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(rx + 1, ry + 1, 1, 1);
        ctx.fillStyle = '#8B4513';
      }
    }

    // --- Drainage health < 40: small puddle spots on floor ---
    if (health.drainage < 40) {
      const alpha = Math.min(0.6, (40 - health.drainage) / 40);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#4466aa';
      const puddleSpots = {
        concourse: [[8 * 16 + 4, 15 * 16 + 2], [18 * 16 + 6, 15 * 16 + 4], [14 * 16 + 3, 10 * 16 + 8]],
        mechanical: [[7 * 16 + 5, 15 * 16 + 3], [18 * 16 + 8, 15 * 16 + 2], [12 * 16 + 4, 9 * 16 + 7]],
        underground: [[10 * 16 + 3, 10 * 16 + 4], [20 * 16 + 6, 10 * 16 + 2], [14 * 16 + 8, 7 * 16 + 5]],
        luxury: [[4 * 16 + 6, 14 * 16 + 3], [15 * 16 + 3, 14 * 16 + 5], [24 * 16 + 8, 14 * 16 + 2]],
        pressbox: [[10 * 16 + 5, 15 * 16 + 3], [20 * 16 + 7, 15 * 16 + 5]],
      };
      const spots = puddleSpots[zone] ?? [];
      for (const [px, py] of spots) {
        ctx.fillRect(px, py, 3, 1);
        ctx.fillStyle = '#5588cc';
        ctx.fillRect(px + 1, py - 1, 1, 1);
        ctx.fillStyle = '#4466aa';
      }
    }

    // --- Air health < 40: floating dust specks ---
    if (health.air < 40) {
      const alpha = Math.min(0.5, (40 - health.air) / 40);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#999999';
      const dustSpots = {
        concourse: [[5 * 16 + 8, 7 * 16 + 3], [14 * 16 + 4, 6 * 16 + 10], [22 * 16 + 7, 8 * 16 + 5]],
        mechanical: [[4 * 16 + 6, 5 * 16 + 7], [14 * 16 + 9, 6 * 16 + 4], [23 * 16 + 3, 5 * 16 + 9]],
        underground: [[6 * 16 + 4, 8 * 16 + 3], [16 * 16 + 7, 7 * 16 + 8], [24 * 16 + 5, 9 * 16 + 4]],
        luxury: [[6 * 16 + 5, 6 * 16 + 4], [14 * 16 + 8, 7 * 16 + 6], [23 * 16 + 3, 6 * 16 + 8]],
        pressbox: [[8 * 16 + 6, 5 * 16 + 4], [18 * 16 + 3, 6 * 16 + 7]],
      };
      const spots = dustSpots[zone] ?? [];
      // Animate dust specks with subtle bobbing
      for (let i = 0; i < spots.length; i++) {
        const [dx, dy] = spots[i];
        const bob = Math.sin(now * 1.5 + i * 2.3) * 2;
        ctx.fillRect(dx, dy + bob, 1, 1);
      }
    }

    ctx.restore();
  }

  /**
   * Draw tiny seated fan figures based on attendancePercent.
   * Uses the same _hash determinism so fans appear in stable positions,
   * but the threshold for showing a fan scales with attendance.
   */
  _renderSeatedFans(renderer, state) {
    const attPct = state?.attendancePercent ?? 65;
    // Map attendance 0-100% to fill threshold: at 100% almost all seats filled,
    // at 0% almost none. Base hash threshold was 0.35 (65% fill).
    // New threshold: higher = fewer fans shown.  attPct 100 → threshold 0.05, attPct 0 → threshold 1.0
    const fillThreshold = 1.0 - (attPct / 100) * 0.95;

    const seatSections = [
      { startCol: 3, endCol: 12 },
      { startCol: 18, endCol: 26 },
    ];

    const skinColors = [PALETTE.SKIN, PALETTE.SKIN_DK, PALETTE.SKIN_MED, PALETTE.SKIN_TAN, PALETTE.SKIN_DEEP];
    const shirtColors = [
      PALETTE.RED, PALETTE.CRIMSON, PALETTE.NAVY,
      PALETTE.RED, PALETTE.NAVY,
      PALETTE.BLUE, PALETTE.WHITE, PALETTE.GREEN, PALETTE.ORANGE, PALETTE.YELLOW, PALETTE.PINK, PALETTE.TEAL,
    ];

    for (const section of seatSections) {
      for (let row = 4; row <= 5; row++) {
        const y = row * TILE_SIZE;
        for (let col = section.startCol; col <= section.endCol; col++) {
          const x = col * TILE_SIZE;
          for (let s = 0; s < 4; s++) {
            const sx = x + 1 + s * 4;
            const sy = y + 2 + (row === 5 ? 1 : 0);

            if (_hash(col, row, s) > fillThreshold) {
              // Head
              const skinIdx = Math.floor(_hash(col, row, s + 100) * skinColors.length);
              renderer.drawPixel(sx + 1, sy - 2, skinColors[skinIdx]);
              // Shirt
              const shirtIdx = Math.floor(_hash(col, row, s + 200) * shirtColors.length);
              renderer.drawPixel(sx + 1, sy - 1, shirtColors[shirtIdx]);
              // Hat (~30%)
              if (_hash(col, row, s + 300) > 0.7) {
                const hatColor = _hash(col, row, s + 301) > 0.5 ? PALETTE.RED : PALETTE.NAVY;
                renderer.drawPixel(sx + 1, sy - 3, hatColor);
              }
              // Foam finger (~10%)
              if (_hash(col, row, s + 400) > 0.9) {
                renderer.drawPixel(sx + 2, sy - 3, PALETTE.YELLOW);
                renderer.drawPixel(sx + 2, sy - 4, PALETTE.YELLOW);
              }
            }
          }
        }
      }
    }
  }
}

/* ==================================================================== */
/*  Color interpolation helper                                          */
/* ==================================================================== */

function _lerpColor(colorA, colorB, t) {
  const a = _hexToRgb(colorA);
  const b = _hexToRgb(colorB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function _hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
