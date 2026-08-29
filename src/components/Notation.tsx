import type { ReactNode } from 'react';
import type { Lane, RhythmPattern } from '@/lib/types';
import { LANE_COLOR_PRINT } from '@/lib/lanes';
import {
  buildNotation,
  type NotationNote,
  type NotationVoice,
  type StemDirection,
} from '@/lib/notation/layout';
import type { AssistConfig } from '@/lib/notation/assist';
import { countLabelAt, readingAt } from '@/lib/notation/reading';

/**
 * 五線譜。楽譜ライブラリは使わず SVG を直接生成する（spec.md §6.6、非目標 §9）。
 *
 * X座標はステップ番号に比例させた等間隔割り付け。浄書的には不正確だが、
 * グリッドとの視覚的な対応を優先する。currentStep はグリッドと同じ値を受け取り、
 * 対応する符頭を同時に光らせる（spec.md §3.8「同期ハイライト」）。
 */

const LINE_GAP = 16;
const TOP = 52;
const LEFT = 46;
const RIGHT = 618;
/** 手（符尾は上向き）の連桁の高さ */
const HAND_BEAM_Y = 22;
/** 足（符尾は下向き）の連桁の高さ */
const FOOT_BEAM_Y = 152;
/** 連桁も旗も付かない音符（4分以上）の符尾の長さ。連桁の高さまで伸ばすと不格好になる */
const PLAIN_STEM_LENGTH = 3.5 * (LINE_GAP / 2);
const FURIGANA_Y = 178;
const COUNT_Y = 200;

const INK = '#171a20';
const STAFF = '#2e3138';
const BEAT_LINE = '#dedacf';
const SUBTLE = '#6a6d74';

/** 第1線〜第5線を下から数えた位置（spec.md §6.6 の表）。0.5 刻みで線と間を表す */
const LANE_POSITION: Record<Lane, number> = {
  crash: -4,
  hihat: -2,
  ride: 0,
  tom1: 1,
  snare: 3,
  tom2: 5,
  kick: 7,
};

/** ✕ の符頭を使うレーン（シンバル類） */
const CROSS_HEADS: Lane[] = ['hihat', 'ride', 'crash'];

const yOf = (lane: Lane) => TOP + LANE_POSITION[lane] * (LINE_GAP / 2);

