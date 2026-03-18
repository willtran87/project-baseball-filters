/**
 * ContractPanel -- Sponsor contract management UI.
 *
 * Shows available sponsor contracts at reputation-gated tiers,
 * active contracts with progress tracking, and actions to accept,
 * counter-offer, or decline.
 *
 * Contract tiers:
 *   Local:    $200/game, 50% quality, rep 30+
 *   Regional: $500/game, 65% quality, rep 50+
 *   National: $1500/game, 80% quality, rep 70+
 *   Premium:  $5000/game, 90% quality, rep 86+
 *
 * Some contracts have category conflicts (e.g., two beverage sponsors).
 */

// -- Contract definitions -----------------------------------------------

const CONTRACT_POOL = [
  // Local tier
  { id: 'local_diner', name: "Rusty's Diner", tier: 'local', category: 'food', payPerGame: 200, durationGames: 15, qualityReq: 0.50, repRequired: 30, description: 'Local favorite wants signage near concessions.' },
  { id: 'local_hardware', name: 'Ridgemont Hardware', tier: 'local', category: 'retail', payPerGame: 180, durationGames: 20, qualityReq: 0.45, repRequired: 30, description: 'Hardware store sponsorship for maintenance wing.' },
  { id: 'local_soda', name: 'Valley Pop', tier: 'local', category: 'beverage', payPerGame: 220, durationGames: 12, qualityReq: 0.50, repRequired: 30, description: 'Local soda brand wants exclusive pouring rights.' },

  // Regional tier
  { id: 'regional_bank', name: 'Heartland Savings', tier: 'regional', category: 'finance', payPerGame: 500, durationGames: 25, qualityReq: 0.65, repRequired: 50, description: 'Regional bank wants luxury box naming rights.' },
  { id: 'regional_auto', name: 'TriCity Motors', tier: 'regional', category: 'auto', payPerGame: 550, durationGames: 20, qualityReq: 0.65, repRequired: 50, description: 'Auto dealer wants outfield billboard placement.' },
  { id: 'regional_brew', name: 'Ridgemont Brewing Co.', tier: 'regional', category: 'beverage', payPerGame: 600, durationGames: 18, qualityReq: 0.70, repRequired: 50, description: 'Craft brewery wants exclusive tap handles.' },
  // Stadium Experience Package (attendance-based, Regional+)
  { id: 'regional_experience', name: 'FanFirst Events', tier: 'regional', category: 'experience', payPerGame: 650, durationGames: 20, qualityReq: 0.60, repRequired: 50, description: 'Requires attendance > 70%. Fan experience company wants packed stands.', contractType: 'attendance', attendanceReq: 0.70 },

  // National tier
  { id: 'national_cola', name: 'MegaCola Inc.', tier: 'national', category: 'beverage', payPerGame: 1500, durationGames: 30, qualityReq: 0.80, repRequired: 70, description: 'National brand. Stadium-wide beverage exclusivity required.' },
  { id: 'national_sports', name: 'ProFit Athletics', tier: 'national', category: 'apparel', payPerGame: 1200, durationGames: 35, qualityReq: 0.75, repRequired: 70, description: 'Sports brand wants scoreboard and merch integration.' },
  { id: 'national_tech', name: 'DataStream Tech', tier: 'national', category: 'tech', payPerGame: 1800, durationGames: 25, qualityReq: 0.80, repRequired: 70, description: 'Tech company wants press box and Wi-Fi branding.' },
  // Multi-Domain Maintenance (multi-domain, National+)
  { id: 'national_multidomain', name: 'AllSystems Co.', tier: 'national', category: 'maintenance', payPerGame: 2340, durationGames: 25, qualityReq: 0.75, repRequired: 70, description: 'Requires 2+ domains above quality threshold simultaneously. Pays 30% more.', contractType: 'multiDomain', domainsRequired: 2 },

  // Premium tier
  { id: 'premium_mega', name: 'GlobalCorp', tier: 'premium', category: 'conglomerate', payPerGame: 5000, durationGames: 40, qualityReq: 0.90, repRequired: 86, description: 'Mega-corporation. Full stadium naming rights.' },
  { id: 'premium_lux', name: 'Pinnacle Luxury', tier: 'premium', category: 'luxury', payPerGame: 4500, durationGames: 30, qualityReq: 0.90, repRequired: 86, description: 'Luxury brand. Requires impeccable guest experience.' },
  // Seasonal Showcase (short burst, Premium)
  { id: 'premium_showcase', name: 'Diamond Showcase Series', tier: 'premium', category: 'showcase', payPerGame: 8000, durationGames: 5, qualityReq: 0.85, repRequired: 86, description: '5-game sprint. Very high pay, very high standards. High risk, high reward.' },
];

