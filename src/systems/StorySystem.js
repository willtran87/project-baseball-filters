/**
 * StorySystem — Story state machine managing narrative events, NPC relationships,
 * chapter progression, and dialogue triggers.
 *
 * Follows the existing system pattern: constructor(state, eventBus) + update(dt).
 *
 * Listens to: game:newDay, progression:tierChange, event:ended, inspection:result
 * Emits: story:dialogue, story:cutscene, story:noteFound, story:chapterChange,
 *        story:npcReaction, story:dialogueComplete, story:choiceMade
 */

// Import story data
import { STORY_EVENTS, NPC_DATA, HANK_NOTES, STORY_CHAPTERS, STORY_MILESTONES, NPC_REACTIONS, NPC_AMBIENT_DIALOGUE } from '../data/storyData.js';
import { NPC_CASUAL_DIALOGUE } from '../data/npcDialogue.js';

// NPC relationship tier thresholds
const RELATIONSHIP_TIERS = [
  { name: 'Hostile',   min: -100, max: -21 },
  { name: 'Cold',      min: -20,  max: -1 },
  { name: 'Neutral',   min: 0,    max: 14 },
  { name: 'Friendly',  min: 15,   max: 34 },
  { name: 'Friend',    min: 35,   max: 59 },
  { name: 'Trusted',   min: 60,   max: 100 },
];

// Chapter → reputation thresholds (mirrors ProgressionSystem tiers)
const CHAPTER_REP_THRESHOLDS = [
  { chapter: 1, minRep: 21, maxRep: 40 },  // Minor League
  { chapter: 2, minRep: 41, maxRep: 55 },  // Single-A
  { chapter: 3, minRep: 56, maxRep: 70 },  // Double-A
  { chapter: 4, minRep: 71, maxRep: 85 },  // Triple-A
  { chapter: 5, minRep: 86, maxRep: 100 }, // Major League
];

