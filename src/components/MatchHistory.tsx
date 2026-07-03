'use client';

import { useState, useCallback } from 'react';
import { SummonerProfileData, EnrichedMatchData, EnrichedParticipant, PlayerRankInfo } from '@/lib/riot';
import { cn } from '@/lib/utils';
import { Trophy, Swords, Shield, Target, ChevronDown, Eye, Crosshair, Star, Loader2 } from 'lucide-react';
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

// ── Rune style ID → icon path mapping (Data Dragon CDN) ──
const RUNE_STYLE_ICONS: Record<number, string> = {
  8000: 'perk-images/Styles/7201_Precision.png',
  8100: 'perk-images/Styles/7200_Domination.png',
  8200: 'perk-images/Styles/7202_Sorcery.png',
  8300: 'perk-images/Styles/7203_Whimsy.png',
  8400: 'perk-images/Styles/7204_Resolve.png',
};

// ── Some common keystone rune ID → icon path ──
const KEYSTONE_ICONS: Record<number, string> = {
  // Precision
  8005: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
  8008: 'perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png',
  8010: 'perk-images/Styles/Precision/Conqueror/Conqueror.png',
  8021: 'perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png',
  // Domination
  8112: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
  8124: 'perk-images/Styles/Domination/Predator/Predator.png',
  8128: 'perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png',
  9923: 'perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png',
  // Sorcery
  8214: 'perk-images/Styles/Sorcery/SummonAery/SummonAery.png',
  8229: 'perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png',
  8230: 'perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png',
  // Resolve
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

// ── Queue type color/style ──
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

// ── Multikill badge color ──
function getMultikillStyle(multikill: string) {
  switch (multikill) {
    case '五杀': return 'bg-red-500 text-white shadow-red-500/50';
    case '四杀': return 'bg-orange-500 text-white shadow-orange-500/50';
    case '三杀': return 'bg-purple-500 text-white shadow-purple-500/50';
    case '双杀': return 'bg-blue-500 text-white shadow-blue-500/50';
    default: return 'bg-gray-500 text-white';
  }
}

// ── Tier display color ──
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

function formatTierShort(tier: string, rank: string): string {
  if (tier === 'UNRANKED') return 'Unranked';
  const tName = tier.charAt(0) + tier.slice(1).toLowerCase();
  // Master+ don't have subdivisions
  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)) return tName;
  return `${tName} ${rank}`;
}

// ── Cached rank data type ──
interface MatchRankData {
  ranks: Record<string, PlayerRankInfo>; // puuid -> rank
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

  // Find max damage for damage bar
  const maxDamage = Math.max(...match.allParticipants.map(p => p.totalDamageDealtToChampions), 1);

