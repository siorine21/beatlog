# ドラム練習支援アプリ 仕様書

> 仮称: **Beatlog**（変更可）
> 単一ユーザー向け・認証なし・ローカルファースト

---

## 1. コンセプト

ドラム未経験者が「今日は何を、どのテンポで、何分やればいいか」に迷わないことを最優先とする。
練習の**継続**と**上達の可視化**を中心に据え、判定機能はその補助と位置づける。

設計原則:

- **迷わせない**: 起動したら「今日のメニュー」が既に用意されている
- **途切れさせない**: スティックがなくても記録できる練習を用意する
- **段階を守る**: レベルロックにより、初心者に大量の選択肢を見せない
- **オフラインで動く**: 外出先・電波の弱いスタジオでも完全動作する

---

## 2. 3つの練習モード

練習環境によって使える入力手段が変わるため、モードで切り替える。

| モード | 環境 | 入力手段 | 判定 | 主な練習内容 |
|---|---|---|---|---|
| **home** | 自宅・電子ドラム | Web MIDI | 完全（パッド種別あり） | 8ビート、フィル、4way独立 |
| **out** | 外出先・練習パッド | マイク（Web Audio） | 打点タイミングのみ | 単打、ルーディメンツ |
| **air** | 手ぶら（通勤中・休憩中） | なし | なし（ログのみ） | 聴く／口ドラム／エアドラム |

### 端末の前提

**判定機能を使う端末は Android（Chrome または Samsung Internet）とする。**
iOS/iPadOS は全ブラウザが WebKit ベースであり Web MIDI に非対応のため、home モードが成立しない。
iPad で使う場合は out / air モードのみ利用可能とする（アプリ側で機能検出し、非対応時は自動的にモードを制限すること）。

```ts
const midiSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
```

---

## 3. 機能一覧

### 3.1 メトロノーム
- BPM 30〜240（スライダー + タップテンポ + ±1/±5ボタン）
- 拍子: 4/4, 3/4, 6/8
- サブディビジョン: 4分 / 8分 / 16分 / 3連
- 1拍目アクセント
- カウントイン（1小節）
- **精度が最重要**。`setInterval` による直接発音は禁止（§6.1 参照）

### 3.2 リズムパターン集
- 16分割（または3連系は12分割）のグリッド表示
- レーン: ハイハット / スネア / バスドラ（+ タム、クラッシュは発展）
- **五線譜表示**（§3.8）。グリッドと同期して現在位置をハイライト
- 再生機能。再生中は現在ステップをハイライト
- **口ドラム表記**を各パターンに併記（例: ドン・ツ・タ・ツ）
- レベルロック: 未解放パターンはグレーアウトし、解放条件を表示

### 3.3 ドリルカリキュラム
- Lv1〜Lv6 の段階構成（詳細は `drills.md`）
- 各ドリルに「卒業条件」（BPM・継続時間・精度）を持たせる
- 卒業条件達成でレベルが解放される

### 3.4 今日のメニュー自動生成
- 起動時に当日分を生成（生成済みなら再利用）
- ルールベース。LLM は使用しない
- ロジックは §6.4

### 3.5 練習ログ・グラフ
- ドリル別の BPM 推移（折れ線）
- 平均絶対誤差の推移（折れ線）
- 週別の練習時間・モード内訳（積み上げ棒）
- 連続練習日数（air モードもカウント対象とする）

### 3.6 タイミング判定
- 入力: MIDI またはマイク
- 出力: 平均オフセット（走り／もたり）、標準偏差（安定度）、打点散布図
- 詳細は §6.2

### 3.7 キャリブレーション
- 初回必須。モード別（MIDI用 / マイク用）に個別保存
- 詳細は §6.3

### 3.8 五線譜と読譜支援

**最終的にドラム譜を単独で読めるようになることを到達目標とする。**
教則本もバンドスコアも五線譜で書かれており、ここを避けると学習資源が使えないままになる。

ただし五線譜を併記するだけでは、読みやすいグリッドしか見なくなり読譜力は育たない。
そこで**補助を段階的に剥がす**設計をとる。

#### ガイドレベル（assistLevel）

| assist | グリッド | 五線譜 | 音符の色分け | ふりがな（口ドラム） | 拍カウント |
|---|---|---|---|---|---|
| 0 | 主 | なし | — | — | — |
| 1 | 主 | 従（下に併記） | あり | 全音符に | あり |
| 2 | 従（小さく） | 主 | あり | 全音符に | あり |
| 3 | なし | 主 | 薄く | 初出の記号のみ | あり |
| 4 | なし | 主 | なし | なし | なし |

- ドリルのレベルから自動決定する（Lv1–2 → 1、Lv3 → 2、Lv4–5 → 3、Lv6 → 4）
- **設定で常に手動変更でき、練習画面からワンタップで前の段階に戻せること。**
  詰まったときに戻れない設計は挫折を招く。剥がすのは自動、戻すのは随時
- assist 0 は初回起動直後のみ使う想定

#### 学習を成立させる仕掛け

