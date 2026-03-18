/**
 * Story content data — characters, dialogue, events, milestones, and Hank's notes.
 *
 * Every piece of narrative text lives here so writers can iterate without
 * touching game systems. Consumed by StorySystem, DialogueBox, and JournalPanel.
 */

// ─── NPC DATA ───────────────────────────────────────────────────────────────

export const NPC_DATA = {
  maggie: {
    id: 'maggie',
    name: 'Maggie Chen',
    role: 'Stadium Owner',
    themeColor: '#c44040',
    bio: 'Inherited Ridgemont from her father and refuses to let it die. Sharp, pragmatic, and fiercely protective of the stadium\'s legacy.',
    lore: 'Maggie turned down a VP position at a Fortune 500 to run Ridgemont. Her father\'s last words to her were: "Don\'t let them tear it down."',
    portraits: {
      neutral: 'portrait_maggie_neutral',
      happy: 'portrait_maggie_happy',
      angry: 'portrait_maggie_angry',
      worried: 'portrait_maggie_worried',
    },
    relationshipTiers: [
      { tier: 0, name: 'Probationary', threshold: 0, bonuses: [] },
      { tier: 1, name: 'Trusted Employee', threshold: 15, bonuses: ['budgetVisibility'] },
      { tier: 2, name: 'Right Hand', threshold: 35, bonuses: ['budgetVisibility', 'emergencyFunds'] },
      { tier: 3, name: 'Family', threshold: 60, bonuses: ['budgetVisibility', 'emergencyFunds', 'investmentPartner'] },
    ],
  },

  rusty: {
    id: 'rusty',
    name: 'Rusty Kowalski',
    role: 'Head Maintenance',
    themeColor: '#b87333',
    bio: 'Grizzled veteran who\'s kept Ridgemont\'s pipes flowing for 20 years. Gruff exterior, heart of gold. Learned everything from Hank Doolan.',
    lore: 'Rusty once fixed a burst main during the 7th inning stretch using nothing but a belt buckle and a wad of chewing gum. He doesn\'t talk about it, but everyone else does.',
    portraits: {
      neutral: 'portrait_rusty_neutral',
      happy: 'portrait_rusty_happy',
      grumpy: 'portrait_rusty_grumpy',
      worried: 'portrait_rusty_worried',
    },
    relationshipTiers: [
      { tier: 0, name: 'Greenhorn', threshold: 0, bonuses: [] },
      { tier: 1, name: 'Apprentice', threshold: 10, bonuses: ['repairHints'] },
      { tier: 2, name: 'Friend', threshold: 30, bonuses: ['repairHints', 'repairSpeedBoost'] },
      { tier: 3, name: 'Like a Son', threshold: 55, bonuses: ['repairHints', 'repairSpeedBoost', 'failureWarnings'] },
    ],
  },

  victor: {
    id: 'victor',
    name: 'Victor Salazar',
    role: 'Rival Owner',
    themeColor: '#333366',
    bio: 'Wealthy developer who wants Ridgemont\'s land. Charming in public, ruthless behind closed doors.',
    lore: 'Victor\'s grandfather built stadiums. Victor tears them down. He\'s demolished three minor-league parks across the state, each time promising "community revitalization" that never comes.',
    portraits: {
      neutral: 'portrait_victor_neutral',
      smug: 'portrait_victor_smug',
      angry: 'portrait_victor_angry',
      defeated: 'portrait_victor_defeated',
    },
    relationshipTiers: [
      { tier: 0, name: 'Target', threshold: 0, bonuses: [] },
      { tier: 1, name: 'Respected Rival', threshold: 20, bonuses: ['rivalInsight'] },
      { tier: 2, name: 'Wary Truce', threshold: 40, bonuses: ['rivalInsight', 'reducedSabotage'] },
    ],
  },

  priya: {
    id: 'priya',
    name: 'Priya Okafor',
    role: 'Reporter',
    themeColor: '#e8a030',
    bio: 'Local sports journalist with a nose for stories. Covers Ridgemont for the Ridgemont Gazette. Fair but persistent.',
    lore: 'Priya turned down a network TV offer to stay local. She says small-town baseball has better stories than the majors. She\'s been quietly building a file on Victor\'s land deals for months.',
    portraits: {
      neutral: 'portrait_priya_neutral',
      excited: 'portrait_priya_excited',
      skeptical: 'portrait_priya_skeptical',
      sympathetic: 'portrait_priya_sympathetic',
    },
    relationshipTiers: [
      { tier: 0, name: 'Source', threshold: 0, bonuses: [] },
      { tier: 1, name: 'Friendly Contact', threshold: 12, bonuses: ['favorableHeadlines'] },
      { tier: 2, name: 'Ally', threshold: 30, bonuses: ['favorableHeadlines', 'victorTips'] },
      { tier: 3, name: 'Confidant', threshold: 50, bonuses: ['favorableHeadlines', 'victorTips', 'crisisSpinControl'] },
    ],
  },

  bea: {
    id: 'bea',
    name: 'Inspector Bea Thornton',
    role: 'Health Inspector',
    themeColor: '#557755',
    bio: 'By-the-book county health inspector. Intimidating clipboard, impeccable standards. Secretly roots for Ridgemont.',
    lore: 'Bea\'s father took her to Ridgemont games every summer as a kid. She requested this district assignment. She\'ll never admit it, but she wants to see the stadium pass — not just survive.',
    portraits: {
      neutral: 'portrait_bea_neutral',
      satisfied: 'portrait_bea_satisfied',
      concerned: 'portrait_bea_concerned',
      stern: 'portrait_bea_stern',
    },
    relationshipTiers: [
      { tier: 0, name: 'Under Watch', threshold: 0, bonuses: [] },
      { tier: 1, name: 'Compliant', threshold: 15, bonuses: ['inspectionHints'] },
      { tier: 2, name: 'Respected', threshold: 35, bonuses: ['inspectionHints', 'oneDayWarning'] },
      { tier: 3, name: 'Exemplary', threshold: 55, bonuses: ['inspectionHints', 'oneDayWarning', 'victorSchemeReveal'] },
    ],
  },

  diego: {
    id: 'diego',
    name: 'Diego "Clutch" Ramirez',
    role: 'Star Player',
    themeColor: '#4488cc',
    bio: 'The Raptors\' best hitter and clubhouse leader. Energetic, superstitious, and genuinely loves playing at Ridgemont.',
    lore: 'Diego was drafted by three MLB teams and turned them all down. He says Ridgemont\'s air "smells like baseball." He\'s not wrong — that\'s the HVAC.',
    portraits: {
      neutral: 'portrait_diego_neutral',
      pumped: 'portrait_diego_pumped',
      disappointed: 'portrait_diego_disappointed',
      laughing: 'portrait_diego_laughing',
    },
    relationshipTiers: [
      { tier: 0, name: 'Stadium Staff', threshold: 0, bonuses: [] },
      { tier: 1, name: 'Dugout Buddy', threshold: 10, bonuses: ['moraleBoost'] },
      { tier: 2, name: 'Teammate', threshold: 25, bonuses: ['moraleBoost', 'vipIntros'] },
      { tier: 3, name: 'MVP Duo', threshold: 45, bonuses: ['moraleBoost', 'vipIntros', 'attendanceBoost'] },
    ],
  },

  fiona: {
    id: 'fiona',
    name: 'Fiona Park',
    role: 'Sponsor Rep',
    themeColor: '#886699',
    bio: 'Corporate sponsorship coordinator with sharp instincts and a spreadsheet for everything. All business, until she\'s not.',
    lore: 'Fiona grew up in the concession stands — her mom ran the hot dog cart at Ridgemont for 15 years. She went corporate, but she still judges a stadium by its mustard.',
    portraits: {
      neutral: 'portrait_fiona_neutral',
      pleased: 'portrait_fiona_pleased',
      frustrated: 'portrait_fiona_frustrated',
      calculating: 'portrait_fiona_calculating',
    },
    relationshipTiers: [
      { tier: 0, name: 'Prospect', threshold: 0, bonuses: [] },
      { tier: 1, name: 'Partner', threshold: 15, bonuses: ['betterTerms'] },
      { tier: 2, name: 'Preferred Vendor', threshold: 35, bonuses: ['betterTerms', 'exclusiveContracts'] },
      { tier: 3, name: 'Strategic Ally', threshold: 55, bonuses: ['betterTerms', 'exclusiveContracts', 'emergencySponsorship'] },
    ],
  },

  sully: {
    id: 'sully',
    name: 'Sullivan "Sully" McCrankshaw',
    role: 'Underground Fixer',
    themeColor: '#cc5500',
    bio: 'Retired minor-league umpire fired for "creative interpretation of the rulebook." Lives in Ridgemont\'s utility tunnels. Loud, conspiratorial, and wildly unreliable in execution.',
    lore: 'Sully umpired in the Coastal League for twelve years before a controversial call at the Millhaven Mudcats championship got him banned. When Victor Salazar demolished the Mudcats stadium a year later, Sully took it personally. He\'s been living in Ridgemont\'s underground tunnels ever since, waiting for a chance to settle the score.',
    portraits: {
      neutral: 'portrait_sully_neutral',
      scheming: 'portrait_sully_scheming',
      excited: 'portrait_sully_excited',
      caught: 'portrait_sully_caught',
    },
    relationshipTiers: [
      { tier: 0, name: 'Suspicious Stranger', threshold: 0, bonuses: [] },
      { tier: 1, name: 'Dugout Acquaintance', threshold: 12, bonuses: ['schemeAccess'] },
      { tier: 2, name: 'Bench Coach', threshold: 30, bonuses: ['schemeAccess', 'betterOdds'] },
      { tier: 3, name: 'Battery Mate', threshold: 50, bonuses: ['schemeAccess', 'betterOdds', 'grandSlam'] },
      { tier: 4, name: 'Hall of Famer', threshold: 75, bonuses: ['schemeAccess', 'betterOdds', 'grandSlam', 'sullyInsurance'] },
    ],
  },
};

// ─── HANK'S HIDDEN NOTES ────────────────────────────────────────────────────

