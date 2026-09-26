import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildConceiveExportDays,
  buildContraceptionExportDays,
  buildCycleExportDays,
  buildIrregularExportDays,
  buildMenopauseExportDays,
  buildMiscarriageExportDays,
  buildPostpartumExportDays,
  buildPregnancyExportDays,
  type ObjectiveExportData,
} from '../medicalExportReaders';
import {OBJECTIVE_EXPORT_CONFIG, getSensitiveExportCategories} from '../../config/objectiveExportConfig';
import type {ObjectiveId} from '../../state/onboardingPreferences';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {encryptNoteSection} from '../privateNotesEncryption';
import {encryptIntimacySection} from '../privateJournalEncryption';
import {saveIrregularJournalEntry} from '../../state/irregularJournalStore';
import {savePregnancyMedicalInformation, savePregnancySymptoms} from '../../state/pregnancyJournalStore';
import {savePregnancyMedicalEvent} from '../../state/pregnancyMedicalEventsStore';
import {saveContraceptionJournalField} from '../../state/contraceptionJournalStore';
import {savePostpartumJournalField} from '../../state/postpartumJournalStore';
import {savePostpartumLochiaEntry} from '../../state/postpartumLochiaStore';
import {saveMiscarriageJournalField} from '../../state/miscarriageJournalStore';
import {saveMenopauseJournalField} from '../../state/menopauseJournalStore';

// M43 — every ENCRYPTED-at-rest free-text field the export can reach must land
// in a category flagged `sensitive` in objectiveExportConfig (default-off,
// explicit opt-in, private unlock), never inside a plain default-on category
// (symptoms / mood / flow / sleep / bleeding / appointments ...). Real stores,
// real AES-GCM encryption (in-memory AsyncStorage + Keychain from
// jest.setup.js), one distinct SENTINEL string per encrypted field.
//
//   encrypted field                          store                       export category (sensitive?)
//   dailyJournal encryptedNote               dailyJournalStore           cycle/conceive 'notes' (yes)
//   dailyJournal encryptedIntimacy (+note)   dailyJournalStore           cycle/conceive 'intimacy' (yes)
//   dailyJournal <section>.note (9 sections) dailyJournalStore           cycle/conceive 'notes' (yes)  [was: inside symptoms/mood/flow/sleep/activity/temperature/cervicalMucus/lhTest]
//   irregular details[cat].note              irregularJournalStore       irregular 'notes' (yes)
//   pregnancy symptoms[].note                pregnancyJournalStore       pregnancy 'notes' (yes)       [was: inside symptoms]
//   pregnancy medicalInformationHistory.note pregnancyJournalStore       pregnancy 'medicalInfo' (yes)
//   pregnancy event.notes                    pregnancyMedicalEventsStore pregnancy 'notes' (yes)       [was: inside appointments]
//   pregnancy mood/sleep note (daily)        dailyJournalStore           pregnancy 'notes' (yes)       [was: inside mood/sleep]
//   contraception journal notes              contraceptionJournalStore   contraception 'journal' (yes)
//   postpartum moodNote                      postpartumJournalStore      postpartum 'notes' (yes)      [was: inside mood]
//   postpartum lochia note                   postpartumLochiaStore       postpartum 'lochia' (yes)
//   miscarriage bleedingNote                 miscarriageJournalStore     loss 'notes' (yes)            [was: inside bleeding]
//   miscarriage physicalSymptomsNote         miscarriageJournalStore     loss 'notes' (yes)            [was: inside symptoms]
//   miscarriage personalNotes                miscarriageJournalStore     loss 'notes' (yes)
//   menopause notes                          menopauseJournalStore       menopause 'notes' (yes)
//   menopause treatmentNote                  menopauseJournalStore       menopause 'treatment' (yes)
// Not exported at all (no reader): pregnancy custom/health reminders,
// generalHealth.medicalNotes, personalInformation, private photos.

const now = new Date('2026-08-25T12:00:00');
const DATE = '2026-08-20';
const S = (name: string) => `ZZSENTINEL-${name}`;
const stamp = '2026-08-01T10:00:00.000Z';

const serialize = (data: ObjectiveExportData) => JSON.stringify(data);
const nonSensitiveCategories = (objective: ObjectiveId) =>
  OBJECTIVE_EXPORT_CONFIG[objective].categories.filter(category => !category.sensitive).map(category => category.value);

const STORAGE_KEYS = [
  '@hawa/daily-journal/v1',
  '@hawa/irregular-journal/v1',
  '@hawa/pregnancy-journal/v1',
  '@hawa/pregnancy-medical-events',
  '@hawa/contraception-journal/v1',
  '@hawa/postpartum-journal/v3',
  '@hawa/postpartum-lochia/v1',
  '@hawa/miscarriage-journal/v1',
  '@hawa/menopause-journal/v1',
];

