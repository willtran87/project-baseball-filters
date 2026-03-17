/**
 * Crowd character sprite definitions for the animated crowd system.
 *
 * Each sprite set has 2 frames (standing / mid-step), 8x12 pixels.
 * Row layout: 0-1 head/hat, 2-3 face, 4-7 torso, 8-9 legs, 10-11 feet.
 *
 * Improvements:
 * - Varied hair colors across fan types (brown, black, blonde, auburn)
 * - Varied skin tones (light, medium, tan, deep)
 * - Arm pixels on torso edges for readability
 * - Belt detail to break up torso/leg transition
 * - Shoe sole highlight for depth
 */

const _ = null;

// Skin tones (4 tones for diversity)
const SK  = '#ffccaa';   // light
const SK2 = '#dda070';   // medium
const SK3 = '#c68c5a';   // tan
const SK4 = '#8b5e3c';   // deep

// Hair colors
const HBR = '#553322';   // brown
const HBK = '#222222';   // black
const HBL = '#c8a860';   // blonde
const HAU = '#884422';   // auburn

// Team colors
const RED = '#cc2244';
const NVY = '#1a2a5a';
const WHT = '#e0e0e0';

// Worker
const ORG = '#ff8844';
const HAT = '#ffec27';

// VIP
const DRK = '#2a2a3a';
const SUT = '#444466';
const TIE = '#cc2244';

// Player uniform (home)
const PWT = '#f0f0f0';
const PTR = '#cc2244'; // trim
const PNB = '#1a2a5a'; // number backdrop

// Player uniform (away)
const ABL = '#29adff'; // away cap blue
const AGR = '#aaaaaa'; // away jersey gray
const ATR = '#1a4a8a'; // away trim blue
const ANB = '#122a5a'; // away number backdrop dark blue

// Common
const BLK = '#111111';
const GRY = '#888888';
const BLT = '#443322'; // belt
const DNM = '#334466'; // denim blue
const KHK = '#aa9966'; // khaki pants
const SHO = '#333333'; // shoe
const SOL = '#555555'; // shoe sole highlight

// ── Fan (Red shirt, brown hair, light skin) ──────────────────

export const crowd_fan_red = [
  // Frame 0: standing
  [
    [_,   _,   HBR, HBR, HBR, HBR, _,   _  ],
    [_,   HBR, HBR, HBR, HBR, HBR, HBR, _  ],
    [_,   SK,  SK,  SK,  SK,  SK,  SK,  _  ],
    [_,   SK,  BLK, SK,  SK,  BLK, SK,  _  ],
    [_,   _,   RED, RED, RED, RED, _,   _  ],
    [_,   SK,  RED, RED, RED, RED, SK,  _  ],
    [_,   _,   RED, RED, RED, RED, _,   _  ],
    [_,   _,   RED, RED, RED, RED, _,   _  ],
    [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],
    [_,   _,   DNM, DNM, DNM, DNM, _,   _  ],
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],
  ],
  // Frame 1: mid-step
  [
    [_,   _,   HBR, HBR, HBR, HBR, _,   _  ],
    [_,   HBR, HBR, HBR, HBR, HBR, HBR, _  ],
    [_,   SK,  SK,  SK,  SK,  SK,  SK,  _  ],
    [_,   SK,  BLK, SK,  SK,  BLK, SK,  _  ],
    [_,   _,   RED, RED, RED, RED, _,   _  ],
    [_,   SK,  RED, RED, RED, RED, SK,  _  ],
    [_,   _,   RED, RED, RED, RED, _,   _  ],
    [_,   _,   RED, RED, RED, RED, _,   _  ],
    [_,   _,   DNM, _,   _,   DNM, _,   _  ],
    [_,   _,   DNM, _,   _,   DNM, _,   _  ],
    [_,   SHO, SHO, _,   _,   SHO, SHO, _  ],
    [_,   SOL, _,   _,   _,   _,   SOL, _  ],
  ],
];

// ── Fan (Navy shirt, black hair, tan skin) ────────────────────

