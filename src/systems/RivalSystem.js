/**
 * RivalSystem -- Simulates Victor's Glendale Grizzlies stadium off-screen.
 *
 * Tracks rival reputation and generates competitive tension through
 * league standings comparisons and story-driven events.
 *
 * rivalRep starts at 60 and drifts based on story chapter:
 *   Ch1-2: rises slowly (+0.1/day)
 *   Ch3-4: stagnates (small random drift)
 *   Ch5:   declines if player rep > 80
 *
 * Sabotage system: Victor executes targeted sabotage actions that
 * escalate with player reputation. Players can purchase counter-strategies.
 */

import { VICTOR_TAUNTS, VICTOR_FRUSTRATIONS, RIVAL_SEASON_AWARDS, NPC_DATA } from '../data/storyData.js';

// -- Sabotage Types ----------------------------------------------------------

const SABOTAGE_TYPES = [
  {
    id: 'supplyDisruption',
    name: 'Supply Chain Disruption',
    description: 'Victor disrupted your supply chain -- filter costs increased!',
    repRange: [30, 100],
    effect: (state) => {
      state._supplyCostDays = 5;
      state._supplyCostMultiplier = 1.2;
    },
  },
  {
    id: 'bribeInspector',
    name: 'Inspector Bribe',
    description: 'Victor bribed the health inspector -- next inspection will be stricter!',
    repRange: [40, 100],
    effect: (state) => {
      state._nextInspectionPenalty = 0.7;
    },
  },
  {
    id: 'poachStaff',
    name: 'Staff Poaching',
    description: 'Victor is trying to recruit one of your staff members!',
    repRange: [50, 100],
    effect: (state) => {
      const staffList = state.staffList ?? [];
      if (staffList.length === 0) return;
      // Find lowest morale staff member
      let target = staffList[0];
      for (const s of staffList) {
        if ((s.morale ?? 50) < (target.morale ?? 50)) target = s;
      }
      // 50% chance they leave
      if (Math.random() < 0.5) {
        const idx = staffList.indexOf(target);
        if (idx >= 0) {
          staffList.splice(idx, 1);
          state._lastPoachedStaff = target.name ?? 'a staff member';
        }
      }
    },
  },
  {
    id: 'smearCampaign',
    name: 'Smear Campaign',
    description: 'Victor planted negative stories in the press -- reputation taking a hit!',
    repRange: [60, 100],
    effect: (state) => {
      state._smearCampaignDays = 3;
    },
  },
];

// -- Rival Defense Definitions -----------------------------------------------

const RIVAL_DEFENSE_DEFS = {
  securityUpgrade: {
    name: 'Security Upgrade',
    description: 'Blocks the next sabotage attempt',
    cost: 2000,
    durationDays: 10,
  },
  counterIntel: {
    name: 'Counter-Intel',
    description: 'Reveals Victor\'s next sabotage plan',
    cost: 3000,
    durationDays: 0, // one-shot reveal
  },
  mediaResponse: {
    name: 'Media Response',
    description: 'Nullifies active and future smear campaigns',
    cost: 1500,
    durationDays: 14,
  },
};

// -- Escalation Tiers --------------------------------------------------------

const ESCALATION_TIERS = [
  { minRep: 30, maxRep: 49, chance: 0.08, types: ['supplyDisruption'], doubleChance: 0 },
  { minRep: 50, maxRep: 64, chance: 0.12, types: ['supplyDisruption', 'bribeInspector'], doubleChance: 0 },
  { minRep: 65, maxRep: 79, chance: 0.15, types: ['supplyDisruption', 'bribeInspector', 'poachStaff', 'smearCampaign'], doubleChance: 0 },
  { minRep: 80, maxRep: 100, chance: 0.20, types: ['supplyDisruption', 'bribeInspector', 'poachStaff', 'smearCampaign'], doubleChance: 0.15 },
];

