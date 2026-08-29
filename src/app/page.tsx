import Link from 'next/link';
import { drills } from '@/data/drills';
import { patterns } from '@/data/patterns';
import { DbStatus } from '@/components/DbStatus';

const LINKS = [
  { href: '/drills', label: 'ドリル一覧', sub: `${drills.length} 件` },
  { href: '/patterns', label: 'リズムパターン一覧', sub: `${patterns.length} 件` },
];

export default function Home() {
  return (
    <main className="flex flex-col gap-6">
      <section>
        <h1 className="mb-1 text-xl font-bold">Beatlog</h1>
        <p className="text-[13px] text-dim">
          Phase 0。マスタデータと IndexedDB のスキーマまで。
          メトロノームは Phase 1 でこの画面に載る。
        </p>
      </section>

      <nav className="flex flex-col gap-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-11 items-center justify-between rounded-lg border border-edge bg-panel px-4 py-3"
          >
            <span>{link.label}</span>
            <span className="font-mono text-[10px] text-silk">{link.sub}</span>
          </Link>
        ))}
      </nav>

      <DbStatus />
    </main>
  );
}