export const HANK_NOTES = [
  {
    id: 'hank_note_1',
    trigger: { type: 'repairCount', value: 5 },
    title: 'Duct-Taped Warning',
    content:
      'If you\'re reading this, they finally hired somebody. Listen — the east drainage manifold has a hairline fracture I\'ve been patching for two years. Don\'t trust it past a heavy rain. I tried to tell them, but "Duct Tape" Doolan doesn\'t get meetings with the owner. He gets memos slid under the door. —H.D.',
    effect: { type: 'systemWarning', target: 'drainage', bonus: 'earlyWarningEastDrain' },
  },
  {
    id: 'hank_note_2',
    trigger: { type: 'day', value: 15 },
    title: 'The Real Budget',
    content:
      'They cut the maintenance budget three years running. Said fans don\'t notice pipes. Know what fans notice? Standing in two inches of sewage water in the men\'s room on Dollar Dog Night. I kept receipts. Every dime I spent out of pocket is in the blue binder, if they haven\'t thrown it out. —H.D.',
    effect: { type: 'money', value: 500 },
  },
  {
    id: 'hank_note_3',
    trigger: { type: 'day', value: 20, chapter: 2 },
    title: 'Vendor Contacts',
    content:
      'My supplier list. Circle K Plumbing is a ripoff — they overcharge by 40% and donate to city council campaigns. Coincidence? Sure. Use Martinez Industrial on 5th Street instead. Tell \'em Hank sent you and they\'ll knock 15% off copper fittings. —H.D.',
    effect: { type: 'discount', target: 'plumbing', percent: 15 },
  },
  {
    id: 'hank_note_4',
    trigger: { type: 'chapter', value: 3, extraCondition: 'foundMaintenanceCloset' },
    title: 'The Hidden Stash',
    content:
      'Behind the false wall in maintenance closet B — yeah, I built a false wall, sue me — there\'s $2,000 in emergency parts I\'ve been squirreling away. New gaskets, a spare pump impeller, and enough PVC cement to replumb a submarine. Use it wisely. —H.D.',
    effect: { type: 'money', value: 2000 },
  },
  {
    id: 'hank_note_5',
    trigger: { type: 'day', value: 15, chapter: 3, extraCondition: 'foundMaintenanceCloset' },
    title: 'The Doolan Integration Blueprint',
    content:
      'I spent three years drawing this up nights. An integrated bypass that connects the cooling loop to the drainage return — recaptures waste heat, reduces operating costs by ten percent, maybe more. Nobody would fund it. Maybe you\'ll have better luck.\n\n[Detailed engineering schematic attached]',
    effect: { type: 'costReduction', target: 'all', percent: 10 },
  },
  {
    id: 'hank_note_6',
    trigger: { type: 'inspection', value: 'gradeA' },
    title: 'Congratulations, Kid',
    content:
      'If you\'re reading this one, it means you got the A. I never managed it. Closest I got was a B+ and Thornton — good inspector, by the way, actual straight shooter — told me the air scrubbers were 2% below code in Section 14. Two percent. I went home and drank a beer about it. You earned this. —H.D.',
    effect: { type: 'reputation', value: 2 },
  },
  {
    id: 'hank_note_7',
    trigger: { type: 'chapter', value: 4 },
    title: 'About Victor Salazar',
    content:
      'I know about Salazar. He came to me once, year before the Browntide. Offered me five grand to "let things slide" on game days when his investors were visiting. Wanted Ridgemont to look bad. I told him where he could slide that offer. The Browntide wasn\'t his fault — that was the old pipes finally giving out — but he sure as hell used it. Watch your back. —H.D.',
    effect: { type: 'flag', id: 'hankKnewVictor' },
  },
  {
    id: 'hank_note_8',
    trigger: { type: 'allNotesFound', value: true },
    title: 'The Last Note (Taped Inside the Boiler)',
    content:
      'You found them all. You\'re thorough — I respect that. One more thing. The woman who designed the original filtration layout for Ridgemont back in \'84? Her name was Elena Peralta. She was a genius. The whole integrated drainage-to-cooling concept in my blueprint? That was her idea first. I just finished what she started.\n\nTake care of this place, kid. It\'s more yours than you know.\n—Hank "Duct Tape" Doolan',
    effect: { type: 'flag', id: 'nanaPeraltaReveal' },
  },
];

// ─── STORY CHAPTERS ─────────────────────────────────────────────────────────

export const STORY_CHAPTERS = [
  {
    id: 1,
    name: 'New Kid on the Field',
    repRange: [21, 40],
    openingEventId: 'ch1_opening',
    description: 'Casey "Pipes" Peralta arrives at Ridgemont Stadium — a crumbling Minor League park held together by duct tape and prayers. The previous maintenance manager left behind a mess, an angry owner, and a stadium one bad day from condemnation.',
  },
  {
    id: 2,
    name: 'Rising Through the Ranks',
    repRange: [41, 55],
    openingEventId: 'ch2_opening',
    description: 'Ridgemont earns its first real sponsor. The crowds are growing. But Victor Salazar is circling, and keeping a stadium running is a lot harder when someone is actively trying to tear it down.',
  },
  {
    id: 3,
    name: 'Storm Warning',
    repRange: [56, 70],
    openingEventId: 'ch3_opening',
    description: 'Maggie reveals the stakes: two seasons to profitability or Ridgemont gets sold. Casey discovers the previous manager\'s hidden legacy — and a conspiracy that goes deeper than bad plumbing.',
  },
  {
    id: 4,
    name: 'Into the Fire',
    repRange: [71, 85],
    openingEventId: 'ch4_opening',
    description: 'Victor makes his move. The city council vote looms. Rusty gets a job offer. Everything Casey has built is tested by the worst storm season in Ridgemont history.',
  },
  {
    id: 5,
    name: 'Championship',
    repRange: [86, 100],
    openingEventId: 'ch5_opening',
    description: 'The Raptors are in contention. A championship game is awarded to Ridgemont. Victor plays his last card. Everything comes down to five games and the invisible work that makes them possible.',
  },
];

// ─── STORY EVENTS ───────────────────────────────────────────────────────────

