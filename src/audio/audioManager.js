/**
 * AudioManager — Web Audio API based sound system.
 *
 * All sounds are procedurally generated using oscillators and noise buffers,
 * so no external audio files are needed. Listens to EventBus events for
 * context-sensitive playback (crowd volume on game days, machinery stress, etc).
 */

// ── ZoneAmbience ─────────────────────────────────────────────────
// Manages per-zone ambient sound profiles using WebAudio nodes.
// Each zone has a unique set of oscillators/noise/filters that crossfade
// on zone switch. Connects through ambientGain → masterGain.

class ZoneAmbience {
  constructor(audioManager) {
    this._am = audioManager;
    this._currentZone = null;
    this._currentNodes = [];    // active WebAudio nodes for current zone
    this._currentGain = null;   // gain node for current zone profile
    this._fadingOut = [];       // nodes being faded out

    // Scheduled interval handles (for periodic sounds)
    this._intervals = [];
    this._timeouts = [];

    // Field-zone crowd gain reference for attendance scaling
    this._crowdGain = null;
  }

  get ctx() { return this._am._ctx; }
  get noiseBuffer() { return this._am._noiseBuffer; }
  get ambientGain() { return this._am._ambientGain; }

  /**
   * Crossfade from current zone profile to a new one over 0.5s.
   */
  switchZone(zoneId) {
    if (!this.ctx || zoneId === this._currentZone) return;
    const t = this.ctx.currentTime;

    // Fade out old zone
    if (this._currentGain) {
      const oldGain = this._currentGain;
      const oldNodes = this._currentNodes;
      oldGain.gain.setTargetAtTime(0, t, 0.15);
      // Disconnect after fade
      this._fadingOut.push({ gain: oldGain, nodes: oldNodes, deadline: t + 0.8 });
    }

    // Clear scheduled periodic sounds
    for (const id of this._intervals) clearInterval(id);
    for (const id of this._timeouts) clearTimeout(id);
    this._intervals = [];
    this._timeouts = [];
    this._crowdGain = null;

    // Create new zone profile
    this._currentNodes = [];
    this._currentGain = this.ctx.createGain();
    this._currentGain.gain.setValueAtTime(0, t);
    this._currentGain.connect(this.ambientGain);
    this._currentZone = zoneId;

    const builder = this._zoneBuilders[zoneId];
    if (builder) {
      builder.call(this);
    }

    // Fade in new zone
    const targetVol = 1.0;
    this._currentGain.gain.setTargetAtTime(targetVol, t, 0.15);
  }

