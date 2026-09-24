import type { LucideIcon } from 'lucide-react';
import {
  Users,
  FileText,
  FolderOpen,
  CreditCard,
  List,
  HeadphonesIcon,
  Download,
  Bell,
  CheckSquare,
  BookOpen,
  UserCog,
  Lock,
} from 'lucide-react';
import { mockUsers } from '@/data/mock/users';
import { contentCategories } from '@/data/mock/content';
import { subscriptionPlans, activeSubscriptions } from '@/data/mock/subscriptions';
import { supportOverview, medicalExportOverview } from '@/data/mock/adminOperations';
import { mockSpiritualValidations, mockSpiritualArticles } from '@/data/mock/spiritual';
import type { NotificationCampaign } from '@/data/mock/notifications';
import type { SecurityAdministrator, SecurityRole } from '@/data/security';
import { ADMIN_ROUTES } from '@/config/adminRoutes';
import type { Article } from '@/types';

/**
 * Frontend-only global search index over the admin's existing mock/session data.
 * No backend, no API — see web/admin/TODO.md §1.2 (Topbar search).
 */
export interface GlobalSearchEntry {
  id: string;
  group: string;
  groupLabel: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href: string;
  /** Lowercased, space-joined haystack of every field this entry matches on. */
  keywords: string;
}

export interface GlobalSearchGroupResult {
  group: string;
  groupLabel: string;
  icon: LucideIcon;
  items: GlobalSearchEntry[];
  totalMatches: number;
}

function normalize(...parts: Array<string | number | undefined | null>): string {
  return parts
    .filter((part): part is string | number => part !== undefined && part !== null && part !== '')
    .map(String)
    .join(' ')
    .toLowerCase();
}

