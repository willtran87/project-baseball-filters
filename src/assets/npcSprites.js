/**
 * NPC Portrait sprites (64x64) and mini-portraits (8x8).
 * Each NPC has multiple emotion variants.
 *
 * 64x64 portraits are imported from per-NPC files in ./portraits/.
 * Mini-portraits (8x8) for HUD/notifications are defined inline below.
 */

import { P } from './palette.js';

// Portrait imports (64x64)
import { maggie_neutral, maggie_serious, maggie_happy, maggie_disappointed } from './portraits/maggie.js';
import { rusty_skeptical, rusty_neutral, rusty_happy, rusty_sad } from './portraits/rusty.js';
import { victor_smug, victor_frustrated, victor_angry, victor_fake_pleasant } from './portraits/victor.js';
import { priya_curious, priya_excited, priya_concerned } from './portraits/priya.js';
import { bea_stern, bea_noting, bea_rare_smile } from './portraits/bea.js';
import { diego_happy, diego_nervous, diego_pumped } from './portraits/diego.js';
import { fiona_evaluating, fiona_interested, fiona_impressed } from './portraits/fiona.js';
import { sully_neutral, sully_scheming, sully_excited, sully_caught } from './portraits/sully.js';

// Palette shorthands for mini-portraits
const _ = P._;
const K = P.K, DB = P.DB, DG = P.DG, BR = P.BR, GY = P.GY, LG = P.LG, W = P.W;
const R = P.R, O = P.O, Y = P.Y, G = P.G, B = P.B, I = P.I, PK = P.PK, PE = P.PE;
const SK = P.SK, SD2 = P.SD2, NV = P.NV, CR = P.CR, WW = P.WW;
const SLT = P.SLT, SM = P.SM, STA = P.STA, SDP = P.SDP;
const BS = P.BS, CP = P.CP, BA = P.BA, DI2 = P.DI2;
const ST = P.ST, SL = P.SL, SD = P.SD, CO = P.CO, RU = P.RU;
const DBR = P.DBR, LR = P.LR;
const TL = P.TL;

// ================================================================
// MINI-PORTRAITS (8x8) — used in HUD, notifications, contacts panel
// ================================================================

const mini_maggie = [
  [_,K,DB,DB,DB,DB,K,_],
  [K,DB,SM,SM,SM,SM,DB,K],
  [K,SM,R,SM,SM,R,SM,K],
  [K,SM,SM,SM,SM,SM,SM,K],
  [_,K,SM,SM,SM,SM,K,_],
  [_,NV,NV,R,R,NV,NV,_],
  [_,NV,BA,NV,NV,NV,NV,_],
  [_,_,NV,NV,NV,NV,_,_],
];

const mini_rusty = [
  [_,R,R,R,R,R,R,_],
  [K,PE,PE,PE,PE,PE,PE,K],
  [LG,K,PE,PE,PE,K,PE,LG],
  [_,K,PE,PE,PE,PE,K,_],
  [_,LG,LG,LG,LG,LG,LG,_],
  [_,GY,GY,GY,GY,GY,GY,_],
  [_,O,O,GY,GY,O,O,_],
  [_,_,O,O,O,O,_,_],
];

const mini_victor = [
  [_,K,K,K,K,K,K,_],
  [K,K,STA,STA,STA,STA,K,K],
  [K,STA,K,STA,STA,K,STA,K],
  [K,STA,STA,STA,STA,STA,STA,K],
  [_,K,STA,K,K,STA,K,_],
  [_,DI2,W,BA,BA,W,DI2,_],
  [_,DI2,DI2,BA,BA,DI2,DI2,_],
  [_,_,DI2,DI2,DI2,DI2,_,_],
];

