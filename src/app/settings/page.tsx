import type { Metadata } from 'next';
import { UnlockedLevelSetting } from '@/components/UnlockedLevelSetting';
import { AssistSetting } from '@/components/AssistSetting';
import { MidiSetting } from '@/components/MidiSetting';

export const metadata: Metadata = { title: '設定 | Beatlog' };

export default function SettingsPage() {
  return (
    <main className="flex flex-col gap-5">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">設定</h1>
        <p className="mt-2 text-[13px] text-dim">
          判定に使う値はこの端末だけに保存され、同期の対象にもしません。
        </p>
      </section>

      <UnlockedLevelSetting />
      <AssistSetting />
      <MidiSetting />
    </main>
  );
}
