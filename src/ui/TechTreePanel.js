/**
 * TechTreePanel -- Visual tech tree UI showing 3 research tracks.
 *
 * Displays tracks side by side with nodes connected by lines.
 * Each node shows: icon, name, cost, time, status (locked/available/researching/complete).
 * Click available node to start research. Progress bar on active research.
 * Registered with PanelManager, accessible via HUD button.
 */

import { TECH_TREE } from '../data/techTreeData.js';

const STATUS_COLORS = {
  completed: '#00e436',
  researching: '#ffec27',
  available: '#29adff',
  locked: '#444',
};

const STATUS_LABELS = {
  completed: 'DONE',
  researching: 'ACTIVE',
  available: 'READY',
  locked: 'LOCKED',
};

export class TechTreePanel {
  constructor(panelManager, state, eventBus, researchSystem) {
    this.state = state;
    this.eventBus = eventBus;
    this.researchSystem = researchSystem;

    panelManager.register('techTree', (el, state, eventBus, data) => {
      this._render(el, state, eventBus);
    });

    this.eventBus.on('ui:toggleResearch', () => {
      if (!this.researchSystem.isLabUnlocked()) {
        this.eventBus.emit('ui:message', {
          text: 'Research lab locked. Reach Double-A tier (rep 56+).',
          type: 'warning',
        });
        return;
      }
      if (panelManager.isOpen('techTree')) {
        this.eventBus.emit('ui:closePanel');
      } else {
        this.eventBus.emit('ui:openPanel', { name: 'techTree' });
      }
    });
  }

