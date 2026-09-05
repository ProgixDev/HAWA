import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildContraceptionExportDays,
  buildMenopauseExportDays,
  buildPostpartumExportDays,
} from '../medicalExportReaders';
import {savePostpartumJournalField} from '../../state/postpartumJournalStore';
import {savePostpartumLochiaEntry} from '../../state/postpartumLochiaStore';
import {saveMenopauseJournalField, addMenopauseLabResult} from '../../state/menopauseJournalStore';
import {setContraceptionIntakeStatus} from '../../state/contraceptionIntakeHistoryStore';
import {saveContraceptionJournalField} from '../../state/contraceptionJournalStore';

// medicalExportReaders.ts imports privateNotesEncryption.ts/
// privateJournalEncryption.ts at module scope for the Cycle/TTC readers —
// both transitively import react-native-keychain, unavailable in Jest. Even
// tests that only exercise the Postpartum/Menopause/Contraception readers
// below need this mock, since it's the whole file's import, not per-function.
jest.mock('../privateNotesEncryption', () => ({resolveNoteSection: jest.fn()}));
jest.mock('../privateJournalEncryption', () => ({resolveIntimacySection: jest.fn()}));

const now = new Date('2026-08-25T12:00:00');

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('buildPostpartumExportDays', () => {
  it('reads real postpartumJournalStore/postpartumLochiaStore data, filtered by date and category', async () => {
    await savePostpartumJournalField('2026-08-20', 'fatigue', 'Modérée');
    await savePostpartumJournalField('2026-01-01', 'fatigue', 'Ancienne entrée hors période');
    await savePostpartumLochiaEntry('2026-08-20', {flow: 'Léger', color: 'Rouge', consistency: 'Liquide', symptoms: []});

    const {days} = await buildPostpartumExportDays(['fatigue', 'lochia'], '3m', now);

    expect(days.map(day => day.date)).toEqual(['2026-08-20']);
    const labels = days[0].categories.map(category => category.label);
    expect(labels).toEqual(expect.arrayContaining(['Fatigue', 'Lochies']));
  });

  it('excludes a category the user did not select, even though real data exists for it', async () => {
    await savePostpartumJournalField('2026-08-21', 'fatigue', 'Modérée');
    await savePostpartumJournalField('2026-08-21', 'mood', 'Triste');

    const {days} = await buildPostpartumExportDays(['fatigue'], 'all', now);

    const day = days.find(d => d.date === '2026-08-21');
    const labels = day?.categories.map(category => category.label) ?? [];
    expect(labels).toEqual(['Fatigue']);
    expect(labels).not.toContain('Humeur');
  });

  it('never surfaces Nifas reminder-scheduling state as medical data (no such category exists)', async () => {
    await savePostpartumJournalField('2026-08-20', 'fatigue', 'Modérée');
    const {days} = await buildPostpartumExportDays(['fatigue'], 'all', now);
    const serialized = JSON.stringify(days).toLowerCase();
    expect(serialized).not.toContain('nifas');
    expect(serialized).not.toContain('warningscheduled');
  });
});

describe('buildMenopauseExportDays', () => {
  it('merges journal entries and lab results into the same day, without inventing an interpretation', async () => {
    await saveMenopauseJournalField('2026-08-20', 'symptoms', ['hot_flashes']);
    await addMenopauseLabResult({type: 'fsh', value: 32, date: '2026-08-20'});

    const {days} = await buildMenopauseExportDays(['symptoms', 'labResults'], 'all', now);

    expect(days).toHaveLength(1);
    const lines = days[0].categories.flatMap(category => category.lines);
    expect(lines.some(line => line.includes('FSH : 32'))).toBe(true);
    const serialized = lines.join(' ').toLowerCase();
    ['normal', 'anormal', 'diagnostic'].forEach(forbiddenWord => expect(serialized).not.toContain(forbiddenWord));
  });

  it('translates symptom keys into French labels, never the raw enum', async () => {
    await saveMenopauseJournalField('2026-08-20', 'symptoms', ['hot_flashes', 'brain_fog']);
    const {days} = await buildMenopauseExportDays(['symptoms'], 'all', now);
    const lines = days[0].categories.flatMap(category => category.lines).join(' ');
    expect(lines).toContain('Bouffées de chaleur');
    expect(lines).toContain('Brouillard mental');
    expect(lines).not.toContain('hot_flashes');
  });
});

describe('buildContraceptionExportDays', () => {
  it('reads intake history and journal separately, excluding journal notes when not selected', async () => {
    await setContraceptionIntakeStatus('2026-08-20', 'taken', 'pill');
    await saveContraceptionJournalField('2026-08-20', 'notes', 'PRIVATE CONTRACEPTION NOTE');

    const {days} = await buildContraceptionExportDays(['intake'], 'all', now);

    const serialized = JSON.stringify(days);
    expect(serialized).toContain('Pris');
    expect(serialized).not.toContain('PRIVATE CONTRACEPTION NOTE');
  });

  it('includes journal notes only when "journal" is explicitly selected', async () => {
    await saveContraceptionJournalField('2026-08-20', 'notes', 'PRIVATE CONTRACEPTION NOTE');
    const {days} = await buildContraceptionExportDays(['journal'], 'all', now);
    expect(JSON.stringify(days)).toContain('PRIVATE CONTRACEPTION NOTE');
  });
});
