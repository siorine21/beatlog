import Link from 'next/link';
import { drills } from '@/data/drills';
import { patterns } from '@/data/patterns';
import { Metronome } from '@/components/Metronome';
import { InstallPrompt } from '@/components/InstallPrompt';
import { TodayMenu } from '@/components/TodayMenu';
import { Eyebrow } from '@/components/ui';

const LINKS = [
  { href: '/drills', label: 'ドリル一覧', sub: `Lv1〜Lv6 の全 ${drills.length} 件` },
  { href: '/patterns', label: 'リズムパターン一覧', sub: `8ビート・シャッフルなど ${patterns.length} 件` },
  { href: '/notation', label: '記号リファレンス', sub: '解放済みの記号だけを一覧' },
  { href: '/quiz', label: '読譜クイズ', sub: '譜面とグリッドを行き来する' },
];

export default function Home() {
  return (
    <main className="flex flex-col gap-7">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">今日の練習</h1>
        <p className="mt-2 text-[13px] text-dim">
          モードを選ぶと、その日のメニューが用意されます。
        </p>
      </section>

      <InstallPrompt />

      <TodayMenu />

      <section>
        <div className="mb-1.5">
          <Eyebrow>メトロノーム</Eyebrow>
        </div>
        <Metronome />
      </section>

      <section className="flex flex-col gap-2.5">
        <Eyebrow>資料</Eyebrow>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex min-h-16 touch-manipulation items-center gap-3 rounded-card border border-edge bg-panel px-4 py-3 shadow-card transition-colors hover:border-edge2 hover:bg-panel2 active:bg-raised"
          >
            <span className="flex-1">
              <span className="block text-[15px] font-bold">{link.label}</span>
              <span className="block text-[12px] text-dim">{link.sub}</span>
            </span>
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-edge2 bg-raised text-[13px] text-dim transition-colors group-hover:border-chrome group-hover:text-txt"
            >
              ›
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
