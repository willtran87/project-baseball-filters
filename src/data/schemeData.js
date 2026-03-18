/**
 * Scheme definitions for Sully's counter-sabotage system.
 *
 * Each scheme is an offensive operation against rival Victor Salazar,
 * with risk/reward mechanics gated by Sully's relationship tiers.
 */

// ─── COOLDOWN CONSTANTS ────────────────────────────────────────────────────────

export const SCHEME_CONSTANTS = {
  /** Minimum days between any scheme launch */
  globalCooldownDays: 3,
  /** Days before the same scheme can be reused */
  perSchemeCooldownDays: 10,
  /** Maximum schemes allowed per season */
  seasonCap: 8,
  /** Success penalty for repeating a scheme within cooldown window */
  repeatPenalty: -0.15,
};

// ─── SUCCESS RATE MODIFIERS ────────────────────────────────────────────────────

/**
 * Calculate total success rate modifier from game state.
 * @param {object} state - GameState
 * @param {string} schemeId - Current scheme ID
 * @returns {number} Total modifier to add to base success rate
 */
export function calculateSchemeModifiers(state, schemeId) {
  let mod = 0;

  // betterOdds bonus (Sully tier 2 relationship)
  if (state.storyFlags?.betterOdds) mod += 0.15;

  // High player reputation
  if (state.reputation > 80) mod += 0.05;

  // Active security defense
  const defenses = state._rivalDefenses;
  if (defenses?.securityUpgrade?.active) mod += 0.05;

  // Victor momentum
  const momentum = state.rivalMomentum ?? 0;
  if (momentum <= -2) mod += 0.10;
  if (momentum >= 2) mod -= 0.10;

  // Repeat penalty: same scheme used within cooldown window
  const cooldowns = state.schemeState?.schemeCooldowns ?? {};
  const lastUsed = cooldowns[schemeId] ?? 0;
  const daysSince = (state.gameDay ?? 1) - lastUsed;
  if (lastUsed > 0 && daysSince < SCHEME_CONSTANTS.perSchemeCooldownDays) {
    mod += SCHEME_CONSTANTS.repeatPenalty;
  }

  return mod;
}

// ─── SCHEME DEFINITIONS ────────────────────────────────────────────────────────

