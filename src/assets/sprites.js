/**
 * Sprite atlas definitions + pixel-data sprite arrays.
 *
 * SPRITE_ATLAS: Maps sprite names to regions in sprite sheet images (legacy).
 * SPRITES: Pixel-data sprites as 2D arrays of hex color strings (null = transparent).
 * All pixel sprites use the PICO-8 inspired palette from palette.js.
 */

import { P } from './palette.js';

// ── Shorthand locals for compact sprite data ──────────────────────
const _ = null;
const K = P.K, DB = P.DB, DG = P.DG, BR = P.BR, GY = P.GY, LG = P.LG, W = P.W;
const R = P.R, O = P.O, Y = P.Y, G = P.G, B = P.B, I = P.I, PK = P.PK, PE = P.PE;
const CO = P.CO, CL = P.CL, CD = P.CD, ST = P.ST, SL = P.SL, SD = P.SD;
const GL = P.GL, GA = P.GA, GR = P.GR, GT = P.GT;
const WA = P.WA, WL = P.WL, RU = P.RU, SK = P.SK, GO = P.GO;

// ── Legacy sprite sheet atlas (kept for backwards compat) ─────────
export const SPRITE_ATLAS = {
  filter_basic:         { x: 0,  y: 0,  w: 16, h: 16 },
  filter_carbon:        { x: 16, y: 0,  w: 16, h: 16 },
  filter_hepa:          { x: 32, y: 0,  w: 16, h: 16 },
  filter_electrostatic: { x: 48, y: 0,  w: 16, h: 16 },
  filter_broken:        { x: 0,  y: 16, w: 16, h: 16 },
  filter_warning:       { x: 16, y: 16, w: 16, h: 16 },
  tile_floor:           { x: 0,  y: 32, w: 16, h: 16 },
  tile_wall:            { x: 16, y: 32, w: 16, h: 16 },
  tile_pipe:            { x: 32, y: 32, w: 16, h: 16 },
  tile_vent:            { x: 48, y: 32, w: 16, h: 16 },
  icon_money:           { x: 0,  y: 48, w: 8,  h: 8 },
  icon_reputation:      { x: 8,  y: 48, w: 8,  h: 8 },
  icon_wrench:          { x: 16, y: 48, w: 8,  h: 8 },
  icon_warning:         { x: 24, y: 48, w: 8,  h: 8 },
};

// ══════════════════════════════════════════════════════════════════
// STADIUM WALL TILES (16x16)
// ══════════════════════════════════════════════════════════════════

const wallConcrete = [
  [CD,CD,CO,CO,CO,CO,CO,CL,CL,CO,CO,CO,CO,CO,CD,CD],
  [CD,CO,CO,CL,CO,CO,CL,CO,CO,CO,CO,CL,CO,CO,CO,CD],
  [CO,CO,CL,CL,CO,CO,CO,CO,CO,CL,CL,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CD,CO,CO,CO,CO,CO,CO,CD,CO,CO,CO,CO],
  [CO,CL,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CL,CO],
  [CO,CO,CO,CO,CO,CO,CL,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CL,CO,CO,CO,CO],
  [CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD],
  [CO,CO,CO,CL,CO,CO,CO,CO,CO,CO,CO,CO,CL,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CD,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CL,CO,CO,CO,CD,CO,CO,CO,CO,CD,CO,CO,CO,CL,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CD,CO,CO,CO,CO,CO,CL,CO,CO,CL,CO,CO,CO,CO,CO,CD],
  [CD,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,CD],
];

const wallSteel = [
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,ST,ST,ST,ST,ST,ST,SL,SL,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,SL,SL,ST,ST,ST,ST,ST,ST,ST,SL,SL,ST,ST,SD],
  [SD,ST,SL,ST,ST,ST,ST,ST,ST,ST,ST,ST,SL,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,K ,ST,ST,ST,ST,K ,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,SL,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SL,SD],
  [SD,SL,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SL,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,K ,ST,ST,ST,ST,K ,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,SL,ST,ST,ST,ST,ST,ST,ST,ST,ST,SL,ST,ST,SD],
  [SD,ST,SL,SL,ST,ST,ST,ST,ST,ST,ST,SL,SL,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,SL,SL,ST,ST,ST,ST,ST,ST,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
];

const wallGlass = [
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GA,GA,GL,GL,GL,GL,GL,GL,GL,GA,GA,GL,GL,SD],
  [SD,GL,GA,GL,GL,GL,GL,GL,GL,GL,GL,GL,GA,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GA,GA,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GA,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GA,GA,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GA,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
];

// ══════════════════════════════════════════════════════════════════
// FLOOR TILES (16x16)
// ══════════════════════════════════════════════════════════════════

const floorConcourse = [
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CL,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CL,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CD,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CD,CO,CO,CO,CO,CO,CO,CO,CO,CD,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CL,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CL,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CL,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CL,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
];

