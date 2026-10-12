// Phase 2 — F20: an encrypted field that cannot be opened RIGHT NOW is carried, never blanked ON DISK.
//
// Same hole as the reminder stores (see unreadableReminderFieldsCarry.test.ts), in the eleven stores that decrypt a
// sealed free-text field and, on failure, used to DROP/BLANK it: the next save of the same record rewrote the whole
// record without the field, so the sealed payload was replaced by nothing and the text was lost for good even when the
// field key came back a minute later.
//
// For every store: seed a real note, "restart" with the field key unreadable (Keychain error), read (blank), save
// something else, and assert the persisted sealed payload is byte-identical; then restart with the key back and the
// text is there. A value she types always wins (and the older payload can never come back), a deliberate clear of a
// READABLE field still clears, and the reserved carry key is never persisted. Fixtures only; the Keychain is the
// in-memory mock of jest.setup.js (the structured-storage envelope key is a different service and stays readable).
// Runs in both modes: plain structured storage and AWA_STRUCTURED_ENCRYPTION=1 (npm run test:encrypted).

import AsyncStorage from '@react-native-async-storage/async-storage';

import {isEncryptedFieldPayload} from '../../services/atRestFieldEncryption';

const FIELD_SERVICES = {
  daily: 'com.hawa.private.daily-journal.encryption-key',
  contraception: 'com.hawa.private.contraception-journal.encryption-key',
  general: 'com.hawa.private.general-health.encryption-key',
  irregular: 'com.hawa.private.irregular-journal.encryption-key',
  menopause: 'com.hawa.private.menopause-journal.encryption-key',
  miscarriage: 'com.hawa.private.miscarriage-journal.encryption-key',
  personal: 'com.hawa.private.personal-information.encryption-key',
  postpartum: 'com.hawa.private.postpartum-journal.encryption-key',
  lochia: 'com.hawa.private.postpartum-lochia.encryption-key',
  pregnancy: 'com.hawa.private.pregnancy-journal.encryption-key',
  events: 'com.hawa.private.pregnancy-medical-events.encryption-key',
};

type Boot = {
  secure: typeof import('../../services/secureAsyncStorage');
  keyWorks: () => void;
  /** The stored JSON of `key`, parsed (envelope decrypted in the encrypted mode). */
  persisted: (key: string) => Promise<any>;
  raw: (key: string) => Promise<string | null>;
};

/** A cold start: module memos are gone, storage and Keychain persist. `failing` makes those field keys unreadable. */
function boot(failing: string[] = []): Boot {
  jest.resetModules();
  const Keychain = require('react-native-keychain') as typeof import('react-native-keychain');
  const getGenericPassword = Keychain.getGenericPassword as unknown as jest.Mock;
  const original = getGenericPassword.getMockImplementation() as (options?: {service?: string}) => Promise<unknown>;
  getGenericPassword.mockImplementation(async (options?: {service?: string}) => {
    if (options?.service && failing.includes(options.service)) {
      throw new Error('keystore unavailable');
    }
    return original(options);
  });
  const secure = require('../../services/secureAsyncStorage') as typeof import('../../services/secureAsyncStorage');
  const keyWorks = () => {
    getGenericPassword.mockImplementation(original);
    (require('../../services/secureAesKeyStore') as typeof import('../../services/secureAesKeyStore')).clearAesKeyCache();
  };
  const persisted = async (key: string) => {
    const text = await secure.default.getItem(key);
    return text === null ? null : JSON.parse(text);
  };
  return {secure, keyWorks, persisted, raw: key => secure.default.getItem(key)};
}

