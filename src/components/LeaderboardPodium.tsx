'use client';

import { LeaderboardItem } from '@/lib/riot';
import { Crown, Trophy, Medal, Sparkles, ExternalLink, Flame } from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { sound } from '@/lib/sound';

interface LeaderboardPodiumProps {
  items: LeaderboardItem[];
  onSelect: (gameName: string, tagLine: string) => void;
  formatTierDisplay: (tier: string) => string;
}

export function LeaderboardPodium({ items, onSelect, formatTierDisplay }: LeaderboardPodiumProps) {
  if (items.length < 3) return null;

  const first = items[0];
  const second = items[1];
  const third = items[2];

  const podiumOrder = [
    { item: second, rank: 2, orderClass: 'order-2 md:order-1', border: 'border-slate-400/40', glow: 'shadow-[0_0_25px_rgba(148,163,184,0.15)]', bg: 'from-slate-400/10 via-slate-500/5 to-transparent', icon: Trophy, iconColor: 'text-slate-300' },
    { item: first, rank: 1, orderClass: 'order-1 md:order-2', border: 'border-amber-400/50', glow: 'shadow-[0_0_35px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30', bg: 'from-amber-500/15 via-yellow-500/5 to-transparent', icon: Crown, iconColor: 'text-amber-400', isFirst: true },
    { item: third, rank: 3, orderClass: 'order-3 md:order-3', border: 'border-amber-700/40', glow: 'shadow-[0_0_20px_rgba(180,83,9,0.15)]', bg: 'from-amber-700/10 via-amber-800/5 to-transparent', icon: Medal, iconColor: 'text-amber-600' },
  ];

  return (
    <div className="w-full my-6 sm:my-8 px-1">
      <div className="text-center mb-5 sm:mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>SERVER APEX SUMMIT // TOP 3</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 items-end max-w-5xl mx-auto">
        {podiumOrder.map(({ item, rank, orderClass, border, glow, bg, icon: Icon, iconColor, isFirst }) => (
          <SpotlightCard
            key={item.puuid}
            spotlightColor={isFirst ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.12)'}
            enableTilt={true}
            onClick={() => {
              if (isFirst) {
                sound.playFanfare();
              } else {
                sound.playClick();
              }
              onSelect(item.gameName, item.tagLine);
            }}
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1.5 p-4 sm:p-6 flex flex-col justify-between ${border} ${glow} bg-gradient-to-t ${bg} bg-slate-950/80 cyber-corners ${orderClass}`}
          >
            {/* Top Rank Badge */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border ${
                    isFirst
                      ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-slate-800/80 border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor} ${isFirst ? 'animate-bounce [animation-duration:2s]' : ''}`} />
                </div>
                <span className="font-mono text-xs font-bold text-slate-400">
                  RANK #{rank}
                </span>
              </div>

              {item.hotStreak && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                  <Flame className="w-3 h-3 text-rose-400" />
                  HOT
                </span>
              )}
            </div>

            {/* Player Info */}
            <div className="my-auto text-center py-1 sm:py-2">
              <h3 className="text-base sm:text-xl font-black text-slate-100 hover:text-cyan-300 transition-colors truncate">
                {item.gameName}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                #{item.tagLine}
              </p>

              {/* Tier Pill */}
              <div className="mt-2.5 sm:mt-3">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  {formatTierDisplay(item.tier)}
                </span>
              </div>

              {/* LP Display */}
              <div className="mt-2.5 sm:mt-3">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-gold-gradient">
                  {item.leaguePoints.toLocaleString()}
                </span>
                <span className="text-xs text-amber-500/80 font-mono ml-1 font-bold">LP</span>
              </div>

              {/* Win Rate Bar */}
              <div className="mt-2.5 sm:mt-3 max-w-[180px] mx-auto">
                <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                  <span>{item.winRate}% WR</span>
                  <span className="text-slate-400 font-normal">
                    {item.wins}W {item.losses}L
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min(parseFloat(item.winRate), 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Action Hint */}
            <div className="mt-3.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-800/60 flex items-center justify-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
              <span>{isFirst ? '🏆 查看王者神谕' : '查看神谕'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
