import { db, getSettings, today, updateSettings } from './db';
import { computeUnlockedLevel } from '@/data/levels';
import { getDrill } from '@/data/drills';
import { generateMenu } from './menu';
import { graduatedDrillIds, isGraduated, type GraduationInput } from './graduation';
import type { Attempt, DailyMenu, PracticeMode, Session } from './types';

/**
 * IndexedDB への読み書き。ブラウザでのみ読み込むこと（静的エクスポート時に評価させない）。
 * 集計や判定のロジックはここに書かず、純関数（menu.ts / records.ts / graduation.ts）に置く。
 */

const newId = () => crypto.randomUUID();

export interface History {
  sessions: Session[];
  attempts: Attempt[];
}

export async function loadHistory(): Promise<History> {
  const [sessions, attempts] = await Promise.all([db.sessions.toArray(), db.attempts.toArray()]);
  return { sessions, attempts };
}

/** ドリルIDごとに、新しい順で試行をまとめる */
export function groupAttempts(history: History): Record<string, Attempt[]> {
  const dates = new Map(history.sessions.map((s) => [s.id, s.startedAt]));
  const grouped: Record<string, Attempt[]> = {};
  for (const attempt of history.attempts) {
    (grouped[attempt.drillId] ??= []).push(attempt);
  }
  for (const list of Object.values(grouped)) {
    list.sort((a, b) => (dates.get(b.sessionId) ?? 0) - (dates.get(a.sessionId) ?? 0));
  }
  return grouped;
}

/**
 * その日・そのモードのメニュー。生成済みなら再利用し、無ければ作って保存する。
 */
export async function getOrCreateDailyMenu(mode: PracticeMode, date = today()): Promise<DailyMenu> {
  const existing = await db.dailyMenus.where({ date, mode }).first();
  if (existing) return existing;

  const [settings, history] = await Promise.all([getSettings(), loadHistory()]);
  const menu: DailyMenu = {
    id: newId(),
    date,
    mode,
    items: generateMenu({
      mode,
      unlockedLevel: settings.unlockedLevel,
      attemptsByDrill: groupAttempts(history),
      graduatedIds: graduatedDrillIds(history.attempts),
    }),
  };
  await db.dailyMenus.put(menu);
  return menu;
}

export async function markMenuItemDone(menuId: string, drillId: string): Promise<void> {
  const menu = await db.dailyMenus.get(menuId);
  if (!menu) return;
  await db.dailyMenus.put({
    ...menu,
    items: menu.items.map((item) => (item.drillId === drillId ? { ...item, done: true } : item)),
  });
}

/** その日のセッションを使い回す。1日に何度も開いてもセッションが増えないように */
export async function getOrCreateSession(mode: PracticeMode, menuId?: string): Promise<Session> {
  const date = today();
  const existing = await db.sessions.where({ date }).and((s) => s.mode === mode).first();
  if (existing) return existing;

  const session: Session = { id: newId(), date, mode, startedAt: Date.now(), menuId };
  await db.sessions.put(session);
  return session;
}

export interface RecordAttemptInput extends GraduationInput {
  drillId: string;
  mode: PracticeMode;
  menuId?: string;
}

export interface RecordAttemptResult {
  attempt: Attempt;
  /** 卒業条件を満たしたか */
  graduated: boolean;
  /** レベルが上がったなら、その新しいレベル */
  unlockedTo?: number;
}

/**
 * 練習1本ぶんを記録する。保存と同時に卒業判定とレベル解放まで済ませる。
 */
export async function recordAttempt(input: RecordAttemptInput): Promise<RecordAttemptResult> {
  const drill = getDrill(input.drillId);
  if (!drill) throw new Error(`不明なドリル: ${input.drillId}`);

  const session = await getOrCreateSession(input.mode, input.menuId);
  const graduated = isGraduated(drill, input);

  const attempt: Attempt = {
    id: newId(),
    sessionId: session.id,
    drillId: drill.id,
    bpm: input.bpm,
    durationSec: input.durationSec,
    meanAbsErrorMs: input.meanAbsErrorMs,
    subjective: input.subjective,
    graduated,
  };

  await db.attempts.put(attempt);
  await db.sessions.put({ ...session, endedAt: Date.now() });
  if (input.menuId) await markMenuItemDone(input.menuId, drill.id);

  // 卒業のたびに解放レベルを計算し直す
  const settings = await getSettings();
  const attempts = await db.attempts.toArray();
  const level = computeUnlockedLevel(graduatedDrillIds(attempts));
  const unlockedTo = level > settings.unlockedLevel ? level : undefined;
  if (unlockedTo) await updateSettings({ unlockedLevel: unlockedTo });

  return { attempt, graduated, unlockedTo };
}
