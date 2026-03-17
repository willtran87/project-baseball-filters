/**
 * EventSystem — Manages scheduled, weather, and random events.
 *
 * Events are the primary source of challenge and variety. Three categories:
 *   1. Scheduled: game days with varying attendance/stress
 *   2. Weather: seasonal patterns affecting specific systems
 *   3. Random: surprises that test preparedness (inspections, pipe bursts, etc.)
 *
 * Events can compound — a heatwave during a game day creates cascading stress.
 */

import { REAL_INCIDENTS } from '../data/realWorldData.js';

// ── Multi-Day Event Chains ─────────────────────────────────────────
// Narrative event chains that span multiple game days with cascading
// consequences. Max 1 active chain at a time.

const EVENT_CHAINS = [
  {
    id: 'waterMainCrisis',
    name: 'Water Main Crisis',
    trigger: { minDay: 15, minRep: 30 },
    days: [
      {
        day: 1,
        title: 'Water Pressure Dropping',
        description: 'Maintenance reports unusual pressure drops in the water system.',
        effects: { domainDamage: { water: 10 } },
      },
      {
        day: 2,
        title: 'Pipe Burst Confirmed',
        description: 'A major pipe has burst! Emergency repair available for $2,000.',
        effects: { domainDamage: { water: 20, drainage: 10 } },
        choice: {
          text: 'Emergency repair for $2,000?',
          yesEffect: { cost: 2000, flag: 'waterRepaired' },
          noEffect: {},
        },
      },
      {
        day: 3,
        title: null,
        resolve: (state, flags) => {
          if (flags.waterRepaired) {
            return { title: 'Crisis Averted', description: 'Inspectors are impressed by your quick response.', effects: { rep: 5 } };
          }
          return { title: 'Flood Damage', description: 'Extensive water damage throughout the stadium.', effects: { domainDamage: { water: 30, drainage: 20 }, rep: -8 } };
        },
      },
    ],
  },
  {
    id: 'vipDelegation',
    name: 'VIP Delegation',
    trigger: { minDay: 10, minRep: 40 },
    days: [
      {
        day: 1,
        title: 'VIP Delegation Announced',
        description: 'A delegation of league officials will tour the stadium tomorrow. You have one day to prepare all systems.',
        effects: {},
      },
      {
        day: 2,
        title: null,
        resolve: (state) => {
          const dh = state.domainHealth ?? {};
          const allAbove70 = dh.air >= 70 && dh.water >= 70 && dh.hvac >= 70 && dh.drainage >= 70;
          const anyBelow50 = dh.air < 50 || dh.water < 50 || dh.hvac < 50 || dh.drainage < 50;
          if (allAbove70) {
            return { title: 'VIPs Impressed!', description: 'The delegation praised every system. Bonus funding secured!', effects: { rep: 10, cash: 3000 } };
          }
          if (anyBelow50) {
            return { title: 'VIPs Disappointed', description: 'The delegation noticed critical system failures. Word will spread.', effects: { rep: -5 } };
          }
          return { title: 'VIPs Satisfied', description: 'A passable tour. The delegation left without complaint.', effects: { rep: 2 } };
        },
      },
    ],
  },
  {
    id: 'equipmentRecall',
    name: 'Equipment Recall',
    trigger: { minDay: 20, minRep: 20 },
    days: [
      {
        day: 1,
        title: 'Recall Notice Issued',
        description: 'A manufacturer recall affects one of your systems. The weakest filter has lost half its condition.',
        effects: { recallDamage: true },
      },
      {
        day: 2,
        title: 'Replacement Available',
        description: 'The manufacturer offers a discounted repair at half cost.',
        choice: {
          text: 'Accept discounted repair for the recalled filter?',
          yesEffect: { flag: 'recallRepaired', discountRepair: true },
          noEffect: {},
        },
        effects: {},
      },
      {
        day: 3,
        title: null,
        resolve: (state, flags) => {
          if (flags.recallRepaired) {
            return { title: 'Recall Resolved', description: 'The repaired filter came back stronger than before. +20% bonus condition!', effects: { recallBonus: true } };
          }
          return { title: 'Recall Unresolved', description: 'The recalled filter continues to underperform. Domain health suffers.', effects: { domainDamage: { air: 5, water: 5, hvac: 5, drainage: 5 } } };
        },
      },
    ],
  },
  {
    id: 'heatwave',
    name: 'Heatwave',
    trigger: { minDay: 10, minRep: 20 },
    days: [
      {
        day: 1,
        title: 'Temperature Rising',
        description: 'Forecasters warn of extreme heat approaching. HVAC systems under increased stress.',
        effects: { domainDamage: { hvac: 8 } },
      },
      {
        day: 2,
        title: 'Record Temperatures',
        description: 'Record-breaking heat! HVAC maxed out, air quality dropping, and fans are staying home.',
        effects: { domainDamage: { hvac: 15, air: 10 }, attendancePenalty: 10 },
      },
      {
        day: 3,
        title: null,
        resolve: (state) => {
          const dh = state.domainHealth ?? {};
          const hvacAbove60 = (dh.hvac ?? 0) >= 60;
          if (hvacAbove60) {
            return { title: 'Heat Breaks — Systems Held!', description: 'The heatwave is over. Your HVAC kept the crowd cool under pressure. Bonus rep!', effects: { rep: 5 } };
          }
          return { title: 'Heat Breaks — Barely', description: 'The heatwave ends, but damage is done. Fans remember the sweltering conditions.', effects: { rep: -3 } };
        },
      },
    ],
  },
];

// Game day types with attendance and stress profiles
const GAME_DAY_TYPES = [
  { name: 'Weekday Regular',   configKey: 'weekdayRegular',   weight: 0.35, attendance: [0.40, 0.60], stress: 1.0, revenueMultiplier: 1.0 },
  { name: 'Weekend Regular',   configKey: 'weekendRegular',   weight: 0.25, attendance: [0.60, 0.80], stress: 1.3, revenueMultiplier: 1.3 },
  { name: 'Rivalry Game',      configKey: 'rivalryGame',      weight: 0.15, attendance: [0.80, 0.95], stress: 1.6, revenueMultiplier: 1.6 },
  { name: 'Promotional Night', configKey: 'promotionalNight', weight: 0.15, attendance: [0.70, 0.90], stress: 1.4, revenueMultiplier: 1.5 },
  { name: 'Playoff Game',      configKey: 'playoffGame',      weight: 0.07, attendance: [1.00, 1.00], stress: 2.0, revenueMultiplier: 2.5 },
  { name: 'Championship Game', configKey: 'championshipGame', weight: 0.03, attendance: [1.00, 1.00], stress: 2.5, revenueMultiplier: 4.0 },
];

