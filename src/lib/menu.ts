import type { Attempt, DailyMenuItem, Drill, PracticeMode } from '@/lib/types';
import { drills } from '@/data/drills';
import { patterns } from '@/data/patterns';

/**
 * 今日のメニュー生成（spec.md §6.4）。
 *
 * ルールベースのみ。LLM は使わず、乱数への依存も最小にする（維持枠の混ぜ方だけ）。
 * DB には触らず、必要なものはすべて引数で受け取る純関数。
 */

/** 1回のメニューに入れるドリル数 */
const MIN_ITEMS = 3;
const MAX_ITEMS = 5;
/** 合計時間の目安（秒） */
const MIN_TOTAL_SEC = 15 * 60;
const MAX_TOTAL_SEC = 25 * 60;
/** 卒業済みドリルを維持枠として混ぜる確率 */
const MAINTENANCE_RATE = 0.35;
/** 同じカテゴリを入れる上限 */
const MAX_PER_CATEGORY = 2;

export interface MenuInput {
  mode: PracticeMode;
  unlockedLevel: number;
  /** ドリルIDごとの試行。新しい順に並んでいること */
  attemptsByDrill: Record<string, Attempt[]>;
  /** 卒業済みのドリルID */
  graduatedIds: string[];
  random?: () => number;
}

/** そのドリルに割り当てる時間（秒） */
export function targetSecOf(drill: Drill): number {
  if (drill.checkpoints) return 180; // 読んで確認するだけの枠
  return Math.max(drill.graduation.durationSec, 60);
}

/**
 * 次に狙う BPM（spec.md §6.4 の 2）。
 *   卒業条件クリア → 前回 + 5
 *   未達 → 前回を維持
 *   2回続けて大きく未達（誤差50ms超） → 前回 - 5
 *   未実施 → 卒業条件の70%から
 */
export function nextTargetBpm(drill: Drill, attempts: Attempt[]): number {
  const goal = drill.graduation.bpm;
  if (goal === 0) return 0; // BPM を持たないドリル（セットアップ・聴くだけ）

  const last = attempts[0];
  if (!last) return Math.max(30, Math.round((goal * 0.7) / 5) * 5);

  const struggling = (a?: Attempt) => a !== undefined && (a.meanAbsErrorMs ?? 0) > 50;
  if (struggling(attempts[0]) && struggling(attempts[1])) return Math.max(30, last.bpm - 5);
  if (last.graduated) return Math.min(240, last.bpm + 5);
  return last.bpm;
}

/** 判定を必要としないドリル（air モードで使えるもの） */
const isJudgementFree = (drill: Drill) => drill.modes.includes('air');

function candidatesFor(mode: PracticeMode, unlockedLevel: number): Drill[] {
  return drills.filter(
    (drill) =>
      drill.level <= unlockedLevel &&
      drill.modes.includes(mode) &&
      // air は判定のいらないものだけで構成する
      (mode !== 'air' || isJudgementFree(drill)),
  );
}

/** 次に解放されるレベルのパターンを持つ「聴いておく」枠を優先する（§6.4 の 4） */
function airPriority(drill: Drill, unlockedLevel: number): number {
  if (drill.id === 'air-listen' && patterns.some((p) => p.level === unlockedLevel + 1)) return 0;
  return 1;
}

export function generateMenu({
  mode,
  unlockedLevel,
  attemptsByDrill,
  graduatedIds,
  random = Math.random,
}: MenuInput): DailyMenuItem[] {
  const graduated = new Set(graduatedIds);
  const candidates = candidatesFor(mode, unlockedLevel);

  const attemptsOf = (id: string) => attemptsByDrill[id] ?? [];

  // 並べ替えの優先順位:
  //   1. air は「次のパターンを聴く」を先頭に
  //   2. 未卒業のもの（今のレベルに近いものほど先）
  //   3. 卒業済みは維持枠として確率的に後ろに混ぜる
  const scored = candidates.map((drill) => {
    const done = graduated.has(drill.id);
    const untouched = attemptsOf(drill.id).length === 0;
    const maintenance = done && random() > MAINTENANCE_RATE;
    return {
      drill,
      score:
        (mode === 'air' ? airPriority(drill, unlockedLevel) * 100 : 0) +
        (maintenance ? 1000 : 0) +
        (done ? 400 : 0) +
        // 今のレベルに近い未卒業ドリルを前に出す
        (unlockedLevel - drill.level) * 10 +
        (untouched ? -5 : 0),
    };
  });

  scored.sort((a, b) => a.score - b.score || a.drill.id.localeCompare(b.drill.id));

  const chosen: Drill[] = [];
  const perCategory = new Map<string, number>();
  let total = 0;

  for (const { drill } of scored) {
    if (chosen.length >= MAX_ITEMS) break;
    const used = perCategory.get(drill.category) ?? 0;
    if (used >= MAX_PER_CATEGORY) continue;

    const sec = targetSecOf(drill);
    // 目安を大きく超えるなら、最低数を満たしていれば打ち切る
    if (total + sec > MAX_TOTAL_SEC && chosen.length >= MIN_ITEMS) break;

    chosen.push(drill);
    perCategory.set(drill.category, used + 1);
    total += sec;

    if (total >= MIN_TOTAL_SEC && chosen.length >= MIN_ITEMS) break;
  }

  return chosen.map((drill) => ({
    drillId: drill.id,
    targetBpm: nextTargetBpm(drill, attemptsOf(drill.id)),
    targetSec: targetSecOf(drill),
    done: false,
  }));
}