export class RivalSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;

    // Weekly standings comparison timer
    this._weekTimer = 0;
    this._weekInterval = 7; // every 7 game-days
    this._lastComparedDay = 0;

    // Track Victor taunt cooldown to avoid spamming
    this._lastTauntDay = 0;
    this._tauntCooldown = 14; // at least 14 days between taunts

    // Rival insight cooldown (Victor relationship bonus)
    this._lastInsightDay = 0;

    // Victor full dialogue limit: 1 per day
    this._victorDialogueToday = false;

    // Sabotage delayed by Priya tip (executes next day instead)
    this._sabotageDelayed = null;

    // Season tracking for end-of-season awards
    this._lastSeason = state.season ?? 1;

    // Initialize rivalry defense state if not present
    this._ensureRivalDefenses();

    this.eventBus.on('game:newDay', (data) => this._onNewDay(data));
    // Re-sync after save/load to avoid false season-end awards
    this.eventBus.on('state:loaded', () => {
      this._lastSeason = this.state.season ?? 1;
      this._lastComparedDay = this.state.gameDay ?? 0;
      this._victorDialogueToday = false;
      this._sabotageDelayed = null;
      this._ensureRivalDefenses();
    });
    // UI-driven defense purchases
    this.eventBus.on('rival:purchaseDefense', (data) => {
      if (data?.type) this.purchaseDefense(data.type);
    });
  }

  _ensureRivalDefenses() {
    if (!this.state._rivalDefenses) {
      this.state._rivalDefenses = {
        securityUpgrade: { active: false, daysLeft: 0 },
        counterIntel: { active: false, revealedType: null },
        mediaResponse: { active: false, daysLeft: 0 },
      };
    }
  }

  update(dt) {
    if (this.state.paused) return;
    // Rival rep drift is handled per game-day in _onNewDay, not per tick
  }

  // -- Day-based updates -----------------------------------------------

  _onNewDay(data) {
    // Reset daily Victor dialogue flag
    this._victorDialogueToday = false;

    // Execute delayed sabotage from previous day's Priya tip
    if (this._sabotageDelayed) {
      const delayed = this._sabotageDelayed;
      this._sabotageDelayed = null;
      this._executeSabotage([delayed], this.state._rivalDefenses);
    }

    this._driftRivalRep();
    this._checkWeeklyStandings(data);
    this._checkSeasonEnd();
    this._checkRivalInsight();
    this._checkVictorEncounter();
    this._tickDefenses();
    this._checkSabotage();
    this._tickSmearCampaign();
    this._tickSupplyCost();
  }

  /**
   * Drift rival reputation based on current story chapter.
   */
  _driftRivalRep() {
    const chapter = this.state.storyChapter ?? 1;
    const playerRep = this.state.reputation;
    let rivalRep = this.state.rivalRep ?? 60;

    if (chapter <= 2) {
      // Victor is rising -- Ch1-2
      rivalRep += 0.1;
    } else if (chapter <= 4) {
      // Stagnation -- small random drift
      rivalRep += (Math.random() - 0.5) * 0.1;
    } else {
      // Ch5+: Victor declines if player is strong
      if (playerRep > 80) {
        rivalRep -= 0.15;
      } else {
        rivalRep += (Math.random() - 0.5) * 0.05;
      }
    }

    // Clamp to 10-95 range (Victor never fully collapses or hits 100)
    rivalRep = Math.max(10, Math.min(95, rivalRep));
    this.state.set('rivalRep', Math.round(rivalRep * 10) / 10);
  }

  /**
   * Weekly league standings comparison.
   * Affects gameplay: player leading = small rep/morale boost,
   * rival dominant = pressure and media negativity.
   */
  _checkWeeklyStandings(data) {
    const day = data?.day ?? this.state.gameDay;
    if (day - this._lastComparedDay < this._weekInterval) return;
    this._lastComparedDay = day;

    const playerRep = this.state.reputation;
    const rivalRep = this.state.rivalRep;
    const gap = Math.abs(playerRep - rivalRep);
    const playerLeading = playerRep > rivalRep;

    this.eventBus.emit('rival:standings', {
      playerRep,
      rivalRep,
      day,
      playerLeading,
      gap,
    });

    // Gameplay effects from rivalry standings
    if (playerLeading && gap >= 10) {
      // Player is ahead: small rep boost from league recognition
      this.state.adjustReputation(1);
      // Victor frustration taunt
      this._maybeVictor(day, false);
    } else if (!playerLeading && gap >= 15) {
      // Victor is dominant: pressure, media negativity, owner concern
      this.state.adjustReputation(-1);
      this.eventBus.emit('rival:dominant', {
        rivalRep,
        playerRep,
        gap: rivalRep - playerRep,
      });
      this.eventBus.emit('ui:message', {
        text: `The Glendale Grizzlies are ${Math.floor(gap)} points ahead in the standings. Victor is smiling. Maggie is not.`,
        type: 'warning',
      });
      // Victor taunt
      this._maybeVictor(day, true);
    } else if (!playerLeading && gap >= 5) {
      // Victor is slightly ahead — occasional taunt
      this._maybeVictor(day, true);
    }
  }

  /**
   * Possibly emit a Victor taunt or frustration message.
   */
  _maybeVictor(day, victorAhead) {
    if (day - this._lastTauntDay < this._tauntCooldown) return;
    if (Math.random() > 0.5) return; // 50% chance to actually taunt

    this._lastTauntDay = day;
    const pool = victorAhead ? VICTOR_TAUNTS : VICTOR_FRUSTRATIONS;
    const msg = pool[Math.floor(Math.random() * pool.length)];

    this.eventBus.emit('ui:message', {
      text: msg,
      type: victorAhead ? 'warning' : 'success',
    });
    this.eventBus.emit('rival:taunt', {
      text: msg,
      victorAhead,
      day,
    });
  }

  /**
   * End-of-season award.
   */
  _checkSeasonEnd() {
    const season = this.state.season ?? 1;
    if (season <= this._lastSeason) return;
    this._lastSeason = season;

    const playerRep = this.state.reputation;
    const rivalRep = this.state.rivalRep;
    const winner = playerRep >= rivalRep ? 'player' : 'rival';

    this.eventBus.emit('rival:seasonAward', {
      season: season - 1,
      winner,
      playerRep,
      rivalRep,
    });

    const pool = winner === 'player' ? RIVAL_SEASON_AWARDS.win : RIVAL_SEASON_AWARDS.lose;
    const msg = pool[Math.floor(Math.random() * pool.length)]
      .replace('{season}', String(season - 1));
    this.eventBus.emit('ui:message', {
      text: msg,
      type: winner === 'player' ? 'success' : 'warning',
    });
  }

  // -- NPC Relationship Bonuses -----------------------------------------

  /**
   * rivalInsight bonus: when flag is set, reveal Victor's current strategy.
   * Shows a hint about his standings drift direction once per week.
   */
  _checkRivalInsight() {
    if (!this.state.storyFlags?.rivalInsight) return;
    // Only show insight once per 7 days
    const day = this.state.gameDay ?? 0;
    if (this._lastInsightDay && day - this._lastInsightDay < 7) return;
    this._lastInsightDay = day;

    const chapter = this.state.storyChapter ?? 1;
    const rivalRep = this.state.rivalRep ?? 60;
    let hint;
    if (chapter <= 2) {
      hint = 'Victor is investing heavily in Glendale. Expect his reputation to keep climbing.';
    } else if (chapter <= 4 && rivalRep > this.state.reputation) {
      hint = 'Victor seems content to coast. His numbers are stable but not growing.';
    } else if (chapter >= 5 && this.state.reputation > 80) {
      hint = 'Victor is rattled. His stadium is losing ground. Keep the pressure on.';
    } else {
      hint = 'Victor is watching you closely, but making no big moves this week.';
    }
    this.eventBus.emit('ui:message', {
      text: `Rival intel: ${hint}`,
      type: 'info',
    });
  }

  /**
   * Random Victor encounter: 10% daily chance in chapter 2+.
   * 50% of encounters trigger a full casual dialogue instead of a toast taunt.
   * Full dialogue limited to 1 per day via _victorDialogueToday flag.
   */
  _checkVictorEncounter() {
    const chapter = this.state.storyChapter ?? 1;
    if (chapter < 2) return;
    if (Math.random() > 0.10) return;

    const encounters = (this.state.victorEncounters ?? 0) + 1;
    this.state.set('victorEncounters', encounters);

    // 50% chance to trigger full dialogue (max 1 per day)
    if (!this._victorDialogueToday && Math.random() < 0.5) {
      this._victorDialogueToday = true;
      this.eventBus.emit('rival:victorEncounter', { encounters, dialogue: true });
      this.eventBus.emit('npc:startChat', { npcId: 'victor' });
      return;
    }

    // Otherwise, toast taunt as before
    // Every 5th encounter, Victor is more frustrated
    const pool = (encounters % 5 === 0) ? VICTOR_FRUSTRATIONS : VICTOR_TAUNTS;
    const text = pool[Math.floor(Math.random() * pool.length)];

    const victor = NPC_DATA.victor;
    const portrait = victor?.portraits?.smug ?? 'portrait_victor_smug';

    this.eventBus.emit('rival:victorEncounter', { encounters, text });
    this.eventBus.emit('ui:message', {
      text,
      type: 'warning',
      portrait,
      npcName: victor?.name ?? 'Victor Salazar',
    });
  }

  // -- Sabotage System ---------------------------------------------------

  /**
   * Check if Victor triggers sabotage today based on escalation tier.
   */
  _checkSabotage() {
    const chapter = this.state.storyChapter ?? 1;
    if (chapter < 2) return;

    const playerRep = this.state.reputation;
    const tier = ESCALATION_TIERS.find(t => playerRep >= t.minRep && playerRep <= t.maxRep);
    if (!tier) return;

    if (Math.random() > tier.chance) return;

    // Pick a sabotage type from the tier's allowed types
    const availableTypes = SABOTAGE_TYPES.filter(s => tier.types.includes(s.id));
    if (availableTypes.length === 0) return;

    // Check counter-intel: if active, reveal the sabotage instead of executing
    const defenses = this.state._rivalDefenses;
    if (defenses?.counterIntel?.active && defenses.counterIntel.revealedType === null) {
      const revealed = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      defenses.counterIntel.revealedType = revealed.id;
      this.eventBus.emit('ui:message', {
        text: `Counter-intel report: Victor is planning "${revealed.name}". Prepare your defenses!`,
        type: 'info',
      });
      this.eventBus.emit('rival:sabotageRevealed', { type: revealed.id, name: revealed.name });
      return;
    }

    // victorTips: Priya warns about sabotage, delaying it by 1 day
    if (this.state.storyFlags?.victorTips && Math.random() < 0.4) {
      const tipped = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      this.eventBus.emit('ui:message', {
        text: `Priya tips: "My sources say Victor is planning something. Watch for ${tipped.name}."`,
        type: 'info',
      });
      this._sabotageDelayed = tipped;
      return;
    }

    // Execute first sabotage
    this._executeSabotage(availableTypes, defenses);

    // Double sabotage chance at rep 80+
    if (tier.doubleChance > 0 && Math.random() < tier.doubleChance) {
      this._executeSabotage(availableTypes, defenses);
    }
  }

  /**
   * Execute a single sabotage event, checking defenses first.
   */
  _executeSabotage(availableTypes, defenses) {
    const picked = availableTypes[Math.floor(Math.random() * availableTypes.length)];

    // Security upgrade blocks sabotage
    if (defenses?.securityUpgrade?.active) {
      defenses.securityUpgrade.active = false;
      defenses.securityUpgrade.daysLeft = 0;
      this.eventBus.emit('ui:message', {
        text: `Security blocked Victor's "${picked.name}" attempt! Your defenses held.`,
        type: 'success',
      });
      this.eventBus.emit('rival:sabotageBlocked', { type: picked.id, name: picked.name });
      return;
    }

    // Media response nullifies smear campaigns specifically
    if (picked.id === 'smearCampaign' && defenses?.mediaResponse?.active) {
      this.eventBus.emit('ui:message', {
        text: 'Victor tried a smear campaign, but your media response team shut it down!',
        type: 'success',
      });
      this.eventBus.emit('rival:sabotageBlocked', { type: picked.id, name: picked.name });
      return;
    }

    // Apply the sabotage effect
    picked.effect(this.state);

    const victor = NPC_DATA.victor;
    const portrait = victor?.portraits?.smug ?? 'portrait_victor_smug';

    this.eventBus.emit('ui:message', {
      text: picked.description,
      type: 'danger',
      portrait,
      npcName: victor?.name ?? 'Victor Salazar',
    });
    this.eventBus.emit('rival:sabotage', {
      type: picked.id,
      name: picked.name,
      description: picked.description,
    });

    // Special notification for staff poaching
    if (picked.id === 'poachStaff' && this.state._lastPoachedStaff) {
      this.eventBus.emit('ui:message', {
        text: `${this.state._lastPoachedStaff} left to work for Glendale! Low morale made them vulnerable.`,
        type: 'danger',
      });
      this.state._lastPoachedStaff = null;
    }
  }

  /**
   * Tick down active defense durations each day.
   */
  _tickDefenses() {
    const defenses = this.state._rivalDefenses;
    if (!defenses) return;

    if (defenses.securityUpgrade.active && defenses.securityUpgrade.daysLeft > 0) {
      defenses.securityUpgrade.daysLeft--;
      if (defenses.securityUpgrade.daysLeft <= 0) {
        defenses.securityUpgrade.active = false;
        this.eventBus.emit('ui:message', {
          text: 'Your security upgrade has expired.',
          type: 'info',
        });
      }
    }

    if (defenses.mediaResponse.active && defenses.mediaResponse.daysLeft > 0) {
      defenses.mediaResponse.daysLeft--;
      if (defenses.mediaResponse.daysLeft <= 0) {
        defenses.mediaResponse.active = false;
        this.eventBus.emit('ui:message', {
          text: 'Your media response team contract has ended.',
          type: 'info',
        });
      }
    }
  }

  /**
   * Tick smear campaign: apply -1 rep per day for duration.
   */
  _tickSmearCampaign() {
    const days = this.state._smearCampaignDays ?? 0;
    if (days <= 0) return;

    this.state.adjustReputation(-1);
    this.state._smearCampaignDays = days - 1;

    if (days - 1 > 0) {
      this.eventBus.emit('ui:message', {
        text: `Smear campaign continues... ${days - 1} day(s) of bad press remaining.`,
        type: 'warning',
      });
    } else {
      this.eventBus.emit('ui:message', {
        text: 'The smear campaign has run its course. Press coverage returning to normal.',
        type: 'info',
      });
    }
  }

  /**
   * Tick supply cost disruption: decrement days remaining.
   */
  _tickSupplyCost() {
    const days = this.state._supplyCostDays ?? 0;
    if (days <= 0) return;

    this.state._supplyCostDays = days - 1;

    if (days - 1 <= 0) {
      this.state._supplyCostMultiplier = 1.0;
      this.eventBus.emit('ui:message', {
        text: 'Supply chain restored. Filter costs back to normal.',
        type: 'info',
      });
    }
  }

  // -- Counter-Strategy Purchases ----------------------------------------

  /**
   * Purchase a defense against rival sabotage.
   * @param {string} type - 'securityUpgrade' | 'counterIntel' | 'mediaResponse'
   * @returns {boolean} true if purchase was successful
   */
  purchaseDefense(type) {
    const def = RIVAL_DEFENSE_DEFS[type];
    if (!def) return false;

    if (this.state.money < def.cost) {
      this.eventBus.emit('ui:message', {
        text: `Not enough money for ${def.name}! Need $${def.cost.toLocaleString()}.`,
        type: 'warning',
      });
      return false;
    }

    this._ensureRivalDefenses();
    const defenses = this.state._rivalDefenses;

    // Check if already active
    if (defenses[type]?.active) {
      this.eventBus.emit('ui:message', {
        text: `${def.name} is already active!`,
        type: 'warning',
      });
      return false;
    }

    // Deduct cost
    this.state.set('money', this.state.money - def.cost);

    // Activate defense
    if (type === 'securityUpgrade') {
      defenses.securityUpgrade = { active: true, daysLeft: def.durationDays };
    } else if (type === 'counterIntel') {
      defenses.counterIntel = { active: true, revealedType: null };
    } else if (type === 'mediaResponse') {
      defenses.mediaResponse = { active: true, daysLeft: def.durationDays };
      // Immediately clear any active smear campaign
      if ((this.state._smearCampaignDays ?? 0) > 0) {
        this.state._smearCampaignDays = 0;
        this.eventBus.emit('ui:message', {
          text: 'Media response team neutralized the active smear campaign!',
          type: 'success',
        });
      }
    }

    this.eventBus.emit('ui:message', {
      text: `${def.name} activated! -$${def.cost.toLocaleString()}`,
      type: 'success',
    });
    this.eventBus.emit('rival:defensePurchased', { type, name: def.name, cost: def.cost });
    return true;
  }

  // -- Public Getters: Threat & Defenses ---------------------------------

  /**
   * Get Victor's current threat level label based on player reputation.
   */
  getThreatLevel() {
    const rep = this.state.reputation;
    if (rep >= 80) return { label: 'Desperate Enemy', color: '#ff004d' };
    if (rep >= 65) return { label: 'Active Rival', color: '#ffa300' };
    if (rep >= 50) return { label: 'Emerging Threat', color: '#ffec27' };
    if (rep >= 30) return { label: 'Minor Nuisance', color: '#888' };
    return { label: 'Disinterested', color: '#555' };
  }

  /**
   * Get current rival defenses state for UI display.
   */
  getDefenses() {
    this._ensureRivalDefenses();
    return this.state._rivalDefenses;
  }

  /**
   * Get defense definitions for UI (costs, names, etc.).
   */
  getDefenseDefs() {
    return RIVAL_DEFENSE_DEFS;
  }

  /**
   * Get the sabotage damage multiplier. Scales with season for escalating
   * difficulty (~15% harder per season). Reduced by 30% when Victor's
   * reducedSabotage flag is active (from Victor relationship tier 2).
   */
  getSabotageDamageMultiplier() {
    const season = this.state.season ?? 1;
    const seasonScale = 1 + (season - 1) * 0.15;
    const reductionFlag = this.state.storyFlags?.reducedSabotage ?? 1.0;
    return seasonScale * reductionFlag;
  }

  // -- Public getters ---------------------------------------------------

  /** Get current rival stadium info for display. */
  getRivalInfo() {
    return {
      name: 'Glendale Grizzlies',
      owner: 'Victor',
      rep: this.state.rivalRep ?? 60,
      attendance: this._estimateRivalAttendance(),
    };
  }

  _estimateRivalAttendance() {
    const rivalRep = this.state.rivalRep ?? 60;
    const base = 18000; // Grizzlies have a slightly larger stadium
    return Math.floor(base * (rivalRep / 100) * (0.85 + Math.random() * 0.15));
  }
}
