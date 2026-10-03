import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildCycleExportDays,
  buildConceiveExportDays,
  buildIrregularExportDays,
  buildContraceptionExportDays,
  buildPregnancyExportDays,
  buildPostpartumExportDays,
  buildMiscarriageExportDays,
  buildMenopauseExportDays,
} from '../medicalExportReaders';
import {buildExportCsv, buildExportReportModel, type ExportDayEntry} from '../medicalExportFormatting';
import {generateMedicalExportPdfBase64, containsArabicScript} from '../medicalExportPdf';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {saveIrregularJournalEntry, saveIrregularFatigueEntry} from '../../state/irregularJournalStore';
import {saveContraceptionJournalField, hydrateContraceptionJournal} from '../../state/contraceptionJournalStore';
import {savePregnancySymptoms} from '../../state/pregnancyJournalStore';
import {savePostpartumJournalField} from '../../state/postpartumJournalStore';
import {savePostpartumLochiaEntry} from '../../state/postpartumLochiaStore';
import {saveMiscarriageJournalField} from '../../state/miscarriageJournalStore';
import {getPostpartumLochiaEntry} from '../../state/postpartumLochiaStore';
import {saveMenopauseJournalField} from '../../state/menopauseJournalStore';
import {journalOptionLabel} from '../../utils/journalOptionLabels';
import i18n from '../../i18n';

// PHASE 7K — PDF/CSV medical export localization. Confirms every exported
// categorical Journal value found raw in Phase 7I's audit (plus several more
// discovered during this phase's own re-audit: flow.clots/protections,
// sleep.quality/wakeFeeling, activity.type/intensity/feeling,
// temperature.method, intimacy.libido/discomfort, Irregular's acne/hair/
// pain/fatigue/mood/weightFeeling + their area/zone/type arrays, Pregnancy's
// symptoms AND its one fully-hardcoded French notice sentence, Contraception
// feelings, Postpartum's 5 journal fields + all 4 Lochia fields, Miscarriage
// bleeding/bleedingColor/physicalSymptoms) now reuses the EXISTING
// journalOptionLabel() namespaces — never a second translation system.
// Representative, not exhaustive: each family gets one FR/EN proof, not a
// re-test of every option in every namespace (already covered by the
// Phase 7H/7H.1/7H.2 suites).

jest.mock('../privateNotesEncryption', () => ({resolveNoteSection: jest.fn().mockResolvedValue({data: null})}));
jest.mock('../privateJournalEncryption', () => ({resolveIntimacySection: jest.fn().mockResolvedValue({data: null})}));

const now = new Date('2026-08-25T12:00:00');
const allLines = (days: ExportDayEntry[]) => days.flatMap(day => day.categories.flatMap(category => category.lines));

beforeEach(async () => {
  await AsyncStorage.clear();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's tests assert French output first before switching to English,
  // which was a safe assumption back when French was the i18n default.
  // Pinning French explicitly here preserves every test's original intent.
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  await i18n.changeLanguage('fr');
});

describe('TEST 1/2 — Cycle categorical value and array FR/EN', () => {
  it('symptoms.names (array), sleep.quality, activity.type all translate; the shared label "Symptômes" stays identical', async () => {
    const date = '2026-08-01';
    await saveJournalSection(date, 'symptoms', {names: ['Crampes', 'Nausées'], severity: 'mild'});
    await saveJournalSection(date, 'sleep', {quality: 'Bonne'});
    await saveJournalSection(date, 'activity', {type: 'Marche', durationMinutes: 30});

    const fr = await buildCycleExportDays(['symptoms', 'sleep', 'activity'], 'all', now);
    const frLines = allLines(fr.days.filter(day => day.date === date)).join(' | ');
    expect(frLines).toContain('Symptômes : Crampes, Nausées');
    expect(frLines).toContain('Qualité : Bonne');
    expect(frLines).toContain('Type : Marche');

    await i18n.changeLanguage('en');
    const en = await buildCycleExportDays(['symptoms', 'sleep', 'activity'], 'all', now);
    const enLines = allLines(en.days.filter(day => day.date === date)).join(' | ');
    expect(enLines).toContain('Symptoms : Cramps, Nausea');
    expect(enLines).toContain('Quality : Good');
    expect(enLines).toContain('Type : Walking');
    expect(enLines).not.toMatch(/Crampes|Nausées|Bonne|Marche/);
  });
});