// Positive random events — hardcoded fallback (config doesn't include these yet)
const FALLBACK_POSITIVE_EVENTS = [
  {
    name: 'Fan Appreciation Day',
    probability: 0.08,
    triggerCondition: 'goodQuality',
    durationSec: 60,
    degradeMultiplier: 0.5,
    revenueMultiplier: 1.8,
    reputationImpact: 3,
    description: 'The fans are celebrating! Extra concession sales and great vibes.',
    isPositive: true,
  },
  {
    name: 'Sponsor Bonus',
    probability: 0.06,
    triggerCondition: 'goodQuality',
    durationSec: 30,
    degradeMultiplier: 1.0,
    revenueMultiplier: 1.0,
    reputationImpact: 2,
    description: 'A sponsor is so impressed they sent an extra check!',
    isPositive: true,
    cashBonus: 2000,
  },
  {
    name: 'Equipment Donation',
    probability: 0.04,
    triggerCondition: 'goodQuality',
    durationSec: 20,
    degradeMultiplier: 1.0,
    revenueMultiplier: 1.0,
    reputationImpact: 1,
    description: 'A local business donated repair supplies! Reduced repair costs today.',
    isPositive: true,
    repairDiscount: true,
  },
  {
    name: 'Media Feature',
    probability: 0.05,
    triggerCondition: 'highReputation',
    durationSec: 40,
    degradeMultiplier: 1.0,
    revenueMultiplier: 1.5,
    reputationImpact: 4,
    description: 'A national sports outlet featured your stadium! Attendance surging.',
    isPositive: true,
  },
  {
    name: 'Perfect Game',
    probability: 0.03,
    triggerCondition: 'goodQuality',
    durationSec: 60,
    degradeMultiplier: 0.7,
    revenueMultiplier: 2.0,
    reputationImpact: 5,
    description: 'The home team is pitching a perfect game! The crowd is electric!',
    isPositive: true,
  },
  {
    name: 'Scout Visit',
    probability: 0.05,
    triggerCondition: 'goodQuality',
    durationSec: 45,
    degradeMultiplier: 1.0,
    revenueMultiplier: 1.3,
    reputationImpact: 3,
    description: 'MLB scouts are visiting! Great systems impress the league.',
    isPositive: true,
  },
];

