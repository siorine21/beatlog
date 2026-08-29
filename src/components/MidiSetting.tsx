'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSettings } from '@/hooks/useSettings';
import { useMidiInput } from '@/hooks/useMidiInput';
import { DEFAULT_MIDI_NOTE_MAP } from '@/lib/midi-map';
import { LANE_COLOR, LANE_NAME_JA, LANE_ORDER } from '@/lib/lanes';
import { Card, Chip, Eyebrow } from '@/components/ui';
import type { Lane } from '@/lib/types';

/**
 * MIDIノート番号 → レーンの割り当て（spec.md §6.3）。
 * 機種によって番号が違うので、「今叩いたパッドを割り当てる」で覚えさせる。
 */
export function MidiSetting() {
  const { settings, update } = useSettings();
  const [learning, setLearning] = useState<Lane | null>(null);
  const [lastNote, setLastNote] = useState<number | null>(null);

  const noteMap = settings?.midiNoteMap ?? DEFAULT_MIDI_NOTE_MAP;

  const midi = useMidiInput({
    // 学習中だけ繋ぐ。常時 MIDI を掴まない
    enabled: learning !== null,
    noteMap,
    onHit: (_hit, note) => {
      setLastNote(note);
      if (!learning) return;
      void update({ midiNoteMap: { ...noteMap, [note]: learning } });
      setLearning(null);
    },
  });

  const notesOf = (lane: Lane) =>
    Object.entries(noteMap)
      .filter(([, value]) => value === lane)
      .map(([note]) => Number(note))
      .sort((a, b) => a - b);

  if (midi.supported === null) {
    return <Card className="px-4 py-4 text-[13px] text-dim">確認しています…</Card>;
  }

  if (!midi.supported) {
    return (
      <Card className="px-4 py-4">
        <div className="mb-1.5">
          <Eyebrow>MIDI</Eyebrow>
        </div>
        <p className="text-[13px] text-dim">
          この端末は Web MIDI に対応していません。自宅モード（電子ドラムの判定）は使えません。
        </p>
      </Card>
    );
  }

  return (
    <Card className="px-4 py-4">
      <div className="mb-1.5 flex items-center justify-between">
        <Eyebrow>MIDI パッドの割り当て</Eyebrow>
        <Link href="/settings/calibration" className="text-[12px] text-dim underline">
          キャリブレーション
        </Link>
      </div>

      <p className="mb-3 text-[12px] text-dim">
        「割り当て」を押してからパッドを叩くと、その音が覚えられます。
        {midi.inputs.length > 0 && `（${midi.inputs.join(' / ')}）`}
      </p>

      {midi.error && <p className="mb-2 text-[12px] text-snare">{midi.error}</p>}

      <ul className="flex flex-col gap-1">
        {LANE_ORDER.map((lane) => {
          const notes = notesOf(lane);
          const active = learning === lane;
          return (
            <li key={lane} className="flex min-h-11 items-center gap-2.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: LANE_COLOR[lane] }}
                aria-hidden
              />
              <span className="w-24 shrink-0 text-[13px]">{LANE_NAME_JA[lane]}</span>
              <span className="flex-1 font-mono text-[11px] tnum text-silk">
                {notes.length > 0 ? notes.join(', ') : '—'}
              </span>
              <button
                type="button"
                onClick={() => setLearning(active ? null : lane)}
                className={`min-h-11 shrink-0 touch-manipulation rounded-chip border px-3 text-[12px] transition-colors ${
                  active
                    ? 'border-chrome bg-chrome font-semibold text-bg'
                    : 'border-edge2 bg-panel2 text-dim hover:text-txt active:bg-raised'
                }`}
              >
                {active ? '叩いてください' : '割り当て'}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-edge pt-3">
        <span className="text-[11px] text-silk">
          {lastNote !== null ? `最後に受け取ったノート: ${lastNote}` : '　'}
        </span>
        <button
          type="button"
          onClick={() => void update({ midiNoteMap: DEFAULT_MIDI_NOTE_MAP })}
          className="min-h-11 touch-manipulation px-1 text-[12px] text-dim underline"
        >
          既定（General MIDI）に戻す
        </button>
      </div>

      <div className="mt-1">
        <Chip tone="quiet">この値は端末ごとに保存されます</Chip>
      </div>
    </Card>
  );
}
