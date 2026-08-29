# Beatlog

ドラム練習支援アプリ。単一ユーザー向け、認証なし、ローカルファースト。

## 必読
- docs/spec.md — 仕様書
- docs/drills.md — ドリル・パターンのマスタデータ
- docs/phases.md — 実装フェーズごとの指示
- docs/notation-sample.html — 五線譜・ガイドレベルの参照実装（Phase 2b）

## 絶対のルール
- メトロノームは `setInterval` で直接発音しない。必ず `AudioContext.currentTime` 基準の
  先読みスケジューラを使う（spec.md §6.1）。
- タイミング計算に `Date.now()` / `performance.now()` を混在させない。
  音声側は `AudioContext.currentTime`、MIDI側は変換して統一する（spec.md §6.3）。
- localStorage は設定値のみ。練習データは必ず IndexedDB（Dexie）に入れる。
- 画面は縦持ちスマホ優先。練習中に使う要素は最低44pxのタップ領域を確保する。
- 新しい依存パッケージを追加する前に、既存の構成で実現できないか検討し、
  追加する場合は理由をコミットメッセージに書く。
- マイクは out モードに入る直前に要求し、練習終了時に必ず
  MediaStreamTrack.stop() を呼ぶ。音声バッファは保持も送信もしない。
- 外部への通信を発生させるコードを書かない。外部CDN、外部フォント、
  アナリティクス、追跡タグを一切追加しない。
- dangerouslySetInnerHTML、eval、Function コンストラクタを使わない。
- 外部から読み込むデータ（JSONインポート）は必ずスキーマ検証を通してから
  IndexedDB に書き込む。

## コマンド
- 開発: `npm run dev`
- 型チェック: `npm run typecheck`
- ビルド: `npm run build`

## 現在の進捗
- Phase 0 完了（プロジェクト初期化、Dexie スキーマ、マスタデータ、/drills と /patterns の一覧）
