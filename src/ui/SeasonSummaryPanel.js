/**
 * SeasonSummaryPanel -- Displays a report card at the end of each season.
 *
 * Auto-opens when `season:summary` fires. Shows season stats and a grade.
 * Player clicks "Continue to Off-Season" to dismiss.
 */

export class SeasonSummaryPanel {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this._el = null;
    this._visible = false;

    this.eventBus.on('season:summary', (data) => this.show(data));
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._visible) {
        this.hide();
        if (result) result.closed = true;
      }
    });
  }

  show(data) {
    this.eventBus.emit('ui:closeAllPanels');
    this.hide();
    this._visible = true;
    this._el = document.createElement('div');
    this._el.id = 'season-summary-panel';
    this._el.style.cssText = `
      position: absolute; top: 15%; left: 15%; right: 15%; bottom: 15%;
      background: linear-gradient(180deg, rgba(20,15,10,0.98), rgba(10,10,30,0.98));
      border: 3px solid #8b4513;
      border-radius: 6px;
      font-family: monospace; color: #e0e0e0;
      font-size: 11px; z-index: 35;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 30px rgba(139,69,19,0.3), inset 0 0 40px rgba(0,0,0,0.3);
    `;
    this._render(data);
    this.container.appendChild(this._el);

    // Pause the game while summary is shown
    this.eventBus.emit('game:pause');
  }

  hide() {
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
    this._visible = false;
  }

  _render(data) {
    if (!this._el) return;

    const gradeColors = {
      'A': '#00e436',
      'B': '#29adff',
      'C': '#ffec27',
      'D': '#ffa300',
      'F': '#ff004d',
    };
    const gradeColor = gradeColors[data.grade] ?? '#888';
    const gradeLabel = {
      'A': 'Outstanding',
      'B': 'Good',
      'C': 'Adequate',
      'D': 'Below Average',
      'F': 'Failing',
    };

    const profitColor = data.netProfit >= 0 ? '#00e436' : '#ff004d';
    const profitSign = data.netProfit >= 0 ? '+' : '';

    let html = '';

    // Header
    html += `
      <div style="text-align:center;padding:12px 16px;border-bottom:2px solid #8b4513;background:rgba(139,69,19,0.1)">
        <div style="color:#ffec27;font-size:16px;letter-spacing:3px;margin-bottom:4px;">SEASON ${data.season} REPORT</div>
        <div style="color:#888;font-size:10px;">End of Season Performance Review</div>
      </div>
    `;

    // Grade display - large centered
    html += `
      <div style="text-align:center;padding:16px 0 8px 0;">
        <div style="display:inline-block;border:3px solid ${gradeColor};border-radius:8px;padding:12px 24px;background:${gradeColor}11;">
          <div style="font-size:36px;font-weight:bold;color:${gradeColor};line-height:1;">${data.grade}</div>
          <div style="font-size:10px;color:${gradeColor};margin-top:4px;">${gradeLabel[data.grade] ?? ''}</div>
        </div>
      </div>
    `;

    // Stats grid
    html += `<div style="flex:1;overflow-y:auto;padding:8px 20px;">`;
    html += `<div style="display:flex;gap:20px;">`;

    // Left column
    html += `<div style="flex:1;">`;
    html += this._sectionHeader('PERFORMANCE');
    html += this._statRow('Reputation', `${data.reputationEnd}%`, data.reputationEnd > 70 ? '#00e436' : data.reputationEnd > 40 ? '#ffec27' : '#ff004d');
    html += this._statRow('Games Played', data.gamesPlayed);

    html += this._sectionHeader('FINANCES');
    html += this._statRow('Net Profit', `${profitSign}$${Math.abs(data.netProfit).toLocaleString()}`, profitColor);
    html += `</div>`;

    // Right column
    html += `<div style="flex:1;">`;
    html += this._sectionHeader('FILTRATION');
    html += this._statRow('Filters Installed', data.filtersInstalled ?? 0);
    html += this._statRow('Filters Broken', data.filtersBroken ?? 0, (data.filtersBroken ?? 0) > 5 ? '#ff004d' : '#aaa');
    html += this._statRow('Filters Repaired', data.filtersRepaired ?? 0);
    html += `</div>`;

    html += `</div>`; // end flex
    html += `</div>`; // end scroll area

    // Continue button
    html += `
      <div style="padding:12px 20px;border-top:1px solid #8b4513;text-align:center;background:rgba(0,0,0,0.2);">
        <button data-action="continue" style="
          background: linear-gradient(180deg, #2a4a2a, #1a3a1a);
          color: #00e436;
          border: 2px solid #4a6a4a;
          padding: 8px 24px;
          font-family: monospace;
          font-size: 12px;
          cursor: pointer;
          border-radius: 4px;
          letter-spacing: 1px;
        ">Continue to Off-Season</button>
      </div>
    `;

    this._el.innerHTML = html;

    // Wire continue button
    this._el.querySelector('[data-action="continue"]')?.addEventListener('click', () => {
      this.eventBus.emit('ui:click');
      this.hide();
      this.eventBus.emit('game:resume');
    });
  }

  _sectionHeader(label) {
    return `
      <div style="color:#8b4513;font-size:10px;letter-spacing:1px;margin-top:8px;margin-bottom:4px;padding-bottom:3px;border-bottom:1px solid #8b451344;">
        ${label}
      </div>
    `;
  }

  _statRow(label, value, valueColor = '#aaa') {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;">
        <span style="color:#888;font-size:10px;">${label}</span>
        <span style="color:${valueColor};font-size:11px;font-weight:bold;">${value}</span>
      </div>
    `;
  }
}
