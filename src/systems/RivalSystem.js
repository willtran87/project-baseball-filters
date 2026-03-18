/**
 * RivalSystem -- Simulates Victor's Glendale Grizzlies stadium off-screen.
 *
 * Tracks rival reputation and generates competitive tension through
 * league standings comparisons and story-driven events.
 *
 * rivalRep starts at 60 and drifts based on story chapter:
 *   Ch1-2: rises slowly (+0.1/day)
 *   Ch3-4: stagnates (small random drift)
 *   Ch5:   declines if player rep > 80
 *
 * Sabotage system: Victor executes targeted sabotage actions that
 * escalate with player reputation. Players can purchase counter-strategies.
 */

import { VICTOR_TAUNTS, VICTOR_FRUSTRATIONS, RIVAL_SEASON_AWARDS, NPC_DATA } from '../data/storyData.js';

// -- Sabotage Types ----------------------------------------------------------

const SABOTAGE_TYPES = [
  {
    id: 'supplyDisruption',
    name: 'The Great Filter Heist',
    description: 'Victor hijacked your filter deliveries — costs are through the roof!',
    repRange: [30, 100],
    effect: (state) => {
      state._supplyCostDays = 5;
      state._supplyCostMultiplier = 1.2;
    },
  },
  {
    id: 'bribeInspector',
    name: 'Umpire\'s Bad Call',
    description: 'Victor wined and dined the health inspector — expect a brutal visit!',
    repRange: [40, 100],
    effect: (state) => {
      state._nextInspectionPenalty = 0.7;
    },
  },
  {
    id: 'poachStaff',
    name: 'Free Agent Tampering',
    description: 'Victor is sweet-talking your crew with promises of greener dugouts!',
    repRange: [50, 100],
    effect: (state) => {
      const staffList = state.staffList ?? [];
      if (staffList.length === 0) return;
      let target = staffList[0];
      for (const s of staffList) {
        if ((s.morale ?? 50) < (target.morale ?? 50)) target = s;
      }
      if (Math.random() < 0.5) {
        const idx = staffList.indexOf(target);
        if (idx >= 0) {
          staffList.splice(idx, 1);
          state.staffCount = staffList.length;
          state._lastPoachedStaff = target.name ?? 'a staff member';
        }
      }
    },
  },
  {
    id: 'smearCampaign',
    name: 'Dugout Dirt',
    description: 'Victor planted hit pieces in the press — your name is mud!',
    repRange: [60, 100],
    effect: (state) => {
      state._smearCampaignDays = 3;
    },
  },
  {
    id: 'infrastructureStress',
    name: 'Mascot Mischief',
    description: 'Victor\'s goons went to town on your equipment — things are falling apart!',
    repRange: [30, 100],
    effect: (state, targetDomain) => {
      state._infraStressDomain = targetDomain ?? 'water';
      state._infraStressDays = 3;
    },
  },
  {
    id: 'hotdogFlood',
    name: 'The Weiner Incident',
    description: 'Someone crammed ten thousand hot dogs into your drainage system. It\'s... bad.',
    repRange: [30, 100],
    effect: (state) => {
      // All filters degrade 15% faster for 4 days
      state._hotdogFloodDays = 4;
      state._hotdogDegradeMultiplier = 1.15;
    },
  },
  {
    id: 'cursedBobblehead',
    name: 'The Cursed Bobblehead',
    description: 'A mysterious bobblehead appeared in the dugout. The team can\'t stop staring at it.',
    repRange: [40, 100],
    effect: (state) => {
      // Team performance tanks for 3 days (stored as separate sabotage mod so ConsequenceSystem doesn't overwrite)
      state._cursedBobbleDays = 3;
      state._sabotageTeamPerfMod = 0.85;
    },
  },
  {
    id: 'sprinklerPrank',
    name: 'Sprinkler Surprise',
    description: 'Every sprinkler in the stadium just went off during a sold-out game. Classic Victor.',
    repRange: [35, 100],
    effect: (state) => {
      // Attendance hit for 3 days (stored as separate sabotage mod so ConsequenceSystem doesn't overwrite)
      state._sprinklerPrankDays = 3;
      state._sabotageAttendanceMod = 0.88;
    },
  },
  {
    id: 'organSwap',
    name: 'Rally Organ Ransom',
    description: 'Victor stole the rally organ and replaced it with a kazoo. Fan morale is in freefall.',
    repRange: [50, 100],
    effect: (state) => {
      // Revenue hit for 5 days (stored as separate sabotage mod so ConsequenceSystem doesn't overwrite)
      state._organSwapDays = 5;
      state._sabotageRevenueMod = 0.90;
    },
  },
  {
    id: 'baseballGremlins',
    name: 'Gremlin Infestation',
    description: 'Tiny creatures in Grizzlies jerseys are chewing through wires and stealing bolts.',
    repRange: [45, 100],
    effect: (state) => {
      // Random filter takes heavy damage
      const filters = state.filters ?? [];
      const active = filters.filter(f => f.condition > 0);
      if (active.length > 0) {
        const victim = active[Math.floor(Math.random() * active.length)];
        victim.condition = Math.max(0, victim.condition - victim.maxCondition * 0.4);
        state._gremlinVictimId = victim.id;
        state._gremlinVictimDomain = victim.domain ?? 'unknown';
      }
      // Also minor all-domain health hit
      state._gremlinDays = 2;
    },
  },
];

// -- Absurd Baseball-Flavored Sabotage Announcements -------------------------

