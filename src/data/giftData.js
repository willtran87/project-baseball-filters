/**
 * Gift item definitions for the Gift Shop feature.
 *
 * Players can buy gifts for NPCs to improve relationships. Each gift has
 * a base relationship bonus modified by per-NPC preference multipliers.
 * Gifts are gated by reputation and have per-NPC cooldowns.
 */

/** Default cooldown (in game days) before the same gift can be given to the same NPC again. */
export const GIFT_COOLDOWN_DEFAULT = 3;

/**
 * @typedef {Object} GiftItem
 * @property {string}  id              - Unique identifier
 * @property {string}  name            - Display name
 * @property {string}  description     - Flavor text
 * @property {number}  cost            - Money price
 * @property {number}  relationshipBonus - Base relationship gain
 * @property {string}  icon            - Emoji icon
 * @property {Object}  npcPreferences  - Per-NPC multiplier overrides (default 1.0x)
 * @property {number}  [reputationReq] - Minimum reputation % to unlock
 * @property {number}  [cooldownDays]  - Per-NPC cooldown in days (default GIFT_COOLDOWN_DEFAULT)
 */

/** @type {GiftItem[]} */
export const GIFT_ITEMS = [
  // ── Budget Tier ($200-$500, +2-4 relationship) ──────────────────────────

  {
    id: 'coffee',
    name: 'Fresh Roast Coffee',
    description: 'A bag of locally roasted stadium blend. Everyone appreciates a good cup.',
    cost: 250,
    relationshipBonus: 3,
    icon: '\u2615',
    npcPreferences: { maggie: 1.5, rusty: 1.3 },
    cooldownDays: 3,
  },
  {
    id: 'baseball_cards',
    name: 'Vintage Baseball Cards',
    description: 'A sleeve of mint-condition cards from Ridgemont\'s golden era.',
    cost: 350,
    relationshipBonus: 3,
    icon: '\uD83C\uDCCF',
    npcPreferences: { diego: 2.0, rusty: 1.5 },
    cooldownDays: 3,
  },
  {
    id: 'notebook',
    name: 'Leather Notebook',
    description: 'Hand-stitched leather journal with cream pages. Perfect for notes or sketches.',
    cost: 300,
    relationshipBonus: 2,
    icon: '\uD83D\uDCD3',
    npcPreferences: { priya: 1.5, bea: 1.3 },
    cooldownDays: 3,
  },
  {
    id: 'snacks',
    name: 'Gourmet Snack Box',
    description: 'An assortment of artisan crackers, cheese, and dried fruit. Hard to say no to.',
    cost: 200,
    relationshipBonus: 2,
    icon: '\uD83C\uDF7F',
    npcPreferences: { diego: 1.3 },
    cooldownDays: 3,
  },

  // ── Mid Tier ($800-$1500, +5-8 relationship, rep >= 30) ─────────────────

  {
    id: 'signed_bat',
    name: 'Signed Baseball Bat',
    description: 'A Louisville Slugger signed by a Raptors legend. The wood still smells like pine tar.',
    cost: 1200,
    relationshipBonus: 7,
    icon: '\uD83C\uDFCF',
    npcPreferences: { diego: 2.0 },
    reputationReq: 30,
    cooldownDays: 5,
  },
  {
    id: 'press_pass',
    name: 'VIP Press Pass',
    description: 'All-access press credentials for the rest of the season. Opens every door.',
    cost: 1000,
    relationshipBonus: 6,
    icon: '\uD83C\uDF9F\uFE0F',
    npcPreferences: { priya: 2.0, fiona: 1.3 },
    reputationReq: 30,
    cooldownDays: 5,
  },
  {
    id: 'toolkit',
    name: 'Premium Maintenance Kit',
    description: 'Professional-grade wrenches, sealant, and a torque driver set. Built to last.',
    cost: 800,
    relationshipBonus: 5,
    icon: '\uD83E\uDDF0',
    npcPreferences: { rusty: 2.0, maggie: 1.3 },
    reputationReq: 30,
    cooldownDays: 5,
  },
  {
    id: 'wine',
    name: 'Fine Stadium Wine',
    description: 'A bottle of reserve red from the vineyard that sponsors the luxury boxes.',
    cost: 1500,
    relationshipBonus: 8,
    icon: '\uD83C\uDF77',
    npcPreferences: { bea: 1.5, fiona: 1.5 },
    reputationReq: 30,
    cooldownDays: 5,
  },

  // ── Premium Tier ($2000-$3500, +10-15 relationship, rep >= 60) ──────────

  {
    id: 'championship_ring',
    name: 'Replica Championship Ring',
    description: 'A faithful replica of the 1987 Ridgemont Raptors championship ring. Heavy, gold-plated, and dripping with nostalgia.',
    cost: 3000,
    relationshipBonus: 12,
    icon: '\uD83D\uDC8D',
    npcPreferences: { diego: 2.0 },
    reputationReq: 60,
    cooldownDays: 7,
  },
  {
    id: 'naming_rights',
    name: 'Section Naming Rights',
    description: 'Name a stadium section after someone special. A permanent tribute etched into Ridgemont\'s history.',
    cost: 3500,
    relationshipBonus: 15,
    icon: '\uD83C\uDFDB\uFE0F',
    npcPreferences: { fiona: 2.0, bea: 1.5 },
    reputationReq: 60,
    cooldownDays: 7,
  },
];
