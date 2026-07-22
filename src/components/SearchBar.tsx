'use client';

import { useState, useEffect } from 'react';

import { Search, Loader2, Globe, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
  onSearch: (gameName: string, tagLine: string, server: string) => void;
  isLoading: boolean;
  initialValue?: string;
  initialServer?: string;
}

const SERVER_IDS = ['EUW', 'ME', 'NA', 'KR', 'TW'] as const;

export function SearchBar({ onSearch, isLoading, initialValue = '', initialServer = 'EUW' }: SearchBarProps) {
  const t = useTranslations('SearchBar');
  const [input, setInput] = useState(initialValue);
  const [server, setServer] = useState<string>(initialServer);

  // Sync state when initial props update (e.g. from leaderboard jump)
  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (initialServer) {
      setServer(initialServer);
    }
  }, [initialServer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Parse ID like "CatchingTheFire#EUW"
    const [gameName, tagLine] = input.split('#');
    if (!gameName || !tagLine) {
      alert(t('formatError'));
      return;
    }
    
    onSearch(gameName.trim(), tagLine.trim(), server);
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto relative group">
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
              {SERVER_IDS.map(id => (
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
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full bg-transparent border-none outline-none text-gray-100 pl-4 pr-10 py-3 sm:py-2 placeholder-gray-500 text-base sm:text-lg"
            disabled={isLoading}
          />
          {input.length > 0 && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer"
              title="清除输入"
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
  );
}

