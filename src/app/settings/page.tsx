import type { Metadata } from 'next';
import { UnlockedLevelSetting } from '@/components/UnlockedLevelSetting';
import { AssistSetting } from '@/components/AssistSetting';

export const metadata: Metadata = { title: '設定 | Beatlog' };

export default function SettingsPage() {
  return (
    <main className="flex flex-col gap-5">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">設定</h1>
        <p className="mt-2 text-[13px] text-dim">
          キャリブレーションは Phase 4 で追加します。
        </p>
      </section>

      <UnlockedLevelSetting />
      <AssistSetting />
    </main>
  );
}
