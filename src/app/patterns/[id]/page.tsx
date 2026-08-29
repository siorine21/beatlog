import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { patterns, getPattern } from '@/data/patterns';
import { PatternPlayer } from '@/components/PatternPlayer';

/** 静的エクスポートのため、マスタデータから全IDを生成する（spec.md §5.1） */
export function generateStaticParams() {
  return patterns.map((pattern) => ({ id: pattern.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pattern = getPattern(id);
  return { title: pattern ? `${pattern.name} | Beatlog` : 'リズムパターン | Beatlog' };
}

export default async function PatternDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pattern = getPattern(id);
  if (!pattern) notFound();
  return <PatternPlayer pattern={pattern} />;
}
