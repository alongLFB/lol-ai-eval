'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Sparkles, Bot, Volume2, VolumeX, Copy, Check, Quote, Flame, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { sound } from '@/lib/sound';
import { SpotlightCard } from './SpotlightCard';

export function AIEvaluation({ text }: { text: string }) {
  const t = useTranslations('AIEvaluation');
  const locale = useLocale();

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Analyze tone from evaluation text
  const tone = useMemo(() => {
    const lower = text.toLowerCase();
    const roastKeywords = ['菜', '演员', '卧底', '下饭', '红温', '毫无存在感', '送', 'roast', 'clown', 'trash', 'feeding', 'inting', 'disaster'];
    const praiseKeywords = ['神', '带飞', '掌控', '屠杀', '大腿', 'mvp', 'carry', 'god', 'masterclass', 'legendary', 'flawless', 'unstoppable'];

    const hasRoast = roastKeywords.some((k) => lower.includes(k));
    const hasPraise = praiseKeywords.some((k) => lower.includes(k));

    if (hasRoast && !hasPraise) {
      return {
        label: t('toneRoast'),
        color: 'from-rose-500/20 to-red-600/20 text-rose-300 border-rose-500/40',
        badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
        icon: Flame,
      };
    }
    if (hasPraise) {
      return {
        label: t('tonePraise'),
        color: 'from-amber-500/20 to-yellow-600/20 text-amber-300 border-amber-500/40',
        badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
        icon: Sparkles,
      };
    }
    return {
      label: t('toneNeutral'),
      color: 'from-cyan-500/20 to-indigo-600/20 text-cyan-300 border-cyan-500/40',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
      icon: Wand2,
    };
  }, [text, t]);

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const chars = Array.from(text);

    const timer = setInterval(() => {
      if (i < chars.length) {
        const char = chars[i];
        setDisplayedText((prev) => (i === 0 ? char : prev + char));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 25); // 25ms per char

    return () => clearInterval(timer);
  }, [text]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Speech API text-to-speech
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Pick appropriate language voice
    utterance.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    sound.playClick();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      sound.playSuccess();
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {}
  };

  const ToneIcon = tone.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto my-6"
    >
      <SpotlightCard
        spotlightColor="rgba(192, 132, 252, 0.15)"
        className={`relative overflow-hidden border border-slate-800/90 bg-slate-950/85 p-4 sm:p-8 backdrop-blur-2xl cyber-corners ${tone.glow}`}
      >
        {/* Ambient Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

        {/* Oracle Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-slate-800/70 pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/30 to-cyan-500/20 border border-purple-500/40 shadow-inner">
              <Bot className="w-5 h-5 text-purple-300" />
              <div className="absolute -inset-0.5 rounded-xl bg-purple-500/20 blur-sm -z-10 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-cyan-300 to-indigo-200">
                  {t('title')}
                </h3>
                {/* Tone pill */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tone.badgeColor}`}
                >
                  <ToneIcon className="w-3 h-3" />
                  <span>{tone.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                RUNIC NEURAL SYNTHESIS // V4.1
              </p>
            </div>
          </div>

          {/* Interactive Tools: TTS + Audio Wave + Copy */}
          <div className="flex items-center gap-2">
            {/* Live Waveform Indicator (animates while typing or speaking) */}
            {(isTyping || isSpeaking) && (
              <div className="flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                <span className="w-0.5 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-0.5 h-5 bg-cyan-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-0.5 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                <span className="w-0.5 h-4 bg-purple-300 rounded-full animate-bounce [animation-delay:100ms]" />
              </div>
            )}

            {/* Read Aloud Button */}
            <button
              onClick={handleToggleSpeech}
              onMouseEnter={() => sound.playHover()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer backdrop-blur-md ${
                isSpeaking
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
              title={isSpeaking ? t('stopListen') : t('listen')}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span className="hidden sm:inline">{t('stopListen')}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">{t('listen')}</span>
                </>
              )}
            </button>

            {/* Copy Verdict Button */}
            <button
              onClick={handleCopy}
              onMouseEnter={() => sound.playHover()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={t('copyText')}
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('copyText')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Oracle Chamber Speech Text */}
        <div className="relative min-h-[80px] pl-4 sm:pl-6 border-l-2 border-purple-500/40 my-2">
          <Quote className="absolute -left-3 top-0 w-5 h-5 text-purple-500/50 bg-slate-950 rounded-full p-0.5" />
          <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-sans font-medium tracking-normal">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-2 h-4.5 bg-cyan-400 ml-1.5 animate-pulse align-middle shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            )}
          </p>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
