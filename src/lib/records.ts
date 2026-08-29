import type { Attempt, PracticeMode, Session } from '@/lib/types';

/**
 * 練習記録の集計（spec.md §3.5）。
 * DB には触らない純関数だけを置く。日付は 'YYYY-MM-DD' の文字列で扱う。
 */

/** 'YYYY-MM-DD' を、時差でずれない位置（正午）の Date にする */
function parseDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(date: string, days: number): string {
  const d = parseDate(date);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/** その日を含む週の月曜日 */
export function weekStart(date: string): string {
  const d = parseDate(date);
  const shift = (d.getDay() + 6) % 7; // 月曜を 0 とする
  d.setDate(d.getDate() - shift);
  return formatDate(d);
}

/**
 * 連続練習日数。今日やっていれば今日から、まだなら昨日から数える。
 * air モードも1日として数える（spec.md §3.5）。
 */
export function practiceStreak(practiceDates: Iterable<string>, today: string): number {
  const days = new Set(practiceDates);
  let cursor = days.has(today) ? today : addDays(today, -1);
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** セッションIDから日付とモードを引く表を作る */
export function sessionIndex(sessions: Session[]): Map<string, Session> {
  return new Map(sessions.map((s) => [s.id, s]));
}

export interface WeeklyTotal {
  /** その週の月曜日 */
  week: string;
  home: number;
  out: number;
  air: number;
  total: number;
}

/**
 * 週別の練習時間（秒）をモード別に積み上げる。
 * セッションの経過時間ではなく、実際に取り組んだドリルの時間を足す。
 */
export function weeklyTotals(attempts: Attempt[], sessions: Session[], weeks = 8, today?: string): WeeklyTotal[] {
  const index = sessionIndex(sessions);
  const totals = new Map<string, WeeklyTotal>();

  const ensure = (week: string) => {
    const found = totals.get(week);
    if (found) return found;
    const created: WeeklyTotal = { week, home: 0, out: 0, air: 0, total: 0 };
    totals.set(week, created);
    return created;
  };

  // 直近 weeks 週ぶんの枠を先に作る（練習していない週も棒が立つように）
  const base = today ?? formatDate(new Date());
  for (let i = weeks - 1; i >= 0; i--) ensure(weekStart(addDays(base, -7 * i)));

  for (const attempt of attempts) {
    const session = index.get(attempt.sessionId);
    if (!session) continue;
    const week = weekStart(session.date);
    if (!totals.has(week)) continue; // 期間外
    const row = ensure(week);
    row[session.mode] += attempt.durationSec;
    row.total += attempt.durationSec;
  }

  return [...totals.values()].sort((a, b) => a.week.localeCompare(b.week));
}

export interface BpmPoint {
  date: string;
  bpm: number;
  graduated: boolean;
}

/** ドリル別の BPM 推移。同じ日に複数回やった場合はその日の最高 BPM を採る */
export function bpmSeries(attempts: Attempt[], sessions: Session[], drillId: string): BpmPoint[] {
  const index = sessionIndex(sessions);
  const byDate = new Map<string, BpmPoint>();

  for (const attempt of attempts) {
    if (attempt.drillId !== drillId) continue;
    const session = index.get(attempt.sessionId);
    if (!session) continue;
    const current = byDate.get(session.date);
    if (!current || attempt.bpm > current.bpm) {
      byDate.set(session.date, {
        date: session.date,
        bpm: attempt.bpm,
        graduated: attempt.graduated || (current?.graduated ?? false),
      });
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export const totalPracticeSec = (attempts: Attempt[]): number =>
  attempts.reduce((sum, a) => sum + a.durationSec, 0);

/** 練習した日の一覧（重複なし） */
export const practiceDates = (sessions: Session[]): string[] => [...new Set(sessions.map((s) => s.date))];

export const MODE_LABEL: Record<PracticeMode, string> = {
  home: '自宅',
  out: '外',
  air: '手ぶら',
};
