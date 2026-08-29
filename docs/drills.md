# ドリル・リズムパターン マスタデータ

そのまま `src/data/` 配下の TypeScript として使えるよう定義する。

グリッドのインデックス（resolution: 16 の場合）:

```
step  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
拍    1  e  &  a  2  e  &  a  3  e  &  a  4  e  &  a
```

---

## 1. リズムパターン

```ts
export const patterns: RhythmPattern[] = [
  {
    id: 'hihat-8th',
    name: 'ハイハット8分のみ',
    level: 2, resolution: 16, bars: 1, bpmRange: [50, 120],
    grid: { hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0] },
    vocal: 'ツ ツ ツ ツ ツ ツ ツ ツ',
    note: '8ビートの土台。まずこれだけを一定に刻めるようにする。',
  },
  {
    id: 'hihat-snare',
    name: 'ハイハット + スネア',
    level: 2, resolution: 16, bars: 1, bpmRange: [50, 120],
    grid: {
      hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
    },
    vocal: 'ツ ツ タ ツ ツ ツ タ ツ',
    note: '2拍目と4拍目にスネア。バックビートと呼ばれる、ロック/ポップスの骨格。',
  },
  {
    id: 'eight-beat-basic',
    name: '8ビート 基本形',
    level: 3, resolution: 16, bars: 1, bpmRange: [60, 130],
    grid: {
      hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      kick:  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    },
    vocal: 'ドン ツ タ ツ ドン ツ タ ツ',
    note: '最初に覚えるべき3点の基本形。1拍目と3拍目にバスドラ。',
  },
  {
    id: 'eight-beat-var1',
    name: '8ビート バリエーション1',
    level: 3, resolution: 16, bars: 1, bpmRange: [60, 130],
    grid: {
      hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      kick:  [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0],
    },
    vocal: 'ドン ツ タ ド ドン ツ タ ツ',
    note: '2拍目裏にバスドラを追加。最も使用頻度の高い形のひとつ。',
  },
  {
    id: 'four-on-the-floor',
    name: '4つ打ち',
    level: 3, resolution: 16, bars: 1, bpmRange: [90, 140],
    grid: {
      hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      kick:  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
    },
    vocal: 'ドン ツ ドタ ツ ドン ツ ドタ ツ',
    note: 'ダンス系・4つ打ちロック。右足の持久力トレーニングにもなる。',
  },
  {
    id: 'half-time',
    name: 'ハーフタイム',
    level: 3, resolution: 16, bars: 1, bpmRange: [70, 120],
    grid: {
      hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      snare: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      kick:  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    },
    vocal: 'ドン ツ ツ ツ タ ツ ツ ツ',
    note: 'スネアが3拍目のみ。テンポが半分に感じられ、重い雰囲気になる。',
  },
  {
    id: 'sixteen-beat',
    name: '16ビート',
    level: 5, resolution: 16, bars: 1, bpmRange: [60, 100],
    grid: {
      hihat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      kick:  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    },
    vocal: 'チチチチ チタチチ チチチチ チタチチ',
    note: 'ハイハットを16分で刻む。片手だと速度に限界があるので遅いテンポから。',
  },
  {
    id: 'two-beat',
    name: '2ビート',
    level: 4, resolution: 16, bars: 1, bpmRange: [80, 160],
    grid: {
      hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
      snare: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
      kick:  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
    },
    vocal: 'ドタ ドタ ドタ ドタ',
    note: 'パンク/ロックの疾走感。バスとスネアが交互に来る。',
  },
  {
    id: 'shuffle',
    name: 'シャッフル',
    level: 5, resolution: 12, bars: 1, bpmRange: [60, 120],
    grid: {
      hihat: [1,0,1,1,0,1,1,0,1,1,0,1],
      snare: [0,0,0,1,0,0,0,0,0,1,0,0],
      kick:  [1,0,0,0,0,0,1,0,0,0,0,0],
    },
    vocal: 'ドッ ク タッ ク ドッ ク タッ ク',
    note: '3連符ベース。ブルース/ジャズ寄り。16分割グリッドでは表現できない。',
  },
];
```

**注**: `resolution: 12` は1小節を3連符×4拍で分割したもの。UI側でグリッド幅を切り替えること。

---

## 2. ドリルカリキュラム

### Lv1 — セットアップとフォーム（air可）

判定なし。チェックリスト形式。1回確認すれば卒業。

```ts
{
  id: 'setup-grip', name: 'スティックの持ち方', level: 1, category: 'setup',
  modes: ['home', 'out', 'air'],
  instruction: 'スティックの支点（根元から約1/3）を親指と人差し指で軽くつまみ、残りの指は添えるだけ。握り込まない。',
  checkpoints: [
    '支点は根元から1/3あたりか',
    '親指と人差し指以外は軽く添えているか',
    '落としたら困る、くらいの弱さで持てているか',
    '手首が固まっていないか',
  ],
  graduation: { bpm: 0, durationSec: 0 },
},
{
  id: 'setup-position', name: 'セッティングと姿勢', level: 1, category: 'setup',
  modes: ['home'],
  instruction: '椅子は膝の角度が90度よりやや開くくらいの高さに。スネアは太ももに軽く触れる高さ、水平に近く。',
  checkpoints: [
    '椅子に浅く座り、両足が自由に動くか',
    '膝の角度は90度以上開いているか',
    '背中が丸まっていないか',
    'スネアの中心に自然に手が届くか',
  ],
  graduation: { bpm: 0, durationSec: 0 },
},
```

### Lv2 — 単打の精度

