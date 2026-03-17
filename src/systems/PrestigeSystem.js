/**
 * PrestigeSystem — Persistent cross-playthrough progression.
 *
 * Stores legacy points and permanent unlocks in localStorage (separate from
 * save data) so they persist across all games. Players earn legacy points
 * when a game ends (win or lose) and spend them on permanent bonuses.
 */

const STORAGE_KEY = 'raptors_prestige';

const DEFAULT_PRESTIGE = {
  legacyPoints: 0,
  totalGamesPlayed: 0,
  totalWins: 0,
  bestGrade: null,
  unlocks: {
    headStart: false,       // $7,500 starting money
    veteranStaff: false,    // 1 free Level 2 staff
    blueprintLibrary: false, // T2 unlocked from day 1
    hanksLegacy: false,     // 2 Hank's notes pre-found
    reputationBoost: false, // Start at 40 rep
    luckyStreak: false,     // +5% positive event chance
    goldenFilters: false,   // cosmetic gold tint on T4 filters
    masterPlanner: false,   // weather forecast unlocked at start
    veteranManager: false,  // $7,500 starting money
    legend: false,          // free tier 2 filter at start
  },
};

const UNLOCK_DEFINITIONS = [
  { id: 'headStart',        name: 'Head Start',        description: 'Start each game with $7,500 instead of $5,000.', cost: 100 },
  { id: 'veteranStaff',     name: 'Veteran Staff',     description: 'Begin with 1 free Level 2 staff member.',        cost: 150 },
  { id: 'blueprintLibrary', name: 'Blueprint Library',  description: 'T2 filters available from day 1.',              cost: 200 },
  { id: 'hanksLegacy',      name: "Hank's Legacy",     description: "Start with 2 of Hank's notes already found.",    cost: 120 },
  { id: 'reputationBoost',  name: 'Reputation Boost',  description: 'Start at 40 reputation instead of 35.',          cost: 80 },
  { id: 'luckyStreak',      name: 'Lucky Streak',      description: '+5% chance for positive events.',                cost: 250 },
  // Enhanced prestige rewards (tiered by prestige point cost)
  { id: 'goldenFilters',    name: 'Golden Filters',    description: 'Cosmetic gold tint on tier 4 filters. A mark of excellence.',           cost: 1, tier: 'bronze' },
  { id: 'masterPlanner',    name: 'Master Planner',    description: 'Start new games with weather forecast already unlocked.',               cost: 2, tier: 'silver' },
  { id: 'veteranManager',   name: 'Veteran Manager',   description: 'Start each game with $7,500 instead of the default.',                  cost: 3, tier: 'gold' },
  { id: 'legend',           name: 'Legend',             description: 'Start with a free tier 2 filter pre-installed.',                        cost: 5, tier: 'platinum' },
];

const DIFFICULTY_MULTIPLIERS = {
  rookie: 0.5,
  veteran: 1.0,
  allStar: 1.5,
  hallOfFame: 2.0,
};

export class PrestigeSystem {
  constructor() {
    this._data = this.load();
  }

