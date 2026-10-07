import {WEEK_DAYS, WEEK_DAYS_EN, WEEK_DAYS_ES, localizedWeekDays} from '../cycleMath';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

// Phase 7F.1 — WEEK_DAYS cleanup. `localizedWeekDays()` is the shared,
// language-aware accessor now used by every genuine consumer of the raw
// cycleMath.ts WEEK_DAYS export (HijriMonthGrid, and the Pregnancy/
// Postpartum/Miscarriage(automatic)/Conceive/Contraception/Irregular/
// Menopause calendar contents) — the handful of screens that had already
// built their OWN local WEEK_DAYS_FR/EN pattern (CycleInformationScreen,
// MonthCalendarCard, etc.) are untouched, since they never consumed the
// shared export in the first place.

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's French-expecting assertions were written against the old French
  // default and never set a language explicitly (every English-expecting
  // assertion already does). Pinning French here preserves every test's
  // original intent. localizedWeekDays() reads getAppLanguage() directly
  // (not i18n.language), so setAppLanguage alone is sufficient here.
  await setAppLanguage('fr');
});

describe('TEST 1 — French weekday labels are correct', () => {
  it('matches the original, unchanged Monday-first French array', () => {
    expect(WEEK_DAYS).toEqual(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);
    expect(localizedWeekDays()).toEqual(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);
  });
});

describe('TEST 2 — English weekday labels are correct', () => {
  it('matches the Monday-first English array', async () => {
    await setAppLanguage('en');
    expect(WEEK_DAYS_EN).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(localizedWeekDays()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
});

describe('TEST 3/4 — weekday order/index and first day of week are identical FR vs EN', () => {
  it('both arrays have the same length and the same Monday-first index mapping', async () => {
    const fr = localizedWeekDays();
    await setAppLanguage('en');
    const en = localizedWeekDays();

    expect(en).toHaveLength(fr.length);
    expect(fr[0]).toBe('Lun'); // Monday stays index 0
    expect(en[0]).toBe('Mon'); // Monday stays index 0 — never silently switched to Sunday-first
    expect(fr[6]).toBe('Dim'); // Sunday stays index 6
    expect(en[6]).toBe('Sun');
    // Index-for-index: every position names the same real weekday in both languages.
    const frToEn = ['Lun:Mon', 'Mar:Tue', 'Mer:Wed', 'Jeu:Thu', 'Ven:Fri', 'Sam:Sat', 'Dim:Sun'];
    fr.forEach((day, index) => {
      expect(`${day}:${en[index]}`).toBe(frToEn[index]);
    });
  });
});

describe('TEST 5 — a runtime FR → EN switch updates the returned labels', () => {
  it('localizedWeekDays() reflects the language at call time, never a stale module-load-time snapshot', async () => {
    expect(localizedWeekDays()[0]).toBe('Lun');
    await setAppLanguage('en');
    expect(localizedWeekDays()[0]).toBe('Mon');
    await setAppLanguage('fr');
    expect(localizedWeekDays()[0]).toBe('Lun');
  });
});

// SPANISH CALENDAR / DATE LOCALIZATION — localizedWeekDays() used to be a
// binary fr/en ternary, so Spanish silently fell through to the French
// array. Now a real 3-way mapping (fr/en/es).
describe('TEST 6 — Spanish weekday labels are correct, and distinct from French', () => {
  it('matches the Monday-first Spanish array (previously fell through to French)', async () => {
    await setAppLanguage('es');
    expect(WEEK_DAYS_ES).toEqual(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']);
    expect(localizedWeekDays()).toEqual(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']);
    expect(localizedWeekDays()).not.toEqual(WEEK_DAYS);
  });

  it('a runtime FR -> ES -> EN -> FR switch updates the returned labels each time, never a stale snapshot', async () => {
    expect(localizedWeekDays()[0]).toBe('Lun');
    expect(localizedWeekDays()[2]).toBe('Mer');
    await setAppLanguage('es');
    expect(localizedWeekDays()[0]).toBe('Lun');
    expect(localizedWeekDays()[2]).toBe('Mié');
    await setAppLanguage('en');
    expect(localizedWeekDays()[2]).toBe('Wed');
    await setAppLanguage('fr');
    expect(localizedWeekDays()[2]).toBe('Mer');
  });
});

describe('TEST 7 — calendar leading-blank math using weekday indexes is unaffected', () => {
  it('the Monday-first offset formula gives the same result regardless of the app language', async () => {
    // Same formula every calendar grid consumer already uses:
    // `(date.getDay() + 6) % 7` — 0 = Monday, independent of WEEK_DAYS entirely.
    const aThursday = new Date(2026, 8, 3); // 3 Sep 2026 is a Thursday
    const offsetBefore = (aThursday.getDay() + 6) % 7;

    await setAppLanguage('en');
    const offsetAfter = (aThursday.getDay() + 6) % 7;

    expect(offsetBefore).toBe(3); // Mon=0,Tue=1,Wed=2,Thu=3
    expect(offsetAfter).toBe(offsetBefore);
  });
});