/** 紙の色に向けて色を薄める。amount 0 で黒一色、1 でそのままの色 */
function fade(hex: string, amount: number): string {
  if (amount >= 1) return hex;
  const channel = (i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const base = [0x17, 0x1a, 0x20];
  return (
    '#' +
    [0, 1, 2]
      .map((i) => Math.round(base[i] + (channel(i) - base[i]) * amount))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function Notation({
  pattern,
  currentStep = -1,
  assist,
}: {
  pattern: RhythmPattern;
  currentStep?: number;
  assist: AssistConfig;
}) {
  const layout = buildNotation(pattern);
  const xOf = (step: number) => LEFT + (step + 0.5) * ((RIGHT - LEFT) / pattern.resolution);
  const elements: ReactNode[] = [];
  let key = 0;
  const add = (node: ReactNode) => elements.push(<g key={key++}>{node}</g>);

  // ---- 五線とパーカッションクレフ ----
  for (let i = 0; i < 5; i++) {
    const y = TOP + i * LINE_GAP;
    add(<line x1={LEFT - 28} x2={RIGHT} y1={y} y2={y} stroke={STAFF} strokeWidth={1.15} />);
  }
  add(<line x1={RIGHT} x2={RIGHT} y1={TOP} y2={TOP + 4 * LINE_GAP} stroke={STAFF} strokeWidth={2.6} />);
  for (const dx of [-20, -11]) {
    add(
      <rect
        x={LEFT + dx}
        y={TOP + LINE_GAP * 0.6}
        width={4.4}
        height={LINE_GAP * 2.8}
        fill={STAFF}
      />,
    );
  }
  // 拍の区切り
  for (let beat = 1; beat < 4; beat++) {
    const x = LEFT + beat * ((RIGHT - LEFT) / 4);
    add(
      <line
        x1={x}
        x2={x}
        y1={TOP - 6}
        y2={TOP + 4 * LINE_GAP + 6}
        stroke={BEAT_LINE}
        strokeWidth={1}
      />,
    );
  }

  // ---- 2声部 ----
  drawVoice(layout.hands, 'up');
  drawVoice(layout.feet, 'down');

  function drawVoice(voice: NotationVoice, stem: StemDirection) {
    const beamY = stem === 'up' ? HAND_BEAM_Y : FOOT_BEAM_Y;

    for (const beat of voice.beats) {
      // 3連符の括り。上声部にだけ付ける（足は拍まるごとの音価になることが多い）
      if (beat.triplet && stem === 'up') {
        const xs = beat.items.filter((i) => i.kind === 'note').map((i) => xOf(i.step));
        const a = Math.min(...xs) - 9;
        const b = Math.max(...xs) + 9;
        const y = HAND_BEAM_Y - 14;
        add(
          <>
            <path
              d={`M${a},${y + 5} L${a},${y} L${b},${y} L${b},${y + 5}`}
              fill="none"
              stroke={SUBTLE}
              strokeWidth={1.1}
            />
            <text
              x={(a + b) / 2}
              y={y - 2.5}
              textAnchor="middle"
              fontSize={11}
              fill={SUBTLE}
              fontFamily="ui-monospace, monospace"
            >
              3
            </text>
          </>,
        );
      }

      const beamed = new Set(beat.beamGroups.flat());

      for (const item of beat.items) {
        if (item.kind === 'rest') {
          add(drawRest(item.step, item.duration, layout.stepsPerBeat, stem, xOf));
          continue;
        }
        // 連桁に入らない音符は、旗を付けるかどうかを自分で決める
        if (!beamed.has(item)) add(drawNote(item, stem, beamY, item.beams > 0 ? 'flag' : 'plain'));
      }

      for (const group of beat.beamGroups) {
        if (group.length === 1) {
          add(drawNote(group[0], stem, beamY, 'flag'));
          continue;
        }
        add(drawBeams(group, stem, beamY));
        for (const note of group) add(drawNote(note, stem, beamY, 'beam'));
      }
    }
  }

  function drawBeams(group: NotationNote[], stem: StemDirection, beamY: number): ReactNode {
    const direction = stem === 'up' ? 1 : -1;
    const stemX = (note: NotationNote) => xOf(note.step) + (stem === 'up' ? 6.6 : -6.6);
    const lines: ReactNode[] = [];

    // 1本目は連桁の全体に渡す
    lines.push(
      <line
        key="primary"
        x1={stemX(group[0])}
        x2={stemX(group[group.length - 1])}
        y1={beamY}
        y2={beamY}
        stroke={INK}
        strokeWidth={5}
      />,
    );

    // 2本目は16分どうしが隣り合う区間にだけ引く。孤立した16分には短い突起を出す
    const y2 = beamY + direction * 7;
    group.forEach((note, i) => {
      if (note.beams < 2) return;
      const prev = group[i - 1];
      const next = group[i + 1];
      if (next && next.beams >= 2) {
        lines.push(
          <line
            key={`s${i}`}
            x1={stemX(note)}
            x2={stemX(next)}
            y1={y2}
            y2={y2}
            stroke={INK}
            strokeWidth={5}
          />,
        );
      } else if (!prev || prev.beams < 2) {
        const stub = stemX(note) + (i === 0 ? 9 : -9);
        lines.push(
          <line
            key={`s${i}`}
            x1={stemX(note)}
            x2={stub}
            y1={y2}
            y2={y2}
            stroke={INK}
            strokeWidth={5}
          />,
        );
      }
    });

    return <>{lines}</>;
  }

  function drawNote(
    note: NotationNote,
    stem: StemDirection,
    beamY: number,
    mode: 'plain' | 'flag' | 'beam',
  ): ReactNode {
    const x = xOf(note.step);
    const ys = note.lanes.map(yOf);
    const up = stem === 'up';
    const from = up ? Math.max(...ys) : Math.min(...ys);
    const stemX = x + (up ? 6.6 : -6.6);
    // 連桁・旗が付く音符だけ連桁の高さまで伸ばす
    const stemTo =
      mode === 'plain' ? from + (up ? -PLAIN_STEM_LENGTH : PLAIN_STEM_LENGTH) : beamY;

    return (
      <>
        <line x1={stemX} x2={stemX} y1={from} y2={stemTo} stroke={INK} strokeWidth={1.8} />
        {mode === 'flag' && (
          <path
            fill={INK}
            d={
              up
                ? `M${stemX},${beamY} q11,4 9,16 q-1,-9 -9,-10 Z`
                : `M${stemX},${beamY} q-11,-4 -9,-16 q1,9 9,10 Z`
            }
          />
        )}
        {note.lanes.map((lane) => {
          const y = yOf(lane);
          const color = fade(LANE_COLOR_PRINT[lane], assist.colorAmount);
          const className = `notehead${note.step === currentStep ? ' notehead-active' : ''}`;
          return CROSS_HEADS.includes(lane) ? (
            <path
              key={lane}
              className={className}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              d={`M${x - 5.6},${y - 5.6} L${x + 5.6},${y + 5.6} M${x + 5.6},${y - 5.6} L${x - 5.6},${y + 5.6}`}
            />
          ) : (
            <ellipse key={lane} className={className} cx={x} cy={y} rx={6.7} ry={5.1} fill={color} />
          );
        })}
        {/* 付点（16分割での音価3＝付点8分） */}
        {note.duration === 3 && layout.stepsPerBeat === 4 && (
          <circle cx={x + 13} cy={yOf(note.lanes[0])} r={1.9} fill={INK} />
        )}
      </>
    );
  }

  // ---- 補助レイヤー ----
  if (assist.furigana) {
    for (let step = 0; step < pattern.resolution; step++) {
      const reading = readingAt(pattern, step);
      if (!reading) continue;
      add(
        <text
          x={xOf(step)}
          y={FURIGANA_Y}
          textAnchor="middle"
          fontSize={13.5}
          fill="#70737a"
          fontFamily='system-ui, -apple-system, "Hiragino Sans", sans-serif'
        >
          {reading}
        </text>,
      );
    }
  }

  if (assist.counts) {
    const stepsPerBeat = pattern.resolution / 4;
    for (let step = 0; step < pattern.resolution; step++) {
      const label = countLabelAt(pattern, step);
      if (!label) continue;
      add(
        <text
          x={xOf(step)}
          y={COUNT_Y}
          textAnchor="middle"
          fontSize={11.5}
          fill={step % stepsPerBeat === 0 ? '#4a4d53' : '#9a9da3'}
          fontFamily="ui-monospace, monospace"
        >
          {label}
        </text>,
      );
    }
  }

  return (
    <svg
      viewBox="0 0 640 210"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${pattern.name} のドラム譜`}
      className="block h-auto w-full"
    >
      {elements}
    </svg>
  );
}

function drawRest(
  step: number,
  duration: number,
  stepsPerBeat: number,
  stem: StemDirection,
  xOf: (step: number) => number,
): ReactNode {
  const x = xOf(step);
  const y = stem === 'up' ? TOP + LINE_GAP * 1.5 : TOP + LINE_GAP * 3;

  // 拍まるごとなら4分休符。3連系の1ステップは8分休符（16分休符にはならない）
  const kind =
    duration >= stepsPerBeat
      ? 'quarter'
      : stepsPerBeat === 3 || duration >= 2
        ? 'eighth'
        : 'sixteenth';

  if (kind === 'quarter') {
    return (
      <path
        fill="none"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
        d={`M${x - 4},${y - 11} L${x + 3},${y - 3} L${x - 3},${y + 2} L${x + 4},${y + 10}`}
      />
    );
  }

  if (kind === 'eighth') {
    return (
      <>
        <circle cx={x - 2.5} cy={y - 6} r={2.7} fill={INK} />
        <line x1={x - 1} x2={x + 3.5} y1={y - 5} y2={y + 7} stroke={INK} strokeWidth={1.9} />
      </>
    );
  }

  return (
    <>
      <circle cx={x - 2.5} cy={y - 7} r={2.4} fill={INK} />
      <circle cx={x - 0.5} cy={y - 1} r={2.4} fill={INK} />
      <line x1={x - 1} x2={x + 3.5} y1={y - 6} y2={y + 7} stroke={INK} strokeWidth={1.7} />
    </>
  );
}
