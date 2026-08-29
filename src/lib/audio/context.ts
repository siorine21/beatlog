/**
 * AudioContext は「ユーザー操作の中で」生成・resume すること。
 * iOS / Android の自動再生制限に引っかかるため、モジュール読み込み時には作らない。
 */
let ctx: AudioContext | null = null;

type AudioContextCtor = typeof AudioContext;

function getCtor(): AudioContextCtor {
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) throw new Error('Web Audio API が使えません');
  return Ctor;
}

/** 既に生成済みなら返す。まだなら null（SSR や未タップ時） */
export function peekAudioContext(): AudioContext | null {
  return ctx;
}

/** 必ずユーザー操作（タップ・クリック）のハンドラの中から呼ぶこと */
export async function ensureAudioContext(): Promise<AudioContext> {
  if (!ctx) ctx = new (getCtor())();
  // タブを離れて suspended になっている場合もあるため毎回確認する
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
}
