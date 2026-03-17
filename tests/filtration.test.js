/**
 * Filtration System Tests
 *
 * Tests filter installation, degradation, repair mechanics,
 * upgrade, efficiency calculations, and failure triggers.
 * Updated for domain/componentType/tier filter model.
 */

import { describe, it, assert } from './testRunner.js';
import { createState, collectEvents } from './helpers.js';
import { FiltrationSystem } from '../src/systems/FiltrationSystem.js';

// Helper to install a basic air filter (tier 1 HEPA)
function installBasicFilter(eventBus, x = 0, y = 0) {
  eventBus.emit('filter:install', {
    domain: 'air',
    componentType: 'hepaFilter',
    tier: 1,
    x,
    y,
  });
}

export function runFiltrationTests() {

  describe('FiltrationSystem -- filter installation', () => {
    it('should install a tier 1 air filter successfully', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);

      const startMoney = state.money;
      installBasicFilter(eventBus);

      assert.equal(state.filters.length, 1, 'Should have 1 filter');
      assert.equal(state.filters[0].domain, 'air');
      assert.equal(state.filters[0].componentType, 'hepaFilter');
      assert.equal(state.filters[0].tier, 1);
      // Basic Fiber Filter costs $500
      assert.equal(state.money, startMoney - 500, 'Should deduct tier cost');
    });

    it('should set condition to maxCondition on install', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      const filter = state.filters[0];
      assert.equal(filter.condition, filter.maxCondition, 'Condition should start at max');
      // maxCondition = lifespanGames * 10 = 10 * 10 = 100
      assert.equal(filter.maxCondition, 100, 'maxCondition should be lifespanGames * 10');
    });

    it('should refuse installation when not enough money', () => {
      const { state, eventBus } = createState();
      state.money = 100; // not enough for $500 filter
      const filtration = new FiltrationSystem(state, eventBus);
      const messages = collectEvents(eventBus, 'ui:message');

      installBasicFilter(eventBus);
      assert.equal(state.filters.length, 0, 'No filter should be installed');
      assert.equal(state.money, 100, 'Money should not change');
      assert.greaterThan(messages.length, 0, 'Warning should be emitted');
    });

    it('should refuse installation for unknown domain/component', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      const startMoney = state.money;

      eventBus.emit('filter:install', {
        domain: 'nonexistent',
        componentType: 'fake',
        tier: 1,
        x: 0,
        y: 0,
      });
      assert.equal(state.filters.length, 0, 'No filter should be installed');
      assert.equal(state.money, startMoney, 'Money should not change');
    });

    it('should assign unique IDs to installed filters', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      const filtration = new FiltrationSystem(state, eventBus);

      installBasicFilter(eventBus, 0, 0);
      installBasicFilter(eventBus, 1, 0);

      assert.ok(state.filters[0].id !== state.filters[1].id, 'IDs should be unique');
    });
  });

  describe('FiltrationSystem -- filter degradation', () => {
    it('should degrade filter condition over time', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      const initial = state.filters[0].condition;
      filtration.update(1);
      assert.lessThan(state.filters[0].condition, initial, 'Condition should decrease');
    });

    it('should apply event degradeMultiplier', () => {
      const { state, eventBus } = createState();
      state.activeEvent = { degradeMultiplier: 2.0 };
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      const initial = state.filters[0].condition;
      filtration.update(5);
      const loss = initial - state.filters[0].condition;
      // Should lose > 5 (base) due to 2x event multiplier
      assert.greaterThan(loss, 5, 'Event multiplier should increase degradation');
    });

    it('should emit filter:broken only once per breakdown', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      const brokenEvents = collectEvents(eventBus, 'filter:broken');
      installBasicFilter(eventBus);

      // Break the filter
      filtration.update(500);
      const count1 = brokenEvents.length;
      assert.greaterThan(count1, 0, 'Should emit filter:broken');

      // Update again
      filtration.update(1);
      assert.equal(brokenEvents.length, count1, 'Should not re-emit for same filter');
    });

    it('should set efficiency to 0 when broken', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      filtration.update(500);
      assert.equal(state.filters[0].condition, 0);
      assert.equal(state.filters[0].efficiency, 0);
    });

    it('should not degrade when paused', () => {
      const { state, eventBus } = createState();
      state.paused = true;
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);
      const initial = state.filters[0].condition;

      filtration.update(100);
      assert.equal(state.filters[0].condition, initial, 'No degradation when paused');
    });
  });

  describe('FiltrationSystem -- efficiency calculation', () => {
    it('should start at 1.0 efficiency', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      assert.equal(state.filters[0].efficiency, 1.0, 'Should start at full efficiency');
    });

    it('should scale efficiency with condition ratio', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      // Manually set condition to 50% of max
      state.filters[0].condition = state.filters[0].maxCondition / 2;
      filtration.update(0.001);
      assert.approximately(state.filters[0].efficiency, 0.5, 0.02, 'Half condition = half efficiency');
    });

    it('should emit filtration:quality with correct stats', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      const qualityEvents = collectEvents(eventBus, 'filtration:quality');
      state.money = 100000;

      installBasicFilter(eventBus);
      filtration.update(0.001);

      assert.equal(qualityEvents.length, 1);
      assert.equal(qualityEvents[0].filterCount, 1);
      assert.ok(qualityEvents[0].avgEfficiency > 0, 'Should have positive efficiency');
    });

    it('should report 0 efficiency with no filters', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      const qualityEvents = collectEvents(eventBus, 'filtration:quality');

      filtration.update(0.001);
      assert.equal(qualityEvents[0].avgEfficiency, 0);
      assert.equal(qualityEvents[0].filterCount, 0);
    });
  });

  describe('FiltrationSystem -- filter repair', () => {
    it('should repair filter to max condition', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      state.filters[0].condition = 10;
      eventBus.emit('filter:repair', { id: state.filters[0].id });
      assert.equal(state.filters[0].condition, state.filters[0].maxCondition);
    });

    it('should refuse repair at max condition', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      const moneyBefore = state.money;
      eventBus.emit('filter:repair', { id: state.filters[0].id });
      assert.equal(state.money, moneyBefore, 'No charge for unnecessary repair');
    });

    it('should charge emergency rate for broken filters', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      state.filters[0].condition = 0;
      const moneyBefore = state.money;
      eventBus.emit('filter:repair', { id: state.filters[0].id });

      // Emergency cost = floor(500 * 0.3) * 2.5 = floor(150 * 2.5) = 375
      const baseCost = Math.floor(500 * 0.3);
      const emergencyCost = Math.floor(baseCost * 2.5);
      assert.equal(state.money, moneyBefore - emergencyCost, 'Emergency repair rate');
    });

    it('should clear broken status after repair', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      // Break then repair
      filtration.update(500);
      eventBus.emit('filter:repair', { id: state.filters[0].id });

      // Break again -- should fire broken event again
      const brokenEvents = collectEvents(eventBus, 'filter:broken');
      filtration.update(500);
      assert.greaterThan(brokenEvents.length, 0, 'Should emit broken after re-break');
    });
  });

  describe('FiltrationSystem -- filter upgrade', () => {
    it('should upgrade filter to next tier', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      state.reputation = 60; // Above Single-A (41+) for tier 2 unlock
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      eventBus.emit('filter:upgrade', { id: state.filters[0].id });
      assert.equal(state.filters[0].tier, 2, 'Should upgrade to tier 2');
    });

    it('should refuse upgrade when reputation-locked', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      state.reputation = 20; // Too low for any tier upgrades
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      eventBus.emit('filter:upgrade', { id: state.filters[0].id });
      assert.equal(state.filters[0].tier, 1, 'Should stay at tier 1');
    });
  });

  describe('FiltrationSystem -- filter removal', () => {
    it('should remove a filter by id', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);

      eventBus.emit('filter:remove', { id: state.filters[0].id });
      assert.equal(state.filters.length, 0);
    });
  });

  describe('FiltrationSystem -- reputation effects', () => {
    it('should decrease reputation with broken filters', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);
      const startRep = state.reputation;

      state.filters[0].condition = 0;
      filtration.update(10);
      assert.lessThan(state.reputation, startRep, 'Rep should drop with broken filter');
    });

    it('should increase reputation with all healthy filters', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      installBasicFilter(eventBus);
      const startRep = state.reputation;

      // Filter is fresh and healthy
      filtration.update(0.5);
      // Small gain expected
      assert.ok(state.reputation >= startRep, 'Rep should not drop with healthy filter');
    });
  });

  describe('FiltrationSystem -- cross-system interactions', () => {
    it('should emit system:cascade when a domain has low efficiency', () => {
      const { state, eventBus } = createState();
      const filtration = new FiltrationSystem(state, eventBus);
      const cascadeEvents = collectEvents(eventBus, 'system:cascade');

      // Install a water filter and break it
      eventBus.emit('filter:install', {
        domain: 'water',
        componentType: 'waterFilter',
        tier: 1,
        x: 0,
        y: 0,
      });
      state.filters[0].condition = 0;
      state.filters[0].efficiency = 0;

      filtration.update(0.001);
      // Water being at 0% should trigger cascades per systemInteractions config
      // (water -> drainage, water -> hvac)
      assert.greaterThan(cascadeEvents.length, 0, 'Should emit cascade events for broken domain');
    });
  });

  describe('FiltrationSystem.getFilterStatus()', () => {
    it('should return correct status strings', () => {
      assert.equal(FiltrationSystem.getFilterStatus({ condition: 0, maxCondition: 100 }), 'broken');
      assert.equal(FiltrationSystem.getFilterStatus({ condition: 90, maxCondition: 100 }), 'healthy');
      assert.equal(FiltrationSystem.getFilterStatus({ condition: 60, maxCondition: 100 }), 'degraded');
      assert.equal(FiltrationSystem.getFilterStatus({ condition: 30, maxCondition: 100 }), 'warning');
      assert.equal(FiltrationSystem.getFilterStatus({ condition: 10, maxCondition: 100 }), 'critical');
    });
  });
}
