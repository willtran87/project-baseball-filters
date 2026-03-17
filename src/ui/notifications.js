/**
 * Notifications — Toast-style notification popups and confirmation dialogs.
 *
 * Displays event notifications, achievement unlocks, warnings,
 * and system messages as temporary toasts that fade out.
 * Also provides a confirmation dialog for dangerous actions.
 */

/**
 * Show a confirmation dialog before executing an action.
 * @param {HTMLElement} container - Parent element for the dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback if confirmed
 * @param {string} [confirmLabel='CONFIRM'] - Confirm button text
 */
export function showConfirmDialog(container, message, onConfirm, confirmLabel = 'CONFIRM') {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 55; font-family: monospace;
  `;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: linear-gradient(180deg, rgba(15,10,5,0.98), rgba(8,8,24,0.98));
    border: 2px solid #8b4513;
    border-radius: 4px;
    padding: 16px 20px;
    max-width: 320px;
    text-align: center;
    box-shadow: 0 0 20px rgba(139,69,19,0.4);
  `;

  dialog.innerHTML = `
    <div style="color:#ffa300;font-size:12px;margin-bottom:4px;letter-spacing:1px">\u26a0 CONFIRM</div>
    <div style="color:#e0e0e0;font-size:11px;margin-bottom:14px;line-height:1.5">${message}</div>
    <div style="display:flex;gap:8px;justify-content:center">
      <button data-confirm="yes" style="
        background:linear-gradient(180deg,#3a2a1a,#2a1a0a);color:#ff8800;
        border:1px solid #6a4a2a;padding:6px 16px;font-family:monospace;
        font-size:11px;cursor:pointer;letter-spacing:1px;
      ">${confirmLabel}</button>
      <button data-confirm="no" style="
        background:linear-gradient(180deg,#1a1a2a,#0d0d1a);color:#888;
        border:1px solid #3a3a5a;padding:6px 16px;font-family:monospace;
        font-size:11px;cursor:pointer;
      ">CANCEL</button>
    </div>
  `;

  overlay.appendChild(dialog);
  container.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-confirm]');
    if (!btn) return;
    overlay.remove();
    if (btn.dataset.confirm === 'yes') {
      onConfirm();
    }
  });
}

/**
 * TutorialManager — Contextual onboarding hints for new players.
 *
 * Shows sequential tutorial tips based on game progress.
 * Tips are shown once and dismissed on click. Persists via state.tutorialSeen.
 */
export class TutorialManager {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this._el = null;
    this._shown = new Set(state.tutorialSeen ?? []);

