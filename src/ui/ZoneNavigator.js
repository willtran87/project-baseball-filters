/**
 * ZoneNavigator -- Minimap overlay showing a top-down stadium layout.
 *
 * Rendered as an HTML element positioned in the bottom-left corner.
 * Players click zone regions to navigate between stadium areas.
 */

export class ZoneNavigator {
  constructor(container, zoneManager, state, eventBus) {
    this._zoneManager = zoneManager;
    this._state = state;
    this._eventBus = eventBus;

    this._el = document.createElement('div');
    this._el.style.cssText = `
      position: absolute; bottom: 46px; left: 8px;
      width: 200px; height: 140px;
      background: rgba(10,8,20,0.92);
      border: 2px solid #8b4513;
      border-radius: 3px;
      font-family: monospace;
      pointer-events: auto;
      z-index: 15;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(139,69,19,0.3);
      overflow: hidden;
    `;
    container.appendChild(this._el);

    this._el.addEventListener('click', (e) => this._handleClick(e));
    this._eventBus.on('zone:changed', () => this._render());
    this._eventBus.on('consequence:update', () => this._render());
    this._eventBus.on('filter:added', () => this._render());
    this._eventBus.on('filter:removed', () => this._render());
    this._render();
  }

  _render() {
    const active = this._zoneManager.getActiveZoneId();

    // Map domain consequences to affected zones
    const domainZoneMap = {
      air:      ['concourse', 'mechanical'],
      water:    ['concourse', 'underground', 'field'],
      hvac:     ['luxury', 'pressbox', 'mechanical'],
      drainage: ['underground', 'field'],
    };

    // Build a map of zone -> worst severity from active consequences
    const zoneWarnings = {};
    const consequences = this._state.activeConsequences;
    if (consequences && consequences.length > 0) {
      for (const c of consequences) {
        const affectedZones = domainZoneMap[c.domain] ?? [];
        for (const zId of affectedZones) {
          const existing = zoneWarnings[zId];
          if (!existing || c.severity === 'critical') {
            zoneWarnings[zId] = c.severity;
          }
        }
      }
    }

    // Zone layout (top-down baseball stadium view):
    //   PRESS BOX  -- narrow bar at the very top (behind home plate, upper deck)
    //   LUXURY     -- row below press box (suite level)
    //   CONCOURSE  -- arc wrapping around the upper portion
    //   FIELD      -- diamond shape in the center
    //   MECHANICAL -- small box bottom-left (utility area)
    //   UNDERGROUND-- strip across the bottom (below-grade systems)

    // Zone display names for tooltips
    const zoneNames = {
      pressbox: 'Press Box',
      luxury: 'Luxury Suites',
      concourse: 'Concourse',
      field: 'Field Overview',
      mechanical: 'Mechanical Room',
      underground: 'Underground',
    };

    // Count filters per zone and total slots per zone
    const filters = this._state.filters ?? [];
    const zoneFilterCounts = {};
    for (const f of filters) {
      const z = f.zone ?? 'mechanical';
      zoneFilterCounts[z] = (zoneFilterCounts[z] ?? 0) + 1;
    }
    const zoneSlotCounts = {};
    for (const zId of this._zoneManager.getZoneIds()) {
      const zDef = this._zoneManager.getZone(zId);
      zoneSlotCounts[zId] = zDef?.ventSlots?.length ?? 0;
    }

    const zones = [
      { id: 'pressbox',    label: 'PRESS BOX',   x: 42, y: 3,  w: 114, h: 15, color: '#ff77a8' },
      { id: 'luxury',      label: 'LUXURY',      x: 28, y: 20, w: 142, h: 16, color: '#ffec27' },
      { id: 'concourse',   label: 'CONCOURSE',   x: 12, y: 38, w: 176, h: 17, color: '#29adff' },
      { id: 'field',       label: 'FIELD',        x: 0,  y: 0,  w: 0,   h: 0,  color: '#00e436' }, // drawn as diamond
      { id: 'mechanical',  label: 'MECH',        x: 8,  y: 108, w: 54, h: 18, color: '#ffa300' },
      { id: 'underground', label: 'UNDERGROUND', x: 8,  y: 120, w: 182, h: 16, color: '#7e2553' },
    ];

    let html = `<div style="position:relative;width:100%;height:100%;font-size:9px;color:#888;">`;
    html += `<div style="position:absolute;top:2px;left:6px;font-size:7px;color:#555;letter-spacing:1px">STADIUM MAP</div>`;

    for (const z of zones) {
      if (z.id === 'field') continue; // drawn separately as diamond
      const isActive = z.id === active;
      const opacity = isActive ? 0.9 : 0.35;
      const border = isActive ? `2px solid ${z.color}` : '1px solid rgba(255,255,255,0.08)';
      const glow = isActive ? `0 0 6px ${z.color}` : 'none';
      const textColor = isActive ? '#fff' : '#777';
      const brightness = isActive ? 'brightness(1.4)' : 'brightness(0.7)';

      const warn = zoneWarnings[z.id];
      const warnIcon = warn
        ? `<span style="position:absolute;top:0;right:1px;font-size:7px;color:${warn === 'critical' ? '#ff004d' : '#ffec27'};line-height:1">\u26a0</span>`
        : '';

      const zFullName = zoneNames[z.id] ?? z.label;
      const zFilters = zoneFilterCounts[z.id] ?? 0;
      const zSlots = zoneSlotCounts[z.id] ?? 0;
      const zEmpty = zSlots - zFilters;
      const zTooltip = `${zFullName} \u2014 ${zFilters}/${zSlots} filters installed${zEmpty > 0 ? ` (${zEmpty} empty)` : ''}`;

      // Empty slot indicator: green dot if slots available
      const emptyIndicator = zEmpty > 0
        ? `<span style="position:absolute;top:-2px;left:1px;width:8px;height:8px;border-radius:50%;background:#00e436;border:1px solid #004d00;font-size:7px;line-height:8px;text-align:center;color:#000;font-weight:bold;" title="${zEmpty} empty slot${zEmpty !== 1 ? 's' : ''}">${zEmpty}</span>`
        : '';

      html += `
        <div data-zone="${z.id}" style="
          position:absolute; left:${z.x}px; top:${z.y}px;
          width:${z.w}px; height:${z.h}px;
          background: ${z.color}; opacity: ${opacity};
          border: ${border}; border-radius: 2px;
          display:flex; align-items:center; justify-content:center;
          font-size: 8px; color: ${textColor};
          letter-spacing: 0.5px;
          filter: ${brightness};
          box-shadow: ${glow};
          transition: opacity 0.2s, filter 0.2s;
        " title="${zTooltip}">${z.label}${warnIcon}${emptyIndicator}</div>
      `;
    }

    // Draw field as a rotated diamond in the center of the map
    const fieldActive = active === 'field';
    const fColor = '#00e436';
    const fOpacity = fieldActive ? 0.9 : 0.35;
    const fBorder = fieldActive ? `2px solid ${fColor}` : '1px solid rgba(255,255,255,0.08)';
    const fGlow = fieldActive ? `0 0 8px ${fColor}` : 'none';
    const fTextColor = fieldActive ? '#fff' : '#777';
    const fBrightness = fieldActive ? 'brightness(1.4)' : 'brightness(0.7)';

    // Diamond: a rotated square centered in the stadium
    const fieldWarn = zoneWarnings['field'];
    const fieldWarnIcon = fieldWarn
      ? `<span style="position:absolute;top:-2px;right:-2px;font-size:7px;color:${fieldWarn === 'critical' ? '#ff004d' : '#ffec27'};transform:rotate(-45deg);line-height:1">\u26a0</span>`
      : '';

    const fieldFilters = zoneFilterCounts['field'] ?? 0;
    const fieldSlots = zoneSlotCounts['field'] ?? 0;
    const fieldEmpty = fieldSlots - fieldFilters;
    const fieldTooltip = `Field Overview \u2014 ${fieldFilters}/${fieldSlots} filters installed${fieldEmpty > 0 ? ` (${fieldEmpty} empty)` : ''}`;

    const fieldEmptyIndicator = fieldEmpty > 0
      ? `<span style="position:absolute;top:-3px;left:-3px;width:6px;height:6px;border-radius:50%;background:#00e436;border:1px solid #004d00;font-size:5px;line-height:6px;text-align:center;color:#000;font-weight:bold;transform:rotate(-45deg);" title="${fieldEmpty} empty slot${fieldEmpty !== 1 ? 's' : ''}">${fieldEmpty}</span>`
      : '';

    html += `
      <div data-zone="field" style="
        position:absolute; left:64px; top:62px;
        width:40px; height:40px;
        background: ${fColor}; opacity: ${fOpacity};
        border: ${fBorder}; border-radius: 2px;
        transform: rotate(45deg);
        display:flex; align-items:center; justify-content:center;
        filter: ${fBrightness};
        box-shadow: ${fGlow};
        transition: opacity 0.2s, filter 0.2s;
      " title="${fieldTooltip}">
        <span style="transform:rotate(-45deg);font-size:8px;color:${fTextColor};letter-spacing:0.5px">FIELD</span>
        ${fieldWarnIcon}${fieldEmptyIndicator}
      </div>
    `;

    // Outfield arc: a subtle curved region around the diamond
    html += `
      <div style="
        position:absolute; left:22px; top:56px;
        width:126px; height:50px;
        border: 1px solid rgba(0,228,54,0.15);
        border-radius: 50% 50% 0 0;
        pointer-events:none;
      "></div>
    `;

    // Base lines from diamond corners
    html += `
      <div style="
        position:absolute; left:38px; top:82px; width:42px; height:1px;
        background:rgba(255,255,255,0.08); transform:rotate(-35deg); transform-origin:right center;
        pointer-events:none;
      "></div>
      <div style="
        position:absolute; left:88px; top:82px; width:42px; height:1px;
        background:rgba(255,255,255,0.08); transform:rotate(35deg); transform-origin:left center;
        pointer-events:none;
      "></div>
    `;

    html += '</div>';
    this._el.innerHTML = html;
  }

  _handleClick(e) {
    const zoneEl = e.target.closest('[data-zone]');
    if (zoneEl) {
      this._zoneManager.switchZone(zoneEl.dataset.zone);
    }
  }

  show() { this._el.style.display = 'block'; }
  hide() { this._el.style.display = 'none'; }
}
