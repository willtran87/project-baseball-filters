/**
 * JournalPanel — Multi-tab panel for story progress, characters, notes, and milestones.
 *
 * Registered with PanelManager. Tabs:
 *   Story     - Chapter summaries and recent story events
 *   Characters- NPC portraits with relationship bars
 *   Notes     - Hank's notes (found/unfound)
 *   Milestones- Achieved milestone list
 */

import { NPC_DATA, HANK_NOTES, STORY_MILESTONES } from '../data/storyData.js';

export function registerJournalPanel(panelManager, state, eventBus, sprites) {
  panelManager.register('journal', (el, st, bus, data) => {
    renderJournal(el, st, bus, sprites, data);
  });

  eventBus.on('ui:toggleJournal', () => {
    if (panelManager.isOpen('journal')) {
      eventBus.emit('ui:closePanel');
    } else {
      eventBus.emit('ui:openPanel', { name: 'journal', data: { tab: 'story' } });
    }
  });
}

function renderJournal(el, state, eventBus, sprites, data) {
  const activeTab = data?.tab ?? 'story';

  // Override default panel styles for journal (taller)
  el.style.maxHeight = '65%';
  el.style.bottom = '22px';

  // Tab definitions
  const tabs = [
    { id: 'story', label: 'Story' },
    { id: 'characters', label: 'Characters' },
    { id: 'notes', label: 'Notes' },
    { id: 'milestones', label: 'Milestones' },
  ];

  // Header + tabs
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex; justify-content: space-between; align-items: center;
    margin: -8px -12px 8px; padding: 8px 12px;
    border-bottom: 2px solid #8b4513;
    background: linear-gradient(180deg,rgba(139,69,19,0.15),rgba(0,0,0,0.3));
  `;
  header.innerHTML = `
    <strong style="color:#ff77a8;letter-spacing:1px">\u{1f4d3} HANK'S JOURNAL</strong>
    <div style="display:flex;gap:0">
      ${tabs.map(t => `
        <span data-tab="${t.id}" style="
          padding: 3px 10px; cursor: pointer; font-size: 10px;
          color: ${t.id === activeTab ? '#ffec27' : '#888'};
          border-bottom: ${t.id === activeTab ? '2px solid #ffec27' : '2px solid transparent'};
          background: ${t.id === activeTab ? 'rgba(255,236,39,0.05)' : 'transparent'};
        ">${t.label}</span>
      `).join('')}
    </div>
    <span data-action="close-journal" style="cursor:pointer;color:#888;font-size:12px">\u2715</span>
  `;
  el.appendChild(header);

  // Content area
  const content = document.createElement('div');
  content.style.cssText = 'flex:1;overflow-y:auto;';
  el.appendChild(content);

  // Render active tab content
  switch (activeTab) {
    case 'story':
      renderStoryTab(content, state);
      break;
    case 'characters':
      renderCharactersTab(content, state, sprites);
      break;
    case 'notes':
      renderNotesTab(content, state, eventBus);
      break;
    case 'milestones':
      renderMilestonesTab(content, state);
      break;
  }

  // Event handling
  el.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      eventBus.emit('ui:click');
      eventBus.emit('ui:openPanel', { name: 'journal', data: { tab: tabBtn.dataset.tab } });
      return;
    }
    const closeBtn = e.target.closest('[data-action="close-journal"]');
    if (closeBtn) {
      eventBus.emit('ui:click');
      eventBus.emit('ui:closePanel');
      return;
    }
    const noteBtn = e.target.closest('[data-note-id]');
    if (noteBtn) {
      eventBus.emit('ui:click');
      const noteId = noteBtn.dataset.noteId;
      showNoteDetail(content, state, noteId, eventBus);
    }
  });
}

// ── Story Tab ─────────────────────────────────────

function renderStoryTab(container, state) {
  const currentChapter = state.storyChapter ?? 1;
  const chapterSummaries = {
    1: 'Casey "Pipes" Peralta takes over the crumbling Ridgemont Stadium, learning the basics of filtration while meeting Maggie, Rusty, and the rest of the crew. The goal: keep the lights on and avoid condemnation.',
    2: 'Operations expand as Ridgemont earns its first sponsors and the crowds grow. Victor Salazar begins circling, and keeping the stadium running gets harder when someone is actively working against you.',
    3: 'Maggie reveals the financial stakes — two seasons to profitability or Ridgemont gets sold. Infrastructure upgrades clash with crew drama while Victor\'s interference intensifies.',
    4: 'The championship push begins. All four domains must run at peak performance as Victor\'s schemes reach a crescendo. Rusty gets a job offer, and everything Casey has built is tested by the worst storm season in Ridgemont history.',
    5: 'The Raptors are in contention and a championship is awarded to Ridgemont. Victor plays his last card. Legacy decisions loom as everything comes down to the invisible work that makes it all possible.',
  };
  const recentEvents = state.storyEventsCompleted ?? [];

  let html = '';

  // Chapter progress
  html += `
    <div style="margin-bottom:12px">
      <div style="color:#ffec27;font-size:12px;margin-bottom:6px">Chapter ${currentChapter}</div>
  `;

  // Show summaries for completed chapters
  for (let i = 1; i < currentChapter; i++) {
    const summary = chapterSummaries[i] ?? `Chapter ${i} completed.`;
    html += `
      <div style="margin-bottom:6px;padding:4px 8px;border-left:2px solid #3a5a3a;color:#aaa;font-size:10px">
        <span style="color:#5f8a5f">Ch.${i}:</span> ${summary}
      </div>
    `;
  }

  // Current chapter
  const currentSummary = chapterSummaries[currentChapter] ?? 'In progress...';
  html += `
    <div style="margin-bottom:6px;padding:4px 8px;border-left:2px solid #ffec27;color:#e0e0e0;font-size:10px">
      <span style="color:#ffec27">Ch.${currentChapter}:</span> ${currentSummary}
    </div>
  </div>`;

  // Recent events (storyEventsCompleted stores event ID strings)
  if (recentEvents.length > 0) {
    html += `<div style="color:#83769c;font-size:10px;margin-bottom:4px">Completed Story Events</div>`;
    for (const evtId of recentEvents.slice(-6)) {
      const label = typeof evtId === 'string' ? evtId.replace(/_/g, ' ').replace(/\bch\d+\b/g, m => m.toUpperCase()) : String(evtId);
      html += `
        <div style="padding:2px 8px;font-size:10px;color:#aaa;border-left:2px solid #4a4a6a;margin-bottom:2px">
          ${label}
        </div>
      `;
    }
  }

  if (currentChapter <= 1 && recentEvents.length === 0) {
    html = '<div style="color:#5f574f;text-align:center;padding:20px">No story progress yet.</div>';
  }

  container.innerHTML = html;
}

// ── Characters Tab ────────────────────────────────

function renderCharactersTab(container, state, sprites) {
  const relationships = state.npcRelationships ?? {};
  const npcDefs = NPC_DATA ?? {};

  const npcIds = Object.keys(npcDefs);
  if (npcIds.length === 0) {
    container.innerHTML = '<div style="color:#5f574f;text-align:center;padding:20px">No characters met yet.</div>';
    return;
  }

  // Relationship tier names
  const tierNames = [
    { min: 0, label: 'Stranger', color: '#555' },
    { min: 20, label: 'Acquaintance', color: '#888' },
    { min: 40, label: 'Colleague', color: '#29adff' },
    { min: 60, label: 'Friend', color: '#00e436' },
    { min: 80, label: 'Trusted Ally', color: '#ffec27' },
    { min: 100, label: 'Family', color: '#ff77a8' },
  ];

  function getTierName(value) {
    let result = tierNames[0];
    for (const t of tierNames) {
      if (value >= t.min) result = t;
    }
    return result;
  }

  let html = '<div style="display:flex;flex-direction:column;gap:8px">';

  for (const npcId of npcIds) {
    const npc = npcDefs[npcId];
    const rel = relationships[npcId] ?? 0;
    const tier = getTierName(rel);
    const name = npc.name ?? npcId;
    const role = npc.role ?? '';
    const themeColor = npc.themeColor ?? '#888';
    const portrait = npc.portrait ?? `portrait_${npcId}`;

    // Create a small portrait canvas
    const portraitId = `portrait-${npcId}`;

    html += `
      <div style="display:flex;gap:8px;align-items:center;padding:4px 6px;
        background:rgba(255,255,255,0.02);border-left:3px solid ${themeColor}">
        <canvas id="${portraitId}" width="64" height="64"
          style="width:64px;height:64px;image-rendering:pixelated;flex-shrink:0"></canvas>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px">
            <span style="color:${themeColor};font-weight:bold">${name}</span>
            ${role ? `<span style="color:#5f574f;font-size:9px;margin-left:4px">${role}</span>` : ''}
          </div>
          <div style="font-size:9px;color:${tier.color};margin:2px 0">${tier.label}</div>
          <div style="background:#222;height:4px;border-radius:2px;width:120px">
            <div style="background:${tier.color};height:100%;width:${Math.min(rel, 100)}%;border-radius:2px;
              transition:width 0.3s"></div>
          </div>
        </div>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;

  // Draw portraits after DOM insertion
  for (const npcId of npcIds) {
    const npc = npcDefs[npcId];
    const portraitName = npc.portrait ?? `portrait_${npcId}`;
    const canvas = container.querySelector(`#portrait-${npcId}`);
    if (canvas) {
      drawPortraitToCanvas(canvas, portraitName, sprites);
    }
  }
}

