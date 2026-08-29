import { describe, expect, it } from 'vitest';
import { usedSymbolIds } from './symbols-used';
import { notationSymbols } from '@/data/notation-symbols';
import { getPattern, patterns } from '@/data/patterns';

describe('usedSymbolIds', () => {
  it('返す ID はすべてリファレンスに存在する', () => {
    const known = new Set(notationSymbols.map((s) => s.id));
    for (const pattern of patterns) {
      for (const id of usedSymbolIds(pattern)) expect(known).toContain(id);
    }
  });

  it('8ビート基本形: ✕と●の符頭、8分連桁、符尾の上下、4分音符と4分休符', () => {
    const ids = usedSymbolIds(getPattern('eight-beat-basic')!);
    expect(ids).toEqual(
      expect.arrayContaining([
        'notehead-cross',
        'notehead-round',
        'eighth-beam',
        'stem-direction',
        'quarter-note',
        'quarter-rest',
      ]),
    );
    expect(ids).not.toContain('sixteenth');
    expect(ids).not.toContain('triplet');
  });

  it('16ビート: 16分の連桁が入る', () => {
    expect(usedSymbolIds(getPattern('sixteen-beat')!)).toContain('sixteenth');
  });

  it('シャッフル: 3連符の括りが入り、16分は入らない', () => {
    const ids = usedSymbolIds(getPattern('shuffle')!);
    expect(ids).toContain('triplet');
    expect(ids).not.toContain('sixteenth');
  });

  it('ハイハット8分のみ: 足を使わないので符尾の上下は出ない', () => {
    expect(usedSymbolIds(getPattern('hihat-8th')!)).not.toContain('stem-direction');
  });
});
