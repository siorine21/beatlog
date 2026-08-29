import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { drills, getDrill } from '@/data/drills';
import { PracticeRunner } from '@/components/PracticeRunner';

/** 静的エクスポートのため、マスタデータから全IDを生成する（spec.md §5.1） */
export function generateStaticParams() {
  return drills.map((drill) => ({ drillId: drill.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ drillId: string }>;
}): Promise<Metadata> {
  const { drillId } = await params;
  const drill = getDrill(drillId);
  return { title: drill ? `${drill.name} | Beatlog` : '練習 | Beatlog' };
}

export default async function PracticePage({ params }: { params: Promise<{ drillId: string }> }) {
  const { drillId } = await params;
  const drill = getDrill(drillId);
  if (!drill) notFound();
  return <PracticeRunner drill={drill} />;
}