async function rawStorageDump(): Promise<Record<string, string>> {
  const dump: Record<string, string> = {};
  for (const key of STORAGE_KEYS) {
    const value = await AsyncStorage.getItem(key);
    if (value) {dump[key] = value;}
  }
  return dump;
}

beforeAll(async () => {
  await AsyncStorage.clear();

  // ---- shared dailyJournalStore (Cycle / Conceive / Pregnancy mood+sleep)
  await saveJournalSection(DATE, 'symptoms', {names: ['Fatigue'], severity: 'mild', note: S('SYMPTOMS')});
  await saveJournalSection(DATE, 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 3, note: S('MOOD')});
  await saveJournalSection(DATE, 'flow', {intensity: 'light', note: S('FLOW')});
  await saveJournalSection(DATE, 'sleep', {quality: 'Bon', note: S('SLEEP')});
  await saveJournalSection(DATE, 'activity', {type: 'Marche', note: S('ACTIVITY')});
  await saveJournalSection(DATE, 'temperature', {value: 36.6, unit: 'C', note: S('TEMPERATURE')});
  await saveJournalSection(DATE, 'cervicalMucus', {type: 'dry', note: S('MUCUS')});
  await saveJournalSection(DATE, 'lhTest', {result: 'negative', note: S('LH')});
  await saveJournalSection(DATE, 'encryptedNote', await encryptNoteSection({text: S('PERSONAL_NOTE'), updatedAt: stamp}));
  await saveJournalSection(
    DATE,
    'encryptedIntimacy',
    await encryptIntimacySection({answer: 'yes', protection: 'yes', note: S('INTIMACY_NOTE')}),
  );

  // ---- SOPK
  await saveIrregularJournalEntry(DATE, 'acne', 'Légère', {note: S('SOPK_ACNE'), areas: []});

  // ---- Pregnancy
  await savePregnancySymptoms({date: DATE, symptoms: ['Nausées'], note: S('PREG_SYMPTOM_NOTE'), updatedAt: stamp});
  await savePregnancyMedicalInformation({date: DATE, note: S('PREG_MEDICAL_INFO'), updatedAt: stamp});
  await savePregnancyMedicalEvent({
    id: 'evt-sens-1',
    type: 'appointment',
    date: DATE,
    title: 'Consultation',
    notes: S('PREG_EVENT_NOTE'),
    createdAt: stamp,
    updatedAt: stamp,
  });

  // ---- Contraception
  await saveContraceptionJournalField(DATE, 'feelings', ['Bien']);
  await saveContraceptionJournalField(DATE, 'notes', S('CONTRACEPTION_NOTE'));

  // ---- Postpartum
  await savePostpartumJournalField(DATE, 'mood', 'Bien');
  await savePostpartumJournalField(DATE, 'moodNote', S('PP_MOOD_NOTE'));
  await savePostpartumLochiaEntry(DATE, {flow: 'Léger', color: 'Rouge', consistency: 'Liquide', symptoms: [], note: S('LOCHIA_NOTE')});

  // ---- Miscarriage
  await saveMiscarriageJournalField(DATE, 'bleeding', 'Léger');
  await saveMiscarriageJournalField(DATE, 'bleedingNote', S('LOSS_BLEEDING_NOTE'));
  await saveMiscarriageJournalField(DATE, 'physicalSymptoms', ['Crampes']);
  await saveMiscarriageJournalField(DATE, 'physicalSymptomsNote', S('LOSS_SYMPTOMS_NOTE'));
  await saveMiscarriageJournalField(DATE, 'personalNotes', S('LOSS_PERSONAL_NOTE'));

  // ---- Menopause
  await saveMenopauseJournalField(DATE, 'symptoms', ['hot_flashes']);
  await saveMenopauseJournalField(DATE, 'treatmentStatus', 'taken');
  await saveMenopauseJournalField(DATE, 'treatmentNote', S('MENO_TREATMENT_NOTE'));
  await saveMenopauseJournalField(DATE, 'notes', S('MENO_NOTES'));
});

