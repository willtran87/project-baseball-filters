/**
 * Pixel-data sprite definitions.
 *
 * Each sprite is a 2D array of palette color strings (or null for transparent).
 * These are drawn pixel-by-pixel by CanvasRenderer.drawPixelSprite().
 *
 * Imports the comprehensive sprite library from sprites.js and flattens it
 * into a flat map for SpriteSystem registration. Also includes legacy
 * filter_basic / filter_carbon / etc. aliases for backwards compatibility.
 */

import { P } from './palette.js';
import { SPRITES, flattenSprites } from './sprites.js';
import { NPC_PORTRAITS, NPC_MINI_PORTRAITS } from './npcSprites.js';
import { EQUIPMENT_SPRITES_32 } from './equipmentSprites32.js';
import { TILE_VARIANTS } from './tileVariants.js';

// Re-export for convenient access by other systems
export { NPC_PORTRAITS, NPC_MINI_PORTRAITS };
export { EQUIPMENT_SPRITES_32 };
export { TILE_VARIANTS };

// ── Filter Sprites (16x16) ────────────────────────────────────────

export const filter_basic = [
  [P._,  P._,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P._,  P._],
  [P._,  P.GY, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.GY, P._],
  [P.GY, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.LG, P.GY],
  [P.GY, P.LG, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.GY],
  [P.GY, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.LG, P.GY],
  [P.GY, P.LG, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.GY],
  [P.GY, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.LG, P.GY],
  [P.GY, P.LG, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.GY],
  [P.GY, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.LG, P.GY],
  [P.GY, P.LG, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.GY],
  [P.GY, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.LG, P.GY],
  [P.GY, P.LG, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.GY],
  [P.GY, P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.W,  P.LG, P.LG, P.GY],
  [P._,  P.GY, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.LG, P.GY, P._],
  [P._,  P._,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P._,  P._],
  [P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._],
];

export const filter_carbon = [
  [P._,  P._,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P._,  P._],
  [P._,  P.GY, P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.GY, P._],
  [P.GY, P.K,  P.GY, P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.GY, P.K,  P.K,  P.GY],
  [P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.GY, P.K,  P.GY],
  [P.GY, P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY],
  [P.GY, P.K,  P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.K,  P.GY, P.GY],
  [P.GY, P.K,  P.GY, P.K,  P.K,  P.K,  P.GY, P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.GY, P.K,  P.GY],
  [P.GY, P.K,  P.K,  P.GY, P.K,  P.GY, P.K,  P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY],
  [P.GY, P.K,  P.GY, P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.GY],
  [P.GY, P.K,  P.K,  P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.GY],
  [P.GY, P.K,  P.GY, P.K,  P.GY, P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY],
  [P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.K,  P.GY, P.K,  P.K,  P.K,  P.GY, P.K,  P.GY, P.K,  P.GY],
  [P.GY, P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.K,  P.GY, P.K,  P.GY, P.K,  P.K,  P.K,  P.GY, P.GY],
  [P._,  P.GY, P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.K,  P.GY, P._],
  [P._,  P._,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P._,  P._],
  [P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._],
];

export const filter_hepa = [
  [P._,  P._,  P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P._,  P._],
  [P._,  P.ST, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.ST, P._],
  [P.ST, P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.SL, P.ST],
  [P.ST, P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.SL, P.ST],
  [P.ST, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.ST],
  [P.ST, P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.SL, P.ST],
  [P.ST, P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.SL, P.ST],
  [P.ST, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.ST],
  [P.ST, P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.SL, P.ST],
  [P.ST, P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.SL, P.ST],
  [P.ST, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.ST],
  [P.ST, P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.SL, P.ST],
  [P.ST, P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.W,  P.W,  P.SL, P.SL, P.ST],
  [P._,  P.ST, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.SL, P.ST, P._],
  [P._,  P._,  P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P.ST, P._,  P._],
  [P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._],
];

