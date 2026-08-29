import type { Metadata } from 'next';
import { patterns } from '@/data/patterns';
import { MAX_LEVEL, unlockRequirement } from '@/data/levels';
import { PatternPreview } from '@/components/PatternPreview';

export const metadata: Metadata = { title: 'リズムパターン | Beatlog' };

export default function PatternsPage() {
  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).filter((level) =>
    patterns.some((p) => p.level === level),
  );

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">リズムパターン</h1>
      <p className="mb-6 text-[13px] text-dim">
        全 {patterns.length} パターン。レベルロックと再生は Phase 2 で実装する。
      </p>

      {levels.map((level) => (
        <section key={level} className="mb-8">
          <h2 className="mb-1 font-mono text-[10px] tracking-[0.2em] text-silk">LEVEL {level}</h2>
          {unlockRequirement(level) && (
            <p className="mb-3 text-[12px] text-dim">解放条件: {unlockRequirement(level)}</p>
          )}
          <ul className="flex flex-col gap-3">
            {patterns
              .filter((p) => p.level === level)
              .map((pattern) => (
                <li
                  key={pattern.id}
                  className="rounded-lg border border-edge bg-panel p-3"
                >
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <h3 className="font-bold">{pattern.name}</h3>
                    <span className="shrink-0 font-mono text-[10px] text-silk">
                      {pattern.resolution}分割 / {pattern.bpmRange[0]}-{pattern.bpmRange[1]}bpm
                    </span>
                  </div>
                  <p className="mb-3 text-[15px] tracking-wide">{pattern.vocal}</p>
                  <PatternPreview pattern={pattern} />
                  {pattern.note && <p className="mt-3 text-[12px] text-dim">{pattern.note}</p>}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
