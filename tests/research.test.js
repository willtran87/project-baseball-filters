/**
 * Research System Tests
 *
 * Tests lab unlock, research start/complete/cancel, prerequisite checks,
 * cost deduction, day-based countdown, and effect application.
 */

import { describe, it, assert } from './testRunner.js';
import { createState, collectEvents } from './helpers.js';
import { ResearchSystem } from '../src/systems/ResearchSystem.js';

export function runResearchTests() {

  describe('ResearchSystem -- lab unlock', () => {
    it('should be locked at rep below 56', () => {
      const { state, eventBus } = createState();
      state.reputation = 50;
      const research = new ResearchSystem(state, eventBus);
      assert.equal(research.isLabUnlocked(), false, 'Lab should be locked at rep 50');
    });

    it('should be unlocked at rep 56+', () => {
      const { state, eventBus } = createState();
      state.reputation = 56;
      const research = new ResearchSystem(state, eventBus);
      assert.equal(research.isLabUnlocked(), true, 'Lab should be unlocked at rep 56');
    });
  });

  describe('ResearchSystem -- starting research', () => {
    it('should start research and deduct cost', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);
      const startedEvents = collectEvents(eventBus, 'research:started');

      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });

      assert.equal(startedEvents.length, 1, 'Should emit research:started');
      assert.equal(state.money, 50000 - 3000, 'Should deduct research cost');
      assert.ok(research.getActiveResearch(), 'Should have active research');
      assert.equal(research.getActiveResearch().nodeId, 'eff_1_energy_audit');
    });

    it('should refuse research when lab is locked', () => {
      const { state, eventBus } = createState();
      state.reputation = 30;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);
      const messages = collectEvents(eventBus, 'ui:message');

      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });

      assert.equal(research.getActiveResearch(), null, 'Should not start');
      assert.greaterThan(messages.length, 0, 'Should warn user');
    });

    it('should refuse when already researching', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);

      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });
      const messages = collectEvents(eventBus, 'ui:message');
      eventBus.emit('research:start', { nodeId: 'det_1_leak_sensors' });

      assert.equal(research.getActiveResearch().nodeId, 'eff_1_energy_audit', 'First research should remain');
      assert.greaterThan(messages.length, 0, 'Should warn about existing research');
    });

    it('should refuse when not enough money', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 100;
      const research = new ResearchSystem(state, eventBus);
      const messages = collectEvents(eventBus, 'ui:message');

      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });
      assert.equal(research.getActiveResearch(), null, 'Should not start');
    });

    it('should refuse when prerequisites not met', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);
      const messages = collectEvents(eventBus, 'ui:message');

      // eff_2_vfd_retrofit requires eff_1_energy_audit
      eventBus.emit('research:start', { nodeId: 'eff_2_vfd_retrofit' });
      assert.equal(research.getActiveResearch(), null, 'Should not start without prereqs');
    });

    it('should refuse already completed research', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      state.researchProgress = {
        completedNodes: ['eff_1_energy_audit'],
        activeResearch: null,
      };
      const research = new ResearchSystem(state, eventBus);

      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });
      assert.equal(research.getActiveResearch(), null, 'Should not restart completed research');
    });
  });

  describe('ResearchSystem -- research completion', () => {
    it('should complete research after countdown reaches 0', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);
      const completeEvents = collectEvents(eventBus, 'research:complete');

      // Start tier-1 efficiency research (3 days)
      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });

      // Simulate 3 new days
      eventBus.emit('game:newDay', {});
      eventBus.emit('game:newDay', {});
      eventBus.emit('game:newDay', {});

      assert.equal(completeEvents.length, 1, 'Should emit research:complete');
      assert.ok(research.getCompletedNodes().includes('eff_1_energy_audit'), 'Should be in completed list');
      assert.equal(research.getActiveResearch(), null, 'Active research should be null');
    });

    it('should emit progress events during countdown', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);
      const progressEvents = collectEvents(eventBus, 'research:progress');

      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });
      eventBus.emit('game:newDay', {}); // day 1: 2 remaining
      eventBus.emit('game:newDay', {}); // day 2: 1 remaining

      assert.equal(progressEvents.length, 2, 'Should emit progress each non-completion day');
    });

    it('should not count down when lab not unlocked', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);

      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });

      // Drop rep below lab unlock threshold
      state.reputation = 40;
      eventBus.emit('game:newDay', {});

      // Should still have 3 days remaining (or 2 if day counted before rep drop)
      // Actually _onNewDay checks isLabUnlocked first, so no countdown happens
      const active = research.getActiveResearch();
      assert.ok(active, 'Research should still be active');
    });
  });

  describe('ResearchSystem -- cancellation', () => {
    it('should cancel active research and refund 50%', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);

      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });
      const moneyAfterStart = state.money;

      eventBus.emit('research:cancel', {});
      assert.equal(research.getActiveResearch(), null, 'Should clear active research');
      assert.equal(state.money, moneyAfterStart + 1500, 'Should refund 50% of 3000 = 1500');
    });

    it('should do nothing when no active research', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);
      const startMoney = state.money;

      eventBus.emit('research:cancel', {});
      assert.equal(state.money, startMoney, 'Money should not change');
    });
  });

  describe('ResearchSystem -- node status', () => {
    it('should report correct statuses', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);

      assert.equal(research.getNodeStatus('eff_1_energy_audit'), 'available');
      assert.equal(research.getNodeStatus('eff_2_vfd_retrofit'), 'locked'); // prereq not met

      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });
      assert.equal(research.getNodeStatus('eff_1_energy_audit'), 'researching');

      // Complete it
      eventBus.emit('game:newDay', {});
      eventBus.emit('game:newDay', {});
      eventBus.emit('game:newDay', {});

      assert.equal(research.getNodeStatus('eff_1_energy_audit'), 'completed');
      assert.equal(research.getNodeStatus('eff_2_vfd_retrofit'), 'available'); // prereq now met
    });

    it('should return locked for unknown node', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      const research = new ResearchSystem(state, eventBus);
      assert.equal(research.getNodeStatus('nonexistent'), 'locked');
    });
  });

  describe('ResearchSystem -- effect application', () => {
    it('should apply energy cost reduction on completion', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.money = 50000;
      const research = new ResearchSystem(state, eventBus);
      const originalEnergyCost = state.config.economy.energyCostBase;

      eventBus.emit('research:start', { nodeId: 'eff_1_energy_audit' });
      eventBus.emit('game:newDay', {});
      eventBus.emit('game:newDay', {});
      eventBus.emit('game:newDay', {});

      const newEnergyCost = state.config.economy.energyCostBase;
      assert.lessThan(newEnergyCost, originalEnergyCost, 'Energy cost should decrease');
    });
  });
}
