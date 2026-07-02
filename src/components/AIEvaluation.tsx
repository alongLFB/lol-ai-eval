'use client';
import { useEffect, useState } from 'react';
import { Sparkles, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export function AIEvaluation({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  // Typewriter effect
  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    setIsTyping(true);
    const chars = Array.from(text);
    const timer = setInterval(() => {
      if (i < chars.length) {
        const char = chars[i];
        setDisplayedText((prev) => prev + char);
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 30); // 30ms per char

    return () => clearInterval(timer);
  }, [text]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto my-8 relative group"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 rounded-2xl blur-md opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse" />
      
      <div className="relative bg-[#0d1117] border border-gray-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Cpu className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            水晶枢纽 AI 裁决
          </h3>
          <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse ml-auto" />
        </div>
        
        <div className="min-h-[120px]">
          <p className="text-lg sm:text-xl text-gray-200 leading-relaxed font-medium">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-ping align-middle" />
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
