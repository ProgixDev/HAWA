'use client';

import React, { useRef } from 'react';
import { useInViewport } from '@/lib/useInViewport';

interface AnimatedBackgroundProps {
  variant?: 'hero' | 'gradient' | 'subtle';
}

export default function AnimatedBackground({ variant = 'hero' }: AnimatedBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInViewport(rootRef, '200px');
  const paused = inView ? undefined : 'true';

  if (variant === 'hero') {
    return (
      <div
        ref={rootRef}
        data-paused={paused}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {/* Main gradient */}
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background:
              'linear-gradient(110deg, #42107D 0%, #7025A8 38%, #A21BA5 70%, #C60B91 100%)',
            backgroundSize: '300% 300%',
          }}
        />

        {/* Large translucent circles inspired by the floating reference artwork. */}
        <div
          className="absolute -left-[15rem] -top-[8rem] h-[41rem] w-[41rem] rounded-full animate-pulse-scale"
          style={{ background: 'rgba(150, 38, 198, 0.52)', animationDelay: '0s' }}
        />
        <div
          className="absolute -right-[3rem] -top-[9rem] h-[27rem] w-[27rem] rounded-full animate-pulse-scale"
          style={{ background: 'rgba(205, 54, 181, 0.34)', animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-[7%] left-[47%] h-[20rem] w-[20rem] rounded-full animate-pulse-scale"
          style={{ background: 'rgba(213, 92, 194, 0.38)', animationDelay: '1s' }}
        />
        <div
          className="absolute left-[48%] top-[27%] h-10 w-10 rounded-full animate-pulse-scale"
          style={{ background: 'rgba(229, 55, 202, 0.66)', animationDelay: '3s' }}
        />

        {/* A few restrained orbit lines keep depth without changing the animation system. */}
        <div
          className="absolute right-[12%] top-[18%] h-44 w-44 rounded-full border border-white/10 animate-rotate-slow"
          style={{ animationDuration: '25s' }}
        />
        <div
          className="absolute bottom-[24%] left-[8%] h-28 w-28 rounded-full border border-white/10 animate-float-slow"
          style={{ animationDelay: '0s' }}
        />
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div
        ref={rootRef}
        data-paused={paused}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background:
              'linear-gradient(135deg, #4A0E9A 0%, #6D1BC6 30%, #C020A0 65%, #FA0076 100%)',
            backgroundSize: '300% 300%',
          }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 animate-pulse-scale blob-purple" />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-15 animate-pulse-scale blob-magenta"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/3 left-10 w-24 h-24 rounded-full border border-white/10 animate-rotate-slow"
          style={{ animationDuration: '20s' }}
        />
        <div
          className="absolute bottom-1/4 right-16 w-16 h-16 rounded-full border border-white/10 animate-rotate-slow"
          style={{ animationDuration: '15s', animationDirection: 'reverse' }}
        />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      data-paused={paused}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* 5% opacity: imperceptible on phones, so they are not rendered there at all. */}
      <div className="absolute top-0 right-0 hidden h-96 w-96 rounded-full opacity-5 blob-purple md:block" />
      <div className="absolute bottom-0 left-0 hidden h-80 w-80 rounded-full opacity-5 blob-magenta md:block" />
    </div>
  );
}
