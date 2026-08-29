import type { ReactNode } from 'react';

/**
 * 画面共通の小さな部品。
 * 練習中に使う要素は最低44pxのタップ領域を確保すること（CLAUDE.md）。
 */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-edge bg-panel shadow-card ${className}`}>
      {children}
    </div>
  );
}

/** セクション見出し。モノスペースの小さなラベル */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.22em] text-silk uppercase">{children}</span>
  );
}

/** 情報の小片。押せないことが分かるよう、輪郭は細く彩度は低く */
export function Chip({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'quiet' | 'mono';
}) {
  const style = {
    default: 'border-edge2 bg-panel2 text-dim',
    quiet: 'border-edge bg-transparent text-silk',
    mono: 'border-edge2 bg-panel2 text-dim font-mono tnum text-[10px] tracking-wider',
  }[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-chip border px-2 py-[3px] text-[11px] leading-none ${style}`}
    >
      {children}
    </span>
  );
}

/** レベルの丸バッジ */
export function LevelBadge({ level }: { level: number }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-edge2 bg-raised font-mono text-[11px] tnum text-txt">
      {level}
    </span>
  );
}
