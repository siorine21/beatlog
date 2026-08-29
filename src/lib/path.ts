/**
 * spec.md §5.1 (a): basePath への対応はここ1箇所に集約する。
 *
 * next/link と next/router は basePath を自動付与するので対象外。
 * 手書きの文字列パス（アイコン、manifest、Service Worker の登録、fetch）だけが対象で、
 * ここを通していない手書きパスがあればレビューで検出できる。
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** 静的アセット・manifest・SW など、すべてのパス生成はこれを通す */
export const withBase = (p: string): string =>
  `${BASE_PATH}${p.startsWith('/') ? p : `/${p}`}`;