const floorField = [
  [GR,GR,GT,GR,GR,GR,GR,GR,GR,GR,GR,GT,GR,GR,GR,GR],
  [GR,GR,GR,GR,GR,GR,GR,GT,GR,GR,GR,GR,GR,GR,GR,GR],
  [GT,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GT,GR],
  [GR,GR,GR,GR,GT,GR,GR,GR,GR,GT,GR,GR,GR,GR,GR,GR],
  [GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR],
  [GR,GT,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GT,GR,GR,GR],
  [GR,GR,GR,GR,GR,GR,GT,GR,GR,GR,GR,GR,GR,GR,GR,GR],
  [GR,GR,GR,GR,GR,GR,GR,GR,GR,GT,GR,GR,GR,GR,GR,GR],
  [GR,GR,GT,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GT,GR,GR],
  [GR,GR,GR,GR,GR,GT,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR],
  [GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GT,GR,GR,GR,GR,GR],
  [GT,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GT,GR],
  [GR,GR,GR,GT,GR,GR,GR,GR,GR,GR,GR,GT,GR,GR,GR,GR],
  [GR,GR,GR,GR,GR,GR,GR,GT,GR,GR,GR,GR,GR,GR,GR,GR],
  [GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR],
  [GR,GT,GR,GR,GR,GR,GR,GR,GR,GR,GR,GR,GT,GR,GR,GR],
];

const floorUtility = [
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
  [GY,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,GY],
  [GY,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,GY],
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
];

// ══════════════════════════════════════════════════════════════════
// SEATING (16x16)
// ══════════════════════════════════════════════════════════════════

