/**
 * SystemsPanel — Visual diagram showing upstream/downstream flow of all 4 filter domains.
 *
 * Displays how water, air, HVAC, and drainage systems interconnect across the stadium,
 * with color-coded health indicators and clickable zone links.
 * Shows active synergy bonuses/stresses between paired domains.
 */

import { PanelManager } from './PanelManager.js';

// Synergy pairs: domains that boost each other when both healthy or stress each other when one fails.
// Derived from gameConfig.systemInteractions (water<->drainage, hvac<->air are bidirectional pairs).
const SYNERGY_PAIRS = [
  { a: 'air', b: 'hvac', label: 'HVAC\u2194Air', boostPct: 3, stressPct: 3 },
  { a: 'water', b: 'drainage', label: 'Water\u2194Drainage', boostPct: 3, stressPct: 3 },
];

// Threshold for synergy activation (both domains above this %)
const SYNERGY_BOOST_THRESHOLD = 70;
// Threshold for stress activation (either domain below this %)
const SYNERGY_STRESS_THRESHOLD = 30;

export class SystemsPanel {
  constructor(panelManager, state, eventBus, zoneManager) {
    this.state = state;
    this.eventBus = eventBus;
    this.zoneManager = zoneManager;

    // Track last synergy states to detect transitions on new day
    this._lastSynergyStates = {};

    panelManager.register('systems', (el, state, eventBus) => {
      this._render(el);
    });

    this.eventBus.on('ui:toggleSystems', () => {
      if (panelManager.isOpen('systems')) {
        this.eventBus.emit('ui:closePanel');
      } else {
        this.eventBus.emit('ui:openPanel', { name: 'systems' });
      }
    });

    // Check synergy state changes each new day and emit toasts
    this.eventBus.on('game:newDay', () => this._checkSynergyTransitions());
  }

  /**
   * Compute current synergy states for all pairs.
   * Returns map of pair label -> { active: bool, stressed: bool }
   */
  _computeSynergyStates() {
    const health = this.state.domainHealth ?? { air: 100, water: 100, hvac: 100, drainage: 100 };
    const states = {};
    for (const pair of SYNERGY_PAIRS) {
      const ha = health[pair.a] ?? 100;
      const hb = health[pair.b] ?? 100;
      states[pair.label] = {
        active: ha > SYNERGY_BOOST_THRESHOLD && hb > SYNERGY_BOOST_THRESHOLD,
        stressed: ha < SYNERGY_STRESS_THRESHOLD || hb < SYNERGY_STRESS_THRESHOLD,
        pair,
      };
    }
    return states;
  }

  /**
   * On each new day, check if synergy states changed and emit toast notifications.
   */
  _checkSynergyTransitions() {
    const current = this._computeSynergyStates();
    for (const [label, state] of Object.entries(current)) {
      const prev = this._lastSynergyStates[label];
      if (prev) {
        if (state.active && !prev.active) {
          this.eventBus.emit('ui:message', {
            text: `${label} synergy activated! +${state.pair.boostPct}% efficiency`,
            type: 'success',
          });
        } else if (!state.active && prev.active) {
          this.eventBus.emit('ui:message', {
            text: `${label} synergy lost — domain health dropped`,
            type: 'warning',
          });
        }
        if (state.stressed && !prev.stressed) {
          this.eventBus.emit('ui:message', {
            text: `Warning: ${label} stress active! -${state.pair.stressPct}% efficiency`,
            type: 'warning',
          });
        } else if (!state.stressed && prev.stressed) {
          this.eventBus.emit('ui:message', {
            text: `${label} stress resolved — systems recovering`,
            type: 'success',
          });
        }
      }
    }
    this._lastSynergyStates = current;
  }

