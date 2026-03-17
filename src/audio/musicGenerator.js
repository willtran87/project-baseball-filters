/**
 * MusicGenerator — Procedural baseball-stadium organ music.
 *
 * Generates classic ballpark organ sounds using Web Audio API oscillators.
 * Layers multiple slightly-detuned sine/triangle waves for authentic organ timbre.
 * Supports different moods that shift based on game state:
 *   - calm:    Between innings, relaxed organ melodies (seventh-inning stretch vibe)
 *   - tense:   Problems detected, urgent minor-key organ riffs
 *   - victory: Triumphant organ fanfare for achievements/wins
 *   - gameday: Upbeat rally organ, crowd-pumping riffs
 */

// Note frequencies (Hz) for three octaves
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61,
  G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51,
  // Minor / flat notes
  Eb3: 155.56, Ab3: 207.65, Bb3: 233.08,
  Eb4: 311.13, Ab4: 415.30, Bb4: 466.16,
  Eb5: 622.25, Ab5: 830.61, Bb5: 932.33,
};

// ── Baseball organ melody patterns ──────────────────────────────────
// Each pattern is 8 steps of eighth notes.

const MELODY_PATTERNS = {
  // Calm: Relaxed organ, seventh-inning stretch feel, gentle waltz-like phrases
  calm: [
    // "Take Me Out" inspired gentle phrase (C major arpeggios)
    ['C5', 'E5', 'G5',  null, 'E5', 'C5', 'G4',  null],
    ['F4', 'A4', 'C5', 'F5', 'C5', 'A4', 'F4',  null],
    ['G4', 'B4', 'D5', 'G5', 'D5', 'B4', 'G4',  null],
    ['C5', 'G4', 'E4', 'G4', 'C5', 'E5', 'C5',  null],
    // Gentle walking phrase
    ['E4', 'F4', 'G4', 'A4', 'G4', 'F4', 'E4',  null],
    ['F4', 'G4', 'A4', 'C5', 'A4', 'G4', 'F4',  null],
    // Peaceful resolution
    ['G4', 'E4', 'C4', 'E4', 'G4', 'C5', 'G4',  null],
    ['C5', null, 'G4', null, 'E4', null, 'C4',  null],
  ],

  // Tense: Minor key, urgent organ stabs, descending chromatic feel
  tense: [
    ['C5', 'Eb5', 'G4', 'C5', 'Eb5', 'G4', 'Eb5', null],
    ['Ab4', 'C5', 'Eb5', 'Ab4', null, 'Eb5', 'C5', null],
    ['Bb4', 'G4', 'Eb4', 'Bb4', 'G4', 'Eb4', null, null],
    ['C4', 'Eb4', 'G4', 'Bb4', 'G4', 'Eb4', 'C4', null],
  ],

  // Victory: Triumphant organ fanfare, big chords, ascending glory
  victory: [
    // Charge! pattern: G-C-E-G-E-G then big finish
    ['G4', 'C5', 'E5', 'G5', null, 'E5', 'G5', null],
    ['C5', 'E5', 'G5', 'C6', null, 'C6', 'G5', null],
    // Triumphant descending resolution
    ['C6', 'G5', 'E5', 'C5', 'E5', 'G5', 'C6', null],
    // Big ascending fanfare finale
    ['C5', 'D5', 'E5', 'G5', 'A5', 'B5', 'C6', null],
    // Victory lap
    ['E5', 'G5', 'C6', 'G5', 'E5', 'G5', 'C6', null],
    ['G5', 'E5', 'C5', 'E5', 'G5', 'C6', 'E6', null],
  ],

  // Gameday: Upbeat rally organ, classic stadium riffs, crowd-pumping energy
  gameday: [
    // Classic organ rally riff (ascending thirds)
    ['C5', 'E5', 'C5', 'E5', 'G5', 'E5', 'G5', null],
    // "Charge!" call
    ['G4', 'C5', 'E5', 'G5', null, 'E5', 'G5', null],
    // Bouncy walking pattern
    ['C5', 'D5', 'E5', 'G5', 'E5', 'D5', 'C5', null],
    // Rally call - punchy ascending
    ['E4', 'G4', 'C5', 'E5', 'C5', 'G4', 'C5', 'E5'],
    // Da-da-da-da-da-DA (six-note rally)
    ['G4', 'G4', 'A4', 'A4', 'B4', 'C5', null, null],
    // Organ flourish
    ['C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'C5', null],
    // Crowd pump pattern
    ['C5', null, 'C5', null, 'E5', null, 'G5', null],
    // Quick ascending run
    ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', null],
  ],
};

// Bass patterns: walking bass organ lines per mood
const BASS_PATTERNS = {
  calm: [
    ['C3', null, 'E3', null, 'G3', null, 'C3', null],
    ['F3', null, 'A3', null, 'C4', null, 'F3', null],
    ['G3', null, 'B3', null, 'D4', null, 'G3', null],
    ['C3', null, 'G3', null, 'E3', null, 'C3', null],
  ],
  tense: [
    ['C3', null, 'Eb3', null, 'G3', null, 'C3', null],
    ['Ab3', null, 'C3', null, 'Eb3', null, 'Ab3', null],
    ['Bb3', null, 'G3', null, 'Eb3', null, 'Bb3', null],
    ['C3', null, 'G3', null, 'Eb3', null, 'C3', null],
  ],
  victory: [
    ['C3', 'C3', 'F3', 'F3', 'G3', 'G3', 'C3', 'C3'],
    ['C3', 'E3', 'G3', 'C4', 'G3', 'E3', 'C3', null],
  ],
  gameday: [
    ['C3', 'C3', 'E3', 'G3', 'C3', 'C3', 'G3', 'E3'],
    ['F3', 'F3', 'A3', 'C4', 'F3', 'F3', 'C4', 'A3'],
    ['G3', 'G3', 'B3', 'D4', 'G3', 'G3', 'D4', 'B3'],
    ['C3', 'E3', 'G3', 'C4', 'C3', 'C3', 'C3', null],
  ],
};

// Tempo (BPM) per mood
const TEMPO = {
  calm: 80,
  tense: 105,
  victory: 130,
  gameday: 145,
};

// Organ registration presets: layers of oscillators for rich organ sound
const ORGAN_REGISTRATIONS = {
  // Melody organ: bright, full, classic ballpark
  melody: [
    { type: 'sine',     detune:  0,  gain: 0.10 },  // fundamental
    { type: 'sine',     detune:  3,  gain: 0.08 },  // slight chorus
    { type: 'sine',     detune: -3,  gain: 0.08 },  // slight chorus
    { type: 'triangle', detune:  0,  gain: 0.04 },  // adds warmth
  ],
  // Bass organ: warm, round
  bass: [
    { type: 'sine',     detune:  0,  gain: 0.12 },
    { type: 'triangle', detune:  2,  gain: 0.06 },
    { type: 'sine',     detune: -2,  gain: 0.06 },
  ],
  // Tense mood: slightly edgier organ
  tenseMelody: [
    { type: 'sine',     detune:  0,  gain: 0.09 },
    { type: 'triangle', detune:  4,  gain: 0.07 },
    { type: 'sine',     detune: -4,  gain: 0.07 },
    { type: 'sawtooth', detune:  0,  gain: 0.015 }, // hint of edge
  ],
};

export class MusicGenerator {
  constructor(audioManager, eventBus, state) {
    this._audioManager = audioManager;
    this._eventBus = eventBus;
    this._state = state;

    this._playing = false;
    this._mood = 'calm';
    this._currentPattern = 0;
    this._bassPattern = 0;
    this._currentStep = 0;
    this._stepTimer = 0;
    this._totalSteps = 0; // tracks total steps for variation

    // Tremolo LFO (shared across organ notes for cohesive vibrato)
    this._tremoloNode = null;
    this._tremoloGain = null;

    this._bindEvents();
  }

  // ── Playback Controls ───────────────────────────────────────────

  start() {
    this._playing = true;
    this._currentPattern = 0;
    this._bassPattern = 0;
    this._currentStep = 0;
    this._stepTimer = 0;
    this._totalSteps = 0;
    this._initTremolo();
  }

  stop() {
    this._playing = false;
    this._cleanupTremolo();
  }

  setMood(mood) {
    if (MELODY_PATTERNS[mood] && mood !== this._mood) {
      this._mood = mood;
      this._currentPattern = 0;
      this._bassPattern = 0;
      this._currentStep = 0;
    }
  }

  get mood() {
    return this._mood;
  }

  get playing() {
    return this._playing;
  }

  // ── Update Loop ─────────────────────────────────────────────────

  update(dt) {
    if (!this._playing) return;

    const ctx = this._audioManager.context;
    if (!ctx) return;

    const bpm = TEMPO[this._mood] || 100;
    const stepDuration = 60 / bpm / 2; // eighth notes

    this._stepTimer += dt;

    if (this._stepTimer >= stepDuration) {
      this._stepTimer -= stepDuration;
      this._playStep(ctx, stepDuration);
      this._advanceStep();
    }

    this._autoMood();
  }

  // ── Tremolo / Vibrato ─────────────────────────────────────────

  _initTremolo() {
    const ctx = this._audioManager.context;
    if (!ctx) return;

    // LFO for organ tremolo effect
    this._tremoloNode = ctx.createOscillator();
    this._tremoloNode.type = 'sine';
    this._tremoloNode.frequency.value = 5.5; // classic organ tremolo rate

    this._tremoloGain = ctx.createGain();
    this._tremoloGain.gain.value = 0.15; // subtle volume wobble

    this._tremoloNode.connect(this._tremoloGain);
    this._tremoloNode.start();
  }

  _cleanupTremolo() {
    if (this._tremoloNode) {
      try { this._tremoloNode.stop(); } catch (e) { /* already stopped */ }
      this._tremoloNode = null;
    }
    this._tremoloGain = null;
  }

  // ── Note Scheduling ─────────────────────────────────────────────

  _playStep(ctx, duration) {
    const melodyPatterns = MELODY_PATTERNS[this._mood];
    const bassPatterns = BASS_PATTERNS[this._mood];
    const musicGain = this._audioManager.musicGainNode;

    if (!musicGain) return;

    const pattern = melodyPatterns[this._currentPattern % melodyPatterns.length];
    const bass = bassPatterns[this._bassPattern % bassPatterns.length];
    const melodyNote = pattern[this._currentStep % pattern.length];
    const bassNote = bass[this._currentStep % bass.length];
    const t = ctx.currentTime;

    // Determine organ registration based on mood
    const melodyReg = this._mood === 'tense'
      ? ORGAN_REGISTRATIONS.tenseMelody
      : ORGAN_REGISTRATIONS.melody;
    const bassReg = ORGAN_REGISTRATIONS.bass;

    // Play melody organ note (layered oscillators for organ timbre)
    if (melodyNote && NOTES[melodyNote]) {
      this._playOrganNote(ctx, musicGain, {
        frequency: NOTES[melodyNote],
        registration: melodyReg,
        time: t,
        duration: duration * 0.85,
      });
    }

    // Play bass organ note
    if (bassNote && NOTES[bassNote]) {
      this._playOrganNote(ctx, musicGain, {
        frequency: NOTES[bassNote],
        registration: bassReg,
        time: t,
        duration: duration * 0.9,
      });
    }
  }

  /**
   * Play an organ note using layered oscillators for rich timbre.
   * Each registration entry creates one oscillator with specified
   * type, detuning, and gain — combined they produce the organ sound.
   */
  _playOrganNote(ctx, destination, { frequency, registration, time, duration }) {
    const attack = 0.015;
    const release = Math.min(0.06, duration * 0.15);
    const sustainEnd = time + duration - release;

    for (const layer of registration) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = layer.type;
      osc.frequency.setValueAtTime(frequency, time);
      osc.detune.setValueAtTime(layer.detune, time);

      // Organ-style envelope: smooth attack, sustained, gentle release
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(layer.gain, time + attack);
      gain.gain.setValueAtTime(layer.gain, sustainEnd);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      // Connect tremolo LFO to gain for vibrato effect
      if (this._tremoloGain) {
        this._tremoloGain.connect(gain.gain);
      }

      osc.connect(gain);
      gain.connect(destination);
      osc.start(time);
      osc.stop(time + duration + 0.02);
    }
  }

  _advanceStep() {
    const melodyPatterns = MELODY_PATTERNS[this._mood];
    const bassPatterns = BASS_PATTERNS[this._mood];
    const pattern = melodyPatterns[this._currentPattern % melodyPatterns.length];

    this._currentStep++;
    this._totalSteps++;

    if (this._currentStep >= pattern.length) {
      this._currentStep = 0;
      this._currentPattern++;
      this._bassPattern++;
      if (this._currentPattern >= melodyPatterns.length) {
        this._currentPattern = 0;
      }
      if (this._bassPattern >= bassPatterns.length) {
        this._bassPattern = 0;
      }
    }
  }

  // ── Auto Mood Detection ─────────────────────────────────────────

  _autoMood() {
    const filters = this._state.filters || [];
    let hasCritical = false;
    for (const f of filters) {
      if (f.condition !== undefined && f.maxCondition) {
        if (f.condition / f.maxCondition < 0.2) {
          hasCritical = true;
          break;
        }
      }
    }

    const hasEvent = !!this._state.activeEvent;

    if (hasCritical) {
      if (this._mood !== 'tense') this.setMood('tense');
    } else if (hasEvent) {
      if (this._mood !== 'gameday') this.setMood('gameday');
    } else if (this._state.reputation >= 80) {
      if (this._mood !== 'victory') this.setMood('victory');
    } else {
      if (this._mood !== 'calm') this.setMood('calm');
    }
  }

  // ── Event Bindings ──────────────────────────────────────────────

  _bindEvents() {
    this._eventBus.on('game:init', () => {
      document.addEventListener('click', () => this.start(), { once: true });
      document.addEventListener('keydown', () => this.start(), { once: true });
    });

    this._eventBus.on('event:started', () => {
      this.setMood('gameday');
    });

    this._eventBus.on('filter:broken', () => {
      this.setMood('tense');
    });

    this._eventBus.on('inspection:result', (data) => {
      if (data.grade === 'A') this.setMood('victory');
      else if (data.grade === 'F') this.setMood('tense');
    });

    this._eventBus.on('progression:tierChange', (data) => {
      if (data.promoted) this.setMood('victory');
    });

    this._eventBus.on('game:win', () => this.setMood('victory'));
    this._eventBus.on('game:lose', () => this.setMood('tense'));
  }
}
