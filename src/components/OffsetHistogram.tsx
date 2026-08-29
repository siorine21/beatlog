import { histogram } from '@/lib/judge';

/** ズレの分布。中央が0msで、左が走り・右がもたり */
export function OffsetHistogram({ offsets, binMs = 20 }: { offsets: number[]; binMs?: number }) {
  const bars = histogram(offsets, binMs, 7);
  const max = Math.max(1, ...bars);

  return (
    <div>
      <div className="flex h-16 items-end gap-1.5" aria-hidden>
        {bars.map((count, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full rounded-[3px] ${index === 3 ? 'bg-chrome' : 'bg-edge2'}`}
              style={{ height: `${Math.max(2, (count / max) * 48)}px` }}
            />
            <span className="font-mono text-[9px] tnum text-silk">{(index - 3) * binMs}</span>
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-[10px] text-silk">
        ズレ（ms）。左が走り、右がもたり
      </p>
    </div>
  );
}
