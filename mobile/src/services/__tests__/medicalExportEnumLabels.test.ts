import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildConceiveExportDays,
  buildContraceptionExportDays,
  buildCycleExportDays,
  buildMenopauseExportDays,
  buildPregnancyExportDays,
} from '../medicalExportReaders';
import {
  formatCategoryValue,
  formatEnumOrRaw,
  formatProtectionLabel,
  type ExportDayEntry,
} from '../medicalExportFormatting';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {encryptIntimacySection} from '../privateJournalEncryption';
import {addMenopauseLabResult, saveMenopauseJournalField} from '../../state/menopauseJournalStore';
import {setMenopauseHormonalTreatmentStatus, setMenopauseLabTracking} from '../../state/menopausePreferences';
import {addContraceptionEvent} from '../../state/contraceptionEventStore';
import {savePregnancyMedicalEvent} from '../../state/pregnancyMedicalEventsStore';
import type {DailyJournalEntry} from '../../types/journal';

// M42 / M27 — the medical export must speak human-readable French, never the
// internal enum identifiers stored in AsyncStorage, and must not hide history
// that was genuinely recorded because a CURRENT preference is switched off.
// Real stores + real encryption (in-memory AsyncStorage / Keychain from
// jest.setup.js). The stores are module singletons: every test uses its own
// distinct dates.

const now = new Date('2026-08-25T12:00:00');

const allLines = (days: ExportDayEntry[]) => days.flatMap(day => day.categories.flatMap(category => category.lines));

beforeAll(async () => {
  await AsyncStorage.clear();
});

describe('formatEnumOrRaw / formatCategoryValue — labels, unknown fallback', () => {
  it('maps a known internal value through an existing label map', () => {
    expect(formatEnumOrRaw('light', {light: 'Léger'})).toBe('Léger');
    expect(formatEnumOrRaw(undefined, {light: 'Léger'})).toBeUndefined();
  });

  it('falls back to the raw stored value for an unknown one — never an invented translation, never an inherited property', () => {
    expect(formatEnumOrRaw('brand_new_value', {light: 'Léger'})).toBe('brand_new_value');
    expect(formatEnumOrRaw('constructor', {light: 'Léger'})).toBe('constructor');
    expect(formatEnumOrRaw('toString', {})).toBe('toString');
  });

  it('cycle: symptom severity is a French label, unknown severity stays raw', () => {
    const entry = (severity: string) =>
      ({id: '1', date: '2026-08-01', symptoms: {names: ['Fatigue'], severity}}) as unknown as DailyJournalEntry;
    expect(formatCategoryValue('symptoms', entry('mild'))).toContain('Intensité : Légère');
    expect(formatCategoryValue('symptoms', entry('moderate'))).toContain('Intensité : Modérée');
    // 'severe' is stored for both "Forte" and "Très forte" — the export says so.
    expect(formatCategoryValue('symptoms', entry('severe'))).toContain('Intensité : Forte / très forte');
    expect(formatCategoryValue('symptoms', entry('extreme'))).toContain('Intensité : extreme');
  });

  it('conceive: cervical mucus type is a French label, unknown type stays raw', () => {
    const entry = (type: string) => ({id: '1', date: '2026-08-01', cervicalMucus: {type}}) as unknown as DailyJournalEntry;
    expect(formatCategoryValue('cervicalMucus', entry('eggWhite'))).toEqual(['Glaire cervicale : Claire et élastique']);
    expect(formatCategoryValue('cervicalMucus', entry('dry'))).toEqual(['Glaire cervicale : Sèche']);
    expect(formatCategoryValue('cervicalMucus', entry('mystery'))).toEqual(['Glaire cervicale : mystery']);
  });

  it('intimacy protection answer: yes/no/unknown -> French, anything else raw', () => {
    expect(formatProtectionLabel('yes')).toBe('Oui');
    expect(formatProtectionLabel('no')).toBe('Non');
    expect(formatProtectionLabel('unknown')).toBe('Non renseigné');
    expect(formatProtectionLabel('maybe')).toBe('maybe');
  });
});