/** @type {Array<SchemeDefinition>} */
export const SCHEME_DATA = [

  // ── TIER 1 — Relationship >= 12 ────────────────────────────────────────────

  {
    id: 'infieldShift',
    name: 'The Infield Shift',
    tier: 1,
    cost: 500,
    baseSuccess: 0.70,
    description: 'Sully spreads rumors in the league about Victor cutting corners. Weakens his standing.',
    flavorIntro: '"I know a guy who knows a guy who writes the league newsletter. One anonymous tip and Victor\'s gonna have a bad week."',
    successEffect: { type: 'rivalRepDrain', amount: 3, days: 3 },
    failEffect: { type: 'compound', effects: [{ type: 'money', amount: 0 }, { type: 'reputation', amount: -1 }] },
    successFlavor: [
      '"Beautiful! The league office is asking Victor some very uncomfortable questions. His PR team is in full meltdown."',
      '"Like a perfectly executed double play. Victor\'s scrambling to explain why his safety reports don\'t add up."',
      '"The tip worked like a charm. Victor\'s reputation is dropping faster than a curveball in the dirt."',
    ],
    failFlavor: [
      '"Uh... the newsletter guy published it under MY name. Victor knows it was us. But hey, no harm no foul, right?"',
      '"Bad break, Pipes. The tip got traced back to Ridgemont. Might\'ve cost us a little goodwill."',
      '"So it turns out Victor already had that newsletter guy on payroll. Live and learn, kid."',
    ],
  },

  {
    id: 'mascotInfiltration',
    name: 'Mascot Infiltration',
    tier: 1,
    cost: 750,
    baseSuccess: 0.65,
    description: 'Sully sneaks into Glendale disguised as their mascot to gather intel and block Victor\'s next move.',
    flavorIntro: '"I got my hands on a Grizzly mascot suit from the \'98 season. Smells terrible. Perfect cover."',
    successEffect: { type: 'blockNextSabotage' },
    failEffect: { type: 'sullyCaught', days: 3 },
    successFlavor: [
      '"I danced for THREE INNINGS and nobody suspected a thing! Also, I found Victor\'s sabotage playbook in the mascot dressing room. Amateurs."',
      '"The Grizzlies fans loved me. Standing ovation. Meanwhile, I copied Victor\'s operation plans from his assistant\'s desk. Two birds, one bear suit."',
      '"Mission accomplished! Victor\'s next sabotage team showed up and I \'accidentally\' locked them in the mascot storage room. They\'re still there."',
    ],
    failFlavor: [
      '"So the real mascot showed up. We had a... disagreement. Security got involved. I\'m laying low for a few days."',
      '"Turns out the \'98 mascot was a DIFFERENT animal. I was dressed as a pelican in a stadium full of bears. Got tackled by a hot dog vendor."',
      '"I got caught stealing Victor\'s files when the mascot head fell off during the seventh inning stretch. Very dramatic. Very embarrassing."',
    ],
  },

  {
    id: 'supplyChainSwitcheroo',
    name: 'Supply Chain Switcheroo',
    tier: 1,
    cost: 600,
    baseSuccess: 0.75,
    description: 'Sully redirects Victor\'s supply chain to mess with his filter deliveries.',
    flavorIntro: '"Victor\'s got a delivery coming in Thursday. What if that delivery... didn\'t arrive? Hypothetically."',
    successEffect: { type: 'clearSupplyDisruption' },
    failEffect: { type: 'filterCostIncrease', multiplier: 1.10, days: 2 },
    successFlavor: [
      '"Victor\'s filters are on a truck headed to Albuquerque right now. It\'s beautiful. He\'ll be scrambling for a week."',
      '"Switched the shipping labels. His premium filters went to a fish market in Toledo. Our supply line is clear."',
      '"Not only did I reroute his delivery, but the replacement parts he ordered are now stuck in customs. Oops."',
    ],
    failFlavor: [
      '"Okay so I accidentally rerouted OUR supply chain too. Filter costs might be a little high for a couple days. My bad."',
      '"The shipping company figured it out and charged US a rerouting fee. Sorry, Pipes. Some days you\'re the bat, some days you\'re the ball."',
      '"Victor\'s logistics guy is apparently a former detective. He traced the whole thing back to Ridgemont\'s zip code. Costs are up."',
    ],
  },

  // ── TIER 2 — Relationship >= 30 ────────────────────────────────────────────

  {
    id: 'doubleAgent',
    name: 'The Double Agent',
    tier: 2,
    cost: 1200,
    baseSuccess: 0.55,
    description: 'Sully plants a mole in Victor\'s organization to feed bad intel and reduce sabotage attempts.',
    flavorIntro: '"I got a buddy — used to ump in Glendale before Victor blacklisted him. He\'s willing to go back in. Deep cover."',
    successEffect: { type: 'sabotageChanceReduction', multiplier: 0.5, days: 7 },
    failEffect: { type: 'triggerSabotage' },
    successFlavor: [
      '"My guy\'s IN. He\'s feeding Victor fake scouting reports and misdirecting his sabotage crew. We\'re golden for a week."',
      '"The double agent is working beautifully. Victor just sent his goons to sabotage an abandoned warehouse he THINKS is our supply depot."',
      '"Victor doesn\'t suspect a thing. My guy got promoted to assistant operations manager. He\'s sabotaging the saboteurs."',
    ],
    failFlavor: [
      '"So... Victor made my guy. And now he\'s FURIOUS. Heads up, Pipes — retaliation incoming. Like, today."',
      '"The double agent flipped back to Victor\'s side. Apparently Victor offered better dental. Brace yourself."',
      '"Abort! Abort! Victor caught on and he\'s sending everything he\'s got our way. This is not a drill!"',
    ],
  },

  {
    id: 'pressConferencePrank',
    name: 'Press Conference Prank',
    tier: 2,
    cost: 1000,
    baseSuccess: 0.60,
    description: 'Sully crashes Victor\'s press event with embarrassing "evidence" of Glendale\'s shoddy operations.',
    flavorIntro: '"Victor\'s got a press conference tomorrow. Big sponsor announcement. What if someone showed up with photos of his broken plumbing?"',
    successEffect: { type: 'reputation', amount: 5 },
    failEffect: { type: 'reputation', amount: -3 },
    successFlavor: [
      '"The look on Victor\'s face when I projected his health inspection failures on the big screen — PRICELESS. Press is all over it."',
      '"I crashed the presser dressed as a health inspector and started \'grading\' Glendale live on camera. The reporters ate it up."',
      '"Victor\'s sponsor announcement got completely overshadowed by the photos of his leaking pipes. Ridgemont\'s the talk of the town!"',
    ],
    failFlavor: [
      '"The photos were blurry and the press thought I was a crazy person. Also, Victor\'s lawyer served me papers on live TV. Not great."',
      '"Turns out Victor anticipated this and had counter-evidence ready. Made Ridgemont look petty. The headline reads \'Desperate Stadium Rivalry.\'"',
      '"I got the wrong press conference. That was the mayor\'s charity event. Our reputation took a hit."',
    ],
  },

  {
    id: 'seventhInningStretch',
    name: 'The Seventh Inning Stretch',
    tier: 2,
    cost: 800,
    baseSuccess: 0.65,
    description: 'Sully coordinates with maintenance contacts across the league to boost Ridgemont\'s systems.',
    flavorIntro: '"I still got buddies in every park in the league. One phone call and we can get expert eyes on every system in this building."',
    successEffect: { type: 'domainHealthBoost', amount: 5 },
    failEffect: { type: 'domainHealthDrain', amount: 3 },
    successFlavor: [
      '"My guys came through! They tuned up every system in the building. Everything\'s running like a brand new ballpark."',
      '"Three retired maintenance chiefs spent the night overhauling your filtration. They said Hank Doolan would be proud."',
      '"The league\'s best kept secret: the old maintenance network. One favor called in and your systems are humming."',
    ],
    failFlavor: [
      '"So my buddy accidentally cross-wired something in the HVAC. One of your domains took a small hit. I\'ll fix it, I swear."',
      '"The \'expert\' I called turned out to be retired for a reason. Something\'s running a little rough now."',
      '"Bad news: my contact mixed up Ridgemont\'s schematics with Glendale\'s. Did some adjustments that... didn\'t help."',
    ],
  },

  // ── TIER 3 "Grand Slam" — Relationship >= 50 ──────────────────────────────

  {
    id: 'operationPennantRace',
    name: 'Operation Pennant Race',
    tier: 3,
    cost: 2500,
    baseSuccess: 0.45,
    description: 'A massive coordinated campaign to expose Victor\'s corrupt business practices to the league and media.',
    flavorIntro: '"This is the big one, Pipes. I\'ve been building this file for YEARS. Every shady deal, every bribed inspector, every demolished park. We go public with everything."',
    successEffect: { type: 'compound', effects: [{ type: 'rivalRepDrain', amount: 8, days: 5 }, { type: 'reputation', amount: 3 }] },
    failEffect: { type: 'compound', effects: [{ type: 'rivalRepBoost', amount: 3 }, { type: 'reputation', amount: -5 }] },
    successFlavor: [
      '"GRAND SLAM! The evidence is airtight. Three newspapers, two TV stations, and the league commissioner all have the file. Victor is DONE."',
      '"The Millhaven story broke wide open. People are finally hearing about what Victor did to the Mudcats stadium. He\'s hemorrhaging support."',
      '"Every dirty deal, laid bare. Victor\'s trying to spin it but the evidence is overwhelming. The league is launching a formal investigation."',
    ],
    failFlavor: [
      '"Victor\'s lawyers are better than I thought. They discredited the evidence and turned it into a story about Ridgemont\'s \'smear campaign.\' We look terrible."',
      '"The file got leaked to Victor before we went public. He preempted every accusation and played the victim. He actually gained sympathy."',
      '"Total disaster. Victor\'s PR team turned it around on us. The headline is \'Ridgemont\'s Desperate Mudslinging.\' We\'re in damage control mode."',
    ],
  },

  {
    id: 'fullCount',
    name: 'The Full Count',
    tier: 3,
    cost: 2000,
    baseSuccess: 0.50,
    description: 'An all-out defensive purge that clears existing sabotage and locks down the stadium.',
    flavorIntro: '"Full count, bases loaded, bottom of the ninth. I know every sabotage trick in the book because I INVENTED half of them. Let me sweep the building."',
    successEffect: { type: 'compound', effects: [{ type: 'clearAllSabotage' }, { type: 'sabotageImmunity', days: 5 }] },
    failEffect: { type: 'compound', effects: [{ type: 'disableDefenses', days: 3 }, { type: 'triggerSabotage' }] },
    successFlavor: [
      '"Every bug, every tampered valve, every rigged timer — FOUND AND NEUTRALIZED. This stadium is a fortress now. Victor can\'t touch us."',
      '"I found seventeen separate sabotage devices. SEVENTEEN. Victor\'s been busier than I thought. All cleared. Building is locked down tight."',
      '"Clean sweep! And I booby-trapped the access points so Victor\'s guys can\'t get back in. We\'re untouchable for the next week."',
    ],
    failFlavor: [
      '"So... while I was sweeping for sabotage, I accidentally tripped Victor\'s failsafe. He had a backup plan. Things just got worse."',
      '"I found the devices but one of them was a decoy. The real sabotage was in the system I DISABLED to do the sweep. We\'re exposed."',
      '"Victor anticipated the sweep. He planted false leads that wasted my time while his real team hit us from behind. Defenses are down."',
    ],
  },

  {
    id: 'glendalGopherSpecial',
    name: 'Glendale Gopher Special',
    tier: 3,
    cost: 3000,
    baseSuccess: 0.40,
    description: 'Sully\'s legendary (and possibly illegal) gambit to shut down Victor\'s sabotage network entirely.',
    flavorIntro: '"This is the Glendale Gopher Special. Named after an incident in \'04 that I will NEVER discuss in court. Complete sabotage blackout. But if it goes wrong... it goes VERY wrong."',
    successEffect: { type: 'sabotageImmunity', days: 14 },
    failEffect: { type: 'compound', effects: [{ type: 'npcRelationship', npc: 'bea', amount: -5 }, { type: 'reputation', amount: -3 }] },
    successFlavor: [
      '"FOURTEEN DAYS of peace. Victor\'s entire network is compromised. His guys don\'t know who to trust. The Gopher Special strikes again!"',
      '"It worked PERFECTLY. Victor\'s sabotage operation is in complete disarray. They\'re so confused they sabotaged THEIR OWN stadium."',
      '"The Gopher Special has a 100% success rate! Well, when it works. Which is now! Two weeks of absolutely zero sabotage. You\'re welcome."',
    ],
    failFlavor: [
      '"Okay so the Gopher Special went sideways and Bea Thornton somehow got involved. She is NOT happy. Also, we might\'ve broken a few regulations."',
      '"Bad news: Inspector Thornton caught wind of the operation. She\'s questioning our \'operational integrity.\' That\'s inspector for \'you\'re in trouble.\'"',
      '"The Gopher Special has a dark side. Bea found evidence of our... \'extracurricular activities.\' She\'s taking it personally. And our rep took a hit."',
    ],
  },
];
