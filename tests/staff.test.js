/**
 * Staff System Tests
 *
 * Tests hiring, firing, XP/leveling, specialization, morale,
 * domain assignment, and wage calculation.
 */

import { describe, it, assert } from './testRunner.js';
import { createState, collectEvents } from './helpers.js';
import { StaffSystem } from '../src/systems/StaffSystem.js';

export function runStaffTests() {

  describe('StaffSystem -- initialization', () => {
    it('should generate 3 initial candidates', () => {
      const { state, eventBus } = createState();
      const staff = new StaffSystem(state, eventBus);
      assert.equal(staff.candidates.length, 3, 'Should have 3 candidates');
    });

    it('should start with empty staff roster', () => {
      const { state, eventBus } = createState();
      const staff = new StaffSystem(state, eventBus);
      assert.equal(staff.staff.length, 0, 'No staff initially');
    });

    it('should generate candidates with valid stats', () => {
      const { state, eventBus } = createState();
      const staff = new StaffSystem(state, eventBus);
      for (const candidate of staff.candidates) {
        assert.ok(candidate.speed >= 1 && candidate.speed <= 10, 'Speed in range');
        assert.ok(candidate.skill >= 1 && candidate.skill <= 10, 'Skill in range');
        assert.ok(candidate.morale >= 60 && candidate.morale <= 80, 'Morale in range');
        assert.equal(candidate.level, 1, 'Should start at level 1');
        assert.equal(candidate.xp, 0, 'Should start with 0 XP');
        assert.ok(candidate.hireCost >= 500, 'Hire cost should be >= 500');
        assert.ok(candidate.name.length > 0, 'Should have a name');
      }
    });
  });

  describe('StaffSystem -- hiring', () => {
    it('should hire a candidate and deduct money', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const candidate = staff.candidates[0];
      const cost = candidate.hireCost;
      const startMoney = state.money;

      const hired = staff.hireCandidateById(candidate.id);
      assert.ok(hired, 'Should return hired staff');
      assert.equal(state.money, startMoney - cost, 'Should deduct hire cost');
      assert.equal(staff.staff.length, 1, 'Should add to roster');
      assert.equal(staff.candidates.length, 2, 'Should remove from candidates');
    });

    it('should refuse to hire when not enough money', () => {
      const { state, eventBus } = createState();
      state.money = 0;
      const staff = new StaffSystem(state, eventBus);
      const messages = collectEvents(eventBus, 'ui:message');

      const result = staff.hireCandidateById(staff.candidates[0].id);
      assert.equal(result, null, 'Should return null');
      assert.equal(staff.staff.length, 0, 'Should not hire');
      assert.greaterThan(messages.length, 0, 'Should show warning message');
    });

    it('should return null for invalid candidate id', () => {
      const { state, eventBus } = createState();
      const staff = new StaffSystem(state, eventBus);
      const result = staff.hireCandidateById(99999);
      assert.equal(result, null);
    });

    it('should emit staff:hired event', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hiredEvents = collectEvents(eventBus, 'staff:hired');

      staff.hireCandidateById(staff.candidates[0].id);
      assert.equal(hiredEvents.length, 1, 'Should emit staff:hired');
    });

    it('should update state.staffCount after hiring', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);

      staff.hireCandidateById(staff.candidates[0].id);
      assert.equal(state.staffCount, 1);
    });
  });

  describe('StaffSystem -- firing', () => {
    it('should remove a staff member and emit event', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);
      const firedEvents = collectEvents(eventBus, 'staff:fired');

      const removed = staff.fireStaff(hired.id);
      assert.ok(removed, 'Should return fired staff');
      assert.equal(staff.staff.length, 0, 'Should remove from roster');
      assert.equal(firedEvents.length, 1, 'Should emit staff:fired');
    });

    it('should return null for invalid staff id', () => {
      const { state, eventBus } = createState();
      const staff = new StaffSystem(state, eventBus);
      assert.equal(staff.fireStaff(99999), null);
    });
  });

  describe('StaffSystem -- XP and leveling', () => {
    it('should grant XP to a staff member', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);

      staff.grantXP(hired.id, 50);
      assert.equal(hired.xp, 50);
    });

    it('should level up when XP threshold is reached', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);
      const levelUpEvents = collectEvents(eventBus, 'staff:levelUp');

      staff.grantXP(hired.id, 100); // XP threshold for level 2 is 100
      assert.equal(hired.level, 2, 'Should reach level 2');
      assert.equal(levelUpEvents.length, 1, 'Should emit staff:levelUp');
    });

    it('should handle multiple level-ups in one grant', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);

      staff.grantXP(hired.id, 1000); // Should level up multiple times
      assert.greaterThan(hired.level, 2, 'Should level up multiple times');
    });

    it('should cap level at max (XP_THRESHOLDS length + 1)', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);

      staff.grantXP(hired.id, 99999);
      // Max level is 5 (4 thresholds + starting level 1)
      assert.ok(hired.level <= 5, 'Should not exceed max level');
    });

    it('should grant XP to all staff', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      const staff = new StaffSystem(state, eventBus);
      staff.hireCandidateById(staff.candidates[0].id);
      staff.hireCandidateById(staff.candidates[0].id);

      staff.grantXPToAll(50);
      for (const member of staff.staff) {
        assert.ok(member.xp >= 50, 'All staff should receive XP');
      }
    });
  });

  describe('StaffSystem -- specialization', () => {
    it('should refuse specialization below level 3', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);

      const result = staff.specialize(hired.id, 'airTech');
      assert.equal(result, false, 'Should refuse at level 1');
      assert.equal(hired.specialization, null, 'Should remain unspecialized');
    });

    it('should allow specialization at level 3+', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);
      staff.grantXP(hired.id, 600); // should reach level 3+

      const result = staff.specialize(hired.id, 'airTech');
      assert.equal(result, true, 'Should succeed at level 3+');
      assert.equal(hired.specialization, 'airTech');
    });

    it('should reject invalid specialization key', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);
      staff.grantXP(hired.id, 600);

      const result = staff.specialize(hired.id, 'invalidSpec');
      assert.equal(result, false, 'Should reject invalid specialization');
    });
  });

  describe('StaffSystem -- domain assignment', () => {
    it('should assign staff to a domain', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);

      const result = staff.assignToDomain(hired.id, 'air');
      assert.equal(result, true);
      assert.equal(hired.assignedDomain, 'air');
    });

    it('should unassign staff from domain', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);
      staff.assignToDomain(hired.id, 'air');

      staff.unassignStaff(hired.id);
      assert.equal(hired.assignedDomain, null);
    });
  });

  describe('StaffSystem -- repair speed multiplier', () => {
    it('should return 1.0 for domain with no specialist', () => {
      const { state, eventBus } = createState();
      const staff = new StaffSystem(state, eventBus);
      assert.equal(staff.getRepairSpeedMultiplier('air'), 1.0);
    });

    it('should return 1.5 for domain with matching specialist', () => {
      const { state, eventBus } = createState();
      state.money = 50000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);

      // Level up and specialize
      staff.grantXP(hired.id, 600);
      staff.specialize(hired.id, 'airTech');
      staff.assignToDomain(hired.id, 'air');

      assert.equal(staff.getRepairSpeedMultiplier('air'), 1.5);
    });
  });

  describe('StaffSystem -- wages', () => {
    it('should calculate total daily wages', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      const staff = new StaffSystem(state, eventBus);
      staff.hireCandidateById(staff.candidates[0].id);
      staff.hireCandidateById(staff.candidates[0].id);

      const wages = staff.getTotalDailyWages();
      assert.equal(wages, 300, 'Two staff at 150/day = 300');
    });
  });

  describe('StaffSystem -- refresh candidates', () => {
    it('should generate new candidates on refresh', () => {
      const { state, eventBus } = createState();
      const staff = new StaffSystem(state, eventBus);
      const oldIds = staff.candidates.map(c => c.id);

      staff.refreshCandidates();
      const newIds = staff.candidates.map(c => c.id);
      assert.equal(staff.candidates.length, 3, 'Should still have 3 candidates');
      // IDs should be different (new generation)
      assert.ok(newIds[0] !== oldIds[0], 'Should generate new candidates');
    });
  });

  describe('StaffSystem -- morale effects', () => {
    it('applyCrisisMorale should decrease morale for all staff', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);
      const startMorale = hired.morale;

      staff.applyCrisisMorale();
      assert.equal(hired.morale, startMorale - 3);
    });

    it('applyWinBonus should increase morale for all staff', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      const staff = new StaffSystem(state, eventBus);
      const hired = staff.hireCandidateById(staff.candidates[0].id);
      const startMorale = hired.morale;

      staff.applyWinBonus();
      assert.equal(hired.morale, Math.min(100, startMorale + 5));
    });
  });

  describe('StaffSystem -- serialize/deserialize', () => {
    it('should serialize and restore staff state', () => {
      const { state, eventBus } = createState();
      state.money = 100000;
      const staff = new StaffSystem(state, eventBus);
      staff.hireCandidateById(staff.candidates[0].id);
      staff.staff[0].xp = 50;

      const data = staff.serialize();
      assert.equal(data.staff.length, 1);
      assert.equal(data.staff[0].xp, 50);

      // Create fresh system and deserialize
      const { state: state2, eventBus: eventBus2 } = createState();
      const staff2 = new StaffSystem(state2, eventBus2);
      staff2.deserialize(data);

      assert.equal(staff2.staff.length, 1, 'Should restore staff');
      assert.equal(staff2.staff[0].xp, 50, 'Should restore XP');
    });

    it('should handle null data gracefully', () => {
      const { state, eventBus } = createState();
      const staff = new StaffSystem(state, eventBus);
      staff.deserialize(null);
      assert.ok(true, 'Should not throw');
    });
  });
}
