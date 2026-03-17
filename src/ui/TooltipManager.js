/**
 * TooltipManager — Shows contextual tooltips on hover.
 *
 * Displays filter info, cost breakdowns, tile descriptions,
 * and event details when the player hovers over game elements.
 */

import { TILES } from '../rendering/TileMap.js';
import { FiltrationSystem } from '../systems/FiltrationSystem.js';
import { NPC_DATA } from '../data/storyData.js';

// Human-readable tile names
const TILE_NAMES = {
  [TILES.EMPTY]:       null,
  [TILES.FLOOR]:       'Mechanical Floor',
  [TILES.WALL]:        'Stadium Wall',
  [TILES.PIPE]:        'Pipe Network',
  [TILES.VENT_SLOT]:   'Vent Slot (click to install filter)',
  [TILES.SEATING]:     'Spectator Seating',
  [TILES.CONCOURSE]:   'General Concourse',
  [TILES.LUXURY]:      'Luxury Box',
  [TILES.PRESS]:       'Press Box',
  [TILES.FIELD]:       'Playing Field',
  [TILES.UNDERGROUND]: 'Underground Utility',
  [TILES.SKY]:         null,
  [TILES.ROOF]:        'Stadium Roof',
  [TILES.UTILITY]:     'Utility Room',
};

export class TooltipManager {
  constructor(container, state, eventBus) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;