1. **同期ハイライト**（最重要）
   再生中、グリッドと五線譜の対応する位置を**同時に**光らせる。
   すでに理解しているグリッドとの対応付けによって五線譜に意味が与えられる。
   assist 1・2 でこれが働くことが、読譜習得の中核になる。

2. **色の一貫性**
   ハイハット／スネア／バスドラの色をグリッドと五線譜で完全に一致させる。
   assist が上がるにつれて彩度を下げ、最終的に黒一色にする。

3. **ふりがな**
   音符の下に口ドラムの読みを添える。漢字のふりがなと同じ発想で、
   読めるようになったら外す。

4. **拍カウント**
   五線譜の下に `1 & 2 & 3 & 4 &`（16分なら `1 e & a`）を音符と縦位置を揃えて表示する。
   これは市販の教則本でも使われる標準的な補助であり、assist 3 まで残す。

5. **記号の初出ラベル**
   そのパターンで初めて出る記号（✕ の符頭、休符、連桁など）に一度だけ吹き出しを出す。

#### 読譜クイズ

受動的に眺めるだけでは読めるようにならないため、能動的な想起の場を作る。

- 1小節の五線譜を提示し、4つのグリッド候補から正解を選ぶ
- 逆方向（グリッド → 五線譜）の出題も行う
- 出題範囲は `unlockedLevel` 以下のパターンに限定する
- **手ぶら（air）モードのドリルとして登録する。** 通勤中や休憩中にできる
- 正答率をログに残し、グラフに含める

#### 記号リファレンス `/notation`

符頭の種類、音価、休符、連桁、リピート記号などの一覧。
解放済みレベルで登場した記号のみ表示し、初心者に全部を見せない。

---

## 4. データモデル

```ts
// ---- マスタ（アプリに同梱、ユーザー編集不可）----

type Lane = 'hihat' | 'snare' | 'kick' | 'tom1' | 'tom2' | 'crash' | 'ride';

interface RhythmPattern {
  id: string;
  name: string;
  level: number;              // 解放レベル 1-6
  resolution: 16 | 12;        // 1小節の分割数。12は3連/シャッフル系
  bars: 1 | 2;
  bpmRange: [number, number]; // 推奨テンポ範囲
  grid: Partial<Record<Lane, number[]>>; // 0 or 1（将来: 2=アクセント）
  vocal: string;              // 口ドラム表記
  note?: string;              // 使われる場面の説明
}

interface Drill {
  id: string;
  name: string;
  level: number;
  category: 'setup' | 'hand' | 'rudiment' | 'foot' | 'beat' | 'fill';
  modes: PracticeMode[];      // 実施可能なモード
  patternId?: string;         // パターン集と紐づく場合
  instruction: string;        // 何をするか（初心者にわかる言葉で）
  checkpoints?: string[];     // フォーム等のチェック項目
  graduation: {
    bpm: number;
    durationSec: number;
    maxMeanAbsErrorMs?: number; // 判定なしモードでは無視
  };
}

// ---- ユーザーデータ（IndexedDB）----

type PracticeMode = 'home' | 'out' | 'air';

interface Session {
  id: string;
  date: string;               // YYYY-MM-DD
  mode: PracticeMode;
  startedAt: number;
  endedAt?: number;
  menuId?: string;
}

interface Attempt {
  id: string;
  sessionId: string;
  drillId: string;
  bpm: number;
  durationSec: number;
  hitCount?: number;
  meanOffsetMs?: number;      // 負=走り, 正=もたり
  meanAbsErrorMs?: number;
  stdDevMs?: number;
  offsets?: number[];         // 散布図用。多いので間引き保存可
  subjective: 'good' | 'ok' | 'bad';
  graduated: boolean;
}

interface DailyMenu {
  id: string;
  date: string;
  mode: PracticeMode;
  items: { drillId: string; targetBpm: number; targetSec: number; done: boolean }[];
}

interface Settings {
  midiOffsetMs: number;
  micOffsetMs: number;
  micThreshold: number;
  unlockedLevel: number;
  assistLevel: 0 | 1 | 2 | 3 | 4; // §3.8 ガイドレベル。auto=ドリルレベル由来、手動上書き可
  assistAuto: boolean;
  clickSound: 'click' | 'woodblock' | 'beep';
}
```

---

## 5. 技術構成

| 領域 | 選定 |
|---|---|
| フレームワーク | Next.js 15（App Router）+ TypeScript |
| スタイル | Tailwind CSS |
| 永続化 | IndexedDB（Dexie） |
| PWA | Serwist（`next-pwa` はメンテ停滞のため非推奨） |
| グラフ | Recharts |
| 音声 | Web Audio API（音源はオシレータ生成、サンプル不要） |
| MIDI | Web MIDI API（生API直叩きで十分。ライブラリ不要） |
| デプロイ | GitHub Pages（GitHub Actions 経由、静的エクスポート） |

### 方針

