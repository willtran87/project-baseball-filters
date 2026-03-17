/**
 * InteractiveObjects — Registry of clickable environment objects per zone.
 *
 * When the player clicks on a non-filter, non-vent-slot tile, this system
 * checks whether an interactive object exists at that grid position and
 * returns contextual, state-aware flavor text.
 */

export class InteractiveObjects {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;
    this._objects = this._buildRegistry();
  }

  /**
   * Check if there's an interactive object at (col, row) in the given zone.
   * Returns { name, description, action, icon } or null.
   */
  getObjectAt(col, row, zone) {
    const zoneObjects = this._objects[zone];
    if (!zoneObjects) return null;
    return zoneObjects.find(obj =>
      col >= obj.col1 && col <= obj.col2 &&
      row >= obj.row1 && row <= obj.row2
    ) ?? null;
  }

  /**
   * Handle a click on an interactive object. Returns feedback text.
   */
  interact(obj) {
    if (obj.action) return obj.action(this.state);
    return obj.description;
  }

  _buildRegistry() {
    return {
      field: this._fieldObjects(),
      concourse: this._concourseObjects(),
      mechanical: this._mechanicalObjects(),
      underground: this._undergroundObjects(),
      luxury: this._luxuryObjects(),
      pressbox: this._pressboxObjects(),
    };
  }

  /* ================================================================ */
  /*  FIELD ZONE                                                       */
  /* ================================================================ */

  _fieldObjects() {
    // Field zone is primarily a navigation view (clicking rows 4-9, 13-17 navigates
    // to sub-zones). Only register objects on non-navigation rows: sky (0-2),
    // roof (3), walls (10-11), field (12), and foundation (18-19).
    return [
      {
        name: 'Stadium Lights',
        col1: 3, col2: 4, row1: 3, row2: 3,
        icon: '\u{1f4a1}',
        action: () => 'Stadium lights. 1500W each, running since 1987. Old but reliable.',
      },
      {
        name: 'Stadium Lights',
        col1: 25, col2: 26, row1: 3, row2: 3,
        icon: '\u{1f4a1}',
        action: (s) => {
          return s.gameDay % 7 === 0
            ? 'Right-field tower. Flickering tonight... moths are throwing a party up there.'
            : 'Stadium lights. The right-field tower flickers during night games.';
        },
      },
      {
        name: 'Roof Structure',
        col1: 5, col2: 24, row1: 3, row2: 3,
        icon: '\u{1f3df}',
        description: 'Steel roof trusses. Original 1987 construction — built to last.',
      },
      {
        name: 'Scoreboard',
        col1: 12, col2: 17, row1: 0, row2: 2,
        icon: '\u{1f4ca}',
        action: (s) => {
          const msgs = [
            `Scoreboard reads: "WELCOME TO RIDGEMONT" — Season ${s.season ?? 1}, Day ${s.gameDay}.`,
            'The scoreboard. Half the LEDs were replaced last year. You can tell which half.',
            'Scoreboard. The "R" in "RAPTORS" keeps blinking out. Fans call the team the "APTORS" now.',
          ];
          if (s.rivalRep && s.reputation > s.rivalRep) {
            msgs.push('Scoreboard flashes: "WE\'RE #1!" Someone programmed that as a little dig at Glendale.');
          }
          if (s.reputation > 75) msgs.push('The packed stands buzz with energy. The scoreboard can barely keep up with the crowd cam.');
          if (s.offSeason) msgs.push('The scoreboard is dark. The empty diamond waits for opening day.');
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Flagpole',
        col1: 1, col2: 2, row1: 0, row2: 2,
        icon: '\u{1f3f3}',
        action: (s) => {
          if (s.reputation >= 86) return 'The championship banner whips in the breeze. You earned that.';
          if (s.reputation >= 56) return 'Team pennant flying high. Room for a championship banner up there...';
          return 'Flagpole. A faded Raptors pennant. It\'s seen better days. So has this stadium.';
        },
      },
      {
        name: 'Stadium Wall',
        col1: 2, col2: 27, row1: 10, row2: 11,
        icon: '\u{1f9f1}',
        action: (s) => {
          const facts = [
            'Outfield wall. Sponsor banners and ivy.',
            'The wall. 320 feet to center — short porch for a minor league park.',
            'Stadium wall. Someone scratched "Go Raptors" into the concrete.',
            'The ivy is looking a little brown. Field drainage affects everything.',
            'You spot a ball wedged in the ivy. It\'s been there since \'09.',
          ];
          if (s.domainHealth.drainage < 40) {
            facts.push('Water stains on the lower wall. The drainage isn\'t keeping up.');
          }
          return facts[Math.floor(Math.random() * facts.length)];
        },
      },
      {
        name: 'Playing Field',
        col1: 4, col2: 25, row1: 12, row2: 12,
        icon: '\u26be',
        action: (s) => {
          if (s.domainHealth.drainage < 30) return 'The diamond. Puddles on the infield. The grounds crew looks miserable.';
          if (s.gameDay > 60) return 'The diamond. Late season — the turf has character. "Battle scars," Rusty calls them.';
          if (s.gameDay > 30) return 'The diamond. Turf is holding up well this season.';
          return 'The diamond. Fresh sod from opening day. Smells like spring.';
        },
      },
      {
        name: 'Dugout',
        col1: 27, col2: 29, row1: 11, row2: 12,
        icon: '\u26be',
        action: (s) => {
          const msgs = [
            'Home dugout. Diego "Clutch" Ramirez\'s lucky bat is leaning against the wall.',
            'The dugout. Sunflower seed shells everywhere. Classic baseball.',
            'Dugout. Someone left a crossword puzzle on the bench. 12-across: "Stadium fluid system." Seven letters.',
          ];
          if (s.npcRelationships?.diego > 20) {
            msgs.push('Diego waves from the dugout. "Keep those filters clean, Pipes! We\'re winning tonight!"');
          }
          if (s.offSeason) msgs.push('Dugout is empty. Tarps cover the bench. The offseason quiet is almost eerie.');
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Foundation',
        col1: 2, col2: 27, row1: 18, row2: 19,
        icon: '\u{1f9f1}',
        description: 'Deep foundation. Poured concrete from the original build. Solid as a rock.',
      },
    ];
  }

  /* ================================================================ */
  /*  CONCOURSE ZONE                                                   */
  /* ================================================================ */

  _concourseObjects() {
    return [
      {
        name: 'Ductwork',
        col1: 0, col2: 29, row1: 2, row2: 2,
        icon: '\u{1f4a8}',
        action: (s) => {
          const air = Math.floor(s.domainHealth.air);
          if (air < 30) return `Overhead ducts. Air quality at ${air}% — you can SEE the dust particles. Yikes.`;
          if (air < 50) return `Overhead ducts. Air quality at ${air}% — dust visible in the vents.`;
          if (air > 85) return 'Overhead ductwork. Air so clean you could perform surgery. Almost.';
          return 'Overhead ductwork. Clean air flowing through the concourse.';
        },
      },
      {
        name: 'Hot Dog Stand',
        col1: 2, col2: 4, row1: 4, row2: 5,
        icon: '\u{1f32d}',
        action: (s) => {
          const msgs = [];
          if (s.domainHealth.water > 60) {
            msgs.push('Hot dog stand. Fresh dogs on the grill! Two bucks, no ketchup debate.');
            msgs.push('Hot dog stand. The vendor, Big Tony, claims his secret is "stadium water." Don\'t think about it.');
            msgs.push('Hot dogs. The aroma pulls fans in from three sections away. Secret weapon: onions.');
          } else {
            msgs.push('Hot dog stand. Health inspector wouldn\'t approve of the water situation...');
            msgs.push('Hot dog stand. Big Tony is nervously eyeing the tap water. "Maybe we go with bottled today."');
          }
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Pretzel Stand',
        col1: 8, col2: 10, row1: 4, row2: 5,
        icon: '\u{1f968}',
        action: (s) => {
          const msgs = [
            'Pretzel & beer stand. A stadium classic since \'92.',
            'Fresh pretzels. The salt-to-pretzel ratio here is legendary.',
            'Pretzel stand. The vendor does a little twist-and-toss for every order. Crowd loves it.',
          ];
          if (s.domainHealth.hvac < 50) {
            msgs.push('Pretzel stand. The vendor is fanning herself. "Any chance you can fix the AC?"');
          }
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Nachos Counter',
        col1: 15, col2: 17, row1: 4, row2: 5,
        icon: '\u{1f9c0}',
        action: (s) => {
          if (s.money > 15000) return 'Nachos & sodas. Upgraded to the premium cheese. Life is good.';
          if (s.money > 5000) return 'Nachos & sodas. Business is booming — the cheese pump is working overtime.';
          return 'Nachos & sodas. Slow day at the counter. The cheese is congealing.';
        },
      },
      {
        name: 'Souvenir Stand',
        col1: 22, col2: 24, row1: 4, row2: 5,
        icon: '\u{1f9e2}',
        action: (s) => {
          if (s.reputation > 80) return 'Souvenir stand. "SOLD OUT" on the premium jerseys. Again.';
          if (s.reputation > 60) return 'Souvenir stand. Raptors jerseys flying off the rack!';
          if (s.reputation > 40) return 'Souvenir stand. A kid buys a foam finger. Small victories.';
          return 'Souvenir stand. Dusty foam fingers and last year\'s pennants. The vendor is reading a book.';
        },
      },
      {
        name: 'Fan With Sign',
        col1: 12, col2: 14, row1: 6, row2: 7,
        icon: '\u{1f3c6}',
        action: (s) => {
          const signs = [
            'A kid holds up a sign: "MY FIRST GAME!" Makes the long shifts worth it.',
            'Fan with a sign: "WE BELIEVE IN THE RAPTORS." The handwriting is terrible. The spirit is perfect.',
            'A group of fans chanting. Hard to tell if it\'s for the team or the nachos.',
          ];
          if (s.reputation > 70) {
            signs.push('Fan holding a sign: "BEST STADIUM IN THE LEAGUE!" You\'re blushing.');
            signs.push('A fan is wearing a custom t-shirt that says "I SURVIVED THE BROWNTIDE." Fair enough.');
          }
          if (s.reputation < 30) {
            signs.push('Fan holding a sign: "FIX THE TOILETS." Direct. Honest. Painful.');
          }
          return signs[Math.floor(Math.random() * signs.length)];
        },
      },
      {
        name: 'Concourse Walkway',
        col1: 1, col2: 28, row1: 8, row2: 11,
        icon: '\u{1f6b6}',
        action: (s) => {
          const occ = Math.min(100, Math.max(10, Math.floor(s.reputation * 0.85 + 15)));
          if (occ > 70) return 'Main concourse. Packed — fans shoulder to shoulder. The energy is electric.';
          if (occ > 40) return 'Concourse walkway. Steady foot traffic between innings.';
          return 'Concourse. Pretty quiet. A few fans wandering to the restrooms.';
        },
      },
      {
        name: 'Water Fountain',
        col1: 11, col2: 12, row1: 12, row2: 13,
        icon: '\u{1f4a7}',
        action: (s) => {
          const water = Math.floor(s.domainHealth.water);
          if (water < 30) return 'Water fountain. A brave fan takes a sip and immediately regrets it.';
          if (water < 60) return `Water fountain. ${water}% purity. It\'s... technically potable.`;
          if (water > 85) return 'Water fountain. Crystal clear. A fan fills up their water bottle and gives a thumbs up.';
          return 'Water fountain. Clean and cold. The little things matter.';
        },
      },
      {
        name: 'Restrooms',
        col1: 5, col2: 8, row1: 12, row2: 14,
        icon: '\u{1f6bb}',
        action: (s) => {
          if (s.domainHealth.water < 30) return 'Restrooms. A handwritten "ENTER AT YOUR OWN RISK" sign. That can\'t be official.';
          if (s.domainHealth.water < 40) return 'Restrooms. OUT OF ORDER sign on half the stalls. Rusty would be mortified.';
          if (s.domainHealth.water > 80) return 'Restrooms. Spotless. You can hear someone humming contentedly from inside. Success.';
          return 'Restrooms. Reasonably clean. The soap dispensers are even full.';
        },
      },
      {
        name: 'Restrooms',
        col1: 20, col2: 23, row1: 12, row2: 14,
        icon: '\u{1f6bb}',
        action: (s) => {
          if (s.domainHealth.water < 40) return 'Restrooms. Brown water in the sinks. Fans are complaining.';
          if (s.domainHealth.drainage < 40) return 'Restrooms. The drains are gurgling ominously. Should probably check on that.';
          return 'Restrooms. All functional. That\'s a win in minor league baseball.';
        },
      },
      {
        name: 'Bulletin Board',
        col1: 26, col2: 28, row1: 4, row2: 5,
        icon: '\u{1f4cb}',
        action: (s) => {
          const notices = [
            'Bulletin board. "LOST: One foam finger. Sentimental value. Call Dave."',
            'Community board. Kids\' drawings of the Raptors mascot. Adorable.',
            'Notice board: "Employee of the Month" frame is empty. Subtle message.',
            'Bulletin board. Someone pinned a picture of Victor Salazar with devil horns drawn on.',
          ];
          if ((s.season ?? 1) > 1) notices.push('Board: "SEASON TICKET HOLDER APPRECIATION NIGHT — See You There!"');
          return notices[Math.floor(Math.random() * notices.length)];
        },
      },
      {
        name: 'Section Signage',
        col1: 0, col2: 29, row1: 0, row2: 1,
        icon: '\u{1f6c8}',
        description: 'Ceiling panels. The fluorescent lights have that classic ballpark buzz.',
      },
      {
        name: 'Foundation',
        col1: 0, col2: 29, row1: 16, row2: 17,
        icon: '\u{1f9f1}',
        description: 'Lower structure. Support columns from the original 1987 construction.',
      },
    ];
  }

  /* ================================================================ */
  /*  MECHANICAL ZONE                                                  */
  /* ================================================================ */

  _mechanicalObjects() {
    return [
      {
        name: 'Ceiling Ductwork',
        col1: 0, col2: 29, row1: 1, row2: 2,
        icon: '\u{1f4a8}',
        action: (s) => {
          if (s.domainHealth.air < 30) return 'Exposed ceiling ducts. Something is rattling inside. Sounds alive.';
          return 'Exposed ceiling ducts. The main air supply for the whole stadium.';
        },
      },
      {
        name: 'HVAC Unit',
        col1: 2, col2: 6, row1: 4, row2: 8,
        icon: '\u2699',
        action: (s) => {
          const hvac = Math.floor(s.domainHealth.hvac);
          if (hvac < 30) return `Main HVAC unit. ${hvac}% efficiency. It's making a noise that Rusty calls "the death rattle."`;
          if (hvac < 50) return `Main HVAC unit. ${hvac}% efficiency. Making concerning noises.`;
          if (hvac > 85) return `Main HVAC unit. ${hvac}% efficiency. Purring like a kitten. A very large, industrial kitten.`;
          return `Main HVAC unit. ${hvac}% efficiency. Humming along nicely.`;
        },
      },
      {
        name: 'Boiler',
        col1: 12, col2: 16, row1: 4, row2: 8,
        icon: '\u{1f525}',
        action: (s) => {
          const hvac = Math.floor(s.domainHealth.hvac);
          const msgs = [];
          if (hvac < 40) {
            msgs.push('Industrial boiler. Running hot. The pressure gauge is in the red zone.');
            msgs.push('Boiler. Rusty taped a note to it: "I WILL OUTLAST YOU." Unclear if he means the boiler or himself.');
          } else {
            msgs.push('Industrial boiler. Heats the whole stadium. Installed in \'94 — still going strong.');
            msgs.push('Boiler. You can feel the heat radiating from it. In winter, the crew eats lunch next to it.');
          }
          const hvacStaff = s.staffAssignments?.hvac;
          if (hvacStaff?.length > 0) {
            msgs.push(`A maintenance checklist is pinned up — ${hvacStaff[0].name ?? 'your crew'} keeps things running.`);
          }
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Compressor Bank',
        col1: 22, col2: 26, row1: 4, row2: 8,
        icon: '\u2699',
        action: (s) => {
          if (s.domainHealth.hvac < 40) return 'Compressor bank. Two units down. Luxury suite guests are "sweating with distinction."';
          if (s.domainHealth.hvac < 60) return 'Compressor bank. One unit is down — cooling capacity reduced.';
          return 'AC compressor bank. Keeping the luxury suites at 72 degrees.';
        },
      },
      {
        name: 'Gauges & Meters',
        col1: 8, col2: 10, row1: 4, row2: 6,
        icon: '\u{1f4c8}',
        action: (s) => {
          const avgHealth = Math.floor(
            (s.domainHealth.air + s.domainHealth.water + s.domainHealth.hvac + s.domainHealth.drainage) / 4
          );
          if (avgHealth > 80) return 'Gauge panel. Everything in the green. Hank would be proud of these readings.';
          if (avgHealth > 50) return `System gauges. Average system health: ${avgHealth}%. Workable.`;
          return `System gauges. Average health: ${avgHealth}%. Half these needles are in the danger zone.`;
        },
      },
      {
        name: 'Pipe Junction',
        col1: 0, col2: 29, row1: 10, row2: 10,
        icon: '\u{1f527}',
        action: (s) => {
          const water = Math.floor(s.domainHealth.water);
          if (water < 30) return `Water main junction. ${water}% flow. Rusty is going to need more duct tape.`;
          return `Water main junction. ${water}% flow rate. ${water < 50 ? 'Pressure is dropping.' : 'Nominal.'}`;
        },
      },
      {
        name: 'Electrical Panel',
        col1: 7, col2: 9, row1: 11, row2: 12,
        icon: '\u26a1',
        action: () => {
          const msgs = [
            'Main electrical panel. "DO NOT TOUCH" — someone clearly ignored that.',
            'Electrical panel. Breakers labeled in three different handwritings spanning decades.',
            'Main panel. One breaker is labeled "???" in faded marker. Nobody knows what it does. Nobody dares flip it.',
          ];
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Hank\'s Workbench',
        col1: 10, col2: 12, row1: 15, row2: 16,
        icon: '\u{1f4d3}',
        action: (s) => {
          const msgs = [
            'An old workbench with initials carved in: "H.D." Hank Doolan worked here for years.',
            'Hank\'s workbench. A coffee mug with a Raptors logo sits here, bone dry. Nobody moves it.',
            'Workbench. Hank\'s handwriting is on a parts list taped to the wall. "Order 2x gaskets, 1x hope."',
          ];
          if (s.hanksNotes && s.hanksNotes.length >= 4) {
            msgs.push('Hank\'s workbench. The more notes you find, the more this bench tells you about who he was.');
          }
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Control Panel',
        col1: 18, col2: 20, row1: 11, row2: 12,
        icon: '\u{1f39b}',
        action: (s) => {
          const worst = Math.min(s.domainHealth.air, s.domainHealth.water, s.domainHealth.hvac, s.domainHealth.drainage);
          if (s.completedResearch?.length > 0) return 'The upgraded control panel shows real-time diagnostics from your research investments. Every light tells a story.';
          if (worst < 20) return 'System control panel. So many red lights it looks like a Christmas tree. A bad Christmas tree.';
          if (worst < 40) return 'System control panel. Warning lights blinking across the board.';
          if (worst > 80) return 'System control panel. All indicators green. You take a photo. This needs to be documented.';
          return 'System control panel. All indicators green. Rare sight around here.';
        },
      },
      {
        name: 'Pipe Run',
        col1: 0, col2: 29, row1: 14, row2: 14,
        icon: '\u{1f527}',
        action: (s) => {
          const drain = Math.floor(s.domainHealth.drainage);
          return `Lower pipe run. Drainage at ${drain}%. ${drain < 40 ? 'Condensation dripping everywhere.' : 'Dry and clear.'}`;
        },
      },
      {
        name: 'Tool Rack',
        col1: 27, col2: 28, row1: 15, row2: 16,
        icon: '\u{1f6e0}',
        action: (s) => {
          const msgs = [];
          if (s.npcRelationships?.rusty > 50) {
            msgs.push('Rusty\'s tool rack. He gave you your own section. That\'s basically a marriage proposal in mechanic terms.');
          } else if (s.npcRelationships?.rusty > 30) {
            msgs.push('Rusty\'s tool rack. Everything in its place. He lets you borrow the good wrench now.');
          } else {
            msgs.push('Rusty\'s tool rack. Organized chaos. "Touch nothing" is the unwritten rule.');
          }
          msgs.push('Tool rack. A wrench set from 1992, still perfectly calibrated. They don\'t make \'em like they used to.');
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Sub-floor',
        col1: 0, col2: 29, row1: 17, row2: 19,
        icon: '\u{1f9f1}',
        description: 'Sub-floor access. Cables and pipes disappearing into the foundation.',
      },
    ];
  }

  /* ================================================================ */
  /*  UNDERGROUND ZONE                                                 */
  /* ================================================================ */

  _undergroundObjects() {
    return [
      {
        name: 'Tunnel Ceiling',
        col1: 0, col2: 29, row1: 0, row2: 4,
        icon: '\u{1f9f1}',
        action: (s) => {
          const msgs = [
            'Reinforced concrete ceiling. Stadium weight pressing down above.',
            'Ceiling. You can hear the rumble of fans stomping their feet during a rally.',
          ];
          if (s.domainHealth.drainage < 40) {
            msgs.push('Ceiling dripping. Moisture is finding its way through micro-cracks. Nature always wins... eventually.');
          }
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Upper Pipe Run',
        col1: 0, col2: 29, row1: 6, row2: 6,
        icon: '\u{1f527}',
        action: (s) => {
          const water = Math.floor(s.domainHealth.water);
          const noteCount = s.hanksNotes?.length ?? 0;
          if (noteCount >= 3 && Math.random() < 0.25) return 'You notice another of Hank\'s cryptic markings scratched into the pipe. A date and a pressure reading from years ago.';
          if (water < 30) return `Main water supply. ${water}% pressure. You can hear the pipes groaning. That's bad.`;
          return `Main water supply pipe. ${water}% pressure. ${water < 50 ? 'Joints are leaking.' : 'Holding steady.'}`;
        },
      },
      {
        name: 'Pump Station A',
        col1: 4, col2: 6, row1: 7, row2: 8,
        icon: '\u{1f504}',
        action: (s) => {
          const drain = Math.floor(s.domainHealth.drainage);
          if (drain < 20) return 'Pump A. Alarm blaring. This pump is fighting for its life.';
          return `Pump station A. ${drain}% capacity. ${drain < 30 ? 'Backup warning light is on.' : 'Running within spec.'}`;
        },
      },
      {
        name: 'Pump Station B',
        col1: 14, col2: 16, row1: 7, row2: 8,
        icon: '\u{1f504}',
        action: (s) => {
          return s.domainHealth.drainage < 50
            ? 'Pump station B. Overworked. The impeller sounds rough.'
            : 'Pump station B. Secondary pump holding the line.';
        },
      },
      {
        name: 'Pump Station C',
        col1: 25, col2: 27, row1: 7, row2: 8,
        icon: '\u{1f504}',
        action: (s) => {
          return s.domainHealth.drainage < 60
            ? 'Pump station C. Cavitation noises. Not a great sign.'
            : 'Pump station C. Emergency backup pump. Tested monthly by Rusty.';
        },
      },
      {
        name: 'Old Maintenance Cart',
        col1: 7, col2: 9, row1: 9, row2: 10,
        icon: '\u{1f6d2}',
        action: (s) => {
          const msgs = [
            'An old maintenance cart. Rust-colored and dented. Still rolls, though.',
            'Hank\'s maintenance cart. He welded a cupholder onto it. Priorities.',
            'Supply cart. Someone left a lunchbox on it from... 2018? Better not open that.',
          ];
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Tunnel Walkway',
        col1: 1, col2: 28, row1: 9, row2: 10,
        icon: '\u{1f6b6}',
        action: (s) => {
          const msgs = [
            'Maintenance walkway. Boot prints in the damp concrete. Hank walked here daily.',
            'Tunnel walkway. The echo of your footsteps bounces off the walls. It\'s peaceful down here.',
            'Walkway. Someone painted distance markers. "200ft to Pump A." Thoughtful.',
          ];
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Cross Tunnel',
        col1: 10, col2: 10, row1: 5, row2: 14,
        icon: '\u{1f6b6}',
        description: 'Cross-tunnel passage. Emergency lighting casts long shadows.',
      },
      {
        name: 'Cross Tunnel',
        col1: 20, col2: 20, row1: 5, row2: 14,
        icon: '\u{1f6b6}',
        action: () => {
          const msgs = [
            'Service tunnel. Old graffiti on the wall: "Hank was here \'03".',
            'Service tunnel. Someone drew a tiny Raptors logo in Sharpie. It\'s quite good.',
          ];
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Mystery Valve',
        col1: 12, col2: 13, row1: 11, row2: 12,
        icon: '\u{1f504}',
        action: (s) => {
          const msgs = [
            'A large red valve wheel. Label says "DO NOT TURN." In Hank\'s handwriting. You don\'t turn it.',
            'Red valve. Nobody remembers what it connects to. It\'s been in the "fully open" position since \'97.',
            'Mystery valve. Rusty says, "That one stays where it is. Trust me." So it stays.',
          ];
          if (s.hanksNotes && s.hanksNotes.length >= 6) {
            msgs.push('Red valve. Hank\'s Note #6 mentions this: "Emergency bypass. Only in case of total failure. Elena\'s failsafe."');
          }
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Lower Pipe Run',
        col1: 0, col2: 29, row1: 13, row2: 13,
        icon: '\u{1f527}',
        action: (s) => {
          const drain = Math.floor(s.domainHealth.drainage);
          const noteCount = s.hanksNotes?.length ?? 0;
          if (noteCount >= 2 && Math.random() < 0.3) return 'You notice another of Hank\'s cryptic markings scratched into the pipe. An arrow pointing deeper underground.';
          return `Storm drainage channel. ${drain < 30 ? 'Backing up. Not good.' : 'Flowing normally.'}`;
        },
      },
      {
        name: 'Water Stain Line',
        col1: 2, col2: 3, row1: 5, row2: 5,
        icon: '\u{1f30a}',
        action: (s) => {
          if (s.domainHealth.drainage < 30) return 'A dark water stain rings the wall at waist height — the Browntide\'s high-water mark. The current levels are creeping back toward it.';
          if (s.domainHealth.drainage < 60) return 'A dark water stain rings the wall — the Browntide\'s high-water mark. A reminder of what happens when the pumps fail.';
          return 'A faint tide line on the concrete wall marks where the Browntide reached. Someone scratched the date beneath it: "Never again."';
        },
      },
      {
        name: 'Old Maintenance Log',
        col1: 7, col2: 9, row1: 11, row2: 12,
        icon: '\u{1f4d6}',
        action: () => {
          const msgs = [
            'A battered logbook chained to a pipe bracket. Decades of repair entries in different handwriting. The last entry is Hank\'s.',
            'Maintenance log. Pages yellowed and water-warped. "Replaced gasket, section 14. Third time this quarter." — 2004.',
            'The maintenance log. Every pipe joint, every valve replacement, every midnight emergency — all documented. This place has a history.',
          ];
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Emergency Shutoff',
        col1: 22, col2: 23, row1: 11, row2: 12,
        icon: '\u{1f6d1}',
        action: (s) => {
          const noteCount = s.hanksNotes?.length ?? 0;
          if (noteCount >= 6) return 'A red valve handle behind a cage. Hank\'s notes mention it — Elena designed this as the ultimate failsafe. "Break glass only if everything else fails."';
          if (noteCount >= 3) return 'A red valve handle behind a wire cage. The label reads "EMERGENCY SHUTOFF — AUTH. REQUIRED." Someone important put this here.';
          return 'A red valve handle behind a wire cage. Locked. The paint is chipped but the mechanism looks solid. Whatever this controls, it was built to last.';
        },
      },
      {
        name: 'Hank\'s Corner',
        col1: 26, col2: 28, row1: 11, row2: 14,
        icon: '\u{1f4d3}',
        action: (s) => {
          const noteCount = s.hanksNotes?.length ?? 0;
          if (noteCount >= 8) return 'You\'ve pieced together everything Hank left behind. His legacy lives in these pipes and valves.';
          if (noteCount >= 6) return 'Hank\'s handwriting gets frantic in his later notes. He was racing against time.';
          if (noteCount >= 3) return 'The more you read, the clearer the picture. Hank knew something was wrong with the old systems.';
          if (noteCount >= 1) return 'Hank\'s workspace. His notes show he was meticulous. Almost obsessive.';
          return 'Someone spent a lot of time here... Coffee rings on the workbench. A faded photo.';
        },
      },
      {
        name: 'Deep Foundation',
        col1: 0, col2: 29, row1: 15, row2: 17,
        icon: '\u{1f9f1}',
        description: 'Deep foundation. Water table visible through cracks in the slab.',
      },
      {
        name: 'Sump Area',
        col1: 0, col2: 29, row1: 18, row2: 19,
        icon: '\u{1f30a}',
        action: (s) => {
          if (s.domainHealth.drainage < 20) return 'Sump pit. Water is at the overflow line. If this goes, we\'re looking at another Browntide.';
          if (s.domainHealth.drainage < 30) return 'Sump pit. Water level is way too high. Better check the pumps.';
          return 'Sump pit. Groundwater level normal. The pumps are keeping up.';
        },
      },
    ];
  }

  /* ================================================================ */
  /*  LUXURY ZONE                                                      */
  /* ================================================================ */

  _luxuryObjects() {
    return [
      {
        name: 'Hidden Ductwork',
        col1: 0, col2: 29, row1: 2, row2: 2,
        icon: '\u{1f4a8}',
        action: (s) => {
          if (s.domainHealth.hvac < 40) return 'Hidden HVAC ductwork. Not hidden enough — guests can hear it struggling.';
          return 'Hidden HVAC ductwork. Premium climate control for premium prices.';
        },
      },
      {
        name: 'Window View',
        col1: 10, col2: 19, row1: 4, row2: 7,
        icon: '\u{1f3df}',
        action: (s) => {
          if (s.reputation > 80) return 'View of the field. You can see scouts in the stands. The big leagues are watching.';
          if (s.reputation > 60) return 'View of the field. Best seats in the house. Maggie\'s private box.';
          return 'View of the field. Great angle, but the suites need work to justify the ticket price.';
        },
      },
      {
        name: 'Suite Left',
        col1: 1, col2: 8, row1: 4, row2: 11,
        icon: '\u2b50',
        action: (s) => {
          const hvac = Math.floor(s.domainHealth.hvac);
          if (s.purchasedExpansions?.length > 0) return 'The expanded luxury wing gleams with new fixtures. Money well spent.';
          if (hvac > 85) return 'VIP suite. A guest just posted a 5-star review while still in the seat. Incredible.';
          if (hvac > 70) return 'VIP suite. Leather seats, perfect temperature. The good life.';
          if (hvac > 50) return `VIP suite. HVAC at ${hvac}%. Guests loosening their collars.`;
          return `VIP suite. Guests complaining about the climate — HVAC at ${hvac}%.`;
        },
      },
      {
        name: 'Maggie\'s Box',
        col1: 10, col2: 19, row1: 8, row2: 11,
        icon: '\u{1f451}',
        action: (s) => {
          const msgs = [
            'Maggie\'s private box. She watches every game from here. Every. Single. One.',
            'The owner\'s suite. Maggie\'s reading glasses are on the counter next to a stack of financial reports.',
          ];
          if (s.money < 3000) msgs.push('Maggie\'s box. You spot a loan application on her desk. Things are tight.');
          if (s.reputation > 70) msgs.push('Maggie\'s box. A framed letter from the league hangs on the wall: "Commendation for Excellence."');
          if (s.npcRelationships?.maggie > 50) msgs.push('Maggie\'s financial projections are posted on the wall. She\'s circled next season\'s numbers in green.');
          if (s.rivalRep && s.reputation > s.rivalRep) {
            msgs.push('Maggie\'s box. She left a newspaper clipping about beating Glendale on the desk. She circled it three times.');
          }
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Suite Right',
        col1: 21, col2: 28, row1: 4, row2: 11,
        icon: '\u2b50',
        action: (s) => {
          const msgs = [];
          if (s.activeEvent) {
            msgs.push('Corporate suite. Sponsors watching the game closely tonight.');
          } else {
            msgs.push('Corporate suite. Empty between events. Smells like leather and ambition.');
          }
          msgs.push('Corporate suite. The mini-fridge is stocked. Someone left a half-eaten shrimp ring. Classy.');
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Trophy Case',
        col1: 9, col2: 11, row1: 12, row2: 13,
        icon: '\u{1f3c6}',
        action: (s) => {
          const rep = s.reputation;
          if (rep >= 86) return 'Trophy case. Starting to fill up. The championship trophy has a spot reserved.';
          if (rep >= 56) return 'Trophy case. A couple of regional awards. Room for more.';
          return 'Trophy case. Mostly empty. A "Participation" plaque and a dusty baseball signed by the \'98 team.';
        },
      },
      {
        name: 'VIP Bar (Left)',
        col1: 2, col2: 5, row1: 12, row2: 13,
        icon: '\u{1f37a}',
        action: (s) => {
          if (s.reputation > 80) return 'VIP bar. The bartender knows everyone\'s name. Premium service for premium clients.';
          if (s.reputation > 70) return 'VIP bar. Premium spirits flowing. Top-shelf for the top dollar.';
          return 'VIP bar. Mostly domestic beer tonight. The good stuff is locked up.';
        },
      },
      {
        name: 'VIP Bar (Right)',
        col1: 23, col2: 26, row1: 12, row2: 13,
        icon: '\u{1f37a}',
        action: (s) => {
          return s.money > 10000
            ? 'Service bar. Fully stocked — the budget allows for the fancy garnishes.'
            : 'Service bar. Running low on mixers. Budget season.';
        },
      },
      {
        name: 'Leather Seats',
        col1: 1, col2: 28, row1: 14, row2: 14,
        icon: '\u{1f4ba}',
        action: (s) => {
          if (s.domainHealth.hvac > 85) return 'Leather seats. Perfectly conditioned. A VIP just fell asleep. Peak comfort.';
          if (s.domainHealth.hvac > 70) return 'Genuine leather seats. Perfect temperature. This is why people pay extra.';
          return 'Leather seats. Sticky in this heat. The AC needs attention.';
        },
      },
      {
        name: 'Suite Floor',
        col1: 0, col2: 29, row1: 15, row2: 16,
        icon: '\u{1f9f1}',
        description: 'Carpeted suite floor. Thick enough to muffle the crowd noise below.',
      },
    ];
  }

  /* ================================================================ */
  /*  PRESSBOX ZONE                                                    */
  /* ================================================================ */

  _pressboxObjects() {
    return [
      {
        name: 'Press Box Window',
        col1: 5, col2: 24, row1: 3, row2: 6,
        icon: '\u{1f3df}',
        action: (s) => {
          const msgs = [];
          if (s.activeEvent) {
            msgs.push('Window overlooking the field. Cameras rolling — it\'s a big game tonight.');
          } else {
            msgs.push('Window overlooking the field. Perfect vantage point for the whole diamond.');
          }
          if (s.reputation > 70) {
            msgs.push('Window view. From up here you can see how far the stadium has come. Not bad, Pipes.');
          }
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Media Room',
        col1: 1, col2: 4, row1: 7, row2: 9,
        icon: '\u{1f4f0}',
        action: (s) => {
          if (s.npcRelationships?.priya > 40) return 'Media room. Priya\'s corner. She keeps a framed copy of her first positive Ridgemont article.';
          if (s.npcRelationships?.priya > 20) return 'Media room. Priya left her notes on the desk — she\'s been thorough.';
          return 'Media room. Local reporters\' workspace. Coffee-stained and cluttered.';
        },
      },
      {
        name: 'Camera Position',
        col1: 25, col2: 28, row1: 7, row2: 9,
        icon: '\u{1f3a5}',
        action: (s) => {
          const msgs = [
            'TV camera position. The Browntide went viral from this angle.',
            'Camera rig. The lens cap is on. Someone wrote "NOT AGAIN" on it in tape.',
          ];
          if (s.reputation > 70) {
            msgs.push('Camera position. National networks have started requesting press passes. The big time.');
          }
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Wall of Headlines',
        col1: 1, col2: 4, row1: 3, row2: 4,
        icon: '\u{1f4f0}',
        action: (s) => {
          const headlines = s.mediaHeadlines ?? [];
          if (headlines.length === 0) return 'Wall of newspaper clippings. Empty so far. Every story starts somewhere.';
          const positive = headlines.filter(h => h.sentiment === 'positive').length;
          const negative = headlines.filter(h => h.sentiment === 'negative').length;
          if (positive > negative * 2) return 'Wall of clippings. Mostly good press! Priya is building a nice collection.';
          if (negative > positive) return 'Wall of clippings. A lot of red ink... the bad headlines are winning right now.';
          return 'Wall of newspaper clippings. A mixed bag of coverage. The story of Ridgemont, in print.';
        },
      },
      {
        name: 'Equipment Rack A',
        col1: 1, col2: 5, row1: 10, row2: 11,
        icon: '\u{1f5a5}',
        action: (s) => {
          const msgs = [
            'Stats monitors. Showing real-time stadium metrics and game data.',
            'Monitors. You can see the attendance numbers updating in real-time. Fascinating and terrifying.',
          ];
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Audio Mixing Board',
        col1: 8, col2: 12, row1: 10, row2: 11,
        icon: '\u{1f39b}',
        action: () => {
          const msgs = [
            'Audio mixing board. Stadium PA system controls. "Testing, 1-2-3."',
            'PA controls. The organist\'s playlist is taped to the board: "Charge, Take Me Out, Sweet Caroline, repeat."',
            'Audio board. Someone keeps requesting "Baby Shark." The sound tech has a veto list now.',
          ];
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Server Rack',
        col1: 22, col2: 26, row1: 10, row2: 11,
        icon: '\u{1f5a5}',
        action: (s) => {
          if (s.domainHealth.hvac < 50) return 'Network servers. Running hot — if the AC fails up here, the servers go next.';
          return 'Network servers. Blinking lights mean everything is... probably fine.';
        },
      },
      {
        name: 'Scoreboard Controls',
        col1: 15, col2: 19, row1: 10, row2: 11,
        icon: '\u{1f4ca}',
        action: (s) => {
          const msgs = [
            `Scoreboard controls. Game ${s.gameDay} data loaded. The old software crashes sometimes.`,
            'Scoreboard controls. A Post-it note: "DO NOT run the fireworks animation and stats at the same time."',
          ];
          return msgs[Math.floor(Math.random() * msgs.length)];
        },
      },
      {
        name: 'Broadcast Desk',
        col1: 2, col2: 5, row1: 13, row2: 14,
        icon: '\u{1f399}',
        action: (s) => {
          if (s.npcRelationships?.priya > 40) return 'Broadcast desk. Priya\'s doing a feature on Ridgemont\'s turnaround story. She says it\'ll win an award.';
          if (s.npcRelationships?.priya > 30) return 'Broadcast desk. Priya\'s workspace. She has a "wall of shame" for every Browntide mention.';
          return 'Broadcast desk. Local sports radio setup. The mic is always hot.';
        },
      },
      {
        name: 'ON AIR Sign',
        col1: 6, col2: 7, row1: 13, row2: 13,
        icon: '\u{1f534}',
        action: (s) => {
          return s.activeEvent
            ? 'ON AIR sign. Lit up red. Currently broadcasting.'
            : 'ON AIR sign. Dark. No live feed right now.';
        },
      },
      {
        name: 'Rivalry Board',
        col1: 20, col2: 24, row1: 13, row2: 14,
        icon: '\u{1f4ca}',
        action: (s) => {
          const rivalRep = s.rivalRep ?? 60;
          const playerRep = s.reputation;
          const diff = playerRep - rivalRep;
          if (diff > 15) return `Rivalry tracker: Ridgemont ${Math.floor(playerRep)} - Glendale ${Math.floor(rivalRep)}. You're crushing Victor. He knows it.`;
          if (diff > 0) return `Rivalry tracker: Ridgemont ${Math.floor(playerRep)} - Glendale ${Math.floor(rivalRep)}. Slight edge. Don't get comfortable.`;
          if (diff > -10) return `Rivalry tracker: Ridgemont ${Math.floor(playerRep)} - Glendale ${Math.floor(rivalRep)}. Neck and neck. Every game matters.`;
          return `Rivalry tracker: Ridgemont ${Math.floor(playerRep)} - Glendale ${Math.floor(rivalRep)}. Victor's ahead. Maggie circled this board in red marker.`;
        },
      },
      {
        name: 'Press Room Floor',
        col1: 0, col2: 29, row1: 16, row2: 17,
        icon: '\u{1f9f1}',
        description: 'Raised floor with cable trays underneath. Trip hazard central.',
      },
    ];
  }
}
