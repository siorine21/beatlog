import type { HitEvent } from './judge';

/**
 * マイクによる打点検出（spec.md §6.5）。
 *
 * 守ること（CLAUDE.md / spec.md §11.3）:
 *   - 権限は out モードに入る直前に要求する。起動時にまとめて要求しない
 *   - 終わったら必ず MediaStreamTrack.stop() を呼ぶ
 *   - 音声バッファは保持も送信もしない。外に出るのは { time, peak } だけ
 *
 * echoCancellation / noiseSuppression / autoGainControl はすべて false。
 * これらは打点を潰してしまう。
 */

/** 環境ノイズの何倍を閾値にするか */
const NOISE_FACTOR = 3.5;
/** 静かすぎる環境で閾値が下がりすぎないようにする下限 */
const MIN_THRESHOLD = 0.02;
/** 環境ノイズを測る長さ（秒） */
export const NOISE_SAMPLE_SEC = 1;
/** ハイパスの遮断周波数。空調などの低い暗騒音を落とす */
const HIGHPASS_HZ = 150;

export const micSupported = (): boolean =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

export interface MicSession {
  /** 自動で決めた閾値（手動指定があればその値） */
  threshold: number;
  setThreshold: (value: number) => void;
  /** マイクを解放する。必ず呼ぶこと */
  stop: () => void;
}

export interface StartMicOptions {
  ctx: AudioContext;
  /** 打点。pad はマイクでは取れないので undefined */
  onHit: (hit: HitEvent) => void;
  /** 入力レベル（表示用） */
  onLevel?: (level: number) => void;
  /** 指定すると環境ノイズの測定を省いてこの値を使う */
  threshold?: number;
  /** 環境ノイズを測っている間の通知 */
  onMeasuring?: (measuring: boolean) => void;
  /** ワークレットの場所。basePath を含めて渡す */
  workletUrl: string;
}

/** 環境ノイズから閾値を決める */
export const thresholdFromNoise = (noisePeak: number): number =>
  Math.max(MIN_THRESHOLD, Number((noisePeak * NOISE_FACTOR).toFixed(4)));

export async function startMic({
  ctx,
  onHit,
  onLevel,
  threshold,
  onMeasuring,
  workletUrl,
}: StartMicOptions): Promise<MicSession> {
  if (!micSupported()) throw new Error('この端末ではマイクを使えません');

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      // 打点を潰すので、すべて切る（spec.md §6.5）
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  await ctx.audioWorklet.addModule(workletUrl);

  const source = ctx.createMediaStreamSource(stream);
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = HIGHPASS_HZ;

  const node = new AudioWorkletNode(ctx, 'onset-detector', {
    numberOfInputs: 1,
    numberOfOutputs: 0,
    processorOptions: { threshold: threshold ?? 1 }, // 測定中は鳴らないよう高めにしておく
  });

  source.connect(highpass).connect(node);

  let current = threshold ?? 1;
  let measuring = threshold === undefined;
  let noisePeak = 0;

  node.port.onmessage = (event) => {
    const data = event.data as
      | { type: 'onset'; time: number; peak: number }
      | { type: 'level'; level: number; peak: number };

    if (data.type === 'level') {
      if (measuring && data.peak > noisePeak) noisePeak = data.peak;
      onLevel?.(data.level);
      return;
    }
    if (measuring) return; // 測定中は打点として扱わない
    onHit({ time: data.time, velocity: Math.round(Math.min(1, data.peak) * 127), pad: undefined });
  };

  const setThreshold = (value: number) => {
    current = value;
    node.port.postMessage({ threshold: value });
  };

  if (measuring) {
    onMeasuring?.(true);
    await new Promise((resolve) => setTimeout(resolve, NOISE_SAMPLE_SEC * 1000));
    measuring = false;
    setThreshold(thresholdFromNoise(noisePeak));
    onMeasuring?.(false);
  } else {
    setThreshold(current);
  }

  return {
    get threshold() {
      return current;
    },
    setThreshold,
    stop: () => {
      node.port.onmessage = null;
      source.disconnect();
      highpass.disconnect();
      node.disconnect();
      // 権限を握り続けないよう、必ずトラックを止める
      for (const track of stream.getTracks()) track.stop();
    },
  };
}
