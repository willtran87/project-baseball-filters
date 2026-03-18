/**
 * PanelManager — Manages UI panels (filter inspector, shop, menus).
 *
 * Handles opening/closing panels and routing user interactions
 * back to the game systems via the EventBus.
 */

import { FiltrationSystem } from '../systems/FiltrationSystem.js';

export class PanelManager {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this._panels = new Map();
    this._activePanel = null;
    this._activePanelName = null;
    this._closing = false;

    // Inject panel transition keyframes once
    if (!document.getElementById('panel-transition-styles')) {
      const style = document.createElement('style');
      style.id = 'panel-transition-styles';
      style.textContent = `
        @keyframes panelOpen {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes panelClose {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .panel-opening {
          animation: panelOpen 200ms ease-out forwards;
        }
        .panel-closing {
          animation: panelClose 150ms ease-in forwards;
        }
      `;
      document.head.appendChild(style);
    }

    // Register built-in panels
    this._registerBuiltinPanels();

    this.eventBus.on('ui:openPanel', ({ name, data }) => this.open(name, data));
    this.eventBus.on('ui:closePanel', () => this.close());
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._activePanelName) {
        this.close();
        if (result) result.closed = true;
      }
    });
  }

  /**
   * Register a panel by name with a render function.
   */
  register(name, renderFn) {
    this._panels.set(name, renderFn);
  }

  /**
   * Open a panel by name.
   */
  open(name, data) {
    this.eventBus.emit('ui:closeAllPanels');
    this._removePanel();
    const renderFn = this._panels.get(name);
    if (!renderFn) return;

    this._activePanel = document.createElement('div');
    this._activePanel.className = 'game-panel panel-opening';
    this._activePanel.style.cssText = `
      position: absolute; bottom: 22px; left: 0; right: 0;
      max-height: 45%; overflow-y: auto;
      background: rgba(10, 10, 30, 0.92);
      border-top: 2px solid #8b4513;
      padding: 8px 12px; font-family: monospace;
      color: #e0e0e0; font-size: 14px;
      z-index: 30;
    `;
    this._activePanelName = name;
    renderFn(this._activePanel, this.state, this.eventBus, data);
    this.container.appendChild(this._activePanel);

    // Remove opening class after animation completes
    this._activePanel.addEventListener('animationend', () => {
      if (this._activePanel) {
        this._activePanel.classList.remove('panel-opening');
      }
    }, { once: true });

    // Accessibility: make panel focusable for keyboard users
    if (!this._activePanel.hasAttribute('tabindex')) {
      this._activePanel.setAttribute('tabindex', '0');
    }
    this._activePanel.focus();
  }

  /**
   * Close the active panel with a fade-out animation.
   */
  close() {
    if (!this._activePanel || this._closing) return;
    this._closing = true;
    const panel = this._activePanel;
    this._activePanel = null;
    this._activePanelName = null;

    panel.classList.remove('panel-opening');
    panel.classList.add('panel-closing');
    panel.addEventListener('animationend', () => {
      panel.remove();
      this._closing = false;
    }, { once: true });

    // Safety fallback: remove after 200ms if animationend never fires
    setTimeout(() => {
      if (panel.parentNode) {
        panel.remove();
      }
      this._closing = false;
    }, 200);
  }

  /**
   * Immediately remove the active panel (no animation). Used internally
   * when opening a new panel to avoid overlapping animations.
   */
  _removePanel() {
    if (this._activePanel) {
      this._activePanel.remove();
      this._activePanel = null;
      this._activePanelName = null;
      this._closing = false;
    }
  }

  /**
   * Check if a panel is currently open.
   */
  isOpen(name) {
    return this._activePanelName === name;
  }

  update(dt) {
    // Panels are event-driven, no per-tick logic needed
  }

  /**
   * Register the built-in game panels.
   */
  _registerBuiltinPanels() {
    // Filter inspector panel
    this.register('filterInspector', (el, state, eventBus, data) => {
      const filterId = data?.filterId;
      const filter = filterId != null ? state.getFilter(filterId) : null;

      if (!filter) {
        el.innerHTML = '<div style="color:#888">No filter selected.</div>';
        return;
      }

      const systemDef = state.config.filtrationSystems?.[filter.domain];
      const compDef = systemDef?.components?.[filter.componentType];
      const tierDef = compDef?.tiers?.find(t => t.tier === filter.tier);
      const name = tierDef?.name ?? compDef?.name ?? filter.type ?? 'Filter';

      const status = FiltrationSystem.getFilterStatus(filter);
      const condPct = filter.maxCondition > 0
        ? Math.floor((filter.condition / filter.maxCondition) * 100) : 0;

      const statusColors = {
        healthy: '#00e436', degraded: '#ffa300', warning: '#ff8800',
        critical: '#ff004d', broken: '#ff004d',
      };
      const statusColor = statusColors[status] || '#888';

      const repairCost = tierDef ? Math.floor(tierDef.cost * 0.3) : 0;
      const emergencyMult = state.config.economy?.emergencyRepairMultiplier ?? 2.5;
      const actualRepairCost = filter.condition <= 0 ? Math.floor(repairCost * emergencyMult) : repairCost;

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>${name}</strong>
          ${systemDef ? `<span style="color:${systemDef.color ?? '#888'};font-size:11px;margin-left:8px">[${systemDef.name}]</span>` : ''}
          <span data-action="close" style="cursor:pointer;color:#888;font-size:14px">\u2715</span>
        </div>
        <div style="margin-bottom:6px">
          Status: <span style="color:${statusColor}">${status.toUpperCase()}</span>
        </div>
        <div style="margin-bottom:6px">
          Condition: ${condPct}% (${Math.floor(filter.condition)}/${filter.maxCondition})
        </div>
        <div style="background:#222;height:6px;margin-bottom:8px;border-radius:2px">
          <div style="background:${statusColor};height:100%;width:${condPct}%;border-radius:2px"></div>
        </div>
        <div style="margin-bottom:6px">
          Efficiency: ${Math.floor(filter.efficiency * 100)}%
        </div>
        <div style="margin-bottom:8px;color:#888;font-size:12px">
          ${compDef?.name ?? ''} ${tierDef ? `- Tier ${filter.tier}` : ''}
        </div>
        <div style="display:flex;gap:8px">
          <button data-action="repair" data-id="${filter.id}"
            style="background:#2a4a2a;color:#00e436;border:1px solid #4a6a4a;padding:5px 8px;font-family:monospace;cursor:pointer;font-size:12px">
            Repair ($${actualRepairCost})
          </button>
          <button data-action="remove" data-id="${filter.id}"
            style="background:#4a2a2a;color:#ff004d;border:1px solid #6a4a4a;padding:5px 8px;font-family:monospace;cursor:pointer;font-size:12px">
            Remove
          </button>
        </div>
      `;

      el.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        const id = parseInt(e.target.closest('[data-id]')?.dataset.id, 10);

        if (action === 'close') {
          eventBus.emit('ui:closePanel');
        } else if (action === 'repair' && id) {
          eventBus.emit('filter:repair', { id });
          // Re-render
          this.open('filterInspector', { filterId: id });
        } else if (action === 'remove' && id) {
          eventBus.emit('filter:remove', { id });
          eventBus.emit('ui:closePanel');
        }
      });
    });

    // Loans panel
    this.register('loans', (el, state, eventBus) => {
      const econ = state.config.economy ?? {};
      const maxLoans = econ.maxLoans ?? 3;
      const loanAmount = econ.loanAmount ?? 5000;
      const interestRates = econ.loanInterestRates ?? [0.05, 0.10, 0.18];
      const activeLoans = state.activeLoans ?? [];
      const availableCount = maxLoans - activeLoans.length;
      const nextRate = interestRates[activeLoans.length] ?? interestRates[interestRates.length - 1];
      const dailyRepayment = Math.floor(loanAmount * 0.20);

      let loansHtml = '';
      if (activeLoans.length === 0) {
        loansHtml = '<div style="color:#888;font-size:12px;margin:6px 0">No active loans.</div>';
      } else {
        for (let i = 0; i < activeLoans.length; i++) {
          const loan = activeLoans[i];
          const remaining = loan.totalOwed - loan.paidSoFar;
          const pct = Math.floor((loan.paidSoFar / loan.totalOwed) * 100);
          loansHtml += `
            <div style="margin:6px 0;padding:6px 8px;background:#1a1a3a;border:1px solid #333;font-size:12px">
              <div>Loan #${i + 1}: $${loan.amount.toLocaleString()} at ${Math.round(loan.interestRate * 100)}% interest</div>
              <div style="color:#aaa">Owed: $${remaining.toLocaleString()} / $${loan.totalOwed.toLocaleString()} (${pct}% paid)</div>
              <div style="background:#222;height:4px;margin-top:5px;border-radius:2px">
                <div style="background:#29adff;height:100%;width:${pct}%;border-radius:2px"></div>
              </div>
            </div>
          `;
        }
      }

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>Loans</strong>
          <span data-action="close" style="cursor:pointer;color:#888;font-size:14px">\u2715</span>
        </div>
        <div style="margin-bottom:8px;font-size:12px;color:#aaa">
          Available: ${availableCount} of ${maxLoans} loans remaining
          ${availableCount > 0 ? ` | Next rate: ${Math.round(nextRate * 100)}%` : ''}
          | Repayment: $${dailyRepayment.toLocaleString()}/day per loan
        </div>
        <div id="loans-list">${loansHtml}</div>
        <div style="margin-top:8px">
          ${availableCount > 0 ? `
            <button data-action="take-loan"
              style="background:#2a4a2a;color:#00e436;border:1px solid #4a6a4a;padding:6px 10px;font-family:monospace;cursor:pointer;font-size:12px">
              Take Loan ($${loanAmount.toLocaleString()} at ${Math.round(nextRate * 100)}% interest)
            </button>
          ` : '<div style="color:#ff004d;font-size:12px">Maximum loans reached.</div>'}
        </div>
      `;

      el.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'close') {
          eventBus.emit('ui:closePanel');
        } else if (action === 'take-loan') {
          eventBus.emit('economy:requestLoan');
          // Re-render to show updated state
          setTimeout(() => this.open('loans'), 50);
        }
      });
    });

    // Vent slot panel (for installing filters from domain/component/tier config)
    this.register('ventSlot', (el, state, eventBus, data) => {
      const { col, row, domain: slotDomain } = data ?? {};
      const systems = state.config.filtrationSystems ?? {};
      const repTiers = state.config.reputation?.tiers ?? [];
      const domainNames = { air: 'Air', water: 'Water', hvac: 'HVAC', drainage: 'Drainage', electrical: 'Electrical', pest: 'Pest Control' };
      const slotDomainName = slotDomain ? (domainNames[slotDomain] ?? slotDomain) : null;

      // Build list of installable tier-1 filters, filtered by slot domain
      const options = [];
      for (const [domainKey, domainDef] of Object.entries(systems)) {
        if (slotDomain && domainKey !== slotDomain) continue; // only show matching domain
        for (const [compKey, compDef] of Object.entries(domainDef.components ?? {})) {
          const tier1 = compDef.tiers?.find(t => t.tier === 1);
          if (!tier1) continue;
          const bonusVal = tier1.qualityBonus ?? tier1.comfortBonus ?? tier1.integrityBonus ?? 0;
          const bonusLabel = domainDef.metricName ?? 'Bonus';
          options.push({
            domain: domainKey,
            componentType: compKey,
            tier: 1,
            name: tier1.name,
            brand: tier1.brand ?? '',
            cost: tier1.cost,
            domainName: domainDef.name,
            domainColor: domainDef.color ?? '#888',
            lifespan: tier1.lifespanGames ?? 10,
            energy: tier1.energyPerDay ?? 0,
            bonusVal,
            bonusLabel,
            domainHealthBonus: tier1.domainHealthBonus ?? 0,
            passive: tier1.passive ?? null,
            description: tier1.description ?? '',
          });
        }
      }

      const headerLabel = slotDomainName
        ? `Install ${slotDomainName} Filter`
        : `Install Filter (Slot ${col},${row})`;

      // Emergency filter option
      const emergencyStock = state.emergencyFilters ?? 0;
      const emergencyHtml = emergencyStock > 0 ? `
        <button data-action="install-emergency"
          style="background:#3a1a1a;color:#ff004d;border:1px solid #6a3a3a;
            padding:6px 8px;font-family:monospace;cursor:pointer;
            font-size:12px;min-width:120px;text-align:left">
          <div><strong>Emergency Filter</strong></div>
          <div style="display:flex;justify-content:space-between">
            <span style="color:#ff004d;font-size:11px">Universal</span>
            <span style="color:#ffa300;font-size:10px">30% eff</span>
          </div>
          <div style="color:#aaa;font-size:11px">Stock: ${emergencyStock} | 1 day</div>
        </button>
      ` : '';

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>${headerLabel}</strong>
          <span data-action="close" style="cursor:pointer;color:#888;font-size:14px">\u2715</span>
        </div>
        <div style="margin-bottom:8px;color:#aaa;font-size:12px">
          ${slotDomainName ? `This slot accepts ${slotDomainName} equipment only.` : 'Choose a filter to install at this vent slot.'}
        </div>
        <div id="filter-options" style="display:flex;flex-wrap:wrap;gap:8px">
          ${emergencyHtml}
          ${options.map((opt, i) => {
            const canAfford = state.money >= opt.cost;
            const archetype = opt.passive ? 'SPECIALIST' : (opt.domainHealthBonus >= 5 ? 'BOOSTER' : 'WORKHORSE');
            const archetypeColors = { WORKHORSE: '#7ec850', BOOSTER: '#ff6c24', SPECIALIST: '#a78bfa' };
            return `
              <button data-action="install" data-idx="${i}" data-hover-idx="${i}"
                style="background:${canAfford ? '#1a2a4a' : '#2a2a2a'};
                  color:${canAfford ? '#29adff' : '#555'};
                  border:1px solid ${canAfford ? '#3a5a8a' : '#333'};
                  padding:6px 8px;font-family:monospace;cursor:${canAfford ? 'pointer' : 'not-allowed'};
                  font-size:12px;min-width:120px;text-align:left">
                <div><strong>${opt.name}</strong></div>
                <div style="display:flex;justify-content:space-between">
                  <span style="color:${opt.domainColor};font-size:11px">${opt.domainName}</span>
                  <span style="color:${archetypeColors[archetype]};font-size:10px">${archetype}</span>
                </div>
                <div style="color:${canAfford ? '#aaa' : '#444'};font-size:11px">$${opt.cost}</div>
              </button>
            `;
          }).join('')}
        </div>
        <div id="filter-hover-details" style="height:60px;margin-top:8px;padding:6px 8px;font-size:11px;color:#555;border-top:1px solid #222;overflow:hidden">
          <span style="font-style:italic">Hover a filter to see stats</span>
        </div>
      `;

      el.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'close') {
          eventBus.emit('ui:closePanel');
        } else if (action === 'install-emergency') {
          const px = col * 16;
          const py = row * 16;
          eventBus.emit('filter:installEmergency', {
            domain: slotDomain ?? 'air',
            x: px,
            y: py,
          });
          eventBus.emit('ui:closePanel');
        } else if (action === 'install') {
          const idx = parseInt(e.target.closest('[data-idx]')?.dataset.idx, 10);
          const opt = options[idx];
          if (opt) {
            const px = col * 16;
            const py = row * 16;
            eventBus.emit('filter:install', {
              domain: opt.domain,
              componentType: opt.componentType,
              tier: opt.tier,
              x: px,
              y: py,
            });
            eventBus.emit('ui:closePanel');
          }
        }
      });

      // Hover details for filter stats
      const detailsEl = el.querySelector('#filter-hover-details');
      const passiveDescs = {
        weatherShield: 'Weather Shield — 20% less weather degradation',
        crossDomain: 'Cross Domain — boosts HVAC domain health',
        maintenanceSaver: 'Maint. Saver — 25% reduced maintenance',
        crisisArmor: 'Crisis Armor — 50% less crisis rep penalty',
      };
      const archetypeColors = { WORKHORSE: '#7ec850', BOOSTER: '#ff6c24', SPECIALIST: '#a78bfa' };

      el.querySelectorAll('[data-hover-idx]').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          const idx = parseInt(btn.dataset.hoverIdx, 10);
          const opt = options[idx];
          if (!opt || !detailsEl) return;
          const archetype = opt.passive ? 'SPECIALIST' : (opt.domainHealthBonus >= 5 ? 'BOOSTER' : 'WORKHORSE');
          detailsEl.innerHTML = `
            <span style="color:#ffec27"><strong>${opt.brand ? `${opt.brand} ` : ''}${opt.name}</strong></span>
            <span style="color:${archetypeColors[archetype]};font-size:10px;letter-spacing:1px;margin-left:8px">${archetype}</span>
            &nbsp;\u2014&nbsp;
            <span style="color:#aaa">${opt.lifespan}d life</span> &middot;
            <span style="color:#ffa300">\u26a1$${opt.energy}/day</span> &middot;
            <span style="color:#29adff">+${opt.bonusVal} ${opt.bonusLabel}</span>
            ${opt.domainHealthBonus > 0 ? `&middot; <span style="color:#4fc">+${opt.domainHealthBonus} Health</span>` : ''}
            ${opt.passive ? `&middot; <span style="color:#a78bfa">\u2728 ${passiveDescs[opt.passive] ?? opt.passive}</span>` : ''}
            ${opt.description ? `<div style="color:#666;font-style:italic;margin-top:2px;line-height:1.2">${opt.description}</div>` : ''}
          `;
        });
        btn.addEventListener('mouseleave', () => {
          if (detailsEl) {
            detailsEl.innerHTML = '<span style="font-style:italic">Hover a filter to see stats</span>';
          }
        });
      });
    });
  }
}
