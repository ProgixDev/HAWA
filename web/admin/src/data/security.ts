import type { AdminRole, AdminUser } from '@/types';
import { CURRENT_ADMIN } from '@/config/admin';

export type PermissionKey =
  | 'dashboard.view'
  | 'users.view'
  | 'users.edit'
  | 'users.suspend'
  | 'users.delete'
  | 'content.view'
  | 'content.create'
  | 'content.edit'
  | 'content.delete'
  | 'spiritual.view'
  | 'spiritual.edit'
  | 'notifications.view'
  | 'notifications.manage'
  | 'subscriptions.view'
  | 'subscriptions.manage'
  | 'exports.view'
  | 'support.view'
  | 'support.manage'
  | 'analytics.view'
  | 'configuration.view'
  | 'configuration.objectives'
  | 'configuration.flags'
  | 'configuration.themes'
  | 'configuration.settings'
  | 'security.admins.view'
  | 'security.admins.manage'
  | 'security.roles.view'
  | 'security.roles.manage';

export type PermissionDefinition = {
  key: PermissionKey;
  label: string;
};

export type PermissionGroup = {
  id: string;
  label: string;
  permissions: PermissionDefinition[];
};

export type SecurityRole = {
  id: string;
  technicalRole?: AdminRole;
  name: string;
  description: string;
  permissions: PermissionKey[];
  active: boolean;
  system: boolean;
};

