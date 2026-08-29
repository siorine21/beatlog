# Claude Code 用プロンプト集

`spec.md` と `drills.md` をリポジトリ直下の `docs/` に置いてから使う。
各フェーズは独立したセッションで実行し、完了条件を満たしてから次に進む。

---

## 事前準備

```bash
mkdir beatlog && cd beatlog
mkdir docs
# spec.md と drills.md を docs/ に配置
git init
```

`CLAUDE.md` をリポジトリ直下に作成しておく（Claude Code が毎回読む）:

```md
# Beatlog

ドラム練習支援アプリ。単一ユーザー向け、認証なし、ローカルファースト。

## 必読
- docs/spec.md — 仕様書
- docs/drills.md — ドリル・パターンのマスタデータ

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
```

---

## Phase 0: プロジェクト初期化とマスタデータ

```
docs/spec.md と docs/drills.md を読んでください。

Phase 0 として以下を実装してください。

1. Next.js 15（App Router、TypeScript、Tailwind、src/ ディレクトリ、
   App Router、import alias は @/*）でプロジェクトを初期化
2. Dexie を導入し、spec.md §4 のユーザーデータ型に対応したスキーマを
   src/lib/db.ts に定義（Session, Attempt, DailyMenu, Settings）
3. drills.md のリズムパターンとドリルを、そのまま TypeScript として
   src/data/patterns.ts と src/data/drills.ts に配置
   - drills.md に「卒業条件」が表形式で書かれている箇所も
     Drill 型のオブジェクトに変換すること
   - air モード専用ドリルも含める
4. src/data/levels.ts にレベル解放条件を実装
5. 動作確認用に /drills と /patterns で一覧を表示（デザインは最小限でよい）

package.json に typecheck スクリプト（tsc --noEmit）を追加してください。

完了したら npm run typecheck と npm run build が通ることを確認してください。
```

---

## Phase 1: メトロノーム

ここが全体の土台になる。精度が出ないと後続がすべて崩れるので、単体で作り込む。

```
Phase 1 としてメトロノームを実装してください。
docs/spec.md §6.1 を厳密に守ってください。

1. src/lib/audio/scheduler.ts に先読みスケジューラを実装
   - LOOKAHEAD_MS = 25, SCHEDULE_AHEAD_S = 0.1
   - start(bpm, resolution) / stop() / setBpm(bpm) を持つクラスまたはフック
   - 予約したステップと時刻を配列で保持し、外部から参照できるようにする
     （後のフェーズで判定に使う）
   - BPM変更は再生中でも即座に反映され、かつ位相がずれないこと

2. クリック音は OscillatorNode で生成（サンプルファイルは使わない）
   - アクセント（1拍目）は高い音、通常拍は低い音
   - 短いエンベロープでクリック感を出す

3. src/components/Metronome.tsx
   - BPM 30-240 のスライダー、±1 / ±5 ボタン、タップテンポ
   - 拍子: 4/4, 3/4, 6/8
   - サブディビジョン: 4分 / 8分 / 16分 / 3連
   - 現在の拍を requestAnimationFrame で視覚表示
     （スケジューラから直接DOMを操作しないこと）
   - 縦持ちスマホで BPM 数値が特大表示になるレイアウト

4. / （ホーム）にメトロノームを配置

【重要】AudioContext はユーザー操作（タップ）で初めて生成・resume すること。
iOS/Android の自動再生制限に引っかかります。

完了条件: 120BPMで5分間再生して聴感上ヨレがないこと。
```

---

## Phase 2: リズムパターン集