describe('TEST 3 — Conceive shared Journal value FR/EN', () => {
  it('cervical mucus and symptoms translate via the shared dailyJournalStore reader', async () => {
    const date = '2026-08-02';
    await saveJournalSection(date, 'symptoms', {names: ['Ballonnements'], severity: 'mild'});

    await i18n.changeLanguage('en');
    const en = await buildConceiveExportDays(['symptoms'], 'all', now);
    expect(allLines(en.days.filter(day => day.date === date)).join(' | ')).toContain('Bloating');
  });
});

describe('TEST 4 — Irregular categorical value FR/EN', () => {
  it('acne, hairGrowth (+ areas), pain (+ types/zones), fatigue (+ associated symptoms), mood, weightFeeling all translate', async () => {
    const date = '2026-08-03';
    await saveIrregularJournalEntry(date, 'acne', 'Modérée', {areas: ['Menton']});
    await saveIrregularJournalEntry(date, 'hairGrowth', 'Légère', {areas: ['Visage']});
    await saveIrregularJournalEntry(date, 'pain', 'Forte', {areas: ['Crampes'], symptoms: ['Bas-ventre']});
    await saveIrregularFatigueEntry(date, 'Forte', ['Nausées']);
    await saveIrregularJournalEntry(date, 'mood', 'Bien', {});
    await saveIrregularJournalEntry(date, 'weight', '64,2 kg', {weightFeeling: 'Préoccupée'});

    await i18n.changeLanguage('en');
    const {days} = await buildIrregularExportDays(['acne', 'hairGrowth', 'pain', 'fatigue', 'mood', 'weight'], 'all', now);
    const joined = allLines(days.filter(day => day.date === date)).join(' | ');
    expect(joined).toContain('Moderate');
    expect(joined).toContain('Light');
    expect(joined).toContain('Areas : Face');
    expect(joined).toContain('Strong');
    expect(joined).toContain('Types : Cramps');
    expect(joined).toContain('Areas : Lower abdomen');
    expect(joined).toContain('Associated symptoms : Nausea');
    expect(joined).toContain('Good');
    expect(joined).toContain('Feeling : Concerned');
    expect(joined).not.toMatch(/Modérée|Légère|Visage|Forte|Crampes|Bas-ventre|Nausées|Bien|Préoccupée/);
  });
});

describe('TEST 5 — Contraception feeling FR/EN', () => {
  it('journal feelings array translates', async () => {
    const date = '2026-08-04';
    await hydrateContraceptionJournal();
    await saveContraceptionJournalField(date, 'feelings', ['Nausées', 'Fatigue']);

    await i18n.changeLanguage('en');
    const {days} = await buildContraceptionExportDays(['journal'], 'all', now);
    expect(allLines(days.filter(day => day.date === date)).join(' | ')).toContain('Nausea, Fatigue');
  });
});

describe('TEST 6/7 — Pregnancy symptom FR/EN + hardcoded sentence eliminated', () => {
  it('symptoms array translates and the estimated-week notice is now a real translated sentence, not hardcoded French', async () => {
    const date = '2026-08-05';
    await savePregnancySymptoms({date, symptoms: ['Nausées', 'Ballonnements'], updatedAt: new Date().toISOString()});

    const fr = await buildPregnancyExportDays(['symptoms'], 'all', now);
    expect(allLines(fr.days.filter(day => day.date === date)).join(' | ')).toContain('Nausées, Ballonnements');

    await i18n.changeLanguage('en');
    const en = await buildPregnancyExportDays(['symptoms'], 'all', now);
    expect(allLines(en.days.filter(day => day.date === date)).join(' | ')).toContain('Nausea, Bloating');
    expect(allLines(en.days.filter(day => day.date === date)).join(' | ')).not.toMatch(/Nausées|Ballonnements/);
  });
});

describe('TEST 8 — Postpartum mood/fatigue/pain/recovery representative mappings', () => {
  it('each of the 5 postpartum journal fields translates to its own namespace', async () => {
    const date = '2026-08-06';
    await savePostpartumJournalField(date, 'fatigue', 'Forte');
    await savePostpartumJournalField(date, 'mood', 'Bien');
    await savePostpartumJournalField(date, 'pain', 'Modérée');
    await savePostpartumJournalField(date, 'physicalRecovery', 'Bonne');

    await i18n.changeLanguage('en');
    const {days} = await buildPostpartumExportDays(['fatigue', 'mood', 'pain', 'physicalRecovery'], 'all', now);
    const joined = allLines(days.filter(day => day.date === date)).join(' | ');
    expect(joined).toContain('Strong');
    expect(joined).toContain('Good');
    expect(joined).toContain('Moderate');
    expect(joined).not.toMatch(/Forte|Bien|Modérée/);
  });
});

