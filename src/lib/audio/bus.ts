/**
 * 出力の手前に置く共通のバス。
 *
 * 複数のレーンが同時に鳴ると合計が振り切れて歪むため、少し下げてから
 * ソフトクリップ（tanh 曲線）を通す。
 *
 * DynamicsCompressorNode は使わない。あれは音量そのものを追従して下げるので、
 * バスドラのように低域が長く伸びる音がまるごと押さえ込まれ、かえって小さくなる。
 * ソフトクリップは時間的な追従をしないため、音量関係が崩れない。
 */
const buses = new WeakMap<AudioContext, AudioNode>();

/** 入力の大きさ。同時に鳴る最大の合計が曲線の端に収まるように決めてある */
const PRE_GAIN = 0.7;
/** 曲線の効き。大きいほど早く頭打ちになる */
const DRIVE = 1.5;
/** 出力の上限。歪みきる手前で止める */
const CEILING = 0.98;

function softClipCurve(points = 2048): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(points * 4));
  const normalize = Math.tanh(DRIVE);
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * 2 - 1;
    curve[i] = (CEILING * Math.tanh(DRIVE * x)) / normalize;
  }
  return curve;
}

export function getMasterBus(ctx: AudioContext): AudioNode {
  const cached = buses.get(ctx);
  if (cached) return cached;

  const gain = ctx.createGain();
  gain.gain.value = PRE_GAIN;

  const shaper = ctx.createWaveShaper();
  shaper.curve = softClipCurve();
  shaper.oversample = '2x';

  gain.connect(shaper).connect(ctx.destination);
  buses.set(ctx, gain);
  return gain;
}

