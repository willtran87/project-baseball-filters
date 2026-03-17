/**
 * SettingsPanel -- Audio and display settings.
 *
 * Registered with PanelManager as 'settings'.
 * Accessible from pause menu (Settings button) or comma key.
 * Persists settings to localStorage under 'raptors_settings'.
 */

const SETTINGS_KEY = 'raptors_settings';

const DEFAULTS = {
  masterVolume: 50,
  musicVolume: 30,
  sfxVolume: 70,
  muted: false,
  showTooltips: true,
  showTutorialHints: true,
};

export class SettingsPanel {
  constructor(panelManager, state, eventBus, audioManager) {
    this.state = state;
    this.eventBus = eventBus;
    this.panelManager = panelManager;
    this.audio = audioManager;

    // Load saved settings and apply immediately
    this._settings = this._load();
    this._applyAll();

    panelManager.register('settings', (el, state, eventBus) => {
      this._render(el);
    });

    this.eventBus.on('ui:toggleSettings', () => {
      if (panelManager.isOpen('settings')) {
        this.eventBus.emit('ui:closePanel');
      } else {
        this.eventBus.emit('ui:openPanel', { name: 'settings' });
      }
    });
  }

  get settings() {
    return this._settings;
  }

  // ── Persistence ──────────────────────────────────────────

  _load() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULTS, ...parsed };
      }
    } catch (_) { /* ignore corrupt data */ }
    return { ...DEFAULTS };
  }

  _save() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this._settings));
    } catch (_) { /* storage full or unavailable */ }
  }

  // ── Apply settings to game systems ───────────────────────

  _applyAll() {
    const s = this._settings;
    this.audio.setMasterVolume(s.masterVolume / 100);
    this.audio.setMusicVolume(s.musicVolume / 100);
    this.audio.setSfxVolume(s.sfxVolume / 100);
    if (s.muted && !this.audio.muted) this.audio.toggleMute();
    if (!s.muted && this.audio.muted) this.audio.toggleMute();

    // Store display prefs on state so other UI can read them
    this.state.showTooltips = s.showTooltips;
    this.state.showTutorialHints = s.showTutorialHints;
  }

  _applyVolume(type, value) {
    this._settings[type] = value;
    const v = value / 100;
    if (type === 'masterVolume') this.audio.setMasterVolume(v);
    else if (type === 'musicVolume') this.audio.setMusicVolume(v);
    else if (type === 'sfxVolume') this.audio.setSfxVolume(v);
    this._save();
  }

  _applyToggle(key, checked) {
    this._settings[key] = checked;
    if (key === 'muted') {
      if (checked && !this.audio.muted) this.audio.toggleMute();
      if (!checked && this.audio.muted) this.audio.toggleMute();
    }
    if (key === 'showTooltips') this.state.showTooltips = checked;
    if (key === 'showTutorialHints') this.state.showTutorialHints = checked;
    this._save();
  }

  // ── Render ───────────────────────────────────────────────

  _render(el) {
    const s = this._settings;

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong style="font-size:12px;color:#ffec27;letter-spacing:1px">SETTINGS</strong>
        <span data-action="close" style="cursor:pointer;color:#888;font-size:12px">\u2715</span>
      </div>

      <div style="display:flex;gap:24px;flex-wrap:wrap">
        <!-- Audio Section -->
        <div style="flex:1;min-width:180px">
          <div style="color:#8b4513;font-size:9px;letter-spacing:2px;margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:3px">AUDIO</div>

          <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:10px">
            <span style="min-width:60px;color:#aaa">Master</span>
            <input type="range" min="0" max="100" value="${s.masterVolume}" data-vol="masterVolume"
              style="flex:1;accent-color:#ffec27;height:4px;cursor:pointer">
            <span data-vol-label="masterVolume" style="min-width:28px;text-align:right;color:#ffec27;font-size:9px">${s.masterVolume}%</span>
          </label>

          <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:10px">
            <span style="min-width:60px;color:#aaa">Music</span>
            <input type="range" min="0" max="100" value="${s.musicVolume}" data-vol="musicVolume"
              style="flex:1;accent-color:#29adff;height:4px;cursor:pointer">
            <span data-vol-label="musicVolume" style="min-width:28px;text-align:right;color:#29adff;font-size:9px">${s.musicVolume}%</span>
          </label>

          <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:10px">
            <span style="min-width:60px;color:#aaa">SFX</span>
            <input type="range" min="0" max="100" value="${s.sfxVolume}" data-vol="sfxVolume"
              style="flex:1;accent-color:#00e436;height:4px;cursor:pointer">
            <span data-vol-label="sfxVolume" style="min-width:28px;text-align:right;color:#00e436;font-size:9px">${s.sfxVolume}%</span>
          </label>

          <label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:10px;cursor:pointer">
            <input type="checkbox" data-toggle="muted" ${s.muted ? 'checked' : ''}
              style="accent-color:#ff004d;cursor:pointer">
            <span style="color:#aaa">Mute All Audio</span>
          </label>
        </div>

        <!-- Game Section -->
        <div style="flex:1;min-width:180px">
          <div style="color:#8b4513;font-size:9px;letter-spacing:2px;margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:3px">GAME</div>

          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:10px">
            <span style="min-width:60px;color:#aaa">Difficulty</span>
            <span style="color:${
              this.state.difficulty === 'rookie' ? '#00e436' :
              this.state.difficulty === 'allStar' ? '#ff8844' :
              this.state.difficulty === 'hallOfFame' ? '#ff004d' : '#ffec27'
            };font-weight:bold;letter-spacing:1px">${
              this.state.difficulty === 'rookie' ? 'ROOKIE' :
              this.state.difficulty === 'allStar' ? 'ALL-STAR' :
              this.state.difficulty === 'hallOfFame' ? 'HALL OF FAME' : 'VETERAN'
            }</span>
          </div>
        </div>

        <!-- Display Section -->
        <div style="flex:1;min-width:180px">
          <div style="color:#8b4513;font-size:9px;letter-spacing:2px;margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:3px">DISPLAY</div>

          <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:10px;cursor:pointer">
            <input type="checkbox" data-toggle="showTooltips" ${s.showTooltips ? 'checked' : ''}
              style="accent-color:#29adff;cursor:pointer">
            <span style="color:#aaa">Show Tooltips</span>
          </label>

          <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:10px;cursor:pointer">
            <input type="checkbox" data-toggle="showTutorialHints" ${s.showTutorialHints ? 'checked' : ''}
              style="accent-color:#29adff;cursor:pointer">
            <span style="color:#aaa">Show Tutorial Hints</span>
          </label>
        </div>
      </div>
    `;

    // Wire slider events
    el.querySelectorAll('[data-vol]').forEach(slider => {
      slider.addEventListener('input', () => {
        const key = slider.dataset.vol;
        const val = parseInt(slider.value, 10);
        this._applyVolume(key, val);
        const label = el.querySelector(`[data-vol-label="${key}"]`);
        if (label) label.textContent = `${val}%`;
      });
    });

    // Wire toggle events
    el.querySelectorAll('[data-toggle]').forEach(cb => {
      cb.addEventListener('change', () => {
        this._applyToggle(cb.dataset.toggle, cb.checked);
      });
    });

    // Close button
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close"]')) {
        this.eventBus.emit('ui:closePanel');
      }
    });

    // Focus for accessibility
    el.tabIndex = 0;
    el.focus();
  }
}
