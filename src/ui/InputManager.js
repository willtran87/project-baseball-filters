/**
 * InputManager — Translates mouse/keyboard events into game actions.
 *
 * Handles canvas click -> grid coordinate mapping, hover detection for tooltips,
 * keyboard shortcuts, and routing input events through the EventBus.
 */

import { TILES } from '../rendering/TileMap.js';

const PIXEL_SCALE = 2;

export class InputManager {
  constructor(canvas, uiOverlay, state, eventBus, tileMap, tooltipManager, zoneManager, interactiveObjects, crowd, mobileAdapter) {
    this.canvas = canvas;
    this.uiOverlay = uiOverlay;
    this.state = state;
    this.eventBus = eventBus;
    this.tileMap = tileMap;
    this.tooltips = tooltipManager;
    this.zoneManager = zoneManager ?? null;
    this.interactiveObjects = interactiveObjects ?? null;
    this.crowd = crowd ?? null;
    this._mobile = mobileAdapter ?? null;
    this._displayScale = mobileAdapter?.isMobile ? mobileAdapter.getDisplayScale() : PIXEL_SCALE;

    this._placementMode = null; // { type: 'basic' } when placing a filter
    this._hoveredFilter = null;
    this._mousePos = { x: 0, y: 0 }; // canvas-local pixel coords

    // Filter navigator state (B key)
    this._filterNavIndex = -1;
    this._filterNavList = [];

    this._bindMouse();
    this._bindTouch();
    this._bindKeyboard();
    this._bindEventBus();
  }

  // -- Mouse -> Canvas Coordinate Conversion --

