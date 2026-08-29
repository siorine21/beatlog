import Link from 'next/link';
import { drills } from '@/data/drills';
import { patterns } from '@/data/patterns';
import { Metronome } from '@/components/Metronome';
import { Eyebrow } from '@/components/ui';

const LINKS = [
  {
    href: '/drills',
    label: 'ドリル一覧',
    sub: 'Lv1〜Lv6 のカリキュラム',
    count: `${drills.length} 件`,
  },
  {
    href: '/patterns',
    label: 'リズムパターン一覧',
    sub: '8ビート・シャッフルなど',
    count: `${patterns.length} 件`,
  },
];

export default function Home() {
  return (
    <main className="flex flex-col gap-7">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">今日の練習</h1>
        <p className="mt-2 text-[13px] text-dim">
          メニューの自動生成は Phase 3。いまはメトロノームとマスタデータまで。
        </p>
      </section>

      <Metronome />

      <section className="flex flex-col gap-2.5">
        <Eyebrow>一覧を見る</Eyebrow>
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
            <span className="font-mono text-[10px] tnum tracking-wider text-silk">
              {link.count}
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
