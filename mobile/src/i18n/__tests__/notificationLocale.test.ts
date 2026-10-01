import i18n from '../index';
import {fr} from '../locales/fr';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

// Phase 4 localization — dictionary-level coverage for every scheduled
// local-notification string (src/i18n/locales/{fr,en}.ts's `notifications`
// namespace), across all 8 objectives (Cycle, Conceive, Contraception,
// Irregular/SOPK, Menopause, Pregnancy, Postpartum, Pregnancy Loss) plus the
// shared spiritual reminders (Qadaa, Nifas). This intentionally tests the
// TRANSLATION DICTIONARY directly (via i18n.t()), not each scheduling file's
// own date/id logic — those already have their own dedicated test files.

beforeEach(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('fr');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('fr');
});

// One title/body key per objective (or per relevant leaf) whose FRENCH text
// must stay byte-identical to what each scheduling file hardcoded before
// Phase 4 — regressing any of these would silently change already-shipped
// notification copy for every existing user still on French.
const FRENCH_EXPECTATIONS: Array<[string, string]> = [
  ['notifications.privacyGenericBody', 'Tu as un nouveau rappel AWA.'],
  ['notifications.channelName', 'Rappels AWA'],
  ['notifications.fallbackTitle', 'Rappel AWA'],
  ['notifications.fallbackBody', 'Un nouveau rappel est disponible.'],
  ['notifications.cycle.upcomingPeriod.title', 'Tes règles sont prévues bientôt 🌸'],
  ['notifications.cycle.periodStartCheck.title', 'Tes règles ont peut-être commencé ?'],
  ['notifications.cycle.dailyJournal.title', 'Comment te sens-tu aujourd’hui ?'],
  ['notifications.cycle.fertileWindow.title', 'Ta fenêtre fertile estimée approche'],
  ['notifications.cycle.ovulation.title', 'Ovulation estimée 🌸'],
  ['notifications.conception.fertileWindow.title', 'Ta fenêtre fertile commence'],
  ['notifications.conception.estimatedOvulation.title', 'Ovulation estimée aujourd’hui'],
  ['notifications.conception.lhTest.title', 'Pense à ton test d’ovulation (LH)'],
  ['notifications.conception.temperature.title', 'Température basale'],
  ['notifications.conception.dailyJournal.title', 'Journal quotidien'],
  ['notifications.contraception.reminderTitle.pill', 'Rappel de prise'],
  ['notifications.contraception.reminderTitle.ring', 'Rappel lié à ton anneau'],
  ['notifications.contraception.reminderTitle.patch', 'Rappel lié à ton patch'],
  ['notifications.contraception.reminderTitle.other', 'Rappel de traitement'],
  ['notifications.contraception.defaultReminderTitle', 'Rappel de contraception'],
  ['notifications.contraception.body', 'Prends un instant pour ton suivi de contraception.'],
  ['notifications.irregular.dailyJournal.title', 'Journal quotidien'],
  ['notifications.irregular.unrecordedPeriod.title', 'Règles non renseignées'],
  ['notifications.menopause.dailyTracking.title', 'Ton suivi du jour'],
  ['notifications.menopause.treatment.title', 'Petit rappel'],
  ['notifications.pregnancy.weeklyUpdate.title', 'Nouvelle semaine de grossesse'],
  ['notifications.pregnancy.dailyJournal.title', 'Journal quotidien'],
  ['notifications.pregnancy.vitaminTitle', 'Vitamines & compléments'],
  ['notifications.pregnancy.medicationTitle', 'Médicament'],
  ['notifications.pregnancy.customReminderFallbackBody', 'Rappel personnalisé'],
  ['notifications.pregnancy.eventTypeLabels.appointment', 'Rendez-vous'],
  ['notifications.pregnancy.eventTypeLabels.exam', 'Examen'],
  ['notifications.pregnancy.reminderOffsetLabels.30min', '30 minutes avant'],
  ['notifications.pregnancy.reminderOffsetLabels.1hour', '1 heure avant'],
  ['notifications.pregnancy.reminderOffsetLabels.2hours', '2 heures avant'],
  ['notifications.pregnancy.reminderOffsetLabels.1day', '1 jour avant'],
  ['notifications.pregnancy.reminderOffsetLabels.custom', 'Personnalisé'],
  ['notifications.postpartum.dailyTracking.title', 'Ton suivi du jour'],
  ['notifications.postpartum.nifas.approachingTitle', 'Repère du nifâs à venir'],
  ['notifications.postpartum.nifas.approachingBody', 'Un repère concernant ton suivi post-partum approche.'],
  ['notifications.postpartum.nifas.approachingInAppMessage', 'Le repère des 40 jours retenu par AWA approche.'],
  ['notifications.postpartum.nifas.reachedTitle', 'Le repère des 40 jours retenu par AWA est atteint'],
  ['notifications.postpartum.nifas.reachedBody', 'Selon ce repère, tu peux reprendre tes prières même si des saignements persistent.'],
  ['notifications.postpartum.nifas.fallbackReachedTitle', 'Repère du nifas atteint'],
  ['notifications.postpartum.nifas.fallbackApproachingTitle', 'Repère du nifas à venir'],
  ['notifications.miscarriage.dailyTracking.title', 'Ton suivi du jour 🌿'],
  ['notifications.qadaa.title', 'Jeûnes à rattraper'],
];