  /** Read prestige data from localStorage, returning defaults if missing. */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with defaults for forward-compat
        return {
          ...DEFAULT_PRESTIGE,
          ...parsed,
          unlocks: { ...DEFAULT_PRESTIGE.unlocks, ...(parsed.unlocks ?? {}) },
        };
      }
    } catch { /* corrupt data — fall through to defaults */ }
    return JSON.parse(JSON.stringify(DEFAULT_PRESTIGE));
  }

  /** Write current prestige data to localStorage. */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    } catch { /* storage full or unavailable */ }
  }

  /** Add legacy points and persist. */
  addPoints(amount) {
    this._data.legacyPoints += Math.max(0, Math.floor(amount));
    this.save();
  }

  /**
   * Purchase an unlock if the player has enough points.
   * Returns true on success, false if insufficient points or already owned.
   */
  purchaseUnlock(id, cost) {
    if (this._data.unlocks[id]) return false;
    if (this._data.legacyPoints < cost) return false;
    this._data.legacyPoints -= cost;
    this._data.unlocks[id] = true;
    this.save();
    return true;
  }

  /** Return the current unlock state object. */
  getUnlocks() {
    return { ...this._data.unlocks };
  }

  /** Return the full prestige data (points, stats, unlocks). */
  getData() {
    return { ...this._data, unlocks: { ...this._data.unlocks } };
  }

  /** Return unlock definitions with current status. */
  getUnlockDefinitions() {
    return UNLOCK_DEFINITIONS.map(def => ({
      ...def,
      unlocked: !!this._data.unlocks[def.id],
    }));
  }

  /** Whether the prestige shop should be visible (any points earned or any unlock purchased). */
  isVisible() {
    if (this._data.legacyPoints > 0) return true;
    if (this._data.totalGamesPlayed > 0) return true;
    return Object.values(this._data.unlocks).some(v => v);
  }

  /**
   * Calculate legacy points earned from a completed game.
   * @param {object} state - The game state at time of game end.
   * @param {boolean} isWin - Whether the player won.
   * @returns {object} Breakdown of points earned.
   */
  calculateCompletionPoints(state, isWin) {
    const difficulty = state.difficulty ?? 'veteran';
    const multiplier = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;

    const seasonsSurvived = (state.season ?? 1);
    const basePoints = seasonsSurvived * 10;
    const winBonus = isWin ? 100 : 0;

    // Stadium of the Year check — awarded if the achievement exists or stadiumOfTheYearDays hit threshold
    const stadiumOfYear = (state.stadiumOfTheYearDays ?? 0) >= (state.config?.gamesPerSeason ?? 80) ? 50 : 0;

    // Sandbox goals completed
    let sandboxPoints = 0;
    if (state.sandboxGoals) {
      sandboxPoints = state.sandboxGoals.filter(g => g.completed).length * 25;
    }

    const subtotal = basePoints + winBonus + stadiumOfYear + sandboxPoints;
    const total = Math.floor(subtotal * multiplier);

    return {
      basePoints,
      winBonus,
      stadiumOfYear,
      sandboxPoints,
      multiplier,
      difficulty,
      total,
    };
  }

  /**
   * Record a completed game: tally stats and award legacy points.
   * @param {object} state - The game state at time of game end.
   * @param {boolean} isWin - Whether the player won.
   * @returns {object} Points breakdown from calculateCompletionPoints.
   */
  recordGameEnd(state, isWin) {
    this._data.totalGamesPlayed++;
    if (isWin) this._data.totalWins++;

    // Track best inspection grade
    const grade = state.lastInspectionGrade;
    if (grade) {
      const gradeRank = { A: 5, B: 4, C: 3, D: 2, F: 1 };
      const currentBestRank = gradeRank[this._data.bestGrade] ?? 0;
      if ((gradeRank[grade] ?? 0) > currentBestRank) {
        this._data.bestGrade = grade;
      }
    }

    const breakdown = this.calculateCompletionPoints(state, isWin);
    this.addPoints(breakdown.total);

    return breakdown;
  }

  /**
   * Apply prestige unlocks to a freshly initialized game state.
   * Call this AFTER _initDefaults and AFTER difficulty is set.
   */
  applyUnlocks(state) {
    const unlocks = this._data.unlocks;

    if (unlocks.headStart) {
      state.money = 7500;
    }

    if (unlocks.reputationBoost) {
      state.reputation = 40;
    }

    if (unlocks.hanksLegacy) {
      // Add 2 pre-found notes (pick first 2 canonical note IDs)
      const preNotes = ['note_1', 'note_2'];
      for (const noteId of preNotes) {
        if (!state.hanksNotes.includes(noteId)) {
          state.hanksNotes.push(noteId);
        }
      }
    }

    if (unlocks.veteranStaff) {
      state.staffList.push({
        id: 'prestige_veteran',
        name: 'Legacy Technician',
        specialization: 'general',
        level: 2,
        xp: 150,
        wagePerDay: 200,
        morale: 85,
        assignedDomain: null,
      });
    }

    if (unlocks.blueprintLibrary) {
      // Set flag that Shop checks to allow T2 regardless of reputation
      state.storyFlags = state.storyFlags ?? {};
      state.storyFlags.prestigeBlueprintLibrary = true;
    }

    if (unlocks.luckyStreak) {
      // Set flag that EventSystem checks for +5% positive event chance
      state.storyFlags = state.storyFlags ?? {};
      state.storyFlags.prestigeLuckyStreak = true;
    }

    // Enhanced prestige rewards — stored on state.prestige for system reference
    state.prestige = state.prestige ?? {};

    if (unlocks.goldenFilters) {
      // Cosmetic gold tint flag on tier 4 filters
      state.prestige.goldenFilters = true;
      state.storyFlags = state.storyFlags ?? {};
      state.storyFlags.prestigeGoldenFilters = true;
    }

    if (unlocks.masterPlanner) {
      // Weather forecast already unlocked at game start
      state.prestige.masterPlanner = true;
      state.storyFlags = state.storyFlags ?? {};
      state.storyFlags.prestigeMasterPlanner = true;
      state.storyFlags.weatherForecastUnlocked = true;
    }

    if (unlocks.veteranManager) {
      // Start with $7,500
      state.prestige.veteranManager = true;
      state.money = 7500;
    }

    if (unlocks.legend) {
      // Start with a free tier 2 filter
      state.prestige.legendFilter = true;
      state.storyFlags = state.storyFlags ?? {};
      state.storyFlags.prestigeLegendFilter = true;
      // Add a free T2 air filter to the player's inventory for immediate placement
      if (!state.pendingPrestigeFilter) {
        state.pendingPrestigeFilter = { domain: 'air', tier: 2 };
      }
    }
  }
}
