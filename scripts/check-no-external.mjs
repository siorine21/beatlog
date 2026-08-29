/**
 * ビルド成果物（out/）に外部ドメインへの参照が無いことを確認する。
 *
 * spec.md §5「外部CDN・外部フォント・アナリティクスを一切使わない」と
 * §11.6 の connect-src 'self' を、実際の出力に対して機械的に担保するための検査。
 * §11.2 の「依存パッケージ汚染」への保険でもあり、見慣れないホストが出力に
 * 現れたら CI を落として気づけるようにするのが目的。
 *
 * 依存を増やさないため Node の標準APIだけで書いてある。
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const OUT = 'out';
const TEXT_EXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.txt', '.webmanifest', '.map']);

/**
 * 出力に文字列として現れることを許すホスト。
 * ここに足すときは必ず理由を書き、「読み込まれるパス」ではないことを確かめること。
 * （実際に読み込まれる参照は下の LOADABLE の検査で常に落ちる。許可はできない）
 */
const ALLOWED_HOSTS = new Map([
  ['www.w3.org', 'SVG / XML の名前空間URI。ネットワークアクセスは発生しない'],
  ['tinyurl.com', 'Dexie の「IndexedDB API missing」エラーメッセージ内の案内URL'],
  ['bit.ly', 'Dexie の「Transaction committed too early」エラーメッセージ内の案内URL'],
  ['github.com', 'core-js のライセンス表記（バナーコメント）'],
  ['zloirock.ru', 'core-js の著作者表記（バナーコメント）'],
  ['tailwindcss.com', 'Tailwind CSS のライセンスバナーコメント'],
  ['nextjs.org', 'Next.js のエラーメッセージ内の案内URL'],
  ['react.dev', 'React のエラーメッセージ内の案内URL'],
  ['redux.js.org', 'Redux（Recharts の依存）の圧縮版エラーメッセージ内の案内URL'],
  ['redux-toolkit.js.org', 'Redux Toolkit（同上）の圧縮版エラーメッセージ内の案内URL'],
]);

/**
 * ブラウザが実際に読み込む位置に絶対URLがあるか（こちらは例外なく失敗させる）。
 * HTML と CSS にのみ適用する。JS の中の href= や url( はライブラリの
 * テストデータや文字列処理であることが多く、読み込みを意味しないため。
 * JS は下の ANY_URL によるホスト検査で見る。
 */
const LOADABLE = [
  /(?:src|href|action|srcset|poster)\s*=\s*["']?(https?:\/\/[^"'\s>]+)/gi,
  /url\(\s*["']?(https?:\/\/[^)"']+)/gi,
  /@import\s+["'](https?:\/\/[^"']+)/gi,
];

/** ホスト名らしきものだけを拾う（ドットを1つ以上含む） */
const ANY_URL = /https?:\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const loadable = [];
const unknown = new Map();

for await (const file of walk(OUT)) {
  if (!TEXT_EXT.has(extname(file))) continue;
  const text = await readFile(file, 'utf8');

  const ext = extname(file);
  if (ext === '.html' || ext === '.css') {
    for (const re of LOADABLE) {
      for (const m of text.matchAll(re)) loadable.push(`${file}: ${m[1]}`);
    }
  }

  for (const m of text.matchAll(ANY_URL)) {
    const host = m[1].toLowerCase();
    if (host === 'localhost' || ALLOWED_HOSTS.has(host)) continue;
    if (!unknown.has(host)) unknown.set(host, new Set());
    unknown.get(host).add(file);
  }
}

let failed = false;

if (loadable.length > 0) {
  failed = true;
  console.error('外部から読み込む参照が出力に含まれています（許可できません）:');
  for (const line of loadable.slice(0, 20)) console.error(`  ${line}`);
}

if (unknown.size > 0) {
  failed = true;
  console.error('見慣れない外部ドメインの文字列が出力に含まれています:');
  for (const [host, files] of unknown) {
    console.error(`  ${host}\n    ${[...files].slice(0, 5).join('\n    ')}`);
  }
  console.error(
    '\n読み込まれない文字列（ライセンス表記やエラーメッセージ）だと確認できた場合のみ、' +
      '理由を添えて scripts/check-no-external.mjs の ALLOWED_HOSTS に追加してください。',
  );
}

if (failed) process.exit(1);
console.log(`外部ドメインへの参照なし（許可済みの文字列 ${ALLOWED_HOSTS.size} ホストを除く）`);
