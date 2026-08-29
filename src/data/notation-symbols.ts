/**
 * 読譜の段階（docs/drills.md §5）。
 * /notation のリファレンスはこの順に解放する。初心者に全部を見せない。
 */
export interface NotationSymbol {
  id: string;
  /** この記号が初めて出るレベル */
  level: number;
  name: string;
  description: string;
  /** 文字で示せる記号 */
  glyph?: string;
  /** 譜例として描くパターン */
  demoPatternId?: string;
}

export const notationSymbols: NotationSymbol[] = [
  {
    id: 'staff-clef',
    level: 2,
    name: '五線とパーカッションクレフ',
    description:
      '左端の縦2本線がパーカッションクレフ。ドラム譜では音の高さではなく、線と間のどこに置くかで楽器を表す。',
    demoPatternId: 'hihat-8th',
  },
  {
    id: 'notehead-round',
    level: 2,
    name: '● の符頭',
    glyph: '●',
    description: '打面のある楽器（スネア・バスドラム・タム）に使う。',
  },
  {
    id: 'quarter-note',
    level: 2,
    name: '4分音符',
    description: '1拍ぶんの長さ。符尾（棒）だけが付き、旗も連桁も付かない。',
  },
  {
    id: 'quarter-rest',
    level: 2,
    name: '4分休符',
    description: 'その拍を鳴らさない。声部ごとに置くので、手が休んで足だけ鳴ることもある。',
  },
  {
    id: 'notehead-cross',
    level: 3,
    name: '✕ の符頭',
    glyph: '✕',
    description: 'ハイハットやシンバル類に使う。第5線の上の間がクローズハイハット。',
    demoPatternId: 'hihat-8th',
  },
  {
    id: 'eighth-beam',
    level: 3,
    name: '8分音符と連桁',
    description: '1拍を2つに割った長さ。同じ拍の中にあるものは連桁（横棒）でつなぐ。',
    demoPatternId: 'hihat-snare',
  },
  {
    id: 'eighth-rest',
    level: 3,
    name: '8分休符',
    description: '8分音符ぶんの休み。拍の頭が空いているときにそこへ置く。',
  },
  {
    id: 'stem-direction',
    level: 3,
    name: '符尾の上下（手と足）',
    description:
      '上向きの符尾が手（ハイハット・スネア）、下向きが足（バスドラム）。2声部に分けて書く。',
    demoPatternId: 'eight-beat-basic',
  },
  {
    id: 'sticking',
    level: 4,
    name: '運指表記 R / L',
    glyph: 'R L',
    description: '音符の下に付けて、右手（R）か左手（L）かを指示する。ダブルストロークは RRLL。',
  },
  {
    id: 'accent',
    level: 4,
    name: 'アクセント記号',
    glyph: '>',
    description: '音符の上に付けて、そこを強く打つことを表す。',
  },
  {
    id: 'barline-repeat',
    level: 4,
    name: '小節線とリピート',
    glyph: '𝄆 𝄇',
    description: '小節の区切りが小節線。リピート記号で囲まれた範囲は繰り返す。',
  },
  {
    id: 'sixteenth',
    level: 5,
    name: '16分音符と連桁',
    description: '1拍を4つに割った長さ。連桁は2本になる。',
    demoPatternId: 'sixteen-beat',
  },
  {
    id: 'triplet',
    level: 5,
    name: '3連符の括り',
    glyph: '3',
    description: '1拍を3つに割る。括りと「3」の数字で示す。シャッフルはこの1つ目と3つ目を打つ。',
    demoPatternId: 'shuffle',
  },
  {
    id: 'open-hihat',
    level: 5,
    name: '○（オープンハイハット）',
    glyph: '○',
    description: '✕ の上に ○ を付けて、ハイハットを開いて鳴らすことを表す。',
  },
  {
    id: 'tom-position',
    level: 6,
    name: 'タムの位置',
    description: 'ハイタムは第4間、ロータムは第2間。どちらも ● の符頭を使う。',
  },
  {
    id: 'crash-ledger',
    level: 6,
    name: 'クラッシュの加線',
    description: '五線の上に加線を引き、その位置に ✕ を置く。',
  },
  {
    id: 'bar-repeat',
    level: 6,
    name: '1小節リピート記号',
    glyph: '𝄎',
    description: '前の1小節と同じことを繰り返す。同じビートが続く譜面で使われる。',
  },
];
