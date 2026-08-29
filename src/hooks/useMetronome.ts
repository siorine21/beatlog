'use client';

import { useCallback, useRef, useState } from 'react';
import { scheduleClick, type ClickKind } from '@/lib/audio/click';
import { getMasterBus } from '@/lib/audio/bus';
import type { ScheduledStep, TempoSpec } from '@/lib/audio/scheduler';
import { useStepPlayer } from './useStepPlayer';

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

export const clampBpm = (v: number) => Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(v)));

/** タップテンポ: これ以上間隔が空いたら数え直す */
const TAP_RESET_MS = 2000;
const TAP_SAMPLES = 5;

export function useMetronome() {
  const [bpm, setBpmState] = useState(120);
  const [meterId, setMeterId] = useState<MeterId>('4/4');
  const [subdivisionId, setSubdivisionId] = useState<SubdivisionId>('quarter');
  const tapsRef = useRef<number[]>([]);

  const meter = meterOf(meterId);
  const subdivision = subdivisionOf(subdivisionId);

  /** 拍の頭は高く、小節の頭はさらに高く、拍を割った位置は控えめに */
  const onStep = useCallback((step: ScheduledStep, spec: TempoSpec, ctx: AudioContext) => {
    const onBeat = step.step % spec.stepsPerBeat === 0;
    const kind: ClickKind = !onBeat ? 'sub' : step.step === 0 ? 'accent' : 'beat';
    scheduleClick(ctx, getMasterBus(ctx), kind, step.time);
  }, []);

  const player = useStepPlayer({
    bpm,
    beatsPerBar: meter.beatsPerBar,
    stepsPerBeat: subdivision.stepsPerBeat,
    onStep,
  });

  const setBpm = useCallback((value: number) => setBpmState(clampBpm(value)), []);
  const nudgeBpm = useCallback((delta: number) => setBpmState((prev) => clampBpm(prev + delta)), []);

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

  return {
    bpm,
    setBpm,
    nudgeBpm,
    tap,
    playing: player.playing,
    toggle: player.toggle,
    currentStep: player.currentStep,
    currentBeat:
      player.currentStep < 0 ? -1 : Math.floor(player.currentStep / subdivision.stepsPerBeat),
    meterId,
    setMeterId,
    beatsPerBar: meter.beatsPerBar,
    subdivisionId,
    setSubdivisionId,
    stepsPerBeat: subdivision.stepsPerBeat,
    stepsPerBar: meter.beatsPerBar * subdivision.stepsPerBeat,
  };
}
