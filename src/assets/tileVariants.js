/**
 * Additional 16x16 tile variants for environmental detail.
 * Weathered concrete, rusted steel, dirty glass, puddles, oil stains,
 * dust/debris, and upgraded seating with cup holders.
 */

import { P } from './palette.js';

const _ = P._;
const K = P.K, DB = P.DB, GY = P.GY, LG = P.LG, W = P.W;
const O = P.O, Y = P.Y, B = P.B, BR = P.BR;
const CO = P.CO, CL = P.CL, CD = P.CD;
const ST = P.ST, SL = P.SL, SD = P.SD;
const GL = P.GL, GA = P.GA;
const RU = P.RU, RL = P.RL;
const WA = P.WA, WL = P.WL;
const MG = P.MG, RO = P.RO, CG = P.CG;
const GO = P.GO;

// ══════════════════════════════════════════════════════════════════
// WEATHERED CONCRETE — cracks and stains
// ══════════════════════════════════════════════════════════════════

const weatheredConcrete = [
  [CD,CD,CO,CO,CO,CO,CO,CL,CL,CO,CO,CO,CO,CO,CD,CD],
  [CD,CO,CO,CL,CO,CO,CD,CO,CO,CO,CO,CL,CO,CO,CO,CD],
  [CO,CO,CL,CL,CO,CD,CD,CO,CO,CL,CL,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CD,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CD,CD,CO,CO,CO,CO,CO,CO,CD,CO,CO,CO,CO],
  [CO,CL,CD,CD,CO,CO,CO,CO,CO,CO,CO,CO,CD,CO,CL,CO],
  [CO,CO,CD,CO,CO,CO,CL,CO,CO,CO,CO,CO,CO,CD,CO,CO],
  [CO,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CL,CO,CO,CD,CO],
  [CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD],
  [CO,CO,CO,CL,CO,CO,CO,CO,CO,CO,CO,CO,CL,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CD,CD,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CD,CD,CO,CO,CO,CO,CO,CO,CO],
  [CO,CL,CO,CO,CO,CD,CD,CO,CO,CO,CD,CO,CO,CO,CL,CO],
  [CO,CO,CO,CO,CD,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CD,CO,CO,CD,CO,CO,CL,CO,CO,CL,CO,CO,CO,CO,CO,CD],
  [CD,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,CD],
];

// ══════════════════════════════════════════════════════════════════
// RUSTED STEEL
// ══════════════════════════════════════════════════════════════════

const rustedSteel = [
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,ST,ST,RU,ST,ST,ST,SL,SL,ST,ST,ST,RU,ST,ST,SD],
  [SD,ST,RU,RL,RU,ST,ST,ST,ST,ST,ST,RU,RL,ST,ST,SD],
  [SD,RU,RL,RU,ST,ST,ST,ST,ST,ST,ST,ST,RU,ST,ST,SD],
  [SD,ST,RU,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,K,ST,ST,ST,ST,K,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,RU,ST,SD],
  [SD,SL,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,RU,RL,SL,SD],
  [SD,SL,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,RU,SL,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,K,ST,ST,ST,ST,K,ST,ST,ST,ST,SD],
  [SD,ST,ST,RU,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,RU,RL,RU,ST,ST,ST,ST,ST,ST,ST,SL,ST,ST,SD],
  [SD,ST,RU,RL,ST,ST,ST,ST,ST,ST,ST,SL,SL,ST,ST,SD],
  [SD,ST,ST,RU,ST,ST,ST,SL,SL,ST,ST,ST,ST,ST,ST,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
];

// ══════════════════════════════════════════════════════════════════
// DIRTY GLASS
// ══════════════════════════════════════════════════════════════════

