'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { scheduleClick } from '@/lib/audio/click';
import { getMasterBus } from '@/lib/audio/bus';
import type { ScheduledStep, TempoSpec } from '@/lib/audio/scheduler';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import { useMidiInput } from '@/hooks/useMidiInput';
import { useSettings } from '@/hooks/useSettings';
import { expectedFrom, histogram, matchHit, median } from '@/lib/judge';
import { Card, Chip, Eyebrow } from '@/components/ui';

/**
 * キャリブレーション（spec.md §6.3）。
 *
 * イヤホンの出力遅延と MIDI 入力遅延は端末ごとに違うので実測する。
 * 80BPM の4分クリックを鳴らし、1小節のカウントインのあと16打叩いてもらい、
 * オフセットの中央値を採る（平均ではない。外れ値に強いため）。
 */
const BPM = 80;
const COUNT_IN_BEATS = 4;
const TARGET_HITS = 16;
const STEP_SEC = 60 / BPM;

export function Calibration() {
  const { settings, update } = useSettings();
  const [offsets, setOffsets] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);
  const countInEndRef = useRef<number | null>(null);
  const offsetsRef = useRef<number[]>([]);

  const onStep = useCallback((step: ScheduledStep, _spec: TempoSpec, ctx: AudioContext) => {
    scheduleClick(ctx, getMasterBus(ctx), step.step === 0 ? 'accent' : 'beat', step.time);
    // 最初の1小節はカウントイン。その終わりの時刻を覚えておく
    if (step.index === 0) countInEndRef.current = step.time + COUNT_IN_BEATS * STEP_SEC;
  }, []);

  const player = useStepPlayer({ bpm: BPM, beatsPerBar: 4, stepsPerBeat: 1, onStep });

  const done = offsets.length >= TARGET_HITS;

  useMidiInput({
    enabled: player.playing,
    noteMap: settings?.midiNoteMap,
    onHit: (hit) => {
      const countInEnd = countInEndRef.current;
      if (countInEnd === null || hit.time < countInEnd) return; // カウントイン中は数えない
      if (offsetsRef.current.length >= TARGET_HITS) return;

      // ここではキャリブレーション値を引かない。生のズレそのものを測る
      const match = matchHit(hit, expectedFrom(player.getScheduled()), {
        stepDurationSec: STEP_SEC,
        calibrationOffsetMs: 0,
      });
      if (!match) return;

      offsetsRef.current = [...offsetsRef.current, match.offsetMs];
      setOffsets(offsetsRef.current);
      if (offsetsRef.current.length >= TARGET_HITS) player.stop();
    },
  });

  const midi = useMidiInput({ enabled: false, noteMap: settings?.midiNoteMap, onHit: () => {} });

  const start = () => {
    offsetsRef.current = [];
    countInEndRef.current = null;
    setOffsets([]);
    setSaved(false);
    player.toggle();
  };

  const reset = () => {
    player.stop();
    offsetsRef.current = [];
    countInEndRef.current = null;
    setOffsets([]);
    setSaved(false);
  };

  const value = Math.round(median(offsets));
  const spread = offsets.length > 1 ? Math.round(Math.max(...offsets) - Math.min(...offsets)) : 0;
  const bars = histogram(offsets, 20, 7);
  const maxBar = Math.max(1, ...bars);

  if (midi.supported === null) {
    return <Card className="px-4 py-4 text-[13px] text-dim">確認しています…</Card>;
  }

  if (!midi.supported) {
    return (
      <Card className="px-4 py-4">
        <p className="text-[13px] text-dim">
          この端末は Web MIDI に対応していないため、MIDI のキャリブレーションはできません。
          マイク（out モード）のキャリブレーションは Phase 5 で追加します。
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="px-4 py-4">
        <div className="mb-2">
          <Eyebrow>手順</Eyebrow>
        </div>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-[13px] text-dim">
          <li>普段の練習と同じイヤホン・音量にする</li>
          <li>開始すると 80BPM のクリックが鳴る</li>
          <li>1小節のカウントインのあと、クリックちょうどに {TARGET_HITS} 回叩く</li>
        </ol>
      </Card>

      <Card className="px-4 py-4">
        <div className="flex items-end justify-center gap-2">
          <span className="text-[64px] leading-[0.85] font-extrabold tracking-[-0.05em] tnum">
            {offsets.length}
          </span>
          <span className="pb-2 font-mono text-[11px] text-silk">/ {TARGET_HITS} 打</span>
        </div>

        <button
          type="button"
          onClick={player.playing ? reset : start}
          className={`mt-4 h-14 w-full touch-manipulation rounded-xl font-mono text-[14px] font-bold tracking-[0.22em] uppercase transition-colors ${
            player.playing
              ? 'border border-edge2 bg-raised text-txt active:bg-panel2'
              : 'bg-chrome text-bg active:bg-dim'
          }`}
        >
          {player.playing ? 'Stop' : done ? 'Retry' : 'Start'}
        </button>

        {player.playing && countInEndRef.current === null && (
          <p className="mt-2 text-center text-[12px] text-dim">カウントイン中…</p>
        )}
      </Card>

      {offsets.length > 0 && (
        <Card className="px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <Eyebrow>実測</Eyebrow>
            <div className="flex gap-1.5">
              <Chip tone="mono">中央値 {value} ms</Chip>
              <Chip tone="mono">ばらつき {spread} ms</Chip>
            </div>
          </div>

          <div className="flex h-20 items-end gap-1.5" aria-hidden>
            {bars.map((count, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-[3px] bg-chrome"
                  style={{ height: `${Math.max(2, (count / maxBar) * 60)}px` }}
                />
                <span className="font-mono text-[9px] tnum text-silk">
                  {(index - 3) * 20}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-center text-[10px] text-silk">
            横軸: ズレ（ms）。負が走り、正がもたり
          </p>

          <p className="mt-3 border-t border-edge pt-3 text-[12px] text-dim">
            中央値を採ります（平均ではありません。外れ値に強いため）。
            {offsets.length < TARGET_HITS && ' 途中で保存しても構いません。'}
          </p>

          <button
            type="button"
            disabled={saved}
            onClick={async () => {
              await update({ midiOffsetMs: value });
              setSaved(true);
            }}
            className="mt-3 h-12 w-full touch-manipulation rounded-xl bg-chrome font-mono text-[13px] font-bold tracking-[0.2em] text-bg uppercase disabled:opacity-40"
          >
            {saved ? 'Saved' : 'Save'}
          </button>
        </Card>
      )}

      <Card className="px-4 py-3.5">
        <div className="mb-1.5">
          <Eyebrow>いまの設定</Eyebrow>
        </div>
        <dl className="flex flex-col gap-1 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-silk">MIDI の遅延</dt>
            <dd className="font-mono tnum">{settings?.midiOffsetMs ?? 0} ms</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-silk">マイクの遅延</dt>
            <dd className="font-mono tnum text-dim">Phase 5 で測定</dd>
          </div>
        </dl>
      </Card>

      <Link href="/settings" className="inline-flex min-h-11 items-center text-[12px] text-dim">
        ← 設定へ戻る
      </Link>
    </div>
  );
}
