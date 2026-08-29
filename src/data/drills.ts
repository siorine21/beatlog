import type { Drill } from '@/lib/types';

/**
 * docs/drills.md §2「ドリルカリキュラム」と §3「air モード専用ドリル」。
 * 表形式で書かれている卒業条件も Drill.graduation に変換してある。
 *
 * modes の付け方（drills.md が明示していないドリルの判断基準）:
 *  - 打面が1つで足りる手のドリルは home / out の両方（out はマイクで打点のみ判定 = spec §6.5）
 *  - 左右の音量差を見るものは velocity が要るので home のみ
 *  - 足を使うもの・複数の打面を打ち分けるものは home のみ
 *  - air は判定なし。§3 の専用ドリルのみ
 */
export const drills: Drill[] = [
  // ---- Lv1 セットアップとフォーム（判定なし・チェックリスト） ----
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

  // ---- Lv2 単打の精度 ----
  {
    id: 'right-only', name: '右手のみ4分打ち', level: 2, category: 'hand',
    modes: ['home', 'out'],
    instruction: 'クリックに合わせて右手だけで4分音符を打つ。振り上げの高さを一定に保つ。',
    graduation: { bpm: 80, durationSec: 60, maxMeanAbsErrorMs: 25 },
  },
  {
    id: 'left-only', name: '左手のみ4分打ち', level: 2, category: 'hand',
    modes: ['home', 'out'],
    instruction: 'クリックに合わせて左手だけで4分音符を打つ。右手と同じ音量・同じ高さを目指す。',
    // 初心者が最も苦戦する箇所。右手より目標BPMを下げてある。
    graduation: { bpm: 70, durationSec: 60, maxMeanAbsErrorMs: 25 },
  },
  {
    id: 'alternate-8th', name: '交互8分（RLRL）', level: 2, category: 'hand',
    modes: ['home', 'out'],
    instruction: '右左を交互に8分音符で打つ。左右で音の間隔が変わらないように。',
    graduation: { bpm: 90, durationSec: 60, maxMeanAbsErrorMs: 20 },
  },
  {
    id: 'volume-balance', name: '左右の音量を揃える', level: 2, category: 'hand',
    modes: ['home'],
    instruction: '交互に打ちながら、右手と左手の音量差をなくす。強い方を弱めるのではなく、弱い方の振りを大きくする。',
    graduation: { bpm: 80, durationSec: 60, maxVelocityDiff: 20 },
  },

  // ---- Lv3 8ビート（home中心） ----
  {
    id: 'hihat-only', name: 'ハイハット8分のみ', level: 3, category: 'beat',
    modes: ['home', 'out'], patternId: 'hihat-8th',
    instruction: 'ハイハットだけを8分で刻み続ける。8ビートの土台なので、揺れずに一定に。',
    graduation: { bpm: 90, durationSec: 60, maxMeanAbsErrorMs: 20 },
  },
  {
    id: 'hihat-snare', name: 'ハイハット + スネア', level: 3, category: 'beat',
    modes: ['home'], patternId: 'hihat-snare',
    instruction: 'ハイハットを8分で刻みながら、2拍目と4拍目にスネアを重ねる。',
    graduation: { bpm: 90, durationSec: 60, maxMeanAbsErrorMs: 20 },
  },
  {
    id: 'kick-quarter', name: 'バスドラ4分踏み（足単体）', level: 3, category: 'foot',
    modes: ['home'],
    instruction: '手は使わず、右足だけで4分音符を踏む。かかとを上げるか下ろすかは固定して統一する。',
    graduation: { bpm: 80, durationSec: 60, maxMeanAbsErrorMs: 30 },
  },
  {
    id: 'eight-beat-basic', name: '8ビート基本形', level: 3, category: 'beat',
    modes: ['home'], patternId: 'eight-beat-basic',
    instruction: 'ハイハット8分、2・4拍にスネア、1・3拍にバスドラ。3点が揃う最初の形。',
    graduation: { bpm: 80, durationSec: 60, maxMeanAbsErrorMs: 30 },
  },
  {
    id: 'eight-beat-var1', name: '8ビート バリエーション1', level: 3, category: 'beat',
    modes: ['home'], patternId: 'eight-beat-var1',
    instruction: '基本形の2拍目裏にバスドラを追加する。足だけが増えるので、手を崩さないこと。',
    graduation: { bpm: 80, durationSec: 60, maxMeanAbsErrorMs: 30 },
  },

  // ---- Lv4 ルーディメンツと足の強化 ----
  {
    id: 'double-stroke', name: 'ダブルストローク（RRLL）', level: 4, category: 'rudiment',
    modes: ['home', 'out'],
    instruction: '同じ手で2打ずつ（RRLL）を8分で。2打目を跳ね返りに任せ、1打目と同じ音量にする。',
    graduation: { bpm: 70, durationSec: 60, maxMeanAbsErrorMs: 25 },
  },
  {
    id: 'paradiddle', name: 'シングルパラディドル（RLRR LRLL）', level: 4, category: 'rudiment',
    modes: ['home', 'out'],
    instruction: 'RLRR LRLL を8分で繰り返す。手順を口で言いながら始めるとよい。',
    graduation: { bpm: 70, durationSec: 60, maxMeanAbsErrorMs: 25 },
  },
  {
    id: 'accent-move', name: 'アクセント移動（4分ごとに強打）', level: 4, category: 'rudiment',
    modes: ['home', 'out'],
    instruction: '8分を交互に打ちながら、4分の位置だけ強く打つ。アクセント以外は小さく揃える。',
    graduation: { bpm: 70, durationSec: 60 },
  },
  {
    id: 'hihat-pedal', name: 'ハイハットペダル4分', level: 4, category: 'foot',
    modes: ['home'],
    instruction: '左足でハイハットペダルを4分で踏む。踏み込みの深さを一定に。',
    graduation: { bpm: 80, durationSec: 60 },
  },
  {
    id: 'two-beat', name: '2ビート', level: 4, category: 'beat',
    modes: ['home'], patternId: 'two-beat',
    instruction: 'バスとスネアが交互に来る疾走系のビート。走らないようにクリックを聴き続ける。',
    graduation: { bpm: 100, durationSec: 60, maxMeanAbsErrorMs: 30 },
  },

  // ---- Lv5 16分と3連 ----
  {
    id: 'sixteen-hihat', name: 'ハイハット16分（片手）', level: 5, category: 'hand',
    modes: ['home', 'out'],
    instruction: '片手で16分を刻み続ける。手首だけで振ろうとせず、指も使う。',
    graduation: { bpm: 70, durationSec: 60, maxMeanAbsErrorMs: 20 },
  },
  {
    id: 'sixteen-beat', name: '16ビート', level: 5, category: 'beat',
    modes: ['home'], patternId: 'sixteen-beat',
    instruction: 'ハイハット16分に2・4拍のスネアと1・3拍のバスドラを乗せる。遅いテンポから。',
    graduation: { bpm: 70, durationSec: 60, maxMeanAbsErrorMs: 30 },
  },
  {
    id: 'shuffle', name: 'シャッフル', level: 5, category: 'beat',
    modes: ['home'], patternId: 'shuffle',
    instruction: '3連符の1つ目と3つ目を刻む跳ねたビート。真ん中を抜く感覚を体に入れる。',
    graduation: { bpm: 80, durationSec: 60, maxMeanAbsErrorMs: 30 },
  },
  {
    id: 'four-on-the-floor', name: '4つ打ち', level: 5, category: 'beat',
    modes: ['home'], patternId: 'four-on-the-floor',
    instruction: '全ての4分にバスドラ。右足の持久力が要る。踏み込みが浅くならないように。',
    graduation: { bpm: 110, durationSec: 60, maxMeanAbsErrorMs: 30 },
  },

  // ---- Lv6 フィルと構成 ----
  {
    id: 'fill-3plus1', name: '3小節ビート + 1小節フィル', level: 6, category: 'fill',
    modes: ['home'], patternId: 'eight-beat-basic',
    instruction: '8ビートを3小節、4小節目にフィルを入れて、また1小節目に戻る。戻りで走らないこと。',
    // 4巡 = 4小節 × 4巡 = 16小節。80BPM の 4/4 で 48 秒。
    graduation: { bpm: 80, durationSec: 48, maxMeanAbsErrorMs: 35, cycles: 4 },
  },
  {
    id: 'fill-quarter', name: '4分音符のフィル（タム移動）', level: 6, category: 'fill',
    modes: ['home'],
    instruction: 'スネア → ハイタム → ロータム → フロア の順に4分で移動する。移動で遅れないように。',
    graduation: { bpm: 80, durationSec: 60 },
  },
  {
    id: 'beat-switch', name: '2種類のビートを4小節ごとに切替', level: 6, category: 'beat',
    modes: ['home'], patternId: 'eight-beat-basic',
    instruction: '8ビート基本形とバリエーション1を4小節ごとに切り替える。切り替えでテンポを乱さないこと。',
    // 8小節 = 80BPM の 4/4 で 24 秒。
    graduation: { bpm: 80, durationSec: 24, cycles: 2 },
  },

  // ---- air モード専用（drills.md §3） ----
  {
    id: 'air-listen', name: 'パターンを聴く', level: 1, category: 'beat',
    modes: ['air'],
    supplemental: true,
    instruction: '次に取り組むパターンを、テンポを落として3分間繰り返し聴く。手は動かさなくてよい。',
    graduation: { bpm: 0, durationSec: 180 },
  },
  {
    id: 'air-vocal', name: '口ドラム', level: 2, category: 'beat',
    modes: ['air', 'out'],
    supplemental: true,
    instruction: 'パターンの口ドラム表記を、クリックに合わせて声に出す。叩けないリズムはまず歌えない。',
    graduation: { bpm: 60, durationSec: 120 },
  },
  {
    id: 'air-notation-quiz', name: '読譜クイズ', level: 2, category: 'notation',
    modes: ['air'],
    supplemental: true,
    instruction: '五線譜を見て、対応するリズムを4択から選ぶ。逆方向の出題も混ざる。出題は解放済みレベルのパターンのみ。',
    graduation: { bpm: 0, durationSec: 180 },
  },
  {
    id: 'air-notation-read', name: '譜面を目で追う', level: 3, category: 'notation',
    modes: ['air', 'out'],
    supplemental: true,
    instruction: 'ガイドレベルを1段上げた状態でパターンを再生し、五線譜だけを見ながら口ドラムで読む。手は動かさなくてよい。',
    graduation: { bpm: 60, durationSec: 120 },
  },
  {
    id: 'air-drum', name: 'エアドラム', level: 2, category: 'beat',
    modes: ['air'],
    supplemental: true,
    instruction: '膝や太ももを叩いて手足の動きだけ通す。打面の跳ね返りがないため本番の代替にはならないが、順序の記憶には有効。',
    graduation: { bpm: 60, durationSec: 120 },
  },
];

export const drillById = new Map(drills.map((d) => [d.id, d]));

export const getDrill = (id: string): Drill | undefined => drillById.get(id);

export const drillsByLevel = (level: number): Drill[] => drills.filter((d) => d.level === level);