type Case = {
  name: string;
  service: string;
  key: string;
  /** The sealed payload of the field inside the persisted JSON (undefined when absent). */
  sealed: (json: any) => unknown;
  seed: () => Promise<void>;
  /** The read the app performs; resolves to the text a screen would show (undefined / '' when it is blank). */
  read: () => Promise<string | undefined>;
  /** A save that touches only OTHER fields (the sealed text field is blank in what the caller hands over). */
  saveOther: () => Promise<void>;
  /** She types a new text for the field. */
  type: (text: string) => Promise<void>;
  /** She deliberately clears the field (only meaningful while it is readable). */
  clear: () => Promise<void>;
  /** Optional: what is readable of the OTHER fields after saveOther. */
  otherVisible?: () => Promise<unknown>;
  otherExpected?: unknown;
};

const DAY = '2026-09-01';
const STAMP = '2026-09-01T00:00:00.000Z';
const SECRET = 'Texte confidentiel de test';

const CASES: Case[] = [
  {
    name: 'dailyJournalStore (section note)',
    service: FIELD_SERVICES.daily,
    key: '@hawa/daily-journal/v1',
    sealed: json => json.find((e: any) => e.date === DAY)?.mood?.note,
    seed: async () => {
      const s = require('../dailyJournalStore') as typeof import('../dailyJournalStore');
      await s.saveJournalSection(DAY, 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 4, note: SECRET});
      await s.saveJournalSection(DAY, 'sleep', {duration: '7h', note: 'Note sommeil'});
    },
    read: async () => (await (require('../dailyJournalStore') as typeof import('../dailyJournalStore')).getJournalEntry(DAY))?.mood?.note,
    saveOther: async () => {
      const s = require('../dailyJournalStore') as typeof import('../dailyJournalStore');
      // The mood form hands over a FRESH section object (no note): the caller's value replaces the stored section.
      await s.saveJournalSection(DAY, 'mood', {level: 'sad', energy: 1, stress: 4, irritability: 3, motivation: 1});
    },
    type: async text => {
      const s = require('../dailyJournalStore') as typeof import('../dailyJournalStore');
      await s.saveJournalSection(DAY, 'mood', {level: 'sad', energy: 1, stress: 4, irritability: 3, motivation: 1, note: text});
    },
    clear: async () => {
      const s = require('../dailyJournalStore') as typeof import('../dailyJournalStore');
      await s.saveJournalSection(DAY, 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 4, note: ''});
    },
  },
  {
    name: 'contraceptionJournalStore (notes)',
    service: FIELD_SERVICES.contraception,
    key: '@hawa/contraception-journal/v1',
    sealed: json => json[DAY]?.notes,
    seed: async () => {
      const s = require('../contraceptionJournalStore') as typeof import('../contraceptionJournalStore');
      await s.hydrateContraceptionJournal();
      await s.saveContraceptionJournalField(DAY, 'notes', SECRET);
    },
    read: async () => {
      const s = require('../contraceptionJournalStore') as typeof import('../contraceptionJournalStore');
      await s.hydrateContraceptionJournal();
      return s.getContraceptionJournalEntry(DAY)?.notes;
    },
    saveOther: async () => {
      const s = require('../contraceptionJournalStore') as typeof import('../contraceptionJournalStore');
      await s.hydrateContraceptionJournal();
      await s.saveContraceptionJournalField(DAY, 'feelings', ['Fatigue']);
    },
    type: async text => {
      const s = require('../contraceptionJournalStore') as typeof import('../contraceptionJournalStore');
      await s.saveContraceptionJournalField(DAY, 'notes', text);
    },
    clear: async () => {
      const s = require('../contraceptionJournalStore') as typeof import('../contraceptionJournalStore');
      await s.clearContraceptionJournalField(DAY, 'notes');
    },
  },
  {
    name: 'generalHealthStore (medicalNotes)',
    service: FIELD_SERVICES.general,
    key: '@awa/general-health/v1',
    sealed: json => json.medicalNotes,
    seed: async () => {
      const s = require('../generalHealthStore') as typeof import('../generalHealthStore');
      await s.loadGeneralHealth();
      await s.updateGeneralHealth({medicalNotes: SECRET, heightCm: 165});
    },
    read: async () => {
      const s = require('../generalHealthStore') as typeof import('../generalHealthStore');
      return (await s.loadGeneralHealth()).medicalNotes;
    },
    saveOther: async () => {
      const s = require('../generalHealthStore') as typeof import('../generalHealthStore');
      await s.loadGeneralHealth();
      // The form hands the whole profile back, its (unreadable, so blank) notes included.
      await s.updateGeneralHealth({weightKg: 62, medicalNotes: ''});
    },
    type: async text => {
      const s = require('../generalHealthStore') as typeof import('../generalHealthStore');
      await s.updateGeneralHealth({medicalNotes: text});
    },
    clear: async () => {
      const s = require('../generalHealthStore') as typeof import('../generalHealthStore');
      await s.updateGeneralHealth({medicalNotes: ''});
    },
  },
  {
    name: 'irregularJournalStore (details[category].note)',
    service: FIELD_SERVICES.irregular,
    key: '@hawa/irregular-journal/v1',
    sealed: json => json[DAY]?.details?.mood?.note,
    seed: async () => {
      const s = require('../irregularJournalStore') as typeof import('../irregularJournalStore');
      await s.hydrateIrregularJournal();
      await s.saveIrregularJournalEntry(DAY, 'mood', 'Calme', {note: SECRET});
    },
    read: async () => {
      const s = require('../irregularJournalStore') as typeof import('../irregularJournalStore');
      await s.hydrateIrregularJournal();
      return s.getIrregularJournalEntry(DAY)?.details?.mood?.note;
    },
    saveOther: async () => {
      const s = require('../irregularJournalStore') as typeof import('../irregularJournalStore');
      await s.hydrateIrregularJournal();
      await s.saveIrregularJournalEntry(DAY, 'mood', 'Irritable', {});
    },
    type: async text => {
      const s = require('../irregularJournalStore') as typeof import('../irregularJournalStore');
      await s.saveIrregularJournalEntry(DAY, 'mood', 'Calme', {note: text});
    },
    clear: async () => {
      const s = require('../irregularJournalStore') as typeof import('../irregularJournalStore');
      await s.saveIrregularJournalEntry(DAY, 'mood', 'Calme', {note: ''});
    },
  },
  {
    name: 'menopauseJournalStore (notes)',
    service: FIELD_SERVICES.menopause,
    key: '@hawa/menopause-journal/v1',
    sealed: json => json[DAY]?.notes,
    seed: async () => {
      const s = require('../menopauseJournalStore') as typeof import('../menopauseJournalStore');
      await s.hydrateMenopauseJournal();
      await s.saveMenopauseJournalField(DAY, 'notes', SECRET);
    },
    read: async () => {
      const s = require('../menopauseJournalStore') as typeof import('../menopauseJournalStore');
      await s.hydrateMenopauseJournal();
      return s.getMenopauseJournalEntry(DAY)?.notes;
    },
    saveOther: async () => {
      const s = require('../menopauseJournalStore') as typeof import('../menopauseJournalStore');
      await s.hydrateMenopauseJournal();
      await s.saveMenopauseJournalField(DAY, 'mood', 'good');
    },
    type: async text => {
      const s = require('../menopauseJournalStore') as typeof import('../menopauseJournalStore');
      await s.saveMenopauseJournalField(DAY, 'notes', text);
    },
    clear: async () => {
      const s = require('../menopauseJournalStore') as typeof import('../menopauseJournalStore');
      await s.clearMenopauseJournalFields(DAY, ['notes']);
    },
  },
  {
    name: 'miscarriageJournalStore (personalNotes)',
    service: FIELD_SERVICES.miscarriage,
    key: '@hawa/miscarriage-journal/v1',
    sealed: json => json[DAY]?.personalNotes,
    seed: async () => {
      const s = require('../miscarriageJournalStore') as typeof import('../miscarriageJournalStore');
      await s.hydrateMiscarriageJournal();
      await s.saveMiscarriageJournalField(DAY, 'personalNotes', SECRET);
    },
    read: async () => {
      const s = require('../miscarriageJournalStore') as typeof import('../miscarriageJournalStore');
      await s.hydrateMiscarriageJournal();
      return s.getMiscarriageJournalEntry(DAY)?.personalNotes;
    },
    saveOther: async () => {
      const s = require('../miscarriageJournalStore') as typeof import('../miscarriageJournalStore');
      await s.hydrateMiscarriageJournal();
      await s.saveMiscarriageJournalField(DAY, 'tryingAgain', 'soon');
    },
    type: async text => {
      const s = require('../miscarriageJournalStore') as typeof import('../miscarriageJournalStore');
      await s.saveMiscarriageJournalField(DAY, 'personalNotes', text);
    },
    clear: async () => {
      const s = require('../miscarriageJournalStore') as typeof import('../miscarriageJournalStore');
      await s.saveMiscarriageJournalField(DAY, 'personalNotes', '');
    },
  },
  {
    name: 'personalInformationStore (lastName)',
    service: FIELD_SERVICES.personal,
    key: '@hawa/personal-information/v1',
    sealed: json => json.lastName,
    seed: async () => {
      const s = require('../personalInformationStore') as typeof import('../personalInformationStore');
      await s.loadPersonalInformation();
      await s.updatePersonalInformation({lastName: SECRET, firstName: 'Amina', email: 'amina@example.test'});
    },
    read: async () => {
      const s = require('../personalInformationStore') as typeof import('../personalInformationStore');
      return (await s.loadPersonalInformation()).lastName;
    },
    saveOther: async () => {
      const s = require('../personalInformationStore') as typeof import('../personalInformationStore');
      await s.loadPersonalInformation();
      // The profile form hands the whole record back: unreadable last name -> blank.
      await s.updatePersonalInformation({firstName: 'Aminata', lastName: ''});
    },
    type: async text => {
      const s = require('../personalInformationStore') as typeof import('../personalInformationStore');
      await s.updatePersonalInformation({lastName: text});
    },
    clear: async () => {
      const s = require('../personalInformationStore') as typeof import('../personalInformationStore');
      await s.updatePersonalInformation({lastName: ''});
    },
  },
  {
    name: 'postpartumJournalStore (moodNote)',
    service: FIELD_SERVICES.postpartum,
    key: '@hawa/postpartum-journal/v3',
    sealed: json => json[DAY]?.moodNote,
    seed: async () => {
      const s = require('../postpartumJournalStore') as typeof import('../postpartumJournalStore');
      await s.hydratePostpartumJournal();
      await s.savePostpartumJournalField(DAY, 'mood', 'Sereine');
      await s.savePostpartumJournalField(DAY, 'moodNote', SECRET);
    },
    read: async () => {
      const s = require('../postpartumJournalStore') as typeof import('../postpartumJournalStore');
      await s.hydratePostpartumJournal();
      return s.getPostpartumJournalEntry(DAY)?.moodNote;
    },
    saveOther: async () => {
      const s = require('../postpartumJournalStore') as typeof import('../postpartumJournalStore');
      await s.hydratePostpartumJournal();
      await s.savePostpartumJournalField(DAY, 'fatigue', 'Légère');
    },
    type: async text => {
      const s = require('../postpartumJournalStore') as typeof import('../postpartumJournalStore');
      await s.savePostpartumJournalField(DAY, 'moodNote', text);
    },
    clear: async () => {
      const s = require('../postpartumJournalStore') as typeof import('../postpartumJournalStore');
      await s.clearPostpartumMoodNote(DAY);
    },
  },
  {
    name: 'postpartumLochiaStore (note)',
    service: FIELD_SERVICES.lochia,
    key: '@hawa/postpartum-lochia/v1',
    sealed: json => json.entries?.[DAY]?.note,
    seed: async () => {
      const s = require('../postpartumLochiaStore') as typeof import('../postpartumLochiaStore');
      await s.hydratePostpartumLochia();
      await s.savePostpartumLochiaEntry(DAY, {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: [], note: SECRET});
    },
    read: async () => {
      const s = require('../postpartumLochiaStore') as typeof import('../postpartumLochiaStore');
      await s.hydratePostpartumLochia();
      return s.getPostpartumLochiaEntry(DAY)?.note;
    },
    saveOther: async () => {
      const s = require('../postpartumLochiaStore') as typeof import('../postpartumLochiaStore');
      await s.hydratePostpartumLochia();
      // The lochia form hands over the whole entry; the (unreadable) note is blank in it.
      await s.savePostpartumLochiaEntry(DAY, {flow: 'Abondant', color: 'Rouge', consistency: 'Épais', symptoms: ['Crampes']});
    },
    type: async text => {
      const s = require('../postpartumLochiaStore') as typeof import('../postpartumLochiaStore');
      await s.savePostpartumLochiaEntry(DAY, {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: [], note: text});
    },
    clear: async () => {
      const s = require('../postpartumLochiaStore') as typeof import('../postpartumLochiaStore');
      await s.savePostpartumLochiaEntry(DAY, {flow: 'Léger', color: 'Rose', consistency: 'Liquide', symptoms: []});
    },
  },
  {
    name: 'pregnancyJournalStore (symptoms[].note)',
    service: FIELD_SERVICES.pregnancy,
    key: '@hawa/pregnancy-journal/v1',
    sealed: json => json.symptoms?.find((e: any) => e.date === DAY)?.note,
    seed: async () => {
      const s = require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore');
      await s.savePregnancySymptoms({date: DAY, symptoms: ['Nausées'], note: SECRET, updatedAt: STAMP});
    },
    read: async () => {
      const s = require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore');
      return (await s.getPregnancyJournalState()).symptoms.find(e => e.date === DAY)?.note;
    },
    saveOther: async () => {
      const s = require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore');
      await s.savePregnancySymptoms({date: DAY, symptoms: ['Fatigue'], updatedAt: STAMP});
    },
    type: async text => {
      const s = require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore');
      await s.savePregnancySymptoms({date: DAY, symptoms: ['Nausées'], note: text, updatedAt: STAMP});
    },
    clear: async () => {
      const s = require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore');
      await s.savePregnancySymptoms({date: DAY, symptoms: ['Nausées'], note: '', updatedAt: STAMP});
    },
  },
  {
    name: 'pregnancyJournalStore (medicalInformationHistory[].note)',
    service: FIELD_SERVICES.pregnancy,
    key: '@hawa/pregnancy-journal/v1',
    sealed: json => json.medicalInformationHistory?.find((e: any) => e.date === DAY)?.note,
    seed: async () => {
      const s = require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore');
      await s.savePregnancyMedicalInformation({date: DAY, note: SECRET, updatedAt: STAMP});
    },
    read: async () => {
      const s = require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore');
      return (await s.getPregnancyJournalState()).medicalInformationHistory.find(e => e.date === DAY)?.note;
    },
    saveOther: async () => {
      const s = require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore');
      // The same day's entry is re-saved with an empty note (unreadable -> blank in the form), AND a weight is added.
      await s.savePregnancyMedicalInformation({date: DAY, note: '', updatedAt: '2026-09-02T00:00:00.000Z'});
      await s.savePregnancyWeight({date: DAY, valueKg: 63, updatedAt: STAMP});
    },
    type: async text => {
      const s = require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore');
      await s.savePregnancyMedicalInformation({date: DAY, note: text, updatedAt: STAMP});
    },
    clear: async () => {
      const s = require('../pregnancyJournalStore') as typeof import('../pregnancyJournalStore');
      await s.savePregnancyMedicalInformation({date: DAY, note: '', updatedAt: STAMP});
    },
  },
  {
    name: 'pregnancyMedicalEventsStore (notes)',
    service: FIELD_SERVICES.events,
    key: '@hawa/pregnancy-medical-events',
    sealed: json => json.find((e: any) => e.id === 'e1')?.notes,
    seed: async () => {
      const s = require('../pregnancyMedicalEventsStore') as typeof import('../pregnancyMedicalEventsStore');
      await s.savePregnancyMedicalEvent({
        id: 'e1', type: 'appointment', date: '2026-10-01', title: 'Echographie', notes: SECRET, createdAt: STAMP, updatedAt: STAMP,
      });
    },
    read: async () => {
      const s = require('../pregnancyMedicalEventsStore') as typeof import('../pregnancyMedicalEventsStore');
      return (await s.getPregnancyMedicalEvents()).find(e => e.id === 'e1')?.notes;
    },
    saveOther: async () => {
      const s = require('../pregnancyMedicalEventsStore') as typeof import('../pregnancyMedicalEventsStore');
      // The edit form hands a FRESH event object (no notes: unreadable -> blank) back for the same id.
      await s.savePregnancyMedicalEvent({
        id: 'e1', type: 'appointment', date: '2026-10-02', title: 'Echographie', createdAt: STAMP, updatedAt: STAMP,
      });
    },
    type: async text => {
      const s = require('../pregnancyMedicalEventsStore') as typeof import('../pregnancyMedicalEventsStore');
      await s.savePregnancyMedicalEvent({
        id: 'e1', type: 'appointment', date: '2026-10-02', title: 'Echographie', notes: text, createdAt: STAMP, updatedAt: STAMP,
      });
    },
    clear: async () => {
      const s = require('../pregnancyMedicalEventsStore') as typeof import('../pregnancyMedicalEventsStore');
      await s.savePregnancyMedicalEvent({
        id: 'e1', type: 'appointment', date: '2026-10-02', title: 'Echographie', notes: '', createdAt: STAMP, updatedAt: STAMP,
      });
    },
  },
];