const seatGeneral = [
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,B ,B ,B ,B ,_ ,_ ,B ,B ,B ,B ,_ ,_ ,_ ],
  [_ ,_ ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,_ ,_ ],
  [_ ,_ ,B ,DB,DB,DB,B ,B ,B ,DB,DB,DB,B ,B ,_ ,_ ],
  [_ ,_ ,B ,DB,DB,DB,B ,B ,B ,DB,DB,DB,B ,B ,_ ,_ ],
  [_ ,_ ,B ,DB,DB,DB,B ,B ,B ,DB,DB,DB,B ,B ,_ ,_ ],
  [_ ,_ ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,_ ,_ ],
  [_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,GY,GY,GY,GY,GY,_ ,GY,GY,GY,GY,GY,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const seatPremium = [
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,O ,O ,O ,O ,O ,O ,O ,O ,O ,O ,_ ,_ ,_ ],
  [_ ,_ ,O ,O ,O ,O ,O ,O ,O ,O ,O ,O ,O ,O ,_ ,_ ],
  [_ ,_ ,O ,BR,BR,BR,O ,O ,O ,BR,BR,BR,O ,O ,_ ,_ ],
  [_ ,_ ,O ,BR,BR,BR,O ,O ,O ,BR,BR,BR,O ,O ,_ ,_ ],
  [_ ,_ ,O ,BR,BR,BR,O ,O ,O ,BR,BR,BR,O ,O ,_ ,_ ],
  [_ ,_ ,O ,O ,O ,O ,O ,O ,O ,O ,O ,O ,O ,O ,_ ,_ ],
  [_ ,_ ,O ,BR,BR,BR,BR,O ,O ,BR,BR,BR,BR,O ,_ ,_ ],
  [_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,GY,_ ,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,GY,GY,GY,GY,GY,_ ,GY,GY,GY,GY,GY,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const seatLuxuryBox = [
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
  [GY,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GY],
  [GY,GO,BR,BR,BR,GO,GO,GO,GO,GO,BR,BR,BR,GO,GO,GY],
  [GY,GO,BR,BR,BR,GO,GO,GO,GO,GO,BR,BR,BR,GO,GO,GY],
  [GY,GO,BR,BR,BR,GO,GO,GO,GO,GO,BR,BR,BR,GO,GO,GY],
  [GY,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GY],
  [GY,GO,BR,BR,BR,BR,GO,GO,GO,BR,BR,BR,BR,GO,GO,GY],
  [GY,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GO,GY],
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
  [GY,_ ,_ ,GY,_ ,_ ,GY,_ ,GY,_ ,_ ,GY,_ ,_ ,GY,GY],
  [GY,_ ,_ ,GY,_ ,_ ,GY,_ ,GY,_ ,_ ,GY,_ ,_ ,GY,GY],
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

// ══════════════════════════════════════════════════════════════════
// FILTRATION EQUIPMENT (16x16) — 3 condition states each
// ══════════════════════════════════════════════════════════════════

// Air Filter
const airFilterGood = [
  [_ ,_ ,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,_ ,_ ],
  [_ ,SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD,_ ],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,SL,G ,G ,SL,SL,G ,G ,SL,SL,G ,G ,SL,ST,SD],
  [SD,ST,SL,G ,G ,SL,SL,G ,G ,SL,SL,G ,G ,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,G ,G ,G ,G ,G ,G ,G ,G ,G ,G ,G ,G ,ST,SD],
  [SD,ST,G ,G ,G ,G ,G ,G ,G ,G ,G ,G ,G ,G ,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,SL,G ,G ,SL,SL,G ,G ,SL,SL,G ,G ,SL,ST,SD],
  [SD,ST,SL,G ,G ,SL,SL,G ,G ,SL,SL,G ,G ,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [_ ,SD,ST,G ,_ ,_ ,ST,ST,ST,ST,_ ,_ ,G ,ST,SD,_ ],
  [_ ,_ ,SD,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,SD,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const airFilterWorn = [
  [_ ,_ ,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,_ ,_ ],
  [_ ,SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD,_ ],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,SL,Y ,Y ,SL,SL,Y ,Y ,SL,SL,Y ,Y ,SL,ST,SD],
  [SD,ST,SL,Y ,Y ,SL,SL,Y ,Y ,SL,SL,Y ,Y ,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,ST,SD],
  [SD,ST,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,SL,Y ,Y ,SL,SL,Y ,Y ,SL,SL,Y ,Y ,SL,ST,SD],
  [SD,ST,SL,Y ,Y ,SL,SL,Y ,Y ,SL,SL,Y ,Y ,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [_ ,SD,ST,Y ,_ ,_ ,ST,ST,ST,ST,_ ,_ ,Y ,ST,SD,_ ],
  [_ ,_ ,SD,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,SD,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const airFilterBroken = [
  [_ ,_ ,SD,RU,SD,SD,RU,SD,SD,RU,SD,SD,RU,SD,_ ,_ ],
  [_ ,RU,ST,ST,ST,RU,ST,ST,ST,ST,RU,ST,ST,ST,RU,_ ],
  [SD,ST,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,ST,SD],
  [RU,ST,GY,R ,R ,GY,GY,R ,R ,GY,GY,R ,R ,GY,ST,RU],
  [SD,ST,GY,R ,R ,GY,GY,R ,R ,GY,GY,R ,R ,GY,ST,SD],
  [SD,ST,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,ST,SD],
  [RU,ST,BR,BR,BR,BR,BR,BR,BR,BR,BR,BR,BR,BR,ST,RU],
  [SD,ST,BR,BR,BR,BR,BR,BR,BR,BR,BR,BR,BR,BR,ST,SD],
  [SD,ST,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,ST,SD],
  [SD,ST,GY,R ,R ,GY,GY,R ,R ,GY,GY,R ,R ,GY,ST,SD],
  [RU,ST,GY,R ,R ,GY,GY,R ,R ,GY,GY,R ,R ,GY,ST,RU],
  [SD,ST,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,ST,SD],
  [SD,RU,ST,ST,ST,ST,RU,ST,ST,RU,ST,ST,ST,ST,RU,SD],
  [_ ,SD,RU,R ,_ ,_ ,ST,ST,ST,ST,_ ,_ ,R ,RU,SD,_ ],
  [_ ,_ ,SD,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,SD,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

// Water Pump
const waterPumpGood = [
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SD,SD,SD,SD,SD,SD,SD,SD,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SD,ST,ST,ST,ST,ST,ST,ST,ST,SD,_ ,_ ,_ ],
  [_ ,_ ,SD,ST,B ,B ,B ,B ,B ,B ,B ,B ,ST,SD,_ ,_ ],
  [_ ,SD,ST,B ,B ,WA,WA,WA,WA,WA,WA,B ,B ,ST,SD,_ ],
  [_ ,SD,ST,B ,WA,WL,WL,WA,WA,WL,WL,WA,B ,ST,SD,_ ],
  [SD,ST,B ,B ,WA,WL,WA,WA,WA,WA,WL,WA,B ,B ,ST,SD],
  [SD,ST,B ,B ,WA,WA,WA,WA,WA,WA,WA,WA,B ,B ,ST,SD],
  [SD,ST,B ,B ,WA,WA,WA,WA,WA,WA,WA,WA,B ,B ,ST,SD],
  [SD,ST,B ,B ,WA,WL,WA,WA,WA,WA,WL,WA,B ,B ,ST,SD],
  [_ ,SD,ST,B ,WA,WL,WL,WA,WA,WL,WL,WA,B ,ST,SD,_ ],
  [_ ,SD,ST,B ,B ,WA,WA,WA,WA,WA,WA,B ,B ,ST,SD,_ ],
  [_ ,_ ,SD,ST,B ,B ,B ,B ,B ,B ,B ,B ,ST,SD,_ ,_ ],
  [_ ,_ ,_ ,SD,ST,ST,ST,ST,ST,ST,ST,ST,SD,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SD,SD,SD,SD,SD,SD,SD,SD,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const waterPumpWorn = [
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SD,SD,SD,SD,SD,SD,SD,SD,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SD,ST,ST,ST,ST,ST,ST,ST,ST,SD,_ ,_ ,_ ],
  [_ ,_ ,SD,ST,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,ST,SD,_ ,_ ],
  [_ ,SD,ST,Y ,Y ,WA,WA,WA,WA,WA,WA,Y ,Y ,ST,SD,_ ],
  [_ ,SD,ST,Y ,WA,WA,WA,WA,WA,WA,WA,WA,Y ,ST,SD,_ ],
  [SD,ST,Y ,Y ,WA,WA,WA,WA,WA,WA,WA,WA,Y ,Y ,ST,SD],
  [SD,ST,Y ,Y ,WA,WA,WA,WA,WA,WA,WA,WA,Y ,Y ,ST,SD],
  [SD,ST,Y ,Y ,WA,WA,WA,WA,WA,WA,WA,WA,Y ,Y ,ST,SD],
  [SD,ST,Y ,Y ,WA,WA,WA,WA,WA,WA,WA,WA,Y ,Y ,ST,SD],
  [_ ,SD,ST,Y ,WA,WA,WA,WA,WA,WA,WA,WA,Y ,ST,SD,_ ],
  [_ ,SD,ST,Y ,Y ,WA,WA,WA,WA,WA,WA,Y ,Y ,ST,SD,_ ],
  [_ ,_ ,SD,ST,Y ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,ST,SD,_ ,_ ],
  [_ ,_ ,_ ,SD,ST,ST,ST,ST,ST,ST,ST,ST,SD,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SD,SD,SD,SD,SD,SD,SD,SD,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const waterPumpBroken = [
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,RU,SD,RU,SD,SD,RU,SD,RU,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,RU,ST,ST,ST,ST,ST,ST,ST,ST,RU,_ ,_ ,_ ],
  [_ ,_ ,RU,ST,R ,R ,R ,R ,R ,R ,R ,R ,ST,RU,_ ,_ ],
  [_ ,RU,ST,R ,R ,GY,GY,GY,GY,GY,GY,R ,R ,ST,RU,_ ],
  [_ ,SD,ST,R ,GY,GY,GY,GY,GY,GY,GY,GY,R ,ST,SD,_ ],
  [RU,ST,R ,R ,GY,GY,GY,GY,GY,GY,GY,GY,R ,R ,ST,RU],
  [SD,ST,R ,R ,GY,GY,GY,GY,GY,GY,GY,GY,R ,R ,ST,SD],
  [SD,ST,R ,R ,GY,GY,GY,GY,GY,GY,GY,GY,R ,R ,ST,SD],
  [RU,ST,R ,R ,GY,GY,GY,GY,GY,GY,GY,GY,R ,R ,ST,RU],
  [_ ,SD,ST,R ,GY,GY,GY,GY,GY,GY,GY,GY,R ,ST,SD,_ ],
  [_ ,RU,ST,R ,R ,GY,GY,GY,GY,GY,GY,R ,R ,ST,RU,_ ],
  [_ ,_ ,RU,ST,R ,R ,R ,R ,R ,R ,R ,R ,ST,RU,_ ,_ ],
  [_ ,_ ,_ ,RU,ST,ST,ST,ST,ST,ST,ST,ST,RU,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,RU,SD,RU,SD,SD,RU,SD,RU,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

// HVAC Unit
const hvacGood = [
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,ST,SD],
  [SD,ST,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,ST,SD],
  [SD,ST,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,ST,SD],
  [SD,ST,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,ST,SD],
  [SD,ST,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,G ,G ,ST,ST,ST,ST,ST,ST,ST,ST,G ,G ,ST,SD],
  [SD,ST,G ,G ,ST,ST,_ ,G ,G ,_ ,ST,ST,G ,G ,ST,SD],
  [SD,ST,ST,ST,ST,_ ,G ,G ,G ,G ,_ ,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,_ ,G ,G ,G ,G ,G ,G ,_ ,ST,ST,ST,SD],
  [SD,ST,ST,ST,_ ,G ,G ,G ,G ,G ,G ,_ ,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,_ ,G ,G ,G ,G ,_ ,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,_ ,G ,G ,_ ,ST,ST,ST,ST,ST,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
];

const hvacWorn = [
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,ST,SD],
  [SD,ST,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,ST,SD],
  [SD,ST,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,ST,SD],
  [SD,ST,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,ST,SD],
  [SD,ST,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,SL,_ ,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,Y ,Y ,ST,ST,ST,ST,ST,ST,ST,ST,Y ,Y ,ST,SD],
  [SD,ST,Y ,Y ,ST,ST,_ ,Y ,Y ,_ ,ST,ST,Y ,Y ,ST,SD],
  [SD,ST,ST,ST,ST,_ ,Y ,Y ,Y ,Y ,_ ,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,_ ,Y ,Y ,Y ,Y ,Y ,Y ,_ ,ST,ST,ST,SD],
  [SD,ST,ST,ST,_ ,Y ,Y ,Y ,Y ,Y ,Y ,_ ,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,_ ,Y ,Y ,Y ,Y ,_ ,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,_ ,Y ,Y ,_ ,ST,ST,ST,ST,ST,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
];

const hvacBroken = [
  [RU,SD,RU,SD,SD,RU,SD,SD,SD,SD,RU,SD,SD,RU,SD,RU],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [RU,ST,GY,_ ,GY,_ ,GY,_ ,GY,_ ,GY,_ ,GY,_ ,ST,RU],
  [SD,ST,_ ,GY,_ ,GY,_ ,GY,_ ,GY,_ ,GY,_ ,GY,ST,SD],
  [SD,ST,GY,_ ,GY,_ ,GY,_ ,GY,_ ,GY,_ ,GY,_ ,ST,SD],
  [RU,ST,_ ,GY,_ ,GY,_ ,GY,_ ,GY,_ ,GY,_ ,GY,ST,RU],
  [SD,ST,GY,_ ,GY,_ ,GY,_ ,GY,_ ,GY,_ ,GY,_ ,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [RU,ST,R ,R ,ST,ST,ST,ST,ST,ST,ST,ST,R ,R ,ST,RU],
  [SD,ST,R ,R ,ST,ST,_ ,R ,R ,_ ,ST,ST,R ,R ,ST,SD],
  [SD,ST,ST,ST,ST,_ ,R ,R ,R ,R ,_ ,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,_ ,R ,R ,R ,R ,R ,R ,_ ,ST,ST,ST,SD],
  [SD,ST,ST,ST,_ ,R ,R ,R ,R ,R ,R ,_ ,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,_ ,R ,R ,R ,R ,_ ,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,_ ,R ,R ,_ ,ST,ST,ST,ST,ST,SD],
  [RU,SD,RU,SD,SD,RU,SD,SD,SD,SD,RU,SD,SD,RU,SD,RU],
];

// Drainage Grate
const drainGood = [
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
];

const drainWorn = [
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,K ,K ,SD,K ,BR,SD,K ,K ,SD,BR,K ,SD,K ,K ,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,BR,SD,K ,K ,SD,K ,K ,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,BR,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,BR,K ,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,K ,K ,SD,BR,K ,SD,K ,K ,SD,K ,BR,SD,K ,K ,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,K ,K ,SD,K ,K ,SD,BR,K ,SD,K ,K ,SD,K ,K ,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
];

const drainBroken = [
  [RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU],
  [RU,K ,K ,RU,BR,BR,RU,K ,K ,RU,BR,BR,RU,K ,K ,RU],
  [RU,K ,BR,RU,BR,BR,RU,K ,BR,RU,BR,BR,RU,BR,K ,RU],
  [RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU],
  [RU,BR,BR,RU,K ,K ,RU,BR,BR,RU,K ,K ,RU,BR,BR,RU],
  [RU,BR,BR,RU,K ,BR,RU,BR,BR,RU,BR,K ,RU,BR,BR,RU],
  [RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU],
  [RU,K ,BR,RU,BR,K ,RU,K ,K ,RU,K ,BR,RU,BR,K ,RU],
  [RU,BR,BR,RU,K ,K ,RU,BR,K ,RU,K ,K ,RU,BR,BR,RU],
  [RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU],
  [RU,BR,K ,RU,K ,BR,RU,BR,BR,RU,BR,K ,RU,K ,BR,RU],
  [RU,K ,K ,RU,BR,BR,RU,BR,BR,RU,BR,BR,RU,K ,K ,RU],
  [RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU],
  [RU,K ,BR,RU,K ,K ,RU,BR,K ,RU,K ,K ,RU,BR,K ,RU],
  [RU,BR,BR,RU,K ,BR,RU,BR,BR,RU,BR,K ,RU,BR,BR,RU],
  [RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU,RU],
];

// ══════════════════════════════════════════════════════════════════
// PIPES & DUCTS (16x16)
// ══════════════════════════════════════════════════════════════════

const pipeH = [
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST],
  [SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const pipeV = [
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
];

const pipeCorner = [
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,SD,SD,SD,SD,SD],
  [_ ,_ ,_ ,_ ,_ ,_ ,ST,SL,SL,ST,ST,ST,ST,ST,ST,ST],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [_ ,_ ,_ ,_ ,_ ,_ ,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST],
  [_ ,_ ,_ ,_ ,_ ,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const pipeTee = [
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SD,ST,SL,SL,ST,SD,_ ,_ ,_ ,_ ,_ ],
  [SD,SD,SD,SD,SD,SD,ST,SL,SL,ST,SD,SD,SD,SD,SD,SD],
  [ST,ST,ST,ST,ST,ST,ST,SL,SL,ST,ST,ST,ST,ST,ST,ST],
  [SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

// Ducts (lighter material than pipes)
const ductH = [
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [W ,W ,LG,W ,W ,LG,W ,W ,LG,W ,W ,LG,W ,W ,LG,W ],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [W ,W ,LG,W ,W ,LG,W ,W ,LG,W ,W ,LG,W ,W ,LG,W ],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const ductV = [
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,LG,LG,LG,LG,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,LG,LG,LG,LG,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,LG,LG,LG,LG,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,LG,LG,LG,LG,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,LG,LG,LG,LG,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
];

const ductCorner = [
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,LG,LG,LG,LG,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [GY,GY,GY,GY,GY,LG,W ,LG,LG,W ,LG,GY,GY,GY,GY,GY],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [W ,W ,LG,W ,W ,LG,W ,W ,W ,LG,W ,W ,LG,W ,W ,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [W ,W ,LG,W ,W ,LG,W ,W ,W ,LG,W ,W ,LG,W ,W ,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const ductTee = [
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,LG,LG,LG,LG,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [GY,GY,GY,GY,GY,LG,W ,LG,LG,W ,LG,GY,GY,GY,GY,GY],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [W ,W ,LG,W ,W ,LG,W ,W ,W ,LG,W ,W ,LG,W ,W ,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [W ,W ,LG,W ,W ,LG,W ,W ,W ,LG,W ,W ,LG,W ,W ,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [GY,GY,GY,GY,GY,LG,LG,LG,LG,LG,LG,GY,GY,GY,GY,GY],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,LG,LG,LG,LG,LG,GY,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,LG,W ,LG,LG,W ,LG,GY,_ ,_ ,_ ,_ ],
];

// ══════════════════════════════════════════════════════════════════
// CHARACTERS (16x16)
// ══════════════════════════════════════════════════════════════════

const workerIdle = [
  [_ ,_ ,_ ,_ ,_ ,Y ,Y ,Y ,Y ,Y ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,K ,SK,K ,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,B ,B ,B ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,B ,B ,B ,B ,B ,B ,B ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,B ,B ,B ,B ,B ,B ,B ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,_ ,B ,B ,B ,B ,B ,_ ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,B ,B ,B ,B ,B ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,B ,_ ,_ ,_ ,B ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,BR,BR,_ ,_ ,_ ,BR,BR,_ ,_ ,_ ,_ ,_ ],
];

const workerWalk = [
  [_ ,_ ,_ ,_ ,_ ,Y ,Y ,Y ,Y ,Y ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,K ,SK,K ,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,B ,B ,B ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,B ,B ,B ,B ,B ,B ,B ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,B ,B ,B ,B ,B ,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,B ,B ,B ,B ,B ,_ ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,B ,B ,B ,B ,B ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,B ,_ ,B ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,BR,BR,_ ,_ ,_ ,_ ,_ ,BR,BR,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
];

const workerRepair = [
  [_ ,_ ,_ ,_ ,_ ,Y ,Y ,Y ,Y ,Y ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,Y ,Y ,Y ,Y ,Y ,Y ,Y ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,K ,SK,K ,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,B ,B ,B ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,B ,B ,B ,B ,B ,B ,B ,_ ,_ ,_ ,_ ,_ ],
  [_ ,GY,GY,SK,B ,B ,B ,B ,B ,B ,B ,SK,_ ,_ ,_ ,_ ],
  [GY,GY,_ ,SK,_ ,B ,B ,B ,B ,B ,_ ,SK,_ ,_ ,_ ,_ ],
  [_ ,GY,_ ,_ ,_ ,B ,B ,B ,B ,B ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,B ,_ ,_ ,_ ,B ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,BR,BR,_ ,_ ,_ ,BR,BR,_ ,_ ,_ ,_ ,_ ],
];

const inspector = [
  [_ ,_ ,_ ,_ ,_ ,K ,K ,K ,K ,K ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,K ,K ,K ,K ,K ,K ,K ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,K ,SK,K ,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,W ,W ,W ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,W ,W ,W ,W ,W ,W ,W ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,W ,W ,W ,R ,W ,W ,W ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,_ ,W ,W ,W ,W ,W ,_ ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,W ,W ,W ,W ,W ,_ ,_ ,LG,LG,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,W ,_ ,_ ,_ ,W ,_ ,LG,LG,LG,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,K ,_ ,_ ,_ ,K ,_ ,_ ,LG,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,K ,_ ,_ ,_ ,K ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,K ,_ ,_ ,_ ,K ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,K ,K ,_ ,_ ,_ ,K ,K ,_ ,_ ,_ ,_ ,_ ],
];

const fanHappy = [
  [_ ,_ ,_ ,_ ,_ ,_ ,BR,BR,BR,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,BR,BR,BR,BR,BR,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,K ,SK,SK,SK,K ,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,K ,K ,K ,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,R ,R ,R ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,R ,R ,R ,R ,R ,R ,R ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,R ,R ,R ,R ,R ,R ,R ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,_ ,R ,R ,R ,R ,R ,_ ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,R ,R ,R ,R ,R ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,R ,_ ,_ ,_ ,R ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,GY,_ ,_ ,_ ,GY,GY,_ ,_ ,_ ,_ ,_ ],
];

const fanUncomfortable = [
  [_ ,_ ,_ ,_ ,_ ,_ ,BR,BR,BR,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,BR,BR,BR,BR,BR,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,K ,SK,SK,SK,K ,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,K ,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,R ,R ,R ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,R ,R ,R ,R ,R ,R ,R ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,R ,R ,R ,R ,R ,R ,R ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,_ ,R ,R ,R ,R ,R ,_ ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,R ,R ,R ,R ,R ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,R ,_ ,_ ,_ ,R ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,GY,_ ,_ ,_ ,GY,GY,_ ,_ ,_ ,_ ,_ ],
];

const fanAngry = [
  [_ ,_ ,_ ,_ ,_ ,_ ,BR,BR,BR,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,BR,BR,BR,BR,BR,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,R ,K ,SK,SK,SK,K ,R ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,SK,SK,SK,SK,SK,SK,SK,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,K ,K ,K ,K ,K ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,_ ,R ,R ,R ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,R ,R ,R ,R ,R ,R ,R ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,R ,R ,R ,R ,R ,R ,R ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,SK,_ ,R ,R ,R ,R ,R ,_ ,SK,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,R ,R ,R ,R ,R ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,R ,_ ,_ ,_ ,R ,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,_ ,DB,_ ,_ ,_ ,DB,_ ,_ ,_ ,_ ,_ ,_ ],
  [_ ,_ ,_ ,_ ,GY,GY,_ ,_ ,_ ,GY,GY,_ ,_ ,_ ,_ ,_ ],
];

// ══════════════════════════════════════════════════════════════════
// UI ELEMENTS
// ══════════════════════════════════════════════════════════════════

// Currency icon (8x8)
const iconCurrency = [
  [_ ,_ ,G ,G ,G ,G ,_ ,_ ],
  [_ ,G ,_ ,G ,_ ,_ ,G ,_ ],
  [G ,_ ,_ ,G ,_ ,_ ,_ ,_ ],
  [_ ,G ,G ,G ,G ,G ,_ ,_ ],
  [_ ,_ ,_ ,G ,_ ,_ ,G ,_ ],
  [_ ,_ ,_ ,G ,_ ,_ ,G ,_ ],
  [_ ,G ,_ ,G ,_ ,G ,_ ,_ ],
  [_ ,_ ,G ,G ,G ,_ ,_ ,_ ],
];

// Status indicators (8x8)
const statusGreen = [
  [_ ,_ ,DG,DG,DG,_ ,_ ,_ ],
  [_ ,DG,G ,G ,G ,DG,_ ,_ ],
  [DG,G ,G ,W ,G ,G ,DG,_ ],
  [DG,G ,W ,G ,G ,G ,DG,_ ],
  [DG,G ,G ,G ,G ,G ,DG,_ ],
  [DG,G ,G ,G ,G ,G ,DG,_ ],
  [_ ,DG,G ,G ,G ,DG,_ ,_ ],
  [_ ,_ ,DG,DG,DG,_ ,_ ,_ ],
];

const statusYellow = [
  [_ ,_ ,BR,BR,BR,_ ,_ ,_ ],
  [_ ,BR,Y ,Y ,Y ,BR,_ ,_ ],
  [BR,Y ,Y ,W ,Y ,Y ,BR,_ ],
  [BR,Y ,W ,Y ,Y ,Y ,BR,_ ],
  [BR,Y ,Y ,Y ,Y ,Y ,BR,_ ],
  [BR,Y ,Y ,Y ,Y ,Y ,BR,_ ],
  [_ ,BR,Y ,Y ,Y ,BR,_ ,_ ],
  [_ ,_ ,BR,BR,BR,_ ,_ ,_ ],
];

const statusRed = [
  [_ ,_ ,K ,K ,K ,_ ,_ ,_ ],
  [_ ,K ,R ,R ,R ,K ,_ ,_ ],
  [K ,R ,R ,W ,R ,R ,K ,_ ],
  [K ,R ,W ,R ,R ,R ,K ,_ ],
  [K ,R ,R ,R ,R ,R ,K ,_ ],
  [K ,R ,R ,R ,R ,R ,K ,_ ],
  [_ ,K ,R ,R ,R ,K ,_ ,_ ],
  [_ ,_ ,K ,K ,K ,_ ,_ ,_ ],
];

// Buttons (16x8)
const buttonNormal = [
  [_ ,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,_ ],
  [LG,W ,W ,W ,W ,W ,W ,W ,W ,W ,W ,W ,W ,W ,W ,GY],
  [LG,W ,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,W ,GY],
  [LG,W ,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,W ,GY],
  [LG,W ,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,W ,GY],
  [LG,W ,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,W ,GY],
  [LG,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
  [_ ,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,_ ],
];

const buttonHover = [
  [_ ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,_ ],
  [B ,W ,W ,W ,W ,W ,W ,W ,W ,W ,W ,W ,W ,W ,W ,DB],
  [B ,W ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,W ,DB],
  [B ,W ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,W ,DB],
  [B ,W ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,W ,DB],
  [B ,W ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,B ,W ,DB],
  [B ,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB],
  [_ ,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,_ ],
];

const buttonPressed = [
  [_ ,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,_ ],
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,LG],
  [GY,GY,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,GY,LG],
  [GY,GY,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,GY,LG],
  [GY,GY,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,GY,LG],
  [GY,GY,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,CD,GY,LG],
  [GY,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [_ ,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,_ ],
];

// Panel border 9-slice (each piece is 4x4)
const panelBorder = {
  topLeft:     [[DB,DB,DB,DB],[DB,B ,B ,B ],[DB,B ,K ,K ],[DB,B ,K ,K ]],
  top:         [[DB,DB,DB,DB],[B ,B ,B ,B ],[K ,K ,K ,K ],[K ,K ,K ,K ]],
  topRight:    [[DB,DB,DB,DB],[B ,B ,B ,DB],[K ,K ,B ,DB],[K ,K ,B ,DB]],
  left:        [[DB,B ,K ,K ],[DB,B ,K ,K ],[DB,B ,K ,K ],[DB,B ,K ,K ]],
  center:      [[K ,K ,K ,K ],[K ,K ,K ,K ],[K ,K ,K ,K ],[K ,K ,K ,K ]],
  right:       [[K ,K ,B ,DB],[K ,K ,B ,DB],[K ,K ,B ,DB],[K ,K ,B ,DB]],
  bottomLeft:  [[DB,B ,K ,K ],[DB,B ,B ,B ],[DB,DB,DB,DB],[DB,DB,DB,DB]],
  bottom:      [[K ,K ,K ,K ],[B ,B ,B ,B ],[DB,DB,DB,DB],[DB,DB,DB,DB]],
  bottomRight: [[K ,K ,B ,DB],[B ,B ,B ,DB],[DB,DB,DB,DB],[DB,DB,DB,DB]],
};

// Filter type icons (8x8)
const iconAirFilter = [
  [_ ,SD,SD,SD,SD,SD,SD,_ ],
  [SD,G ,G ,G ,G ,G ,G ,SD],
  [SD,G ,SL,SL,SL,SL,G ,SD],
  [SD,G ,SL,G ,G ,SL,G ,SD],
  [SD,G ,SL,G ,G ,SL,G ,SD],
  [SD,G ,SL,SL,SL,SL,G ,SD],
  [SD,G ,G ,G ,G ,G ,G ,SD],
  [_ ,SD,SD,SD,SD,SD,SD,_ ],
];

const iconWaterPump = [
  [_ ,SD,SD,SD,SD,SD,SD,_ ],
  [SD,B ,B ,B ,B ,B ,B ,SD],
  [SD,B ,WA,WA,WA,WA,B ,SD],
  [SD,B ,WA,WL,WL,WA,B ,SD],
  [SD,B ,WA,WL,WL,WA,B ,SD],
  [SD,B ,WA,WA,WA,WA,B ,SD],
  [SD,B ,B ,B ,B ,B ,B ,SD],
  [_ ,SD,SD,SD,SD,SD,SD,_ ],
];

const iconHvac = [
  [_ ,SD,SD,SD,SD,SD,SD,_ ],
  [SD,LG,LG,LG,LG,LG,LG,SD],
  [SD,LG,_ ,LG,_ ,LG,_ ,SD],
  [SD,LG,LG,G ,G ,LG,LG,SD],
  [SD,LG,G ,G ,G ,G ,LG,SD],
  [SD,LG,LG,G ,G ,LG,LG,SD],
  [SD,LG,LG,LG,LG,LG,LG,SD],
  [_ ,SD,SD,SD,SD,SD,SD,_ ],
];

const iconDrain = [
  [_ ,SD,SD,SD,SD,SD,SD,_ ],
  [SD,K ,SD,K ,SD,K ,SD,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,SD,K ,SD,K ,SD,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K ,SD,K ,SD,K ,SD,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD],
  [_ ,SD,SD,SD,SD,SD,SD,_ ],
];

// ══════════════════════════════════════════════════════════════════
// EFFECTS (8x8 animation frames)
// ══════════════════════════════════════════════════════════════════

const steamFrames = [
  [[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,W ,_ ,_ ,_ ,_ ],[_ ,_ ,W ,W ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,W ,W ,_ ,_ ,_ ],[_ ,_ ,W ,W ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,W ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,LG,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ]],
  [[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,W ,_ ,_ ,_ ],[_ ,_ ,_ ,W ,W ,_ ,_ ,_ ],[_ ,_ ,W ,W ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,W ,W ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,W ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,LG,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ]],
  [[_ ,_ ,W ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,W ,_ ,_ ,_ ,_ ],[_ ,_ ,W ,W ,_ ,_ ,_ ,_ ],[_ ,W ,W ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,W ,W ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,W ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,LG,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ]],
];

const waterDripFrames = [
  [[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,B ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ]],
  [[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,B ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,B ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ]],
  [[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,B ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,B ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ]],
  [[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,B ,B ,B ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ]],
];

const sparkFrames = [
  [[_ ,_ ,_ ,Y ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,Y ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,O ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,Y ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ]],
  [[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,Y ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,O ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,Y ,_ ],[_ ,Y ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,O ,_ ,_ ,_ ,_ ]],
  [[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,Y ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,O ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[Y ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,O ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,Y ,_ ]],
];

const moneyFloat = [
  [[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,G ,G ,G ,_ ,_ ,_ ],[_ ,_ ,_ ,G ,_ ,_ ,_ ,_ ],[_ ,_ ,G ,G ,G ,_ ,_ ,_ ]],
  [[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,G ,G ,G ,_ ,_ ,_ ],[_ ,_ ,_ ,G ,_ ,_ ,_ ,_ ],[_ ,_ ,G ,G ,G ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ]],
  [[_ ,_ ,DG,DG,DG,_ ,_ ,_ ],[_ ,_ ,_ ,DG,_ ,_ ,_ ,_ ],[_ ,_ ,DG,DG,DG,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ],[_ ,_ ,_ ,_ ,_ ,_ ,_ ,_ ]],
];

// ══════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════

export const SPRITES = {
  stadium: {
    walls:   { concrete: wallConcrete, steel: wallSteel, glass: wallGlass },
    floors:  { concourse: floorConcourse, field: floorField, utility: floorUtility },
    seating: { general: seatGeneral, premium: seatPremium, luxuryBox: seatLuxuryBox },
  },
  equipment: {
    airFilter:  { good: airFilterGood, worn: airFilterWorn, broken: airFilterBroken },
    waterPump:  { good: waterPumpGood, worn: waterPumpWorn, broken: waterPumpBroken },
    hvac:       { good: hvacGood, worn: hvacWorn, broken: hvacBroken },
    drain:      { good: drainGood, worn: drainWorn, broken: drainBroken },
    pipes:      { horizontal: pipeH, vertical: pipeV, corner: pipeCorner, tee: pipeTee },
    ducts:      { horizontal: ductH, vertical: ductV, corner: ductCorner, tee: ductTee },
  },
  characters: {
    worker:    { idle: workerIdle, walk: workerWalk, repair: workerRepair },
    inspector: inspector,
    fan:       { happy: fanHappy, uncomfortable: fanUncomfortable, angry: fanAngry },
  },
  ui: {
    currency: iconCurrency,
    status:   { green: statusGreen, yellow: statusYellow, red: statusRed },
    buttons:  { normal: buttonNormal, hover: buttonHover, pressed: buttonPressed },
    panel:    panelBorder,
    icons:    { airFilter: iconAirFilter, waterPump: iconWaterPump, hvac: iconHvac, drain: iconDrain },
  },
  effects: {
    steam:      steamFrames,
    waterDrip:  waterDripFrames,
    sparks:     sparkFrames,
    moneyFloat: moneyFloat,
  },
};

/**
 * Render a pixel-data sprite onto a canvas 2D context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<Array<string|null>>} sprite - 2D color array
 * @param {number} x - top-left x
 * @param {number} y - top-left y
 * @param {number} scale - pixel size (default 1)
 */
export function drawSprite(ctx, sprite, x, y, scale = 1) {
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const color = sprite[row][col];
      if (color !== null) {
        ctx.fillStyle = color;
        ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
      }
    }
  }
}

/**
 * Render one frame of an animated sprite (array of frame arrays).
 */
export function drawAnimFrame(ctx, frames, frameIndex, x, y, scale = 1) {
  const frame = frames[frameIndex % frames.length];
  drawSprite(ctx, frame, x, y, scale);
}

/**
 * Flatten nested SPRITES object into a flat { 'path.to.sprite': data } map
 * suitable for SpriteSystem.registerPixelSprites().
 */
export function flattenSprites(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value) && Array.isArray(value[0])) {
      // It's a sprite (2D array) or animation frames (3D array)
      result[path] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenSprites(value, path));
    }
  }
  return result;
}

export default SPRITES;
