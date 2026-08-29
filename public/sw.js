/*
 * 最小限の Service Worker。
 *
 * 目的は2つ:
 *   1. ブラウザに「インストールできるアプリ」として認識させる
 *      （Chrome は fetch を扱う Service Worker の登録を条件にしている）
 *   2. 一度開いた画面をオフラインでも表示する
 *
 * キャッシュ名にはビルドIDを埋め込む（scripts/stamp-sw.mjs がビルド後に書き換える）。
 * デプロイのたびに名前が変わるので、activate で古いキャッシュが必ず消える。
 * これをしないと、古いページの控えが残り続けて、
 * すでに消えた JS を読みにいって画面が真っ白になる。
 *
 * 全ページのプリキャッシュは Phase 6 で Serwist に置き換える。
 */
const BUILD_ID = '__BUILD_ID__';
const CACHE = `beatlog-${BUILD_ID}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 前のビルドの控えを残さない
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

/**
 * ファイル名にハッシュが付いているものだけ、控えをそのまま使ってよい。
 * HTML や RSC ペイロード（.txt）は URL が変わらないまま中身が変わるので、
 * 控えを先に返すと古いビルドを掴んでしまう。
 */
function isImmutable(url) {
  return url.pathname.includes('/_next/static/');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isImmutable(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return fetchAndStore(request);
      })(),
    );
    return;
  }

  // それ以外はネットワークを先に試し、繋がらないときだけ控えを返す
  event.respondWith(
    (async () => {
      try {
        return await fetchAndStore(request);
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const fallback = await caches.match(new URL('./', self.registration.scope).href);
          if (fallback) return fallback;
        }
        throw new Error('offline');
      }
    })(),
  );
});
