/**
 * SystemsPanel — Interactive control center for all 4 filtration domains.
 *
 * Shows a 2x2 grid of domain cards that expand on click to reveal
 * filter lists with repair buttons, domain actions (Repair All, Open Shop),
 * active consequences, cascade risks, and synergy info.
 *
 * Live-updates via event subscriptions; preserves expanded state across re-renders.
 */

import { PanelManager } from './PanelManager.js';

// Synergy pairs: domains that boost each other when both healthy or stress each other when one fails.
const SYNERGY_PAIRS = [
  { a: 'air', b: 'hvac', label: 'HVAC\u2194Air', boostPct: 3, stressPct: 3 },
  { a: 'water', b: 'drainage', label: 'Water\u2194Drainage', boostPct: 3, stressPct: 3 },
  { a: 'electrical', b: 'hvac', label: 'Elec\u2194HVAC', boostPct: 3, stressPct: 3 },
  { a: 'pest', b: 'drainage', label: 'Pest\u2194Drainage', boostPct: 3, stressPct: 3 },
];

const SYNERGY_BOOST_THRESHOLD = 70;
const SYNERGY_STRESS_THRESHOLD = 30;

const DOMAIN_COLORS = {
  air: '#cccccc',
  water: '#4488ff',
  hvac: '#ff8844',
  drainage: '#44bb44',
  electrical: '#ffcc00',
  pest: '#cc44cc',
};

const DOMAIN_LABELS = {
  air: 'AIR QUALITY',
  water: 'WATER SYSTEM',
  hvac: 'HVAC SYSTEM',
  drainage: 'DRAINAGE',
  electrical: 'ELECTRICAL GRID',
  pest: 'PEST CONTROL',
};

/** Flow diagram nodes per domain: source → filter → output with zone links and effects. */
const DOMAIN_FLOW_NODES = {
  water: {
    sources: ['City Water Main', 'Cooling Towers'],
    filterLabel: 'WATER FILTERS',
    outputs: [
      { label: 'Restroom Fixtures', zone: 'concourse', effect: 'Sanitary water for 40k fans' },
      { label: 'Concession Kitchens', zone: 'concourse', effect: 'Food prep & ice machines' },
      { label: 'Field Sprinklers', zone: 'field', effect: 'Grass health & infield clay' },
      { label: 'HVAC Chiller Loop', zone: 'mechanical', effect: 'Cooling tower supply' },
    ],
  },
  air: {
    sources: ['Outside Air Intake', 'Recirculated Air'],
    filterLabel: 'AIR FILTERS',
    outputs: [
      { label: 'Concourse Halls', zone: 'concourse', effect: 'Fan breathing & food odor control' },
      { label: 'Luxury Suites', zone: 'luxury', effect: 'VIP air quality & cigar lounge' },
      { label: 'Press Box', zone: 'pressbox', effect: 'Broadcast booth & commentary rooms' },
      { label: 'Equipment Rooms', zone: 'mechanical', effect: 'Dust-free server & electrical rooms' },
    ],
  },
  hvac: {
    sources: ['Boilers / Chillers'],
    filterLabel: 'HVAC FILTERS',
    outputs: [
      { label: 'Equipment Storage', zone: 'underground', effect: 'Baseball humidity — prevents mold on balls' },
      { label: 'Concession Coolers', zone: 'concourse', effect: 'Food safety temps — health code compliance' },
      { label: 'Suite Climate', zone: 'luxury', effect: 'VIP comfort — 72°F year-round' },
      { label: 'Server Rooms', zone: 'pressbox', effect: 'Electronics cooling — prevents overheating' },
    ],
  },
  drainage: {
    sources: ['Rain / Runoff', 'Stadium Sewage'],
    filterLabel: 'DRAIN FILTERS',
    outputs: [
      { label: 'Storm Sewer Mains', zone: 'underground', effect: 'Prevents underground flooding' },
      { label: 'Field SubAir System', zone: 'field', effect: 'Drains field surface — prevents rain delays' },
      { label: 'Restroom Sewage Lines', zone: 'concourse', effect: 'Prevents backup into fan areas' },
      { label: 'City Treatment Outflow', effect: 'EPA compliance — avoids fines & shutdowns' },
    ],
  },
  electrical: {
    sources: ['Utility Feed', 'Backup Generators'],
    filterLabel: 'ELECTRICAL GRID',
    outputs: [
      { label: 'HVAC Compressors', zone: 'mechanical', effect: 'Powers all heating & cooling' },
      { label: 'Scoreboard & Lights', zone: 'field', effect: 'Game display & night game lighting' },
      { label: 'Broadcast Equipment', zone: 'pressbox', effect: 'TV cameras, replay systems, radio' },
      { label: 'Pump Stations', zone: 'underground', effect: 'Water pressure & sump pumps' },
      { label: 'Suite Entertainment', zone: 'luxury', effect: 'TVs, POS systems, mini-bar fridges' },
    ],
  },
  pest: {
    sources: ['Concession Waste', 'Storm Drains'],
    filterLabel: 'PEST CONTROL',
    outputs: [
      { label: 'Food Court Perimeter', zone: 'concourse', effect: 'Traps near grills, fryers, dumpsters' },
      { label: 'Tunnel Network', zone: 'underground', effect: 'Barriers at sewer access & dark corridors' },
      { label: 'Warm Equipment Bays', zone: 'mechanical', effect: 'Prevents nesting near boilers & panels' },
      { label: 'Suite Dining Service', zone: 'luxury', effect: 'Protects VIP catering & wine storage' },
    ],
  },
};

