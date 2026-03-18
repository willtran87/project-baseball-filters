/**
 * ObjectivesPanel -- Toggleable panel showing player goals and progress.
 *
 * Sections:
 *   1. Ultimate Goal (reach Major League 86+ rep, host championship)
 *   2. Next Milestone (next reputation tier and its unlocks)
 *   3. Today's Goal (daily objective from ProgressionSystem)
 *   4. Streak (quality streak tracking)
 *   5. Rivalry (Victor threat level, counter-strategies, active defenses)
 *   6. Story (current chapter and NPC storylines)
 */

const UNLOCK_LABELS = {
  tier2Upgrades: 'Tier 2 Filter Upgrades',
  tier3Upgrades: 'Tier 3 Filter Upgrades',
  tier4Upgrades: 'Tier 4 Filter Upgrades',
  luxuryBoxWing: 'Luxury Box Wing',
  luxuryWing: 'Luxury Box Wing',
  pressBox: 'Press Box',
  secondCrew: 'Second Crew Member',
  thirdCrew: 'Third Crew Member',
  weatherStation: 'Weather Station',
  undergroundHub: 'Underground Hub',
  automationTools: 'Automation Systems',
  automation: 'Automation Systems',
  premiumSponsors: 'Premium Sponsors',
  championshipEligible: 'Championship Eligibility',
  fullAutomation: 'Full Automation',
};

export class ObjectivesPanel {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this._el = null;
    this._visible = false;
    this._inspectionWarningEmitted = false; // track per-inspection toast

