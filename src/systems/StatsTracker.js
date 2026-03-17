/**
 * StatsTracker -- Listens to game events and updates persistent statistics
 * on the state.stats object.
 *
 * Tracks both lifetime stats and per-season stats (seasonal counters reset
 * at the start of each new season).
 */

export class StatsTracker {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;

    // Ensure stats object exists
    if (!this.state.stats) this._initStats();

    // --- Filter events ---
    eventBus.on('filter:added', () => {
      this.state.stats.filtersInstalled++;
      this.state.stats.seasonFiltersInstalled++;
    });

    eventBus.on('filter:repaired', () => {
      this.state.stats.filtersRepaired++;
      this.state.stats.seasonFiltersRepaired++;
    });

    eventBus.on('filter:upgraded', () => {
      this.state.stats.filtersUpgraded++;
    });

    eventBus.on('filter:broken', () => {
      this.state.stats.filtersBroken++;
      this.state.stats.seasonFiltersBroken++;
    });

    // --- Daily game tracking ---
    eventBus.on('game:newDay', () => {
      this.state.stats.totalGamesPlayed++;

      // Track peak reputation
      const rep = this.state.reputation ?? 0;
      if (rep > this.state.stats.highestReputation) {
        this.state.stats.highestReputation = rep;
      }

      // Track peak attendance
      const attPct = this.state.attendancePercent ?? 0;
      if (attPct > this.state.stats.bestAttendancePercent) {
        this.state.stats.bestAttendancePercent = attPct;
      }
    });

    // --- Economy tracking via inning end ---
    eventBus.on('economy:inningEnd', (data) => {
      if (data.income > 0) {
        this.state.stats.totalMoneyEarned += data.income;
      }
      if (data.expenses > 0) {
        this.state.stats.totalMoneySpent += data.expenses;
      }
    });

    // --- Weather / event tracking ---
    eventBus.on('event:started', (evt) => {
      // Count weather events (non-positive ones)
      const isPositive = evt.category === 'positive' || evt.isPositive;
      if (!isPositive) {
        this.state.stats.weatherEventsEndured++;
      }
    });

    // --- Loans ---
    eventBus.on('loan:taken', () => {
      this.state.stats.loansRequested++;
    });

    // --- Expansions ---
    eventBus.on('expansion:purchased', () => {
      this.state.stats.expansionsPurchased++;
    });

    // --- NPC chats ---
    eventBus.on('npc:chatComplete', () => {
      this.state.stats.npcChats++;
    });

    // --- Season tracking ---
    eventBus.on('season:started', () => {
      this.state.stats.seasonsCompleted++;
      // Reset seasonal counters
      this.state.stats.seasonFiltersInstalled = 0;
      this.state.stats.seasonFiltersBroken = 0;
      this.state.stats.seasonFiltersRepaired = 0;
    });

    // --- Season end: emit summary data ---
    eventBus.on('game:seasonEnd', (data) => {
      const stats = this.state.stats;
      const rep = this.state.reputation ?? 0;

      // Determine grade
      let grade;
      if (rep > 80) grade = 'A';
      else if (rep > 60) grade = 'B';
      else if (rep > 40) grade = 'C';
      else if (rep > 25) grade = 'D';
      else grade = 'F';

      eventBus.emit('season:summary', {
        season: data.season,
        gamesPlayed: stats.totalGamesPlayed,
        netProfit: data.profit,
        reputationEnd: Math.floor(rep),
        filtersInstalled: stats.seasonFiltersInstalled,
        filtersBroken: stats.seasonFiltersBroken,
        filtersRepaired: stats.seasonFiltersRepaired,
        grade,
      });
    });

    // Re-init stats on load if missing
    eventBus.on('state:loaded', () => {
      if (!this.state.stats) this._initStats();
    });
  }

  _initStats() {
    this.state.stats = {
      totalGamesPlayed: 0,
      totalMoneyEarned: 0,
      totalMoneySpent: 0,
      filtersInstalled: 0,
      filtersRepaired: 0,
      filtersUpgraded: 0,
      filtersBroken: 0,
      highestReputation: 0,
      bestAttendancePercent: 0,
      weatherEventsEndured: 0,
      loansRequested: 0,
      expansionsPurchased: 0,
      npcChats: 0,
      seasonsCompleted: 0,
      // Per-season counters (reset at season start)
      seasonFiltersInstalled: 0,
      seasonFiltersBroken: 0,
      seasonFiltersRepaired: 0,
    };
  }
}
