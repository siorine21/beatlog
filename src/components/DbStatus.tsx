'use client';

import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/types';
import { Card, Eyebrow } from '@/components/ui';

/**
 * Phase 0 の動作確認用。IndexedDB（Dexie）が開けること、
 * 設定レコードが既定値で作られることを画面上で確かめる。
 */
export function DbStatus() {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ok'; settings: Settings }
    | { status: 'error'; message: string }
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
        if (!cancelled)
          setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dot = {
    loading: 'bg-silk',
    ok: 'bg-ok',
    error: 'bg-snare',
  }[state.status];

  return (
    <Card className="px-4 py-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
        <Eyebrow>保存先 IndexedDB</Eyebrow>
      </div>

      {state.status === 'loading' && <p className="text-[12px] text-dim">読み込み中…</p>}
      {state.status === 'error' && (
        <p className="text-[12px] text-snare">開けませんでした: {state.message}</p>
      )}
      {state.status === 'ok' && (
        <dl className="flex flex-col gap-1.5 text-[12px]">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-silk">解放レベル</dt>
            <dd className="font-mono tnum text-txt">Lv{state.settings.unlockedLevel}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-silk">ガイドレベル</dt>
            <dd className="font-mono tnum text-txt">
              {state.settings.assistLevel}
              <span className="ml-1 font-sans text-dim">
                {state.settings.assistAuto ? '自動' : '手動'}
              </span>
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
