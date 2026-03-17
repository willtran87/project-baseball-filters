/**
 * CutsceneRenderer — Full-screen overlay for story cutscenes.
 *
 * Displays chapter titles, slide-based text with typewriter effect,
 * and optional pixel-art illustrations. Pauses game when active.
 * Subscribes to story:cutscene events, emits story:cutsceneComplete.
 */

export class CutsceneRenderer {
  constructor(container, state, eventBus, sprites) {
    this.container = container;
    this.state = state;
    this.eventBus = eventBus;
    this.sprites = sprites;

    this._el = null;
    this._active = false;
    this._slides = [];
    this._slideIndex = 0;
    this._typewriterTimer = null;
    this._charIndex = 0;
    this._fullText = '';
    this._typewriterDone = false;
    this._typewriterSpeed = 25; // slightly faster for cutscenes

    this.eventBus.on('story:cutscene', (data) => this._onCutscene(data));

    this._onKeyDown = (e) => {
      if (!this._active) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._advance();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this._skip();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);
  }

  // ── Event Handler ───────────────────────────────

  _onCutscene(data) {
    // data: { chapterId, chapterNum, chapterTitle, slides }
    // slides: [{ text, illustration?, speaker?, themeColor? }]
    this._slides = data.slides ?? [];
    this._chapterNum = data.chapterNum ?? null;
    this._chapterTitle = data.chapterTitle ?? '';
    this._slideIndex = -1; // will increment to 0 on first advance

    if (this._slides.length === 0) return;

    this._active = true;
    this.eventBus.emit('game:pause');
    this._createOverlay();

    // Show chapter title card first, then first slide
    if (this._chapterTitle) {
      this._showChapterTitle();
    } else {
      this._slideIndex = 0;
      this._showSlide();
    }
  }

  // ── Overlay Lifecycle ───────────────────────────

  _createOverlay() {
    this._el = document.createElement('div');
    this._el.id = 'cutscene-overlay';
    this._el.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(2, 2, 8, 0.96);
      font-family: monospace; color: #e0e0e0;
      z-index: 60;
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      cursor: pointer;
      user-select: none;
    `;

    this._el.addEventListener('click', () => this._advance());
    this.container.appendChild(this._el);
  }

  _destroyOverlay() {
    this._stopTypewriter();
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
    this._active = false;
    this._slides = [];
    this._slideIndex = 0;
    this.eventBus.emit('game:resume');
    this.eventBus.emit('story:cutsceneComplete');
  }

  // ── Chapter Title Card ──────────────────────────

  _showChapterTitle() {
    if (!this._el) return;

    this._el.innerHTML = `
      <div style="text-align:center;max-width:500px;padding:20px">
        ${this._chapterNum != null
          ? `<div style="font-size:11px;color:#83769c;letter-spacing:3px;margin-bottom:8px">
              CHAPTER ${this._chapterNum}
            </div>`
          : ''}
        <div style="font-size:22px;color:#ffec27;letter-spacing:2px;margin-bottom:16px">
          ${this._chapterTitle}
        </div>
        <div style="width:60px;height:2px;background:#4a4a6a;margin:0 auto 20px"></div>
        <div style="font-size:9px;color:#5f574f">Click or press Space to continue</div>
      </div>
    `;

    // Title card is special: advance goes to first slide
    this._typewriterDone = true;
  }

  // ── Slide Display ───────────────────────────────

  _showSlide() {
    if (!this._el) return;
    const slide = this._slides[this._slideIndex];
    if (!slide) {
      this._destroyOverlay();
      return;
    }

    this._el.innerHTML = '';

    // Main content wrapper
    const content = document.createElement('div');
    content.style.cssText = `
      max-width: 500px; width: 90%;
      display: flex; flex-direction: column;
      align-items: center; gap: 16px;
    `;

    // Optional illustration area (top half)
    if (slide.illustration) {
      const illustrationWrap = document.createElement('div');
      illustrationWrap.style.cssText = `
        width: 100%; max-height: 180px;
        display: flex; justify-content: center; align-items: center;
        margin-bottom: 8px;
      `;

      const illustCanvas = document.createElement('canvas');
      illustCanvas.width = 64;
      illustCanvas.height = 64;
      illustCanvas.style.cssText = 'width:128px;height:128px;image-rendering:pixelated;';
      this._drawIllustration(illustCanvas, slide.illustration);
      illustrationWrap.appendChild(illustCanvas);
      content.appendChild(illustrationWrap);
    }

    // Speaker name if present
    if (slide.speaker) {
      const speakerEl = document.createElement('div');
      speakerEl.style.cssText = `
        font-size: 12px; font-weight: bold;
        color: ${slide.themeColor ?? '#ffec27'};
        align-self: flex-start;
      `;
      speakerEl.textContent = slide.speaker;
      content.appendChild(speakerEl);
    }

    // Text area
    const textEl = document.createElement('div');
    textEl.id = 'cutscene-text';
    textEl.style.cssText = `
      font-size: 12px; line-height: 1.6;
      color: #d0d0e0; text-align: center;
      min-height: 40px; width: 100%;
    `;
    content.appendChild(textEl);

    // Slide indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      font-size: 9px; color: #5f574f; margin-top: 12px;
    `;
    indicator.textContent = `${this._slideIndex + 1} / ${this._slides.length}  |  Click / Space to continue  |  ESC to skip`;
    content.appendChild(indicator);

    this._el.appendChild(content);

    // Start typewriter
    this._startTypewriter(slide.text, textEl);
  }

  // ── Typewriter ──────────────────────────────────

  _startTypewriter(text, textEl) {
    this._stopTypewriter();
    this._fullText = text;
    this._charIndex = 0;
    this._typewriterDone = false;
    this._textEl = textEl;

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
  }

  _stopTypewriter() {
    if (this._typewriterTimer) {
      clearInterval(this._typewriterTimer);
      this._typewriterTimer = null;
    }
  }

  // ── Navigation ──────────────────────────────────

  _advance() {
    if (!this._active) return;

    // If typewriter mid-animation, skip to end
    if (!this._typewriterDone) {
      this._finishTypewriter();
      return;
    }

    // Move to next slide
    this._slideIndex++;
    if (this._slideIndex >= this._slides.length) {
      this._destroyOverlay();
    } else {
      this._showSlide();
    }
  }

  _skip() {
    if (!this._active) return;
    this._destroyOverlay();
  }

  // ── Illustration Rendering ──────────────────────

  _drawIllustration(canvas, illustrationName) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Try pixel sprite
    const pixelData = this.sprites?.getPixelSprite(illustrationName);
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

    // Fallback: dark placeholder with stars
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#3a3a5a';
    const stars = [[10,8],[45,12],[20,30],[55,45],[8,50],[38,20],[52,8]];
    for (const [sx, sy] of stars) {
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  // ── Cleanup ─────────────────────────────────────

  destroy() {
    this._destroyOverlay();
    document.removeEventListener('keydown', this._onKeyDown);
  }
}
