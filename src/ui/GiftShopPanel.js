/**
 * GiftShopPanel -- Buy gifts for NPCs to improve relationships.
 *
 * Two-column layout: NPC selector on the left, gift grid on the right.
 * Gifts are gated by reputation, have per-NPC cooldowns, and award
 * relationship bonuses scaled by NPC preference multipliers.
 *
 * Toggle via `ui:toggleGiftShop`; hides on `ui:closeGiftShop` or `ui:closeAllPanels`.
 */

import { GIFT_ITEMS, GIFT_COOLDOWN_DEFAULT } from '../data/giftData.js';
import { NPC_DATA } from '../data/storyData.js';

/** Friendly NPCs only (same order as NPCContactsPanel). */
const NPC_ORDER = ['maggie', 'rusty', 'diego', 'priya', 'bea', 'fiona'];

/** Simple NPC emoji portraits for the selector cards. */
const NPC_EMOJIS = {
  maggie: '\uD83D\uDC69\u200D\uD83D\uDCBC',
  rusty:  '\uD83D\uDD27',
  diego:  '\u26BE',
  priya:  '\uD83D\uDCF0',
  bea:    '\uD83D\uDCCB',
  fiona:  '\uD83D\uDCCA',
};

export class GiftShopPanel {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this._el = null;
    this._visible = false;
    this._selectedNpc = null;

