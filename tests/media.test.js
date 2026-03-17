/**
 * Media System Tests
 *
 * Tests headline generation, sentiment selection, reputation effects,
 * Priya relationship bonus, and headline storage.
 */

import { describe, it, assert } from './testRunner.js';
import { createState, collectEvents } from './helpers.js';
import { MediaSystem } from '../src/systems/MediaSystem.js';

export function runMediaTests() {

  describe('MediaSystem -- daily headline generation', () => {
    it('should generate a headline on game:newDay', () => {
      const { state, eventBus } = createState();
      const media = new MediaSystem(state, eventBus);
      const headlineEvents = collectEvents(eventBus, 'media:headline');

      eventBus.emit('game:newDay', {});
      assert.equal(headlineEvents.length, 1, 'Should generate one headline');
      assert.ok(headlineEvents[0].text.length > 0, 'Headline should have text');
    });

    it('should generate positive headlines for high quality + rep', () => {
      const { state, eventBus } = createState();
      state.reputation = 70;
      const media = new MediaSystem(state, eventBus);
      const headlineEvents = collectEvents(eventBus, 'media:headline');

      eventBus.emit('filtration:quality', { avgEfficiency: 0.9 });
      eventBus.emit('game:newDay', {});

      assert.equal(headlineEvents[0].sentiment, 'positive');
    });

    it('should generate negative headlines for low quality or rep', () => {
      const { state, eventBus } = createState();
      state.reputation = 20;
      const media = new MediaSystem(state, eventBus);
      const headlineEvents = collectEvents(eventBus, 'media:headline');

      eventBus.emit('filtration:quality', { avgEfficiency: 0.2 });
      eventBus.emit('game:newDay', {});

      assert.equal(headlineEvents[0].sentiment, 'negative');
    });

    it('should generate neutral headlines for middling performance', () => {
      const { state, eventBus } = createState();
      state.reputation = 45;
      const media = new MediaSystem(state, eventBus);
      const headlineEvents = collectEvents(eventBus, 'media:headline');

      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });
      eventBus.emit('game:newDay', {});

      assert.equal(headlineEvents[0].sentiment, 'neutral');
    });
  });

  describe('MediaSystem -- reputation effects', () => {
    it('should apply positive rep effect for positive headline', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      const media = new MediaSystem(state, eventBus);

      eventBus.emit('filtration:quality', { avgEfficiency: 0.9 });
      const beforeRep = state.reputation;
      eventBus.emit('game:newDay', {});

      assert.greaterThan(state.reputation, beforeRep, 'Positive headline should boost rep');
    });

    it('should apply negative rep effect for negative headline', () => {
      const { state, eventBus } = createState();
      state.reputation = 20;
      const media = new MediaSystem(state, eventBus);

      eventBus.emit('filtration:quality', { avgEfficiency: 0.2 });
      const beforeRep = state.reputation;
      eventBus.emit('game:newDay', {});

      assert.lessThan(state.reputation, beforeRep, 'Negative headline should hurt rep');
    });

    it('should not change rep for neutral headline', () => {
      const { state, eventBus } = createState();
      state.reputation = 45;
      const media = new MediaSystem(state, eventBus);

      eventBus.emit('filtration:quality', { avgEfficiency: 0.5 });
      const beforeRep = state.reputation;
      eventBus.emit('game:newDay', {});

      assert.equal(state.reputation, beforeRep, 'Neutral headline should not change rep');
    });
  });

  describe('MediaSystem -- Priya relationship bonus', () => {
    it('should boost positive headline rep when Priya is at 50+', () => {
      const { state, eventBus } = createState();
      state.reputation = 60;
      state.npcRelationships = { priya: 55 };
      const media = new MediaSystem(state, eventBus);
      const headlineEvents = collectEvents(eventBus, 'media:headline');

      eventBus.emit('filtration:quality', { avgEfficiency: 0.9 });
      eventBus.emit('game:newDay', {});

      // With Priya bonus, repEffect should be 2 (1 base + 1 bonus)
      assert.equal(headlineEvents[0].repEffect, 2, 'Should have Priya bonus on positive headline');
    });

    it('should not boost negative headlines', () => {
      const { state, eventBus } = createState();
      state.reputation = 20;
      state.npcRelationships = { priya: 55 };
      const media = new MediaSystem(state, eventBus);
      const headlineEvents = collectEvents(eventBus, 'media:headline');

      eventBus.emit('filtration:quality', { avgEfficiency: 0.2 });
      eventBus.emit('game:newDay', {});

      assert.equal(headlineEvents[0].repEffect, -1, 'Priya bonus should not apply to negative');
    });
  });

  describe('MediaSystem -- headline storage', () => {
    it('should store headlines in state.mediaHeadlines', () => {
      const { state, eventBus } = createState();
      const media = new MediaSystem(state, eventBus);

      eventBus.emit('game:newDay', {});
      assert.equal(state.mediaHeadlines.length, 1, 'Should have 1 stored headline');
      assert.ok(state.mediaHeadlines[0].text, 'Stored headline should have text');
      assert.ok(state.mediaHeadlines[0].sentiment, 'Should have sentiment');
    });

    it('should cap stored headlines at 20', () => {
      const { state, eventBus } = createState();
      const media = new MediaSystem(state, eventBus);

      for (let i = 0; i < 25; i++) {
        eventBus.emit('game:newDay', {});
      }
      assert.equal(state.mediaHeadlines.length, 20, 'Should cap at 20 headlines');
    });

    it('should add newest headlines first (most recent at index 0)', () => {
      const { state, eventBus } = createState();
      state.gameDay = 1;
      const media = new MediaSystem(state, eventBus);

      eventBus.emit('game:newDay', {});
      state.gameDay = 5;
      eventBus.emit('game:newDay', {});

      assert.equal(state.mediaHeadlines[0].day, 5, 'Newest headline should be first');
    });
  });

  describe('MediaSystem -- event headlines', () => {
    it('should generate headline for inspection result', () => {
      const { state, eventBus } = createState();
      const media = new MediaSystem(state, eventBus);
      const headlineEvents = collectEvents(eventBus, 'media:headline');

      eventBus.emit('inspection:result', { grade: 'A' });
      assert.greaterThan(headlineEvents.length, 0, 'Should generate inspection headline');
      assert.equal(headlineEvents[0].sentiment, 'positive', 'Grade A should be positive');
    });

    it('should generate headline for tier promotion', () => {
      const { state, eventBus } = createState();
      const media = new MediaSystem(state, eventBus);
      const headlineEvents = collectEvents(eventBus, 'media:headline');

      eventBus.emit('progression:tierChange', { promoted: true, to: { name: 'Double-A' } });
      assert.greaterThan(headlineEvents.length, 0, 'Should generate tier change headline');
      assert.equal(headlineEvents[0].sentiment, 'positive');
    });

    it('should generate negative headline for tier demotion', () => {
      const { state, eventBus } = createState();
      const media = new MediaSystem(state, eventBus);
      const headlineEvents = collectEvents(eventBus, 'media:headline');

      eventBus.emit('progression:tierChange', { promoted: false, to: { name: 'Minor League' } });
      assert.equal(headlineEvents[0].sentiment, 'negative');
    });
  });

  describe('MediaSystem -- update', () => {
    it('should not throw on update (no-op)', () => {
      const { state, eventBus } = createState();
      const media = new MediaSystem(state, eventBus);
      media.update(1);
      assert.ok(true, 'Update should be a safe no-op');
    });
  });
}
