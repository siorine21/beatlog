import { describe, expect, it } from 'vitest';
import {
  addDays,
  bpmSeries,
  errorSeries,
  practiceStreak,
  totalPracticeSec,
  weekStart,
  weeklyTotals,
} from './records';
import type { Attempt, PracticeMode, Session } from '@/lib/types';

const session = (id: string, date: string, mode: PracticeMode = 'home'): Session => ({
  id,
  date,
  mode,
  startedAt: 0,
});

const attempt = (sessionId: string, over: Partial<Attempt> = {}): Attempt => ({
  id: `${sessionId}-${over.drillId ?? 'd'}-${over.bpm ?? 80}`,
  sessionId,
  drillId: 'hihat-only',
  bpm: 80,
  durationSec: 60,
  subjective: 'ok',
  graduated: false,
  ...over,
});

describe('日付の計算', () => {
  it('addDays は月をまたいでも正しい', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('weekStart はその週の月曜を返す', () => {
    expect(weekStart('2026-08-29')).toBe('2026-08-24'); // 土曜 → 月曜
    expect(weekStart('2026-08-24')).toBe('2026-08-24'); // 月曜はそのまま
    expect(weekStart('2026-08-23')).toBe('2026-08-17'); // 日曜は前の月曜
  });
});

describe('practiceStreak', () => {
  it('今日やっていれば今日から数える', () => {
    expect(practiceStreak(['2026-08-29', '2026-08-28', '2026-08-27'], '2026-08-29')).toBe(3);
  });

  it('今日まだでも、昨日までが続いていれば途切れない', () => {
    expect(practiceStreak(['2026-08-28', '2026-08-27'], '2026-08-29')).toBe(2);
  });

  it('2日空いていれば 0', () => {
    expect(practiceStreak(['2026-08-26', '2026-08-25'], '2026-08-29')).toBe(0);
  });

  it('記録がなければ 0', () => {
    expect(practiceStreak([], '2026-08-29')).toBe(0);
  });

  it('同じ日が重複していても1日として数える', () => {
    expect(practiceStreak(['2026-08-29', '2026-08-29', '2026-08-28'], '2026-08-29')).toBe(2);
  });
});

describe('weeklyTotals', () => {
  it('モード別に週ごとの練習時間を積み上げる', () => {
    const sessions = [
      session('s1', '2026-08-25', 'home'),
      session('s2', '2026-08-26', 'air'),
      session('s3', '2026-08-18', 'out'),
    ];
    const attempts = [
      attempt('s1', { durationSec: 120 }),
      attempt('s1', { durationSec: 60, drillId: 'x' }),
      attempt('s2', { durationSec: 180 }),
      attempt('s3', { durationSec: 300 }),
    ];
    const rows = weeklyTotals(attempts, sessions, 3, '2026-08-29');
    const thisWeek = rows.find((r) => r.week === '2026-08-24')!;
    expect(thisWeek).toMatchObject({ home: 180, air: 180, out: 0, total: 360 });
    const lastWeek = rows.find((r) => r.week === '2026-08-17')!;
    expect(lastWeek).toMatchObject({ out: 300, total: 300 });
  });

  it('練習していない週も枠として残る', () => {
    const rows = weeklyTotals([], [], 4, '2026-08-29');
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.total === 0)).toBe(true);
    expect(rows.map((r) => r.week)).toEqual(['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24']);
  });

  it('期間外のセッションは数えない', () => {
    const sessions = [session('old', '2026-01-01')];
    const rows = weeklyTotals([attempt('old', { durationSec: 600 })], sessions, 4, '2026-08-29');
    expect(rows.reduce((sum, r) => sum + r.total, 0)).toBe(0);
  });
});

describe('bpmSeries', () => {
  const sessions = [session('s1', '2026-08-27'), session('s2', '2026-08-28')];

  it('日付順に並べ、同じ日はその日の最高 BPM を採る', () => {
    const attempts = [
      attempt('s1', { bpm: 80 }),
      attempt('s1', { bpm: 90 }),
      attempt('s2', { bpm: 85 }),
    ];
    expect(bpmSeries(attempts, sessions, 'hihat-only')).toEqual([
      { date: '2026-08-27', bpm: 90, graduated: false },
      { date: '2026-08-28', bpm: 85, graduated: false },
    ]);
  });

  it('別のドリルの記録は混ぜない', () => {
    const attempts = [attempt('s1', { drillId: 'other', bpm: 200 }), attempt('s1', { bpm: 80 })];
    expect(bpmSeries(attempts, sessions, 'hihat-only')).toEqual([
      { date: '2026-08-27', bpm: 80, graduated: false },
    ]);
  });

  it('その日に卒業していれば印を残す', () => {
    const attempts = [attempt('s1', { bpm: 90, graduated: true })];
    expect(bpmSeries(attempts, sessions, 'hihat-only')[0].graduated).toBe(true);
  });
});

describe('totalPracticeSec', () => {
  it('全試行の時間を合計する', () => {
    expect(totalPracticeSec([attempt('s1', { durationSec: 60 }), attempt('s1', { durationSec: 90 })])).toBe(150);
  });
});

describe('errorSeries', () => {
  const sessions = [session('s1', '2026-08-27'), session('s2', '2026-08-28')];

  it('判定値のある試行だけを日付順に並べる', () => {
    const attempts = [
      attempt('s1', { meanAbsErrorMs: 40 }),
      attempt('s1', { meanAbsErrorMs: 28 }),
      attempt('s2', {}),
      attempt('s2', { meanAbsErrorMs: 22 }),
    ];
    expect(errorSeries(attempts, sessions, 'hihat-only')).toEqual([
      { date: '2026-08-27', meanAbsErrorMs: 28 },
      { date: '2026-08-28', meanAbsErrorMs: 22 },
    ]);
  });

  it('判定値が無ければ空', () => {
    expect(errorSeries([attempt('s1', {})], sessions, 'hihat-only')).toEqual([]);
  });
});
