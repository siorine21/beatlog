'use client';

import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/types';

/**
 * Phase 0 の動作確認用。IndexedDB（Dexie）が開けること、
 * 設定レコードが既定値で作られることを画面上で確かめる。
 */
export function DbStatus() {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'ok'; settings: Settings } | { status: 'error'; message: string }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    // ブラウザでのみ IndexedDB に触れる（静的エクスポート時に評価させない）
    import('@/lib/db')
      .then(({ getSettings }) => getSettings())
      .then((settings) => {
        if (!cancelled) setState({ status: 'ok', settings });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-lg border border-edge bg-panel p-3 text-[12px]">
      <h2 className="mb-2 font-mono text-[10px] tracking-[0.2em] text-silk">INDEXEDDB</h2>
      {state.status === 'loading' && <p className="text-dim">読み込み中…</p>}
      {state.status === 'error' && <p className="text-snare">開けませんでした: {state.message}</p>}
      {state.status === 'ok' && (
        <dl className="grid grid-cols-[8rem_1fr] gap-x-2">
          <dt className="text-silk">解放レベル</dt>
          <dd>Lv{state.settings.unlockedLevel}</dd>
          <dt className="text-silk">ガイドレベル</dt>
          <dd>
            {state.settings.assistLevel}
            {state.settings.assistAuto ? "（自動）" : "（手動）"}
          </dd>
        </dl>
      )}
    </div>
  );
}
