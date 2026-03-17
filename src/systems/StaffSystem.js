/**
 * StaffSystem — Staff RPG system.
 *
 * Manages hiring, XP/leveling, morale, specialization, and wage costs
 * for maintenance workers. Staff interact with the FiltrationSystem
 * by providing repair bonuses and early warning detection.
 */

// Name pools for procedural generation
const FIRST_NAMES = [
  'Mike', 'Joe', 'Carlos', 'Dave', 'Ray', 'Tommy', 'Luis', 'Frank',
  'Eddie', 'Sam', 'Al', 'Hank', 'Pete', 'Manny', 'Gus', 'Rico',
  'Vince', 'Tony', 'Jesse', 'Bobby', 'Earl', 'Cliff', 'Norm', 'Walt',
  'Rosa', 'Maria', 'Kim', 'Dana', 'Alex', 'Pat', 'Casey', 'Terry',
];
const LAST_NAMES = [
  'Johnson', 'Martinez', 'Smith', 'Garcia', 'Brown', 'Wilson', 'Davis',
  'Lopez', 'Miller', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White',
  'Harris', 'Clark', 'Lewis', 'Young', 'Walker', 'Hall', 'Allen', 'King',
  'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter', 'Reed',
];

// Quirky traits that give staff personality
const STAFF_TRAITS = [
  { trait: 'Whistler', desc: 'Whistles while they work. Always off-key.', moraleBonus: 2 },
  { trait: 'Early Bird', desc: 'Always first one in. Coffee is always fresh.', speedBonus: 1 },
  { trait: 'Night Owl', desc: 'Does their best work after midnight.', skillBonus: 1 },
  { trait: 'Duct Tape Devotee', desc: 'Believes duct tape fixes everything. Often correct.', speedBonus: 1 },
  { trait: 'Tool Hoarder', desc: 'Owns three of every wrench. "Just in case."', skillBonus: 1 },
  { trait: 'Superstitious', desc: 'Won\'t work on filter #13. Has a lucky hard hat.', moraleBonus: 3 },
  { trait: 'Former Chef', desc: 'Used to run a restaurant kitchen. Treats pipes like plumbing.', skillBonus: 1 },
  { trait: 'Podcast Addict', desc: 'Always has one earbud in. True crime, mostly.', moraleBonus: 2 },
  { trait: 'Ex-Navy', desc: 'Served on a submarine. Tight spaces are no problem.', speedBonus: 1 },
  { trait: 'Cat Person', desc: 'Has photos of 4 cats in their locker. Talks about them constantly.', moraleBonus: 3 },
  { trait: 'Baseball Nerd', desc: 'Knows every Raptors stat since \'87. Works extra hard on game days.', moraleBonus: 2 },
  { trait: 'Perfectionist', desc: 'Triple-checks every repair. Slower, but rarely needs to redo work.', skillBonus: 2 },
  { trait: 'Speed Demon', desc: 'Fastest wrench in the west. Quality is... variable.', speedBonus: 2 },
  { trait: 'Old School', desc: 'Learned from their grandfather. No power tools needed.', skillBonus: 1 },
  { trait: 'YouTube Grad', desc: 'Self-taught from online videos. Surprisingly effective.', moraleBonus: 1 },
  { trait: 'Snack Stasher', desc: 'Has emergency snacks hidden in every zone. Morale never drops below "peckish."', moraleBonus: 3 },
  { trait: 'Dad Joker', desc: 'Unstoppable pun machine. Groans improve team morale somehow.', moraleBonus: 2 },
  { trait: 'Quiet Type', desc: 'Barely says two words a day. But when they talk, everyone listens.', skillBonus: 1 },
  { trait: 'Overachiever', desc: 'Volunteers for every shift. Might burn out. Might not.', speedBonus: 1, moraleBonus: -1 },
  { trait: 'Lucky', desc: 'Things just work out for them. Nobody knows why.', moraleBonus: 2 },
];

