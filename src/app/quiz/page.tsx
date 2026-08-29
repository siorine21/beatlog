import type { Metadata } from 'next';
import { Quiz } from '@/components/Quiz';

export const metadata: Metadata = { title: '読譜クイズ | Beatlog' };

export default function QuizPage() {
  return (
    <main className="flex flex-col gap-6">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">読譜クイズ</h1>
        <p className="mt-2 text-[13px] text-dim">
          出題は解放済みレベルのパターンから。譜面 → グリッドと、その逆の両方を出します。
          正答率の記録は Phase 3 の練習ログに含めます。
        </p>
      </section>

      <Quiz />
    </main>
  );
}