export class EventSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;
    this._activeTimer = 0;
    this._weatherTimer = 0;
    this._randomTimer = 0;
    // BALANCE: Check intervals determine how often events can trigger.
    // One game day = 9 innings * 30 sec = 270 sec. At 60s weather checks,
    // that's ~4.5 checks/day. At 90s random checks, ~3 checks/day.
    // This gives roughly 1 event per 2-3 game days on average, which
    // keeps the game eventful without being overwhelming.
    this._weatherCheckInterval = 60; // seconds between weather checks (raised from 45)
    this._randomCheckInterval = 90;  // seconds between random event checks (raised from 60)
    this._lastQuality = 0.5;

    // Weather forecast (next 3 events, with decreasing accuracy)
    this._forecast = [];
    this._generateForecast();

    // Track game day type for current day
    this._currentGameDay = null;

    // Queue for story-driven scripted events
    this._scriptedQueue = [];

    // Track event chain depth to prevent infinite snowballing
    this._chainDepth = 0;

    // Pipe freeze: track whether freeze already triggered for current weather event
    this._pipeFreezeTriggered = false;

    // Real incident tracking: map of incident ID → last day triggered
    this._realIncidentLastDay = {};

    this.eventBus.on('game:newDay', (data) => this._onNewDay(data));
    this.eventBus.on('filtration:quality', (data) => {
      this._lastQuality = data.avgEfficiency;
    });
    // Listen for story-driven scripted events
    this.eventBus.on('story:scriptedEvent', (eventDef) => {
      this.queueScriptedEvent(eventDef);
    });

    // Listen for story bonuses (e.g., Bea's inspection advance warning)
    this._inspectionWarningDays = 0;
    this.eventBus.on('story:bonus', (data) => {
      if (data.type === 'inspectionWarning') {
        this._inspectionWarningDays = data.days ?? 0;
      }
    });

    // Reset timers and queues after save/load
    this.eventBus.on('state:loaded', () => {
      this._activeTimer = 0;
      this._weatherTimer = 0;
      this._randomTimer = 0;
      this._scriptedQueue = [];
      this._chainDepth = 0;
      this._generateForecast();
    });
  }

  update(dt) {
    if (this.state.paused) return;

    // Count down active event
    if (this.state.activeEvent) {
      this._activeTimer -= dt;
      if (this._activeTimer <= 0) {
        this._endEvent();
      }
    }

    // Process scripted events first (they bypass probability)
    if (!this.state.activeEvent && this._scriptedQueue.length > 0) {
      const scripted = this._scriptedQueue.shift();
      this._startEvent({ ...scripted, category: 'scripted', isScripted: true });
      return;
    }

    // Periodic weather checks
    this._weatherTimer += dt;
    if (this._weatherTimer >= this._weatherCheckInterval) {
      this._weatherTimer = 0;
      if (!this.state.activeEvent) {
        this._checkWeatherEvent();
      }
    }

    // Periodic random event checks (negative and positive) — skip during off-season
    // (no games = no attendance-based events, inspections, VIP visits, etc.)
    if (!this.state.offSeason) {
      this._randomTimer += dt;
      if (this._randomTimer >= this._randomCheckInterval) {
        this._randomTimer = 0;
        if (!this.state.activeEvent) {
          // 40% chance to check positive events instead of negative
          if (Math.random() < 0.4) {
            this._checkPositiveEvent();
          } else {
            this._checkRandomEvent();
          }
        }
      }
    }
  }

  // ── Game Day Management ─────────────────────────────────────────

  _onNewDay(data) {
    // During off-season, skip game day type selection and most event checks.
    // Weather events can still occur but no game-specific events.
    if (this.state.offSeason) {
      // Weather can still affect the stadium during off-season
      this._checkPipeFreeze();
      // Refresh forecast
      if ((data.day ?? 1) % 3 === 0) {
        this._generateForecast();
      }
      return;
    }

    // ── Multi-day event chain processing ──
    this._processEventChain(data);

    // Determine game day type and store on state for other systems
    this._currentGameDay = this._rollGameDayType();
    this.state.currentGameDayType = this._currentGameDay.configKey ?? 'weekdayRegular';
    this.eventBus.emit('gameday:type', this._currentGameDay);

    // Announce game day type to the player (skip plain weekday games for less noise)
    if (this._currentGameDay.configKey !== 'weekdayRegular') {
      const dayIcons = {
        weekendRegular: '\u{1f3df}',
        rivalryGame: '\u{1f525}',
        promotionalNight: '\u{1f389}',
        playoffGame: '\u{1f3c6}',
        championshipGame: '\u{1f31f}',
      };
      const icon = dayIcons[this._currentGameDay.configKey] ?? '\u26be';
      const revBonus = this._currentGameDay.revenueMultiplier > 1
        ? ` (${Math.round((this._currentGameDay.revenueMultiplier - 1) * 100)}% revenue bonus!)`
        : '';
      this.eventBus.emit('ui:message', {
        text: `${icon} Today: ${this._currentGameDay.name}${revBonus}`,
        type: this._currentGameDay.revenueMultiplier >= 2 ? 'achievement' : 'info',
      });
    }

    // Pipe freeze check: if a weather event with pipeFreezeChance is active
    this._checkPipeFreeze();

    // Check for real incidents first (5% chance per day), then fallback to random events
    if (!this.state.activeEvent) {
      if (!this._checkRealIncident()) {
        this._checkRandomEvent();
      }
    }

    // Refresh forecast every few days
    if ((data.day ?? 1) % 3 === 0) {
      this._generateForecast();
    }

    // Research: earlyWarningBonus — show upcoming weather/event warning 1 day earlier
    const earlyWarningBonus = this.state.researchEffects?.earlyWarningBonus ?? 0;
    if (earlyWarningBonus > 0 && this._forecast.length > 0) {
      const nextForecast = this._forecast[0];
      if (nextForecast && nextForecast.name !== 'Clear') {
        this.eventBus.emit('ui:message', {
          text: `Early warning sensors: ${nextForecast.name} expected soon. Prepare your systems!`,
          type: 'info',
        });
      }
    }
  }

  _rollGameDayType() {
    // Build combined list: hardcoded base types + config-only types (openingDay, etc.)
    const allTypes = [...GAME_DAY_TYPES];
    const configDayTypes = this.state.config?.gameDayTypes ?? {};
    for (const [key, def] of Object.entries(configDayTypes)) {
      // Skip types already in the hardcoded list
      if (GAME_DAY_TYPES.some(t => t.configKey === key)) continue;
      // Only include config types that have a weight (new types like openingDay)
      if (def.weight) {
        allTypes.push({
          name: def.name ?? key,
          configKey: key,
          weight: def.weight,
          attendance: def.attendanceRange ?? [0.50, 0.70],
          stress: def.stressTier?.degradeMultiplier ?? 1.0,
          revenueMultiplier: def.revenueMultiplier ?? 1.0,
        });
      }
    }

    const roll = Math.random();
    let cumulative = 0;

    for (const type of allTypes) {
      cumulative += type.weight;
      if (roll <= cumulative) {
        return { ...type };
      }
    }
    return { ...GAME_DAY_TYPES[0] };
  }

  /** Get current game day info. */
  get currentGameDay() {
    return this._currentGameDay;
  }

  /** Get attendance for current day as a fraction (0-1). */
  getAttendance() {
    if (!this._currentGameDay) return 0.5;
    const [min, max] = this._currentGameDay.attendance;
    return min + Math.random() * (max - min);
  }

  // ── Weather Events ──────────────────────────────────────────────

  _checkWeatherEvent() {
    const season = this._getCurrentSeason();
    const weatherEvents = this._getWeatherEvents();

    for (const weather of weatherEvents) {
      if (!weather.seasons.includes(season)) continue;
      if (Math.random() < weather.probability * 0.3) { // scale down for per-check probability
        this._startEvent({
          ...weather,
          category: 'weather',
        });
        return;
      }
    }
  }

  _getCurrentSeason() {
    const day = this.state.gameDay ?? 1;
    const gamesPerSeason = this.state.config?.gamesPerSeason ?? 80;
    // Use day within the current season, not absolute day
    const dayInSeason = ((day - 1) % gamesPerSeason) + 1;
    // ~80 games per season, roughly: spring (1-25), summer (26-55), fall (56-80)
    const springEnd = Math.floor(gamesPerSeason * 0.3125); // 25
    const summerEnd = Math.floor(gamesPerSeason * 0.6875); // 55
    if (dayInSeason <= springEnd) return 'spring';
    if (dayInSeason <= summerEnd) return 'summer';
    return 'fall';
  }

  // ── Random Events ───────────────────────────────────────────────

  _checkRandomEvent() {
    const randomEvents = this._getRandomEvents();
    for (const evt of randomEvents) {
      // Check trigger conditions
      if (evt.triggerCondition === 'lowFilterCondition' && this._lastQuality > 0.4) continue;
      if (evt.triggerCondition === 'highReputation' && this.state.reputation < 50) continue;

      if (Math.random() < evt.probability * 0.25) { // scale down for per-check
        // Bea's inspection warning: give advance notice instead of immediate start
        if (evt.isInspection && this._inspectionWarningDays > 0) {
          this.eventBus.emit('ui:message', {
            text: 'Inspector Thornton sent a heads-up: inspection coming soon! Prepare your systems.',
            type: 'info',
          });
          this._inspectionWarningDays = 0; // consume the warning
          // Skip starting the inspection now — it will trigger on a future check
          return;
        }

        this._startEvent({
          ...evt,
          category: 'random',
        });
        return;
      }
    }
  }

  // ── Positive Events ────────────────────────────────────────────

  _checkPositiveEvent() {
    const positiveEvents = this._getPositiveEvents();
    for (const evt of positiveEvents) {
      // Positive events require good quality or high reputation
      if (evt.triggerCondition === 'goodQuality' && this._lastQuality < 0.65) continue;
      if (evt.triggerCondition === 'highReputation' && this.state.reputation < 50) continue;

      if (Math.random() < evt.probability * 0.2) {
        this._startEvent({
          ...evt,
          category: 'positive',
        });

        // Apply instant cash bonus if defined
        if (evt.cashBonus) {
          this.state.set('money', this.state.money + evt.cashBonus);
          this.eventBus.emit('ui:message', {
            text: `+$${evt.cashBonus.toLocaleString()} bonus!`,
            type: 'success',
          });
        }

        // Apply temporary repair discount (cleared when event ends in _endEvent)
        if (evt.repairDiscount && this.state.storyFlags) {
          this.state.storyFlags._tempRepairDiscount = true;
        }

        return;
      }
    }
  }

  // ── Real Incidents ─────────────────────────────────────────────

  /**
   * Check for a real-world incident event. 5% chance per game day.
   * Returns true if an incident was triggered.
   */
  _checkRealIncident() {
    if (Math.random() > 0.05) return false;

    const day = this.state.gameDay ?? 1;
    const chapter = this.state.storyChapter ?? 1;
    const season = this._getCurrentSeason();

    for (const incident of REAL_INCIDENTS) {
      // Don't repeat within 20 game days
      if (this._realIncidentLastDay[incident.id] && day - this._realIncidentLastDay[incident.id] < 20) continue;

      // Check trigger conditions
      const cond = incident.triggerConditions;
      if (!cond) continue;

      // Backstory incidents don't trigger as gameplay events
      if (cond.type === 'backstory') continue;

      // Chapter requirement
      if (cond.minChapter && chapter < cond.minChapter) continue;

      // Season requirement
      if (cond.season && season !== cond.season) continue;

      // Probability gate (in addition to the 5% outer gate)
      if (cond.probability && Math.random() > cond.probability) continue;

      // High attendance requirement
      if (cond.highAttendance && (this.state.attendancePercent ?? 0) < 75) continue;

      // Trigger this incident
      this._realIncidentLastDay[incident.id] = day;

      // Map incident effects to event system format
      const systemStress = {};
      if (incident.effects.systemStress) {
        for (const [domain, level] of Object.entries(incident.effects.systemStress)) {
          const stressMap = { low: 1.2, moderate: 1.5, high: 2.0, extreme: 2.5 };
          systemStress[domain] = stressMap[level] ?? 1.5;
        }
      }

      this._startEvent({
        name: incident.name,
        description: incident.description,
        category: 'random',
        durationSec: 120,
        degradeMultiplier: 2.0,
        revenueMultiplier: 0.6,
        reputationImpact: incident.effects.reputationDelta ?? -5,
        systemStress,
        isRealIncident: true,
      });

      // Apply direct money cost
      if (incident.effects.moneyDelta) {
        this.state.set('money', this.state.money + incident.effects.moneyDelta);
      }

      // Show the headline as a dramatic notification
      if (incident.dialogue?.headline) {
        this.eventBus.emit('ui:message', {
          text: incident.dialogue.headline,
          type: 'danger',
        });
      }

      return true;
    }

    return false;
  }

  // ── Scripted Events ────────────────────────────────────────────

  /**
   * Queue a scripted event from the story system.
   * Scripted events bypass probability rolls and fire as soon as
   * no other event is active.
   */
  queueScriptedEvent(eventDef) {
    this._scriptedQueue.push(eventDef);
  }

  // ── Event Lifecycle ─────────────────────────────────────────────

  _startEvent(eventDef) {
    const active = {
      name: eventDef.name,
      description: eventDef.description,
      degradeMultiplier: eventDef.degradeMultiplier ?? 1,
      revenueMultiplier: eventDef.revenueMultiplier ?? 1,
      category: eventDef.category ?? 'unknown',
      systemStress: eventDef.systemStress ?? {},
      reputationImpact: eventDef.reputationImpact ?? 0,
      isInspection: eventDef.isInspection ?? false,
      isVIP: eventDef.isVIP ?? false,
      isSponsorVisit: eventDef.isSponsorVisit ?? false,
      isChampionship: eventDef.isChampionship ?? false,
      isScripted: eventDef.isScripted ?? false,
      isPositive: eventDef.isPositive ?? false,
      specialRisk: eventDef.specialRisk ?? null,
    };
    this.state.set('activeEvent', active);
    this._activeTimer = eventDef.durationSec ?? 60;
    // Reset pipe freeze flag when a new weather event starts
    if (active.specialRisk === 'pipeFreezeChance') {
      this._pipeFreezeTriggered = false;
    }
    this.eventBus.emit('event:started', active);

    // Emit weather-specific event for audio cue
    if (active.specialRisk) {
      this.eventBus.emit('event:weatherStart', active);
    }

    // Auto-pause on critical events so the player has time to react
    const isCritical = active.reputationImpact <= -5
      || active.degradeMultiplier >= 2.0
      || active.isChampionship;
    if (isCritical && !active.isPositive) {
      this.eventBus.emit('game:pause');
    }

    // Positive events get a different notification style
    const isPositive = active.isPositive || active.category === 'positive';
    this.eventBus.emit('ui:message', {
      text: `${isPositive ? 'Bonus' : 'Event'}: ${active.name} — ${active.description}`,
      type: isPositive ? 'success' : (active.reputationImpact < 0 ? 'danger' : 'info'),
    });
  }

  _endEvent() {
    const ended = this.state.activeEvent;
    if (!ended) return;

    // Apply reputation impact using adjustReputation for proper clamping
    if (ended.reputationImpact) {
      this.state.adjustReputation(ended.reputationImpact);
    }

    // Health inspection scoring
    if (ended.isInspection) {
      this._resolveInspection();
    }

    // VIP visit scoring
    if (ended.isVIP) {
      this._resolveVIPVisit();
    }

    // Sponsor visit scoring
    if (ended.isSponsorVisit) {
      this._resolveSponsorVisit();
    }

    // Championship event resolution
    if (ended.isChampionship) {
      this._resolveChampionship();
    }

    // Clear temporary event-scoped flags (e.g. repair discount from Equipment Donation)
    if (this.state.storyFlags?._tempRepairDiscount) {
      this.state.storyFlags._tempRepairDiscount = false;
    }

    this.state.set('activeEvent', null);
    this._activeTimer = 0;
    this.eventBus.emit('event:ended', ended);

    // Emit event:survived if the player maintained decent quality through the event
    if (this._lastQuality >= 0.5) {
      this.state.eventsSurvived = (this.state.eventsSurvived ?? 0) + 1;
      this.eventBus.emit('event:survived', ended);
    }

    // Event chaining: difficulty-based chance of a follow-up random event
    // Stop chaining once depth reaches 3 to prevent unfair snowballing
    const difficultyKey = this.state.difficulty ?? 'veteran';
    const chainChance = this.state.config.difficulty?.[difficultyKey]?.eventChainChance ?? 0.15;
    if (ended.category !== 'scripted' && this._chainDepth < 3 && Math.random() < chainChance) {
      this._chainDepth++;
      this._checkRandomEvent();
    } else {
      this._chainDepth = 0;
    }
  }

  // ── Event Resolution ────────────────────────────────────────────

  _resolveInspection() {
    // Apply difficulty-based inspection leniency (higher = easier thresholds)
    const difficultyKey = this.state.difficulty ?? 'veteran';
    const leniency = this.state.config.difficulty?.[difficultyKey]?.inspectionLeniency ?? 1.0;
    // Research: inspectionBonus adds flat bonus to perceived quality (3 pts = +0.03)
    const inspectionBonus = (this.state.researchEffects?.inspectionBonus ?? 0) * 0.01;
    // Research: pathogenReduction adds bonus to inspection score
    const pathogenBonus = (this.state.researchEffects?.pathogenReduction ?? 0) * 0.05;
    // Research: regulatoryRisk — small inspection penalty from experimental tech
    const regulatoryPenalty = (this.state.researchEffects?.regulatoryRisk ?? 0) * 0.1;
    // Rival sabotage: Victor's inspector bribe makes inspection stricter
    const rivalPenalty = this.state._nextInspectionPenalty ?? 1.0;
    // Consume the penalty so it only applies once
    if (rivalPenalty !== 1.0) {
      this.state._nextInspectionPenalty = 1.0;
    }
    // Leniency > 1 makes quality appear higher; < 1 makes it stricter
    const quality = Math.min(1, this._lastQuality * leniency * rivalPenalty + inspectionBonus + pathogenBonus - regulatoryPenalty);
    let grade, repChange, moneyChange;

    // Grade thresholds and rewards (scaled to match economy)
    if (quality >= 0.85) {
      grade = 'A';
      repChange = 5;
      moneyChange = 3000;
    } else if (quality >= 0.70) {
      grade = 'B';
      repChange = 2;
      moneyChange = 1000;
    } else if (quality >= 0.50) {
      grade = 'C';
      repChange = 0;
      moneyChange = 0;
    } else if (quality >= 0.30) {
      grade = 'D';
      repChange = -5;
      moneyChange = -2000;
    } else {
      grade = 'F';
      repChange = -10;
      moneyChange = -5000;
    }

    this.state.adjustReputation(repChange);
    this.state.set('money', this.state.money + moneyChange);
    this.state.lastInspectionGrade = grade;

    this.eventBus.emit('inspection:result', { grade, repChange, moneyChange });
    const gradeMessages = {
      A: 'Inspector Thornton nods approvingly. Grade A -- exemplary.',
      B: 'Thornton marks it down: Grade B. Solid, but room to improve.',
      C: 'Grade C. Thornton says nothing. Her silence speaks volumes.',
      D: 'Grade D. Thornton\'s pen hits the clipboard hard.',
      F: 'Grade F. Thornton shakes her head. "This is not acceptable."',
    };
    this.eventBus.emit('ui:message', {
      text: `${gradeMessages[grade] ?? `Inspection Grade ${grade}.`} ${moneyChange >= 0 ? '+' : ''}$${moneyChange}`,
      type: grade === 'A' || grade === 'B' ? 'success' : 'danger',
    });
  }

  _resolveVIPVisit() {
    if (this._lastQuality >= 0.8) {
      this.state.adjustReputation(4);
      this.eventBus.emit('ui:message', { text: 'VIP left smiling. The luxury boxes delivered. Reputation +4!', type: 'success' });
    } else {
      this.state.adjustReputation(-6);
      this.eventBus.emit('ui:message', { text: 'VIP was not impressed. Word will get around the league. Reputation -6.', type: 'danger' });
    }
  }

  _resolveChampionship() {
    if (this._lastQuality >= 0.85) {
      this.state.championshipHosted = true;
      this.state.adjustReputation(10);
      // Set story flags for ending triggers
      if (this.state.storyFlags) {
        this.state.storyFlags['championshipWon'] = true;
        // Check if all domain health scores are above 80 for secret ending
        const dh = this.state.domainHealth;
        if (dh && dh.air >= 80 && dh.water >= 80 && dh.hvac >= 80 && dh.drainage >= 80) {
          this.state.storyFlags['allSystemsAbove80'] = true;
        }
      }
      this.eventBus.emit('ui:message', { text: 'Grand slam! Championship game was flawless. Ridgemont is in the big leagues! Reputation +10!', type: 'success' });
    } else {
      this.state.adjustReputation(-15);
      this.eventBus.emit('ui:message', { text: 'The championship game was a strikeout. Systems failed on the biggest stage. Reputation -15.', type: 'danger' });
    }
  }

  _resolveSponsorVisit() {
    if (this._lastQuality >= 0.7) {
      const bonus = 2000;
      this.state.set('money', this.state.money + bonus);
      this.state.adjustReputation(2);
      this.eventBus.emit('ui:message', { text: `Fiona's sponsor is impressed! Bonus $${bonus} and reputation boost. Keep those numbers clean.`, type: 'success' });
    } else {
      this.state.adjustReputation(-3);
      this.eventBus.emit('ui:message', { text: 'Sponsor walked out early. Fiona says the contract is "under review." Reputation -3.', type: 'warning' });
    }
  }

  // ── Multi-Day Event Chains ─────────────────────────────────────

  /**
   * Process active event chain or attempt to start a new one.
   * Called once per game day from _onNewDay.
   */
  _processEventChain(data) {
    const chain = this.state.activeEventChain;

    if (chain) {
      // Advance to next day in the active chain
      this._advanceEventChain(chain);
    } else {
      // ~8% daily chance to start a new chain
      if (Math.random() < 0.08) {
        this._tryStartEventChain();
      }
    }
  }

  /**
   * Try to start an eligible event chain. Picks randomly from chains
   * whose trigger conditions are met.
   */
  _tryStartEventChain() {
    const day = this.state.gameDay ?? 1;
    const rep = this.state.reputation ?? 0;

    const eligible = EVENT_CHAINS.filter(c => {
      if (c.trigger.minDay && day < c.trigger.minDay) return false;
      if (c.trigger.minRep && rep < c.trigger.minRep) return false;
      return true;
    });

    if (eligible.length === 0) return;

    const picked = eligible[Math.floor(Math.random() * eligible.length)];
    const firstDay = picked.days[0];

    // Initialize chain state
    this.state.activeEventChain = {
      chainId: picked.id,
      currentDay: 1,
      flags: {},
      startedOnGameDay: day,
    };

    // Apply first day effects
    this._applyChainDayEffects(picked, firstDay);

    // Notification
    this.eventBus.emit('ui:message', {
      text: `${picked.name} -- Day 1/${picked.days.length}: ${firstDay.title}`,
      type: 'warning',
    });
    this.eventBus.emit('ui:message', {
      text: firstDay.description,
      type: 'info',
    });

    // Emit chain started event for HUD
    this.eventBus.emit('eventChain:started', { chainId: picked.id, name: picked.name, totalDays: picked.days.length });
  }

  /**
   * Advance an active chain to its next day. Apply effects, handle
   * choices, or resolve the chain if it's the final day.
   */
  _advanceEventChain(chainState) {
    const chainDef = EVENT_CHAINS.find(c => c.id === chainState.chainId);
    if (!chainDef) {
      // Invalid chain, clear it
      this.state.activeEventChain = null;
      return;
    }

    const nextDayIndex = chainState.currentDay; // 0-based index for next day
    if (nextDayIndex >= chainDef.days.length) {
      // Chain complete
      this.state.activeEventChain = null;
      return;
    }

    chainState.currentDay++;
    const dayDef = chainDef.days[nextDayIndex];
    const totalDays = chainDef.days.length;
    const currentDay = chainState.currentDay;

    // Check if this day needs resolution (dynamic title)
    if (dayDef.title === null && typeof dayDef.resolve === 'function') {
      const resolved = dayDef.resolve(this.state, chainState.flags);
      this._applyChainDayEffects(chainDef, { effects: resolved.effects ?? {} });

      this.eventBus.emit('ui:message', {
        text: `${chainDef.name} -- Day ${currentDay}/${totalDays}: ${resolved.title}`,
        type: (resolved.effects?.rep ?? 0) >= 0 ? 'success' : 'danger',
      });
      this.eventBus.emit('ui:message', {
        text: resolved.description,
        type: 'info',
      });

      // Chain resolved — clear state
      this.state.activeEventChain = null;
      this.eventBus.emit('eventChain:ended', { chainId: chainDef.id, name: chainDef.name });
      return;
    }

    // Apply this day's effects
    this._applyChainDayEffects(chainDef, dayDef);

    // Notification
    this.eventBus.emit('ui:message', {
      text: `${chainDef.name} -- Day ${currentDay}/${totalDays}: ${dayDef.title}`,
      type: 'warning',
    });
    this.eventBus.emit('ui:message', {
      text: dayDef.description,
      type: 'info',
    });

    // Handle choice if present
    if (dayDef.choice) {
      this._presentChainChoice(chainDef, dayDef.choice, chainState);
    }
  }

  /**
   * Apply a chain day's effects to the game state.
   */
  _applyChainDayEffects(chainDef, dayDef) {
    const effects = dayDef.effects;
    if (!effects) return;

    // Domain damage
    if (effects.domainDamage) {
      const dh = this.state.domainHealth;
      for (const [domain, amount] of Object.entries(effects.domainDamage)) {
        if (dh[domain] !== undefined) {
          dh[domain] = Math.max(0, dh[domain] - amount);
        }
      }
      this.eventBus.emit('consequence:update', this.state.domainHealth);
    }

    // Reputation change
    if (effects.rep) {
      this.state.adjustReputation(effects.rep);
    }

    // Cash bonus/cost
    if (effects.cash) {
      this.state.set('money', this.state.money + effects.cash);
      const sign = effects.cash >= 0 ? '+' : '';
      this.eventBus.emit('ui:message', {
        text: `${sign}$${effects.cash.toLocaleString()}`,
        type: effects.cash >= 0 ? 'success' : 'danger',
      });
    }

    // Attendance penalty (temporary — lasts this day only)
    if (effects.attendancePenalty) {
      const currentAtt = this.state.attendancePercent ?? 50;
      this.state.attendancePercent = Math.max(0, currentAtt - effects.attendancePenalty);
    }

    // Equipment recall: damage the weakest filter by 50% condition
    if (effects.recallDamage) {
      this._applyRecallDamage();
    }

    // Recall bonus: +20% condition to weakest filter
    if (effects.recallBonus) {
      this._applyRecallBonus();
    }
  }

  /**
   * Present a binary choice to the player for a chain event day.
   * Uses the existing showConfirmDialog pattern via the event bus.
   */
  _presentChainChoice(chainDef, choice, chainState) {
    // Emit an event that the UI layer can respond to with a confirm dialog
    this.eventBus.emit('eventChain:choice', {
      chainId: chainDef.id,
      chainName: chainDef.name,
      text: choice.text,
      onYes: () => {
        // Apply yes effect
        if (choice.yesEffect.cost) {
          this.state.set('money', this.state.money - choice.yesEffect.cost);
          this.eventBus.emit('ui:message', {
            text: `-$${choice.yesEffect.cost.toLocaleString()} emergency cost`,
            type: 'danger',
          });
        }
        if (choice.yesEffect.flag) {
          chainState.flags[choice.yesEffect.flag] = true;
        }
        if (choice.yesEffect.discountRepair) {
          this._applyDiscountRepair(chainState);
        }
      },
      onNo: () => {
        // Apply no effect (usually empty)
        if (choice.noEffect.flag) {
          chainState.flags[choice.noEffect.flag] = true;
        }
      },
    });
  }

  /**
   * Recall damage: find the weakest filter and halve its condition.
   */
  _applyRecallDamage() {
    if (!this.state.filters || this.state.filters.length === 0) return;

    // Find filter with lowest condition ratio
    let weakest = null;
    let lowestRatio = Infinity;
    for (const f of this.state.filters) {
      const ratio = f.maxCondition > 0 ? f.condition / f.maxCondition : 0;
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        weakest = f;
      }
    }

    if (weakest) {
      const oldCond = weakest.condition;
      weakest.condition = Math.floor(weakest.condition * 0.5);
      if (weakest.maxCondition > 0) {
        weakest.efficiency = Math.max(0, weakest.condition / weakest.maxCondition);
      }
      // Store recalled filter info for potential repair
      const chain = this.state.activeEventChain;
      if (chain) {
        chain.flags._recalledFilterId = weakest.id;
        chain.flags._recalledDomain = weakest.domain;
      }
      this.eventBus.emit('ui:message', {
        text: `Filter #${weakest.id} (${weakest.domain}) hit by recall: condition ${oldCond} -> ${weakest.condition}`,
        type: 'danger',
      });
    }
  }

  /**
   * Apply discount repair to the recalled filter (restores to 80% condition).
   */
  _applyDiscountRepair(chainState) {
    const filterId = chainState.flags._recalledFilterId;
    if (!filterId) return;

    const filter = this.state.getFilter(filterId);
    if (!filter) return;

    // Repair to 80% at half cost (cost is handled by the choice yesEffect)
    filter.condition = Math.floor(filter.maxCondition * 0.8);
    if (filter.maxCondition > 0) {
      filter.efficiency = filter.condition / filter.maxCondition;
    }
    chainState.flags.recallRepaired = true;

    this.eventBus.emit('ui:message', {
      text: `Filter #${filter.id} repaired to ${filter.condition} condition at manufacturer discount.`,
      type: 'success',
    });
  }

  /**
   * Apply recall bonus: +20% condition to the recalled filter.
   */
  _applyRecallBonus() {
    const chain = this.state.activeEventChain;
    const filterId = chain?.flags?._recalledFilterId;
    if (!filterId) return;

    const filter = this.state.getFilter(filterId);
    if (!filter) return;

    const bonus = Math.floor(filter.maxCondition * 0.2);
    filter.condition = Math.min(filter.maxCondition, filter.condition + bonus);
    if (filter.maxCondition > 0) {
      filter.efficiency = filter.condition / filter.maxCondition;
    }

    this.eventBus.emit('ui:message', {
      text: `Filter #${filter.id} received +${bonus} bonus condition from manufacturer upgrade!`,
      type: 'success',
    });
  }

  // ── Weather Forecast ────────────────────────────────────────────

  _generateForecast() {
    this._forecast = [];
    const season = this._getCurrentSeason();

    // Difficulty affects forecast accuracy (lower accuracy = more surprises)
    const difficultyKey = this.state.difficulty ?? 'veteran';
    const forecastAccuracy = this.state.config.difficulty?.[difficultyKey]?.weatherForecastAccuracy ?? 0.75;
    // 0.9 caps the best-case forecast accuracy so forecasts are never perfectly
    // reliable even on the easiest difficulty — preserving strategic uncertainty.
    const baseAccuracy = 0.9 * forecastAccuracy;

    // Domain mapping: derive affected domains from systemEffects/systemStress
    const domainKeys = ['air', 'water', 'hvac', 'drainage'];

    const weatherEvents = this._getWeatherEvents();
    for (let i = 0; i < 3; i++) {
      const possible = weatherEvents.filter(w => w.seasons.includes(season));
      if (possible.length === 0) {
        this._forecast.push({ name: 'Clear', description: 'Clear skies expected.', accuracy: baseAccuracy - i * 0.15, domainsAffected: [], severity: 0 });
        continue;
      }

      // Higher chance of "clear" than any specific weather
      if (Math.random() < 0.6) {
        this._forecast.push({ name: 'Clear', description: 'Clear skies expected.', accuracy: baseAccuracy - i * 0.15, domainsAffected: [], severity: 0 });
      } else {
        const pick = possible[Math.floor(Math.random() * possible.length)];
        // Derive domainsAffected from systemEffects or systemStress
        const effects = pick.systemEffects ?? pick.systemStress ?? {};
        const domainsAffected = domainKeys.filter(d => effects[d] !== undefined);
        // Derive severity 1-3 from the highest stress level
        const severityMap = { low: 1, medium: 1, high: 2, extreme: 3 };
        let maxSeverity = 1;
        for (const val of Object.values(effects)) {
          if (typeof val === 'string') {
            maxSeverity = Math.max(maxSeverity, severityMap[val] ?? 1);
          } else if (typeof val === 'number') {
            maxSeverity = Math.max(maxSeverity, val >= 2.5 ? 3 : val >= 1.5 ? 2 : 1);
          }
        }
        this._forecast.push({
          name: pick.name,
          description: pick.description,
          accuracy: baseAccuracy - i * 0.15,
          domainsAffected,
          severity: maxSeverity,
        });
      }
    }

    // Scramble pass: on harder difficulties, randomly swap some forecast entries
    // to simulate inaccurate predictions. Rookie = 0% scramble, HoF = 50%.
    const scrambleChance = 1 - forecastAccuracy; // 0 for rookie (1.0), 0.5 for HoF (0.5)
    if (scrambleChance > 0) {
      const possibleWeather = weatherEvents.filter(w => w.seasons.includes(season));
      for (let i = 0; i < this._forecast.length; i++) {
        if (Math.random() < scrambleChance && possibleWeather.length > 0) {
          // Replace with a random weather or clear
          if (Math.random() < 0.5) {
            this._forecast[i] = { ...this._forecast[i], name: 'Clear', description: 'Clear skies expected.', domainsAffected: [], severity: 0 };
          } else {
            const decoy = possibleWeather[Math.floor(Math.random() * possibleWeather.length)];
            const effects = decoy.systemEffects ?? decoy.systemStress ?? {};
            const domainsAffected = domainKeys.filter(d => effects[d] !== undefined);
            const severityMap = { low: 1, medium: 1, high: 2, extreme: 3 };
            let maxSev = 1;
            for (const val of Object.values(effects)) {
              if (typeof val === 'string') maxSev = Math.max(maxSev, severityMap[val] ?? 1);
              else if (typeof val === 'number') maxSev = Math.max(maxSev, val >= 2.5 ? 3 : val >= 1.5 ? 2 : 1);
            }
            this._forecast[i] = { ...this._forecast[i], name: decoy.name, description: decoy.description, domainsAffected, severity: maxSev };
          }
        }
      }
    }

    // Sync forecast to state so HUD and other systems can read it
    this.state.weatherForecast = this._forecast;
    this.eventBus.emit('weather:forecastUpdated', { forecast: this._forecast });
  }

  /** Get the current 3-day weather forecast. */
  get forecast() {
    return this._forecast;
  }

  // ── Config Accessors ──────────────────────────────────────────────
  // These methods source event data from gameConfig, making it the single
  // source of truth. The config format uses slightly different field names
  // than the runtime format, so we normalize here.

  /** Get weather events from config (with runtime-compatible fields). */
  _getWeatherEvents() {
    const configEvents = this.state.config?.weatherEvents;
    if (!Array.isArray(configEvents) || configEvents.length === 0) return [];
    return configEvents.map(evt => ({
      ...evt,
      // Config uses durationHours; runtime uses durationSec. Convert mid-range to seconds.
      durationSec: evt.durationSec ?? (Array.isArray(evt.durationHours)
        ? Math.floor(((evt.durationHours[0] + evt.durationHours[1]) / 2) / 24 * 270)
        : 120),
      // Config systemEffects → runtime systemStress (convert severity labels to multipliers)
      systemStress: evt.systemStress ?? this._convertSystemEffects(evt.systemEffects),
    }));
  }

  /** Get random events from config (with runtime-compatible fields). */
  _getRandomEvents() {
    const configEvents = this.state.config?.randomEvents;
    if (!Array.isArray(configEvents) || configEvents.length === 0) return [];
    return configEvents.map(evt => ({
      ...evt,
      durationSec: evt.durationSec ?? 60,
      reputationImpact: evt.reputationImpact ?? evt.reputationPenalty ?? 0,
      // Map config trigger format to runtime format
      triggerCondition: evt.triggerCondition ?? this._inferTriggerCondition(evt),
      isInspection: evt.name === 'Health Inspection',
      isVIP: evt.name === 'VIP Visit',
      isSponsorVisit: evt.sponsorRisk ?? false,
      isChampionship: evt.name === 'Championship Announcement',
    }));
  }

  /** Get positive events (from config if available, otherwise fallback). */
  _getPositiveEvents() {
    const configEvents = this.state.config?.positiveEvents;
    if (Array.isArray(configEvents) && configEvents.length > 0) return configEvents;
    return FALLBACK_POSITIVE_EVENTS;
  }

  /** Convert config systemEffects (severity labels) to runtime systemStress (multipliers). */
  _convertSystemEffects(effects) {
    if (!effects) return {};
    const stressMap = { low: 1.2, medium: 1.5, high: 2.0, extreme: 2.5 };
    const result = {};
    for (const [key, val] of Object.entries(effects)) {
      result[key] = typeof val === 'number' ? val : (stressMap[val] ?? 1.5);
    }
    return result;
  }

  /** Infer trigger condition from config triggerConditions object. */
  _inferTriggerCondition(evt) {
    const cond = evt.triggerConditions;
    if (!cond) return null;
    if (cond.minReputation) return 'highReputation';
    if (cond.lowMaintenance || cond.oldEquipment || cond.freezeRisk || cond.neglectedDrainage || cond.poorAirFiltration) return 'lowFilterCondition';
    if (cond.activeSponsor || cond.lateSeason || cond.highReputation) return 'highReputation';
    return null;
  }

  // ── Pipe Freeze ──────────────────────────────────────────────────

  /**
   * During an active weather event with specialRisk === 'pipeFreezeChance',
   * 20% chance per game day of a pipe freeze. Only triggers once per event.
   */
  _checkPipeFreeze() {
    const activeEvent = this.state.activeEvent;
    if (!activeEvent) return;
    if (activeEvent.specialRisk !== 'pipeFreezeChance') return;
    if (this._pipeFreezeTriggered) return;

    if (Math.random() > 0.20) return;

    this._pipeFreezeTriggered = true;

    // Degrade all water and drainage domain filters by 15-20% of maxCondition
    const affected = this.state.filters.filter(
      f => f.domain === 'water' || f.domain === 'drainage'
    );
    for (const filter of affected) {
      const degradePercent = 0.15 + Math.random() * 0.05; // 15-20%
      const damage = Math.floor(filter.maxCondition * degradePercent);
      filter.condition = Math.max(0, filter.condition - damage);
      // Recalculate efficiency based on condition
      if (filter.maxCondition > 0) {
        filter.efficiency = Math.max(0, filter.condition / filter.maxCondition);
      }
    }

    this.eventBus.emit('event:pipeFreeze', { affectedCount: affected.length });
    this.eventBus.emit('ui:message', {
      text: 'PIPE FREEZE! Cold temperatures have frozen pipes -- water system filters damaged!',
      type: 'danger',
    });
  }
}
