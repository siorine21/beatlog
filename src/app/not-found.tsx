import Link from 'next/link';

/** GitHub Pages はルートの 404.html を使う（spec.md §5.1） */
export default function NotFound() {
  return (
    <main className="flex flex-col items-start gap-4 py-12">
      <h1 className="text-[22px] font-bold tracking-tight">ページが見つかりません</h1>
      <p className="text-[13px] text-dim">URL が変わったか、まだ実装されていない画面です。</p>
      <Link
        href="/"
        className="flex min-h-11 touch-manipulation items-center rounded-chip bg-chrome px-5 text-[13px] font-semibold text-bg transition-colors hover:bg-txt active:bg-dim"
      >
        ホームへ戻る
      </Link>
    </main>
  );
}
