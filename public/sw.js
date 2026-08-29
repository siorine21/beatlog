/*
 * 最小限の Service Worker。
 *
 * 目的は2つ:
 *   1. ブラウザに「インストールできるアプリ」として認識させる
 *      （Chrome は fetch を扱う Service Worker の登録を条件にしている）
 *   2. 一度開いた画面をオフラインでも表示する
 *
 * 全ページと静的アセットのプリキャッシュは Phase 6 で Serwist に置き換える
 * （spec.md §5 の選定）。ここでは依存を増やさず手書きにしてある。
 */
const CACHE = 'beatlog-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

/** 取得できたら控えを更新する */
async function fetchAndStore(request) {
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // ページ（HTML）はネットワークを先に試す。
  // 控えを先に返すと、更新しても古い画面が1回出てしまうため。
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetchAndStore(request);
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match(new URL('./', self.registration.scope).href);
          if (fallback) return fallback;
          throw new Error('offline');
        }
      })(),
    );
    return;
  }

  // 静的アセットはファイル名にハッシュが付くので、控えをそのまま使ってよい
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      return fetchAndStore(request);
    })(),
  );
});
