/**
 * Upgraded 32x32 equipment sprites with detailed shading, dithering,
 * and sub-pixel detail. Octopath Traveler / Hyper Light Drifter aesthetic.
 *
 * Each equipment type has 3 condition states: good, worn, broken.
 * Also includes larger pipe and duct sections.
 */

import { P } from './palette.js';

const _ = P._;
const K = P.K, DB = P.DB, GY = P.GY, LG = P.LG, W = P.W;
const R = P.R, O = P.O, Y = P.Y, G = P.G, B = P.B;
const ST = P.ST, SL = P.SL, SD = P.SD;
const BS = P.BS, CP = P.CP, BA = P.BA, DI2 = P.DI2;
const RU = P.RU, RO = P.RO, WB = P.WB, BR = P.BR;
const WA = P.WA, WL = P.WL, CO = P.CO, CG = P.CG;

// ══════════════════════════════════════════════════════════════════
// AIR FILTER UNIT — HEPA pleats, gauges, warning light
// ══════════════════════════════════════════════════════════════════

const airFilter32_good = [
  [_,_,_,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,_,_,_],
  [_,_,SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD,_,_],
  [_,SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD,_,_],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,SL,G,G,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [_,SD,ST,ST,ST,SD,_,_,_,SD,ST,BS,BS,ST,SD,_,_,SD,ST,BS,BS,ST,SD,_,_,_,SD,ST,G,ST,SD,_],
  [_,SD,ST,SL,ST,SD,_,_,_,SD,BS,BS,BS,BS,SD,_,_,SD,BS,BS,BS,BS,SD,_,_,_,SD,G,G,G,SD,_],
  [_,SD,ST,ST,ST,SD,_,_,_,SD,ST,BS,BS,ST,SD,_,_,SD,ST,BS,BS,ST,SD,_,_,_,SD,ST,G,ST,SD,_],
  [_,_,SD,SD,SD,_,_,_,_,_,SD,SD,SD,SD,_,_,_,_,SD,SD,SD,SD,_,_,_,_,_,SD,SD,SD,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];

const airFilter32_worn = [
  [_,_,_,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,_,_,_],
  [_,_,SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD,_,_],
  [_,SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD,_,_],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,Y,BR,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,BR,Y,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,BR,SL,SL,Y,Y,SL,SL,BR,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,SL,Y,Y,SL,ST,SD],
  [SD,ST,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [_,SD,ST,ST,ST,SD,_,_,_,SD,ST,BS,BS,ST,SD,_,_,SD,ST,BS,BS,ST,SD,_,_,_,SD,ST,Y,ST,SD,_],
  [_,SD,ST,SL,ST,SD,_,_,_,SD,BS,BS,BS,BS,SD,_,_,SD,BS,BS,BS,BS,SD,_,_,_,SD,Y,Y,Y,SD,_],
  [_,SD,ST,ST,ST,SD,_,_,_,SD,ST,BS,BS,ST,SD,_,_,SD,ST,BS,BS,ST,SD,_,_,_,SD,ST,Y,ST,SD,_],
  [_,_,SD,SD,SD,_,_,_,_,_,SD,SD,SD,SD,_,_,_,_,SD,SD,SD,SD,_,_,_,_,_,SD,SD,SD,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];

const airFilter32_broken = [
  [_,_,RU,SD,RU,SD,SD,RU,SD,SD,RU,SD,SD,SD,SD,SD,SD,SD,SD,RU,SD,SD,RU,SD,SD,RU,SD,SD,RU,_,_,_],
  [_,RU,SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,RU,_,_],
  [_,SD,ST,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,ST,SD,_,_],
  [RU,ST,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,ST,RU],
  [SD,ST,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,ST,SD],
  [SD,ST,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,ST,SD],
  [RU,ST,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,ST,RU],
  [SD,ST,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,ST,SD],
  [SD,ST,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,ST,SD],
  [RU,ST,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,ST,RU],
  [SD,ST,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,ST,SD],
  [SD,ST,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,ST,SD],
  [RU,ST,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,ST,RU],
  [SD,ST,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,GY,BR,BR,GY,ST,SD],
  [SD,ST,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,ST,SD],
  [RU,ST,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,ST,RU],
  [SD,ST,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,ST,SD],
  [SD,ST,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,GY,R,R,GY,ST,SD],
  [RU,ST,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,ST,RU],
  [SD,RU,ST,ST,ST,RU,ST,ST,ST,ST,RU,ST,ST,ST,ST,ST,ST,ST,ST,RU,ST,ST,ST,ST,RU,ST,ST,ST,ST,RU,ST,SD],
  [SD,SD,RU,SD,SD,SD,SD,RU,SD,SD,SD,SD,RU,SD,SD,SD,SD,SD,SD,SD,RU,SD,SD,SD,SD,RU,SD,SD,SD,SD,SD,SD],
  [_,SD,ST,ST,ST,SD,_,_,_,SD,ST,BS,BS,ST,SD,_,_,SD,ST,BS,BS,ST,SD,_,_,_,SD,ST,R,ST,SD,_],
  [_,SD,ST,SL,ST,SD,_,_,_,SD,BS,BS,BS,BS,SD,_,_,SD,BS,BS,BS,BS,SD,_,_,_,SD,R,R,R,SD,_],
  [_,SD,ST,ST,ST,SD,_,_,_,SD,ST,BS,BS,ST,SD,_,_,SD,ST,BS,BS,ST,SD,_,_,_,SD,ST,R,ST,SD,_],
  [_,_,SD,SD,SD,_,_,_,_,_,SD,SD,SD,SD,_,_,_,_,SD,SD,SD,SD,_,_,_,_,_,SD,SD,SD,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];

// ══════════════════════════════════════════════════════════════════
// WATER PUMP — visible pipes, pressure gauge, flow indicator
// ══════════════════════════════════════════════════════════════════

const waterPump32_good = [
  [_,_,_,_,_,_,_,_,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,SD,ST,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,ST,SD,_,_,_,_,_,_],
  [_,_,_,_,_,SD,ST,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,ST,SD,_,_,_,_,_],
  [_,_,_,_,SD,ST,B,B,B,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,B,B,B,ST,SD,_,_,_,_,_],
  [_,_,_,SD,ST,B,B,B,WA,WA,WL,WL,WA,WA,WA,WA,WA,WA,WL,WL,WA,WA,WA,B,B,B,ST,SD,_,_,_,_],
  [_,_,_,SD,ST,B,B,WA,WA,WL,WL,WL,WA,WA,WA,WA,WA,WA,WL,WL,WL,WA,WA,WA,B,B,ST,SD,_,_,_,_],
  [_,_,SD,ST,B,B,WA,WA,WL,WL,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WL,WL,WA,WA,WA,B,B,ST,SD,_,_,_],
  [_,_,SD,ST,B,B,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,B,B,ST,SD,_,_,_],
  [_,_,SD,ST,B,B,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,B,B,ST,SD,_,_,_],
  [_,_,SD,ST,B,B,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,B,B,ST,SD,_,_,_],
  [_,_,SD,ST,B,B,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,B,B,ST,SD,_,_,_],
  [_,_,_,SD,ST,B,B,WA,WA,WL,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WL,WA,WA,WA,B,B,ST,SD,_,_,_,_],
  [_,_,_,SD,ST,B,B,B,WA,WA,WL,WL,WA,WA,WA,WA,WA,WA,WL,WL,WA,WA,WA,B,B,B,ST,SD,_,_,_,_],
  [_,_,_,_,SD,ST,B,B,B,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,WA,B,B,B,ST,SD,_,_,_,_,_],
  [_,_,_,_,_,SD,ST,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,ST,SD,_,_,_,_,_],
  [_,_,_,_,_,_,SD,ST,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,B,ST,SD,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,_,_,_,_,_,_,_,_],
  [_,_,SD,SD,SD,SD,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD,SD,SD,SD,SD,SD,_,_,_,_],
  [_,SD,ST,SL,SL,ST,SD,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD,ST,SL,SL,ST,SD,_,_,_],
  [_,SD,ST,SL,SL,ST,SD,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD,ST,SL,SL,ST,SD,_,_,_],
  [_,SD,ST,SL,SL,ST,SD,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD,ST,SL,SL,ST,SD,_,_,_],
  [_,_,SD,SD,SD,SD,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD,SD,SD,SD,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];

// Worn/broken use same structure with color substitutions
const waterPump32_worn = waterPump32_good.map(row => row.map(c =>
  c === WA ? WA : c === WL ? WA : c === G ? Y : c === B ? Y : c
));

const waterPump32_broken = waterPump32_good.map(row => row.map(c =>
  c === WA ? GY : c === WL ? GY : c === G ? R : c === B ? R : c === SD ? RU : c
));

// ══════════════════════════════════════════════════════════════════
// HVAC UNIT — fan blades, condenser coils, digital display
// ══════════════════════════════════════════════════════════════════

const hvac32_good = [
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,ST,SD],
  [SD,ST,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,ST,SD],
  [SD,ST,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,ST,SD],
  [SD,ST,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,ST,SD],
  [SD,ST,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,ST,SD],
  [SD,ST,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,ST,SD],
  [SD,ST,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,ST,SD],
  [SD,ST,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,_,SL,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,G,G,G,G,ST,ST,ST,ST,ST,ST,_,_,_,_,_,_,_,_,ST,ST,ST,ST,ST,ST,G,G,G,G,ST,SD],
  [SD,ST,G,G,G,G,ST,ST,ST,ST,_,_,_,G,G,_,_,G,G,_,_,_,ST,ST,ST,ST,G,G,G,G,ST,SD],
  [SD,ST,G,G,G,G,ST,ST,_,_,_,G,G,G,G,G,G,G,G,G,G,_,_,_,ST,ST,G,G,G,G,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_,_,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_,_,ST,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_,_,ST,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,_,_,G,G,G,G,G,G,G,G,G,G,G,G,G,G,_,_,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,G,G,G,G,ST,ST,_,_,_,G,G,G,G,G,G,G,G,G,G,_,_,_,ST,ST,G,G,G,G,ST,SD],
  [SD,ST,G,G,G,G,ST,ST,ST,ST,_,_,_,G,G,_,_,G,G,_,_,_,ST,ST,ST,ST,G,G,G,G,ST,SD],
  [SD,ST,G,G,G,G,ST,ST,ST,ST,ST,ST,_,_,_,_,_,_,_,_,ST,ST,ST,ST,ST,ST,G,G,G,G,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,SD],
  [SD,ST,K,K,K,K,K,K,K,K,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,K,K,K,K,K,K,K,K,ST,SD],
  [SD,ST,K,K,G,G,K,K,G,K,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,K,G,K,K,G,G,K,K,ST,SD],
  [SD,ST,K,K,K,K,K,K,K,K,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,K,K,K,K,K,K,K,K,ST,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];

const hvac32_worn = hvac32_good.map(row => row.map(c =>
  c === G ? Y : c
));

const hvac32_broken = hvac32_good.map(row => row.map(c =>
  c === G ? R : c === SL ? GY : c === SD ? RU : c
));

// ══════════════════════════════════════════════════════════════════
// DRAINAGE GRATE — visible water flow, debris catch
// ══════════════════════════════════════════════════════════════════

const drain32_good = [
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,K,SD,K,K,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];

const drain32_worn = drain32_good.map(row => row.map(c =>
  c === K ? (Math.random() > 0.85 ? BR : K) : c
));

const drain32_broken = drain32_good.map(row => row.map(c =>
  c === SD ? RU : c === K ? BR : c
));

// ══════════════════════════════════════════════════════════════════
// LARGER PIPE SECTIONS (32x32) — rivets, joints, valve handles
// ══════════════════════════════════════════════════════════════════

const pipe32_horizontal = [
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST],
  [SL,SL,SL,BS,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,BS,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,BS,SL],
  [SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL],
  [SL,SL,SL,BS,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,BS,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,SL,BS,SL],
  [ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST,ST],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD,SD],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];

// Duct section 32x32
const duct32_horizontal = [
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [W,LG,B,LG,W,LG,LG,LG,W,LG,B,LG,W,LG,LG,LG,W,LG,B,LG,W,LG,LG,LG,W,LG,B,LG,W,LG,LG,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [W,LG,B,LG,W,LG,LG,LG,W,LG,B,LG,W,LG,LG,LG,W,LG,B,LG,W,LG,LG,LG,W,LG,B,LG,W,LG,LG,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W,LG,W,W],
  [LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG,LG],
  [GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY,GY],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];

// ══════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════

export const EQUIPMENT_SPRITES_32 = {
  airFilter32:  { good: airFilter32_good, worn: airFilter32_worn, broken: airFilter32_broken },
  waterPump32:  { good: waterPump32_good, worn: waterPump32_worn, broken: waterPump32_broken },
  hvac32:       { good: hvac32_good, worn: hvac32_worn, broken: hvac32_broken },
  drain32:      { good: drain32_good, worn: drain32_worn, broken: drain32_broken },
  pipe32:       { horizontal: pipe32_horizontal },
  duct32:       { horizontal: duct32_horizontal },
};

export default EQUIPMENT_SPRITES_32;
