/**
 * ProgressionSystem — Reputation, unlocks, achievements, and win/lose conditions.
 *
 * Reputation is the central progression metric (0-100). It determines:
 *   - Stadium tier (Minor League → Major League)
 *   - Available upgrades and expansions
 *   - Sponsor tier and revenue potential
 *   - Win/lose conditions
 *
 * Also tracks milestones/achievements and checks for game-ending conditions.
 */

import { STORY_MILESTONES } from '../data/storyData.js';

// Off-season events that fire on specific off-season days
const OFF_SEASON_EVENTS = [
  {
    day: 3,
    name: 'Stadium Renovation Offer',
    description: 'A construction crew is offering discounted renovation work during the off-season. Invest now to strengthen a system before next season.',
    choices: [
      { label: 'Accept renovation (-$3,000, +3 domain health baseline)', cost: 3000, effect: 'renovation' },
      { label: 'Decline — save the money', cost: 0, effect: 'none' },
    ],
  },
  {
    day: 6,
    name: 'Scouting Report',
    description: 'Your network found a promising technician with rare skills. Send a scout to recruit them?',
    choices: [
      { label: 'Send scout (-$1,500, rare specialist added to hire pool)', cost: 1500, effect: 'scout' },
      { label: 'Skip scouting', cost: 0, effect: 'none' },
    ],
  },
  {
    day: 10,
    name: 'Community Day',
    description: 'The off-season is a great time to connect with the local community and build goodwill.',
    choices: [
      { label: 'Host a free event (-$500, +5 reputation)', cost: 500, effect: 'community_small' },
      { label: 'Charity game (-$1,000, +8 reputation)', cost: 1000, effect: 'community_large' },
      { label: 'Skip — focus on maintenance', cost: 0, effect: 'none' },
    ],
  },
  {
    day: 14,
    name: 'Equipment Clearance Sale',
    description: 'A supplier is clearing warehouse stock at steep discounts. Stock up now for next season?',
    choices: [
      { label: 'Buy discounted stock (-$2,000, 25% off T2-T3 filters for 10 days)', cost: 2000, effect: 'equipment_discount' },
      { label: 'Pass on the deal', cost: 0, effect: 'none' },
    ],
  },
  {
    day: 18,
    name: 'Preseason Inspection',
    description: 'You can request an early inspection before the season starts. Good scores earn a reputation boost, but failing costs reputation.',
    choices: [
      { label: 'Request inspection (if all domains >60%: +5 rep, else: -3 rep)', cost: 0, effect: 'preseason_inspection' },
      { label: 'Skip — no risk, no reward', cost: 0, effect: 'none' },
    ],
  },
];

// Monthly challenge definitions (post-championship-win content)
const MONTHLY_CHALLENGES = [
  {
    id: 'budget_crunch',
    name: 'Budget Crunch',
    description: '50% income for 30 days.',
    constraint: 'economyMultiplier',
    value: 0.5,
    duration: 30,
    prestigeReward: 2,
  },
  {
    id: 'skeleton_crew',
    name: 'Skeleton Crew',
    description: 'Max 2 staff allowed.',
    constraint: 'maxStaff',
    value: 2,
    duration: 30,
    prestigeReward: 2,
  },
  {
    id: 'perfect_record',
    name: 'Perfect Record',
    description: 'No domain drops below 60%.',
    constraint: 'minDomainHealth',
    value: 60,
    duration: 30,
    prestigeReward: 3,
  },
  {
    id: 'storm_season',
    name: 'Storm Season',
    description: '2x weather frequency.',
    constraint: 'weatherFrequency',
    value: 2,
    duration: 30,
    prestigeReward: 2,
  },
  {
    id: 'no_repairs',
    name: 'No Repairs',
    description: 'Cannot repair, only replace.',
    constraint: 'noRepairs',
    value: true,
    duration: 30,
    prestigeReward: 3,
  },
  {
    id: 'rookie_staff',
    name: 'Rookie Staff',
    description: 'All staff effectiveness at level 1.',
    constraint: 'staffLevelCap',
    value: 1,
    duration: 30,
    prestigeReward: 1,
  },
  {
    id: 'high_standards',
    name: 'High Standards',
    description: 'Reputation decay 2x faster.',
    constraint: 'repDecayMultiplier',
    value: 2,
    duration: 30,
    prestigeReward: 2,
  },
  {
    id: 'economy_mode',
    name: 'Economy Mode',
    description: 'Filters cost 1.5x.',
    constraint: 'filterCostMultiplier',
    value: 1.5,
    duration: 30,
    prestigeReward: 1,
  },
  {
    id: 'speed_run',
    name: 'Speed Run',
    description: 'Reach 80 rep from 50 in 30 days.',
    constraint: 'speedRunTarget',
    value: 80,
    duration: 30,
    prestigeReward: 3,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Max 6 total filters.',
    constraint: 'maxFilters',
    value: 6,
    duration: 30,
    prestigeReward: 2,
  },
  {
    id: 'fan_favorite',
    name: 'Fan Favorite',
    description: 'Reputation must stay above 70.',
    constraint: 'minReputation',
    value: 70,
    duration: 30,
    prestigeReward: 2,
  },
  {
    id: 'iron_manager',
    name: 'Iron Manager',
    description: 'No emergency repairs allowed.',
    constraint: 'noEmergencyRepairs',
    value: true,
    duration: 30,
    prestigeReward: 1,
  },
];

// Post-win sandbox challenge goals
const SANDBOX_GOALS = [
  { id: 'perfect_season', name: 'Perfect Season', description: 'All 4 domains > 80% health for an entire season (80 days)', completed: false },
  { id: 'mogul', name: 'Mogul', description: 'Reach $100,000 balance', completed: false },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Max relationship with all 6 NPCs', completed: false },
  { id: 'fully_loaded', name: 'Fully Loaded', description: 'All vent slots filled with T3+ filters', completed: false },
  { id: 'expansion_empire', name: 'Expansion Empire', description: 'Purchase all 5 expansions', completed: false },
];

// Stadium tiers based on reputation
const STADIUM_TIERS = [
  { min: 0,  max: 20,  name: 'Condemned',    level: 0 },
  { min: 21, max: 40,  name: 'Minor League',  level: 1 },
  { min: 41, max: 55,  name: 'Single-A',      level: 2 },
  { min: 56, max: 70,  name: 'Double-A',      level: 3 },
  { min: 71, max: 85,  name: 'Triple-A',      level: 4 },
  { min: 86, max: 100, name: 'Major League',   level: 5 },
];

// Stadium expansions that unlock at reputation thresholds
const EXPANSIONS = [
  { name: 'Luxury Box Wing',       reputationRequired: 41, revenueBonus: 0.30, description: 'Dedicated HVAC and premium water filtration required.' },
  { name: 'Press Box Level',       reputationRequired: 56, revenueBonus: 0.10, description: 'Dedicated air quality and network cooling needed.' },
  { name: 'Underground Utility Hub', reputationRequired: 71, costReduction: 0.15, description: 'Central drainage upgrade and backup generators.' },
  { name: 'Second Deck Expansion', reputationRequired: 80, revenueBonus: 0.50, description: 'Expanded capacity for all systems.' },
  { name: 'Championship Pavilion', reputationRequired: 90, revenueBonus: 1.00, description: 'Premium everything — the ultimate showcase.' },
];

