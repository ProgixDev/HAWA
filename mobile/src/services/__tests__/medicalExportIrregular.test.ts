import AsyncStorage from '@react-native-async-storage/async-storage';
import {buildIrregularExportDays} from '../medicalExportReaders';
import {buildMedicalExport} from '../medicalExportOrchestrator';
import {getExportConfigurationForObjective} from '../../config/objectiveExportConfig';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {saveIrregularFatigueEntry, saveIrregularJournalEntry} from '../../state/irregularJournalStore';

// medicalExportReaders.ts imports privateNotesEncryption.ts/
// privateJournalEncryption.ts at module scope (react-native-keychain-backed);
// mocked like every other export test. The real dailyJournalStore and
// irregularJournalStore run against the in-memory AsyncStorage mock (both
// stores are module singletons: every test below therefore uses its own
// distinct dates).
jest.mock('../privateNotesEncryption', () => ({resolveNoteSection: jest.fn()}));
jest.mock('../privateJournalEncryption', () => ({resolveIntimacySection: jest.fn()}));

const now = new Date('2026-08-25T12:00:00');

const ALL_SOPK_CATEGORIES = ['period', 'acne', 'hairGrowth', 'pain', 'fatigue', 'mood', 'weight'];

const linesFor = (days: {date: string; categories: {category: string; lines: string[]}[]}[], date: string, category: string) =>
  days.find(day => day.date === date)?.categories.find(item => item.category === category)?.lines;

beforeAll(async () => {
  await AsyncStorage.clear();
});

describe('buildIrregularExportDays — SOPK store data', () => {
  it('exports acne, hair growth, pain (types + zones), mood and weight from the SOPK store', async () => {
    const date = '2026-08-01';
    await saveIrregularJournalEntry(date, 'acne', 'Modérée', {areas: ['Menton', 'Joues']});
    await saveIrregularJournalEntry(date, 'hairGrowth', 'Légère', {areas: ['Visage']});
    // pain: `areas` = pain TYPES, `symptoms` = body ZONES.
    await saveIrregularJournalEntry(date, 'pain', 'Forte', {areas: ['Crampes'], symptoms: ['Bas-ventre']});
    await saveIrregularJournalEntry(date, 'mood', 'Bien', {});
    await saveIrregularJournalEntry(date, 'weight', '64,2 kg', {weightFeeling: 'Stable'});

    const {days, notices} = await buildIrregularExportDays(ALL_SOPK_CATEGORIES, 'all', now);

    expect(notices).toEqual([]);
    expect(linesFor(days, date, 'acne')).toEqual(['Modérée', 'Zones : Menton, Joues']);
    expect(linesFor(days, date, 'hairGrowth')).toEqual(['Légère', 'Zones : Visage']);
    expect(linesFor(days, date, 'pain')).toEqual(['Forte', 'Types : Crampes', 'Zones : Bas-ventre']);
    expect(linesFor(days, date, 'mood')).toEqual(['Bien']);
    expect(linesFor(days, date, 'weight')).toEqual(['64,2 kg', 'Ressenti : Stable']);
    // No period recorded that day -> no period line at all.
    expect(linesFor(days, date, 'period')).toBeUndefined();
  });

  it('exports fatigue with its associated symptoms in the canonical (top-level) shape', async () => {
    const date = '2026-08-02';
    await saveIrregularFatigueEntry(date, 'Forte', ['Vertiges', 'Somnolence']);

    const {days} = await buildIrregularExportDays(['fatigue'], 'all', now);
    expect(linesFor(days, date, 'fatigue')).toEqual(['Forte', 'Symptômes associés : Vertiges, Somnolence']);
  });

  it('still reads fatigue associated symptoms saved in the legacy details.fatigue.symptoms shape', async () => {
    // The store singleton in this file is already hydrated, so load the exact
    // raw shape an older app version persisted into a fresh module instance.
    let run!: Promise<{days: {date: string; categories: {category: string; lines: string[]}[]}[]}>;
    jest.isolateModules(() => {
      const storage = require('@react-native-async-storage/async-storage').default;
      const readers = require('../medicalExportReaders');
      run = storage
        .setItem(
          '@hawa/irregular-journal/v1',
          JSON.stringify({
            '2026-08-03': {date: '2026-08-03', fatigue: 'Modérée', details: {fatigue: {symptoms: ['Maux de tête']}}},
          }),
        )
        .then(() => readers.buildIrregularExportDays(['fatigue'], 'all', now));
    });
    const {days} = await run;
    expect(linesFor(days, '2026-08-03', 'fatigue')).toEqual(['Modérée', 'Symptômes associés : Maux de tête']);
  });

  it('exports per-category notes only under "notes", labelled by category', async () => {
    const date = '2026-08-04';
    await saveIrregularJournalEntry(date, 'acne', 'Légère', {note: 'Poussée avant les règles', areas: []});
    await saveIrregularJournalEntry(date, 'mood', 'Bien', {note: 'Journée calme'});

    const withoutNotes = await buildIrregularExportDays(['acne', 'mood'], 'all', now);
    expect(JSON.stringify(withoutNotes.days)).not.toContain('Poussée avant les règles');
    expect(JSON.stringify(withoutNotes.days)).not.toContain('Journée calme');

    const {days} = await buildIrregularExportDays(['notes'], 'all', now);
    expect(linesFor(days, date, 'notes')).toEqual(['Acné : Poussée avant les règles', 'Humeur : Journée calme']);
    expect(days.find(day => day.date === date)?.categories.map(item => item.category)).toEqual(['notes']);
  });

  it('respects the period filter and the category selection', async () => {
    await saveIrregularJournalEntry('2026-08-05', 'mood', 'Bien', {});
    await saveIrregularJournalEntry('2025-01-05', 'mood', 'Triste', {});

    const {days} = await buildIrregularExportDays(['mood'], '3m', now);
    const dates = days.map(day => day.date);
    expect(dates).toContain('2026-08-05');
    expect(dates).not.toContain('2025-01-05');
    days.forEach(day => expect(day.categories.map(item => item.category)).toEqual(['mood']));

    const all = await buildIrregularExportDays(['mood'], 'all', now);
    expect(all.days.map(day => day.date)).toContain('2025-01-05');
  });
});

