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

## デザインの決めごと
- 色・角丸・影は `src/app/globals.css` の `@theme` トークンだけを使う。
  画面ごとに色を書かない。
- 共通部品は `src/components/ui.tsx`（Card / Chip / Eyebrow / LevelBadge）。
- 主要な操作の色は無彩色（chrome）。有彩色はレーン（hihat/snare/kick…）の
  意味に予約されており、ボタンに使うと譜面の色分けと衝突する。
- レーンの色は `src/lib/lanes.ts` の `LANE_COLOR` を唯一の出所とし、
  グリッドと五線譜で必ず一致させる（spec.md §3.8）。
- 押せるものは押せると分かる形にする（塗り・枠・押下時の変化）。
  タップ領域は最低44px。数字は `tnum` で等幅にする。

## コマンド
- 開発: `npm run dev`
- 型チェック: `npm run typecheck`
- テスト: `npm run test`（vitest）
- ビルド: `npm run build`

## 現在の進捗
- Phase 0 完了（プロジェクト初期化、Dexie スキーマ、マスタデータ、/drills と /patterns の一覧）
- Phase 6 の一部を先行実装（静的エクスポート、basePath、GitHub Pages デプロイ、
  app/manifest.ts とアイコン、最小の Service Worker によるインストール対応）。
  Serwist によるプリキャッシュ、データのエクスポート/インポート、CSP は未着手。
  手書きの文字列パスは必ず src/lib/path.ts の withBase() を通す。
- Phase 1 完了（先読みスケジューラ、クリック音、メトロノームUI）。
  スケジューラは src/lib/audio/scheduler.ts。予約したステップは scheduledSteps に
  残してあり、Phase 2 のパターン再生と Phase 4 の判定はこれを共有する。
- Phase 2 完了（RhythmGrid、パターン再生、レベルロック、/patterns/[id]）。
  スケジューラの起動・停止と現在ステップの取り出しは src/hooks/useStepPlayer.ts に
  まとめてあり、メトロノームとパターン再生で共有している。
  /settings の解放レベル切替は Phase 3 で自動化するまでの暫定。
- Phase 2b 完了（五線譜、ガイドレベル、記号リファレンス、読譜クイズ）。
  五線譜のレイアウト計算は src/lib/notation/layout.ts（純関数・テストあり）、
  描画は src/components/Notation.tsx。楽譜ライブラリは使わない。
  グリッドと五線譜には同じ currentStep を渡して同時にハイライトする。
- 次は Phase 3（ログ・グラフ・メニュー生成）。docs/phases.md を参照する。
