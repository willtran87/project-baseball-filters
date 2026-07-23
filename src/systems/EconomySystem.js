/**
 * EconomySystem — Manages money flow, income, and expenses.
 *
 * Calculates per-inning revenue from multiple sources (tickets, concessions,
 * sponsorships) and expenses (staff wages, energy, maintenance).
 * Aligned with GDD economy model.
 */

export class EconomySystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;
    this._inningTimer = 0;
    this._lastQuality = 0.5;

    this.eventBus.on('filtration:quality', (data) => {
      this._lastQuality = data.avgEfficiency;
    });

    // --- Fun Factor: Early game income boost ---
    // New players get an income boost that tapers gradually so there's no
    // harsh cliff. Days 1-7 get the full 1.5x boost; days 8-12 taper
    // linearly from 1.5x down to 1.0x; day 13+ is normal (1.0x).
    this._earlyBoostFullEnd = 5;    // last day of full boost
    this._earlyBoostTaperEnd = 10;  // last day of any boost
    this._earlyGameBoostMultiplier = 1.25;

    // Warn the player when the taper begins
    this.eventBus.on('game:newDay', ({ day }) => {
      if (day === 8) {
        this.eventBus.emit('ui:message', {
          text: 'Early season boost fading \u2014 time to build sustainable income!',
          type: 'warning',
        });
      }
    });

    // Reset inning timer on load to avoid stale accumulator
    this.eventBus.on('state:loaded', () => {
      this._inningTimer = 0;
    });

    // Process loan repayments at the start of each new game day
    this.eventBus.on('game:newDay', () => {
      this._processLoanRepayments();
    });

    // Handle loan requests from the UI
    this.eventBus.on('economy:requestLoan', () => {
      this.requestLoan();
    });

    // Update market conditions each new day
    this.eventBus.on('game:newDay', () => {
      this._updateMarketConditions();
    });

    // Recalculate capacity display when an expansion is purchased
    this.eventBus.on('expansion:purchased', () => {
      const total = this._getTotalCapacity();
      this.eventBus.emit('ui:message', {
        text: `Stadium capacity now: ${total.toLocaleString()} seats`,
        type: 'info',
      });
    });
  }

  /**
   * Per-tick update: accumulate time, trigger income per inning.
   * During off-season, runs a simplified daily cost cycle instead of innings.
   */
  update(dt) {
    if (this.state.paused) return;

    if (this.state.offSeason) {
      // During off-season, use inning duration as a "day timer" — one tick per off-season day
      const dayDuration = this.state.config.inningDurationSec ?? 30;
      this._inningTimer += dt;
      if (this._inningTimer >= dayDuration) {
        this._inningTimer -= dayDuration;
        this._processOffSeasonDay();
      }
      return;
    }

    const inningDuration = this.state.config.inningDurationSec ?? 30;
    // GameLoop already applies speed via accumulator scaling — do not multiply again
    this._inningTimer += dt;

    if (this._inningTimer >= inningDuration) {
      this._inningTimer -= inningDuration;
      this._processInning();
    }
  }

  /**
   * Process a single off-season day. No ticket/concession revenue.
   * Energy at 50%, staff wages and maintenance still apply.
   */
  _processOffSeasonDay() {
    const config = this.state.config;
    const econ = config.economy ?? {};

    // No revenue during off-season
    const inningIncome = 0;

    // Difficulty expense scaling
    const difficultyKey = this.state.difficulty ?? 'veteran';
    const difficultyDef = config.difficulty?.[difficultyKey] ?? {};
    const difficultyExpenseMult = difficultyDef.expenseMultiplier ?? 1.0;

    // Expansion cost reduction
    const expansionCostReduction = this._getExpansionCostReduction();

    // Hank blueprint cost reduction
    const hankCostReduction = this.state.storyFlags?.costReduction_all ?? 0;
    const hankCostMult = hankCostReduction > 0 ? (1 - hankCostReduction / 100) : 1;

    // Staff wages still apply in full
    const totalDailyWages = this._calculateStaffWages(econ);

    // Energy at 50% during off-season
    const energyCostBase = config.economy?.energyCostBase ?? 100;
    let filterEnergy = 0;
    for (const filter of this.state.filters) {
      const tierDef = this._getFilterTierDef(filter);
      const energyPerDay = tierDef?.energyPerDay ?? 10;
      filterEnergy += energyPerDay * (filter.efficiency ?? 1.0);
    }
    const energyCost = Math.floor((energyCostBase + filterEnergy) * 0.5);

    // Maintenance still applies
    const maintenance = this._calculateMaintenance();

    // Market condition cost multiplier (recession = 1.1x costs)
    const marketCostMult = (this.state.marketCondition === 'recession') ? 1.1 : 1.0;

    // Off-season revenue: Stadium Tours + Maintenance Contracts
    const tourIncome = Math.floor((this.state.reputation ?? 0) * 8);
    const maintContractIncome = (this.state.staffList ?? []).length * 25;
    const offSeasonRevenue = tourIncome + maintContractIncome;

    const totalExpenses = Math.floor((maintenance + totalDailyWages + energyCost) * difficultyExpenseMult * (1 - expansionCostReduction) * hankCostMult * marketCostMult);
    const netIncome = offSeasonRevenue - totalExpenses;

    this.state.set('income', offSeasonRevenue);
    this.state.set('expenses', totalExpenses);
    const offMoney = this.state.money + netIncome;
    this.state.set('money', Number.isFinite(offMoney) ? offMoney : this.state.money);
    this.state.set('attendance', 0);
    this.state.set('attendancePercent', 0);

    // Advance the day
    const nextDay = this.state.gameDay + 1;
    this.state.set('inning', 1);
    this.state.set('gameDay', nextDay);
    this.eventBus.emit('game:newDay', { day: nextDay });

    this.eventBus.emit('economy:inningEnd', {
      income: offSeasonRevenue,
      expenses: totalExpenses,
      staffCost: totalDailyWages,
      staffWageBreakdown: this._lastWageBreakdown ?? null,
      energyCost,
      maintenance,
      attendance: 0,
      balance: this.state.money,
      offSeasonTourIncome: tourIncome,
      offSeasonMaintContractIncome: maintContractIncome,
    });
  }

  _processInning() {
    const config = this.state.config;
    const econ = config.economy ?? {};
    const gameDayType = this.state.currentGameDayType ?? 'weekdayRegular';
    const gameDayDef = config.gameDayTypes?.[gameDayType] ?? {};
    const innings = config.inningsPerGame ?? 9;

    // Calculate attendance based on game day type, reputation, and consequence modifier
    const [minAtt, maxAtt] = gameDayDef.attendanceRange ?? [0.40, 0.60];
    const reputationFactor = this.state.reputation / 100;
    const attendanceRatio = minAtt + (maxAtt - minAtt) * reputationFactor;
    const baseCapacity = this._getTotalCapacity();
    // Team performance (set by ConsequenceSystem based on field quality) affects fan turnout
    const teamPerfMod = this.state.teamPerformanceModifier ?? 1;
    // Apply consequence attendance modifier (0.5-1.5, set by ConsequenceSystem)
    const consequenceAttMod = this.state.consequenceAttendanceModifier ?? 1.0;
    // Per-inning variance: ±5% so attendance feels dynamic, not static
    const inningVariance = 0.95 + Math.random() * 0.10;
    // Diego relationship bonus: +5% base attendance
    const diegoAttBoost = this.state.storyFlags?.attendanceBoost ?? 1.0;

    // Seasonal attendance & concessions modifiers
    const gameDay = this.state.gameDay ?? 1;
    const totalGameDays = config.seasonLength ?? 81;
    let seasonalAttMult = 1.0;
    let seasonalConcessionMult = 1.0;
    let seasonalLabel = null;
    if (gameDay === 1) {
      seasonalAttMult = 1.3;
      seasonalLabel = 'Opening Day';
    } else if (gameDay % 14 === 0) {
      seasonalAttMult = 1.15;
      seasonalLabel = 'Rivalry Week';
    } else if (gameDay > totalGameDays - 10) {
      seasonalAttMult = 1.1;
      seasonalConcessionMult = 1.2;
      seasonalLabel = 'Championship Push';
    }

    // Expansion attendance boosts (additive, capped at 30%)
    const expansionAttBonus = Math.min(0.30,
      this._getJumbotronAttendanceBoost() +
      this._getChampionshipAttendanceBoost() +
      this._getRallyRaccoonAttendanceBoost() +
      this._getFoulBallAttendanceBoost() +
      this._getFireworksAttendanceBoost()
    );
    const attendance = Math.floor(baseCapacity * attendanceRatio * teamPerfMod * consequenceAttMod * inningVariance * diegoAttBoost * seasonalAttMult * (1 + expansionAttBonus));

    // Store attendance data for HUD and other systems
    const attendancePercent = Math.min(100, Math.max(0, Math.round((attendance / baseCapacity) * 100)));
    const prevAttendance = this.state.attendance ?? attendance;
    const attendanceTrend = attendance > prevAttendance * 1.05 ? 'up' : attendance < prevAttendance * 0.95 ? 'down' : 'stable';
    this.state.set('attendancePercent', attendancePercent);
    this.state.set('attendanceTrend', attendanceTrend);

    // Revenue source 1: Ticket sales
    const ticketIncome = attendance * (econ.ticketBasePrice ?? 25);

    // Revenue source 2: Concessions (scales with attendance, satisfaction, and filter quality)
    // Staff efficiency bonus: specialists with high morale grant +5% per domain (up to +20%)
    const staffEfficiencyBonus = this.state._staffEfficiencyBonus ?? 0;
    const satisfactionMod = this._lastQuality * (econ.concessionSatisfactionWeight ?? 0.5) + 0.5;
    const concessionBoostTotal = 1 + this._getJumbotronConcessionBoost() + this._getNeonFoodCourtConcessionBoost() + this._getSeventhInningStretchBoost();
    const concessionIncome = Math.floor(attendance * (econ.concessionPerFan ?? 12) * satisfactionMod * (1 + staffEfficiencyBonus) * seasonalConcessionMult * concessionBoostTotal);

    // Revenue source 3: Sponsorships (flat per-game from active sponsors)
    const sponsorIncome = this._calculateSponsorIncome(econ);

    // Apply game day and event revenue multipliers
    const revenueMultiplier = (gameDayDef.revenueMultiplier ?? 1.0) *
                              (this.state.activeEvent?.revenueMultiplier ?? 1.0);

    // Apply consequence modifiers from ConsequenceSystem
    const consequenceRevMod = this.state.consequenceRevenueModifier ?? 1.0;

    // Early game income boost — tapers gradually instead of a hard cliff
    const day = this.state.gameDay ?? 1;
    let earlyBoost = 1.0;
    if (day <= this._earlyBoostFullEnd) {
      earlyBoost = this._earlyGameBoostMultiplier;
    } else if (day <= this._earlyBoostTaperEnd) {
      const taperSpan = this._earlyBoostTaperEnd - this._earlyBoostFullEnd;
      const progress = (day - this._earlyBoostFullEnd) / taperSpan;
      earlyBoost = this._earlyGameBoostMultiplier + (1.0 - this._earlyGameBoostMultiplier) * progress;
    }

    // Difficulty-based income/expense scaling
    const difficultyKey = this.state.difficulty ?? 'veteran';
    const difficultyDef = config.difficulty?.[difficultyKey] ?? {};
    const difficultyIncomeMult = difficultyDef.incomeMultiplier ?? 1.0;
    const difficultyExpenseMult = difficultyDef.expenseMultiplier ?? 1.0;

    // Revenue boost from purchased stadium expansions
    const expansionRevBoost = this._getExpansionRevenueBoost();

    // Market condition multiplier (boom/normal/recession)
    const marketRevMult = this.state.marketMultiplier ?? 1.0;

    // Per-inning share of total game revenue
    const gameIncome = (ticketIncome + concessionIncome + sponsorIncome) * revenueMultiplier * consequenceRevMod * earlyBoost * difficultyIncomeMult * (1 + expansionRevBoost) * marketRevMult;
    const inningIncome = Math.floor(gameIncome / innings);

    // Operating cost reduction from purchased expansions (e.g., Underground Hub)
    const expansionCostReduction = this._getExpansionCostReduction();

    // Expenses (per-inning share of daily costs)
    const maintenance = this._calculateMaintenance();
    // Use actual staff wages from staffList, fallback to staffCount * flat rate
    const totalDailyWages = this._calculateStaffWages(econ);
    const staffCost = Math.floor(totalDailyWages / innings);
    const energyCost = Math.floor(this._calculateEnergyCost() / innings);
    // Hank's cost reduction blueprint: reduces all operating costs
    const hankCostReduction = this.state.storyFlags?.costReduction_all ?? 0;
    const hankCostMult = hankCostReduction > 0 ? (1 - hankCostReduction / 100) : 1;
    // Market condition cost multiplier (recession = 1.1x costs)
    const marketCostMult = (this.state.marketCondition === 'recession') ? 1.1 : 1.0;
    const totalExpenses = Math.floor((maintenance + staffCost + energyCost) * difficultyExpenseMult * (1 - expansionCostReduction) * hankCostMult * marketCostMult);

    const netIncome = inningIncome - totalExpenses;

    this.state.set('income', inningIncome);
    this.state.set('expenses', totalExpenses);
    const newMoney = this.state.money + netIncome;
    this.state.set('money', Number.isFinite(newMoney) ? newMoney : this.state.money);
    this.state.set('attendance', attendance);

    // Advance inning
    let inning = this.state.inning + 1;
    let nextDay = this.state.gameDay;
    if (inning > innings) {
      inning = 1;
      nextDay += 1;

      // End-of-game-day income summary for player feedback
      // Use netIncome (already computed above) * innings for the daily total
      const dayProfit = netIncome * innings;
      if (dayProfit > 0) {
        this.eventBus.emit('ui:message', {
          text: `Game Day ${this.state.gameDay} complete! Net profit: +$${dayProfit.toLocaleString()}`,
          type: 'success',
        });
      } else if (dayProfit < -500) {
        this.eventBus.emit('ui:message', {
          text: `Game Day ${this.state.gameDay} ended at a loss: -$${Math.abs(dayProfit).toLocaleString()}`,
          type: 'warning',
        });
      }

      // Update state BEFORE emitting game:newDay so listeners see the correct values
      this.state.set('inning', inning);
      this.state.set('gameDay', nextDay);
      this.eventBus.emit('game:newDay', { day: nextDay });
    } else {
      this.state.set('inning', inning);
      this.state.set('gameDay', nextDay);
    }

    this.eventBus.emit('economy:inningEnd', {
      income: inningIncome,
      expenses: totalExpenses,
      staffCost,
      staffWageBreakdown: this._lastWageBreakdown ?? null,
      energyCost,
      maintenance,
      attendance,
      balance: this.state.money,
      // Detailed breakdown for floating income display
      ticketIncome: Math.floor(ticketIncome * revenueMultiplier * consequenceRevMod * earlyBoost * difficultyIncomeMult * (1 + expansionRevBoost) * marketRevMult / innings),
      concessionIncome: Math.floor(concessionIncome * revenueMultiplier * consequenceRevMod * earlyBoost * difficultyIncomeMult * (1 + expansionRevBoost) * marketRevMult / innings),
      seasonalLabel,
      seasonalAttMult,
      seasonalConcessionMult,
    });
  }

  _calculateSponsorIncome(econ) {
    // Returns 0 because all sponsor/contract income is paid directly by
    // ContractPanel's game:newDay handler. Adding income here would
    // double-count those payments. This method exists as a hook for any
    // future non-contract sponsor bonuses.
    return 0;
  }

  _calculateStaffWages(econ) {
    const staffList = this.state.staffList ?? [];
    if (staffList.length > 0) {
      let total = 0;
      let baseTotal = 0;
      let modifierTotal = 0;
      for (const staff of staffList) {
        const baseWage = staff.wagePerDay ?? (econ.staffWagePerDay ?? 100);

        // Morale modifier: >80 = 1.1x, <30 = 0.9x
        let moraleMult = 1.0;
        if (staff.morale > 80) moraleMult = 1.1;
        else if (staff.morale < 30) moraleMult = 0.9;

        // Specialization modifier: general = 1.0x, specialist = 1.15x, expert (level 5+) = 1.25x
        let specMult = 1.0;
        if (staff.specialization) {
          if (staff.level >= 5) {
            specMult = 1.25;
          } else {
            specMult = 1.15;
          }
        }

        const effectiveWage = Math.floor(baseWage * moraleMult * specMult);
        baseTotal += baseWage;
        modifierTotal += effectiveWage - baseWage;
        total += effectiveWage;
      }
      // Store breakdown for UI display
      this._lastWageBreakdown = { baseTotal, modifierTotal, total };
      return total;
    }
    // Fallback for legacy state: use staffCount * default wage
    const fallback = (this.state.staffCount ?? 1) * (econ.staffWagePerDay ?? 100);
    this._lastWageBreakdown = { baseTotal: fallback, modifierTotal: 0, total: fallback };
    return fallback;
  }

  _calculateMaintenance() {
    // BALANCE: Maintenance costs scale with filter condition — worn filters
    // cost more to maintain (think: parts wearing out, more frequent attention).
    // This creates an incentive to repair/replace aging equipment rather than
    // running it into the ground. A healthy filter costs ~30% of its energy/day;
    // a critical filter costs ~90%, making "ignore and pray" expensive.

    // Pre-scan for maintenanceSaver passive: 25% reduced maintenance for same-domain filters
    const saverDomains = new Set();
    for (const filter of this.state.filters) {
      if (filter.domain && filter.maxCondition > 0 && (filter.condition / filter.maxCondition) > 0.5) {
        const td = this._getFilterTierDef(filter);
        if (td?.passive === 'maintenanceSaver') {
          saverDomains.add(filter.domain);
        }
      }
    }

    // Staff specialization: 15% reduced maintenance for domains with a matching specialist
    const staffSpecDomains = new Set();
    const specDomainMap = {
      airTech: ['air', 'hvac'], plumber: ['water', 'drainage'],
      electrician: ['hvac', 'electrical'], sanitarian: ['pest'],
      general: ['air', 'water', 'hvac', 'drainage', 'electrical', 'pest'],
    };
    const staffList = this.state.staffList ?? [];
    for (const staff of staffList) {
      if (!staff.specialization || !staff.assignedDomain) continue;
      const coveredDomains = specDomainMap[staff.specialization];
      if (coveredDomains && coveredDomains.includes(staff.assignedDomain)) {
        staffSpecDomains.add(staff.assignedDomain);
      }
    }

    // Research: riskOfMalfunction — small maintenance cost increase from experimental tech
    const malfunctionRisk = this.state.researchEffects?.riskOfMalfunction ?? 0;
    const malfunctionMult = malfunctionRisk > 0 ? (1 + malfunctionRisk) : 1.0;

    let total = 0;
    for (const filter of this.state.filters) {
      const tierDef = this._getFilterTierDef(filter);
      const baseMaintenanceCost = tierDef?.energyPerDay ? Math.floor(tierDef.energyPerDay * 0.3) : 5;

      // Worn filters cost more to maintain (inverse of condition ratio)
      const conditionRatio = filter.maxCondition > 0
        ? Math.max(0, filter.condition / filter.maxCondition)
        : 0;
      // Scale from 1x (healthy) to 3x (broken) — creates repair incentive
      const wearMultiplier = 1 + 2 * (1 - conditionRatio);
      // maintenanceSaver passive: 25% discount for filters in that domain
      const saverMult = saverDomains.has(filter.domain) ? 0.75 : 1.0;
      // Staff specialization: 15% discount for filters in a specialist's domain
      const staffSpecMult = staffSpecDomains.has(filter.domain) ? 0.85 : 1.0;
      total += Math.floor(baseMaintenanceCost * wearMultiplier * saverMult * staffSpecMult * malfunctionMult);
    }
    return total;
  }

  _calculateEnergyCost() {
    const base = this.state.config.economy?.energyCostBase ?? 100;
    let filterEnergy = 0;
    for (const filter of this.state.filters) {
      const tierDef = this._getFilterTierDef(filter);
      const energyPerDay = tierDef?.energyPerDay ?? 10;
      // Scale energy cost by filter efficiency — broken filters cost nothing,
      // degraded filters cost proportionally less
      filterEnergy += energyPerDay * (filter.efficiency ?? 1.0);
    }

    // Stress multiplier from game day type (supports both systemStress string and stressTier object formats)
    const gameDayDef = this.state.config.gameDayTypes?.[this.state.currentGameDayType] ?? {};
    let energyMultiplier = 1.0;
    if (gameDayDef.stressTier) {
      energyMultiplier = gameDayDef.stressTier.energyMultiplier ?? 1.0;
    } else {
      const stressLevel = gameDayDef.systemStress ?? 'low';
      const stressDef = this.state.config.systemStressLevels?.[stressLevel] ?? {};
      energyMultiplier = stressDef.energyMultiplier ?? 1.0;
    }

    // Attendance stress multiplier (higher crowds = more energy)
    const attPct = this.state.attendancePercent ?? 0;
    const attStressTiers = this.state.config.attendanceStress ?? [];
    let attEnergyMult = 1.0;
    for (const tier of attStressTiers) {
      if (attPct <= tier.maxPercent) { attEnergyMult = tier.energyMultiplier; break; }
    }

    // Research: peakDemandReduction — reduce energy costs during high-attendance games
    const peakDemandReduction = this.state.researchEffects?.peakDemandReduction ?? 0;
    const peakMult = (attPct > 70 && peakDemandReduction > 0) ? (1 - peakDemandReduction) : 1.0;

    // Research: hotWaterCostReduction — reduce water domain filter energy costs
    const hotWaterCostReduction = this.state.researchEffects?.hotWaterCostReduction ?? 0;
    if (hotWaterCostReduction > 0) {
      let waterEnergy = 0;
      let nonWaterEnergy = 0;
      for (const filter of this.state.filters) {
        const td = this._getFilterTierDef(filter);
        const epd = td?.energyPerDay ?? 10;
        const scaled = epd * (filter.efficiency ?? 1.0);
        if (filter.domain === 'water') {
          waterEnergy += scaled;
        } else {
          nonWaterEnergy += scaled;
        }
      }
      const reducedWaterEnergy = waterEnergy * (1 - hotWaterCostReduction);
      return Math.floor((base + nonWaterEnergy + reducedWaterEnergy) * energyMultiplier * attEnergyMult * peakMult);
    }

    // Research: riskOfAIQuirks — small energy cost increase
    const aiQuirksCost = this.state.researchEffects?.riskOfAIQuirks ?? 0;
    const aiQuirksMult = aiQuirksCost > 0 ? (1 + aiQuirksCost) : 1.0;

    // Electrical grid health modulates energy costs
    const elecHealth = this.state.domainHealth?.electrical ?? 100;
    let elecMult = 1.0;
    if (elecHealth > 80) elecMult = 0.90;       // efficient grid: -10%
    else if (elecHealth < 20) elecMult = 1.30;   // failing grid: +30%
    else if (elecHealth < 40) elecMult = 1.15;   // degraded grid: +15%

    return Math.floor((base + filterEnergy) * energyMultiplier * attEnergyMult * peakMult * aiQuirksMult * elecMult);
  }

  /**
   * Look up the tier definition for an installed filter from the nested
   * filtrationSystems config structure.
   */
  _getFilterTierDef(filter) {
    const system = this.state.config.filtrationSystems?.[filter.domain];
    const component = system?.components?.[filter.componentType];
    if (!component) return null;
    return component.tiers?.find(t => t.tier === filter.tier) ?? null;
  }

  /**
   * Calculate total stadium capacity including purchased expansions.
   */
  _getTotalCapacity() {
    const base = this.state.config.stadium?.baseCapacity ?? 5000;
    const expansionCapMap = this.state.config.stadium?.expansionCapacity ?? {};
    const purchased = this.state.purchasedExpansions ?? [];
    let bonus = 0;
    for (const pe of purchased) {
      bonus += expansionCapMap[pe.key] ?? 0;
    }
    return base + bonus;
  }

  /**
   * Sum revenue boost multipliers from all purchased expansions.
   * Applies specialEventsOnly and newSystemsRequired penalties.
   */
  _getExpansionRevenueBoost() {
    const expansions = this.state.config.expansions ?? [];
    const purchased = this.state.purchasedExpansions ?? [];
    const gameDayType = this.state.currentGameDayType ?? 'weekdayRegular';
    const isSpecialEvent = gameDayType === 'playoffGame' || gameDayType === 'championshipGame';
    let total = 0;
    for (const pe of purchased) {
      const def = expansions.find(e => e.id === pe.key);
      if (!def?.revenueBoost) continue;
      let boost = def.revenueBoost;
      // Championship Pavilion: revenue boost only during playoff/championship
      if (def.specialEventsOnly && !isSpecialEvent) boost = 0;
      // newSystemsRequired penalty: 50% reduction if required domains lack filters
      boost *= this._getNewSystemsPenalty(def);
      total += boost;
    }
    return Math.min(total, 1.0); // cap at +100% max revenue boost
  }

  /**
   * Check if an expansion's required domains have installed filters.
   * Returns 0.5 if any required domain lacks filters, 1.0 otherwise.
   */
  _getNewSystemsPenalty(def) {
    const required = def.newSystemsRequired ?? [];
    if (required.length === 0) return 1.0;
    for (const domain of required) {
      const hasFilter = this.state.filters.some(f => f.domain === domain);
      if (!hasFilter) return 0.5;
    }
    return 1.0;
  }

  /**
   * Get Jumbotron attendance boost (8% when purchased).
   */
  _getJumbotronAttendanceBoost() {
    const purchased = this.state.purchasedExpansions ?? [];
    return purchased.some(p => p.key === 'jumbotronUpgrade') ? 0.08 : 0;
  }

  /**
   * Get Championship Pavilion flat attendance bonus (6% when purchased, always applies).
   */
  _getChampionshipAttendanceBoost() {
    const purchased = this.state.purchasedExpansions ?? [];
    return purchased.some(p => p.key === 'championshipPavilion') ? 0.06 : 0;
  }

  /**
   * Get Jumbotron concession revenue boost (3% when purchased).
   */
  _getJumbotronConcessionBoost() {
    const purchased = this.state.purchasedExpansions ?? [];
    return purchased.some(p => p.key === 'jumbotronUpgrade') ? 0.03 : 0;
  }

  /**
   * Get Neon Food Court concession revenue boost (8% when purchased).
   */
  _getNeonFoodCourtConcessionBoost() {
    const purchased = this.state.purchasedExpansions ?? [];
    return purchased.some(p => p.key === 'neonFoodCourt') ? 0.08 : 0;
  }

  /**
   * Get Rally Raccoon attendance boost (3% when purchased).
   */
  _getRallyRaccoonAttendanceBoost() {
    const purchased = this.state.purchasedExpansions ?? [];
    return purchased.some(p => p.key === 'rallyRaccoon') ? 0.03 : 0;
  }

  /**
   * Get Foul Ball Physics attendance boost (3% when purchased).
   */
  _getFoulBallAttendanceBoost() {
    const purchased = this.state.purchasedExpansions ?? [];
    return purchased.some(p => p.key === 'foulBallPhysics') ? 0.03 : 0;
  }

  /**
   * Get Seventh Inning Stretch concession boost (6% in innings 7-9 when purchased).
   */
  _getSeventhInningStretchBoost() {
    const purchased = this.state.purchasedExpansions ?? [];
    if (!purchased.some(p => p.key === 'seventhInningStretch')) return 0;
    const currentInning = this.state.currentInning ?? this.state.inning ?? 0;
    return currentInning >= 7 ? 0.06 : 0;
  }

  /**
   * Get Fireworks Launcher Array attendance boost (8% during special events when purchased).
   */
  _getFireworksAttendanceBoost() {
    const purchased = this.state.purchasedExpansions ?? [];
    if (!purchased.some(p => p.key === 'fireworksLauncherArray')) return 0;
    const gameDayType = this.state.currentGameDayType ?? 'weekdayRegular';
    const specialTypes = ['playoffGame', 'championshipGame', 'openingDay', 'rivalryGame'];
    return specialTypes.includes(gameDayType) ? 0.08 : 0;
  }

  /**
   * Get the effective emergency repair multiplier, reduced by 25% if
   * Emergency Response Center is purchased.
   */
  _getEmergencyRepairMultiplier() {
    const baseMult = this.state.config.economy?.emergencyRepairMultiplier ?? 2.5;
    const purchased = this.state.purchasedExpansions ?? [];
    if (purchased.some(p => p.key === 'emergencyResponseCenter')) {
      return baseMult * 0.75;
    }
    return baseMult;
  }

  /**
   * Sum operating cost reduction from purchased expansions.
   * Applies newSystemsRequired penalty.
   */
  _getExpansionCostReduction() {
    const expansions = this.state.config.expansions ?? [];
    const purchased = this.state.purchasedExpansions ?? [];
    let total = 0;
    for (const pe of purchased) {
      const def = expansions.find(e => e.id === pe.key);
      if (!def?.operatingCostReduction) continue;
      total += def.operatingCostReduction * this._getNewSystemsPenalty(def);
    }
    return Math.min(total, 0.30); // cap at 30% reduction
  }

  // ── Loan System ──────────────────────────────────────────────────

  /**
   * Request a new loan. Returns the loan object if successful, null otherwise.
   */
  requestLoan() {
    const econ = this.state.config.economy ?? {};
    const maxLoans = econ.maxLoans ?? 3;
    const loanAmount = econ.loanAmount ?? 5000;
    const interestRates = econ.loanInterestRates ?? [0.05, 0.10, 0.18];

    const activeLoans = this.state.activeLoans ?? [];
    if (activeLoans.length >= maxLoans) return null;

    const interestRate = interestRates[activeLoans.length] ?? interestRates[interestRates.length - 1];
    const totalOwed = Math.floor(loanAmount * (1 + interestRate));

    const loan = {
      amount: loanAmount,
      interestRate,
      totalOwed,
      paidSoFar: 0,
      dayTaken: this.state.gameDay ?? 1,
    };

    activeLoans.push(loan);
    this.state.activeLoans = activeLoans;
    const loanMoney = this.state.money + loanAmount;
    this.state.set('money', Number.isFinite(loanMoney) ? loanMoney : this.state.money);
    this.eventBus.emit('loan:taken', loan);
    this.eventBus.emit('ui:message', {
      text: `Loan taken: +$${loanAmount.toLocaleString()} (${Math.round(interestRate * 100)}% interest, owe $${totalOwed.toLocaleString()})`,
      type: 'info',
    });
    return loan;
  }

  // ── Market Conditions ────────────────────────────────────────────

  /**
   * Update market conditions each day.
   * 3 states: boom (1.15x revenue), normal (1.0x), recession (0.85x rev / 1.1x costs).
   * Each day 15% chance to shift one step toward a random target state.
   */
  _updateMarketConditions() {
    const states = ['recession', 'normal', 'boom'];
    const multipliers = { recession: 0.85, normal: 1.0, boom: 1.15 };
    const current = this.state.marketCondition ?? 'normal';
    const currentIdx = states.indexOf(current);

    // 15% chance to shift
    if (Math.random() < 0.15) {
      // Pick a random target state
      const targetIdx = Math.floor(Math.random() * states.length);
      let newIdx = currentIdx;
      if (targetIdx > currentIdx) newIdx = currentIdx + 1;
      else if (targetIdx < currentIdx) newIdx = currentIdx - 1;

      const newState = states[newIdx];
      if (newState !== current) {
        this.state.set('marketCondition', newState);
        this.state.set('marketMultiplier', multipliers[newState]);
        this.eventBus.emit('economy:marketShift', {
          from: current,
          to: newState,
          multiplier: multipliers[newState],
        });
        const labels = { boom: 'Boom', normal: 'Normal', recession: 'Recession' };
        this.eventBus.emit('ui:message', {
          text: `Market shift: ${labels[newState]}! Revenue modifier: x${multipliers[newState].toFixed(2)}`,
          type: newState === 'boom' ? 'success' : newState === 'recession' ? 'warning' : 'info',
        });
      }
    }
  }

  /**
   * Process daily loan repayments. Each loan repays 20% of the original
   * loan amount per game day until fully paid off.
   */
  _processLoanRepayments() {
    const activeLoans = this.state.activeLoans ?? [];
    if (activeLoans.length === 0) return;

    const econ = this.state.config.economy ?? {};
    const loanAmount = econ.loanAmount ?? 5000;
    const repaymentRate = econ.loanRepaymentRate ?? 0.10;
    const dailyRepayment = Math.floor(loanAmount * repaymentRate);

    const remaining = [];
    let totalDeducted = 0;
    let availableMoney = this.state.money;

    for (const loan of activeLoans) {
      const owed = loan.totalOwed - loan.paidSoFar;
      // Cap payment so money doesn't go below zero
      const maxPayment = Math.max(0, Math.min(dailyRepayment, owed, availableMoney - totalDeducted));
      if (maxPayment > 0) {
        loan.paidSoFar += maxPayment;
        totalDeducted += maxPayment;
      }

      if (loan.paidSoFar >= loan.totalOwed) {
        this.eventBus.emit('loan:repaid', loan);
        this.eventBus.emit('ui:message', {
          text: 'Loan fully repaid!',
          type: 'success',
        });
      } else {
        remaining.push(loan);
        // Warn if we couldn't make the full payment
        if (maxPayment < Math.min(dailyRepayment, owed)) {
          this.eventBus.emit('ui:message', {
            text: 'Insufficient funds for full loan repayment! Partial payment made.',
            type: 'warning',
          });
        }
      }
    }

    if (totalDeducted > 0) {
      const afterRepay = this.state.money - totalDeducted;
      this.state.set('money', Number.isFinite(afterRepay) ? afterRepay : this.state.money);
    }
    this.state.activeLoans = remaining;
  }
}
