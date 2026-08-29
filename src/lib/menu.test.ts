import { describe, expect, it } from 'vitest';
import { generateMenu, nextTargetBpm, targetSecOf, type MenuInput } from './menu';
import { getDrill, drills } from '@/data/drills';
import type { Attempt } from '@/lib/types';

const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  id: 'a',
  sessionId: 's',
  drillId: 'hihat-only',
  bpm: 80,
  durationSec: 60,
  subjective: 'ok',
  graduated: false,
  ...over,
});

const input = (over: Partial<MenuInput> = {}): MenuInput => ({
  mode: 'home',
  unlockedLevel: 3,
  attemptsByDrill: {},
  graduatedIds: [],
  // 乱数は固定する。維持枠の混ぜ方以外は決定的であること
  random: () => 0.99,
  ...over,
});

describe('nextTargetBpm', () => {
  const drill = getDrill('hihat-only')!; // 卒業 90BPM

  it('未実施なら卒業条件の70%から始める', () => {
    expect(nextTargetBpm(drill, [])).toBe(65);
  });

  it('卒業条件をクリアしていれば +5', () => {
    expect(nextTargetBpm(drill, [attempt({ bpm: 85, graduated: true })])).toBe(90);
  });

  it('未達なら前回を維持する', () => {
    expect(nextTargetBpm(drill, [attempt({ bpm: 85, graduated: false })])).toBe(85);
  });

  it('2回続けて誤差50ms超なら -5', () => {
    const bad = [
      attempt({ bpm: 85, meanAbsErrorMs: 62 }),
      attempt({ bpm: 85, meanAbsErrorMs: 55 }),
    ];
    expect(nextTargetBpm(drill, bad)).toBe(80);
  });

  it('1回だけ大きく未達でも下げない', () => {
    const mixed = [attempt({ bpm: 85, meanAbsErrorMs: 62 }), attempt({ bpm: 85, meanAbsErrorMs: 20 })];
    expect(nextTargetBpm(drill, mixed)).toBe(85);
  });

  it('BPM を持たないドリルは 0 のまま', () => {
    expect(nextTargetBpm(getDrill('setup-grip')!, [])).toBe(0);
  });
});

describe('generateMenu', () => {
  it('3〜5個で、合計時間が15〜25分に収まる', () => {
    const items = generateMenu(input());
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.length).toBeLessThanOrEqual(5);
    const total = items.reduce((sum, i) => sum + i.targetSec, 0);
    expect(total).toBeLessThanOrEqual(25 * 60);
  });

  it('解放レベルを超えるドリルを入れない', () => {
    const items = generateMenu(input({ unlockedLevel: 2 }));
    for (const item of items) expect(getDrill(item.drillId)!.level).toBeLessThanOrEqual(2);
  });

  it('そのモードでできないドリルを入れない', () => {
    for (const mode of ['home', 'out', 'air'] as const) {
      const items = generateMenu(input({ mode, unlockedLevel: 6 }));
      for (const item of items) expect(getDrill(item.drillId)!.modes).toContain(mode);
    }
  });

  it('air モードは判定のいらないドリルだけで構成する', () => {
    const items = generateMenu(input({ mode: 'air', unlockedLevel: 6 }));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(getDrill(item.drillId)!.modes).toContain('air');
  });

  it('air モードでは、次に解放されるパターンを聴く枠を優先する', () => {
    // Lv2 まで解放 → Lv3 のパターンがあるので air-listen が先頭に来る
    const items = generateMenu(input({ mode: 'air', unlockedLevel: 2 }));
    expect(items[0].drillId).toBe('air-listen');
  });

  it('同じカテゴリばかりにならない', () => {
    const items = generateMenu(input({ unlockedLevel: 6 }));
    const counts = new Map<string, number>();
    for (const item of items) {
      const category = getDrill(item.drillId)!.category;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    for (const count of counts.values()) expect(count).toBeLessThanOrEqual(2);
  });

  it('卒業済みばかりの状態でも、維持枠としてメニューが埋まる', () => {
    const all = drills.filter((d) => d.modes.includes('home') && d.level <= 3).map((d) => d.id);
    const items = generateMenu(input({ graduatedIds: all, random: () => 0 }));
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it('各項目の目標BPMは、そのドリルの直近の結果から決まる', () => {
    const attemptsByDrill: Record<string, Attempt[]> = {
      'hihat-only': [attempt({ drillId: 'hihat-only', bpm: 85, graduated: true })],
      'right-only': [
        attempt({ drillId: 'right-only', bpm: 75, meanAbsErrorMs: 70 }),
        attempt({ drillId: 'right-only', bpm: 75, meanAbsErrorMs: 60 }),
      ],
    };
    const items = generateMenu(input({ attemptsByDrill }));
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const drill = getDrill(item.drillId)!;
      expect(item.targetBpm).toBe(nextTargetBpm(drill, attemptsByDrill[item.drillId] ?? []));
    }
  });

  it('同じ入力なら同じメニューになる（乱数を固定した場合）', () => {
    const a = generateMenu(input());
    const b = generateMenu(input());
    expect(a).toEqual(b);
  });
});

describe('targetSecOf', () => {
  it('チェックリスト形式は3分', () => {
    expect(targetSecOf(getDrill('setup-grip')!)).toBe(180);
  });

  it('時間指定のあるドリルはその時間（最低60秒）', () => {
    expect(targetSecOf(getDrill('hihat-only')!)).toBe(60);
    expect(targetSecOf(getDrill('air-listen')!)).toBe(180);
  });
});
