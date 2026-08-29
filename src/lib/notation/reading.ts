import type { RhythmPattern } from '@/lib/types';

/**
 * ふりがな（口ドラムの読み）。音符の下に置いて、読めるようになったら外す。
 *
 * パターンの vocal は小節ぜんぶの表記なので、ステップとの対応が取れない。
 * ここではグリッドから1ステップぶんの読みを組み立てる。
 */
export function readingAt(pattern: RhythmPattern, step: number): string {
  const on = (lane: keyof RhythmPattern['grid']) => (pattern.grid[lane]?.[step] ?? 0) > 0;
  const kick = on('kick');
  const snare = on('snare');
  const hihat = on('hihat') || on('ride') || on('crash');

  if (kick && snare) return 'ドタ';
  if (kick) return 'ドン';
  if (snare) return 'タン';
  if (on('tom1') || on('tom2')) return 'ドン';
  if (hihat) return 'ツ';
  return '';
}

/**
 * 拍カウント。教則本と同じ「1 と 2 と」の数え方を日本語で出す。
 * 16分が使われていれば「1 え と あ」、3連系は「1 ト ト」。
 */
export function countLabelAt(pattern: RhythmPattern, step: number): string {
  const stepsPerBeat = pattern.resolution / 4;
  const offset = step % stepsPerBeat;
  const beatNumber = String(Math.floor(step / stepsPerBeat) + 1);

  if (pattern.resolution === 12) return offset === 0 ? beatNumber : 'ト';

  const usesSixteenth = Object.values(pattern.grid).some((lane) =>
    lane?.some((v, i) => v > 0 && i % 2 === 1),
  );
  if (usesSixteenth) return offset === 0 ? beatNumber : ['', 'え', 'と', 'あ'][offset];
  if (offset === 0) return beatNumber;
  return offset === 2 ? 'と' : '';
}
