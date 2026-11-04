'use client';

import { useSyncExternalStore } from 'react';
import { VolumeX } from 'lucide-react';
import { sound } from '@/lib/sound';
import { useTranslations } from 'next-intl';

export function SoundToggle() {
  const t = useTranslations('Navigation');
  
  const enabled = useSyncExternalStore(
    (onStoreChange) => sound.subscribe(onStoreChange),
    () => sound.isEnabled(),
    () => false
  );

  const handleToggle = () => {
    sound.toggle();
  };

  return (
    <button
      onClick={handleToggle}
      className={`group relative flex items-center justify-center w-9 h-9 rounded-full border transition-all cursor-pointer backdrop-blur-md ${
        enabled
          ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
      }`}
      title={enabled ? (t('soundMute') || 'Mute SFX') : (t('soundEnable') || 'Enable SFX')}
      aria-label="Toggle UI Sound"
    >
      {enabled ? (
        <div className="flex items-center gap-0.5 h-3.5">
          <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-0.5 h-4 bg-cyan-300 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-0.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]" />
          <span className="w-0.5 h-3.5 bg-cyan-200 rounded-full animate-bounce [animation-delay:100ms]" />
        </div>
      ) : (
        <VolumeX className="w-4 h-4 transition-transform group-hover:scale-110" />
      )}
    </button>
  );
}