const hasMarker = (value: unknown) => JSON.stringify(value).includes('__sealedFields');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe.each(CASES)('$name', testCase => {
  const seedSealed = async () => {
    const b = boot();
    await testCase.seed();
    const before = testCase.sealed(await b.persisted(testCase.key));
    expect(isEncryptedFieldPayload(before)).toBe(true);
    return {before, rawBefore: await b.raw(testCase.key)};
  };

  it('an unreadable note is blank on screen but its sealed payload survives a save of other fields, byte-identical', async () => {
    const {before} = await seedSealed();

    const failing = boot([testCase.service]);
    expect(await testCase.read()).toBeFalsy(); // what the UI sees: nothing, not garbage
    await testCase.saveOther();

    const json = await failing.persisted(testCase.key);
    expect(testCase.sealed(json)).toEqual(before);
    expect(hasMarker(json)).toBe(false); // the reserved carry key never reaches storage
    expect(hasMarker(await failing.raw(testCase.key))).toBe(false);

    // The key is back (a new launch): the original text is there, nothing was lost in between.
    boot();
    expect(await testCase.read()).toBe(SECRET);
  });

  it('a note she TYPES while the old one is unreadable wins, and the old payload never comes back', async () => {
    const {before} = await seedSealed();

    const failing = boot([testCase.service]);
    expect(await testCase.read()).toBeFalsy();
    failing.keyWorks(); // the key came back; the screen still holds the blank it read

    await testCase.type('Nouveau texte');
    const json = await failing.persisted(testCase.key);
    expect(testCase.sealed(json)).not.toEqual(before);
    expect(isEncryptedFieldPayload(testCase.sealed(json))).toBe(true);
    expect(hasMarker(json)).toBe(false);

    // ...and clearing it afterwards leaves it cleared (the replaced payload is not resurrected from a stale carry).
    await testCase.clear();
    expect(testCase.sealed(await failing.persisted(testCase.key))).toBeFalsy();

    boot();
    expect(await testCase.read()).toBeFalsy();
  });

  it('deliberately clearing a READABLE note still clears it', async () => {
    await seedSealed();

    boot();
    expect(await testCase.read()).toBe(SECRET);
    await testCase.clear();

    const b = boot();
    expect(testCase.sealed(await b.persisted(testCase.key))).toBeFalsy();
    expect(await testCase.read()).toBeFalsy();
  });

  it('a profile that never had a note is unaffected (no carry, nothing invented)', async () => {
    boot();
    await testCase.saveOther();
    const b = boot();
    const json = await b.persisted(testCase.key);
    expect(testCase.sealed(json)).toBeFalsy();
    expect(hasMarker(json)).toBe(false);
  });
});

