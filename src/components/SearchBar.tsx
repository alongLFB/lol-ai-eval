'use client';

import { useState, useRef, useCallback, useSyncExternalStore } from 'react';
import { Search, Loader2, Globe, ChevronDown, X, History, Trash2, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { sound } from '@/lib/sound';
import { SpotlightCard } from './SpotlightCard';

export interface SearchHistoryItem {
  id: string;
  gameName: string;
  tagLine: string;
  server: string;
  timestamp: number;
}

interface SearchBarProps {
  onSearch: (gameName: string, tagLine: string, server: string) => void;
  isLoading: boolean;
  initialValue?: string;
  initialServer?: string;
}

const SERVER_IDS = ['EUW', 'ME', 'NA', 'KR', 'TW'] as const;
const STORAGE_KEY = 'lol_search_history';
const MAX_HISTORY_ITEMS = 30;

// Curated pro / famous summoners for instant 1-click test drive
const PRO_SUMMONERS = [
  { gameName: 'Hide on bush', tagLine: 'KR1', server: 'KR', label: 'Faker' },
  { gameName: 'Caps', tagLine: 'EUW', server: 'EUW', label: 'Caps' },
  { gameName: 'ShowMaker', tagLine: 'KR1', server: 'KR', label: 'ShowMaker' },
  { gameName: 'Bo', tagLine: 'EUW', server: 'EUW', label: 'Bo' },
  { gameName: 'Doublelift', tagLine: 'NA1', server: 'NA', label: 'Doublelift' },
];

let cachedHistory: SearchHistoryItem[] = [];
let cachedRaw: string | null = null;

function getStoredHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw && cachedRaw !== null) {
      return cachedHistory;
    }
    cachedRaw = raw;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedHistory = parsed;
        return parsed;
      }
    }
  } catch {}
  return [];
}

const emptySubscribe = () => () => {};

