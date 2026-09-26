import fs from 'fs';
import path from 'path';

// Static regression guard for "today". A screen that computes the live
// current day ONCE at mount (useMemo(..., [])) keeps treating yesterday as
// today across midnight / a resume from the background. Every screen that
// depends on the current day must obtain it from the shared useToday() hook
// (src/hooks/useToday.ts) — the single reactive-day solution.
//
// The guard deliberately targets known LIVE-CURRENT-DAY patterns and named
// screens instead of banning `new Date()` project-wide: timestamps
// (createdAt/updatedAt/recordedAt), user-selected dates, picker defaults and
// call-time `new Date()` inside handlers are legitimate.

const SRC = path.resolve(__dirname, '../..');

const read = (relative: string): string => fs.readFileSync(path.join(SRC, relative), 'utf8');

/* -------------------------------------------------------------------------
 * 1. Screens that MUST use useToday()
 * ---------------------------------------------------------------------- */

const DASHBOARDS = [
  'screens/CycleHomeScreen.tsx',
  'components/conceive/ConceiveDashboard.tsx',
  'components/contraception/ContraceptionDashboard.tsx',
  'components/irregular/IrregularDashboard.tsx',
  'components/menopause/MenopauseDashboard.tsx',
  'components/pregnancy/PregnancyDashboard.tsx',
  'components/postpartum/PostpartumDashboard.tsx',
  'components/miscarriage/MiscarriageDashboard.tsx',
];

const CALENDARS = [
  'screens/CalendarScreen.tsx',
  'components/conceive/ConceiveCalendarContent.tsx',
  'components/contraception/ContraceptionCalendarContent.tsx',
  'components/irregular/IrregularCalendarContent.tsx',
  'components/menopause/MenopauseCalendarContent.tsx',
  'components/pregnancy/PregnancyCalendarContent.tsx',
  'components/postpartum/PostpartumCalendarContent.tsx',
  'components/miscarriage/MiscarriageCalendarContent.tsx',
];

const STATISTICS = [
  'screens/StatisticsScreen.tsx',
  'screens/conceive/ConceiveStatisticsScreen.tsx',
  'screens/contraception/ContraceptionStatisticsScreen.tsx',
  'screens/irregular/IrregularStatisticsScreen.tsx',
  'screens/menopause/MenopauseStatisticsScreen.tsx',
  'screens/pregnancy/PregnancyStatisticsScreen.tsx',
  'screens/postpartum/PostpartumStatisticsScreen.tsx',
  'screens/miscarriage/MiscarriageStatisticsScreen.tsx',
];

const JOURNALS = [
  // Cycle / shared
  'screens/journal/JournalMoodScreen.tsx',
  'screens/journal/JournalSleepScreen.tsx',
  'screens/journal/JournalActivityScreen.tsx',
  'screens/journal/JournalSymptomsScreen.tsx',
  'screens/journal/JournalNoteScreen.tsx',
  'screens/journal/JournalIntimacyScreen.tsx',
  'screens/journal/JournalPrivatePhotosScreen.tsx',
  'screens/journal/HydrationScreen.tsx',
  'screens/journal/MenstrualFlowScreen.tsx',
  'screens/journal/JournalCycleEvolutionScreen.tsx',
  // Conceive
  'screens/journal/JournalTemperatureScreen.tsx',
  'screens/journal/JournalCervicalMucusScreen.tsx',
  'screens/journal/JournalLHTestScreen.tsx',
  'screens/journal/JournalConceptionReportsScreen.tsx',
  // Contraception / Irregular / Menopause / Pregnancy / Postpartum / Loss
  'screens/contraception/ContraceptionJournalEntryScreen.tsx',
  'screens/IrregularJournalEntryScreen.tsx',
  'screens/irregular/IrregularJournalOverviewScreen.tsx',
  'screens/menopause/MenopauseJournalEntryScreen.tsx',
  'screens/pregnancy/PregnancySymptomsScreen.tsx',
  'screens/pregnancy/PregnancyWeightScreen.tsx',
  'screens/pregnancy/PregnancyMedicalInformationScreen.tsx',
  'screens/pregnancy/PregnancyWeekScreen.tsx',
  'screens/PostpartumJournalEntryScreen.tsx',
  'screens/PostpartumLochiaScreen.tsx',
  'screens/MiscarriageJournalEntryScreen.tsx',
];

