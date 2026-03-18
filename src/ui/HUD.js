/**
 * HUD — Baseball-themed heads-up display showing key stats.
 *
 * Top bar styled like a baseball scoreboard:
 *   Budget | Net Income | Game Day / Inning (with diamond) | Rep Tier | Speed
 * Bottom bar:
 *   System health | Panel shortcuts | Alerts
 *
 * Uses retained DOM — elements created once in constructor, updated via
 * textContent/style changes in update(). No innerHTML in the hot path.
 */

export class HUD {
  constructor(container, state, eventBus, zoneManager) {
    this.state = state;
    this.eventBus = eventBus;
    this.zoneManager = zoneManager ?? null;

    // Top bar — scoreboard style
    this.el = document.createElement('div');
    this.el.id = 'hud';
    this.el.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0;
      padding: 2px 6px;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 10px; font-family: monospace;
      color: #e0e0e0;
      background: linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%);
      border-bottom: 2px solid #8b4513;
      user-select: none;
      z-index: 10;
    `;
    container.appendChild(this.el);

    // Bottom status bar
    this.bottomBar = document.createElement('div');
    this.bottomBar.id = 'hud-bottom';
    this.bottomBar.style.cssText = `
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 2px 6px;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 9px; font-family: monospace;
      color: #c0c0d0;
      background: linear-gradient(0deg, #1a1a2e 0%, #0d0d1a 100%);
      border-top: 2px solid #8b4513;
      user-select: none;
      z-index: 10;
    `;
    container.appendChild(this.bottomBar);

    // Inject pulse keyframes for critical domain bars
    if (!document.getElementById('hud-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'hud-pulse-style';
      style.textContent = `
        @keyframes hud-pulse {
          0%,100% { opacity:1; filter: brightness(1); }
          50% { opacity:0.4; filter: brightness(1.5); }
        }
        @keyframes hud-crisis-glow {
          0%,100% { opacity:1; filter: brightness(1); box-shadow: none; }
          50% { opacity:0.5; filter: brightness(1.8); box-shadow: 0 0 4px #ff004d; }
        }
      `;
      document.head.appendChild(style);
    }

    // Zone name flash overlay (center of screen, fades out on zone change)
    this._zoneFlash = document.createElement('div');
    this._zoneFlash.style.cssText = `
      position: absolute; top: 40%; left: 50%;
      transform: translate(-50%, -50%);
      font-family: monospace; font-size: 22px; font-weight: bold;
      letter-spacing: 4px; color: #ffec27;
      text-shadow: 2px 2px 0 rgba(0,0,0,0.7), 0 0 12px rgba(255,236,39,0.4);
      pointer-events: none; z-index: 20;
      opacity: 0; transition: none;
    `;
    container.appendChild(this._zoneFlash);

    // Zone display names map
    this._zoneDisplayNames = {
      field: 'THE FIELD',
      concourse: 'CONCOURSE',
      mechanical: 'MECHANICAL',
      underground: 'UNDERGROUND',
      luxury: 'LUXURY SUITES',
      pressbox: 'PRESS BOX',
    };

    // Listen for zone changes to trigger flash
    this.eventBus.on('zone:changed', ({ to }) => {
      const displayName = this._zoneDisplayNames[to] ?? to?.toUpperCase() ?? '';
      this._zoneFlash.textContent = displayName;
      // Reset transition, show immediately
      this._zoneFlash.style.transition = 'none';
      this._zoneFlash.style.opacity = '1';
      // After brief hold, fade out
      setTimeout(() => {
        this._zoneFlash.style.transition = 'opacity 1.5s ease';
        this._zoneFlash.style.opacity = '0';
      }, 200);
    });

    // Track domain pulse states with hysteresis to prevent flicker
    this._domainPulseActive = { air: false, water: false, hvac: false, drainage: false };

    // Track quality data
    this._quality = { avgEfficiency: 0, filterCount: 0, healthyCount: 0, warningCount: 0, brokenCount: 0 };
    this.eventBus.on('filtration:quality', (data) => {
      this._quality = data;
    });

    // Track money flash effect (brief highlight when money changes)
    this._moneyFlashTimer = 0;
    this._moneyFlashColor = null;
    this._lastMoney = state.money;
    this.eventBus.on('economy:inningEnd', () => {
      const diff = state.money - this._lastMoney;
      if (Math.abs(diff) > 0) {
        this._moneyFlashTimer = 1.0; // 1 second flash
        this._moneyFlashColor = diff > 0 ? '#00e436' : '#ff004d';
      }
      this._lastMoney = state.money;
    });

    // Track game day type for HUD display
    this._gameDayType = null;
    this.eventBus.on('gameday:type', (dayType) => {
      this._gameDayType = dayType;
    });

    // Domain health trend: push current health into 5-day rolling history on each new day
    this.eventBus.on('game:newDay', () => {
      const health = this.state.domainHealth;
      if (!health) return;
      if (!this.state.domainHealthHistory) {
        this.state.domainHealthHistory = { air: [], water: [], hvac: [], drainage: [] };
      }
      const hist = this.state.domainHealthHistory;
      for (const key of ['air', 'water', 'hvac', 'drainage']) {
        hist[key].push(health[key] ?? 100);
        if (hist[key].length > 5) hist[key].shift();
      }
    });

    // Counter-intel toast: show a 5-second toast when sabotage is revealed
    this.eventBus.on('rival:sabotageRevealed', (data) => {
      const domainLabel = data.domain ? ` on ${data.domain}` : '';
      this.eventBus.emit('ui:message', {
        text: `Intel Report: Victor planning ${data.name}${domainLabel}`,
        type: 'info',
        duration: 5000,
      });
    });

    // ── Build retained top bar DOM ──
    this._buildTopBar();

    // ── Build retained bottom bar DOM ──
    this._buildBottomBar();

    // ── Wire up click handlers on stored button refs ──
    this._wireTopBarEvents();
    this._wireBottomBarEvents();
  }

  // ─────────────────────────────────────────────
  //  TOP BAR — retained DOM creation
  // ─────────────────────────────────────────────

  _buildTopBar() {
    // -- Budget section --
    const budgetSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '6px' });
    this._moneyEl = this._makeSpan({ fontWeight: 'bold' });
    this._netIncomeEl = this._makeSpan({ color: '#666', fontSize: '8px' });
    budgetSection.appendChild(this._moneyEl);
    budgetSection.appendChild(this._netIncomeEl);
    this._budgetSection = budgetSection;

    // -- Shop button --
    const shopSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '2px' });
    this._shopBtn = this._makeSpan({
      cursor: 'pointer', color: '#ffa300', border: '1px solid #5a4a2a',
      padding: '0 4px', borderRadius: '2px', fontSize: '8px', background: 'rgba(255,163,0,0.1)'
    });
    this._shopBtn.textContent = '\u{1f6d2} SHOP';
    this._shopBtn.title = 'S to open shop';
    this._shopBtn.dataset.shop = '';
    shopSection.appendChild(this._shopBtn);

    // -- Attendance section --
    this._attSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '3px' });
    this._attIcon = this._makeSpan({ fontSize: '8px' });
    this._attIcon.textContent = '\u{1f465}';
    this._attCount = this._makeSpan({ fontWeight: 'bold', fontSize: '9px' });
    this._attCap = this._makeSpan({ color: '#666', fontSize: '7px' });
    this._attPctEl = this._makeSpan({ fontSize: '8px' });
    this._attArrowEl = this._makeSpan({ fontSize: '7px' });
    this._attStressEl = this._makeSpan({ fontSize: '6px', padding: '0 2px', borderRadius: '1px' });
    this._attSection.append(this._attIcon, this._attCount, this._attCap, this._attPctEl, this._attArrowEl, this._attStressEl);

    // -- Game day / Off-season section --
    this._gameSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 6px', borderRadius: '3px' });

    // Off-season sub-elements
    this._offSeasonLabel = this._makeSpan({ color: '#29adff', fontWeight: 'bold', fontSize: '9px' });
    this._offSeasonLabel.textContent = 'OFF-SEASON';
    this._offSeasonSep = this._makeSpan({ color: '#555' });
    this._offSeasonSep.textContent = '|';
    this._offSeasonDays = this._makeSpan({ color: '#ffec27', fontWeight: 'bold' });
    this._offSeasonDaysLabel = this._makeSpan({ color: '#888', fontSize: '8px' });
    this._offSeasonDaysLabel.textContent = 'days left';

    // In-season sub-elements
    this._gameLabel = this._makeSpan({ color: '#888', fontSize: '8px' });
    this._gameLabel.textContent = 'GAME';
    this._gameDayEl = this._makeSpan({ color: '#ffec27', fontWeight: 'bold' });
    this._gameSep = this._makeSpan({ color: '#555' });
    this._gameSep.textContent = '|';
    this._diamondContainer = this._makeSpan({});
    // Build the 3 diamond base elements
    this._diamondWrap = document.createElement('span');
    this._diamondWrap.style.cssText = 'display:inline-block;width:14px;height:14px;position:relative;vertical-align:middle;margin:0 2px';
    this._diamondB2 = document.createElement('span');
    this._diamondB2.style.cssText = 'position:absolute;top:0;left:4px;width:5px;height:5px;transform:rotate(45deg);border:1px solid #555';
    this._diamondB3 = document.createElement('span');
    this._diamondB3.style.cssText = 'position:absolute;top:4px;left:0;width:5px;height:5px;transform:rotate(45deg);border:1px solid #555';
    this._diamondB1 = document.createElement('span');
    this._diamondB1.style.cssText = 'position:absolute;top:4px;left:8px;width:5px;height:5px;transform:rotate(45deg);border:1px solid #555';
    this._diamondWrap.append(this._diamondB2, this._diamondB3, this._diamondB1);

    this._innLabel = this._makeSpan({ color: '#888', fontSize: '8px' });
    this._innLabel.textContent = 'INN';
    this._innVal = this._makeSpan({ color: '#fff' });
    this._innMax = this._makeSpan({ color: '#555', fontSize: '8px' });
    this._innMax.textContent = '/9';
    this._dayTypeBadge = this._makeSpan({ color: '#ffec27', fontSize: '7px', marginLeft: '2px' });
    this._eventBadge = this._makeSpan({ fontSize: '8px', marginLeft: '4px' });
    this._chainBadge = this._makeSpan({ fontSize: '8px', marginLeft: '4px', padding: '0 3px', borderRadius: '2px' });
    this._forecastBadge = this._makeSpan({ fontSize: '7px', marginLeft: '4px', color: '#29adff' });

    // -- Sandbox badge (visible only in post-win sandbox mode) --
    this._sandboxBadge = this._makeSpan({
      color: '#ffec27', fontSize: '8px', fontWeight: 'bold',
      border: '1px solid #ffec2744', padding: '0 4px', borderRadius: '2px',
      background: 'rgba(255,236,39,0.1)', display: 'none',
      letterSpacing: '1px'
    });
    this._sandboxBadge.textContent = 'SANDBOX';
    this._sandboxBadge.title = 'Post-win sandbox mode — pursue bonus challenges!';

    // -- Zone section --
    this._zoneSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '4px' });
    this._zoneNameEl = this._makeSpan({ fontSize: '9px', padding: '0 3px', borderRadius: '2px' });
    this._zoneFiltersEl = this._makeSpan({ color: '#888', fontSize: '7px' });
    this._zoneSection.append(this._zoneNameEl, this._zoneFiltersEl);

    // -- Reputation section --
    this._repSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '4px' });
    this._repTierEl = this._makeSpan({ fontSize: '9px' });
    this._repPctEl = this._makeSpan({ color: '#888', fontSize: '8px' });
    this._repBarOuter = this._makeSpan({ display: 'inline-block', width: '30px', height: '4px', background: '#222', border: '1px solid #444', overflow: 'hidden', verticalAlign: 'middle', margin: '0 2px' });
    this._repBarFill = document.createElement('span');
    this._repBarFill.style.cssText = 'display:block;height:100%';
    this._repBarOuter.appendChild(this._repBarFill);
    this._rivalEl = this._makeSpan({ fontSize: '8px', marginLeft: '2px' });
    this._repSection.append(this._repTierEl, this._repPctEl, this._repBarOuter, this._rivalEl);

    // -- Active Event Icons (3-slot status strip) --
    this._eventIconsSection = this._makeSpan({
      display: 'flex', alignItems: 'center', gap: '3px',
      padding: '0 4px', borderLeft: '1px solid #333', borderRight: '1px solid #333'
    });
    // Slot 1: Active weather event
    this._eiWeather = this._makeSpan({
      display: 'inline-block', width: '16px', height: '14px', lineHeight: '14px',
      textAlign: 'center', fontSize: '7px', fontWeight: 'bold',
      borderRadius: '2px', border: '1px solid #333', background: 'rgba(0,0,0,0.3)'
    });
    this._eiWeather.title = 'Active weather event';
    // Slot 2: Inspection countdown
    this._eiInspection = this._makeSpan({
      display: 'inline-block', width: '16px', height: '14px', lineHeight: '14px',
      textAlign: 'center', fontSize: '7px', fontWeight: 'bold',
      borderRadius: '2px', border: '1px solid #333', background: 'rgba(0,0,0,0.3)'
    });
    this._eiInspection.title = 'Inspection countdown';
    // Slot 3: Rival threat status
    this._eiRival = this._makeSpan({
      display: 'inline-block', width: '16px', height: '14px', lineHeight: '14px',
      textAlign: 'center', fontSize: '7px', fontWeight: 'bold',
      borderRadius: '2px', border: '1px solid #333', background: 'rgba(0,0,0,0.3)'
    });
    this._eiRival.title = 'Rival threat status';
    // Slot 4: Rival momentum badge (only visible chapter 2+)
    this._rivalMomentumBadge = this._makeSpan({
      display: 'none', fontSize: '7px', fontWeight: 'bold',
      padding: '0 3px', borderRadius: '2px', border: '1px solid #333',
      background: 'rgba(0,0,0,0.3)', whiteSpace: 'nowrap', cursor: 'pointer'
    });
    this._rivalMomentumBadge.title = 'Victor threat level';
    this._lastRivalMomentum = null;
    this._rivalMomentumBadge.addEventListener('click', (e) => {
      e.preventDefault();
      const detail = this._rivalMomentumBadge._eventDetail;
      if (detail) {
        this.eventBus.emit('ui:click');
        this.eventBus.emit('ui:message', { text: detail, type: 'info' });
      }
    });
    this._eventIconsSection.append(this._eiWeather, this._eiInspection, this._eiRival, this._rivalMomentumBadge);

    // -- Weather ticker (compact, in top bar) --
    this._weatherTickerSection = this._makeSpan({
      display: 'flex', alignItems: 'center', gap: '3px',
      padding: '0 4px', borderLeft: '1px solid #333', borderRight: '1px solid #333',
      maxWidth: '150px', overflow: 'hidden', whiteSpace: 'nowrap'
    });
    this._wtCurrent = this._makeSpan({ fontSize: '8px', fontWeight: 'bold' });
    this._wtForecast = this._makeSpan({ fontSize: '7px', color: '#888' });
    this._wtWarning = this._makeSpan({
      fontSize: '7px', fontWeight: 'bold', color: '#ff004d', display: 'none'
    });
    this._weatherTickerSection.append(this._wtCurrent, this._wtForecast, this._wtWarning);

    // -- Speed controls --
    this._speedSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '2px' });
    this._pauseBtn = this._makeSpan({ cursor: 'pointer', color: '#83769c', fontSize: '12px' });
    this._pauseBtn.title = 'Space to toggle';
    this._pauseBtn.dataset.pause = '';
    this._speedBtns = [];
    const speedLabels = { 1: '1x Normal', 2: '2x Fast', 3: '3x Turbo' };
    this._speedSection.appendChild(this._pauseBtn);
    for (const sp of [1, 2, 3]) {
      const btn = this._makeSpan({ cursor: 'pointer', padding: '0 2px', fontSize: '9px' });
      btn.dataset.speed = String(sp);
      btn.title = speedLabels[sp];
      btn.textContent = `${sp}x`;
      this._speedBtns.push(btn);
      this._speedSection.appendChild(btn);
    }

    // Append all sections to top bar
    this.el.append(
      budgetSection, shopSection, this._attSection,
      this._gameSection, this._sandboxBadge, this._eventIconsSection,
      this._weatherTickerSection,
      this._zoneSection, this._repSection,
      this._speedSection
    );
  }

  // ─────────────────────────────────────────────
  //  BOTTOM BAR — retained DOM creation
  // ─────────────────────────────────────────────

  _buildBottomBar() {
    // -- Filter status section --
    this._filterSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '2px' });
    this._filterEffEl = this._makeSpan({});
    this._filterBarOuter = this._makeSpan({ display: 'inline-block', height: '6px', background: '#222', border: '1px solid #444', borderRadius: '1px', verticalAlign: 'middle', margin: '0 3px', overflow: 'hidden' });
    this._filterBarOuter.style.width = '40px';
    this._filterBarFill = document.createElement('span');
    this._filterBarFill.style.cssText = 'display:block;height:100%';
    this._filterBarOuter.appendChild(this._filterBarFill);
    this._filterCountEl = this._makeSpan({ color: '#888', fontSize: '8px' });
    this._filterNoneEl = this._makeSpan({ color: '#555' });
    this._filterNoneEl.textContent = 'No filters \u2014 open SHOP to install';
    this._filterSection.append(this._filterEffEl, this._filterBarOuter, this._filterCountEl, this._filterNoneEl);

    // -- Domain health bars --
    this._domainSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '4px' });
    const domains = [
      { key: 'air',      icon: '\ud83d\udca8', label: 'AIR' },
      { key: 'water',    icon: '\ud83d\udca7', label: 'WTR' },
      { key: 'hvac',     icon: '\u2744',       label: 'HVAC' },
      { key: 'drainage', icon: '\ud83d\udd27', label: 'DRN' },
    ];
    this._domainEls = {};
    for (const d of domains) {
      const wrap = this._makeSpan({ display: 'inline-flex', alignItems: 'center', gap: '1px' });
      const icon = this._makeSpan({ fontSize: '7px' });
      icon.textContent = d.icon;
      const barOuter = document.createElement('span');
      barOuter.style.cssText = 'display:inline-block;width:40px;height:4px;background:#222;border:1px solid #444;border-radius:1px;overflow:hidden';
      const barFill = document.createElement('span');
      barFill.style.cssText = 'display:block;height:100%';
      barOuter.appendChild(barFill);
      const pctEl = this._makeSpan({ fontSize: '6px', minWidth: '18px' });
      const trendEl = this._makeSpan({ fontSize: '7px', fontWeight: 'bold', minWidth: '8px', textAlign: 'center' });
      const statusSymbol = this._makeSpan({ fontSize: '7px', fontWeight: 'bold', minWidth: '10px', textAlign: 'center' });
      const inlineLabel = this._makeSpan({ fontSize: '5px', maxWidth: '50px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' });
      wrap.append(icon, barOuter, pctEl, trendEl, statusSymbol, inlineLabel);
      this._domainEls[d.key] = { wrap, barFill, pctEl, trendEl, statusSymbol, inlineLabel, label: d.label };
      this._domainSection.appendChild(wrap);
    }

    // -- Panel buttons --
    const btnStyle = {
      cursor: 'pointer', padding: '2px 5px', margin: '0 1px',
      border: '1px solid #3a3a5a', borderRadius: '2px',
      background: 'rgba(255,255,255,0.04)', fontSize: '8px',
      transition: 'filter 0.12s ease'
    };
    const panelDefs = [
      { panel: 'Economy',    color: '#00e436', icon: '\u{1f4b0}', text: 'FINANCE', title: 'Finance Report (F)' },
      { panel: 'Staff',      color: '#ffa300', icon: '\u{1f477}', text: 'CREW',    title: 'Staff Roster (H)' },
      { panel: 'Talk',       color: '#00e436', icon: '\u{1f4fb}', text: 'TALK',    title: 'Stadium Radio (T)' },
      { panel: 'Research',   color: '#cc44cc', icon: '\u{1f52c}', text: 'LAB',     title: 'Research Lab (R)' },
      { panel: 'Newspaper',  color: '#c8c8c8', icon: '\u{1f4f0}', text: 'NEWS',    title: 'Ridgemont Herald (N)' },
      { panel: 'Contracts',  color: '#29adff', icon: '\u{1f4dd}', text: 'DEALS',   title: 'Sponsor Contracts (C)' },
      { panel: 'Journal',    color: '#ff77a8', icon: '\u{1f4d3}', text: 'JRNL',    title: "Hank's Journal (J)" },
      { panel: 'Systems',    color: '#29adff', icon: '\u{1f527}', text: 'SYS',     title: 'Systems Overview (G)' },
      { panel: 'Expansions', color: '#ffec27', icon: '\u{1f3d7}', text: 'EXPAND',  title: 'Stadium Expansions (X)' },
      { panel: 'Objectives', color: '#ffec27', icon: '\u{1f4cb}', text: 'OBJ',     title: 'Objectives (O)' },
      { panel: 'Stats',      color: '#c8c8c8', icon: '\u{1f4ca}', text: 'STATS',   title: 'Statistics (Y)' },
    ];
    this._panelBtnsSection = this._makeSpan({ display: 'flex', gap: '2px', alignItems: 'center' });
    for (const def of panelDefs) {
      const btn = this._makeSpan({ ...btnStyle, color: def.color });
      btn.textContent = `${def.icon} ${def.text}`;
      btn.title = def.title;
      btn.dataset.panel = def.panel;
      this._panelBtnsSection.appendChild(btn);
    }

    // -- Weather forecast icons (3-day) --
    this._forecastSection = this._makeSpan({
      display: 'flex', alignItems: 'center', gap: '2px',
      padding: '0 3px', borderLeft: '1px solid #333'
    });
    this._forecastLabel = this._makeSpan({ color: '#666', fontSize: '6px', marginRight: '1px' });
    this._forecastLabel.textContent = 'WX';
    this._forecastSection.appendChild(this._forecastLabel);
    this._forecastIcons = [];
    for (let i = 0; i < 3; i++) {
      const icon = this._makeSpan({
        display: 'inline-block', fontSize: '9px', cursor: 'default',
        width: '14px', height: '14px', lineHeight: '14px',
        textAlign: 'center', borderRadius: '2px',
        border: '1px solid #333', background: 'rgba(0,0,0,0.2)'
      });
      this._forecastIcons.push(icon);
      this._forecastSection.appendChild(icon);
    }

    // -- Reputation budget indicator --
    this._repBudgetSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '7px' });
    this._repBudgetLabel = this._makeSpan({ color: '#888' });
    this._repBudgetLabel.textContent = 'REP:';
    this._repBudgetGain = this._makeSpan({});
    this._repBudgetSep = this._makeSpan({ color: '#555' });
    this._repBudgetSep.textContent = '|';
    this._repBudgetLoss = this._makeSpan({});
    // Thin fill bars for gain/loss
    this._repGainBarOuter = this._makeSpan({ display: 'inline-block', width: '16px', height: '3px', background: '#222', border: '1px solid #333', overflow: 'hidden', verticalAlign: 'middle', marginLeft: '1px' });
    this._repGainBarFill = document.createElement('span');
    this._repGainBarFill.style.cssText = 'display:block;height:100%';
    this._repGainBarOuter.appendChild(this._repGainBarFill);
    this._repLossBarOuter = this._makeSpan({ display: 'inline-block', width: '16px', height: '3px', background: '#222', border: '1px solid #333', overflow: 'hidden', verticalAlign: 'middle', marginLeft: '1px' });
    this._repLossBarFill = document.createElement('span');
    this._repLossBarFill.style.cssText = 'display:block;height:100%';
    this._repLossBarOuter.appendChild(this._repLossBarFill);
    this._repBudgetSection.append(this._repBudgetLabel, this._repBudgetGain, this._repGainBarOuter, this._repBudgetSep, this._repBudgetLoss, this._repLossBarOuter);
    this._repBudgetSection.title = 'Daily reputation budget: max +3 gain, -5 loss per day. Resets each game day.';

    // -- Alert section --
    this._alertSection = this._makeSpan({ display: 'flex', alignItems: 'center', gap: '4px' });
    this._zoneHintEl = this._makeSpan({ color: '#555', fontSize: '7px' });
    this._zoneHintEl.title = 'Tab: Next Zone | Shift+Tab: Previous | `: Field';
    this._zoneHintEl.textContent = 'TAB: Zone';
    this._alertBadge = this._makeSpan({});
    this._alertSection.append(this._zoneHintEl, this._alertBadge);

    // Append all sections to bottom bar
    this.bottomBar.append(
      this._filterSection, this._domainSection, this._forecastSection,
      this._repBudgetSection, this._panelBtnsSection, this._alertSection
    );
  }

  // ─────────────────────────────────────────────
  //  EVENT WIRING — proper addEventListener on stored refs
  // ─────────────────────────────────────────────

  _wireTopBarEvents() {
    // Shop button
    this._shopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.eventBus.emit('ui:click');
      this.eventBus.emit('ui:toggleShop');
    });