const SABOTAGE_FLAVOR = {
  supplyDisruption: [
    'Victor hired a fleet of trained raccoons to reroute your filter deliveries to a Little League field in Tuscaloosa.',
    'A man matching Victor\'s description was seen bribing your filter supplier with season tickets and a signed Babe Ruth "replica." Supplier says the deal was too good.',
    'Your supply truck was last seen doing laps around a roundabout in New Jersey. The driver says a Glendale Grizzlies GPS was "helpfully" installed overnight.',
    'Victor allegedly paid a group of retired umpires to form a human barricade around your loading dock. They keep yelling "SAFE!" whenever a delivery tries to get through.',
    'Customs just flagged your filter shipment. Someone labeled every box "LIVE BEES — HANDLE WITH EXTREME CAUTION." Filter costs up 20%.',
    'Your filter vendor called. He says a man in a Grizzlies windbreaker offered him a "once-in-a-lifetime timeshare opportunity" and he\'ll be unavailable for a week.',
    'A suspiciously specific traffic jam has blocked every road to Ridgemont. Eyewitnesses report a fleet of Glendale mascot trucks doing 5 mph in every lane.',
    'Your delivery was rerouted to the Glendale stadium loading dock. Victor says it was "an honest mistake" and that he\'ll "get around to returning it eventually."',
    'Someone filed 200 separate building permits in your name at City Hall. Your supplier can\'t get through the parking lot. Victor was seen leaving with a briefcase full of forms.',
    'The filter warehouse burned down. Just kidding — but Victor did convince the landlord to convert it into a Grizzlies fan merchandise store. Supply disrupted.',
  ],
  bribeInspector: [
    'The health inspector was spotted at a steakhouse with Victor, ordering two porterhouses and "casually discussing stadium grades." Your next inspection just got personal.',
    'The inspector\'s new golf bag has a Glendale Grizzlies logo on it. His handicap also mysteriously improved. Expect a thorough visit.',
    'Victor gifted the health inspector a luxury suite at Glendale, a monogrammed clipboard, and what sources describe as "an unreasonable amount of beef jerky."',
    'An anonymous tip line received a 47-page complaint about your stadium signed only as "Definitely Not Victor." The inspector is taking it very seriously.',
    'The inspector just returned from a "totally unrelated" vacation in Glendale. He\'s wearing a Grizzlies hat and keeps muttering about "real stadium standards."',
    'Victor enrolled the health inspector in a "Stadium Excellence Masterclass" held exclusively at Glendale. The graduation ceremony included a very thorough grading rubric.',
    'A gift basket arrived at the inspector\'s office containing artisanal cheese, a bottle of wine, and a 14-point memo titled "Concerns About Ridgemont Stadium (Confidential)."',
    'The inspector\'s kids were spotted at Glendale wearing VIP lanyards and eating free nachos. The inspector insists this will not affect his professional judgment.',
  ],
  poachStaff: [
    'Victor left a trail of baseball cards and a pamphlet titled "Glendale: Where Dreams Come True (Better Dental Plan)" leading from your dugout to the parking lot.',
    'A carrier pigeon landed on your stadium with a Glendale job offer strapped to its leg, a tiny Grizzlies jersey, and a miniature signing bonus.',
    'Your unhappiest employee received a singing telegram from Victor. The song was "Take Me Out to the (Other) Ballgame." They were moved to tears.',
    'Victor set up a lemonade stand outside your employee entrance offering "free career counseling" and suspiciously competitive salary packages.',
    'A Glendale recruitment blimp has been hovering over your parking lot for three hours. It\'s playing "Don\'t Stop Believin\'" on a loop and dropping tiny parachute résumé forms.',
    'Victor personally hand-delivered a fruit basket to your break room with a card reading "You deserve better. Call me. — V" and a burner phone taped to a banana.',
    'Someone slid Glendale employment brochures under every bathroom stall door in your stadium. The benefits package includes a "dedicated nap room."',
    'Victor hired a mariachi band to serenade your lowest-morale employee during their lunch break. The final song was "Adiós Ridgemont, Hola Glendale."',
    'A stretch limo with Glendale plates has been idling outside your staff entrance since 6 AM. The chauffeur is holding a sign that says "YOUR NAME HERE."',
  ],
  smearCampaign: [
    'The Ridgemont Herald is running a 3-part exposé titled "Is Casey Peralta Actually Three Raccoons in a Trenchcoat?" Reputation taking daily hits.',
    'Victor hired a skywriter to spell "RIDGEMONT SMELLS" over the stadium. Unfortunately, it was a clear day and everyone saw it. Including your mother.',
    'Someone bought every billboard on the highway to Ridgemont and replaced them with a photo of Victor giving a thumbs up next to the text "AT LEAST OUR PIPES WORK."',
    'A new podcast called "Filtration Nation: A Disaster Story" just dropped with 5 episodes about your stadium. It already has more listeners than your PA announcer.',
    'Victor released a line of novelty t-shirts reading "I Survived Ridgemont Stadium (Barely)." They\'re the #1 seller at every gas station in the tri-county area.',
    'A fake Yelp page for Ridgemont Stadium appeared overnight with 400 one-star reviews. Every single one mentions "suspicious odors" and "a man named Victor recommended I visit Glendale instead."',
    'The local news ran a segment called "Ridgemont: Stadium or Haunted House?" after receiving an anonymous VHS tape of your mechanical room set to horror movie music.',
    'Victor funded a children\'s coloring book titled "Great Stadiums of America." Ridgemont is conspicuously absent. Glendale gets a two-page spread with a pop-up section.',
    'A food truck parked outside your gates is selling a sandwich called "The Ridgemont Disaster." It\'s just wet bread. The truck has Glendale branding on the back.',
    'Someone created a TikTok account called @RidgemontFails posting compilation videos of your worst moments. It has 50,000 followers. Victor follows it from his verified account.',
  ],
  infrastructureStress: [
    'Someone loosened every bolt in your {domain} system with what witnesses describe as "a comically large wrench" and "surprisingly good technique."',
    'Victor\'s guys allegedly poured maple syrup into your {domain} pipes. Maintenance reports the system now smells "delicious but deeply wrong."',
    'A Glendale Grizzlies intern was caught trying to feed hot dogs to your {domain} equipment. He claims he was "just being friendly." System health declining.',
    'Your {domain} system was discovered wrapped entirely in Glendale promotional banners. Removing them will take days. Victor denies everything while grinning.',
    'Security footage shows a figure in a full Grizzlies mascot costume doing what can only be described as "aggressive maintenance" on your {domain} system at 3 AM.',
    'Someone replaced all the warning labels on your {domain} equipment with motivational quotes attributed to Victor. "Winners don\'t need working pipes. — V. Harrison"',
    'A family of possums was released into your {domain} system. Each one was wearing a tiny Glendale jersey. Animal control says they\'ve "never seen anything like it."',
    'Your {domain} control panel was reprogrammed to play the Glendale Grizzlies fight song every time it activates. The password was changed to "VictorRules69."',
    'Maintenance found a note duct-taped to your {domain} mainline reading: "Sorry about your system. Actually, no I\'m not. — Hugs, Victor."',
    'Every gauge on your {domain} system was replaced with a novelty gauge that only reads "GLENDALE IS BETTER." Actual readings unavailable for days.',
  ],
  hotdogFlood: [
    'Maintenance opened the drainage access panel and was immediately hit by an avalanche of ballpark franks. The tunnel is six inches deep in processed meat.',
    'The hot dog vendor swears he didn\'t do it. Security footage shows a man in a Grizzlies windbreaker backing a U-Haul full of Oscar Mayers up to the service entrance at 4 AM.',
    'Your drainage system has been declared a biohazard. A plumber took one look, said "absolutely not," and walked to his car. He was last seen driving toward Glendale.',
    'Fans are reporting a "meaty aroma" in the concourse. The source: 10,000 hot dogs packed into every pipe, vent, and duct Victor\'s guys could access overnight.',
    'The fire department was called when your sprinklers started shooting mustard. Turns out someone replaced the water main connection with a condiment line from the concession stand.',
    'A note was found in the mechanical room: "Ridgemont: Where every pipe is a hot dog pipe. You\'re welcome. — V." The plumbing concurs.',
    'Your filters are clogged with what the lab describes as "a proprietary blend of mystery meat, relish, and stadium-grade hubris." Degradation accelerating.',
    'An anonymous food delivery of 10,000 hot dogs was addressed to "The Ridgemont Pipes, c/o Nobody Will Ever Find These." Victor was seen at a bulk meat wholesaler yesterday.',
  ],
  cursedBobblehead: [
    'The bobblehead has Victor\'s face, glowing red eyes, and a plaque reading "YOU WILL LOSE." The team refuses to take the field until it stops nodding.',
    'Three players have reported the bobblehead "moved" overnight. The equipment manager tried to throw it away twice. It keeps coming back. The team is rattled.',
    'The cursed bobblehead\'s head fell off during batting practice. Inside: a tiny speaker playing Victor whispering "strikeout" on a loop. Team morale plummeting.',
    'The bobblehead was confiscated and locked in a safe. The safe was found open the next morning with the bobblehead sitting on top, nodding. The team has started a prayer circle.',
    'A sports psychologist was hired to address the "bobblehead situation." She lasted two hours before requesting a transfer to Glendale. The bobblehead nodded approvingly.',
    'Someone put a tiny Grizzlies cap on the bobblehead overnight. It now nods 30% faster. The team lost three straight. Coincidence? The bobblehead says no.',
    'The groundskeeper tried to bury the bobblehead under home plate. It was back on the dugout bench by first pitch. It was wearing sunglasses this time.',
    'An exorcist was consulted. He took one look at the bobblehead, said "that\'s a Victor Harrison original — I can\'t help you," and left his business card with Glendale.',
  ],
  sprinklerPrank: [
    'Every sprinkler in the stadium activated simultaneously during the 7th inning stretch. 15,000 soaking wet fans are demanding refunds. Victor was seen in the parking lot with binoculars.',
    'The sprinkler control panel was rewired to a big red button labeled "DO NOT PRESS" left in the mascot\'s dressing room. The mascot pressed it. Of course he pressed it.',
    'Your field sprinklers spelled out "GO GRIZZLIES" in water before soaking the entire infield. The grounds crew is inconsolable. The visiting team thinks it\'s hilarious.',
    'Someone set the sprinklers to activate every time your team scores. Your team scored 8 runs. The stadium is now a water park. Fans are using programs as umbrellas.',
    'The luxury suites got it worst — the sprinklers up there were modified to spray Glendale-branded sports drinks. The carpets are ruined. The drink was grape flavored.',
    'The outfield sprinklers created a geyser that launched a hot dog vendor\'s cart 15 feet in the air. No injuries, but the mustard stains on the scoreboard are permanent.',
    'Maintenance found the sprinkler timer set to "Maximum Chaos" — a setting that doesn\'t exist on the original hardware. Someone soldered it in. It has a Glendale logo.',
    'The press box sprinklers went off during a live broadcast. The commentator\'s review: "And now it\'s raining INDOORS, folks. This is peak Ridgemont baseball."',
  ],
  organSwap: [
    'The rally organ has been replaced with 200 kazoos duct-taped to a box fan. The 7th inning stretch sounded like a swarm of angry bees with school spirit.',
    'Victor ransomed the organ for "one public admission that Glendale is superior." Instead of paying, your PA announcer has been beatboxing. Fans are divided.',
    'The organ was found in Glendale\'s parking lot, repainted in Grizzlies colors, with a note: "She\'s happier here. Don\'t call." Fan morale tanking without the rally vibes.',
    'A ransom video arrived: the organ in a dimly lit room, Victor playing "Taps" on it while the Glendale mascot holds today\'s newspaper. Your fans are demoralized.',
    'Without the rally organ, your 7th inning stretch is just awkward silence and one guy with a tuba he brought from home. Concession sales down — fans have lost the will to snack.',
    'Victor replaced the organ with a bluetooth speaker playing a 10-hour loop of "Glendale\'s Greatest Hits." It cannot be unplugged. Maintenance says the speaker is "somehow load-bearing."',
    'The organist showed up to work, saw the kazoo wall, and immediately filed for emotional distress. He\'s currently performing at Glendale as a "temporary arrangement."',
    'Fans started a GoFundMe for a new organ. Victor anonymously donated $1 with the note "Every little bit helps. Unlike Ridgemont\'s filtration. — xoxo V."',
  ],
  baseballGremlins: [
    'Security footage shows dozens of tiny figures in Grizzlies jerseys pouring out of a Glendale-branded crate left by the loading dock. They move fast and they\'re organized.',
    'The gremlins chewed through your best filter\'s power cable and built a tiny fort out of the copper wiring. A flag made from a Glendale pennant flies from the top.',
    'Maintenance cornered a gremlin behind the boiler. It hissed, threw a bolt at them, and escaped through a vent. It was wearing a tiny Victor Harrison name badge.',
    'The gremlins have unionized. They left a list of demands on the mechanical room door: "1. More bolts to steal. 2. Warmer vents. 3. Ridgemont surrender." Signed, Local 69.',
    'Your electrical panel looks like a crime scene. Wires chewed, breakers flipped, and a tiny chalk outline of a bolt drawn on the floor. The gremlins are getting theatrical.',
    'Animal control arrived, assessed the situation, and said "those aren\'t animals, those are Victor\'s guys in really convincing costumes." On closer inspection: inconclusive.',
    'A gremlin was spotted riding a mouse through the concourse like a tiny cowboy. It tipped its hat at a security guard before vanishing into a floor drain. Morale is complicated.',
    'The head gremlin left a Yelp review for your mechanical room: "2 stars. Decent bolt selection but the security is laughable. Would ransack again." It has 47 helpful votes.',
  ],
};

