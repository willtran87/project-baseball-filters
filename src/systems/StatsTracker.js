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
      // Track per-season peak reputation
      if (rep > (this.state.stats.seasonPeakReputation ?? 0)) {
        this.state.stats.seasonPeakReputation = rep;
      }

      // Track peak attendance
      const attPct = this.state.attendancePercent ?? 0;
      if (attPct > this.state.stats.bestAttendancePercent) {
        this.state.stats.bestAttendancePercent = attPct;
      }

      // Accumulate domain health samples for season average calculation
      const health = this.state.domainHealth ?? {};
      const samples = this.state.stats.seasonDomainHealthSamples ?? { air: [], water: [], hvac: [], drainage: [] };
      for (const domain of ['air', 'water', 'hvac', 'drainage']) {
        samples[domain].push(health[domain] ?? 0);
      }
      this.state.stats.seasonDomainHealthSamples = samples;

      // Track season days for averaging
      this.state.stats.seasonDaysPlayed = (this.state.stats.seasonDaysPlayed ?? 0) + 1;
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
        this.state.stats.seasonCrisesHandled = (this.state.stats.seasonCrisesHandled ?? 0) + 1;
      }
    });

    // --- Staff XP tracking ---
    eventBus.on('staff:xpGained', (data) => {
      this.state.stats.seasonStaffXpGained = (this.state.stats.seasonStaffXpGained ?? 0) + (data.amount ?? 0);
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
      this.state.stats.seasonCrisesHandled = 0;
      this.state.stats.seasonPeakReputation = 0;
      this.state.stats.seasonDaysPlayed = 0;
      this.state.stats.seasonStaffXpGained = 0;
      this.state.stats.seasonStaffRepairsDone = 0;
      this.state.stats.seasonDomainHealthSamples = { air: [], water: [], hvac: [], drainage: [] };
      this.state.stats.seasonPeakDomainHealth = { air: 0, water: 0, hvac: 0, drainage: 0 };
    });

    // --- Season end: emit summary data with awards ---
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

      // Calculate season awards
      const awards = this._calculateSeasonAwards(data);

      eventBus.emit('season:summary', {
        season: data.season,
        gamesPlayed: stats.totalGamesPlayed,
        netProfit: data.profit,
        reputationEnd: Math.floor(rep),
        filtersInstalled: stats.seasonFiltersInstalled,
        filtersBroken: stats.seasonFiltersBroken,
        filtersRepaired: stats.seasonFiltersRepaired,
        grade,
        awards,
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
      // Season award tracking
      seasonCrisesHandled: 0,
      seasonPeakReputation: 0,
      seasonDaysPlayed: 0,
      seasonStaffXpGained: 0,
      seasonDomainHealthSamples: { air: [], water: [], hvac: [], drainage: [] },
      seasonPeakDomainHealth: { air: 0, water: 0, hvac: 0, drainage: 0 },
    };
  }

  /**
   * Calculate end-of-season awards based on accumulated stats.
   * Returns an array of { id, name, icon, description } objects.
   */
  _calculateSeasonAwards(seasonData) {
    const stats = this.state.stats;
    const awards = [];

    // -- Best Domain: domain with the highest average health across the season --
    const samples = stats.seasonDomainHealthSamples ?? { air: [], water: [], hvac: [], drainage: [] };
    const domainAvgs = [];
    for (const domain of ['air', 'water', 'hvac', 'drainage']) {
      const arr = samples[domain] ?? [];
      const avg = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      domainAvgs.push({ id: domain, avg });
    }
    const domainNames = { air: 'Air Quality', water: 'Water Filtration', hvac: 'HVAC', drainage: 'Drainage' };
    const bestDomain = domainAvgs.reduce((a, b) => a.avg >= b.avg ? a : b);
    if (bestDomain.avg > 40) {
      awards.push({
        id: 'best_domain',
        name: 'Best Domain',
        icon: 'TROPHY',
        description: `${domainNames[bestDomain.id]} (avg ${Math.floor(bestDomain.avg)}%)`,
      });
    }

    // -- Crisis Manager: survived crises this season --
    const crisesHandled = stats.seasonCrisesHandled ?? 0;
    if (crisesHandled >= 2) {
      awards.push({
        id: 'crisis_manager',
        name: 'Crisis Manager',
        icon: 'SHIELD',
        description: `Weathered ${crisesHandled} crisis event${crisesHandled !== 1 ? 's' : ''}`,
      });
    }

    // -- Budget Master: positive net profit with good margin --
    const profit = seasonData.profit ?? 0;
    const earned = stats.totalMoneyEarned ?? 1;
    const margin = earned > 0 ? (profit / earned * 100) : 0;
    if (profit > 0 && margin > 10) {
      awards.push({
        id: 'budget_master',
        name: 'Budget Master',
        icon: 'COIN',
        description: `Net profit: $${profit.toLocaleString()} (${Math.floor(margin)}% margin)`,
      });
    }

    // -- Staff MVP: highest performing staff member (by level + XP) --
    const staffList = this.state.staffList ?? [];
    const topStaff = staffList.reduce((best, s) => {
      const score = ((s.level ?? 1) * 1000) + (s.xp ?? 0);
      const bestScore = best ? ((best.level ?? 1) * 1000) + (best.xp ?? 0) : -1;
      return score > bestScore ? s : best;
    }, null);
    if (topStaff && (topStaff.level ?? 1) >= 1) {
      const repairInfo = (stats.seasonFiltersRepaired ?? 0) > 0
        ? `, ${stats.seasonFiltersRepaired} repairs` : '';
      const xpInfo = (stats.seasonStaffXpGained ?? 0) > 0
        ? `, +${stats.seasonStaffXpGained} XP` : '';
      awards.push({
        id: 'staff_mvp',
        name: 'Staff MVP',
        icon: 'STAR',
        description: `${topStaff.name} (Lv.${topStaff.level ?? 1}${repairInfo}${xpInfo})`,
      });
    }

    // -- Fan Favorite: track peak reputation this season --
    const peakRep = stats.seasonPeakReputation ?? 0;
    if (peakRep > 60) {
      awards.push({
        id: 'fan_favorite',
        name: 'Fan Favorite',
        icon: 'HEART',
        description: `Peak reputation: ${Math.floor(peakRep)}%`,
      });
    }

    return awards;
  }
}
