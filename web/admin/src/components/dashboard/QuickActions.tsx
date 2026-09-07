'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FilePlus, BellPlus, UserCog, ClipboardList } from 'lucide-react';

const actions = [
  {
    id: 'qa-article',
    label: 'Nouvel article',
    href: '/admin/contenus/articles',
    icon: <FilePlus size={18} />,
    color: 'text-primary',
    bg: 'bg-primary-pale hover:bg-primary-pale/80',
  },
  {
    id: 'qa-notification',
    label: 'Envoyer une notification',
    href: '/admin/notifications/nouvelle',
    icon: <BellPlus size={18} />,
    color: 'text-info',
    bg: 'bg-info-bg hover:bg-info-bg/80',
  },
  {
    id: 'qa-admin',
    label: 'Ajouter un administrateur',
    href: '/admin/securite/administrateurs',
    icon: <UserCog size={18} />,
    color: 'text-success',
    bg: 'bg-success-bg hover:bg-success-bg/80',
  },
  {
    id: 'qa-requests',
    label: 'Voir les demandes',
    href: '/admin/securite/demandes-donnees',
    icon: <ClipboardList size={18} />,
    color: 'text-warning',
    bg: 'bg-warning-bg hover:bg-warning-bg/80',
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {actions?.map((action, idx) => (
        <motion.div
          key={action?.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: idx * 0.06 }}
        >
          <Link href={action?.href}>
            <div
              className={`flex items-center gap-2.5 p-3 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${action?.bg}`}
            >
              <span className={`flex-shrink-0 ${action?.color}`}>{action?.icon}</span>
              <span className="text-xs font-semibold text-foreground leading-tight">
                {action?.label}
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