export class ProgressionSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;

    // Track for win/lose conditions
    this._condemnedStreak = 0;  // consecutive games in condemned range
    this._seasonProfits = [];    // net profit per season
    this._lastQuality = 0.5;
    this._lastTier = null;
    this._unlockedExpansions = [];

    // Championship Game state (Feature 6)
    // Phases: null -> 'announced' (Day 1) -> 'gameDay' (Day 2) -> 'won'/'lost'
    this._championshipPhase = this.state.championshipPhase ?? null;
    this._championshipInning = 0;
    this._championshipDomainsFailed = false;

    // Monthly Challenge state (Feature 9 - post-win)
    this._challengeDayCounter = this.state.challengeDayCounter ?? 0;
    this._activeChallenge = this.state.activeChallenge ?? null;

    // Reputation drift accumulator — smooths reputation changes
    // BALANCE: 5-second interval (down from 10) for smoother, more responsive
    // drift. Players see quality changes reflected in reputation more quickly.
    this._repDriftTimer = 0;
    this._repDriftInterval = 5; // seconds between reputation drift ticks

    // Track season profit for end-of-season evaluation
    this._seasonStartMoney = this.state.money;

    // --- Fun Factor: Streak tracking ---
    // Streaks are persisted on state for save/load and ObjectivesPanel access
    this._goodDayStreak = this.state.goodDayStreak ?? 0;
    this._excellentDayStreak = 0; // consecutive days with quality >= 0.9
    this._bestStreak = this.state.bestStreak ?? 0;

    // --- Fun Factor: Daily bonus objectives ---
    this._dailyObjective = null;
    this._dailyObjectiveDay = 0;

    this._shownDay1Objective = false;

    this.eventBus.on('economy:inningEnd', (data) => this._onInningEnd(data));
    this.eventBus.on('game:newDay', (data) => this._onNewDay(data));
    this.eventBus.on('filtration:quality', (data) => {
      this._lastQuality = data.avgEfficiency;
    });
    this.eventBus.on('event:ended', (data) => this._onEventEnded(data));
    this.eventBus.on('filter:broken', () => this._onFilterBroken());
    // Re-sync all progression state after save/load
    this.eventBus.on('state:loaded', () => {
      this._goodDayStreak = this.state.goodDayStreak ?? 0;
      this._bestStreak = this.state.bestStreak ?? 0;
      this._excellentDayStreak = 0;
      this._seasonStartMoney = this.state.money;
      this._condemnedStreak = 0;
      this._lastTier = null; // will re-detect on next tick
      this._seasonProfits = [];
      this._dailyObjective = null;
      this._shownDay1Objective = true; // don't re-show on load
      // Restore championship and challenge state
      this._championshipPhase = this.state.championshipPhase ?? null;
      this._challengeDayCounter = this.state.challengeDayCounter ?? 0;
      this._activeChallenge = this.state.activeChallenge ?? null;
      // Rebuild unlocked expansions from state + current rep to prevent re-notification spam
      this._unlockedExpansions = [...(this.state.unlockedExpansions ?? [])];
      const expansions = this.state.config.expansions ?? EXPANSIONS;
      for (const expansion of expansions) {
        const id = expansion.id ?? expansion.name;
        if (this.state.reputation >= (expansion.reputationRequired ?? 100)) {
          if (!this._unlockedExpansions.includes(id)) {
            this._unlockedExpansions.push(id);
          }
        }
      }
    });
  }

  update(dt) {
    if (this.state.paused) return;

    // Day 1 objective message
    if (!this._shownDay1Objective && (this.state.gameDay ?? 1) <= 1) {
      this._shownDay1Objective = true;
      this.eventBus.emit('ui:message', {
        text: 'OBJECTIVE: Restore the stadium to Major League status (86+ reputation) and host a championship game.',
        type: 'info',
      });
    }

    // Gradual reputation drift toward filtration quality
    this._repDriftTimer += dt;
    if (this._repDriftTimer >= this._repDriftInterval) {
      this._repDriftTimer -= this._repDriftInterval;
      this._driftReputation();
    }
  }

  // ── Reputation ──────────────────────────────────────────────────

  /**
   * Reputation drifts toward current filter quality.
   * Good filters -> rep rises; bad filters -> rep falls.
   *
   * BALANCE: Drift rate is asymmetric — reputation falls faster than it rises.
   * This prevents "coasting" on past success and ensures that declining quality
   * has immediate consequences. The downward drift (0.08 coefficient) is ~2x
   * the upward drift (0.04), so neglecting maintenance feels punishing while
   * good play is rewarded at a steady, satisfying pace.
   */
  _driftReputation() {
    const quality = this._lastQuality;
    const rep = this.state.reputation;
    const filterCount = this.state.filters?.length ?? 0;

    // No filters = slow negative drift (stadium with no filtration gets worse)
    if (filterCount === 0) {
      const newRep = Math.max(0, rep - 0.3);
      this.state.set('reputation', Math.round(newRep * 10) / 10);
      return;
    }

    // Target reputation based on quality
    const targetRep = quality * 100;
    const diff = targetRep - rep;

    // Asymmetric drift: falls faster than it rises to punish neglect
    const driftCoeff = diff < 0 ? 0.08 : 0.04;
    const maxDrift = diff < 0 ? 0.8 : 0.5;
    const drift = Math.max(-maxDrift, Math.min(maxDrift, diff * driftCoeff));

    if (Math.abs(drift) > 0.01) {
      const newRep = Math.max(0, Math.min(100, rep + drift));
      this.state.set('reputation', Math.round(newRep * 10) / 10);
    }
  }

  /**
   * Apply a direct reputation change (from events, inspections, etc.)
   * Subject to daily budgeting: max +3 positive and -5 negative per day.
   */
  _changeReputation(amount, reason) {
    // Apply daily reputation budgeting caps
    const budgeted = this.state._budgetRepChange(amount);
    if (budgeted === 0) return;

    const newRep = Math.max(0, Math.min(100, this.state.reputation + budgeted));
    this.state.set('reputation', Math.round(newRep * 10) / 10);

    if (budgeted !== 0) {
      this.eventBus.emit('reputation:changed', {
        amount: budgeted,
        reason,
        newValue: this.state.reputation,
      });
    }
  }

  // ── Event Handlers ──────────────────────────────────────────────

  _onInningEnd(data) {
    this._checkMilestones();
    this._checkTierChange();
  }

  _onNewDay(data) {
    // Reset daily reputation budget at the START of each day, before any systems run
    this.state.resetDailyRepBudget();

    // If in off-season, process off-season day instead of normal game day
    if (this.state.offSeason) {
      this._processOffSeason();
      return;
    }

    // Tick down equipment discount from off-season clearance sale
    this._tickEquipmentDiscount();

    this._checkUnlocks();
    this._checkExpansions();
    this._checkSeasonAdvance();
    this._checkWinLoseConditions();
    this._checkStadiumOfTheYear();
    this._checkSandboxGoals();

    // Successful game day with good quality → small rep boost
    if (this._lastQuality >= 0.7) {
      const boost = this._lastQuality >= 0.9 ? 2 : 1;
      this._changeReputation(boost, 'Successful game day');
    } else if (this._lastQuality < 0.4) {
      this._changeReputation(-2, 'Poor filtration during game');
    }

    // --- Streak tracking ---
    this._trackStreaks();

    // --- Daily objectives ---
    this._checkDailyObjective();
    this._generateDailyObjective(data?.day ?? this.state.gameDay);
  }

  _onEventEnded(data) {
    if (!data) return;

    // Surviving a severe event without major failures → rep bonus
    if (data.degradeMultiplier >= 1.5 && this._lastQuality >= 0.6) {
      this._changeReputation(3, `Survived ${data.name} without failure`);
    }
  }

  _onFilterBroken() {
    this._changeReputation(-3, 'Filter failure during operations');
    this._dailyFilterBroke = true;
  }

  // ── Streaks & Daily Objectives ──────────────────────────────────

  _trackStreaks() {
    if (this._lastQuality >= 0.7) {
      this._goodDayStreak++;

      if (this._lastQuality >= 0.9) {
        this._excellentDayStreak++;
      } else {
        this._excellentDayStreak = 0;
      }

      // Track best streak
      if (this._goodDayStreak > this._bestStreak) {
        this._bestStreak = this._goodDayStreak;
      }

      // Persist streaks to state for save/load and ObjectivesPanel
      this.state.goodDayStreak = this._goodDayStreak;
      this.state.bestStreak = this._bestStreak;

      // Streak milestone rewards
      if (this._goodDayStreak === 3) {
        const bonus = 500;
        this.state.set('money', this.state.money + bonus);
        this._changeReputation(1, '3-day quality streak');
        this.eventBus.emit('ui:message', {
          text: `3-Day Streak! +$${bonus} bonus. Keep it up!`,
          type: 'success',
        });
      } else if (this._goodDayStreak === 7) {
        const bonus = 2000;
        this.state.set('money', this.state.money + bonus);
        this._changeReputation(3, '7-day quality streak');
        this.eventBus.emit('ui:message', {
          text: `7-Day Streak! +$${bonus} bonus + reputation boost!`,
          type: 'achievement',
        });
      } else if (this._goodDayStreak === 14) {
        const bonus = 5000;
        this.state.set('money', this.state.money + bonus);
        this._changeReputation(5, '14-day quality streak');
        this.eventBus.emit('ui:message', {
          text: `14-Day Streak! +$${bonus} -- you are on fire!`,
          type: 'achievement',
        });
      } else if (this._goodDayStreak % 10 === 0 && this._goodDayStreak > 14) {
        const bonus = 3000;
        this.state.set('money', this.state.money + bonus);
        this._changeReputation(2, `${this._goodDayStreak}-day quality streak`);
        this.eventBus.emit('ui:message', {
          text: `${this._goodDayStreak}-Day Streak! +$${bonus} milestone bonus!`,
          type: 'success',
        });
      }

      // Excellent streak bonuses (all systems above 90%)
      if (this._excellentDayStreak === 5) {
        const bonus = 3000;
        this.state.set('money', this.state.money + bonus);
        this._changeReputation(3, 'Excellence streak');
        this.eventBus.emit('ui:message', {
          text: `5-Day Excellence Streak! +$${bonus} -- pristine operations!`,
          type: 'achievement',
        });
      }
    } else {
      // Streak broken
      if (this._goodDayStreak >= 3) {
        this.eventBus.emit('ui:message', {
          text: `${this._goodDayStreak}-day streak ended. Quality dropped below threshold.`,
          type: 'warning',
        });
      }
      this._goodDayStreak = 0;
      this._excellentDayStreak = 0;
      this.state.goodDayStreak = 0;
    }
  }

  /**
   * Generate a daily bonus objective for variety.
   */
  _generateDailyObjective(day) {
    // Objectives rotate through a set of mini-challenges
    const objectives = [
      { id: 'no_breaks', description: 'No filter breakdowns today', check: () => true, reward: 800, repBonus: 1 },
      { id: 'high_quality', description: 'End the day with 80%+ average quality', check: () => this._lastQuality >= 0.8, reward: 1000, repBonus: 1 },
      { id: 'earn_income', description: 'Earn more than you spend today', check: () => this.state.income > this.state.expenses, reward: 600, repBonus: 0 },
      { id: 'all_healthy', description: 'Keep all domain health above 60%', check: () => {
        const h = this.state.domainHealth ?? {};
        return (h.air ?? 0) >= 60 && (h.water ?? 0) >= 60 && (h.hvac ?? 0) >= 60 && (h.drainage ?? 0) >= 60;
      }, reward: 1200, repBonus: 2 },
    ];

    const idx = day % objectives.length;
    this._dailyObjective = { ...objectives[idx], completed: false };
    this._dailyObjectiveDay = day;

    // Track if any filter broke today (for 'no_breaks' objective)
    this._dailyFilterBroke = false;

    this.eventBus.emit('ui:message', {
      text: `Daily Goal: ${this._dailyObjective.description}`,
      type: 'info',
    });
  }

  /**
   * Check if the daily objective was met at end of day.
   */
  _checkDailyObjective() {
    if (!this._dailyObjective || this._dailyObjective.completed) return;

    let met = false;

    if (this._dailyObjective.id === 'no_breaks') {
      met = !this._dailyFilterBroke;
    } else if (this._dailyObjective.check) {
      met = this._dailyObjective.check();
    }

    if (met) {
      this._dailyObjective.completed = true;
      this.state.set('money', this.state.money + this._dailyObjective.reward);
      if (this._dailyObjective.repBonus) {
        this._changeReputation(this._dailyObjective.repBonus, 'Daily objective completed');
      }
      this.eventBus.emit('ui:message', {
        text: `Daily Goal Complete! +$${this._dailyObjective.reward}`,
        type: 'achievement',
      });
    }
  }

  // ── Milestones ──────────────────────────────────────────────────

  _checkMilestones() {
    const milestones = this.state.config.milestones ?? STORY_MILESTONES;
    for (const m of milestones) {
      if (this.state.achievements.includes(m.id)) continue;
      if (this._conditionMet(m)) {
        this.state.achievements.push(m.id);
        this.eventBus.emit('progression:achievement', m);
        this.eventBus.emit('ui:message', {
          text: `Achievement unlocked: ${m.name} — ${m.description}`,
          type: 'success',
        });
      }
    }
  }

  _conditionMet(milestone) {
    switch (milestone.condition) {
      case 'money_gte': return this.state.money >= milestone.value;
      case 'day_gte': return this.state.gameDay >= milestone.value;
      case 'reputation_gte': return this.state.reputation >= milestone.value;
      case 'filters_gte': return this.state.filters.length >= milestone.value;
      case 'season_gte': return (this.state.season ?? 1) >= milestone.value;
      case 'expansions_gte': return (this.state.purchasedExpansions?.length ?? 0) >= milestone.value;
      case 'events_survived_gte': return (this.state.eventsSurvived ?? 0) >= milestone.value;
      case 'inspection_grade': return this.state.lastInspectionGrade === milestone.value;
      case 'championship_hosted': return !!this.state.championshipHosted;
      // Story milestone conditions
      case 'relationship_gte': {
        const rel = this.state.npcRelationships?.[milestone.npcId] ?? 0;
        return rel >= milestone.value;
      }
      case 'notes_found_gte':
        return (this.state.hanksNotes?.length ?? 0) >= milestone.value;
      case 'chapter_gte':
        return (this.state.storyChapter ?? 1) >= milestone.value;
      case 'choice_made':
        return !!this.state.storyFlags?.[milestone.value];
      default: return false;
    }
  }

  // ── Unlocks ─────────────────────────────────────────────────────

  /**
   * Unlock upgrade tiers and features based on reputation tier.
   * Uses config.reputation.tiers which defines unlocks per tier bracket.
   */
  _checkUnlocks() {
    const tiers = this.state.config.reputation?.tiers ?? [];
    const rep = this.state.reputation;

    for (const tier of tiers) {
      if (rep < tier.min) continue;
      const unlocks = tier.unlocks ?? [];
      for (const unlock of unlocks) {
        if (this.state.unlockedFeatures?.includes(unlock)) continue;
        if (!this.state.unlockedFeatures) this.state.unlockedFeatures = [];
        this.state.unlockedFeatures.push(unlock);
        this.eventBus.emit('progression:unlock', { feature: unlock, tier: tier.name });
        this.eventBus.emit('ui:message', {
          text: `Unlocked: ${unlock} (${tier.name} tier)!`,
          type: 'success',
        });
      }
    }
  }

  // ── Stadium Expansions ──────────────────────────────────────────

  _checkExpansions() {
    const expansions = this.state.config.expansions ?? EXPANSIONS;
    for (const expansion of expansions) {
      const id = expansion.id ?? expansion.name;
      if (this._unlockedExpansions.includes(id)) continue;
      if (this.state.reputation >= (expansion.reputationRequired ?? 100)) {
        this._unlockedExpansions.push(id);
        // Persist unlocked expansions on state for save/load and UI
        if (!this.state.unlockedExpansions.includes(id)) {
          this.state.unlockedExpansions.push(id);
        }
        this.eventBus.emit('expansion:unlocked', expansion);
        this.eventBus.emit('progression:expansion', expansion);
        this.eventBus.emit('ui:message', {
          text: `Stadium expansion available: ${expansion.name}! Press X or open Expansions panel to purchase.`,
          type: 'success',
        });
      }
    }
  }

  // ── Tier Tracking ───────────────────────────────────────────────

  _checkTierChange() {
    const tier = this.getCurrentTier();
    if (this._lastTier && tier.name !== this._lastTier.name) {
      const promoted = tier.level > this._lastTier.level;
      this.eventBus.emit('progression:tierChange', {
        from: this._lastTier,
        to: tier,
        promoted,
      });
      this.eventBus.emit('ui:message', {
        text: promoted
          ? `Promoted to ${tier.name}!`
          : `Demoted to ${tier.name}.`,
        type: promoted ? 'success' : 'danger',
      });
    }
    this._lastTier = tier;
  }

  getCurrentTier() {
    const rep = this.state.reputation;
    for (const tier of STADIUM_TIERS) {
      if (rep >= tier.min && rep <= tier.max) {
        return { ...tier };
      }
    }
    return { ...STADIUM_TIERS[0] };
  }

  // ── Season Advancement ─────────────────────────────────────────

  _checkSeasonAdvance() {
    const gamesPerSeason = this.state.config.gamesPerSeason ?? 80;
    const currentDay = this.state.gameDay ?? 1;
    const currentSeason = this.state.season ?? 1;

    // Check if we've passed the season boundary
    const expectedSeason = Math.floor((currentDay - 1) / gamesPerSeason) + 1;
    if (expectedSeason > currentSeason) {
      // Record season profit for lose-condition tracking
      const profit = this.state.money - (this._seasonStartMoney ?? this.state.money);
      this.recordSeasonProfit(profit);
      this._seasonStartMoney = this.state.money;

      // Enter off-season instead of immediately advancing
      const offSeasonDays = this.state.config.offSeasonDays ?? 20;
      this.state.set('offSeason', true);
      this.state.set('offSeasonDaysLeft', offSeasonDays);

      // Reset Stadium of the Year counter at season end
      this.state.set('stadiumOfTheYearDays', 0);

      // Reset off-season choices for the new off-season
      this.state.offSeasonChoices = {};

      this.eventBus.emit('game:seasonEnd', {
        season: currentSeason,
        profit,
        newSeason: currentSeason + 1,
      });
      this.eventBus.emit('ui:message', {
        text: `Season ${currentSeason} complete! Profit: $${profit.toLocaleString()}. OFF-SEASON begins (${offSeasonDays} days).`,
        type: profit >= (this.state.config.economy?.minSeasonProfit ?? 5000) ? 'success' : 'warning',
      });
    }
  }

  /**
   * Tick down the equipment discount from off-season clearance sale.
   * Runs once per in-season game day.
   */
  _tickEquipmentDiscount() {
    const choices = this.state.offSeasonChoices;
    if (!choices || !choices.equipmentDiscountDaysLeft) return;

    choices.equipmentDiscountDaysLeft--;
    if (choices.equipmentDiscountDaysLeft <= 0) {
      choices.equipmentDiscountDaysLeft = 0;
      if (this.state.storyFlags) {
        this.state.storyFlags.offSeasonEquipmentDiscount = 0;
      }
      this.eventBus.emit('ui:message', {
        text: 'Equipment clearance discount has expired.',
        type: 'info',
      });
    }
  }

  // ── Off-Season Processing ───────────────────────────────────────

  /**
   * Process an off-season day. No games are played — just daily costs at reduced rates.
   * Called from _onNewDay when state.offSeason is true.
   */
  _processOffSeason() {
    const daysLeft = this.state.offSeasonDaysLeft - 1;
    this.state.set('offSeasonDaysLeft', daysLeft);

    // Calculate which off-season day we're on (1-based)
    const totalOffSeasonDays = this.state.config.offSeasonDays ?? 20;
    const offSeasonDay = totalOffSeasonDays - daysLeft;

    // Check for off-season events
    this._checkOffSeasonEvent(offSeasonDay);

    // Show contextual planning tip
    this._showOffSeasonTip(offSeasonDay);

    // Show progress notification every 5 days
    if (daysLeft > 0 && daysLeft % 5 === 0) {
      this.eventBus.emit('ui:message', {
        text: `OFF-SEASON: ${daysLeft} days remaining`,
        type: 'info',
      });
    }

    if (daysLeft <= 0) {
      // Off-season is over — advance season and resume play
      const currentSeason = this.state.season ?? 1;
      const newSeason = currentSeason + 1;
      this.state.set('offSeason', false);
      this.state.set('offSeasonDaysLeft', 0);
      this.state.set('season', newSeason);

      // Clear equipment discount day counter if active
      if (this.state.offSeasonChoices?.equipmentDiscountDaysLeft > 0) {
        // Discount carries into new season — tracked separately
      }

      this.eventBus.emit('season:started', { season: newSeason });
      this.eventBus.emit('ui:message', {
        text: `Season ${newSeason} begins! Play ball!`,
        type: 'success',
      });
    }
  }

  /**
   * Check if an off-season event should fire on this day.
   */
  _checkOffSeasonEvent(offSeasonDay) {
    if (!this.state.offSeasonChoices) {
      this.state.offSeasonChoices = {};
    }

    const event = OFF_SEASON_EVENTS.find(e => e.day === offSeasonDay);
    if (!event) return;

    // Don't re-fire events already handled this off-season
    if (this.state.offSeasonChoices[`event_${event.day}`]) return;

    // Pause the game so the player can read and decide
    this.eventBus.emit('game:pause');

    // Emit event for the UI to present a decision dialog
    this.eventBus.emit('offseason:event', {
      ...event,
      onChoice: (choiceIndex) => {
        const choice = event.choices[choiceIndex];
        this._resolveOffSeasonChoice(event, choiceIndex);
        // Don't resume if a follow-up dialog is expected (renovation domain pick)
        if (choice?.effect !== 'renovation') {
          this.eventBus.emit('game:resume');
        }
      },
    });
  }

  /**
   * Resolve the player's choice for an off-season event.
   */
  _resolveOffSeasonChoice(event, choiceIndex) {
    const choice = event.choices[choiceIndex];
    if (!choice) return;

    // Record the choice
    if (!this.state.offSeasonChoices) {
      this.state.offSeasonChoices = {};
    }
    this.state.offSeasonChoices[`event_${event.day}`] = {
      eventName: event.name,
      choiceLabel: choice.label,
      effect: choice.effect,
    };

    // Deduct cost
    if (choice.cost > 0) {
      if (this.state.money < choice.cost) {
        this.eventBus.emit('ui:message', {
          text: `Not enough funds! Need $${choice.cost.toLocaleString()}.`,
          type: 'warning',
        });
        // Undo the recorded choice so they can try again
        delete this.state.offSeasonChoices[`event_${event.day}`];
        // Re-emit the event with resume logic
        this.eventBus.emit('offseason:event', {
          ...event,
          onChoice: (ci) => {
            const retryChoice = event.choices[ci];
            this._resolveOffSeasonChoice(event, ci);
            if (retryChoice?.effect !== 'renovation') {
              this.eventBus.emit('game:resume');
            }
          },
        });
        return;
      }
      this.state.set('money', this.state.money - choice.cost);
    }

    // Apply effects
    switch (choice.effect) {
      case 'renovation':
        // Player picks domain — emit a follow-up choice
        this.eventBus.emit('offseason:pickDomain', {
          title: 'Choose Domain to Renovate',
          description: 'Which system gets the +3 health baseline boost?',
          onPick: (domain) => {
            const health = this.state.domainHealth ?? {};
            health[domain] = Math.min(100, (health[domain] ?? 50) + 3);
            this.state.domainHealth = { ...health };
            this.eventBus.emit('ui:message', {
              text: `Renovation complete! ${domain.toUpperCase()} health baseline +3.`,
              type: 'success',
            });
            this.eventBus.emit('game:resume');
          },
        });
        break;

      case 'scout': {
        // Add a rare staff candidate to the hire pool
        const specializations = ['airTech', 'plumber', 'electrician'];
        const spec = specializations[Math.floor(Math.random() * specializations.length)];
        const candidate = {
          name: `Scout Find #${(this.state.season ?? 1)}`,
          specialization: spec,
          wagePerDay: 120 + Math.floor(Math.random() * 60),
          experience: 'veteran',
          morale: 80,
          scoutedCandidate: true,
        };
        if (!this.state.offSeasonChoices._scoutedCandidates) {
          this.state.offSeasonChoices._scoutedCandidates = [];
        }
        this.state.offSeasonChoices._scoutedCandidates.push(candidate);
        this.eventBus.emit('staff:scoutedCandidate', candidate);
        this.eventBus.emit('ui:message', {
          text: `Scout found a ${spec} specialist! Check the Crew panel to hire.`,
          type: 'success',
        });
        break;
      }

      case 'community_small': {
        // Bypass daily rep budget — off-season events are one-time strategic decisions
        const newRep5 = Math.max(0, Math.min(100, this.state.reputation + 5));
        this.state.set('reputation', Math.round(newRep5 * 10) / 10);
        this.eventBus.emit('ui:message', {
          text: 'Community event was a hit! Reputation +5.',
          type: 'success',
        });
        break;
      }

      case 'community_large': {
        const newRep8 = Math.max(0, Math.min(100, this.state.reputation + 8));
        this.state.set('reputation', Math.round(newRep8 * 10) / 10);
        this.eventBus.emit('ui:message', {
          text: 'Charity game packed the house! Reputation +8.',
          type: 'success',
        });
        break;
      }

      case 'equipment_discount':
        // Set flag: 25% off T2-T3 filters for first 10 days of next season
        this.state.offSeasonChoices.equipmentDiscountDaysLeft = 10;
        if (!this.state.storyFlags) this.state.storyFlags = {};
        this.state.storyFlags.offSeasonEquipmentDiscount = 25; // percent
        this.eventBus.emit('ui:message', {
          text: 'Equipment stocked! 25% off T2-T3 filters for the first 10 days of next season.',
          type: 'success',
        });
        break;

      case 'preseason_inspection': {
        const health = this.state.domainHealth ?? {};
        const allAbove60 = (health.air ?? 0) > 60 && (health.water ?? 0) > 60 &&
                           (health.hvac ?? 0) > 60 && (health.drainage ?? 0) > 60;
        if (allAbove60) {
          // Bypass daily rep budget for off-season strategic decisions
          const newRepI = Math.max(0, Math.min(100, this.state.reputation + 5));
          this.state.set('reputation', Math.round(newRepI * 10) / 10);
          this.eventBus.emit('ui:message', {
            text: 'Preseason inspection passed! All systems above threshold. Reputation +5.',
            type: 'success',
          });
        } else {
          const newRepF = Math.max(0, Math.min(100, this.state.reputation - 3));
          this.state.set('reputation', Math.round(newRepF * 10) / 10);
          this.eventBus.emit('ui:message', {
            text: 'Preseason inspection failed. Some systems below 60%. Reputation -3.',
            type: 'warning',
          });
        }
        break;
      }

      case 'none':
      default:
        this.eventBus.emit('ui:message', {
          text: `Passed on ${event.name}.`,
          type: 'info',
        });
        break;
    }
  }

  /**
   * Show a contextual planning tip during off-season based on game state analysis.
   * One tip per day, only on days without events.
   */
  _showOffSeasonTip(offSeasonDay) {
    // Don't show tips on event days — those get their own UI
    if (OFF_SEASON_EVENTS.some(e => e.day === offSeasonDay)) return;

    const health = this.state.domainHealth ?? {};
    const domains = ['air', 'water', 'hvac', 'drainage'];
    const staffList = this.state.staffList ?? [];
    const money = this.state.money;

    // Find lowest domain
    let lowestDomain = 'air';
    let lowestVal = 100;
    for (const d of domains) {
      if ((health[d] ?? 100) < lowestVal) {
        lowestVal = health[d] ?? 100;
        lowestDomain = d;
      }
    }

    // Check for unassigned staff
    const unassigned = staffList.filter(s => !s.assignedDomain);

    // Rotate through tips
    const tipIndex = offSeasonDay % 5;
    let tip = null;

    switch (tipIndex) {
      case 0:
        if (lowestVal < 70) {
          tip = `Consider investing in ${lowestDomain.toUpperCase()} before next season — it's at ${Math.floor(lowestVal)}%.`;
        }
        break;
      case 1:
        if (unassigned.length > 0) {
          tip = `You have ${unassigned.length} unassigned staff — assign them in the Crew panel for better coverage.`;
        }
        break;
      case 2:
        if (money > 3000) {
          tip = `You have $${money.toLocaleString()} saved — good time to upgrade filters or expand the stadium.`;
        } else if (money < 1000) {
          tip = `Budget is tight at $${money.toLocaleString()}. Consider signing contracts or taking a loan before the season starts.`;
        }
        break;
      case 3: {
        const filterCount = this.state.filters?.length ?? 0;
        if (filterCount > 0) {
          const wornFilters = this.state.filters.filter(f => f.maxCondition > 0 && (f.condition / f.maxCondition) < 0.5);
          if (wornFilters.length > 0) {
            tip = `${wornFilters.length} filter(s) below 50% condition — repair or replace before games start.`;
          }
        } else {
          tip = 'No filters installed! Open the Shop (S) to buy and place filters before the season starts.';
        }
        break;
      }
      case 4: {
        const rep = this.state.reputation;
        if (rep < 40) {
          tip = 'Reputation is low — focus on contracts and community events to rebuild before opening day.';
        } else if (rep >= 80) {
          tip = 'Reputation is strong! Aim for Stadium of the Year next season by keeping all systems above 80%.';
        }
        break;
      }
    }

    if (tip) {
      this.eventBus.emit('ui:message', {
        text: `OFF-SEASON TIP: ${tip}`,
        type: 'info',
      });
    }
  }

  // ── Stadium of the Year ─────────────────────────────────────────

  /**
   * Check Stadium of the Year win condition: all 4 domain healths > 80
   * AND reputation > 85 for 80 consecutive days (full season).
   */
  _checkStadiumOfTheYear() {
    const health = this.state.domainHealth ?? {};
    const rep = this.state.reputation;
    const winConfig = this.state.config.winConditions?.stadiumOfTheYear ?? {};
    const healthThreshold = winConfig.allSystemsAbove ?? 80;
    const repThreshold = winConfig.reputationAbove ?? 85;
    const requiredDays = this.state.config.gamesPerSeason ?? 80;

    const allHealthy = (health.air ?? 0) > healthThreshold &&
                       (health.water ?? 0) > healthThreshold &&
                       (health.hvac ?? 0) > healthThreshold &&
                       (health.drainage ?? 0) > healthThreshold;
    const repMet = rep > repThreshold;

    if (allHealthy && repMet) {
      const days = (this.state.stadiumOfTheYearDays ?? 0) + 1;
      this.state.set('stadiumOfTheYearDays', days);

      // Progress notifications every 20 days
      if (days % 20 === 0 && days < requiredDays) {
        this.eventBus.emit('ui:message', {
          text: `Stadium of the Year: ${days}/${requiredDays} qualifying days`,
          type: 'info',
        });
      }

      // Full season of qualifying — award!
      if (days >= requiredDays) {
        this.eventBus.emit('game:stadiumOfTheYear', {
          days,
          season: this.state.season ?? 1,
        });
        this.eventBus.emit('ui:message', {
          text: `STADIUM OF THE YEAR! ${days} consecutive qualifying days -- a legendary achievement!`,
          type: 'achievement',
        });
        // Reset so it can be earned again
        this.state.set('stadiumOfTheYearDays', 0);
      }
    } else {
      // Must be consecutive — reset counter
      if ((this.state.stadiumOfTheYearDays ?? 0) > 0) {
        this.state.set('stadiumOfTheYearDays', 0);
      }
    }
  }

  // ── Win / Lose Conditions ───────────────────────────────────────

  _checkWinLoseConditions() {
    const rep = this.state.reputation;
    const loseConfig = this.state.config.loseConditions ?? {};

    // Track condemned streak
    if (rep <= 20) {
      this._condemnedStreak++;
    } else {
      this._condemnedStreak = 0;
    }

    // LOSE: Reputation in condemned range for N consecutive games (GDD: 10)
    if (this._condemnedStreak >= (loseConfig.condemnedDuration ?? 10)) {
      // Set story flag so the condemned ending cutscene can trigger
      if (this.state.storyFlags) {
        this.state.storyFlags['stadiumCondemned'] = true;
      }
      this.eventBus.emit('game:lose', {
        reason: 'Stadium condemned! Reputation stayed critically low for too long.',
      });
      this.eventBus.emit('ui:message', {
        text: 'GAME OVER: Ridgemont Stadium has been condemned. The health department has sealed the doors.',
        type: 'danger',
      });
    }

    // LOSE: Two consecutive seasons with net financial loss
    const badSeasonLimit = loseConfig.consecutiveBadSeasons ?? 2;
    if (this._seasonProfits.length >= badSeasonLimit) {
      const recent = this._seasonProfits.slice(-badSeasonLimit);
      const minProfit = this.state.config.economy?.minSeasonProfit ?? 5000;
      if (recent.every(p => p < minProfit)) {
        this.eventBus.emit('game:lose', {
          reason: `${badSeasonLimit} consecutive unprofitable seasons. The owner has fired you.`,
        });
        this.eventBus.emit('ui:message', {
          text: `GAME OVER: ${badSeasonLimit} consecutive bad seasons. You've been replaced.`,
          type: 'danger',
        });
      }
    }

    // LOSE: Catastrophic failure (water + drainage domain health both critically low)
    const health = this.state.domainHealth ?? {};
    if ((health.water ?? 100) <= 5 && (health.drainage ?? 100) <= 5) {
      this.eventBus.emit('game:lose', {
        reason: 'Catastrophic failure! Water and drainage systems both critically degraded.',
      });
      this.eventBus.emit('ui:message', {
        text: 'GAME OVER: Stadium closed due to catastrophic system failure.',
        type: 'danger',
      });
    }

    // WIN: Major League tier triggers Championship Game event (multi-day)
    const winConfig = this.state.config.winConditions?.softVictory ?? {};
    if (rep >= (winConfig.reputationRequired ?? 86) && !this._championshipPhase && !this.state.championshipWon) {
      this._startChampionship();
    }

    // Process active championship
    if (this._championshipPhase) {
      this._updateChampionship();
    }

    // Post-win: monthly challenge rotation
    if (this.state.championshipWon) {
      this._updateMonthlyChallenge();
    }
  }

  // ── Championship Game (multi-day event) ──────────────────────────

  /**
   * Start the Championship Game sequence.
   * Day 1: Announcement + media coverage.
   * Day 2: The championship game itself — all domains must stay >70% for 9 innings.
   */
  _startChampionship() {
    this._championshipPhase = 'announced';
    this._championshipInning = 0;
    this._championshipDomainsFailed = false;
    this.state.championshipPhase = 'announced';

    this.eventBus.emit('championship:announced');
    this.eventBus.emit('ui:message', {
      text: 'CHAMPIONSHIP ANNOUNCED! Tomorrow is the big game. All domains must stay above 70% for the full 9 innings!',
      type: 'achievement',
    });
    this.eventBus.emit('ui:message', {
      text: 'Media coverage incoming -- weather stress 1.5x, 100% attendance. Prepare your systems!',
      type: 'warning',
    });
  }

  /**
   * Process championship state on each new day.
   */
  _updateChampionship() {
    if (this._championshipPhase === 'announced') {
      // Advance to game day
      this._championshipPhase = 'gameDay';
      this.state.championshipPhase = 'gameDay';
      this._championshipInning = 0;
      this._championshipDomainsFailed = false;

      // Apply championship game modifiers
      this.state.storyFlags = this.state.storyFlags ?? {};
      this.state.storyFlags.championshipActive = true;

      // Championship weather stress: 1.5x degradation via synthetic event overlay
      this.state.championshipStressMultiplier = 1.5;
      // Championship attendance: force 100%
      this.state.set('attendancePercent', 100);
      this.state.championshipAttendanceOverride = true;

      this.eventBus.emit('championship:started');
      this.eventBus.emit('ui:message', {
        text: 'CHAMPIONSHIP GAME DAY! Keep all 4 domains above 70% for all 9 innings to win!',
        type: 'achievement',
      });

      // Listen for inning updates during championship
      this._championshipInningHandler = (data) => {
        if (this._championshipPhase !== 'gameDay') return;
        this._championshipInning++;

        // Check all domains above 70%
        const health = this.state.domainHealth ?? {};
        const allAbove70 = (health.air ?? 0) >= 70 && (health.water ?? 0) >= 70 &&
                           (health.hvac ?? 0) >= 70 && (health.drainage ?? 0) >= 70;

        if (!allAbove70) {
          this._championshipDomainsFailed = true;
        }

        // After all 9 innings, resolve
        if (this._championshipInning >= 9) {
          this._resolveChampionship();
        }
      };
      this.eventBus.on('economy:inningEnd', this._championshipInningHandler);

    } else if (this._championshipPhase === 'gameDay') {
      // If we hit a new day without resolving (shouldn't happen normally), resolve
      this._resolveChampionship();
    }
  }

  /**
   * Resolve the championship game outcome.
   */
  _resolveChampionship() {
    // Clean up listener
    if (this._championshipInningHandler) {
      this.eventBus.off('economy:inningEnd', this._championshipInningHandler);
      this._championshipInningHandler = null;
    }

    // Clear championship modifiers
    if (this.state.storyFlags) {
      this.state.storyFlags.championshipActive = false;
    }
    this.state.championshipStressMultiplier = 1.0;
    this.state.championshipAttendanceOverride = false;

    if (this._championshipDomainsFailed) {
      // Championship lost — can try again when conditions are met
      this._championshipPhase = null;
      this.state.championshipPhase = null;

      this.eventBus.emit('championship:lost');
      this.eventBus.emit('ui:message', {
        text: 'CHAMPIONSHIP LOST! Domain health dropped below 70%. Maintain Major League status to try again.',
        type: 'danger',
      });
    } else {
      // Championship won!
      this._championshipPhase = 'won';
      this.state.championshipPhase = 'won';
      this.state.championshipWon = true;
      this.state.championshipHosted = true;
      this._challengeDayCounter = 0;
      this.state.challengeDayCounter = 0;

      this.eventBus.emit('championship:won');
      this.eventBus.emit('game:win', {
        reason: 'Championship game won! All domains held above 70% for the full game!',
      });
      this.eventBus.emit('ui:message', {
        text: 'CHAMPIONSHIP WON! You are the champion! Monthly challenges now available. Continue in sandbox mode!',
        type: 'achievement',
      });

      // Initialize sandbox goals
      this.initSandboxGoals();
    }
  }

  // ── Monthly Challenges (post-win) ────────────────────────────────

  /**
   * After championship win: rotate through challenges every 30 days.
   * Completing a challenge earns prestige points.
   */
  _updateMonthlyChallenge() {
    this._challengeDayCounter++;
    this.state.challengeDayCounter = this._challengeDayCounter;

    // Ensure completedChallenges array exists on state
    if (!this.state.completedChallenges) {
      this.state.completedChallenges = [];
    }

    // Check if active challenge failed its constraint (for fail-on-breach challenges)
    if (this._activeChallenge && !this._activeChallenge.completed && !this._activeChallenge.failed) {
      const breached = this._checkChallengeBreach(this._activeChallenge);
      if (breached) {
        this._activeChallenge.failed = true;
        this.state.activeChallenge = { ...this._activeChallenge };
        this.eventBus.emit('challenge:failed', this._activeChallenge);
        this.eventBus.emit('ui:message', {
          text: `CHALLENGE FAILED: "${this._activeChallenge.name}" -- constraint breached!`,
          type: 'danger',
        });
      }
    }

    // Check if active challenge is completed (survived the duration)
    if (this._activeChallenge && !this._activeChallenge.completed && !this._activeChallenge.failed) {
      const met = this._checkChallengeCondition(this._activeChallenge);
      if (met) {
        this._activeChallenge.completed = true;
        this.state.activeChallenge = { ...this._activeChallenge };
        const points = this._activeChallenge.prestigeReward ?? 1;

        // Track in completed list
        this.state.completedChallenges.push({
          id: this._activeChallenge.id,
          name: this._activeChallenge.name,
          completedDay: this.state.gameDay,
          prestigeEarned: points,
        });

        this.eventBus.emit('prestige:addPoints', { points });
        this.eventBus.emit('challenge:completed', this._activeChallenge);
        this.eventBus.emit('ui:message', {
          text: `CHALLENGE COMPLETE: "${this._activeChallenge.name}"! +${points} prestige point${points > 1 ? 's' : ''}!`,
          type: 'achievement',
        });
      }
    }

    // Every 30 days, assign a new challenge
    if (this._challengeDayCounter % 30 === 1 || !this._activeChallenge) {
      const challenges = this.state.config.challengeDefinitions ?? MONTHLY_CHALLENGES;
      if (challenges.length > 0) {
        // Pick next challenge (rotate, skipping recently completed ones if possible)
        const completed = this.state.completedChallenges ?? [];
        const completedIds = new Set(completed.map(c => c.id));
        let available = challenges.filter(c => !completedIds.has(c.id));
        if (available.length === 0) available = challenges; // all completed, cycle through again

        const idx = Math.floor(this._challengeDayCounter / 30) % available.length;
        const chosen = available[idx];
        this._activeChallenge = {
          ...chosen,
          completed: false,
          failed: false,
          startDay: this.state.gameDay,
          startMoney: this.state.money,
          startWeatherEvents: this.state.stats?.weatherEventsEndured ?? 0,
          startReputation: this.state.reputation,
        };
        this.state.activeChallenge = { ...this._activeChallenge };

        // Apply challenge constraint flags to state for other systems to check
        this.state.challengeConstraints = {
          type: chosen.constraint,
          value: chosen.value,
        };

        // Special setup for speed_run: drop rep to 50
        if (chosen.id === 'speed_run') {
          this.state.set('reputation', 50);
        }

        this.eventBus.emit('challenge:started', this._activeChallenge);
        this.eventBus.emit('ui:message', {
          text: `NEW MONTHLY CHALLENGE: "${this._activeChallenge.name}" -- ${this._activeChallenge.description}`,
          type: 'info',
        });
      }
    }
  }

  /**
   * Check if a monthly challenge's completion condition is met (survived the duration).
   * Most challenges complete after 30 days if the constraint was never breached.
   */
  _checkChallengeCondition(challenge) {
    const daysSinceStart = (this.state.gameDay ?? 0) - (challenge.startDay ?? 0);

    switch (challenge.id) {
      case 'budget_crunch':
        // Survive 30 days at 50% income -- completion = survived the period
        return daysSinceStart >= 29;
      case 'skeleton_crew':
        // Operate with max 2 staff for 30 days
        return daysSinceStart >= 29 && (this.state.staffList?.length ?? 0) <= 2;
      case 'perfect_record':
        // No domain drops below 60% for 30 days (breach checked separately)
        return daysSinceStart >= 29;
      case 'storm_season':
        // Survive 2x weather frequency for 30 days
        return daysSinceStart >= 29;
      case 'no_repairs':
        // Cannot repair, only replace for 30 days (constraint enforced by game systems)
        return daysSinceStart >= 29;
      case 'rookie_staff':
        // All staff effectiveness at level 1 for 30 days
        return daysSinceStart >= 29;
      case 'high_standards':
        // Reputation decay 2x faster -- survive 30 days above rep 50
        return daysSinceStart >= 29 && this.state.reputation >= 50;
      case 'economy_mode':
        // Filters cost 1.5x -- survive 30 days
        return daysSinceStart >= 29;
      case 'speed_run':
        // Reach 80 rep from 50 in 30 days
        return this.state.reputation >= 80;
      case 'minimalist':
        // Complete 30 days with max 6 total filters
        return daysSinceStart >= 29 && (this.state.filters?.length ?? 0) <= 6;
      case 'fan_favorite':
        // Reputation must stay above 70 for 30 days (breach checked separately)
        return daysSinceStart >= 29;
      case 'iron_manager':
        // No emergency repairs for 30 days (constraint enforced by game systems)
        return daysSinceStart >= 29;
      default:
        return false;
    }
  }

  /**
   * Check if a challenge's constraint has been breached (instant failure).
   * Challenges like "Perfect Record" or "Fan Favorite" fail immediately on breach.
   */
  _checkChallengeBreach(challenge) {
    const health = this.state.domainHealth ?? {};

    switch (challenge.id) {
      case 'perfect_record':
        // Fail if any domain drops below 60%
        return (health.air ?? 100) < 60 || (health.water ?? 100) < 60 ||
               (health.hvac ?? 100) < 60 || (health.drainage ?? 100) < 60;
      case 'fan_favorite':
        // Fail if reputation drops below 70
        return this.state.reputation < 70;
      case 'skeleton_crew':
        // Fail if more than 2 staff at any point
        return (this.state.staffList?.length ?? 0) > 2;
      case 'minimalist':
        // Fail if more than 6 filters at any point
        return (this.state.filters?.length ?? 0) > 6;
      case 'speed_run':
        // Fail if 30 days pass without reaching 80 rep
        return ((this.state.gameDay ?? 0) - (challenge.startDay ?? 0)) >= 30 &&
               this.state.reputation < 80;
      default:
        // Most challenges don't have instant-fail breaches
        return false;
    }
  }

  /**
   * Called at end of season to record profit for lose condition tracking.
   */
  recordSeasonProfit(profit) {
    this._seasonProfits.push(profit);
  }

  // ── Sandbox Goals (Post-Win) ───────────────────────────────────

  /**
   * Initialize sandbox goals after the player wins. Called once on game:win.
   */
  initSandboxGoals() {
    if (this.state.sandboxGoals) return; // already initialized
    this.state.sandboxGoals = SANDBOX_GOALS.map(g => ({ ...g }));
    // Track consecutive healthy days for "Perfect Season" goal
    this.state._sandboxHealthyDays = 0;
  }

  /**
   * Check sandbox goal completion each day (only after win).
   */
  _checkSandboxGoals() {
    const goals = this.state.sandboxGoals;
    if (!goals) return;

    for (const goal of goals) {
      if (goal.completed) continue;

      let met = false;
      switch (goal.id) {
        case 'perfect_season': {
          const h = this.state.domainHealth ?? {};
          const allAbove80 = (h.air ?? 0) > 80 && (h.water ?? 0) > 80 &&
                             (h.hvac ?? 0) > 80 && (h.drainage ?? 0) > 80;
          if (allAbove80) {
            this.state._sandboxHealthyDays = (this.state._sandboxHealthyDays ?? 0) + 1;
            if (this.state._sandboxHealthyDays >= (this.state.config.gamesPerSeason ?? 80)) {
              met = true;
            }
          } else {
            this.state._sandboxHealthyDays = 0;
          }
          break;
        }
        case 'mogul':
          met = this.state.money >= 100000;
          break;
        case 'social_butterfly': {
          const rels = this.state.npcRelationships ?? {};
          const npcIds = ['maggie', 'rusty', 'priya', 'bea', 'diego', 'fiona'];
          const maxThresholds = { maggie: 60, rusty: 55, priya: 50, bea: 55, diego: 45, fiona: 55 };
          met = npcIds.every(id => (rels[id] ?? 0) >= (maxThresholds[id] ?? 50));
          break;
        }
        case 'fully_loaded': {
          const filters = this.state.filters ?? [];
          if (filters.length > 0) {
            met = filters.every(f => (f.tier ?? 1) >= 3);
          }
          break;
        }
        case 'expansion_empire':
          met = (this.state.purchasedExpansions?.length ?? 0) >= 5;
          break;
      }

      if (met) {
        goal.completed = true;
        this.eventBus.emit('progression:achievement', { id: `sandbox_${goal.id}`, name: goal.name, description: goal.description });
        this.eventBus.emit('ui:message', {
          text: `Sandbox Goal Complete: ${goal.name}!`,
          type: 'achievement',
        });
      }
    }
  }

  // ── Public Getters ──────────────────────────────────────────────

  get unlockedExpansions() {
    return [...this._unlockedExpansions];
  }

  get condemnedStreak() {
    return this._condemnedStreak;
  }

  /**
   * Map current reputation to story chapter number.
   * Ch1: Minor League (21-40), Ch2: Single-A (41-55),
   * Ch3: Double-A (56-70), Ch4: Triple-A (71-85), Ch5: Major League (86-100)
   */
  getChapter() {
    const rep = this.state.reputation;
    if (rep >= 86) return 5;
    if (rep >= 71) return 4;
    if (rep >= 56) return 3;
    if (rep >= 41) return 2;
    return 1;
  }
}
