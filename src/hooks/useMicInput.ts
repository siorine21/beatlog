'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureAudioContext } from '@/lib/audio/context';
import { micSupported, startMic, type MicSession } from '@/lib/mic';
import type { HitEvent } from '@/lib/judge';

/**
 * マイク入力の購読。enabled が true のあいだだけマイクを掴む。
 *
 * 権限は enabled になった瞬間（＝out モードで練習を始める直前）に要求し、
 * 止めるときは必ずトラックを解放する（CLAUDE.md）。
 */
export function useMicInput({
  enabled,
  threshold,
  onHit,
}: {
  enabled: boolean;
  /** 未指定か 0 なら、起動時に環境ノイズから決める */
  threshold?: number;
  onHit: (hit: HitEvent) => void;
}) {
  const [level, setLevel] = useState(0);
  const [measuring, setMeasuring] = useState(false);
  const [activeThreshold, setActiveThreshold] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const sessionRef = useRef<MicSession | null>(null);
  const onHitRef = useRef(onHit);
  onHitRef.current = onHit;

  // 対応状況は描画後に調べる（静的エクスポート時には navigator が無い）
  useEffect(() => setSupported(micSupported()), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        const ctx = await ensureAudioContext();
        const session = await startMic({
          ctx,
          // 0 は「自動」の意味なので渡さない
          threshold: threshold && threshold > 0 ? threshold : undefined,
          workletUrl: new URL('../lib/audio/onset-worklet.js', import.meta.url).href,
          onHit: (hit) => onHitRef.current(hit),
          onLevel: setLevel,
          onMeasuring: setMeasuring,
        });
        if (cancelled) {
          session.stop();
          return;
        }
        sessionRef.current = session;
        setActiveThreshold(session.threshold);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : String(e);
          setError(
            message.includes('Permission') || message.includes('denied')
              ? 'マイクの使用が許可されていません。ブラウザの設定から許可してください。'
              : message,
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      sessionRef.current?.stop();
      sessionRef.current = null;
      setLevel(0);
      setMeasuring(false);
    };
  }, [enabled, threshold]);

  const setThreshold = useCallback((value: number) => {
    sessionRef.current?.setThreshold(value);
    setActiveThreshold(value);
  }, []);

  return { level, measuring, threshold: activeThreshold, setThreshold, error, supported };
}
