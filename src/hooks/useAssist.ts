'use client';

import { useCallback } from 'react';
import { autoAssistLevel } from '@/data/levels';
import { ASSIST_LEVELS, clampAssist } from '@/lib/notation/assist';
import { useSettings } from './useSettings';
import type { AssistLevel } from '@/lib/types';

/**
 * ガイドレベル（spec.md §3.8）。
 * assistAuto が true のときは、そのドリル／パターンのレベルから自動で決める。
 * 剥がすのは自動、戻すのは随時。stepBack はワンタップで1段戻すためのもの。
 */
export function useAssist(contentLevel: number) {
  const { settings, update } = useSettings();

  const auto = settings?.assistAuto ?? true;
  const level: AssistLevel = auto ? autoAssistLevel(contentLevel) : (settings?.assistLevel ?? 1);

  const setLevel = useCallback(
    (value: number) => update({ assistLevel: clampAssist(value), assistAuto: false }),
    [update],
  );

  const setAuto = useCallback((value: boolean) => update({ assistAuto: value }), [update]);

  const stepBack = useCallback(() => {
    if (level > 0) void setLevel(level - 1);
  }, [level, setLevel]);

  return { level, config: ASSIST_LEVELS[level], auto, setLevel, setAuto, stepBack, ready: !!settings };
}