// -- Sabotage Impact Descriptions -------------------------------------------

const SABOTAGE_IMPACT = {
  supplyDisruption: 'Filter prices jacked up 20% for 5 days',
  bribeInspector: 'Next inspection 30% tougher — inspector has a grudge',
  poachStaff: null, // dynamic — handled in code
  smearCampaign: 'Rep taking -1/day hits for 3 days',
  infrastructureStress: null, // dynamic — includes domain name
  hotdogFlood: 'All filters degrading 15% faster for 4 days',
  cursedBobblehead: 'Team performance -15% for 3 days',
  sprinklerPrank: 'Attendance down 12% for 3 days',
  organSwap: 'Revenue down 10% for 5 days — fans lost the vibes',
  baseballGremlins: null, // dynamic — includes damaged filter info
};

// -- Rival Defense Definitions -----------------------------------------------

const RIVAL_DEFENSE_DEFS = {
  securityUpgrade: {
    name: 'Security Upgrade',
    description: 'Blocks the next sabotage attempt',
    cost: 2000,
    durationDays: 10,
  },
  counterIntel: {
    name: 'Counter-Intel',
    description: 'Reveals Victor\'s next sabotage plan',
    cost: 3000,
    durationDays: 0, // one-shot reveal
  },
  mediaResponse: {
    name: 'Media Response',
    description: 'Nullifies active and future smear campaigns',
    cost: 1500,
    durationDays: 14,
  },
};

