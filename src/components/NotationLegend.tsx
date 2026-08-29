import type { Lane, RhythmPattern } from '@/lib/types';
import { LANE_NAME_JA, lanesOf } from '@/lib/lanes';

/**
 * その譜面に出てくる記号の説明（spec.md §3.8「記号の初出ラベル」）。
 *
 * 音符に吹き出しを重ねる案もあるが、縦持ちスマホでは吹き出しが音符を隠すため、
 * 譜面の下にまとめて一度だけ出す形にしている。
 */

/** 五線上の位置（spec.md §6.6 の表） */
const POSITION_LABEL: Record<Lane, string> = {
  crash: '第5線の上（加線）',
  hihat: '第5線の上の間',
  ride: '第5線',
  tom1: '第4間',
  snare: '第3間',
  tom2: '第2間',
  kick: '第1間',
};

const CROSS_HEADS: Lane[] = ['hihat', 'ride', 'crash'];

export function NotationLegend({ pattern }: { pattern: RhythmPattern }) {
  const lanes = lanesOf(pattern.grid);

  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-1 pt-2 text-[11px] text-[#6a6d74]">
      {lanes.map((lane) => (
        <li key={lane}>
          <span className="font-mono">{CROSS_HEADS.includes(lane) ? '✕' : '●'}</span>{' '}
          {POSITION_LABEL[lane]} ={' '}
          <b className="font-semibold text-[#3e4147]">{LANE_NAME_JA[lane]}</b>
        </li>
      ))}
    </ul>
  );
}
