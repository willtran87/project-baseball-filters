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
    this._earlyBoostFullEnd = 7;    // last day of full boost
    this._earlyBoostTaperEnd = 12;  // last day of any boost
    this._earlyGameBoostMultiplier = 1.5;

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

    const totalExpenses = Math.floor((maintenance + totalDailyWages + energyCost) * difficultyExpenseMult * (1 - expansionCostReduction) * hankCostMult);
    const netIncome = -totalExpenses;

    this.state.set('income', 0);
    this.state.set('expenses', totalExpenses);
    this.state.set('money', this.state.money + netIncome);
    this.state.set('attendance', 0);
    this.state.set('attendancePercent', 0);

    // Advance the day
    const nextDay = this.state.gameDay + 1;
    this.state.set('inning', 1);
    this.state.set('gameDay', nextDay);
    this.eventBus.emit('game:newDay', { day: nextDay });

    this.eventBus.emit('economy:inningEnd', {
      income: 0,
      expenses: totalExpenses,
      staffCost: totalDailyWages,
      energyCost,
      maintenance,
      attendance: 0,
      balance: this.state.money,
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
    const attendance = Math.floor(baseCapacity * attendanceRatio * teamPerfMod * consequenceAttMod * inningVariance * diegoAttBoost);

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
    const concessionIncome = Math.floor(attendance * (econ.concessionPerFan ?? 12) * satisfactionMod * (1 + staffEfficiencyBonus));

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

    // Per-inning share of total game revenue
    const gameIncome = (ticketIncome + concessionIncome + sponsorIncome) * revenueMultiplier * consequenceRevMod * earlyBoost * difficultyIncomeMult * (1 + expansionRevBoost);
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
    const totalExpenses = Math.floor((maintenance + staffCost + energyCost) * difficultyExpenseMult * (1 - expansionCostReduction) * hankCostMult);

    const netIncome = inningIncome - totalExpenses;

    this.state.set('income', inningIncome);
    this.state.set('expenses', totalExpenses);
    this.state.set('money', this.state.money + netIncome);
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
      energyCost,
      maintenance,
      attendance,
      balance: this.state.money,
      // Detailed breakdown for floating income display
      ticketIncome: Math.floor(ticketIncome * revenueMultiplier * consequenceRevMod * earlyBoost * difficultyIncomeMult * (1 + expansionRevBoost) / innings),
      concessionIncome: Math.floor(concessionIncome * revenueMultiplier * consequenceRevMod * earlyBoost * difficultyIncomeMult * (1 + expansionRevBoost) / innings),
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
      for (const staff of staffList) {
        total += staff.wagePerDay ?? (econ.staffWagePerDay ?? 100);
      }
      return total;
    }
    // Fallback for legacy state: use staffCount * default wage
    return (this.state.staffCount ?? 1) * (econ.staffWagePerDay ?? 100);
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
      electrician: ['hvac'], general: ['air', 'water', 'hvac', 'drainage'],
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

    return Math.floor((base + filterEnergy) * energyMultiplier * attEnergyMult * peakMult * aiQuirksMult);
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
   */
  _getExpansionRevenueBoost() {
    const expansions = this.state.config.expansions ?? [];
    const purchased = this.state.purchasedExpansions ?? [];
    let total = 0;
    for (const pe of purchased) {
      const def = expansions.find(e => e.id === pe.key);
      if (def?.revenueBoost) total += def.revenueBoost;
    }
    return total;
  }

  /**
   * Sum operating cost reduction from purchased expansions.
   */
  _getExpansionCostReduction() {
    const expansions = this.state.config.expansions ?? [];
    const purchased = this.state.purchasedExpansions ?? [];
    let total = 0;
    for (const pe of purchased) {
      const def = expansions.find(e => e.id === pe.key);
      if (def?.operatingCostReduction) total += def.operatingCostReduction;
    }
    return Math.min(total, 0.5); // cap at 50% reduction
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
    this.state.set('money', this.state.money + loanAmount);
    this.eventBus.emit('loan:taken', loan);
    this.eventBus.emit('ui:message', {
      text: `Loan taken: +$${loanAmount.toLocaleString()} (${Math.round(interestRate * 100)}% interest, owe $${totalOwed.toLocaleString()})`,
      type: 'info',
    });
    return loan;
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
      this.state.set('money', this.state.money - totalDeducted);
    }
    this.state.activeLoans = remaining;
  }
}
