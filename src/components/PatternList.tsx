'use client';

import Link from 'next/link';
import { patterns } from '@/data/patterns';
import { MAX_LEVEL, unlockRequirement } from '@/data/levels';
import { useSettings } from '@/hooks/useSettings';
import { RhythmGrid } from '@/components/RhythmGrid';
import { Card, Chip, Eyebrow, LevelBadge } from '@/components/ui';

/**
 * レベル順に並べ、unlockedLevel を超えるものはグレーアウトして解放条件を出す。
 * 解放レベルを読めるまでは（IndexedDB は非同期）ロックを描かない。
 */
export function PatternList() {
  const { settings } = useSettings();
  const unlockedLevel = settings?.unlockedLevel ?? null;

  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).filter((level) =>
    patterns.some((p) => p.level === level),
  );

  return (
    <>
      {levels.map((level) => {
        const locked = unlockedLevel !== null && level > unlockedLevel;
        return (
          <section key={level}>
            <div className="mb-3 flex items-center gap-2.5">
              <LevelBadge level={level} />
              <div className="flex flex-col">
                <Eyebrow>Level {level}</Eyebrow>
                {locked && unlockRequirement(level) && (
                  <span className="text-[12px] text-dim">
                    解放条件: {unlockRequirement(level)}
                  </span>
                )}
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {patterns
                .filter((p) => p.level === level)
                .map((pattern) =>
                  locked ? (
                    <li key={pattern.id}>
                      <Card className="flex items-center justify-between gap-3 px-4 py-3.5 opacity-45">
                        <span className="text-[15px] font-bold">{pattern.name}</span>
                        <Chip tone="quiet">未解放</Chip>
                      </Card>
                    </li>
                  ) : (
                    <li key={pattern.id}>
                      <Link href={`/patterns/${pattern.id}`} className="group block">
                        <Card className="overflow-hidden transition-colors group-hover:border-edge2 group-active:bg-panel2">
                          <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3">
                            <h2 className="text-[15px] font-bold">{pattern.name}</h2>
                            <div className="flex shrink-0 gap-1.5">
                              <Chip tone="mono">{pattern.resolution}分割</Chip>
                              <Chip tone="mono">
                                {pattern.bpmRange[0]}–{pattern.bpmRange[1]} bpm
                              </Chip>
                            </div>
                          </div>
                          <div className="px-4 pb-3.5">
                            <RhythmGrid pattern={pattern} compact showRuler={false} />
                          </div>
                        </Card>
                      </Link>
                    </li>
                  ),
                )}
            </ul>
          </section>
        );
      })}
    </>
  );
}
