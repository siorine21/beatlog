'use client';

import Link from 'next/link';
import { usePatternPlayer } from '@/hooks/usePatternPlayer';
import { BPM_MAX, BPM_MIN } from '@/hooks/useMetronome';
import { RhythmGrid } from '@/components/RhythmGrid';
import { Card, Chip, Eyebrow } from '@/components/ui';
import type { RhythmPattern } from '@/lib/types';

/**
 * パターン詳細。グリッド・再生・BPM・口ドラム表記を出す。
 * 五線譜は Phase 2b でここに足す。currentStep をそのまま渡せる形にしてある。
 */
export function PatternPlayer({ pattern }: { pattern: RhythmPattern }) {
  const p = usePatternPlayer(pattern);

  return (
    <main className="flex flex-col gap-5">
      <section className="pt-2">
        <Link href="/patterns" className="inline-flex min-h-11 items-center text-[12px] text-dim">
          ← パターン一覧
        </Link>
        <h1 className="text-[26px] leading-tight font-bold tracking-tight">{pattern.name}</h1>
        <div className="mt-2 flex gap-1.5">
          <Chip tone="mono">Lv{pattern.level}</Chip>
          <Chip tone="mono">{pattern.resolution}分割</Chip>
          <Chip tone="mono">
            推奨 {pattern.bpmRange[0]}–{pattern.bpmRange[1]} bpm
          </Chip>
        </div>
      </section>

      {/* 口ドラム表記は大きく出す（spec.md §3.2） */}
      <Card className="px-4 py-4">
        <div className="mb-2">
          <Eyebrow>口ドラム</Eyebrow>
        </div>
        <p className="text-[20px] leading-relaxed tracking-[0.1em]">{pattern.vocal}</p>
      </Card>

      <Card className="px-4 py-4">
        <RhythmGrid pattern={pattern} currentStep={p.currentStep} />
      </Card>

      <Card className="px-4 pt-4 pb-4">
        <div className="flex items-end justify-center gap-2">
          <span className="text-[64px] leading-[0.85] font-extrabold tracking-[-0.05em] tnum">
            {p.bpm}
          </span>
          <span className="pb-2 font-mono text-[10px] tracking-[0.2em] text-silk uppercase">
            bpm
          </span>
        </div>

        <label className="mt-4 flex h-11 items-center">
          <span className="sr-only">BPM</span>
          <input
            type="range"
            min={BPM_MIN}
            max={BPM_MAX}
            value={p.bpm}
            onChange={(e) => p.setBpm(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-edge2 accent-chrome"
          />
        </label>

        <div className="mt-2 flex gap-1.5">
          {[-5, -1, 1, 5].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => p.nudgeBpm(delta)}
              className="h-12 flex-1 touch-manipulation rounded-lg border border-edge2 bg-panel2 font-mono text-[14px] text-txt transition-colors hover:border-chrome active:bg-raised"
            >
              {delta > 0 ? `+${delta}` : `−${-delta}`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={p.toggle}
          aria-pressed={p.playing}
          className={`mt-4 h-14 w-full touch-manipulation rounded-xl font-mono text-[14px] font-bold tracking-[0.22em] uppercase transition-colors ${
            p.playing
              ? 'border border-edge2 bg-raised text-txt active:bg-panel2'
              : 'bg-chrome text-bg hover:bg-txt active:bg-dim'
          }`}
        >
          {p.playing ? 'Stop' : 'Start'}
        </button>

        <label className="mt-3 flex min-h-11 touch-manipulation items-center gap-2.5 text-[13px] text-dim">
          <input
            type="checkbox"
            checked={p.withClick}
            onChange={(e) => p.setWithClick(e.target.checked)}
            className="h-5 w-5 accent-chrome"
          />
          クリックを重ねる
        </label>
      </Card>

      {pattern.note && (
        <Card className="px-4 py-3.5">
          <div className="mb-1.5">
            <Eyebrow>どこで使うか</Eyebrow>
          </div>
          <p className="text-[13px] leading-relaxed text-dim">{pattern.note}</p>
        </Card>
      )}
    </main>
  );
}
