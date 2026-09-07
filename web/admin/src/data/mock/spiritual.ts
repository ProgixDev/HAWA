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

export const mockSpiritualValidations: SpiritualValidationRecord[] = [];

export const mockSpiritualConfigurations: SpiritualFeatureConfiguration[] = [
  { module: 'articles' },
  { module: 'hijri' },
  { module: 'ramadan_qadaa' },
  { module: 'nifas', nifasReferenceDays: 40 },
];

export const mockSpiritualEvents: SpiritualEvent[] = [];
export const mockSpiritualReminders: SpiritualReminder[] = [];
export const mockSpiritualHistory: SpiritualAuditEntry[] = [];
