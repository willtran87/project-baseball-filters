/**
 * Casual NPC dialogue lines for player-initiated conversations.
 * Organized by NPC ID, filtered by relationship level and game context.
 */

export const NPC_CASUAL_DIALOGUE = {

  // ===========================================================================
  // MAGGIE CHEN — Stadium Owner
  // Portrait moods: neutral, happy, angry, worried
  // ===========================================================================
  maggie: [
    // --- Low tier (0+) ---
    {
      id: 'maggie_intro_checkin',
      minRelationship: 0,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'maggie', portrait: 'neutral', text: "How are things running today?" },
        { speaker: 'maggie', portrait: 'neutral', text: "I've got a board meeting at four." },
        { speaker: 'maggie', portrait: 'neutral', text: "Just need to know nothing's on fire." },
      ],
    },
    {
      id: 'maggie_budget_warning',
      minRelationship: 0,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'maggie', portrait: 'neutral', text: "I'll be honest with you." },
        { speaker: 'maggie', portrait: 'neutral', text: "We're not swimming in cash here." },
        { speaker: 'maggie', portrait: 'neutral', text: "Every dollar on filters is a dollar we justify." },
      ],
      choices: [
        { text: '"I\'ll make every dollar count."', effects: [{ type: 'relationship', npc: 'maggie', delta: 1 }] },
        { text: '"You get what you pay for, Maggie."', effects: [] },
      ],
    },
    {
      id: 'maggie_professional_nod',
      minRelationship: 0,
      context: 'any',
      portrait: 'neutral',
      lines: [
        { speaker: null, text: "(Maggie glances up from her clipboard.)" },
        { speaker: 'maggie', portrait: 'neutral', text: "Keep up the steady work." },
        { speaker: 'maggie', portrait: 'neutral', text: "Steady wins ballgames." },
      ],
    },
    {
      id: 'maggie_gameday_business',
      minRelationship: 0,
      context: 'gameday',
      portrait: 'neutral',
      lines: [
        { speaker: 'maggie', portrait: 'neutral', text: "Full house tonight. Scouts in section 12." },
        { speaker: 'maggie', portrait: 'neutral', text: "Everything needs to be perfect." },
        { speaker: 'maggie', portrait: 'neutral', text: "No pressure." },
        { speaker: null, text: "(She does not look like she means 'no pressure.')" },
      ],
    },

    // --- Mid tier (15+) ---
    {
      id: 'maggie_fathers_stadium',
      minRelationship: 15,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: null, text: "(Maggie runs her hand along the railing.)" },
        { speaker: 'maggie', portrait: 'neutral', text: "My father built this place in '84." },
        { speaker: 'maggie', portrait: 'neutral', text: "Poured the foundation himself, or so he claimed." },
        { speaker: 'maggie', portrait: 'happy', text: "I used to sit right there. Section 3, row F." },
      ],
      choices: [
        { text: '"He must have been something."', effects: [{ type: 'relationship', npc: 'maggie', delta: 1 }] },
        { text: '"That explains the vintage plumbing."', effects: [] },
      ],
    },
    {
      id: 'maggie_shares_challenge',
      minRelationship: 15,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'maggie', portrait: 'neutral', text: "Salazar offered to buy this place. Again." },
        { speaker: 'maggie', portrait: 'neutral', text: "His third offer this year." },
        { speaker: 'maggie', portrait: 'neutral', text: "Ridgemont isn't for sale." },
      ],
    },
    {
      id: 'maggie_winning_proud',
      minRelationship: 15,
      context: 'winning',
      portrait: 'happy',
      lines: [
        { speaker: 'maggie', portrait: 'happy', text: "People are talking about us again." },
        { speaker: 'maggie', portrait: 'happy', text: "The good kind of talking, for once." },
        { speaker: 'maggie', portrait: 'neutral', text: "Don't let it go to your head." },
        { speaker: null, text: "(She's smiling, though.)" },
      ],
    },
    {
      id: 'maggie_crisis_pressure',
      minRelationship: 15,
      context: 'crisis',
      portrait: 'neutral',
      lines: [
        { speaker: 'maggie', portrait: 'neutral', text: "I just got off the phone with the league." },
        { speaker: 'maggie', portrait: 'neutral', text: "They're asking questions I don't have answers to." },
        { speaker: 'maggie', portrait: 'neutral', text: "We need to turn this around. Fast." },
      ],
      choices: [
        { text: '"I\'m on it. Give me a day."', effects: [{ type: 'relationship', npc: 'maggie', delta: 1 }] },
        { text: '"What exactly did they say?"', effects: [] },
      ],
    },
    {
      id: 'maggie_raptors_history',
      minRelationship: 15,
      context: 'any',
      portrait: 'happy',
      lines: [
        { speaker: 'maggie', portrait: 'happy', text: "You know the Raptors won the pennant in '97?" },
        { speaker: 'maggie', portrait: 'happy', text: "I was fourteen. Caught a foul ball." },
        { speaker: 'maggie', portrait: 'neutral', text: "Still have it on my desk." },
      ],
    },

    // --- High tier (35+) ---
    {
      id: 'maggie_confides_finances',
      minRelationship: 35,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: null, text: "(Maggie closes her office door.)" },
        { speaker: 'maggie', portrait: 'neutral', text: "Between us? We're two bad months from red." },
        { speaker: 'maggie', portrait: 'neutral', text: "If attendance drops any more..." },
        { speaker: 'maggie', portrait: 'neutral', text: "I need someone I trust running things down there." },
      ],
      choices: [
        { text: '"You can count on me, Maggie."', effects: [{ type: 'relationship', npc: 'maggie', delta: 2 }] },
        { text: '"That\'s a lot of pressure."', effects: [{ type: 'relationship', npc: 'maggie', delta: 1 }] },
      ],
    },
    {
      id: 'maggie_asks_opinion',
      minRelationship: 35,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'maggie', portrait: 'neutral', text: "Can I ask you something honestly?" },
        { speaker: 'maggie', portrait: 'neutral', text: "Do you think this place can make it?" },
        { speaker: 'maggie', portrait: 'neutral', text: "Not the polite answer. The real one." },
      ],
      choices: [
        { text: '"Ridgemont has something special. We\'ll make it."', effects: [{ type: 'relationship', npc: 'maggie', delta: 2 }] },
        { text: '"It\'ll be tight, but I believe in what we\'re doing."', effects: [{ type: 'relationship', npc: 'maggie', delta: 1 }] },
      ],
    },
    {
      id: 'maggie_family_compliment',
      minRelationship: 35,
      context: 'any',
      portrait: 'happy',
      lines: [
        { speaker: 'maggie', portrait: 'happy', text: "You know, Dad would've liked you." },
        { speaker: 'maggie', portrait: 'happy', text: "He always said the stadium runs on its people." },
        { speaker: 'maggie', portrait: 'happy', text: "I'm starting to understand what he meant." },
      ],
    },
    {
      id: 'maggie_losing_desperate',
      minRelationship: 35,
      context: 'losing',
      portrait: 'worried',
      lines: [
        { speaker: null, text: "(Maggie stares out the office window at the empty seats.)" },
        { speaker: 'maggie', portrait: 'worried', text: "Salazar's people called again." },
        { speaker: 'maggie', portrait: 'worried', text: "Some days I wonder if they're right." },
        { speaker: 'maggie', portrait: 'neutral', text: "...No. Forget I said that." },
      ],
      choices: [
        { text: '"We\'re not done yet. Not even close."', effects: [{ type: 'relationship', npc: 'maggie', delta: 2 }] },
        { text: '"Take a breath. We\'ll figure it out."', effects: [{ type: 'relationship', npc: 'maggie', delta: 1 }] },
      ],
    },
    {
      id: 'maggie_gameday_high',
      minRelationship: 35,
      context: 'gameday',
      portrait: 'happy',
      lines: [
        { speaker: 'maggie', portrait: 'happy', text: "Listen to that crowd." },
        { speaker: 'maggie', portrait: 'happy', text: "This is why we do it." },
        { speaker: 'maggie', portrait: 'happy', text: "Go make sure everything stays perfect, okay?" },
        { speaker: null, text: "(She squeezes your shoulder as she heads to her box.)" },
      ],
    },

    // --- Season progress & variety (added) ---
    {
      id: 'maggie_early_season_goals',
      minRelationship: 0,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'maggie', portrait: 'neutral', text: "New season, clean slate." },
        { speaker: 'maggie', portrait: 'neutral', text: "I've set the budget projections. Tight, but workable." },
        { speaker: 'maggie', portrait: 'neutral', text: "Let's make sure this year's numbers tell a better story." },
      ],
    },
    {
      id: 'maggie_late_season_pressure',
      minRelationship: 15,
      context: 'normal',
      portrait: 'worried',
      lines: [
        { speaker: 'maggie', portrait: 'worried', text: "We're in the home stretch and the board wants results." },
        { speaker: 'maggie', portrait: 'worried', text: "Every game from here on out is a financial audit in disguise." },
        { speaker: 'maggie', portrait: 'neutral', text: "Stay sharp. We can't afford a slip now." },
      ],
      choices: [
        { text: '"We\'ll finish strong. Count on it."', effects: [{ type: 'relationship', npc: 'maggie', delta: 1 }] },
        { text: '"What specifically worries you?"', effects: [] },
      ],
    },
    {
      id: 'maggie_after_storm',
      minRelationship: 0,
      context: 'normal',
      portrait: 'worried',
      lines: [
        { speaker: 'maggie', portrait: 'worried', text: "That storm rattled the investors." },
        { speaker: 'maggie', portrait: 'worried', text: "Three phone calls before breakfast about damage costs." },
        { speaker: 'maggie', portrait: 'neutral', text: "Tell me we're back on track." },
      ],
    },
    {
      id: 'maggie_streak_notice',
      minRelationship: 35,
      context: 'winning',
      portrait: 'happy',
      lines: [
        { speaker: null, text: "(Maggie is reviewing a spreadsheet, but she's smiling.)" },
        { speaker: 'maggie', portrait: 'happy', text: "Revenue is up 14% this month." },
        { speaker: 'maggie', portrait: 'happy', text: "Concessions, merchandise, ticket upgrades -- all of it." },
        { speaker: 'maggie', portrait: 'happy', text: "You're making this old stadium profitable again." },
      ],
    },
    {
      id: 'maggie_money_domain',
      minRelationship: 15,
      context: 'any',
      portrait: 'neutral',
      lines: [
        { speaker: 'maggie', portrait: 'neutral', text: "I've been looking at our repair costs versus replacement." },
        { speaker: 'maggie', portrait: 'neutral', text: "Sometimes patching a filter three times costs more than buying new." },
        { speaker: 'maggie', portrait: 'neutral', text: "Think like an investor. ROI on every dollar." },
      ],
      choices: [
        { text: '"I\'ll run the numbers before my next purchase."', effects: [{ type: 'relationship', npc: 'maggie', delta: 1 }] },
        { text: '"Sometimes reliability beats the bottom line."', effects: [] },
      ],
    },

    // --- Cross-reference dialogue ---
    {
      id: 'maggie_about_rusty',
      minRelationship: 15,
      context: 'any',
      portrait: 'neutral',
      lines: [
        { speaker: 'maggie', portrait: 'neutral', text: "Rusty's been here longer than the scoreboard." },
        { speaker: 'maggie', portrait: 'neutral', text: "He and my father used to argue about pipe gauges over coffee." },
        { speaker: 'maggie', portrait: 'happy', text: "I wouldn't trust anyone else with this building's guts." },
      ],
    },
    {
      id: 'maggie_about_fiona',
      minRelationship: 20,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'maggie', portrait: 'neutral', text: "Fiona says the sponsors want a tour of the facility." },
        { speaker: 'maggie', portrait: 'neutral', text: "Make sure nothing's dripping when they walk through." },
        { speaker: 'maggie', portrait: 'neutral', text: "First impressions aren't Fiona's department. They're yours." },
      ],
      choices: [
        { text: '"I\'ll have everything spotless."', effects: [{ type: 'relationship', npc: 'maggie', delta: 1 }] },
        { text: '"Define \'dripping.\'"', effects: [] },
      ],
    },
    {
      id: 'maggie_about_priya',
      minRelationship: 15,
      context: 'normal',
      portrait: 'worried',
      lines: [
        { speaker: 'maggie', portrait: 'worried', text: "Priya called my office again." },
        { speaker: 'maggie', portrait: 'neutral', text: "She's fair, I'll give her that. But fair doesn't mean friendly." },
        { speaker: 'maggie', portrait: 'neutral', text: "Just... don't give her any ammunition, okay?" },
      ],
    },
  ],

  // ===========================================================================
  // RUSTY KOWALSKI — Head Maintenance
  // Portrait moods: skeptical, neutral, happy, sad
  // ===========================================================================
  rusty: [
    // --- Low tier (0+) ---
    {
      id: 'rusty_intro_gruff',
      minRelationship: 0,
      context: 'normal',
      portrait: 'skeptical',
      lines: [
        { speaker: null, text: "(Rusty doesn't look up from the pipe he's wrenching.)" },
        { speaker: 'rusty', portrait: 'skeptical', text: "You need something?" },
        { speaker: 'rusty', portrait: 'skeptical', text: "I got three valves to replace before noon." },
      ],
    },
    {
      id: 'rusty_testing_you',
      minRelationship: 0,
      context: 'normal',
      portrait: 'skeptical',
      lines: [
        { speaker: 'rusty', portrait: 'skeptical', text: "Pop quiz." },
        { speaker: 'rusty', portrait: 'skeptical', text: "Sediment filter or carbon filter for the mains?" },
      ],
      choices: [
        { text: '"Sediment first, then carbon."', effects: [{ type: 'relationship', npc: 'rusty', delta: 1 }] },
        { text: '"Whichever\'s cheaper?"', effects: [] },
      ],
    },
    {
      id: 'rusty_back_in_my_day',
      minRelationship: 0,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'rusty', portrait: 'neutral', text: "Back in my day we had ONE filter for the whole park." },
        { speaker: 'rusty', portrait: 'neutral', text: "And we changed it by hand. Uphill. Both ways." },
        { speaker: null, text: "(He might be joking. It's hard to tell with Rusty.)" },
      ],
    },
    {
      id: 'rusty_crisis_blame',
      minRelationship: 0,
      context: 'crisis',
      portrait: 'skeptical',
      lines: [
        { speaker: 'rusty', portrait: 'skeptical', text: "See? This is what happens." },
        { speaker: 'rusty', portrait: 'skeptical', text: "Skip maintenance once and the whole system cries." },
        { speaker: 'rusty', portrait: 'neutral', text: "Well? Don't just stand there." },
      ],
    },

    // --- Mid tier (10+) ---
    {
      id: 'rusty_filter_tip',
      minRelationship: 10,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: null, text: "(Rusty wipes grease off his hands.)" },
        { speaker: 'rusty', portrait: 'neutral', text: "Here's a trick, kid." },
        { speaker: 'rusty', portrait: 'neutral', text: "Check your pressure gauges BEFORE they go red." },
        { speaker: 'rusty', portrait: 'neutral', text: "Yellow means you got maybe a day. Plan ahead." },
      ],
    },
    {
      id: 'rusty_war_story_flood',
      minRelationship: 10,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'rusty', portrait: 'neutral', text: "You ever hear about the Great Flood of '09?" },
        { speaker: 'rusty', portrait: 'neutral', text: "Main line burst during the seventh inning stretch." },
        { speaker: 'rusty', portrait: 'neutral', text: "Third base was a swimming pool for an hour." },
        { speaker: null, text: "(Rusty almost smiles at the memory.)" },
      ],
      choices: [
        { text: '"How did you fix it?"', effects: [{ type: 'relationship', npc: 'rusty', delta: 1 }] },
        { text: '"Please tell me that can\'t happen again."', effects: [] },
      ],
    },
    {
      id: 'rusty_nickname_moment',
      minRelationship: 10,
      context: 'any',
      portrait: 'neutral',
      lines: [
        { speaker: 'rusty', portrait: 'neutral', text: "Hey, kid. Grab me that wrench." },
        { speaker: null, text: "(You hand it over. He grunts approval.)" },
        { speaker: 'rusty', portrait: 'neutral', text: "You're alright. For a rookie." },
      ],
    },
    {
      id: 'rusty_hank_mention',
      minRelationship: 10,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'rusty', portrait: 'neutral', text: "You find any weird notes in the maintenance tunnels?" },
        { speaker: 'rusty', portrait: 'neutral', text: "That's Hank's handiwork. Old maintenance chief." },
        { speaker: 'rusty', portrait: 'neutral', text: "Weird guy. But he knew every pipe in this place." },
      ],
      choices: [
        { text: '"What happened to him?"', effects: [{ type: 'relationship', npc: 'rusty', delta: 1 }] },
        { text: '"His notes have been pretty useful."', effects: [] },
      ],
    },

    // --- High tier (30+) ---
    {
      id: 'rusty_proud_mentor',
      minRelationship: 30,
      context: 'normal',
      portrait: 'happy',
      lines: [
        { speaker: null, text: "(Rusty leans against the boiler, arms crossed.)" },
        { speaker: 'rusty', portrait: 'happy', text: "You know what, kid? You're good at this." },
        { speaker: 'rusty', portrait: 'happy', text: "Better than most I've trained over the years." },
        { speaker: 'rusty', portrait: 'neutral', text: "Don't let it go to your head." },
      ],
    },
    {
      id: 'rusty_emotional_old_days',
      minRelationship: 30,
      context: 'normal',
      portrait: 'sad',
      lines: [
        { speaker: null, text: "(Rusty stares at a faded photo taped inside the utility closet.)" },
        { speaker: 'rusty', portrait: 'sad', text: "Twenty-two years in this building." },
        { speaker: 'rusty', portrait: 'sad', text: "Some days I think the pipes know me better than my ex-wife." },
        { speaker: 'rusty', portrait: 'neutral', text: "...That's not as funny as I meant it to be." },
      ],
      choices: [
        { text: '"This place is lucky to have you, Rusty."', effects: [{ type: 'relationship', npc: 'rusty', delta: 2 }] },
        { text: '"You ever think about retiring?"', effects: [{ type: 'relationship', npc: 'rusty', delta: 1 }] },
      ],
    },
    {
      id: 'rusty_calls_you_family',
      minRelationship: 30,
      context: 'any',
      portrait: 'happy',
      lines: [
        { speaker: 'rusty', portrait: 'happy', text: "You're part of the Ridgemont family now, kid." },
        { speaker: 'rusty', portrait: 'neutral', text: "That means you fix things when they break." },
        { speaker: 'rusty', portrait: 'happy', text: "And you show up. Every day. No excuses." },
        { speaker: 'rusty', portrait: 'happy', text: "I know you will." },
      ],
    },
    {
      id: 'rusty_winning_relief',
      minRelationship: 30,
      context: 'winning',
      portrait: 'happy',
      lines: [
        { speaker: 'rusty', portrait: 'happy', text: "Hey. Things are running smooth, huh?" },
        { speaker: 'rusty', portrait: 'happy', text: "Clean water, happy fans, winning team." },
        { speaker: 'rusty', portrait: 'happy', text: "Almost makes me nervous. Ha." },
        { speaker: null, text: "(He actually laughs. A first.)" },
      ],
    },
    {
      id: 'rusty_losing_fight',
      minRelationship: 30,
      context: 'losing',
      portrait: 'sad',
      lines: [
        { speaker: 'rusty', portrait: 'sad', text: "I've seen Ridgemont in rough shape before." },
        { speaker: 'rusty', portrait: 'neutral', text: "But we always pulled through." },
        { speaker: 'rusty', portrait: 'neutral', text: "The pipes don't give up. Neither do we." },
      ],
      choices: [
        { text: '"Together, right?"', effects: [{ type: 'relationship', npc: 'rusty', delta: 2 }] },
        { text: '"Let\'s get to work."', effects: [{ type: 'relationship', npc: 'rusty', delta: 1 }] },
      ],
    },
    {
      id: 'rusty_secret_tip',
      minRelationship: 30,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'rusty', portrait: 'neutral', text: "Between you and me?" },
        { speaker: 'rusty', portrait: 'neutral', text: "There's a service tunnel under section 7." },
        { speaker: 'rusty', portrait: 'neutral', text: "Hank rigged a bypass valve down there. Still works." },
        { speaker: 'rusty', portrait: 'neutral', text: "Might save your hide in an emergency." },
      ],
    },

    // --- Season progress & variety (added) ---
    {
      id: 'rusty_early_season_ritual',
      minRelationship: 0,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: null, text: "(Rusty is oiling a valve handle.)" },
        { speaker: 'rusty', portrait: 'neutral', text: "Start of the season. Same routine every year." },
        { speaker: 'rusty', portrait: 'neutral', text: "Flush the lines, check the seals, pray nothing leaks." },
        { speaker: 'rusty', portrait: 'neutral', text: "The pipes remember winter. Trust me on that." },
      ],
    },
    {
      id: 'rusty_late_season_wear',
      minRelationship: 10,
      context: 'normal',
      portrait: 'skeptical',
      lines: [
        { speaker: 'rusty', portrait: 'skeptical', text: "Eighty games takes a toll, kid." },
        { speaker: 'rusty', portrait: 'skeptical', text: "Not just on the players. On every gasket and seal in this place." },
        { speaker: 'rusty', portrait: 'neutral', text: "End of season is when the real breakdowns happen." },
        { speaker: 'rusty', portrait: 'neutral', text: "Stay on top of it or the pipes will remind you." },
      ],
    },
    {
      id: 'rusty_storm_damage',
      minRelationship: 10,
      context: 'normal',
      portrait: 'skeptical',
      lines: [
        { speaker: 'rusty', portrait: 'skeptical', text: "That storm knocked out the pressure regulator in section 4." },
        { speaker: 'rusty', portrait: 'neutral', text: "I patched it, but it ain't pretty." },
        { speaker: 'rusty', portrait: 'neutral', text: "Weather like that is harder on old buildings. Everything swells and shifts." },
      ],
      choices: [
        { text: '"Thanks for the patch, Rusty."', effects: [{ type: 'relationship', npc: 'rusty', delta: 1 }] },
        { text: '"Should I order replacement parts?"', effects: [] },
      ],
    },
    {
      id: 'rusty_systems_humming',
      minRelationship: 30,
      context: 'winning',
      portrait: 'happy',
      lines: [
        { speaker: null, text: "(Rusty is leaning against a wall, arms crossed, looking relaxed for once.)" },
        { speaker: 'rusty', portrait: 'happy', text: "Know what I like about a good streak?" },
        { speaker: 'rusty', portrait: 'happy', text: "Nobody calls me at 2 AM." },
        { speaker: 'rusty', portrait: 'happy', text: "When everything works, old Rusty gets to sleep. Imagine that." },
      ],
    },
    {
      id: 'rusty_drainage_commentary',
      minRelationship: 0,
      context: 'any',
      portrait: 'neutral',
      lines: [
        { speaker: 'rusty', portrait: 'neutral', text: "People never think about drainage until it's too late." },
        { speaker: 'rusty', portrait: 'neutral', text: "One clogged drain under the concourse and you've got a swamp." },
        { speaker: 'rusty', portrait: 'skeptical', text: "I've seen it happen. Twice. Both times during playoffs." },
        { speaker: 'rusty', portrait: 'neutral', text: "Keep those drain filters clean, kid. It matters." },
      ],
    },

    // --- Cross-reference dialogue ---
    {
      id: 'rusty_about_diego',
      minRelationship: 15,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'rusty', portrait: 'neutral', text: "That Ramirez kid asked me to explain the drainage system." },
        { speaker: 'rusty', portrait: 'neutral', text: "Spent an hour with me in the tunnels, taking notes on his phone." },
        { speaker: 'rusty', portrait: 'happy', text: "Most players don't care how the water gets to the fountain. He does." },
      ],
    },
    {
      id: 'rusty_about_bea',
      minRelationship: 20,
      context: 'normal',
      portrait: 'skeptical',
      lines: [
        { speaker: 'rusty', portrait: 'skeptical', text: "Thornton was down here last week with her clipboard." },
        { speaker: 'rusty', portrait: 'neutral', text: "Walked every inch of the mechanical room." },
        { speaker: 'rusty', portrait: 'neutral', text: "Didn't say a word. Just wrote things down and left." },
        { speaker: 'rusty', portrait: 'skeptical', text: "That woman terrifies me. And I respect that." },
      ],
    },
    {
      id: 'rusty_about_maggie',
      minRelationship: 15,
      context: 'any',
      portrait: 'neutral',
      lines: [
        { speaker: 'rusty', portrait: 'neutral', text: "Maggie's got her father's stubbornness." },
        { speaker: 'rusty', portrait: 'neutral', text: "Old Chen would've rather patched a pipe with his bare hands than call a contractor." },
        { speaker: 'rusty', portrait: 'happy', text: "Apple didn't fall far from the tree." },
      ],
    },
  ],

  // ===========================================================================
  // PRIYA OKAFOR — Sports Reporter
  // Portrait moods: neutral, excited, skeptical, sympathetic
  // ===========================================================================
  priya: [
    // --- Low tier (0+) ---
    {
      id: 'priya_intro_question',
      minRelationship: 0,
      context: 'normal',
      portrait: 'curious',
      lines: [
        { speaker: 'priya', portrait: 'curious', text: "Got a minute for the Ridgemont Herald?" },
        { speaker: 'priya', portrait: 'curious', text: "I'm working on a piece about stadium ops." },
        { speaker: 'priya', portrait: 'curious', text: "Any comment on the filtration situation here?" },
      ],
      choices: [
        { text: '"Everything\'s running great."', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
        { text: '"No comment."', effects: [] },
      ],
    },
    {
      id: 'priya_looking_for_story',
      minRelationship: 0,
      context: 'any',
      portrait: 'curious',
      lines: [
        { speaker: null, text: "(Priya is scribbling in her notebook.)" },
        { speaker: 'priya', portrait: 'curious', text: "Don't mind me. Just observing." },
        { speaker: 'priya', portrait: 'curious', text: "The best stories come from watching, not asking." },
      ],
    },
    {
      id: 'priya_gameday_press',
      minRelationship: 0,
      context: 'gameday',
      portrait: 'excited',
      lines: [
        { speaker: 'priya', portrait: 'excited', text: "Press box is buzzing tonight!" },
        { speaker: 'priya', portrait: 'curious', text: "Any inside scoop on the stadium prep?" },
        { speaker: 'priya', portrait: 'curious', text: "My readers love behind-the-scenes stuff." },
      ],
      choices: [
        { text: '"We run a tight ship. Quote me on that."', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
        { text: '"A reporter never rests, huh?"', effects: [] },
      ],
    },
    {
      id: 'priya_professional_distance',
      minRelationship: 0,
      context: 'crisis',
      portrait: 'sympathetic',
      lines: [
        { speaker: 'priya', portrait: 'sympathetic', text: "I'm hearing reports of issues at the stadium." },
        { speaker: 'priya', portrait: 'sympathetic', text: "I have to write about this. It's my job." },
        { speaker: 'priya', portrait: 'curious', text: "Want to give your side of the story?" },
      ],
      choices: [
        { text: '"We\'re handling it. I\'ll keep you posted."', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
        { text: '"Write what you want."', effects: [] },
      ],
    },

    // --- Mid tier (12+) ---
    {
      id: 'priya_gossip_rival',
      minRelationship: 12,
      context: 'normal',
      portrait: 'excited',
      lines: [
        { speaker: 'priya', portrait: 'excited', text: "Okay, off the record?" },
        { speaker: 'priya', portrait: 'excited', text: "Salazar's new stadium failed a health inspection." },
        { speaker: 'priya', portrait: 'excited', text: "My source says they bribed their way past it." },
        { speaker: 'priya', portrait: 'curious', text: "Interesting, right?" },
      ],
    },
    {
      id: 'priya_headsup_article',
      minRelationship: 12,
      context: 'normal',
      portrait: 'curious',
      lines: [
        { speaker: 'priya', portrait: 'curious', text: "Heads up." },
        { speaker: 'priya', portrait: 'curious', text: "I'm running a piece on minor league water quality." },
        { speaker: 'priya', portrait: 'curious', text: "Ridgemont is featured. Thought you should know." },
      ],
      choices: [
        { text: '"Thanks for the heads up. Need any quotes?"', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
        { text: '"Should I be worried?"', effects: [] },
      ],
    },
    {
      id: 'priya_league_intel',
      minRelationship: 12,
      context: 'any',
      portrait: 'curious',
      lines: [
        { speaker: 'priya', portrait: 'curious', text: "Word around the league press box?" },
        { speaker: 'priya', portrait: 'curious', text: "The commissioner is pushing for stricter standards." },
        { speaker: 'priya', portrait: 'curious', text: "Might want to stay ahead of that curve." },
      ],
    },
    {
      id: 'priya_winning_coverage',
      minRelationship: 12,
      context: 'winning',
      portrait: 'excited',
      lines: [
        { speaker: 'priya', portrait: 'excited', text: "People are reading my Ridgemont articles again!" },
        { speaker: 'priya', portrait: 'excited', text: "Positive press for once. Feels good, right?" },
        { speaker: 'priya', portrait: 'curious', text: "What's your secret?" },
      ],
      choices: [
        { text: '"Hard work and clean water."', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
        { text: '"Good filtration makes good baseball."', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
      ],
    },

    // --- High tier (30+) ---
    {
      id: 'priya_tip_off_event',
      minRelationship: 30,
      context: 'normal',
      portrait: 'sympathetic',
      lines: [
        { speaker: null, text: "(Priya pulls you aside, voice low.)" },
        { speaker: 'priya', portrait: 'sympathetic', text: "This stays between us." },
        { speaker: 'priya', portrait: 'sympathetic', text: "I hear there's a surprise inspection next week." },
        { speaker: 'priya', portrait: 'sympathetic', text: "Don't ask how I know. Just be ready." },
      ],
    },
    {
      id: 'priya_genuine_friend',
      minRelationship: 30,
      context: 'normal',
      portrait: 'excited',
      lines: [
        { speaker: 'priya', portrait: 'excited', text: "Can I tell you something?" },
        { speaker: 'priya', portrait: 'excited', text: "I usually don't get attached to my stories." },
        { speaker: 'priya', portrait: 'excited', text: "But I'm actually rooting for this place now." },
        { speaker: 'priya', portrait: 'curious', text: "Don't print that." },
      ],
      choices: [
        { text: '"Your secret\'s safe with me."', effects: [{ type: 'relationship', npc: 'priya', delta: 2 }] },
        { text: '"Ridgemont grows on people."', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
      ],
    },
    {
      id: 'priya_losing_sympathy',
      minRelationship: 30,
      context: 'losing',
      portrait: 'sympathetic',
      lines: [
        { speaker: 'priya', portrait: 'sympathetic', text: "Look, I have to cover what's happening." },
        { speaker: 'priya', portrait: 'sympathetic', text: "But I'll be fair. I promise you that." },
        { speaker: 'priya', portrait: 'sympathetic', text: "And off the record... I hope you fix this." },
      ],
    },
    {
      id: 'priya_salazar_scoop',
      minRelationship: 30,
      context: 'any',
      portrait: 'excited',
      lines: [
        { speaker: 'priya', portrait: 'excited', text: "I'm sitting on a big story about Victor Salazar." },
        { speaker: 'priya', portrait: 'excited', text: "Shady contractor deals. Kickbacks. The works." },
        { speaker: 'priya', portrait: 'excited', text: "When it drops, it might take heat off Ridgemont." },
        { speaker: 'priya', portrait: 'curious', text: "Stay tuned." },
      ],
    },

    // --- Season progress & variety (added) ---
    {
      id: 'priya_opening_day_buzz',
      minRelationship: 0,
      context: 'normal',
      portrait: 'excited',
      lines: [
        { speaker: 'priya', portrait: 'excited', text: "New season, new storylines." },
        { speaker: 'priya', portrait: 'excited', text: "My editor wants a five-part series on Ridgemont's comeback." },
        { speaker: 'priya', portrait: 'curious', text: "No pressure, but the narrative needs a hero." },
      ],
      choices: [
        { text: '"Happy to be your source."', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
        { text: '"Comeback implies we fell. We\'re just warming up."', effects: [] },
      ],
    },
    {
      id: 'priya_season_finale_piece',
      minRelationship: 12,
      context: 'normal',
      portrait: 'curious',
      lines: [
        { speaker: 'priya', portrait: 'curious', text: "I'm writing my end-of-season wrap-up." },
        { speaker: 'priya', portrait: 'curious', text: "Readership peaks when the stakes are high." },
        { speaker: 'priya', portrait: 'sympathetic', text: "Whatever happens these last few weeks, it'll make a good story." },
        { speaker: 'priya', portrait: 'curious', text: "The question is whether it's a triumph or a tragedy." },
      ],
    },
    {
      id: 'priya_weather_angle',
      minRelationship: 0,
      context: 'crisis',
      portrait: 'curious',
      lines: [
        { speaker: null, text: "(Priya is taking photos of storm damage on her phone.)" },
        { speaker: 'priya', portrait: 'curious', text: "Weather damage makes great visuals. Terrible for you, great for me." },
        { speaker: 'priya', portrait: 'sympathetic', text: "I'll keep the coverage sympathetic if you give me the recovery angle." },
      ],
      choices: [
        { text: '"We\'re already on the repairs. I\'ll keep you updated."', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
        { text: '"Just don\'t make us look incompetent."', effects: [] },
      ],
    },
    {
      id: 'priya_hot_streak_feature',
      minRelationship: 30,
      context: 'winning',
      portrait: 'excited',
      lines: [
        { speaker: 'priya', portrait: 'excited', text: "Okay, I'm doing a feature piece." },
        { speaker: 'priya', portrait: 'excited', text: "Behind the Scenes at Ridgemont: The Streak Nobody Expected." },
        { speaker: 'priya', portrait: 'excited', text: "My editor is thrilled. This is front-page material." },
        { speaker: 'priya', portrait: 'curious', text: "Can I shadow you for a day? Off the record stuff." },
      ],
      choices: [
        { text: '"For you? Anytime."', effects: [{ type: 'relationship', npc: 'priya', delta: 2 }] },
        { text: '"As long as I approve the final draft."', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
      ],
    },
    {
      id: 'priya_media_perception',
      minRelationship: 12,
      context: 'any',
      portrait: 'curious',
      lines: [
        { speaker: 'priya', portrait: 'curious', text: "Interesting stat for you." },
        { speaker: 'priya', portrait: 'curious', text: "Stadiums with good air quality get 20% fewer complaints online." },
        { speaker: 'priya', portrait: 'excited', text: "Fans don't notice clean air, but they definitely notice bad air." },
        { speaker: 'priya', portrait: 'curious', text: "Something to think about for the press coverage." },
      ],
    },

    // --- Cross-reference dialogue ---
    {
      id: 'priya_about_victor',
      minRelationship: 15,
      context: 'normal',
      portrait: 'curious',
      lines: [
        { speaker: 'priya', portrait: 'curious', text: "My sources at Glendale say Victor's been making calls." },
        { speaker: 'priya', portrait: 'curious', text: "City council, league officials, a few real estate lawyers." },
        { speaker: 'priya', portrait: 'excited', text: "Whatever he's planning, it's bigger than a stadium rivalry." },
      ],
      choices: [
        { text: '"Keep me posted?"', effects: [{ type: 'relationship', npc: 'priya', delta: 1 }] },
        { text: '"Victor always has an angle."', effects: [] },
      ],
    },
    {
      id: 'priya_about_bea',
      minRelationship: 15,
      context: 'any',
      portrait: 'curious',
      lines: [
        { speaker: 'priya', portrait: 'curious', text: "I tried to interview Bea for a profile piece." },
        { speaker: 'priya', portrait: 'curious', text: "She gave me a three-word quote: 'Standards were met.'" },
        { speaker: 'priya', portrait: 'excited', text: "Classic Thornton. My editor loved it, actually." },
      ],
    },
  ],

  // ===========================================================================
  // BEA THORNTON — Health Inspector
  // Portrait moods: stern, noting, rare-smile
  // ===========================================================================
  bea: [
    // --- Low tier (0+) ---
    {
      id: 'bea_intro_cold',
      minRelationship: 0,
      context: 'normal',
      portrait: 'stern',
      lines: [
        { speaker: 'bea', portrait: 'stern', text: "I'm not here to make friends." },
        { speaker: 'bea', portrait: 'stern', text: "I'm here to make sure no one gets sick." },
        { speaker: 'bea', portrait: 'noting', text: "Keep that in mind." },
      ],
    },
    {
      id: 'bea_veiled_threat',
      minRelationship: 0,
      context: 'any',
      portrait: 'stern',
      lines: [
        { speaker: null, text: "(Bea inspects the nearest water fountain critically.)" },
        { speaker: 'bea', portrait: 'noting', text: "Hm." },
        { speaker: 'bea', portrait: 'stern', text: "I trust you're maintaining proper records." },
        { speaker: 'bea', portrait: 'stern', text: "I will be checking." },
      ],
    },
    {
      id: 'bea_crisis_warning',
      minRelationship: 0,
      context: 'crisis',
      portrait: 'stern',
      lines: [
        { speaker: 'bea', portrait: 'stern', text: "This is exactly what I was worried about." },
        { speaker: 'bea', portrait: 'stern', text: "I could shut this place down right now." },
        { speaker: 'bea', portrait: 'stern', text: "Fix it. Today. Or I file my report." },
      ],
    },

    // --- Mid tier (15+) ---
    {
      id: 'bea_other_stadiums_horror',
      minRelationship: 15,
      context: 'normal',
      portrait: 'stern',
      lines: [
        { speaker: 'bea', portrait: 'stern', text: "You think you have it bad?" },
        { speaker: 'bea', portrait: 'stern', text: "I inspected a stadium in Fairview last month." },
        { speaker: 'bea', portrait: 'stern', text: "Found a dead raccoon in the filtration tank." },
        { speaker: 'bea', portrait: 'noting', text: "At least Ridgemont doesn't have raccoons." },
        { speaker: null, text: "(That might be the nicest thing she's ever said.)" },
      ],
    },
    {
      id: 'bea_hints_inspection',
      minRelationship: 15,
      context: 'normal',
      portrait: 'noting',
      lines: [
        { speaker: 'bea', portrait: 'noting', text: "Hypothetically speaking..." },
        { speaker: 'bea', portrait: 'noting', text: "If someone were to inspect a stadium..." },
        { speaker: 'bea', portrait: 'noting', text: "They'd check concession water lines first." },
        { speaker: 'bea', portrait: 'stern', text: "Hypothetically." },
      ],
      choices: [
        { text: '"I appreciate the... hypothetical."', effects: [{ type: 'relationship', npc: 'bea', delta: 1 }] },
        { text: '"Noted. Hypothetically."', effects: [{ type: 'relationship', npc: 'bea', delta: 1 }] },
      ],
    },
    {
      id: 'bea_softening_barely',
      minRelationship: 15,
      context: 'any',
      portrait: 'noting',
      lines: [
        { speaker: null, text: "(Bea pauses, then puts her clipboard down.)" },
        { speaker: 'bea', portrait: 'noting', text: "You're... doing better than most new hires I see." },
        { speaker: 'bea', portrait: 'stern', text: "That's not a compliment. It's an observation." },
      ],
    },
    {
      id: 'bea_winning_grudging',
      minRelationship: 15,
      context: 'winning',
      portrait: 'noting',
      lines: [
        { speaker: 'bea', portrait: 'noting', text: "Your numbers have been acceptable lately." },
        { speaker: 'bea', portrait: 'noting', text: "Consistently acceptable." },
        { speaker: null, text: "(From Bea, this is practically a standing ovation.)" },
      ],
    },

    // --- High tier (35+) ---
    {
      id: 'bea_actually_helpful',
      minRelationship: 35,
      context: 'normal',
      portrait: 'noting',
      lines: [
        { speaker: 'bea', portrait: 'noting', text: "Between inspections, check your filter housings." },
        { speaker: 'bea', portrait: 'noting', text: "Cracked housings cause 40% of violations I write." },
        { speaker: 'bea', portrait: 'stern', text: "I didn't tell you that. Officially." },
      ],
    },
    {
      id: 'bea_rooting_for_you',
      minRelationship: 35,
      context: 'normal',
      portrait: 'rare-smile',
      lines: [
        { speaker: null, text: "(Bea glances around to make sure no one is listening.)" },
        { speaker: 'bea', portrait: 'rare-smile', text: "You know... I grew up near here." },
        { speaker: 'bea', portrait: 'rare-smile', text: "My dad used to bring me to Raptors games." },
        { speaker: 'bea', portrait: 'stern', text: "I'd hate to see this place close. That's all." },
      ],
      choices: [
        { text: '"We won\'t let that happen."', effects: [{ type: 'relationship', npc: 'bea', delta: 2 }] },
        { text: '"...Did you just smile?"', effects: [{ type: 'relationship', npc: 'bea', delta: 1 }] },
      ],
    },
    {
      id: 'bea_crisis_private_help',
      minRelationship: 35,
      context: 'crisis',
      portrait: 'noting',
      lines: [
        { speaker: null, text: "(Bea slides a folded paper across the counter.)" },
        { speaker: 'bea', portrait: 'noting', text: "Emergency remediation checklist." },
        { speaker: 'bea', portrait: 'noting', text: "Hit every item and you'll pass re-inspection." },
        { speaker: 'bea', portrait: 'stern', text: "We never had this conversation." },
      ],
    },
    {
      id: 'bea_losing_concern',
      minRelationship: 35,
      context: 'losing',
      portrait: 'stern',
      lines: [
        { speaker: 'bea', portrait: 'stern', text: "I can only delay my report so long." },
        { speaker: 'bea', portrait: 'noting', text: "But I can give you until Friday." },
        { speaker: 'bea', portrait: 'stern', text: "Don't make me regret this." },
      ],
      choices: [
        { text: '"Thank you, Bea. Really."', effects: [{ type: 'relationship', npc: 'bea', delta: 2 }] },
        { text: '"Friday. Got it."', effects: [{ type: 'relationship', npc: 'bea', delta: 1 }] },
      ],
    },
    {
      id: 'bea_salazar_disdain',
      minRelationship: 35,
      context: 'any',
      portrait: 'stern',
      lines: [
        { speaker: 'bea', portrait: 'stern', text: "Salazar thinks he can buy his way past inspections." },
        { speaker: 'bea', portrait: 'stern', text: "Not on my watch." },
        { speaker: 'bea', portrait: 'noting', text: "Ridgemont earns its grades the hard way." },
        { speaker: 'bea', portrait: 'noting', text: "That's worth something." },
      ],
    },

    // --- Season progress & variety (added) ---
    {
      id: 'bea_new_season_standards',
      minRelationship: 0,
      context: 'normal',
      portrait: 'stern',
      lines: [
        { speaker: 'bea', portrait: 'stern', text: "New season, new regulations." },
        { speaker: 'bea', portrait: 'noting', text: "The county updated particulate thresholds this year." },
        { speaker: 'bea', portrait: 'stern', text: "What passed last season might not pass this one." },
        { speaker: 'bea', portrait: 'stern', text: "Consider yourself warned." },
      ],
    },
    {
      id: 'bea_end_of_season_audit',
      minRelationship: 15,
      context: 'normal',
      portrait: 'noting',
      lines: [
        { speaker: 'bea', portrait: 'noting', text: "End-of-season audits are coming up." },
        { speaker: 'bea', portrait: 'noting', text: "I'll be reviewing cumulative compliance records." },
        { speaker: 'bea', portrait: 'stern', text: "One bad month can drag down an entire season's grade." },
        { speaker: 'bea', portrait: 'noting', text: "Keep that in mind for these final weeks." },
      ],
    },
    {
      id: 'bea_storm_contamination',
      minRelationship: 0,
      context: 'crisis',
      portrait: 'stern',
      lines: [
        { speaker: 'bea', portrait: 'stern', text: "Storms introduce contaminants into open water systems." },
        { speaker: 'bea', portrait: 'stern', text: "Runoff, debris, pressure drops. All of it compromises filtration." },
        { speaker: 'bea', portrait: 'noting', text: "I expect post-storm water testing within 24 hours." },
      ],
    },
    {
      id: 'bea_good_run_acknowledgment',
      minRelationship: 35,
      context: 'winning',
      portrait: 'rare-smile',
      lines: [
        { speaker: null, text: "(Bea reviews her clipboard, then sets it down.)" },
        { speaker: 'bea', portrait: 'rare-smile', text: "Your compliance record this stretch has been... exemplary." },
        { speaker: 'bea', portrait: 'noting', text: "Consistent readings. Proper documentation. Timely maintenance." },
        { speaker: 'bea', portrait: 'stern', text: "Don't let it go to your head. Standards don't care about streaks." },
      ],
    },
    {
      id: 'bea_air_quality_focus',
      minRelationship: 15,
      context: 'any',
      portrait: 'noting',
      lines: [
        { speaker: 'bea', portrait: 'noting', text: "I ran the concourse air samples from last week." },
        { speaker: 'bea', portrait: 'noting', text: "Particulate counts in the luxury suites were borderline." },
        { speaker: 'bea', portrait: 'stern', text: "Air filtration is where most stadiums fail their first audit." },
        { speaker: 'bea', portrait: 'stern', text: "Don't be most stadiums." },
      ],
      choices: [
        { text: '"I\'ll check the HVAC filters today."', effects: [{ type: 'relationship', npc: 'bea', delta: 1 }] },
        { text: '"Borderline still passes, right?"', effects: [] },
      ],
    },

    // --- Cross-reference dialogue ---
    {
      id: 'bea_about_rusty',
      minRelationship: 15,
      context: 'normal',
      portrait: 'noting',
      lines: [
        { speaker: 'bea', portrait: 'noting', text: "I ran into Rusty in the mechanical room." },
        { speaker: 'bea', portrait: 'noting', text: "He was lecturing a pipe. A literal pipe." },
        { speaker: 'bea', portrait: 'stern', text: "I chose not to comment." },
        { speaker: null, text: "(You could swear Bea almost smiled.)" },
      ],
    },
    {
      id: 'bea_about_diego',
      minRelationship: 20,
      context: 'any',
      portrait: 'stern',
      lines: [
        { speaker: 'bea', portrait: 'stern', text: "That ballplayer -- Ramirez -- asked me about water quality standards." },
        { speaker: 'bea', portrait: 'noting', text: "Polite. Genuinely curious. I gave him a pamphlet." },
        { speaker: 'bea', portrait: 'stern', text: "If only the rest of this facility showed that level of interest." },
      ],
    },
  ],

  // ===========================================================================
  // DIEGO "CLUTCH" RAMIREZ — Star Player #7
  // Portrait moods: happy, nervous, pumped
  // ===========================================================================
  diego: [
    // --- Low tier (0+) ---
    {
      id: 'diego_intro_friendly',
      minRelationship: 0,
      context: 'normal',
      portrait: 'happy',
      lines: [
        { speaker: 'diego', portrait: 'happy', text: "Hey! You're the new filter person, right?" },
        { speaker: 'diego', portrait: 'happy', text: "Clutch Ramirez. Number seven." },
        { speaker: 'diego', portrait: 'happy', text: "Welcome to the Raptors family!" },
      ],
    },
    {
      id: 'diego_batting_practice',
      minRelationship: 0,
      context: 'normal',
      portrait: 'happy',
      lines: [
        { speaker: null, text: "(Diego is swinging a bat in the hallway.)" },
        { speaker: 'diego', portrait: 'happy', text: "Just getting my swings in." },
        { speaker: 'diego', portrait: 'happy', text: "Two hundred a day. Rain or shine." },
        { speaker: 'diego', portrait: 'happy', text: "You don't get clutch hits without the work." },
      ],
    },
    {
      id: 'diego_gameday_pumped',
      minRelationship: 0,
      context: 'gameday',
      portrait: 'pumped',
      lines: [
        { speaker: 'diego', portrait: 'pumped', text: "GAME DAY, baby!" },
        { speaker: 'diego', portrait: 'pumped', text: "You feel that energy? The crowd's electric!" },
        { speaker: 'diego', portrait: 'happy', text: "I live for this." },
      ],
    },

    // --- Mid tier (10+) ---
    {
      id: 'diego_superstition',
      minRelationship: 10,
      context: 'normal',
      portrait: 'nervous',
      lines: [
        { speaker: 'diego', portrait: 'nervous', text: "Okay, don't judge me." },
        { speaker: 'diego', portrait: 'nervous', text: "I have to drink from fountain #3 before every game." },
        { speaker: 'diego', portrait: 'nervous', text: "Same fountain. Same three sips. Every time." },
        { speaker: 'diego', portrait: 'happy', text: "So, uh, keep that one working? Please?" },
      ],
      choices: [
        { text: '"Fountain #3. Got it. VIP treatment."', effects: [{ type: 'relationship', npc: 'diego', delta: 1 }] },
        { text: '"That\'s... very specific."', effects: [] },
      ],
    },
    {
      id: 'diego_locker_room_talk',
      minRelationship: 10,
      context: 'normal',
      portrait: 'happy',
      lines: [
        { speaker: 'diego', portrait: 'happy', text: "The guys were talking about you in the locker room." },
        { speaker: 'diego', portrait: 'happy', text: "Jennings said the water tastes better this season." },
        { speaker: 'diego', portrait: 'happy', text: "For a catcher, that's high praise." },
      ],
    },
    {
      id: 'diego_asks_about_job',
      minRelationship: 10,
      context: 'normal',
      portrait: 'happy',
      lines: [
        { speaker: 'diego', portrait: 'happy', text: "So what's it actually like? The filter stuff?" },
        { speaker: 'diego', portrait: 'happy', text: "I always figured the water just... works." },
      ],
      choices: [
        { text: '"There\'s a whole world down there. Want a tour?"', effects: [{ type: 'relationship', npc: 'diego', delta: 1 }] },
        { text: '"It\'s a lot more exciting than you\'d think."', effects: [{ type: 'relationship', npc: 'diego', delta: 1 }] },
      ],
    },
    {
      id: 'diego_winning_team_morale',
      minRelationship: 10,
      context: 'winning',
      portrait: 'pumped',
      lines: [
        { speaker: 'diego', portrait: 'pumped', text: "Five game streak! Can you believe it?" },
        { speaker: 'diego', portrait: 'pumped', text: "The boys are feeling it. Stadium's rocking." },
        { speaker: 'diego', portrait: 'happy', text: "Good vibes all around, you know?" },
      ],
    },

    // --- High tier (25+) ---
    {
      id: 'diego_confides_pressure',
      minRelationship: 25,
      context: 'normal',
      portrait: 'nervous',
      lines: [
        { speaker: null, text: "(Diego sits on the bench, staring at his cleats.)" },
        { speaker: 'diego', portrait: 'nervous', text: "Can I be real with you for a sec?" },
        { speaker: 'diego', portrait: 'nervous', text: "Scouts are watching me. Like, MLB scouts." },
        { speaker: 'diego', portrait: 'nervous', text: "What if I'm not good enough?" },
      ],
      choices: [
        { text: '"They call you Clutch for a reason, Diego."', effects: [{ type: 'relationship', npc: 'diego', delta: 2 }] },
        { text: '"Just play your game. The rest follows."', effects: [{ type: 'relationship', npc: 'diego', delta: 1 }] },
      ],
    },
    {
      id: 'diego_credits_you',
      minRelationship: 25,
      context: 'winning',
      portrait: 'happy',
      lines: [
        { speaker: 'diego', portrait: 'happy', text: "Hey, I told the reporter something today." },
        { speaker: 'diego', portrait: 'happy', text: "Said the unsung hero is the person keeping this place alive." },
        { speaker: 'diego', portrait: 'happy', text: "Clean water, clean stadium, happy players." },
        { speaker: 'diego', portrait: 'happy', text: "That's you." },
      ],
    },
    {
      id: 'diego_gameday_trust',
      minRelationship: 25,
      context: 'gameday',
      portrait: 'pumped',
      lines: [
        { speaker: 'diego', portrait: 'pumped', text: "Big game tonight. I'm not worried though." },
        { speaker: 'diego', portrait: 'happy', text: "I know you've got the stadium handled." },
        { speaker: 'diego', portrait: 'pumped', text: "I do my job, you do yours. Team effort!" },
      ],
    },
    {
      id: 'diego_crisis_concern',
      minRelationship: 25,
      context: 'crisis',
      portrait: 'nervous',
      lines: [
        { speaker: 'diego', portrait: 'nervous', text: "Yo, the water in the dugout tastes weird." },
        { speaker: 'diego', portrait: 'nervous', text: "Some of the guys are complaining." },
        { speaker: 'diego', portrait: 'nervous', text: "I'm not blaming you. Just... letting you know." },
      ],
      choices: [
        { text: '"On it. I\'ll fix the dugout line first."', effects: [{ type: 'relationship', npc: 'diego', delta: 1 }] },
        { text: '"Tell the guys to hang tight."', effects: [] },
      ],
    },
    {
      id: 'diego_personal_moment',
      minRelationship: 25,
      context: 'any',
      portrait: 'happy',
      lines: [
        { speaker: 'diego', portrait: 'happy', text: "You know what I like about this place?" },
        { speaker: 'diego', portrait: 'happy', text: "It's not fancy. It's not big league." },
        { speaker: 'diego', portrait: 'happy', text: "But it's real. The people here are real." },
        { speaker: 'diego', portrait: 'happy', text: "Even when I make the show, I'll remember Ridgemont." },
      ],
    },

    // --- Season progress & variety (added) ---
    {
      id: 'diego_spring_training_energy',
      minRelationship: 0,
      context: 'normal',
      portrait: 'pumped',
      lines: [
        { speaker: 'diego', portrait: 'pumped', text: "New season! Fresh cleats, fresh start!" },
        { speaker: 'diego', portrait: 'happy', text: "The guys are fired up. Everyone's hitting well in practice." },
        { speaker: 'diego', portrait: 'pumped', text: "This is our year. I can feel it." },
      ],
    },
    {
      id: 'diego_late_season_grind',
      minRelationship: 10,
      context: 'normal',
      portrait: 'nervous',
      lines: [
        { speaker: null, text: "(Diego is stretching, wincing a little.)" },
        { speaker: 'diego', portrait: 'nervous', text: "Body's feeling every game now." },
        { speaker: 'diego', portrait: 'nervous', text: "Jennings pulled his hamstring yesterday. Martinez has a sore shoulder." },
        { speaker: 'diego', portrait: 'happy', text: "But we push through. That's what teams do." },
      ],
      choices: [
        { text: '"Take care of yourself out there, Clutch."', effects: [{ type: 'relationship', npc: 'diego', delta: 1 }] },
        { text: '"Need me to check the training room water?"', effects: [] },
      ],
    },
    {
      id: 'diego_rain_delay',
      minRelationship: 0,
      context: 'normal',
      portrait: 'nervous',
      lines: [
        { speaker: 'diego', portrait: 'nervous', text: "Man, that storm messed up the field." },
        { speaker: 'diego', portrait: 'nervous', text: "The infield is like a mud pit. Guys are slipping on every play." },
        { speaker: 'diego', portrait: 'happy', text: "On the bright side, my sliding game is looking great." },
        { speaker: null, text: "(He grins and mimes a slide.)" },
      ],
    },
    {
      id: 'diego_hot_streak_hype',
      minRelationship: 25,
      context: 'winning',
      portrait: 'pumped',
      lines: [
        { speaker: 'diego', portrait: 'pumped', text: "We are ON FIRE right now!" },
        { speaker: 'diego', portrait: 'pumped', text: "Crowd's louder, dugout's looser, everyone's swinging with confidence." },
        { speaker: 'diego', portrait: 'happy', text: "When the stadium feels right, the team plays right." },
        { speaker: 'diego', portrait: 'happy', text: "That's on you, keeping this place humming." },
      ],
    },
    {
      id: 'diego_water_quality_notice',
      minRelationship: 10,
      context: 'any',
      portrait: 'happy',
      lines: [
        { speaker: 'diego', portrait: 'happy', text: "Hey, random question." },
        { speaker: 'diego', portrait: 'happy', text: "Is it just me or does the water from the dugout fountain taste different today?" },
        { speaker: 'diego', portrait: 'nervous', text: "The guys are superstitious about this stuff. Jennings won't drink if it tastes off." },
        { speaker: 'diego', portrait: 'happy', text: "Just keeping you in the loop." },
      ],
      choices: [
        { text: '"I\'ll check the water filters right away."', effects: [{ type: 'relationship', npc: 'diego', delta: 1 }] },
        { text: '"Probably just the minerals. It\'s safe."', effects: [] },
      ],
    },

    // --- Cross-reference dialogue ---
    {
      id: 'diego_about_rusty',
      minRelationship: 15,
      context: 'normal',
      portrait: 'happy',
      lines: [
        { speaker: 'diego', portrait: 'happy', text: "Rusty taught me how to read a pressure gauge yesterday." },
        { speaker: 'diego', portrait: 'happy', text: "Said if I can read a pitch, I can read a gauge." },
        { speaker: 'diego', portrait: 'happy', text: "He's grumpy, but he's kind of like a baseball uncle, you know?" },
      ],
    },
    {
      id: 'diego_about_priya',
      minRelationship: 15,
      context: 'any',
      portrait: 'nervous',
      lines: [
        { speaker: 'diego', portrait: 'nervous', text: "Priya wants to do a feature on me." },
        { speaker: 'diego', portrait: 'nervous', text: "Like, a real profile. My childhood, the minors, everything." },
        { speaker: 'diego', portrait: 'happy', text: "She's cool. She actually listens when you talk." },
      ],
      choices: [
        { text: '"She\'ll write a great piece."', effects: [{ type: 'relationship', npc: 'diego', delta: 1 }] },
        { text: '"Just be careful what you say on the record."', effects: [] },
      ],
    },
  ],

  // ===========================================================================
  // FIONA PARK — Sponsor Manager
  // Portrait moods: evaluating, interested, impressed
  // ===========================================================================
  fiona: [
    // --- Low tier (0+) ---
    {
      id: 'fiona_intro_business',
      minRelationship: 0,
      context: 'normal',
      portrait: 'evaluating',
      lines: [
        { speaker: null, text: "(Fiona checks her phone, then looks up.)" },
        { speaker: 'fiona', portrait: 'evaluating', text: "Fiona Park. Corporate partnerships." },
        { speaker: 'fiona', portrait: 'evaluating', text: "I manage the money that keeps this place open." },
        { speaker: 'fiona', portrait: 'evaluating', text: "So... keep the place looking good, yes?" },
      ],
    },
    {
      id: 'fiona_polite_calculating',
      minRelationship: 0,
      context: 'normal',
      portrait: 'evaluating',
      lines: [
        { speaker: 'fiona', portrait: 'evaluating', text: "I ran the numbers on stadium upkeep costs." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Filtration is 12% of the operating budget." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Sponsors notice when that number fluctuates." },
      ],
      choices: [
        { text: '"I keep things efficient. Costs are stable."', effects: [{ type: 'relationship', npc: 'fiona', delta: 1 }] },
        { text: '"Is that high or low?"', effects: [] },
      ],
    },
    {
      id: 'fiona_gameday_metrics',
      minRelationship: 0,
      context: 'gameday',
      portrait: 'evaluating',
      lines: [
        { speaker: 'fiona', portrait: 'evaluating', text: "Sponsor reps are in the stands tonight." },
        { speaker: 'fiona', portrait: 'evaluating', text: "CleanFlow wants to see their filtration banners." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Make sure the product looks good out there." },
      ],
    },

    // --- Mid tier (15+) ---
    {
      id: 'fiona_contract_hint',
      minRelationship: 15,
      context: 'normal',
      portrait: 'interested',
      lines: [
        { speaker: 'fiona', portrait: 'interested', text: "Between you and me?" },
        { speaker: 'fiona', portrait: 'interested', text: "AquaPure is looking for a new stadium partner." },
        { speaker: 'fiona', portrait: 'interested', text: "If our numbers stay good, I can make a pitch." },
        { speaker: 'fiona', portrait: 'evaluating', text: "That means steady filter performance. Got it?" },
      ],
      choices: [
        { text: '"You handle the pitch, I\'ll handle the pipes."', effects: [{ type: 'relationship', npc: 'fiona', delta: 1 }] },
        { text: '"What kind of money are we talking?"', effects: [] },
      ],
    },
    {
      id: 'fiona_more_genuine',
      minRelationship: 15,
      context: 'normal',
      portrait: 'interested',
      lines: [
        { speaker: null, text: "(Fiona puts away her tablet for once.)" },
        { speaker: 'fiona', portrait: 'interested', text: "I don't usually do small stadiums." },
        { speaker: 'fiona', portrait: 'interested', text: "Ridgemont's my first minor league gig." },
        { speaker: 'fiona', portrait: 'interested', text: "It's... different. In a good way, I think." },
      ],
    },
    {
      id: 'fiona_winning_opportunity',
      minRelationship: 15,
      context: 'winning',
      portrait: 'impressed',
      lines: [
        { speaker: 'fiona', portrait: 'impressed', text: "A winning streak is a sponsor's dream." },
        { speaker: 'fiona', portrait: 'impressed', text: "Eyeballs on the stadium. Positive sentiment." },
        { speaker: 'fiona', portrait: 'interested', text: "Now's the time to lock in new deals." },
      ],
    },
    {
      id: 'fiona_crisis_damage_control',
      minRelationship: 15,
      context: 'crisis',
      portrait: 'evaluating',
      lines: [
        { speaker: 'fiona', portrait: 'evaluating', text: "This is a PR problem waiting to happen." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Sponsors are already asking questions." },
        { speaker: 'fiona', portrait: 'evaluating', text: "I can stall them, but not for long." },
      ],
      choices: [
        { text: '"Buy me 48 hours. I\'ll turn it around."', effects: [{ type: 'relationship', npc: 'fiona', delta: 1 }] },
        { text: '"What are they saying exactly?"', effects: [] },
      ],
    },

    // --- High tier (35+) ---
    {
      id: 'fiona_insider_tips',
      minRelationship: 35,
      context: 'normal',
      portrait: 'interested',
      lines: [
        { speaker: 'fiona', portrait: 'interested', text: "Okay, insider tip." },
        { speaker: 'fiona', portrait: 'interested', text: "Corporate sponsors judge in the first 30 seconds." },
        { speaker: 'fiona', portrait: 'interested', text: "Clean entrance, fresh water, no weird smells." },
        { speaker: 'fiona', portrait: 'interested', text: "Nail those and the contract is halfway signed." },
      ],
    },
    {
      id: 'fiona_genuine_friendship',
      minRelationship: 35,
      context: 'normal',
      portrait: 'impressed',
      lines: [
        { speaker: null, text: "(Fiona actually sits down instead of power-walking.)" },
        { speaker: 'fiona', portrait: 'impressed', text: "Can I be honest?" },
        { speaker: 'fiona', portrait: 'impressed', text: "I came here thinking this was a stepping stone." },
        { speaker: 'fiona', portrait: 'impressed', text: "Now? I actually care whether Ridgemont makes it." },
        { speaker: 'fiona', portrait: 'interested', text: "That's your fault, by the way." },
      ],
      choices: [
        { text: '"Ridgemont converts another one."', effects: [{ type: 'relationship', npc: 'fiona', delta: 2 }] },
        { text: '"We make a good team, Fiona."', effects: [{ type: 'relationship', npc: 'fiona', delta: 2 }] },
      ],
    },
    {
      id: 'fiona_advocates',
      minRelationship: 35,
      context: 'winning',
      portrait: 'impressed',
      lines: [
        { speaker: 'fiona', portrait: 'impressed', text: "I pitched Ridgemont to MegaCorp Stadium Group." },
        { speaker: 'fiona', portrait: 'impressed', text: "Told them we're the model minor league operation." },
        { speaker: 'fiona', portrait: 'impressed', text: "They're interested. Very interested." },
        { speaker: 'fiona', portrait: 'interested', text: "Keep doing what you're doing." },
      ],
    },
    {
      id: 'fiona_losing_loyal',
      minRelationship: 35,
      context: 'losing',
      portrait: 'interested',
      lines: [
        { speaker: 'fiona', portrait: 'interested', text: "Some sponsors are getting cold feet." },
        { speaker: 'fiona', portrait: 'interested', text: "But I talked three of them into staying." },
        { speaker: 'fiona', portrait: 'interested', text: "Told them Ridgemont's best days are ahead." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Don't make a liar out of me." },
      ],
      choices: [
        { text: '"I won\'t. Thank you, Fiona."', effects: [{ type: 'relationship', npc: 'fiona', delta: 2 }] },
        { text: '"We\'ll prove them right."', effects: [{ type: 'relationship', npc: 'fiona', delta: 1 }] },
      ],
    },
    {
      id: 'fiona_salazar_competition',
      minRelationship: 35,
      context: 'any',
      portrait: 'evaluating',
      lines: [
        { speaker: 'fiona', portrait: 'evaluating', text: "Salazar's been poaching our sponsor leads." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Throwing money around like it's nothing." },
        { speaker: 'fiona', portrait: 'impressed', text: "But money can't buy what Ridgemont has." },
        { speaker: 'fiona', portrait: 'interested', text: "Authenticity. That's our edge." },
      ],
    },

    // --- Season progress & variety (added) ---
    {
      id: 'fiona_new_season_pipeline',
      minRelationship: 0,
      context: 'normal',
      portrait: 'interested',
      lines: [
        { speaker: 'fiona', portrait: 'interested', text: "Fresh sponsor pipeline for the new season." },
        { speaker: 'fiona', portrait: 'interested', text: "Three brands are doing trial partnerships with us." },
        { speaker: 'fiona', portrait: 'evaluating', text: "If we impress them early, they'll sign full contracts." },
        { speaker: 'fiona', portrait: 'evaluating', text: "First impressions. They're everything in this business." },
      ],
    },
    {
      id: 'fiona_end_of_season_renewals',
      minRelationship: 15,
      context: 'normal',
      portrait: 'evaluating',
      lines: [
        { speaker: 'fiona', portrait: 'evaluating', text: "Renewal season is coming up. This is make or break." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Sponsors decide in the last two weeks whether to re-sign." },
        { speaker: 'fiona', portrait: 'interested', text: "They look at attendance, cleanliness, public perception." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Basically, keep everything running and I'll handle the pitch." },
      ],
      choices: [
        { text: '"They\'ll have nothing to complain about."', effects: [{ type: 'relationship', npc: 'fiona', delta: 1 }] },
        { text: '"How many are on the fence?"', effects: [] },
      ],
    },
    {
      id: 'fiona_storm_sponsor_worry',
      minRelationship: 15,
      context: 'crisis',
      portrait: 'evaluating',
      lines: [
        { speaker: 'fiona', portrait: 'evaluating', text: "The storm photos are already on social media." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Two sponsors called asking about structural integrity." },
        { speaker: 'fiona', portrait: 'interested', text: "I told them we have the best maintenance team in the league." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Please don't make that a lie." },
      ],
    },
    {
      id: 'fiona_winning_upsell',
      minRelationship: 35,
      context: 'winning',
      portrait: 'impressed',
      lines: [
        { speaker: 'fiona', portrait: 'impressed', text: "Good news. Three sponsors want to upgrade their packages." },
        { speaker: 'fiona', portrait: 'impressed', text: "Premium placements, luxury suite branding, the works." },
        { speaker: 'fiona', portrait: 'interested', text: "A hot streak is worth its weight in sponsorship gold." },
      ],
    },
    {
      id: 'fiona_concession_water_quality',
      minRelationship: 0,
      context: 'any',
      portrait: 'evaluating',
      lines: [
        { speaker: 'fiona', portrait: 'evaluating', text: "Quick heads up from the concessions side." },
        { speaker: 'fiona', portrait: 'evaluating', text: "The soda machines use tap water for mixing. If the water's off, the drinks taste off." },
        { speaker: 'fiona', portrait: 'interested', text: "And when the drinks taste off, the concession revenue drops." },
        { speaker: 'fiona', portrait: 'evaluating', text: "Everything connects back to those filters of yours." },
      ],
    },

    // --- Cross-reference dialogue ---
    {
      id: 'fiona_about_diego',
      minRelationship: 15,
      context: 'normal',
      portrait: 'interested',
      lines: [
        { speaker: 'fiona', portrait: 'interested', text: "Diego's jersey sales are up 40% this quarter." },
        { speaker: 'fiona', portrait: 'interested', text: "That kid is a walking brand partnership." },
        { speaker: 'fiona', portrait: 'evaluating', text: "If we keep him happy and the stadium looking good, sponsors line up themselves." },
      ],
    },
    {
      id: 'fiona_about_maggie',
      minRelationship: 20,
      context: 'normal',
      portrait: 'interested',
      lines: [
        { speaker: 'fiona', portrait: 'interested', text: "Maggie turned down another buyout offer." },
        { speaker: 'fiona', portrait: 'interested', text: "Most owners would've taken that number and retired." },
        { speaker: 'fiona', portrait: 'impressed', text: "Say what you will, but that woman has conviction." },
      ],
      choices: [
        { text: '"That\'s why Ridgemont is still standing."', effects: [{ type: 'relationship', npc: 'fiona', delta: 1 }] },
        { text: '"Conviction doesn\'t pay the bills."', effects: [] },
      ],
    },
    {
      id: 'fiona_about_priya',
      minRelationship: 15,
      context: 'any',
      portrait: 'evaluating',
      lines: [
        { speaker: 'fiona', portrait: 'evaluating', text: "Priya's latest article drove a 15% spike in our web traffic." },
        { speaker: 'fiona', portrait: 'evaluating', text: "I don't love reporters, but I love free publicity." },
        { speaker: 'fiona', portrait: 'interested', text: "Keep her writing nice things about us." },
      ],
    },
  ],

  // ===========================================================================
  // VICTOR SALAZAR — Rival Owner
  // Portrait moods: neutral, smug, angry, defeated
  // ===========================================================================
  victor: [
    // --- Tier 0 (0+): Adversarial/business ---
    {
      id: 'victor_plumbing_check',
      minRelationship: 0,
      context: 'normal',
      portrait: 'smug',
      lines: [
        { speaker: 'victor', portrait: 'smug', text: "Just checking if the plumbing is holding up." },
        { speaker: 'victor', portrait: 'smug', text: "I have contractors on speed dial. For when it doesn't." },
      ],
    },
    {
      id: 'victor_land_value',
      minRelationship: 0,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'victor', portrait: 'neutral', text: "You know what this lot is worth, Peralta?" },
        { speaker: 'victor', portrait: 'smug', text: "More than the franchise. More than the memories." },
        { speaker: 'victor', portrait: 'neutral', text: "Numbers don't lie. Nostalgia does." },
      ],
      choices: [
        { text: '"This place is worth more than you think."', effects: [{ type: 'relationship', npc: 'victor', delta: 1 }] },
        { text: '"Get off my field, Salazar."', effects: [{ type: 'relationship', npc: 'victor', delta: -2 }] },
      ],
    },
    {
      id: 'victor_business_card',
      minRelationship: 0,
      context: 'normal',
      portrait: 'smug',
      lines: [
        { speaker: null, text: "(Victor slides a business card across the railing.)" },
        { speaker: 'victor', portrait: 'smug', text: "In case you come to your senses." },
        { speaker: 'victor', portrait: 'neutral', text: "My offer has an expiration date, by the way." },
      ],
    },
    {
      id: 'victor_inspection_dig',
      minRelationship: 0,
      context: 'normal',
      portrait: 'smug',
      lines: [
        { speaker: 'victor', portrait: 'smug', text: "I heard the inspector paid you a visit." },
        { speaker: 'victor', portrait: 'smug', text: "Glendale passed with flying colors, naturally." },
        { speaker: 'victor', portrait: 'neutral', text: "But I'm sure yours went... fine." },
      ],
    },
    {
      id: 'victor_crisis_vulture',
      minRelationship: 0,
      context: 'crisis',
      portrait: 'neutral',
      lines: [
        { speaker: null, text: "(Victor surveys the damage with barely concealed interest.)" },
        { speaker: 'victor', portrait: 'neutral', text: "Rough day." },
        { speaker: 'victor', portrait: 'smug', text: "You know, Glendale has redundant systems for this sort of thing." },
        { speaker: 'victor', portrait: 'neutral', text: "Just saying." },
      ],
      choices: [
        { text: '"We\'ll handle it."', effects: [] },
        { text: '"Any advice, actually?"', effects: [{ type: 'relationship', npc: 'victor', delta: 2 }, { type: 'reputation', delta: -1 }] },
      ],
    },
    {
      id: 'victor_losing_pity',
      minRelationship: 0,
      context: 'losing',
      portrait: 'neutral',
      lines: [
        { speaker: 'victor', portrait: 'neutral', text: "I'm not here to gloat, Peralta." },
        { speaker: null, text: "(He is clearly here to gloat.)" },
        { speaker: 'victor', portrait: 'smug', text: "I just think it's important to know when a project has run its course." },
      ],
    },
    {
      id: 'victor_winning_grudge',
      minRelationship: 0,
      context: 'winning',
      portrait: 'neutral',
      lines: [
        { speaker: 'victor', portrait: 'neutral', text: "Impressive numbers lately." },
        { speaker: 'victor', portrait: 'smug', text: "Enjoy the peak. Peaks don't last." },
        { speaker: 'victor', portrait: 'neutral', text: "Ask me how I know." },
      ],
    },

    // --- Tier 1 (20+): Grudging respect ---
    {
      id: 'victor_respect_admission',
      minRelationship: 20,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'victor', portrait: 'neutral', text: "I'll admit, you've surprised me." },
        { speaker: 'victor', portrait: 'neutral', text: "Most people in your position fold by now." },
        { speaker: 'victor', portrait: 'smug', text: "Doesn't mean you'll win. Just means you're stubborn." },
      ],
    },
    {
      id: 'victor_old_days',
      minRelationship: 20,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: null, text: "(Victor stares at the scoreboard for a long moment.)" },
        { speaker: 'victor', portrait: 'neutral', text: "My grandfather built three stadiums." },
        { speaker: 'victor', portrait: 'neutral', text: "He said the ones that survive aren't the biggest. They're the ones people refuse to let die." },
        { speaker: 'victor', portrait: 'smug', text: "He also went bankrupt. So." },
      ],
      choices: [
        { text: '"Sounds like he understood something you don\'t."', effects: [{ type: 'relationship', npc: 'victor', delta: -1 }] },
        { text: '"Maybe there\'s a lesson in both outcomes."', effects: [{ type: 'relationship', npc: 'victor', delta: 2 }] },
      ],
    },
    {
      id: 'victor_rivalry_compliment',
      minRelationship: 20,
      context: 'winning',
      portrait: 'neutral',
      lines: [
        { speaker: 'victor', portrait: 'neutral', text: "Your attendance is up. I noticed." },
        { speaker: 'victor', portrait: 'neutral', text: "Competition is supposed to sharpen both sides." },
        { speaker: 'victor', portrait: 'smug', text: "So thanks for keeping me on my toes, I guess." },
      ],
    },
    {
      id: 'victor_crisis_offer',
      minRelationship: 20,
      context: 'crisis',
      portrait: 'neutral',
      lines: [
        { speaker: 'victor', portrait: 'neutral', text: "Look, I know a guy who does emergency HVAC work." },
        { speaker: 'victor', portrait: 'neutral', text: "He's not cheap, but he's fast." },
        { speaker: 'victor', portrait: 'smug', text: "Consider it professional courtesy." },
      ],
      choices: [
        { text: '"I appreciate that, Victor."', effects: [{ type: 'relationship', npc: 'victor', delta: 2 }, { type: 'reputation', delta: -1 }] },
        { text: '"We don\'t need your charity."', effects: [{ type: 'relationship', npc: 'victor', delta: -1 }] },
      ],
    },

    // --- Tier 2 (40+): Truce/cooperation hints ---
    {
      id: 'victor_truce_talk',
      minRelationship: 40,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'victor', portrait: 'neutral', text: "What if we stopped pretending this is a zero-sum game?" },
        { speaker: 'victor', portrait: 'neutral', text: "Two strong stadiums in one metro area. That's good for the whole league." },
        { speaker: 'victor', portrait: 'neutral', text: "I'm not saying we become friends." },
        { speaker: 'victor', portrait: 'smug', text: "I'm saying we become strategic." },
      ],
      choices: [
        { text: '"I\'m listening."', effects: [{ type: 'relationship', npc: 'victor', delta: 3 }] },
        { text: '"I\'ll believe it when I see it."', effects: [] },
      ],
    },
    {
      id: 'victor_winning_acknowledge',
      minRelationship: 40,
      context: 'winning',
      portrait: 'neutral',
      lines: [
        { speaker: 'victor', portrait: 'neutral', text: "You've built something real here, Peralta." },
        { speaker: null, text: "(He says it like it costs him something.)" },
        { speaker: 'victor', portrait: 'neutral', text: "My board is asking what you're doing differently." },
        { speaker: 'victor', portrait: 'smug', text: "I told them it's stubbornness. They weren't satisfied." },
      ],
    },
    {
      id: 'victor_league_meeting',
      minRelationship: 40,
      context: 'normal',
      portrait: 'neutral',
      lines: [
        { speaker: 'victor', portrait: 'neutral', text: "There's a league owners' meeting next month." },
        { speaker: 'victor', portrait: 'neutral', text: "They want to discuss shared maintenance standards." },
        { speaker: 'victor', portrait: 'neutral', text: "Your name came up as someone who knows filtration." },
        { speaker: 'victor', portrait: 'smug', text: "I didn't correct them." },
      ],
    },
    {
      id: 'victor_losing_restrained',
      minRelationship: 40,
      context: 'losing',
      portrait: 'neutral',
      lines: [
        { speaker: 'victor', portrait: 'neutral', text: "Tough stretch." },
        { speaker: null, text: "(He pauses, choosing his words carefully.)" },
        { speaker: 'victor', portrait: 'neutral', text: "If you need a short-term equipment loan, off the books..." },
        { speaker: 'victor', portrait: 'neutral', text: "My people can arrange something." },
      ],
      choices: [
        { text: '"That\'s... actually decent of you."', effects: [{ type: 'relationship', npc: 'victor', delta: 2 }] },
        { text: '"No strings attached?"', effects: [{ type: 'relationship', npc: 'victor', delta: 1 }] },
      ],
    },
  ],

};

export default NPC_CASUAL_DIALOGUE;
