import type { Metadata } from 'next';
import { patterns } from '@/data/patterns';
import { MAX_LEVEL, unlockRequirement } from '@/data/levels';
import { PatternPreview } from '@/components/PatternPreview';
import { Card, Chip, Eyebrow, LevelBadge } from '@/components/ui';

export const metadata: Metadata = { title: 'リズムパターン | Beatlog' };

export default function PatternsPage() {
  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).filter((level) =>
    patterns.some((p) => p.level === level),
  );

  return (
    <main className="flex flex-col gap-8">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">リズムパターン</h1>
        <p className="mt-2 text-[13px] text-dim">
          全 {patterns.length} パターン。レベルロックと再生は Phase 2 で実装する。
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
            {patterns
              .filter((p) => p.level === level)
              .map((pattern) => (
                <li key={pattern.id}>
                  <Card className="overflow-hidden">
                    <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3">
                      <h2 className="text-[15px] font-bold">{pattern.name}</h2>
                      <div className="flex shrink-0 gap-1.5">
                        <Chip tone="mono">{pattern.resolution}分割</Chip>
                        <Chip tone="mono">
                          {pattern.bpmRange[0]}–{pattern.bpmRange[1]} bpm
                        </Chip>
                      </div>
                    </div>

                    <p className="border-y border-edge bg-panel2 px-4 py-2.5 text-[15px] tracking-[0.08em]">
                      {pattern.vocal}
                    </p>

                    <div className="px-4 py-3.5">
                      <PatternPreview pattern={pattern} />
                    </div>

                    {pattern.note && (
                      <p className="border-t border-edge px-4 py-3 text-[12px] leading-relaxed text-dim">
                        {pattern.note}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