import { showConfirmDialog } from './notifications.js';

const TIER_COLORS = {
  local: '#a0a0a0',
  regional: '#29adff',
  national: '#ffec27',
  premium: '#ff77a8',
};

const TIER_LABELS = {
  local: 'Local',
  regional: 'Regional',
  national: 'National',
  premium: 'Premium',
};

const CHAIN_COLORS = {
  1: '#c0c0c0', // silver
  2: '#ffd700', // gold
  3: '#b388ff', // diamond/purple
};

const CHAIN_LABELS = {
  1: 'Chain 1/3',
  2: 'Chain 2/3',
  3: 'Chain 3/3',
};

export class ContractPanel {
  constructor(panelManager, state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;

    // Active contracts: { contractId, gamesRemaining, gamesPlayed, breachCount, perfectDays, chainLevel }
    if (!this.state.activeContracts) this.state.activeContracts = [];

    // Contract renewal tracking: { contractId: renewCount } — max 2 renewals per contract
    if (!this.state.contractRenewals) this.state.contractRenewals = {};

    // Loyalty follow-up contracts waiting in the available pool
    if (!this.state._followUpContracts) this.state._followUpContracts = [];

    // Declined contracts: [{ contractId, declinedOnDay }]
    if (!this.state._declinedContracts) this.state._declinedContracts = [];

    // Build a contract definitions cache on state so other systems (ConsequenceSystem) can look up defs
    this.state._contractDefsCache = {};
    for (const c of CONTRACT_POOL) {
      this.state._contractDefsCache[c.id] = c;
    }
    // Include Fiona's exclusive contract
    this.state._contractDefsCache['fiona_exclusive'] = {
      id: 'fiona_exclusive', name: "Fiona's VIP Contact", tier: 'premium',
      category: 'exclusive', payPerGame: 3000, durationGames: 20,
      qualityReq: 0.80, repRequired: 0,
      description: 'Exclusive deal from Fiona\'s network. Premium terms, limited time.',
    };
    // Also re-add any existing follow-up contracts from saved state
    for (const followUp of (this.state._followUpContracts ?? [])) {
      this.state._contractDefsCache[followUp.id] = followUp;
    }

    // Track quality for breach detection
    this._lastQuality = 0.5;
    this.eventBus.on('filtration:quality', (data) => {
      this._lastQuality = data.avgEfficiency;
    });

    // On each new day, tick active contracts
    this.eventBus.on('game:newDay', () => this._tickContracts());

    // Register panel
    panelManager.register('contracts', (el, state, eventBus, data) => {
      this._render(el, state, eventBus);
    });

    this.eventBus.on('ui:toggleContracts', () => {
      if (panelManager.isOpen('contracts')) {
        this.eventBus.emit('ui:closePanel');
      } else {
        this.eventBus.emit('ui:openPanel', { name: 'contracts' });
      }
    });
  }

  update(dt) {
    // Contract panel is event-driven
  }

  // -- Contract lifecycle -----------------------------------------------