describe('buildIrregularExportDays — period (Règles): flow vs spotting vs no bleeding', () => {
  // Mirrors what IrregularJournalEntryScreen.save() writes for each answer.
  const savePeriodAnswer = async (
    date: string,
    status: 'yes' | 'no' | 'spotting',
    flowIntensity: string | undefined,
    intensity: 'none' | 'light' | 'moderate' | 'heavy' | 'veryHeavy',
    painLevel?: string,
  ) => {
    await saveJournalSection(date, 'flow', {intensity, pain: painLevel});
    await saveIrregularJournalEntry(date, 'period', status === 'no' ? 'Non' : status === 'spotting' ? 'Spotting' : `Oui · ${flowIntensity}`, {
      status,
      flowIntensity,
      painLevel,
    });
  };

  it('prints the flow intensity label for an actual period day', async () => {
    await savePeriodAnswer('2026-07-10', 'yes', 'Forte', 'heavy', 'Modérée');
    const {days} = await buildIrregularExportDays(['period'], 'all', now);
    expect(linesFor(days, '2026-07-10', 'period')).toEqual(['Flux : Abondant', 'Douleur : Modérée']);
  });

  it('prints "Spotting" — never "Aucun" — for a spotting day', async () => {
    await savePeriodAnswer('2026-07-11', 'spotting', undefined, 'none');
    const {days} = await buildIrregularExportDays(['period'], 'all', now);
    const lines = linesFor(days, '2026-07-11', 'period');
    expect(lines).toEqual(['Spotting']);
    expect(JSON.stringify(lines)).not.toContain('Aucun');
  });

  it('prints distinct no-bleeding wording for "Non"', async () => {
    await savePeriodAnswer('2026-07-12', 'no', undefined, 'none');
    const {days} = await buildIrregularExportDays(['period'], 'all', now);
    const lines = linesFor(days, '2026-07-12', 'period');
    expect(lines).toEqual(['Pas de règles']);
    expect(lines).not.toEqual(linesFor(days, '2026-07-11', 'period'));
    expect(JSON.stringify(lines)).not.toContain('Aucun');
  });

  it('produces no period line when nothing was recorded for the period question', async () => {
    await saveIrregularJournalEntry('2026-07-13', 'mood', 'Bien', {});
    const {days} = await buildIrregularExportDays(['period', 'mood'], 'all', now);
    expect(linesFor(days, '2026-07-13', 'period')).toBeUndefined();
    expect(linesFor(days, '2026-07-13', 'mood')).toEqual(['Bien']);
  });

  it('exports the period note under "notes" (SOPK copy), not under the period category', async () => {
    const date = '2026-07-14';
    await saveJournalSection(date, 'flow', {intensity: 'light', note: 'Début tôt'});
    await saveIrregularJournalEntry(date, 'period', 'Oui · Légère', {status: 'yes', flowIntensity: 'Légère', note: 'Début tôt'});

    const {days} = await buildIrregularExportDays(['period', 'notes'], 'all', now);
    expect(linesFor(days, date, 'period')).toEqual(['Flux : Léger']);
    expect(linesFor(days, date, 'notes')).toEqual(['Règles : Début tôt']);
  });
});

