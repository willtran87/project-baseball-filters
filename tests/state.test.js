/**
 * State Manager, EventBus, and Save/Load Tests
 *
 * Tests state management, serialization, deserialization,
 * reputation clamping, and edge cases.
 */

import { describe, it, assert } from './testRunner.js';
import { createState, collectEvents } from './helpers.js';
import { EventBus } from '../src/engine/EventBus.js';

export function runStateTests() {

  describe('StateManager -- set()', () => {
    it('should update a property value', () => {
      const { state } = createState();
      state.set('money', 9999);
      assert.equal(state.money, 9999);
    });

    it('should emit state:{key} event on change', () => {
      const { state, eventBus } = createState();
      const events = collectEvents(eventBus, 'state:money');

      state.set('money', 1234);
      assert.equal(events.length, 1);
      assert.equal(events[0].value, 1234);
      assert.equal(events[0].old, 8000); // startingMoney in updated config
    });
  });

  describe('StateManager -- adjustReputation()', () => {
    it('should add positive delta', () => {
      const { state } = createState();
      const startRep = state.reputation;
      state.adjustReputation(10);
      assert.equal(state.reputation, startRep + 10);
    });

    it('should subtract negative delta', () => {
      const { state } = createState();
      const startRep = state.reputation;
      state.adjustReputation(-10);
      assert.equal(state.reputation, startRep - 10);
    });

    it('should clamp to 0 minimum', () => {
      const { state } = createState();
      state.adjustReputation(-999);
      assert.equal(state.reputation, 0);
    });

    it('should clamp to 100 maximum', () => {
      const { state } = createState();
      state.adjustReputation(999);
      assert.equal(state.reputation, 100);
    });

    it('should not emit event if reputation does not change', () => {
      const { state, eventBus } = createState();
      state.reputation = 100;
      const events = collectEvents(eventBus, 'state:reputation');
      state.adjustReputation(10); // already at max
      assert.equal(events.length, 0, 'No event if clamped value unchanged');
    });
  });

  describe('StateManager -- filter management', () => {
    it('should add filters with auto-incrementing IDs', () => {
      const { state } = createState();
      const f1 = state.addFilter({ type: 'basic', x: 0, y: 0 });
      const f2 = state.addFilter({ type: 'basic', x: 1, y: 0 });
      assert.equal(f1.id, 1);
      assert.equal(f2.id, 2);
    });

    it('should emit filter:added event', () => {
      const { state, eventBus } = createState();
      const events = collectEvents(eventBus, 'filter:added');
      state.addFilter({ type: 'basic', x: 0, y: 0 });
      assert.equal(events.length, 1);
      assert.equal(events[0].type, 'basic');
    });

    it('should remove filter by id', () => {
      const { state } = createState();
      const f1 = state.addFilter({ type: 'basic', x: 0, y: 0 });
      const removed = state.removeFilter(f1.id);
      assert.equal(state.filters.length, 0);
      assert.equal(removed.id, f1.id);
    });

    it('should return null when removing nonexistent filter', () => {
      const { state } = createState();
      const result = state.removeFilter(999);
      assert.equal(result, null);
    });

    it('should get filter by id', () => {
      const { state } = createState();
      const f1 = state.addFilter({ type: 'basic', x: 5, y: 3 });
      const found = state.getFilter(f1.id);
      assert.equal(found.x, 5);
      assert.equal(found.y, 3);
    });

    it('should return null for unknown filter id', () => {
      const { state } = createState();
      assert.equal(state.getFilter(999), null);
    });
  });

  describe('StateManager -- serialize()', () => {
    it('should produce a serializable object', () => {
      const { state } = createState();
      state.addFilter({ type: 'basic', x: 0, y: 0, condition: 100, maxCondition: 100, efficiency: 0.5 });
      state.money = 4700;
      state.gameDay = 3;

      const data = state.serialize();
      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);

      assert.equal(parsed.money, 4700);
      assert.equal(parsed.gameDay, 3);
      assert.equal(parsed.filters.length, 1);
      assert.ok(parsed._version, 'Should include save version');
    });

    it('should deep-copy filters array (no shared references)', () => {
      const { state } = createState();
      state.addFilter({ type: 'basic', x: 0, y: 0, condition: 100, maxCondition: 100 });
      const data = state.serialize();

      state.filters[0].condition = 50;
      assert.equal(data.filters[0].condition, 100, 'Serialized copy should be independent');
    });

    it('should include paused state', () => {
      const { state } = createState();
      state.paused = true;
      const data = state.serialize();
      assert.equal(data.paused, true, 'paused should be included in serialization');
    });

    it('should deep-copy unlockedFilterTypes', () => {
      const { state } = createState();
      const data = state.serialize();
      state.unlockedFilterTypes.push('carbon');
      assert.equal(data.unlockedFilterTypes.length, 1, 'Serialized copy should be independent');
    });
  });

  describe('StateManager -- deserialize()', () => {
    it('should restore state from saved data', () => {
      const { state } = createState();
      const savedData = {
        money: 8000,
        income: 200,
        expenses: 50,
        stadiumLevel: 2,
        reputation: 75,
        filters: [{ id: 1, type: 'basic', x: 0, y: 0, condition: 50, maxCondition: 100 }],
        nextFilterId: 2,
        activeEvent: null,
        gameDay: 10,
        inning: 5,
        paused: false,
        speed: 2,
        unlockedFilterTypes: ['basic', 'carbon'],
        achievements: ['first_filter'],
      };

      state.deserialize(savedData);
      assert.equal(state.money, 8000);
      assert.equal(state.reputation, 75);
      assert.equal(state.filters.length, 1);
      assert.equal(state.gameDay, 10);
      assert.equal(state.inning, 5);
      assert.equal(state.paused, false);
      assert.equal(state.speed, 2);
    });

    it('should use defaults for missing fields', () => {
      const { state } = createState();
      state.deserialize({});
      assert.equal(state.money, 8000); // startingMoney in updated config
      assert.equal(state.reputation, 50);
      assert.equal(state.gameDay, 1);
      assert.equal(state.paused, false);
    });

    it('should emit state:loaded event', () => {
      const { state, eventBus } = createState();
      const events = collectEvents(eventBus, 'state:loaded');
      state.deserialize({ money: 100 });
      assert.equal(events.length, 1);
    });

    it('should return false for invalid input', () => {
      const { state } = createState();
      assert.equal(state.deserialize(null), false);
      assert.equal(state.deserialize(undefined), false);
      assert.equal(state.deserialize(42), false);
    });
  });

  describe('EventBus -- core functionality', () => {
    it('should deliver events to subscribers', () => {
      const bus = new EventBus();
      let received = null;
      bus.on('test', (data) => { received = data; });
      bus.emit('test', { value: 42 });
      assert.equal(received.value, 42);
    });

    it('should support multiple subscribers', () => {
      const bus = new EventBus();
      let count = 0;
      bus.on('test', () => count++);
      bus.on('test', () => count++);
      bus.emit('test');
      assert.equal(count, 2);
    });

    it('should return unsubscribe function from on()', () => {
      const bus = new EventBus();
      let count = 0;
      const unsub = bus.on('test', () => count++);
      bus.emit('test');
      unsub();
      bus.emit('test');
      assert.equal(count, 1, 'Should not receive after unsubscribe');
    });

    it('once() should fire only once', () => {
      const bus = new EventBus();
      let count = 0;
      bus.once('test', () => count++);
      bus.emit('test');
      bus.emit('test');
      assert.equal(count, 1);
    });

    it('clear() should remove all listeners', () => {
      const bus = new EventBus();
      let count = 0;
      bus.on('test', () => count++);
      bus.clear();
      bus.emit('test');
      assert.equal(count, 0);
    });

    it('off() should handle missing event gracefully', () => {
      const bus = new EventBus();
      bus.off('nonexistent', () => {});
      assert.ok(true, 'Should not throw');
    });

    it('emit() should handle no listeners gracefully', () => {
      const bus = new EventBus();
      bus.emit('nonexistent', { data: 1 });
      assert.ok(true, 'Should not throw');
    });
  });
}