  _tickContracts() {
    const contracts = this.state.activeContracts ?? [];
    const removed = [];

    for (const active of contracts) {
      const def = this._findContractDef(active.contractId);
      if (!def) continue;

      active.gamesPlayed++;

      // Check quality requirement (attendance-based contracts use attendance instead)
      // Renegotiated contracts use the higher quality requirement stored on the active entry
      const effectiveQualityReq = active.renegotiatedQualityReq ?? def.qualityReq;
      let meetsRequirement = false;
      if (def.contractType === 'attendance') {
        meetsRequirement = (this.state.attendancePercent / 100) >= (def.attendanceReq ?? 0.70);
      } else if (def.contractType === 'multiDomain') {
        const health = this.state.domainHealth ?? {};
        const threshold = effectiveQualityReq * 100;
        const domainsAbove = ['air', 'water', 'hvac', 'drainage'].filter(d => (health[d] ?? 0) >= threshold).length;
        meetsRequirement = domainsAbove >= (def.domainsRequired ?? 2);
      } else {
        meetsRequirement = this._lastQuality >= effectiveQualityReq;
      }

      if (!meetsRequirement) {
        active.breachCount++;
      } else {
        active.breachCount = Math.max(0, active.breachCount - 1);
      }

      // Track perfect days for performance bonus (quality > 90%)
      if (active.perfectDays === undefined) active.perfectDays = 0;
      if (this._lastQuality > 0.90) {
        active.perfectDays++;
      } else {
        active.perfectDays = 0; // reset streak on any day below 90%
      }

      // Breach warning at 3+ consecutive failures
      if (active.breachCount >= 3) {
        this.eventBus.emit('contract:breachWarning', { contractId: active.contractId, breachCount: active.breachCount });
        this.eventBus.emit('ui:message', {
          text: `Contract breach warning: ${def.name} requirements not met!`,
          type: 'danger',
        });
      }

      // Pay per game (use boosted pay from counter-offers / chain follow-ups)
      let effectivePay = active.boostedPay ?? def.payPerGame;
      if (this.state.storyFlags?.investmentPartner) {
        effectivePay = Math.floor(effectivePay * 1.05);
      }
      const fionaMult = this.state.storyFlags?.betterTerms ?? 1.0;
      if (fionaMult > 1.0) {
        effectivePay = Math.floor(effectivePay * fionaMult);
      }
      this.state.set('money', this.state.money + effectivePay);

      const effectiveDuration = active.shorterDuration ?? def.durationGames;

      // Contract complete (successful)
      if (active.gamesPlayed >= effectiveDuration && active.breachCount < 5) {
        removed.push({ contractId: active.contractId, reason: 'completed', active });

        // Performance bonus: 15% if quality > 90% every single day
        const isPerfect = active.perfectDays >= effectiveDuration;
        const basePayout = (active.boostedPay ?? def.payPerGame) * effectiveDuration;
        let bonusAmount = 0;
        if (isPerfect) {
          bonusAmount = Math.floor(basePayout * 0.15);
          this.state.set('money', this.state.money + bonusAmount);
        }

        const bonusText = isPerfect ? ` PERFECT performance! +15% bonus ($${bonusAmount.toLocaleString()})` : '';
        this.eventBus.emit('ui:message', {
          text: `Contract with ${def.name} completed. Earned $${basePayout.toLocaleString()} total.${bonusText}`,
          type: 'success',
        });

        // Loyalty follow-up: 60% chance, max chain depth 3
        const chainLevel = active.chainLevel ?? 0;
        if (chainLevel < 3 && Math.random() < 0.60) {
          this._generateFollowUp(def, active);
        }
      }

      // Breach termination at 5+ failures
      if (active.breachCount >= 5) {
        removed.push({ contractId: active.contractId, reason: 'breached', active });
        this.state.adjustReputation(-3);
        this.eventBus.emit('contract:lost', { contractId: active.contractId, name: def.name, reason: 'breach' });
        this.eventBus.emit('ui:message', {
          text: `${def.name} terminated your contract due to quality failures!`,
          type: 'danger',
        });
      }
    }

    // Remove completed/terminated contracts
    if (removed.length > 0) {
      const removedIds = removed.map(r => r.contractId);
      this.state.activeContracts = contracts.filter(
        c => !removedIds.includes(c.contractId)
      );
    }
  }

  _generateFollowUp(originalDef, activeData) {
    const chainLevel = (activeData.chainLevel ?? 0) + 1;
    const followUpPay = Math.floor((activeData.boostedPay ?? originalDef.payPerGame) * 1.20);
    const followUpQuality = Math.min(0.95, originalDef.qualityReq + 0.05);
    const followUpDuration = (activeData.shorterDuration ?? originalDef.durationGames) + 5;

    const followUp = {
      id: `${originalDef.id}_chain${chainLevel}`,
      name: originalDef.name,
      tier: originalDef.tier,
      category: originalDef.category,
      payPerGame: followUpPay,
      durationGames: followUpDuration,
      qualityReq: followUpQuality,
      repRequired: originalDef.repRequired,
      description: `Loyalty follow-up from ${originalDef.name}. Chain ${chainLevel}/3.`,
      chainLevel,
      contractType: originalDef.contractType,
      attendanceReq: originalDef.attendanceReq,
      domainsRequired: originalDef.domainsRequired,
    };

    if (!this.state._followUpContracts) this.state._followUpContracts = [];
    this.state._followUpContracts.push(followUp);

    // Add to contract defs cache for ConsequenceSystem breach checks
    if (this.state._contractDefsCache) {
      this.state._contractDefsCache[followUp.id] = followUp;
    }

    this.eventBus.emit('ui:message', {
      text: `${originalDef.name} is impressed! Loyalty follow-up offer available (Chain ${chainLevel}/3, $${followUpPay}/game).`,
      type: 'info',
    });
  }