```
Phase 2 としてリズムパターン集を実装してください。

1. src/components/RhythmGrid.tsx
   - レーン（hihat / snare / kick）を縦、ステップを横に並べたグリッド
   - resolution が 16 と 12 の両方に対応（12は3連/シャッフル系）
   - 拍の頭に区切り線を入れて読みやすくする
   - currentStep prop で現在位置をハイライト
   - 縦持ちスマホで1小節が横幅に収まること

2. Phase 1 のスケジューラを拡張し、パターンの grid に従って
   レーンごとに異なる音を鳴らせるようにする
   - hihat / snare / kick はオシレータのパラメータで音色を作り分ける
     （ノイズ + フィルタでスネアらしさを出すなど。サンプルは使わない）
   - クリックとパターンを同時に鳴らす/鳴らさないを切り替え可能に

3. /patterns 一覧
   - レベル順に表示
   - unlockedLevel を超えるものはグレーアウトし、解放条件を表示

4. /patterns/[id] 詳細
   - RhythmGrid、再生ボタン、BPMスライダー
   - 口ドラム表記（vocal）を大きく表示
   - note（使われる場面の説明）
   - 五線譜はここでは実装しない（Phase 2b で作る）。
     ただし currentStep を外部に渡せる構造にしておくこと

完了条件: シャッフル（resolution 12）と8ビート（16）が
どちらも正しくグリッド表示・再生できること。
```

---

## Phase 2b: 五線譜と読譜支援

読譜力の育成が到達目標のひとつなので、後回しにしない。
Phase 2 のグリッドと同じデータ・同じ currentStep を使うため、ここで作るのが最も効率的。

```
Phase 2b として五線譜表示と読譜支援を実装してください。
docs/spec.md §3.8 と §6.6、docs/drills.md §5 に従ってください。

【方針】VexFlow 等の楽譜ライブラリは使わないでください。SVG を直接生成します。
同期ハイライト・色分け・ふりがな・拍カウントという独自レイヤーが本機能の中核であり、
ライブラリのレンダリングモデルと衝突します。300行程度で収まる想定です。

1. src/lib/notation/layout.ts
   - RhythmPattern（grid + resolution）から描画用の中間表現を生成する純関数
   - 上声部（手: hihat/snare/tom/crash/ride、符尾上向き）と
     下声部（足: kick/hihatPedal、符尾下向き）の2声部に分ける
   - 各声部について spec.md §6.6 の規則で音価と休符を決定する
     - 1拍ごとに区切り、打点位置から音価を決め、空き先頭に休符を置く
     - 8分・16分は拍単位で連桁でつなぐ
   - resolution 12 は3ステップ=1拍とし、3連符の括りを付ける
   - この関数には必ずテストを書くこと（休符の推論を間違えやすい）

2. src/components/Notation.tsx
   - layout.ts の出力を SVG で描画
   - 音符の垂直位置は spec.md §6.6 の表に従う
   - 符頭は ● と ✕ を使い分ける。オープンハイハットは ✕ の上に ○
   - 冒頭にパーカッションクレフ（縦2本線）
   - X座標はステップ番号に比例する等間隔割り付けとする
     （浄書的には不正確だが、グリッドとの視覚的対応を優先する）
   - props で currentStep を受け取り、対応する音符をハイライトする

3. ガイドレベル（spec.md §3.8 の表）
   - Settings に assistLevel と assistAuto を追加
   - assistAuto が true のときドリルのレベルから自動決定
     （Lv1-2 → 1、Lv3 → 2、Lv4-5 → 3、Lv6 → 4）
   - assist に応じて グリッド/五線譜の主従、色の彩度、ふりがな、拍カウントを切り替える
   - 【重要】練習画面から常にワンタップで assist を1段戻せるボタンを置くこと。
     剥がすのは自動だが、戻すのはいつでもできること

4. 補助レイヤー
   - 色: ハイハット/スネア/バスドラの色をグリッドと五線譜で完全一致させる
   - ふりがな: 音符の下に口ドラム（vocal）の読みを音符と縦位置を揃えて表示
   - 拍カウント: 五線譜の下に 1 & 2 & 3 & 4 &（16分なら 1 e & a）を表示
   - 初出ラベル: そのパターンで初めて出る記号に一度だけ吹き出しを出す

5. /notation 記号リファレンス
   - drills.md §5 の表に従い、解放済みレベルで登場した記号のみ表示

6. /quiz 読譜クイズ
   - 1小節の五線譜を提示し、4つのグリッド候補から選ばせる
   - 逆方向（グリッド → 五線譜）の出題も実装
   - 出題範囲は unlockedLevel 以下のパターンに限定
   - 正答率を記録（Phase 3 のログに含める）

完了条件: 8ビート基本形とシャッフル（resolution 12）が正しく描画され、
再生中にグリッドと五線譜が同時にハイライトされること。
assist を 1 から 4 まで切り替えて表示が段階的に素になること。

```