export const filter_electrostatic = [
  [P._,  P._,  P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P._,  P._],
  [P._,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.DB, P._],
  [P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.B,  P.DB],
  [P.DB, P.DB, P.B,  P.DB, P.B,  P.DB, P.Y,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.DB, P.DB],
  [P.DB, P.B,  P.DB, P.B,  P.DB, P.Y,  P.Y,  P.Y,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.B,  P.DB],
  [P.DB, P.DB, P.B,  P.DB, P.Y,  P.DB, P.Y,  P.DB, P.Y,  P.DB, P.B,  P.DB, P.B,  P.DB, P.DB, P.DB],
  [P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.Y,  P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.B,  P.DB],
  [P.DB, P.DB, P.B,  P.DB, P.B,  P.DB, P.Y,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.DB, P.DB],
  [P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.Y,  P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.B,  P.DB],
  [P.DB, P.DB, P.B,  P.DB, P.B,  P.Y,  P.DB, P.Y,  P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.DB, P.DB],
  [P.DB, P.B,  P.DB, P.B,  P.DB, P.DB, P.Y,  P.DB, P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.B,  P.DB],
  [P.DB, P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.DB, P.DB],
  [P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.B,  P.DB],
  [P._,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.B,  P.DB, P.DB, P._],
  [P._,  P._,  P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P.DB, P._,  P._],
  [P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._],
];

// Broken filter overlay — cracked, red-tinted
export const filter_broken = [
  [P._,  P._,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P._,  P._],
  [P._,  P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P._],
  [P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.R,  P.R,  P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P.GY, P.GY],
  [P._,  P.GY, P.R,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.R,  P.GY, P._],
  [P._,  P._,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P._,  P._],
  [P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._],
];

// Warning filter overlay — orange tinted with dust/debris particles
export const filter_warning = [
  [P._,  P._,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P._,  P._],
  [P._,  P.GY, P.O,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.O,  P.GY, P._],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.BR, P.GY, P.GY, P.GY, P.GY, P.BR, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.O,  P.O,  P.O,  P.O,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.BR, P.GY, P.GY, P.GY, P.O,  P.GY, P.GY, P.O,  P.GY, P.GY, P.GY, P.BR, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.O,  P.GY, P.GY, P.O,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.O,  P.GY, P.GY, P.O,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.BR, P.GY, P.GY, P.O,  P.GY, P.GY, P.O,  P.GY, P.GY, P.BR, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.O,  P.GY, P.GY, P.O,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.O,  P.O,  P.O,  P.O,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.BR, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.BR, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.O,  P.O,  P.O,  P.O,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY],
  [P.GY, P.GY, P.BR, P.GY, P.GY, P.GY, P.GY, P.O,  P.O,  P.GY, P.GY, P.GY, P.GY, P.BR, P.GY, P.GY],
  [P._,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P._],
  [P._,  P._,  P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P.GY, P._,  P._],
  [P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._],
];

// ── UI Icon Sprites (8x8) ────────────────────────────────────────

export const icon_money = [
  [P._,  P._,  P.Y,  P.Y,  P.Y,  P.Y,  P._,  P._],
  [P._,  P.Y,  P._,  P._,  P._,  P._,  P.Y,  P._],
  [P._,  P.Y,  P._,  P.Y,  P.Y,  P._,  P.Y,  P._],
  [P._,  P.Y,  P.Y,  P._,  P._,  P._,  P.Y,  P._],
  [P._,  P.Y,  P._,  P._,  P.Y,  P.Y,  P.Y,  P._],
  [P._,  P.Y,  P._,  P.Y,  P.Y,  P._,  P.Y,  P._],
  [P._,  P.Y,  P._,  P._,  P._,  P._,  P.Y,  P._],
  [P._,  P._,  P.Y,  P.Y,  P.Y,  P.Y,  P._,  P._],
];

export const icon_reputation = [
  [P._,  P._,  P._,  P.GO, P.GO, P._,  P._,  P._],
  [P._,  P._,  P.GO, P.GO, P.GO, P.GO, P._,  P._],
  [P._,  P.GO, P.GO, P.GO, P.GO, P.GO, P.GO, P._],
  [P._,  P.GO, P.GO, P.GO, P.GO, P.GO, P.GO, P._],
  [P._,  P._,  P.GO, P.GO, P.GO, P.GO, P._,  P._],
  [P._,  P._,  P._,  P.GO, P.GO, P._,  P._,  P._],
  [P._,  P._,  P._,  P._,  P.GO, P._,  P._,  P._],
  [P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._],
];

export const icon_wrench = [
  [P._,  P._,  P._,  P._,  P._,  P.LG, P.LG, P._],
  [P._,  P._,  P._,  P._,  P.LG, P.GY, P.LG, P._],
  [P._,  P._,  P._,  P.LG, P.GY, P.LG, P._,  P._],
  [P._,  P._,  P.LG, P.GY, P.LG, P._,  P._,  P._],
  [P.LG, P._,  P.LG, P.LG, P._,  P._,  P._,  P._],
  [P.LG, P.LG, P.LG, P._,  P._,  P._,  P._,  P._],
  [P._,  P.LG, P._,  P._,  P._,  P._,  P._,  P._],
  [P._,  P._,  P._,  P._,  P._,  P._,  P._,  P._],
];