    this.eventBus.on('ui:toggleObjectives', () => this.toggle());
    this.eventBus.on('ui:closeObjectives', () => this.hide());
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._visible) {
        this.hide();
        if (result) result.closed = true;
      }
    });

    // Auto-refresh when visible
    this.eventBus.on('game:newDay', () => { if (this._visible) this._render(); });
    this.eventBus.on('progression:objectiveComplete', () => { if (this._visible) this._render(); });
  }

  toggle() {
    if (this._visible) this.hide(); else this.show();
  }

  show() {
    this.eventBus.emit('ui:closeAllPanels');
    this.hide();
    this._visible = true;
    this._el = document.createElement('div');
    this._el.id = 'objectives-panel';
    this._el.style.cssText = `
      position: absolute; top: 24px; left: 8%; right: 8%; bottom: 24px;
      background: linear-gradient(180deg, rgba(15,10,5,0.97), rgba(8,8,24,0.97));
      border: 2px solid #1a2a4a;
      border-radius: 4px;
      font-family: monospace; color: #e0e0e0;
      font-size: 14px; z-index: 30;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(26,42,74,0.2);
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

  _render() {
    if (!this._el) return;
    const s = this.state;
    const rep = Math.floor(s.reputation);

    // --- Header ---
    const header = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:2px solid #1a2a4a;background:rgba(26,42,74,0.08)">
        <span style="color:#ffec27;font-size:16px;letter-spacing:2px">\u{1f3c6} GAME PLAN</span>
        <span data-action="close" style="cursor:pointer;color:#888;font-size:14px;padding:0 6px" title="Close (O)">\u2715</span>
      </div>
    `;

    // --- 1. Ultimate Goal ---
    const goalTarget = 86;
    const goalPct = Math.min(100, Math.floor((rep / goalTarget) * 100));
    const goalBarColor = goalPct > 70 ? '#00e436' : goalPct > 40 ? '#ffec27' : '#ff004d';
    const championshipDone = !!s.championshipHosted;
    const ultimateGoal = `
      <div style="padding:10px 12px;border-bottom:1px solid #333">
        <div style="color:#ffec27;font-size:12px;letter-spacing:1px;margin-bottom:4px">\u{1f3c6} ULTIMATE GOAL</div>
        <div style="color:#c0c0d0;font-size:12px;margin-bottom:6px">
          Take the Raptors from the minors to Major League status and host the championship at Ridgemont
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="color:#888;font-size:11px;min-width:60px">Reputation</span>
          <span style="flex:1;height:8px;background:#222;border:1px solid #444;border-radius:2px;overflow:hidden">
            <span style="display:block;width:${goalPct}%;height:100%;background:${goalBarColor};transition:width 0.3s"></span>
          </span>
          <span style="color:${goalBarColor};font-size:11px;min-width:50px;text-align:right">${rep} / ${goalTarget}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="color:#888;font-size:11px;min-width:60px">Championship</span>
          <span style="color:${championshipDone ? '#00e436' : '#888'};font-size:11px">${championshipDone ? '\u2713 Hosted' : '\u2717 Not yet hosted'}</span>
        </div>
      </div>
    `;

    // --- 2. Next Milestone ---
    const tiers = s.config?.reputation?.tiers ?? [];
    const currentTier = tiers.filter(t => rep >= t.min).pop();
    const nextTier = tiers.find(t => t.min > rep);
    let milestoneSection;
    if (nextTier) {
      const tierMin = currentTier?.min ?? 0;
      const tierRange = nextTier.min - tierMin;
      const tierProgress = rep - tierMin;
      const tierPct = tierRange > 0 ? Math.min(100, Math.floor((tierProgress / tierRange) * 100)) : 100;
      const unlockList = (nextTier.unlocks ?? [])
        .map(u => UNLOCK_LABELS[u] ?? u)
        .join(', ') || 'None';
      milestoneSection = `
        <div style="padding:10px 12px;border-bottom:1px solid #333">
          <div style="color:#29adff;font-size:12px;letter-spacing:1px;margin-bottom:4px">\u25c6 NEXT MILESTONE</div>
          <div style="color:#c0c0d0;font-size:12px;margin-bottom:2px">
            <span style="color:#fff">${nextTier.name}</span> (requires ${nextTier.min}+ reputation)
          </div>
          <div style="color:#888;font-size:11px;margin-bottom:6px">Unlocks: ${unlockList}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="color:#888;font-size:11px;min-width:60px">Progress</span>
            <span style="flex:1;height:6px;background:#222;border:1px solid #444;border-radius:2px;overflow:hidden">
              <span style="display:block;width:${tierPct}%;height:100%;background:#29adff;transition:width 0.3s"></span>
            </span>
            <span style="color:#29adff;font-size:11px;min-width:50px;text-align:right">${rep} / ${nextTier.min}</span>
          </div>
        </div>
      `;
    } else {
      milestoneSection = `
        <div style="padding:10px 12px;border-bottom:1px solid #333">
          <div style="color:#29adff;font-size:12px;letter-spacing:1px;margin-bottom:4px">\u25c6 NEXT MILESTONE</div>
          <div style="color:#00e436;font-size:12px">\u2713 Maximum tier reached!</div>
        </div>
      `;
    }

    // --- 3. Today's Goal ---
    const daily = s._progressionSystem?._dailyObjective ?? null;
    const currentInning = s.inning ?? 1;
    let dailySection;
    if (daily) {
      const statusColor = daily.completed ? '#00e436' : '#ffec27';
      const statusText = daily.completed ? '\u2713 Completed!' : '\u25cb In progress';

      // Urgency: late inning + not yet completed
      const isLateInning = currentInning >= 6 && !daily.completed;
      // Progress-based badge
      const dailyProgress = daily.progress ?? 0;
      const dailyTarget = daily.target ?? 1;
      const dailyPct = dailyTarget > 0 ? dailyProgress / dailyTarget : 0;
      const isAlmostDone = !daily.completed && dailyPct >= 0.8;
      // Deadline urgency (for multi-day objectives)
      const daysLeft = daily.daysRemaining ?? null;
      const isDueSoon = daysLeft !== null && daysLeft <= 2 && !daily.completed;

      let urgencyBadge = '';
      let borderStyle = 'border-bottom:1px solid #333';
      if (daily.completed) {
        // no urgency
      } else if (isLateInning || isDueSoon) {
        urgencyBadge = `<span style="color:#ff004d;font-size:10px;font-weight:bold;background:rgba(255,0,77,0.15);padding:1px 6px;border-radius:2px;margin-left:6px">[URGENT]</span>`;
        borderStyle = 'border-bottom:1px solid #333;border-left:3px solid #ff004d';
      } else if (isAlmostDone) {
        urgencyBadge = `<span style="color:#00e436;font-size:10px;font-weight:bold;background:rgba(0,228,54,0.12);padding:1px 6px;border-radius:2px;margin-left:6px">Almost done!</span>`;
        borderStyle = 'border-bottom:1px solid #333;border-left:3px solid #00e436';
      }

      const dueSoonNote = isDueSoon ? `<div style="color:#ffa300;font-size:10px;margin-top:2px">Due soon! ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining</div>` : '';

      dailySection = `
        <div style="padding:10px 12px;${borderStyle}">
          <div style="color:#ffa300;font-size:12px;letter-spacing:1px;margin-bottom:4px">\u{1f3af} TODAY'S LINEUP${urgencyBadge}</div>
          <div style="color:#e0e0e0;font-size:12px;margin-bottom:4px">${daily.description}</div>
          ${dueSoonNote}
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="color:#888;font-size:11px">Reward: <span style="color:#00e436">+$${daily.reward}</span>${daily.repBonus ? ` <span style="color:#29adff">+${daily.repBonus} rep</span>` : ''}</span>
            <span style="color:${statusColor};font-size:11px">${statusText}</span>
          </div>
        </div>
      `;
    } else {
      dailySection = `
        <div style="padding:10px 12px;border-bottom:1px solid #333">
          <div style="color:#ffa300;font-size:12px;letter-spacing:1px;margin-bottom:4px">\u{1f3af} TODAY'S LINEUP</div>
          <div style="color:#888;font-size:12px">No special assignment today — keep the systems running smooth</div>
        </div>
      `;
    }

    // --- 4. Streak ---
    const streak = s.goodDayStreak ?? s._progressionSystem?._goodDayStreak ?? 0;
    const bestStreak = s.bestStreak ?? s._progressionSystem?._bestStreak ?? 0;
    let nextStreakThreshold, nextStreakReward;
    if (streak < 3) {
      nextStreakThreshold = 3; nextStreakReward = '+$500 bonus';
    } else if (streak < 7) {
      nextStreakThreshold = 7; nextStreakReward = '+$2,000 bonus + rep boost';
    } else if (streak < 14) {
      nextStreakThreshold = 14; nextStreakReward = '+$5,000 bonus + major rep boost';
    } else {
      const nextMilestone = Math.ceil((streak + 1) / 10) * 10;
      nextStreakThreshold = nextMilestone; nextStreakReward = '+$3,000 milestone bonus';
    }
    const streakBarPct = nextStreakThreshold > 0 ? Math.min(100, Math.floor((streak / nextStreakThreshold) * 100)) : 0;
    const streakAlmostDone = streakBarPct >= 80;
    const streakBadge = streakAlmostDone
      ? `<span style="color:#00e436;font-size:10px;font-weight:bold;background:rgba(0,228,54,0.12);padding:1px 6px;border-radius:2px;margin-left:6px">Almost there!</span>`
      : '';
    const streakBorderStyle = streakAlmostDone
      ? 'border-bottom:1px solid #333;border-left:3px solid #00e436'
      : 'border-bottom:1px solid #333';
    const streakSection = `
      <div style="padding:10px 12px;${streakBorderStyle}">
        <div style="color:#ff77a8;font-size:12px;letter-spacing:1px;margin-bottom:4px">\u{1f525} WIN STREAK${streakBadge}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="color:#e0e0e0;font-size:12px">Current: <span style="color:#ffec27;font-weight:bold">${streak}</span> clean games</span>
          <span style="color:#888;font-size:11px">Best: ${bestStreak} games</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="color:#888;font-size:11px;min-width:60px">Next at ${nextStreakThreshold}</span>
          <span style="flex:1;height:6px;background:#222;border:1px solid #444;border-radius:2px;overflow:hidden">
            <span style="display:block;width:${streakBarPct}%;height:100%;background:#ff77a8;transition:width 0.3s"></span>
          </span>
          <span style="color:#888;font-size:10px">${nextStreakReward}</span>
        </div>
      </div>
    `;

    // --- 5. Inspection Countdown ---
    const nextInsp = s.nextInspectionDay ?? 999;
    const daysUntilInsp = Math.max(0, nextInsp - (s.gameDay ?? 0));
    const lastGrade = s.lastInspectionGrade ?? '--';
    // Estimate grade from domain health averages
    const { grade: estGrade, avgHealth } = ObjectivesPanel.getEstimatedInspectionGrade(s);
    const estGradeColor = estGrade === 'A' ? '#00e436' : estGrade === 'B' ? '#29adff' : estGrade === 'C' ? '#ffec27' : '#ff004d';
    const urgencyColor = daysUntilInsp <= 3 ? '#ff004d' : daysUntilInsp <= 7 ? '#ffa300' : '#888';
    const showEstimate = daysUntilInsp <= 3;
    const inspUrgencyBadge = daysUntilInsp <= 3
      ? `<span style="color:#ff004d;font-size:10px;font-weight:bold;background:rgba(255,0,77,0.15);padding:1px 6px;border-radius:2px;margin-left:6px">[URGENT]</span>`
      : daysUntilInsp <= 7
        ? `<span style="color:#ffa300;font-size:10px;font-weight:bold;background:rgba(255,163,0,0.12);padding:1px 6px;border-radius:2px;margin-left:6px">Due soon!</span>`
        : '';
    const inspBorderStyle = daysUntilInsp <= 3
      ? 'border-bottom:1px solid #333;border-left:3px solid #ff004d'
      : daysUntilInsp <= 7
        ? 'border-bottom:1px solid #333;border-left:3px solid #ffa300'
        : 'border-bottom:1px solid #333';
    const inspectionSection = `
      <div style="padding:10px 12px;${inspBorderStyle}">
        <div style="color:#c8c8c8;font-size:12px;letter-spacing:1px;margin-bottom:4px">\u{1f50d} HEALTH INSPECTION${inspUrgencyBadge}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="color:#e0e0e0;font-size:12px">Next inspection in: <span style="color:${urgencyColor};font-weight:bold">${daysUntilInsp} days</span></span>
          <span style="color:#888;font-size:11px">Last grade: <span style="font-weight:bold">${lastGrade}</span></span>
        </div>
        ${showEstimate ? `
          <div style="color:#e0e0e0;font-size:11px;padding:6px 8px;background:rgba(255,255,255,0.03);border-left:2px solid ${estGradeColor}">
            Estimated grade: <span style="color:${estGradeColor};font-weight:bold">${estGrade}</span>
            <span style="color:#888;margin-left:6px">(avg domain health: ${Math.floor(avgHealth)}%)</span>
          </div>
        ` : ''}
      </div>
    `;

    // Emit toast warning when inspection is 3 days away (once per inspection)
    if (daysUntilInsp <= 3 && daysUntilInsp > 0 && !this._inspectionWarningEmitted) {
      this._inspectionWarningEmitted = true;
      this.eventBus.emit('ui:message', {
        text: `Inspection in ${daysUntilInsp} day${daysUntilInsp !== 1 ? 's' : ''}! Estimated grade: ${estGrade} (avg health: ${Math.floor(avgHealth)}%)`,
        type: 'warning',
      });
    }
    // Reset warning flag when a new inspection is scheduled (days jump back up)
    if (daysUntilInsp > 3) {
      this._inspectionWarningEmitted = false;
    }

    // --- 6. Rivalry ---
    const rivalrySection = this._renderRivalrySection(s);

    // --- 6. Story ---
    const chapter = s.storyChapter ?? 1;
    const chapterNames = [
      '', 'New Kid on the Field', 'Rising Through the Ranks',
      'Storm Warning', 'Into the Fire', 'Championship',
    ];
    const chapterName = chapterNames[chapter] ?? `Chapter ${chapter}`;
    const notesFound = s.hanksNotes?.length ?? 0;
    const storySection = `
      <div style="padding:10px 12px">
        <div style="color:#cc44cc;font-size:12px;letter-spacing:1px;margin-bottom:4px">\u{1f4d6} STORY</div>
        <div style="color:#e0e0e0;font-size:12px;margin-bottom:4px">
          Chapter ${chapter}: <span style="color:#ff77a8">${chapterName}</span>
        </div>
        <div style="color:#888;font-size:11px">
          Hank's Notes: ${notesFound} / 8 found
        </div>
      </div>
    `;

    // Sort time-sensitive sections: urgent items bubble up after the fixed top sections
    const urgentSections = [];
    const normalSections = [];

    // Daily objective urgency check
    const dailyIsUrgent = daily && !daily.completed && (currentInning >= 6 || (daily.daysRemaining != null && daily.daysRemaining <= 2));
    (dailyIsUrgent ? urgentSections : normalSections).push(dailySection);

    // Inspection urgency check
    const inspIsUrgent = daysUntilInsp <= 3;
    (inspIsUrgent ? urgentSections : normalSections).push(inspectionSection);

    // Streak and rivalry are not time-critical for sorting
    normalSections.push(streakSection);
    if (rivalrySection) normalSections.push(rivalrySection);

    this._el.innerHTML = header + `
      <div style="flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#1a2a4a #111">
        ${ultimateGoal}
        ${milestoneSection}
        ${urgentSections.join('')}
        ${normalSections.join('')}
        ${storySection}
      </div>
    `;

    // Close button
    this._el.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      this.eventBus.emit('ui:click');
      this.hide();
    });

    // Defense purchase buttons
    this._el.querySelectorAll('[data-action="buy-defense"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.eventBus.emit('ui:click');
        const defenseType = btn.dataset.defenseType;
        this.eventBus.emit('rival:purchaseDefense', { type: defenseType });
        // Re-render after a brief delay to show updated state
        setTimeout(() => this._render(), 50);
      });
    });
  }

  _renderRivalrySection(s) {
    // Only show rivalry section from chapter 2+
    const chapter = s.storyChapter ?? 1;
    if (chapter < 2) return '';

    // Threat level
    let threatLabel = 'Unknown';
    let threatColor = '#555';
    const playerRep = s.reputation;
    if (playerRep >= 80) { threatLabel = 'Desperate Enemy'; threatColor = '#ff004d'; }
    else if (playerRep >= 65) { threatLabel = 'Active Rival'; threatColor = '#ffa300'; }
    else if (playerRep >= 50) { threatLabel = 'Emerging Threat'; threatColor = '#ffec27'; }
    else if (playerRep >= 30) { threatLabel = 'Minor Nuisance'; threatColor = '#888'; }
    else { threatLabel = 'Disinterested'; threatColor = '#555'; }

    // Active effects
    const smearDays = s._smearCampaignDays ?? 0;
    const supplyDays = s._supplyCostDays ?? 0;
    const inspPenalty = (s._nextInspectionPenalty ?? 1.0) !== 1.0;
    let activeEffectsHtml = '';
    if (smearDays > 0 || supplyDays > 0 || inspPenalty) {
      activeEffectsHtml += '<div style="margin-top:6px;margin-bottom:4px">';
      if (smearDays > 0) {
        activeEffectsHtml += `<div style="color:#ff6b35;font-size:11px">Smear Campaign: ${smearDays}d remaining (-1 rep/day)</div>`;
      }
      if (supplyDays > 0) {
        const mult = s._supplyCostMultiplier ?? 1.0;
        activeEffectsHtml += `<div style="color:#ff6b35;font-size:11px">Supply Disruption: ${supplyDays}d remaining (+${Math.round((mult - 1) * 100)}% filter cost)</div>`;
      }
      if (inspPenalty) {
        activeEffectsHtml += '<div style="color:#ff6b35;font-size:11px">Inspector Bribe: next inspection 30% stricter</div>';
      }
      activeEffectsHtml += '</div>';
    }

    // Defenses
    const defenses = s._rivalDefenses ?? {};
    const defenseDefs = {
      securityUpgrade: { name: 'Security Upgrade', cost: 2000, desc: 'Blocks next sabotage, 10 days' },
      counterIntel: { name: 'Counter-Intel', cost: 3000, desc: 'Reveals next sabotage plan' },
      mediaResponse: { name: 'Media Response', cost: 1500, desc: 'Nullifies smear campaigns, 14 days' },
    };

    let defensesHtml = '<div style="margin-top:6px">';
    for (const [key, def] of Object.entries(defenseDefs)) {
      const state = defenses[key];
      const isActive = state?.active;
      const canAfford = s.money >= def.cost;

      if (isActive) {
        let statusText = 'Active';
        if (key === 'securityUpgrade' && state.daysLeft > 0) {
          statusText = `Active (${state.daysLeft}d)`;
        } else if (key === 'counterIntel' && state.revealedType) {
          statusText = `Revealed: ${state.revealedType}`;
        } else if (key === 'mediaResponse' && state.daysLeft > 0) {
          statusText = `Active (${state.daysLeft}d)`;
        }
        defensesHtml += `
          <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;margin-bottom:2px;background:rgba(0,228,54,0.08);border-left:2px solid #00e436">
            <span style="flex:1;color:#e0e0e0;font-size:11px">${def.name}</span>
            <span style="color:#00e436;font-size:11px">${statusText}</span>
          </div>
        `;
      } else {
        defensesHtml += `
          <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;margin-bottom:2px;background:rgba(255,255,255,0.02);border-left:2px solid #444">
            <span style="flex:1;color:#aaa;font-size:11px" title="${def.desc}">${def.name}</span>
            <span style="color:${canAfford ? '#00e436' : '#555'};font-size:11px">$${def.cost.toLocaleString()}</span>
            <button data-action="buy-defense" data-defense-type="${key}"
              style="background:${canAfford ? '#1a3a2a' : '#2a2a2a'};color:${canAfford ? '#00e436' : '#555'};
              border:1px solid ${canAfford ? '#3a6a4a' : '#333'};padding:1px 8px;font-family:monospace;
              cursor:${canAfford ? 'pointer' : 'not-allowed'};font-size:10px">BUY</button>
          </div>
        `;
      }
    }
    defensesHtml += '</div>';

    return `
      <div style="padding:10px 12px;border-bottom:1px solid #333">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="color:#333366;font-size:12px;letter-spacing:1px">\u2694 RIVALRY</span>
          <span style="color:${threatColor};font-size:11px;font-weight:bold">${threatLabel}</span>
        </div>
        <div style="color:#888;font-size:11px;margin-bottom:2px">
          Victor Salazar -- Glendale Grizzlies (Rep: ${Math.floor(s.rivalRep ?? 60)})
        </div>
        ${activeEffectsHtml}
        <div style="color:#aaa;font-size:11px;margin-top:4px;margin-bottom:2px">Counter-Strategies:</div>
        ${defensesHtml}
      </div>
    `;
  }

  /**
   * Calculate estimated inspection grade from average domain health.
   * Thresholds: A (>80%), B (>60%), C (>40%), D (>20%), F (<=20%).
   * @param {object} state - game state with domainHealth map
   * @returns {{ grade: string, avgHealth: number }}
   */
  static getEstimatedInspectionGrade(state) {
    const domHealth = state.domainHealth ?? {};
    const healthVals = Object.values(domHealth);
    const avgHealth = healthVals.length > 0
      ? healthVals.reduce((a, b) => a + b, 0) / healthVals.length
      : 50;
    let grade;
    if (avgHealth > 80) grade = 'A';
    else if (avgHealth > 60) grade = 'B';
    else if (avgHealth > 40) grade = 'C';
    else if (avgHealth > 20) grade = 'D';
    else grade = 'F';
    return { grade, avgHealth };
  }
}
