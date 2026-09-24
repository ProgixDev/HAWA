'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AppImage from '@/components/ui/AppImage';
import { cn } from '@/lib/utils';

interface PhoneMockupProps {
  src?: string;
  alt?: string;
  className?: string;
  glowColor?: string;
  size?: 'sm' | 'md' | 'lg';
  rotate?: number;
  floatDelay?: number;
}

const sizeMap = {
  sm: { width: 200, height: 400, frameClass: 'w-[200px] h-[400px]' },
  md: { width: 260, height: 520, frameClass: 'w-[260px] h-[520px]' },
  lg: { width: 300, height: 600, frameClass: 'w-[300px] h-[600px]' },
};

export default function PhoneMockup({
  src = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80',
  alt = 'AWA app screenshot showing cycle tracking interface on a smartphone',
  className,
  glowColor = 'rgba(109,27,198,0.35)',
  size = 'md',
  rotate = 0,
  floatDelay = 0,
}: PhoneMockupProps) {
  const { width, height, frameClass } = sizeMap[size];

  return (
    <motion.div
      className={cn('relative', frameClass, className)}
      style={{ rotate }}
      animate={{ y: [0, -12, 0] }}
      transition={{
        duration: 6,
        ease: 'easeInOut',
        repeat: Infinity,
        delay: floatDelay,
      }}
    >
      {/* Glow */}
      <div
        className="absolute -inset-4 rounded-[3rem] blur-2xl opacity-60 pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)` }}
      />

      {/* Phone frame */}
      <div
        className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl"
        style={{
          background: '#0a0a0a',
          border: '3px solid rgba(255,255,255,0.12)',
          boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />

        {/* Screen */}
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
          {src ? (
            <AppImage
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes={`${width}px`}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: 'linear-gradient(145deg, #1a0533 0%, #2d1060 50%, #1a0533 100%)',
              }}
            />
          )}
        </div>

        {/* Screen glare */}
        <div
          className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Side buttons */}
      <div className="absolute right-[-4px] top-24 w-1 h-12 bg-gray-700 rounded-l-sm" />
      <div className="absolute left-[-4px] top-20 w-1 h-8 bg-gray-700 rounded-r-sm" />
      <div className="absolute left-[-4px] top-32 w-1 h-8 bg-gray-700 rounded-r-sm" />
    </motion.div>
  );
}