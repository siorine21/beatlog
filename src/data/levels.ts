import type { AssistLevel } from '@/lib/types';
import { drills } from './drills';

export const MAX_LEVEL = 6;

/**
 * docs/drills.md §4 レベル解放条件。
 *   Lv1 → Lv2: Lv1の全ドリルをチェック済みにする
 *   Lv2 → Lv3: Lv2のうち3つ以上を卒業
 *   Lv3 → Lv4: eight-beat-basic を卒業
 *   Lv4 → Lv5: Lv4のうち3つ以上を卒業
 *   Lv5 → Lv6: sixteen-beat を卒業
 */
export type UnlockRule =
  /**
   * その level のカリキュラムドリル（supplemental を除く）を count 個以上卒業する。
   * count 未指定ならそのレベル全部。
   */
  | { kind: 'levelCount'; level: number; count?: number }
  /** 指定したドリルをすべて卒業する */
  | { kind: 'drills'; drillIds: string[] };

export interface LevelUnlock {
  /** 解放される側のレベル */
  level: number;
  rule: UnlockRule;
  /** 未解放のパターン/ドリルに表示する条件文 */
  description: string;
}

export const levelUnlocks: LevelUnlock[] = [
  { level: 2, rule: { kind: 'levelCount', level: 1 }, description: 'Lv1 の全ドリルを完了する' },
  { level: 3, rule: { kind: 'levelCount', level: 2, count: 3 }, description: 'Lv2 のドリルを3つ以上卒業する' },
  { level: 4, rule: { kind: 'drills', drillIds: ['eight-beat-basic'] }, description: '「8ビート基本形」を卒業する' },
  { level: 5, rule: { kind: 'levelCount', level: 4, count: 3 }, description: 'Lv4 のドリルを3つ以上卒業する' },
  { level: 6, rule: { kind: 'drills', drillIds: ['sixteen-beat'] }, description: '「16ビート」を卒業する' },
];

const unlockByLevel = new Map(levelUnlocks.map((u) => [u.level, u]));

/** そのレベルを解放するための条件文。Lv1 は最初から解放されている。 */
export function unlockRequirement(level: number): string | undefined {
  return unlockByLevel.get(level)?.description;
}

function ruleSatisfied(rule: UnlockRule, graduated: ReadonlySet<string>): boolean {
  if (rule.kind === 'drills') {
    return rule.drillIds.every((id) => graduated.has(id));
  }
  // air モード専用の補助ドリルは母数に入れない（drills.md §3 は §4 の「Lvn のドリル」ではない）
  const inLevel = drills.filter((d) => d.level === rule.level && !d.supplemental);
  const done = inLevel.filter((d) => graduated.has(d.id)).length;
  const need = rule.count ?? inLevel.length;
  return inLevel.length > 0 && done >= need;
}

/**
 * 卒業済みドリルIDの集合から、解放されているレベルを求める純関数。
 * 途中の条件が満たされていなければそこで止まる（Lv6 だけ先に解放されることはない）。
 */
export function computeUnlockedLevel(graduatedDrillIds: Iterable<string>): number {
  const graduated = new Set(graduatedDrillIds);
  let level = 1;
  for (const unlock of levelUnlocks) {
    if (unlock.level !== level + 1) continue;
    if (!ruleSatisfied(unlock.rule, graduated)) break;
    level = unlock.level;
  }
  return Math.min(level, MAX_LEVEL);
}

export const isUnlocked = (level: number, unlockedLevel: number): boolean => level <= unlockedLevel;

/**
 * spec.md §3.8 / drills.md §5: ドリルのレベルからガイドレベルを自動決定する。
 * Lv1-2 → 1、Lv3 → 2、Lv4-5 → 3、Lv6 → 4
 */
export function autoAssistLevel(drillLevel: number): AssistLevel {
  if (drillLevel <= 2) return 1;
  if (drillLevel === 3) return 2;
  if (drillLevel <= 5) return 3;
  return 4;
}
