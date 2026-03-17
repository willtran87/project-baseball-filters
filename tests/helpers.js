/**
 * Test helpers — factory functions for creating test doubles.
 */

import { EventBus } from '../src/engine/EventBus.js';
import { StateManager } from '../src/engine/StateManager.js';
import { GAME_CONFIG } from '../src/data/gameConfig.js';

/**
 * Create a fresh EventBus.
 */
export function createEventBus() {
  return new EventBus();
}

/**
 * Create a StateManager with a fresh EventBus and default config.
 * Returns { state, eventBus }.
 */
export function createState(configOverrides = {}) {
  const eventBus = createEventBus();
  const config = { ...GAME_CONFIG, ...configOverrides };
  const state = new StateManager(eventBus, config);
  return { state, eventBus, config };
}

/**
 * Helper to collect events emitted on a given EventBus.
 * Returns an array that receives { event, data } entries.
 */
export function collectEvents(eventBus, eventName) {
  const collected = [];
  eventBus.on(eventName, (data) => collected.push(data));
  return collected;
}
