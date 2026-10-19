import {
  DAILY_LABEL_EDGE_SLACK,
  DAILY_LABEL_EDGE_SLACK_MAX,
  DAILY_LABEL_MIN_GAP,
  DAILY_LABEL_STEPS,
  dailyLabelWidthAt,
  isSingleWordLabel,
  planDailyRow,
  type DailyLabelItem,
} from '../dailyLabelRow';

// Widths are the real ones: the Inter Regular face the app bundles, measured at the base label style (12 sp, letter-spacing
// 0.4), plus each label's character count.
const items = (labels: Array<[string, number | 'wraps']>): DailyLabelItem[] => labels.map(([label, width]) => ({width, chars: [...label].length}));
const FR = items([['Fatigue', 44.9], ['Sommeil', 51.5], ['Humeur', 47.5], ['Douleurs', 54.0], ['Récupération', 80.2]]);
const EN = items([['Fatigue', 44.9], ['Sleep', 34.0], ['Mood', 34.2], ['Pain', 26.0], ['Recovery', 57.0]]);
const RU = items([['Усталость', 63.6], ['Сон', 24.2], ['Настроение', 74.8], ['Боль', 30.2], ['Восстановление', 102.8]]);
const ES = items([['Fatiga', 37.1], ['Sueño', 38.1], ['Estado de ánimo', 'wraps'], ['Dolores', 46.6], ['Recuperación', 83.1]]);

// Card inner width = screen - 2 x 16 (screen padding) - 2 x 15 (card padding), plus the 16 dp the row bleeds into the padding.
const ROW = (screen: number) => screen - 32 - 30 + 16;