  _findContractDef(contractId) {
    return CONTRACT_POOL.find(c => c.id === contractId)
      ?? (this.state._followUpContracts ?? []).find(c => c.id === contractId)
      ?? (contractId === 'fiona_exclusive' ? {
        id: 'fiona_exclusive', name: "Fiona's VIP Contact", tier: 'premium',
        category: 'exclusive', payPerGame: 3000, durationGames: 20,
        qualityReq: 0.80, repRequired: 0,
        description: 'Exclusive deal from Fiona\'s network. Premium terms, limited time.',
      } : null);
  }

  _acceptContract(contractId) {
    const def = this._findContractDef(contractId);
    if (!def) return;

    // Check for category conflict
    const conflict = this._findCategoryConflict(def);
    if (conflict) {
      this.eventBus.emit('ui:message', {
        text: `Cannot accept: conflicts with existing ${conflict.name} contract (same category: ${def.category}).`,
        type: 'warning',
      });
      return;
    }

    const activeEntry = {
      contractId: def.id,
      gamesPlayed: 0,
      breachCount: 0,
      perfectDays: 0,
    };
    if (def.chainLevel) {
      activeEntry.chainLevel = def.chainLevel;
      activeEntry.boostedPay = def.payPerGame;
    }

    this.state.activeContracts.push(activeEntry);

    // Remove from follow-up pool if it was a follow-up
    if (this.state._followUpContracts) {
      this.state._followUpContracts = this.state._followUpContracts.filter(c => c.id !== def.id);
    }

    this.eventBus.emit('contract:accepted', { contractId: def.id, name: def.name });
    this.eventBus.emit('contract:gained', { contractId: def.id, name: def.name });
    this.eventBus.emit('ui:message', {
      text: `Accepted contract with ${def.name}: $${def.payPerGame}/game for ${def.durationGames} games.`,
      type: 'success',
    });
  }

  _counterOffer(contractId) {
    const def = this._findContractDef(contractId);
    if (!def) return;

    // 40% chance of rejection
    if (Math.random() < 0.4) {
      this.eventBus.emit('ui:message', {
        text: `${def.name} rejected your counter-offer! Deal is off the table.`,
        type: 'danger',
      });
      return;
    }

    // Success: 20% better pay, 10% shorter duration
    const boostedPay = Math.floor(def.payPerGame * 1.2);
    const shorterDuration = Math.max(5, Math.floor(def.durationGames * 0.9));

    const conflict = this._findCategoryConflict(def);
    if (conflict) {
      this.eventBus.emit('ui:message', {
        text: `Counter accepted but conflicts with ${conflict.name}. Decline one first.`,
        type: 'warning',
      });
      return;
    }

    const activeEntry = {
      contractId: def.id,
      gamesPlayed: 0,
      breachCount: 0,
      perfectDays: 0,
      counterOffer: true,
      boostedPay,
      shorterDuration,
    };
    if (def.chainLevel) activeEntry.chainLevel = def.chainLevel;

    this.state.activeContracts.push(activeEntry);

    // Remove from follow-up pool if it was a follow-up
    if (this.state._followUpContracts) {
      this.state._followUpContracts = this.state._followUpContracts.filter(c => c.id !== def.id);
    }

    this.eventBus.emit('contract:accepted', { contractId: def.id, name: def.name });
    this.eventBus.emit('contract:gained', { contractId: def.id, name: def.name });
    this.eventBus.emit('ui:message', {
      text: `Counter-offer accepted! ${def.name}: $${boostedPay}/game for ${shorterDuration} games.`,
      type: 'success',
    });
  }

  _findCategoryConflict(def) {
    const active = this.state.activeContracts ?? [];
    for (const a of active) {
      const aDef = this._findContractDef(a.contractId);
      if (aDef && aDef.category === def.category && aDef.id !== def.id) {
        return aDef;
      }
    }
    return null;
  }