  /**
   * Clean up fading-out nodes that have passed their deadline.
   */
  cleanup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = this._fadingOut.length - 1; i >= 0; i--) {
      const entry = this._fadingOut[i];
      if (t >= entry.deadline) {
        this._disconnectNodes(entry.nodes);
        try { entry.gain.disconnect(); } catch (_) { /* already disconnected */ }
        this._fadingOut.splice(i, 1);
      }
    }
  }

  /**
   * Get the crowd gain node (for attendance-based scaling on field zone).
   */
  get crowdGain() { return this._crowdGain; }

  // ── Helpers ──

  _trackNode(node) {
    this._currentNodes.push(node);
    return node;
  }

  _createNoise(loop = true) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = loop;
    this._trackNode(src);
    return src;
  }

  _createOsc(type, freq) {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    this._trackNode(osc);
    return osc;
  }

  _createFilter(type, freq, Q) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (Q !== undefined) f.Q.value = Q;
    return f;
  }

  _createGain(val) {
    const g = this.ctx.createGain();
    g.gain.value = val;
    return g;
  }

  _startAll() {
    for (const n of this._currentNodes) {
      try { n.start(); } catch (_) { /* already started or not startable */ }
    }
  }

  _disconnectNodes(nodes) {
    for (const n of nodes) {
      try { n.stop(); } catch (_) { /* may not be stoppable */ }
      try { n.disconnect(); } catch (_) { /* already disconnected */ }
    }
  }

  _scheduleInterval(fn, ms) {
    const id = setInterval(fn, ms);
    this._intervals.push(id);
    return id;
  }

  _scheduleTimeout(fn, ms) {
    const id = setTimeout(fn, ms);
    this._timeouts.push(id);
    return id;
  }

  _scheduleRandomBurst(buildFn, minMs, maxMs) {
    const schedule = () => {
      if (this._currentZone === null) return;
      const delay = minMs + Math.random() * (maxMs - minMs);
      this._scheduleTimeout(() => {
        if (this.ctx && this._currentGain) {
          buildFn.call(this);
        }
        schedule();
      }, delay);
    };
    schedule();
  }

  // ── Zone Builders ──

  get _zoneBuilders() {
    return {
      field: this._buildField,
      concourse: this._buildConcourse,
      mechanical: this._buildMechanical,
      underground: this._buildUnderground,
      luxury: this._buildLuxury,
      pressbox: this._buildPressbox,
    };
  }

  /** Field: crowd murmur (attendance-scaled) + occasional bat crack */
  _buildField() {
    // Crowd murmur: bandpass-filtered noise (300-2000Hz)
    const noise = this._createNoise();
    const bp = this._createFilter('bandpass', 800, 0.5);
    bp.frequency.value = 800;
    // Use a wider Q to span 300-2000Hz range
    const lp = this._createFilter('lowpass', 2000, 0.7);
    const hp = this._createFilter('highpass', 300, 0.7);
    const crowdGain = this._createGain(0.12);
    this._crowdGain = crowdGain;

    // Crowd LFO for natural ebb-and-flow
    const lfo = this._createOsc('sine', 0.15);
    const lfoGain = this._createGain(0.03);
    lfo.connect(lfoGain);
    lfoGain.connect(crowdGain.gain);

    noise.connect(hp);
    hp.connect(lp);
    lp.connect(crowdGain);
    crowdGain.connect(this._currentGain);

    // Occasional bat crack: short square wave burst every 8-15s
    this._scheduleRandomBurst(() => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.connect(g);
      g.connect(this._currentGain);
      osc.start(t);
      osc.stop(t + 0.04);
    }, 8000, 15000);

    this._startAll();
  }

  /** Concourse: busy crowd (wider bandpass) + footstep rhythm */
  _buildConcourse() {
    // Busy crowd noise (200-3000Hz)
    const noise = this._createNoise();
    const hp = this._createFilter('highpass', 200, 0.5);
    const lp = this._createFilter('lowpass', 3000, 0.5);
    const crowdGain = this._createGain(0.09);

    noise.connect(hp);
    hp.connect(lp);
    lp.connect(crowdGain);
    crowdGain.connect(this._currentGain);

    // Footstep rhythm: quiet periodic clicks at random intervals
    this._scheduleRandomBurst(() => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3000 + Math.random() * 2000, t);
      g.gain.setValueAtTime(0.02, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
      osc.connect(g);
      g.connect(this._currentGain);
      osc.start(t);
      osc.stop(t + 0.015);
    }, 300, 500);

    this._startAll();
  }

  /** Mechanical: deep hum (sawtooth 55Hz + 110Hz) + valve hiss */
  _buildMechanical() {
    // Deep hum: sawtooth 55Hz
    const osc1 = this._createOsc('sawtooth', 55);
    const g1 = this._createGain(0.06);
    // Slow LFO vibrato
    const lfo = this._createOsc('sine', 0.3);
    const lfoG = this._createGain(2);
    lfo.connect(lfoG);
    lfoG.connect(osc1.frequency);

    osc1.connect(g1);
    g1.connect(this._currentGain);

    // Harmonic at 110Hz
    const osc2 = this._createOsc('sawtooth', 110);
    const g2 = this._createGain(0.03);
    osc2.connect(g2);
    g2.connect(this._currentGain);

    // Valve hiss: highpass noise (4000Hz+), intermittent (on 2s, off 3s)
    const hissNoise = this._createNoise();
    const hissFilter = this._createFilter('highpass', 4000, 0.5);
    const hissGain = this._createGain(0.0);
    hissNoise.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this._currentGain);

    // Intermittent hiss cycle
    let hissOn = false;
    this._scheduleInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      hissOn = !hissOn;
      hissGain.gain.setTargetAtTime(hissOn ? 0.04 : 0, t, 0.1);
    }, hissOn ? 2000 : 3000);
    // Start with hiss cycling: 2s on, 3s off alternating
    let hissCycle = true;
    const cycleHiss = () => {
      if (!this.ctx || this._currentZone !== 'mechanical') return;
      const t = this.ctx.currentTime;
      if (hissCycle) {
        hissGain.gain.setTargetAtTime(0.04, t, 0.1);
        this._scheduleTimeout(() => { hissCycle = false; cycleHiss(); }, 2000);
      } else {
        hissGain.gain.setTargetAtTime(0, t, 0.1);
        this._scheduleTimeout(() => { hissCycle = true; cycleHiss(); }, 3000);
      }
    };
    cycleHiss();

    this._startAll();
  }

  /** Underground: dripping pings + low rumble */
  _buildUnderground() {
    // Low rumble: filtered noise below 200Hz
    const rumbleNoise = this._createNoise();
    const rumbleLp = this._createFilter('lowpass', 200, 0.7);
    const rumbleGain = this._createGain(0.06);

    rumbleNoise.connect(rumbleLp);
    rumbleLp.connect(rumbleGain);
    rumbleGain.connect(this._currentGain);

    // Dripping: periodic sine pings at random intervals (1-3s)
    this._scheduleRandomBurst(() => {
      const t = this.ctx.currentTime;
      const freq = 1200 + Math.random() * 600; // 1200-1800Hz
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(g);
      g.connect(this._currentGain);
      osc.start(t);
      osc.stop(t + 0.1);
    }, 1000, 3000);

    this._startAll();
  }

  /** Luxury: muffled crowd + soft sine pad ambience */
  _buildLuxury() {
    // Muffled crowd: heavily lowpass-filtered noise (cutoff 500Hz)
    const noise = this._createNoise();
    const lp = this._createFilter('lowpass', 500, 0.5);
    const crowdGain = this._createGain(0.06);

    noise.connect(lp);
    lp.connect(crowdGain);
    crowdGain.connect(this._currentGain);

    // Soft ambience: quiet sine pad (440Hz + 554Hz) with slow amplitude envelope
    const osc1 = this._createOsc('sine', 440);
    const osc2 = this._createOsc('sine', 554);
    const padGain = this._createGain(0.015);

    // Slow amplitude LFO for the pad
    const padLfo = this._createOsc('sine', 0.08);
    const padLfoGain = this._createGain(0.008);
    padLfo.connect(padLfoGain);
    padLfoGain.connect(padGain.gain);

    osc1.connect(padGain);
    osc2.connect(padGain);
    padGain.connect(this._currentGain);

    this._startAll();
  }

  /** Pressbox: radio chatter + keyboard clicks */
  _buildPressbox() {
    // Radio chatter: bandpass noise (800-2500Hz), very quiet
    const noise = this._createNoise();
    const hp = this._createFilter('highpass', 800, 0.8);
    const lp = this._createFilter('lowpass', 2500, 0.8);
    const radioGain = this._createGain(0.035);

    noise.connect(hp);
    hp.connect(lp);
    lp.connect(radioGain);
    radioGain.connect(this._currentGain);

    // Keyboard: random short clicks at varying intervals
    this._scheduleRandomBurst(() => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(4000 + Math.random() * 3000, t);
      g.gain.setValueAtTime(0.015, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.008);
      osc.connect(g);
      g.connect(this._currentGain);
      osc.start(t);
      osc.stop(t + 0.012);
    }, 80, 400);

    this._startAll();
  }
}

// ── WeatherSoundLayer ────────────────────────────────────────────
// Overlay weather sounds on top of zone ambient.

class WeatherSoundLayer {
  constructor(audioManager) {
    this._am = audioManager;
    this._activeType = null;
    this._nodes = [];
    this._gain = null;
    this._intervals = [];
    this._timeouts = [];
  }

