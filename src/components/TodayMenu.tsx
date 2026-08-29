'use client';

import Link from 'next/link';
import { getDrill } from '@/data/drills';
import { usePracticeMode } from '@/hooks/usePracticeMode';
import { useTodayMenu } from '@/hooks/useTodayMenu';
import { useHistory } from '@/hooks/useHistory';
import { practiceDates, practiceStreak, totalPracticeSec } from '@/lib/records';
import { today } from '@/lib/db-date';
import { Card, Chip, Eyebrow } from '@/components/ui';
import type { PracticeMode } from '@/lib/types';

const MODES: { id: PracticeMode; label: string; sub: string }[] = [
  { id: 'home', label: '自宅', sub: '電子ドラム' },
  { id: 'out', label: '外', sub: '練習パッド' },
  { id: 'air', label: '手ぶら', sub: '聴く・歌う' },
];

const minutes = (sec: number) => Math.round(sec / 60);

export function TodayMenu() {
  const { mode, setMode, midiSupported, ready } = usePracticeMode();
  const { menu, loading } = useTodayMenu(mode, ready);
  const { history } = useHistory();

  const streak = history ? practiceStreak(practiceDates(history.sessions), today()) : null;
  const totalMin = history ? minutes(totalPracticeSec(history.attempts)) : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-1.5">
          <Eyebrow>モード</Eyebrow>
        </div>
        <div role="group" aria-label="練習モード" className="flex gap-1.5">
          {MODES.map((item) => {
            const disabled = item.id === 'home' && ready && !midiSupported;
            const active = item.id === mode;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                disabled={disabled}
                onClick={() => setMode(item.id)}
                className={`min-h-14 flex-1 touch-manipulation rounded-lg border px-2 transition-colors disabled:opacity-30 ${
                  active
                    ? 'border-chrome bg-chrome text-bg'
                    : 'border-edge2 bg-panel2 text-dim hover:text-txt active:bg-raised'
                }`}
              >
                <span className="block text-[13px] font-semibold">{item.label}</span>
                <span className={`block text-[10px] ${active ? 'text-bg/70' : 'text-silk'}`}>
                  {item.sub}
                </span>
              </button>
            );
          })}
        </div>
        {ready && !midiSupported && (
          <p className="mt-2 text-[11px] text-silk">
            この端末は Web MIDI に非対応のため、自宅モード（電子ドラムの判定）は使えません。
          </p>
        )}
      </div>

      <div className="flex gap-2.5">
        <Card className="flex-1 px-4 py-3">
          <Eyebrow>連続</Eyebrow>
          <p className="mt-1 text-[24px] leading-none font-bold tnum">
            {streak ?? '–'}
            <span className="ml-1 text-[12px] font-normal text-dim">日</span>
          </p>
        </Card>
        <Card className="flex-1 px-4 py-3">
          <Eyebrow>総練習時間</Eyebrow>
          <p className="mt-1 text-[24px] leading-none font-bold tnum">
            {totalMin ?? '–'}
            <span className="ml-1 text-[12px] font-normal text-dim">分</span>
          </p>
        </Card>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Eyebrow>今日のメニュー</Eyebrow>
          {menu && (
            <span className="font-mono text-[10px] tnum text-silk">
              {menu.items.filter((i) => i.done).length} / {menu.items.length}
            </span>
          )}
        </div>

        {loading && <Card className="px-4 py-4 text-[13px] text-dim">用意しています…</Card>}

        {!loading && menu && menu.items.length === 0 && (
          <Card className="px-4 py-4 text-[13px] text-dim">
            このモードでできるドリルがまだありません。
          </Card>
        )}

        <ul className="flex flex-col gap-2.5">
          {menu?.items.map((item) => {
            const drill = getDrill(item.drillId);
            if (!drill) return null;
            return (
              <li key={item.drillId}>
                <Link
                  href={`/practice/${item.drillId}`}
                  className={`group flex min-h-16 touch-manipulation items-center gap-3 rounded-card border border-edge bg-panel px-4 py-3 shadow-card transition-colors hover:border-edge2 active:bg-panel2 ${
                    item.done ? 'opacity-50' : ''
                  }`}
                >
                  <span className="flex-1">
                    <span className="block text-[15px] font-bold">{drill.name}</span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {item.targetBpm > 0 && <Chip tone="mono">{item.targetBpm} bpm</Chip>}
                      <Chip tone="mono">{minutes(item.targetSec)} 分</Chip>
                      {item.done && <Chip tone="quiet">完了</Chip>}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-edge2 bg-raised text-[13px] text-dim transition-colors group-hover:border-chrome group-hover:text-txt"
                  >
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