describe('storage stays encrypted at rest (no decrypted copy is ever persisted)', () => {
  it('raw AsyncStorage holds no sentinel in clear, but does hold encrypted envelopes', async () => {
    const dump = await rawStorageDump();
    Object.entries(dump).forEach(([key, value]) => {
      expect({key, leaked: value.includes('ZZSENTINEL')}).toEqual({key, leaked: false});
    });
    expect(dump['@hawa/daily-journal/v1']).toContain('ciphertext');
    expect(dump['@hawa/miscarriage-journal/v1']).toContain('ciphertext');
    expect(dump['@hawa/menopause-journal/v1']).toContain('ciphertext');
  });

  it('running every export (all categories, incl. sensitive) never writes a decrypted copy back to storage', async () => {
    const before = await rawStorageDump();
    const all = (objective: ObjectiveId) => OBJECTIVE_EXPORT_CONFIG[objective].categories.map(category => category.value);
    await buildCycleExportDays(all('cycle'), 'all', now);
    await buildConceiveExportDays(all('conceive'), 'all', now);
    await buildIrregularExportDays(all('irregular'), 'all', now);
    await buildPregnancyExportDays(all('pregnancy'), 'all', now);
    await buildContraceptionExportDays(all('contraception'), 'all', now);
    await buildPostpartumExportDays(all('postpartum'), 'all', now);
    await buildMiscarriageExportDays(all('loss'), 'all', now);
    await buildMenopauseExportDays(all('menopause'), 'all', now);

    const after = await rawStorageDump();
    expect(after).toEqual(before);
    Object.values(after).forEach(value => expect(value).not.toContain('ZZSENTINEL'));
  });
});

describe('cycle', () => {
  it('no encrypted free text under the default (non-sensitive) categories', async () => {
    const data = await buildCycleExportDays(nonSensitiveCategories('cycle'), 'all', now);
    expect(serialize(data)).not.toContain('ZZSENTINEL');
    // ...but the structured, non-sensitive values are still exported.
    expect(serialize(data)).toContain('Fatigue');
    expect(serialize(data)).toContain('Intensité : Légère');
  });

  it('per-section notes + personal note are exported under the sensitive "notes" category only', async () => {
    const {days} = await buildCycleExportDays(['notes'], 'all', now);
    const categories = days.flatMap(day => day.categories);
    expect(categories.every(category => category.category === 'notes')).toBe(true);
    const lines = categories.flatMap(category => category.lines);
    expect(lines).toEqual(
      expect.arrayContaining([
        S('PERSONAL_NOTE'),
        `Symptômes : ${S('SYMPTOMS')}`,
        `Humeur : ${S('MOOD')}`,
        `Flux menstruel : ${S('FLOW')}`,
        `Sommeil : ${S('SLEEP')}`,
        `Activité : ${S('ACTIVITY')}`,
      ]),
    );
    // Objective isolation: Cycle does not offer temperature / mucus / LH.
    const joined = lines.join('\n');
    [S('TEMPERATURE'), S('MUCUS'), S('LH')].forEach(other => expect(joined).not.toContain(other));
  });

  it('intimacy free text only under the sensitive "intimacy" category', async () => {
    const {days} = await buildCycleExportDays(['intimacy'], 'all', now);
    expect(serialize({days, notices: []})).toContain(S('INTIMACY_NOTE'));
    const other = await buildCycleExportDays(['symptoms', 'mood'], 'all', now);
    expect(serialize(other)).not.toContain(S('INTIMACY_NOTE'));
  });
});

describe('conceive', () => {
  it('no encrypted free text under the default categories', async () => {
    const data = await buildConceiveExportDays(nonSensitiveCategories('conceive'), 'all', now);
    expect(serialize(data)).not.toContain('ZZSENTINEL');
    expect(serialize(data)).toContain('Glaire cervicale : Sèche');
  });

  it('TTC section notes (temperature, mucus, LH, symptoms, mood) go under "notes"', async () => {
    const {days} = await buildConceiveExportDays(['notes'], 'all', now);
    const lines = days.flatMap(day => day.categories.flatMap(category => category.lines));
    expect(lines).toEqual(
      expect.arrayContaining([
        S('PERSONAL_NOTE'),
        `Température basale : ${S('TEMPERATURE')}`,
        `Glaire cervicale : ${S('MUCUS')}`,
        `Tests d’ovulation (LH) : ${S('LH')}`,
        `Symptômes : ${S('SYMPTOMS')}`,
        `Humeur : ${S('MOOD')}`,
      ]),
    );
    const joined = lines.join('\n');
    [S('FLOW'), S('SLEEP'), S('ACTIVITY')].forEach(other => expect(joined).not.toContain(other));
  });
});

describe('SOPK (irregular)', () => {
  it('per-category notes only under "notes" (unchanged H9/H10 behaviour)', async () => {
    expect(serialize(await buildIrregularExportDays(nonSensitiveCategories('irregular'), 'all', now))).not.toContain('ZZSENTINEL');
    expect(serialize(await buildIrregularExportDays(['notes'], 'all', now))).toContain(S('SOPK_ACNE'));
  });
});

