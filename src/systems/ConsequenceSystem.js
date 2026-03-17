/**
 * ConsequenceSystem -- Maps filter/maintenance quality to realistic gameplay effects.
 *
 * Periodically scores each domain (air, water, hvac, drainage) based on
 * installed filter efficiency, then activates consequences (penalties for
 * poor maintenance) AND bonuses (rewards for well-maintained systems).
 * Affects attendance, revenue, reputation, and team performance.
 */

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

    // Listen for cross-system cascade events from FiltrationSystem
    this.eventBus.on('system:cascade', (data) => {
      const health = this.state.domainHealth ?? {};
      const current = health[data.target] ?? 100;
      const severityMap = { low: 1, medium: 2, high: 3 };
      const severityValue = severityMap[data.severity] ?? 1;
      const penalty = severityValue * 5;
      health[data.target] = Math.max(0, current - penalty);
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

    // Calculate domain health scores
    const scores = this._calculateDomainScores();

    // Store in state for visual/UI layers to read
    this.state.set('domainHealth', scores);

    // Determine active consequences (negative) and bonuses (positive)
    const consequences = this._evaluateConsequences(scores);
    this.state.set('activeConsequences', consequences);

    // Apply gameplay effects
    this._applyEffects(scores, consequences);

    // Emit domain:critical for any domain below 20%
    for (const [domain, score] of Object.entries(scores)) {
      if (score < 20) {
        this.eventBus.emit('domain:critical', { domain, score });
      }
    }

    // Emit for visual/notification layers
    this.eventBus.emit('consequence:update', { scores, consequences });
  }

  _calculateDomainScores() {
    const domains = { air: [], water: [], hvac: [], drainage: [] };
    const domainBonuses = { air: 0, water: 0, hvac: 0, drainage: 0 };
    const tierBonuses = { air: 0, water: 0, hvac: 0, drainage: 0 };
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

          // Tier-specific bonuses: qualityBonus (air/water), comfortBonus (hvac),
          // integrityBonus (drainage/water). Scaled so max T4 bonus (~55-60)
          // gives up to 15 domain health points. Makes higher-tier filters
          // meaningfully better for domain health, not just longer-lasting.
          const tierBonus = (tierDef?.qualityBonus ?? 0)
            + (tierDef?.comfortBonus ?? 0)
            + (tierDef?.integrityBonus ?? 0);
          tierBonuses[filter.domain] += (tierBonus / 60) * 15;

          // crossDomain passive: coolingSystem adds half its bonus to HVAC
          if (tierDef?.passive === 'crossDomain') {
            crossDomainHvacBonus += Math.floor(bonus / 2);
          }
        }
      }
    }

    // Apply crossDomain passive bonus to HVAC
    domainBonuses.hvac += crossDomainHvacBonus;

    // Staff specialization bonus: +5 domain health when a specialist is assigned
    const specDomainMap = {
      airTech: ['air', 'hvac'], plumber: ['water', 'drainage'],
      electrician: ['hvac'], general: ['air', 'water', 'hvac', 'drainage'],
    };
    const staffList = this.state.staffList ?? [];
    for (const staff of staffList) {
      if (!staff.specialization || !staff.assignedDomain) continue;
      // Skip staff in training — they don't contribute
      if (staff.training && staff.training.daysRemaining > 0) continue;
      const coveredDomains = specDomainMap[staff.specialization];
      if (coveredDomains && coveredDomains.includes(staff.assignedDomain)) {
        if (domainBonuses[staff.assignedDomain] !== undefined) {
          domainBonuses[staff.assignedDomain] += 5;
        }
      }
    }

    // Morale tier bonus/penalty: high morale (>70) staff add +3 domain health,
    // low morale (<30) staff subtract -3 domain health for their assigned domain.
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

    // Research effects that modify domain health scores
    const re = this.state.researchEffects ?? {};
    const waterQualityBonus = Math.min(re.waterQualityBonus ?? 0, 10);
    const irrigationBonus = Math.min(re.irrigationBonus ?? 0, 10);
    const noiseReduction = Math.min(re.noiseReduction ?? 0, 10);
    const drainageEfficiencyBonus = re.drainageEfficiencyBonus ?? 0;
    const coolingEfficiencyBonus = re.coolingEfficiencyBonus ?? 0;

    const scores = {};
    for (const [domain, efficiencies] of Object.entries(domains)) {
      if (efficiencies.length === 0) {
        // No filters installed in this domain yet — use a neutral baseline
        // so the player isn't penalized before they can install anything.
        scores[domain] = 50;
      } else {
        // Average efficiency * 100, with multiplicative bonus for coverage.
        // Coverage scales up to +20% for having 4+ filters in a domain.
        const avg = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
        const coverageBonus = Math.min(efficiencies.length / 4, 1) * 0.2; // 0 to 0.2
        const baseScore = Math.floor(avg * (1 + coverageBonus) * 100);
        // Add capped domainHealthBonus (max 20 points)
        const cappedBonus = Math.min(domainBonuses[domain], 20);
        // Add capped tier bonus (max 15 points)
        const cappedTierBonus = Math.min(tierBonuses[domain], 15);

        // Research flat bonuses per domain (capped at 10 each)
        let researchBonus = 0;
        if (domain === 'water') researchBonus += waterQualityBonus;
        if (domain === 'drainage') researchBonus += irrigationBonus;
        if (domain === 'hvac') researchBonus += noiseReduction;

        // Research efficiency bonuses (percentage multiplier on base score)
        let researchEffMult = 1.0;
        if (domain === 'drainage') researchEffMult += drainageEfficiencyBonus;
        if (domain === 'hvac') researchEffMult += coolingEfficiencyBonus;

        scores[domain] = Math.min(100, Math.floor(baseScore * researchEffMult) + cappedBonus + Math.floor(cappedTierBonus) + Math.floor(researchBonus));
      }
    }

    // Cross-domain interaction penalties: neglecting one domain drags related domains down
    // Drainage failure contaminates water supply; HVAC failure worsens air quality
    if (scores.drainage < 30) {
      scores.water = Math.max(0, scores.water - 5);
    }
    if (scores.hvac < 30) {
      scores.air = Math.max(0, scores.air - 5);
    }

    return scores;
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

    // Stadium of Excellence: all domains > 80
    if (scores.air > 80 && scores.water > 80 && scores.hvac > 80 && scores.drainage > 80) {
      consequences.push({ id: 'stadium_excellence', domain: 'all', severity: 'excellence', label: 'Stadium of Excellence', description: 'All systems running at peak performance' });
    }

    return consequences;
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

    // --- Penalty effects from negative consequences ---
    for (const c of consequences) {
      // crisisArmor halves reputation penalties for armored domains
      const armorMult = armoredDomains.has(c.domain) ? 0.5 : 1.0;

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
        revenueModifier -= 0.1 * researchPenaltyMult;
        attendanceModifier -= 0.08 * researchPenaltyMult;
        repDelta -= 0.5 * armorMult * researchPenaltyMult;
      } else if (c.severity === 'warning') {
        revenueModifier -= 0.03 * researchPenaltyMult;
        attendanceModifier -= 0.03 * researchPenaltyMult;
        repDelta -= 0.1 * armorMult * researchPenaltyMult;
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
      // Positive
      clean_air: { text: 'Fans are raving about the fresh stadium air!', type: 'success' },
      lush_field: { text: 'The field looks pristine -- attendance is up!', type: 'success' },
      perfect_climate: { text: 'Perfect climate control -- concession sales booming!', type: 'success' },
      perfect_drainage: { text: 'Drainage running perfectly -- field always game-ready!', type: 'success' },
      stadium_excellence: { text: 'Stadium of Excellence! All systems at peak performance!', type: 'success' },
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
    };

    const text = cascadeMessages[data.effect];
    if (!text) return;

    this.eventBus.emit('ui:message', { text, type: 'warning' });
  }

  /** Get score for a specific domain (used by visual layers). */
  getDomainScore(domain) {
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
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    // Normalize to 0-1 range (health is 0-100)
    const quality = avg / 100;
    if (quality >= 0.85) return 'A';
    if (quality >= 0.70) return 'B';
    if (quality >= 0.50) return 'C';
    if (quality >= 0.30) return 'D';
    return 'F';
  }
}
