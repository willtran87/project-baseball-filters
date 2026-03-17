/**
 * SpriteSystem — Manages sprite sheets and draws game entities.
 *
 * Supports:
 * 1. Traditional sprite sheet images with atlas regions
 * 2. Pixel-data arrays (2D arrays of color strings) for code-defined sprites
 * 3. Mixed 16x16 and 32x32 sprite sizes (auto-detected from array dimensions)
 * 4. Animated sprites with frame-based playback
 * 5. Portrait rendering for dialogue boxes
 */

import { SPRITE_ATLAS } from '../assets/sprites.js';

export class SpriteSystem {
  constructor() {
    this._sheets = new Map();   // name -> Image
    this._atlas = new Map();    // spriteName -> { sheet, x, y, w, h }
    this._pixelSprites = new Map(); // spriteName -> 2D color array
    this._animatedSprites = new Map(); // name -> { frames, frameDuration, currentFrame, elapsed }
    this._spriteCache = new Map(); // cacheKey -> offscreen canvas
  }

  /**
   * Load a sprite sheet image. Returns a promise.
   */
  async loadSheet(name, url, atlas) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this._sheets.set(name, img);
        if (atlas) {
          for (const [spriteName, rect] of Object.entries(atlas)) {
            this._atlas.set(spriteName, { sheet: name, ...rect });
          }
        }
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Register a pixel-data sprite (2D array of palette colors or null for transparent).
   * Automatically detects 16x16 vs 32x32 from array dimensions.
   */
  registerPixelSprite(name, data) {
    this._pixelSprites.set(name, data);
  }

  /**
   * Register multiple pixel sprites from an object map.
   */
  registerPixelSprites(spriteMap) {
    for (const [name, data] of Object.entries(spriteMap)) {
      if (data != null) {
        this._pixelSprites.set(name, data);
      }
    }
  }

  /**
   * Register an animated sprite with multiple frames.
   * @param {string} name - Sprite name
   * @param {Array} frames - Array of 2D color arrays (each frame)
   * @param {number} frameDuration - Duration per frame in ms
   */
  registerAnimatedSprite(name, frames, frameDuration) {
    this._animatedSprites.set(name, {
      frames,
      frameDuration,
      currentFrame: 0,
      elapsed: 0,
    });
    // Register the first frame as the default pixel sprite
    if (frames.length > 0) {
      this._pixelSprites.set(name, frames[0]);
    }
  }

  /**
   * Advance animation timers. Call once per frame with delta time in ms.
   */
  update(dt) {
    for (const [name, anim] of this._animatedSprites) {
      anim.elapsed += dt;
      if (anim.elapsed >= anim.frameDuration) {
        anim.elapsed -= anim.frameDuration;
        anim.currentFrame = (anim.currentFrame + 1) % anim.frames.length;
        // Update the pixel sprite to current frame and invalidate cache
        this._pixelSprites.set(name, anim.frames[anim.currentFrame]);
        this._spriteCache.delete(name);
      }
    }
  }

  /**
   * Check if a sprite exists (either sheet-based or pixel-data).
   */
  hasSprite(name) {
    return this._atlas.has(name) || this._pixelSprites.has(name);
  }

  /**
   * Get sprite definition by name.
   */
  getSprite(name) {
    return this._atlas.get(name) ?? null;
  }

  /**
   * Get pixel sprite data by name.
   */
  getPixelSprite(name) {
    return this._pixelSprites.get(name) ?? null;
  }

  /**
   * Get the dimensions of a pixel sprite (auto-detect 16x16 vs 32x32).
   */
  getSpriteSize(name) {
    const data = this._pixelSprites.get(name);
    if (!data || !Array.isArray(data) || data.length === 0) return { w: 16, h: 16 };
    return { w: data[0].length, h: data.length };
  }