    this.eventBus.on('ui:toggleGiftShop', () => this.toggle());
    this.eventBus.on('ui:closeGiftShop', () => this.hide());
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._visible) {
        this.hide();
        if (result) result.closed = true;
      }
    });

    // Re-render when visible and relevant state changes
    this.eventBus.on('game:newDay', () => { if (this._visible) this._render(); });
  }

  toggle() {
    if (this._visible) this.hide(); else this.show();
  }

  show() {
    this.eventBus.emit('ui:closeAllPanels');
    this.hide();
    this._visible = true;

    // Initialize giftCooldowns if missing
    if (!this.state.giftCooldowns) {
      this.state.giftCooldowns = {};
    }

    // Default selection to first NPC
    if (!this._selectedNpc) {
      this._selectedNpc = NPC_ORDER[0];
    }

    this._el = document.createElement('div');
    this._el.id = 'gift-shop-panel';
    this._el.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 520px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 35;
      background: rgba(10, 10, 30, 0.96);
      border: 2px solid #8b4513;
      border-radius: 4px;
      font-family: monospace;
      color: #d0d0e0;
      font-size: 11px;
      box-shadow: 0 0 24px rgba(139,69,19,0.3);
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

  // ── Rendering ──────────────────────────────────────────────────────────────

  _render() {
    if (!this._el) return;
    this._el.innerHTML = '';

    this._renderHeader();
    this._renderBody();
  }

  _renderHeader() {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #8b4513;
      background: rgba(139, 69, 19, 0.1);
    `;
    header.innerHTML = `
      <span style="color:#ffec27;font-size:13px;letter-spacing:2px">\uD83C\uDF81 GIFT SHOP</span>
      <span data-action="close" style="cursor:pointer;color:#888;font-size:13px;padding:0 4px" title="Close">\u2715</span>
    `;
    header.querySelector('[data-action="close"]').addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.eventBus.emit('ui:click');
      this.hide();
    });
    this._el.appendChild(header);
  }

  _renderBody() {
    const body = document.createElement('div');
    body.style.cssText = `
      display: flex;
      gap: 0;
      min-height: 300px;
    `;

    body.appendChild(this._buildNpcSelector());
    body.appendChild(this._buildGiftGrid());

    this._el.appendChild(body);
  }

  // ── NPC Selector (left column) ─────────────────────────────────────────────

  _buildNpcSelector() {
    const col = document.createElement('div');
    col.style.cssText = `
      width: 160px;
      flex-shrink: 0;
      border-right: 1px solid #8b4513;
      padding: 6px 0;
      overflow-y: auto;
    `;

    const label = document.createElement('div');
    label.style.cssText = 'padding: 4px 10px 6px; color: #888; font-size: 9px; text-transform: uppercase; letter-spacing: 1px;';
    label.textContent = 'Give gift to...';
    col.appendChild(label);

    for (const npcId of NPC_ORDER) {
      const npc = NPC_DATA[npcId];
      if (!npc) continue;
      const card = this._buildNpcCard(npcId, npc);
      col.appendChild(card);
    }

    return col;
  }

  _buildNpcCard(npcId, npc) {
    const isSelected = npcId === this._selectedNpc;
    const relValue = this.state.npcRelationships?.[npcId] ?? 0;

    const card = document.createElement('div');
    card.style.cssText = `
      display: flex; align-items: center; gap: 6px;
      padding: 6px 10px;
      cursor: pointer;
      background: ${isSelected ? 'rgba(139, 69, 19, 0.2)' : 'transparent'};
      border-left: 3px solid ${isSelected ? npc.themeColor : 'transparent'};
      transition: background 0.15s;
    `;

    card.innerHTML = `
      <span style="font-size:16px">${NPC_EMOJIS[npcId] || '\uD83D\uDC64'}</span>
      <div style="flex:1;min-width:0">
        <div style="color:${npc.themeColor};font-size:10px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${npc.name.split(' ')[0]}</div>
        <div style="color:#777;font-size:9px">${npc.role}</div>
        <div style="color:#999;font-size:9px">\u2764 ${relValue}</div>
      </div>
    `;

    card.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.eventBus.emit('ui:click');
      this._selectedNpc = npcId;
      this._render();
    });

    card.addEventListener('mouseenter', () => {
      if (!isSelected) card.style.background = 'rgba(139, 69, 19, 0.1)';
    });
    card.addEventListener('mouseleave', () => {
      if (!isSelected) card.style.background = 'transparent';
    });

    return card;
  }

  // ── Gift Grid (right column) ───────────────────────────────────────────────

  _buildGiftGrid() {
    const col = document.createElement('div');
    col.style.cssText = `
      flex: 1;
      padding: 6px 10px;
      overflow-y: auto;
    `;

    if (!this._selectedNpc) {
      col.innerHTML = '<div style="color:#666;padding:20px;text-align:center">Select an NPC to see available gifts.</div>';
      return col;
    }

    const selectedNpc = NPC_DATA[this._selectedNpc];
    const label = document.createElement('div');
    label.style.cssText = 'padding: 4px 0 8px; color: #888; font-size: 9px; text-transform: uppercase; letter-spacing: 1px;';
    label.textContent = `Gifts for ${selectedNpc ? selectedNpc.name.split(' ')[0] : this._selectedNpc}`;
    col.appendChild(label);

    const grid = document.createElement('div');
    grid.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

    for (const gift of GIFT_ITEMS) {
      grid.appendChild(this._buildGiftRow(gift));
    }

    col.appendChild(grid);
    return col;
  }

  _buildGiftRow(gift) {
    const npcId = this._selectedNpc;
    const reputation = this.state.reputation ?? 0;
    const money = this.state.money ?? 0;
    const cooldownDays = gift.cooldownDays ?? GIFT_COOLDOWN_DEFAULT;

    // Check reputation lock
    const repLocked = gift.reputationReq && reputation < gift.reputationReq;

    // Check cooldown
    const cooldownKey = `${npcId}_${gift.id}`;
    const lastGiven = this.state.giftCooldowns?.[cooldownKey];
    const currentDay = this.state.gameDay ?? 0;
    const daysRemaining = lastGiven != null ? Math.max(0, cooldownDays - (currentDay - lastGiven)) : 0;
    const onCooldown = daysRemaining > 0;

    // Check affordability
    const cantAfford = money < gift.cost;

    // Calculate adjusted bonus
    const multiplier = gift.npcPreferences?.[npcId] ?? 1.0;
    const adjustedBonus = Math.round(gift.relationshipBonus * multiplier);

    const disabled = repLocked || onCooldown || cantAfford;

    const row = document.createElement('div');
    row.style.cssText = `
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px;
      background: ${disabled ? 'rgba(30, 30, 40, 0.5)' : 'rgba(30, 30, 50, 0.6)'};
      border: 1px solid ${disabled ? '#333' : '#555'};
      border-radius: 3px;
      opacity: ${repLocked ? '0.5' : '1'};
    `;

    // Icon
    const icon = document.createElement('span');
    icon.style.cssText = 'font-size: 18px; flex-shrink: 0; width: 24px; text-align: center;';
    icon.textContent = gift.icon;
    row.appendChild(icon);

    // Info
    const info = document.createElement('div');
    info.style.cssText = 'flex: 1; min-width: 0;';

    const bonusColor = multiplier > 1.0 ? '#5cff5c' : multiplier < 1.0 ? '#ff6666' : '#aaa';
    const bonusLabel = multiplier > 1.0 ? ' \u2605' : '';

    info.innerHTML = `
      <div style="color:${disabled ? '#777' : '#ddd'};font-size:10px;font-weight:bold">${gift.name}</div>
      <div style="color:#666;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${gift.description}</div>
      <div style="display:flex;gap:8px;margin-top:2px">
        <span style="color:#c8a84e;font-size:9px">$${gift.cost}</span>
        <span style="color:${bonusColor};font-size:9px">+${adjustedBonus} rel${bonusLabel}</span>
      </div>
    `;
    row.appendChild(info);

    // Status / button area
    const action = document.createElement('div');
    action.style.cssText = 'flex-shrink: 0; text-align: right;';

    if (repLocked) {
      action.innerHTML = `<div style="color:#886644;font-size:9px;white-space:nowrap">Requires ${gift.reputationReq}% rep</div>`;
    } else if (onCooldown) {
      action.innerHTML = `<div style="color:#888;font-size:9px;white-space:nowrap">Available in ${daysRemaining}d</div>`;
    } else {
      const btn = document.createElement('button');
      btn.style.cssText = cantAfford
        ? 'background:#3a3a3a;color:#666;border:1px solid #4a4a4a;padding:4px 8px;font-family:monospace;font-size:9px;cursor:default;border-radius:2px;white-space:nowrap;'
        : 'background:#2a6a2a;color:#fff;border:1px solid #4a8a4a;padding:4px 8px;font-family:monospace;font-size:9px;cursor:pointer;border-radius:2px;white-space:nowrap;';
      btn.textContent = cantAfford ? 'Can\'t afford' : 'Buy & Give';
      btn.disabled = cantAfford;

      if (!cantAfford) {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.eventBus.emit('ui:click');
          this._purchaseGift(gift, npcId, adjustedBonus);
        });
      }
      action.appendChild(btn);
    }

    row.appendChild(action);
    return row;
  }

  // ── Purchase Logic ─────────────────────────────────────────────────────────

  _purchaseGift(gift, npcId, adjustedBonus) {
    const npc = NPC_DATA[npcId];
    const npcName = npc ? npc.name.split(' ')[0] : npcId;
    const cooldownDays = gift.cooldownDays ?? GIFT_COOLDOWN_DEFAULT;
    const currentDay = this.state.gameDay ?? 0;

    // Emit purchase event for the integration agent to wire up
    this.eventBus.emit('gift:purchase', {
      giftId: gift.id,
      npcId,
      cost: gift.cost,
      bonus: adjustedBonus,
    });

    // Record cooldown
    if (!this.state.giftCooldowns) this.state.giftCooldowns = {};
    this.state.giftCooldowns[`${npcId}_${gift.id}`] = currentDay;

    // Show confirmation toast
    this._showConfirmation(npcName, gift.name, adjustedBonus);

    // Re-render to reflect new state
    this._render();
  }

  _showConfirmation(npcName, giftName, bonus) {
    // Brief inline confirmation that fades out
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(42, 106, 42, 0.95);
      color: #fff;
      padding: 8px 16px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 11px;
      z-index: 40;
      pointer-events: none;
      white-space: nowrap;
      transition: opacity 0.5s;
    `;
    toast.textContent = `${npcName} loved your ${giftName}! +${bonus} relationship`;
    this._el.appendChild(toast);

    setTimeout(() => { toast.style.opacity = '0'; }, 1500);
    setTimeout(() => { toast.remove(); }, 2000);
  }
}
