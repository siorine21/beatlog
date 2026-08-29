'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PracticeMode } from '@/lib/types';

/**
 * 練習モード。端末ごとの選択なので localStorage に置く（練習データは IndexedDB）。
 *
 * home モードは Web MIDI が要る。iOS/iPadOS は全ブラウザが WebKit で
 * Web MIDI に非対応のため、機能検出して選べないようにする（spec.md §2）。
 */
const STORAGE_KEY = 'beatlog.mode';

export function usePracticeMode() {
  const [mode, setModeState] = useState<PracticeMode>('out');
  const [midiSupported, setMidiSupported] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supported = 'requestMIDIAccess' in navigator;
    setMidiSupported(supported);

    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // プライベートモードなどで読めないことがある
    }
    const valid = stored === 'home' || stored === 'out' || stored === 'air';
    const initial: PracticeMode = valid && (stored !== 'home' || supported)
      ? (stored as PracticeMode)
      : supported
        ? 'home'
        : 'out';

    setModeState(initial);
    setReady(true);
  }, []);

  const setMode = useCallback((next: PracticeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 保存できなくても動作に影響はない
    }
  }, []);

  return { mode, setMode, midiSupported, ready };
}