  get ctx() { return this._am._ctx; }
  get noiseBuffer() { return this._am._noiseBuffer; }
  get ambientGain() { return this._am._ambientGain; }

  /**
   * Start a weather sound layer. Fades in over 0.3s.
   */
  start(weatherType) {
    if (!this.ctx) return;
    this.stop(); // stop any current weather layer first

    this._activeType = weatherType;
    this._nodes = [];
    this._gain = this.ctx.createGain();
    this._gain.gain.setValueAtTime(0, this.ctx.currentTime);
    this._gain.connect(this.ambientGain);

    const builder = this._builders[weatherType];
    if (builder) {
      builder.call(this);
    }

    // Start all tracked nodes
    for (const n of this._nodes) {
      try { n.start(); } catch (_) { /* */ }
    }

    // Fade in
    this._gain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.1);
  }

  /**
   * Fade out and stop the current weather layer over 1s.
   */
  stop() {
    if (!this._gain || !this.ctx) {
      this._cleanup();
      return;
    }

    const t = this.ctx.currentTime;
    const oldGain = this._gain;
    const oldNodes = this._nodes;

    oldGain.gain.setTargetAtTime(0, t, 0.3);

    // Disconnect after fade
    setTimeout(() => {
      for (const n of oldNodes) {
        try { n.stop(); } catch (_) { /* */ }
        try { n.disconnect(); } catch (_) { /* */ }
      }
      try { oldGain.disconnect(); } catch (_) { /* */ }
    }, 1200);

    this._cleanup();
  }

  _cleanup() {
    for (const id of this._intervals) clearInterval(id);
    for (const id of this._timeouts) clearTimeout(id);
    this._intervals = [];
    this._timeouts = [];
    this._nodes = [];
    this._gain = null;
    this._activeType = null;
  }

  _track(node) {
    this._nodes.push(node);
    return node;
  }

  _createNoise() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    this._track(src);
    return src;
  }

  _scheduleRandomBurst(fn, minMs, maxMs) {
    const schedule = () => {
      if (!this._activeType) return;
      const delay = minMs + Math.random() * (maxMs - minMs);
      const id = setTimeout(() => {
        if (this.ctx && this._gain) fn.call(this);
        schedule();
      }, delay);
      this._timeouts.push(id);
    };
    schedule();
  }

  get _builders() {
    return {
      rain: this._buildRain,
      wind: this._buildWind,
      snow: this._buildSnow,
      heat: this._buildHeat,
    };
  }

  /** Rain: bandpass noise + occasional thunder rumble */
  _buildRain() {
    const noise = this._createNoise();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500;
    bp.Q.value = 0.3;
    const rainGain = this.ctx.createGain();
    rainGain.gain.value = 0.10;

    noise.connect(bp);
    bp.connect(rainGain);
    rainGain.connect(this._gain);

    // Occasional thunder: low triangle rumble every 5-10s
    this._scheduleRandomBurst(() => {
      const t = this.ctx.currentTime;
      const freq = 40 + Math.random() * 20; // 40-60Hz
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(g);
      g.connect(this._gain);
      osc.start(t);
      osc.stop(t + 0.25);
    }, 5000, 10000);
  }

  /** Wind: pink-ish noise with slow pitch modulation (sweeping) */
  _buildWind() {
    const noise = this._createNoise();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 600;
    bp.Q.value = 0.3;

    // Slow LFO on filter frequency for sweeping effect
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    this._track(lfo);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 400; // sweep from ~200 to ~1000Hz
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.08;

    noise.connect(bp);
    bp.connect(windGain);
    windGain.connect(this._gain);
  }

  /** Snow: very quiet high-frequency sparkle + slight volume reduction effect */
  _buildSnow() {
    // High-frequency sparkle bursts
    this._scheduleRandomBurst(() => {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(6000 + Math.random() * 4000, t);
      g.gain.setValueAtTime(0.012, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      osc.connect(g);
      g.connect(this._gain);
      osc.start(t);
      osc.stop(t + 0.025);
    }, 200, 800);

    // Subtle constant high shimmer
    const noise = this._createNoise();
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 8000;
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.value = 0.015;

    noise.connect(hp);
    hp.connect(shimmerGain);
    shimmerGain.connect(this._gain);
  }

  /** Heat: subtle low drone + slight mechanical boost feel */
  _buildHeat() {
    // Low drone sine at 80Hz
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80;
    this._track(osc);

    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.04;

    osc.connect(droneGain);
    droneGain.connect(this._gain);

    // Higher harmonic for heat shimmer feel
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 160;
    this._track(osc2);

    const shimGain = this.ctx.createGain();
    shimGain.gain.value = 0.015;

    // Slow amplitude LFO
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2;
    this._track(lfo);
    const lfoG = this.ctx.createGain();
    lfoG.gain.value = 0.01;
    lfo.connect(lfoG);
    lfoG.connect(shimGain.gain);

    osc2.connect(shimGain);
    shimGain.connect(this._gain);
  }
}

// ── HealthAlertTone ──────────────────────────────────────────────
// Pulsing tone when any domain health < 20%.

class HealthAlertTone {
  constructor(audioManager) {
    this._am = audioManager;
    this._active = false;
    this._osc = null;
    this._lfo = null;
    this._lfoGain = null;
    this._gain = null;
  }

  get ctx() { return this._am._ctx; }
  get ambientGain() { return this._am._ambientGain; }

