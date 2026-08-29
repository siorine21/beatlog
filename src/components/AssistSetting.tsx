'use client';

import { useAssist } from '@/hooks/useAssist';
import { AssistControl } from '@/components/AssistControl';

/**
 * 設定画面のガイドレベル。ここでの「自動」は Lv3 のドリルを基準に見せる
 * （実際の値は練習するドリル／パターンのレベルから決まる）。
 */
export function AssistSetting() {
  const assist = useAssist(3);
  return (
    <AssistControl
      level={assist.level}
      auto={assist.auto}
      onSelect={assist.setLevel}
      onStepBack={assist.stepBack}
      onAutoChange={assist.setAuto}
    />
  );
}
