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
    // Use zone-specific health if available, fall back to global aggregate
    const health = state.zoneDomainHealth?.[zoneId] ?? state.domainHealth ?? { air: 100, water: 100, hvac: 100, drainage: 100, electrical: 100, pest: 100 };
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

    // --- Stadium light flicker / scoreboard dark (electrical) ---
    const elecF = health.electrical ?? 100;
    if (elecF < 50) {
      ctx.save();
      if (elecF < 25) {
        // Critical: scoreboard goes dark — black rect over scoreboard area (cols 11-19, rows 1-3)
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = PALETTE.BLACK;
        ctx.fillRect(11 * TILE, 1 * TILE, 9 * TILE, 3 * TILE);
        // Jumbotron dims (cols 8-22, rows 0-1)
        ctx.globalAlpha = 0.5;
        ctx.fillRect(8 * TILE, 0, 15 * TILE, 1 * TILE);
        // Stadium lights still flicker at critical
        const lightPositions = [
          [2 * TILE, 2 * TILE], [6 * TILE, 1 * TILE],
          [24 * TILE, 1 * TILE], [27 * TILE, 2 * TILE],
        ];
        for (const [lx, ly] of lightPositions) {
          const flicker = Math.sin(now * 6.5 + lx * 0.3) > 0.1 ? 0 : 0.6;
          ctx.globalAlpha = flicker;
          ctx.fillStyle = PALETTE.BLACK;
          ctx.fillRect(lx, ly, 2 * TILE, 2 * TILE);
        }
      } else {
        // Warning: stadium lights flicker — intermittent dark patches at light positions
        const lightPositions = [
          [2 * TILE, 2 * TILE], [6 * TILE, 1 * TILE],
          [11 * TILE, 0], [18 * TILE, 0],
          [24 * TILE, 1 * TILE], [27 * TILE, 2 * TILE],
        ];
        for (const [lx, ly] of lightPositions) {
          // Each light has its own sine phase for independent flicker
          const on = Math.sin(now * 4.0 + lx * 0.2 + ly * 0.5) > -0.3;
          if (!on) {
            const alpha = Math.min(0.4, (50 - elecF) / 50);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = PALETTE.BLACK;
            ctx.fillRect(lx, ly, 2 * TILE, 2 * TILE);
          }
        }
      }
      ctx.restore();
    }

    // --- Pest infestation ---
    const pestF = health.pest ?? 100;

    // Warning (<50%): Small dark spots scattered across outfield (droppings)
    if (pestF < 50) {
      ctx.save();
      const droppingAlpha = Math.min(0.4, (50 - pestF) / 50);
      ctx.globalAlpha = droppingAlpha;
      const droppingCount = pestF < 25 ? 16 : 8;
      for (let i = 0; i < droppingCount; i++) {
        const dx = 4 * TILE + Math.floor(_hash(i, 500, 1) * (22 * TILE));
        const dy = 12 * TILE + Math.floor(_hash(i, 500, 2) * TILE);
        ctx.fillStyle = _hash(i, 500, 3) > 0.5 ? '#3a2510' : '#2a1a0a';
        ctx.fillRect(dx, dy, 1, 1);
      }
      ctx.restore();
    }

    // Critical (<25%): Pest trails — short dark lines in grass,
    // disturbed dirt patches near dugouts
    if (pestF < 25) {
      ctx.save();
      const trailAlpha = Math.min(0.35, (25 - pestF) / 25);
      ctx.globalAlpha = trailAlpha;
      // Pest trails in outfield grass
      for (let i = 0; i < 6; i++) {
        const tx = 5 * TILE + Math.floor(_hash(i, 510, 1) * (20 * TILE));
        const ty = 12 * TILE + Math.floor(_hash(i, 510, 2) * 12);
        ctx.fillStyle = '#2a1a0a';
        const len = 3 + Math.floor(_hash(i, 510, 3) * 4);
        const horiz = _hash(i, 510, 4) > 0.5;
        if (horiz) {
          ctx.fillRect(tx, ty, len, 1);
        } else {
          ctx.fillRect(tx, ty, 1, len);
        }
      }
      // Disturbed dirt patches near dugouts (cols 3-4 and 26-27)
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 4; i++) {
        const side = _hash(i, 515, 1) > 0.5;
        const baseX = side ? 26 * TILE : 3 * TILE;
        const px = baseX + Math.floor(_hash(i, 515, 2) * (2 * TILE));
        const py = 11 * TILE + Math.floor(_hash(i, 515, 3) * TILE);
        ctx.fillStyle = PALETTE.DIRT;
        ctx.fillRect(px, py, 4, 3);
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

    // --- Ceiling light flicker / emergency lighting (electrical) ---
    const elecC = health.electrical ?? 100;
    if (elecC < 50) {
      ctx.save();
      if (elecC < 25) {
        // Critical: emergency lighting — red-tinted dim overlay
        const pulse = 0.12 + Math.sin(now * 1.5) * 0.03;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = PALETTE.RED;
        ctx.fillRect(0, 0, W, H);
        // Dark overlay for general dimness
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = PALETTE.BLACK;
        ctx.fillRect(0, 0, W, H);
        // Exit sign glow spots at corridor ends
        const exitPositions = [
          [1 * TILE, 4 * TILE], [28 * TILE, 4 * TILE],
          [14 * TILE, 4 * TILE],
        ];
        for (const [ex, ey] of exitPositions) {
          ctx.globalAlpha = 0.5 + Math.sin(now * 2 + ex) * 0.1;
          ctx.fillStyle = PALETTE.RED;
          ctx.fillRect(ex, ey, TILE, 6);
          // Glow halo around exit sign
          ctx.globalAlpha = 0.08;
          ctx.fillRect(ex - 4, ey - 2, TILE + 8, 10);
        }
      } else {
        // Warning: ceiling lights flicker — random lights dim with sine pulse
        const lightCols = [3, 7, 11, 15, 19, 23, 27];
        for (const col of lightCols) {
          const flickerPhase = Math.sin(now * 3.5 + col * 1.7);
          // Some lights are off at any given moment
          if (flickerPhase < 0) {
            const alpha = Math.min(0.25, (50 - elecC) / 50);
            ctx.globalAlpha = alpha * Math.abs(flickerPhase);
            ctx.fillStyle = PALETTE.BLACK;
            ctx.fillRect(col * TILE, 4 * TILE, TILE, TILE);
          }
        }
      }
      ctx.restore();
    }

    // --- Pest infestation ---
    const pestC = health.pest ?? 100;

    // Warning (<50%): Grease trails near concession stands
    // Food areas: cols 5-20, rows 3-6
    if (pestC < 50) {
      ctx.save();
      const greaseAlpha = Math.min(0.3, (50 - pestC) / 50);
      ctx.globalAlpha = greaseAlpha;
      // Thin dark streaks on floor tiles near food areas
      const streakCount = pestC < 25 ? 10 : 5;
      for (let i = 0; i < streakCount; i++) {
        const sx = 5 * TILE + Math.floor(_hash(i, 520, 1) * (15 * TILE));
        const sy = 3 * TILE + Math.floor(_hash(i, 520, 2) * (3 * TILE));
        ctx.fillStyle = _hash(i, 520, 3) > 0.5 ? '#2a2010' : '#3a2a15';
        const len = 4 + Math.floor(_hash(i, 520, 4) * 6);
        ctx.fillRect(sx, sy, len, 1);
      }
      ctx.restore();
    }

    // Critical (<25%): Gnaw marks on food stand facades, scattered droppings
    if (pestC < 25) {
      ctx.save();
      const critAlpha = Math.min(0.4, (25 - pestC) / 25);
      // Gnaw marks — small dark notches on stand facades (cols 5-20, row 3)
      ctx.globalAlpha = critAlpha;
      for (let i = 0; i < 8; i++) {
        const gx = 5 * TILE + Math.floor(_hash(i, 525, 1) * (15 * TILE));
        const gy = 3 * TILE + Math.floor(_hash(i, 525, 2) * 4);
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(gx, gy, 2, 1);
        ctx.fillRect(gx + 1, gy + 1, 1, 1);
      }
      // Scattered droppings — tiny brown dots across concourse floor
      ctx.globalAlpha = critAlpha * 0.8;
      for (let i = 0; i < 14; i++) {
        const dx = TILE + Math.floor(_hash(i, 528, 1) * (28 * TILE));
        const dy = 4 * TILE + Math.floor(_hash(i, 528, 2) * (12 * TILE));
        ctx.fillStyle = _hash(i, 528, 3) > 0.5 ? '#3a2510' : '#2a1a0a';
        ctx.fillRect(dx, dy, 1, 1);
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

    // --- Sparking / arc flash at electrical panels (electrical) ---
    const elecM = health.electrical ?? 100;
    if (elecM < 50) {
      ctx.save();
      // Electrical panels at cols 8-10, rows 10-12
      const panelX = 8 * TILE;
      const panelY = 10 * TILE;
      const panelW = 3 * TILE;
      const panelH = 3 * TILE;

      if (elecM < 25) {
        // Critical: arc flash danger — bright white flash pulse with orange glow halo
        const flash = Math.sin(now * 8) > 0.6 ? 1 : 0;
        if (flash) {
          // Bright white flash at panel
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = PALETTE.WHITE;
          ctx.fillRect(panelX + 4, panelY + 4, panelW - 8, panelH - 8);
          // Orange glow halo around panels
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = PALETTE.ORANGE;
          ctx.fillRect(panelX - 8, panelY - 8, panelW + 16, panelH + 16);
        }
        // Persistent orange warning glow behind panel
        const glowPulse = 0.1 + Math.sin(now * 3) * 0.05;
        ctx.globalAlpha = glowPulse;
        ctx.fillStyle = PALETTE.ORANGE;
        ctx.fillRect(panelX - 4, panelY - 4, panelW + 8, panelH + 8);
        // Spark pixels flying from panel
        for (let s = 0; s < 4; s++) {
          const sparkPhase = (now * 5 + s * 1.3) % 2;
          if (sparkPhase < 0.5) {
            const sx = panelX + Math.floor(_hash(s, 11, 120) * panelW);
            const sy = panelY + Math.floor(_hash(s, 11, 121) * panelH);
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = _hash(s, 11, 122) > 0.5 ? PALETTE.YELLOW : PALETTE.WHITE;
            ctx.fillRect(sx, sy, 2, 1);
            ctx.fillRect(sx + 1, sy - 1, 1, 1);
          }
        }
      } else {
        // Warning: sparking at electrical panels — bright yellow/white pixel flashes
        for (let s = 0; s < 3; s++) {
          // Each spark has its own timing
          const sparkCycle = Math.sin(now * 6 + s * 2.5);
          if (sparkCycle > 0.5) {
            const sx = panelX + Math.floor(_hash(s, 10, 110) * panelW);
            const sy = panelY + Math.floor(_hash(s, 10, 111) * panelH);
            ctx.globalAlpha = 0.6 + (sparkCycle - 0.5) * 0.6;
            ctx.fillStyle = _hash(s, 10, 112) > 0.5 ? PALETTE.YELLOW : PALETTE.WHITE;
            ctx.fillRect(sx, sy, 2, 1);
            ctx.fillRect(sx, sy + 1, 1, 1);
          }
        }
      }
      ctx.restore();
    }

    // --- Pest infestation ---
    const pestM = health.pest ?? 100;

    // Warning (<50%): Nesting material near warm equipment (cols 12-16, rows 8-12)
    if (pestM < 50) {
      ctx.save();
      const nestAlpha = Math.min(0.35, (50 - pestM) / 50);
      ctx.globalAlpha = nestAlpha;
      const clusterCount = pestM < 25 ? 8 : 4;
      for (let i = 0; i < clusterCount; i++) {
        const nx = 12 * TILE + Math.floor(_hash(i, 530, 1) * (4 * TILE));
        const ny = 8 * TILE + Math.floor(_hash(i, 530, 2) * (4 * TILE));
        // Brown/tan clusters (nesting material)
        ctx.fillStyle = _hash(i, 530, 3) > 0.5 ? '#8a7040' : '#6a5530';
        ctx.fillRect(nx, ny, 3, 2);
        ctx.fillRect(nx + 1, ny + 1, 2, 1);
      }
      ctx.restore();
    }

    // Critical (<25%): Chewed wiring — exposed copper near cable trays with spark flash
    if (pestM < 25) {
      ctx.save();
      const wireAlpha = Math.min(0.45, (25 - pestM) / 25);
      // Chewed wires near cable tray rows (rows 1-2, 10)
      const cableRows = [1, 2, 10];
      for (const cr of cableRows) {
        for (let i = 0; i < 3; i++) {
          const wx = Math.floor(_hash(i, cr, 535) * (26 * TILE)) + 2 * TILE;
          const wy = cr * TILE + Math.floor(_hash(i, cr, 536) * 10);
          // Exposed copper wire pixels
          ctx.globalAlpha = wireAlpha;
          ctx.fillStyle = PALETTE.COPPER;
          ctx.fillRect(wx, wy, 3, 1);
          ctx.fillRect(wx + 1, wy + 1, 2, 1);
          // Occasional spark flash
          const sparkOn = Math.sin(now * 7 + wx * 0.3 + cr) > 0.7;
          if (sparkOn) {
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = PALETTE.YELLOW;
            ctx.fillRect(wx + 2, wy - 1, 1, 1);
            ctx.fillRect(wx + 3, wy, 1, 1);
          }
        }
      }
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

    // --- Dim tunnel / near-blackout (electrical) ---
    const elecU = health.electrical ?? 100;
    if (elecU < 50) {
      ctx.save();
      if (elecU < 25) {
        // Critical: near-blackout — heavy dark overlay with emergency light spots
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = PALETTE.BLACK;
        ctx.fillRect(0, 0, W, H);
        // Small emergency light spots at intervals along tunnel
        const emergencyLights = [
          [3 * TILE, 5 * TILE], [10 * TILE, 5 * TILE],
          [17 * TILE, 5 * TILE], [24 * TILE, 5 * TILE],
          [3 * TILE, 14 * TILE], [24 * TILE, 14 * TILE],
        ];
        for (const [lx, ly] of emergencyLights) {
          const glow = 0.3 + Math.sin(now * 1.8 + lx * 0.2) * 0.08;
          // Small amber/yellow light spot
          ctx.globalAlpha = glow;
          ctx.fillStyle = PALETTE.ORANGE;
          ctx.fillRect(lx, ly, 3, 3);
          // Dim glow halo
          ctx.globalAlpha = glow * 0.2;
          ctx.fillRect(lx - 4, ly - 4, 11, 11);
        }
      } else {
        // Warning: dim tunnel lighting — general opacity overlay darkens the zone
        const dimAlpha = Math.min(0.3, (50 - elecU) / 50 * 0.5);
        ctx.globalAlpha = dimAlpha;
        ctx.fillStyle = PALETTE.BLACK;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    // --- Pest infestation ---
    const pestU = health.pest ?? 100;

    // Warning (<50%): Scratch marks on tunnel walls
    if (pestU < 50) {
      ctx.save();
      const scratchAlpha = Math.min(0.35, (50 - pestU) / 50);
      ctx.globalAlpha = scratchAlpha;
      // Short diagonal scratch lines on walls (rows 1-4, 15-17)
      const scratchWalls = [1, 2, 3, 4, 15, 16, 17];
      const scratchCount = pestU < 25 ? 5 : 3;
      for (const wr of scratchWalls) {
        for (let i = 0; i < scratchCount; i++) {
          const sx = Math.floor(_hash(i, wr, 540) * (28 * TILE)) + TILE;
          const sy = wr * TILE + Math.floor(_hash(i, wr, 541) * TILE);
          ctx.fillStyle = '#4a4a3a';
          // Diagonal scratch: 3-4px line going down-right
          const len = 2 + Math.floor(_hash(i, wr, 542) * 3);
          for (let s = 0; s < len; s++) {
            ctx.fillRect(sx + s, sy + s, 1, 1);
          }
        }
      }
      ctx.restore();
    }

    // Critical (<25%): Heavy infestation — droppings, grimy walls,
    // animated scurrying dots
    if (pestU < 25) {
      ctx.save();
      const heavyAlpha = Math.min(0.4, (25 - pestU) / 25);

      // Droppings scattered along tunnel floor (rows 13-14)
      ctx.globalAlpha = heavyAlpha;
      for (let i = 0; i < 12; i++) {
        const dx = TILE + Math.floor(_hash(i, 545, 1) * (28 * TILE));
        const dy = 13 * TILE + Math.floor(_hash(i, 545, 2) * (2 * TILE));
        ctx.fillStyle = _hash(i, 545, 3) > 0.5 ? '#2a1a0a' : '#3a2510';
        ctx.fillRect(dx, dy, 1, 1);
      }

      // Tunnel walls discolored with grime (brownish overlay on wall rows)
      ctx.globalAlpha = heavyAlpha * 0.5;
      ctx.fillStyle = '#3a3020';
      for (const wr of [1, 2, 3, 15, 16]) {
        ctx.fillRect(TILE, wr * TILE, 28 * TILE, TILE);
      }

      // Animated scurrying dots (1-2px dark dots that move)
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#1a1008';
      for (let i = 0; i < 4; i++) {
        // Each dot follows a path using sine-based motion
        const baseX = Math.floor(_hash(i, 550, 1) * (26 * TILE)) + 2 * TILE;
        const baseY = 5 * TILE + Math.floor(_hash(i, 550, 2) * (9 * TILE));
        const speed = 1.5 + _hash(i, 550, 3) * 2;
        const range = 12 + Math.floor(_hash(i, 550, 4) * 20);
        const moveX = Math.sin(now * speed + i * 3.7) * range;
        const moveY = Math.cos(now * speed * 0.7 + i * 2.3) * 3;
        ctx.fillRect(baseX + moveX, baseY + moveY, 2, 1);
        ctx.fillRect(baseX + moveX + 1, baseY + moveY + 1, 1, 1);
      }
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

    // --- Flickering suite lighting / entertainment off (electrical) ---
    const elecL = health.electrical ?? 100;
    if (elecL < 50) {
      ctx.save();
      if (elecL < 25) {
        // Critical: TV/entertainment systems off — dark patches where screens are
        // Suite TV positions (cols 3-4, 14-16, 25-26, rows 8-9)
        const screenPositions = [
          [3 * TILE, 8 * TILE, 2 * TILE, 2 * TILE],
          [14 * TILE, 8 * TILE, 3 * TILE, 2 * TILE],
          [25 * TILE, 8 * TILE, 2 * TILE, 2 * TILE],
        ];
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = PALETTE.BLACK;
        for (const [sx, sy, sw, sh] of screenPositions) {
          ctx.fillRect(sx, sy, sw, sh);
        }
        // General dimming of suite
        ctx.globalAlpha = 0.15;
        ctx.fillRect(0, 0, W, H);
        // Dead indicator lights on entertainment systems
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = PALETTE.DARK_GRAY;
        for (const [sx, sy] of screenPositions) {
          ctx.fillRect(sx + 2, sy + 1, 2, 1);
        }
      } else {
        // Warning: flickering suite lighting — subtle brightness variation overlay
        const flickerBase = Math.sin(now * 2.5);
        const flickerFast = Math.sin(now * 7.3);
        // Combine slow and fast flicker for natural effect
        const brightness = flickerBase * 0.3 + flickerFast * 0.15;
        if (brightness < 0) {
          const alpha = Math.min(0.12, Math.abs(brightness) * (50 - elecL) / 50 * 0.3);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = PALETTE.BLACK;
          ctx.fillRect(0, 0, W, H);
        }
      }
      ctx.restore();
    }

    // --- Pest infestation ---
    const pestL = health.pest ?? 100;

    // Warning (<50%): Subtle signs — droppings near bar area
    // Bar areas at cols 2-5, 23-26, rows 12-13
    if (pestL < 50) {
      ctx.save();
      const subtleAlpha = Math.min(0.3, (50 - pestL) / 50);
      ctx.globalAlpha = subtleAlpha;
      // A couple droppings near bar area
      const barCols = [2, 23];
      for (const bc of barCols) {
        for (let i = 0; i < 3; i++) {
          const dx = bc * TILE + Math.floor(_hash(i, bc + 555, 1) * (4 * TILE));
          const dy = 12 * TILE + Math.floor(_hash(i, bc + 555, 2) * (2 * TILE));
          ctx.fillStyle = _hash(i, bc + 555, 3) > 0.5 ? '#3a2510' : '#2a1a0a';
          ctx.fillRect(dx, dy, 1, 1);
        }
      }
      ctx.restore();
    }

    // Critical (<25%): Visible contamination — more droppings, dark stains,
    // food service indicators
    if (pestL < 25) {
      ctx.save();
      const contAlpha = Math.min(0.4, (25 - pestL) / 25);

      // More droppings spread across suite floor (rows 9-14)
      ctx.globalAlpha = contAlpha;
      for (let i = 0; i < 10; i++) {
        const dx = TILE + Math.floor(_hash(i, 560, 1) * (28 * TILE));
        const dy = 9 * TILE + Math.floor(_hash(i, 560, 2) * (5 * TILE));
        ctx.fillStyle = _hash(i, 560, 3) > 0.5 ? '#3a2510' : '#2a1a0a';
        ctx.fillRect(dx, dy, 1, 1);
      }

      // Dark stains on carpet areas (rows 9-14, brownish discoloration)
      ctx.globalAlpha = contAlpha * 0.4;
      ctx.fillStyle = '#3a3020';
      for (let i = 0; i < 5; i++) {
        const sx = 2 * TILE + Math.floor(_hash(i, 563, 1) * (26 * TILE));
        const sy = 9 * TILE + Math.floor(_hash(i, 563, 2) * (5 * TILE));
        ctx.fillRect(sx, sy, 5, 3);
      }

      // Food service shut down indicator — red X on bar areas
      ctx.globalAlpha = 0.6;
      for (const bc of [2, 23]) {
        const bx = bc * TILE + 8;
        const by = 12 * TILE + 4;
        ctx.fillStyle = PALETTE.RED;
        // Draw small X
        for (let d = 0; d < 5; d++) {
          ctx.fillRect(bx + d, by + d, 1, 1);
          ctx.fillRect(bx + 4 - d, by + d, 1, 1);
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

    // --- Monitor flicker / broadcast equipment dark (electrical) ---
    const elecP = health.electrical ?? 100;
    if (elecP < 50) {
      ctx.save();
      // Monitor/screen areas: cols 5-24, rows 3-6
      const monitorX = 5 * TILE;
      const monitorY = 3 * TILE;
      const monitorW = 20 * TILE;
      const monitorH = 4 * TILE;

      if (elecP < 25) {
        // Critical: monitors go black, status LEDs red
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = PALETTE.BLACK;
        ctx.fillRect(monitorX, monitorY, monitorW, monitorH);
        // Broadcast equipment dark (cols 2-5, rows 13-14)
        ctx.fillRect(2 * TILE, 13 * TILE, 4 * TILE, 2 * TILE);
        // Red status LEDs on dead monitors
        const ledBlink = Math.sin(now * 2) > 0 ? 0.8 : 0.3;
        ctx.globalAlpha = ledBlink;
        ctx.fillStyle = PALETTE.RED;
        // LED on each monitor section
        for (let c = 6; c <= 22; c += 4) {
          ctx.fillRect(c * TILE, monitorY + monitorH - 3, 2, 2);
        }
        // LEDs on broadcast equipment
        for (let c = 2; c <= 5; c++) {
          ctx.fillRect(c * TILE + 4, 13 * TILE + 2, 2, 2);
        }
      } else {
        // Warning: monitor flicker — scan lines and intermittent static
        const scanLineCount = 4;
        ctx.fillStyle = PALETTE.WHITE;
        for (let i = 0; i < scanLineCount; i++) {
          // Animated scan lines moving downward through monitor area
          const scanY = monitorY + ((now * 30 + i * 13) % monitorH);
          const scanPhase = Math.sin(now * 5 + i * 3.1);
          if (scanPhase > 0) {
            ctx.globalAlpha = 0.08 + scanPhase * 0.06;
            const scanX = monitorX + Math.floor(_hash(i, Math.floor(now * 3), 130) * 4);
            ctx.fillRect(scanX, scanY, monitorW - 8, 1);
          }
        }
        // Intermittent static blocks on monitors
        for (let s = 0; s < 6; s++) {
          const staticPhase = Math.sin(now * 8 + s * 2.7);
          if (staticPhase > 0.7) {
            const sx = monitorX + Math.floor(_hash(s, Math.floor(now * 4), 135) * (monitorW - 8));
            const sy = monitorY + Math.floor(_hash(s, Math.floor(now * 4), 136) * (monitorH - 4));
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = _hash(s, Math.floor(now * 4), 137) > 0.5 ? PALETTE.WHITE : PALETTE.LIGHT_GRAY;
            ctx.fillRect(sx, sy, 4, 3);
          }
        }
      }
      ctx.restore();
    }

    // --- Pest infestation ---
    const pestP = health.pest ?? 100;

    // Warning (<50%): Chewed cables — small breaks in cable tray lines
    // Cable trays run along rows 8-9 across equipment blocks
    if (pestP < 50) {
      ctx.save();
      const chewAlpha = Math.min(0.4, (50 - pestP) / 50);
      ctx.globalAlpha = chewAlpha;
      const breakCount = pestP < 25 ? 8 : 4;
      for (let i = 0; i < breakCount; i++) {
        const bx = 2 * TILE + Math.floor(_hash(i, 570, 1) * (24 * TILE));
        const by = 8 * TILE + Math.floor(_hash(i, 570, 2) * (2 * TILE));
        // Dark gap in cable (break)
        ctx.fillStyle = PALETTE.BLACK;
        ctx.fillRect(bx, by, 2, 1);
        // Exposed copper at edges of break
        ctx.fillStyle = PALETTE.COPPER;
        ctx.fillRect(bx - 1, by, 1, 1);
        ctx.fillRect(bx + 2, by, 1, 1);
      }
      ctx.restore();
    }

    // Critical (<25%): Equipment damage — dark spots on surfaces,
    // nest material near server racks
    if (pestP < 25) {
      ctx.save();
      const dmgAlpha = Math.min(0.4, (25 - pestP) / 25);

      // Dark spots on equipment surfaces (rows 10-11)
      ctx.globalAlpha = dmgAlpha;
      for (const startCol of [1, 8, 15, 22]) {
        for (let i = 0; i < 3; i++) {
          const sx = startCol * TILE + Math.floor(_hash(i, startCol + 575, 1) * (5 * TILE));
          const sy = 10 * TILE + Math.floor(_hash(i, startCol + 575, 2) * (2 * TILE));
          ctx.fillStyle = '#1a1008';
          ctx.fillRect(sx, sy, 2, 2);
        }
      }

      // Nest material near server racks (small brown/tan clusters)
      ctx.globalAlpha = dmgAlpha * 0.8;
      for (let i = 0; i < 5; i++) {
        const nx = Math.floor(_hash(i, 580, 1) * (26 * TILE)) + 2 * TILE;
        const ny = 11 * TILE + Math.floor(_hash(i, 580, 2) * TILE);
        ctx.fillStyle = _hash(i, 580, 3) > 0.5 ? '#8a7040' : '#6a5530';
        ctx.fillRect(nx, ny, 3, 2);
        ctx.fillRect(nx + 1, ny + 1, 2, 1);
      }

      // Droppings near broadcast equipment (rows 13-14)
      ctx.globalAlpha = dmgAlpha;
      for (let i = 0; i < 4; i++) {
        const dx = 2 * TILE + Math.floor(_hash(i, 583, 1) * (4 * TILE));
        const dy = 13 * TILE + Math.floor(_hash(i, 583, 2) * (2 * TILE));
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(dx, dy, 1, 1);
      }
      ctx.restore();
    }
  }
}
