import type { RhythmPattern } from '@/lib/types';
import { lanesOf } from '@/lib/lanes';
import { buildNotation } from './layout';

/**
 * その譜面に実際に出てくる記号を求める純関数。
 * 返す ID は src/data/notation-symbols.ts のものと同じで、説明文はそちらを唯一の出所とする。
 */
export function usedSymbolIds(pattern: RhythmPattern): string[] {
  const layout = buildNotation(pattern);
  const found = new Set<string>();

  for (const lane of lanesOf(pattern.grid)) {
    found.add(lane === 'hihat' || lane === 'ride' || lane === 'crash' ? 'notehead-cross' : 'notehead-round');
  }

  const handsUsed = layout.hands.beats.some((b) => b.items.some((i) => i.kind === 'note'));
  const feetUsed = layout.feet.beats.some((b) => b.items.some((i) => i.kind === 'note'));
  if (handsUsed && feetUsed) found.add('stem-direction');

  for (const voice of [layout.hands, layout.feet]) {
    for (const beat of voice.beats) {
      if (beat.triplet) found.add('triplet');
      for (const item of beat.items) {
        if (item.kind === 'rest') {
          found.add(item.duration >= layout.stepsPerBeat ? 'quarter-rest' : 'eighth-rest');
          continue;
        }
        if (item.beams === 0) found.add('quarter-note');
        else if (item.beams >= 2) found.add('sixteenth');
        else if (layout.stepsPerBeat !== 3) found.add('eighth-beam');
      }
    }
  }

  // 五線とクレフは常に出ている
  found.add('staff-clef');

  return [...found];
}
