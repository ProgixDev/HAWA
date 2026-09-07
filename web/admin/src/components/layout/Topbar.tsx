'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Bell, HelpCircle, ChevronRight, Command, Menu } from 'lucide-react';
import { CURRENT_ADMIN } from '@/config/admin';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

const routeLabels: Record<string, string[]> = {
  [ADMIN_ROUTES.dashboard]: ["Vue d'ensemble"],
  [ADMIN_ROUTES.users]: ['Utilisatrices'],
  [ADMIN_ROUTES.content.articles]: ['Contenus', 'Articles'],
  [ADMIN_ROUTES.content.categories]: ['Contenus', 'Catégories'],
  [ADMIN_ROUTES.content.premium]: ['Contenus', 'Contenus Premium'],
  [ADMIN_ROUTES.content.media]: ['Contenus', 'Médias'],
  [ADMIN_ROUTES.spiritual.articles]: ['Repères spirituels', 'Articles religieux'],
  [ADMIN_ROUTES.spiritual.validations]: ['Repères spirituels', 'Validations'],
  [ADMIN_ROUTES.spiritual.hijri]: ['Repères spirituels', 'Calendrier Hijri'],
  [ADMIN_ROUTES.spiritual.ramadan]: ['Repères spirituels', 'Ramadan / Qadaa'],
  [ADMIN_ROUTES.spiritual.nifas]: ['Repères spirituels', 'Nifas'],
  [ADMIN_ROUTES.notifications.new]: ['Notifications', 'Nouvelle notification'],
  [ADMIN_ROUTES.notifications.scheduled]: ['Notifications', 'Programmées'],
  [ADMIN_ROUTES.notifications.history]: ['Notifications', 'Historique'],
  [ADMIN_ROUTES.subscriptions.root]: ['Abonnements', "Vue d'ensemble"],
  [ADMIN_ROUTES.subscriptions.plans]: ['Abonnements', 'Plans'],
  [ADMIN_ROUTES.subscriptions.active]: ['Abonnements', 'Abonnements actifs'],
  [ADMIN_ROUTES.subscriptions.history]: ['Abonnements', 'Historique'],
  [ADMIN_ROUTES.subscriptions.pricing]: ['Abonnements', 'Tarification par pays'],
  [ADMIN_ROUTES.exports]: ['Exports médicaux'],
  [ADMIN_ROUTES.support]: ['Support'],
  [ADMIN_ROUTES.analytics]: ['Analytics'],
  [ADMIN_ROUTES.configuration.objectives]: ['Configuration', 'Objectifs'],
  [ADMIN_ROUTES.configuration.flags]: ['Configuration', 'Feature Flags'],
  [ADMIN_ROUTES.configuration.themes]: ['Configuration', 'Thèmes'],
  [ADMIN_ROUTES.configuration.settings]: ['Configuration', 'Paramètres globaux'],
  [ADMIN_ROUTES.security.admins]: ['Sécurité', 'Administrateurs'],
  [ADMIN_ROUTES.security.roles]: ['Sécurité', 'Rôles & permissions'],
  [ADMIN_ROUTES.security.logs]: ['Sécurité', "Journaux d'activité"],
  [ADMIN_ROUTES.security.privacy]: ['Sécurité', 'Demandes de données'],
};

interface TopbarProps {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  onMobileMenuToggle: () => void;
}

export default function Topbar({
  sidebarCollapsed,
  mobileSidebarOpen,
  onMobileMenuToggle,
}: TopbarProps) {
  const pathname = usePathname();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const crumbs =
    routeLabels[pathname] ??
    (pathname.startsWith('/admin/utilisatrices/')
      ? ['Utilisatrices', 'Détails du compte']
      : ["Vue d'ensemble"]);

  const mockNotifications = [
    {
      id: 'notif-001',
      text: '12 contenus en attente de validation',
      time: 'il y a 5 min',
      unread: true,
    },
    {
      id: 'notif-002',
      text: 'Nouvel article religieux soumis',
      time: 'il y a 22 min',
      unread: true,
    },
    { id: 'notif-003', text: '2 paiements échoués détectés', time: 'il y a 1h', unread: true },
    { id: 'notif-004', text: 'Rapport mensuel généré', time: 'il y a 3h', unread: false },
  ];

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-sm transition-[left] duration-300 ease-in-out sm:px-6 md:gap-4 ${
        sidebarCollapsed ? 'md:left-[80px]' : 'md:left-[284px]'
      }`}
      style={{
        height: 'var(--topbar-height)',
      }}
    >
      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="flex-shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        aria-label={mobileSidebarOpen ? 'Fermer la navigation' : 'Ouvrir la navigation'}
        aria-controls="admin-sidebar"
        aria-expanded={mobileSidebarOpen}
      >
        <Menu size={19} />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0" aria-label="Fil d'Ariane">
        {crumbs.map((crumb, idx) => (
          <React.Fragment key={`crumb-${crumb}`}>
            {idx > 0 && (
              <ChevronRight size={14} className="text-muted-foreground/50 flex-shrink-0" />
            )}
            <span
              className={`text-sm truncate ${
                idx === crumbs.length - 1
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <motion.div
          animate={{ width: searchFocused ? 280 : 220 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative"
        >
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="search"
            placeholder="Rechercher..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full h-9 pl-9 pr-10 rounded-xl border border-border bg-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs border border-border bg-muted text-muted-foreground font-sans">
              <Command size={10} />K
            </kbd>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Notifications"
            aria-label="Ouvrir les notifications"
          >
            <Bell size={18} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: 'var(--danger)' }}
            />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-card rounded-2xl border border-border shadow-dropdown z-50"
              >
                <div className="p-4 border-b border-border">
                  <h3 className="font-display font-semibold text-sm text-foreground">
                    Notifications
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {mockNotifications.filter((n) => n.unread).length} non lues
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto scrollbar-thin">
                  {mockNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 p-3.5 hover:bg-muted/50 transition-colors cursor-pointer ${n.unread ? 'bg-primary-ghost/30' : ''}`}
                    >
                      {n.unread && (
                        <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary" />
                      )}
                      {!n.unread && <div className="flex-shrink-0 w-2" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">{n.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border">
                  <button className="w-full text-center text-xs font-semibold text-primary hover:text-primary-light transition-colors">
                    Voir toutes les notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Aide"
          aria-label="Aide"
        >
          <HelpCircle size={18} />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 ml-1 pl-3 border-l border-border">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-semibold text-foreground leading-none">
              {CURRENT_ADMIN.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{CURRENT_ADMIN.roleLabel}</p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
            }}
          >
            {CURRENT_ADMIN.avatarInitials}
          </div>
        </div>
      </div>
    </header>
  );
}

function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Re-export with framer-motion AnimatePresence
export { AnimatePresence };
