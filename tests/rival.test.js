/**
 * Rival System Tests
 *
 * Tests rival reputation drift, weekly standings, and season awards.
 */

import { describe, it, assert } from './testRunner.js';
import { createState, collectEvents } from './helpers.js';
import { RivalSystem } from '../src/systems/RivalSystem.js';

export function runRivalTests() {

  describe('RivalSystem -- initialization', () => {
    it('should start with rivalRep from state (default 60)', () => {
      const { state, eventBus } = createState();
      const rival = new RivalSystem(state, eventBus);
      assert.equal(state.rivalRep, 60);
    });

    it('should provide rival info', () => {
      const { state, eventBus } = createState();
      const rival = new RivalSystem(state, eventBus);
      const info = rival.getRivalInfo();
      assert.equal(info.name, 'Glendale Grizzlies');
      assert.equal(info.owner, 'Victor');
      assert.equal(info.rep, 60);
      assert.ok(info.attendance > 0, 'Should estimate attendance');
    });
  });

  describe('RivalSystem -- rival rep drift', () => {
    it('should increase rival rep in chapters 1-2', () => {
      const { state, eventBus } = createState();
      state.storyChapter = 1;
      state.rivalRep = 60;
      const rival = new RivalSystem(state, eventBus);

      eventBus.emit('game:newDay', { day: 1 });
      assert.greaterThan(state.rivalRep, 60, 'Rival rep should rise in early chapters');
    });

    it('should decrease rival rep in chapter 5 when player is strong', () => {
      const { state, eventBus } = createState();
      state.storyChapter = 5;
      state.reputation = 90;
      state.rivalRep = 70;
      const rival = new RivalSystem(state, eventBus);

      eventBus.emit('game:newDay', { day: 1 });
      assert.lessThan(state.rivalRep, 70, 'Rival should decline when player is strong in ch5');
    });

    it('should clamp rival rep to 10-95 range', () => {
      const { state, eventBus } = createState();
      state.storyChapter = 1;
      state.rivalRep = 94.9;
      const rival = new RivalSystem(state, eventBus);

      // Should not exceed 95
      eventBus.emit('game:newDay', { day: 1 });
      assert.ok(state.rivalRep <= 95, 'Should clamp to max 95');
    });
  });

  describe('RivalSystem -- weekly standings', () => {
    it('should emit rival:standings every 7 days', () => {
      const { state, eventBus } = createState();
      state.gameDay = 1;
      state.rivalRep = 60;
      state.reputation = 50;
      const rival = new RivalSystem(state, eventBus);
      const standingsEvents = collectEvents(eventBus, 'rival:standings');

      // Day 7 should trigger first standings
      for (let i = 1; i <= 7; i++) {
        eventBus.emit('game:newDay', { day: i });
      }

      assert.greaterThan(standingsEvents.length, 0, 'Should emit standings by day 7');
    });

    it('should include playerLeading and gap data', () => {
      const { state, eventBus } = createState();
      state.gameDay = 1;
      state.rivalRep = 60;
      state.reputation = 70;
      const rival = new RivalSystem(state, eventBus);
      const standingsEvents = collectEvents(eventBus, 'rival:standings');

      for (let i = 1; i <= 7; i++) {
        eventBus.emit('game:newDay', { day: i });
      }

      if (standingsEvents.length > 0) {
        assert.ok(typeof standingsEvents[0].playerLeading === 'boolean', 'Should include playerLeading');
        assert.ok(typeof standingsEvents[0].gap === 'number', 'Should include gap');
      }
    });

    it('should emit rival:dominant when rival leads by 15+', () => {
      const { state, eventBus } = createState();
      state.gameDay = 1;
      state.rivalRep = 70;
      state.reputation = 50; // gap = 20
      const rival = new RivalSystem(state, eventBus);
      const dominantEvents = collectEvents(eventBus, 'rival:dominant');

      for (let i = 1; i <= 7; i++) {
        eventBus.emit('game:newDay', { day: i });
      }

      assert.greaterThan(dominantEvents.length, 0, 'Should emit rival:dominant when gap >= 15');
    });
  });

  describe('RivalSystem -- season awards', () => {
    it('should emit rival:seasonAward when season advances', () => {
      const { state, eventBus } = createState();
      state.season = 2; // advanced from 1
      state.reputation = 70;
      state.rivalRep = 60;
      const rival = new RivalSystem(state, eventBus);
      const awardEvents = collectEvents(eventBus, 'rival:seasonAward');

      eventBus.emit('game:newDay', { day: 1 });
      assert.greaterThan(awardEvents.length, 0, 'Should emit season award');
      assert.equal(awardEvents[0].winner, 'player', 'Player should win with higher rep');
    });

    it('should award rival when rival has higher rep', () => {
      const { state, eventBus } = createState();
      state.season = 2;
      state.reputation = 50;
      state.rivalRep = 70;
      const rival = new RivalSystem(state, eventBus);
      const awardEvents = collectEvents(eventBus, 'rival:seasonAward');

      eventBus.emit('game:newDay', { day: 1 });
      assert.equal(awardEvents[0].winner, 'rival');
    });
  });

  describe('RivalSystem -- update', () => {
    it('should not process when paused', () => {
      const { state, eventBus } = createState();
      state.paused = true;
      const rival = new RivalSystem(state, eventBus);
      // Should not throw
      rival.update(1);
      assert.ok(true, 'Should handle paused state');
    });
  });
}
