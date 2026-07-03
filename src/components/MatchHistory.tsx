'use client';

import { useState, useCallback, useMemo } from 'react';
import { SummonerProfileData, EnrichedMatchData, EnrichedParticipant, PlayerRankInfo } from '@/lib/riot';
import { cn } from '@/lib/utils';
import { Trophy, Swords, Shield, Target, ChevronDown, Eye, Crosshair, Star, Loader2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Summoner Spell ID → Data Dragon key mapping ──
const SUMMONER_SPELL_MAP: Record<number, string> = {
  1: 'SummonerBoost',       // Cleanse
  3: 'SummonerExhaust',
  4: 'SummonerFlash',
  6: 'SummonerHaste',       // Ghost
  7: 'SummonerHeal',
  11: 'SummonerSmite',
  12: 'SummonerTeleport',
  13: 'SummonerMana',        // Clarity
  14: 'SummonerDot',         // Ignite
  21: 'SummonerBarrier',
  30: 'SummonerPoroRecall',  // ARAM: To the King
  31: 'SummonerPoroThrow',   // ARAM: Poro Toss
  32: 'SummonerSnowball',    // ARAM: Mark
  39: 'SummonerSnowURFSnowball_Mark',
  54: 'Summoner_UltBookPlaceholder',
  55: 'Summoner_UltBookSmitePlaceholder',
  2202: 'SummonerFlash',     // Hexflash placeholder
};

// ── Rune style ID → icon path mapping ──
const RUNE_STYLE_ICONS: Record<number, string> = {
  8000: 'perk-images/Styles/7201_Precision.png',
  8100: 'perk-images/Styles/7200_Domination.png',
  8200: 'perk-images/Styles/7202_Sorcery.png',
  8300: 'perk-images/Styles/7203_Whimsy.png',
  8400: 'perk-images/Styles/7204_Resolve.png',
};

// ── Keystone rune ID → icon path ──
const KEYSTONE_ICONS: Record<number, string> = {
  8005: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
  8008: 'perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png',
  8010: 'perk-images/Styles/Precision/Conqueror/Conqueror.png',
  8021: 'perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png',
  8112: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
  8124: 'perk-images/Styles/Domination/Predator/Predator.png',
  8128: 'perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png',
  9923: 'perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png',
  8214: 'perk-images/Styles/Sorcery/SummonAery/SummonAery.png',
  8229: 'perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png',
  8230: 'perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png',
  8351: 'perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png',
  8360: 'perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png',
  8369: 'perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png',
  8437: 'perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png',
  8439: 'perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png',
  8465: 'perk-images/Styles/Resolve/Guardian/Guardian.png',
};

function getRuneIconUrl(runeId: number, isKeystone: boolean): string {
  if (isKeystone && KEYSTONE_ICONS[runeId]) {
    return `https://ddragon.leagueoflegends.com/cdn/img/${KEYSTONE_ICONS[runeId]}`;
  }
  if (RUNE_STYLE_ICONS[runeId]) {
    return `https://ddragon.leagueoflegends.com/cdn/img/${RUNE_STYLE_ICONS[runeId]}`;
  }
  return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/7201_Precision.png`;
}

function getSummonerSpellUrl(spellId: number, patch: string): string {
  const key = SUMMONER_SPELL_MAP[spellId] || 'SummonerFlash';
  return `https://ddragon.leagueoflegends.com/cdn/${patch}/img/spell/${key}.png`;
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

function formatKDA(kills: number, deaths: number, assists: number): string {
  if (deaths === 0) return 'Perfect';
  return ((kills + assists) / deaths).toFixed(2);
}

function getQueueStyle(queueName: string) {
  switch (queueName) {
    case '单排/双排':
      return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
    case '灵活组排':
      return 'text-purple-400 border-purple-500/40 bg-purple-500/10';
    case '极地大乱斗':
      return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
    default:
      return 'text-gray-400 border-gray-500/40 bg-gray-500/10';
  }
}

function getMultikillStyle(multikill: string) {
  switch (multikill) {
    case '五杀': return 'bg-red-500 text-white shadow-red-500/50';
    case '四杀': return 'bg-orange-500 text-white shadow-orange-500/50';
    case '三杀': return 'bg-purple-500 text-white shadow-purple-500/50';
    case '双杀': return 'bg-blue-500 text-white shadow-blue-500/50';
    default: return 'bg-gray-500 text-white';
  }
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'IRON': return 'text-gray-400';
    case 'BRONZE': return 'text-amber-700';
    case 'SILVER': return 'text-gray-300';
    case 'GOLD': return 'text-yellow-400';
    case 'PLATINUM': return 'text-teal-400';
    case 'EMERALD': return 'text-emerald-400';
    case 'DIAMOND': return 'text-blue-400';
    case 'MASTER': return 'text-purple-400';
    case 'GRANDMASTER': return 'text-red-400';
    case 'CHALLENGER': return 'text-amber-300';
    default: return 'text-gray-500';
  }
}

function getTierChineseName(tier: string): string {
  const map: Record<string, string> = {
    'CHALLENGER': '最强王者',
    'GRANDMASTER': '傲世宗师',
    'MASTER': '超凡大师',
    'DIAMOND': '璀璨钻石',
    'EMERALD': '流光翡翠',
    'PLATINUM': '华贵铂金',
    'GOLD': '荣耀黄金',
    'SILVER': '不屈白银',
    'BRONZE': '英勇黄铜',
    'IRON': '坚韧黑铁',
    'UNRANKED': '无段位',
  };
  return map[tier.toUpperCase()] || '无段位';
}

function formatTierShort(tier: string, rank: string): string {
  if (tier === 'UNRANKED') return 'Unranked';
  const tName = tier.charAt(0) + tier.slice(1).toLowerCase();
  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) return tName;
  return `${tName} ${rank}`;
}

