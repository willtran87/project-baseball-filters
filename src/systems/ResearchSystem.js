/**
 * ResearchSystem -- Manages the research lab and tech tree progression.
 *
 * The lab unlocks at Double-A tier (rep 56+). Players research one node
 * at a time, counting down in game-days. On completion, effects are
 * applied to gameConfig values and relevant state.
 *
 * State tracked via state.researchProgress:
 *   { completedNodes: string[], activeResearch: { nodeId, daysRemaining } | null }
 */

import { TECH_TREE } from '../data/techTreeData.js';

const LAB_UNLOCK_REP = 56; // Double-A tier

export class ResearchSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;

    // Initialize research state if empty
    if (!this.state.researchProgress || typeof this.state.researchProgress !== 'object') {
      this.state.researchProgress = {};
    }
    if (!this.state.researchProgress.completedNodes) {
      this.state.researchProgress.completedNodes = [];
    }
    if (!this.state.researchProgress.activeResearch) {
      this.state.researchProgress.activeResearch = null;
    }

    // Initialize researchEffects accumulator for other systems to read
    if (!this.state.researchEffects) {
      this.state.researchEffects = {};
    }

    // Snapshot the original (pre-research) config values so we can
    // re-derive the current config idempotently on every load.
    // Only snapshot once — the very first construction stores the
    // pristine values; subsequent loads reuse the stored snapshot.
    if (!this.state._originalConfig) {
      this.state._originalConfig = this._snapshotConfig();
    }

    // Re-apply all completed research on top of the original snapshot.
    // This makes save/load idempotent — config is always rebuilt from
    // originals + completed research, never stacked on mutated values.
    this._reapplyAllCompletedResearch();

    this.eventBus.on('game:newDay', () => this._onNewDay());
    this.eventBus.on('research:start', (data) => this._startResearch(data.nodeId));
    this.eventBus.on('research:cancel', () => this._cancelResearch());

    // Re-apply research effects after save/load since completedNodes may have changed
    this.eventBus.on('state:loaded', () => {
      // Ensure researchProgress has proper structure
      if (!this.state.researchProgress || typeof this.state.researchProgress !== 'object') {
        this.state.researchProgress = {};
      }
      if (!this.state.researchProgress.completedNodes) {
        this.state.researchProgress.completedNodes = [];
      }
      if (!this.state.researchProgress.activeResearch) {
        this.state.researchProgress.activeResearch = null;
      }
      this._reapplyAllCompletedResearch();
    });
  }

  update(dt) {
    // Research progress is day-based, handled in _onNewDay
  }

  // -- Lab availability -------------------------------------------------

  isLabUnlocked() {
    return this.state.reputation >= LAB_UNLOCK_REP;
  }

  // -- Day tick ---------------------------------------------------------

  _onNewDay() {
    if (!this.isLabUnlocked()) return;

    const progress = this.state.researchProgress;
    const active = progress.activeResearch;
    if (!active) return;

    active.daysRemaining--;

    if (active.daysRemaining <= 0) {
      this._completeResearch(active.nodeId);
    } else {
      // Emit progress update
      this.eventBus.emit('research:progress', {
        nodeId: active.nodeId,
        daysRemaining: active.daysRemaining,
      });
    }
  }

  // -- Start research ---------------------------------------------------

  _startResearch(nodeId) {
    if (!this.isLabUnlocked()) {
      this.eventBus.emit('ui:message', {
        text: 'Research lab not yet unlocked. Reach Double-A tier (rep 56+).',
        type: 'warning',
      });
      return;
    }

    const progress = this.state.researchProgress;

    // Already researching something
    if (progress.activeResearch) {
      this.eventBus.emit('ui:message', {
        text: 'Already researching. Complete or cancel current research first.',
        type: 'warning',
      });
      return;
    }

    // Already completed
    if (progress.completedNodes.includes(nodeId)) {
      return;
    }

    const node = this._findNode(nodeId);
    if (!node) return;

    // Check prerequisites
    for (const prereq of node.prerequisites) {
      if (!progress.completedNodes.includes(prereq)) {
        this.eventBus.emit('ui:message', {
          text: `Prerequisites not met for ${node.name}.`,
          type: 'warning',
        });
        return;
      }
    }

    // Check funds
    if (this.state.money < node.cost) {
      this.eventBus.emit('ui:message', {
        text: `Not enough funds. Need $${node.cost.toLocaleString()}.`,
        type: 'warning',
      });
      return;
    }

    // Deduct cost and start
    this.state.set('money', this.state.money - node.cost);
    progress.activeResearch = {
      nodeId: node.id,
      daysRemaining: node.researchDays,
      totalDays: node.researchDays,
    };

    this.eventBus.emit('research:started', {
      nodeId: node.id,
      name: node.name,
      daysRemaining: node.researchDays,
    });
    this.eventBus.emit('ui:message', {
      text: `Research started: ${node.name} (${node.researchDays} days)`,
      type: 'info',
    });
  }

  // -- Cancel research --------------------------------------------------

  _cancelResearch() {
    const progress = this.state.researchProgress;
    if (!progress.activeResearch) return;

    const node = this._findNode(progress.activeResearch.nodeId);
    // Refund 50% of cost
    if (node) {
      const refund = Math.floor(node.cost * 0.5);
      this.state.set('money', this.state.money + refund);
      this.eventBus.emit('ui:message', {
        text: `Research cancelled. Refunded $${refund.toLocaleString()}.`,
        type: 'info',
      });
    }

    progress.activeResearch = null;
    this.eventBus.emit('research:cancelled', {});
  }

  // -- Complete research ------------------------------------------------

  _completeResearch(nodeId) {
    const progress = this.state.researchProgress;
    const node = this._findNode(nodeId);
    if (!node) return;

    progress.completedNodes.push(nodeId);
    progress.activeResearch = null;

    // Rebuild config from original snapshot + all completed research.
    // This is idempotent — avoids stacking on already-mutated values.
    this._reapplyAllCompletedResearch();

    this.eventBus.emit('research:complete', {
      nodeId: node.id,
      name: node.name,
      track: node.track,
      effects: node.effects,
    });
    this.eventBus.emit('ui:message', {
      text: `Research complete: ${node.name}!`,
      type: 'success',
    });
  }

  // -- Config snapshot & idempotent reapply ------------------------------

  /** Deep-clone the config values that research effects can mutate. */
  _snapshotConfig() {
    const config = this.state.config;
    return {
      economy: {
        energyCostBase: config.economy?.energyCostBase,
        staffWagePerDay: config.economy?.staffWagePerDay,
        emergencyRepairMultiplier: config.economy?.emergencyRepairMultiplier,
      },
      staff: {
        repairSpeedPerStaff: config.staff?.repairSpeedPerStaff,
      },
      // Deep-clone filtrationSystems tier-level values (lifespan, energy, bonuses)
      filtrationSystems: this._cloneFiltrationTiers(config.filtrationSystems),
    };
  }

  /** Clone only the mutable tier fields from filtrationSystems. */
  _cloneFiltrationTiers(systems) {
    if (!systems) return {};
    const clone = {};
    for (const [domainKey, domain] of Object.entries(systems)) {
      clone[domainKey] = {};
      for (const [compKey, comp] of Object.entries(domain.components ?? {})) {
        clone[domainKey][compKey] = (comp.tiers ?? []).map(t => ({
          lifespanGames: t.lifespanGames,
          energyPerDay: t.energyPerDay,
          comfortBonus: t.comfortBonus,
          qualityBonus: t.qualityBonus,
          integrityBonus: t.integrityBonus,
          domainHealthBonus: t.domainHealthBonus,
          passive: t.passive,
        }));
      }
    }
    return clone;
  }

  /** Reset config to original snapshot, re-apply every completed node, then cap lifespans. */
  _reapplyAllCompletedResearch() {
    this._resetConfigToOriginal();
    // Reset accumulated runtime effects before re-summing
    this.state.researchEffects = {};
    const completed = this.state.researchProgress.completedNodes ?? [];
    for (const nodeId of completed) {
      const node = this._findNode(nodeId);
      if (node) this._applyEffects(node);
    }
    this._capLifespanValues();
  }

  /** Restore config values to the original snapshot. */
  _resetConfigToOriginal() {
    const orig = this.state._originalConfig;
    if (!orig) return;
    const config = this.state.config;

    // Economy scalars
    if (config.economy) {
      if (orig.economy.energyCostBase != null) config.economy.energyCostBase = orig.economy.energyCostBase;
      if (orig.economy.staffWagePerDay != null) config.economy.staffWagePerDay = orig.economy.staffWagePerDay;
      if (orig.economy.emergencyRepairMultiplier != null) config.economy.emergencyRepairMultiplier = orig.economy.emergencyRepairMultiplier;
    }

    // Staff scalars
    if (config.staff && orig.staff.repairSpeedPerStaff != null) {
      config.staff.repairSpeedPerStaff = orig.staff.repairSpeedPerStaff;
    }

    // Filtration tier values
    for (const [domainKey, comps] of Object.entries(orig.filtrationSystems ?? {})) {
      for (const [compKey, tiers] of Object.entries(comps)) {
        const liveTiers = config.filtrationSystems?.[domainKey]?.components?.[compKey]?.tiers;
        if (!liveTiers) continue;
        for (let i = 0; i < tiers.length && i < liveTiers.length; i++) {
          if (tiers[i].lifespanGames != null) liveTiers[i].lifespanGames = tiers[i].lifespanGames;
          if (tiers[i].energyPerDay != null) liveTiers[i].energyPerDay = tiers[i].energyPerDay;
          if (tiers[i].comfortBonus != null) liveTiers[i].comfortBonus = tiers[i].comfortBonus;
          if (tiers[i].qualityBonus != null) liveTiers[i].qualityBonus = tiers[i].qualityBonus;
          if (tiers[i].integrityBonus != null) liveTiers[i].integrityBonus = tiers[i].integrityBonus;
          if (tiers[i].domainHealthBonus != null) liveTiers[i].domainHealthBonus = tiers[i].domainHealthBonus;
          if (tiers[i].passive !== undefined) liveTiers[i].passive = tiers[i].passive;
        }
      }
    }
  }

  /** Cap lifespan values at 3x their original to prevent unbounded stacking. */
  _capLifespanValues() {
    const orig = this.state._originalConfig;
    if (!orig) return;
    const config = this.state.config;

    for (const [domainKey, comps] of Object.entries(orig.filtrationSystems ?? {})) {
      for (const [compKey, tiers] of Object.entries(comps)) {
        const liveTiers = config.filtrationSystems?.[domainKey]?.components?.[compKey]?.tiers;
        if (!liveTiers) continue;
        for (let i = 0; i < tiers.length && i < liveTiers.length; i++) {
          if (tiers[i].lifespanGames != null && liveTiers[i].lifespanGames != null) {
            liveTiers[i].lifespanGames = Math.min(liveTiers[i].lifespanGames, tiers[i].lifespanGames * 3);
          }
        }
      }
    }
  }

  _applyEffects(node) {
    const fx = node.effects;
    if (!fx) return;

    const config = this.state.config;
    const economy = config.economy ?? {};

    // Energy cost reduction (cumulative)
    if (fx.energyCostReduction) {
      const current = economy.energyCostBase ?? 100;
      economy.energyCostBase = Math.floor(current * (1 - fx.energyCostReduction));
    }

    // Energy cost increase (experimental nodes)
    if (fx.energyCostIncrease) {
      const current = economy.energyCostBase ?? 100;
      economy.energyCostBase = Math.floor(current * (1 + fx.energyCostIncrease));
    }

    // Operating cost reduction
    if (fx.operatingCostReduction) {
      const wage = economy.staffWagePerDay ?? 150;
      economy.staffWagePerDay = Math.floor(wage * (1 - fx.operatingCostReduction));
    }

    // Maintenance cost reduction
    if (fx.maintenanceCostReduction) {
      const mult = economy.emergencyRepairMultiplier ?? 2.5;
      economy.emergencyRepairMultiplier = mult * (1 - fx.maintenanceCostReduction);
    }

    // Water cost reduction
    if (fx.waterCostReduction) {
      // Reduce water system energy costs as proxy
      const waterSys = config.filtrationSystems?.water;
      if (waterSys) {
        for (const comp of Object.values(waterSys.components ?? {})) {
          for (const tier of (comp.tiers ?? [])) {
            tier.energyPerDay = Math.floor(tier.energyPerDay * (1 - fx.waterCostReduction));
          }
        }
      }
    }

    // Motor/component lifespan bonus
    if (fx.motorLifespanBonus || fx.componentLifespanBonus) {
      const bonus = fx.motorLifespanBonus ?? fx.componentLifespanBonus ?? 0;
      for (const domain of Object.values(config.filtrationSystems ?? {})) {
        for (const comp of Object.values(domain.components ?? {})) {
          for (const tier of (comp.tiers ?? [])) {
            if (tier.lifespanGames) {
              tier.lifespanGames = Math.floor(tier.lifespanGames * (1 + bonus));
            }
          }
        }
      }
    }

    // Comfort bonus (add to HVAC quality)
    if (fx.comfortBonus) {
      const hvac = config.filtrationSystems?.hvac;
      if (hvac) {
        for (const comp of Object.values(hvac.components ?? {})) {
          for (const tier of (comp.tiers ?? [])) {
            if (tier.comfortBonus != null) {
              tier.comfortBonus += fx.comfortBonus;
            }
          }
        }
      }
    }

    // Air quality bonus
    if (fx.airQualityBonus) {
      const air = config.filtrationSystems?.air;
      if (air) {
        for (const comp of Object.values(air.components ?? {})) {
          for (const tier of (comp.tiers ?? [])) {
            if (tier.qualityBonus != null) {
              tier.qualityBonus += fx.airQualityBonus;
            }
          }
        }
      }
    }

    // All systems bonus
    if (fx.allSystemsBonus) {
      for (const domain of Object.values(config.filtrationSystems ?? {})) {
        for (const comp of Object.values(domain.components ?? {})) {
          for (const tier of (comp.tiers ?? [])) {
            if (tier.qualityBonus != null) tier.qualityBonus += fx.allSystemsBonus;
            if (tier.comfortBonus != null) tier.comfortBonus += fx.allSystemsBonus;
            if (tier.integrityBonus != null) tier.integrityBonus += fx.allSystemsBonus;
          }
        }
      }
    }

    // Staff efficiency bonus
    if (fx.staffEfficiencyBonus) {
      const staff = config.staff ?? {};
      staff.repairSpeedPerStaff = (staff.repairSpeedPerStaff ?? 1.0) * (1 + fx.staffEfficiencyBonus);
    }

    // Store flags on state for systems that check them
    const flags = this.state.storyFlags ?? (this.state.storyFlags = {});
    if (fx.revealEnergyWaste) flags.revealEnergyWaste = true;
    if (fx.autoScheduleRepairs) flags.autoScheduleRepairs = true;
    if (fx.autoResponseToEvents) flags.autoResponseToEvents = true;

    // Accumulate runtime effects into state.researchEffects for other systems to consume.
    // Numeric values are summed across all completed nodes; booleans are OR'd.
    const re = this.state.researchEffects;
    const runtimeKeys = [
      'weatherResponseBonus', 'airQualityWarningTime', 'leakDetectionChance',
      'equipmentFailureWarning', 'criticalFailureReduction', 'waterDamageReduction',
      'waterQualityBonus', 'irrigationBonus', 'pathogenReduction', 'moldRiskReduction',
      'odorReduction', 'noiseReduction', 'peakDemandReduction', 'hotWaterCostReduction',
      'inspectionBonus', 'earlyWarningBonus', 'airQualityAccuracy',
      'drainageEfficiencyBonus', 'coolingEfficiencyBonus',
      'riskOfMalfunction', 'riskOfAIQuirks', 'regulatoryRisk',
    ];
    for (const key of runtimeKeys) {
      if (fx[key] != null) {
        re[key] = (re[key] ?? 0) + fx[key];
      }
    }
  }

  // -- Node lookup ------------------------------------------------------

  _findNode(nodeId) {
    for (const track of Object.values(TECH_TREE)) {
      for (const node of (track.nodes ?? [])) {
        if (node.id === nodeId) return node;
      }
    }
    return null;
  }

  // -- Public getters ---------------------------------------------------

  getCompletedNodes() {
    return this.state.researchProgress?.completedNodes ?? [];
  }

  getActiveResearch() {
    return this.state.researchProgress?.activeResearch ?? null;
  }

  /** Get node status: 'completed', 'researching', 'available', 'locked' */
  getNodeStatus(nodeId) {
    const progress = this.state.researchProgress;
    if (progress.completedNodes?.includes(nodeId)) return 'completed';
    if (progress.activeResearch?.nodeId === nodeId) return 'researching';

    const node = this._findNode(nodeId);
    if (!node) return 'locked';

    const allPrereqsMet = node.prerequisites.every(
      p => progress.completedNodes?.includes(p)
    );
    return allPrereqsMet ? 'available' : 'locked';
  }
}

export { TECH_TREE };