export const crowd_fan_navy = [
  [
    [_,   _,   HBK, HBK, HBK, HBK, _,   _  ],
    [_,   HBK, HBK, HBK, HBK, HBK, HBK, _  ],
    [_,   SK3, SK3, SK3, SK3, SK3, SK3, _  ],
    [_,   SK3, BLK, SK3, SK3, BLK, SK3, _  ],
    [_,   _,   NVY, NVY, NVY, NVY, _,   _  ],
    [_,   SK3, NVY, NVY, NVY, NVY, SK3, _  ],
    [_,   _,   NVY, NVY, NVY, NVY, _,   _  ],
    [_,   _,   NVY, NVY, NVY, NVY, _,   _  ],
    [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],
    [_,   _,   DNM, DNM, DNM, DNM, _,   _  ],
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],
  ],
  [
    [_,   _,   HBK, HBK, HBK, HBK, _,   _  ],
    [_,   HBK, HBK, HBK, HBK, HBK, HBK, _  ],
    [_,   SK3, SK3, SK3, SK3, SK3, SK3, _  ],
    [_,   SK3, BLK, SK3, SK3, BLK, SK3, _  ],
    [_,   _,   NVY, NVY, NVY, NVY, _,   _  ],
    [_,   SK3, NVY, NVY, NVY, NVY, SK3, _  ],
    [_,   _,   NVY, NVY, NVY, NVY, _,   _  ],
    [_,   _,   NVY, NVY, NVY, NVY, _,   _  ],
    [_,   _,   DNM, _,   _,   DNM, _,   _  ],
    [_,   _,   DNM, _,   _,   DNM, _,   _  ],
    [_,   SHO, SHO, _,   _,   SHO, SHO, _  ],
    [_,   SOL, _,   _,   _,   _,   SOL, _  ],
  ],
];

// ── Fan (White shirt, blonde hair, medium skin) ───────────────

export const crowd_fan_white = [
  [
    [_,   _,   HBL, HBL, HBL, HBL, _,   _  ],
    [_,   HBL, HBL, HBL, HBL, HBL, HBL, _  ],
    [_,   SK2, SK2, SK2, SK2, SK2, SK2, _  ],
    [_,   SK2, BLK, SK2, SK2, BLK, SK2, _  ],
    [_,   _,   WHT, WHT, WHT, WHT, _,   _  ],
    [_,   SK2, WHT, WHT, WHT, WHT, SK2, _  ],
    [_,   _,   WHT, WHT, WHT, WHT, _,   _  ],
    [_,   _,   WHT, WHT, WHT, WHT, _,   _  ],
    [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],
    [_,   _,   KHK, KHK, KHK, KHK, _,   _  ],
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],
  ],
  [
    [_,   _,   HBL, HBL, HBL, HBL, _,   _  ],
    [_,   HBL, HBL, HBL, HBL, HBL, HBL, _  ],
    [_,   SK2, SK2, SK2, SK2, SK2, SK2, _  ],
    [_,   SK2, BLK, SK2, SK2, BLK, SK2, _  ],
    [_,   _,   WHT, WHT, WHT, WHT, _,   _  ],
    [_,   SK2, WHT, WHT, WHT, WHT, SK2, _  ],
    [_,   _,   WHT, WHT, WHT, WHT, _,   _  ],
    [_,   _,   WHT, WHT, WHT, WHT, _,   _  ],
    [_,   _,   KHK, _,   _,   KHK, _,   _  ],
    [_,   _,   KHK, _,   _,   KHK, _,   _  ],
    [_,   SHO, SHO, _,   _,   SHO, SHO, _  ],
    [_,   SOL, _,   _,   _,   _,   SOL, _  ],
  ],
];

// ── Fan (Green shirt, auburn hair, deep skin) ─────────────────

