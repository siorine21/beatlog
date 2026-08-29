/**
 * Service Worker のキャッシュ名にビルドIDを埋め込む。
 *
 * デプロイのたびにキャッシュ名が変わることで、activate のときに
 * 前のビルドの控えが確実に捨てられる。名前が固定だと古い HTML や
 * RSC ペイロードが残り、すでに消えた JS を読みにいって画面が壊れる。
 */
import { readFile, writeFile } from 'node:fs/promises';

const SW_PATH = 'out/sw.js';
const PLACEHOLDER = '__BUILD_ID__';

const buildId = (await readFile('.next/BUILD_ID', 'utf8')).trim();
const source = await readFile(SW_PATH, 'utf8');

if (!source.includes(PLACEHOLDER)) {
  console.error(`${SW_PATH} に ${PLACEHOLDER} が見つかりません`);
  process.exit(1);
}

await writeFile(SW_PATH, source.replaceAll(PLACEHOLDER, buildId));
console.log(`Service Worker のキャッシュ名を beatlog-${buildId} にした`);
