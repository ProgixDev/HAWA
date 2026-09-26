import {hijriPartsFor, isRamadan} from '../hijriCalendar';
import {
  buildQadaaRamadanYearOptions,
  classifyQadaaYear,
  formatQadaaSubmitLabel,
  parseQadaaQuantityText,
  stepQadaaQuantityText,
  formatQadaaCompletionSummary,
  formatQadaaCompletionTitle,
  formatQadaaManualSummary,
  formatQadaaManualTitle,
  validateQadaaManualForm,
  type QadaaManualFormValues,
} from '../qadaaManualEntryForm';

const NOW = new Date(2026, 8, 26, 12, 0, 0);
const form = (overrides: Partial<QadaaManualFormValues> = {}): QadaaManualFormValues => ({
  quantityText: '2',
  knowsYear: false,
  yearText: '',
  note: '',
  ...overrides,
});

describe('validateQadaaManualForm', () => {
  it('accepts a positive integer with no year ("Ancien solde")', () => {
    expect(validateQadaaManualForm(form({quantityText: '7'}), NOW)).toEqual({
      ok: true,
      value: {quantity: 7, year: null, yearSystem: null, note: null},
    });
  });

  it.each(['', '   ', '0', '00', '-3', '2.5', '2,5', 'abc', '1e3', '0x10', '١٢', '12345', '+2', ' 2 3'])(
    'rejects the quantity %p',
    quantityText => {
      const result = validateQadaaManualForm(form({quantityText}), NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) {expect(result.field).toBe('quantity');}
    },
  );

  it('trims surrounding spaces of a valid quantity', () => {
    const result = validateQadaaManualForm(form({quantityText: '  5 '}), NOW);
    expect(result.ok && result.value.quantity).toBe(5);
  });

  it('rejects an unreasonable quantity above 999', () => {
    expect(validateQadaaManualForm(form({quantityText: '1000'}), NOW).ok).toBe(false);
    expect(validateQadaaManualForm(form({quantityText: '999'}), NOW).ok).toBe(true);
  });

  describe('I. unknown year: accepted without any fake date', () => {
    it('stores no year at all, even if a stale year text is still in the field', () => {
      const result = validateQadaaManualForm(form({quantityText: '5', knowsYear: false, yearText: '2018'}), NOW);
      expect(result).toEqual({ok: true, value: {quantity: 5, year: null, yearSystem: null, note: null}});
    });
  });

  describe('H. old historical entries (no 30-day limit, no cycle data needed)', () => {
    it('accepts a Ramadan 10 years ago (Gregorian) and a Hijri year from long ago', () => {
      const gregorian = validateQadaaManualForm(form({quantityText: '4', knowsYear: true, yearText: '2016'}), NOW);
      expect(gregorian).toEqual({ok: true, value: {quantity: 4, year: 2016, yearSystem: 'gregorian', note: null}});
      const hijri = validateQadaaManualForm(form({quantityText: '4', knowsYear: true, yearText: '1437'}), NOW);
      expect(hijri).toEqual({ok: true, value: {quantity: 4, year: 1437, yearSystem: 'hijri', note: null}});
    });

    it('accepts very old years and the current ones', () => {
      expect(validateQadaaManualForm(form({knowsYear: true, yearText: '1990'}), NOW).ok).toBe(true);
      expect(validateQadaaManualForm(form({knowsYear: true, yearText: '2026'}), NOW).ok).toBe(true);
    });
  });

  it.each(['', '20', '202', '20180', 'abcd', '1800', '1299', '2200', '3000'])('rejects the year %p when a precise year is chosen', yearText => {
    const result = validateQadaaManualForm(form({knowsYear: true, yearText}), NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) {expect(result.field).toBe('year');}
  });

  it('keeps an optional note, trimmed and bounded', () => {
    const result = validateQadaaManualForm(form({note: `  ${'x'.repeat(200)}  `}), NOW);
    expect(result.ok && result.value.note).toBe('x'.repeat(80));
    expect(validateQadaaManualForm(form({note: '   '}), NOW)).toMatchObject({ok: true, value: {note: null}});
  });
});

