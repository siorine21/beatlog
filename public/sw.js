/*
 * Service Worker。目的は3つ。
 *
 *   1. ブラウザに「インストールできるアプリ」として認識させる
 *      （Chrome は fetch を扱う Service Worker の登録を条件にしている）
 *   2. 一度も開いていない画面も含めて、全ページをオフラインで開けるようにする
 *   3. デプロイのたびに古い控えを確実に捨てる
 *
 * PRECACHE は out/ の中身から scripts/stamp-sw.mjs が埋め込む。
 * index.html は「そのディレクトリのURL」として控える（/patterns/index.html ではなく
 * /patterns/）。画面遷移のリクエストはディレクトリのURLで来るので、
 * ファイル名のまま控えると照合できない。
 *
 * キャッシュ名にもビルドIDを埋め込む。デプロイのたびに名前が変わるので
 * activate で古いキャッシュが必ず消える。これをしないと古いページの控えが
 * 残り続けて、すでに消えた JS を読みにいって画面が真っ白になる。
 */
const BUILD_ID = '__BUILD_ID__';
const CACHE = `beatlog-${BUILD_ID}`;

/** ビルド後に実際のファイル一覧へ置き換わる（scope からの相対パス） */
const PRECACHE = ['__PRECACHE__'];

/**
 * 全部まとめて控える。cache.addAll は1件でも失敗すると全部やめてしまうので、
 * 1件ずつ入れて、取れなかったものだけ諦める。
 * 数個欠けてもオフラインで大半の画面は開けるほうがよい。
 */
async function precache() {
  const cache = await caches.open(CACHE);
  const scope = self.registration.scope;
  await Promise.all(
    PRECACHE.map(async (path) => {
      const url = new URL(path, scope).href;
      try {
        // cache: 'reload' で HTTP キャッシュを迂回し、必ず今のビルドを取る
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (response.ok) await cache.put(url, response);
      } catch {
        // この1件だけ諦める
      }
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await precache();
      await self.skipWaiting();
    })(),
  );
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
        const cached = await caches.match(request, { ignoreSearch: true });
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