// ── Notes Tab ─────────────────────────────────────

function renderNotesTab(container, state, eventBus) {
  const foundNoteIds = state.hanksNotes ?? [];
  const allNotes = HANK_NOTES ?? [];
  const totalNotes = allNotes.length || 8;

  let html = `
    <div style="color:#83769c;font-size:10px;margin-bottom:8px">
      Hank's Notes: ${foundNoteIds.length} / ${totalNotes} found
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
  `;

  for (let i = 0; i < totalNotes; i++) {
    const noteId = `hank_note_${i + 1}`;
    const isFound = foundNoteIds.includes(noteId);
    const noteDef = allNotes.find(n => n.id === noteId);

    if (isFound) {
      const title = noteDef?.title ?? `Note #${i + 1}`;
      html += `
        <div data-note-id="${noteId}" style="
          padding: 6px 10px; cursor: pointer;
          background: rgba(255, 236, 39, 0.05);
          border: 1px solid #4a4a3a;
          border-left: 3px solid #ffec27;
          font-size: 10px; color: #e0d8b0;
        ">
          <div style="font-weight:bold;margin-bottom:2px">${title}</div>
          <div style="color:#8a8060;font-size:9px">Click to read</div>
        </div>
      `;
    } else {
      html += `
        <div style="
          padding: 6px 10px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid #2a2a2a;
          border-left: 3px solid #333;
          font-size: 10px; color: #444;
        ">???</div>
      `;
    }
  }

  html += '</div>';
  container.innerHTML = html;
}

