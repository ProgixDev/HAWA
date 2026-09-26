import {
  classifyStoredCycleReturnDate,
  findLossDateConflicts,
  journalDatesWithContent,
  parseLossDateKey,
  validateCycleReturnDate,
  validateLossDateChange,
  validateLossJournalDate,
} from '../lossDateValidation';

// Pinned "now": 2026-09-26 (noon).
const NOW = new Date(2026, 8, 26, 12, 0, 0);

describe('parseLossDateKey', () => {
  it('parses a real key and rejects malformed / impossible keys', () => {
    expect(parseLossDateKey('2026-09-10')?.getDate()).toBe(10);
    expect(parseLossDateKey(null)).toBeNull();
    expect(parseLossDateKey('')).toBeNull();
    expect(parseLossDateKey('10/09/2026')).toBeNull();
    expect(parseLossDateKey('2026-02-31')).toBeNull();
  });
});

describe('M36 — validateCycleReturnDate (the ONE canonical rule)', () => {
  it('rejects a future date', () => {
    const result = validateCycleReturnDate({date: new Date(2026, 8, 27), now: NOW, lossDate: '2026-09-01'});
    expect(result).toEqual({valid: false, message: expect.stringContaining('dans le futur')});
  });

  it('rejects a date before the loss date', () => {
    const result = validateCycleReturnDate({date: new Date(2026, 8, 5), now: NOW, lossDate: '2026-09-10'});
    expect(result).toEqual({valid: false, message: expect.stringContaining('précéder')});
  });

  it('rejects an invalid Date', () => {
    expect(validateCycleReturnDate({date: new Date('nope'), now: NOW, lossDate: null})).toMatchObject({valid: false});
  });

  it('accepts today, the loss day itself and any day in between', () => {
    expect(validateCycleReturnDate({date: NOW, now: NOW, lossDate: '2026-09-10'}).valid).toBe(true);
    expect(validateCycleReturnDate({date: new Date(2026, 8, 10), now: NOW, lossDate: '2026-09-10'}).valid).toBe(true);
    expect(validateCycleReturnDate({date: new Date(2026, 8, 18), now: NOW, lossDate: '2026-09-10'}).valid).toBe(true);
  });

  it('with no known loss date only the future rule applies', () => {
    expect(validateCycleReturnDate({date: new Date(2026, 0, 1), now: NOW, lossDate: null}).valid).toBe(true);
  });
});

describe('M36 — classifyStoredCycleReturnDate (legacy-safe reading, never rewriting)', () => {
  const base = {now: NOW, lossDate: '2026-09-10'};
  it('none when the answer is not yes or no date is stored', () => {
    expect(classifyStoredCycleReturnDate({...base, cycleReturnStatus: 'no', cycleReturnDate: '2026-09-15'})).toBe('none');
    expect(classifyStoredCycleReturnDate({...base, cycleReturnStatus: 'yes', cycleReturnDate: null})).toBe('none');
  });
  it('ok / future / before_loss / invalid', () => {
    expect(classifyStoredCycleReturnDate({...base, cycleReturnStatus: 'yes', cycleReturnDate: '2026-09-15'})).toBe('ok');
    expect(classifyStoredCycleReturnDate({...base, cycleReturnStatus: 'yes', cycleReturnDate: '2026-10-20'})).toBe('future');
    expect(classifyStoredCycleReturnDate({...base, cycleReturnStatus: 'yes', cycleReturnDate: '2026-08-20'})).toBe('before_loss');
    expect(classifyStoredCycleReturnDate({...base, cycleReturnStatus: 'yes', cycleReturnDate: 'garbage'})).toBe('invalid');
  });
});

describe('M21 — validateLossJournalDate', () => {
  it('rejects a future day and a day before the loss, accepts today / the loss day / in between', () => {
    expect(validateLossJournalDate({dateKey: '2026-09-27', now: NOW, lossDate: '2026-09-10'})).toMatchObject({valid: false});
    expect(validateLossJournalDate({dateKey: '2026-09-09', now: NOW, lossDate: '2026-09-10'})).toMatchObject({valid: false});
    expect(validateLossJournalDate({dateKey: '2026-09-26', now: NOW, lossDate: '2026-09-10'}).valid).toBe(true);
    expect(validateLossJournalDate({dateKey: '2026-09-10', now: NOW, lossDate: '2026-09-10'}).valid).toBe(true);
    expect(validateLossJournalDate({dateKey: '2026-09-15', now: NOW, lossDate: '2026-09-10'}).valid).toBe(true);
    expect(validateLossJournalDate({dateKey: 'x', now: NOW, lossDate: null})).toMatchObject({valid: false});
  });
});

