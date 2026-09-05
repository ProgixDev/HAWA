import type {DailyJournalEntry} from '../../types/journal';
import {
  buildExportCsv,
  buildExportReportModel,
  computeExportFilenameDates,
  escapeCsvField,
  filterEntriesByPeriod,
  formatCategoryValue,
  type ExportDayEntry,
} from '../medicalExportFormatting';

function entry(date: string, fields: Partial<DailyJournalEntry> = {}): DailyJournalEntry {
  return {id: date, date, ...fields};
}

describe('filterEntriesByPeriod', () => {
  const now = new Date('2026-08-25T12:00:00');
  const entries = [entry('2026-01-01'), entry('2026-06-01'), entry('2026-08-20')];

  it('keeps every entry for "all"', () => {
    expect(filterEntriesByPeriod(entries, 'all', now)).toHaveLength(3);
  });

  it('keeps only entries within the last 3 months for "3m"', () => {
    const result = filterEntriesByPeriod(entries, '3m', now);
    expect(result.map(e => e.date)).toEqual(['2026-06-01', '2026-08-20']);
  });

  it('keeps only entries within the last 12 months for "12m"', () => {
    const result = filterEntriesByPeriod(entries, '12m', now);
    expect(result.map(e => e.date)).toEqual(['2026-01-01', '2026-06-01', '2026-08-20']);
  });
});

describe('escapeCsvField', () => {
  it('leaves plain values untouched', () => {
    expect(escapeCsvField('Fatigue')).toBe('Fatigue');
  });

  it('quotes and doubles internal quotes', () => {
    expect(escapeCsvField('Elle a dit "ça va"')).toBe('"Elle a dit ""ça va"""');
  });

  it('quotes values containing a comma', () => {
    expect(escapeCsvField('Fatigue, nausée')).toBe('"Fatigue, nausée"');
  });

  it('quotes values containing a semicolon', () => {
    expect(escapeCsvField('Fatigue; nausée')).toBe('"Fatigue; nausée"');
  });

  it('quotes multiline values without corrupting the line break', () => {
    expect(escapeCsvField('Ligne 1\nLigne 2')).toBe('"Ligne 1\nLigne 2"');
  });

  it('preserves French accents', () => {
    expect(escapeCsvField('Réveillée fatiguée, énervée')).toBe('"Réveillée fatiguée, énervée"');
  });
});

describe('buildExportCsv', () => {
  it('produces a header row plus one row per non-empty category', () => {
    const days: ExportDayEntry[] = [
      {
        date: '2026-08-24',
        categories: [
          {category: 'symptoms', label: 'Symptômes', lines: ['Symptômes : Fatigue, Nausée']},
          {category: 'weight', label: 'Poids', lines: []},
        ],
      },
    ];
    const csv = buildExportCsv(days);
    const rows = csv.split('\r\n');
    expect(rows[0]).toBe('date;categorie;valeur');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toBe('2026-08-24;Symptômes;"Symptômes : Fatigue, Nausée"');
  });

  it('never emits a row for a category with no recorded value', () => {
    const days: ExportDayEntry[] = [{date: '2026-08-24', categories: [{category: 'weight', label: 'Poids', lines: []}]}];
    const csv = buildExportCsv(days);
    expect(csv.split('\r\n')).toHaveLength(1);
  });

  it('produces valid, correctly escaped rows for multiline notes with French accents', () => {
    const days: ExportDayEntry[] = [
      {
        date: '2026-08-24',
        categories: [{category: 'notes', label: 'Notes privées', lines: ['Journée éprouvante,\nbeaucoup de fatigue.']}],
      },
    ];
    const csv = buildExportCsv(days);
    expect(csv).toContain('"Journée éprouvante,\nbeaucoup de fatigue."');
  });

  it('uses ";" as the delimiter consistently (French-locale Excel default), never ","', () => {
    const days: ExportDayEntry[] = [
      {date: '2026-08-24', categories: [{category: 'mood', label: 'Humeur', lines: ['Modérée']}]},
    ];
    const csv = buildExportCsv(days);
    const rows = csv.split('\r\n');
    expect(rows[0].split(';')).toEqual(['date', 'categorie', 'valeur']);
    expect(rows[1]).toBe('2026-08-24;Humeur;Modérée');
  });

  it('leaves every French accented string exactly intact, not mojibake-corrupted', () => {
    const accentedValues = ['Symptômes', 'Durée', 'Qualité', 'Réveil', 'Énergie', 'Irritabilité', 'Activité', 'Modérée'];
    const days: ExportDayEntry[] = accentedValues.map((value, index) => ({
      date: `2026-08-${10 + index}`,
      categories: [{category: 'mood', label: value, lines: [value]}],
    }));
    const csv = buildExportCsv(days);
    accentedValues.forEach(value => {
      expect(csv).toContain(value);
      expect(csv).not.toContain('Ã');
    });
  });

  it('correctly escapes a value containing the new ";" delimiter itself', () => {
    const days: ExportDayEntry[] = [
      {
        date: '2026-08-24',
        categories: [{category: 'symptoms', label: 'Symptômes', lines: ['Fatigue', 'Nausée']}],
      },
    ];
    const csv = buildExportCsv(days);
    // Multiple lines for one category are joined with " ; " inside the
    // "valeur" field — since that now matches the CSV's own delimiter, the
    // whole field must come back quoted.
    expect(csv).toContain('"Fatigue ; Nausée"');
  });
});

