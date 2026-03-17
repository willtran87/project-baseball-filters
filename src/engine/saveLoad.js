/**
 * SaveLoad — Serialize/deserialize game state to localStorage.
 *
 * Provides 3 manual save slots plus an auto-save slot.
 * Saves are versioned for future migration support.
 */

const STORAGE_PREFIX = 'stadium_filters_';
const AUTO_SAVE_KEY = `${STORAGE_PREFIX}auto`;
const SLOT_KEY = (n) => `${STORAGE_PREFIX}slot_${n}`;
const MAX_SLOTS = 3;

export class SaveLoad {
  constructor(stateManager, eventBus) {
    this.state = stateManager;
    this.eventBus = eventBus;

    this.eventBus.on('game:newDay', () => this.autoSave());

    // Periodic auto-save every 15 seconds
    this._autoSaveInterval = setInterval(() => this.autoSave(), 15000);

    // Save on page unload (browser close/refresh)
    this._beforeUnloadHandler = () => this.autoSave();
    window.addEventListener('beforeunload', this._beforeUnloadHandler);
  }

  /**
   * Clean up timers and event listeners.
   * Call when the game is fully torn down or before creating a new SaveLoad instance.
   */
  destroy() {
    if (this._autoSaveInterval !== null) {
      clearInterval(this._autoSaveInterval);
      this._autoSaveInterval = null;
    }
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      this._beforeUnloadHandler = null;
    }
  }

  /**
   * Save current state to a numbered slot (1-3).
   */
  saveToSlot(slot) {
    if (slot < 1 || slot > MAX_SLOTS) return false;
    return this._write(SLOT_KEY(slot), this.state.serialize());
  }

  /**
   * Load state from a numbered slot (1-3).
   */
  loadFromSlot(slot) {
    if (slot < 1 || slot > MAX_SLOTS) return false;
    const data = this._read(SLOT_KEY(slot));
    if (!data) return false;
    this.state.deserialize(data);
    this.eventBus.emit('ui:message', { text: `Loaded save slot ${slot}`, type: 'info' });
    return true;
  }

  /**
   * Auto-save (triggered at the end of each game day).
   */
  autoSave() {
    return this._write(AUTO_SAVE_KEY, this.state.serialize());
  }

  /**
   * Load from auto-save.
   */
  loadAutoSave() {
    const data = this._read(AUTO_SAVE_KEY);
    if (!data) return false;
    this.state.deserialize(data);
    this.eventBus.emit('ui:message', { text: 'Loaded auto-save', type: 'info' });
    return true;
  }

  /**
   * Check if a save slot has data.
   */
  hasSlotData(slot) {
    if (slot < 1 || slot > MAX_SLOTS) return false;
    return localStorage.getItem(SLOT_KEY(slot)) !== null;
  }

  /**
   * Check if auto-save has data.
   */
  hasAutoSave() {
    return localStorage.getItem(AUTO_SAVE_KEY) !== null;
  }

  /**
   * Get metadata for all slots (for a save/load menu).
   */
  getSlotInfo() {
    const slots = [];
    for (let i = 1; i <= MAX_SLOTS; i++) {
      const data = this._read(SLOT_KEY(i));
      if (data) {
        slots.push({
          slot: i,
          gameDay: data.gameDay,
          money: data.money,
          reputation: data.reputation,
          season: data.season ?? 1,
          savedAt: data._savedAt,
        });
      } else {
        slots.push({ slot: i, empty: true });
      }
    }
    return slots;
  }

  /**
   * Delete a save slot.
   */
  deleteSlot(slot) {
    if (slot < 1 || slot > MAX_SLOTS) return;
    localStorage.removeItem(SLOT_KEY(slot));
  }

  /**
   * Delete all save data.
   */
  deleteAll() {
    localStorage.removeItem(AUTO_SAVE_KEY);
    for (let i = 1; i <= MAX_SLOTS; i++) {
      localStorage.removeItem(SLOT_KEY(i));
    }
  }

  _write(key, data) {
    try {
      const toStore = { ...data, _savedAt: Date.now() };
      localStorage.setItem(key, JSON.stringify(toStore));
      return true;
    } catch (e) {
      this.eventBus.emit('ui:message', { text: 'Save failed: storage full', type: 'warning' });
      return false;
    }
  }

  _read(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
}