export const STORY_EVENTS = [
  // ── CHAPTER 1 ─────────────────────────────────────────────────────────

  {
    id: 'ch1_opening',
    trigger: { type: 'gameStart', chapter: 1 },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'RIDGEMONT STADIUM — 7:14 AM', emotion: null },
      { speaker: null, portrait: null, text: 'The parking lot is cracked. The sign is missing two letters. Somewhere inside, a pipe is dripping.', emotion: null },
      { speaker: 'maggie', portrait: 'neutral', text: 'You must be Peralta. You\'re early. That\'s either a good sign or you\'re lost.', emotion: 'neutral' },
      { speaker: 'casey', portrait: null, text: 'Casey Peralta, ma\'am. Reporting for duty.', emotion: null },
      { speaker: 'maggie', portrait: 'neutral', text: 'Skip the "ma\'am." I\'m Maggie Chen. I own this beautiful disaster. Walk with me.', emotion: 'neutral' },
      { speaker: 'maggie', portrait: 'worried', text: 'Your predecessor — Hank Doolan — was here thirty years. Good man, terrible at asking for help. After the Browntide...', emotion: 'worried' },
      { speaker: 'maggie', portrait: 'angry', text: 'Televised sewage overflow. Trending on social media for a week. We lost two sponsors and the health department nearly shut us down.', emotion: 'angry' },
      { speaker: 'maggie', portrait: 'neutral', text: 'I need someone who can keep this place alive while I figure out if it\'s worth saving. No pressure.', emotion: 'neutral' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'metMaggie', value: true },
      { type: 'relationship', npc: 'maggie', delta: 2 },
      { type: 'triggerEvent', id: 'ch1_meet_rusty', delay: 0 },
    ],
  },

  {
    id: 'ch1_meet_rusty',
    trigger: { type: 'afterEvent', eventId: 'ch1_opening', chapter: 1 },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'rusty', portrait: 'grumpy', text: 'So you\'re the new kid. Hm. You look like you\'ve never seen a gasket in your life.', emotion: 'grumpy' },
      { speaker: 'casey', portrait: null, text: 'Six years in commercial HVAC, sir.', emotion: null },
      { speaker: 'rusty', portrait: 'grumpy', text: 'Six years in strip mall air conditioners don\'t prepare you for a building that sweats more than the players. But fine. I\'m Rusty. I\'ve been keeping this heap standing since before you were born.', emotion: 'grumpy' },
      { speaker: 'rusty', portrait: 'neutral', text: 'Rule one: everything in this stadium is connected. The air feeds the water feeds the drains feeds the air. Break the chain, the whole thing falls apart.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'neutral', text: 'Rule two: game days wait for nobody. When 15,000 people walk through those gates, every pipe, every filter, every drain better be singing.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'happy', text: 'Rule three: don\'t touch my coffee maker. That\'s non-negotiable.', emotion: 'happy' },
    ],
    choices: [
      {
        text: '"Got it, Rusty. Show me the worst of it."',
        effects: [
          { type: 'relationship', npc: 'rusty', delta: 3 },
          { type: 'flag', id: 'rustyRespectEarned', value: true },
        ],
      },
      {
        text: '"I\'ve handled worse than this."',
        effects: [
          { type: 'relationship', npc: 'rusty', delta: -1 },
          { type: 'flag', id: 'rustySkeptical', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'metRusty', value: true },
      { type: 'startTutorial', value: true },
    ],
  },

  {
    id: 'ch1_rusty_challenge',
    trigger: { type: 'day', value: 3, chapter: 1, requireFlags: ['metRusty'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'rusty', portrait: 'neutral', text: 'Alright, kid. First real game day is tomorrow. Full house — well, Minor League full, so maybe half a house.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'grumpy', text: 'Here\'s your test: keep every system above the red line through nine innings. No help from me. I\'ll be watching from the catwalk with my coffee.', emotion: 'grumpy' },
      { speaker: 'rusty', portrait: 'happy', text: 'If you pull it off, I\'ll stop calling you "kid." Maybe.', emotion: 'happy' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'rustyChallengeActive', value: true },
    ],
  },

  {
    id: 'ch1_victor_voicemail',
    trigger: { type: 'day', value: 8, chapter: 1, requireFlags: ['metMaggie'] },
    delivery: 'notification',
    pauseGame: false,
    dialogue: [
      { speaker: 'casey', portrait: null, text: '[Overheard on Maggie\'s speakerphone while passing her office]', emotion: null },
      { speaker: 'victor', portrait: 'smug', text: '"Maggie, darling. Victor Salazar. I hear you hired some kid fresh out of an HVAC van. Bold move. Listen — my offer still stands. Ridgemont\'s lot is worth more as condos than it\'ll ever be as a ballpark. Call me before the next inspection. You know the number."', emotion: 'smug' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'victorThreatRevealed', value: true },
    ],
  },

  {
    id: 'ch1_priya_interview',
    trigger: { type: 'reputation', value: 38, requireFlags: ['victorThreatRevealed'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'priya', portrait: 'excited', text: 'Casey Peralta? Priya Okafor, Ridgemont Herald. Quick question — or twelve. You\'ve turned this place around in weeks. What\'s the secret?', emotion: 'excited' },
      { speaker: 'casey', portrait: null, text: '...', emotion: null },
      { speaker: 'priya', portrait: 'neutral', text: 'C\'mon, give me something. My editor wants a puff piece, but between you and me, I\'m digging into Victor Salazar\'s development deal. Your stadium is right in his crosshairs.', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"Just doing the work, one filter at a time." [Humble]',
        effects: [
          { type: 'reputation', delta: 1 },
          { type: 'relationship', npc: 'priya', delta: 2 },
          { type: 'flag', id: 'humbleInterview', value: true },
        ],
      },
      {
        text: '"Ridgemont is going to be the cleanest stadium in the league." [Bold]',
        effects: [
          { type: 'reputation', delta: 3 },
          { type: 'relationship', npc: 'priya', delta: 1 },
          { type: 'flag', id: 'boldInterview', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'metPriya', value: true },
    ],
  },

  {
    id: 'ch1_climax',
    trigger: { type: 'reputation', value: 39, requireFlags: ['metPriya'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'rusty', portrait: 'worried', text: 'Kid — heads up. Inspection tomorrow, weather service says thunderstorms, and we\'ve got a weekend game. All at once.', emotion: 'worried' },
      { speaker: 'rusty', portrait: 'grumpy', text: 'I\'ve seen this stadium buckle under less. The east drainage manifold is sketchy, the air scrubbers need new filters, and we\'re down to our last spare pump.', emotion: 'grumpy' },
      { speaker: 'maggie', portrait: 'worried', text: 'No pressure, Peralta, but if we fail this inspection after the Browntide press... I won\'t have a choice about Victor\'s offer.', emotion: 'worried' },
    ],
    choices: [
      {
        text: '"We\'ll be ready. Rusty, let\'s go over every system tonight."',
        effects: [
          { type: 'relationship', npc: 'rusty', delta: 3 },
          { type: 'relationship', npc: 'maggie', delta: 2 },
        ],
      },
      {
        text: '"One crisis at a time. What\'s our priority list?"',
        effects: [
          { type: 'relationship', npc: 'rusty', delta: 1 },
          { type: 'relationship', npc: 'maggie', delta: 1 },
          { type: 'flag', id: 'pragmaticApproach', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'triggerInspection', delay: 1 },
      { type: 'triggerWeather', weatherType: 'Heavy Rain', delay: 1 },
    ],
  },

  {
    id: 'ch1_first_gameday',
    trigger: { type: 'day', value: 5, chapter: 1, requireFlags: ['metRusty'] },
    delivery: 'dialogue',
    pauseGame: false,
    dialogue: [
      { speaker: 'rusty', portrait: 'neutral', text: 'Hear that rumble? That\'s the crowd filling in. First real game under your watch.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'grumpy', text: 'The restrooms are going to take a beating in the fourth inning. Always do. Dollar Dog Night.', emotion: 'grumpy' },
      { speaker: 'casey', portrait: null, text: 'Dollar Dog Night?', emotion: null },
      { speaker: 'rusty', portrait: 'neutral', text: 'Cheap hot dogs, expensive plumbing bills. Welcome to Minor League baseball.', emotion: 'neutral' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'firstGameDayExperienced', value: true },
    ],
  },

  {
    id: 'ch1_bea_intro',
    trigger: { type: 'day', value: 12, chapter: 1, requireFlags: ['metRusty'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'bea', portrait: 'neutral', text: 'Casey Peralta? Inspector Bea Thornton, County Health Department. I\'m here for your baseline evaluation.', emotion: 'neutral' },
      { speaker: 'bea', portrait: 'stern', text: 'I want to be clear: this is not adversarial. My job is to ensure that 15,000 people can eat, drink, and breathe safely in this building. Your job is to make that possible.', emotion: 'stern' },
      { speaker: 'bea', portrait: 'neutral', text: 'I\'ll be examining air quality, water purity, drainage capacity, and HVAC performance. Show me your mechanical room, please.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'neutral', text: '[Whispering] She\'s tough but fair. Don\'t argue with the clipboard. The clipboard always wins.', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"I\'ll give you the full tour. We have nothing to hide."',
        effects: [
          { type: 'relationship', npc: 'bea', delta: 3 },
        ],
      },
      {
        text: '"Can we start with the areas we\'ve already upgraded?"',
        effects: [
          { type: 'relationship', npc: 'bea', delta: -1 },
          { type: 'flag', id: 'triedToSteerBea', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'metBea', value: true },
    ],
  },

  // ── CHAPTER 2 ─────────────────────────────────────────────────────────

  {
    id: 'ch2_opening',
    trigger: { type: 'reputation', value: 41, chapter: 2 },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'CHAPTER 2: RISING THROUGH THE RANKS', emotion: null },
      { speaker: null, portrait: null, text: 'The Browntide is old news. Ridgemont is climbing the league standings. The parking lot still has cracks, but the sign has all its letters now.', emotion: null },
      { speaker: 'maggie', portrait: 'happy', text: 'Single-A, Peralta. First time in five years. Sponsors are starting to sniff around, and I don\'t mean the restrooms this time.', emotion: 'happy' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'chapter2Started', value: true },
    ],
  },

  {
    id: 'ch2_fiona_arrival',
    trigger: { type: 'afterEvent', eventId: 'ch2_opening', chapter: 2 },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'fiona', portrait: 'neutral', text: 'Casey Peralta? Fiona Park, GreenLeaf Brands. I\'ll cut to it — we want to sponsor Ridgemont. Our logo on the scoreboard, our name on the concession cups.', emotion: 'neutral' },
      { speaker: 'fiona', portrait: 'calculating', text: 'The terms: maintain water purity above 70% for ten consecutive games. In exchange, $1,500 per game. Fall below, and the contract terminates with a penalty clause.', emotion: 'calculating' },
      { speaker: 'fiona', portrait: 'neutral', text: 'Standard boilerplate. Nothing personal. Do we have a deal?', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"Deal. 70% is our floor, not our ceiling."',
        effects: [
          { type: 'relationship', npc: 'fiona', delta: 3 },
          { type: 'flag', id: 'greenleafContract', value: true },
          { type: 'money', delta: 0 },
        ],
      },
      {
        text: '"Can we negotiate the threshold down to 65%?"',
        effects: [
          { type: 'relationship', npc: 'fiona', delta: -1 },
          { type: 'flag', id: 'greenleafNegotiated', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'metFiona', value: true },
    ],
  },

  {
    id: 'ch2_diego_intro',
    trigger: { type: 'day', value: 5, chapter: 2, requireFlags: ['chapter2Started'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'diego', portrait: 'pumped', text: 'Hey! You\'re the filter wizard, right? Diego Ramirez. The guys call me Clutch. You know why?', emotion: 'pumped' },
      { speaker: 'casey', portrait: null, text: 'Because you perform in high-pressure situations?', emotion: null },
      { speaker: 'diego', portrait: 'laughing', text: 'Ha! No, because I broke the clutch on the team bus twice. But also the pressure thing! Listen — the boys and I, we notice the difference. Used to be you\'d walk into the clubhouse and the air tasted like old socks and regret.', emotion: 'laughing' },
      { speaker: 'diego', portrait: 'neutral', text: 'Now it\'s just old socks. That\'s a home run in my book. Seriously though — happy players play better. Keep the air clean and the water running, and I\'ll make sure the team knows who to thank.', emotion: 'neutral' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'metDiego', value: true },
      { type: 'relationship', npc: 'diego', delta: 5 },
    ],
  },

  {
    id: 'ch2_diego_field',
    trigger: { type: 'day', value: 10, chapter: 2, requireFlags: ['metDiego'] },
    delivery: 'dialogue',
    pauseGame: false,
    dialogue: [
      { speaker: 'diego', portrait: 'disappointed', text: 'Pipes, we\'ve got a problem. Third base line is turning into a swamp. Coach says the infield drains might be clogged.', emotion: 'disappointed' },
      { speaker: 'diego', portrait: 'neutral', text: 'Our shortstop twisted his ankle yesterday in the mud. If we lose another guy, we\'re fielding the bat boy.', emotion: 'neutral' },
      { speaker: 'casey', portrait: null, text: 'I\'ll check the field drainage system.', emotion: null },
      { speaker: 'diego', portrait: 'pumped', text: 'My man! Fix the field and I\'ll dedicate my next homer to you. I\'ll point at the mechanical room and everything.', emotion: 'pumped' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'fieldDrainageWarning', value: true },
    ],
  },

  {
    id: 'ch2_maggie_budget',
    trigger: { type: 'day', value: 12, chapter: 2, requireFlags: ['chapter2Started'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'maggie', portrait: 'neutral', text: 'Peralta, sit down. Let\'s talk money.', emotion: 'neutral' },
      { speaker: 'maggie', portrait: 'worried', text: 'Revenue is up 18% since you started. That sounds great until you realize we were 18% below survival. We\'re treading water.', emotion: 'worried' },
      { speaker: 'maggie', portrait: 'neutral', text: 'The board wants to see a path to profitability. I need you to pick your battles — upgrade what matters most and let the rest hold.', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"Focus spending on fan-facing systems — air and water quality."',
        effects: [
          { type: 'relationship', npc: 'maggie', delta: 2 },
          { type: 'flag', id: 'prioritizedFanSystems', value: true },
        ],
      },
      {
        text: '"Invest in drainage and infrastructure. Prevent the next disaster."',
        effects: [
          { type: 'relationship', npc: 'maggie', delta: 1 },
          { type: 'flag', id: 'prioritizedInfrastructure', value: true },
        ],
      },
    ],
    onComplete: [],
  },

  {
    id: 'ch2_meet_sully',
    trigger: { type: 'day', value: 14, chapter: 2, requireFlags: ['victorThreatRevealed'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: '(Deep in the underground tunnels, behind a tangle of old pipes, you hear someone muttering...)', emotion: null },
      { speaker: 'sully', portrait: 'neutral', text: 'Hey! HEY! You — the kid with the wrench. Yeah, you. Don\'t move.', emotion: 'neutral' },
      { speaker: 'casey', portrait: null, text: '...Who are you? How did you get down here?', emotion: null },
      { speaker: 'sully', portrait: 'scheming', text: 'Name\'s Sullivan McCrankshaw. Sully. Former umpire, current... let\'s call it "independent operations consultant." I\'ve been living in these tunnels since Ridgemont stopped locking the maintenance hatches. Which was never.', emotion: 'scheming' },
      { speaker: 'sully', portrait: 'excited', text: 'I heard you\'re the one giving Victor Salazar heartburn. Is that true? Because if so, you and I need to talk.', emotion: 'excited' },
      { speaker: 'sully', portrait: 'neutral', text: 'That man demolished the Millhaven Mudcats stadium. My home park. The place I called balls and strikes for twelve years. Turned it into a PARKING LOT.', emotion: 'neutral' },
      { speaker: 'sully', portrait: 'scheming', text: 'I\'ve been waiting for someone with the guts to fight back. You keep doing what you\'re doing, and when you\'re ready to go on offense... come find me. I\'ll be down here. I\'m always down here.', emotion: 'scheming' },
    ],
    choices: [
      {
        text: '"You\'re living in our tunnels? That\'s... a lot to process."',
        effects: [
          { type: 'relationship', npc: 'sully', delta: 2 },
        ],
      },
      {
        text: '"Tell me more about what happened to the Mudcats."',
        effects: [
          { type: 'relationship', npc: 'sully', delta: 3 },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'sullyUnlocked', value: true },
      { type: 'flag', id: 'metSully', value: true },
    ],
  },

  {
    id: 'ch2_victor_poaches',
    trigger: { type: 'day', value: 15, chapter: 2, requireFlags: ['metFiona'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'fiona', portrait: 'frustrated', text: 'Peralta, we have a problem. GreenLeaf got a counter-offer from Glendale — Victor Salazar\'s park. They\'re offering double our rate and a luxury box package.', emotion: 'frustrated' },
      { speaker: 'fiona', portrait: 'calculating', text: 'Corporate is "reconsidering the portfolio allocation." Translation: they\'re thinking of dropping us. I need you to keep those numbers pristine or I can\'t fight for Ridgemont at the next board meeting.', emotion: 'calculating' },
      { speaker: 'maggie', portrait: 'angry', text: 'Salazar. Of course. He can\'t beat us on the field, so he goes after the wallet.', emotion: 'angry' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'victorPoachedSponsor', value: true },
    ],
  },

  {
    id: 'ch2_climax_rivalry',
    trigger: { type: 'reputation', value: 54, chapter: 2, requireFlags: ['victorPoachedSponsor'] },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'RIVALRY GAME — GLENDALE GRIZZLIES AT RIDGEMONT', emotion: null },
      { speaker: 'diego', portrait: 'pumped', text: 'Full house tonight. Victor Salazar is in the luxury box, probably measuring the walls for drywall samples. Let\'s show him what Ridgemont is made of.', emotion: 'pumped' },
      { speaker: 'rusty', portrait: 'neutral', text: 'Systems are green across the board. First time I\'ve said that on a game day in... actually, first time ever. Don\'t make me regret it.', emotion: 'neutral' },
      { speaker: 'victor', portrait: 'smug', text: '[From the luxury box PA] Nice little park you\'ve got here, Maggie. Enjoy it while it lasts.', emotion: 'smug' },
      { speaker: 'maggie', portrait: 'angry', text: 'Peralta — not a single system drops below threshold tonight. That man does not get to walk out of here with ammunition.', emotion: 'angry' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'rivalryGameComplete', value: true },
      { type: 'triggerGameDay', gameDayType: 'rivalryGame' },
    ],
  },

  // ── CHAPTER 3 ─────────────────────────────────────────────────────────

  {
    id: 'ch3_opening',
    trigger: { type: 'reputation', value: 56, chapter: 3 },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'CHAPTER 3: STORM WARNING', emotion: null },
      { speaker: null, portrait: null, text: 'Double-A. The stands are filling. The systems are humming. But under the surface, cracks are forming — in the concrete and in the balance sheet.', emotion: null },
      { speaker: 'maggie', portrait: 'worried', text: 'Close the door, Peralta. What I\'m about to tell you doesn\'t leave this office.', emotion: 'worried' },
      { speaker: 'maggie', portrait: 'worried', text: 'I\'m underwater. The mortgage, the Browntide repairs, the insurance hike — I\'ve got two seasons to turn a profit or the bank calls the note. And guess who\'s been buying up our debt?', emotion: 'worried' },
      { speaker: 'casey', portrait: null, text: 'Salazar.', emotion: null },
      { speaker: 'maggie', portrait: 'angry', text: 'Give the kid a gold star. If I default, he gets Ridgemont for pennies on the dollar. So no — we don\'t just need to survive. We need to thrive.', emotion: 'angry' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'chapter3Started', value: true },
      { type: 'flag', id: 'mortgageCrisisRevealed', value: true },
    ],
  },

  {
    id: 'ch3_hank_closet',
    trigger: { type: 'day', value: 10, chapter: 3, requireFlags: ['chapter3Started'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'rusty', portrait: 'neutral', text: 'Huh. This closet\'s been locked since Hank left. Key was behind the boiler — classic Doolan. Let\'s see what the old man was hiding.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'happy', text: 'Well, I\'ll be. Spare parts, neatly labeled. A stack of notes. And... blueprints? Hank, you clever old dog.', emotion: 'happy' },
      { speaker: 'rusty', portrait: 'neutral', text: 'These notes are addressed to whoever replaced him. Guess that\'s you, kid. He knew he wasn\'t coming back.', emotion: 'neutral' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'foundMaintenanceCloset', value: true },
      { type: 'money', delta: 2000 },
    ],
  },

  {
    id: 'ch3_bea_reveals',
    trigger: { type: 'day', value: 20, chapter: 3, requireFlags: ['chapter3Started'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'bea', portrait: 'concerned', text: 'Peralta. A word. Off the record — and I want to be clear, this conversation is highly irregular and I do not make a habit of it.', emotion: 'concerned' },
      { speaker: 'bea', portrait: 'stern', text: 'Someone has been filing anonymous code complaints against Ridgemont. Fourteen in the last two months. Each one triggers a mandatory review that costs my department resources and costs you time.', emotion: 'stern' },
      { speaker: 'bea', portrait: 'concerned', text: 'The complaints originate from a PO Box registered to Salazar Development LLC. I cannot officially tell you this. But I believe in fair play, and what is happening is not fair play.', emotion: 'concerned' },
      { speaker: 'bea', portrait: 'neutral', text: 'Keep your systems above code. Give me nothing to find. That is how you fight this.', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"Thank you, Inspector. We\'ll be spotless."',
        effects: [
          { type: 'relationship', npc: 'bea', delta: 5 },
          { type: 'flag', id: 'beaAlly', value: true },
        ],
      },
      {
        text: '"Can you testify about Victor\'s complaints?"',
        effects: [
          { type: 'relationship', npc: 'bea', delta: -2 },
          { type: 'flag', id: 'pushedBea', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'victorComplaintsRevealed', value: true },
    ],
  },

  {
    id: 'ch3_priya_investigation',
    trigger: { type: 'day', value: 25, chapter: 3, requireFlags: ['victorComplaintsRevealed'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'priya', portrait: 'excited', text: 'Casey! I\'ve been digging into Victor\'s development deal. It goes deeper than we thought.', emotion: 'excited' },
      { speaker: 'priya', portrait: 'neutral', text: 'He\'s buying up properties around Ridgemont — the parking lot across the street, the old warehouse on Elm. He\'s assembling a city block.', emotion: 'neutral' },
      { speaker: 'priya', portrait: 'skeptical', text: 'But here\'s the thing: his plans only work if Ridgemont fails. The whole development hinges on this parcel. Without it, his investors walk.', emotion: 'skeptical' },
      { speaker: 'priya', portrait: 'neutral', text: 'I can publish this, but it\'ll put a target on both of us. Your call.', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"Publish it. The public deserves to know."',
        effects: [
          { type: 'relationship', npc: 'priya', delta: 5 },
          { type: 'relationship', npc: 'victor', delta: -5 },
          { type: 'reputation', delta: 2 },
          { type: 'flag', id: 'victorExposed', value: true },
        ],
      },
      {
        text: '"Hold it. We need more evidence before we go public."',
        effects: [
          { type: 'relationship', npc: 'priya', delta: -2 },
          { type: 'flag', id: 'waitedOnEvidence', value: true },
        ],
      },
    ],
    onComplete: [],
  },

  {
    id: 'ch3_rusty_memory',
    trigger: { type: 'day', value: 25, chapter: 3, requireFlags: ['foundMaintenanceCloset'] },
    delivery: 'dialogue',
    pauseGame: false,
    dialogue: [
      { speaker: 'rusty', portrait: 'neutral', text: 'You know, kid, finding Hank\'s closet brought back some memories.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'happy', text: 'He used to say, "Rusty, the day this stadium stops surprising me is the day I retire." Guess it never stopped surprising him.', emotion: 'happy' },
      { speaker: 'rusty', portrait: 'neutral', text: 'He was better than they gave him credit for. He just didn\'t have the budget. Or the backing. Or the staff. He had duct tape and stubbornness.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'grumpy', text: 'Don\'t end up like Hank, kid. Ask for what you need. And if they say no, ask louder.', emotion: 'grumpy' },
    ],
    choices: [],
    onComplete: [
      { type: 'relationship', npc: 'rusty', delta: 2 },
    ],
  },

  {
    id: 'ch3_climax',
    trigger: { type: 'reputation', value: 68, chapter: 3 },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'COMMUNITY RALLY DAY — RIDGEMONT STADIUM', emotion: null },
      { speaker: 'diego', portrait: 'pumped', text: 'Standing room only, Pipes! The whole town showed up. This is what a grand slam feels like — except nobody swung a bat.', emotion: 'pumped' },
      { speaker: 'priya', portrait: 'excited', text: 'Front page tomorrow, Casey. "Ridgemont Rising" — my editor green-lit 1,500 words. You\'re making me look good.', emotion: 'excited' },
      { speaker: 'rusty', portrait: 'worried', text: 'Don\'t celebrate yet. Weather radar looks ugly. Thunderstorm cell moving in fast — we\'ve got maybe two hours before it hits.', emotion: 'worried' },
      { speaker: 'maggie', portrait: 'neutral', text: 'Then we have two hours to make sure every system in this building is ready. This is our moment, people. Don\'t let a little rain wash it away.', emotion: 'neutral' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'communityRallyStarted', value: true },
      { type: 'triggerWeather', weatherType: 'Heavy Rain', delay: 2 },
    ],
  },

  // ── CHAPTER 4 ─────────────────────────────────────────────────────────

  {
    id: 'ch4_opening',
    trigger: { type: 'reputation', value: 71, chapter: 4 },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'CHAPTER 4: INTO THE FIRE', emotion: null },
      { speaker: null, portrait: null, text: 'Triple-A. Ridgemont is in the conversation. The systems are sophisticated, the staff is experienced, and the fans believe again. Which is exactly when things get dangerous.', emotion: null },
      { speaker: 'victor', portrait: 'neutral', text: 'Peralta. Sit down. I want to talk to you — professional to professional.', emotion: 'neutral' },
      { speaker: 'victor', portrait: 'smug', text: 'I\'ve been watching you work. Frankly, you\'re wasted on this place. I\'m building a state-of-the-art facility in Glendale — fully integrated systems, unlimited budget, the works.', emotion: 'smug' },
      { speaker: 'victor', portrait: 'smug', text: 'Come work for me. Triple your salary. No more duct tape and prayers. You\'d have resources Maggie can\'t dream of.', emotion: 'smug' },
    ],
    choices: [
      {
        text: '"I\'m loyal to Ridgemont. The answer is no."',
        effects: [
          { type: 'reputation', delta: 3 },
          { type: 'relationship', npc: 'maggie', delta: 5 },
          { type: 'relationship', npc: 'victor', delta: -5 },
          { type: 'flag', id: 'refusedVictor', value: true },
        ],
      },
      {
        text: '"Let me think about it." [Stall]',
        effects: [
          { type: 'flag', id: 'stalledVictor', value: true },
        ],
      },
      {
        text: '"Tell me more about this facility." [Accept — leads to bad ending]',
        effects: [
          { type: 'flag', id: 'acceptedVictor', value: true },
          { type: 'reputation', delta: -10 },
          { type: 'relationship', npc: 'maggie', delta: -20 },
          { type: 'relationship', npc: 'rusty', delta: -15 },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'chapter4Started', value: true },
    ],
  },

  {
    id: 'ch4_storm_century',
    trigger: { type: 'day', value: 10, chapter: 4, requireFlags: ['chapter4Started'] },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'STORM OF THE CENTURY — DAY 1 OF 3', emotion: null },
      { speaker: 'rusty', portrait: 'worried', text: 'Kid, I\'ve been here thirty-five years. I\'ve never seen a forecast like this. Three days of sustained thunderstorms, wind gusts up to 60 mph, and a flash flood watch.', emotion: 'worried' },
      { speaker: 'rusty', portrait: 'grumpy', text: 'Every system in this building is going to be tested. The drainage won\'t be enough — we need to pre-stage pumps and pray the backup generators hold.', emotion: 'grumpy' },
      { speaker: 'maggie', portrait: 'neutral', text: 'We have two games during that window. Canceling costs us $40,000 in lost revenue and a league fine. Playing through it risks everything.', emotion: 'neutral' },
      { speaker: 'casey', portrait: null, text: 'Then we play through it.', emotion: null },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'stormCenturyActive', value: true },
      { type: 'triggerWeather', weatherType: 'Heavy Rain', duration: 3 },
    ],
  },

  {
    id: 'ch4_rusty_offer',
    trigger: { type: 'day', value: 20, chapter: 4, requireFlags: ['chapter4Started'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'rusty', portrait: 'worried', text: 'Kid... I gotta tell you something. Glendale offered me a job. Head of Maintenance. New building, new systems, half the headaches.', emotion: 'worried' },
      { speaker: 'rusty', portrait: 'neutral', text: 'I\'m sixty-two. My knees sound like a popcorn machine on stairs. This place has given me thirty-five good years and about a thousand bad ones.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'worried', text: 'But it\'s Ridgemont. I bled into these walls — literally, twice. I don\'t know what to do, kid.', emotion: 'worried' },
    ],
    choices: [
      {
        text: '"You deserve the easier job. Go with my blessing." [Let him go]',
        effects: [
          { type: 'relationship', npc: 'rusty', delta: 5 },
          { type: 'flag', id: 'rustyLeft', value: true },
        ],
      },
      {
        text: '"Ridgemont needs you. I need you. I\'ll talk to Maggie about a raise." [$500/day]',
        effects: [
          { type: 'relationship', npc: 'rusty', delta: 8 },
          { type: 'money', delta: -500 },
          { type: 'flag', id: 'rustyStayed_raise', value: true },
        ],
      },
      {
        text: '"Remember what you told me on day one? This place is alive. You\'re part of that."',
        effects: [
          { type: 'relationship', npc: 'rusty', delta: 10 },
          { type: 'flag', id: 'rustyStayed_heart', value: true },
        ],
      },
    ],
    onComplete: [],
  },

  {
    id: 'ch4_council_vote',
    trigger: { type: 'reputation', value: 83, chapter: 4, requireFlags: ['chapter4Started'] },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'RIDGEMONT CITY COUNCIL — REZONING HEARING', emotion: null },
      { speaker: 'priya', portrait: 'neutral', text: 'The vote is tonight. Victor\'s rezoning proposal — if it passes, he can buy Ridgemont\'s lot and build condos. I\'ve been covering this for months.', emotion: 'neutral' },
      { speaker: 'priya', portrait: 'excited', text: 'The good news? Your reputation precedes you. Council members have noticed the turnaround. But Victor\'s been writing checks to campaign funds all year.', emotion: 'excited' },
      { speaker: 'maggie', portrait: 'worried', text: 'If our rep is strong enough, the council won\'t dare rezone a community landmark. If not...', emotion: 'worried' },
      { speaker: null, portrait: null, text: '[The council votes 4-3 against rezoning. Ridgemont is safe — for now.]', emotion: null },
      { speaker: 'victor', portrait: 'angry', text: 'This isn\'t over, Peralta. You\'ve delayed the inevitable. That\'s all.', emotion: 'angry' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'councilVoteWon', value: true },
      { type: 'reputation', delta: 5 },
    ],
  },

  {
    id: 'ch4_diego_slump',
    trigger: { type: 'day', value: 12, chapter: 4, requireFlags: ['chapter4Started'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'diego', portrait: 'disappointed', text: 'Pipes... I don\'t know what\'s going on out there. We\'ve dropped four straight. The guys are pressing, the crowd\'s getting thin.', emotion: 'disappointed' },
      { speaker: 'diego', portrait: 'disappointed', text: 'Coach says it\'s mental. Easy for him to say — he\'s not the one striking out with runners on base.', emotion: 'disappointed' },
      { speaker: null, portrait: null, text: '(Diego stares at his bat like it betrayed him.)', emotion: null },
    ],
    choices: [
      {
        text: '"You\'re Clutch Ramirez. One slump doesn\'t define you. Get back out there."',
        effects: [
          { type: 'relationship', npc: 'diego', delta: 2 },
        ],
      },
      {
        text: '"What if I upgrade the clubhouse systems? Better air, better rest, better play."',
        effects: [
          { type: 'relationship', npc: 'diego', delta: 1 },
          { type: 'reputation', delta: 2 },
        ],
      },
      {
        text: '"Maybe stop worrying about the scoreboard and focus on the fundamentals."',
        effects: [
          { type: 'relationship', npc: 'diego', delta: -1 },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'diegoSlumpTalk', value: true },
    ],
  },

  {
    id: 'ch4_maggie_confession',
    trigger: { type: 'day', value: 15, chapter: 4, requireFlags: ['chapter4Started'], requireRelationship: { npc: 'maggie', min: 30 } },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: '(Maggie is alone in her office. The lights are low. She doesn\'t hear you knock.)', emotion: null },
      { speaker: 'maggie', portrait: 'worried', text: 'Oh — Casey. Come in. Close the door.', emotion: 'worried' },
      { speaker: 'maggie', portrait: 'worried', text: 'I need to tell you something I\'ve never told anyone here.', emotion: 'worried' },
      { speaker: 'maggie', portrait: 'worried', text: 'Before you showed up, I had a letter drafted. To Victor. Accepting his offer. Signed and everything.', emotion: 'worried' },
      { speaker: 'maggie', portrait: 'neutral', text: 'I was going to sell Ridgemont. Walk away. Let someone else carry the weight.', emotion: 'neutral' },
      { speaker: 'maggie', portrait: 'happy', text: 'Then some kid from an HVAC van showed up and started fixing things. And I put the letter in the shredder.', emotion: 'happy' },
    ],
    choices: [
      {
        text: '"You made the right call, Maggie. We\'re not done yet."',
        effects: [
          { type: 'relationship', npc: 'maggie', delta: 3 },
        ],
      },
      {
        text: '"What made you almost give up?"',
        effects: [
          { type: 'relationship', npc: 'maggie', delta: 1 },
          { type: 'flag', id: 'maggieBackstory', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'maggieConfessionHeard', value: true },
    ],
  },

  {
    id: 'ch4_bea_surprise_inspection',
    trigger: { type: 'day', value: 18, chapter: 4, requireFlags: ['chapter4Started'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'bea', portrait: 'stern', text: 'Peralta. Don\'t bother looking for the appointment — there isn\'t one.', emotion: 'stern' },
      { speaker: 'bea', portrait: 'stern', text: 'This is an unannounced spot-check. My department received a complaint and I am required to investigate within 48 hours.', emotion: 'stern' },
      { speaker: 'bea', portrait: 'noting', text: 'I trust you can guess who filed it.', emotion: 'noting' },
      { speaker: null, portrait: null, text: '(Bea clicks her pen and glances at her clipboard. She\'s already started.)', emotion: null },
    ],
    choices: [
      {
        text: '"Welcome, Inspector. We\'re an open book. Start wherever you like."',
        effects: [
          { type: 'relationship', npc: 'bea', delta: 2 },
        ],
      },
      {
        text: '"Can we have until tomorrow morning? We\'re in the middle of repairs."',
        effects: [
          { type: 'relationship', npc: 'bea', delta: -2 },
          { type: 'flag', id: 'stalledBeaInspection', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'surpriseInspectionTriggered', value: true },
      { type: 'triggerInspection', delay: 0 },
    ],
  },

  {
    id: 'ch4_fiona_rival_deal',
    trigger: { type: 'day', value: 25, chapter: 4, requireFlags: ['chapter4Started'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'fiona', portrait: 'frustrated', text: 'Casey, we have a problem. Victor just offered CloudBrew — our second-biggest sponsor — a deal they can\'t refuse. Luxury box access, premium placement, the whole package.', emotion: 'frustrated' },
      { speaker: 'fiona', portrait: 'calculating', text: 'If we lose CloudBrew, that\'s $3,000 a month off the books. And the other sponsors will start wondering if they\'re next.', emotion: 'calculating' },
      { speaker: 'fiona', portrait: 'neutral', text: 'We have options, but none of them are free.', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"Match the offer. Whatever it costs, we keep CloudBrew." [-$3000]',
        effects: [
          { type: 'money', delta: -3000 },
          { type: 'flag', id: 'keptCloudBrew', value: true },
        ],
      },
      {
        text: '"Let them go. We\'ll find new sponsors." [-1 rep]',
        effects: [
          { type: 'reputation', delta: -1 },
          { type: 'flag', id: 'lostCloudBrew', value: true },
        ],
      },
      {
        text: '"Ask Priya to dig into Victor\'s sponsor poaching. Make it public."',
        effects: [
          { type: 'relationship', npc: 'priya', delta: 1 },
          { type: 'flag', id: 'priyaInvestigatesPoaching', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'fionaRivalDealHandled', value: true },
    ],
  },

  // ── CHAPTER 5 ─────────────────────────────────────────────────────────

  {
    id: 'ch5_opening',
    trigger: { type: 'reputation', value: 86, chapter: 5 },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'CHAPTER 5: CHAMPIONSHIP', emotion: null },
      { speaker: null, portrait: null, text: 'Major League. Ridgemont Stadium — once a punchline, now a contender. The Raptors are in the hunt. The systems are singing. And the championship committee is watching.', emotion: null },
      { speaker: 'maggie', portrait: 'happy', text: 'Peralta, I just got off the phone with the league office. The championship game... they\'re giving it to us. Ridgemont. Five games to prepare.', emotion: 'happy' },
      { speaker: 'maggie', portrait: 'neutral', text: 'Every system above 85%. Full capacity. National broadcast. One shot. Don\'t blow it.', emotion: 'neutral' },
      { speaker: 'diego', portrait: 'pumped', text: 'CHAMPIONSHIP! AT HOME! Pipes, this is the bottom of the ninth and we\'re stepping up to the plate!', emotion: 'pumped' },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'chapter5Started', value: true },
      { type: 'flag', id: 'championshipAwarded', value: true },
    ],
  },

  {
    id: 'ch5_priya_documentary',
    trigger: { type: 'afterEvent', eventId: 'ch5_opening', chapter: 5 },
    delivery: 'dialogue',
    pauseGame: false,
    dialogue: [
      { speaker: 'priya', portrait: 'excited', text: 'Casey! A streaming network wants to produce a documentary about Ridgemont\'s turnaround. "From Browntide to Championship." They want to film in the mechanical room.', emotion: 'excited' },
      { speaker: 'priya', portrait: 'neutral', text: 'It\'s great publicity, but it means cameras everywhere. Including places you might not want cameras.', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"Let them film. We\'ve got nothing to hide anymore."',
        effects: [
          { type: 'reputation', delta: 3 },
          { type: 'relationship', npc: 'priya', delta: 3 },
          { type: 'flag', id: 'allowedDocumentary', value: true },
        ],
      },
      {
        text: '"After the championship. I can\'t have cameras in the way right now."',
        effects: [
          { type: 'relationship', npc: 'priya', delta: -1 },
        ],
      },
    ],
    onComplete: [],
  },

  {
    id: 'ch5_fiona_premium',
    trigger: { type: 'day', value: 2, chapter: 5, requireFlags: ['championshipAwarded'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'fiona', portrait: 'pleased', text: 'Casey. Congratulations on the championship bid. I\'m here with an offer.', emotion: 'pleased' },
      { speaker: 'fiona', portrait: 'calculating', text: 'GreenLeaf wants exclusive naming rights for championship night. $25,000 flat fee, plus $10,000 per game for the championship series. But they want every system above 85% — non-negotiable.', emotion: 'calculating' },
      { speaker: 'fiona', portrait: 'neutral', text: 'It\'s the biggest deal I\'ve ever brought to a venue this size. Don\'t make me regret it.', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"Deal. 85% is the new baseline."',
        effects: [
          { type: 'relationship', npc: 'fiona', delta: 5 },
          { type: 'money', delta: 25000 },
          { type: 'flag', id: 'premiumSponsorDeal', value: true },
        ],
      },
      {
        text: '"Counter-offer: 80% threshold, same money."',
        effects: [
          { type: 'relationship', npc: 'fiona', delta: -2 },
          { type: 'money', delta: 18000 },
          { type: 'flag', id: 'negotiatedPremiumDeal', value: true },
        ],
      },
    ],
    onComplete: [],
  },

  {
    id: 'ch5_victor_sabotage',
    trigger: { type: 'day', value: 3, chapter: 5, requireFlags: ['championshipAwarded'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'rusty', portrait: 'grumpy', text: 'Kid, something\'s wrong. The new filter cartridges we installed last week — they\'re degrading way too fast. These aren\'t the grade we ordered.', emotion: 'grumpy' },
      { speaker: 'rusty', portrait: 'worried', text: 'Somebody swapped our shipment. The vendor — Allied Parts Supply — their owner plays golf with Victor Salazar. I made some calls.', emotion: 'worried' },
      { speaker: 'casey', portrait: null, text: 'Defective parts, two days before the championship.', emotion: null },
      { speaker: 'rusty', portrait: 'neutral', text: 'We\'ve got options, but none of them are great.', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"Report the vendor to the league and replace with emergency stock." [Safe, expensive]',
        effects: [
          { type: 'money', delta: -5000 },
          { type: 'reputation', delta: 2 },
          { type: 'flag', id: 'reportedVendor', value: true },
        ],
      },
      {
        text: '"Replace what we can and nurse the rest through the game." [Risky, cheap]',
        effects: [
          { type: 'money', delta: -1500 },
          { type: 'flag', id: 'nursedParts', value: true },
        ],
      },
      {
        text: '"Confront Victor directly. Get Priya there with a camera."',
        effects: [
          { type: 'relationship', npc: 'priya', delta: 5 },
          { type: 'relationship', npc: 'victor', delta: -10 },
          { type: 'flag', id: 'confrontedVictor', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'sabotageDiscovered', value: true },
    ],
  },

  {
    id: 'ch5_rusty_legacy',
    trigger: { type: 'day', value: 7, chapter: 5, requireFlags: ['chapter5Started'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: '(Rusty is sitting on an overturned bucket in the mechanical room, polishing a wrench he\'s had for thirty years.)', emotion: null },
      { speaker: 'rusty', portrait: 'neutral', text: 'Kid, can I talk to you? Not about pipes for once.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'neutral', text: 'I\'ve been thinking about what comes next. For me, I mean. These knees aren\'t getting younger. Neither\'s the rest of me.', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'happy', text: 'Thirty-five years I\'ve walked these tunnels. I know every rattle, every drip, every groan this building makes. I can tell you which pipe is about to blow just by listening.', emotion: 'happy' },
      { speaker: 'rusty', portrait: 'neutral', text: 'But a building doesn\'t remember. When I\'m gone, all that knowledge walks out the door with me. Unless...', emotion: 'neutral' },
      { speaker: 'rusty', portrait: 'neutral', text: 'Unless someone carries it forward. Like you did with Hank\'s notes.', emotion: 'neutral' },
    ],
    choices: [
      {
        text: '"Rusty, when the championship is over, we\'re naming the mechanical room after you. The Kowalski Engine Room."',
        effects: [
          { type: 'relationship', npc: 'rusty', delta: 3 },
          { type: 'flag', id: 'rustyHonored', value: true },
        ],
      },
      {
        text: '"You\'ve got plenty of years left, old man."',
        effects: [],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'rustyLegacyTalk', value: true },
    ],
  },

  {
    id: 'ch5_victor_last_stand',
    trigger: { type: 'day', value: 8, chapter: 5, requireFlags: ['sabotageDiscovered'] },
    delivery: 'dialogue',
    pauseGame: true,
    dialogue: [
      { speaker: 'priya', portrait: 'excited', text: 'Casey — drop everything. My source at city hall just called. Victor bribed Councilman Torres to reopen the rezoning vote. The paperwork is already filed.', emotion: 'excited' },
      { speaker: 'priya', portrait: 'neutral', text: 'If this goes through, it doesn\'t matter if you win the championship. The lot gets rezoned and Ridgemont\'s lease becomes worthless.', emotion: 'neutral' },
      { speaker: 'priya', portrait: 'excited', text: 'I have the proof. Bank records, emails, the whole paper trail. This is Victor\'s last card — and it\'s a dirty one.', emotion: 'excited' },
    ],
    choices: [
      {
        text: '"Publish everything. Front page. Let the public see who Victor really is."',
        effects: [
          { type: 'relationship', npc: 'victor', delta: -5 },
          { type: 'reputation', delta: 3 },
          { type: 'flag', id: 'victorExposedPublicly', value: true },
        ],
      },
      {
        text: '"Send the evidence to the DA privately. Keep it clean."',
        effects: [
          { type: 'relationship', npc: 'victor', delta: -2 },
          { type: 'reputation', delta: 1 },
          { type: 'flag', id: 'victorQuiet', value: true },
        ],
      },
    ],
    onComplete: [
      { type: 'flag', id: 'victorLastStandResolved', value: true },
    ],
  },

  {
    id: 'ch5_celebration_prep',
    trigger: { type: 'day', value: 9, chapter: 5, requireFlags: ['championshipAwarded'] },
    delivery: 'cutscene',
    pauseGame: false,
    dialogue: [
      { speaker: null, portrait: null, text: 'CHAMPIONSHIP EVE — RIDGEMONT STADIUM', emotion: null },
      { speaker: null, portrait: null, text: 'The concourse is draped in Raptors blue. Every surface gleams. The air smells like fresh popcorn and possibility.', emotion: null },
      { speaker: 'maggie', portrait: 'happy', text: 'I found this in my father\'s desk. A photo from opening day, 1984. He\'s standing right where you\'re standing now.', emotion: 'happy' },
      { speaker: 'rusty', portrait: 'happy', text: 'I hung the championship banner in the rafters this morning. Had to climb a ladder that\'s older than Diego. Worth it.', emotion: 'happy' },
      { speaker: 'diego', portrait: 'pumped', text: 'The whole team signed a ball for you, Pipes. Win or lose tomorrow, you\'re our MVP. The guys who keep the lights on never get enough credit.', emotion: 'pumped' },
      { speaker: 'priya', portrait: 'excited', text: 'My photographer wants a group shot for the front page. Everyone in the mechanical room. "The Heart of Ridgemont." My editor is going to love it.', emotion: 'excited' },
      { speaker: 'fiona', portrait: 'pleased', text: 'Every sponsor seat is sold. Every banner is in place. I never thought I\'d say this about a minor league stadium, but... I\'m proud to have my name on this.', emotion: 'pleased' },
      { speaker: 'bea', portrait: 'rare-smile', text: 'I\'m not here in any official capacity tonight. I\'m here because my father would have wanted to see this. And so do I.', emotion: 'rare-smile' },
      { speaker: null, portrait: null, text: '(For one quiet moment, everyone stands together in the mechanical room — the beating heart of Ridgemont Stadium. Tomorrow, the game begins.)', emotion: null },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'celebrationPrepComplete', value: true },
    ],
  },

  {
    id: 'ch5_championship_game',
    trigger: { type: 'day', value: 5, chapter: 5, requireFlags: ['sabotageDiscovered'] },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'CHAMPIONSHIP NIGHT — RIDGEMONT STADIUM', emotion: null },
      { speaker: null, portrait: null, text: 'Every seat is filled. The national broadcast cameras are rolling. The air is clean. The water is pure. The drains are ready. The temperature is perfect.', emotion: null },
      { speaker: 'rusty', portrait: 'happy', text: 'All systems green. Every single one. Kid... I\'m proud of you. Don\'t tell anyone I said that.', emotion: 'happy' },
      { speaker: 'diego', portrait: 'pumped', text: 'Bottom of the ninth, Pipes. This is it. Whatever happens on the field — you already won.', emotion: 'pumped' },
      { speaker: 'maggie', portrait: 'happy', text: 'My father built this place. I almost sold it. You saved it. Now let\'s finish the job.', emotion: 'happy' },
      { speaker: null, portrait: null, text: '[The Ridgemont Raptors take the field for the biggest game in stadium history.]', emotion: null },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'championshipGameStarted', value: true },
      { type: 'triggerGameDay', gameDayType: 'championshipGame' },
    ],
  },

  // ── ENDINGS ───────────────────────────────────────────────────────────

  {
    id: 'ending_good',
    trigger: { type: 'flag', requireFlags: ['championshipGameStarted'], condition: 'championshipWon' },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'GRAND SLAM', emotion: null },
      { speaker: null, portrait: null, text: 'The crowd erupts. Confetti fills the air — clean, filtered air. The scoreboard reads RAPTORS WIN and 35,000 people are on their feet.', emotion: null },
      { speaker: 'diego', portrait: 'pumped', text: 'WE DID IT! MVP! MVP! ...And I don\'t mean me this time, Pipes!', emotion: 'pumped' },
      { speaker: 'maggie', portrait: 'happy', text: 'Peralta — Casey. I\'m promoting you. Head of Stadium Operations. Full budget authority. And a raise that doesn\'t insult either of us.', emotion: 'happy' },
      { speaker: 'rusty', portrait: 'happy', text: 'Not bad, kid. Not bad at all. Hank would\'ve liked you.', emotion: 'happy' },
      { speaker: 'priya', portrait: 'excited', text: 'Front page, above the fold: "RIDGEMONT RISES." You\'re buying me dinner for this interview.', emotion: 'excited' },
      { speaker: null, portrait: null, text: 'Victor Salazar\'s rezoning deal collapses. Ridgemont Stadium stands — a monument to the invisible work that makes everything possible.', emotion: null },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'goodEnding', value: true },
      { type: 'gameEnd', ending: 'good' },
    ],
  },

  {
    id: 'ending_secret',
    trigger: { type: 'flag', requireFlags: ['championshipGameStarted', 'nanaPeraltaReveal'], condition: 'allSystemsAbove80' },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'STADIUM OF THE YEAR', emotion: null },
      { speaker: null, portrait: null, text: 'Ridgemont wins the pennant. But that\'s not the real story.', emotion: null },
      { speaker: 'maggie', portrait: 'happy', text: 'The league just called. Ridgemont has been named Stadium of the Year. First time in franchise history. All systems above 80% for the entire season. They said it was unprecedented.', emotion: 'happy' },
      { speaker: 'rusty', portrait: 'happy', text: 'Casey... there\'s something else in Hank\'s last note. The woman who designed Ridgemont\'s original filtration layout — Elena Peralta. Your grandmother.', emotion: 'happy' },
      { speaker: 'casey', portrait: null, text: 'Nana...', emotion: null },
      { speaker: 'rusty', portrait: 'neutral', text: 'Hank\'s blueprint — the Doolan Integration — it was her idea first. Hank just finished what she started. And you... you brought it home.', emotion: 'neutral' },
      { speaker: null, portrait: null, text: '"Nobody notices the air they breathe until it stinks, kid. The invisible work is the most important work." — Elena "Nana" Peralta, 1984', emotion: null },
      { speaker: null, portrait: null, text: '[POST-CREDITS: Victor Salazar\'s new Glendale stadium suffers a catastrophic sewage failure at its grand opening. Priya\'s headline: "BROWNTIDE 2: ELECTRIC BOOGALOO."]', emotion: null },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'secretEnding', value: true },
      { type: 'gameEnd', ending: 'secret' },
    ],
  },
  {
    id: 'ending_bad',
    trigger: { type: 'flag', requireFlags: ['acceptedVictor'] },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'SOLD', emotion: null },
      { speaker: null, portrait: null, text: 'The parking lot is empty. The sign comes down next Tuesday. A wrecking ball is scheduled for the end of the month.', emotion: null },
      { speaker: 'maggie', portrait: 'angry', text: 'I hope Glendale was worth it, Peralta. I really do.', emotion: 'angry' },
      { speaker: 'rusty', portrait: 'grumpy', text: 'Thirty-five years. I gave this place thirty-five years. And you gave it away for a better paycheck.', emotion: 'grumpy' },
      { speaker: 'victor', portrait: 'smug', text: 'Don\'t look so glum, Peralta. Progress is progress. Besides — the condos will have excellent filtration. You\'ll make sure of that personally.', emotion: 'smug' },
      { speaker: null, portrait: null, text: 'Ridgemont Stadium, 1984-present. Elena Peralta\'s dream, held together by Hank Doolan\'s duct tape, and finally let go by her own grandchild.', emotion: null },
      { speaker: null, portrait: null, text: '[GAME OVER — The invisible work wasn\'t enough. Or maybe you were.]', emotion: null },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'badEnding', value: true },
      { type: 'gameEnd', ending: 'bad' },
    ],
  },

  {
    id: 'ending_condemned',
    trigger: { type: 'flag', requireFlags: [], condition: 'stadiumCondemned' },
    delivery: 'cutscene',
    pauseGame: true,
    dialogue: [
      { speaker: null, portrait: null, text: 'CONDEMNED', emotion: null },
      { speaker: null, portrait: null, text: 'The health department seal is on every door. The lights are off. The only sound is a pipe, dripping somewhere deep in the building.', emotion: null },
      { speaker: 'bea', portrait: 'stern', text: 'I gave you every chance, Peralta. Every warning, every extension. The building is unsafe for public occupancy. My hands are tied.', emotion: 'stern' },
      { speaker: 'maggie', portrait: 'worried', text: 'Victor\'s lawyers called before the ink was dry on the closure order. He\'ll have the lot by spring.', emotion: 'worried' },
      { speaker: 'rusty', portrait: 'worried', text: 'I always said this place would outlive me. Guess I was wrong about that, too.', emotion: 'worried' },
      { speaker: null, portrait: null, text: '[GAME OVER — Ridgemont Stadium, 1984-present. Some buildings are worth fighting for. This one needed a better fight.]', emotion: null },
    ],
    choices: [],
    onComplete: [
      { type: 'flag', id: 'condemnedEnding', value: true },
      { type: 'gameEnd', ending: 'condemned' },
    ],
  },
];

