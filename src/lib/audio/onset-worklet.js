/**
 * マイク入力から打点（オンセット）を拾う AudioWorkletProcessor（spec.md §6.5）。
 *
 * ここから外に出すのは「いつ・どのくらいの強さで鳴ったか」だけで、
 * 波形そのものは一切送らない（spec.md §11.3）。オンセット検出に必要なのは
 * フレームごとのエネルギーだけなので、音声バッファを外に出す理由がない。
 *
 * 検出の流れ:
 *   1. 128サンプルごとに短時間エネルギー（RMS）を出す
 *   2. 閾値を下から上へまたいだ瞬間を打点とする（立ち上がりだけを見る）
 *   3. 50ms のデバウンスで、1打が複数回検出されるのを防ぐ
 *
 * 時刻は currentTime（AudioContext と同じ基準）をそのまま使う。
 * 判定側は変換なしで突き合わせられる。
 */
const DEBOUNCE_SEC = 0.05;
/** レベル表示は間引いて送る（毎ブロック送るとメッセージが多すぎる） */
const LEVEL_EVERY = 8;

class OnsetProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.threshold = options?.processorOptions?.threshold ?? 0.1;
    this.lastOnsetTime = -1;
    this.wasAbove = false;
    this.blocks = 0;
    /** 表示用のなめらかなレベル。速く上がり、ゆっくり下がる */
    this.envelope = 0;

    this.port.onmessage = (event) => {
      const next = event.data?.threshold;
      if (typeof next === 'number') this.threshold = next;
    };
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < channel.length; i++) {
      const sample = channel[i];
      sum += sample * sample;
      const magnitude = sample < 0 ? -sample : sample;
      if (magnitude > peak) peak = magnitude;
    }
    const rms = Math.sqrt(sum / channel.length);

    this.envelope = rms > this.envelope ? rms : this.envelope * 0.85 + rms * 0.15;

    const above = rms > this.threshold;
    if (above && !this.wasAbove && currentTime - this.lastOnsetTime > DEBOUNCE_SEC) {
      this.lastOnsetTime = currentTime;
      this.port.postMessage({ type: 'onset', time: currentTime, peak });
    }
    this.wasAbove = above;

    this.blocks += 1;
    if (this.blocks % LEVEL_EVERY === 0) {
      this.port.postMessage({ type: 'level', level: this.envelope, peak });
    }

    return true;
  }
}

registerProcessor('onset-detector', OnsetProcessor);
