'use client';

import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';

/**
 * バックアップの促し（spec.md §10.7）。
 *
 * モーダルや通知では出さない。練習の邪魔をしないよう、
 * 14日以上あいたときだけホームに1行の導線を出す。
 */
const REMIND_AFTER_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

export function BackupReminder() {
  const { settings } = useSettings();
  const { history } = useHistory();

  if (!settings || !history) return null;
  // 記録がまだ無いうちは促さない
  if (history.attempts.length === 0) return null;

  const last = settings.lastBackupAt;
  const days = last === undefined ? null : Math.floor((Date.now() - last) / DAY);
  if (days !== null && days < REMIND_AFTER_DAYS) return null;

  return (
    <Link
      href="/settings"
      className="flex min-h-11 touch-manipulation items-center justify-between gap-3 rounded-card border border-edge bg-panel px-4 py-2.5 text-[12px] text-dim transition-colors hover:border-edge2"
    >
      <span>
        {days === null
          ? '練習の記録をまだ書き出していません'
          : `最後のバックアップから ${days} 日たっています`}
      </span>
      <span aria-hidden className="shrink-0 text-silk">
        設定 ›
      </span>
    </Link>
  );
}
