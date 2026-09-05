import {buildMedicalExport} from '../medicalExportOrchestrator';
import {getAllJournalEntries} from '../../state/dailyJournalStore';
import {resolveNoteSection} from '../privateNotesEncryption';
import {resolveIntimacySection} from '../privateJournalEncryption';

// Explicit factories — privateNotesEncryption.ts/privateJournalEncryption.ts
// transitively import react-native-keychain, a native module unavailable in
// the Jest environment (same reasoning as every other native-adjacent test
// in this project — see cycleReminderScheduling.test.ts's own comment).
jest.mock('../../state/dailyJournalStore', () => ({
  getAllJournalEntries: jest.fn(),
}));
jest.mock('../privateNotesEncryption', () => ({
  resolveNoteSection: jest.fn(),
}));
jest.mock('../privateJournalEncryption', () => ({
  resolveIntimacySection: jest.fn(),
}));

const mockGetAllJournalEntries = getAllJournalEntries as jest.Mock;
const mockResolveNoteSection = resolveNoteSection as jest.Mock;
const mockResolveIntimacySection = resolveIntimacySection as jest.Mock;

const now = new Date('2026-08-25T12:00:00');

beforeEach(() => {
  jest.clearAllMocks();
  mockResolveNoteSection.mockResolvedValue({data: undefined, corrupted: false});
  mockResolveIntimacySection.mockResolvedValue({data: undefined, corrupted: false});
});

describe('buildMedicalExport — privacy boundary', () => {
  it('never decrypts or includes the private note when "notes" is not selected', async () => {
    mockGetAllJournalEntries.mockResolvedValue([
      {id: '1', date: '2026-08-24', symptoms: {names: ['Fatigue']}},
    ]);
    mockResolveNoteSection.mockResolvedValue({
      data: {text: 'PRIVATE NOTE TEST 123', updatedAt: '2026-08-24T10:00:00.000Z'},
      corrupted: false,
    });

    const result = await buildMedicalExport('cycle', 'all', 'csv', ['symptoms'], now);

    expect(mockResolveNoteSection).not.toHaveBeenCalled();
    if (result.kind === 'csv') {
      expect(result.content).not.toContain('PRIVATE NOTE TEST 123');
    } else {
      throw new Error('expected a csv result');
    }
  });

  it('includes the decrypted note only when "notes" is explicitly selected', async () => {
    mockGetAllJournalEntries.mockResolvedValue([{id: '1', date: '2026-08-24'}]);
    mockResolveNoteSection.mockResolvedValue({
      data: {text: 'PRIVATE NOTE TEST 123', updatedAt: '2026-08-24T10:00:00.000Z'},
      corrupted: false,
    });

    const result = await buildMedicalExport('cycle', 'all', 'csv', ['notes'], now);

    expect(mockResolveNoteSection).toHaveBeenCalledTimes(1);
    if (result.kind === 'csv') {
      expect(result.content).toContain('PRIVATE NOTE TEST 123');
    } else {
      throw new Error('expected a csv result');
    }
  });

  it('never decrypts intimacy data when "intimacy" is not selected', async () => {
    mockGetAllJournalEntries.mockResolvedValue([{id: '1', date: '2026-08-24', mood: {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3}}]);

    await buildMedicalExport('cycle', 'all', 'csv', ['mood'], now);

    expect(mockResolveIntimacySection).not.toHaveBeenCalled();
  });

  it('returns "empty" when no category is selected', async () => {
    mockGetAllJournalEntries.mockResolvedValue([{id: '1', date: '2026-08-24', mood: {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3}}]);

    const result = await buildMedicalExport('cycle', 'all', 'csv', [], now);
    expect(result.kind).toBe('empty');
  });

  it('returns "empty" when the selected categories have no data in the selected period', async () => {
    mockGetAllJournalEntries.mockResolvedValue([{id: '1', date: '2026-08-24'}]);

    const result = await buildMedicalExport('cycle', 'all', 'csv', ['symptoms', 'weight'], now);
    expect(result.kind).toBe('empty');
  });

  it('builds a pdf report model with only the selected categories', async () => {
    mockGetAllJournalEntries.mockResolvedValue([
      {id: '1', date: '2026-08-24', symptoms: {names: ['Fatigue']}, mood: {level: 'sad', energy: 1, stress: 4, irritability: 3, motivation: 1}},
    ]);

    const result = await buildMedicalExport('cycle', 'all', 'pdf', ['symptoms'], now);

    if (result.kind !== 'pdf') {throw new Error('expected a pdf result');}
    const labels = result.model.days.flatMap(day => day.categories.map(category => category.label));
    expect(labels).toEqual(['Symptômes']);
    expect(labels).not.toContain('Humeur');
  });
});
