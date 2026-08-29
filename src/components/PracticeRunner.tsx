'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPattern } from '@/data/patterns';
import { targetSecOf, nextTargetBpm } from '@/lib/menu';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { usePracticeMode } from '@/hooks/usePracticeMode';
import { useTodayMenu } from '@/hooks/useTodayMenu';
import { BPM_MAX, BPM_MIN } from '@/hooks/useMetronome';
import { BpmSlider } from '@/components/BpmSlider';
import { RhythmGrid } from '@/components/RhythmGrid';
import { Card, Chip, Eyebrow } from '@/components/ui';
import type { Drill, Subjective } from '@/lib/types';
import type { RecordAttemptResult } from '@/lib/store';

const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

const SUBJECTIVE: { id: Subjective; label: string; note: string }[] = [
  { id: 'good', label: 'よかった', note: '狙いどおり' },
  { id: 'ok', label: 'まあまあ', note: '通せた' },
  { id: 'bad', label: 'だめ', note: '崩れた' },
];

/**
 * 練習実行画面（spec.md §7）。
 * 判定値（ズレの数値）は Phase 4 の MIDI / マイク入力が入ってから表示する。
 */
export function PracticeRunner({ drill }: { drill: Drill }) {
  const pattern = drill.patternId ? getPattern(drill.patternId) : undefined;
  const { mode, ready } = usePracticeMode();
  const { menu } = useTodayMenu(mode, ready);

  const item = menu?.items.find((i) => i.drillId === drill.id);
  const targetSec = item?.targetSec ?? targetSecOf(drill);
  const targetBpm = item?.targetBpm ?? nextTargetBpm(drill, []);

  const session = usePracticeSession({
    initialBpm: targetBpm > 0 ? targetBpm : 80,
    targetSec,
    pattern,
  });

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<RecordAttemptResult | null>(null);

  // メニューが後から読めたら、まだ触っていない BPM を目標値に合わせる
  const [bpmInitialized, setBpmInitialized] = useState(false);
  useEffect(() => {
    if (bpmInitialized || !item || item.targetBpm <= 0) return;
    session.setBpm(item.targetBpm);
    setBpmInitialized(true);
  }, [bpmInitialized, item, session]);

  const checklist = drill.checkpoints ?? [];
  const isChecklist = checklist.length > 0;
  const allChecked = isChecklist && checklist.every((c) => checked.has(c));
  // フォームの確認だけのドリルはテンポを持たない。記録にも残さない
  const recordedBpm = isChecklist ? 0 : session.bpm;
  const canSave = isChecklist ? allChecked : session.elapsedSec > 0;

  const save = async (subjective: Subjective) => {
    setSaving(true);
    const { recordAttempt } = await import('@/lib/store');
    const saved = await recordAttempt({
      drillId: drill.id,
      mode,
      menuId: menu?.id,
      bpm: recordedBpm,
      durationSec: session.elapsedSec,
      subjective,
      checkedAll: isChecklist ? allChecked : undefined,
    });
    setResult(saved);
    setSaving(false);
  };

  if (result) {
    return (
      <main className="flex flex-col gap-5 pt-2">
        <h1 className="text-[24px] leading-tight font-bold tracking-tight">記録しました</h1>

        <Card className="px-4 py-4">
          <Eyebrow>{drill.name}</Eyebrow>
          <dl className="mt-2 flex flex-col gap-1.5 text-[13px]">
            {result.attempt.bpm > 0 && (
              <div className="flex justify-between">
                <dt className="text-silk">テンポ</dt>
                <dd className="font-mono tnum">{result.attempt.bpm} bpm</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-silk">時間</dt>
              <dd className="font-mono tnum">{clock(result.attempt.durationSec)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-silk">卒業条件</dt>
              <dd>{result.graduated ? '達成' : 'まだ'}</dd>
            </div>
          </dl>
        </Card>

        {result.graduated && (
          <Card className="border-ok px-4 py-4">
            <p className="text-[15px] font-bold">卒業しました</p>
            <p className="mt-1 text-[13px] text-dim">
              {isChecklist
                ? 'チェック項目をすべて確認しました。'
                : 'このドリルの条件を満たしました。次はテンポを上げて取り組めます。'}
            </p>
          </Card>
        )}

        {result.unlockedTo && (
          <Card className="border-chrome px-4 py-4">
            <p className="text-[15px] font-bold">Lv{result.unlockedTo} が解放されました</p>
            <p className="mt-1 text-[13px] text-dim">
              新しいドリルとリズムパターンが選べるようになりました。
            </p>
          </Card>
        )}

        <div className="flex gap-2">
          <Link
            href="/"
            className="flex min-h-14 flex-1 touch-manipulation items-center justify-center rounded-xl bg-chrome font-mono text-[13px] font-bold tracking-[0.2em] text-bg uppercase"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              session.reset();
              setChecked(new Set());
            }}
            className="min-h-14 flex-1 touch-manipulation rounded-xl border border-edge2 bg-panel2 text-[13px] text-txt"
          >
            もう一度
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4">
      <section className="pt-2">
        <Link href="/" className="inline-flex min-h-11 items-center text-[12px] text-dim">
          ← ホーム
        </Link>
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-[22px] leading-tight font-bold tracking-tight">{drill.name}</h1>
          {!isChecklist && (
            <span className="shrink-0 font-mono text-[18px] tnum text-txt">
              残り {clock(session.remainingSec)}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip tone="mono">Lv{drill.level}</Chip>
          {targetBpm > 0 && <Chip tone="mono">目標 {targetBpm} bpm</Chip>}
          {!isChecklist && <Chip tone="mono">{Math.round(targetSec / 60)} 分</Chip>}
        </div>
      </section>

      <Card className="px-4 py-3.5">
        <p className="text-[13px] leading-relaxed text-dim">{drill.instruction}</p>
      </Card>

      {!isChecklist && (
      <Card className="px-4 pt-4 pb-4">
        <div className="flex items-end justify-center gap-2">
          <span className="text-[72px] leading-[0.82] font-extrabold tracking-[-0.055em] tnum">
            {session.bpm}
          </span>
          <span className="pb-2 font-mono text-[10px] tracking-[0.2em] text-silk uppercase">
            bpm
          </span>
        </div>

        <div className="mt-4">
          <BpmSlider value={session.bpm} min={BPM_MIN} max={BPM_MAX} onChange={session.setBpm} />
        </div>

        <div className="mt-2 flex gap-1.5">
          {[-5, -1, 1, 5].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => session.nudgeBpm(delta)}
              className="h-12 flex-1 touch-manipulation rounded-lg border border-edge2 bg-panel2 font-mono text-[14px] text-txt transition-colors hover:border-chrome active:bg-raised"
            >
              {delta > 0 ? `+${delta}` : `−${-delta}`}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={session.toggle}
          aria-pressed={session.playing}
          className={`mt-4 h-14 w-full touch-manipulation rounded-xl font-mono text-[14px] font-bold tracking-[0.22em] uppercase transition-colors ${
            session.playing
              ? 'border border-edge2 bg-raised text-txt active:bg-panel2'
              : 'bg-chrome text-bg active:bg-dim'
          }`}
        >
          {session.playing ? 'Pause' : 'Start'}
        </button>
      </Card>
      )}

      {pattern && (
        <Card className="px-4 py-4">
          <RhythmGrid pattern={pattern} currentStep={session.currentStep} />
        </Card>
      )}

      {checklist.length > 0 && (
        <Card className="px-4 py-3.5">
          <div className="mb-2">
            <Eyebrow>チェック項目</Eyebrow>
          </div>
          <ul className="flex flex-col gap-1">
            {checklist.map((point) => (
              <li key={point}>
                <label className="flex min-h-11 touch-manipulation items-center gap-2.5 text-[13px]">
                  <input
                    type="checkbox"
                    checked={checked.has(point)}
                    onChange={(e) => {
                      const next = new Set(checked);
                      if (e.target.checked) next.add(point);
                      else next.delete(point);
                      setChecked(next);
                    }}
                    className="h-5 w-5 shrink-0 accent-chrome"
                  />
                  <span className={checked.has(point) ? 'text-dim line-through' : ''}>{point}</span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="px-4 py-4">
        <div className="mb-2">
          <Eyebrow>終わったら</Eyebrow>
        </div>
        <p className="mb-3 text-[12px] text-dim">
          {isChecklist
            ? '確認できたら手応えを選んで記録します。'
            : '手応えを選ぶと記録します。ズレの数値は Phase 4 の入力機能から出ます。'}
        </p>
        <div className="flex gap-1.5">
          {SUBJECTIVE.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={saving || !canSave}
              onClick={() => void save(option.id)}
              className="min-h-16 flex-1 touch-manipulation rounded-lg border border-edge2 bg-panel2 px-2 transition-colors hover:border-chrome active:bg-raised disabled:opacity-30"
            >
              <span className="block text-[13px] font-semibold text-txt">{option.label}</span>
              <span className="block text-[10px] text-silk">{option.note}</span>
            </button>
          ))}
        </div>
        {!canSave && (
          <p className="mt-2 text-[11px] text-silk">
            {isChecklist
              ? 'チェック項目をすべて確認すると記録できます。'
              : 'まず再生して練習を始めてください。'}
          </p>
        )}
      </Card>
    </main>
  );
}
