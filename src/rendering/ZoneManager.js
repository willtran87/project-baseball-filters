/**
 * ZoneManager — Manages navigable stadium zones.
 *
 * The stadium has 6 visitable zones, each with its own tile grid,
 * vent slots, and visual identity. The ZoneManager handles registration,
 * switching, and cycling between zones.
 */

export class ZoneManager {
  constructor(tileMap, state, eventBus) {
    this._tileMap = tileMap;
    this._state = state;
    this._eventBus = eventBus;
    this._zones = new Map();
    this._activeZone = 'field';
    this._zoneOrder = ['field', 'concourse', 'mechanical', 'underground', 'luxury', 'pressbox'];

    // Zone transition crossfade state (300ms total: 150ms fade out + 150ms fade in)
    this._zoneTransitionAlpha = 0;   // 0 = no overlay, 1 = full black
    this._zoneTransitionPhase = null; // 'out' | 'in' | null
    this._zoneTransitionTimer = 0;
    this._zoneTransitionDuration = 150; // ms per phase
    this._pendingZoneSwitch = null;
  }

  /**
   * Register a zone definition.
   * @param {string} id - Zone identifier
   * @param {object} definition - { name, description, grid, ventSlots, icon, color }
   */
  registerZone(id, definition) {
    this._zones.set(id, definition);
  }

  /**
   * Switch to a different zone with a crossfade transition.
   * Triggers a 300ms fade-to-black-and-back effect.
   * @param {string} zoneId - The zone to switch to
   */
  switchZone(zoneId) {
    const zone = this._zones.get(zoneId);
    if (!zone) return;

    const from = this._activeZone;
    if (from === zoneId) return;

    // If already transitioning, ignore
    if (this._zoneTransitionPhase) return;

    // Start fade-out phase; actual zone swap happens at midpoint
    this._pendingZoneSwitch = { zoneId, zone, from };
    this._zoneTransitionPhase = 'out';
    this._zoneTransitionTimer = 0;
    this._zoneTransitionAlpha = 0;

    // Disable input during transition
    this._eventBus.emit('zone:transitionStart');
  }

  /**
   * Immediately switch zone without transition (used internally at midpoint).
   */
  _applyZoneSwitch(zoneId, zone, from) {
    this._activeZone = zoneId;
    this._tileMap.setGrid(zone.grid, zone.ventSlots, zoneId);
    this._state.set('currentZone', zoneId);
    this._eventBus.emit('zone:changed', { from, to: zoneId, zone });
  }

  /**
   * Update zone transition animation. Call once per frame with delta in ms.
   */
  updateTransition(dt) {
    if (!this._zoneTransitionPhase) return;

    this._zoneTransitionTimer += dt;

    if (this._zoneTransitionPhase === 'out') {
      // Fading to black
      this._zoneTransitionAlpha = Math.min(1, this._zoneTransitionTimer / this._zoneTransitionDuration);
      if (this._zoneTransitionTimer >= this._zoneTransitionDuration) {
        // Midpoint: apply zone switch while screen is black
        if (this._pendingZoneSwitch) {
          const { zoneId, zone, from } = this._pendingZoneSwitch;
          this._applyZoneSwitch(zoneId, zone, from);
          this._pendingZoneSwitch = null;
        }
        this._zoneTransitionPhase = 'in';
        this._zoneTransitionTimer = 0;
      }
    } else if (this._zoneTransitionPhase === 'in') {
      // Fading from black
      this._zoneTransitionAlpha = 1 - Math.min(1, this._zoneTransitionTimer / this._zoneTransitionDuration);
      if (this._zoneTransitionTimer >= this._zoneTransitionDuration) {
        this._zoneTransitionPhase = null;
        this._zoneTransitionAlpha = 0;
        this._eventBus.emit('zone:transitionEnd');
      }
    }
  }

  /**
   * Render the zone transition overlay (black with varying alpha).
   * Call AFTER all other rendering.
   */
  renderTransition(renderer) {
    if (this._zoneTransitionAlpha <= 0) return;
    renderer.save();
    renderer.setAlpha(this._zoneTransitionAlpha);
    renderer.drawRectScreen(0, 0, renderer.width, renderer.height, '#000000');
    renderer.restore();
  }

  /** Whether a zone transition is currently in progress. */
  get isTransitioning() {
    return this._zoneTransitionPhase !== null;
  }

  /**
   * Get the full definition of the currently active zone.
   */
  getActiveZone() {
    return this._zones.get(this._activeZone) ?? null;
  }

  /**
   * Get the id string of the currently active zone.
   */
  getActiveZoneId() {
    return this._activeZone;
  }

  /**
   * Get list of all registered zone ids in display order.
   */
  getZoneIds() {
    return [...this._zoneOrder];
  }

  /**
   * Get a zone definition by id.
   * @param {string} id
   */
  getZone(id) {
    return this._zones.get(id) ?? null;
  }

  /**
   * Cycle to the next zone in order.
   */
  nextZone() {
    const idx = this._zoneOrder.indexOf(this._activeZone);
    const next = this._zoneOrder[(idx + 1) % this._zoneOrder.length];
    this.switchZone(next);
  }

  /**
   * Cycle to the previous zone in order.
   */
  prevZone() {
    const idx = this._zoneOrder.indexOf(this._activeZone);
    const prev = this._zoneOrder[(idx - 1 + this._zoneOrder.length) % this._zoneOrder.length];
    this.switchZone(prev);
  }
}
