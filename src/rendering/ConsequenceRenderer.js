/**
 * ConsequenceRenderer -- Visual degradation overlays based on domain health.
 *
 * Draws condition-based effects on top of each zone's tile art.
 * Effects scale smoothly with domain health scores (0-100) and
 * use deterministic _hash() for repeatable patch/spot placement.
 */

import PALETTE from '../assets/palette.js';

const TILE = 16;
const W = 480;  // canvas width  (30 cols * 16)
const H = 320;  // canvas height (20 rows * 16)

function _hash(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

export class ConsequenceRenderer {

  /**
   * Main entry — call after TileMap.render() each frame.
   * @param {string} zoneId  - current zone id from state.currentZone
   * @param {CanvasRenderer} renderer
   * @param {object} state   - game state (needs .domainHealth)
   */
  renderConsequences(zoneId, renderer, state) {
    const health = state.domainHealth ?? { air: 100, water: 100, hvac: 100, drainage: 100 };
    const ctx = renderer.ctx;
    const now = Date.now() * 0.001;

    switch (zoneId) {
      case 'field':       this._field(ctx, health, now, renderer); break;
      case 'concourse':   this._concourse(ctx, health, now, renderer); break;
      case 'mechanical':  this._mechanical(ctx, health, now, renderer); break;
      case 'underground': this._underground(ctx, health, now, renderer); break;
      case 'luxury':      this._luxury(ctx, health, now, renderer); break;
      case 'pressbox':    this._pressbox(ctx, health, now, renderer); break;
    }
  }

  /* ================================================================ */
  /*  FIELD ZONE                                                       */
  /* ================================================================ */

  _field(ctx, health, now, renderer) {
    const water = health.water ?? 100;
    const drain = health.drainage ?? 100;
    const air   = health.air ?? 100;
    const hvac  = health.hvac ?? 100;

    // --- Grass quality (row 12, cols 4-25) ---
    const fieldX = 4 * TILE;
    const fieldY = 12 * TILE;
    const fieldW = 22 * TILE;
    const fieldH = TILE;

    if (water < 80) {
      ctx.save();
      if (water < 25) {
        // Dead brown — center-out gradient pattern
        const centerX = fieldX + fieldW / 2;
        for (let px = fieldX; px < fieldX + fieldW; px += 3) {
          const distFromCenter = Math.abs(px - centerX) / (fieldW / 2);
          const alpha = 0.5 * (1 - distFromCenter * 0.4); // stronger in center
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#5a3a1a';
          ctx.fillRect(px, fieldY, 3, fieldH);
        }
        // Cracking detail on dried field (dark lines)
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#2a1a0a';
        for (let i = 0; i < 8; i++) {
          const cx = fieldX + Math.floor(_hash(i, fieldY, 45) * fieldW);
          const cy = fieldY + Math.floor(_hash(i, fieldY, 46) * 12);
          // Crack lines (2-4px long)
          ctx.fillRect(cx, cy, 1, 3);
          ctx.fillRect(cx + 1, cy + 1, 2, 1);
          if (_hash(i, fieldY, 47) > 0.5) {
            ctx.fillRect(cx - 1, cy + 2, 1, 2);
          }
        }
      } else if (water < 50) {
        // Brown patches — natural center-out browning pattern
        const centerX = fieldX + fieldW / 2;
        for (let px = fieldX; px < fieldX + fieldW; px += 6) {
          const h1 = _hash(px, fieldY, 42);
          const distFromCenter = Math.abs(px - centerX) / (fieldW / 2);
          // More likely to brown near center
          if (h1 > 0.3 + distFromCenter * 0.3) {
            ctx.globalAlpha = 0.25 * (1 - distFromCenter * 0.5);
            ctx.fillStyle = _hash(px, fieldY, 43) > 0.5 ? '#7a5a2a' : '#6a4a1a';
            const py = fieldY + Math.floor(_hash(px, fieldY, 44) * 12);
            ctx.fillRect(px, py, 5, 3);
          }
        }
      } else {
        // Slight yellowing (50-79)
        const alpha = 0.08 + (80 - water) * 0.003;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#aa9933';
        ctx.fillRect(fieldX, fieldY, fieldW, fieldH);
      }
      ctx.restore();
    }

    // --- Puddles from drainage ---
    if (drain < 50) {
      ctx.save();
      const puddles = [[88, 196], [172, 194], [264, 198], [344, 195]];
      const large = drain < 25;
      for (const [px, py] of puddles) {
        const size = large ? 7 : 3;
        const shimmer = Math.sin(now * 2.2 + px * 0.12) * 0.08;
        ctx.globalAlpha = 0.35 + shimmer;
        ctx.fillStyle = PALETTE.DARK_BLUE;
        ctx.fillRect(px, py, size, size - 1);
        ctx.fillStyle = PALETTE.BLUE;
        ctx.fillRect(px + 1, py, Math.max(1, size - 2), 1);
      }
      // Infield water pooling when very low
      if (large) {
        const infieldX = 11 * TILE;
        const infieldY = 12 * TILE + 4;
        const shimmer2 = Math.sin(now * 1.6) * 0.06;
        ctx.globalAlpha = 0.25 + shimmer2;
        ctx.fillStyle = PALETTE.DARK_BLUE;
        ctx.fillRect(infieldX, infieldY, 8 * TILE, 6);
        ctx.fillStyle = PALETTE.BLUE;
        ctx.fillRect(infieldX + 2, infieldY, 8 * TILE - 4, 1);
      }
      ctx.restore();
    }

    // --- Muddy infield (drainage) ---
    if (drain < 50) {
      ctx.save();
      // Dirt area approximation: cols 10-20, row 12
      const dirtX = 10 * TILE;
      const dirtY = 12 * TILE;
      const dirtW = 10 * TILE;
      if (drain < 25) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#3a2510';
        ctx.fillRect(dirtX, dirtY, dirtW, TILE);
      } else {
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 6; i++) {
          const mx = dirtX + Math.floor(_hash(i, 99, 55) * dirtW);
          const my = dirtY + Math.floor(_hash(i, 99, 56) * 12);
          ctx.fillStyle = '#4a3018';
          ctx.fillRect(mx, my, 8, 4);
        }
      }
      ctx.restore();
    }

    // --- Haze from air quality (layered, not uniform) ---
    if (air < 50) {
      ctx.save();
      const baseAlpha = air < 25 ? 0.18 : 0.08;
      const hazeColor = air < 25 ? PALETTE.CONCRETE : PALETTE.LIGHT_GRAY;
      // Layer 1: ground-level haze (thicker at bottom)
      for (let band = 0; band < 4; band++) {
        const bandY = H - (band + 1) * (H / 4);
        const bandH = H / 4;
        const bandAlpha = baseAlpha * (1 - band * 0.2); // thicker at bottom
        ctx.globalAlpha = bandAlpha;
        ctx.fillStyle = hazeColor;
        ctx.fillRect(0, bandY, W, bandH);
      }
      // Layer 2: haze wisps (wavy horizontal bands)
      if (air < 25) {
        ctx.globalAlpha = 0.06;
        for (let wisp = 0; wisp < 5; wisp++) {
          const wy = Math.floor(_hash(wisp, 0, 48) * H);
          const wx = Math.floor(_hash(wisp, 1, 49) * W * 0.5);
          ctx.fillRect(wx, wy, W * 0.4, 2);
        }
      }
      ctx.restore();
    }

    // --- Mold near dugouts from HVAC ---
    if (hvac < 50) {
      ctx.save();
      const moldAlpha = hvac < 25 ? 0.4 : 0.25;
      ctx.globalAlpha = moldAlpha;
      ctx.fillStyle = PALETTE.DARK_GREEN;
      // Dugout areas: cols 3-4 and 26-27, rows 10-11
      const spots = hvac < 25 ? 10 : 5;
      for (let i = 0; i < spots; i++) {
        const side = _hash(i, 200, 10) > 0.5;
        const baseX = side ? 26 * TILE : 3 * TILE;
        const sx = baseX + Math.floor(_hash(i, 200, 11) * (2 * TILE));
        const sy = 10 * TILE + Math.floor(_hash(i, 200, 12) * (2 * TILE));
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.restore();
    }
  }

  /* ================================================================ */
  /*  CONCOURSE ZONE                                                   */
  /* ================================================================ */

  _concourse(ctx, health, now, renderer) {
    const water = health.water ?? 100;
    const drain = health.drainage ?? 100;
    const air   = health.air ?? 100;

    // --- Haze from air quality ---
    if (air < 50) {
      ctx.save();
      const alpha = air < 25 ? 0.15 : 0.08;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = PALETTE.LIGHT_GRAY;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // --- Dirty floor patches (water < 50) ---
    // Concourse floor: rows 4-15
    if (water < 50) {
      ctx.save();
      ctx.globalAlpha = water < 25 ? 0.3 : 0.18;
      for (let i = 0; i < 12; i++) {
        const px = Math.floor(_hash(i, 300, 1) * (28 * TILE)) + TILE;
        const py = 4 * TILE + Math.floor(_hash(i, 300, 2) * (12 * TILE));
        ctx.fillStyle = _hash(i, 300, 3) > 0.5 ? '#6a5a3a' : '#5a4a2a';
        ctx.fillRect(px, py, 6, 4);
      }
      ctx.restore();
    }

    // --- Puddles near restrooms (drainage < 50) ---
    // Restroom blocks at cols 5-8, 20-23, rows 12-14
    if (drain < 50) {
      ctx.save();
      const puddles = [
        [5 * TILE + 2, 14 * TILE + 12],
        [8 * TILE, 14 * TILE + 10],
        [20 * TILE + 4, 14 * TILE + 11],
        [23 * TILE, 14 * TILE + 13],
      ];
      for (const [px, py] of puddles) {
        const size = drain < 25 ? 6 : 3;
        const shimmer = Math.sin(now * 2 + px * 0.1) * 0.08;
        ctx.globalAlpha = 0.3 + shimmer;
        ctx.fillStyle = PALETTE.DARK_BLUE;
        ctx.fillRect(px, py, size, size - 1);
        ctx.fillStyle = PALETTE.BLUE;
        ctx.fillRect(px + 1, py, Math.max(1, size - 2), 1);
      }
      ctx.restore();
    }

    // --- "OUT OF ORDER" restroom sign (water < 25) ---
    if (water < 25) {
      ctx.save();
      // Two restroom blocks: cols 5-8, 20-23 at rows 12-14
      for (const startCol of [5, 20]) {
        const sx = startCol * TILE + 2;
        const sy = 12 * TILE - 8;
        // Red sign background
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = PALETTE.RED;
        ctx.fillRect(sx, sy, 30, 7);
        // White text
        ctx.fillStyle = PALETTE.WHITE;
        ctx.font = '5px monospace';
        ctx.textBaseline = 'top';
        ctx.fillText('OUT OF ORDER', sx + 1, sy + 1);
      }
      ctx.restore();
    }
  }

  /* ================================================================ */
  /*  MECHANICAL ZONE                                                  */
  /* ================================================================ */

  _mechanical(ctx, health, now, renderer) {
    const water = health.water ?? 100;
    const drain = health.drainage ?? 100;
    const air   = health.air ?? 100;
    const hvac  = health.hvac ?? 100;

    // --- Steam / leak effects from HVAC ---
    // Equipment at cols 2-6, 12-16, 22-26, rows 4-8
    if (hvac < 50) {
      ctx.save();
      const intensity = hvac < 25 ? 0.25 : 0.12;
      for (const startCol of [2, 12, 22]) {
        const ex = startCol * TILE + 8;
        for (let w = 0; w < 3; w++) {
          const wx = ex + w * 12;
          const phase = now * 1.5 + w * 2.1 + startCol;
          const rise = (phase % 3) * 8;
          const wy = 4 * TILE - rise;
          const alpha = intensity * (1 - (rise / 24));
          if (alpha > 0.01) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = PALETTE.WHITE;
            ctx.fillRect(wx, wy, 3, 2);
            ctx.fillRect(wx + 1, wy - 2, 2, 2);
          }
        }
      }
      ctx.restore();
    }

    // --- Rust stains on pipes (water < 50) ---
    // Pipes at rows 1-2, 10, 14
    if (water < 50) {
      ctx.save();
      ctx.globalAlpha = water < 25 ? 0.5 : 0.25;
      const pipeRows = [1, 2, 10, 14];
      for (const pr of pipeRows) {
        for (let i = 0; i < 6; i++) {
          const px = Math.floor(_hash(i, pr, 70) * (28 * TILE)) + TILE;
          ctx.fillStyle = _hash(i, pr, 71) > 0.5 ? PALETTE.RUST : PALETTE.RUST_LT;
          ctx.fillRect(px, pr * TILE + 4, 5, 3);
        }
      }
      ctx.restore();
    }

    // --- Warning lights turn red (air < 25) ---
    // Electrical blocks at cols 7-9, 18-20, rows 11-12
    if (air < 25) {
      ctx.save();
      const blink = Math.sin(now * 4) * 0.15;
      ctx.globalAlpha = 0.7 + blink;
      for (const startCol of [7, 18]) {
        const lx = (startCol + 1) * TILE + 4;
        const ly = 11 * TILE + 4;
        ctx.fillStyle = PALETTE.RED;
        ctx.fillRect(lx, ly, 3, 3);
        ctx.fillRect(lx + 8, ly, 3, 3);
      }
      ctx.restore();
    } else if (air < 50) {
      // Amber warning
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (const startCol of [7, 18]) {
        const lx = (startCol + 1) * TILE + 4;
        const ly = 11 * TILE + 4;
        ctx.fillStyle = PALETTE.ORANGE;
        ctx.fillRect(lx, ly, 3, 3);
        ctx.fillRect(lx + 8, ly, 3, 3);
      }
      ctx.restore();
    }

    // --- Water on floor from drainage ---
    if (drain < 50) {
      ctx.save();
      const waterH = drain < 25 ? 3 : 1;
      const shimmer = Math.sin(now * 1.8) * 0.06;
      ctx.globalAlpha = 0.3 + shimmer;
      ctx.fillStyle = PALETTE.DARK_BLUE;
      ctx.fillRect(TILE, 17 * TILE - waterH, 28 * TILE, waterH);
      ctx.fillStyle = PALETTE.BLUE;
      ctx.fillRect(TILE, 17 * TILE - waterH, 28 * TILE, 1);
      ctx.restore();
    }
  }

  /* ================================================================ */
  /*  UNDERGROUND ZONE                                                 */
  /* ================================================================ */

  _underground(ctx, health, now, renderer) {
    const water = health.water ?? 100;
    const drain = health.drainage ?? 100;

    // --- Rising water level based on drainage ---
    // Tunnel space: rows 5-14; bottom rows 18-19
    if (drain < 50) {
      ctx.save();
      // Water fills from bottom of tunnel (row 14 upward)
      const maxFill = 10 * TILE; // full tunnel height
      const ratio = 1 - (drain / 50);  // 0 at drain=50, 1 at drain=0
      const fillH = Math.floor(ratio * (drain < 25 ? maxFill * 0.6 : maxFill * 0.3));
      const waterTop = 15 * TILE - fillH;

      // Animated wave at water surface
      const wave = Math.sin(now * 1.4) * 2;

      ctx.globalAlpha = 0.35;
      ctx.fillStyle = PALETTE.DARK_BLUE;
      ctx.fillRect(TILE, waterTop + wave, 28 * TILE, fillH);

      // Highlight line at surface
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = PALETTE.BLUE;
      for (let x = TILE; x < 29 * TILE; x += 4) {
        const localWave = Math.sin(now * 1.4 + x * 0.08) * 1.5;
        ctx.fillRect(x, waterTop + localWave, 3, 1);
      }

      // Deeper water in bottom rows 18-19
      if (drain < 25) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = PALETTE.DARK_BLUE;
        ctx.fillRect(0, 18 * TILE, W, 2 * TILE);
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = PALETTE.BLUE;
        for (let x = 0; x < W; x += 6) {
          const bwave = Math.sin(now * 2 + x * 0.1) * 1;
          ctx.fillRect(x, 18 * TILE + bwave, 4, 1);
        }
      }
      ctx.restore();
    }

    // --- Algae patches on walls (water < 50) ---
    // Walls: rows 0-4, 15-17
    if (water < 50) {
      ctx.save();
      ctx.globalAlpha = water < 25 ? 0.4 : 0.2;
      ctx.fillStyle = PALETTE.DARK_GREEN;
      const wallRows = [1, 2, 3, 15, 16];
      for (const wr of wallRows) {
        const count = water < 25 ? 6 : 3;
        for (let i = 0; i < count; i++) {
          const ax = Math.floor(_hash(i, wr, 80) * (28 * TILE)) + TILE;
          const ay = wr * TILE + Math.floor(_hash(i, wr, 81) * TILE);
          ctx.fillRect(ax, ay, 4, 3);
        }
      }
      ctx.restore();
    }

    // --- Sewage color in pipes (water < 25) ---
    // Pipes at rows 6, 13
    if (water < 25) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#4a5a20'; // brownish-green sewage
      ctx.fillRect(0, 6 * TILE + 4, W, 8);
      ctx.fillRect(0, 13 * TILE + 4, W, 8);
      ctx.restore();
    }
  }

  /* ================================================================ */
  /*  LUXURY ZONE                                                      */
  /* ================================================================ */

  _luxury(ctx, health, now, renderer) {
    const water = health.water ?? 100;
    const air   = health.air ?? 100;
    const hvac  = health.hvac ?? 100;

    // --- Foggy windows (HVAC < 50) ---
    // Windows: cols 10-19, rows 4-7
    if (hvac < 50) {
      ctx.save();
      const fogAlpha = 0.1 + (50 - hvac) * 0.006;
      ctx.globalAlpha = Math.min(0.4, fogAlpha);
      ctx.fillStyle = PALETTE.WHITE;
      ctx.fillRect(10 * TILE, 4 * TILE, 10 * TILE, 4 * TILE);
      ctx.restore();
    }

    // --- Water stains near fixtures (water < 50) ---
    // Bar / service areas at cols 2-5, 23-26, rows 12-13
    if (water < 50) {
      ctx.save();
      ctx.globalAlpha = water < 25 ? 0.35 : 0.18;
      for (const startCol of [2, 23]) {
        for (let i = 0; i < 4; i++) {
          const sx = startCol * TILE + Math.floor(_hash(i, startCol, 90) * (4 * TILE));
          const sy = 11 * TILE + Math.floor(_hash(i, startCol, 91) * (3 * TILE));
          // Drip mark: thin vertical line
          ctx.fillStyle = '#8a7a5a';
          ctx.fillRect(sx, sy, 1, 4 + Math.floor(_hash(i, startCol, 92) * 6));
        }
      }
      ctx.restore();
    }

    // --- Slight haze (air < 50) ---
    if (air < 50) {
      ctx.save();
      ctx.globalAlpha = air < 25 ? 0.12 : 0.06;
      ctx.fillStyle = PALETTE.LIGHT_GRAY;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // --- Mold spots on ceiling corners (HVAC < 25) ---
    if (hvac < 25) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = PALETTE.DARK_GREEN;
      // Ceiling corners: top-left and top-right of each suite section
      const corners = [
        [1 * TILE, 4 * TILE], [8 * TILE, 4 * TILE],
        [21 * TILE, 4 * TILE], [28 * TILE, 4 * TILE],
        [1 * TILE, 4 * TILE + 2], [28 * TILE, 4 * TILE + 2],
      ];
      for (const [mx, my] of corners) {
        for (let i = 0; i < 4; i++) {
          const dx = Math.floor(_hash(mx + i, my, 95) * 8);
          const dy = Math.floor(_hash(mx + i, my, 96) * 6);
          ctx.fillRect(mx + dx, my + dy, 2, 2);
        }
      }
      ctx.restore();
    } else if (hvac < 50) {
      // Fewer mold spots
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = PALETTE.DARK_GREEN;
      const corners = [[1 * TILE, 4 * TILE], [28 * TILE, 4 * TILE]];
      for (const [mx, my] of corners) {
        for (let i = 0; i < 2; i++) {
          const dx = Math.floor(_hash(mx + i, my, 95) * 6);
          const dy = Math.floor(_hash(mx + i, my, 96) * 4);
          ctx.fillRect(mx + dx, my + dy, 2, 2);
        }
      }
      ctx.restore();
    }
  }

  /* ================================================================ */
  /*  PRESS BOX ZONE                                                   */
  /* ================================================================ */

  _pressbox(ctx, health, now, renderer) {
    const air  = health.air ?? 100;
    const hvac = health.hvac ?? 100;

    // --- Server rack LEDs turn amber/red (HVAC < 50) ---
    // Equipment/desks at cols 1-5,8-12,15-19,22-26 rows 10-11
    // Broadcast equipment at cols 2-5, rows 13-14
    if (hvac < 50) {
      ctx.save();
      const ledColor = hvac < 25 ? PALETTE.RED : PALETTE.ORANGE;
      const blink = hvac < 25 ? Math.sin(now * 5) * 0.2 : 0;
      ctx.globalAlpha = 0.7 + blink;
      // LEDs on equipment rows
      for (const startCol of [1, 8, 15, 22]) {
        const lx = startCol * TILE + 6;
        const ly = 10 * TILE + 2;
        ctx.fillStyle = ledColor;
        ctx.fillRect(lx, ly, 2, 2);
        ctx.fillRect(lx + 12, ly, 2, 2);
      }
      // Broadcast equipment LEDs
      for (let c = 2; c <= 5; c++) {
        ctx.fillStyle = ledColor;
        ctx.fillRect(c * TILE + 4, 13 * TILE + 3, 2, 2);
      }
      ctx.restore();
    }

    // --- Overheat glow behind server racks (HVAC < 25) ---
    if (hvac < 25) {
      ctx.save();
      const pulse = 0.08 + Math.sin(now * 3) * 0.04;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = PALETTE.RED;
      // Glow behind equipment blocks
      for (const startCol of [1, 8, 15, 22]) {
        ctx.fillRect(startCol * TILE, 10 * TILE - 2, 5 * TILE, 2 * TILE + 4);
      }
      // Broadcast equipment glow
      ctx.fillRect(2 * TILE, 13 * TILE - 2, 4 * TILE, 2 * TILE + 4);
      ctx.restore();
    }

    // --- Screen static lines (air < 50) ---
    // Windows showing field: cols 5-24, rows 3-6 (these are the monitors/screens)
    if (air < 50) {
      ctx.save();
      const lineCount = air < 25 ? 6 : 3;
      ctx.globalAlpha = air < 25 ? 0.2 : 0.1;
      ctx.fillStyle = PALETTE.WHITE;
      for (let i = 0; i < lineCount; i++) {
        // Animated horizontal scan lines moving downward
        const scanY = 3 * TILE + ((now * 40 + i * 17) % (4 * TILE));
        const scanX = 5 * TILE + Math.floor(_hash(i, Math.floor(now * 2), 100) * 8);
        const scanW = 10 * TILE + Math.floor(_hash(i, Math.floor(now * 2), 101) * (10 * TILE));
        ctx.fillRect(scanX, scanY, Math.min(scanW, 24 * TILE - scanX + 5 * TILE), 1);
      }
      ctx.restore();
    }
  }
}
