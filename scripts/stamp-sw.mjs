/**
 * Service Worker にビルドIDとプリキャッシュ一覧を埋め込む。
 *
 * ビルドID: デプロイのたびにキャッシュ名が変わることで、activate のときに
 * 前のビルドの控えが確実に捨てられる。名前が固定だと古い HTML や
 * RSC ペイロードが残り、すでに消えた JS を読みにいって画面が壊れる。
 *
 * プリキャッシュ一覧: out/ に出力されたファイルをそのまま列挙する。
 * spec.md §5.2 は Serwist を挙げているが、同じことが 40 行たらずで書けるので
 * 依存は増やさない（CLAUDE.md「新しい依存パッケージを追加する前に」）。
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, posix } from 'node:path';

const OUT_DIR = 'out';
const SW_PATH = join(OUT_DIR, 'sw.js');
const BUILD_ID_PLACEHOLDER = '__BUILD_ID__';
const PRECACHE_PLACEHOLDER = "['__PRECACHE__']";

/** 控えても意味がないもの。sw.js 自身はブラウザが別に管理する */
const SKIP = new Set(['sw.js', '.nojekyll']);

/** out/ の下のファイルを、out/ からの相対パスで全部集める */
async function collect(dir, prefix = '') {
  const entries = await readdir(join(OUT_DIR, dir), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = prefix ? posix.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await collect(join(dir, entry.name), rel)));
    } else if (!SKIP.has(rel)) {
      files.push(rel);
    }
  }
  return files;
}

/**
 * index.html は「そのディレクトリのURL」に読み替える。
 * 画面遷移のリクエストは /patterns/ で来るので、/patterns/index.html のまま
 * 控えると照合できずオフラインで開けない。
 */
function toRequestPath(file) {
  if (file === 'index.html') return './';
  if (file.endsWith('/index.html')) return `${file.slice(0, -'index.html'.length)}`;
  return file;
}

/**
 * 動的ルートのチャンクは out/ では app/patterns/[id]/page-….js だが、
 * webpack は %5Bid%5D に符号化して読みにいく。URL は [ ] をそのまま残すので、
 * ファイル名のまま控えると照合できず、オフラインでその画面だけ開けなくなる。
 * どちらの綴りでも当たるように両方控える。
 */
function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

const files = await collect('.');
const paths = files.map(toRequestPath);
const precache = [
  ...new Set(paths.flatMap((path) => (encodePath(path) === path ? [path] : [path, encodePath(path)]))),
].sort();

const buildId = (await readFile('.next/BUILD_ID', 'utf8')).trim();
const source = await readFile(SW_PATH, 'utf8');

for (const placeholder of [BUILD_ID_PLACEHOLDER, PRECACHE_PLACEHOLDER]) {
  if (!source.includes(placeholder)) {
    console.error(`${SW_PATH} に ${placeholder} が見つかりません`);
    process.exit(1);
  }
}

const stamped = source
  .replaceAll(BUILD_ID_PLACEHOLDER, buildId)
  .replace(PRECACHE_PLACEHOLDER, JSON.stringify(precache));

if (stamped.includes('__BUILD_ID__') || stamped.includes('__PRECACHE__')) {
  console.error(`${SW_PATH} に置き換え漏れがあります`);
  process.exit(1);
}
if (precache.length < 10) {
  console.error(`プリキャッシュが ${precache.length} 件しかありません。out/ の出力を確認してください`);
  process.exit(1);
}

await writeFile(SW_PATH, stamped);
console.log(
  `Service Worker: キャッシュ名 beatlog-${buildId} / プリキャッシュ ${precache.length} 件`,
);