  /**
   * Get or create a cached offscreen canvas for a pixel sprite.
   * Returns the cached canvas, or null if not a pixel sprite.
   */
  _getCachedSprite(spriteName) {
    const cached = this._spriteCache.get(spriteName);
    if (cached) return cached;

    const pixelData = this._pixelSprites.get(spriteName);
    if (!pixelData) return null;

    const h = pixelData.length;
    const w = h > 0 ? pixelData[0].length : 0;
    if (w === 0 || h === 0) return null;

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const octx = offscreen.getContext('2d');

    for (let row = 0; row < h; row++) {
      const line = pixelData[row];
      for (let col = 0; col < line.length; col++) {
        const color = line[col];
        if (color) {
          octx.fillStyle = color;
          octx.fillRect(col, row, 1, 1);
        }
      }
    }

    this._spriteCache.set(spriteName, offscreen);
    return offscreen;
  }

  /**
   * Invalidate a cached sprite so it is re-rendered on next draw.
   * Called when the sprite's pixel data changes (e.g. condition state change).
   */
  invalidateCache(spriteName) {
    this._spriteCache.delete(spriteName);
  }

  /**
   * Draw a named sprite at a world position.
   * Tries pixel-data first (with offscreen cache), then atlas sheet.
   * Automatically handles different sprite sizes.
   */
  draw(renderer, spriteName, dx, dy) {
    // Try cached pixel-data sprite first
    const cached = this._getCachedSprite(spriteName);
    if (cached) {
      const baseX = Math.floor(dx - renderer.cameraX);
      const baseY = Math.floor(dy - renderer.cameraY);
      renderer.ctx.drawImage(cached, baseX, baseY);
      return;
    }

    // Pixel data exists but cache failed? Fall back to direct draw
    const pixelData = this._pixelSprites.get(spriteName);
    if (pixelData) {
      renderer.drawPixelSprite(pixelData, dx, dy);
      return;
    }

    // Fall back to sheet-based sprite
    const def = this._atlas.get(spriteName);
    if (!def) return;
    const sheet = this._sheets.get(def.sheet);
    if (!sheet) return;
    renderer.drawSprite(sheet, def.x, def.y, def.w, def.h, dx, dy);
  }

  /**
   * Draw an NPC portrait at screen-space coordinates with optional scale.
   * Used for dialogue boxes and character displays.
   * @param {CanvasRenderingContext2D|object} renderer - Canvas renderer or raw ctx
   * @param {string} name - Portrait sprite name
   * @param {number} x - Screen x position
   * @param {number} y - Screen y position
   * @param {number} scale - Pixel scale (default 2 for 64x64 display of 32x32 portrait)
   */
  drawPortrait(renderer, name, x, y, scale = 2) {
    const data = this._pixelSprites.get(name);
    if (!data) return;

    // If renderer has a drawPixelSpriteScaled method, use it
    if (renderer.drawPixelSpriteScaled) {
      renderer.drawPixelSpriteScaled(data, x, y, scale);
      return;
    }

    // Otherwise get the raw context and draw manually
    const ctx = renderer.ctx || renderer;
    if (!ctx || !ctx.fillRect) return;

    for (let row = 0; row < data.length; row++) {
      for (let col = 0; col < data[row].length; col++) {
        const color = data[row][col];
        if (color !== null) {
          ctx.fillStyle = color;
          ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
        }
      }
    }
  }