/** What happens when each domain degrades — shown in expanded cards */
const DOMAIN_FAILURE_RISKS = {
  air: {
    warning: [
      { label: 'Stadium Haze', effect: 'Visible haze in concourse — fans complain, -5% revenue' },
      { label: 'Moldy Baseballs', effect: 'Poor air in storage rooms — equipment degrades faster' },
    ],
    critical: [
      { label: 'Thick Smog', effect: 'Hazardous air quality — -15% revenue, -8% attendance, -0.3 rep' },
      { label: 'Concession Shutdowns', effect: 'Health dept closes food stands until air quality restored' },
    ],
    bonus: [{ label: 'Clean Air', effect: 'Fans love the fresh air — +2% revenue, +2% attendance' }],
    protects: ['40k fans breathing in concourse halls', 'VIP suite air for sponsors & executives', 'Press box broadcast booths', 'Dust-free electrical & server rooms'],
  },
  water: {
    warning: [
      { label: 'Rusty Pipes', effect: 'Discolored water in restrooms — fan complaints, -5% revenue' },
      { label: 'Yellowing Grass', effect: 'Sprinkler system failing — field turning brown on camera' },
    ],
    critical: [
      { label: 'Water Contamination', effect: 'Brown water in all fixtures — -20% revenue, -0.5 rep' },
      { label: 'Dead Grass', effect: 'Outfield dies on national TV — team morale and attendance tank' },
      { label: 'Restroom Closures', effect: 'Health code violation — forced restroom shutdown, fans leave' },
    ],
    bonus: [{ label: 'Lush Green Field', effect: 'Pristine field conditions — +3% revenue, +3% attendance' }],
    protects: ['Restroom sinks, toilets & fountains for 40k fans', 'Concession ice machines & food prep sinks', 'Field sprinkler system & infield clay moisture', 'HVAC cooling tower water supply'],
  },
  hvac: {
    warning: [
      { label: 'Foggy Windows', effect: 'Luxury suite windows fogging — VIPs can\'t see the game' },
      { label: 'Moldy Baseballs', effect: 'Humidity in underground storage — balls & gloves growing mold' },
    ],
    critical: [
      { label: 'Mold Outbreak', effect: 'Mold in ductwork spreading to suites & concourse — -12% revenue' },
      { label: 'Equipment Overheating', effect: 'Server racks & broadcast gear thermal shutdown — -0.3 rep' },
      { label: 'Heat Exhaustion', effect: 'Fans & staff suffering in 100°F+ concourse — -10% attendance' },
    ],
    bonus: [{ label: 'Perfect Climate', effect: 'Comfortable fans spend more — +3% revenue, +3% concessions' }],
    protects: ['Baseball & glove storage humidity (prevents mold)', 'Concession cooler & freezer temps (health code)', 'Luxury suite climate at 72°F year-round', 'Server room & broadcast electronics cooling'],
  },
  drainage: {
    warning: [
      { label: 'Field Puddles', effect: 'Standing water in outfield after rain — game delay risk' },
      { label: 'Muddy Infield', effect: 'Infield too muddy for ground balls — umpire complaints' },
    ],
    critical: [
      { label: 'Flooding', effect: 'Storm sewers overwhelmed — pump rooms & tunnels underwater' },
      { label: 'Sewage Backup', effect: 'Sewage overflows into restrooms — emergency evacuation, -0.3 rep' },
      { label: 'Field Unplayable', effect: 'Game cancelled — standing water across outfield, refunds issued' },
    ],
    bonus: [{ label: 'Perfect Drainage', effect: 'Field always ready — no rain delays, +2% revenue' }],
    protects: ['Storm sewer mains (prevents underground flooding)', 'Restroom & concession sewage lines', 'Sump pumps keeping tunnels dry', 'Field SubAir system draining playing surface'],
  },
  electrical: {
    warning: [
      { label: 'Flickering Lights', effect: 'Fans notice power surges — scoreboard glitches, -3% revenue' },
      { label: 'Brownout Risk', effect: 'HVAC compressors straining on weak power — energy costs +15%' },
    ],
    critical: [
      { label: 'Partial Blackout', effect: 'Sections go dark — night game impossible, -15% revenue, -0.5 rep' },
      { label: 'Scoreboard Down', effect: 'No score display, no replay — broadcast disaster' },
      { label: 'Cascade Risk', effect: 'Below 30%: HVAC, pumps, ventilation ALL lose power — 25% faster decay' },
    ],
    bonus: [{ label: 'Full Power', effect: 'Brilliant lighting & reliable broadcasts — +3% revenue, -10% energy' }],
    protects: ['Stadium lights for night games & broadcast quality', 'Scoreboard, jumbotron & replay systems', 'HVAC compressors & boiler controls', 'Water pump stations & sump pumps', 'POS registers, suite TVs & security cameras'],
  },
  pest: {
    warning: [
      { label: 'Pest Sightings', effect: 'Fans see mice near hot dog stands — social media posts, -3% revenue' },
      { label: 'Kitchen Violations', effect: 'Inspector finds droppings in prep area — concession warning' },
    ],
    critical: [
      { label: 'Active Infestation', effect: 'Rats in concourse, roaches in kitchens — -15% revenue, -12% att' },
      { label: 'Pest on Camera', effect: 'Rat crosses home plate on live TV — viral disaster, -1.0 rep/tick' },
      { label: 'Escalation', effect: 'Below 40%: breeding accelerates 1.5x, below 20%: 2x — act fast' },
    ],
    bonus: [{ label: 'Pristine Venue', effect: 'Spotless sanitation — +8% concession revenue, +5 inspection' }],
    protects: ['Concession grills, fryers & dumpster perimeter', 'Sewer access points & dark tunnel corridors', 'Warm boiler rooms & electrical panel nesting spots', 'VIP catering kitchens & wine storage'],
  },
};

export class SystemsPanel {
  constructor(panelManager, state, eventBus, zoneManager) {
    this.state = state;
    this.eventBus = eventBus;
    this.zoneManager = zoneManager;
    this.panelManager = panelManager;

    /** @type {string|null} Currently expanded domain key */
    this._expandedDomain = null;
    this._lastSynergyStates = {};
    this._el = null;
    this._clickHandler = null;

    panelManager.register('systems', (el, state, eventBus) => {
      this._el = el;
      this._render(el);
    });

    this.eventBus.on('ui:toggleSystems', () => {
      if (panelManager.isOpen('systems')) {
        this.eventBus.emit('ui:closePanel');
      } else {
        this.eventBus.emit('ui:openPanel', { name: 'systems' });
      }
    });

    // Live-update subscriptions
    const rerender = () => this._rerender();
    this.eventBus.on('consequence:update', rerender);
    this.eventBus.on('filter:repaired', rerender);
    this.eventBus.on('filter:broken', rerender);
    this.eventBus.on('filter:added', rerender);
    this.eventBus.on('filter:removed', rerender);
    this.eventBus.on('filter:upgraded', rerender);

    // Synergy transition toasts
    this.eventBus.on('game:newDay', () => this._checkSynergyTransitions());
  }

  _rerender() {
    if (this._el && this.panelManager.isOpen('systems')) {
      this._render(this._el);
    }
  }

  // ── Synergy helpers ──────────────────────────────────────────────