const mini_priya = [
  [K,BR,K,BR,K,BR,K,_],
  [BR,K,SDP,SDP,SDP,K,BR,K],
  [K,SDP,K,SDP,SDP,K,SDP,K],
  [_,K,SDP,SDP,SDP,SDP,K,_],
  [_,BA,SDP,SDP,SDP,SDP,BA,_],
  [_,TL,TL,R,TL,TL,TL,_],
  [_,TL,TL,TL,TL,TL,TL,_],
  [_,_,TL,TL,TL,TL,_,_],
];

const mini_bea = [
  [_,_,LG,LG,LG,LG,_,_],
  [_,K,LG,GY,LG,GY,K,_],
  [K,SLT,K,SLT,SLT,K,SLT,K],
  [K,SLT,K,K,K,K,SLT,K],
  [_,K,SLT,SM,SM,SLT,K,_],
  [_,NV,NV,NV,NV,NV,NV,_],
  [_,NV,BA,NV,NV,NV,NV,_],
  [_,_,NV,NV,NV,NV,_,_],
];

const mini_diego = [
  [_,R,R,W,R,R,R,_],
  [K,K,K,K,K,K,K,K],
  [K,STA,K,STA,STA,K,STA,K],
  [K,STA,STA,STA,STA,STA,STA,K],
  [_,K,STA,W,W,STA,K,_],
  [_,W,W,R,W,W,W,_],
  [_,W,W,R,R,W,W,_],
  [_,_,W,W,W,W,_,_],
];

const mini_fiona = [
  [_,K,DB,DB,DB,DB,K,_],
  [K,DB,SLT,SLT,SLT,SLT,DB,K],
  [K,SLT,K,SLT,SLT,K,SLT,K],
  [K,SLT,SLT,SLT,SLT,SLT,SLT,K],
  [_,K,SLT,SM,SM,SLT,K,_],
  [_,LG,LG,W,W,LG,LG,_],
  [_,LG,LG,LG,LG,LG,LG,_],
  [_,_,LG,LG,LG,LG,_,_],
];

const mini_sully = [
  [_,GY,GY,GY,GY,GY,GY,_],
  [GY,GY,O,O,O,O,GY,GY],
  [K,O,K,O,O,K,O,K],
  [K,O,O,O,O,O,O,K],
  [_,K,O,BR,BR,O,K,_],
  [_,O,O,O,O,O,O,_],
  [_,BR,BR,O,O,BR,BR,_],
  [_,_,BR,BR,BR,BR,_,_],
];

// ================================================================
// EXPORTS
// ================================================================

export const NPC_PORTRAITS = {
  maggie: {
    neutral: maggie_neutral,
    serious: maggie_serious,
    happy: maggie_happy,
    disappointed: maggie_disappointed,
  },
  rusty: {
    skeptical: rusty_skeptical,
    neutral: rusty_neutral,
    happy: rusty_happy,
    sad: rusty_sad,
  },
  victor: {
    smug: victor_smug,
    frustrated: victor_frustrated,
    angry: victor_angry,
    'fake-pleasant': victor_fake_pleasant,
  },
  priya: {
    curious: priya_curious,
    excited: priya_excited,
    concerned: priya_concerned,
  },
  bea: {
    stern: bea_stern,
    noting: bea_noting,
    'rare-smile': bea_rare_smile,
  },
  diego: {
    happy: diego_happy,
    nervous: diego_nervous,
    pumped: diego_pumped,
  },
  fiona: {
    evaluating: fiona_evaluating,
    interested: fiona_interested,
    impressed: fiona_impressed,
  },
  sully: {
    neutral: sully_neutral,
    scheming: sully_scheming,
    excited: sully_excited,
    caught: sully_caught,
  },
};

export const NPC_MINI_PORTRAITS = {
  maggie: mini_maggie,
  rusty: mini_rusty,
  victor: mini_victor,
  priya: mini_priya,
  bea: mini_bea,
  diego: mini_diego,
  fiona: mini_fiona,
  sully: mini_sully,
};

export default NPC_PORTRAITS;
