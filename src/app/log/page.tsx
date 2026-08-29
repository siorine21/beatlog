import type { Metadata } from 'next';
import { LogCharts } from '@/components/LogCharts';

export const metadata: Metadata = { title: '記録 | Beatlog' };

export default function LogPage() {
  return (
    <main className="flex flex-col gap-6">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">記録</h1>
        <p className="mt-2 text-[13px] text-dim">
          ズレの推移は Phase 4 の判定機能が入ってから加わります。
        </p>
      </section>

      <LogCharts />
    </main>
  );
}