describe('classifyQadaaYear', () => {
  it('tells Hijri and Gregorian years apart and rejects the rest', () => {
    expect(classifyQadaaYear(1445, NOW)).toBe('hijri');
    expect(classifyQadaaYear(2018, NOW)).toBe('gregorian');
    expect(classifyQadaaYear(1700, NOW)).toBeNull();
    expect(classifyQadaaYear(2500, NOW)).toBeNull();
    expect(classifyQadaaYear(2018.5, NOW)).toBeNull();
  });
});

describe('friendly French labels (no technical wording)', () => {
  const base = {createdAt: '', updatedAt: ''};
  it('titles', () => {
    expect(formatQadaaManualTitle({year: 1445, yearSystem: 'hijri'})).toBe('Ramadan 1445 AH');
    expect(formatQadaaManualTitle({year: 2018, yearSystem: 'gregorian'})).toBe('Ramadan 2018');
    expect(formatQadaaManualTitle({year: null, yearSystem: null})).toBe('Ancien solde');
  });

  it('summaries', () => {
    expect(formatQadaaManualSummary({quantity: 1, ...base})).toBe('1 jour ajouté manuellement');
    expect(formatQadaaManualSummary({quantity: 2, ...base})).toBe('2 jours ajoutés manuellement');
    expect(formatQadaaCompletionSummary({quantity: 1, origin: 'USER'})).toBe('1 jour rattrapé');
    expect(formatQadaaCompletionSummary({quantity: 3, origin: 'MIGRATED'})).toBe('3 jours rattrapés (suivi précédent)');
  });

  it('a completion is titled by its LOCAL day, whatever the UTC instant is', () => {
    // 00:30 local on 26 Sep: the UTC instant may still be the 25th.
    const at = new Date(2026, 8, 26, 0, 30, 0);
    expect(formatQadaaCompletionTitle({completedOn: at.toLocaleDateString('en-CA'), completedAt: at.toISOString()})).toBe('26 septembre 2026');
  });

  it('never exposes storage vocabulary', () => {
    const labels = [
      formatQadaaManualTitle({year: null, yearSystem: null}),
      formatQadaaManualSummary({quantity: 2, ...base}),
      formatQadaaCompletionSummary({quantity: 1, origin: 'MIGRATED'}),
    ].join(' ');
    expect(labels).not.toMatch(/AUTO_PERIOD|MANUAL|database|store|record|origin/i);
  });
});

describe('stepQadaaQuantityText / parseQadaaQuantityText / formatQadaaSubmitLabel', () => {
  it('steps by one, never below 1 and never above 999', () => {
    expect(stepQadaaQuantityText('1', 1)).toBe('2');
    expect(stepQadaaQuantityText('7', -1)).toBe('6');
    expect(stepQadaaQuantityText('1', -1)).toBe('1');
    expect(stepQadaaQuantityText('999', 1)).toBe('999');
  });

  it('an empty / invalid text restarts at 1 instead of producing NaN', () => {
    for (const bad of ['', '  ', 'abc', '-2', '2.5', '0']) {
      expect(stepQadaaQuantityText(bad, 1)).toBe('1');
      expect(stepQadaaQuantityText(bad, -1)).toBe('1');
    }
  });

  it('parses only a 1–999 integer', () => {
    expect(parseQadaaQuantityText(' 12 ')).toBe(12);
    for (const bad of ['', '0', '1000', '-1', '2.5', 'x', '1e2']) {expect(parseQadaaQuantityText(bad)).toBeNull();}
  });

  it('the CTA has the right singular / plural and a generic fallback', () => {
    expect(formatQadaaSubmitLabel('1', false)).toBe('Ajouter 1 jour à rattraper');
    expect(formatQadaaSubmitLabel('2', false)).toBe('Ajouter 2 jours à rattraper');
    expect(formatQadaaSubmitLabel('7', false)).toBe('Ajouter 7 jours à rattraper');
    expect(formatQadaaSubmitLabel('', false)).toBe('Ajouter des jours à rattraper');
    expect(formatQadaaSubmitLabel('0', false)).toBe('Ajouter des jours à rattraper');
    expect(formatQadaaSubmitLabel('5', true)).toBe('Enregistrer les modifications');
  });
});