  _render(el, state, eventBus) {
    const tracks = Object.values(TECH_TREE);
    const active = this.researchSystem.getActiveResearch();

    el.style.cssText = `
      position: absolute; top: 20px; left: 5%; right: 5%; bottom: 20px;
      background: linear-gradient(180deg, rgba(10,8,20,0.97), rgba(8,8,24,0.97));
      border: 2px solid #8b4513;
      border-radius: 4px;
      font-family: monospace; color: #e0e0e0;
      font-size: 11px; z-index: 30;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(139,69,19,0.2);
    `;

    let html = '';

    // Header
    html += `
      <div style="
        display: flex; justify-content: space-between; align-items: center;
        padding: 8px 12px; border-bottom: 2px solid #8b4513;
        background: linear-gradient(180deg,rgba(139,69,19,0.15),rgba(0,0,0,0.3));
      ">
        <strong style="color: #cc44cc; letter-spacing: 1px">\u{1f52c} STADIUM R&amp;D LAB</strong>
        <span style="color: #888">Balance: <span style="color: #00e436">$${state.money.toLocaleString()}</span></span>
        <span data-action="close-tech" style="cursor:pointer;color:#888;font-size:12px">\u2715</span>
      </div>
    `;

    // Active research banner
    if (active) {
      const node = this._findNode(active.nodeId);
      const totalDays = active.totalDays ?? node?.researchDays ?? 1;
      const elapsed = totalDays - active.daysRemaining;
      const progressPct = Math.floor((elapsed / totalDays) * 100);

      html += `
        <div style="
          padding: 6px 12px; background: rgba(255, 236, 39, 0.08);
          border-bottom: 1px solid #3a3a5a;
          display: flex; align-items: center; gap: 8px;
        ">
          <span style="color: #ffec27; font-size: 10px">RESEARCHING:</span>
          <span style="flex: 1">${node?.name ?? active.nodeId}</span>
          <div style="width: 100px; background: #222; height: 6px; border-radius: 3px;">
            <div style="background: #ffec27; height: 100%; width: ${progressPct}%; border-radius: 3px;"></div>
          </div>
          <span style="color: #ffec27; font-size: 10px">${active.daysRemaining}d left</span>
          <span data-action="cancel-research" style="cursor: pointer; color: #ff004d; font-size: 9px">[CANCEL]</span>
        </div>
      `;
    }

    // Track columns
    html += `<div style="flex: 1; display: flex; gap: 0; overflow-y: auto;">`;

    for (const track of tracks) {
      html += `
        <div style="
          flex: 1; border-right: 1px solid #2a2a4a;
          display: flex; flex-direction: column;
          min-width: 0;
        ">
          <div style="
            padding: 6px 8px; text-align: center;
            background: rgba(0,0,0,0.2);
            border-bottom: 1px solid #2a2a4a;
          ">
            <div style="color: ${track.color}; font-size: 12px; font-weight: bold;">
              ${track.name}
            </div>
            <div style="color: #777; font-size: 9px; margin-top: 2px;">
              ${track.description}
            </div>
          </div>
          <div style="flex: 1; overflow-y: auto; padding: 6px;">
      `;

      const nodes = track.nodes ?? [];
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const status = this.researchSystem.getNodeStatus(node.id);
        const statusColor = STATUS_COLORS[status];
        const isClickable = status === 'available';

        // Connection line from previous node
        if (i > 0) {
          const prevStatus = this.researchSystem.getNodeStatus(nodes[i - 1].id);
          const lineColor = prevStatus === 'completed' ? track.color : '#333';
          html += `
            <div style="
              text-align: center; margin: 2px 0;
              color: ${lineColor}; font-size: 10px; line-height: 1;
            ">|</div>
          `;
        }

        html += `
          <div data-node="${node.id}" style="
            padding: 6px 8px; margin-bottom: 2px;
            background: ${status === 'completed' ? 'rgba(0, 228, 54, 0.06)' :
              status === 'researching' ? 'rgba(255, 236, 39, 0.06)' :
              status === 'available' ? 'rgba(41, 173, 255, 0.06)' :
              'rgba(0,0,0,0.15)'};
            border: 1px solid ${statusColor};
            border-radius: 3px;
            cursor: ${isClickable ? 'pointer' : 'default'};
            opacity: ${status === 'locked' ? '0.5' : '1'};
          ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: ${statusColor}; font-size: 9px">[${STATUS_LABELS[status]}]</span>
              <span style="color: ${track.color}; font-size: 9px">T${node.tier}</span>
            </div>
            <div style="font-weight: bold; margin: 2px 0; font-size: 11px; color: ${status === 'locked' ? '#666' : '#e0e0e0'};">
              ${node.name}
            </div>
            <div style="color: #888; font-size: 9px; margin-bottom: 3px; line-height: 1.3;">
              ${node.description}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9px; color: #777;">
              <span>$${node.cost.toLocaleString()}</span>
              <span>${node.researchDays} days</span>
            </div>
            ${status === 'completed' && node.flavorText ? `
              <div style="color: #8a8a6a; font-size: 9px; font-style: italic; margin-top: 4px; border-top: 1px dotted #3a3a3a; padding-top: 3px;">
                "${node.flavorText}"
              </div>
            ` : ''}
          </div>
        `;
      }

      html += `</div></div>`;
    }

    html += `</div>`;

    el.innerHTML = html;

    // Event handlers
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close-tech"]')) {
        eventBus.emit('ui:closePanel');
        return;
      }

      if (e.target.closest('[data-action="cancel-research"]')) {
        eventBus.emit('research:cancel');
        // Re-render
        eventBus.emit('ui:openPanel', { name: 'techTree' });
        return;
      }

      const nodeEl = e.target.closest('[data-node]');
      if (nodeEl) {
        const nodeId = nodeEl.dataset.node;
        const status = this.researchSystem.getNodeStatus(nodeId);
        if (status === 'available') {
          eventBus.emit('research:start', { nodeId });
          // Re-render
          eventBus.emit('ui:openPanel', { name: 'techTree' });
        }
      }
    });
  }

  _findNode(nodeId) {
    for (const track of Object.values(TECH_TREE)) {
      for (const node of (track.nodes ?? [])) {
        if (node.id === nodeId) return node;
      }
    }
    return null;
  }
}
