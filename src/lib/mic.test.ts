import { describe, expect, it } from 'vitest';
import { thresholdFromNoise } from './mic';

describe('thresholdFromNoise', () => {
  it('環境ノイズの数倍を閾値にする', () => {
    expect(thresholdFromNoise(0.02)).toBeCloseTo(0.07);
    expect(thresholdFromNoise(0.1)).toBeCloseTo(0.35);
  });

  it('静かすぎる環境でも下限を割らない（無音で誤検出しないため）', () => {
    expect(thresholdFromNoise(0)).toBe(0.02);
    expect(thresholdFromNoise(0.001)).toBe(0.02);
  });

  it('うるさい環境では閾値が上がる', () => {
    expect(thresholdFromNoise(0.2)).toBeGreaterThan(thresholdFromNoise(0.05));
  });
});