describe('readers — no raw internal enum reaches the export', () => {
  it('cycle: symptom severity + decrypted intimacy protection are French (real encrypted store round-trip)', async () => {
    const date = '2026-08-03';
    await saveJournalSection(date, 'symptoms', {names: ['Crampes'], severity: 'moderate'});
    await saveJournalSection(date, 'encryptedIntimacy', await encryptIntimacySection({answer: 'yes', protection: 'unknown'}));

    const {days} = await buildCycleExportDays(['symptoms', 'intimacy'], 'all', now);
    const lines = allLines(days.filter(day => day.date === date));
    expect(lines).toEqual(expect.arrayContaining(['Intensité : Modérée', 'Protection : Non renseigné']));
    const joined = lines.join(' ');
    expect(joined).not.toMatch(/\b(moderate|mild|severe|unknown)\b/);
  });

  it('conceive: cervical mucus is French', async () => {
    const date = '2026-08-04';
    await saveJournalSection(date, 'cervicalMucus', {type: 'eggWhite'});
    const {days} = await buildConceiveExportDays(['cervicalMucus'], 'all', now);
    expect(allLines(days.filter(day => day.date === date))).toEqual(['Glaire cervicale : Claire et élastique']);
  });

  it('menopause: mood / intensity / sleep quality / energy / treatment / lab type are French labels (existing menopause config maps)', async () => {
    const date = '2026-08-10';
    await saveMenopauseJournalField(date, 'symptoms', ['hot_flashes', 'brain_fog']);
    await saveMenopauseJournalField(date, 'symptomIntensity', 'severe');
    await saveMenopauseJournalField(date, 'mood', 'veryGood');
    await saveMenopauseJournalField(date, 'sleepQuality', 'poor');
    await saveMenopauseJournalField(date, 'sleepDurationHours', 6);
    await saveMenopauseJournalField(date, 'energyLevel', 'low');
    await saveMenopauseJournalField(date, 'treatmentStatus', 'not_taken');
    await addMenopauseLabResult({type: 'estradiol', value: 40, unit: 'pg/mL', date});

    const {days} = await buildMenopauseExportDays(
      ['symptoms', 'mood', 'sleep', 'energy', 'treatment', 'labResults'],
      'all',
      now,
    );
    const lines = allLines(days.filter(day => day.date === date));
    expect(lines).toEqual(
      expect.arrayContaining([
        'Bouffées de chaleur, Brouillard mental',
        'Intensité : Sévère',
        'Très bien',
        'Durée : 6 h',
        'Qualité : Mauvaise',
        'Faible',
        'Non pris aujourd’hui',
        'Estradiol : 40 pg/mL',
      ]),
    );
    const joined = lines.join(' ');
    ['veryGood', 'severe', 'poor', 'not_taken', 'hot_flashes', 'brain_fog', 'estradiol'].forEach(raw =>
      expect(joined).not.toContain(raw),
    );

    // Stored values are untouched (the export only relabels at output time).
    const persisted = JSON.parse((await AsyncStorage.getItem('@hawa/menopause-journal/v1')) as string);
    expect(persisted[date].mood).toBe('veryGood');
    expect(persisted[date].sleepQuality).toBe('poor');
    expect(persisted[date].treatmentStatus).toBe('not_taken');
  });

  it('contraception ring/patch events and pregnancy appointment types are French', async () => {
    await addContraceptionEvent('2026-08-06', 'ring_insertion');
    await addContraceptionEvent('2026-08-07', 'patch_replacement');
    const contraception = await buildContraceptionExportDays(['events'], 'all', now);
    const lines = allLines(contraception.days);
    expect(lines).toEqual(expect.arrayContaining(['Pose de l’anneau', 'Remplacement du patch']));
    expect(lines.join(' ')).not.toMatch(/ring_|patch_/);

    await savePregnancyMedicalEvent({
      id: 'evt-enum-1',
      type: 'exam',
      date: '2026-08-08',
      title: 'Échographie',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    });
    const pregnancy = await buildPregnancyExportDays(['appointments'], 'all', now);
    const labels = pregnancy.days.flatMap(day => day.categories.map(category => category.label));
    expect(labels.join(' ')).toContain('Examen');
    expect(labels.join(' ')).not.toMatch(/\bexam\b|\bappointment\b/);
  });
});

describe('M27 — menopause history is exported regardless of the CURRENT tracking preferences', () => {
  it('a treatment recorded while tracking was on is still exported after the preference is switched off', async () => {
    const date = '2026-08-12';
    await setMenopauseHormonalTreatmentStatus('track');
    await saveMenopauseJournalField(date, 'treatmentStatus', 'taken');
    await saveMenopauseJournalField(date, 'treatmentNote', 'Note traitement');

    const tracked = await buildMenopauseExportDays(['treatment'], 'all', now);
    expect(allLines(tracked.days.filter(day => day.date === date))).toEqual(['Pris aujourd’hui', 'Note : Note traitement']);

    await setMenopauseHormonalTreatmentStatus('no');
    const afterDisable = await buildMenopauseExportDays(['treatment'], 'all', now);
    expect(allLines(afterDisable.days.filter(day => day.date === date))).toEqual(['Pris aujourd’hui', 'Note : Note traitement']);

    await setMenopauseHormonalTreatmentStatus('not_now');
    const notNow = await buildMenopauseExportDays(['treatment'], 'all', now);
    expect(allLines(notNow.days.filter(day => day.date === date))).toEqual(['Pris aujourd’hui', 'Note : Note traitement']);
  });

  it('lab results recorded earlier are still exported when lab tracking is later set to "none"', async () => {
    const date = '2026-08-13';
    await setMenopauseLabTracking('both');
    await addMenopauseLabResult({type: 'fsh', value: 55, date});
    await setMenopauseLabTracking('none');

    const {days} = await buildMenopauseExportDays(['labResults'], 'all', now);
    expect(allLines(days.filter(day => day.date === date))).toEqual(['FSH : 55']);
  });

  it('no fake history: a range with no recorded treatment stays empty, and out-of-range history is not pulled in', async () => {
    await setMenopauseHormonalTreatmentStatus('track');
    // Recorded long before the 3-month window ending 2026-08-25.
    await saveMenopauseJournalField('2025-01-05', 'treatmentStatus', 'taken');

    const inWindow = await buildMenopauseExportDays(['treatment'], '3m', now);
    expect(inWindow.days.some(day => day.date === '2025-01-05')).toBe(false);
    inWindow.days.forEach(day => {
      expect(day.categories.every(category => category.category === 'treatment' && category.lines.length > 0)).toBe(true);
    });

    // A day with only a mood (no treatment recorded) never gets a treatment line.
    await saveMenopauseJournalField('2026-08-14', 'mood', 'good');
    const treatmentOnly = await buildMenopauseExportDays(['treatment'], 'all', now);
    expect(treatmentOnly.days.some(day => day.date === '2026-08-14')).toBe(false);
  });
});
