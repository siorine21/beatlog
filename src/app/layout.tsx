import type { Metadata, Viewport } from 'next';
import { NavTabs } from '@/components/NavTabs';
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh max-w-[540px] flex-col px-4 pb-16">
          <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-edge/80 bg-bg/85 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[13px] font-bold tracking-[0.34em] text-txt">
                BEATLOG
              </span>
              <span className="font-mono text-[10px] tracking-[0.18em] text-silk uppercase">
                Phase 2
              </span>
            </div>
            <NavTabs />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
