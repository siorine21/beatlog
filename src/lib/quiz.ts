import type { RhythmPattern } from '@/lib/types';
import { LANE_ORDER } from '@/lib/lanes';

/**
 * 読譜クイズ（spec.md §3.8）。受動的に眺めるだけでは読めるようにならないので、
 * 能動的に思い出す場を作る。
 *
 * 出題は解放済みレベルのパターンに限る。選択肢が足りないときは、
 * 正解のグリッドを少しだけ動かした「そっくりな別解」を作る。
 * 他レベルのパターンを混ぜないのは、まだ見ていない譜面を選択肢に出さないため。
 */
export type QuizDirection = 'notation-to-grid' | 'grid-to-notation';

export interface QuizQuestion {
  direction: QuizDirection;
  answer: RhythmPattern;
  options: RhythmPattern[];
}

export const OPTION_COUNT = 4;

const gridKey = (pattern: RhythmPattern) =>
  LANE_ORDER.map((lane) => (pattern.grid[lane] ?? []).join('')).join('|');

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 打点をひとつ別の位置に動かした、そっくりなパターンを作る */
export function mutate(pattern: RhythmPattern, random: () => number, suffix: number): RhythmPattern {
  const grid: RhythmPattern['grid'] = {};
  for (const lane of LANE_ORDER) {
    const row = pattern.grid[lane];
    if (row) grid[lane] = [...row];
  }

  // 動かしても分かりやすいレーンから選ぶ
  const candidates = (['kick', 'snare', 'hihat'] as const).filter((lane) =>
    grid[lane]?.some((v) => v > 0),
  );
  if (candidates.length === 0) return { ...pattern, id: `${pattern.id}-v${suffix}`, grid };

  const lane = candidates[Math.floor(random() * candidates.length)];
  const row = grid[lane]!;
  const hits = row.flatMap((v, i) => (v > 0 ? [i] : []));
  const empties = row.flatMap((v, i) => (v > 0 ? [] : [i]));
  if (hits.length === 0 || empties.length === 0) {
    return { ...pattern, id: `${pattern.id}-v${suffix}`, grid };
  }

  row[hits[Math.floor(random() * hits.length)]] = 0;
  row[empties[Math.floor(random() * empties.length)]] = 1;

  return { ...pattern, id: `${pattern.id}-v${suffix}`, name: `${pattern.name}（別解）`, grid };
}

export function buildQuestion(
  pool: RhythmPattern[],
  random: () => number = Math.random,
  direction?: QuizDirection,
): QuizQuestion | null {
  if (pool.length === 0) return null;

  const answer = pool[Math.floor(random() * pool.length)];
  const used = new Set([gridKey(answer)]);
  const options: RhythmPattern[] = [answer];

  // まずは同じ分解能の別パターンから
  for (const candidate of shuffle(
    pool.filter((p) => p.id !== answer.id && p.resolution === answer.resolution),
    random,
  )) {
    if (options.length >= OPTION_COUNT) break;
    const key = gridKey(candidate);
    if (used.has(key)) continue;
    used.add(key);
    options.push(candidate);
  }

  // 足りなければ正解を少し崩したものを作る
  for (let attempt = 0; options.length < OPTION_COUNT && attempt < 40; attempt++) {
    const variant = mutate(answer, random, attempt);
    const key = gridKey(variant);
    if (used.has(key)) continue;
    used.add(key);
    options.push(variant);
  }

  return {
    direction: direction ?? (random() < 0.5 ? 'notation-to-grid' : 'grid-to-notation'),
    answer,
    options: shuffle(options, random),
  };
}
