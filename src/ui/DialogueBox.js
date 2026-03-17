/**
 * DialogueBox — Bottom-screen dialogue panel for NPC conversations.
 *
 * Renders NPC portrait, name, typewriter text, and choice buttons.
 * Subscribes to story:dialogue events and emits story:choiceMade / story:dialogueComplete.
 * Pauses game when active.
 */

export class DialogueBox {
  constructor(container, state, eventBus, sprites) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this.sprites = sprites;

    this._el = null;
    this._active = false;
    this._queue = [];       // queued dialogue lines
    this._current = null;   // current line being displayed
    this._typewriterTimer = null;
    this._charIndex = 0;
    this._fullText = '';
    this._typewriterDone = false;
    this._typewriterSpeed = 30; // ms per character

    // Portrait canvas for rendering pixel-art portraits
    this._portraitCanvas = null;

    // Bind events
    this.eventBus.on('story:dialogue', (data) => this._onDialogue(data));

    // Keyboard advance
    this._onKeyDown = (e) => {
      if (!this._active) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._advance();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);
  }

  // ── Event Handlers ──────────────────────────────

  _onDialogue(data) {
    // data: { npcId, npcName, themeColor, portrait, lines, choices }
    // lines: array of { text, isNarrator? }
    // choices: optional array of { id, text }
    const lines = data.lines ?? [{ text: data.text ?? '' }];
    const isNarrator = data.isNarrator || data.npcId === 'narrator';

    this._queue = lines.map(line => ({
      npcId: data.npcId,
      npcName: data.npcName ?? '',
      themeColor: data.themeColor ?? '#888888',
      portrait: (typeof line === 'object' ? line.portrait : null) ?? data.portrait ?? null,
      text: typeof line === 'string' ? line : line.text,
      isNarrator: isNarrator || line.isNarrator,
    }));

    // Choices apply to the last line
    this._choices = data.choices ?? null;

    if (!this._active) {
      this._active = true;
      this.eventBus.emit('game:pause');
      this._createOverlay();
    }

    this._showNext();
  }

  // ── Overlay Lifecycle ───────────────────────────

  _createOverlay() {
    this._el = document.createElement('div');
    this._el.id = 'dialogue-box';
    this._el.style.cssText = `
      position: absolute; bottom: 0; left: 0; right: 0;
      min-height: 110px; max-height: 170px;
      background: rgba(10, 10, 30, 0.92);
      border-top: 2px solid #8b4513;
      font-family: monospace; color: #e0e0e0;
      font-size: 11px; z-index: 40;
      display: flex; flex-direction: row;
      padding: 8px 12px; gap: 10px;
      cursor: pointer;
      user-select: none;
    `;

    this._el.addEventListener('click', (e) => {
      // If clicking a choice button, let that handler fire
      if (e.target.closest('[data-choice-id]')) return;
      this._advance();
    });

    this.container.appendChild(this._el);
  }

  _destroyOverlay() {
    this._stopTypewriter();
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
    this._active = false;
    this._current = null;
    this._queue = [];
    this._choices = null;
    this.eventBus.emit('game:resume');
    this.eventBus.emit('story:dialogueComplete');
  }

  // ── Text Display ────────────────────────────────

  _showNext() {
    if (this._queue.length === 0) {
      this._destroyOverlay();
      return;
    }

    this._current = this._queue.shift();
    this._renderLine();
  }

  _renderLine() {
    if (!this._el || !this._current) return;
    const line = this._current;

    this._el.innerHTML = '';

    // Left border color
    if (!line.isNarrator) {
      this._el.style.borderLeft = `4px solid ${line.themeColor}`;
    } else {
      this._el.style.borderLeft = 'none';
    }

    // Portrait area (non-narrator only)
    if (!line.isNarrator && line.portrait) {
      const portraitWrap = document.createElement('div');
      portraitWrap.style.cssText = `
        flex-shrink: 0; width: 128px; height: 128px;
        image-rendering: pixelated;
        display: flex; align-items: center; justify-content: center;
      `;

      this._portraitCanvas = document.createElement('canvas');
      this._portraitCanvas.width = 64;
      this._portraitCanvas.height = 64;
      this._portraitCanvas.style.cssText = 'width:128px;height:128px;image-rendering:pixelated;';
      this._drawPortrait(line.portrait);
      portraitWrap.appendChild(this._portraitCanvas);
      this._el.appendChild(portraitWrap);
    }

    // Text area
    const textArea = document.createElement('div');
    textArea.style.cssText = `
      flex: 1; display: flex; flex-direction: column;
      justify-content: center; min-width: 0;
    `;

    // Name label (non-narrator)
    if (!line.isNarrator && line.npcName) {
      const nameLabel = document.createElement('div');
      nameLabel.style.cssText = `
        font-size: 12px; font-weight: bold;
        color: ${line.themeColor}; margin-bottom: 4px;
      `;
      nameLabel.textContent = line.npcName;
      textArea.appendChild(nameLabel);
    }

    // Dialogue text element
    const textEl = document.createElement('div');
    textEl.style.cssText = `
      font-size: 11px; line-height: 1.4;
      color: #e0e0e0;
      ${line.isNarrator ? 'text-align: center; font-style: italic; color: #c0c0d0;' : ''}
    `;
    textEl.id = 'dialogue-text';
    textArea.appendChild(textEl);

    // Choice container (will be populated after text finishes for last line)
    const choiceContainer = document.createElement('div');
    choiceContainer.id = 'dialogue-choices';
    choiceContainer.style.cssText = `
      display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;
    `;
    textArea.appendChild(choiceContainer);

    this._el.appendChild(textArea);

    // Advance hint
    const hint = document.createElement('div');
    hint.style.cssText = `
      position: absolute; bottom: 4px; right: 10px;
      font-size: 9px; color: #5f574f;
    `;
    hint.textContent = 'Click / Space';
    this._el.appendChild(hint);

    // Start typewriter
    this._startTypewriter(line.text, textEl, choiceContainer);
  }

  _startTypewriter(text, textEl, choiceContainer) {
    this._stopTypewriter();
    this._fullText = text;
    this._charIndex = 0;
    this._typewriterDone = false;
    this._textEl = textEl;
    this._choiceContainer = choiceContainer;

    this._typewriterTimer = setInterval(() => {
      this._charIndex++;
      textEl.textContent = this._fullText.slice(0, this._charIndex);
      if (this._charIndex >= this._fullText.length) {
        this._finishTypewriter();
      }
    }, this._typewriterSpeed);
  }

  _finishTypewriter() {
    this._stopTypewriter();
    this._typewriterDone = true;
    if (this._textEl) {
      this._textEl.textContent = this._fullText;
    }

    // Show choices if this is the last line and choices exist
    if (this._queue.length === 0 && this._choices && this._choices.length > 0) {
      this._renderChoices();
    }
  }

  _stopTypewriter() {
    if (this._typewriterTimer) {
      clearInterval(this._typewriterTimer);
      this._typewriterTimer = null;
    }
  }

  // ── Choices ─────────────────────────────────────

  _renderChoices() {
    const container = this._choiceContainer;
    if (!container || !this._choices) return;

    container.innerHTML = '';
    for (const choice of this._choices) {
      const btn = document.createElement('button');
      btn.dataset.choiceId = choice.id;
      btn.style.cssText = `
        background: rgba(41, 173, 255, 0.1);
        color: #29adff; border: 1px solid #3a5a8a;
        padding: 4px 12px; font-family: monospace;
        font-size: 10px; cursor: pointer;
        transition: background 0.15s;
      `;

      // Choice text
      const textSpan = document.createElement('span');
      textSpan.textContent = choice.text;
      btn.appendChild(textSpan);

      // Effect preview spans (small colored hints below choice text)
      if (choice.effects && Array.isArray(choice.effects)) {
        const previews = this._buildEffectPreviews(choice.effects);
        if (previews.length > 0) {
          const previewWrap = document.createElement('div');
          previewWrap.style.cssText = 'margin-top:2px;';
          for (const pv of previews) {
            const pvSpan = document.createElement('span');
            pvSpan.style.cssText = `
              font-size: 8px; margin-right: 4px;
              color: ${pv.color};
            `;
            pvSpan.textContent = pv.label;
            previewWrap.appendChild(pvSpan);
          }
          btn.appendChild(previewWrap);
        }
      }

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(41, 173, 255, 0.25)';
        btn.style.color = '#fff';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(41, 173, 255, 0.1)';
        btn.style.color = '#29adff';
      });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.eventBus.emit('story:choiceMade', { choiceId: choice.id, effects: choice.effects });
        this._destroyOverlay();
      });
      container.appendChild(btn);
    }
  }

  /**
   * Build effect preview labels from a choice's effects array.
   * Returns array of { label, color } for display.
   */
  _buildEffectPreviews(effects) {
    const previews = [];
    for (const effect of effects) {
      // Skip flag effects (no numeric delta to preview)
      if (effect.type === 'flag') continue;

      const delta = effect.delta ?? effect.value ?? 0;
      if (delta === 0) continue;

      const sign = delta > 0 ? '+' : '';
      const isPositive = delta > 0;
      const color = isPositive ? '#00e436' : '#ff004d';

      switch (effect.type) {
        case 'relationship': {
          // Show NPC first name from npc id (capitalize first letter)
          const name = effect.npc ? effect.npc.charAt(0).toUpperCase() + effect.npc.slice(1) : '?';
          previews.push({ label: `${sign}${delta} ${name}`, color });
          break;
        }
        case 'reputation':
          previews.push({ label: `${sign}${delta} Rep`, color });
          break;
        case 'money':
          previews.push({ label: `${sign}$${Math.abs(delta)}`, color });
          break;
        default:
          break;
      }
    }
    return previews;
  }

  // ── Advance / Skip ──────────────────────────────

  _advance() {
    if (!this._active) return;

    // If typewriter is mid-animation, skip to end
    if (!this._typewriterDone) {
      this._finishTypewriter();
      return;
    }

    // If choices are showing, don't auto-advance
    if (this._queue.length === 0 && this._choices && this._choices.length > 0) {
      return;
    }

    // Show next line or close
    this._showNext();
  }

  // ── Portrait Rendering ──────────────────────────

  _drawPortrait(portraitName) {
    if (!this._portraitCanvas) return;
    const ctx = this._portraitCanvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    // Try to get pixel sprite data from SpriteSystem
    const pixelData = this.sprites?.getPixelSprite(portraitName);
    if (pixelData && Array.isArray(pixelData)) {
      for (let y = 0; y < pixelData.length; y++) {
        const row = pixelData[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          const color = row[x];
          if (color && color !== '' && color !== null) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      return;
    }

    // Fallback: draw a placeholder silhouette
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#555';
    ctx.fillRect(22, 8, 20, 20);
    ctx.fillRect(16, 32, 32, 28);
  }

  // ── Cleanup ─────────────────────────────────────

  destroy() {
    this._destroyOverlay();
    document.removeEventListener('keydown', this._onKeyDown);
  }
}