// ─── AMBIENT NPC DIALOGUE ──────────────────────────────────────────────────
// Random barks and contextual lines. StorySystem picks from these based on
// NPC, current chapter, and game state. Gives NPCs personality between events.

export const NPC_AMBIENT_DIALOGUE = {
  maggie: {
    general: [
      'The concession stands need to stay open through the ninth. No exceptions.',
      'I just got off the phone with the insurance company. Don\'t ask.',
      'My grandmother built this place with borrowed money and stubbornness. I plan to honor both.',
      'Every dollar we spend on maintenance is a dollar we don\'t spend on lawyers.',
      'The league office called. They\'re "monitoring our progress." That\'s code for watching us fail.',
      'Fiona says the sponsors want a tour. Make sure nothing\'s dripping.',
      'Rusty left me a voicemail about valve pressure at 3 AM. The man never sleeps.',
    ],
    systemGood: [
      'Numbers look good, Peralta. Don\'t let it go to your head.',
      'The sponsor reports are clean for the first time in three quarters. Keep it up.',
      'I almost smiled looking at this month\'s maintenance log. Almost.',
    ],
    systemBad: [
      'Peralta, my phone is ringing and it\'s never good news when the phone rings.',
      'Fix it. I don\'t care how. Fix it before someone with a camera sees it.',
      'If Priya writes one more "Ridgemont Struggles" headline, I\'m canceling her parking pass.',
    ],
    gameDay: [
      'Full house tonight. That means full pressure on every pipe in this building.',
      'Smile for the cameras, Peralta. And make sure nothing behind you is leaking.',
    ],
  },

  rusty: {
    general: [
      'You hear that rattle? That\'s the east wing ductwork saying hello. And goodbye.',
      'Thirty-five years, kid. I\'ve replaced every pipe in this building twice. Some of them three times.',
      'Don\'t trust the pressure gauge in Section C. It lies. Always has.',
      'Coffee\'s fresh. The gaskets aren\'t. Priorities.',
      'Back in \'04, we ran this whole operation with two guys and a dolly. Now we\'ve got fancy computers and it still leaks.',
      'Diego asked me to fix his locker. Again. Kid breaks everything he touches.',
      'Bea was in the tunnels Tuesday. Didn\'t say hi. Just measured things and left.',
    ],
    systemGood: [
      'Huh. Everything\'s green. I don\'t trust it, but I\'ll take it.',
      'Not a single red light. Must be my birthday.',
      'When everything works, I feel like I forgot something.',
    ],
    systemBad: [
      'I told you that valve was due for replacement. I told you Tuesday.',
      'Grab a wrench. No, the big wrench. No, bigger.',
      'This is why I keep spare parts in my truck. Don\'t tell Maggie about the truck.',
    ],
    gameDay: [
      'Fifteen thousand bladders, kid. That\'s what we\'re up against tonight.',
      'Game time means no downtime. Everything holds or everything fails. No in-between.',
    ],
    weather: [
      'Storm\'s coming. I can feel it in my knees. My knees have never been wrong.',
      'Rain means the drains work overtime. And overtime means overtime pay. For the drains, not for me.',
    ],
  },

  victor: {
    general: [
      'Ridgemont has character, I\'ll give you that. Mostly the character of a building that should be condemned.',
      'My architects say this lot has excellent sun exposure. For a residential tower.',
      'I don\'t take things personally, Peralta. I take them profitably.',
    ],
    playerWinning: [
      'Impressive turnaround. Truly. Enjoy it while the numbers hold.',
      'You\'ve got the fans fooled. But fans don\'t read balance sheets.',
    ],
    playerLosing: [
      'Call me when you\'re ready to talk. I answer on the first ring.',
      'There\'s no shame in cutting losses, Peralta. Just ask any investor.',
    ],
  },

  priya: {
    general: [
      'My editor wants puff pieces. I want Pulitzers. Ridgemont gives me material for both.',
      'Off the record? I\'m rooting for you. On the record? I\'m rooting for a good story.',
      'I\'ve got sources in every press box in the league. You\'d be surprised what I hear.',
      'The Browntide piece got me 40,000 views. Your redemption arc could double that.',
      'Can I quote you on that? Just kidding. I already wrote it down.',
      'Bea gave me a three-word quote: "Standards were met." Classic Thornton.',
      'Diego wants me to write about his charity work. He\'s a better story than he knows.',
    ],
    systemGood: [
      'This is the headline I want to write: "Ridgemont Rising." Give me the proof.',
      'My photographer wants to do a feature on the mechanical room. Is that weird? He thinks pipes are photogenic.',
      'Fiona sent me the sponsor metrics. Even I\'m impressed, and I\'m hard to impress.',
    ],
    systemBad: [
      'I\'m going to have to report this, Casey. I\'m sorry, but that\'s the job.',
      'Victor\'s PR team just sent a press release. I\'m guessing it\'s not a coincidence.',
    ],
  },

  bea: {
    general: [
      'Regulations are not suggestions, Peralta. They are the floor, not the ceiling.',
      'I inspect twenty-three venues in this district. Yours is the only one I worry about.',
      'My clipboard has no opinions. It has standards.',
      'The code requires twelve air changes per hour in food prep areas. I count eleven and a half as eleven.',
      'I ran into Rusty lecturing a pipe fitting. I chose not to comment.',
      'Maggie asked me to fast-track the annual review. I don\'t fast-track. I thorough-track.',
    ],
    systemGood: [
      'Your numbers are within acceptable parameters. That is the highest compliment I give.',
      'I see improvement. Documented, measurable improvement. Continue.',
    ],
    systemBad: [
      'This is a violation. Not a warning. Not a suggestion. A violation.',
      'I am required to file this report regardless of our personal rapport.',
    ],
  },

  diego: {
    general: [
      'Hey Pipes! The boys are saying the locker room doesn\'t smell like feet anymore. That\'s all you!',
      'You know what wins games? Talent. You know what keeps talent? Air conditioning.',
      'I told the pitcher the water tasted different. He said it tasted like water. That\'s the point!',
      'My batting average goes up 15 points when the clubhouse is comfortable. I did the math. Okay, the coach did the math.',
      'The visiting team complained about our guest locker room. Too hot. I said that\'s called home field advantage!',
      'Rusty taught me how to read a pressure gauge yesterday. Said I\'m a natural. I think he was being sarcastic.',
      'Fiona wants me to do a photo shoot with the sponsor banners. I told her I only pose after walk-off hits.',
    ],
    systemGood: [
      'Everything\'s running smooth! I almost slipped in the shower because the floor was actually clean!',
      'The guys are happy, the fans are happy, I\'m hitting .340 — coincidence? I think not!',
    ],
    systemBad: [
      'Pipes, the dugout water fountain is doing that thing again. The brown thing.',
      'Coach pulled me aside and said the field feels "spongy." Is that your department?',
    ],
    gameDay: [
      'Big crowd tonight! Don\'t let anything explode until after my at-bat, yeah?',
      'I can hear the fans from the tunnel. Keep everything running and I\'ll give them a show.',
    ],
  },

  fiona: {
    general: [
      'The quarterly metrics will determine contract renewal. I\'m sharing this as a courtesy.',
      'Our brand alignment team scored Ridgemont a 6.2 last quarter. Seven is the threshold for tier-two sponsorship.',
      'I don\'t make the rules about the penalty clauses. I just enforce them. Politely.',
      'Diego\'s jersey sales translate directly to brand alignment scores. Keep that kid smiling.',
      'Priya\'s latest article brought in two sponsor inquiries. Free press is the best press.',
    ],
    systemGood: [
      'These numbers are strong. I\'m presenting Ridgemont as a case study at the regional conference.',
      'Our social media sentiment analysis shows positive trend lines. Keep this trajectory.',
    ],
    systemBad: [
      'The contract has a performance clause, Casey. I need to see improvement by the next review.',
      'Corporate is asking questions. I need answers that come with charts.',
    ],
  },
};

