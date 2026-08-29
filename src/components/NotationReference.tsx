'use client';

import { notationSymbols } from '@/data/notation-symbols';
import { getPattern } from '@/data/patterns';
import { MAX_LEVEL } from '@/data/levels';
import { useSettings } from '@/hooks/useSettings';
import { ASSIST_LEVELS } from '@/lib/notation/assist';
import { Notation } from '@/components/Notation';
import { Card, Eyebrow, LevelBadge } from '@/components/ui';

/** 譜例は色を残したまま、ふりがなと拍カウントは出さない */
const DEMO_ASSIST = { ...ASSIST_LEVELS[4], colorAmount: 1 };

/**
 * 記号リファレンス。解放済みレベルで登場した記号だけを出す（drills.md §5）。
 */
export function NotationReference() {
  const { settings } = useSettings();
  const unlockedLevel = settings?.unlockedLevel ?? 1;

  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).filter(
    (level) => level <= unlockedLevel && notationSymbols.some((s) => s.level === level),
  );

  const hidden = notationSymbols.filter((s) => s.level > unlockedLevel).length;

  return (
    <>
      {levels.length === 0 && (
        <Card className="px-4 py-4 text-[13px] text-dim">
          まだ表示できる記号がありません。Lv2 が解放されると五線とパーカッションクレフから出ます。
        </Card>
      )}

      {levels.map((level) => (
        <section key={level}>
          <div className="mb-3 flex items-center gap-2.5">
            <LevelBadge level={level} />
            <Eyebrow>Level {level} で出てくる記号</Eyebrow>
          </div>

          <ul className="flex flex-col gap-3">
            {notationSymbols
              .filter((symbol) => symbol.level === level)
              .map((symbol) => {
                const demo = symbol.demoPatternId ? getPattern(symbol.demoPatternId) : undefined;
                return (
                  <li key={symbol.id}>
                    <Card className="overflow-hidden">
                      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
                        {symbol.glyph && (
                          <span className="mt-0.5 min-w-8 text-center font-mono text-[17px] text-txt">
                            {symbol.glyph}
                          </span>
                        )}
                        <div>
                          <h3 className="text-[15px] font-bold">{symbol.name}</h3>
                          <p className="mt-1 text-[12px] leading-relaxed text-dim">
                            {symbol.description}
                          </p>
                        </div>
                      </div>
                      {demo && (
                        <div className="bg-paper px-2 pt-2 pb-1">
                          <Notation pattern={demo} assist={DEMO_ASSIST} />
                        </div>
                      )}
                    </Card>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      {hidden > 0 && (
        <p className="text-[12px] text-dim">
          あと {hidden} 個の記号は、レベルが上がると表示されます。
        </p>
      )}
    </>
  );
}
