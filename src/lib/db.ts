import Dexie, { type EntityTable } from 'dexie';
import { DEFAULT_MIDI_NOTE_MAP } from './midi-map';
import type { Attempt, DailyMenu, Session, Settings } from './types';

/**
 * spec.md §4 のユーザーデータを保持する IndexedDB。
 * 練習データは必ずここに入れる（localStorage は使わない）。
 */
export class BeatlogDB extends Dexie {
  sessions!: EntityTable<Session, 'id'>;
  attempts!: EntityTable<Attempt, 'id'>;
  dailyMenus!: EntityTable<DailyMenu, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('beatlog');
    this.version(1).stores({
      // date で「今日の分」を引き、mode で集計する
      sessions: 'id, date, mode, startedAt',
      // drillId で BPM 推移を、sessionId でセッション内の一覧を引く
      attempts: 'id, sessionId, drillId, graduated',
      // 同じ日・同じモードのメニューを一意に引く
      dailyMenus: 'id, date, [date+mode]',
      // 単一レコード（id=1）のみ
      settings: 'id',
    });
  }
}

export const db = new BeatlogDB();

/** 単一ユーザーなので設定は常にこの主キー */
export const SETTINGS_ID = 1;

export const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_ID,
  midiOffsetMs: 0,
  micOffsetMs: 0,
  micThreshold: 0.1,
  unlockedLevel: 1,
  assistLevel: 1,
  assistAuto: true,
  clickSound: 'click',
  midiNoteMap: DEFAULT_MIDI_NOTE_MAP,
};

/** 未作成なら既定値で作る。設定は常にこの関数経由で読む。 */
export async function getSettings(): Promise<Settings> {
  const found = await db.settings.get(SETTINGS_ID);
  // 後から増えた項目は既定値で埋める（保存済みのレコードを壊さない）
  if (found) return { ...DEFAULT_SETTINGS, ...found };
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = { ...current, ...patch, id: SETTINGS_ID };
  await db.settings.put(next);
  return next;
}

export { today } from './db-date';
