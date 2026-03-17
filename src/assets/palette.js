// PICO-8 inspired pixel art palette for Minor League Major Filtration
// 32 colors: 16 core PICO-8 + 16 extended (skin, metal, environment, accent)

export const PALETTE = {
  // Core PICO-8 colors (0-15)
  BLACK:       '#000000',
  DARK_BLUE:   '#1d2b53',
  DARK_PURPLE: '#7e2553',
  DARK_GREEN:  '#008751',
  BROWN:       '#ab5236',
  DARK_GRAY:   '#5f574f',
  LIGHT_GRAY:  '#c2c3c7',
  WHITE:       '#fff1e8',
  RED:         '#ff004d',
  ORANGE:      '#ffa300',
  YELLOW:      '#ffec27',
  GREEN:       '#00e436',
  BLUE:        '#29adff',
  INDIGO:      '#83769c',
  PINK:        '#ff77a8',
  PEACH:       '#ffccaa',

  // Extended palette - Stadium specific
  CONCRETE:    '#9e9e8e',
  CONCRETE_LT: '#b5b5a6',
  CONCRETE_DK: '#7a7a6e',
  STEEL:       '#8899aa',
  STEEL_LT:    '#aabbcc',
  STEEL_DK:    '#667788',
  GLASS:       '#aaddee',
  GLASS_LT:    '#cceeff',
  GRASS:       '#2d8e2d',
  GRASS_LT:    '#44aa44',
  DIRT:        '#8b6b3d',
  DIRT_LT:     '#a6854e',
  WATER:       '#4488cc',
  WATER_LT:    '#66aaee',
  RUST:        '#994422',
  RUST_LT:     '#bb6644',
  SKIN:        '#ffccaa',
  SKIN_DK:     '#dd9966',
  GOLD:        '#ffdd44',
  SILVER:      '#ccccdd',

  // ── NEW: Expanded palette (skin tones) ──
  SKIN_LIGHT:  '#ffe0c2',
  SKIN_MED:    '#d4a574',
  SKIN_TAN:    '#c68c5a',
  SKIN_DEEP:   '#8b5e3c',

  // ── NEW: Metal tones ──
  BRUSHED_STEEL: '#b0b8c4',
  COPPER:      '#c87533',
  BRASS:       '#d4a844',
  DARK_IRON:   '#3e3e44',

  // ── NEW: Environment colors ──
  MOSS_GREEN:  '#5a7a3a',
  RUST_ORANGE: '#c45a20',
  WATER_BLUE:  '#3a6ea5',
  CONCRETE_GR: '#8a8a80',

  // ── NEW: Accent colors ──
  NAVY:        '#1a2a4a',
  TEAL:        '#2a8a8a',
  CRIMSON:     '#b01030',
  WARM_WHITE:  '#f5ead0',

  // ── Wood / leather tones ──
  DARK_BROWN:  '#4a2a14',
  LEATHER:     '#6b3a1a',
};

// Shorthand aliases for sprite data (keeps arrays compact)
export const P = {
  _: null,           // transparent
  K: PALETTE.BLACK,
  DB: PALETTE.DARK_BLUE,
  DP: PALETTE.DARK_PURPLE,
  DG: PALETTE.DARK_GREEN,
  BR: PALETTE.BROWN,
  GY: PALETTE.DARK_GRAY,
  LG: PALETTE.LIGHT_GRAY,
  W:  PALETTE.WHITE,
  R:  PALETTE.RED,
  O:  PALETTE.ORANGE,
  Y:  PALETTE.YELLOW,
  G:  PALETTE.GREEN,
  B:  PALETTE.BLUE,
  I:  PALETTE.INDIGO,
  PK: PALETTE.PINK,
  PE: PALETTE.PEACH,
  CO: PALETTE.CONCRETE,
  CL: PALETTE.CONCRETE_LT,
  CD: PALETTE.CONCRETE_DK,
  ST: PALETTE.STEEL,
  SL: PALETTE.STEEL_LT,
  SD: PALETTE.STEEL_DK,
  GL: PALETTE.GLASS,
  GA: PALETTE.GLASS_LT,
  GR: PALETTE.GRASS,
  GT: PALETTE.GRASS_LT,
  DI: PALETTE.DIRT,
  DL: PALETTE.DIRT_LT,
  WA: PALETTE.WATER,
  WL: PALETTE.WATER_LT,
  RU: PALETTE.RUST,
  RL: PALETTE.RUST_LT,
  SK: PALETTE.SKIN,
  SD2: PALETTE.SKIN_DK,
  GO: PALETTE.GOLD,
  SI: PALETTE.SILVER,

  // New palette shorthands
  SLT: PALETTE.SKIN_LIGHT,
  SM:  PALETTE.SKIN_MED,
  STA: PALETTE.SKIN_TAN,
  SDP: PALETTE.SKIN_DEEP,
  BS:  PALETTE.BRUSHED_STEEL,
  CP:  PALETTE.COPPER,
  BA:  PALETTE.BRASS,
  DI2: PALETTE.DARK_IRON,
  MG:  PALETTE.MOSS_GREEN,
  RO:  PALETTE.RUST_ORANGE,
  WB:  PALETTE.WATER_BLUE,
  CG:  PALETTE.CONCRETE_GR,
  NV:  PALETTE.NAVY,
  TL:  PALETTE.TEAL,
  CR:  PALETTE.CRIMSON,
  WW:  PALETTE.WARM_WHITE,
  DBR: PALETTE.DARK_BROWN,
  LR:  PALETTE.LEATHER,
};

export default PALETTE;
