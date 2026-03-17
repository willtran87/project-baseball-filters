/**
 * EconomyPanel — Financial breakdown UI showing revenue, expenses, and modifiers.
 *
 * Toggle via `ui:toggleEconomy` event or 'f' keyboard shortcut.
 * Registered with PanelManager for consistent panel management.
 */

export class EconomyPanel {
  constructor(panelManager, state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;
    this.panelManager = panelManager;

    panelManager.register('economy', (el, state, eventBus) => {
      this._render(el);
    });

    this.eventBus.on('ui:toggleEconomy', () => {
      if (panelManager.isOpen('economy')) {
        this.eventBus.emit('ui:closePanel');
      } else {
        this.eventBus.emit('ui:openPanel', { name: 'economy' });
      }
    });
  }

  _render(el) {
    const s = this.state;
    const config = s.config;
    const econ = config.economy ?? {};
    const innings = config.inningsPerGame ?? 9;

    // --- Revenue calculations (mirror EconomySystem logic) ---
    const gameDayType = s.currentGameDayType ?? 'weekdayRegular';
    const gameDayDef = config.gameDayTypes?.[gameDayType] ?? {};

    // Attendance
    const [minAtt, maxAtt] = gameDayDef.attendanceRange ?? [0.40, 0.60];
    const reputationFactor = s.reputation / 100;
    const attendanceRatio = minAtt + (maxAtt - minAtt) * reputationFactor;
    const baseCapacity = this._getTotalCapacity();
    const teamPerfMod = s.teamPerformanceModifier ?? 1;
    const consequenceAttMod = s.consequenceAttendanceModifier ?? 1.0;
    const estAttendance = Math.floor(baseCapacity * attendanceRatio * teamPerfMod * consequenceAttMod);

    // Ticket revenue
    const ticketPrice = econ.ticketBasePrice ?? 25;
    const ticketRevenue = estAttendance * ticketPrice;

    // Concession revenue
    const avgQuality = this._getAvgFilterQuality();
    const satisfactionMod = avgQuality * (econ.concessionSatisfactionWeight ?? 0.5) + 0.5;
    const concessionRevenue = Math.floor(estAttendance * (econ.concessionPerFan ?? 12) * satisfactionMod);

    // Sponsor income (paid by ContractPanel, not EconomySystem — show contract totals)
    const activeContracts = s.activeContracts ?? [];
    let contractIncome = 0;
    for (const c of activeContracts) {
      contractIncome += c.payoutPerGame ?? c.payout ?? 0;
    }

    // Revenue multipliers
    const revenueMultiplier = (gameDayDef.revenueMultiplier ?? 1.0) *
                               (s.activeEvent?.revenueMultiplier ?? 1.0);
    const consequenceRevMod = s.consequenceRevenueModifier ?? 1.0;

    // Early game boost
    const day = s.gameDay ?? 1;
    let earlyBoost = 1.0;
    const earlyFullEnd = 7;
    const earlyTaperEnd = 12;
    const earlyMult = 1.5;
    if (day <= earlyFullEnd) {
      earlyBoost = earlyMult;
    } else if (day <= earlyTaperEnd) {
      const taperSpan = earlyTaperEnd - earlyFullEnd;
      const progress = (day - earlyFullEnd) / taperSpan;
      earlyBoost = earlyMult + (1.0 - earlyMult) * progress;
    }

    // Difficulty
    const difficultyKey = s.difficulty ?? 'veteran';
    const difficultyDef = config.difficulty?.[difficultyKey] ?? {};
    const difficultyIncomeMult = difficultyDef.incomeMultiplier ?? 1.0;
    const difficultyExpenseMult = difficultyDef.expenseMultiplier ?? 1.0;

    // Expansion boosts
    const expansionRevBoost = this._getExpansionRevenueBoost();
    const expansionCostReduction = this._getExpansionCostReduction();

    const rawGameRevenue = ticketRevenue + concessionRevenue;
    const adjustedGameRevenue = Math.floor(rawGameRevenue * revenueMultiplier * consequenceRevMod * earlyBoost * difficultyIncomeMult * (1 + expansionRevBoost));
    const perInningRevenue = Math.floor(adjustedGameRevenue / innings);

    // --- Expense calculations ---
    const baseEnergyCost = econ.energyCostBase ?? 100;
    let filterEnergyCost = 0;
    for (const filter of s.filters) {
      const tierDef = this._getFilterTierDef(filter);
      filterEnergyCost += tierDef?.energyPerDay ?? 10;
    }

    // Energy stress multipliers (supports both systemStress string and stressTier object formats)
    const gameDayStressDef = config.gameDayTypes?.[gameDayType] ?? {};
    let energyMultiplier = 1.0;
    if (gameDayStressDef.stressTier) {
      energyMultiplier = gameDayStressDef.stressTier.energyMultiplier ?? 1.0;
    } else {
      const stressLevel = gameDayStressDef.systemStress ?? 'low';
      const stressDef = config.systemStressLevels?.[stressLevel] ?? {};
      energyMultiplier = stressDef.energyMultiplier ?? 1.0;
    }
    const attPct = s.attendancePercent ?? 0;
    const attStressTiers = config.attendanceStress ?? [];
    let attEnergyMult = 1.0;
    for (const tier of attStressTiers) {
      if (attPct <= tier.maxPercent) { attEnergyMult = tier.energyMultiplier; break; }
    }
    const totalEnergyCost = Math.floor((baseEnergyCost + filterEnergyCost) * energyMultiplier * attEnergyMult);

    // Maintenance
    const maintenanceCost = this._calculateMaintenance();

    // Staff wages
    const staffWages = this._calculateStaffWages(econ);

    const rawExpenses = maintenanceCost + staffWages + totalEnergyCost;
    const adjustedExpenses = Math.floor(rawExpenses * difficultyExpenseMult * (1 - expansionCostReduction));
    const perInningExpenses = Math.floor(adjustedExpenses / innings);

    // Net
    const netPerInning = perInningRevenue - perInningExpenses;
    const netPerGame = adjustedGameRevenue + contractIncome - adjustedExpenses;

    // --- Build UI ---
    el.style.cssText = `
      position: absolute; top: 24px; left: 5%; right: 5%; bottom: 24px;
      background: linear-gradient(180deg, rgba(10,8,20,0.97), rgba(8,8,24,0.97));
      border: 2px solid #8b4513;
      border-radius: 4px;
      font-family: monospace; color: #e0e0e0;
      font-size: 11px; z-index: 30;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(139,69,19,0.2);
    `;

    const netColor = netPerGame >= 0 ? '#00e436' : '#ff004d';
    const netSign = netPerGame >= 0 ? '+' : '';

    let html = '';

    // Header
    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:2px solid #8b4513;background:linear-gradient(180deg,rgba(139,69,19,0.15),rgba(0,0,0,0.3));">
        <strong style="color:#ffec27;letter-spacing:1px">FINANCE REPORT</strong>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="color:#aaa;font-size:9px">
            Game Day <span style="color:#fff">${s.gameDay}</span> |
            Cash: <span style="color:#00e436;font-weight:bold">$${s.money.toLocaleString()}</span>
          </span>
          <span data-action="close-economy" style="cursor:pointer;color:#888;font-size:12px">\u2715</span>
        </div>
      </div>
    `;

    // Two-column layout: Revenue | Expenses
    html += `<div style="flex:1;overflow-y:auto;padding:8px 12px;">`;
    html += `<div style="display:flex;gap:16px;">`;

    // --- Revenue column ---
    html += `<div style="flex:1;">`;
    html += `<div style="color:#00e436;font-weight:bold;margin-bottom:6px;border-bottom:1px solid #00e43644;padding-bottom:3px;">REVENUE (per game)</div>`;
    html += this._row('Ticket sales', `$${ticketRevenue.toLocaleString()}`, '#aaa', `${estAttendance.toLocaleString()} fans x $${ticketPrice}`);
    html += this._row('Concessions', `$${concessionRevenue.toLocaleString()}`, '#aaa', `Satisfaction: ${Math.round(satisfactionMod * 100)}%`);
    html += this._row('Contract income', `$${contractIncome.toLocaleString()}`, '#29adff', `${activeContracts.length} active contract${activeContracts.length !== 1 ? 's' : ''}`);

    if (revenueMultiplier !== 1.0 || earlyBoost !== 1.0 || expansionRevBoost > 0) {
      html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #222;color:#888;font-size:9px;">Multipliers applied:</div>`;
      if (revenueMultiplier !== 1.0) html += this._row('Game day bonus', `x${revenueMultiplier.toFixed(2)}`, '#ffec27');
      if (earlyBoost !== 1.0) html += this._row('Early season boost', `x${earlyBoost.toFixed(2)}`, '#29adff');
      if (expansionRevBoost > 0) html += this._row('Expansion bonus', `+${Math.round(expansionRevBoost * 100)}%`, '#ffa300');
      if (consequenceRevMod !== 1.0) html += this._row('Consequence penalty', `x${consequenceRevMod.toFixed(2)}`, '#ff004d');
      if (difficultyIncomeMult !== 1.0) html += this._row('Difficulty modifier', `x${difficultyIncomeMult.toFixed(2)}`, '#888');
    }