// Short backstory snippets
const STAFF_BACKSTORIES = [
  'Used to work at Glendale. Left because Victor was "impossible."',
  'Third-generation stadium worker. Grandfather helped build this place.',
  'Took this job to pay for night school. Studying engineering.',
  'Former minor league player. Blew out a knee in \'14. Stayed close to the game.',
  'Moved to Ridgemont last year. Needed a fresh start.',
  'Grew up attending games here. Always wanted to work behind the scenes.',
  'Previously worked on cruise ships. "At least this place doesn\'t rock."',
  'Apprenticed under Hank Doolan for one summer. Still talks about it.',
  'Retired from the fire department. Misses the action.',
  'Just graduated trade school. Eager to prove themselves.',
  'Former HVAC contractor. Got tired of house calls. Wanted something bigger.',
  'Worked at three stadiums before this one. "Ridgemont has something special."',
  'Taught plumbing at the community college. Decided to get hands dirty again.',
  'Came for the job. Stayed for Big Tony\'s hot dogs.',
  'Lost a bet and had to apply here. Won\'t admit they love it now.',
  'Answered a help-wanted ad on a napkin at Rusty\'s Diner. True story.',
  'Veteran electrician. Claims to have been struck by lightning twice. Won\'t elaborate.',
  'Previously worked at an aquarium. "Pipes are pipes. Fish or no fish."',
  'Single parent. Works hard so their kid can attend games for free.',
  'Relocated from up north. "You call THIS a cold snap?"',
];

// XP thresholds for leveling (tuned so level 3/specialization is reachable in ~40 game-days)
const XP_THRESHOLDS = [50, 150, 300, 500];

// Specialization definitions
const SPECIALIZATIONS = {
  airTech:     { name: 'Air Tech',     domains: ['air', 'hvac'] },
  plumber:     { name: 'Plumber',      domains: ['water', 'drainage'] },
  electrician: { name: 'Electrician',  domains: ['electrical'] },
  general:     { name: 'General Maintenance', domains: ['air', 'water', 'hvac', 'drainage', 'electrical'] },
};

const MORALE_QUIT_THRESHOLD = 30;
const MORALE_QUIT_CHANCE = 0.10; // 10% per day
const OVERWORK_THRESHOLD = 3;    // repairs per day
const MIN_WAGE_THRESHOLD = 100;  // $/day
const GOOD_WAGE_THRESHOLD = 150; // $/day