  _render(el) {
    const health = this.state.domainHealth ?? { air: 100, water: 100, hvac: 100, drainage: 100 };

    el.style.cssText = `
      position: absolute; top: 24px; left: 3%; right: 3%; bottom: 24px;
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
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:2px solid #8b4513;background:linear-gradient(180deg,rgba(139,69,19,0.15),rgba(0,0,0,0.3));">
        <strong style="color:#29adff;letter-spacing:1px">STADIUM SYSTEMS OVERVIEW</strong>
        <span data-action="close-systems" style="cursor:pointer;color:#888;font-size:12px">\u2715</span>
      </div>
    `;

    // Compute synergy states for display
    const synergyStates = this._computeSynergyStates();

    // Synergy banner between header and grid
    html += this._buildSynergyBanner(synergyStates);

    // System diagrams in 2x2 grid
    html += `<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;overflow-y:auto;">`;

    html += this._buildDomainCard('water', 'WATER SYSTEM', health.water, [
      { label: 'City Water Main', type: 'source' },
      { label: 'Cooling Towers', type: 'source' },
      { label: 'WATER FILTERS', type: 'filter', score: health.water },
      { label: 'Restrooms', type: 'output', zone: 'concourse' },
      { label: 'Concessions / Ice', type: 'output', zone: 'concourse' },
      { label: 'Field Irrigation', type: 'output', zone: 'field', effect: 'Grass Quality' },
      { label: 'HVAC Chillers', type: 'output', zone: 'mechanical' },
    ], '#4488ff', 'Brown water, dead grass, contamination');

    html += this._buildDomainCard('air', 'AIR SYSTEM', health.air, [
      { label: 'Outside Air Intake', type: 'source' },
      { label: 'Recirculated Air', type: 'source' },
      { label: 'AIR FILTERS (HEPA)', type: 'filter', score: health.air },
      { label: 'Concourse (fans)', type: 'output', zone: 'concourse' },
      { label: 'Luxury Suites', type: 'output', zone: 'luxury' },
      { label: 'Press Box', type: 'output', zone: 'pressbox' },
    ], '#cccccc', 'Haze, fan complaints, health violations');

    html += this._buildDomainCard('hvac', 'HVAC SYSTEM', health.hvac, [
      { label: 'Boilers / Chillers', type: 'source' },
      { label: 'HVAC FILTERS', type: 'filter', score: health.hvac },
      { label: 'Humidity Control', type: 'output', effect: 'Baseball Storage' },
      { label: 'Temp Control', type: 'output', effect: 'Server Room, Food Safety' },
      { label: 'All Zones', type: 'output' },
    ], '#ff8844', 'Moldy baseballs, overheating, food spoilage');

    html += this._buildDomainCard('drainage', 'DRAINAGE SYSTEM', health.drainage, [
      { label: 'Rain / Runoff', type: 'source' },
      { label: 'Stadium Sewage', type: 'source' },
      { label: 'DRAIN FILTERS', type: 'filter', score: health.drainage },
      { label: 'Storm Sewers', type: 'output' },
      { label: 'Field SubAir', type: 'output', zone: 'field', effect: 'Field Conditions' },
      { label: 'City Treatment', type: 'output' },
    ], '#44bb44', 'Flooding, muddy field, Browntide, pests');

    html += `</div>`;

    el.innerHTML = html;

    // Click handlers
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close-systems"]')) {
        this.eventBus.emit('ui:closePanel');
        return;
      }
      const zoneLink = e.target.closest('[data-goto-zone]');
      if (zoneLink && this.zoneManager) {
        this.zoneManager.switchZone(zoneLink.dataset.gotoZone);
        this.eventBus.emit('ui:closePanel');
      }
    });
  }

  /**
   * Build synergy banner showing active synergy/stress states between domain pairs.
   */
  _buildSynergyBanner(synergyStates) {
    const entries = Object.values(synergyStates);
    const hasAnySynergy = entries.some(s => s.active || s.stressed);

    if (!hasAnySynergy) {
      return `<div style="padding:3px 12px;font-size:8px;color:#555;border-bottom:1px solid #333;background:rgba(0,0,0,0.2);">
        Synergies: No active cross-domain bonuses. Keep paired systems above 70% to activate.
      </div>`;
    }

    let html = `<div style="display:flex;gap:8px;padding:4px 12px;border-bottom:1px solid #333;background:rgba(0,0,0,0.2);flex-wrap:wrap;">`;
    for (const s of entries) {
      if (s.active) {
        html += `<span title="${s.pair.label}: Both domains above ${SYNERGY_BOOST_THRESHOLD}%. +${s.pair.boostPct}% efficiency to both." style="font-size:8px;color:#00e436;background:rgba(0,228,54,0.1);border:1px solid #00e43644;padding:1px 6px;border-radius:2px;cursor:default;">${s.pair.label} Synergy Active: +${s.pair.boostPct}%</span>`;
      }
      if (s.stressed) {
        html += `<span title="${s.pair.label}: A domain dropped below ${SYNERGY_STRESS_THRESHOLD}%. -${s.pair.stressPct}% efficiency penalty." style="font-size:8px;color:#ff004d;background:rgba(255,0,77,0.1);border:1px solid #ff004d44;padding:1px 6px;border-radius:2px;cursor:default;">${s.pair.label} Stress: -${s.pair.stressPct}%</span>`;
      }
    }
    html += `</div>`;
    return html;
  }

  /**
   * Build synergy tooltip text for a given domain.
   */
  _getSynergyTooltip(domain) {
    const health = this.state.domainHealth ?? {};
    const interactions = this.state.config?.systemInteractions ?? [];
    const lines = [];

    // Find config interactions involving this domain
    for (const ix of interactions) {
      if (ix.source === domain) {
        lines.push(`Affects ${ix.target}: ${ix.effect} (${ix.severity})`);
      }
      if (ix.target === domain) {
        lines.push(`Affected by ${ix.source}: ${ix.effect} (${ix.severity})`);
      }
    }

    // Check synergy pair status
    for (const pair of SYNERGY_PAIRS) {
      if (pair.a === domain || pair.b === domain) {
        const partner = pair.a === domain ? pair.b : pair.a;
        const partnerHealth = health[partner] ?? 100;
        const myHealth = health[domain] ?? 100;
        if (myHealth > SYNERGY_BOOST_THRESHOLD && partnerHealth > SYNERGY_BOOST_THRESHOLD) {
          lines.push(`Synergy with ${partner}: +${pair.boostPct}% efficiency (both >70%)`);
        } else if (myHealth < SYNERGY_STRESS_THRESHOLD || partnerHealth < SYNERGY_STRESS_THRESHOLD) {
          lines.push(`Stress with ${partner}: -${pair.stressPct}% efficiency (one <30%)`);
        } else {
          lines.push(`Pair: ${partner} — keep both >70% for synergy bonus`);
        }
      }
    }

    return lines.length > 0 ? lines.join(' | ') : 'No cross-domain interactions';
  }

  _buildDomainCard(domain, title, score, nodes, color, failureText) {
    const scoreColor = score > 80 ? '#00e436' : score > 50 ? '#ffec27' : score > 25 ? '#ffa300' : '#ff004d';
    const scoreLabel = score > 80 ? 'EXCELLENT' : score > 50 ? 'ADEQUATE' : score > 25 ? 'WARNING' : 'CRITICAL';

    // Get synergy tooltip for this domain
    const synergyTip = this._getSynergyTooltip(domain);

    let html = `
      <div style="
        background: rgba(0,0,0,0.3);
        border: 1px solid ${score > 50 ? color + '44' : '#ff004d66'};
        border-radius: 3px; padding: 8px;
      " title="${synergyTip}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="color:${color};font-weight:bold;font-size:11px">${title}</span>
          <span style="color:${scoreColor};font-size:9px;border:1px solid ${scoreColor};padding:1px 4px;border-radius:2px">${scoreLabel} ${score}%</span>
        </div>
    `;

    // Sources
    html += `<div style="margin-bottom:4px;">`;
    for (const node of nodes.filter(n => n.type === 'source')) {
      html += `<div style="color:#888;font-size:8px;padding:2px 4px;background:rgba(255,255,255,0.05);border-radius:2px;margin-bottom:2px;display:inline-block;margin-right:4px;">&gt; ${node.label}</div>`;
    }
    html += `</div>`;

    // Arrow down
    html += `<div style="text-align:center;color:${color};font-size:8px;line-height:1;">|</div>`;

    // Filter node (central, highlighted)
    const filterNode = nodes.find(n => n.type === 'filter');
    if (filterNode) {
      html += `
        <div style="
          text-align:center;margin:4px 0;padding:4px 8px;
          background:${scoreColor}22;
          border:2px ${score > 50 ? 'dashed' : 'solid'} ${scoreColor};
          border-radius:3px;color:${scoreColor};
          font-weight:bold;font-size:9px;
        ">
          [${filterNode.label}]
          <div style="font-size:7px;color:#888;margin-top:2px;">
            Health: ${score}% -- ${score > 0 ? Math.ceil(score / 10) : 0} filters active
          </div>
        </div>
      `;
    }

    // Arrow down
    html += `<div style="text-align:center;color:${color};font-size:8px;line-height:1;">|</div>`;

    // Outputs
    html += `<div style="margin-top:4px;">`;
    for (const node of nodes.filter(n => n.type === 'output')) {
      const zoneAttr = node.zone ? `data-goto-zone="${node.zone}" style="cursor:pointer;text-decoration:underline;"` : '';
      const effectText = node.effect ? ` -> <span style="color:${scoreColor}">${node.effect}</span>` : '';
      html += `<div style="color:#aaa;font-size:8px;padding:2px 4px;background:rgba(255,255,255,0.03);border-radius:2px;margin-bottom:2px;">`;
      html += `<span ${zoneAttr}>&gt; ${node.label}</span>${effectText}`;
      html += `</div>`;
    }
    html += `</div>`;

    // Failure warning
    if (score < 50) {
      html += `<div style="color:#ff004d;font-size:7px;margin-top:4px;padding:2px 4px;background:rgba(255,0,77,0.1);border-radius:2px;">WARNING: ${failureText}</div>`;
    }

    // Synergy indicator for this domain's paired partner
    html += this._buildDomainSynergyBadge(domain, score);

    html += `</div>`;
    return html;
  }

  /**
   * Build a small synergy badge at the bottom of a domain card.
   */
  _buildDomainSynergyBadge(domain, score) {
    const health = this.state.domainHealth ?? {};
    for (const pair of SYNERGY_PAIRS) {
      if (pair.a !== domain && pair.b !== domain) continue;
      const partner = pair.a === domain ? pair.b : pair.a;
      const partnerScore = health[partner] ?? 100;

      if (score > SYNERGY_BOOST_THRESHOLD && partnerScore > SYNERGY_BOOST_THRESHOLD) {
        return `<div style="font-size:7px;margin-top:4px;padding:2px 4px;background:rgba(0,228,54,0.1);border:1px solid #00e43633;border-radius:2px;color:#00e436;">
          ${pair.label} Synergy +${pair.boostPct}%
        </div>`;
      }
      if (score < SYNERGY_STRESS_THRESHOLD || partnerScore < SYNERGY_STRESS_THRESHOLD) {
        return `<div style="font-size:7px;margin-top:4px;padding:2px 4px;background:rgba(255,0,77,0.1);border:1px solid #ff004d33;border-radius:2px;color:#ff004d;">
          ${pair.label} Stress -${pair.stressPct}%
        </div>`;
      }
      // Inactive synergy — show hint
      return `<div style="font-size:7px;margin-top:4px;padding:2px 4px;color:#555;">
        Paired with ${partner} (both >70% for synergy)
      </div>`;
    }
    return '';
  }
}
