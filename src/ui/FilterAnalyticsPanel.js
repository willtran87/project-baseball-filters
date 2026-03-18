/**
 * FilterAnalyticsPanel — Dashboard showing filter fleet health, per-domain stats,
 * maintenance costs, and recommended actions.
 *
 * Toggle via `ui:toggleFilterAnalytics` event or 'a' keyboard shortcut.
 * Registered with PanelManager as 'filterAnalytics'.
 */

export class FilterAnalyticsPanel {
  constructor(panelManager, state, eventBus, zoneManager) {
    this.state = state;
    this.eventBus = eventBus;
    this.zoneManager = zoneManager;

    panelManager.register('filterAnalytics', (el, state, eventBus) => {
      this._render(el);
    });

    this.eventBus.on('ui:toggleFilterAnalytics', () => {
      if (panelManager.isOpen('filterAnalytics')) {
        this.eventBus.emit('ui:closePanel');
      } else {
        this.eventBus.emit('ui:openPanel', { name: 'filterAnalytics' });
      }
    });
  }

  _render(el) {
    const s = this.state;
    const config = s.config;
    const filters = s.filters ?? [];
    const domains = Object.keys(config?.filtrationSystems ?? { air: 1, water: 1, hvac: 1, drainage: 1 });
    const domainNames = { air: 'Air', water: 'Water', hvac: 'HVAC', drainage: 'Drainage', electrical: 'Electrical', pest: 'Pest Control' };
    const domainColors = { air: '#cccccc', water: '#4488ff', hvac: '#ff8844', drainage: '#44bb44', electrical: '#ffcc00', pest: '#cc44cc' };
    const zoneNames = {
      field: 'Field', concourse: 'Concourse', mechanical: 'Mechanical',
      underground: 'Underground', luxury: 'Luxury', pressbox: 'Press Box',
    };

    // Full-screen panel styling matching SystemsPanel
    el.style.cssText = `
      position: absolute; top: 24px; left: 3%; right: 3%; bottom: 24px;
      background: linear-gradient(180deg, rgba(10,8,20,0.97), rgba(8,8,24,0.97));
      border: 2px solid #8b4513;
      border-radius: 4px;
      font-family: monospace; color: #e0e0e0;
      font-size: 14px; z-index: 30;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(139,69,19,0.2);
    `;

    // Count total vent slots per domain across all zones
    const totalSlotsByDomain = {};
    for (const d of domains) totalSlotsByDomain[d] = 0;
    const zoneIds = this.zoneManager?.getZoneIds() ?? [];
    for (const zoneId of zoneIds) {
      const zone = this.zoneManager.getZone(zoneId);
      if (!zone?.ventSlots) continue;
      for (const slot of zone.ventSlots) {
        if (totalSlotsByDomain[slot.domain] !== undefined) {
          totalSlotsByDomain[slot.domain]++;
        }
      }
    }

    // Per-domain stats
    const domainStats = {};
    for (const d of domains) {
      const domainFilters = filters.filter(f => f.domain === d);
      const count = domainFilters.length;
      const totalSlots = totalSlotsByDomain[d];
      const avgCondition = count > 0
        ? domainFilters.reduce((sum, f) => sum + (f.maxCondition > 0 ? f.condition / f.maxCondition : 0), 0) / count
        : 0;
      const avgEfficiency = count > 0
        ? domainFilters.reduce((sum, f) => sum + (f.efficiency ?? 1), 0) / count
        : 0;
      const healthy = domainFilters.filter(f => f.maxCondition > 0 && f.condition / f.maxCondition > 0.75).length;
      const worn = domainFilters.filter(f => {
        const r = f.maxCondition > 0 ? f.condition / f.maxCondition : 0;
        return r > 0.25 && r <= 0.75;
      }).length;
      const critical = domainFilters.filter(f => {
        const r = f.maxCondition > 0 ? f.condition / f.maxCondition : 0;
        return r > 0 && r <= 0.25;
      }).length;
      const broken = domainFilters.filter(f => f.condition <= 0).length;
      domainStats[d] = { count, totalSlots, avgCondition, avgEfficiency, healthy, worn, critical, broken };
    }

    // Fleet summary
    const totalInstalled = filters.length;
    const totalMaintenanceCost = filters.reduce((sum, f) => {
      const tierDef = this._getTierDef(f);
      const repairCost = tierDef ? Math.floor(tierDef.cost * 0.3) : 0;
      // Estimate daily maintenance as fraction of repair cost based on degradation rate
      return sum + Math.floor(repairCost * 0.1);
    }, 0);
    const needingAttention = filters.filter(f => f.maxCondition > 0 && f.condition / f.maxCondition < 0.50);
    const lowestFilter = filters.length > 0
      ? filters.reduce((min, f) => {
          const ratio = f.maxCondition > 0 ? f.condition / f.maxCondition : 2; // broken filters are ratio 0
          const minRatio = min.maxCondition > 0 ? min.condition / min.maxCondition : 2;
          return ratio < minRatio ? f : min;
        })
      : null;

    // Recommendations
    const recommendations = [];
    for (const f of filters) {
      const ratio = f.maxCondition > 0 ? f.condition / f.maxCondition : 0;
      if (ratio > 0 && ratio < 0.25) {
        const name = this._getFilterName(f);
        const zone = zoneNames[f.zone] ?? f.zone ?? '?';
        recommendations.push({
          priority: 'critical',
          text: `Replace ${name} in ${zone} -- critically worn (${Math.floor(ratio * 100)}%)`,
        });
      }
    }
    // Preventive maintenance suggestions
    const preventiveFilters = filters.filter(f => {
      const r = f.maxCondition > 0 ? f.condition / f.maxCondition : 0;
      return r > 0.25 && r <= 0.50;
    });
    if (preventiveFilters.length > 0) {
      recommendations.push({
        priority: 'warning',
        text: `Consider preventive maintenance on ${preventiveFilters.length} filter${preventiveFilters.length > 1 ? 's' : ''}`,
      });
    }
    // Under-filtered domains
    for (const d of domains) {
      const emptySlots = domainStats[d].totalSlots - domainStats[d].count;
      if (emptySlots > 0) {
        recommendations.push({
          priority: 'info',
          text: `${domainNames[d]} is under-filtered -- ${emptySlots} empty slot${emptySlots > 1 ? 's' : ''}`,
        });
      }
    }

    let html = '';

    // Header
    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:2px solid #8b4513;background:linear-gradient(180deg,rgba(139,69,19,0.15),rgba(0,0,0,0.3));">
        <strong style="color:#29adff;letter-spacing:1px">FILTER ANALYTICS</strong>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="color:#888;font-size:11px">[A] to toggle</span>
          <span data-action="close-analytics" style="cursor:pointer;color:#888;font-size:14px">\u2715</span>
        </div>
      </div>
    `;

    // Main content in two columns
    html += `<div style="flex:1;display:flex;gap:8px;padding:8px;overflow-y:auto;">`;

    // Left column: Per-domain overview (2x2 grid)
    html += `<div style="flex:1;display:flex;flex-direction:column;gap:6px;">`;
    html += `<div style="color:#888;font-size:11px;letter-spacing:1px;margin-bottom:2px">PER-DOMAIN OVERVIEW</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;flex:1;">`;
    for (const d of domains) {
      const ds = domainStats[d];
      const avgCondPct = Math.floor(ds.avgCondition * 100);
      const avgEffPct = Math.floor(ds.avgEfficiency * 100);
      const condColor = avgCondPct > 75 ? '#00e436' : avgCondPct > 50 ? '#ffa300' : avgCondPct > 25 ? '#ff8800' : '#ff004d';
      html += `
        <div style="background:rgba(20,20,40,0.8);border:1px solid ${domainColors[d]}44;border-radius:3px;padding:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="color:${domainColors[d]};font-weight:bold;font-size:12px">${domainNames[d]}</span>
            <span style="color:#888;font-size:11px">${ds.count}/${ds.totalSlots} slots</span>
          </div>
          <div style="background:#222;height:4px;margin-bottom:4px;border-radius:2px">
            <div style="background:${condColor};height:100%;width:${avgCondPct}%;border-radius:2px;transition:width 0.3s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#aaa;margin-bottom:3px">
            <span>Avg Cond: <span style="color:${condColor}">${avgCondPct}%</span></span>
            <span>Eff: ${avgEffPct}%</span>
          </div>
          <div style="font-size:10px;color:#777">
            ${ds.healthy > 0 ? `<span style="color:#00e436">${ds.healthy} healthy</span>` : ''}
            ${ds.worn > 0 ? `<span style="color:#ffa300"> ${ds.worn} worn</span>` : ''}
            ${ds.critical > 0 ? `<span style="color:#ff8800"> ${ds.critical} critical</span>` : ''}
            ${ds.broken > 0 ? `<span style="color:#ff004d"> ${ds.broken} broken</span>` : ''}
            ${ds.count === 0 ? '<span style="color:#555">No filters</span>' : ''}
          </div>
        </div>
      `;
    }
    html += `</div></div>`;

    // Right column: Fleet summary + Recommendations
    html += `<div style="flex:1;display:flex;flex-direction:column;gap:6px;">`;

    // Fleet summary
    html += `<div style="color:#888;font-size:11px;letter-spacing:1px;margin-bottom:2px">FILTER FLEET SUMMARY</div>`;
    html += `<div style="background:rgba(20,20,40,0.8);border:1px solid #333;border-radius:3px;padding:8px;">`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:12px;">`;
    html += `<div>Total installed:</div><div style="color:#29adff">${totalInstalled}</div>`;
    html += `<div>Daily maintenance est:</div><div style="color:#ffa300">$${totalMaintenanceCost.toLocaleString()}</div>`;
    html += `<div>Needing attention:</div><div style="color:${needingAttention.length > 0 ? '#ff8800' : '#00e436'}">${needingAttention.length}</div>`;
    if (lowestFilter && lowestFilter.maxCondition > 0) {
      const lowestName = this._getFilterName(lowestFilter);
      const lowestZone = zoneNames[lowestFilter.zone] ?? lowestFilter.zone ?? '?';
      const lowestPct = Math.floor((lowestFilter.condition / lowestFilter.maxCondition) * 100);
      const lowestColor = lowestPct > 75 ? '#00e436' : lowestPct > 50 ? '#ffa300' : lowestPct > 25 ? '#ff8800' : '#ff004d';
      html += `<div>Next to fail:</div><div style="color:${lowestColor}">${lowestName} (${lowestZone}) ${lowestPct}%</div>`;
    } else {
      html += `<div>Next to fail:</div><div style="color:#555">None</div>`;
    }
    html += `</div></div>`;

    // Recommended actions
    html += `<div style="color:#888;font-size:11px;letter-spacing:1px;margin-top:4px;margin-bottom:2px">RECOMMENDED ACTIONS</div>`;
    html += `<div style="background:rgba(20,20,40,0.8);border:1px solid #333;border-radius:3px;padding:8px;flex:1;overflow-y:auto;">`;
    if (recommendations.length === 0) {
      html += `<div style="color:#00e436;font-size:12px;padding:6px">All systems nominal. No actions needed.</div>`;
    } else {
      for (const rec of recommendations) {
        const iconColors = { critical: '#ff004d', warning: '#ff8800', info: '#29adff' };
        const icons = { critical: '!!', warning: '!', info: '*' };
        html += `
          <div style="padding:5px 6px;margin-bottom:3px;font-size:12px;border-left:2px solid ${iconColors[rec.priority]};padding-left:8px">
            <span style="color:${iconColors[rec.priority]}">${icons[rec.priority]}</span>
            <span style="color:#ccc">${rec.text}</span>
          </div>
        `;
      }
    }
    html += `</div>`;

    html += `</div>`; // end right column
    html += `</div>`; // end main content

    el.innerHTML = html;

    // Click handler
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close-analytics"]')) {
        this.eventBus.emit('ui:closePanel');
      }
    });
  }

  /**
   * Look up the tier definition for a filter from config.
   */
  _getTierDef(filter) {
    const systems = this.state.config?.filtrationSystems ?? {};
    const domainDef = systems[filter.domain];
    if (!domainDef) return null;
    const compDef = domainDef.components?.[filter.componentType];
    if (!compDef) return null;
    return compDef.tiers?.find(t => t.tier === filter.tier) ?? null;
  }

  /**
   * Get display name for a filter.
   */
  _getFilterName(filter) {
    const tierDef = this._getTierDef(filter);
    if (tierDef?.name) return tierDef.name;
    const systems = this.state.config?.filtrationSystems ?? {};
    const compDef = systems[filter.domain]?.components?.[filter.componentType];
    return compDef?.name ?? filter.type ?? 'Filter';
  }
}