  /**
   * Render all visible game entities from state.
   * Called each frame by the game loop.
   */
  render(renderer, state) {
    const filters = state.filters;
    const currentZone = state.currentZone ?? 'field';
    const now = Date.now() * 0.001; // seconds for animation

    for (let i = 0; i < filters.length; i++) {
      const filter = filters[i];

      // Only render filters in the current zone
      if (filter.zone && filter.zone !== currentZone) continue;
      // If no zone field (legacy), show in mechanical
      if (!filter.zone && currentZone !== 'mechanical') continue;

      // Determine condition state for sprite selection
      const condRatio = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
      const condState = filter.condition <= 0 ? 'broken'
        : condRatio < 0.4 ? 'worn' : 'good';

      // Try progressively less specific sprite names:
      // 1. Condition-specific: filter_{type}_{condState}  (e.g. filter_basic_worn)
      // 2. Domain-specific:    filter_{domain}_{componentType}_t{tier}
      // 3. Domain:             filter_{domain}
      // 4. Type:               filter_{type}
      // 5. Generic condition:  filter_broken / filter_warning
      // 6. Fallback:           filter_default
      let spriteName = null;
      const candidates = [];

      // Condition-aware type sprite (best visual)
      if (filter.type) candidates.push(`filter_${filter.type}_${condState}`);
      if (filter.domain) candidates.push(`filter_${filter.domain}_${condState}`);

      // Domain/component/tier hierarchy
      if (filter.domain && filter.componentType) {
        candidates.push(`filter_${filter.domain}_${filter.componentType}_t${filter.tier ?? 1}`);
        candidates.push(`filter_${filter.domain}_${filter.componentType}`);
      }
      if (filter.domain) candidates.push(`filter_${filter.domain}`);
      if (filter.type) candidates.push(`filter_${filter.type}`);

      // Generic broken/warning fallbacks
      if (condState === 'broken') candidates.push('filter_broken');
      if (condState === 'worn') candidates.push('filter_warning');
      candidates.push('filter_default');

      for (const name of candidates) {
        if (this.hasSprite(name)) {
          spriteName = name;
          break;
        }
      }
      spriteName = spriteName ?? 'filter_default';

      const spriteSize = this.getSpriteSize(spriteName);
      const screenX = Math.floor(filter.x - renderer.cameraX);
      const screenY = Math.floor(filter.y - renderer.cameraY);

      // Broken filter: pulsing red warning glow behind the sprite
      if (condState === 'broken') {
        const pulse = Math.sin(now * 4 + i) * 0.12 + 0.18;
        renderer.save();
        renderer.setAlpha(pulse);
        renderer.drawRectScreen(
          screenX - 1, screenY - 1,
          spriteSize.w + 2, spriteSize.h + 2,
          '#ff004d'
        );
        renderer.restore();
      }

      // Worn filter: subtle amber flash
      if (condState === 'worn') {
        const flash = Math.sin(now * 2.5 + i * 1.7) * 0.06 + 0.08;
        renderer.save();
        renderer.setAlpha(flash);
        renderer.drawRectScreen(
          screenX - 1, screenY - 1,
          spriteSize.w + 2, spriteSize.h + 2,
          '#ffa300'
        );
        renderer.restore();
      }

      this.draw(renderer, spriteName, filter.x, filter.y);

      // Draw condition indicator bar below filter (3px tall with border)
      const ratio = filter.maxCondition > 0 ? filter.condition / filter.maxCondition : 0;
      const barColor = ratio > 0.6 ? '#00e436' : ratio > 0.3 ? '#ffa300' : '#ff004d';
      const barWidth = Math.min(spriteSize.w - 2, 30);
      const barX = screenX + 1;
      const barY = screenY + spriteSize.h + 1;
      const barH = 3;

      // 1px dark border around the bar
      renderer.drawRectScreen(barX - 1, barY - 1, barWidth + 2, barH + 2, '#111111');
      // Draw the bar itself (background + fill)
      renderer.drawBar(barX, barY, barWidth, barH, ratio, barColor);

      // Warning indicators above the bar
      if (ratio === 0) {
        // Broken: draw a small "X" (2 red pixels in X shape) above bar center
        const cx = barX + Math.floor(barWidth / 2);
        const cy = barY - 4;
        renderer.drawRectScreen(cx - 1, cy, 1, 1, '#ff004d');
        renderer.drawRectScreen(cx + 1, cy, 1, 1, '#ff004d');
        renderer.drawRectScreen(cx, cy + 1, 1, 1, '#ff004d');
        renderer.drawRectScreen(cx - 1, cy + 2, 1, 1, '#ff004d');
        renderer.drawRectScreen(cx + 1, cy + 2, 1, 1, '#ff004d');
      } else if (ratio < 0.25) {
        // Low condition: single red "!" pixel above bar center
        const cx = barX + Math.floor(barWidth / 2);
        renderer.drawRectScreen(cx, barY - 4, 1, 1, '#ff004d');
      }
    }
  }
}
