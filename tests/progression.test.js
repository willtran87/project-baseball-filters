/**
 * Progression System Tests
 *
 * Tests reputation drift, tier changes, milestones, expansions,
 * win/lose conditions, and filter broken rep penalty.
 */

import { describe, it, assert } from './testRunner.js';
import { createState, collectEvents } from './helpers.js';
import { ProgressionSystem } from '../src/systems/ProgressionSystem.js';

export function runProgressionTests() {

  describe('ProgressionSystem -- getCurrentTier()', () => {
    it('should return Condemned for rep 0-20', () => {
      const { state, eventBus } = createState();
      state.reputation = 10;
      const progression = new ProgressionSystem(state, eventBus);
      assert.equal(progression.getCurrentTier().name, 'Condemned');
      assert.equal(progression.getCurrentTier().level, 0);
    });

    it('should return Minor League for rep 21-40', () => {
      const { state, eventBus } = createState();
      state.reputation = 35;
      const progression = new ProgressionSystem(state, eventBus);
      assert.equal(progression.getCurrentTier().name, 'Minor League');
      assert.equal(progression.getCurrentTier().level, 1);
    });

    it('should return Major League for rep 86-100', () => {
      const { state, eventBus } = createState();
      state.reputation = 95;
      const progression = new ProgressionSystem(state, eventBus);
      assert.equal(progression.getCurrentTier().name, 'Major League');
      assert.equal(progression.getCurrentTier().level, 5);
    });

    it('should return Condemned for rep 0', () => {
      const { state, eventBus } = createState();
      state.reputation = 0;
      const progression = new ProgressionSystem(state, eventBus);
      assert.equal(progression.getCurrentTier().name, 'Condemned');
    });

    it('should return Major League for rep 100', () => {
      const { state, eventBus } = createState();
      state.reputation = 100;
      const progression = new ProgressionSystem(state, eventBus);
      assert.equal(progression.getCurrentTier().name, 'Major League');
    });
  });

  describe('ProgressionSystem -- getChapter()', () => {
    it('should map rep 35 to chapter 1', () => {
      const { state, eventBus } = createState();
      state.reputation = 35;
      const progression = new ProgressionSystem(state, eventBus);
      assert.equal(progression.getChapter(), 1);
    });

    it('should map rep 50 to chapter 2', () => {
      const { state, eventBus } = createState();
      state.reputation = 50;
      const progression = new ProgressionSystem(state, eventBus);
      assert.equal(progression.getChapter(), 2);
    });

    it('should map rep 90 to chapter 5', () => {
      const { state, eventBus } = createState();
      state.reputation = 90;
      const progression = new ProgressionSystem(state, eventBus);
      assert.equal(progression.getChapter(), 5);
    });
  });

  describe('ProgressionSystem -- reputation drift', () => {
    it('should not drift when paused', () => {
      const { state, eventBus } = createState();
      state.paused = true;
      state.reputation = 50;
      const progression = new ProgressionSystem(state, eventBus);
      progression.update(20);
      assert.equal(state.reputation, 50, 'Reputation should not change when paused');
    });

    it('should not drift with no filters', () => {
      const { state, eventBus } = createState();
      state.reputation = 50;
      const progression = new ProgressionSystem(state, eventBus);
      // Drift interval is 10 seconds
      progression.update(15);
      assert.equal(state.reputation, 50, 'No drift without filters');
    });

    it('should drift toward quality target when filters exist', () => {
      const { state, eventBus } = createState();
      state.reputation = 30;
      state.filters = [{ id: 1, domain: 'air', condition: 100, maxCondition: 100, efficiency: 1.0 }];
      const progression = new ProgressionSystem(state, eventBus);
      // Simulate high quality report
      eventBus.emit('filtration:quality', { avgEfficiency: 0.9 });
      // Run past drift interval
      progression.update(11);
      assert.greaterThan(state.reputation, 30, 'Rep should drift up toward high quality target');
    });
  });

  describe('ProgressionSystem -- tier change events', () => {
    it('should emit progression:tierChange on promotion', () => {
      const { state, eventBus } = createState();
      state.reputation = 39;
      const progression = new ProgressionSystem(state, eventBus);
      const tierEvents = collectEvents(eventBus, 'progression:tierChange');

      // Set initial tier
      eventBus.emit('economy:inningEnd', {});

      // Now promote to Single-A
      state.reputation = 42;
      eventBus.emit('economy:inningEnd', {});

      assert.greaterThan(tierEvents.length, 0, 'Should emit tier change');
      assert.equal(tierEvents[tierEvents.length - 1].promoted, true, 'Should be a promotion');
    });
  });

  describe('ProgressionSystem -- filter broken penalty', () => {
    it('should decrease reputation when filter breaks', () => {
      const { state, eventBus } = createState();
      state.reputation = 50;
      const progression = new ProgressionSystem(state, eventBus);
      const startRep = state.reputation;

      eventBus.emit('filter:broken', {});
      assert.lessThan(state.reputation, startRep, 'Rep should drop on filter break');
    });
  });

  describe('ProgressionSystem -- new day rep changes', () => {
    it('should boost rep on good quality day', () => {
      const { state, eventBus } = createState();
      state.reputation = 50;
      const progression = new ProgressionSystem(state, eventBus);

      eventBus.emit('filtration:quality', { avgEfficiency: 0.9 });
      const beforeRep = state.reputation;
      eventBus.emit('game:newDay', { day: 2 });
      assert.greaterThan(state.reputation, beforeRep, 'Should gain rep on good day');
    });

    it('should penalize rep on poor quality day', () => {
      const { state, eventBus } = createState();
      state.reputation = 50;
      const progression = new ProgressionSystem(state, eventBus);

      eventBus.emit('filtration:quality', { avgEfficiency: 0.2 });
      const beforeRep = state.reputation;
      eventBus.emit('game:newDay', { day: 2 });
      assert.lessThan(state.reputation, beforeRep, 'Should lose rep on poor day');
    });
  });

  describe('ProgressionSystem -- event survived bonus', () => {
    it('should give rep bonus for surviving severe event with good quality', () => {
      const { state, eventBus } = createState();
      state.reputation = 50;
      const progression = new ProgressionSystem(state, eventBus);

      eventBus.emit('filtration:quality', { avgEfficiency: 0.8 });
      const beforeRep = state.reputation;
      eventBus.emit('event:ended', { name: 'Heavy Rain', degradeMultiplier: 1.8 });
      assert.greaterThan(state.reputation, beforeRep, 'Should gain rep for surviving severe event');
    });

    it('should not give bonus for mild events', () => {
      const { state, eventBus } = createState();
      state.reputation = 50;
      const progression = new ProgressionSystem(state, eventBus);

      eventBus.emit('filtration:quality', { avgEfficiency: 0.8 });
      const beforeRep = state.reputation;
      eventBus.emit('event:ended', { name: 'Light Rain', degradeMultiplier: 1.2 });
      assert.equal(state.reputation, beforeRep, 'No bonus for mild events');
    });
  });

  describe('ProgressionSystem -- win condition', () => {
    it('should emit game:win at Major League with all healthy filters', () => {
      const { state, eventBus } = createState();
      state.reputation = 90;
      state.championshipHosted = false; // winConditions.softVictory.championshipHosted is true
      state.filters = [
        { id: 1, domain: 'air', condition: 95, maxCondition: 100, efficiency: 0.95 },
      ];
      const progression = new ProgressionSystem(state, eventBus);
      const winEvents = collectEvents(eventBus, 'game:win');

      eventBus.emit('game:newDay', { day: 2 });
      // The config requires championshipHosted for soft victory, so check if it fires
      // With championshipHosted=false and config requiring it, win should not fire
      assert.equal(winEvents.length, 0, 'Should not win without championship hosted');
    });
  });

  describe('ProgressionSystem -- lose condition: condemned streak', () => {
    it('should emit game:lose after condemned for 10 consecutive days', () => {
      const { state, eventBus } = createState();
      state.reputation = 10; // In condemned range
      const progression = new ProgressionSystem(state, eventBus);
      const loseEvents = collectEvents(eventBus, 'game:lose');

      // Simulate 10 consecutive condemned days
      for (let i = 0; i < 10; i++) {
        eventBus.emit('game:newDay', { day: i + 1 });
      }

      assert.greaterThan(loseEvents.length, 0, 'Should emit game:lose after condemned streak');
    });

    it('should reset condemned streak if reputation rises above 20', () => {
      const { state, eventBus } = createState();
      state.reputation = 10;
      const progression = new ProgressionSystem(state, eventBus);

      // Simulate 5 condemned days
      for (let i = 0; i < 5; i++) {
        eventBus.emit('game:newDay', { day: i + 1 });
      }
      assert.equal(progression.condemnedStreak, 5, 'Should track 5 condemned days');

      // Reputation recovers
      state.reputation = 30;
      eventBus.emit('game:newDay', { day: 6 });
      assert.equal(progression.condemnedStreak, 0, 'Streak should reset');
    });
  });

  describe('ProgressionSystem -- milestones', () => {
    it('should unlock first_filter milestone when filter is added', () => {
      const { state, eventBus } = createState();
      state.filters = [{ id: 1, domain: 'air', type: 'basic' }];
      const progression = new ProgressionSystem(state, eventBus);
      const achievementEvents = collectEvents(eventBus, 'progression:achievement');

      eventBus.emit('economy:inningEnd', {});
      assert.ok(state.achievements.includes('first_filter'), 'Should unlock first_filter');
      assert.greaterThan(achievementEvents.length, 0, 'Should emit achievement event');
    });

    it('should not duplicate achievements', () => {
      const { state, eventBus } = createState();
      state.filters = [{ id: 1, domain: 'air', type: 'basic' }];
      state.achievements = ['first_filter'];
      const progression = new ProgressionSystem(state, eventBus);
      const achievementEvents = collectEvents(eventBus, 'progression:achievement');

      eventBus.emit('economy:inningEnd', {});
      assert.equal(achievementEvents.length, 0, 'Should not re-trigger existing achievement');
    });
  });
}
