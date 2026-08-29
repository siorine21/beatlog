'use client';

import { useEffect } from 'react';

/**
 * 更新後に画面が読み込めなくなったときの自動復帰。
 *
 * アプリを更新すると JS のファイル名が変わる。前から開いていた画面は
 * 古いファイル名を読みにいくので、その画面から遷移すると失敗する。
 * この失敗を拾って、控えを消して一度だけ読み直す。
 *
 * 繰り返しにならないよう、1セッションにつき1回だけ。
 */
const FLAG = 'beatlog.recovered';

const isChunkError = (message: string) =>
  /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    message,
  );

export function ChunkErrorRecovery() {
  useEffect(() => {
    const recover = async () => {
      try {
        if (sessionStorage.getItem(FLAG)) return; // すでに一度やっている
        sessionStorage.setItem(FLAG, '1');
      } catch {
        return; // sessionStorage が使えない環境では何もしない
      }

      try {
        if ('caches' in window) {
          for (const key of await caches.keys()) await caches.delete(key);
        }
      } catch {
        // 消せなくても読み直しは試す
      }
      location.reload();
    };

    const onError = (event: ErrorEvent) => {
      if (isChunkError(event.message ?? '')) void recover();
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? `${reason.name} ${reason.message}` : String(reason);
      if (isChunkError(message)) void recover();
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