---

## Phase 3: ログ・グラフ・メニュー生成

ここまでで判定なしでも実用になる。

```
Phase 3 として練習記録とメニュー生成を実装してください。

1. src/lib/menu.ts に docs/spec.md §6.4 のメニュー生成ロジックを実装
   - ルールベースのみ。LLM やランダム性への依存を最小にする
   - 単体テスト可能な純関数として書く（DBアクセスは引数で受け取る）
   - air モードでは判定不要ドリルのみで構成

2. ホーム画面
   - モード切替（home / out / air）。MIDI非対応環境では home を選べないようにする
     （navigator に requestMIDIAccess があるかで判定）
   - 当日のメニューを表示。生成済みなら再利用、未生成なら生成
   - 連続練習日数を表示（air モードもカウント）

3. /practice/[drillId] 練習実行画面
   - spec.md §7 のレイアウトに従う
   - メトロノーム + 該当パターンのグリッド
   - 残り時間のカウントダウン
   - 終了時に主観評価（good / ok / bad）を3ボタンで記録
   - Attempt を IndexedDB に保存
   - Phase 3 時点では判定値（meanOffsetMs等）は undefined のままでよい
   - Screen Wake Lock API で練習中のスリープを防止

4. /log 記録画面（Recharts）
   - ドリル別 BPM 推移（折れ線）
   - 週別の練習時間・モード内訳（積み上げ棒）
   - 総練習時間、連続日数

5. 卒業判定とレベル解放
   - Attempt 保存時に卒業条件を評価し graduated を立てる
   - src/data/levels.ts の条件で unlockedLevel を更新
   - 解放時は画面に明示的にフィードバックを出す

完了条件: 1週間分のダミーデータを入れてグラフが正しく描画され、
メニューが前回結果に応じてBPMを上下させること。
```

---

## Phase 4: キャリブレーションと MIDI 判定

```
Phase 4 として MIDI 入力とタイミング判定を実装してください。
docs/spec.md §6.2 と §6.3 を厳密に守ってください。

1. src/lib/midi.ts
   - navigator.requestMIDIAccess でデバイス取得（sysex: false）
   - Note On メッセージを HitEvent { time, velocity, pad } に正規化
   - MIDIMessageEvent.timeStamp（performance.now基準）を
     AudioContext 時刻に変換する（spec.md §6.3 の perfToAudio）
   - MIDIノート番号 → Lane のマッピングテーブルを設定画面で編集可能にする
     （機種によって割り当てが異なるため。デフォルトは General MIDI:
      36=kick, 38=snare, 42=closed hihat, 46=open hihat, 49=crash, 51=ride）
   - 「今叩いたパッドを割り当てる」学習UIを用意する

2. /settings/calibration
   - spec.md §6.3 の手順を実装
   - 80BPMのクリック、1小節カウントイン、16打
   - オフセットの中央値を採用（平均ではない）
   - midiOffsetMs / micOffsetMs を別々に保存
   - 実測値とその分布を画面に表示し、やり直せるようにする

3. src/lib/judge.ts
   - スケジューラが保持する予約ステップと HitEvent を突き合わせる
   - offset = hitTime - nearestScheduledTime - calibrationOffset
   - 1ステップの半分を超えるズレは「余分な打点」として別集計
   - meanOffsetMs, meanAbsErrorMs, stdDevMs を算出
   - 純関数として実装し、テストを書く

4. 練習実行画面に判定表示を追加
   - リアルタイム: 直近のズレを ms とラベル（走り/もたり）で表示
   - 終了時: 平均絶対誤差、標準偏差、オフセットのヒストグラム
   - spec.md §6.2 の評価基準で表示を出し分ける
   - 誤差50ms超が続いたら「テンポを落とす」提案を出す

5. Attempt に判定値を保存し、/log に平均絶対誤差の推移グラフを追加

完了条件: 電子ドラムを接続し、8ビートを叩いてズレが数値で出ること。
意図的に走らせた場合に負の値、もたらせた場合に正の値が出ること。
```

