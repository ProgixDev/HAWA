import type { Country } from '@/types';

export type MedicalExportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export type MedicalExportType =
  | 'cycle'
  | 'complete'
  | 'medical_history'
  | 'medical_report'
  | 'symptoms'
  | 'fertility'
  | 'pregnancy'
  | 'tracking';

export type MedicalExportFormat = 'PDF' | 'CSV' | 'ZIP';

export interface MedicalExportRequest {
  id: string;
  userId: string;
  userDisplayId: string;
  userName: string;
  userEmail: string;
  type: MedicalExportType;
  period: string;
  format: MedicalExportFormat;
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  status: MedicalExportStatus;
  sizeBytes?: number;
  requestedBy: string;
  errorMessage?: string;
}

export interface MedicalExportOverview {
  requests: MedicalExportRequest[];
  distribution: Array<{ name: string; value: number; color: string }>;
  kpis: Array<{
    id: string;
    label: string;
    value: number | string;
    trend: number;
    tone: 'primary' | 'success' | 'info' | 'danger' | 'warning';
    icon: 'database' | 'check' | 'clock' | 'alert' | 'timer';
  }>;
}

export type SupportStatus = 'new' | 'waiting' | 'in_progress' | 'resolved' | 'closed';
export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportCategory =
  | 'account'
  | 'application'
  | 'subscription'
  | 'payment'
  | 'feature'
  | 'content'
  | 'data'
  | 'medical_export'
  | 'notifications'
  | 'other';

export interface SupportMessage {
  id: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  content: string;
  createdAt: string;
  internal: boolean;
}

export interface AdminSupportTicket {
  id: string;
  userId: string;
  userDisplayId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  messages: SupportMessage[];
}

export interface SupportOverview {
  tickets: AdminSupportTicket[];
  kpis: Array<{
    id: string;
    label: string;
    value: number | string;
    trend?: number;
    tone: 'primary' | 'success' | 'info' | 'warning';
    icon: 'tickets' | 'resolved' | 'progress' | 'waiting' | 'timer';
  }>;
}

export type AnalyticsPeriod = '7d' | '30d' | '3m' | '6m' | '12m' | 'custom';

export interface AnalyticsKpi {
  id: string;
  label: string;
  value: number;
  trend: number;
  format: 'number' | 'currency' | 'percent';
  icon: 'users' | 'activity' | 'premium' | 'revenue';
}

export interface AnalyticsDataset {
  period: AnalyticsPeriod;
  periodLabel: string;
  kpis: AnalyticsKpi[];
  userGrowth: Array<{ label: string; total: number; active: number }>;
  acquisition: Array<{ name: string; value: number; color: string }>;
  engagement: Array<{ label: string; value: string; change: number }>;
  retention: Array<{ label: 'J1' | 'J7' | 'J30'; value: number }>;
  subscriptions: Array<{
    plan: 'Gratuit' | 'Premium Mensuel' | 'Premium Annuel';
    users: number;
    share: number;
    color: string;
  }>;
  conversion: Array<{ label: string; value: number }>;
  content: Array<{
    id: string;
    title: string;
    category: string;
    views: number;
    completedReads: number;
    completionRate: number;
  }>;
  spiritualUsage: Array<{ label: string; users: number; sessions: number }>;
  countries: Array<{
    country: string;
    code: Country;
    users: number;
    premium: number;
    conversion: number;
  }>;
}

export type AnalyticsDatasets = Record<AnalyticsPeriod, AnalyticsDataset>;