export class StorySystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;

    // Story state (reads from / writes to StateManager)
    // state.storyChapter, state.storyEventsCompleted, state.npcRelationships,
    // state.hanksNotes, state.storyFlags

    // Event queue for pending story events whose triggers are met
    this._storyEventQueue = [];

    // Dialogue / cutscene active flags
    this._dialogueActive = false;
    this._cutsceneActive = false;

    // Cooldown to avoid spamming events
    this._eventCooldown = 0;
    this._eventCooldownDuration = 5; // seconds between story events

    // Track if initial gameStart triggers have been checked
    this._gameStartFired = false;

    // Track NPC for casual chat completion emission
    this._lastChatNpcId = null;

    // Listen to game events that can trigger story beats
    this.eventBus.on('game:newDay', (data) => this._onNewDay(data));
    this.eventBus.on('progression:tierChange', (data) => this._onTierChange(data));
    this.eventBus.on('event:ended', (data) => this._onEventEnded(data));
    this.eventBus.on('inspection:result', (data) => this._onInspectionResult(data));

    // Listen for dialogue/cutscene completion
    this.eventBus.on('story:dialogueComplete', (data) => this._onDialogueComplete(data));
    this.eventBus.on('story:cutsceneComplete', () => { this._cutsceneActive = false; });
    this.eventBus.on('story:choiceMade', (data) => this._onChoiceMade(data));

    // NPC reactions to game events
    this.eventBus.on('inspection:result', (data) => this._showInspectionReaction(data));
    this.eventBus.on('event:started', (data) => this._showEventReaction(data));
    this.eventBus.on('contract:gained', () => this._showNpcReaction('onSponsor', 'gained'));
    this.eventBus.on('contract:lost', () => this._showNpcReaction('onSponsor', 'lost'));

    // Player-initiated casual NPC conversations
    this.eventBus.on('npc:startChat', ({ npcId }) => this._startCasualChat(npcId));

    // Reset story system state after save/load
    this.eventBus.on('state:loaded', () => {
      this._storyEventQueue = [];
      this._dialogueActive = false;
      this._cutsceneActive = false;
      this._eventCooldown = 0;
      // Only suppress gameStart if loading a save with progress;
      // allow it to fire on a fresh new game (day <= 1, no events completed)
      const isFreshGame = (this.state.gameDay ?? 0) <= 1
        && (this.state.storyEventsCompleted ?? []).length === 0;
      this._gameStartFired = !isFreshGame;
    });
  }

  // ── Update Loop ───────────────────────────────────────────────────

  update(dt) {
    if (this.state.paused) return;
    if (!this.state.config.storyEnabled) return;

    // Fire gameStart triggers on first update
    if (!this._gameStartFired) {
      this._gameStartFired = true;
      this._checkStoryTriggers();
    }

    // Cooldown between story events
    if (this._eventCooldown > 0) {
      this._eventCooldown -= dt;
      return;
    }

    // Don't fire events during active dialogue or cutscene
    if (this._dialogueActive || this._cutsceneActive) return;

    // Process queued story events
    if (this._storyEventQueue.length > 0) {
      const next = this._storyEventQueue.shift();
      this._fireStoryEvent(next);
      this._eventCooldown = this._eventCooldownDuration;
    }
  }

  // ── Event Trigger Checking ────────────────────────────────────────

  /**
   * Scan all story events and queue those whose triggers are met.
   * Called on each new day and on tier changes.
   */
  _checkStoryTriggers() {
    for (const evt of STORY_EVENTS) {
      // Skip already completed events
      if (this.state.storyEventsCompleted.includes(evt.id)) continue;

      // Skip already queued events
      if (this._storyEventQueue.some(q => q.id === evt.id)) continue;

      // Check all trigger conditions (data uses singular `trigger` object)
      if (this._triggersMet(evt.trigger)) {
        this._storyEventQueue.push(evt);
      }
    }

    // Sort queue by priority (lower = fires first)
    this._storyEventQueue.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
  }

  /**
   * Check if all conditions in a trigger object are met.
   * Trigger shape from storyData: { type, value, chapter, requireFlags, eventId, extraCondition }
   * Trigger types: gameStart, day, reputation, afterEvent, flag, inspection, repairCount, allNotesFound
   */
  _triggersMet(trigger) {
    if (!trigger) return false;

    // Chapter must match if specified
    if (trigger.chapter != null && this.state.storyChapter !== trigger.chapter) return false;

    // Required flags must all be set
    if (trigger.requireFlags) {
      for (const flag of trigger.requireFlags) {
        if (!this.state.storyFlags[flag]) return false;
      }
    }

    // Check primary trigger type
    switch (trigger.type) {
      case 'gameStart':
        // Fires once at the start of the game
        return this.state.gameDay <= 1;

      case 'day':
        if (this.state.gameDay < trigger.value) return false;
        break;

      case 'reputation':
        if (this.state.reputation < trigger.value) return false;
        break;

      case 'afterEvent':
        if (!this.state.storyEventsCompleted.includes(trigger.eventId)) return false;
        break;

      case 'flag':
        if (trigger.condition && !this.state.storyFlags[trigger.condition]) return false;
        break;

      case 'inspection':
        if (trigger.value === 'gradeA' && !this.state.storyFlags['inspectionGradeA']) return false;
        break;

      case 'repairCount':
        if ((this.state.repairsCompleted ?? 0) < trigger.value) return false;
        break;

      case 'allNotesFound':
        if ((this.state.hanksNotes?.length ?? 0) < 7) return false;
        break;

      case 'chapter':
        // Chapter trigger: fires when the player reaches the specified chapter.
        // Uses trigger.value (not trigger.chapter) for the required chapter number.
        if (this.state.storyChapter < (trigger.value ?? 1)) return false;
        break;

      default:
        return false;
    }

    // Extra condition (for Hank's notes)
    if (trigger.extraCondition && !this.state.storyFlags[trigger.extraCondition]) return false;

    return true;
  }

  // ── Firing Story Events ───────────────────────────────────────────

  _fireStoryEvent(storyEvent) {
    // Mark as completed
    this.state.storyEventsCompleted.push(storyEvent.id);

    // Pause game if event requests it
    if (storyEvent.pauseGame) {
      this.eventBus.emit('game:pause', { source: 'story', eventId: storyEvent.id });
    }

    // Fire based on delivery method (storyData uses `delivery` field).
    // Transform storyData's dialogue format into the shape each UI component expects.
    const dialogueEntries = storyEvent.dialogue ?? [];

    switch (storyEvent.delivery) {
      case 'dialogue': {
        this._dialogueActive = true;

        // Find the first NPC speaker to use as the primary dialogue NPC
        const firstNpc = dialogueEntries.find(d => d.speaker && d.speaker !== 'casey');
        const npcId = firstNpc?.speaker ?? null;
        const npcDef = npcId ? NPC_DATA[npcId] : null;
        const portraitKey = firstNpc?.portrait ?? 'neutral';
        const portraitName = npcDef?.portraits?.[portraitKey] ?? null;

        // DialogueBox expects: { npcId, npcName, themeColor, portrait, lines, choices }
        // lines: array of { text, isNarrator? }
        this.eventBus.emit('story:dialogue', {
          id: storyEvent.id,
          npcId: npcId,
          npcName: npcDef?.name ?? (npcId ? this._npcDisplayName(npcId) : ''),
          themeColor: npcDef?.themeColor ?? '#888888',
          portrait: portraitName,
          lines: dialogueEntries.map(d => ({
            text: d.text,
            isNarrator: !d.speaker || d.speaker === 'casey',
          })),
          choices: storyEvent.choices ?? null,
          pauseGame: storyEvent.pauseGame,
        });
        break;
      }

      case 'cutscene': {
        this._cutsceneActive = true;

        const chapterNum = storyEvent.trigger?.chapter ?? this.state.storyChapter;
        const chapterDef = STORY_CHAPTERS.find(c => c.id === chapterNum);

        // CutsceneRenderer expects: { chapterNum, chapterTitle, slides }
        // slides: [{ text, illustration?, speaker?, themeColor? }]
        this.eventBus.emit('story:cutscene', {
          id: storyEvent.id,
          chapterNum: chapterNum,
          chapterTitle: chapterDef?.name ?? `Chapter ${chapterNum}`,
          slides: dialogueEntries.map(d => {
            const speakerNpc = d.speaker ? NPC_DATA[d.speaker] : null;
            return {
              text: d.text,
              speaker: speakerNpc?.name ?? (d.speaker === 'casey' ? 'Casey' : d.speaker),
              themeColor: speakerNpc?.themeColor ?? null,
            };
          }),
        });
        break;
      }

      case 'notification': {
        // NotificationManager expects: { text, portrait? }
        const firstEntry = dialogueEntries[0];
        const notifNpcId = firstEntry?.speaker ?? null;
        const notifNpcDef = notifNpcId ? NPC_DATA[notifNpcId] : null;
        const notifPortrait = notifNpcDef?.portraits?.[firstEntry?.portrait ?? 'neutral'] ?? null;

        this.eventBus.emit('story:notification', {
          id: storyEvent.id,
          text: firstEntry?.text ?? '',
          portrait: notifPortrait,
        });
        break;
      }

      default:
        break;
    }

    // Apply onComplete actions
    if (storyEvent.onComplete) {
      this._applyOnComplete(storyEvent.onComplete);
    }
  }

  /**
   * Process onComplete actions from a story event.
   */
  _applyOnComplete(actions) {
    for (const action of actions) {
      switch (action.type) {
        case 'flag':
          this.state.storyFlags[action.id] = action.value;
          break;
        case 'relationship':
          this.adjustRelationship(action.npc, action.delta);
          break;
        case 'reputation':
          this.state.adjustReputation(action.delta);
          break;
        case 'money':
          this.state.set('money', this.state.money + (action.delta ?? action.value ?? 0));
          break;
        case 'triggerEvent':
          // Queue another story event by ID
          const nextEvt = STORY_EVENTS.find(e => e.id === action.id);
          if (nextEvt && !this.state.storyEventsCompleted.includes(action.id)) {
            this._storyEventQueue.unshift(nextEvt);
          }
          break;
        case 'startTutorial':
          this.eventBus.emit('story:startTutorial');
          break;
        case 'triggerInspection':
          this.eventBus.emit('story:scriptedEvent', { type: 'inspection', delay: action.delay });
          break;
        case 'triggerWeather':
          this.eventBus.emit('story:scriptedEvent', { type: 'weather', weatherType: action.weatherType, delay: action.delay, duration: action.duration });
          break;
        case 'triggerGameDay':
          this.eventBus.emit('story:scriptedEvent', { type: 'gameDay', gameDayType: action.gameDayType });
          break;
        case 'gameEnd':
          this.eventBus.emit('story:gameEnd', { ending: action.ending });
          break;
        default:
          break;
      }
    }
  }

  // ── Hank's Notes ────────────────────────────────────────────────

  _checkHankNotes() {
    for (const note of HANK_NOTES) {
      if (this.state.hanksNotes.includes(note.id)) continue;
      if (this._triggersMet(note.trigger)) {
        this.state.hanksNotes.push(note.id);
        this.eventBus.emit('story:noteFound', {
          id: note.id,
          title: note.title,
          content: note.content,
          effect: note.effect,
        });
        // Apply note effect
        if (note.effect) {
          switch (note.effect.type) {
            case 'money':
              this.state.set('money', this.state.money + note.effect.value);
              break;
            case 'discount':
              this.state.storyFlags[`discount_${note.effect.target}`] = note.effect.percent;
              break;
            case 'systemWarning':
              this.state.storyFlags[note.effect.bonus] = true;
              break;
            case 'costReduction':
              this.state.storyFlags[`costReduction_${note.effect.target}`] = note.effect.percent;
              break;
            case 'reputation':
              this.state.adjustReputation(note.effect.value);
              break;
            case 'flag':
              this.state.storyFlags[note.effect.id] = true;
              break;
          }
        }
      }
    }
  }

  // ── Story Milestones ──────────────────────────────────────────────

  _checkStoryMilestones() {
    for (const milestone of STORY_MILESTONES) {
      if (this.state.achievements.includes(milestone.id)) continue;
      if (this._milestoneMet(milestone)) {
        this.state.achievements.push(milestone.id);
        this.eventBus.emit('progression:achievement', milestone);
        this.eventBus.emit('ui:message', {
          text: `Achievement: ${milestone.name} — ${milestone.description}`,
          type: 'success',
        });
        // Apply reward
        if (milestone.reward) {
          this._applyOnComplete([milestone.reward]);
        }
      }
    }
  }

  _milestoneMet(milestone) {
    if (!milestone || !milestone.condition) return false;
    switch (milestone.condition) {
      case 'day_gte': return this.state.gameDay >= milestone.value;
      case 'filters_gte': return this.state.filters.length >= milestone.value;
      case 'reputation_gte': return this.state.reputation >= milestone.value;
      case 'inspection_grade': return this.state.lastInspectionGrade === milestone.value;
      case 'flag': return !!this.state.storyFlags[milestone.value];
      case 'flags': return milestone.value.every(f => !!this.state.storyFlags[f]);
      case 'relationship_gte': {
        const rel = this.state.npcRelationships?.[milestone.npcId] ?? 0;
        return rel >= milestone.value;
      }
      case 'events_survived_gte': return (this.state.eventsSurvived ?? 0) >= milestone.value;
      case 'choice_made': return !!this.state.storyFlags?.[milestone.value];
      case 'notes_found_gte': return (this.state.hanksNotes?.length ?? 0) >= milestone.value;
      case 'expansions_gte': return (this.state.expansionsCompleted ?? 0) >= milestone.value;
      case 'season_gte': return (this.state.season ?? 1) >= milestone.value;
      case 'championship_hosted': return !!this.state.championshipHosted;
      default: return false;
    }
  }

  // ── Event Handlers ────────────────────────────────────────────────

  _onNewDay(data) {
    this._checkChapterTransition();
    this._checkStoryTriggers();
    this._checkHankNotes();
    this._checkStoryMilestones();
    this._checkRelationshipBonuses();
    this._tryAmbientDialogue();
  }

  _onTierChange(data) {
    // A tier change may trigger chapter transitions
    this._checkChapterTransition();
    this._checkStoryTriggers();
  }

  _onEventEnded(data) {
    if (!data) return;
    // Check if surviving certain events triggers story progression
    this._checkStoryTriggers();
  }

  _onInspectionResult(data) {
    // Inspection results may trigger NPC reactions and set flags for story triggers
    if (data.grade === 'A') {
      this.state.storyFlags['inspectionGradeA'] = true;
      this.adjustRelationship('bea', 5);
      this.eventBus.emit('story:npcReaction', {
        npcId: 'bea',
        reaction: 'impressed',
        text: 'Inspector Thornton nods with approval.',
      });
    } else if (data.grade === 'D' || data.grade === 'F') {
      this.adjustRelationship('bea', -3);
      this.eventBus.emit('story:npcReaction', {
        npcId: 'bea',
        reaction: 'disappointed',
        text: 'Inspector Thornton shakes her head.',
      });
    }
    this._checkStoryTriggers();
  }

  _onDialogueComplete(data) {
    this._dialogueActive = false;

    // Emit chat complete for casual NPC conversations
    if (this._lastChatNpcId) {
      this.eventBus.emit('npc:chatComplete', { npcId: this._lastChatNpcId });
      this._lastChatNpcId = null;
    }
  }

  _onChoiceMade(data) {
    if (!data) return;

    // Apply choice effects — storyData uses an array of { type, npc, delta, id, value }
    const effects = data.effects;
    if (!effects || !Array.isArray(effects)) return;

    for (const effect of effects) {
      switch (effect.type) {
        case 'relationship':
          this.adjustRelationship(effect.npc, effect.delta);
          break;
        case 'reputation':
          this.state.adjustReputation(effect.delta);
          break;
        case 'money':
          this.state.set('money', this.state.money + (effect.delta ?? effect.value ?? 0));
          break;
        case 'flag':
          this.state.storyFlags[effect.id] = effect.value;
          break;
        default:
          break;
      }
    }
  }

  // ── Chapter Transitions ───────────────────────────────────────────

  _checkChapterTransition() {
    const rep = this.state.reputation;
    let newChapter = 1;

    for (const threshold of CHAPTER_REP_THRESHOLDS) {
      if (rep >= threshold.minRep) {
        newChapter = threshold.chapter;
      }
    }

    if (newChapter !== this.state.storyChapter) {
      const oldChapter = this.state.storyChapter;
      this.state.storyChapter = newChapter;

      this.eventBus.emit('story:chapterChange', {
        from: oldChapter,
        to: newChapter,
      });

      // Queue chapter opening events
      const chapterDef = STORY_CHAPTERS.find(c => c.id === newChapter);
      if (chapterDef?.openingEventId) {
        const openingEvt = STORY_EVENTS.find(e => e.id === chapterDef.openingEventId);
        if (openingEvt && !this.state.storyEventsCompleted.includes(openingEvt.id)) {
          this._storyEventQueue.unshift(openingEvt);
        }
      }
    }
  }

  // ── NPC Relationship Management ───────────────────────────────────

  /**
   * Adjust an NPC's relationship value by delta. Clamped to [-100, 100].
   */
  adjustRelationship(npcId, delta) {
    if (this.state.npcRelationships[npcId] == null) return;

    const oldValue = this.state.npcRelationships[npcId];
    const oldTier = this.getRelationshipTier(npcId);

    this.state.npcRelationships[npcId] = Math.max(-100, Math.min(100,
      this.state.npcRelationships[npcId] + delta
    ));

    const newValue = this.state.npcRelationships[npcId];
    const newTier = this.getRelationshipTier(npcId);
    const tierChanged = oldTier.name !== newTier.name;

    // Emit relationship change event for UI feedback (toasts, celebrations)
    const npcDef = NPC_DATA[npcId];
    const npcTierName = this._getNpcTierName(npcId, newValue);
    this.eventBus.emit('npc:relationshipChange', {
      npcId,
      npcName: npcDef?.name ?? this._npcDisplayName(npcId),
      themeColor: npcDef?.themeColor ?? '#888888',
      delta,
      oldValue,
      newValue,
      oldTier: oldTier.name,
      newTier: npcTierName ?? newTier.name,
      tierChanged,
    });

    if (tierChanged) {
      this.eventBus.emit('story:npcReaction', {
        npcId,
        reaction: delta > 0 ? 'warmer' : 'colder',
        oldTier: oldTier.name,
        newTier: newTier.name,
        text: delta > 0
          ? `${this._npcDisplayName(npcId)} now sees you as ${npcTierName ?? newTier.name.toLowerCase()}.`
          : `${this._npcDisplayName(npcId)} has cooled toward you. Standing: ${npcTierName ?? newTier.name.toLowerCase()}.`,
      });
    }
  }

  /**
   * Get the relationship tier for an NPC.
   */
  getRelationshipTier(npcId) {
    const value = this.state.npcRelationships[npcId] ?? 0;
    for (const tier of RELATIONSHIP_TIERS) {
      if (value >= tier.min && value <= tier.max) {
        return { ...tier, value };
      }
    }
    return { name: 'Neutral', min: 0, max: 14, value };
  }

  /**
   * Check and apply gameplay bonuses from NPC relationship tiers.
   * Uses NPC-specific tier thresholds from NPC_DATA.relationshipTiers.
   */
  checkRelationshipBonuses() {
    const flags = this.state.storyFlags;

    // ── Helper: check if NPC relationship meets a specific tier threshold ──
    const npcRel = (npcId) => this.state.npcRelationships[npcId] ?? 0;
    const npcHasBonus = (npcId, bonusName) => {
      const npc = NPC_DATA[npcId];
      if (!npc?.relationshipTiers) return false;
      const rel = npcRel(npcId);
      // Find the highest tier the player has reached
      const tiers = [...npc.relationshipTiers].sort((a, b) => b.threshold - a.threshold);
      for (const tier of tiers) {
        if (rel >= tier.threshold) {
          return tier.bonuses.includes(bonusName);
        }
      }
      return false;
    };

    // Helper: show one-time bonus activation notification
    const notifyOnce = (flagKey, npcId, text) => {
      if (!flags[flagKey]) {
        flags[flagKey] = true;
        const npc = NPC_DATA[npcId];
        this.eventBus.emit('ui:message', {
          text: `${npc?.name ?? npcId}: ${text}`,
          type: 'success',
          color: npc?.themeColor,
        });
      }
    };

    // ── MAGGIE ──────────────────────────────────────────────────────────

    // budgetVisibility: flag for Economy panel (tier 1, threshold 15)
    if (npcHasBonus('maggie', 'budgetVisibility')) {
      if (!flags.budgetVisibility) {
        flags.budgetVisibility = true;
        notifyOnce('_notified_budgetVisibility', 'maggie',
          '"You\'ve earned my trust. I\'m opening the books to you."');
      }
    }

    // emergencyFunds: one-time $2000 bailout per season when money < 500 (tier 2, threshold 35)
    if (npcHasBonus('maggie', 'emergencyFunds')) {
      if (!flags._notified_emergencyFunds) {
        notifyOnce('_notified_emergencyFunds', 'maggie',
          '"If things ever get tight, I\'ve got your back."');
      }
      if (this.state.money < 500 && flags.maggieEmergencyUsed !== this.state.season) {
        flags.maggieEmergencyUsed = this.state.season;
        this.state.set('money', this.state.money + 2000);
        this.eventBus.emit('ui:message', {
          text: 'Maggie Chen: "I pulled some strings. Here\'s $2,000 to keep things running. Don\'t make me regret it."',
          type: 'success',
        });
      }
    }

    // investmentPartner: 5% contract revenue boost flag (tier 3, threshold 60)
    if (npcHasBonus('maggie', 'investmentPartner')) {
      if (!flags.investmentPartner) {
        flags.investmentPartner = true;
        notifyOnce('_notified_investmentPartner', 'maggie',
          '"I\'m investing in this stadium personally. Better contract terms from my network."');
      }
    }

    // ── RUSTY ───────────────────────────────────────────────────────────

    // repairHints: notify about the filter closest to breaking (tier 1, threshold 10)
    if (npcHasBonus('rusty', 'repairHints')) {
      if (!flags._notified_repairHints) {
        notifyOnce('_notified_repairHints', 'rusty',
          '"I\'ll keep an eye on the gear for ya. I know every rattle in this place."');
      }
      // Find filter closest to breaking (lowest condition ratio, above 0)
      let worstFilter = null;
      let worstRatio = 1;
      for (const filter of this.state.filters) {
        if (filter.condition <= 0 || filter.maxCondition <= 0) continue;
        const ratio = filter.condition / filter.maxCondition;
        if (ratio < worstRatio) {
          worstRatio = ratio;
          worstFilter = filter;
        }
      }
      if (worstFilter && worstRatio < 0.5) {
        const pct = Math.floor(worstRatio * 100);
        this.eventBus.emit('ui:message', {
          text: `Rusty: "Keep an eye on that ${worstFilter.domain} filter in slot ${worstFilter.slotId ?? '?'} -- it's at ${pct}%."`,
          type: 'info',
          color: NPC_DATA.rusty.themeColor,
        });
      }
    }

    // repairSpeedBoost: +10% repair speed (tier 2, threshold 30) — already existed
    if (npcHasBonus('rusty', 'repairSpeedBoost')) {
      this.eventBus.emit('story:bonus', {
        source: 'rusty',
        type: 'repairSpeed',
        multiplier: 1.10,
      });
    }

    // failureWarnings: warn about filters below 20% (tier 3, threshold 55)
    if (npcHasBonus('rusty', 'failureWarnings')) {
      if (!flags._notified_failureWarnings) {
        notifyOnce('_notified_failureWarnings', 'rusty',
          '"I can feel when something\'s about to give. Trust me on this."');
      }
      for (const filter of this.state.filters) {
        if (filter.condition <= 0 || filter.maxCondition <= 0) continue;
        const ratio = filter.condition / filter.maxCondition;
        if (ratio < 0.20 && ratio > 0) {
          this.eventBus.emit('ui:message', {
            text: `Rusty: "DANGER -- ${filter.domain} filter (slot ${filter.slotId ?? '?'}) is about to fail! ${Math.floor(ratio * 100)}% condition."`,
            type: 'danger',
            color: NPC_DATA.rusty.themeColor,
          });
        }
      }
    }

    // ── VICTOR ──────────────────────────────────────────────────────────

    // rivalInsight: flag for RivalSystem to show sabotage target (tier 1, threshold 20)
    if (npcHasBonus('victor', 'rivalInsight')) {
      if (!flags.rivalInsight) {
        flags.rivalInsight = true;
        notifyOnce('_notified_rivalInsight', 'victor',
          '"Maybe I respect you enough to drop a hint now and then."');
      }
    }

    // reducedSabotage: multiplier for RivalSystem to reduce sabotage damage by 30% (tier 2, threshold 40)
    if (npcHasBonus('victor', 'reducedSabotage')) {
      if (!flags.reducedSabotage) {
        flags.reducedSabotage = 0.7; // 30% reduction
        notifyOnce('_notified_reducedSabotage', 'victor',
          '"I\'ll call off the hounds... mostly. Business is business."');
      }
    }

    // ── PRIYA ───────────────────────────────────────────────────────────

    // favorableHeadlines: favorable media coverage (tier 1, threshold 12) — already existed
    if (npcHasBonus('priya', 'favorableHeadlines')) {
      this.eventBus.emit('story:bonus', {
        source: 'priya',
        type: 'mediaBias',
        bias: 'favorable',
      });
    }

    // victorTips: flag for story integration (tier 2, threshold 30)
    if (npcHasBonus('priya', 'victorTips')) {
      if (!flags.victorTips) {
        flags.victorTips = true;
        notifyOnce('_notified_victorTips', 'priya',
          '"I hear things about Victor. I\'ll pass along anything useful."');
      }
    }

    // crisisSpinControl: multiplier for MediaSystem to halve negative headlines (tier 3, threshold 50)
    if (npcHasBonus('priya', 'crisisSpinControl')) {
      if (!flags.crisisSpinControl) {
        flags.crisisSpinControl = 0.5; // halve negative headline count
        notifyOnce('_notified_crisisSpinControl', 'priya',
          '"If things go sideways, I\'ll make sure the coverage stays fair."');
      }
    }

    // ── BEA ─────────────────────────────────────────────────────────────

    // inspectionHints: hint when inspection coming within 2 days (tier 1, threshold 15)
    if (npcHasBonus('bea', 'inspectionHints')) {
      if (!flags._notified_inspectionHints) {
        notifyOnce('_notified_inspectionHints', 'bea',
          '"I can\'t play favorites, but... I might mention when I\'m in the neighborhood."');
      }
      // Check if an inspection is scheduled within 2 days
      const nextInspection = this.state.nextInspectionDay ?? null;
      const day = this.state.gameDay ?? 0;
      if (nextInspection && nextInspection - day <= 2 && nextInspection - day > 0) {
        this.eventBus.emit('ui:message', {
          text: `Bea Thornton: "Just a heads-up -- I'll be doing my rounds in ${nextInspection - day} day${nextInspection - day > 1 ? 's' : ''}. Make sure everything's in order."`,
          type: 'info',
          color: NPC_DATA.bea.themeColor,
        });
      }
    }

    // oneDayWarning: 1-day inspection warning (tier 2, threshold 35) — already existed
    if (npcHasBonus('bea', 'oneDayWarning')) {
      this.eventBus.emit('story:bonus', {
        source: 'bea',
        type: 'inspectionWarning',
        days: 1,
      });
    }

    // victorSchemeReveal: flag for story integration (tier 3, threshold 55)
    if (npcHasBonus('bea', 'victorSchemeReveal')) {
      if (!flags.victorSchemeReveal) {
        flags.victorSchemeReveal = true;
        notifyOnce('_notified_victorSchemeReveal', 'bea',
          '"I\'ve seen some irregularities in Glendale\'s reports. Something doesn\'t add up with Victor."');
      }
    }

    // ── DIEGO ───────────────────────────────────────────────────────────

    // moraleBoost: game day morale boost (tier 1, threshold 10) — already existed
    if (npcHasBonus('diego', 'moraleBoost')) {
      this.eventBus.emit('story:bonus', {
        source: 'diego',
        type: 'moraleBoost',
        value: 0.05,
      });
    }

    // vipIntros: flag for StaffPanel to add 1 extra candidate (tier 2, threshold 25)
    if (npcHasBonus('diego', 'vipIntros')) {
      if (!flags.vipIntros) {
        flags.vipIntros = true;
        notifyOnce('_notified_vipIntros', 'diego',
          '"I know some people looking for work. Good people. I\'ll send \'em your way."');
      }
    }

    // attendanceBoost: +5% base attendance multiplier for EconomySystem (tier 3, threshold 45)
    if (npcHasBonus('diego', 'attendanceBoost')) {
      if (!flags.attendanceBoost) {
        flags.attendanceBoost = 1.05; // +5% attendance
        notifyOnce('_notified_attendanceBoost', 'diego',
          '"Fans come to see me play, and they stay for the stadium. We\'re a team."');
      }
    }

    // ── FIONA ───────────────────────────────────────────────────────────

    // betterTerms: 10% higher contract payouts (tier 1, threshold 15)
    if (npcHasBonus('fiona', 'betterTerms')) {
      if (!flags.betterTerms) {
        flags.betterTerms = 1.10; // 10% higher payouts
        notifyOnce('_notified_betterTerms', 'fiona',
          '"I negotiated better terms with the sponsors. You\'re welcome."');
      }
    }

    // exclusiveContracts: flag for ContractPanel to show 1 extra premium contract (tier 2, threshold 35)
    if (npcHasBonus('fiona', 'exclusiveContracts')) {
      if (!flags.exclusiveContracts) {
        flags.exclusiveContracts = true;
        notifyOnce('_notified_exclusiveContracts', 'fiona',
          '"I pulled in a contact. There\'s an exclusive deal on the table just for us."');
      }
    }

    // emergencySponsorship: one-time $3000 bailout per season when money < 300 (tier 3, threshold 55)
    if (npcHasBonus('fiona', 'emergencySponsorship')) {
      if (!flags._notified_emergencySponsorship) {
        notifyOnce('_notified_emergencySponsorship', 'fiona',
          '"If the budget hits rock bottom, I\'ve got a sponsor who owes me a favor."');
      }
      if (this.state.money < 300 && flags.fionaEmergencyUsed !== this.state.season) {
        flags.fionaEmergencyUsed = this.state.season;
        this.state.set('money', this.state.money + 3000);
        this.eventBus.emit('ui:message', {
          text: 'Fiona Park: "I called in that favor. $3,000 emergency sponsorship -- use it wisely."',
          type: 'success',
        });
      }
    }
  }

  _checkRelationshipBonuses() {
    this.checkRelationshipBonuses();
  }

  // ── NPC Reactions ────────────────────────────────────────────────

  /**
   * Show a random NPC reaction line for a given event type and sub-type.
   * Only shows reactions from NPCs the player has met (relationship > 0).
   */
  _showNpcReaction(eventType, subType) {
    const reactionGroup = NPC_REACTIONS[eventType]?.[subType];
    if (!reactionGroup) return;

    // Filter to NPCs the player has met
    const eligible = Object.entries(reactionGroup).filter(([npcId]) => {
      return (this.state.npcRelationships[npcId] ?? 0) > 0;
    });
    if (eligible.length === 0) return;

    // Pick a random NPC from eligible
    const [npcId, line] = eligible[Math.floor(Math.random() * eligible.length)];
    const npc = NPC_DATA[npcId];
    if (!npc) return;

    this.eventBus.emit('ui:message', {
      text: `${npc.name}: "${line}"`,
      type: 'info',
      color: npc.themeColor,
    });
  }

  /**
   * Map inspection grades to NPC_REACTIONS sub-types and show a reaction.
   */
  _showInspectionReaction(data) {
    if (!data?.grade) return;
    const gradeMap = { A: 'gradeA', B: 'gradeB', D: 'gradeD', F: 'gradeF' };
    const subType = gradeMap[data.grade];
    if (subType) {
      this._showNpcReaction('onInspection', subType);
    }
  }

  /**
   * Map started events to NPC_REACTIONS weather/emergency sub-types.
   */
  _showEventReaction(data) {
    if (!data) return;
    // Weather reactions
    if (data.category === 'weather') {
      const name = (data.name ?? '').toLowerCase();
      if (name.includes('storm') || name.includes('rain')) {
        this._showNpcReaction('onWeather', 'storm');
      } else if (name.includes('heat')) {
        this._showNpcReaction('onWeather', 'heatwave');
      }
    }
    // Emergency reactions
    if (data.category === 'random' && !data.isPositive) {
      const name = (data.name ?? '').toLowerCase();
      if (name.includes('pipe burst')) {
        this._showNpcReaction('onEmergency', 'pipeBurst');
      } else if (name.includes('power')) {
        this._showNpcReaction('onEmergency', 'powerOutage');
      } else if (name.includes('sewage')) {
        this._showNpcReaction('onEmergency', 'sewageBackup');
      }
    }
  }

  // ── Ambient Dialogue ───────────────────────────────────────────────

  /**
   * Show ambient NPC dialogue on new day. ~30% chance per day, only for met NPCs.
   */
  _tryAmbientDialogue() {
    if (Math.random() > 0.35) return; // ~35% chance per day

    // Pick a context based on game state
    const context = this._getAmbientContext();

    // Gather eligible NPCs that have lines for this context
    // Most NPCs require relationship > 0; Victor is eligible if chapter >= 2
    const eligible = [];
    for (const [npcId, dialogueSet] of Object.entries(NPC_AMBIENT_DIALOGUE)) {
      const rel = this.state.npcRelationships[npcId] ?? 0;
      if (npcId === 'victor') {
        if ((this.state.storyChapter ?? 1) < 2) continue;
      } else {
        if (rel <= 0) continue;
      }
      const lines = dialogueSet[context] ?? dialogueSet.general;
      if (lines && lines.length > 0) {
        eligible.push({ npcId, lines });
      }
    }
    if (eligible.length === 0) return;

    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    const line = pick.lines[Math.floor(Math.random() * pick.lines.length)];
    const npc = NPC_DATA[pick.npcId];
    if (!npc) return;

    this.eventBus.emit('npc:ambientDialogue', { npcId: pick.npcId, line });
    this.eventBus.emit('ui:message', {
      text: `${npc.name}: "${line}"`,
      type: 'info',
      color: npc.themeColor,
    });
  }

  /**
   * Determine ambient dialogue context based on current game state.
   */
  _getAmbientContext() {
    const health = this.state.domainHealth ?? {};
    const minHealth = Math.min(
      health.air ?? 100, health.water ?? 100,
      health.hvac ?? 100, health.drainage ?? 100
    );
    if (minHealth < 50) return 'systemBad';

    if (this.state.activeEvent?.category === 'weather') return 'weather';

    const dayType = this.state.currentGameDayType ?? '';
    if (dayType !== 'weekdayRegular') return 'gameDay';

    // Rival standing comparison for Victor-flavored contexts
    const playerRep = this.state.reputation ?? 0;
    const rivalRep = this.state.rivalReputation ?? 0;
    if (playerRep > rivalRep + 10) return 'playerWinning';
    if (playerRep < rivalRep - 10) return 'playerLosing';

    if (minHealth > 75) return 'systemGood';
    return 'general';
  }

  // ── Staff Mentions ──────────────────────────────────────────────

  /**
   * 20% chance to prepend a staff-mention line to a casual dialogue.
   * Each NPC has a template referencing a random staff member's trait.
   */
  _maybeAddStaffMention(npcId, dialogue) {
    if (Math.random() > 0.20) return dialogue;

    const staffList = this.state.staffList ?? [];
    if (staffList.length === 0) return dialogue;

    const staff = staffList[Math.floor(Math.random() * staffList.length)];
    const name = staff.name?.split(' ')[0] ?? 'someone';
    const trait = staff.trait ?? '';

    const traitComment = this._getTraitComment(trait);
    if (!traitComment) return dialogue;

    const templates = {
      maggie: `I saw ${name} in the halls. ${traitComment}`,
      rusty: `${name}'s been doing good work. ${traitComment}`,
      diego: `Hey, ${name} fixed something in the dugout! ${traitComment}`,
      priya: `I was chatting with ${name} for a story. ${traitComment}`,
      bea: `I noted ${name} during my rounds. ${traitComment}`,
      fiona: `${name} came up in the sponsor tour. ${traitComment}`,
    };

    const mentionText = templates[npcId];
    if (!mentionText) return dialogue;

    // Prepend the staff mention as the first line
    const mentionLine = { speaker: npcId, portrait: dialogue.portrait ?? 'neutral', text: mentionText };
    return {
      ...dialogue,
      lines: [mentionLine, ...dialogue.lines],
    };
  }

  /**
   * Map a staff trait name to a short NPC-appropriate comment.
   */
  _getTraitComment(trait) {
    const comments = {
      'Whistler': 'Always whistling. I can hear it from two rooms away.',
      'Early Bird': 'In before dawn every single day. Impressive.',
      'Night Owl': 'Does their best work at midnight, apparently.',
      'Duct Tape Devotee': 'Duct tape on everything. Rusty would approve.',
      'Tool Hoarder': 'Three wrenches for every job. "Just in case," they say.',
      'Superstitious': 'Won\'t touch filter thirteen. Refuses to explain why.',
      'Former Chef': 'Treats the pipes like a kitchen line. Oddly effective.',
      'Podcast Addict': 'Always has an earbud in. True crime, I think.',
      'Ex-Navy': 'Submarine background. Tight spaces don\'t faze them.',
      'Cat Person': 'Showed me cat photos for ten minutes. I didn\'t stop them.',
      'Baseball Nerd': 'Knows every Raptors stat since \'87. Good for morale.',
      'Perfectionist': 'Triple-checks everything. Slow, but the work holds.',
      'Speed Demon': 'Fastest hands on the crew. Quality varies.',
      'Old School': 'No power tools, no complaints. Gets it done.',
      'YouTube Grad': 'Self-taught from videos. Surprisingly effective.',
      'Snack Stasher': 'Has snacks hidden in every zone. The crew loves it.',
      'Dad Joker': 'The puns are terrible. Morale is somehow up.',
      'Quiet Type': 'Barely says a word, but everyone respects them.',
      'Overachiever': 'Volunteers for every shift. Hope they don\'t burn out.',
      'Lucky': 'Things just work out for them. Can\'t explain it.',
    };
    return comments[trait] ?? null;
  }

  // ── Helpers ───────────────────────────────────────────────────────

  _npcDisplayName(npcId) {
    const npc = NPC_DATA[npcId];
    return npc?.name ?? npcId.charAt(0).toUpperCase() + npcId.slice(1);
  }

  /**
   * Get the NPC-specific relationship tier name from storyData.
   * Falls back to null if no NPC-specific tiers are defined.
   */
  _getNpcTierName(npcId, value) {
    const npc = NPC_DATA[npcId];
    if (!npc?.relationshipTiers) return null;
    // Walk tiers in reverse to find the highest matching threshold
    const tiers = [...npc.relationshipTiers].sort((a, b) => b.threshold - a.threshold);
    for (const tier of tiers) {
      if (value >= tier.threshold) return tier.name;
    }
    return npc.relationshipTiers[0]?.name ?? null;
  }

  // ── Public Getters ────────────────────────────────────────────────

  get currentChapter() {
    return this.state.storyChapter;
  }

  get dialogueActive() {
    return this._dialogueActive;
  }

  get cutsceneActive() {
    return this._cutsceneActive;
  }

  get storyEventQueue() {
    return [...this._storyEventQueue];
  }

  // ── Casual NPC Conversations ──────────────────────────────────

  /**
   * Start a player-initiated casual conversation with an NPC.
   */
  _startCasualChat(npcId) {
    // Don't interrupt active dialogue or cutscene
    if (this._dialogueActive || this._cutsceneActive) return;

    const npc = NPC_DATA[npcId];
    if (!npc) return;

    // Check cooldown: once per game day per NPC
    // Victor bypasses the "already spoke" notification for system-initiated encounters
    const isVictor = npcId === 'victor';
    if (this.state.npcLastChat[npcId] === this.state.gameDay) {
      if (isVictor) {
        // Victor already had a dialogue today -- silently skip
        return;
      }
      this.eventBus.emit('ui:message', {
        text: `You already spoke with ${npc.name} today.`,
        type: 'info',
      });
      return;
    }

    // Get contextual dialogue
    let dialogue = this._pickCasualDialogue(npcId);
    if (!dialogue) {
      this.eventBus.emit('ui:message', {
        text: `${npc.name} is busy right now.`,
        type: 'info',
      });
      return;
    }

    // Maybe prepend a staff mention (20% chance)
    dialogue = this._maybeAddStaffMention(npcId, dialogue);

    // Record cooldown
    this.state.npcLastChat[npcId] = this.state.gameDay;

    // Track which NPC we're chatting with for chatComplete emission
    this._lastChatNpcId = npcId;

    // Format and emit dialogue for DialogueBox
    this._dialogueActive = true;
    this.eventBus.emit('game:pause');

    // Resolve portrait mood names to full sprite keys (e.g. 'neutral' → 'portrait_maggie_neutral')
    const defaultMood = dialogue.portrait ?? 'neutral';
    const resolvePortrait = (mood) => npc.portraits?.[mood] ?? `portrait_${npcId}_${mood}`;

    this.eventBus.emit('story:dialogue', {
      eventId: dialogue.id,
      npcId: npcId,
      npcName: npc.name,
      themeColor: npc.themeColor,
      portrait: resolvePortrait(defaultMood),
      lines: dialogue.lines.map(line => ({
        speaker: line.speaker,
        portrait: resolvePortrait(line.portrait ?? defaultMood),
        text: line.text,
        isNarrator: !line.speaker,
      })),
      choices: dialogue.choices ?? null,
    });
  }

  /**
   * Pick an appropriate casual dialogue entry for the NPC
   * based on relationship level and current game context.
   */
  _pickCasualDialogue(npcId) {
    const pool = NPC_CASUAL_DIALOGUE[npcId];
    if (!pool || pool.length === 0) return null;

    const rel = this.state.npcRelationships[npcId] ?? 0;
    const context = this._detectChatContext();

    // Filter to eligible entries
    const eligible = pool.filter(entry => {
      if (rel < (entry.minRelationship ?? 0)) return false;
      if (entry.context !== 'any' && entry.context !== 'normal' && entry.context !== context) return false;
      // Prefer context-specific lines when context matches
      return true;
    });

    if (eligible.length === 0) return null;

    // Prefer context-specific lines over generic 'normal'/'any'
    const contextSpecific = eligible.filter(e => e.context === context && e.context !== 'normal');
    const pickFrom = contextSpecific.length > 0 ? contextSpecific : eligible;

    // Random pick
    return pickFrom[Math.floor(Math.random() * pickFrom.length)];
  }

  /**
   * Detect current game context for dialogue selection.
   */
  _detectChatContext() {
    const health = this.state.domainHealth ?? {};
    const minHealth = Math.min(
      health.air ?? 100, health.water ?? 100,
      health.hvac ?? 100, health.drainage ?? 100
    );
    if (minHealth < 30) return 'crisis';

    if (this.state.reputation > 70 || (this.state.goodDayStreak ?? 0) > 5) return 'winning';
    if (this.state.reputation < 20) return 'losing';

    // Check if it's a game day type
    const dayType = this.state.currentGameDayType ?? '';
    if (dayType.includes('game') || dayType.includes('Game')) return 'gameday';

    return 'normal';
  }
}