// ─── NPC REACTION LINES ───────────────────────────────────────────────────
// Short reactions for specific game events, keyed by event type.

export const NPC_REACTIONS = {
  onInspection: {
    gradeA: {
      maggie: 'Grade A. Frame it and put it in the lobby.',
      rusty: 'Grade A? Check the form for typos.',
      bea: 'Exemplary. Maintain this standard.',
      diego: 'A! That\'s like hitting for the cycle!',
      priya: 'Grade A! That\'s front-page material.',
    },
    gradeB: {
      maggie: 'B is acceptable. A is expected next time.',
      rusty: 'B\'s not bad. B\'s what we used to dream about.',
      bea: 'Satisfactory. Room for improvement noted.',
    },
    gradeD: {
      maggie: 'D? Peralta, we need to talk.',
      rusty: 'We\'ve done better than this. We\'ll do better than this.',
      bea: 'This is below acceptable standards. Remediation required.',
    },
    gradeF: {
      maggie: 'An F. Do you know what an F costs this organization?',
      rusty: 'I\'ve been here thirty-five years and I\'ve never seen an F. Until today.',
      bea: 'I am required to issue a formal warning. This is that warning.',
    },
  },

  onWeather: {
    storm: {
      rusty: 'Here it comes. Check the sump pumps — all of them.',
      diego: 'Rain delay? Nah, we play through it. As long as the roof holds.',
    },
    heatwave: {
      rusty: 'The chillers are maxed. If one goes down, we\'re cooking. Literally.',
      diego: 'It\'s so hot the rosin bag is melting. Can you crank the AC in the dugout?',
    },
  },

  onEmergency: {
    pipeBurst: {
      rusty: 'Shut the main valve! NOW! I\'ll grab the wet-vac.',
      maggie: 'Contain it. I do not want another Browntide.',
    },
    powerOutage: {
      rusty: 'Generators should kick in. Should. I replaced the starter last month.',
      maggie: 'How long until we\'re back online? Fans are getting restless.',
    },
    sewageBackup: {
      rusty: 'Not again. Get the pumps running and close off Section C.',
      maggie: 'If this hits social media, we\'re done. Handle it, Peralta.',
    },
  },

  onSponsor: {
    gained: {
      maggie: 'New sponsor on board. Don\'t give them a reason to leave.',
      fiona: 'Welcome to the portfolio. Let\'s make this a long-term relationship.',
    },
    lost: {
      maggie: 'We lost the sponsor. I don\'t need to explain what that means for the budget.',
      fiona: 'I fought for this contract, Casey. I need you to fight for those numbers.',
    },
  },
};

