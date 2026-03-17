/**
 * ParticleSystem — Simple particle effects for visual flair.
 *
 * Supports multiple emitters for different effects:
 * steam, sparks, water drips, dust, smoke.
 *
 * Also includes FloatingText for rising +$, -$, +rep style popups
 * and ScreenShake for impact feedback.
 */

import PALETTE from '../assets/palette.js';

/**
 * Individual particle.
 */
class Particle {
  constructor(x, y, vx, vy, life, color, size, gravity) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.gravity = gravity;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  get alive() {
    return this.life > 0;
  }

  get alpha() {
    return Math.max(0, this.life / this.maxLife);
  }
}

/**
 * Particle effect presets.
 */
const PRESETS = {
  steam: {
    count: 3,
    speed: 15,
    spread: 8,
    life: [0.8, 1.5],
    colors: [PALETTE.LIGHT_GRAY, PALETTE.WHITE],
    size: 1,
    gravity: -10,
    directionY: -1,
  },
  sparks: {
    count: 5,
    speed: 40,
    spread: 20,
    life: [0.3, 0.7],
    colors: [PALETTE.YELLOW, PALETTE.ORANGE, PALETTE.RED],
    size: 1,
    gravity: 30,
    directionY: -1,
  },
  water: {
    count: 2,
    speed: 20,
    spread: 4,
    life: [0.5, 1.0],
    colors: [PALETTE.WATER, PALETTE.WATER_LT, PALETTE.BLUE],
    size: 1,
    gravity: 40,
    directionY: 1,
  },
  dust: {
    count: 2,
    speed: 8,
    spread: 12,
    life: [1.0, 2.0],
    colors: [PALETTE.DIRT_LT, PALETTE.DIRT, PALETTE.BROWN],
    size: 1,
    gravity: 5,
    directionY: -1,
  },
  smoke: {
    count: 2,
    speed: 10,
    spread: 6,
    life: [1.5, 3.0],
    colors: [PALETTE.DARK_GRAY, PALETTE.LIGHT_GRAY],
    size: 2,
    gravity: -8,
    directionY: -1,
  },
  success: {
    count: 8,
    speed: 30,
    spread: 20,
    life: [0.5, 1.2],
    colors: [PALETTE.GREEN, PALETTE.YELLOW, PALETTE.WHITE],
    size: 1,
    gravity: 20,
    directionY: -1,
  },
  // Baseball-themed effects
  homerun: {
    count: 20,
    speed: 50,
    spread: 40,
    life: [1.0, 2.5],
    colors: [PALETTE.RED, PALETTE.WHITE, PALETTE.YELLOW, PALETTE.GOLD, PALETTE.ORANGE],
    size: 2,
    gravity: 15,
    directionY: -1,
  },
  confetti: {
    count: 15,
    speed: 25,
    spread: 30,
    life: [1.5, 3.0],
    colors: [PALETTE.RED, PALETTE.WHITE, PALETTE.BLUE, PALETTE.YELLOW, PALETTE.GREEN],
    size: 1,
    gravity: 8,
    directionY: -1,
  },
  crowdCheer: {
    count: 6,
    speed: 20,
    spread: 50,
    life: [0.5, 1.0],
    colors: [PALETTE.YELLOW, PALETTE.WHITE, PALETTE.ORANGE],
    size: 1,
    gravity: -15,
    directionY: -1,
  },
  dirtKick: {
    count: 4,
    speed: 15,
    spread: 10,
    life: [0.4, 0.8],
    colors: [PALETTE.DIRT, PALETTE.DIRT_LT, PALETTE.BROWN],
    size: 1,
    gravity: 30,
    directionY: -1,
  },
  sewageSpill: {
    count: 6,
    speed: 12,
    spread: 8,
    life: [1.0, 2.0],
    colors: [PALETTE.MOSS_GREEN, PALETTE.BROWN, PALETTE.DARK_GREEN],
    size: 2,
    gravity: 25,
    directionY: 1,
  },
  // Coin sparkle for economic events
  coins: {
    count: 6,
    speed: 20,
    spread: 15,
    life: [0.6, 1.2],
    colors: [PALETTE.YELLOW, PALETTE.GOLD, PALETTE.WHITE],
    size: 1,
    gravity: 15,
    directionY: -1,
  },
  // Warning flash for alerts
  warning: {
    count: 4,
    speed: 10,
    spread: 25,
    life: [0.3, 0.6],
    colors: [PALETTE.ORANGE, PALETTE.RED, PALETTE.YELLOW],
    size: 1,
    gravity: 0,
    directionY: -1,
  },
  // Filter repair sparkle (blue/white)
  repairSparkle: {
    count: 8,
    speed: 28,
    spread: 18,
    life: [0.5, 1.2],
    colors: [PALETTE.BLUE, PALETTE.WATER_LT, PALETTE.WHITE],
    size: 1,
    gravity: 18,
    directionY: -1,
  },
  // Filter removal puff (red/orange)
  removePuff: {
    count: 6,
    speed: 14,
    spread: 12,
    life: [0.4, 0.9],
    colors: [PALETTE.RED, PALETTE.ORANGE, PALETTE.RUST_ORANGE],
    size: 1,
    gravity: 12,
    directionY: -1,
  },
};

