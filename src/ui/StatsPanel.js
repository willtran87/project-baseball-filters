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
}
