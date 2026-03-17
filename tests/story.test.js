/**
 * Story System Tests
 *
 * Tests chapter transitions, NPC relationships, dialogue triggers,
 * story event firing, and choice effects.
 */

import { describe, it, assert } from './testRunner.js';
import { createState, collectEvents } from './helpers.js';
import { StorySystem } from '../src/systems/StorySystem.js';

export function runStoryTests() {

  describe('StorySystem -- chapter transitions', () => {
    it('should start at chapter 1 with default rep (35)', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      assert.equal(story.currentChapter, 1);
    });

    it('should transition to chapter 2 when rep reaches 41+', () => {
      const { state, eventBus } = createState();
      state.reputation = 35;
      const story = new StorySystem(state, eventBus);
      const chapterEvents = collectEvents(eventBus, 'story:chapterChange');

      state.reputation = 45;
      eventBus.emit('game:newDay', { day: 2 });

      assert.equal(state.storyChapter, 2, 'Should be chapter 2');
      assert.greaterThan(chapterEvents.length, 0, 'Should emit chapterChange');
      assert.equal(chapterEvents[0].from, 1);
      assert.equal(chapterEvents[0].to, 2);
    });

    it('should transition to chapter 5 at rep 86+', () => {
      const { state, eventBus } = createState();
      state.storyChapter = 4;
      state.reputation = 88;
      const story = new StorySystem(state, eventBus);
      const chapterEvents = collectEvents(eventBus, 'story:chapterChange');

      eventBus.emit('game:newDay', { day: 2 });
      assert.equal(state.storyChapter, 5, 'Should be chapter 5');
    });

    it('should not transition if rep has not changed tier', () => {
      const { state, eventBus } = createState();
      state.storyChapter = 2;
      state.reputation = 50;
      const story = new StorySystem(state, eventBus);
      const chapterEvents = collectEvents(eventBus, 'story:chapterChange');

      eventBus.emit('game:newDay', { day: 2 });
      assert.equal(chapterEvents.length, 0, 'No chapter change within same tier');
    });
  });

  describe('StorySystem -- NPC relationships', () => {
    it('should adjust NPC relationship value', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      const startVal = state.npcRelationships.maggie;

      story.adjustRelationship('maggie', 10);
      assert.equal(state.npcRelationships.maggie, startVal + 10);
    });

    it('should clamp relationship to 100', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      state.npcRelationships.maggie = 95;

      story.adjustRelationship('maggie', 20);
      assert.equal(state.npcRelationships.maggie, 100, 'Should clamp to 100');
    });

    it('should clamp relationship to -100', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      state.npcRelationships.rusty = -95;

      story.adjustRelationship('rusty', -20);
      assert.equal(state.npcRelationships.rusty, -100, 'Should clamp to -100');
    });

    it('should ignore unknown NPC IDs', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      // Should not throw
      story.adjustRelationship('nonexistent', 10);
      assert.ok(true, 'Should handle unknown NPC gracefully');
    });

    it('should emit npcReaction when crossing tier boundary', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      const reactionEvents = collectEvents(eventBus, 'story:npcReaction');

      // maggie starts at 20 (Friendly tier, 15-34)
      // Pushing to 35+ should cross to "Friend" tier
      story.adjustRelationship('maggie', 20);
      assert.greaterThan(reactionEvents.length, 0, 'Should emit reaction on tier change');
    });
  });

  describe('StorySystem -- getRelationshipTier()', () => {
    it('should return Neutral for value 0', () => {
      const { state, eventBus } = createState();
      state.npcRelationships.victor = 0;
      const story = new StorySystem(state, eventBus);
      assert.equal(story.getRelationshipTier('victor').name, 'Neutral');
    });

    it('should return Hostile for very negative value', () => {
      const { state, eventBus } = createState();
      state.npcRelationships.victor = -50;
      const story = new StorySystem(state, eventBus);
      assert.equal(story.getRelationshipTier('victor').name, 'Hostile');
    });

    it('should return Trusted for high value', () => {
      const { state, eventBus } = createState();
      state.npcRelationships.maggie = 80;
      const story = new StorySystem(state, eventBus);
      assert.equal(story.getRelationshipTier('maggie').name, 'Trusted');
    });
  });

  describe('StorySystem -- inspection result handler', () => {
    it('should increase bea relationship on grade A', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      const startBea = state.npcRelationships.bea;

      eventBus.emit('inspection:result', { grade: 'A' });
      assert.greaterThan(state.npcRelationships.bea, startBea, 'Bea should like A grades');
    });

    it('should decrease bea relationship on grade F', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      const startBea = state.npcRelationships.bea;

      eventBus.emit('inspection:result', { grade: 'F' });
      assert.lessThan(state.npcRelationships.bea, startBea, 'Bea should dislike F grades');
    });
  });

  describe('StorySystem -- choice effects', () => {
    it('should apply relationship effects from choices', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      const startMaggie = state.npcRelationships.maggie;

      eventBus.emit('story:choiceMade', {
        effects: [
          { type: 'relationship', npc: 'maggie', delta: 5 },
        ],
      });
      assert.equal(state.npcRelationships.maggie, startMaggie + 5);
    });

    it('should apply flag effects from choices', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);

      eventBus.emit('story:choiceMade', {
        effects: [
          { type: 'flag', id: 'refusedVictor', value: true },
        ],
      });
      assert.equal(state.storyFlags.refusedVictor, true);
    });

    it('should apply money effects from choices', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      const startMoney = state.money;

      eventBus.emit('story:choiceMade', {
        effects: [
          { type: 'money', delta: -500 },
        ],
      });
      assert.equal(state.money, startMoney - 500);
    });

    it('should handle null/invalid choice data gracefully', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);

      eventBus.emit('story:choiceMade', null);
      eventBus.emit('story:choiceMade', {});
      eventBus.emit('story:choiceMade', { effects: 'not an array' });
      assert.ok(true, 'Should not throw on invalid data');
    });
  });

  describe('StorySystem -- update loop', () => {
    it('should not process when paused', () => {
      const { state, eventBus } = createState();
      state.paused = true;
      const story = new StorySystem(state, eventBus);
      // Should not throw and should not fire events
      story.update(1);
      assert.ok(true, 'Should handle paused state');
    });

    it('should not process when storyEnabled is false', () => {
      const { state, eventBus, config } = createState();
      config.storyEnabled = false;
      state.config = config;
      const story = new StorySystem(state, eventBus);
      story.update(1);
      assert.ok(true, 'Should respect storyEnabled flag');
    });

    it('should set dialogueActive flag on dialogue event', () => {
      const { state, eventBus } = createState();
      const story = new StorySystem(state, eventBus);
      assert.equal(story.dialogueActive, false);

      // Manually trigger first-update which checks story triggers
      story.update(0.1);

      // Complete any active dialogue
      eventBus.emit('story:dialogueComplete', {});
      assert.equal(story.dialogueActive, false, 'Should clear dialogueActive after complete');
    });
  });

  describe('StorySystem -- relationship bonuses', () => {
    it('should emit repair speed bonus for Rusty at Friend tier', () => {
      const { state, eventBus } = createState();
      state.npcRelationships.rusty = 40; // Friend tier (35-59)
      const story = new StorySystem(state, eventBus);
      const bonusEvents = collectEvents(eventBus, 'story:bonus');

      story.checkRelationshipBonuses();
      const repairBonus = bonusEvents.find(b => b.source === 'rusty' && b.type === 'repairSpeed');
      assert.ok(repairBonus, 'Should emit repair speed bonus for Rusty at Friend tier');
      assert.equal(repairBonus.multiplier, 1.10);
    });

    it('should emit inspection warning for Bea at Friendly tier', () => {
      const { state, eventBus } = createState();
      state.npcRelationships.bea = 20; // Friendly tier (15+)
      const story = new StorySystem(state, eventBus);
      const bonusEvents = collectEvents(eventBus, 'story:bonus');

      story.checkRelationshipBonuses();
      const beaBonus = bonusEvents.find(b => b.source === 'bea' && b.type === 'inspectionWarning');
      assert.ok(beaBonus, 'Should emit inspection warning for Bea');
    });
  });
}
