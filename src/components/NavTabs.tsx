'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'ホーム' },
  { href: '/drills', label: 'ドリル' },
  { href: '/patterns', label: 'パターン' },
  { href: '/settings', label: '設定' },
];

/** 現在地が塗りで分かるタブ。タップ領域は44px以上を確保する */
export function NavTabs() {
  const pathname = usePathname() ?? '/';
  // 静的エクスポートは trailingSlash: true なので末尾のスラッシュを落として比べる
  const current = pathname.replace(/\/+$/, '') || '/';

  return (
    <nav className="flex gap-1 rounded-chip border border-edge bg-panel p-1 shadow-card">
      {TABS.map((tab) => {
        const active = tab.href === '/' ? current === '/' : current.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-chip px-2 text-[13px] transition-colors touch-manipulation ${
              active
                ? 'bg-chrome font-semibold text-bg'
                : 'text-dim hover:bg-panel2 hover:text-txt active:bg-raised'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
