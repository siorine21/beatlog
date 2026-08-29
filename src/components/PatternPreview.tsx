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
    <div className="flex flex-col gap-1">
      {lanes.map((lane) => (
        <div key={lane} className="flex items-center gap-2">
          <span className="w-6 shrink-0 font-mono text-[9.5px] tracking-widest text-silk">
            {LANE_LABEL[lane]}
          </span>
          <div className="flex flex-1 gap-[2px]">
            {Array.from({ length: pattern.resolution }, (_, step) => {
              const on = (pattern.grid[lane]?.[step] ?? 0) > 0;
              return (
                <span
                  key={step}
                  className={`h-4 flex-1 rounded-[2px] ${
                    on ? '' : step % stepsPerBeat === 0 ? 'bg-edge' : 'bg-panel2'
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
