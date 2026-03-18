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

    // 3-stage degradation warning system
    const condRatio = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
    let degradeStage = 'healthy'; // >75%
    let degradeBarColor = '#00e436';
    let degradeLabel = '';
    if (condRatio <= 0) {
      degradeStage = 'broken';
      degradeBarColor = '#ff004d';
      degradeLabel = '';
    } else if (condRatio < 0.50) {
      degradeStage = 'critical';
      degradeBarColor = '#ff004d';
      degradeLabel = '\u26d4 Critical \u2014 Repair Soon!';
    } else if (condRatio < 0.75) {
      degradeStage = 'worn';
      degradeBarColor = '#ffec27';
      degradeLabel = '\u26a0 Wearing Down';
    }

    // Estimate days until filter breaks based on degradation rate
    let degradeEstimate = '';
    if (filter.installedDay != null && filter.condition > 0) {
      const daysActive = Math.max(1, (state.gameDay ?? 1) - filter.installedDay);
      const conditionUsed = filter.maxCondition - filter.condition;
      if (conditionUsed > 0) {
        const wearPerDay = conditionUsed / daysActive;
        const daysLeft = Math.ceil(filter.condition / wearPerDay);
        degradeEstimate = `~${daysLeft} day${daysLeft !== 1 ? 's' : ''} until failure`;
      } else {
        degradeEstimate = 'No measurable wear yet';
      }
    }

    // One-time critical warning toast (per session) when filter first drops below 50%
    if (degradeStage === 'critical' && !filter._criticalWarningShown) {
      filter._criticalWarningShown = true;
      const tierName = (() => {
        const sys = state.config.filtrationSystems?.[filter.domain];
        const comp = sys?.components?.[filter.componentType];
        const td = comp?.tiers?.find(t => t.tier === filter.tier);
        return td?.name ?? filter.type ?? 'Filter';
      })();
      eventBus.emit('ui:message', {
        text: `Filter ${tierName} in ${filter.domain} is critically worn!`,
        type: 'warning',
      });
    }

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

    // Inject critical pulse animation if not already present
    if (!document.getElementById('filter-degrade-styles')) {
      const style = document.createElement('style');
      style.id = 'filter-degrade-styles';
      style.textContent = `
        @keyframes condPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `;
      document.head.appendChild(style);
    }

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
            <div style="width:${condPct}%; height:100%; background:${degradeBarColor}; transition:width 0.3s;${degradeStage === 'critical' ? ' animation: condPulse 1s ease-in-out infinite;' : ''}"></div>
          </div>
          <div style="color:${degradeBarColor}; font-size:10px; margin-top:1px;">${condPct}%</div>
          ${degradeLabel ? `<div style="color:${degradeBarColor}; font-size:9px; margin-top:1px; font-weight:bold;">${degradeLabel}</div>` : ''}
          ${degradeEstimate ? `<div style="color:#888; font-size:9px; margin-top:1px;">${degradeEstimate}</div>` : ''}
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
      ${(() => {
        if (!tierDef?.passive) return '';
        const passiveNames = { weatherShield: 'Weather Shield', crossDomain: 'Cross Domain', maintenanceSaver: 'Maintenance Saver', crisisArmor: 'Crisis Armor' };
        const passiveDescs = { weatherShield: 'Reduces weather damage by 30%', crossDomain: 'Boosts HVAC domain health', maintenanceSaver: '25% reduced maintenance for this domain', crisisArmor: '50% less reputation penalty from domain crises' };
        const passiveName = passiveNames[tierDef.passive] ?? tierDef.passive;
        const passiveDesc = passiveDescs[tierDef.passive] ?? '';
        const passiveCondThreshold = 0.5;
        const isPassiveActive = condRatio > passiveCondThreshold;
        if (isPassiveActive) {
          return `<div style="color:#00e436; font-size:9px; margin-bottom:2px;">\u2713 ${passiveName} ACTIVE \u2014 ${passiveDesc}</div>`;
        } else {
          return `<div style="color:#666; font-size:9px; margin-bottom:2px;">\u2717 <span style="color:#ff004d">${passiveName} INACTIVE</span> \u2014 Requires &gt;50% condition to activate</div>`;
        }
      })()}
      ${(() => {
        const synergy = state.filterSynergies?.[filter.id];
        if (!synergy) return '<div style="color:#555; font-size:9px; margin-bottom:2px;">No synergies \u2014 add more filters to this zone</div>';
        let html = '';
        const zoneFilters = state.filters.filter(f => (f.zone ?? 'mechanical') === (filter.zone ?? 'mechanical'));
        const sameDomainCount = zoneFilters.filter(f => f.domain === filter.domain).length;
        if (synergy.sameDomainBonus > 0) {
          html += `<div style="color:#00e436; font-size:9px; margin-bottom:2px;">Zone Bonus: +${Math.round(synergy.sameDomainBonus * 100)}% (${sameDomainCount} ${filter.domain} filters in this zone)</div>`;
        }
        if (synergy.crossDomainBonus > 0) {
          const pairMap = { air: 'hvac', hvac: 'air', water: 'drainage', drainage: 'water' };
          const partner = pairMap[filter.domain] ?? '?';
          html += `<div style="color:#29adff; font-size:9px; margin-bottom:2px;">Cross-Domain: +${Math.round(synergy.crossDomainBonus * 100)}% (${filter.domain} + ${partner} pairing)</div>`;
        }
        return html;
      })()}
      <div style="color:#555; font-size:9px; font-style:italic; margin-bottom:8px;">${description}</div>
    `;

    // Action buttons
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap;';

    // Emergency Repair — only for critical filters (<15% condition)
    const isCritical = condPct < 15 && filter.condition > 0;
    if (isCritical) {
      const emergencyRepairCost = repairCost * 2;
      // Requires assigned staff level 2+ or domain specialist
      const staffList = state.staffList ?? [];
      const qualifiedStaff = staffList.find(s => {
        if (s.assignedDomain !== filter.domain) return false;
        if (s.training && s.training.daysRemaining > 0) return false;
        if (s.level >= 2) return true;
        if (s.specialization) return true;
        return false;
      });
      const canEmergencyRepair = qualifiedStaff && state.money >= emergencyRepairCost;
      let emergencyTooltip = `Instant full repair (2x cost: $${emergencyRepairCost})`;
      if (!qualifiedStaff) {
        emergencyTooltip = 'Requires assigned staff Lv.2+ or domain specialist';
      } else if (state.money < emergencyRepairCost) {
        emergencyTooltip = `Not enough money ($${emergencyRepairCost} needed)`;
      }

      const emergBtn = document.createElement('button');
      emergBtn.textContent = `EMERGENCY ($${emergencyRepairCost})`;
      emergBtn.title = emergencyTooltip;
      emergBtn.disabled = !canEmergencyRepair;
      emergBtn.style.cssText = `
        background:${canEmergencyRepair ? '#4a1a1a' : '#1a1a1a'}; color:${canEmergencyRepair ? '#ff004d' : '#444'};
        border:1px solid ${canEmergencyRepair ? '#8a3a3a' : '#2a2a2a'}; font-family:monospace; font-size:10px;
        padding:4px 10px; cursor:${canEmergencyRepair ? 'pointer' : 'not-allowed'};
        font-weight:bold;
      `;
      emergBtn.addEventListener('click', () => {
        if (!canEmergencyRepair) return;
        // Deduct cost and instantly repair
        state.set('money', state.money - emergencyRepairCost);
        filter.condition = filter.maxCondition;
        filter.efficiency = 1.0;
        state.repairsCompleted = (state.repairsCompleted ?? 0) + 1;
        eventBus.emit('filter:repaired', filter);
        eventBus.emit('ui:message', {
          text: `Emergency repair on ${name} for $${emergencyRepairCost.toLocaleString()}! Fully restored.`,
          type: 'success',
        });
        setTimeout(() => eventBus.emit('ui:openPanel', { name: 'filterInspector', data: { filterId: filter.id } }), 50);
      });
      actions.appendChild(emergBtn);
    }

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
      // Visual feedback: repair sparkle particles + border flash blue
      if (state.particles) {
        state.particles.emit('repairSparkle', filter.x ?? 0, filter.y ?? 0);
      }
      const panel = container.closest('.game-panel');
      if (panel) {
        panel.style.borderColor = '#29adff';
        setTimeout(() => { panel.style.borderColor = ''; }, 300);
      }
      // Re-open to refresh
      setTimeout(() => eventBus.emit('ui:openPanel', { name: 'filterInspector', data: { filterId: filter.id } }), 50);
    });
    actions.appendChild(repairBtn);

    // Preventive Maintenance — only when filter condition >= 80% and not at max
    if (condPct >= 80 && filter.condition < filter.maxCondition) {
      const prevCost = Math.floor(repairCostBase * 0.5);
      const canPreventive = state.money >= prevCost;
      const prevBtn = document.createElement('button');
      prevBtn.textContent = `Tune-Up: $${prevCost}`;
      prevBtn.title = 'Preventive maintenance — restore to 100% at half repair cost';
      prevBtn.disabled = !canPreventive;
      prevBtn.style.cssText = `
        background:${canPreventive ? '#1a2a3a' : '#1a1a1a'}; color:${canPreventive ? '#4fc' : '#444'};
        border:1px solid ${canPreventive ? '#3a6a7a' : '#2a2a2a'}; font-family:monospace; font-size:10px;
        padding:4px 10px; cursor:${canPreventive ? 'pointer' : 'not-allowed'};
      `;
      prevBtn.addEventListener('click', () => {
        if (!canPreventive) return;
        eventBus.emit('filter:preventiveRepair', { id: filter.id });
        setTimeout(() => eventBus.emit('ui:openPanel', { name: 'filterInspector', data: { filterId: filter.id } }), 50);
      });
      actions.appendChild(prevBtn);
    }

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
        // Visual feedback: particles + sound + border flash
        if (state.particles) {
          state.particles.emit('upgrade', filter.x ?? 0, filter.y ?? 0);
        }
        eventBus.emit('filter:upgraded', filter);
        // Flash panel border green for 300ms
        const panel = container.closest('.game-panel');
        if (panel) {
          panel.style.borderColor = '#00e436';
          setTimeout(() => { panel.style.borderColor = ''; }, 300);
        }
        setTimeout(() => eventBus.emit('ui:openPanel', { name: 'filterInspector', data: { filterId: filter.id } }), 50);
      });
      actions.appendChild(upgradeBtn);
    }

    // Remove — show salvage value if filter is salvageable
    const removeBtn = document.createElement('button');
    let salvageValue = 0;
    if (!isBroken && !filter.isEmergency) {
      const salvageBaseCost = filter.purchaseCost ?? tierDef?.cost ?? 0;
      if (salvageBaseCost > 0) {
        const salvageCondRatio = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
        const salvageMarketMult = state.marketMultiplier ?? 1.0;
        salvageValue = Math.floor(salvageBaseCost * 0.20 * salvageCondRatio * salvageMarketMult);
      }
    }
    removeBtn.textContent = salvageValue > 0 ? `Remove (salvage: $${salvageValue})` : 'Remove';
    removeBtn.style.cssText = `
      background:#3a1a1a; color:#ff004d; border:1px solid #6a3a3a;
      font-family:monospace; font-size:10px; padding:4px 10px; cursor:pointer;
    `;
    removeBtn.addEventListener('click', () => {
      const confirmMsg = salvageValue > 0
        ? `Remove <strong style="color:#ff8800">${name}</strong>? Salvage value: <span style="color:#00e436">$${salvageValue}</span> (added to sell inventory).`
        : `Remove <strong style="color:#ff8800">${name}</strong>? You will need to buy a new filter.`;
      showConfirmDialog(
        container,
        confirmMsg,
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
