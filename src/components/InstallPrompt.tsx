'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';

/** Chrome 系だけが出すイベント。型定義には無いので最小限だけ書く */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * ホーム画面への追加を促す導線。
 * インストール可能だとブラウザが判断したときにだけ出す。
 * 判断できないブラウザ（iOS Safari など）では何も出さない。
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      // 既定のミニバーを止めて、こちらの導線から出す
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setEvent(null);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!event) return null;

  return (
    <Card className="flex items-center gap-3 px-4 py-3">
      <span className="flex-1">
        <span className="block text-[14px] font-bold">アプリとして追加</span>
        <span className="block text-[12px] text-dim">
          ホーム画面から起動でき、機内モードでも開けます。
        </span>
      </span>
      <button
        type="button"
        onClick={async () => {
          await event.prompt();
          await event.userChoice;
          setEvent(null);
        }}
        className="min-h-11 shrink-0 touch-manipulation rounded-chip bg-chrome px-4 text-[13px] font-semibold text-bg transition-colors hover:bg-txt active:bg-dim"
      >
        追加
      </button>
    </Card>
  );
}