interface MatchRankData {
  ranks: Record<string, PlayerRankInfo>;
  averageRank: string;
  loading: boolean;
}

// ── Match Detail Expanded Panel ──
function MatchDetailPanel({
  match, patch, currentPuuid, rankData
}: {
  match: EnrichedMatchData;
  patch: string;
  currentPuuid?: string;
  rankData?: MatchRankData;
}) {
  const blueTeam = match.allParticipants.filter(p => p.teamId === 100);
  const redTeam = match.allParticipants.filter(p => p.teamId === 200);
  const blueWon = blueTeam[0]?.win ?? false;
  const maxDamage = Math.max(...match.allParticipants.map(p => p.totalDamageDealtToChampions), 1);

  const renderTeamTable = (team: EnrichedParticipant[], teamLabel: string, won: boolean) => (
    <div className="w-full">
      <div className={cn(
        "flex items-center justify-between px-4 py-2 rounded-t-lg text-sm font-bold",
        won ? "bg-blue-900/40 text-blue-300" : "bg-red-900/40 text-red-300"
      )}>
        <span>{won ? '胜利' : '败北'} ({teamLabel})</span>
        <div className="flex items-center gap-6 text-xs text-gray-400 font-normal font-mono shrink-0">
          <span className="w-14 text-center shrink-0">段位</span>
          <span className="w-16 text-center shrink-0">KDA</span>
          <span className="w-16 text-center shrink-0">伤害</span>
          <span className="w-12 text-center shrink-0">CS</span>
          <span className="w-12 text-center shrink-0">视野</span>
          <span className="w-[190px] text-center font-sans shrink-0">装备</span>
        </div>
      </div>
      <div className={cn(
        "border-x border-b rounded-b-lg overflow-hidden",
        won ? "border-blue-900/30" : "border-red-900/30"
      )}>
        {team.map((p, idx) => {
          const isMe = currentPuuid ? p.puuid === currentPuuid : false;
          const pRank = rankData?.ranks[p.puuid];
          return (
            <div key={p.puuid + idx} className={cn(
              "flex items-center justify-between px-4 py-2.5 transition-colors",
              isMe ? (won ? "bg-blue-900/25" : "bg-red-900/25") : "bg-gray-900/50",
              idx < team.length - 1 && "border-b border-gray-800/50"
            )}>
              <div className="flex items-center gap-2 min-w-[170px] shrink-0">
                <div className="relative w-8 h-8 rounded-md overflow-hidden border border-gray-700 shrink-0">
                  <img
                    crossOrigin="anonymous"
                    src={`https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${p.championName}.png`}
                    alt={p.championName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                    }}
                  />
                  <span className="absolute bottom-0 right-0 text-[9px] bg-black/80 px-0.5 font-bold leading-tight">{p.champLevel}</span>
                </div>
                <div className="flex flex-col gap-0.5 shrink-0">
                  <img crossOrigin="anonymous" src={getSummonerSpellUrl(p.summoner1Id, patch)} alt="" className="w-4 h-4 rounded-sm" />
                  <img crossOrigin="anonymous" src={getSummonerSpellUrl(p.summoner2Id, patch)} alt="" className="w-4 h-4 rounded-sm" />
                </div>
                <span className={cn(
                  "text-xs truncate max-w-[95px] shrink-0",
                  isMe ? "text-white font-bold" : "text-gray-300"
                )}>
                  {p.playerName || p.championName}
                </span>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="w-14 text-center shrink-0">
                  {rankData?.loading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-gray-500 mx-auto" />
                  ) : pRank ? (
                    <span className={cn("text-[10px] font-bold", getTierColor(pRank.tier))}>
                      {formatTierShort(pRank.tier, pRank.rank)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-600">-</span>
                  )}
                </div>
                <div className="w-16 text-center shrink-0">
                  <span className="text-xs text-gray-200 font-mono">
                    {p.kills}/{p.deaths}/{p.assists}
                  </span>
                  <div className="text-[10px] text-gray-500 font-mono">{formatKDA(p.kills, p.deaths, p.assists)}</div>
                </div>
                <div className="w-16 shrink-0">
                  <div className="text-xs text-center text-gray-300 font-mono">{(p.totalDamageDealtToChampions / 1000).toFixed(1)}k</div>
                  <div className="w-full h-1 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", won ? "bg-blue-500" : "bg-red-500")}
                      style={{ width: `${(p.totalDamageDealtToChampions / maxDamage) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 text-center shrink-0">
                  <div className="text-xs text-gray-300 font-mono">{p.cs}</div>
                  <div className="text-[10px] text-gray-550 font-mono">{p.csPerMin}/分</div>
                </div>
                <div className="w-12 text-center text-xs text-gray-400 font-mono shrink-0">
                  {p.visionScore}
                </div>
                <div className="flex gap-0.5 w-[190px] justify-center shrink-0">
                  {p.items.slice(0, 6).map((itemId, i) => (
                    <div key={i} className="w-6 h-6 rounded-sm overflow-hidden bg-gray-800 border border-gray-700/50 shrink-0">
                      {itemId > 0 ? (
                        <img
                          crossOrigin="anonymous"
                          src={`https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${itemId}.png`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                  ))}
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 border border-gray-700/50 ml-1 shrink-0">
                    {(p.items[6] || 0) > 0 ? (
                      <img
                        crossOrigin="anonymous"
                        src={`https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${p.items[6]}.png`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="px-2 sm:px-4 py-4 space-y-4 bg-gray-950/80 border-t border-gray-800/50">
        {rankData && !rankData.loading && rankData.averageRank !== 'UNRANKED' && (
          <div className="flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg bg-gray-800/50 border border-gray-700/50 max-w-sm mx-auto">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs text-gray-400">平均段位</span>
            <span className="text-xs font-bold text-gray-200">{rankData.averageRank}</span>
          </div>
        )}
        {rankData?.loading && (
          <div className="flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg bg-gray-800/50 border border-gray-700/50 max-w-xs mx-auto">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">加载段位信息...</span>
          </div>
        )}
        <div className="w-full overflow-x-auto select-none pb-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="min-w-[800px] space-y-4">
            {renderTeamTable(blueTeam, '蓝队', blueWon)}
            {renderTeamTable(redTeam, '红队', !blueWon)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main MatchHistory Component ──
export function MatchHistory({ profile, server }: { profile: SummonerProfileData; server: string }) {
  const latestPatch = profile.latestPatch || '16.13.1';
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [rankCache, setRankCache] = useState<Record<string, MatchRankData>>({});
  const [showAllTeammates, setShowAllTeammates] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SOLO' | 'FLEX' | 'ARAM'>('ALL');

  // State to manage loaded matches and load-more pagination
  const [matches, setMatches] = useState<EnrichedMatchData[]>(profile.recentMatches);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(profile.recentMatches.length >= 20);

  const currentProfileId = `${profile.gameName}#${profile.tagLine}`;
  const [prevProfileId, setPrevProfileId] = useState(currentProfileId);

  // Synchronously reset local matches list when the searched summoner profile changes
  if (currentProfileId !== prevProfileId) {
    setMatches(profile.recentMatches);
    setHasMore(profile.recentMatches.length >= 20);
    setPrevProfileId(currentProfileId);
    setExpandedMatch(null);
  }

  const currentPuuid = profile.recentMatches[0]?.allParticipants.find(p =>
    p.playerName === profile.gameName
  )?.puuid;

  const handleLoadMore = async () => {
    if (isLoadingMore || !currentPuuid) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch('/api/more-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puuid: currentPuuid,
          server,
          start: matches.length,
          count: 20,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newMatches = data.matches as EnrichedMatchData[];
        if (newMatches && newMatches.length > 0) {
          setMatches(prev => [...prev, ...newMatches]);
          if (newMatches.length < 20) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } else {
        console.error('Failed to load more matches');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (activeTab === 'SOLO') return m.queueName === '单排/双排';
      if (activeTab === 'FLEX') return m.queueName === '灵活组排';
      if (activeTab === 'ARAM') return m.queueName === '极地大乱斗';
      return true;
    });
  }, [matches, activeTab]);

  const summaryStats = useMemo(() => {
    const list = filteredMatches;
    const totalGames = list.length;
    if (totalGames === 0) return null;

    let wins = 0;
    let kills = 0;
    let deaths = 0;
    let assists = 0;
    let totalKpSum = 0;

    const champGroups: Record<string, { wins: number; losses: number; kills: number; deaths: number; assists: number; games: number }> = {};
    const posCounts: Record<string, number> = { TOP: 0, JUNGLE: 0, MIDDLE: 0, BOTTOM: 0, UTILITY: 0 };

    list.forEach(m => {
      if (m.win) wins++;
      kills += m.kills;
      deaths += m.deaths;
      assists += m.assists;
      totalKpSum += m.killParticipation;

      if (!champGroups[m.championName]) {
        champGroups[m.championName] = { wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, games: 0 };
      }
      const cg = champGroups[m.championName];
      cg.games++;
      if (m.win) cg.wins++;
      else cg.losses++;
      cg.kills += m.kills;
      cg.deaths += m.deaths;
      cg.assists += m.assists;

      if (m.teamPosition && posCounts[m.teamPosition.toUpperCase()] !== undefined) {
        posCounts[m.teamPosition.toUpperCase()]++;
      }
    });

    const winRate = Math.round((wins / totalGames) * 100);
    const avgKills = (kills / totalGames).toFixed(1);
    const avgDeaths = (deaths / totalGames).toFixed(1);
    const avgAssists = (assists / totalGames).toFixed(1);
    const kdaRatio = formatKDA(kills, deaths, assists);
    const avgKp = Math.round((totalKpSum / totalGames) * 100);

    const topChamps = Object.entries(champGroups)
      .map(([name, data]) => ({
        name,
        ...data,
        winRate: Math.round((data.wins / data.games) * 100),
        kda: formatKDA(data.kills, data.deaths, data.assists)
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 3);

    return {
      totalGames,
      wins,
      losses: totalGames - wins,
      winRate,
      avgKills,
      avgDeaths,
      avgAssists,
      kdaRatio,
      avgKp,
      topChamps,
      posCounts
    };
  }, [filteredMatches]);

  const teammateStats = useMemo(() => {
    const teammates: Record<string, { playerName: string; playerTag: string; summonerLevel: number; lastChampion: string; wins: number; losses: number; games: number }> = {};
    
    matches.forEach(m => {
      const myParticipant = m.allParticipants.find(p => p.puuid === currentPuuid);
      if (!myParticipant) return;
      const myTeamId = myParticipant.teamId;
      
      m.allParticipants.forEach(p => {
        if (p.puuid === currentPuuid || p.teamId !== myTeamId) return;
        
        const key = `${p.playerName}#${p.playerTag}`;
        if (!teammates[key]) {
          teammates[key] = {
            playerName: p.playerName,
            playerTag: p.playerTag,
            summonerLevel: p.summonerLevel,
            lastChampion: p.championName,
            wins: 0,
            losses: 0,
            games: 0
          };
        }
        
        const t = teammates[key];
        t.games++;
        if (m.win) t.wins++;
        else t.losses++;
        t.summonerLevel = Math.max(t.summonerLevel, p.summonerLevel);
        t.lastChampion = p.championName;
      });
    });

    return Object.values(teammates)
      .map(t => ({
        ...t,
        winRate: Math.round((t.wins / t.games) * 100)
      }))
      .filter(t => t.games >= 2)
      .sort((a, b) => {
        if (b.games !== a.games) return b.games - a.games;
        return b.winRate - a.winRate;
      });
  }, [matches, currentPuuid]);

  const displayedTeammates = useMemo(() => {
    return showAllTeammates ? teammateStats.slice(0, 10) : teammateStats.slice(0, 5);
  }, [teammateStats, showAllTeammates]);

  const fetchRanksForMatch = useCallback(async (match: EnrichedMatchData) => {
    if (rankCache[match.matchId] && !rankCache[match.matchId].loading) return;

    setRankCache(prev => ({
      ...prev,
      [match.matchId]: { ranks: {}, averageRank: '', loading: true },
    }));

    try {
      const puuids = match.allParticipants.map(p => p.puuid);
      const res = await fetch('/api/match-ranks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puuids, server }),
      });

      if (res.ok) {
        const data = await res.json();
        const ranksMap: Record<string, PlayerRankInfo> = {};
        (data.ranks as PlayerRankInfo[]).forEach(r => {
          ranksMap[r.puuid] = r;
        });
        setRankCache(prev => ({
          ...prev,
          [match.matchId]: {
            ranks: ranksMap,
            averageRank: data.averageRank || '',
            loading: false,
          },
        }));
      } else {
        setRankCache(prev => ({
          ...prev,
          [match.matchId]: { ranks: {}, averageRank: '', loading: false },
        }));
      }
    } catch {
      setRankCache(prev => ({
        ...prev,
        [match.matchId]: { ranks: {}, averageRank: '', loading: false },
      }));
    }
  }, [rankCache, server]);

  const handleToggleMatch = useCallback((match: EnrichedMatchData) => {
    const isCurrentlyExpanded = expandedMatch === match.matchId;
    if (isCurrentlyExpanded) {
      setExpandedMatch(null);
    } else {
      setExpandedMatch(match.matchId);
      if (!rankCache[match.matchId]) {
        fetchRanksForMatch(match);
      }
    }
  }, [expandedMatch, rankCache, fetchRanksForMatch]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 select-none px-1 sm:px-2">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy className="w-32 h-32 text-yellow-500" />
        </div>

        <div className="relative w-24 h-24 rounded-full border-2 border-blue-500 overflow-hidden shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
           <img
             crossOrigin="anonymous"
             src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/profileicon/${profile.profileIconId || 1}.png`}
             alt="Profile Icon"
             className="w-full h-full object-cover"
             onError={(e) => {
               (e.target as HTMLImageElement).src = `https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/profileicon/1.png`;
             }}
           />
           <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-xs font-bold py-1">
             Lv {profile.summonerLevel}
           </div>
        </div>

        <div className="flex-1 text-center md:text-left z-10">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {profile.gameName} <span className="text-gray-500 text-xl font-normal">#{profile.tagLine}</span>
          </h2>
          <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1.5 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-500"/> 
              {profile.tier} {profile.rank} {profile.leaguePoints > 0 ? `(${profile.leaguePoints} LP)` : ''}
            </span>
            <span className="flex items-center gap-1"><Target className="w-4 h-4 text-blue-400"/> {profile.wins}胜 {profile.losses}负</span>
            <span className="flex items-center gap-1"><Swords className="w-4 h-4 text-red-400"/> 胜率 {profile.winRate}%</span>
          </div>
          
          {profile.ladderRank && profile.ladderPercent !== 'N/A' && (
            <div className="mt-2 text-xs text-gray-400 font-medium flex items-center justify-center md:justify-start gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></span>
              <span>{server.toUpperCase()} | 阶梯排名 <span className="text-blue-400 font-bold">{profile.ladderRank}</span> ({profile.ladderPercent} 占前几名)</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile/Tablet Only Rank Cards (below Header, above Tabs) ── */}
      <div className="block xl:hidden bg-gray-900/70 border border-gray-800 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h4 className="text-sm font-bold text-gray-200">排位赛段位</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Solo Queue Rank Card */}
          <div className="flex items-center gap-3.5 p-3 bg-gray-950/40 rounded-lg border border-gray-800/40 hover:border-gray-700/40 transition-colors">
            <div className="w-12 h-12 bg-blue-900/10 rounded-full flex items-center justify-center border border-blue-500/20 shrink-0">
              <Trophy className={cn("w-6 h-6", getTierColor(profile.tier))} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-500 font-bold">单双排位</div>
              <div className="text-sm font-black text-gray-100 flex flex-wrap items-center gap-1">
                <span>{getTierChineseName(profile.tier)} {profile.rank}</span>
                {profile.leaguePoints > 0 && <span className="text-[10px] text-gray-400 font-normal">({profile.leaguePoints} LP)</span>}
              </div>
              {profile.tier !== 'UNRANKED' ? (
                <div className="text-[10px] text-gray-450 mt-0.5">
                  {profile.wins}胜 {profile.losses}负 ({profile.winRate}% 胜率)
                </div>
              ) : (
                <div className="text-[10px] text-gray-500 mt-0.5">暂无单双排位战绩</div>
              )}
            </div>
          </div>

          {/* Flex Queue Rank Card */}
          <div className="flex items-center gap-3.5 p-3 bg-gray-950/40 rounded-lg border border-gray-800/40 hover:border-gray-700/40 transition-colors">
            <div className="w-12 h-12 bg-purple-900/10 rounded-full flex items-center justify-center border border-purple-500/20 shrink-0">
              <Trophy className={cn("w-6 h-6", getTierColor(profile.flexTier))} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-500 font-bold">灵活组排</div>
              <div className="text-sm font-black text-gray-100 flex flex-wrap items-center gap-1">
                <span>{getTierChineseName(profile.flexTier)} {profile.flexRank}</span>
                {profile.flexLP > 0 && <span className="text-[10px] text-gray-400 font-normal">({profile.flexLP} LP)</span>}
              </div>
              {profile.flexTier !== 'UNRANKED' ? (
                <div className="text-[10px] text-gray-450 mt-0.5">
                  {profile.flexWins}胜 {profile.flexLosses}负 ({Math.round((profile.flexWins / (profile.flexWins + profile.flexLosses)) * 100)}% 胜率)
                </div>
              ) : (
                <div className="text-[10px] text-gray-500 mt-0.5">暂无灵活排位战绩</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Game Mode Tab Filters ── */}
      <div className="flex border-b border-gray-800 gap-1 overflow-x-auto pb-px">
        {[
          { id: 'ALL', label: '全部' },
          { id: 'SOLO', label: '单双排位' },
          { id: 'FLEX', label: '灵活排位' },
          { id: 'ARAM', label: '极地大乱斗' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setExpandedMatch(null);
            }}
            className={cn(
              "px-5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all duration-200",
              activeTab === tab.id
                ? "border-blue-500 text-blue-400 bg-blue-500/5"
                : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-850/40"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OP.GG Layout Grid - Responsive columns at different width levels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Sidebar (Rank Cards & Teammates) - Stacks on mobile/tablet below matches */}
        <div className="xl:col-span-4 space-y-4 w-full order-2 xl:order-1">
          
          {/* Rank Cards (Solo & Flex) */}
          <div className="hidden xl:block bg-gray-900/70 border border-gray-800 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <h4 className="text-sm font-bold text-gray-200">排位赛段位</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
              {/* Solo Queue Rank Card */}
              <div className="flex items-center gap-3.5 p-3 bg-gray-950/40 rounded-lg border border-gray-800/40 hover:border-gray-700/40 transition-colors">
                <div className="w-12 h-12 bg-blue-900/10 rounded-full flex items-center justify-center border border-blue-500/20 shrink-0">
                  <Trophy className={cn("w-6 h-6", getTierColor(profile.tier))} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-500 font-bold">单双排位</div>
                  <div className="text-sm font-black text-gray-100 flex flex-wrap items-center gap-1">
                    <span>{getTierChineseName(profile.tier)} {profile.rank}</span>
                    {profile.leaguePoints > 0 && <span className="text-[10px] text-gray-400 font-normal">({profile.leaguePoints} LP)</span>}
                  </div>
                  {profile.tier !== 'UNRANKED' ? (
                    <div className="text-[10px] text-gray-450 mt-0.5">
                      {profile.wins}胜 {profile.losses}负 ({profile.winRate}% 胜率)
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-500 mt-0.5">暂无单双排位战绩</div>
                  )}
                </div>
              </div>

              {/* Flex Queue Rank Card */}
              <div className="flex items-center gap-3.5 p-3 bg-gray-950/40 rounded-lg border border-gray-800/40 hover:border-gray-700/40 transition-colors">
                <div className="w-12 h-12 bg-purple-900/10 rounded-full flex items-center justify-center border border-purple-500/20 shrink-0">
                  <Trophy className={cn("w-6 h-6", getTierColor(profile.flexTier))} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-500 font-bold">灵活组排</div>
                  <div className="text-sm font-black text-gray-100 flex flex-wrap items-center gap-1">
                    <span>{getTierChineseName(profile.flexTier)} {profile.flexRank}</span>
                    {profile.flexLP > 0 && <span className="text-[10px] text-gray-400 font-normal">({profile.flexLP} LP)</span>}
                  </div>
                  {profile.flexTier !== 'UNRANKED' ? (
                    <div className="text-[10px] text-gray-450 mt-0.5">
                      {profile.flexWins}胜 {profile.flexLosses}负 ({Math.round((profile.flexWins / (profile.flexWins + profile.flexLosses)) * 100)}% 胜率)
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-500 mt-0.5">暂无灵活排位战绩</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Teammates Sidebar Card */}
          <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4 w-full">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                经常同队 (合作 2 次及以上)
              </h4>
              <span className="text-[10px] text-gray-500 font-bold">{teammateStats.length} 个队友</span>
            </div>

            <div className="divide-y divide-gray-800/60 max-h-[480px] overflow-y-auto pr-1">
              {displayedTeammates.map((t) => (
                <div key={`${t.playerName}#${t.playerTag}`} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative w-8 h-8 rounded-md overflow-hidden bg-gray-800 border border-gray-700/60 shrink-0">
                      <img
                        crossOrigin="anonymous"
                        src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${t.lastChampion}.png`}
                        alt={t.lastChampion}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-200 truncate max-w-[110px] sm:max-w-[145px]" title={`${t.playerName}#${t.playerTag}`}>
                        {t.playerName} <span className="text-[9px] text-gray-500">#{t.playerTag}</span>
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5">等级 {t.summonerLevel}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 px-2 font-mono">
                    <div className="text-xs font-medium text-gray-300">
                      <span className="text-blue-400 font-bold">{t.wins}胜</span> / <span className="text-red-400 font-bold">{t.losses}败</span>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">{t.games} 场对局</div>
                  </div>

                  <div className="shrink-0 text-right min-w-[45px]">
                    <span className={cn(
                      "text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md",
                      t.winRate >= 70 ? "bg-red-950/40 text-red-400 border border-red-900/30" :
                        t.winRate >= 50 ? "bg-blue-950/40 text-blue-400 border border-blue-900/30" :
                          "bg-gray-800 text-gray-400"
                    )}>
                      {t.winRate}%
                    </span>
                  </div>
                </div>
              ))}

              {teammateStats.length === 0 && (
                <div className="text-xs text-gray-500 text-center py-8">
                  最近 10 场对局中没有同队合作过 2 次及以上的队友
                </div>
              )}
            </div>

            {teammateStats.length > 5 && (
              <button
                onClick={() => setShowAllTeammates(!showAllTeammates)}
                className="w-full text-center text-xs font-bold py-2 bg-gray-800/40 hover:bg-gray-800/80 border border-gray-800/50 rounded-lg text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-1 mt-2"
              >
                <span>{showAllTeammates ? '折叠' : '展开前10个队友'}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAllTeammates && "rotate-180")} />
              </button>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Matches Summary & List - Stacks at the top on mobile/tablet */}
        <div className="xl:col-span-8 space-y-4 w-full min-w-0 order-1 xl:order-2">
          
          {/* Recent Matches Summary Bar */}
          {summaryStats ? (
            <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shadow-lg backdrop-blur-sm">
              
              {/* Donut Chart */}
              <div className="flex items-center gap-4 justify-center sm:justify-start">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-red-600/20"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-500"
                      strokeDasharray={`${summaryStats.winRate}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-gray-100">{summaryStats.winRate}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-bold">{summaryStats.totalGames}场比赛</div>
                  <div className="text-xs text-gray-300 mt-0.5 whitespace-nowrap">
                    <span className="text-blue-400 font-bold">{summaryStats.wins}胜</span> / <span className="text-red-400 font-bold">{summaryStats.losses}败</span>
                  </div>
                </div>
              </div>

              {/* KDA Summary */}
              <div className="flex flex-col items-center sm:items-start justify-center">
                <div className="text-sm font-semibold text-gray-300 tracking-wide font-mono">
                  {summaryStats.avgKills} / <span className="text-red-400">{summaryStats.avgDeaths}</span> / {summaryStats.avgAssists}
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-black text-gray-100 font-mono">{summaryStats.kdaRatio}:1</span>
                  <span className="text-[9px] text-gray-400 ml-1">KDA</span>
                </div>
                <div className="text-[10px] text-red-400/80 font-bold mt-0.5">
                  击杀参与率 {summaryStats.avgKp}%
                </div>
              </div>

              {/* Top 3 Played Champions */}
              <div className="flex flex-col gap-1.5 justify-center">
                <div className="text-[10px] text-gray-400 font-bold border-b border-gray-800 pb-1">最近高频英雄</div>
                <div className="space-y-1.5">
                  {summaryStats.topChamps.map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          crossOrigin="anonymous"
                          src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${c.name}.png`}
                          alt={c.name}
                          className="w-4.5 h-4.5 rounded object-cover shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                          }}
                        />
                        <span className={cn(
                          "font-bold shrink-0",
                          c.winRate >= 70 ? "text-red-400" : c.winRate >= 50 ? "text-gray-200" : "text-gray-400"
                        )}>
                          {c.winRate}%
                        </span>
                        <span className="text-gray-500 font-normal truncate text-[9px] sm:inline hidden">({c.wins}胜{c.losses}败)</span>
                      </div>
                      <span className="text-gray-400 font-mono text-[10px] font-semibold shrink-0">{c.kda} KDA</span>
                    </div>
                  ))}
                  {summaryStats.topChamps.length === 0 && (
                    <div className="text-xs text-gray-500 text-center py-2">无英雄数据</div>
                  )}
                </div>
              </div>

              {/* Preferred Roles Chart */}
              <div className="flex flex-col gap-1.5 justify-center items-center sm:items-start">
                <div className="text-[10px] text-gray-400 font-bold border-b border-gray-800 pb-1 w-full text-center sm:text-left">常用位置</div>
                <div className="flex items-end justify-center sm:justify-start gap-2 h-10 w-full">
                  {Object.entries({
                    TOP: '上', JUNGLE: '打', MIDDLE: '中', BOTTOM: '下', UTILITY: '辅'
                  }).map(([roleKey, label]) => {
                    const count = summaryStats.posCounts[roleKey] || 0;
                    const percent = summaryStats.totalGames > 0 ? (count / summaryStats.totalGames) * 100 : 0;
                    return (
                      <div key={roleKey} className="flex flex-col items-center group relative cursor-help flex-1 max-w-[32px]">
                        <div className="w-2 sm:w-3 h-8 bg-gray-800 rounded-sm relative overflow-hidden flex items-end">
                          <div
                            className="w-full bg-blue-500 rounded-sm transition-all duration-500"
                            style={{ height: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-gray-500 mt-1 font-bold">{label}</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-gray-950 border border-gray-800 text-[8px] text-gray-200 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                          {count}场 ({Math.round(percent)}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-8 text-center text-gray-500 text-sm">
              此分类下近 10 场没有相关的比赛记录
            </div>
          )}

          {/* Matches List */}
          <div className="space-y-2">
            {filteredMatches.map((match) => {
              const isExpanded = expandedMatch === match.matchId;
              const kda = formatKDA(match.kills, match.deaths, match.assists);
              const kpPercent = Math.round(match.killParticipation * 100);
              const matchRankData = rankCache[match.matchId];

              return (
                <div
                  key={match.matchId}
                  className={cn(
                    "rounded-xl border overflow-hidden transition-all duration-200 relative",
                    match.win
                      ? "bg-blue-950/20 border-blue-900/40 shadow-[inset_4px_0_0_rgba(59,130,246,0.6)]"
                      : "bg-red-950/20 border-red-900/40 shadow-[inset_4px_0_0_rgba(239,68,68,0.6)]"
                  )}
                >
                  {/* ──────────────────────────────────────────────────────── */}
                  {/* 1. DESKTOP ONLY COLLAPSED CARD (sm and up)              */}
                  {/* ──────────────────────────────────────────────────────── */}
                  <div
                    className={cn(
                      "hidden sm:flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-gray-900/20 transition-all duration-150 select-none"
                    )}
                    onClick={() => handleToggleMatch(match)}
                  >
                    {/* Game mode + outcome */}
                    <div className="flex flex-col items-start gap-0.5 min-w-[70px] shrink-0">
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded border leading-tight",
                        getQueueStyle(match.queueName)
                      )}>
                        {match.queueName}
                      </span>
                      <span className={cn(
                        "text-xs font-bold sm:text-sm",
                        match.win ? "text-blue-400" : "text-red-400"
                      )}>
                        {match.win ? '胜利' : '失败'}
                      </span>
                      <div className="text-[9px] text-gray-500 leading-none mt-0.5">
                        {Math.floor(match.gameDuration / 60)}分{(match.gameDuration % 60).toString().padStart(2, '0')}秒
                      </div>
                    </div>

                    {/* Champion + Spells + Runes */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-gray-700">
                        <img
                          crossOrigin="anonymous"
                          src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${match.championName}.png`}
                          alt={match.championName}
                          className="w-full h-full object-cover transform scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                          }}
                        />
                        <span className="absolute bottom-0 right-0 text-[8px] bg-black/80 px-0.5 font-bold leading-tight rounded-tl">{match.champLevel}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <img crossOrigin="anonymous" src={getSummonerSpellUrl(match.summoner1Id, latestPatch)} alt="" className="w-4.5 h-4.5 rounded-sm" />
                        <img crossOrigin="anonymous" src={getSummonerSpellUrl(match.summoner2Id, latestPatch)} alt="" className="w-4.5 h-4.5 rounded-sm" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <img
                          crossOrigin="anonymous"
                          src={getRuneIconUrl(match.primaryRuneId, true)}
                          alt=""
                          className="w-4.5 h-4.5 rounded-full bg-gray-900"
                        />
                        <img
                          crossOrigin="anonymous"
                          src={getRuneIconUrl(match.subStyleId, false)}
                          alt=""
                          className="w-4.5 h-4.5 rounded-full bg-gray-900 opacity-70"
                        />
                      </div>
                    </div>

                    {/* KDA block */}
                    <div className="flex flex-col items-center min-w-[95px] shrink-0">
                      <span className="text-gray-100 font-bold text-sm sm:text-base tracking-wider font-mono">
                        {match.kills} / <span className="text-red-400">{match.deaths}</span> / {match.assists}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn(
                          "text-[10px] sm:text-xs font-bold",
                          kda === 'Perfect' ? 'text-yellow-400' :
                            parseFloat(kda) >= 5 ? 'text-orange-400' :
                              parseFloat(kda) >= 3 ? 'text-green-400' : 'text-gray-400'
                        )}>
                          {kda} KDA
                        </span>
                        <span className="text-[9px] text-gray-500 font-sans">({kpPercent}%)</span>
                      </div>
                    </div>

                    {/* CS & Vision */}
                    <div className="flex flex-col items-center min-w-[55px] shrink-0">
                      <span className="text-xs text-gray-300 font-mono">CS {match.cs}</span>
                      <span className="text-[9px] text-gray-500">{match.csPerMin}/分</span>
                      <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-gray-500">
                        <Eye className="w-2.5 h-2.5" />
                        <span>{match.visionScore}</span>
                      </div>
                    </div>

                    {/* Items row */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {match.items.slice(0, 6).map((itemId, i) => (
                        <div key={i} className="w-6.5 h-6.5 rounded-sm overflow-hidden bg-gray-800/80 border border-gray-700/50">
                          {itemId > 0 ? (
                            <img
                              crossOrigin="anonymous"
                              src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/item/${itemId}.png`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                      ))}
                      <div className="w-6.5 h-6.5 rounded-full overflow-hidden bg-gray-800/80 border border-gray-700/50 ml-0.5">
                        {(match.items[6] || 0) > 0 ? (
                          <img
                            crossOrigin="anonymous"
                            src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/item/${match.items[6]}.png`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                    </div>

                    {/* Badges, Time and Arrow */}
                    <div className="flex items-center gap-2 shrink-0">
                      {match.multikill && (
                        <span className={cn(
                          "text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm leading-none",
                          getMultikillStyle(match.multikill)
                        )}>
                          {match.multikill}
                        </span>
                      )}
                      {match.isMVP && (
                        <span className="flex items-center gap-0.5 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 leading-none">
                          MVP
                        </span>
                      )}
                      
                      <span className="text-[9px] text-gray-500 shrink-0 ml-1">
                        {getRelativeTime(match.gameCreation)}
                      </span>
                      
                      {/* Premium expand button visual indicator */}
                      <div className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-md border transition-colors",
                        match.win 
                          ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/25" 
                          : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/25"
                      )}>
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform duration-250",
                          isExpanded && "rotate-180"
                        )} />
                      </div>
                    </div>
                  </div>

                  {/* ──────────────────────────────────────────────────────── */}
                  {/* 2. MOBILE ONLY NATIVE-LIKE MATCH CARD (below sm)        */}
                  {/* ──────────────────────────────────────────────────────── */}
                  <div
                    className="flex sm:hidden flex-col p-3.5 cursor-pointer select-none"
                    onClick={() => handleToggleMatch(match)}
                  >
                    {/* Top Row: outcome, duration, mode, time, expand chevron */}
                    <div className="flex items-center justify-between border-b border-gray-800/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-black",
                          match.win ? "text-blue-400" : "text-red-400"
                        )}>
                          {match.win ? '胜利' : '败北'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {Math.floor(match.gameDuration / 60)}分{(match.gameDuration % 60).toString().padStart(2, '0')}秒
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-400 font-bold bg-gray-800/50 px-1 py-0.5 rounded leading-none">
                          {match.queueName}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          {getRelativeTime(match.gameCreation)}
                        </span>
                        {/* Down Chevron Box exactly like screenshot */}
                        <div className={cn(
                          "w-6 h-6 flex items-center justify-center rounded border shrink-0",
                          match.win
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        )}>
                          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                        </div>
                      </div>
                    </div>

                    {/* Main Content Area: grid layout with Champion, KDA + Stats, and Item 3x2 grid */}
                    <div className="grid grid-cols-12 gap-3 mt-3 items-center">
                      
                      {/* Left: Champ, Spells & Runes (col-span-4) */}
                      <div className="col-span-4 flex items-center gap-2 shrink-0">
                        {/* Champ Icon */}
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                          <img
                            crossOrigin="anonymous"
                            src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${match.championName}.png`}
                            alt={match.championName}
                            className="w-full h-full object-cover transform scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                            }}
                          />
                          <span className="absolute bottom-0 right-0 text-[8px] bg-black/80 px-0.5 font-bold leading-tight rounded-tl">{match.champLevel}</span>
                        </div>
                        {/* Spells & Runes stack */}
                        <div className="flex gap-1 shrink-0">
                          <div className="flex flex-col gap-0.5">
                            <img crossOrigin="anonymous" src={getSummonerSpellUrl(match.summoner1Id, latestPatch)} alt="" className="w-4 h-4 rounded-sm" />
                            <img crossOrigin="anonymous" src={getSummonerSpellUrl(match.summoner2Id, latestPatch)} alt="" className="w-4 h-4 rounded-sm" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <img crossOrigin="anonymous" src={getRuneIconUrl(match.primaryRuneId, true)} alt="" className="w-4 h-4 rounded-full bg-gray-900" />
                            <img crossOrigin="anonymous" src={getRuneIconUrl(match.subStyleId, false)} alt="" className="w-4 h-4 rounded-full bg-gray-900 opacity-60" />
                          </div>
                        </div>
                      </div>

                      {/* Center: KDA & Stats details (col-span-4) */}
                      <div className="col-span-4 flex flex-col justify-center min-w-0">
                        <div className="text-xs font-bold text-gray-100 font-mono truncate">
                          {match.kills} / <span className="text-red-400">{match.deaths}</span> / {match.assists}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold font-mono mt-0.5">
                          {kda}:1 <span className="text-[8px] text-gray-500 font-normal">KDA</span>
                        </div>
                        <div className="text-[8px] text-gray-500 mt-0.5 leading-none">
                          CS {match.cs} | KP {kpPercent}%
                        </div>
                      </div>

                      {/* Right: Items 3x2 Grid (col-span-4) */}
                      <div className="col-span-4 flex items-center gap-1 justify-end shrink-0">
                        <div className="grid grid-cols-3 gap-0.5 shrink-0">
                          {match.items.slice(0, 6).map((itemId, i) => (
                            <div key={i} className="w-4.5 h-4.5 rounded-sm overflow-hidden bg-gray-800 border border-gray-700/50">
                              {itemId > 0 ? (
                                <img
                                  crossOrigin="anonymous"
                                  src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/item/${itemId}.png`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : null}
                            </div>
                          ))}
                        </div>
                        {/* Trinket & Badge (MVP) */}
                        <div className="flex flex-col gap-1 items-center shrink-0">
                          <div className="w-4.5 h-4.5 rounded-full overflow-hidden bg-gray-800 border border-gray-700/50">
                            {(match.items[6] || 0) > 0 ? (
                              <img
                                crossOrigin="anonymous"
                                src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/item/${match.items[6]}.png`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          {match.isMVP && (
                            <span className="text-[7px] font-black px-1 py-0 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 transform scale-90 leading-none">
                              MVP
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <MatchDetailPanel
                        match={match}
                        patch={latestPatch}
                        currentPuuid={currentPuuid}
                        rankData={matchRankData}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Load More Matches Button */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full text-center text-xs sm:text-sm font-black py-3 bg-gray-900/60 hover:bg-gray-800/80 border border-gray-850/50 rounded-xl text-blue-400 hover:text-blue-300 transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer shadow-md"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在加载更多历史对局...</span>
                  </>
                ) : (
                  <span>展示更多对局 (+20场)</span>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
