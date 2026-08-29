'use client';

import { ASSIST_LEVELS, ASSIST_ORDER } from '@/lib/notation/assist';
import { Card, Eyebrow } from '@/components/ui';
import type { AssistLevel } from '@/lib/types';

/**
 * ガイドレベルの切り替え（spec.md §3.8）。
 * 練習中に詰まったとき、常にワンタップで1段戻せることを最優先にしている。
 */
export function AssistControl({
  level,
  auto,
  onSelect,
  onStepBack,
  onAutoChange,
}: {
  level: AssistLevel;
  auto: boolean;
  onSelect: (level: number) => void;
  onStepBack: () => void;
  onAutoChange?: (auto: boolean) => void;
}) {
  return (
    <Card className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <Eyebrow>読譜ガイド</Eyebrow>
        <span className="font-mono text-[12px] tracking-[0.1em] tnum">LV {level}</span>
      </div>

      <div className="flex gap-1.5" role="group" aria-label="ガイドレベル">
        {ASSIST_ORDER.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={value === level}
            aria-label={`ガイド ${value}`}
            onClick={() => onSelect(value)}
            className={`h-11 flex-1 touch-manipulation rounded-md border transition-colors ${
              value <= level
                ? 'border-chrome bg-chrome'
                : 'border-edge2 bg-panel2 hover:border-chrome'
            }`}
          />
        ))}
      </div>

      <div className="mt-2 flex justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] text-silk uppercase">補助あり</span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-silk uppercase">
          素の譜面
        </span>
      </div>

      <p className="mt-3 min-h-[2.7em] border-t border-edge pt-3 text-[13px] text-dim">
        {ASSIST_LEVELS[level].description}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onStepBack}
          disabled={level === 0}
          className="min-h-11 touch-manipulation rounded-lg border border-edge2 bg-panel2 px-4 text-[13px] text-txt transition-colors hover:border-chrome active:bg-raised disabled:opacity-30"
        >
          1段戻す
        </button>
        {onAutoChange && (
          <label className="flex min-h-11 flex-1 touch-manipulation items-center justify-end gap-2 text-[12px] text-dim">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => onAutoChange(e.target.checked)}
              className="h-5 w-5 accent-chrome"
            />
            レベルから自動で決める
          </label>
        )}
      </div>
    </Card>
  );
}
