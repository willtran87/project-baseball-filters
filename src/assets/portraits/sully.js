import { P } from '../palette.js';

const _ = P._;
const K = P.K, DB = P.DB, DG = P.DG, BR = P.BR, GY = P.GY, LG = P.LG, W = P.W;
const R = P.R, O = P.O, Y = P.Y, G = P.G, B = P.B, I = P.I, PK = P.PK, PE = P.PE;
const SK = P.SK, SD2 = P.SD2, NV = P.NV, CR = P.CR, WW = P.WW;
const SLT = P.SLT, SM = P.SM, STA = P.STA, SDP = P.SDP;
const BS = P.BS, CP = P.CP, BA = P.BA, DI2 = P.DI2;
const ST = P.ST, SL = P.SL, SD = P.SD, CO = P.CO, RU = P.RU;
const DBR = P.DBR, LR = P.LR;
const RO = P.RO;

// ============================================================
// SULLIVAN "SULLY" McCRANKSHAW — Underground Fixer
// 50s, weathered, scraggly gray hair, 5 o'clock shadow
// Worn black umpire cap (forward brim), battered leather jacket
// with burnt-orange zipper accents. Alert, conspiratorial eyes.
// ============================================================

export const sully_neutral = [
// Row 0
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 1
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 2
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 3: top of umpire cap crown
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 4: cap crown widening
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 5: cap crown
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,DB,K,K,K,K,K,K,K,K,K,DB,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 6: cap body
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,DB,K,K,K,K,K,K,K,K,K,K,K,K,K,DB,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 7: cap body
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 8: cap body
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 9: cap front panel — "U" umpire logo
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,LG,K,K,K,LG,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 10: "U" logo middle
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,LG,K,K,K,LG,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 11: "U" logo bottom
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,LG,LG,LG,LG,LG,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 12: cap band + brim start (forward-facing brim)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 13: brim extends forward, gray hair peeking out back
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 14: brim underside shadow + forehead start, scraggly hair on sides
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,DB,DB,DB,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,DB,K,K,K,K,GY,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 15: forehead, gray hair scraggly on sides
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,GY,GY,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,GY,GY,K,GY,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 16: forehead, wrinkle lines, more scraggly hair
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,GY,SD2,SK,SK,SK,SD2,SK,SK,SD2,SK,SK,SK,SK,SD2,SK,SK,SD2,SK,SK,SK,SK,SD2,GY,GY,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 17: more forehead wrinkles
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,GY,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 18: temple area, stubble sideburns
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 19: brow ridge — thick, bushy, wild eyebrows
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,SK,SK,GY,GY,GY,GY,SK,SK,SK,SK,SK,GY,GY,GY,GY,SK,SK,SK,SD2,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 20: eyebrows — thick and wild, slightly raised
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,SK,GY,GY,LG,GY,GY,SK,SK,SK,SK,SK,GY,GY,LG,GY,GY,SK,SK,SD2,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 21: eyes — alert, slightly wide, dark irises
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SD2,W,K,SD2,SK,SK,SK,SK,SK,SK,SD2,W,K,SD2,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 22: eyes — pupils, alert look
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SD2,K,K,SD2,SK,SK,SK,SK,SK,SK,SD2,K,K,SD2,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 23: under-eye bags, crow's feet (weathered look)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 24: cheekbones, gaunt
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 25: nose bridge area
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 26: nose tip — slightly bulbous (been hit a few times)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 27: under nose, upper lip area
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SD2,SK,SK,SK,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 28: 5 o'clock shadow starts, thin-lipped grin
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,GY,SK,SK,SK,SK,SK,SD2,SD2,SK,SK,SK,SK,SK,GY,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 29: mouth — slight smirk, stubble
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,GY,SK,SK,GY,SK,SK,SD2,SD2,SD2,SD2,SD2,SK,SK,GY,SK,SK,GY,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 30: lower lip, heavy stubble
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,GY,SK,GY,SK,SK,GY,SK,SK,SK,SK,SK,SK,SK,GY,SK,SK,GY,SK,GY,GY,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 31: chin stubble
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,GY,SK,GY,SK,SK,GY,SK,SK,SK,SK,SK,GY,SK,SK,GY,SK,GY,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 32: chin
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,GY,SK,SK,GY,SK,SK,SK,SK,SK,SK,SK,GY,SK,SK,GY,SK,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 33: lower chin
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 34: chin bottom
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 35: jawline
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 36: under chin shadow
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 37: neck
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 38: neck
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 39: neck to collar
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 40: collar start — dark shirt under leather jacket
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 41: collar / dark shirt with jacket lapel
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 42: jacket opens — leather with orange zipper
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,DI2,DI2,DI2,DI2,DI2,DI2,RO,RO,DI2,DI2,DI2,DI2,DI2,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 43: jacket body, orange zipper line
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,DI2,DI2,DI2,DI2,DI2,RO,RO,DI2,DI2,DI2,DI2,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 44: jacket body, pocket detail on left
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,DBR,DBR,LR,LR,LR,LR,RO,RO,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 45: jacket body, pocket flap
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,DBR,DBR,LR,LR,LR,LR,LR,RO,RO,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 46: jacket widening at shoulders
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,RO,RO,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 47: shoulders
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,RO,RO,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 48: wide shoulders, jacket worn and scuffed
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 49: shoulders with scuff marks on leather
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,DBR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,DBR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 50: upper arm
[_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,BS,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 51: arm — flashlight clipped on right side
[_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,Y,BS,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 52
[_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,BS,BS,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 53
[_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,BS,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 54
[_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 55
[_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 56
[_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 57
[_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 58
[_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 59
[_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_],
// Row 60
[_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_],
// Row 61
[_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_],
// Row 62
[_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_],
// Row 63
[_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_],
];

// ============================================================
// SULLY — SCHEMING: leaning in, one brow raised, sly grin, eyes narrowed
// ============================================================
export const sully_scheming = [
// Rows 0-18: same cap and forehead as neutral
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,DB,K,K,K,K,K,K,K,K,K,DB,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,DB,K,K,K,K,K,K,K,K,K,K,K,K,K,DB,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,LG,K,K,K,LG,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,LG,K,K,K,LG,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,LG,LG,LG,LG,LG,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,DB,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,DB,DB,DB,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,SD2,DB,K,K,K,K,GY,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,GY,GY,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,GY,GY,K,GY,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,GY,SD2,SK,SK,SK,SD2,SK,SK,SD2,SK,SK,SK,SK,SD2,SK,SK,SD2,SK,SK,SK,SK,SD2,GY,GY,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,GY,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 19: SCHEMING brow — left raised high, right furrowed down
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,SK,GY,GY,GY,GY,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,SK,SK,SK,SK,SD2,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 20: left brow arched (conspiratorial), right flat
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,GY,GY,GY,LG,SK,SK,SK,SK,SK,SK,SK,GY,GY,GY,GY,GY,SK,SK,SD2,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 21: eyes — left eye open wide, right narrowed (sly look)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,W,W,K,SD2,SK,SK,SK,SK,SK,SK,SD2,SD2,K,SD2,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 22: eyes — left wide, right squinting (scheming)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SD2,K,K,SD2,SK,SK,SK,SK,SK,SK,SD2,K,K,SD2,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 23: under-eye
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 24-27: cheeks, nose (same as neutral)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SD2,SK,SK,SK,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 28: SCHEMING — sly crooked smirk, right side raised
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,GY,SK,SK,SK,SK,SK,SD2,SD2,SK,SK,SK,SK,SD2,GY,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 29: crooked grin — right corner up
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,GY,SK,SK,GY,SK,SK,SK,SD2,SD2,SD2,SD2,SK,SD2,SK,SK,SK,GY,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 30: lower lip, stubble
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,GY,SK,GY,SK,SK,GY,SK,SK,SK,SK,SK,SK,SK,GY,SK,SK,GY,SK,GY,GY,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Rows 31-63: chin/body identical to neutral
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,GY,SK,GY,SK,SK,GY,SK,SK,SK,SK,SK,GY,SK,SK,GY,SK,GY,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,GY,SK,SK,GY,SK,SK,SK,SK,SK,SK,SK,GY,SK,SK,GY,SK,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,DI2,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,DI2,DI2,DI2,DI2,DI2,DI2,RO,RO,DI2,DI2,DI2,DI2,DI2,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,DI2,DI2,DI2,DI2,DI2,RO,RO,DI2,DI2,DI2,DI2,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,DBR,DBR,LR,LR,LR,LR,RO,RO,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,DBR,DBR,LR,LR,LR,LR,LR,RO,RO,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,RO,RO,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,RO,RO,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,DBR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,DBR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,BS,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,Y,BS,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,BS,BS,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,BS,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_],
[_,_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_,_],
[_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_],
[_,_,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,LR,_,_,_,_,_,_,_,_,_],
];

// ============================================================
// SULLY — EXCITED: wide eyes, big grin, eyebrows up
// ============================================================
export const sully_excited = [
// Rows 0-18: identical to neutral (cap, forehead)
...sully_neutral.slice(0, 19),
// Row 19: both brows raised high (excited)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,SK,GY,GY,GY,GY,SK,SK,SK,SK,SK,SK,GY,GY,GY,GY,SK,SK,SK,SD2,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 20: eyebrows — both raised, excited
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,GY,GY,GY,LG,GY,SK,SK,SK,SK,SK,SK,GY,LG,GY,GY,GY,SK,SK,SD2,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 21: eyes — wide open (excited!)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,W,W,K,SD2,SK,SK,SK,SK,SK,SK,SD2,W,W,K,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 22: eyes — big pupils, wide open
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,W,K,K,SD2,SK,SK,SK,SK,SK,SK,SD2,W,K,K,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 23: under-eye (relaxed, excited)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 24-27: cheeks, nose (same)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SD2,SK,SK,SK,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 28: BIG GRIN — wide open mouth with teeth
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,GY,SK,SK,SK,SK,SD2,SD2,SD2,SK,SK,SK,SK,SK,GY,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 29: open mouth — teeth showing, excited
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,GY,SK,SK,GY,SK,SD2,W,W,W,W,W,SD2,SK,GY,SK,SK,GY,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 30: lower mouth, stubble
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,GY,SK,GY,SK,SK,GY,SD2,SD2,K,K,K,SD2,SD2,GY,SK,SK,GY,SK,GY,GY,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Rows 31-63: rest identical to neutral
...sully_neutral.slice(31),
];

// ============================================================
// SULLY — CAUGHT: eyes darting, grimacing, shoulders hunched
// ============================================================
export const sully_caught = [
// Rows 0-18: same cap/forehead as neutral
...sully_neutral.slice(0, 19),
// Row 19: brows pinched together (worried/caught)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,SK,SK,SD2,SD2,GY,GY,SK,SK,SK,SK,GY,GY,SD2,SD2,SK,SK,SK,SK,SD2,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 20: brows furrowed inward (anxious)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,GY,SD2,SK,SK,GY,GY,GY,GY,SK,SK,SK,SK,GY,GY,GY,GY,SK,SK,SK,SK,SD2,GY,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 21: eyes — darting to side (looking left), wide with worry
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,W,K,K,SD2,SK,SK,SK,SK,SK,SK,W,K,K,SD2,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 22: eyes darting left
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,K,K,W,SD2,SK,SK,SK,SK,SK,SK,K,K,W,SD2,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 23: bags under eyes, sweat drop
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 24-27: cheeks, nose (same)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SD2,SD2,SD2,SD2,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,SK,SK,SK,SK,SD2,SK,SK,SK,SD2,SK,SK,SK,SK,SK,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 28: grimace — teeth clenched, nervous
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,SK,GY,SK,SK,SK,SK,SK,SD2,SD2,SK,SK,SK,SK,SK,GY,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 29: grimace — clenched teeth showing
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,SK,GY,SK,SK,GY,SD2,W,K,W,K,W,K,W,SD2,GY,SK,SK,GY,SK,SK,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 30: lower lip tight, stubble
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SD2,GY,SK,GY,SK,SK,GY,SD2,SD2,SD2,SD2,SD2,SD2,SD2,GY,SK,SK,GY,SK,GY,GY,SD2,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Rows 31-63: rest identical to neutral
...sully_neutral.slice(31),
];
