/**
 * AchievementPanel -- Displays all milestones/achievements grouped by story chapter.
 *
 * Toggle via `ui:toggleAchievements` event.
 * Standalone overlay panel (same pattern as StatsPanel, ObjectivesPanel).
 *
 * Shows:
 *   - Completion percentage header
 *   - Achievements grouped by chapter (1-5)
 *   - Unlocked: gold highlight with name, description, unlock day
 *   - Locked: grayed out with hint text
 *   - Post-win sandbox goals (if game has been won)
 */

import { STORY_MILESTONES } from '../data/storyData.js';

// Chapter groupings for milestones (by index ranges in STORY_MILESTONES)
const CHAPTER_INFO = [
  { chapter: 1, name: 'New Kid on the Field', color: '#29adff' },
  { chapter: 2, name: 'Rising Through the Ranks', color: '#00e436' },
  { chapter: 3, name: 'Storm Warning', color: '#ffa300' },
  { chapter: 4, name: 'Into the Fire', color: '#ff004d' },
  { chapter: 5, name: 'Championship', color: '#ffec27' },
];

// Map milestone IDs to their chapter
const MILESTONE_CHAPTERS = {};
// Ch1: first 5, Ch2: next 4, Ch3: next 6, Ch4: next 4, Ch5: last 3
const CHAPTER_SIZES = [5, 4, 6, 4, 3];
let offset = 0;
for (let c = 0; c < CHAPTER_SIZES.length; c++) {
  for (let i = 0; i < CHAPTER_SIZES[c]; i++) {
    if (offset + i < STORY_MILESTONES.length) {
      MILESTONE_CHAPTERS[STORY_MILESTONES[offset + i].id] = c + 1;
    }
  }
  offset += CHAPTER_SIZES[c];
}

// Hint text for locked achievements (condition-based)
function _getHintText(milestone) {
  switch (milestone.condition) {
    case 'filters_gte': return `Install ${milestone.value} filter${milestone.value > 1 ? 's' : ''}`;
    case 'day_gte': return `Reach game day ${milestone.value}`;
    case 'reputation_gte': return `Reach ${milestone.value}% reputation`;
    case 'relationship_gte': return `Build relationship with an NPC`;
    case 'inspection_grade': return `Earn a grade ${milestone.value} inspection`;
    case 'events_survived_gte': return `Survive ${milestone.value} events`;
    case 'season_gte': return `Complete ${milestone.value - 1} full season${milestone.value > 2 ? 's' : ''}`;
    case 'expansions_gte': return `Purchase ${milestone.value} expansion${milestone.value > 1 ? 's' : ''}`;
    case 'notes_found_gte': return `Find ${milestone.value} of Hank's notes`;
    case 'choice_made': return 'Make a key story choice';
    case 'championship_hosted': return 'Host the championship game';
    default: return 'Keep playing to discover';
  }
}

export class AchievementPanel {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this._el = null;
    this._visible = false;

