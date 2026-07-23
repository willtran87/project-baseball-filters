/**
 * EventBus — Simple pub/sub event system.
 *
 * Decouples systems so they communicate through events
 * rather than direct references.
 */

export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);

    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe a specific callback from an event.
   */
  off(event, callback) {
    const list = this._listeners.get(event);
    if (!list) return;
    const idx = list.indexOf(callback);
    if (idx !== -1) list.splice(idx, 1);
  }

  /**
   * Emit an event with optional data payload.
   */
  emit(event, data = {}) {
    const list = this._listeners.get(event);
    if (!list) return;
    // Snapshot the array so that listeners removing themselves (e.g. once())
    // during iteration don't cause other listeners to be skipped.
    const snapshot = [...list];
    for (const cb of snapshot) {
      cb(data);
    }
  }

  /**
   * Subscribe to an event, but auto-unsubscribe after the first call.
   */
  once(event, callback) {
    const unsub = this.on(event, (data) => {
      unsub();
      callback(data);
    });
    return unsub;
  }

  /**
   * Remove all listeners (useful for cleanup/testing).
   */
  clear() {
    this._listeners.clear();
  }
}
