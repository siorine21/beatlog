'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DailyMenu, PracticeMode } from '@/lib/types';

/**
 * 今日のメニュー。生成済みなら再利用し、無ければ生成して保存する（spec.md §3.4）。
 */
export function useTodayMenu(mode: PracticeMode, enabled = true) {
  const [menu, setMenu] = useState<DailyMenu | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    const { getOrCreateDailyMenu } = await import('@/lib/store');
    setMenu(await getOrCreateDailyMenu(mode));
    setLoading(false);
  }, [enabled, mode]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { menu, loading, reload };
}
