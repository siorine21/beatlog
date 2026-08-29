import { describe, expect, it } from 'vitest';
import { accuracyOf, expectedFrom, histogram, judge, matchHit, median, rushLabel, summarize } from './judge';
import type { ExpectedHit, HitEvent } from './judge';

/** 120BPM の4分（1ステップ0.5秒）で、0.5秒ごとに鳴るべき打点 */
const expected: ExpectedHit[] = [0, 0.5, 1, 1.5].map((time, step) => ({
  time,
  step,
  lanes: null,
}));
const options = { stepDurationSec: 0.5, calibrationOffsetMs: 0 };
const hit = (time: number, over: Partial<HitEvent> = {}): HitEvent => ({
  time,
  velocity: 100,
  ...over,
});

describe('matchHit', () => {
  it('いちばん近い打点に合わせ、走りは負、もたりは正になる', () => {
    expect(matchHit(hit(0.49), expected, options)?.offsetMs).toBeCloseTo(-10);
    expect(matchHit(hit(0.52), expected, options)?.offsetMs).toBeCloseTo(20);
  });

  it('キャリブレーション値を引く', () => {
    // 入力が 15ms 遅れて届く端末なら、15ms 遅い打点がちょうどになる
    expect(
      matchHit(hit(0.515), expected, { ...options, calibrationOffsetMs: 15 })?.offsetMs,
    ).toBeCloseTo(0);
  });

  it('半ステップを超えるズレは余分な打点として扱う（null）', () => {
    // 打点が疎なとき（1拍目と3拍目のバスドラなど）に効く判定。
    // 16分刻み（1ステップ0.25秒）なら許容は125ms
    const sparse: ExpectedHit[] = [
      { time: 0, step: 0, lanes: null },
      { time: 1, step: 8, lanes: null },
    ];
    const opts = { stepDurationSec: 0.25, calibrationOffsetMs: 0 };
    expect(matchHit(hit(0.2), sparse, opts)).toBeNull();
    expect(matchHit(hit(0.1), sparse, opts)).not.toBeNull();
  });

  it('パッドが取れているときは、そのレーンの打点だけを見る', () => {
    const lanes: ExpectedHit[] = [
      { time: 0, step: 0, lanes: ['kick'] },
      { time: 0.25, step: 2, lanes: ['snare'] },
    ];
    const opts = { stepDurationSec: 0.25, calibrationOffsetMs: 0 };
    // スネアの打点は、時間的に近いキックではなくスネアに合わせる
    expect(matchHit(hit(0.26, { pad: 'snare' }), lanes, opts)?.step).toBe(2);
    expect(matchHit(hit(0.02, { pad: 'kick' }), lanes, opts)?.step).toBe(0);
  });

  it('該当するレーンの打点が無ければ余分な打点になる', () => {
    const lanes: ExpectedHit[] = [{ time: 0, step: 0, lanes: ['kick'] }];
    expect(matchHit(hit(0.01, { pad: 'crash' }), lanes, options)).toBeNull();
  });
});

describe('summarize', () => {
  it('平均・平均絶対誤差・標準偏差を出す', () => {
    const s = summarize([-10, 10, -10, 10]);
    expect(s.meanOffsetMs).toBe(0);
    expect(s.meanAbsErrorMs).toBe(10);
    expect(s.stdDevMs).toBe(10);
    expect(s.hitCount).toBe(4);
  });

  it('平均が0でもバラつきは標準偏差に出る', () => {
    const tight = summarize([-2, 2, -2, 2]);
    const loose = summarize([-40, 40, -40, 40]);
    expect(tight.meanOffsetMs).toBe(loose.meanOffsetMs);
    expect(loose.stdDevMs).toBeGreaterThan(tight.stdDevMs);
  });

  it('打点が無ければすべて0', () => {
    expect(summarize([])).toMatchObject({ hitCount: 0, meanAbsErrorMs: 0, stdDevMs: 0 });
  });
});

describe('judge', () => {
  it('走らせれば負、もたらせれば正の平均になる', () => {
    const rushed = judge([hit(-0.02), hit(0.48), hit(0.98), hit(1.47)], expected, options);
    expect(rushed.meanOffsetMs).toBeLessThan(0);

    const dragged = judge([hit(0.03), hit(0.52), hit(1.02), hit(1.53)], expected, options);
    expect(dragged.meanOffsetMs).toBeGreaterThan(0);
  });

  it('余分な打点は平均に入れず、別に数える', () => {
    const sparse: ExpectedHit[] = [
      { time: 0, step: 0, lanes: null },
      { time: 1, step: 8, lanes: null },
    ];
    const opts = { stepDurationSec: 0.25, calibrationOffsetMs: 0 };
    const result = judge([hit(0.0), hit(0.4), hit(1.0)], sparse, opts);
    expect(result.hitCount).toBe(2);
    expect(result.extraHits).toBe(1);
    expect(result.meanAbsErrorMs).toBe(0);
  });
});

describe('表示の目安', () => {
  it('spec.md §6.2 の区分', () => {
    expect(accuracyOf(12)).toBe('excellent');
    expect(accuracyOf(15)).toBe('excellent');
    expect(accuracyOf(30)).toBe('good');
    expect(accuracyOf(50)).toBe('practicing');
    expect(accuracyOf(51)).toBe('slow-down');
  });

  it('走り／もたりのラベル', () => {
    expect(rushLabel(-30)).toBe('走り');
    expect(rushLabel(-10)).toBe('やや走り');
    expect(rushLabel(0)).toBe('ぴったり');
    expect(rushLabel(10)).toBe('ややもたり');
    expect(rushLabel(30)).toBe('もたり');
  });
});

describe('histogram', () => {
  it('0ms を中央にして振り分ける', () => {
    expect(histogram([0, 0, 0], 20, 7)).toEqual([0, 0, 0, 3, 0, 0, 0]);
    expect(histogram([-20], 20, 7)).toEqual([0, 0, 1, 0, 0, 0, 0]);
    expect(histogram([20], 20, 7)).toEqual([0, 0, 0, 0, 1, 0, 0]);
  });

  it('範囲外は両端に寄せる', () => {
    expect(histogram([-999, 999], 20, 7)).toEqual([1, 0, 0, 0, 0, 0, 1]);
  });
});

describe('expectedFrom', () => {
  const scheduled = [0, 1, 2, 3].map((step) => ({ step, time: step * 0.25 }));

  it('パターンが無ければ全ステップが打点になる', () => {
    expect(expectedFrom(scheduled)).toHaveLength(4);
    expect(expectedFrom(scheduled)[0].lanes).toBeNull();
  });

  it('パターンがあれば、打点のあるステップだけをレーン付きで返す', () => {
    const result = expectedFrom(scheduled, { kick: [1, 0, 0, 0], hihat: [1, 0, 1, 0] });
    expect(result.map((e) => e.step)).toEqual([0, 2]);
    expect(result[0].lanes).toEqual(['kick', 'hihat']);
    expect(result[1].lanes).toEqual(['hihat']);
  });
});

describe('median', () => {
  it('奇数個は真ん中', () => {
    expect(median([10, 30, 20])).toBe(20);
  });

  it('偶数個は中央2つの平均', () => {
    expect(median([10, 20, 30, 40])).toBe(25);
  });

  it('外れ値に引っぱられない', () => {
    expect(median([18, 20, 22, 500])).toBe(21);
  });

  it('空なら0', () => {
    expect(median([])).toBe(0);
  });
});
