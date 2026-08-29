'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { scheduleClick } from '@/lib/audio/click';
import { getMasterBus } from '@/lib/audio/bus';
import type { ScheduledStep, TempoSpec } from '@/lib/audio/scheduler';
import { useStepPlayer } from '@/hooks/useStepPlayer';
import { useMidiInput } from '@/hooks/useMidiInput';
import { useMicInput } from '@/hooks/useMicInput';
import { useSettings } from '@/hooks/useSettings';
import { expectedFrom, matchHit, median, type HitEvent } from '@/lib/judge';
import { OffsetHistogram } from '@/components/OffsetHistogram';
import { Card, Chip, Eyebrow } from '@/components/ui';

/**
 * キャリブレーション（spec.md §6.3）。
 *
 * イヤホンの出力遅延と入力の遅延は端末ごとに違うので実測する。
 * 80BPM の4分クリックを鳴らし、1小節のカウントインのあと16打叩いてもらい、
 * オフセットの中央値を採る（平均ではない。外れ値に強いため）。
 *
 * MIDI（自宅）とマイク（外）は遅延の量が違うので、別々に測って別々に保存する。
 */
const BPM = 80;
const COUNT_IN_BEATS = 4;
const TARGET_HITS = 16;
const STEP_SEC = 60 / BPM;

type Source = 'midi' | 'mic';

export function Calibration() {
  const { settings, update } = useSettings();
  const [source, setSource] = useState<Source>('midi');
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

  const handleHit = useCallback(
    (hit: HitEvent) => {
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
    [player],
  );

  const midi = useMidiInput({
    enabled: source === 'midi' && player.playing,
    noteMap: settings?.midiNoteMap,
    onHit: handleHit,
  });

  const mic = useMicInput({
    enabled: source === 'mic' && player.playing,
    threshold: settings?.micThreshold,
    onHit: handleHit,
  });

  const done = offsets.length >= TARGET_HITS;
  const value = Math.round(median(offsets));
  const spread = offsets.length > 1 ? Math.round(Math.max(...offsets) - Math.min(...offsets)) : 0;
  const savedValue = source === 'midi' ? settings?.midiOffsetMs : settings?.micOffsetMs;

  const reset = useCallback(() => {
    player.stop();
    offsetsRef.current = [];
    countInEndRef.current = null;
    setOffsets([]);
    setSaved(false);
  }, [player]);

  const sources: { id: Source; label: string; available: boolean | null; note: string }[] = [
    { id: 'midi', label: 'MIDI（自宅）', available: midi.supported, note: '電子ドラムを繋いで叩く' },
    { id: 'mic', label: 'マイク（外）', available: mic.supported, note: '練習パッドを叩く' },
  ];

  const current = sources.find((s) => s.id === source)!;

  return (
    <div className="flex flex-col gap-4">
      <Card className="px-4 py-4">
        <div className="mb-2">
          <Eyebrow>測るもの</Eyebrow>
        </div>
        <div className="flex gap-1.5">
          {sources.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === source}
              disabled={item.available === false}
              onClick={() => {
                reset();
                setSource(item.id);
              }}
              className={`min-h-14 flex-1 touch-manipulation rounded-lg border px-2 transition-colors disabled:opacity-30 ${
                item.id === source
                  ? 'border-chrome bg-chrome text-bg'
                  : 'border-edge2 bg-panel2 text-dim hover:text-txt active:bg-raised'
              }`}
            >
              <span className="block text-[13px] font-semibold">{item.label}</span>
              <span className={`block text-[10px] ${item.id === source ? 'text-bg/70' : 'text-silk'}`}>
                {item.note}
              </span>
            </button>
          ))}
        </div>
        {current.available === false && (
          <p className="mt-2 text-[12px] text-dim">
            この端末では{current.label}を使えません。
          </p>
        )}
      </Card>

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
          disabled={current.available === false}
          onClick={player.playing ? reset : () => {
            reset();
            player.toggle();
          }}
          className={`mt-4 h-14 w-full touch-manipulation rounded-xl font-mono text-[14px] font-bold tracking-[0.22em] uppercase transition-colors disabled:opacity-30 ${
            player.playing
              ? 'border border-edge2 bg-raised text-txt active:bg-panel2'
              : 'bg-chrome text-bg active:bg-dim'
          }`}
        >
          {player.playing ? 'Stop' : done ? 'Retry' : 'Start'}
        </button>

        {player.playing && source === 'mic' && (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-panel2">
              <div
                className="h-full rounded-full bg-chrome transition-[width] duration-75"
                style={{ width: `${Math.min(100, mic.level * 300)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-silk">
              {mic.measuring ? '環境ノイズを測定中…' : '録音中。音声は保存されません'}
            </p>
          </div>
        )}
        {player.playing && countInEndRef.current === null && (
          <p className="mt-2 text-center text-[12px] text-dim">カウントイン中…</p>
        )}
        {(midi.error || mic.error) && (
          <p className="mt-2 text-[12px] text-snare">{midi.error ?? mic.error}</p>
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

          <OffsetHistogram offsets={offsets} />

          <p className="mt-3 border-t border-edge pt-3 text-[12px] text-dim">
            中央値を採ります（平均ではありません。外れ値に強いため）。
            {offsets.length < TARGET_HITS && ' 途中で保存しても構いません。'}
          </p>

          <button
            type="button"
            disabled={saved}
            onClick={async () => {
              await update(source === 'midi' ? { midiOffsetMs: value } : { micOffsetMs: value });
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
            <dd className="font-mono tnum">{settings?.micOffsetMs ?? 0} ms</dd>
          </div>
        </dl>
        {savedValue !== undefined && (
          <p className="mt-2 text-[11px] text-silk">
            いま測っているのは「{current.label}」です。
          </p>
        )}
      </Card>

      <Link href="/settings" className="inline-flex min-h-11 items-center text-[12px] text-dim">
        ← 設定へ戻る
      </Link>
    </div>
  );
}
