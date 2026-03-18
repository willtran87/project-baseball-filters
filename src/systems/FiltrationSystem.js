/**
 * FiltrationSystem — Core gameplay system.
 *
 * Manages filter placement, degradation, efficiency calculation,
 * repair/upgrade actions, failure thresholds, and consequences
 * (fan complaints, health violations, revenue loss).
 *
 * Filters are now organized by domain (air, water, hvac, drainage)
 * with component types and 4 upgrade tiers per component.
 */

import { MarketSystem } from './MarketSystem.js';

// Condition thresholds (percentage of maxCondition)
const THRESHOLD_HEALTHY = 0.8;    // 80-100%: Green — no issues
const THRESHOLD_DEGRADED = 0.5;   // 50-79%: Yellow — minor complaints
const THRESHOLD_WARNING = 0.25;   // 25-49%: Orange — fan complaints, reputation loss
const THRESHOLD_CRITICAL = 0;     // 0-24%:  Red — health violations, revenue loss

// Cross-domain synergy pairs: filters from paired domains in the same zone get a bonus
const SYNERGY_PAIRS = [['air', 'hvac'], ['water', 'drainage'], ['electrical', 'hvac'], ['pest', 'drainage']];

export class FiltrationSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;
    this._brokenSet = new Set(); // track which filters have already fired broken event

    this.eventBus.on('filter:install', (data) => this.installFilter(data));
    this.eventBus.on('filter:installEmergency', (data) => this.installEmergencyFilter(data));
    this.eventBus.on('filter:repair', (data) => this.repairFilter(data.id));
    this.eventBus.on('filter:preventiveRepair', (data) => this.preventiveRepair(data.id));
    this.eventBus.on('filter:upgrade', (data) => this.upgradeFilter(data));
    this.eventBus.on('filter:remove', (data) => this._removeFilterWithSalvage(data.id));
    this.eventBus.on('filter:bulkRepair', () => this._handleBulkRepair());

    // Domain-level bulk repair: repair all damaged filters in a given domain
    this.eventBus.on('domain:repairAll', (data) => {
      const result = this.repairAllInDomain(data.domain);
      if (result.repairedCount > 0) {
        this.eventBus.emit('ui:message', { text: `Repaired ${result.repairedCount} ${data.domain} filters for $${result.totalCost}`, type: 'success' });
      }
    });

    // Recalculate zone synergies when filters change
    this.eventBus.on('filter:added', () => this._recalcSynergies());
    this.eventBus.on('filter:removed', () => this._recalcSynergies());
    this.eventBus.on('filter:upgraded', () => this._recalcSynergies());

    // Track daily preventive maintenance hint (once per day)
    this._preventiveHintShownToday = false;
    this.eventBus.on('game:newDay', () => {
      this._preventiveHintShownToday = false;
      this._checkPreventiveMaintenanceHint();
      this._expireEmergencyFilters();
    });

    // Re-sync broken set after save/load
    this.eventBus.on('state:loaded', () => {
      this._brokenSet.clear();
      for (const filter of this.state.filters) {
        if (filter.condition <= 0) {
          this._brokenSet.add(filter.id);
        }
      }
      this._recalcSynergies();
    });
  }

  /**
   * Recalculate zone synergies and cache in state.
   */
  _recalcSynergies() {
    const synergies = this.calculateZoneSynergies();
    this.state.filterSynergies = synergies;
    this.eventBus.emit('filter:synergyChanged', synergies);

    // One-time discovery hint when synergies first activate
    if (!this.state.synergiesDiscovered && Object.keys(synergies).length > 0) {
      this.state.synergiesDiscovered = true;
      this.eventBus.emit('ui:message', {
        text: 'Filter Synergy discovered! Placing 3+ same-domain filters in one zone gives +10% efficiency. Check the Filter Inspector for details.',
        type: 'info',
      });
    }
  }

  /**
   * Calculate per-zone filter combo bonuses.
   * - Same-Domain Concentration: 3+ filters of the same domain in a zone -> +10% efficiency
   * - Cross-Domain Adjacency: paired domains (air+hvac, water+drainage) in same zone -> +5% efficiency
   * Returns a map of { filterId: { sameDomainBonus: number, crossDomainBonus: number } }
   */
  calculateZoneSynergies() {
    const filters = this.state.filters;
    const result = {};

    // Group filters by zone
    const byZone = {};
    for (const filter of filters) {
      const zone = filter.zone ?? 'mechanical';
      if (!byZone[zone]) byZone[zone] = [];
      byZone[zone].push(filter);
    }

    for (const [zone, zoneFilters] of Object.entries(byZone)) {
      // Count filters per domain in this zone
      const domainCounts = {};
      const domainPresent = new Set();
      for (const f of zoneFilters) {
        domainCounts[f.domain] = (domainCounts[f.domain] ?? 0) + 1;
        domainPresent.add(f.domain);
      }

      // Check which cross-domain pairs are present in this zone
      const activePairs = [];
      for (const [a, b] of SYNERGY_PAIRS) {
        if (domainPresent.has(a) && domainPresent.has(b)) {
          activePairs.push([a, b]);
        }
      }

      // Assign bonuses to each filter in this zone
      for (const f of zoneFilters) {
        const entry = { sameDomainBonus: 0, crossDomainBonus: 0 };

        // Same-domain concentration: 3+ of the same domain in this zone
        if ((domainCounts[f.domain] ?? 0) >= 3) {
          entry.sameDomainBonus = 0.1;
        }

        // Cross-domain adjacency: filter's domain is part of an active pair
        for (const [a, b] of activePairs) {
          if (f.domain === a || f.domain === b) {
            entry.crossDomainBonus = 0.05;
            break;
          }
        }

        if (entry.sameDomainBonus > 0 || entry.crossDomainBonus > 0) {
          result[f.id] = entry;
        }
      }
    }

    return result;
  }

  /**
   * Look up a tier definition from the nested filtrationSystems config.
   * Filters now store: { domain, componentType, tier, ... }
   */
  _getTierDef(domain, componentType, tier) {
    const system = this.state.config.filtrationSystems?.[domain];
    const component = system?.components?.[componentType];
    if (!component) return null;
    return component.tiers?.find(t => t.tier === tier) ?? null;
  }

  /**
   * Install a new filter at the given grid position.
   * data: { domain, componentType, tier, x, y }
   */
  installFilter({ domain, componentType, tier, x, y }) {
    // Validate domain is a known filtration domain (data-driven from config)
    const validDomains = Object.keys(this.state.config.filtrationSystems ?? {});
    if (!validDomains.includes(domain)) {
      this.eventBus.emit('ui:message', { text: `Unknown filter domain: ${domain}`, type: 'warning' });
      return null;
    }

    const tierDef = this._getTierDef(domain, componentType, tier ?? 1);
    if (!tierDef) return null;

    // Prevent installing on an occupied slot (field zone has no vent slots)
    const zone = (this.state.currentZone && this.state.currentZone !== 'field') ? this.state.currentZone : 'mechanical';
    const existing = this.state.filters.find(f => f.x === x && f.y === y && f.zone === zone);
    if (existing) {
      this.eventBus.emit('ui:message', { text: 'This slot already has a filter installed.', type: 'warning' });
      return null;
    }

    // Apply Hank's plumbing discount for water/drainage components
    let cost = tierDef.cost;
    const plumbingDiscount = this.state.storyFlags?.discount_plumbing;
    if (plumbingDiscount && (domain === 'water' || domain === 'drainage')) {
      cost = Math.floor(cost * (1 - plumbingDiscount / 100));
    }
    // Apply off-season equipment clearance discount for T2-T3 filters
    const tierNum = tier ?? 1;
    const equipDiscount = (tierNum >= 2 && tierNum <= 3 && this.state.storyFlags?.offSeasonEquipmentDiscount > 0)
      ? this.state.storyFlags.offSeasonEquipmentDiscount : 0;
    if (equipDiscount > 0) {
      cost = Math.floor(cost * (1 - equipDiscount / 100));
    }
    // Apply rival supply disruption cost multiplier
    const supplyCostMult = this.state._supplyCostMultiplier ?? 1.0;
    if (supplyCostMult > 1.0) cost = Math.ceil(cost * supplyCostMult);
    // Apply dynamic market multiplier
    const marketMult = MarketSystem.getMarketMultiplier(this.state.market, domain, tier ?? 1, this.state.purchasedExpansions);
    cost = Math.round(cost * marketMult);

    if (!Number.isFinite(this.state.money) || this.state.money < cost) {
      this.eventBus.emit('ui:message', { text: 'Not enough money!', type: 'warning' });
      return null;
    }

    this.state.set('money', this.state.money - cost);

    // maxCondition derived from lifespan: more lifespan games = higher condition pool
    const maxCondition = (tierDef.lifespanGames ?? 10) * 10;

    const newFilter = this.state.addFilter({
      domain,
      componentType,
      tier: tier ?? 1,
      x,
      y,
      zone: (this.state.currentZone && this.state.currentZone !== 'field') ? this.state.currentZone : 'mechanical',
      condition: maxCondition,
      maxCondition,
      efficiency: 1.0, // starts at full efficiency, degrades with condition
      installedDay: this.state.gameDay ?? 1,
      purchaseCost: cost,
    });

    // Notify player of install with cost info
    const discountNote = (plumbingDiscount && (domain === 'water' || domain === 'drainage') && cost < tierDef.cost) ? ` (${plumbingDiscount}% Hank discount!)` : '';
    this.eventBus.emit('ui:message', {
      text: `Installed ${tierDef.name} ($${cost.toLocaleString()})${discountNote} -- ${domain} domain.`,
      type: 'success',
    });

    return newFilter;
  }

  /**
   * Repair a filter to max condition. Cost is 30% of tier cost.
   * Emergency repair (broken filter) costs 2.5x normal per GDD.
   */
  repairFilter(id) {
    const filter = this.state.getFilter(id);
    if (!filter) return;
    const tierDef = this._getTierDef(filter.domain, filter.componentType, filter.tier);
    if (!tierDef) return;

    if (filter.condition >= filter.maxCondition) {
      this.eventBus.emit('ui:message', { text: 'Filter is already in good condition!', type: 'info' });
      return;
    }

    const baseRepairCost = Math.floor(tierDef.cost * 0.3);
    const emergencyMultiplier = this.state.config.economy?.emergencyRepairMultiplier ?? 2.5;
    const difficultyKey = this.state.difficulty ?? 'veteran';
    const difficultyRepairMult = this.state.config.difficulty?.[difficultyKey]?.repairCostMultiplier ?? 1.0;
    const rawCost = filter.condition <= 0
      ? Math.floor(baseRepairCost * emergencyMultiplier)
      : baseRepairCost;
    // Staff repair multiplier: specialists and story bonuses reduce repair cost
    const staffRepairMult = this.state.staffRepairMultipliers?.[filter.domain] ?? 1;
    // Temporary repair discount from Equipment Donation positive event
    const tempDiscount = this.state.storyFlags?._tempRepairDiscount ? 0.5 : 1.0;
    const actualCost = Math.floor(rawCost * difficultyRepairMult * tempDiscount / staffRepairMult);

    if (this.state.money < actualCost) {
      this.eventBus.emit('ui:message', { text: 'Not enough money to repair!', type: 'warning' });
      return;
    }

    this.state.set('money', this.state.money - actualCost);
    filter.condition = filter.maxCondition;
    filter.efficiency = 1.0;
    this._brokenSet.delete(filter.id);
    this.state.repairsCompleted = (this.state.repairsCompleted ?? 0) + 1;
    this.eventBus.emit('filter:repaired', filter);
    this.eventBus.emit('ui:message', {
      text: `Repaired ${tierDef.name} for $${actualCost.toLocaleString()}. Back to full strength!`,
      type: 'success',
    });
  }

  /**
   * Preventive maintenance: repair a healthy filter (condition >= 80%) to 100% at 50% cost.
   */
  preventiveRepair(id) {
    const filter = this.state.getFilter(id);
    if (!filter) return;

    const conditionRatio = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
    if (conditionRatio < 0.8) {
      this.eventBus.emit('ui:message', { text: 'Filter must be at 80%+ condition for preventive maintenance.', type: 'info' });
      return;
    }
    if (filter.condition >= filter.maxCondition) {
      this.eventBus.emit('ui:message', { text: 'Filter is already at full condition!', type: 'info' });
      return;
    }

    const tierDef = this._getTierDef(filter.domain, filter.componentType, filter.tier);
    if (!tierDef) return;

    // 50% of normal repair cost
    const baseRepairCost = Math.floor(tierDef.cost * 0.3);
    const cost = Math.floor(baseRepairCost * 0.5);

    if (this.state.money < cost) {
      this.eventBus.emit('ui:message', { text: `Not enough money for tune-up ($${cost})!`, type: 'warning' });
      return;
    }

    this.state.set('money', this.state.money - cost);
    filter.condition = filter.maxCondition;
    filter.efficiency = 1.0;

    this.eventBus.emit('filter:preventiveRepaired', { filterId: filter.id, domain: filter.domain, cost });
    this.eventBus.emit('ui:message', {
      text: `Filter tuned up! ($${cost})`,
      type: 'success',
    });
  }

  /**
   * Get the preventive repair cost for a filter (50% of normal repair cost).
   * Returns 0 if filter doesn't qualify (condition < 80% or at max).
   */
  getPreventiveRepairCost(filter) {
    if (!filter) return 0;
    const conditionRatio = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
    if (conditionRatio < 0.8 || filter.condition >= filter.maxCondition) return 0;
    const tierDef = this._getTierDef(filter.domain, filter.componentType, filter.tier);
    if (!tierDef) return 0;
    return Math.floor(Math.floor(tierDef.cost * 0.3) * 0.5);
  }

  /**
   * Daily check: emit subtle hint if any filter is between 70-80% condition.
   */
  _checkPreventiveMaintenanceHint() {
    if (this._preventiveHintShownToday) return;
    for (const filter of this.state.filters) {
      const ratio = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
      if (ratio >= 0.70 && ratio < 0.80) {
        this._preventiveHintShownToday = true;
        this.eventBus.emit('ui:message', {
          text: 'Some filters could use preventive maintenance',
          type: 'info',
        });
        return;
      }
    }
  }

  /**
   * Upgrade a filter to the next tier in-place.
   * data: { id, newTier } or { id } (auto-increments tier)
   */
  upgradeFilter({ id, newTier }) {
    const filter = this.state.getFilter(id);
    if (!filter) return;

    const targetTier = newTier ?? (filter.tier + 1);
    const oldTierDef = this._getTierDef(filter.domain, filter.componentType, filter.tier);
    const newTierDef = this._getTierDef(filter.domain, filter.componentType, targetTier);
    if (!oldTierDef || !newTierDef) {
      this.eventBus.emit('ui:message', { text: 'No further upgrades available!', type: 'info' });
      return;
    }

    // Check reputation-gated tier unlocks
    const repTiers = this.state.config.reputation?.tiers ?? [];
    const tierUnlockMap = { 2: 'tier2Upgrades', 3: 'tier3Upgrades', 4: 'tier4Upgrades' };
    const unlockKey = tierUnlockMap[targetTier];
    if (unlockKey) {
      const isUnlocked = repTiers.some(
        t => this.state.reputation >= t.min && t.unlocks?.includes(unlockKey)
      );
      if (!isUnlocked) {
        this.eventBus.emit('ui:message', { text: `Tier ${targetTier} upgrades are not unlocked yet!`, type: 'warning' });
        return;
      }
    }

    // Upgrade cost: new cost minus 50% of old cost (trade-in value)
    const upgradeCost = Math.max(0, newTierDef.cost - Math.floor(oldTierDef.cost * 0.5));
    if (!Number.isFinite(this.state.money) || this.state.money < upgradeCost) {
      this.eventBus.emit('ui:message', { text: 'Not enough money to upgrade!', type: 'warning' });
      return;
    }

    this.state.set('money', this.state.money - upgradeCost);

    const oldName = oldTierDef.name;
    const newMaxCondition = (newTierDef.lifespanGames ?? 10) * 10;
    filter.tier = targetTier;
    filter.condition = newMaxCondition;
    filter.maxCondition = newMaxCondition;
    filter.efficiency = 1.0;
    this._brokenSet.delete(filter.id);

    this.eventBus.emit('filter:upgraded', { filter, oldType: oldName, newType: newTierDef.name });
    this.eventBus.emit('ui:message', {
      text: `Upgraded: ${oldName} -> ${newTierDef.name} ($${upgradeCost.toLocaleString()})`,
      type: 'success',
    });
  }

  /**
   * Calculate repair cost for a single filter (mirrors repairFilter logic).
   */
  _getRepairCost(filter) {
    const tierDef = this._getTierDef(filter.domain, filter.componentType, filter.tier);
    if (!tierDef) return 0;
    if (filter.condition >= filter.maxCondition) return 0;

    const baseRepairCost = Math.floor(tierDef.cost * 0.3);
    const emergencyMultiplier = this.state.config.economy?.emergencyRepairMultiplier ?? 2.5;
    const difficultyKey = this.state.difficulty ?? 'veteran';
    const difficultyRepairMult = this.state.config.difficulty?.[difficultyKey]?.repairCostMultiplier ?? 1.0;
    const rawCost = filter.condition <= 0
      ? Math.floor(baseRepairCost * emergencyMultiplier)
      : baseRepairCost;
    const staffRepairMult = this.state.staffRepairMultipliers?.[filter.domain] ?? 1;
    const tempDiscount = this.state.storyFlags?._tempRepairDiscount ? 0.5 : 1.0;
    return Math.floor(rawCost * difficultyRepairMult * tempDiscount / staffRepairMult);
  }

  /**
   * Bulk repair all filters in a given zone.
   * Returns { count, totalCost } or null if nothing to repair / can't afford.
   */
  bulkRepairZone(zone) {
    const filtersToRepair = this.state.filters.filter(
      f => (f.zone ?? 'mechanical') === zone && f.condition < f.maxCondition
    );

    if (filtersToRepair.length === 0) {
      this.eventBus.emit('ui:message', { text: 'All filters in this zone are in good condition!', type: 'info' });
      return null;
    }

    let totalCost = 0;
    for (const filter of filtersToRepair) {
      totalCost += this._getRepairCost(filter);
    }

    if (this.state.money < totalCost) {
      this.eventBus.emit('ui:message', {
        text: `Not enough money to repair all! Need $${totalCost.toLocaleString()}, have $${this.state.money.toLocaleString()}.`,
        type: 'warning',
      });
      return null;
    }

    this.state.set('money', this.state.money - totalCost);

    for (const filter of filtersToRepair) {
      filter.condition = filter.maxCondition;
      filter.efficiency = 1.0;
      this._brokenSet.delete(filter.id);
      this.state.repairsCompleted = (this.state.repairsCompleted ?? 0) + 1;
      this.eventBus.emit('filter:repaired', filter);
    }

    this.eventBus.emit('ui:message', {
      text: `Repaired ${filtersToRepair.length} filter${filtersToRepair.length > 1 ? 's' : ''} for $${totalCost.toLocaleString()}`,
      type: 'success',
    });

    return { count: filtersToRepair.length, totalCost };
  }

  /**
   * Handle bulk repair event — repairs all filters in the current zone.
   */
  _handleBulkRepair() {
    const zone = this.state.currentZone ?? 'field';
    this.bulkRepairZone(zone);
  }

  /**
   * Install an emergency filter into a vent slot.
   * Emergency filters are universal (any domain), tier 0, 30% efficiency, expire after 1 game day.
   * data: { x, y, domain } — domain is inherited from the vent slot.
   */
  installEmergencyFilter({ x, y, domain }) {
    if ((this.state.emergencyFilters ?? 0) <= 0) {
      this.eventBus.emit('ui:message', { text: 'No emergency filters in stock!', type: 'warning' });
      return null;
    }

    const zone = (this.state.currentZone && this.state.currentZone !== 'field') ? this.state.currentZone : 'mechanical';
    const existing = this.state.filters.find(f => f.x === x && f.y === y && f.zone === zone);
    if (existing) {
      this.eventBus.emit('ui:message', { text: 'This slot already has a filter installed.', type: 'warning' });
      return null;
    }

    this.state.emergencyFilters = (this.state.emergencyFilters ?? 0) - 1;

    const newFilter = this.state.addFilter({
      domain,
      componentType: 'emergency',
      tier: 0,
      x,
      y,
      zone,
      condition: 100,
      maxCondition: 100,
      efficiency: 0.3,
      installedDay: this.state.gameDay ?? 1,
      isEmergency: true,
      expiresOnDay: (this.state.gameDay ?? 1) + 1,
      purchaseCost: 600,
    });

    this.eventBus.emit('ui:message', {
      text: `Emergency filter installed in ${domain} slot. Expires tomorrow!`,
      type: 'success',
    });

    return newFilter;
  }

  /**
   * On new day, auto-remove expired emergency filters.
   */
  _expireEmergencyFilters() {
    const expired = this.state.filters.filter(
      f => f.isEmergency && (this.state.gameDay ?? 1) >= (f.expiresOnDay ?? 0)
    );
    for (const filter of expired) {
      const zone = filter.zone ?? 'unknown zone';
      this.state.removeFilter(filter.id);
      this.eventBus.emit('ui:message', {
        text: `Emergency filter in ${zone} has expired.`,
        type: 'warning',
      });
    }
  }

  /**
   * Remove a filter and store it in the resale inventory if salvageable.
   * Broken filters (condition <= 0) and emergency filters are destroyed.
   */
  _removeFilterWithSalvage(id) {
    const filter = this.state.getFilter(id);
    if (!filter) return;

    const isBroken = filter.condition <= 0;
    const isEmergency = filter.isEmergency;

    // Calculate resale value before removing
    if (!isBroken && !isEmergency) {
      const resaleValue = this.getResaleValue(filter);
      if (resaleValue > 0) {
        const tierDef = this._getTierDef(filter.domain, filter.componentType, filter.tier);
        const name = tierDef?.name ?? 'Filter';
        const condPct = filter.maxCondition > 0
          ? Math.floor((filter.condition / filter.maxCondition) * 100) : 0;
        const inventory = this.state.filterInventory ?? [];
        inventory.push({
          domain: filter.domain,
          componentType: filter.componentType,
          tier: filter.tier,
          name,
          condition: filter.condition,
          maxCondition: filter.maxCondition,
          conditionPercent: condPct,
          resaleValue,
          purchaseCost: filter.purchaseCost ?? tierDef?.cost ?? 0,
        });
        this.state.filterInventory = inventory;
      }
    }

    this.state.removeFilter(id);
  }

  /**
   * Calculate the resale value for a filter.
   * Base: 20% of original cost, modified by condition ratio and market multiplier.
   */
  getResaleValue(filter) {
    if (!filter || filter.isEmergency) return 0;
    if (filter.condition <= 0) return 0;

    const tierDef = this._getTierDef(filter.domain, filter.componentType, filter.tier);
    const baseCost = filter.purchaseCost ?? tierDef?.cost ?? 0;
    if (baseCost <= 0) return 0;

    // Base resale: 20% of purchase cost
    let resale = baseCost * 0.20;

    // Condition modifier
    const conditionRatio = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
    resale *= conditionRatio;

    // Market modifier (boom = better resale)
    const marketMult = this.state.marketMultiplier ?? 1.0;
    resale *= marketMult;

    return Math.floor(resale);
  }

  /**
   * Per-tick update: degrade filters, calculate overall quality,
   * apply reputation effects based on filter health.
   * Accounts for system stress levels and cross-system interactions.
   */
  update(dt) {
    if (this.state.paused) return;

    // Off-season: degrade at 20% of normal rate instead of skipping entirely
    const offSeasonMultiplier = this.state.offSeason ? 0.2 : 1.0;

    // Emit one-time off-season toast on first degradation tick
    if (this.state.offSeason && !this._offSeasonToastShown) {
      this._offSeasonToastShown = true;
      this.eventBus.emit('ui:message', {
        text: 'Off-season: Filters degrade slowly during downtime',
        type: 'info',
      });
    }
    if (!this.state.offSeason) {
      this._offSeasonToastShown = false;
    }

    let totalEfficiency = 0;
    let healthyCount = 0;
    let warningCount = 0;
    let brokenCount = 0;

    // Get stress-based degrade multiplier from game day type (supports both systemStress string and stressTier object formats)
    const gameDayDef = this.state.config.gameDayTypes?.[this.state.currentGameDayType] ?? {};
    let stressDegradeMultiplier = 1.0;
    if (gameDayDef.stressTier) {
      stressDegradeMultiplier = gameDayDef.stressTier.degradeMultiplier ?? 1.0;
    } else {
      const stressLevel = gameDayDef.systemStress ?? 'low';
      const stressDef = this.state.config.systemStressLevels?.[stressLevel] ?? {};
      stressDegradeMultiplier = stressDef.degradeMultiplier ?? 1.0;
    }

    // Event-based degrade multiplier stacks with stress
    const eventDegradeMultiplier = this.state.activeEvent?.degradeMultiplier ?? 1;

    // Difficulty-based degrade rate
    const difficultyKey = this.state.difficulty ?? 'veteran';
    const difficultyDef = this.state.config.difficulty?.[difficultyKey] ?? {};
    const difficultyDegrade = difficultyDef.degradeRate ?? 1.0;

    // Attendance stress multiplier (higher crowds = faster filter wear)
    const attPct = this.state.attendancePercent ?? 0;
    const attStressTiers = this.state.config.attendanceStress ?? [];
    let attDegradeMult = 1.0;
    for (const tier of attStressTiers) {
      if (attPct <= tier.maxPercent) { attDegradeMult = tier.degradeMultiplier; break; }
    }

    // Research: weatherResponseBonus reduces weather degradation multiplier
    const weatherResponseBonus = this.state.researchEffects?.weatherResponseBonus ?? 0;
    const weatherResearchMult = eventDegradeMultiplier > 1 && weatherResponseBonus > 0
      ? (1 - weatherResponseBonus)
      : 1.0;

    // Championship game stress multiplier (1.5x during championship game day)
    const championshipMult = this.state.championshipStressMultiplier ?? 1.0;
    // Monthly challenge weather frequency multiplier
    const challengeWeatherMult = (this.state.challengeConstraints?.type === 'weatherFrequency')
      ? (this.state.challengeConstraints.value ?? 1) : 1.0;

    // Filter event multipliers: contamination spike (2x for water/drainage) and efficiency boost (0.7x all)
    const contaminationActive = (this.state.contaminationDaysLeft ?? 0) > 0;
    const efficiencyBoostActive = (this.state.efficiencyBoostDaysLeft ?? 0) > 0;
    const efficiencyBoostMult = efficiencyBoostActive ? 0.7 : 1.0;

    // Weather Station Tower: 20% reduced weather stress on filter degradation
    const hasWeatherStation = (this.state.purchasedExpansions ?? []).some(p => p.key === 'weatherStationTower');
    const weatherStationMult = (hasWeatherStation && eventDegradeMultiplier > 1) ? 0.80 : 1.0;

    // Steam Forge: 15% reduced degradation for HVAC and air domain filters (applied per-filter below)
    const hasSteamForge = (this.state.purchasedExpansions ?? []).some(p => p.key === 'steamForge');

    // Winterization Bay: 50% reduced degradation in off-season, 20% reduced during cold events
    const hasWinterization = (this.state.purchasedExpansions ?? []).some(p => p.key === 'winterizationBay');
    const isColdEvent = ['Cold', 'Snow', 'Ice'].some(w => (this.state.activeEvent?.name ?? '').includes(w));
    const winterMult = hasWinterization ? (this.state.offSeason ? 0.50 : (isColdEvent ? 0.80 : 1.0)) : 1.0;

    const combinedDegradeMultiplier = stressDegradeMultiplier * eventDegradeMultiplier * weatherResearchMult * difficultyDegrade * attDegradeMult * championshipMult * challengeWeatherMult * offSeasonMultiplier * efficiencyBoostMult * weatherStationMult * winterMult;

    // Pre-scan for weatherShield passive: reduces degradation by 20% during weather events
    const weatherShieldDomains = new Set();
    if (eventDegradeMultiplier > 1) {
      for (const filter of this.state.filters) {
        if (filter.domain && filter.maxCondition > 0 && (filter.condition / filter.maxCondition) > 0.5) {
          const td = this._getTierDef(filter.domain, filter.componentType, filter.tier);
          if (td?.passive === 'weatherShield') {
            weatherShieldDomains.add(filter.domain);
          }
        }
      }
    }

    // Calculate base degrade rate so filters last their intended lifespanGames.
    // A game day = inningsPerGame * inningDurationSec real seconds.
    const inningsPerGame = this.state.config.inningsPerGame ?? 9;
    const inningDuration = this.state.config.inningDurationSec ?? 30;
    const gameDaySec = inningsPerGame * inningDuration;

    for (const filter of this.state.filters) {
      // Emergency filters don't degrade — they have fixed efficiency and just expire
      if (filter.isEmergency) {
        totalEfficiency += filter.efficiency;
        healthyCount++;
        continue;
      }

      // Per-filter degrade rate: maxCondition over (lifespanGames * gameDaySec) seconds
      const tierDef = this._getTierDef(filter.domain, filter.componentType, filter.tier);
      const lifespanGames = tierDef?.lifespanGames ?? 10;
      const baseRate = filter.maxCondition / (lifespanGames * gameDaySec);

      // weatherShield: 20% less degradation for same-domain filters during weather events
      const weatherMult = weatherShieldDomains.has(filter.domain) ? 0.8 : 1.0;

      // Staff specialization: 10% reduced degradation when a specialist is assigned to this domain
      // Specialization coverage: airTech covers air+hvac, plumber covers water+drainage,
      // general covers all domains, electrician covers hvac
      let staffSpecMult = 1.0;
      const staffList = this.state.staffList ?? [];
      const specDomainMap = {
        airTech: ['air', 'hvac'], plumber: ['water', 'drainage'],
        electrician: ['hvac', 'electrical'], sanitarian: ['pest'],
        general: ['air', 'water', 'hvac', 'drainage', 'electrical', 'pest'],
      };
      for (const staff of staffList) {
        if (!staff.specialization || staff.assignedDomain !== filter.domain) continue;
        const coveredDomains = specDomainMap[staff.specialization];
        if (coveredDomains && coveredDomains.includes(filter.domain)) {
          staffSpecMult = 0.9;
          break;
        }
      }

      // Per-domain weather stress: active weather events define systemStress per domain
      // (e.g., Heavy Thunderstorm: { drainage: 2.5, air: 1.3 })
      const weatherDomainStress = this.state.activeEvent?.systemStress?.[filter.domain] ?? 1.0;

      // Research: criticalFailureReduction slows decay in the final 15% of condition
      const criticalFailureReduction = this.state.researchEffects?.criticalFailureReduction ?? 0;
      const condRatioPre = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
      const criticalSlowdown = (condRatioPre < 0.15 && criticalFailureReduction > 0)
        ? (1 - criticalFailureReduction)
        : 1.0;

      // Contamination spike: 2x degradation for water/drainage domain filters
      const contaminationMult = (contaminationActive && (filter.domain === 'water' || filter.domain === 'drainage')) ? 2.0 : 1.0;

      // Steam Forge: 15% reduced degradation for hvac and air domain filters
      const steamForgeMult = (hasSteamForge && (filter.domain === 'hvac' || filter.domain === 'air')) ? 0.85 : 1.0;

      // Degrade condition over time (baseRate ensures filter lasts its intended lifespan)
      filter.condition -= dt * baseRate * combinedDegradeMultiplier * weatherMult * staffSpecMult * weatherDomainStress * criticalSlowdown * contaminationMult * steamForgeMult;

      const conditionRatio = filter.maxCondition > 0
        ? filter.condition / filter.maxCondition
        : 0;

      // Research: airQualityWarningTime — warn when air filters drop below 35% instead of 25%
      const airWarningThreshold = (this.state.researchEffects?.airQualityWarningTime ?? 0) > 0 ? 0.35 : 0.25;
      if (filter.domain === 'air' && conditionRatio < airWarningThreshold && conditionRatio > 0
          && !filter._airQualityWarningShown) {
        filter._airQualityWarningShown = true;
        this.eventBus.emit('ui:message', {
          text: `Air quality warning: Air filter at ${filter.zone ?? 'unknown zone'} dropping — ${Math.round(conditionRatio * 100)}% condition.`,
          type: 'warning',
        });
      }
      if (conditionRatio >= airWarningThreshold) {
        filter._airQualityWarningShown = false;
      }

      // Research: leakDetectionChance — when water filter degrades past 50%, chance to auto-detect
      const leakDetectionChance = this.state.researchEffects?.leakDetectionChance ?? 0;
      if (filter.domain === 'water' && leakDetectionChance > 0
          && conditionRatio < 0.50 && conditionRatio > 0
          && !filter._leakDetectionShown) {
        if (Math.random() < leakDetectionChance) {
          filter._leakDetectionShown = true;
          this.eventBus.emit('ui:message', {
            text: `Leak detected: Water filter at ${filter.zone ?? 'unknown zone'} degrading — early warning from sensors.`,
            type: 'warning',
          });
        }
      }
      if (conditionRatio >= 0.50) {
        filter._leakDetectionShown = false;
      }

      // Research: equipmentFailureWarning — warn when any filter has <15% condition
      const equipmentFailureWarning = this.state.researchEffects?.equipmentFailureWarning ?? 0;
      if (equipmentFailureWarning > 0 && conditionRatio < 0.15 && conditionRatio > 0
          && !filter._failureWarningShown) {
        filter._failureWarningShown = true;
        this.eventBus.emit('ui:message', {
          text: `Failure imminent: ${filter.domain} filter at ${filter.zone ?? 'unknown zone'} critically low — replace immediately!`,
          type: 'danger',
        });
      }
      if (conditionRatio >= 0.15) {
        filter._failureWarningShown = false;
      }

      // Hank's early warning: drainage filter critically low
      if (filter.domain === 'drainage' && conditionRatio < 0.25 && conditionRatio > 0
          && this.state.storyFlags?.earlyWarningEastDrain
          && !filter._earlyWarningShown) {
        filter._earlyWarningShown = true;
        this.eventBus.emit('ui:message', {
          text: `Hank's early warning: Drainage filter at ${filter.zone ?? 'unknown zone'} critically low!`,
          type: 'warning',
        });
      }
      if (conditionRatio >= 0.25) {
        filter._earlyWarningShown = false;
      }

      if (filter.condition <= 0) {
        filter.condition = 0;
        filter.efficiency = 0;
        brokenCount++;

        if (!this._brokenSet.has(filter.id)) {
          this._brokenSet.add(filter.id);
          this.eventBus.emit('filter:broken', filter);
        }
      } else {
        // Apply zone synergy bonuses to efficiency
        const synergy = this.state.filterSynergies?.[filter.id];
        const synergyMult = synergy
          ? 1 + (synergy.sameDomainBonus ?? 0) + (synergy.crossDomainBonus ?? 0)
          : 1;
        filter.efficiency = Math.min(1, conditionRatio * synergyMult);

        if (conditionRatio >= THRESHOLD_HEALTHY) {
          healthyCount++;
        } else if (conditionRatio < THRESHOLD_WARNING) {
          warningCount++;
        }
      }

      totalEfficiency += filter.efficiency;
    }

    // Overall filtration quality
    const filterCount = this.state.filters.length;
    const avgEfficiency = filterCount > 0 ? totalEfficiency / filterCount : 0;

    // Reputation drift is handled by ProgressionSystem to avoid double-counting.
    // FiltrationSystem only emits quality data for other systems to consume.

    // Check cross-system interaction cascades
    this._checkSystemInteractions(avgEfficiency);

    this.eventBus.emit('filtration:quality', {
      avgEfficiency,
      filterCount,
      healthyCount,
      warningCount,
      brokenCount,
    });
  }

  /**
   * Check for cross-system cascading effects.
   * When one domain's average quality is low, connected domains take extra stress.
   */
  _checkSystemInteractions(overallAvgEfficiency) {
    const interactions = this.state.config.systemInteractions ?? [];
    if (interactions.length === 0 || overallAvgEfficiency > 0.5) return;

    // Calculate per-domain average efficiency
    const domainEfficiency = {};
    const domainCounts = {};
    for (const filter of this.state.filters) {
      const d = filter.domain;
      domainEfficiency[d] = (domainEfficiency[d] ?? 0) + filter.efficiency;
      domainCounts[d] = (domainCounts[d] ?? 0) + 1;
    }
    for (const d of Object.keys(domainEfficiency)) {
      domainEfficiency[d] = domainCounts[d] > 0 ? domainEfficiency[d] / domainCounts[d] : 0;
    }

    // Apply cascade penalties when source domain is below 30% efficiency
    for (const interaction of interactions) {
      if ((domainEfficiency[interaction.source] ?? 1) < 0.3) {
        this.eventBus.emit('system:cascade', {
          source: interaction.source,
          target: interaction.target,
          effect: interaction.effect,
          severity: interaction.severity,
        });
      }
    }
  }

  /**
   * Repair all damaged filters in a given domain.
   * If the player can't afford all repairs, repairs as many as possible starting with the most damaged.
   * Returns { repairedCount, totalCost }.
   */
  repairAllInDomain(domain) {
    const damaged = this.state.filters.filter(
      f => f.domain === domain && f.condition < f.maxCondition
    );

    if (damaged.length === 0) {
      this.eventBus.emit('ui:message', { text: `All ${domain} filters are in good condition!`, type: 'info' });
      return { repairedCount: 0, totalCost: 0 };
    }

    // Sort by condition ascending (most damaged first) so we prioritize worst filters if budget is limited
    damaged.sort((a, b) => a.condition - b.condition);

    let totalCost = 0;
    let repairedCount = 0;

    for (const filter of damaged) {
      const cost = this._getRepairCost(filter);
      if (this.state.money < cost) continue;

      this.state.set('money', this.state.money - cost);
      filter.condition = filter.maxCondition;
      filter.efficiency = 1.0;
      this._brokenSet.delete(filter.id);
      this.state.repairsCompleted = (this.state.repairsCompleted ?? 0) + 1;
      this.eventBus.emit('filter:repaired', filter);

      totalCost += cost;
      repairedCount++;
    }

    return { repairedCount, totalCost };
  }

  /**
   * Get repair cost summary for all damaged filters in a domain.
   * Read-only method used by the UI to show costs before confirming.
   */
  getDomainRepairCost(domain) {
    const damaged = this.state.filters.filter(
      f => f.domain === domain && f.condition < f.maxCondition
    );

    const filters = damaged.map(f => {
      const tierDef = this._getTierDef(f.domain, f.componentType, f.tier);
      return {
        id: f.id,
        name: tierDef?.name ?? 'Unknown Filter',
        condition: f.condition,
        maxCondition: f.maxCondition,
        repairCost: this._getRepairCost(f),
      };
    });

    const totalCost = filters.reduce((sum, f) => sum + f.repairCost, 0);

    return { totalCost, filterCount: filters.length, filters };
  }

  /**
   * Get a summary of domain filter stats for UI display.
   */
  getDomainStats(domain) {
    const domainFilters = this.state.filters.filter(f => f.domain === domain);

    if (domainFilters.length === 0) {
      return {
        filterCount: 0,
        avgEfficiency: 0,
        brokenCount: 0,
        warningCount: 0,
        healthyCount: 0,
        totalRepairCost: 0,
        lowestFilter: null,
        degradeRate: 'normal',
      };
    }

    let totalEfficiency = 0;
    let brokenCount = 0;
    let warningCount = 0;
    let healthyCount = 0;
    let totalRepairCost = 0;
    let lowestFilter = null;
    let lowestPct = Infinity;

    for (const f of domainFilters) {
      totalEfficiency += f.efficiency;
      const condPct = f.maxCondition > 0 ? f.condition / f.maxCondition : 0;

      if (f.condition <= 0) {
        brokenCount++;
      } else if (condPct < 0.5) {
        warningCount++;
      } else if (condPct >= 0.8) {
        healthyCount++;
      }

      totalRepairCost += this._getRepairCost(f);

      if (condPct < lowestPct) {
        lowestPct = condPct;
        const tierDef = this._getTierDef(f.domain, f.componentType, f.tier);
        lowestFilter = {
          id: f.id,
          componentType: f.componentType,
          tier: f.tier,
          conditionPct: Math.round(condPct * 100),
        };
      }
    }

    // Determine degradeRate based on active events and contamination
    const contaminationActive = (this.state.contaminationDaysLeft ?? 0) > 0;
    const eventDegradeMultiplier = this.state.activeEvent?.degradeMultiplier ?? 1;
    let degradeRate = 'normal';
    if (contaminationActive && (domain === 'water' || domain === 'drainage')) {
      degradeRate = 'critical';
    } else if (eventDegradeMultiplier > 1.5) {
      degradeRate = 'critical';
    } else if (eventDegradeMultiplier > 1) {
      degradeRate = 'elevated';
    }

    return {
      filterCount: domainFilters.length,
      avgEfficiency: domainFilters.length > 0 ? totalEfficiency / domainFilters.length : 0,
      brokenCount,
      warningCount,
      healthyCount,
      totalRepairCost,
      lowestFilter,
      degradeRate,
    };
  }

  /**
   * Get health status string for a filter.
   */
  static getFilterStatus(filter) {
    if (filter.condition <= 0) return 'broken';
    const ratio = filter.condition / filter.maxCondition;
    if (ratio >= THRESHOLD_HEALTHY) return 'healthy';
    if (ratio >= THRESHOLD_DEGRADED) return 'degraded';
    if (ratio >= THRESHOLD_WARNING) return 'warning';
    return 'critical';
  }
}
