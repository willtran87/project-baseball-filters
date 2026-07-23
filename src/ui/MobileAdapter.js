/**
 * MobileAdapter — Detects touch devices and layers responsive scaling,
 * touch input translation, larger UI targets, and a mobile toolbar
 * on top of the existing desktop game. Does nothing on desktop.
 */

export class MobileAdapter {
  constructor(canvas, uiOverlay, eventBus) {
    this.canvas = canvas;
    this.uiOverlay = uiOverlay;
    this.eventBus = eventBus;

    this.isMobile = this._detectMobile();
    this.displayScale = 2; // matches default PIXEL_SCALE

    if (!this.isMobile) return;

    this._container = canvas.parentElement; // #game-container
    this._injectMobileCSS();
    this._setupResponsiveScaling();
    this._setupTouchPrevention();
    this._setupLongPress();
    this._buildMobileToolbar();

    window.addEventListener('resize', () => this._rescale());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this._rescale(), 150);
    });
  }

  // ── Detection ──────────────────────────────────────────────────────

  _detectMobile() {
    if (window.matchMedia('(pointer: coarse)').matches) return true;
    if ('ontouchstart' in window && window.innerWidth <= 1024) return true;
    return false;
  }

  // ── Responsive Canvas Scaling ──────────────────────────────────────

  _setupResponsiveScaling() {
    this._rescale();
  }

  _rescale() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const toolbarH = 44;
    const availH = vh - toolbarH;

    const scaleX = vw / 480;
    const scaleY = availH / 320;
    const scale = Math.max(1.0, Math.min(scaleX, scaleY));

    this.displayScale = scale;

    const displayW = Math.floor(480 * scale);
    const displayH = Math.floor(320 * scale);

    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;
    this._container.style.width = `${displayW}px`;
    this._container.style.height = `${displayH}px`;

    this.eventBus.emit('mobile:scaleChanged', { scale });
  }

  /** Get current display scale for coordinate conversion. */
  getDisplayScale() {
    return this.displayScale;
  }

  // ── CSS Injection ──────────────────────────────────────────────────

  _injectMobileCSS() {
    const style = document.createElement('style');
    style.id = 'mobile-adapter-styles';
    style.textContent = `
      /* Hide desktop keyboard shortcut footer */
      #game-footer { display: none !important; }

      /* Hide game header on very short screens */
      @media (max-height: 480px) {
        #game-header { display: none !important; }
      }

      /* Larger HUD text */
      #hud, #hud-bottom {
        font-size: 11px !important;
        padding: 4px 8px !important;
      }

      /* Bigger panel buttons in bottom bar */
      #hud-bottom [data-panel] {
        font-size: 10px !important;
        padding: 5px 7px !important;
        min-height: 28px !important;
      }

      /* Speed / pause / shop buttons */
      #hud [data-speed],
      #hud [data-pause],
      #hud [data-shop] {
        font-size: 12px !important;
        padding: 4px 8px !important;
        min-height: 28px !important;
      }

      /* Close buttons */
      [data-action*="close"] {
        font-size: 16px !important;
        padding: 4px 8px !important;
        min-height: 32px !important;
        min-width: 32px !important;
      }

      /* General panel buttons */
      #ui-overlay button {
        min-height: 32px !important;
        font-size: 11px !important;
      }

      /* Tab buttons */
      [data-tab] {
        min-height: 28px !important;
        padding: 5px 10px !important;
        font-size: 10px !important;
      }

      /* Confirmation dialog buttons */
      [data-confirm] {
        min-height: 38px !important;
        font-size: 12px !important;
        padding: 8px 18px !important;
      }

      /* Tooltip sizing */
      #tooltip {
        font-size: 11px !important;
        max-width: 220px !important;
        padding: 6px 10px !important;
      }

      /* Momentum scrolling on panels */
      #ui-overlay > div {
        -webkit-overflow-scrolling: touch;
      }

      /* Prevent text selection on game UI */
      #ui-overlay {
        -webkit-user-select: none;
        user-select: none;
      }

      /* Horizontal scroll on very narrow screens */
      @media (max-width: 600px) {
        #hud-bottom {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        #hud {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Touch Prevention on Canvas ─────────────────────────────────────

  _setupTouchPrevention() {
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    this.canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
  }

  // ── Long-Press for Tooltips ────────────────────────────────────────

  _setupLongPress() {
    let pressTimer = null;
    let pressPos = null;
    let didLongPress = false;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      pressPos = { clientX: touch.clientX, clientY: touch.clientY };
      didLongPress = false;

      pressTimer = setTimeout(() => {
        didLongPress = true;
        this.eventBus.emit('input:longPress', {
          clientX: pressPos.clientX,
          clientY: pressPos.clientY,
        });
        pressTimer = null;
      }, 500);
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!pressTimer || !pressPos) return;
      const touch = e.touches[0];
      const dx = touch.clientX - pressPos.clientX;
      const dy = touch.clientY - pressPos.clientY;
      if (dx * dx + dy * dy > 100) { // 10px radius
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (didLongPress) {
        this.eventBus.emit('input:longPressEnd');
        didLongPress = false;
      }
    }, { passive: true });

    // Store didLongPress check for InputManager tap filtering
    this._didLongPress = () => didLongPress;
  }

  /** Returns true if the last touch interaction was a long-press (skip tap). */
  wasLongPress() {
    return this._didLongPress ? this._didLongPress() : false;
  }

  // ── Mobile Toolbar ─────────────────────────────────────────────────

  _buildMobileToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'mobile-toolbar';
    toolbar.style.cssText = `
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 40px;
      background: linear-gradient(0deg, #0d0d1a 0%, #1a1a2e 100%);
      border-top: 2px solid #1a2a4a;
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      z-index: 200;
      font-family: monospace;
      user-select: none;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    `;

    const buttons = [
      { icon: '\u2630', label: 'MENU',  action: 'menu' },
      { icon: '\u23EF', label: 'PAUSE', action: 'pause' },
      { icon: '\u21E5', label: 'ZONE',  action: 'zone' },
      { icon: '\u2716', label: 'CANCEL', action: 'cancel' },
    ];

    for (const def of buttons) {
      const btn = document.createElement('button');
      btn.style.cssText = `
        background: rgba(255,255,255,0.06);
        border: 1px solid #3a3a5a;
        border-radius: 4px;
        color: #c0c0d0;
        font-family: monospace;
        font-size: 10px;
        padding: 2px 14px;
        min-height: 34px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0px;
      `;
      btn.innerHTML = `<span style="font-size:15px;line-height:1">${def.icon}</span><span style="font-size:6px;letter-spacing:1px">${def.label}</span>`;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.eventBus.emit('ui:click');
        if (def.action === 'menu') {
          this.eventBus.emit('ui:toggleMenu');
        } else if (def.action === 'pause') {
          this.eventBus.emit('mobile:togglePause');
        } else if (def.action === 'zone') {
          this.eventBus.emit('mobile:nextZone');
        } else if (def.action === 'cancel') {
          this.eventBus.emit('mobile:cancel');
        }
      });

      toolbar.appendChild(btn);
    }

    document.body.appendChild(toolbar);
  }
}
