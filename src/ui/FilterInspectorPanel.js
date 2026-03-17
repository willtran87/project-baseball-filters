/**
 * FilterInspectorPanel — Registers an enhanced filter inspector
 * that works with both the old flat filterTypes and the new
 * domain/component/tier system.
 *
 * Note: The PanelManager now has a built-in filterInspector.
 * This module is kept as an optional override that adds upgrade capability.
 * Call registerFilterInspectorPanel() to replace the built-in one.
 */

import { FiltrationSystem } from '../systems/FiltrationSystem.js';
import { showConfirmDialog } from './notifications.js';

export function registerFilterInspectorPanel(panelManager, state, eventBus) {
  // Override the built-in filterInspector with an enhanced version
  panelManager.register('filterInspector', (container, _state, _eventBus, data) => {
    const filterId = data?.filterId ?? data?.id;
    const filter = filterId != null ? state.getFilter(filterId) : null;

    if (!filter) {
      container.innerHTML = '<div style="color:#888; padding:8px;">No filter selected.</div>';
      return;
    }

    const status = FiltrationSystem.getFilterStatus(filter);
    const condPct = filter.maxCondition > 0
      ? Math.floor((filter.condition / filter.maxCondition) * 100) : 0;
    const effPct = Math.floor(filter.efficiency * 100);

    // Get tier definition from new config structure
    const systemDef = state.config.filtrationSystems?.[filter.domain];
    const compDef = systemDef?.components?.[filter.componentType];
    const tierDef = compDef?.tiers?.find(t => t.tier === filter.tier);

    // Fallback to old config
    const oldDef = state.config.filterTypes?.[filter.type];
    const name = tierDef?.name ?? oldDef?.name ?? filter.type ?? 'Unknown';
    const brand = tierDef?.brand ?? '';
    const description = tierDef?.description ?? oldDef?.description ?? `${compDef?.name ?? ''} - Tier ${filter.tier}`;

    const repairCostBase = tierDef ? Math.floor(tierDef.cost * 0.3) : oldDef ? Math.floor(oldDef.cost * 0.3) : 0;
    const emergencyMult = state.config.economy?.emergencyRepairMultiplier ?? 2.5;
    const isBroken = filter.condition <= 0;
    const rawCost = isBroken ? Math.floor(repairCostBase * emergencyMult) : repairCostBase;
    const difficultyKey = state.difficulty ?? 'veteran';
    const difficultyRepairMult = state.config.difficulty?.[difficultyKey]?.repairCostMultiplier ?? 1.0;
    const staffRepairMult = state.staffRepairMultipliers?.[filter.domain] ?? 1;
    const tempDiscount = state.storyFlags?._tempRepairDiscount ? 0.5 : 1.0;
    const repairCost = Math.floor(rawCost * difficultyRepairMult * tempDiscount / staffRepairMult);
    const canRepair = state.money >= repairCost && filter.condition < filter.maxCondition;

    // Build repair cost breakdown tooltip
    const repairBreakdownParts = [`Base: $${repairCostBase}`];
    if (isBroken) repairBreakdownParts.push(`× Emergency: ${emergencyMult}`);
    if (difficultyRepairMult !== 1.0) repairBreakdownParts.push(`× Diff: ${difficultyRepairMult}`);
    if (tempDiscount !== 1.0) repairBreakdownParts.push(`× Discount: ${tempDiscount}`);
    if (staffRepairMult !== 1) repairBreakdownParts.push(`÷ Staff: ${staffRepairMult}`);
    repairBreakdownParts.push(`= $${repairCost}`);
    const repairTooltip = repairBreakdownParts.join(' ');

    // Check if upgrade is available
    const nextTier = compDef?.tiers?.find(t => t.tier === (filter.tier ?? 0) + 1);
    const upgradeCost = nextTier
      ? Math.max(0, nextTier.cost - Math.floor((tierDef?.cost ?? 0) * 0.5))
      : null;
    const canUpgrade = nextTier && state.money >= upgradeCost;

    const statusColors = {
      healthy: '#00e436', degraded: '#ffa300', warning: '#ff8800',
      critical: '#ff004d', broken: '#ff004d',
    };
    const statusColor = statusColors[status] || '#888';

    container.innerHTML = '';

    // Close button
    const closeSpan = document.createElement('span');
    closeSpan.textContent = '\u2715';
    closeSpan.dataset.action = 'close';
    closeSpan.style.cssText = 'position:absolute; top:6px; right:10px; cursor:pointer; color:#888; font-size:12px;';
    closeSpan.addEventListener('click', () => eventBus.emit('ui:closePanel'));
    container.appendChild(closeSpan);

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="margin-bottom:6px;">
        ${brand ? `<span style="color:#ffec27;font-size:10px">${brand}</span> ` : ''}<strong style="color:#9999cc;">${name}</strong>
        <span style="color:#555; font-size:9px; margin-left:6px;">#${filter.id}</span>
        ${filter.domain ? `<span style="color:${systemDef?.color ?? '#666'}; font-size:9px; margin-left:6px;">[${systemDef?.name ?? filter.domain}]</span>` : ''}
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
        <div>
          <div style="color:#777; font-size:9px;">CONDITION</div>
          <div style="background:#1a1a2a; height:8px; border-radius:2px; margin-top:2px; overflow:hidden;">
            <div style="width:${condPct}%; height:100%; background:${statusColor}; transition:width 0.3s;"></div>
          </div>
          <div style="color:${statusColor}; font-size:10px; margin-top:1px;">${condPct}%</div>
        </div>
        <div>
          <div style="color:#777; font-size:9px;">EFFICIENCY</div>
          <div style="background:#1a1a2a; height:8px; border-radius:2px; margin-top:2px; overflow:hidden;">
            <div style="width:${effPct}%; height:100%; background:${effPct > 50 ? '#4a4' : '#aa4'}; transition:width 0.3s;"></div>
          </div>
          <div style="color:#aaa; font-size:10px; margin-top:1px;">${effPct}%</div>
        </div>
      </div>

      <div style="color:#666; font-size:9px; margin-bottom:2px;">
        Status: <span style="color:${statusColor}">${status.toUpperCase()}</span>
        ${filter.tier ? ` | Tier ${filter.tier}` : ''}
        ${tierDef ? ` | ${tierDef.lifespanGames} game lifespan` : ''}
      </div>
      ${tierDef?.domainHealthBonus ? `<div style="color:#4fc; font-size:9px; margin-bottom:2px;">+${tierDef.domainHealthBonus} Domain Health Bonus${(filter.maxCondition > 0 && filter.condition / filter.maxCondition <= 0.5) ? ' <span style="color:#ff004d">(inactive — below 50%)</span>' : ''}</div>` : ''}
      ${tierDef?.passive ? `<div style="color:#a78bfa; font-size:9px; margin-bottom:2px;">\u2728 ${{weatherShield:'Weather Shield — 20% less weather degradation for this domain',crossDomain:'Cross Domain — boosts HVAC domain health',maintenanceSaver:'Maintenance Saver — 25% reduced maintenance for this domain',crisisArmor:'Crisis Armor — 50% less reputation penalty from domain crises'}[tierDef.passive] ?? tierDef.passive}</div>` : ''}
      <div style="color:#555; font-size:9px; font-style:italic; margin-bottom:8px;">${description}</div>
    `;

    // Action buttons
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap;';

    // Repair
    const repairBtn = document.createElement('button');
    repairBtn.textContent = `Repair ($${repairCost})`;
    repairBtn.title = repairTooltip;
    repairBtn.disabled = !canRepair;
    repairBtn.style.cssText = `
      background:${canRepair ? '#1a3a1a' : '#1a1a1a'}; color:${canRepair ? '#00e436' : '#444'};
      border:1px solid ${canRepair ? '#3a6a3a' : '#2a2a2a'}; font-family:monospace; font-size:10px;
      padding:4px 10px; cursor:${canRepair ? 'pointer' : 'not-allowed'};
    `;
    repairBtn.addEventListener('click', () => {
      if (!canRepair) return;
      eventBus.emit('filter:repair', { id: filter.id });
      // Re-open to refresh
      setTimeout(() => eventBus.emit('ui:openPanel', { name: 'filterInspector', data: { filterId: filter.id } }), 50);
    });
    actions.appendChild(repairBtn);

    // Upgrade
    if (nextTier) {
      const upgradeBtn = document.createElement('button');
      upgradeBtn.textContent = `Upgrade to T${nextTier.tier} ($${upgradeCost})`;
      upgradeBtn.disabled = !canUpgrade;
      upgradeBtn.style.cssText = `
        background:${canUpgrade ? '#1a1a3a' : '#1a1a1a'}; color:${canUpgrade ? '#29adff' : '#444'};
        border:1px solid ${canUpgrade ? '#3a5a8a' : '#2a2a2a'}; font-family:monospace; font-size:10px;
        padding:4px 10px; cursor:${canUpgrade ? 'pointer' : 'not-allowed'};
      `;
      upgradeBtn.addEventListener('click', () => {
        if (!canUpgrade) return;
        eventBus.emit('filter:upgrade', { id: filter.id, newTier: nextTier.tier });
        setTimeout(() => eventBus.emit('ui:openPanel', { name: 'filterInspector', data: { filterId: filter.id } }), 50);
      });
      actions.appendChild(upgradeBtn);
    }

    // Remove
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.style.cssText = `
      background:#3a1a1a; color:#ff004d; border:1px solid #6a3a3a;
      font-family:monospace; font-size:10px; padding:4px 10px; cursor:pointer;
    `;
    removeBtn.addEventListener('click', () => {
      showConfirmDialog(
        container,
        `Remove <strong style="color:#ff8800">${name}</strong>? You will need to buy a new filter.`,
        () => {
          eventBus.emit('filter:remove', { id: filter.id });
          eventBus.emit('ui:closePanel');
        },
        'REMOVE'
      );
    });
    actions.appendChild(removeBtn);

    content.appendChild(actions);
    container.appendChild(content);
  });
}
