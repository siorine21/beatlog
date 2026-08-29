import { describe, expect, it } from 'vitest';
import { graduatedDrillIds, isGraduated } from './graduation';
import { getDrill } from '@/data/drills';

const attempt = (over: Partial<Parameters<typeof isGraduated>[1]> = {}) => ({
  bpm: 90,
  durationSec: 60,
  subjective: 'ok' as const,
  ...over,
});

describe('isGraduated', () => {
  const drill = getDrill('hihat-only')!; // 90BPM / 60秒 / 誤差20ms

  it('BPM と時間を満たせば卒業（判定値が無い場合）', () => {
    expect(isGraduated(drill, attempt())).toBe(true);
  });

  it('BPM が足りなければ卒業しない', () => {
    expect(isGraduated(drill, attempt({ bpm: 80 }))).toBe(false);
  });

  it('時間が足りなければ卒業しない', () => {
    expect(isGraduated(drill, attempt({ durationSec: 45 }))).toBe(false);
  });

  it('判定値があるときは誤差の条件も見る', () => {
    expect(isGraduated(drill, attempt({ meanAbsErrorMs: 18 }))).toBe(true);
    expect(isGraduated(drill, attempt({ meanAbsErrorMs: 25 }))).toBe(false);
  });

  it('判定できないとき、本人が bad と評価したら卒業しない', () => {
    expect(isGraduated(drill, attempt({ subjective: 'bad' }))).toBe(false);
  });

  it('チェックリスト形式は全項目の確認で卒業する', () => {
    const setup = getDrill('setup-grip')!;
    expect(isGraduated(setup, attempt({ bpm: 0, durationSec: 0, checkedAll: true }))).toBe(true);
    expect(isGraduated(setup, attempt({ bpm: 0, durationSec: 0, checkedAll: false }))).toBe(false);
  });
});

describe('graduatedDrillIds', () => {
  it('卒業した試行のドリルIDだけを重複なく返す', () => {
    expect(
      graduatedDrillIds([
        { drillId: 'a', graduated: true },
        { drillId: 'a', graduated: true },
        { drillId: 'b', graduated: false },
        { drillId: 'c', graduated: true },
      ]),
    ).toEqual(['a', 'c']);
  });
});
