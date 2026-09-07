import {
  mockSpiritualArticles,
  mockSpiritualConfigurations,
  mockSpiritualEvents,
  mockSpiritualHistory,
  mockSpiritualReminders,
  mockSpiritualValidations,
} from '@/data/mock/spiritual';
import type {
  SpiritualArticle,
  SpiritualAuditEntry,
  SpiritualEvent,
  SpiritualFeatureConfiguration,
  SpiritualModule,
  SpiritualReminder,
  SpiritualValidationRecord,
} from '@/types/spiritual';

export class SpiritualPersistenceUnavailableError extends Error {
  constructor() {
    super(
      'Aucun service de configuration spirituelle n’est connecté. Aucune modification n’a été enregistrée.'
    );
    this.name = 'SpiritualPersistenceUnavailableError';
  }
}

export async function getSpiritualArticles(): Promise<SpiritualArticle[]> {
  return mockSpiritualArticles.map((article) => ({ ...article }));
}

export async function getSpiritualValidations(): Promise<SpiritualValidationRecord[]> {
  return mockSpiritualValidations.map((validation) => ({ ...validation }));
}

export async function getSpiritualConfiguration(
  module: SpiritualModule
): Promise<SpiritualFeatureConfiguration> {
  return (
    mockSpiritualConfigurations.find((configuration) => configuration.module === module) ?? {
      module,
    }
  );
}

export async function getSpiritualEvents(module: SpiritualEvent['module']) {
  return mockSpiritualEvents
    .filter((event) => event.module === module)
    .map((event) => ({ ...event }));
}

export async function getSpiritualReminders(module: SpiritualReminder['module']) {
  return mockSpiritualReminders
    .filter((reminder) => reminder.module === module)
    .map((reminder) => ({ ...reminder }));
}

export async function getSpiritualHistory(module: SpiritualModule): Promise<SpiritualAuditEntry[]> {
  return mockSpiritualHistory
    .filter((entry) => entry.module === module)
    .map((entry) => ({ ...entry }));
}

export async function saveSpiritualConfiguration(
  _configuration: SpiritualFeatureConfiguration
): Promise<never> {
  throw new SpiritualPersistenceUnavailableError();
}

export async function mutateSpiritualContent(_action: string, _targetId?: string): Promise<never> {
  throw new SpiritualPersistenceUnavailableError();
}

export const spiritualCapabilities = {
  source: 'mock' as const,
  persistentSettings: false,
  contentMutations: false,
  reviewWorkflow: false,
  reviewerDirectory: false,
  auditLogging: false,
  officialHijriSynchronization: false,
};
