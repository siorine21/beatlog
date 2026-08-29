'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureAudioContext } from '@/lib/audio/context';
import { scheduleClick, type ClickKind } from '@/lib/audio/click';
import { LookaheadScheduler, type ScheduledStep, type TempoSpec } from '@/lib/audio/scheduler';

export const BPM_MIN = 30;
export const BPM_MAX = 240;

/**
 * 拍子。BPM は「その拍子の拍」の速さとして扱う。
 * 6/8 は8分音符を1拍として6拍と数える（複合拍子を2拍で感じる流儀は取らない）。
 */
export const METERS = [
  { id: '4/4', label: '4/4', beatsPerBar: 4 },
  { id: '3/4', label: '3/4', beatsPerBar: 3 },
  { id: '6/8', label: '6/8', beatsPerBar: 6 },
] as const;

export type MeterId = (typeof METERS)[number]['id'];

/** サブディビジョン（1拍の分割数） */
export const SUBDIVISIONS = [
  { id: 'quarter', label: '4分', stepsPerBeat: 1 },
  { id: 'eighth', label: '8分', stepsPerBeat: 2 },
  { id: 'sixteenth', label: '16分', stepsPerBeat: 4 },
  { id: 'triplet', label: '3連', stepsPerBeat: 3 },
] as const;

export type SubdivisionId = (typeof SUBDIVISIONS)[number]['id'];

const meterOf = (id: MeterId) => METERS.find((m) => m.id === id)!;
const subdivisionOf = (id: SubdivisionId) => SUBDIVISIONS.find((s) => s.id === id)!;

const clampBpm = (v: number) => Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(v)));

/** タップテンポ: これ以上間隔が空いたら数え直す */
const TAP_RESET_MS = 2000;
const TAP_SAMPLES = 5;

export function useMetronome() {
  const [bpm, setBpmState] = useState(120);
  const [meterId, setMeterIdState] = useState<MeterId>('4/4');
  const [subdivisionId, setSubdivisionIdState] = useState<SubdivisionId>('quarter');
  const [playing, setPlaying] = useState(false);
  /** 小節内の現在ステップ。停止中は -1 */
  const [currentStep, setCurrentStep] = useState(-1);

  const schedulerRef = useRef<LookaheadScheduler | null>(null);
  const frameRef = useRef<number | null>(null);
  const tapsRef = useRef<number[]>([]);

  const meter = meterOf(meterId);
  const subdivision = subdivisionOf(subdivisionId);
  const stepsPerBar = meter.beatsPerBar * subdivision.stepsPerBeat;

  /** 予約されたステップに対して音を割り当てる。DOM には触れない（spec.md §6.1） */
  const handleStep = useCallback((step: ScheduledStep, spec: TempoSpec) => {
    const scheduler = schedulerRef.current;
    if (!scheduler) return;
    const onBeat = step.step % spec.stepsPerBeat === 0;
    const kind: ClickKind = !onBeat ? 'sub' : step.step === 0 ? 'accent' : 'beat';
    scheduleClick(scheduler.context, scheduler.context.destination, kind, step.time);
  }, []);

  /** 画面のハイライトは rAF で currentTime と予約列を突き合わせて決める */
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
      schedulerRef.current = new LookaheadScheduler(ctx, handleStep);
    }
    schedulerRef.current.start({
      bpm,
      beatsPerBar: meter.beatsPerBar,
      stepsPerBeat: subdivision.stepsPerBeat,
    });
    setPlaying(true);
    frameRef.current = requestAnimationFrame(runFrameLoop);
  }, [bpm, handleStep, meter.beatsPerBar, runFrameLoop, subdivision.stepsPerBeat]);

  const toggle = useCallback(() => {
    if (playing) stop();
    else void start();
  }, [playing, start, stop]);

  const setBpm = useCallback((value: number) => {
    const next = clampBpm(value);
    setBpmState(next);
    // 再生中でも即座に反映する。予約済みの音は動かさないので位相は飛ばない
    schedulerRef.current?.setBpm(next);
  }, []);

  const nudgeBpm = useCallback((delta: number) => {
    setBpmState((prev) => {
      const next = clampBpm(prev + delta);
      schedulerRef.current?.setBpm(next);
      return next;
    });
  }, []);

  const setMeterId = useCallback(
    (id: MeterId) => {
      setMeterIdState(id);
      schedulerRef.current?.setMeter(meterOf(id).beatsPerBar, subdivision.stepsPerBeat);
    },
    [subdivision.stepsPerBeat],
  );

  const setSubdivisionId = useCallback(
    (id: SubdivisionId) => {
      setSubdivisionIdState(id);
      schedulerRef.current?.setMeter(meter.beatsPerBar, subdivisionOf(id).stepsPerBeat);
    },
    [meter.beatsPerBar],
  );

  /**
   * タップテンポ。ここでの performance.now() は画面上の入力間隔を測るためだけに使い、
   * 音の時刻計算（AudioContext.currentTime）とは混ぜない（CLAUDE.md）。
   */
  const tap = useCallback(() => {
    const now = performance.now();
    const taps = tapsRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > TAP_RESET_MS) taps.length = 0;
    taps.push(now);
    if (taps.length > TAP_SAMPLES) taps.shift();
    if (taps.length < 2) return;

    const intervals = taps.slice(1).map((t, i) => t - taps[i]);
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (mean > 0) setBpm(60000 / mean);
  }, [setBpm]);

  // 画面を離れるときは必ず止める
  useEffect(() => () => stop(), [stop]);

  return {
    bpm,
    setBpm,
    nudgeBpm,
    tap,
    playing,
    toggle,
    currentStep,
    currentBeat: currentStep < 0 ? -1 : Math.floor(currentStep / subdivision.stepsPerBeat),
    meterId,
    setMeterId,
    beatsPerBar: meter.beatsPerBar,
    subdivisionId,
    setSubdivisionId,
    stepsPerBeat: subdivision.stepsPerBeat,
    stepsPerBar,
  };
}
