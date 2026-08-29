import { z } from 'zod';
import type { Attempt, DailyMenu, Session, Settings } from './types';

/**
 * データのエクスポート／インポート（spec.md §10.7、§11.4）。
 *
 * インポートはこのアプリで唯一の外部入力経路なので、
 * IndexedDB に書く前に全フィールドを検証する。1件でも壊れていたら
 * 部分的に取り込まず、全体を拒否する。
 */

export const BACKUP_VERSION = 1;

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD の形式ではありません');
const mode = z.enum(['home', 'out', 'air']);
const lane = z.enum(['hihat', 'snare', 'kick', 'tom1', 'tom2', 'crash', 'ride']);

/** 妥当な範囲に収める。壊れた値をそのまま入れない */
const bpm = z.number().int().min(0).max(300);
const durationSec = z.number().min(0).max(60 * 60 * 6);
const offsetMs = z.number().min(-10_000).max(10_000);

const sessionSchema = z.object({
  id: uuid,
  date: isoDate,
  mode,
  startedAt: z.number().int().nonnegative(),
  endedAt: z.number().int().nonnegative().optional(),
  menuId: uuid.optional(),
});

const attemptSchema = z.object({
  id: uuid,
  sessionId: uuid,
  drillId: z.string().min(1).max(64),
  bpm,
  durationSec,
  hitCount: z.number().int().min(0).max(100_000).optional(),
  meanOffsetMs: offsetMs.optional(),
  meanAbsErrorMs: z.number().min(0).max(10_000).optional(),
  stdDevMs: z.number().min(0).max(10_000).optional(),
  offsets: z.array(offsetMs).max(1000).optional(),
  subjective: z.enum(['good', 'ok', 'bad']),
  graduated: z.boolean(),
});

const dailyMenuSchema = z.object({
  id: uuid,
  date: isoDate,
  mode,
  items: z
    .array(
      z.object({
        drillId: z.string().min(1).max(64),
        targetBpm: bpm,
        targetSec: durationSec,
        done: z.boolean(),
      }),
    )
    .max(20),
});

const settingsSchema = z.object({
  id: z.literal(1),
  midiOffsetMs: offsetMs,
  micOffsetMs: offsetMs,
  micThreshold: z.number().min(0).max(1),
  unlockedLevel: z.number().int().min(1).max(6),
  assistLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  assistAuto: z.boolean(),
  clickSound: z.enum(['click', 'woodblock', 'beep']),
  midiNoteMap: z.record(z.string(), lane),
  lastBackupAt: z.number().int().nonnegative().optional(),
});

export const backupSchema = z.object({
  app: z.literal('beatlog'),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.number().int().nonnegative(),
  sessions: z.array(sessionSchema).max(20_000),
  attempts: z.array(attemptSchema).max(100_000),
  dailyMenus: z.array(dailyMenuSchema).max(20_000),
  settings: settingsSchema.nullable(),
});

export type Backup = z.infer<typeof backupSchema>;

export interface BackupData {
  sessions: Session[];
  attempts: Attempt[];
  dailyMenus: DailyMenu[];
  settings: Settings | null;
}

export function buildBackup(data: BackupData, now = Date.now()): Backup {
  return {
    app: 'beatlog',
    version: BACKUP_VERSION,
    exportedAt: now,
    ...data,
    // JSON では数値キーが文字列になるので、そのまま入れる
    settings: data.settings as Backup['settings'],
  };
}

export type ParseResult =
  | { ok: true; backup: Backup }
  | { ok: false; message: string; issues: string[] };

/**
 * 取り込む前の検証。壊れていれば理由を返し、一切書き込ませない。
 * JSON.parse だけで済ませず、必ずここを通すこと。
 */
export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, message: 'JSON として読めませんでした', issues: [] };
  }

  const result = backupSchema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join('.') || '(全体)'}: ${issue.message}`);
    return { ok: false, message: 'バックアップの形式が違います', issues };
  }

  // 参照の整合性も見る。存在しないセッションを指す試行は取り込まない
  const sessionIds = new Set(result.data.sessions.map((s) => s.id));
  const orphans = result.data.attempts.filter((a) => !sessionIds.has(a.sessionId));
  if (orphans.length > 0) {
    return {
      ok: false,
      message: 'セッションと結びつかない記録が含まれています',
      issues: [`${orphans.length} 件の試行が、存在しないセッションを指しています`],
    };
  }

  return { ok: true, backup: result.data };
}

/** ダウンロードするファイル名。リポジトリにコミットしないよう .gitignore と揃える */
export const backupFileName = (date = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}.beatlog.json`;
};
