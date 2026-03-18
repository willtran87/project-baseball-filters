/**
 * SchemesSystem -- Manages Sully's counter-sabotage operations against Victor.
 *
 * Listens for scheme launches, resolves outcomes on the next game day,
 * and applies success/failure effects to game state.
 */

import { SCHEME_DATA, SCHEME_CONSTANTS, calculateSchemeModifiers } from '../data/schemeData.js';
import { NPC_DATA } from '../data/storyData.js';

export class SchemesSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;

    this.eventBus.on('game:newDay', (data) => this._onNewDay(data));
    this.eventBus.on('scheme:launch', (data) => this._launchScheme(data));
    this.eventBus.on('state:loaded', () => this._onStateLoaded());
  }

  update(/* dt */) {
    // Scheme resolution is day-based, not tick-based
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Check if Sully is available for a new scheme.
   */
  isAvailable() {
    const ss = this.state.schemeState;
    const day = this.state.gameDay ?? 1;

    // Sully not unlocked
    if (!this.state.storyFlags?.sullyUnlocked) return false;

    // Sully caught
    if (ss.sullyCaughtUntil > day) return false;

    // Active scheme pending resolution
    if (ss.activeScheme) return false;

    // Global cooldown
    if (ss.globalCooldownUntil > day) return false;

    // Season cap
    if (ss.schemesThisSeason >= SCHEME_CONSTANTS.seasonCap) return false;

    return true;
  }

  /**
   * Get schemes available to the player based on relationship tier and cooldowns.
   */
  getAvailableSchemes() {
    const rel = this.state.npcRelationships?.sully ?? 0;
    const day = this.state.gameDay ?? 1;
    const ss = this.state.schemeState;

    return SCHEME_DATA.filter(scheme => {
      // Tier check
      if (scheme.tier === 1 && rel < 12) return false;
      if (scheme.tier === 2 && rel < 30) return false;
      if (scheme.tier === 3 && rel < 50) return false;

      // Grand Slam schemes require grandSlam bonus
      if (scheme.tier === 3 && !this.state.storyFlags?.grandSlam) return false;

      return true;
    }).map(scheme => {
      const cooldownUntil = (ss.schemeCooldowns[scheme.id] ?? 0) + SCHEME_CONSTANTS.perSchemeCooldownDays;
      const onCooldown = cooldownUntil > day;
      const successRate = this._calculateSuccessRate(scheme);

      return {
        ...scheme,
        onCooldown,
        cooldownDaysLeft: onCooldown ? cooldownUntil - day : 0,
        effectiveSuccessRate: successRate,
        canLaunch: this.isAvailable() && !onCooldown && this.state.money >= scheme.cost,
      };
    });
  }

  // ── Scheme Lifecycle ────────────────────────────────────────────────────

  /**
   * Launch a scheme. Validates, deducts cost, sets active scheme.
   */
  _launchScheme({ schemeId }) {
    const scheme = SCHEME_DATA.find(s => s.id === schemeId);
    if (!scheme) return;

    if (!this.isAvailable()) {
      this.eventBus.emit('ui:message', { text: 'Sully is unavailable right now.', type: 'warning' });
      return;
    }

    const day = this.state.gameDay ?? 1;
    const ss = this.state.schemeState;

    // Per-scheme cooldown check
    const cooldownUntil = (ss.schemeCooldowns[schemeId] ?? 0) + SCHEME_CONSTANTS.perSchemeCooldownDays;
    if (cooldownUntil > day) {
      this.eventBus.emit('ui:message', { text: `That scheme is on cooldown for ${cooldownUntil - day} more day(s).`, type: 'warning' });
      return;
    }

    // Cost check
    if (this.state.money < scheme.cost) {
      this.eventBus.emit('ui:message', { text: `Not enough money. Need $${scheme.cost}.`, type: 'warning' });
      return;
    }

    // Deduct cost
    this.state.set('money', this.state.money - scheme.cost);

    // Set active scheme
    ss.activeScheme = { schemeId, launchedDay: day };

    // Emit flavor intro as Sully dialogue
    const sully = NPC_DATA.sully;
    this.eventBus.emit('ui:message', {
      text: `Sully: ${scheme.flavorIntro}`,
      type: 'info',
      color: sully?.themeColor,
    });

    this.eventBus.emit('scheme:launched', { schemeId, cost: scheme.cost });
  }

  /**
   * Resolve active scheme on new day and tick expiring buffs.
   */
  _onNewDay(/* data */) {
    const ss = this.state.schemeState;
    const day = this.state.gameDay ?? 1;

    // Reset season cap when season changes
    if (this.state.season !== ss.lastSeason) {
      ss.schemesThisSeason = 0;
      ss.lastSeason = this.state.season;
    }

    // Resolve active scheme
    if (ss.activeScheme) {
      this._resolveScheme(ss.activeScheme);
      ss.activeScheme = null;
    }

    // Tick expiring buffs
    this._tickExpiringBuffs(day);
  }

  /**
   * Resolve scheme outcome: roll success/fail, apply effects, emit dialogue.
   */
  _resolveScheme(active) {
    const scheme = SCHEME_DATA.find(s => s.id === active.schemeId);
    if (!scheme) return;

    const ss = this.state.schemeState;
    const day = this.state.gameDay ?? 1;
    const successRate = this._calculateSuccessRate(scheme);
    const roll = Math.random();
    const success = roll < successRate;

    // Record history
    ss.schemeHistory.push({ schemeId: scheme.id, day, success });
    if (ss.schemeHistory.length > 10) ss.schemeHistory.shift();

    // Update cooldowns
    ss.schemeCooldowns[scheme.id] = day;
    ss.globalCooldownUntil = day + SCHEME_CONSTANTS.globalCooldownDays;
    ss.schemesThisSeason++;

    // Pick flavor text
    const flavorArr = success ? scheme.successFlavor : scheme.failFlavor;
    const flavor = flavorArr[Math.floor(Math.random() * flavorArr.length)];

    const sully = NPC_DATA.sully;
    const msgType = success ? 'success' : 'danger';

    this.eventBus.emit('ui:message', {
      text: `Sully: ${flavor}`,
      type: msgType,
      color: sully?.themeColor,
    });

    // Apply effects
    if (success) {
      this._applySchemeSuccess(scheme);
    } else {
      this._applySchemeFailure(scheme);
    }

    this.eventBus.emit('scheme:resolved', {
      schemeId: scheme.id,
      success,
      flavor,
    });
  }

  // ── Effect Application ──────────────────────────────────────────────────

  _applySchemeSuccess(scheme) {
    const effect = scheme.successEffect;
    this._applyEffect(effect);
  }

  _applySchemeFailure(scheme) {
    const effect = scheme.failEffect;

    // sullyInsurance: halve fail effects
    const hasInsurance = this.state.storyFlags?.sullyInsurance;

    this._applyEffect(effect, hasInsurance);
  }

  _applyEffect(effect, halved = false) {
    if (!effect) return;
    const ss = this.state.schemeState;
    const day = this.state.gameDay ?? 1;
    const scale = halved ? 0.5 : 1.0;

    switch (effect.type) {
      case 'rivalRepDrain': {
        const amount = Math.round((effect.amount ?? 3) * scale);
        const days = effect.days ?? 3;
        // Apply immediate rival rep reduction
        this.state.set('rivalRep', Math.max(10, (this.state.rivalRep ?? 60) - amount));
        // Store drain for ticking
        ss._rivalDrainDays = days;
        ss._rivalDrainAmount = amount;
        break;
      }
      case 'reputation': {
        const amount = Math.round((effect.amount ?? 0) * scale);
        if (amount !== 0) {
          this.state.set('reputation', Math.max(0, Math.min(100, this.state.reputation + amount)));
          this.eventBus.emit('reputation:changed', { amount, reason: 'Sully\'s scheme' });
        }
        break;
      }
      case 'money': {
        // money loss (already paid at launch, this is additional penalty which only occurs on fail with amount 0)
        break;
      }
      case 'blockNextSabotage': {
        ss.blockNextSabotage = true;
        break;
      }
      case 'sullyCaught': {
        const days = Math.round((effect.days ?? 3) * scale);
        ss.sullyCaughtUntil = day + Math.max(1, days);
        break;
      }
      case 'filterCostIncrease': {
        const days = Math.round((effect.days ?? 2) * scale);
        this.state._supplyCostDays = Math.max(this.state._supplyCostDays ?? 0, Math.max(1, days));
        this.state._supplyCostMultiplier = Math.max(this.state._supplyCostMultiplier ?? 1.0, effect.multiplier ?? 1.10);
        break;
      }
      case 'clearSupplyDisruption': {
        this.state._supplyCostDays = 0;
        this.state._supplyCostMultiplier = 1.0;
        break;
      }
      case 'sabotageChanceReduction': {
        ss.sabotageChanceMultiplier = effect.multiplier ?? 0.5;
        ss.sabotageMultiplierUntil = day + (effect.days ?? 7);
        break;
      }
      case 'triggerSabotage': {
        this.eventBus.emit('scheme:triggerSabotage');
        break;
      }
      case 'domainHealthBoost': {
        const amount = Math.round((effect.amount ?? 5) * scale);
        const health = this.state.domainHealth;
        if (health) {
          for (const key of Object.keys(health)) {
            health[key] = Math.min(100, (health[key] ?? 100) + amount);
          }
        }
        break;
      }
      case 'domainHealthDrain': {
        const amount = Math.round((effect.amount ?? 3) * scale);
        const health = this.state.domainHealth;
        if (health) {
          // Pick a random domain
          const keys = Object.keys(health);
          const key = keys[Math.floor(Math.random() * keys.length)];
          health[key] = Math.max(0, (health[key] ?? 100) - amount);
        }
        break;
      }
      case 'rivalRepBoost': {
        const amount = Math.round((effect.amount ?? 3) * scale);
        this.state.set('rivalRep', Math.min(95, (this.state.rivalRep ?? 60) + amount));
        break;
      }
      case 'clearAllSabotage': {
        // Clear active sabotage effects
        this.state._smearCampaignDays = 0;
        this.state._supplyCostDays = 0;
        this.state._supplyCostMultiplier = 1.0;
        this.state._infraStressDays = 0;
        this.state._hotdogFloodDays = 0;
        this.state._hotdogDegradeMultiplier = 1.0;
        this.state._cursedBobbleDays = 0;
        this.state._sprinklerPrankDays = 0;
        this.state._organSwapDays = 0;
        this.state._gremlinDays = 0;
        this.state._sabotageRevenueMod = 1.0;
        this.state._sabotageAttendanceMod = 1.0;
        this.state._sabotageTeamPerfMod = 1.0;
        break;
      }
      case 'sabotageImmunity': {
        const days = effect.days ?? 5;
        ss.sabotageImmunityUntil = day + days;
        break;
      }
      case 'disableDefenses': {
        const days = Math.round((effect.days ?? 3) * scale);
        ss.defensesDisabledUntil = day + Math.max(1, days);
        break;
      }
      case 'npcRelationship': {
        const npc = effect.npc;
        const amount = Math.round((effect.amount ?? 0) * scale);
        if (npc && this.state.npcRelationships[npc] != null) {
          this.state.npcRelationships[npc] += amount;
          this.eventBus.emit('npc:relationshipChange', {
            npcId: npc,
            npcName: NPC_DATA[npc]?.name ?? npc,
            delta: amount,
            newValue: this.state.npcRelationships[npc],
            themeColor: NPC_DATA[npc]?.themeColor,
          });
        }
        break;
      }
      case 'compound': {
        for (const sub of (effect.effects ?? [])) {
          this._applyEffect(sub, halved);
        }
        break;
      }
    }
  }

  // ── Success Rate Calculation ────────────────────────────────────────────

  _calculateSuccessRate(scheme) {
    const base = scheme.baseSuccess ?? 0.5;
    const mod = calculateSchemeModifiers(this.state, scheme.id);
    return Math.max(0.05, Math.min(0.95, base + mod));
  }

  // ── Buff Expiration ─────────────────────────────────────────────────────

  _tickExpiringBuffs(day) {
    const ss = this.state.schemeState;

    // Expire sabotage chance multiplier
    if (ss.sabotageMultiplierUntil > 0 && day >= ss.sabotageMultiplierUntil) {
      ss.sabotageChanceMultiplier = 1.0;
      ss.sabotageMultiplierUntil = 0;
    }

    // Expire rival drain tick
    if (ss._rivalDrainDays > 0) {
      ss._rivalDrainDays--;
    }

    // Expire defenses disabled
    if (ss.defensesDisabledUntil > 0 && day >= ss.defensesDisabledUntil) {
      ss.defensesDisabledUntil = 0;
    }
  }

  // ── State Sync ──────────────────────────────────────────────────────────

  _onStateLoaded() {
    // Ensure schemeState exists after load
    if (!this.state.schemeState) {
      this.state.schemeState = {
        activeScheme: null,
        globalCooldownUntil: 0,
        schemeCooldowns: {},
        sullyCaughtUntil: 0,
        schemesThisSeason: 0,
        lastSeason: this.state.season ?? 1,
        schemeHistory: [],
        sabotageImmunityUntil: 0,
        sabotageChanceMultiplier: 1.0,
        sabotageMultiplierUntil: 0,
        blockNextSabotage: false,
        defensesDisabledUntil: 0,
      };
    }
  }
}
