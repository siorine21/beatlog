'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureAudioContext } from '@/lib/audio/context';
import { LookaheadScheduler, type ScheduledStep, type TempoSpec } from '@/lib/audio/scheduler';

/**
 * 先読みスケジューラの起動・停止と、現在ステップの取り出しをまとめたもの。
 * メトロノーム（Phase 1）とパターン再生（Phase 2）で共有する。
 *
 * 音を鳴らすのは onStep の役目で、ここでは何も鳴らさない。
 * 画面のハイライトは requestAnimationFrame で currentTime と予約列を
 * 突き合わせて決める（スケジューラから DOM を触らない。spec.md §6.1）。
 */
export interface StepPlayerOptions {
  bpm: number;
  beatsPerBar: number;
  stepsPerBeat: number;
  onStep: (step: ScheduledStep, spec: TempoSpec, ctx: AudioContext) => void;
}

export function useStepPlayer({ bpm, beatsPerBar, stepsPerBeat, onStep }: StepPlayerOptions) {
  const [playing, setPlaying] = useState(false);
  /** 小節内の現在ステップ。停止中は -1 */
  const [currentStep, setCurrentStep] = useState(-1);

  const schedulerRef = useRef<LookaheadScheduler | null>(null);
  const frameRef = useRef<number | null>(null);
  // 予約のたびに最新の onStep を呼ぶ（依存が変わってもスケジューラは作り直さない）
  const onStepRef = useRef(onStep);
  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  const runFrameLoop = useCallback(() => {
    const scheduler = schedulerRef.current;
    if (!scheduler || !scheduler.playing) return;
    const entry = scheduler.currentStepAt(scheduler.context.currentTime);
    const next = entry ? entry.step : -1;
    setCurrentStep((prev) => (prev === next ? prev : next));
    frameRef.current = requestAnimationFrame(runFrameLoop);
  }, []);

  const stop = useCallback(() => {
    schedulerRef.current?.stop();
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setPlaying(false);
    setCurrentStep(-1);
  }, []);

  /** 必ずユーザー操作のハンドラから呼ぶこと（AudioContext の生成・resume を含む） */
  const start = useCallback(async () => {
    const ctx = await ensureAudioContext();
    if (!schedulerRef.current || schedulerRef.current.context !== ctx) {
      schedulerRef.current = new LookaheadScheduler(ctx, (step, spec) =>
        onStepRef.current(step, spec, ctx),
      );
    }
    schedulerRef.current.start({ bpm, beatsPerBar, stepsPerBeat });
    setPlaying(true);
    frameRef.current = requestAnimationFrame(runFrameLoop);
  }, [beatsPerBar, bpm, runFrameLoop, stepsPerBeat]);

  const toggle = useCallback(() => {
    if (playing) stop();
    else void start();
  }, [playing, start, stop]);

  // 再生中の変更を反映する。予約済みの音は動かさないので位相は飛ばない
  useEffect(() => {
    schedulerRef.current?.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    schedulerRef.current?.setMeter(beatsPerBar, stepsPerBeat);
  }, [beatsPerBar, stepsPerBeat]);

  // 画面を離れるときは必ず止める
  useEffect(() => () => stop(), [stop]);

  /** 予約済みのステップ列。判定（Phase 4）から読む */
  const getScheduled = useCallback(() => schedulerRef.current?.scheduledSteps ?? [], []);
  /** 1ステップの長さ（秒） */
  const getStepDuration = useCallback(() => schedulerRef.current?.stepDuration ?? 0, []);

  return { playing, currentStep, start, stop, toggle, getScheduled, getStepDuration };
}
