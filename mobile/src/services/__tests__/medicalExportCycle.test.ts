import AsyncStorage from '@react-native-async-storage/async-storage';
import {buildCycleExportDays} from '../medicalExportReaders';
import {buildMedicalExport} from '../medicalExportOrchestrator';
import {OBJECTIVE_EXPORT_CONFIG} from '../../config/objectiveExportConfig';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {getCyclePreferences, hydrateCyclePreferences, setCyclePreferences} from '../../state/onboardingPreferences';
import {recordConfirmedPeriodEnd} from '../../state/confirmedPeriodHistoryStore';
import {resolveNoteSection} from '../privateNotesEncryption';
import {resolveIntimacySection} from '../privateJournalEncryption';
import {formatFullDate} from '../../utils/cycleMath';

// M14 — the Cycle export offers only categories Cycle can really record, and
// now includes the recorded / confirmed period dates. Real stores (in-memory
// AsyncStorage mock); the stores are module singletons, so the tests below
// build on one another's data in a fixed order.
jest.mock('../privateNotesEncryption', () => ({resolveNoteSection: jest.fn()}));
jest.mock('../privateJournalEncryption', () => ({resolveIntimacySection: jest.fn()}));

const mockResolveNote = resolveNoteSection as jest.Mock;
const mockResolveIntimacy = resolveIntimacySection as jest.Mock;

const now = new Date('2026-08-25T12:00:00');
const fullDate = (key: string) => formatFullDate(new Date(`${key}T12:00:00`));
const periodLines = (days: {date: string; categories: {category: string; lines: string[]}[]}[], date: string) =>
  days.find(day => day.date === date)?.categories.find(category => category.category === 'periods')?.lines;

beforeAll(async () => {
  await AsyncStorage.clear();
  await hydrateCyclePreferences();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockResolveNote.mockResolvedValue({data: undefined, corrupted: false});
  mockResolveIntimacy.mockResolvedValue({data: undefined, corrupted: false});
});

describe('Cycle export configuration — only categories Cycle can record', () => {
  const values = OBJECTIVE_EXPORT_CONFIG.cycle.categories.map(category => category.value);

  it('offers the period dates plus the categories Cycle’s own journal writes', () => {
    expect(values).toEqual(['periods', 'flow', 'symptoms', 'mood', 'sleep', 'activity', 'hydration', 'notes', 'intimacy']);
  });

  it('no longer offers the never-populated "cycle", "temperature" and "weight" categories', () => {
    ['cycle', 'temperature', 'weight'].forEach(removed => expect(values).not.toContain(removed));
  });

  it('keeps notes and intimacy sensitive (explicit opt-in)', () => {
    expect(OBJECTIVE_EXPORT_CONFIG.cycle.categories.filter(category => category.sensitive).map(c => c.value)).toEqual([
      'notes',
      'intimacy',
    ]);
  });

  it('Conceive still owns its temperature category', () => {
    expect(OBJECTIVE_EXPORT_CONFIG.conceive.categories.map(category => category.value)).toContain('temperature');
  });
});

describe('buildCycleExportDays — period dates', () => {
  it('exports nothing for periods while no real cycle data has been confirmed (no placeholder period)', async () => {
    const {days} = await buildCycleExportDays(['periods'], 'all', now);
    expect(days).toEqual([]);
  });

  it('exports each recorded period; a confirmed end is marked confirmed, an unconfirmed one is not presented as fact', async () => {
    // Real writers: Cycle information / Dashboard record the start, the
    // "Mes règles sont terminées" flow records the confirmed end.
    await setCyclePreferences({...getCyclePreferences(), lastPeriodStart: new Date(2026, 0, 5), periodDuration: 5});
    await setCyclePreferences({...getCyclePreferences(), lastPeriodStart: new Date(2026, 6, 10), periodDuration: 5});
    await setCyclePreferences({...getCyclePreferences(), lastPeriodStart: new Date(2026, 7, 7), periodDuration: 5});
    await recordConfirmedPeriodEnd(new Date(2026, 6, 10), new Date(2026, 6, 13, 12, 0, 0));

    const {days} = await buildCycleExportDays(['periods'], '3m', now);

    // January is outside the 3-month window.
    expect(days.map(day => day.date)).toEqual(['2026-07-10', '2026-08-07']);
    expect(periodLines(days, '2026-07-10')).toEqual([
      'Début des règles',
      `Fin des règles (confirmée) : ${fullDate('2026-07-13')}`,
    ]);
    expect(periodLines(days, '2026-08-07')).toEqual([
      'Début des règles',
      'Fin des règles : non confirmée',
      `Fin estimée d’après la durée renseignée (non confirmée) : ${fullDate('2026-08-11')}`,
    ]);
  });

  it('"all" includes the older period too, in chronological order', async () => {
    const {days} = await buildCycleExportDays(['periods'], 'all', now);
    expect(days.map(day => day.date)).toEqual(['2026-01-05', '2026-07-10', '2026-08-07']);
    expect(periodLines(days, '2026-01-05')?.[1]).toBe('Fin des règles : non confirmée');
  });

  it('a period-start day that also has journal data shows the period first, then that day’s categories', async () => {
    await saveJournalSection('2026-07-10', 'flow', {intensity: 'moderate', periodStart: true});

    const {days} = await buildCycleExportDays(['periods', 'flow'], 'all', now);

    const day = days.find(item => item.date === '2026-07-10')!;
    expect(day.categories.map(category => category.category)).toEqual(['periods', 'flow']);
  });

  it('is not read at all when the periods category is not selected', async () => {
    await saveJournalSection('2026-07-11', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3});

    const {days} = await buildCycleExportDays(['mood'], 'all', now);

    expect(days.flatMap(day => day.categories.map(category => category.category))).not.toContain('periods');
    expect(days.some(day => day.date === '2026-08-07')).toBe(false);
  });
});

