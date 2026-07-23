/**
 * SchemesPanel -- "Sully's Schemes" counter-sabotage operations panel.
 *
 * Shows available schemes, active scheme status, cooldown timers,
 * and recent outcome history. Gated by sullyUnlocked + schemeAccess flags.
 *
 * Toggle via `ui:toggleSchemes` event; hides on `ui:closeAllPanels`.
 */

import { SCHEME_CONSTANTS } from '../data/schemeData.js';
import { NPC_DATA } from '../data/storyData.js';

export class SchemesPanel {
  constructor(container, state, eventBus, schemesSystem) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this.schemesSystem = schemesSystem;
    this._el = null;
    this._visible = false;

    this.eventBus.on('ui:toggleSchemes', () => this.toggle());
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._visible) {
        this.hide();
        if (result) result.closed = true;
      }
    });

    // Auto-refresh when visible
    this.eventBus.on('game:newDay', () => { if (this._visible) this._render(); });
    this.eventBus.on('scheme:launched', () => { if (this._visible) this._render(); });
    this.eventBus.on('scheme:resolved', () => { if (this._visible) this._render(); });
  }

  toggle() {
    if (this._visible) this.hide(); else this.show();
  }

  show() {
    if (!this.state.storyFlags?.sullyUnlocked || !this.state.storyFlags?.schemeAccess) {
      this.eventBus.emit('ui:message', { text: 'Sully\'s Schemes are not available yet.', type: 'warning' });
      return;
    }
    this.eventBus.emit('ui:closeAllPanels');
    this.hide();
    this._visible = true;
    this._el = document.createElement('div');
    this._el.id = 'schemes-panel';
    this._el.style.cssText = `
      position: absolute;
      right: 8px;
      bottom: 48px;
      width: 280px;
      max-height: 75vh;
      overflow-y: auto;
      z-index: 35;
      background: rgba(10, 10, 30, 0.94);
      border: 2px solid #1a2a4a;
      border-radius: 4px;
      font-family: monospace;
      color: #d0d0e0;
      font-size: 13px;
      box-shadow: 0 0 16px rgba(204,85,0,0.25);
      scrollbar-width: thin;
      scrollbar-color: #1a2a4a #111;
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

  // ── Rendering ──────────────────────────────────────────────────────────

  _render() {
    if (!this._el) return;
    this._el.innerHTML = '';

    const sully = NPC_DATA.sully;
    const themeColor = sully?.themeColor ?? '#cc5500';
    const ss = this.state.schemeState;
    const day = this.state.gameDay ?? 1;

    // ── Header ──
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 10px;
      border-bottom: 1px solid #1a2a4a;
      background: rgba(204, 85, 0, 0.1);
    `;
    header.innerHTML = `
      <span style="color:${themeColor};font-size:14px;letter-spacing:2px">\u{1f3af} SULLY'S SCHEMES</span>
      <span data-action="close" style="cursor:pointer;color:#888;font-size:14px;padding:0 2px" title="Close">\u2715</span>
    `;
    this._el.appendChild(header);
    header.querySelector('[data-action="close"]').addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.eventBus.emit('ui:click');
      this.hide();
    });

    // ── Status Bar ──
    const statusBar = document.createElement('div');
    statusBar.style.cssText = `
      padding: 6px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      font-size: 11px;
      color: #999;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    `;

    const schemesUsed = ss.schemesThisSeason ?? 0;
    const seasonCap = SCHEME_CONSTANTS.seasonCap;
    const globalCdLeft = Math.max(0, (ss.globalCooldownUntil ?? 0) - day);
    const sullyCaughtLeft = Math.max(0, (ss.sullyCaughtUntil ?? 0) - day);

    let availabilityText = '';
    let availColor = '#4a4';
    if (sullyCaughtLeft > 0) {
      availabilityText = `Sully caught (${sullyCaughtLeft}d)`;
      availColor = '#a44';
    } else if (ss.activeScheme) {
      availabilityText = 'Scheme in progress';
      availColor = '#aa4';
    } else if (globalCdLeft > 0) {
      availabilityText = `Cooldown: ${globalCdLeft}d`;
      availColor = '#aa4';
    } else if (schemesUsed >= seasonCap) {
      availabilityText = 'Season cap reached';
      availColor = '#a44';
    } else {
      availabilityText = 'Available';
    }

    statusBar.innerHTML = `
      <span>Schemes: <b>${schemesUsed}/${seasonCap}</b></span>
      <span style="color:${availColor}">${availabilityText}</span>
    `;
    this._el.appendChild(statusBar);

    // ── Active Scheme Display ──
    if (ss.activeScheme) {
      const activeDiv = document.createElement('div');
      activeDiv.style.cssText = `
        padding: 8px 10px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        background: rgba(204, 85, 0, 0.08);
      `;
      const schemes = this.schemesSystem.getAvailableSchemes();
      const activeScheme = schemes.find(s => s.id === ss.activeScheme.schemeId);
      const name = activeScheme?.name ?? ss.activeScheme.schemeId;
      activeDiv.innerHTML = `
        <div style="color:${themeColor};font-weight:bold;margin-bottom:3px">\u23f3 Active: ${name}</div>
        <div style="color:#aaa;font-size:11px">Resolves tomorrow</div>
      `;
      this._el.appendChild(activeDiv);
    }

    // ── Scheme Cards ──
    const schemes = this.schemesSystem.getAvailableSchemes();
    const body = document.createElement('div');
    body.style.cssText = 'padding: 4px 0;';

    if (schemes.length === 0) {
      body.innerHTML = '<div style="padding:10px;color:#666;text-align:center">No schemes available yet</div>';
    }

    for (const scheme of schemes) {
      const card = this._buildSchemeCard(scheme, themeColor);
      body.appendChild(card);
    }

    this._el.appendChild(body);

    // ── Outcome History ──
    const history = (ss.schemeHistory ?? []).slice(-3).reverse();
    if (history.length > 0) {
      const histDiv = document.createElement('div');
      histDiv.style.cssText = `
        padding: 6px 10px;
        border-top: 1px solid rgba(255,255,255,0.06);
      `;
      histDiv.innerHTML = '<div style="color:#888;font-size:11px;margin-bottom:4px">Recent:</div>';
      for (const h of history) {
        const badge = h.success
          ? '<span style="color:#4a4;font-size:10px">\u2714</span>'
          : '<span style="color:#a44;font-size:10px">\u2718</span>';
        const schemeDef = schemes.find(s => s.id === h.schemeId) ?? {};
        histDiv.innerHTML += `
          <div style="font-size:11px;color:#aaa;margin-bottom:2px">
            ${badge} ${schemeDef.name ?? h.schemeId} (Day ${h.day})
          </div>
        `;
      }
      this._el.appendChild(histDiv);
    }
  }

  /**
   * Build a single scheme card element.
   */
  _buildSchemeCard(scheme, themeColor) {
    const card = document.createElement('div');
    card.style.cssText = `
      padding: 8px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    `;

    // Tier badge
    const tierColors = { 1: '#5a5', 2: '#55a', 3: '#a55' };
    const tierColor = tierColors[scheme.tier] ?? '#888';
    const tierLabel = scheme.tier === 3 ? 'T3 Grand Slam' : `Tier ${scheme.tier}`;

    // Success rate bar
    const pct = Math.round(scheme.effectiveSuccessRate * 100);
    const barColor = pct >= 60 ? '#4a4' : pct >= 40 ? '#aa4' : '#a44';

    // Cooldown status
    let statusHtml = '';
    if (scheme.onCooldown) {
      statusHtml = `<span style="color:#a44;font-size:10px">Cooldown: ${scheme.cooldownDaysLeft}d</span>`;
    }

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <span style="color:${themeColor};font-weight:bold;font-size:12px">${scheme.name}</span>
        <span style="color:${tierColor};font-size:10px;border:1px solid ${tierColor};padding:1px 4px;border-radius:2px">${tierLabel}</span>
      </div>
      <div style="color:#999;font-size:11px;margin-bottom:4px">${scheme.description}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <span style="color:#ddd;font-size:11px">$${scheme.cost}</span>
        <div style="flex:1;background:#222;height:6px;border-radius:3px;overflow:hidden;border:1px solid #333">
          <div style="width:${pct}%;height:100%;background:${barColor};transition:width 0.3s"></div>
        </div>
        <span style="color:${barColor};font-size:11px;min-width:30px;text-align:right">${pct}%</span>
      </div>
      ${statusHtml}
    `;

    // Launch button
    if (!this.state.schemeState.activeScheme) {
      const btn = document.createElement('button');
      const canLaunch = scheme.canLaunch;
      btn.style.cssText = canLaunch
        ? `background:#1a2a4a;color:#fff;border:1px solid #a0522d;padding:4px 10px;font-family:monospace;font-size:11px;cursor:pointer;border-radius:2px;margin-top:4px;width:100%`
        : `background:#3a3a3a;color:#666;border:1px solid #4a4a4a;padding:4px 10px;font-family:monospace;font-size:11px;cursor:default;border-radius:2px;margin-top:4px;width:100%`;
      btn.textContent = canLaunch ? 'Launch Scheme' : (scheme.onCooldown ? 'On Cooldown' : (this.state.money < scheme.cost ? 'Not Enough $' : 'Unavailable'));
      btn.disabled = !canLaunch;

      if (canLaunch) {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.eventBus.emit('ui:click');
          this.eventBus.emit('scheme:launch', { schemeId: scheme.id });
        });
      }

      card.appendChild(btn);
    }

    return card;
  }
}
