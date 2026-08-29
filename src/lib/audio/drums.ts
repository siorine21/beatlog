import type { Lane } from '@/lib/types';

/**
 * ドラム音。サンプルファイルは使わず、オシレータとノイズで作り分ける（spec.md §5）。
 *
 *   kick        … 低いサイン波を急降下させる
 *   snare       … 帯域を絞ったノイズ（胴の響き）＋ 三角波の芯
 *   hihat       … 高い方だけ通したごく短いノイズ
 *   tom         … kick と同じ作りで、高さと減衰を変える
 *   crash/ride  … 高い方だけ通した長めのノイズ
 */

/** ノイズ音源は使い回す。1秒ぶんあれば足りる */
const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const cached = noiseBuffers.get(ctx);
  if (cached) return cached;
  const length = Math.floor(ctx.sampleRate);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffers.set(ctx, buffer);
  return buffer;
}

function envelope(gain: GainNode, time: number, peak: number, decay: number): void {
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
}

interface ToneSpec {
  from: number;
  to: number;
  peak: number;
  decay: number;
}

function scheduleTone(
  ctx: AudioContext,
  dest: AudioNode,
  time: number,
  { from, to, peak, decay }: ToneSpec,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(from, time);
  osc.frequency.exponentialRampToValueAtTime(to, time + decay * 0.5);
  envelope(gain, time, peak, decay);
  osc.connect(gain).connect(dest);
  osc.start(time);
  osc.stop(time + decay + 0.05);
}

interface NoiseSpec {
  type: BiquadFilterType;
  freq: number;
  q?: number;
  peak: number;
  decay: number;
}

function scheduleNoise(
  ctx: AudioContext,
  dest: AudioNode,
  time: number,
  { type, freq, q, peak, decay }: NoiseSpec,
): void {
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = noiseBuffer(ctx);
  filter.type = type;
  filter.frequency.value = freq;
  if (q !== undefined) filter.Q.value = q;
  envelope(gain, time, peak, decay);
  source.connect(filter).connect(gain).connect(dest);
  source.start(time);
  source.stop(time + decay + 0.05);
}


/** time（AudioContext 時刻）ちょうどに鳴るよう予約する */
export function scheduleDrum(ctx: AudioContext, dest: AudioNode, lane: Lane, time: number): void {
  switch (lane) {
    case 'kick':
      // 胴の低音。これだけだとスマホのスピーカーでは再生されず、聞こえない
      scheduleTone(ctx, dest, time, { from: 160, to: 48, peak: 0.8, decay: 0.3 });
      // 中域の押し。小さいスピーカーで「踏んだ感じ」を出しているのはここ
      scheduleTone(ctx, dest, time, { from: 420, to: 160, peak: 0.35, decay: 0.05 });
      // ビーターが当たる音。輪郭を作る
      scheduleNoise(ctx, dest, time, { type: 'highpass', freq: 2000, peak: 0.24, decay: 0.02 });
      return;
    case 'tom1':
      scheduleTone(ctx, dest, time, { from: 260, to: 150, peak: 0.6, decay: 0.28 });
      return;
    case 'tom2':
      scheduleTone(ctx, dest, time, { from: 190, to: 105, peak: 0.6, decay: 0.32 });
      return;
    case 'snare':
      scheduleNoise(ctx, dest, time, { type: 'bandpass', freq: 1900, q: 0.9, peak: 0.45, decay: 0.14 });
      // 胴の芯。ノイズだけだと軽くなる
      scheduleTone(ctx, dest, time, { from: 190, to: 150, peak: 0.25, decay: 0.08 });
      return;
    case 'hihat':
      scheduleNoise(ctx, dest, time, { type: 'highpass', freq: 8500, peak: 0.14, decay: 0.035 });
      return;
    case 'crash':
      scheduleNoise(ctx, dest, time, { type: 'highpass', freq: 5000, peak: 0.22, decay: 0.9 });
      return;
    case 'ride':
      scheduleNoise(ctx, dest, time, { type: 'highpass', freq: 7000, peak: 0.14, decay: 0.5 });
      return;
  }
}
