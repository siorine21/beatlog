'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { backupFileName } from '@/lib/backup';
import type { ImportResult, StorageStatus } from '@/lib/store';
import { Card, Chip, Eyebrow } from '@/components/ui';

/**
 * バックアップ（spec.md §10.7）。
 *
 * 端末の中だけにデータを置く設計なので、消えたら戻らない。
 * 手動のエクスポートが唯一の備えになるため、最終バックアップからの日数を常に出す。
 * 取り込みは検証を通ってからで、通らなければ一切書き込まない（§11.4）。
 */
const MB = 1024 * 1024;

export function BackupSetting() {
  const { settings, update } = useSettings();
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshStorage = useCallback(async () => {
    const { storageStatus } = await import('@/lib/store');
    setStorage(await storageStatus());
  }, []);

  useEffect(() => {
    void refreshStorage();
  }, [refreshStorage]);

  const lastBackupAt = settings?.lastBackupAt;
  const daysAgo =
    lastBackupAt === undefined
      ? null
      : Math.floor((Date.now() - lastBackupAt) / (24 * 60 * 60 * 1000));

  const exportData = async () => {
    setBusy(true);
    setResult(null);
    try {
      const { exportAll } = await import('@/lib/store');
      const backup = await exportAll();
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backupFileName();
      // 端末によっては、クリックした直後に revoke すると保存が始まる前に
      // URL が消えてダウンロードが失敗する。DOM に入れてから押し、後で片付ける
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      await update({ lastBackupAt: Date.now() });
      setResult({ ok: true, message: `書き出しました（${backupFileName()}）` });
    } finally {
      setBusy(false);
    }
  };

  const importData = async (file: File) => {
    setBusy(true);
    setResult(null);
    try {
      const { importAll } = await import('@/lib/store');
      const imported = await importAll(await file.text());
      setResult(imported);
      if (imported.ok) location.reload(); // 画面の状態を読み直す
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card className="px-4 py-4">
      <div className="mb-1.5 flex items-center justify-between">
        <Eyebrow>バックアップ</Eyebrow>
        <Chip tone="quiet">
          {daysAgo === null ? 'まだ未実施' : daysAgo === 0 ? '今日' : `${daysAgo}日前`}
        </Chip>
      </div>

      <p className="mb-3 text-[12px] text-dim">
        練習の記録はこの端末の中だけにあります。書き出したファイルはクラウドなどに
        自分で保存してください。リポジトリには絶対に置かないこと。
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void exportData()}
          className="min-h-11 flex-1 touch-manipulation rounded-lg bg-chrome text-[13px] font-semibold text-bg disabled:opacity-40"
        >
          書き出す
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="min-h-11 flex-1 touch-manipulation rounded-lg border border-edge2 bg-panel2 text-[13px] text-txt disabled:opacity-40"
        >
          読み込む
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!confirm('いまの記録は置き換えられます。読み込みますか？')) {
              e.target.value = '';
              return;
            }
            void importData(file);
          }}
        />
      </div>

      {result && (
        <div
          className={`mt-3 rounded-lg border px-3 py-2 text-[12px] ${
            result.ok ? 'border-ok text-dim' : 'border-snare text-snare'
          }`}
        >
          <p>{result.message}</p>
          {result.counts && (
            <p className="mt-1 text-silk">
              セッション {result.counts.sessions} / 記録 {result.counts.attempts} / メニュー{' '}
              {result.counts.dailyMenus}
            </p>
          )}
          {result.issues?.map((issue) => (
            <p key={issue} className="mt-1 font-mono text-[11px]">
              {issue}
            </p>
          ))}
        </div>
      )}

      <dl className="mt-3 flex flex-col gap-1 border-t border-edge pt-3 text-[12px]">
        <div className="flex justify-between">
          <dt className="text-silk">使用量</dt>
          <dd className="font-mono tnum">
            {storage?.usageBytes !== undefined
              ? `${(storage.usageBytes / MB).toFixed(1)} MB`
              : '—'}
            {storage?.quotaBytes !== undefined &&
              ` / ${(storage.quotaBytes / MB).toFixed(0)} MB`}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-silk">永続ストレージ</dt>
          <dd className="flex items-center gap-2">
            <span className="font-mono">{storage?.persisted ? '許可済み' : '未許可'}</span>
            {!storage?.persisted && (
              <button
                type="button"
                onClick={async () => {
                  const { requestPersistentStorage } = await import('@/lib/store');
                  await requestPersistentStorage();
                  await refreshStorage();
                }}
                className="min-h-11 touch-manipulation px-1 text-[12px] text-dim underline"
              >
                要求する
              </button>
            )}
          </dd>
        </div>
      </dl>
      <p className="mt-1 text-[11px] text-silk">
        永続ストレージを許可すると、端末の空き容量が減ったときに記録が自動で消される
        可能性が下がります（保証ではありません）。
      </p>
    </Card>
  );
}