  const renderTeamTable = (team: EnrichedParticipant[], teamLabel: string, won: boolean) => (
    <div className="w-full">
      <div className={cn(
        "flex items-center justify-between px-4 py-2 rounded-t-lg text-sm font-bold",
        won ? "bg-blue-900/40 text-blue-300" : "bg-red-900/40 text-red-300"
      )}>
        <span>{won ? '胜利' : '败北'} ({teamLabel})</span>
        <div className="flex items-center gap-6 text-xs text-gray-400 font-normal">
          <span className="w-14 text-center">段位</span>
          <span className="w-16 text-center">KDA</span>
          <span className="w-16 text-center">伤害</span>
          <span className="w-12 text-center">CS</span>
          <span className="w-12 text-center">视野</span>
          <span className="w-[168px] text-center">装备</span>
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
              {/* Left: champion + player */}
              <div className="flex items-center gap-2 min-w-[160px]">
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
                {/* Summoner spells */}
                <div className="flex flex-col gap-0.5">
                  <img crossOrigin="anonymous" src={getSummonerSpellUrl(p.summoner1Id, patch)} alt="" className="w-4 h-4 rounded-sm" />
                  <img crossOrigin="anonymous" src={getSummonerSpellUrl(p.summoner2Id, patch)} alt="" className="w-4 h-4 rounded-sm" />
                </div>
                <span className={cn(
                  "text-xs truncate max-w-[90px]",
                  isMe ? "text-white font-bold" : "text-gray-300"
                )}>
                  {p.playerName || p.championName}
                </span>
              </div>

              {/* Right: stats */}
              <div className="flex items-center gap-6">
                {/* Rank */}
                <div className="w-14 text-center">
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
                {/* KDA */}
                <div className="w-16 text-center">
                  <span className="text-xs text-gray-200 font-mono">
                    {p.kills}/{p.deaths}/{p.assists}
                  </span>
                  <div className="text-[10px] text-gray-500">{formatKDA(p.kills, p.deaths, p.assists)}</div>
                </div>
                {/* Damage */}
                <div className="w-16">
                  <div className="text-xs text-center text-gray-300 font-mono">{(p.totalDamageDealtToChampions / 1000).toFixed(1)}k</div>
                  <div className="w-full h-1 bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", won ? "bg-blue-500" : "bg-red-500")}
                      style={{ width: `${(p.totalDamageDealtToChampions / maxDamage) * 100}%` }}
                    />
                  </div>
                </div>
                {/* CS */}
                <div className="w-12 text-center">
                  <div className="text-xs text-gray-300 font-mono">{p.cs}</div>
                  <div className="text-[10px] text-gray-500">{p.csPerMin}/分</div>
                </div>
                {/* Vision */}
                <div className="w-12 text-center text-xs text-gray-400 font-mono">
                  {p.visionScore}
                </div>
                {/* Items */}
                <div className="flex gap-0.5 w-[168px] justify-center">
                  {p.items.slice(0, 6).map((itemId, i) => (
                    <div key={i} className="w-6 h-6 rounded-sm overflow-hidden bg-gray-800 border border-gray-700/50">
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
                  {/* Trinket */}
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 border border-gray-700/50 ml-1">
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
      <div className="px-4 py-4 space-y-4 bg-gray-950/80 border-t border-gray-800/50">
        {/* Average Rank Banner */}
        {rankData && !rankData.loading && rankData.averageRank !== 'UNRANKED' && (
          <div className="flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs text-gray-400">平均段位</span>
            <span className="text-xs font-bold text-gray-200">{rankData.averageRank}</span>
          </div>
        )}
        {rankData?.loading && (
          <div className="flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
            <span className="text-xs text-gray-400">加载段位信息...</span>
          </div>
        )}
        {renderTeamTable(blueTeam, '蓝队', blueWon)}
        {renderTeamTable(redTeam, '红队', !blueWon)}
      </div>
    </motion.div>
  );
}

// ── Main MatchHistory Component ──
export function MatchHistory({ profile, server }: { profile: SummonerProfileData; server: string }) {
  const latestPatch = profile.latestPatch || '16.13.1';
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  // Cache: matchId -> rank data
  const [rankCache, setRankCache] = useState<Record<string, MatchRankData>>({});

  // We need the current user's puuid to highlight them in the detail panel
  const currentPuuid = profile.recentMatches[0]?.allParticipants.find(p =>
    p.playerName === profile.gameName
  )?.puuid;

  // Fetch ranks when expanding a match
  const fetchRanksForMatch = useCallback(async (match: EnrichedMatchData) => {
    // Already cached and not loading
    if (rankCache[match.matchId] && !rankCache[match.matchId].loading) return;

    // Set loading state
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
      // Trigger rank fetch if not already cached
      if (!rankCache[match.matchId]) {
        fetchRanksForMatch(match);
      }
    }
  }, [expandedMatch, rankCache, fetchRanksForMatch]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-yellow-500"/> {profile.tier} {profile.rank}</span>
            <span className="flex items-center gap-1"><Target className="w-4 h-4 text-blue-400"/> {profile.wins}胜 {profile.losses}负</span>
            <span className="flex items-center gap-1"><Swords className="w-4 h-4 text-red-400"/> 胜率 {profile.winRate}%</span>
          </div>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-500" />
          最近战绩
        </h3>

        <div className="space-y-2">
          {profile.recentMatches.map((match) => {
            const isExpanded = expandedMatch === match.matchId;
            const kda = formatKDA(match.kills, match.deaths, match.assists);
            const kpPercent = Math.round(match.killParticipation * 100);
            const matchRankData = rankCache[match.matchId];

            return (
              <div
                key={match.matchId}
                className={cn(
                  "rounded-xl border overflow-hidden transition-all duration-200",
                  match.win
                    ? "bg-blue-950/20 border-blue-900/40 shadow-[inset_4px_0_0_rgba(59,130,246,0.6)]"
                    : "bg-red-950/20 border-red-900/40 shadow-[inset_4px_0_0_rgba(239,68,68,0.6)]"
                )}
              >
                {/* Collapsed row */}
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                    match.win ? "hover:bg-blue-900/15" : "hover:bg-red-900/15"
                  )}
                  onClick={() => handleToggleMatch(match)}
                >
                  {/* Game Type + Time */}
                  <div className="flex flex-col items-start gap-1 min-w-[72px] shrink-0">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                      getQueueStyle(match.queueName)
                    )}>
                      {match.queueName}
                    </span>
                    <span className={cn(
                      "text-xs font-bold",
                      match.win ? "text-blue-400" : "text-red-400"
                    )}>
                      {match.win ? '胜利' : '失败'}
                    </span>
                    <div className="flex gap-2 text-[10px] text-gray-500">
                      <span>{Math.floor(match.gameDuration / 60)}:{(match.gameDuration % 60).toString().padStart(2, '0')}</span>
                      <span>{getRelativeTime(match.gameCreation)}</span>
                    </div>
                  </div>

                  {/* Champion + Spells + Runes */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Champion icon */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-700">
                      <img
                        crossOrigin="anonymous"
                        src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${match.championName}.png`}
                        alt={match.championName}
                        className="w-full h-full object-cover transform scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                        }}
                      />
                      <span className="absolute bottom-0 right-0 text-[9px] bg-black/80 px-0.5 font-bold leading-tight rounded-tl">{match.champLevel}</span>
                    </div>
                    {/* Summoner spells */}
                    <div className="flex flex-col gap-0.5">
                      <img crossOrigin="anonymous" src={getSummonerSpellUrl(match.summoner1Id, latestPatch)} alt="" className="w-5 h-5 rounded-sm" />
                      <img crossOrigin="anonymous" src={getSummonerSpellUrl(match.summoner2Id, latestPatch)} alt="" className="w-5 h-5 rounded-sm" />
                    </div>
                    {/* Runes */}
                    <div className="flex flex-col gap-0.5">
                      <img
                        crossOrigin="anonymous"
                        src={getRuneIconUrl(match.primaryRuneId, true)}
                        alt=""
                        className="w-5 h-5 rounded-full bg-gray-900"
                      />
                      <img
                        crossOrigin="anonymous"
                        src={getRuneIconUrl(match.subStyleId, false)}
                        alt=""
                        className="w-5 h-5 rounded-full bg-gray-900 opacity-70"
                      />
                    </div>
                  </div>

                  {/* KDA */}
                  <div className="flex flex-col items-center min-w-[100px] shrink-0">
                    <span className="text-gray-100 font-bold text-base tracking-wider font-mono">
                      {match.kills} / <span className="text-red-400">{match.deaths}</span> / {match.assists}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "text-xs font-bold",
                        kda === 'Perfect' ? 'text-yellow-400' :
                          parseFloat(kda) >= 5 ? 'text-orange-400' :
                            parseFloat(kda) >= 3 ? 'text-green-400' : 'text-gray-400'
                      )}>
                        {kda} {kda !== 'Perfect' && 'KDA'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Crosshair className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500">击杀参与 {kpPercent}%</span>
                    </div>
                  </div>

                  {/* CS + Vision */}
                  <div className="hidden md:flex flex-col items-center min-w-[60px] shrink-0">
                    <span className="text-xs text-gray-300 font-mono">CS {match.cs}</span>
                    <span className="text-[10px] text-gray-500">{match.csPerMin}/分</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Eye className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] text-gray-500">{match.visionScore}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="hidden sm:flex items-center gap-0.5 shrink-0">
                    {match.items.slice(0, 6).map((itemId, i) => (
                      <div key={i} className="w-7 h-7 rounded-sm overflow-hidden bg-gray-800/80 border border-gray-700/50">
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
                    {/* Trinket */}
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800/80 border border-gray-700/50 ml-0.5">
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

                  {/* Badges: avg rank + multikill + MVP */}
                  <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    {/* Average rank badge (shown after ranks loaded) */}
                    {matchRankData && !matchRankData.loading && matchRankData.averageRank && matchRankData.averageRank !== 'UNRANKED' && (
                      <span className="hidden lg:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-700/40 text-gray-300 border border-gray-600/40">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        {matchRankData.averageRank}
                      </span>
                    )}
                    {match.multikill && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md",
                        getMultikillStyle(match.multikill)
                      )}>
                        {match.multikill}
                      </span>
                    )}
                    {match.isMVP && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 shadow-md shadow-yellow-500/20">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        MVP
                      </span>
                    )}
                    {/* Expand arrow */}
                    <ChevronDown className={cn(
                      "w-5 h-5 text-gray-500 transition-transform duration-200 ml-1",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                </div>

                {/* Expanded Detail */}
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
        </div>
      </div>
    </div>
  );
}