function showNoteDetail(container, state, noteId, eventBus) {
  const foundNoteIds = state.hanksNotes ?? [];
  if (!foundNoteIds.includes(noteId)) return;

  const allNotes = HANK_NOTES ?? [];
  const noteDef = allNotes.find(n => n.id === noteId);

  const title = noteDef?.title ?? noteId;
  const text = noteDef?.content ?? 'No text.';

  container.innerHTML = `
    <div style="padding:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="color:#ffec27;font-size:12px;font-weight:bold">${title}</span>
        <span data-action="back-notes" style="cursor:pointer;color:#888;font-size:10px">[Back]</span>
      </div>
      <div style="
        padding: 10px 12px;
        background: rgba(255, 236, 39, 0.03);
        border: 1px solid #3a3a2a;
        color: #d0c890;
        font-size: 10px;
        line-height: 1.5;
        font-style: italic;
        white-space: pre-wrap;
      ">${text}</div>
    </div>
  `;

  // Back button handler
  container.addEventListener('click', function handler(e) {
    const back = e.target.closest('[data-action="back-notes"]');
    if (back) {
      container.removeEventListener('click', handler);
      renderNotesTab(container, state, eventBus);
    }
  });
}

// ── Milestones Tab ────────────────────────────────

function renderMilestonesTab(container, state) {
  const milestones = state.achievements ?? [];
  const allMilestones = state.config.milestones ?? STORY_MILESTONES ?? [];

  if (milestones.length === 0 && allMilestones.length === 0) {
    container.innerHTML = '<div style="color:#5f574f;text-align:center;padding:20px">No milestones yet.</div>';
    return;
  }

  let html = '<div style="display:flex;flex-direction:column;gap:4px">';

  // Show achieved milestones
  const achievedSet = new Set(milestones.map(m => typeof m === 'string' ? m : m.id));

  // If we have a full list of milestones, show them all (achieved/locked)
  if (allMilestones.length > 0) {
    for (const ms of allMilestones) {
      const id = typeof ms === 'string' ? ms : ms.id;
      const name = typeof ms === 'object' ? (ms.name ?? id) : id;
      const desc = typeof ms === 'object' ? (ms.description ?? '') : '';
      const achieved = achievedSet.has(id);

      html += `
        <div style="
          display:flex; align-items:center; gap:8px;
          padding:4px 8px;
          border-left:3px solid ${achieved ? '#00e436' : '#333'};
          color: ${achieved ? '#e0e0e0' : '#444'};
          font-size:10px;
        ">
          <span style="color:${achieved ? '#00e436' : '#333'};font-size:12px">${achieved ? '[+]' : '[ ]'}</span>
          <div>
            <div style="font-weight:${achieved ? 'bold' : 'normal'}">${achieved ? name : '???'}</div>
            ${achieved && desc ? `<div style="color:#888;font-size:9px">${desc}</div>` : ''}
          </div>
        </div>
      `;
    }
  } else {
    // Just show achieved milestones
    for (const ms of milestones) {
      const name = typeof ms === 'object' ? (ms.name ?? ms.id) : ms;
      const desc = typeof ms === 'object' ? (ms.description ?? '') : '';

      html += `
        <div style="
          display:flex; align-items:center; gap:8px;
          padding:4px 8px;
          border-left:3px solid #00e436;
          font-size:10px;
        ">
          <span style="color:#00e436;font-size:12px">[+]</span>
          <div>
            <div style="font-weight:bold">${name}</div>
            ${desc ? `<div style="color:#888;font-size:9px">${desc}</div>` : ''}
          </div>
        </div>
      `;
    }
  }

  html += '</div>';
  container.innerHTML = html;
}

// ── Portrait Helper ───────────────────────────────

function drawPortraitToCanvas(canvas, portraitName, sprites) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);

  const pixelData = sprites?.getPixelSprite(portraitName);
  if (pixelData && Array.isArray(pixelData)) {
    for (let y = 0; y < pixelData.length; y++) {
      const row = pixelData[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const color = row[x];
        if (color && color !== '' && color !== null) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    return;
  }

  // Fallback placeholder
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#555';
  ctx.fillRect(22, 8, 20, 20);
  ctx.fillRect(16, 32, 32, 28);
}
