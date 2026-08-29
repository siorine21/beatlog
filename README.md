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

## 進捗

| Phase | 内容 | 状態 |
|---|---|---|
| 0 | プロジェクト初期化、Dexie スキーマ、マスタデータ投入 | 完了 |
| 1 | メトロノーム（先読みスケジューラ） | 未着手 |
| 2 | パターン集（グリッド表示・再生・レベルロック） | 未着手 |
| 2b | 五線譜レンダリング・ガイドレベル・読譜クイズ | 未着手 |
| 3 | 練習ログ・グラフ・メニュー自動生成 | 未着手 |
| 4 | キャリブレーション + MIDI 入力 + 判定 | 未着手 |
| 5 | マイクのオンセット検出（out） | 未着手 |
| 6 | PWA・オフライン・GitHub Pages デプロイ | 未着手 |
