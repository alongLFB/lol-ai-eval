import { SummonerProfileData } from '@/lib/riot';
import { cn } from '@/lib/utils';
import { Trophy, Swords, Shield, Target } from 'lucide-react';

export function MatchHistory({ profile }: { profile: SummonerProfileData }) {
  const latestPatch = profile.latestPatch || '16.13.1';
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.recentMatches.map((match, i) => (
            <div 
              key={match.matchId}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm transition-transform hover:scale-[1.02]",
                match.win 
                  ? "bg-blue-900/10 border-blue-900/50 hover:bg-blue-900/20 shadow-[inset_4px_0_0_rgba(59,130,246,0.5)]" 
                  : "bg-red-900/10 border-red-900/50 hover:bg-red-900/20 shadow-[inset_4px_0_0_rgba(239,68,68,0.5)]"
              )}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-700 shrink-0">
                <img 
                  crossOrigin="anonymous"
                  src={`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${match.championName}.png`}
                  alt={match.championName}
                  className="w-full h-full object-cover transform scale-110"
                  onError={(e) => {
                     (e.target as HTMLImageElement).src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className={cn("font-bold text-sm", match.win ? "text-blue-400" : "text-red-400")}>
                    {match.win ? "胜利" : "失败"}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {Math.floor(match.gameDuration / 60)}:{(match.gameDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-mono text-sm tracking-widest">
                    {match.kills} / <span className="text-red-400">{match.deaths}</span> / {match.assists}
                  </span>
                  <span className="text-xs text-gray-500">
                    {match.damage.toLocaleString()} Dmg
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
