'use client';

import { useCallback, useEffect, useState } from 'react';
import type { History } from '@/lib/store';

/** 練習記録の読み込み。まだ読めていない間は null */
export function useHistory() {
  const [history, setHistory] = useState<History | null>(null);

  const reload = useCallback(async () => {
    const { loadHistory } = await import('@/lib/store');
    setHistory(await loadHistory());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { history, reload };
}
