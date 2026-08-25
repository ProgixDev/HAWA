import {buildConceiveExportDays} from '../medicalExportReaders';
import {getAllJournalEntries} from '../../state/dailyJournalStore';
import {getCyclePreferences, getHasConfirmedCycleData} from '../../state/onboardingPreferences';

// medicalExportReaders.ts imports privateNotesEncryption.ts/
// privateJournalEncryption.ts at module scope (react-native-keychain, not
// available in Jest) and reads real cycle preferences for the TTC
// ovulation/fertile-window estimate — all mocked explicitly here.
jest.mock('../privateNotesEncryption', () => ({resolveNoteSection: jest.fn()}));
jest.mock('../privateJournalEncryption', () => ({resolveIntimacySection: jest.fn()}));
jest.mock('../../state/dailyJournalStore', () => ({getAllJournalEntries: jest.fn()}));
jest.mock('../../state/onboardingPreferences', () => ({
  getCyclePreferences: jest.fn(),
  getHasConfirmedCycleData: jest.fn(),
  hydrateCyclePreferences: jest.fn().mockResolvedValue(undefined),
}));

const mockGetAllJournalEntries = getAllJournalEntries as jest.Mock;
const mockGetCyclePreferences = getCyclePreferences as jest.Mock;
const mockGetHasConfirmedCycleData = getHasConfirmedCycleData as jest.Mock;

const now = new Date('2026-08-25T12:00:00');

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAllJournalEntries.mockResolvedValue([]);
});

describe('buildConceiveExportDays — estimate labeling', () => {
  it('never presents an ovulation/fertile-window estimate when cycle data has not been confirmed yet', async () => {
    mockGetHasConfirmedCycleData.mockReturnValue(false);
    mockGetCyclePreferences.mockReturnValue({lastPeriodStart: new Date('2026-08-10'), cycleDuration: 28, periodDuration: 5, regularity: 'yes'});

    const {notices} = await buildConceiveExportDays(['temperature'], 'all', now);
    expect(notices).toHaveLength(0);
  });

  it('clearly labels the ovulation/fertile-window values as estimates, never as confirmed facts', async () => {
    mockGetHasConfirmedCycleData.mockReturnValue(true);
    mockGetCyclePreferences.mockReturnValue({lastPeriodStart: new Date('2026-08-10'), cycleDuration: 28, periodDuration: 5, regularity: 'yes'});

    const {notices} = await buildConceiveExportDays(['temperature'], 'all', now);

    expect(notices.length).toBeGreaterThanOrEqual(2);
    notices.forEach(notice => expect(notice.toLowerCase()).toContain('estimat'));
    expect(notices.join(' ')).toMatch(/Ovulation estimée/);
    expect(notices.join(' ')).toMatch(/fenêtre de fertilité estimée/i);
  });
});
