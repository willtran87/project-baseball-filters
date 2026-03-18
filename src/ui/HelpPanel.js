/**
 * HelpPanel -- Controls reference and quick gameplay guide.
 *
 * Registered with PanelManager as 'help'.
 * Accessible via ? key (Shift+/) or from pause menu.
 */

export class HelpPanel {
  constructor(panelManager, state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;
    this.panelManager = panelManager;

    panelManager.register('help', (el, state, eventBus) => {
      this._render(el);
    });

    this.eventBus.on('ui:toggleHelp', () => {
      if (panelManager.isOpen('help')) {
        this.eventBus.emit('ui:closePanel');
      } else {
        this.eventBus.emit('ui:openPanel', { name: 'help' });
      }
    });
  }

  _render(el) {
    const shortcuts = [
      ['Tab / Shift+Tab', 'Cycle zones'],
      ['` (backtick)', 'Return to field'],
      ['S', 'Shop'],
      ['H', 'Staff / Crew'],
      ['C', 'Contracts / Deals'],
      ['F', 'Finance report'],
      ['R', 'Research lab'],
      ['X', 'Stadium expansions'],
      ['G', 'Systems overview'],
      ['A', 'Filter analytics'],
      ['O', 'Objectives'],
      ['N', 'Newspaper'],
      ['J', 'Journal'],
      ['T', 'Stadium radio'],
      ['Y', 'Statistics'],
      ['E', 'Repair hovered filter'],
      ['M', 'Mute audio'],
      [', (comma)', 'Settings'],
      ['? (Shift+/)', 'This help screen'],
      ['Space', 'Pause / Resume'],
      ['Escape', 'Close panel / Pause menu'],
      ['1 / 2 / 3', 'Game speed (1x / 2x / 3x)'],
      ['Ctrl+S', 'Quick save'],
      ['Ctrl+L', 'Quick load'],
      ['B', 'Next broken filter'],
      ['Shift+B', 'Previous broken filter'],
      ['Shift+E', 'Bulk repair zone'],
    ];

    const shortcutRows = shortcuts.map(([key, desc]) =>
      `<div style="display:contents">
        <span style="color:#ffec27;text-align:right;padding-right:8px;white-space:nowrap">${key}</span>
        <span style="color:#c0c0d0">${desc}</span>
      </div>`
    ).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong style="font-size:12px;color:#ffec27;letter-spacing:1px">HELP &amp; CONTROLS</strong>
        <span data-action="close" style="cursor:pointer;color:#888;font-size:12px">\u2715</span>
      </div>

      <div style="display:flex;gap:24px;flex-wrap:wrap">
        <!-- Controls Section -->
        <div style="flex:1;min-width:220px">
          <div style="color:#8b4513;font-size:9px;letter-spacing:2px;margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:3px">KEYBOARD SHORTCUTS</div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 0;font-size:10px;line-height:1.6">
            ${shortcutRows}
          </div>
        </div>

        <!-- Quick Reference Section -->
        <div style="flex:1;min-width:200px">
          <div style="color:#8b4513;font-size:9px;letter-spacing:2px;margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:3px">QUICK REFERENCE</div>
          <div style="font-size:10px;color:#c0c0d0;line-height:1.8">
            <div style="margin-bottom:6px">
              <span style="color:#29adff;font-weight:bold">Filtration Domains</span><br>
              4 domains (Air, Water, HVAC, Drainage) each need healthy filters to maintain stadium quality.
            </div>
            <div style="margin-bottom:6px">
              <span style="color:#ffa300;font-weight:bold">Filters</span><br>
              Filters degrade over time during game days. Repair or replace them before they break down.
            </div>
            <div style="margin-bottom:6px">
              <span style="color:#00e436;font-weight:bold">Attendance &amp; Revenue</span><br>
              Higher reputation = more fans = more revenue, but also more filter stress.
            </div>
            <div style="margin-bottom:6px">
              <span style="color:#ff77a8;font-weight:bold">NPCs &amp; Relationships</span><br>
              Build NPC relationships through conversations for gameplay bonuses and story progression.
            </div>
            <div style="margin-bottom:6px">
              <span style="color:#ffec27;font-weight:bold">Goal</span><br>
              Reach 86+ reputation and host a championship game to take the Raptors to the big leagues.
            </div>
            <div style="margin-bottom:6px">
              <span style="color:#c8c8c8;font-weight:bold">Difficulty</span><br>
              Choose from Rookie, Veteran, All-Star, or Hall of Fame. Higher difficulty increases filter stress and reduces income.
            </div>
            <div style="margin-bottom:6px">
              <span style="color:#29adff;font-weight:bold">Mini-Game Streaks</span><br>
              Consecutive mini-game wins earn streak bonuses. Your best streak is tracked in Statistics.
            </div>
            <div style="margin-bottom:6px">
              <span style="color:#ffa300;font-weight:bold">Contract Chaining</span><br>
              Completing a sponsor contract on time can unlock follow-up deals with better rewards.
            </div>
            <div style="margin-bottom:6px">
              <span style="color:#ff77a8;font-weight:bold">Staff Specializations</span><br>
              Staff members gain specialization bonuses when assigned to domains matching their expertise.
            </div>
            <div>
              <span style="color:#00e436;font-weight:bold">Bulk Repair</span><br>
              Press Shift+E to repair all damaged filters in the current zone at once.
            </div>
          </div>
        </div>
      </div>
    `;

    // Close button
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close"]')) {
        this.eventBus.emit('ui:closePanel');
      }
    });

    // Focus for accessibility
    el.tabIndex = 0;
    el.focus();
  }
}
