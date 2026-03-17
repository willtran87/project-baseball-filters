/**
 * Sound effect definitions.
 *
 * Maps sound names to audio file paths and playback settings.
 * Audio files will be loaded on demand.
 */

export const SOUND_DEFS = {
  filter_place:   { src: 'assets/audio/place.wav',   volume: 0.6 },
  filter_break:   { src: 'assets/audio/break.wav',   volume: 0.8 },
  filter_repair:  { src: 'assets/audio/repair.wav',  volume: 0.5 },
  money_gain:     { src: 'assets/audio/coin.wav',    volume: 0.4 },
  event_start:    { src: 'assets/audio/alert.wav',   volume: 0.7 },
  achievement:    { src: 'assets/audio/achieve.wav',  volume: 0.8 },
  ui_click:       { src: 'assets/audio/click.wav',   volume: 0.3 },
};