- **ローカルファースト**: 全データを IndexedDB に保持。サーバー通信なしで全機能が動作する
- Supabase 同期は端末間で使いたくなってから追加する（初期実装に含めない）
- **完全な静的サイトとして作る**。Server Actions、Route Handlers、Server Components でのデータ取得を一切使わず、`next.config.js` で `output: 'export'` を指定する
- 画面はすべて**縦持ちスマホ優先**。練習中はドラムの前に立てて置くため、文字は大きく、タップ領域は広く
- 練習中の画面は**スリープさせない**（Screen Wake Lock API）
- 外部CDN、外部フォント、アナリティクス、課金の発生する外部APIを一切使わない

### 5.1 GitHub Pages 固有の要件

GitHub Free では **Pages の公開元リポジトリは public でなければならない**。
本アプリは練習データをすべて端末内の IndexedDB に保持し、サーバーに個人データを一切送らない設計のため、
ソースが公開されても実害はない。ただし**リポジトリに個人情報・認証情報を一切コミットしないこと**。

#### basePath は「あるもの」として設計する

`<ユーザー名>.github.io` リポジトリはアカウントに1つしか作れない貴重な枠であり、
本アプリで消費しない。将来のプロジェクトのハブ（各プロジェクトへのリンク集）として温存する。

したがって本アプリは `https://<user>.github.io/beatlog/` というサブパス配信になる。
**basePath への対応は個別対処ではなく、以下の3点で一度きりの構造的解決とし、
そのまま今後のプロジェクトのテンプレートとして再利用する。**

**(a) パスは必ず1つのヘルパーを経由する**

```ts
// src/lib/path.ts
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** 静的アセット・manifest・SW など、すべてのパス生成はこれを通す */
export const withBase = (p: string): string =>
  `${BASE_PATH}${p.startsWith('/') ? p : `/${p}`}`;
```

`next/link` と `next/router` は basePath を自動付与するため対象外。
**手書きの文字列パス（アイコン、manifest、SW登録、fetch）だけが対象**で、
ここを `withBase()` 一箇所に集約すれば漏れがレビューで検出できる。

**(b) manifest は静的ファイルではなくコードで生成する**

`public/manifest.json` を置くと basePath がハードコードされてしまう。
App Router の `app/manifest.ts` で生成し、`withBase()` を通す。

```ts
// app/manifest.ts
import type { MetadataRoute } from 'next';
import { withBase } from '@/lib/path';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beatlog', short_name: 'Beatlog',
    start_url: withBase('/'), scope: withBase('/'),
    display: 'standalone', background_color: '#000000', theme_color: '#000000',
    icons: [
      { src: withBase('/icons/192.png'), sizes: '192x192', type: 'image/png' },
      { src: withBase('/icons/512.png'), sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

**(c) basePath は CI がリポジトリ名から自動決定する**

手で設定させない。設定漏れによる事故をなくし、リポジトリ名を変えても、
別プロジェクトに流用しても、何も書き換えずに動く。

```yaml
- name: Resolve base path
  run: |
    REPO="${{ github.event.repository.name }}"
    OWNER="${{ github.repository_owner }}"
    if [ "$REPO" = "$OWNER.github.io" ]; then
      echo "BASE_PATH=" >> $GITHUB_ENV
    else
      echo "BASE_PATH=/$REPO" >> $GITHUB_ENV
    fi
- run: npm run build
```

`next.config.js`:

```js
const basePath = process.env.BASE_PATH || '';

