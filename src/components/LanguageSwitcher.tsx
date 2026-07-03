'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Languages } from 'lucide-react';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  const toggleLocale = () => {
    const nextLocale = locale === 'zh' ? 'en' : 'zh';
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-gray-900/80 hover:bg-gray-800 text-gray-200 rounded-full font-medium shadow-lg transition-all border border-gray-700/50 backdrop-blur-sm"
      title={t('switchLanguage')}
    >
      <Languages className="w-4 h-4 text-blue-400" />
      <span className="text-sm">{locale === 'zh' ? 'EN' : 'ZH'}</span>
    </button>
  );
}