// -- Escalation Tiers --------------------------------------------------------

const ESCALATION_TIERS = [
  { minRep: 30, maxRep: 49, chance: 0.08, types: ['supplyDisruption', 'hotdogFlood', 'sprinklerPrank'], doubleChance: 0 },
  { minRep: 50, maxRep: 64, chance: 0.12, types: ['supplyDisruption', 'bribeInspector', 'hotdogFlood', 'cursedBobblehead', 'sprinklerPrank'], doubleChance: 0 },
  { minRep: 65, maxRep: 79, chance: 0.15, types: ['supplyDisruption', 'bribeInspector', 'poachStaff', 'smearCampaign', 'hotdogFlood', 'cursedBobblehead', 'organSwap', 'baseballGremlins'], doubleChance: 0 },
  { minRep: 80, maxRep: 100, chance: 0.20, types: ['supplyDisruption', 'bribeInspector', 'poachStaff', 'smearCampaign', 'cursedBobblehead', 'organSwap', 'baseballGremlins', 'sprinklerPrank'], doubleChance: 0.15 },
];

export class RivalSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;

    // Weekly standings comparison timer
    this._weekTimer = 0;
    this._weekInterval = 7; // every 7 game-days
    this._lastComparedDay = 0;

    // Track Victor taunt cooldown to avoid spamming
    this._lastTauntDay = 0;
    this._tauntCooldown = 14; // at least 14 days between taunts

    // Rival insight cooldown (Victor relationship bonus)
    this._lastInsightDay = 0;

    // Victor full dialogue limit: 1 per day
    this._victorDialogueToday = false;

    // Sabotage delayed by Priya tip (executes next day instead)
    this._sabotageDelayed = null;

    // Season tracking for end-of-season awards
    this._lastSeason = state.season ?? 1;

    // Initialize rivalry defense state if not present
    this._ensureRivalDefenses();

    this.eventBus.on('game:newDay', (data) => this._onNewDay(data));
    // Re-sync after save/load to avoid false season-end awards
    this.eventBus.on('state:loaded', () => {
      this._lastSeason = this.state.season ?? 1;
      this._lastComparedDay = this.state.gameDay ?? 0;
      this._victorDialogueToday = false;
      this._sabotageDelayed = null;
      this._ensureRivalDefenses();
    });
    // UI-driven defense purchases
    this.eventBus.on('rival:purchaseDefense', (data) => {
      if (data?.type) this.purchaseDefense(data.type);
    });
    // Scheme-triggered immediate sabotage (scheme failure consequence)
    this.eventBus.on('scheme:triggerSabotage', () => {
      this._forceImmediateSabotage();
    });
  }

  _ensureRivalDefenses() {
    if (!this.state._rivalDefenses) {
      this.state._rivalDefenses = {
        securityUpgrade: { active: false, daysLeft: 0 },
        counterIntel: { active: false, revealedType: null },
        mediaResponse: { active: false, daysLeft: 0 },
      };
    }
  }

  update(dt) {
    if (this.state.paused) return;
    // Rival rep drift is handled per game-day in _onNewDay, not per tick
  }

  // -- Day-based updates -----------------------------------------------

  _onNewDay(data) {
    // Reset daily Victor dialogue flag
    this._victorDialogueToday = false;

    // Execute delayed sabotage from previous day's Priya tip
    if (this._sabotageDelayed) {
      const delayed = this._sabotageDelayed;
      const delayedDomain = this._sabotageDelayedDomain;
      this._sabotageDelayed = null;
      this._sabotageDelayedDomain = null;
      this._executeSabotage([delayed], this.state._rivalDefenses, delayedDomain);
    }

    this._driftRivalRep();
    this._updateMomentum();
    this._checkWeeklyStandings(data);
    this._checkSeasonEnd();
    this._checkRivalInsight();
    this._checkVictorEncounter();
    this._tickDefenses();
    this._checkSabotage();
    this._tickSmearCampaign();
    this._tickSupplyCost();
    this._tickInfraStress();
    this._tickHotdogFlood();
    this._tickCursedBobblehead();
    this._tickSprinklerPrank();
    this._tickOrganSwap();
    this._tickGremlins();
  }

  /**
   * Drift rival reputation based on current story chapter.
   */
  _driftRivalRep() {
    const chapter = this.state.storyChapter ?? 1;
    const playerRep = this.state.reputation;
    let rivalRep = this.state.rivalRep ?? 60;

    if (chapter <= 2) {
      // Victor is rising -- Ch1-2
      rivalRep += 0.1;
    } else if (chapter <= 4) {
      // Stagnation -- small random drift
      rivalRep += (Math.random() - 0.5) * 0.1;
    } else {
      // Ch5+: Victor declines if player is strong
      if (playerRep > 80) {
        rivalRep -= 0.15;
      } else {
        rivalRep += (Math.random() - 0.5) * 0.05;
      }
    }

    // Clamp to 10-95 range (Victor never fully collapses or hits 100)
    rivalRep = Math.max(10, Math.min(95, rivalRep));
    this.state.set('rivalRep', Math.round(rivalRep * 10) / 10);
  }

  /**
   * Update rival momentum (-3 to +3). Tracks competitive pressure between
   * player and Victor over consecutive days.
   */
  _updateMomentum() {
    let momentum = this.state.rivalMomentum ?? 0;

    // Track consecutive reputation gain days
    const repGainStreak = this.state._repGainStreak ?? 0;
    const repBudget = this.state._repChangesToday ?? { positive: 0, negative: 0 };
    const gainedRepYesterday = (repBudget.positive ?? 0) > 0;
    if (gainedRepYesterday) {
      this.state._repGainStreak = repGainStreak + 1;
    } else {
      this.state._repGainStreak = 0;
    }
    // Player gaining rep 3+ days straight: momentum -1
    if (this.state._repGainStreak >= 3) {
      momentum = Math.max(-3, momentum - 1);
      this.state._repGainStreak = 0; // Reset streak after applying
    }

    // Player domain crisis (any domain < 25%): momentum +1
    const health = this.state.domainHealth;
    if (health) {
      const domainKeys = Object.keys(this.state.config?.filtrationSystems ?? { air: 1, water: 1, hvac: 1, drainage: 1 });
      for (const key of domainKeys) {
        if ((health[key] ?? 100) < 25) {
          momentum = Math.min(3, momentum + 1);
          break; // Only +1 per day even if multiple crises
        }
      }
    }

    // Clamp to [-3, +3]
    momentum = Math.max(-3, Math.min(3, momentum));
    this.state.rivalMomentum = momentum;
  }

  /**
   * Weekly league standings comparison.
   * Affects gameplay: player leading = small rep/morale boost,
   * rival dominant = pressure and media negativity.
   */
  _checkWeeklyStandings(data) {
    const day = data?.day ?? this.state.gameDay;
    if (day - this._lastComparedDay < this._weekInterval) return;
    this._lastComparedDay = day;

    const playerRep = this.state.reputation;
    const rivalRep = this.state.rivalRep;
    const gap = Math.abs(playerRep - rivalRep);
    const playerLeading = playerRep > rivalRep;

    this.eventBus.emit('rival:standings', {
      playerRep,
      rivalRep,
      day,
      playerLeading,
      gap,
    });

    // Gameplay effects from rivalry standings
    if (playerLeading && gap >= 10) {
      // Player is ahead: small rep boost from league recognition
      this.state.adjustReputation(1);
      // Victor frustration taunt
      this._maybeVictor(day, false);
    } else if (!playerLeading && gap >= 15) {
      // Victor is dominant: pressure, media negativity, owner concern
      this.state.adjustReputation(-1);
      this.eventBus.emit('rival:dominant', {
        rivalRep,
        playerRep,
        gap: rivalRep - playerRep,
      });
      this.eventBus.emit('ui:message', {
        text: `The Glendale Grizzlies are ${Math.floor(gap)} points ahead in the standings. Victor is smiling. Maggie is not.`,
        type: 'warning',
      });
      // Victor taunt
      this._maybeVictor(day, true);
    } else if (!playerLeading && gap >= 5) {
      // Victor is slightly ahead — occasional taunt
      this._maybeVictor(day, true);
    }
  }

  /**
   * Possibly emit a Victor taunt or frustration message.
   */
  _maybeVictor(day, victorAhead) {
    if (day - this._lastTauntDay < this._tauntCooldown) return;
    if (Math.random() > 0.5) return; // 50% chance to actually taunt

    this._lastTauntDay = day;
    const pool = victorAhead ? VICTOR_TAUNTS : VICTOR_FRUSTRATIONS;
    const msg = pool[Math.floor(Math.random() * pool.length)];

    this.eventBus.emit('ui:message', {
      text: msg,
      type: victorAhead ? 'warning' : 'success',
    });
    this.eventBus.emit('rival:taunt', {
      text: msg,
      victorAhead,
      day,
    });
  }

  /**
   * End-of-season award.
   */
  _checkSeasonEnd() {
    const season = this.state.season ?? 1;
    if (season <= this._lastSeason) return;
    this._lastSeason = season;

    const playerRep = this.state.reputation;
    const rivalRep = this.state.rivalRep;
    const winner = playerRep >= rivalRep ? 'player' : 'rival';

    this.eventBus.emit('rival:seasonAward', {
      season: season - 1,
      winner,
      playerRep,
      rivalRep,
    });

    const pool = winner === 'player' ? RIVAL_SEASON_AWARDS.win : RIVAL_SEASON_AWARDS.lose;
    const msg = pool[Math.floor(Math.random() * pool.length)]
      .replace('{season}', String(season - 1));
    this.eventBus.emit('ui:message', {
      text: msg,
      type: winner === 'player' ? 'success' : 'warning',
    });
  }

  // -- NPC Relationship Bonuses -----------------------------------------

  /**
   * rivalInsight bonus: when flag is set, reveal Victor's current strategy.
   * Shows a hint about his standings drift direction once per week.
   */
  _checkRivalInsight() {
    if (!this.state.storyFlags?.rivalInsight) return;
    // Only show insight once per 7 days
    const day = this.state.gameDay ?? 0;
    if (this._lastInsightDay && day - this._lastInsightDay < 7) return;
    this._lastInsightDay = day;

    const chapter = this.state.storyChapter ?? 1;
    const rivalRep = this.state.rivalRep ?? 60;
    let hint;
    if (chapter <= 2) {
      hint = 'Victor is investing heavily in Glendale. Expect his reputation to keep climbing.';
    } else if (chapter <= 4 && rivalRep > this.state.reputation) {
      hint = 'Victor seems content to coast. His numbers are stable but not growing.';
    } else if (chapter >= 5 && this.state.reputation > 80) {
      hint = 'Victor is rattled. His stadium is losing ground. Keep the pressure on.';
    } else {
      hint = 'Victor is watching you closely, but making no big moves this week.';
    }
    this.eventBus.emit('ui:message', {
      text: `Rival intel: ${hint}`,
      type: 'info',
    });
  }

  /**
   * Random Victor encounter: 10% daily chance in chapter 2+.
   * 50% of encounters trigger a full casual dialogue instead of a toast taunt.
   * Full dialogue limited to 1 per day via _victorDialogueToday flag.
   */
  _checkVictorEncounter() {
    const chapter = this.state.storyChapter ?? 1;
    if (chapter < 2) return;

    // Momentum affects encounter chance: >=2 means +5%, <=-2 means -5%
    const momentum = this.state.rivalMomentum ?? 0;
    let encounterChance = 0.10;
    if (momentum >= 2) encounterChance += 0.05;
    else if (momentum <= -2) encounterChance -= 0.05;
    if (Math.random() > encounterChance) return;

    const encounters = (this.state.victorEncounters ?? 0) + 1;
    this.state.set('victorEncounters', encounters);

    // Momentum <= -2: Victor may offer a truce dialogue instead of taunting
    if (momentum <= -2 && !this._victorDialogueToday && Math.random() < 0.4) {
      this._victorDialogueToday = true;
      this.eventBus.emit('rival:victorEncounter', { encounters, dialogue: true, truce: true });
      this.eventBus.emit('ui:message', {
        text: 'Victor approaches quietly: "Look... maybe we got off on the wrong foot. What do you say we ease up for a while?"',
        type: 'info',
        npcName: 'Victor Salazar',
      });
      return;
    }

    // 50% chance to trigger full dialogue (max 1 per day)
    if (!this._victorDialogueToday && Math.random() < 0.5) {
      this._victorDialogueToday = true;
      this.eventBus.emit('rival:victorEncounter', { encounters, dialogue: true });
      this.eventBus.emit('npc:startChat', { npcId: 'victor' });
      return;
    }

    // Momentum >= 2: Victor taunts more aggressively
    // Otherwise, toast taunt as before
    // Every 5th encounter, Victor is more frustrated
    const pool = (momentum >= 2 || encounters % 5 === 0) ? VICTOR_FRUSTRATIONS : VICTOR_TAUNTS;
    const text = pool[Math.floor(Math.random() * pool.length)];

    const victor = NPC_DATA.victor;
    const portrait = victor?.portraits?.smug ?? 'portrait_victor_smug';

    this.eventBus.emit('rival:victorEncounter', { encounters, text });
    this.eventBus.emit('ui:message', {
      text,
      type: 'warning',
      portrait,
      npcName: victor?.name ?? 'Victor Salazar',
    });
  }

  // -- Sabotage System ---------------------------------------------------

  /**
   * Check if Victor triggers sabotage today based on escalation tier.
   */
  _checkSabotage() {
    const chapter = this.state.storyChapter ?? 1;
    if (chapter < 2) return;

    const day = this.state.gameDay ?? 1;
    const ss = this.state.schemeState;

    // Scheme: sabotage immunity check
    if (ss?.sabotageImmunityUntil > day) return;

    // Scheme: one-time block next sabotage
    if (ss?.blockNextSabotage) {
      ss.blockNextSabotage = false;
      this.eventBus.emit('ui:message', {
        text: 'Sully\'s intel blocked Victor\'s sabotage attempt!',
        type: 'success',
      });
      this.eventBus.emit('rival:sabotageBlocked', { type: 'schemeBlock', name: 'Sully\'s Counter-Intel' });
      return;
    }

    const playerRep = this.state.reputation;
    const tier = ESCALATION_TIERS.find(t => playerRep >= t.minRep && playerRep <= t.maxRep);
    if (!tier) return;

    // Momentum affects sabotage chance: baseSabotageChance + (momentum * 2%)
    const momentum = this.state.rivalMomentum ?? 0;
    let adjustedChance = tier.chance + (momentum * 0.02);

    // Scheme: sabotage chance multiplier
    if (ss?.sabotageChanceMultiplier != null && ss.sabotageChanceMultiplier !== 1.0) {
      adjustedChance *= ss.sabotageChanceMultiplier;
    }

    if (Math.random() > adjustedChance) return;

    // Adaptive sabotage: 60% chance to target player's weakest domain
    const health = this.state.domainHealth;
    let adaptiveType = null;
    let adaptiveDomain = null;
    if (health && Math.random() < 0.60) {
      // Find weakest domain
      let weakest = null;
      let weakestScore = Infinity;
      const allDomainKeys = Object.keys(this.state.config?.filtrationSystems ?? { air: 1, water: 1, hvac: 1, drainage: 1 });
      for (const key of allDomainKeys) {
        const score = health[key] ?? 100;
        if (score < weakestScore) {
          weakestScore = score;
          weakest = key;
        }
      }
      if (weakest) {
        adaptiveDomain = weakest;
        if (weakest === 'air' || weakest === 'hvac') {
          // Target air/hvac weakness with supply disruption (filter cost spike)
          adaptiveType = SABOTAGE_TYPES.find(s => s.id === 'supplyDisruption');
        } else {
          // Target water/drainage weakness with infrastructure stress
          adaptiveType = SABOTAGE_TYPES.find(s => s.id === 'infrastructureStress');
        }
      }
    }

    // Fallback: pick from tier's allowed types (original random behavior)
    const availableTypes = adaptiveType
      ? [adaptiveType]
      : SABOTAGE_TYPES.filter(s => tier.types.includes(s.id));
    if (availableTypes.length === 0) return;

    // Check counter-intel: if active, reveal AND block the sabotage
    const defenses = this.state._rivalDefenses;
    if (defenses?.counterIntel?.active) {
      const revealed = adaptiveType ?? availableTypes[Math.floor(Math.random() * availableTypes.length)];
      const targetLabel = adaptiveDomain ? ` targeting ${adaptiveDomain}` : '';
      defenses.counterIntel.active = false;
      defenses.counterIntel.revealedType = revealed.id;
      this.eventBus.emit('ui:message', {
        text: `Counter-intel report: Victor is planning "${revealed.name}"${targetLabel}. Sabotage blocked!`,
        type: 'success',
      });
      this.eventBus.emit('rival:sabotageRevealed', {
        type: revealed.id,
        name: revealed.name,
        domain: adaptiveDomain,
      });
      return;
    }

    // victorTips: Priya warns about sabotage, delaying it by 1 day
    if (this.state.storyFlags?.victorTips && Math.random() < 0.4) {
      const tipped = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      this.eventBus.emit('ui:message', {
        text: `Priya tips: "My sources say Victor is planning something. Watch for ${tipped.name}."`,
        type: 'info',
      });
      this._sabotageDelayed = tipped;
      this._sabotageDelayedDomain = adaptiveDomain;
      return;
    }

    // Execute first sabotage (pass adaptive domain for infrastructure stress)
    const firstType = this._executeSabotage(availableTypes, defenses, adaptiveDomain);

    // Double sabotage chance at rep 80+: pick a different type to avoid stacking
    if (tier.doubleChance > 0 && Math.random() < tier.doubleChance) {
      const secondTypes = firstType
        ? availableTypes.filter(s => s.id !== firstType)
        : availableTypes;
      if (secondTypes.length > 0) {
        this._executeSabotage(secondTypes, defenses, adaptiveDomain);
      }
    }
  }

  /**
   * Execute a single sabotage event, checking defenses first.
   * @returns {string|null} The picked sabotage type ID, or null if blocked.
   */
  _executeSabotage(availableTypes, defenses, targetDomain) {
    const picked = availableTypes[Math.floor(Math.random() * availableTypes.length)];

    // Scheme: defenses disabled — skip all defense checks
    const ss = this.state.schemeState;
    const defensesDisabled = ss?.defensesDisabledUntil > (this.state.gameDay ?? 1);

    // Security upgrade blocks sabotage
    if (!defensesDisabled && defenses?.securityUpgrade?.active) {
      defenses.securityUpgrade.active = false;
      defenses.securityUpgrade.daysLeft = 0;
      this.eventBus.emit('ui:message', {
        text: `Security blocked Victor's "${picked.name}" attempt! Your defenses held.`,
        type: 'success',
      });
      this.eventBus.emit('rival:sabotageBlocked', { type: picked.id, name: picked.name });
      return null;
    }

    // Media response nullifies smear campaigns specifically
    if (picked.id === 'smearCampaign' && defenses?.mediaResponse?.active) {
      this.eventBus.emit('ui:message', {
        text: 'Victor tried a smear campaign, but your media response team shut it down!',
        type: 'success',
      });
      this.eventBus.emit('rival:sabotageBlocked', { type: picked.id, name: picked.name });
      return null;
    }

    // Apply the sabotage effect (pass targetDomain for infrastructureStress)
    if (picked.id === 'infrastructureStress') {
      picked.effect(this.state, targetDomain);
    } else {
      picked.effect(this.state);
    }

    // Successful sabotage: momentum +1
    const momentum = this.state.rivalMomentum ?? 0;
    this.state.rivalMomentum = Math.min(3, momentum + 1);

    // Pick absurd flavor text
    const flavorPool = SABOTAGE_FLAVOR[picked.id] ?? [];
    let flavor = flavorPool[Math.floor(Math.random() * flavorPool.length)] ?? picked.description;
    if (picked.id === 'infrastructureStress' && targetDomain) {
      flavor = flavor.replace(/\{domain\}/g, targetDomain);
    }

    // Build impact description
    let impact = SABOTAGE_IMPACT[picked.id] ?? '';
    if (picked.id === 'poachStaff') {
      impact = this.state._lastPoachedStaff
        ? `${this.state._lastPoachedStaff} defected to Glendale!`
        : 'Your staff held firm — nobody took the bait. This time.';
      this.state._lastPoachedStaff = null;
    } else if (picked.id === 'infrastructureStress' && targetDomain) {
      impact = `${targetDomain.toUpperCase()} system: filters degrading for 3 days`;
    } else if (picked.id === 'baseballGremlins') {
      const domain = this.state._gremlinVictimDomain ?? 'unknown';
      impact = this.state._gremlinVictimId
        ? `Gremlins savaged a ${domain} filter (-40% condition) + minor havoc for 2 days`
        : 'Gremlins loose in the stadium — minor havoc for 2 days';
      this.state._gremlinVictimId = null;
      this.state._gremlinVictimDomain = null;
    }

    // Show sabotage notification toast
    this.eventBus.emit('rival:sabotageAlert', {
      title: picked.name,
      flavor,
      impact,
    });

    this.eventBus.emit('rival:sabotage', {
      type: picked.id,
      name: picked.name,
      description: picked.description,
    });

    return picked.id;
  }

  /**
   * Force an immediate sabotage (triggered by failed scheme).
   * Bypasses probability checks but still respects immunity.
   */
  _forceImmediateSabotage() {
    const ss = this.state.schemeState;
    const day = this.state.gameDay ?? 1;
    if (ss?.sabotageImmunityUntil > day) return;

    const playerRep = this.state.reputation;
    const tier = ESCALATION_TIERS.find(t => playerRep >= t.minRep && playerRep <= t.maxRep);
    if (!tier) return;

    const availableTypes = SABOTAGE_TYPES.filter(s => tier.types.includes(s.id));
    if (availableTypes.length === 0) return;

    const defenses = this.state._rivalDefenses;
    this._executeSabotage(availableTypes, defenses, null);
  }

  /**
   * Tick down active defense durations each day.
   */
  _tickDefenses() {
    const defenses = this.state._rivalDefenses;
    if (!defenses) return;

    if (defenses.securityUpgrade.active && defenses.securityUpgrade.daysLeft > 0) {
      defenses.securityUpgrade.daysLeft--;
      if (defenses.securityUpgrade.daysLeft <= 0) {
        defenses.securityUpgrade.active = false;
        this.eventBus.emit('ui:message', {
          text: 'Your security upgrade has expired.',
          type: 'info',
        });
      }
    }

    if (defenses.mediaResponse.active && defenses.mediaResponse.daysLeft > 0) {
      defenses.mediaResponse.daysLeft--;
      if (defenses.mediaResponse.daysLeft <= 0) {
        defenses.mediaResponse.active = false;
        this.eventBus.emit('ui:message', {
          text: 'Your media response team contract has ended.',
          type: 'info',
        });
      }
    }
  }

  /**
   * Tick smear campaign: apply -1 rep per day for duration.
   */
  _tickSmearCampaign() {
    const days = this.state._smearCampaignDays ?? 0;
    if (days <= 0) return;

    this.state.adjustReputation(-1);
    this.state._smearCampaignDays = days - 1;

    if (days - 1 > 0) {
      this.eventBus.emit('ui:message', {
        text: `Smear campaign continues... ${days - 1} day(s) of bad press remaining.`,
        type: 'warning',
      });
    } else {
      this.eventBus.emit('ui:message', {
        text: 'The smear campaign has run its course. Press coverage returning to normal.',
        type: 'info',
      });
    }
  }

  /**
   * Tick supply cost disruption: decrement days remaining.
   */
  _tickSupplyCost() {
    const days = this.state._supplyCostDays ?? 0;
    if (days <= 0) return;

    this.state._supplyCostDays = days - 1;

    if (days - 1 <= 0) {
      this.state._supplyCostMultiplier = 1.0;
      this.eventBus.emit('ui:message', {
        text: 'Supply chain restored. Filter costs back to normal.',
        type: 'info',
      });
    }
  }

  /**
   * Tick infrastructure stress: degrade filters in targeted domain per day for duration.
   * Degrades filter conditions (source of truth) rather than domainHealth (computed by ConsequenceSystem).
   */
  _tickInfraStress() {
    const days = this.state._infraStressDays ?? 0;
    if (days <= 0) return;

    const domain = this.state._infraStressDomain;
    if (domain) {
      const domainFilters = (this.state.filters ?? []).filter(f => f.domain === domain && f.condition > 0);
      for (const f of domainFilters) {
        f.condition = Math.max(0, f.condition - f.maxCondition * 0.08);
      }
    }

    this.state._infraStressDays = days - 1;

    if (days - 1 > 0) {
      this.eventBus.emit('ui:message', {
        text: `Infrastructure stress on ${domain}: filters degrading. ${days - 1} day(s) remaining.`,
        type: 'warning',
      });
    } else {
      this.eventBus.emit('ui:message', {
        text: `Infrastructure stress on ${domain} has ended. Systems stabilizing.`,
        type: 'info',
      });
      this.state._infraStressDomain = null;
    }
  }

  /**
   * Tick hot dog flood: filters degrade faster for duration.
   */
  _tickHotdogFlood() {
    const days = this.state._hotdogFloodDays ?? 0;
    if (days <= 0) return;

    this.state._hotdogFloodDays = days - 1;

    if (days - 1 > 0) {
      this.eventBus.emit('ui:message', {
        text: `Hot dog situation ongoing... filters degrading faster. ${days - 1} day(s) until plumbers finish.`,
        type: 'warning',
      });
    } else {
      this.state._hotdogDegradeMultiplier = 1.0;
      this.eventBus.emit('ui:message', {
        text: 'The last hot dog has been extracted. Filters returning to normal degradation.',
        type: 'info',
      });
    }
  }

  /**
   * Tick cursed bobblehead: team performance penalty for duration.
   */
  _tickCursedBobblehead() {
    const days = this.state._cursedBobbleDays ?? 0;
    if (days <= 0) return;

    this.state._cursedBobbleDays = days - 1;

    if (days - 1 > 0) {
      this.eventBus.emit('ui:message', {
        text: `The bobblehead continues to nod menacingly. Team performance still rattled. ${days - 1} day(s) remaining.`,
        type: 'warning',
      });
    } else {
      this.state._sabotageTeamPerfMod = 1.0;
      this.eventBus.emit('ui:message', {
        text: 'Someone finally drop-kicked the bobblehead into the parking lot. Team morale recovering.',
        type: 'info',
      });
    }
  }

  /**
   * Tick sprinkler prank: attendance penalty for duration.
   */
  _tickSprinklerPrank() {
    const days = this.state._sprinklerPrankDays ?? 0;
    if (days <= 0) return;

    this.state._sprinklerPrankDays = days - 1;

    if (days - 1 > 0) {
      this.eventBus.emit('ui:message', {
        text: `Fans still talking about the sprinkler incident. Attendance down. ${days - 1} day(s) until they forget.`,
        type: 'warning',
      });
    } else {
      this.state._sabotageAttendanceMod = 1.0;
      this.eventBus.emit('ui:message', {
        text: 'The sprinkler incident has become a "funny story" instead of a "lawsuit." Attendance recovering.',
        type: 'info',
      });
    }
  }

  /**
   * Tick organ ransom: revenue penalty for duration.
   */
  _tickOrganSwap() {
    const days = this.state._organSwapDays ?? 0;
    if (days <= 0) return;

    this.state._organSwapDays = days - 1;

    if (days - 1 > 0) {
      this.eventBus.emit('ui:message', {
        text: `Kazoo vibes not cutting it. Concession revenue still down. ${days - 1} day(s) until new organ arrives.`,
        type: 'warning',
      });
    } else {
      this.state._sabotageRevenueMod = 1.0;
      this.eventBus.emit('ui:message', {
        text: 'The replacement organ arrived! Fans can rally again. Revenue normalizing.',
        type: 'info',
      });
    }
  }

  /**
   * Tick gremlin infestation: minor all-domain health hit for duration.
   */
  _tickGremlins() {
    const days = this.state._gremlinDays ?? 0;
    if (days <= 0) return;

    // Gremlins nibble random filters — degrade condition (the source of truth for domain health)
    const filters = (this.state.filters ?? []).filter(f => f.condition > 0);
    for (let i = 0; i < 2 && filters.length > 0; i++) {
      const idx = Math.floor(Math.random() * filters.length);
      const f = filters.splice(idx, 1)[0];
      f.condition = Math.max(0, f.condition - f.maxCondition * 0.05);
    }

    this.state._gremlinDays = days - 1;

    if (days - 1 > 0) {
      this.eventBus.emit('ui:message', {
        text: `Gremlins still at large. Minor damage across systems. ${days - 1} day(s) of chaos remaining.`,
        type: 'warning',
      });
    } else {
      this.eventBus.emit('ui:message', {
        text: 'The last gremlin was lured out with a trail of peanuts and a tiny "FREE BOLTS" sign. Infestation over.',
        type: 'info',
      });
    }
  }

  // -- Counter-Strategy Purchases ----------------------------------------

  /**
   * Purchase a defense against rival sabotage.
   * @param {string} type - 'securityUpgrade' | 'counterIntel' | 'mediaResponse'
   * @returns {boolean} true if purchase was successful
   */
  purchaseDefense(type) {
    const def = RIVAL_DEFENSE_DEFS[type];
    if (!def) return false;

    if (this.state.money < def.cost) {
      this.eventBus.emit('ui:message', {
        text: `Not enough money for ${def.name}! Need $${def.cost.toLocaleString()}.`,
        type: 'warning',
      });
      return false;
    }

    this._ensureRivalDefenses();
    const defenses = this.state._rivalDefenses;

    // Check if already active
    if (defenses[type]?.active) {
      this.eventBus.emit('ui:message', {
        text: `${def.name} is already active!`,
        type: 'warning',
      });
      return false;
    }

    // Deduct cost
    this.state.set('money', this.state.money - def.cost);

    // Activate defense
    if (type === 'securityUpgrade') {
      defenses.securityUpgrade = { active: true, daysLeft: def.durationDays };
    } else if (type === 'counterIntel') {
      defenses.counterIntel = { active: true, revealedType: null };
    } else if (type === 'mediaResponse') {
      defenses.mediaResponse = { active: true, daysLeft: def.durationDays };
      // Immediately clear any active smear campaign
      if ((this.state._smearCampaignDays ?? 0) > 0) {
        this.state._smearCampaignDays = 0;
        this.eventBus.emit('ui:message', {
          text: 'Media response team neutralized the active smear campaign!',
          type: 'success',
        });
      }
    }

    this.eventBus.emit('ui:message', {
      text: `${def.name} activated! -$${def.cost.toLocaleString()}`,
      type: 'success',
    });
    this.eventBus.emit('rival:defensePurchased', { type, name: def.name, cost: def.cost });
    return true;
  }

  // -- Public Getters: Threat & Defenses ---------------------------------

  /**
   * Get Victor's current threat level label based on player reputation.
   */
  getThreatLevel() {
    const rep = this.state.reputation;
    if (rep >= 80) return { label: 'Desperate Enemy', color: '#ff004d' };
    if (rep >= 65) return { label: 'Active Rival', color: '#ffa300' };
    if (rep >= 50) return { label: 'Emerging Threat', color: '#ffec27' };
    if (rep >= 30) return { label: 'Minor Nuisance', color: '#888' };
    return { label: 'Disinterested', color: '#555' };
  }

  /**
   * Get current rival defenses state for UI display.
   */
  getDefenses() {
    this._ensureRivalDefenses();
    return this.state._rivalDefenses;
  }

  /**
   * Get defense definitions for UI (costs, names, etc.).
   */
  getDefenseDefs() {
    return RIVAL_DEFENSE_DEFS;
  }

  /**
   * Get the sabotage damage multiplier. Scales with season for escalating
   * difficulty (~15% harder per season). Reduced by 30% when Victor's
   * reducedSabotage flag is active (from Victor relationship tier 2).
   */
  getSabotageDamageMultiplier() {
    const season = this.state.season ?? 1;
    const seasonScale = 1 + (season - 1) * 0.15;
    const reductionFlag = this.state.storyFlags?.reducedSabotage ?? 1.0;
    // Scouting Bureau expansion: 30% reduction to sabotage damage
    const hasScoutingBureau = (this.state.purchasedExpansions ?? []).some(p => p.key === 'scoutingBureau');
    const scoutingMult = hasScoutingBureau ? 0.70 : 1.0;
    return seasonScale * reductionFlag * scoutingMult;
  }

  // -- Public getters ---------------------------------------------------

  /** Get current rival stadium info for display. */
  getRivalInfo() {
    return {
      name: 'Glendale Grizzlies',
      owner: 'Victor',
      rep: this.state.rivalRep ?? 60,
      attendance: this._estimateRivalAttendance(),
    };
  }

  _estimateRivalAttendance() {
    const rivalRep = this.state.rivalRep ?? 60;
    const base = 18000; // Grizzlies have a slightly larger stadium
    return Math.floor(base * (rivalRep / 100) * (0.85 + Math.random() * 0.15));
  }
}
