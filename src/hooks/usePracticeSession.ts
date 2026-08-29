'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { scheduleClick } from '@/lib/audio/click';
import { getMasterBus } from '@/lib/audio/bus';
import type { ScheduledStep, TempoSpec } from '@/lib/audio/scheduler';
import { clampBpm } from './useMetronome';
import { useStepPlayer } from './useStepPlayer';
import { useWakeLock } from './useWakeLock';
import type { RhythmPattern } from '@/lib/types';

/**
 * 練習1本ぶんの進行。
 *
 * クリックは拍の頭だけで鳴らし、現在ステップはパターンの分解能で進める。
 * こうするとグリッドがパターンどおりに光りつつ、耳に届くのは拍だけになる。
 * 経過時間は再生中だけ進む（止めれば止まる）。
 */
export function usePracticeSession({
  initialBpm,
  targetSec,
  pattern,
}: {
  initialBpm: number;
  targetSec: number;
  pattern?: RhythmPattern;
}) {
  const [bpm, setBpmState] = useState(initialBpm);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [finished, setFinished] = useState(false);

  const onStep = useCallback((step: ScheduledStep, spec: TempoSpec, ctx: AudioContext) => {
    if (step.step % spec.stepsPerBeat !== 0) return;
    scheduleClick(ctx, getMasterBus(ctx), step.step === 0 ? 'accent' : 'beat', step.time);
  }, []);

  const player = useStepPlayer({
    bpm,
    beatsPerBar: 4,
    stepsPerBeat: pattern ? pattern.resolution / 4 : 1,
    onStep,
  });

  useWakeLock(player.playing);

  // 経過時間は再生中だけ進める。表示のためだけなので performance.now() を使う
  const startedAtRef = useRef<number | null>(null);
  const baseRef = useRef(0);

  useEffect(() => {
    if (!player.playing) {
      if (startedAtRef.current !== null) {
        baseRef.current += (performance.now() - startedAtRef.current) / 1000;
        startedAtRef.current = null;
      }
      return;
    }

    startedAtRef.current = performance.now();
    const timer = setInterval(() => {
      const started = startedAtRef.current;
      if (started === null) return;
      setElapsedSec(baseRef.current + (performance.now() - started) / 1000);
    }, 200);

    return () => clearInterval(timer);
  }, [player.playing]);

  // 目標時間に届いたら自動で止める
  useEffect(() => {
    if (!finished && targetSec > 0 && elapsedSec >= targetSec) {
      setFinished(true);
      player.stop();
    }
  }, [elapsedSec, finished, player, targetSec]);

  const setBpm = useCallback((value: number) => setBpmState(clampBpm(value)), []);
  const nudgeBpm = useCallback((delta: number) => setBpmState((prev) => clampBpm(prev + delta)), []);

  const finish = useCallback(() => {
    player.stop();
    setFinished(true);
  }, [player]);

  const reset = useCallback(() => {
    player.stop();
    baseRef.current = 0;
    startedAtRef.current = null;
    setElapsedSec(0);
    setFinished(false);
  }, [player]);

  return {
    bpm,
    setBpm,
    nudgeBpm,
    playing: player.playing,
    toggle: player.toggle,
    currentStep: player.currentStep,
    elapsedSec: Math.floor(elapsedSec),
    remainingSec: Math.max(0, Math.ceil(targetSec - elapsedSec)),
    finished,
    finish,
    reset,
  };
}