export const crowd_fan_green = [
  [
    [_,   _,   HAU, HAU, HAU, HAU, _,   _  ],
    [_,   HAU, HAU, HAU, HAU, HAU, HAU, _  ],
    [_,   SK4, SK4, SK4, SK4, SK4, SK4, _  ],
    [_,   SK4, BLK, SK4, SK4, BLK, SK4, _  ],
    [_,   _,   '#228844', '#228844', '#228844', '#228844', _,   _  ],
    [_,   SK4, '#228844', '#228844', '#228844', '#228844', SK4, _  ],
    [_,   _,   '#228844', '#228844', '#228844', '#228844', _,   _  ],
    [_,   _,   '#228844', '#228844', '#228844', '#228844', _,   _  ],
    [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],
    [_,   _,   DNM, DNM, DNM, DNM, _,   _  ],
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],
  ],
  [
    [_,   _,   HAU, HAU, HAU, HAU, _,   _  ],
    [_,   HAU, HAU, HAU, HAU, HAU, HAU, _  ],
    [_,   SK4, SK4, SK4, SK4, SK4, SK4, _  ],
    [_,   SK4, BLK, SK4, SK4, BLK, SK4, _  ],
    [_,   _,   '#228844', '#228844', '#228844', '#228844', _,   _  ],
    [_,   SK4, '#228844', '#228844', '#228844', '#228844', SK4, _  ],
    [_,   _,   '#228844', '#228844', '#228844', '#228844', _,   _  ],
    [_,   _,   '#228844', '#228844', '#228844', '#228844', _,   _  ],
    [_,   _,   DNM, _,   _,   DNM, _,   _  ],
    [_,   _,   DNM, _,   _,   DNM, _,   _  ],
    [_,   SHO, SHO, _,   _,   SHO, SHO, _  ],
    [_,   SOL, _,   _,   _,   _,   SOL, _  ],
  ],
];

// ── Worker (orange vest, hard hat, medium skin) ──────────────

export const crowd_worker = [
  [
    [_,   _,   HAT, HAT, HAT, HAT, _,   _  ],
    [_,   HAT, HAT, HAT, HAT, HAT, HAT, _  ],
    [_,   SK2, SK2, SK2, SK2, SK2, SK2, _  ],
    [_,   SK2, BLK, SK2, SK2, BLK, SK2, _  ],
    [_,   _,   ORG, ORG, ORG, ORG, _,   _  ],
    [_,   SK2, ORG, WHT, WHT, ORG, SK2, _  ],
    [_,   _,   ORG, ORG, ORG, ORG, _,   _  ],
    [_,   _,   ORG, ORG, ORG, ORG, _,   _  ],
    [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],
    [_,   _,   HBR, HBR, HBR, HBR, _,   _  ],
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],
  ],
  [
    [_,   _,   HAT, HAT, HAT, HAT, _,   _  ],
    [_,   HAT, HAT, HAT, HAT, HAT, HAT, _  ],
    [_,   SK2, SK2, SK2, SK2, SK2, SK2, _  ],
    [_,   SK2, BLK, SK2, SK2, BLK, SK2, _  ],
    [_,   _,   ORG, ORG, ORG, ORG, _,   _  ],
    [_,   SK2, ORG, WHT, WHT, ORG, SK2, _  ],
    [_,   _,   ORG, ORG, ORG, ORG, _,   _  ],
    [_,   _,   ORG, ORG, ORG, ORG, _,   _  ],
    [_,   _,   HBR, _,   _,   HBR, _,   _  ],
    [_,   _,   HBR, _,   _,   HBR, _,   _  ],
    [_,   SHO, SHO, _,   _,   SHO, SHO, _  ],
    [_,   SOL, _,   _,   _,   _,   SOL, _  ],
  ],
];

// ── VIP Guest (dark suit, tie detail) ────────────────────────

export const crowd_vip = [
  [
    [_,   _,   HBK, HBK, HBK, HBK, _,   _  ],
    [_,   HBK, HBK, HBK, HBK, HBK, HBK, _  ],
    [_,   SK,  SK,  SK,  SK,  SK,  SK,  _  ],
    [_,   SK,  BLK, SK,  SK,  BLK, SK,  _  ],
    [_,   _,   DRK, WHT, WHT, DRK, _,   _  ],
    [_,   DRK, DRK, TIE, TIE, DRK, DRK, _  ],
    [_,   DRK, DRK, DRK, DRK, DRK, DRK, _  ],
    [_,   _,   DRK, DRK, DRK, DRK, _,   _  ],
    [_,   _,   SUT, SUT, SUT, SUT, _,   _  ],
    [_,   _,   SUT, SUT, SUT, SUT, _,   _  ],
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],
  ],
  [
    [_,   _,   HBK, HBK, HBK, HBK, _,   _  ],
    [_,   HBK, HBK, HBK, HBK, HBK, HBK, _  ],
    [_,   SK,  SK,  SK,  SK,  SK,  SK,  _  ],
    [_,   SK,  BLK, SK,  SK,  BLK, SK,  _  ],
    [_,   _,   DRK, WHT, WHT, DRK, _,   _  ],
    [_,   DRK, DRK, TIE, TIE, DRK, DRK, _  ],
    [_,   DRK, DRK, DRK, DRK, DRK, DRK, _  ],
    [_,   _,   DRK, DRK, DRK, DRK, _,   _  ],
    [_,   _,   SUT, _,   _,   SUT, _,   _  ],
    [_,   _,   SUT, _,   _,   SUT, _,   _  ],
    [_,   SHO, SHO, _,   _,   SHO, SHO, _  ],
    [_,   SOL, _,   _,   _,   _,   SOL, _  ],
  ],
];

