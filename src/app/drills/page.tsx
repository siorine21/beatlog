import type { Metadata } from 'next';
import { drills } from '@/data/drills';
import { MAX_LEVEL, unlockRequirement } from '@/data/levels';
import { getPattern } from '@/data/patterns';
import type { Drill, PracticeMode } from '@/lib/types';
import { Card, Chip, Eyebrow, LevelBadge } from '@/components/ui';

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
  if (g.maxMeanAbsErrorMs) parts.push(`誤差 ${g.maxMeanAbsErrorMs}ms 以内`);
  if (g.maxVelocityDiff) parts.push(`音量差 ${g.maxVelocityDiff} 以内`);
  return parts.join(' / ') || '実施すれば卒業';
}

export default function DrillsPage() {
  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

  return (
    <main className="flex flex-col gap-8">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">ドリル</h1>
        <p className="mt-2 text-[13px] text-dim">
          全 {drills.length} ドリル。進捗表示とレベルロックは Phase 3 で実装する。
        </p>
      </section>

      {levels.map((level) => (
        <section key={level}>
          <div className="mb-3 flex items-center gap-2.5">
            <LevelBadge level={level} />
            <div className="flex flex-col">
              <Eyebrow>Level {level}</Eyebrow>
              {unlockRequirement(level) && (
                <span className="text-[12px] text-dim">解放条件: {unlockRequirement(level)}</span>
              )}
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            {drills
              .filter((d) => d.level === level)
              .map((drill) => {
                const pattern = drill.patternId ? getPattern(drill.patternId) : undefined;
                return (
                  <li key={drill.id}>
                    <Card className="overflow-hidden">
                      <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2.5">
                        <h2 className="text-[15px] font-bold">
                          {drill.name}
                          {drill.supplemental && (
                            <span className="ml-2 align-middle">
                              <Chip tone="quiet">補助</Chip>
                            </span>
                          )}
                        </h2>
                        <div className="shrink-0">
                          <Chip>{CATEGORY_LABEL[drill.category]}</Chip>
                        </div>
                      </div>

                      <p className="px-4 pb-3 text-[13px] leading-relaxed text-dim">
                        {drill.instruction}
                      </p>

                      {drill.checkpoints && (
                        <ul className="mx-4 mb-3 flex flex-col gap-1.5 rounded-lg border border-edge bg-panel2 px-3 py-2.5">
                          {drill.checkpoints.map((c) => (
                            <li key={c} className="flex gap-2 text-[12px] text-dim">
                              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-silk" aria-hidden />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <dl className="flex flex-col gap-2 border-t border-edge px-4 py-3 text-[12px]">
                        <div className="flex items-baseline gap-3">
                          <dt className="w-16 shrink-0 text-silk">モード</dt>
                          <dd className="flex flex-wrap gap-1.5">
                            {drill.modes.map((m) => (
                              <Chip key={m} tone="quiet">
                                {MODE_LABEL[m]}
                              </Chip>
                            ))}
                          </dd>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <dt className="w-16 shrink-0 text-silk">卒業条件</dt>
                          <dd className="tnum text-txt">{graduationText(drill)}</dd>
                        </div>
                        {pattern && (
                          <div className="flex items-baseline gap-3">
                            <dt className="w-16 shrink-0 text-silk">パターン</dt>
                            <dd>{pattern.name}</dd>
                          </div>
                        )}
                      </dl>
                    </Card>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </main>
  );
}
