/**
 * ZoneRenderer — Detailed pixel-art rendering for non-field stadium zones.
 *
 * Each zone gets its own _build* method (static cache) and _animate* method
 * (per-frame overlays like blinking lights, flowing water, etc.).
 */

import PALETTE from '../assets/palette.js';

const TILE_SIZE = 16;
const T = TILE_SIZE;

function _hash(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
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
    E: [
      [1,1,1],
      [1,0,0],
      [1,1,0],
      [1,0,0],
      [1,1,1],
    ],
    P: [
      [1,1,0],
      [1,0,1],
      [1,1,0],
      [1,0,0],
      [1,0,0],
    ],
  };
}

export class ZoneRenderer {
  constructor() {
    this._caches = new Map();
  }

  invalidateCache(zoneId) { this._caches.delete(zoneId); }
  invalidateAll() { this._caches.clear(); }

  buildZoneCache(zoneId, tiles, cols, rows, ventSlots) {
    if (this._caches.has(zoneId)) return this._caches.get(zoneId);
    const w = cols * T, h = rows * T;
    const canvas = (typeof OffscreenCanvas !== 'undefined')
      ? new OffscreenCanvas(w, h)
      : (() => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; })();
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const rect = (x, y, rw, rh, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, rw, rh); };
    const px = (x, y, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); };

    switch (zoneId) {
      case 'concourse': this._buildConcourse(ctx, rect, px, cols, rows); break;
      case 'mechanical': this._buildMechanical(ctx, rect, px, cols, rows); break;
      case 'underground': this._buildUnderground(ctx, rect, px, cols, rows); break;
      case 'luxury': this._buildLuxury(ctx, rect, px, cols, rows); break;
      case 'pressbox': this._buildPressBox(ctx, rect, px, cols, rows); break;
    }

    // Draw vent slots on top of zone art
    if (ventSlots && ventSlots.length > 0) {
      this._drawVentSlots(ctx, rect, px, ventSlots);
    }

    this._caches.set(zoneId, canvas);
    return canvas;
  }

  /**
   * Draw vent slot tiles — metallic grille with domain-colored border.
   */
  _drawVentSlots(ctx, rect, px, ventSlots) {
    const domainColors = {
      air: '#cccccc',
      water: '#4488ff',
      hvac: '#ff8844',
      drainage: '#44bb44',
      electrical: '#ffcc00',
      pest: '#cc44cc',
    };

    for (const slot of ventSlots) {
      const x = slot.col * T;
      const y = slot.row * T;
      const borderColor = domainColors[slot.domain] ?? '#00e436';

      // Vent housing — recessed metallic slot
      rect(x, y, T, T, PALETTE.DARK_IRON ?? '#3a3a3a');
      // Grille slats
      for (let sy = 2; sy < T - 2; sy += 3) {
        rect(x + 2, y + sy, T - 4, 2, PALETTE.STEEL ?? '#7e8c8d');
        rect(x + 3, y + sy, T - 6, 1, PALETTE.STEEL_LT ?? '#a8b0b0');
      }
      // Domain-colored border
      for (let gx = 0; gx < T; gx++) {
        px(x + gx, y, borderColor);
        px(x + gx, y + T - 1, borderColor);
      }
      for (let gy = 0; gy < T; gy++) {
        px(x, y + gy, borderColor);
        px(x + T - 1, y + gy, borderColor);
      }
      // Domain indicator dots in corners
      px(x + 1, y + 1, borderColor);
      px(x + 2, y + 1, borderColor);
      px(x + 1, y + 2, borderColor);
      px(x + T - 2, y + 1, borderColor);
      px(x + T - 3, y + 1, borderColor);
      px(x + T - 2, y + 2, borderColor);

      // Domain letter label centered in vent slot (3x5 pixel font)
      const letterBitmaps = _ventSlotLetterMap();
      const letter = { air: 'A', water: 'W', hvac: 'H', drainage: 'D', electrical: 'E', pest: 'P' }[slot.domain];
      const bitmap = letterBitmaps[letter];
      if (bitmap) {
        const lx = x + 6; // center 3px letter in 16px tile
        const ly = y + 5; // center 5px letter in 16px tile
        for (let r = 0; r < bitmap.length; r++) {
          for (let c = 0; c < bitmap[r].length; c++) {
            if (bitmap[r][c]) {
              px(lx + c, ly + r, borderColor);
            }
          }
        }
      }
    }
  }

  renderZoneAnimated(zoneId, renderer, state) {
    switch (zoneId) {
      case 'concourse': this._animateConcourse(renderer, state); break;
      case 'mechanical': this._animateMechanical(renderer, state); break;
      case 'underground': this._animateUnderground(renderer, state); break;
      case 'luxury': this._animateLuxury(renderer, state); break;
      case 'pressbox': this._animatePressBox(renderer, state); break;
    }
  }

  /* ================================================================ */
  /*  CONCOURSE                                                        */
  /* ================================================================ */

  _buildConcourse(ctx, rect, px, cols, rows) {
    const W = cols * T, H = rows * T;

    // -- Background fill: concrete floor everywhere
    rect(0, 0, W, H, PALETTE.CONCRETE);

    // -- Rows 0-1: Ceiling with fluorescent lights
    for (let col = 0; col < cols; col++) {
      const x = col * T;
      rect(x, 0, T, 2 * T, PALETTE.CONCRETE_DK);
      // Ceiling texture
      for (let py = 0; py < 2 * T; py++) {
        for (let px2 = 0; px2 < T; px2++) {
          if (_hash(x + px2, py, 10) > 0.92) px(x + px2, py, PALETTE.DARK_GRAY);
        }
      }
      // Fluorescent light fixtures every 4 tiles
      if (col % 4 === 2) {
        rect(x + 2, T - 2, 12, 3, PALETTE.LIGHT_GRAY);   // housing
        rect(x + 3, T - 1, 10, 1, PALETTE.WHITE);         // tube
        rect(x + 2, T + 1, 12, 1, PALETTE.STEEL);         // bracket
      }
      // Water stains
      if (_hash(col, 0, 20) > 0.7) {
        const sx = x + Math.floor(_hash(col, 0, 21) * 10);
        for (let dy = 0; dy < 6; dy++) {
          px(sx, 2 + dy, PALETTE.CONCRETE_DK);
          if (_hash(col, dy, 22) > 0.5) px(sx + 1, 3 + dy, PALETTE.CONCRETE_DK);
        }
      }
    }

    // -- Rows 2-3: Ductwork
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 2 * T;
      rect(x, y, T, 2 * T, PALETTE.CONCRETE_DK);
      // Horizontal rectangular duct
      rect(x, y + 4, T, 8, PALETTE.STEEL);
      rect(x, y + 4, T, 1, PALETTE.STEEL_LT);
      rect(x, y + 11, T, 1, PALETTE.STEEL_DK);
      // Round duct cross sections at intervals
      if (col % 6 === 0) {
        this._drawCircle(ctx, px, x + 8, y + 22, 5, PALETTE.STEEL, PALETTE.STEEL_DK);
      }
      // Cable tray below duct
      rect(x, y + 14, T, 2, PALETTE.DARK_GRAY);
      if (col % 3 === 0) {
        px(x + 4, y + 14, PALETTE.RED);    // red wire
        px(x + 8, y + 14, PALETTE.BLUE);   // blue wire
        px(x + 12, y + 14, PALETTE.GREEN); // green wire
      }
      // Pipe hangers
      if (col % 5 === 0) {
        rect(x + 7, y, 2, 4, PALETTE.STEEL_DK);
      }
    }

    // -- Rows 4-5: Upper concourse with banners
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 4 * T;
      rect(x, y, T, 2 * T, PALETTE.CONCRETE_LT);
      // Floor line
      rect(x, y + 2 * T - 1, T, 1, PALETTE.CONCRETE_DK);
      // Banner flags hanging from ceiling every 3 tiles
      if (col % 3 === 1) {
        const bannerColor = (col % 6 === 1) ? PALETTE.RED : PALETTE.BLUE;
        const bannerDk = (col % 6 === 1) ? PALETTE.CRIMSON : PALETTE.DARK_BLUE;
        rect(x + 5, y, 1, 1, PALETTE.STEEL_DK);          // hook
        rect(x + 4, y + 1, 3, 6, bannerColor);            // banner body
        rect(x + 4, y + 1, 3, 1, bannerDk);               // top edge
        px(x + 4, y + 7, bannerColor);                     // pennant point
        px(x + 6, y + 7, bannerColor);
        px(x + 5, y + 8, bannerDk);                        // pennant tip
      }
    }
    // Directional signs
    this._drawSign(ctx, rect, px, 6 * T + 2, 4 * T + 2, 'SEC100', PALETTE.DARK_GREEN, PALETTE.WHITE);
    this._drawSign(ctx, rect, px, 18 * T + 2, 4 * T + 2, 'REST', PALETTE.DARK_BLUE, PALETTE.WHITE);

    // -- Rows 6-11: Main concourse area
    // Fill walkway
    for (let row = 6; row < 12; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * T, y = row * T;
        rect(x, y, T, T, PALETTE.CONCRETE_LT);
        // Checkered tile floor pattern
        if ((col + row) % 2 === 0) {
          rect(x, y, T, T, PALETTE.CONCRETE);
        }
      }
    }

    // LEFT SIDE: Concession stands (cols 1-8)
    this._drawConcessions(ctx, rect, px, 1 * T, 6 * T, 8);

    // CENTER: Walkway details (cols 9-20)
    this._drawWalkway(ctx, rect, px, 9, 20, 6);

    // RIGHT SIDE: Restrooms (cols 21-28)
    this._drawRestrooms(ctx, rect, px, 21 * T, 6 * T, 8);

    // -- Rows 12-13: Merchandise
    this._drawMerchandise(ctx, rect, px, 0, 12 * T, cols);

    // -- Rows 14-15: Ticket area
    this._drawTicketArea(ctx, rect, px, 0, 14 * T, cols);

    // -- Rows 16-17: Lower structure with columns
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 16 * T;
      rect(x, y, T, 2 * T, PALETTE.CONCRETE_DK);
      // Support columns every 5 tiles
      if (col % 5 === 2) {
        rect(x + 5, y, 6, 2 * T, PALETTE.CONCRETE);
        rect(x + 5, y, 1, 2 * T, PALETTE.CONCRETE_LT);
        rect(x + 10, y, 1, 2 * T, PALETTE.CONCRETE_DK);
      }
      // Exposed pipes
      if (col % 7 === 0) {
        rect(x + 2, y + 4, T - 4, 2, PALETTE.STEEL);
        rect(x + 2, y + 10, T - 4, 2, PALETTE.RUST);
      }
    }

    // -- Rows 18-19: Foundation
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 18 * T;
      rect(x, y, T, 2 * T, PALETTE.DARK_GRAY);
      for (let py = 0; py < 2 * T; py++) {
        for (let px2 = 0; px2 < T; px2++) {
          if (_hash(x + px2, y + py, 30) > 0.9) px(x + px2, y + py, PALETTE.BLACK);
        }
      }
    }

    // -- Depth cues: subtle gradient overlay --
    // Ceiling area slightly darker (shadow from above)
    ctx.globalAlpha = 0.05;
    rect(0, 0, W, 2 * T, PALETTE.BLACK);
    ctx.globalAlpha = 0.03;
    rect(0, 16 * T, W, 2 * T, PALETTE.BLACK);
    ctx.globalAlpha = 1;
  }

  _drawConcessions(ctx, rect, px, ox, oy, widthTiles) {
    const w = widthTiles * T;
    // Back wall
    rect(ox, oy, w, 6 * T, PALETTE.CONCRETE);
    rect(ox, oy, w, 1, PALETTE.CONCRETE_DK);

    // Menu board (top area)
    rect(ox + 4, oy + 4, w - 8, 14, PALETTE.DARK_GRAY);
    rect(ox + 4, oy + 4, w - 8, 1, PALETTE.BLACK);
    // Menu text dots
    const menuItems = [
      { x: 8, color: PALETTE.YELLOW },
      { x: 24, color: PALETTE.RED },
      { x: 40, color: PALETTE.GREEN },
      { x: 56, color: PALETTE.ORANGE },
      { x: 72, color: PALETTE.WHITE },
    ];
    for (const item of menuItems) {
      if (ox + item.x < ox + w - 8) {
        for (let i = 0; i < 8; i++) {
          px(ox + item.x + i, oy + 8, item.color);
        }
        // Price dots
        for (let i = 0; i < 4; i++) {
          px(ox + item.x + i, oy + 12, PALETTE.WHITE);
        }
      }
    }

    // Counter surface
    const counterY = oy + 3 * T;
    rect(ox, counterY, w, 4, PALETTE.STEEL);
    rect(ox, counterY, w, 1, PALETTE.STEEL_LT);

    // Sneeze guard (glass)
    rect(ox + 2, counterY - 12, 1, 12, PALETTE.GLASS);
    rect(ox + w - 3, counterY - 12, 1, 12, PALETTE.GLASS);
    rect(ox + 2, counterY - 12, w - 4, 1, PALETTE.GLASS_LT);

    // Hot dog roller (behind counter) with hot dogs
    const rollerX = ox + 8, rollerY = counterY - 10;
    rect(rollerX, rollerY, 16, 8, PALETTE.STEEL);
    for (let i = 0; i < 4; i++) {
      // Hot dog: tan bun with red sausage
      rect(rollerX + 2 + i * 3, rollerY + 2, 2, 4, PALETTE.PEACH);  // bun
      px(rollerX + 2 + i * 3, rollerY + 3, PALETTE.RED);             // sausage
      px(rollerX + 3 + i * 3, rollerY + 3, PALETTE.CRIMSON);
    }

    // Pretzel on counter (brown curve)
    const pretzX = ox + 28, pretzY = counterY - 6;
    px(pretzX + 1, pretzY, PALETTE.BROWN);
    px(pretzX, pretzY + 1, PALETTE.BROWN);
    px(pretzX + 2, pretzY + 1, PALETTE.BROWN);
    px(pretzX, pretzY + 2, PALETTE.DIRT_LT);
    px(pretzX + 2, pretzY + 2, PALETTE.DIRT_LT);
    px(pretzX + 1, pretzY + 3, PALETTE.BROWN);

    // Popcorn machine
    const popX = ox + 32, popY = counterY - 14;
    rect(popX, popY, 10, 12, PALETTE.YELLOW);
    rect(popX, popY, 10, 2, PALETTE.RED);
    rect(popX + 1, popY + 3, 8, 7, PALETTE.WARM_WHITE);
    // Popcorn kernels inside
    for (let i = 0; i < 6; i++) {
      px(popX + 2 + i, popY + 6, PALETTE.YELLOW);
      if (_hash(i, 0, 40) > 0.4) px(popX + 2 + i, popY + 5, PALETTE.WARM_WHITE);
    }

    // Soda fountain
    const sodaX = ox + 50, sodaY = counterY - 10;
    rect(sodaX, sodaY, 12, 8, PALETTE.STEEL);
    rect(sodaX, sodaY, 12, 1, PALETTE.STEEL_LT);
    // Colored soda buttons
    px(sodaX + 2, sodaY + 3, PALETTE.RED);
    px(sodaX + 5, sodaY + 3, PALETTE.ORANGE);
    px(sodaX + 8, sodaY + 3, PALETTE.DARK_GREEN);
    // Nozzles
    for (let i = 0; i < 3; i++) {
      px(sodaX + 2 + i * 3, sodaY + 6, PALETTE.STEEL_DK);
    }

    // Cash register (right side of counter)
    const regX = ox + 68, regY = counterY - 8;
    rect(regX, regY, 10, 6, PALETTE.DARK_GRAY);
    rect(regX + 1, regY + 1, 8, 3, PALETTE.DARK_GREEN);
    // Display
    rect(regX + 2, regY + 1, 6, 2, PALETTE.BLACK);
    px(regX + 3, regY + 2, PALETTE.GREEN);
    px(regX + 5, regY + 2, PALETTE.GREEN);

    // Cashier figure
    const cashX = ox + 80, cashY = counterY - 10;
    px(cashX, cashY, PALETTE.SKIN_MED);       // head
    rect(cashX - 1, cashY + 1, 3, 4, PALETTE.RED); // apron
    px(cashX, cashY + 5, PALETTE.DARK_GRAY);   // legs

    // Floor behind counter
    rect(ox, counterY + 4, w, 3 * T - 4, PALETTE.CONCRETE_DK);
    // Floor drain
    rect(ox + 20, counterY + 20, 6, 6, PALETTE.DARK_GRAY);
    rect(ox + 21, counterY + 21, 4, 4, PALETTE.BLACK);
  }

  _drawWalkway(ctx, rect, px, startCol, endCol, startRow) {
    // Trash cans every 5 tiles with detail
    for (let col = startCol; col <= endCol; col++) {
      if (col % 5 === 0) {
        const x = col * T + 4, y = (startRow + 4) * T;
        rect(x, y, 8, 10, PALETTE.DARK_GRAY);
        rect(x, y, 8, 2, PALETTE.STEEL);
        rect(x + 1, y - 1, 6, 1, PALETTE.STEEL_LT);
        // Trash inside (more variety)
        px(x + 2, y + 3, PALETTE.WHITE);
        px(x + 5, y + 4, PALETTE.RED);
        px(x + 3, y + 5, PALETTE.YELLOW);
        px(x + 6, y + 3, PALETTE.BLUE);
        // Recycle symbol dot
        px(x + 3, y + 7, PALETTE.GREEN);
      }
    }

    // Overhead signage ("101", arrows)
    const ohSigns = [
      { col: startCol + 2, text: '101' },
      { col: startCol + 6, text: '>>>' },
      { col: endCol - 3, text: '102' },
    ];
    for (const sign of ohSigns) {
      const sx = sign.col * T + 2, sy = (startRow) * T + 10;
      rect(sx, sy, 14, 6, PALETTE.DARK_GREEN);
      ctx.fillStyle = PALETTE.WHITE;
      ctx.font = '4px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(sign.text, sx + 7, sy + 1);
    }

    // (Static fan figures removed — CrowdSystem handles animated crowd)

    // Benches
    for (let col = startCol + 2; col <= endCol - 2; col += 7) {
      const bx = col * T, by = (startRow + 3) * T + 8;
      rect(bx, by, 14, 3, PALETTE.BROWN);
      rect(bx, by, 14, 1, PALETTE.DIRT_LT);
      rect(bx, by + 3, 2, 4, PALETTE.DARK_GRAY);
      rect(bx + 12, by + 3, 2, 4, PALETTE.DARK_GRAY);
    }

    // Wet floor sign
    const wfx = 14 * T + 4, wfy = 8 * T;
    rect(wfx, wfy, 6, 8, PALETTE.YELLOW);
    rect(wfx + 1, wfy, 4, 1, PALETTE.YELLOW);
    px(wfx + 3, wfy + 2, PALETTE.BLACK);
    px(wfx + 3, wfy + 4, PALETTE.BLACK);
    rect(wfx + 2, wfy + 6, 2, 1, PALETTE.BLACK);
  }

  _drawRestrooms(ctx, rect, px, ox, oy, widthTiles) {
    const w = widthTiles * T;
    // Tile walls
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < widthTiles; col++) {
        const x = ox + col * T, y = oy + row * T;
        const base = ((col + row) % 2 === 0) ? PALETTE.WHITE : PALETTE.LIGHT_GRAY;
        rect(x, y, T, T, base);
        // Grout lines
        rect(x, y, T, 1, PALETTE.CONCRETE);
        rect(x, y, 1, T, PALETTE.CONCRETE);
      }
    }

    // Door with gender sign
    const doorX = ox + 12, doorY = oy + 8;
    rect(doorX, doorY, 16, 24, PALETTE.STEEL);
    rect(doorX, doorY, 16, 2, PALETTE.STEEL_DK);
    rect(doorX + 14, doorY + 10, 2, 4, PALETTE.STEEL_LT); // handle
    // Men's sign (blue stick figure)
    px(doorX + 7, doorY + 4, PALETTE.BLUE);        // head
    rect(doorX + 6, doorY + 5, 3, 2, PALETTE.BLUE); // body
    px(doorX + 6, doorY + 7, PALETTE.BLUE);         // left leg
    px(doorX + 8, doorY + 7, PALETTE.BLUE);         // right leg

    // Second door (women's)
    const door2X = ox + 40, door2Y = oy + 8;
    rect(door2X, door2Y, 16, 24, PALETTE.STEEL);
    rect(door2X, door2Y, 16, 2, PALETTE.STEEL_DK);
    rect(door2X + 14, door2Y + 10, 2, 4, PALETTE.STEEL_LT);
    // Women's sign (pink figure with triangle skirt)
    px(door2X + 7, door2Y + 4, PALETTE.PINK);
    rect(door2X + 6, door2Y + 5, 3, 1, PALETTE.PINK);
    rect(door2X + 5, door2Y + 6, 5, 2, PALETTE.PINK); // skirt

    // Sinks (row below doors)
    for (let s = 0; s < 3; s++) {
      const sx = ox + 8 + s * 20, sy = oy + 4 * T;
      rect(sx, sy, 8, 4, PALETTE.WHITE);                 // basin
      rect(sx + 1, sy + 1, 6, 2, PALETTE.WATER_LT);     // water
      rect(sx + 3, sy - 3, 2, 3, PALETTE.STEEL);         // faucet
      px(sx + 3, sy - 3, PALETTE.STEEL_LT);
      // Mirror above
      rect(sx - 1, sy - 10, 10, 7, PALETTE.GLASS);
      rect(sx - 1, sy - 10, 10, 1, PALETTE.STEEL);
      // Soap dispenser next to each sink
      rect(sx + 10, sy - 6, 3, 5, PALETTE.LIGHT_GRAY);
      rect(sx + 10, sy - 6, 3, 1, PALETTE.STEEL);
      px(sx + 11, sy - 1, PALETTE.PINK); // soap drop
    }

    // Stall dividers
    for (let s = 0; s < 4; s++) {
      const sx = ox + 4 + s * 24, sy = oy + T;
      rect(sx, sy, 2, 3 * T, PALETTE.STEEL);
    }

    // Paper towel dispenser on far wall
    rect(ox + w - 16, oy + 3 * T, 10, 8, PALETTE.WHITE);
    rect(ox + w - 16, oy + 3 * T, 10, 2, PALETTE.STEEL);
    px(ox + w - 12, oy + 3 * T + 6, PALETTE.LIGHT_GRAY); // towel edge
  }

  _drawMerchandise(ctx, rect, px, ox, oy, cols) {
    // Background
    for (let col = 0; col < cols; col++) {
      rect(ox + col * T, oy, T, 2 * T, PALETTE.CONCRETE_LT);
    }

    // Kiosk structure (center)
    const kx = 10 * T, ky = oy + 2;
    rect(kx, ky, 10 * T, 28, PALETTE.BROWN);
    rect(kx, ky, 10 * T, 2, PALETTE.DARK_BROWN);

    // Jersey display rack
    const jerseyColors = [PALETTE.RED, PALETTE.BLUE, PALETTE.WHITE, PALETTE.GREEN, PALETTE.ORANGE];
    for (let j = 0; j < 5; j++) {
      const jx = kx + 4 + j * 14;
      rect(jx, ky + 4, 10, 12, jerseyColors[j]);
      rect(jx + 3, ky + 4, 4, 2, jerseyColors[j]); // shoulders
      px(jx + 5, ky + 8, PALETTE.WHITE);             // number dot
    }
    // Rack bar
    rect(kx + 2, ky + 3, 10 * T - 4, 1, PALETTE.STEEL);

    // Cap shelf below
    const capColors = [PALETTE.RED, PALETTE.DARK_BLUE, PALETTE.BLACK, PALETTE.WHITE];
    for (let c = 0; c < 4; c++) {
      const cx = kx + 8 + c * 18;
      rect(cx, ky + 18, 8, 4, capColors[c]);
      rect(cx - 1, ky + 21, 10, 2, capColors[c]);
    }
    // Shelf
    rect(kx + 2, ky + 17, 10 * T - 4, 1, PALETTE.BROWN);

    // "RAPTORS" text approximation (colored dots)
    const textX = kx + 30, textY = ky + 26;
    for (let i = 0; i < 7; i++) {
      px(textX + i * 3, textY, PALETTE.RED);
      px(textX + i * 3 + 1, textY, PALETTE.RED);
    }
  }

  _drawTicketArea(ctx, rect, px, ox, oy, cols) {
    // Floor
    for (let col = 0; col < cols; col++) {
      rect(ox + col * T, oy, T, 2 * T, PALETTE.CONCRETE);
      if ((col % 2) === 0) rect(ox + col * T, oy, T, 2 * T, PALETTE.CONCRETE_LT);
    }

    // Ticket booth (left-center)
    const bx = 8 * T, by = oy + 2;
    rect(bx, by, 5 * T, 24, PALETTE.BROWN);
    rect(bx, by, 5 * T, 2, PALETTE.DARK_BROWN);
    // Window
    rect(bx + 10, by + 4, 20, 10, PALETTE.GLASS);
    rect(bx + 10, by + 4, 20, 1, PALETTE.STEEL);
    // Counter ledge
    rect(bx + 8, by + 14, 24, 2, PALETTE.STEEL);
    // Ticket agent
    px(bx + 20, by + 6, PALETTE.SKIN);
    rect(bx + 19, by + 7, 3, 3, PALETTE.BLUE);
    // "TICKETS" sign
    rect(bx + 14, by - 6, 30, 6, PALETTE.RED);
    for (let i = 0; i < 7; i++) {
      px(bx + 16 + i * 3, by - 4, PALETTE.WHITE);
      px(bx + 17 + i * 3, by - 4, PALETTE.WHITE);
    }

    // Turnstiles (right side)
    for (let t = 0; t < 3; t++) {
      const tx = 18 * T + t * 3 * T, ty = oy + 8;
      rect(tx, ty, 6, 20, PALETTE.STEEL);
      rect(tx, ty, 6, 2, PALETTE.STEEL_LT);
      // Rotating arm
      rect(tx + 2, ty + 6, 2, 8, PALETTE.STEEL_DK);
      px(tx + 1, ty + 10, PALETTE.STEEL_LT);
      px(tx + 4, ty + 10, PALETTE.STEEL_LT);
      // Green light on top
      px(tx + 3, ty - 1, PALETTE.GREEN);
    }
  }

  /* ================================================================ */
  /*  MECHANICAL                                                       */
  /* ================================================================ */

  _buildMechanical(ctx, rect, px, cols, rows) {
    const W = cols * T, H = rows * T;

    // Base fill: dark concrete
    rect(0, 0, W, H, PALETTE.CONCRETE_DK);

    // -- Rows 0-2: Heavy ductwork ceiling
    for (let col = 0; col < cols; col++) {
      const x = col * T;
      rect(x, 0, T, 3 * T, PALETTE.DARK_GRAY);
      // Large rectangular duct
      rect(x, 8, T, 16, PALETTE.STEEL);
      rect(x, 8, T, 2, PALETTE.STEEL_LT);
      rect(x, 22, T, 2, PALETTE.STEEL_DK);
      // Junction boxes every 6 tiles
      if (col % 6 === 3) {
        rect(x + 2, 4, 12, 6, PALETTE.STEEL_DK);
        rect(x + 3, 5, 10, 4, PALETTE.DARK_IRON);
        px(x + 5, 6, PALETTE.GREEN);  // status LED
        px(x + 9, 6, PALETTE.RED);
      }
      // Cable trays
      rect(x, 28, T, 3, PALETTE.DARK_IRON);
      if (col % 2 === 0) {
        px(x + 4, 29, PALETTE.RED);
        px(x + 8, 29, PALETTE.BLUE);
        px(x + 12, 29, PALETTE.YELLOW);
      }
      // Duct seam rivets
      if (col % 2 === 0) {
        px(x + 4, 9, PALETTE.BRUSHED_STEEL);
        px(x + 12, 9, PALETTE.BRUSHED_STEEL);
        px(x + 4, 21, PALETTE.BRUSHED_STEEL);
        px(x + 12, 21, PALETTE.BRUSHED_STEEL);
      }
    }

    // -- Rows 3-6: HVAC air handling units (2 units)
    this._drawAHU(ctx, rect, px, 2 * T, 3 * T, 12, 4);  // Left AHU
    this._drawAHU(ctx, rect, px, 16 * T, 3 * T, 12, 4);  // Right AHU

    // -- Rows 7-9: Control area
    // Electrical panels along back wall
    for (let p = 0; p < 4; p++) {
      const panelX = 2 * T + p * 7 * T, panelY = 7 * T;
      rect(panelX, panelY, 5 * T, 3 * T, PALETTE.STEEL);
      rect(panelX, panelY, 5 * T, 2, PALETTE.STEEL_LT);
      rect(panelX, panelY + 3 * T - 2, 5 * T, 2, PALETTE.STEEL_DK);
      // Door handle
      rect(panelX + 5 * T - 6, panelY + T, 2, 8, PALETTE.STEEL_DK);
      // Breaker switches inside (rows of small colored rectangles)
      for (let br = 0; br < 6; br++) {
        for (let bc = 0; bc < 3; bc++) {
          const bx = panelX + 4 + bc * 20, by = panelY + 6 + br * 6;
          const isOn = _hash(p, br * 3 + bc, 60) > 0.15;
          rect(bx, by, 6, 3, isOn ? PALETTE.GREEN : PALETTE.RED);
          px(bx + (isOn ? 4 : 1), by + 1, PALETTE.WHITE);
        }
      }
      // Warning label
      if (p % 2 === 0) {
        rect(panelX + 20, panelY + 4, 8, 6, PALETTE.YELLOW);
        px(panelX + 24, panelY + 5, PALETTE.BLACK);
        px(panelX + 23, panelY + 7, PALETTE.BLACK);
        px(panelX + 25, panelY + 7, PALETTE.BLACK);
      }
    }

    // Control desk (center)
    const deskX = 11 * T, deskY = 8 * T;
    rect(deskX, deskY, 8 * T, 2 * T, PALETTE.DARK_GRAY);
    rect(deskX, deskY, 8 * T, 2, PALETTE.STEEL);
    // Monitors
    for (let m = 0; m < 3; m++) {
      const mx = deskX + 4 + m * 36, my = deskY + 4;
      rect(mx, my, 24, 16, PALETTE.BLACK);
      rect(mx + 1, my + 1, 22, 14, PALETTE.DARK_BLUE);
      // Green text lines on screens
      for (let tl = 0; tl < 4; tl++) {
        const lineW = 6 + Math.floor(_hash(m, tl, 61) * 12);
        rect(mx + 3, my + 3 + tl * 3, lineW, 1, PALETTE.GREEN);
      }
    }
    // Buttons on desk
    for (let b = 0; b < 5; b++) {
      px(deskX + 8 + b * 8, deskY + 24, _hash(0, b, 62) > 0.5 ? PALETTE.GREEN : PALETTE.RED);
    }

    // -- Rows 10-12: Boiler area with orange/red glow
    // Boiler room glow (subtle gradient behind boiler)
    ctx.globalAlpha = 0.08;
    rect(3 * T, 10 * T, 12 * T, 3 * T, PALETTE.RED);
    ctx.globalAlpha = 0.12;
    rect(4 * T, 10 * T + 4, 10 * T, 2 * T, PALETTE.ORANGE);
    ctx.globalAlpha = 1;

    this._drawBoiler(ctx, rect, px, 4 * T, 10 * T);
    // Smaller hot water heaters
    this._drawWaterHeater(ctx, rect, px, 16 * T, 10 * T);
    this._drawWaterHeater(ctx, rect, px, 20 * T, 10 * T + 8);

    // -- Rows 13-15: Pipe runs
    this._drawPipeNetwork(ctx, rect, px, 0, 13 * T, cols);

    // -- Rows 16-17: Floor drains and safety lines
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 16 * T;
      rect(x, y, T, 2 * T, PALETTE.CONCRETE);
      // Yellow/black safety stripes (hazard pattern)
      if (col > 1 && col < cols - 2) {
        for (let sx = 0; sx < T; sx += 4) {
          rect(x + sx, y + 2, 2, 2, PALETTE.YELLOW);
          rect(x + sx + 2, y + 2, 2, 2, PALETTE.BLACK);
        }
        for (let sx = 0; sx < T; sx += 4) {
          rect(x + sx, y + 2 * T - 4, 2, 2, PALETTE.YELLOW);
          rect(x + sx + 2, y + 2 * T - 4, 2, 2, PALETTE.BLACK);
        }
      }
      // Floor drains
      if (col % 8 === 4) {
        rect(x + 4, y + 10, 8, 8, PALETTE.DARK_GRAY);
        for (let sl = 0; sl < 3; sl++) {
          rect(x + 5, y + 11 + sl * 2, 6, 1, PALETTE.BLACK);
        }
      }
    }

    // Safety signage on walls (yellow/black warning triangles)
    const safetySignCols = [6, 15, 24];
    for (const sc of safetySignCols) {
      const sx = sc * T, sy = 16 * T + 8;
      rect(sx + 2, sy, 12, 10, PALETTE.YELLOW);
      rect(sx + 3, sy + 1, 10, 8, PALETTE.YELLOW);
      // Triangle outline
      px(sx + 7, sy + 2, PALETTE.BLACK);
      px(sx + 6, sy + 4, PALETTE.BLACK);
      px(sx + 8, sy + 4, PALETTE.BLACK);
      px(sx + 5, sy + 6, PALETTE.BLACK);
      px(sx + 9, sy + 6, PALETTE.BLACK);
      rect(sx + 5, sy + 7, 5, 1, PALETTE.BLACK);
      // Exclamation
      px(sx + 7, sy + 4, PALETTE.BLACK);
      px(sx + 7, sy + 5, PALETTE.BLACK);
    }

    // -- Rows 18-19: Sub-floor / foundation
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 18 * T;
      rect(x, y, T, 2 * T, PALETTE.DARK_GRAY);
      for (let py = 0; py < 2 * T; py++) {
        for (let px2 = 0; px2 < T; px2++) {
          if (_hash(x + px2, y + py, 70) > 0.92) px(x + px2, y + py, PALETTE.BLACK);
        }
      }
    }

    // -- Ambient: overhead light cones from ceiling fixtures --
    ctx.globalAlpha = 0.04;
    for (let col = 4; col < cols; col += 8) {
      const lx = col * T;
      rect(lx, 3 * T, 3 * T, 4 * T, PALETTE.WARM_WHITE);
    }
    // Darken foundation rows for depth
    ctx.globalAlpha = 0.04;
    rect(0, 18 * T, W, 2 * T, PALETTE.BLACK);
    ctx.globalAlpha = 1;
  }

  _drawAHU(ctx, rect, px, ox, oy, tileW, tileH) {
    const w = tileW * T, h = tileH * T;
    // Main housing
    rect(ox, oy, w, h, PALETTE.STEEL);
    rect(ox, oy, w, 2, PALETTE.STEEL_LT);
    rect(ox, oy + h - 2, w, 2, PALETTE.STEEL_DK);
    rect(ox, oy, 2, h, PALETTE.STEEL_LT);
    rect(ox + w - 2, oy, 2, h, PALETTE.STEEL_DK);

    // Access panel (recessed rectangle)
    rect(ox + 8, oy + 8, 24, h - 16, PALETTE.STEEL_DK);
    rect(ox + 9, oy + 9, 22, h - 18, PALETTE.STEEL);
    // Panel screws
    px(ox + 10, oy + 10, PALETTE.BRUSHED_STEEL);
    px(ox + 30, oy + 10, PALETTE.BRUSHED_STEEL);
    px(ox + 10, oy + h - 10, PALETTE.BRUSHED_STEEL);
    px(ox + 30, oy + h - 10, PALETTE.BRUSHED_STEEL);

    // Intake grille (horizontal lines)
    for (let i = 0; i < 8; i++) {
      rect(ox + 40, oy + 8 + i * 6, 30, 2, PALETTE.DARK_IRON);
      rect(ox + 40, oy + 10 + i * 6, 30, 4, PALETTE.BLACK);
    }

    // Exhaust fan (circle with X blades)
    const fanCX = ox + w - 30, fanCY = oy + Math.floor(h / 2);
    this._drawCircle(ctx, px, fanCX, fanCY, 12, PALETTE.DARK_IRON, PALETTE.BLACK);
    // Fan blades (X pattern)
    for (let i = -8; i <= 8; i++) {
      px(fanCX + i, fanCY + i, PALETTE.STEEL_LT);
      px(fanCX + i, fanCY - i, PALETTE.STEEL_LT);
    }
    // Center hub
    this._drawCircle(ctx, px, fanCX, fanCY, 3, PALETTE.STEEL, PALETTE.STEEL_DK);

    // Temperature gauge (with needle and ticks)
    this._drawCircle(ctx, px, ox + w - 10, oy + 8, 4, PALETTE.WHITE, PALETTE.STEEL_DK);
    px(ox + w - 10, oy + 5, PALETTE.RED); // needle tip
    px(ox + w - 9, oy + 6, PALETTE.RED);  // needle body
    // Tick marks around gauge
    px(ox + w - 14, oy + 8, PALETTE.BLACK);
    px(ox + w - 6, oy + 8, PALETTE.BLACK);
    px(ox + w - 10, oy + 12, PALETTE.BLACK);

    // Pressure gauge (second gauge)
    this._drawCircle(ctx, px, ox + w - 24, oy + 8, 4, PALETTE.WHITE, PALETTE.STEEL_DK);
    px(ox + w - 24, oy + 6, PALETTE.GREEN); // needle in green zone
    px(ox + w - 23, oy + 7, PALETTE.GREEN);
    // Green/red zones on gauge face
    px(ox + w - 20, oy + 8, PALETTE.GREEN);
    px(ox + w - 28, oy + 8, PALETTE.RED);

    // Nameplate
    rect(ox + 4, oy + h - 8, 20, 5, PALETTE.BRASS);
    for (let i = 0; i < 6; i++) px(ox + 6 + i * 2, oy + h - 6, PALETTE.BLACK);
  }

  _drawBoiler(ctx, rect, px, ox, oy) {
    // Large cylindrical boiler
    const w = 10 * T, h = 3 * T;
    rect(ox, oy, w, h, PALETTE.RUST);
    rect(ox, oy, w, 3, PALETTE.RUST_LT);
    rect(ox, oy + h - 3, w, 3, PALETTE.BROWN);
    // Rounded ends
    for (let i = 0; i < 6; i++) {
      px(ox + i, oy + i, PALETTE.RUST_LT);
      px(ox + i, oy + h - 1 - i, PALETTE.BROWN);
      px(ox + w - 1 - i, oy + i, PALETTE.RUST_LT);
      px(ox + w - 1 - i, oy + h - 1 - i, PALETTE.BROWN);
    }
    // Rivets along body
    for (let r = 0; r < 6; r++) {
      px(ox + 10 + r * 20, oy + 6, PALETTE.DARK_IRON);
      px(ox + 10 + r * 20, oy + h - 8, PALETTE.DARK_IRON);
    }
    // Horizontal seam
    rect(ox, oy + Math.floor(h / 2), w, 1, PALETTE.BROWN);
    // Pressure gauge
    this._drawCircle(ctx, px, ox + 20, oy + 10, 6, PALETTE.WHITE, PALETTE.STEEL_DK);
    px(ox + 20, oy + 7, PALETTE.RED);
    px(ox + 21, oy + 8, PALETTE.RED);
    // Steam pipes from top
    rect(ox + 30, oy - 8, 3, 10, PALETTE.STEEL);
    rect(ox + 50, oy - 8, 3, 10, PALETTE.STEEL);
    rect(ox + 70, oy - 6, 3, 8, PALETTE.STEEL);
    // Pipe flanges
    rect(ox + 28, oy - 2, 7, 2, PALETTE.STEEL_DK);
    rect(ox + 48, oy - 2, 7, 2, PALETTE.STEEL_DK);

    // "DANGER HOT" label
    rect(ox + 55, oy + 15, 24, 8, PALETTE.YELLOW);
    for (let i = 0; i < 8; i++) px(ox + 57 + i * 2, oy + 18, PALETTE.BLACK);
  }

  _drawWaterHeater(ctx, rect, px, ox, oy) {
    rect(ox, oy, 3 * T, 2 * T + 8, PALETTE.STEEL);
    rect(ox, oy, 3 * T, 2, PALETTE.STEEL_LT);
    rect(ox + 4, oy + 4, 3 * T - 8, 2 * T, PALETTE.STEEL_DK);
    // Temperature dial
    this._drawCircle(ctx, px, ox + T, oy + T + 4, 4, PALETTE.WHITE, PALETTE.STEEL_DK);
    px(ox + T, oy + T + 1, PALETTE.RED);
    // Pipe connections
    rect(ox + 8, oy - 4, 3, 6, PALETTE.COPPER);
    rect(ox + 28, oy - 4, 3, 6, PALETTE.COPPER);
  }

  _drawPipeNetwork(ctx, rect, px, ox, oy, cols) {
    const W = cols * T;
    rect(ox, oy, W, 3 * T, PALETTE.CONCRETE_DK);

    // Color-coded horizontal pipes (improved domain colors)
    const pipes = [
      { y: oy + 4, color: PALETTE.WATER_BLUE, label: 'cold' },     // cold=blue
      { y: oy + 12, color: PALETTE.RUST_ORANGE, label: 'hot' },    // hot=reddish
      { y: oy + 20, color: PALETTE.MOSS_GREEN, label: 'drain' },   // drainage=greenish
      { y: oy + 28, color: PALETTE.ORANGE, label: 'hvac' },        // hvac=orange
      { y: oy + 36, color: PALETTE.COPPER, label: 'gas' },
    ];
    for (const pipe of pipes) {
      rect(ox, pipe.y, W, 3, pipe.color);
      rect(ox, pipe.y, W, 1, PALETTE.WHITE);  // highlight
      // Valves every 10 tiles
      for (let col = 4; col < cols; col += 10) {
        const vx = ox + col * T;
        rect(vx, pipe.y - 2, 6, 7, PALETTE.STEEL_DK);
        // Valve wheel
        this._drawCircle(ctx, px, vx + 3, pipe.y - 5, 3, PALETTE.RED, PALETTE.DARK_GRAY);
      }
    }

    // Tool rack on wall (right side)
    const rackX = ox + 24 * T, rackY = oy + 4;
    rect(rackX, rackY, 4 * T, 20, PALETTE.BROWN);
    // Wrench silhouette
    rect(rackX + 4, rackY + 2, 2, 12, PALETTE.STEEL);
    rect(rackX + 2, rackY + 2, 6, 3, PALETTE.STEEL);
    // Hammer
    rect(rackX + 14, rackY + 2, 2, 14, PALETTE.BROWN);
    rect(rackX + 12, rackY + 2, 6, 4, PALETTE.DARK_GRAY);
    // Screwdriver
    rect(rackX + 24, rackY + 2, 1, 14, PALETTE.YELLOW);
    rect(rackX + 23, rackY + 14, 3, 3, PALETTE.STEEL);

    // Maintenance cart
    const cartX = ox + 6 * T, cartY = oy + 30;
    rect(cartX, cartY, 24, 12, PALETTE.STEEL);
    rect(cartX, cartY, 24, 2, PALETTE.STEEL_LT);
    // Wheels
    this._drawCircle(ctx, px, cartX + 4, cartY + 14, 3, PALETTE.DARK_GRAY, PALETTE.BLACK);
    this._drawCircle(ctx, px, cartX + 20, cartY + 14, 3, PALETTE.DARK_GRAY, PALETTE.BLACK);
    // Tools on cart
    px(cartX + 6, cartY + 4, PALETTE.RED);
    px(cartX + 10, cartY + 4, PALETTE.YELLOW);
    px(cartX + 14, cartY + 4, PALETTE.BLUE);
  }

  /* ================================================================ */
  /*  UNDERGROUND                                                      */
  /* ================================================================ */

  _buildUnderground(ctx, rect, px, cols, rows) {
    const W = cols * T, H = rows * T;

    // Base fill: very dark
    rect(0, 0, W, H, PALETTE.DARK_GRAY);

    // -- Rows 0-3: Arched tunnel ceiling with brick pattern (cracked/mossy variation)
    for (let col = 0; col < cols; col++) {
      const x = col * T;
      for (let row = 0; row < 4; row++) {
        const y = row * T;
        // Brick pattern
        for (let by = 0; by < T; by++) {
          for (let bx = 0; bx < T; bx++) {
            const brickW = 6, brickH = 3;
            const offsetRow = Math.floor((y + by) / brickH);
            const offset = (offsetRow % 2) * 3;
            const inBrickX = ((x + bx + offset) % brickW);
            const inBrickY = ((y + by) % brickH);
            if (inBrickX === 0 || inBrickY === 0) {
              px(x + bx, y + by, PALETTE.DARK_GRAY);
            } else {
              // Varied brick colors including cracked/aged bricks
              const h1 = _hash(x + bx, y + by, 80);
              let shade;
              if (h1 > 0.85) {
                shade = PALETTE.CONCRETE_DK; // cracked/damaged brick
              } else if (h1 > 0.5) {
                shade = PALETTE.BROWN;
              } else {
                shade = PALETTE.DARK_BROWN; // darker brown variant
              }
              px(x + bx, y + by, shade);
              // Mossy patches (green tinted bricks near water)
              if (_hash(x + bx, y + by, 81) > 0.92 && row >= 2) {
                px(x + bx, y + by, PALETTE.MOSS_GREEN);
              }
            }
          }
        }
      }
    }

    // Dripping water stains (dark streaks down from ceiling)
    for (let col = 0; col < cols; col++) {
      if (_hash(col, 0, 81) > 0.6) {
        const sx = col * T + Math.floor(_hash(col, 0, 82) * 12);
        const len = 8 + Math.floor(_hash(col, 0, 83) * 20);
        for (let dy = 0; dy < len; dy++) {
          ctx.globalAlpha = 0.3 + _hash(col, dy, 84) * 0.3;
          px(sx, 3 * T + dy, PALETTE.WATER_BLUE);
          ctx.globalAlpha = 1;
        }
      }
    }

    // -- Rows 4-5: Large overhead pipes
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 4 * T;
      rect(x, y, T, 2 * T, PALETTE.DARK_GRAY);
      // Storm drain main (large pipe, 2 tiles tall)
      rect(x, y + 4, T, 12, PALETTE.CONCRETE_DK);
      rect(x, y + 4, T, 2, PALETTE.CONCRETE);
      rect(x, y + 14, T, 2, PALETTE.DARK_GRAY);
      // Smaller branch pipe
      rect(x, y + 22, T, 4, PALETTE.STEEL_DK);
      rect(x, y + 22, T, 1, PALETTE.STEEL);
      // Pipe clamps
      if (col % 4 === 0) {
        rect(x + 2, y + 2, T - 4, 2, PALETTE.DARK_IRON);
        rect(x + 2, y + 20, T - 4, 2, PALETTE.DARK_IRON);
      }
    }

    // -- Rows 6-9: Main tunnel space
    for (let row = 6; row < 10; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * T, y = row * T;
        rect(x, y, T, T, PALETTE.DARK_GRAY);
      }
    }

    // Drainage channel (center, 2 tiles wide) with improved shimmer
    for (let row = 6; row < 10; row++) {
      const y = row * T;
      for (let col = 12; col < 18; col++) {
        const x = col * T;
        rect(x, y, T, T, PALETTE.DARK_BLUE);
        // Water surface shimmer (vary blue shades)
        const waterColors = [PALETTE.WATER_BLUE, PALETTE.NAVY, PALETTE.WATER, PALETTE.DARK_BLUE, PALETTE.WATER_BLUE];
        for (let wx = 0; wx < T; wx++) {
          const h1 = _hash(col, row, wx + 85);
          if (h1 > 0.4) {
            const wc = waterColors[Math.floor(h1 * waterColors.length)];
            px(x + wx, y + 2, wc);
          }
          // Deeper water darker at bottom
          if (_hash(col, row, wx + 86) > 0.5) {
            px(x + wx, y + T - 3, PALETTE.NAVY);
          }
          // Light reflections on surface
          if (_hash(col, row, wx + 87) > 0.85) {
            px(x + wx, y + 1, PALETTE.WATER_LT);
          }
        }
      }
      // Channel walls
      rect(11 * T + 14, y, 2, T, PALETTE.CONCRETE);
      rect(18 * T, y, 2, T, PALETTE.CONCRETE);
    }

    // Safety walkway (right side) with railing
    for (let row = 6; row < 10; row++) {
      const y = row * T;
      for (let col = 20; col < 28; col++) {
        rect(col * T, y, T, T, PALETTE.CONCRETE_DK);
        // Safety line
        rect(col * T, y, T, 1, PALETTE.YELLOW);
      }
    }
    // Railing posts
    for (let col = 20; col < 28; col += 3) {
      for (let row = 6; row < 10; row++) {
        rect(col * T, row * T, 2, T, PALETTE.YELLOW);
      }
    }
    // Horizontal rail
    rect(20 * T, 7 * T, 8 * T, 2, PALETTE.YELLOW);

    // Flow direction arrows painted on wall
    for (let a = 0; a < 3; a++) {
      const ax = (6 + a * 8) * T, ay = 7 * T + 4;
      px(ax + 4, ay, PALETTE.WHITE);
      px(ax + 5, ay - 1, PALETTE.WHITE);
      px(ax + 5, ay + 1, PALETTE.WHITE);
      px(ax + 6, ay - 2, PALETTE.WHITE);
      px(ax + 6, ay + 2, PALETTE.WHITE);
      rect(ax, ay - 1, 4, 3, PALETTE.WHITE);
    }

    // Pump station (left side, rows 7-9)
    const pumpX = 2 * T, pumpY = 7 * T;
    rect(pumpX, pumpY, 6 * T, 2 * T, PALETTE.STEEL_DK);
    rect(pumpX, pumpY, 6 * T, 2, PALETTE.STEEL);
    // Motor housing (detailed)
    rect(pumpX + 4, pumpY + 6, 20, 16, PALETTE.DARK_IRON);
    rect(pumpX + 4, pumpY + 6, 20, 2, PALETTE.STEEL);
    // Motor ventilation fins
    for (let fin = 0; fin < 4; fin++) {
      rect(pumpX + 6 + fin * 4, pumpY + 10, 2, 10, PALETTE.STEEL_DK);
    }
    // Motor nameplate
    rect(pumpX + 8, pumpY + 18, 10, 3, PALETTE.BRASS);
    // Pump housing (curved volute)
    rect(pumpX + 28, pumpY + 8, 16, 12, PALETTE.STEEL);
    for (let i = 0; i < 6; i++) {
      px(pumpX + 28 + i, pumpY + 8 - Math.floor(i / 2), PALETTE.STEEL_LT);
    }
    // Pump impeller visible through housing
    px(pumpX + 34, pumpY + 13, PALETTE.DARK_IRON);
    px(pumpX + 36, pumpY + 13, PALETTE.DARK_IRON);
    // Discharge pipe with flange
    rect(pumpX + 46, pumpY + 10, 20, 4, PALETTE.STEEL);
    rect(pumpX + 46, pumpY + 10, 20, 1, PALETTE.STEEL_LT);
    rect(pumpX + 46, pumpY + 8, 3, 8, PALETTE.STEEL_DK); // flange
    // Emergency shutoff valve wheel (red circle)
    this._drawCircle(ctx, px, pumpX + 12, pumpY + 28, 5, PALETTE.RED, PALETTE.CRIMSON);
    px(pumpX + 12, pumpY + 28, PALETTE.DARK_GRAY); // center bolt
    // Valve wheel spokes
    px(pumpX + 12, pumpY + 25, PALETTE.CRIMSON);
    px(pumpX + 12, pumpY + 31, PALETTE.CRIMSON);
    px(pumpX + 9, pumpY + 28, PALETTE.CRIMSON);
    px(pumpX + 15, pumpY + 28, PALETTE.CRIMSON);
    // Second valve wheel (smaller, on discharge pipe)
    this._drawCircle(ctx, px, pumpX + 56, pumpY + 8, 3, PALETTE.RED, PALETTE.CRIMSON);
    px(pumpX + 56, pumpY + 8, PALETTE.BLACK);

    // -- Rows 10-12: Water treatment
    this._drawTreatmentArea(ctx, rect, px, 0, 10 * T, cols);

    // -- Rows 13-15: Deep infrastructure
    for (let row = 13; row < 16; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * T, y = row * T;
        rect(x, y, T, T, PALETTE.DARK_GRAY);
      }
    }
    // Sewer main (large pipe at bottom)
    for (let col = 2; col < cols - 2; col++) {
      const x = col * T;
      rect(x, 14 * T, T, 12, PALETTE.CONCRETE_DK);
      rect(x, 14 * T, T, 2, PALETTE.CONCRETE);
      rect(x, 14 * T + 10, T, 2, PALETTE.DARK_GRAY);
    }
    // Manhole access (round cover on ceiling)
    this._drawCircle(ctx, px, 15 * T, 13 * T + 4, 8, PALETTE.DARK_IRON, PALETTE.BLACK);
    // Cross pattern on manhole
    rect(15 * T - 6, 13 * T + 4, 12, 1, PALETTE.STEEL_DK);
    rect(15 * T, 13 * T - 2, 1, 12, PALETTE.STEEL_DK);

    // Emergency overflow valves
    for (let v = 0; v < 2; v++) {
      const vx = (8 + v * 14) * T, vy = 13 * T + 8;
      rect(vx, vy, 8, 8, PALETTE.STEEL_DK);
      this._drawCircle(ctx, px, vx + 4, vy - 2, 5, PALETTE.RED, PALETTE.CRIMSON);
      px(vx + 4, vy - 2, PALETTE.BLACK);
    }

    // Warning signs
    const signPositions = [4, 22];
    for (const sc of signPositions) {
      rect(sc * T, 13 * T, 2 * T, T, PALETTE.YELLOW);
      rect(sc * T + 1, 13 * T + 1, 2 * T - 2, T - 2, PALETTE.YELLOW);
      // Exclamation mark
      rect(sc * T + T - 2, 13 * T + 3, 3, 6, PALETTE.BLACK);
      px(sc * T + T - 1, 13 * T + 11, PALETTE.BLACK);
    }

    // Tiny rat silhouette in a corner (fun detail, 4 dark pixels)
    const ratX = 3 * T + 2, ratY = 15 * T + 12;
    px(ratX, ratY, PALETTE.DARK_GRAY);       // body
    px(ratX + 1, ratY, PALETTE.DARK_GRAY);   // body
    px(ratX - 1, ratY, PALETTE.DARK_GRAY);   // head
    px(ratX + 2, ratY - 1, PALETTE.DARK_GRAY); // tail (curving up)

    // Depth layering overlay — foreground objects darker, background lighter
    // Top rows are "further away" so slightly brighter, bottom rows are closer and darker
    ctx.globalAlpha = 0.06;
    rect(0, 0, cols * T, 4 * T, PALETTE.LIGHT_GRAY);  // background lighter
    ctx.globalAlpha = 0.04;
    rect(0, 16 * T, cols * T, 4 * T, PALETTE.BLACK);    // foreground darker
    ctx.globalAlpha = 1;

    // -- Rows 16-17: Water table (wet floor)
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 16 * T;
      rect(x, y, T, 2 * T, PALETTE.DARK_GRAY);
      // Reflective dark surface
      for (let py = 0; py < 2 * T; py++) {
        for (let px2 = 0; px2 < T; px2++) {
          if (_hash(x + px2, y + py, 90) > 0.88) {
            px(x + px2, y + py, PALETTE.WATER_BLUE);
          }
        }
      }
      // Puddles
      if (_hash(col, 16, 91) > 0.6) {
        const pw = 4 + Math.floor(_hash(col, 16, 92) * 8);
        const px2 = col * T + 2;
        ctx.globalAlpha = 0.5;
        rect(px2, y + 6, pw, 3, PALETTE.WATER_BLUE);
        ctx.globalAlpha = 1;
      }
      // Moss/algae patches
      if (_hash(col, 17, 93) > 0.7) {
        for (let m = 0; m < 4; m++) {
          px(x + 2 + m * 3, y + T + 4 + Math.floor(_hash(col, m, 94) * 6), PALETTE.MOSS_GREEN);
        }
      }
    }

    // -- Rows 18-19: Bedrock foundation
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 18 * T;
      rect(x, y, T, 2 * T, PALETTE.BLACK);
      for (let py = 0; py < 2 * T; py++) {
        for (let px2 = 0; px2 < T; px2++) {
          if (_hash(x + px2, y + py, 95) > 0.85) {
            px(x + px2, y + py, PALETTE.DARK_GRAY);
          }
        }
      }
    }

    // -- Environmental detail objects --

    // Storage crates (against walls at varied positions)
    const cratePositions = [
      { x: 1 * T + 2, y: 8 * T + 10 },
      { x: 9 * T + 4, y: 9 * T + 8 },
      { x: 24 * T + 6, y: 8 * T + 12 },
      { x: 27 * T + 2, y: 9 * T + 6 },
    ];
    for (const cp of cratePositions) {
      rect(cp.x, cp.y, 5, 4, '#8B6914');       // wood body
      rect(cp.x, cp.y, 5, 1, '#A0782C');       // lighter top edge
      rect(cp.x, cp.y + 3, 5, 1, '#6B4F0A');   // shadow bottom
      px(cp.x + 2, cp.y + 2, '#6B4F0A');       // cross detail
    }

    // Warning/safety signs (mounted on walls near pipe junctions)
    const signPos = [
      { x: 7 * T + 6, y: 5 * T + 4 },
      { x: 19 * T + 2, y: 5 * T + 6 },
    ];
    for (const sp of signPos) {
      rect(sp.x, sp.y, 4, 3, '#FFD700');       // yellow sign body
      rect(sp.x + 1, sp.y + 1, 2, 1, '#333');  // dark stripe/symbol
    }

    // Tool cart (on the floor near equipment)
    const cartX = 10 * T + 4, cartY = 9 * T + 4;
    rect(cartX, cartY, 6, 4, '#888');           // cart body
    rect(cartX, cartY, 6, 1, '#AAA');           // top shelf highlight
    px(cartX + 1, cartY + 4, '#555');           // left wheel
    px(cartX + 4, cartY + 4, '#555');           // right wheel

    // Water stain marks (darker patches on wall tiles suggesting moisture)
    const stainPositions = [
      { x: 5 * T + 8, y: 3 * T + 10 },
      { x: 16 * T + 4, y: 3 * T + 6 },
      { x: 25 * T + 2, y: 3 * T + 12 },
    ];
    for (const st of stainPositions) {
      px(st.x, st.y, '#2a2a3a');
      px(st.x + 1, st.y, '#2a2a3a');
      px(st.x, st.y + 1, '#2a2a3a');
    }

    // Work lights (yellow cones at intervals)
    for (let col = 3; col < cols; col += 7) {
      const lx = col * T + 8, ly = 6 * T;
      px(lx, ly, PALETTE.YELLOW);
      px(lx, ly + 1, PALETTE.WARM_WHITE);
      ctx.globalAlpha = 0.1;
      for (let cone = 0; cone < 20; cone++) {
        const spread = cone * 0.8;
        rect(lx - spread, ly + 2 + cone, 1 + spread * 2, 1, PALETTE.YELLOW);
      }
      ctx.globalAlpha = 1;
    }
  }

  _drawTreatmentArea(ctx, rect, px, ox, oy, cols) {
    // Treatment tanks
    for (let t = 0; t < 2; t++) {
      const tx = ox + (4 + t * 14) * T, ty = oy;
      const tw = 8 * T, th = 3 * T;
      rect(tx, ty, tw, th, PALETTE.CONCRETE);
      rect(tx + 1, ty + 1, tw - 2, th - 2, PALETTE.CONCRETE_DK);
      // Water inside (gradient)
      rect(tx + 4, ty + 8, tw - 8, th - 12, PALETTE.WATER_BLUE);
      rect(tx + 4, ty + 8, tw - 8, 4, PALETTE.WATER_LT);
      // Tank wall top edge
      rect(tx, ty, tw, 2, PALETTE.CONCRETE_LT);
    }

    // Chemical feed tanks (small)
    for (let c = 0; c < 3; c++) {
      const cx = ox + (2 + c * 4) * T, cy = oy + 2 * T + 4;
      rect(cx, cy, 2 * T, T, PALETTE.WHITE);
      rect(cx, cy, 2 * T, 2, PALETTE.LIGHT_GRAY);
      // Chemical color
      const chem = [PALETTE.GREEN, PALETTE.BLUE, PALETTE.YELLOW][c];
      rect(cx + 4, cy + 4, 2 * T - 8, T - 8, chem);
      // Feed tube
      rect(cx + T, cy - 6, 2, 6, PALETTE.STEEL);
    }

    // Testing station (right side)
    const tsX = ox + 24 * T, tsY = oy + 4;
    rect(tsX, tsY, 4 * T, 2 * T, PALETTE.STEEL);
    rect(tsX, tsY, 4 * T, 2, PALETTE.STEEL_LT);
    // Sample bottles
    for (let b = 0; b < 4; b++) {
      const bc = [PALETTE.WATER_LT, PALETTE.GREEN, PALETTE.YELLOW, PALETTE.BLUE][b];
      rect(tsX + 4 + b * 10, tsY + 6, 4, 10, PALETTE.GLASS);
      rect(tsX + 5 + b * 10, tsY + 8, 2, 6, bc);
    }
  }

  /* ================================================================ */
  /*  LUXURY                                                           */
  /* ================================================================ */

  _buildLuxury(ctx, rect, px, cols, rows) {
    const W = cols * T, H = rows * T;

    // -- Rows 0-1: Recessed ceiling
    for (let col = 0; col < cols; col++) {
      const x = col * T;
      rect(x, 0, T, 2 * T, PALETTE.DARK_GRAY);
      // Soft lighting glow
      if (col % 4 === 2) {
        ctx.globalAlpha = 0.3;
        rect(x + 2, T - 4, 12, 6, PALETTE.WARM_WHITE);
        ctx.globalAlpha = 0.15;
        rect(x, T + 2, T, 8, PALETTE.WARM_WHITE);
        ctx.globalAlpha = 1;
      }
    }
    // Crown molding (gold line at ceiling edge)
    rect(0, 2 * T - 2, W, 2, PALETTE.GOLD);
    rect(0, 2 * T - 3, W, 1, PALETTE.BRASS);

    // -- Rows 2-3: Hidden HVAC
    for (let col = 0; col < cols; col++) {
      const x = col * T;
      rect(x, 2 * T, T, 2 * T, PALETTE.DARK_GRAY);
      // Small ductwork
      rect(x, 2 * T + 4, T, 6, PALETTE.STEEL_DK);
      rect(x, 2 * T + 4, T, 1, PALETTE.STEEL);
      // Access panels
      if (col % 8 === 4) {
        rect(x + 2, 2 * T + 2, 12, 10, PALETTE.STEEL);
        rect(x + 3, 2 * T + 3, 10, 8, PALETTE.STEEL_DK);
        // Screws
        px(x + 4, 2 * T + 4, PALETTE.BRUSHED_STEEL);
        px(x + 11, 2 * T + 4, PALETTE.BRUSHED_STEEL);
        px(x + 4, 2 * T + 9, PALETTE.BRUSHED_STEEL);
        px(x + 11, 2 * T + 9, PALETTE.BRUSHED_STEEL);
      }
      // Vent slot indicators
      if (col % 10 === 5) {
        rect(x + 4, 3 * T + 8, 8, 4, PALETTE.STEEL);
        for (let sl = 0; sl < 3; sl++) {
          rect(x + 5 + sl * 2, 3 * T + 9, 1, 2, PALETTE.BLACK);
        }
        px(x + 8, 3 * T + 12, PALETTE.GREEN);
      }
    }

    // -- Rows 4-8: Suite interiors
    // Left suite (cols 1-14)
    this._drawSuiteInterior(ctx, rect, px, 1 * T, 4 * T, 14, true);
    // Right suite (cols 15-28)
    this._drawSuiteInterior(ctx, rect, px, 15 * T, 4 * T, 14, false);
    // Divider wall between suites
    rect(14 * T + 12, 4 * T, 4, 5 * T, PALETTE.DARK_GRAY);

    // -- Rows 9-10: Glass windows overlooking field
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 9 * T;
      // Window frame
      rect(x, y, T, 2 * T, PALETTE.GLASS);
      rect(x, y, T, 1, PALETTE.STEEL);
      rect(x, y + 2 * T - 1, T, 1, PALETTE.STEEL);
      if (col % 5 === 0) rect(x, y, 1, 2 * T, PALETTE.STEEL);
      // View through window: green field
      rect(x, y + 4, T, T + 8, PALETTE.GRASS);
      rect(x, y + 2, T, 4, PALETTE.GRASS_LT);
      // Tiny diamond shape (infield)
      if (col >= 12 && col <= 17) {
        px(x + 8, y + 10, PALETTE.DIRT);
        px(x + 7, y + 11, PALETTE.DIRT);
        px(x + 9, y + 11, PALETTE.DIRT);
        px(x + 8, y + 12, PALETTE.DIRT);
      }
      // Crowd in distance (colored dots)
      if (col > 3 && col < 26) {
        for (let cd = 0; cd < 4; cd++) {
          const crowdC = [PALETTE.RED, PALETTE.BLUE, PALETTE.WHITE, PALETTE.ORANGE][cd];
          px(x + 2 + cd * 3, y + T + 14, crowdC);
        }
      }
      // Subtle field color reflection on glass (interior reflection)
      ctx.globalAlpha = 0.06;
      rect(x + 1, y + 2, 4, 6, PALETTE.GRASS_LT);
      ctx.globalAlpha = 1;
    }

    // -- Rows 11-13: Lower suite area with detailed carpet texture
    for (let row = 11; row < 14; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * T, y = row * T;
        // Rich carpet base
        rect(x, y, T, T, PALETTE.CRIMSON);
        // Repeating carpet pattern (subtle floral/diamond motif)
        if ((col + row) % 3 === 0) {
          ctx.globalAlpha = 0.15;
          rect(x + 4, y + 4, 8, 8, PALETTE.GOLD);
          ctx.globalAlpha = 1;
        }
        // Carpet fiber texture (tiny alternating dots)
        if ((col + row) % 2 === 0) {
          ctx.globalAlpha = 0.08;
          for (let dx = 1; dx < T; dx += 4) {
            for (let dy = 1; dy < T; dy += 4) {
              px(x + dx, y + dy, PALETTE.DARK_BROWN);
            }
          }
          ctx.globalAlpha = 1;
        }
      }
    }
    // Side tables with drinks
    for (let t = 0; t < 4; t++) {
      const tx = (3 + t * 7) * T, ty = 11 * T + 4;
      rect(tx, ty, 12, 8, PALETTE.DARK_BROWN);
      rect(tx, ty, 12, 1, PALETTE.BROWN);
      // Drinks
      rect(tx + 2, ty - 4, 3, 4, PALETTE.GLASS);
      rect(tx + 3, ty - 3, 1, 2, PALETTE.WATER_LT);
      rect(tx + 7, ty - 3, 3, 3, PALETTE.WHITE);
      px(tx + 8, ty - 2, PALETTE.BROWN); // coffee
    }

    // Private restroom door
    rect(26 * T, 12 * T, T + 4, 2 * T, PALETTE.BROWN);
    rect(26 * T, 12 * T, T + 4, 2, PALETTE.DARK_BROWN);
    rect(26 * T + 14, 12 * T + 10, 2, 4, PALETTE.GOLD); // handle
    // "WC" text
    px(26 * T + 4, 12 * T + 6, PALETTE.GOLD);
    px(26 * T + 6, 12 * T + 6, PALETTE.GOLD);
    px(26 * T + 8, 12 * T + 6, PALETTE.GOLD);

    // Serving counter
    rect(2 * T, 13 * T, 10 * T, T - 4, PALETTE.STEEL);
    rect(2 * T, 13 * T, 10 * T, 2, PALETTE.STEEL_LT);
    // Plates and glasses
    for (let p = 0; p < 4; p++) {
      this._drawCircle(ctx, px, 2 * T + 10 + p * 20, 13 * T + 4, 3, PALETTE.WHITE, PALETTE.LIGHT_GRAY);
    }

    // -- Rows 14-15: Corridor
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 14 * T;
      rect(x, y, T, 2 * T, PALETTE.CRIMSON);
      // Lighter center carpet strip
      if (col > 2 && col < cols - 3) {
        ctx.globalAlpha = 0.2;
        rect(x, y + 6, T, 2 * T - 12, PALETTE.GOLD);
        ctx.globalAlpha = 1;
      }
    }
    // Wall sconces
    for (let sc = 3; sc < cols - 3; sc += 5) {
      const sx = sc * T + 6, sy = 14 * T + 2;
      rect(sx, sy, 4, 6, PALETTE.BRASS);
      px(sx + 1, sy + 1, PALETTE.WARM_WHITE);
      px(sx + 2, sy + 1, PALETTE.WARM_WHITE);
      ctx.globalAlpha = 0.12;
      rect(sx - 4, sy + 4, 12, 8, PALETTE.WARM_WHITE);
      ctx.globalAlpha = 1;
    }
    // Suite number plaques
    for (let p = 0; p < 3; p++) {
      const px2 = (5 + p * 8) * T, py2 = 14 * T + 4;
      rect(px2, py2, 16, 8, PALETTE.BRASS);
      rect(px2 + 1, py2 + 1, 14, 6, PALETTE.GOLD);
      // Number dots
      for (let d = 0; d < 3; d++) {
        px(px2 + 4 + d * 3, py2 + 3, PALETTE.BLACK);
      }
    }

    // -- Rows 16-17: Support structure
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 16 * T;
      rect(x, y, T, 2 * T, PALETTE.CONCRETE_DK);
      if (col % 6 === 0) {
        rect(x + 2, y, T - 4, 2 * T, PALETTE.STEEL_DK);
        rect(x + 2, y, T - 4, 2, PALETTE.STEEL);
      }
      // Hidden pipes
      if (col % 4 === 2) {
        rect(x, y + 8, T, 3, PALETTE.COPPER);
        rect(x, y + 18, T, 3, PALETTE.BLUE);
      }
    }

    // -- Rows 18-19: Structural base
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 18 * T;
      rect(x, y, T, 2 * T, PALETTE.DARK_GRAY);
      // Steel I-beam pattern
      if (col % 5 === 0) {
        rect(x + 5, y, 6, 2 * T, PALETTE.STEEL_DK);
        rect(x + 5, y, 6, 2, PALETTE.STEEL);
        rect(x + 5, y + 2 * T - 2, 6, 2, PALETTE.STEEL);
      }
    }

    // -- Ambient depth: slight warm tint in suite area, darker at edges --
    ctx.globalAlpha = 0.04;
    rect(0, 4 * T, W, 10 * T, PALETTE.WARM_WHITE);
    ctx.globalAlpha = 0.05;
    rect(0, 0, W, 2 * T, PALETTE.BLACK);
    ctx.globalAlpha = 1;
  }

  _drawSuiteInterior(ctx, rect, px, ox, oy, widthTiles, isLeft) {
    const w = widthTiles * T, h = 5 * T;

    // Suite walls
    rect(ox, oy, w, h, PALETTE.DARK_GRAY);

    // Rich wallpaper (subtle pattern)
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < widthTiles; col++) {
        const x = ox + col * T, y = oy + row * T;
        rect(x, y, T, T, PALETTE.NAVY);
        if ((col + row) % 4 === 0) {
          ctx.globalAlpha = 0.08;
          rect(x + 2, y + 2, 12, 12, PALETTE.GOLD);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Carpet floor (bottom 2 rows of suite)
    rect(ox, oy + 3 * T, w, 2 * T, PALETTE.CRIMSON);

    // Leather seats (3 seats) with cushion tufting
    for (let s = 0; s < 3; s++) {
      const sx = ox + 8 + s * 28, sy = oy + 3 * T + 2;
      // Seat back
      rect(sx, sy - 8, 16, 10, PALETTE.DARK_BROWN);
      rect(sx + 1, sy - 7, 14, 8, PALETTE.BROWN);
      // Tufting dots on seat back (subtle diamond pattern)
      for (let tx = 0; tx < 3; tx++) {
        for (let ty = 0; ty < 2; ty++) {
          px(sx + 3 + tx * 4, sy - 5 + ty * 3, PALETTE.DARK_BROWN);
        }
      }
      // Seat cushion
      rect(sx - 2, sy + 2, 20, 8, PALETTE.DARK_BROWN);
      rect(sx - 1, sy + 3, 18, 6, PALETTE.BROWN);
      // Tufting dots on cushion
      for (let tx = 0; tx < 4; tx++) {
        px(sx + 1 + tx * 4, sy + 5, PALETTE.DARK_BROWN);
      }
      // Armrest
      rect(sx - 4, sy, 4, 10, PALETTE.DARK_BROWN);
      rect(sx + 16, sy, 4, 10, PALETTE.DARK_BROWN);
    }

    // Coffee table
    const tableX = ox + 4 * T, tableY = oy + 4 * T;
    rect(tableX, tableY, 3 * T, 6, PALETTE.DARK_BROWN);
    rect(tableX, tableY, 3 * T, 1, PALETTE.BROWN);
    // Items on table
    rect(tableX + 4, tableY - 3, 6, 3, PALETTE.WHITE); // napkin
    this._drawCircle(ctx, px, tableX + 20, tableY - 2, 3, PALETTE.GLASS, PALETTE.WATER_LT); // glass

    // Mini-bar (back wall)
    const barX = ox + 8 * T, barY = oy + 4;
    rect(barX, barY, 3 * T, 3 * T, PALETTE.DARK_BROWN);
    rect(barX, barY, 3 * T, 2, PALETTE.BROWN);
    // Bottles (varied shapes - tall, short, wide)
    const bottleColors = [PALETTE.RED, PALETTE.GREEN, PALETTE.GOLD, PALETTE.BROWN, PALETTE.BLUE];
    for (let b = 0; b < 5; b++) {
      const bh = b % 2 === 0 ? 12 : 10; // varied heights
      const bw = b === 3 ? 5 : 4;        // varied widths
      rect(barX + 4 + b * 8, barY + 6 + (12 - bh), bw, bh, bottleColors[b]);
      // Bottle neck (narrower)
      rect(barX + 5 + b * 8, barY + 4, 2, 3, bottleColors[b]);
      // Label (white band)
      rect(barX + 4 + b * 8, barY + 10, bw, 2, PALETTE.WHITE);
    }
    // Shelves
    rect(barX + 1, barY + 18, 3 * T - 2, 1, PALETTE.BROWN);
    rect(barX + 1, barY + 30, 3 * T - 2, 1, PALETTE.BROWN);
    // Wine glasses on lower shelf (glass outlines)
    for (let g = 0; g < 3; g++) {
      const gx = barX + 6 + g * 12, gy = barY + 22;
      px(gx, gy, PALETTE.GLASS_LT);       // rim
      px(gx + 1, gy, PALETTE.GLASS_LT);
      px(gx + 2, gy, PALETTE.GLASS_LT);
      px(gx + 1, gy + 1, PALETTE.GLASS);  // stem
      px(gx + 1, gy + 2, PALETTE.GLASS);
      px(gx, gy + 3, PALETTE.GLASS_LT);   // base
      px(gx + 1, gy + 3, PALETTE.GLASS_LT);
      px(gx + 2, gy + 3, PALETTE.GLASS_LT);
    }

    // TV screen on wall (tiny field view = green rectangle with white lines)
    const tvX = ox + 2 * T, tvY = oy + 8;
    rect(tvX, tvY, 4 * T, 2 * T + 4, PALETTE.BLACK);
    rect(tvX + 2, tvY + 2, 4 * T - 4, 2 * T, PALETTE.DARK_BLUE);
    // Game scene on TV (detailed field view)
    rect(tvX + 4, tvY + T, 4 * T - 8, T - 4, PALETTE.GRASS);
    rect(tvX + 20, tvY + 8, 8, 4, PALETTE.DIRT);   // infield dirt
    // Base paths (white lines on field)
    for (let i = 0; i < 6; i++) {
      px(tvX + 20 + i, tvY + T + 2, PALETTE.WHITE);        // horizontal basepath
    }
    px(tvX + 24, tvY + T, PALETTE.WHITE);                    // vertical basepath
    px(tvX + 24, tvY + T + 1, PALETTE.WHITE);
    // Tiny scoreboard overlay in corner of TV
    rect(tvX + 4 * T - 18, tvY + 4, 12, 6, PALETTE.BLACK);
    ctx.fillStyle = PALETTE.GREEN;
    ctx.font = '3px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('3-1', tvX + 4 * T - 16, tvY + 5);
    // TV stand/mount
    rect(tvX + 2 * T - 2, tvY + 2 * T + 4, 4, 4, PALETTE.STEEL_DK);

    // Team logo on wall (simplified circle with letter)
    if (isLeft) {
      const logoX = ox + 12 * T, logoY = oy + T;
      this._drawCircle(ctx, px, logoX, logoY, 8, PALETTE.RED, PALETTE.CRIMSON);
      // "R" shape inside
      rect(logoX - 3, logoY - 4, 2, 8, PALETTE.WHITE);
      rect(logoX - 1, logoY - 4, 4, 2, PALETTE.WHITE);
      rect(logoX - 1, logoY - 1, 4, 2, PALETTE.WHITE);
      px(logoX + 2, logoY + 2, PALETTE.WHITE);
      px(logoX + 3, logoY + 3, PALETTE.WHITE);
    } else {
      // Sponsor banner
      rect(ox + 2 * T, oy + 4, 6 * T, T, PALETTE.WHITE);
      rect(ox + 2 * T, oy + 4, 6 * T, 1, PALETTE.LIGHT_GRAY);
      // "SPONSOR" text dots
      for (let i = 0; i < 7; i++) {
        rect(ox + 2 * T + 8 + i * 10, oy + 10, 4, 3, PALETTE.DARK_BLUE);
      }
    }
  }

  /* ================================================================ */
  /*  PRESS BOX                                                        */
  /* ================================================================ */

  _buildPressBox(ctx, rect, px, cols, rows) {
    const W = cols * T, H = rows * T;

    // Base fill
    rect(0, 0, W, H, PALETTE.DARK_GRAY);

    // -- Rows 0-1: Metal roof with antenna
    for (let col = 0; col < cols; col++) {
      const x = col * T;
      rect(x, 0, T, 2 * T, PALETTE.STEEL_DK);
      rect(x, 0, T, 2, PALETTE.STEEL);
      // Roof panel seams
      if (col % 3 === 0) {
        rect(x, 0, 1, 2 * T, PALETTE.STEEL);
      }
    }
    // Antenna/satellite dish
    const antX = 8 * T, antY = 4;
    rect(antX, antY, 2, 20, PALETTE.STEEL);
    px(antX + 1, antY, PALETTE.RED); // tip light
    // Satellite dish (right side)
    const dishX = 20 * T, dishY = 2;
    this._drawCircle(ctx, px, dishX, dishY + 8, 8, PALETTE.STEEL_LT, PALETTE.STEEL);
    this._drawCircle(ctx, px, dishX, dishY + 8, 3, PALETTE.STEEL, PALETTE.STEEL_DK);
    rect(dishX - 1, dishY + 4, 2, 8, PALETTE.STEEL_DK); // feed arm

    // -- Rows 2-4: Broadcast booth
    for (let row = 2; row < 5; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * T, y = row * T;
        rect(x, y, T, T, PALETTE.DARK_GRAY);
        // Acoustic panel texture
        if (_hash(col, row, 100) > 0.7) {
          rect(x + 2, y + 2, T - 4, T - 4, PALETTE.DARK_IRON);
        }
      }
    }

    // Monitors (3-4 screens) with detailed content
    for (let m = 0; m < 4; m++) {
      const mx = 2 * T + m * 7 * T, my = 2 * T + 4;
      rect(mx, my, 5 * T, 2 * T, PALETTE.BLACK);
      rect(mx + 2, my + 2, 5 * T - 4, 2 * T - 4, PALETTE.DARK_BLUE);
      // Different game views on each monitor
      if (m === 0) {
        // Wide field view with basepaths
        rect(mx + 4, my + T, 5 * T - 8, T - 8, PALETTE.GRASS);
        rect(mx + 20, my + 10, 12, 6, PALETTE.DIRT);
        // Tiny basepaths
        for (let bp = 0; bp < 8; bp++) px(mx + 20 + bp, my + T + 2, PALETTE.WHITE);
        // Tiny waveform overlay (audio meter)
        for (let w = 0; w < 10; w++) {
          const wh = 1 + Math.floor(_hash(m, w, 110) * 4);
          rect(mx + 4 + w * 6, my + 4, 2, wh, PALETTE.GREEN);
        }
      } else if (m === 1) {
        // Close-up (pitcher) with text rows overlay
        rect(mx + 4, my + 6, 5 * T - 8, 2 * T - 12, PALETTE.GRASS);
        px(mx + 24, my + 10, PALETTE.WHITE);
        px(mx + 24, my + 11, PALETTE.RED);
        px(mx + 24, my + 12, PALETTE.WHITE);
        // Stats text rows at bottom
        for (let tr = 0; tr < 2; tr++) {
          const tw = 10 + Math.floor(_hash(m, tr, 111) * 20);
          rect(mx + 4, my + 2 * T - 8 + tr * 3, tw, 1, PALETTE.WHITE);
        }
      } else if (m === 2) {
        // Scoreboard view with inning numbers
        rect(mx + 4, my + 4, 5 * T - 8, 2 * T - 8, PALETTE.BLACK);
        for (let si = 0; si < 6; si++) {
          rect(mx + 6 + si * 10, my + 8, 6, 4, PALETTE.GREEN);
        }
        // Team names
        rect(mx + 6, my + 14, 20, 3, PALETTE.GREEN);
        rect(mx + 6, my + 18, 20, 3, PALETTE.GREEN);
      } else {
        // Replay view with waveform lines
        rect(mx + 4, my + 4, 5 * T - 8, 2 * T - 8, PALETTE.DARK_GREEN);
        px(mx + 20, my + 12, PALETTE.WHITE);
        // Waveform (audio)
        for (let w = 0; w < 12; w++) {
          const wh = 1 + Math.floor(_hash(3, w, 112) * 3);
          rect(mx + 6 + w * 5, my + 6, 1, wh, PALETTE.ORANGE);
        }
        // "REPLAY" text row
        rect(mx + 12, my + 2 * T - 6, 30, 2, PALETTE.RED);
      }
      // Monitor bezel bottom
      rect(mx + 10, my + 2 * T, 5 * T - 20, 3, PALETTE.STEEL_DK);
    }

    // Mixing board (below monitors)
    const mixX = 3 * T, mixY = 4 * T;
    rect(mixX, mixY, 24 * T, T, PALETTE.DARK_IRON);
    rect(mixX, mixY, 24 * T, 1, PALETTE.STEEL);
    // Rows of sliders and buttons
    for (let ch = 0; ch < 16; ch++) {
      const cx = mixX + 4 + ch * 22;
      // Slider track
      rect(cx, mixY + 3, 2, 8, PALETTE.DARK_GRAY);
      // Slider knob position (random)
      const knobY = mixY + 3 + Math.floor(_hash(0, ch, 101) * 6);
      rect(cx - 1, knobY, 4, 2, PALETTE.STEEL_LT);
      // Button below slider
      px(cx, mixY + 12, _hash(1, ch, 102) > 0.5 ? PALETTE.GREEN : PALETTE.RED);
    }

    // Microphones
    for (let mic = 0; mic < 2; mic++) {
      const micX = (8 + mic * 12) * T, micY = 3 * T + 8;
      rect(micX, micY, 1, 10, PALETTE.STEEL);
      rect(micX - 2, micY - 4, 5, 4, PALETTE.DARK_IRON);
      rect(micX - 1, micY - 3, 3, 2, PALETTE.STEEL);
    }

    // Headphones on hook
    const hpX = 26 * T, hpY = 3 * T;
    rect(hpX, hpY, 2, 2, PALETTE.STEEL);
    rect(hpX - 3, hpY + 2, 8, 2, PALETTE.BLACK);
    rect(hpX - 4, hpY + 4, 3, 6, PALETTE.BLACK);
    rect(hpX + 3, hpY + 4, 3, 6, PALETTE.BLACK);

    // "ON AIR" light with glow
    rect(28 * T, 2 * T + 4, 2 * T - 4, 8, PALETTE.DARK_GRAY);
    rect(28 * T + 1, 2 * T + 5, 2 * T - 6, 6, PALETTE.BLACK);
    for (let i = 0; i < 5; i++) px(28 * T + 4 + i * 3, 2 * T + 7, PALETTE.RED);
    // Red glow around ON AIR sign
    ctx.globalAlpha = 0.12;
    rect(28 * T - 2, 2 * T + 2, 2 * T, 12, PALETTE.RED);
    ctx.globalAlpha = 1;

    // Camera on tripod (right side, detailed)
    const camX = 27 * T, camY = 3 * T + 4;
    rect(camX, camY, 12, 8, PALETTE.DARK_GRAY);
    rect(camX + 1, camY + 1, 10, 6, PALETTE.BLACK);    // camera body detail
    rect(camX + 12, camY + 2, 6, 4, PALETTE.STEEL_DK); // lens barrel
    px(camX + 18, camY + 3, PALETTE.GLASS);              // lens glass
    px(camX + 17, camY + 3, PALETTE.GLASS_LT);           // lens ring
    // Recording indicator LED
    px(camX + 2, camY + 2, PALETTE.RED);
    // Viewfinder
    rect(camX + 2, camY - 2, 6, 3, PALETTE.DARK_GRAY);
    rect(camX + 3, camY - 1, 4, 1, PALETTE.DARK_BLUE);
    // Tripod legs (spread wider for stability)
    rect(camX + 3, camY + 8, 1, 10, PALETTE.STEEL_DK);  // left leg
    rect(camX + 9, camY + 8, 1, 10, PALETTE.STEEL_DK);  // right leg
    rect(camX + 6, camY + 8, 1, 12, PALETTE.STEEL_DK);  // center leg
    // Tripod head (pan/tilt mount)
    rect(camX + 4, camY + 7, 5, 2, PALETTE.STEEL);

    // -- Rows 5-7: Press seating
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * T, y = row * T;
        rect(x, y, T, T, PALETTE.CONCRETE_LT);
        if ((col + row) % 2 === 0) rect(x, y, T, T, PALETTE.CONCRETE);
      }
    }

    // Press desks with laptops
    for (let d = 0; d < 6; d++) {
      const isPriya = (d === 3);
      const dx = 2 * T + d * 4 * T + (d >= 3 ? T : 0), dy = 5 * T + 4;

      // Desk
      rect(dx, dy + 10, 3 * T, 8, PALETTE.BROWN);
      rect(dx, dy + 10, 3 * T, 1, PALETTE.DIRT_LT);
      // Desk legs
      rect(dx + 2, dy + 18, 2, 8, PALETTE.BROWN);
      rect(dx + 3 * T - 4, dy + 18, 2, 8, PALETTE.BROWN);

      // Laptop
      rect(dx + 4, dy + 4, 16, 8, PALETTE.DARK_GRAY);
      rect(dx + 5, dy + 5, 14, 6, isPriya ? PALETTE.DARK_BLUE : PALETTE.BLACK);
      // Screen content
      if (isPriya) {
        for (let tl = 0; tl < 3; tl++) {
          rect(dx + 6, dy + 6 + tl * 2, 8 + Math.floor(_hash(d, tl, 103) * 4), 1, PALETTE.GREEN);
        }
      } else {
        rect(dx + 6, dy + 6, 12, 4, PALETTE.DARK_BLUE);
      }
      // Keyboard
      rect(dx + 4, dy + 12, 16, 3, PALETTE.DARK_GRAY);

      if (isPriya) {
        // Priya's desk: notepad + coffee + pen
        rect(dx + 22, dy + 4, 10, 12, PALETTE.WHITE);
        rect(dx + 22, dy + 4, 10, 1, PALETTE.LIGHT_GRAY);
        // Writing on notepad
        for (let nl = 0; nl < 4; nl++) {
          rect(dx + 24, dy + 7 + nl * 2, 6, 1, PALETTE.BLUE);
        }
        // Coffee cup
        rect(dx + 34, dy + 6, 6, 8, PALETTE.WHITE);
        rect(dx + 35, dy + 8, 4, 4, PALETTE.BROWN);
        // Pen
        rect(dx + 24, dy + 16, 8, 1, PALETTE.BLUE);

        // Subtle highlight around Priya's desk area
        ctx.globalAlpha = 0.06;
        rect(dx - 2, dy + 2, 3 * T + 20, 20, PALETTE.GOLD);
        ctx.globalAlpha = 1;
      } else {
        // Regular press items
        if (_hash(d, 0, 104) > 0.4) {
          // Coffee cup
          rect(dx + 24, dy + 8, 4, 6, PALETTE.WHITE);
          px(dx + 25, dy + 10, PALETTE.BROWN);
        }
        // Notebook
        if (_hash(d, 1, 105) > 0.5) {
          rect(dx + 30, dy + 6, 8, 10, PALETTE.YELLOW);
        }
      }

      // Press badge
      rect(dx + 8, dy + 2, 6, 3, [PALETTE.RED, PALETTE.BLUE, PALETTE.GREEN, PALETTE.ORANGE, PALETTE.TEAL, PALETTE.PINK][d]);
      px(dx + 10, dy + 3, PALETTE.WHITE);

      // Name plate
      rect(dx + 2, dy + 8, 14, 4, PALETTE.BRASS);
      for (let np = 0; np < 4; np++) px(dx + 4 + np * 2, dy + 9, PALETTE.BLACK);
    }

    // -- Rows 8-9: Window overlooking field
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 8 * T;
      rect(x, y, T, 2 * T, PALETTE.GLASS);
      rect(x, y, T, 1, PALETTE.STEEL);
      rect(x, y + 2 * T - 1, T, 1, PALETTE.STEEL);
      if (col % 4 === 0) rect(x, y, 1, 2 * T, PALETTE.STEEL);
      // Field view
      rect(x, y + 4, T, T + 10, PALETTE.GRASS);
      rect(x, y + 3, T, 4, PALETTE.GRASS_LT);
      if (col >= 10 && col <= 19) {
        px(x + 8, y + 12, PALETTE.DIRT);
        px(x + 7, y + 13, PALETTE.DIRT_LT);
      }
      // Distant crowd
      if (col > 2 && col < 27) {
        for (let cd = 0; cd < 3; cd++) {
          px(x + 3 + cd * 4, y + T + 16, [PALETTE.RED, PALETTE.BLUE, PALETTE.WHITE][cd]);
        }
      }
    }

    // -- Rows 10-12: Scoreboard control
    for (let row = 10; row < 13; row++) {
      for (let col = 0; col < cols; col++) {
        rect(col * T, row * T, T, T, PALETTE.DARK_GRAY);
      }
    }
    // Control panels
    for (let cp = 0; cp < 3; cp++) {
      const cpx = (2 + cp * 9) * T, cpy = 10 * T + 2;
      rect(cpx, cpy, 7 * T, 2 * T, PALETTE.STEEL_DK);
      rect(cpx, cpy, 7 * T, 2, PALETTE.STEEL);
      // Rows of buttons
      for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 8; bc++) {
          const bx = cpx + 6 + bc * 12, by = cpy + 6 + br * 8;
          const btnColor = _hash(cp, br * 8 + bc, 106) > 0.6 ? PALETTE.RED : PALETTE.GREEN;
          rect(bx, by, 4, 3, btnColor);
        }
      }
      // Levers
      for (let lv = 0; lv < 2; lv++) {
        const lx = cpx + 7 * T - 20 + lv * 10, ly = cpy + 4;
        rect(lx, ly, 3, 16, PALETTE.STEEL);
        rect(lx - 1, ly + 2, 5, 4, PALETTE.STEEL_LT);
      }
    }
    // LED display testing area
    const ledX = 10 * T, ledY = 12 * T + 2;
    rect(ledX, ledY, 10 * T, T - 4, PALETTE.BLACK);
    for (let lx = 0; lx < 20; lx++) {
      for (let ly = 0; ly < 3; ly++) {
        const lc = [PALETTE.RED, PALETTE.GREEN, PALETTE.YELLOW][Math.floor(_hash(lx, ly, 107) * 3)];
        px(ledX + 4 + lx * 7, ledY + 2 + ly * 3, lc);
      }
    }
    // Clock display
    rect(22 * T, 12 * T + 2, 3 * T, T - 4, PALETTE.BLACK);
    // "12:34" in dots
    for (let ci = 0; ci < 4; ci++) {
      rect(22 * T + 4 + ci * 8, 12 * T + 5, 4, 5, PALETTE.RED);
    }

    // -- Rows 13-15: Server room
    for (let row = 13; row < 16; row++) {
      for (let col = 0; col < cols; col++) {
        rect(col * T, row * T, T, T, PALETTE.DARK_IRON);
      }
    }
    // Server racks
    for (let sr = 0; sr < 5; sr++) {
      const sx = (2 + sr * 5) * T, sy = 13 * T;
      rect(sx, sy, 4 * T, 3 * T, PALETTE.BLACK);
      rect(sx, sy, 4 * T, 2, PALETTE.STEEL_DK);
      rect(sx, sy, 2, 3 * T, PALETTE.STEEL_DK);
      rect(sx + 4 * T - 2, sy, 2, 3 * T, PALETTE.STEEL_DK);
      // Server units inside rack
      for (let unit = 0; unit < 6; unit++) {
        const uy = sy + 4 + unit * 7;
        rect(sx + 4, uy, 4 * T - 8, 5, PALETTE.DARK_GRAY);
        rect(sx + 4, uy, 4 * T - 8, 1, PALETTE.STEEL_DK);
        // LED dots with varied pattern (green=ok, blue=network, orange=hdd, red=error)
        for (let led = 0; led < 4; led++) {
          const h = _hash(sr, unit * 4 + led, 108);
          const ledColor = h > 0.6 ? PALETTE.GREEN : h > 0.3 ? PALETTE.BLUE : h > 0.1 ? PALETTE.ORANGE : PALETTE.RED;
          px(sx + 6 + led * 6, uy + 2, ledColor);
        }
        // HDD activity indicator + power LED
        px(sx + 4 * T - 12, uy + 2, PALETTE.ORANGE); // HDD
        px(sx + 4 * T - 16, uy + 2, PALETTE.GREEN);  // power
      }
    }

    // Cable management (grouped colored wire bundles)
    for (let sr = 0; sr < 5; sr++) {
      const sx = (2 + sr * 5) * T + 4 * T;
      for (let row = 13; row < 16; row++) {
        const y = row * T;
        // Cable tray
        rect(sx, y + 1, 5, 14, PALETTE.DARK_GRAY);
        // Grouped colored cables (network=blue, power=orange, fiber=green, patch=yellow)
        px(sx + 1, y + 3, PALETTE.BLUE);
        px(sx + 1, y + 5, PALETTE.BLUE);
        px(sx + 2, y + 4, PALETTE.BLUE);
        px(sx + 3, y + 3, PALETTE.ORANGE);
        px(sx + 3, y + 5, PALETTE.ORANGE);
        px(sx + 2, y + 7, PALETTE.GREEN);
        px(sx + 3, y + 7, PALETTE.GREEN);
        px(sx + 1, y + 9, PALETTE.YELLOW);
        px(sx + 2, y + 9, PALETTE.YELLOW);
        px(sx + 3, y + 11, PALETTE.RED);
        px(sx + 1, y + 11, PALETTE.RED);
      }
    }

    // AC unit (small gray box)
    rect(26 * T, 14 * T, 3 * T, 2 * T, PALETTE.STEEL);
    rect(26 * T, 14 * T, 3 * T, 2, PALETTE.STEEL_LT);
    // Grille
    for (let g = 0; g < 4; g++) {
      rect(26 * T + 4, 14 * T + 6 + g * 5, 3 * T - 8, 2, PALETTE.DARK_GRAY);
    }

    // UPS batteries
    for (let ups = 0; ups < 3; ups++) {
      rect(1 * T + ups * 3 * T, 15 * T, 2 * T, T, PALETTE.BLACK);
      rect(1 * T + ups * 3 * T, 15 * T, 2 * T, 2, PALETTE.DARK_GRAY);
      // LED on UPS
      px(1 * T + ups * 3 * T + 4, 15 * T + 6, PALETTE.GREEN);
      // Battery label
      rect(1 * T + ups * 3 * T + 8, 15 * T + 4, 12, 4, PALETTE.YELLOW);
    }

    // -- Rows 16-17: Cable runs
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 16 * T;
      rect(x, y, T, 2 * T, PALETTE.CONCRETE_DK);
      // Cable runs
      if (col % 3 === 0) {
        rect(x + 2, y + 4, T - 4, 3, PALETTE.DARK_GRAY);
        px(x + 4, y + 5, PALETTE.BLUE);
        px(x + 8, y + 5, PALETTE.ORANGE);
        px(x + 12, y + 5, PALETTE.GREEN);
      }
      // Junction boxes
      if (col % 8 === 4) {
        rect(x, y + 10, T, T, PALETTE.STEEL);
        rect(x + 2, y + 12, T - 4, T - 4, PALETTE.STEEL_DK);
        px(x + 8, y + 14, PALETTE.GREEN);
      }
    }

    // -- Rows 18-19: Support steel
    for (let col = 0; col < cols; col++) {
      const x = col * T, y = 18 * T;
      rect(x, y, T, 2 * T, PALETTE.DARK_GRAY);
      if (col % 4 === 0) {
        rect(x + 4, y, 8, 2 * T, PALETTE.STEEL_DK);
        rect(x + 4, y, 8, 2, PALETTE.STEEL);
        rect(x + 4, y + 2 * T - 2, 8, 2, PALETTE.STEEL);
      }
    }

    // -- Ambient: monitor glow on press seating area --
    ctx.globalAlpha = 0.03;
    rect(0, 5 * T, W, 3 * T, PALETTE.BLUE);
    // Darken server room slightly for depth contrast
    ctx.globalAlpha = 0.04;
    rect(0, 13 * T, W, 3 * T, PALETTE.BLACK);
    ctx.globalAlpha = 1;
  }

  /* ================================================================ */
  /*  ANIMATION OVERLAYS                                               */
  /* ================================================================ */

  _animateConcourse(renderer, state) {
    const ctx = renderer.ctx;
    const t = Date.now();

    // Flickering fluorescent lights
    for (let col = 2; col < 30; col += 4) {
      const flicker = Math.sin(t * 0.005 + col) * 0.5 + 0.5;
      ctx.globalAlpha = 0.05 + flicker * 0.1;
      ctx.fillStyle = PALETTE.WHITE;
      ctx.fillRect(col * T + 3, T - 2, 10, 2);
      // Light cone below
      ctx.fillRect(col * T, T + 2, T, 6);
    }
    ctx.globalAlpha = 1;

    // Neon signs pulsing
    const pulse = Math.sin(t * 0.003) * 0.3 + 0.7;
    ctx.globalAlpha = pulse * 0.3;
    ctx.fillStyle = PALETTE.RED;
    ctx.fillRect(8 * T + 14, 14 * T - 6, 30, 6);
    ctx.globalAlpha = 1;

    // Neon sign glow near concession stands — colored pixels that pulse alpha
    const neonSigns = [
      { x: 12 * T + 2, y: 8 * T + 2, color: '#ff4466', color2: '#ff8844' },
      { x: 20 * T + 2, y: 8 * T + 2, color: '#44aaff', color2: '#66ffcc' },
    ];
    for (const sign of neonSigns) {
      const glow = 0.3 + Math.sin(t * 0.004 + sign.x * 0.1) * 0.25;
      ctx.globalAlpha = glow;
      // Main glow pixels
      ctx.fillStyle = sign.color;
      ctx.fillRect(sign.x, sign.y, 4, 1);
      ctx.fillRect(sign.x, sign.y + 1, 4, 1);
      ctx.fillStyle = sign.color2;
      ctx.fillRect(sign.x + 1, sign.y + 2, 2, 1);
      // Surrounding glow halo
      ctx.globalAlpha = glow * 0.3;
      ctx.fillStyle = sign.color;
      ctx.fillRect(sign.x - 1, sign.y - 1, 6, 5);
    }
    ctx.globalAlpha = 1;

    // Neon Food Court (when purchased) — neon signs with food icons
    if ((state?.purchasedExpansions ?? []).some(p => p.key === 'neonFoodCourt')) {
      const ts = t * 0.001;

      // === Sign 1: Hot Dog (red neon) at col 4-6, row 6-7 ===
      const hx = 4 * T, hy = 6 * T;
      ctx.save();
      // Sign frame
      ctx.fillStyle = '#331111';
      ctx.fillRect(hx, hy, 3 * T, 2 * T);
      ctx.fillStyle = '#552222';
      ctx.fillRect(hx + 1, hy + 1, 3 * T - 2, 2 * T - 2);
      // Neon glow background
      const p1 = 0.12 + Math.sin(ts * 1.2) * 0.08;
      ctx.globalAlpha = p1;
      ctx.fillStyle = '#ff4466';
      ctx.fillRect(hx + 2, hy + 2, 3 * T - 4, 2 * T - 4);
      ctx.globalAlpha = 1;
      // Hot dog pixel art (bun + sausage)
      ctx.fillStyle = '#cc9944'; // bun
      ctx.fillRect(hx + 6, hy + 8, 12, 5);
      ctx.fillRect(hx + 5, hy + 10, 1, 3);
      ctx.fillRect(hx + 18, hy + 10, 1, 3);
      ctx.fillRect(hx + 6, hy + 13, 12, 2);
      ctx.fillStyle = '#cc3333'; // sausage
      ctx.fillRect(hx + 7, hy + 9, 10, 3);
      ctx.fillStyle = '#ffee44'; // mustard zigzag
      ctx.fillRect(hx + 8, hy + 9, 1, 1);
      ctx.fillRect(hx + 10, hy + 10, 1, 1);
      ctx.fillRect(hx + 12, hy + 9, 1, 1);
      ctx.fillRect(hx + 14, hy + 10, 1, 1);
      // Neon border glow dots
      ctx.fillStyle = '#ff4466';
      for (let i = 0; i < 3 * T; i += 3) {
        const flicker = Math.sin(ts * 3 + i * 0.5) > 0;
        if (flicker) {
          ctx.fillRect(hx + i, hy, 1, 1);
          ctx.fillRect(hx + i, hy + 2 * T - 1, 1, 1);
        }
      }
      ctx.restore();

      // === Sign 2: Nachos (yellow neon) at col 14-16, row 6-7 ===
      const nx = 14 * T, ny = 6 * T;
      ctx.save();
      ctx.fillStyle = '#332200';
      ctx.fillRect(nx, ny, 3 * T, 2 * T);
      ctx.fillStyle = '#443311';
      ctx.fillRect(nx + 1, ny + 1, 3 * T - 2, 2 * T - 2);
      const p2 = 0.12 + Math.sin(ts * 1.2 + 2.1) * 0.08;
      ctx.globalAlpha = p2;
      ctx.fillStyle = '#ffec27';
      ctx.fillRect(nx + 2, ny + 2, 3 * T - 4, 2 * T - 4);
      ctx.globalAlpha = 1;
      // Nacho chips pixel art (triangular chips in a pile)
      ctx.fillStyle = '#ddaa33'; // chip color
      ctx.fillRect(nx + 8, ny + 12, 8, 2);
      ctx.fillRect(nx + 10, ny + 10, 6, 2);
      ctx.fillRect(nx + 7, ny + 14, 10, 2);
      // Individual chip triangles
      ctx.fillStyle = '#eebb44';
      ctx.fillRect(nx + 6, ny + 10, 3, 4);
      ctx.fillRect(nx + 15, ny + 11, 3, 3);
      ctx.fillRect(nx + 11, ny + 8, 2, 2);
      // Cheese drizzle
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(nx + 9, ny + 11, 1, 1);
      ctx.fillRect(nx + 12, ny + 12, 1, 1);
      ctx.fillRect(nx + 14, ny + 11, 1, 1);
      // Neon border dots
      ctx.fillStyle = '#ffec27';
      for (let i = 0; i < 3 * T; i += 3) {
        const flicker = Math.sin(ts * 3 + i * 0.5 + 1.5) > 0;
        if (flicker) {
          ctx.fillRect(nx + i, ny, 1, 1);
          ctx.fillRect(nx + i, ny + 2 * T - 1, 1, 1);
        }
      }
      ctx.restore();

      // === Sign 3: Cold Beer (blue neon) at col 23-25, row 6-7 ===
      const bx = 23 * T, by = 6 * T;
      ctx.save();
      ctx.fillStyle = '#112233';
      ctx.fillRect(bx, by, 3 * T, 2 * T);
      ctx.fillStyle = '#1a3344';
      ctx.fillRect(bx + 1, by + 1, 3 * T - 2, 2 * T - 2);
      const p3 = 0.12 + Math.sin(ts * 1.2 + 4.2) * 0.08;
      ctx.globalAlpha = p3;
      ctx.fillStyle = '#44aaff';
      ctx.fillRect(bx + 2, by + 2, 3 * T - 4, 2 * T - 4);
      ctx.globalAlpha = 1;
      // Beer mug pixel art
      ctx.fillStyle = '#ddcc88'; // mug body
      ctx.fillRect(bx + 8, by + 8, 8, 10);
      ctx.fillRect(bx + 7, by + 9, 1, 8); // left edge
      ctx.fillStyle = '#ccbb77'; // mug bottom
      ctx.fillRect(bx + 7, by + 17, 10, 2);
      ctx.fillStyle = '#eebb44'; // beer
      ctx.fillRect(bx + 9, by + 10, 6, 7);
      ctx.fillStyle = '#ffffff'; // foam head
      ctx.fillRect(bx + 8, by + 7, 8, 3);
      ctx.fillRect(bx + 9, by + 6, 6, 1);
      // Mug handle
      ctx.fillStyle = '#ccbb77';
      ctx.fillRect(bx + 16, by + 10, 2, 1);
      ctx.fillRect(bx + 17, by + 11, 2, 4);
      ctx.fillRect(bx + 16, by + 15, 2, 1);
      // Foam bubbles
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.6 + Math.sin(ts * 2) * 0.3;
      ctx.fillRect(bx + 10, by + 7, 1, 1);
      ctx.fillRect(bx + 13, by + 6, 1, 1);
      ctx.globalAlpha = 1;
      // Neon border dots
      ctx.fillStyle = '#44aaff';
      for (let i = 0; i < 3 * T; i += 3) {
        const flicker = Math.sin(ts * 3 + i * 0.5 + 3) > 0;
        if (flicker) {
          ctx.fillRect(bx + i, by, 1, 1);
          ctx.fillRect(bx + i, by + 2 * T - 1, 1, 1);
        }
      }
      ctx.restore();

      // Floor glow reflections under each sign
      ctx.save();
      ctx.globalAlpha = 0.04 + Math.sin(ts) * 0.02;
      ctx.fillStyle = '#ff4466';
      ctx.fillRect(hx, hy + 2 * T, 3 * T, T);
      ctx.fillStyle = '#ffec27';
      ctx.fillRect(nx, ny + 2 * T, 3 * T, T);
      ctx.fillStyle = '#44aaff';
      ctx.fillRect(bx, by + 2 * T, 3 * T, T);
      ctx.restore();
    }
  }

  _animateMechanical(renderer, state) {
    const ctx = renderer.ctx;
    const t = Date.now();

    // Blinking status LEDs on electrical panels
    for (let p = 0; p < 4; p++) {
      const panelX = 2 * T + p * 7 * T;
      for (let led = 0; led < 3; led++) {
        const blink = Math.sin(t * 0.004 + p * 2 + led) > 0;
        ctx.fillStyle = blink ? PALETTE.GREEN : PALETTE.DARK_GREEN;
        ctx.fillRect(panelX + 4 + led * 20, 7 * T + 6, 2, 2);
      }
    }

    // Fan rotation effect (spinning blades)
    for (const ahuX of [2 * T, 16 * T]) {
      const fanCX = ahuX + 12 * T - 30, fanCY = 3 * T + 2 * T;
      const angle = (t * 0.003) % (Math.PI * 2);
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = PALETTE.STEEL_LT;
      for (let b = 0; b < 4; b++) {
        const a = angle + b * Math.PI / 2;
        const bx = fanCX + Math.cos(a) * 8;
        const by = fanCY + Math.sin(a) * 8;
        ctx.fillRect(Math.floor(bx), Math.floor(by), 2, 2);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Monitor cursor blink
    const cursorOn = Math.floor(t / 500) % 2 === 0;
    if (cursorOn) {
      ctx.fillStyle = PALETTE.GREEN;
      ctx.fillRect(11 * T + 18, 8 * T + 14, 2, 2);
    }

    // Pixel-art rotating fans: alternate + and x patterns every 0.5s
    const fanPhase = Math.floor(t / 500) % 2;
    const fanPositions = [
      { x: 6 * T + 8, y: 4 * T + 8 },
      { x: 14 * T + 8, y: 4 * T + 8 },
      { x: 22 * T + 8, y: 4 * T + 8 },
    ];
    ctx.fillStyle = PALETTE.STEEL_LT;
    for (const fp of fanPositions) {
      if (fanPhase === 0) {
        // + shape
        ctx.fillRect(fp.x, fp.y - 1, 1, 3);
        ctx.fillRect(fp.x - 1, fp.y, 3, 1);
      } else {
        // x shape
        ctx.fillRect(fp.x - 1, fp.y - 1, 1, 1);
        ctx.fillRect(fp.x + 1, fp.y - 1, 1, 1);
        ctx.fillRect(fp.x, fp.y, 1, 1);
        ctx.fillRect(fp.x - 1, fp.y + 1, 1, 1);
        ctx.fillRect(fp.x + 1, fp.y + 1, 1, 1);
      }
    }

    // Pulsing LED indicators near equipment
    const ledPositions = [
      { x: 4 * T + 2, y: 8 * T + 4, color: PALETTE.GREEN },
      { x: 10 * T + 2, y: 8 * T + 4, color: PALETTE.RED },
      { x: 18 * T + 2, y: 8 * T + 4, color: '#ffaa00' },
      { x: 24 * T + 2, y: 8 * T + 4, color: PALETTE.GREEN },
    ];
    for (const led of ledPositions) {
      const brightness = 0.4 + Math.sin(t * 0.003 + led.x) * 0.4;
      ctx.globalAlpha = brightness;
      ctx.fillStyle = led.color;
      ctx.fillRect(led.x, led.y, 2, 1);
    }
    ctx.globalAlpha = 1;

    // Weather Station Tower (when purchased) — upper-right area
    const purchased = state?.purchasedExpansions ?? [];
    if (purchased.some(p => p.key === 'weatherStationTower')) {
      const towerX = 26 * T;
      const towerY = 1 * T;
      const hasWeatherEvent = !!state?.activeEvent && state.activeEvent.category === 'weather';

      // Antenna mast (vertical pole)
      ctx.fillStyle = PALETTE.STEEL_LT;
      ctx.fillRect(towerX + 7, towerY, 2, 6 * T);

      // Cross-beams
      ctx.fillStyle = PALETTE.STEEL_DK;
      ctx.fillRect(towerX + 3, towerY + 2 * T, 10, 1);
      ctx.fillRect(towerX + 4, towerY + 4 * T, 8, 1);

      // Radar dish — shifts offset during active weather
      const dishOffset = hasWeatherEvent ? Math.floor(Math.sin(t * 0.005) * 3) : 0;
      ctx.fillStyle = '#aaaacc';
      ctx.fillRect(towerX + 2 + dishOffset, towerY + T, 5, 3);
      ctx.fillStyle = '#888aaa';
      ctx.fillRect(towerX + 3 + dishOffset, towerY + T + 1, 3, 1);
      // Dish arm connecting to mast
      ctx.fillStyle = PALETTE.STEEL_DK;
      ctx.fillRect(towerX + 7, towerY + T + 1, Math.abs(dishOffset) + 1, 1);

      // Spinning anemometer cups at top
      const anemAngle = (t * 0.006) % (Math.PI * 2);
      ctx.save();
      ctx.fillStyle = '#ccccdd';
      for (let cup = 0; cup < 3; cup++) {
        const a = anemAngle + cup * (Math.PI * 2 / 3);
        const cx = towerX + 8 + Math.cos(a) * 4;
        const cy = towerY - 2 + Math.sin(a) * 4;
        ctx.fillRect(Math.floor(cx), Math.floor(cy), 2, 2);
      }
      // Center hub
      ctx.fillStyle = PALETTE.STEEL_LT;
      ctx.fillRect(towerX + 7, towerY - 3, 2, 2);
      ctx.restore();

      // Pulsing green signal indicator during storms
      if (hasWeatherEvent) {
        const signalPulse = 0.4 + Math.sin(t * 0.008) * 0.4;
        ctx.globalAlpha = signalPulse;
        ctx.fillStyle = PALETTE.GREEN;
        ctx.fillRect(towerX + 6, towerY + 3 * T, 4, 2);
        // Signal glow halo
        ctx.globalAlpha = signalPulse * 0.3;
        ctx.fillRect(towerX + 4, towerY + 3 * T - 1, 8, 4);
        ctx.globalAlpha = 1;
      } else {
        // Steady dim green when no weather
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = PALETTE.GREEN;
        ctx.fillRect(towerX + 6, towerY + 3 * T, 4, 2);
        ctx.globalAlpha = 1;
      }
    }

    // Rusty's Retirement Clock (when purchased) — large clock face, cols 2-4, rows 0-2
    if (purchased.some(p => p.key === 'rustysRetirementClock')) {
      const clockCX = 3 * T + T / 2;       // center x (middle of cols 2-4)
      const clockCY = 1 * T + T / 2;       // center y (middle of rows 0-2)
      const clockR = Math.floor(T * 1.4);  // radius ~22px

      // Clock face background
      ctx.save();
      for (let dy = -clockR; dy <= clockR; dy++) {
        for (let dx = -clockR; dx <= clockR; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= clockR) {
            ctx.fillStyle = dist > clockR - 2 ? '#cc9933' : '#1a1a2e';
            ctx.fillRect(clockCX + dx, clockCY + dy, 1, 1);
          }
        }
      }

      // Brass border dots around circumference (every 30 degrees)
      ctx.fillStyle = '#cc9933';
      for (let i = 0; i < 12; i++) {
        const a = i * (Math.PI * 2 / 12);
        const dotX = clockCX + Math.cos(a) * (clockR - 3);
        const dotY = clockCY + Math.sin(a) * (clockR - 3);
        ctx.fillRect(Math.floor(dotX), Math.floor(dotY), 1, 1);
      }

      // Tick marks at 12, 3, 6, 9 o'clock (slightly larger)
      ctx.fillStyle = PALETTE.WARM_WHITE;
      for (let i = 0; i < 4; i++) {
        const a = i * (Math.PI / 2) - Math.PI / 2; // start at 12 o'clock
        const innerR = clockR - 5;
        const outerR = clockR - 2;
        const ix = clockCX + Math.cos(a) * innerR;
        const iy = clockCY + Math.sin(a) * innerR;
        const ox = clockCX + Math.cos(a) * outerR;
        const oy = clockCY + Math.sin(a) * outerR;
        ctx.fillRect(Math.floor(ix), Math.floor(iy), 1, 1);
        ctx.fillRect(Math.floor(ox), Math.floor(oy), 1, 1);
      }

      // Hour hand — based on gameDay
      const gameDay = state?.gameDay ?? 0;
      const hourAngle = (gameDay % 12) / 12 * Math.PI * 2 - Math.PI / 2;
      const hourLen = clockR * 0.45;
      ctx.fillStyle = PALETTE.WARM_WHITE;
      for (let s = 0; s < hourLen; s += 1) {
        const hx = clockCX + Math.cos(hourAngle) * s;
        const hy = clockCY + Math.sin(hourAngle) * s;
        ctx.fillRect(Math.floor(hx), Math.floor(hy), 1, 1);
      }

      // Minute hand — based on real-time (one full revolution per 60 seconds)
      const minuteAngle = ((t / 60000) % 1) * Math.PI * 2 - Math.PI / 2;
      const minuteLen = clockR * 0.7;
      ctx.fillStyle = PALETTE.LIGHT_GRAY;
      for (let s = 0; s < minuteLen; s += 1) {
        const mx = clockCX + Math.cos(minuteAngle) * s;
        const my = clockCY + Math.sin(minuteAngle) * s;
        ctx.fillRect(Math.floor(mx), Math.floor(my), 1, 1);
      }

      // Center hub dot
      ctx.fillStyle = '#cc9933';
      ctx.fillRect(clockCX - 1, clockCY - 1, 2, 2);
      ctx.restore();
    }
  }

  _animateUnderground(renderer, state) {
    const ctx = renderer.ctx;
    const t = Date.now();

    // Dripping water animation
    for (let drip = 0; drip < 5; drip++) {
      const dx = (3 + drip * 6) * T + 8;
      const period = 2000 + drip * 400;
      const phase = (t % period) / period;
      const dy = 4 * T + phase * 3 * T;
      ctx.globalAlpha = 1 - phase;
      ctx.fillStyle = PALETTE.WATER_LT;
      ctx.fillRect(dx, Math.floor(dy), 1, 2);
      ctx.globalAlpha = 1;
    }

    // Water flow in drainage channel (shimmer)
    for (let col = 12; col < 18; col++) {
      for (let row = 6; row < 10; row++) {
        const shimmer = Math.sin(t * 0.002 + col * 0.5 + row) * 0.15;
        ctx.globalAlpha = Math.abs(shimmer);
        ctx.fillStyle = PALETTE.WATER_LT;
        const sx = col * T + ((t * 0.02 + col * 4) % T);
        ctx.fillRect(Math.floor(sx), row * T + 4, 3, 1);
        ctx.globalAlpha = 1;
      }
    }

    // Work light flicker
    for (let col = 3; col < 30; col += 7) {
      const flicker = Math.sin(t * 0.008 + col * 3) * 0.5 + 0.5;
      ctx.globalAlpha = flicker * 0.08;
      ctx.fillStyle = PALETTE.YELLOW;
      const lx = col * T + 8;
      ctx.fillRect(lx - 6, 6 * T + 2, 12, 16);
      ctx.globalAlpha = 1;
    }

    // Pump motor vibration indicator
    const vibrate = Math.sin(t * 0.02) > 0.8 ? 1 : 0;
    if (vibrate) {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = PALETTE.ORANGE;
      ctx.fillRect(2 * T + 4, 7 * T + 6, 20, 16);
      ctx.globalAlpha = 1;
    }

    // Bright drip pixel falling from ceiling with random pause between drips
    if (!this._ugDrip) {
      this._ugDrip = { x: 20 * T + 4, y: 2 * T, active: true, pauseUntil: 0 };
    }
    if (t > this._ugDrip.pauseUntil) {
      if (!this._ugDrip.active) {
        this._ugDrip.active = true;
        this._ugDrip.y = 2 * T;
      }
      this._ugDrip.y += 0.5;
      if (this._ugDrip.y > 10 * T) {
        this._ugDrip.active = false;
        this._ugDrip.pauseUntil = t + 1500 + Math.random() * 2000;
        this._ugDrip.y = 2 * T;
      }
      if (this._ugDrip.active) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = PALETTE.WATER_LT;
        ctx.fillRect(this._ugDrip.x, Math.floor(this._ugDrip.y), 1, 1);
        ctx.globalAlpha = 1;
      }
    }

    // Flickering light area — semi-transparent rectangle that oscillates
    const lightFlicker = Math.sin(t * 0.01) * 0.5 + 0.5;
    const flick2 = Math.sin(t * 0.037) > 0.9 ? 0.12 : lightFlicker * 0.06;
    ctx.globalAlpha = flick2;
    ctx.fillStyle = PALETTE.YELLOW;
    ctx.fillRect(15 * T, 5 * T, 3 * T, 2 * T);
    ctx.globalAlpha = 1;

    // Steam Forge (when purchased) — geothermal steam system
    if ((state?.purchasedExpansions ?? []).some(p => p.key === 'steamForge')) {
      const ts = t * 0.001;

      // === Main pipes (thicker, with joints and flanges) ===
      // Upper pipe — row 7, cols 1-6
      ctx.fillStyle = '#994422'; // dark copper base
      ctx.fillRect(1 * T, 7 * T + 4, 5 * T, 5);
      ctx.fillStyle = '#cc6633'; // copper highlight top
      ctx.fillRect(1 * T, 7 * T + 4, 5 * T, 2);
      ctx.fillStyle = '#bb5522'; // mid tone
      ctx.fillRect(1 * T, 7 * T + 6, 5 * T, 1);
      // Pipe flanges (bolted joints)
      for (const fx of [2 * T, 4 * T]) {
        ctx.fillStyle = '#aa7733';
        ctx.fillRect(fx - 1, 7 * T + 3, 3, 7);
        ctx.fillStyle = '#887722';
        ctx.fillRect(fx, 7 * T + 3, 1, 1); // bolt top
        ctx.fillRect(fx, 7 * T + 9, 1, 1); // bolt bottom
      }

      // Lower pipe — row 9, cols 1-6
      ctx.fillStyle = '#994422';
      ctx.fillRect(1 * T, 9 * T + 4, 5 * T, 5);
      ctx.fillStyle = '#cc6633';
      ctx.fillRect(1 * T, 9 * T + 4, 5 * T, 2);
      ctx.fillStyle = '#bb5522';
      ctx.fillRect(1 * T, 9 * T + 6, 5 * T, 1);
      // Flanges
      for (const fx of [2 * T + 8, 4 * T + 8]) {
        ctx.fillStyle = '#aa7733';
        ctx.fillRect(fx - 1, 9 * T + 3, 3, 7);
        ctx.fillStyle = '#887722';
        ctx.fillRect(fx, 9 * T + 3, 1, 1);
        ctx.fillRect(fx, 9 * T + 9, 1, 1);
      }

      // Vertical connector pipe between upper and lower
      ctx.fillStyle = '#994422';
      ctx.fillRect(5 * T + 6, 7 * T + 9, 4, 2 * T - 2);
      ctx.fillStyle = '#cc6633';
      ctx.fillRect(5 * T + 6, 7 * T + 9, 2, 2 * T - 2);

      // === Valve wheel on upper pipe ===
      const vx = 3 * T + 4, vy = 7 * T;
      ctx.fillStyle = '#cc3333'; // red valve wheel
      // Wheel spokes (rotating)
      const valveAngle = ts * 0.5;
      for (let spoke = 0; spoke < 4; spoke++) {
        const a = valveAngle + spoke * Math.PI / 2;
        const sx = vx + Math.cos(a) * 3;
        const sy = vy + Math.sin(a) * 3;
        ctx.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
      }
      // Wheel hub
      ctx.fillStyle = '#aa2222';
      ctx.fillRect(vx, vy, 1, 1);
      // Valve stem
      ctx.fillStyle = '#888888';
      ctx.fillRect(vx, vy + 1, 1, 3);

      // === Pressure gauge (larger, col 2, row 6) ===
      const gaugeX = 2 * T + T / 2;
      const gaugeY = 6 * T + T / 2;
      const gaugeR = 5;

      // Gauge face
      ctx.fillStyle = '#1a1a1a';
      for (let gdy = -gaugeR; gdy <= gaugeR; gdy++) {
        for (let gdx = -gaugeR; gdx <= gaugeR; gdx++) {
          if (gdx * gdx + gdy * gdy <= gaugeR * gaugeR) {
            ctx.fillRect(gaugeX + gdx, gaugeY + gdy, 1, 1);
          }
        }
      }
      // Brass ring border
      ctx.fillStyle = '#cc9933';
      for (let gdy = -gaugeR; gdy <= gaugeR; gdy++) {
        for (let gdx = -gaugeR; gdx <= gaugeR; gdx++) {
          const dist = Math.sqrt(gdx * gdx + gdy * gdy);
          if (dist <= gaugeR && dist > gaugeR - 1.5) {
            ctx.fillRect(gaugeX + gdx, gaugeY + gdy, 1, 1);
          }
        }
      }
      // Gauge markings (green/yellow/red zones)
      for (let a = -2.5; a < 0.5; a += 0.3) {
        const markR = gaugeR - 2;
        const mx = gaugeX + Math.cos(a) * markR;
        const my = gaugeY + Math.sin(a) * markR;
        ctx.fillStyle = a < -1.5 ? '#00aa44' : a < -0.5 ? '#ffcc00' : '#ff3333';
        ctx.fillRect(Math.floor(mx), Math.floor(my), 1, 1);
      }
      // Needle (oscillating in green-yellow range)
      const needleAngle = -2.0 + Math.sin(ts * 0.8) * 0.6;
      ctx.fillStyle = '#ff3333';
      for (let s = 0; s < gaugeR - 1; s++) {
        const pnx = gaugeX + Math.cos(needleAngle) * s;
        const pny = gaugeY + Math.sin(needleAngle) * s;
        ctx.fillRect(Math.floor(pnx), Math.floor(pny), 1, 1);
      }
      // Center hub
      ctx.fillStyle = '#cc9933';
      ctx.fillRect(gaugeX - 1, gaugeY - 1, 2, 2);

      // === Steam jets (larger, more visible wisps) ===
      ctx.save();
      const jetPositions = [
        { px: 1 * T + 12, py: 7 * T + 3 },
        { px: 4 * T + 6,  py: 7 * T + 3 },
        { px: 2 * T + 4,  py: 9 * T + 3 },
        { px: 5 * T,      py: 9 * T + 3 },
      ];
      for (const jet of jetPositions) {
        for (let i = 0; i < 5; i++) {
          const rise = (ts * 1.8 + i * 0.7) % 3.5;
          const alpha = Math.max(0, 1 - rise / 3.5) * 0.45;
          const xOff = Math.sin(ts * 1.5 + i * 1.3) * 3;
          const spread = rise * 0.8; // wisps spread as they rise
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(
            Math.floor(jet.px + xOff - spread),
            Math.floor(jet.py - rise * T * 0.6),
            Math.ceil(2 + spread * 2), 2
          );
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // === Warning sign label ===
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(1 * T, 10 * T + 2, 8, 6);
      ctx.fillStyle = '#333333';
      ctx.fillRect(1 * T + 1, 10 * T + 3, 6, 4);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(1 * T + 3, 10 * T + 4, 2, 2); // ! exclamation mark
      ctx.fillRect(1 * T + 3, 10 * T + 3, 2, 1);
    }
  }

  _animateLuxury(renderer, state) {
    const ctx = renderer.ctx;
    const t = Date.now();

    // Warm ambient glow pulsing from ceiling lights
    for (let col = 2; col < 30; col += 4) {
      const glow = Math.sin(t * 0.001 + col * 0.3) * 0.03 + 0.07;
      ctx.globalAlpha = glow;
      ctx.fillStyle = PALETTE.WARM_WHITE;
      ctx.fillRect(col * T, T, T, T);
    }
    ctx.globalAlpha = 1;

    // TV screen flicker (subtle)
    for (const suiteOx of [1 * T, 15 * T]) {
      const tvX = suiteOx + 2 * T, tvY = 4 * T + 8;
      const flicker = Math.sin(t * 0.006) * 0.05 + 0.05;
      ctx.globalAlpha = flicker;
      ctx.fillStyle = PALETTE.BLUE;
      ctx.fillRect(tvX + 2, tvY + 2, 4 * T - 4, 2 * T);
      ctx.globalAlpha = 1;
    }

    // Wall sconce warm glow animation
    for (let sc = 3; sc < 27; sc += 5) {
      const glow = Math.sin(t * 0.002 + sc) * 0.04 + 0.08;
      ctx.globalAlpha = glow;
      ctx.fillStyle = PALETTE.WARM_WHITE;
      ctx.fillRect(sc * T + 2, 14 * T + 6, 12, 10);
      ctx.globalAlpha = 1;
    }

    // Small TV screens: 3x2 pixel rectangles that cycle colors every 2-3s
    const tvColors = ['#4488ff', '#44cc66', '#ffffff'];
    const tvScreens = [
      { x: 5 * T + 6, y: 6 * T + 2 },
      { x: 11 * T + 6, y: 6 * T + 2 },
      { x: 19 * T + 6, y: 6 * T + 2 },
      { x: 25 * T + 6, y: 6 * T + 2 },
    ];
    for (let i = 0; i < tvScreens.length; i++) {
      const tv = tvScreens[i];
      const colorIdx = Math.floor(t / (2000 + i * 300)) % tvColors.length;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = tvColors[colorIdx];
      ctx.fillRect(tv.x, tv.y, 3, 2);
      // Glow around TV
      ctx.globalAlpha = 0.1;
      ctx.fillRect(tv.x - 1, tv.y - 1, 5, 4);
    }
    ctx.globalAlpha = 1;

    // Luxury Aquarium Wall (when purchased) — right wall, cols 26-29, rows 4-14
    if ((state?.purchasedExpansions ?? []).some(p => p.key === 'luxuryAquariumWall')) {
      const ts = t * 0.001;
      const aqLeft = 26 * T;
      const aqTop = 4 * T;
      const aqW = 4 * T;
      const aqH = 10 * T;

      ctx.save();

      // === Aquarium tank frame (brass border) ===
      ctx.fillStyle = '#886622';
      ctx.fillRect(aqLeft - 1, aqTop - 1, aqW + 2, 1);        // top
      ctx.fillRect(aqLeft - 1, aqTop + aqH, aqW + 2, 1);      // bottom
      ctx.fillRect(aqLeft - 1, aqTop, 1, aqH);                 // left
      ctx.fillRect(aqLeft + aqW, aqTop, 1, aqH);               // right
      // Inner frame highlight
      ctx.fillStyle = '#aa9944';
      ctx.fillRect(aqLeft, aqTop - 1, aqW, 1);

      // === Deep blue water background ===
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#002266';
      ctx.fillRect(aqLeft, aqTop, aqW, aqH);
      // Depth gradient (darker at bottom)
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#000033';
      ctx.fillRect(aqLeft, aqTop + aqH * 0.6, aqW, aqH * 0.4);
      ctx.globalAlpha = 1;

      // === Sandy bottom ===
      ctx.fillStyle = '#ccaa66';
      ctx.fillRect(aqLeft, aqTop + aqH - 4, aqW, 3);
      ctx.fillStyle = '#bbaa55';
      ctx.fillRect(aqLeft, aqTop + aqH - 2, aqW, 2);
      // Pebbles
      ctx.fillStyle = '#998844';
      ctx.fillRect(aqLeft + 4, aqTop + aqH - 4, 2, 1);
      ctx.fillRect(aqLeft + 15, aqTop + aqH - 3, 1, 1);
      ctx.fillRect(aqLeft + 30, aqTop + aqH - 4, 2, 1);
      ctx.fillRect(aqLeft + 45, aqTop + aqH - 3, 1, 1);

      // === Seaweed (3 strands swaying) ===
      const seaweedPositions = [aqLeft + 6, aqLeft + 22, aqLeft + 42];
      for (let si = 0; si < seaweedPositions.length; si++) {
        const swx = seaweedPositions[si];
        const sway = Math.sin(ts * 0.8 + si * 1.5) * 2;
        ctx.fillStyle = '#226633';
        for (let seg = 0; seg < 6; seg++) {
          const segSway = Math.floor(sway * (seg / 6));
          ctx.fillRect(swx + segSway, aqTop + aqH - 6 - seg * 3, 2, 3);
        }
        // Leaf tips
        ctx.fillStyle = '#33aa44';
        ctx.fillRect(swx + Math.floor(sway) - 1, aqTop + aqH - 22, 1, 2);
        ctx.fillRect(swx + Math.floor(sway) + 2, aqTop + aqH - 20, 1, 2);
      }

      // === Small coral cluster ===
      ctx.fillStyle = '#cc5566';
      ctx.fillRect(aqLeft + 50, aqTop + aqH - 8, 3, 4);
      ctx.fillRect(aqLeft + 49, aqTop + aqH - 6, 1, 2);
      ctx.fillStyle = '#ff7788';
      ctx.fillRect(aqLeft + 51, aqTop + aqH - 9, 1, 1);
      ctx.fillRect(aqLeft + 49, aqTop + aqH - 7, 1, 1);

      // === Fish (5 fish with proper shapes) ===
      this._aquariumFish = this._aquariumFish ?? [
        { x: 5,      y: 2 * T, speed: 0.25, color: '#ff8844', accent: '#ffaa66', dir: 1, size: 'lg' },
        { x: 3 * T,  y: 4 * T, speed: 0.18, color: '#44aaff', accent: '#66ccff', dir: -1, size: 'md' },
        { x: T,      y: 6 * T, speed: 0.30, color: '#ffec27', accent: '#ffff66', dir: 1, size: 'md' },
        { x: 2 * T,  y: 3 * T, speed: 0.15, color: '#ff77a8', accent: '#ffaacc', dir: 1, size: 'sm' },
        { x: 4 * T,  y: 7 * T, speed: 0.22, color: '#00e436', accent: '#66ff88', dir: -1, size: 'sm' },
      ];

      for (const fish of this._aquariumFish) {
        fish.x += fish.speed * fish.dir;
        if (fish.x > aqW - 8) { fish.x = aqW - 8; fish.dir = -1; }
        if (fish.x < 2) { fish.x = 2; fish.dir = 1; }

        const fx = Math.floor(aqLeft + fish.x);
        const fy = Math.floor(aqTop + fish.y);
        const wobble = Math.sin(ts * 2 + fish.x * 0.1) * 0.5;

        if (fish.size === 'lg') {
          // Large fish: 7x4 body, tail, dorsal fin, eye
          ctx.fillStyle = fish.color;
          ctx.fillRect(fx + (fish.dir > 0 ? 2 : 0), fy + 1 + wobble, 5, 3);
          ctx.fillRect(fx + (fish.dir > 0 ? 3 : 0), fy + wobble, 3, 1); // top ridge
          // Tail fin
          const tailX = fish.dir > 0 ? fx : fx + 6;
          ctx.fillRect(tailX, fy + wobble, 2, 1);
          ctx.fillRect(tailX, fy + 3 + wobble, 2, 1);
          ctx.fillRect(tailX + (fish.dir > 0 ? 0 : 1), fy + 1 + wobble, 1, 2);
          // Dorsal fin
          ctx.fillStyle = fish.accent;
          ctx.fillRect(fx + 3, fy - 1 + wobble, 2, 1);
          // Eye
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(fx + (fish.dir > 0 ? 5 : 1), fy + 1 + wobble, 1, 1);
          ctx.fillStyle = '#111111';
          ctx.fillRect(fx + (fish.dir > 0 ? 6 : 0), fy + 1 + wobble, 1, 1);
        } else if (fish.size === 'md') {
          // Medium fish: 5x3 body
          ctx.fillStyle = fish.color;
          ctx.fillRect(fx + 1, fy + wobble, 4, 2);
          ctx.fillRect(fx + 2, fy + 2 + wobble, 2, 1);
          // Tail
          const tailX = fish.dir > 0 ? fx : fx + 4;
          ctx.fillRect(tailX, fy + wobble, 1, 2);
          // Eye
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(fx + (fish.dir > 0 ? 4 : 1), fy + wobble, 1, 1);
        } else {
          // Small fish: 3x2 body
          ctx.fillStyle = fish.color;
          ctx.fillRect(fx + 1, fy + wobble, 2, 2);
          // Tail
          ctx.fillRect(fx + (fish.dir > 0 ? 0 : 3), fy + 1 + wobble, 1, 1);
          // Eye
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(fx + (fish.dir > 0 ? 2 : 1), fy + wobble, 1, 1);
        }
      }

      // === Bubbles (larger, more visible) ===
      this._aquariumBubbles = this._aquariumBubbles ?? [
        { x: aqLeft + 8,        y: aqTop + aqH - 10, sz: 2 },
        { x: aqLeft + T + 5,    y: aqTop + aqH - T,  sz: 1 },
        { x: aqLeft + 2 * T,    y: aqTop + aqH - 2 * T, sz: 2 },
        { x: aqLeft + 3 * T,    y: aqTop + aqH - T / 2, sz: 1 },
        { x: aqLeft + T + 12,   y: aqTop + aqH - 3 * T, sz: 2 },
        { x: aqLeft + 3 * T + 5, y: aqTop + aqH - 4 * T, sz: 1 },
      ];

      for (const bubble of this._aquariumBubbles) {
        bubble.y -= 0.2 + bubble.sz * 0.05;
        bubble.x += Math.sin(ts * 1.5 + bubble.y * 0.02) * 0.1; // slight lateral drift
        if (bubble.y < aqTop + 3) {
          bubble.y = aqTop + aqH - 6;
          bubble.x = aqLeft + 4 + Math.floor(Math.random() * (aqW - 8));
        }
        const bAlpha = ((bubble.y - aqTop) / aqH) * 0.7;
        ctx.globalAlpha = bAlpha;
        ctx.fillStyle = '#88ccff';
        ctx.fillRect(Math.floor(bubble.x), Math.floor(bubble.y), bubble.sz, bubble.sz);
        // Highlight dot
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.floor(bubble.x), Math.floor(bubble.y), 1, 1);
      }
      ctx.globalAlpha = 1;

      // === Water surface shimmer (caustic-like light ripples) ===
      for (let cx = 0; cx < aqW; cx += 3) {
        const shimmer = Math.sin(ts * 2 + cx * 0.4) * 0.5 + 0.5;
        ctx.globalAlpha = shimmer * 0.12;
        ctx.fillStyle = PALETTE.WATER_LT;
        ctx.fillRect(aqLeft + cx, aqTop + 1, 2, 1);
      }
      // Light rays from top
      ctx.globalAlpha = 0.03;
      ctx.fillStyle = '#88ccff';
      for (let ray = 0; ray < 3; ray++) {
        const rayX = aqLeft + 8 + ray * 18 + Math.sin(ts * 0.5 + ray) * 3;
        for (let ry = 0; ry < aqH * 0.4; ry += 2) {
          ctx.fillRect(Math.floor(rayX + ry * 0.2), aqTop + ry, 2, 2);
        }
      }
      ctx.globalAlpha = 1;

      ctx.restore();
    }
  }

  _animatePressBox(renderer, state) {
    const ctx = renderer.ctx;
    const t = Date.now();

    // "ON AIR" light blinking
    const onAir = Math.floor(t / 1000) % 2 === 0;
    ctx.globalAlpha = onAir ? 0.8 : 0.15;
    ctx.fillStyle = PALETTE.RED;
    ctx.fillRect(28 * T, 2 * T + 4, 2 * T - 4, 8);
    ctx.globalAlpha = 1;

    // Server rack LED blinking
    for (let sr = 0; sr < 5; sr++) {
      const sx = (2 + sr * 5) * T;
      for (let unit = 0; unit < 6; unit++) {
        const uy = 13 * T + 4 + unit * 7;
        for (let led = 0; led < 4; led++) {
          const blink = Math.sin(t * 0.005 + sr + unit * 0.7 + led * 1.3) > 0;
          ctx.fillStyle = blink ? PALETTE.GREEN : PALETTE.DARK_GREEN;
          ctx.fillRect(sx + 6 + led * 6, uy + 2, 1, 1);
        }
        // HDD activity
        const hddActive = Math.sin(t * 0.01 + sr * 3 + unit) > 0.7;
        ctx.fillStyle = hddActive ? PALETTE.ORANGE : PALETTE.DARK_GRAY;
        ctx.fillRect(sx + 4 * T - 12, uy + 2, 1, 1);
      }
    }

    // Antenna tip blinking red light
    const antBlink = Math.floor(t / 800) % 2 === 0;
    ctx.fillStyle = antBlink ? PALETTE.RED : PALETTE.DARK_GRAY;
    ctx.fillRect(8 * T + 1, 4, 1, 1);

    // Monitor refresh flicker (very subtle)
    for (let m = 0; m < 4; m++) {
      const mx = 2 * T + m * 7 * T;
      const scanline = (Math.floor(t * 0.05) % (2 * T));
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = PALETTE.WHITE;
      ctx.fillRect(mx + 2, 2 * T + 4 + scanline, 5 * T - 4, 1);
    }
    ctx.globalAlpha = 1;

    // Cursor blink on Priya's laptop
    const cursorOn = Math.floor(t / 500) % 2 === 0;
    if (cursorOn) {
      const priyaX = 2 * T + 3 * 4 * T + T + T;
      ctx.fillStyle = PALETTE.GREEN;
      ctx.fillRect(priyaX + 14, 5 * T + 10, 1, 2);
    }

    // Extra blinking LED indicators at fixed positions
    const extraLeds = [
      { x: 4 * T + 3, y: 8 * T + 2 },
      { x: 12 * T + 3, y: 8 * T + 2 },
      { x: 20 * T + 3, y: 8 * T + 2 },
      { x: 26 * T + 3, y: 8 * T + 2 },
    ];
    for (let i = 0; i < extraLeds.length; i++) {
      const led = extraLeds[i];
      const toggle = Math.floor(t / (500 + i * 200)) % 2 === 0;
      ctx.fillStyle = toggle ? PALETTE.RED : PALETTE.GREEN;
      ctx.fillRect(led.x, led.y, 1, 1);
    }

    // Broadcast Drone Rack (when purchased) — 2 camera drones hovering
    if ((state?.purchasedExpansions ?? []).some(p => p.key === 'broadcastDroneRack')) {
      const ts = t * 0.001;
      const drones = [
        { col: 5,  row: 3, bobOffset: 0 },
        { col: 16, row: 3, bobOffset: 2 },
      ];

      for (const drone of drones) {
        const bob = Math.sin(ts * 1.5 + drone.bobOffset) * 2;
        const sway = Math.sin(ts * 0.7 + drone.bobOffset) * 1;
        const dx = Math.floor(drone.col * T + sway);
        const dy = Math.floor(drone.row * T + bob);

        ctx.save();

        // === Propeller arms (4 arms extending from center) ===
        ctx.fillStyle = '#555555';
        // Top-left arm
        ctx.fillRect(dx - 3, dy - 1, 4, 1);
        // Top-right arm
        ctx.fillRect(dx + 7, dy - 1, 4, 1);
        // Bottom-left arm
        ctx.fillRect(dx - 3, dy + 4, 4, 1);
        // Bottom-right arm
        ctx.fillRect(dx + 7, dy + 4, 4, 1);

        // === Propeller blades (3 frames of rotation) ===
        const propFrame = Math.floor(ts * 12) % 3;
        ctx.fillStyle = PALETTE.LIGHT_GRAY;
        ctx.globalAlpha = 0.6;
        const propPositions = [
          { px: dx - 3, py: dy - 1 },
          { px: dx + 8, py: dy - 1 },
          { px: dx - 3, py: dy + 4 },
          { px: dx + 8, py: dy + 4 },
        ];
        for (const pp of propPositions) {
          if (propFrame === 0) {
            ctx.fillRect(pp.px - 1, pp.py, 3, 1); // horizontal
          } else if (propFrame === 1) {
            ctx.fillRect(pp.px, pp.py - 1, 1, 3); // vertical
          } else {
            ctx.fillRect(pp.px - 1, pp.py - 1, 1, 1); // diagonal
            ctx.fillRect(pp.px + 1, pp.py + 1, 1, 1);
          }
        }
        ctx.globalAlpha = 1;

        // === Central body (8x4 with detail) ===
        ctx.fillStyle = '#333333';
        ctx.fillRect(dx + 1, dy, 6, 4);
        // Body highlight
        ctx.fillStyle = '#444444';
        ctx.fillRect(dx + 2, dy, 4, 1);
        // Body side panels
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(dx + 1, dy + 3, 6, 1);

        // === Camera gimbal underneath ===
        ctx.fillStyle = '#222222';
        ctx.fillRect(dx + 3, dy + 4, 2, 2);
        // Camera lens
        ctx.fillStyle = '#4466aa';
        ctx.fillRect(dx + 3, dy + 5, 2, 1);
        // Lens reflection
        ctx.fillStyle = '#88aadd';
        ctx.fillRect(dx + 3, dy + 5, 1, 1);

        // === Landing skids ===
        ctx.fillStyle = '#444444';
        ctx.fillRect(dx, dy + 6, 1, 1);
        ctx.fillRect(dx + 7, dy + 6, 1, 1);
        ctx.fillRect(dx - 1, dy + 6, 3, 1);
        ctx.fillRect(dx + 6, dy + 6, 3, 1);

        // === Recording light (blinks red) ===
        const recOn = Math.floor(ts * 2) % 2 === 0;
        if (recOn) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(dx + 6, dy + 1, 1, 1);
          // Glow
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(dx + 5, dy, 3, 3);
          ctx.globalAlpha = 1;
        }

        // === Signal waves (emanating periodically) ===
        const wavePhase = (ts * 2 + drone.bobOffset) % 2;
        if (wavePhase < 1.2) {
          ctx.globalAlpha = (1 - wavePhase / 1.2) * 0.3;
          ctx.fillStyle = '#44ff88';
          const wr = Math.floor(wavePhase * 6);
          // Arc of dots above the drone
          for (let wa = -2; wa <= 2; wa++) {
            ctx.fillRect(dx + 4 + wa * (wr + 1), dy - 3 - wr, 1, 1);
          }
          ctx.globalAlpha = 1;
        }

        ctx.restore();
      }
    }
  }

  /* ================================================================ */
  /*  UTILITY HELPERS                                                  */
  /* ================================================================ */

  _drawCircle(ctx, px, cx, cy, r, fillColor, borderColor) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const dist = Math.sqrt(x * x + y * y);
        if (dist <= r) {
          const color = dist > r - 1.5 ? borderColor : fillColor;
          px(cx + x, cy + y, color);
        }
      }
    }
  }

  _drawSign(ctx, rect, px, x, y, text, bgColor, fgColor) {
    const w = text.length * 3 + 4;
    rect(x, y, w, 8, bgColor);
    rect(x, y, w, 1, fgColor);
    for (let i = 0; i < text.length; i++) {
      px(x + 2 + i * 3, y + 3, fgColor);
      px(x + 3 + i * 3, y + 3, fgColor);
      px(x + 2 + i * 3, y + 5, fgColor);
    }
  }
}