module.exports = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,           // /patterns/ が index.html に解決されるように
  images: { unoptimized: true },  // next/image の最適化はサーバーが必要なため無効化
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
```

Service Worker は `/beatlog/sw.js` に配置され、スコープが `/beatlog/` に限定される。
これは同一ドメイン上の他プロジェクトと干渉しないという意味で**むしろ望ましい**。
登録時のスコープも `withBase('/')` を使う。

#### その他の必須事項

- **`public/.nojekyll` を必ず置く。** Next.js の出力は `_next/` に入るが、
  Jekyll はアンダースコア始まりのディレクトリを無視するため、これがないと全アセットが404になる
- **動的ルートには `generateStaticParams()` が必須。** `/patterns/[id]` と `/practice/[drillId]` は
  マスタデータから全IDを列挙して静的生成する
- `app/not-found.tsx` を用意する（GitHub Pages はルートの `404.html` を使う）
- `github.io` は HTTPS 配信のため、Web MIDI・getUserMedia・PWA の要件を満たす

**上限（実質無関係だが記録として）**: リポジトリ1GB、帯域100GB/月、ビルド10回/時。
public リポジトリの GitHub Actions は実行時間無料。

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - name: Resolve base path
        run: |
          REPO="${{ github.event.repository.name }}"
          OWNER="${{ github.repository_owner }}"
          if [ "$REPO" = "$OWNER.github.io" ]; then
            echo "BASE_PATH=" >> $GITHUB_ENV
          else
            echo "BASE_PATH=/$REPO" >> $GITHUB_ENV
          fi
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: ./out }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

リポジトリ設定の Settings → Pages → Source は **GitHub Actions** を選ぶ。

---

### 5.2 アクセス制御についての方針

**前提として、GitHub Pages 上の静的サイトに本物のアクセス制限はかけられない。**
サーバーサイドの認証機構が存在せず、URLを知る者は誰でも到達できる。
クライアント側のPIN画面はソースを読めば回避できるため、認証ではなく目隠しに過ぎない。

そのため本アプリは**「守るべきものをサーバーに置かない」ことで保護する**方針を取る。

| 守るもの | 対策 |
|---|---|
| 練習記録・キャリブレーション値 | IndexedDB のみに保持。ネットワークに出さない |
| バックアップJSON | 手動エクスポートのみ。`.gitignore` に追加し、絶対にコミットしない |
| サイトの発見されにくさ | `robots.txt` の `Disallow: /` と `<meta name="robots" content="noindex,nofollow">` |
| 誤操作・同居家族の閲覧 | 任意のPINゲート（後述） |

他人がURLを開いても、空の状態のアプリが表示されるだけで、取得できる個人データは存在しない。

#### PINゲート（任意・実装優先度は最低）

セキュリティ機構としてではなく、**同じ端末を家族が使う場合の誤操作防止**として実装する。

- 初回起動時にPINを設定し、`Settings` に保存
- 以降、起動時にPIN入力を求める
- **これは鍵ではないと設定画面に明記する。** 実装するなら誤解を生まない文言を添えること
- PINを忘れた場合の復旧手段（データ全消去してリセット）を必ず用意する

#### 本当に非公開にしたい場合の選択肢（いずれも無料ではない）

方針転換が必要になったとき用の記録。

| 手段 | 得られるもの | 費用 |
|---|---|---|
| GitHub Pro | リポジトリを private のまま Pages 公開（**サイト自体は公開のまま**） | 約 $4/月 |
| Cloudflare Pages + Cloudflare Access | メール認証による**本物のアクセス制限** | 独自ドメイン代（年 1,000〜2,000円程度） |
| デプロイしない | PWAを一度インストール後、Pages を停止。SWキャッシュで動作 | 無料だが更新のたびに再公開が必要で脆い |

現時点ではいずれも不要と判断する。

---

## 6. コアアルゴリズム

### 6.1 メトロノーム（先読みスケジューラ）

`setInterval` で直接音を鳴らすとタイマー精度の揺れがそのまま音のヨレになる。
`AudioContext.currentTime` を基準に、少し先の音を予約する方式にする。

```ts
const LOOKAHEAD_MS = 25;      // スケジューラの起動間隔
const SCHEDULE_AHEAD_S = 0.1; // 何秒先まで予約するか

let nextNoteTime = 0;  // 次の音を鳴らす AudioContext 時刻
let currentStep = 0;

function scheduler() {
  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
    scheduleClick(currentStep, nextNoteTime);
    scheduledSteps.push({ step: currentStep, time: nextNoteTime }); // 判定用に保持
    const secPerStep = 60 / bpm / (resolution / 4);
    nextNoteTime += secPerStep;
    currentStep = (currentStep + 1) % resolution;
  }
}
setInterval(scheduler, LOOKAHEAD_MS);
```

画面のハイライトは `requestAnimationFrame` で、`ctx.currentTime` と `scheduledSteps` を突き合わせて描画する（スケジューラから直接DOMを触らない）。

### 6.2 タイミング判定

```
offset = hitTime - nearestScheduledTime - calibrationOffset
```

- `nearestScheduledTime`: そのレーンで鳴るべきだった直近のグリッド時刻
- ズレが 1ステップの半分を超える打点は「余分な打点」として別集計
- 集計値:
  - **平均オフセット**: 負なら走り、正ならもたり
  - **平均絶対誤差**: 総合精度
  - **標準偏差**: 安定度（平均が0でもバラつきが大きければ未熟）

評価の目安（表示用）:

| 平均絶対誤差 | 表示 |
|---|---|
| ≤ 15ms | 優秀 |
| ≤ 30ms | 良好 |
| ≤ 50ms | 練習中 |
| > 50ms | テンポを落とす提案 |

### 6.3 時間軸の統一とキャリブレーション

`MIDIMessageEvent.timeStamp` は `performance.now()` 基準、Web Audio は `AudioContext.currentTime` 基準で、原点が異なる。起動時に変換係数を求める。

```ts
// performance.now() [ms] -> AudioContext時刻 [s]
const perfToAudio = (t: number) =>
  (t - performance.now()) / 1000 + ctx.currentTime;
```

さらに、イヤホンの出力遅延・MIDI入力遅延・マイク入力遅延は環境ごとに異なるため実測する。

**キャリブレーション手順:**
1. 4分音符80BPMのクリックを再生
2. 4小節のカウントイン後、16打叩いてもらう
3. 各打点のオフセットを取り、**中央値**を採用（外れ値に強い）
4. `midiOffsetMs` / `micOffsetMs` として保存

`ctx.outputLatency` が取得できる場合は初期値として使うが、最終値は実測を優先する。

### 6.4 メニュー自動生成

```
入力: 今日のモード, 各ドリルの直近Attempt, unlockedLevel
出力: 3〜5個の { drillId, targetBpm, targetSec }

1. 候補抽出
   - level <= unlockedLevel
   - modes に今日のモードを含む
   - 卒業済みドリルは「維持枠」として確率的に混ぜる

