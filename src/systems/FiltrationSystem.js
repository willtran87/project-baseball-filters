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

export class FiltrationSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;
    this._brokenSet = new Set(); // track which filters have already fired broken event

    this.eventBus.on('filter:install', (data) => this.installFilter(data));
    this.eventBus.on('filter:repair', (data) => this.repairFilter(data.id));
    this.eventBus.on('filter:upgrade', (data) => this.upgradeFilter(data));
    this.eventBus.on('filter:remove', (data) => this.state.removeFilter(data.id));
    this.eventBus.on('filter:bulkRepair', () => this._handleBulkRepair());

    // Re-sync broken set after save/load
    this.eventBus.on('state:loaded', () => {
      this._brokenSet.clear();
      for (const filter of this.state.filters) {
        if (filter.condition <= 0) {
          this._brokenSet.add(filter.id);
        }
      }
    });
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
    // Validate domain is a known filtration domain
    const validDomains = ['air', 'water', 'hvac', 'drainage'];
    if (!validDomains.includes(domain)) {
      this.eventBus.emit('ui:message', { text: `Unknown filter domain: ${domain}`, type: 'warning' });
      return null;
    }

    const tierDef = this._getTierDef(domain, componentType, tier ?? 1);
    if (!tierDef) return null;

    // Prevent installing on an occupied slot
    const zone = this.state.currentZone ?? 'mechanical';
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
    const marketMult = MarketSystem.getMarketMultiplier(this.state.market, domain, tier ?? 1);
    cost = Math.round(cost * marketMult);

    if (this.state.money < cost) {
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
      zone: this.state.currentZone ?? 'mechanical',
      condition: maxCondition,
      maxCondition,
      efficiency: 1.0, // starts at full efficiency, degrades with condition
      installedDay: this.state.gameDay ?? 1,
    });

    // Notify player of install with cost info
    const discountNote = cost < tierDef.cost ? ` (${plumbingDiscount}% Hank discount!)` : '';
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
    if (this.state.money < upgradeCost) {
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
   * Per-tick update: degrade filters, calculate overall quality,
   * apply reputation effects based on filter health.
   * Accounts for system stress levels and cross-system interactions.
   */
  update(dt) {
    if (this.state.paused) return;
    // During off-season, filters don't degrade (no games = no system stress)
    if (this.state.offSeason) return;

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

    const combinedDegradeMultiplier = stressDegradeMultiplier * eventDegradeMultiplier * weatherResearchMult * difficultyDegrade * attDegradeMult * championshipMult * challengeWeatherMult;

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
        electrician: ['hvac'], general: ['air', 'water', 'hvac', 'drainage'],
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

      // Degrade condition over time (baseRate ensures filter lasts its intended lifespan)
      filter.condition -= dt * baseRate * combinedDegradeMultiplier * weatherMult * staffSpecMult * weatherDomainStress * criticalSlowdown;

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
        filter.efficiency = conditionRatio;

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
