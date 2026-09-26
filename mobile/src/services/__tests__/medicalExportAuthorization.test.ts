import AsyncStorage from '@react-native-async-storage/async-storage';
import {buildMedicalExport} from '../medicalExportOrchestrator';
import {resolveNoteSection, encryptNoteSection} from '../privateNotesEncryption';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {isIntimacyUnlocked, lockIntimacy, unlockIntimacy} from '../../state/privateSectionAuthStore';
import {exportRequiresPrivateUnlock} from '../../config/objectiveExportConfig';

// M44, service layer: buildMedicalExport is the only path to the readers that
// decrypt private content, so it refuses to run any reader for a sensitive
// category until the EXISTING private-section unlock (privateSectionAuthStore)
// has succeeded. The screen-level flow (PIN screens, cancel, failed PIN,
// resume) is covered in screens/__tests__/MedicalExportSensitiveUnlock.test.tsx.

jest.mock('../privateNotesEncryption', () => {
  const actual = jest.requireActual('../privateNotesEncryption');
  return {...actual, resolveNoteSection: jest.fn(actual.resolveNoteSection)};
});

const mockResolveNoteSection = resolveNoteSection as jest.Mock;
const now = new Date('2026-08-25T12:00:00');
const DATE = '2026-08-21';
const SECRET = 'ZZ-AUTH-SECRET-NOTE';

beforeAll(async () => {
  await AsyncStorage.clear();
  await saveJournalSection(DATE, 'symptoms', {names: ['Fatigue'], severity: 'mild'});
  await saveJournalSection(DATE, 'encryptedNote', await encryptNoteSection({text: SECRET, updatedAt: '2026-08-21T10:00:00.000Z'}));
});

beforeEach(() => {
  mockResolveNoteSection.mockClear();
  lockIntimacy();
});

afterEach(() => {
  lockIntimacy();
});

describe('buildMedicalExport — authorisation before decryption (M44)', () => {
  it('exportRequiresPrivateUnlock: true only when a sensitive category of THAT objective is selected', () => {
    expect(exportRequiresPrivateUnlock('cycle', ['symptoms', 'mood'])).toBe(false);
    expect(exportRequiresPrivateUnlock('cycle', ['symptoms', 'notes'])).toBe(true);
    expect(exportRequiresPrivateUnlock('cycle', ['intimacy'])).toBe(true);
    expect(exportRequiresPrivateUnlock('postpartum', ['lochia'])).toBe(true);
    expect(exportRequiresPrivateUnlock('cycle', [])).toBe(false);
    // 'lochia' is not a cycle category: never counted, never exported.
    expect(exportRequiresPrivateUnlock('cycle', ['lochia'])).toBe(false);
  });

  it('locked + sensitive category: returns "locked" and never reads or decrypts anything', async () => {
    expect(isIntimacyUnlocked()).toBe(false);
    const result = await buildMedicalExport('cycle', 'all', 'csv', ['symptoms', 'notes'], now);
    expect(result).toEqual({kind: 'locked'});
    expect(mockResolveNoteSection).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  it('locked + only non-sensitive categories: exports normally, decrypts nothing', async () => {
    const result = await buildMedicalExport('cycle', 'all', 'csv', ['symptoms'], now);
    expect(result.kind).toBe('csv');
    expect(mockResolveNoteSection).not.toHaveBeenCalled();
    if (result.kind === 'csv') {expect(result.content).not.toContain(SECRET);}
  });

  it('unlocked + sensitive category: decrypts and exports the note, and storage stays encrypted', async () => {
    unlockIntimacy();
    const result = await buildMedicalExport('cycle', 'all', 'csv', ['notes'], now);
    expect(mockResolveNoteSection).toHaveBeenCalled();
    if (result.kind !== 'csv') {throw new Error('expected a csv result');}
    expect(result.content).toContain(SECRET);

    const raw = (await AsyncStorage.getItem('@hawa/daily-journal/v1')) as string;
    expect(raw).not.toContain(SECRET);
    expect(raw).toContain('ciphertext');
  });

  it('the same gate protects every objective (a sensitive category never bypasses it)', async () => {
    const cases: Array<[Parameters<typeof buildMedicalExport>[0], string]> = [
      ['conceive', 'intimacy'],
      ['irregular', 'notes'],
      ['pregnancy', 'medicalInfo'],
      ['pregnancy', 'notes'],
      ['contraception', 'journal'],
      ['postpartum', 'lochia'],
      ['postpartum', 'notes'],
      ['loss', 'notes'],
      ['menopause', 'treatment'],
      ['menopause', 'notes'],
    ];
    for (const [objective, category] of cases) {
      expect({objective, category, kind: (await buildMedicalExport(objective, 'all', 'pdf', [category], now)).kind}).toEqual({
        objective,
        category,
        kind: 'locked',
      });
    }
  });
});