const dirtyGlass = [
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GA,GA,GL,GL,GL,GL,GL,BR,GL,GA,GA,GL,GL,SD],
  [SD,GL,GA,GL,GL,GL,BR,GL,GL,GL,GL,GL,GA,GL,GL,SD],
  [SD,GL,GL,GL,GL,BR,BR,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,BR,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GA,GA,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GA,GL,GL,GL,GL,BR,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,BR,BR,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,BR,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,BR,GL,GL,GL,GL,GL,GL,GA,GA,GL,GL,GL,SD],
  [SD,GL,BR,BR,GL,GL,GL,GL,GL,GL,GA,GL,GL,GL,GL,SD],
  [SD,GL,GL,BR,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,GL,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
];

// ══════════════════════════════════════════════════════════════════
// PUDDLE TILE
// ══════════════════════════════════════════════════════════════════

const puddleTile = [
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,WA,WA,WA,WA,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,WA,WA,WL,WA,WA,WA,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,WA,WA,WL,WL,WA,WA,WA,WA,CO,CO,CO,CO,CO],
  [CO,CO,CO,WA,WA,WA,WL,WA,WA,WA,WA,WA,CO,CO,CO,CO],
  [CO,CO,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,CO,CO,CO,CO],
  [CO,CO,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,CO,CO,CO],
  [CO,CO,CO,WA,WA,WA,WA,WA,WA,WA,WA,WA,CO,CO,CO,CO],
  [CO,CO,CO,WA,WA,WA,WA,WA,WA,WA,WA,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,WA,WA,WA,WA,WA,WA,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,WA,WA,WA,WA,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
];

// ══════════════════════════════════════════════════════════════════
// OIL STAIN TILE
// ══════════════════════════════════════════════════════════════════

const oilStainTile = [
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,K,K,K,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,K,GY,GY,K,K,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,K,GY,GY,GY,GY,GY,K,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,K,GY,K,GY,GY,GY,K,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,K,GY,GY,GY,GY,GY,K,K,CO,CO,CO,CO],
  [CO,CO,CO,CO,K,GY,GY,GY,GY,GY,GY,K,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,K,GY,GY,GY,GY,K,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,K,K,K,K,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
];

// ══════════════════════════════════════════════════════════════════
// DUST / DEBRIS TILE
// ══════════════════════════════════════════════════════════════════

const debrisTile = [
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,BR,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,BR,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,BR,BR,CO,CO,CO],
  [CO,CO,CO,CO,CO,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CD,CD,CO,CO,CO,CO,CO,CO,CO,CO,BR,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,BR,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,BR,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,BR,CO,CO,CO,CD,CD,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CD,CO,CO,CO,CO],
  [CO,CO,CO,CD,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,BR,CO],
  [CO,CO,CD,CD,CO,CO,CO,CO,BR,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO],
  [CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,CO,BR,CO,CO,CO],
];

// ══════════════════════════════════════════════════════════════════
// UPGRADED SEATING — with cup holders and numbered seats
// ══════════════════════════════════════════════════════════════════

const seatUpgraded = [
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,B,B,B,B,B,B,B,B,B,B,_,_,_],
  [_,_,B,B,B,B,B,B,B,B,B,B,B,B,_,_],
  [_,_,B,DB,DB,DB,B,B,B,DB,DB,DB,B,B,_,_],
  [_,_,B,DB,DB,DB,B,B,B,DB,DB,DB,B,B,_,_],
  [_,_,B,DB,DB,DB,B,B,B,DB,DB,DB,B,B,_,_],
  [_,_,B,B,B,B,B,B,B,B,B,B,B,B,_,_],
  [_,_,B,DB,DB,DB,DB,B,B,DB,DB,DB,DB,B,_,_],
  [_,_,_,GY,_,GY,_,CD,_,GY,_,GY,_,_,_,_],
  [_,_,_,GY,_,GY,CD,CD,CD,GY,_,GY,_,_,_,_],
  [_,_,_,GY,_,GY,_,CD,_,GY,_,GY,_,_,_,_],
  [_,_,GY,GY,GY,GY,GY,_,GY,GY,GY,GY,GY,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];

// ══════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════

export const TILE_VARIANTS = {
  weatheredConcrete,
  rustedSteel,
  dirtyGlass,
  puddleTile,
  oilStainTile,
  debrisTile,
  seatUpgraded,
};

export default TILE_VARIANTS;