  /**
   * Update based on domain health scores. Call each frame or periodically.
   * @param {Object} domainHealth - { air, water, hvac, drainage } 0-100 each
   */
  update(domainHealth) {
    if (!this.ctx || !domainHealth) return;

    const worst = Math.min(
      domainHealth.air ?? 100, domainHealth.water ?? 100,
      domainHealth.hvac ?? 100, domainHealth.drainage ?? 100
    );

    if (worst < 20 && !this._active) {
      this._start(worst);
    } else if (worst >= 25 && this._active) {
      this._stop();
    } else if (this._active && this._gain) {
      // Scale intensity inversely with health
      const intensity = Math.max(0, (20 - worst) / 20); // 0 at 20%, 1 at 0%
      const vol = 0.02 + intensity * 0.03; // 0.02 to 0.05
      this._lfoGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.2);
    }
  }

  _start(worstHealth) {
    if (!this.ctx) return;
    this._active = true;
    const t = this.ctx.currentTime;

    // Pulsing sine 200Hz
    this._osc = this.ctx.createOscillator();
    this._osc.type = 'sine';
    this._osc.frequency.value = 200;

    // Amplitude LFO at 1Hz (pulse 0 → vol → 0)
    this._lfo = this.ctx.createOscillator();
    this._lfo.type = 'sine';
    this._lfo.frequency.value = 1;

    const intensity = Math.max(0, (20 - worstHealth) / 20);
    const vol = 0.02 + intensity * 0.03;

    this._lfoGain = this.ctx.createGain();
    this._lfoGain.gain.value = vol;

    this._gain = this.ctx.createGain();
    this._gain.gain.value = 0;

    this._lfo.connect(this._lfoGain);
    this._lfoGain.connect(this._gain.gain);
    this._osc.connect(this._gain);
    this._gain.connect(this.ambientGain);

    this._osc.start(t);
    this._lfo.start(t);
  }

  _stop() {
    this._active = false;
    if (this._gain && this.ctx) {
      this._gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
    setTimeout(() => {
      try { this._osc?.stop(); } catch (_) { /* */ }
      try { this._lfo?.stop(); } catch (_) { /* */ }
      try { this._osc?.disconnect(); } catch (_) { /* */ }
      try { this._lfo?.disconnect(); } catch (_) { /* */ }
      try { this._lfoGain?.disconnect(); } catch (_) { /* */ }
      try { this._gain?.disconnect(); } catch (_) { /* */ }
      this._osc = null;
      this._lfo = null;
      this._lfoGain = null;
      this._gain = null;
    }, 300);
  }
}

export class AudioManager {
  constructor(eventBus, state) {
    this.eventBus = eventBus;
    this.state = state;

    this._ctx = null; // AudioContext, created on first user interaction
    this._masterGain = null;
    this._sfxGain = null;
    this._ambientGain = null;
    this._musicGain = null;

    this._muted = false;
    this._masterVolume = 0.5;
    this._sfxVolume = 0.7;
    this._ambientVolume = 0.4;
    this._musicVolume = 0.3;

    // Active ambient layers (legacy global layers)
    this._ambientNodes = {};

    // Zone-adaptive ambient audio
    this._zoneAmbience = null;

    // Weather sound layer
    this._weatherLayer = null;

    // Critical health alert tone
    this._healthAlert = null;

    // Noise buffer (reusable)
    this._noiseBuffer = null;

    // Cooldown tracking for repeated alerts
    this._lastAlertTime = 0;
    this._alertCooldown = 10000; // 10 seconds between quality alerts

    // Per-domain cooldown for critical health alerts (30s per domain)
    this._domainAlertTimes = new Map();

    this._bindEvents();
  }

  // ── Initialization ──────────────────────────────────────────────

  /**
   * Initialize the AudioContext. Must be called from a user gesture (click/key).
   */
  init() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain chain: sfx/ambient/music -> master -> destination
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = this._masterVolume;
    this._masterGain.connect(this._ctx.destination);

    this._sfxGain = this._ctx.createGain();
    this._sfxGain.gain.value = this._sfxVolume;
    this._sfxGain.connect(this._masterGain);

    this._ambientGain = this._ctx.createGain();
    this._ambientGain.gain.value = this._ambientVolume;
    this._ambientGain.connect(this._masterGain);

    this._musicGain = this._ctx.createGain();
    this._musicGain.gain.value = this._musicVolume;
    this._musicGain.connect(this._masterGain);

    this._noiseBuffer = this._createNoiseBuffer(2);

    this._startAmbientLayers();

    // Initialize zone-adaptive ambient audio
    this._zoneAmbience = new ZoneAmbience(this);
    this._weatherLayer = new WeatherSoundLayer(this);
    this._healthAlert = new HealthAlertTone(this);

