/**
 * GameLoop — Fixed timestep update with variable render.
 *
 * Uses a fixed dt for simulation updates (deterministic) and
 * passes an interpolation factor to render for smooth drawing.
 * Supports pause/resume and speed control (1x, 2x, 3x).
 */

const FIXED_DT = 1 / 60; // 60 ticks per second
const MAX_FRAME_TIME = 0.25; // clamp to avoid spiral of death
const VALID_SPEEDS = [1, 2, 3];

export class GameLoop {
  constructor(updateFn, renderFn) {
    this._update = updateFn;
    this._render = renderFn;
    this._running = false;
    this._paused = false;
    this._speed = 1;
    this._accumulator = 0;
    this._lastTime = 0;
    this._rafId = null;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._paused = false;
    this._lastTime = performance.now() / 1000;
    this._accumulator = 0;
    this._rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  pause() {
    this._paused = true;
  }

  resume() {
    if (!this._paused) return;
    this._paused = false;
    this._lastTime = performance.now() / 1000;
    this._accumulator = 0;
  }

  setSpeed(speed) {
    if (VALID_SPEEDS.includes(speed)) {
      this._speed = speed;
    }
  }

  _tick(timestamp) {
    if (!this._running) return;

    const currentTime = timestamp / 1000;
    let frameTime = currentTime - this._lastTime;
    this._lastTime = currentTime;

    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME;
    }

    // Always render, but only update simulation when not paused
    if (!this._paused) {
      this._accumulator += frameTime * this._speed;

      while (this._accumulator >= FIXED_DT) {
        this._update(FIXED_DT);
        this._accumulator -= FIXED_DT;
      }
    }

    const interpolation = this._paused ? 0 : this._accumulator / FIXED_DT;
    this._render(interpolation);

    this._rafId = requestAnimationFrame(this._tick);
  }

  get running() {
    return this._running;
  }

  get paused() {
    return this._paused;
  }

  get speed() {
    return this._speed;
  }

  get fixedDt() {
    return FIXED_DT;
  }
}
