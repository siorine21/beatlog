'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '@/lib/types';

/**
 * IndexedDB の設定を読む。まだ読めていない間は null。
 * db.ts はブラウザでのみ読み込む（静的エクスポート時に評価させない）。
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('@/lib/db')
      .then(({ getSettings }) => getSettings())
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (patch: Partial<Omit<Settings, 'id'>>) => {
    const { updateSettings } = await import('@/lib/db');
    setSettings(await updateSettings(patch));
  }, []);

  return { settings, error, update };
}