  _canvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scale = this._displayScale;
    return {
      x: Math.floor((e.clientX - rect.left) / scale),
      y: Math.floor((e.clientY - rect.top) / scale),
    };
  }

  _overlayCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  _gridCoords(canvasX, canvasY) {
    return this.tileMap.pixelToGrid(canvasX, canvasY);
  }

  // -- Filter Hit Detection --

  _filterAt(canvasX, canvasY) {
    const tileSize = this.tileMap.tileSize;
    const currentZone = this.state.currentZone ?? 'field';
    for (const filter of this.state.filters) {
      if (filter.zone && filter.zone !== currentZone) continue;
      if (!filter.zone && currentZone !== 'mechanical') continue;
      if (
        canvasX >= filter.x &&
        canvasX < filter.x + tileSize &&
        canvasY >= filter.y &&
        canvasY < filter.y + tileSize
      ) {
        return filter;
      }
    }
    return null;
  }

  _filterAtSlot(col, row) {
    const px = col * this.tileMap.tileSize;
    const py = row * this.tileMap.tileSize;
    const currentZone = this.state.currentZone ?? 'field';
    return this.state.filters.find(f => {
      if (f.zone && f.zone !== currentZone) return false;
      if (!f.zone && currentZone !== 'mechanical') return false;
      return f.x === px && f.y === py;
    }) ?? null;
  }

  // -- Placement Mode --

  enterPlacementMode(filterType, opts = {}) {
    this._placementMode = { type: filterType, ...opts };
    this.canvas.style.cursor = 'crosshair';
    const domainNames = { air: 'Air', water: 'Water', hvac: 'HVAC', drainage: 'Drainage' };
    const domainLabel = domainNames[opts.domain] ?? opts.domain ?? '';
    const domainColors = { air: 'gray', water: 'blue', hvac: 'orange', drainage: 'green' };
    const colorHint = domainColors[opts.domain] ?? '';
    const slotHint = colorHint ? ` Look for ${colorHint}-bordered slots.` : '';
    this.eventBus.emit('ui:message', {
      text: `Click a matching ${domainLabel} slot to install.${slotHint} ESC to cancel.`,
      type: 'info',
    });
  }

  exitPlacementMode() {
    this._placementMode = null;
    this.canvas.style.cursor = 'default';
  }

  get isPlacing() {
    return this._placementMode !== null;
  }

  // -- Mouse Handlers --

  _bindMouse() {
    this.canvas.addEventListener('mousemove', (e) => {
      const { x, y } = this._canvasCoords(e);
      this._mousePos = { x, y };
      this._handleHover(x, y, e);
    });

    this.canvas.addEventListener('click', (e) => {
      const { x, y } = this._canvasCoords(e);
      this._handleClick(x, y);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.tooltips.hide();
      this._hoveredFilter = null;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this._placementMode) {
        this.exitPlacementMode();
      }
    });
  }

  // -- Touch Handlers (mobile only) --

  _bindTouch() {
    if (!this._mobile?.isMobile) return;

    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length !== 1) return;
      // Skip tap if it was a long-press (tooltip shown instead)
      if (this._mobile.wasLongPress()) return;
      const touch = e.changedTouches[0];
      const { x, y } = this._touchToCanvas(touch);
      this._handleClick(x, y);
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return;
      const { x, y } = this._touchToCanvas(e.touches[0]);
      this._mousePos = { x, y };
    }, { passive: true });

    // Long-press tooltip support
    this.eventBus.on('input:longPress', ({ clientX, clientY }) => {
      const rect = this.canvas.getBoundingClientRect();
      const scale = this._displayScale;
      const x = Math.floor((clientX - rect.left) / scale);
      const y = Math.floor((clientY - rect.top) / scale);
      this._handleHover(x, y, { clientX, clientY });
    });

    this.eventBus.on('input:longPressEnd', () => {
      this.tooltips.hide();
      this._hoveredFilter = null;
    });

    // Update display scale on resize
    this.eventBus.on('mobile:scaleChanged', ({ scale }) => {
      this._displayScale = scale;
    });
  }

  _touchToCanvas(touch) {
    const rect = this.canvas.getBoundingClientRect();
    const scale = this._displayScale;
    return {
      x: Math.floor((touch.clientX - rect.left) / scale),
      y: Math.floor((touch.clientY - rect.top) / scale),
    };
  }

  _handleClick(x, y) {
    // Block input during zone transition crossfade
    if (this.zoneManager && this.zoneManager.isTransitioning) return;

    this.eventBus.emit('ui:click');

    // Placement mode: place filter on valid slot with matching domain
    if (this._placementMode) {
      const { col, row } = this._gridCoords(x, y);
      const tileId = this.tileMap.getTile(col, row);
      const slot = this.tileMap.getVentSlotAt(col, row);
      const pm = this._placementMode;

      if (tileId !== TILES.VENT_SLOT || !slot) {
        this.eventBus.emit('ui:message', { text: 'Can only place filters on vent slots.', type: 'warning' });
      } else if (this._filterAtSlot(col, row)) {
        this.eventBus.emit('ui:message', { text: 'This slot already has a filter installed.', type: 'warning' });
      } else if (slot.domain && pm.domain && slot.domain !== pm.domain) {
        const domainNames = { air: 'Air', water: 'Water', hvac: 'HVAC', drainage: 'Drainage' };
        const slotName = domainNames[slot.domain] ?? slot.domain;
        const filterName = domainNames[pm.domain] ?? pm.domain;
        this.eventBus.emit('ui:message', {
          text: `This is a ${slotName} slot — cannot install ${filterName} equipment here.`,
          type: 'warning',
        });
      } else {
        const pos = this.tileMap.gridToPixel(col, row);
        this.eventBus.emit('filter:install', {
          type: pm.type,
          domain: pm.domain,
          componentType: pm.componentType,
          tier: pm.tier,
          x: pos.x,
          y: pos.y,
        });
        this.exitPlacementMode();
      }
      return;
    }

    // Check if clicking on an existing filter -> inspect it
    const filter = this._filterAt(x, y);
    if (filter) {
      this.eventBus.emit('ui:openPanel', {
        name: 'filterInspector',
        data: { filterId: filter.id },
      });
      return;
    }

    // Check if clicking on an empty vent slot -> open install panel
    const { col, row } = this._gridCoords(x, y);
    const tileId = this.tileMap.getTile(col, row);
    if (tileId === TILES.VENT_SLOT && !this._filterAtSlot(col, row)) {
      const slotInfo = this.tileMap.getVentSlotAt(col, row);
      this.eventBus.emit('ui:openPanel', {
        name: 'ventSlot',
        data: { col, row, domain: slotInfo?.domain ?? null },
      });
      return;
    }

    // Check if clicking on a walking NPC → start casual chat
    if (!this._placementMode && this.crowd) {
      const npcId = this.crowd.getNpcAtPixel(x, y);
      if (npcId) {
        this.eventBus.emit('npc:startChat', { npcId });
        return;
      }
    }

    // Check for interactive environment objects
    const interactiveObj = this.interactiveObjects?.getObjectAt(col, row, this.state.currentZone ?? 'field');
    if (interactiveObj) {
      const feedback = this.interactiveObjects.interact(interactiveObj);
      if (feedback) {
        this.eventBus.emit('ui:message', { text: `${interactiveObj.icon ?? '\u{1f50d}'} ${feedback}`, type: 'info' });
      }
      return;
    }

    // Field overview: click regions to navigate into zones
    if (this.state.currentZone === 'field' && this.zoneManager) {
      if (row >= 4 && row <= 5) { this.zoneManager.switchZone('concourse'); return; }
      if (row === 6 && col >= 3 && col <= 7) { this.zoneManager.switchZone('luxury'); return; }
      if (row === 6 && col >= 8 && col <= 10) { this.zoneManager.switchZone('pressbox'); return; }
      if (row === 7) { this.zoneManager.switchZone('concourse'); return; }
      if (row >= 8 && row <= 9) { this.zoneManager.switchZone('mechanical'); return; }
      if (row >= 13 && row <= 17) { this.zoneManager.switchZone('underground'); return; }
    }

    // Click on empty space closes panels
    this.eventBus.emit('ui:closePanel');
  }

  _handleHover(x, y, e) {
    const { x: overlayX, y: overlayY } = this._overlayCoords(e);

    const filter = this._filterAt(x, y);

    if (filter) {
      if (this._hoveredFilter !== filter.id) {
        this._hoveredFilter = filter.id;
      }
      this.tooltips.showForFilter(overlayX, overlayY, filter);
      this.canvas.style.cursor = this._placementMode ? 'crosshair' : 'pointer';
      return;
    }

    if (this._hoveredFilter) {
      this._hoveredFilter = null;
      this.tooltips.hide();
    }

    // Show interactive object tooltip
    const { col, row } = this._gridCoords(x, y);
    const tileId = this.tileMap.getTile(col, row);
    const ventSlot = tileId === TILES.VENT_SLOT ? this.tileMap.getVentSlotAt(col, row) : null;

    // Entity hover: show tooltip for any hovered entity (NPCs, fans, players, etc.)
    if (!this._placementMode && this.crowd) {
      const entity = this.crowd.getEntityAtPixel(x, y);
      if (entity) {
        if (entity.type === 'npc') {
          // Existing NPC tooltip + pointer cursor (clickable for chat)
          this.tooltips.showForNpc(overlayX, overlayY, entity.npcId);
          this.canvas.style.cursor = 'pointer';
        } else if (entity.identity) {
          // Identity tooltip for non-NPC crowd entities
          this.tooltips.showForEntity(overlayX, overlayY, entity);
          this.canvas.style.cursor = 'default';
        }
        return;
      }
    }

    // Interactive objects get pointer cursor and name tooltip (skip in placement mode)
    if (!this._placementMode && tileId !== TILES.VENT_SLOT) {
      const hoverObj = this.interactiveObjects?.getObjectAt(col, row, this.state.currentZone ?? 'field');
      if (hoverObj) {
        this.tooltips.showForObject(overlayX, overlayY, hoverObj);
        this.canvas.style.cursor = 'pointer';
        return;
      }
    }

    if (tileId === TILES.VENT_SLOT && !this._filterAtSlot(col, row)) {
      // In placement mode: check domain compatibility for cursor
      if (this._placementMode && ventSlot?.domain && this._placementMode.domain) {
        this.canvas.style.cursor = ventSlot.domain === this._placementMode.domain ? 'crosshair' : 'not-allowed';
      } else {
        this.canvas.style.cursor = this._placementMode ? 'crosshair' : 'pointer';
      }
    } else if (this._placementMode) {
      this.canvas.style.cursor = 'not-allowed';
    } else {
      this.canvas.style.cursor = 'default';
    }

    this.tooltips.showForTile(overlayX, overlayY, tileId, ventSlot, this._placementMode ?? null);
  }

  // -- Keyboard Handlers --

  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'Escape':
          if (this._placementMode) {
            this.exitPlacementMode();
          } else if (this.state.paused) {
            this.eventBus.emit('ui:hideMenu');
            this.eventBus.emit('game:resume');
          } else {
            // Close any open panels first; only toggle pause if nothing was open
            const result = { closed: false };
            this.eventBus.emit('ui:closeAllPanels', result);
            if (!result.closed) {
              this.eventBus.emit('game:pause');
              this.eventBus.emit('ui:showMenu', { menu: 'pause' });
            }
          }
          break;
        case ' ':
          e.preventDefault();
          if (this.state.paused) {
            this.eventBus.emit('ui:hideMenu');
            this.eventBus.emit('game:resume');
          } else {
            this.eventBus.emit('game:pause');
          }
          break;
        case '1':
          this.eventBus.emit('game:setSpeed', { speed: 1 });
          break;
        case '2':
          this.eventBus.emit('game:setSpeed', { speed: 2 });
          break;
        case '3':
          this.eventBus.emit('game:setSpeed', { speed: 3 });
          break;
        case 's':
          if (e.ctrlKey) {
            e.preventDefault();
            this.eventBus.emit('game:quickSave');
            this.eventBus.emit('ui:message', { text: 'Game saved!', type: 'success' });
          } else {
            this.eventBus.emit('ui:toggleShop');
          }
          break;
        case 'l':
          if (e.ctrlKey) {
            e.preventDefault();
            this.eventBus.emit('game:quickLoadRequest');
          }
          break;
        case 'm':
          this.eventBus.emit('audio:toggleMute');
          break;
        case 'j':
          this.eventBus.emit('ui:toggleJournal');
          break;
        case 'n':
          this.eventBus.emit('ui:toggleNewspaper');
          break;
        case 'f':
          this.eventBus.emit('ui:toggleEconomy');
          break;
        case 'h':
          this.eventBus.emit('ui:toggleStaff');
          break;
        case 'c':
          this.eventBus.emit('ui:toggleContracts');
          break;
        case 'g':
          this.eventBus.emit('ui:toggleSystems');
          break;
        case 'G':
          if (e.shiftKey) {
            e.preventDefault();
            this.eventBus.emit('ui:toggleGiftShop');
          }
          break;
        case 'o':
          this.eventBus.emit('ui:toggleObjectives');
          break;
        case 't':
          this.eventBus.emit('ui:toggleTalk');
          break;
        case 'r':
          this.eventBus.emit('ui:toggleResearch');
          break;
        case 'x':
          this.eventBus.emit('ui:toggleExpansions');
          break;
        case 'y':
          this.eventBus.emit('ui:toggleStats');
          break;
        case 'a':
          this.eventBus.emit('ui:toggleFilterAnalytics');
          break;
        case 'E':
          if (e.shiftKey) {
            e.preventDefault();
            this.eventBus.emit('filter:bulkRepair');
          }
          break;
        case 'e': {
          if (e.shiftKey) break; // handled by 'E' case
          if (!this._hoveredFilter) break;
          const filter = this.state.filters.find(f => f.id === this._hoveredFilter);
          if (filter && filter.condition < filter.maxCondition) {
            this.eventBus.emit('filter:repair', { id: filter.id });
          }
          break;
        }
        case 'b':
        case 'B': {
          e.preventDefault();
          this._navigateToNextFilter(e.shiftKey);
          break;
        }
        case 'Tab':
          e.preventDefault();
          if (this.zoneManager) {
            if (e.shiftKey) {
              this.zoneManager.prevZone();
            } else {
              this.zoneManager.nextZone();
            }
          }
          break;
        case '`':
          if (this.zoneManager) {
            this.zoneManager.switchZone('field');
          }
          break;
        case ',':
          this.eventBus.emit('ui:toggleSettings');
          break;
        case '?':
          this.eventBus.emit('ui:toggleHelp');
          break;
      }
    });
  }

  // -- Filter Navigator (B key) --

  /**
   * Build a sorted list of degraded/broken filters across all zones.
   */
  _buildDegradedFilterList() {
    this._filterNavList = this.state.filters.filter(f => {
      if (f.condition <= 0) return true;
      const ratio = f.maxCondition > 0 ? f.condition / f.maxCondition : 0;
      return ratio < 0.5;
    });
    // Sort: broken first, then by condition ratio ascending
    this._filterNavList.sort((a, b) => {
      const ra = a.maxCondition > 0 ? a.condition / a.maxCondition : 0;
      const rb = b.maxCondition > 0 ? b.condition / b.maxCondition : 0;
      return ra - rb;
    });
  }

  /**
   * Navigate to the next (or previous) degraded filter.
   */
  _navigateToNextFilter(reverse) {
    this._buildDegradedFilterList();

    if (this._filterNavList.length === 0) {
      this.eventBus.emit('ui:message', { text: 'All filters healthy!', type: 'success' });
      this._filterNavIndex = -1;
      return;
    }

    if (reverse) {
      this._filterNavIndex--;
      if (this._filterNavIndex < 0) this._filterNavIndex = this._filterNavList.length - 1;
    } else {
      this._filterNavIndex++;
      if (this._filterNavIndex >= this._filterNavList.length) this._filterNavIndex = 0;
    }

    const filter = this._filterNavList[this._filterNavIndex];
    const filterZone = filter.zone ?? 'mechanical';
    const currentZone = this.state.currentZone ?? 'field';

    // Navigate to the filter's zone if needed
    if (filterZone !== currentZone && this.zoneManager) {
      this.zoneManager.switchZone(filterZone);
    }

    // Emit highlight event for the renderer to flash the filter
    this.eventBus.emit('filter:highlight', { filterId: filter.id });

    const ratio = filter.maxCondition > 0 ? Math.round((filter.condition / filter.maxCondition) * 100) : 0;
    const status = filter.condition <= 0 ? 'BROKEN' : `${ratio}%`;
    const pos = `${this._filterNavIndex + 1}/${this._filterNavList.length}`;
    this.eventBus.emit('ui:message', {
      text: `[${pos}] ${filter.domain} filter at ${filterZone} -- ${status}`,
      type: filter.condition <= 0 ? 'danger' : 'warning',
    });
  }

  // -- EventBus Bindings --

  _bindEventBus() {
    this.eventBus.on('ui:startPlacement', ({ filterType, domain, componentType, tier }) => {
      this.enterPlacementMode(filterType, { domain, componentType, tier });
    });

    this.eventBus.on('zone:changed', () => {
      if (this._placementMode) this.exitPlacementMode();
      this._hoveredFilter = null;
    });
  }

  /**
   * Get the current placement ghost position (for rendering a preview).
   */
  getPlacementGhost() {
    if (!this._placementMode) return null;
    const { col, row } = this._gridCoords(this._mousePos.x, this._mousePos.y);
    const pos = this.tileMap.gridToPixel(col, row);
    const tileId = this.tileMap.getTile(col, row);
    const slot = this.tileMap.getVentSlotAt(col, row);
    const pm = this._placementMode;

    const isSlot = tileId === TILES.VENT_SLOT && slot;
    const isEmpty = isSlot && !this._filterAtSlot(col, row);
    const domainMatch = !slot?.domain || !pm.domain || slot.domain === pm.domain;

    return {
      type: pm.type,
      x: pos.x,
      y: pos.y,
      valid: isEmpty && domainMatch,
    };
  }
}