    // Tutorial hints keyed by trigger
    this._hints = [
      {
        id: 'welcome',
        trigger: 'game:resume',
        condition: () => this.state.gameDay <= 1 && this.state.filters.length === 0,
        title: 'Welcome to Ridgemont Stadium!',
        text: 'You\'re Casey "Pipes" Peralta, the new head of filtration. Click a glowing VENT SLOT to install your first filter, or press S to open the Dugout Supply Shop. Keep the air clean, the water pure, and the drains flowing — 15,000 fans are counting on you.',
        delay: 1500,
      },
      {
        id: 'first_filter',
        trigger: 'filter:added',
        condition: () => this.state.filters.length === 1,
        title: 'First Filter Installed!',
        text: 'You\'re on the board! Filters degrade over time like a pitcher\'s arm — keep an eye on the condition bars. Click a filter to inspect and repair it. Cover all four domains (air, water, HVAC, drainage) to keep the stadium humming.',
      },
      {
        id: 'zone_hint',
        trigger: 'filter:added',
        condition: () => this.state.filters.length === 3,
        title: 'Explore the Stadium',
        text: 'Press TAB to visit other stadium zones — the Concourse, Mechanical Room, and Underground all have vent slots waiting for filters. Think of it as covering every base.',
      },
      {
        id: 'first_break',
        trigger: 'filter:broken',
        condition: () => true,
        title: 'Equipment Down!',
        text: 'A filter has struck out! Click it and choose Repair, or complete the repair mini-game for a free fix. Broken equipment hurts your reputation — Maggie won\'t be happy.',
      },
      {
        id: 'low_money',
        trigger: 'game:newDay',
        condition: () => this.state.money < 300 && this.state.gameDay > 3,
        title: 'Budget Squeeze',
        text: 'Running low on funds? Open the DEALS panel (C key) to sign sponsor contracts. Fiona Park and her sponsors pay per game day — every dollar counts when you\'re rebuilding from the Browntide.',
      },
      {
        id: 'staff_hint',
        trigger: 'game:newDay',
        condition: () => this.state.gameDay >= 3 && (!this.state.staffList || this.state.staffList.length === 0),
        title: 'Build Your Crew',
        text: 'Press F to open the Crew Roster. Every ballpark needs a grounds crew — hire staff to speed up repairs and boost filter efficiency. Rusty can\'t do it all alone.',
      },
      {
        id: 'keyboard_shortcuts',
        trigger: 'game:newDay',
        condition: () => this.state.gameDay === 2,
        title: 'Dugout Controls',
        text: 'S = Shop | F = Crew | J = Hank\'s Journal | N = Ridgemont Herald | C = Sponsor Deals | SPACE = Timeout | 1-3 = Speed | M = Mute',
      },
      {
        id: 'domain_health',
        trigger: 'consequence:update',
        condition: () => {
          const h = this.state.domainHealth ?? {};
          return Object.values(h).some(v => v < 60);
        },
        title: 'System Health Dropping!',
        text: 'Check the health bars at the bottom of the screen — they show Air, Water, HVAC, and Drainage quality. Install and maintain filters in each domain to keep them green. When bars turn yellow or red, consequences kick in: lost revenue, fan complaints, and reputation hits.',
      },
      {
        id: 'economy_tip',
        trigger: 'game:newDay',
        condition: () => this.state.gameDay >= 5 && this.state.income > 0,
        title: 'Reading the Scoreboard',
        text: 'The top bar shows your budget and net income per inning. Green means you\'re earning, red means you\'re losing money. Hover over the dollar amount for a full income breakdown. Watch your balance — two bad seasons and the owner pulls the plug.',
      },
      // ── R1-R4 Feature Hints ─────────────────────────────────────────
      {
        id: 'expansion_unlocked',
        trigger: 'expansion:unlocked',
        condition: () => true,
        title: 'Stadium Expansions Available!',
        text: 'Stadium expansions are now available! Press X to view and purchase upgrades that increase capacity and revenue. Bigger stadium, bigger crowds, bigger paydays.',
      },
      {
        id: 'economy_panel_hint',
        trigger: 'ui:toggleShop',
        condition: () => this.state.gameDay >= 2,
        title: 'Track Your Finances',
        text: 'Tip: Press E to view your financial breakdown and track income vs expenses. Knowing where the money goes is half the battle.',
      },
      {
        id: 'upgrade_tab_hint',
        trigger: 'filter:added',
        condition: () => this.state.filters.length >= 3,
        title: 'Upgrade Your Filters',
        text: 'Check the UPGRADES tab in the Shop to see which filters can be upgraded to better tiers. Higher-tier filters last longer and perform better under pressure.',
      },
      {
        id: 'loan_hint',
        trigger: 'game:newDay',
        condition: () => this.state.money < 1000 && this.state.gameDay > 3,
        title: 'Emergency Funding',
        text: 'Running low on funds? Emergency loans are available — check the Loans panel in the Economy view (E key). Borrow smart and pay it back before interest piles up.',
      },
      {
        id: 'off_season_hint',
        trigger: 'game:seasonEnd',
        condition: () => true,
        title: 'Off-Season Begins',
        text: 'Off-season: 20 days to repair, upgrade, and plan with reduced costs. No game revenue during this time, so spend wisely and get ready for next season.',
      },
      {
        id: 'weather_hint',
        trigger: 'event:started',
        condition: () => {
          const evt = this.state.activeEvent;
          return evt && evt.category === 'weather';
        },
        title: 'Weather Alert!',
        text: 'Weather affects filter degradation differently by domain. Rain hits drainage hard, heat stresses HVAC, and dust storms clog air filters. Check your vulnerable systems and reinforce before damage spreads.',
      },
      // ── Onboarding Expansion Hints ──────────────────────────────────
      {
        id: 'tutorial_season',
        trigger: 'game:newDay',
        condition: () => this.state.gameDay >= 5 && this.state.gameDay <= 10,
        title: 'The Long Season',
        text: 'Each season is 80 game days. At season\'s end, you\'ll get a report card and enter off-season — a 20-day planning period with reduced costs. Pace yourself like a veteran starter.',
      },
      {
        id: 'tutorial_staff_hired',
        trigger: 'staff:hired',
        condition: () => (this.state.staffList?.length ?? 0) === 1,
        title: 'First Crew Member!',
        text: 'Staff members maintain filters and reduce degradation. Assign them to domains in the Crew panel (H). A good crew keeps the lights on when things get rough.',
      },
      {
        id: 'tutorial_first_contract',
        trigger: 'ui:toggleContracts',
        condition: () => this.state.activeContracts.length === 0,
        title: 'Sponsor Deals',
        text: 'Contracts provide bonus income but require minimum domain health. Breach penalties are steep — only accept what you can maintain. Think of it as a no-trade clause.',
      },
      {
        id: 'tutorial_research',
        trigger: 'ui:toggleResearch',
        condition: () => {
          const rp = this.state.researchProgress ?? {};
          return (!rp.completedNodes || rp.completedNodes.length === 0) && !rp.activeResearch;
        },
        title: 'Research Lab',
        text: 'Research unlocks permanent upgrades. Each tech takes several game days to complete. Choose wisely — you can only research one at a time. It\'s a long game, not a sprint.',
      },
      {
        id: 'tutorial_npc',
        trigger: 'npc:startChat',
        condition: () => true,
        title: 'Meet the Crew',
        text: 'NPCs offer story, advice, and gameplay bonuses. Chat daily to build relationships — higher tiers unlock powerful perks. Every ballpark legend starts with a conversation.',
      },
      {
        id: 'tutorial_rival',
        trigger: 'rival:victorEncounter',
        condition: () => true,
        title: 'Rival Alert!',
        text: 'Victor Harrison runs the rival stadium. He\'ll sabotage your operations — keep your filters healthy and staff alert to minimize damage. Don\'t let him steal your thunder.',
      },
      {
        id: 'tutorial_rep_25',
        trigger: 'state:reputation',
        condition: () => this.state.reputation >= 25 && this.state.reputation < 50,
        title: 'Reputation Rising!',
        text: 'Your reputation is growing! Higher reputation unlocks better filters, contracts, and expansions. Keep the stadium clean and the fans will keep coming back.',
      },
      {
        id: 'tutorial_rep_50',
        trigger: 'state:reputation',
        condition: () => this.state.reputation >= 50 && this.state.reputation < 75,
        title: 'Halfway to Legendary!',
        text: 'Halfway to legendary! New filter tiers and premium contracts are now available. The press is starting to take notice of Ridgemont Stadium.',
      },
      {
        id: 'tutorial_rep_75',
        trigger: 'state:reputation',
        condition: () => this.state.reputation >= 75,
        title: 'Elite Territory!',
        text: 'Elite territory! The best equipment and most lucrative deals are within reach. Ridgemont Stadium is becoming the jewel of the league.',
      },
      {
        id: 'tutorial_minigame',
        trigger: 'minigame:start',
        condition: () => true,
        title: 'Repair Mini-Game!',
        text: 'Repair mini-games let you earn bonus condition. Match the timing for best results, or skip for a standard repair. It\'s like batting practice — timing is everything.',
      },
    ];

