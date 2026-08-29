'use client';

import { useCallback, useState } from 'react';
import { scheduleClick } from '@/lib/audio/click';
import { scheduleDrum } from '@/lib/audio/drums';
import type { ScheduledStep, TempoSpec } from '@/lib/audio/scheduler';
import type { Lane, RhythmPattern } from '@/lib/types';
import { LANE_ORDER } from '@/lib/lanes';
import { clampBpm } from './useMetronome';
import { useStepPlayer } from './useStepPlayer';

/**
 * リズムパターンの再生。Phase 1 のスケジューラをそのまま使い、
 * ステップごとに「そのステップで鳴るレーン」を予約する。
 *
 * resolution 16 は1拍4ステップ、12 は1拍3ステップ（3連・シャッフル系）。
 * どちらも1小節を4拍として扱う。
 */
export function usePatternPlayer(pattern: RhythmPattern, initialBpm?: number) {
  const [bpm, setBpmState] = useState(initialBpm ?? pattern.bpmRange[0]);
  const [withClick, setWithClick] = useState(false);

  const onStep = useCallback(
    (step: ScheduledStep, spec: TempoSpec, ctx: AudioContext) => {
      for (const lane of LANE_ORDER) {
        if ((pattern.grid[lane as Lane]?.[step.step] ?? 0) > 0) {
          scheduleDrum(ctx, ctx.destination, lane, step.time);
        }
      }
      if (withClick && step.step % spec.stepsPerBeat === 0) {
        scheduleClick(ctx, ctx.destination, step.step === 0 ? 'accent' : 'beat', step.time);
      }
    },
    [pattern.grid, withClick],
  );

  const player = useStepPlayer({
    bpm,
    beatsPerBar: 4,
    stepsPerBeat: pattern.resolution / 4,
    onStep,
  });

  const setBpm = useCallback((value: number) => setBpmState(clampBpm(value)), []);
  const nudgeBpm = useCallback((delta: number) => setBpmState((prev) => clampBpm(prev + delta)), []);

  return {
    bpm,
    setBpm,
    nudgeBpm,
    withClick,
    setWithClick,
    playing: player.playing,
    toggle: player.toggle,
    /** 五線譜（Phase 2b）にもそのまま渡せるよう外に出しておく */
    currentStep: player.currentStep,
  };
}