2. 各候補の targetBpm を決定
   - 直近Attemptが卒業条件クリア → 前回BPM + 5
   - 未達 → 前回BPMを維持
   - 2回連続で大きく未達（誤差50ms超） → 前回BPM - 5
   - 未実施 → 卒業条件BPMの70%から開始

3. 構成バランス
   - 必ず1つは「今のレベルの新しい課題」を入れる
   - category が偏らないよう配分（hand / foot / beat）
   - 合計時間が targetSec 合計で15〜25分に収まるよう調整

4. air モードの場合
   - 判定なしのドリル（聴く・口ドラム・エア）のみで構成
   - 「次に解放されるパターンを聴いておく」を優先的に含める
```

### 6.5 マイクによるオンセット検出（out モード）

`AudioWorklet` でフレームごとの振幅を監視する。

1. `getUserMedia` で入力取得（**`echoCancellation`, `noiseSuppression`, `autoGainControl` はすべて false**。これらは打点を潰す）
2. ハイパスフィルタ（150Hz程度）で環境ノイズを減衰
3. 短時間エネルギーが閾値を上回った立ち上がりを打点とする
4. 50ms のデバウンス（1打が複数検出されるのを防ぐ）
5. 閾値は起動時に環境ノイズを1秒測定し、その最大値 × 係数で自動決定。設定で手動調整も可能

**out モードでは打点の種別が取れない**ため、単打・ルーディメンツ系のドリルにのみ判定を適用する。

---

### 6.6 五線譜のレンダリング

**VexFlow 等の楽譜ライブラリは使わず、SVG を直接生成する。**

理由:
- パターンは固定分解能（16 または 12）のグリッドであり、
  ステップ番号 → X座標、レーン → Y座標という単純な写像で描ける
- 同期ハイライト、色分け、ふりがな、拍カウントといった独自レイヤーが本機能の中核であり、
  ライブラリのレンダリングモデルと衝突する
- 依存を増やさない方針（§5）と整合し、バンドルサイズも小さい

実装規模は300行程度を見込む。

#### 音符の垂直位置（PAS準拠の簡易版）

下から第1線〜第5線とする。

| レーン | 位置 | 符頭 |
|---|---|---|
| クラッシュ | 第5線の上（加線位置） | ✕ |
| ハイハット（クローズ） | 第5線の上の間 | ✕ |
| ハイハット（オープン） | 同上 | ✕ の上に ○ |
| ライド | 第5線 | ✕ |
| ハイタム | 第4間 | ● |
| ロータム | 第2間 | ● |
| スネア | 第3間 | ● |
| バスドラム | 第1間 | ● |
| ハイハットペダル | 第1線の下 | ✕ |

冒頭にパーカッションクレフ（縦2本線）を置く。

#### 2声部としての描画

ドラム譜の標準に従い、**手（符尾を上向き）と足（符尾を下向き）の2声部**で描く。

```
上声部 = hihat ∪ snare ∪ tom ∪ crash ∪ ride
下声部 = kick ∪ hihatPedal
```

各声部について、そのステップに音がなければ**休符を置く**。
休符の推論は「その声部の打点集合から、拍単位で音価を決定する」規則で行う:

1. 1拍（16分割なら4ステップ）ごとに区切る
2. 拍内の打点位置から各音符の音価を決める（次の打点までの距離）
3. 打点のない先頭部分に休符を置く
4. 8分・16分は拍単位で連桁（beam）でつなぐ

`resolution: 12`（3連系）の場合は3ステップで1拍とし、3連符の括りを付ける。

#### 同期ハイライト

再生中の現在ステップに対応する音符を、グリッド側と同じタイミングで強調する。
`requestAnimationFrame` で `AudioContext.currentTime` と予約ステップ列を突き合わせ、
グリッドと五線譜の**両方に同じ currentStep を渡す**（§6.1 と同じ仕組みを共有する）。

X座標はステップ番号に比例させる（等間隔割り付け）。
本来の浄書では音価に応じた不等間隔が正しいが、グリッドとの視覚的対応を優先し、
等間隔とする。assist 4 に到達した段階でも実用上の支障はない。

---

## 7. 画面構成

```
/                ホーム（今日のメニュー、連続日数、モード切替）
/practice/[id]   練習実行（メトロノーム、グリッド、リアルタイム判定表示）
/patterns        リズムパターン一覧（レベルロック付き）
/patterns/[id]   パターン詳細（グリッド再生、口ドラム、解説）
/drills          ドリル一覧（レベル別、進捗表示）
/notation        記号リファレンス（解放済みの記号のみ）
/quiz            読譜クイズ
/log             記録・グラフ
/settings        設定・キャリブレーション
```

### 練習実行画面のレイアウト（縦持ちスマホ）

```
┌──────────────────┐
│ ドリル名          残り 0:45 │
├──────────────────┤
│                            │
│      BPM  80               │  ← 特大表示
│    [-5] [-1] [+1] [+5]     │
│                            │
├──────────────────┤
│  HH ●·●·●·●·●·●·●·●        │  ← 現在位置ハイライト
│  SN ····●·······●···        │
│  BD ●·······●·······        │
├──────────────────┤
│  ズレ  -8ms （やや走り）    │  ← リアルタイム
│  ▁▃▅█▅▃▁  分布              │
├──────────────────┤
│      [ 停止 ]              │
└──────────────────┘
```

---

## 8. 実装フェーズ

判定機能は手戻りが出やすいため後半に置く。フェーズ3までで実用になる。

| Phase | 内容 | 完了条件 |
|---|---|---|
| **0** | プロジェクト初期化、Dexieスキーマ、マスタデータ投入 | ドリル・パターンが一覧表示される |
| **1** | メトロノーム（先読みスケジューラ） | 120BPMで5分鳴らしてもズレを感じない |
| **2** | パターン集（グリッド表示・再生・レベルロック） | パターンを選んで再生でき、位置がハイライトされる |
| **2b** | 五線譜レンダリング・ガイドレベル・読譜クイズ | グリッドと五線譜が同期ハイライトし、補助が段階的に外れる |
| **3** | 練習ログ記録・グラフ・メニュー自動生成 | 手動記録だけで日々の練習が回る |
| **4** | キャリブレーション + MIDI入力 + 判定（home） | 電子ドラムで8ビートのズレが数値で出る |
| **5** | マイクのオンセット検出（out） | 練習パッドで単打の精度が測れる |
| **6** | PWA化・オフライン対応・Wake Lock | 機内モードで全機能が動く |

---

## 9. 非目標（作らないもの）

明示的にスコープ外とし、判断を迷わせない。

- ユーザー認証、複数ユーザー対応、サーバー同期（§10 で検討し不採用）
- 楽曲の再生・耳コピ支援（別アプリで代替可能）
- 楽譜ライブラリの利用（VexFlow 等。五線譜は §6.6 のとおり自前SVGで描く）
- 浄書品質の楽譜出力・印刷・MusicXML 対応
- SNS共有、ランキング
- 音源サンプルの同梱（オシレータ生成で足りる）

---

## 10. 検討済み・不採用: Supabase 同期

### 10.0 決定

**採用しない。** 単一端末・ローカルファーストのまま完成させる。

同じ議論を後から蒸し返さないよう、判断とその根拠、
および再検討すべき条件を記録として残す。

**不採用の理由:**

1. **固有価値がなかった。** Supabase の唯一の代替不能な利点は「本物のアクセス制限」だったが、
   §5.2 のとおりサーバーに守るべきデータを置かない設計であり、
   存在しない問題への対策になっている
2. **バックアップは JSON エクスポートで足りる。** §10.7 の代替手段で実用上の必要を満たせる
3. **端末間同期の需要が仮定でしかない。** 実際に2台目で練習する場面が起きていない
4. **CSP の防御力を下げる。** §11.6 の `connect-src 'self'` が成立しているのは
   このアプリが外部通信を一切しないためである。Supabase を追加すると
   例外を認めることになり、§11.2 で最優先とした
   「依存パッケージ汚染時の外部送信の阻止」という防御が弱くなる。
   バックアップのために主要な防御機構を削るのは割に合わない
5. **攻撃面と運用負荷が増える。** RLS の設定漏れ（§11.7）、7日間の一時停止、
   keepalive ワークフローの維持といった、単一ユーザーには不釣り合いなコストが生じる

**再検討する条件（いずれかが実際に起きたとき）:**

- 2台目の端末で日常的に練習するようになり、記録の分断が実害になった
- ブラウザのデータ消去や端末故障で実際に記録を失った
- 練習記録を他人（講師など）と共有したくなった

そのときは §10.1 以降をそのまま設計として使える。**先回りして作らない。**

---

以下は再検討時のための参考資料であり、現時点では実装しない。

### 10.7 代替手段（こちらを Phase 6 で実装する）

Supabase を使わずにデータ消失リスクへ対処する。

1. **永続ストレージの要求**

   ```ts
   if (navigator.storage?.persist) {
     const granted = await navigator.storage.persist();
     // Android Chrome では PWA としてインストール済みなら通常は自動的に許可される
   }
   ```

   これによりブラウザのストレージ逼迫時に IndexedDB が自動削除される可能性が下がる。
   保証ではないため、下記のバックアップと併用する。

2. **バックアップの促し**

   - 直近のエクスポートから14日以上経過していたら、ホーム画面に控えめな導線を出す
   - 「最終バックアップ: N日前」を設定画面に常時表示する
   - 通知やモーダルで強制しない。練習の邪魔をしない

3. **エクスポート先の運用**

   - 出力した JSON はクラウドストレージ等に手動で保存する
   - **リポジトリには絶対にコミットしない**（`.gitignore` に追加）

4. **ストレージ使用量の表示**

   ```ts
   const { usage, quota } = await navigator.storage.estimate();
   ```

   設定画面に表示し、逼迫に気づけるようにする。

### 10.1 （参考）導入する場合の理由

1. **端末間同期**: スマホとタブレットの両方で練習する場合に記録が分断されない
2. **バックアップ**: IndexedDB はブラウザのストレージ逼迫時に削除されうる。
   `navigator.storage.persist()` で軽減できるが保証はない
3. **本物のアクセス制限**: §5.2 で「静的サイトには不可能」とした制限が、
   Supabase Auth + RLS によって実現する。
   静的アセットは公開のままだが、データは認証の背後に入る

### 10.2 絶対に守る原則

**Supabase を主データストアにしない。IndexedDB が常に正であり、Supabase は同期先に過ぎない。**

out モードは電波の弱い場所で使う可能性があり、home モードも通信を必要としない。
オフラインで全機能が動くという要件（§5）は Supabase 導入後も一切変えない。

- 読み書きはすべて IndexedDB に対して行う。UI は Supabase の応答を待たない
- 同期は明示的なタイミング（アプリ起動時・練習終了時・手動ボタン）でバックグラウンド実行
- 同期に失敗しても、ユーザーには小さな表示を出すだけでアプリは通常どおり動く
- 無料枠の**7日間無操作でプロジェクトが一時停止する**仕様に該当しても、
  ローカルファーストなので練習は止まらない。復帰はダッシュボードから約30秒

### 10.3 同期設計

データモデルが**追記のみ（append-only）**であることを利用すると、同期は非常に単純になる。

| テーブル | 性質 | 同期方針 |
|---|---|---|
| `sessions` | 追記のみ・不変 | UUID主キーで upsert。競合しない |
| `attempts` | 追記のみ・不変 | UUID主キーで upsert。競合しない |
| `dailyMenu` | 可変（done フラグ） | `updatedAt` による last-write-wins |
| `settings` | 可変 | **分割が必須。下記参照** |

**`settings` は必ず2つに分ける。**

```ts
// 同期する（どの端末でも同じであるべき）
interface SyncedSettings {
  unlockedLevel: number;
  assistLevel: 0 | 1 | 2 | 3 | 4; // §3.8 ガイドレベル。auto=ドリルレベル由来、手動上書き可
  assistAuto: boolean;
  clickSound: string;
}

