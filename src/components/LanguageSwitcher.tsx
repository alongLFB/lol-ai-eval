'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Languages } from 'lucide-react';
import { useTransition } from 'react';
import { sound } from '@/lib/sound';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  const toggleLocale = () => {
    sound.playClick();
    const nextLocale = locale === 'zh' ? 'en' : 'zh';
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <button
      onClick={toggleLocale}
      onMouseEnter={() => sound.playHover()}
      disabled={isPending}
      className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-full font-medium shadow-sm transition-all border border-slate-700/50 backdrop-blur-sm cursor-pointer shrink-0 whitespace-nowrap"
      title={t('switchLanguage')}
    >
      <Languages className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
      <span className="text-xs sm:text-sm font-semibold">{locale === 'zh' ? 'EN' : '中文'}</span>
    </button>
  );
}