describe('notifications dictionary — French byte-identical to pre-Phase-4 hardcoded copy', () => {
  it.each(FRENCH_EXPECTATIONS)('%s → %s', (key, expected) => {
    expect(i18n.t(key)).toBe(expected);
  });
});

describe('notifications dictionary — English coverage (every French key has a real, different English translation)', () => {
  const keyPaths = (obj: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      return v && typeof v === 'object' ? keyPaths(v as Record<string, unknown>, path) : [path];
    });

  const allKeys = keyPaths(fr.notifications, 'notifications');

  it('covers every objective plus spiritual reminders (Cycle, Conceive, Contraception, Irregular, Menopause, Pregnancy, Postpartum, Miscarriage, Qadaa)', () => {
    const namespaces = ['cycle', 'conception', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'miscarriage', 'qadaa'];
    namespaces.forEach(namespace => {
      expect(allKeys.some(key => key.startsWith(`notifications.${namespace}.`))).toBe(true);
    });
  });

  it.each(allKeys)('%s has a non-empty English string distinct from the raw key', async key => {
    await i18n.changeLanguage('en');
    const value = i18n.t(key);
    expect(typeof value).toBe('string');
    expect((value as string).length).toBeGreaterThan(0);
    expect(value).not.toBe(key);
    await i18n.changeLanguage('fr');
  });
});

describe('notifications dictionary — daughter-profile interpolation', () => {
  const daughterKeys = [
    'notifications.cycle.upcomingPeriodDaughter',
    'notifications.cycle.periodStartCheckDaughter',
    'notifications.cycle.dailyJournalDaughter',
    'notifications.cycle.fertileWindowDaughter',
    'notifications.cycle.ovulationDaughter',
  ];

  it.each(daughterKeys)('%s interpolates {{firstName}} in French', key => {
    const title = i18n.t(`${key}.title`, {firstName: 'Amina'});
    const body = i18n.t(`${key}.body`, {firstName: 'Amina'});
    expect(`${title} ${body}`).toContain('Amina');
    expect(`${title} ${body}`).not.toContain('{{firstName}}');
  });

  it.each(daughterKeys)('%s interpolates {{firstName}} in English', async key => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const title = i18n.t(`${key}.title`, {firstName: 'Amina'});
    const body = i18n.t(`${key}.body`, {firstName: 'Amina'});
    expect(`${title} ${body}`).toContain('Amina');
    expect(`${title} ${body}`).not.toContain('{{firstName}}');
  });

  it('pregnancy event title interpolates {{type}}', () => {
    const title = i18n.t('notifications.pregnancy.eventUpcomingTitle', {
      type: i18n.t('notifications.pregnancy.eventTypeLabels.appointment'),
    });
    expect(title).toBe('Rendez-vous à venir');
  });
});

describe('notifications dictionary — tone requirements', () => {
  it('never frames an unrecorded period as "late" ("retard"/"late") in either language — explicit product rule for Irregular/SOPK', async () => {
    const frText = `${i18n.t('notifications.irregular.unrecordedPeriod.title')} ${i18n.t('notifications.irregular.unrecordedPeriod.body')}`;
    expect(frText.toLowerCase()).not.toContain('retard');

    await i18n.changeLanguage('en');
    const en = `${i18n.t('notifications.irregular.unrecordedPeriod.title')} ${i18n.t('notifications.irregular.unrecordedPeriod.body')}`;
    expect(en.toLowerCase()).not.toContain('late');
    await i18n.changeLanguage('fr');
  });

  it('never mentions miscarriage/period/fertility/conception in the Pregnancy Loss daily-tracking notification, in either language', async () => {
    const forbidden = /(miscarriage|fausse couche|period|règles|fertil|conception)/i;
    const frText = `${i18n.t('notifications.miscarriage.dailyTracking.title')} ${i18n.t('notifications.miscarriage.dailyTracking.body')}`;
    expect(frText).not.toMatch(forbidden);

    await i18n.changeLanguage('en');
    const en = `${i18n.t('notifications.miscarriage.dailyTracking.title')} ${i18n.t('notifications.miscarriage.dailyTracking.body')}`;
    expect(en).not.toMatch(forbidden);
    await i18n.changeLanguage('fr');
  });
});
