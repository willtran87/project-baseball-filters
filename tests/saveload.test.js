/**
 * Save/Load Round-Trip Tests
 *
 * Tests that serialize -> deserialize preserves all state fields,
 * deep copies are independent, and edge cases are handled.
 */

import { describe, it, assert } from './testRunner.js';
import { createState, collectEvents } from './helpers.js';

export function runSaveLoadTests() {

  describe('Save/Load -- round-trip serialization', () => {
    it('should preserve all core state fields', () => {
      const { state } = createState();

      // Set up diverse state
      state.money = 12345;
      state.income = 500;
      state.expenses = 200;
      state.stadiumLevel = 3;
      state.reputation = 72;
      state.gameDay = 45;
      state.inning = 5;
      state.paused = true;
      state.speed = 2;
      state.difficulty = 'allStar';
      state.staffCount = 4;
      state.attendance = 12000;
      state.season = 3;
      state.eventsSurvived = 7;
      state.championshipHosted = true;
      state.currentGameDayType = 'rivalryGame';
      state.lastInspectionGrade = 'A';
      state.rivalRep = 55.5;

      const data = state.serialize();
      const { state: restored } = createState();
      restored.deserialize(data);

      assert.equal(restored.money, 12345);
      assert.equal(restored.income, 500);
      assert.equal(restored.expenses, 200);
      assert.equal(restored.stadiumLevel, 3);
      assert.equal(restored.reputation, 72);
      assert.equal(restored.gameDay, 45);
      assert.equal(restored.inning, 5);
      assert.equal(restored.paused, true);
      assert.equal(restored.speed, 2);
      assert.equal(restored.difficulty, 'allStar');
      assert.equal(restored.staffCount, 4);
      assert.equal(restored.attendance, 12000);
      assert.equal(restored.season, 3);
      assert.equal(restored.eventsSurvived, 7);
      assert.equal(restored.championshipHosted, true);
      assert.equal(restored.currentGameDayType, 'rivalryGame');
      assert.equal(restored.lastInspectionGrade, 'A');
      assert.equal(restored.rivalRep, 55.5);
    });

    it('should preserve filters with all properties', () => {
      const { state } = createState();
      state.addFilter({
        domain: 'air',
        componentType: 'hepaFilter',
        tier: 2,
        x: 3,
        y: 7,
        condition: 150,
        maxCondition: 250,
        efficiency: 0.6,
      });

      const data = state.serialize();
      const { state: restored } = createState();
      restored.deserialize(data);

      assert.equal(restored.filters.length, 1);
      const f = restored.filters[0];
      assert.equal(f.domain, 'air');
      assert.equal(f.componentType, 'hepaFilter');
      assert.equal(f.tier, 2);
      assert.equal(f.x, 3);
      assert.equal(f.y, 7);
      assert.equal(f.condition, 150);
      assert.equal(f.maxCondition, 250);
      assert.equal(f.efficiency, 0.6);
    });

    it('should preserve story state', () => {
      const { state } = createState();
      state.storyChapter = 3;
      state.npcRelationships = { maggie: 50, rusty: 30, victor: -10, priya: 25, bea: 15, diego: 20, fiona: 5 };
      state.hanksNotes = ['note1', 'note2', 'note3'];
      state.storyFlags = { metFiona: true, refusedVictor: true };
      state.storyEventsCompleted = ['ch1_intro', 'ch2_maggie'];

      const data = state.serialize();
      const { state: restored } = createState();
      restored.deserialize(data);

      assert.equal(restored.storyChapter, 3);
      assert.equal(restored.npcRelationships.maggie, 50);
      assert.equal(restored.npcRelationships.victor, -10);
      assert.equal(restored.hanksNotes.length, 3);
      assert.equal(restored.storyFlags.metFiona, true);
      assert.equal(restored.storyEventsCompleted.length, 2);
    });

    it('should preserve staff list', () => {
      const { state } = createState();
      state.staffList = [
        { id: 1, name: 'Mike Johnson', speed: 5, skill: 7, morale: 80, xp: 150, level: 2, specialization: 'airTech', assignedDomain: 'air', hireCost: 1000, wagePerDay: 150 },
      ];

      const data = state.serialize();
      const { state: restored } = createState();
      restored.deserialize(data);

      assert.equal(restored.staffList.length, 1);
      assert.equal(restored.staffList[0].name, 'Mike Johnson');
      assert.equal(restored.staffList[0].specialization, 'airTech');
    });

    it('should preserve research progress', () => {
      const { state } = createState();
      state.researchProgress = {
        completedNodes: ['eff_1_energy_audit'],
        activeResearch: { nodeId: 'eff_2_vfd_retrofit', daysRemaining: 3 },
      };

      const data = state.serialize();
      const { state: restored } = createState();
      restored.deserialize(data);

      assert.ok(restored.researchProgress.completedNodes.includes('eff_1_energy_audit'));
      assert.equal(restored.researchProgress.activeResearch.nodeId, 'eff_2_vfd_retrofit');
      assert.equal(restored.researchProgress.activeResearch.daysRemaining, 3);
    });

    it('should preserve media headlines', () => {
      const { state } = createState();
      state.mediaHeadlines = [
        { text: 'Ridgemont Shines!', sentiment: 'positive', repEffect: 1, day: 5 },
        { text: 'Problems at Stadium', sentiment: 'negative', repEffect: -1, day: 4 },
      ];

      const data = state.serialize();
      const { state: restored } = createState();
      restored.deserialize(data);

      assert.equal(restored.mediaHeadlines.length, 2);
      assert.equal(restored.mediaHeadlines[0].text, 'Ridgemont Shines!');
    });

    it('should preserve active contracts', () => {
      const { state } = createState();
      state.activeContracts = [
        { id: 'sponsor1', name: 'Local Biz', payPerGame: 500, boostedPay: 600 },
      ];

      const data = state.serialize();
      const { state: restored } = createState();
      restored.deserialize(data);

      assert.equal(restored.activeContracts.length, 1);
      assert.equal(restored.activeContracts[0].boostedPay, 600);
    });

    it('should preserve unlocked features and achievements', () => {
      const { state } = createState();
      state.unlockedFilterTypes = ['basic', 'carbon', 'hepa'];
      state.unlockedFeatures = ['luxuryBoxWing', 'tier2Upgrades'];
      state.achievements = ['first_filter', 'week_one'];

      const data = state.serialize();
      const { state: restored } = createState();
      restored.deserialize(data);

      assert.equal(restored.unlockedFilterTypes.length, 3);
      assert.equal(restored.unlockedFeatures.length, 2);
      assert.equal(restored.achievements.length, 2);
      assert.ok(restored.unlockedFeatures.includes('luxuryBoxWing'));
    });
  });

  describe('Save/Load -- deep copy independence', () => {
    it('should not share filter references between original and serialized', () => {
      const { state } = createState();
      state.addFilter({ domain: 'air', componentType: 'hepaFilter', tier: 1, x: 0, y: 0, condition: 100, maxCondition: 100 });

      const data = state.serialize();
      state.filters[0].condition = 50;
      assert.equal(data.filters[0].condition, 100, 'Serialized data should be independent');
    });

    it('should not share staffList references', () => {
      const { state } = createState();
      state.staffList = [{ id: 1, name: 'Test', morale: 80 }];

      const data = state.serialize();
      state.staffList[0].morale = 20;
      assert.equal(data.staffList[0].morale, 80, 'Serialized staff should be independent');
    });

    it('should not share npcRelationships reference', () => {
      const { state } = createState();
      const data = state.serialize();
      state.npcRelationships.maggie = 99;
      assert.equal(data.npcRelationships.maggie, 20, 'Serialized NPC data should be independent');
    });
  });

  describe('Save/Load -- edge cases', () => {
    it('should handle empty state gracefully', () => {
      const { state } = createState();
      const data = state.serialize();
      assert.ok(data._version, 'Should include version');
      assert.ok(Array.isArray(data.filters));
      assert.ok(Array.isArray(data.achievements));
    });

    it('should handle deserialize with missing fields', () => {
      const { state } = createState();
      state.deserialize({ money: 999 });
      assert.equal(state.money, 999);
      assert.equal(state.gameDay, 1); // defaults
      assert.equal(state.reputation, 50); // defaults
    });

    it('should handle deserialize with extra unknown fields', () => {
      const { state } = createState();
      state.deserialize({ money: 100, unknownField: 'hello', anotherField: [1, 2, 3] });
      assert.equal(state.money, 100, 'Known fields should be restored');
      assert.ok(true, 'Should not throw on unknown fields');
    });

    it('should emit state:loaded event on deserialize', () => {
      const { state, eventBus } = createState();
      const loadedEvents = collectEvents(eventBus, 'state:loaded');

      state.deserialize({ money: 500 });
      assert.equal(loadedEvents.length, 1);
    });

    it('should round-trip through JSON without data loss', () => {
      const { state } = createState();
      state.money = 99999;
      state.reputation = 87.5;
      state.storyFlags = { testFlag: true, anotherFlag: 'value' };

      const json = JSON.stringify(state.serialize());
      const parsed = JSON.parse(json);
      const { state: restored } = createState();
      restored.deserialize(parsed);

      assert.equal(restored.money, 99999);
      assert.equal(restored.reputation, 87.5);
      assert.equal(restored.storyFlags.testFlag, true);
    });
  });
}
