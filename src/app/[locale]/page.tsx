'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { MatchHistory } from '@/components/MatchHistory';
import { AIEvaluation } from '@/components/AIEvaluation';
import { SummonerProfileData } from '@/lib/riot';
import { toBlob } from 'html-to-image';
import { Share2, Loader2, Copy, Check, RefreshCw, Clock, Sparkles, Swords, Trophy, Cpu } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { sound } from '@/lib/sound';
import { SpotlightCard } from '@/components/SpotlightCard';

function HomeContent() {
  const t = useTranslations('HomePage');
  const locale = useLocale();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    profile: SummonerProfileData;
    evaluation: string;
  } | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentServer, setCurrentServer] = useState('EUW');

  // Cache / refresh state
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [relativeTime, setRelativeTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentGameName, setCurrentGameName] = useState('');
  const [currentTagLine, setCurrentTagLine] = useState('');
  const [searchedKey, setSearchedKey] = useState('');

  const handleSearch = useCallback(async (gameName: string, tagLine: string, server: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setCurrentServer(server);
    setCurrentGameName(gameName);
    setCurrentTagLine(tagLine);

    const cleanTag = tagLine.replace('#', '');
    const searchKey = `${gameName.toLowerCase()}#${cleanTag.toLowerCase()}@${server.toLowerCase()}`;
    setSearchedKey(searchKey);

    // Update browser URL without full page reload
    if (typeof window !== 'undefined') {
      const formattedSummoner = `${encodeURIComponent(gameName)}-${encodeURIComponent(cleanTag)}`;
      const newUrl = `/${locale}?summoner=${formattedSummoner}&server=${encodeURIComponent(server)}`;
      window.history.replaceState(null, '', newUrl);
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameName, tagLine: cleanTag, server, locale }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || t('fetchFailed'));
      }

      setData({ profile: json.profile, evaluation: json.evaluation });
      setLastUpdated(json.lastUpdated || new Date().toISOString());
      sound.playSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('fetchFailed');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [locale, t]);

  // Auto search from URL parameters if present
  useEffect(() => {
    const summonerParam = searchParams.get('summoner');
    const serverParam = searchParams.get('server') || 'EUW';

    if (summonerParam) {
      const decodedParam = decodeURIComponent(summonerParam);
      let gameName = '';
      let tagLine = '';

      if (decodedParam.includes('#')) {
        const hashParts = decodedParam.split('#');
        tagLine = hashParts.pop()!;
        gameName = hashParts.join('#');
      } else if (decodedParam.includes('-')) {
        const dashParts = decodedParam.split('-');
        tagLine = dashParts.pop()!;
        gameName = dashParts.join('-');
      } else {
        gameName = decodedParam;
        tagLine = serverParam;
      }

      const key = `${gameName.toLowerCase()}#${tagLine.toLowerCase()}@${serverParam.toLowerCase()}`;
      if (gameName && tagLine && key !== searchedKey) {
        const timer = setTimeout(() => {
          handleSearch(gameName, tagLine, serverParam);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, searchedKey, handleSearch]);

  // Tick the relative time display every 30 seconds
  useEffect(() => {
    if (!lastUpdated) return;
    
    const updateRelativeTime = () => {
      const diff = Date.now() - new Date(lastUpdated).getTime();
      const seconds = Math.floor(diff / 1000);
      if (seconds < 60) {
        setRelativeTime(t('justUpdated'));
      } else {
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
          setRelativeTime(t('minutesAgo', { minutes }));
        } else {
          const hours = Math.floor(minutes / 60);
          if (hours < 24) {
            setRelativeTime(t('hoursAgo', { hours }));
          } else {
            const days = Math.floor(hours / 24);
            setRelativeTime(t('daysAgo', { days }));
          }
        }
      }
    };
    
    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 30_000);

    return () => clearInterval(interval);
  }, [lastUpdated, t]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !currentGameName || !currentTagLine) return;
    sound.playClick();
    setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameName: currentGameName,
          tagLine: currentTagLine,
          server: currentServer,
          locale,
          forceRefresh: true,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || t('fetchFailed'));
      }

      setData({ profile: json.profile, evaluation: json.evaluation });
      setLastUpdated(json.lastUpdated || new Date().toISOString());
      sound.playSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('fetchFailed');
      setError(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, currentGameName, currentTagLine, currentServer, locale, t]);

  const handleShare = async () => {
    const el = document.getElementById('share-container');
    if (!el) return;
    
    sound.playClick();
    setIsSharing(true);
    try {
      const blob = await toBlob(el, { 
        backgroundColor: '#030712',
        pixelRatio: 2 // High resolution
      });
      
      if (!blob) throw new Error("Failed to generate image blob");
        
      const file = new File([blob], 'lol-ai-eval.png', { type: 'image/png' });
      
      let shared = false;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: t('title'),
            text: t('subtitle'),
            files: [file]
          });
          shared = true;
        } catch (shareError) {
          console.warn("Share API failed, falling back to download:", shareError);
        }
      }
      
      if (!shared) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lol-ai-eval-${currentGameName || 'oracle'}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      sound.playSuccess();
    } catch (e) {
      console.error(e);
      alert(t('shareFailed'));
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyImage = async () => {
    const el = document.getElementById('share-container');
    if (!el) return;

    sound.playClick();
    setIsCopying(true);
    setCopySuccess(false);
    try {
      const blob = await toBlob(el, {
        backgroundColor: '#030712',
        pixelRatio: 2
      });

      if (!blob) throw new Error("Failed to generate image blob");

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      sound.playSuccess();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
      alert(t('copyFailed'));
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="relative z-10 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-8 md:py-20 relative w-full">
        {/* Hero Section */}
        <div className="text-center mb-10">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>LEAGUE OF LEGENDS RUNIC ORACLE // S15</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-200 via-blue-400 to-indigo-400 drop-shadow-[0_10px_30px_rgba(6,182,212,0.2)]">
            {t('title')}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
            {t('subtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar 
          onSearch={handleSearch} 
          isLoading={isLoading} 
          initialValue={currentGameName && currentTagLine ? `${currentGameName}#${currentTagLine}` : ''}
          initialServer={currentServer}
        />

        {/* Error Alert */}
        {error && (
          <div className="mt-8 p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl text-rose-200 text-center max-w-2xl mx-auto backdrop-blur-md shadow-xl animate-in zoom-in-95 duration-200">
            {error}
          </div>
        )}

        {/* Loading Oracle Summoning Animation */}
        {isLoading && (
          <div className="mt-20 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-purple-500 border-l-transparent animate-spin [animation-duration:1.5s]" />
              <div className="absolute inset-5 rounded-full border-2 border-b-indigo-400 border-t-transparent animate-spin [animation-duration:3s]" />
              <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-slate-200 tracking-wide">
                {locale === 'zh' ? '正在连通星界神谕枢纽...' : 'Connecting to Cosmic Oracle Nexus...'}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                PARSING RECENT MATCH ENSEMBLE // RIOT v4 API
              </div>
            </div>
          </div>
        )}

        {/* Empty State / Feature Highlights (when no summoner has been queried yet) */}
        {!data && !isLoading && !error && (
          <div className="mt-20 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-700">
            <SpotlightCard
              spotlightColor="rgba(192, 132, 252, 0.15)"
              className="p-6 border-slate-800/80 bg-slate-900/50 backdrop-blur-xl cyber-corners"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                {locale === 'zh' ? '🔮 虚空神谕深度裁决' : '🔮 Runic AI Oracle'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {locale === 'zh'
                  ? '结合多模型 LLM 深度解读近期对局。无论是 Carry 天神下凡还是峡谷卧底下饭，一针见血给出最毒舌或最激情的判定。'
                  : 'Leverages cutting-edge LLMs to analyze your recent match telemetry, roasting misplays and celebrating game-winning carries.'}
              </p>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(245, 158, 11, 0.15)"
              className="p-6 border-slate-800/80 bg-slate-900/50 backdrop-blur-xl cyber-corners"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                {locale === 'zh' ? '👑 胜率与流光连胜皇冠' : '👑 Win Streaks & Badges'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {locale === 'zh'
                  ? '自动检测 3 连胜及以上专属流光皇冠，精准判定单双排与灵活排位胜率，追踪 MVP / ACE 与五杀荣誉标签。'
                  : 'Intelligently detects 3+ win streaks with glowing crown auras, evaluates ranked MMR, and highlights MVP/ACE multikills.'}
              </p>
            </SpotlightCard>

            <SpotlightCard
              spotlightColor="rgba(56, 189, 248, 0.15)"
              className="p-6 border-slate-800/80 bg-slate-900/50 backdrop-blur-xl cyber-corners"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
                <Swords className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">
                {locale === 'zh' ? '📊 10人全局战局复盘' : '📊 Full Lobby Telemetry'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {locale === 'zh'
                  ? '原生支持第 8 装备槽位，展开即见全员段位与团队伤害占比流光指示，支持生成高分辨率战报大字报。'
                  : 'Complete 8-slot build systems, asynchronous lobby rank detection, damage distributions, and one-click shareable posters.'}
              </p>
            </SpotlightCard>
          </div>
        )}

        {/* Loaded Data Showcase */}
        {data && (
          <div className="mt-14 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Action Bar: Update timer + Update button + Copy + Share */}
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-3">
              {/* Last Updated Time Badge */}
              {lastUpdated && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/80 rounded-full border border-slate-800 text-slate-400 text-xs font-mono select-none">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{relativeTime}</span>
                </div>
              )}

              {/* Refresh / Update Button */}
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                onMouseEnter={() => sound.playHover()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-full text-xs sm:text-sm font-bold shadow-lg transition-all border border-slate-800 hover:border-slate-700 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? t('updating') : t('updateStats')}
              </button>

              {/* Copy Image Button */}
              <button 
                onClick={handleCopyImage}
                disabled={isCopying}
                onMouseEnter={() => sound.playHover()}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-full text-xs sm:text-sm font-bold shadow-lg transition-all border border-slate-800 hover:border-slate-700 cursor-pointer active:scale-95"
              >
                {isCopying ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : copySuccess ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-purple-400" />
                )}
                {isCopying ? t('generating') : copySuccess ? t('copied') : t('copyPoster')}
              </button>

              {/* Share / Download Button */}
              <button 
                onClick={handleShare}
                disabled={isSharing}
                onMouseEnter={() => sound.playHover()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 rounded-full text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all border border-cyan-400/30 cursor-pointer active:scale-95"
              >
                {isSharing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Share2 className="w-4 h-4 text-white" />
                )}
                {isSharing ? t('generating') : t('sharePoster')}
              </button>
            </div>
            
            {/* Success Toast */}
            {copySuccess && (
              <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white border border-emerald-500/50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
                <div className="p-1.5 bg-emerald-500/20 rounded-xl">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="font-bold text-sm">{t('copySuccessTitle')}</div>
                  <div className="text-xs text-slate-400">{t('copySuccessDesc')}</div>
                </div>
              </div>
            )}
            
            {/* Shareable Poster Container */}
            <div
              id="share-container"
              className="p-2 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#030712] border border-slate-800/90 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative cyber-corners"
            >
              <AIEvaluation text={data.evaluation} />
              <div className="mt-8">
                <MatchHistory profile={data.profile} server={currentServer} />
              </div>
              <div className="absolute top-4 right-6 opacity-20 hidden sm:block select-none pointer-events-none">
                <span className="text-xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  AI ORACLE
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712]" />}>
      <HomeContent />
    </Suspense>
  );
}
