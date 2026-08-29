'use client';

import { MAX_LEVEL, unlockRequirement } from '@/data/levels';
import { useSettings } from '@/hooks/useSettings';
import { Card, Eyebrow } from '@/components/ui';

/**
 * 解放レベル。卒業条件を満たすと store.ts が自動で上げる（Phase 3）。
 * ここでは、様子を見たいときや作り直したいときのために手動でも切り替えられる。
 */
export function UnlockedLevelSetting() {
  const { settings, error, update } = useSettings();
  const level = settings?.unlockedLevel ?? null;

  return (
    <Card className="px-4 py-4">
      <div className="mb-1">
        <Eyebrow>解放レベル</Eyebrow>
      </div>
      <p className="mb-3 text-[12px] text-dim">
        ドリルの卒業条件を満たすと自動で上がります。ここでは手動でも切り替えられます。
      </p>

      {error && <p className="text-[12px] text-snare">設定を読めませんでした: {error}</p>}

      <div className="flex gap-1.5">
        {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((value) => {
          const active = value === level;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              disabled={level === null}
              onClick={() => void update({ unlockedLevel: value })}
              className={`min-h-11 flex-1 touch-manipulation rounded-lg border font-mono text-[13px] tnum transition-colors disabled:opacity-40 ${
                active
                  ? 'border-chrome bg-chrome font-bold text-bg'
                  : 'border-edge2 bg-panel2 text-dim hover:text-txt active:bg-raised'
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>

      {level !== null && level < MAX_LEVEL && (
        <p className="mt-3 text-[12px] text-dim">
          Lv{level + 1} の解放条件: {unlockRequirement(level + 1)}
        </p>
      )}
    </Card>
  );
}
