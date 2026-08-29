import type { Metadata, Viewport } from 'next';
import { NavTabs } from '@/components/NavTabs';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ChunkErrorRecovery } from '@/components/ChunkErrorRecovery';
import { withBase } from '@/lib/path';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beatlog',
  description: 'ドラム練習支援アプリ（ローカルファースト・オフライン動作）',
  // 検索エンジンに載せない（spec.md §5.2）
  robots: { index: false, follow: false },
  // 手書きの文字列パスは必ず withBase() を通す（spec.md §5.1 a）
  icons: {
    icon: [
      { url: withBase('/icons/favicon-32.png'), sizes: '32x32', type: 'image/png' },
      { url: withBase('/icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: withBase('/icons/apple-touch-icon.png'), sizes: '180x180' },
  },
  // iOS はホーム画面に追加したときここを見る
  appleWebApp: { capable: true, title: 'Beatlog', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0f1115',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * CSP（spec.md §11.6）。GitHub Pages はHTTPヘッダを設定できないので meta で入れる。
 *
 * 要は connect-src を 'self' に閉じること。依存パッケージが汚染されても、
 * 練習記録やマイクの音を外に送れない。
 * script-src に 'unsafe-inline' が要るのは、静的エクスポートでは nonce を発行できず、
 * Next.js が生成するインラインスクリプトを許可しないとアプリが起動しないため。
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
      </head>
      <body className="antialiased">
        <div className="mx-auto flex min-h-dvh max-w-[540px] flex-col px-4 pb-16">
          <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-edge/80 bg-bg/85 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[13px] font-bold tracking-[0.34em] text-txt">
                BEATLOG
              </span>
              <span className="font-mono text-[10px] tracking-[0.18em] text-silk uppercase">
                Phase 6
              </span>
            </div>
            <NavTabs />
          </header>
          {children}
        </div>
        <ServiceWorkerRegistration />
        <ChunkErrorRecovery />
      </body>
    </html>
  );
}
