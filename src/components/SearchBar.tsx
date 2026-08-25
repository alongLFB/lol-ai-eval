'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, Globe, ChevronDown, X, History, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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

export function SearchBar({ onSearch, isLoading, initialValue = '', initialServer = 'EUW' }: SearchBarProps) {
  const t = useTranslations('SearchBar');
  const [input, setInput] = useState(initialValue);
  const [server, setServer] = useState<string>(initialServer);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate search history from localStorage on client mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync state when initial props update (e.g. from leaderboard jump)
  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      if (initialValue.includes('#')) {
        const [g, tag] = initialValue.split('#');
        if (g && tag) {
          saveToHistory(g, tag, initialServer || 'EUW');
        }
      }
    }
  }, [initialValue, initialServer]);

  useEffect(() => {
    if (initialServer) {
      setServer(initialServer);
    }
  }, [initialServer]);

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

    setHistory((prev) => {
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

    // Parse ID like "CatchingTheFire#EUW"
    const [gameName, tagLine] = input.split('#');
    if (!gameName || !tagLine) {
      alert(t('formatError'));
      return;
    }

    saveToHistory(gameName, tagLine, server);
    setIsOpen(false);
    onSearch(gameName.trim(), tagLine.trim(), server);
  };

  const handleSelectHistory = (item: SearchHistoryItem) => {
    if (isLoading) return;
    setInput(`${item.gameName}#${item.tagLine}`);
    setServer(item.server);
    saveToHistory(item.gameName, item.tagLine, item.server);
    setIsOpen(false);
    onSearch(item.gameName, item.tagLine, item.server);
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
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
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear search history from localStorage:', err);
    }
  };

  const handleClear = () => {
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

  const formatTimestamp = (ts: number) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto relative">
      {/* Search Input Form */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
        <div className="relative flex flex-col sm:flex-row items-center bg-gray-900/90 rounded-xl border border-gray-800 p-2 shadow-2xl backdrop-blur-sm gap-2 sm:gap-0">
          
          <div className="flex items-center w-full sm:w-auto pl-3 pr-2 border-b sm:border-b-0 sm:border-r border-gray-700 pb-2 sm:pb-0 pt-1 sm:pt-0">
            <Globe className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
            <div className="relative w-full sm:w-auto">
              <select 
                value={server} 
                onChange={(e) => setServer(e.target.value)}
                className="bg-transparent text-white outline-none appearance-none cursor-pointer text-base sm:text-sm font-bold w-full pr-7"
                disabled={isLoading}
              >
                {SERVER_IDS.map((id) => (
                  <option key={id} value={id} className="bg-gray-800 text-gray-100">
                    {t(`servers.${id}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-blue-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="relative flex-1 flex items-center w-full">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onFocus={() => {
                if (history.length > 0) setIsOpen(true);
              }}
              onClick={() => {
                if (history.length > 0) setIsOpen(true);
              }}
              onChange={(e) => {
                setInput(e.target.value);
                if (history.length > 0) setIsOpen(true);
              }}
              placeholder={t('placeholder')}
              className="w-full bg-transparent border-none outline-none text-gray-100 pl-4 pr-16 py-3 sm:py-2 placeholder-gray-500 text-base sm:text-lg"
              disabled={isLoading}
            />

            <div className="absolute right-3 flex items-center gap-1">
              {input.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
                  title={t('clear')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {isMounted && history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsOpen((prev) => !prev)}
                  className={cn(
                    "p-1.5 rounded-lg text-gray-400 hover:text-blue-300 hover:bg-gray-800 transition-all cursor-pointer",
                    isOpen && "text-blue-400 bg-gray-800"
                  )}
                  title={t('historyTitle')}
                >
                  <History className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg font-semibold text-white transition-all justify-center cursor-pointer",
              "bg-blue-600 hover:bg-blue-500 flex items-center gap-2",
              isLoading && "opacity-70 cursor-not-allowed bg-blue-800 hover:bg-blue-800"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('connecting')}</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>{t('insight')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Vertical Scrolling Search History Dropdown */}
      {isMounted && isOpen && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-900/95 border border-gray-800/90 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-950/70 border-b border-gray-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 select-none">
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('historyTitle')}</span>
              <span className="text-[10px] text-gray-400 bg-gray-800 border border-gray-700/60 px-1.5 py-0.5 rounded-full font-mono">
                {history.length}
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleClearAllHistory}
              className="text-gray-400 hover:text-red-400 text-xs flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-red-500/10 cursor-pointer select-none"
              title={t('clearHistory')}
            >
              <Trash2 className="w-3 h-3" />
              <span>{t('clearHistory')}</span>
            </button>
          </div>

          {/* Vertical Scrollable List */}
          <div 
            className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-gray-800/40 py-1 scrollbar-thin scrollbar-thumb-gray-700/70 hover:scrollbar-thumb-gray-600 scrollbar-track-transparent select-none"
          >
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistory(item)}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-800/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  <Clock className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors shrink-0" />
                  
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border font-mono shrink-0",
                      getServerBadgeStyle(item.server)
                    )}
                  >
                    {item.server}
                  </span>

                  <div className="flex items-baseline gap-1 min-w-0 truncate">
                    <span className="font-semibold text-gray-200 group-hover:text-blue-300 transition-colors truncate">
                      {item.gameName}
                    </span>
                    <span className="text-xs text-gray-400 font-mono shrink-0">
                      #{item.tagLine}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.timestamp && (
                    <span className="text-[11px] text-gray-500 font-mono">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                    className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-gray-700/50 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
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



