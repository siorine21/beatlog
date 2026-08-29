import { describe, expect, it } from 'vitest';
import { backupFileName, buildBackup, parseBackup, type BackupData } from './backup';
import type { Attempt, Session, Settings } from './types';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const ATTEMPT_ID = '22222222-2222-4222-8222-222222222222';

const session: Session = {
  id: SESSION_ID,
  date: '2026-08-29',
  mode: 'home',
  startedAt: 1000,
};

const attempt: Attempt = {
  id: ATTEMPT_ID,
  sessionId: SESSION_ID,
  drillId: 'hihat-only',
  bpm: 90,
  durationSec: 60,
  subjective: 'ok',
  graduated: true,
};

const settings: Settings = {
  id: 1,
  midiOffsetMs: 12,
  micOffsetMs: 0,
  micThreshold: 0,
  unlockedLevel: 3,
  assistLevel: 2,
  assistAuto: true,
  clickSound: 'click',
  midiNoteMap: { 36: 'kick', 38: 'snare' },
};

const data: BackupData = { sessions: [session], attempts: [attempt], dailyMenus: [], settings };
const json = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ ...buildBackup(data, 1700000000000), ...over });

describe('parseBackup', () => {
  it('正しいバックアップを受け入れる', () => {
    const result = parseBackup(json());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.sessions).toHaveLength(1);
      expect(result.backup.settings?.unlockedLevel).toBe(3);
    }
  });

  it('JSON でなければ拒否する', () => {
    expect(parseBackup('これはJSONではない')).toMatchObject({ ok: false });
  });

  it('別アプリのファイルを拒否する', () => {
    expect(parseBackup(json({ app: 'other' })).ok).toBe(false);
  });

  it('版が違えば拒否する', () => {
    expect(parseBackup(json({ version: 99 })).ok).toBe(false);
  });

  it('id が UUID でなければ拒否する', () => {
    const broken = JSON.stringify({
      ...buildBackup(data),
      sessions: [{ ...session, id: 'not-a-uuid' }],
    });
    expect(parseBackup(broken).ok).toBe(false);
  });

  it('日付の形式が違えば拒否する', () => {
    const broken = JSON.stringify({
      ...buildBackup(data),
      sessions: [{ ...session, date: '2026/08/29' }],
    });
    expect(parseBackup(broken).ok).toBe(false);
  });

  it('BPM が範囲外なら拒否する（spec.md §11.4）', () => {
    const broken = JSON.stringify({
      ...buildBackup(data),
      attempts: [{ ...attempt, bpm: 9999 }],
    });
    const result = parseBackup(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join()).toContain('bpm');
  });

  it('知らない主観評価を拒否する', () => {
    const broken = JSON.stringify({
      ...buildBackup(data),
      attempts: [{ ...attempt, subjective: 'great' }],
    });
    expect(parseBackup(broken).ok).toBe(false);
  });

  it('存在しないセッションを指す記録を拒否する（部分的に取り込まない）', () => {
    const broken = JSON.stringify({
      ...buildBackup(data),
      sessions: [],
    });
    const result = parseBackup(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('セッション');
  });

  it('設定が無くても（null）受け入れる', () => {
    const result = parseBackup(
      JSON.stringify(buildBackup({ ...data, settings: null }, 1700000000000)),
    );
    expect(result.ok).toBe(true);
  });

  it('解放レベルが範囲外なら拒否する', () => {
    const broken = JSON.stringify({
      ...buildBackup(data),
      settings: { ...settings, unlockedLevel: 99 },
    });
    expect(parseBackup(broken).ok).toBe(false);
  });
});

describe('backupFileName', () => {
  it('日付入りで .beatlog.json になる（.gitignore と揃える）', () => {
    expect(backupFileName(new Date(2026, 7, 29))).toBe('20260829.beatlog.json');
  });
});
