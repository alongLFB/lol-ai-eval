'use client';
import { useState } from 'react';
import { Search, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (gameName: string, tagLine: string, server: string) => void;
  isLoading: boolean;
}

const SERVERS = [
  { id: 'EUW', label: 'Europe West' },
  { id: 'ME', label: 'Middle East' },
];

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [input, setInput] = useState('');
  const [server, setServer] = useState(SERVERS[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Parse ID like "CatchingTheFire#EUW"
    const [gameName, tagLine] = input.split('#');
    if (!gameName || !tagLine) {
      alert("格式错误！请输入带有 '#' 的完整 ID，例如 CatchingTheFire#EUW");
      return;
    }
    
    onSearch(gameName.trim(), tagLine.trim(), server);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
      <div className="relative flex flex-col sm:flex-row items-center bg-gray-900/90 rounded-xl border border-gray-800 p-2 shadow-2xl backdrop-blur-sm gap-2 sm:gap-0">
        
        <div className="flex items-center w-full sm:w-auto pl-3 pr-2 border-b sm:border-b-0 sm:border-r border-gray-700 pb-2 sm:pb-0 pt-1 sm:pt-0">
          <Globe className="w-5 h-5 text-gray-400 mr-2 shrink-0" />
          <select 
            value={server} 
            onChange={(e) => setServer(e.target.value)}
            className="bg-transparent text-gray-300 outline-none appearance-none cursor-pointer text-base sm:text-sm font-medium w-full pr-4"
            disabled={isLoading}
          >
            {SERVERS.map(s => (
              <option key={s.id} value={s.id} className="bg-gray-800 text-gray-100">{s.label}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="游戏ID#TAG (例如: CatchingTheFire#EUW)"
          className="w-full sm:flex-1 bg-transparent border-none outline-none text-gray-100 px-4 py-3 sm:py-2 placeholder-gray-500 text-base sm:text-lg"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg font-semibold text-white transition-all justify-center",
            "bg-blue-600 hover:bg-blue-500 flex items-center gap-2",
            isLoading && "opacity-70 cursor-not-allowed bg-blue-800 hover:bg-blue-800"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>连接中...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>洞察</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