// ─── STORY MILESTONES ───────────────────────────────────────────────────────

// Matches GAME_CONFIG.milestones in gameConfig.js — uses flat condition format
// for ProgressionSystem compatibility. This export provides the same data with
// reward info for systems that need it.
export const STORY_MILESTONES = [
  // Chapter 1 — "New Kid on the Field"
  { id: 'first_filter', condition: 'filters_gte', value: 1, name: 'The Journey of a Thousand Filters', description: 'Your first filter is in place. It\'s not saving the world, but it\'s keeping the concourse from smelling like a locker room.', reward: { type: 'reputation', value: 1 } },
  { id: 'week_one', condition: 'day_gte', value: 7, name: 'Baptism by Drip', description: 'Made it through your first week without a catastrophic failure. Nana would be proud — or at least unsurprised.', reward: { type: 'money', value: 200 } },
  { id: 'rusty_friend', condition: 'relationship_gte', npcId: 'rusty', value: 20, name: 'Not Bad, Kid', description: 'Rusty starts sharing war stories instead of grunts. He\'ll never admit he was nervous about you.', reward: { type: 'money', value: 500 } },
  { id: 'first_inspection_pass', condition: 'inspection_grade', value: 'B', name: 'Inspector\'s Nod', description: 'Pass your first health inspection without embarrassment. Bea Thornton didn\'t smile, but she didn\'t frown either.', reward: { type: 'reputation', value: 1 } },
  { id: 'browntide_survivor', condition: 'events_survived_gte', value: 3, name: 'Not Another Browntide', description: 'Survived 3 events — the ghost of Hank Doolan approves from wherever duct-taped souls go.', reward: { type: 'reputation', value: 2 } },

  // Chapter 2 — "Rising Through the Ranks"
  { id: 'single_a', condition: 'reputation_gte', value: 41, name: 'Rookie No More', description: 'Chapter 1 complete. The duct tape is peeling, but the stadium is standing. Maggie hasn\'t fired you. That\'s winning.', reward: { type: 'money', value: 1000 } },
  { id: 'first_sponsor', condition: 'choice_made', value: 'metFiona', name: 'Show Me the Money', description: 'Your first real sponsor. Their logo on the scoreboard means someone believes Ridgemont has a future.', reward: { type: 'money', value: 1500 } },
  { id: 'filter_farm', condition: 'filters_gte', value: 10, name: 'System Builder', description: 'Ten filters running in harmony. The stadium hums like a machine that isn\'t falling apart — because it isn\'t. Anymore.', reward: { type: 'reputation', value: 2 } },
  { id: 'diego_fan', condition: 'relationship_gte', npcId: 'diego', value: 15, name: 'Dugout Diplomat', description: 'Diego "Clutch" Ramirez is in your corner. When the star player shouts you out, the team listens.', reward: { type: 'reputation', value: 2 } },

  // Chapter 3 — "Storm Warning"
  { id: 'double_a', condition: 'reputation_gte', value: 56, name: 'The Real Score', description: 'Double-A tier reached. Maggie reveals the mortgage crisis — Ridgemont isn\'t just fighting for wins, it\'s fighting to exist.', reward: { type: 'money', value: 2000 } },
  { id: 'first_note', condition: 'notes_found_gte', value: 1, name: 'Ghosts in the Machine', description: 'Hank Doolan left more than duct tape behind. His notes, his parts, his blueprints — a roadmap from a man who never gave up.', reward: { type: 'money', value: 500 } },
  { id: 'half_notes', condition: 'notes_found_gte', value: 4, name: 'Following Hank\'s Trail', description: 'Halfway through Hank\'s hidden documents. The picture of what really happened here is getting clearer.', reward: { type: 'money', value: 1000 } },
  { id: 'bea_respected', condition: 'relationship_gte', npcId: 'bea', value: 25, name: 'Fair Play', description: 'Bea Thornton gives you a 1-day warning before inspections. From her, that\'s practically a friendship bracelet.', reward: { type: 'reputation', value: 2 } },
  { id: 'perfect_inspection', condition: 'inspection_grade', value: 'A', name: 'Spotless', description: 'Grade A health inspection. Bea Thornton wrote "Exemplary" on the form. In pen. She never uses pen.', reward: { type: 'money', value: 5000 } },
  { id: 'first_expansion', condition: 'expansions_gte', value: 1, name: 'Growing Pains', description: 'First stadium expansion completed. More seats, more systems, more things to break. Progress!', reward: { type: 'reputation', value: 3 } },

  // Chapter 4 — "Into the Fire"
  { id: 'triple_a', condition: 'reputation_gte', value: 71, name: 'Into the Fire', description: 'Triple-A. Victor makes his move. The systems are sophisticated, the staff is experienced, and everything you\'ve built is about to be tested.', reward: { type: 'money', value: 3000 } },
  { id: 'survivor', condition: 'events_survived_gte', value: 10, name: 'Weatherproof', description: 'Survived 10 events. Thunderstorms, equipment failures, and Victor\'s schemes. The stadium held. You held.', reward: { type: 'reputation', value: 5 } },
  { id: 'full_season', condition: 'season_gte', value: 2, name: 'Veteran Manager', description: 'Completed a full season. Maggie offers a real contract. Rusty stops calling you "kid." Well, sometimes.', reward: { type: 'money', value: 5000 } },
  { id: 'refused_victor', condition: 'choice_made', value: 'refusedVictor', name: 'Not for Sale', description: 'Refused Victor\'s offer. Triple the salary, unlimited budget — and you said no. Some things aren\'t about money.', reward: { type: 'reputation', value: 5 } },

  // Chapter 5 — "Championship"
  { id: 'major_league', condition: 'reputation_gte', value: 86, name: 'The Big Leagues', description: 'Major League status. From Browntide to prime time. The championship committee is watching.', reward: { type: 'money', value: 10000 } },
  { id: 'all_notes', condition: 'notes_found_gte', value: 8, name: 'The Invisible Work', description: 'All 8 of Hank\'s notes found. Elena Peralta designed Ridgemont\'s soul. Hank finished her blueprints. You brought it home.', reward: { type: 'reputation', value: 5 } },
  { id: 'championship', condition: 'championship_hosted', value: true, name: 'Grand Slam', description: 'Championship hosted at Ridgemont. Casey "Pipes" Peralta, Head of Stadium Operations. Not bad for a kid from an HVAC van.', reward: { type: 'reputation', value: 10 } },
];

