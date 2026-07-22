'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { MatchHistory } from '@/components/MatchHistory';
import { AIEvaluation } from '@/components/AIEvaluation';
import { SummonerProfileData } from '@/lib/riot';
import { toBlob } from 'html-to-image';
import { Share2, Loader2, Copy, Check, RefreshCw, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

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

  // Auto search from URL parameters if present
  useEffect(() => {
    const summonerParam = searchParams.get('summoner');
    const serverParam = searchParams.get('server') || 'EUW';

    if (summonerParam) {
      const parts = summonerParam.split('-');
      if (parts.length >= 2) {
        const tagLine = parts.pop()!;
        const gameName = parts.join('-');
        handleSearch(gameName, tagLine, serverParam);
      }
    }
  }, [searchParams]);

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

  const handleSearch = async (gameName: string, tagLine: string, server: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setCurrentServer(server);
    setCurrentGameName(gameName);
    setCurrentTagLine(tagLine);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameName, tagLine, server, locale }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || t('fetchFailed'));
      }

      setData({ profile: json.profile, evaluation: json.evaluation });
      setLastUpdated(json.lastUpdated || new Date().toISOString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !currentGameName || !currentTagLine) return;
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, currentGameName, currentTagLine, currentServer, t]);

  const handleShare = async () => {
    const el = document.getElementById('share-container');
    if (!el) return;
    
    setIsSharing(true);
    try {
      const blob = await toBlob(el, { 
        backgroundColor: '#0a0a0c',
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
          console.warn("Share API failed (possibly due to timeout), falling back to download:", shareError);
        }
      }
      
      if (!shared) {
        // Fallback download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lol-ai-eval.png';
        a.click();
        URL.revokeObjectURL(url);
      }
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

    setIsCopying(true);
    setCopySuccess(false);
    try {
      const blob = await toBlob(el, {
        backgroundColor: '#0a0a0c',
        pixelRatio: 2
      });

      if (!blob) throw new Error("Failed to generate image blob");

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
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
    <main className="min-h-screen bg-[#0a0a0c] text-white overflow-hidden relative selection:bg-purple-500/30">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-blue-900/20 to-purple-900/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10 w-full">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-semibold tracking-wider">
            LEAGUE OF LEGENDS STATS
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-purple-400 to-blue-600 drop-shadow-sm">
            {t('title')}
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="mt-8 p-4 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-center max-w-2xl mx-auto animate-in zoom-in duration-300">
            {error}
          </div>
        )}

        {data && (
          <div className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Action Bar: Update timer + Update button + Copy + Share */}
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-3">
              
              {/* Last Updated Time Badge */}
              {lastUpdated && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-900/80 rounded-full border border-gray-800 text-gray-400 text-xs font-medium select-none">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>{relativeTime}</span>
                </div>
              )}

              {/* Refresh / Update Button */}
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-200 rounded-full font-bold shadow-lg transition-all border border-gray-800 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? t('updating') : t('updateStats')}
              </button>

              {/* Copy Image Button */}
              <button 
                onClick={handleCopyImage}
                disabled={isCopying}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-200 rounded-full font-bold shadow-lg transition-all border border-gray-800"
              >
                {isCopying ? <Loader2 className="w-5 h-5 animate-spin" /> : copySuccess ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                {isCopying ? t('generating') : copySuccess ? t('copied') : t('copyPoster')}
              </button>

              {/* Share / Download Button */}
              <button 
                onClick={handleShare}
                disabled={isSharing}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-500 rounded-full font-bold shadow-lg shadow-purple-900/20 transition-all border border-purple-500/30"
              >
                {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                {isSharing ? t('generating') : t('sharePoster')}
              </button>
            </div>
            
            {/* Success Toast */}
            {copySuccess && (
              <div className="fixed bottom-6 right-6 z-50 bg-gray-900/90 text-white border border-green-500/50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-sm animate-in slide-in-from-bottom-5 duration-300">
                <div className="p-1 bg-green-500/20 rounded-md">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="font-bold text-sm">{t('copySuccessTitle')}</div>
                  <div className="text-xs text-gray-400">{t('copySuccessDesc')}</div>
                </div>
              </div>
            )}
            
            <div id="share-container" className="p-4 sm:p-8 rounded-3xl bg-[#0a0a0c] border border-gray-800 shadow-2xl relative">
              <AIEvaluation text={data.evaluation} />
              <div className="mt-8">
                <MatchHistory profile={data.profile} server={currentServer} />
              </div>
              <div className="absolute top-4 right-6 opacity-20 hidden sm:block">
                <span className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  AI Oracle
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c]" />}>
      <HomeContent />
    </Suspense>
  );
}

