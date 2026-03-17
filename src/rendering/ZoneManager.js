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
   * Switch to a different zone. Updates the tile grid, state, and emits an event.
   * @param {string} zoneId - The zone to switch to
   */
  switchZone(zoneId) {
    const zone = this._zones.get(zoneId);
    if (!zone) return;

    const from = this._activeZone;
    if (from === zoneId) return;

    this._activeZone = zoneId;
    this._tileMap.setGrid(zone.grid, zone.ventSlots, zoneId);
    this._state.set('currentZone', zoneId);
    this._eventBus.emit('zone:changed', { from, to: zoneId, zone });
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