export class ParticleSystem {
  constructor() {
    this._particles = [];
    this._emitters = [];
    this._maxParticles = 200;
  }

  /**
   * Emit a burst of particles at a position.
   * @param {string} preset - one of: steam, sparks, water, dust, smoke, success
   * @param {number} x - world X position
   * @param {number} y - world Y position
   */
  emit(preset, x, y) {
    const p = PRESETS[preset];
    if (!p) return;

    for (let i = 0; i < p.count; i++) {
      if (this._particles.length >= this._maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = p.speed * (0.5 + Math.random() * 0.5);
      const spreadX = (Math.random() - 0.5) * p.spread;
      const vx = Math.cos(angle) * speed * 0.5 + spreadX;
      const vy = p.directionY * Math.abs(Math.sin(angle)) * speed;
      const life = p.life[0] + Math.random() * (p.life[1] - p.life[0]);
      const color = p.colors[Math.floor(Math.random() * p.colors.length)];

      this._particles.push(new Particle(x, y, vx, vy, life, color, p.size, p.gravity));
    }
  }

  /**
   * Add a continuous emitter that fires on interval.
   * Returns an emitter ID for later removal.
   */
  addEmitter(preset, x, y, intervalSec = 0.3) {
    const id = Date.now() + Math.random();
    this._emitters.push({ id, preset, x, y, interval: intervalSec, timer: 0 });
    return id;
  }

  /**
   * Remove a continuous emitter by ID.
   */
  removeEmitter(id) {
    const idx = this._emitters.findIndex(e => e.id === id);
    if (idx !== -1) this._emitters.splice(idx, 1);
  }

  /**
   * Clear all particles and emitters.
   */
  clear() {
    this._particles.length = 0;
    this._emitters.length = 0;
  }

  /**
   * Update all particles and emitters.
   */
  update(dt) {
    // Update emitters
    for (const emitter of this._emitters) {
      emitter.timer += dt;
      if (emitter.timer >= emitter.interval) {
        emitter.timer -= emitter.interval;
        this.emit(emitter.preset, emitter.x, emitter.y);
      }
    }

    // Update particles (swap-and-pop removal to avoid O(n) splice shifts)
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.vy += p.gravity * dt;
      p.update(dt);
      if (!p.alive) {
        this._particles[i] = this._particles[this._particles.length - 1];
        this._particles.pop();
      }
    }
  }

  /**
   * Render all particles.
   */
  render(renderer) {
    for (const p of this._particles) {
      renderer.save();
      renderer.setAlpha(p.alpha);
      renderer.drawRect(p.x, p.y, p.size, p.size, p.color);
      renderer.restore();
    }
  }

  get particleCount() {
    return this._particles.length;
  }
}

/**
 * FloatingText — Rising text popups for +$, -$, +rep, damage numbers.
 *
 * Text floats upward and fades out over its lifetime.
 * Rendered on the canvas at world coordinates.
 */
export class FloatingTextSystem {
  constructor() {
    this._texts = [];
    this._maxTexts = 20;
  }

