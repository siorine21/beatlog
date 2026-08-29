import type { Lane, Resolution, RhythmPattern } from '@/lib/types';

/**
 * リズムパターンから五線譜を描くための中間表現を作る純関数（spec.md §6.6）。
 *
 * ドラム譜の標準に従い、手（符尾は上向き）と足（符尾は下向き）の2声部に分ける。
 *   上声部 = hihat ∪ snare ∪ tom ∪ crash ∪ ride
 *   下声部 = kick ∪ hihatPedal
 *
 * 各声部について、1拍ごとに区切り、打点位置から音価を決め、
 * 打点のない先頭部分に休符を置く。8分・16分は拍単位で連桁でつなぐ。
 * resolution 12 は3ステップで1拍とし、3連符の括りを付ける。
 *
 * 描画には関与しない（座標もSVGも持たない）。休符の推論を間違えやすいので
 * ここだけをテストできるようにしてある。
 */

/** 上声部（手）のレーン */
export const HAND_LANES: Lane[] = ['crash', 'ride', 'hihat', 'tom1', 'snare', 'tom2'];
/** 下声部（足）のレーン。ハイハットペダルは Lane 型に無いので将来追加する */
export const FOOT_LANES: Lane[] = ['kick'];

export type StemDirection = 'up' | 'down';

export interface NotationNote {
  kind: 'note';
  /** 小節内のステップ番号 */
  step: number;
  /** 音価（ステップ数）。次の打点まで、なければ拍の終わりまで */
  duration: number;
  /** 同時に鳴るレーン。ひとつの符尾に複数の符頭が付く */
  lanes: Lane[];
  /** 連桁の本数。0 なら旗も連桁もない（4分以上） */
  beams: number;
}

export interface NotationRest {
  kind: 'rest';
  step: number;
  duration: number;
}

export type NotationItem = NotationNote | NotationRest;

export interface NotationBeat {
  /** 0..3 */
  index: number;
  startStep: number;
  items: NotationItem[];
  /** 3連符の括りを付けるか（resolution 12 で拍内に2つ以上の音符があるとき） */
  triplet: boolean;
  /** 連桁でつなぐ音符の並び。1つだけの並びは旗になる */
  beamGroups: NotationNote[][];
}

export interface NotationVoice {
  stem: StemDirection;
  beats: NotationBeat[];
}

export interface NotationLayout {
  resolution: Resolution;
  stepsPerBeat: number;
  /** 上声部（手）と下声部（足） */
  hands: NotationVoice;
  feet: NotationVoice;
}

/** 1小節は常に4拍として扱う */
const BEATS_PER_BAR = 4;

/** その音価に必要な連桁（旗）の本数 */
function beamCount(duration: number, stepsPerBeat: number): number {
  // 4分（1拍まるごと）以上は連桁も旗も付かない
  if (duration >= stepsPerBeat) return 0;
  if (stepsPerBeat === 3) return 1; // 3連系はすべて8分相当
  return duration === 1 ? 2 : 1; // 16分は2本、8分と付点8分は1本
}

/**
 * 打点のない区間に休符を並べる。
 * 拍まるごと空いていれば4分休符ひとつ、それ以外は8分・16分に割る。
 */
function pushRests(items: NotationItem[], start: number, count: number, stepsPerBeat: number): void {
  if (count <= 0) return;
  if (count === stepsPerBeat) {
    items.push({ kind: 'rest', step: start, duration: count });
    return;
  }
  let step = start;
  let left = count;
  while (left > 0) {
    const duration = left >= 2 ? 2 : 1;
    items.push({ kind: 'rest', step, duration });
    step += duration;
    left -= duration;
  }
}

function buildVoice(pattern: RhythmPattern, lanes: Lane[], stem: StemDirection): NotationVoice {
  const stepsPerBeat = pattern.resolution / BEATS_PER_BAR;
  const lanesAt = (step: number) => lanes.filter((lane) => (pattern.grid[lane]?.[step] ?? 0) > 0);

  const beats: NotationBeat[] = [];

  for (let index = 0; index < BEATS_PER_BAR; index++) {
    const startStep = index * stepsPerBeat;
    const items: NotationItem[] = [];

    const hits: number[] = [];
    for (let i = 0; i < stepsPerBeat; i++) {
      if (lanesAt(startStep + i).length > 0) hits.push(i);
    }

    if (hits.length === 0) {
      items.push({ kind: 'rest', step: startStep, duration: stepsPerBeat });
    } else {
      pushRests(items, startStep, hits[0], stepsPerBeat);
      hits.forEach((offset, k) => {
        const nextOffset = k + 1 < hits.length ? hits[k + 1] : stepsPerBeat;
        const duration = nextOffset - offset;
        items.push({
          kind: 'note',
          step: startStep + offset,
          duration,
          lanes: lanesAt(startStep + offset),
          beams: beamCount(duration, stepsPerBeat),
        });
      });
    }

    // 連桁は拍の中だけでつなぐ。連桁の付かない音符（4分以上）で切れる
    const beamGroups: NotationNote[][] = [];
    let group: NotationNote[] | null = null;
    for (const item of items) {
      if (item.kind === 'note' && item.beams > 0) {
        if (!group) {
          group = [];
          beamGroups.push(group);
        }
        group.push(item);
      } else {
        group = null;
      }
    }

    beats.push({
      index,
      startStep,
      items,
      triplet: stepsPerBeat === 3 && items.filter((i) => i.kind === 'note').length > 1,
      beamGroups,
    });
  }

  return { stem, beats };
}

export function buildNotation(pattern: RhythmPattern): NotationLayout {
  return {
    resolution: pattern.resolution,
    stepsPerBeat: pattern.resolution / BEATS_PER_BAR,
    hands: buildVoice(pattern, HAND_LANES, 'up'),
    feet: buildVoice(pattern, FOOT_LANES, 'down'),
  };
}