describe('buildCycleExportDays — categories Cycle cannot record', () => {
  it('ignores stale weight / temperature / cycle selections even if the shared journal holds such data', async () => {
    await saveJournalSection('2026-08-20', 'weight', {value: 61.4, unit: 'kg'});
    await saveJournalSection('2026-08-20', 'temperature', {value: 36.6, unit: 'C'});

    const {days} = await buildCycleExportDays(['weight', 'temperature', 'cycle'], 'all', now);

    expect(days.flatMap(day => day.categories)).toEqual([]);
  });

  it('exports the journal categories Cycle does write', async () => {
    await saveJournalSection('2026-08-21', 'symptoms', {names: ['Crampes']});
    await saveJournalSection('2026-08-21', 'hydration', {milliliters: 1500, glasses: 6});

    const {days} = await buildCycleExportDays(['symptoms', 'hydration'], 'all', now);

    const day = days.find(item => item.date === '2026-08-21')!;
    expect(day.categories.map(category => [category.category, category.lines])).toEqual([
      ['symptoms', ['Symptômes : Crampes']],
      ['hydration', ['Eau bue : 1500 ml', 'Verres : 6']],
    ]);
  });
});

describe('buildCycleExportDays — sensitive handling preserved', () => {
  it('resolves (decrypts) notes / intimacy only when explicitly selected', async () => {
    await buildCycleExportDays(['periods', 'flow'], 'all', now);
    expect(mockResolveNote).not.toHaveBeenCalled();
    expect(mockResolveIntimacy).not.toHaveBeenCalled();

    mockResolveNote.mockResolvedValue({data: {text: 'note privée', updatedAt: 'x'}, corrupted: false});
    const {days} = await buildCycleExportDays(['notes'], 'all', now);
    expect(mockResolveNote).toHaveBeenCalled();
    expect(days.flatMap(day => day.categories).some(category => category.lines.includes('note privée'))).toBe(true);
  });
});

describe('buildMedicalExport (cycle) — end to end', () => {
  it('a CSV carries the period rows with the confirmed / unconfirmed wording', async () => {
    const result = await buildMedicalExport('cycle', 'all', 'csv', ['periods'], now);

    if (result.kind !== 'csv') {throw new Error('expected a csv result');}
    expect(result.content).toContain('Dates des règles');
    expect(result.content).toContain('Fin des règles (confirmée)');
    expect(result.content).toContain('non confirmée');
    // 'all' range starts at the earliest real date (the January period).
    expect(result.fromKey).toBe('2026-01-05');
  });

  it('a stale "weight" selection is dropped by the orchestrator (not valid for Cycle) => empty', async () => {
    const result = await buildMedicalExport('cycle', 'all', 'csv', ['weight'], now);
    expect(result.kind).toBe('empty');
  });

  it('a PDF model lists the period category label', async () => {
    const result = await buildMedicalExport('cycle', '3m', 'pdf', ['periods'], now);
    if (result.kind !== 'pdf') {throw new Error('expected a pdf result');}
    const labels = result.model.days.flatMap(day => day.categories.map(category => category.label));
    expect(labels).toEqual(['Dates des règles', 'Dates des règles']);
  });
});
