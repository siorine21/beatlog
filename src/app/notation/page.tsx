import type { Metadata } from 'next';
import { NotationReference } from '@/components/NotationReference';

export const metadata: Metadata = { title: '記号リファレンス | Beatlog' };

export default function NotationPage() {
  return (
    <main className="flex flex-col gap-8">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">記号リファレンス</h1>
        <p className="mt-2 text-[13px] text-dim">
          解放済みのレベルで登場した記号だけを並べています。
        </p>
      </section>

      <NotationReference />
    </main>
  );
}