const OTHER_DAY_DEPENDENT = [
  'screens/ProfileScreen.tsx',
  'screens/PostpartumDeliveryDateScreen.tsx',
  'screens/MiscarriageDateScreen.tsx',
];

// Prayer / Hijri / Qadaa features follow the same shared current day as the
// rest of AWA (they are kept, not exempt).
const SPIRITUAL = [
  'screens/HijriCalendarScreen.tsx',
  'hooks/useQadaaStatus.ts',
  'hooks/usePrayerPurityStatus.ts',
];

describe.each([
  ['dashboards', DASHBOARDS],
  ['calendars', CALENDARS],
  ['statistics screens', STATISTICS],
  ['journal / tracking screens', JOURNALS],
  ['other day-dependent screens', OTHER_DAY_DEPENDENT],
  ['prayer / Hijri / Qadaa', SPIRITUAL],
])('%s read "today" from the shared useToday() hook', (_group, files) => {
  it.each(files)('%s', file => {
    const source = read(file);
    expect(source).toMatch(/useToday\(\)/);
    expect(source).toMatch(/hooks\/useToday/);
  });
});

/* -------------------------------------------------------------------------
 * 2. Known frozen live-day patterns are banned everywhere in the UI layer
 * ---------------------------------------------------------------------- */

// useMemo(() => [startOfDay(]new Date()[)], []) — the live day computed once.
const FROZEN_DAY_PATTERNS: [string, RegExp][] = [
  ['useMemo(() => new Date() / startOfDay(new Date()), [])', /useMemo\(\s*\(\)\s*=>\s*(?:startOfDay\(\s*)?new Date\(\s*\)\s*,?\s*\)?\s*,\s*\[\s*\]\s*,?\s*\)/],
  ["useMemo(() => new Date().toLocaleDateString('en-CA'), [])", /useMemo\(\s*\(\)\s*=>\s*new Date\(\)\.toLocaleDateString\('en-CA'\)\s*,\s*\[\s*\]\s*\)/],
  ['useMemo(() => todayKey(), [])', /useMemo\(\s*\(\)\s*=>\s*(?:todayKey|getTodayKey|toDateKey)\(\s*\)\s*,\s*\[\s*\]\s*\)/],
];

// A `now`/`today` held in state and seeded with `new Date()` is only legitimate
// when the file ALSO follows the shared hook (it must move when the day does).
const LIVE_DAY_STATE = /const \[\s*(?:today|now)\s*,\s*set\w+\s*\]\s*=\s*useState(?:<[^>]*>)?\(\s*(?:\(\)\s*=>\s*)?new Date\(\)/;

const walk = (directory: string): string[] =>
  fs.readdirSync(path.join(SRC, directory), {withFileTypes: true}).flatMap(entry => {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : walk(relative);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [relative] : [];
  });

const UI_FILES = ['screens', 'components', 'hooks']
  .flatMap(walk)
  .filter(file => file !== 'hooks/useToday.ts');

describe('no UI file freezes the live current day', () => {
  it('scans a meaningful number of UI files', () => {
    expect(UI_FILES.length).toBeGreaterThan(100);
  });

  it.each(FROZEN_DAY_PATTERNS)('never uses %s', (_label, pattern) => {
    const offenders = UI_FILES.filter(file => pattern.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('a `now`/`today` held in state seeded with new Date() only exists next to useToday()', () => {
    const offenders = UI_FILES.filter(file => {
      const source = read(file);
      return LIVE_DAY_STATE.test(source) && !/useToday\(\)/.test(source);
    });
    expect(offenders).toEqual([]);
  });
});

describe('legitimate new Date() usages are not banned', () => {
  it('timestamps and picker defaults remain allowed in the guarded files', () => {
    // updatedAt timestamps, time-picker bases and call-time dates are untouched.
    expect(read('screens/pregnancy/PregnancyWeightScreen.tsx')).toMatch(/updatedAt: new Date\(\)\.toISOString\(\)/);
    expect(read('screens/journal/JournalTemperatureScreen.tsx')).toMatch(/useState\(new Date\(\)\)/);
  });
});
