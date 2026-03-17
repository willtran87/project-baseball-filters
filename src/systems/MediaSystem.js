/**
 * MediaSystem -- Generates newspaper headlines based on game events.
 *
 * After game:newDay and major events, produces a headline using a
 * template system. Sentiment (positive/negative/neutral) depends on
 * current performance. Priya's relationship level can amplify positive
 * headlines with a bonus reputation effect.
 *
 * Stores the last 20 headlines in state.mediaHeadlines.
 */

import {
  POSITIVE_HEADLINES as POSITIVE_TEMPLATES,
  NEGATIVE_HEADLINES as NEGATIVE_TEMPLATES,
  NEUTRAL_HEADLINES as NEUTRAL_TEMPLATES,
  RIVAL_POSITIVE_HEADLINES as RIVAL_POSITIVE,
  RIVAL_NEGATIVE_HEADLINES as RIVAL_NEGATIVE,
  EVENTS_POSITIVE,
  EVENTS_NEGATIVE,
  EVENTS_NEUTRAL,
  SYSTEM_NAMES,
  CONDITIONS_NEGATIVE,
} from '../data/mediaData.js';

export class MediaSystem {
  constructor(state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;
    this._lastQuality = 0.5;
    this._pendingEventName = null;

    this.eventBus.on('game:newDay', () => this._generateDailyHeadline());
    this.eventBus.on('filtration:quality', (data) => {
      this._lastQuality = data.avgEfficiency;
    });

    // Listen for Priya relationship bonus (favorable media coverage)
    this._mediaBias = null;
    this.eventBus.on('story:bonus', (data) => {
      if (data.type === 'mediaBias') {
        this._mediaBias = data.bias ?? null;
      }
    });

    // Capture major events for headline flavor
    this.eventBus.on('event:started', (data) => {
      this._pendingEventName = data?.name ?? null;
      // Generate specific headlines for dramatic events
      if (data?.name === 'Sewage Backup') {
        this._generateEventHeadline('sewage', data);
      } else if (data?.name === 'Pipe Burst') {
        this._generateEventHeadline('pipeBurst', data);
      } else if (data?.name === 'VIP Visit') {
        this._generateEventHeadline('vipVisit', data);
      }
    });
    this.eventBus.on('inspection:result', (data) => {
      this._generateEventHeadline('inspection', data);
    });
    this.eventBus.on('progression:tierChange', (data) => {
      this._generateEventHeadline('tierChange', data);
    });
    this.eventBus.on('rival:seasonAward', (data) => {
      this._generateEventHeadline('seasonAward', data);
    });
    this.eventBus.on('rival:standings', (data) => {
      this._generateEventHeadline('rivalStandings', data);
    });
    this.eventBus.on('staff:quit', (data) => {
      this._generateEventHeadline('staffQuit', data);
    });
    this.eventBus.on('staff:levelUp', (data) => {
      this._generateEventHeadline('staffLevelUp', data);
    });
    this.eventBus.on('expansion:purchased', (data) => {
      this._generateEventHeadline('expansion', data);
    });
    this.eventBus.on('research:complete', (data) => {
      this._generateEventHeadline('research', data);
    });
    this.eventBus.on('event:pipeFreeze', (data) => {
      this._generateEventHeadline('pipeFreeze', data);
    });
    this.eventBus.on('loan:taken', (data) => {
      this._generateEventHeadline('loanTaken', data);
    });
    this.eventBus.on('season:started', (data) => {
      this._generateEventHeadline('seasonStart', data);
    });
  }

  update(dt) {
    // Media is event-driven, no per-tick logic needed
  }

  // -- Headline generation ---------------------------------------------