  _computeSynergyStates() {
    const domainKeys = Object.keys(this.state.config?.filtrationSystems ?? {});
    const defaultHealth = {};
    for (const k of domainKeys) defaultHealth[k] = 100;
    const health = { ...defaultHealth, ...this.state.domainHealth };
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

  // ── Color helpers ────────────────────────────────────────────────

  _healthColor(score) {
    if (score > 80) return '#00e436';
    if (score > 50) return '#ffec27';
    if (score > 25) return '#ffa300';
    return '#ff004d';
  }

  _healthLabel(score) {
    if (score > 80) return 'EXCELLENT';
    if (score > 50) return 'ADEQUATE';
    if (score > 25) return 'WARNING';
    return 'CRITICAL';
  }

  _conditionColor(pct) {
    if (pct > 80) return '#00e436';
    if (pct > 50) return '#ffec27';
    if (pct > 25) return '#ffa300';
    return '#ff004d';
  }

  // ── Data access helpers ──────────────────────────────────────────

  _getFiltrationSystem() {
    return window.__game?.filtration ?? null;
  }

  _getDomainFilters(domain) {
    return (this.state.filters ?? []).filter(f => f.domain === domain);
  }

  /** Count total and empty vent slots for a domain across all zones. */
  _getDomainSlotInfo(domain) {
    const zoneIds = this.zoneManager?.getZoneIds?.() ?? [];
    // Filters store pixel coords (col*16), vent slots store grid coords (col).
    // Convert filter positions to grid coords for comparison.
    const occupiedPositions = new Set();
    for (const f of this.state.filters ?? []) {
      if (f.zone && f.x != null && f.y != null) {
        const gridCol = Math.floor(f.x / 16);
        const gridRow = Math.floor(f.y / 16);
        occupiedPositions.add(`${f.zone}:${gridCol}:${gridRow}`);
      }
    }
    let total = 0;
    let empty = 0;
    const emptySlots = []; // { zone, col, row }
    for (const zoneId of zoneIds) {
      const zone = this.zoneManager.getZone(zoneId);
      if (!zone?.ventSlots) continue;
      for (const slot of zone.ventSlots) {
        if (slot.domain !== domain) continue;
        total++;
        const key = `${zoneId}:${slot.col}:${slot.row}`;
        if (!occupiedPositions.has(key)) {
          empty++;
          emptySlots.push({ zone: zoneId, col: slot.col, row: slot.row });
        }
      }
    }
    return { total, empty, emptySlots };
  }

  /** Get the role description for a filter's component type from config. */
  _getComponentRole(filter) {
    const sys = this.state.config?.filtrationSystems?.[filter.domain];
    const comp = sys?.components?.[filter.componentType];
    return comp?.role ?? null;
  }

  /** Get the resale/salvage value for a filter. */
  _getFilterResaleValue(filter) {
    const fs = this._getFiltrationSystem();
    if (fs && typeof fs.getResaleValue === 'function') {
      return fs.getResaleValue(filter);
    }
    // Fallback: 20% of cost scaled by condition
    const tierDef = this.state.config?.filtrationSystems?.[filter.domain]?.components?.[filter.componentType]?.tiers?.find(t => t.tier === filter.tier);
    const baseCost = tierDef?.cost ?? 500;
    const condRatio = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
    return Math.floor(baseCost * 0.2 * condRatio);
  }

  _getFilterRepairCost(filter) {
    const fs = this._getFiltrationSystem();
    if (fs && typeof fs._getRepairCost === 'function') {
      return fs._getRepairCost(filter);
    }
    // Fallback estimate
    if (filter.condition >= filter.maxCondition) return 0;
    return Math.floor((filter.maxCondition - filter.condition) * 0.5 * (filter.tier || 1));
  }

  _getDomainRepairInfo(domain) {
    const fs = this._getFiltrationSystem();
    if (fs && typeof fs.getDomainRepairCost === 'function') {
      return fs.getDomainRepairCost(domain);
    }
    // Fallback: compute from filters
    const damaged = this._getDomainFilters(domain).filter(f => f.condition < f.maxCondition);
    const totalCost = damaged.reduce((sum, f) => sum + this._getFilterRepairCost(f), 0);
    return { totalCost, filterCount: damaged.length, filters: damaged };
  }

  _getDomainStats(domain) {
    const fs = this._getFiltrationSystem();
    if (fs && typeof fs.getDomainStats === 'function') {
      return fs.getDomainStats(domain);
    }
    // Fallback stats
    const filters = this._getDomainFilters(domain);
    const totalEff = filters.reduce((s, f) => s + f.efficiency, 0);
    const warningCount = filters.filter(f => f.condition > 0 && f.condition / f.maxCondition < 0.5).length;
    const brokenCount = filters.filter(f => f.condition <= 0).length;
    return {
      filterCount: filters.length,
      avgEfficiency: filters.length > 0 ? totalEff / filters.length : 0,
      brokenCount,
      warningCount,
      degradeRate: 'normal',
    };
  }

  _getFilterTierName(filter) {
    const sys = this.state.config?.filtrationSystems?.[filter.domain];
    const comp = sys?.components?.[filter.componentType];
    const td = comp?.tiers?.find(t => t.tier === filter.tier);
    return td?.name ?? filter.type ?? 'Filter';
  }

  /**
   * Get upgrade info for a filter: next tier def, cost, and whether player can afford it.
   * Returns null if no upgrade available.
   */
  _getFilterUpgradeInfo(filter) {
    const sys = this.state.config?.filtrationSystems?.[filter.domain];
    const comp = sys?.components?.[filter.componentType];
    if (!comp) return null;

    const currentTierDef = comp.tiers?.find(t => t.tier === filter.tier);
    const nextTierDef = comp.tiers?.find(t => t.tier === (filter.tier ?? 0) + 1);
    if (!nextTierDef) return null;

    // Check reputation gate
    const repTiers = this.state.config.reputation?.tiers ?? [];
    const tierUnlockMap = { 2: 'tier2Upgrades', 3: 'tier3Upgrades', 4: 'tier4Upgrades' };
    const unlockKey = tierUnlockMap[nextTierDef.tier];
    if (unlockKey) {
      const isUnlocked = repTiers.some(
        t => this.state.reputation >= t.min && t.unlocks?.includes(unlockKey)
      );
      if (!isUnlocked) return { locked: true, nextTier: nextTierDef.tier, name: nextTierDef.name };
    }

    const cost = Math.max(0, nextTierDef.cost - Math.floor((currentTierDef?.cost ?? 0) * 0.5));
    return { locked: false, nextTier: nextTierDef.tier, name: nextTierDef.name, cost, canAfford: this.state.money >= cost };
  }

  _getStaffForDomain(domain) {
    return (this.state.staffList ?? []).filter(s => s.assignedDomain === domain);
  }

  _getActiveConsequences(domain) {
    return (this.state.activeConsequences ?? []).filter(c => c.domain === domain);
  }

  _isHealthDropping(domain) {
    const history = this.state.domainHealthHistory?.[domain];
    if (!history || history.length < 2) return false;
    return history[history.length - 1] < history[history.length - 2];
  }

  // ── Main render ──────────────────────────────────────────────────

  _render(el) {
    const domainKeys = Object.keys(this.state.config?.filtrationSystems ?? {});
    const defaultHealth = {};
    for (const k of domainKeys) defaultHealth[k] = 100;
    const health = { ...defaultHealth, ...this.state.domainHealth };

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

    let html = '';

    // Header
    html += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:2px solid #8b4513;background:linear-gradient(180deg,rgba(139,69,19,0.15),rgba(0,0,0,0.3));">
        <strong style="color:#29adff;letter-spacing:1px">STADIUM SYSTEMS OVERVIEW</strong>
        <span data-action="close-systems" style="cursor:pointer;color:#888;font-size:14px">\u2715</span>
      </div>
    `;

    // Synergy banner
    const synergyStates = this._computeSynergyStates();
    html += this._buildSynergyBanner(synergyStates);

    // Domain grid — data-driven from config
    const domains = domainKeys.length > 0 ? domainKeys : ['water', 'air', 'hvac', 'drainage'];
    const expanded = this._expandedDomain;
    const collapsedCount = expanded ? domains.length - 1 : domains.length;
    const gridCols = expanded ? Math.min(collapsedCount, 5) : (domains.length <= 4 ? 2 : 3);

    html += `<div style="flex:1;display:flex;flex-direction:column;gap:8px;padding:8px;overflow-y:auto;" data-region="grid">`;

    if (expanded) {
      // Expanded card takes full width at top, collapsed cards in a row below
      html += this._buildExpandedCard(expanded, health[expanded] ?? 100);
      html += `<div style="display:grid;grid-template-columns:repeat(${gridCols}, 1fr);gap:8px;">`;
      for (const d of domains) {
        if (d !== expanded) {
          html += this._buildCollapsedCard(d, health[d] ?? 100);
        }
      }
      html += `</div>`;
    } else {
      // Grid — 2 cols for ≤4 domains, 3 cols for more
      html += `<div style="display:grid;grid-template-columns:repeat(${gridCols}, 1fr);gap:8px;flex:1;">`;
      for (const d of domains) {
        html += this._buildCollapsedCard(d, health[d] ?? 100);
      }
      html += `</div>`;
    }

    html += `</div>`;

    el.innerHTML = html;

    // Attach click handlers
    this._attachEvents(el);
  }

  // ── Synergy banner ───────────────────────────────────────────────

  _buildSynergyBanner(synergyStates) {
    const entries = Object.values(synergyStates);
    const hasAnySynergy = entries.some(s => s.active || s.stressed);

    if (!hasAnySynergy) {
      return `<div style="padding:5px 12px;font-size:10px;color:#555;border-bottom:1px solid #333;background:rgba(0,0,0,0.2);">
        Synergies: No active cross-domain bonuses. Keep paired systems above 70% to activate.
      </div>`;
    }

    let html = `<div style="display:flex;gap:8px;padding:6px 12px;border-bottom:1px solid #333;background:rgba(0,0,0,0.2);flex-wrap:wrap;">`;
    for (const s of entries) {
      if (s.active) {
        html += `<span title="${s.pair.label}: Both domains above ${SYNERGY_BOOST_THRESHOLD}%. +${s.pair.boostPct}% efficiency to both." style="font-size:10px;color:#00e436;background:rgba(0,228,54,0.1);border:1px solid #00e43644;padding:1px 8px;border-radius:2px;cursor:default;">${s.pair.label} Synergy Active: +${s.pair.boostPct}%</span>`;
      }
      if (s.stressed) {
        html += `<span title="${s.pair.label}: A domain dropped below ${SYNERGY_STRESS_THRESHOLD}%. -${s.pair.stressPct}% efficiency penalty." style="font-size:10px;color:#ff004d;background:rgba(255,0,77,0.1);border:1px solid #ff004d44;padding:1px 8px;border-radius:2px;cursor:default;">${s.pair.label} Stress: -${s.pair.stressPct}%</span>`;
      }
    }
    html += `</div>`;
    return html;
  }

  // ── Collapsed card ───────────────────────────────────────────────

  _buildCollapsedCard(domain, score) {
    const color = DOMAIN_COLORS[domain] ?? '#888';
    const scoreColor = this._healthColor(score);
    const label = DOMAIN_LABELS[domain] ?? domain.toUpperCase();
    const stats = this._getDomainStats(domain);
    const staff = this._getStaffForDomain(domain);
    const consequences = this._getActiveConsequences(domain);
    const dropping = this._isHealthDropping(domain);
    const flow = DOMAIN_FLOW_NODES[domain];

    // Border pulse if dropping
    const borderStyle = dropping
      ? `2px solid ${scoreColor}`
      : `1px solid ${score > 50 ? color + '44' : '#ff004d66'}`;

    let html = `
      <div data-action="toggle-domain" data-domain="${domain}" style="
        background: rgba(0,0,0,0.3);
        border: ${borderStyle};
        border-radius: 3px; padding: 8px;
        cursor: pointer;
        ${dropping ? `box-shadow: 0 0 8px ${scoreColor}44;` : ''}
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="color:${color};font-weight:bold;font-size:13px">${label}</span>
          <span style="color:${scoreColor};font-size:10px;border:1px solid ${scoreColor};padding:1px 6px;border-radius:2px">${this._healthLabel(score)} ${score}%</span>
        </div>
    `;

    // Wire diagram: sources ─┬─> [FILTER] ─┬─> outputs with health dots
    if (flow) {
      html += this._buildWireDiagram(domain, flow, score, scoreColor, color);
    }

    // Active consequence badges
    if (consequences.length > 0) {
      html += `<div style="margin-top:3px;">`;
      for (const c of consequences) {
        const cColor = (c.severity === 'critical' || c.severity === 'severe') ? '#ff004d' : '#ffa300';
        html += `<span style="font-size:9px;color:${cColor};background:${cColor}18;border:1px solid ${cColor}44;padding:1px 6px;border-radius:2px;margin-right:4px;">${c.name ?? c.type ?? 'ACTIVE'}</span>`;
      }
      html += `</div>`;
    }

    // Staff + slots summary
    const slotInfo = this._getDomainSlotInfo(domain);
    const staffLabel = staff.length > 0
      ? `${staff.length} staff`
      : 'No staff';
    const staffColor = staff.length > 0 ? '#888' : '#ffec27';
    const slotLabel = slotInfo.empty > 0
      ? `${slotInfo.empty}/${slotInfo.total} slots open`
      : `${slotInfo.total} slots full`;
    const slotColor = slotInfo.empty > 0 ? '#ffec27' : '#555';
    html += `<div style="display:flex;gap:8px;font-size:9px;margin-top:3px;">
      <span style="color:${staffColor}">${staffLabel}</span>
      <span style="color:${slotColor}">${slotLabel}</span>
    </div>`;

    html += `</div>`;
    return html;
  }

  /**
   * Build a compact wire diagram for a collapsed domain card.
   * Shows: sources ──> [FILTER NODE] ──> outputs, with health dots at each node.
   *
   * Source nodes are always "healthy" (green dot).
   * The filter node shows the actual domain health color.
   * Output nodes degrade based on domain health: green >80%, yellow >50%, orange >25%, red ≤25%.
   * Outputs with effects show the effect name; zone-linked outputs are underlined.
   */
  _buildWireDiagram(domain, flow, score, scoreColor, domainColor) {
    const dotStyle = (c) => `display:inline-block;width:6px;height:6px;border-radius:50%;background:${c};flex-shrink:0;`;
    const wireColor = domainColor + '55';
    const zdh = this.state.zoneDomainHealth ?? {};

    let html = `<div style="font-size:9px;color:#666;margin:4px 0;line-height:1.5;">`;

    // Sources row
    for (let i = 0; i < flow.sources.length; i++) {
      const isLast = i === flow.sources.length - 1;
      const connector = isLast ? '└' : '├';
      html += `<div style="display:flex;align-items:center;gap:4px;padding-left:2px;">
        <span style="${dotStyle('#00e436')}"></span>
        <span style="color:#777;">${flow.sources[i]}</span>
        <span style="color:${wireColor};flex:1;overflow:hidden;white-space:nowrap;">${'─'.repeat(20)}</span>
        <span style="color:${wireColor};">${connector}┐</span>
      </div>`;
    }

    // Filter node (central)
    html += `<div style="display:flex;align-items:center;justify-content:center;gap:4px;padding:3px 0;">
      <span style="color:${wireColor};">──</span>
      <span style="${dotStyle(scoreColor)}"></span>
      <span style="color:${scoreColor};font-weight:bold;border:1px ${score > 50 ? 'dashed' : 'solid'} ${scoreColor};padding:1px 6px;border-radius:2px;background:${scoreColor}15;">
        [${flow.filterLabel}] ${score}%
      </span>
      <span style="${dotStyle(scoreColor)}"></span>
      <span style="color:${wireColor};">──</span>
    </div>`;

    // Outputs row — each output shows its TARGET ZONE's health for this domain
    for (let i = 0; i < flow.outputs.length; i++) {
      const out = flow.outputs[i];
      const isFirst = i === 0;
      const connector = isFirst ? '┌' : (i === flow.outputs.length - 1 ? '└' : '├');

      // Zone-specific health for this output's target zone
      const zoneScore = out.zone ? (zdh[out.zone]?.[domain] ?? score) : score;
      const zoneDotColor = this._healthColor(zoneScore);
      const zoneBadge = out.zone ? `<span style="color:${zoneDotColor};font-size:8px;margin-left:2px;">[${Math.floor(zoneScore)}%]</span>` : '';

      const effectStr = out.effect ? ` → <span style="color:${zoneDotColor}">${out.effect}</span>` : '';
      const zoneAttr = out.zone ? `data-goto-zone="${out.zone}"` : '';
      const zoneStyle = out.zone ? 'text-decoration:underline;cursor:pointer;' : '';

      html += `<div style="display:flex;align-items:center;gap:4px;padding-left:2px;">
        <span style="color:${wireColor};">${connector}─</span>
        <span style="color:${wireColor};flex:0 0 auto;">${'─'.repeat(3)}</span>
        <span style="${dotStyle(zoneDotColor)}"></span>
        <span ${zoneAttr} style="color:#888;${zoneStyle}">${out.label}</span>${zoneBadge}${effectStr}
      </div>`;
    }

    html += `</div>`;
    return html;
  }

  // ── Expanded card ────────────────────────────────────────────────

  _buildExpandedCard(domain, score) {
    const color = DOMAIN_COLORS[domain] ?? '#888';
    const scoreColor = this._healthColor(score);
    const label = DOMAIN_LABELS[domain] ?? domain.toUpperCase();
    const filters = this._getDomainFilters(domain);
    const repairInfo = this._getDomainRepairInfo(domain);
    const staff = this._getStaffForDomain(domain);
    const consequences = this._getActiveConsequences(domain);
    const stats = this._getDomainStats(domain);
    const dropping = this._isHealthDropping(domain);

    let html = `
      <div style="
        background: rgba(0,0,0,0.4);
        border: 2px solid ${color}88;
        border-radius: 3px; padding: 10px;
        ${dropping ? `box-shadow: 0 0 10px ${scoreColor}44;` : ''}
      ">
    `;

    // Header row (clickable to collapse)
    html += `
      <div data-action="toggle-domain" data-domain="${domain}" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;cursor:pointer;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:${color};font-weight:bold;font-size:14px">${label}</span>
          <span style="color:${scoreColor};font-size:11px;border:1px solid ${scoreColor};padding:1px 6px;border-radius:2px">${this._healthLabel(score)} ${score}%</span>
          ${staff.length > 0
            ? `<span style="font-size:10px;color:#888;">${staff.length} staff</span>`
            : `<span style="font-size:10px;color:#ffec27;">No staff</span>`
          }
        </div>
        <span style="color:#888;font-size:12px;">\u25B2 collapse</span>
      </div>
    `;

    // Health bar
    html += `
      <div style="background:#222;height:4px;border-radius:2px;margin-bottom:8px;">
        <div style="background:${scoreColor};height:100%;width:${Math.max(0, Math.min(100, score))}%;border-radius:2px;"></div>
      </div>
    `;

    // Section 1: Filter List + Empty Slots
    const slotInfo = this._getDomainSlotInfo(domain);
    const zoneLabels = { field: 'Field', concourse: 'Concourse', mechanical: 'Mechanical', underground: 'Underground', luxury: 'Luxury', pressbox: 'Press Box' };

    html += `<div style="margin-bottom:8px;">`;
    html += `<div style="color:#aaa;font-size:10px;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Slots (${filters.length}/${slotInfo.total} occupied)</div>`;

    // Installed filters
    for (const f of filters) {
      const condPct = f.maxCondition > 0 ? Math.round((f.condition / f.maxCondition) * 100) : 0;
      const condColor = this._conditionColor(condPct);
      const effPct = Math.round(f.efficiency * 100);
      const repairCost = this._getFilterRepairCost(f);
      const needsRepair = f.condition < f.maxCondition;
      const canAfford = this.state.money >= repairCost;
      const tierBadge = f.tier ? `T${f.tier}` : '';
      const filterName = this._getFilterTierName(f);
      const upgradeInfo = this._getFilterUpgradeInfo(f);
      const role = this._getComponentRole(f);
      const resaleValue = this._getFilterResaleValue(f);

      // Condition bar (inline, ~60px wide)
      const barWidth = 60;
      const filledWidth = Math.round(barWidth * condPct / 100);

      // Build action buttons
      let actionButtons = '';
      if (needsRepair) {
        actionButtons += `<button data-action="repair-filter" data-filter-id="${f.id}"
            style="background:${canAfford ? '#1a3a2a' : '#2a2a2a'};color:${canAfford ? '#00e436' : '#555'};
            border:1px solid ${canAfford ? '#3a6a4a' : '#333'};padding:2px 8px;font-family:monospace;
            cursor:${canAfford ? 'pointer' : 'not-allowed'};font-size:10px;white-space:nowrap;">
            REPAIR $${repairCost.toLocaleString()}
          </button>`;
      }
      if (upgradeInfo) {
        if (upgradeInfo.locked) {
          actionButtons += `<span style="color:#555;font-size:9px;white-space:nowrap;" title="Reputation too low for T${upgradeInfo.nextTier}">T${upgradeInfo.nextTier} LOCKED</span>`;
        } else {
          actionButtons += `<button data-action="upgrade-filter" data-filter-id="${f.id}" data-new-tier="${upgradeInfo.nextTier}"
              style="background:${upgradeInfo.canAfford ? '#1a1a3a' : '#2a2a2a'};color:${upgradeInfo.canAfford ? '#29adff' : '#555'};
              border:1px solid ${upgradeInfo.canAfford ? '#3a5a8a' : '#333'};padding:2px 8px;font-family:monospace;
              cursor:${upgradeInfo.canAfford ? 'pointer' : 'not-allowed'};font-size:10px;white-space:nowrap;"
              title="Upgrade to ${upgradeInfo.name}">
              T${upgradeInfo.nextTier} $${upgradeInfo.cost.toLocaleString()}
            </button>`;
        }
      }
      // Remove/sell button
      actionButtons += `<button data-action="remove-filter" data-filter-id="${f.id}"
          style="background:#2a1a1a;color:#ff8800;border:1px solid #5a3a3a;padding:2px 8px;font-family:monospace;cursor:pointer;font-size:10px;white-space:nowrap;"
          title="Remove filter${resaleValue > 0 ? ` (salvage $${resaleValue.toLocaleString()})` : ''}">
          REMOVE${resaleValue > 0 ? ` +$${resaleValue.toLocaleString()}` : ''}
        </button>`;

      // Zone label for filter
      const filterZone = f.zone ? (zoneLabels[f.zone] ?? f.zone) : '';

      html += `
        <div style="padding:4px 6px;margin-bottom:2px;background:rgba(255,255,255,0.03);border-radius:2px;font-size:11px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span data-action="goto-filter" data-filter-id="${f.id}" style="color:#e0e0e0;cursor:pointer;text-decoration:underline;min-width:90px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="Click to inspect">${filterName}</span>
            ${tierBadge ? `<span style="color:${color};font-size:9px;border:1px solid ${color}66;padding:0 4px;border-radius:2px;">${tierBadge}</span>` : ''}
            ${filterZone ? `<span style="color:#666;font-size:9px;">${filterZone}</span>` : ''}
            <div style="display:flex;align-items:center;gap:4px;min-width:90px;">
              <div style="background:#222;width:${barWidth}px;height:4px;border-radius:2px;flex-shrink:0;">
                <div style="background:${condColor};height:100%;width:${filledWidth}px;border-radius:2px;"></div>
              </div>
              <span style="color:${condColor};font-size:10px;width:30px;">${condPct}%</span>
            </div>
            <span style="color:#888;font-size:10px;width:40px;">eff ${effPct}%</span>
            <div style="display:flex;gap:4px;margin-left:auto;align-items:center;">${actionButtons}</div>
          </div>
          ${role ? `<div style="color:#666;font-size:9px;padding-left:2px;margin-top:1px;font-style:italic;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${role}">\u25b8 ${role}</div>` : ''}
        </div>
      `;
    }

    // Empty slot rows (same list, styled as empty)
    for (const slot of slotInfo.emptySlots) {
      const slotZone = zoneLabels[slot.zone] ?? slot.zone;
      html += `
        <div style="padding:4px 6px;margin-bottom:2px;background:rgba(255,255,255,0.02);border:1px dashed #333;border-radius:2px;font-size:11px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#555;min-width:90px;flex-shrink:0;font-style:italic;">Empty Slot</span>
            <span style="color:#444;font-size:9px;">${slotZone}</span>
            <div style="flex:1;"></div>
            <button data-action="buy-slot" data-zone="${slot.zone}" data-domain="${domain}" data-col="${slot.col}" data-row="${slot.row}"
              style="background:#1a1a3a;color:#29adff;border:1px solid #3a5a8a;padding:2px 10px;font-family:monospace;cursor:pointer;font-size:10px;white-space:nowrap;">
              BUY
            </button>
          </div>
        </div>
      `;
    }

    if (slotInfo.total === 0) {
      html += `<div style="color:#555;font-size:11px;padding:6px 0;">No vent slots available for this domain.</div>`;
    }
    html += `</div>`;

    // Section 2: Domain Actions
    html += `<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">`;

    // Repair All button
    const hasDamaged = repairInfo.filterCount > 0;
    const canAffordAll = hasDamaged && this.state.money >= repairInfo.totalCost;
    html += `
      <button data-action="repair-all" data-domain="${domain}"
        style="background:${canAffordAll ? '#1a3a2a' : '#2a2a2a'};color:${canAffordAll ? '#00e436' : '#555'};
        border:1px solid ${canAffordAll ? '#3a6a4a' : '#333'};padding:5px 12px;font-family:monospace;
        cursor:${canAffordAll ? 'pointer' : 'not-allowed'};font-size:11px;"
        ${!canAffordAll ? 'disabled' : ''}>
        REPAIR ALL${hasDamaged ? ` - $${repairInfo.totalCost.toLocaleString()}` : ' - N/A'}
        </button>
      `;

    html += `</div>`;

    // Section 3: Status Indicators
    html += `<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;align-items:center;">`;

    // Active consequences
    if (consequences.length > 0) {
      for (const c of consequences) {
        const cColor = (c.severity === 'critical' || c.severity === 'severe') ? '#ff004d' : '#ffa300';
        html += `<span style="font-size:9px;color:${cColor};background:${cColor}18;border:1px solid ${cColor}44;padding:1px 6px;border-radius:2px;">${c.name ?? c.type ?? 'ACTIVE'}</span>`;
      }
    }

    // Cascade risks
    if (score < 30) {
      const interactions = this.state.config?.systemInteractions ?? [];
      const cascadeTargets = interactions
        .filter(ix => ix.source === domain)
        .map(ix => ix.target);
      if (cascadeTargets.length > 0) {
        html += `<span style="font-size:9px;color:#ff004d;background:rgba(255,0,77,0.1);border:1px solid #ff004d44;padding:1px 6px;border-radius:2px;">Cascade risk: ${cascadeTargets.join(', ')}</span>`;
      }
    }

    // Market multiplier
    const marketMult = this.state.market?.domainMultipliers?.[domain];
    if (marketMult != null && marketMult !== 1) {
      const mColor = marketMult > 1 ? '#ff004d' : '#00e436';
      const mLabel = marketMult > 1 ? `Price x${marketMult.toFixed(1)}` : `Price x${marketMult.toFixed(1)}`;
      html += `<span style="font-size:9px;color:${mColor};background:${mColor}18;border:1px solid ${mColor}44;padding:1px 6px;border-radius:2px;">${mLabel}</span>`;
    }

    // Degradation rate
    const degradeRate = stats.degradeRate ?? 'normal';
    if (degradeRate === 'elevated') {
      html += `<span style="font-size:9px;color:#ffa300;background:rgba(255,163,0,0.1);border:1px solid #ffa30044;padding:1px 6px;border-radius:2px;">Degradation: Elevated</span>`;
    } else if (degradeRate === 'critical') {
      html += `<span style="font-size:9px;color:#ff004d;background:rgba(255,0,77,0.1);border:1px solid #ff004d44;padding:1px 6px;border-radius:2px;">Degradation: Critical</span>`;
    }

    html += `</div>`;

    // Section 4: Failure Risks & Bonuses
    const risks = DOMAIN_FAILURE_RISKS[domain];
    if (risks) {
      html += `<div style="margin-bottom:8px;">`;
      html += `<div style="color:#aaa;font-size:10px;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Consequences</div>`;
      // Bonus
      for (const b of risks.bonus ?? []) {
        const active = score > 80;
        html += `<div style="font-size:10px;color:${active ? '#00e436' : '#555'};margin-bottom:2px;padding:2px 6px;background:${active ? 'rgba(0,228,54,0.08)' : 'transparent'};border-radius:2px;">
          ${active ? '\u2713' : '\u25cb'} <strong>${b.label}</strong> — ${b.effect}
        </div>`;
      }
      // Warning
      for (const w of risks.warning ?? []) {
        const active = score <= (this.state.config?.filtrationSystems?.[domain]?.warningThreshold ?? 60);
        html += `<div style="font-size:10px;color:${active ? '#ffa300' : '#666'};margin-bottom:2px;padding:2px 6px;background:${active ? 'rgba(255,163,0,0.08)' : 'transparent'};border-radius:2px;">
          ${active ? '\u26a0' : '\u25cb'} <strong>${w.label}</strong> — ${w.effect}
        </div>`;
      }
      // Critical
      for (const c of risks.critical ?? []) {
        const active = score <= (this.state.config?.filtrationSystems?.[domain]?.criticalThreshold ?? 30);
        html += `<div style="font-size:10px;color:${active ? '#ff004d' : '#666'};margin-bottom:2px;padding:2px 6px;background:${active ? 'rgba(255,0,77,0.08)' : 'transparent'};border-radius:2px;">
          ${active ? '\u2717' : '\u25cb'} <strong>${c.label}</strong> — ${c.effect}
        </div>`;
      }
      // What this domain protects
      if (risks.protects?.length > 0) {
        html += `<div style="margin-top:4px;font-size:9px;color:#888;padding:2px 6px;">Protects: ${risks.protects.join(' \u2022 ')}</div>`;
      }
      html += `</div>`;
    }

    // Section 5: Zone Health Breakdown
    const zdh = this.state.zoneDomainHealth ?? {};
    const flow = DOMAIN_FLOW_NODES[domain];
    if (flow) {
      const protectedZones = flow.outputs.filter(o => o.zone).map(o => o.zone);
      const uniqueZones = [...new Set(protectedZones)];
      if (uniqueZones.length > 0) {
        const zoneLabelsMap = { field: 'Field', concourse: 'Concourse', mechanical: 'Mechanical', underground: 'Underground', luxury: 'Luxury', pressbox: 'Press Box' };
        html += `<div style="margin-bottom:8px;">`;
        html += `<div style="color:#aaa;font-size:10px;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Zone Health</div>`;
        html += `<div style="display:grid;grid-template-columns:80px 1fr 30px;gap:2px 6px;font-size:10px;">`;
        for (const z of uniqueZones) {
          const zScore = zdh[z]?.[domain] ?? score;
          const zColor = this._healthColor(zScore);
          const barPct = Math.max(0, Math.min(100, zScore));
          html += `
            <span style="color:#888">${zoneLabelsMap[z] ?? z}</span>
            <div style="background:#222;height:4px;border-radius:2px;align-self:center;">
              <div style="background:${zColor};height:100%;width:${barPct}%;border-radius:2px;"></div>
            </div>
            <span style="color:${zColor};font-size:9px;">${Math.floor(zScore)}%</span>
          `;
        }
        html += `</div></div>`;
      }
    }

    // Section 6: Synergy Info
    html += this._buildExpandedSynergySection(domain, score);

    html += `</div>`;
    return html;
  }

  // ── Expanded synergy section ─────────────────────────────────────

  _buildExpandedSynergySection(domain, score) {
    const health = this.state.domainHealth ?? {};

    for (const pair of SYNERGY_PAIRS) {
      if (pair.a !== domain && pair.b !== domain) continue;

      const partner = pair.a === domain ? pair.b : pair.a;
      const partnerScore = health[partner] ?? 100;
      const partnerColor = DOMAIN_COLORS[partner] ?? '#888';

      let statusText, statusColor;
      if (score > SYNERGY_BOOST_THRESHOLD && partnerScore > SYNERGY_BOOST_THRESHOLD) {
        statusText = `Synergy Active +${pair.boostPct}%`;
        statusColor = '#00e436';
      } else if (score < SYNERGY_STRESS_THRESHOLD || partnerScore < SYNERGY_STRESS_THRESHOLD) {
        statusText = `Stress Active -${pair.stressPct}%`;
        statusColor = '#ff004d';
      } else {
        statusText = 'Inactive (need both >70%)';
        statusColor = '#555';
      }

      const myBarW = Math.max(0, Math.min(100, score));
      const partnerBarW = Math.max(0, Math.min(100, partnerScore));

      return `
        <div style="padding:6px 8px;background:rgba(255,255,255,0.02);border-radius:2px;border-left:2px solid ${statusColor};">
          <div style="font-size:9px;color:#888;margin-bottom:3px;">SYNERGY: ${pair.label}</div>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:3px;">
            <div style="flex:1;">
              <div style="font-size:9px;color:${DOMAIN_COLORS[domain]};margin-bottom:1px;">${domain} ${score}%</div>
              <div style="background:#222;height:3px;border-radius:2px;">
                <div style="background:${DOMAIN_COLORS[domain]};height:100%;width:${myBarW}%;border-radius:2px;"></div>
              </div>
            </div>
            <div style="flex:1;">
              <div style="font-size:9px;color:${partnerColor};margin-bottom:1px;">${partner} ${partnerScore}%</div>
              <div style="background:#222;height:3px;border-radius:2px;">
                <div style="background:${partnerColor};height:100%;width:${partnerBarW}%;border-radius:2px;"></div>
              </div>
            </div>
          </div>
          <div style="font-size:10px;color:${statusColor};">${statusText}</div>
        </div>
      `;
    }
    return '';
  }

  // ── Event handlers ───────────────────────────────────────────────

  _attachEvents(el) {
    if (this._clickHandler) {
      el.removeEventListener('click', this._clickHandler);
    }

    this._clickHandler = (e) => {
      // Close button
      if (e.target.closest('[data-action="close-systems"]')) {
        this.eventBus.emit('ui:closePanel');
        return;
      }

      // Toggle domain expand/collapse
      const toggleBtn = e.target.closest('[data-action="toggle-domain"]');
      if (toggleBtn) {
        const domain = toggleBtn.dataset.domain;
        this.eventBus.emit('ui:click');
        if (this._expandedDomain === domain) {
          this._expandedDomain = null;
        } else {
          this._expandedDomain = domain;
        }
        this._render(el);
        return;
      }

      // Repair single filter
      const repairBtn = e.target.closest('[data-action="repair-filter"]');
      if (repairBtn) {
        const filterId = parseInt(repairBtn.dataset.filterId, 10);
        this.eventBus.emit('ui:click');
        this.eventBus.emit('filter:repair', { id: filterId });
        setTimeout(() => this._rerender(), 50);
        return;
      }

      // Upgrade filter
      const upgradeBtn = e.target.closest('[data-action="upgrade-filter"]');
      if (upgradeBtn) {
        const filterId = parseInt(upgradeBtn.dataset.filterId, 10);
        const newTier = parseInt(upgradeBtn.dataset.newTier, 10);
        this.eventBus.emit('ui:click');
        this.eventBus.emit('filter:upgrade', { id: filterId, newTier });
        setTimeout(() => this._rerender(), 50);
        return;
      }

      // Repair All domain
      const repairAllBtn = e.target.closest('[data-action="repair-all"]');
      if (repairAllBtn) {
        const domain = repairAllBtn.dataset.domain;
        this.eventBus.emit('ui:click');
        this.eventBus.emit('domain:repairAll', { domain });
        setTimeout(() => this._rerender(), 50);
        return;
      }

      // Remove/sell filter
      const removeBtn = e.target.closest('[data-action="remove-filter"]');
      if (removeBtn) {
        const filterId = parseInt(removeBtn.dataset.filterId, 10);
        this.eventBus.emit('ui:click');
        this.eventBus.emit('filter:remove', { id: filterId });
        setTimeout(() => this._rerender(), 50);
        return;
      }

      // Buy filter for an empty vent slot — navigate to zone and open install panel
      const buySlotBtn = e.target.closest('[data-action="buy-slot"]');
      if (buySlotBtn && this.zoneManager) {
        const zone = buySlotBtn.dataset.zone;
        const domain = buySlotBtn.dataset.domain;
        const col = parseInt(buySlotBtn.dataset.col, 10);
        const row = parseInt(buySlotBtn.dataset.row, 10);
        this.eventBus.emit('ui:click');
        this.eventBus.emit('ui:closePanel');
        this.zoneManager.switchZone(zone);
        // Zone transition takes ~150ms to apply; wait for it before opening the install panel
        setTimeout(() => {
          this.eventBus.emit('ui:openPanel', { name: 'ventSlot', data: { col, row, domain } });
        }, 200);
        return;
      }

      // Navigate to filter (close panel, switch zone, open inspector)
      const gotoBtn = e.target.closest('[data-action="goto-filter"]');
      if (gotoBtn) {
        const filterId = parseInt(gotoBtn.dataset.filterId, 10);
        const filter = this.state.getFilter?.(filterId);
        this.eventBus.emit('ui:click');
        this.eventBus.emit('ui:closePanel');
        if (filter && this.zoneManager) {
          const zone = filter.zone ?? 'mechanical';
          this.zoneManager.switchZone(zone);
        }
        setTimeout(() => {
          this.eventBus.emit('ui:openPanel', { name: 'filterInspector', data: { filterId } });
        }, 50);
        return;
      }

      // Zone navigation links (kept from original)
      const zoneLink = e.target.closest('[data-goto-zone]');
      if (zoneLink && this.zoneManager) {
        this.zoneManager.switchZone(zoneLink.dataset.gotoZone);
        this.eventBus.emit('ui:closePanel');
      }
    };

    el.addEventListener('click', this._clickHandler);
  }
}
