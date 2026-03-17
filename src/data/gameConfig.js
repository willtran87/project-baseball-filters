/**
 * Game configuration and balance data.
 *
 * Central place to tune all game parameters.
 * Adjusting values here changes game feel without touching systems code.
 *
 * All costs in dollars. All durations in real seconds unless noted.
 * Values aligned with the Game Design Document (docs/GAME_DESIGN_DOCUMENT.md).
 */

export const GAME_CONFIG = {
  // ── Story ─────────────────────────────────────────────────────────────
  storyEnabled: true,

  // ── Starting State ──────────────────────────────────────────────────
  // BALANCE: $5,000 lets the player buy 3-4 T1 filters across different domains
  // on day 1, with enough left over for a repair or two. It feels tight but not
  // impossible — the tutorial guides them to prioritize one domain first.
  startingMoney: 5000,
  startingReputation: 35, // begin in Minor League tier (21-40)
  startingStaff: 1,
  startingSeason: 1,

  // ── Time ────────────────────────────────────────────────────────────
  inningDurationSec: 30, // real seconds per in-game inning
  inningsPerGame: 9,
  gamesPerSeason: 80,
  offSeasonDays: 20, // planning days between seasons

  // ── Difficulty Modifiers ────────────────────────────────────────────
  // BALANCE: Each difficulty should feel distinctly different. Rookie is forgiving
  // and educational. Veteran is the intended experience. All-Star punishes mistakes.
  // Hall of Fame is a survival challenge. incomeMultiplier and expenseMultiplier
  // give us economic levers beyond just degradation speed.
  difficulty: {
    rookie: {
      degradeRate: 0.6,          // filters last 67% longer
      repairCostMultiplier: 0.7, // repairs are cheap
      inspectionLeniency: 1.3,   // easier to pass inspections
      weatherForecastAccuracy: 1.0, // perfect forecasts
      eventChainChance: 0.05,    // almost no event chaining
      incomeMultiplier: 1.25,    // 25% more income — breathing room for learning
      expenseMultiplier: 0.8,    // 20% cheaper operating costs
    },
    veteran: {
      degradeRate: 1.0,          // baseline degradation
      repairCostMultiplier: 1.0, // baseline repair costs
      inspectionLeniency: 1.0,   // fair inspections
      weatherForecastAccuracy: 0.75,
      eventChainChance: 0.15,
      incomeMultiplier: 1.0,     // baseline income
      expenseMultiplier: 1.0,    // baseline expenses
    },
    allStar: {
      degradeRate: 1.4,          // filters degrade 40% faster
      repairCostMultiplier: 1.3, // repairs cost 30% more
      inspectionLeniency: 0.7,   // stricter inspections
      weatherForecastAccuracy: 0.6,
      eventChainChance: 0.25,
      incomeMultiplier: 0.85,    // 15% less income — tighter margins
      expenseMultiplier: 1.2,    // 20% more expensive to operate
    },
    hallOfFame: {
      degradeRate: 1.8,          // filters degrade 80% faster — constant maintenance
      repairCostMultiplier: 1.6, // repairs cost 60% more
      inspectionLeniency: 0.5,   // brutal inspections
      weatherForecastAccuracy: 0.5,
      eventChainChance: 0.35,    // frequent event chains
      incomeMultiplier: 0.7,     // 30% less income — every dollar counts
      expenseMultiplier: 1.4,    // 40% more expensive — real survival mode
    },
  },

  // ── Economy ─────────────────────────────────────────────────────────
  economy: {
    // Income sources (per game day, scaled by attendance & modifiers)
    // NOTE: These values represent the stadium's CUT of revenue, not face value.
    // Most revenue goes to the league, team, vendors, etc.
    //
    // BALANCE RATIONALE: Target early-game income ~$2,000-3,000/day (weekday) so
    // that buying a single T1 filter ($300-$800) feels like a real decision.
    // Mid-game income ~$4,000-6,000/day before sponsors; late-game ~$8,000-15,000/day
    // with expansions and sponsors. This creates a progression arc where the player
    // starts scrappy and grows into abundance.
    ticketBasePrice: 1.5, // dollars per fan (stadium operations cut — reduced from 2 to tighten early economy)
    concessionPerFan: 0.75, // average concession operations cut per fan (reduced from 1)
    concessionSatisfactionWeight: 0.6, // how much satisfaction affects concession revenue (raised: quality matters more)

    // Sponsorship contract reference tiers (actual contracts managed by ContractPanel)
    // BALANCE: Sponsors are the primary mid/late income scaler. Values tuned so
    // each tier feels like a meaningful jump and motivates reaching the next rep tier.
    sponsorTiers: [
      { name: 'Local Business', reputationRequired: 30, payPerGame: 300 },
      { name: 'Regional Brand', reputationRequired: 50, payPerGame: 800 },
      { name: 'National Brand', reputationRequired: 70, payPerGame: 2000 },
      { name: 'Premium Partner', reputationRequired: 85, payPerGame: 5000 },
    ],

    // Health inspection bonuses
    // BALANCE: Inspection rewards/fines are tuned to feel significant but not
    // game-ending. An A bonus covers roughly 1 T1 filter replacement; an F fine
    // hurts but doesn't bankrupt a prepared player.
    inspectionBonus: { A: 3000, B: 1000, C: 0 },
    inspectionFine: { D: -2000, F: -5000 },

    // Expenses
    // BALANCE: Operating costs should consume 40-60% of gross income at baseline
    // so the player must actively manage efficiency and make tradeoffs.
    // With 5K starting capacity: ~$5K gross/day (weekday). Base energy ($800) +
    // staff ($150) = ~$950 before filters = ~19% of gross. As filters are added,
    // expenses grow to $1,500-2,500/day early game, $3,000-5,000 mid-late game.
    // This creates a meaningful profit margin that rewards efficient management.
    staffWagePerDay: 150, // per staff member per game day (raised from 100)
    energyCostBase: 800, // base daily energy cost (stadium lighting, water pumps, baseline HVAC)
    emergencyRepairMultiplier: 2.5, // emergency repairs cost this x normal

    // Loans
    // BALANCE: Loans are the "break glass in emergency" recovery mechanic. The
    // amounts are enough to buy 1-2 replacement filters but not enough to
    // solve all problems. Escalating interest creates a real cost for using them.
    // Repayment at 10%/day = 10 days to repay, giving players time to recover.
    maxLoans: 3,
    loanAmount: 5000,
    loanInterestRates: [0.05, 0.10, 0.18], // escalating interest per loan
    loanRepaymentRate: 0.10, // fraction of principal repaid per game day (10% = 10 days to repay)

    // Season review
    // BALANCE: minSeasonProfit set so that a player running break-even (low
    // reputation, minimal filters) will fail the check, but anyone with steady
    // income and reasonable maintenance passes. ~80 games * ~$1500 net/day = $120K
    // season, so $30K threshold requires roughly 25% profit margin.
    minSeasonProfit: 30000, // owner expects at least this much profit per season (raised from 10K)
    consecutiveBadSeasonsToLose: 2,
  },

  // ── Stadium Capacity ────────────────────────────────────────────────
  // BALANCE: Starting capacity of 5,000 reflects a small minor league park.
  // At $2.25/fan total revenue, weekday income ~$5,000-6,000 — enough to cover
  // operating costs ($800 energy + $150 staff + filters) with a modest profit.
  // Expansions add meaningful capacity jumps that feel rewarding and scale income.
  // Full buildout reaches ~20,000 (a real Major League park).
  stadium: {
    baseCapacity: 5000,
    expansionCapacity: {
      luxuryBoxWing: 1000, // high-value seats (raised from 500 — meaningful jump)
      pressBox: 200,       // press box adds some capacity (raised from 50)
      secondDeck: 8000,    // major capacity jump
      championshipPavilion: 5000, // final expansion brings total to ~19,200
    },
  },

  // ── Staff (legacy simple) ───────────────────────────────────────────
  staff: {
    maxStaff: 8,
    hireCost: 1000,
    repairSpeedPerStaff: 1.0, // multiplier; 2 staff = 2x repair speed
  },

  // ── Staff RPG Config ──────────────────────────────────────────────────
  staffConfig: {
    hireCosts: { general: 1000, airTech: 1500, plumber: 1500, electrician: 1500 },
    wageRange: { min: 100, max: 400 }, // per game day
    levelXpThresholds: [0, 50, 150, 300, 500, 750], // XP to reach each level (0-5)
    specializationBonuses: {
      airTech: { domain: 'air', speedMultiplier: 1.5, earlyWarningChance: 0.15 },
      plumber: { domain: 'water', speedMultiplier: 1.5, earlyWarningChance: 0.15 },
      electrician: { domain: 'hvac', speedMultiplier: 1.5, earlyWarningChance: 0.15 },
      general: { domain: null, speedMultiplier: 1.0, earlyWarningChance: 0.05 },
    },
    maxStaffRPG: 12,
  },

  // ── Research / Tech Tree Config ───────────────────────────────────────
  researchConfig: {
    labUnlockTier: 3, // Double-A (rep 56+)
    baseResearchSpeed: 1.0, // multiplied by staff skill
    tracks: {
      efficiency: { name: 'Efficiency', description: 'Reduce energy costs, improve filter lifespan' },
      detection: { name: 'Detection', description: 'Earlier warnings, better sensors, predictive maintenance' },
      experimental: { name: 'Experimental', description: 'High-risk/high-reward tech (UV-C, ionization, AI BMS)' },
    },
  },

  // ── Filtration Systems ──────────────────────────────────────────────
  // Organized by the 4 domains. Each domain has component categories,
  // each with 4 upgrade tiers.
  //
  // BALANCE RATIONALE — Filter cost/value design:
  // T1: Cheap, short-lived. Costs ~$300-$2,000, lasts 10-40 games. The "duct tape"
  //     solution. Player can afford these in the first few days. Frequent
  //     replacement creates active management without high stakes.
  // T2: Mid-range. Costs ~$1,200-$8,000, lasts 25-80 games. Unlocked at Single-A
  //     (rep 41). A real investment — 2-5 game days of income each.
  // T3: Premium. Costs ~$5,000-$20,000, lasts 50-150 games. Unlocked at Double-A
  //     (rep 56). Requires saving up. Lower energy = better efficiency.
  // T4: Endgame. Costs ~$12,000-$50,000, lasts 80-250 games. Unlocked at Triple-A
  //     (rep 71). Major investment that reduces long-term operating costs.

  filtrationSystems: {
    air: {
      name: 'Air Quality',
      color: '#cccccc', // white/gray overlay
      metricName: 'AQI',
      warningThreshold: 60,
      criticalThreshold: 30,
      components: {
        hepaFilter: {
          name: 'HEPA Filter',
          tiers: [
            { tier: 1, name: 'Basic Fiber Filter', brand: 'FilterRite', description: 'The duct tape of air filtration. Cheap, cheerful, and better than nothing.', cost: 500, energyPerDay: 25, lifespanGames: 8, qualityBonus: 10, domainHealthBonus: 5, sprite: 'filter_air_t1' },
            { tier: 2, name: 'Pleated HEPA', brand: 'CleanSweep', description: 'Folds more pleats than a Scottish kilt. Catches what the cheap stuff misses.', cost: 2000, energyPerDay: 45, lifespanGames: 18, qualityBonus: 25, domainHealthBonus: 8, sprite: 'filter_air_t2' },
            { tier: 3, name: 'Electrostatic Filter', brand: 'StaticShock', description: 'Uses science to zap particles into submission. Fans love the fresh air.', cost: 8000, energyPerDay: 70, lifespanGames: 35, qualityBonus: 40, domainHealthBonus: 12, sprite: 'filter_air_t3' },
            { tier: 4, name: 'Smart HEPA Array', brand: 'AirAce', description: 'AI-guided filtration so advanced, it could call balls and strikes.', cost: 25000, energyPerDay: 55, lifespanGames: 55, qualityBonus: 55, domainHealthBonus: 15, sprite: 'filter_air_t4' },
          ],
        },
        ventFan: {
          name: 'Ventilation Fan',
          tiers: [
            { tier: 1, name: 'Basic Axial Fan', brand: 'BreezeRookie', description: 'Spins like a reliever warming up. Gets air moving on a budget.', cost: 300, energyPerDay: 8, lifespanGames: 20, qualityBonus: 8, domainHealthBonus: 0, sprite: 'fan_t1' },
            { tier: 2, name: 'Centrifugal Fan', brand: 'WhirlWind', description: 'Throws air harder than a center fielder nailing home plate.', cost: 1200, energyPerDay: 15, lifespanGames: 40, qualityBonus: 18, domainHealthBonus: 1, sprite: 'fan_t2' },
            { tier: 3, name: 'EC Motor Fan', brand: 'SilentStarter', description: 'Whisper-quiet efficiency. You\'ll forget it\'s there until you need it.', cost: 5000, energyPerDay: 12, lifespanGames: 75, qualityBonus: 30, domainHealthBonus: 1, sprite: 'fan_t3' },
            { tier: 4, name: 'Variable-Speed EC Fan', brand: 'VeloCity', description: 'Adjusts airflow like a pitcher changing speeds. Total command.', cost: 15000, energyPerDay: 10, lifespanGames: 120, qualityBonus: 42, domainHealthBonus: 2, sprite: 'fan_t4' },
          ],
        },
        airScrubber: {
          name: 'Air Scrubber',
          tiers: [
            { tier: 1, name: 'Activated Carbon', brand: 'CharcoalChamp', description: 'Absorbs odors like a bullpen catcher absorbs wild pitches.', cost: 1000, energyPerDay: 15, lifespanGames: 12, qualityBonus: 10, domainHealthBonus: 3, passive: 'weatherShield', sprite: 'scrubber_t1' },
            { tier: 2, name: 'Carbon + HEPA Combo', brand: 'DualThreat', description: 'A solid double-play combo. Handles particles AND smells.', cost: 4000, energyPerDay: 25, lifespanGames: 28, qualityBonus: 22, domainHealthBonus: 5, passive: 'weatherShield', sprite: 'scrubber_t2' },
            { tier: 3, name: 'Plasma Ionizer', brand: 'IonKing', description: 'Ionizes the air so hard, hot dogs taste better. Probably.', cost: 12000, energyPerDay: 40, lifespanGames: 55, qualityBonus: 36, domainHealthBonus: 7, passive: 'weatherShield', sprite: 'scrubber_t3' },
            { tier: 4, name: 'Photocatalytic Oxidation', brand: 'SolarFlare', description: 'Breaks down pollutants at the molecular level. Hall of Fame filtration.', cost: 30000, energyPerDay: 30, lifespanGames: 90, qualityBonus: 50, domainHealthBonus: 8, passive: 'weatherShield', sprite: 'scrubber_t4' },
          ],
        },
      },
    },

    water: {
      name: 'Water Filtration',
      color: '#4488ff', // blue overlay
      metricName: 'Purity',
      warningThreshold: 70,
      criticalThreshold: 40,
      components: {
        waterFilter: {
          name: 'Water Filter',
          tiers: [
            { tier: 1, name: 'Sediment Screens', brand: 'SiftStarter', description: 'Catches the big stuff. Think of it as your infield defense.', cost: 400, energyPerDay: 20, lifespanGames: 10, qualityBonus: 10, domainHealthBonus: 5, sprite: 'water_filter_t1' },
            { tier: 2, name: 'Carbon Block Filter', brand: 'AquaPure', description: 'Carbon filtration so reliable, it\'s your everyday lineup water filter.', cost: 1800, energyPerDay: 35, lifespanGames: 20, qualityBonus: 25, domainHealthBonus: 8, sprite: 'water_filter_t2' },
            { tier: 3, name: 'UV Purification', brand: 'UltraViolet', description: 'Blasts bacteria with UV light. Like a pitcher throwing pure heat.', cost: 10000, energyPerDay: 60, lifespanGames: 40, qualityBonus: 40, domainHealthBonus: 12, sprite: 'water_filter_t3' },
            { tier: 4, name: 'Reverse Osmosis Array', brand: 'OsmoPro Elite', description: 'Purifies water down to the molecule. The complete-game shutout of filters.', cost: 35000, energyPerDay: 50, lifespanGames: 65, qualityBonus: 55, domainHealthBonus: 15, sprite: 'water_filter_t4' },
          ],
        },
        plumbing: {
          name: 'Plumbing',
          tiers: [
            { tier: 1, name: 'Galvanized Steel', brand: 'IronHorse', description: 'Tough old-school pipes. They\'ll rust eventually, but they show up every day.', cost: 2000, energyPerDay: 0, lifespanGames: 40, qualityBonus: 5, domainHealthBonus: 0, sprite: 'plumbing_t1' },
            { tier: 2, name: 'Copper Piping', brand: 'CopperClassic', description: 'The gold glove of plumbing. Reliable, time-tested, and looks great doing it.', cost: 8000, energyPerDay: 0, lifespanGames: 80, qualityBonus: 12, domainHealthBonus: 1, sprite: 'plumbing_t2' },
            { tier: 3, name: 'PEX Piping', brand: 'FlexLine', description: 'Bends without breaking. Handles pressure like a veteran closer.', cost: 20000, energyPerDay: 5, lifespanGames: 150, qualityBonus: 20, domainHealthBonus: 1, sprite: 'plumbing_t3' },
            { tier: 4, name: 'PEX Smart-Piping', brand: 'HydroMind', description: 'Self-monitoring pipes that report leaks before they happen. Front office analytics for your plumbing.', cost: 40000, energyPerDay: 10, lifespanGames: 250, qualityBonus: 30, domainHealthBonus: 2, sprite: 'plumbing_t4' },
          ],
        },
        coolingSystem: {
          name: 'Cooling System',
          tiers: [
            { tier: 1, name: 'Basic Evaporative', brand: 'MistRunner', description: 'Sprays a fine mist and hopes for the best. Hey, it\'s cool-ish.', cost: 1500, energyPerDay: 20, lifespanGames: 20, qualityBonus: 8, domainHealthBonus: 3, passive: 'crossDomain', sprite: 'cooling_t1' },
            { tier: 2, name: 'Chilled Water Loop', brand: 'ChillZone', description: 'Circulates cold water like a well-run double play. Smooth and efficient.', cost: 6000, energyPerDay: 35, lifespanGames: 45, qualityBonus: 18, domainHealthBonus: 5, passive: 'crossDomain', sprite: 'cooling_t2' },
            { tier: 3, name: 'Hybrid Cooling', brand: 'DualChill', description: 'Switches between cooling modes like a utility player switches positions.', cost: 14000, energyPerDay: 30, lifespanGames: 70, qualityBonus: 28, domainHealthBonus: 7, passive: 'crossDomain', sprite: 'cooling_t3' },
            { tier: 4, name: 'Closed-Loop Glycol', brand: 'ArcticCircuit', description: 'Sealed glycol system that never loses its cool. Clutch in the summer heat.', cost: 20000, energyPerDay: 25, lifespanGames: 120, qualityBonus: 38, domainHealthBonus: 8, passive: 'crossDomain', sprite: 'cooling_t4' },
          ],
        },
      },
    },

    hvac: {
      name: 'HVAC',
      color: '#ff8844', // orange overlay
      metricName: 'Comfort',
      warningThreshold: 60,
      criticalThreshold: 35,
      components: {
        hvacUnit: {
          name: 'HVAC Unit',
          tiers: [
            { tier: 1, name: 'Window Units', brand: 'BenchWarmer', description: 'Rattles louder than a stadium organ. But hey, cold air is cold air.', cost: 800, energyPerDay: 35, lifespanGames: 10, efficiency: 0.60, comfortBonus: 10, domainHealthBonus: 5, sprite: 'hvac_t1' },
            { tier: 2, name: 'Split System', brand: 'SplitDecision', description: 'Half inside, half outside. Gets the job done like a reliable middle reliever.', cost: 5000, energyPerDay: 65, lifespanGames: 25, efficiency: 0.75, comfortBonus: 25, domainHealthBonus: 8, sprite: 'hvac_t2' },
            { tier: 3, name: 'VRF System', brand: 'ZoneMaster', description: 'Variable refrigerant flow — controls temperature zone by zone like a pitching coach manages a staff.', cost: 20000, energyPerDay: 55, lifespanGames: 50, efficiency: 0.90, comfortBonus: 40, domainHealthBonus: 12, sprite: 'hvac_t3' },
            { tier: 4, name: 'Geothermal Exchange', brand: 'DeepHeat', description: 'Taps the earth itself for heating and cooling. A generational franchise player.', cost: 50000, energyPerDay: 35, lifespanGames: 100, efficiency: 0.98, comfortBonus: 55, domainHealthBonus: 15, sprite: 'hvac_t4' },
          ],
        },
        climateController: {
          name: 'Climate Zone Controller',
          tiers: [
            { tier: 1, name: 'Manual Thermostat', brand: 'OldSchool', description: 'Turn the dial and pray. Like managing by gut feeling.', cost: 200, energyPerDay: 0, lifespanGames: 50, comfortBonus: 3, domainHealthBonus: 0, sprite: 'climate_t1' },
            { tier: 2, name: 'Programmable Thermostat', brand: 'ClockWork', description: 'Set it and forget it. Your bullpen schedule for temperature.', cost: 1500, energyPerDay: 5, lifespanGames: 80, comfortBonus: 8, domainHealthBonus: 1, sprite: 'climate_t2' },
            { tier: 3, name: 'Smart Zone Controller', brand: 'TempIQ', description: 'Per-zone climate intelligence. Knows what the luxury boxes need before they complain.', cost: 6000, energyPerDay: 10, lifespanGames: 120, comfortBonus: 15, domainHealthBonus: 1, sprite: 'climate_t3' },
            { tier: 4, name: 'Predictive Zone Management', brand: 'WeatherWiz', description: 'Predicts comfort needs using weather data and attendance. Sabermetrics for HVAC.', cost: 12000, energyPerDay: 8, lifespanGames: 200, comfortBonus: 22, domainHealthBonus: 2, sprite: 'climate_t4' },
          ],
        },
        ductwork: {
          name: 'Ductwork',
          tiers: [
            { tier: 1, name: 'Basic Flex Duct', brand: 'FlexRookie', description: 'Bendy tubes that get air where it needs to go. The rookie utility player of HVAC.', cost: 400, energyPerDay: 5, lifespanGames: 25, comfortBonus: 5, domainHealthBonus: 3, passive: 'maintenanceSaver', sprite: 'duct_t1' },
            { tier: 2, name: 'Rigid Metal Duct', brand: 'SteelBreeze', description: 'Straight-shooting metal ducts. Reliable airflow like a consistent batting average.', cost: 2500, energyPerDay: 8, lifespanGames: 50, comfortBonus: 10, domainHealthBonus: 5, passive: 'maintenanceSaver', sprite: 'duct_t2' },
            { tier: 3, name: 'Insulated Duct System', brand: 'ThermaSeal', description: 'Wrapped tight to keep every degree where it belongs. No energy left on base.', cost: 9000, energyPerDay: 12, lifespanGames: 90, comfortBonus: 18, domainHealthBonus: 7, passive: 'maintenanceSaver', sprite: 'duct_t3' },
            { tier: 4, name: 'Smart Duct Network', brand: 'FlowMind', description: 'Self-adjusting dampers route air like a manager calling plays. Peak efficiency.', cost: 18000, energyPerDay: 10, lifespanGames: 160, comfortBonus: 25, domainHealthBonus: 8, passive: 'maintenanceSaver', sprite: 'duct_t4' },
          ],
        },
      },
      // Climate zone targets (degrees F)
      climateZones: {
        luxuryBoxes: { min: 68, max: 72, priority: 'highest' },
        pressBox: { min: 68, max: 74, priority: 'high' },
        generalConcourse: { min: 65, max: 78, priority: 'medium' },
        generalSeating: { min: null, max: null, priority: 'low' }, // best effort
      },
    },

    drainage: {
      name: 'Drainage',
      color: '#44bb44', // green overlay
      metricName: 'Capacity',
      warningThreshold: 65,
      criticalThreshold: 30,
      components: {
        drainSystem: {
          name: 'Drain System',
          tiers: [
            { tier: 1, name: 'Basic Gravity Drains', brand: 'FlowRookie', description: 'Water goes down. That\'s the whole pitch. Simple but honest.', cost: 600, energyPerDay: 15, lifespanGames: 14, capacityGPM: 500, integrityBonus: 10, domainHealthBonus: 5, sprite: 'drain_t1' },
            { tier: 2, name: 'Pump-Assisted Drains', brand: 'PumpAction', description: 'When gravity isn\'t enough, pump it out. Like a pinch-hit double.', cost: 3000, energyPerDay: 40, lifespanGames: 28, capacityGPM: 1200, integrityBonus: 25, domainHealthBonus: 8, sprite: 'drain_t2' },
            { tier: 3, name: 'Smart Sump System', brand: 'SmartSump Pro', description: 'Monitors water levels and activates pumps automatically. Your closer for drainage.', cost: 15000, energyPerDay: 50, lifespanGames: 50, capacityGPM: 2500, integrityBonus: 40, domainHealthBonus: 12, sprite: 'drain_t3' },
            { tier: 4, name: 'Integrated Stormwater Mgmt', brand: 'StormShield', description: 'Handles biblical downpours without breaking a sweat. Legendary rain delay prevention.', cost: 45000, energyPerDay: 45, lifespanGames: 80, capacityGPM: 5000, integrityBonus: 55, domainHealthBonus: 15, sprite: 'drain_t4' },
          ],
        },
        fieldDrainage: {
          name: 'Field Drainage',
          tiers: [
            { tier: 1, name: 'Basic French Drains', brand: 'DirtDog', description: 'Simple trenches filled with gravel. The workhorse of field drainage.', cost: 2000, energyPerDay: 0, lifespanGames: 30, capacityGPM: 300, integrityBonus: 8, domainHealthBonus: 0, sprite: 'field_drain_t1' },
            { tier: 2, name: 'Gravel Trench System', brand: 'DiamondDrain', description: 'Keeps the diamond dry and playable. No more mudball in the 5th inning.', cost: 7000, energyPerDay: 5, lifespanGames: 60, capacityGPM: 800, integrityBonus: 18, domainHealthBonus: 1, sprite: 'field_drain_t2' },
            { tier: 3, name: 'Perforated Pipe Grid', brand: 'GridIron', description: 'A subsurface pipe network that drinks rainwater like a dugout drinks Gatorade.', cost: 16000, energyPerDay: 15, lifespanGames: 100, capacityGPM: 1500, integrityBonus: 32, domainHealthBonus: 1, sprite: 'field_drain_t3' },
            { tier: 4, name: 'Heated Sub-Surface Grid', brand: 'ThermaField', description: 'Heated pipes melt ice and evaporate puddles. Play ball in any weather.', cost: 30000, energyPerDay: 25, lifespanGames: 180, capacityGPM: 3000, integrityBonus: 48, domainHealthBonus: 2, sprite: 'field_drain_t4' },
          ],
        },
        sewage: {
          name: 'Sewage Processing',
          tiers: [
            { tier: 1, name: 'Basic Septic', brand: 'StinkStop', description: 'Nobody wants to think about sewage, but someone has to. That someone is StinkStop.', cost: 1000, energyPerDay: 10, lifespanGames: 25, capacityGPM: 200, integrityBonus: 5, domainHealthBonus: 3, passive: 'crisisArmor', sprite: 'sewage_t1' },
            { tier: 2, name: 'Pump Station', brand: 'FlushForce', description: 'Pumps waste like a slugger launches dingers. Out of the park, out of mind.', cost: 5000, energyPerDay: 25, lifespanGames: 50, capacityGPM: 600, integrityBonus: 15, domainHealthBonus: 5, passive: 'crisisArmor', sprite: 'sewage_t2' },
            { tier: 3, name: 'Aeration System', brand: 'BubbleUp', description: 'Adds oxygen to break down waste. Science doing the dirty work so you don\'t have to.', cost: 14000, energyPerDay: 35, lifespanGames: 80, capacityGPM: 1200, integrityBonus: 30, domainHealthBonus: 7, passive: 'crisisArmor', sprite: 'sewage_t3' },
            { tier: 4, name: 'Aerobic Treatment', brand: 'BioClean Elite', description: 'Full aerobic treatment that outputs near-clean water. The MVP of waste management.', cost: 25000, energyPerDay: 30, lifespanGames: 140, capacityGPM: 2500, integrityBonus: 45, domainHealthBonus: 8, passive: 'crisisArmor', sprite: 'sewage_t4' },
          ],
        },
      },
    },
  },

  // ── Game Day Types ──────────────────────────────────────────────────
  gameDayTypes: {
    weekdayRegular: { name: 'Weekday Game', attendanceRange: [0.40, 0.60], systemStress: 'low', revenueMultiplier: 1.0 },
    weekendRegular: { name: 'Weekend Game', attendanceRange: [0.60, 0.80], systemStress: 'medium', revenueMultiplier: 1.3 },
    rivalryGame: { name: 'Rivalry Game', attendanceRange: [0.80, 0.95], systemStress: 'high', revenueMultiplier: 1.6 },
    promotionalNight: { name: 'Promotional Night', attendanceRange: [0.70, 0.90], systemStress: 'mediumHigh', revenueMultiplier: 1.5 },
    playoffGame: { name: 'Playoff Game', attendanceRange: [1.0, 1.0], systemStress: 'veryHigh', revenueMultiplier: 2.5 },
    championshipGame: { name: 'Championship Game', attendanceRange: [1.0, 1.0], systemStress: 'maximum', revenueMultiplier: 4.0 },
    openingDay: { name: 'Opening Day', description: 'Season opener! The whole city shows up for the first pitch.', attendanceRange: [0.85, 0.98], stressTier: { degradeMultiplier: 1.4, energyMultiplier: 1.3 }, weight: 0.02, revenueMultiplier: 1.8 },
    fanAppreciationDay: { name: 'Fan Appreciation Day', description: 'Giving back to the fans with giveaways and discounted concessions.', attendanceRange: [0.75, 0.90], stressTier: { degradeMultiplier: 0.9, energyMultiplier: 0.95 }, weight: 0.05, revenueMultiplier: 1.2 },
    scoutNight: { name: 'Scout Night', description: 'Talent scouts from the big leagues are in the stands. Reputation matters more tonight.', attendanceRange: [0.50, 0.65], stressTier: { degradeMultiplier: 1.0, energyMultiplier: 1.0 }, weight: 0.04, reputationMultiplier: 1.5, revenueMultiplier: 1.0 },
  },

  // ── System Stress Levels ────────────────────────────────────────────
  // BALANCE: Stress levels create a risk/reward tradeoff for big game days.
  // Higher attendance = more revenue but also more system stress and energy costs.
  // The energy multipliers are raised so that playoff/championship games require
  // the player to have invested in efficient equipment or face steep operating costs.
  systemStressLevels: {
    low: { degradeMultiplier: 1.0, energyMultiplier: 1.0 },
    medium: { degradeMultiplier: 1.2, energyMultiplier: 1.2 },
    mediumHigh: { degradeMultiplier: 1.4, energyMultiplier: 1.35 },
    high: { degradeMultiplier: 1.6, energyMultiplier: 1.5 },
    veryHigh: { degradeMultiplier: 2.0, energyMultiplier: 1.8 },
    maximum: { degradeMultiplier: 2.5, energyMultiplier: 2.5 },
  },

  // ── Attendance Stress ─────────────────────────────────────────────
  // Higher attendance means more wear on filters and higher energy use.
  // Low attendance gives a slight break; high attendance ramps up stress.
  // These multiply ON TOP of existing game-day-type stress (multiplicative).
  attendanceStress: [
    { maxPercent: 30,  degradeMultiplier: 0.85, energyMultiplier: 0.9  },
    { maxPercent: 50,  degradeMultiplier: 0.95, energyMultiplier: 0.95 },
    { maxPercent: 70,  degradeMultiplier: 1.1,  energyMultiplier: 1.1  },
    { maxPercent: 85,  degradeMultiplier: 1.2,  energyMultiplier: 1.15 },
    { maxPercent: 95,  degradeMultiplier: 1.35, energyMultiplier: 1.3  },
    { maxPercent: 100, degradeMultiplier: 1.5,  energyMultiplier: 1.5  },
  ],

  // ── Weather Events ──────────────────────────────────────────────────
  weatherEvents: [
    {
      name: 'Light Rain',
      description: 'A light rain falls on the stadium. Drainage systems under mild stress.',
      seasons: ['spring', 'fall'],
      probability: 0.18,
      durationHours: [1, 3],
      systemEffects: { drainage: 'medium', fieldDrainage: 'medium' },
      degradeMultiplier: 1.2,
      revenueMultiplier: 0.9,
    },
    {
      name: 'Heavy Rain',
      description: 'Thunderstorm! Drainage pushed to the limit. Electrical systems at risk.',
      seasons: ['spring', 'summer'],
      probability: 0.10,
      durationHours: [2, 6],
      systemEffects: { drainage: 'high', fieldDrainage: 'high', electrical: 'medium' },
      degradeMultiplier: 1.8,
      revenueMultiplier: 0.7,
    },
    {
      name: 'Heatwave',
      description: 'Extreme heat stresses HVAC and water cooling systems for days.',
      seasons: ['summer'],
      probability: 0.08,
      durationHours: [72, 168], // 3-7 days
      systemEffects: { hvac: 'extreme', water: 'high', air: 'medium' },
      degradeMultiplier: 2.0,
      revenueMultiplier: 1.2,
    },
    {
      name: 'Cold Snap',
      description: 'Sudden cold front. Heating systems maxed out, pipes at freeze risk.',
      seasons: ['spring', 'fall'],
      probability: 0.08,
      durationHours: [48, 120], // 2-5 days
      systemEffects: { hvac: 'high', water: 'medium' },
      degradeMultiplier: 1.6,
      revenueMultiplier: 0.85,
      specialRisk: 'pipeFreezeChance',
    },
    {
      name: 'Humidity Spike',
      description: 'Oppressive humidity affects air quality and overloads dehumidifiers.',
      seasons: ['summer'],
      probability: 0.12,
      durationHours: [24, 72], // 1-3 days
      systemEffects: { air: 'high', hvac: 'medium', drainage: 'low' },
      degradeMultiplier: 1.4,
      revenueMultiplier: 0.9,
    },
    {
      name: 'Wind Storm',
      description: 'Strong winds carry debris into drainage and stress ventilation.',
      seasons: ['spring', 'summer', 'fall'],
      probability: 0.07,
      durationHours: [4, 12],
      systemEffects: { air: 'medium', drainage: 'low' },
      degradeMultiplier: 1.3,
      revenueMultiplier: 0.85,
    },
    {
      name: 'Snow/Ice',
      description: 'Early/late season snow. Drainage overloaded, pipes at freeze risk.',
      seasons: ['spring', 'fall'],
      probability: 0.05,
      durationHours: [24, 48],
      systemEffects: { drainage: 'high', hvac: 'high' },
      degradeMultiplier: 1.7,
      revenueMultiplier: 0.6,
      specialRisk: 'pipeFreezeChance',
    },
    {
      name: 'Fog',
      description: 'Thick fog blankets the stadium, reducing visibility and keeping moisture in the air systems.',
      seasons: ['spring', 'fall'],
      probability: 0.12,
      durationHours: [2, 5],
      systemStress: { air: 1.5 },
      reputationImpact: -1,
      degradeMultiplier: 1.2,
      revenueMultiplier: 0.9,
    },
    {
      name: 'Ice Storm',
      description: 'Freezing rain coats every surface. Drainage grates ice over and pipes risk bursting.',
      seasons: ['fall'],
      probability: 0.06,
      durationHours: [3, 8],
      systemStress: { drainage: 2.0, water: 1.8 },
      specialRisk: 'pipeFreezeChance',
      reputationImpact: -3,
      degradeMultiplier: 1.9,
      revenueMultiplier: 0.5,
    },
    {
      name: 'Dust Storm',
      description: 'Gusting winds carry clouds of dust and debris that choke air filters and clog HVAC intakes.',
      seasons: ['summer'],
      probability: 0.05,
      durationHours: [2, 6],
      systemStress: { air: 2.5, hvac: 1.5 },
      reputationImpact: -2,
      degradeMultiplier: 1.8,
      revenueMultiplier: 0.7,
    },
    {
      name: 'Flash Flood',
      description: 'A sudden downpour overwhelms the stadium drainage. Water rises fast — extreme drainage stress.',
      seasons: ['spring', 'summer'],
      probability: 0.04,
      durationHours: [1, 4],
      systemStress: { drainage: 3.0, water: 1.5 },
      reputationImpact: -4,
      degradeMultiplier: 2.2,
      revenueMultiplier: 0.4,
    },
  ],

  // ── Random Events ───────────────────────────────────────────────────
  randomEvents: [
    {
      name: 'Pipe Burst',
      description: 'A pipe has burst! Water flooding one zone. Fix it before it spreads!',
      probability: 0.10,
      triggerConditions: { minPipeIntegrity: null, freezeRisk: true },
      affectedSystem: 'water',
      degradeMultiplier: 2.5,
      revenueMultiplier: 0.7,
      responseWindowSec: 300, // 5 minutes before cascade
      reputationPenalty: -5,
    },
    {
      name: 'Power Outage',
      description: 'Power failure! All electric systems offline. Backup generators needed.',
      probability: 0.06,
      triggerConditions: { storm: true, overloadedGrid: true },
      affectedSystem: 'all',
      degradeMultiplier: 0, // systems just stop
      revenueMultiplier: 0.3,
      responseWindowSec: 0, // immediate
      reputationPenalty: -8,
    },
    {
      name: 'Health Inspection',
      description: 'Health inspector is here! All systems will be evaluated.',
      probability: 0.05, // also scheduled every 20 games
      scheduledInterval: 20, // games between scheduled inspections
      affectedSystem: 'all',
      degradeMultiplier: 1.0,
      revenueMultiplier: 1.0,
      responseWindowSec: 86400, // 24-hour warning for scheduled
      grades: {
        A: { minAvgQuality: 85, reputationBonus: 5, cashBonus: 3000 },
        B: { minAvgQuality: 70, reputationBonus: 2, cashBonus: 1000 },
        C: { minAvgQuality: 50, reputationBonus: 0, cashBonus: 0 },
        D: { minAvgQuality: 30, reputationBonus: -5, cashBonus: -2000 },
        F: { minAvgQuality: 0, reputationBonus: -10, cashBonus: -5000 },
      },
    },
    {
      name: 'VIP Visit',
      description: 'A VIP is attending! Luxury box systems must be flawless.',
      probability: 0.08,
      triggerConditions: { minReputation: 50 },
      affectedSystem: 'hvac',
      degradeMultiplier: 1.0,
      revenueMultiplier: 2.0,
      responseWindowSec: 270, // ~1 game warning
      reputationPenalty: -6, // if luxury systems fail
      reputationBonus: 4, // if everything is perfect
    },
    {
      name: 'Equipment Malfunction',
      description: 'A random component has failed unexpectedly!',
      probability: 0.12,
      triggerConditions: { lowMaintenance: true, oldEquipment: true },
      affectedSystem: 'random',
      degradeMultiplier: 3.0,
      revenueMultiplier: 0.9,
      responseWindowSec: 600,
      reputationPenalty: -3,
    },
    {
      name: 'Sewage Backup',
      description: 'Sewage backup detected! Restrooms closing. Act fast!',
      probability: 0.04,
      triggerConditions: { neglectedDrainage: true, highAttendance: true },
      affectedSystem: 'drainage',
      degradeMultiplier: 2.0,
      revenueMultiplier: 0.5,
      responseWindowSec: 600, // 10 minutes before spread
      reputationPenalty: -10,
    },
    {
      name: 'Pest Infestation',
      description: 'Pests detected in ventilation system. Air quality compromised.',
      probability: 0.03,
      triggerConditions: { poorAirFiltration: true },
      affectedSystem: 'air',
      degradeMultiplier: 1.5,
      revenueMultiplier: 0.8,
      responseWindowSec: 86400, // multi-day resolution
      reputationPenalty: -4,
    },
    {
      name: 'Sponsor Inspection',
      description: 'Your sponsor is evaluating stadium conditions. Impress them!',
      probability: 0.08,
      triggerConditions: { activeSponsor: true },
      affectedSystem: 'all',
      degradeMultiplier: 1.0,
      revenueMultiplier: 1.0,
      responseWindowSec: 540, // 2 games warning
      reputationPenalty: -3,
      sponsorRisk: true, // poor showing risks losing contract
    },
    {
      name: 'Championship Announcement',
      description: 'Your stadium will host the championship! Prepare all systems!',
      probability: 0.02,
      triggerConditions: { lateSeason: true, highReputation: true },
      affectedSystem: 'all',
      degradeMultiplier: 1.0,
      revenueMultiplier: 1.0,
      responseWindowSec: 1350, // ~5 games warning
      reputationPenalty: -15, // catastrophic if you fail
      reputationBonus: 10,
    },
    {
      name: 'Charity Event',
      description: 'A special non-baseball event with unique system demands.',
      probability: 0.06,
      triggerConditions: { minReputation: 60 },
      affectedSystem: 'hvac', // stage lighting heat load
      degradeMultiplier: 1.3,
      revenueMultiplier: 1.8,
      responseWindowSec: 810, // ~3 games warning
      reputationBonus: 3,
    },
  ],

  // ── Reputation & Progression ────────────────────────────────────────
  // BALANCE: Reputation tiers are the core progression axis. The spacing is
  // designed so that each tier takes roughly 15-25 game days of solid play to
  // reach, with setbacks from events/inspections creating a "two steps forward,
  // one step back" feel. Minor League → Single-A is the fastest transition
  // (~10-15 days) to reward early engagement; later tiers take longer.
  reputation: {
    min: 0,
    max: 100,
    tiers: [
      { name: 'Condemned', min: 0, max: 20, gameOverAfterGames: 10 },
      { name: 'Minor League', min: 21, max: 40, unlocks: [] },
      { name: 'Single-A', min: 41, max: 55, unlocks: ['luxuryBoxWing', 'tier2Upgrades', 'secondCrew'] },
      { name: 'Double-A', min: 56, max: 70, unlocks: ['pressBox', 'tier3Upgrades', 'weatherStation', 'thirdCrew'] },
      { name: 'Triple-A', min: 71, max: 85, unlocks: ['undergroundHub', 'tier4Upgrades', 'automationTools'] },
      { name: 'Major League', min: 86, max: 100, unlocks: ['championshipEligible', 'premiumSponsors', 'fullAutomation'] },
    ],

    // Per-event reputation changes
    // BALANCE: +1/+2 per good day means ~6-12 rep per week of clean play.
    // Bad days (-2) and event penalties (-3 to -15) keep progress from being
    // monotonic. A player maintaining 70%+ quality will climb steadily but
    // a bad event can knock them back a tier.
    gainPerCleanGame: { low: 1, medium: 2, high: 3 },
    lossPerComplaintThreshold: { mild: -1, moderate: -2, severe: -3 },
    inspectionGain: { A: 5, B: 2 },
    inspectionLoss: { C: 0, D: -5, F: -10 },
    eventSurvivalBonus: { minor: 3, major: 5 },
    gameCancellationPenalty: -15,
    sewageIncidentPenalty: -10,
  },

  // ── Stadium Expansion Zones ─────────────────────────────────────────
  // BALANCE: Expansion costs are tuned to require 5-10 game days of saving
  // at the tier where they unlock. Each expansion should feel like a
  // milestone purchase that transforms the player's capability, not just
  // a routine upgrade. The required new systems mean expansions also
  // increase ongoing maintenance burden — growth comes with responsibility.
  expansions: [
    { id: 'luxuryBoxWing', name: 'Luxury Box Wing', reputationRequired: 41, cost: 15000, revenueBoost: 0.30, newSystemsRequired: ['hvac', 'water'] },
    { id: 'pressBox', name: 'Press Box Level', reputationRequired: 56, cost: 12000, revenueBoost: 0.10, newSystemsRequired: ['air'], mediaReputationBoost: true },
    { id: 'undergroundHub', name: 'Underground Utility Hub', reputationRequired: 71, cost: 20000, revenueBoost: 0, operatingCostReduction: 0.20, newSystemsRequired: ['drainage'] },
    { id: 'secondDeck', name: 'Second Deck Expansion', reputationRequired: 80, cost: 50000, revenueBoost: 0.50, newSystemsRequired: ['air', 'water', 'hvac', 'drainage'] },
    { id: 'championshipPavilion', name: 'Championship Pavilion', reputationRequired: 90, cost: 80000, revenueBoost: 1.0, newSystemsRequired: ['air', 'water', 'hvac', 'drainage'], specialEventsOnly: true },
  ],

  // ── Win / Lose Conditions ───────────────────────────────────────────
  winConditions: {
    softVictory: {
      reputationRequired: 86,
      championshipHosted: true,
      systemEfficiencyMin: 0.90,
    },
    stadiumOfTheYear: {
      description: 'All metrics above threshold for a full season',
      allSystemsAbove: 80,
      reputationAbove: 85,
      fullSeason: true,
    },
  },

  loseConditions: {
    condemnedDuration: 10, // games at 0-20 reputation
    consecutiveBadSeasons: 2,
    catastrophicFailure: {
      description: 'Water + sewage simultaneous failure causes stadium closure',
      requiredSimultaneousFailures: ['water', 'drainage'],
    },
  },

  // ── Milestones / Achievements (Narrative) ──────────────────────────
  // Canonical source: STORY_MILESTONES in src/data/storyData.js
  // (removed duplicate — ProgressionSystem and StorySystem both read from storyData)

  // ── Weather Forecasting ─────────────────────────────────────────────
  weatherForecast: {
    baseForecastDays: 3,
    baseAccuracy: 0.60,
    weatherStationAccuracy: 0.90, // with weather station upgrade
  },

  // ── Cross-System Interactions ───────────────────────────────────────
  // Defines how failures in one system affect others
  systemInteractions: [
    { source: 'water', target: 'drainage', effect: 'overPressureFlood', severity: 'medium' },
    { source: 'water', target: 'hvac', effect: 'coolingTowerFailure', severity: 'high' },
    { source: 'hvac', target: 'air', effect: 'ductFailureReducesAirflow', severity: 'medium' },
    { source: 'hvac', target: 'drainage', effect: 'condensationLoad', severity: 'low' },
    { source: 'drainage', target: 'water', effect: 'backupContamination', severity: 'high' },
    { source: 'drainage', target: 'air', effect: 'floodingAirQuality', severity: 'medium' },
    { source: 'air', target: 'water', effect: 'scrubberWaterDemand', severity: 'low' },
  ],
};
