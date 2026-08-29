/**
 * 先読みスケジューラ（spec.md §6.1）。
 *
 * setInterval で直接音を鳴らすと、タイマー精度の揺れがそのまま音のヨレになる。
 * setInterval は「少し先の音を予約する処理」を起こすためだけに使い、
 * 発音時刻は必ず AudioContext.currentTime を基準に決める。
 *
 * 予約したステップと時刻は scheduledSteps に残す。Phase 4 の判定で
 * 「そのステップが鳴るべきだった時刻」として突き合わせるため。
 */

/** スケジューラの起動間隔 */
export const LOOKAHEAD_MS = 25;
/** 何秒先まで予約するか */
export const SCHEDULE_AHEAD_S = 0.1;

/** 判定用に保持する予約の最大数。1小節16分で16、余裕を持って数小節分 */
const MAX_HISTORY = 128;

export interface ScheduledStep {
  /** 小節内の通し番号（0 から stepsPerBar - 1） */
  step: number;
  /** AudioContext 時刻（秒） */
  time: number;
  /** 通算のステップ数。小節をまたいでも増え続ける */
  index: number;
}

export interface TempoSpec {
  bpm: number;
  /** 1小節の拍数。4/4 なら 4、3/4 なら 3、6/8 なら 6 */
  beatsPerBar: number;
  /** 1拍の分割数。4分=1, 8分=2, 3連=3, 16分=4 */
  stepsPerBeat: number;
}

export type StepListener = (step: ScheduledStep, spec: TempoSpec) => void;

export class LookaheadScheduler {
  private readonly ctx: AudioContext;
  private readonly onStep: StepListener;

  private spec: TempoSpec = { bpm: 120, beatsPerBar: 4, stepsPerBeat: 1 };
  private timer: ReturnType<typeof setInterval> | null = null;

  /** 次に鳴らすステップの AudioContext 時刻 */
  private nextStepTime = 0;
  private step = 0;
  private index = 0;
  private history: ScheduledStep[] = [];

  constructor(ctx: AudioContext, onStep: StepListener) {
    this.ctx = ctx;
    this.onStep = onStep;
  }

  /** 予約に使っている AudioContext。音の生成側から参照する */
  get context(): AudioContext {
    return this.ctx;
  }

  get playing(): boolean {
    return this.timer !== null;
  }

  get tempo(): TempoSpec {
    return this.spec;
  }

  get stepsPerBar(): number {
    return this.spec.beatsPerBar * this.spec.stepsPerBeat;
  }

  /** 1ステップの長さ（秒） */
  get stepDuration(): number {
    return 60 / this.spec.bpm / this.spec.stepsPerBeat;
  }

  /** 予約済みのステップ列。判定（Phase 4）と描画（rAF）から読む */
  get scheduledSteps(): readonly ScheduledStep[] {
    return this.history;
  }

  start(spec: TempoSpec): void {
    if (this.timer) return;
    this.spec = spec;
    this.step = 0;
    this.index = 0;
    this.history = [];
    // 予約が間に合うよう、最初の音だけ少し先に置く
    this.nextStepTime = this.ctx.currentTime + 0.08;
    this.tick();
    this.timer = setInterval(() => this.tick(), LOOKAHEAD_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.history = [];
  }

  /**
   * 再生中でも即座に反映する。nextStepTime と step は保持するので、
   * 既に予約済みの音はそのまま鳴り、以降の間隔だけが変わる（位相が飛ばない）。
   */
  setBpm(bpm: number): void {
    this.spec = { ...this.spec, bpm };
  }

  /**
   * 拍子・分割の変更。小節の途中で変えると拍の意味が変わってしまうため、
   * 小節の頭に戻して数え直す（鳴っている音は止めない）。
   */
  setMeter(beatsPerBar: number, stepsPerBeat: number): void {
    this.spec = { ...this.spec, beatsPerBar, stepsPerBeat };
    this.step = 0;
  }

  /** now（AudioContext 時刻）の時点で最後に鳴ったステップ。無ければ null */
  currentStepAt(now: number): ScheduledStep | null {
    let found: ScheduledStep | null = null;
    for (const s of this.history) {
      if (s.time > now) break;
      found = s;
    }
    return found;
  }

  private tick(): void {
    const horizon = this.ctx.currentTime + SCHEDULE_AHEAD_S;
    while (this.nextStepTime < horizon) {
      const entry: ScheduledStep = { step: this.step, time: this.nextStepTime, index: this.index };
      this.onStep(entry, this.spec);
      this.history.push(entry);
      if (this.history.length > MAX_HISTORY) this.history.shift();

      this.nextStepTime += this.stepDuration;
      this.index += 1;
      this.step = (this.step + 1) % this.stepsPerBar;
    }
  }
}
