import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beatlog',
  description: 'ドラム練習支援アプリ（ローカルファースト・オフライン動作）',
  // 検索エンジンに載せない（spec.md §5.2）
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0f1115',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const NAV = [
  { href: '/', label: 'ホーム' },
  { href: '/drills', label: 'ドリル' },
  { href: '/patterns', label: 'パターン' },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <div className="mx-auto max-w-[540px] px-4 pb-16">
          <header className="flex items-center justify-between py-6">
            <span className="font-mono text-[13px] font-bold tracking-[0.34em]">BEATLOG</span>
            <nav className="flex gap-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center px-1 text-[13px] text-dim hover:text-txt"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
