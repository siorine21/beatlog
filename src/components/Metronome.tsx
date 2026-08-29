'use client';

import type { ReactNode } from 'react';
import {
  BPM_MAX,
  BPM_MIN,
  METERS,
  SUBDIVISIONS,
  useMetronome,
  type MeterId,
  type SubdivisionId,
} from '@/hooks/useMetronome';
import { Card, Eyebrow } from '@/components/ui';

/** 択一の切り替え。タップ領域は44px以上 */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <div className="mb-1.5">
        <Eyebrow>{label}</Eyebrow>
      </div>
      <div role="group" aria-label={label} className="flex gap-1.5">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={`min-h-11 flex-1 touch-manipulation rounded-lg border text-[13px] transition-colors ${
                active
                  ? 'border-chrome bg-chrome font-semibold text-bg'
                  : 'border-edge2 bg-panel2 text-dim hover:text-txt active:bg-raised'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NudgeButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 flex-1 touch-manipulation rounded-lg border border-edge2 bg-panel2 font-mono text-[14px] text-txt transition-colors hover:border-chrome active:bg-raised"
    >
      {children}
    </button>
  );
}

export function Metronome() {
  const m = useMetronome();

  return (
    <Card className="px-4 pt-4 pb-4">
      {/* BPM は練習中に離れて見るので特大にする */}
      <div className="flex items-end justify-center gap-2">
        <span className="text-[76px] leading-[0.82] font-extrabold tracking-[-0.055em] tnum">
          {m.bpm}
        </span>
        <span className="pb-2 font-mono text-[10px] tracking-[0.2em] text-silk uppercase">bpm</span>
      </div>

      {/* 現在位置。スケジューラからではなく rAF で描く（spec.md §6.1） */}
      <div className="mt-5 flex gap-[3px]" aria-hidden>
        {Array.from({ length: m.stepsPerBar }, (_, i) => {
          const onBeat = i % m.stepsPerBeat === 0;
          const active = i === m.currentStep;
          const beatNo = i / m.stepsPerBeat + 1;
          const activeBeat = m.currentBeat === beatNo - 1;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={`w-full rounded-full transition-colors duration-75 ${
                  onBeat ? 'h-2' : 'h-1 self-center'
                } ${active ? 'bg-chrome' : onBeat ? 'bg-edge2' : 'bg-edge'}`}
              />
              <span
                className={`h-3 font-mono text-[9px] leading-3 tnum transition-colors ${
                  activeBeat ? 'text-txt' : 'text-silk'
                }`}
              >
                {onBeat ? beatNo : ''}
              </span>
            </div>
          );
        })}
      </div>
      <p className="sr-only" aria-live="off">
        {m.playing ? `${m.currentBeat + 1} 拍目` : '停止中'}
      </p>

      <label className="mt-4 flex h-11 items-center">
        <span className="sr-only">BPM</span>
        <input
          type="range"
          min={BPM_MIN}
          max={BPM_MAX}
          value={m.bpm}
          onChange={(e) => m.setBpm(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-edge2 accent-chrome"
        />
      </label>

      <div className="mt-2 flex gap-1.5">
        <NudgeButton onClick={() => m.nudgeBpm(-5)}>−5</NudgeButton>
        <NudgeButton onClick={() => m.nudgeBpm(-1)}>−1</NudgeButton>
        <NudgeButton onClick={() => m.nudgeBpm(1)}>+1</NudgeButton>
        <NudgeButton onClick={() => m.nudgeBpm(5)}>+5</NudgeButton>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Segmented<MeterId>
          label="拍子"
          value={m.meterId}
          options={METERS}
          onChange={m.setMeterId}
        />
        <Segmented<SubdivisionId>
          label="サブディビジョン"
          value={m.subdivisionId}
          options={SUBDIVISIONS}
          onChange={m.setSubdivisionId}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={m.toggle}
          aria-pressed={m.playing}
          className={`h-14 flex-1 touch-manipulation rounded-xl font-mono text-[14px] font-bold tracking-[0.22em] uppercase transition-colors ${
            m.playing
              ? 'border border-edge2 bg-raised text-txt active:bg-panel2'
              : 'bg-chrome text-bg hover:bg-txt active:bg-dim'
          }`}
        >
          {m.playing ? 'Stop' : 'Start'}
        </button>
        <button
          type="button"
          onClick={m.tap}
          className="h-14 w-24 touch-manipulation rounded-xl border border-edge2 bg-panel2 font-mono text-[12px] tracking-[0.18em] text-dim uppercase transition-colors hover:text-txt active:bg-raised"
        >
          Tap
        </button>
      </div>
    </Card>
  );
}
