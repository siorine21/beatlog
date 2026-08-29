import type { Metadata } from 'next';
import { patterns } from '@/data/patterns';
import { PatternList } from '@/components/PatternList';

export const metadata: Metadata = { title: 'リズムパターン | Beatlog' };

export default function PatternsPage() {
  return (
    <main className="flex flex-col gap-8">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">リズムパターン</h1>
        <p className="mt-2 text-[13px] text-dim">
          全 {patterns.length} パターン。解放済みのものを選ぶと再生できる。
        </p>
      </section>

      <PatternList />
    </main>
  );
}
