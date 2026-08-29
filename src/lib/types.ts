/**
 * spec.md §4 データモデル。
 * マスタ（アプリ同梱・不変）とユーザーデータ（IndexedDB）の両方をここに置く。
 */

// ---- マスタ（アプリに同梱、ユーザー編集不可）----

export type Lane = 'hihat' | 'snare' | 'kick' | 'tom1' | 'tom2' | 'crash' | 'ride';

export type PracticeMode = 'home' | 'out' | 'air';

export type Resolution = 16 | 12;

export interface RhythmPattern {
  id: string;
  name: string;
  /** 解放レベル 1-6 */
  level: number;
  /** 1小節の分割数。12は3連/シャッフル系 */
  resolution: Resolution;
  bars: 1 | 2;
  /** 推奨テンポ範囲 */
  bpmRange: [number, number];
  /** 0 or 1（将来: 2=アクセント） */
  grid: Partial<Record<Lane, number[]>>;
  /** 口ドラム表記 */
  vocal: string;
  /** 使われる場面の説明 */
  note?: string;
}

export type DrillCategory = 'setup' | 'hand' | 'rudiment' | 'foot' | 'beat' | 'fill' | 'notation';

export interface Graduation {
  bpm: number;
  durationSec: number;
  /** 判定なしモードでは無視 */
  maxMeanAbsErrorMs?: number;
  /** 左右の音量差の上限（home のみ。velocity 0-127） */
  maxVelocityDiff?: number;
  /** 時間ではなく巡回数で卒業するドリル用（fill-3plus1 など） */
  cycles?: number;
}

export interface Drill {
  id: string;
  name: string;
  level: number;
  category: DrillCategory;
  /** 実施可能なモード */
  modes: PracticeMode[];
  /** パターン集と紐づく場合 */
  patternId?: string;
  /** 何をするか（初心者にわかる言葉で） */
  instruction: string;
  /** フォーム等のチェック項目 */
  checkpoints?: string[];
  /**
   * drills.md §3 の air モード専用ドリル。継続日数を途切れさせないための補助枠であり、
   * カリキュラム本体ではないため、レベル解放条件（§4「Lv2のうち3つ以上」など）の
   * 母数には数えない。
   */
  supplemental?: boolean;
  graduation: Graduation;
}

// ---- ユーザーデータ（IndexedDB）----

export interface Session {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  mode: PracticeMode;
  startedAt: number;
  endedAt?: number;
  menuId?: string;
}

export type Subjective = 'good' | 'ok' | 'bad';

export interface Attempt {
  id: string;
  sessionId: string;
  drillId: string;
  bpm: number;
  durationSec: number;
  hitCount?: number;
  /** 負=走り, 正=もたり */
  meanOffsetMs?: number;
  meanAbsErrorMs?: number;
  stdDevMs?: number;
  /** 散布図用。多いので間引き保存可 */
  offsets?: number[];
  subjective: Subjective;
  graduated: boolean;
}

export interface DailyMenuItem {
  drillId: string;
  targetBpm: number;
  targetSec: number;
  done: boolean;
}

export interface DailyMenu {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  mode: PracticeMode;
  items: DailyMenuItem[];
}

/** §3.8 ガイドレベル */
export type AssistLevel = 0 | 1 | 2 | 3 | 4;

export interface Settings {
  /** Dexie の主キー。単一ユーザーなので固定値 1 を使う */
  id: number;
  midiOffsetMs: number;
  micOffsetMs: number;
  /** マイクの閾値。0 なら起動時に環境ノイズから自動で決める（spec.md §6.5） */
  micThreshold: number;
  unlockedLevel: number;
  /** auto=ドリルレベル由来、手動上書き可 */
  assistLevel: AssistLevel;
  assistAuto: boolean;
  clickSound: 'click' | 'woodblock' | 'beep';
  /**
   * MIDIノート番号 → レーン。機種によって割り当てが異なるため設定で変更できる。
   * 端末ごとの値なので、将来同期する場合も対象外にすること（spec.md §10.3）。
   */
  midiNoteMap: Record<number, Lane>;
  /** 最後にバックアップ（エクスポート）した時刻。促しの判断に使う（spec.md §10.7） */
  lastBackupAt?: number;
}
