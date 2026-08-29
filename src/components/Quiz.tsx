'use client';

import { useCallback, useEffect, useState } from 'react';
import { patterns } from '@/data/patterns';
import { useSettings } from '@/hooks/useSettings';
import { buildQuestion, type QuizQuestion } from '@/lib/quiz';
import { ASSIST_LEVELS } from '@/lib/notation/assist';
import { Notation } from '@/components/Notation';
import { RhythmGrid } from '@/components/RhythmGrid';
import { Card, Chip, Eyebrow } from '@/components/ui';

/** 出題に色やふりがなを出すと答えが割れてしまうので、素の譜面で出す */
const QUIZ_ASSIST = ASSIST_LEVELS[4];

export function Quiz() {
  const { settings } = useSettings();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const unlockedLevel = settings?.unlockedLevel ?? null;

  const next = useCallback(() => {
    if (unlockedLevel === null) return;
    const pool = patterns.filter((p) => p.level <= unlockedLevel);
    setChosen(null);
    setQuestion(buildQuestion(pool));
  }, [unlockedLevel]);

  // 出題は乱数を使うので、描画後（クライアント）で組み立てる
  useEffect(() => {
    next();
  }, [next]);

  const choose = (id: string) => {
    if (chosen || !question) return;
    setChosen(id);
    setScore((prev) => ({
      correct: prev.correct + (id === question.answer.id ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  if (unlockedLevel === null) {
    return <Card className="px-4 py-4 text-[13px] text-dim">読み込み中…</Card>;
  }

  if (!question) {
    return (
      <Card className="px-4 py-4 text-[13px] text-dim">
        出題できるパターンがありません。設定で解放レベルを上げてください。
      </Card>
    );
  }

  const answered = chosen !== null;
  const correct = answered && chosen === question.answer.id;
  const showNotationAsQuestion = question.direction === 'notation-to-grid';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Eyebrow>
          {showNotationAsQuestion ? 'この譜面はどのグリッド？' : 'このグリッドはどの譜面？'}
        </Eyebrow>
        <span className="font-mono text-[11px] tnum text-silk">
          {score.correct} / {score.total}
        </span>
      </div>

      {showNotationAsQuestion ? (
        <div className="rounded-card bg-paper px-2 pt-3 pb-2 shadow-lift">
          <Notation pattern={question.answer} assist={QUIZ_ASSIST} />
        </div>
      ) : (
        <Card className="px-4 py-4">
          <RhythmGrid pattern={question.answer} />
        </Card>
      )}

      <ul className="flex flex-col gap-2.5">
        {question.options.map((option, index) => {
          const isAnswer = option.id === question.answer.id;
          const picked = chosen === option.id;
          const tone = !answered
            ? 'border-edge'
            : isAnswer
              ? 'border-ok'
              : picked
                ? 'border-snare'
                : 'border-edge opacity-40';
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => choose(option.id)}
                disabled={answered}
                className={`w-full touch-manipulation rounded-card border bg-panel px-3 py-3 text-left shadow-card transition-colors ${tone} ${
                  answered ? '' : 'hover:border-edge2 active:bg-panel2'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-silk">{'ABCD'[index]}</span>
                  {answered && isAnswer && <Chip tone="quiet">正解</Chip>}
                  {answered && picked && !isAnswer && <Chip tone="quiet">選んだもの</Chip>}
                </div>
                {showNotationAsQuestion ? (
                  <RhythmGrid pattern={option} compact showRuler={false} />
                ) : (
                  <div className="rounded-lg bg-paper px-1 py-1">
                    <Notation pattern={option} assist={QUIZ_ASSIST} />
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <Card className="px-4 py-4">
          <p className="text-[15px] font-bold">{correct ? '正解' : '不正解'}</p>
          <p className="mt-1 text-[13px] text-dim">
            答えは「{question.answer.name}」。{question.answer.vocal}
          </p>
          <button
            type="button"
            onClick={next}
            className="mt-3 h-12 w-full touch-manipulation rounded-xl bg-chrome font-mono text-[13px] font-bold tracking-[0.2em] text-bg uppercase transition-colors hover:bg-txt active:bg-dim"
          >
            次の問題
          </button>
        </Card>
      )}
    </div>
  );
}
