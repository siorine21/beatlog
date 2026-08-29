import { describe, expect, it } from 'vitest';
import { buildQuestion, mutate, OPTION_COUNT } from './quiz';
import { patterns, getPattern } from '@/data/patterns';

/** 決まった順で数を返す。テストを再現可能にする */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
}

const unlocked = (level: number) => patterns.filter((p) => p.level <= level);

describe('buildQuestion', () => {
  it('解放済みパターンが無ければ出題しない', () => {
    expect(buildQuestion([], seeded(1))).toBeNull();
  });

  it('選択肢は4つで、必ず正解を含む', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = buildQuestion(unlocked(5), seeded(seed))!;
      expect(q.options).toHaveLength(OPTION_COUNT);
      expect(q.options.some((o) => o.id === q.answer.id)).toBe(true);
    }
  });

  it('選択肢のグリッドはすべて異なる', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = buildQuestion(unlocked(5), seeded(seed))!;
      const keys = q.options.map((o) => JSON.stringify(o.grid));
      expect(new Set(keys).size).toBe(q.options.length);
    }
  });

  it('解放済みパターンが1つしかなくても、崩した別解で4つ揃える', () => {
    const q = buildQuestion(unlocked(2).slice(0, 1), seeded(7))!;
    expect(q.options).toHaveLength(OPTION_COUNT);
    expect(q.options.filter((o) => o.id === q.answer.id)).toHaveLength(1);
  });

  it('出題は渡したパターンの中からしか選ばない', () => {
    const pool = unlocked(3);
    for (let seed = 1; seed <= 20; seed++) {
      const q = buildQuestion(pool, seeded(seed))!;
      expect(pool.some((p) => p.id === q.answer.id)).toBe(true);
    }
  });

  it('両方向の出題ができる', () => {
    const pool = unlocked(5);
    expect(buildQuestion(pool, seeded(3), 'notation-to-grid')!.direction).toBe('notation-to-grid');
    expect(buildQuestion(pool, seeded(3), 'grid-to-notation')!.direction).toBe('grid-to-notation');
  });
});

describe('mutate', () => {
  it('打点の数は変えずに位置だけ動かす', () => {
    const source = getPattern('eight-beat-basic')!;
    const variant = mutate(source, seeded(11), 0);
    const count = (p: typeof source) =>
      Object.values(p.grid).reduce((sum, row) => sum + row!.filter((v) => v > 0).length, 0);
    expect(count(variant)).toBe(count(source));
    expect(variant.grid).not.toEqual(source.grid);
  });

  it('元のパターンを書き換えない', () => {
    const source = getPattern('eight-beat-basic')!;
    const before = JSON.stringify(source.grid);
    mutate(source, seeded(5), 0);
    expect(JSON.stringify(source.grid)).toBe(before);
  });
});
