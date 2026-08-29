'use client';

import { useCallback, useEffect, useState } from 'react';
import './globals.css';

/** 更新後に古い JS を読みにいって失敗したときの見分け方 */
const CHUNK_ERROR =
  /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i;
const RECOVERED_FLAG = 'beatlog.recovered';

/**
 * 画面が読み込めなかったときの受け皿。
 *
 * Next.js の既定は英語1行だけで、練習の途中に出ても何をすればいいか分からない。
 * ここでは日本語で状況を伝え、その場で直せるボタンを出す。
 *
 * よくある原因は、アプリを更新したあとに前から開いていた画面から
 * 操作したときで、古い JS を読みにいって失敗する。控えを消して
 * 読み直せば直るので、それをボタン1つでやる。練習記録（IndexedDB）は消さない。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [working, setWorking] = useState(false);

  const reload = useCallback(async () => {
    setWorking(true);
    try {
      // オフラインで消すと取り直せない。読み直しだけ試す
      if (navigator.onLine === false) {
        location.reload();
        return;
      }
      if ('caches' in window) {
        for (const key of await caches.keys()) await caches.delete(key);
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    } catch {
      // 消せなくても読み直しは試す
    }
    location.reload();
  }, []);

  useEffect(() => {
    console.error('画面の読み込みに失敗しました', error);

    // 古い JS を掴んだだけなら、押させずにこちらで直す（1セッションに1回だけ）。
    // ただしオフラインでは消さない。取り直せず、他の画面まで開けなくなる
    if (!CHUNK_ERROR.test(error.message ?? '')) return;
    if (navigator.onLine === false) return;
    try {
      if (sessionStorage.getItem(RECOVERED_FLAG)) return;
      sessionStorage.setItem(RECOVERED_FLAG, '1');
    } catch {
      return;
    }
    void reload();
  }, [error, reload]);

  return (
    <html lang="ja">
      <body className="antialiased">
        <main className="mx-auto flex min-h-dvh max-w-[540px] flex-col justify-center gap-5 px-5">
          <h1 className="text-[22px] font-bold tracking-tight">画面を読み込めませんでした</h1>
          <p className="text-[13px] leading-relaxed text-dim">
            アプリを更新したあと、前から開いていた画面から操作すると起きることがあります。
            下のボタンで古い控えを消して読み直すと直ります。
            練習の記録は消えません。
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void reload()}
              disabled={working}
              className="h-14 w-full touch-manipulation rounded-xl bg-chrome font-mono text-[13px] font-bold tracking-[0.2em] text-bg uppercase disabled:opacity-50"
            >
              {working ? 'Reloading' : '控えを消して読み直す'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="h-12 w-full touch-manipulation rounded-xl border border-edge2 bg-panel2 text-[13px] text-txt"
            >
              もう一度ためす
            </button>
          </div>

          <details className="rounded-card border border-edge bg-panel px-4 py-3">
            <summary className="min-h-11 cursor-pointer list-none text-[12px] text-silk">
              エラーの内容
            </summary>
            <p className="mt-2 font-mono text-[11px] break-all text-dim">
              {error.message || '(メッセージなし)'}
              {error.digest ? ` / ${error.digest}` : ''}
            </p>
          </details>
        </main>
      </body>
    </html>
  );
}