/** Light cosmetic pass for raw enum values ('pending_validation' -> 'Pending validation'). */
function prettify(value: string): string {
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// ---------------------------------------------------------------------------
// Static sources: module-level constants that never change identity during a
// session (no session store backs them), so the index is built once at import
// time rather than being recomputed on every keystroke or render.
// ---------------------------------------------------------------------------

const userEntries: GlobalSearchEntry[] = mockUsers.map((user) => ({
  id: `user-${user.id}`,
  group: 'users',
  groupLabel: 'Utilisatrices',
  icon: Users,
  title: user.name,
  subtitle: user.email,
  href: `${ADMIN_ROUTES.users}/${user.id}`,
  keywords: normalize(
    user.name,
    user.email,
    user.displayId,
    user.country,
    user.objective,
    user.status,
    user.plan
  ),
}));

const categoryEntries: GlobalSearchEntry[] = contentCategories.map((category) => ({
  id: `category-${category.id}`,
  group: 'categories',
  groupLabel: 'Catégories',
  icon: FolderOpen,
  title: category.name,
  subtitle: category.description,
  href: ADMIN_ROUTES.content.categories,
  keywords: normalize(category.name, category.slug, category.description, category.domain),
}));

const planEntries: GlobalSearchEntry[] = subscriptionPlans.map((plan) => ({
  id: `plan-${plan.id}`,
  group: 'plans',
  groupLabel: 'Plans',
  icon: CreditCard,
  title: plan.name,
  subtitle: `${plan.price} ${plan.currency} · ${plan.subscriberCount} abonné·es`,
  href: ADMIN_ROUTES.subscriptions.plans,
  keywords: normalize(plan.name, plan.code, plan.description, plan.badge),
}));

const activeSubscriptionEntries: GlobalSearchEntry[] = activeSubscriptions.map((subscription) => ({
  id: `subscription-${subscription.id}`,
  group: 'subscriptions',
  groupLabel: 'Abonnements actifs',
  icon: List,
  title: subscription.userName,
  subtitle: `${subscription.planName} · ${subscription.email}`,
  href: ADMIN_ROUTES.subscriptions.active,
  keywords: normalize(
    subscription.userName,
    subscription.email,
    subscription.planName,
    subscription.status,
    subscription.country,
    subscription.paymentMethod
  ),
}));

const ticketEntries: GlobalSearchEntry[] = supportOverview.tickets.map((ticket) => ({
  id: `ticket-${ticket.id}`,
  group: 'support',
  groupLabel: 'Support',
  icon: HeadphonesIcon,
  title: ticket.subject,
  subtitle: `#${ticket.id} · ${ticket.userName}`,
  href: ADMIN_ROUTES.support,
  keywords: normalize(
    ticket.subject,
    ticket.id,
    ticket.userName,
    ticket.userEmail,
    ticket.category,
    ticket.status,
    ticket.priority
  ),
}));

const exportEntries: GlobalSearchEntry[] = medicalExportOverview.requests.map((request) => ({
  id: `export-${request.id}`,
  group: 'exports',
  groupLabel: 'Exports médicaux',
  icon: Download,
  title: request.userName,
  subtitle: `${prettify(request.type)} · ${request.period}`,
  href: ADMIN_ROUTES.exports,
  keywords: normalize(
    request.userName,
    request.userEmail,
    request.type,
    request.period,
    request.status,
    request.format
  ),
}));

const validationEntries: GlobalSearchEntry[] = mockSpiritualValidations.map((record) => ({
  id: `validation-${record.id}`,
  group: 'validations',
  groupLabel: 'Validations',
  icon: CheckSquare,
  title: record.contentTitle,
  subtitle: `${prettify(record.status)} · ${record.category}`,
  href: ADMIN_ROUTES.spiritual.validations,
  keywords: normalize(
    record.contentTitle,
    record.category,
    record.status,
    record.reviewer,
    record.submittedBy
  ),
}));

const religiousArticleEntries: GlobalSearchEntry[] = mockSpiritualArticles.map((article) => ({
  id: `spiritual-article-${article.id}`,
  group: 'spiritual-articles',
  groupLabel: 'Articles religieux',
  icon: BookOpen,
  title: article.title,
  subtitle: article.category,
  href: ADMIN_ROUTES.spiritual.articles,
  keywords: normalize(
    article.title,
    article.category,
    article.tags.join(' '),
    article.validationStatus
  ),
}));

const STATIC_SEARCH_ENTRIES: GlobalSearchEntry[] = [
  ...userEntries,
  ...categoryEntries,
  ...planEntries,
  ...activeSubscriptionEntries,
  ...ticketEntries,
  ...exportEntries,
  ...validationEntries,
  ...religiousArticleEntries,
];

export function getStaticSearchEntries(): GlobalSearchEntry[] {
  return STATIC_SEARCH_ENTRIES;
}

// ---------------------------------------------------------------------------
// Live-session sources: these three modules already have a shared
// `useSyncExternalStore`-backed session store (contentArticlesSessionStore,
// notificationsSessionStore, securitySessionStore), so search reflects
// same-session edits instead of only the original mock seed.
// ---------------------------------------------------------------------------

export function buildArticleEntries(articles: Article[]): GlobalSearchEntry[] {
  return articles.map((article) => ({
    id: `article-${article.id}`,
    group: 'articles',
    groupLabel: 'Articles',
    icon: FileText,
    title: article.title,
    subtitle: `${article.category} · ${prettify(article.status)}`,
    href: ADMIN_ROUTES.content.articles,
    keywords: normalize(
      article.title,
      article.shortDescription,
      article.category,
      article.tags.join(' '),
      article.author,
      article.status
    ),
  }));
}

export function buildNotificationEntries(campaigns: NotificationCampaign[]): GlobalSearchEntry[] {
  return campaigns.map((campaign) => ({
    id: `notification-${campaign.id}`,
    group: 'notifications',
    groupLabel: 'Notifications',
    icon: Bell,
    title: campaign.title,
    subtitle: prettify(campaign.status),
    href:
      campaign.status === 'sent' || campaign.status === 'cancelled'
        ? ADMIN_ROUTES.notifications.history
        : ADMIN_ROUTES.notifications.scheduled,
    keywords: normalize(
      campaign.title,
      campaign.name,
      campaign.message,
      campaign.status,
      campaign.audienceKey
    ),
  }));
}

export function buildAdministratorEntries(
  administrators: SecurityAdministrator[]
): GlobalSearchEntry[] {
  return administrators.map((administrator) => ({
    id: `administrator-${administrator.id}`,
    group: 'administrators',
    groupLabel: 'Administrateurs',
    icon: UserCog,
    title: administrator.name,
    subtitle: administrator.email,
    href: ADMIN_ROUTES.security.admins,
    keywords: normalize(administrator.name, administrator.email, administrator.status),
  }));
}

export function buildRoleEntries(roles: SecurityRole[]): GlobalSearchEntry[] {
  return roles.map((role) => ({
    id: `role-${role.id}`,
    group: 'roles',
    groupLabel: 'Rôles & permissions',
    icon: Lock,
    title: role.name,
    subtitle: role.description,
    href: ADMIN_ROUTES.security.roles,
    keywords: normalize(role.name, role.description),
  }));
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

/** Rows shown per group before the group's header switches to a "(N)" count. */
export const GLOBAL_SEARCH_GROUP_LIMIT = 4;

export function filterGlobalSearchEntries(
  entries: GlobalSearchEntry[],
  rawQuery: string
): GlobalSearchGroupResult[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const order: string[] = [];
  const byGroup = new Map<string, GlobalSearchEntry[]>();

  for (const entry of entries) {
    if (!entry.keywords.includes(query)) continue;
    if (!byGroup.has(entry.group)) {
      byGroup.set(entry.group, []);
      order.push(entry.group);
    }
    byGroup.get(entry.group)?.push(entry);
  }

  return order.map((group) => {
    const items = byGroup.get(group) ?? [];
    return {
      group,
      groupLabel: items[0].groupLabel,
      icon: items[0].icon,
      items: items.slice(0, GLOBAL_SEARCH_GROUP_LIMIT),
      totalMatches: items.length,
    };
  });
}
