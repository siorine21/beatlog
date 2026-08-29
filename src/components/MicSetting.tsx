'use client';

import { useEffect, useRef, useState } from 'react';
import { useMicInput } from '@/hooks/useMicInput';
import { useSettings } from '@/hooks/useSettings';
import { NOISE_SAMPLE_SEC } from '@/lib/mic';
import { Card, Chip, Eyebrow } from '@/components/ui';

/**
 * マイクの閾値調整（spec.md §6.5）。
 *
 * 「試す」を押したときだけマイクを掴み、離れるときに必ず解放する。
 * 録音しているあいだは画面に出したままにする（CLAUDE.md）。
 */
export function MicSetting() {
  const { settings, update } = useSettings();
  const [testing, setTesting] = useState(false);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mic = useMicInput({
    enabled: testing,
    threshold: settings?.micThreshold,
    onHit: () => {
      setHits((prev) => prev + 1);
      setFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(false), 120);
    },
  });

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  const stored = settings?.micThreshold ?? 0;
  const threshold = mic.threshold ?? (stored > 0 ? stored : 0.1);
  const auto = stored === 0;

  if (mic.supported === null) {
    return <Card className="px-4 py-4 text-[13px] text-dim">確認しています…</Card>;
  }

  if (!mic.supported) {
    return (
      <Card className="px-4 py-4">
        <div className="mb-1.5">
          <Eyebrow>マイク</Eyebrow>
        </div>
        <p className="text-[13px] text-dim">この端末ではマイクを使えません。</p>
      </Card>
    );
  }

  return (
    <Card className="px-4 py-4">
      <div className="mb-1.5 flex items-center justify-between">
        <Eyebrow>マイクの感度</Eyebrow>
        {testing && <Chip tone="quiet">録音中</Chip>}
      </div>

      <p className="mb-3 text-[12px] text-dim">
        外モード（練習パッド）で打点を拾うための設定です。試すを押すと環境ノイズを
        {NOISE_SAMPLE_SEC}秒はかり、閾値を自動で決めます。音声は保存も送信もしません。
      </p>

      {mic.error && <p className="mb-2 text-[12px] text-snare">{mic.error}</p>}

      {/* 入力レベル。打点を拾うと光る */}
      <div className="mb-1 flex items-center gap-2.5">
        <span
          className={`h-3 w-3 shrink-0 rounded-full transition-colors ${
            flash ? 'bg-chrome' : 'bg-edge2'
          }`}
          aria-hidden
        />
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-panel2">
          <div
            className="h-full rounded-full bg-chrome transition-[width] duration-75"
            style={{ width: `${Math.min(100, mic.level * 300)}%` }}
          />
          {/* 閾値の位置 */}
          <span
            className="absolute top-0 h-full w-[2px] bg-snare"
            style={{ left: `${Math.min(100, threshold * 300)}%` }}
            aria-hidden
          />
        </div>
        <span className="w-10 shrink-0 text-right font-mono text-[10px] tnum text-silk">
          {hits} 打
        </span>
      </div>
      <p className="mb-3 text-[10px] text-silk">
        赤い線が閾値。これを超えた立ち上がりを打点とみなします。
      </p>

      <label className="flex h-11 items-center gap-3">
        <span className="w-16 shrink-0 text-[12px] text-silk">閾値</span>
        <input
          type="range"
          min={1}
          max={50}
          value={Math.round(threshold * 100)}
          onChange={(e) => mic.setThreshold(Number(e.target.value) / 100)}
          className="bpm-slider w-full"
        />
        <span className="w-10 shrink-0 text-right font-mono text-[11px] tnum">
          {threshold.toFixed(2)}
        </span>
      </label>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setHits(0);
            setTesting((prev) => !prev);
          }}
          className={`min-h-11 flex-1 touch-manipulation rounded-lg text-[13px] font-semibold transition-colors ${
            testing
              ? 'border border-edge2 bg-raised text-txt active:bg-panel2'
              : 'bg-chrome text-bg active:bg-dim'
          }`}
        >
          {testing ? (mic.measuring ? '環境ノイズを測定中…' : '止める') : 'マイクを試す'}
        </button>
        <button
          type="button"
          disabled={mic.threshold === null}
          onClick={() => void update({ micThreshold: threshold })}
          className="min-h-11 touch-manipulation rounded-lg border border-edge2 bg-panel2 px-4 text-[13px] text-txt disabled:opacity-40"
        >
          この値を保存
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-silk">
          保存済み: {auto ? '自動（環境ノイズから決める）' : stored.toFixed(2)}
        </span>
        {!auto && (
          <button
            type="button"
            onClick={() => void update({ micThreshold: 0 })}
            className="min-h-11 touch-manipulation px-1 text-[12px] text-dim underline"
          >
            自動に戻す
          </button>
        )}
      </div>
    </Card>
  );
}
