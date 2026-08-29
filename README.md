# Beatlog

ドラム練習支援アプリ。単一ユーザー向け、認証なし、ローカルファースト。
練習データはすべて端末内の IndexedDB に保持し、サーバーへは何も送らない。

- 仕様: [docs/spec.md](docs/spec.md)
- マスタデータ（ドリル・パターン）: [docs/drills.md](docs/drills.md)
- 実装フェーズ: [docs/phases.md](docs/phases.md)
- 五線譜・ガイドレベルの参照実装: [docs/notation-sample.html](docs/notation-sample.html)

## 開発

```bash
npm ci
npm run dev        # 開発サーバー
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
npm run lint
npm run build
```

実機（Android）で確認するときは `npm run dev -- -H 0.0.0.0` で同一LANから開く。
Web MIDI・マイク・PWA は HTTPS 必須なので、Phase 4 以降は `next dev --experimental-https`
か GitHub Pages 上で確認する。

## ディレクトリ

```
src/data/     ドリル・パターン・レベル解放条件のマスタデータ（増やすときはここだけ編集する）
src/lib/      型定義、IndexedDB（Dexie）、レーンの表示定数
src/app/      App Router のページ
src/components/ 画面部品
```

## デプロイ

`main` への push で `.github/workflows/deploy.yml` が走り、GitHub Pages に静的サイトを公開する。

- `basePath` は CI がリポジトリ名から自動決定する（`BASE_PATH`）。コードにリポジトリ名は書かない
- 手書きの文字列パスは必ず `withBase()`（`src/lib/path.ts`）を通す。`next/link` と `next/router` は対象外
- ローカルでサブパス配信を再現するには `BASE_PATH=/beatlog npm run build`
- `npm run check:no-external` で、ビルド成果物に外部ドメインへの参照が無いことを検査する（CI でも実行）

リポジトリ設定の Settings → Pages → Source は **GitHub Actions** を選ぶ。
これは手作業が必要で、workflow からは自動化できない（`GITHUB_TOKEN` に
Pages サイトを作成する権限がないため）。有効化していないとデプロイは
`Get Pages site failed` で落ちる。

## オフラインとバックアップ

`public/sw.js` が Service Worker で、`npm run build` の最後に
`scripts/stamp-sw.mjs` がビルドIDと `out/` の全ファイル一覧を埋め込む。
インストール時にそれを丸ごと控えるので、一度も開いていない画面もオフラインで開ける。

- キャッシュ名にビルドIDが入る。デプロイのたびに名前が変わり、`activate` で
  前のビルドの控えが必ず消える。古い HTML が残ると、すでに消えた JS を
  読みにいって画面が真っ白になる
- 控えを先に返してよいのは `/_next/static/`（ファイル名にハッシュがある）だけ。
  HTML と RSC ペイロード（`.txt`）は URL が変わらないまま中身が変わるので、
  必ずネットワークを先に試す
- spec.md §5.2 は Serwist を挙げているが導入していない。同じことが 40 行たらずで
  書けるので依存を増やさなかった

練習の記録はこの端末の IndexedDB にしかない。設定画面から書き出し・読み込みができる。

- 読み込むファイルは `src/lib/backup.ts` の `parseBackup()`（zod）を必ず通す。
  1件でも壊れていたら全体を拒否し、いまのデータには一切触れない
- 書き出したファイルは `*.beatlog.json`。`.gitignore` 済みで、絶対にコミットしない

## アイコン

`assets/icon.svg` と `assets/icon-maskable.svg` が原本で、`public/icons/*.png` は
そこから書き出したもの。図案は8ビート基本形のグリッド（金＝ハイハット、
赤＝スネア、青＝バスドラム）で、色は `src/lib/lanes.ts` と揃えている。
差し替えるときは SVG を直してから PNG を書き出す（192 / 512 / マスカブル512 /
apple-touch 180 / favicon 32）。

## 進捗

| Phase | 内容 | 状態 |
|---|---|---|
| 0 | プロジェクト初期化、Dexie スキーマ、マスタデータ投入 | 完了 |
| 1 | メトロノーム（先読みスケジューラ） | 完了 |
| 2 | パターン集（グリッド表示・再生・レベルロック） | 完了 |
| 2b | 五線譜レンダリング・ガイドレベル・読譜クイズ | 完了 |
| 3 | 練習ログ・グラフ・メニュー自動生成 | 完了 |
| 4 | キャリブレーション + MIDI 入力 + 判定 | 完了（実機での確認待ち） |
| 5 | マイクのオンセット検出（out） | 完了（実機での確認待ち） |
| 6 | PWA・オフライン・GitHub Pages デプロイ | 完了（全 138 ファイルをプリキャッシュ、データの書き出し/読み込み、CSP、永続ストレージ要求） |
