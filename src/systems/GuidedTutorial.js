/**
 * GuidedTutorial — Structured first-game onboarding with guided objectives.
 *
 * Shows a persistent objective banner for the first 5 game days,
 * guiding the player through core mechanics one step at a time.
 * Highlights relevant HUD buttons with a pulsing glow.
 * Skips entirely for returning players (isFirstGame === false).
 */

const STEPS = [
  {
    id: 'install_filter',
    day: 1,
    title: 'Install Your First Filter',
    text: 'Open the Shop (S) and buy a filter, then click a vent slot to install it.',
    completionEvent: 'filter:added',
    highlightButton: 'shop',
  },
  {
    id: 'check_health',
    day: 2,
    title: 'Monitor Domain Health',
    text: 'Watch the domain health bars in the bottom HUD. Keep all 4 domains above 50%.',
    completionEvent: 'game:newDay',
    highlightButton: null,
  },
  {
    id: 'hire_staff',
    day: 3,
    title: 'Hire Your First Staff Member',
    text: 'Open the Crew panel (H) and hire a staff member to help maintain filters.',
    completionEvent: 'staff:hired',
    highlightButton: 'staff',
  },
  {
    id: 'repair_filter',
    day: 4,
    title: 'Repair a Filter',
    text: 'Click on a degraded filter and press Repair, or press E while hovering over one.',
    completionEvent: 'filter:repaired',
    highlightButton: null,
  },
  {
    id: 'accept_contract',
    day: 5,
    title: 'Accept a Contract',
    text: 'Open Contracts (C) and accept a sponsor deal for bonus income.',
    completionEvent: 'contract:accepted',
    highlightButton: 'contracts',
  },
];

// Map highlightButton keys to HUD panel dataset names
const BUTTON_PANEL_MAP = {
  shop: null,       // shop button is in top bar, handled separately
  staff: 'Staff',
  contracts: 'Contracts',
};

export class GuidedTutorial {
  constructor(container, state, eventBus) {
    this._container = container;
    this._state = state;
    this._eventBus = eventBus;
    this._currentStep = state.tutorialStep ?? 0;
    this._bannerEl = null;
    this._highlightedEl = null;

    // Re-sync on save/load
    this._eventBus.on('state:loaded', () => this._onStateLoaded());

    if (!state.isFirstGame) return;
    if (this._currentStep >= STEPS.length) return;

    this._init();
  }

  _init() {
    this._injectStyles();
    this._createBanner();
    this._showCurrentStep();
    this._bindEvents();
  }

  _onStateLoaded() {
    this._currentStep = this._state.tutorialStep ?? 0;
    this._clearHighlight();

    // Tutorial already completed in loaded save — remove banner if present
    if (!this._state.isFirstGame || this._currentStep >= STEPS.length) {
      if (this._bannerEl) {
        this._bannerEl.remove();
        this._bannerEl = null;
      }
      return;
    }

    // Tutorial should be active in loaded save but banner doesn't exist yet
    if (!this._bannerEl) {
      this._init();
    } else {
      this._showCurrentStep();
    }
  }

  _injectStyles() {
    if (document.getElementById('guided-tutorial-style')) return;
    const style = document.createElement('style');
    style.id = 'guided-tutorial-style';
    style.textContent = `
      @keyframes tutorial-pulse {
        0%, 100% { box-shadow: 0 0 4px rgba(255,236,39,0.3); }
        50% { box-shadow: 0 0 10px rgba(255,236,39,0.8), 0 0 4px rgba(255,163,0,0.5); }
      }
      .tutorial-highlight {
        animation: tutorial-pulse 1.2s ease-in-out infinite !important;
        border-color: #ffec27 !important;
      }
    `;
    document.head.appendChild(style);
  }

  _createBanner() {
    this._bannerEl = document.createElement('div');
    this._bannerEl.id = 'guided-tutorial-banner';
    this._bannerEl.style.cssText = `
      position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.85); border: 1px solid #8b4513; border-radius: 3px;
      padding: 6px 16px; font: 10px monospace; color: #d0d0e0; z-index: 45;
      text-align: center; pointer-events: auto;
      transition: opacity 0.3s ease;
    `;
    this._bannerEl.addEventListener('click', (e) => {
      if (e.target.closest('[data-tutorial-next]')) {
        this._advanceStep();
      }
      if (e.target.closest('[data-tutorial-skip]')) {
        this._completeTutorial();
      }
    });
    this._container.appendChild(this._bannerEl);
  }