describe('records are not dropped while an unreadable note is their only content', () => {
  it('contraception: clearing the feelings of a day whose note is unreadable keeps the sealed note', async () => {
    boot();
    const seeded = require('../contraceptionJournalStore') as typeof import('../contraceptionJournalStore');
    await seeded.hydrateContraceptionJournal();
    await seeded.saveContraceptionJournalField(DAY, 'feelings', ['Fatigue']);
    await seeded.saveContraceptionJournalField(DAY, 'notes', SECRET);
    const b0 = boot();
    const before = (await b0.persisted('@hawa/contraception-journal/v1'))[DAY].notes;

    const failing = boot([FIELD_SERVICES.contraception]);
    const s = require('../contraceptionJournalStore') as typeof import('../contraceptionJournalStore');
    await s.hydrateContraceptionJournal();
    await s.clearContraceptionJournalField(DAY, 'feelings');

    expect((await failing.persisted('@hawa/contraception-journal/v1'))[DAY].notes).toEqual(before);
    boot();
    const again = require('../contraceptionJournalStore') as typeof import('../contraceptionJournalStore');
    await again.hydrateContraceptionJournal();
    expect(again.getContraceptionJournalEntry(DAY)?.notes).toBe(SECRET);
  });

  it('postpartum: clearing the only tracked category of a day keeps its unreadable mood note', async () => {
    boot();
    const seeded = require('../postpartumJournalStore') as typeof import('../postpartumJournalStore');
    await seeded.hydratePostpartumJournal();
    await seeded.savePostpartumJournalField(DAY, 'fatigue', 'Légère');
    await seeded.savePostpartumJournalField(DAY, 'moodNote', SECRET);
    const before = (await boot().persisted('@hawa/postpartum-journal/v3'))[DAY].moodNote;

    const failing = boot([FIELD_SERVICES.postpartum]);
    const s = require('../postpartumJournalStore') as typeof import('../postpartumJournalStore');
    await s.hydratePostpartumJournal();
    await s.clearPostpartumJournalCategory(DAY, 'fatigue');

    expect((await failing.persisted('@hawa/postpartum-journal/v3'))[DAY].moodNote).toEqual(before);
  });

  it('menopause: clearing the only tracked category of a day keeps its unreadable note', async () => {
    boot();
    const seeded = require('../menopauseJournalStore') as typeof import('../menopauseJournalStore');
    await seeded.hydrateMenopauseJournal();
    await seeded.saveMenopauseJournalField(DAY, 'mood', 'good');
    await seeded.saveMenopauseJournalField(DAY, 'notes', SECRET);
    const before = (await boot().persisted('@hawa/menopause-journal/v1'))[DAY].notes;

    const failing = boot([FIELD_SERVICES.menopause]);
    const s = require('../menopauseJournalStore') as typeof import('../menopauseJournalStore');
    await s.hydrateMenopauseJournal();
    await s.clearMenopauseJournalCategory(DAY, 'mood');

    expect((await failing.persisted('@hawa/menopause-journal/v1'))[DAY].notes).toEqual(before);
  });
});