  // -- Renewal & Renegotiation -------------------------------------------

  _getDaysRemaining(active) {
    const def = this._findContractDef(active.contractId);
    if (!def) return Infinity;
    const effectiveDuration = active.shorterDuration ?? def.durationGames;
    return effectiveDuration - active.gamesPlayed;
  }

  _isExpiring(active) {
    return this._getDaysRemaining(active) <= 5;
  }

  _canRenew(contractId) {
    const renewals = this.state.contractRenewals ?? {};
    return (renewals[contractId] ?? 0) < 2;
  }

  _renewContract(contractId) {
    const active = (this.state.activeContracts ?? []).find(c => c.contractId === contractId);
    if (!active) return;
    const def = this._findContractDef(contractId);
    if (!def) return;
    if (!this._canRenew(contractId)) {
      this.eventBus.emit('ui:message', {
        text: `${def.name} has already been renewed the maximum number of times.`,
        type: 'warning',
      });
      return;
    }

    const effectiveDuration = active.shorterDuration ?? def.durationGames;
    const effectivePay = active.boostedPay ?? def.payPerGame;
    const totalValue = effectivePay * effectiveDuration;
    const renewalFee = Math.floor(totalValue * 0.10);

    if (this.state.money < renewalFee) {
      this.eventBus.emit('ui:message', {
        text: `Not enough money to renew! Need $${renewalFee.toLocaleString()}.`,
        type: 'warning',
      });
      return;
    }

    this.state.set('money', this.state.money - renewalFee);

    // Extend the contract by its original duration
    if (active.shorterDuration != null) {
      active.shorterDuration += effectiveDuration;
    } else {
      active.shorterDuration = effectiveDuration + def.durationGames;
    }

    // Track renewal count
    if (!this.state.contractRenewals) this.state.contractRenewals = {};
    this.state.contractRenewals[contractId] = (this.state.contractRenewals[contractId] ?? 0) + 1;

    const newEndDay = (this.state.gameDay ?? 0) + this._getDaysRemaining(active);
    this.eventBus.emit('contract:renewed', {
      contractId,
      sponsorName: def.name,
      newEndDay,
    });
    this.eventBus.emit('ui:message', {
      text: `${def.name} contract renewed! ($${renewalFee.toLocaleString()} fee)`,
      type: 'success',
    });
  }

  _renegotiateContract(contractId, container) {
    const active = (this.state.activeContracts ?? []).find(c => c.contractId === contractId);
    if (!active) return;
    const def = this._findContractDef(contractId);
    if (!def) return;
    if (!this._canRenew(contractId)) {
      this.eventBus.emit('ui:message', {
        text: `${def.name} has already been renewed the maximum number of times.`,
        type: 'warning',
      });
      return;
    }

    const effectivePay = active.boostedPay ?? def.payPerGame;
    const newPay = Math.floor(effectivePay * 1.15);
    const currentQualityReq = def.qualityReq;
    const newQualityReq = Math.min(0.99, currentQualityReq * 1.10);

    showConfirmDialog(
      container,
      `<strong style="color:#29adff">${def.name}</strong> offers renegotiated terms:<br><br>` +
      `<span style="color:#00e436">+15% payout:</span> $${effectivePay}/game -> $${newPay}/game<br>` +
      `<span style="color:#ff8800">+10% quality req:</span> ${Math.floor(currentQualityReq * 100)}% -> ${Math.floor(newQualityReq * 100)}%<br><br>` +
      `Accept new terms or decline to keep original terms?`,
      () => {
        // Accept renegotiation: apply new terms and renew
        active.boostedPay = newPay;

        const effectiveDuration = active.shorterDuration ?? def.durationGames;
        const totalValue = newPay * effectiveDuration;
        const renewalFee = Math.floor(totalValue * 0.10);

        if (this.state.money < renewalFee) {
          this.eventBus.emit('ui:message', {
            text: `Not enough money for renegotiation fee! Need $${renewalFee.toLocaleString()}.`,
            type: 'warning',
          });
          return;
        }

        this.state.set('money', this.state.money - renewalFee);

        // Extend the contract by its original duration
        if (active.shorterDuration != null) {
          active.shorterDuration += effectiveDuration;
        } else {
          active.shorterDuration = effectiveDuration + def.durationGames;
        }

        // Store the renegotiated quality requirement on the active entry
        active.renegotiatedQualityReq = newQualityReq;

        // Track renewal count
        if (!this.state.contractRenewals) this.state.contractRenewals = {};
        this.state.contractRenewals[contractId] = (this.state.contractRenewals[contractId] ?? 0) + 1;

        const newEndDay = (this.state.gameDay ?? 0) + this._getDaysRemaining(active);
        this.eventBus.emit('contract:renegotiated', {
          contractId,
          sponsorName: def.name,
          newPay,
          newQualityReq,
          newEndDay,
        });
        this.eventBus.emit('ui:message', {
          text: `${def.name} contract renegotiated! $${newPay}/game at ${Math.floor(newQualityReq * 100)}% quality. ($${renewalFee.toLocaleString()} fee)`,
          type: 'success',
        });

        // Re-render
        this.eventBus.emit('ui:openPanel', { name: 'contracts' });
      },
      'ACCEPT'
    );
  }

