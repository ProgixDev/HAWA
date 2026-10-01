import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildContraceptionExportDays,
  buildMenopauseExportDays,
  buildPostpartumExportDays,
  buildCycleExportDays,
  buildIrregularExportDays,
  buildConceiveExportDays,
} from '../medicalExportReaders';
import {savePostpartumJournalField} from '../../state/postpartumJournalStore';
import {saveMenopauseJournalField} from '../../state/menopauseJournalStore';
import {setContraceptionIntakeStatus} from '../../state/contraceptionIntakeHistoryStore';
import {addContraceptionEvent} from '../../state/contraceptionEventStore';
import {setContraceptionPreferences, getContraceptionPreferences} from '../../state/contraceptionPreferences';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {saveIrregularJournalField} from '../../state/irregularJournalStore';
import {setCyclePreferences} from '../../state/onboardingPreferences';
import i18n from '../../i18n';

// medicalExportReaders.ts imports privateNotesEncryption.ts/
// privateJournalEncryption.ts at module scope for the Cycle/TTC readers.
jest.mock('../privateNotesEncryption', () => ({resolveNoteSection: jest.fn().mockResolvedValue({data: null})}));
jest.mock('../privateJournalEncryption', () => ({resolveIntimacySection: jest.fn().mockResolvedValue({data: null})}));

const now = new Date('2026-08-25T12:00:00');

// Phase 6 localization — medicalExportReaders.ts's category labels and
// fixed "Label : value" prefixes must follow the app language, exactly like
// medicalExportFormatting.ts's own labels, while every value read from a
// real store (an entered symptom, a free-text note) must stay untouched.
beforeEach(async () => {
  await AsyncStorage.clear();
});

afterEach(async () => {
  await i18n.changeLanguage('fr');
});

describe('buildPostpartumExportDays — language switch', () => {
  it('category labels switch to English, values (data) stay the same', async () => {
    await savePostpartumJournalField('2026-08-20', 'fatigue', 'Modérée');
    const fr = await buildPostpartumExportDays(['fatigue'], '3m', now);
    expect(fr.days[0].categories[0].label).toBe('Fatigue');
    expect(fr.days[0].categories[0].lines).toEqual(['Modérée']);

    await i18n.changeLanguage('en');
    const en = await buildPostpartumExportDays(['fatigue'], '3m', now);
    expect(en.days[0].categories[0].label).toBe('Fatigue'); // same word both languages
    expect(en.days[0].categories[0].lines).toEqual(['Modérée']); // the value itself is never translated
  });
});

describe('buildContraceptionExportDays — language switch', () => {
  it('intake status / event / category / method notice follow the app language', async () => {
    await setContraceptionIntakeStatus('2026-08-20', 'missed');
    await addContraceptionEvent('2026-08-20', 'ring_insertion');
    await setContraceptionPreferences({...getContraceptionPreferences(), method: 'ring'});

    const fr = await buildContraceptionExportDays(['intake', 'events'], '3m', now);
    const frIntake = fr.days.find(day => day.categories.some(c => c.category === 'intake'));
    expect(frIntake?.categories.find(c => c.category === 'intake')?.label).toBe('Suivi de prise');
    expect(frIntake?.categories.find(c => c.category === 'intake')?.lines).toEqual(['Oublié']);
    const frEvents = fr.days.find(day => day.categories.some(c => c.category === 'events'));
    expect(frEvents?.categories.find(c => c.category === 'events')?.lines).toEqual(['Pose de l’anneau']);
    expect(fr.notices[0]).toBe('Méthode de contraception active : Anneau.');

    await i18n.changeLanguage('en');
    const en = await buildContraceptionExportDays(['intake', 'events'], '3m', now);
    const enIntake = en.days.find(day => day.categories.some(c => c.category === 'intake'));
    expect(enIntake?.categories.find(c => c.category === 'intake')?.label).toBe('Intake tracking');
    expect(enIntake?.categories.find(c => c.category === 'intake')?.lines).toEqual(['Missed']);
    const enEvents = en.days.find(day => day.categories.some(c => c.category === 'events'));
    expect(enEvents?.categories.find(c => c.category === 'events')?.lines).toEqual(['Ring inserted']);
    expect(en.notices[0]).toBe('Active contraception method: Ring.');
  });
});

describe('buildMenopauseExportDays — language switch', () => {
  it('category labels follow the app language', async () => {
    await saveMenopauseJournalField('2026-08-20', 'energyLevel', 'low');
    const fr = await buildMenopauseExportDays(['energy'], '3m', now);
    expect(fr.days[0].categories[0].label).toBe('Énergie');

    await i18n.changeLanguage('en');
    const en = await buildMenopauseExportDays(['energy'], '3m', now);
    expect(en.days[0].categories[0].label).toBe('Energy');
  });
});

describe('buildCycleExportDays — language switch', () => {
  it('journal category labels and period lines follow the app language', async () => {
    await saveJournalSection('2026-08-20', 'mood', {level: 'good', energy: 3, stress: 2, irritability: 1, motivation: 4});
    await setCyclePreferences({
      lastPeriodStart: new Date('2026-08-01T12:00:00'),
      cycleDuration: 28,
      periodDuration: 5,
      regularity: 'yes',
    });

    const fr = await buildCycleExportDays(['mood'], '3m', now);
    const frDay = fr.days.find(day => day.date === '2026-08-20');
    expect(frDay?.categories.find(c => c.category === 'mood')?.label).toBe('Humeur');
    expect(frDay?.categories.find(c => c.category === 'mood')?.lines[0]).toBe('Humeur : Bien');

    await i18n.changeLanguage('en');
    const en = await buildCycleExportDays(['mood'], '3m', now);
    const enDay = en.days.find(day => day.date === '2026-08-20');
    expect(enDay?.categories.find(c => c.category === 'mood')?.label).toBe('Mood');
    expect(enDay?.categories.find(c => c.category === 'mood')?.lines[0]).toBe('Mood : Good');
  });
});

describe('buildIrregularExportDays — language switch', () => {
  it('category labels and the neutral "no period" wording follow the app language', async () => {
    await saveIrregularJournalField('2026-08-20', 'acne', 'Léger');
    const fr = await buildIrregularExportDays(['acne'], '3m', now);
    expect(fr.days[0].categories[0].label).toBe('Acné');

    await i18n.changeLanguage('en');
    const en = await buildIrregularExportDays(['acne'], '3m', now);
    expect(en.days[0].categories[0].label).toBe('Acne');
  });
});

describe('buildConceiveExportDays — language switch', () => {
  it('the estimated-ovulation notice interpolates a real date and follows the app language', async () => {
    await setCyclePreferences({
      lastPeriodStart: new Date('2026-08-01T12:00:00'),
      cycleDuration: 28,
      periodDuration: 5,
      regularity: 'yes',
    });

    const fr = await buildConceiveExportDays([], 'all', now);
    expect(fr.notices[0]).toMatch(/^Ovulation estimée \(estimation, non un fait confirmé\) : .+\.$/);

    await i18n.changeLanguage('en');
    const en = await buildConceiveExportDays([], 'all', now);
    expect(en.notices[0]).toMatch(/^Estimated ovulation \(estimate, not a confirmed fact\): .+\.$/);
  });
});
