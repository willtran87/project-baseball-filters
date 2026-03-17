/**
 * MarketSystem — Dynamic market with price fluctuations and supply events.
 *
 * Each game day, domain price multipliers drift up or down following a trend.
 * Random market events (supply surplus, factory delay, bulk deals, shortages)
 * temporarily modify prices, adding strategic depth to purchase timing.
 *
 * Market pauses during off-season and resets at season start.
 */

const DOMAINS = ['air', 'water', 'hvac', 'drainage'];

const MARKET_EVENTS = [
  {
    id: 'supplySurplus',
    name: 'Supply Surplus',
    description: 'Overstock flooding the market — one domain is cheap!',
    pickDomain: true,
    multiplier: 0.80,
    daysLeft: 3,
    tierFilter: null,
  },
  {
    id: 'factoryDelay',
    name: 'Factory Delay',
    description: 'Production delays are driving up prices in one domain.',
    pickDomain: true,
    multiplier: 1.25,
    daysLeft: 5,
    tierFilter: null,
  },
  {
    id: 'bulkDeal',
    name: 'Bulk Deal',
    description: 'Distributor clearance — T1-T2 filters discounted across the board!',
    pickDomain: false,
    multiplier: 0.85,
    daysLeft: 2,
    tierFilter: { minTier: 1, maxTier: 2 },
  },
  {
    id: 'premiumShortage',
    name: 'Premium Shortage',
    description: 'High-end components are scarce — T3-T4 filters cost more.',
    pickDomain: false,
    multiplier: 1.30,
    daysLeft: 3,
    tierFilter: { minTier: 3, maxTier: 4 },
  },
];

export class MarketSystem {
  constructor(state, eventBus) {
    this.state = state;
    this._eventBus = eventBus;

    this._eventBus.on('game:newDay', () => this._onNewDay());
    this._eventBus.on('season:started', () => this._onSeasonStart());
  }

  /** No per-tick work needed; market updates daily. */
  update(_dt) {}

  _onNewDay() {
    // Market pauses during off-season
    if (this.state.offSeason) return;

    this._updateMarket();
  }

  _updateMarket() {
    const m = this.state.market;

    // --- Price drift ---
    for (const domain of DOMAINS) {
      // Continue trend with 60% probability, reverse 40%
      if (Math.random() < 0.4) m.trend[domain] *= -1;
      if (m.trend[domain] === 0) m.trend[domain] = Math.random() < 0.5 ? 1 : -1;

      // Apply drift: +/- 1-3%
      const drift = (0.01 + Math.random() * 0.02) * m.trend[domain];
      m.domainMultipliers[domain] = Math.max(0.75, Math.min(1.35, m.domainMultipliers[domain] + drift));
    }

    // --- Tick active event ---
    if (m.activeEvent) {
      m.activeEvent.daysLeft--;
      if (m.activeEvent.daysLeft <= 0) {
        m.activeEvent = null;
        this._eventBus.emit('ui:message', { text: 'Market conditions normalized.', type: 'info' });
      }
    }

    // --- 10% chance of new market event (if none active) ---
    if (!m.activeEvent && Math.random() < 0.10) {
      this._triggerMarketEvent();
    }
  }

  _triggerMarketEvent() {
    const template = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    const evt = {
      id: template.id,
      name: template.name,
      description: template.description,
      multiplier: template.multiplier,
      daysLeft: template.daysLeft,
      tierFilter: template.tierFilter ? { ...template.tierFilter } : null,
      domain: template.pickDomain ? DOMAINS[Math.floor(Math.random() * DOMAINS.length)] : null,
    };

    this.state.market.activeEvent = evt;

    this._eventBus.emit('ui:message', {
      text: `Market: ${evt.name} — ${evt.description}`,
      type: evt.multiplier < 1 ? 'success' : 'warning',
    });
    this._eventBus.emit('market:event', evt);
  }

  _onSeasonStart() {
    const m = this.state.market;
    // Reset all multipliers and trends for a fresh market each season
    for (const domain of DOMAINS) {
      m.domainMultipliers[domain] = 1.0;
      m.trend[domain] = 0;
    }
    m.activeEvent = null;
  }

  /**
   * Calculate the effective market price multiplier for a filter purchase.
   * Used by Shop and FiltrationSystem to apply dynamic pricing.
   *
   * @param {string} domain - Filter domain (air, water, hvac, drainage)
   * @param {number} tier - Filter tier (1-4)
   * @returns {number} Multiplier to apply to base cost
   */
  static getMarketMultiplier(market, domain, tier) {
    if (!market) return 1.0;
    let mult = market.domainMultipliers?.[domain] ?? 1.0;

    const evt = market.activeEvent;
    if (evt) {
      const domainMatch = !evt.domain || evt.domain === domain;
      const tierMatch = !evt.tierFilter || (tier >= evt.tierFilter.minTier && tier <= evt.tierFilter.maxTier);
      if (domainMatch && tierMatch) {
        mult *= evt.multiplier;
      }
    }

    return mult;
  }
}