describe('buildMedicalExport — SOPK dispatch', () => {
  it('routes "irregular" to the SOPK reader and offers no Cycle-only category', async () => {
    const config = getExportConfigurationForObjective('irregular');
    const values = config.categories.map(category => category.value);
    ['cycle', 'sleep', 'activity', 'hydration', 'temperature', 'intimacy'].forEach(cycleOnly =>
      expect(values).not.toContain(cycleOnly),
    );

    await saveIrregularJournalEntry('2026-08-10', 'acne', 'Sévère', {areas: ['Dos']});
    const result = await buildMedicalExport('irregular', 'all', 'csv', ['acne'], now);
    if (result.kind !== 'csv') {throw new Error('expected a csv result');}
    expect(result.content).toContain('Acné');
    expect(result.content).toContain('Sévère ; Zones : Dos');
  });

  it('renders spotting as "Spotting" in the final CSV and PDF model', async () => {
    await saveJournalSection('2026-08-11', 'flow', {intensity: 'none'});
    await saveIrregularJournalEntry('2026-08-11', 'period', 'Spotting', {status: 'spotting'});

    const csv = await buildMedicalExport('irregular', 'all', 'csv', ['period'], now);
    if (csv.kind !== 'csv') {throw new Error('expected a csv result');}
    expect(csv.content).toContain('2026-08-11;Règles;Spotting');
    expect(csv.content).not.toContain('Aucun');

    const pdf = await buildMedicalExport('irregular', 'all', 'pdf', ['period'], now);
    if (pdf.kind !== 'pdf') {throw new Error('expected a pdf result');}
    const day = pdf.model.days.find(item => item.date === '2026-08-11');
    expect(day?.categories).toEqual([{label: 'Règles', lines: ['Spotting']}]);
  });

  it('silently drops a Cycle-only category smuggled in for "irregular"', async () => {
    const result = await buildMedicalExport('irregular', 'all', 'csv', ['sleep', 'intimacy', 'temperature'], now);
    expect(result.kind).toBe('empty');
  });

  it('opt-in sensitive notes: flagged sensitive and only exported when selected', async () => {
    const config = getExportConfigurationForObjective('irregular');
    expect(config.categories.find(category => category.value === 'notes')?.sensitive).toBe(true);
    config.categories
      .filter(category => category.value !== 'notes')
      .forEach(category => expect(category.sensitive).toBeFalsy());

    await saveIrregularJournalEntry('2026-08-12', 'mood', 'Bien', {note: 'NOTE SENSIBLE 42'});

    const without = await buildMedicalExport('irregular', 'all', 'csv', ['mood'], now);
    if (without.kind !== 'csv') {throw new Error('expected a csv result');}
    expect(without.content).not.toContain('NOTE SENSIBLE 42');

    const withNotes = await buildMedicalExport('irregular', 'all', 'csv', ['notes'], now);
    if (withNotes.kind !== 'csv') {throw new Error('expected a csv result');}
    expect(withNotes.content).toContain('NOTE SENSIBLE 42');
  });

  it('uses the exported SOPK days for the filename range (SOPK data without any shared journal entry)', async () => {
    const result = await buildMedicalExport('irregular', 'all', 'csv', ['mood'], now);
    if (result.kind !== 'csv') {throw new Error('expected a csv result');}
    // Earliest exported mood day in this file.
    expect(result.fromKey).toBe('2025-01-05');
    expect(result.toKey).toBe('2026-08-25');
  });
});