export type SecurityAdministrator = Omit<AdminUser, 'role'> & {
  roleId: string;
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    permissions: [{ key: 'dashboard.view', label: 'Voir le tableau de bord' }],
  },
  {
    id: 'users',
    label: 'Utilisatrices',
    permissions: [
      { key: 'users.view', label: 'Voir' },
      { key: 'users.edit', label: 'Modifier' },
      { key: 'users.suspend', label: 'Suspendre' },
      { key: 'users.delete', label: 'Supprimer' },
    ],
  },
  {
    id: 'content',
    label: 'Contenus',
    permissions: [
      { key: 'content.view', label: 'Voir' },
      { key: 'content.create', label: 'Créer' },
      { key: 'content.edit', label: 'Modifier' },
      { key: 'content.delete', label: 'Supprimer' },
    ],
  },
  {
    id: 'spiritual',
    label: 'Repères spirituels',
    permissions: [
      { key: 'spiritual.view', label: 'Voir' },
      { key: 'spiritual.edit', label: 'Modifier' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    permissions: [
      { key: 'notifications.view', label: 'Voir' },
      { key: 'notifications.manage', label: 'Gérer' },
    ],
  },
  {
    id: 'subscriptions',
    label: 'Abonnements',
    permissions: [
      { key: 'subscriptions.view', label: 'Voir' },
      { key: 'subscriptions.manage', label: 'Gérer' },
    ],
  },
  {
    id: 'operations',
    label: 'Opérations',
    permissions: [
      { key: 'exports.view', label: 'Voir les exports médicaux' },
      { key: 'support.view', label: 'Voir le support' },
      { key: 'support.manage', label: 'Gérer le support' },
      { key: 'analytics.view', label: 'Voir les analytics' },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    permissions: [
      { key: 'configuration.view', label: 'Voir' },
      { key: 'configuration.objectives', label: 'Modifier les objectifs' },
      { key: 'configuration.flags', label: 'Modifier les feature flags' },
      { key: 'configuration.themes', label: 'Modifier les thèmes' },
      { key: 'configuration.settings', label: 'Modifier les paramètres globaux' },
    ],
  },
  {
    id: 'security',
    label: 'Sécurité',
    permissions: [
      { key: 'security.admins.view', label: 'Voir les administrateurs' },
      { key: 'security.admins.manage', label: 'Gérer les administrateurs' },
      { key: 'security.roles.view', label: 'Voir les rôles' },
      { key: 'security.roles.manage', label: 'Gérer les rôles' },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.key)
);

const permissions = (...keys: PermissionKey[]) => keys;

// These seven system definitions mirror the existing AdminRole union in
// src/types/index.ts. Custom session roles may be added without duplicating
// the technical role enum or pretending they are persisted remotely.
export const INITIAL_SECURITY_ROLES: SecurityRole[] = [
  {
    id: 'super_admin',
    technicalRole: 'super_admin',
    name: 'Super Admin',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: ALL_PERMISSION_KEYS,
    active: true,
    system: true,
  },
  {
    id: 'content_manager',
    technicalRole: 'content_manager',
    name: 'Responsable contenu',
    description: 'Gestion des articles, médias et catégories',
    permissions: permissions(
      'dashboard.view',
      'content.view',
      'content.create',
      'content.edit',
      'content.delete',
      'configuration.view',
      'configuration.themes'
    ),
    active: true,
    system: false,
  },
  {
    id: 'medical_reviewer',
    technicalRole: 'medical_reviewer',
    name: 'Réviseur médical',
    description: 'Révision des contenus médicaux et consultation des exports',
    permissions: permissions('dashboard.view', 'content.view', 'content.edit', 'exports.view'),
    active: true,
    system: false,
  },
  {
    id: 'religious_reviewer',
    technicalRole: 'religious_reviewer',
    name: 'Réviseur religieux',
    description: 'Validation des contenus et repères spirituels',
    permissions: permissions('dashboard.view', 'content.view', 'spiritual.view', 'spiritual.edit'),
    active: true,
    system: false,
  },
  {
    id: 'support_agent',
    technicalRole: 'support_agent',
    name: 'Support',
    description: 'Gestion des demandes des utilisatrices',
    permissions: permissions('dashboard.view', 'users.view', 'support.view', 'support.manage'),
    active: true,
    system: false,
  },
  {
    id: 'subscription_manager',
    technicalRole: 'subscription_manager',
    name: 'Gestionnaire abonnements',
    description: 'Gestion des plans, tarifs et abonnements actifs',
    permissions: permissions(
      'dashboard.view',
      'users.view',
      'subscriptions.view',
      'subscriptions.manage',
      'analytics.view'
    ),
    active: true,
    system: false,
  },
  {
    id: 'analytics_viewer',
    technicalRole: 'analytics_viewer',
    name: 'Analyste',
    description: 'Consultation du tableau de bord et des analytics',
    permissions: permissions('dashboard.view', 'analytics.view'),
    active: true,
    system: false,
  },
];

export const INITIAL_SECURITY_ADMINISTRATORS: SecurityAdministrator[] = [
  {
    id: CURRENT_ADMIN.id,
    name: CURRENT_ADMIN.name,
    email: CURRENT_ADMIN.email,
    roleId: CURRENT_ADMIN.role,
    status: 'active',
    twoFactorEnabled: false,
    lastActivityAt: '2026-09-08T14:32:00+01:00',
    avatarInitials: CURRENT_ADMIN.avatarInitials,
  },
  {
    id: 'admin-sarah',
    name: 'Sarah',
    email: 'sarah@awa.com',
    roleId: 'content_manager',
    status: 'active',
    twoFactorEnabled: false,
    lastActivityAt: '2026-09-07T10:15:00+01:00',
    avatarInitials: 'S',
  },
  {
    id: 'admin-yasmine',
    name: 'Yasmine',
    email: 'yasmine@awa.com',
    roleId: 'medical_reviewer',
    status: 'active',
    twoFactorEnabled: true,
    lastActivityAt: '2026-09-06T16:20:00+01:00',
    avatarInitials: 'Y',
  },
  {
    id: 'admin-nourhene',
    name: 'Nourhene',
    email: 'nourhene@awa.com',
    roleId: 'religious_reviewer',
    status: 'disabled',
    twoFactorEnabled: true,
    lastActivityAt: '2026-09-05T09:45:00+01:00',
    avatarInitials: 'N',
  },
  {
    id: 'admin-lyna',
    name: 'Lyna',
    email: 'lyna@awa.com',
    roleId: 'support_agent',
    status: 'active',
    twoFactorEnabled: false,
    lastActivityAt: '2026-09-04T11:10:00+01:00',
    avatarInitials: 'L',
  },
  {
    id: 'admin-inaya',
    name: 'Inaya',
    email: 'inaya@awa.com',
    roleId: 'subscription_manager',
    status: 'active',
    twoFactorEnabled: true,
    lastActivityAt: '2026-09-03T08:25:00+01:00',
    avatarInitials: 'I',
  },
  {
    id: 'admin-melissa',
    name: 'Mélissa',
    email: 'melissa@awa.com',
    roleId: 'analytics_viewer',
    status: 'disabled',
    twoFactorEnabled: false,
    lastActivityAt: '2026-08-29T17:40:00+01:00',
    avatarInitials: 'M',
  },
];

export function normalizeSecuritySearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('fr-FR');
}
