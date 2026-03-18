/**
 * PrestigeMenu -- Legacy Hall panel showing prestige points, perks, and career stats.
 *
 * Standalone overlay panel (same pattern as StatsPanel / ObjectivesPanel).
 * Toggle via `ui:togglePrestige` event.
 * Requires a PrestigeSystem reference passed in constructor.
 */

export class PrestigeMenu {
  constructor(container, state, eventBus, prestige) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this.prestige = prestige;
    this._el = null;
    this._visible = false;

    this.eventBus.on('ui:togglePrestige', () => this.toggle());
    this.eventBus.on('ui:closePrestige', () => this.hide());
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._visible) {
        this.hide();
        if (result) result.closed = true;
      }
    });
  }

  toggle() {
    if (this._visible) this.hide(); else this.show();
  }

  show() {
    this.eventBus.emit('ui:closeAllPanels');
    this.hide();
    this._visible = true;
    this._el = document.createElement('div');
    this._el.id = 'prestige-menu';
    this._el.style.cssText = `
      position: absolute; top: 24px; left: 8%; right: 8%; bottom: 24px;
      background: linear-gradient(180deg, rgba(15,10,5,0.97), rgba(8,8,24,0.97));
      border: 2px solid #8b4513;
      border-radius: 4px;
      font-family: monospace; color: #e0e0e0;
      font-size: 14px; z-index: 30;
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

    const data = this.prestige.getData();
    const defs = this.prestige.getUnlockDefinitions();
    const activePerks = defs.filter(d => d.unlocked);
    const availablePerks = defs.filter(d => !d.unlocked);

    // Career stats from prestige data + current game state
    const stats = this.state.stats ?? {};
    const careerGames = data.totalGamesPlayed;
    const careerWins = data.totalWins;
    const bestGrade = data.bestGrade ?? '--';
    const highestRep = stats.highestReputation ?? Math.floor(this.state.reputation ?? 0);
    const totalEarned = stats.totalMoneyEarned ?? 0;
    const seasonsCompleted = stats.seasonsCompleted ?? 0;

    // Active perks section
    let activePerksHtml = '';
    if (activePerks.length === 0) {
      activePerksHtml = '<div style="color:#666;font-style:italic;padding:4px 0">No perks unlocked yet.</div>';
    } else {
      activePerksHtml = activePerks.map(p =>
        `<div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid #222">
          <span style="color:#00e436;font-size:12px">&#10003;</span>
          <span style="color:#ffec27;font-size:12px">${p.name}</span>
          <span style="color:#888;font-size:10px;flex:1">${p.description}</span>
        </div>`
      ).join('');
    }

    // Available unlocks grid
    let unlocksHtml = '';
    if (availablePerks.length === 0) {
      unlocksHtml = '<div style="color:#00e436;font-style:italic;padding:4px 0">All perks unlocked!</div>';
    } else {
      unlocksHtml = availablePerks.map(p => {
        const canBuy = data.legacyPoints >= p.cost;
        const tierLabel = p.tier ? ` [${p.tier.toUpperCase()}]` : '';
        return `<div style="
          background:rgba(255,236,39,${canBuy ? '0.06' : '0.02'});
          border:1px solid ${canBuy ? '#5a5a3a' : '#2a2a2a'};border-radius:3px;
          padding:8px 8px;
        ">
          <div style="font-size:12px;color:${canBuy ? '#c0c0d0' : '#666'};font-weight:bold;margin-bottom:2px">
            ${p.name}${tierLabel}
          </div>
          <div style="font-size:10px;color:#777;margin-bottom:4px;line-height:1.3">${p.description}</div>
          <button data-unlock-id="${p.id}" data-cost="${p.cost}" ${canBuy ? '' : 'disabled'} style="
            background:${canBuy ? 'linear-gradient(180deg,#2a2a1a,#1a1a0d)' : 'transparent'};
            color:${canBuy ? '#ffec27' : '#555'};
            border:1px solid ${canBuy ? '#5a5a3a' : '#333'};border-radius:2px;
            padding:4px 8px;font-family:monospace;font-size:10px;
            cursor:${canBuy ? 'pointer' : 'default'};
            opacity:${canBuy ? '1' : '0.5'};
          ">${canBuy ? `UNLOCK (${p.cost} LP)` : `${p.cost} LP`}</button>
        </div>`;
      }).join('');
    }

    this._el.innerHTML = `
      <!-- Header -->
      <div style="
        display:flex;justify-content:space-between;align-items:center;
        padding:8px 12px;border-bottom:1px solid #333;
        background:rgba(139,69,19,0.08);flex-shrink:0;
      ">
        <div>
          <span style="color:#ffec27;font-size:14px;letter-spacing:2px;font-weight:bold">LEGACY HALL</span>
          <span style="color:#8b4513;font-size:10px;margin-left:6px;letter-spacing:1px">PRESTIGE</span>
        </div>
        <button data-action="close" style="
          background:transparent;color:#888;border:1px solid #444;
          border-radius:2px;padding:4px 8px;font-family:monospace;
          font-size:11px;cursor:pointer;
        ">X</button>
      </div>

      <!-- Scrollable body -->
      <div style="flex:1;overflow-y:auto;padding:10px 14px;">

        <!-- Section 1: Legacy Points -->
        <div style="text-align:center;margin-bottom:14px;padding:8px;background:rgba(0,0,0,0.3);border-radius:3px;border:1px solid #333">
          <div style="font-size:10px;color:#8b4513;letter-spacing:2px;margin-bottom:4px">LEGACY POINTS</div>
          <div style="font-size:22px;color:#ffec27;letter-spacing:1px">${data.legacyPoints}</div>
          <div style="font-size:10px;color:#666;margin-top:2px">
            Career Total: ${careerGames} game${careerGames !== 1 ? 's' : ''} played
          </div>
        </div>

        <!-- Section 2: Active Perks -->
        <div style="margin-bottom:14px">
          <div style="color:#8b4513;font-size:11px;letter-spacing:2px;margin-bottom:6px;border-bottom:1px solid #2a2a2a;padding-bottom:5px">
            ACTIVE PERKS (${activePerks.length})
          </div>
          ${activePerksHtml}
        </div>

        <!-- Section 3: Available Unlocks -->
        <div style="margin-bottom:14px">
          <div style="color:#8b4513;font-size:11px;letter-spacing:2px;margin-bottom:6px;border-bottom:1px solid #2a2a2a;padding-bottom:5px">
            AVAILABLE UNLOCKS
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${unlocksHtml}
          </div>
        </div>

        <!-- Section 4: Career Stats -->
        <div style="margin-bottom:8px">
          <div style="color:#8b4513;font-size:11px;letter-spacing:2px;margin-bottom:6px;border-bottom:1px solid #2a2a2a;padding-bottom:5px">
            CAREER STATS
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:11px">
            <div>
              <span style="color:#888">Games Played:</span>
              <span style="color:#c0c0d0">${careerGames}</span>
            </div>
            <div>
              <span style="color:#888">Wins:</span>
              <span style="color:#00e436">${careerWins}</span>
            </div>
            <div>
              <span style="color:#888">Win Rate:</span>
              <span style="color:#29adff">${careerGames > 0 ? Math.floor((careerWins / careerGames) * 100) : 0}%</span>
            </div>
            <div>
              <span style="color:#888">Best Grade:</span>
              <span style="color:#ffec27">${bestGrade}</span>
            </div>
            <div>
              <span style="color:#888">Highest Rep:</span>
              <span style="color:#ff77a8">${highestRep}%</span>
            </div>
            <div>
              <span style="color:#888">Seasons:</span>
              <span style="color:#c0c0d0">${seasonsCompleted}</span>
            </div>
            <div>
              <span style="color:#888">Total Earned:</span>
              <span style="color:#00e436">$${totalEarned.toLocaleString()}</span>
            </div>
            <div>
              <span style="color:#888">Perks Unlocked:</span>
              <span style="color:#ffec27">${activePerks.length}/${defs.length}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Wire up event handlers
    this._el.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-action="close"]');
      if (closeBtn) {
        this.eventBus.emit('ui:click');
        this.hide();
        return;
      }

      const unlockBtn = e.target.closest('[data-unlock-id]');
      if (unlockBtn && !unlockBtn.disabled) {
        this.eventBus.emit('ui:click');
        const perkId = unlockBtn.dataset.unlockId;
        const cost = parseInt(unlockBtn.dataset.cost, 10);
        const success = this.prestige.purchaseUnlock(perkId, cost);
        if (success) {
          this.eventBus.emit('prestige:unlock', { perkId });
          this.eventBus.emit('ui:message', {
            text: `Unlocked: ${perkId}!`,
            type: 'success',
          });
          this._render();
        }
      }
    });
  }
}
