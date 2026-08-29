import type { RhythmPattern } from '@/lib/types';
import { LANE_COLOR, LANE_LABEL, lanesOf } from '@/lib/lanes';

/**
 * Phase 0 の動作確認用の簡易グリッド。
 * 本番のグリッド（再生・ハイライト付き）は Phase 2 の RhythmGrid で作る。
 */
export function PatternPreview({ pattern }: { pattern: RhythmPattern }) {
  const lanes = lanesOf(pattern.grid);
  const stepsPerBeat = pattern.resolution / 4;

  return (
    <div className="flex flex-col gap-1.5">
      {lanes.map((lane) => (
        <div key={lane} className="flex items-center gap-2.5">
          <span className="flex w-7 shrink-0 items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: LANE_COLOR[lane] }}
              aria-hidden
            />
            <span className="font-mono text-[9px] tracking-wider text-silk">
              {LANE_LABEL[lane]}
            </span>
          </span>
          <div className="flex flex-1 gap-[3px]">
            {Array.from({ length: pattern.resolution }, (_, step) => {
              const on = (pattern.grid[lane]?.[step] ?? 0) > 0;
              const onBeat = step % stepsPerBeat === 0;
              return (
                <span
                  key={step}
                  className={`h-[18px] flex-1 rounded-[3px] ${
                    on ? 'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)]' : onBeat ? 'bg-edge' : 'bg-panel2'
                  }`}
                  style={on ? { background: LANE_COLOR[lane] } : undefined}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