---

## Phase 5: マイク入力（out モード）

```
Phase 5 としてマイクによるオンセット検出を実装してください。
docs/spec.md §6.5 を守ってください。

1. src/lib/audio/onset-worklet.js に AudioWorkletProcessor を実装
   - フレームごとの短時間エネルギーを計算
   - 閾値超えの立ち上がりを検出し、フレーム時刻とピーク値を postMessage
   - 50ms のデバウンス

2. src/lib/mic.ts
   - getUserMedia で取得。制約は必ず
     { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
   - 150Hz のハイパスフィルタを挟む
   - 起動時に環境ノイズを1秒測定し、最大値 × 係数で閾値を自動決定
   - 検出結果を Phase 4 と同じ HitEvent 型に正規化（pad は undefined）

3. 設定画面に閾値の手動調整スライダーと、
   入力レベルのリアルタイム表示（検出時に光る）を追加

4. out モードの練習実行画面で判定を有効化
   - pad が取れないため、単打・ルーディメンツ系ドリルのみ判定対象
   - パターン系ドリルは out モードで判定なし（ログのみ）として扱う

完了条件: 練習パッドで単打の精度が測れること。
無音時に誤検出せず、通常の打点を取りこぼさないこと。
```

---

## Phase 6: PWA・オフライン・GitHub Pages デプロイ

```
Phase 6 としてオフライン対応とデプロイを仕上げてください。
docs/spec.md §5.1 の GitHub Pages 固有要件を厳密に守ってください。

1. Serwist を導入して PWA 化
   - next-pwa は使わない（メンテナンス停滞のため）
   - src/lib/path.ts に BASE_PATH と withBase() を実装する
   - manifest は public/manifest.json ではなく app/manifest.ts で生成し、
     start_url / scope / icons をすべて withBase() 経由にする
   - Service Worker の登録スコープも withBase('/') を使う
   - 手書きの文字列パスは必ず withBase() を通すこと（next/link と next/router は対象外）
   - 全ページと静的アセットをプリキャッシュ

2. 静的エクスポートと basePath 対応
   - next.config.js を spec.md §5.1 の内容にする
   - basePath は環境変数 BASE_PATH から受け取る。コードにリポジトリ名を書かない
   - /patterns/[id] と /practice/[drillId] に generateStaticParams() を実装し、
     マスタデータから全IDを静的生成する
   - app/not-found.tsx を用意
   - public/.nojekyll を作成（これがないと _next/ が全て404になる）

3. GitHub Actions ワークフロー
   - spec.md §5.1 の deploy.yml を .github/workflows/ に配置
   - BASE_PATH をリポジトリ名から自動決定するステップを必ず含める
   - npm run build 後に out/ を Pages にデプロイ

4. アクセス制御（spec.md §5.2）
   - public/robots.txt に Disallow: / を記述
   - ルートレイアウトの metadata に robots: { index: false, follow: false } を設定
   - PINゲートは実装しない（優先度最低。必要になったら別途指示する）

4. サーバー通信が一切ないことを確認
   - 外部フォント、外部CDN、アナリティクスをすべて排除
   - フォントは next/font でセルフホスト
   - ビルド後の out/ を grep して外部ドメインへの参照が無いことを確認

5. データのエクスポート / インポート（spec.md §10.7）
   - IndexedDB の全データを JSON でダウンロード
   - 同じ形式のファイルを読み込んで復元。取り込み前に zod で全フィールドを検証し、
     検証失敗時は部分適用せず全体を拒否する（spec.md §11.4）
   - navigator.storage.persist() を呼び、永続ストレージを要求する
   - navigator.storage.estimate() で使用量を設定画面に表示
   - 「最終バックアップ: N日前」を設定画面に常時表示し、
     14日以上経過していたらホーム画面に控えめな導線を出す
     （モーダルや通知で強制しないこと。練習の邪魔をしない）
   - リポジトリが public のため、練習データは絶対にコミットしないこと
     （.gitignore に *.beatlog.json を追加）

6. セキュリティ（spec.md §11.6）
   - CSP を <meta http-equiv> で設定する。connect-src は 'self' のみ
   - ビルド後の out/ を grep し、外部ドメインへの参照が無いことを確認する

7. 全体の動作確認
   - 機内モードで起動し、全機能が動くこと
   - Android Chrome でホーム画面に追加して単体アプリとして動くこと

完了条件: GitHub Pages 上のURLをAndroidで開き、ホーム画面に追加し、
機内モードで練習を1セッション完走して記録が残ること。
```

