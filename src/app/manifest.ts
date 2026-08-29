import type { MetadataRoute } from 'next';
import { withBase } from '@/lib/path';

/**
 * manifest は public/manifest.json に置かず、ここで生成する（spec.md §5.1 b）。
 * 静的ファイルにすると basePath がハードコードされてしまうため、
 * すべてのパスを withBase() に通す。
 */
/** output: 'export' では静的に出力させる必要がある */
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beatlog — ドラム練習',
    short_name: 'Beatlog',
    description: 'ドラム練習支援アプリ。メトロノーム、リズムパターン、読譜。',
    start_url: withBase('/'),
    scope: withBase('/'),
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f1115',
    theme_color: '#0f1115',
    lang: 'ja',
    icons: [
      { src: withBase('/icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: withBase('/icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: withBase('/icons/icon-maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        // 丸や角丸に切り抜かれても欠けないよう、内側に余白を持たせた版
        purpose: 'maskable',
      },
    ],
  };
}
