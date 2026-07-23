/**
 * CanvasRenderer — Low-level canvas drawing utilities.
 *
 * Wraps the 2D context with helpers for pixel-art friendly rendering
 * (nearest-neighbor scaling, integer coordinates, palette colors).
 * Includes camera/viewport support for scrolling views.
 */

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.width = canvas.width;
    this.height = canvas.height;

    // Camera offset for viewport scrolling
    this.cameraX = 0;
    this.cameraY = 0;
  }

  clear(color = '#1a1a2e') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.floor(x - this.cameraX),
      Math.floor(y - this.cameraY),
      w, h
    );
  }

  drawRectScreen(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  drawOutline(x, y, w, h, color, lineWidth = 1) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(
      Math.floor(x - this.cameraX) + 0.5,
      Math.floor(y - this.cameraY) + 0.5,
      w - 1, h - 1
    );
  }

  drawOutlineScreen(x, y, w, h, color, lineWidth = 1) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(
      Math.floor(x) + 0.5,
      Math.floor(y) + 0.5,
      w - 1, h - 1
    );
  }

  drawSprite(image, sx, sy, sw, sh, dx, dy, dw, dh) {
    this.ctx.drawImage(
      image,
      sx, sy, sw, sh,
      Math.floor(dx - this.cameraX),
      Math.floor(dy - this.cameraY),
      dw ?? sw, dh ?? sh
    );
  }

  drawSpriteScreen(image, sx, sy, sw, sh, dx, dy, dw, dh) {
    this.ctx.drawImage(
      image,
      sx, sy, sw, sh,
      Math.floor(dx), Math.floor(dy),
      dw ?? sw, dh ?? sh
    );
  }

  drawText(text, x, y, { color = '#fff', size = 8, align = 'left' } = {}) {
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px monospace`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, Math.floor(x), Math.floor(y));
  }

  /**
   * Draw a single pixel at world coordinates.
   */
  drawPixel(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.floor(x - this.cameraX),
      Math.floor(y - this.cameraY),
      1, 1
    );
  }

  /**
   * Draw a pixel-data sprite (2D array of color strings/null) at world position.
   */
  drawPixelSprite(data, dx, dy) {
    const baseX = Math.floor(dx - this.cameraX);
    const baseY = Math.floor(dy - this.cameraY);
    for (let row = 0; row < data.length; row++) {
      const line = data[row];
      for (let col = 0; col < line.length; col++) {
        const color = line[col];
        if (color) {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(baseX + col, baseY + row, 1, 1);
        }
      }
    }
  }

  /**
   * Draw a pixel-data sprite at screen position with scale factor.
   * Used for NPC portraits in dialogue boxes.
   */
  drawPixelSpriteScaled(data, dx, dy, scale = 2) {
    const baseX = Math.floor(dx);
    const baseY = Math.floor(dy);
    for (let row = 0; row < data.length; row++) {
      const line = data[row];
      for (let col = 0; col < line.length; col++) {
        const color = line[col];
        if (color) {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(baseX + col * scale, baseY + row * scale, scale, scale);
        }
      }
    }
  }

  /**
   * Draw a horizontal progress bar.
   */
  drawBar(x, y, w, h, ratio, fgColor, bgColor = '#222') {
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    if (ratio > 0) {
      this.ctx.fillStyle = fgColor;
      this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w * Math.min(1, ratio)), h);
    }
  }

  /**
   * Draw a line between two points (screen space).
   */
  drawLine(x1, y1, x2, y2, color, lineWidth = 1) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
    this.ctx.lineTo(Math.floor(x2) + 0.5, Math.floor(y2) + 0.5);
    this.ctx.stroke();
  }

  /**
   * Draw a pixel-data sprite flipped horizontally at world position.
   */
  drawPixelSpriteFlipped(data, dx, dy) {
    if (!data) return;
    const w = data[0]?.length ?? 0;
    for (let row = 0; row < data.length; row++) {
      for (let col = 0; col < w; col++) {
        const color = data[row][col];
        if (!color) continue;
        const flippedCol = w - 1 - col;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(dx + flippedCol - this.cameraX), Math.floor(dy + row - this.cameraY), 1, 1);
      }
    }
  }

  save() { this.ctx.save(); }
  restore() { this.ctx.restore(); }
  setAlpha(a) { this.ctx.globalAlpha = a; }

  /**
   * Convert screen coordinates (CSS pixels) to canvas logical coordinates.
   */
  screenToCanvas(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    return {
      x: (screenX - rect.left) * scaleX,
      y: (screenY - rect.top) * scaleY,
    };
  }

  /**
   * Convert canvas coordinates to world coordinates (accounting for camera).
   */
  canvasToWorld(cx, cy) {
    return {
      x: cx + this.cameraX,
      y: cy + this.cameraY,
    };
  }
}