// ── Player (baseball uniform, cap with brim detail) ──────────

export const crowd_player = [
  [
    [_,   _,   RED, RED, RED, RED, _,   _  ],
    [_,   RED, PWT, PWT, PWT, PWT, RED, _  ],
    [_,   SK3, SK3, SK3, SK3, SK3, SK3, _  ],
    [_,   SK3, BLK, SK3, SK3, BLK, SK3, _  ],
    [_,   _,   PWT, PWT, PWT, PWT, _,   _  ],
    [_,   SK3, PWT, PTR, PTR, PWT, SK3, _  ],
    [_,   _,   PWT, PNB, PNB, PWT, _,   _  ],
    [_,   _,   PWT, PWT, PWT, PWT, _,   _  ],
    [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],
    [_,   _,   GRY, GRY, GRY, GRY, _,   _  ],
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],
  ],
  [
    [_,   _,   RED, RED, RED, RED, _,   _  ],
    [_,   RED, PWT, PWT, PWT, PWT, RED, _  ],
    [_,   SK3, SK3, SK3, SK3, SK3, SK3, _  ],
    [_,   SK3, BLK, SK3, SK3, BLK, SK3, _  ],
    [_,   _,   PWT, PWT, PWT, PWT, _,   _  ],
    [_,   SK3, PWT, PTR, PTR, PWT, SK3, _  ],
    [_,   _,   PWT, PNB, PNB, PWT, _,   _  ],
    [_,   _,   PWT, PWT, PWT, PWT, _,   _  ],
    [_,   _,   GRY, _,   _,   GRY, _,   _  ],
    [_,   _,   GRY, _,   _,   GRY, _,   _  ],
    [_,   SHO, SHO, _,   _,   SHO, SHO, _  ],
    [_,   SOL, _,   _,   _,   _,   SOL, _  ],
  ],
];

// ── Away Player (blue cap, gray jersey, away uniform) ────────

export const crowd_player_away = [
  // Frame 0: standing
  [
    [_,   _,   ABL, ABL, ABL, ABL, _,   _  ],
    [_,   ABL, AGR, AGR, AGR, AGR, ABL, _  ],
    [_,   SK3, SK3, SK3, SK3, SK3, SK3, _  ],
    [_,   SK3, BLK, SK3, SK3, BLK, SK3, _  ],
    [_,   _,   AGR, AGR, AGR, AGR, _,   _  ],
    [_,   SK3, AGR, ATR, ATR, AGR, SK3, _  ],
    [_,   _,   AGR, ANB, ANB, AGR, _,   _  ],
    [_,   _,   AGR, AGR, AGR, AGR, _,   _  ],
    [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],
    [_,   _,   GRY, GRY, GRY, GRY, _,   _  ],
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],
  ],
  // Frame 1: mid-step
  [
    [_,   _,   ABL, ABL, ABL, ABL, _,   _  ],
    [_,   ABL, AGR, AGR, AGR, AGR, ABL, _  ],
    [_,   SK3, SK3, SK3, SK3, SK3, SK3, _  ],
    [_,   SK3, BLK, SK3, SK3, BLK, SK3, _  ],
    [_,   _,   AGR, AGR, AGR, AGR, _,   _  ],
    [_,   SK3, AGR, ATR, ATR, AGR, SK3, _  ],
    [_,   _,   AGR, ANB, ANB, AGR, _,   _  ],
    [_,   _,   AGR, AGR, AGR, AGR, _,   _  ],
    [_,   _,   GRY, _,   _,   GRY, _,   _  ],
    [_,   _,   GRY, _,   _,   GRY, _,   _  ],
    [_,   SHO, SHO, _,   _,   SHO, SHO, _  ],
    [_,   SOL, _,   _,   _,   _,   SOL, _  ],
  ],
];