    this.eventBus.on('ui:toggleAchievements', () => this.toggle());
    this.eventBus.on('ui:closeAchievements', () => this.hide());
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._visible) {
        this.hide();
        if (result) result.closed = true;
      }
    });

    // Auto-refresh on achievement unlock
    this.eventBus.on('progression:achievement', () => { if (this._visible) this._render(); });
    this.eventBus.on('game:newDay', () => { if (this._visible) this._render(); });
  }

  toggle() {
    if (this._visible) this.hide(); else this.show();
  }

  show() {
    this.eventBus.emit('ui:closeAllPanels');
    this.hide();
    this._visible = true;
    this._el = document.createElement('div');
    this._el.id = 'achievement-panel';
    this._el.style.cssText = `
      position: absolute; top: 24px; left: 8%; right: 8%; bottom: 24px;
      background: linear-gradient(180deg, rgba(15,10,5,0.97), rgba(8,8,24,0.97));
      border: 2px solid #8b4513;
      border-radius: 4px;
      font-family: monospace; color: #e0e0e0;
      font-size: 11px; z-index: 30;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(139,69,19,0.2);
    `;
    this._render();
    this.container.appendChild(this._el);
  }

  hide() {
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
    this._visible = false;
  }

  _render() {
    if (!this._el) return;
    const s = this.state;
    const unlocked = s.achievements ?? [];
    const total = STORY_MILESTONES.length;
    const count = unlocked.length;
    const pct = total > 0 ? Math.floor((count / total) * 100) : 0;

    // Header
    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:2px solid #8b4513;background:rgba(139,69,19,0.08)">
        <span style="color:#ffec27;font-size:13px;letter-spacing:2px">ACHIEVEMENT GALLERY</span>
        <span data-action="close" style="cursor:pointer;color:#888;font-size:12px;padding:0 4px" title="Close">&#10005;</span>
      </div>
    `;

    html += `<div style="flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#8b4513 #111;padding:8px 12px;">`;

    // Completion bar
    const barColor = pct >= 80 ? '#00e436' : pct >= 50 ? '#ffec27' : '#29adff';
    html += `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="color:#c0c0d0;font-size:10px">${count} / ${total} Achievements</span>
          <span style="color:${barColor};font-size:10px">${pct}%</span>
        </div>
        <div style="height:8px;background:#222;border:1px solid #444;border-radius:2px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${barColor};transition:width 0.3s"></div>
        </div>
      </div>
    `;

    // Group milestones by chapter
    for (const chInfo of CHAPTER_INFO) {
      const chapterMilestones = STORY_MILESTONES.filter(m => (MILESTONE_CHAPTERS[m.id] ?? 1) === chInfo.chapter);
      if (chapterMilestones.length === 0) continue;

      const chUnlocked = chapterMilestones.filter(m => unlocked.includes(m.id)).length;

      html += `
        <div style="margin-bottom:10px;">
          <div style="color:${chInfo.color};font-size:10px;letter-spacing:1px;margin-bottom:4px;padding-bottom:3px;border-bottom:1px solid ${chInfo.color}44;display:flex;justify-content:space-between">
            <span>CH${chInfo.chapter}: ${chInfo.name.toUpperCase()}</span>
            <span style="color:#888;font-size:9px">${chUnlocked}/${chapterMilestones.length}</span>
          </div>
      `;

      for (const m of chapterMilestones) {
        const isUnlocked = unlocked.includes(m.id);
        if (isUnlocked) {
          html += `
            <div style="padding:4px 8px;margin-bottom:3px;background:rgba(255,236,39,0.06);border-left:3px solid #ffec27;border-radius:2px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="color:#ffec27;font-size:10px">${m.name}</span>
                <span style="color:#8b4513;font-size:8px">DAY ${s.gameDay ?? '?'}</span>
              </div>
              <div style="color:#aaa;font-size:9px;margin-top:2px;font-style:italic">${m.description}</div>
            </div>
          `;
        } else {
          const hint = _getHintText(m);
          html += `
            <div style="padding:4px 8px;margin-bottom:3px;background:rgba(255,255,255,0.02);border-left:3px solid #333;border-radius:2px;opacity:0.6">
              <div style="color:#666;font-size:10px">???</div>
              <div style="color:#555;font-size:9px;margin-top:2px">${hint}</div>
            </div>
          `;
        }
      }

      html += `</div>`;
    }

    // Sandbox goals section (only after win)
    const sandboxGoals = s.sandboxGoals;
    if (sandboxGoals && sandboxGoals.length > 0) {
      const sgCompleted = sandboxGoals.filter(g => g.completed).length;
      html += `
        <div style="margin-top:8px;margin-bottom:10px;">
          <div style="color:#ff77a8;font-size:10px;letter-spacing:1px;margin-bottom:4px;padding-bottom:3px;border-bottom:1px solid #ff77a844;display:flex;justify-content:space-between">
            <span>POST-SEASON CHALLENGES</span>
            <span style="color:#888;font-size:9px">${sgCompleted}/${sandboxGoals.length}</span>
          </div>
      `;

      for (const goal of sandboxGoals) {
        const icon = goal.completed ? '\u2713' : '\u25cb';
        const iconColor = goal.completed ? '#00e436' : '#888';
        const bgStyle = goal.completed ? 'background:rgba(0,228,54,0.06);border-left:3px solid #00e436' : 'background:rgba(255,255,255,0.02);border-left:3px solid #555';
        html += `
          <div style="padding:4px 8px;margin-bottom:3px;${bgStyle};border-radius:2px">
            <div style="display:flex;align-items:center;gap:6px">
              <span style="color:${iconColor};font-size:11px">${icon}</span>
              <span style="color:${goal.completed ? '#00e436' : '#c0c0d0'};font-size:10px">${goal.name}</span>
            </div>
            <div style="color:#888;font-size:9px;margin-top:2px;margin-left:17px">${goal.description}</div>
          </div>
        `;
      }

      html += `</div>`;
    }

    html += `</div>`; // end scroll area

    this._el.innerHTML = html;

    // Close button
    this._el.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      this.eventBus.emit('ui:click');
      this.hide();
    });
  }
}
