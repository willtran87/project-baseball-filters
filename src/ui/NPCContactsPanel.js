/**
 * NPCContactsPanel -- "Stadium Radio" contacts panel.
 *
 * Shows all 6 friendly NPCs (not Victor) with mini-portraits, names, roles,
 * relationship status with progress bars, and a "Chat" button. Clicking Chat
 * emits `npc:startChat` to begin a casual conversation. Acts as a walkie-talkie
 * / stadium radio for the player.
 *
 * Toggle via `ui:toggleTalk` event; hides on `ui:closePanel`.
 */

import { NPC_DATA } from '../data/storyData.js';
import { NPC_MINI_PORTRAITS } from '../assets/npcSprites.js';

/** NPC display order (friendly contacts only -- NOT victor) */
const NPC_ORDER = ['maggie', 'rusty', 'diego', 'priya', 'bea', 'fiona'];

export class NPCContactsPanel {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this._el = null;
    this._visible = false;

    this.eventBus.on('ui:toggleTalk', () => this.toggle());
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._visible) {
        this.hide();
        if (result) result.closed = true;
      }
    });

    // Auto-refresh when visible (same pattern as ObjectivesPanel)
    this.eventBus.on('npc:chatComplete', () => { if (this._visible) this._render(); });
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
    this._el.id = 'npc-contacts-panel';
    this._el.style.cssText = `
      position: absolute;
      right: 8px;
      bottom: 48px;
      width: 240px;
      max-height: 70vh;
      overflow-y: auto;
      z-index: 35;
      background: rgba(10, 10, 30, 0.94);
      border: 2px solid #8b4513;
      border-radius: 4px;
      font-family: monospace;
      color: #d0d0e0;
      font-size: 11px;
      box-shadow: 0 0 16px rgba(139,69,19,0.25);
      scrollbar-width: thin;
      scrollbar-color: #8b4513 #111;
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

  // ── Rendering ────────────────────────────────────────────────────────────

  _render() {
    if (!this._el) return;

    // Clear previous content for re-renders
    this._el.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 10px;
      border-bottom: 1px solid #8b4513;
      background: rgba(139, 69, 19, 0.1);
    `;
    header.innerHTML = `
      <span style="color:#ffec27;font-size:12px;letter-spacing:2px">\u{1f4fb} STADIUM RADIO</span>
      <span data-action="close" style="cursor:pointer;color:#888;font-size:12px;padding:0 2px" title="Close">\u2715</span>
    `;
    this._el.appendChild(header);

    // Close button via mousedown (prevents event orphaning)
    header.querySelector('[data-action="close"]').addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.eventBus.emit('ui:click');
      this.hide();
    });

    // NPC rows
    const list = document.createElement('div');
    list.style.cssText = 'padding: 4px 0;';

    for (const npcId of NPC_ORDER) {
      const npc = NPC_DATA[npcId];
      if (!npc) continue;
      const row = this._buildNPCRow(npcId, npc);
      list.appendChild(row);
    }

    this._el.appendChild(list);
  }

  /**
   * Build a single NPC row element with portrait, info, progress bar, and chat button.
   */
  _buildNPCRow(npcId, npc) {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex; align-items: center; gap: 6px;
      padding: 5px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    `;

    // -- Mini-portrait canvas --
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'flex-shrink:0; image-rendering: pixelated;';
    const portraitData = NPC_MINI_PORTRAITS[npcId];
    if (portraitData) {
      this._drawMiniPortrait(canvas, portraitData);
    } else {
      canvas.width = 24;
      canvas.height = 24;
    }
    row.appendChild(canvas);

    // -- Info column (name, role, tier, progress bar) --
    const info = document.createElement('div');
    info.style.cssText = 'flex: 1; min-width: 0;';

    const relValue = this.state.npcRelationships?.[npcId] ?? 0;
    const { tierName, progress } = this._getTierInfo(npc, relValue);

    info.innerHTML = `
      <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:1px">
        <span style="color:${npc.themeColor};font-size:10px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${npc.name}</span>
      </div>
      <div style="color:#888;font-size:9px;margin-bottom:2px">${npc.role} &middot; <span style="color:#aaa">${tierName}</span></div>
      <div style="background:#222;height:4px;border-radius:2px;overflow:hidden;border:1px solid #333">
        <div style="width:${progress}%;height:100%;background:${npc.themeColor};transition:width 0.3s"></div>
      </div>
    `;
    row.appendChild(info);

    // -- Chat button --
    const chatted = this.state.npcLastChat?.[npcId] === this.state.gameDay;
    const btn = document.createElement('button');
    btn.style.cssText = chatted
      ? 'flex-shrink:0;background:#3a3a3a;color:#666;border:1px solid #4a4a4a;padding:3px 6px;font-family:monospace;font-size:9px;cursor:default;border-radius:2px;white-space:nowrap;'
      : 'flex-shrink:0;background:#2a6a2a;color:#fff;border:1px solid #4a4a4a;padding:3px 6px;font-family:monospace;font-size:9px;cursor:pointer;border-radius:2px;white-space:nowrap;';
    btn.textContent = chatted ? 'Spoke today' : 'Chat';
    btn.disabled = chatted;

    if (!chatted) {
      // Use mousedown instead of click -- the HUD rebuilds on update so
      // mousedown prevents orphaned click targets between mousedown/mouseup.
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.eventBus.emit('ui:click');
        this.eventBus.emit('npc:startChat', { npcId });
      });
    }

    row.appendChild(btn);
    return row;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Draw an 8x8 mini-portrait onto a 24x24 canvas (3x scale).
   */
  _drawMiniPortrait(canvas, portraitData) {
    canvas.width = 24;   // 8 * 3
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    const scale = 3;
    for (let y = 0; y < portraitData.length; y++) {
      for (let x = 0; x < portraitData[y].length; x++) {
        const color = portraitData[y][x];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  /**
   * Determine the current relationship tier name and the progress percentage
   * toward the next tier for the given NPC.
   *
   * @param {object} npc        - NPC definition from NPC_DATA
   * @param {number} relValue   - Current relationship score (-100 to 100)
   * @returns {{ tierName: string, progress: number }}
   */
  _getTierInfo(npc, relValue) {
    const tiers = npc.relationshipTiers;
    if (!tiers || tiers.length === 0) {
      return { tierName: 'Unknown', progress: 0 };
    }

    // Find the highest tier whose threshold <= relValue
    let currentTier = tiers[0];
    let currentIndex = 0;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (relValue >= tiers[i].threshold) {
        currentTier = tiers[i];
        currentIndex = i;
        break;
      }
    }

    const tierName = currentTier.name;

    // Calculate progress toward the next tier
    const nextTier = tiers[currentIndex + 1];
    if (!nextTier) {
      // Already at max tier -- show full bar
      return { tierName, progress: 100 };
    }

    const rangeStart = currentTier.threshold;
    const rangeEnd = nextTier.threshold;
    const range = rangeEnd - rangeStart;
    const progressValue = relValue - rangeStart;
    const progress = range > 0
      ? Math.max(0, Math.min(100, Math.floor((progressValue / range) * 100)))
      : 100;

    return { tierName, progress };
  }
}
