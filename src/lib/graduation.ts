import type { Attempt, Drill } from '@/lib/types';

/**
 * 卒業判定（drills.md の卒業条件）。
 *
 * 判定値（meanAbsErrorMs）は Phase 4 の MIDI / マイク入力が入るまで取れない。
 * spec.md §4 が「maxMeanAbsErrorMs は判定なしモードでは無視」としているため、
 * 値が無いときは精度の条件を外す。ただし本人が「うまくいかなかった（bad）」と
 * 評価したものを卒業にはしない。
 */
export type GraduationInput = Pick<
  Attempt,
  'bpm' | 'durationSec' | 'meanAbsErrorMs' | 'subjective'
> & {
  /** チェックリスト形式のドリルで、全項目を確認したか */
  checkedAll?: boolean;
};

export function isGraduated(drill: Drill, attempt: GraduationInput): boolean {
  // Lv1 のセットアップ系はチェック項目をすべて確認すれば卒業
  if (drill.checkpoints) return attempt.checkedAll === true;

  const { bpm, durationSec } = drill.graduation;
  if (attempt.bpm < bpm) return false;
  if (attempt.durationSec < durationSec) return false;

  const limit = drill.graduation.maxMeanAbsErrorMs;
  if (limit !== undefined && attempt.meanAbsErrorMs !== undefined) {
    return attempt.meanAbsErrorMs <= limit;
  }

  // 判定できないときは主観評価で代える
  return attempt.subjective !== 'bad';
}

/** 卒業済みのドリルID。Attempt.graduated が立ったものを集める */
export function graduatedDrillIds(attempts: Pick<Attempt, 'drillId' | 'graduated'>[]): string[] {
  const ids = new Set<string>();
  for (const attempt of attempts) if (attempt.graduated) ids.add(attempt.drillId);
  return [...ids];
}