---

## 進め方のコツ

- **Phase 1 で妥協しない**。メトロノームがヨレると後続の判定がすべて無意味になる。
  実機で5分鳴らして確認してから次へ進む。
- 各フェーズの完了時に必ずコミットする。Phase 4 と 5 は手戻りが出やすいので、
  ブランチを切って作業するとよい。
- 実機（Android）での確認は `npm run dev -- -H 0.0.0.0` で同一LANから開く。
  ただし Web MIDI・マイク・PWA は**HTTPS必須**なので、Phase 4 以降は
  `next dev --experimental-https` を使うか、GitHub Pages にデプロイして確認すること
  （自己署名証明書のためAndroid側で警告が出る。手動で許可する）
- Phase 0 の時点で GitHub Pages へのデプロイまで通しておくと、
  以降のフェーズで毎回実機確認ができて楽になる
- ドリルやパターンを増やしたくなったら `src/data/` を編集するだけで済む設計に
  なっている。コードには手を入れない。

---

## Phase 7（不採用・参考）: Supabase 同期

**このフェーズは実施しない。** spec.md §10.0 のとおり不採用と判断済み。
再検討条件（2台目での常用、実際のデータ消失、他人との共有）に
該当したときのための参考として残す。

それまでは Phase 6 の永続ストレージ要求と JSON エクスポートで対応する。

```
Phase 7 として Supabase 同期を実装してください。
docs/spec.md §10 を厳密に守ってください。

【最重要】IndexedDB が常に正のデータです。Supabase を主データストアにしないでください。
UI は Supabase の応答を待たず、同期に失敗してもアプリは通常どおり動作すること。

1. Supabase プロジェクト作成後のスキーマ
   - sessions, attempts, daily_menus, synced_settings, keepalive
   - 全テーブルに user_id を持たせ、RLS を有効化
   - ポリシーは auth.uid() = user_id のみ
   - keepalive は anon の SELECT のみ許可した空テーブル

2. settings の分割（spec.md §10.3）
   - SyncedSettings と DeviceSettings に型を分離する
   - midiOffsetMs / micOffsetMs / micThreshold / midiNoteMap は
     絶対に同期しないこと。端末ごとに遅延が異なるため、
     同期すると全端末で判定が狂う
   - 既存データからのマイグレーションを Dexie のバージョン管理で実装

3. 認証
   - Supabase Auth のマジックリンク（メール）
   - 未ログインでも全機能が動作すること。ログインは同期を有効にする任意操作
   - 設定画面にログイン状態と最終同期時刻を表示

4. 同期ロジック（src/lib/sync.ts）
   - トリガー: アプリ起動時 / 練習セッション終了時 / 手動ボタン
   - sessions と attempts は追記のみなので UUID 主キーで upsert するだけ
   - daily_menus と synced_settings は updatedAt による last-write-wins
   - オフライン時は同期をスキップし、次回オンライン時にまとめて送る
   - 未同期件数を保持し、設定画面に表示

5. keepalive ワークフロー
   - spec.md §10.5 の keepalive.yml を追加
   - SUPABASE_URL と SUPABASE_ANON_KEY は GitHub の Secrets に置く

6. セキュリティ確認
   - anon key はクライアントに露出してよい（RLS が保護する）
   - service_role key は絶対にコードにもリポジトリにも入れないこと
   - Supabase ダッシュボードで新規サインアップを無効化する手順を README に記載

完了条件: 2台の端末で同じアカウントにログインし、
一方で記録した練習が他方に反映されること。
機内モードで練習を完走し、オンライン復帰後に自動で同期されること。
キャリブレーション値が端末ごとに独立していること。
```