    html += `<div style="margin-top:6px;padding-top:4px;border-top:1px solid #00e43644;font-weight:bold;">`;
    html += this._row('Total revenue/game', `$${(adjustedGameRevenue + contractIncome).toLocaleString()}`, '#00e436');
    html += `</div>`;
    html += `</div>`;

    // --- Expenses column ---
    html += `<div style="flex:1;">`;
    html += `<div style="color:#ff004d;font-weight:bold;margin-bottom:6px;border-bottom:1px solid #ff004d44;padding-bottom:3px;">EXPENSES (per game)</div>`;
    html += this._row('Base energy', `$${baseEnergyCost.toLocaleString()}`, '#aaa');
    html += this._row('Filter energy', `$${filterEnergyCost.toLocaleString()}`, '#aaa', `${s.filters.length} filter${s.filters.length !== 1 ? 's' : ''}`);
    if (energyMultiplier !== 1.0 || attEnergyMult !== 1.0) {
      html += this._row('Energy (adjusted)', `$${totalEnergyCost.toLocaleString()}`, '#ffa300', `Stress: x${(energyMultiplier * attEnergyMult).toFixed(2)}`);
    }
    html += this._row('Maintenance', `$${maintenanceCost.toLocaleString()}`, '#aaa');
    html += this._row('Staff wages', `$${staffWages.toLocaleString()}`, '#aaa', `${(s.staffList ?? []).length} staff`);