    // Wire up triggers
    const triggers = new Set(this._hints.map(h => h.trigger));
    for (const trigger of triggers) {
      this.eventBus.on(trigger, () => this._checkHints(trigger));
    }
  }

  _checkHints(trigger) {
    for (const hint of this._hints) {
      if (hint.trigger !== trigger) continue;
      if (this._shown.has(hint.id)) continue;
      if (!hint.condition()) continue;

      this._shown.add(hint.id);
      this.state.tutorialSeen = [...this._shown];

      const delay = hint.delay ?? 500;
      setTimeout(() => this._showHint(hint), delay);
      return; // one hint at a time
    }
  }

  _showHint(hint) {
    if (this._el) this._el.remove();

    this._el = document.createElement('div');
    this._el.style.cssText = `
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      max-width: 340px; padding: 14px 18px;
      background: linear-gradient(180deg, rgba(15,10,5,0.97), rgba(8,8,24,0.97));
      border: 2px solid #ffec27;
      border-radius: 4px;
      font-family: monospace; color: #e0e0e0;
      font-size: 11px; z-index: 45;
      box-shadow: 0 0 20px rgba(255,236,39,0.3);
      animation: tutorialGlow 2s ease-in-out infinite;
      text-align: center;
    `;

    this._el.innerHTML = `
      <div style="color:#ffec27;font-size:12px;margin-bottom:6px;letter-spacing:1px">\u{1f4a1} ${hint.title}</div>
      <div style="color:#c0c0d0;font-size:10px;line-height:1.5;margin-bottom:10px">${hint.text}</div>
      <button style="
        background:linear-gradient(180deg,#2a3a1a,#1a2a0a);color:#00e436;
        border:1px solid #3a6a3a;padding:4px 20px;font-family:monospace;
        font-size:10px;cursor:pointer;letter-spacing:1px;
      ">GOT IT</button>
    `;

    this._el.querySelector('button').addEventListener('click', () => {
      this._el.remove();
      this._el = null;
    });

    this.container.appendChild(this._el);

    // Auto-dismiss after 12 seconds
    setTimeout(() => {
      if (this._el) {
        this._el.remove();
        this._el = null;
      }
    }, 12000);
  }
}

