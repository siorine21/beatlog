'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { drills, getDrill } from '@/data/drills';
import { useHistory } from '@/hooks/useHistory';
import {
  bpmSeries,
  errorSeries,
  practiceDates,
  practiceStreak,
  totalPracticeSec,
  weeklyTotals,
} from '@/lib/records';
import { today } from '@/lib/db-date';
import { Card, Chip, Eyebrow } from '@/components/ui';

/**
 * 練習ログのグラフ（spec.md §3.5）。
 *
 * 色について: 有彩色はレーン（ハイハット=金、スネア=赤、バスドラム=青）の
 * 意味に予約してあるので、モードの塗り分けには使えない。
 * モードは「自宅 → 外 → 手ぶら」と設備が減る順に並ぶため、
 * 明度だけを変えた1色の階調で表し、凡例とツールチップで取り違えを防ぐ。
 */
const MODE_FILL = {
  home: '#dfe3e9',
  out: '#9aa4b2',
  air: '#6b7688',
} as const;

const MODE_LABEL = { home: '自宅', out: '外', air: '手ぶら' } as const;

/** 積み上げの境目に地の色で 2px の隙間を作る */
const SURFACE = '#171a20';
const AXIS = '#666d77';
const GRID = '#272c34';

const minutes = (sec: number) => Math.round(sec / 60);
const shortDate = (date: string) => date.slice(5).replace('-', '/');

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-edge2 bg-panel px-3 py-2 text-[12px] shadow-lift">
      <p className="mb-1 font-mono text-[10px] tracking-wider text-silk">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: entry.color }}
            aria-hidden
          />
          <span className="text-dim">{entry.name}</span>
          <span className="ml-auto font-mono tnum text-txt">
            {entry.value} {unit}
          </span>
        </p>
      ))}
    </div>
  );
}

