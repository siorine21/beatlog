import Link from 'next/link';

/** GitHub Pages はルートの 404.html を使う（spec.md §5.1） */
export default function NotFound() {
  return (
    <main className="flex flex-col gap-4 py-10">
      <h1 className="text-xl font-bold">ページが見つかりません</h1>
      <p className="text-[13px] text-dim">
        URL が変わったか、まだ実装されていない画面です。
      </p>
      <Link
        href="/"
        className="flex min-h-11 w-fit items-center rounded-lg border border-edge bg-panel px-4"
      >
        ホームへ戻る
      </Link>
    </main>
  );
}
