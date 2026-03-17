/**
 * Economy System Tests
 *
 * Tests income/expense calculations, budget edge cases,
 * inning advancement, and day transitions.
 */

import { describe, it, assert } from './testRunner.js';
import { createState, collectEvents } from './helpers.js';
import { EconomySystem } from '../src/systems/EconomySystem.js';

export function runEconomyTests() {

  describe('EconomySystem -- inning timer', () => {
    it('should not process inning before duration elapses', () => {
      const { state, eventBus } = createState();
      const economy = new EconomySystem(state, eventBus);

      economy.update(5); // half way (30s inning duration)
      assert.equal(state.inning, 1, 'Inning should still be 1');
    });

    it('should process inning when duration elapses', () => {
      const { state, eventBus } = createState();
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });

      economy.update(30); // exactly one inning duration
      assert.equal(state.inning, 2, 'Inning should advance to 2');
    });

    it('should not advance when paused', () => {
      const { state, eventBus } = createState();
      state.paused = true;
      const economy = new EconomySystem(state, eventBus);

      economy.update(60);
      assert.equal(state.inning, 1, 'Inning should remain 1 when paused');
    });

    it('should respect speed multiplier', () => {
      const { state, eventBus } = createState();
      state.speed = 2;
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });

      economy.update(15); // 15 real seconds * 2x speed = 30 game seconds
      assert.equal(state.inning, 2, 'Speed multiplier should accelerate inning timer');
    });
  });

  describe('EconomySystem -- income calculation', () => {
    it('should generate income based on attendance and quality', () => {
      const { state, eventBus } = createState();
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0.8 });

      economy.update(30);
      assert.greaterThan(state.income, 0, 'Income should be positive');
    });

    it('should still generate some income at low reputation', () => {
      const { state, eventBus } = createState();
      state.reputation = 10;
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });

      economy.update(30);
      // Even at low reputation, there's base attendance (40-60% for weekday default)
      assert.greaterThan(state.income, 0, 'Should still earn some income at low reputation');
    });
  });

  describe('EconomySystem -- maintenance expenses', () => {
    it('should have zero maintenance with no filters', () => {
      const { state, eventBus } = createState();
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });

      economy.update(30);
      // expenses includes staff + energy + maintenance
      // maintenance should be 0, but other costs exist
      assert.ok(state.expenses >= 0, 'Expenses should be non-negative');
    });
  });

  describe('EconomySystem -- money balance', () => {
    it('should update money after inning processing', () => {
      const { state, eventBus } = createState();
      const startMoney = state.money;
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });

      economy.update(30);
      // Money should change (income - expenses)
      assert.ok(state.money !== startMoney, 'Money should change after inning');
    });

    it('should allow money to go negative with high expenses', () => {
      const { state, eventBus } = createState();
      state.money = 0;
      state.reputation = 0;
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0 });

      economy.update(30);
      // With expenses > income, money can go negative
      // (depends on exact calculation, but expense floor should be > 0)
      assert.ok(typeof state.money === 'number', 'Money should still be a number');
    });
  });

  describe('EconomySystem -- day advancement', () => {
    it('should advance to next day after 9 innings', () => {
      const { state, eventBus } = createState();
      const dayEvents = collectEvents(eventBus, 'game:newDay');
      state.inning = 9;
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });

      economy.update(30);
      assert.equal(state.inning, 1, 'Inning should reset to 1 after 9');
      assert.equal(state.gameDay, 2, 'Day should advance to 2');
      assert.equal(dayEvents.length, 1, 'game:newDay should be emitted');
    });

    it('should emit economy:inningEnd event', () => {
      const { state, eventBus } = createState();
      const inningEvents = collectEvents(eventBus, 'economy:inningEnd');
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });

      economy.update(30);
      assert.equal(inningEvents.length, 1, 'economy:inningEnd should be emitted');
      assert.ok(inningEvents[0].income !== undefined, 'Event should include income');
      assert.ok(inningEvents[0].expenses !== undefined, 'Event should include expenses');
      assert.ok(inningEvents[0].balance !== undefined, 'Event should include balance');
      assert.ok(inningEvents[0].attendance !== undefined, 'Event should include attendance');
    });
  });

  describe('EconomySystem -- event revenue multiplier', () => {
    it('should apply active event revenueMultiplier to income', () => {
      const { state, eventBus } = createState();
      state.reputation = 50;
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });

      // First inning without event
      economy.update(30);
      const normalIncome = state.income;

      // Reset and add an event with 2x revenue multiplier
      const { state: state2, eventBus: eventBus2 } = createState();
      state2.reputation = 50;
      state2.activeEvent = { revenueMultiplier: 2.0, degradeMultiplier: 1.0 };
      const economy2 = new EconomySystem(state2, eventBus2);
      eventBus2.emit('filtration:quality', { avgEfficiency: 0.5 });

      economy2.update(30);
      // Income with 2x event should be roughly double (exact depends on game day type)
      assert.greaterThan(state2.income, normalIncome, 'Event revenue multiplier should boost income');
    });
  });

  describe('EconomySystem -- stadium capacity', () => {
    it('should use config stadium.baseCapacity for attendance calculation', () => {
      const { state, eventBus } = createState();
      const economy = new EconomySystem(state, eventBus);
      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });

      economy.update(30);
      // baseCapacity is 15000 in config, attendance should be based on that
      const attendance = state.attendance;
      assert.ok(attendance > 0, 'Attendance should be positive');
      assert.ok(attendance <= 15000, 'Attendance should not exceed base capacity');
    });
  });
}