export class StaffSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;

    // Staff roster: synced with state.staffList for save/load via StateManager
    this.staff = this.state.staffList ?? [];
    this.nextStaffId = this.staff.length > 0
      ? Math.max(...this.staff.map(s => s.id)) + 1
      : 1;

    // Candidates available for hire (refreshable)
    this.candidates = [];

    // Track daily repair counts per staff for overwork
    this._dailyRepairs = new Map();
    for (const member of this.staff) {
      this._dailyRepairs.set(member.id, 0);
    }

    // Day accumulator for per-day processing
    this._dayTimer = 0;
    // Early warning cooldown to prevent spamming every tick
    this._earlyWarningTimer = 0;
    this._earlyWarningInterval = 30; // check every 30 seconds
    this._warnedFilters = new Set(); // track which filters we already warned about

    // Refresh cost tracking (first refresh each day is free)
    this._refreshCount = -1;
    this._refreshBaseCost = 50;

    // Generate initial candidates (doesn't count toward daily refreshes)
    this.refreshCandidates();

    // Listen for events that grant XP
    this.eventBus.on('filter:repaired', (filter) => this._onRepair(filter));
    this.eventBus.on('event:survived', () => this._onEventSurvived());
    this.eventBus.on('game:newDay', () => this._onNewDay());

    // Listen for story bonuses (NPC relationship effects)
    this._storyRepairSpeedBonus = 1.0;
    this._storyMoraleBoost = 0;
    this.eventBus.on('story:bonus', (data) => {
      if (data.type === 'repairSpeed') {
        this._storyRepairSpeedBonus = data.multiplier ?? 1.0;
      }
      if (data.type === 'moraleBoost') {
        this._storyMoraleBoost = data.value ?? 0;
      }
    });

    // Re-sync staff from state after save/load
    this.eventBus.on('state:loaded', () => {
      this.staff = this.state.staffList ?? [];
      this.nextStaffId = this.staff.length > 0
        ? Math.max(...this.staff.map(s => s.id)) + 1
        : 1;
      this._dailyRepairs.clear();
      for (const member of this.staff) {
        this._dailyRepairs.set(member.id, 0);
      }
    });

    // Listen for staff assignment requests
    this.eventBus.on('staff:hire', (data) => this.hireCandidateById(data.candidateId));
    this.eventBus.on('staff:fire', (data) => this.fireStaff(data.staffId));
    this.eventBus.on('staff:specialize', (data) => this.specialize(data.staffId, data.specialization));
    this.eventBus.on('staff:assign', (data) => this.assignToDomain(data.staffId, data.domain));
    this.eventBus.on('staff:unassign', (data) => this.unassignStaff(data.staffId));
    this.eventBus.on('staff:refreshCandidates', () => this.refreshCandidates());
  }

  /**
   * Sync local staff array to state.staffList for StateManager serialization.
   */
  _syncToState() {
    this.state.staffList = this.staff;
  }

  /**
   * Per-tick update: process wage costs, morale, early warning detection.
   */
  update(dt) {
    if (this.state.paused) return;

    // Check for early warnings from specialists (with cooldown)
    this._earlyWarningTimer += dt;
    if (this._earlyWarningTimer >= this._earlyWarningInterval) {
      this._earlyWarningTimer = 0;
      this._checkEarlyWarnings();
    }
  }

  /**
   * Generate a random staff member with procedural name and stats.
   */
  _generateStaff() {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    let speed = Math.floor(Math.random() * 10) + 1;
    let skill = Math.floor(Math.random() * 10) + 1;
    let morale = Math.floor(Math.random() * 21) + 60; // 60-80

    // Assign a random quirky trait
    const traitData = STAFF_TRAITS[Math.floor(Math.random() * STAFF_TRAITS.length)];
    speed = Math.min(15, speed + (traitData.speedBonus ?? 0));
    skill = Math.min(15, skill + (traitData.skillBonus ?? 0));
    morale = Math.max(40, Math.min(100, morale + (traitData.moraleBonus ?? 0)));

    // Assign a random backstory
    const backstory = STAFF_BACKSTORIES[Math.floor(Math.random() * STAFF_BACKSTORIES.length)];

    const statTotal = speed + skill;
    // Hire cost: $500-2000 based on stats (stats range 2-20, so scale accordingly)
    const hireCost = Math.floor(500 + (statTotal - 2) / 18 * 1500);

    return {
      id: this.nextStaffId++,
      name: `${firstName} ${lastName}`,
      speed,
      skill,
      morale,
      xp: 0,
      level: 1,
      specialization: null,
      assignedDomain: null,
      hireCost,
      wagePerDay: 150, // default wage
      trait: traitData.trait,
      traitDesc: traitData.desc,
      backstory,
    };
  }

  /**
   * Get the cost of the next candidate refresh (first per day is free).
   */
  getRefreshCost() {
    if (this._refreshCount <= 0) return 0;
    return this._refreshBaseCost * this._refreshCount;
  }

  /**
   * Refresh the candidate pool with 3 new random workers.
   * First refresh each day is free; subsequent ones cost increasing money.
   */
  refreshCandidates() {
    const cost = this.getRefreshCost();
    if (cost > 0) {
      if (this.state.money < cost) {
        this.eventBus.emit('ui:message', { text: `Not enough money to refresh ($${cost})`, type: 'warning' });
        return;
      }
      this.state.set('money', this.state.money - cost);
    }

    this._refreshCount++;
    this.candidates = [];
    // Diego vipIntros bonus: 1 extra candidate in the hire pool
    const candidateCount = this.state.storyFlags?.vipIntros ? 4 : 3;
    for (let i = 0; i < candidateCount; i++) {
      this.candidates.push(this._generateStaff());
    }
    this.eventBus.emit('staff:candidatesRefreshed', { candidates: this.candidates, cost });
  }

  /**
   * Hire a candidate by their id from the candidates pool.
   */
  hireCandidateById(candidateId) {
    const idx = this.candidates.findIndex(c => c.id === candidateId);
    if (idx === -1) return null;

    const candidate = this.candidates[idx];
    if (this.state.money < candidate.hireCost) {
      this.eventBus.emit('ui:message', { text: 'Not enough money to hire!', type: 'warning' });
      return null;
    }

    this.state.set('money', this.state.money - candidate.hireCost);
    this.candidates.splice(idx, 1);
    this.staff.push(candidate);
    this._syncToState();
    this.state.set('staffCount', this.staff.length);
    this._dailyRepairs.set(candidate.id, 0);

    this.eventBus.emit('staff:hired', candidate);
    return candidate;
  }

  /**
   * Fire a staff member.
   */
  fireStaff(staffId) {
    const idx = this.staff.findIndex(s => s.id === staffId);
    if (idx === -1) return null;
    const [removed] = this.staff.splice(idx, 1);
    this._dailyRepairs.delete(removed.id);
    this._syncToState();
    this.state.set('staffCount', this.staff.length);
    this.eventBus.emit('staff:fired', removed);
    return removed;
  }

  /**
   * Get a staff member by id.
   */
  getStaff(id) {
    return this.staff.find(s => s.id === id) ?? null;
  }

  /**
   * Specialize a staff member (level 3+ required).
   */
  specialize(staffId, specializationKey) {
    const member = this.getStaff(staffId);
    if (!member) return false;
    if (member.level < 3) {
      this.eventBus.emit('ui:message', { text: 'Staff must be level 3+ to specialize!', type: 'warning' });
      return false;
    }
    if (!SPECIALIZATIONS[specializationKey]) {
      this.eventBus.emit('ui:message', { text: 'Invalid specialization!', type: 'warning' });
      return false;
    }
    member.specialization = specializationKey;
    this.eventBus.emit('staff:specialized', { staff: member, specialization: specializationKey });
    return true;
  }

  /**
   * Assign a staff member to a filtration domain.
   */
  assignToDomain(staffId, domain) {
    const member = this.getStaff(staffId);
    if (!member) return false;
    member.assignedDomain = domain;
    this._refreshRepairMultipliers();
    this.eventBus.emit('staff:assigned', { staff: member, domain });
    return true;
  }

  /**
   * Unassign a staff member from their domain.
   */
  unassignStaff(staffId) {
    const member = this.getStaff(staffId);
    if (!member) return false;
    member.assignedDomain = null;
    this._refreshRepairMultipliers();
    this.eventBus.emit('staff:unassigned', { staff: member });
    return true;
  }

  /**
   * Grant XP to a specific staff member and check for level-up.
   */
  grantXP(staffId, amount) {
    const member = this.getStaff(staffId);
    if (!member) return;
    member.xp += amount;
    this._checkLevelUp(member);
  }

  /**
   * Grant XP to all staff.
   */
  grantXPToAll(amount) {
    for (const member of this.staff) {
      member.xp += amount;
      this._checkLevelUp(member);
    }
  }

  /**
   * Check and process level-up for a staff member.
   */
  _checkLevelUp(member) {
    const thresholdIndex = member.level - 1; // level 1 -> index 0 (threshold 100)
    if (thresholdIndex >= XP_THRESHOLDS.length) return; // max level reached

    const threshold = XP_THRESHOLDS[thresholdIndex];
    if (member.xp >= threshold) {
      member.level++;
      // Randomly boost Speed or Skill
      if (Math.random() < 0.5) {
        member.speed = Math.min(member.speed + 1, 15);
      } else {
        member.skill = Math.min(member.skill + 1, 15);
      }
      this.eventBus.emit('staff:levelUp', { staff: member });
      // Check for further level-ups
      this._checkLevelUp(member);
    }
  }

  /**
   * Handle repair event — grant XP and track daily repairs.
   */
  _onRepair(filter) {
    // Find staff assigned to this filter's domain, or pick first available
    const assigned = this.staff.find(s => s.assignedDomain === filter.domain);
    const worker = assigned ?? this.staff[0];
    if (!worker) return;

    this.grantXP(worker.id, 15);

    const count = (this._dailyRepairs.get(worker.id) ?? 0) + 1;
    this._dailyRepairs.set(worker.id, count);
  }

  /**
   * Handle event survived — grant XP to all staff.
   */
  _onEventSurvived() {
    this.grantXPToAll(10);
  }

  /**
   * New day processing: morale, wages, quit checks, XP for day worked.
   */
  _onNewDay() {
    this._refreshCount = 0;
    const quitters = [];

    for (const member of this.staff) {
      // Grant daily XP (3 base + skill bonus)
      member.xp += 3 + Math.floor(member.skill / 5);
      this._checkLevelUp(member);

      // Morale recovery: +1/day base, plus story bonus (Diego relationship)
      // _storyMoraleBoost is 0.05 when active; *20 gives +1/day gentle boost
      const dailyMoraleRecovery = 1 + Math.floor(this._storyMoraleBoost * 20);
      member.morale = Math.min(100, member.morale + dailyMoraleRecovery);

      // Wage-based morale
      if (member.wagePerDay > GOOD_WAGE_THRESHOLD) {
        member.morale = Math.min(100, member.morale + 3);
      }
      if (member.wagePerDay < MIN_WAGE_THRESHOLD) {
        member.morale = Math.max(0, member.morale - 2);
      }

      // Overwork penalty
      const repairs = this._dailyRepairs.get(member.id) ?? 0;
      if (repairs > OVERWORK_THRESHOLD) {
        member.morale = Math.max(0, member.morale - 5);
      }

      // Crisis morale loss is handled via event:crisis listener if needed

      // Quit check
      if (member.morale < MORALE_QUIT_THRESHOLD && Math.random() < MORALE_QUIT_CHANCE) {
        quitters.push(member);
      }
    }

    // Process quitters
    for (const quitter of quitters) {
      const idx = this.staff.findIndex(s => s.id === quitter.id);
      if (idx !== -1) {
        this.staff.splice(idx, 1);
        this._dailyRepairs.delete(quitter.id);
        this.eventBus.emit('staff:quit', quitter);
        this.eventBus.emit('ui:message', {
          text: `${quitter.name} quit due to low morale!`,
          type: 'warning',
        });
      }
    }

    // Sync and update staffCount
    this._syncToState();
    this.state.set('staffCount', this.staff.length);

    this._refreshRepairMultipliers();

    // Reset daily repair counters
    this._dailyRepairs.clear();
    for (const member of this.staff) {
      this._dailyRepairs.set(member.id, 0);
    }
  }

  /**
   * Apply morale hit from a crisis event.
   */
  applyCrisisMorale() {
    for (const member of this.staff) {
      member.morale = Math.max(0, member.morale - 3);
    }
  }

  /**
   * Apply morale boost from a game day win.
   */
  applyWinBonus() {
    for (const member of this.staff) {
      member.morale = Math.min(100, member.morale + 5);
    }
  }

  /**
   * Check for early warnings from specialists.
   * Specialists can detect filter problems 1 inning early.
   */
  _checkEarlyWarnings() {
    for (const member of this.staff) {
      if (!member.specialization || !member.assignedDomain) continue;

      const spec = SPECIALIZATIONS[member.specialization];
      if (!spec || !spec.domains.includes(member.assignedDomain)) continue;

      // Check filters in assigned domain for degraded/warning state
      for (const filter of this.state.filters) {
        if (filter.domain !== member.assignedDomain) continue;
        if (filter.condition <= 0) continue;

        const ratio = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
        // Early warning at 30-45% (before the 25% warning threshold)
        if (ratio > 0.30 && ratio < 0.45) {
          // Only warn once per filter until it's repaired (exits the warning range)
          if (this._warnedFilters.has(filter.id)) continue;
          this._warnedFilters.add(filter.id);
          this.eventBus.emit('staff:earlyWarning', {
            staff: member,
            filter,
            message: `${member.name} detected an issue with a ${filter.domain} filter!`,
          });
        } else {
          // Filter is outside warning range — allow future re-warning
          this._warnedFilters.delete(filter.id);
        }
      }
    }
  }

  /**
   * Recompute repair speed multipliers for all domains immediately.
   */
  _refreshRepairMultipliers() {
    this.state.staffRepairMultipliers = {};
    for (const domain of ['air', 'water', 'hvac', 'drainage']) {
      this.state.staffRepairMultipliers[domain] = this.getRepairSpeedMultiplier(domain);
    }
  }

  /**
   * Get repair speed multiplier for a given domain.
   * Specialists in the matching domain repair 50% faster.
   */
  getRepairSpeedMultiplier(domain) {
    // Research bonus from config (modified by ResearchSystem)
    const configBonus = this.state.config?.staff?.repairSpeedPerStaff ?? 1.0;
    let multiplier = configBonus * (this._storyRepairSpeedBonus ?? 1.0); // Rusty relationship bonus
    for (const member of this.staff) {
      if (!member.specialization || member.assignedDomain !== domain) continue;
      const spec = SPECIALIZATIONS[member.specialization];
      if (spec && spec.domains.includes(domain)) {
        multiplier *= 1.5; // 50% faster from specialization
        break;
      }
    }
    return multiplier;
  }

  /**
   * Get the staff member assigned to a domain (for mini-game XP).
   */
  getAssignedStaff(domain) {
    return this.staff.find(s => s.assignedDomain === domain) ?? null;
  }

  /**
   * Calculate total daily wage cost.
   */
  getTotalDailyWages() {
    let total = 0;
    for (const member of this.staff) {
      total += member.wagePerDay;
    }
    return total;
  }

  /**
   * Serialize staff state for save/load.
   */
  serialize() {
    return {
      staff: this.staff.map(s => ({ ...s })),
      nextStaffId: this.nextStaffId,
      candidates: this.candidates.map(c => ({ ...c })),
    };
  }

  /**
   * Restore staff state from save data.
   */
  deserialize(data) {
    if (!data) return;
    this.staff = Array.isArray(data.staff) ? data.staff : [];
    this.nextStaffId = data.nextStaffId ?? 1;
    this.candidates = Array.isArray(data.candidates) ? data.candidates : [];
    this._dailyRepairs.clear();
    for (const member of this.staff) {
      this._dailyRepairs.set(member.id, 0);
    }
    this._syncToState();
    this.state.set('staffCount', this.staff.length);
  }
}

/**
 * Export specialization definitions for UI.
 */
export { SPECIALIZATIONS, XP_THRESHOLDS };