export class NotificationManager {
  constructor(container, eventBus) {
    this.eventBus = eventBus;
    this._toasts = [];
    this._maxToasts = 5;
    this._defaultDuration = 4000; // ms

    // Container for toast elements
    this._el = document.createElement('div');
    this._el.id = 'notifications';
    this._el.style.cssText = `
      position: absolute; top: 28px; right: 8px;
      display: flex; flex-direction: column; gap: 4px;
      pointer-events: none; z-index: 25;
      max-width: 220px;
    `;
    container.appendChild(this._el);

    // Listen for notification events
    this.eventBus.on('ui:message', ({ text, type }) => this.show(text, type));
    this.eventBus.on('event:started', (evt) => {
      const isPositive = evt.category === 'positive' || evt.isPositive;
      this.show(`${isPositive ? '\u2b50' : '\u26a0'} ${evt.name}: ${evt.description}`, isPositive ? 'success' : 'event');
    });
    this.eventBus.on('progression:achievement', (m) => {
      // Show a more prominent celebration for achievements
      this.showCelebration(m.name, m.description);
    });
    this.eventBus.on('progression:unlock', (u) => this.show(`\u{1f513} Unlocked: ${u.feature}`, 'success'));
    this.eventBus.on('progression:tierChange', ({ to, from, promoted }) => {
      if (promoted && to?.name) {
        this.showCelebration(`Called Up to ${to.name}!`, `The Raptors have been promoted! Ridgemont Stadium moves up from ${from?.name ?? 'the minors'} to the ${to.name} league.`);
      } else if (!promoted && to?.name) {
        this.show(`Sent down to ${to.name}. Time to rally — the Raptors need a turnaround.`, 'danger');
      }
    });
    this.eventBus.on('filter:broken', (f) => this.show(`\u26a0 Equipment #${f.id} is out of the game! Click to repair before it costs you.`, 'danger'));
    this.eventBus.on('inspection:result', ({ grade }) => {
      const type = (grade === 'A' || grade === 'B') ? 'success' : 'danger';
      const icon = (grade === 'A' || grade === 'B') ? '\u2713' : '\u2716';
      this.show(`${icon} Health Inspection: Grade ${grade}`, type);
    });
    this.eventBus.on('game:newDay', ({ day }) => {
      if (day && day % 10 === 0) this.show(`\u26be Game ${day} — Keep the stadium humming through the stretch!`, 'info');
    });
    // Income milestone notifications
    this.eventBus.on('economy:inningEnd', ({ balance }) => {
      if (!this._lastBalanceMilestone) this._lastBalanceMilestone = 0;
      const milestones = [25000, 50000, 100000, 250000, 500000];
      for (const ms of milestones) {
        if (balance >= ms && this._lastBalanceMilestone < ms) {
          this._lastBalanceMilestone = ms;
          this.show(`$${ms.toLocaleString()} in the bank! Ridgemont's finances are rounding the bases.`, 'success');
          break;
        }
      }
    });

    // Story notifications with optional NPC mini-portrait
    this.eventBus.on('story:notification', ({ text, portrait }) => {
      this._storyPortrait = portrait ?? null;
      this.show(text, 'story');
    });

    this._storyPortrait = null;
    this._sprites = null; // set via setSprites()
  }

