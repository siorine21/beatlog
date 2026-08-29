'use client';

import { useEffect, useRef, useState } from 'react';
import { ensureAudioContext } from '@/lib/audio/context';
import { listenMidi, midiSupported, type MidiConnection } from '@/lib/midi';
import type { HitEvent } from '@/lib/judge';
import type { Lane } from '@/lib/types';

/**
 * MIDI 入力の購読。enabled が true の間だけ繋ぐ。
 * onHit は最新のものを呼ぶので、依存を気にせず書ける。
 */
export function useMidiInput({
  enabled,
  noteMap,
  onHit,
}: {
  enabled: boolean;
  noteMap: Record<number, Lane> | undefined;
  onHit: (hit: HitEvent, note: number) => void;
}) {
  const [inputs, setInputs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  /**
   * 対応状況は描画後に判定する。SSR（静的エクスポート）の時点では navigator が無く、
   * 描画中に判定すると生成済みHTMLと食い違ってハイドレーションが壊れる。
   * 判定前は null。
   */
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => setSupported(midiSupported()), []);
  const onHitRef = useRef(onHit);
  onHitRef.current = onHit;

  useEffect(() => {
    if (!enabled || !noteMap || !midiSupported()) return;
    let connection: MidiConnection | null = null;
    let cancelled = false;

    (async () => {
      try {
        const ctx = await ensureAudioContext();
        const opened = await listenMidi({
          ctx,
          noteMap,
          onHit: (hit, note) => onHitRef.current(hit, note),
          onError: setError,
        });
        if (cancelled) {
          opened.stop();
          return;
        }
        connection = opened;
        setInputs(opened.inputs);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      connection?.stop();
    };
    // noteMap は設定の読み込み後に一度だけ変わる想定
  }, [enabled, noteMap]);

  return { inputs, error, supported };
}
