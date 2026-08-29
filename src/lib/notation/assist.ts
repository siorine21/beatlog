import type { AssistLevel } from '@/lib/types';

/**
 * ガイドレベル（spec.md §3.8）。補助を段階的に剥がして読譜力を育てる。
 *
 * | assist | グリッド | 五線譜 | 色分け | ふりがな | 拍カウント |
 * |---|---|---|---|---|---|
 * | 0 | 主 | なし | — | — | — |
 * | 1 | 主 | 従 | あり | 全音符に | あり |
 * | 2 | 従（小さく） | 主 | あり | 全音符に | あり |
 * | 3 | なし | 主 | 薄く | 初出の記号のみ | あり |
 * | 4 | なし | 主 | なし | なし | なし |
 */
export interface AssistConfig {
  grid: 'main' | 'mini' | 'none';
  staff: 'none' | 'sub' | 'main';
  /** 音符の色の濃さ。0 で黒一色、1 でグリッドと同じ色 */
  colorAmount: number;
  furigana: boolean;
  counts: boolean;
  /** 記号の凡例（ふりがなの代わりに「初出の記号」を説明する） */
  legend: boolean;
  description: string;
}

export const ASSIST_LEVELS: Record<AssistLevel, AssistConfig> = {
  0: {
    grid: 'main',
    staff: 'none',
    colorAmount: 1,
    furigana: false,
    counts: false,
    legend: false,
    description: 'グリッドのみ。初回起動直後だけ使う段階です。',
  },
  1: {
    grid: 'main',
    staff: 'sub',
    colorAmount: 1,
    furigana: true,
    counts: true,
    legend: false,
    description:
      'グリッドが主、五線譜が従。色・ふりがな・拍カウントをすべて出し、対応付けを覚えます。',
  },
  2: {
    grid: 'mini',
    staff: 'main',
    colorAmount: 1,
    furigana: true,
    counts: true,
    legend: false,
    description: '五線譜が主に入れ替わり、グリッドは答え合わせ用に小さく残ります。',
  },
  3: {
    grid: 'none',
    staff: 'main',
    colorAmount: 0.3,
    furigana: false,
    counts: true,
    legend: true,
    description: 'グリッドが外れ、色も薄くなります。拍カウントと記号の凡例だけが残ります。',
  },
  4: {
    grid: 'none',
    staff: 'main',
    colorAmount: 0,
    furigana: false,
    counts: false,
    legend: false,
    description: '市販の教則本やバンドスコアと同じ、素の譜面です。ここが到達点。',
  },
};

export const ASSIST_ORDER: AssistLevel[] = [0, 1, 2, 3, 4];

export const clampAssist = (value: number): AssistLevel =>
  Math.min(4, Math.max(0, Math.round(value))) as AssistLevel;
