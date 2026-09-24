'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeUp, viewportConfig } from '@/lib/animations';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  centered = true,
  light = false,
  className,
  titleClassName,
  subtitleClassName,
}: SectionHeadingProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      className={cn('max-w-3xl', centered && 'mx-auto text-center', className)}
    >
      {eyebrow && (
        <span
          className={cn(
            'mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em]',
            light ? 'bg-white/15 text-white/90' : 'bg-primary/8 text-primary'
          )}
          style={!light ? { background: 'rgba(109,27,198,0.08)' } : {}}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'text-section-title mb-5',
          light ? 'text-white' : 'text-foreground',
          titleClassName
        )}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      {subtitle && (
        <p
          className={cn(
            'text-base md:text-lg leading-relaxed',
            light ? 'text-white/75' : 'text-muted-foreground',
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
