import type { NextConfig } from 'next';

/**
 * spec.md §5.1。GitHub Pages のサブパス配信（/<repo>/）に対応する。
 * basePath はコードに書かず、CI がリポジトリ名から決めた BASE_PATH を受け取る。
 */
const basePath = process.env.BASE_PATH || '';

const nextConfig: NextConfig = {
  // サーバーを持たない完全な静的サイトとして出力する（spec.md §5）
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  // /patterns/ が index.html に解決されるように
  trailingSlash: true,
  // next/image の最適化はサーバーが必要なため無効化
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