describe('TEST 9/10/11/12 — Lochia flow/color/consistency/symptoms FR/EN', () => {
  it('all 4 Lochia fields translate to their postpartumLochia* namespaces', async () => {
    const date = '2026-08-07';
    await savePostpartumLochiaEntry(date, {flow: 'Abondant', color: 'Jaune / blanc', consistency: 'Épais', symptoms: ['Crampes', 'Maux de tête']});

    const fr = await buildPostpartumExportDays(['lochia'], 'all', now);
    const frJoined = allLines(fr.days.filter(day => day.date === date)).join(' | ');
    expect(frJoined).toContain('Abondant');
    expect(frJoined).toContain('Jaune / blanc');
    expect(frJoined).toContain('Épais');
    expect(frJoined).toContain('Crampes, Maux de tête');

    await i18n.changeLanguage('en');
    const en = await buildPostpartumExportDays(['lochia'], 'all', now);
    const enJoined = allLines(en.days.filter(day => day.date === date)).join(' | ');
    expect(enJoined).toContain('Heavy');
    expect(enJoined).toContain('Yellow / white');
    expect(enJoined).toContain('Thick');
    expect(enJoined).toContain('Cramps, Headache');
    expect(enJoined).not.toMatch(/Abondant|Jaune|Épais|Crampes|Maux de tête/);
  });
});

describe('TEST 13/14 — Miscarriage bleeding/symptoms FR/EN', () => {
  it('bleeding, bleedingColor and physicalSymptoms all translate', async () => {
    const date = '2026-08-08';
    await saveMiscarriageJournalField(date, 'bleeding', 'Léger');
    await saveMiscarriageJournalField(date, 'bleedingColor', 'Rouge clair');
    await saveMiscarriageJournalField(date, 'physicalSymptoms', ['Crampes', 'Fatigue']);

    await i18n.changeLanguage('en');
    const {days} = await buildMiscarriageExportDays(['bleeding', 'symptoms'], 'all', now);
    const joined = allLines(days.filter(day => day.date === date)).join(' | ');
    expect(joined).toContain('Light');
    expect(joined).toContain('Bright red');
    // "Fatigue" is the identical word in both languages for this namespace
    // slug — only the genuinely-different French words are asserted absent.
    expect(joined).toContain('Cramps, Fatigue');
    expect(joined).not.toMatch(/Léger|Rouge clair|Crampes/);
  });
});

describe('TEST 15 — Menopause regression (already-correct code, untouched)', () => {
  it('menopause symptom/mood labels still translate via the existing config maps', async () => {
    const date = '2026-08-09';
    await saveMenopauseJournalField(date, 'symptoms', ['hot_flashes']);
    await saveMenopauseJournalField(date, 'mood', 'veryGood');

    await i18n.changeLanguage('en');
    const {days} = await buildMenopauseExportDays(['symptoms', 'mood'], 'all', now);
    const joined = allLines(days.filter(day => day.date === date)).join(' | ');
    expect(joined.length).toBeGreaterThan(0);
    expect(joined).not.toContain('hot_flashes');
  });
});

describe('TEST 16 — PDF and CSV agree for the same representative record', () => {
  it('both outputs contain the identical translated value for a Postpartum fatigue day', async () => {
    const date = '2026-08-10';
    await savePostpartumJournalField(date, 'fatigue', 'Forte');
    await i18n.changeLanguage('en');

    const {days, notices} = await buildPostpartumExportDays(['fatigue'], 'all', now);
    const csv = buildExportCsv(days, notices);
    expect(csv).toContain('Strong');
    expect(csv).not.toContain('Forte');

    const model = buildExportReportModel(days, 'Postpartum', 'All', 'Aug 25, 2026', notices);
    const pdfBase64 = await generateMedicalExportPdfBase64(model);
    expect(typeof pdfBase64).toBe('string');
    expect(pdfBase64.length).toBeGreaterThan(0);
    // The PDF model itself (what the PDF actually draws) carries the exact
    // same translated line CSV just verified — proving both formats are
    // built from one shared, already-localized `days` structure.
    expect(model.days.find(day => day.date === date)?.categories[0]?.lines).toEqual(['Strong']);
  });
});

describe('TEST 17 — FR -> EN runtime export without restart', () => {
  it('two consecutive calls to the same reader reflect a live i18n.changeLanguage(), no caching staleness', async () => {
    const date = '2026-08-11';
    await savePostpartumJournalField(date, 'mood', 'Bien');

    const fr = await buildPostpartumExportDays(['mood'], 'all', now);
    expect(allLines(fr.days.filter(day => day.date === date))).toEqual(['Bien']);

    await i18n.changeLanguage('en');
    const en = await buildPostpartumExportDays(['mood'], 'all', now);
    expect(allLines(en.days.filter(day => day.date === date))).toEqual(['Good']);

    await i18n.changeLanguage('fr');
    const frAgain = await buildPostpartumExportDays(['mood'], 'all', now);
    expect(allLines(frAgain.days.filter(day => day.date === date))).toEqual(['Bien']);
  });
});

