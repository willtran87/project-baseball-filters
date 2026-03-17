/**
 * Shop — Upgrade shop UI for purchasing and upgrading filters.
 *
 * Displays available filter types organized by filtration domain,
 * shows costs, descriptions, unlock requirements, and handles purchases.
 */

import { MarketSystem } from '../systems/MarketSystem.js';

export class Shop {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this._el = null;
    this._visible = false;
    this._activeTab = 'air';

    this.eventBus.on('ui:toggleShop', () => this.toggle());
    this.eventBus.on('ui:closeShop', () => this.hide());
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._visible) {
        this.hide();
        if (result) result.closed = true;
      }
    });
  }

  toggle() {
    if (this._visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.eventBus.emit('ui:closeAllPanels');
    this.hide();
    this._visible = true;

    this._el = document.createElement('div');
    this._el.id = 'shop-panel';
    this._el.style.cssText = `
      position: absolute; top: 24px; left: 8%; right: 8%; bottom: 24px;
      background: linear-gradient(180deg, rgba(15,10,5,0.97), rgba(8,8,24,0.97));
      border: 2px solid #8b4513;
      border-radius: 4px;
      font-family: monospace; color: #e0e0e0;
      font-size: 11px; z-index: 30;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(139,69,19,0.3);
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

  get visible() {
    return this._visible;
  }

  _render() {
    if (!this._el) return;

    const systems = this.state.config.filtrationSystems ?? {};
    const tabs = [...Object.keys(systems), 'upgrades'];

    // Header — baseball dugout theme
    const header = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:2px solid #8b4513;background:linear-gradient(180deg,rgba(139,69,19,0.15),rgba(0,0,0,0.3))">
        <strong style="color:#ffec27;letter-spacing:1px">\u{1f6d2} DUGOUT SUPPLY SHOP</strong>
        <span style="color:#888;font-size:10px">Budget: <span style="color:#00e436;font-weight:bold">$${this.state.money.toLocaleString()}</span></span>
        <span data-action="close-shop" style="cursor:pointer;color:#888;font-size:12px">\u2715</span>
      </div>
    `;

    // Determine lowest-health domain for recommendations
    const health = this.state.domainHealth ?? {};
    const domainTabs = Object.keys(systems);
    let lowestDomain = null;
    let lowestHealth = Infinity;
    for (const key of domainTabs) {
      const h = health[key] ?? 100;
      if (h < lowestHealth) { lowestHealth = h; lowestDomain = key; }
    }

    // Tabs — show warning badge when domain health < 50%
    const tabsHtml = `
      <div style="display:flex;gap:0;border-bottom:1px solid #3a3a5a;background:rgba(0,0,0,0.2)">
        ${tabs.map(key => {
          if (key === 'upgrades') {
            const active = key === this._activeTab;
            const upgradeCount = this._getUpgradeableFilters().length;
            const badge = upgradeCount > 0 ? ` <span style="color:#ffec27;font-size:10px">${upgradeCount}</span>` : '';
            return `<span data-tab="upgrades" style="
              padding:6px 12px;cursor:pointer;
              color:${active ? '#ffec27' : '#888'};
              border-bottom:${active ? '2px solid #ffec27' : '2px solid transparent'};
              background:${active ? 'rgba(255,255,255,0.05)' : 'transparent'};
            ">UPGRADES${badge}</span>`;
          }
          const sys = systems[key];
          const active = key === this._activeTab;
          const domainH = health[key] ?? 100;
          const warn = domainH < 50;
          const badge = warn ? ` <span style="color:#ff6b35;font-size:10px" title="${sys.name} health: ${Math.round(domainH)}%">\u26a0</span>` : '';
          return `<span data-tab="${key}" style="
            padding:6px 12px;cursor:pointer;
            color:${active ? sys.color ?? '#fff' : '#888'};
            border-bottom:${active ? `2px solid ${sys.color ?? '#fff'}` : '2px solid transparent'};
            background:${active ? 'rgba(255,255,255,0.05)' : 'transparent'};
          ">${sys.name}${badge}</span>`;
        }).join('')}
      </div>
    `;

    // Market banner (shows price trends and active event)
    const marketBannerHtml = this._renderMarketBanner();

    // Content for active tab
    const activeSys = systems[this._activeTab];
    let contentHtml = '';

    if (this._activeTab === 'upgrades') {
      contentHtml = this._renderUpgradesTab();
    } else if (activeSys) {
      // Show which zones accept this domain
      const zoneSlotInfo = this._getZoneSlotsForDomain(this._activeTab);
      if (zoneSlotInfo) {
        contentHtml += `<div style="color:#888;font-size:9px;margin-bottom:8px;padding:4px 6px;background:rgba(255,255,255,0.03);border-left:2px solid ${activeSys.color ?? '#555'}">
          Install in: ${zoneSlotInfo}
        </div>`;
      }

      const components = activeSys.components ?? {};
      for (const [compKey, comp] of Object.entries(components)) {
        contentHtml += `
          <div style="margin-bottom:12px">
            <div style="color:${activeSys.color ?? '#aaa'};margin-bottom:4px;font-size:12px">
              <strong>${comp.name}</strong>
            </div>
        `;

        const isRecommendedDomain = lowestHealth < 50 && this._activeTab === lowestDomain;
        const tiers = comp.tiers ?? [];

        // Determine archetype for this component
        const sampleTier = tiers[0] ?? {};
        const archetype = sampleTier.passive ? 'SPECIALIST' : (sampleTier.domainHealthBonus >= 5 ? 'BOOSTER' : 'WORKHORSE');
        const archetypeColors = { WORKHORSE: '#7ec850', BOOSTER: '#ff6c24', SPECIALIST: '#a78bfa' };
        const archetypeColor = archetypeColors[archetype] ?? '#888';

        contentHtml += `<div style="color:${archetypeColor};font-size:8px;margin-bottom:3px;letter-spacing:1px">${archetype}</div>`;

        for (const tier of tiers) {
          const repTier = this._getReputationTier(tier.tier);
          const isUnlocked = this.state.reputation >= (repTier?.min ?? 0);
          // Apply Hank's plumbing discount for water/drainage
          const plumbingDiscount = this.state.storyFlags?.discount_plumbing;
          const isPlumbing = this._activeTab === 'water' || this._activeTab === 'drainage';
          // Apply off-season equipment clearance discount for T2-T3 filters
          const equipDiscount = (tier.tier >= 2 && tier.tier <= 3 && this.state.storyFlags?.offSeasonEquipmentDiscount > 0)
            ? this.state.storyFlags.offSeasonEquipmentDiscount : 0;
          let displayCost = (plumbingDiscount && isPlumbing) ? Math.floor(tier.cost * (1 - plumbingDiscount / 100)) : tier.cost;
          if (equipDiscount > 0) {
            displayCost = Math.floor(displayCost * (1 - equipDiscount / 100));
          }
          // Apply rival supply disruption cost multiplier
          const supplyCostMult = this.state._supplyCostMultiplier ?? 1.0;
          if (supplyCostMult > 1.0) displayCost = Math.ceil(displayCost * supplyCostMult);
          // Apply dynamic market multiplier
          const marketMult = MarketSystem.getMarketMultiplier(this.state.market, this._activeTab, tier.tier);
          displayCost = Math.round(displayCost * marketMult);
          const canAfford = this.state.money >= displayCost;

          // Market badge: SALE or SHORTAGE when event is active for this filter
          const mktEvt = this.state.market?.activeEvent;
          let marketBadge = '';
          if (mktEvt && isUnlocked) {
            const domMatch = !mktEvt.domain || mktEvt.domain === this._activeTab;
            const tierMatch = !mktEvt.tierFilter || (tier.tier >= mktEvt.tierFilter.minTier && tier.tier <= mktEvt.tierFilter.maxTier);
            if (domMatch && tierMatch) {
              if (mktEvt.multiplier < 1) {
                marketBadge = `<span style="color:#00e436;font-size:8px;background:rgba(0,228,54,0.15);padding:0 3px;border-radius:2px;margin-left:4px">SALE</span>`;
              } else {
                marketBadge = `<span style="color:#ff004d;font-size:8px;background:rgba(255,0,77,0.15);padding:0 3px;border-radius:2px;margin-left:4px">SHORTAGE</span>`;
              }
            }
          }

          // Price display: show original with arrow if market changed price
          const priceChanged = displayCost !== tier.cost;
          const priceColor = isUnlocked && canAfford ? '#00e436' : '#555';
          let priceHtml;
          if (priceChanged && isUnlocked) {
            const arrow = displayCost < tier.cost
              ? `<span style="color:#00e436">\u2193</span>`
              : `<span style="color:#ff004d">\u2191</span>`;
            priceHtml = `<span style="color:${priceColor};width:80px;text-align:right"><s style="color:#555;font-size:8px">$${tier.cost.toLocaleString()}</s> ${arrow}$${displayCost.toLocaleString()}</span>`;
          } else {
            priceHtml = `<span style="color:${priceColor};width:80px;text-align:right">$${displayCost.toLocaleString()}</span>`;
          }

          const zoneInfo = this._getZoneSlotsForDomain(this._activeTab) ?? 'Any zone';
          const tierTitle = `Lasts ~${tier.lifespanGames ?? 10} days | $${tier.energyPerDay}/day energy | Install in: ${zoneInfo}`;
          const recLabel = isRecommendedDomain && isUnlocked
            ? `<span style="color:#ffec27;font-size:9px;margin-left:4px">\u2605 RECOMMENDED</span>`
            : '';
          const bonusVal = tier.qualityBonus ?? tier.comfortBonus ?? tier.integrityBonus ?? 0;
          const bonusLabel = activeSys.metricName ?? 'Bonus';
          const dhbVal = tier.domainHealthBonus ?? 0;
          const dhbHtml = dhbVal > 0 ? `<span style="color:${isUnlocked ? '#4fc' : '#555'};width:55px;text-align:right;font-size:9px">+${dhbVal} Health</span>` : `<span style="width:55px"></span>`;

          // Passive description for Specialists
          const passiveDescs = {
            weatherShield: '20% less weather degradation',
            crossDomain: 'Boosts HVAC domain health',
            maintenanceSaver: '25% reduced maintenance',
            crisisArmor: '50% less crisis rep penalty',
          };

          contentHtml += `
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;margin-bottom:2px;
              background:${isUnlocked ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)'};
              border-left:3px solid ${isUnlocked ? (activeSys.color ?? '#4a4a6a') : '#333'}" title="${tierTitle}">
              <span style="color:${isUnlocked ? '#ffec27' : '#555'};width:24px">[T${tier.tier}]</span>
              <span style="flex:1;color:${isUnlocked ? '#e0e0e0' : '#555'}">${tier.brand ? `<span style="color:${isUnlocked ? '#ffec27' : '#555'};font-size:9px">${tier.brand}</span> ` : ''}${tier.name}${recLabel}${marketBadge}</span>
              <span style="color:${isUnlocked ? '#29adff' : '#555'};width:60px;text-align:right;font-size:9px">+${bonusVal} ${bonusLabel}</span>
              ${dhbHtml}
              <span style="color:${isUnlocked ? '#ab5236' : '#555'};width:55px;text-align:right;font-size:9px">${tier.lifespanGames ?? '?'}d life</span>
              ${priceHtml}
              <span style="color:#ffa300;width:70px;text-align:right;font-size:9px">\u26a1$${tier.energyPerDay}/day</span>
              ${isUnlocked
                ? `<button data-action="buy-tier" data-domain="${this._activeTab}" data-component="${compKey}" data-tier="${tier.tier}"
                    style="background:${canAfford ? '#1a3a2a' : '#2a2a2a'};color:${canAfford ? '#00e436' : '#555'};
                    border:1px solid ${canAfford ? '#3a6a4a' : '#333'};padding:2px 8px;font-family:monospace;
                    cursor:${canAfford ? 'pointer' : 'not-allowed'};font-size:9px;width:50px">
                    BUY
                  </button>`
                : `<span style="color:#555;font-size:9px;width:50px;text-align:center">LOCKED</span>`
              }
            </div>
            ${tier.description && isUnlocked ? `<div style="padding:1px 8px 3px 35px;color:#888;font-size:9px;font-style:italic;line-height:1.3">${tier.description}</div>` : ''}
            ${tier.passive && isUnlocked ? `<div style="padding:0 8px 4px 35px;color:${archetypeColor};font-size:8px">\u2728 ${passiveDescs[tier.passive] ?? tier.passive}</div>` : ''}
          `;
        }

        contentHtml += '</div>';
      }
    }

    this._el.innerHTML = `
      ${header}
      ${tabsHtml}
      ${marketBannerHtml}
      <div style="flex:1;overflow-y:auto;padding:8px 12px">
        ${contentHtml}
      </div>
    `;

    // Event handlers
    this._el.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-action="close-shop"]');
      if (closeBtn) {
        this.eventBus.emit('ui:click');
        this.hide();
        return;
      }

      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) {
        this.eventBus.emit('ui:click');
        this._activeTab = tabBtn.dataset.tab;
        this._render();
        return;
      }

      const buyBtn = e.target.closest('[data-action="buy-tier"]');
      if (buyBtn) {
        this.eventBus.emit('ui:click');
        const domain = buyBtn.dataset.domain;
        const component = buyBtn.dataset.component;
        const tier = parseInt(buyBtn.dataset.tier, 10);
        this._handleBuy(domain, component, tier);
        return;
      }

      const upgradeBtn = e.target.closest('[data-action="upgrade-filter"]');
      if (upgradeBtn) {
        this.eventBus.emit('ui:click');
        const filterId = parseInt(upgradeBtn.dataset.filterId, 10);
        const nextTier = parseInt(upgradeBtn.dataset.nextTier, 10);
        this.eventBus.emit('filter:upgrade', { id: filterId, newTier: nextTier });
        this._render();
      }
    });
  }

  _handleBuy(domain, componentKey, tierNum) {
    const systems = this.state.config.filtrationSystems ?? {};
    const sys = systems[domain];
    const comp = sys?.components?.[componentKey];
    const tier = comp?.tiers?.find(t => t.tier === tierNum);
    if (!tier) return;

    // Compute the effective cost matching FiltrationSystem.installFilter's logic
    let effectiveCost = tier.cost;
    // Hank's plumbing discount for water/drainage
    const plumbingDiscount = this.state.storyFlags?.discount_plumbing;
    if (plumbingDiscount && (domain === 'water' || domain === 'drainage')) {
      effectiveCost = Math.floor(effectiveCost * (1 - plumbingDiscount / 100));
    }
    // Off-season equipment clearance discount for T2-T3
    const equipDiscount = (tierNum >= 2 && tierNum <= 3 && this.state.storyFlags?.offSeasonEquipmentDiscount > 0)
      ? this.state.storyFlags.offSeasonEquipmentDiscount : 0;
    if (equipDiscount > 0) {
      effectiveCost = Math.floor(effectiveCost * (1 - equipDiscount / 100));
    }
    // Rival supply disruption cost multiplier
    const supplyCostMult = this.state._supplyCostMultiplier ?? 1.0;
    if (supplyCostMult > 1.0) effectiveCost = Math.ceil(effectiveCost * supplyCostMult);
    // Dynamic market multiplier
    const marketMult = MarketSystem.getMarketMultiplier(this.state.market, domain, tierNum);
    effectiveCost = Math.round(effectiveCost * marketMult);
    if (this.state.money < effectiveCost) {
      this.eventBus.emit('ui:message', { text: 'Not enough money!', type: 'warning' });
      return;
    }

    // Enter placement mode — cost is deducted when the filter is actually placed
    // by FiltrationSystem.installFilter via the filter:install event.
    this.hide();
    this.eventBus.emit('ui:startPlacement', {
      filterType: `${domain}:${componentKey}:${tierNum}`,
      domain,
      componentType: componentKey,
      tier: tierNum,
    });

    // Zone navigation hint: tell the player where matching empty slots are
    this._emitZoneNavigationHint(domain);
  }

  /**
   * Render the market status banner at the top of the shop.
   * Shows per-domain trend arrows and active market event info.
   */
  _renderMarketBanner() {
    const market = this.state.market;
    if (!market) return '';

    const domainNames = { air: 'Air', water: 'Water', hvac: 'HVAC', drainage: 'Drain' };
    const domainColors = { air: '#ccc', water: '#4488ff', hvac: '#ff8844', drainage: '#44bb44' };

    let trendHtml = '';
    for (const domain of ['air', 'water', 'hvac', 'drainage']) {
      const mult = market.domainMultipliers?.[domain] ?? 1.0;
      const trend = market.trend?.[domain] ?? 0;
      let arrow, arrowColor;
      if (trend > 0) { arrow = '\u2191'; arrowColor = '#ff004d'; }
      else if (trend < 0) { arrow = '\u2193'; arrowColor = '#00e436'; }
      else { arrow = '\u2014'; arrowColor = '#888'; }
      const pctOff = Math.round((mult - 1) * 100);
      const pctLabel = pctOff === 0 ? '' : (pctOff > 0 ? `+${pctOff}%` : `${pctOff}%`);
      const pctColor = pctOff > 0 ? '#ff004d' : (pctOff < 0 ? '#00e436' : '#888');
      trendHtml += `<span style="color:${domainColors[domain]};font-size:9px">${domainNames[domain]}</span>`;
      trendHtml += `<span style="color:${arrowColor};font-size:10px;margin:0 1px">${arrow}</span>`;
      trendHtml += `<span style="color:${pctColor};font-size:8px;margin-right:8px">${pctLabel}</span>`;
    }

    let eventHtml = '';
    const evt = market.activeEvent;
    if (evt) {
      const evtColor = evt.multiplier < 1 ? '#00e436' : '#ff004d';
      const evtBg = evt.multiplier < 1 ? 'rgba(0,228,54,0.1)' : 'rgba(255,0,77,0.1)';
      eventHtml = `<span style="color:${evtColor};background:${evtBg};padding:1px 6px;border-radius:2px;font-size:9px;margin-left:4px">
        ${evt.name} (${evt.daysLeft}d left)
      </span>`;
    }

    return `<div style="display:flex;align-items:center;padding:3px 12px;background:rgba(0,0,0,0.3);border-bottom:1px solid #2a2a3a;gap:2px">
      <span style="color:#888;font-size:8px;margin-right:6px;letter-spacing:1px">MARKET:</span>
      ${trendHtml}${eventHtml}
    </div>`;
  }

  /**
   * Get zone names that have slots matching a given domain.
   */
  _getZoneSlotsForDomain(domain) {
    const zoneLabels = {
      field: 'Field Overview',
      concourse: 'Concourse',
      mechanical: 'Mechanical Room',
      underground: 'Underground',
      luxury: 'Luxury Suites',
      pressbox: 'Press Box',
    };
    // Map of which domains appear in which zones
    const domainZones = {
      air: ['field', 'concourse', 'mechanical', 'luxury', 'pressbox'],
      water: ['field', 'concourse', 'underground'],
      hvac: ['field', 'mechanical', 'luxury', 'pressbox'],
      drainage: ['field', 'underground'],
    };
    const zones = domainZones[domain];
    if (!zones) return null;
    return zones.map(z => zoneLabels[z] ?? z).join(', ');
  }

  /**
   * Get the reputation tier that corresponds to a filter tier number.
   */
  _getReputationTier(tierNum) {
    const tiers = this.state.config.reputation?.tiers ?? [];
    // T1 always unlocked, T2 = Single-A (41), T3 = Double-A (56), T4 = Triple-A (71)
    const repRequirements = [0, 0, 41, 56, 71];
    const minRep = repRequirements[tierNum] ?? 0;
    return { min: minRep };
  }

  /**
   * Get list of installed filters that have a next tier available.
   */
  _getUpgradeableFilters() {
    const filters = this.state.filters ?? [];
    const systems = this.state.config.filtrationSystems ?? {};
    const upgradeable = [];

    for (const filter of filters) {
      const sys = systems[filter.domain];
      const comp = sys?.components?.[filter.componentType];
      if (!comp) continue;
      const tiers = comp.tiers ?? [];
      const currentTierDef = tiers.find(t => t.tier === filter.tier);
      const nextTierDef = tiers.find(t => t.tier === filter.tier + 1);
      if (!currentTierDef || !nextTierDef) continue;

      // Check reputation unlock for next tier
      const repTier = this._getReputationTier(filter.tier + 1);
      const isUnlocked = this.state.reputation >= (repTier?.min ?? 0);
      if (!isUnlocked) continue;

      // Upgrade cost: next tier cost - 50% trade-in of current tier (matches FiltrationSystem)
      const upgradeCost = Math.max(0, nextTierDef.cost - Math.floor(currentTierDef.cost * 0.5));

      upgradeable.push({
        filter,
        currentTierDef,
        nextTierDef,
        upgradeCost,
        domainDef: sys,
      });
    }
    return upgradeable;
  }

  /**
   * Render the UPGRADES tab content showing installed filters with available upgrades.
   */
  _renderUpgradesTab() {
    const upgradeable = this._getUpgradeableFilters();

    if (upgradeable.length === 0) {
      return `
        <div style="color:#888;text-align:center;padding:20px 12px;line-height:1.6">
          No filters eligible for upgrade.<br>
          <span style="font-size:10px;color:#666">Install filters and build reputation to unlock higher tiers.</span>
        </div>
      `;
    }

    let html = `
      <div style="color:#aaa;font-size:9px;margin-bottom:8px;padding:4px 6px;background:rgba(255,255,255,0.03);border-left:2px solid #ffec27">
        Upgrade installed filters to the next tier. Trade-in value: 50% of current tier cost.
      </div>
    `;

    for (const { filter, currentTierDef, nextTierDef, upgradeCost, domainDef } of upgradeable) {
      const canAfford = this.state.money >= upgradeCost;
      const domainColor = domainDef.color ?? '#888';
      const metricName = domainDef.metricName ?? 'Bonus';

      const currentBonus = currentTierDef.qualityBonus ?? currentTierDef.comfortBonus ?? currentTierDef.integrityBonus ?? 0;
      const nextBonus = nextTierDef.qualityBonus ?? nextTierDef.comfortBonus ?? nextTierDef.integrityBonus ?? 0;
      const bonusDiff = nextBonus - currentBonus;

      const lifeDiff = (nextTierDef.lifespanGames ?? 0) - (currentTierDef.lifespanGames ?? 0);
      const energyDiff = (nextTierDef.energyPerDay ?? 0) - (currentTierDef.energyPerDay ?? 0);

      const condPct = filter.maxCondition > 0
        ? Math.floor((filter.condition / filter.maxCondition) * 100) : 0;
      const condColor = condPct > 75 ? '#00e436' : condPct > 40 ? '#ffa300' : '#ff004d';

      const zoneLabels = {
        field: 'Field', concourse: 'Concourse', mechanical: 'Mechanical',
        underground: 'Underground', luxury: 'Luxury', pressbox: 'Press Box',
      };
      const zoneName = zoneLabels[filter.zone] ?? filter.zone ?? '?';

      html += `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;
          background:rgba(255,255,255,0.03);
          border-left:3px solid ${domainColor}">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:2px">
              <span style="color:${domainColor};font-size:9px">[${domainDef.name}]</span>
              <span style="color:#e0e0e0"><strong>${currentTierDef.name}</strong></span>
              <span style="color:#ffec27;font-size:9px">T${filter.tier}</span>
              <span style="color:#555;font-size:9px">${zoneName}</span>
              <span style="color:${condColor};font-size:9px">${condPct}% HP</span>
            </div>
            <div style="color:#888;font-size:9px;margin-bottom:2px">
              \u2192 <span style="color:#ffec27">${nextTierDef.name}</span>
              <span style="color:#ffec27;font-size:8px">T${filter.tier + 1}</span>
            </div>
            <div style="display:flex;gap:10px;font-size:9px;color:#aaa">
              <span style="color:${bonusDiff > 0 ? '#29adff' : '#888'}">+${bonusDiff} ${metricName}</span>
              <span style="color:${lifeDiff > 0 ? '#00e436' : '#888'}">+${lifeDiff}d life</span>
              <span style="color:${energyDiff > 0 ? '#ffa300' : energyDiff < 0 ? '#00e436' : '#888'}">${energyDiff > 0 ? '+' : ''}${energyDiff} \u26a1/day</span>
            </div>
          </div>
          <span style="color:${canAfford ? '#00e436' : '#555'};width:75px;text-align:right;font-size:10px">$${upgradeCost.toLocaleString()}</span>
          <button data-action="upgrade-filter" data-filter-id="${filter.id}" data-next-tier="${filter.tier + 1}"
            style="background:${canAfford ? '#2a3a2a' : '#2a2a2a'};color:${canAfford ? '#ffec27' : '#555'};
            border:1px solid ${canAfford ? '#4a5a3a' : '#333'};padding:3px 10px;font-family:monospace;
            cursor:${canAfford ? 'pointer' : 'not-allowed'};font-size:9px;width:65px;font-weight:bold">
            UPGRADE
          </button>
        </div>
      `;
    }

    return html;
  }

  /**
   * Emit a navigation hint if the current zone has no matching empty slots.
   * Helps players find where to install their purchased filter.
   */
  _emitZoneNavigationHint(domain) {
    const currentZone = this.state.currentZone ?? 'field';
    const filters = this.state.filters ?? [];

    // Map of which domains have slots in which zones (mirrors _getZoneSlotsForDomain)
    const domainZones = {
      air: ['field', 'concourse', 'mechanical', 'luxury', 'pressbox'],
      water: ['field', 'concourse', 'underground'],
      hvac: ['field', 'mechanical', 'luxury', 'pressbox'],
      drainage: ['field', 'underground'],
    };
    const domainNames = { air: 'Air', water: 'Water', hvac: 'HVAC', drainage: 'Drainage' };
    const zoneLabels = {
      field: 'Field', concourse: 'Concourse', mechanical: 'Mechanical',
      underground: 'Underground', luxury: 'Luxury', pressbox: 'Press Box',
    };

    const possibleZones = domainZones[domain] ?? [];
    if (possibleZones.length === 0) return;

    // Check if current zone is even in the list for this domain
    const currentZoneHasSlots = possibleZones.includes(currentZone);

    if (!currentZoneHasSlots && possibleZones.length > 0) {
      const zoneList = possibleZones.map(z => zoneLabels[z] ?? z).join(', ');
      this.eventBus.emit('ui:message', {
        text: `Tip: ${domainNames[domain] ?? domain} slots are in: ${zoneList}. Use Tab or arrow keys to navigate.`,
        type: 'info',
      });
    }
  }
}