// ─── RIVAL DATA ─────────────────────────────────────────────────────────────

/** Victor's taunts when he's ahead in the standings. */
export const VICTOR_TAUNTS = [
  'Victor sends a fruit basket to the front office with a note: "Sympathy for the struggling."',
  'Victor posted on social media: "Just upgraded our luxury suites. Again. #WinningCulture"',
  'Victor was overheard at a league dinner: "Ridgemont? They\'re more of a community theater than a stadium."',
  'Glendale PR released photos of their new filtration system. Victor tagged you personally.',
  'Victor sent Maggie a job application for his stadium. "Always room for ambitious people," the note says.',
  'Victor\'s latest newsletter: "While others play catch-up, the Grizzlies set the standard."',
  'A billboard went up near Ridgemont: "Visit Glendale — Where the Water Runs Clear." Victor\'s doing.',
];

/** Victor's reactions when the player is ahead. */
export const VICTOR_FRUSTRATIONS = [
  'Sources say Victor kicked a trash can after seeing your latest inspection results.',
  'Victor cancelled his press conference today. Rumor says he\'s "reassessing" after your improvements.',
  'A Glendale employee leaked that Victor has your stadium\'s stats printed on his office wall.',
  'Victor was spotted at a hardware store buying supplies. "Research," he claims.',
  'Word is Victor is stress-eating. His staff found three empty pizza boxes in the office.',
  'Victor tried to poach one of your staff. They turned him down. Loyalty matters.',
  'Glendale insiders say Victor threw a newspaper across his office after reading about Ridgemont.',
];

/** Season-end award messages for the rival standings. */
export const RIVAL_SEASON_AWARDS = {
  win: [
    'Season {season} MVP: Ridgemont takes Stadium of the Year over the Grizzlies! Maggie is framing the trophy.',
    'Season {season}: RIDGEMONT WINS! Stadium of the Year! Rusty is pretending he\'s not emotional. He is.',
    'Season {season}: The trophy is yours. Victor called to "congratulate" you. He hung up after three seconds.',
  ],
  lose: [
    'Season {season}: The Glendale Grizzlies claimed Stadium of the Year. Victor won\'t stop gloating.',
    'Season {season}: Glendale wins. Victor sent a "Better luck next year" card. In a gold envelope.',
    'Season {season}: The award goes to Glendale. Maggie didn\'t attend the ceremony. Neither did you.',
  ],
};
