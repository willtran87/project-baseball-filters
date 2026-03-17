/**
 * Menus — Start screen, pause menu, and game over screen.
 *
 * Manages full-screen overlay menus that block game interaction.
 */

import { showConfirmDialog } from './notifications.js';

export class MenuManager {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this._el = null;
    this._currentMenu = null;
    this._saveLoad = null;

    this.eventBus.on('ui:showMenu', ({ menu }) => this.show(menu));
    this.eventBus.on('ui:hideMenu', () => this.hide());
    this.eventBus.on('game:over', (data) => this.showGameOver(data));

    // On init: auto-load save if available, otherwise show start screen
    this.eventBus.on('game:init', () => {
      if (this._saveLoad && this._saveLoad.hasAutoSave()) {
        this._saveLoad.loadAutoSave();
        this.eventBus.emit('game:resume');
      } else {
        this.show('start');
      }
    });
  }

  /**
   * Provide SaveLoad reference for slot metadata display.
   */
  setSaveLoad(saveLoad) {
    this._saveLoad = saveLoad;
  }

  /**
   * Provide PrestigeSystem reference for legacy shop.
   */
  setPrestige(prestige) {
    this._prestige = prestige;
  }

  show(menuName) {
    this.hide();
    this._currentMenu = menuName;

    this._el = document.createElement('div');
    this._el.id = 'menu-overlay';
    this._el.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex; justify-content: center; align-items: center;
      font-family: monospace; color: #e0e0e0;
      z-index: 50;
    `;

    switch (menuName) {
      case 'start':
        this._renderStartMenu();
        break;
      case 'pause':
        this._renderPauseMenu();
        break;
      case 'gameOver':
        this._renderGameOver();
        break;
      default:
        this.hide();
        return;
    }

    this.container.appendChild(this._el);
  }

  hide() {
    if (this._el) {
      this._el.remove();
      this._el = null;
      this._currentMenu = null;
    }
  }

  get isVisible() {
    return this._el !== null;
  }

  get currentMenu() {
    return this._currentMenu;
  }

  // ── Start Menu ────────────────────────────────────

  _renderStartMenu() {
    const inner = document.createElement('div');
    inner.style.cssText = 'text-align:center;max-width:420px;';

    // ASCII baseball
    const baseballArt = `<pre style="color:#8b4513;font-size:7px;line-height:1.1;margin:8px auto;font-family:monospace;opacity:0.6">
    ,---._
  ,'  /   \`.
 /   / ,-. \\
|   | /   \\ |
|   | \\   / |
 \\   \\ '-' /
  \`.  \\   ,'
    \`---'
</pre>`;

    inner.innerHTML = `
      ${baseballArt}
      <div style="font-size:10px;color:#ff004d;letter-spacing:3px;margin-bottom:2px;text-shadow:1px 1px 0 #4a0018">
        RIDGEMONT RAPTORS
      </div>
      <div style="font-size:20px;color:#ffec27;margin-bottom:2px;letter-spacing:2px;text-shadow:2px 2px 0 #4a3a00">
        MINOR LEAGUE MAJOR FILTRATION
      </div>
      <div style="font-size:8px;color:#8b4513;margin-bottom:12px;letter-spacing:4px">
        \u26be FROM THE GROUND UP \u26be
      </div>
      <div style="font-size:9px;color:#8a7a6a;margin-bottom:18px;max-width:360px;line-height:1.6;text-align:center;font-style:italic;border-left:2px solid #8b4513;border-right:2px solid #8b4513;padding:8px 12px;background:rgba(139,69,19,0.05)">
        You are <span style="color:#ffccaa">Casey "Pipes" Peralta</span>, hired to fix the crumbling
        filtration systems of a minor-league baseball stadium after the
        <span style="color:#ff004d">"Browntide Incident"</span>.<br><br>
        Your mission: restore Ridgemont Stadium from condemned to Major League status.
        Maintain air, water, HVAC, and drainage filtration systems.
        Build your reputation through quality maintenance.
        Reach 86+ reputation and host a championship game to prove the Raptors belong in the big leagues.
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:center">
        <button data-action="start-game" style="
          background:linear-gradient(180deg,#1a3a2a,#0d2a1a);color:#00e436;
          border:2px solid #3a6a4a;border-radius:3px;
          padding:10px 32px;font-family:monospace;font-size:14px;cursor:pointer;
          width:220px;letter-spacing:2px;
          box-shadow:0 2px 8px rgba(0,228,54,0.2);
          transition:box-shadow 0.2s ease,transform 0.1s ease;
        ">\u26be PLAY BALL</button>
        <button data-action="load-game" style="
          background:linear-gradient(180deg,#1a2a3a,#0d1a2a);color:#29adff;
          border:2px solid #3a5a6a;border-radius:3px;
          padding:7px 32px;font-family:monospace;font-size:11px;cursor:pointer;
          width:220px;letter-spacing:1px;
          transition:box-shadow 0.2s ease,transform 0.1s ease;
        ">CONTINUE SEASON</button>
        ${this._prestige && this._prestige.isVisible() ? `<button data-action="legacy-shop" style="
          background:linear-gradient(180deg,#2a2a1a,#1a1a0d);color:#ffec27;
          border:2px solid #5a5a3a;border-radius:3px;
          padding:7px 32px;font-family:monospace;font-size:11px;cursor:pointer;
          width:220px;letter-spacing:1px;
          transition:box-shadow 0.2s ease,transform 0.1s ease;
        ">LEGACY</button>` : ''}
      </div>
      <div style="margin-top:20px;font-size:8px;color:#5f574f;line-height:1.6">
        Install filters on vent slots \u2022 Survive game days \u2022 Build reputation<br>
        <span style="color:#4a4a6a">Press S for Shop \u2022 SPACE to pause \u2022 ESC for menu</span>
      </div>
    `;

    inner.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      this.eventBus.emit('ui:click');
      if (action === 'start-game') {
        this._showDifficultySelect();
      } else if (action === 'load-game') {
        this.eventBus.emit('game:quickLoad');
        this.hide();
        this.eventBus.emit('game:resume');
      } else if (action === 'legacy-shop') {
        this._showPrestigeShop('start');
      }
    });

    this._el.appendChild(inner);
  }

  // ── Difficulty Select ────────────────────────────────

  _showDifficultySelect() {
    // Replace start menu content with difficulty selection
    if (!this._el) return;
    this._el.innerHTML = '';

    const inner = document.createElement('div');
    inner.style.cssText = 'text-align:center;max-width:460px;';

    const difficulties = [
      {
        key: 'rookie',
        name: 'ROOKIE',
        color: '#00e436',
        desc: 'Forgiving and educational. Learn the ropes without pressure.',
        stats: 'Income +25% | Expenses -20% | Degradation -40%',
      },
      {
        key: 'veteran',
        name: 'VETERAN',
        color: '#ffec27',
        desc: 'The intended experience. Fair challenge, fair rewards.',
        stats: 'All modifiers at baseline (1.0x)',
      },
      {
        key: 'allStar',
        name: 'ALL-STAR',
        color: '#ff8844',
        desc: 'Punishes mistakes. Tighter margins, stricter inspections.',
        stats: 'Income -15% | Expenses +20% | Degradation +40%',
      },
      {
        key: 'hallOfFame',
        name: 'HALL OF FAME',
        color: '#ff004d',
        desc: 'Survival mode. Every dollar counts, every filter matters.',
        stats: 'Income -30% | Expenses +40% | Degradation +80%',
      },
    ];

    let buttonsHtml = '';
    for (const d of difficulties) {
      const isDefault = d.key === 'veteran';
      const borderStyle = isDefault ? `border:2px solid ${d.color}` : 'border:1px solid #444';
      const bgOpacity = isDefault ? '0.15' : '0.05';
      buttonsHtml += `
        <button data-difficulty="${d.key}" style="
          display:block;width:100%;text-align:left;
          background:rgba(${d.key === 'rookie' ? '0,228,54' : d.key === 'veteran' ? '255,236,39' : d.key === 'allStar' ? '255,136,68' : '255,0,77'},${bgOpacity});
          ${borderStyle};border-radius:3px;
          padding:8px 12px;font-family:monospace;cursor:pointer;
          margin-bottom:6px;
          transition:border-color 0.15s ease,background 0.15s ease;
        ">
          <div style="font-size:11px;color:${d.color};letter-spacing:2px;font-weight:bold;margin-bottom:2px">
            ${d.name}${isDefault ? ' <span style="font-size:8px;color:#888;letter-spacing:0">(default)</span>' : ''}
          </div>
          <div style="font-size:8px;color:#b0b0c0;margin-bottom:3px;font-style:italic">${d.desc}</div>
          <div style="font-size:8px;color:#888">${d.stats}</div>
        </button>`;
    }

    inner.innerHTML = `
      <div style="font-size:10px;color:#8b4513;letter-spacing:3px;margin-bottom:4px">SELECT DIFFICULTY</div>
      <div style="font-size:8px;color:#83769c;margin-bottom:14px">
        Choose your challenge level. This affects income, costs, and filter degradation.
      </div>
      <div style="display:flex;flex-direction:column;gap:0;align-items:center;max-width:380px;margin:0 auto">
        ${buttonsHtml}
      </div>
      <button data-action="back" style="
        margin-top:10px;
        background:transparent;color:#666;border:1px solid #333;border-radius:2px;
        padding:4px 16px;font-family:monospace;font-size:9px;cursor:pointer;
      ">BACK</button>
    `;

    inner.addEventListener('click', (e) => {
      const diffBtn = e.target.closest('[data-difficulty]');
      if (diffBtn) {
        this.eventBus.emit('ui:click');
        const selectedDifficulty = diffBtn.dataset.difficulty;

        const startNew = () => {
          this.state._initDefaults(this.state.config);
          this.state.difficulty = selectedDifficulty;
          if (this._prestige) {
            this._prestige.applyUnlocks(this.state);
          }
          this.eventBus.emit('state:loaded', {});
          this.hide();
          this.eventBus.emit('game:resume');
        };

        if (this._newGamePending) {
          this._newGamePending = false;
          showConfirmDialog(
            this._el,
            'All unsaved progress will be lost. Are you sure?',
            startNew,
            'CONFIRM'
          );
        } else {
          startNew();
        }
        return;
      }
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'back') {
        this.eventBus.emit('ui:click');
        if (this._newGamePending) {
          this._newGamePending = false;
          this.show('pause');
        } else {
          this.show('start');
        }
      }
    });

    this._el.appendChild(inner);
  }

  // ── Pause Menu ────────────────────────────────────

  _renderPauseMenu() {
    const inner = document.createElement('div');
    inner.style.cssText = 'text-align:center;max-width:300px;';

    const tier = this.state.reputation >= 86 ? 'Major League' :
                 this.state.reputation >= 71 ? 'Triple-A' :
                 this.state.reputation >= 56 ? 'Double-A' :
                 this.state.reputation >= 41 ? 'Single-A' :
                 this.state.reputation >= 21 ? 'Minor League' : 'Condemned';

    inner.innerHTML = `
      <div style="font-size:10px;color:#8b4513;letter-spacing:3px;margin-bottom:4px">\u26be RAPTORS \u26be</div>
      <div style="font-size:16px;color:#ffec27;margin-bottom:4px">TIMEOUT</div>
      <div style="font-size:9px;color:#83769c;margin-bottom:14px">
        Game ${this.state.gameDay} \u2022 Inning ${this.state.inning}/9 \u2022 ${tier}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:center">
        <button data-action="resume" style="
          background:linear-gradient(180deg,#1a3a2a,#0d2a1a);color:#00e436;border:1px solid #3a6a4a;
          padding:7px 24px;font-family:monospace;font-size:12px;cursor:pointer;
          width:190px;border-radius:2px;letter-spacing:1px;
        ">\u25b6 RESUME</button>
        <button data-action="journal" style="
          background:linear-gradient(180deg,#2a2a1a,#1a1a0d);color:#ffc83c;border:1px solid #5a5a3a;
          padding:5px 24px;font-family:monospace;font-size:11px;cursor:pointer;
          width:190px;border-radius:2px;
        ">\u{1f4d3} JOURNAL</button>
        <button data-action="save" style="
          background:linear-gradient(180deg,#1a2a3a,#0d1a2a);color:#29adff;border:1px solid #3a5a6a;
          padding:5px 24px;font-family:monospace;font-size:11px;cursor:pointer;
          width:190px;border-radius:2px;
        ">\u{1f4be} SAVE GAME</button>
        <button data-action="load" style="
          background:linear-gradient(180deg,#2a2a3a,#1a1a2a);color:#83769c;border:1px solid #4a4a6a;
          padding:5px 24px;font-family:monospace;font-size:11px;cursor:pointer;
          width:190px;border-radius:2px;
        ">\u{1f4c2} LOAD GAME</button>
        <button data-action="settings" style="
          background:linear-gradient(180deg,#2a2a2a,#1a1a1a);color:#c0c0d0;border:1px solid #4a4a4a;
          padding:5px 24px;font-family:monospace;font-size:11px;cursor:pointer;
          width:190px;border-radius:2px;
        ">\u2699 SETTINGS</button>
        <button data-action="help" style="
          background:linear-gradient(180deg,#2a2a2a,#1a1a1a);color:#c0c0d0;border:1px solid #4a4a4a;
          padding:5px 24px;font-family:monospace;font-size:11px;cursor:pointer;
          width:190px;border-radius:2px;
        ">? HELP</button>
        <button data-action="new-game" style="
          background:linear-gradient(180deg,#3a1a1a,#2a0d0d);color:#ff004d;border:1px solid #6a3a3a;
          padding:5px 24px;font-family:monospace;font-size:11px;cursor:pointer;
          width:190px;border-radius:2px;margin-top:6px;
        ">\u{1f504} NEW GAME</button>
      </div>
      <div style="margin-top:14px;font-size:8px;color:#5f574f">
        Budget: $${this.state.money.toLocaleString()} \u2022 Rep: ${Math.floor(this.state.reputation)}%
      </div>
    `;

    inner.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      this.eventBus.emit('ui:click');
      if (action === 'resume') {
        this.hide();
        this.eventBus.emit('game:resume');
      } else if (action === 'journal') {
        this.hide();
        this.eventBus.emit('ui:openPanel', { name: 'journal', data: { tab: 'story' } });
      } else if (action === 'save') {
        this._showSaveSlots();
      } else if (action === 'load') {
        this._showLoadSlots();
      } else if (action === 'settings') {
        this.hide();
        this.eventBus.emit('game:resume');
        this.eventBus.emit('ui:toggleSettings');
      } else if (action === 'help') {
        this.hide();
        this.eventBus.emit('game:resume');
        this.eventBus.emit('ui:toggleHelp');
      } else if (action === 'new-game') {
        this._newGamePending = true;
        this._showDifficultySelect();
      }
    });

    this._el.appendChild(inner);
  }

  // ── Save Slot Selection ────────────────────────────

  _formatSlotLabel(info) {
    if (!info || info.empty) return 'Empty';
    const day = info.gameDay ?? '?';
    const money = info.money != null ? `$${info.money.toLocaleString()}` : '$?';
    const rep = info.reputation != null ? `${Math.floor(info.reputation)}%` : '?%';
    const season = info.season ?? 1;
    return `Day ${day} | ${money} | Rep ${rep} | Season ${season}`;
  }

  _slotAge(info) {
    if (!info || info.empty || !info.savedAt) return '';
    const ago = Date.now() - info.savedAt;
    if (ago < 60000) return 'just now';
    if (ago < 3600000) return `${Math.floor(ago / 60000)}m ago`;
    if (ago < 86400000) return `${Math.floor(ago / 3600000)}h ago`;
    return `${Math.floor(ago / 86400000)}d ago`;
  }

  _showSaveSlots() {
    if (!this._el) return;
    this._el.innerHTML = '';

    const inner = document.createElement('div');
    inner.style.cssText = 'text-align:center;max-width:380px;';

    const slots = this._saveLoad ? this._saveLoad.getSlotInfo() : [];

    let slotsHtml = '';
    for (let i = 1; i <= 3; i++) {
      const info = slots.find(s => s.slot === i);
      const label = this._formatSlotLabel(info);
      const age = this._slotAge(info);
      const isEmpty = !info || info.empty;
      const labelColor = isEmpty ? '#555' : '#c0c0d0';
      const ageHtml = age ? `<span style="color:#666;font-size:7px;margin-left:4px">${age}</span>` : '';
      slotsHtml += `
        <button data-save-slot="${i}" style="
          display:block;width:100%;text-align:left;
          background:rgba(41,173,255,0.05);
          border:1px solid ${isEmpty ? '#333' : '#3a5a6a'};border-radius:3px;
          padding:8px 12px;font-family:monospace;cursor:pointer;
          margin-bottom:6px;
        ">
          <div style="font-size:10px;color:#29adff;letter-spacing:1px;margin-bottom:2px">
            SLOT ${i}${ageHtml}
          </div>
          <div style="font-size:9px;color:${labelColor}">${label}</div>
        </button>`;
    }

    inner.innerHTML = `
      <div style="font-size:10px;color:#8b4513;letter-spacing:3px;margin-bottom:4px">\u{1f4be} SAVE GAME</div>
      <div style="font-size:8px;color:#83769c;margin-bottom:14px">Select a slot to save your progress.</div>
      <div style="max-width:340px;margin:0 auto">${slotsHtml}</div>
      <button data-action="back-to-pause" style="
        margin-top:10px;background:transparent;color:#666;border:1px solid #333;border-radius:2px;
        padding:4px 16px;font-family:monospace;font-size:9px;cursor:pointer;
      ">BACK</button>
    `;

    inner.addEventListener('click', (e) => {
      const slotBtn = e.target.closest('[data-save-slot]');
      if (slotBtn) {
        this.eventBus.emit('ui:click');
        const slot = parseInt(slotBtn.dataset.saveSlot, 10);
        this.eventBus.emit('game:save', { slot });
        // Refresh after save
        setTimeout(() => this._showSaveSlots(), 100);
        return;
      }
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'back-to-pause') {
        this.eventBus.emit('ui:click');
        this.show('pause');
      }
    });

    this._el.appendChild(inner);
  }

  _showLoadSlots() {
    if (!this._el) return;
    this._el.innerHTML = '';

    const inner = document.createElement('div');
    inner.style.cssText = 'text-align:center;max-width:380px;';

    const slots = this._saveLoad ? this._saveLoad.getSlotInfo() : [];

    // Also check auto-save
    let autoLabel = 'Empty';
    let autoAge = '';
    if (this._saveLoad && this._saveLoad.hasAutoSave()) {
      const autoData = this._saveLoad._read ? null : null; // need to read auto-save metadata
      // Read auto-save data for metadata
      try {
        const raw = localStorage.getItem('stadium_filters_auto');
        if (raw) {
          const d = JSON.parse(raw);
          autoLabel = `Day ${d.gameDay ?? '?'} | $${(d.money ?? 0).toLocaleString()} | Rep ${Math.floor(d.reputation ?? 0)}% | Season ${d.season ?? 1}`;
          if (d._savedAt) {
            const ago = Date.now() - d._savedAt;
            if (ago < 60000) autoAge = 'just now';
            else if (ago < 3600000) autoAge = `${Math.floor(ago / 60000)}m ago`;
            else if (ago < 86400000) autoAge = `${Math.floor(ago / 3600000)}h ago`;
            else autoAge = `${Math.floor(ago / 86400000)}d ago`;
          }
        }
      } catch { /* ignore */ }
    }

    let slotsHtml = '';

    // Auto-save slot
    const autoAgeHtml = autoAge ? `<span style="color:#666;font-size:7px;margin-left:4px">${autoAge}</span>` : '';
    const autoEmpty = autoLabel === 'Empty';
    slotsHtml += `
      <button data-load-slot="auto" ${autoEmpty ? 'disabled' : ''} style="
        display:block;width:100%;text-align:left;
        background:rgba(0,228,54,0.05);
        border:1px solid ${autoEmpty ? '#333' : '#3a6a4a'};border-radius:3px;
        padding:8px 12px;font-family:monospace;cursor:${autoEmpty ? 'default' : 'pointer'};
        margin-bottom:6px;opacity:${autoEmpty ? '0.5' : '1'};
      ">
        <div style="font-size:10px;color:#00e436;letter-spacing:1px;margin-bottom:2px">
          AUTO-SAVE${autoAgeHtml}
        </div>
        <div style="font-size:9px;color:${autoEmpty ? '#555' : '#c0c0d0'}">${autoLabel}</div>
      </button>`;

    // Manual slots
    for (let i = 1; i <= 3; i++) {
      const info = slots.find(s => s.slot === i);
      const label = this._formatSlotLabel(info);
      const age = this._slotAge(info);
      const isEmpty = !info || info.empty;
      const labelColor = isEmpty ? '#555' : '#c0c0d0';
      const ageHtml = age ? `<span style="color:#666;font-size:7px;margin-left:4px">${age}</span>` : '';
      slotsHtml += `
        <button data-load-slot="${i}" ${isEmpty ? 'disabled' : ''} style="
          display:block;width:100%;text-align:left;
          background:rgba(41,173,255,0.05);
          border:1px solid ${isEmpty ? '#333' : '#3a5a6a'};border-radius:3px;
          padding:8px 12px;font-family:monospace;cursor:${isEmpty ? 'default' : 'pointer'};
          margin-bottom:6px;opacity:${isEmpty ? '0.5' : '1'};
        ">
          <div style="font-size:10px;color:#29adff;letter-spacing:1px;margin-bottom:2px">
            SLOT ${i}${ageHtml}
          </div>
          <div style="font-size:9px;color:${labelColor}">${label}</div>
        </button>`;
    }

    inner.innerHTML = `
      <div style="font-size:10px;color:#8b4513;letter-spacing:3px;margin-bottom:4px">\u{1f4c2} LOAD GAME</div>
      <div style="font-size:8px;color:#83769c;margin-bottom:14px">Select a save to load. Unsaved progress will be lost.</div>
      <div style="max-width:340px;margin:0 auto">${slotsHtml}</div>
      <button data-action="back-to-pause" style="
        margin-top:10px;background:transparent;color:#666;border:1px solid #333;border-radius:2px;
        padding:4px 16px;font-family:monospace;font-size:9px;cursor:pointer;
      ">BACK</button>
    `;

    inner.addEventListener('click', (e) => {
      const slotBtn = e.target.closest('[data-load-slot]');
      if (slotBtn && !slotBtn.disabled) {
        this.eventBus.emit('ui:click');
        const slotVal = slotBtn.dataset.loadSlot;
        if (slotVal === 'auto') {
          this.eventBus.emit('game:quickLoad');
          this.hide();
          this.eventBus.emit('game:resume');
        } else {
          const slot = parseInt(slotVal, 10);
          this.eventBus.emit('game:load', { slot });
          this.hide();
          this.eventBus.emit('game:resume');
        }
        return;
      }
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'back-to-pause') {
        this.eventBus.emit('ui:click');
        this.show('pause');
      }
    });

    this._el.appendChild(inner);
  }

  // ── Game Over Screen ──────────────────────────────

  showGameOver(data) {
    this._gameOverData = data;
    this.show('gameOver');
  }

  _renderGameOver() {
    const data = this._gameOverData ?? {};
    const inner = document.createElement('div');
    inner.style.cssText = 'text-align:center;max-width:440px;';

    const isWin = data.win === true;
    const story = this.state.story ?? {};
    const ending = data.ending ?? story.ending ?? null;

    // Determine story ending variant with baseball theming
    let title, subtitle, narrative, titleColor, icon;
    if (ending === 'secret') {
      title = 'GRAND SLAM';
      titleColor = '#ff77a8';
      icon = '\u{1f3c6}';
      subtitle = 'The Whole Truth \u2014 Secret Ending';
      narrative = data.narrative ?? 'You uncovered every secret Hank left behind. Nana Peralta\'s signature was on those blueprints all along. The Raptors won the pennant, and Victor\'s new stadium suffered a sewage failure at its grand opening. Casey "Pipes" Peralta became a legend.';
    } else if (isWin) {
      title = 'SEASON SAVED!';
      titleColor = '#00e436';
      icon = '\u26be';
      subtitle = 'The Raptors play on!';
      narrative = data.narrative ?? 'Against all odds, the filtration systems held through every game day. The fans are happy, the team is safe, and Casey "Pipes" Peralta earned a permanent spot on the crew. Batter up for next season!';
    } else {
      title = 'STRUCK OUT';
      titleColor = '#ff004d';
      icon = '\u2716';
      subtitle = data.reason ?? 'The stadium has been condemned.';
      narrative = data.narrative ?? 'The systems failed one too many times. The health inspectors pulled the plug. As Casey packs up, a young fan tugs their sleeve and says: "I wanna fix stadiums too someday." The Raptors may be gone, but the dream lives on.';
    }

    // Achievement summary
    const achievements = this.state.achievements ?? [];
    const achievementCount = achievements.length;
    const recentAchievements = achievements.slice(-3);

    // Sandbox goals summary (for wins)
    const sandboxGoals = this.state.sandboxGoals;
    let sandboxHtml = '';
    if (isWin && sandboxGoals && sandboxGoals.length > 0) {
      const sgDone = sandboxGoals.filter(g => g.completed).length;
      const sgItems = sandboxGoals.map(g =>
        `<span style="color:${g.completed ? '#00e436' : '#555'};font-size:8px">${g.completed ? '\u2713' : '\u25cb'} ${g.name}</span>`
      ).join('<br>');
      sandboxHtml = `
        <div style="margin-top:6px;padding-top:4px;border-top:1px solid #333">
          <div style="color:#ff77a8;font-size:8px;letter-spacing:1px;margin-bottom:3px">SANDBOX CHALLENGES: ${sgDone}/${sandboxGoals.length}</div>
          ${sgItems}
        </div>
      `;
    }

    // Recent achievements display
    let recentHtml = '';
    if (recentAchievements.length > 0) {
      const items = recentAchievements.map(id => {
        const label = id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return `<span style="color:#ffec27;font-size:8px">\u2605 ${label}</span>`;
      }).join('<br>');
      recentHtml = `
        <div style="margin-top:6px;padding-top:4px;border-top:1px solid #333">
          <div style="color:#8b4513;font-size:8px;letter-spacing:1px;margin-bottom:3px">RECENT ACHIEVEMENTS</div>
          ${items}
        </div>
      `;
    }

    inner.innerHTML = `
      <div style="font-size:32px;margin-bottom:4px">${icon}</div>
      <div style="font-size:18px;color:${titleColor};margin-bottom:4px;text-shadow:2px 2px 0 rgba(0,0,0,0.5)">
        ${title}
      </div>
      <div style="font-size:10px;color:#83769c;margin-bottom:12px;letter-spacing:1px">
        ${subtitle}
      </div>
      <div style="font-size:9px;color:#b0b0c0;margin-bottom:16px;line-height:1.6;
        max-width:380px;margin-left:auto;margin-right:auto;font-style:italic;
        border-left:2px solid ${titleColor};padding-left:10px;text-align:left">
        ${narrative}
      </div>
      <div style="font-size:9px;color:#888;margin-bottom:16px;background:rgba(0,0,0,0.3);padding:8px 12px;border-radius:3px;border:1px solid #333">
        <div style="color:#8b4513;font-size:8px;letter-spacing:2px;margin-bottom:4px">\u26be FINAL SCOREBOARD</div>
        Games Played: ${this.state.gameDay} \u2022 Final Rep: ${Math.floor(this.state.reputation)}% \u2022 Budget: $${this.state.money.toLocaleString()}
        <br>Achievements: ${achievementCount} / 18
        ${story.foundNotes ? `<br>Hank's Notes: ${(story.foundNotes ?? []).length}/8` : ''}
        ${story.milestones ? `<br>Milestones: ${(story.milestones ?? []).length}` : ''}
        ${recentHtml}
        ${sandboxHtml}
        ${data.prestigeBreakdown ? `
          <div style="margin-top:6px;padding-top:4px;border-top:1px solid #333">
            <div style="color:#ffec27;font-size:8px;letter-spacing:1px;margin-bottom:3px">LEGACY POINTS EARNED: +${data.prestigeBreakdown.total}</div>
            <span style="color:#888;font-size:7px">
              Base: ${data.prestigeBreakdown.basePoints}
              ${data.prestigeBreakdown.winBonus > 0 ? ` | Win: +${data.prestigeBreakdown.winBonus}` : ''}
              ${data.prestigeBreakdown.stadiumOfYear > 0 ? ` | Stadium of Year: +${data.prestigeBreakdown.stadiumOfYear}` : ''}
              ${data.prestigeBreakdown.sandboxPoints > 0 ? ` | Sandbox: +${data.prestigeBreakdown.sandboxPoints}` : ''}
              | ${data.prestigeBreakdown.difficulty} ${data.prestigeBreakdown.multiplier}x
            </span>
          </div>
        ` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:center">
        ${isWin ? `<button data-action="credits" style="
          background:linear-gradient(180deg,#2a1a2a,#1a0d1a);color:#ff77a8;
          border:2px solid #6a3a5a;border-radius:3px;
          padding:8px 32px;font-family:monospace;font-size:14px;cursor:pointer;
          letter-spacing:2px;
        ">CREDITS</button>` : ''}
        <button data-action="restart" style="
          background:linear-gradient(180deg,#1a2a3a,#0d1a2a);color:#29adff;
          border:2px solid #3a5a6a;border-radius:3px;
          padding:8px 32px;font-family:monospace;font-size:14px;cursor:pointer;
          letter-spacing:2px;
        ">NEW SEASON</button>
        <button data-action="legacy-shop" style="
          background:linear-gradient(180deg,#2a2a1a,#1a1a0d);color:#ffec27;
          border:2px solid #5a5a3a;border-radius:3px;
          padding:6px 32px;font-family:monospace;font-size:11px;cursor:pointer;
          letter-spacing:1px;
        ">LEGACY SHOP</button>
      </div>
    `;

    inner.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      this.eventBus.emit('ui:click');
      if (action === 'credits') {
        this._showCredits();
      } else if (action === 'restart') {
        this._showDifficultySelect();
      } else if (action === 'legacy-shop') {
        this._showPrestigeShop('gameOver');
      }
    });

    this._el.appendChild(inner);
  }

  // ── Prestige Shop Screen ────────────────────────────

  _showPrestigeShop(returnTo) {
    if (!this._el) return;
    this._el.innerHTML = '';

    const inner = document.createElement('div');
    inner.style.cssText = 'text-align:center;max-width:500px;';

    const renderShop = () => {
      if (!this._prestige) return;
      const data = this._prestige.getData();
      const defs = this._prestige.getUnlockDefinitions();

      let gridHtml = '';
      for (const def of defs) {
        let statusLabel, statusColor, canBuy;
        if (def.unlocked) {
          statusLabel = 'UNLOCKED';
          statusColor = '#00e436';
          canBuy = false;
        } else if (data.legacyPoints >= def.cost) {
          statusLabel = `BUY (${def.cost} LP)`;
          statusColor = '#ffec27';
          canBuy = true;
        } else {
          statusLabel = `LOCKED (${def.cost} LP)`;
          statusColor = '#666';
          canBuy = false;
        }

        gridHtml += `
          <div style="
            background:rgba(255,236,39,${def.unlocked ? '0.08' : '0.03'});
            border:1px solid ${def.unlocked ? '#5a5a3a' : '#333'};border-radius:3px;
            padding:8px;text-align:left;
          ">
            <div style="font-size:10px;color:${def.unlocked ? '#ffec27' : '#c0c0d0'};letter-spacing:1px;margin-bottom:2px;font-weight:bold">
              ${def.name}
            </div>
            <div style="font-size:8px;color:#888;margin-bottom:4px;line-height:1.4">${def.description}</div>
            <button data-buy-unlock="${def.id}" data-cost="${def.cost}" ${canBuy ? '' : 'disabled'} style="
              background:${canBuy ? 'linear-gradient(180deg,#2a2a1a,#1a1a0d)' : 'transparent'};
              color:${statusColor};
              border:1px solid ${canBuy ? '#5a5a3a' : '#333'};border-radius:2px;
              padding:3px 10px;font-family:monospace;font-size:8px;
              cursor:${canBuy ? 'pointer' : 'default'};
              opacity:${canBuy || def.unlocked ? '1' : '0.5'};
            ">${statusLabel}</button>
          </div>`;
      }

      inner.innerHTML = `
        <div style="font-size:10px;color:#8b4513;letter-spacing:3px;margin-bottom:4px">LEGACY SHOP</div>
        <div style="font-size:16px;color:#ffec27;margin-bottom:4px;letter-spacing:1px">
          ${data.legacyPoints} <span style="font-size:9px;color:#888">LEGACY POINTS</span>
        </div>
        <div style="font-size:8px;color:#83769c;margin-bottom:14px">
          Permanent bonuses that persist across all playthroughs.
        </div>
        <div style="
          display:grid;grid-template-columns:1fr 1fr;gap:6px;
          max-width:440px;margin:0 auto 14px;
        ">
          ${gridHtml}
        </div>
        <div style="font-size:9px;color:#888;margin-bottom:12px;background:rgba(0,0,0,0.3);padding:6px 10px;border-radius:3px;border:1px solid #333;display:inline-block">
          <span style="color:#8b4513;letter-spacing:1px">LIFETIME STATS</span><br>
          Games: <span style="color:#c0c0d0">${data.totalGamesPlayed}</span> |
          Wins: <span style="color:#00e436">${data.totalWins}</span> |
          Best Grade: <span style="color:#ffec27">${data.bestGrade ?? '--'}</span>
        </div>
        <div style="display:block">
          <button data-action="back-prestige" style="
            margin-top:6px;
            background:transparent;color:#666;border:1px solid #333;border-radius:2px;
            padding:4px 16px;font-family:monospace;font-size:9px;cursor:pointer;
          ">BACK</button>
        </div>
      `;
    };

    renderShop();

    inner.addEventListener('click', (e) => {
      const buyBtn = e.target.closest('[data-buy-unlock]');
      if (buyBtn && !buyBtn.disabled) {
        this.eventBus.emit('ui:click');
        const id = buyBtn.dataset.buyUnlock;
        const cost = parseInt(buyBtn.dataset.cost, 10);
        const success = this._prestige.purchaseUnlock(id, cost);
        if (success) {
          // Re-render to reflect updated state
          renderShop();
        }
        return;
      }
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'back-prestige') {
        this.eventBus.emit('ui:click');
        if (returnTo === 'gameOver') {
          this.show('gameOver');
        } else {
          this.show('start');
        }
      }
    });

    this._el.appendChild(inner);
  }

  // ── Credits Screen ──────────────────────────────────

  _showCredits() {
    if (!this._el) return;
    this._el.innerHTML = '';

    const creditsDiv = document.createElement('div');
    creditsDiv.style.cssText = `
      text-align:center;max-width:440px;width:100%;
      position:relative;overflow:hidden;
      height:100%;display:flex;flex-direction:column;justify-content:center;
    `;

    const stats = this.state.stats ?? {};
    const gamesPlayed = this.state.gameDay ?? 0;
    const finalRep = Math.floor(this.state.reputation ?? 0);
    const seasonsCompleted = stats.seasonsCompleted ?? (this.state.season ?? 1) - 1;

    const content = document.createElement('div');
    content.style.cssText = 'animation: creditsScroll 12s ease-in-out;opacity:1;';

    content.innerHTML = `
      <div style="font-size:8px;color:#8b4513;letter-spacing:4px;margin-bottom:16px">\u26be \u26be \u26be</div>

      <div style="font-size:10px;color:#ff004d;letter-spacing:3px;margin-bottom:2px;text-shadow:1px 1px 0 #4a0018">
        RIDGEMONT RAPTORS
      </div>
      <div style="font-size:16px;color:#ffec27;margin-bottom:16px;letter-spacing:2px;text-shadow:2px 2px 0 #4a3a00">
        MINOR LEAGUE MAJOR FILTRATION
      </div>

      <div style="font-size:9px;color:#888;letter-spacing:2px;margin-bottom:4px">CREATED WITH</div>
      <div style="font-size:12px;color:#29adff;margin-bottom:20px;letter-spacing:1px">Claude Code</div>

      <div style="font-size:9px;color:#888;letter-spacing:2px;margin-bottom:8px">YOUR LEGACY</div>
      <div style="font-size:10px;color:#c0c0d0;line-height:2;margin-bottom:20px">
        Games Managed: <span style="color:#ffec27">${gamesPlayed}</span><br>
        Final Reputation: <span style="color:#00e436">${finalRep}%</span><br>
        Seasons Completed: <span style="color:#29adff">${seasonsCompleted}</span><br>
        Achievements: <span style="color:#ff77a8">${(this.state.achievements ?? []).length} / 18</span>
      </div>

      <div style="width:60px;height:1px;background:#8b4513;margin:0 auto 20px"></div>

      <div style="font-size:10px;color:#ffa300;line-height:1.8;margin-bottom:20px;font-style:italic;max-width:340px;margin-left:auto;margin-right:auto">
        "The invisible work is the work that matters most.<br>
        Every pipe, every filter, every system you maintain --<br>
        that's what keeps the magic alive."<br>
        <span style="color:#888;font-size:9px">-- Hank "Duct Tape" Doolan</span>
      </div>

      <div style="font-size:11px;color:#ffec27;margin-bottom:20px;letter-spacing:2px">
        Thank you for playing!
      </div>

      <div style="font-size:8px;color:#555;margin-top:16px">Press any key to continue</div>
    `;

    creditsDiv.appendChild(content);
    this._el.appendChild(creditsDiv);

    // Add scroll animation keyframes
    if (!document.getElementById('credits-animation-style')) {
      const style = document.createElement('style');
      style.id = 'credits-animation-style';
      style.textContent = `
        @keyframes creditsScroll {
          0% { opacity: 0; transform: translateY(40px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    // Dismiss on any key or click -> return to start menu
    const dismiss = () => {
      document.removeEventListener('keydown', dismiss);
      creditsDiv.removeEventListener('click', dismiss);
      this.hide();
      this.state._initDefaults(this.state.config);
      this.eventBus.emit('state:loaded', {});
      this.show('start');
    };

    // Delay listener slightly so the current click doesn't immediately dismiss
    setTimeout(() => {
      document.addEventListener('keydown', dismiss, { once: true });
      creditsDiv.addEventListener('click', dismiss, { once: true });
    }, 500);
  }
}