// Mascot colors (red raptor — team colors)
const MGR = '#cc2244'; // raptor red body
const MLG = '#ee4466'; // raptor light red highlights
const MDG = '#881122'; // raptor dark red spine/shadow
const MYL = '#ffec27'; // raptor yellow eye + accents
const MRD = '#f0f0f0'; // raptor white jersey

// ── Raptor Mascot (team mascot in jersey, dinosaur head) ─────
// A cartoonish raptor head with snout, wearing team jersey and cap.
// Bigger presence than normal crowd — same 8x12 format.

export const crowd_mascot = [
  // Frame 0: standing
  [
    [_,   MDG, MGR, MGR, MGR, _,   _,   _  ],  // top of head + crest
    [_,   MGR, MGR, MYL, MGR, MGR, _,   _  ],  // head with yellow eye
    [_,   _,   MGR, MGR, MGR, MGR, MLG, _  ],  // snout extending right
    [_,   _,   MDG, MGR, MGR, BLK, _,   _  ],  // jaw with teeth hint
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],  // jersey top (team red)
    [_,   MGR, MRD, WHT, WHT, MRD, MGR, _  ],  // jersey with number area + arms
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],  // jersey bottom
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],  // jersey hem
    [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],  // belt
    [_,   _,   WHT, WHT, WHT, WHT, _,   _  ],  // white pants
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],  // shoes
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],  // shoe sole
  ],
  // Frame 1: mid-step (walking animation)
  [
    [_,   MDG, MGR, MGR, MGR, _,   _,   _  ],
    [_,   MGR, MGR, MYL, MGR, MGR, _,   _  ],
    [_,   _,   MGR, MGR, MGR, MGR, MLG, _  ],
    [_,   _,   MDG, MGR, MGR, BLK, _,   _  ],
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],
    [_,   MGR, MRD, WHT, WHT, MRD, MGR, _  ],
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],
    [_,   _,   WHT, _,   _,   WHT, _,   _  ],
    [_,   _,   WHT, _,   _,   WHT, _,   _  ],
    [_,   SHO, SHO, _,   _,   SHO, SHO, _  ],
    [_,   SOL, _,   _,   _,   _,   SOL, _  ],
  ],
  // Frame 2: arm wave (right arm raised)
  [
    [_,   MDG, MGR, MGR, MGR, _,   _,   _  ],
    [_,   MGR, MGR, MYL, MGR, MGR, _,   _  ],
    [_,   _,   MGR, MGR, MGR, MGR, MLG, _  ],
    [_,   _,   MDG, MGR, MGR, BLK, _,   _  ],
    [_,   _,   MRD, MRD, MRD, MRD, MGR, _  ],  // right arm raised up
    [_,   MGR, MRD, WHT, WHT, MRD, MGR, _  ],
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],
    [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],
    [_,   _,   WHT, WHT, WHT, WHT, _,   _  ],
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],
  ],
  // Frame 3: jump (sprite shifted up 2px — empty rows at bottom)
  [
    [_,   _,   MGR, MGR, MGR, MGR, MLG, _  ],  // snout (was row 2)
    [_,   _,   MDG, MGR, MGR, BLK, _,   _  ],  // jaw (was row 3)
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],  // jersey top (was row 4)
    [_,   MGR, MRD, WHT, WHT, MRD, MGR, _  ],  // jersey + arms (was row 5)
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],  // jersey bottom (was row 6)
    [_,   _,   MRD, MRD, MRD, MRD, _,   _  ],  // jersey hem (was row 7)
    [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],  // belt (was row 8)
    [_,   _,   WHT, WHT, WHT, WHT, _,   _  ],  // pants (was row 9)
    [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],  // shoes (was row 10)
    [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],  // soles (was row 11)
    [_,   _,   _,   _,   _,   _,   _,   _  ],  // empty (airborne)
    [_,   _,   _,   _,   _,   _,   _,   _  ],  // empty (airborne)
  ],
];