    // Pause button
    this._pauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.eventBus.emit('ui:click');
      if (this.state.paused) {
        this.eventBus.emit('game:resume');
      } else {
        this.eventBus.emit('game:pause');
      }
    });

    // Speed buttons
    for (const btn of this._speedBtns) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.eventBus.emit('ui:click');
        const speed = parseInt(btn.dataset.speed, 10);
        this.eventBus.emit('game:setSpeed', { speed });
      });
    }

    // Active event icon clicks — show toast with details
    for (const slot of [this._eiWeather, this._eiInspection, this._eiRival]) {
      slot.addEventListener('click', (e) => {
        e.preventDefault();
        const detail = slot._eventDetail;
        if (detail) {
          this.eventBus.emit('ui:click');
          this.eventBus.emit('ui:message', { text: detail, type: 'info' });
        }
      });
    }
  }

  _wireBottomBarEvents() {
    // Panel buttons — use event delegation on the stable container
    this._panelBtnsSection.addEventListener('click', (e) => {
      const panelBtn = e.target.closest('[data-panel]');
      if (panelBtn) {
        e.preventDefault();
        this.eventBus.emit('ui:click');
        const panel = panelBtn.dataset.panel;
        this.eventBus.emit(`ui:toggle${panel}`);
      }
    });
  }

  // ─────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────

  /**
   * Update the compact weather ticker in the top bar.
   * Shows current weather + 2-day forecast inline, color-coded by domain impact.
   */
  _updateWeatherTicker(s) {
    const forecast = s.weatherForecast;
    if (!Array.isArray(forecast) || forecast.length === 0) {
      this._weatherTickerSection.style.display = 'none';
      return;
    }
    this._weatherTickerSection.style.display = '';

    const weatherIcons = {
      'Heavy Rain': '\u26c8', 'Light Rain': '\ud83c\udf27', 'Heatwave': '\u2600\ufe0f',
      'Cold Snap': '\u2744', 'Humidity Spike': '\ud83d\udca7', 'Wind Storm': '\ud83c\udf2c',
      'Snow/Ice': '\u2744', 'Fog': '\ud83c\udf2b', 'Ice Storm': '\u2744',
      'Dust Storm': '\ud83c\udf2a', 'Flash Flood': '\ud83c\udf0a', 'Clear': '\u2600',
    };

    // Domain impact color: which domain is most affected
    const _domainImpactColor = (domainsAffected) => {
      if (!domainsAffected || domainsAffected.length === 0) return '#00e436'; // clear/green
      if (domainsAffected.includes('water') || domainsAffected.includes('drainage')) return '#4488ff'; // blue
      if (domainsAffected.includes('hvac')) return '#ff8844'; // red/orange
      if (domainsAffected.includes('air')) return '#aaaaaa'; // gray
      return '#00e436';
    };

    // Current weather (forecast[0] = today)
    const today = forecast[0];
    const todayIcon = weatherIcons[today.name] ?? '\u2601';
    const todayColor = _domainImpactColor(today.domainsAffected);
    this._wtCurrent.textContent = `${todayIcon} ${today.name}`;
    this._wtCurrent.style.color = todayColor;
    this._wtCurrent.title = `Today: ${today.name}${today.domainsAffected?.length ? ' — affects ' + today.domainsAffected.join(', ') : ''}`;

    // 2-day forecast inline
    const parts = [];
    for (let i = 1; i < Math.min(3, forecast.length); i++) {
      const fc = forecast[i];
      const icon = weatherIcons[fc.name] ?? '\u2601';
      const dayLabel = i === 1 ? 'Tmrw' : 'D+2';
      parts.push(`${dayLabel}:${icon}`);
    }
    if (parts.length > 0) {
      this._wtForecast.textContent = parts.join(' ');
      this._wtForecast.style.display = '';
    } else {
      this._wtForecast.style.display = 'none';
    }

    // Advance warning: check if a severe event (severity >= 2) is forecast in next 2 days
    let warningText = '';
    const domainLabels = { water: 'water', drainage: 'drainage', hvac: 'HVAC', air: 'air' };
    for (let i = 1; i < Math.min(3, forecast.length); i++) {
      const fc = forecast[i];
      if (fc.severity >= 2 && fc.name !== 'Clear') {
        const daysAway = i;
        const affectedDomain = fc.domainsAffected?.[0];
        const domainHint = affectedDomain ? ` -- check ${domainLabels[affectedDomain] ?? affectedDomain}!` : '';
        warningText = `\u26a0 ${fc.name} in ${daysAway}d${domainHint}`;
        break;
      }
    }
    if (warningText) {
      this._wtWarning.textContent = warningText;
      this._wtWarning.style.display = '';
      this._wtWarning.style.animation = 'hud-pulse 1.5s infinite';
    } else {
      this._wtWarning.style.display = 'none';
      this._wtWarning.style.animation = '';
    }
  }

  _makeSpan(styles) {
    const el = document.createElement('span');
    for (const [k, v] of Object.entries(styles)) {
      el.style[k] = v;
    }
    return el;
  }

  /**
   * Get reputation tier name for display.
   */
  _getRepTierName(rep) {
    if (rep >= 86) return { name: 'MLB', color: '#ffdd44', icon: '\u2605' };
    if (rep >= 71) return { name: 'AAA', color: '#00e436', icon: '\u25c6' };
    if (rep >= 56) return { name: 'AA', color: '#29adff', icon: '\u25c6' };
    if (rep >= 41) return { name: 'A', color: '#ffa300', icon: '\u25c6' };
    if (rep >= 21) return { name: 'minors', color: '#c2c3c7', icon: '\u25cb' };
    return { name: 'condemned', color: '#ff004d', icon: '\u2716' };
  }

  // ─────────────────────────────────────────────
  //  UPDATE — only touches textContent/style, never innerHTML
  // ─────────────────────────────────────────────

  update(dt) {
    const s = this.state;
    const q = this._quality;
    const tier = this._getRepTierName(s.reputation);

    // Decay money flash timer
    if (this._moneyFlashTimer > 0) {
      this._moneyFlashTimer -= dt;
    }

    // Money color: flash briefly on change, then settle to normal
    const baseMoneyColor = s.money >= 1000 ? '#00e436' : s.money >= 0 ? '#ffa300' : '#ff004d';
    const moneyColor = this._moneyFlashTimer > 0 ? this._moneyFlashColor : baseMoneyColor;
    const netIncome = s.income - s.expenses;
    const incomeSign = netIncome >= 0 ? '+' : '';

    // Budget tooltip
    const budgetTooltip = `Budget: $${s.money.toLocaleString()} | Income: $${s.income}/inn | Expenses: $${s.expenses}/inn | Net: ${incomeSign}$${netIncome}/inn`;
    this._budgetSection.title = budgetTooltip;

    // Money display
    this._moneyEl.textContent = `$${s.money.toLocaleString()}`;
    this._moneyEl.style.color = moneyColor;
    this._moneyEl.style.textShadow = this._moneyFlashTimer > 0 ? `0 0 6px ${this._moneyFlashColor}` : '';
    this._netIncomeEl.textContent = `(${incomeSign}$${netIncome}/inn)`;

    // Attendance
    const attPct = s.attendancePercent ?? 0;
    const attCount = s.attendance ?? 0;
    const attBaseCapacity = s.config?.stadium?.baseCapacity ?? 5000;
    const attExpCapMap = s.config?.stadium?.expansionCapacity ?? {};
    let attExpBonus = 0;
    for (const pe of (s.purchasedExpansions ?? [])) {
      attExpBonus += attExpCapMap[pe.key] ?? 0;
    }
    const attCapacity = attBaseCapacity + attExpBonus;
    const attColor = attPct > 70 ? '#00e436' : attPct >= 40 ? '#ffa300' : '#ff004d';
    const attTrend = s.attendanceTrend ?? 'stable';
    const attArrow = attTrend === 'up' ? '\u25b2' : attTrend === 'down' ? '\u25bc' : '\u25cf';
    const attArrowColor = attTrend === 'up' ? '#00e436' : attTrend === 'down' ? '#ff004d' : '#888';
    const attStressLabel = attPct >= 95 ? 'SELLOUT' : attPct >= 85 ? 'HIGH' : attPct >= 70 ? 'MOD' : '';
    const attStressColor = attPct >= 95 ? '#ff004d' : attPct >= 85 ? '#ffa300' : '#ffec27';

    this._attSection.title = `Attendance: ${attCount.toLocaleString()}/${attCapacity.toLocaleString()} (${attPct}%)`;
    this._attCount.textContent = attCount.toLocaleString();
    this._attCount.style.color = attColor;
    this._attCap.textContent = `/${attCapacity.toLocaleString()}`;
    this._attPctEl.textContent = `${attPct}%`;
    this._attPctEl.style.color = attColor;
    this._attArrowEl.textContent = attArrow;
    this._attArrowEl.style.color = attArrowColor;
    if (attStressLabel) {
      this._attStressEl.textContent = attStressLabel;
      this._attStressEl.style.color = attStressColor;
      this._attStressEl.style.border = `1px solid ${attStressColor}44`;
      this._attStressEl.style.display = '';
    } else {
      this._attStressEl.style.display = 'none';
    }

    // Game day / off-season section
    const isOffSeason = s.offSeason ?? false;
    const offSeasonDaysLeft = s.offSeasonDaysLeft ?? 0;

    // Clear children and rebuild structure (cheap since we reuse stored elements)
    while (this._gameSection.firstChild) this._gameSection.removeChild(this._gameSection.firstChild);

    if (isOffSeason) {
      this._gameSection.style.background = 'rgba(41,173,255,0.15)';
      this._gameSection.style.border = '1px solid #29adff';
      this._offSeasonDays.textContent = offSeasonDaysLeft;
      this._gameSection.append(this._offSeasonLabel, this._offSeasonSep, this._offSeasonDays, this._offSeasonDaysLabel);
    } else {
      this._gameSection.style.background = 'rgba(0,0,0,0.3)';
      this._gameSection.style.border = '1px solid #333';
      this._gameDayEl.textContent = s.gameDay;

      // Update diamond bases
      const phase = (s.inning - 1) % 4;
      this._diamondB1.style.background = phase >= 1 ? '#ffec27' : '#333';
      this._diamondB2.style.background = phase >= 2 ? '#ffec27' : '#333';
      this._diamondB3.style.background = phase >= 3 ? '#ffec27' : '#333';

      this._innVal.textContent = s.inning;

      // Day type badge
      const dayType = this._gameDayType;
      const dayTypeIcons = {
        weekendRegular: '\u{1f3df}',
        rivalryGame: '\u{1f525}',
        promotionalNight: '\u{1f389}',
        playoffGame: '\u{1f3c6}',
        championshipGame: '\u{1f31f}',
      };
      if (dayType && dayType.configKey !== 'weekdayRegular') {
        this._dayTypeBadge.textContent = dayTypeIcons[dayType.configKey] ?? '';
        this._dayTypeBadge.title = `${dayType.name}: ${Math.round((dayType.revenueMultiplier - 1) * 100)}% revenue bonus`;
        this._dayTypeBadge.style.display = '';
      } else {
        this._dayTypeBadge.style.display = 'none';
      }

      // Event badge
      const isPositiveEvent = s.activeEvent?.category === 'positive' || s.activeEvent?.isPositive;
      if (s.activeEvent) {
        this._eventBadge.textContent = `${isPositiveEvent ? '\u2b50' : '\u26a0'} ${s.activeEvent.name}`;
        this._eventBadge.style.color = isPositiveEvent ? '#00e436' : '#ff77a8';
        this._eventBadge.style.animation = 'pulse 1s infinite';
        this._eventBadge.style.display = '';
      } else {
        this._eventBadge.style.display = 'none';
      }

      // Event chain indicator
      const chain = s.activeEventChain;
      if (chain) {
        const chainDefs = {
          waterMainCrisis: { name: 'Water Crisis', color: '#4488ff', total: 3 },
          vipDelegation:   { name: 'VIP Delegation', color: '#ffec27', total: 2 },
          equipmentRecall: { name: 'Equipment Recall', color: '#ffa300', total: 3 },
          heatwave:        { name: 'Heatwave', color: '#ff6644', total: 3 },
        };
        const cd = chainDefs[chain.chainId] ?? { name: chain.chainId, color: '#ff77a8', total: '?' };
        this._chainBadge.textContent = `${cd.name} Day ${chain.currentDay}/${cd.total}`;
        this._chainBadge.style.color = cd.color;
        this._chainBadge.style.border = `1px solid ${cd.color}66`;
        this._chainBadge.style.background = `${cd.color}22`;
        this._chainBadge.style.display = '';
      } else {
        this._chainBadge.style.display = 'none';
      }

      // Weather forecast indicator
      const forecast = s.weatherForecast;
      if (Array.isArray(forecast) && forecast.length > 0 && forecast[0].name !== 'Clear') {
        const weatherIcons = {
          'Heavy Rain': '\u26c8', 'Light Rain': '\ud83c\udf27', 'Heatwave': '\u2600\ufe0f',
          'Cold Snap': '\u2744', 'Humidity Spike': '\ud83d\udca7', 'Wind Storm': '\ud83c\udf2c',
          'Snow/Ice': '\u2744', 'Fog': '\ud83c\udf2b', 'Ice Storm': '\u2744',
          'Dust Storm': '\ud83c\udf2a', 'Flash Flood': '\ud83c\udf0a',
        };
        const icon = weatherIcons[forecast[0].name] ?? '\u26c5';
        const confStars = '\u2605'.repeat(forecast[0].confidence ?? 0) + '\u2606'.repeat(5 - (forecast[0].confidence ?? 0));
        this._forecastBadge.textContent = `${icon} Next: ${forecast[0].name} (${confStars})`;
        this._forecastBadge.title = `Weather forecast: ${forecast[0].name} — ${forecast[0].description ?? 'Prepare your systems!'} | Confidence: ${forecast[0].confidenceLabel ?? '?'} (${confStars})`;
        this._forecastBadge.style.display = '';
      } else {
        this._forecastBadge.style.display = 'none';
      }

      this._gameSection.append(
        this._gameLabel, this._gameDayEl, this._gameSep,
        this._diamondWrap, this._innLabel, this._innVal, this._innMax,
        this._dayTypeBadge, this._eventBadge, this._chainBadge, this._forecastBadge
      );
    }

    // Sandbox mode badge
    const isSandbox = Array.isArray(s.sandboxGoals) && s.sandboxGoals.length > 0;
    this._sandboxBadge.style.display = isSandbox ? '' : 'none';

    // Zone info
    const zone = this.zoneManager?.getActiveZone();
    const zoneName = zone?.name ?? 'Overview';
    const zoneColor = zone?.color ?? '#888';
    const currentZone = s.currentZone ?? 'field';
    const zoneFilters = (s.filters ?? []).filter(f => (f.zone ?? 'mechanical') === currentZone).length;
    const zoneSlots = zone?.ventSlots?.length ?? 0;

    this._zoneNameEl.textContent = `\u{1f4cd} ${zoneName.toUpperCase()}`;
    this._zoneNameEl.style.color = zoneColor;
    this._zoneNameEl.style.border = `1px solid ${zoneColor}33`;
    this._zoneNameEl.style.background = `${zoneColor}11`;
    this._zoneNameEl.title = 'Current zone (TAB to cycle)';
    this._zoneFiltersEl.textContent = `Filters: ${zoneFilters}/${zoneSlots}`;

    // Reputation
    const repTiers = s.config?.reputation?.tiers ?? [];
    const nextTier = repTiers.find(t => t.min > Math.floor(s.reputation));
    const nextTierInfo = nextTier
      ? `Next: ${nextTier.name} at ${nextTier.min}% (unlocks: ${(nextTier.unlocks ?? []).join(', ') || 'none'})`
      : 'Max tier reached';
    const repTooltip = `${tier.name} (${Math.floor(s.reputation)}%) | ${nextTierInfo}`;

    this._repTierEl.textContent = `${tier.icon} ${tier.name}`;
    this._repTierEl.style.color = tier.color;
    this._repTierEl.title = repTooltip;
    this._repPctEl.textContent = `${Math.floor(s.reputation)}%`;

    // Rep progress bar
    if (nextTier) {
      const ct = repTiers.filter(t => Math.floor(s.reputation) >= t.min).pop();
      const ctMin = ct?.min ?? 0;
      const range = nextTier.min - ctMin;
      const prog = range > 0 ? Math.min(100, Math.floor(((Math.floor(s.reputation) - ctMin) / range) * 100)) : 100;
      const tc = prog > 70 ? '#00e436' : prog > 40 ? '#ffec27' : '#ff004d';
      this._repBarFill.style.width = `${prog}%`;
      this._repBarFill.style.background = tc;
      this._repBarOuter.style.display = '';
    } else {
      this._repBarOuter.style.display = 'none';
    }

    // Rival indicator
    const rivalRep = s.rivalRep ?? 60;
    const repGap = Math.floor(s.reputation) - Math.floor(rivalRep);
    const rivalArrow = repGap >= 0 ? '\u25b2' : '\u25bc';
    const rivalColor = repGap >= 0 ? '#00e436' : '#ff004d';
    this._rivalEl.textContent = `${rivalArrow}${repGap >= 0 ? '+' : ''}${repGap}`;
    this._rivalEl.style.color = rivalColor;
    this._rivalEl.title = `Rival: Glendale Grizzlies (${Math.floor(rivalRep)}% rep)`;

    // Speed controls
    this._pauseBtn.textContent = s.paused ? '\u25b6' : '\u23f8';
    for (const btn of this._speedBtns) {
      const sp = parseInt(btn.dataset.speed, 10);
      if (s.speed === sp && !s.paused) {
        btn.style.color = '#ffec27';
        btn.style.textShadow = '0 0 4px #ffec27';
      } else {
        btn.style.color = '#555';
        btn.style.textShadow = '';
      }
    }

    // ── Active Event Icons (3-slot strip in top bar) ──

    // Slot 1: Active weather event
    if (s.activeEvent) {
      const isWeatherEvent = s.activeEvent.category === 'weather' || s.activeEvent.type === 'weather';
      const evtIcon = isWeatherEvent ? 'WX' : 'EV';
      const isPositive = s.activeEvent.category === 'positive' || s.activeEvent.isPositive;
      const evtColor = isPositive ? '#00e436' : '#ff77a8';
      this._eiWeather.textContent = evtIcon;
      this._eiWeather.style.color = evtColor;
      this._eiWeather.style.borderColor = evtColor;
      this._eiWeather.style.background = `${evtColor}22`;
      this._eiWeather.title = `Active: ${s.activeEvent.name}`;
      this._eiWeather._eventDetail = `Active event: ${s.activeEvent.name} — ${s.activeEvent.description ?? 'Event in progress'}`;
    } else {
      this._eiWeather.textContent = '--';
      this._eiWeather.style.color = '#444';
      this._eiWeather.style.borderColor = '#333';
      this._eiWeather.style.background = 'rgba(0,0,0,0.3)';
      this._eiWeather.title = 'No active event';
      this._eiWeather._eventDetail = null;
    }

    // Slot 2: Inspection countdown
    const inspDaysLeft = (s.nextInspectionDay ?? 999) - (s.gameDay ?? 0);
    if (inspDaysLeft <= 10) {
      const inspColor = inspDaysLeft <= 2 ? '#ff004d' : inspDaysLeft <= 5 ? '#ffa300' : '#ffec27';
      this._eiInspection.textContent = `I${inspDaysLeft}`;
      this._eiInspection.style.color = inspColor;
      this._eiInspection.style.borderColor = inspColor;
      this._eiInspection.style.background = `${inspColor}22`;
      this._eiInspection.title = `Inspection in ${inspDaysLeft} day${inspDaysLeft !== 1 ? 's' : ''}`;
      this._eiInspection._eventDetail = `Stadium inspection in ${inspDaysLeft} day${inspDaysLeft !== 1 ? 's' : ''}! Keep domain health above thresholds.`;
      if (inspDaysLeft <= 2) {
        this._eiInspection.style.animation = 'hud-pulse 1s infinite';
      } else {
        this._eiInspection.style.animation = '';
      }
    } else {
      this._eiInspection.textContent = 'IN';
      this._eiInspection.style.color = '#444';
      this._eiInspection.style.borderColor = '#333';
      this._eiInspection.style.background = 'rgba(0,0,0,0.3)';
      this._eiInspection.title = `Next inspection: Day ${s.nextInspectionDay ?? '?'}`;
      this._eiInspection._eventDetail = null;
      this._eiInspection.style.animation = '';
    }

    // Slot 3: Rival threat status
    const smearActive = (s._smearCampaignDays ?? 0) > 0;
    const supplyCostActive = (s._supplyCostDays ?? 0) > 0;
    const rivalDefenses = s._rivalDefenses;
    const counterIntelRevealed = rivalDefenses?.counterIntel?.revealedType ?? null;
    const rivalThreatActive = smearActive || supplyCostActive || counterIntelRevealed;
    if (rivalThreatActive) {
      const threats = [];
      if (smearActive) threats.push(`Smear campaign (${s._smearCampaignDays}d)`);
      if (supplyCostActive) threats.push(`Supply disruption (${s._supplyCostDays}d)`);
      if (counterIntelRevealed) threats.push(`Intel: ${counterIntelRevealed}`);
      const rivalTColor = '#ff77a8';
      this._eiRival.textContent = 'R!';
      this._eiRival.style.color = rivalTColor;
      this._eiRival.style.borderColor = rivalTColor;
      this._eiRival.style.background = `${rivalTColor}22`;
      this._eiRival.title = `Rival threat: ${threats.join(', ')}`;
      this._eiRival._eventDetail = `Rival activity: ${threats.join('. ')}.`;
    } else if (repGap < 0) {
      // Rival is ahead — show subtle warning
      this._eiRival.textContent = 'RV';
      this._eiRival.style.color = '#ffa300';
      this._eiRival.style.borderColor = '#ffa30044';
      this._eiRival.style.background = 'rgba(255,163,0,0.1)';
      this._eiRival.title = `Rival ahead by ${Math.abs(repGap)} rep`;
      this._eiRival._eventDetail = `The Glendale Grizzlies are ${Math.abs(repGap)} reputation points ahead of you!`;
    } else {
      this._eiRival.textContent = 'RV';
      this._eiRival.style.color = '#444';
      this._eiRival.style.borderColor = '#333';
      this._eiRival.style.background = 'rgba(0,0,0,0.3)';
      this._eiRival.title = 'Rival: no active threats';
      this._eiRival._eventDetail = null;
    }

    // Slot 4: Rival momentum badge (chapter 2+ only)
    const chapter = s.storyChapter ?? 1;
    if (chapter >= 2) {
      const momentum = s.rivalMomentum ?? 0;
      let mLabel, mColor, mArrow;
      if (momentum <= -2) {
        mLabel = 'LOW'; mColor = '#00e436';
      } else if (momentum <= 0) {
        mLabel = 'MOD'; mColor = '#888';
      } else if (momentum === 1) {
        mLabel = 'HIGH'; mColor = '#ffec27';
      } else {
        mLabel = 'CRIT'; mColor = '#ff004d';
      }
      // Trend arrow based on change from last known momentum
      if (this._lastRivalMomentum !== null) {
        if (momentum > this._lastRivalMomentum) mArrow = '\u25b2'; // ▲ rising
        else if (momentum < this._lastRivalMomentum) mArrow = '\u25bc'; // ▼ falling
        else mArrow = '\u25b8'; // ▸ stable
      } else {
        mArrow = '\u25b8';
      }
      this._lastRivalMomentum = momentum;
      this._rivalMomentumBadge.textContent = `Victor: ${mArrow} ${mLabel}`;
      this._rivalMomentumBadge.style.color = mColor;
      this._rivalMomentumBadge.style.borderColor = `${mColor}66`;
      this._rivalMomentumBadge.style.background = `${mColor}18`;
      this._rivalMomentumBadge.style.display = '';
      const mDescriptions = {
        LOW: 'Victor is retreating. Keep the pressure on!',
        MOD: 'Normal rivalry. Victor is watching but not making big moves.',
        HIGH: 'Victor is gaining ground. Watch for sabotage attempts.',
        CRIT: 'Sabotage imminent! Victor is at peak threat level.',
      };
      this._rivalMomentumBadge.title = `Victor threat: ${mLabel} (momentum ${momentum})`;
      this._rivalMomentumBadge._eventDetail = `Victor threat: ${mLabel}. ${mDescriptions[mLabel]} (Momentum: ${momentum})`;
      if (mLabel === 'CRIT') {
        this._rivalMomentumBadge.style.animation = 'hud-pulse 1.2s infinite';
      } else {
        this._rivalMomentumBadge.style.animation = '';
      }
    } else {
      this._rivalMomentumBadge.style.display = 'none';
    }

    // ── Weather Ticker (top bar) ──
    this._updateWeatherTicker(s);

    // ── BOTTOM BAR UPDATES ──

    // Filter status
    const effPct = q.filterCount > 0 ? Math.floor(q.avgEfficiency * 100) : 0;
    const effColor = effPct >= 70 ? '#00e436' : effPct >= 40 ? '#ffa300' : '#ff004d';

    if (q.filterCount > 0) {
      this._filterEffEl.textContent = `${effPct}%`;
      this._filterEffEl.style.color = effColor;
      this._filterEffEl.style.display = '';
      this._filterBarFill.style.width = `${Math.floor(40 * (effPct / 100))}px`;
      this._filterBarFill.style.background = effColor;
      this._filterBarOuter.style.display = '';
      this._filterCountEl.textContent = `${q.filterCount} filters (${q.healthyCount}\u2713 ${q.warningCount}\u26a0 ${q.brokenCount}\u2716)`;
      this._filterCountEl.style.display = '';
      this._filterNoneEl.style.display = 'none';
    } else {
      this._filterEffEl.style.display = 'none';
      this._filterBarOuter.style.display = 'none';
      this._filterCountEl.style.display = 'none';
      this._filterNoneEl.style.display = '';
    }

    // Domain health bars
    const health = s.domainHealth;
    const activeConsequences = s.activeConsequences ?? [];
    if (health) {
      this._domainSection.style.display = '';
      for (const key of ['air', 'water', 'hvac', 'drainage']) {
        const d = this._domainEls[key];
        const score = health[key] ?? 100;
        const barColor = score > 80 ? '#00e436' : score >= 50 ? '#ffec27' : score >= 25 ? '#ffa300' : '#ff004d';
        const fillW = Math.floor(40 * (score / 100));
        d.barFill.style.width = `${fillW}px`;
        d.barFill.style.background = barColor;
        // Trend arrow from 5-day rolling health history
        const hist = s.domainHealthHistory?.[key];
        let trendArrow = '\u25b8'; // stable (▸)
        let trendColor = '#888';   // gray
        if (hist && hist.length >= 4) {
          const len = hist.length;
          const recentAvg = (hist[len - 1] + hist[len - 2]) / 2;
          const earlyAvg = (hist[0] + hist[1]) / 2;
          if (recentAvg - earlyAvg >= 3) {
            trendArrow = '\u25b2'; // ▲ improving
            trendColor = '#00e436'; // green
          } else if (earlyAvg - recentAvg >= 3) {
            trendArrow = '\u25bc'; // ▼ declining
            trendColor = '#ff004d'; // red
          }
        }
        d.pctEl.textContent = `${Math.floor(score)}%`;
        d.pctEl.style.color = barColor;
        // Trend arrow shown in the trendEl (appended after pctEl)
        d.trendEl.textContent = trendArrow;
        d.trendEl.style.color = trendColor;

        // Accessibility symbol for color-blind players
        if (score > 80) {
          d.statusSymbol.textContent = '\u2713';
          d.statusSymbol.style.color = '#00e436';
        } else if (score >= 50) {
          d.statusSymbol.textContent = '~';
          d.statusSymbol.style.color = '#ffec27';
        } else if (score >= 25) {
          d.statusSymbol.textContent = '\u26a0';
          d.statusSymbol.style.color = '#ffa300';
        } else {
          d.statusSymbol.textContent = '\u2717';
          d.statusSymbol.style.color = '#ff004d';
        }

        // Hysteresis: activate pulse at <20%, deactivate at >25%
        if (score < 20) {
          this._domainPulseActive[key] = true;
        } else if (score > 25) {
          this._domainPulseActive[key] = false;
        }
        if (this._domainPulseActive[key]) {
          d.wrap.style.animation = score < 15 ? 'hud-crisis-glow 0.8s infinite' : 'hud-pulse 1s infinite';
        } else {
          d.wrap.style.animation = '';
        }

        // Consequence tooltip/inline
        const domainConsequence = score < 80
          ? activeConsequences.find(c => c.domain === key)
          : null;
        const consequenceLabel = domainConsequence ? ` \u2014 ${domainConsequence.label}` : '';
        d.wrap.title = `${d.label}: ${Math.floor(score)}%${consequenceLabel}`;

        if (domainConsequence && score < 50) {
          d.inlineLabel.textContent = domainConsequence.label;
          d.inlineLabel.style.color = score < 25 ? '#ff004d' : '#ffa300';
          d.inlineLabel.style.display = '';
        } else {
          d.inlineLabel.style.display = 'none';
        }
      }
    } else {
      this._domainSection.style.display = 'none';
    }

    // Reputation budget indicator
    const repBudget = s._repChangesToday ?? { positive: 0, negative: 0 };
    const gainUsed = Math.floor(repBudget.positive ?? 0);
    const lossUsed = Math.floor(Math.abs(repBudget.negative ?? 0));
    const gainCap = 3;
    const lossCap = 5;
    const gainExhausted = gainUsed >= gainCap;
    const lossExhausted = lossUsed >= lossCap;
    this._repBudgetGain.textContent = `+${gainUsed}/${gainCap}`;
    this._repBudgetGain.style.color = gainExhausted ? '#555' : '#00e436';
    this._repBudgetLoss.textContent = `-${lossUsed}/${lossCap}`;
    this._repBudgetLoss.style.color = lossExhausted ? '#555' : '#ff004d';
    const gainPct = Math.min(100, Math.floor((gainUsed / gainCap) * 100));
    const lossPct = Math.min(100, Math.floor((lossUsed / lossCap) * 100));
    this._repGainBarFill.style.width = `${gainPct}%`;
    this._repGainBarFill.style.background = gainExhausted ? '#555' : '#00e436';
    this._repLossBarFill.style.width = `${lossPct}%`;
    this._repLossBarFill.style.background = lossExhausted ? '#555' : '#ff004d';
    this._repBudgetSection.style.opacity = (gainExhausted && lossExhausted) ? '0.5' : '1';

    // Weather forecast icons (3-day) in bottom bar
    const forecastData = s.weatherForecast;
    const _forecastWeatherIcons = {
      'Heavy Rain': '\u26c8', 'Light Rain': '\ud83c\udf27', 'Heatwave': '\u2600\ufe0f',
      'Cold Snap': '\u2744', 'Humidity Spike': '\ud83d\udca7', 'Wind Storm': '\ud83c\udf2c',
      'Snow/Ice': '\u2744', 'Fog': '\ud83c\udf2b', 'Ice Storm': '\u2744',
      'Dust Storm': '\ud83c\udf2a', 'Flash Flood': '\ud83c\udf0a', 'Clear': '\u2600',
    };
    const _severityColors = { 0: '#e0e0e0', 1: '#ffec27', 2: '#ffa300', 3: '#ff004d' };
    if (Array.isArray(forecastData)) {
      for (let fi = 0; fi < 3; fi++) {
        const fc = forecastData[fi];
        const iconEl = this._forecastIcons[fi];
        if (!iconEl) continue;
        if (fc) {
          const emoji = _forecastWeatherIcons[fc.name] ?? '\u2601';
          iconEl.textContent = emoji;
          iconEl.style.color = _severityColors[fc.severity ?? 0] ?? '#888';
          const dayLabel = fi === 0 ? 'Today' : fi === 1 ? 'Tomorrow' : 'Day 3';
          const domainsList = (fc.domainsAffected ?? []).join(', ') || 'none';
          const confStars = '\u2605'.repeat(fc.confidence ?? 0) + '\u2606'.repeat(5 - (fc.confidence ?? 0));
          iconEl.title = `${dayLabel}: ${fc.name} (sev ${fc.severity ?? 0}) \u2014 Domains: ${domainsList} | Confidence: ${confStars} ${fc.confidenceLabel ?? ''}`;
          iconEl.style.display = '';
        } else {
          iconEl.style.display = 'none';
        }
      }
      this._forecastSection.style.display = '';
    } else {
      this._forecastSection.style.display = 'none';
    }

    // Alert badge
    const alertCount = q.warningCount + q.brokenCount;
    if (alertCount > 0) {
      this._alertBadge.textContent = `\u26a0 ${alertCount}`;
      this._alertBadge.style.color = '#ff004d';
      this._alertBadge.style.fontSize = '9px';
    } else {
      this._alertBadge.textContent = '\u2713 OK';
      this._alertBadge.style.color = '#2d8e2d';
      this._alertBadge.style.fontSize = '8px';
    }
  }

  render() {
    // HTML-based, updates happen in update()
  }
}