  /**
   * Provide sprite system reference for portrait rendering.
   */
  setSprites(sprites) {
    this._sprites = sprites;
  }

  /**
   * Draw an 8x8 region from a portrait sprite onto a mini canvas.
   */
  _drawMiniPortrait(canvas, portraitName) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 8, 8);

    const pixelData = this._sprites?.getPixelSprite(portraitName);
    if (pixelData && Array.isArray(pixelData)) {
      // Sample the face region (center-top 8x8 of a 64x64 portrait)
      const offsetX = 28;
      const offsetY = 10;
      for (let y = 0; y < 8; y++) {
        const row = pixelData[y + offsetY];
        if (!row) continue;
        for (let x = 0; x < 8; x++) {
          const color = row[x + offsetX];
          if (color && color !== '' && color !== null) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      return;
    }

    // Fallback: tiny colored square
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#888';
    ctx.fillRect(2, 1, 4, 4);
    ctx.fillRect(1, 5, 6, 3);
  }

  /**
   * Show a toast notification.
   * @param {string} text - Message text
   * @param {string} type - One of: info, success, warning, danger, event, achievement
   */
  show(text, type = 'info') {
    // Remove oldest if at capacity
    while (this._toasts.length >= this._maxToasts) {
      this._removeOldest();
    }

    const toast = document.createElement('div');
    const colors = {
      info:        { bg: 'rgba(41,173,255,0.15)', border: '#29adff', text: '#a0d0ff' },
      success:     { bg: 'rgba(0,228,54,0.15)', border: '#00e436', text: '#80ff80' },
      warning:     { bg: 'rgba(255,163,0,0.15)', border: '#ffa300', text: '#ffd080' },
      danger:      { bg: 'rgba(255,0,77,0.15)', border: '#ff004d', text: '#ff8080' },
      event:       { bg: 'rgba(255,119,168,0.15)', border: '#ff77a8', text: '#ffb0d0' },
      achievement: { bg: 'rgba(255,236,39,0.15)', border: '#ffec27', text: '#fff0a0' },
      celebration: { bg: 'rgba(0,228,54,0.20)', border: '#00e436', text: '#a0ffa0' },
      story:       { bg: 'rgba(255,200,60,0.18)', border: '#ffc83c', text: '#ffe0a0' },
    };
    const c = colors[type] ?? colors.info;

    const isStory = type === 'story';
    toast.style.cssText = `
      padding: ${isStory ? '6px 10px' : '4px 8px'};
      background: ${c.bg};
      border-left: 3px solid ${c.border};
      color: ${c.text};
      font-family: monospace;
      font-size: ${isStory ? '10px' : '9px'};
      line-height: 1.3;
      opacity: 1;
      transition: opacity 0.5s ease;
      pointer-events: auto;
      cursor: default;
      ${isStory ? 'display:flex;align-items:center;gap:6px;' : ''}
    `;

    if (isStory && this._storyPortrait) {
      // Render 8x8 mini-portrait for story notifications
      const miniCanvas = document.createElement('canvas');
      miniCanvas.width = 8;
      miniCanvas.height = 8;
      miniCanvas.style.cssText = 'width:16px;height:16px;image-rendering:pixelated;flex-shrink:0;';
      this._drawMiniPortrait(miniCanvas, this._storyPortrait);
      toast.appendChild(miniCanvas);
      this._storyPortrait = null;
      const span = document.createElement('span');
      span.textContent = text;
      toast.appendChild(span);
    } else {
      toast.textContent = text;
    }

    this._el.appendChild(toast);

    const entry = { el: toast, timer: null };
    this._toasts.push(entry);

    // Auto-remove after duration (story toasts last longer)
    const duration = isStory ? 6000 : this._defaultDuration;
    entry.timer = setTimeout(() => {
      this._fadeAndRemove(entry);
    }, duration);
  }

  _fadeAndRemove(entry) {
    entry.el.style.opacity = '0';
    setTimeout(() => {
      entry.el.remove();
      const idx = this._toasts.indexOf(entry);
      if (idx !== -1) this._toasts.splice(idx, 1);
    }, 500);
  }

  _removeOldest() {
    const entry = this._toasts.shift();
    if (entry) {
      clearTimeout(entry.timer);
      entry.el.remove();
    }
  }

  /**
   * Show a prominent celebration banner for major achievements.
   * Appears as a centered banner that fades out after a few seconds.
   */
  showCelebration(title, subtitle) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: absolute; top: 30%; left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      padding: 16px 28px;
      background: linear-gradient(180deg, rgba(255,236,39,0.25), rgba(255,163,0,0.15));
      border: 2px solid #ffec27;
      border-radius: 6px;
      font-family: monospace; color: #fff0a0;
      text-align: center;
      z-index: 35;
      pointer-events: none;
      box-shadow: 0 0 30px rgba(255,236,39,0.4), inset 0 0 15px rgba(255,236,39,0.1);
      opacity: 0;
      transition: opacity 0.4s ease, transform 0.4s ease;
    `;
    banner.innerHTML = `
      <div style="font-size:14px;font-weight:bold;letter-spacing:1px;margin-bottom:4px;color:#ffec27">\u{1f3c6} ${title}</div>
      ${subtitle ? `<div style="font-size:10px;color:#c8c8a0;line-height:1.4;max-width:260px">${subtitle}</div>` : ''}
    `;

    this._el.parentElement.appendChild(banner);

    // Animate in
    requestAnimationFrame(() => {
      banner.style.opacity = '1';
      banner.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // Fade out after 4 seconds
    setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.transform = 'translate(-50%, -50%) scale(1.05)';
      setTimeout(() => banner.remove(), 500);
    }, 4000);
  }

  /**
   * Clear all notifications.
   */
  clear() {
    for (const entry of this._toasts) {
      clearTimeout(entry.timer);
      entry.el.remove();
    }
    this._toasts.length = 0;
  }
}

/**
 * Show an off-season event dialog with 2-3 choices.
 * @param {HTMLElement} container - Parent element for the dialog
 * @param {object} event - Event data with name, description, choices, onChoice
 */
export function showOffSeasonEventDialog(container, event) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex; align-items: center; justify-content: center;
    z-index: 55; font-family: monospace;
  `;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: linear-gradient(180deg, rgba(10,15,30,0.98), rgba(5,5,18,0.98));
    border: 2px solid #29adff;
    border-radius: 4px;
    padding: 16px 22px;
    max-width: 380px;
    text-align: center;
    box-shadow: 0 0 24px rgba(41,173,255,0.3);
  `;

  // Build choice buttons HTML
  const choiceColors = ['#ffa300', '#29adff', '#00e436'];
  let choicesHtml = '';
  for (let i = 0; i < event.choices.length; i++) {
    const c = event.choices[i];
    const color = choiceColors[i % choiceColors.length];
    const costStr = c.cost > 0 ? ` (-$${c.cost.toLocaleString()})` : '';
    choicesHtml += `
      <button data-choice="${i}" style="
        display:block; width:100%; margin-bottom:6px; padding:8px 12px;
        background:linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.2));
        color:${color}; border:1px solid ${color}44;
        font-family:monospace; font-size:10px; cursor:pointer;
        text-align:left; border-radius:2px;
        transition: border-color 0.15s ease;
      " onmouseover="this.style.borderColor='${color}'" onmouseout="this.style.borderColor='${color}44'">
        ${c.label}${costStr}
      </button>
    `;
  }

  dialog.innerHTML = `
    <div style="color:#29adff;font-size:13px;font-weight:bold;margin-bottom:4px;letter-spacing:1px">OFF-SEASON EVENT</div>
    <div style="color:#ffec27;font-size:12px;margin-bottom:6px">${event.name}</div>
    <div style="color:#c0c0d0;font-size:10px;margin-bottom:14px;line-height:1.5">${event.description}</div>
    <div style="text-align:left">${choicesHtml}</div>
  `;

  overlay.appendChild(dialog);
  container.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-choice]');
    if (!btn) return;
    const choiceIndex = parseInt(btn.dataset.choice, 10);
    overlay.remove();
    if (event.onChoice) {
      event.onChoice(choiceIndex);
    }
  });
}

/**
 * Show a domain picker dialog (used after renovation choice).
 * @param {HTMLElement} container - Parent element
 * @param {object} options - { title, description, onPick }
 */
export function showDomainPickerDialog(container, options) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex; align-items: center; justify-content: center;
    z-index: 56; font-family: monospace;
  `;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: linear-gradient(180deg, rgba(10,15,30,0.98), rgba(5,5,18,0.98));
    border: 2px solid #ffec27;
    border-radius: 4px;
    padding: 16px 22px;
    max-width: 320px;
    text-align: center;
    box-shadow: 0 0 20px rgba(255,236,39,0.3);
  `;

  const domains = [
    { key: 'air', icon: '\ud83d\udca8', label: 'AIR', color: '#88ccff' },
    { key: 'water', icon: '\ud83d\udca7', label: 'WATER', color: '#4488ff' },
    { key: 'hvac', icon: '\u2744', label: 'HVAC', color: '#44ddff' },
    { key: 'drainage', icon: '\ud83d\udd27', label: 'DRAINAGE', color: '#88aa44' },
  ];

  let btnsHtml = '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">';
  for (const d of domains) {
    btnsHtml += `
      <button data-domain="${d.key}" style="
        padding:8px 14px; background:rgba(255,255,255,0.05);
        color:${d.color}; border:1px solid ${d.color}44;
        font-family:monospace; font-size:11px; cursor:pointer;
        border-radius:2px;
      ">${d.icon} ${d.label}</button>
    `;
  }
  btnsHtml += '</div>';

  dialog.innerHTML = `
    <div style="color:#ffec27;font-size:12px;margin-bottom:4px;letter-spacing:1px">${options.title ?? 'Choose Domain'}</div>
    <div style="color:#c0c0d0;font-size:10px;margin-bottom:12px;line-height:1.5">${options.description ?? ''}</div>
    ${btnsHtml}
  `;

  overlay.appendChild(dialog);
  container.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-domain]');
    if (!btn) return;
    overlay.remove();
    if (options.onPick) {
      options.onPick(btn.dataset.domain);
    }
  });
}
