// ─────────────────────────────────────────────
// AWA Admin — Core TypeScript Types
// ─────────────────────────────────────────────

export type UserPlan = 'FREE' | 'PREMIUM';
export type UserStatus =
  | 'active'
  | 'suspended'
  | 'inactive'
  | 'disabled'
  | 'pending_verification'
  | 'deletion_pending'
  | 'deleted';
export type ArticleStatus =
  | 'draft'
  | 'review'
  | 'pending_validation'
  | 'validated'
  | 'published'
  | 'archived';
export type SubscriptionStatus = 'active' | 'trial' | 'cancelled' | 'expired' | 'payment_failed';
export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type ExportStatus = 'pending' | 'generated' | 'downloaded' | 'expired' | 'failed';
export type PrivacyRequestType = 'export' | 'deletion' | 'consent' | 'inquiry';
export type PrivacyRequestStatus = 'new' | 'in_progress' | 'completed' | 'rejected';
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'failed';
export type AdminRole =
  | 'super_admin'
  | 'content_manager'
  | 'medical_reviewer'
  | 'religious_reviewer'
  | 'support_agent'
  | 'subscription_manager'
  | 'analytics_viewer';

export type UserObjective =
  | 'cycle_menstruel'
  | 'ttc'
  | 'contraception'
  | 'sopk'
  | 'grossesse'
  | 'post_partum'
  | 'fausse_couche'
  | 'menopause';

export type Country = 'FR' | 'DZ' | 'MA' | 'TN' | 'BE' | 'CA' | 'CH' | 'other';

export type Madhhab = 'neutral' | 'maliki' | 'hanafi' | 'shafii' | 'hanbali' | 'other';

export type ContentType = 'medical' | 'educational' | 'religious';

export type FeatureFlagEnvironment = 'development' | 'staging' | 'production';

// ─────────────────────────────────────────────
// User
// ─────────────────────────────────────────────
export interface User {
  id: string;
  displayId: string;
  email?: string;
  isAnonymous: boolean;
  country: Country;
  objective: UserObjective;
  spiritualMode: boolean;
  plan: UserPlan;
  status: UserStatus;
  createdAt: string;
  lastActiveAt: string;
  language: 'fr' | 'ar' | 'en';
  notificationOptIn: boolean;
  premiumSince?: string;
  subscriptionProvider?: 'apple' | 'google' | 'stripe';
}

export interface ManagedUser extends User {
  name: string;
  billingCycle?: 'monthly' | 'annual';
  premiumExpiresAt?: string;
}

// ─────────────────────────────────────────────
// Article
// ─────────────────────────────────────────────
export interface Article {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  coverImage?: string;
  category: string;
  objective: UserObjective;
  plan: UserPlan;
  contentType: ContentType;
  author: string;
  reviewer?: string;
  status: ArticleStatus;
  publishedAt?: string;
  updatedAt: string;
  views: number;
  readingTime: number;
  featured: boolean;
  tags: string[];
  content?: string;
  isProgram?: boolean;
}

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  domain: 'medical' | 'religious';
  order: number;
  icon: string;
  color: string;
  active: boolean;
}

export type PremiumContentType =
  | 'article'
  | 'programme'
  | 'guide'
  | 'video'
  | 'audio'
  | 'template'
  | 'resource';

export interface PremiumContentItem {
  id: string;
  title: string;
  description: string;
  type: PremiumContentType;
  category: string;
  status: ArticleStatus;
  views: number;
  updatedAt: string;
  mediaId?: string;
}

export type MediaKind = 'image' | 'video' | 'document' | 'icon' | 'audio' | 'other';

export interface MediaAsset {
  id: string;
  name: string;
  kind: MediaKind;
  mimeType: string;
  size: number;
  category: string;
  uploadedAt: string;
  url: string;
  dimensions?: string;
  duration?: string;
  uploadedBy: string;
  usedBy: string[];
}

// ─────────────────────────────────────────────
// Subscription
// ─────────────────────────────────────────────
export interface Subscription {
  id: string;
  userId: string;
  userDisplayId: string;
  plan: 'monthly' | 'annual';
  provider: 'apple' | 'google' | 'stripe';
  country: Country;
  status: SubscriptionStatus;
  startDate: string;
  renewalDate?: string;
  amount: number;
  currency: string;
}

// ─────────────────────────────────────────────
// Support Ticket
// ─────────────────────────────────────────────
export interface SupportTicket {
  id: string;
  userId: string;
  userDisplayId: string;
  category: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Religious Article
// ─────────────────────────────────────────────
export interface ReligiousArticle {
  id: string;
  title: string;
  category: string;
  topic: string;
  madhhab: Madhhab;
  source: string;
  reviewerName: string;
  reviewerOrg: string;
  validationStatus: ArticleStatus;
  validationDate?: string;
  version: number;
  notes?: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Admin User
// ─────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  twoFactorEnabled: boolean;
  lastActivityAt: string;
  status: 'active' | 'disabled';
  avatarInitials: string;
}

// ─────────────────────────────────────────────
// Feature Flag
// ─────────────────────────────────────────────
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  environment: FeatureFlagEnvironment;
  enabled: boolean;
  rolloutPercent: number;
  updatedAt: string;
  updatedBy: string;
}

// ─────────────────────────────────────────────
// Export Request
// ─────────────────────────────────────────────
export interface ExportRequest {
  id: string;
  userId: string;
  format: 'PDF' | 'CSV';
  status: ExportStatus;
  createdAt: string;
  expiresAt?: string;
  downloadedAt?: string;
}

// ─────────────────────────────────────────────
// Privacy Request
// ─────────────────────────────────────────────
export interface PrivacyRequest {
  id: string;
  userId: string;
  type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  createdAt: string;
  deadline: string;
  assignedTo?: string;
  notes?: string;
}

// ─────────────────────────────────────────────
// Audit Log
// ─────────────────────────────────────────────
export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: 'success' | 'failure';
  ipAddress: string;
  device: string;
  timestamp: string;
}

// ─────────────────────────────────────────────
// Dashboard KPI
// ─────────────────────────────────────────────
export interface KpiMetric {
  id: string;
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percent';
  alert?: boolean;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface ChartDataPoint {
  date: string;
  value: number;
  secondary?: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface AlertItem {
  id: string;
  label: string;
  count: number;
  href: string;
  severity: 'warning' | 'danger' | 'info';
}
