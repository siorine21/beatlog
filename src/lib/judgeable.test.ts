import { describe, expect, it } from 'vitest';
import { isJudgeable, judgeSkipReason } from './judgeable';
import { getDrill } from '@/data/drills';

const drill = (id: string) => getDrill(id)!;

describe('isJudgeable', () => {
  it('自宅モード（MIDI）はパッドの種類が取れるので判定できる', () => {
    expect(isJudgeable(drill('eight-beat-basic'), 'home')).toBe(true);
    expect(isJudgeable(drill('right-only'), 'home')).toBe(true);
  });

  it('外モードは単打・ルーディメンツ系を判定できる', () => {
    expect(isJudgeable(drill('right-only'), 'out')).toBe(true);
    expect(isJudgeable(drill('alternate-8th'), 'out')).toBe(true);
    expect(isJudgeable(drill('paradiddle'), 'out')).toBe(true);
  });

  it('外モードは、ひとつの面だけを叩くパターンなら判定できる', () => {
    // ハイハット8分のみ・16分（片手）はレーンがひとつ
    expect(isJudgeable(drill('hihat-only'), 'out')).toBe(true);
    expect(isJudgeable(drill('sixteen-hihat'), 'out')).toBe(true);
  });

  it('そのモードでできないドリルは判定しない', () => {
    // 8ビートは外モードのドリルではない
    expect(isJudgeable(drill('eight-beat-basic'), 'out')).toBe(false);
  });

  it('手ぶらモードは判定しない', () => {
    expect(isJudgeable(drill('air-vocal'), 'air')).toBe(false);
    expect(isJudgeable(drill('air-drum'), 'air')).toBe(false);
  });

  it('チェックリスト形式は判定しない', () => {
    expect(isJudgeable(drill('setup-grip'), 'home')).toBe(false);
  });
});

describe('judgeSkipReason', () => {
  it('判定できるときは理由を出さない', () => {
    expect(judgeSkipReason(drill('right-only'), 'out')).toBeNull();
  });

  it('手ぶらモードの理由', () => {
    expect(judgeSkipReason(drill('air-vocal'), 'air')).toContain('記録だけ');
  });

  it('チェックリストの理由', () => {
    expect(judgeSkipReason(drill('setup-grip'), 'home')).toContain('チェック項目');
  });
});
