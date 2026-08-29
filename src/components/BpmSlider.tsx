'use client';

import { useEffect, useRef } from 'react';

/**
 * BPM のスライダー。縦持ちスマホで画面をスクロールするときに
 * 触ってしまって値が動くのを防ぐため、二重に手当てしてある。
 *
 *  1. touch-action: pan-y（globals.css）で縦方向のスワイプはブラウザに渡す。
 *     指を縦に動かせばスライダーは反応せず、そのままスクロールする
 *  2. つまみから離れた位置を押しても値が飛ばないようにする。
 *     素の input[type=range] はトラックを叩いた位置に即座に飛ぶため、
 *     スクロールしようとして触れただけでテンポが変わってしまう
 *
 * つまみから離れた場所でも動かしたいときは ±1 / ±5 ボタンを使う。
 */

/** つまみとみなす半径（px）。これより遠い位置を押しても値を動かさない */
const GRAB_RADIUS = 26;
/** globals.css のつまみの大きさと合わせる */
const THUMB_SIZE = 28;

export function BpmSlider({
  value,
  min,
  max,
  onChange,
  label = 'BPM',
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  // 判定の中でいつでも最新の値を見る（リスナーは張り替えない）
  const stateRef = useRef({ value, min, max });
  stateRef.current = { value, min, max };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPointerDown = (event: PointerEvent) => {
      const { value: current, min: lo, max: hi } = stateRef.current;
      const rect = el.getBoundingClientRect();
      const ratio = hi > lo ? (current - lo) / (hi - lo) : 0;
      const thumbCenter = rect.left + THUMB_SIZE / 2 + ratio * (rect.width - THUMB_SIZE);
      if (Math.abs(event.clientX - thumbCenter) > GRAB_RADIUS) event.preventDefault();
    };

    // preventDefault を効かせるため passive: false で張る
    el.addEventListener('pointerdown', onPointerDown, { passive: false });
    return () => el.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <label className="flex h-11 items-center">
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bpm-slider w-full"
      />
    </label>
  );
}