export function LogCharts() {
  const { history } = useHistory();
  const [drillId, setDrillId] = useState<string | null>(null);

  const weekly = useMemo(
    () =>
      history
        ? weeklyTotals(history.attempts, history.sessions, 8, today()).map((row) => ({
            week: shortDate(row.week),
            home: minutes(row.home),
            out: minutes(row.out),
            air: minutes(row.air),
          }))
        : [],
    [history],
  );

  /** 記録のあるドリルだけを選べるようにする */
  const practiced = useMemo(() => {
    if (!history) return [];
    const ids = new Set(history.attempts.map((a) => a.drillId));
    return drills.filter((drill) => ids.has(drill.id));
  }, [history]);

  const selected = drillId ?? practiced[0]?.id ?? null;

  const errorData = useMemo(
    () =>
      history && selected
        ? errorSeries(history.attempts, history.sessions, selected).map((point) => ({
            date: shortDate(point.date),
            error: Math.round(point.meanAbsErrorMs),
          }))
        : [],
    [history, selected],
  );

  const bpmData = useMemo(
    () =>
      history && selected
        ? bpmSeries(history.attempts, history.sessions, selected).map((point) => ({
            date: shortDate(point.date),
            bpm: point.bpm,
          }))
        : [],
    [history, selected],
  );

  if (!history) {
    return <Card className="px-4 py-4 text-[13px] text-dim">読み込み中…</Card>;
  }

  const hasData = history.attempts.length > 0;
  const streak = practiceStreak(practiceDates(history.sessions), today());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2.5">
        <Card className="flex-1 px-4 py-3">
          <Eyebrow>総練習時間</Eyebrow>
          <p className="mt-1 text-[24px] leading-none font-bold tnum">
            {minutes(totalPracticeSec(history.attempts))}
            <span className="ml-1 text-[12px] font-normal text-dim">分</span>
          </p>
        </Card>
        <Card className="flex-1 px-4 py-3">
          <Eyebrow>連続日数</Eyebrow>
          <p className="mt-1 text-[24px] leading-none font-bold tnum">
            {streak}
            <span className="ml-1 text-[12px] font-normal text-dim">日</span>
          </p>
        </Card>
      </div>

      {!hasData && (
        <Card className="px-4 py-4 text-[13px] text-dim">
          まだ記録がありません。ホームのメニューから練習を1本終えると、ここにグラフが出ます。
        </Card>
      )}

      {hasData && (
        <>
          <section>
            <div className="mb-2 flex items-center justify-between">
              <Eyebrow>週別の練習時間</Eyebrow>
              <div className="flex gap-2">
                {(['home', 'out', 'air'] as const).map((mode) => (
                  <span key={mode} className="flex items-center gap-1 text-[11px] text-dim">
                    <span
                      className="h-2 w-2 rounded-[2px]"
                      style={{ background: MODE_FILL[mode] }}
                      aria-hidden
                    />
                    {MODE_LABEL[mode]}
                  </span>
                ))}
              </div>
            </div>
            <Card className="px-2 py-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekly} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: AXIS, fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: GRID }}
                  />
                  <YAxis
                    tick={{ fill: AXIS, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    content={<ChartTooltip unit="分" />}
                  />
                  {(['air', 'out', 'home'] as const).map((mode, index, all) => (
                    <Bar
                      key={mode}
                      dataKey={mode}
                      name={MODE_LABEL[mode]}
                      stackId="practice"
                      fill={MODE_FILL[mode]}
                      stroke={SURFACE}
                      strokeWidth={2}
                      radius={index === all.length - 1 ? [4, 4, 0, 0] : 0}
                      maxBarSize={28}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </section>

          <section>
            <div className="mb-2">
              <Eyebrow>ドリル別のテンポ推移</Eyebrow>
            </div>

            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {practiced.map((drill) => (
                <button
                  key={drill.id}
                  type="button"
                  aria-pressed={drill.id === selected}
                  onClick={() => setDrillId(drill.id)}
                  className={`min-h-11 touch-manipulation rounded-chip border px-3 text-[12px] transition-colors ${
                    drill.id === selected
                      ? 'border-chrome bg-chrome font-semibold text-bg'
                      : 'border-edge2 bg-panel2 text-dim hover:text-txt active:bg-raised'
                  }`}
                >
                  {drill.name}
                </button>
              ))}
            </div>

            <Card className="px-2 py-3">
              {selected && (
                <div className="mb-1 flex items-center justify-between px-2">
                  <span className="text-[12px] text-dim">{getDrill(selected)?.name}</span>
                  <Chip tone="mono">
                    卒業 {getDrill(selected)?.graduation.bpm ?? 0} bpm
                  </Chip>
                </div>
              )}
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={bpmData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: AXIS, fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: GRID }}
                  />
                  <YAxis
                    tick={{ fill: AXIS, fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip content={<ChartTooltip unit="bpm" />} />
                  <Line
                    type="monotone"
                    dataKey="bpm"
                    name="テンポ"
                    stroke="#dfe3e9"
                    strokeWidth={2}
                    dot={{ r: 4, fill: SURFACE, stroke: '#dfe3e9', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </section>

          <section>
            <div className="mb-2">
              <Eyebrow>平均絶対誤差の推移</Eyebrow>
            </div>
            <Card className="px-2 py-3">
              {errorData.length === 0 ? (
                <p className="px-2 py-6 text-center text-[12px] text-dim">
                  このドリルにはまだ判定の記録がありません。自宅モードで電子ドラムを繋いで
                  練習すると、ここにズレの推移が出ます。
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={errorData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: AXIS, fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: GRID }}
                    />
                    <YAxis
                      tick={{ fill: AXIS, fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      domain={[0, 'dataMax + 10']}
                    />
                    <Tooltip content={<ChartTooltip unit="ms" />} />
                    <Line
                      type="monotone"
                      dataKey="error"
                      name="平均絶対誤差"
                      stroke="#dfe3e9"
                      strokeWidth={2}
                      dot={{ r: 4, fill: SURFACE, stroke: '#dfe3e9', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