    this.el = document.createElement('div');
    this.el.id = 'tooltip';
    this.el.style.cssText = `
      position: absolute;
      display: none;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #8b4513;
      border-radius: 2px;
      font-size: 10px;
      font-family: monospace;
      color: #d0d0e0;
      pointer-events: none;
      z-index: 40;
      max-width: 180px;
      line-height: 1.3;
    `;
    container.appendChild(this.el);
  }

  /**
   * Show tooltip at screen position with HTML content.
   */
  show(x, y, html) {
    this.el.innerHTML = html;
    this.el.style.display = 'block';

    // Position with boundary clamping
    const rect = this.container.getBoundingClientRect();
    const tipW = this.el.offsetWidth;
    const tipH = this.el.offsetHeight;

    let left = x + 12;
    let top = y + 12;

    if (left + tipW > rect.width) left = x - tipW - 4;
    if (top + tipH > rect.height) top = y - tipH - 4;
    if (left < 0) left = 4;
    if (top < 0) top = 4;

    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
  }

  /**
   * Hide the tooltip.
   */
  hide() {
    this.el.style.display = 'none';
  }

  /**
   * Show a tooltip for a filter object.
   */
  showForFilter(x, y, filter) {
    // Look up name from nested filtrationSystems config
    const systemDef = this.state.config.filtrationSystems?.[filter.domain];
    const compDef = systemDef?.components?.[filter.componentType];
    const tierDef = compDef?.tiers?.find(t => t.tier === filter.tier);
    const name = tierDef?.name ?? compDef?.name ?? filter.type ?? 'Filter';
    const brand = tierDef?.brand ?? '';
    const domainName = systemDef?.name ?? filter.domain ?? '';

    const status = FiltrationSystem.getFilterStatus(filter);
    const condPct = filter.maxCondition > 0
      ? Math.floor((filter.condition / filter.maxCondition) * 100) : 0;

    const statusColors = {
      healthy: '#00e436', degraded: '#ffa300', warning: '#ff8800',
      critical: '#ff004d', broken: '#ff004d',
    };

    // Domain health line with consequence warning
    let domainHealthLine = '';
    const dh = this.state.domainHealth;
    const domainKey = filter.domain;
    if (dh && domainKey && dh[domainKey] != null) {
      const score = Math.floor(dh[domainKey]);
      const dhColor = score > 80 ? '#00e436' : score >= 50 ? '#ffec27' : score >= 25 ? '#ffa300' : '#ff004d';
      const consequenceHints = {
        air:      'Haze building up',
        water:    'Brown water in fixtures',
        hvac:     'Temperature complaints',
        drainage: 'Standing water pooling',
      };
      const warn = score < 50 ? ` \u26a0 ${consequenceHints[domainKey] ?? 'Degrading'}` : '';
      domainHealthLine = `<div style="font-size:9px;color:${dhColor}">${domainName} Health: ${score}%${warn}</div>`;
    }

    // Repair cost estimate (30% of tier cost, or 2.5x if broken)
    let repairLine = '';
    if (tierDef && filter.condition < filter.maxCondition) {
      const baseRepairCost = Math.floor(tierDef.cost * 0.3);
      const repairCost = filter.condition <= 0
        ? Math.floor(baseRepairCost * 2.5)
        : baseRepairCost;
      repairLine = `<div style="font-size:9px;color:#ffa300">Repair: $${repairCost.toLocaleString()}</div>`;
    }

    // Installed day
    let installedLine = '';
    if (filter.installedDay) {
      installedLine = `<div style="font-size:9px;color:#888">Installed: Day ${filter.installedDay}</div>`;
    }

    // Staff assignment status
    let staffLine = '';
    const staff = this.state.staff ?? [];
    const assignedStaff = staff.filter(s => s.assignedDomain === filter.domain);
    if (assignedStaff.length > 0) {
      staffLine = `<div style="font-size:9px;color:#29adff">Staff: ${assignedStaff.map(s => s.name).join(', ')}</div>`;
    } else {
      staffLine = `<div style="font-size:9px;color:#555">No staff assigned</div>`;
    }

    // Archetype tag and passive info
    const archetypeColors = { WORKHORSE: '#7ec850', BOOSTER: '#ff6c24', SPECIALIST: '#a78bfa' };
    const archetype = tierDef?.passive ? 'SPECIALIST' : ((tierDef?.domainHealthBonus ?? 0) >= 5 ? 'BOOSTER' : 'WORKHORSE');
    const archetypeTag = tierDef ? `<span style="color:${archetypeColors[archetype]};font-size:8px;letter-spacing:1px">${archetype}</span>` : '';
    const passiveDescs = { weatherShield: 'Weather Shield', crossDomain: 'Cross Domain (HVAC)', maintenanceSaver: 'Maint. Saver', crisisArmor: 'Crisis Armor' };
    const passiveLine = tierDef?.passive ? `<div style="font-size:8px;color:#a78bfa">\u2728 ${passiveDescs[tierDef.passive] ?? tierDef.passive}</div>` : '';
    const dhbLine = (tierDef?.domainHealthBonus ?? 0) > 0 ? `<div style="font-size:9px;color:#4fc">+${tierDef.domainHealthBonus} Domain Health</div>` : '';

    this.show(x, y, `
      <div style="color:#ffec27;margin-bottom:2px"><strong>${brand ? `${brand} — ` : ''}${name}</strong> ${archetypeTag}</div>
      ${domainName ? `<div style="color:${systemDef?.color ?? '#888'};font-size:9px">${domainName}</div>` : ''}
      <div>Status: <span style="color:${statusColors[status]}">${status}</span></div>
      <div>Condition: ${condPct}%</div>
      <div>Efficiency: ${Math.floor(filter.efficiency * 100)}%</div>
      ${dhbLine}
      ${passiveLine}
      ${repairLine}
      ${installedLine}
      ${staffLine}
      ${domainHealthLine}
      <div style="color:#888;font-size:9px;margin-top:2px">Click to inspect</div>
    `);
  }

  /**
   * Show a tooltip for a walking NPC character.
   */
  showForNpc(x, y, npcId) {
    const npc = NPC_DATA[npcId];
    if (!npc) { this.hide(); return; }
    const rel = this.state.npcRelationships?.[npcId] ?? 0;
    const tiers = npc.relationshipTiers ?? [];
    let tierName = 'Unknown';
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (rel >= tiers[i].threshold) { tierName = tiers[i].name; break; }
    }
    const chatted = this.state.npcLastChat?.[npcId] === this.state.gameDay;
    const chatLine = chatted
      ? '<div style="color:#666;font-size:8px">Already spoke today</div>'
      : '<div style="color:#888;font-size:9px">Click to chat</div>';
    this.show(x, y, `<div style="color:${npc.themeColor}"><strong>${npc.name}</strong></div><div style="color:#888;font-size:9px">${npc.role} \u00b7 ${tierName}</div>${chatLine}`);
  }

  /**
   * Show a tooltip for an interactive environment object.
   */
  showForObject(x, y, obj) {
    this.show(x, y, `<div style="color:#ffec27"><strong>${obj.icon ?? '\u{1f50d}'} ${obj.name}</strong></div><div style="color:#888;font-size:9px">Click to inspect</div>`);
  }

  /**
   * Show a tooltip for a tile type.
   * @param {number} x - Screen x
   * @param {number} y - Screen y
   * @param {number} tileId - Tile type ID
   * @param {object} [ventSlot] - Optional vent slot definition { col, row, domain }
   * @param {object} [placementMode] - Optional placement mode data { domain, componentType, tier }
   */
  showForTile(x, y, tileId, ventSlot, placementMode) {
    const name = TILE_NAMES[tileId];
    if (!name) {
      this.hide();
      return;
    }

    let extra = '';
    if (tileId === TILES.VENT_SLOT) {
      const domainNames = { air: 'Air', water: 'Water', hvac: 'HVAC', drainage: 'Drainage' };
      const domainColors = { air: '#cccccc', water: '#4488ff', hvac: '#ff8844', drainage: '#44bb44' };
      const slotDomain = ventSlot?.domain;

      // Show filter stats being placed during placement mode
      if (placementMode) {
        const pm = placementMode;
        const sys = this.state.config.filtrationSystems?.[pm.domain];
        const comp = sys?.components?.[pm.componentType];
        const tierDef = comp?.tiers?.find(t => t.tier === pm.tier);
        if (tierDef) {
          const domainMatch = !slotDomain || !pm.domain || slotDomain === pm.domain;
          const pmColor = domainColors[pm.domain] ?? '#888';
          const archetype = tierDef.passive ? 'SPECIALIST' : ((tierDef.domainHealthBonus ?? 0) >= 5 ? 'BOOSTER' : 'WORKHORSE');
          const archetypeColors = { WORKHORSE: '#7ec850', BOOSTER: '#ff6c24', SPECIALIST: '#a78bfa' };
          const bonusVal = tierDef.qualityBonus ?? tierDef.comfortBonus ?? tierDef.integrityBonus ?? 0;
          const bonusLabel = sys?.metricName ?? 'Bonus';
          const dhb = tierDef.domainHealthBonus ?? 0;
          const passiveDescs = { weatherShield: 'Weather Shield', crossDomain: 'Cross Domain (HVAC)', maintenanceSaver: 'Maint. Saver', crisisArmor: 'Crisis Armor' };

          extra += `<div style="margin-top:3px;border-top:1px solid #333;padding-top:3px">`;
          extra += `<div style="color:#ffec27;font-size:9px"><strong>${tierDef.brand ? `${tierDef.brand} ` : ''}${tierDef.name}</strong></div>`;
          extra += `<div style="color:${archetypeColors[archetype]};font-size:8px;letter-spacing:1px">${archetype}</div>`;
          extra += `<div style="font-size:8px;color:#aaa">${tierDef.lifespanGames}d lifespan | \u26a1$${tierDef.energyPerDay}/day</div>`;
          extra += `<div style="font-size:8px;color:#29adff">+${bonusVal} ${bonusLabel}</div>`;
          if (dhb > 0) extra += `<div style="font-size:8px;color:#4fc">+${dhb} Domain Health</div>`;
          if (tierDef.passive) extra += `<div style="font-size:8px;color:#a78bfa">\u2728 ${passiveDescs[tierDef.passive] ?? tierDef.passive}</div>`;
          if (!domainMatch) {
            const slotName = domainNames[slotDomain] ?? slotDomain;
            const filterName = domainNames[pm.domain] ?? pm.domain;
            extra += `<div style="font-size:8px;color:#ff004d;margin-top:2px">\u2716 ${filterName} filter \u2192 ${slotName} slot</div>`;
          } else {
            extra += `<div style="font-size:8px;color:#00e436;margin-top:2px">Click to install ($${tierDef.cost.toLocaleString()})</div>`;
          }
          extra += `</div>`;
        }
      }

      if (slotDomain) {
        const dName = domainNames[slotDomain] ?? slotDomain;
        const dColor = domainColors[slotDomain] ?? '#888';
        extra += `<div style="color:${dColor};font-size:9px;margin-top:1px">${dName} Connection</div>`;

        // Filter count for this domain in the current zone
        const currentZone = this.state.currentZone ?? 'mechanical';
        const domainFiltersInZone = (this.state.filters ?? []).filter(
          f => f.domain === slotDomain && (f.zone ?? 'mechanical') === currentZone
        ).length;
        extra += `<div style="font-size:8px;color:#888">${domainFiltersInZone} ${dName} filter${domainFiltersInZone !== 1 ? 's' : ''} in zone</div>`;

        // Show domain health
        const dh = this.state.domainHealth;
        if (dh && dh[slotDomain] != null) {
          const s = Math.floor(dh[slotDomain]);
          const c = s > 80 ? '#00e436' : s >= 50 ? '#ffec27' : s >= 25 ? '#ffa300' : '#ff004d';
          extra += `<div style="font-size:8px;color:${c}">${dName} Health: ${s}%${s < 50 ? ' \u26a0' : ''}</div>`;
        }
      } else {
        // Legacy slots without domain — show all domain healths
        const dh = this.state.domainHealth;
        if (dh) {
          const domains = [
            { key: 'air', label: 'Air' },
            { key: 'water', label: 'Water' },
            { key: 'hvac', label: 'HVAC' },
            { key: 'drainage', label: 'Drainage' },
          ];
          const lines = domains
            .filter(d => dh[d.key] != null && dh[d.key] < 80)
            .map(d => {
              const s = Math.floor(dh[d.key]);
              const c = s >= 50 ? '#ffec27' : s >= 25 ? '#ffa300' : '#ff004d';
              return `<div style="font-size:8px;color:${c}">${d.label}: ${s}%${s < 50 ? ' \u26a0' : ''}</div>`;
            });
          if (lines.length) extra = `<div style="margin-top:2px;border-top:1px solid #333;padding-top:2px">${lines.join('')}</div>`;
        }
      }
    }

    this.show(x, y, `<div>${name}</div>${extra}`);
  }
}