  // -- Rendering --------------------------------------------------------

  _render(el, state, eventBus) {
    const rep = state.reputation;
    const activeIds = (state.activeContracts ?? []).map(c => c.contractId);
    const declined = state._declinedContracts ?? [];
    const currentDay = state.gameDay ?? 0;
    const declinedIds = new Set(
      declined.filter(d => currentDay - d.declinedOnDay < 5).map(d => d.contractId)
    );
    // Prune expired declines
    state._declinedContracts = declined.filter(d => currentDay - d.declinedOnDay < 5);
    const available = CONTRACT_POOL.filter(
      c => rep >= c.repRequired && !activeIds.includes(c.id) && !declinedIds.has(c.id)
    );
    // Fiona exclusiveContracts bonus: add 1 extra premium contract
    if (state.storyFlags?.exclusiveContracts) {
      const exclusiveContract = {
        id: 'fiona_exclusive', name: "Fiona's VIP Contact", tier: 'premium',
        category: 'exclusive', payPerGame: 3000, durationGames: 20,
        qualityReq: 0.80, repRequired: 0,
        description: 'Exclusive deal from Fiona\'s network. Premium terms, limited time.',
      };
      if (!activeIds.includes(exclusiveContract.id) && !declinedIds.has(exclusiveContract.id)) {
        available.push(exclusiveContract);
      }
    }
    // Add loyalty follow-up contracts to available pool
    for (const followUp of (state._followUpContracts ?? [])) {
      if (!activeIds.includes(followUp.id) && !declinedIds.has(followUp.id)) {
        available.push(followUp);
      }
    }
    const activeContracts = state.activeContracts ?? [];

    el.style.cssText = `
      position: absolute; top: 24px; left: 10%; right: 10%; bottom: 24px;
      background: linear-gradient(180deg, rgba(10,10,25,0.97), rgba(8,8,24,0.97));
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
      <div style="
        display: flex; justify-content: space-between; align-items: center;
        padding: 8px 12px; border-bottom: 2px solid #8b4513;
        background: linear-gradient(180deg,rgba(139,69,19,0.15),rgba(0,0,0,0.3));
      ">
        <strong style="color: #29adff; letter-spacing: 1px">\u{1f4dd} SPONSOR CONTRACTS</strong>
        <span style="color: #888">Rep: <span style="color: #29adff">${Math.floor(rep)}%</span></span>
        <span data-action="close-contracts" style="cursor:pointer;color:#888;font-size:12px">\u2715</span>
      </div>
    `;

    // Active contracts section
    html += `
      <div style="padding: 8px 12px; border-bottom: 1px solid #3a3a5a;">
        <div style="color: #00e436; margin-bottom: 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px">
          Active Contracts (${activeContracts.length})
        </div>
    `;

    if (activeContracts.length === 0) {
      html += `<div style="color: #666; font-style: italic; padding: 4px 0;">No active contracts.</div>`;
    } else {
      for (const active of activeContracts) {
        const def = this._findContractDef(active.contractId);
        if (!def) continue;

        const effectiveDuration = active.shorterDuration ?? def.durationGames;
        const effectivePay = active.boostedPay ?? def.payPerGame;
        const progress = Math.min(1, active.gamesPlayed / effectiveDuration);
        const progressPct = Math.floor(progress * 100);
        const isBreach = active.breachCount >= 3;
        const chainLevel = active.chainLevel ?? 0;
        const perfectDays = active.perfectDays ?? 0;
        const daysRemaining = this._getDaysRemaining(active);
        const isExpiring = daysRemaining <= 5 && daysRemaining > 0;
        const canRenew = isExpiring && this._canRenew(active.contractId);

        // Chain level badge
        const chainBadge = chainLevel > 0
          ? `<span style="color: ${CHAIN_COLORS[chainLevel]}; font-size: 9px; border: 1px solid ${CHAIN_COLORS[chainLevel]}; padding: 0 4px; border-radius: 2px; margin-left: 4px;">${CHAIN_LABELS[chainLevel]}</span>`
          : '';

        // Expiring soon badge
        const expiringBadge = isExpiring
          ? `<span style="color: #ffec27; font-size: 9px; border: 1px solid #ffec27; padding: 0 4px; border-radius: 2px; margin-left: 4px; background: rgba(255,236,39,0.1);">Expiring Soon</span>`
          : '';

        // Renewal count indicator
        const renewCount = (state.contractRenewals ?? {})[active.contractId] ?? 0;
        const renewBadge = renewCount > 0
          ? `<span style="color: #888; font-size: 9px; margin-left: 4px;">Renewed ${renewCount}/2</span>`
          : '';

        // Perfect day progress (only show if at least 1 perfect day)
        const perfectBadge = perfectDays > 0
          ? `<span style="color: #00e436; font-size: 9px; margin-left: 4px;">Perfect: ${perfectDays}/${effectiveDuration}</span>`
          : '';

        html += `
          <div style="
            padding: 4px 8px; margin-bottom: 4px;
            background: rgba(255,255,255,0.03);
            border-left: 3px solid ${isBreach ? '#ff004d' : isExpiring ? '#ffec27' : TIER_COLORS[def.tier]};
          ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: ${TIER_COLORS[def.tier]}">${def.name}${chainBadge}${expiringBadge}${renewBadge}</span>
              <span style="color: #00e436; font-size: 10px">$${effectivePay}/game</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
              <div style="flex: 1; background: #222; height: 4px; border-radius: 2px;">
                <div style="background: ${TIER_COLORS[def.tier]}; height: 100%; width: ${progressPct}%; border-radius: 2px;"></div>
              </div>
              <span style="color: #888; font-size: 9px">${active.gamesPlayed}/${effectiveDuration} (${daysRemaining} left)</span>
            </div>
            ${isBreach ? `<div style="color: #ff004d; font-size: 9px; margin-top: 2px;">BREACH WARNING (${active.breachCount}/5)</div>` : ''}
            ${(() => {
              const breachDays = state.contractBreachDays ?? {};
              const daysAtRisk = breachDays[active.contractId] ?? 0;
              if (daysAtRisk >= 2 && !isBreach) {
                return `<div style="color: #ff8800; font-size: 9px; margin-top: 2px; background: rgba(255,136,0,0.1); padding: 2px 4px; border-radius: 2px;">&#9888; Quality dip -- breach risk if not fixed soon (${daysAtRisk} days at risk)</div>`;
              }
              return '';
            })()}
            ${perfectBadge ? `<div style="margin-top: 2px;">${perfectBadge}</div>` : ''}
            ${canRenew ? `
              <div style="display: flex; gap: 6px; margin-top: 4px;">
                <button data-action="renew" data-contract="${active.contractId}" style="
                  background: #1a2a3a; color: #29adff; border: 1px solid #3a5a6a;
                  padding: 2px 8px; font-family: monospace; cursor: pointer; font-size: 9px;
                ">RENEW</button>
                <button data-action="renegotiate" data-contract="${active.contractId}" style="
                  background: #2a2a1a; color: #ffec27; border: 1px solid #5a5a3a;
                  padding: 2px 8px; font-family: monospace; cursor: pointer; font-size: 9px;
                ">RENEGOTIATE</button>
              </div>
            ` : ''}
          </div>
        `;
      }
    }
    html += `</div>`;

    // Available contracts section (scrollable)
    html += `
      <div style="flex: 1; overflow-y: auto; padding: 8px 12px;">
        <div style="color: #ffec27; margin-bottom: 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px">
          Available Contracts
        </div>
    `;

    if (available.length === 0) {
      html += `<div style="color: #666; font-style: italic; padding: 4px 0;">No contracts available at your current reputation.</div>`;
    } else {
      for (const contract of available) {
        const conflict = this._findCategoryConflict(contract);
        const tierColor = TIER_COLORS[contract.tier];
        const chainLevel = contract.chainLevel ?? 0;
        const chainBadge = chainLevel > 0
          ? `<span style="color: ${CHAIN_COLORS[chainLevel]}; font-size: 9px; border: 1px solid ${CHAIN_COLORS[chainLevel]}; padding: 0 4px; border-radius: 2px; margin-left: 4px;">${CHAIN_LABELS[chainLevel]}</span>`
          : '';
        const requirementLabel = contract.contractType === 'attendance'
          ? `Min attendance: ${Math.floor((contract.attendanceReq ?? 0.70) * 100)}%`
          : contract.contractType === 'multiDomain'
            ? `${contract.domainsRequired ?? 2}+ domains above ${Math.floor(contract.qualityReq * 100)}%`
            : `Min quality: ${Math.floor(contract.qualityReq * 100)}%`;

        html += `
          <div style="
            padding: 6px 8px; margin-bottom: 4px;
            background: rgba(255,255,255,0.03);
            border-left: 3px solid ${tierColor};
          ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="color: ${tierColor}; font-size: 10px;">[${TIER_LABELS[contract.tier]}]</span>
                <strong style="margin-left: 4px;">${contract.name}</strong>${chainBadge}
              </div>
              <span style="color: #00e436">$${contract.payPerGame}/game</span>
            </div>
            <div style="color: #888; font-size: 10px; margin: 3px 0;">
              ${contract.description}
            </div>
            <div style="color: #777; font-size: 9px; margin-bottom: 4px;">
              Duration: ${contract.durationGames} games | ${requirementLabel}
              ${conflict ? `| <span style="color:#ff8800">Conflicts with ${conflict.name}</span>` : ''}
            </div>
            <div style="display: flex; gap: 6px;">
              <button data-action="accept" data-contract="${contract.id}" style="
                background: #1a3a2a; color: #00e436; border: 1px solid #3a6a4a;
                padding: 2px 10px; font-family: monospace; cursor: pointer; font-size: 9px;
              ">ACCEPT</button>
              <button data-action="counter" data-contract="${contract.id}" style="
                background: #2a2a3a; color: #29adff; border: 1px solid #3a3a6a;
                padding: 2px 10px; font-family: monospace; cursor: pointer; font-size: 9px;
              ">COUNTER (risk)</button>
              <button data-action="decline" data-contract="${contract.id}" style="
                background: #3a2a2a; color: #888; border: 1px solid #4a3a3a;
                padding: 2px 10px; font-family: monospace; cursor: pointer; font-size: 9px;
              ">DECLINE</button>
            </div>
          </div>
        `;
      }
    }

    html += `</div>`;

    el.innerHTML = html;

    // Event handlers
    el.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const contractId = target.dataset.contract;

      if (action === 'close-contracts') {
        eventBus.emit('ui:closePanel');
      } else if (action === 'renew' && contractId) {
        this._renewContract(contractId);
        eventBus.emit('ui:openPanel', { name: 'contracts' });
      } else if (action === 'renegotiate' && contractId) {
        this._renegotiateContract(contractId, el);
      } else if (action === 'accept' && contractId) {
        this._acceptContract(contractId);
        // Re-render
        eventBus.emit('ui:openPanel', { name: 'contracts' });
      } else if (action === 'counter' && contractId) {
        const def = this._findContractDef(contractId);
        showConfirmDialog(
          el,
          `Counter-offer to <strong style="color:#29adff">${def?.name ?? 'sponsor'}</strong>?<br>40% chance they reject and walk away!`,
          () => {
            this._counterOffer(contractId);
            eventBus.emit('ui:openPanel', { name: 'contracts' });
          },
          'COUNTER'
        );
      } else if (action === 'decline' && contractId) {
        if (!state._declinedContracts) state._declinedContracts = [];
        state._declinedContracts.push({
          contractId,
          declinedOnDay: state.gameDay ?? 0,
        });
        // Also remove from follow-up pool if it was a follow-up
        if (state._followUpContracts) {
          state._followUpContracts = state._followUpContracts.filter(c => c.id !== contractId);
        }
        eventBus.emit('ui:message', {
          text: `Declined offer from ${this._findContractDef(contractId)?.name ?? 'sponsor'}.`,
          type: 'info',
        });
        // Re-render to remove declined contract from list
        eventBus.emit('ui:openPanel', { name: 'contracts' });
      }
    });
  }
}