export const icon_warning = [
  [P._,  P._,  P._,  P.R,  P.R,  P._,  P._,  P._],
  [P._,  P._,  P.R,  P.Y,  P.Y,  P.R,  P._,  P._],
  [P._,  P._,  P.R,  P.Y,  P.Y,  P.R,  P._,  P._],
  [P._,  P.R,  P.Y,  P.R,  P.R,  P.Y,  P.R,  P._],
  [P._,  P.R,  P.Y,  P.R,  P.R,  P.Y,  P.R,  P._],
  [P.R,  P.Y,  P.Y,  P.Y,  P.Y,  P.Y,  P.Y,  P.R],
  [P.R,  P.Y,  P.Y,  P.R,  P.R,  P.Y,  P.Y,  P.R],
  [P._,  P.R,  P.R,  P.R,  P.R,  P.R,  P.R,  P._],
];

// ── All sprites bundled for easy registration ─────────────────────

// Flatten the full sprite library from sprites.js into dot-path keys
// e.g. 'equipment.airFilter.good', 'stadium.walls.concrete', 'ui.currency', etc.
const _flatSprites = flattenSprites(SPRITES);

export const PIXEL_SPRITES = {
  // Full sprite library (dot-path keys)
  ..._flatSprites,

  // Base filter sprites (legacy names used by SpriteSystem.render)
  filter_basic,
  filter_carbon,
  filter_hepa,
  filter_electrostatic,
  filter_broken,
  filter_warning,

  // Domain-based aliases for the new filtrationSystems config
  // Each domain uses a filter type that matches its coloring:
  //   air = HEPA (gray/steel tint), water = carbon (blue-black tint),
  //   hvac = electrostatic (orange/yellow tint), drainage = basic (green tint)
  filter_air: filter_hepa,
  filter_water: filter_carbon,
  filter_hvac: filter_electrostatic,
  filter_drainage: filter_basic,
  filter_default: filter_basic,

  // Condition-aware filter aliases (used by updated SpriteSystem.render)
  filter_basic_good: _flatSprites['equipment.airFilter.good'],
  filter_basic_worn: _flatSprites['equipment.airFilter.worn'],
  filter_basic_broken: _flatSprites['equipment.airFilter.broken'],
  filter_carbon_good: _flatSprites['equipment.waterPump.good'],
  filter_carbon_worn: _flatSprites['equipment.waterPump.worn'],
  filter_carbon_broken: _flatSprites['equipment.waterPump.broken'],
  filter_hepa_good: _flatSprites['equipment.hvac.good'],
  filter_hepa_worn: _flatSprites['equipment.hvac.worn'],
  filter_hepa_broken: _flatSprites['equipment.hvac.broken'],
  filter_electrostatic_good: _flatSprites['equipment.drain.good'],
  filter_electrostatic_worn: _flatSprites['equipment.drain.worn'],
  filter_electrostatic_broken: _flatSprites['equipment.drain.broken'],

  // Pipe and duct sprites
  pipe_horizontal: _flatSprites['equipment.pipes.horizontal'],
  pipe_vertical: _flatSprites['equipment.pipes.vertical'],
  pipe_corner: _flatSprites['equipment.pipes.corner'],
  pipe_tee: _flatSprites['equipment.pipes.tee'],
  duct_horizontal: _flatSprites['equipment.ducts.horizontal'],
  duct_vertical: _flatSprites['equipment.ducts.vertical'],
  duct_corner: _flatSprites['equipment.ducts.corner'],
  duct_tee: _flatSprites['equipment.ducts.tee'],

  // Tile sprites
  tile_wall: _flatSprites['stadium.walls.concrete'],
  tile_wall_steel: _flatSprites['stadium.walls.steel'],
  tile_wall_glass: _flatSprites['stadium.walls.glass'],
  tile_floor: _flatSprites['stadium.floors.concourse'],
  tile_field: _flatSprites['stadium.floors.field'],
  tile_utility: _flatSprites['stadium.floors.utility'],
  tile_seat_general: _flatSprites['stadium.seating.general'],
  tile_seat_premium: _flatSprites['stadium.seating.premium'],
  tile_seat_luxury: _flatSprites['stadium.seating.luxuryBox'],

  // Character sprites
  worker_idle: _flatSprites['characters.worker.idle'],
  worker_walk: _flatSprites['characters.worker.walk'],
  worker_repair: _flatSprites['characters.worker.repair'],
  inspector: _flatSprites['characters.inspector'],
  fan_happy: _flatSprites['characters.fan.happy'],
  fan_uncomfortable: _flatSprites['characters.fan.uncomfortable'],
  fan_angry: _flatSprites['characters.fan.angry'],

  // UI elements
  ui_currency: _flatSprites['ui.currency'],
  ui_status_green: _flatSprites['ui.status.green'],
  ui_status_yellow: _flatSprites['ui.status.yellow'],
  ui_status_red: _flatSprites['ui.status.red'],
  ui_button_normal: _flatSprites['ui.buttons.normal'],
  ui_button_hover: _flatSprites['ui.buttons.hover'],
  ui_button_pressed: _flatSprites['ui.buttons.pressed'],
  icon_air_filter: _flatSprites['ui.icons.airFilter'],
  icon_water_pump: _flatSprites['ui.icons.waterPump'],
  icon_hvac: _flatSprites['ui.icons.hvac'],
  icon_drain: _flatSprites['ui.icons.drain'],

  // UI icons (legacy names)
  icon_money,
  icon_reputation,
  icon_wrench,
  icon_warning,

  // ── NPC Portraits (64x64) ──
  portrait_maggie_neutral: NPC_PORTRAITS.maggie.neutral,
  portrait_maggie_serious: NPC_PORTRAITS.maggie.serious,
  portrait_maggie_happy: NPC_PORTRAITS.maggie.happy,
  portrait_maggie_disappointed: NPC_PORTRAITS.maggie.disappointed,
  portrait_maggie_angry: NPC_PORTRAITS.maggie.serious,           // alias: storyData 'angry' -> serious expression
  portrait_maggie_worried: NPC_PORTRAITS.maggie.disappointed,    // alias: storyData 'worried' -> disappointed expression

  portrait_rusty_skeptical: NPC_PORTRAITS.rusty.skeptical,
  portrait_rusty_neutral: NPC_PORTRAITS.rusty.neutral,
  portrait_rusty_happy: NPC_PORTRAITS.rusty.happy,
  portrait_rusty_sad: NPC_PORTRAITS.rusty.sad,
  portrait_rusty_grumpy: NPC_PORTRAITS.rusty.skeptical,          // alias: storyData 'grumpy' -> skeptical expression
  portrait_rusty_worried: NPC_PORTRAITS.rusty.sad,               // alias: storyData 'worried' -> sad expression

  portrait_victor_smug: NPC_PORTRAITS.victor.smug,
  portrait_victor_frustrated: NPC_PORTRAITS.victor.frustrated,
  portrait_victor_angry: NPC_PORTRAITS.victor.angry,
  portrait_victor_fake_pleasant: NPC_PORTRAITS.victor['fake-pleasant'],
  portrait_victor_neutral: NPC_PORTRAITS.victor['fake-pleasant'],// alias: storyData 'neutral' -> fake-pleasant
  portrait_victor_defeated: NPC_PORTRAITS.victor.frustrated,     // alias: storyData 'defeated' -> frustrated

  portrait_priya_curious: NPC_PORTRAITS.priya.curious,
  portrait_priya_excited: NPC_PORTRAITS.priya.excited,
  portrait_priya_concerned: NPC_PORTRAITS.priya.concerned,
  portrait_priya_neutral: NPC_PORTRAITS.priya.curious,           // alias: storyData 'neutral' -> curious
  portrait_priya_skeptical: NPC_PORTRAITS.priya.concerned,       // alias: storyData 'skeptical' -> concerned
  portrait_priya_sympathetic: NPC_PORTRAITS.priya.concerned,     // alias: storyData 'sympathetic' -> concerned

  portrait_bea_stern: NPC_PORTRAITS.bea.stern,
  portrait_bea_noting: NPC_PORTRAITS.bea.noting,
  portrait_bea_rare_smile: NPC_PORTRAITS.bea['rare-smile'],
  portrait_bea_neutral: NPC_PORTRAITS.bea.stern,                 // alias: storyData 'neutral' -> stern
  portrait_bea_satisfied: NPC_PORTRAITS.bea['rare-smile'],       // alias: storyData 'satisfied' -> rare-smile
  portrait_bea_concerned: NPC_PORTRAITS.bea.noting,              // alias: storyData 'concerned' -> noting

  portrait_diego_happy: NPC_PORTRAITS.diego.happy,
  portrait_diego_nervous: NPC_PORTRAITS.diego.nervous,
  portrait_diego_pumped: NPC_PORTRAITS.diego.pumped,
  portrait_diego_neutral: NPC_PORTRAITS.diego.happy,             // alias: storyData 'neutral' -> happy
  portrait_diego_disappointed: NPC_PORTRAITS.diego.nervous,      // alias: storyData 'disappointed' -> nervous
  portrait_diego_laughing: NPC_PORTRAITS.diego.happy,            // alias: storyData 'laughing' -> happy

  portrait_fiona_evaluating: NPC_PORTRAITS.fiona.evaluating,
  portrait_fiona_interested: NPC_PORTRAITS.fiona.interested,
  portrait_fiona_impressed: NPC_PORTRAITS.fiona.impressed,
  portrait_fiona_neutral: NPC_PORTRAITS.fiona.evaluating,        // alias: storyData 'neutral' -> evaluating
  portrait_fiona_pleased: NPC_PORTRAITS.fiona.impressed,         // alias: storyData 'pleased' -> impressed
  portrait_fiona_frustrated: NPC_PORTRAITS.fiona.evaluating,     // alias: storyData 'frustrated' -> evaluating
  portrait_fiona_calculating: NPC_PORTRAITS.fiona.interested,    // alias: storyData 'calculating' -> interested

  // Sully (64x64)
  portrait_sully_neutral: NPC_PORTRAITS.sully.neutral,
  portrait_sully_scheming: NPC_PORTRAITS.sully.scheming,
  portrait_sully_excited: NPC_PORTRAITS.sully.excited,
  portrait_sully_caught: NPC_PORTRAITS.sully.caught,

  // ── NPC Mini-Portraits (8x8) ──
  mini_maggie: NPC_MINI_PORTRAITS.maggie,
  mini_rusty: NPC_MINI_PORTRAITS.rusty,
  mini_victor: NPC_MINI_PORTRAITS.victor,
  mini_priya: NPC_MINI_PORTRAITS.priya,
  mini_bea: NPC_MINI_PORTRAITS.bea,
  mini_diego: NPC_MINI_PORTRAITS.diego,
  mini_fiona: NPC_MINI_PORTRAITS.fiona,
  mini_sully: NPC_MINI_PORTRAITS.sully,

  // ── 32x32 Equipment Sprites ──
  airFilter32_good: EQUIPMENT_SPRITES_32.airFilter32.good,
  airFilter32_worn: EQUIPMENT_SPRITES_32.airFilter32.worn,
  airFilter32_broken: EQUIPMENT_SPRITES_32.airFilter32.broken,
  waterPump32_good: EQUIPMENT_SPRITES_32.waterPump32.good,
  waterPump32_worn: EQUIPMENT_SPRITES_32.waterPump32.worn,
  waterPump32_broken: EQUIPMENT_SPRITES_32.waterPump32.broken,
  hvac32_good: EQUIPMENT_SPRITES_32.hvac32.good,
  hvac32_worn: EQUIPMENT_SPRITES_32.hvac32.worn,
  hvac32_broken: EQUIPMENT_SPRITES_32.hvac32.broken,
  drain32_good: EQUIPMENT_SPRITES_32.drain32.good,
  drain32_worn: EQUIPMENT_SPRITES_32.drain32.worn,
  drain32_broken: EQUIPMENT_SPRITES_32.drain32.broken,
  pipe32_horizontal: EQUIPMENT_SPRITES_32.pipe32.horizontal,
  duct32_horizontal: EQUIPMENT_SPRITES_32.duct32.horizontal,

  // ── Tile Variants (16x16) ──
  tile_weathered_concrete: TILE_VARIANTS.weatheredConcrete,
  tile_rusted_steel: TILE_VARIANTS.rustedSteel,
  tile_dirty_glass: TILE_VARIANTS.dirtyGlass,
  tile_puddle: TILE_VARIANTS.puddleTile,
  tile_oil_stain: TILE_VARIANTS.oilStainTile,
  tile_debris: TILE_VARIANTS.debrisTile,
  tile_seat_upgraded: TILE_VARIANTS.seatUpgraded,
};
