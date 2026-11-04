'use client';

import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { sound } from '@/lib/sound';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  enableTilt?: boolean;
  enableHoverSound?: boolean;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(56, 189, 248, 0.12)',
  enableTilt = false,
  enableHoverSound = true,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [transformStyle, setTransformStyle] = useState('');

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPosition({ x, y });

      if (enableTilt) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;
        setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
      }
    },
    [enableTilt]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (enableHoverSound) {
      sound.playHover();
    }
  }, [enableHoverSound]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (enableTilt) {
      setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg)');
    }
  }, [enableTilt]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      className={cn(
        'relative rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl overflow-hidden transition-colors',
        className
      )}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Light Source */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(550px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />

      {/* Subtle Border Glow Highlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl border border-cyan-500/20 opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(280px circle at ${position.x}px ${position.y}px, rgba(56, 189, 248, 0.15), transparent 70%)`,
          maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          WebkitMaskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

