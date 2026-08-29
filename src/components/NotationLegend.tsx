'use client';

import type { Lane, RhythmPattern } from '@/lib/types';
import { LANE_NAME_JA, lanesOf } from '@/lib/lanes';
import { notationSymbols } from '@/data/notation-symbols';
import { usedSymbolIds } from '@/lib/notation/symbols-used';

/**
 * その譜面に出てくる記号の説明（spec.md §3.8「記号の初出ラベル」）。
 *
 * 音符に吹き出しを重ねる案は取らない。縦持ちスマホでは吹き出しが音符を隠すため、
 * 譜面のいちばん下にたためる形で置き、必要なときだけ開く。
 * 説明文は src/data/notation-symbols.ts（/notation と同じ出所）から引く。
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

export function NotationLegend({
  pattern,
  defaultOpen = false,
}: {
  pattern: RhythmPattern;
  defaultOpen?: boolean;
}) {
  const lanes = lanesOf(pattern.grid);
  const used = new Set(usedSymbolIds(pattern));
  // リファレンスと同じ順（レベル順）で並べる
  const symbols = notationSymbols.filter((symbol) => used.has(symbol.id));

  return (
    <details open={defaultOpen} className="group border-t border-[#dedacf] px-1">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[12px] text-[#6a6d74] marker:content-['']">
        <span>この譜面に出てくる記号</span>
        <span
          aria-hidden
          className="font-mono text-[11px] transition-transform group-open:rotate-90"
        >
          ›
        </span>
      </summary>

      <div className="pb-2">
        <ul className="flex flex-col gap-1 border-t border-[#e7e3d8] py-2 text-[11.5px] text-[#6a6d74]">
          {lanes.map((lane) => (
            <li key={lane} className="flex gap-2">
              <span className="w-4 shrink-0 text-center font-mono">
                {CROSS_HEADS.includes(lane) ? '✕' : '●'}
              </span>
              <span>
                {POSITION_LABEL[lane]} = <b className="font-semibold text-[#3e4147]">{LANE_NAME_JA[lane]}</b>
              </span>
            </li>
          ))}
        </ul>

        <ul className="flex flex-col gap-1.5 border-t border-[#e7e3d8] py-2 text-[11.5px] text-[#6a6d74]">
          {symbols.map((symbol) => (
            <li key={symbol.id} className="flex gap-2">
              <span className="w-4 shrink-0 text-center font-mono">{symbol.glyph ?? ''}</span>
              <span>
                <b className="font-semibold text-[#3e4147]">{symbol.name}</b> — {symbol.description}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