// 同期しない（端末ごとに固有の値）
interface DeviceSettings {
  midiOffsetMs: number;   // 端末・イヤホンごとに遅延が違う
  micOffsetMs: number;
  micThreshold: number;   // 環境ノイズに依存
  midiNoteMap: Record<number, Lane>;
}
```

**キャリブレーション値を同期してはならない。** スマホとタブレットでは出力遅延が異なるため、
同期すると判定が全端末で狂う。これは実装時に最も見落とされやすい箇所。

### 10.4 認証とセキュリティ

- **Supabase Auth のマジックリンク（メール）** を使う。パスワード管理が不要で実装が最小
- サインアップは自分の1アカウントのみ。Supabase ダッシュボードで**新規サインアップを無効化**し、
  自分のアカウント作成後は誰も登録できないようにする
- 全テーブルで **RLS を有効化**し、`auth.uid() = user_id` のポリシーのみを許可する
- `anon key` はリポジトリが public でも問題ない。この鍵は公開前提で設計されており、
  保護しているのは RLS である。**`service_role` key は絶対にコミットしない**
- 未ログインでもアプリは完全に動作する（ローカル専用モードとして扱う）。
  ログインは同期を有効にするための任意操作と位置づける

### 10.5 一時停止対策

7日間 DB へのアクセスがないとプロジェクトが停止するため、既にある GitHub Actions に
日次の ping を追加する。public リポジトリの Actions は無料。

```yaml
# .github/workflows/keepalive.yml
name: Supabase keepalive
on:
  schedule: [{ cron: '0 3 * * *' }]
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -sf -X GET "$SUPABASE_URL/rest/v1/keepalive?select=id&limit=1" \
            -H "apikey: $SUPABASE_ANON_KEY"
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

