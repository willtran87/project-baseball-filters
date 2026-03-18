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
    const day = s.gameDay ?? 1;
    const gameDayType = s.currentGameDayType ?? 'weekdayRegular';
    const gameDayDef = config.gameDayTypes?.[gameDayType] ?? {};

    // Attendance
    const [minAtt, maxAtt] = gameDayDef.attendanceRange ?? [0.40, 0.60];
    const reputationFactor = s.reputation / 100;
    const attendanceRatio = minAtt + (maxAtt - minAtt) * reputationFactor;
    const baseCapacity = this._getTotalCapacity();
    const teamPerfMod = s.teamPerformanceModifier ?? 1;
    const consequenceAttMod = s.consequenceAttendanceModifier ?? 1.0;

    // Seasonal attendance & concessions modifiers (mirror EconomySystem)
    const totalGameDays = config.seasonLength ?? 81;
    let seasonalAttMult = 1.0;
    let seasonalConcessionMult = 1.0;
    let seasonalLabel = null;
    if (day === 1) {
      seasonalAttMult = 1.3;
      seasonalLabel = 'Opening Day';
    } else if (day % 14 === 0) {
      seasonalAttMult = 1.15;
      seasonalLabel = 'Rivalry Week';
    } else if (day > totalGameDays - 10) {
      seasonalAttMult = 1.1;
      seasonalConcessionMult = 1.2;
      seasonalLabel = 'Championship Push';
    }

    const estAttendance = Math.floor(baseCapacity * attendanceRatio * teamPerfMod * consequenceAttMod * seasonalAttMult);

    // Market condition
    const marketCondition = s.marketCondition ?? 'normal';
    const marketRevMult = s.marketMultiplier ?? 1.0;
    const marketCostMult = marketCondition === 'recession' ? 1.1 : 1.0;

    // Ticket revenue
    const ticketPrice = econ.ticketBasePrice ?? 25;
    const ticketRevenue = estAttendance * ticketPrice;

    // Concession revenue (with staff efficiency bonus from happy specialists)
    const avgQuality = this._getAvgFilterQuality();
    const satisfactionMod = avgQuality * (econ.concessionSatisfactionWeight ?? 0.5) + 0.5;
    const staffEfficiencyBonus = s._staffEfficiencyBonus ?? 0;
    const concessionRevenue = Math.floor(estAttendance * (econ.concessionPerFan ?? 12) * satisfactionMod * (1 + staffEfficiencyBonus) * seasonalConcessionMult);

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
    const adjustedGameRevenue = Math.floor(rawGameRevenue * revenueMultiplier * consequenceRevMod * earlyBoost * difficultyIncomeMult * (1 + expansionRevBoost) * marketRevMult);
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
    const adjustedExpenses = Math.floor(rawExpenses * difficultyExpenseMult * (1 - expansionCostReduction) * marketCostMult);
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
      font-size: 14px; z-index: 30;
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
          <span style="color:#aaa;font-size:11px">
            Game Day <span style="color:#fff">${s.gameDay}</span> |
            Cash: <span style="color:#00e436;font-weight:bold">$${s.money.toLocaleString()}</span>
          </span>
          <span data-action="close-economy" style="cursor:pointer;color:#888;font-size:14px">\u2715</span>
        </div>
      </div>
    `;

    // Two-column layout: Revenue | Expenses
    html += `<div style="flex:1;overflow-y:auto;padding:8px 12px;">`;

    // Market condition badge
    const marketColors = { boom: '#00e436', normal: '#888', recession: '#ff004d' };
    const marketLabels = { boom: 'Boom', normal: 'Normal', recession: 'Recession' };
    const mColor = marketColors[marketCondition] ?? '#888';
    html += `
      <div style="margin-bottom:6px;display:flex;align-items:center;gap:8px;">
        <span style="color:#aaa;font-size:11px;">Market:</span>
        <span style="color:${mColor};font-size:12px;font-weight:bold;border:1px solid ${mColor}44;padding:1px 8px;border-radius:2px;">${marketLabels[marketCondition] ?? 'Normal'}</span>
        ${marketRevMult !== 1.0 ? `<span style="color:${mColor};font-size:10px;">Revenue x${marketRevMult.toFixed(2)}</span>` : ''}
        ${marketCostMult !== 1.0 ? `<span style="color:#ff004d;font-size:10px;">Costs x${marketCostMult.toFixed(2)}</span>` : ''}
      </div>
    `;

    // Off-season revenue display
    if (s.offSeason) {
      const tourIncome = Math.floor((s.reputation ?? 0) * 8);
      const maintContractIncome = (s.staffList ?? []).length * 25;
      html += `
        <div style="margin-bottom:8px;padding:8px;border:1px solid #29adff44;border-radius:3px;background:#29adff08;">
          <div style="color:#29adff;font-weight:bold;font-size:11px;margin-bottom:4px;">OFF-SEASON REVENUE</div>
          ${this._row('Stadium Tours', `+$${tourIncome.toLocaleString()}`, '#29adff', `Rep ${s.reputation}% x $8`)}
          ${this._row('Maint. Contracts', `+$${maintContractIncome.toLocaleString()}`, '#29adff', `${(s.staffList ?? []).length} staff x $25`)}
          ${this._row('Total off-season income', `+$${(tourIncome + maintContractIncome).toLocaleString()}`, '#00e436')}
        </div>
      `;
    }

    // Seasonal modifier banner
    if (seasonalLabel && !s.offSeason) {
      const sAttPct = Math.round((seasonalAttMult - 1) * 100);
      const sConcPct = Math.round((seasonalConcessionMult - 1) * 100);
      let sDesc = `Attendance +${sAttPct}%`;
      if (sConcPct > 0) sDesc += `, Concessions +${sConcPct}%`;
      html += `
        <div style="margin-bottom:6px;padding:5px 8px;border:1px solid #ffec2744;border-radius:2px;background:#ffec2708;display:flex;align-items:center;gap:8px;">
          <span style="color:#ffec27;font-size:12px;font-weight:bold;">${seasonalLabel}</span>
          <span style="color:#aaa;font-size:10px;">${sDesc}</span>
        </div>
      `;
    }

    html += `<div style="display:flex;gap:16px;">`;

    // --- Revenue column ---
    html += `<div style="flex:1;">`;
    html += `<div style="color:#00e436;font-weight:bold;margin-bottom:6px;border-bottom:1px solid #00e43644;padding-bottom:3px;">REVENUE (per game)</div>`;
    html += this._row('Ticket sales', `$${ticketRevenue.toLocaleString()}`, '#aaa', `${estAttendance.toLocaleString()} fans x $${ticketPrice}`);
    html += this._row('Concessions', `$${concessionRevenue.toLocaleString()}`, '#aaa', `Satisfaction: ${Math.round(satisfactionMod * 100)}%`);
    html += this._row('Contract income', `$${contractIncome.toLocaleString()}`, '#29adff', `${activeContracts.length} active contract${activeContracts.length !== 1 ? 's' : ''}`);
    if (staffEfficiencyBonus > 0) {
      const staffBonusDollar = Math.floor(estAttendance * (econ.concessionPerFan ?? 12) * satisfactionMod * staffEfficiencyBonus);
      html += this._row('Staff Quality Bonus', `+$${staffBonusDollar.toLocaleString()}`, '#00e436', `+${Math.round(staffEfficiencyBonus * 100)}% concessions`);
    }

    if (revenueMultiplier !== 1.0 || earlyBoost !== 1.0 || expansionRevBoost > 0 || marketRevMult !== 1.0) {
      html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #222;color:#888;font-size:11px;">Multipliers applied:</div>`;
      if (revenueMultiplier !== 1.0) html += this._row('Game day bonus', `x${revenueMultiplier.toFixed(2)}`, '#ffec27');
      if (earlyBoost !== 1.0) html += this._row('Early season boost', `x${earlyBoost.toFixed(2)}`, '#29adff');
      if (expansionRevBoost > 0) html += this._row('Expansion bonus', `+${Math.round(expansionRevBoost * 100)}%`, '#ffa300');
      if (marketRevMult !== 1.0) html += this._row('Market condition', `x${marketRevMult.toFixed(2)}`, mColor);
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

    if (expansionCostReduction > 0 || difficultyExpenseMult !== 1.0 || marketCostMult !== 1.0) {
      html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #222;color:#888;font-size:11px;">Modifiers applied:</div>`;
      if (expansionCostReduction > 0) html += this._row('Expansion savings', `-${Math.round(expansionCostReduction * 100)}%`, '#29adff');
      if (marketCostMult !== 1.0) html += this._row('Recession cost increase', `x${marketCostMult.toFixed(2)}`, '#ff004d');
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
            <span style="color:${netColor};font-weight:bold;font-size:14px;">${netSign}$${Math.abs(netPerGame).toLocaleString()}</span>
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

    // --- Charts section ---
    html += this._renderCharts({
      ticketRevenue, concessionRevenue, contractIncome,
      adjustedGameRevenue, adjustedExpenses,
    });

    // --- Active modifiers section ---
    const modifiers = [];
    if (marketCondition !== 'normal') modifiers.push({ label: `Market: ${marketLabels[marketCondition]}`, color: mColor });
    if (seasonalLabel) modifiers.push({ label: seasonalLabel, color: '#ffec27' });
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
      html += `<div style="color:#888;font-size:11px;margin-bottom:4px;">ACTIVE MODIFIERS</div>`;
      for (const mod of modifiers) {
        html += `<span style="display:inline-block;color:${mod.color};font-size:10px;border:1px solid ${mod.color}44;padding:1px 5px;border-radius:2px;margin:1px 2px;">${mod.label}</span>`;
      }
      html += `</div>`;
    }

    // --- Budget Forecast section (collapsible) ---
    html += this._renderForecast({
      adjustedGameRevenue, contractIncome, adjustedExpenses,
      staffWages, totalEnergyCost, maintenanceCost,
      day, totalGameDays,
    });

    html += `</div>`; // end scrollable area

    el.innerHTML = html;

    // Click handlers
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close-economy"]')) {
        this.eventBus.emit('ui:closePanel');
      }
      if (e.target.closest('[data-action="toggle-forecast"]')) {
        const body = el.querySelector('[data-forecast-body]');
        if (body) {
          const visible = body.style.display !== 'none';
          body.style.display = visible ? 'none' : 'block';
          const hint = e.target.closest('[data-action="toggle-forecast"]').querySelector('span:last-child');
          if (hint) hint.textContent = visible ? 'click to expand' : 'click to collapse';
        }
      }
    });
  }

  _row(label, value, valueColor, hint) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;">
        <span style="color:#aaa;font-size:11px;">${label}</span>
        <span style="display:flex;align-items:center;gap:6px;">
          ${hint ? `<span style="color:#555;font-size:10px;">${hint}</span>` : ''}
          <span style="color:${valueColor};font-size:12px;">${value}</span>
        </span>
      </div>
    `;
  }

  _renderForecast({ adjustedGameRevenue, contractIncome, adjustedExpenses, staffWages, totalEnergyCost, maintenanceCost, day, totalGameDays }) {
    const s = this.state;
    const forecastDays = 10;

    // Use current-day revenue as the daily baseline, projected forward
    const dailyIncome = adjustedGameRevenue + contractIncome;
    const projectedRevenue = dailyIncome * forecastDays;
    const dailyCosts = adjustedExpenses;
    const dailyNet = dailyIncome - dailyCosts;

    // Color coding for net and runway
    let netColor, netLabel;
    if (dailyNet >= 0) {
      netColor = '#00e436';
      netLabel = 'Growing';
    } else {
      const runway = Math.floor(s.money / Math.abs(dailyNet));
      if (runway < 10) {
        netColor = '#ff004d';
      } else {
        netColor = '#ffec27';
      }
      netLabel = `Runway: ${runway} days`;
    }

    const netSign = dailyNet >= 0 ? '+' : '-';

    let html = `
      <div style="margin-top:8px;border-top:1px solid #3a3a5a;">
        <div data-action="toggle-forecast" style="cursor:pointer;padding:6px 0;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#29adff;font-weight:bold;font-size:11px;letter-spacing:1px;">BUDGET FORECAST</span>
          <span style="color:#555;font-size:10px;">click to expand</span>
        </div>
        <div data-forecast-body style="display:none;padding-bottom:6px;">
    `;

    // Projected 10-day income
    html += this._row(`Projected ${forecastDays}-Day Income`, `$${projectedRevenue.toLocaleString()}`, '#29adff', `~$${dailyIncome.toLocaleString()}/day`);

    // Recurring cost breakdown
    html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #222;color:#888;font-size:11px;">Daily Cost Breakdown</div>`;
    html += this._row('Staff Wages', `-$${staffWages.toLocaleString()}/day`, '#aaa');
    html += this._row('Energy', `-$${totalEnergyCost.toLocaleString()}/day`, '#aaa');
    html += this._row('Maintenance', `-$${maintenanceCost.toLocaleString()}/day`, '#aaa');
    html += this._row('Total Burn Rate', `-$${dailyCosts.toLocaleString()}/day`, '#ff004d');

    // Break-even & runway
    html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #222;">`;
    html += this._row('Daily Net', `${netSign}$${Math.abs(dailyNet).toLocaleString()}/day`, netColor, netLabel);
    html += `</div>`;

    html += `</div></div>`;
    return html;
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
    return Math.min(total, 1.0); // cap at +100%
  }

  _getExpansionCostReduction() {
    const expansions = this.state.config.expansions ?? [];
    const purchased = this.state.purchasedExpansions ?? [];
    let total = 0;
    for (const pe of purchased) {
      const def = expansions.find(e => e.id === pe.key);
      if (def?.operatingCostReduction) total += def.operatingCostReduction;
    }
    return Math.min(total, 0.30); // cap at 30%
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

  // ── Charts ────────────────────────────────────────────────────────────

  _renderCharts({ ticketRevenue, concessionRevenue, contractIncome, adjustedGameRevenue, adjustedExpenses }) {
    const history = this.state.stats?.dailyHistory ?? [];
    let html = '';

    // Revenue breakdown stacked bar (kept as is — not a time series)
    const totalRev = ticketRevenue + concessionRevenue + contractIncome;
    if (totalRev > 0) {
      const tPct = Math.round(ticketRevenue / totalRev * 100);
      const cPct = Math.round(concessionRevenue / totalRev * 100);
      const sPct = 100 - tPct - cPct;
      html += `
        <div style="margin-top:10px;">
          <div style="color:#888;font-size:10px;margin-bottom:3px;">REVENUE BREAKDOWN</div>
          <div style="display:flex;height:10px;border-radius:2px;overflow:hidden;border:1px solid #333;">
            <div style="width:${tPct}%;background:#29adff;" title="Tickets ${tPct}%"></div>
            <div style="width:${cPct}%;background:#ffa300;" title="Concessions ${cPct}%"></div>
            <div style="width:${sPct}%;background:#a78bfa;" title="Contracts ${sPct}%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:2px;">
            <span style="color:#29adff;font-size:9px;">\u25CF Tickets ${tPct}%</span>
            <span style="color:#ffa300;font-size:9px;">\u25CF Concessions ${cPct}%</span>
            <span style="color:#a78bfa;font-size:9px;">\u25CF Contracts ${sPct}%</span>
          </div>
        </div>
      `;
    }

    if (history.length >= 2) {
      const recent = history.slice(-15);

      // Income vs Expenses — dual line graph
      html += this._svgLineChart({
        title: 'INCOME vs EXPENSES',
        data: recent,
        lines: [
          { key: 'income', color: '#00e436', label: 'Income' },
          { key: 'expenses', color: '#ff004d', label: 'Expenses' },
        ],
        format: v => `$${Math.round(v).toLocaleString()}`,
        height: 70,
      });

      // Net Profit — single line with zero line and trend
      html += this._svgLineChart({
        title: 'NET PROFIT TREND',
        data: recent,
        lines: [
          { key: 'net', color: '#ffec27', label: 'Net', fill: true },
        ],
        showZeroLine: true,
        showTrend: true,
        format: v => `${v >= 0 ? '+' : ''}$${Math.round(v).toLocaleString()}`,
        height: 60,
      });

      // Cash Balance — single line with trend
      html += this._svgLineChart({
        title: 'CASH BALANCE',
        data: recent,
        lines: [
          { key: 'money', color: '#00e436', label: 'Cash', fill: true },
        ],
        showTrend: true,
        format: v => `$${Math.round(v).toLocaleString()}`,
        height: 55,
      });
    } else {
      html += `<div style="margin-top:10px;color:#555;font-size:10px;font-style:italic;">Time-series charts available after 2+ game days.</div>`;
    }

    return html;
  }

  /**
   * Render an SVG time-series line chart.
   * @param {object} opts - { title, data[], lines[{key, color, label, fill?}], format?, height?, showZeroLine?, showTrend? }
   */
  _svgLineChart({ title, data, lines, format, height = 60, showZeroLine = false, showTrend = false }) {
    if (data.length < 2) return '';
    const W = 320, H = height, PAD = { top: 4, right: 8, bottom: 14, left: 42 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    // Compute global min/max across all line series
    let allVals = [];
    for (const line of lines) {
      for (const d of data) allVals.push(d[line.key] ?? 0);
    }
    let yMin = Math.min(...allVals);
    let yMax = Math.max(...allVals);
    if (showZeroLine) { yMin = Math.min(yMin, 0); yMax = Math.max(yMax, 0); }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const yRange = yMax - yMin;

    const toX = (i) => PAD.left + (i / (data.length - 1)) * plotW;
    const toY = (v) => PAD.top + (1 - (v - yMin) / yRange) * plotH;
    const fmt = format ?? (v => String(Math.round(v)));

    let svg = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="display:block;margin-top:8px;" xmlns="http://www.w3.org/2000/svg">`;

    // Background
    svg += `<rect x="${PAD.left}" y="${PAD.top}" width="${plotW}" height="${plotH}" fill="#0a0a14" rx="2"/>`;

    // Horizontal grid lines (3 lines)
    for (let g = 0; g <= 2; g++) {
      const gv = yMin + (yRange * g / 2);
      const gy = toY(gv);
      svg += `<line x1="${PAD.left}" y1="${gy}" x2="${PAD.left + plotW}" y2="${gy}" stroke="#222" stroke-width="0.5"/>`;
      svg += `<text x="${PAD.left - 3}" y="${gy + 3}" text-anchor="end" fill="#555" font-size="7" font-family="monospace">${fmt(gv)}</text>`;
    }

    // Zero line
    if (showZeroLine && yMin < 0 && yMax > 0) {
      const zy = toY(0);
      svg += `<line x1="${PAD.left}" y1="${zy}" x2="${PAD.left + plotW}" y2="${zy}" stroke="#555" stroke-width="0.5" stroke-dasharray="3,2"/>`;
    }

    // Day labels on x-axis
    const labelStep = Math.max(1, Math.floor(data.length / 5));
    for (let i = 0; i < data.length; i += labelStep) {
      svg += `<text x="${toX(i)}" y="${H - 2}" text-anchor="middle" fill="#555" font-size="7" font-family="monospace">${data[i].day}</text>`;
    }
    // Always show last day label
    if ((data.length - 1) % labelStep !== 0) {
      svg += `<text x="${toX(data.length - 1)}" y="${H - 2}" text-anchor="middle" fill="#555" font-size="7" font-family="monospace">${data[data.length - 1].day}</text>`;
    }

    // Draw each line series
    for (const line of lines) {
      const vals = data.map(d => d[line.key] ?? 0);
      const points = vals.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`);
      const polyline = points.join(' ');

      // Filled area under the line
      if (line.fill) {
        const baseline = showZeroLine ? toY(0) : PAD.top + plotH;
        const areaPoints = `${toX(0).toFixed(1)},${baseline} ${polyline} ${toX(data.length - 1).toFixed(1)},${baseline}`;
        svg += `<polygon points="${areaPoints}" fill="${line.color}" opacity="0.1"/>`;
      }

      // Line
      svg += `<polyline points="${polyline}" fill="none" stroke="${line.color}" stroke-width="0.5" stroke-linejoin="round" stroke-linecap="round"/>`;

      // Data point dots
      for (let i = 0; i < vals.length; i++) {
        svg += `<circle cx="${toX(i).toFixed(1)}" cy="${toY(vals[i]).toFixed(1)}" r="1.5" fill="${line.color}">`;
        svg += `<title>Day ${data[i].day}: ${fmt(vals[i])}</title></circle>`;
      }

      // Trend line (linear regression)
      if (showTrend && vals.length >= 3) {
        const n = vals.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
          sumX += i; sumY += vals[i]; sumXY += i * vals[i]; sumXX += i * i;
        }
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const trendStart = intercept;
        const trendEnd = intercept + slope * (n - 1);
        const trendColor = slope >= 0 ? '#00e436' : '#ff004d';
        svg += `<line x1="${toX(0).toFixed(1)}" y1="${toY(trendStart).toFixed(1)}" x2="${toX(n - 1).toFixed(1)}" y2="${toY(trendEnd).toFixed(1)}" stroke="${trendColor}" stroke-width="0.8" stroke-dasharray="4,3" opacity="0.6"/>`;
        // Trend arrow label
        const trendDir = slope >= 0 ? '\u2191' : '\u2193';
        const trendPct = vals[0] !== 0 ? Math.abs(Math.round(slope * (n - 1) / Math.abs(vals[0]) * 100)) : 0;
        svg += `<text x="${toX(n - 1).toFixed(1)}" y="${toY(trendEnd).toFixed(1) - 4}" text-anchor="end" fill="${trendColor}" font-size="7" font-family="monospace">${trendDir}${trendPct}%</text>`;
      }
    }

    svg += `</svg>`;

    // Legend
    let legend = '<div style="display:flex;gap:10px;margin-top:1px;">';
    for (const line of lines) {
      legend += `<span style="color:${line.color};font-size:9px;">\u25CF ${line.label}</span>`;
    }
    if (showTrend) legend += `<span style="color:#888;font-size:8px;margin-left:auto;">--- trend</span>`;
    legend += '</div>';

    return `
      <div style="margin-top:10px;">
        <div style="color:#888;font-size:10px;margin-bottom:1px;">${title}</div>
        ${svg}
        ${legend}
      </div>
    `;
  }
}