export function SearchBar({ onSearch, isLoading, initialValue = '', initialServer = 'EUW' }: SearchBarProps) {
  const t = useTranslations('SearchBar');
  const tNav = useTranslations('Navigation');
  const [input, setInput] = useState(initialValue);
  const [server, setServer] = useState<string>(initialServer);
  const [isOpen, setIsOpen] = useState(false);

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [historyList, setHistoryList] = useState<SearchHistoryItem[]>(() => getStoredHistory());

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = useCallback((gameName: string, tagLine: string, srv: string) => {
    const cleanGame = gameName.trim();
    const cleanTag = tagLine.trim().replace(/^#/, '');
    const cleanServer = srv.trim().toUpperCase();
    if (!cleanGame || !cleanTag) return;

    const key = `${cleanGame.toLowerCase()}#${cleanTag.toLowerCase()}@${cleanServer.toLowerCase()}`;
    const newItem: SearchHistoryItem = {
      id: `${cleanGame}#${cleanTag}@${cleanServer}`,
      gameName: cleanGame,
      tagLine: cleanTag,
      server: cleanServer,
      timestamp: Date.now(),
    };

    setHistoryList((prev) => {
      const filtered = prev.filter(
        (item) => `${item.gameName.toLowerCase()}#${item.tagLine.toLowerCase()}@${item.server.toLowerCase()}` !== key
      );
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save search history to localStorage:', err);
      }
      return updated;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const [gameName, tagLine] = input.split('#');
    if (!gameName || !tagLine) {
      alert(t('formatError'));
      return;
    }

    sound.playOracle();
    saveToHistory(gameName, tagLine, server);
    setIsOpen(false);
    onSearch(gameName.trim(), tagLine.trim(), server);
  };

  const handleSelectHistory = (item: SearchHistoryItem) => {
    if (isLoading) return;
    sound.playClick();
    setInput(`${item.gameName}#${item.tagLine}`);
    setServer(item.server);
    saveToHistory(item.gameName, item.tagLine, item.server);
    setIsOpen(false);
    onSearch(item.gameName, item.tagLine, item.server);
  };

  const handleSelectPro = (pro: typeof PRO_SUMMONERS[0]) => {
    if (isLoading) return;
    sound.playClick();
    const fullId = `${pro.gameName}#${pro.tagLine}`;
    setInput(fullId);
    setServer(pro.server);
    saveToHistory(pro.gameName, pro.tagLine, pro.server);
    setIsOpen(false);
    onSearch(pro.gameName, pro.tagLine, pro.server);
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setHistoryList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to update localStorage:', err);
      }
      return updated;
    });
  };

  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    setHistoryList([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear search history from localStorage:', err);
    }
  };

  const handleClear = () => {
    sound.playClick();
    setInput('');
    inputRef.current?.focus();
  };

  const getServerBadgeStyle = (srv: string) => {
    switch (srv.toUpperCase()) {
      case 'EUW':
        return 'bg-blue-950/80 text-blue-400 border-blue-700/60';
      case 'KR':
        return 'bg-rose-950/80 text-rose-400 border-rose-700/60';
      case 'NA':
        return 'bg-amber-950/80 text-amber-400 border-amber-700/60';
      case 'ME':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60';
      case 'TW':
        return 'bg-purple-950/80 text-purple-400 border-purple-700/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto relative">
      {/* Spotlight Wrapped Search Card */}
      <SpotlightCard
        spotlightColor="rgba(56, 189, 248, 0.15)"
        className="border-slate-800/90 bg-slate-900/80 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl cyber-corners"
      >
        <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
          {/* Server Selector */}
          <div className="flex items-center w-full sm:w-auto pl-3 pr-2 border-b sm:border-b-0 sm:border-r border-slate-700/60 pb-2 sm:pb-0 pt-1 sm:pt-0">
            <Globe className="w-4 h-4 text-cyan-400 mr-2 shrink-0 animate-pulse" />
            <div className="relative w-full sm:w-auto">
              <select 
                value={server} 
                onChange={(e) => {
                  sound.playClick();
                  setServer(e.target.value);
                }}
                className="bg-transparent text-white outline-none appearance-none cursor-pointer text-sm font-bold w-full pr-6 tracking-wide"
                disabled={isLoading}
              >
                {SERVER_IDS.map((id) => (
                  <option key={id} value={id} className="bg-slate-900 text-slate-100">
                    {t(`servers.${id}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Riot ID Input */}
          <div className="relative flex-1 flex items-center w-full">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onFocus={() => {
                if (historyList.length > 0) setIsOpen(true);
              }}
              onClick={() => {
                if (historyList.length > 0) setIsOpen(true);
              }}
              onChange={(e) => {
                setInput(e.target.value);
                if (historyList.length > 0) setIsOpen(true);
              }}
              placeholder={t('placeholder')}
              className="w-full bg-transparent border-none outline-none text-slate-100 pl-4 pr-16 py-2.5 placeholder-slate-500 text-sm sm:text-base font-medium"
              disabled={isLoading}
            />

            <div className="absolute right-3 flex items-center gap-1">
              {input.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  title={t('clear')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {isMounted && historyList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsOpen((prev) => !prev);
                  }}
                  className={cn(
                    "p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-all cursor-pointer",
                    isOpen && "text-cyan-400 bg-slate-800"
                  )}
                  title={t('historyTitle')}
                >
                  <History className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            onMouseEnter={() => sound.playHover()}
            className={cn(
              "w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide text-white transition-all justify-center cursor-pointer shadow-lg",
              "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 hover:shadow-cyan-500/25 flex items-center gap-2",
              "active:scale-95 duration-150",
              isLoading && "opacity-70 cursor-not-allowed bg-slate-800 hover:bg-slate-800"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                <span>{t('connecting')}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{t('insight')}</span>
              </>
            )}
          </button>
        </form>
      </SpotlightCard>

      {/* 1-Click Pro Summoner Quick Selection Chips */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px] select-none">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          {tNav('quickSearchLabel')}
        </span>
        {PRO_SUMMONERS.map((pro) => (
          <button
            key={`${pro.gameName}-${pro.server}`}
            onClick={() => handleSelectPro(pro)}
            onMouseEnter={() => sound.playHover()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span className="text-[10px] font-mono px-1 rounded bg-slate-800/80 text-cyan-400">
              {pro.server}
            </span>
            <span className="font-semibold">{pro.label}</span>
          </button>
        ))}
      </div>

      {/* Vertical Scrolling Search History Dropdown */}
      {isMounted && isOpen && historyList.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 select-none">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('historyTitle')}</span>
              <span className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700/60 px-1.5 py-0.5 rounded-full font-mono">
                {historyList.length}
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleClearAllHistory}
              className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-rose-500/10 cursor-pointer select-none"
              title={t('clearHistory')}
            >
              <Trash2 className="w-3 h-3" />
              <span>{t('clearHistory')}</span>
            </button>
          </div>

          {/* Vertical Scrollable List */}
          <div className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-slate-800/40 py-1 scrollbar-thin select-none">
            {historyList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistory(item)}
                onMouseEnter={() => sound.playHover()}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-800/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  <Clock className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                  
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border font-mono shrink-0",
                      getServerBadgeStyle(item.server)
                    )}
                  >
                    {item.server}
                  </span>

                  <div className="flex items-baseline gap-1 min-w-0 truncate">
                    <span className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {item.gameName}
                    </span>
                    <span className="text-xs text-slate-400 font-mono shrink-0">
                      #{item.tagLine}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                    className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                    title={t('deleteHistoryItem')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