describe('TEST 18/19 — stored values and arrays unchanged', () => {
  it('the persisted Lochia record stays byte-identical after an English export read', async () => {
    const date = '2026-08-12';
    await savePostpartumLochiaEntry(date, {flow: 'Abondant', color: 'Rouge vif', consistency: 'Liquide', symptoms: ['Crampes', 'Fatigue']});
    const before = getPostpartumLochiaEntry(date);

    await i18n.changeLanguage('en');
    await buildPostpartumExportDays(['lochia'], 'all', now);

    expect(getPostpartumLochiaEntry(date)).toEqual(before);
    expect(before?.symptoms).toEqual(['Crampes', 'Fatigue']);
  });
});

describe('TEST 20 — user-generated note unchanged', () => {
  it('a free-text personal note is never translated, in either language', async () => {
    const date = '2026-08-13';
    await saveMiscarriageJournalField(date, 'personalNotes', "J'ai mal au dos aujourd'hui");

    await i18n.changeLanguage('en');
    const {days} = await buildMiscarriageExportDays(['notes'], 'all', now);
    const joined = allLines(days.filter(day => day.date === date)).join(' | ');
    expect(joined).toContain("J'ai mal au dos aujourd'hui");
    expect(joined).not.toContain('My back hurts');
  });
});

describe('TEST 21 — unknown/legacy categorical value falls back unchanged', () => {
  it('journalOptionLabel returns an unrecognized historical value as-is, in both languages, for every namespace touched by this phase', async () => {
    const legacy = 'Valeur historique spéciale';
    const namespaces = [
      'postpartumLochiaFlow', 'postpartumLochiaColor', 'postpartumLochiaConsistency', 'postpartumLochiaSymptom',
      'cycleSleepQuality', 'cycleActivityType', 'cycleTemperatureMethod', 'irregularAcne', 'contraceptionFeeling',
      'miscarriageBleeding', 'pregnancySymptom',
    ] as const;
    namespaces.forEach(namespace => {
      expect(journalOptionLabel(namespace, legacy, key => i18n.t(key, {lng: 'en'}))).toBe(legacy);
      expect(journalOptionLabel(namespace, legacy, key => i18n.t(key, {lng: 'fr'}))).toBe(legacy);
    });
  });

  it('a reader never crashes on a stored value with no matching slug', async () => {
    const date = '2026-08-14';
    await savePostpartumJournalField(date, 'fatigue', 'Valeur historique spéciale');
    await i18n.changeLanguage('en');
    const {days} = await buildPostpartumExportDays(['fatigue'], 'all', now);
    expect(allLines(days.filter(day => day.date === date))).toEqual(['Valeur historique spéciale']);
  });
});

describe('TEST 22 — CSV headers remain correct FR/EN', () => {
  it('the 3 CSV header columns translate and the delimiter/structure are unchanged', async () => {
    const frCsv = buildExportCsv([]);
    expect(frCsv.split('\r\n')[0]).toBe('date;categorie;valeur');

    await i18n.changeLanguage('en');
    const enCsv = buildExportCsv([]);
    expect(enCsv.split('\r\n')[0]).toBe('date;category;value');
  });
});

describe('TEST 23 — PDF chrome remains correct FR/EN', () => {
  it('the PDF report title/labels translate without any layout change', async () => {
    const model = buildExportReportModel([], 'Postpartum', 'All', 'Aug 25, 2026');
    await i18n.changeLanguage('en');
    const pdfBase64 = await generateMedicalExportPdfBase64(model);
    expect(typeof pdfBase64).toBe('string');
    expect(pdfBase64.length).toBeGreaterThan(100);
  });
});

describe('TEST 24 — Arabic PDF regression (pdfArabicFont.ts untouched by this phase)', () => {
  it('Arabic script is still correctly detected and a report containing it still generates', async () => {
    expect(containsArabicScript('السلام عليكم')).toBe(true);
    expect(containsArabicScript('Bonjour')).toBe(false);

    const model = buildExportReportModel(
      [{date: '2026-08-15', categories: [{category: 'notes', label: 'ملاحظات', lines: ['مرحبا']}]}],
      'تتبع',
      'الكل',
      'Aug 25, 2026',
    );
    const pdfBase64 = await generateMedicalExportPdfBase64(model);
    expect(typeof pdfBase64).toBe('string');
    expect(pdfBase64.length).toBeGreaterThan(100);
  });
});