```
right-only        右手のみ4分打ち        卒業: 80BPM / 60秒 / 誤差25ms以内
left-only         左手のみ4分打ち        卒業: 80BPM / 60秒 / 誤差25ms以内
alternate-8th     交互8分（RLRL）        卒業: 90BPM / 60秒 / 誤差20ms以内
volume-balance    左右の音量を揃える      卒業: 80BPM / 60秒（velocity差20以内・homeのみ）
```

`left-only` は初心者が最も苦戦する箇所。右手より目標BPMを下げてもよい設計にしておく。

### Lv3 — 8ビート（home中心）

```
hihat-only        ハイハット8分のみ                卒業: 90BPM / 60秒 / 誤差20ms
hihat-snare       ハイハット + スネア              卒業: 90BPM / 60秒 / 誤差20ms
kick-quarter      バスドラ4分踏み（足単体）        卒業: 80BPM / 60秒 / 誤差30ms
eight-beat-basic  8ビート基本形                    卒業: 80BPM / 60秒 / 誤差30ms
eight-beat-var1   8ビート バリエーション1          卒業: 80BPM / 60秒 / 誤差30ms
```

### Lv4 — ルーディメンツと足の強化

```
double-stroke     ダブルストローク（RRLL）         卒業: 70BPM 8分 / 60秒 / 誤差25ms
paradiddle        シングルパラディドル（RLRR LRLL） 卒業: 70BPM 8分 / 60秒 / 誤差25ms
accent-move       アクセント移動（4分ごとに強打）   卒業: 70BPM / 60秒
hihat-pedal       ハイハットペダル4分              卒業: 80BPM / 60秒
two-beat          2ビート                          卒業: 100BPM / 60秒 / 誤差30ms
```

### Lv5 — 16分と3連

```
sixteen-hihat     ハイハット16分（片手）           卒業: 70BPM / 60秒 / 誤差20ms
sixteen-beat      16ビート                         卒業: 70BPM / 60秒 / 誤差30ms
shuffle           シャッフル                       卒業: 80BPM / 60秒 / 誤差30ms
four-on-the-floor 4つ打ち                          卒業: 110BPM / 60秒 / 誤差30ms
```

### Lv6 — フィルと構成

```
fill-3plus1       3小節ビート + 1小節フィル        卒業: 80BPM / 4巡 / 誤差35ms
fill-quarter      4分音符のフィル（タム移動）      卒業: 80BPM / 60秒
beat-switch       2種類のビートを4小節ごとに切替   卒業: 80BPM / 8小節
```

---

## 3. air モード専用ドリル

スティックがなくても記録できる練習。継続日数を途切れさせないための枠。

```ts
{
  id: 'air-listen', name: 'パターンを聴く', level: 1, category: 'beat',
  modes: ['air'],
  instruction: '次に取り組むパターンを、テンポを落として3分間繰り返し聴く。手は動かさなくてよい。',
  graduation: { bpm: 0, durationSec: 180 },
},
{
  id: 'air-vocal', name: '口ドラム', level: 2, category: 'beat',
  modes: ['air', 'out'],
  instruction: 'パターンの口ドラム表記を、クリックに合わせて声に出す。叩けないリズムはまず歌えない。',
  graduation: { bpm: 60, durationSec: 120 },
},
{
  id: 'air-notation-quiz', name: '読譜クイズ', level: 2, category: 'notation',
  modes: ['air'],
  instruction: '五線譜を見て、対応するリズムを4択から選ぶ。逆方向の出題も混ざる。出題は解放済みレベルのパターンのみ。',
  graduation: { bpm: 0, durationSec: 180 },
},
{
  id: 'air-notation-read', name: '譜面を目で追う', level: 3, category: 'notation',
  modes: ['air', 'out'],
  instruction: 'ガイドレベルを1段上げた状態でパターンを再生し、五線譜だけを見ながら口ドラムで読む。手は動かさなくてよい。',
  graduation: { bpm: 60, durationSec: 120 },
},
{
  id: 'air-drum', name: 'エアドラム', level: 2, category: 'beat',
  modes: ['air'],
  instruction: '膝や太ももを叩いて手足の動きだけ通す。打面の跳ね返りがないため本番の代替にはならないが、順序の記憶には有効。',
  graduation: { bpm: 60, durationSec: 120 },
},
```

---

## 4. レベル解放条件

```
Lv1 → Lv2: Lv1の全ドリルをチェック済みにする
Lv2 → Lv3: Lv2のうち3つ以上を卒業
Lv3 → Lv4: eight-beat-basic を卒業
Lv4 → Lv5: Lv4のうち3つ以上を卒業
Lv5 → Lv6: sixteen-beat を卒業
```

パターン集の表示も `unlockedLevel` に連動させ、未解放は名前だけグレー表示＋解放条件を出す。

---

## 5. 読譜の段階

各レベルで初めて登場する記譜要素。`/notation` のリファレンスはこの順に解放する。
ガイドレベル（spec.md §3.8）の自動決定にも同じ対応を使う。

| レベル | 新しく出る記号 | ガイドレベル |
|---|---|---|
| Lv1–2 | 五線、パーカッションクレフ、4分音符、4分休符、●の符頭 | 1 |
| Lv3 | ✕の符頭（ハイハット）、8分音符と連桁、8分休符、符尾の上下（手／足） | 2 |
| Lv4 | ダブルストロークの運指表記（R/L）、アクセント記号、小節線とリピート | 3 |
| Lv5 | 16分音符と連桁、3連符の括り、○（オープンハイハット） | 3 |
| Lv6 | タムの位置、クラッシュの加線、1小節リピート記号 | 4 |