    if (expansionCostReduction > 0 || difficultyExpenseMult !== 1.0) {
      html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #222;color:#888;font-size:9px;">Modifiers applied:</div>`;
      if (expansionCostReduction > 0) html += this._row('Expansion savings', `-${Math.round(expansionCostReduction * 100)}%`, '#29adff');
      if (difficultyExpenseMult !== 1.0) html += this._row('Difficulty modifier', `x${difficultyExpenseMult.toFixed(2)}`, '#888');
    }

    html += `<div style="margin-top:6px;padding-top:4px;border-top:1px solid #ff004d44;font-weight:bold;">`;
    html += this._row('Total expenses/game', `$${adjustedExpenses.toLocaleString()}`, '#ff004d');
    html += `</div>`;
    html += `</div>`;

    html += `</div>`; // end flex columns

    // --- Summary bar ---
    html += `
      <div style="margin-top:10px;padding:8px;border:1px solid ${netColor}44;border-radius:3px;background:${netColor}08;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="color:#aaa;">Net per game: </span>
            <span style="color:${netColor};font-weight:bold;font-size:12px;">${netSign}$${Math.abs(netPerGame).toLocaleString()}</span>
          </div>
          <div>
            <span style="color:#aaa;">Per inning: </span>
            <span style="color:${netColor};">${netSign}$${Math.abs(netPerInning).toLocaleString()}</span>
          </div>
          <div>
            <span style="color:#aaa;">Cash on hand: </span>
            <span style="color:#00e436;font-weight:bold;">$${s.money.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;

    // --- Active modifiers section ---
    const modifiers = [];
    if (attPct >= 85) modifiers.push({ label: `Attendance stress: ${attPct >= 95 ? 'SELLOUT' : 'HIGH'}`, color: '#ffa300' });
    if (difficultyKey !== 'veteran') modifiers.push({ label: `Difficulty: ${difficultyKey}`, color: '#888' });
    if (earlyBoost > 1.0) modifiers.push({ label: `Early season boost: x${earlyBoost.toFixed(2)}`, color: '#29adff' });
    if (expansionRevBoost > 0) modifiers.push({ label: `Expansion revenue: +${Math.round(expansionRevBoost * 100)}%`, color: '#ffa300' });
    if (expansionCostReduction > 0) modifiers.push({ label: `Expansion cost reduction: -${Math.round(expansionCostReduction * 100)}%`, color: '#29adff' });
    if (s.activeEvent) modifiers.push({ label: `Event: ${s.activeEvent.name}`, color: s.activeEvent.category === 'positive' || s.activeEvent.isPositive ? '#00e436' : '#ff77a8' });
    if (consequenceRevMod !== 1.0) modifiers.push({ label: `Consequence revenue penalty: x${consequenceRevMod.toFixed(2)}`, color: '#ff004d' });
    if (consequenceAttMod !== 1.0) modifiers.push({ label: `Consequence attendance penalty: x${consequenceAttMod.toFixed(2)}`, color: '#ff004d' });

    if (modifiers.length > 0) {
      html += `<div style="margin-top:8px;padding-top:6px;border-top:1px solid #3a3a5a;">`;
      html += `<div style="color:#888;font-size:9px;margin-bottom:4px;">ACTIVE MODIFIERS</div>`;
      for (const mod of modifiers) {
        html += `<span style="display:inline-block;color:${mod.color};font-size:8px;border:1px solid ${mod.color}44;padding:1px 5px;border-radius:2px;margin:1px 2px;">${mod.label}</span>`;
      }
      html += `</div>`;
    }

    html += `</div>`; // end scrollable area

    el.innerHTML = html;

    // Click handlers
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close-economy"]')) {
        this.eventBus.emit('ui:closePanel');
      }
    });
  }

  _row(label, value, valueColor, hint) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
        <span style="color:#aaa;font-size:9px;">${label}</span>
        <span style="display:flex;align-items:center;gap:6px;">
          ${hint ? `<span style="color:#555;font-size:8px;">${hint}</span>` : ''}
          <span style="color:${valueColor};font-size:10px;">${value}</span>
        </span>
      </div>
    `;
  }

  _getAvgFilterQuality() {
    const filters = this.state.filters ?? [];
    if (filters.length === 0) return 0.5;
    let total = 0;
    for (const f of filters) {
      total += f.efficiency ?? 0;
    }
    return total / filters.length;
  }

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

  _getExpansionCostReduction() {
    const expansions = this.state.config.expansions ?? [];
    const purchased = this.state.purchasedExpansions ?? [];
    let total = 0;
    for (const pe of purchased) {
      const def = expansions.find(e => e.id === pe.key);
      if (def?.operatingCostReduction) total += def.operatingCostReduction;
    }
    return Math.min(total, 0.5);
  }

  _getFilterTierDef(filter) {
    const system = this.state.config.filtrationSystems?.[filter.domain];
    const component = system?.components?.[filter.componentType];
    if (!component) return null;
    return component.tiers?.find(t => t.tier === filter.tier) ?? null;
  }

  _calculateMaintenance() {
    const saverDomains = new Set();
    for (const filter of this.state.filters) {
      if (filter.domain && filter.maxCondition > 0 && (filter.condition / filter.maxCondition) > 0.5) {
        const td = this._getFilterTierDef(filter);
        if (td?.passive === 'maintenanceSaver') {
          saverDomains.add(filter.domain);
        }
      }
    }
    let total = 0;
    for (const filter of this.state.filters) {
      const tierDef = this._getFilterTierDef(filter);
      const baseMaintenanceCost = tierDef?.energyPerDay ? Math.floor(tierDef.energyPerDay * 0.3) : 5;
      const conditionRatio = filter.maxCondition > 0
        ? Math.max(0, filter.condition / filter.maxCondition)
        : 0;
      const wearMultiplier = 1 + 2 * (1 - conditionRatio);
      const saverMult = saverDomains.has(filter.domain) ? 0.75 : 1.0;
      total += Math.floor(baseMaintenanceCost * wearMultiplier * saverMult);
    }
    return total;
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
    return (this.state.staffCount ?? 1) * (econ.staffWagePerDay ?? 100);
  }
}