  _generateDailyHeadline() {
    const quality = this._lastQuality;
    const rep = this.state.reputation;
    let sentiment, templates, eventPool;

    if (quality >= 0.7 && rep >= 50) {
      sentiment = 'positive';
      templates = POSITIVE_TEMPLATES;
      eventPool = EVENTS_POSITIVE;
    } else if (quality < 0.4 || rep < 30) {
      sentiment = 'negative';
      templates = NEGATIVE_TEMPLATES;
      eventPool = EVENTS_NEGATIVE;
    } else {
      sentiment = 'neutral';
      templates = NEUTRAL_TEMPLATES;
      eventPool = EVENTS_NEUTRAL;
    }

    // Priya relationship bonus: favorable bias shifts neutral → positive
    if (this._mediaBias === 'favorable' && sentiment === 'neutral') {
      sentiment = 'positive';
      templates = POSITIVE_TEMPLATES;
      eventPool = EVENTS_POSITIVE;
    }

    // Priya crisisSpinControl bonus: 50% chance to suppress negative headlines during crises
    const spinControl = this.state.storyFlags?.crisisSpinControl ?? 1.0;
    if (sentiment === 'negative' && spinControl < 1.0 && Math.random() < spinControl) {
      sentiment = 'neutral';
      templates = NEUTRAL_TEMPLATES;
      eventPool = EVENTS_NEUTRAL;
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    const event = this._pendingEventName
      ?? eventPool[Math.floor(Math.random() * eventPool.length)];
    this._pendingEventName = null;

    // --- Headline streak momentum ---
    const prevSentiment = this._lastHeadlineSentiment ?? null;
    this._lastHeadlineSentiment = sentiment;

    const streak = this.state.headlineStreak ?? 0;
    if (prevSentiment === sentiment && sentiment !== 'neutral') {
      this.state.set('headlineStreak', Math.min(streak + 1, 5));
    } else {
      this.state.set('headlineStreak', sentiment === 'neutral' ? 0 : 1);
    }

    let repEffect = this._calculateRepEffect(sentiment);

    // Momentum bonus: 3+ streak amplifies rep effect
    const currentStreak = this.state.headlineStreak ?? 0;
    if (currentStreak >= 3 && sentiment === 'positive') {
      repEffect = 2; // momentum: +2 instead of +1
    } else if (currentStreak >= 3 && sentiment === 'negative') {
      repEffect = -2; // spiral: -2 instead of -1
    }

    // NPC-tied exclusive: Priya relationship ≥ 30, 20% chance
    const priyaRel = this.state.npcRelationships?.priya ?? 0;
    const lastChat = this.state.lastNpcChat;
    if (priyaRel >= 30 && lastChat && Math.random() < 0.2) {
      const npcName = lastChat.charAt(0).toUpperCase() + lastChat.slice(1);
      const exclusiveText = `Ridgemont Insider: Priya Okafor Reports on ${npcName} — "There's a Story Behind the Scenes"`;
      this._publishHeadline(exclusiveText, sentiment, repEffect);
      return;
    }

    const text = this._fillTemplate(template, event);
    this._publishHeadline(text, sentiment, repEffect);
  }

  _generateEventHeadline(type, data) {
    let text, sentiment, repEffect;

    switch (type) {
      case 'inspection': {
        const grade = data?.grade ?? 'C';
        if (grade === 'A' || grade === 'B') {
          sentiment = 'positive';
          text = `${this._stadiumName()} Earns Grade ${grade} on Health Inspection`;
        } else if (grade === 'D' || grade === 'F') {
          sentiment = 'negative';
          text = `${this._stadiumName()} Receives Failing Grade ${grade} From Inspectors`;
        } else {
          sentiment = 'neutral';
          text = `${this._stadiumName()} Passes Inspection With Grade ${grade}`;
        }
        break;
      }
      case 'tierChange': {
        const promoted = data?.promoted;
        const tierName = data?.to?.name ?? 'Unknown';
        if (promoted) {
          sentiment = 'positive';
          text = `Breaking: ${this._stadiumName()} Promoted to ${tierName}!`;
        } else {
          sentiment = 'negative';
          text = `${this._stadiumName()} Demoted to ${tierName} After Poor Performance`;
        }
        break;
      }
      case 'seasonAward': {
        const winner = data?.winner;
        if (winner === 'player') {
          sentiment = 'positive';
          const posOpts = [
            `${this._stadiumName()} Takes Season ${data.season} Stadium of the Year Award`,
            `CHAMPIONS! ${this._stadiumName()} Crowned Best Facility, Season ${data.season}`,
            `Victor Salazar "Devastated" as ${this._stadiumName()} Wins Stadium of the Year`,
            `Maggie Peralta Accepts Award: "This One's for Hank"`,
          ];
          text = posOpts[Math.floor(Math.random() * posOpts.length)];
        } else {
          sentiment = 'negative';
          const negOpts = [
            `Glendale Grizzlies Claim Stadium of the Year Over ${this._stadiumName()}`,
            `Victor Salazar Gloats After Winning Stadium of the Year: "Expected Result"`,
            `${this._stadiumName()} Loses Award to Glendale. Maggie Seen Leaving Ceremony Early.`,
          ];
          text = negOpts[Math.floor(Math.random() * negOpts.length)];
        }
        break;
      }
      case 'rivalStandings': {
        if (!data) return;
        const { playerLeading, gap } = data;
        if (gap < 5) return; // Not newsworthy if close
        if (playerLeading) {
          sentiment = 'positive';
          text = RIVAL_POSITIVE[Math.floor(Math.random() * RIVAL_POSITIVE.length)]
            .replace('{stadium}', this._stadiumName());
        } else {
          sentiment = 'negative';
          text = RIVAL_NEGATIVE[Math.floor(Math.random() * RIVAL_NEGATIVE.length)]
            .replace('{stadium}', this._stadiumName());
        }
        break;
      }
      case 'sewage': {
        sentiment = 'negative';
        const sewageOpts = [
          `BREAKING: Sewage Backup at ${this._stadiumName()} -- "The Browntide Returns?"`,
          `Fans Flee as ${this._stadiumName()} Plumbing Fails Spectacularly`,
          `"I Can Still Smell It" -- ${this._stadiumName()} Sewage Incident Goes Viral`,
          `${this._stadiumName()} Sewage Crisis: Health Department Monitoring Situation`,
        ];
        text = sewageOpts[Math.floor(Math.random() * sewageOpts.length)];
        break;
      }
      case 'pipeBurst': {
        sentiment = 'negative';
        const pipeOpts = [
          `Water Main Break Floods ${this._stadiumName()} Concourse`,
          `"It's Raining Inside!" -- Pipe Burst Disrupts ${this._stadiumName()} Game Day`,
          `${this._stadiumName()} Pipe Failure: Fans Offered Rain Ponchos Indoors`,
        ];
        text = pipeOpts[Math.floor(Math.random() * pipeOpts.length)];
        break;
      }
      case 'vipVisit': {
        sentiment = 'neutral';
        const vipOpts = [
          `VIP Spotted at ${this._stadiumName()}: "All Eyes on the Luxury Suites"`,
          `League Officials Visiting ${this._stadiumName()} for Facility Review`,
          `Celebrity Sighting at ${this._stadiumName()} -- Staff on High Alert`,
        ];
        text = vipOpts[Math.floor(Math.random() * vipOpts.length)];
        break;
      }
      case 'staffQuit': {
        sentiment = 'negative';
        const name = data?.name ?? 'Employee';
        const quitOpts = [
          `${this._stadiumName()} Loses Key Worker: ${name} Walks Off the Job`,
          `"I've Had Enough" -- ${name} Quits ${this._stadiumName()} Maintenance Crew`,
          `Staffing Crisis at ${this._stadiumName()} as ${name} Departs`,
        ];
        text = quitOpts[Math.floor(Math.random() * quitOpts.length)];
        break;
      }
      case 'staffLevelUp': {
        if (Math.random() > 0.3) return; // Only sometimes newsworthy
        sentiment = 'positive';
        const staffName = data?.staff?.name ?? 'Staff Member';
        const level = data?.staff?.level ?? 2;
        text = `${this._stadiumName()} Crew Member ${staffName} Promoted to Level ${level}`;
        break;
      }
      case 'expansion': {
        sentiment = 'positive';
        const expName = data?.expansion?.name ?? 'New Wing';
        const expOpts = [
          `Stadium Expansion Brings New Amenities to ${this._stadiumName()}: "${expName}"`,
          `${this._stadiumName()} Grows! ${expName} Opens to Rave Reviews`,
          `Fans Celebrate as ${this._stadiumName()} Unveils ${expName}`,
        ];
        text = expOpts[Math.floor(Math.random() * expOpts.length)];
        break;
      }
      case 'research': {
        if (Math.random() > 0.4) return; // Only sometimes newsworthy
        sentiment = 'positive';
        const nodeName = data?.name ?? 'System Upgrade';
        text = `${this._stadiumName()} Completes ${nodeName} Research — "A Step Into the Future"`;
        break;
      }
      case 'pipeFreeze': {
        sentiment = 'negative';
        const count = data?.affectedCount ?? 0;
        const freezeOpts = [
          `Pipe Freeze Damages ${this._stadiumName()} Water Systems During Cold Snap`,
          `Cold Snap Hits ${this._stadiumName()}: ${count > 0 ? count + ' Filters' : 'Equipment'} Affected by Pipe Freeze`,
          `"It's an Ice Rink Down There" — ${this._stadiumName()} Underground Hit by Freezing Temps`,
        ];
        text = freezeOpts[Math.floor(Math.random() * freezeOpts.length)];
        break;
      }
      case 'loanTaken': {
        if (Math.random() > 0.5) return; // Only sometimes newsworthy
        sentiment = 'neutral';
        text = `New Loan Program Helps ${this._stadiumName()} Weather Financial Storms`;
        break;
      }
      case 'seasonStart': {
        sentiment = 'positive';
        const season = data?.season ?? 1;
        const seasonOpts = [
          `Opening Day Festivities Kick Off Season ${season} at ${this._stadiumName()}`,
          `"Play Ball!" ${this._stadiumName()} Opens Season ${season} With High Hopes`,
          `Season ${season} Begins: ${this._stadiumName()} Ready for First Pitch`,
        ];
        text = seasonOpts[Math.floor(Math.random() * seasonOpts.length)];
        break;
      }
      default:
        return;
    }

    repEffect = this._calculateRepEffect(sentiment);
    this._publishHeadline(text, sentiment, repEffect);
  }

  _publishHeadline(text, sentiment, repEffect) {
    // Priya relationship bonus: Friend (35+) or higher boosts positive headlines
    const priyaRel = this.state.npcRelationships?.priya ?? 0;
    if (sentiment === 'positive' && priyaRel >= 35) {
      repEffect += 1;
    }

    const headline = {
      text,
      sentiment,
      repEffect,
      day: this.state.gameDay,
    };

    // Store in state (keep last 20)
    const headlines = [...(this.state.mediaHeadlines ?? [])];
    headlines.unshift(headline);
    if (headlines.length > 20) headlines.length = 20;
    this.state.set('mediaHeadlines', headlines);

    // Apply rep effect
    if (repEffect !== 0) {
      this.state.adjustReputation(repEffect);
    }

    this.eventBus.emit('media:headline', headline);
  }

  // -- Helpers ----------------------------------------------------------

  _fillTemplate(template, event) {
    const stadium = this._stadiumName();
    const system = SYSTEM_NAMES[Math.floor(Math.random() * SYSTEM_NAMES.length)];
    const condition = CONDITIONS_NEGATIVE[Math.floor(Math.random() * CONDITIONS_NEGATIVE.length)];

    return template
      .replace('{stadium}', stadium)
      .replace('{event}', event)
      .replace('{system}', system)
      .replace('{condition}', condition);
  }

  _stadiumName() {
    return 'Ridgemont Stadium';
  }

  _calculateRepEffect(sentiment) {
    switch (sentiment) {
      case 'positive': return 1;
      case 'negative': return -1;
      case 'neutral': return 0;
      default: return 0;
    }
  }
}
