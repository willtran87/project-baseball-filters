/**
 * StatsPanel -- Displays lifetime and seasonal statistics in a categorized grid.
 *
 * Toggle via `ui:toggleStats` event or 'y' keyboard shortcut.
 * Standalone overlay panel (same pattern as ObjectivesPanel).
 */

export class StatsPanel {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this._el = null;
    this._visible = false;

    this.eventBus.on('ui:toggleStats', () => this.toggle());
    this.eventBus.on('ui:closeStats', () => this.hide());
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._visible) {
        this.hide();
        if (result) result.closed = true;
      }
    });

    // Auto-refresh when visible
    this.eventBus.on('game:newDay', () => { if (this._visible) this._render(); });
    this.eventBus.on('economy:inningEnd', () => { if (this._visible) this._render(); });
  }

  toggle() {
    if (this._visible) this.hide(); else this.show();
  }

  show() {
    this.eventBus.emit('ui:closeAllPanels');
    this.hide();
    this._visible = true;
    this._el = document.createElement('div');
    this._el.id = 'stats-panel';
    this._el.style.cssText = `
      position: absolute; top: 24px; left: 8%; right: 8%; bottom: 24px;
      background: linear-gradient(180deg, rgba(15,10,5,0.97), rgba(8,8,24,0.97));
      border: 2px solid #8b4513;
      border-radius: 4px;
      font-family: monospace; color: #e0e0e0;
      font-size: 11px; z-index: 30;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(139,69,19,0.2);
    `;
    this._render();
    this.container.appendChild(this._el);
  }

  hide() {
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
    this._visible = false;
  }

  _render() {
    if (!this._el) return;
    const s = this.state;
    const stats = s.stats ?? {};

    // Header
    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:2px solid #8b4513;background:rgba(139,69,19,0.08)">
        <span style="color:#ffec27;font-size:13px;letter-spacing:2px">STADIUM STATISTICS</span>
        <span data-action="close" style="cursor:pointer;color:#888;font-size:12px;padding:0 4px" title="Close (Y)">&#10005;</span>
      </div>
    `;

    html += `<div style="flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#8b4513 #111;padding:8px 12px;">`;

    // Two-column grid layout
    html += `<div style="display:flex;gap:16px;">`;

    // Left column
    html += `<div style="flex:1;">`;

    // Season group
    html += this._groupHeader('SEASON', '#29adff');
    html += this._statRow('Current Season', s.season ?? 1, '#fff');
    html += this._statRow('Seasons Completed', stats.seasonsCompleted ?? 0);
    html += this._statRow('Game Days Played', stats.totalGamesPlayed ?? 0);
    html += this._statRow('Current Streak', `${s.goodDayStreak ?? 0} days`, '#ffec27');
    html += this._statRow('Best Streak', `${s.bestStreak ?? 0} days`, '#ff77a8');

    // Finances group
    html += this._groupHeader('FINANCES', '#00e436');
    html += this._statRow('Cash on Hand', `$${(s.money ?? 0).toLocaleString()}`, '#00e436');
    html += this._statRow('Total Earned', `$${(stats.totalMoneyEarned ?? 0).toLocaleString()}`);
    html += this._statRow('Total Spent', `$${(stats.totalMoneySpent ?? 0).toLocaleString()}`);
    const netProfit = (stats.totalMoneyEarned ?? 0) - (stats.totalMoneySpent ?? 0);
    const profitColor = netProfit >= 0 ? '#00e436' : '#ff004d';
    html += this._statRow('Net Profit', `${netProfit >= 0 ? '+' : ''}$${netProfit.toLocaleString()}`, profitColor);
    html += this._statRow('Loans Taken', stats.loansRequested ?? 0);
    html += this._statRow('Active Loans', (s.activeLoans ?? []).length);

    html += `</div>`;

    // Right column
    html += `<div style="flex:1;">`;

    // Filters group
    html += this._groupHeader('FILTERS', '#ffa300');
    html += this._statRow('Active Filters', (s.filters ?? []).length, '#fff');
    html += this._statRow('Installed (Total)', stats.filtersInstalled ?? 0);
    html += this._statRow('Repaired', stats.filtersRepaired ?? 0);
    html += this._statRow('Upgraded', stats.filtersUpgraded ?? 0);
    html += this._statRow('Broken', stats.filtersBroken ?? 0, (stats.filtersBroken ?? 0) > 0 ? '#ff004d' : '#aaa');

    // Events group
    html += this._groupHeader('EVENTS', '#ff77a8');
    html += this._statRow('Weather Events', stats.weatherEventsEndured ?? 0);
    html += this._statRow('Expansions', stats.expansionsPurchased ?? 0);
    html += this._statRow('Current Reputation', `${Math.floor(s.reputation ?? 0)}%`, '#ffec27');
    html += this._statRow('Highest Reputation', `${Math.floor(stats.highestReputation ?? 0)}%`, (stats.highestReputation ?? 0) > 80 ? '#00e436' : '#aaa');
    html += this._statRow('Best Attendance', `${stats.bestAttendancePercent ?? 0}%`);

    // Social group
    html += this._groupHeader('SOCIAL', '#cc44cc');
    html += this._statRow('NPC Chats', stats.npcChats ?? 0);
    html += this._statRow('Story Chapter', s.storyChapter ?? 1);
    html += this._statRow("Hank's Notes", `${(s.hanksNotes ?? []).length} / 8`);
    html += this._statRow('Achievements', (s.achievements ?? []).length);

    html += `</div>`;
    html += `</div>`; // end flex columns

    // --- Charts section ---
    html += this._renderCharts(s, stats);

    html += `</div>`; // end scroll area

    this._el.innerHTML = html;

    // Close button
    this._el.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      this.eventBus.emit('ui:click');
      this.hide();
    });
  }

  _groupHeader(label, color) {
    return `
      <div style="color:${color};font-size:10px;letter-spacing:1px;margin-top:10px;margin-bottom:4px;padding-bottom:3px;border-bottom:1px solid ${color}44;">
        ${label}
      </div>
    `;
  }

  _statRow(label, value, valueColor = '#aaa') {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
        <span style="color:#888;font-size:9px;">${label}</span>
        <span style="color:${valueColor};font-size:10px;">${value}</span>
      </div>
    `;
  }

  // ── Charts ────────────────────────────────────────────────────────────

  _renderCharts(s, stats) {
    let html = '';

    // Domain Health horizontal bars
    const health = s.domainHealth ?? {};
    const domains = [
      { id: 'air', name: 'Air', color: '#cccccc' },
      { id: 'water', name: 'Water', color: '#4488ff' },
      { id: 'hvac', name: 'HVAC', color: '#ff8844' },
      { id: 'drainage', name: 'Drainage', color: '#44bb44' },
    ];

    html += `<div style="margin-top:12px;border-top:1px solid #3a3a5a;padding-top:8px;">`;
    html += `<div style="color:#ffec27;font-size:10px;letter-spacing:1px;margin-bottom:6px;">SYSTEM HEALTH</div>`;
    for (const d of domains) {
      const hp = Math.floor(health[d.id] ?? 0);
      const barColor = hp > 60 ? d.color : hp > 30 ? '#ffa300' : '#ff004d';
      html += `
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="color:${d.color};font-size:9px;width:52px;">${d.name}</span>
          <div style="flex:1;height:8px;background:#1a1a2e;border:1px solid #333;border-radius:2px;overflow:hidden;">
            <div style="width:${hp}%;height:100%;background:${barColor};border-radius:1px;transition:width 0.3s;"></div>
          </div>
          <span style="color:${barColor};font-size:9px;width:28px;text-align:right;">${hp}%</span>
        </div>
      `;
    }
    html += `</div>`;

    // Reputation progress bar with tier markers
    const rep = Math.floor(s.reputation ?? 0);
    const tiers = [
      { min: 0, label: 'Condemned', color: '#ff004d' },
      { min: 21, label: 'Minor Lg', color: '#ffa300' },
      { min: 41, label: 'Single-A', color: '#ffec27' },
      { min: 56, label: 'Double-A', color: '#29adff' },
      { min: 71, label: 'Triple-A', color: '#00e436' },
      { min: 86, label: 'Major Lg', color: '#a78bfa' },
    ];
    const currentTier = [...tiers].reverse().find(t => rep >= t.min);
    html += `
      <div style="margin-top:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <span style="color:#ffec27;font-size:10px;letter-spacing:1px;">REPUTATION</span>
          <span style="color:${currentTier?.color ?? '#888'};font-size:10px;font-weight:bold;">${rep}% — ${currentTier?.label ?? ''}</span>
        </div>
        <div style="position:relative;height:12px;background:#1a1a2e;border:1px solid #333;border-radius:2px;overflow:hidden;">
          <div style="width:${rep}%;height:100%;background:linear-gradient(90deg,#ff004d 0%,#ffa300 25%,#ffec27 45%,#29adff 60%,#00e436 75%,#a78bfa 100%);border-radius:1px;"></div>
    `;
    // Tier marker lines
    for (const t of tiers) {
      if (t.min > 0 && t.min < 100) {
        html += `<div style="position:absolute;left:${t.min}%;top:0;width:1px;height:100%;background:#555;" title="${t.label} (${t.min}%)"></div>`;
      }
    }
    html += `
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:1px;">
    `;
    for (const t of tiers) {
      if (t.min > 0) {
        html += `<span style="color:#444;font-size:7px;">${t.min}</span>`;
      }
    }
    html += `</div></div>`;

    // Financial summary: Earned vs Spent bars
    const earned = stats.totalMoneyEarned ?? 0;
    const spent = stats.totalMoneySpent ?? 0;
    const finMax = Math.max(earned, spent, 1);
    html += `
      <div style="margin-top:10px;">
        <div style="color:#ffec27;font-size:10px;letter-spacing:1px;margin-bottom:4px;">LIFETIME FINANCES</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="color:#00e436;font-size:9px;width:42px;">Earned</span>
          <div style="flex:1;height:8px;background:#1a1a2e;border:1px solid #333;border-radius:2px;overflow:hidden;">
            <div style="width:${Math.round(earned / finMax * 100)}%;height:100%;background:#00e436;border-radius:1px;"></div>
          </div>
          <span style="color:#00e436;font-size:8px;">$${earned.toLocaleString()}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="color:#ff004d;font-size:9px;width:42px;">Spent</span>
          <div style="flex:1;height:8px;background:#1a1a2e;border:1px solid #333;border-radius:2px;overflow:hidden;">
            <div style="width:${Math.round(spent / finMax * 100)}%;height:100%;background:#ff004d;border-radius:1px;"></div>
          </div>
          <span style="color:#ff004d;font-size:8px;">$${spent.toLocaleString()}</span>
        </div>
      </div>
    `;

    // Domain health time-series from season samples
    const samples = stats.seasonDomainHealthSamples ?? {};
    const hasSamples = domains.some(d => (samples[d.id] ?? []).length >= 3);
    if (hasSamples) {
      // Build synthetic data array from domain health samples
      const maxLen = Math.max(...domains.map(d => (samples[d.id] ?? []).length));
      const sampleData = [];
      for (let i = Math.max(0, maxLen - 20); i < maxLen; i++) {
        const pt = { day: i + 1 };
        for (const d of domains) pt[d.id] = (samples[d.id] ?? [])[i] ?? 0;
        sampleData.push(pt);
      }
      if (sampleData.length >= 2) {
        html += this._svgLineChart({
          title: 'SEASON HEALTH TRENDS',
          data: sampleData,
          lines: domains.map(d => ({ key: d.id, color: d.color, label: d.name })),
          format: v => `${Math.round(v)}%`,
          height: 75,
          yDomain: [0, 100],
        });
      }
    }

    // Reputation & Attendance history from daily snapshots
    const history = stats.dailyHistory ?? [];
    if (history.length >= 2) {
      const recent = history.slice(-20);

      html += this._svgLineChart({
        title: 'REPUTATION HISTORY',
        data: recent,
        lines: [{ key: 'reputation', color: '#ffec27', label: 'Reputation', fill: true }],
        showTrend: true,
        format: v => `${Math.round(v)}%`,
        height: 60,
        yDomain: [0, 100],
      });

      html += this._svgLineChart({
        title: 'ATTENDANCE HISTORY',
        data: recent,
        lines: [{ key: 'attendance', color: '#29adff', label: 'Attendance', fill: true }],
        showTrend: true,
        format: v => `${Math.round(v)}%`,
        height: 60,
        yDomain: [0, 100],
      });

      // Income vs Expenses from daily history
      const hasFinancials = recent.some(d => (d.income ?? 0) > 0 || (d.expenses ?? 0) > 0);
      if (hasFinancials) {
        html += this._svgLineChart({
          title: 'DAILY INCOME vs EXPENSES',
          data: recent,
          lines: [
            { key: 'income', color: '#00e436', label: 'Income' },
            { key: 'expenses', color: '#ff004d', label: 'Expenses' },
          ],
          format: v => `$${Math.round(v).toLocaleString()}`,
          height: 65,
        });
      }
    }

    return html;
  }

  /**
   * Render an SVG time-series line chart (same approach as EconomyPanel).
   * @param {object} opts - { title, data[], lines[{key, color, label, fill?}], format?, height?, showZeroLine?, showTrend?, yDomain? }
   */
  _svgLineChart({ title, data, lines, format, height = 60, showZeroLine = false, showTrend = false, yDomain }) {
    if (data.length < 2) return '';
    const W = 320, H = height, PAD = { top: 4, right: 8, bottom: 14, left: 38 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    // Compute global min/max across all line series
    let allVals = [];
    for (const line of lines) {
      for (const d of data) allVals.push(d[line.key] ?? 0);
    }
    let yMin = yDomain ? yDomain[0] : Math.min(...allVals);
    let yMax = yDomain ? yDomain[1] : Math.max(...allVals);
    if (showZeroLine) { yMin = Math.min(yMin, 0); yMax = Math.max(yMax, 0); }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const yRange = yMax - yMin;

    const toX = (i) => PAD.left + (i / (data.length - 1)) * plotW;
    const toY = (v) => PAD.top + (1 - (v - yMin) / yRange) * plotH;
    const fmt = format ?? (v => String(Math.round(v)));

    let svg = `<svg width="100%" viewBox="0 0 ${W} ${H}" style="display:block;margin-top:6px;" xmlns="http://www.w3.org/2000/svg">`;

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
        const trendDir = slope >= 0 ? '\u2191' : '\u2193';
        const trendPct = vals[0] !== 0 ? Math.abs(Math.round(slope * (n - 1) / Math.abs(vals[0]) * 100)) : 0;
        svg += `<text x="${toX(n - 1).toFixed(1)}" y="${toY(trendEnd).toFixed(1) - 4}" text-anchor="end" fill="${trendColor}" font-size="7" font-family="monospace">${trendDir}${trendPct}%</text>`;
      }
    }

    svg += `</svg>`;

    // Legend
    let legend = '<div style="display:flex;gap:8px;margin-top:1px;flex-wrap:wrap;">';
    for (const line of lines) {
      legend += `<span style="color:${line.color};font-size:8px;">\u25CF ${line.label}</span>`;
    }
    if (showTrend) legend += `<span style="color:#888;font-size:7px;margin-left:auto;">--- trend</span>`;
    legend += '</div>';

    return `
      <div style="margin-top:8px;">
        <div style="color:#ffec27;font-size:10px;letter-spacing:1px;margin-bottom:1px;">${title}</div>
        ${svg}
        ${legend}
      </div>
    `;
  }
}
