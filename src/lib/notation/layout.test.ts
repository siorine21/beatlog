import { describe, expect, it } from 'vitest';
import { buildNotation, type NotationItem, type NotationVoice } from './layout';
import { getPattern } from '@/data/patterns';
import type { RhythmPattern } from '@/lib/types';

/** テスト用にパターンを組み立てる */
function pattern(
  grid: RhythmPattern['grid'],
  resolution: RhythmPattern['resolution'] = 16,
): RhythmPattern {
  return {
    id: 'test',
    name: 'test',
    level: 1,
    resolution,
    bars: 1,
    bpmRange: [60, 120],
    grid,
    vocal: '',
  };
}

/** 1拍ぶんを「種類:開始ステップ:音価」の並びに畳む */
const shape = (items: NotationItem[]) =>
  items.map((i) => `${i.kind === 'note' ? 'n' : 'r'}:${i.step}:${i.duration}`);

const beatShapes = (voice: NotationVoice) => voice.beats.map((b) => shape(b.items));

describe('buildNotation — 休符の推論', () => {
  it('打点のない拍は4分休符ひとつになる', () => {
    const layout = buildNotation(pattern({ snare: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }));
    expect(beatShapes(layout.hands)).toEqual([
      ['n:0:4'],
      ['r:4:4'],
      ['r:8:4'],
      ['r:12:4'],
    ]);
  });

  it('拍の先頭が空いていれば、そこに休符を置く', () => {
    // 2拍目の裏（step 6）だけ鳴る → 8分休符 + 8分音符
    const layout = buildNotation(pattern({ snare: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] }));
    expect(beatShapes(layout.hands)[1]).toEqual(['r:4:2', 'n:6:2']);
  });

  it('16分ひとつぶんの空きは16分休符になる', () => {
    // step 5 のみ → 16分休符が2つ分（8分 + 16分の順で埋める）
    const layout = buildNotation(pattern({ snare: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }));
    expect(beatShapes(layout.hands)[1]).toEqual(['r:4:1', 'n:5:3']);
  });

  it('音価は次の打点までの距離になる', () => {
    // 1拍目に step0 と step2 → 8分 + 8分
    const layout = buildNotation(pattern({ snare: [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }));
    expect(beatShapes(layout.hands)[0]).toEqual(['n:0:2', 'n:2:2']);
  });

  it('拍をまたいで音価が伸びることはない', () => {
    const layout = buildNotation(pattern({ snare: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }));
    // step0 の音価は拍の終わり（4ステップ）で止まる
    expect(beatShapes(layout.hands)[0]).toEqual(['n:0:4']);
  });
});

describe('buildNotation — 声部の分離', () => {
  it('手と足を別の声部に分け、符尾の向きを変える', () => {
    const layout = buildNotation(getPattern('eight-beat-basic')!);
    expect(layout.hands.stem).toBe('up');
    expect(layout.feet.stem).toBe('down');

    // 手はハイハット8分＋2・4拍のスネア
    expect(beatShapes(layout.hands)).toEqual([
      ['n:0:2', 'n:2:2'],
      ['n:4:2', 'n:6:2'],
      ['n:8:2', 'n:10:2'],
      ['n:12:2', 'n:14:2'],
    ]);
    // 2拍目の頭はハイハットとスネアが重なる
    const beat2 = layout.hands.beats[1].items[0];
    expect(beat2.kind === 'note' && beat2.lanes).toEqual(['hihat', 'snare']);

    // 足は1・3拍にバスドラ、2・4拍は休符
    expect(beatShapes(layout.feet)).toEqual([['n:0:4'], ['r:4:4'], ['n:8:4'], ['r:12:4']]);
  });
});

describe('buildNotation — 連桁', () => {
  it('8分は拍ごとに2つずつつなぐ', () => {
    const layout = buildNotation(getPattern('eight-beat-basic')!);
    const groups = layout.hands.beats.map((b) => b.beamGroups.map((g) => g.length));
    expect(groups).toEqual([[2], [2], [2], [2]]);
    expect(layout.hands.beats[0].beamGroups[0][0].beams).toBe(1);
  });

  it('16分は連桁2本になる', () => {
    const layout = buildNotation(getPattern('sixteen-beat')!);
    expect(layout.hands.beats[0].beamGroups[0].length).toBe(4);
    expect(layout.hands.beats[0].beamGroups[0][0].beams).toBe(2);
  });

  it('4分音符は連桁にも旗にもならない', () => {
    const layout = buildNotation(getPattern('eight-beat-basic')!);
    // 足のバスドラは4分
    const note = layout.feet.beats[0].items[0];
    expect(note.kind === 'note' && note.beams).toBe(0);
    expect(layout.feet.beats[0].beamGroups).toEqual([]);
  });

  it('休符をまたいで連桁でつながない', () => {
    // 1拍目: step0 に8分、step2 は休符、という形は作れないので
    // step1 と step3 に16分を置き、間の休符で切れることを見る
    const layout = buildNotation(pattern({ snare: [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }));
    expect(beatShapes(layout.hands)[0]).toEqual(['r:0:1', 'n:1:2', 'n:3:1']);
    expect(layout.hands.beats[0].beamGroups.map((g) => g.length)).toEqual([2]);
  });
});

describe('buildNotation — resolution 12（3連・シャッフル）', () => {
  it('3ステップで1拍とし、拍内に2つ以上あれば3連符の括りを付ける', () => {
    const layout = buildNotation(getPattern('shuffle')!);
    expect(layout.stepsPerBeat).toBe(3);
    expect(layout.hands.beats.map((b) => b.triplet)).toEqual([true, true, true, true]);

    // シャッフルの手は 1拍目に step0（音価2）と step2（音価1）
    expect(beatShapes(layout.hands)[0]).toEqual(['n:0:2', 'n:2:1']);
    // 連桁で2つをつなぐ
    expect(layout.hands.beats[0].beamGroups.map((g) => g.length)).toEqual([2]);
    // 3連系の連桁は1本
    expect(layout.hands.beats[0].beamGroups[0].map((n) => n.beams)).toEqual([1, 1]);
  });

  it('足は1拍まるごとの音価になり、3連符の括りは付かない', () => {
    const layout = buildNotation(getPattern('shuffle')!);
    expect(beatShapes(layout.feet)).toEqual([['n:0:3'], ['r:3:3'], ['n:6:3'], ['r:9:3']]);
    expect(layout.feet.beats.map((b) => b.triplet)).toEqual([false, false, false, false]);
  });
});

describe('buildNotation — マスタデータ全件', () => {
  it('どのパターンも各拍の音価の合計が1拍ぶんになる', () => {
    for (const id of [
      'hihat-8th',
      'hihat-snare',
      'eight-beat-basic',
      'eight-beat-var1',
      'four-on-the-floor',
      'half-time',
      'sixteen-beat',
      'two-beat',
      'shuffle',
    ]) {
      const p = getPattern(id)!;
      const layout = buildNotation(p);
      for (const voice of [layout.hands, layout.feet]) {
        for (const beat of voice.beats) {
          const total = beat.items.reduce((sum, i) => sum + i.duration, 0);
          expect(`${id}:${voice.stem}:${beat.index}=${total}`).toBe(
            `${id}:${voice.stem}:${beat.index}=${layout.stepsPerBeat}`,
          );
        }
      }
    }
  });
});
