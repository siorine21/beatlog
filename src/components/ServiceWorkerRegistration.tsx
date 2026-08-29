'use client';

import { useEffect } from 'react';
import { withBase } from '@/lib/path';

/**
 * Service Worker の登録。スコープも withBase() を通す（spec.md §5.1 a）。
 * /beatlog/ に限定されるので、同じドメインの他プロジェクトと干渉しない。
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      // updateViaCache: 'none' で、sw.js 自体は必ずネットワークから取り直す。
      // これをしないと更新が端末に届くのが遅れる
      .register(withBase('/sw.js'), { scope: withBase('/'), updateViaCache: 'none' })
      .catch(() => {
        // 登録できなくてもアプリは通常どおり動く
      });
  }, []);

  return null;
}