  /**
   * Spawn a floating text popup.
   * @param {string} text - Text to display (e.g. "+$500", "-3 REP")
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {string} color - Text color
   * @param {number} [life=1.5] - Duration in seconds
   */
  add(text, x, y, color = '#fff', life = 1.5) {
    if (this._texts.length >= this._maxTexts) {
      this._texts.shift();
    }
    this._texts.push({
      text,
      x: x + (Math.random() - 0.5) * 8, // slight random offset to prevent overlap
      y,
      color,
      life,
      maxLife: life,
      vy: -18, // float upward speed
    });
  }

  update(dt) {
    for (let i = this._texts.length - 1; i >= 0; i--) {
      const t = this._texts[i];
      t.y += t.vy * dt;
      t.life -= dt;
      // Decelerate upward movement
      t.vy *= 0.97;
      if (t.life <= 0) {
        this._texts[i] = this._texts[this._texts.length - 1];
        this._texts.pop();
      }
    }
  }

  render(renderer) {
    for (const t of this._texts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      renderer.save();
      renderer.setAlpha(alpha);
      renderer.drawText(t.text, t.x, t.y, { color: t.color, size: 7, align: 'center' });
      renderer.restore();
    }
  }

  clear() {
    this._texts.length = 0;
  }
}

/**
 * ScreenShake — Camera offset shake for impact feedback.
 *
 * Apply to CanvasRenderer.cameraX/cameraY each frame.
 */
/**
 * ScreenFlash — Fullscreen color overlay for dramatic moments.
 *
 * Draws a fading color rectangle over the entire canvas.
 * Supports multiple simultaneous flashes (e.g. red + orange).
 */
export class ScreenFlash {
  constructor() {
    this._flashes = [];
  }

  /**
   * Trigger a screen flash.
   * @param {string} color - CSS color (e.g. '#ff004d')
   * @param {number} duration - Fade duration in seconds
   * @param {number} maxOpacity - Peak opacity (0-1, keep subtle: 0.1-0.3)
   */
  flash(color, duration = 0.3, maxOpacity = 0.3) {
    this._flashes.push({ color, duration, maxOpacity, timer: 0 });
  }

  update(dt) {
    for (let i = this._flashes.length - 1; i >= 0; i--) {
      this._flashes[i].timer += dt;
      if (this._flashes[i].timer >= this._flashes[i].duration) {
        this._flashes[i] = this._flashes[this._flashes.length - 1];
        this._flashes.pop();
      }
    }
  }

  render(renderer) {
    for (const f of this._flashes) {
      const progress = f.timer / f.duration;
      // Quick fade-in then fade-out: peak at 20% of duration
      const alpha = progress < 0.2
        ? f.maxOpacity * (progress / 0.2)
        : f.maxOpacity * (1 - (progress - 0.2) / 0.8);
      if (alpha > 0.005) {
        renderer.save();
        renderer.setAlpha(alpha);
        renderer.drawRectScreen(0, 0, renderer.width, renderer.height, f.color);
        renderer.restore();
      }
    }
  }

  get active() {
    return this._flashes.length > 0;
  }

  clear() {
    this._flashes.length = 0;
  }
}

export class ScreenShake {
  constructor() {
    this._intensity = 0;
    this._duration = 0;
    this._timer = 0;
    this._offsetX = 0;
    this._offsetY = 0;
  }

  /**
   * Trigger a screen shake.
   * @param {number} intensity - Max pixel displacement (e.g. 2-4 for subtle, 6-8 for dramatic)
   * @param {number} duration - Duration in seconds
   */
  shake(intensity = 3, duration = 0.3) {
    // Only override if new shake is stronger than current
    if (intensity >= this._intensity) {
      this._intensity = intensity;
      this._duration = duration;
      this._timer = 0;
    }
  }

  update(dt) {
    if (this._duration <= 0) {
      this._offsetX = 0;
      this._offsetY = 0;
      return;
    }

    this._timer += dt;
    if (this._timer >= this._duration) {
      this._duration = 0;
      this._intensity = 0;
      this._offsetX = 0;
      this._offsetY = 0;
      return;
    }

    // Decay intensity over duration
    const progress = this._timer / this._duration;
    const currentIntensity = this._intensity * (1 - progress);
    this._offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
    this._offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
  }

  get offsetX() { return Math.round(this._offsetX); }
  get offsetY() { return Math.round(this._offsetY); }
  get active() { return this._duration > 0; }
}