describe('buildQadaaRamadanYearOptions — Gregorian + Hijri mapping from AWA’s own Hijri utilities', () => {
  const today = new Date(2026, 8, 26, 12, 0, 0);
  const options = buildQadaaRamadanYearOptions(today);

  it('lists 50 Ramadans, most recent first, one per Hijri year with no gap', () => {
    expect(options).toHaveLength(50);
    options.forEach((option, index) => {
      if (index > 0) {expect(option.year).toBe(options[index - 1].year - 1);}
      expect(option.yearSystem).toBe('hijri');
    });
  });

  it('the most recent one is the last Ramadan that has begun (Ramadan 1447, in 2026, as of 26 Sep 2026)', () => {
    expect(options[0].year).toBe(1447);
    expect(options[0].gregorianYear).toBe(2026);
    expect(options[0].label).toBe('2026 (1447 AH)');
  });

  it('every option is a real Ramadan: the first day of a 29–30 day run of month-9 days, in the labelled Hijri and Gregorian year', () => {
    options.forEach(option => {
      const start = option.ramadanStart!;
      const dayBefore = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
      expect(isRamadan(start)).toBe(true);
      expect(isRamadan(dayBefore)).toBe(false);
      expect(hijriPartsFor(start).month).toBe(9);
      expect(hijriPartsFor(start).year).toBe(option.year);
      expect(start.getFullYear()).toBe(option.gregorianYear);
      expect(option.label).toBe(`${option.gregorianYear} (${option.year} AH)`);
      let length = 0;
      while (isRamadan(new Date(start.getFullYear(), start.getMonth(), start.getDate() + length))) {length += 1;}
      expect(length).toBeGreaterThanOrEqual(28);
      expect(length).toBeLessThanOrEqual(30);
    });
  });

  it('consecutive Ramadans are 353–356 days apart (no skipped or doubled year, even where ICU skips a day-1 at local midnight)', () => {
    for (let index = 1; index < options.length; index += 1) {
      const gap = Math.round((options[index - 1].ramadanStart!.getTime() - options[index].ramadanStart!.getTime()) / 86_400_000);
      expect(gap).toBeGreaterThanOrEqual(353);
      expect(gap).toBeLessThanOrEqual(356);
    }
  });

  it('goes far enough back for historical Qadaa (10+ years and 40+ years)', () => {
    expect(options.some(option => option.gregorianYear === 2016)).toBe(true);
    expect(options[options.length - 1].gregorianYear!).toBeLessThanOrEqual(1980);
  });

  it('while Ramadan is running it is included; before it starts it is not', () => {
    const duringRamadan1447 = new Date(options[0].ramadanStart!.getFullYear(), options[0].ramadanStart!.getMonth(), options[0].ramadanStart!.getDate() + 3);
    expect(buildQadaaRamadanYearOptions(duringRamadan1447)[0].year).toBe(1447);
    const dayBefore = new Date(options[0].ramadanStart!.getFullYear(), options[0].ramadanStart!.getMonth(), options[0].ramadanStart!.getDate() - 1);
    expect(buildQadaaRamadanYearOptions(dayBefore)[0].year).toBe(1446);
  });

  it('keeps an existing entry’s own year selectable when it is not in the list, without rewriting it', () => {
    const withLegacy = buildQadaaRamadanYearOptions(today, {year: 2016, yearSystem: 'gregorian'});
    expect(withLegacy[0]).toMatchObject({year: 2016, yearSystem: 'gregorian', label: '2016', gregorianYear: null});
    expect(withLegacy).toHaveLength(51);
    // A year already in the list is not duplicated.
    expect(buildQadaaRamadanYearOptions(today, {year: 1440, yearSystem: 'hijri'})).toHaveLength(50);
  });
});
