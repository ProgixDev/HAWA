import type { ArticleStatus, UserObjective, UserPlan } from '@/types';

export type SpiritualValidationStatus =
  | 'unvalidated'
  | 'pending_review'
  | 'in_review'
  | 'changes_requested'
  | 'validated'
  | 'rejected';

export type SpiritualModule = 'articles' | 'hijri' | 'ramadan_qadaa' | 'nifas';

export interface SpiritualArticle {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  body?: string;
  category: string;
  tags: string[];
  coverImage?: string;
  objectives: UserObjective[];
  access: UserPlan;
  publicationStatus: ArticleStatus;
  validationStatus: SpiritualValidationStatus;
  validationType: 'religious';
  reviewer?: string;
  internalNotes?: string;
  version: number;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
}

export interface SpiritualValidationRecord {
  id: string;
  articleId: string;
  contentTitle: string;
  validationType: 'religious' | 'medical';
  category: string;
  submittedBy?: string;
  reviewer?: string;
  submittedAt?: string;
  status: SpiritualValidationStatus;
  updatedAt?: string;
  version: number;
  reviewerComments?: string;
  internalNotes?: string;
  requestedCorrections?: string;
}

export interface SpiritualFeatureConfiguration {
  module: SpiritualModule;
  enabled?: boolean;
  updatedAt?: string;
  hijriAdjustmentDays?: -1 | 0 | 1;
  calendarDisplayMode?: 'gregorian' | 'hijri' | 'dual';
  showHijriDate?: boolean;
  showGregorianDate?: boolean;
  showIslamicMarkers?: boolean;
  eventNotifications?: boolean;
  qadaaEnabled?: boolean;
  showRamadanMarkers?: boolean;
  educationalContentEnabled?: boolean;
  localRemindersEnabled?: boolean;
  postRamadanRemindersEnabled?: boolean;
  spiritualNotificationsEnabled?: boolean;
  nifasReferenceDays?: number;
  nifasRemindersEnabled?: boolean;
  nifasCompletionMessageEnabled?: boolean;
  nifasEducationalLinksEnabled?: boolean;
}

export interface SpiritualEvent {
  id: string;
  module: 'hijri' | 'ramadan_qadaa';
  title: string;
  hijriDate?: string;
  gregorianDate?: string;
  enabled?: boolean;
  notificationsEnabled?: boolean;
  visibleInApp?: boolean;
}

export interface SpiritualReminder {
  id: string;
  module: 'ramadan_qadaa' | 'nifas';
  title: string;
  body: string;
  timing?: string;
  enabled?: boolean;
  updatedAt?: string;
}

export interface SpiritualAuditEntry {
  id: string;
  module: SpiritualModule;
  action: string;
  admin?: string;
  target?: string;
  reason?: string;
  timestamp?: string;
}
