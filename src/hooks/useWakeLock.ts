'use client';

import { useEffect, useRef } from 'react';

/**
 * 練習中に画面を消させない（spec.md §5）。
 * 対応していない端末では何もしない。タブに戻ったときは取り直す。
 */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          await lock.release();
          return;
        }
        lockRef.current = lock;
      } catch {
        // 拒否されても練習自体は続けられる
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !lockRef.current) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
