/**
 * NewspaperPanel -- "Ridgemont Herald" newspaper-styled panel.
 *
 * Shows the most recent headline prominently, then a scrollable
 * list of past headlines with dates. Registered with PanelManager,
 * accessible via a HUD button.
 */

export class NewspaperPanel {
  constructor(panelManager, state, eventBus) {
    this.state = state;
    this.eventBus = eventBus;

    // Register with PanelManager
    panelManager.register('newspaper', (el, state, eventBus, data) => {
      this._render(el, state, eventBus);
    });

    this.eventBus.on('ui:toggleNewspaper', () => {
      if (panelManager.isOpen('newspaper')) {
        this.eventBus.emit('ui:closePanel');
      } else {
        this.eventBus.emit('ui:openPanel', { name: 'newspaper' });
      }
    });
  }

  _render(el, state, eventBus) {
    const headlines = state.mediaHeadlines ?? [];
    const latest = headlines[0] ?? null;
    const past = headlines.slice(1);

    const sentimentColor = (s) => {
      if (s === 'positive') return '#00e436';
      if (s === 'negative') return '#ff004d';
      return '#c8c8c8';
    };

    const sentimentIcon = (s) => {
      if (s === 'positive') return '+';
      if (s === 'negative') return '-';
      return '~';
    };

    el.style.cssText = `
      position: absolute; top: 24px; left: 12%; right: 12%; bottom: 24px;
      background: rgba(245, 235, 215, 0.97);
      border: 3px double #4a3a2a;
      border-radius: 2px;
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #2a2a1a;
      font-size: 12px;
      z-index: 30;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // -- Masthead
    let html = `
      <div style="
        text-align: center; padding: 10px 12px 6px;
        border-bottom: 3px double #4a3a2a;
        background: rgba(255, 248, 230, 0.5);
      ">
        <div style="font-size: 8px; letter-spacing: 4px; color: #888; text-transform: uppercase; margin-bottom: 2px">
          Est. 1947
        </div>
        <div style="
          font-size: 22px; font-weight: bold; letter-spacing: 3px;
          font-family: 'Georgia', serif; color: #1a1a0a;
          text-transform: uppercase;
        ">
          THE RIDGEMONT HERALD
        </div>
        <div style="
          display: flex; justify-content: space-between; align-items: center;
          font-size: 9px; color: #666; margin-top: 4px;
          border-top: 1px solid #bba;
          padding-top: 3px;
        ">
          <span>Day ${state.gameDay} | Season ${state.season ?? 1}</span>
          <span>"All the News That's Fit for the Diamond"</span>
          <span data-action="close-newspaper" style="
            cursor: pointer; color: #888; font-family: monospace;
            font-size: 12px;
          ">\u2715</span>
        </div>
      </div>
    `;

    // -- Lead story
    if (latest) {
      html += `
        <div style="
          padding: 12px 16px; border-bottom: 1px solid #cba;
          background: rgba(255, 252, 240, 0.3);
        ">
          <div style="
            font-size: 16px; font-weight: bold; line-height: 1.3;
            color: #1a1a0a; margin-bottom: 6px;
          ">
            ${this._escapeHtml(latest.text)}
          </div>
          <div style="
            display: flex; justify-content: space-between;
            font-size: 9px; color: #777;
          ">
            <span>Day ${latest.day}</span>
            <span style="color: ${sentimentColor(latest.sentiment)}; font-family: monospace;">
              [${sentimentIcon(latest.sentiment)}${latest.repEffect ?? 0} rep]
            </span>
          </div>
        </div>
      `;
    } else {
      html += `
        <div style="padding: 16px; text-align: center; color: #999; font-style: italic;">
          No headlines yet. Check back after game day.
        </div>
      `;
    }

    // -- Past headlines (scrollable)
    html += `<div style="flex: 1; overflow-y: auto; padding: 8px 16px;">`;

    if (past.length > 0) {
      html += `
        <div style="
          font-size: 9px; text-transform: uppercase; letter-spacing: 2px;
          color: #999; margin-bottom: 6px; border-bottom: 1px solid #ddc;
          padding-bottom: 3px;
        ">
          Previous Headlines
        </div>
      `;

      for (const h of past) {
        html += `
          <div style="
            padding: 4px 0; border-bottom: 1px dotted #ddc;
            display: flex; align-items: baseline; gap: 8px;
          ">
            <span style="
              color: #aaa; font-size: 9px; font-family: monospace;
              min-width: 36px;
            ">D${h.day}</span>
            <span style="flex: 1; font-size: 11px; color: #3a3a2a;">
              ${this._escapeHtml(h.text)}
            </span>
            <span style="
              color: ${sentimentColor(h.sentiment)};
              font-family: monospace; font-size: 9px;
              min-width: 30px; text-align: right;
            ">
              ${sentimentIcon(h.sentiment)}${h.repEffect ?? 0}
            </span>
          </div>
        `;
      }
    }

    html += `</div>`;

    el.innerHTML = html;

    // Event handlers
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="close-newspaper"]')) {
        eventBus.emit('ui:closePanel');
      }
    });
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
