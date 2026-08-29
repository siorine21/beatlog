import { describe, expect, it } from 'vitest';
import { laneOf, parseNoteOn } from './midi';
import { DEFAULT_MIDI_NOTE_MAP } from './midi-map';

describe('parseNoteOn', () => {
  it('Note On を拾う', () => {
    expect(parseNoteOn(new Uint8Array([0x90, 38, 100]))).toEqual({ note: 38, velocity: 100 });
  });

  it('チャンネルが違っても Note On なら拾う', () => {
    expect(parseNoteOn(new Uint8Array([0x99, 36, 120]))).toEqual({ note: 36, velocity: 120 });
  });

  it('velocity 0 の Note On は Note Off として無視する', () => {
    expect(parseNoteOn(new Uint8Array([0x90, 38, 0]))).toBeNull();
  });

  it('Note Off やコントロールチェンジは無視する', () => {
    expect(parseNoteOn(new Uint8Array([0x80, 38, 100]))).toBeNull();
    expect(parseNoteOn(new Uint8Array([0xb0, 4, 100]))).toBeNull();
  });

  it('短すぎるメッセージは無視する', () => {
    expect(parseNoteOn(new Uint8Array([0x90, 38]))).toBeNull();
  });
});

describe('laneOf', () => {
  it('General MIDI の既定マップ', () => {
    expect(laneOf(36, DEFAULT_MIDI_NOTE_MAP)).toBe('kick');
    expect(laneOf(38, DEFAULT_MIDI_NOTE_MAP)).toBe('snare');
    expect(laneOf(42, DEFAULT_MIDI_NOTE_MAP)).toBe('hihat');
    expect(laneOf(46, DEFAULT_MIDI_NOTE_MAP)).toBe('hihat');
    expect(laneOf(49, DEFAULT_MIDI_NOTE_MAP)).toBe('crash');
    expect(laneOf(51, DEFAULT_MIDI_NOTE_MAP)).toBe('ride');
  });

  it('割り当てのないノートは undefined', () => {
    expect(laneOf(60, DEFAULT_MIDI_NOTE_MAP)).toBeUndefined();
  });

  it('機種ごとの割り当てに差し替えられる', () => {
    expect(laneOf(31, { 31: 'snare' })).toBe('snare');
  });
});