`keepalive` テーブルは RLS で anon の SELECT のみ許可した空テーブルとする。

**注意**: GitHub は**リポジトリが60日間無操作だと定期ワークフローを自動停止する**。
長期間コミットがない場合は手動で再有効化が必要。

### 10.6 （参考）導入判断

§10.0 のとおり不採用。上記は再検討条件に該当した場合の設計案として保持する。
容量面では、練習データは年間でも数MB程度であり無料枠（500MB）に対して余裕がある。

---

## 11. セキュリティ

### 11.1 脅威モデル

守るべき資産と、その機微性を明確にしておく。

| 資産 | 機微性 | 所在 |
|---|---|---|
| 練習記録（BPM・誤差・日時） | 低 | 端末内 IndexedDB |
| キャリブレーション値・設定 | 低 | 端末内 IndexedDB |
| **マイクへのアクセス権限** | **高** | ブラウザの権限 |
| MIDI デバイスへのアクセス権限 | 低 | ブラウザの権限 |
| メールアドレス（Phase 7 のみ） | 中 | Supabase Auth |
| ソースコード | 公開前提 | public リポジトリ |

**このアプリで最も価値が高いのは練習データではなく、マイク権限である。**
攻撃者にとっての狙いは記録の窃取ではなく、マイクの悪用になる。
以下の対策はこの前提で優先順位をつけている。

