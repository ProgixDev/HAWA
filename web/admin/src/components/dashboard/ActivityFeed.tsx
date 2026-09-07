'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Star, FileText, CheckCircle, Bell, Trash2, MessageSquare } from 'lucide-react';
import type { ActivityItem } from '@/types';

const iconMap: Record<string, React.ReactNode> = {
  UserPlus: <UserPlus size={14} />,
  Star: <Star size={14} />,
  FileText: <FileText size={14} />,
  CheckCircle: <CheckCircle size={14} />,
  Bell: <Bell size={14} />,
  Trash2: <Trash2 size={14} />,
  MessageSquare: <MessageSquare size={14} />,
};

const colorConfig = {
  primary: { bg: 'bg-primary-pale', text: 'text-primary' },
  success: { bg: 'bg-success-bg', text: 'text-success' },
  warning: { bg: 'bg-warning-bg', text: 'text-warning' },
  danger: { bg: 'bg-danger-bg', text: 'text-danger' },
  info: { bg: 'bg-info-bg', text: 'text-info' },
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="space-y-0">
      {items.map((item, idx) => {
        const colors = colorConfig[item.color];
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.06 }}
            className="flex gap-3 py-3 group"
          >
            {/* Timeline line */}
            <div className="flex flex-col items-center gap-0 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}
              >
                {iconMap[item.icon]}
              </div>
              {idx < items.length - 1 && (
                <div
                  className="w-px flex-1 min-h-[12px] mt-1"
                  style={{ background: 'var(--border)' }}
                />
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {item.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