describe('journalDatesWithContent — the shared notion of "dated" journal data', () => {
  it('lists only days holding real content (an emptied day is not dated data)', () => {
    const dates = journalDatesWithContent({
      '2026-09-14': {physicalSymptoms: ['Fatigue']},
      '2026-09-12': {bleeding: 'Léger'},
      '2026-09-13': {physicalSymptoms: [], physicalSymptomsNote: '', personalNotes: '  '},
      '2026-09-15': {tryingAgain: 'soon'},
      'bad-key': {bleeding: 'Léger'},
    });
    expect(dates).toEqual(['2026-09-12', '2026-09-14', '2026-09-15']);
  });
});

describe('M37 — findLossDateConflicts / validateLossDateChange', () => {
  const noDependents = {cycleReturnStatus: null, cycleReturnDate: null, journalDates: []};

  it('safe edit: nothing dated before the new loss date', () => {
    const conflicts = findLossDateConflicts({
      newLossDate: new Date(2026, 8, 12),
      cycleReturnStatus: 'yes',
      cycleReturnDate: '2026-09-20',
      journalDates: ['2026-09-13', '2026-09-20'],
    });
    expect(conflicts).toEqual([]);
    expect(
      validateLossDateChange({date: new Date(2026, 8, 12), now: NOW, cycleReturnStatus: 'yes', cycleReturnDate: '2026-09-20', journalDates: ['2026-09-13']}).valid,
    ).toBe(true);
  });

  it('the same day as the cycle return / a journal day is NOT a conflict', () => {
    expect(
      findLossDateConflicts({newLossDate: new Date(2026, 8, 20), cycleReturnStatus: 'yes', cycleReturnDate: '2026-09-20', journalDates: ['2026-09-20']}),
    ).toEqual([]);
  });

  it('conflict with the recorded cycle-return date', () => {
    const conflicts = findLossDateConflicts({newLossDate: new Date(2026, 8, 22), cycleReturnStatus: 'yes', cycleReturnDate: '2026-09-20', journalDates: []});
    expect(conflicts).toEqual([{kind: 'cycle_return', date: '2026-09-20'}]);
    const result = validateLossDateChange({date: new Date(2026, 8, 22), now: NOW, cycleReturnStatus: 'yes', cycleReturnDate: '2026-09-20', journalDates: []});
    expect(result).toEqual({valid: false, message: expect.stringContaining('retour de tes règles')});
  });

  it('a stored cycle-return date under another answer is not dated data', () => {
    expect(findLossDateConflicts({newLossDate: new Date(2026, 8, 22), cycleReturnStatus: 'no', cycleReturnDate: '2026-09-20', journalDates: []})).toEqual([]);
  });

  it('conflict with existing dated journal history (names the first entry and the count)', () => {
    const conflicts = findLossDateConflicts({
      newLossDate: new Date(2026, 8, 15),
      ...noDependents,
      journalDates: ['2026-09-14', '2026-09-11', '2026-09-16'],
    });
    expect(conflicts).toEqual([{kind: 'journal', firstDate: '2026-09-11', count: 2}]);
    const result = validateLossDateChange({date: new Date(2026, 8, 15), now: NOW, ...noDependents, journalDates: ['2026-09-11', '2026-09-14']});
    expect(result).toEqual({valid: false, message: expect.stringContaining('11 septembre 2026')});
  });

  it('both conflicts are reported together', () => {
    const result = validateLossDateChange({
      date: new Date(2026, 8, 25),
      now: NOW,
      cycleReturnStatus: 'yes',
      cycleReturnDate: '2026-09-20',
      journalDates: ['2026-09-18'],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toContain('retour de tes règles');
      expect(result.message).toContain('journal');
    }
  });

  it('a future loss date is still rejected first', () => {
    expect(validateLossDateChange({date: new Date(2026, 8, 27), now: NOW, ...noDependents})).toEqual({
      valid: false,
      message: expect.stringContaining('dans le futur'),
    });
  });
});
