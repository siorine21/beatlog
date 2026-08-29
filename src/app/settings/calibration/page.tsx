import type { Metadata } from 'next';
import { Calibration } from '@/components/Calibration';

export const metadata: Metadata = { title: 'キャリブレーション | Beatlog' };

export default function CalibrationPage() {
  return (
    <main className="flex flex-col gap-5">
      <section className="pt-2">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">キャリブレーション</h1>
        <p className="mt-2 text-[13px] text-dim">
          イヤホンの出力遅延と MIDI 入力の遅延は端末ごとに違います。実測して補正します。
        </p>
      </section>

      <Calibration />
    </main>
  );
}