describe('formatCategoryValue', () => {
  it('returns an empty array when the day has nothing recorded for the category', () => {
    expect(formatCategoryValue('mood', entry('2026-08-24'))).toEqual([]);
  });

  it('formats mood with a human-readable French label, not the raw enum key', () => {
    const lines = formatCategoryValue(
      'mood',
      entry('2026-08-24', {mood: {level: 'veryGood', energy: 4, stress: 1, irritability: 1, motivation: 5}}),
    );
    expect(lines[0]).toBe('Humeur : Très bien');
  });

  it('formats flow intensity with a human-readable French label', () => {
    const lines = formatCategoryValue('flow', entry('2026-08-24', {flow: {intensity: 'heavy'}}));
    expect(lines[0]).toBe('Flux : Abondant');
  });

  it('formats symptoms as a readable list, never a raw JSON dump', () => {
    const lines = formatCategoryValue('symptoms', entry('2026-08-24', {symptoms: {names: ['Fatigue', 'Nausée']}}));
    expect(lines[0]).toBe('Symptômes : Fatigue, Nausée');
    expect(lines.join(' ')).not.toContain('{');
  });

  it('formats cycle day directly from cycleDay, not a JSON-stringified object', () => {
    expect(formatCategoryValue('cycle', entry('2026-08-24', {cycleDay: 12}))).toEqual(['Jour du cycle : 12']);
  });
});

describe('computeExportFilenameDates', () => {
  const now = new Date('2026-08-25T12:00:00');

  it('uses the real cutoff date for a fixed lookback period', () => {
    const {fromKey, toKey} = computeExportFilenameDates([], '3m', now);
    expect(toKey).toBe('2026-08-25');
    expect(fromKey).toBe('2026-05-25');
  });

  it('uses the earliest real entry date for "all"', () => {
    const entries = [entry('2026-01-05'), entry('2026-03-01')];
    const {fromKey, toKey} = computeExportFilenameDates(entries, 'all', now);
    expect(fromKey).toBe('2026-01-05');
    expect(toKey).toBe('2026-08-25');
  });
});

describe('buildExportReportModel', () => {
  it('keeps days in chronological order and includes only selected categories with real data', () => {
    const days: ExportDayEntry[] = [
      {date: '2026-08-25', categories: [{category: 'mood', label: 'Humeur', lines: ['Humeur : Bien']}]},
      {date: '2026-08-24', categories: [{category: 'mood', label: 'Humeur', lines: ['Humeur : Triste']}]},
    ];
    const model = buildExportReportModel(days, 'Suivi du cycle', 'Tout l’historique', '25 août 2026');
    expect(model.days.map(d => d.date)).toEqual(['2026-08-25', '2026-08-24']);
  });

  it('drops days where every selected category is empty, and reports the real period label', () => {
    const days: ExportDayEntry[] = [{date: '2026-08-24', categories: [{category: 'weight', label: 'Poids', lines: []}]}];
    const model = buildExportReportModel(days, 'Suivi du cycle', '3 derniers mois', '25 août 2026');
    expect(model.days).toHaveLength(0);
    expect(model.totalDays).toBe(0);
    expect(model.periodLabel).toBe('3 derniers mois');
  });

  it('never invents a diagnosis, score, or normal/abnormal judgment', () => {
    const days: ExportDayEntry[] = [
      {date: '2026-08-24', categories: [{category: 'symptoms', label: 'Symptômes', lines: ['Symptômes : Fatigue']}]},
    ];
    const model = buildExportReportModel(days, 'Suivi du cycle', 'Tout l’historique', '25 août 2026');
    const serialized = JSON.stringify(model).toLowerCase();
    ['diagnostic', 'anormal', 'normal', 'risque', 'recommand'].forEach(forbiddenWord => {
      expect(serialized).not.toContain(forbiddenWord);
    });
  });
});
