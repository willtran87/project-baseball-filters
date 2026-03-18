/**
 * StaffPanel — UI for managing stadium maintenance staff.
 *
 * Three tabs: Hire (browse candidates), Roster (view/manage hired staff),
 * and Assign (assign staff to filtration domains).
 */

import { SPECIALIZATIONS, XP_THRESHOLDS } from '../systems/StaffSystem.js';
import { showConfirmDialog } from './notifications.js';

export class StaffPanel {
  constructor(container, state, eventBus, staffSystem) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this.staffSystem = staffSystem;
    this._el = null;
    this._visible = false;
    this._activeTab = 'hire';
    this._selectedStaffId = null;

    this.eventBus.on('ui:toggleStaff', () => this.toggle());
    this.eventBus.on('ui:closeStaff', () => this.hide());
    this.eventBus.on('ui:closeAllPanels', (result) => {
      if (this._visible) {
        this.hide();
        if (result) result.closed = true;
      }
    });
    this.eventBus.on('staff:hired', () => this._rerender());
    this.eventBus.on('staff:fired', () => this._rerender());
    this.eventBus.on('staff:quit', () => this._rerender());
    this.eventBus.on('staff:levelUp', () => this._rerender());
    this.eventBus.on('staff:specialized', () => this._rerender());
    this.eventBus.on('staff:candidatesRefreshed', () => this._rerender());
    this.eventBus.on('staff:trainingStarted', () => this._rerender());
    this.eventBus.on('staff:praised', () => this._rerender());
    this.eventBus.on('staff:trainingComplete', () => this._rerender());
    this.eventBus.on('staff:teamBuilding', () => this._rerender());
    this.eventBus.on('staff:moraleEvent', () => this._rerender());
  }

  toggle() {
    if (this._visible) this.hide(); else this.show();
  }

  show() {
    this.eventBus.emit('ui:closeAllPanels');
    this.hide();
    this._visible = true;
    this._el = document.createElement('div');
    this._el.id = 'staff-panel';
    this._el.style.cssText = `
      position: absolute; top: 24px; left: 8%; right: 8%; bottom: 24px;
      background: linear-gradient(180deg, rgba(10,15,25,0.97), rgba(8,8,24,0.97));
      border: 2px solid #8b4513;
      border-radius: 4px;
      font-family: monospace; color: #e0e0e0;
      font-size: 11px; z-index: 30;
      display: flex; flex-direction: column;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(139,69,19,0.2);
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
    this._selectedStaffId = null;
  }

  get visible() {
    return this._visible;
  }

  _rerender() {
    if (this._visible && this._el) this._render();
  }

  _render() {
    if (!this._el) return;

    const header = `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:2px solid #8b4513;background:linear-gradient(180deg,rgba(139,69,19,0.15),rgba(0,0,0,0.3))">
        <strong style="color:#ffa300;letter-spacing:1px">\u{1f477} GROUNDS CREW ROSTER</strong>
        <span style="color:#888">Staff: ${this.staffSystem.staff.length} | Wages: <span style="color:#ffa300">$${this.staffSystem.getTotalDailyWages()}/day</span></span>
        <span data-action="close-staff" style="cursor:pointer;color:#888;font-size:12px">\u2715</span>
      </div>
    `;

    const tabs = ['hire', 'roster', 'assign'];
    const tabLabels = { hire: 'Hire', roster: 'Roster', assign: 'Assign' };
    const tabColors = { hire: '#00e436', roster: '#29adff', assign: '#ffa300' };

    const tabsHtml = `
      <div style="display:flex;gap:0;border-bottom:1px solid #3a3a5a;background:rgba(0,0,0,0.2)">
        ${tabs.map(key => {
          const active = key === this._activeTab;
          return `<span data-tab="${key}" style="
            padding:6px 12px;cursor:pointer;
            color:${active ? tabColors[key] : '#888'};
            border-bottom:${active ? `2px solid ${tabColors[key]}` : '2px solid transparent'};
            background:${active ? 'rgba(255,255,255,0.05)' : 'transparent'};
          ">${tabLabels[key]}</span>`;
        }).join('')}
      </div>
    `;

    let contentHtml = '';
    if (this._selectedStaffId !== null) {
      contentHtml = this._renderStaffDetail();
    } else if (this._activeTab === 'hire') {
      contentHtml = this._renderHireTab();
    } else if (this._activeTab === 'roster') {
      contentHtml = this._renderRosterTab();
    } else if (this._activeTab === 'assign') {
      contentHtml = this._renderAssignTab();
    }

    this._el.innerHTML = `
      ${header}
      ${tabsHtml}
      <div style="flex:1;overflow-y:auto;padding:8px 12px">
        ${contentHtml}
      </div>
    `;

    this._attachEvents();
  }

  _renderHireTab() {
    const candidates = this.staffSystem.candidates;
    const refreshCost = this.staffSystem.getRefreshCost();
    const canAffordRefresh = refreshCost === 0 || this.state.money >= refreshCost;
    const refreshLabel = refreshCost === 0 ? 'Refresh (Free)' : `Refresh ($${refreshCost})`;
    const refreshStyle = canAffordRefresh
      ? 'background:#1a2a4a;color:#29adff;border:1px solid #3a5a8a;cursor:pointer'
      : 'background:#2a2a2a;color:#555;border:1px solid #333;cursor:not-allowed';

    if (candidates.length === 0) {
      return `
        <div style="color:#888;margin-bottom:8px">No candidates available.</div>
        <button data-action="refresh-candidates" style="${refreshStyle};padding:4px 12px;font-family:monospace;font-size:10px">${refreshLabel}</button>
      `;
    }

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="color:#aaa">Available Candidates</span>
        <button data-action="refresh-candidates" style="${refreshStyle};padding:3px 10px;font-family:monospace;font-size:10px">${refreshLabel}</button>
      </div>
    `;

    for (const c of candidates) {
      const canAfford = this.state.money >= c.hireCost;
      const traitHtml = c.trait
        ? `<span style="color:#cc44cc;font-size:9px;background:rgba(204,68,204,0.1);padding:1px 4px;border-radius:2px;margin-left:4px">${c.trait}</span>`
        : '';
      html += `
        <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;background:rgba(255,255,255,0.03);border-left:3px solid ${canAfford ? '#00e436' : '#333'}">
          <div style="flex:1">
            <div style="color:#e0e0e0;margin-bottom:2px"><strong>${c.name}</strong>${traitHtml}</div>
            <div style="color:#888;font-size:10px">
              SPD: <span style="color:#29adff">${c.speed}</span> |
              SKL: <span style="color:#ffa300">${c.skill}</span> |
              MRL: <span style="color:#00e436">${c.morale}</span>
            </div>
            ${c.traitDesc ? `<div style="color:#777;font-size:9px;font-style:italic;margin-top:2px">${c.traitDesc}</div>` : ''}
            ${this._getTraitEffectHtml(c)}
          </div>
          <span style="color:${canAfford ? '#00e436' : '#555'};width:65px;text-align:right">$${c.hireCost.toLocaleString()}</span>
          <button data-action="hire" data-candidate-id="${c.id}"
            style="background:${canAfford ? '#1a3a2a' : '#2a2a2a'};color:${canAfford ? '#00e436' : '#555'};
            border:1px solid ${canAfford ? '#3a6a4a' : '#333'};padding:3px 10px;font-family:monospace;
            cursor:${canAfford ? 'pointer' : 'not-allowed'};font-size:10px;width:55px">
            HIRE
          </button>
        </div>
      `;
    }
    return html;
  }

  _renderRosterTab() {
    const staff = this.staffSystem.staff;
    if (staff.length === 0) {
      return '<div style="color:#888">No staff hired yet. Visit the Hire tab to recruit workers.</div>';
    }

    // Team Building button in roster header
    const tbInfo = this.staffSystem.getTeamBuildingInfo();
    const canAffordTB = this.state.money >= tbInfo.cost;
    const tbAvailable = tbInfo.available && canAffordTB && staff.length > 0;
    const tbLabel = tbInfo.available
      ? `Team Building ($${tbInfo.cost})`
      : `Team Building (${tbInfo.daysRemaining}d cooldown)`;
    const tbStyle = tbAvailable
      ? 'background:#1a2a3a;color:#29adff;border:1px solid #3a5a8a;cursor:pointer'
      : 'background:#2a2a2a;color:#555;border:1px solid #333;cursor:not-allowed';

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="color:#aaa">Your Staff</span>
        <button data-action="team-building" style="${tbStyle};padding:3px 10px;font-family:monospace;font-size:10px"
          title="${tbInfo.available ? 'Host a team building day: +5 morale to all staff' : `Available in ${tbInfo.daysRemaining} day${tbInfo.daysRemaining !== 1 ? 's' : ''}`}">
          ${tbLabel}
        </button>
      </div>
    `;

    for (const s of staff) {
      const specName = s.specialization ? SPECIALIZATIONS[s.specialization]?.name ?? '' : '';
      const moralePct = Math.max(0, Math.min(100, s.morale));
      const moraleColor = moralePct >= 60 ? '#00e436' : moralePct >= 30 ? '#ffa300' : '#ff004d';
      const nextThreshold = XP_THRESHOLDS[s.level - 1] ?? null;
      const xpDisplay = nextThreshold ? `${s.xp}/${nextThreshold}` : `${s.xp} (MAX)`;
      const traitTag = s.trait
        ? `<span style="color:#cc44cc;font-size:9px;margin-left:4px;background:rgba(204,68,204,0.1);padding:1px 4px;border-radius:2px">${s.trait}</span>`
        : '';

      // Trait mechanical effect text
      const traitEffects = this.state.config.staffConfig?.traitEffects ?? {};
      const traitEffect = s.trait ? traitEffects[s.trait] : null;
      const traitEffectHtml = traitEffect
        ? `<div style="color:#a78bfa;font-size:9px;margin-top:1px">${traitEffect.desc}</div>`
        : '';

      // Morale tier effect description
      const moraleTier = this.staffSystem.getMoraleTier(s);
      const moraleEffectHtml = moraleTier === 'high'
        ? '<div style="color:#00e436;font-size:9px;margin-top:1px">High Morale: +10% repair speed, +3 domain health</div>'
        : moraleTier === 'low'
          ? '<div style="color:#ff004d;font-size:9px;margin-top:1px">Low Morale: -15% repair speed, -3 domain health, quit risk</div>'
          : '';

      // Training status
      const isTraining = this.staffSystem.isTraining(s);
      const trainingHtml = isTraining
        ? (() => {
            const t = s.training;
            const pct = Math.floor(((t.totalDays - t.daysRemaining) / t.totalDays) * 100);
            return `
              <div style="margin-top:2px">
                <span style="color:#ffec27;font-size:9px;background:rgba(255,236,39,0.15);padding:1px 4px;border-radius:2px">IN TRAINING (${t.daysRemaining}d left)</span>
                <div style="background:#222;height:3px;border-radius:2px;margin-top:2px;width:60px">
                  <div style="background:#ffec27;height:100%;width:${pct}%;border-radius:2px"></div>
                </div>
              </div>`;
          })()
        : '';

      html += `
        <div data-action="select-staff" data-staff-id="${s.id}" style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;background:rgba(255,255,255,0.03);border-left:3px solid ${isTraining ? '#ffec27' : '#29adff'};cursor:pointer">
          <div style="flex:1">
            <div style="color:#e0e0e0;margin-bottom:2px">
              <strong>${s.name}</strong>
              <span style="color:#ffec27;font-size:9px;margin-left:4px">Lv.${s.level}</span>
              ${specName ? `<span style="color:#c2c3c7;font-size:9px;margin-left:4px;background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:2px">${specName}</span>` : ''}
              ${traitTag}
            </div>
            <div style="color:#888;font-size:10px">
              SPD: <span style="color:#29adff">${s.speed}</span> |
              SKL: <span style="color:#ffa300">${s.skill}</span> |
              XP: <span style="color:#c2c3c7">${xpDisplay}</span>
              ${s.assignedDomain ? ` | <span style="color:#ffec27">${s.assignedDomain}</span>` : ''}
            </div>
            ${moraleEffectHtml}
            ${traitEffectHtml}
            ${trainingHtml}
          </div>
          <div style="width:60px">
            <div style="font-size:9px;color:${moraleColor};margin-bottom:2px">MRL ${moralePct}%</div>
            <div style="background:#222;height:4px;border-radius:2px">
              <div style="background:${moraleColor};height:100%;width:${moralePct}%;border-radius:2px"></div>
            </div>
          </div>
        </div>
      `;
    }
    return html;
  }

  _renderAssignTab() {
    const staff = this.staffSystem.staff;
    const domains = Object.keys(this.state.config.filtrationSystems ?? {});

    if (staff.length === 0) {
      return '<div style="color:#888">No staff to assign. Hire workers first.</div>';
    }

    const unassignedCount = staff.filter(s => !s.assignedDomain).length;
    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="color:#aaa">Assign Staff to Domains</span>
        ${unassignedCount > 0 ? `
          <button data-action="auto-assign" style="background:#1a3a2a;color:#00e436;border:1px solid #3a6a4a;padding:3px 10px;font-family:monospace;cursor:pointer;font-size:10px">AUTO-ASSIGN</button>
        ` : ''}
      </div>
    `;

    for (const domain of domains) {
      const domainDef = this.state.config.filtrationSystems[domain];
      const assigned = staff.filter(s => s.assignedDomain === domain);
      const domainColor = domainDef?.color ?? '#888';

      html += `
        <div style="margin-bottom:10px;padding:6px 8px;background:rgba(255,255,255,0.02);border-left:3px solid ${domainColor}">
          <div style="color:${domainColor};margin-bottom:4px"><strong>${domainDef?.name ?? domain}</strong></div>
          ${assigned.length > 0
            ? assigned.map(s => `
              <div style="display:flex;align-items:center;gap:6px;padding:2px 0">
                <span style="color:#e0e0e0;flex:1">${s.name} <span style="color:#ffec27;font-size:9px">Lv.${s.level}</span></span>
                <button data-action="unassign" data-staff-id="${s.id}"
                  style="background:#3a2a2a;color:#ff8800;border:1px solid #5a3a3a;padding:2px 6px;font-family:monospace;cursor:pointer;font-size:9px">
                  Remove
                </button>
              </div>
            `).join('')
            : '<div style="color:#555;font-size:10px">No staff assigned</div>'
          }
        </div>
      `;
    }

    // Unassigned staff
    const unassigned = staff.filter(s => !s.assignedDomain);
    if (unassigned.length > 0) {
      html += '<div style="margin-top:8px;color:#aaa;margin-bottom:4px">Unassigned Staff</div>';
      for (const s of unassigned) {
        html += `
          <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;margin-bottom:2px;background:rgba(255,255,255,0.02)">
            <span style="color:#e0e0e0;flex:1">${s.name} <span style="color:#ffec27;font-size:9px">Lv.${s.level}</span></span>
            ${domains.map(d => {
              const dc = this.state.config.filtrationSystems?.[d]?.color ?? '#888';
              return `<button data-action="assign" data-staff-id="${s.id}" data-domain="${d}"
                style="background:#1a2a3a;color:${dc};border:1px solid #3a4a5a;padding:2px 6px;font-family:monospace;cursor:pointer;font-size:9px">
                ${d}
              </button>`;
            }).join('')}
          </div>
        `;
      }
    }

    return html;
  }

  _renderStaffDetail() {
    const member = this.staffSystem.getStaff(this._selectedStaffId);
    if (!member) {
      this._selectedStaffId = null;
      return this._renderRosterTab();
    }

    const specName = member.specialization ? SPECIALIZATIONS[member.specialization]?.name ?? '' : '';
    const moralePct = Math.max(0, Math.min(100, member.morale));
    const moraleColor = moralePct >= 60 ? '#00e436' : moralePct >= 30 ? '#ffa300' : '#ff004d';
    const nextThreshold = XP_THRESHOLDS[member.level - 1] ?? null;
    const xpPct = nextThreshold ? Math.floor((member.xp / nextThreshold) * 100) : 100;
    const xpDisplay = nextThreshold ? `${member.xp}/${nextThreshold}` : `${member.xp} (MAX)`;
    const canSpecialize = member.level >= 3 && !member.specialization;

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <button data-action="back-to-roster" style="background:#2a2a3a;color:#888;border:1px solid #3a3a5a;padding:3px 8px;font-family:monospace;cursor:pointer;font-size:10px">&lt; Back</button>
        <strong style="color:#e0e0e0">${member.name}</strong>
        <span style="color:#ffec27">Level ${member.level}</span>
      </div>

      <div style="display:flex;gap:16px;margin-bottom:8px">
        <div>
          <div style="color:#888;font-size:9px">SPEED</div>
          <div style="color:#29adff;font-size:14px">${member.speed}</div>
        </div>
        <div>
          <div style="color:#888;font-size:9px">SKILL</div>
          <div style="color:#ffa300;font-size:14px">${member.skill}</div>
        </div>
        <div>
          <div style="color:#888;font-size:9px">MORALE</div>
          <div style="color:${moraleColor};font-size:14px">${moralePct}%</div>
        </div>
        <div>
          <div style="color:#888;font-size:9px">WAGE</div>
          <div style="color:#c2c3c7;font-size:14px">$${this.staffSystem.getEffectiveWage(member).effectiveWage}/d</div>
        </div>
      </div>

      <div style="margin-bottom:4px;color:#888;font-size:10px">Morale</div>
      <div style="background:#222;height:6px;margin-bottom:8px;border-radius:2px">
        <div style="background:${moraleColor};height:100%;width:${moralePct}%;border-radius:2px"></div>
      </div>

      <div style="margin-bottom:4px;color:#888;font-size:10px">Experience (${xpDisplay})</div>
      <div style="background:#222;height:6px;margin-bottom:8px;border-radius:2px">
        <div style="background:#ffec27;height:100%;width:${xpPct}%;border-radius:2px"></div>
      </div>

      ${specName
        ? `<div style="margin-bottom:8px">Specialization: <span style="color:#c2c3c7;background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:2px">${specName}</span></div>`
        : ''
      }
      ${member.assignedDomain
        ? `<div style="margin-bottom:8px">Assigned to: <span style="color:#ffec27">${member.assignedDomain}</span></div>`
        : ''
      }
      ${member.trait
        ? `<div style="margin-bottom:8px;padding:6px 8px;background:rgba(204,68,204,0.06);border-left:2px solid #cc44cc;border-radius:2px">
            <div style="color:#cc44cc;font-size:10px;margin-bottom:2px">Trait: ${member.trait}</div>
            <div style="color:#888;font-size:10px;font-style:italic">${member.traitDesc ?? ''}</div>
            ${this._getTraitEffectHtml(member)}
          </div>`
        : ''
      }
      ${member.backstory
        ? `<div style="margin-bottom:8px;padding:6px 8px;background:rgba(255,255,255,0.02);border-left:2px solid #555;border-radius:2px">
            <div style="color:#888;font-size:9px;margin-bottom:2px;text-transform:uppercase;letter-spacing:1px">Background</div>
            <div style="color:#aaa;font-size:10px;font-style:italic">"${member.backstory}"</div>
          </div>`
        : ''
      }
    `;

    // Morale effect display
    const moraleTier = this.staffSystem.getMoraleTier(member);
    if (moraleTier === 'high') {
      html += '<div style="margin-bottom:8px;padding:4px 8px;background:rgba(0,228,54,0.06);border-left:2px solid #00e436;border-radius:2px;color:#00e436;font-size:10px">High Morale: +10% repair speed, +3 domain health</div>';
    } else if (moraleTier === 'low') {
      html += '<div style="margin-bottom:8px;padding:4px 8px;background:rgba(255,0,77,0.06);border-left:2px solid #ff004d;border-radius:2px;color:#ff004d;font-size:10px">Low Morale: -15% repair speed, -3 domain health, quit risk</div>';
    }

    // Wage modifier breakdown
    const wageInfo = this.staffSystem.getEffectiveWage(member);
    if (wageInfo.moraleMult !== 1.0 || wageInfo.specMult !== 1.0) {
      const parts = [];
      if (wageInfo.moraleMult !== 1.0) {
        const pct = Math.round((wageInfo.moraleMult - 1) * 100);
        parts.push(`Morale ${pct > 0 ? '+' : ''}${pct}%`);
      }
      if (wageInfo.specMult !== 1.0) {
        const label = wageInfo.specMult >= 1.25 ? 'Expert' : 'Specialist';
        const pct = Math.round((wageInfo.specMult - 1) * 100);
        parts.push(`${label} +${pct}%`);
      }
      html += `<div style="margin-bottom:8px;padding:4px 8px;background:rgba(255,163,0,0.06);border-left:2px solid #ffa300;border-radius:2px;color:#ffa300;font-size:10px">Wage: $${wageInfo.baseWage} base x ${parts.join(', ')} = $${wageInfo.effectiveWage}/day</div>`;
    }

    // Training status / Train button
    const isTraining = this.staffSystem.isTraining(member);
    if (isTraining) {
      const t = member.training;
      const pct = Math.floor(((t.totalDays - t.daysRemaining) / t.totalDays) * 100);
      html += `
        <div style="margin-bottom:8px;padding:6px 8px;background:rgba(255,236,39,0.06);border-left:2px solid #ffec27;border-radius:2px">
          <div style="color:#ffec27;font-size:10px;margin-bottom:4px">IN TRAINING (${t.daysRemaining} day${t.daysRemaining !== 1 ? 's' : ''} remaining)</div>
          <div style="background:#222;height:6px;border-radius:2px">
            <div style="background:#ffec27;height:100%;width:${pct}%;border-radius:2px"></div>
          </div>
          <div style="color:#888;font-size:9px;margin-top:2px">Unavailable for work until training completes. +50 XP on completion.</div>
        </div>
      `;
    } else {
      const trainCost = this.state.config.staffConfig?.trainingCost ?? 500;
      const canTrain = this.state.money >= trainCost;
      html += `
        <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
          <button data-action="train-staff" data-staff-id="${member.id}"
            style="background:${canTrain ? '#1a2a3a' : '#1a1a1a'};color:${canTrain ? '#ffec27' : '#444'};
            border:1px solid ${canTrain ? '#3a4a6a' : '#2a2a2a'};padding:3px 10px;font-family:monospace;
            cursor:${canTrain ? 'pointer' : 'not-allowed'};font-size:10px"
            title="Train for 3 days, costs $${trainCost}, grants +50 XP on completion">
            Train ($${trainCost})
          </button>
          ${!this.staffSystem.hasPraisedToday(member.id)
            ? `<button data-action="praise-staff" data-staff-id="${member.id}"
                style="background:#1a3a2a;color:#00e436;border:1px solid #3a6a4a;padding:3px 10px;font-family:monospace;cursor:pointer;font-size:10px"
                title="Praise this staff member (+5 morale, once/day)">
                Praise (+5 morale)
              </button>`
            : '<span style="color:#555;font-size:9px;padding:3px 0">Already praised today</span>'
          }
        </div>
      `;
    }

    // Specialize buttons
    if (canSpecialize) {
      html += '<div style="margin-bottom:8px;color:#aaa;font-size:10px">Choose Specialization:</div><div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">';
      for (const [key, spec] of Object.entries(SPECIALIZATIONS)) {
        html += `<button data-action="specialize" data-spec-key="${key}"
          style="background:#2a2a4a;color:#c2c3c7;border:1px solid #4a4a6a;padding:3px 8px;font-family:monospace;cursor:pointer;font-size:10px">
          ${spec.name}
        </button>`;
      }
      html += '</div>';
    }

    // Fire button
    html += `
      <div style="margin-top:12px;border-top:1px solid #3a3a5a;padding-top:8px">
        <button data-action="fire-staff" data-staff-id="${member.id}"
          style="background:#4a2a2a;color:#ff004d;border:1px solid #6a4a4a;padding:3px 10px;font-family:monospace;cursor:pointer;font-size:10px">
          Fire ${member.name}
        </button>
      </div>
    `;

    return html;
  }

  /**
   * Get HTML for a staff member's trait mechanical effect (if any).
   */
  _getTraitEffectHtml(staffMember) {
    const traitEffects = this.state.config.staffConfig?.traitEffects ?? {};
    const effect = staffMember.trait ? traitEffects[staffMember.trait] : null;
    if (!effect || !effect.desc) return '';
    return `<div style="color:#a78bfa;font-size:9px;margin-top:2px">Effect: ${effect.desc}</div>`;
  }

  /**
   * Auto-assign all unassigned staff to domains.
   * Prioritizes specialization match, then lowest domain health.
   */
  _autoAssignStaff() {
    const staff = this.staffSystem.staff;
    const unassigned = staff.filter(s => !s.assignedDomain);
    if (unassigned.length === 0) {
      this.eventBus.emit('ui:message', { text: 'No unassigned staff to auto-assign.', type: 'info' });
      return;
    }

    const domains = Object.keys(this.state.config.filtrationSystems ?? {});
    const health = this.state.domainHealth ?? {};

    // Specialization -> domain mapping
    const specDomainMap = {
      airTech: ['air', 'hvac'],
      plumber: ['water', 'drainage'],
      electrician: ['hvac'],
      general: ['air', 'water', 'hvac', 'drainage'],
    };

    // Sort domains by health ascending (worst first)
    const sortedDomains = [...domains].sort((a, b) => (health[a] ?? 100) - (health[b] ?? 100));

    let assignedCount = 0;

    for (const member of unassigned) {
      let bestDomain = null;

      // First try to match specialization to a domain
      if (member.specialization) {
        const specDomains = specDomainMap[member.specialization] ?? [];
        // Pick the lowest-health domain that matches specialization
        for (const d of sortedDomains) {
          if (specDomains.includes(d)) {
            bestDomain = d;
            break;
          }
        }
      }

      // If no specialization match, pick the lowest-health domain
      if (!bestDomain) {
        bestDomain = sortedDomains[0] ?? null;
      }

      if (bestDomain) {
        this.eventBus.emit('staff:assign', { staffId: member.id, domain: bestDomain });
        assignedCount++;
      }
    }

    if (assignedCount > 0) {
      this.eventBus.emit('ui:message', {
        text: `Auto-assigned ${assignedCount} staff member${assignedCount > 1 ? 's' : ''}`,
        type: 'success',
      });
    }

    this._render();
  }

  /**
   * Returns HTML showing a candidate/staff member's trait mechanical effects
   * from config, if any exist for the given trait.
   */
  _getTraitEffectHtml(staffOrCandidate) {
    if (!staffOrCandidate.trait) return '';
    const traitEffects = this.state.config.staffConfig?.traitEffects ?? {};
    const effect = traitEffects[staffOrCandidate.trait];
    if (!effect || !effect.desc) return '';
    return `<div style="color:#a78bfa;font-size:9px;margin-top:1px">${effect.desc}</div>`;
  }

  _attachEvents() {
    if (!this._el) return;

    // Remove previous listener to prevent stacking on re-render
    if (this._clickHandler) {
      this._el.removeEventListener('click', this._clickHandler);
    }

    this._clickHandler = (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) {
        // Check for tab clicks
        const tabBtn = e.target.closest('[data-tab]');
        if (tabBtn) {
          this.eventBus.emit('ui:click');
          this._activeTab = tabBtn.dataset.tab;
          this._selectedStaffId = null;
          this._render();
        }
        return;
      }

      const action = target.dataset.action;

      // Actions that trigger their own dedicated sounds — skip generic click
      const hasOwnSound = ['hire', 'fire-staff', 'specialize', 'auto-assign'];
      if (!hasOwnSound.includes(action)) {
        this.eventBus.emit('ui:click');
      }

      switch (action) {
        case 'close-staff':
          this.hide();
          break;

        case 'refresh-candidates':
          if (this._refreshCooldown) break;
          this._refreshCooldown = true;
          setTimeout(() => { this._refreshCooldown = false; }, 500);
          this.eventBus.emit('staff:refreshCandidates');
          break;

        case 'hire': {
          const candidateId = parseInt(target.dataset.candidateId, 10);
          this.eventBus.emit('staff:hire', { candidateId });
          break;
        }

        case 'select-staff': {
          const staffId = parseInt(target.dataset.staffId, 10);
          this._selectedStaffId = staffId;
          this._render();
          break;
        }

        case 'back-to-roster':
          this._selectedStaffId = null;
          this._render();
          break;

        case 'specialize': {
          const specKey = target.dataset.specKey;
          if (this._selectedStaffId !== null) {
            this.eventBus.emit('staff:specialize', {
              staffId: this._selectedStaffId,
              specialization: specKey,
            });
          }
          break;
        }

        case 'assign': {
          const staffId = parseInt(target.dataset.staffId, 10);
          const domain = target.dataset.domain;
          this.eventBus.emit('staff:assign', { staffId, domain });
          this._render();
          break;
        }

        case 'unassign': {
          const staffId = parseInt(target.dataset.staffId, 10);
          this.eventBus.emit('staff:unassign', { staffId });
          this._render();
          break;
        }

        case 'auto-assign': {
          this._autoAssignStaff();
          break;
        }

        case 'train-staff': {
          const staffId = parseInt(target.dataset.staffId, 10);
          this.eventBus.emit('staff:train', { staffId });
          this._render();
          break;
        }

        case 'praise-staff': {
          const staffId = parseInt(target.dataset.staffId, 10);
          this.eventBus.emit('staff:praise', { staffId });
          this._render();
          break;
        }

        case 'team-building': {
          this.eventBus.emit('staff:initiateTeamBuilding');
          break;
        }

        case 'fire-staff': {
          const staffId = parseInt(target.dataset.staffId, 10);
          const member = this.staffSystem.getStaff(staffId);
          const name = member?.name ?? 'this staff member';
          showConfirmDialog(
            this.container,
            `Fire <strong style="color:#ff8800">${name}</strong>? This cannot be undone.`,
            () => {
              this.eventBus.emit('staff:fire', { staffId });
              this._selectedStaffId = null;
              this._rerender();
            },
            'FIRE'
          );
          break;
        }
      }
    };

    this._el.addEventListener('click', this._clickHandler);
  }
}