describe('pregnancy', () => {
  it('no encrypted free text under the default categories (symptoms, weight, mood, sleep, appointments)', async () => {
    const data = await buildPregnancyExportDays(nonSensitiveCategories('pregnancy'), 'all', now);
    expect(serialize(data)).not.toContain('ZZSENTINEL');
    expect(serialize(data)).toContain('Nausées');
    expect(serialize(data)).toContain('Consultation');
  });

  it('symptom / appointment / mood / sleep notes go under the sensitive "notes" category; medical info under "medicalInfo"', async () => {
    const notes = await buildPregnancyExportDays(['notes'], 'all', now);
    expect(notes.days.flatMap(day => day.categories).every(category => category.category === 'notes')).toBe(true);
    const lines = notes.days.flatMap(day => day.categories.flatMap(category => category.lines));
    expect(lines).toEqual(
      expect.arrayContaining([
        `Symptômes : ${S('PREG_SYMPTOM_NOTE')}`,
        `Rendez-vous (Consultation) : ${S('PREG_EVENT_NOTE')}`,
        `Humeur : ${S('MOOD')}`,
        `Sommeil : ${S('SLEEP')}`,
      ]),
    );
    expect(lines.join('\n')).not.toContain(S('PREG_MEDICAL_INFO'));

    const medical = await buildPregnancyExportDays(['medicalInfo'], 'all', now);
    expect(serialize(medical)).toContain(S('PREG_MEDICAL_INFO'));
  });
});

describe('contraception', () => {
  it('journal notes only under the sensitive "journal" category', async () => {
    expect(serialize(await buildContraceptionExportDays(nonSensitiveCategories('contraception'), 'all', now))).not.toContain(
      'ZZSENTINEL',
    );
    expect(serialize(await buildContraceptionExportDays(['journal'], 'all', now))).toContain(S('CONTRACEPTION_NOTE'));
  });
});

describe('postpartum', () => {
  it('mood note is no longer inside "mood"; it lives under sensitive "notes"; lochia note under sensitive "lochia"', async () => {
    const plain = await buildPostpartumExportDays(nonSensitiveCategories('postpartum'), 'all', now);
    expect(serialize(plain)).not.toContain('ZZSENTINEL');
    expect(serialize(plain)).toContain('Bien');

    const notes = await buildPostpartumExportDays(['notes'], 'all', now);
    expect(notes.days.flatMap(day => day.categories.map(category => category.category))).toEqual(['notes']);
    expect(serialize(notes)).toContain(S('PP_MOOD_NOTE'));

    expect(serialize(await buildPostpartumExportDays(['lochia'], 'all', now))).toContain(S('LOCHIA_NOTE'));
  });
});

describe('loss (miscarriage)', () => {
  it('bleeding / symptom annotations are no longer inside their plain categories; all three notes live under "notes"', async () => {
    const plain = await buildMiscarriageExportDays(nonSensitiveCategories('loss'), 'all', now);
    expect(serialize(plain)).not.toContain('ZZSENTINEL');
    expect(serialize(plain)).toContain('Crampes');

    const notes = await buildMiscarriageExportDays(['notes'], 'all', now);
    const lines = notes.days.flatMap(day => day.categories.flatMap(category => category.lines));
    expect(lines).toEqual([
      S('LOSS_PERSONAL_NOTE'),
      `Saignements : ${S('LOSS_BLEEDING_NOTE')}`,
      `Symptômes physiques : ${S('LOSS_SYMPTOMS_NOTE')}`,
    ]);
  });
});

describe('menopause', () => {
  it('notes and treatment note only under the sensitive categories', async () => {
    const plain = await buildMenopauseExportDays(nonSensitiveCategories('menopause'), 'all', now);
    expect(serialize(plain)).not.toContain('ZZSENTINEL');
    expect(serialize(await buildMenopauseExportDays(['notes'], 'all', now))).toContain(S('MENO_NOTES'));
    const treatment = await buildMenopauseExportDays(['treatment'], 'all', now);
    expect(serialize(treatment)).toContain(S('MENO_TREATMENT_NOTE'));
    expect(serialize(treatment)).not.toContain(S('MENO_NOTES'));
  });
});

describe('configuration', () => {
  it('every objective that can export encrypted free text offers a sensitive category for it', () => {
    const expected: Record<ObjectiveId, string[]> = {
      cycle: ['notes', 'intimacy'],
      irregular: ['notes'],
      conceive: ['intimacy', 'notes'],
      pregnancy: ['medicalInfo', 'notes'],
      contraception: ['journal'],
      postpartum: ['lochia', 'notes'],
      loss: ['notes'],
      menopause: ['treatment', 'notes'],
    };
    (Object.keys(expected) as ObjectiveId[]).forEach(objective => {
      const sensitive = OBJECTIVE_EXPORT_CONFIG[objective].categories.filter(c => c.sensitive).map(c => c.value);
      expect(sensitive.sort()).toEqual([...expected[objective]].sort());
    });
  });

  it('getSensitiveExportCategories ignores non-sensitive and cross-objective values', () => {
    expect(getSensitiveExportCategories('cycle', ['symptoms', 'notes', 'temperature', 'lochia'])).toEqual(['notes']);
    expect(getSensitiveExportCategories('postpartum', ['mood'])).toEqual([]);
  });
});
