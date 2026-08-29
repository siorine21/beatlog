/**
 * クリック音。サンプルファイルは使わず OscillatorNode で生成する（spec.md §5）。
 *
 * 位置づけは3種類:
 *   accent … 小節の1拍目。いちばん高く、いちばん大きい
 *   beat   … それ以外の拍
 *   sub    … 拍を割った位置（8分裏・16分・3連の2,3個目）。控えめに鳴らす
 */
export type ClickKind = 'accent' | 'beat' | 'sub';

interface Voice {
  freq: number;
  gain: number;
  /** 減衰にかける秒数。短いほどクリックらしくなる */
  decay: number;
}

const VOICES: Record<ClickKind, Voice> = {
  accent: { freq: 1600, gain: 0.5, decay: 0.035 },
  beat: { freq: 1050, gain: 0.36, decay: 0.03 },
  sub: { freq: 780, gain: 0.16, decay: 0.022 },
};

/**
 * time（AudioContext 時刻）ちょうどに鳴るよう予約する。
 * 呼び出し時点で発音するのではなく、必ず未来の時刻を渡すこと（spec.md §6.1）。
 */
export function scheduleClick(
  ctx: AudioContext,
  destination: AudioNode,
  kind: ClickKind,
  time: number,
): void {
  const voice = VOICES[kind];
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(voice.freq, time);

  // 立ち上がりを2msだけ持たせるとプチノイズが消える
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(voice.gain, time + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, time + voice.decay);

  osc.connect(env).connect(destination);
  osc.start(time);
  osc.stop(time + voice.decay + 0.02);
}
