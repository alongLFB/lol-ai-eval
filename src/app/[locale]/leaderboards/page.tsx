'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LeaderboardItem, LeaderboardStats } from '@/lib/riot';
import { 
  Trophy, 
  Flame, 
  Crown, 
  Sparkles, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  Clock, 
  Loader2, 
  ShieldAlert,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';


const SERVERS = [
  { id: 'EUW', label: 'EUW' },
  { id: 'KR', label: 'KR' },
  { id: 'NA', label: 'NA' },
  { id: 'ME', label: 'ME' },
  { id: 'TW', label: 'TW' },
];

const TIERS = [
  { id: 'all', labelKey: 'all' },
  { id: 'challenger', labelKey: 'challenger' },
  { id: 'grandmaster', labelKey: 'grandmaster' },
  { id: 'master', labelKey: 'master' },
  { id: 'diamond', labelKey: 'diamond' },
  { id: 'emerald', labelKey: 'emerald' },
  { id: 'platinum', labelKey: 'platinum' },
  { id: 'gold', labelKey: 'gold' },
  { id: 'silver', labelKey: 'silver' },
  { id: 'bronze', labelKey: 'bronze' },
  { id: 'iron', labelKey: 'iron' },
];

export default function LeaderboardsPage() {
  const t = useTranslations('Leaderboards');
  const locale = useLocale();
  const router = useRouter();

  const [currentServer, setCurrentServer] = useState('EUW');
  const [currentTier, setCurrentTier] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [entries, setEntries] = useState<LeaderboardItem[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLeaderboard = useCallback(async (server: string, tier: string, page: number, force: boolean = false) => {
    if (force) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const url = `/api/leaderboard?server=${server}&tier=${tier}&page=${page}${force ? '&force=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load leaderboard data');
      }

      setEntries(data.entries || []);
      if (data.stats) setStats(data.stats);
      setLastUpdated(data.lastUpdated || null);
    } catch (err: any) {
      console.error('Failed to load leaderboard:', err);
      setError(err.message || 'Error loading leaderboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard(currentServer, currentTier, currentPage);
  }, [currentServer, currentTier, currentPage, loadLeaderboard]);

  const handleServerChange = (server: string) => {
    setCurrentServer(server);
    setCurrentPage(1);
    setSearchQuery('');
  };

  const handleTierChange = (tier: string) => {
    setCurrentTier(tier);
    setCurrentPage(1);
    setSearchQuery('');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > 10) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewSummoner = (gameName: string, tagLine: string) => {
    const formatTag = tagLine ? tagLine.replace('#', '') : currentServer;
    const formattedId = `${encodeURIComponent(gameName)}-${encodeURIComponent(formatTag)}`;
    router.push(`/${locale}?summoner=${formattedId}&server=${currentServer}`);
  };

  // Filter entries by search query
  const filteredEntries = entries.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.gameName.toLowerCase().includes(query) ||
      item.tagLine.toLowerCase().includes(query) ||
      item.rank.toString().includes(query)
    );
  });

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  const totalSummoners = stats?.totalServerSummoners || 3081926;
  const startRank = (currentPage - 1) * 100 + 1;
  const endRank = currentPage * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Info Banner (OP.GG style) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-400 gap-2 border-b border-slate-800/60 pb-3">
          <div>
            {t('serverSummonersInfo', { total: totalSummoners.toLocaleString() })}
          </div>
          <div className="flex items-center gap-3">
            <span>显示排位在铁牌及以上的召唤师。排行榜会定期 24 小时更新。</span>
            <button
              onClick={() => loadLeaderboard(currentServer, currentTier, currentPage, true)}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-xs border border-slate-700/50 cursor-pointer disabled:opacity-50"
              title={t('refresh')}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? t('updating') : t('refresh')}</span>
            </button>
          </div>
        </div>

        {/* Control Bar (OP.GG Header Bar) */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          
          {/* Dropdowns */}
          <div className="flex gap-2">
            {/* Server Dropdown */}
            <div className="relative">
              <select
                value={currentServer}
                onChange={(e) => handleServerChange(e.target.value)}
                className="appearance-none bg-slate-800/90 text-slate-100 text-sm font-bold pl-4 pr-9 py-2.5 rounded-xl border border-slate-700/80 hover:border-slate-600 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {SERVERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Tier Dropdown */}
            <div className="relative">
              <select
                value={currentTier}
                onChange={(e) => handleTierChange(e.target.value)}
                className="appearance-none bg-slate-800/90 text-slate-100 text-sm font-bold pl-4 pr-9 py-2.5 rounded-xl border border-slate-700/80 hover:border-slate-600 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {TIERS.map((tItem) => (
                  <option key={tItem.id} value={tItem.id}>
                    {t(`tiers.${tItem.labelKey}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Apex Summary Pill (Cutoff LP & Count stats) */}
          <div className="flex-1 flex flex-wrap items-center gap-4 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium">
            {/* Challenger */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Trophy className="w-4 h-4" />
                {(stats?.challengerCutoffLP || 2386).toLocaleString()} LP
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">▲ 9</span>
              <span className="text-slate-400">{(stats?.challengerCount || 304).toLocaleString()} 名召唤师</span>
            </div>

            <span className="text-slate-700">|</span>

            {/* Grandmaster */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                {(stats?.grandmasterCutoffLP || 1759).toLocaleString()} LP
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">▲ 8</span>
              <span className="text-slate-400">{(stats?.grandmasterCount || 754).toLocaleString()} 名召唤师</span>
            </div>
          </div>

          {/* Player Search Input */}
          <div className="relative w-full lg:w-72 flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`玩家名称 #${currentServer}`}
              className="w-full bg-slate-950 text-slate-200 text-sm pl-9 pr-9 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-500"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                title={t('clearSearch')}

              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">正在拉取 {currentServer} 服 {t(`tiers.${currentTier}`)} 第 {currentPage} 页排行榜数据...</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="p-8 rounded-2xl bg-red-950/30 border border-red-800/50 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={() => loadLeaderboard(currentServer, currentTier, currentPage, true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              重试获取
            </button>
          </div>
        )}

        {/* Leaderboard Table (100 rows per page) */}
        {!isLoading && !error && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 shadow-2xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-4 text-center w-20">{t('columns.rank')}</th>
                      <th className="py-4 px-4">{t('columns.summoner')}</th>
                      <th className="py-4 px-4 text-center">{t('columns.tier')}</th>
                      <th className="py-4 px-4 text-right">{t('columns.lp')}</th>
                      <th className="py-4 px-4 text-center">{t('columns.winsLosses')}</th>
                      <th className="py-4 px-4">{t('columns.winRate')}</th>
                      <th className="py-4 px-4">{t('columns.status')}</th>
                      <th className="py-4 px-4 text-center w-28">{t('columns.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-500">
                          {t('empty')}
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((item) => {
                        const winRateVal = parseFloat(item.winRate);
                        return (
                          <tr
                            key={item.rank + item.puuid}
                            className="hover:bg-slate-800/40 transition-colors group"
                          >
                            {/* Rank */}
                            <td className="py-3.5 px-4 text-center font-black">
                              {item.rank === 1 && (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-yellow-600 text-slate-950 font-black shadow-lg shadow-amber-500/30">
                                  1
                                </span>
                              )}
                              {item.rank === 2 && (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950 font-black shadow-md">
                                  2
                                </span>
                              )}
                              {item.rank === 3 && (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-black shadow-md">
                                  3
                                </span>
                              )}
                              {item.rank > 3 && (
                                <span className="text-slate-400 font-mono text-sm">#{item.rank}</span>
                              )}
                            </td>

                            {/* Summoner ID */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-slate-300 text-xs">
                                  {item.gameName.charAt(0).toUpperCase()}
                                </div>
                                <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                                  <span>{item.gameName}</span>
                                  <span className="text-slate-500 text-xs font-normal">#{item.tagLine}</span>
                                </div>
                              </div>
                            </td>

                            {/* Tier Badge */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                item.tier === 'CHALLENGER' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                                item.tier === 'GRANDMASTER' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
                                item.tier === 'MASTER' ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' :
                                'bg-slate-800 border-slate-700 text-slate-300'
                              }`}>
                                {item.tier}
                              </span>
                            </td>

                            {/* LP */}
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                              {item.leaguePoints.toLocaleString()} <span className="text-xs text-amber-500/80">LP</span>
                            </td>

                            {/* W / L */}
                            <td className="py-3.5 px-4 text-center font-mono text-xs">
                              <span className="text-emerald-400 font-semibold">{item.wins}胜</span>
                              <span className="text-slate-600 mx-1">/</span>
                              <span className="text-rose-400 font-semibold">{item.losses}负</span>
                            </td>

                            {/* Win Rate Progress */}
                            <td className="py-3.5 px-4">
                              <div className="w-28 space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className={winRateVal >= 60 ? 'text-amber-400' : 'text-slate-300'}>
                                    {item.winRate}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                  <div
                                    className={`h-full rounded-full ${
                                      winRateVal >= 60
                                        ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                    }`}
                                    style={{ width: `${Math.min(winRateVal, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Status Badges */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1">
                                {item.hotStreak && (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-medium">
                                    🔥 连胜
                                  </span>
                                )}
                                {item.veteran && (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-medium">
                                    👑 资深
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Action Button */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleViewSummoner(item.gameName, item.tagLine)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all text-xs font-medium border border-slate-700/50 cursor-pointer shadow-sm"
                              >
                                <span>{t('viewProfile')}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls (OP.GG style bottom bar) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-slate-800/80 text-xs text-slate-400">
              <div>
                #{startRank} ~ #{endRank} / 总计 {totalSummoners.toLocaleString()} 召唤师
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-lg font-bold transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === 10 || isLoading}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