  _showCurrentStep() {
    if (this._currentStep >= STEPS.length) {
      this._completeTutorial();
      return;
    }

    const step = STEPS[this._currentStep];
    this._bannerEl.style.opacity = '1';
    this._bannerEl.style.borderColor = '#8b4513';
    const isLast = this._currentStep >= STEPS.length - 1;
    this._bannerEl.innerHTML = `
      <div style="color:#ffec27;font-size:11px;margin-bottom:3px;letter-spacing:1px">${step.title}</div>
      <div style="color:#c0c0d0;font-size:9px;line-height:1.4">${step.text}</div>
      <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-top:5px">
        <span data-tutorial-skip style="
          cursor:pointer;font-size:8px;color:#666;padding:2px 6px;
        ">Skip tutorial</span>
        <span style="color:#444">|</span>
        <span style="color:#666;font-size:8px">Step ${this._currentStep + 1}/${STEPS.length}</span>
        <span data-tutorial-next style="
          cursor:pointer;font-size:9px;color:#ffec27;padding:2px 8px;
          border:1px solid #ffec2744;border-radius:2px;
          background:rgba(255,236,39,0.08);
        ">${isLast ? 'Finish' : 'Next \u25b6'}</span>
      </div>
    `;

    this._applyHighlight(step.highlightButton);
  }

  _applyHighlight(buttonKey) {
    this._clearHighlight();
    if (!buttonKey) return;

    // Find the button element in the HUD
    let el = null;
    if (buttonKey === 'shop') {
      el = this._container.querySelector('[data-shop]');
    } else {
      const panelName = BUTTON_PANEL_MAP[buttonKey];
      if (panelName) {
        el = this._container.querySelector(`[data-panel="${panelName}"]`);
      }
    }

    if (el) {
      el.classList.add('tutorial-highlight');
      this._highlightedEl = el;
    }
  }

  _clearHighlight() {
    if (this._highlightedEl) {
      this._highlightedEl.classList.remove('tutorial-highlight');
      this._highlightedEl = null;
    }
  }

  _bindEvents() {
    // Collect unique completion events
    const events = new Set(STEPS.map(s => s.completionEvent));
    for (const evt of events) {
      this._eventBus.on(evt, () => this._checkCompletion(evt));
    }
  }

  _advanceStep() {
    this._showCompletionFlash(() => {
      this._currentStep++;
      this._state.tutorialStep = this._currentStep;
      this._showCurrentStep();
    });
  }

  _checkCompletion(eventName) {
    if (!this._state.isFirstGame) return;
    if (this._currentStep >= STEPS.length) return;

    const step = STEPS[this._currentStep];
    if (step.completionEvent !== eventName) return;

    // Show brief completion flash
    this._showCompletionFlash(() => {
      this._currentStep++;
      this._state.tutorialStep = this._currentStep;
      this._showCurrentStep();
    });
  }

  _showCompletionFlash(onDone) {
    this._clearHighlight();
    this._bannerEl.style.borderColor = '#00e436';
    this._bannerEl.innerHTML = `
      <div style="color:#00e436;font-size:11px;letter-spacing:1px">Got it!</div>
    `;

    setTimeout(() => {
      this._bannerEl.style.borderColor = '#8b4513';
      onDone();
    }, 800);
  }

  _completeTutorial() {
    this._clearHighlight();
    this._state.isFirstGame = false;
    this._state.tutorialStep = STEPS.length;

    if (this._bannerEl) {
      this._bannerEl.style.borderColor = '#00e436';
      this._bannerEl.style.pointerEvents = 'none';
      this._bannerEl.innerHTML = `
        <div style="color:#00e436;font-size:11px;letter-spacing:1px">Tutorial complete! You're ready to manage the stadium.</div>
      `;

      setTimeout(() => {
        this._bannerEl.style.opacity = '0';
        setTimeout(() => {
          if (this._bannerEl) {
            this._bannerEl.remove();
            this._bannerEl = null;
          }
        }, 400);
      }, 3000);
    }
  }
}
