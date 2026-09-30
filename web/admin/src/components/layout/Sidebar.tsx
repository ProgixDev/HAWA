'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Baby,
  BarChart2,
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Crown,
  Download,
  FileText,
  Flag,
  FolderOpen,
  Globe,
  HeadphonesIcon,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  List,
  Lock,
  LogOut,
  Moon,
  Palette,
  PieChart,
  PlusCircle,
  Receipt,
  Settings,
  Shield,
  SlidersHorizontal,
  Sunrise,
  Target,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { CURRENT_ADMIN } from '@/config/admin';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    id: 'nav-dashboard',
    label: "Vue d'ensemble",
    href: ADMIN_ROUTES.dashboard,
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: 'nav-users',
    label: 'Utilisatrices',
    href: ADMIN_ROUTES.users,
    icon: <Users size={18} />,
    badge: 4,
  },
  {
    id: 'nav-content',
    label: 'Contenus',
    icon: <FileText size={18} />,
    children: [
      {
        id: 'nav-articles',
        label: 'Articles',
        href: ADMIN_ROUTES.content.articles,
        icon: <FileText size={16} />,
      },
      {
        id: 'nav-categories',
        label: 'Catégories',
        href: ADMIN_ROUTES.content.categories,
        icon: <FolderOpen size={16} />,
      },
      {
        id: 'nav-premium-content',
        label: 'Contenus Premium',
        href: ADMIN_ROUTES.content.premium,
        icon: <Crown size={16} />,
      },
      {
        id: 'nav-media',
        label: 'Médias',
        href: ADMIN_ROUTES.content.media,
        icon: <ImageIcon size={16} />,
      },
    ],
  },
  {
    id: 'nav-spiritual',
    label: 'Repères spirituels',
    icon: <Moon size={18} />,
    children: [
      {
        id: 'nav-religious-articles',
        label: 'Articles religieux',
        href: ADMIN_ROUTES.spiritual.articles,
        icon: <BookOpen size={16} />,
      },
      {
        id: 'nav-validations',
        label: 'Validations',
        href: ADMIN_ROUTES.spiritual.validations,
        icon: <CheckSquare size={16} />,
        badge: 3,
      },
      {
        id: 'nav-hijri',
        label: 'Calendrier Hijri',
        href: ADMIN_ROUTES.spiritual.hijri,
        icon: <Calendar size={16} />,
      },
      {
        id: 'nav-ramadan',
        label: 'Ramadan / Qadaa',
        href: ADMIN_ROUTES.spiritual.ramadan,
        icon: <Sunrise size={16} />,
      },
      {
        id: 'nav-nifas',
        label: 'Nifas',
        href: ADMIN_ROUTES.spiritual.nifas,
        icon: <Baby size={16} />,
      },
    ],
  },
  {
    id: 'nav-notifications',
    label: 'Notifications',
    icon: <Bell size={18} />,
    children: [
      {
        id: 'nav-notif-new',
        label: 'Nouvelle notification',
        href: ADMIN_ROUTES.notifications.new,
        icon: <PlusCircle size={16} />,
      },
      {
        id: 'nav-notif-scheduled',
        label: 'Programmées',
        href: ADMIN_ROUTES.notifications.scheduled,
        icon: <Clock size={16} />,
      },
      {
        id: 'nav-notif-history',
        label: 'Historique',
        href: ADMIN_ROUTES.notifications.history,
        icon: <History size={16} />,
      },
    ],
  },
  {
    id: 'nav-subscriptions',
    label: 'Abonnements',
    icon: <CreditCard size={18} />,
    children: [
      {
        id: 'nav-sub-overview',
        label: "Vue d'ensemble",
        href: ADMIN_ROUTES.subscriptions.root,
        icon: <BarChart2 size={16} />,
      },
      {
        id: 'nav-sub-plans',
        label: 'Plans',
        href: ADMIN_ROUTES.subscriptions.plans,
        icon: <List size={16} />,
      },
      {
        id: 'nav-sub-active',
        label: 'Abonnements actifs',
        href: ADMIN_ROUTES.subscriptions.active,
        icon: <CreditCard size={16} />,
      },
      {
        id: 'nav-sub-history',
        label: 'Historique',
        href: ADMIN_ROUTES.subscriptions.history,
        icon: <Receipt size={16} />,
      },
      {
        id: 'nav-sub-pricing',
        label: 'Tarification par pays',
        href: ADMIN_ROUTES.subscriptions.pricing,
        icon: <Globe size={16} />,
      },
    ],
  },
  {
    id: 'nav-exports',
    label: 'Exports médicaux',
    href: ADMIN_ROUTES.exports,
    icon: <Download size={18} />,
  },
  {
    id: 'nav-support',
    label: 'Support',
    href: ADMIN_ROUTES.support,
    icon: <HeadphonesIcon size={18} />,
    badge: 7,
  },
  {
    id: 'nav-analytics',
    label: 'Analytics',
    href: ADMIN_ROUTES.analytics,
    icon: <PieChart size={18} />,
  },
  {
    id: 'nav-config',
    label: 'Configuration',
    icon: <Settings size={18} />,
    children: [
      {
        id: 'nav-config-objectives',
        label: 'Objectifs',
        href: ADMIN_ROUTES.configuration.objectives,
        icon: <Target size={16} />,
      },
      {
        id: 'nav-config-flags',
        label: 'Feature Flags',
        href: ADMIN_ROUTES.configuration.flags,
        icon: <Flag size={16} />,
      },
      {
        id: 'nav-config-themes',
        label: 'Thèmes',
        href: ADMIN_ROUTES.configuration.themes,
        icon: <Palette size={16} />,
      },
      {
        id: 'nav-config-global',
        label: 'Paramètres globaux',
        href: ADMIN_ROUTES.configuration.settings,
        icon: <SlidersHorizontal size={16} />,
      },
    ],
  },
  {
    id: 'nav-security',
    label: 'Sécurité',
    icon: <Shield size={18} />,
    children: [
      {
        id: 'nav-sec-admins',
        label: 'Administrateurs',
        href: ADMIN_ROUTES.security.admins,
        icon: <UserCog size={16} />,
      },
      {
        id: 'nav-sec-roles',
        label: 'Rôles & permissions',
        href: ADMIN_ROUTES.security.roles,
        icon: <Lock size={16} />,
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

function NotificationBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto inline-flex h-6 min-w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white shadow-[0_3px_8px_rgba(196,95,124,0.2)]">
      {count}
    </span>
  );
}

function NavItemComponent({
  item,
  collapsed,
  depth = 0,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  depth?: number;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isRouteActive = (href?: string) =>
    Boolean(
      href &&
      (pathname === href || (href !== ADMIN_ROUTES.dashboard && pathname.startsWith(`${href}/`)))
    );
  const hasActiveChild = item.children?.some((child) => isRouteActive(child.href)) ?? false;
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some((child) => isRouteActive(child.href));
  });

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  const isActive = isRouteActive(item.href);
  const hasChildren = Boolean(item.children?.length);

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => !collapsed && setOpen((value) => !value)}
          className={`btn-nav group flex h-12 w-full items-center gap-3 px-3.5 text-[13px] font-medium ${
            hasActiveChild || open
              ? 'bg-primary-pale text-primary'
              : 'text-muted-foreground hover:bg-primary-ghost hover:text-primary'
          } ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? item.label : undefined}
          aria-expanded={open}
        >
          <span className="flex-shrink-0 text-primary/65 transition-colors group-hover:text-primary">
            {item.icon}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
              {item.badge && <NotificationBadge count={item.badge} />}
              <motion.span
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 text-muted-foreground/60"
              >
                <ChevronDown size={14} />
              </motion.span>
            </>
          )}
        </button>

        <AnimatePresence initial={false}>
          {open && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="ml-[22px] mt-1 space-y-0.5 border-l border-border pl-2.5">
                {item.children!.map((child) => (
                  <NavItemComponent
                    key={child.id}
                    item={child}
                    collapsed={false}
                    depth={depth + 1}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? '#'}
      onClick={onNavigate}
      className={`group relative flex ${depth ? 'h-10' : 'h-12'} items-center gap-3 rounded-[15px] px-3.5 text-[13px] transition-colors duration-200 ${
        isActive
          ? 'bg-primary-pale font-semibold text-primary shadow-[inset_0_0_0_1px_rgba(214,175,186,0.32)]'
          : 'font-medium text-muted-foreground hover:bg-primary-ghost hover:text-primary'
      } ${collapsed ? 'justify-center px-0' : ''}`}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      <span
        className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-primary/60 group-hover:text-primary'}`}
      >
        {item.icon}
      </span>
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge && <NotificationBadge count={item.badge} />}
        </>
      )}
    </Link>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: SidebarProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateViewport = () => setIsDesktop(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  const desktopCollapsed = collapsed && isDesktop;

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-primary/35 backdrop-blur-[2px] md:hidden"
            onClick={onMobileClose}
            aria-label="Fermer le menu de navigation"
          />
        )}
      </AnimatePresence>

      <aside
        id="admin-sidebar"
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-[284px] flex-col overflow-hidden rounded-r-[24px] border-r border-border bg-white shadow-sidebar transition-[width,transform] duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${desktopCollapsed ? 'md:w-[80px]' : 'md:w-[284px]'}`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(250,244,246,0.96)_100%)]"
          aria-hidden="true"
        />

        <header
          className={`relative z-10 flex flex-shrink-0 items-center justify-center border-b border-border transition-[height,padding] duration-300 ${
            desktopCollapsed ? 'h-[94px] px-2' : 'h-[148px] px-6'
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className={desktopCollapsed ? 'h-[41px]' : 'h-[96px] overflow-hidden'}>
              <AppLogo
                src="/assets/images/app_logo.png"
                width={desktopCollapsed ? 50 : 126}
                height={desktopCollapsed ? 41 : 103}
                className="drop-shadow-[0_8px_20px_rgba(73,45,70,0.12)] transition-all duration-300"
              />
            </div>
            {!desktopCollapsed && (
              <div className="mt-1.5 flex items-center justify-center gap-2.5">
                <span className="h-px w-5 bg-accent/70" aria-hidden="true" />
                <span className="text-[11px] font-semibold tracking-[0.16em] text-primary/75">
                  Administration
                </span>
                <span className="h-px w-5 bg-accent/70" aria-hidden="true" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onMobileClose}
            className="btn-icon-sm absolute right-4 top-4 border-0 shadow-none md:hidden"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="btn-icon-sm absolute -right-px bottom-3 hidden rounded-l-full rounded-r-none border-r-0 md:inline-flex"
            title={desktopCollapsed ? 'Développer' : 'Réduire'}
            aria-label={desktopCollapsed ? 'Développer la navigation' : 'Réduire la navigation'}
          >
            <motion.span
              animate={{ rotate: desktopCollapsed ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="block"
            >
              <ChevronRight size={15} />
            </motion.span>
          </button>
        </header>

        <nav
          className="scrollbar-thin relative z-10 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4"
          aria-label="Navigation principale"
        >
          {navItems.map((item, index) => {
            const isGroupStart = [2, 3, 4, 5, 7, 9, 10].includes(index);

            return (
              <React.Fragment key={item.id}>
                {isGroupStart && !desktopCollapsed && (
                  <div className="mx-3 my-2 h-px bg-border/80" />
                )}
                <NavItemComponent
                  item={item}
                  collapsed={desktopCollapsed}
                  onNavigate={onMobileClose}
                />
              </React.Fragment>
            );
          })}
        </nav>

        <div className="relative z-10 flex-shrink-0 border-t border-border bg-primary-ghost/80 p-3">
          <div
            className={`flex min-h-12 items-center gap-3 rounded-[14px] px-2 py-1.5 transition-colors hover:bg-white ${
              desktopCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary text-xs font-semibold text-white shadow-[0_4px_12px_rgba(73,45,70,0.18)]">
              {CURRENT_ADMIN.avatarInitials}
            </div>

            <AnimatePresence>
              {!desktopCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {CURRENT_ADMIN.name}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
                    {CURRENT_ADMIN.roleLabel}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!desktopCollapsed && (
              <Link
                href="/admin-login"
                onClick={onMobileClose}
                className="flex-shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-primary-pale hover:text-accent"
                title="Déconnexion"
                aria-label="Se déconnecter"
              >
                <LogOut size={16} />
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
