// "Suivi du jour" row (Postpartum home): five icons in equal cells with one short label centred under each. A label may be
// wider than its cell as long as its neighbours leave room, so a long single word ("Récupération") stays on ONE line.
// When the measured labels do not fit the row, the label size steps down a little (never below DAILY_LABEL_STEPS' last
// entry); when they still do not fit, the row falls back to a 3 + 2 grid of wider cells instead of cutting a word in two.
// Pure geometry, no React: the screen feeds it the widths it measured at the base label style.

export type DailyRowLayout = 'row' | 'grid';

/** A label text style the row may use: font size and letter-spacing, in sp. The first entry is the base style (bodySmall). */
export type DailyLabelStep = {size: number; spacing: number};

// Base: AWA's bodySmall (12 sp, letter-spacing 0.4). Then 11 sp (AWA's minimum text size) without letter-spacing, and
// 10.5 sp as the last resort before the grid: only slightly smaller, so the labels stay readable.
export const DAILY_LABEL_STEPS: readonly DailyLabelStep[] = [
  {size: 12, spacing: 0.4},
  {size: 11, spacing: 0},
  {size: 10.5, spacing: 0},
];

/** Per label: its width in dp measured at DAILY_LABEL_STEPS[0] on one line ('wraps' for a multi-word label, which wraps at
 * its spaces inside its cell and never overflows it; undefined while not measured yet) and its character count. */
export type DailyLabelItem = {width: number | 'wraps' | undefined; chars: number};

export type DailyRowPlan = {layout: DailyRowLayout; step: DailyLabelStep};

/** Minimum clear space between two neighbouring label texts, in dp. */
export const DAILY_LABEL_MIN_GAP = 4;
/** How far the first / last label text may extend beyond the row's own edge (into the card's padding), in dp: the size is
 * chosen with this comfortable limit first, then with DAILY_LABEL_EDGE_SLACK_MAX before giving up on the row. */
export const DAILY_LABEL_EDGE_SLACK = 2;
export const DAILY_LABEL_EDGE_SLACK_MAX = 4;
/** How much wider than its cell a single-word label's box is allowed to be, on each side, in dp. */
export const DAILY_LABEL_OVERFLOW = 16;

const BASE = DAILY_LABEL_STEPS[0];

/** Width of a measured label at another step: the glyphs scale with the font size, the letter-spacing is replaced. */
export const dailyLabelWidthAt = (width: number, chars: number, step: DailyLabelStep): number =>
  Math.max(width - BASE.spacing * chars, 0) * (step.size / BASE.size) + step.spacing * chars;

export function planDailyRow(
  rowWidth: number,
  items: readonly DailyLabelItem[],
  steps: readonly DailyLabelStep[] = DAILY_LABEL_STEPS,
  minGap: number = DAILY_LABEL_MIN_GAP,
  edgeSlack: number = DAILY_LABEL_EDGE_SLACK,
): DailyRowPlan {
  const count = items.length;
  // Not laid out / not measured yet: the row at the base style is the default, and it is what gets measured.
  if (count < 2 || !(rowWidth > 0) || items.some(item => item.width === undefined)) {
    return {layout: 'row', step: steps[0]};
  }

  const widthsAt = (step: DailyLabelStep, cell: number): number[] =>
    items.map(item => (item.width === 'wraps' ? Math.max(cell - 2, 0) : dailyLabelWidthAt(item.width as number, item.chars, step)));

  const rowCell = rowWidth / count;
  const rowFits = (step: DailyLabelStep, slack: number): boolean => {
    const widths = widthsAt(step, rowCell);
    // the distance between two label centres is one cell; the clear space is what is left of it between the two texts
    for (let index = 0; index < count - 1; index += 1) {
      if (rowCell - (widths[index] + widths[index + 1]) / 2 < minGap) {
        return false;
      }
    }
    const limit = rowCell / 2 + slack;
    return widths[0] / 2 <= limit && widths[count - 1] / 2 <= limit;
  };
  // Comfortable first (the largest size whose end labels stay close to the row), then the tolerant limit, then the grid.
  for (const slack of [edgeSlack, DAILY_LABEL_EDGE_SLACK_MAX]) {
    const step = steps.find(candidate => rowFits(candidate, slack));
    if (step) {
      return {layout: 'row', step};
    }
  }

  // 3 + 2 grid: every cell is a third of the row, so each single word has that much room on its own line.
  const gridCell = rowWidth / 3;
  for (const step of steps) {
    const widths = widthsAt(step, gridCell);
    if (widths.every(width => width <= gridCell - minGap)) {
      return {layout: 'grid', step};
    }
  }
  return {layout: 'grid', step: steps[steps.length - 1]};
}

/** A label that contains a space may wrap onto two lines inside its cell; any other label stays on one line. */
export const isSingleWordLabel = (label: string): boolean => !/\s/.test(label.trim());
