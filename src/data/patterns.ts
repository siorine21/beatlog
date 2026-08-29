import type { RhythmPattern } from '@/lib/types';

/**
 * docs/drills.md §1 のリズムパターン。
 * grid のインデックス（resolution: 16）:
 *   step  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
 *   拍    1  e  &  a  2  e  &  a  3  e  &  a  4  e  &  a
 * resolution: 12 は1小節を3連符×4拍で分割したもの（3ステップ=1拍）。
 */
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

export const patternById = new Map(patterns.map((p) => [p.id, p]));

export const getPattern = (id: string): RhythmPattern | undefined => patternById.get(id);
