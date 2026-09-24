import { contentArticles } from './content';
import type {
  SpiritualArticle,
  SpiritualAuditEntry,
  SpiritualEvent,
  SpiritualFeatureConfiguration,
  SpiritualReminder,
  SpiritualValidationRecord,
} from '@/types/spiritual';

export const mockSpiritualArticles: SpiritualArticle[] = contentArticles
  .filter((article) => article.contentType === 'religious')
  .map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    shortDescription: article.shortDescription,
    body: article.content,
    category: article.category,
    tags: article.tags,
    coverImage: article.coverImage,
    objectives: [article.objective],
    access: article.plan,
    publicationStatus: article.status,
    validationStatus: 'unvalidated',
    validationType: 'religious',
    version: 1,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
  }));

// Titles mirror mobile/src/screens/library's real religious articles
// (NifasFiqhArticleScreen, IstihadaArticleScreen, PrayerDuringMenstruationArticleScreen,
// FiqhWomenIntroArticleScreen) and this file's own medical categories — no
// invented content, only realistic demo records for the review workflow.
export const mockSpiritualValidations: SpiritualValidationRecord[] = [
  {
    id: 'val-001',
    articleId: 'nifas-fiqh',
    contentTitle: 'Nifas : repères jurisprudentiels',
    validationType: 'religious',
    category: 'Cycle & pratique religieuse',
    submittedBy: 'Sarah',
    submittedAt: '2026-09-05T09:10:00+01:00',
    status: 'pending_review',
    updatedAt: '2026-09-05T09:10:00+01:00',
    version: 1,
  },
  {
    id: 'val-002',
    articleId: 'istihada',
    contentTitle: 'Comprendre l’istihâda',
    validationType: 'religious',
    category: 'Cycle & pratique religieuse',
    submittedBy: 'Sarah',
    reviewer: 'Nourhene',
    submittedAt: '2026-09-02T14:20:00+01:00',
    status: 'in_review',
    updatedAt: '2026-09-03T11:05:00+01:00',
    version: 1,
  },
  {
    id: 'val-003',
    articleId: 'prayer-during-menstruation',
    contentTitle: 'La prière pendant les règles',
    validationType: 'religious',
    category: 'Cycle & pratique religieuse',
    submittedBy: 'Sarah',
    reviewer: 'Nourhene',
    submittedAt: '2026-08-27T10:00:00+01:00',
    status: 'validated',
    updatedAt: '2026-08-29T16:40:00+01:00',
    reviewerComments: 'Formulation neutre entre écoles, conforme aux repères déjà validés.',
    version: 2,
    history: [
      {
        id: 'hist-val-003-1',
        previousStatus: 'in_review',
        newStatus: 'validated',
        reviewer: 'Nourhene',
        comment: 'Formulation neutre entre écoles, conforme aux repères déjà validés.',
        date: '2026-08-29T16:40:00+01:00',
      },
    ],
  },
  {
    id: 'val-004',
    articleId: 'fiqh-women-intro',
    contentTitle: 'Introduction au fiqh féminin',
    validationType: 'religious',
    category: 'Cycle & pratique religieuse',
    submittedBy: 'Sarah',
    reviewer: 'Nourhene',
    submittedAt: '2026-08-20T08:30:00+01:00',
    status: 'rejected',
    updatedAt: '2026-08-22T09:15:00+01:00',
    reviewerComments:
      'La divergence entre écoles doit rester présentée de façon neutre, sans trancher.',
    requestedCorrections: 'Reformuler le paragraphe sur les écoles juridiques.',
    version: 1,
    history: [
      {
        id: 'hist-val-004-1',
        previousStatus: 'in_review',
        newStatus: 'rejected',
        reviewer: 'Nourhene',
        comment: 'La divergence entre écoles doit rester présentée de façon neutre, sans trancher.',
        date: '2026-08-22T09:15:00+01:00',
      },
    ],
  },
  {
    id: 'val-005',
    articleId: 'pcos-cycle-fertility',
    contentTitle: 'SOPK : décrypter les cycles irréguliers',
    validationType: 'medical',
    category: 'SOPK',
    submittedBy: 'Sarah',
    reviewer: 'Yasmine',
    submittedAt: '2026-09-01T13:00:00+01:00',
    status: 'changes_requested',
    updatedAt: '2026-09-02T10:20:00+01:00',
    reviewerComments: 'Préciser que ces repères ne remplacent pas un avis médical individualisé.',
    requestedCorrections: 'Ajouter un rappel de consultation avant le résumé.',
    version: 1,
    history: [
      {
        id: 'hist-val-005-1',
        previousStatus: 'in_review',
        newStatus: 'changes_requested',
        reviewer: 'Yasmine',
        comment: 'Préciser que ces repères ne remplacent pas un avis médical individualisé.',
        date: '2026-09-02T10:20:00+01:00',
      },
    ],
  },
  {
    id: 'val-006',
    articleId: 'understand-menstrual-flow',
    contentTitle: 'Comprendre les saignements entre les règles',
    validationType: 'medical',
    category: 'Cycle menstruel',
    submittedBy: 'Sarah',
    submittedAt: '2026-09-06T15:45:00+01:00',
    status: 'pending_review',
    updatedAt: '2026-09-06T15:45:00+01:00',
    version: 1,
  },
];

export const mockSpiritualConfigurations: SpiritualFeatureConfiguration[] = [
  { module: 'articles' },
  { module: 'hijri' },
  { module: 'ramadan_qadaa' },
  { module: 'nifas', nifasReferenceDays: 40 },
];

export const mockSpiritualEvents: SpiritualEvent[] = [];
export const mockSpiritualReminders: SpiritualReminder[] = [];
export const mockSpiritualHistory: SpiritualAuditEntry[] = [];