describe('planDailyRow', () => {
  it('French: "Récupération" stays on one line in the row on a 360 dp phone, one step below the base style', () => {
    const plan = planDailyRow(ROW(360), FR);
    expect(plan.layout).toBe('row');
    // 11 sp would leave the last label 1.5 dp too close to the card's edge, so the row uses 10.5 sp
    expect(plan.step).toEqual({size: 10.5, spacing: 0});
  });

  it('French: wider phones keep the row, the base style when it fits', () => {
    expect(planDailyRow(ROW(411), FR).layout).toBe('row');
    expect(planDailyRow(ROW(600), FR)).toEqual({layout: 'row', step: DAILY_LABEL_STEPS[0]});
  });

  it('French: a 411 dp phone (Galaxy A13 class) fits 11 sp', () => {
    expect(planDailyRow(ROW(411), FR).layout).toBe('row');
    expect(planDailyRow(ROW(393), FR)).toEqual({layout: 'row', step: DAILY_LABEL_STEPS[1]});
  });

  it('French: a few percent of extra width in the measurement does not push the 360 dp row to the grid', () => {
    const wider = FR.map(item => ({...item, width: (item.width as number) * 1.03}));
    expect(planDailyRow(ROW(360), wider).layout).toBe('row');
  });

  it('French: falls back to the 3 + 2 grid on a 320 dp phone, never splitting the word', () => {
    expect(planDailyRow(ROW(320), FR).layout).toBe('grid');
    expect(planDailyRow(ROW(360), FR.map(item => ({...item, width: (item.width as number) * 1.3}))).layout).toBe('grid'); // large system font
  });

  it('English labels are short: the base style in the row, down to a very small width', () => {
    expect(planDailyRow(ROW(360), EN)).toEqual({layout: 'row', step: DAILY_LABEL_STEPS[0]});
    expect(planDailyRow(ROW(320), EN).layout).toBe('row');
  });

  it('Russian long words need the grid on a 360 dp phone', () => {
    expect(planDailyRow(ROW(360), RU).layout).toBe('grid');
  });

  it('is the row at the base style until every single-word label has been measured', () => {
    expect(planDailyRow(0, FR)).toEqual({layout: 'row', step: DAILY_LABEL_STEPS[0]});
    expect(planDailyRow(310, [{width: 44.9, chars: 7}, {width: undefined, chars: 7}, ...FR.slice(2)])).toEqual({layout: 'row', step: DAILY_LABEL_STEPS[0]});
  });

  it('a multi-word label wraps inside its cell and never forces the grid by itself', () => {
    expect(planDailyRow(ROW(411), ES).layout).toBe('row');
  });

  it('the grid uses the largest label size whose longest word fits a third of the row', () => {
    const plan = planDailyRow(ROW(360), RU);
    expect(plan.layout).toBe('grid');
    // a third of 314 dp is 104.7 dp: the 102.8 dp "Восстановление" at 12 sp leaves less than the 4 dp gap, at 11 sp it fits
    expect(plan.step).toEqual(DAILY_LABEL_STEPS[1]);
    expect(planDailyRow(ROW(411), RU).layout).toBe('grid'); // 85 dp at 10.5 sp still exceeds a 73 dp cell + the edge slack
    expect(planDailyRow(ROW(600), RU).layout).toBe('row');
  });

  it('applies the gap rule exactly (two neighbours, base style)', () => {
    const cell = 60;
    const at = (second: number) => planDailyRow(cell * 5, items([['aaaaa', 40], ['bbbbb', second], ['ccccc', 10], ['ddddd', 10], ['eeeee', 10]]), [DAILY_LABEL_STEPS[0]]);
    const widest = 2 * (cell - DAILY_LABEL_MIN_GAP) - 40;
    expect(at(widest).layout).toBe('row');
    expect(at(widest + 1).layout).toBe('grid');
  });

  it('applies the edge rule exactly: the last label may extend DAILY_LABEL_EDGE_SLACK_MAX past the row, no more', () => {
    const cell = 60;
    const at = (last: number) => planDailyRow(cell * 5, items([['aaaaa', 10], ['bbbbb', 10], ['ccccc', 10], ['ddddd', 10], ['eeeee', last]]), [DAILY_LABEL_STEPS[0]]);
    const widest = cell + 2 * DAILY_LABEL_EDGE_SLACK_MAX;
    expect(at(widest).layout).toBe('row');
    expect(at(widest + 1).layout).toBe('grid');
  });

  it('prefers the larger size when its end labels stay within the comfortable edge limit, the smaller one otherwise', () => {
    const cell = 60;
    const labels = (last: number) => items([['aaaaa', 10], ['bbbbb', 10], ['ccccc', 10], ['ddddd', 10], ['eeeee', last]]);
    const steps = [DAILY_LABEL_STEPS[0], {size: 6, spacing: 0}];
    // 64 dp = the comfortable limit (cell + 2 x DAILY_LABEL_EDGE_SLACK): the base style is kept
    expect(planDailyRow(cell * 5, labels(cell + 2 * DAILY_LABEL_EDGE_SLACK), steps).step).toEqual(steps[0]);
    // 66 dp is only allowed by the tolerant limit: a smaller size that is comfortable wins over the base style
    expect(planDailyRow(cell * 5, labels(66 + 2), steps).step).toEqual(steps[1]);
  });
});

describe('dailyLabelWidthAt', () => {
  it('is the measured width at the base style and scales the glyphs, not the letter-spacing, at a smaller one', () => {
    expect(dailyLabelWidthAt(80.2, 12, DAILY_LABEL_STEPS[0])).toBeCloseTo(80.2, 5);
    // (80.2 - 0.4 x 12) x 11 / 12 + 0 = 69.1
    expect(dailyLabelWidthAt(80.2, 12, DAILY_LABEL_STEPS[1])).toBeCloseTo(69.1, 1);
  });
});

describe('isSingleWordLabel', () => {
  it('is false only for a label that contains a space', () => {
    expect(['Récupération', 'Fatigue', '疲劳', 'Восстановление'].every(isSingleWordLabel)).toBe(true);
    expect(['Estado de ánimo', 'Suasana hati', 'Ruh hali'].some(isSingleWordLabel)).toBe(false);
  });
});
