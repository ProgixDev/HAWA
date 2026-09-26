import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  backupNow,
  buildPortableDataJson,
  deleteTrackedData,
  getBackupSnapshot,
  readAwaStorage,
  restoreBackup,
} from '../backupService';
import {resolveNoteSection, encryptNoteSection} from '../privateNotesEncryption';
import {getAllJournalEntries, saveJournalSection} from '../../state/dailyJournalStore';
import {savePregnancySymptoms} from '../../state/pregnancyJournalStore';
import {saveMenopauseJournalField} from '../../state/menopauseJournalStore';
import {buildExportCsv} from '../medicalExportFormatting';
import {buildCycleExportDays} from '../medicalExportReaders';
import {lockIntimacy, unlockIntimacy} from '../../state/privateSectionAuthStore';

// M40 — backup / restore vs the Premium medical export are SEPARATE layers.
//   Backup/restore : machine-oriented raw AsyncStorage snapshot; every field
//                    encrypted at rest stays an opaque AES-GCM envelope, keys
//                    live in the Keychain and are not part of the snapshot.
//   Medical export : decrypted, labelled, period/category-filtered CSV/PDF,
//                    Premium-gated in DataExportScreen and behind the private
//                    unlock for sensitive categories (M44).
// These tests pin down what the free routes expose and that restore still
// round-trips. (Which free routes SHOULD exist is a product decision — see the
// M40 report.)

const SECRET_NOTE = 'ZZ-BACKUP-SECRET-PERSONAL-NOTE';
const SECRET_SECTION_NOTE = 'ZZ-BACKUP-SECRET-SYMPTOM-NOTE';
const SECRET_PREGNANCY_NOTE = 'ZZ-BACKUP-SECRET-PREGNANCY-NOTE';
const SECRET_MENOPAUSE_NOTE = 'ZZ-BACKUP-SECRET-MENOPAUSE-NOTE';
const now = new Date('2026-08-25T12:00:00');
const DATE = '2026-08-22';

beforeAll(async () => {
  await AsyncStorage.clear();
  await saveJournalSection(DATE, 'symptoms', {names: ['Crampes'], severity: 'moderate', note: SECRET_SECTION_NOTE});
  await saveJournalSection(DATE, 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3});
  await saveJournalSection(
    DATE,
    'encryptedNote',
    await encryptNoteSection({text: SECRET_NOTE, updatedAt: '2026-08-22T10:00:00.000Z'}),
  );
  await savePregnancySymptoms({date: DATE, symptoms: ['Nausées'], note: SECRET_PREGNANCY_NOTE, updatedAt: '2026-08-22T10:00:00.000Z'});
  await saveMenopauseJournalField(DATE, 'notes', SECRET_MENOPAUSE_NOTE);
  await AsyncStorage.setItem('unrelated-app-key', 'must-not-be-backed-up');
  await AsyncStorage.setItem('other-app-key', 'must-not-be-backed-up');
});

afterEach(() => {
  lockIntimacy();
});

describe('backup snapshot / portability dump — what the free routes expose', () => {
  it('only @awa* / @hawa* keys are captured (never foreign keys, never the previous snapshot itself)', async () => {
    await backupNow();
    const second = await backupNow();
    const keys = Object.keys(second.entries);
    expect(keys).toEqual(expect.arrayContaining(['@hawa/daily-journal/v1', '@hawa/pregnancy-journal/v1', '@hawa/menopause-journal/v1']));
    expect(keys).not.toContain('@awa/backup/local-v1');
    expect(keys.every(key => key.startsWith('@awa') || key.startsWith('@hawa'))).toBe(true);
    expect(keys).not.toContain('other-app-key');
    expect(keys).not.toContain('unrelated-app-key');
  });

  it('every encrypted-at-rest free-text field stays ciphertext in the backup snapshot AND in the portability JSON', async () => {
    const snapshot = await backupNow();
    const stored = (await AsyncStorage.getItem('@awa/backup/local-v1')) as string;
    const portable = await buildPortableDataJson();
    [JSON.stringify(snapshot), stored, portable].forEach(blob => {
      [SECRET_NOTE, SECRET_SECTION_NOTE, SECRET_PREGNANCY_NOTE, SECRET_MENOPAUSE_NOTE].forEach(secret => {
        expect(blob).not.toContain(secret);
      });
      expect(blob).toContain('ciphertext');
    });
  });

  it('the free routes are raw internal data, not a rendered/labelled export: no French labels, no CSV/report structure', async () => {
    const portable = await buildPortableDataJson();
    const parsed = JSON.parse(portable) as Record<string, string | null>;
    // Raw stored JSON strings keyed by storage key — internal enum values as-is.
    expect(parsed['@hawa/daily-journal/v1']).toContain('"severity":"moderate"');
    expect(portable).not.toContain('Intensité : Modérée');
    expect(portable).not.toContain('date;categorie;valeur');
    expect(portable).not.toContain('Notes privées');
  });

  it('by contrast the Premium export decrypts and labels the same data (this is the value the gate protects)', async () => {
    unlockIntimacy();
    const {days} = await buildCycleExportDays(['symptoms', 'notes'], 'all', now);
    const csv = buildExportCsv(days);
    expect(csv).toContain('Intensité : Modérée');
    expect(csv).toContain(SECRET_NOTE);
    expect(csv).toContain(`Symptômes : ${SECRET_SECTION_NOTE}`);
  });
});

describe('backup / restore round-trip', () => {
  it('restores exactly what was backed up, including encrypted envelopes that still decrypt', async () => {
    const before = await readAwaStorage();
    const snapshot = await backupNow();
    expect(snapshot.entries).toEqual(before);
    expect(await getBackupSnapshot()).toEqual(snapshot);

    // Wipe the tracked data (the "Supprimer mes données" path), then restore.
    await deleteTrackedData();
    expect(await AsyncStorage.getItem('@hawa/daily-journal/v1')).toBeNull();

    await restoreBackup(snapshot);

    expect(await readAwaStorage()).toEqual(before);

    // The restored envelopes still decrypt with the same Keychain key.
    const [entry] = (await getAllJournalEntries()).filter(item => item.date === DATE);
    expect(entry.symptoms?.note).toBe(SECRET_SECTION_NOTE);
    const {data} = await resolveNoteSection(entry);
    expect(data?.text).toBe(SECRET_NOTE);
  });

  it('a snapshot entry with a null value removes that key on restore (existing behaviour preserved)', async () => {
    await AsyncStorage.setItem('@hawa/temp-restore-key', 'x');
    await restoreBackup({createdAt: new Date().toISOString(), sizeBytes: 0, entries: {'@hawa/temp-restore-key': null}});
    expect(await AsyncStorage.getItem('@hawa/temp-restore-key')).toBeNull();
  });
});
