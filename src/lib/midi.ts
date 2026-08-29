import type { HitEvent } from './judge';
import type { Lane } from './types';

/**
 * Web MIDI 入力（spec.md §6.3）。ライブラリは使わず生のAPIを扱う。
 *
 * 時間軸の統一がこのファイルの肝。MIDIMessageEvent.timeStamp は
 * performance.now() 基準、Web Audio は AudioContext.currentTime 基準で
 * 原点が違うため、必ず perfToAudio を通して AudioContext 時刻に直す。
 */

/** performance.now() [ms] → AudioContext 時刻 [秒] */
export function perfToAudio(timeStamp: number, ctx: AudioContext): number {
  return (timeStamp - performance.now()) / 1000 + ctx.currentTime;
}

export const midiSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;

/** Note On のみを拾う。velocity 0 の Note On は Note Off と同じ意味 */
export function parseNoteOn(data: Uint8Array): { note: number; velocity: number } | null {
  if (data.length < 3) return null;
  const status = data[0] & 0xf0;
  if (status !== 0x90) return null;
  const velocity = data[2];
  if (velocity === 0) return null;
  return { note: data[1], velocity };
}

export function laneOf(note: number, map: Record<number, Lane>): Lane | undefined {
  return map[note];
}

export interface MidiListenerOptions {
  ctx: AudioContext;
  noteMap: Record<number, Lane>;
  onHit: (hit: HitEvent, note: number) => void;
  onError?: (message: string) => void;
}

export interface MidiConnection {
  /** 接続されている入力デバイス名 */
  inputs: string[];
  stop: () => void;
}

/**
 * MIDI 入力を購読する。sysex は要求しない（権限を最小にする）。
 * 返り値の stop() で購読を解除する。
 */
export async function listenMidi({
  ctx,
  noteMap,
  onHit,
  onError,
}: MidiListenerOptions): Promise<MidiConnection> {
  if (!midiSupported()) throw new Error('この端末は Web MIDI に対応していません');

  const access = await navigator.requestMIDIAccess({ sysex: false });
  const inputs = [...access.inputs.values()];

  const handle = (event: MIDIMessageEvent) => {
    if (!event.data) return;
    const parsed = parseNoteOn(event.data);
    if (!parsed) return;
    onHit(
      {
        time: perfToAudio(event.timeStamp, ctx),
        velocity: parsed.velocity,
        pad: laneOf(parsed.note, noteMap),
      },
      parsed.note,
    );
  };

  for (const input of inputs) input.addEventListener('midimessage', handle);

  // あとから挿した機器も拾う
  const onStateChange = (event: MIDIConnectionEvent) => {
    const port = event.port;
    if (port && port.type === 'input' && port.state === 'connected') {
      (port as MIDIInput).addEventListener('midimessage', handle);
    }
  };
  access.addEventListener('statechange', onStateChange);

  if (inputs.length === 0) onError?.('MIDI機器が見つかりません。接続を確認してください。');

  return {
    inputs: inputs.map((input) => input.name ?? '(名称なし)'),
    stop: () => {
      for (const input of access.inputs.values()) input.removeEventListener('midimessage', handle);
      access.removeEventListener('statechange', onStateChange);
    },
  };
}
