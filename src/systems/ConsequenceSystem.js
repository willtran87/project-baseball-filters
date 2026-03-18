/**
 * ConsequenceSystem -- Maps filter/maintenance quality to realistic gameplay effects.
 *
 * Periodically scores each domain per-zone based on installed filter efficiency
 * and the domain's protection mapping (which zones each domain protects).
 * Activates consequences (penalties for poor maintenance) AND bonuses
 * (rewards for well-maintained systems).
 * Affects attendance, revenue, reputation, and team performance.
 */

import { DOMAIN_ZONE_PROTECTION, ALL_ZONES } from '../data/domainZoneMap.js';

export class ConsequenceSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;
    this._lastCheck = 0;
    this._checkInterval = 5; // check every 5 seconds of game time
    this._notifyCooldowns = {}; // prevent notification spam
    this._cascadeMsgDay = {}; // track last game day a cascade message was shown per effect

    // Reset timer on load so we don't carry stale accumulator
    this.eventBus.on('state:loaded', () => {
      this._lastCheck = 0;
      this._notifyCooldowns = {};
      this._cascadeMsgDay = {};
    });

    // Schedule next inspection after one completes
    this.eventBus.on('inspection:result', () => {
      const nextDay = this.state.gameDay + 17 + Math.floor(Math.random() * 7); // ~20 days ± 3
      this.state.nextInspectionDay = nextDay;
    });

    // Inspection countdown warning at 3 days out
    this.eventBus.on('game:newDay', () => {
      const daysUntil = (this.state.nextInspectionDay ?? 999) - (this.state.gameDay ?? 0);
      if (daysUntil === 3) {
        const grade = this.getEstimatedInspectionGrade();
        this.eventBus.emit('ui:message', {
          text: `Health inspection in 3 days \u2014 estimated grade: ${grade}`,
          type: grade === 'A' || grade === 'B' ? 'info' : 'warning',
        });
      }
    });

    // Daily contract breach risk check
    this.eventBus.on('game:newDay', () => this._checkContractBreachRisk());

    // Listen for cross-system cascade events from FiltrationSystem
    this.eventBus.on('system:cascade', (data) => {
      const severityMap = { low: 1, medium: 2, high: 3 };
      const severityValue = severityMap[data.severity] ?? 1;
      const penalty = severityValue * 5;

      // Apply cascade penalty to zone-specific health
      const zdh = this.state.zoneDomainHealth ?? {};
      for (const zone of ALL_ZONES) {
        if (zdh[zone] && zdh[zone][data.target] !== undefined) {
          zdh[zone][data.target] = Math.max(0, zdh[zone][data.target] - penalty);
        }
      }
      this.state.set('zoneDomainHealth', zdh);

      // Recompute aggregate: use max across protected zones per domain
      // (cascade penalties applied uniformly, so just read any protected zone)
      const health = this.state.domainHealth ?? {};
      const domainKeys = Object.keys(health);
      for (const d of domainKeys) {
        const protectedZones = DOMAIN_ZONE_PROTECTION[d] ?? ALL_ZONES;
        const bestZone = protectedZones[0] ?? ALL_ZONES[0];
        health[d] = zdh[bestZone]?.[d] ?? 100;
      }
      this.state.set('domainHealth', health);

      this._emitCascadeMessage(data);
    });
  }

  update(dt) {
    if (this.state.paused) return;
    // No consequences during off-season — no fans, no games, no attendance
    if (this.state.offSeason) return;
    this._lastCheck += dt;
    if (this._lastCheck < this._checkInterval) return;
    this._lastCheck = 0;

    // Calculate zone-specific domain health scores + aggregate
    const { zoneHealth, aggregateScores } = this._calculateDomainScores();

    // Store both in state
    this.state.set('zoneDomainHealth', zoneHealth);
    this.state.set('domainHealth', aggregateScores);

    // Determine active consequences (global, from aggregate — drives gameplay effects)
    const consequences = this._evaluateConsequences(aggregateScores);
    this.state.set('activeConsequences', consequences);

    // Evaluate zone-specific consequences (drives per-zone visuals)
    const zoneConsequences = this._evaluateZoneConsequences(zoneHealth);
    this.state.set('zoneConsequences', zoneConsequences);

    // Apply gameplay effects (uses aggregate scores)
    this._applyEffects(aggregateScores, consequences);

    // Emit domain:critical for any domain below 20% (aggregate)
    for (const [domain, score] of Object.entries(aggregateScores)) {
      if (score < 20) {
        this.eventBus.emit('domain:critical', { domain, score });
      }
    }

    // Emit for visual/notification layers
    this.eventBus.emit('consequence:update', { scores: aggregateScores, consequences, zoneHealth });
  }

  _calculateDomainScores() {
    // Build domain maps dynamically from config
    const domainKeys = Object.keys(this.state.config.filtrationSystems ?? {});
    const domains = {};
    const domainBonuses = {};
    const tierBonuses = {};
    for (const key of domainKeys) {
      domains[key] = [];
      domainBonuses[key] = 0;
      tierBonuses[key] = 0;
    }
    let crossDomainHvacBonus = 0;

    for (const filter of this.state.filters) {
      if (filter.domain && domains[filter.domain]) {
        const efficiency = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
        domains[filter.domain].push(efficiency);

        // Collect domainHealthBonus and tier quality/comfort/integrity bonuses
        // from filters above 50% condition
        if (efficiency > 0.5) {
          const tierDef = this._getFilterTierDef(filter);
          const bonus = tierDef?.domainHealthBonus ?? 0;
          domainBonuses[filter.domain] += bonus;

          const tierBonus = (tierDef?.qualityBonus ?? 0)
            + (tierDef?.comfortBonus ?? 0)
            + (tierDef?.integrityBonus ?? 0);
          tierBonuses[filter.domain] += (tierBonus / 60) * 15;

          if (tierDef?.passive === 'crossDomain') {
            crossDomainHvacBonus += Math.floor(bonus / 2);
          }
        }
      }
    }

    if (domainBonuses.hvac !== undefined) domainBonuses.hvac += crossDomainHvacBonus;

    // Staff specialization bonus: +5 domain health when a specialist is assigned
    const specDomainMap = {
      airTech: ['air', 'hvac'], plumber: ['water', 'drainage'],
      electrician: ['hvac', 'electrical'], sanitarian: ['pest'],
      general: ['air', 'water', 'hvac', 'drainage', 'electrical', 'pest'],
    };
    const staffList = this.state.staffList ?? [];
    for (const staff of staffList) {
      if (!staff.specialization || !staff.assignedDomain) continue;
      if (staff.training && staff.training.daysRemaining > 0) continue;
      const coveredDomains = specDomainMap[staff.specialization];
      if (coveredDomains && coveredDomains.includes(staff.assignedDomain)) {
        if (domainBonuses[staff.assignedDomain] !== undefined) {
          domainBonuses[staff.assignedDomain] += 5;
        }
      }
    }

    for (const staff of staffList) {
      if (!staff.assignedDomain) continue;
      if (staff.training && staff.training.daysRemaining > 0) continue;
      if (domainBonuses[staff.assignedDomain] === undefined) continue;
      if (staff.morale > 70) {
        domainBonuses[staff.assignedDomain] += 3;
      } else if (staff.morale < 30) {
        domainBonuses[staff.assignedDomain] -= 3;
      }
    }

    // Research effects
    const re = this.state.researchEffects ?? {};
    const waterQualityBonus = Math.min(re.waterQualityBonus ?? 0, 10);
    const irrigationBonus = Math.min(re.irrigationBonus ?? 0, 10);
    const noiseReduction = Math.min(re.noiseReduction ?? 0, 10);
    const drainageEfficiencyBonus = re.drainageEfficiencyBonus ?? 0;
    const coolingEfficiencyBonus = re.coolingEfficiencyBonus ?? 0;

    // Compute raw domain scores (global, before zone distribution)
    const rawScores = {};
    for (const [domain, efficiencies] of Object.entries(domains)) {
      if (efficiencies.length === 0) {
        rawScores[domain] = 50;
      } else {
        const avg = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
        const coverageBonus = Math.min(efficiencies.length / 4, 1) * 0.2;
        const baseScore = Math.floor(avg * (1 + coverageBonus) * 100);
        const cappedBonus = Math.min(domainBonuses[domain], 20);
        const cappedTierBonus = Math.min(tierBonuses[domain], 15);

        let researchBonus = 0;
        if (domain === 'water') researchBonus += waterQualityBonus;
        if (domain === 'drainage') researchBonus += irrigationBonus;
        if (domain === 'hvac') researchBonus += noiseReduction;

        let researchEffMult = 1.0;
        if (domain === 'drainage') researchEffMult += drainageEfficiencyBonus;
        if (domain === 'hvac') researchEffMult += coolingEfficiencyBonus;

        const raw = Math.floor(baseScore * researchEffMult) + (cappedBonus || 0) + Math.floor(cappedTierBonus || 0) + Math.floor(researchBonus || 0);
        rawScores[domain] = Math.min(100, Number.isFinite(raw) ? raw : 50);
      }
    }

    // Expansion bonuses (applied globally before zone distribution)
    const purchased = this.state.purchasedExpansions ?? [];
    if (purchased.some(p => p.key === 'groundskeeperGarden')) {
      rawScores.water = Math.min(100, (rawScores.water ?? 50) + 10);
    }
    if (purchased.some(p => p.key === 'luxuryAquariumWall')) {
      rawScores.water = Math.min(100, (rawScores.water ?? 50) + 5);
    }

    // --- Distribute raw scores to zones via protection mapping ---
    const zoneHealth = {};
    for (const zone of ALL_ZONES) {
      zoneHealth[zone] = {};
      for (const domain of domainKeys) {
        const protectedZones = DOMAIN_ZONE_PROTECTION[domain] ?? [];
        const isProtected = protectedZones.includes(zone);
        // Protected zones get full score; unprotected get 50% (ambient)
        zoneHealth[zone][domain] = isProtected
          ? rawScores[domain]
          : Math.floor((rawScores[domain] ?? 50) * 0.5);
      }
    }

    // Apply cross-domain interaction penalties per-zone
    for (const zone of ALL_ZONES) {
      const zh = zoneHealth[zone];
      if (zh.drainage < 30) zh.water = Math.max(0, zh.water - 5);
      if (zh.hvac < 30) zh.air = Math.max(0, zh.air - 5);

      // Electrical cascade amplifier per-zone
      if (zh.electrical !== undefined && zh.electrical < 30) {
        for (const key of domainKeys) {
          if (key !== 'electrical') zh[key] = Math.max(0, zh[key] - 5);
        }
      }

      // Pest escalation per-zone
      if (zh.pest !== undefined && zh.pest < 40) {
        const escalation = zh.pest < 20 ? 8 : 4;
        zh.pest = Math.max(0, zh.pest - escalation);
      }
    }

    // Aggregate scores use raw domain scores (before zone distribution).
    // Zone distribution only affects per-zone display; the global aggregate
    // reflects overall domain health regardless of how many zones it covers.
    const aggregateScores = {};
    for (const domain of domainKeys) {
      aggregateScores[domain] = rawScores[domain] ?? 50;
    }

    // Apply cross-domain penalties to aggregate (same rules as per-zone)
    if (aggregateScores.drainage < 30) aggregateScores.water = Math.max(0, aggregateScores.water - 5);
    if (aggregateScores.hvac < 30) aggregateScores.air = Math.max(0, aggregateScores.air - 5);
    if (aggregateScores.electrical !== undefined && aggregateScores.electrical < 30) {
      for (const key of domainKeys) {
        if (key !== 'electrical') aggregateScores[key] = Math.max(0, aggregateScores[key] - 5);
      }
    }
    if (aggregateScores.pest !== undefined && aggregateScores.pest < 40) {
      const escalation = aggregateScores.pest < 20 ? 8 : 4;
      aggregateScores.pest = Math.max(0, aggregateScores.pest - escalation);
    }

    return { zoneHealth, aggregateScores };
  }

  /** Look up the tier definition for an installed filter. */
  _getFilterTierDef(filter) {
    const system = this.state.config.filtrationSystems?.[filter.domain];
    const component = system?.components?.[filter.componentType];
    if (!component) return null;
    return component.tiers?.find(t => t.tier === filter.tier) ?? null;
  }

  _evaluateConsequences(scores) {
    const consequences = [];

    // --- NEGATIVE consequences (poor maintenance) ---

    // Air consequences
    if (scores.air < 25) {
      consequences.push({ id: 'thick_smog', domain: 'air', severity: 'critical', label: 'Thick Smog', description: 'Stadium air is hazardous' });
    } else if (scores.air < 50) {
      consequences.push({ id: 'haze', domain: 'air', severity: 'warning', label: 'Stadium Haze', description: 'Visible haze in stadium air' });
    }

    // Water consequences
    if (scores.water < 25) {
      consequences.push({ id: 'dead_grass', domain: 'water', severity: 'critical', label: 'Dead Grass', description: 'Field grass is brown and dying' });
      consequences.push({ id: 'contaminated_water', domain: 'water', severity: 'critical', label: 'Water Contamination', description: 'Brown water in all fixtures' });
    } else if (scores.water < 50) {
      consequences.push({ id: 'brown_grass', domain: 'water', severity: 'warning', label: 'Yellowing Grass', description: 'Field grass turning brown' });
      consequences.push({ id: 'rusty_water', domain: 'water', severity: 'warning', label: 'Rusty Pipes', description: 'Discolored water in restrooms' });
    }

    // HVAC consequences
    if (scores.hvac < 25) {
      consequences.push({ id: 'mold_severe', domain: 'hvac', severity: 'critical', label: 'Mold Outbreak', description: 'Mold spreading across stadium' });
      consequences.push({ id: 'equipment_overheat', domain: 'hvac', severity: 'critical', label: 'Equipment Overheating', description: 'Server room and electronics at risk' });
    } else if (scores.hvac < 50) {
      consequences.push({ id: 'moldy_baseballs', domain: 'hvac', severity: 'warning', label: 'Moldy Baseballs', description: 'High humidity causing mold on equipment' });
      consequences.push({ id: 'foggy_windows', domain: 'hvac', severity: 'warning', label: 'Foggy Windows', description: 'Condensation on luxury suite windows' });
    }

    // Drainage consequences
    if (scores.drainage < 25) {
      consequences.push({ id: 'flooding', domain: 'drainage', severity: 'critical', label: 'Flooding', description: 'Standing water flooding underground' });
      consequences.push({ id: 'sewage_risk', domain: 'drainage', severity: 'critical', label: 'Sewage Backup Risk', description: 'Browntide conditions developing' });
    } else if (scores.drainage < 50) {
      consequences.push({ id: 'puddles', domain: 'drainage', severity: 'warning', label: 'Field Puddles', description: 'Standing water on field after rain' });
      consequences.push({ id: 'muddy_infield', domain: 'drainage', severity: 'warning', label: 'Muddy Infield', description: 'Infield too muddy for play' });
    }

    // Electrical consequences
    if (scores.electrical !== undefined) {
      if (scores.electrical < 25) {
        consequences.push({ id: 'partial_blackout', domain: 'electrical', severity: 'critical', label: 'Partial Blackout', description: 'Major power failure across stadium zones' });
        consequences.push({ id: 'scoreboard_down', domain: 'electrical', severity: 'critical', label: 'Scoreboard Down', description: 'Fans can\'t follow the game' });
      } else if (scores.electrical < 55) {
        consequences.push({ id: 'flickering_lights', domain: 'electrical', severity: 'warning', label: 'Flickering Lights', description: 'Power fluctuations noticed by fans' });
      }
    }

    // Pest consequences
    if (scores.pest !== undefined) {
      if (scores.pest < 35) {
        consequences.push({ id: 'active_infestation', domain: 'pest', severity: 'critical', label: 'Active Infestation', description: 'Pests running wild through stadium' });
        consequences.push({ id: 'pest_on_camera', domain: 'pest', severity: 'critical', label: 'Pest on Camera', description: 'Live broadcast caught a rat — social media disaster' });
      } else if (scores.pest < 60) {
        consequences.push({ id: 'pest_sightings', domain: 'pest', severity: 'warning', label: 'Pest Sightings', description: 'Fans reporting rodent and insect sightings' });
      }
    }

    // --- POSITIVE bonuses (well-maintained systems, score > 80) ---

    if (scores.air > 80) {
      consequences.push({ id: 'clean_air', domain: 'air', severity: 'bonus', label: 'Clean Air', description: 'Fans love the fresh stadium air' });
    }

    if (scores.water > 80) {
      consequences.push({ id: 'lush_field', domain: 'water', severity: 'bonus', label: 'Lush Green Field', description: 'Pristine field conditions boost attendance' });
    }

    if (scores.hvac > 80) {
      consequences.push({ id: 'perfect_climate', domain: 'hvac', severity: 'bonus', label: 'Perfect Climate', description: 'Comfortable fans spend more at concessions' });
    }

    if (scores.drainage > 80) {
      consequences.push({ id: 'perfect_drainage', domain: 'drainage', severity: 'bonus', label: 'Perfect Drainage', description: 'Field always ready -- no rain delays' });
    }

    if (scores.electrical !== undefined && scores.electrical > 80) {
      consequences.push({ id: 'full_power', domain: 'electrical', severity: 'bonus', label: 'Full Power', description: 'Brilliant lighting and reliable broadcasts' });
    }

    if (scores.pest !== undefined && scores.pest > 80) {
      consequences.push({ id: 'pristine_venue', domain: 'pest', severity: 'bonus', label: 'Pristine Venue', description: 'Spotless sanitation boosts concessions' });
    }

    // Stadium of Excellence: all domains > 80
    const allDomainKeys = Object.keys(scores);
    const allAbove80 = allDomainKeys.every(k => scores[k] > 80);
    if (allAbove80 && allDomainKeys.length > 0) {
      consequences.push({ id: 'stadium_excellence', domain: 'all', severity: 'excellence', label: 'Stadium of Excellence', description: 'All systems running at peak performance' });
    }

    return consequences;
  }

  /**
   * Evaluate consequences per-zone using zone-specific health.
   * Returns { zone: [consequences] } for visual layers to render zone-appropriate effects.
   */
  _evaluateZoneConsequences(zoneHealth) {
    const result = {};
    for (const zone of ALL_ZONES) {
      const h = zoneHealth[zone];
      if (!h) { result[zone] = []; continue; }
      const cons = [];

      // Air
      if (h.air < 25) cons.push({ id: 'thick_smog', domain: 'air', severity: 'critical' });
      else if (h.air < 50) cons.push({ id: 'haze', domain: 'air', severity: 'warning' });
      else if (h.air > 80) cons.push({ id: 'clean_air', domain: 'air', severity: 'bonus' });

      // Water
      if (h.water < 25) cons.push({ id: 'dead_grass', domain: 'water', severity: 'critical' });
      else if (h.water < 50) cons.push({ id: 'brown_grass', domain: 'water', severity: 'warning' });
      else if (h.water > 80) cons.push({ id: 'lush_field', domain: 'water', severity: 'bonus' });

      // HVAC
      if (h.hvac < 25) cons.push({ id: 'mold_severe', domain: 'hvac', severity: 'critical' });
      else if (h.hvac < 50) cons.push({ id: 'moldy_baseballs', domain: 'hvac', severity: 'warning' });
      else if (h.hvac > 80) cons.push({ id: 'perfect_climate', domain: 'hvac', severity: 'bonus' });

      // Drainage
      if (h.drainage < 25) cons.push({ id: 'flooding', domain: 'drainage', severity: 'critical' });
      else if (h.drainage < 50) cons.push({ id: 'puddles', domain: 'drainage', severity: 'warning' });
      else if (h.drainage > 80) cons.push({ id: 'perfect_drainage', domain: 'drainage', severity: 'bonus' });

      // Electrical
      if (h.electrical !== undefined) {
        if (h.electrical < 25) cons.push({ id: 'partial_blackout', domain: 'electrical', severity: 'critical' });
        else if (h.electrical < 55) cons.push({ id: 'flickering_lights', domain: 'electrical', severity: 'warning' });
        else if (h.electrical > 80) cons.push({ id: 'full_power', domain: 'electrical', severity: 'bonus' });
      }

      // Pest
      if (h.pest !== undefined) {
        if (h.pest < 35) cons.push({ id: 'active_infestation', domain: 'pest', severity: 'critical' });
        else if (h.pest < 60) cons.push({ id: 'pest_sightings', domain: 'pest', severity: 'warning' });
        else if (h.pest > 80) cons.push({ id: 'pristine_venue', domain: 'pest', severity: 'bonus' });
      }

      result[zone] = cons;
    }
    return result;
  }

  _applyEffects(scores, consequences) {
    let revenueModifier = 1.0;
    let attendanceModifier = 1.0;
    let repDelta = 0;
    let teamPerf = 1.0;

    // Check which domains have crisisArmor passive active
    const armoredDomains = new Set();
    for (const filter of this.state.filters) {
      if (filter.domain && filter.maxCondition > 0 && (filter.condition / filter.maxCondition) > 0.5) {
        const tierDef = this._getFilterTierDef(filter);
        if (tierDef?.passive === 'crisisArmor') {
          armoredDomains.add(filter.domain);
        }
      }
    }

    // Research effects that reduce penalties
    const re = this.state.researchEffects ?? {};
    const waterDamageReduction = re.waterDamageReduction ?? 0;
    const moldRiskReduction = re.moldRiskReduction ?? 0;
    const odorReduction = re.odorReduction ?? 0;

    // Groundskeeper's Garden: 50% reduced drainage consequence penalties
    const hasGarden = (this.state.purchasedExpansions ?? []).some(p => p.key === 'groundskeeperGarden');

    // --- Penalty effects from negative consequences ---
    for (const c of consequences) {
      // crisisArmor halves reputation penalties for armored domains
      const armorMult = armoredDomains.has(c.domain) ? 0.5 : 1.0;

      // Groundskeeper's Garden: halve drainage penalties
      const gardenMult = (hasGarden && c.domain === 'drainage') ? 0.5 : 1.0;

      // Research-based penalty reduction per domain
      let researchPenaltyMult = 1.0;
      if (c.domain === 'water' && waterDamageReduction > 0) {
        researchPenaltyMult *= (1 - waterDamageReduction);
      }
      if (c.domain === 'hvac' && moldRiskReduction > 0) {
        researchPenaltyMult *= (1 - moldRiskReduction);
      }
      if (c.domain === 'drainage' && odorReduction > 0) {
        researchPenaltyMult *= (1 - odorReduction);
      }

      if (c.severity === 'critical') {
        revenueModifier -= 0.1 * researchPenaltyMult * gardenMult;
        attendanceModifier -= 0.08 * researchPenaltyMult * gardenMult;
        repDelta -= 0.5 * armorMult * researchPenaltyMult * gardenMult;
      } else if (c.severity === 'warning') {
        revenueModifier -= 0.03 * researchPenaltyMult * gardenMult;
        attendanceModifier -= 0.03 * researchPenaltyMult * gardenMult;
        repDelta -= 0.1 * armorMult * researchPenaltyMult * gardenMult;
      }
    }

    // --- Bonus effects from well-maintained systems ---
    // When all domains are excellent, apply only the excellence bonus
    // (stronger) and skip individual domain bonuses to avoid double-counting.
    const hasExcellence = consequences.some(c => c.severity === 'excellence');

    if (hasExcellence) {
      // Stadium of Excellence: single stronger bonus replaces individual ones
      attendanceModifier += 0.25; // +25% attendance
      repDelta += 3.0;
    } else {
      // Apply individual domain bonuses only when excellence is NOT active
      for (const c of consequences) {
        if (c.severity === 'bonus') {
          switch (c.id) {
            case 'clean_air':
              attendanceModifier += 0.10; // +10% attendance
              repDelta += 1.0;
              break;
            case 'lush_field':
              attendanceModifier += 0.05; // +5% attendance
              break;
            case 'perfect_climate':
              revenueModifier += 0.05; // +5% concession/revenue
              break;
            case 'perfect_drainage':
              // No rain delays -- bonus handled by team performance
              break;
            case 'full_power':
              revenueModifier += 0.03; // +3% rev from better broadcast lighting
              break;
            case 'pristine_venue':
              revenueModifier += 0.08; // +8% concession rev from pristine conditions
              break;
          }
        }
      }
    }

    // --- Team performance modifier ---
    // Good field conditions (water + drainage both > 80)
    if (scores.water > 80 && scores.drainage > 80) {
      teamPerf += 0.15;
    }
    // Bad field (water or drainage critical)
    if (scores.water < 25 || scores.drainage < 25) {
      teamPerf -= 0.2;
    }
    // Good air helps players breathe
    if (scores.air > 80) {
      teamPerf += 0.05;
    }
    // Hazardous air hurts player performance
    if (scores.air < 25) {
      teamPerf -= 0.1;
    }

    // Apply sabotage penalties (stored separately so they survive recalculation)
    revenueModifier *= (this.state._sabotageRevenueMod ?? 1.0);
    attendanceModifier *= (this.state._sabotageAttendanceMod ?? 1.0);
    teamPerf *= (this.state._sabotageTeamPerfMod ?? 1.0);

    // Clamp modifiers
    this.state.set('consequenceRevenueModifier', Math.max(0.5, Math.min(1.5, revenueModifier)));
    this.state.set('consequenceAttendanceModifier', Math.max(0.5, Math.min(1.5, attendanceModifier)));
    this.state.set('teamPerformanceModifier', Math.max(0.5, Math.min(1.5, teamPerf)));

    // Reputation drift is handled by ProgressionSystem — no direct mutation here.

    // Emit notifications (with cooldown to prevent spam)
    this._emitConsequenceNotifications(consequences);
  }

  _emitConsequenceNotifications(consequences) {
    const now = Date.now();
    const COOLDOWN = 60000; // 1 minute between same notification

    const messages = {
      // Negative
      thick_smog: { text: 'Air quality critical -- fans evacuating concourse!', type: 'danger' },
      haze: { text: 'Haze building in stadium -- check air filters!', type: 'warning' },
      dead_grass: { text: 'Field grass is dead -- water system failing!', type: 'danger' },
      brown_grass: { text: 'Grass turning brown -- water filtration needed!', type: 'warning' },
      contaminated_water: { text: 'Brown water in all fixtures -- critical!', type: 'danger' },
      rusty_water: { text: 'Rusty water reported in restrooms.', type: 'warning' },
      mold_severe: { text: 'Mold outbreak spreading across stadium!', type: 'danger' },
      moldy_baseballs: { text: 'Moldy baseballs found -- humidity too high!', type: 'warning' },
      foggy_windows: { text: 'Luxury suite windows fogging up.', type: 'warning' },
      equipment_overheat: { text: 'Server room overheating -- HVAC critical!', type: 'danger' },
      flooding: { text: 'Underground tunnels flooding!', type: 'danger' },
      sewage_risk: { text: 'Browntide conditions developing -- fix drainage NOW!', type: 'danger' },
      puddles: { text: 'Standing water on field after rain.', type: 'warning' },
      muddy_infield: { text: 'Infield too muddy -- game delay risk!', type: 'warning' },
      // Electrical
      partial_blackout: { text: 'Partial blackout! Stadium zones losing power!', type: 'danger' },
      scoreboard_down: { text: 'Scoreboard is dark -- fans can\'t follow the game!', type: 'danger' },
      flickering_lights: { text: 'Lights flickering -- check electrical systems!', type: 'warning' },
      // Pest
      active_infestation: { text: 'Active infestation! Pests overrunning stadium!', type: 'danger' },
      pest_on_camera: { text: 'PEST ON CAMERA! Social media nightmare!', type: 'danger' },
      pest_sightings: { text: 'Pest sightings reported -- check pest control!', type: 'warning' },
      // Positive
      clean_air: { text: 'Fans are raving about the fresh stadium air!', type: 'success' },
      lush_field: { text: 'The field looks pristine -- attendance is up!', type: 'success' },
      perfect_climate: { text: 'Perfect climate control -- concession sales booming!', type: 'success' },
      perfect_drainage: { text: 'Drainage running perfectly -- field always game-ready!', type: 'success' },
      stadium_excellence: { text: 'Stadium of Excellence! All systems at peak performance!', type: 'success' },
      full_power: { text: 'Full power! Brilliant lighting and crystal-clear broadcasts!', type: 'success' },
      pristine_venue: { text: 'Pristine venue! Concession revenue boosted by spotless conditions!', type: 'success' },
    };

    for (const c of consequences) {
      const msg = messages[c.id];
      if (!msg) continue;
      if (this._notifyCooldowns[c.id] && now - this._notifyCooldowns[c.id] < COOLDOWN) continue;
      this._notifyCooldowns[c.id] = now;
      this.eventBus.emit('ui:message', msg);
    }
  }

  _emitCascadeMessage(data) {
    const currentDay = this.state.gameDay ?? 0;
    const key = `${data.source}->${data.target}`;

    // Only show the same cascade message once per game day
    if (this._cascadeMsgDay[key] === currentDay) return;
    this._cascadeMsgDay[key] = currentDay;

    const cascadeMessages = {
      overPressureFlood: 'Water system failure is straining drainage!',
      coolingTowerFailure: 'Water system failure is shutting down cooling towers!',
      ductFailureReducesAirflow: 'HVAC breakdown is reducing air filtration!',
      condensationLoad: 'HVAC failure is adding condensation load to drainage!',
      backupContamination: 'Drainage backup is contaminating the water supply!',
      floodingAirQuality: 'Poor drainage is degrading air quality!',
      scrubberWaterDemand: 'Poor air quality is increasing water scrubber demand!',
      // Electrical cascades
      powerLossHVACShutdown: 'Power failure is shutting down HVAC systems!',
      pumpStationFailure: 'Power loss is causing water pump failures!',
      ventilationPowerLoss: 'Ventilation fans losing power — air quality dropping!',
      sumpPumpFailure: 'Sump pumps failing without power — drainage backing up!',
      // Pest cascades
      pestContaminationAir: 'Pest activity is contaminating air ducts!',
      pestContaminationWater: 'Pests have infiltrated the water system!',
      standingWaterBreeding: 'Standing water from drainage failure is breeding pests!',
      leakAttractionPests: 'Water leaks are attracting pests into the stadium!',
    };

    const text = cascadeMessages[data.effect];
    if (!text) return;

    this.eventBus.emit('ui:message', { text, type: 'warning' });
  }

  /**
   * Daily check for contracts nearing breach threshold.
   * If domain quality is within 5% of the breach threshold for 2+ consecutive days,
   * emit contract:breachWarning event.
   */
  _checkContractBreachRisk() {
    const activeContracts = this.state.activeContracts ?? [];
    if (activeContracts.length === 0) return;

    if (!this.state.contractBreachDays) this.state.contractBreachDays = {};
    const breachDays = this.state.contractBreachDays;
    const health = this.state.domainHealth ?? {};

    // Get average quality (0-1) for standard quality contracts
    const avgHealth = Object.values(health);
    const avgQuality = avgHealth.length > 0
      ? (avgHealth.reduce((a, b) => a + b, 0) / avgHealth.length) / 100
      : 0.5;

    for (const active of activeContracts) {
      const def = this._findContractDefForBreach(active.contractId);
      if (!def) continue;

      let currentQuality = 0;
      let requiredQuality = def.qualityReq ?? 0.50;
      let isNearBreach = false;

      if (def.contractType === 'attendance') {
        // Attendance-based: check attendance % vs requirement
        currentQuality = (this.state.attendancePercent ?? 0) / 100;
        requiredQuality = def.attendanceReq ?? 0.70;
        isNearBreach = currentQuality < requiredQuality + 0.05 && currentQuality >= requiredQuality - 0.05;
      } else if (def.contractType === 'multiDomain') {
        // Multi-domain: check how many domains are above threshold
        const threshold = (def.qualityReq ?? 0.75) * 100;
        const allDomains = Object.keys(this.state.config.filtrationSystems ?? { air: 1, water: 1, hvac: 1, drainage: 1 });
        const domainsAbove = allDomains.filter(d => (health[d] ?? 0) >= threshold).length;
        const domainsRequired = def.domainsRequired ?? 2;
        // Near breach: exactly at or 1 above the requirement with some domains borderline
        const borderlineDomains = allDomains.filter(d => {
          const h = health[d] ?? 0;
          return h >= threshold && h < threshold + 5;
        }).length;
        isNearBreach = domainsAbove <= domainsRequired && borderlineDomains > 0;
        currentQuality = domainsAbove / 4;
      } else {
        // Standard quality-based contract
        currentQuality = avgQuality;
        isNearBreach = currentQuality < requiredQuality + 0.05 && currentQuality >= requiredQuality - 0.05;
      }

      if (isNearBreach) {
        breachDays[active.contractId] = (breachDays[active.contractId] ?? 0) + 1;
      } else if (currentQuality >= requiredQuality + 0.05) {
        // Quality safely above threshold — reset counter
        breachDays[active.contractId] = 0;
      }

      // Emit warning if at risk for 2+ consecutive days
      if ((breachDays[active.contractId] ?? 0) >= 2) {
        this.eventBus.emit('contract:breachWarning', {
          contractId: active.contractId,
          sponsorName: def.name,
          domain: def.contractType === 'multiDomain' ? 'multi' : (def.contractType === 'attendance' ? 'attendance' : 'quality'),
          currentQuality: Math.round(currentQuality * 100),
          requiredQuality: Math.round(requiredQuality * 100),
          daysAtRisk: breachDays[active.contractId],
        });
      }
    }

    // Clean up breach day entries for contracts that no longer exist
    const activeIds = new Set(activeContracts.map(c => c.contractId));
    for (const key of Object.keys(breachDays)) {
      if (!activeIds.has(key)) delete breachDays[key];
    }
  }

  /**
   * Look up a contract definition by ID from the contract pool.
   * Minimal version that checks state for follow-up contracts and the known pool.
   */
  _findContractDefForBreach(contractId) {
    // Check follow-up contracts in state first
    const followUp = (this.state._followUpContracts ?? []).find(c => c.id === contractId);
    if (followUp) return followUp;
    // Check base contracts via a simple lookup — we read the definitions from state.activeContracts
    // but need the definition with qualityReq. The contract pool is defined in ContractPanel,
    // so we look for a _contractDefs cache on state (set by ContractPanel at init).
    if (this.state._contractDefsCache) {
      return this.state._contractDefsCache[contractId] ?? null;
    }
    return null;
  }

  /** Get score for a specific domain, optionally for a specific zone. */
  getDomainScore(domain, zone = null) {
    if (zone) {
      return this.state.zoneDomainHealth?.[zone]?.[domain] ?? this.state.domainHealth?.[domain] ?? 100;
    }
    return this.state.domainHealth?.[domain] ?? 100;
  }

  /** Check if a specific consequence is active. */
  hasConsequence(id) {
    return (this.state.activeConsequences ?? []).some(c => c.id === id);
  }

  /**
   * Estimate inspection grade based on current domain health averages.
   * Reuses the same grading thresholds as EventSystem._resolveInspection().
   */
  getEstimatedInspectionGrade() {
    const health = this.state.domainHealth ?? {};
    const values = Object.values(health);
    if (values.length === 0) return 'C';
    let avg = values.reduce((a, b) => a + b, 0) / values.length;

    // Compliance Office: +10 to inspection score before grade assignment
    if ((this.state.purchasedExpansions ?? []).some(p => p.key === 'complianceOffice')) {
      avg = Math.min(100, avg + 10);
    }

    // Normalize to 0-1 range (health is 0-100)
    const quality = avg / 100;
    if (quality >= 0.85) return 'A';
    if (quality >= 0.70) return 'B';
    if (quality >= 0.50) return 'C';
    if (quality >= 0.30) return 'D';
    return 'F';
  }
}
