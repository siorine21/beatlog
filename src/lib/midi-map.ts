import type { Lane } from './types';

/**
 * General MIDI のドラムマップ。多くの電子ドラムがこの割り当てで送ってくる。
 * 機種によって異なるため、設定画面で変更できる（spec.md §6.3）。
 */
export const DEFAULT_MIDI_NOTE_MAP: Record<number, Lane> = {
  36: 'kick',
  38: 'snare',
  40: 'snare',
  42: 'hihat',
  44: 'hihat',
  46: 'hihat',
  45: 'tom2',
  48: 'tom1',
  49: 'crash',
  51: 'ride',
};
