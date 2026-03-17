/**
 * ExpansionPanel — Stadium expansion purchase UI.
 *
 * Shows all expansions from gameConfig with status (LOCKED / AVAILABLE / PURCHASED).
 * Player can purchase available expansions to increase capacity and revenue.
 * Toggle via `ui:toggleExpansions` event or 'x' keyboard shortcut.
 */

export class ExpansionPanel {
  constructor(panelManager, state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;
    this.panelManager = panelManager;

    panelManager.register('expansions', (el, state, eventBus) => {
      this._render(el);
    });

    this.eventBus.on('ui:toggleExpansions', () => {
      if (panelManager.isOpen('expansions')) {
        this.eventBus.emit('ui:closePanel');
      } else {
        this.eventBus.emit('ui:openPanel', { name: 'expansions' });
      }
    });
  }

  _render(el) {
    const expansions = this.state.config.expansions ?? [];
    const purchased = this.state.purchasedExpansions ?? [];
    const unlocked = this.state.unlockedExpansions ?? [];
    const baseCapacity = this.state.config.stadium?.baseCapacity ?? 5000;
    const expansionCapMap = this.state.config.stadium?.expansionCapacity ?? {};

    // Calculate current expansion capacity bonus
    let expansionCapBonus = 0;
    for (const pe of purchased) {
      expansionCapBonus += expansionCapMap[pe.key] ?? 0;
    }
    const totalCapacity = baseCapacity + expansionCapBonus;

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

    let html = '';

    // Header
    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:2px solid #8b4513;background:linear-gradient(180deg,rgba(139,69,19,0.15),rgba(0,0,0,0.3));">
        <strong style="color:#ffec27;letter-spacing:1px">STADIUM EXPANSIONS</strong>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="color:#aaa;font-size:9px">
            Stadium Capacity:
            <span style="color:#fff">${baseCapacity.toLocaleString()}</span>
            ${expansionCapBonus > 0 ? `<span style="color:#00e436"> + ${expansionCapBonus.toLocaleString()}</span>` : ''}
            <span style="color:#ffec27"> = ${totalCapacity.toLocaleString()}</span>
          </span>
          <span data-action="close-expansions" style="cursor:pointer;color:#888;font-size:12px">\u2715</span>
        </div>
      </div>
    `;

    // Budget display
    html += `
      <div style="padding:4px 12px;border-bottom:1px solid #222;background:rgba(0,0,0,0.15);display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#888;font-size:9px">Current Budget: <span style="color:#00e436;font-weight:bold">$${this.state.money.toLocaleString()}</span></span>
        <span style="color:#888;font-size:9px">Reputation: <span style="color:#ffec27">${Math.floor(this.state.reputation)}%</span></span>
      </div>
    `;

    // Expansion list
    html += `<div style="flex:1;overflow-y:auto;padding:8px 12px;">`;

    for (const exp of expansions) {
      const id = exp.id ?? exp.name;
      const isPurchased = purchased.some(p => p.key === id);
      const isUnlocked = unlocked.includes(id) || this.state.reputation >= (exp.reputationRequired ?? 100);
      const canAfford = this.state.money >= exp.cost;
      const capIncrease = expansionCapMap[id] ?? 0;

      let status, statusColor, borderColor, bgColor;
      if (isPurchased) {
        status = 'PURCHASED';
        statusColor = '#00e436';
        borderColor = '#00e43644';
        bgColor = 'rgba(0,228,54,0.05)';
      } else if (isUnlocked) {
        status = canAfford ? 'AVAILABLE' : 'NEED FUNDS';
        statusColor = canAfford ? '#ffec27' : '#ffa300';
        borderColor = canAfford ? '#ffec2744' : '#ffa30044';
        bgColor = canAfford ? 'rgba(255,236,39,0.05)' : 'rgba(255,163,0,0.03)';
      } else {
        status = 'LOCKED';
        statusColor = '#555';
        borderColor = '#33333344';
        bgColor = 'rgba(0,0,0,0.2)';
      }

      // Revenue/cost summary
      let bonusText = '';
      if (exp.revenueBoost) {
        bonusText += `<span style="color:#00e436">+${Math.round(exp.revenueBoost * 100)}% revenue</span>`;
      }
      if (exp.operatingCostReduction) {
        if (bonusText) bonusText += ' &middot; ';
        bonusText += `<span style="color:#29adff">-${Math.round(exp.operatingCostReduction * 100)}% operating costs</span>`;
      }
      if (capIncrease > 0) {
        if (bonusText) bonusText += ' &middot; ';
        bonusText += `<span style="color:#ffa300">+${capIncrease.toLocaleString()} seats</span>`;
      }
      if (exp.mediaReputationBoost) {
        if (bonusText) bonusText += ' &middot; ';
        bonusText += `<span style="color:#a78bfa">Media rep boost</span>`;
      }

      // Systems required
      const sysRequired = (exp.newSystemsRequired ?? []).map(s => {
        const colors = { air: '#cccccc', water: '#4488ff', hvac: '#ff8844', drainage: '#44bb44' };
        return `<span style="color:${colors[s] ?? '#888'}">${s.toUpperCase()}</span>`;
      }).join(', ');

      html += `
        <div style="
          border: 1px solid ${borderColor};
          border-radius: 3px;
          padding: 8px 12px;
          margin-bottom: 6px;
          background: ${bgColor};
          ${isPurchased ? 'opacity: 0.7;' : ''}
        ">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-weight:bold;font-size:11px;color:${isPurchased ? '#00e436' : isUnlocked ? '#fff' : '#666'}">
              ${isPurchased ? '\u2713 ' : ''}${exp.name}
            </span>
            <span style="
              color:${statusColor};font-size:8px;
              border:1px solid ${statusColor};
              padding:1px 6px;border-radius:2px;
              letter-spacing:1px;
            ">${status}</span>
          </div>
          <div style="color:${isPurchased || isUnlocked ? '#aaa' : '#555'};font-size:9px;margin-bottom:4px;">
            ${exp.description ?? ''}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <div style="font-size:9px;">${bonusText}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:8px;color:#888;">
              Cost: <span style="color:${isPurchased ? '#555' : canAfford && isUnlocked ? '#00e436' : '#ff004d'}">$${exp.cost.toLocaleString()}</span>
              &middot; Rep required: <span style="color:${this.state.reputation >= exp.reputationRequired ? '#00e436' : '#ff004d'}">${exp.reputationRequired}%</span>
              ${sysRequired ? ` &middot; Systems: ${sysRequired}` : ''}
            </div>
            ${!isPurchased && isUnlocked ? `
              <button data-action="purchase" data-id="${id}"
                style="
                  background:${canAfford ? '#2a4a2a' : '#2a2a2a'};
                  color:${canAfford ? '#00e436' : '#555'};
                  border:1px solid ${canAfford ? '#4a6a4a' : '#333'};
                  padding:3px 10px;font-family:monospace;
                  cursor:${canAfford ? 'pointer' : 'not-allowed'};
                  font-size:10px;font-weight:bold;
                ">${canAfford ? 'PURCHASE' : 'INSUFFICIENT FUNDS'}</button>
            ` : ''}
          </div>
        </div>
      `;
    }

    html += `</div>`;

    el.innerHTML = html;

    // Click handlers
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close-expansions"]')) {
        this.eventBus.emit('ui:closePanel');
        return;
      }

      const purchaseBtn = e.target.closest('[data-action="purchase"]');
      if (purchaseBtn) {
        const id = purchaseBtn.dataset.id;
        this._purchase(id, el);
      }
    });
  }

  _purchase(expansionId, el) {
    const expansions = this.state.config.expansions ?? [];
    const def = expansions.find(e => e.id === expansionId);
    if (!def) return;

    const purchased = this.state.purchasedExpansions ?? [];
    if (purchased.some(p => p.key === expansionId)) return;

    if (this.state.money < def.cost) {
      this.eventBus.emit('ui:message', {
        text: `Not enough money for ${def.name}. Need $${def.cost.toLocaleString()}.`,
        type: 'warning',
      });
      return;
    }

    const unlocked = this.state.unlockedExpansions ?? [];
    if (!unlocked.includes(expansionId) && this.state.reputation < (def.reputationRequired ?? 100)) {
      this.eventBus.emit('ui:message', {
        text: `${def.name} requires ${def.reputationRequired}% reputation.`,
        type: 'warning',
      });
      return;
    }

    // Deduct money
    this.state.set('money', this.state.money - def.cost);

    // Add to purchased expansions
    this.state.purchasedExpansions.push({
      key: expansionId,
      purchasedDay: this.state.gameDay,
    });

    // Emit purchase event (audio + notification handled by audioManager)
    this.eventBus.emit('expansion:purchased', { id: expansionId, expansion: def });

    // Re-render panel
    el.innerHTML = '';
    this._render(el);
  }
}
