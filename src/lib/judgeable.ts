import type { Drill, PracticeMode } from './types';
import { getPattern } from '@/data/patterns';
import { lanesOf } from './lanes';

/**
 * そのドリルを、そのモードで判定できるか。
 *
 * home（MIDI）はパッドの種類が取れるので何でも判定できる。
 * out（マイク）は打点の種類が取れないため、単打・ルーディメンツ系と、
 * ひとつの面だけを叩くパターンに限る（spec.md §6.5）。
 * 複数の面を叩き分けるパターンは、out では判定せずログだけ残す。
 */
export function isJudgeable(drill: Drill, mode: PracticeMode): boolean {
  if (!drill.modes.includes(mode)) return false;
  if (drill.checkpoints) return false; // フォームの確認だけのドリル
  if (mode === 'air') return false;
  if (mode === 'home') return true;

  // ここから out（マイク）
  if (drill.category === 'hand' || drill.category === 'rudiment') return true;

  const pattern = drill.patternId ? getPattern(drill.patternId) : undefined;
  if (!pattern) return false;
  return lanesOf(pattern.grid).length === 1;
}

/** 判定しない理由（画面に出す） */
export function judgeSkipReason(drill: Drill, mode: PracticeMode): string | null {
  if (isJudgeable(drill, mode)) return null;
  if (mode === 'air') return '手ぶらモードでは判定せず、記録だけ残します。';
  if (drill.checkpoints) return 'チェック項目を確認するドリルなので判定はありません。';
  if (mode === 'out') {
    return 'マイクでは打点の種類が分からないため、このドリルは判定せず記録だけ残します。';
  }
  return null;
}
