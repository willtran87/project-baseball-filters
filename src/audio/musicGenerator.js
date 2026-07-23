/**
 * MusicGenerator — Procedural baseball-stadium music with selectable soundtracks.
 *
 * Generates music using Web Audio API oscillators — no audio files.
 * Supports 8 soundtracks (organ, chiptune, jazz, marching, synthwave, waltz, diamond, hometown),
 * each with 4 moods that shift based on game state:
 *   - calm:    Between innings, relaxed melodies
 *   - tense:   Problems detected, urgent minor-key riffs
 *   - victory: Triumphant fanfare for achievements/wins
 *   - gameday: Upbeat rally, crowd-pumping energy
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

// ── Soundtrack Definitions ──────────────────────────────────────────

const SOUNDTRACKS = {

  // ── Ballpark Organ (original) ───────────────────────────────────
  organ: {
    name: 'Ballpark Organ',
    tempo: { calm: 80, tense: 105, victory: 130, gameday: 145 },
    registrations: {
      melody: [
        { type: 'sine',     detune:  0,  gain: 0.10 },
        { type: 'sine',     detune:  3,  gain: 0.08 },
        { type: 'sine',     detune: -3,  gain: 0.08 },
        { type: 'triangle', detune:  0,  gain: 0.04 },
      ],
      bass: [
        { type: 'sine',     detune:  0,  gain: 0.12 },
        { type: 'triangle', detune:  2,  gain: 0.06 },
        { type: 'sine',     detune: -2,  gain: 0.06 },
      ],
      tenseMelody: [
        { type: 'sine',     detune:  0,  gain: 0.09 },
        { type: 'triangle', detune:  4,  gain: 0.07 },
        { type: 'sine',     detune: -4,  gain: 0.07 },
        { type: 'sawtooth', detune:  0,  gain: 0.015 },
      ],
    },
    tremolo: { rate: 5.5, depth: 0.15 },
    noteStyle: { attack: 0.015, releaseFactor: 0.15, durationFactor: 0.85 },
    melodyPatterns: {
      calm: [
        ['C5', 'E5', 'G5',  null, 'E5', 'C5', 'G4',  null],
        ['F4', 'A4', 'C5', 'F5', 'C5', 'A4', 'F4',  null],
        ['G4', 'B4', 'D5', 'G5', 'D5', 'B4', 'G4',  null],
        ['C5', 'G4', 'E4', 'G4', 'C5', 'E5', 'C5',  null],
        ['E4', 'F4', 'G4', 'A4', 'G4', 'F4', 'E4',  null],
        ['F4', 'G4', 'A4', 'C5', 'A4', 'G4', 'F4',  null],
        ['G4', 'E4', 'C4', 'E4', 'G4', 'C5', 'G4',  null],
        ['C5', null, 'G4', null, 'E4', null, 'C4',  null],
      ],
      tense: [
        ['C5', 'Eb5', 'G4', 'C5', 'Eb5', 'G4', 'Eb5', null],
        ['Ab4', 'C5', 'Eb5', 'Ab4', null, 'Eb5', 'C5', null],
        ['Bb4', 'G4', 'Eb4', 'Bb4', 'G4', 'Eb4', null, null],
        ['C4', 'Eb4', 'G4', 'Bb4', 'G4', 'Eb4', 'C4', null],
      ],
      victory: [
        ['G4', 'C5', 'E5', 'G5', null, 'E5', 'G5', null],
        ['C5', 'E5', 'G5', 'C6', null, 'C6', 'G5', null],
        ['C6', 'G5', 'E5', 'C5', 'E5', 'G5', 'C6', null],
        ['C5', 'D5', 'E5', 'G5', 'A5', 'B5', 'C6', null],
        ['E5', 'G5', 'C6', 'G5', 'E5', 'G5', 'C6', null],
        ['G5', 'E5', 'C5', 'E5', 'G5', 'C6', 'E6', null],
      ],
      gameday: [
        ['C5', 'E5', 'C5', 'E5', 'G5', 'E5', 'G5', null],
        ['G4', 'C5', 'E5', 'G5', null, 'E5', 'G5', null],
        ['C5', 'D5', 'E5', 'G5', 'E5', 'D5', 'C5', null],
        ['E4', 'G4', 'C5', 'E5', 'C5', 'G4', 'C5', 'E5'],
        ['G4', 'G4', 'A4', 'A4', 'B4', 'C5', null, null],
        ['C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'C5', null],
        ['C5', null, 'C5', null, 'E5', null, 'G5', null],
        ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', null],
      ],
    },
    bassPatterns: {
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
    },
  },

  // ── Chiptune (8-bit retro) ──────────────────────────────────────
  chiptune: {
    name: 'Chiptune',
    tempo: { calm: 90, tense: 120, victory: 150, gameday: 160 },
    registrations: {
      melody: [
        { type: 'square',   detune:  0, gain: 0.08 },
        { type: 'square',   detune:  5, gain: 0.04 },
      ],
      bass: [
        { type: 'triangle', detune:  0, gain: 0.10 },
      ],
      tenseMelody: [
        { type: 'square',   detune:  0, gain: 0.09 },
        { type: 'triangle', detune:  0, gain: 0.05 },
      ],
    },
    tremolo: null,
    noteStyle: { attack: 0.005, releaseFactor: 0.05, durationFactor: 0.70 },
    melodyPatterns: {
      calm: [
        ['C5', null, 'E5', null, 'G5', null, 'C6', null],
        ['G4', null, 'C5', null, 'E5', null, 'G4', null],
        ['F4', null, 'A4', null, 'C5', null, 'F4', null],
        ['E4', null, 'G4', null, 'C5', null, 'E4', null],
        ['C5', 'E5', 'G5', null, 'G5', 'E5', 'C5', null],
        ['G4', 'B4', 'D5', null, 'D5', 'B4', 'G4', null],
      ],
      tense: [
        ['C5', null, 'Eb5', null, 'G4', null, 'C5', null],
        ['Ab4', null, 'C5', null, 'Eb5', null, 'Ab4', null],
        ['Bb4', null, 'G4', null, 'Eb4', null, 'Bb4', null],
        ['C5', 'Eb5', 'C5', null, 'G4', 'Eb4', 'G4', null],
      ],
      victory: [
        ['C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'G5', 'C6'],
        ['E5', 'G5', 'C6', 'E6', null, null, 'C6', 'E6'],
        ['C6', 'G5', 'E5', 'C5', 'E5', 'G5', 'C6', null],
        ['C5', 'D5', 'E5', 'G5', 'C6', 'E6', null, null],
      ],
      gameday: [
        ['C5', 'C5', 'E5', 'E5', 'G5', 'G5', 'C6', null],
        ['G4', 'G4', 'B4', 'B4', 'D5', 'D5', 'G5', null],
        ['C5', 'E5', 'C5', 'G4', 'C5', 'E5', 'G5', null],
        ['E5', 'E5', 'G5', 'G5', 'C6', null, 'G5', null],
        ['C5', null, 'E5', null, 'G5', 'C6', 'G5', 'E5'],
      ],
    },
    bassPatterns: {
      calm: [
        ['C3', null, 'C3', null, 'G3', null, 'G3', null],
        ['F3', null, 'F3', null, 'C3', null, 'C3', null],
        ['G3', null, 'G3', null, 'D3', null, 'D3', null],
        ['C3', null, 'E3', null, 'G3', null, 'C3', null],
      ],
      tense: [
        ['C3', null, 'C3', null, 'Eb3', null, 'G3', null],
        ['Ab3', null, 'Ab3', null, 'Eb3', null, 'C3', null],
        ['Bb3', null, 'Bb3', null, 'G3', null, 'Eb3', null],
      ],
      victory: [
        ['C3', 'C3', 'G3', 'G3', 'C3', 'C3', 'G3', 'G3'],
        ['F3', 'F3', 'C3', 'C3', 'G3', 'G3', 'C3', null],
      ],
      gameday: [
        ['C3', 'C3', 'C3', 'G3', 'C3', 'C3', 'G3', 'C3'],
        ['F3', 'F3', 'F3', 'C3', 'F3', 'F3', 'C3', 'F3'],
        ['G3', 'G3', 'G3', 'D3', 'G3', 'G3', 'D3', 'G3'],
      ],
    },
  },

  // ── Jazz Lounge ─────────────────────────────────────────────────
  jazz: {
    name: 'Jazz Lounge',
    tempo: { calm: 72, tense: 95, victory: 115, gameday: 125 },
    registrations: {
      melody: [
        { type: 'sine',     detune:  0, gain: 0.09 },
        { type: 'sine',     detune:  4, gain: 0.06 },
        { type: 'triangle', detune: -2, gain: 0.04 },
      ],
      bass: [
        { type: 'sine',     detune:  0, gain: 0.10 },
        { type: 'triangle', detune:  0, gain: 0.05 },
      ],
      tenseMelody: [
        { type: 'sine',     detune:  0, gain: 0.08 },
        { type: 'triangle', detune:  5, gain: 0.06 },
        { type: 'sine',     detune: -5, gain: 0.04 },
      ],
    },
    tremolo: { rate: 3.5, depth: 0.08 },
    noteStyle: { attack: 0.03, releaseFactor: 0.25, durationFactor: 0.90 },
    melodyPatterns: {
      calm: [
        ['C4', 'E4', 'G4', 'B4', 'G4', 'E4', 'B4', null],   // Cmaj7
        ['F4', 'A4', 'C5', 'E5', 'C5', 'A4', 'E5', null],   // Fmaj7
        ['G4', 'B4', 'D5', 'F5', 'D5', 'B4', 'F5', null],   // G7
        ['E4', 'G4', 'B4', 'D5', 'B4', 'G4', 'D5', null],   // Em7
        ['A4', 'C5', 'E5', 'G5', 'E5', 'C5', 'G5', null],   // Am7
      ],
      tense: [
        ['C4', 'Eb4', 'G4', 'Bb4', 'G4', 'Eb4', 'Bb4', null],   // Cm7
        ['Ab4', 'C5', 'Eb5', 'G5', 'Eb5', 'C5', 'Ab4', null],
        ['Bb4', 'D5', 'F5', null, 'F5', 'D5', 'Bb4', null],
        ['Eb4', 'G4', 'Bb4', 'Eb5', 'Bb4', 'G4', 'Eb4', null],
      ],
      victory: [
        ['C5', 'E5', 'G5', 'B5', null, 'B5', 'G5', null],
        ['D5', 'F5', 'A5', 'C6', null, 'A5', 'F5', null],
        ['G4', 'B4', 'D5', 'G5', 'B5', 'G5', 'D5', null],
        ['C5', 'E5', 'G5', 'C6', null, null, null, null],
      ],
      gameday: [
        ['C5', 'D5', 'E5', 'G5', 'A5', 'G5', 'E5', null],
        ['F4', 'A4', 'C5', 'E5', 'F5', 'E5', 'C5', null],
        ['G4', 'A4', 'B4', 'D5', 'E5', 'D5', 'B4', null],
        ['C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'C5', 'E5'],
      ],
    },
    bassPatterns: {
      calm: [
        ['C3', 'E3', 'G3', 'A3', 'G3', 'E3', 'D3', null],
        ['F3', 'A3', 'C4', 'A3', 'G3', 'F3', 'E3', null],
        ['G3', 'B3', 'D4', 'B3', 'A3', 'G3', 'F3', null],
        ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', null],
      ],
      tense: [
        ['C3', 'Eb3', 'G3', 'Bb3', 'G3', 'Eb3', 'C3', null],
        ['Ab3', 'Bb3', 'C4', 'Bb3', 'Ab3', 'G3', 'Eb3', null],
        ['Bb3', 'G3', 'Eb3', 'C3', 'Eb3', 'G3', 'Bb3', null],
      ],
      victory: [
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3', 'C3', null],
        ['F3', 'A3', 'C4', 'F3', 'G3', 'B3', 'D4', null],
      ],
      gameday: [
        ['C3', 'D3', 'E3', 'G3', 'A3', 'G3', 'E3', 'D3'],
        ['F3', 'G3', 'A3', 'C4', 'A3', 'G3', 'F3', 'E3'],
        ['G3', 'A3', 'B3', 'D4', 'B3', 'A3', 'G3', 'F3'],
      ],
    },
  },

  // ── Marching Band ───────────────────────────────────────────────
  marching: {
    name: 'Marching Band',
    tempo: { calm: 100, tense: 115, victory: 140, gameday: 155 },
    registrations: {
      melody: [
        { type: 'sawtooth', detune:  0, gain: 0.06 },
        { type: 'triangle', detune:  2, gain: 0.05 },
        { type: 'sine',     detune:  0, gain: 0.04 },
      ],
      bass: [
        { type: 'sawtooth', detune:  0, gain: 0.08 },
        { type: 'sine',     detune:  0, gain: 0.06 },
      ],
      tenseMelody: [
        { type: 'sawtooth', detune:  0, gain: 0.07 },
        { type: 'triangle', detune:  3, gain: 0.05 },
        { type: 'sine',     detune: -3, gain: 0.04 },
      ],
    },
    tremolo: { rate: 4.0, depth: 0.10 },
    noteStyle: { attack: 0.01, releaseFactor: 0.10, durationFactor: 0.75 },
    melodyPatterns: {
      calm: [
        ['C5', 'E5', 'G5', null, 'G5', 'E5', 'C5', null],
        ['F5', 'A5', 'C6', null, 'C6', 'A5', 'F5', null],
        ['G4', 'B4', 'D5', 'G5', null, 'D5', 'B4', null],
        ['C5', null, 'E5', null, 'G5', null, 'C5', null],
      ],
      tense: [
        ['C5', 'Eb5', 'G5', null, 'G5', 'Eb5', 'C5', null],
        ['Ab4', 'C5', 'Eb5', null, 'Eb5', 'C5', 'Ab4', null],
        ['Bb4', 'G4', 'Eb4', null, 'G4', 'Bb4', 'Eb5', null],
      ],
      victory: [
        ['C5', 'C5', 'E5', 'G5', null, 'G5', 'C6', null],
        ['G5', 'E5', 'C5', 'E5', 'G5', 'C6', 'E6', null],
        ['C6', null, 'G5', null, 'E5', null, 'C6', null],
        ['C5', 'E5', 'G5', 'C6', 'E6', null, null, null],
      ],
      gameday: [
        ['C5', 'E5', 'C5', 'G5', 'E5', 'G5', 'C6', null],
        ['G4', 'C5', 'E5', 'G5', null, 'C5', 'E5', null],
        ['F5', 'E5', 'D5', 'C5', 'D5', 'E5', 'F5', null],
        ['C5', 'D5', 'E5', 'G5', 'C6', 'G5', 'E5', null],
      ],
    },
    bassPatterns: {
      calm: [
        ['C3', null, 'G3', null, 'C3', null, 'G3', null],
        ['F3', null, 'C4', null, 'F3', null, 'C4', null],
        ['G3', null, 'D4', null, 'G3', null, 'D4', null],
      ],
      tense: [
        ['C3', null, 'G3', null, 'C3', null, 'Eb3', null],
        ['Ab3', null, 'Eb3', null, 'Ab3', null, 'C3', null],
        ['Bb3', null, 'G3', null, 'Eb3', null, 'Bb3', null],
      ],
      victory: [
        ['C3', 'C3', 'G3', 'G3', 'C3', 'C3', 'G3', 'C4'],
        ['F3', 'F3', 'C4', 'C4', 'G3', 'G3', 'C3', 'C3'],
      ],
      gameday: [
        ['C3', null, 'G3', null, 'C3', null, 'G3', null],
        ['F3', null, 'C4', null, 'F3', null, 'C4', null],
        ['G3', null, 'D4', null, 'G3', null, 'B3', null],
        ['C3', null, 'E3', null, 'G3', null, 'C4', null],
      ],
    },
  },

  // ── Synthwave (80s retro synth) ─────────────────────────────────
  synthwave: {
    name: 'Synthwave',
    tempo: { calm: 85, tense: 100, victory: 120, gameday: 130 },
    registrations: {
      melody: [
        { type: 'sawtooth', detune:  0, gain: 0.05 },
        { type: 'sawtooth', detune:  7, gain: 0.05 },
        { type: 'sawtooth', detune: -7, gain: 0.05 },
        { type: 'triangle', detune:  0, gain: 0.03 },
      ],
      bass: [
        { type: 'sawtooth', detune:  0, gain: 0.08 },
        { type: 'sawtooth', detune:  5, gain: 0.04 },
        { type: 'sine',     detune:  0, gain: 0.06 },
      ],
      tenseMelody: [
        { type: 'sawtooth', detune:  0, gain: 0.06 },
        { type: 'sawtooth', detune:  8, gain: 0.04 },
        { type: 'sawtooth', detune: -8, gain: 0.04 },
        { type: 'triangle', detune:  0, gain: 0.03 },
      ],
    },
    tremolo: { rate: 2.0, depth: 0.20 },
    noteStyle: { attack: 0.04, releaseFactor: 0.30, durationFactor: 0.95 },
    melodyPatterns: {
      calm: [
        ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'G4', 'C5'],
        ['A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'E4', 'A4'],
        ['F4', 'A4', 'C5', 'F5', 'C5', 'A4', 'C5', 'F5'],
        ['G4', 'B4', 'D5', 'G5', 'D5', 'B4', 'D5', 'G5'],
      ],
      tense: [
        ['C4', 'Eb4', 'G4', 'C5', 'G4', 'Eb4', 'G4', 'C5'],
        ['Ab3', 'C4', 'Eb4', 'Ab4', 'Eb4', 'C4', 'Eb4', 'Ab4'],
        ['Bb3', 'Eb4', 'G4', 'Bb4', 'G4', 'Eb4', 'G4', 'Bb4'],
        ['C4', 'Eb4', 'Ab4', 'C5', 'Ab4', 'Eb4', 'C4', null],
      ],
      victory: [
        ['C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'G5', 'C6'],
        ['E5', 'G5', 'B5', 'E6', 'B5', 'G5', 'B5', 'E6'],
        ['G5', 'C6', 'E6', 'C6', 'G5', 'C6', 'E6', null],
      ],
      gameday: [
        ['C5', 'E5', 'G5', 'C6', 'E5', 'G5', 'C6', 'E6'],
        ['A4', 'C5', 'E5', 'A5', 'C5', 'E5', 'A5', 'C6'],
        ['F4', 'A4', 'C5', 'F5', 'A4', 'C5', 'F5', 'A5'],
        ['G4', 'B4', 'D5', 'G5', 'B4', 'D5', 'G5', 'B5'],
      ],
    },
    bassPatterns: {
      calm: [
        ['C3', null, null, 'C3', null, null, 'G3', null],
        ['A3', null, null, 'A3', null, null, 'E3', null],
        ['F3', null, null, 'F3', null, null, 'C3', null],
        ['G3', null, null, 'G3', null, null, 'D3', null],
      ],
      tense: [
        ['C3', null, null, 'C3', null, null, 'G3', null],
        ['Ab3', null, null, 'Ab3', null, null, 'Eb3', null],
        ['Bb3', null, null, 'Bb3', null, null, 'G3', null],
      ],
      victory: [
        ['C3', null, 'C3', null, 'G3', null, 'G3', null],
        ['E3', null, 'E3', null, 'B3', null, 'B3', null],
      ],
      gameday: [
        ['C3', 'C3', null, 'G3', 'C3', 'C3', null, 'G3'],
        ['A3', 'A3', null, 'E3', 'A3', 'A3', null, 'E3'],
        ['F3', 'F3', null, 'C3', 'F3', 'F3', null, 'C3'],
        ['G3', 'G3', null, 'D3', 'G3', 'G3', null, 'D3'],
      ],
    },
  },

  // ── Take Me Out (public domain, 1908 — actual melody in 3/4 waltz) ──
  waltz: {
    name: 'Take Me Out',
    tempo: { calm: 80, tense: 100, victory: 125, gameday: 140 },
    registrations: {
      melody: [
        { type: 'sine',     detune:  0, gain: 0.10 },
        { type: 'sine',     detune:  4, gain: 0.07 },
        { type: 'triangle', detune:  0, gain: 0.05 },
      ],
      bass: [
        { type: 'sine',     detune:  0, gain: 0.12 },
        { type: 'triangle', detune:  0, gain: 0.05 },
      ],
      tenseMelody: [
        { type: 'sine',     detune:  0, gain: 0.09 },
        { type: 'triangle', detune:  5, gain: 0.06 },
        { type: 'sawtooth', detune:  0, gain: 0.01 },
      ],
    },
    tremolo: { rate: 5.0, depth: 0.12 },
    noteStyle: { attack: 0.02, releaseFactor: 0.18, durationFactor: 0.85 },
    melodyPatterns: {
      // Actual "Take Me Out to the Ball Game" chorus melody (1908, public domain)
      calm: [
        ['C5', 'C5', 'A4', 'G4', 'E4', 'G4'],   // "Take me out to the ball"
        ['D5', null, null, null, null, null],       // "game"
        ['C5', 'C5', 'A4', 'G4', 'E4', null],     // "Take me out with the"
        ['D4', null, null, null, null, null],       // "crowd"
        ['A4', 'A4', 'A4', 'B4', 'C5', 'D5'],     // "Buy me some peanuts and"
        ['B4', 'A4', null, 'G4', null, null],       // "Cracker Jack"
        ['A4', 'A4', 'A4', 'B4', 'C5', 'D5'],     // "I don't care if I"
        ['B4', 'G4', null, null, null, null],       // "never get back"
        ['C5', 'C5', 'C5', 'A4', 'D5', null],     // "Let me root root root"
        ['E5', 'D5', 'C5', null, null, null],       // "for the home team"
      ],
      tense: [
        // Minor key variation
        ['C5', 'C5', 'Ab4', 'G4', 'Eb4', 'G4'],
        ['D5', null, null, null, null, null],
        ['C5', 'C5', 'Ab4', 'G4', 'Eb4', null],
        ['D4', null, null, null, null, null],
        ['Ab4', 'Ab4', 'Ab4', 'Bb4', 'C5', 'D5'],
        ['Bb4', 'Ab4', null, 'G4', null, null],
      ],
      victory: [
        // Triumphant octave-up version
        ['C6', 'C6', 'A5', 'G5', 'E5', 'G5'],
        ['D6', null, null, null, null, null],
        ['A5', 'A5', 'A5', 'B5', 'C6', 'D6'],
        ['C6', 'G5', 'E5', 'G5', 'C6', null],
        ['C6', 'C6', 'C6', 'A5', 'D6', null],
        ['E6', 'D6', 'C6', null, null, null],
      ],
      gameday: [
        // Upbeat, fewer rests
        ['C5', 'C5', 'A4', 'G4', 'E4', 'G4'],
        ['D5', null, 'C5', 'C5', 'A4', 'G4'],
        ['E4', null, 'D4', null, null, null],
        ['A4', 'A4', 'A4', 'B4', 'C5', 'D5'],
        ['B4', 'A4', 'G4', 'A4', 'A4', 'A4'],
        ['B4', 'C5', 'D5', 'B4', 'G4', null],
        ['C5', 'C5', 'C5', 'A4', 'D5', null],
        ['E5', 'D5', 'C5', 'E5', 'D5', 'C5'],
      ],
    },
    bassPatterns: {
      calm: [
        // Waltz oom-pah-pah
        ['C3', null, 'G3', null, 'E3', null],
        ['G3', null, 'D4', null, 'B3', null],
        ['C3', null, 'G3', null, 'E3', null],
        ['F3', null, 'C4', null, 'A3', null],
        ['G3', null, 'D4', null, 'G3', null],
        ['C3', null, 'E3', null, 'G3', null],
      ],
      tense: [
        ['C3', null, 'G3', null, 'Eb3', null],
        ['Ab3', null, 'Eb3', null, 'C3', null],
        ['Bb3', null, 'G3', null, 'Eb3', null],
      ],
      victory: [
        ['C3', null, 'G3', 'C3', null, 'G3'],
        ['F3', null, 'C4', 'G3', null, 'D4'],
        ['C3', null, 'E3', null, 'G3', null],
      ],
      gameday: [
        ['C3', 'G3', 'E3', 'C3', 'G3', 'E3'],
        ['F3', 'C4', 'A3', 'F3', 'C4', 'A3'],
        ['G3', 'D4', 'B3', 'G3', 'D4', 'B3'],
        ['C3', 'G3', 'C3', 'G3', 'C3', null],
      ],
    },
  },

  // ── Stadium Classics (Charge!, Three Blind Mice, rally riffs) ───
  diamond: {
    name: 'Stadium Classics',
    tempo: { calm: 90, tense: 110, victory: 135, gameday: 150 },
    registrations: {
      melody: [
        { type: 'sine',     detune:  0, gain: 0.10 },
        { type: 'sine',     detune:  3, gain: 0.08 },
        { type: 'sine',     detune: -3, gain: 0.08 },
        { type: 'triangle', detune:  0, gain: 0.04 },
      ],
      bass: [
        { type: 'sine',     detune:  0, gain: 0.12 },
        { type: 'triangle', detune:  2, gain: 0.06 },
      ],
      tenseMelody: [
        { type: 'sine',     detune:  0, gain: 0.09 },
        { type: 'triangle', detune:  4, gain: 0.07 },
        { type: 'sawtooth', detune:  0, gain: 0.015 },
      ],
    },
    tremolo: { rate: 5.5, depth: 0.15 },
    noteStyle: { attack: 0.015, releaseFactor: 0.15, durationFactor: 0.85 },
    melodyPatterns: {
      calm: [
        // Gentle Charge! variation
        ['G4', null, 'C5', null, 'E5', null, 'G5', null],
        // Three Blind Mice (umpire taunt)
        ['E4', 'D4', 'C4', null, 'E4', 'D4', 'C4', null],
        // Soft organ walk
        ['C4', 'D4', 'E4', 'G4', 'E4', 'D4', 'C4', null],
        // Gentle descending
        ['G4', 'E4', 'C4', 'E4', 'G4', 'C5', 'G4', null],
      ],
      tense: [
        // Minor Charge
        ['G4', null, 'C5', null, 'Eb5', null, 'G5', null],
        // Minor Three Blind Mice
        ['Eb4', 'D4', 'C4', null, 'Eb4', 'D4', 'C4', null],
        // Urgent descending
        ['C5', 'Bb4', 'Ab4', 'G4', 'Ab4', 'Bb4', 'C5', null],
        ['Eb5', 'C5', 'G4', 'Eb4', null, null, null, null],
      ],
      victory: [
        // Full triumphant Charge!
        ['G4', 'C5', 'E5', 'G5', null, 'E5', 'G5', null],
        // Big ascending celebration
        ['C5', 'D5', 'E5', 'G5', 'C6', 'G5', 'E5', null],
        // Victory lap organ
        ['C6', 'G5', 'E5', 'C5', 'E5', 'G5', 'C6', null],
        // "Na na na na" farewell
        ['C5', 'C5', 'C5', 'D5', null, 'E5', 'D5', null],
      ],
      gameday: [
        // Classic Charge! call
        ['G4', 'C5', 'E5', 'G5', null, 'E5', 'G5', null],
        // Da-da-da-da-da-DA rally
        ['G4', 'G4', 'A4', 'A4', 'B4', 'C5', null, null],
        // Let's Go pump
        ['C5', null, 'C5', null, 'E5', null, 'G5', null],
        // Quick ascending flourish
        ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', null],
        // Three Blind Mice (fast, taunting)
        ['E5', 'D5', 'C5', null, 'E5', 'D5', 'C5', null],
        // Rally ascending thirds
        ['C5', 'E5', 'C5', 'E5', 'G5', 'E5', 'G5', null],
      ],
    },
    bassPatterns: {
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
    },
  },

  // ── Saints Go Marchin' (traditional, public domain — actual melody) ──
  hometown: {
    name: "Saints Go Marchin'",
    tempo: { calm: 85, tense: 105, victory: 130, gameday: 150 },
    registrations: {
      melody: [
        { type: 'sine',     detune:  0, gain: 0.09 },
        { type: 'sine',     detune:  5, gain: 0.06 },
        { type: 'sawtooth', detune:  0, gain: 0.02 },
        { type: 'triangle', detune: -3, gain: 0.04 },
      ],
      bass: [
        { type: 'sine',     detune:  0, gain: 0.11 },
        { type: 'triangle', detune:  2, gain: 0.05 },
      ],
      tenseMelody: [
        { type: 'sine',     detune:  0, gain: 0.08 },
        { type: 'sawtooth', detune:  0, gain: 0.03 },
        { type: 'triangle', detune:  4, gain: 0.05 },
      ],
    },
    tremolo: { rate: 3.5, depth: 0.10 },
    noteStyle: { attack: 0.02, releaseFactor: 0.18, durationFactor: 0.85 },
    melodyPatterns: {
      // Actual "When the Saints Go Marching In" melody (traditional, public domain)
      calm: [
        // "Oh when the saints"
        ['C5', 'E5', 'F5', 'G5', null, null, null, null],
        // "go marching in"
        ['C5', 'E5', 'F5', 'G5', null, null, null, null],
        // "Oh when the saints go marching in"
        ['C5', 'E5', 'F5', 'G5', 'F5', 'E5', 'C5', 'E5'],
        // "Oh how I want..."
        ['D5', null, null, 'C5', null, null, null, null],
        // "...to be in that number"
        ['C5', 'E5', 'G5', 'G5', null, 'F5', null, null],
        // "When the saints go marching in"
        ['E5', 'F5', 'G5', 'E5', 'C5', null, 'D5', 'C5'],
      ],
      tense: [
        // Minor key Saints
        ['C5', 'Eb5', 'F5', 'G5', null, null, null, null],
        ['C5', 'Eb5', 'F5', 'G5', null, null, null, null],
        ['C5', 'Eb5', 'F5', 'G5', 'F5', 'Eb5', 'C5', null],
        ['D5', null, null, 'C5', 'Eb5', 'C5', null, null],
      ],
      victory: [
        // Grand triumphant Saints
        ['C5', 'E5', 'F5', 'G5', null, 'G5', 'A5', 'B5'],
        ['C6', null, null, null, null, null, null, null],
        ['C5', 'E5', 'F5', 'G5', 'F5', 'E5', 'G5', 'C6'],
        ['E6', 'D6', 'C6', null, null, null, null, null],
        ['C6', 'E6', 'D6', 'C6', null, 'G5', 'C6', null],
      ],
      gameday: [
        // Uptempo marching Saints
        ['C5', 'E5', 'F5', 'G5', null, 'C5', 'E5', 'F5'],
        ['G5', null, 'G5', null, 'G5', 'F5', 'E5', null],
        ['C5', 'E5', 'F5', 'G5', 'F5', 'E5', 'C5', 'E5'],
        ['D5', 'C5', null, null, 'C5', 'E5', 'G5', null],
        ['E5', 'F5', 'G5', 'E5', 'C5', 'D5', 'C5', null],
      ],
    },
    bassPatterns: {
      calm: [
        // Walking bass for march feel
        ['C3', null, 'E3', null, 'G3', null, 'C3', null],
        ['F3', null, 'A3', null, 'C4', null, 'F3', null],
        ['G3', null, 'B3', null, 'D4', null, 'G3', null],
        ['C3', 'E3', 'G3', null, 'C3', null, null, null],
      ],
      tense: [
        ['C3', null, 'Eb3', null, 'G3', null, 'C3', null],
        ['Ab3', null, 'Eb3', null, 'C3', null, 'Ab3', null],
        ['Bb3', null, 'G3', null, 'Eb3', null, 'Bb3', null],
      ],
      victory: [
        ['C3', 'C3', 'G3', 'G3', 'C3', 'E3', 'G3', 'C4'],
        ['F3', 'F3', 'C4', 'C4', 'G3', 'G3', 'D4', 'D4'],
        ['C3', 'E3', 'G3', 'C4', 'G3', 'E3', 'C3', null],
      ],
      gameday: [
        ['C3', 'C3', 'G3', 'G3', 'C3', 'C3', 'E3', 'G3'],
        ['F3', 'F3', 'C4', 'C4', 'F3', 'F3', 'A3', 'C4'],
        ['G3', 'G3', 'D4', 'D4', 'G3', 'G3', 'B3', 'D4'],
        ['C3', 'E3', 'G3', 'C4', 'C3', 'C3', 'C3', null],
      ],
    },
  },
};

// ── MusicGenerator Class ────────────────────────────────────────────

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

    // Soundtrack selection
    this._soundtrackId = 'organ';
    this._soundtrack = SOUNDTRACKS.organ;

    // Tremolo LFO (shared across organ notes for cohesive vibrato)
    this._tremoloNode = null;
    this._tremoloGain = null;

    this._bindEvents();
  }

  // ── Soundtrack Selection ────────────────────────────────────────

  /**
   * Returns list of { id, name } for UI enumeration.
   */
  static get SOUNDTRACK_LIST() {
    return Object.entries(SOUNDTRACKS).map(([id, s]) => ({ id, name: s.name }));
  }

  get soundtrackId() {
    return this._soundtrackId;
  }

  setSoundtrack(id) {
    if (!SOUNDTRACKS[id] || id === this._soundtrackId) return;
    this._soundtrackId = id;
    this._soundtrack = SOUNDTRACKS[id];
    this._currentPattern = 0;
    this._bassPattern = 0;
    this._currentStep = 0;
    this._cleanupTremolo();
    if (this._playing) this._initTremolo();
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
    if (this._soundtrack.melodyPatterns[mood] && mood !== this._mood) {
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

    const bpm = this._soundtrack.tempo[this._mood] || 100;
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

    const tremolo = this._soundtrack.tremolo;
    if (!tremolo) {
      // Soundtrack has no tremolo (e.g. chiptune)
      this._tremoloNode = null;
      this._tremoloGain = null;
      return;
    }

    // LFO for tremolo effect
    this._tremoloNode = ctx.createOscillator();
    this._tremoloNode.type = 'sine';
    this._tremoloNode.frequency.value = tremolo.rate;

    this._tremoloGain = ctx.createGain();
    this._tremoloGain.gain.value = tremolo.depth;

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
    const st = this._soundtrack;
    const melodyPatterns = st.melodyPatterns[this._mood];
    const bassPatterns = st.bassPatterns[this._mood];
    const noteStyle = st.noteStyle;
    const musicGain = this._audioManager.musicGainNode;

    if (!musicGain) return;

    const pattern = melodyPatterns[this._currentPattern % melodyPatterns.length];
    const bass = bassPatterns[this._bassPattern % bassPatterns.length];
    const melodyNote = pattern[this._currentStep % pattern.length];
    const bassNote = bass[this._currentStep % bass.length];
    const t = ctx.currentTime;

    // Determine registration based on mood
    const melodyReg = this._mood === 'tense'
      ? st.registrations.tenseMelody
      : st.registrations.melody;
    const bassReg = st.registrations.bass;

    // Play melody note (layered oscillators)
    if (melodyNote && NOTES[melodyNote]) {
      this._playOrganNote(ctx, musicGain, {
        frequency: NOTES[melodyNote],
        registration: melodyReg,
        time: t,
        duration: duration * (noteStyle.durationFactor ?? 0.85),
        attack: noteStyle.attack,
        releaseFactor: noteStyle.releaseFactor,
      });
    }

    // Play bass note
    if (bassNote && NOTES[bassNote]) {
      this._playOrganNote(ctx, musicGain, {
        frequency: NOTES[bassNote],
        registration: bassReg,
        time: t,
        duration: duration * 0.9,
        attack: noteStyle.attack,
        releaseFactor: noteStyle.releaseFactor,
      });
    }
  }

  /**
   * Play a note using layered oscillators for rich timbre.
   * Each registration entry creates one oscillator with specified
   * type, detuning, and gain — combined they produce the sound.
   */
  _playOrganNote(ctx, destination, { frequency, registration, time, duration, attack: atk, releaseFactor: relF }) {
    const attack = atk ?? 0.015;
    const release = Math.min(0.06, duration * (relF ?? 0.15));
    const sustainEnd = time + duration - release;

    for (const layer of registration) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = layer.type;
      osc.frequency.setValueAtTime(frequency, time);
      osc.detune.setValueAtTime(layer.detune, time);

      // Envelope: attack, sustain, release
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
    const st = this._soundtrack;
    const melodyPatterns = st.melodyPatterns[this._mood];
    const bassPatterns = st.bassPatterns[this._mood];
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