    // Switch to current zone immediately
    const currentZone = this.state.currentZone ?? 'field';
    this._zoneAmbience.switchZone(currentZone);
  }

  /**
   * Resume the AudioContext if suspended (browsers require user gesture).
   */
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  // ── Volume Controls ─────────────────────────────────────────────

  setMasterVolume(v) {
    this._masterVolume = Math.max(0, Math.min(1, v));
    if (this._masterGain) {
      this._masterGain.gain.setTargetAtTime(this._masterVolume, this._ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(v) {
    this._sfxVolume = Math.max(0, Math.min(1, v));
    if (this._sfxGain) {
      this._sfxGain.gain.setTargetAtTime(this._sfxVolume, this._ctx.currentTime, 0.05);
    }
  }

  setAmbientVolume(v) {
    this._ambientVolume = Math.max(0, Math.min(1, v));
    if (this._ambientGain) {
      this._ambientGain.gain.setTargetAtTime(this._ambientVolume, this._ctx.currentTime, 0.05);
    }
  }

  setMusicVolume(v) {
    this._musicVolume = Math.max(0, Math.min(1, v));
    if (this._musicGain) {
      this._musicGain.gain.setTargetAtTime(this._musicVolume, this._ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this._muted = !this._muted;
    if (this._masterGain) {
      this._masterGain.gain.setTargetAtTime(
        this._muted ? 0 : this._masterVolume,
        this._ctx.currentTime,
        0.05
      );
    }
    return this._muted;
  }

  get muted() {
    return this._muted;
  }

  // ── Procedural SFX ──────────────────────────────────────────────

  /** Short sine-wave blip for UI clicks. */
  playClick() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.06);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /** Organ arpeggio — money earned / inning end. */
  playCoinSound() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // Quick organ arpeggio: C5-E5-G5-C6 (fast, bright)
    const notes = [
      { freq: 523,  time: 0,    dur: 0.09 },
      { freq: 659,  time: 0.06, dur: 0.09 },
      { freq: 784,  time: 0.12, dur: 0.09 },
      { freq: 1047, time: 0.18, dur: 0.14 },
    ];

    notes.forEach(({ freq, time: offset, dur }) => {
      this._playOrganSfx(t + offset, freq, dur, 0.15);
    });
  }

  /** Rapid beeping — alert / alarm. */
  playAlert() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;

    for (let i = 0; i < 4; i++) {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      const offset = i * 0.12;

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, t + offset);

      gain.gain.setValueAtTime(0.2, t + offset);
      gain.gain.setValueAtTime(0, t + offset + 0.06);

      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    }
  }

  /** Organ chord resolve — repair complete / upgrade done. */
  playRepairComplete() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // Two-chord organ resolve: G major -> C major
    const chord1 = [392, 494, 587]; // G4, B4, D5
    const chord2 = [523, 659, 784]; // C5, E5, G5

    // First chord
    chord1.forEach((freq) => {
      this._playOrganSfx(t, freq, 0.18, 0.12);
    });
    // Second chord (resolving)
    chord2.forEach((freq) => {
      this._playOrganSfx(t + 0.20, freq, 0.25, 0.14);
    });
  }

  /** Harsh buzzer — filter failure / breakdown. */
  playFailure() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;

    // Low sawtooth buzz
    const osc1 = this._ctx.createOscillator();
    const osc2 = this._ctx.createOscillator();
    const gain = this._ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(120, t);
    osc1.frequency.linearRampToValueAtTime(80, t + 0.4);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(125, t);
    osc2.frequency.linearRampToValueAtTime(85, t + 0.4);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this._sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.45);
    osc2.stop(t + 0.45);
  }

  /** Milestone / achievement unlocked — baseball organ fanfare (Charge!). */
  playMilestone() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // "Charge!" fanfare: G4-C5-E5-G5 (rest) E5-G5!
    const notes = [
      { freq: 392,  time: 0,    dur: 0.15 }, // G4
      { freq: 523,  time: 0.16, dur: 0.15 }, // C5
      { freq: 659,  time: 0.32, dur: 0.15 }, // E5
      { freq: 784,  time: 0.48, dur: 0.25 }, // G5 (longer)
      { freq: 659,  time: 0.85, dur: 0.12 }, // E5
      { freq: 784,  time: 1.00, dur: 0.45 }, // G5! (held)
    ];

    notes.forEach(({ freq, time: offset, dur }) => {
      // Layer two oscillators for organ timbre
      this._playOrganSfx(t + offset, freq, dur, 0.20);
    });
  }

  /** Play a short organ-like SFX note (layered sine + detuned sine). */
  _playOrganSfx(time, frequency, duration, volume) {
    const layers = [
      { type: 'sine',     detune:  0,  vol: volume },
      { type: 'sine',     detune:  3,  vol: volume * 0.6 },
      { type: 'sine',     detune: -3,  vol: volume * 0.6 },
      { type: 'triangle', detune:  0,  vol: volume * 0.3 },
    ];

    for (const layer of layers) {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      osc.type = layer.type;
      osc.frequency.setValueAtTime(frequency, time);
      osc.detune.setValueAtTime(layer.detune, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(layer.vol, time + 0.01);
      gain.gain.setValueAtTime(layer.vol, time + duration - 0.04);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(time);
      osc.stop(time + duration + 0.02);
    }
  }

  /** Ascending 3-note chord — satisfying build sound for expansion purchases. */
  playExpansionPurchase() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // C-E-G ascending, square wave, 80ms each
    const notes = [
      { freq: 523, offset: 0,    dur: 0.08 }, // C5
      { freq: 659, offset: 0.08, dur: 0.08 }, // E5
      { freq: 784, offset: 0.16, dur: 0.12 }, // G5 (slightly longer resolve)
    ];
    for (const { freq, offset, dur } of notes) {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + offset);
      gain.gain.setValueAtTime(0.2, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.01);
    }
  }

  /** Quick 2-note descending blip — cash register feel for loans. */
  playLoanTaken() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // A-F descending, triangle wave, 40ms each
    const notes = [
      { freq: 440, offset: 0,    dur: 0.04 }, // A4
      { freq: 349, offset: 0.04, dur: 0.06 }, // F4
    ];
    for (const { freq, offset, dur } of notes) {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + offset);
      gain.gain.setValueAtTime(0.25, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.01);
    }
  }

  /** Slow descending sweep — season ending feel. */
  playSeasonTransition() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  /** Bright 4-note ascending arpeggio — for SOTY milestones. */
  playAchievement() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // C-E-G-C ascending, square wave, 60ms each
    const notes = [
      { freq: 523,  offset: 0,    dur: 0.06 }, // C5
      { freq: 659,  offset: 0.06, dur: 0.06 }, // E5
      { freq: 784,  offset: 0.12, dur: 0.06 }, // G5
      { freq: 1047, offset: 0.18, dur: 0.10 }, // C6
    ];
    for (const { freq, offset, dur } of notes) {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + offset);
      gain.gain.setValueAtTime(0.2, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.01);
    }
  }

  /** Low ominous bass note — menacing Victor encounter. */
  playVictorEncounter() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(85, t + 0.2);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  /** Ascending 2-note chime — positive staff hire sound. */
  playStaffHired() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // D5-A5 ascending, triangle wave, short and warm
    const notes = [
      { freq: 587, offset: 0,    dur: 0.08 }, // D5
      { freq: 880, offset: 0.09, dur: 0.12 }, // A5
    ];
    for (const { freq, offset, dur } of notes) {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + offset);
      gain.gain.setValueAtTime(0.22, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.01);
    }
  }

  /** Descending 2-note blip — staff departure sound. */
  playStaffFired() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // A4-D4 descending, triangle wave, short and subdued
    const notes = [
      { freq: 440, offset: 0,    dur: 0.08 }, // A4
      { freq: 294, offset: 0.09, dur: 0.10 }, // D4
    ];
    for (const { freq, offset, dur } of notes) {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + offset);
      gain.gain.setValueAtTime(0.2, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.01);
    }
  }

  /** Soft single blip — gentle NPC ambient chat sound. */
  playAmbientDialogue() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  /** Sharp crackle — ice crack for pipe freeze events. */
  playPipeFreeze() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;

    // White noise burst (50ms)
    if (this._noiseBuffer) {
      const noise = this._ctx.createBufferSource();
      noise.buffer = this._noiseBuffer;
      const noiseGain = this._ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      noise.connect(noiseGain);
      noiseGain.connect(this._sfxGain);
      noise.start(t);
      noise.stop(t + 0.06);
    }

    // High pitch crackle (1200Hz, 30ms)
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t + 0.03);
    gain.gain.setValueAtTime(0.2, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t + 0.03);
    osc.stop(t + 0.07);
  }

  /** Low rumble — atmospheric weather start sound. */
  playWeatherStart() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(60, t + 0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  /** Quick organ intro riff for events starting — short ascending organ stab. */
  playEventStart() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // Quick ascending organ: C5-E5-G5
    const notes = [
      { freq: 523, time: 0,    dur: 0.10 },
      { freq: 659, time: 0.11, dur: 0.10 },
      { freq: 784, time: 0.22, dur: 0.18 },
    ];

    notes.forEach(({ freq, time: offset, dur }) => {
      this._playOrganSfx(t + offset, freq, dur, 0.18);
    });
  }

  /** Short ascending arpeggio — mini-game repair success. */
  playMiniGameSuccess() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // Quick 3-note ascending: E5-G5-B5, sine wave, bright and rewarding
    const notes = [
      { freq: 659, offset: 0,    dur: 0.07 }, // E5
      { freq: 784, offset: 0.07, dur: 0.07 }, // G5
      { freq: 988, offset: 0.14, dur: 0.10 }, // B5
    ];
    for (const { freq, offset, dur } of notes) {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + offset);
      gain.gain.setValueAtTime(0.25, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.01);
    }
  }

  /** Short descending tone — mini-game repair failure. */
  playMiniGameFailure() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.15);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(t);
    osc.stop(t + 0.19);
  }

  /** Urgent repeating beep — critical domain health alert. */
  playCriticalAlert() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // 3 rapid square-wave beeps at alternating pitches for urgency
    for (let i = 0; i < 3; i++) {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      const offset = i * 0.10;
      osc.type = 'square';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 1000 : 800, t + offset);
      gain.gain.setValueAtTime(0.18, t + offset);
      gain.gain.setValueAtTime(0, t + offset + 0.05);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    }
  }

  /** Short melodic 2-note chime — NPC chat start (doorbell feel). */
  playNpcChat() {
    if (!this._ctx) return;
    const t = this._ctx.currentTime;
    // E5-G5 ascending, sine wave, warm and inviting
    const notes = [
      { freq: 659, offset: 0,    dur: 0.10 }, // E5
      { freq: 784, offset: 0.10, dur: 0.14 }, // G5
    ];
    for (const { freq, offset, dur } of notes) {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + offset);
      gain.gain.setValueAtTime(0.18, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.01);
    }
  }

  // ── Ambient Sound Layers ────────────────────────────────────────

  /**
   * Start persistent ambient sound layers.
   * These run continuously and their volumes are adjusted by game state.
   */
  _startAmbientLayers() {
    this._startCrowdAmbience();
    this._startMachineryHum();
    this._startWaterFlow();
  }

  /** Crowd ambience: layered filtered noise for baseball stadium murmur. */
  _startCrowdAmbience() {
    // Layer 1: Low crowd rumble (the body of the crowd)
    const source1 = this._ctx.createBufferSource();
    source1.buffer = this._noiseBuffer;
    source1.loop = true;

    const lowFilter = this._ctx.createBiquadFilter();
    lowFilter.type = 'bandpass';
    lowFilter.frequency.value = 400;
    lowFilter.Q.value = 0.6;

    // Layer 2: Mid-range chatter
    const source2 = this._ctx.createBufferSource();
    source2.buffer = this._noiseBuffer;
    source2.loop = true;

    const midFilter = this._ctx.createBiquadFilter();
    midFilter.type = 'bandpass';
    midFilter.frequency.value = 1200;
    midFilter.Q.value = 1.0;

    // Slow modulation on mid layer for natural crowd ebb-and-flow
    const crowdLfo = this._ctx.createOscillator();
    crowdLfo.type = 'sine';
    crowdLfo.frequency.value = 0.15; // very slow undulation
    const crowdLfoGain = this._ctx.createGain();
    crowdLfoGain.gain.value = 0.04;
    crowdLfo.connect(crowdLfoGain);

    const midGain = this._ctx.createGain();
    midGain.gain.value = 0.08;
    crowdLfoGain.connect(midGain.gain);

    const lowGain = this._ctx.createGain();
    lowGain.gain.value = 0.12;

    const crowdMaster = this._ctx.createGain();
    crowdMaster.gain.value = 0.15;

    source1.connect(lowFilter);
    lowFilter.connect(lowGain);
    lowGain.connect(crowdMaster);

    source2.connect(midFilter);
    midFilter.connect(midGain);
    midGain.connect(crowdMaster);

    crowdMaster.connect(this._ambientGain);

    source1.start();
    source2.start();
    crowdLfo.start();

    this._ambientNodes.crowd = {
      source: source1, source2,
      lowFilter, midFilter,
      lowGain, midGain,
      crowdLfo, crowdLfoGain,
      gain: crowdMaster,
    };
  }

  /** Machinery hum: low-frequency oscillation for filtration equipment. */
  _startMachineryHum() {
    const osc = this._ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55; // Low A

    // Subtle vibrato
    const lfo = this._ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 2;
    const lfoGain = this._ctx.createGain();
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const gain = this._ctx.createGain();
    gain.gain.value = 0.08;

    osc.connect(gain);
    gain.connect(this._ambientGain);

    osc.start();
    lfo.start();

    this._ambientNodes.machinery = { osc, lfo, lfoGain, gain };
  }

  /** Water flow: filtered white noise for running water through pipes. */
  _startWaterFlow() {
    const source = this._ctx.createBufferSource();
    source.buffer = this._noiseBuffer;
    source.loop = true;

    const filter = this._ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;

    const filter2 = this._ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 6000;
    filter2.Q.value = 0.5;

    const gain = this._ctx.createGain();
    gain.gain.value = 0.06;

    source.connect(filter);
    filter.connect(filter2);
    filter2.connect(gain);
    gain.connect(this._ambientGain);
    source.start();

    this._ambientNodes.water = { source, filter, filter2, gain };
  }

  // ── Context-Sensitive Updates ───────────────────────────────────

  /**
   * Call each frame or periodically to adjust ambient layers
   * based on current game state.
   */
  update(dt) {
    if (!this._ctx) return;

    const crowd = this._ambientNodes.crowd;
    const machinery = this._ambientNodes.machinery;
    const water = this._ambientNodes.water;
    const t = this._ctx.currentTime;

    if (crowd) {
      // Crowd gets louder during game events, on higher reputation
      const repFactor = (this.state.reputation ?? 50) / 100;
      const eventBoost = this.state.activeEvent ? 0.1 : 0;
      const target = 0.08 + repFactor * 0.15 + eventBoost;
      crowd.gain.gain.setTargetAtTime(target, t, 0.5);
    }

    if (machinery) {
      // Machinery louder when more filters are installed, stressed when conditions are low
      const filterCount = this.state.filters?.length ?? 0;
      const avgCondition = this._getAverageFilterCondition();
      const stressFactor = 1 - avgCondition; // higher when filters are degraded
      const target = 0.04 + Math.min(filterCount, 10) * 0.01 + stressFactor * 0.06;
      machinery.gain.gain.setTargetAtTime(target, t, 0.5);

      // Increase vibrato when stressed
      if (machinery.lfoGain) {
        machinery.lfoGain.gain.setTargetAtTime(3 + stressFactor * 8, t, 0.5);
      }
    }

    if (water) {
      // Water flow louder when filters are working
      const filterCount = this.state.filters?.length ?? 0;
      const target = 0.02 + Math.min(filterCount, 10) * 0.008;
      water.gain.gain.setTargetAtTime(target, t, 0.5);
    }

    // Zone ambience: attendance-scaled crowd on field zone
    if (this._zoneAmbience) {
      this._zoneAmbience.cleanup();
      const crowdGain = this._zoneAmbience.crowdGain;
      if (crowdGain) {
        const attendance = this.state.attendancePercent ?? 0;
        const offSeason = this.state.offSeason ?? false;
        const isChampionship = this.state.championshipHosted ?? false;
        const baseVolume = 0.12;

        let targetVol;
        if (offSeason) {
          targetVol = 0;
        } else {
          targetVol = (attendance / 100) * baseVolume;
          if (isChampionship) {
            targetVol *= 1.3;
          }
        }
        crowdGain.gain.setTargetAtTime(targetVol, t, 0.5);
      }
    }

    // Critical health alert tone
    if (this._healthAlert) {
      this._healthAlert.update(this.state.domainHealth);
    }
  }

  // ── Event Bindings ──────────────────────────────────────────────

  _bindEvents() {
    // UI interactions
    this.eventBus.on('ui:click', () => this.playClick());
    this.eventBus.on('ui:openPanel', () => this.playClick());
    this.eventBus.on('ui:closePanel', () => this.playClick());

    // Economy events
    this.eventBus.on('economy:inningEnd', () => this.playCoinSound());

    // Filter events
    this.eventBus.on('filter:added', (f) => {
      this.playRepairComplete();
      if (f && f.domain) {
        const domainNames = { air: 'Air', water: 'Water', hvac: 'HVAC', drainage: 'Drainage' };
        const name = f.componentType
          ? `${domainNames[f.domain] ?? f.domain} ${f.componentType}`
          : `${domainNames[f.domain] ?? f.domain} filter`;
        this.eventBus.emit('ui:message', { text: `\u2713 ${name} installed`, type: 'success' });
      }
    });
    this.eventBus.on('filter:repaired', () => this.playRepairComplete());
    this.eventBus.on('filter:upgraded', () => this.playRepairComplete());
    this.eventBus.on('filter:removed', () => this.playClick());
    this.eventBus.on('filter:broken', () => this.playFailure());

    // Game events
    this.eventBus.on('event:started', () => this.playEventStart());
    this.eventBus.on('event:ended', () => this.playClick());
    this.eventBus.on('game:newDay', () => this.playEventStart());

    // Progression / milestones
    this.eventBus.on('progression:achievement', () => this.playMilestone());
    this.eventBus.on('progression:unlock', () => this.playMilestone());
    this.eventBus.on('progression:expansion', () => this.playMilestone());
    this.eventBus.on('progression:tierChange', (data) => {
      if (data.promoted) this.playMilestone();
      else this.playAlert();
    });

    // Inspection results
    this.eventBus.on('inspection:result', (data) => {
      if (data.grade === 'A' || data.grade === 'B') this.playMilestone();
      else this.playAlert();
    });

    // Reputation changes — small audio cue for significant shifts
    this.eventBus.on('reputation:changed', ({ amount }) => {
      if (amount >= 3) this.playCoinSound();
      else if (amount <= -3) this.playAlert();
    });

    // Win / lose
    this.eventBus.on('game:win', () => this.playMilestone());
    this.eventBus.on('game:lose', () => this.playFailure());

    // R1-R4 feature sounds
    this.eventBus.on('expansion:purchased', () => this.playExpansionPurchase());
    this.eventBus.on('loan:taken', () => this.playLoanTaken());
    this.eventBus.on('season:started', () => this.playSeasonTransition());
    this.eventBus.on('game:stadiumOfTheYear', () => this.playAchievement());
    this.eventBus.on('rival:victorEncounter', () => this.playVictorEncounter());
    this.eventBus.on('npc:ambientDialogue', () => this.playAmbientDialogue());
    this.eventBus.on('event:pipeFreeze', () => this.playPipeFreeze());
    this.eventBus.on('event:weatherStart', () => this.playWeatherStart());

    // Mini-game events
    this.eventBus.on('minigame:success', () => this.playMiniGameSuccess());
    this.eventBus.on('minigame:failure', () => this.playMiniGameFailure());
    this.eventBus.on('minigame:skipped', () => this.playClick());

    // NPC chat
    this.eventBus.on('npc:startChat', () => this.playNpcChat());

    // Critical domain health alerts (with 30s per-domain cooldown)
    this.eventBus.on('consequence:update', ({ scores }) => {
      if (!scores) return;
      const now = Date.now();
      const domainNames = { air: 'Air', water: 'Water', hvac: 'HVAC', drainage: 'Drainage' };
      for (const [domain, score] of Object.entries(scores)) {
        if (score < 20) {
          const lastAlert = this._domainAlertTimes.get(domain) ?? 0;
          if (now - lastAlert >= 30000) {
            this._domainAlertTimes.set(domain, now);
            this.playCriticalAlert();
            this.eventBus.emit('ui:message', {
              text: `\u26a0 CRITICAL: ${domainNames[domain] ?? domain} health at ${Math.floor(score)}%!`,
              type: 'danger',
            });
          }
        }
      }
    });

    // Event ended — notify player when weather/events pass
    this.eventBus.on('event:ended', (ended) => {
      if (ended && ended.name) {
        const isWeather = ended.category === 'weather';
        this.eventBus.emit('ui:message', {
          text: isWeather
            ? `Weather cleared \u2014 ${ended.name} has passed`
            : `${ended.name} has concluded`,
          type: 'info',
        });
      }
    });

    // Expansion purchased — celebration notification
    this.eventBus.on('expansion:purchased', ({ expansion }) => {
      if (expansion && expansion.name) {
        this.eventBus.emit('ui:message', {
          text: `\ud83c\udfd7 ${expansion.name} completed!`,
          type: 'celebration',
        });
      }
    });

    // Staff events
    this.eventBus.on('staff:hired', (staff) => {
      this.playStaffHired();
      this.eventBus.emit('ui:message', { text: `\u2713 Hired ${staff.name}!`, type: 'success' });
    });
    this.eventBus.on('staff:fired', (staff) => {
      this.playStaffFired();
      this.eventBus.emit('ui:message', { text: `${staff.name} has left the team`, type: 'warning' });
    });
    this.eventBus.on('staff:quit', () => this.playStaffFired());
    this.eventBus.on('staff:levelUp', (data) => {
      this.playCoinSound();
      this.eventBus.emit('ui:message', { text: `${data.staff.name} leveled up to ${data.staff.level}!`, type: 'success' });
    });

    // Research events
    this.eventBus.on('research:complete', (data) => this.playMilestone());
    this.eventBus.on('research:started', () => this.playClick());

    // Rival events
    this.eventBus.on('rival:seasonAward', (data) => {
      if (data.winner === 'rival') {
        this.playFailure();
      } else {
        this.playAchievement();
      }
    });
    this.eventBus.on('rival:dominant', () => this.playAlert());

    // Contract breach audio
    this.eventBus.on('contract:breachWarning', () => this.playAlert());

    // Loan repaid
    this.eventBus.on('loan:repaid', () => this.playCoinSound());

    // Season end
    this.eventBus.on('game:seasonEnd', () => this.playSeasonTransition());

    // Quality alerts — warn when filtration efficiency is critically low (with cooldown)
    this.eventBus.on('filtration:quality', (data) => {
      if (data.avgEfficiency < 0.2) {
        const now = Date.now();
        if (now - this._lastAlertTime >= this._alertCooldown) {
          this._lastAlertTime = now;
          this.playAlert();
        }
      }
    });

    // Zone-adaptive ambient audio: switch zone profile on zone change
    this.eventBus.on('zone:changed', ({ to }) => {
      if (this._zoneAmbience) {
        this._zoneAmbience.switchZone(to ?? 'field');
      }
    });

    // Weather sound layers: start overlay on any weather event
    // event:started fires for all events; filter to weather category
    this.eventBus.on('event:started', (evt) => {
      if (this._weatherLayer && evt && evt.category === 'weather') {
        const type = this._mapWeatherType(evt);
        if (type) {
          this._weatherLayer.start(type);
        }
      }
    });

    // Weather sound layers: fade out when weather event ends
    this.eventBus.on('event:ended', (ended) => {
      if (this._weatherLayer && ended && ended.category === 'weather') {
        this._weatherLayer.stop();
      }
    });

    // Game lifecycle
    this.eventBus.on('game:init', () => {
      // Audio init happens on user interaction, not game init
      document.addEventListener('click', () => this.init(), { once: true });
      document.addEventListener('keydown', () => this.init(), { once: true });
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────

  /**
   * Create a buffer filled with white noise.
   */
  _createNoiseBuffer(durationSec) {
    const sampleRate = this._ctx.sampleRate;
    const length = sampleRate * durationSec;
    const buffer = this._ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Get the average condition ratio (0-1) of all installed filters.
   */
  _getAverageFilterCondition() {
    const filters = this.state.filters;
    if (!filters || filters.length === 0) return 1;
    let total = 0;
    for (const f of filters) {
      total += (f.condition ?? f.maxCondition) / (f.maxCondition || 1);
    }
    return total / filters.length;
  }

  /**
   * Map a weather event data object to a weather sound layer type.
   * Returns 'rain', 'wind', 'snow', 'heat', or null.
   */
  _mapWeatherType(data) {
    const name = (data.name || data.type || '').toLowerCase();
    if (name.includes('rain') || name.includes('storm') || name.includes('thunder')) return 'rain';
    if (name.includes('wind') || name.includes('gust') || name.includes('tornado')) return 'wind';
    if (name.includes('snow') || name.includes('blizzard') || name.includes('ice') || name.includes('freeze') || name.includes('cold')) return 'snow';
    if (name.includes('heat') || name.includes('hot') || name.includes('humid') || name.includes('scorch')) return 'heat';
    // Default: if it's a weather event but no match, use wind as generic
    if (data.category === 'weather') return 'wind';
    return null;
  }

  /** Access the music gain node (used by MusicGenerator). */
  get musicGainNode() {
    return this._musicGain;
  }

  /** Access the AudioContext (used by MusicGenerator). */
  get context() {
    return this._ctx;
  }
}
