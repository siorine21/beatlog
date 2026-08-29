import type { Metadata } from 'next';
import { drills } from '@/data/drills';
import { MAX_LEVEL, unlockRequirement } from '@/data/levels';
import { getPattern } from '@/data/patterns';
import type { Drill, PracticeMode } from '@/lib/types';

export const metadata: Metadata = { title: 'ドリル | Beatlog' };

const MODE_LABEL: Record<PracticeMode, string> = { home: '自宅', out: '外', air: '手ぶら' };

const CATEGORY_LABEL: Record<Drill['category'], string> = {
  setup: 'セットアップ',
  hand: '手',
  rudiment: 'ルーディメンツ',
  foot: '足',
  beat: 'ビート',
  fill: 'フィル',
  notation: '読譜',
};

function graduationText(drill: Drill): string {
  const g = drill.graduation;
  if (drill.checkpoints) return 'チェック項目をすべて確認する';
  const parts: string[] = [];
  if (g.bpm > 0) parts.push(`${g.bpm}BPM`);
  if (g.cycles) parts.push(`${g.cycles}巡（約${g.durationSec}秒）`);
  else if (g.durationSec > 0) parts.push(`${g.durationSec}秒`);
  if (g.maxMeanAbsErrorMs) parts.push(`平均絶対誤差 ${g.maxMeanAbsErrorMs}ms 以内`);
  if (g.maxVelocityDiff) parts.push(`左右の音量差 ${g.maxVelocityDiff} 以内`);
  return parts.join(' / ') || '実施すれば卒業';
}

export default function DrillsPage() {
  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">ドリル</h1>
      <p className="mb-6 text-[13px] text-dim">
        全 {drills.length} ドリル。進捗表示とレベルロックは Phase 3 で実装する。
      </p>

      {levels.map((level) => (
        <section key={level} className="mb-8">
          <h2 className="mb-1 font-mono text-[10px] tracking-[0.2em] text-silk">LEVEL {level}</h2>
          {unlockRequirement(level) && (
            <p className="mb-3 text-[12px] text-dim">解放条件: {unlockRequirement(level)}</p>
          )}
          <ul className="flex flex-col gap-3">
            {drills
              .filter((d) => d.level === level)
              .map((drill) => {
                const pattern = drill.patternId ? getPattern(drill.patternId) : undefined;
                return (
                  <li key={drill.id} className="rounded-lg border border-edge bg-panel p-3">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <h3 className="font-bold">
                        {drill.name}
                        {drill.supplemental && (
                          <span className="ml-2 rounded border border-edge2 px-1 py-px align-middle font-mono text-[9px] text-silk">
                            補助
                          </span>
                        )}
                      </h3>
                      <span className="shrink-0 font-mono text-[10px] text-silk">
                        {CATEGORY_LABEL[drill.category]}
                      </span>
                    </div>
                    <p className="mb-2 text-[13px] text-dim">{drill.instruction}</p>
                    {drill.checkpoints && (
                      <ul className="mb-2 list-disc pl-5 text-[12px] text-dim">
                        {drill.checkpoints.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    )}
                    <dl className="grid grid-cols-[4.5rem_1fr] gap-x-2 text-[12px]">
                      <dt className="text-silk">モード</dt>
                      <dd>{drill.modes.map((m) => MODE_LABEL[m]).join(' / ')}</dd>
                      <dt className="text-silk">卒業条件</dt>
                      <dd>{graduationText(drill)}</dd>
                      {pattern && (
                        <>
                          <dt className="text-silk">パターン</dt>
                          <dd>{pattern.name}</dd>
                        </>
                      )}
                    </dl>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </main>
  );
}
