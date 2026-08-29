import type { Lane, RhythmPattern } from '@/lib/types';
import { LANE_COLOR, LANE_LABEL, lanesOf } from '@/lib/lanes';

/**
 * レーンを縦、ステップを横に並べたグリッド。
 * resolution 16（16分割）と 12（3連・シャッフル系）の両方に対応する。
 *
 * 拍の頭で間隔を空けて区切りを作る。1小節が縦持ちスマホの横幅に収まること。
 * currentStep は再生側（usePatternPlayer）から渡す。五線譜（Phase 2b）にも
 * 同じ値を渡して同時にハイライトさせる（spec.md §3.8）。
 */
export function RhythmGrid({
  pattern,
  currentStep = -1,
  compact = false,
  showRuler = true,
}: {
  pattern: RhythmPattern;
  currentStep?: number;
  compact?: boolean;
  showRuler?: boolean;
}) {
  const lanes = lanesOf(pattern.grid);
  const stepsPerBeat = pattern.resolution / 4;
  const steps = Array.from({ length: pattern.resolution }, (_, i) => i);
  const cellHeight = compact ? 'h-3' : 'h-6';

  /** 拍の頭にだけ左の余白を足して区切りに見せる */
  const beatGap = (step: number) => (step > 0 && step % stepsPerBeat === 0 ? 'ml-1.5' : '');

  return (
    <div className="flex flex-col gap-1">
      {showRuler && (
        <div className="flex gap-[3px] pl-9">
          {steps.map((step) => {
            const onBeat = step % stepsPerBeat === 0;
            const active = Math.floor(currentStep / stepsPerBeat) === Math.floor(step / stepsPerBeat);
            return (
              <span
                key={step}
                className={`flex-1 font-mono text-[9px] leading-3 tnum ${beatGap(step)} ${
                  active && currentStep >= 0 ? 'text-txt' : 'text-silk'
                }`}
              >
                {onBeat ? step / stepsPerBeat + 1 : ''}
              </span>
            );
          })}
        </div>
      )}

      {lanes.map((lane) => (
        <div key={lane} className="flex items-center gap-2">
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
            {steps.map((step) => (
              <Cell
                key={step}
                lane={lane}
                step={step}
                on={(pattern.grid[lane]?.[step] ?? 0) > 0}
                onBeat={step % stepsPerBeat === 0}
                active={step === currentStep}
                className={`${cellHeight} ${beatGap(step)}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Cell({
  lane,
  step,
  on,
  onBeat,
  active,
  className,
}: {
  lane: Lane;
  step: number;
  on: boolean;
  onBeat: boolean;
  active: boolean;
  className: string;
}) {
  const base = on ? '' : onBeat ? 'bg-edge' : 'bg-panel2';
  return (
    <span
      data-step={step}
      data-active={active || undefined}
      className={`flex-1 rounded-[3px] transition-[filter,box-shadow] duration-75 ${base} ${className} ${
        on ? 'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35)]' : ''
      } ${active ? (on ? 'brightness-150' : 'ring-1 ring-edge2') : ''}`}
      style={on ? { background: LANE_COLOR[lane] } : undefined}
    />
  );
}
