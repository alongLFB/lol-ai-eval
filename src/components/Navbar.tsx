'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Trophy, Swords, Sparkles, Activity } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SoundToggle } from './SoundToggle';
import { sound } from '@/lib/sound';

export function Navbar() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('Navigation');

  const isLeaderboards = pathname.includes('/leaderboards');
  const isHome = !isLeaderboards;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl transition-all shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <Link 
          href={`/${locale}`}
          onClick={() => sound.playClick()}
          onMouseEnter={() => sound.playHover()}
          className="group flex items-center gap-2.5 text-lg sm:text-xl font-black tracking-tight"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-purple-600/20 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all">
            <Swords className="w-4 h-4 text-cyan-300 transition-transform group-hover:rotate-12 duration-300" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-75" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent group-hover:text-glow-cyan transition-all">
              {locale === 'zh' ? 'LOL AI 神谕' : 'LOL AI ORACLE'}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 hidden sm:inline-block">
              PRO
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-900/90 p-1 rounded-full border border-slate-800/80 shadow-inner backdrop-blur-md">
          <Link
            href={`/${locale}`}
            onClick={() => sound.playClick()}
            onMouseEnter={() => sound.playHover()}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isHome
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>{t('home')}</span>
          </Link>

          <Link
            href={`/${locale}/leaderboards`}
            onClick={() => sound.playClick()}
            onMouseEnter={() => sound.playHover()}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isLeaderboards
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('leaderboards')}</span>
          </Link>
        </nav>

        {/* Right Tools: Live Status + Sound Toggle + Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle Live Server Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span>Riot v4</span>
          </div>

          <SoundToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
