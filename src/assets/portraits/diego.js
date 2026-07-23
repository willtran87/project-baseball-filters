import { P } from '../palette.js';

const _ = P._;
const K = P.K, DB = P.DB, DG = P.DG, BR = P.BR, GY = P.GY, LG = P.LG, W = P.W;
const R = P.R, O = P.O, Y = P.Y, G = P.G, B = P.B, I = P.I, PK = P.PK, PE = P.PE;
const SK = P.SK, SD2 = P.SD2, NV = P.NV, CR = P.CR, WW = P.WW;
const SLT = P.SLT, SM = P.SM, STA = P.STA, SDP = P.SDP;
const BS = P.BS, CP = P.CP, BA = P.BA, DI2 = P.DI2;
const ST = P.ST, SL = P.SL, SD = P.SD, CO = P.CO, RU = P.RU;
const DBR = P.DBR, LR = P.LR;
const GO = P.GO, SI = P.SI, DP = P.DP;

// ============================================================
// DIEGO RAMIREZ — Star Player #7, early 20s, athletic
// Forward red cap, white pinstripe jersey, baseball glove
// ============================================================

export const diego_happy = [
// Row 0
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 1
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 2
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 3: top of cap
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 4
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 5: cap crown
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,CR,R,R,R,R,R,R,R,R,R,CR,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 6
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,CR,R,R,R,R,R,R,R,R,R,R,R,R,R,CR,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 7: cap body
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 8: cap with "R" logo
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,W,W,R,R,W,W,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 9: logo middle
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,W,R,W,W,R,W,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 10: logo bottom
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,W,W,W,W,W,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 11: cap band
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,CR,CR,CR,CR,CR,CR,CR,CR,CR,W,R,W,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 12: brim - forward facing, shadow on forehead
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 13: brim bottom edge
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 14: forehead in shadow from brim, dark hair visible at sides
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,DB,K,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,K,DB,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 15: forehead (brim shadow)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,DB,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,DB,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 16: forehead lower, brim shadow fading
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,DB,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,DB,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 17: forehead, hair at sides
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 18: temple, smooth skin
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 19: brow area
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,SDP,STA,STA,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,SDP,SDP,SDP,STA,STA,STA,SDP,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 20: eyebrows - clean, dark
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,K,K,K,K,STA,STA,STA,STA,STA,STA,K,K,K,K,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 21: eyes - bright, open, happy
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,W,W,K,K,STA,STA,STA,STA,STA,STA,W,W,K,K,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 22: eyes - with bright whites, dark pupils
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,W,K,K,BR,STA,STA,STA,STA,STA,STA,W,K,K,BR,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 23: under-eye
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 24: cheeks - smooth
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 25: nose bridge
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 26: nose tip
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,SDP,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 27: under nose
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,SDP,K,K,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 28: upper lip
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 29: BIG SMILE - open mouth showing teeth
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,SDP,SDP,W,W,W,W,W,W,SDP,SDP,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 30: teeth / smile
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,SDP,SDP,W,W,W,W,W,W,W,W,SDP,SDP,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 31: lower lip
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,SDP,SDP,CR,CR,CR,CR,CR,CR,SDP,SDP,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 32: chin
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,SDP,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 33: strong jawline
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 34: jaw bottom
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 35: chin bottom
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 36: under chin shadow
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 37: neck
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 38: neck
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 39: neck to collar
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 40: collar - red trim on white jersey
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,W,W,W,W,W,W,W,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 41: collar / jersey start
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,WW,W,W,W,WW,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 42: jersey with pinstripes
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,LG,W,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 43: jersey - number "7" starts
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,R,R,R,R,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 44: jersey - "7" top bar
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,R,R,R,R,W,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 45: jersey - "7" diagonal
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,R,R,W,W,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 46: jersey - "7" stem
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,R,R,W,W,W,W,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 47: jersey - "7" bottom
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,R,R,W,W,W,W,LG,W,W,W,LG,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 48: shoulders widening, glove on left side
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,W,R,R,W,W,W,W,W,LG,W,W,LG,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 49: shoulders + glove left
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,LG,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 50: glove visible on left side
[_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,LG,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 51: red sleeve trim + glove
[_,_,_,_,_,_,_,_,_,_,_,_,BR,LR,R,R,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,R,R,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 52: glove + jersey
[_,_,_,_,_,_,_,_,_,_,_,BR,BR,LR,R,R,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,R,R,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 53
[_,_,_,_,_,_,_,_,_,_,BR,BR,DBR,LR,R,R,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,R,R,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 54: glove detail
[_,_,_,_,_,_,_,_,_,BR,BR,DBR,BR,LR,R,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,R,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 55
[_,_,_,_,_,_,_,_,BR,BR,DBR,BR,LR,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 56
[_,_,_,_,_,_,_,BR,BR,DBR,BR,LR,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 57
[_,_,_,_,_,_,BR,BR,DBR,BR,LR,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 58
[_,_,_,_,_,BR,BR,DBR,BR,LR,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 59
[_,_,_,_,BR,BR,DBR,BR,LR,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 60
[_,_,_,BR,BR,DBR,BR,LR,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_],
// Row 61
[_,_,_,BR,BR,DBR,LR,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_],
// Row 62
[_,_,BR,BR,DBR,LR,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_,_,_,_,_,_],
// Row 63
[_,_,BR,BR,LR,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,_,_,_,_,_,_,_,_,_],
];

// ============================================================
// DIEGO — NERVOUS: biting lip, wide eyes, hand scratching neck
// ============================================================
export const diego_nervous = [
// Rows 0-18: identical to happy (cap, hair, forehead)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,CR,R,R,R,R,R,R,R,R,R,CR,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,CR,R,R,R,R,R,R,R,R,R,R,R,R,R,CR,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,W,W,R,R,W,W,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,W,R,W,W,R,W,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,W,W,W,W,W,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,CR,CR,CR,CR,CR,CR,CR,CR,CR,W,R,W,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,DB,K,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,K,DB,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,DB,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,DB,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,DB,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,DB,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 19: NERVOUS brows - raised, worried
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,SDP,STA,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,SDP,STA,STA,SDP,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 20: eyebrows raised high (worried)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,K,K,K,K,STA,STA,STA,STA,STA,STA,STA,STA,K,K,K,K,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 21: eyes WIDE open - nervous
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,W,W,W,K,STA,STA,STA,STA,STA,STA,W,W,W,K,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 22: eyes wide, pupils smaller (nervous)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,W,W,K,K,STA,STA,STA,STA,STA,STA,W,W,K,K,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 23: under-eye
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,W,W,SDP,STA,STA,STA,STA,STA,STA,STA,W,W,SDP,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 24: cheeks
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 25: nose
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 26: nose tip
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,SDP,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 27: under nose
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,SDP,K,K,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 28: upper lip - tight, biting
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 29: biting lip - teeth on lower lip
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,SDP,SDP,W,W,SDP,SDP,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 30: lower lip being bitten
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,SDP,SDP,CR,CR,CR,CR,SDP,SDP,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 31: chin
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,SDP,SDP,SDP,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 32: chin
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 33: jawline
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 34: jaw bottom
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 35: chin bottom
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 36: under chin
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 37: neck - hand scratching back of neck (right side)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 38: neck + hand behind
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,SDP,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 39: neck to collar + hand
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 40: collar
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,W,W,W,W,W,W,W,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 41: collar / jersey
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,WW,W,W,W,WW,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 42: jersey
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,LG,W,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 43: jersey - "7"
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,R,R,R,R,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 44
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,R,R,R,R,W,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 45
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,R,R,W,W,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 46
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,R,R,W,W,W,W,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 47
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,R,R,W,W,W,W,LG,W,W,W,LG,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 48: shoulders
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,W,R,R,W,W,W,W,W,LG,W,W,LG,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 49
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,LG,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 50: arm reaching up to scratch neck on right
[_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,LG,W,W,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 51: sleeve trim
[_,_,_,_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,R,R,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 52
[_,_,_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,R,R,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 53
[_,_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,R,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 54
[_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,R,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 55
[_,_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,R,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 56
[_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 57
[_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 58
[_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 59
[_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 60
[_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 61
[_,_,_,R,R,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,_,_,_,_,_,_,_,_,_,_,_],
// Row 62
[_,_,R,R,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,_,_,_,_,_,_,_,_,_,_],
// Row 63
[_,_,R,R,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,_,_,_,_,_,_,_,_,_],
];

// ============================================================
// DIEGO — PUMPED: fist raised, mouth open shouting, intense eyes
// ============================================================
export const diego_pumped = [
// Rows 0-18: identical to happy
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,CR,R,R,R,R,R,R,R,R,R,CR,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,CR,R,R,R,R,R,R,R,R,R,R,R,R,R,CR,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,W,W,R,R,W,W,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,W,R,W,W,R,W,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,R,R,R,R,R,W,W,W,W,W,R,R,R,R,R,R,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,CR,CR,CR,CR,CR,CR,CR,CR,CR,W,R,W,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,K,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,CR,K,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,DB,K,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,SDP,K,DB,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,DB,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,DB,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,DB,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,DB,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 19: PUMPED brows - furrowed, intense
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,K,SDP,STA,SDP,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,SDP,SDP,SDP,SDP,STA,STA,SDP,K,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 20: eyebrows - angled down (determined)
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,K,K,K,K,STA,STA,STA,STA,STA,STA,K,K,K,K,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 21: eyes - intense, focused
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,W,W,K,K,STA,STA,STA,STA,STA,STA,W,W,K,K,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 22: eyes - intense glare
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,W,K,K,BR,STA,STA,STA,STA,STA,STA,W,K,K,BR,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 23: under-eye
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 24: cheeks
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 25: nose
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 26: nose tip
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,SDP,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 27: under nose, nostrils flared
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,SDP,SDP,K,K,SDP,SDP,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 28: upper lip
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 29: OPEN MOUTH - shouting/cheering
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,SDP,SDP,W,W,W,W,W,W,SDP,SDP,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 30: mouth wide open - teeth top
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,SDP,SDP,CR,CR,CR,CR,CR,CR,CR,CR,SDP,SDP,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 31: mouth interior
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,SDP,SDP,CR,CR,CR,CR,CR,CR,CR,CR,SDP,SDP,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 32: mouth bottom - teeth
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,SDP,SDP,W,W,W,W,W,W,SDP,SDP,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 33: jaw
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,SDP,SDP,SDP,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 34: jaw bottom
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 35
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 36
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 37: neck
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,SDP,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 38
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,SDP,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 39: neck to collar
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,SDP,STA,STA,STA,STA,STA,STA,STA,STA,STA,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 40: collar
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,R,R,W,W,W,W,W,W,W,R,R,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 41: jersey
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,WW,W,W,W,WW,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 42: jersey
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,LG,W,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 43: "7"
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,R,R,R,R,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 44
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,R,R,R,R,W,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 45
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,R,R,W,W,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 46
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,R,R,W,W,W,W,W,LG,W,W,LG,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 47
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,R,R,W,W,W,W,LG,W,W,W,LG,W,W,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 48: shoulders + fist raised on right
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,W,R,R,W,W,W,W,W,LG,W,W,LG,W,W,W,W,W,_,_,_,_,STA,STA,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 49: fist raised
[_,_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,LG,W,W,W,W,W,_,_,STA,STA,SDP,STA,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 50
[_,_,_,_,_,_,_,_,_,_,_,_,_,W,W,W,LG,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,LG,W,W,W,W,_,STA,STA,SDP,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 51: raised arm on right
[_,_,_,_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,R,R,W,W,STA,STA,SDP,STA,SDP,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 52: right arm up
[_,_,_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,R,R,W,W,W,STA,SDP,STA,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 53
[_,_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,R,R,W,W,W,STA,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 54
[_,_,_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,R,R,W,W,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 55
[_,_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 56
[_,_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 57
[_,_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 58
[_,_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 59
[_,_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 60
[_,_,_,R,R,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_,_,_],
// Row 61
[_,_,_,R,R,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_,_],
// Row 62
[_,_,R,R,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_],
// Row 63
[_,_,R,R,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,LG,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,R,R,_,_,_,_,_,_,_,_,_,_],
];
