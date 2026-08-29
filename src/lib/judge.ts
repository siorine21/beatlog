import type { Lane } from '@/lib/types';

/**
 * タイミング判定（spec.md §6.2）。
 *
 *   offset = hitTime - nearestScheduledTime - calibrationOffset
 *
 * 負なら走り、正ならもたり。1ステップの半分を超えるズレは
 * 「余分な打点」として別に数え、平均には入れない。
 * これが効くのは打点が疎なとき（1拍目と3拍目のバスドラなど）で、
 * 全ステップに打点があるパターンでは、どの打点も必ず半ステップ以内に収まる。
 *
 * 時刻はすべて AudioContext 基準の秒で受け取る。performance.now() 基準の
 * MIDI の時刻は midi.ts の perfToAudio で変換してから渡すこと（spec.md §6.3）。
 */

export interface HitEvent {
  /** AudioContext 時刻（秒） */
  time: number;
  /** 0-127 */
  velocity: number;
  /** マイク入力では取れないので undefined */
  pad?: Lane;
}

/** そのステップで鳴るべき打点 */
export interface ExpectedHit {
  time: number;
  step: number;
  /** null はレーンを問わない（単打・ルーディメンツ系） */
  lanes: Lane[] | null;
}

export interface JudgeOptions {
  /** 1ステップの長さ（秒）。この半分を超えるズレは余分な打点とする */
  stepDurationSec: number;
  /** キャリブレーションで求めた入力遅延（ミリ秒） */
  calibrationOffsetMs: number;
}

export interface Match {
  offsetMs: number;
  step: number;
}

/**
 * 打点を、鳴るべきだった時刻に突き合わせる。
 * 近い打点が無ければ null（＝余分な打点）。
 */
export function matchHit(
  hit: HitEvent,
  expected: ExpectedHit[],
  { stepDurationSec, calibrationOffsetMs }: JudgeOptions,
): Match | null {
  const limitMs = (stepDurationSec * 1000) / 2;

  let best: { offsetMs: number; step: number } | null = null;
  for (const candidate of expected) {
    // パッドの種類が取れているときは、そのレーンで鳴るべきだった打点だけを見る
    if (hit.pad && candidate.lanes && !candidate.lanes.includes(hit.pad)) continue;
    const offsetMs = (hit.time - candidate.time) * 1000 - calibrationOffsetMs;
    if (!best || Math.abs(offsetMs) < Math.abs(best.offsetMs)) {
      best = { offsetMs, step: candidate.step };
    }
  }

  if (!best || Math.abs(best.offsetMs) > limitMs) return null;
  return best;
}

export interface JudgeSummary {
  hitCount: number;
  /** 負=走り, 正=もたり */
  meanOffsetMs: number;
  meanAbsErrorMs: number;
  stdDevMs: number;
  /** 半ステップを超えてズレた打点の数 */
  extraHits: number;
}

export function summarize(offsets: number[], extraHits = 0): JudgeSummary {
  if (offsets.length === 0) {
    return { hitCount: 0, meanOffsetMs: 0, meanAbsErrorMs: 0, stdDevMs: 0, extraHits };
  }
  const mean = offsets.reduce((sum, v) => sum + v, 0) / offsets.length;
  const meanAbs = offsets.reduce((sum, v) => sum + Math.abs(v), 0) / offsets.length;
  const variance = offsets.reduce((sum, v) => sum + (v - mean) ** 2, 0) / offsets.length;
  return {
    hitCount: offsets.length,
    meanOffsetMs: mean,
    meanAbsErrorMs: meanAbs,
    stdDevMs: Math.sqrt(variance),
    extraHits,
  };
}

/** まとめて判定する（テストと、あとから振り返るとき用） */
export function judge(
  hits: HitEvent[],
  expected: ExpectedHit[],
  options: JudgeOptions,
): JudgeSummary & { offsets: number[] } {
  const offsets: number[] = [];
  let extra = 0;

  for (const hit of hits) {
    const match = matchHit(hit, expected, options);
    if (match) offsets.push(match.offsetMs);
    else extra += 1;
  }

  return { ...summarize(offsets, extra), offsets };
}

/**
 * 予約済みのステップ列から「鳴るべき打点」を組み立てる。
 * パターンがあればレーンごとの打点、無ければ全ステップ（単打・ルーディメンツ系）。
 */
export function expectedFrom(
  scheduled: readonly { step: number; time: number }[],
  grid?: Partial<Record<Lane, number[]>>,
): ExpectedHit[] {
  if (!grid) return scheduled.map(({ step, time }) => ({ step, time, lanes: null }));

  const lanesAt = (step: number) =>
    (Object.keys(grid) as Lane[]).filter((lane) => (grid[lane]?.[step] ?? 0) > 0);

  const expected: ExpectedHit[] = [];
  for (const { step, time } of scheduled) {
    const lanes = lanesAt(step);
    if (lanes.length > 0) expected.push({ step, time, lanes });
  }
  return expected;
}

/** 中央値。外れ値に強いので、キャリブレーションはこれを採る（spec.md §6.3） */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** spec.md §6.2 の評価の目安 */
export type Accuracy = 'excellent' | 'good' | 'practicing' | 'slow-down';

export function accuracyOf(meanAbsErrorMs: number): Accuracy {
  if (meanAbsErrorMs <= 15) return 'excellent';
  if (meanAbsErrorMs <= 30) return 'good';
  if (meanAbsErrorMs <= 50) return 'practicing';
  return 'slow-down';
}

export const ACCURACY_LABEL: Record<Accuracy, string> = {
  excellent: '優秀',
  good: '良好',
  practicing: '練習中',
  'slow-down': 'テンポを落とす',
};

/** 走り／もたりの表示 */
export function rushLabel(offsetMs: number): string {
  if (offsetMs <= -20) return '走り';
  if (offsetMs < -5) return 'やや走り';
  if (offsetMs >= 20) return 'もたり';
  if (offsetMs > 5) return 'ややもたり';
  return 'ぴったり';
}

/** 分布のヒストグラム。中央を0msとして左右に振り分ける */
export function histogram(offsets: number[], binMs = 20, bins = 7): number[] {
  const counts = new Array<number>(bins).fill(0);
  const center = Math.floor(bins / 2);
  for (const offset of offsets) {
    const index = Math.max(0, Math.min(bins - 1, center + Math.round(offset / binMs)));
    counts[index] += 1;
  }
  return counts;
}