### 11.2 最優先: 依存パッケージ（サプライチェーン）

サーバーを持たない静的アプリにおける最大の現実的リスクは、**npm 依存パッケージの汚染**である。
ビルドチェーンに悪意あるコードが混入すると、既にマイク権限を持つアプリから
音声を無断送信したり、IndexedDB の内容を外部に送ることが可能になる。

- **依存を最小限に保つ。** 新しいパッケージを追加する前に既存構成で実現できないか必ず検討する
  （`CLAUDE.md` に規約として記載済み）
- `package-lock.json` をコミットし、CI では必ず `npm ci` を使う（`npm install` を使わない）
- **GitHub の Dependabot alerts を有効化する**（public リポジトリは無料）
- **Secret scanning と push protection を有効化する**（public リポジトリは無料）。
  誤ってキーをコミットした際にプッシュ自体がブロックされる
- GitHub Actions は可能な限りコミットSHAで固定する（`actions/checkout@v4` → SHA指定）

### 11.3 マイクの取り扱い（out モード）

- **権限は out モードに入る直前に要求する。** アプリ起動時に一括要求しない
- **練習終了時に `MediaStreamTrack.stop()` を必ず呼ぶ。** 一時停止では権限が保持され続ける
- 画面上に録音中であることを常時明示する
- **音声バッファを一切保持・保存・送信しない。**
  オンセット検出に必要なのはフレームごとのエネルギー値のみであり、
  波形データを AudioWorklet の外に出す必要はない
- 検出結果として渡すのは `{ time, peak }` のみとする

### 11.4 JSON インポートの検証

エクスポート／インポート機能は、このアプリで**唯一の外部入力経路**である。

- インポート時は zod 等のスキーマで**全フィールドを検証してから** IndexedDB に書き込む
- 検証失敗時は部分的に取り込まず、全体を拒否する
- `id` は UUID 形式であることを確認する
- 数値には妥当な範囲チェックをかける（BPM 20〜300 など）
- 将来パターン定義のインポートを実装する場合も同様。
  `eval` や `Function` による動的解釈は絶対に行わない

### 11.5 同一オリジン問題（重要）

`<ユーザー名>.github.io` 配下のすべてのプロジェクトは**同一オリジンを共有する**。
`/beatlog/` と `/other-app/` は URL のパスが違うだけで、
IndexedDB・localStorage・Cookie・権限はすべて共有される。

つまり、**同じドメインに置いた別プロジェクトに XSS 等の脆弱性があると、
本アプリのデータも読み取られうる。** Service Worker のスコープ分離は
キャッシュの衝突を防ぐだけで、ストレージの分離にはならない。

- 本アプリのデータは機微性が低いため、現時点では許容する
- **ただし将来、家計・健康・認証情報など機微なデータを扱うアプリを作る場合は、
  同じ `github.io` オリジンに置かない。** 別アカウントか独自ドメインに分離する
- どのプロジェクトでも `dangerouslySetInnerHTML` と外部スクリプトの読み込みを禁止する

### 11.6 CSP（多層防御）

GitHub Pages はカスタムHTTPヘッダを設定できないため、`<meta http-equiv>` で指定する。
`frame-ancestors` など一部のディレクティブは meta では効かないが、
**`connect-src` は有効であり、依存パッケージが汚染された場合の外部送信を阻止できる。**
11.2 のリスクに対する実効性のある保険になる。

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self';
  img-src 'self' data:;
  media-src 'self';
  object-src 'none';
  base-uri 'self';
">
```

- 静的エクスポートでは nonce を発行できないため、`script-src` の厳格化には限界がある。
  `connect-src` と `object-src` の制限を優先する
- Phase 7 で Supabase を導入する場合のみ、`connect-src` に自分のプロジェクトURLを追加する

### 11.7 Phase 7（Supabase）導入時の追加要件

- **全テーブルで RLS を有効化し、ポリシーは `auth.uid() = user_id` のみ。**
  テーブル追加時に RLS を有効化し忘れるのが最も多い事故
- 導入後、`anon key` だけで他人のデータが読めないことを実際に検証する
  （別アカウントを作って確認し、確認後に削除する）
- 自分のアカウント作成後、ダッシュボードで**新規サインアップを無効化**する
- `anon key` は公開してよい。保護しているのは RLS である
- **`service_role` key はコード・リポジトリ・GitHub Secrets のいずれにも置かない。**
  このアプリのどの機能にも必要ない
- マジックリンクのメール本文に個人情報を含めない（Supabase の既定で問題ない）

### 11.8 対策しないと決めたこと

判断を記録し、都度悩まないようにする。

| 項目 | 判断 |
|---|---|
| IndexedDB の暗号化 | しない。鍵をクライアントに置く以上、端末侵害時の防御にならない。端末のロック画面が実質的な防御 |
| PINゲート | 実装しない（§5.2）。静的サイトでは認証にならない |
| サイトの非公開化 | しない（§5.2）。公開されて困るデータがサーバーに存在しない |
| 監査ログ・不正検知 | しない。単一ユーザーであり意味がない |
