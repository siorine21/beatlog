import type { Lane } from './types';

/** 表示順（上から）。グリッドと五線譜で共通に使う。 */
export const LANE_ORDER: Lane[] = ['crash', 'ride', 'hihat', 'tom1', 'snare', 'tom2', 'kick'];

export const LANE_LABEL: Record<Lane, string> = {
  crash: 'CR',
  ride: 'RD',
  hihat: 'HH',
  tom1: 'T1',
  snare: 'SN',
  tom2: 'T2',
  kick: 'BD',
};

export const LANE_NAME_JA: Record<Lane, string> = {
  crash: 'クラッシュ',
  ride: 'ライド',
  hihat: 'ハイハット',
  tom1: 'ハイタム',
  snare: 'スネア',
  tom2: 'ロータム',
  kick: 'バスドラム',
};

/**
 * レーンの色。globals.css の @theme と同じ値を持つ。
 * グリッドと五線譜で完全に一致させること（spec.md §3.8「色の一貫性」）。
 */
export const LANE_COLOR: Record<Lane, string> = {
  crash: '#a98fd0',
  ride: '#8fa8d0',
  hihat: '#d2a34a',
  tom1: '#6aa87f',
  snare: '#d05b50',
  tom2: '#4f8f6a',
  kick: '#4b84c4',
};

/**
 * 五線譜（紙の上）で使う色。色相はグリッドと同じで、明るい紙の上で
 * 沈まないように暗く振ってある。グリッドと五線譜で「同じレーンは同じ色」を
 * 保つのが目的（spec.md §3.8「色の一貫性」）。
 */
export const LANE_COLOR_PRINT: Record<Lane, string> = {
  crash: '#7a5fa8',
  ride: '#5a76a8',
  hihat: '#a87c1e',
  tom1: '#3f7a58',
  snare: '#b03f35',
  tom2: '#2f6a4c',
  kick: '#2f6099',
};

/** そのパターンが実際に使っているレーンを表示順で返す。 */
export function lanesOf(grid: Partial<Record<Lane, number[]>>): Lane[] {
  return LANE_ORDER.filter((lane) => grid[lane]?.some((v) => v > 0));
}