// ── Away team color schemes (rotated each game day) ──────────
export const AWAY_COLOR_SCHEMES = [
  { cap: '#29adff', jersey: '#aaaaaa', trim: '#1a4a8a', number: '#122a5a' }, // Blue/Gray (default)
  { cap: '#228844', jersey: '#e0e0e0', trim: '#228844', number: '#114422' }, // Green/White
  { cap: '#ff6c24', jersey: '#1a1a2a', trim: '#ff6c24', number: '#cc4400' }, // Orange/Black
  { cap: '#8844aa', jersey: '#ccbbdd', trim: '#6622aa', number: '#442266' }, // Purple/Lavender
  { cap: '#cc2244', jersey: '#aaaaaa', trim: '#cc2244', number: '#881122' }, // Red/Gray
  { cap: '#1a2a5a', jersey: '#e0e0e0', trim: '#1a2a5a', number: '#0a1a3a' }, // Navy/White
  { cap: '#aa8822', jersey: '#2a2a2a', trim: '#ccaa22', number: '#886600' }, // Gold/Black
  { cap: '#008888', jersey: '#e0e0e0', trim: '#006666', number: '#004444' }, // Teal/White
];

/**
 * Generate an away player sprite with the given color scheme.
 * Returns a 2-frame sprite array in the same format as crowd_player.
 */
export function generateAwaySprite(scheme) {
  const c = scheme.cap, j = scheme.jersey, t = scheme.trim, n = scheme.number;
  return [
    // Frame 0: standing
    [
      [_,   _,   c,   c,   c,   c,   _,   _  ],
      [_,   c,   j,   j,   j,   j,   c,   _  ],
      [_,   SK3, SK3, SK3, SK3, SK3, SK3, _  ],
      [_,   SK3, BLK, SK3, SK3, BLK, SK3, _  ],
      [_,   _,   j,   j,   j,   j,   _,   _  ],
      [_,   SK3, j,   t,   t,   j,   SK3, _  ],
      [_,   _,   j,   n,   n,   j,   _,   _  ],
      [_,   _,   j,   j,   j,   j,   _,   _  ],
      [_,   _,   BLT, BLT, BLT, BLT, _,   _  ],
      [_,   _,   GRY, GRY, GRY, GRY, _,   _  ],
      [_,   _,   SHO, SHO, SHO, SHO, _,   _  ],
      [_,   _,   SHO, SOL, SOL, SHO, _,   _  ],
    ],
    // Frame 1: mid-step
    [
      [_,   _,   c,   c,   c,   c,   _,   _  ],
      [_,   c,   j,   j,   j,   j,   c,   _  ],
      [_,   SK3, SK3, SK3, SK3, SK3, SK3, _  ],
      [_,   SK3, BLK, SK3, SK3, BLK, SK3, _  ],
      [_,   _,   j,   j,   j,   j,   _,   _  ],
      [_,   SK3, j,   t,   t,   j,   SK3, _  ],
      [_,   _,   j,   n,   n,   j,   _,   _  ],
      [_,   _,   j,   j,   j,   j,   _,   _  ],
      [_,   _,   GRY, _,   _,   GRY, _,   _  ],
      [_,   _,   GRY, _,   _,   GRY, _,   _  ],
      [_,   SHO, SHO, _,   _,   SHO, SHO, _  ],
      [_,   SOL, _,   _,   _,   _,   SOL, _  ],
    ],
  ];
}

// ── NPC-tinted sprite generator ──────────────────────────────
// Creates a fan sprite with the NPC's theme color as shirt color.

function makeNpcSprite(themeColor) {
  const base = crowd_fan_red;
  return base.map(frame =>
    frame.map(row =>
      row.map(pixel => (pixel === RED ? themeColor : pixel))
    )
  );
}

export const NPC_CROWD_SPRITES = {
  maggie: makeNpcSprite('#c44040'),
  rusty:  makeNpcSprite('#b87333'),
  priya:  makeNpcSprite('#e8a030'),
  bea:    makeNpcSprite('#557755'),
  diego:  makeNpcSprite('#4488cc'),
  fiona:  makeNpcSprite('#cc44cc'),
};

// Lookup table for sprite sets by entity type
export const CROWD_SPRITE_SETS = {
  fan_red:   crowd_fan_red,
  fan_navy:  crowd_fan_navy,
  fan_white: crowd_fan_white,
  fan_green: crowd_fan_green,
  worker:    crowd_worker,
  vip:       crowd_vip,
  player:       crowd_player,
  player_away:  crowd_player_away,
  mascot:       crowd_mascot,
};
